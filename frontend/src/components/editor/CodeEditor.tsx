import { useCallback, useRef, useEffect } from 'react'
import Editor, {
  type OnMount,
  type OnChange,
  loader,
} from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'

// Configure Monaco to use local or CDN assets
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs',
  },
})

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  className?: string
  readOnly?: boolean
  height?: string | number
  showLineNumbers?: boolean
  minimap?: boolean
  fontSize?: number
}

/**
 * Monaco-based code editor with theme synchronization
 */
export function CodeEditor({
  value,
  onChange,
  language,
  className,
  readOnly = false,
  height = '100%',
  showLineNumbers = true,
  minimap = false,
  fontSize = 14,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme()
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  // Map language values to Monaco language IDs
  const getMonacoLanguage = (lang: string): string => {
    const langMap: Record<string, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rust: 'rust',
      csharp: 'csharp',
      ruby: 'ruby',
      php: 'php',
      swift: 'swift',
      kotlin: 'kotlin',
    }
    return langMap[lang] || lang
  }

  const handleEditorDidMount: OnMount = useCallback((editor) => {
    editorRef.current = editor

    // Focus editor on mount
    editor.focus()
  }, [])

  const handleEditorChange: OnChange = useCallback(
    (newValue) => {
      onChange(newValue || '')
    },
    [onChange],
  )

  // Update theme when it changes
  useEffect(() => {
    if (editorRef.current) {
      // Theme is automatically handled by the theme prop
    }
  }, [resolvedTheme])

  return (
    <div
      className={cn(
        'w-full h-full min-w-0 min-h-0 overflow-hidden rounded-md',
        className,
      )}
    >
      <Editor
        height={height}
        language={getMonacoLanguage(language)}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          readOnly,
          minimap: { enabled: minimap },
          fontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          fontLigatures: true,
          lineNumbers: showLineNumbers ? 'on' : 'off',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          contextmenu: true,
          folding: true,
          foldingHighlight: true,
          showFoldingControls: 'mouseover',
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-card">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
              <span className="text-sm text-muted-foreground">
                Loading editor...
              </span>
            </div>
          </div>
        }
      />
    </div>
  )
}
