import { prettifyExpr } from '../lib/format'
import type { HistoryEntry } from '../lib/storage'
import { modeById } from '../modes/registry'
import { IconTrash, IconX } from './Icons'

export default function HistoryPanel({
  open,
  entries,
  onClose,
  onPick,
  onClear,
}: {
  open: boolean
  entries: HistoryEntry[]
  onClose: () => void
  onPick: (expr: string) => void
  onClear: () => void
}) {
  return (
    <>
      <div className={`scrim ${open ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`history-panel ${open ? 'open' : ''}`} aria-hidden={!open} aria-label="History">
        <header className="history-head">
          <h2>History</h2>
          <div className="history-head-actions">
            {entries.length > 0 && (
              <button className="icon-btn" onClick={onClear} aria-label="Clear history" title="Clear history">
                <IconTrash size={18} />
              </button>
            )}
            <button className="icon-btn" onClick={onClose} aria-label="Close history">
              <IconX size={18} />
            </button>
          </div>
        </header>
        {entries.length === 0 ? (
          <p className="history-empty">Nothing yet — results you calculate will appear here.</p>
        ) : (
          <ul className="history-list">
            {entries.map((e) => {
              const m = modeById(e.mode)
              return (
                <li key={e.id}>
                  <button className="history-item" onClick={() => onPick(e.expr)} title="Use this expression">
                    <span className="history-item-meta">
                      <span className="history-mode-chip" style={{ color: m.color }}>
                        {m.label}
                      </span>
                      <time>{new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                    </span>
                    <span className="history-expr">{prettifyExpr(e.expr)}</span>
                    <span className="history-result">= {e.result}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </aside>
    </>
  )
}
