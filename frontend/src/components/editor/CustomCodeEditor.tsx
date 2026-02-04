import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { cn, type LanguageValue } from '../../lib/utils'

interface CustomCodeEditorProps {
    value: string
    onChange: (value: string) => void
    language: LanguageValue
    onLanguageChange: (language: LanguageValue) => void
    className?: string
    readOnly?: boolean
}

// Language options for the tab selector
const EDITOR_LANGUAGES = [
    { value: 'javascript' as const, label: 'JavaScript' },
    { value: 'java' as const, label: 'Java' },
    { value: 'cpp' as const, label: 'C++' },
] as const

// Syntax highlighting patterns by language
const getSyntaxPatterns = (lang: string) => {
    const commonPatterns = {
        string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g,
        comment: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
        number: /\b\d+\.?\d*\b/g,
    }

    const keywords: Record<string, RegExp> = {
        javascript: /\b(const|let|var|function|return|if|else|for|while|class|new|this|async|await|import|export|default|from|try|catch|throw|finally|typeof|instanceof|null|undefined|true|false)\b/g,
        java: /\b(public|private|protected|static|final|class|interface|extends|implements|new|return|if|else|for|while|void|int|boolean|String|double|float|long|short|byte|char|null|true|false|try|catch|throw|throws|finally|import|package|this|super)\b/g,
        cpp: /\b(int|char|float|double|bool|void|long|short|unsigned|signed|const|static|class|struct|public|private|protected|virtual|override|new|delete|return|if|else|for|while|do|switch|case|break|continue|namespace|using|include|define|nullptr|true|false|try|catch|throw|template|typename)\b/g,
    }

    const functions: Record<string, RegExp> = {
        javascript: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
        java: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
        cpp: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
    }

    return {
        ...commonPatterns,
        keyword: keywords[lang] || keywords.javascript,
        function: functions[lang] || functions.javascript,
    }
}

// Tokenize and highlight code
const highlightCode = (code: string, language: string): string => {
    const patterns = getSyntaxPatterns(language)

    // Escape HTML
    let highlighted = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    // Store replacements to avoid conflicts
    const replacements: { start: number; end: number; html: string }[] = []

    // Find all matches for each pattern type
    const findMatches = (regex: RegExp, className: string) => {
        let match
        const pattern = new RegExp(regex.source, regex.flags)
        while ((match = pattern.exec(highlighted)) !== null) {
            replacements.push({
                start: match.index,
                end: match.index + match[0].length,
                html: `<span class="syntax-${className}">${match[0]}</span>`,
            })
        }
    }

    // Process patterns in order of priority (comments and strings first)
    findMatches(patterns.comment, 'comment')
    findMatches(patterns.string, 'string')

    // Sort by start position (reverse to replace from end)
    replacements.sort((a, b) => b.start - a.start)

    // Apply comment and string replacements first
    for (const r of replacements) {
        highlighted = highlighted.slice(0, r.start) + r.html + highlighted.slice(r.end)
    }

    // Now apply keyword and function highlighting (avoid already highlighted parts)
    highlighted = highlighted.replace(patterns.keyword, '<span class="syntax-keyword">$&</span>')
    highlighted = highlighted.replace(patterns.number, '<span class="syntax-number">$&</span>')

    // Highlight function names (avoiding already highlighted)
    highlighted = highlighted.replace(
        /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
        (match, name) => {
            if (match.includes('syntax-')) return match
            return `<span class="syntax-function">${name}</span>(`
        }
    )

    return highlighted
}

/**
 * Custom code editor with syntax highlighting and line numbers
 * Matching the reference design with dark theme and language tabs
 */
export function CustomCodeEditor({
    value,
    onChange,
    language,
    onLanguageChange,
    className,
    readOnly = false,
}: CustomCodeEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const preRef = useRef<HTMLPreElement>(null)
    const lineNumbersRef = useRef<HTMLDivElement>(null)
    const [isFocused, setIsFocused] = useState(false)

    // Calculate line numbers
    const lines = useMemo(() => {
        const lineCount = value.split('\n').length
        return Array.from({ length: lineCount }, (_, i) => i + 1)
    }, [value])

    // Highlighted code for display
    const highlightedCode = useMemo(() => {
        return highlightCode(value, language)
    }, [value, language])

    // Sync scroll between textarea and highlighted pre
    const handleScroll = useCallback(() => {
        if (textareaRef.current && preRef.current && lineNumbersRef.current) {
            preRef.current.scrollTop = textareaRef.current.scrollTop
            preRef.current.scrollLeft = textareaRef.current.scrollLeft
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
        }
    }, [])

    // Handle tab key for indentation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Tab') {
                e.preventDefault()
                const textarea = textareaRef.current
                if (!textarea) return

                const start = textarea.selectionStart
                const end = textarea.selectionEnd

                const newValue = value.slice(0, start) + '  ' + value.slice(end)
                onChange(newValue)

                // Set cursor position after tab
                requestAnimationFrame(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + 2
                })
            }
        },
        [value, onChange]
    )

    // Auto-resize to fit content
    useEffect(() => {
        if (textareaRef.current && preRef.current) {
            const textarea = textareaRef.current
            textarea.style.height = 'auto'
            textarea.style.height = `${Math.max(textarea.scrollHeight, 200)}px`
        }
    }, [value])

    return (
        <div className={cn('flex flex-col h-full bg-[#0d1117] overflow-hidden', className)}>
            {/* Language Tabs */}
            <div className="flex items-center gap-1 px-3 py-2 bg-[#161b22] border-b border-[#30363d]">
                {EDITOR_LANGUAGES.map((lang) => (
                    <button
                        key={lang.value}
                        onClick={() => onLanguageChange(lang.value)}
                        className={cn(
                            'px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                            language === lang.value
                                ? 'bg-[#238636] text-white shadow-md'
                                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
                        )}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>

            {/* Editor Area */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Line Numbers */}
                <div
                    ref={lineNumbersRef}
                    className="flex-shrink-0 py-3 px-2 bg-[#0d1117] text-[#484f58] text-right font-mono text-sm select-none overflow-hidden border-r border-[#21262d]"
                    style={{ minWidth: '3rem' }}
                >
                    {lines.map((num) => (
                        <div key={num} className="leading-6 h-6">
                            {num}
                        </div>
                    ))}
                </div>

                {/* Code Area */}
                <div className="flex-1 relative min-w-0 overflow-hidden">
                    {/* Highlighted code overlay */}
                    <pre
                        ref={preRef}
                        className="absolute inset-0 p-3 m-0 font-mono text-sm leading-6 text-[#c9d1d9] whitespace-pre overflow-auto pointer-events-none"
                        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace" }}
                        aria-hidden="true"
                        dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }}
                    />

                    {/* Actual textarea for input */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onScroll={handleScroll}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        readOnly={readOnly}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoCorrect="off"
                        className={cn(
                            'absolute inset-0 w-full h-full p-3 m-0 font-mono text-sm leading-6 resize-none',
                            'bg-transparent text-transparent caret-[#58a6ff] outline-none',
                            'overflow-auto scrollbar-thin',
                            isFocused && 'ring-0'
                        )}
                        style={{
                            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                            WebkitTextFillColor: 'transparent',
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
