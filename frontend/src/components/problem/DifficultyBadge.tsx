import { cn, getDifficultyBgColor } from '../../lib/utils'
import type { Difficulty } from '../../types'

interface DifficultyBadgeProps {
  difficulty: Difficulty
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Color-coded difficulty badge component
 * Green for Easy, Yellow for Medium, Red for Hard
 */
export function DifficultyBadge({
  difficulty,
  className,
  size = 'sm',
}: DifficultyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full capitalize',
        getDifficultyBgColor(difficulty),
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-2.5 py-1 text-sm': size === 'md',
          'px-3 py-1.5 text-base': size === 'lg',
        },
        className,
      )}
    >
      {difficulty}
    </span>
  )
}
