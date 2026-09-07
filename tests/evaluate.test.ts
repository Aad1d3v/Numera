import { describe, expect, it } from 'vitest'
import { applyPercent, EvalError, evaluateExpression } from '../src/lib/evaluate'

describe('evaluateExpression', () => {
  it('respects operator precedence', () => {
    expect(evaluateExpression('2+3*4')).toBe(14)
    expect(evaluateExpression('(2+3)*4')).toBe(20)
  })

  it('supports scientific functions', () => {
    expect(evaluateExpression('sqrt(16)')).toBe(4)
    expect(evaluateExpression('cbrt(27)')).toBe(3)
    expect(evaluateExpression('5!')).toBe(120)
    expect(evaluateExpression('abs(-3)')).toBe(3)
    expect(evaluateExpression('log10(1000)')).toBe(3)
    expect(evaluateExpression('log2(8)')).toBe(3)
    expect(evaluateExpression('log(e)')).toBeCloseTo(1, 10)
  })

  it('handles degree and radian trig', () => {
    expect(evaluateExpression('sin(30)', { angle: 'deg' })).toBeCloseTo(0.5, 10)
    expect(evaluateExpression('cos(60)', { angle: 'deg' })).toBeCloseTo(0.5, 10)
    expect(evaluateExpression('sin(pi/6)')).toBeCloseTo(0.5, 10)
    expect(evaluateExpression('asin(0.5)', { angle: 'deg' })).toBeCloseTo(30, 6)
  })

  it('supports constants and implicit multiplication', () => {
    expect(evaluateExpression('2pi')).toBeCloseTo(Math.PI * 2, 10)
    expect(evaluateExpression('2(3+4)')).toBe(14)
    expect(evaluateExpression('e^2')).toBeCloseTo(Math.E ** 2, 10)
  })

  it('supports the ans variable', () => {
    expect(evaluateExpression('ans+1', { ans: 5 })).toBe(6)
  })

  it('supports reciprocal via ^(-1)', () => {
    expect(evaluateExpression('5^(-1)')).toBe(0.2)
  })

  it('auto-closes parentheses', () => {
    expect(evaluateExpression('2*(3+4')).toBe(14)
  })

  it('throws friendly errors', () => {
    expect(() => evaluateExpression('1/0')).toThrow(EvalError)
    expect(() => evaluateExpression('2+*3')).toThrow(EvalError)
  })
})

describe('applyPercent', () => {
  it('divides by 100 after multiplicative context', () => {
    expect(evaluateExpression(applyPercent('200*10%'))).toBeCloseTo(20, 10)
    expect(evaluateExpression(applyPercent('10%'))).toBeCloseTo(0.1, 10)
  })

  it('adds a relative percent after + and −', () => {
    expect(evaluateExpression(applyPercent('50+10%'))).toBeCloseTo(55, 10)
    expect(evaluateExpression(applyPercent('50-10%'))).toBeCloseTo(45, 10)
    expect(evaluateExpression(applyPercent('2+3+10%'))).toBeCloseTo(5.5, 10)
  })

  it('stays inside parentheses', () => {
    expect(evaluateExpression(applyPercent('(50+10%)'))).toBeCloseTo(55, 10)
    expect(evaluateExpression(applyPercent('2*(50+10%)'))).toBeCloseTo(110, 10)
  })
})
