import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config

    // Log network errors for debugging
    if (!error.response) {
      console.error('Network Error:', {
        message: error.message,
        url: originalRequest?.url,
        baseURL: originalRequest?.baseURL,
      })
    }

    // If 401 Unauthorized, redirect to login
    if (error.response?.status === 401) {
      // Only redirect if not already on login/signup pages
      const currentPath = window.location.pathname
      if (!['/login', '/signup', '/verify-otp'].includes(currentPath)) {
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

export default api

// API Services
export const authService = {
  login: (emailOrUsername: string, password: string) =>
    api.post('/auth/login', { emailOrUsername, password }),

  register: (data: {
    name: string
    username: string
    email: string
    password: string
    passwordConfirm: string
  }) => api.post('/auth/register', data),

  verifyOTP: (email: string, otp: string) =>
    api.post('/auth/verify-otp', { email, otp }),

  resendOTP: (email: string) => api.post('/auth/resend-otp', { email }),

  logout: () => api.post('/auth/logout'),

  getProfile: () => api.get('/auth/profile'),

  updateProfile: (data: {
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
  }) => api.patch('/auth/profile', data),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { oldPassword, newPassword }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string, passwordConfirm: string) =>
    api.post('/auth/reset-password', { token, password, passwordConfirm }),
}

export const problemService = {
  getProblems: (params?: Record<string, unknown>) =>
    api.get('/problems', { params }),

  getProblemsByCategory: (category: string, params?: Record<string, unknown>) =>
    api.get(`/problems/category/${category}`, { params }),

  getProblemsByCompany: (company: string, params?: Record<string, unknown>) =>
    api.get(`/problems/company/${company}`, { params }),

  getSolvedProblems: (params?: Record<string, unknown>) =>
    api.get('/problems/user/solved', { params }),

  // Backend supports both Mongo _id and slug on the same route: GET /api/problems/:id
  getProblemBySlug: (slug: string) => api.get(`/problems/${slug}`),

  getProblemById: (id: string) => api.get(`/problems/${id}`),

  getSubmissionsForProblem: (problemId: string) =>
    api.get(`/problems/${problemId}/submissions`),

  generateMockProblems: (data: {
    type: 'company' | 'difficulty' | 'pattern' | 'custom'
    company?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    pattern?: string
    problemCount?: number
  }) => api.post('/problems/generate-mock', data),
}

export const submissionService = {
  // Submit code for a specific problem
  submitCode: (
    problemId: string,
    data: {
      code: string
      language: string
      mockSessionId?: string
    },
  ) => api.post(`/submit/submit/${problemId}`, data),

  // Run code without saving (for testing)
  runCode: (
    problemId: string,
    data: {
      code: string
      language: string
      customInput?: string
    },
  ) => api.post(`/submit/run/${problemId}`, data),

  // Get recent submissions across all problems
  getRecentSubmissions: (params?: {
    page?: number
    limit?: number
    status?: string
  }) => api.get('/submit/recent', { params }),

  // Get submission history for a specific problem
  getSubmissionHistory: (problemId: string) =>
    api.get(`/submit/history/${problemId}`),

  // Get a single submission by ID
  getSubmissionById: (submissionId: string) =>
    api.get(`/submit/submission/${submissionId}`),
}

export const mockService = {
  // Generate a new mock session
  generate: (data: {
    type: 'company' | 'difficulty' | 'pattern' | 'custom'
    company?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    pattern?: string
    problemCount?: number
    timeLimit?: number
  }) => api.post('/mocks/generate', data),

  // Start / manage a mock session
  start: (sessionId: string) => api.post(`/mocks/${sessionId}/start`),
  switchProblem: (
    sessionId: string,
    data: { fromOrder: number; toOrder: number },
  ) => api.post(`/mocks/${sessionId}/switch-problem`, data),
  complete: (sessionId: string) => api.post(`/mocks/${sessionId}/complete`),
  abandon: (sessionId: string) => api.post(`/mocks/${sessionId}/abandon`),

  // Read-only mock endpoints
  getStats: () => api.get('/mocks/stats'),
  getActive: () => api.get('/mocks/active'),
  getHistory: (params?: {
    page?: number
    limit?: number
    type?: 'company' | 'difficulty' | 'pattern' | 'custom'
    status?: 'completed' | 'abandoned' | 'expired'
  }) => api.get('/mocks/history', { params }),
  getLeaderboard: (params?: {
    type?: 'company' | 'difficulty' | 'pattern' | 'custom'
    company?: string
    timeframe?: 'all' | 'week' | 'month'
    limit?: number
  }) => api.get('/mocks/leaderboard', { params }),
  getSession: (sessionId: string) => api.get(`/mocks/${sessionId}`),
}
