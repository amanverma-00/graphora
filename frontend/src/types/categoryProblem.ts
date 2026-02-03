import type { Difficulty } from './index'

/**
 * Problems served from backend JSON category files (GET /api/problems/category/:category).
 * These are not Mongo-backed and typically have no `_id`/`slug`.
 */
export interface CategoryProblem {
  title: string
  description: string
  difficulty: Difficulty
  companyTags?: string[]
  topics?: string[]
  pattern?: string[]
  visibleTestCases?: Array<{
    input: string
    output: string
    explanation?: string
  }>
  hiddenTestCases?: Array<{
    input: string
    output: string
  }>
  starterCode?: Array<{
    language: string
    code: string
  }>
  constraints?: string
  hints?: string[]
  memoryLimit?: number
  timeLimit?: number
}
