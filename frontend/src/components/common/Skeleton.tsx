import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
}

/**
 * Skeleton loading component for placeholder content
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

/**
 * Skeleton for problem list items
 */
export function ProblemListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border"
        >
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-[60%]" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for problem detail page
 */
export function ProblemDetailSkeleton() {
  return (
    <div className="flex h-full">
      {/* Left panel skeleton */}
      <div className="w-1/2 p-6 space-y-6 border-r border-border">
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>

      {/* Right panel skeleton */}
      <div className="w-1/2 flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <Skeleton className="h-8 w-32 rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
        <div className="flex-1">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for dashboard cards
 */
export function DashboardCardSkeleton() {
  return (
    <div className="p-6 rounded-lg bg-card border border-border space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}
