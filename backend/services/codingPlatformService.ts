import axios from 'axios'
import User from '../models/user'
import CodingProfile from '../models/codingProfile'

interface LeetCodeStats {
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  ranking: number
  contestRating?: number
}

interface CodeforcesStats {
  rating: number
  maxRating: number
  rank: string
  contestsCount?: number
}

interface CodeChefStats {
  rating: number
  stars?: number
  globalRank?: number
}

interface GeeksforGeeksStats {
  totalSolved?: number
  codingScore?: number
  instituteRank?: number
}

interface AtCoderStats {
  rating?: number
  maxRating?: number
  rank?: string
}

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
}

const stripTags = (value: string): string =>
  value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

const firstMatchInt = (
  html: string,
  patterns: RegExp[],
): number | undefined => {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const num = parseInt(match[1].replace(/[^0-9]/g, ''), 10)
      if (!Number.isNaN(num)) return num
    }
  }
  return undefined
}

export class CodingPlatformService {
  /**
   * Fetch stats from LeetCode
   */
  async getLeetCodeStats(username: string): Promise<LeetCodeStats | null> {
    try {
      const query = `
        query userPublicProfile($username: String!) {
          matchedUser(username: $username) {
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
            profile {
              ranking
              reputation
            }
          }
          userContestRanking(username: $username) {
             rating
          }
        }
      `

      const response = await axios.post(
        'https://leetcode.com/graphql',
        {
          query,
          variables: { username },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        },
      )

      if (response.data.errors) {
        console.error('LeetCode API errors:', response.data.errors)
        return null
      }

      const data = response.data.data
      if (!data.matchedUser) return null

      const submitStats = data.matchedUser.submitStats.acSubmissionNum
      const total =
        submitStats.find((s: any) => s.difficulty === 'All')?.count || 0
      const easy =
        submitStats.find((s: any) => s.difficulty === 'Easy')?.count || 0
      const medium =
        submitStats.find((s: any) => s.difficulty === 'Medium')?.count || 0
      const hard =
        submitStats.find((s: any) => s.difficulty === 'Hard')?.count || 0

      return {
        totalSolved: total,
        easySolved: easy,
        mediumSolved: medium,
        hardSolved: hard,
        ranking: data.matchedUser.profile?.ranking || 0,
        contestRating: Math.round(data.userContestRanking?.rating || 0),
      }
    } catch (error) {
      console.error('Error fetching LeetCode stats:', error)
      return null
    }
  }

  /**
   * Fetch stats from Codeforces
   */
  async getCodeforcesStats(handle: string): Promise<CodeforcesStats | null> {
    try {
      const response = await axios.get(
        `https://codeforces.com/api/user.info?handles=${handle}`,
      )

      if (response.data.status !== 'OK' || !response.data.result.length) {
        return null
      }

      const user = response.data.result[0]
      return {
        rating: user.rating || 0,
        maxRating: user.maxRating || 0,
        rank: user.rank || 'unrated',
        contestsCount: 0, // API doesn't give contest count directly without more queries
      }
    } catch (error) {
      console.error('Error fetching Codeforces stats:', error)
      return null
    }
  }

  /**
   * Fetch stats from CodeChef (best-effort HTML parsing)
   */
  async getCodeChefStats(username: string): Promise<CodeChefStats | null> {
    try {
      const response = await axios.get(
        `https://www.codechef.com/users/${encodeURIComponent(username)}`,
        {
          headers: DEFAULT_HEADERS,
          timeout: 12000,
          validateStatus: (s) => (s ?? 0) >= 200 && (s ?? 0) < 500,
        },
      )

      if (response.status >= 400 || typeof response.data !== 'string')
        return null

      const html = response.data as string

      const rating = firstMatchInt(html, [
        /rating-number[^>]*>\s*([0-9]{2,5})\s*</i,
        /Current Rating<\/[^>]+>\s*<[^>]+>\s*([0-9]{2,5})\s*</i,
      ])

      if (rating === undefined) return null

      const starsRawMatch = html.match(/rating-star[^>]*>\s*([^<]{1,20})\s*</i)
      const stars = starsRawMatch
        ? (starsRawMatch[1].match(/★/g) || []).length
        : undefined

      const globalRank = firstMatchInt(html, [
        /Global Rank<\/small>\s*<strong>\s*([0-9,]+)\s*<\/strong>/i,
        /Global Rank[\s\S]{0,120}?([0-9,]{1,15})/i,
      ])

      return {
        rating,
        stars: stars && stars > 0 ? stars : undefined,
        globalRank,
      }
    } catch (error) {
      console.error('Error fetching CodeChef stats:', error)
      return null
    }
  }

  /**
   * Fetch stats from AtCoder (best-effort HTML parsing)
   */
  async getAtCoderStats(username: string): Promise<AtCoderStats | null> {
    try {
      const response = await axios.get(
        `https://atcoder.jp/users/${encodeURIComponent(username)}?lang=en`,
        {
          headers: DEFAULT_HEADERS,
          timeout: 12000,
          validateStatus: (s) => (s ?? 0) >= 200 && (s ?? 0) < 500,
        },
      )

      if (response.status >= 400 || typeof response.data !== 'string')
        return null

      const html = response.data as string

      const rating = firstMatchInt(html, [
        /Rating<\/th>\s*<td[^>]*>\s*(?:<[^>]+>\s*)*([0-9]{1,6})/i,
      ])
      const maxRating = firstMatchInt(html, [
        /Highest Rating<\/th>\s*<td[^>]*>\s*(?:<[^>]+>\s*)*([0-9]{1,6})/i,
      ])

      const rankMatch = html.match(/Rank<\/th>\s*<td[^>]*>[\s\S]*?<\/td>/i)
      const rank = rankMatch
        ? stripTags(rankMatch[0])
            .replace(/^Rank\s*/i, '')
            .trim()
        : undefined

      if (rating === undefined && maxRating === undefined && !rank) return null

      return { rating, maxRating, rank }
    } catch (error) {
      console.error('Error fetching AtCoder stats:', error)
      return null
    }
  }

  /**
   * Fetch stats from GeeksforGeeks (best-effort HTML parsing)
   */
  async getGeeksforGeeksStats(
    username: string,
  ): Promise<GeeksforGeeksStats | null> {
    try {
      const response = await axios.get(
        `https://auth.geeksforgeeks.org/user/${encodeURIComponent(username)}/`,
        {
          headers: DEFAULT_HEADERS,
          timeout: 12000,
          validateStatus: (s) => (s ?? 0) >= 200 && (s ?? 0) < 500,
        },
      )

      if (response.status >= 400 || typeof response.data !== 'string')
        return null

      const html = response.data as string

      const totalSolved = firstMatchInt(html, [
        /Problems\s*Solved[\s\S]{0,120}?([0-9]{1,6})/i,
        /Solved\s*Problems[\s\S]{0,120}?([0-9]{1,6})/i,
      ])
      const codingScore = firstMatchInt(html, [
        /Coding\s*Score[\s\S]{0,120}?([0-9]{1,8})/i,
      ])
      const instituteRank = firstMatchInt(html, [
        /Institute\s*Rank[\s\S]{0,120}?([0-9]{1,8})/i,
      ])

      if (
        totalSolved === undefined &&
        codingScore === undefined &&
        instituteRank === undefined
      ) {
        return null
      }

      return { totalSolved, codingScore, instituteRank }
    } catch (error) {
      console.error('Error fetching GeeksforGeeks stats:', error)
      return null
    }
  }

  /**
   * Sync all connected profiles for a user
   */
  async syncUserStats(userId: string): Promise<any> {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const handles = user.platformHandles || {}

    // Find or create coding profile
    let codingProfile = await CodingProfile.findOne({ user: userId })
    if (!codingProfile) {
      codingProfile = new CodingProfile({ user: userId })
    }

    const updates: any = {
      platforms: codingProfile.platforms || {},
    }

    // 1. Sync LeetCode
    if (handles.leetcode) {
      const lcStats = await this.getLeetCodeStats(handles.leetcode)
      if (lcStats) {
        updates.platforms.leetcode = {
          username: handles.leetcode,
          ...lcStats,
          lastFetched: new Date(),
          fetchError: undefined,
        }
      } else {
        updates.platforms.leetcode = {
          username: handles.leetcode,
          lastFetched: new Date(),
          fetchError: 'Failed to fetch LeetCode stats',
        }
      }
    }

    // 2. Sync Codeforces
    if (handles.codeforces) {
      const cfStats = await this.getCodeforcesStats(handles.codeforces)
      if (cfStats) {
        updates.platforms.codeforces = {
          handle: handles.codeforces,
          ...cfStats,
          lastFetched: new Date(),
          fetchError: undefined,
        }
      } else {
        updates.platforms.codeforces = {
          handle: handles.codeforces,
          lastFetched: new Date(),
          fetchError: 'Failed to fetch Codeforces stats',
        }
      }
    }

    // 3. Sync CodeChef
    if (handles.codechef) {
      const ccStats = await this.getCodeChefStats(handles.codechef)
      if (ccStats) {
        updates.platforms.codechef = {
          username: handles.codechef,
          ...ccStats,
          lastFetched: new Date(),
          fetchError: undefined,
        }
      } else {
        updates.platforms.codechef = {
          username: handles.codechef,
          lastFetched: new Date(),
          fetchError: 'Failed to fetch CodeChef stats',
        }
      }
    }

    // 4. Sync GeeksforGeeks
    if (handles.geeksforgeeks) {
      const gfgStats = await this.getGeeksforGeeksStats(handles.geeksforgeeks)
      if (gfgStats) {
        updates.platforms.geeksforgeeks = {
          username: handles.geeksforgeeks,
          ...gfgStats,
          lastFetched: new Date(),
          fetchError: undefined,
        }
      } else {
        updates.platforms.geeksforgeeks = {
          username: handles.geeksforgeeks,
          lastFetched: new Date(),
          fetchError: 'Failed to fetch GeeksforGeeks stats',
        }
      }
    }

    // 5. Sync AtCoder
    if (handles.atcoder) {
      const acStats = await this.getAtCoderStats(handles.atcoder)
      if (acStats) {
        updates.platforms.atcoder = {
          username: handles.atcoder,
          ...acStats,
          lastFetched: new Date(),
          fetchError: undefined,
        }
      } else {
        updates.platforms.atcoder = {
          username: handles.atcoder,
          lastFetched: new Date(),
          fetchError: 'Failed to fetch AtCoder stats',
        }
      }
    }

    // 6. Hackerrank (not implemented yet - keep connection visible)
    if (handles.hackerrank) {
      updates.platforms.hackerrank = {
        username: handles.hackerrank,
        lastFetched: new Date(),
        fetchError: 'Sync not implemented yet',
      }
    }

    // Update aggregated stats (best-effort sum for now)
    const lcTotal = updates.platforms.leetcode?.totalSolved || 0
    const gfgTotal = updates.platforms.geeksforgeeks?.totalSolved || 0

    updates.aggregatedStats = {
      totalProblemsSolved: lcTotal + gfgTotal,
      strongestTopics: [],
      weakestTopics: [],
    }

    updates.lastFullSync = new Date()

    // Save
    codingProfile.set(updates)
    await codingProfile.save()

    return codingProfile
  }
}

export const codingPlatformService = new CodingPlatformService()
