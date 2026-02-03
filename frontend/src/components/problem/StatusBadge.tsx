import { cn } from '../../lib/utils'
import { getStatusColor } from '../../lib/utils'
import type { SubmissionStatus } from '../../types'

interface StatusBadgeProps {
  status: SubmissionStatus | string
  className?: string
  showIcon?: boolean
}

/**
 * Status badge for submission verdicts
 */
export function StatusBadge({
  status,
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const getIcon = () => {
    const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '')

    if (normalizedStatus === 'accepted' || normalizedStatus === 'ac') return '✓'
    if (normalizedStatus.includes('wrong') || normalizedStatus === 'wa')
      return '✗'
    if (normalizedStatus.includes('time') || normalizedStatus === 'tle')
      return '⏱'
    if (normalizedStatus.includes('memory') || normalizedStatus === 'mle')
      return '📦'
    if (normalizedStatus.includes('runtime') || normalizedStatus === 're')
      return '⚠'
    if (normalizedStatus.includes('compile') || normalizedStatus === 'ce')
      return '🔧'
    if (normalizedStatus === 'pending' || normalizedStatus === 'running')
      return '⏳'
    return '•'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium text-sm',
        getStatusColor(status),
        className,
      )}
    >
      {showIcon && <span>{getIcon()}</span>}
      <span>{status}</span>
    </span>
  )
}
