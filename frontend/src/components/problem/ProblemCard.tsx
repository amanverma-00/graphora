import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'
import { DifficultyBadge } from './DifficultyBadge'
import { TagPill } from './TagPill'
import type { ProblemListItem } from '../../types'

interface ProblemCardProps {
  problem: ProblemListItem
  className?: string
  showTags?: boolean
  variant?: 'default' | 'compact'
}

// Status icon helper - extracted to avoid creating component during render
function getStatusIcon(status?: string) {
  switch (status) {
    case 'solved':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'attempted':
      return <Clock className="h-5 w-5 text-yellow-500" />
    default:
      return <Circle className="h-5 w-5 text-muted-foreground/40" />
  }
}

/**
 * Problem card component for list view
 */
export function ProblemCard({
  problem,
  className,
  showTags = true,
  variant = 'default',
}: ProblemCardProps) {
  const statusIcon = getStatusIcon(problem.status)

  if (variant === 'compact') {
    return (
      <Link
        to={`/problem/${problem.slug}`}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg bg-card border border-border',
          'hover:border-primary/50 hover:shadow-sm transition-all group',
          className,
        )}
      >
        {statusIcon}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {problem.title}
          </h3>
        </div>
        <DifficultyBadge difficulty={problem.difficulty} size="sm" />
      </Link>
    )
  }

  return (
    <Link
      to={`/problem/${problem.slug}`}
      className={cn(
        'block p-4 rounded-lg bg-card border border-border',
        'hover:border-primary/50 hover:shadow-md transition-all group',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5">{statusIcon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {problem.title}
            </h3>

            {showTags && problem.topics && problem.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {problem.topics.slice(0, 3).map((topic) => (
                  <TagPill key={topic} tag={topic} />
                ))}
                {problem.topics.length > 3 && (
                  <span className="text-xs text-muted-foreground px-1.5 py-1">
                    +{problem.topics.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <DifficultyBadge difficulty={problem.difficulty} />

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {problem.acceptanceRate !== undefined && (
              <span className="flex items-center gap-1">
                <span className="text-green-500">✓</span>
                {(() => {
                  const raw = problem.acceptanceRate as unknown
                  const value =
                    typeof raw === 'number'
                      ? raw
                      : typeof raw === 'string'
                        ? Number.parseFloat(raw)
                        : Number.NaN
                  if (!Number.isFinite(value)) return '—'
                  return `${value.toFixed(0)}%`
                })()}
              </span>
            )}
            {problem.points !== undefined && (
              <span className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                {problem.points}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
