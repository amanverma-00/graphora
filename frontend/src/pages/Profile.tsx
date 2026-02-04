import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Edit2,
  TrendingUp,
  ExternalLink,
  CheckCircle,
  Target,
  Zap,
  Trophy,
  Lock,
  X,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { submissionService, authService } from '../services/api'
import { cn } from '../lib/utils'
import Button from '../components/ui/Button'

// External coding platforms
const PLATFORMS = [
  { id: 'leetcode', name: 'LeetCode', color: '#FFA116', icon: '🟠' },
  { id: 'codeforces', name: 'Codeforces', color: '#1F8ACB', icon: '🔵' },
  { id: 'codechef', name: 'CodeChef', color: '#5B4638', icon: '👨‍🍳' },
  { id: 'hackerrank', name: 'HackerRank', color: '#00EA64', icon: '💚' },
  { id: 'geeksforgeeks', name: 'GeeksforGeeks', color: '#2F8D46', icon: '🟢' },
  { id: 'atcoder', name: 'AtCoder', color: '#222222', icon: '⚫' },
]

// Types no longer needed for hardcoded data - will come from API

interface SubmissionDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

interface UserStats {
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  easyTotal: number
  mediumTotal: number
  hardTotal: number
  acceptanceRate: number
  totalSubmissions: number
  ranking: number
  contestRating: number
  external?: {
    leetcode?: {
      username?: string
      totalSolved: number
      easySolved: number
      mediumSolved: number
      hardSolved: number
      contestRating?: number
      ranking?: number
      lastFetched?: string
      fetchError?: string
    }
    codeforces?: {
      handle?: string
      rating?: number
      maxRating?: number
      rank?: string
      contestsCount?: number
      lastFetched?: string
      fetchError?: string
    }
    codechef?: {
      username?: string
      rating?: number
      stars?: number
      globalRank?: number
      lastFetched?: string
      fetchError?: string
    }
    hackerrank?: {
      username?: string
      badges?: string[]
      certificates?: { name: string; url: string }[]
      lastFetched?: string
      fetchError?: string
    }
    geeksforgeeks?: {
      username?: string
      totalSolved?: number
      codingScore?: number
      instituteRank?: number
      lastFetched?: string
      fetchError?: string
    }
    atcoder?: {
      username?: string
      rating?: number
      maxRating?: number
      rank?: string
      lastFetched?: string
      fetchError?: string
    }
  }
  aggregated?: {
    totalProblemsSolved?: number
  }

  externalMeta?: {
    lastFullSync?: string
    updatedAt?: string
  } | null
}

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bio, setBio] = useState(user?.bio || 'No bio added yet.')

  // Platform connection state
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<{
    id: string
    name: string
  } | null>(null)
  const [platformUsername, setPlatformUsername] = useState('')

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: async () => {
      await refreshUser()
      setIsPlatformModalOpen(false)
      setPlatformUsername('')
      setSelectedPlatform(null)
    },
  })

  const handleConnectPlatform = (platform: { id: string; name: string }) => {
    setSelectedPlatform(platform)
    // Pre-fill if already exists
    const currentHandle =
      user?.platformHandles?.[platform.id as keyof typeof user.platformHandles]
    setPlatformUsername(currentHandle || '')
    setIsPlatformModalOpen(true)
  }

  const handleSavePlatform = () => {
    if (!selectedPlatform) return

    updateProfileMutation.mutate({
      platformHandles: {
        [selectedPlatform.id]: platformUsername,
      },
    })
  }

  const syncProfileMutation = useMutation({
    mutationFn: authService.syncProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStats'] })
      // Ensure UI stays in sync with updated external profile
      refreshUser().catch(() => undefined)
    },
  })

  const handleSyncProfile = () => {
    syncProfileMutation.mutate()
  }

  // Fetch user stats from backend
  const { data: statsData } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const response = await authService.getUserStats()
      return response.data?.data ?? response.data
    },
  })

  // Fetch recent submissions for activity heatmap
  const { data: submissions } = useQuery({
    queryKey: ['recentSubmissions'],
    queryFn: async () => {
      const response = await submissionService.getRecentSubmissions({
        limit: 365,
      })
      return response.data?.data ?? response.data
    },
  })

  // Fetch skills data
  const { data: skillsData, isLoading: skillsLoading } = useQuery({
    queryKey: ['userSkills'],
    queryFn: async () => {
      const response = await authService.getSkillAnalysis()
      return response.data?.data ?? response.data
    },
  })

  // Fetch achievements data
  const { data: achievementsData, isLoading: achievementsLoading } = useQuery({
    queryKey: ['userAchievements'],
    queryFn: async () => {
      const response = await authService.getAchievements()
      return response.data?.data ?? response.data
    },
  })

  // Use fetched data or fallback to defaults
  const stats: UserStats = statsData || {
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    easyTotal: 0,
    mediumTotal: 0,
    hardTotal: 0,
    acceptanceRate: 0,
    totalSubmissions: 0,
    ranking: 0,
    contestRating: 0,
  }

  // Merge external stats if available (Prioritize LeetCode for now as main display)
  const displayTotalSolved =
    stats.aggregated?.totalProblemsSolved || stats.totalSolved
  const displayContestRating =
    stats.external?.leetcode?.contestRating ||
    stats.external?.codeforces?.rating ||
    stats.contestRating
  const displayRanking = stats.external?.leetcode?.ranking || stats.ranking

  const getPlatformUrl = (platformId: string, handle?: string) => {
    if (!handle) return undefined
    switch (platformId) {
      case 'leetcode':
        return `https://leetcode.com/${handle}/`
      case 'codeforces':
        return `https://codeforces.com/profile/${handle}`
      case 'codechef':
        return `https://www.codechef.com/users/${handle}`
      case 'hackerrank':
        return `https://www.hackerrank.com/profile/${handle}`
      case 'geeksforgeeks':
        return `https://auth.geeksforgeeks.org/user/${handle}/`
      case 'atcoder':
        return `https://atcoder.jp/users/${handle}`
      default:
        return undefined
    }
  }

  const getPlatformSubtitle = (platformId: string): string | undefined => {
    const external: any = stats.external || {}
    switch (platformId) {
      case 'leetcode': {
        const lc = external.leetcode
        if (!lc) return undefined
        const solved =
          typeof lc.totalSolved === 'number'
            ? `${lc.totalSolved} solved`
            : undefined
        const rating =
          typeof lc.contestRating === 'number' && lc.contestRating > 0
            ? `rating ${lc.contestRating}`
            : undefined
        return [solved, rating].filter(Boolean).join(' • ') || undefined
      }
      case 'codeforces': {
        const cf = external.codeforces
        if (!cf) return undefined
        const rating =
          typeof cf.rating === 'number' && cf.rating > 0
            ? `rating ${cf.rating}`
            : undefined
        const rank =
          typeof cf.rank === 'string' && cf.rank ? cf.rank : undefined
        return [rating, rank].filter(Boolean).join(' • ') || undefined
      }
      case 'codechef': {
        const cc = external.codechef
        if (!cc) return undefined
        const rating =
          typeof cc.rating === 'number' && cc.rating > 0
            ? `rating ${cc.rating}`
            : undefined
        const stars =
          typeof cc.stars === 'number' && cc.stars > 0
            ? `${cc.stars}★`
            : undefined
        return [rating, stars].filter(Boolean).join(' • ') || undefined
      }
      case 'geeksforgeeks': {
        const gfg = external.geeksforgeeks
        if (!gfg) return undefined
        const solved =
          typeof gfg.totalSolved === 'number'
            ? `${gfg.totalSolved} solved`
            : undefined
        return solved
      }
      case 'hackerrank': {
        const hr = external.hackerrank
        if (!hr) return undefined
        const badges = Array.isArray(hr.badges)
          ? `${hr.badges.length} badges`
          : undefined
        return badges
      }
      case 'atcoder': {
        const ac = external.atcoder
        if (!ac) return undefined
        const rating =
          typeof ac.rating === 'number' && ac.rating > 0
            ? `rating ${ac.rating}`
            : undefined
        const maxRating =
          typeof ac.maxRating === 'number' && ac.maxRating > 0
            ? `max ${ac.maxRating}`
            : undefined
        return [rating, maxRating].filter(Boolean).join(' • ') || undefined
      }
      default:
        return undefined
    }
  }

  const formatLastFetched = (value?: string) => {
    if (!value) return undefined
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return undefined
    return date.toLocaleString()
  }

  // Generate heatmap data from actual submissions
  const generateHeatmapData = (): SubmissionDay[] => {
    const days: SubmissionDay[] = []
    const today = new Date()
    const submissionCounts = new Map<string, number>()

    // Count submissions by date
    if (submissions && Array.isArray(submissions)) {
      submissions.forEach((sub: any) => {
        const date = new Date(sub.createdAt || sub.submittedAt)
          .toISOString()
          .split('T')[0]
        submissionCounts.set(date, (submissionCounts.get(date) || 0) + 1)
      })
    }

    // Generate 365 days of data
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const count = submissionCounts.get(dateStr) || 0
      const level =
        count === 0 ? 0 : count <= 1 ? 1 : count <= 2 ? 2 : count <= 3 ? 3 : 4

      days.push({
        date: dateStr,
        count,
        level: level as 0 | 1 | 2 | 3 | 4,
      })
    }

    return days
  }

  const heatmapData = generateHeatmapData()
  const totalSubmissionsYear = heatmapData.reduce(
    (sum, day) => sum + day.count,
    0,
  )

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0:
        return '#161b22'
      case 1:
        return '#0e4429'
      case 2:
        return '#006d32'
      case 3:
        return '#26a641'
      case 4:
        return '#39d353'
      default:
        return '#161b22'
    }
  }

  const handleBioSave = async () => {
    try {
      await authService.updateProfile({ bio })
      setIsEditingBio(false)
    } catch (error) {
      console.error('Failed to update bio:', error)
    }
  }

  const totalProblems =
    stats.easyTotal + stats.mediumTotal + stats.hardTotal || 1
  const solvedPercentage = (stats.totalSolved / totalProblems) * 100

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <header className="bg-[#161b22] border-b border-[#30363d] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-[#8b949e] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#238636] rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">PROFILE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Card */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-[#238636] rounded-full flex items-center justify-center mb-4">
                  <User className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {user?.name || 'chandan'}
                </h2>
                <p className="text-sm text-[#8b949e] mb-2">
                  @{user?.username || 'chandan'}
                </p>
                <div className="bg-[#238636] text-white text-xs font-bold px-3 py-1 rounded-full">
                  Rank #{(stats.ranking || 0).toLocaleString()}
                </div>
              </div>

              {/* About Section */}
              <div className="mt-6 pt-6 border-t border-[#30363d]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">About</h3>
                  <button
                    onClick={() => setIsEditingBio(!isEditingBio)}
                    className="text-[#8b949e] hover:text-white transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                {isEditingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[#238636]"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleBioSave}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingBio(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#8b949e]">{bio}</p>
                )}
              </div>
            </div>

            {/* Contest Rating */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <h3 className="text-sm font-bold text-white mb-4">
                Contest Rating
              </h3>
              <div className="text-center">
                <div className="text-5xl font-bold text-[#fb8500] mb-2">
                  {stats.contestRating}
                </div>
                <p className="text-xs text-[#8b949e]">Current Rating</p>
              </div>
              <div className="mt-6 pt-6 border-t border-[#30363d] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8b949e]">
                    Acceptance Rate
                  </span>
                  <span className="text-sm font-bold text-[#238636]">
                    {(stats.acceptanceRate || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8b949e]">
                    Total Submissions
                  </span>
                  <span className="text-sm font-bold text-white">
                    {stats.totalSubmissions}
                  </span>
                </div>
              </div>
            </div>

            {/* Connected Platforms - Codolio Style */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">
                  Connected Platforms
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={handleSyncProfile}
                    disabled={syncProfileMutation.isPending}
                  >
                    <RefreshCw
                      className={cn(
                        'h-3 w-3 mr-1',
                        syncProfileMutation.isPending && 'animate-spin',
                      )}
                    />
                    {syncProfileMutation.isPending
                      ? 'Syncing...'
                      : 'Sync Stats'}
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {PLATFORMS.map((platform) => {
                  const isConnected =
                    !!user?.platformHandles?.[
                      platform.id as keyof typeof user.platformHandles
                    ]
                  const handle =
                    user?.platformHandles?.[
                      platform.id as keyof typeof user.platformHandles
                    ]
                  const url = getPlatformUrl(platform.id, handle)
                  const subtitle = getPlatformSubtitle(platform.id)

                  const external: any = stats.external || {}
                  const platformExternal = external?.[platform.id]
                  const fetchError: string | undefined =
                    platformExternal?.fetchError
                  const lastFetched: string | undefined =
                    platformExternal?.lastFetched
                  const statusTone = !isConnected
                    ? 'bg-[#30363d]'
                    : fetchError
                      ? 'bg-[#d29922]'
                      : lastFetched
                        ? 'bg-[#238636]'
                        : 'bg-[#30363d]'

                  return (
                    <div
                      key={platform.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-[#0d1117] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn('h-2 w-2 rounded-full', statusTone)}
                        />
                        <span className="text-lg">{platform.icon}</span>
                        <div>
                          <div className="text-sm text-white">
                            {platform.name}
                          </div>
                          {isConnected && (
                            <div className="text-xs text-[#8b949e]">
                              {handle}
                              {subtitle ? ` • ${subtitle}` : ''}
                              {fetchError ? ` • ${fetchError}` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      {isConnected ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-[#238636]" />
                          {url && (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#8b949e] hover:text-white flex items-center gap-1"
                              title="Open profile"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Link</span>
                            </a>
                          )}
                          <button
                            onClick={() => handleConnectPlatform(platform)}
                            className="text-xs text-[#8b949e] hover:text-white"
                            title="Edit handle"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnectPlatform(platform)}
                          className="text-xs text-[#8b949e] hover:text-white transition-colors"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {stats.externalMeta?.lastFullSync && (
                <div className="mt-4 text-xs text-[#8b949e]">
                  Last synced:{' '}
                  {formatLastFetched(stats.externalMeta.lastFullSync) || '—'}
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Problems Solved */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-4">
                    {/* Circular Progress */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#30363d"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#238636"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - solvedPercentage / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-3xl font-bold text-white">
                        {stats.totalSolved}/{totalProblems}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Problems Solved
                  </h3>
                  <p className="text-sm text-[#8b949e]">
                    {(solvedPercentage || 0).toFixed(0)}% Complete
                  </p>
                </div>
              </div>

              {/* Difficulty Breakdown */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  Difficulty Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#238636] font-medium">
                      Easy
                    </span>
                    <span className="text-sm font-bold text-white">
                      {stats.easySolved}/{stats.easyTotal}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#d29922] font-medium">
                      Medium
                    </span>
                    <span className="text-sm font-bold text-white">
                      {stats.mediumSolved}/{stats.mediumTotal}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#da3633] font-medium">
                      Hard
                    </span>
                    <span className="text-sm font-bold text-white">
                      {stats.hardSolved}/{stats.hardTotal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating Trend */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  Rating Trend
                </h3>
                <div className="flex flex-col items-center justify-center h-32">
                  <TrendingUp className="h-12 w-12 text-[#238636] mb-2" />
                  <p className="text-sm text-[#8b949e]">
                    Rating graph coming soon
                  </p>
                </div>
              </div>
            </div>

            {/* Submission Activity Heatmap */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  Submission Activity
                </h3>
                <p className="text-sm text-[#8b949e]">
                  {totalSubmissionsYear} submissions in the past year
                </p>
              </div>

              {/* Heatmap */}
              <div className="overflow-x-auto">
                <div className="inline-flex flex-col gap-1 min-w-max">
                  {/* Month labels */}
                  <div className="flex gap-1 ml-8 mb-1">
                    {[
                      'Jan',
                      'Feb',
                      'Mar',
                      'Apr',
                      'May',
                      'Jun',
                      'Jul',
                      'Aug',
                      'Sep',
                      'Oct',
                      'Nov',
                      'Dec',
                    ].map((month, i) => (
                      <div
                        key={month}
                        className="text-xs text-[#8b949e]"
                        style={{
                          width: `${(30.4 / 7) * 10}px`,
                          marginLeft: i === 0 ? 0 : '2px',
                        }}
                      >
                        {month}
                      </div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="flex gap-1">
                    {/* Day labels */}
                    <div className="flex flex-col gap-1 justify-between text-xs text-[#8b949e] pr-2">
                      <span>Sun</span>
                      <span className="invisible">Mon</span>
                      <span>Tue</span>
                      <span className="invisible">Wed</span>
                      <span>Thu</span>
                      <span className="invisible">Fri</span>
                      <span>Sat</span>
                    </div>

                    {/* Cells */}
                    <div
                      className="grid grid-flow-col gap-1"
                      style={{ gridTemplateRows: 'repeat(7, 10px)' }}
                    >
                      {heatmapData.map((day, index) => (
                        <div
                          key={index}
                          className="w-[10px] h-[10px] rounded-sm cursor-pointer hover:ring-1 hover:ring-white/50 transition-all"
                          style={{ backgroundColor: getLevelColor(day.level) }}
                          title={`${day.date}: ${day.count} submissions`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-2 mt-4 text-xs text-[#8b949e]">
                    <span>Less</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className="w-[10px] h-[10px] rounded-sm"
                          style={{ backgroundColor: getLevelColor(level) }}
                        />
                      ))}
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  Recent Submissions
                </h3>
                <Link
                  to="/submissions"
                  className="text-sm text-[#238636] hover:underline"
                >
                  View all submissions →
                </Link>
              </div>

              {/* Placeholder */}
              <div className="flex items-center justify-center h-32 border border-[#30363d] rounded-md">
                <div className="text-center">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-sm text-[#8b949e]">
                    No recent submissions
                  </p>
                </div>
              </div>

              {/* Skill Analysis - Codolio Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skill Radar */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-[#238636]" />
                    Skill Analysis
                  </h3>
                  <div className="space-y-3">
                    {skillsLoading ? (
                      <div className="text-center py-4 text-[#8b949e]">
                        Loading skills...
                      </div>
                    ) : skillsData?.skills && skillsData.skills.length > 0 ? (
                      skillsData.skills.slice(0, 6).map((skill: any) => (
                        <div key={skill.name}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-[#8b949e]">
                              {skill.name}
                            </span>
                            <span className="text-sm font-bold text-white">
                              {skill.value}%
                            </span>
                          </div>
                          <div className="h-2 bg-[#30363d] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#238636] to-[#39d353] rounded-full transition-all duration-500"
                              style={{ width: `${skill.value}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-[#8b949e]">
                        Solve problems to unlock skill analysis
                      </div>
                    )}
                  </div>
                </div>

                {/* Achievements */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Achievements
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {achievementsLoading ? (
                      <div className="col-span-2 text-center py-4 text-[#8b949e]">
                        Loading achievements...
                      </div>
                    ) : achievementsData?.achievements &&
                      achievementsData.achievements.length > 0 ? (
                      achievementsData.achievements.map((achievement: any) => (
                        <div
                          key={achievement.id}
                          className={cn(
                            'relative p-3 rounded-lg border transition-all',
                            achievement.unlocked
                              ? 'border-[#238636] bg-[#238636]/10'
                              : 'border-[#30363d] bg-[#0d1117] opacity-70',
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{achievement.icon}</span>
                            <span
                              className={cn(
                                'text-sm font-bold',
                                achievement.unlocked
                                  ? 'text-white'
                                  : 'text-[#8b949e]',
                              )}
                            >
                              {achievement.name}
                            </span>
                          </div>
                          <p className="text-xs text-[#8b949e]">
                            {achievement.description}
                          </p>
                          {!achievement.unlocked &&
                            achievement.progress !== undefined && (
                              <div className="mt-2">
                                <div className="h-1 bg-[#30363d] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#238636] rounded-full"
                                    style={{
                                      width: `${(achievement.progress / (achievement.target || 1)) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-[#8b949e] mt-1 block">
                                  {achievement.progress}/{achievement.target}
                                </span>
                              </div>
                            )}
                          {!achievement.unlocked && (
                            <div className="absolute top-2 right-2">
                              <Lock className="h-3 w-3 text-[#8b949e]" />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-4 text-[#8b949e]">
                        Start solving problems to earn achievements
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Aggregated Stats - Codolio Style */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Platform Stats (Aggregated)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-[#0d1117] rounded-lg">
                    <div className="text-3xl font-bold text-[#238636]">
                      {displayTotalSolved}
                    </div>
                    <div className="text-sm text-[#8b949e]">Total Solved</div>
                  </div>
                  <div className="text-center p-4 bg-[#0d1117] rounded-lg">
                    <div className="text-3xl font-bold text-[#fb8500]">
                      {displayContestRating || 'N/A'}
                    </div>
                    <div className="text-sm text-[#8b949e]">Contest Rating</div>
                  </div>
                  <div className="text-center p-4 bg-[#0d1117] rounded-lg">
                    <div className="text-3xl font-bold text-[#1F8ACB]">
                      #
                      {displayRanking ? displayRanking.toLocaleString() : 'N/A'}
                    </div>
                    <div className="text-sm text-[#8b949e]">Global Rank</div>
                  </div>
                  <div className="text-center p-4 bg-[#0d1117] rounded-lg">
                    <div className="text-3xl font-bold text-[#da3633]">
                      {(stats.acceptanceRate || 0).toFixed(0)}%
                    </div>
                    <div className="text-sm text-[#8b949e]">Acceptance</div>
                  </div>
                </div>
              </div>

              {/* Platform Profiles - Codolio Style */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-[#fb8500]" />
                    Platform Profiles
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={handleSyncProfile}
                    disabled={syncProfileMutation.isPending}
                  >
                    <RefreshCw
                      className={cn(
                        'h-3 w-3 mr-1',
                        syncProfileMutation.isPending && 'animate-spin',
                      )}
                    />
                    {syncProfileMutation.isPending
                      ? 'Syncing...'
                      : 'Sync Stats'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PLATFORMS.filter(
                    (p) =>
                      !!user?.platformHandles?.[
                        p.id as keyof typeof user.platformHandles
                      ],
                  ).map((platform) => {
                    const handle =
                      user?.platformHandles?.[
                        platform.id as keyof typeof user.platformHandles
                      ]
                    const url = getPlatformUrl(platform.id, handle)
                    const external: any = stats.external || {}
                    const data = external?.[platform.id]
                    const fetchError: string | undefined = data?.fetchError
                    const lastFetched: string | undefined = data?.lastFetched

                    return (
                      <div
                        key={platform.id}
                        className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span className="text-lg">{platform.icon}</span>
                              <span>{platform.name}</span>
                            </div>
                            <div className="text-xs text-[#8b949e] mt-1">
                              {handle || 'Not connected'}
                              {lastFetched
                                ? ` • updated ${formatLastFetched(lastFetched)}`
                                : ''}
                            </div>
                          </div>
                          {url && (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#8b949e] hover:text-white flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Link</span>
                            </a>
                          )}
                        </div>

                        {fetchError ? (
                          <div className="mt-3 text-xs text-[#d29922]">
                            {fetchError}
                          </div>
                        ) : (
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            {platform.id === 'leetcode' && (
                              <>
                                <div>
                                  <div className="text-xs text-[#8b949e]">
                                    Solved
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.totalSolved ?? '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-[#8b949e]">
                                    Contest
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.contestRating ?? '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-[#8b949e]">
                                    Easy/Med/Hard
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.easySolved ?? '—'}/
                                    {data?.mediumSolved ?? '—'}/
                                    {data?.hardSolved ?? '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-[#8b949e]">
                                    Rank
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.ranking
                                      ? `#${Number(data.ranking).toLocaleString()}`
                                      : '—'}
                                  </div>
                                </div>
                              </>
                            )}

                            {platform.id === 'codeforces' && (
                              <>
                                <div>
                                  <div className="text-xs text-[#8b949e]">
                                    Rating
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.rating ?? '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-[#8b949e]">
                                    Max
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.maxRating ?? '—'}
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-xs text-[#8b949e]">
                                    Rank
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.rank ?? '—'}
                                  </div>
                                </div>
                              </>
                            )}

                            {platform.id === 'codechef' && (
                              <>
                                <div>
                                  <div className="text-xs text-[#8b949e]">
                                    Rating
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.rating ?? '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-[#8b949e]">
                                    Stars
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.stars ?? '—'}
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-xs text-[#8b949e]">
                                    Global Rank
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.globalRank ?? '—'}
                                  </div>
                                </div>
                              </>
                            )}

                            {platform.id === 'geeksforgeeks' && (
                              <>
                                <div>
                                  <div className="text-xs text-[#8b949e]">
                                    Solved
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.totalSolved ?? '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-[#8b949e]">
                                    Score
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.codingScore ?? '—'}
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-xs text-[#8b949e]">
                                    Institute Rank
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.instituteRank ?? '—'}
                                  </div>
                                </div>
                              </>
                            )}

                            {platform.id === 'atcoder' && (
                              <>
                                <div>
                                  <div className="text-xs text-[#8b949e]">
                                    Rating
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.rating ?? '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-[#8b949e]">
                                    Max
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.maxRating ?? '—'}
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-xs text-[#8b949e]">
                                    Rank
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {data?.rank ?? '—'}
                                  </div>
                                </div>
                              </>
                            )}

                            {platform.id === 'hackerrank' && (
                              <div className="col-span-2">
                                <div className="text-xs text-[#8b949e]">
                                  Badges
                                </div>
                                <div className="text-sm font-bold text-white">
                                  {Array.isArray(data?.badges)
                                    ? data.badges.length
                                    : data
                                      ? '—'
                                      : '—'}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {PLATFORMS.every(
                    (p) =>
                      !user?.platformHandles?.[
                        p.id as keyof typeof user.platformHandles
                      ],
                  ) && (
                    <div className="md:col-span-2 text-center py-6 text-[#8b949e]">
                      Connect a platform to see stats here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Platform Connection Modal */}
      {isPlatformModalOpen && selectedPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Connect {selectedPlatform.name}
              </h3>
              <button
                onClick={() => setIsPlatformModalOpen(false)}
                className="text-[#8b949e] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#8b949e] mb-1">
                  {selectedPlatform.name} Username
                </label>
                <input
                  type="text"
                  value={platformUsername}
                  onChange={(e) => setPlatformUsername(e.target.value)}
                  placeholder={`Enter your ${selectedPlatform.name} handle`}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#238636]"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsPlatformModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePlatform}
                  disabled={
                    !platformUsername.trim() || updateProfileMutation.isPending
                  }
                >
                  {updateProfileMutation.isPending
                    ? 'Saving...'
                    : 'Save Connection'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
