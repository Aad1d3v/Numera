import { Display, Keypad, useCalcEngine, useCalcKeyboard } from './shared'
import type { CalcEngine, KeyDef } from './shared'
import type { ReactNode } from 'react'
import type { HistoryEntry } from '../lib/storage'
import type { Seed } from './shared'

function fnKeys(engine: CalcEngine): KeyDef[] {
  const f = (label: ReactNode, token: string, ariaLabel?: string): KeyDef => ({
    label,
    onPress: () => engine.insert(token),
    kind: 'fn',
    ariaLabel,
  })
  const sup = <sup>-1</sup>
  return [
    f('sin', 'sin('),
    f('cos', 'cos('),
    f('tan', 'tan('),
    { label: 'π', onPress: () => engine.insert('pi'), kind: 'fn' },
    { label: 'e', onPress: () => engine.insert('e'), kind: 'fn' },
    f(
      <span>
        sin{sup}
      </span>,
      'asin(',
      'arcsine',
    ),
    f(
      <span>
        cos{sup}
      </span>,
      'acos(',
      'arccosine',
    ),
    f(
      <span>
        tan{sup}
      </span>,
      'atan(',
      'arctangent',
    ),
    { label: 'x!', onPress: () => engine.insert('!'), kind: 'fn', ariaLabel: 'factorial' },
    f('|x|', 'abs(', 'absolute value'),
    { label: 'x²', onPress: () => engine.insert('^2'), kind: 'fn', ariaLabel: 'squared' },
    { label: 'xʸ', onPress: () => engine.insert('^'), kind: 'fn', ariaLabel: 'power' },
    f('√', 'sqrt(', 'square root'),
    f('∛', 'cbrt(', 'cube root'),
    { label: '1/x', onPress: () => engine.insert('^(-1)'), kind: 'fn', ariaLabel: 'reciprocal' },
    f('ln', 'log('),
    f('log', 'log10('),
    f('log₂', 'log2('),
    { label: '×10ˣ', onPress: () => engine.insert('*10^'), kind: 'fn', ariaLabel: 'times ten to the power' },
    { label: 'ans', onPress: () => engine.insert('ans'), kind: 'fn', ariaLabel: 'last answer' },
  ]
}

export default function Scientific({
  angle,
  onAngleChange,
  pushHistory,
  seed,
}: {
  angle: 'deg' | 'rad'
  onAngleChange: (a: 'deg' | 'rad') => void
  pushHistory: (e: HistoryEntry) => void
  seed?: Seed | null
}) {
  const engine = useCalcEngine(angle, 'scientific', pushHistory, seed)
  useCalcKeyboard(engine)

  const k = (label: string, onPress: () => void, kind?: KeyDef['kind'], ariaLabel?: string): KeyDef => ({
    label,
    onPress,
    kind,
    ariaLabel,
  })

  const mainKeys: KeyDef[] = [
    k('AC', engine.clear, 'action'),
    k('(', () => engine.insert('(')),
    k(')', () => engine.insert(')')),
    k('%', () => engine.insert('%'), 'op'),
    k('÷', () => engine.insert('/', { op: true }), 'op'),
    k('7', () => engine.insert('7')),
    k('8', () => engine.insert('8')),
    k('9', () => engine.insert('9')),
    k('×', () => engine.insert('*', { op: true }), 'op'),
    k('4', () => engine.insert('4')),
    k('5', () => engine.insert('5')),
    k('6', () => engine.insert('6')),
    k('−', () => engine.insert('-', { op: true }), 'op'),
    k('1', () => engine.insert('1')),
    k('2', () => engine.insert('2')),
    k('3', () => engine.insert('3')),
    k('+', () => engine.insert('+', { op: true }), 'op'),
    k('⌫', engine.backspace, 'action', 'Backspace'),
    k('0', () => engine.insert('0')),
    k('.', () => engine.insert('.')),
    k('=', engine.equals, 'equals'),
  ]

  return (
    <div className="mode-calc mode-sci">
      <Display engine={engine} showAngle angle={angle} onAngleChange={onAngleChange} />
      <Keypad keys={fnKeys(engine)} cols={5} />
      <Keypad keys={mainKeys} cols={4} />
    </div>
  )
}
