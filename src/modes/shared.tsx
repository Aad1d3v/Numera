import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { EvalError, evaluateExpression } from '../lib/evaluate'
import { formatResult, prettifyExpr } from '../lib/format'
import { makeEntry } from '../lib/storage'
import type { HistoryEntry } from '../lib/storage'

export interface Seed {
  text: string
  nonce: number
}

export interface CalcEngine {
  expr: string
  display: string
  preview: string | null
  result: string | null
  error: string | null
  memory: number | null
  insert: (token: string, opts?: { op?: boolean }) => void
  backspace: () => void
  clear: () => void
  equals: () => void
  toggleSign: () => void
  memoryAdd: () => void
  memoryRecall: () => void
  memoryClear: () => void
}

export function useCalcEngine(
  angle: 'deg' | 'rad',
  mode: string,
  pushHistory: (e: HistoryEntry) => void,
  seed?: Seed | null,
): CalcEngine {
  const [expr, setExpr] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [memory, setMemory] = useState<number | null>(null)
  const justEvaluated = useRef(false)
  const ansValue = useRef(0)
  const lastValue = useRef(0)
  const seedNonce = useRef<number | null>(null)

  // Photo-help / history seeds an expression into the engine once.
  useEffect(() => {
    if (seed && seed.nonce !== seedNonce.current) {
      seedNonce.current = seed.nonce
      setExpr(seed.text)
      setResult(null)
      setError(null)
      justEvaluated.current = false
    }
  }, [seed])

  const compute = useCallback(
    (input: string): number | null => {
      try {
        const v = evaluateExpression(input, { angle, ans: ansValue.current })
        lastValue.current = v
        return v
      } catch {
        return null
      }
    },
    [angle],
  )

  const preview = useMemo(() => {
    if (!expr.trim()) return null
    const v = compute(expr)
    return v === null ? null : formatResult(v)
  }, [expr, compute])

  const insert = useCallback((token: string, opts?: { op?: boolean }) => {
    setExpr((prev) => {
      const base = justEvaluated.current ? (opts?.op ? 'ans' : '') : prev
      justEvaluated.current = false
      setError(null)
      setResult(null)
      return base + token
    })
  }, [])

  const backspace = useCallback(() => {
    setExpr((prev) => {
      if (justEvaluated.current) {
        justEvaluated.current = false
        setResult(null)
        return ''
      }
      if (prev.endsWith('ans')) return prev.slice(0, -3)
      return prev.slice(0, -1)
    })
  }, [])

  const clear = useCallback(() => {
    setExpr('')
    setResult(null)
    setError(null)
    justEvaluated.current = false
  }, [])

  const equals = useCallback(() => {
    if (!expr.trim()) return
    try {
      const v = evaluateExpression(expr, { angle, ans: ansValue.current })
      ansValue.current = v
      lastValue.current = v
      const formatted = formatResult(v)
      setResult(formatted)
      setError(null)
      justEvaluated.current = true
      pushHistory(makeEntry(mode, expr, formatted))
    } catch (err) {
      setResult(null)
      setError(err instanceof EvalError ? err.message : 'Invalid expression')
    }
  }, [expr, angle, mode, pushHistory])

  const toggleSign = useCallback(() => {
    setExpr((prev) => {
      const m = /(\d+\.?\d*)$/.exec(prev)
      if (!m) return prev
      const start = prev.length - m[0].length
      const before = prev.slice(0, start)
      if (before.endsWith('(-')) return before.slice(0, -2) + m[1]
      return before + '(-' + m[1] + ')'
    })
  }, [])

  const memoryAdd = useCallback(() => {
    setMemory((prev) => (prev ?? 0) + lastValue.current)
  }, [])

  const memoryRecall = useCallback(() => {
    if (memory !== null) insert(String(memory))
  }, [memory, insert])

  const memoryClear = useCallback(() => setMemory(null), [])

  return {
    expr,
    display: prettifyExpr(expr),
    preview,
    result,
    error,
    memory,
    insert,
    backspace,
    clear,
    equals,
    toggleSign,
    memoryAdd,
    memoryRecall,
    memoryClear,
  }
}

export interface DisplayProps {
  engine: CalcEngine
  showAngle?: boolean
  angle?: 'deg' | 'rad'
  onAngleChange?: (a: 'deg' | 'rad') => void
}

export function Display({ engine, showAngle, angle, onAngleChange }: DisplayProps) {
  const exprRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = exprRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [engine.display])

  return (
    <div className="calc-display">
      <div className="calc-display-top">
        {showAngle && angle && onAngleChange ? (
          <div className="seg" role="tablist" aria-label="Angle unit">
            {(['deg', 'rad'] as const).map((a) => (
              <button
                key={a}
                role="tab"
                aria-selected={angle === a}
                className={angle === a ? 'seg-item active' : 'seg-item'}
                onClick={() => onAngleChange(a)}
              >
                {a.toUpperCase()}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        {engine.memory !== null && <span className="mem-chip">M</span>}
      </div>
      <div className="calc-expr" ref={exprRef}>
        {engine.display || <span className="calc-placeholder">0</span>}
      </div>
      {engine.error ? (
        <div className="calc-error" role="alert">
          {engine.error}
        </div>
      ) : engine.result !== null ? (
        <div className="calc-result">{engine.result}</div>
      ) : engine.preview !== null && engine.display !== engine.preview ? (
        <div className="calc-preview">{engine.preview}</div>
      ) : null}
    </div>
  )
}

export interface KeyDef {
  label: ReactNode
  onPress: () => void
  kind?: 'digit' | 'op' | 'fn' | 'action' | 'equals'
  ariaLabel?: string
}

export function Keypad({ keys, cols }: { keys: KeyDef[]; cols: number }) {
  return (
    <div className="keypad" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {keys.map((k, i) => (
        <button
          key={i}
          type="button"
          className={`key k-${k.kind ?? 'digit'}`}
          onClick={k.onPress}
          aria-label={k.ariaLabel ?? (typeof k.label === 'string' ? k.label : undefined)}
        >
          {k.label}
        </button>
      ))}
    </div>
  )
}

/** Wire global keyboard input to a calc engine. Skips when typing in inputs. */
export function useCalcKeyboard(engine: CalcEngine) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const { key } = e
      if (/^[0-9]$/.test(key)) return engine.insert(key)
      if (key === '.') return engine.insert('.')
      if (key === '+') return engine.insert('+', { op: true })
      if (key === '-') return engine.insert('-', { op: true })
      if (key === '*') return engine.insert('*', { op: true })
      if (key === '/') {
        e.preventDefault()
        return engine.insert('/', { op: true })
      }
      if (key === '^') return engine.insert('^')
      if (key === '%') return engine.insert('%')
      if (key === '(') return engine.insert('(')
      if (key === ')') return engine.insert(')')
      if (key === 'Enter' || key === '=') {
        e.preventDefault()
        return engine.equals()
      }
      if (key === 'Backspace') {
        e.preventDefault()
        return engine.backspace()
      }
      if (key === 'Escape' || key === 'Delete') return engine.clear()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [engine])
}
