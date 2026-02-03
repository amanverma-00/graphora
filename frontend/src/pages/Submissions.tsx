import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Timer,
  HardDrive,
  Code2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Eye,
  ExternalLink,
  RotateCcw,
} from 'lucide-react'
import { useRecentSubmissions } from '../hooks/useSubmission'
import { formatRelativeTime, getStatusColor, LANGUAGES } from '../lib/utils'
import { Skeleton } from '../components/common/Skeleton'
import type { Submission } from '../types'

type StatusFilter =
  | 'all'
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Runtime Error'
  | 'Compilation Error'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Wrong Answer', label: 'Wrong Answer' },
  { value: 'Time Limit Exceeded', label: 'Time Limit Exceeded' },
  { value: 'Runtime Error', label: 'Runtime Error' },
  { value: 'Compilation Error', label: 'Compilation Error' },
]

function getStatusIcon(status: string) {
  switch (status) {
    case 'Accepted':
      return <CheckCircle className="w-4 h-4" />
    case 'Wrong Answer':
      return <XCircle className="w-4 h-4" />
    case 'Time Limit Exceeded':
      return <Timer className="w-4 h-4" />
    case 'Runtime Error':
    case 'Compilation Error':
      return <AlertTriangle className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

function SubmissionRow({ submission }: { submission: Submission }) {
  const statusColorClass = getStatusColor(submission.status)

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="py-4 px-4">
        <Link
          to={`/problem/${submission.problem?.slug || submission.problemId}`}
          className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2"
        >
          {submission.problem?.title || 'Unknown Problem'}
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
        </Link>
      </td>
      <td className="py-4 px-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColorClass}`}
        >
          {getStatusIcon(submission.status)}
          {submission.status}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Code2 className="w-4 h-4" />
          {submission.language}
        </span>
      </td>
      <td className="py-4 px-4 text-sm text-muted-foreground">
        {submission.runtime !== undefined ? (
          <span className="inline-flex items-center gap-1">
            <Timer className="w-3.5 h-3.5" />
            {submission.runtime} ms
          </span>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="py-4 px-4 text-sm text-muted-foreground">
        {submission.memory !== undefined ? (
          <span className="inline-flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5" />
            {submission.memory.toFixed(1)} MB
          </span>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="py-4 px-4 text-sm text-muted-foreground">
        {formatRelativeTime(submission.createdAt)}
      </td>
      <td className="py-4 px-4">
        <Link
          to={`/submissions/${submission._id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Link>
      </td>
    </tr>
  )
}

function SubmissionCard({ submission }: { submission: Submission }) {
  const statusColorClass = getStatusColor(submission.status)

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <Link
          to={`/problem/${submission.problem?.slug || submission.problemId}`}
          className="font-medium text-foreground hover:text-primary transition-colors"
        >
          {submission.problem?.title || 'Unknown Problem'}
        </Link>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColorClass}`}
        >
          {getStatusIcon(submission.status)}
          {submission.status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Code2 className="w-4 h-4" />
          {submission.language}
        </span>
        {submission.runtime !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Timer className="w-3.5 h-3.5" />
            {submission.runtime} ms
          </span>
        )}
        {submission.memory !== undefined && (
          <span className="inline-flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5" />
            {submission.memory.toFixed(1)} MB
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatRelativeTime(submission.createdAt)}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <Link
          to={`/submissions/${submission._id}`}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Eye className="w-4 h-4" />
          View Submission
        </Link>
      </div>
    </div>
  )
}

function SubmissionSkeleton() {
  return (
    <tr className="border-b border-border">
      <td className="py-4 px-4">
        <Skeleton className="h-5 w-40" />
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-6 w-24 rounded-full" />
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-5 w-20" />
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-5 w-16" />
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-5 w-16" />
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-5 w-24" />
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-7 w-16" />
      </td>
    </tr>
  )
}

export default function Submissions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get('status') as StatusFilter) || 'all',
  )
  const [languageFilter, setLanguageFilter] = useState(
    searchParams.get('language') || 'all',
  )
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  const { data, isLoading, isError, refetch } = useRecentSubmissions({
    page,
    limit: 20,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  const submissions = data?.submissions || []
  const pagination = data?.pagination

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'all' || value === '') {
      newParams.delete(key)
    } else {
      newParams.set(key, value)
    }
    newParams.set('page', '1')
    setSearchParams(newParams)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', String(newPage))
    setSearchParams(newParams)
    setPage(newPage)
  }

  // Stats calculation
  const stats = {
    total: pagination?.total || 0,
    accepted: submissions.filter((s) => s.status === 'Accepted').length,
    wrongAnswer: submissions.filter((s) => s.status === 'Wrong Answer').length,
    tle: submissions.filter((s) => s.status === 'Time Limit Exceeded').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Submissions</h1>
          <p className="text-muted-foreground mt-1">
            View and analyze your submission history
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Submissions</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {stats.total}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Accepted</p>
          <p className="text-2xl font-bold text-green-500 mt-1">
            {stats.accepted}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Wrong Answer</p>
          <p className="text-2xl font-bold text-red-500 mt-1">
            {stats.wrongAnswer}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">TLE</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.tle}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by problem name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter)
                handleFilterChange('status', e.target.value)
              }}
              className="px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <select
            value={languageFilter}
            onChange={(e) => {
              setLanguageFilter(e.target.value)
              handleFilterChange('language', e.target.value)
            }}
            className="px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Languages</option>
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.name}>
                {lang.name}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        viewMode === 'table' ? (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Problem
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Language
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Runtime
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Memory
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Submitted
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SubmissionSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        )
      ) : isError ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Failed to load submissions
          </h3>
          <p className="text-muted-foreground mb-4">
            Something went wrong while fetching your submissions.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Code2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No submissions yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Start solving problems to see your submissions here.
          </p>
          <Link
            to="/problems"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Browse Problems
          </Link>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Problem
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Language
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Runtime
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Memory
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Submitted
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <SubmissionRow key={submission._id} submission={submission} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => (
            <SubmissionCard key={submission._id} submission={submission} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1} to{' '}
            {Math.min(page * 20, pagination.total)} of {pagination.total}{' '}
            submissions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }).map(
                (_, i) => {
                  let pageNum: number
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                        page === pageNum
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                },
              )}
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pagination.totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
