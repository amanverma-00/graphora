import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flag,
  Timer,
} from 'lucide-react'
import {
  useMockSession,
  useCompleteMock,
  useAbandonMock,
  useSwitchProblem,
} from '../hooks/useMock'
import Button from '../components/ui/Button'
import { cn } from '../lib/utils'

export default function MockSession() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)

  const { data: session, isLoading, error } = useMockSession(id || '')
  const completeMock = useCompleteMock()
  const abandonMock = useAbandonMock()
  const switchProblem = useSwitchProblem()

  // Timer logic
  useEffect(() => {
    if (!session || session.status !== 'in_progress') return

    const startTime = new Date(session.startedAt!).getTime()
    const endTime = startTime + session.config.timeLimit * 60 * 1000

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
      setTimeRemaining(remaining)

      if (remaining === 0) {
        // Auto-complete when time runs out
        handleComplete()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [session])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const getTimeColor = useCallback(() => {
    if (!timeRemaining) return 'text-foreground'
    const totalSeconds = (session?.config.timeLimit || 60) * 60
    const percentage = (timeRemaining / totalSeconds) * 100

    if (percentage <= 10) return 'text-red-500'
    if (percentage <= 25) return 'text-yellow-500'
    return 'text-foreground'
  }, [timeRemaining, session])

  const handleProblemSwitch = async (newIndex: number) => {
    if (!id || !session) return
    if (newIndex === currentProblemIndex) return
    if (newIndex < 0 || newIndex >= session.problems.length) return

    try {
      await switchProblem.mutateAsync({
        sessionId: id,
        fromOrder: currentProblemIndex + 1,
        toOrder: newIndex + 1,
      })
      setCurrentProblemIndex(newIndex)
    } catch (error) {
      console.error('Failed to switch problem:', error)
    }
  }

  const handleComplete = async () => {
    if (!id) return
    try {
      await completeMock.mutateAsync(id)
      navigate(`/app/mock/${id}/results`)
    } catch (error) {
      console.error('Failed to complete mock:', error)
    }
  }

  const handleAbandon = async () => {
    if (!id) return
    try {
      await abandonMock.mutateAsync(id)
      navigate('/app/mock')
    } catch (error) {
      console.error('Failed to abandon mock:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading mock session...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Session Not Found
          </h2>
          <p className="text-muted-foreground mb-4">
            This mock session doesn't exist or has expired.
          </p>
          <Button onClick={() => navigate('/app/mock')}>Back to Mocks</Button>
        </div>
      </div>
    )
  }

  if (
    session.status === 'completed' ||
    session.status === 'abandoned' ||
    session.status === 'expired'
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          {session.status === 'completed' ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Mock Completed!
              </h2>
              <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <div className="text-4xl font-bold text-primary mb-2">
                  {session.score?.totalScore?.toFixed(0) || 0}%
                </div>
                <p className="text-muted-foreground">
                  {session.score?.problemsSolved || 0} /{' '}
                  {session.config.problemCount} problems solved
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Mock {session.status === 'abandoned' ? 'Abandoned' : 'Expired'}
              </h2>
              <p className="text-muted-foreground mb-6">
                This mock interview has{' '}
                {session.status === 'abandoned' ? 'been abandoned' : 'expired'}.
              </p>
            </>
          )}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/app/mock')}>
              Back to Mocks
            </Button>
            <Button onClick={() => navigate('/app/mock')}>
              Start New Mock
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentProblem = session.problems[currentProblemIndex]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAbandonConfirm(true)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Exit
          </Button>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground capitalize">
              {session.type}
            </span>
            {session.config.company && `: ${session.config.company}`}
            {session.config.difficulty && `: ${session.config.difficulty}`}
            {session.config.pattern && `: ${session.config.pattern}`}
          </div>
        </div>

        {/* Timer */}
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 bg-muted rounded-lg font-mono text-lg font-bold',
            getTimeColor(),
          )}
        >
          <Timer className="h-5 w-5" />
          {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompleteConfirm(true)}
          >
            <Flag className="h-4 w-4 mr-1" />
            Finish Early
          </Button>
        </div>
      </div>

      {/* Problem Navigation */}
      <div className="bg-muted/30 border-b border-border px-4 py-2">
        <div className="flex items-center justify-center gap-2">
          {session.problems.map((problem: any, index: number) => (
            <button
              key={problem.order}
              onClick={() => handleProblemSwitch(index)}
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-all',
                currentProblemIndex === index
                  ? 'bg-primary text-primary-foreground'
                  : problem.solved
                    ? 'bg-primary/20 text-primary'
                    : 'bg-card border border-border text-foreground hover:border-primary/50',
              )}
            >
              {problem.solved ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Problem Section */}
        <div className="w-1/2 border-r border-border overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">
                {currentProblem?.problem?.title || 'Problem'}
              </h1>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  currentProblem?.problem?.difficulty === 'easy'
                    ? 'bg-green-500/20 text-green-500'
                    : currentProblem?.problem?.difficulty === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : 'bg-red-500/20 text-red-500',
                )}
              >
                {currentProblem?.problem?.difficulty || 'Unknown'}
              </span>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                Problem description will be loaded here based on the problem ID.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Navigate to the full problem page to see complete details and
                submit your solution.
              </p>
            </div>

            <div className="mt-6">
              <Button
                onClick={() => {
                  if (currentProblem?.problem?.slug) {
                    window.open(
                      `/app/problems/${currentProblem.problem.slug}`,
                      '_blank',
                    )
                  }
                }}
              >
                Open Full Problem
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Code Editor Section */}
        <div className="w-1/2 bg-[#1e1e1e] p-6 overflow-auto">
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-center mb-4">
              Click "Open Full Problem" to solve in the full editor.
            </p>
            <p className="text-sm text-center opacity-70">
              Your submissions will automatically be tracked for this mock
              session.
            </p>
          </div>
        </div>
      </div>

      {/* Problem Nav Buttons */}
      <div className="bg-card border-t border-border px-4 py-3 flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentProblemIndex === 0}
          onClick={() => handleProblemSwitch(currentProblemIndex - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Problem {currentProblemIndex + 1} of {session.problems.length}
        </span>
        <Button
          variant="outline"
          disabled={currentProblemIndex === session.problems.length - 1}
          onClick={() => handleProblemSwitch(currentProblemIndex + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Abandon Confirmation Modal */}
      {showAbandonConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <h3 className="text-lg font-bold text-foreground">
                Abandon Mock?
              </h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to abandon this mock interview? This action
              cannot be undone and will count as an incomplete attempt.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAbandonConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleAbandon}
                disabled={abandonMock.isPending}
              >
                {abandonMock.isPending ? 'Abandoning...' : 'Abandon'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Confirmation Modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Flag className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-bold text-foreground">
                Finish Mock Early?
              </h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to finish this mock interview early? You
              still have time remaining. Your current progress will be saved.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCompleteConfirm(false)}
              >
                Keep Going
              </Button>
              <Button
                onClick={handleComplete}
                disabled={completeMock.isPending}
              >
                {completeMock.isPending ? 'Finishing...' : 'Finish Now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
