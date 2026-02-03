import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { problemService, submissionService } from '../services/api'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Card from '../components/ui/Card'
import { Play, Send, Check, X } from 'lucide-react'

interface Problem {
  _id: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  constraints: string[]
  examples: Array<{ input: string; output: string; explanation?: string }>
  starterCode: Record<string, string>
  company?: string[]
  topics?: string[]
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
]

export default function ProblemSolver() {
  const { slug } = useParams<{ slug: string }>()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>(
    'description',
  )
  const [testResults, setTestResults] = useState<{
    success?: boolean
    error?: string
    runtime?: number
    memory?: number
    failedTests?: Array<{ input: string; expected: string; actual: string }>
  } | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [splitPosition, setSplitPosition] = useState(50) // percentage
  const [isResizing, setIsResizing] = useState(false)

  const fetchProblem = useCallback(async () => {
    try {
      const { data } = await problemService.getProblemBySlug(slug!)
      setProblem(data.problem || data)

      // Set initial starter code
      if (data.problem?.starterCode || data.starterCode) {
        const starterCode = data.problem?.starterCode || data.starterCode
        if (starterCode[language]) {
          setCode(starterCode[language])
        }
      }
    } catch (error) {
      console.error('Failed to fetch problem:', error)
    } finally {
      setLoading(false)
    }
  }, [slug, language])

  useEffect(() => {
    if (slug) {
      fetchProblem()
    }
  }, [fetchProblem, slug])

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || ''
    setCode(newCode)

    // Save to localStorage
    if (problem) {
      localStorage.setItem(`code_${problem._id}_${language}`, newCode)
    }
  }

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    if (problem?.starterCode && problem.starterCode[newLanguage]) {
      const saved = localStorage.getItem(`code_${problem._id}_${newLanguage}`)
      setCode(saved || problem.starterCode[newLanguage])
    }
  }

  const handleRun = async () => {
    if (!problem) return

    setIsRunning(true)
    setShowResults(true)
    setTestResults(null)

    try {
      const { data } = await submissionService.runCode({
        problemId: problem._id,
        language,
        code,
      })
      setTestResults(data)
    } catch (error) {
      setTestResults({
        success: false,
        error:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Failed to run code',
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!problem) return

    setIsSubmitting(true)
    setShowResults(true)
    setTestResults(null)

    try {
      const { data } = await submissionService.submitCode({
        problemId: problem._id,
        language,
        code,
      })
      setTestResults(data)
    } catch (error) {
      setTestResults({
        success: false,
        error:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Failed to submit code',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'success'
      case 'medium':
        return 'warning'
      case 'hard':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const handleMouseDown = () => {
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const container = document.getElementById('split-container')
      if (!container) return

      const rect = container.getBoundingClientRect()
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100
      setSplitPosition(Math.min(Math.max(newPosition, 30), 70))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading problem...</p>
        </div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-xl font-semibold">Problem not found</p>
        </div>
      </div>
    )
  }

  return (
    <div
      id="split-container"
      className="h-full flex"
      style={{ userSelect: isResizing ? 'none' : 'auto' }}
    >
      {/* Left Pane - Problem Description */}
      <div
        className="h-full overflow-auto border-r bg-background"
        style={{ width: `${splitPosition}%` }}
      >
        <div className="p-5">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {problem.title}
              </h1>
              <Badge variant={getDifficultyVariant(problem.difficulty)}>
                {problem.difficulty}
              </Badge>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              {problem.topics?.map((topic) => (
                <Badge key={topic} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>

            {problem.company && problem.company.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {problem.company.map((comp) => (
                  <Badge key={comp} variant="secondary" className="text-xs">
                    {comp}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b mb-4">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'description'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'submissions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Submissions
            </button>
          </div>

          {/* Content */}
          {activeTab === 'description' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Problem Statement</h3>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {problem.description}
                </div>
              </div>

              {/* Examples */}
              {problem.examples && problem.examples.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Examples</h3>
                  {problem.examples.map((example, index) => (
                    <Card key={index} className="p-4 mb-3">
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Input:</span>
                          <code className="ml-2 bg-muted px-2 py-1 rounded">
                            {example.input}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium">Output:</span>
                          <code className="ml-2 bg-muted px-2 py-1 rounded">
                            {example.output}
                          </code>
                        </div>
                        {example.explanation && (
                          <div>
                            <span className="font-medium">Explanation:</span>
                            <p className="ml-2 text-muted-foreground">
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
                <div>
                  <h3 className="font-semibold mb-2">Constraints</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {problem.constraints.map((constraint, index) => (
                      <li key={index}>{constraint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors"
        onMouseDown={handleMouseDown}
      />

      {/* Right Pane - Code Editor */}
      <div
        className="h-full flex flex-col bg-background"
        style={{ width: `${100 - splitPosition}%` }}
      >
        {/* Editor Header */}
        <div className="flex items-center justify-between p-3 border-b bg-card">
          <Select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            options={LANGUAGES}
            className="w-40"
          />

          <div className="flex items-center gap-2">
            <Button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              variant="outline"
              size="sm"
            >
              <Play className="h-4 w-4 mr-1" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              size="sm"
            >
              <Send className="h-4 w-4 mr-1" />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language}
            value={code}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        </div>

        {/* Test Results */}
        {showResults && (
          <div className="border-t bg-card max-h-64 overflow-auto">
            <div className="p-4">
              {testResults === null ? (
                <div className="text-center py-4">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isRunning ? 'Running test cases...' : 'Submitting...'}
                  </p>
                </div>
              ) : testResults.error ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <X className="h-5 w-5" />
                    <span className="font-semibold">Error</span>
                  </div>
                  <pre className="text-sm bg-destructive/10 p-3 rounded">
                    {testResults.error}
                  </pre>
                </div>
              ) : testResults.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-success">
                    <Check className="h-5 w-5" />
                    <span className="font-semibold">
                      All test cases passed!
                    </span>
                  </div>
                  {testResults.runtime && (
                    <p className="text-sm text-muted-foreground">
                      Runtime: {testResults.runtime}ms | Memory:{' '}
                      {testResults.memory}MB
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <X className="h-5 w-5" />
                    <span className="font-semibold">Test cases failed</span>
                  </div>
                  {testResults.failedTests && (
                    <div className="text-sm space-y-2">
                      {testResults.failedTests.map((test, index: number) => (
                        <div key={index} className="bg-muted p-3 rounded">
                          <p>
                            <strong>Input:</strong> {test.input}
                          </p>
                          <p>
                            <strong>Expected:</strong> {test.expected}
                          </p>
                          <p>
                            <strong>Got:</strong> {test.actual}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
