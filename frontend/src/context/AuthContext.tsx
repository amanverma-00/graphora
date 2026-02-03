/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { User } from '../types'
import { authService } from '../services/api'

interface RegisterData {
  name: string
  username: string
  email: string
  password: string
  passwordConfirm: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (emailOrUsername: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Auth Provider for managing user authentication state
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        try {
          const { data } = await authService.getProfile()
          setUser(data.data?.user || data.user || data)
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('accessToken')
        }
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (emailOrUsername: string, password: string) => {
    const { data } = await authService.login(emailOrUsername, password)
    const token = data.token || data.accessToken
    if (token) {
      localStorage.setItem('accessToken', token)
    }
    // Clear any stale cached data from previous sessions
    queryClient.clear()
    setUser(data.data?.user || data.user || data)
  }

  const register = async (registerData: RegisterData) => {
    const { data } = await authService.register(registerData)
    const token = data.token || data.accessToken
    if (token) {
      localStorage.setItem('accessToken', token)
    }
    // Clear any stale cached data
    queryClient.clear()
    setUser(data.data?.user || data.user || data)
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear all cached queries on logout
      queryClient.clear()
      localStorage.removeItem('accessToken')
      setUser(null)
      window.location.href = '/login'
    }
  }

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authService.getProfile()
      setUser(data.data?.user || data.user || data)
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
