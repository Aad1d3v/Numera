import { create, all } from 'mathjs'

const math = create(all, { number: 'number' })

// Capture the real evaluator before hardening the public namespace: disabling
// `evaluate`/`parse`/… stops expressions from calling them *nested*, while we
// still use the captured original at the top level.
const runEvaluate = math.evaluate.bind(math)

// Harden: mathjs' evaluate() is not a sandbox. Disable the functions that
// allow running arbitrary JS (per the mathjs security guidance). This is a
// client-side calculator evaluating its own input, but defense in depth.
const DISABLED = {
  import: () => {
    throw new Error('Disabled')
  },
  createUnit: () => {
    throw new Error('Disabled')
  },
  parse: () => {
    throw new Error('Disabled')
  },
  evaluate: () => {
    throw new Error('Disabled')
  },
  simplify: () => {
    throw new Error('Disabled')
  },
  classify: () => {
    throw new Error('Disabled')
  },
}
math.import(DISABLED as never, { override: true })

const DEG = Math.PI / 180
// evaluate() results are unknown; math.number accepts any mathjs value.
const num = (x: unknown): number => math.number(x as never)

// In degree mode, override trig so users can type sin(30) meaning 30 degrees.
const degScope: Record<string, (x: unknown) => number> = {
  sin: (x) => Math.sin(num(x) * DEG),
  cos: (x) => Math.cos(num(x) * DEG),
  tan: (x) => Math.tan(num(x) * DEG),
  asin: (x) => Math.asin(num(x)) / DEG,
  acos: (x) => Math.acos(num(x)) / DEG,
  atan: (x) => Math.atan(num(x)) / DEG,
  csc: (x) => 1 / Math.sin(num(x) * DEG),
  sec: (x) => 1 / Math.cos(num(x) * DEG),
  cot: (x) => 1 / Math.tan(num(x) * DEG),
}

export interface EvalOptions {
  angle?: 'deg' | 'rad'
  ans?: number
}

/**
 * Calculator-style percent handling:
 * - After * or / (or standalone): n% → (n/100).      200*10% → 20
 * - After + or -: n% is relative to the left side.   50+10%  → 55
 */
export function applyPercent(src: string): string {
  let s = src
  for (;;) {
    const m = /(\d+(?:\.\d+)?)%/.exec(s)
    if (!m) break
    const numStart = m.index
    const nStr = m[1]
    const afterPct = m.index + m[1].length // index of '%'

    let i = numStart - 1
    while (i >= 0 && /\s/.test(s[i])) i--
    const prev = i >= 0 ? s[i] : ''

    let relative = false
    let opIdx = -1
    if (prev === '+' || prev === '-') {
      opIdx = i
      let j = i - 1
      while (j >= 0 && /\s/.test(s[j])) j--
      const before = j >= 0 ? s[j] : ''
      // It's a binary +/- only if something operand-like precedes it.
      // Function names end with '(', so "sin(" before +/- won't occur in practice.
      relative = before !== '' && !'+-*/^('.includes(before)
    }

    if (relative && opIdx >= 0) {
      // Left side = from after the nearest unmatched '(' (or string start) to the operator.
      let depth = 0
      let start = 0
      for (let k = opIdx - 1; k >= 0; k--) {
        const c = s[k]
        if (c === ')') depth++
        else if (c === '(') {
          if (depth === 0) {
            start = k + 1
            break
          }
          depth--
        }
      }
      const left = s.slice(start, opIdx)
      // Wrap left in its own parens so precedence holds: ((A)*n/100)
      s = s.slice(0, numStart) + '(' + '(' + left + ')*' + nStr + '/100)' + s.slice(afterPct + 1)
    } else {
      s = s.slice(0, numStart) + '(' + nStr + '/100)' + s.slice(afterPct + 1)
    }
  }
  return s
}

function balanceParens(s: string): string {
  const opens = (s.match(/\(/g) || []).length
  const closes = (s.match(/\)/g) || []).length
  if (closes > opens) return s.slice(0, s.length - (closes - opens))
  return s + ')'.repeat(opens - closes)
}

export class EvalError extends Error {}

/** Evaluate a calculator expression and return a plain number. Throws EvalError on bad input. */
export function evaluateExpression(expr: string, opts: EvalOptions = {}): number {
  const cleaned = expr.trim()
  if (!cleaned) throw new EvalError('Empty expression')

  const scope: Record<string, unknown> = { ...(opts.angle === 'deg' ? degScope : {}) }
  if (opts.ans !== undefined) scope.ans = opts.ans

  const prepared = balanceParens(applyPercent(cleaned))

  let result: unknown
  try {
    result = runEvaluate(prepared, scope)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new EvalError(msg.replace(/^.*Error:\s*/, '') || 'Invalid expression')
  }

  if (result !== null && typeof result === 'object') {
    if ('re' in (result as Record<string, unknown>) || (result as { im?: unknown }).im !== undefined) {
      throw new EvalError('Complex results are not supported')
    }
    if (typeof (result as { isUnit?: unknown }).isUnit === 'boolean' && (result as { isUnit: unknown }).isUnit) {
      throw new EvalError('Unit results are not supported here — use the Converter')
    }
    throw new EvalError('Result is not a plain number')
  }

  const value = num(result)
  if (Number.isNaN(value)) throw new EvalError('Undefined result')
  if (!Number.isFinite(value)) throw new EvalError('Cannot divide by zero')
  return value
}
