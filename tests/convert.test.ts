import { describe, expect, it } from 'vitest'
import { convert, parseValue } from '../src/lib/convert'

describe('convert', () => {
  it('converts length', () => {
    expect(convert(1, 'ft', 'm')).toBeCloseTo(0.3048, 10)
    expect(convert(5, 'km', 'mi')).toBeCloseTo(3.106856, 5)
  })

  it('converts temperature (affine units)', () => {
    expect(convert(100, 'degC', 'degF')).toBeCloseTo(212, 10)
    expect(convert(32, 'degF', 'degC')).toBeCloseTo(0, 10)
    expect(convert(0, 'degC', 'K')).toBeCloseTo(273.15, 10)
  })

  it('converts binary vs decimal data units', () => {
    expect(convert(1, 'GiB', 'MiB')).toBeCloseTo(1024, 10)
    expect(convert(1, 'GB', 'GiB')).toBeCloseTo(0.9313225746154785, 6)
  })

  it('converts speed and area', () => {
    expect(convert(100, 'km/h', 'mi/h')).toBeCloseTo(62.1371, 4)
    expect(convert(1, 'm^2', 'ft^2')).toBeCloseTo(10.7639, 4)
    expect(convert(1, 'hectare', 'acre')).toBeCloseTo(2.47105, 5)
  })
})

describe('parseValue', () => {
  it('accepts plain numbers', () => {
    expect(parseValue('3.5')).toBe(3.5)
    expect(parseValue('-12')).toBe(-12)
  })

  it('accepts expressions', () => {
    expect(parseValue('3+1/2')).toBe(3.5)
    expect(parseValue('sqrt(16)')).toBe(4)
  })

  it('rejects garbage', () => {
    expect(parseValue('abc')).toBeNull()
    expect(parseValue('')).toBeNull()
  })
})
