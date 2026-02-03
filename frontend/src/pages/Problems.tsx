import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Filter,
  ChevronDown,
  Grid3X3,
  List,
  CheckCircle2,
  Circle,
  Clock,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn, getDifficultyColor } from '../lib/utils'
import { useProblems } from '../hooks'
import { DifficultyBadge, TagPill, ProblemCard } from '../components/problem'
import ProblemCategories from '../components/problem/ProblemCategories'
import { ProblemListSkeleton } from '../components/common'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import type { Difficulty, ProblemFilters } from '../types'

// Available tags/topics for filtering
const AVAILABLE_TAGS = [
  'Array',
  'String',
  'Hash Table',
  'Dynamic Programming',
  'Math',
  'Sorting',
  'Greedy',
  'Depth-First Search',
  'Binary Search',
  'Tree',
  'Breadth-First Search',
  'Two Pointers',
  'Stack',
  'Graph',
  'Linked List',
  'Recursion',
  'Sliding Window',
  'Heap',
  'Backtracking',
  'Matrix',
]

type ViewMode = 'table' | 'card'
type StatusFilter = 'all' | 'solved' | 'unsolved' | 'attempted'

/**
 * Problems List Page - HackerRank-inspired design
 * Features: Category browsing, Filtering, Search, Table/Card view, Pagination
 */
export default function Problems() {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>(
    'all',
  )
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [showFilters, setShowFilters] = useState(false)

  // Build filters object for React Query
  const filters: ProblemFilters = useMemo(
    () => ({
      difficulty: difficultyFilter,
      status: statusFilter,
      tags: selectedTags,
      search: searchQuery,
    }),
    [difficultyFilter, statusFilter, selectedTags, searchQuery],
  )

  // Fetch problems with React Query
  const { data: problems, isLoading, error } = useProblems(filters)

  // Client-side filtering for search (if API doesn't support it)
  const filteredProblems = useMemo(() => {
    if (!problems) return []

    return problems.filter((problem) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = problem.title.toLowerCase().includes(query)
        const matchesTags =
          problem.topics?.some((t) => t.toLowerCase().includes(query)) ||
          problem.tags?.some((t) => t.toLowerCase().includes(query))
        if (!matchesTitle && !matchesTags) return false
      }
      return true
    })
  }, [problems, searchQuery])

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setDifficultyFilter('all')
    setStatusFilter('all')
    setSelectedTags([])
  }

  const hasActiveFilters =
    difficultyFilter !== 'all' ||
    statusFilter !== 'all' ||
    selectedTags.length > 0 ||
    searchQuery.length > 0

  const StatusIcon = ({ status }: { status?: string }) => {
    switch (status) {
      case 'solved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'attempted':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground/30" />
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Practice Problems
        </h1>
        <p className="text-muted-foreground mt-1">
          Solve coding challenges to improve your skills
        </p>
      </div>

      {/* Show categories when no filters applied */}
      {!searchQuery &&
        statusFilter === 'all' &&
        difficultyFilter === 'all' &&
        selectedTags.length === 0 && (
          <>
            <ProblemCategories />
            <div className="flex items-center justify-center my-8">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent flex-1"></div>
              <span className="px-4 text-gray-400 text-sm">
                Or browse by difficulty
              </span>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent flex-1"></div>
            </div>
          </>
        )}

      {/* Filters Section */}
      <div className="bg-card border border-border rounded-lg shadow-sm mb-6">
        {/* Main Filter Bar */}
        <div className="p-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search problems by title or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Difficulty Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors',
                    difficultyFilter !== 'all'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:bg-muted',
                  )}
                >
                  <Filter className="h-4 w-4" />
                  {difficultyFilter === 'all' ? 'Difficulty' : difficultyFilter}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[150px] p-1 rounded-lg bg-popover border border-border shadow-lg z-50">
                  {['all', 'easy', 'medium', 'hard'].map((diff) => (
                    <DropdownMenu.Item
                      key={diff}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer outline-none',
                        difficultyFilter === diff
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted',
                      )}
                      onSelect={() =>
                        setDifficultyFilter(diff as Difficulty | 'all')
                      }
                    >
                      <span
                        className={cn(
                          'capitalize',
                          diff !== 'all' && getDifficultyColor(diff),
                        )}
                      >
                        {diff === 'all' ? 'All Difficulties' : diff}
                      </span>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Status Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors',
                    statusFilter !== 'all'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:bg-muted',
                  )}
                >
                  {statusFilter === 'all' ? 'Status' : statusFilter}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[150px] p-1 rounded-lg bg-popover border border-border shadow-lg z-50">
                  {[
                    { value: 'all', label: 'All Status' },
                    { value: 'solved', label: 'Solved' },
                    { value: 'attempted', label: 'Attempted' },
                    { value: 'unsolved', label: 'Unsolved' },
                  ].map((status) => (
                    <DropdownMenu.Item
                      key={status.value}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer outline-none',
                        statusFilter === status.value
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted',
                      )}
                      onSelect={() =>
                        setStatusFilter(status.value as StatusFilter)
                      }
                    >
                      {status.label}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Tags Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors',
                selectedTags.length > 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-foreground hover:bg-muted',
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Tags
              {selectedTags.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {selectedTags.length}
                </span>
              )}
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
                Clear all
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center border border-border rounded-md overflow-hidden ml-auto">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'table'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
                title="Table view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'card'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
                title="Card view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tags Filter Panel (Expandable) */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-foreground">
                Filter by topics:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors',
                    selectedTags.includes(tag)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80',
                  )}
                >
                  {selectedTags.includes(tag) && (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {selectedTags.length > 0 && (
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <TagPill
                key={tag}
                tag={tag}
                selected
                removable
                onRemove={() => handleTagToggle(tag)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            'Loading...'
          ) : (
            <>
              Showing{' '}
              <span className="font-medium text-foreground">
                {filteredProblems.length}
              </span>{' '}
              problems
            </>
          )}
        </p>
      </div>

      {/* Problems List */}
      {isLoading ? (
        <ProblemListSkeleton />
      ) : error ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-destructive">
            Failed to load problems. Please try again.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-foreground font-medium">No problems found</p>
          <p className="text-muted-foreground text-sm mt-1">
            Try adjusting your filters or search query
          </p>
          {hasActiveFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : viewMode === 'card' ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProblems.map((problem) => (
            <ProblemCard key={problem._id} problem={problem} />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                  Difficulty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Topics
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24 hidden sm:table-cell">
                  Acceptance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProblems.map((problem) => (
                <tr
                  key={problem._id}
                  className="hover:bg-muted/50 transition-colors group"
                >
                  <td className="px-4 py-4">
                    <StatusIcon status={problem.status} />
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      to={`/problem/${problem.slug}`}
                      className="font-medium text-foreground group-hover:text-primary transition-colors"
                    >
                      {problem.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {problem.topics?.slice(0, 2).map((topic) => (
                        <TagPill key={topic} tag={topic} />
                      ))}
                      {problem.topics && problem.topics.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{problem.topics.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-muted-foreground hidden sm:table-cell">
                    {(() => {
                      const raw = problem.acceptanceRate
                      if (raw === undefined || raw === null) return '—'
                      const value =
                        typeof raw === 'number'
                          ? raw
                          : typeof raw === 'string'
                            ? Number.parseFloat(raw)
                            : Number.NaN
                      if (!Number.isFinite(value)) return '—'
                      return `${value.toFixed(0)}%`
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination (placeholder) */}
      {filteredProblems.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page 1 of 1
          </span>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
