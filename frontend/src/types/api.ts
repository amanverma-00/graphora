/**
 * API Response Type Definitions
 * 
 * This file contains TypeScript types for all backend API responses
 * to ensure type safety across the frontend application.
 */

// ==================== Common Types ====================

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export interface ApiError {
  success: false
  message: string
  error?: string
  statusCode?: number
}

// ==================== Auth API Types ====================

export interface User {
  _id: string
  name: string
  username: string
  email: string
  bio?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  languages?: string[]
  age?: number
  role: 'user' | 'admin' | 'professor'
  isEmailVerified: boolean
  totalMocksAttempted: number
  completedMocks: number
  college?: string
  companies?: string[]
  avatar?: string
  timezone: string
  lastLoginAt?: string
  subscription?: {
    plan: 'free' | 'pro' | 'premium'
    expiresAt?: string
    stripeCustomerId?: string
  }
  stats?: {
    totalSubmissions: number
    acceptedSubmissions: number
    averageRuntime: number
    accuracy: number
    rank?: number
  }
  socialLinks?: {
    github?: string
    linkedin?: string
    portfolio?: string
  }
  createdAt: string
  updatedAt: string
}

export interface LoginResponse {
  success: true
  message: string
  token?: string
  accessToken?: string
  user?: User
  data?: {
    user: User
    token?: string
  }
}

export interface RegisterResponse {
  success: true
  message: string
  token?: string
  accessToken?: string
  user?: User
  data?: {
    user: User
    token?: string
  }
}

export interface VerifyOTPResponse {
  success: true
  message: string
  user?: User
  data?: {
    user: User
  }
}

export interface ProfileResponse {
  success: true
  data?: {
    user: User
  }
  user?: User
}

export interface ForgotPasswordResponse {
  success: true
  message: string
}

export interface ResetPasswordResponse {
  success: true
  message: string
}

// ==================== Problem API Types ====================

export interface ProblemListItem {
  _id: string
  title: string
  slug: string
  difficulty: 'easy' | 'medium' | 'hard'
  companyTags?: string[]
  topics?: string[]
  pattern?: string[]
  acceptanceRate?: number
  submissionsCount?: number
  acceptedCount?: number
  premium?: boolean
  status?: 'solved' | 'attempted' | 'unsolved'
}

export interface TestCase {
  input: string
  output: string
  explanation?: string
}

export interface StarterCodeItem {
  language: string
  code: string
}

export interface ProblemDetail {
  _id: string
  title: string
  slug: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  visibleTestCases: TestCase[]
  hiddenTestCases?: TestCase[]
  starterCode: StarterCodeItem[]
  solutions?: StarterCodeItem[]
  constraints?: string
  hints?: string[]
  companyTags?: string[]
  topics?: string[]
  pattern?: string[]
  timeLimit: number
  memoryLimit: number
  submissionsCount: number
  acceptedCount: number
  acceptanceRate?: number
  premium: boolean
  likes?: number
  dislikes?: number
  relatedProblems?: string[]
  createdAt: string
  updatedAt: string
}

export interface ProblemsListResponse {
  success: true
  data: {
    problems: ProblemListItem[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export interface ProblemDetailResponse {
  success: true
  data: ProblemDetail
}

export interface CategoryProblemsResponse {
  success: true
  data: {
    problems: ProblemListItem[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

// ==================== Submission API Types ====================

export interface TestCaseResult {
  testCaseId: number
  status: 'passed' | 'failed' | 'error'
  input: string
  expectedOutput: string
  actualOutput: string
  runtime?: number
  memory?: number
}

export interface Submission {
  _id: string
  user: string
  problem: string | ProblemListItem
  mockSession?: string
  code: string
  language: string
  status: 'Pending' | 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Runtime Error' | 'Compilation Error' | 'Internal Error'
  runtime?: number
  memory?: number
  errorMessage?: string
  testCasesPassed: number
  testCasesTotal: number
  testCasesResults?: TestCaseResult[]
  attemptNumber?: number
  judge0SubmissionId?: string
  evaluatedAt?: string
  createdAt: string
  updatedAt: string
}

export interface SubmitCodeResponse {
  success: true
  message: string
  data: {
    submission: Submission
  }
}

export interface RunCodeResponse {
  success: true
  message: string
  data: {
    status: string
    testCasesPassed: number
    testCasesTotal: number
    testCasesResults: TestCaseResult[]
    runtime?: number
    memory?: number
    errorMessage?: string
  }
}

export interface SubmissionHistoryResponse {
  success: true
  data: {
    submissions: Submission[]
    pagination?: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export interface RecentSubmissionsResponse {
  success: true
  data: {
    submissions: Submission[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

// ==================== Mock Interview API Types ====================

export interface MockProblem {
  problem: string | ProblemListItem
  order: number
  submission?: string
  timeSpent: number
  solved: boolean
  startedAt?: string
  completedAt?: string
}

export interface MockSession {
  _id: string
  user: string
  type: 'company' | 'difficulty' | 'pattern' | 'custom'
  config: {
    company?: string
    difficulty?: string
    pattern?: string
    problemCount: number
  }
  problems: MockProblem[]
  timeLimit: number
  startedAt?: string
  completedAt?: string
  expiresAt?: string
  status: 'pending' | 'in_progress' | 'completed' | 'expired' | 'abandoned'
  score: {
    solved: number
    total: number
    totalTime?: number
    averageTime?: number
    percentile?: number
  }
  createdAt: string
  updatedAt: string
}

export interface MockSessionResponse {
  success: true
  data: {
    session: MockSession
  }
}

export interface GenerateMockResponse {
  success: true
  message: string
  data: {
    session: MockSession
  }
}

export interface MockStatsResponse {
  success: true
  data: {
    totalMocks: number
    completedMocks: number
    averageScore: number
    totalTimeSpent: number
    byDifficulty: {
      easy: number
      medium: number
      hard: number
    }
    byCompany: Record<string, number>
    recentMocks: MockSession[]
  }
}

export interface MockHistoryResponse {
  success: true
  data: {
    sessions: MockSession[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export interface LeaderboardEntry {
  user: {
    _id: string
    name: string
    username: string
    avatar?: string
  }
  score: number
  totalMocks: number
  averageTime: number
  rank: number
}

export interface MockLeaderboardResponse {
  success: true
  data: {
    leaderboard: LeaderboardEntry[]
    userRank?: number
  }
}
