import { useMemo, useState } from 'react'
import { CATEGORIES, convert, parseValue } from '../lib/convert'
import { formatResult } from '../lib/format'

export default function Converter() {
  const [catId, setCatId] = useState(CATEGORIES[0].id)
  const cat = CATEGORIES.find((c) => c.id === catId) ?? CATEGORIES[0]
  const [from, setFrom] = useState(cat.from)
  const [to, setTo] = useState(cat.to)
  const [raw, setRaw] = useState('1')

  const selectCat = (id: string) => {
    const c = CATEGORIES.find((x) => x.id === id) ?? CATEGORIES[0]
    setCatId(id)
    setFrom(c.from)
    setTo(c.to)
  }

  const parsed = useMemo(() => parseValue(raw), [raw])
  const result = useMemo(() => {
    if (parsed === null || from === to) return null
    try {
      return convert(parsed, from, to)
    } catch {
      return null
    }
  }, [parsed, from, to])

  const unitLabel = (id: string) => cat.units.find((u) => u.id === id)?.label ?? id

  const allConversions = useMemo(() => {
    if (parsed === null) return []
    return cat.units
      .filter((u) => u.id !== from)
      .map((u) => {
        try {
          return { label: unitLabel(u.id), value: convert(parsed, from, u.id) }
        } catch {
          return null
        }
      })
      .filter((x): x is { label: string; value: number } => x !== null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, cat, from])

  const swap = () => {
    setFrom(to)
    setTo(from)
  }

  return (
    <div className="mode-convert">
      <div className="cat-pills" role="tablist" aria-label="Category">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={c.id === catId}
            className={`cat-pill ${c.id === catId ? 'active' : ''}`}
            onClick={() => selectCat(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="convert-card">
        <div className="convert-row">
          <div className="convert-field">
            <input
              className="convert-input"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Value or expression"
              spellCheck={false}
              inputMode="decimal"
              aria-label="Value to convert"
            />
            <select className="convert-select" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From unit">
              {cat.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <button className="convert-swap" onClick={swap} aria-label="Swap units">
            ⇄
          </button>
          <div className="convert-field">
            <div className={`convert-result ${result === null ? 'invalid' : ''}`}>
              {parsed === null ? '—' : result === null ? '—' : formatResult(result)}
            </div>
            <select className="convert-select" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To unit">
              {cat.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {parsed !== null && from !== to && (
          <p className="convert-line">
            {formatResult(parsed)} {unitLabel(from).toLowerCase()} ={' '}
            {result !== null ? formatResult(result) : '—'} {unitLabel(to).toLowerCase()}
          </p>
        )}
      </div>

      {allConversions.length > 0 && (
        <div className="convert-all">
          <h3>
            {formatResult(parsed ?? 0)} {unitLabel(from).toLowerCase()} in every {cat.name.toLowerCase()} unit
          </h3>
          <ul>
            {allConversions.map((c) => (
              <li key={c.label}>
                <span>{c.label}</span>
                <b>{formatResult(c.value)}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
