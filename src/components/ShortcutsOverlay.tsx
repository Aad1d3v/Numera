import { MODES } from '../modes/registry'
import { IconX } from './Icons'

const SHORTCUTS: [string, string][] = [
  ['0–9 . ( )', 'Type numbers and parentheses'],
  ['+ − * / ^', 'Operators (also ÷ × on the keypad)'],
  ['%', 'Percent — see the note below'],
  ['Enter or =', 'Evaluate'],
  ['Backspace', 'Delete last entry'],
  ['Esc', 'Clear the calculator'],
  ['Alt + 1…6', 'Switch mode'],
  ['?', 'Toggle this help'],
]

export default function ShortcutsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" role="dialog" aria-label="Keyboard shortcuts" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>Keyboard shortcuts</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </header>
        <ul className="shortcut-list">
          {SHORTCUTS.map(([k, d]) => (
            <li key={k}>
              <kbd>{k}</kbd>
              <span>{d}</span>
            </li>
          ))}
        </ul>
        <div className="shortcut-note">
          <b>Percent, the smart way</b>
          <p>
            <code>200×10%</code> → 20 (plain percent), while <code>50+10%</code> → 55 (adds 10% of 50) and{' '}
            <code>50−10%</code> → 45 — just like a desk calculator.
          </p>
        </div>
        <div className="shortcut-modes">
          {MODES.map((m, i) => (
            <span key={m.id}>
              <kbd>Alt+{i + 1}</kbd> {m.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
