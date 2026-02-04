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
  ChevronLeft,
  BookOpen,
  MessageSquare,
  Lightbulb,
  Maximize2,
  Timer,
  CheckCircle2,
} from 'lucide-react'
import { cn, STARTER_CODE, type LanguageValue } from '../lib/utils'
import { useProblem, useRunCode, useSubmitCode } from '../hooks'
import {
  CustomCodeEditor,
  OutputConsole,
} from '../components/editor'
import { DifficultyBadge } from '../components/problem'
import { ProblemDetailSkeleton } from '../components/common'
import Button from '../components/ui/Button'
import type { RunCodeResult } from '../types'

// Tab options for the problem description panel
type DescriptionTab = 'description' | 'solutions' | 'submissions' | 'aichat'

// Tab options for the right panel (editor area)
type EditorTab = 'code' | 'testcases' | 'results'

/**
 * ProblemDetail - The core problem solving page with resizable split layout
 * Re-implemented from scratch to match reference design with dark theme
 */
export default function ProblemDetail() {
  const { slug } = useParams<{ slug: string }>()

  // Fetch problem data using React Query
  const { data: problem, isLoading, error } = useProblem(slug || '')

  // Code editor state
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState<LanguageValue>('javascript')
  const [activeTab, setActiveTab] = useState<DescriptionTab>('description')
  const [editorTab, setEditorTab] = useState<EditorTab>('code')

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
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d] bg-[#161b22] shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/problems"
            className="flex items-center gap-1 text-sm text-[#8b949e] hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Problems</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-mono transition-colors',
              isTimerRunning
                ? 'bg-[#238636]/20 text-[#238636]'
                : 'text-[#8b949e] hover:text-white',
            )}
          >
            <Timer className="h-4 w-4" />
            {formatTime(timer)}
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-md text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
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
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="h-full min-w-0 flex flex-col bg-[#0d1117] overflow-hidden">
            {/* Description Tabs */}
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-[#30363d] bg-[#161b22]">
              {[
                { id: 'description', label: 'Description', icon: BookOpen },
                { id: 'solutions', label: 'Solutions', icon: Lightbulb },
                { id: 'submissions', label: 'Submissions', icon: CheckCircle2 },
                { id: 'aichat', label: 'AI Chat', icon: MessageSquare },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DescriptionTab)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                    activeTab === tab.id
                      ? 'border-[#238636] text-[#238636]'
                      : 'border-transparent text-[#8b949e] hover:text-white',
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-auto p-5 bg-[#0d1117]">
              {activeTab === 'description' && (
                <div className="space-y-6">
                  {/* Problem Title with Badge */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl font-bold text-white">
                      {problem.title}
                    </h1>
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </div>

                  {/* Problem Description (Markdown) */}
                  <div className="prose prose-sm prose-invert max-w-none text-[#c9d1d9]">
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
                      <h3 className="font-bold text-white text-lg">
                        Examples
                      </h3>
                      {problem.examples.map((example, index) => (
                        <div key={index} className="bg-[#161b22] rounded-lg p-4 space-y-4">
                          <div className="text-sm font-semibold text-[#58a6ff]">
                            Example {index + 1}
                          </div>
                          <div className="space-y-3">
                            {/* Input */}
                            <div className="border-l-4 border-[#238636] pl-4">
                              <span className="text-[#238636] font-medium text-sm">Input:</span>
                              <span className="text-[#8b949e] text-sm ml-2">{example.input.split('\n')[0]}</span>
                              {example.input.split('\n').slice(1).map((line, i) => (
                                <div key={i} className="text-[#8b949e] text-sm font-mono">{line}</div>
                              ))}
                            </div>
                            {/* Output */}
                            <div className="border-l-4 border-[#238636] pl-4">
                              <span className="text-[#238636] font-medium text-sm">Output:</span>
                              <span className="text-[#8b949e] text-sm ml-2 font-mono">{example.output}</span>
                            </div>
                            {/* Explanation */}
                            {example.explanation && (
                              <div className="border-l-4 border-[#238636] pl-4">
                                <span className="text-[#58a6ff] font-medium text-sm">Explanation:</span>
                                <span className="text-[#8b949e] text-sm ml-2">{example.explanation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Constraints */}
                  {problem.constraints && problem.constraints.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-white">
                        Constraints
                      </h3>
                      <ul className="list-disc list-inside space-y-1.5 text-sm text-[#8b949e]">
                        {problem.constraints.map((constraint, index) => (
                          <li key={index}>
                            <code className="text-[#c9d1d9] bg-[#21262d] px-1.5 py-0.5 rounded text-xs">
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
                      <h3 className="font-bold text-white text-sm">
                        Asked by
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {problem.company.map((company) => (
                          <div
                            key={company}
                            className="px-2 py-1 text-xs font-medium bg-[#21262d] text-[#8b949e] rounded-md"
                          >
                            {company}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'solutions' && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Lightbulb className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-foreground">
                    Solutions Coming Soon
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Detailed solution explanations will be available here.
                  </p>
                </div>
              )}

              {activeTab === 'submissions' && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-foreground">Your Submissions</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your submission history will appear here.
                  </p>
                </div>
              )}

              {activeTab === 'aichat' && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-foreground">AI Chat</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get AI-powered hints and explanations here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/50 active:bg-primary transition-colors cursor-col-resize" />

        {/* Right Panel - Code Editor */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="h-full min-w-0 flex flex-col bg-[#0d1117] overflow-hidden">
            {/* Right Panel Tabs */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d] bg-[#161b22] shrink-0">
              <div className="flex items-center gap-1">
                {[
                  { id: 'code', label: 'Code', icon: '◇' },
                  { id: 'testcases', label: 'Test Cases', icon: '▷' },
                  { id: 'results', label: 'Results', icon: '✓' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setEditorTab(tab.id as EditorTab)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                      editorTab === tab.id
                        ? 'bg-[#238636] text-white'
                        : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]',
                    )}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {editorTab === 'code' && (
                <>
                  {/* Editor */}
                  <div className="flex-1 min-h-0">
                    <CustomCodeEditor
                      value={code}
                      onChange={handleCodeChange}
                      language={language}
                      onLanguageChange={handleLanguageChange}
                      className="h-full"
                    />
                  </div>
                </>
              )}

              {editorTab === 'testcases' && (
                <div className="flex-1 overflow-auto p-4">
                  <OutputConsole
                    result={null}
                    isLoading={false}
                    className="h-full"
                    problem={problem}
                  />
                </div>
              )}

              {editorTab === 'results' && (
                <div className="flex-1 overflow-auto">
                  <OutputConsole
                    result={testResult}
                    isLoading={
                      runCodeMutation.isPending ||
                      submitCodeMutation.isPending
                    }
                    className="h-full"
                    problem={problem}
                  />
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-[#30363d] bg-[#161b22] shrink-0">
              <button
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#8b949e] hover:text-white rounded-md hover:bg-[#21262d] transition-colors"
              >
                <span>↳</span>
                Console
              </button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRun}
                  disabled={
                    runCodeMutation.isPending || submitCodeMutation.isPending
                  }
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-[#21262d] border-[#30363d] text-white hover:bg-[#30363d]"
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
                  className="gap-1.5 bg-[#238636] hover:bg-[#2ea043] text-white"
                >
                  <Send className="h-4 w-4" />
                  {submitCodeMutation.isPending ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}
