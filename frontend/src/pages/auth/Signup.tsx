import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Code2,
  Loader2,
  Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

/**
 * Signup Page - Modern centered card design
 */
export default function Signup() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Password strength checks
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (passwordStrength < 5) {
      setError(
        'Password must include uppercase, lowercase, number, and special character',
      )
      return
    }

    setIsLoading(true)

    try {
      await authService.register({
        name,
        username,
        email,
        password,
        passwordConfirm: confirmPassword,
      })
      toast.success('Verification code sent to your email!')
      navigate('/verify-otp', { state: { email } })
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } }
        message?: string
      }
      setError(
        error.response?.data?.message || error.message || 'Registration failed',
      )
      toast.error('Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="bg-primary p-2 rounded-xl group-hover:opacity-90 transition-opacity">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">Graphora</span>
          </Link>
        </div>

        {/* Signup Card */}
        <div className="bg-card border border-border rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              Create your account
            </h1>
            <p className="text-muted-foreground mt-1">
              Start your coding journey today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  @
                </span>
                <Input
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                    )
                  }
                  className="pl-8"
                  required
                  minLength={3}
                  maxLength={30}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Only letters, numbers, and underscores
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2 mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-colors',
                          passwordStrength >= level
                            ? passwordStrength === 5
                              ? 'bg-green-500'
                              : passwordStrength >= 4
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            : 'bg-muted',
                        )}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {[
                      { key: 'length', label: '8+ characters' },
                      { key: 'uppercase', label: 'Uppercase' },
                      { key: 'lowercase', label: 'Lowercase' },
                      { key: 'number', label: 'Number' },
                      { key: 'special', label: 'Special char (!@#$)' },
                    ].map((check) => (
                      <div
                        key={check.key}
                        className={cn(
                          'flex items-center gap-1',
                          passwordChecks[
                            check.key as keyof typeof passwordChecks
                          ]
                            ? 'text-green-500'
                            : 'text-muted-foreground',
                        )}
                      >
                        <Check className="h-3 w-3" />
                        {check.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    'pl-10',
                    confirmPassword &&
                    password !== confirmPassword &&
                    'border-destructive',
                  )}
                  required
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>

            {/* Submit Button */}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
