import { useMemo, useState } from 'react'
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useProblemsByCategory } from '../hooks'
import { DifficultyBadge } from '../components/problem'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import type { CategoryProblem } from '../types'

type LocationState = { problem?: CategoryProblem }

export default function CategoryProblemDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { category, index } = useParams<{ category: string; index: string }>()
  const [searchParams] = useSearchParams()

  const page = Number(searchParams.get('page') || '1') || 1
  const limit = Number(searchParams.get('limit') || '20') || 20
  const idx = Number(index || '-1')

  const stateProblem = (location.state as LocationState | null)?.problem

  const { data, isLoading, error } = useProblemsByCategory(
    (category || '').toLowerCase(),
    { page, limit },
  )

  const problem = useMemo(() => {
    if (stateProblem) return stateProblem
    if (!data?.problems || !Number.isFinite(idx) || idx < 0) return undefined
    return data.problems[idx]
  }, [data?.problems, idx, stateProblem])

  const [language, setLanguage] = useState(
    () => problem?.starterCode?.[0]?.language || 'JavaScript',
  )

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid category</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
            <p>
              Failed to load problem:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading && !problem) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-muted-foreground">Loading…</div>
        </div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <p className="text-muted-foreground">Problem not found.</p>
        </div>
      </div>
    )
  }

  const starterOptions = (problem.starterCode || []).map((sc) => ({
    value: sc.language,
    label: sc.language,
  }))

  const selectedStarter = problem.starterCode?.find(
    (sc) => sc.language === language,
  )
  const starterCode =
    selectedStarter?.code || problem.starterCode?.[0]?.code || ''

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {problem.title}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <DifficultyBadge difficulty={problem.difficulty} />
              {(problem.topics || []).slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/problems/${category.toLowerCase()}`)}
          >
            Back to list
          </Button>
        </div>

        <Card className="p-5 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Description
          </h2>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {problem.description}
          </div>
        </Card>

        {problem.constraints && (
          <Card className="p-5 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Constraints
            </h2>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {problem.constraints}
            </div>
          </Card>
        )}

        {problem.hints && problem.hints.length > 0 && (
          <Card className="p-5 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Hints
            </h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {problem.hints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </Card>
        )}

        {problem.visibleTestCases && problem.visibleTestCases.length > 0 && (
          <Card className="p-5 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Sample Test Cases
            </h2>
            <div className="space-y-4">
              {problem.visibleTestCases.map((tc, i) => (
                <div key={i} className="border border-border rounded-md p-4">
                  <div className="text-sm font-medium text-foreground mb-2">
                    Case {i + 1}
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Input
                      </div>
                      <pre className="text-xs bg-muted/40 border border-border rounded p-3 overflow-auto">
                        {tc.input}
                      </pre>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Output
                      </div>
                      <pre className="text-xs bg-muted/40 border border-border rounded p-3 overflow-auto">
                        {tc.output}
                      </pre>
                    </div>
                  </div>
                  {tc.explanation && (
                    <div className="mt-3 text-xs text-muted-foreground whitespace-pre-wrap">
                      {tc.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {problem.starterCode && problem.starterCode.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold text-foreground">
                Starter Code
              </h2>
              {starterOptions.length > 1 && (
                <div className="min-w-[200px]">
                  <Select
                    value={language}
                    options={starterOptions}
                    onChange={(e) => setLanguage(e.target.value)}
                  />
                </div>
              )}
            </div>
            <pre className="text-xs bg-muted/40 border border-border rounded p-4 overflow-auto">
              {starterCode}
            </pre>
          </Card>
        )}
      </div>
    </div>
  )
}
