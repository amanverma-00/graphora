/**
 * Core type definitions for Graphora
 */

// =============================================================================
// Problem Types
// =============================================================================

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Problem {
  _id: string
  title: string
  slug: string
  difficulty: Difficulty
  description: string
  constraints: string[]
  examples: Example[]
  starterCode: Record<string, string>
  testCases?: TestCase[]
  company?: string[]
  topics?: string[]
  tags?: string[]
  acceptanceRate?: number
  totalSubmissions?: number
  solvedCount?: number
  points?: number
  timeLimit?: number // in ms
  memoryLimit?: number // in MB
  isPremium?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Example {
  input: string
  output: string
  explanation?: string
}

export interface TestCase {
  input: string
  expectedOutput: string
  isHidden?: boolean
}

export interface ProblemListItem {
  _id: string
  title: string
  slug: string
  difficulty: Difficulty
  topics?: string[]
  tags?: string[]
  company?: string[]
  acceptanceRate?: number
  totalSubmissions?: number
  solvedCount?: number
  points?: number
  isPremium?: boolean
  status?: 'solved' | 'attempted' | 'unsolved'
}

// =============================================================================
// Submission Types
// =============================================================================

export type SubmissionStatus =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Runtime Error'
  | 'Compilation Error'
  | 'Pending'
  | 'Running'

export interface Submission {
  _id: string
  problemId: string
  userId: string
  language: string
  code: string
  status: SubmissionStatus
  runtime?: number // in ms
  memory?: number // in MB
  testCasesPassed?: number
  totalTestCases?: number
  errorMessage?: string
  stdout?: string
  stderr?: string
  createdAt: string
  problem?: {
    title: string
    slug: string
    difficulty: Difficulty
  }
}

export interface RunCodeResult {
  success: boolean
  status?: SubmissionStatus
  runtime?: number
  memory?: number
  testCasesPassed?: number
  totalTestCases?: number
  error?: string
  stdout?: string
  stderr?: string
  failedTests?: FailedTest[]
}

export interface FailedTest {
  input: string
  expected: string
  actual: string
  testCaseNumber?: number
}

// =============================================================================
// User Types
// =============================================================================

export interface User {
  _id: string
  name: string
  email: string
  username?: string
  avatar?: string
  bio?: string
  role?: 'user' | 'admin'
  streak?: number
  solvedProblems?: number
  totalSubmissions?: number
  rank?: number
  stats?: {
    totalSubmissions?: number
    acceptedSubmissions?: number
    accuracy?: number
    averageRuntime?: number
    rank?: number
  }
  badges?: Badge[]
  platformHandles?: {
    leetcode?: string
    codeforces?: string
    codechef?: string
    hackerrank?: string
    geeksforgeeks?: string
    atcoder?: string
  }
  createdAt?: string
}

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  earnedAt: string
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProblemsResponse {
  problems: ProblemListItem[]
  total?: number
  page?: number
  limit?: number
}

export interface SubmissionsResponse {
  submissions: Submission[]
  total?: number
  page?: number
  limit?: number
}

// =============================================================================
// Filter & Query Types
// =============================================================================

export interface ProblemFilters {
  difficulty?: Difficulty | 'all'
  status?: 'solved' | 'unsolved' | 'attempted' | 'all'
  tags?: string[]
  topics?: string[]
  search?: string
  page?: number
  limit?: number
  sortBy?: 'title' | 'difficulty' | 'acceptanceRate' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// =============================================================================
// Component Prop Types
// =============================================================================

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface DropdownOption {
  value: string
  label: string
  icon?: string
  disabled?: boolean
}

export type { CategoryProblem } from './categoryProblem'
