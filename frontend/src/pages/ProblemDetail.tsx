import { useState, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from 'react-resizable-panels'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import toast from 'react-hot-toast'
import {
  Play,
  Send,
  Clock,
  MemoryStick,
  ChevronLeft,
  BookOpen,
  MessageSquare,
  Lightbulb,
  RotateCcw,
  Settings2,
  Maximize2,
  Timer,
  CheckCircle2,
} from 'lucide-react'
import { cn, STARTER_CODE, type LanguageValue } from '../lib/utils'
import { useProblem, useRunCode, useSubmitCode } from '../hooks'
import {
  CodeEditor,
  LanguageSelector,
  OutputConsole,
} from '../components/editor'
import { DifficultyBadge, TagPill } from '../components/problem'
import { ProblemDetailSkeleton } from '../components/common'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import type { RunCodeResult } from '../types'

// Tab options for the problem description panel
type DescriptionTab = 'description' | 'editorial' | 'discuss' | 'submissions'

/**
 * ProblemDetail - The core problem solving page with resizable split layout
 * Similar to HackerRank/LeetCode 2025 style
 */
export default function ProblemDetail() {
  const { slug } = useParams<{ slug: string }>()

  // Fetch problem data using React Query
  const { data: problem, isLoading, error } = useProblem(slug || '')

  // Code editor state
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState<LanguageValue>('javascript')
  const [activeTab, setActiveTab] = useState<DescriptionTab>('description')

  // Execution state
  const [testResult, setTestResult] = useState<RunCodeResult | null>(null)
  const [isConsoleOpen, setIsConsoleOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Timer for contest mode (optional)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Mutations
  const runCodeMutation = useRunCode()
  const submitCodeMutation = useSubmitCode()

  // Initialize code when problem loads or language changes
  useEffect(() => {
    if (problem) {
      // Try to get saved code from localStorage first
      const savedCode = localStorage.getItem(`code_${problem._id}_${language}`)
      if (savedCode) {
        setCode(savedCode)
      } else if (problem.starterCode && problem.starterCode[language]) {
        setCode(problem.starterCode[language])
      } else {
        // Use default starter code template
        setCode(STARTER_CODE[language] || '// Write your code here\n')
      }
    }
  }, [problem, language])

  // Save code to localStorage on change
  useEffect(() => {
    if (problem && code) {
      localStorage.setItem(`code_${problem._id}_${language}`, code)
    }
  }, [code, problem, language])

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleLanguageChange = useCallback((newLanguage: LanguageValue) => {
    setLanguage(newLanguage)
  }, [])

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode)
  }, [])

  const handleResetCode = useCallback(() => {
    if (problem?.starterCode && problem.starterCode[language]) {
      setCode(problem.starterCode[language])
    } else {
      setCode(STARTER_CODE[language] || '')
    }
    localStorage.removeItem(`code_${problem?._id}_${language}`)
    toast.success('Code reset to starter template')
  }, [problem, language])

  const handleRun = useCallback(async () => {
    if (!problem) return

    setIsConsoleOpen(true)
    setTestResult(null)

    try {
      const result = await runCodeMutation.mutateAsync({
        problemId: problem._id,
        language,
        code,
      })
      setTestResult(result)
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } }
        message?: string
      }
      setTestResult({
        success: false,
        error:
          err?.response?.data?.message || err?.message || 'Failed to run code',
      })
    }
  }, [problem, language, code, runCodeMutation])

  const handleSubmit = useCallback(async () => {
    if (!problem) return

    setIsConsoleOpen(true)
    setTestResult(null)

    try {
      const result = await submitCodeMutation.mutateAsync({
        problemId: problem._id,
        language,
        code,
      })
      setTestResult(result)

      if (result.success) {
        toast.success('🎉 All test cases passed!')
        setIsTimerRunning(false)
      } else {
        toast.error('Some test cases failed')
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } }
        message?: string
      }
      setTestResult({
        success: false,
        error:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to submit code',
      })
      toast.error('Submission failed')
    }
  }, [problem, language, code, submitCodeMutation])

  // Loading state
  if (isLoading) {
    return <ProblemDetailSkeleton />
  }

  // Error state
  if (error || !problem) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-6xl">😕</div>
        <h1 className="text-2xl font-bold">Problem not found</h1>
        <p className="text-muted-foreground">
          The problem you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/problems">
          <Button variant="primary">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Problems
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'h-full min-h-0 flex flex-col bg-background',
        isFullscreen && 'fixed inset-0 z-50',
      )}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/problems"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Problems</span>
          </Link>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
              {problem.title}
            </h1>
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-mono transition-colors',
              isTimerRunning
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Timer className="h-4 w-4" />
            {formatTime(timer)}
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Toggle fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Resizable Panel Layout */}
      <PanelGroup
        orientation="horizontal"
        className="flex-1 min-h-0 w-full min-w-0"
      >
        {/* Left Panel - Problem Description */}
        <Panel defaultSize={55} minSize={45} maxSize={70}>
          <div className="h-full min-w-0 flex flex-col bg-background overflow-hidden">
            {/* Description Tabs */}
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-border bg-card">
              {[
                { id: 'description', label: 'Description', icon: BookOpen },
                { id: 'editorial', label: 'Editorial', icon: Lightbulb },
                { id: 'discuss', label: 'Discuss', icon: MessageSquare },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DescriptionTab)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-auto p-5">
              {activeTab === 'description' && (
                <div className="space-y-6">
                  {/* Stats Bar */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {problem.timeLimit && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {problem.timeLimit}ms
                      </span>
                    )}
                    {problem.memoryLimit && (
                      <span className="flex items-center gap-1">
                        <MemoryStick className="h-4 w-4" />
                        {problem.memoryLimit}MB
                      </span>
                    )}
                    {problem.acceptanceRate !== undefined && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {problem.acceptanceRate.toFixed(1)}% acceptance
                      </span>
                    )}
                    {problem.totalSubmissions !== undefined && (
                      <span>
                        {problem.totalSubmissions.toLocaleString()} submissions
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {problem.topics && problem.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {problem.topics.map((topic) => (
                        <TagPill key={topic} tag={topic} />
                      ))}
                    </div>
                  )}

                  {/* Problem Description (Markdown) */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {problem.description}
                    </ReactMarkdown>
                  </div>

                  {/* Examples */}
                  {problem.examples && problem.examples.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground">
                        Examples
                      </h3>
                      {problem.examples.map((example, index) => (
                        <Card key={index} className="p-4 space-y-3">
                          <div className="text-sm font-medium text-muted-foreground">
                            Example {index + 1}
                          </div>
                          <div className="grid gap-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Input
                              </label>
                              <pre className="mt-1 p-3 rounded-md bg-muted text-sm font-mono overflow-x-auto">
                                {example.input}
                              </pre>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Output
                              </label>
                              <pre className="mt-1 p-3 rounded-md bg-muted text-sm font-mono overflow-x-auto">
                                {example.output}
                              </pre>
                            </div>
                            {example.explanation && (
                              <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Explanation
                                </label>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {example.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Constraints */}
                  {problem.constraints && problem.constraints.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">
                        Constraints
                      </h3>
                      <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                        {problem.constraints.map((constraint, index) => (
                          <li key={index}>
                            <code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">
                              {constraint}
                            </code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Company Tags */}
                  {problem.company && problem.company.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground text-sm">
                        Asked by
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {problem.company.map((company) => (
                          <span
                            key={company}
                            className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-md"
                          >
                            {company}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'editorial' && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Lightbulb className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-foreground">
                    Editorial Coming Soon
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Detailed solution explanations will be available here.
                  </p>
                </div>
              )}

              {activeTab === 'discuss' && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-foreground">Discussion</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Community discussions and hints will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/50 active:bg-primary transition-colors cursor-col-resize" />

        {/* Right Panel - Code Editor */}
        <Panel defaultSize={45} minSize={30}>
          <div className="h-full min-w-0 flex flex-col bg-card overflow-hidden">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 shrink-0">
              <div className="flex items-center gap-3">
                <LanguageSelector
                  value={language}
                  onChange={handleLanguageChange}
                />

                <button
                  onClick={handleResetCode}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                  title="Reset to starter code"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>

                <button
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                  title="Editor settings"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRun}
                  disabled={
                    runCodeMutation.isPending || submitCodeMutation.isPending
                  }
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <Play className="h-4 w-4" />
                  {runCodeMutation.isPending ? 'Running...' : 'Run'}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    runCodeMutation.isPending || submitCodeMutation.isPending
                  }
                  size="sm"
                  className="gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  {submitCodeMutation.isPending ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>

            {/* Code Editor & Console */}
            <PanelGroup
              orientation="vertical"
              className="flex-1 min-h-0 min-w-0"
            >
              {/* Editor */}
              <Panel defaultSize={60} minSize={30} maxSize={85}>
                <CodeEditor
                  value={code}
                  onChange={handleCodeChange}
                  language={language}
                  className="h-full min-h-0 min-w-0"
                  height="100%"
                />
              </Panel>

              {/* Console - Always visible */}
              <PanelResizeHandle className="h-1.5 bg-border hover:bg-primary/50 active:bg-primary transition-colors cursor-row-resize" />
              <Panel defaultSize={40} minSize={15} maxSize={70}>
                <OutputConsole
                  result={testResult}
                  isLoading={
                    runCodeMutation.isPending ||
                    submitCodeMutation.isPending
                  }
                  className="h-full"
                  problem={problem}
                />
              </Panel>
            </PanelGroup>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}
