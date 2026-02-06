import { Link, Navigate } from 'react-router-dom'
import {
  Code2,
  Award,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Target,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import LogoMarquee from '../components/LogoMarquee'

export default function Landing() {
  const { isAuthenticated } = useAuth()
  const landingRef = useRef<HTMLDivElement | null>(null)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    const el = landingRef.current
    if (!el) return

    let scheduled = false

    const update = () => {
      scheduled = false

      const doc = document.documentElement
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight)
      const raw = window.scrollY / maxScroll

      // Reveal the gradient mostly in the lower part of the page.
      const start = 0.18
      const end = 0.65
      const progress = Math.min(1, Math.max(0, (raw - start) / (end - start)))

      el.style.setProperty('--landing-scroll', progress.toFixed(4))
    }

    const onScroll = () => {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div ref={landingRef} className="min-h-screen landing-scroll-gradient">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#238636]/10 via-background to-background -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(35,134,54,0.1),transparent_50%)] -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Master Coding.
              <br />
              <span className="text-primary">Land Your Dream Job.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Join millions of developers preparing for technical interviews,
              solving real-world challenges, and advancing their careers with
              Graphora.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-6"
                >
                  Start Practicing Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-lg px-8 py-6"
                >
                  For Companies
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Free Forever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>1000+ Coding Problems</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>AI-Powered Learning</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-5xl font-bold text-primary mb-2">10M+</div>
              <div className="text-lg text-muted-foreground">
                Active Developers
              </div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-primary mb-2">1000+</div>
              <div className="text-lg text-muted-foreground">
                Coding Challenges
              </div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-primary mb-2">500+</div>
              <div className="text-lg text-muted-foreground">
                Partner Companies
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From interview preparation to career advancement, we've got you
              covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="group relative p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Code2 className="h-7 w-7 text-primary group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Interview Preparation
                </h3>
                <p className="text-muted-foreground mb-6">
                  Practice with 1000+ coding problems across multiple difficulty
                  levels. Get detailed solutions, time complexity analysis, and
                  AI-powered hints.
                </p>
                <Link
                  to="/problems"
                  className="inline-flex items-center text-primary hover:underline font-medium"
                >
                  Start Practicing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Target className="h-7 w-7 text-primary group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Company Challenges
                </h3>
                <p className="text-muted-foreground mb-6">
                  Solve real-world problems from top tech companies. Practice
                  with actual interview questions and boost your chances of
                  getting hired.
                </p>
                <Link
                  to="/problems"
                  className="inline-flex items-center text-primary hover:underline font-medium"
                >
                  Explore Companies
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Award className="h-7 w-7 text-primary group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Skill Certification
                </h3>
                <p className="text-muted-foreground mb-6">
                  Earn certificates in algorithms, data structures, and more.
                  Showcase your skills to potential employers and stand out from
                  the crowd.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center text-primary hover:underline font-medium"
                >
                  Get Certified
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <TrendingUp className="h-7 w-7 text-primary group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Career Growth
                </h3>
                <p className="text-muted-foreground mb-6">
                  Track your progress, compete in contests, and climb the
                  leaderboard. Build a portfolio that demonstrates your coding
                  expertise.
                </p>
                <Link
                  to="/profile"
                  className="inline-flex items-center text-primary hover:underline font-medium"
                >
                  View Your Progress
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Marquee */}
      <LogoMarquee />

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join millions of developers who are mastering their coding skills
            and landing their dream jobs with Graphora.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/problems">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg px-8 py-6"
              >
                Browse Problems
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
