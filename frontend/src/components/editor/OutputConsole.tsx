import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import {
  Terminal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { RunCodeResult, FailedTest, Problem } from '../../types'

interface OutputConsoleProps {
  result: RunCodeResult | null
  isLoading?: boolean
  className?: string
  problem?: Problem
}

/**
 * Output console with tabs for output, errors, and test cases
 */
export function OutputConsole({
  result,
  isLoading = false,
  className,
  problem,
}: OutputConsoleProps) {
  const [activeTab, setActiveTab] = useState('output')
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getStatusInfo = () => {
    if (!result) return null

    if (result.success) {
      return {
        icon: <CheckCircle2 className="h-5 w-5" />,
        label: 'Accepted',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
      }
    }

    if (result.error) {
      return {
        icon: <XCircle className="h-5 w-5" />,
        label: result.status || 'Error',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
      }
    }

    if (result.failedTests && result.failedTests.length > 0) {
      return {
        icon: <XCircle className="h-5 w-5" />,
        label: 'Wrong Answer',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
      }
    }

    return null
  }

  const statusInfo = getStatusInfo()

  return (
    <div
      className={cn('flex flex-col bg-card border-t border-border', className)}
    >
      <Tabs.Root
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col h-full"
      >
        {/* Tab List */}
        <Tabs.List className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/30">
          <Tabs.Trigger
            value="output"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              activeTab === 'output'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Terminal className="h-4 w-4" />
            Output
          </Tabs.Trigger>

          <Tabs.Trigger
            value="testcases"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              activeTab === 'testcases'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Test Cases
            {result?.failedTests && result.failedTests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500/20 text-red-500 rounded-full">
                {result.failedTests.length}
              </span>
            )}
          </Tabs.Trigger>

          {/* Status indicator on the right */}
          <div className="ml-auto flex items-center gap-3">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </div>
            ) : statusInfo ? (
              <div
                className={cn(
                  'flex items-center gap-2 px-2 py-1 rounded-md',
                  statusInfo.bgColor,
                  statusInfo.color,
                )}
              >
                {statusInfo.icon}
                <span className="text-sm font-medium">{statusInfo.label}</span>
              </div>
            ) : null}

            {result?.runtime !== undefined && (
              <span className="text-xs text-muted-foreground">
                Runtime: {result.runtime}ms
              </span>
            )}
            {result?.memory !== undefined && (
              <span className="text-xs text-muted-foreground">
                Memory: {result.memory.toFixed(1)} MB
              </span>
            )}
          </div>
        </Tabs.List>

        {/* Output Tab */}
        <Tabs.Content value="output" className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Executing code...
                </span>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Standard Output */}
              {result.stdout && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Standard Output
                    </h4>
                    <button
                      onClick={() => copyToClipboard(result.stdout!)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-muted text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                    {result.stdout}
                  </pre>
                </div>
              )}

              {/* Error Output */}
              {(result.error || result.stderr) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <h4 className="text-sm font-medium text-red-500">Error</h4>
                  </div>
                  <pre className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                    {result.error || result.stderr}
                  </pre>
                </div>
              )}

              {/* Success message */}
              {result.success && !result.stdout && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-500">
                      All test cases passed!
                    </p>
                    {result.testCasesPassed !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        {result.testCasesPassed} / {result.totalTestCases} test
                        cases
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!result.stdout &&
                !result.error &&
                !result.stderr &&
                !result.success && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    No output
                  </div>
                )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Run your code to see output here</p>
            </div>
          )}
        </Tabs.Content>

        {/* Test Cases Tab */}
        <Tabs.Content value="testcases" className="flex-1 overflow-auto p-4">
          {result?.failedTests && result.failedTests.length > 0 ? (
            <div className="space-y-4">
              {result.failedTests.map((test: FailedTest, index: number) => (
                <div
                  key={index}
                  className="rounded-lg border border-border overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border-b border-border">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-500">
                      Test Case {test.testCaseNumber ?? index + 1}
                    </span>
                  </div>
                  <div className="p-3 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Input
                      </label>
                      <pre className="mt-1 p-2 rounded bg-muted text-sm font-mono">
                        {test.input}
                      </pre>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Expected Output
                      </label>
                      <pre className="mt-1 p-2 rounded bg-green-500/10 text-sm font-mono text-green-600 dark:text-green-400">
                        {test.expected}
                      </pre>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Your Output
                      </label>
                      <pre className="mt-1 p-2 rounded bg-red-500/10 text-sm font-mono text-red-600 dark:text-red-400">
                        {test.actual}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : result?.success ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <div>
                  <p className="font-medium text-green-500">
                    All test cases passed!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your solution is correct
                  </p>
                </div>
              </div>
            </div>
          ) : problem?.examples && problem.examples.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-3">
                Example test cases from problem description:
              </div>
              {problem.examples.map((example, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
                    <span className="text-sm font-medium text-foreground">
                      Example {index + 1}
                    </span>
                  </div>
                  <div className="p-3 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Input
                      </label>
                      <pre className="mt-1 p-2 rounded bg-muted text-sm font-mono overflow-x-auto">
                        {example.input}
                      </pre>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Expected Output
                      </label>
                      <pre className="mt-1 p-2 rounded bg-muted text-sm font-mono overflow-x-auto">
                        {example.output}
                      </pre>
                    </div>
                    {example.explanation && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Explanation
                        </label>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {example.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Test case results will appear here after running your code</p>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
