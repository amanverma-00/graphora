import { cn } from '../../lib/utils'

interface TagPillProps {
  tag: string
  className?: string
  onClick?: () => void
  selected?: boolean
  removable?: boolean
  onRemove?: () => void
}

/**
 * Tag pill component for displaying topic/category tags
 */
export function TagPill({
  tag,
  className,
  onClick,
  selected = false,
  removable = false,
  onRemove,
}: TagPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
        onClick && 'cursor-pointer',
        selected
          ? 'bg-primary/20 text-primary border border-primary/30'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {tag}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1 hover:text-destructive transition-colors"
          aria-label={`Remove ${tag}`}
        >
          ×
        </button>
      )}
    </span>
  )
}
