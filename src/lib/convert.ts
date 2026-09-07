import { create, all } from 'mathjs'

const math = create(all, { number: 'number' })

export interface UnitDef {
  id: string // mathjs unit id
  label: string
}

export interface CategoryDef {
  id: string
  name: string
  from: string
  to: string
  units: UnitDef[]
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: 'length',
    name: 'Length',
    from: 'm',
    to: 'ft',
    units: [
      { id: 'nm', label: 'Nanometer' },
      { id: 'um', label: 'Micrometer' },
      { id: 'mm', label: 'Millimeter' },
      { id: 'cm', label: 'Centimeter' },
      { id: 'm', label: 'Meter' },
      { id: 'km', label: 'Kilometer' },
      { id: 'in', label: 'Inch' },
      { id: 'ft', label: 'Foot' },
      { id: 'yd', label: 'Yard' },
      { id: 'mi', label: 'Mile' },
    ],
  },
  {
    id: 'mass',
    name: 'Mass',
    from: 'kg',
    to: 'lb',
    units: [
      { id: 'mg', label: 'Milligram' },
      { id: 'g', label: 'Gram' },
      { id: 'kg', label: 'Kilogram' },
      { id: 't', label: 'Tonne' },
      { id: 'oz', label: 'Ounce' },
      { id: 'lb', label: 'Pound' },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    from: 'degC',
    to: 'degF',
    units: [
      { id: 'degC', label: 'Celsius' },
      { id: 'degF', label: 'Fahrenheit' },
      { id: 'K', label: 'Kelvin' },
    ],
  },
  {
    id: 'data',
    name: 'Data',
    from: 'GB',
    to: 'GiB',
    units: [
      { id: 'bit', label: 'Bit' },
      { id: 'B', label: 'Byte' },
      { id: 'kB', label: 'Kilobyte' },
      { id: 'KiB', label: 'Kibibyte' },
      { id: 'MB', label: 'Megabyte' },
      { id: 'MiB', label: 'Mebibyte' },
      { id: 'GB', label: 'Gigabyte' },
      { id: 'GiB', label: 'Gibibyte' },
      { id: 'TB', label: 'Terabyte' },
      { id: 'TiB', label: 'Tebibyte' },
    ],
  },
  {
    id: 'time',
    name: 'Time',
    from: 'h',
    to: 'min',
    units: [
      { id: 'ms', label: 'Millisecond' },
      { id: 's', label: 'Second' },
      { id: 'min', label: 'Minute' },
      { id: 'h', label: 'Hour' },
      { id: 'day', label: 'Day' },
      { id: 'week', label: 'Week' },
      { id: 'year', label: 'Year' },
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    from: 'km/h',
    to: 'mi/h',
    units: [
      { id: 'm/s', label: 'Meter/second' },
      { id: 'km/h', label: 'Kilometer/hour' },
      { id: 'mi/h', label: 'Mile/hour' },
      { id: 'kt', label: 'Knot' },
      { id: 'ft/s', label: 'Foot/second' },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    from: 'm^2',
    to: 'ft^2',
    units: [
      { id: 'm^2', label: 'Square meter' },
      { id: 'km^2', label: 'Square kilometer' },
      { id: 'ft^2', label: 'Square foot' },
      { id: 'mi^2', label: 'Square mile' },
      { id: 'acre', label: 'Acre' },
      { id: 'hectare', label: 'Hectare' },
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    from: 'L',
    to: 'gal',
    units: [
      { id: 'mL', label: 'Milliliter' },
      { id: 'L', label: 'Liter' },
      { id: 'm^3', label: 'Cubic meter' },
      { id: 'gal', label: 'Gallon (US)' },
      { id: 'qt', label: 'Quart (US)' },
      { id: 'cup', label: 'Cup (US)' },
      { id: 'floz', label: 'Fluid ounce (US)' },
    ],
  },
]

/** Convert a numeric value between two compatible mathjs units. */
export function convert(value: number, from: string, to: string): number {
  return math.unit(value, from).toNumber(to)
}

/**
 * Parse a converter input that may be a plain number ("3.5") or a
 * calculator expression ("3+1/2", "sqrt(2)"). Returns null when invalid.
 */
export function parseValue(s: string): number | null {
  const trimmed = s.trim()
  if (!trimmed) return null
  const direct = Number(trimmed)
  if (Number.isFinite(direct) && /^-?[\d.]+(?:e-?\d+)?$/i.test(trimmed)) return direct
  try {
    const v = evaluateLoose(trimmed)
    return Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}

// Local evaluator reuse without circular imports: evaluate.ts is safe to import.
import { evaluateExpression } from './evaluate'
function evaluateLoose(expr: string): number {
  return evaluateExpression(expr)
}
