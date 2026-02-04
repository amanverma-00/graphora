import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { authService } from '../../services/api'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

export default function ResetPassword() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [password, setPassword] = useState('')
    const [passwordConfirm, setPasswordConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const token = searchParams.get('token')

    useEffect(() => {
        if (!token) {
            toast.error('Invalid reset link. Please request a new password reset.')
            navigate('/forgot-password')
        }
    }, [token, navigate])

    const mutation = useMutation({
        mutationFn: (data: { token: string; password: string; passwordConfirm: string }) =>
            authService.resetPassword(data),
        onSuccess: () => {
            setIsSuccess(true)
            toast.success('Password reset successfully!')
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login')
            }, 3000)
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message || 'Failed to reset password. The link may have expired.'
            )
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long')
            return
        }

        if (password !== passwordConfirm) {
            toast.error('Passwords do not match')
            return
        }

        if (!token) {
            toast.error('Invalid reset token')
            return
        }

        mutation.mutate({ token, password, passwordConfirm })
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-card border border-border rounded-2xl shadow-2xl p-8">
                        {/* Success Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                        </div>

                        {/* Success Message */}
                        <h1 className="text-2xl font-bold text-center text-foreground mb-3">
                            Password Reset Complete!
                        </h1>
                        <p className="text-center text-muted-foreground mb-6">
                            Your password has been successfully reset. You can now log in with your new password.
                        </p>

                        {/* Redirecting Message */}
                        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
                            <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Redirecting to login page...
                            </p>
                        </div>

                        {/* Manual Link */}
                        <Link to="/login">
                            <Button className="w-full" size="lg">
                                Go to Login Now
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-card border border-border rounded-2xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Reset Password
                        </h1>
                        <p className="text-muted-foreground">
                            Choose a strong password for your account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    disabled={mutation.isPending}
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Must be at least 8 characters long
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-foreground mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    id="passwordConfirm"
                                    type={showPasswordConfirm ? 'text' : 'password'}
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    disabled={mutation.isPending}
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPasswordConfirm ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Password Match Indicator */}
                        {password && passwordConfirm && (
                            <div
                                className={`flex items-center gap-2 text-sm ${password === passwordConfirm
                                    ? 'text-green-500'
                                    : 'text-destructive'
                                    }`}
                            >
                                {password === passwordConfirm ? (
                                    <>
                                        <CheckCircle className="h-4 w-4" />
                                        Passwords match
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-4 w-4" />
                                        Passwords do not match
                                    </>
                                )}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={mutation.isPending || password !== passwordConfirm}
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Resetting Password...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </form>

                    {/* Back to Login Link */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
