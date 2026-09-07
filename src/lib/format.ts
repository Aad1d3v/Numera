const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
  '+': '',
}

export function toSuperscript(s: string): string {
  return s
    .split('')
    .map((c) => SUPERSCRIPTS[c] ?? c)
    .join('')
}

function groupThousands(intPart: string): string {
  const neg = intPart.startsWith('-')
  const digits = neg ? intPart.slice(1) : intPart
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return (neg ? '-' : '') + grouped
}

/** Format a computed number for the calculator result line. */
export function formatResult(x: number, opts: { group?: boolean } = {}): string {
  if (!Number.isFinite(x)) return x > 0 ? '∞' : Number.isNaN(x) ? 'Error' : '-∞'
  if (x === 0) return '0'

  // Trim float noise to 12 significant digits.
  const rounded = Number(x.toPrecision(12))
  const abs = Math.abs(rounded)

  if (Number.isInteger(rounded) && abs < 1e15) {
    return opts.group === false ? String(rounded) : groupThousands(String(rounded))
  }

  if (abs >= 1e12 || abs < 1e-9) {
    // Scientific notation: 1.234e+12 → 1.234×10¹²
    const [mantissa, exponent] = rounded.toExponential(8).split('e')
    const trimmedMantissa = mantissa.replace(/\.?0+$/, '')
    const expNum = Number(exponent)
    return `${trimmedMantissa}×10${toSuperscript(String(expNum))}`
  }

  // Plain decimal — strip trailing zeros from the fractional part.
  let str = String(rounded)
  if (str.includes('e')) {
    str = rounded.toFixed(Math.max(0, 12 - Math.floor(Math.log10(abs)) - 1))
  }
  const [int, frac] = str.split('.')
  const trimmedFrac = frac ? frac.replace(/0+$/, '') : ''
  const intStr = opts.group === false ? int : groupThousands(int)
  return trimmedFrac ? `${intStr}.${trimmedFrac}` : intStr
}

/** Prettify an internal mathjs-style expression for display. */
export function prettifyExpr(s: string): string {
  return s
    .replace(/\bpi\b/g, 'π')
    .replace(/\bsqrt\(/g, '√(')
    .replace(/\bcbrt\(/g, '∛(')
    .replace(/\blog10\(/g, 'log₁₀(')
    .replace(/\blog2\(/g, 'log₂(')
    .replace(/\*10\^/g, '×10^')
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/-/g, '−')
}

/** Short label for the graph hover, etc. (no fancy glyphs). */
export function formatShort(x: number): string {
  if (!Number.isFinite(x)) return '—'
  const abs = Math.abs(x)
  if (abs !== 0 && (abs >= 1e6 || abs < 1e-4)) {
    return x.toExponential(3)
  }
  return String(Number(x.toPrecision(8)))
}
