import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { useProblemsByCategory } from '../hooks'
import { DifficultyBadge } from '../components/problem'
import { ProblemListSkeleton } from '../components/common'
import Button from '../components/ui/Button'
import type { CategoryProblem } from '../types'

/**
 * Category Problems Page - Display problems filtered by category (Array, String, Math, etc)
 */
export default function CategoryProblems() {
  const navigate = useNavigate()
  const { category } = useParams<{ category: string }>()
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const { data, isLoading, error } = useProblemsByCategory(
    category?.toLowerCase() || '',
    { page, limit },
  )

  const problems = data?.problems || []
  const pagination = data?.pagination

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid category</p>
      </div>
    )
  }

  const categoryName = category.charAt(0).toUpperCase() + category.slice(1)

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground capitalize">
                {categoryName} Problems
              </h1>
              <p className="text-muted-foreground mt-2">
                {pagination?.total || 0} problems to solve
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
            <p>
              Failed to load problems:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <ProblemListSkeleton />
        ) : problems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No problems found for this category
            </p>
          </div>
        ) : (
          <>
            {/* Problems Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  {/* Table Header */}
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Difficulty
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Topics
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Companies
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-border">
                    {problems.map((problem: CategoryProblem, idx: number) => (
                      <tr
                        key={idx}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() =>
                          navigate(
                            `/problems/${category.toLowerCase()}/${idx}?page=${page}&limit=${limit}`,
                            { state: { problem } },
                          )
                        }
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">
                            {problem.title}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <DifficultyBadge difficulty={problem.difficulty} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(problem.topics || [])
                              .slice(0, 2)
                              .map((topic: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                                >
                                  {topic}
                                </span>
                              ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(problem.companyTags || [])
                              .slice(0, 2)
                              .map((company: string, i: number) => (
                                <span
                                  key={i}
                                  className={cn(
                                    'text-xs px-2 py-1 rounded',
                                    'bg-muted text-muted-foreground',
                                  )}
                                >
                                  {company}
                                </span>
                              ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage(Math.min(pagination.pages, page + 1))
                    }
                    disabled={page === pagination.pages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
