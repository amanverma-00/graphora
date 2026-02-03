import { useQuery } from '@tanstack/react-query'
import { submissionService } from '../services/api'
import type { Submission } from '../types'

/**
 * Query keys for submissions
 */
export const submissionKeys = {
  all: ['submissions'] as const,
  lists: () => [...submissionKeys.all, 'list'] as const,
  list: (filters?: { problemId?: string; page?: number; limit?: number }) =>
    [...submissionKeys.lists(), filters] as const,
  detail: (id: string) => [...submissionKeys.all, 'detail', id] as const,
  history: (problemId: string) =>
    [...submissionKeys.all, 'history', problemId] as const,
}

/**
 * Fetch user's recent submissions with optional filters
 */
export function useRecentSubmissions(params?: {
  page?: number
  limit?: number
  status?: string
}) {
  return useQuery({
    queryKey: [...submissionKeys.lists(), 'recent', params],
    queryFn: async () => {
      const { data } = await submissionService.getRecentSubmissions(params)
      return {
        submissions: (data.submissions || data || []) as Submission[],
        pagination: data.pagination || {
          total: data.total || 0,
          page: data.page || 1,
          totalPages: data.totalPages || 1,
        },
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Fetch submission history for a specific problem
 */
export function useSubmissionHistory(problemId: string) {
  return useQuery({
    queryKey: submissionKeys.history(problemId),
    queryFn: async () => {
      const { data } = await submissionService.getSubmissionHistory(problemId)
      return (data.submissions || data || []) as Submission[]
    },
    enabled: !!problemId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Fetch a single submission by ID
 */
export function useSubmission(id: string) {
  return useQuery({
    queryKey: submissionKeys.detail(id),
    queryFn: async () => {
      const { data } = await submissionService.getSubmissionById(id)
      return (data.submission || data) as Submission
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
