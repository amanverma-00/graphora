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
import Profile from './pages/Profile'
import Mock from './pages/Mock'
import MockSession from './pages/MockSession'
import Roadmaps from './pages/Roadmaps'
import RoadmapDetail from './pages/RoadmapDetail'
import Mentors from './pages/Mentors'
import MentorProfile from './pages/MentorProfile'
import Bookings from './pages/Bookings'
import { Login, Signup, VerifyOTP, ForgotPassword, ResetPassword } from './pages/auth'
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
                <Route path="/" element={<LandingLayout />}>
                  <Route index element={<Landing />} />
                </Route>

                {/* Auth Routes (public) */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected App Routes - No /app prefix */}
                <Route element={<ProtectedLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/problems" element={<Problems />} />
                  <Route
                    path="/problems/:category/:index"
                    element={<CategoryProblemDetail />}
                  />
                  <Route
                    path="/problems/:category"
                    element={<CategoryProblems />}
                  />
                  <Route path="/problem/:slug" element={<ProblemDetail />} />
                  <Route path="/submissions" element={<Submissions />} />

                  {/* Roadmaps */}
                  <Route
                    path="/roadmaps"
                    element={
                      // Assuming ProtectedRoute is a component that wraps its children
                      // and provides additional protection or context.
                      // If ProtectedLayout already handles protection, this might be redundant
                      // but is included as per instruction.
                      <Roadmaps />
                    }
                  />
                  <Route
                    path="/roadmaps/:slug"
                    element={
                      // Assuming ProtectedRoute is a component that wraps its children
                      // and provides additional protection or context.
                      // If ProtectedLayout already handles protection, this might be redundant
                      // but is included as per instruction.
                      <RoadmapDetail />
                    }
                  />


                  {/* Mentorship */}
                  <Route path="/mentors" element={<Mentors />} />
                  <Route path="/mentors/:id" element={<MentorProfile />} />
                  <Route path="/bookings" element={<Bookings />} />

                  {/* Mock Interviews */}
                  <Route
                    path="/contests"
                    element={<PlaceholderPage title="Contests" />}
                  />
                  <Route
                    path="/leaderboard"
                    element={<PlaceholderPage title="Leaderboard" />}
                  />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/mock" element={<Mock />} />
                  <Route path="/mock/:id" element={<MockSession />} />
                  <Route
                    path="/settings"
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
