import { Link } from 'react-router-dom'
import {
  Flame,
  Target,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Code2,
  Zap,
  Calendar,
} from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { cn, formatRelativeTime } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useRecentSubmissions, useProblems, useMockStats } from '../hooks'
import { StatusBadge, ProblemCard } from '../components/problem'
import { Skeleton } from '../components/common'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

// Sample skill data for radar chart
const skillData = [
  { skill: 'Arrays', value: 80, fullMark: 100 },
  { skill: 'Strings', value: 65, fullMark: 100 },
  { skill: 'DP', value: 45, fullMark: 100 },
  { skill: 'Trees', value: 70, fullMark: 100 },
  { skill: 'Graphs', value: 35, fullMark: 100 },
  { skill: 'Math', value: 55, fullMark: 100 },
]

// Sample activity data for area chart
const activityData = [
  { day: 'Mon', problems: 3 },
  { day: 'Tue', problems: 5 },
  { day: 'Wed', problems: 2 },
  { day: 'Thu', problems: 4 },
  { day: 'Fri', problems: 6 },
  { day: 'Sat', problems: 1 },
  { day: 'Sun', problems: 3 },
]

/**
 * Dashboard - Main home page after login
 * Shows user stats, skill progress, recommended problems, and recent activity
 */
export default function Dashboard() {
  const { user } = useAuth()
  const { data: recentData, isLoading: submissionsLoading } =
    useRecentSubmissions({ limit: 5 })
  const recentSubmissions = recentData?.submissions
  const { data: recommendedProblems, isLoading: problemsLoading } = useProblems(
    {
      difficulty: 'easy',
      limit: 4,
    },
  )
  const { data: mockStats } = useMockStats()

  const stats = [
    {
      label: 'Problems Solved',
      value: user?.stats?.acceptedSubmissions || 0,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Mock Interviews',
      value: mockStats?.completedMocks || 0,
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Total Submissions',
      value: user?.stats?.totalSubmissions || 0,
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Accuracy',
      value: `${Math.round(user?.stats?.accuracy || 0)}%`,
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ]

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Developer'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to solve some problems today? Let's keep that streak going!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Current Streak</p>
              <p className="text-lg font-bold text-orange-500">
                {user?.streak || 7} days
              </p>
            </div>
          </div>
          <Link to="/problems">
            <Button className="gap-2">
              <Zap className="h-4 w-4" />
              Start Solving
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
              <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground mt-2">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Weekly Activity</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                This Week
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient
                      id="colorProblems"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="problems"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProblems)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recommended Problems */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                Recommended for You
              </h2>
              <Link
                to="/problems"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {problemsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : recommendedProblems && recommendedProblems.length > 0 ? (
              <div className="space-y-3">
                {recommendedProblems.slice(0, 4).map((problem) => (
                  <ProblemCard
                    key={problem._id}
                    problem={problem}
                    variant="compact"
                    showTags={false}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Code2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recommendations yet. Start solving problems!</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Skill Chart & Recent Activity */}
        <div className="space-y-6">
          {/* Skill Radar Chart */}
          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-4">
              Skill Progress
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  data={skillData}
                >
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 11,
                    }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 10,
                    }}
                  />
                  <Radar
                    name="Skills"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent Submissions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                Recent Submissions
              </h2>
              <Link
                to="/submissions"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {submissionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : recentSubmissions && recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {recentSubmissions.map((submission) => (
                  <div
                    key={submission._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/problem/${submission.problem?.slug || submission.problemId}`}
                        className="font-medium text-sm text-foreground hover:text-primary truncate block"
                      >
                        {submission.problem?.title || 'Problem'}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground capitalize">
                          {submission.language}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(submission.createdAt)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={submission.status} showIcon={true} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No submissions yet</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/20">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Ready for a Challenge?
              </h3>
              <p className="text-sm text-muted-foreground">
                Take on today's daily challenge and earn bonus points!
              </p>
            </div>
          </div>
          <Link to="/problems">
            <Button className="gap-2">
              Start Daily Challenge
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
