import mongoose, { Schema } from 'mongoose'
import { ICodingProfile } from '../types/type'

const CodingProfileSchema = new Schema<ICodingProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', unique: true },

    platforms: {
      leetcode: {
        username: String,
        totalSolved: { type: Number, default: 0 },
        easySolved: { type: Number, default: 0 },
        mediumSolved: { type: Number, default: 0 },
        hardSolved: { type: Number, default: 0 },
        ranking: Number,
        contestRating: Number,
        streak: Number,
        badges: [String],
        lastFetched: Date,
        fetchError: String,
      },
      codeforces: {
        handle: String,
        rating: Number,
        maxRating: Number,
        rank: String,
        contestsCount: Number,
        lastFetched: Date,
        fetchError: String,
      },
      codechef: {
        username: String,
        rating: Number,
        stars: Number,
        globalRank: Number,
        lastFetched: Date,
        fetchError: String,
      },
      hackerrank: {
        username: String,
        badges: [String],
        certificates: [{ name: String, url: String }],
        lastFetched: Date,
        fetchError: String,
      },
      geeksforgeeks: {
        username: String,
        totalSolved: { type: Number, default: 0 },
        codingScore: Number,
        instituteRank: Number,
        lastFetched: Date,
        fetchError: String,
      },
      atcoder: {
        username: String,
        rating: Number,
        maxRating: Number,
        rank: String,
        lastFetched: Date,
        fetchError: String,
      },
      github: {
        username: String,
        contributions: Number,
        currentStreak: Number,
        longestStreak: Number,
        publicRepos: Number,
        followers: Number,
        topLanguages: [{ name: String, percentage: Number }],
        lastFetched: Date,
      },
    },

    aggregatedStats: {
      totalProblemsSolved: Number,
      strongestTopics: [String],
      weakestTopics: [String],
      consistencyScore: Number,
      activeDaysThisMonth: Number,
    },

    lastFullSync: Date,
    syncScheduled: Boolean,
  },
  { timestamps: true },
)

CodingProfileSchema.index({ user: 1 })
CodingProfileSchema.index({ 'aggregatedStats.totalProblemsSolved': -1 })

const CodingProfile = mongoose.model('CodingProfile', CodingProfileSchema)

export default CodingProfile
