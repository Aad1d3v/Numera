import { describe, expect, it } from 'vitest'
import {
  applyOp,
  fit,
  formatIn,
  negate,
  not,
  parseIn,
  popcount,
  toSigned,
} from '../src/lib/programmer'

describe('word fitting', () => {
  it('wraps values into the word size', () => {
    expect(fit(300n, 8)).toBe(44n) // 300 - 256
    expect(fit(-1n, 8)).toBe(255n)
    expect(fit(70000n, 16)).toBe(4464n)
  })

  it('interprets two-complement correctly', () => {
    expect(toSigned(255n, 8)).toBe(-1n)
    expect(toSigned(127n, 8)).toBe(127n)
    expect(toSigned(128n, 8)).toBe(-128n)
  })
})

describe('applyOp', () => {
  it('wraps on overflow', () => {
    expect(applyOp(255n, '+', 1n, 8)).toBe(0n)
    expect(applyOp(0n, '−', 1n, 8)).toBe(255n)
  })

  it('does bitwise math', () => {
    expect(applyOp(0b1100n, 'AND', 0b1010n, 8)).toBe(0b1000n)
    expect(applyOp(0b1100n, 'OR', 0b1010n, 8)).toBe(0b1110n)
    expect(applyOp(0b1100n, 'XOR', 0b1010n, 8)).toBe(0b0110n)
    expect(applyOp(1n, '<<', 4n, 8)).toBe(16n)
    expect(applyOp(16n, '>>', 2n, 8)).toBe(4n)
  })

  it('divides with truncation and throws on zero', () => {
    expect(applyOp(7n, '÷', 2n, 8)).toBe(3n)
    expect(() => applyOp(7n, '÷', 0n, 8)).toThrow('Division by zero')
    expect(() => applyOp(7n, 'mod', 0n, 8)).toThrow('Division by zero')
  })
})

describe('unary ops', () => {
  it('flips all bits', () => {
    expect(not(0b00001111n, 8)).toBe(0b11110000n)
    expect(not(0n, 8)).toBe(255n)
  })

  it('negates via two-complement', () => {
    expect(negate(1n, 8)).toBe(255n)
    expect(toSigned(negate(5n, 8), 8)).toBe(-5n)
  })
})

describe('parseIn / formatIn', () => {
  it('parses digits per base and rejects invalid', () => {
    expect(parseIn('FF', 16)).toBe(255n)
    expect(parseIn('777', 8)).toBe(511n)
    expect(parseIn('1010', 2)).toBe(10n)
    expect(parseIn('19', 8)).toBeNull()
    expect(parseIn('GG', 16)).toBeNull()
  })

  it('formats with grouping', () => {
    expect(formatIn(5n, 2, 8, false)).toBe('0000 0101')
    expect(formatIn(255n, 16, 8, false)).toBe('FF')
    expect(formatIn(255n, 16, 16, false)).toBe('00FF')
    expect(formatIn(1234567n, 10, 64, false)).toBe('1,234,567')
  })

  it('formats signed decimal', () => {
    expect(formatIn(255n, 10, 8, true)).toBe('-1')
    expect(formatIn(255n, 10, 8, false)).toBe('255')
  })
})

describe('popcount', () => {
  it('counts set bits', () => {
    expect(popcount(0b1011n)).toBe(3)
    expect(popcount(0n)).toBe(0)
  })
})
