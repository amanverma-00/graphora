import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { authService } from '../../services/api'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [isSubmitted, setIsSubmitted] = useState(false)

    const mutation = useMutation({
        mutationFn: (email: string) => authService.forgotPassword(email),
        onSuccess: () => {
            setIsSubmitted(true)
            toast.success('Password reset instructions sent to your email')
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to send reset email')
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            toast.error('Please enter your email address')
            return
        }

        mutation.mutate(email)
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-card border border-border rounded-2xl shadow-2xl p-8">
                        {/* Success Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                                <Mail className="h-8 w-8 text-primary" />
                            </div>
                        </div>

                        {/* Success Message */}
                        <h1 className="text-2xl font-bold text-center text-foreground mb-3">
                            Check Your Email
                        </h1>
                        <p className="text-center text-muted-foreground mb-6">
                            If an account exists with <strong>{email}</strong>, you will receive password reset instructions shortly.
                        </p>

                        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
                            <p className="text-sm text-muted-foreground">
                                <strong>Note:</strong> The email may take a few minutes to arrive. Check your spam folder if you don't see it.
                            </p>
                        </div>

                        {/* Back to Login */}
                        <Link to="/login">
                            <Button className="w-full" size="lg">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Login
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
                            Forgot Password?
                        </h1>
                        <p className="text-muted-foreground">
                            Enter your email and we'll send you instructions to reset your password
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    disabled={mutation.isPending}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Instructions'
                            )}
                        </Button>
                    </form>

                    {/* Back to Login Link */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
