import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider, AuthProvider } from './context'
import { ProtectedLayout } from './components/layout'
import { ErrorBoundary } from './components/common'


// Pages
import Dashboard from './pages/Dashboard'
import Problems from './pages/Problems'
import CategoryProblems from './pages/CategoryProblems'
import CategoryProblemDetail from './pages/CategoryProblemDetail'
import ProblemDetail from './pages/ProblemDetail'
import { Login, Signup, VerifyOTP } from './pages/auth'
import LandingLayout from './layouts/LandingLayout'
import Landing from './pages/Landing'

// Legacy pages (to be migrated)
import Submissions from './pages/Submissions'

import './App.css'

// Create React Query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/**
 * Main App Component
 *
 * Features:
 * - React Query for data fetching
 * - Theme provider for dark/light mode
 * - Auth provider for user authentication
 * - Protected routes for authenticated pages
 * - Toast notifications
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                {/* Public Landing Page */}
                <Route path="/welcome" element={<LandingLayout />}>
                  <Route index element={<Landing />} />
                </Route>

                {/* Auth Routes (public) */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />

                {/* Protected App Routes */}
                <Route path="/" element={<ProtectedLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="problems" element={<Problems />} />
                  <Route
                    path="problems/:category/:index"
                    element={<CategoryProblemDetail />}
                  />
                  <Route
                    path="problems/:category"
                    element={<CategoryProblems />}
                  />
                  <Route path="problem/:slug" element={<ProblemDetail />} />
                  <Route path="submissions" element={<Submissions />} />

                  {/* Placeholder routes */}
                  <Route
                    path="contests"
                    element={<PlaceholderPage title="Contests" />}
                  />
                  <Route
                    path="leaderboard"
                    element={<PlaceholderPage title="Leaderboard" />}
                  />
                  <Route
                    path="profile"
                    element={<PlaceholderPage title="Profile" />}
                  />
                  <Route
                    path="settings"
                    element={<PlaceholderPage title="Settings" />}
                  />
                </Route>

                {/* Redirect unknown routes */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>

            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                },
                success: {
                  iconTheme: {
                    primary: 'hsl(142 76% 36%)',
                    secondary: 'white',
                  },
                },
                error: {
                  iconTheme: {
                    primary: 'hsl(0 84.2% 60.2%)',
                    secondary: 'white',
                  },
                },
              }}
            />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

/**
 * Placeholder component for routes not yet implemented
 */
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground mt-2">This page is coming soon!</p>
    </div>
  )
}

export default App
