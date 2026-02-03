import { clsx } from 'clsx'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary'
  children: React.ReactNode
  className?: string
}

export default function Badge({
  variant = 'default',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        {
          'border-border bg-muted text-foreground': variant === 'default',
          'border-success bg-background text-success': variant === 'success',
          'border-warning bg-background text-warning': variant === 'warning',
          'border-destructive bg-background text-destructive':
            variant === 'destructive',
          'border-border bg-background text-muted-foreground':
            variant === 'secondary',
        },
        className,
      )}
    >
      {children}
    </span>
  )
}
