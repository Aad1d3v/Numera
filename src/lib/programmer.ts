/**
 * Pure BigInt word-arithmetic for the Programmer mode.
 * Values are always kept in unsigned canonical form for the given word size.
 */

export type WordSize = 8 | 16 | 32 | 64
export type Base = 2 | 8 | 10 | 16

export function maskFor(size: WordSize): bigint {
  return (1n << BigInt(size)) - 1n
}

/** Reduce any BigInt into unsigned canonical form for the word size. */
export function fit(v: bigint, size: WordSize): bigint {
  const m = maskFor(size)
  return ((v % (m + 1n)) + (m + 1n)) % (m + 1n)
}

/** Interpret an unsigned canonical value as two's-complement signed. */
export function toSigned(v: bigint, size: WordSize): bigint {
  const signBit = 1n << BigInt(size - 1)
  return v & signBit ? v - (1n << BigInt(size)) : v
}

export const WORD_OPS = ['+', '−', '×', '÷', 'mod', 'AND', 'OR', 'XOR', '<<', '>>'] as const
export type WordOp = (typeof WORD_OPS)[number]

export function applyOp(a: bigint, op: WordOp, b: bigint, size: WordSize): bigint {
  const bs = toSigned(b, size)
  switch (op) {
    case '+':
      return fit(a + b, size)
    case '−':
      return fit(a - b, size)
    case '×':
      return fit(a * b, size)
    case '÷':
      if (b === 0n) throw new Error('Division by zero')
      // Signed integer division like most programmer calculators
      if (bs < 0) {
        const absA = toSigned(a, size)
        return fit(absA / bs, size)
      }
      return fit(a / b, size)
    case 'mod':
      if (b === 0n) throw new Error('Division by zero')
      return fit(toSigned(a, size) % bs, size)
    case 'AND':
      return a & b
    case 'OR':
      return a | b
    case 'XOR':
      return a ^ b
    case '<<':
      return fit(a << (bs < 0n ? 0n : b), size)
    case '>>':
      return bs < 0n ? a : a >> b
  }
}

export function not(v: bigint, size: WordSize): bigint {
  return fit(~v, size)
}

export function negate(v: bigint, size: WordSize): bigint {
  return fit(-v, size)
}

const BASE_PATTERNS: Record<Base, RegExp> = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  10: /^[0-9]+$/,
  16: /^[0-9a-fA-F]+$/,
}

/** Parse a raw digit string in the given base. Returns null on invalid input. */
export function parseIn(s: string, base: Base): bigint | null {
  const cleaned = s.replace(/[\s_]/g, '')
  if (cleaned.length === 0) return 0n
  if (!BASE_PATTERNS[base].test(cleaned)) return null
  try {
    const prefix = base === 2 ? '0b' : base === 8 ? '0o' : base === 16 ? '0x' : ''
    return BigInt(prefix + cleaned)
  } catch {
    return null
  }
}

function group(s: string, every: number, sep = ' '): string {
  const out: string[] = []
  for (let i = s.length; i > 0; i -= every) {
    out.unshift(s.slice(Math.max(0, i - every), i))
  }
  return out.join(sep)
}

/** Format an unsigned canonical value for display. Decimal honors signed interpretation. */
export function formatIn(v: bigint, base: Base, size: WordSize, signed: boolean): string {
  const m = maskFor(size)
  const canonical = v & m
  switch (base) {
    case 10: {
      const shown = signed ? toSigned(canonical, size) : canonical
      return group(shown.toString(10).replace('-', ''), 3, ',').replace(/^/, shown < 0n ? '-' : '')
    }
    case 16: {
      const width = size / 4
      const hex = canonical.toString(16).toUpperCase().padStart(width, '0')
      return group(hex, 4)
    }
    case 8: {
      const width = Math.ceil(size / 3)
      const oct = canonical.toString(8).padStart(width, '0')
      return group(oct, 3)
    }
    case 2: {
      const bin = canonical.toString(2).padStart(size, '0')
      return group(bin, 4)
    }
  }
}

/** Total number of set bits (for the bit-count readout). */
export function popcount(v: bigint): number {
  let n = v
  let count = 0
  while (n) {
    n &= n - 1n
    count++
  }
  return count
}
