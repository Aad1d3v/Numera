import { useCallback, useMemo, useState } from 'react'
import {
  applyOp,
  formatIn,
  negate,
  not,
  parseIn,
  popcount,
  toSigned,
  WORD_OPS,
  type Base,
  type WordOp,
  type WordSize,
} from '../lib/programmer'
import { makeEntry } from '../lib/storage'
import type { HistoryEntry } from '../lib/storage'

const BASES: { id: Base; label: string }[] = [
  { id: 16, label: 'HEX' },
  { id: 10, label: 'DEC' },
  { id: 8, label: 'OCT' },
  { id: 2, label: 'BIN' },
]

const HEX_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']

export default function Programmer({ pushHistory }: { pushHistory: (e: HistoryEntry) => void }) {
  const [entry, setEntry] = useState('0')
  const [left, setLeft] = useState<bigint | null>(null)
  const [op, setOp] = useState<WordOp | null>(null)
  const [base, setBase] = useState<Base>(10)
  const [size, setSize] = useState<WordSize>(16)
  const [signed, setSigned] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [justEvaluated, setJustEvaluated] = useState(false)

  const value = useMemo(() => parseIn(entry || '0', base) ?? 0n, [entry, base])

  const digit = useCallback(
    (d: string) => {
      setError(null)
      if (justEvaluated) {
        setJustEvaluated(false)
        setEntry(d)
        return
      }
      setEntry((prev) => {
        const next = (prev === '0' ? '' : prev) + d
        return parseIn(next, base) === null ? prev : next
      })
    },
    [base, justEvaluated],
  )

  const chooseOp = useCallback(
    (next: WordOp) => {
      setError(null)
      if (left !== null && op && !justEvaluated) {
        try {
          setLeft(applyOp(left, op, value, size))
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error')
          return
        }
      } else {
        setLeft(value)
      }
      setOp(next)
      setEntry('0')
      setJustEvaluated(false)
    },
    [left, op, value, size, justEvaluated],
  )

  const equals = useCallback(() => {
    if (left === null || !op) return
    try {
      const r = applyOp(left, op, value, size)
      pushHistory(
        makeEntry(
          'programmer',
          `${formatIn(left, 10, size, signed)} ${op} ${formatIn(value, 10, size, signed)}`,
          formatIn(r, 10, size, signed),
        ),
      )
      setEntry(r.toString(base).toUpperCase())
      setLeft(null)
      setOp(null)
      setJustEvaluated(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }, [left, op, value, size, base, signed, pushHistory])

  const immediate = useCallback(
    (fn: (v: bigint) => bigint) => {
      setError(null)
      try {
        const r = fn(value)
        setEntry(r.toString(base).toUpperCase())
        setJustEvaluated(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error')
      }
    },
    [value, base],
  )

  const clearAll = () => {
    setEntry('0')
    setLeft(null)
    setOp(null)
    setError(null)
    setJustEvaluated(false)
  }

  const backspace = () => {
    setError(null)
    setEntry((prev) => {
      const next = prev.slice(0, -1)
      return next === '' || next === '-' ? '0' : next
    })
  }

  const toggleBit = (bit: number) => {
    setError(null)
    setJustEvaluated(false)
    setEntry((prev) => {
      const v = parseIn(prev || '0', base) ?? 0n
      return (v ^ (1n << BigInt(bit))).toString(base).toUpperCase()
    })
  }

  const readouts = BASES.map((b) => ({
    ...b,
    text: formatIn(value, b.id, size, signed),
  }))

  const bitCount = size
  const digits = base === 16 ? HEX_DIGITS : base === 10 ? HEX_DIGITS.slice(0, 10) : base === 8 ? HEX_DIGITS.slice(0, 8) : HEX_DIGITS.slice(0, 2)
  const expressionLine = left !== null && op ? `${formatIn(left, base, size, signed)} ${op}` : null

  return (
    <div className="mode-prog">
      <div className="prog-display">
        <div className="prog-expr">{expressionLine ?? <span className="prog-expr-placeholder">&nbsp;</span>}</div>
        <div className="prog-value">{formatIn(value, base, size, signed)}</div>
        {error && <div className="calc-error">{error}</div>}
        <div className="prog-readouts">
          {readouts.map((r) => (
            <button
              key={r.label}
              className={`prog-readout ${r.id === base ? 'active' : ''}`}
              onClick={() => setBase(r.id)}
            >
              <span className="prog-readout-base">{r.label}</span>
              <span className="prog-readout-value">{r.text}</span>
            </button>
          ))}
        </div>
        <div className="prog-meta">
          <span>bits set: {popcount(value)}</span>
          <span>unsigned: {formatIn(value, 10, size, false)}</span>
          <span>signed: {toSigned(value & ((1n << BigInt(size)) - 1n), size).toString()}</span>
        </div>
      </div>

      <div className="prog-controls">
        <div className="seg" aria-label="Word size">
          {([8, 16, 32, 64] as WordSize[]).map((s) => (
            <button key={s} className={`seg-item ${size === s ? 'active' : ''}`} onClick={() => setSize(s)}>
              {s}
            </button>
          ))}
        </div>
        <label className="switch">
          <input type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} />
          <span>Signed (two's complement)</span>
        </label>
      </div>

      <div className="prog-bitgrid" style={{ ['--bits' as string]: bitCount }}>
        {Array.from({ length: bitCount }, (_, i) => bitCount - 1 - i).map((bit) => {
          const set = ((value >> BigInt(bit)) & 1n) === 1n
          return (
            <button
              key={bit}
              className={`bit ${set ? 'on' : ''}`}
              onClick={() => toggleBit(bit)}
              aria-label={`Bit ${bit} is ${set ? 'on' : 'off'}`}
              title={`bit ${bit}`}
            />
          )
        })}
      </div>

      <div className="prog-keypads">
        <div className="prog-ops">
          {(['AND', 'OR', 'XOR', '<<', '>>'] as WordOp[]).map((o) => (
            <button key={o} className="key k-fn" onClick={() => chooseOp(o)}>
              {o}
            </button>
          ))}
          <button className="key k-fn" onClick={() => immediate((v) => not(v, size))} aria-label="Bitwise NOT">
            NOT
          </button>
          <button className="key k-fn" onClick={() => chooseOp('mod')}>
            mod
          </button>
        </div>
        <div className="prog-main">
          <div className="keypad" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <button className="key k-action" onClick={clearAll}>
              CE
            </button>
            <button className="key k-action" onClick={backspace} aria-label="Backspace">
              ⌫
            </button>
            <button className="key k-action" onClick={() => immediate((v) => negate(v, size))} aria-label="Negate">
              ±
            </button>
            <button className="key k-equals" onClick={equals}>
              =
            </button>
            {(['÷', '×', '−', '+'] as WordOp[]).map((o) => (
              <button key={o} className="key k-op" onClick={() => chooseOp(o)}>
                {o}
              </button>
            ))}
            {digits.map((d) => (
              <button key={d} className="key k-digit" onClick={() => digit(d)} disabled={d !== '0' && base < 16 && Number(d) >= base}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
