import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockService } from '../services/api'
import toast from 'react-hot-toast'

/**
 * Custom hooks for mock interview operations
 * using React Query for state management
 */

/**
 * Query keys for React Query cache management
 */
export const mockKeys = {
    all: ['mocks'] as const,
    stats: () => [...mockKeys.all, 'stats'] as const,
    active: () => [...mockKeys.all, 'active'] as const,
    history: (filters?: Record<string, unknown>) =>
        [...mockKeys.all, 'history', filters] as const,
    leaderboard: (params?: Record<string, unknown>) =>
        [...mockKeys.all, 'leaderboard', params] as const,
    session: (id: string) => [...mockKeys.all, 'session', id] as const,
}

/**
 * Fetch user's mock statistics
 */
export function useMockStats() {
    return useQuery({
        queryKey: mockKeys.stats(),
        queryFn: async () => {
            const response = await mockService.getStats()
            return response.data
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

/**
 * Fetch current active mock session
 */
export function useActiveMock() {
    return useQuery({
        queryKey: mockKeys.active(),
        queryFn: async () => {
            const response = await mockService.getActive()
            return response.data
        },
        staleTime: 1000 * 30, // 30 seconds
        retry: 1,
    })
}

/**
 * Fetch mock history with optional filters
 */
export function useMockHistory(filters?: {
    page?: number
    limit?: number
    type?: 'company' | 'difficulty' | 'pattern' | 'custom'
    status?: 'completed' | 'abandoned' | 'expired'
}) {
    return useQuery({
        queryKey: mockKeys.history(filters),
        queryFn: async () => {
            const response = await mockService.getHistory(filters)
            return response.data
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

/**
 * Fetch mock leaderboard
 */
export function useMockLeaderboard(params?: {
    type?: 'company' | 'difficulty' | 'pattern' | 'custom'
    company?: string
    timeframe?: 'all' | 'week' | 'month'
    limit?: number
}) {
    return useQuery({
        queryKey: mockKeys.leaderboard(params),
        queryFn: async () => {
            const response = await mockService.getLeaderboard(params)
            return response.data
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    })
}

/**
 * Fetch specific mock session details
 */
export function useMockSession(sessionId: string) {
    return useQuery({
        queryKey: mockKeys.session(sessionId),
        queryFn: async () => {
            const response = await mockService.getSession(sessionId)
            return response.data
        },
        enabled: !!sessionId,
        staleTime: 1000 * 60, // 1 minute
    })
}

/**
 * Generate a new mock session
 */
export function useGenerateMock() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            type: 'company' | 'difficulty' | 'pattern' | 'custom'
            company?: string
            difficulty?: 'easy' | 'medium' | 'hard'
            pattern?: string
            problemCount?: number
            timeLimit?: number
        }) => {
            const response = await mockService.generate(data)
            return response.data
        },
        onSuccess: () => {
            // Invalidate stats and history after generating new mock
            queryClient.invalidateQueries({ queryKey: mockKeys.stats() })
            queryClient.invalidateQueries({ queryKey: mockKeys.history() })
            toast.success('Mock interview generated successfully!')
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to generate mock interview'
            toast.error(message)
        },
    })
}

/**
 * Start a pending mock session
 */
export function useStartMock() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (sessionId: string) => {
            const response = await mockService.start(sessionId)
            return response.data
        },
        onSuccess: (_, sessionId) => {
            // Invalidate session and active mock queries
            queryClient.invalidateQueries({ queryKey: mockKeys.session(sessionId) })
            queryClient.invalidateQueries({ queryKey: mockKeys.active() })
            toast.success('Mock interview started!')
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to start mock interview'
            toast.error(message)
        },
    })
}

/**
 * Switch problem within a mock session
 */
export function useSwitchProblem() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            sessionId: string
            fromOrder: number
            toOrder: number
        }) => {
            const { sessionId, ...switchData } = data
            const response = await mockService.switchProblem(sessionId, switchData)
            return response.data
        },
        onSuccess: (_, variables) => {
            // Invalidate session query to refetch updated data
            queryClient.invalidateQueries({ queryKey: mockKeys.session(variables.sessionId) })
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to switch problem'
            toast.error(message)
        },
    })
}

/**
 * Complete a mock session
 */
export function useCompleteMock() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (sessionId: string) => {
            const response = await mockService.complete(sessionId)
            return response.data
        },
        onSuccess: (_, sessionId) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: mockKeys.session(sessionId) })
            queryClient.invalidateQueries({ queryKey: mockKeys.active() })
            queryClient.invalidateQueries({ queryKey: mockKeys.stats() })
            queryClient.invalidateQueries({ queryKey: mockKeys.history() })
            toast.success('Mock interview completed!')
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to complete mock interview'
            toast.error(message)
        },
    })
}

/**
 * Abandon a mock session
 */
export function useAbandonMock() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (sessionId: string) => {
            const response = await mockService.abandon(sessionId)
            return response.data
        },
        onSuccess: (_, sessionId) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: mockKeys.session(sessionId) })
            queryClient.invalidateQueries({ queryKey: mockKeys.active() })
            queryClient.invalidateQueries({ queryKey: mockKeys.stats() })
            queryClient.invalidateQueries({ queryKey: mockKeys.history() })
            toast.success('Mock interview abandoned')
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to abandon mock interview'
            toast.error(message)
        },
    })
}
