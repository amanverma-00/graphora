import { ChevronDown, Check } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn, LANGUAGES, type LanguageValue } from '../../lib/utils'

interface LanguageSelectorProps {
  value: string
  onChange: (value: LanguageValue) => void
  className?: string
  disabled?: boolean
}

/**
 * Language selector dropdown for code editor
 */
export function LanguageSelector({
  value,
  onChange,
  className,
  disabled = false,
}: LanguageSelectorProps) {
  const selectedLanguage =
    LANGUAGES.find((lang) => lang.value === value) || LANGUAGES[0]

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium',
          'bg-muted hover:bg-muted/80 border border-border',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
      >
        <span className="text-base">{selectedLanguage.icon}</span>
        <span>{selectedLanguage.label}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            'min-w-[180px] p-1 rounded-lg',
            'bg-popover border border-border shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            'z-50',
          )}
          sideOffset={5}
          align="start"
        >
          {LANGUAGES.map((language) => (
            <DropdownMenu.Item
              key={language.value}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer',
                'outline-none transition-colors',
                value === language.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted',
              )}
              onSelect={() => onChange(language.value)}
            >
              <span className="text-base">{language.icon}</span>
              <span className="flex-1">{language.label}</span>
              {value === language.value && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
