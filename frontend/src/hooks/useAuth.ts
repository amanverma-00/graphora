import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../services/api'
import toast from 'react-hot-toast'

/**
 * Custom hooks for authentication-related operations
 * using React Query for state management
 */

/**
 * Hook for forgot password functionality
 */
export function useForgotPassword() {
    return useMutation({
        mutationFn: async (email: string) => {
            const response = await authService.forgotPassword(email)
            return response.data
        },
        onSuccess: () => {
            toast.success('Password reset email sent! Check your inbox.')
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to send reset email'
            toast.error(message)
        },
    })
}

/**
 * Hook for reset password functionality
 */
export function useResetPassword() {
    return useMutation({
        mutationFn: async (data: {
            token: string
            password: string
            passwordConfirm: string
        }) => {
            const response = await authService.resetPassword(
                data.token,
                data.password,
                data.passwordConfirm
            )
            return response.data
        },
        onSuccess: () => {
            toast.success('Password reset successful! You can now login.')
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to reset password'
            toast.error(message)
        },
    })
}

/**
 * Hook for updating user profile
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            name?: string
            username?: string
            bio?: string
            level?: 'beginner' | 'intermediate' | 'advanced'
            languages?: string[]
            age?: number
            college?: string
            companies?: string[]
            avatar?: string
            timezone?: string
            socialLinks?: {
                github?: string
                linkedin?: string
                portfolio?: string
            }
        }) => {
            const response = await authService.updateProfile(data)
            return response.data
        },
        onSuccess: () => {
            // Invalidate profile query to refetch updated data
            queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] })
            toast.success('Profile updated successfully!')
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to update profile'
            toast.error(message)
        },
    })
}

/**
 * Hook for changing password
 */
export function useChangePassword() {
    return useMutation({
        mutationFn: async (data: {
            oldPassword: string
            newPassword: string
        }) => {
            const response = await authService.changePassword(
                data.oldPassword,
                data.newPassword
            )
            return response.data
        },
        onSuccess: () => {
            toast.success('Password changed successfully!')
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to change password'
            toast.error(message)
        },
    })
}
