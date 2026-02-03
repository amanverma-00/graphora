import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { problemService, submissionService } from '../services/api'
import type {
  CategoryProblem,
  Example,
  Problem,
  ProblemListItem,
  ProblemFilters,
  RunCodeResult,
} from '../types'

type Pagination = { page: number; limit: number; total: number; pages: number }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const unwrapData = (value: unknown): unknown => {
  if (!isRecord(value)) return value
  return 'data' in value ? value.data : value
}

const extractProblemsArray = (value: unknown): ProblemListItem[] => {
  const unwrapped = unwrapData(value)

  if (Array.isArray(unwrapped)) return unwrapped as ProblemListItem[]

  if (isRecord(unwrapped) && Array.isArray(unwrapped.problems)) {
    return unwrapped.problems as ProblemListItem[]
  }

  if (isRecord(value) && Array.isArray(value.problems)) {
    return value.problems as ProblemListItem[]
  }

  return []
}

const extractUnknownProblemsArray = (value: unknown): unknown[] => {
  const unwrapped = unwrapData(value)

  if (Array.isArray(unwrapped)) return unwrapped

  if (isRecord(unwrapped) && Array.isArray(unwrapped.problems)) {
    return unwrapped.problems
  }

  if (isRecord(value) && Array.isArray(value.problems)) {
    return value.problems
  }

  return []
}

const isCategoryProblem = (value: unknown): value is CategoryProblem => {
  if (!isRecord(value)) return false
  if (typeof value.title !== 'string') return false
  if (typeof value.description !== 'string') return false
  if (typeof value.difficulty !== 'string') return false
  return true
}

const isProblemDetailLike = (
  value: unknown,
): value is Record<string, unknown> => {
  if (!isRecord(value)) return false
  return (
    typeof value.title === 'string' && typeof value.description === 'string'
  )
}

const normalizeLanguageKey = (language: string): string => {
  const v = language.trim().toLowerCase()
  if (v === 'javascript' || v === 'js') return 'javascript'
  if (v === 'typescript' || v === 'ts') return 'typescript'
  if (v === 'python' || v === 'python3') return 'python'
  if (v === 'java') return 'java'
  if (v === 'c++' || v === 'cpp' || v === 'cxx') return 'cpp'
  if (v === 'c') return 'c'
  if (v === 'go' || v === 'golang') return 'go'
  if (v === 'rust') return 'rust'
  return v.replace(/\s+/g, '')
}

const normalizeStarterCode = (value: unknown): Record<string, string> => {
  // Backend: starterCode: Array<{ language, code }>
  // Frontend expects: Record<LanguageValue, code>
  if (isRecord(value)) {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === 'string') out[normalizeLanguageKey(k)] = v
    }
    return out
  }

  if (Array.isArray(value)) {
    const out: Record<string, string> = {}
    for (const item of value) {
      if (!isRecord(item)) continue
      const lang = item.language
      const code = item.code
      if (typeof lang === 'string' && typeof code === 'string') {
        out[normalizeLanguageKey(lang)] = code
      }
    }
    return out
  }

  return {}
}

const normalizeConstraints = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.trim())
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    // Prefer newline-separated constraints when present.
    const lines = trimmed
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    return lines.length > 1 ? lines : [trimmed]
  }
  return []
}

const normalizeExamples = (value: unknown): Example[] => {
  if (!Array.isArray(value)) return []
  const out: Example[] = []
  for (const item of value) {
    if (!isRecord(item)) continue
    const input = item.input
    const output = item.output
    const explanation = item.explanation
    if (typeof input === 'string' && typeof output === 'string') {
      out.push({
        input,
        output,
        explanation: typeof explanation === 'string' ? explanation : undefined,
      })
    }
  }
  return out
}

const normalizeAcceptanceRate = (value: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : undefined
  if (typeof value === 'string') {
    const n = Number.parseFloat(value)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

const normalizeProblemDetail = (raw: unknown): Problem => {
  const unwrapped = unwrapData(raw)

  // Backend: { success, data: { ...problem } } => unwrapData -> problem
  // Some controllers might nest differently; handle one more level.
  const maybeProblem = isProblemDetailLike(unwrapped)
    ? unwrapped
    : isRecord(unwrapped) && isProblemDetailLike(unwrapData(unwrapped))
      ? (unwrapData(unwrapped) as Record<string, unknown>)
      : null

  if (!maybeProblem) {
    throw new Error('Invalid problem payload')
  }

  const id = typeof maybeProblem._id === 'string' ? maybeProblem._id : ''
  const title = String(maybeProblem.title)
  const slug = typeof maybeProblem.slug === 'string' ? maybeProblem.slug : ''
  const difficulty = String(
    maybeProblem.difficulty || 'easy',
  ) as Problem['difficulty']
  const description = String(maybeProblem.description)

  const starterCode = normalizeStarterCode(maybeProblem.starterCode)

  // Backend uses visibleTestCases; UI expects examples
  const examples = normalizeExamples(maybeProblem.visibleTestCases)

  // Backend constraints is a string; UI expects string[]
  const constraints = normalizeConstraints(maybeProblem.constraints)

  // Backend uses companyTags; UI expects company
  const company = Array.isArray(maybeProblem.companyTags)
    ? maybeProblem.companyTags.filter(
        (v): v is string => typeof v === 'string' && v.trim(),
      )
    : []

  const topics = Array.isArray(maybeProblem.topics)
    ? maybeProblem.topics.filter((v): v is string => typeof v === 'string')
    : undefined

  const submissionsCount =
    typeof maybeProblem.submissionsCount === 'number'
      ? maybeProblem.submissionsCount
      : undefined
  const acceptedCount =
    typeof maybeProblem.acceptedCount === 'number'
      ? maybeProblem.acceptedCount
      : undefined

  const acceptanceRate =
    normalizeAcceptanceRate(maybeProblem.acceptanceRate) ??
    (submissionsCount && acceptedCount !== undefined
      ? (acceptedCount / Math.max(1, submissionsCount)) * 100
      : undefined)

  const premium =
    typeof maybeProblem.premium === 'boolean' ? maybeProblem.premium : undefined

  return {
    _id: id,
    title,
    slug,
    difficulty,
    description,
    constraints,
    examples,
    starterCode,
    company,
    topics,
    tags: undefined,
    acceptanceRate,
    totalSubmissions: submissionsCount,
    solvedCount: acceptedCount,
    points: undefined,
    timeLimit:
      typeof maybeProblem.timeLimit === 'number'
        ? maybeProblem.timeLimit
        : undefined,
    memoryLimit:
      typeof maybeProblem.memoryLimit === 'number'
        ? maybeProblem.memoryLimit
        : undefined,
    isPremium: premium,
    createdAt:
      typeof maybeProblem.createdAt === 'string'
        ? maybeProblem.createdAt
        : undefined,
    updatedAt:
      typeof maybeProblem.updatedAt === 'string'
        ? maybeProblem.updatedAt
        : undefined,
  }
}

const extractPagination = (value: unknown): Pagination => {
  const unwrapped = unwrapData(value)
  if (isRecord(unwrapped) && isRecord(unwrapped.pagination)) {
    const p = unwrapped.pagination
    const page = Number(p.page)
    const limit = Number(p.limit)
    const total = Number(p.total)
    const pages = Number(p.pages)

    if (
      Number.isFinite(page) &&
      Number.isFinite(limit) &&
      Number.isFinite(total) &&
      Number.isFinite(pages)
    ) {
      return { page, limit, total, pages }
    }
  }

  return { page: 1, limit: 20, total: 0, pages: 0 }
}

/**
 * Query keys for React Query cache management
 */
export const problemKeys = {
  all: ['problems'] as const,
  lists: () => [...problemKeys.all, 'list'] as const,
  list: (filters: ProblemFilters) => [...problemKeys.lists(), filters] as const,
  details: () => [...problemKeys.all, 'detail'] as const,
  detail: (slug: string) => [...problemKeys.details(), slug] as const,
  category: (cat: string) => [...problemKeys.all, 'category', cat] as const,
}

/**
 * Fetch list of problems with optional filters
 */
export function useProblems(filters?: ProblemFilters) {
  return useQuery({
    queryKey: problemKeys.list(filters || {}),
    queryFn: async () => {
      const params: Record<string, unknown> = {}

      if (filters?.difficulty && filters.difficulty !== 'all') {
        params.difficulty = filters.difficulty
      }
      if (filters?.status && filters.status !== 'all') {
        params.status = filters.status
      }
      if (filters?.tags && filters.tags.length > 0) {
        params.tags = filters.tags.join(',')
      }
      if (filters?.topics && filters.topics.length > 0) {
        params.topics = filters.topics.join(',')
      }
      if (filters?.search) {
        params.search = filters.search
      }
      if (filters?.page) {
        params.page = filters.page
      }
      if (filters?.limit) {
        params.limit = filters.limit
      }
      if (filters?.sortBy) {
        params.sortBy = filters.sortBy
      }
      if (filters?.sortOrder) {
        params.sortOrder = filters.sortOrder
      }

      const response = await problemService.getProblems(params)

      // Backend shape: { success, data: { problems, pagination } }
      // Tolerate older shapes: problems[], { problems }, { data: problems }
      return extractProblemsArray(response.data)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Fetch problems by category (array, string, math, etc)
 */
export function useProblemsByCategory(
  category: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: problemKeys.category(category),
    queryFn: async () => {
      const response = await problemService.getProblemsByCategory(
        category,
        params,
      )

      return {
        problems: extractUnknownProblemsArray(response.data).filter(
          isCategoryProblem,
        ),
        pagination: extractPagination(response.data),
      }
    },
    enabled: !!category,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch a single problem by slug
 */
export function useProblem(slug: string) {
  return useQuery({
    queryKey: problemKeys.detail(slug),
    queryFn: async () => {
      const response = await problemService.getProblemBySlug(slug)
      return normalizeProblemDetail(response.data)
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Run code against sample test cases
 */
export function useRunCode() {
  return useMutation({
    mutationFn: async (data: {
      problemId: string
      language: string
      code: string
      customInput?: string
    }): Promise<RunCodeResult> => {
      const { problemId, ...rest } = data
      const response = await submissionService.runCode(problemId, rest)
      return response.data
    },
  })
}

/**
 * Submit code for full evaluation
 */
export function useSubmitCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      problemId: string
      language: string
      code: string
      mockSessionId?: string
    }): Promise<RunCodeResult> => {
      const { problemId, ...rest } = data
      const response = await submissionService.submitCode(problemId, rest)
      return response.data
    },
    onSuccess: () => {
      // Invalidate submissions cache after successful submission
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
    },
  })
}
