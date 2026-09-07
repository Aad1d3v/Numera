import { Display, Keypad, useCalcEngine, useCalcKeyboard } from './shared'
import type { KeyDef } from './shared'
import type { HistoryEntry } from '../lib/storage'
import type { Seed } from './shared'

export default function Basic({
  pushHistory,
  seed,
}: {
  pushHistory: (e: HistoryEntry) => void
  seed?: Seed | null
}) {
  const engine = useCalcEngine('rad', 'basic', pushHistory, seed)
  useCalcKeyboard(engine)

  const k = (label: string, onPress: () => void, kind?: KeyDef['kind'], ariaLabel?: string): KeyDef => ({
    label,
    onPress,
    kind,
    ariaLabel,
  })

  const keys: KeyDef[] = [
    k('AC', engine.clear, 'action'),
    k('⌫', engine.backspace, 'action', 'Backspace'),
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
    k('±', engine.toggleSign, 'action', 'Toggle sign'),
    k('0', () => engine.insert('0')),
    k('.', () => engine.insert('.')),
    k('=', engine.equals, 'equals'),
  ]

  return (
    <div className="mode-calc">
      <Display engine={engine} />
      <Keypad keys={keys} cols={4} />
    </div>
  )
}
