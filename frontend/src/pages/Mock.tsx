import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  Target,
  Layers,
  Clock,
  Trophy,
  Play,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Flame,
  Users,
} from 'lucide-react'
import {
  useMockStats,
  useActiveMock,
  useMockHistory,
  useMockLeaderboard,
  useGenerateMock,
  useStartMock,
} from '../hooks/useMock'
import Button from '../components/ui/Button'
import { cn } from '../lib/utils'

// Company logos/names for mock selection
const COMPANIES = [
  { id: 'amazon', name: 'Amazon', color: '#FF9900' },
  { id: 'microsoft', name: 'Microsoft', color: '#00A4EF' },
  { id: 'google', name: 'Google', color: '#4285F4' },
  { id: 'meta', name: 'Meta', color: '#1877F2' },
  { id: 'apple', name: 'Apple', color: '#A2AAAD' },
  { id: 'netflix', name: 'Netflix', color: '#E50914' },
]

const DIFFICULTIES = [
  { id: 'easy', name: 'Easy', color: '#238636', problems: 3 },
  { id: 'medium', name: 'Medium', color: '#d29922', problems: 3 },
  { id: 'hard', name: 'Hard', color: '#da3633', problems: 3 },
]

const PATTERNS = [
  { id: 'two-pointers', name: 'Two Pointers' },
  { id: 'sliding-window', name: 'Sliding Window' },
  { id: 'binary-search', name: 'Binary Search' },
  { id: 'dynamic-programming', name: 'Dynamic Programming' },
  { id: 'greedy', name: 'Greedy' },
  { id: 'backtracking', name: 'Backtracking' },
  { id: 'graph', name: 'Graph/BFS/DFS' },
  { id: 'tree', name: 'Trees' },
]

type MockType = 'company' | 'difficulty' | 'pattern'

export default function Mock() {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState<MockType>('company')
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [selectedPattern, setSelectedPattern] = useState<string>('')
  const [problemCount, setProblemCount] = useState(3)
  const [timeLimit, setTimeLimit] = useState(60)

  // Queries
  const { data: stats, isLoading: statsLoading } = useMockStats()
  const { data: activeMock } = useActiveMock()
  const { data: history } = useMockHistory({ limit: 5 })
  const { data: leaderboard } = useMockLeaderboard({ limit: 5 })

  // Mutations
  const generateMock = useGenerateMock()
  const startMock = useStartMock()

  const handleGenerateMock = async () => {
    const data: any = {
      type: selectedType,
      problemCount,
      timeLimit,
    }

    if (selectedType === 'company' && selectedCompany) {
      data.company = selectedCompany
    } else if (selectedType === 'difficulty' && selectedDifficulty) {
      data.difficulty = selectedDifficulty
    } else if (selectedType === 'pattern' && selectedPattern) {
      data.pattern = selectedPattern
    } else {
      return // No selection made
    }

    try {
      const mock = await generateMock.mutateAsync(data)
      // Auto-start the generated mock
      await startMock.mutateAsync(mock._id)
      navigate(`/app/mock/${mock._id}`)
    } catch (error) {
      console.error('Failed to generate mock:', error)
    }
  }

  const handleResumeMock = () => {
    if (activeMock?._id) {
      navigate(`/app/mock/${activeMock._id}`)
    }
  }

  const isGenerateDisabled = () => {
    if (selectedType === 'company' && !selectedCompany) return true
    if (selectedType === 'difficulty' && !selectedDifficulty) return true
    if (selectedType === 'pattern' && !selectedPattern) return true
    return generateMock.isPending || startMock.isPending
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Mock Interviews
          </h1>
          <p className="text-muted-foreground mt-2">
            Practice timed interviews with curated problems
          </p>
        </div>

        {/* Active Mock Alert */}
        {activeMock && activeMock.status === 'in_progress' && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  You have an active mock interview
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeMock.config.problemCount} problems •{' '}
                  {activeMock.config.timeLimit} min
                </p>
              </div>
            </div>
            <Button onClick={handleResumeMock}>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Target className="h-4 w-4" />
              <span className="text-sm">Total Mocks</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {statsLoading ? '...' : stats?.totalMocks || 0}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">Completed</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {statsLoading ? '...' : stats?.completedMocks || 0}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Best Score</span>
            </div>
            <div className="text-2xl font-bold text-yellow-500">
              {statsLoading ? '...' : stats?.bestScore?.toFixed(0) || 0}%
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Avg Time/Problem</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {statsLoading
                ? '...'
                : stats?.averageTimePerProblem?.toFixed(1) || 0}
              m
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mock Generation Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Type Selection Tabs */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Start New Mock Interview
              </h2>

              {/* Type Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setSelectedType('company')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                    selectedType === 'company'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  By Company
                </button>
                <button
                  onClick={() => setSelectedType('difficulty')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                    selectedType === 'difficulty'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  <Target className="h-4 w-4" />
                  By Difficulty
                </button>
                <button
                  onClick={() => setSelectedType('pattern')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                    selectedType === 'pattern'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  <Layers className="h-4 w-4" />
                  By Pattern
                </button>
              </div>

              {/* Company Selection */}
              {selectedType === 'company' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {COMPANIES.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => setSelectedCompany(company.id)}
                      className={cn(
                        'p-4 rounded-lg border text-left transition-all hover:shadow-md',
                        selectedCompany === company.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-muted-foreground/50',
                      )}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mb-2"
                        style={{ backgroundColor: company.color }}
                      >
                        {company.name[0]}
                      </div>
                      <div className="font-medium text-foreground">
                        {company.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Difficulty Selection */}
              {selectedType === 'difficulty' && (
                <div className="grid grid-cols-3 gap-3">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff.id}
                      onClick={() => setSelectedDifficulty(diff.id)}
                      className={cn(
                        'p-4 rounded-lg border text-center transition-all hover:shadow-md',
                        selectedDifficulty === diff.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-muted-foreground/50',
                      )}
                    >
                      <div
                        className="text-2xl font-bold mb-1"
                        style={{ color: diff.color }}
                      >
                        {diff.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {diff.problems} problems
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Pattern Selection */}
              {selectedType === 'pattern' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PATTERNS.map((pattern) => (
                    <button
                      key={pattern.id}
                      onClick={() => setSelectedPattern(pattern.id)}
                      className={cn(
                        'p-3 rounded-lg border text-center transition-all hover:shadow-md',
                        selectedPattern === pattern.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-muted-foreground/50',
                      )}
                    >
                      <div className="font-medium text-foreground text-sm">
                        {pattern.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Settings */}
              <div className="mt-6 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">
                    Problems:
                  </label>
                  <select
                    value={problemCount}
                    onChange={(e) => setProblemCount(Number(e.target.value))}
                    className="bg-muted border border-border rounded px-3 py-1.5 text-sm text-foreground"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">
                    Time Limit:
                  </label>
                  <select
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="bg-muted border border-border rounded px-3 py-1.5 text-sm text-foreground"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
                <Button
                  onClick={handleGenerateMock}
                  disabled={isGenerateDisabled()}
                  className="ml-auto"
                >
                  {generateMock.isPending || startMock.isPending ? (
                    'Generating...'
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Mock
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Mock History */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Recent Mocks
                </h2>
                <Link
                  to="/app/mock/history"
                  className="text-sm text-primary hover:underline"
                >
                  View All
                </Link>
              </div>

              {history?.mocks?.length > 0 ? (
                <div className="space-y-3">
                  {history.mocks.map((mock: any) => (
                    <div
                      key={mock._id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            mock.status === 'completed'
                              ? 'bg-primary/20'
                              : mock.status === 'abandoned'
                                ? 'bg-destructive/20'
                                : 'bg-muted',
                          )}
                        >
                          {mock.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-foreground capitalize">
                            {mock.type}:{' '}
                            {mock.config.company ||
                              mock.config.difficulty ||
                              mock.config.pattern}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {mock.score?.problemsSolved || 0}/
                            {mock.config.problemCount} solved
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">
                          {mock.score?.totalScore?.toFixed(0) || 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(mock.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No mock interviews yet</p>
                  <p className="text-sm">Start your first mock above!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Leaderboard */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Leaderboard
                </h2>
              </div>

              {leaderboard?.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry: any, index: number) => (
                    <div
                      key={entry.user._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                          index === 0
                            ? 'bg-yellow-500 text-black'
                            : index === 1
                              ? 'bg-gray-400 text-black'
                              : index === 2
                                ? 'bg-amber-600 text-white'
                                : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {entry.user.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.completedMocks} mocks
                        </div>
                      </div>
                      <div className="text-sm font-bold text-primary">
                        {entry.score?.toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No leaderboard data yet</p>
                </div>
              )}
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  Start with easier mocks to build confidence
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  Practice under time pressure regularly
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  Focus on patterns to improve faster
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
