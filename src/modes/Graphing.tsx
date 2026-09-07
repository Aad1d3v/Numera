import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { create, all } from 'mathjs'
import { IconDownload, IconEye, IconEyeOff, IconPlus, IconTrash } from '../components/Icons'
import { formatShort } from '../lib/format'

const math = create(all, { number: 'number' })

const COLORS = ['#0a84ff', '#ff375f', '#30d158', '#bf5af2', '#ff9f0a', '#64d2ff']
const MAX_FNS = 6

interface FnState {
  id: number
  text: string
  color: string
  on: boolean
}

interface Viewport {
  xmin: number
  xmax: number
  ymin: number
  ymax: number
}

const DEFAULT_VIEW: Viewport = { xmin: -10, xmax: 10, ymin: -6, ymax: 6 }

let nextId = 100
const makeFn = (text: string, on = true): FnState => ({
  id: nextId++,
  text,
  color: COLORS[(nextId - 100) % COLORS.length],
  on,
})

function niceStep(range: number, maxTicks = 10): number {
  const raw = range / maxTicks
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  for (const mult of [1, 2, 5, 10]) {
    if (mult * pow >= raw) return mult * pow
  }
  return 10 * pow
}

interface CompiledFn {
  fn: FnState
  evaluate: (x: number) => number
  error: string | null
}

export default function Graphing() {
  const [fns, setFns] = useState<FnState[]>([makeFn('sin(x)'), makeFn('x^2/4', true)])
  const [view, setView] = useState<Viewport>(DEFAULT_VIEW)
  const [trace, setTrace] = useState<{ px: number; py: number; x: number; ys: { color: string; y: number; text: string }[] } | null>(null)
  const [dark, setDark] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 480 })
  const dragRef = useRef<{ px: number; py: number; view: Viewport } | null>(null)

  // Track dark mode for canvas colors
  useEffect(() => {
    const el = document.documentElement
    const update = () => setDark(el.dataset.theme === 'dark')
    update()
    const obs = new MutationObserver(update)
    obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  // Resize stage
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const ro = new ResizeObserver(() => {
      setSize({ w: stage.clientWidth, h: stage.clientHeight })
    })
    ro.observe(stage)
    return () => ro.disconnect()
  }, [])

  const compiled: CompiledFn[] = useMemo(() => {
    return fns.map((fn) => {
      if (!fn.on || !fn.text.trim()) return { fn, evaluate: () => NaN, error: null }
      try {
        const node = math.compile(fn.text)
        return { fn, evaluate: (x: number) => node.evaluate({ x }) as number, error: null }
      } catch (err) {
        return { fn, evaluate: () => NaN, error: err instanceof Error ? err.message : 'Invalid' }
      }
    })
  }, [fns])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { w, h } = size
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const { xmin, xmax, ymin, ymax } = view
    const sx = w / (xmax - xmin)
    const sy = h / (ymax - ymin)
    const px = (x: number) => (x - xmin) * sx
    const py = (y: number) => h - (y - ymin) * sy

    const grid = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'
    const gridMinor = dark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.03)'
    const axis = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.42)'
    const label = dark ? 'rgba(235,235,245,0.55)' : 'rgba(60,60,67,0.6)'

    // Minor grid
    const stepX = niceStep(xmax - xmin)
    const stepY = niceStep(ymax - ymin)
    const minorPx = (stepX / 5) * sx
    if (minorPx > 7) {
      ctx.strokeStyle = gridMinor
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = Math.ceil(xmin / (stepX / 5)) * (stepX / 5); x <= xmax; x += stepX / 5) {
        const X = Math.round(px(x)) + 0.5
        ctx.moveTo(X, 0)
        ctx.lineTo(X, h)
      }
      for (let y = Math.ceil(ymin / (stepY / 5)) * (stepY / 5); y <= ymax; y += stepY / 5) {
        const Y = Math.round(py(y)) + 0.5
        ctx.moveTo(0, Y)
        ctx.lineTo(w, Y)
      }
      ctx.stroke()
    }

    // Major grid
    ctx.strokeStyle = grid
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = Math.ceil(xmin / stepX) * stepX; x <= xmax; x += stepX) {
      const X = Math.round(px(x)) + 0.5
      ctx.moveTo(X, 0)
      ctx.lineTo(X, h)
    }
    for (let y = Math.ceil(ymin / stepY) * stepY; y <= ymax; y += stepY) {
      const Y = Math.round(py(y)) + 0.5
      ctx.moveTo(0, Y)
      ctx.lineTo(w, Y)
    }
    ctx.stroke()

    // Axes
    ctx.strokeStyle = axis
    ctx.lineWidth = 1.5
    ctx.beginPath()
    if (ymin <= 0 && ymax >= 0) {
      ctx.moveTo(0, py(0))
      ctx.lineTo(w, py(0))
    }
    if (xmin <= 0 && xmax >= 0) {
      ctx.moveTo(px(0), 0)
      ctx.lineTo(px(0), h)
    }
    ctx.stroke()

    // Tick labels
    ctx.fillStyle = label
    ctx.font = '10px Inter, system-ui, sans-serif'
    const labelY = Math.min(Math.max(py(0) + 14, 12), h - 6)
    ctx.textAlign = 'center'
    for (let x = Math.ceil(xmin / stepX) * stepX; x <= xmax; x += stepX) {
      if (Math.abs(x) < stepX / 1e6) continue
      ctx.fillText(formatShort(x), px(x), labelY)
    }
    const labelX = Math.min(Math.max(px(0) - 6, 24), w - 6)
    ctx.textAlign = 'right'
    for (let y = Math.ceil(ymin / stepY) * stepY; y <= ymax; y += stepY) {
      if (Math.abs(y) < stepY / 1e6) continue
      ctx.fillText(formatShort(y), labelX, py(y) + 3)
    }

    // Functions
    for (const { fn, evaluate } of compiled) {
      if (!fn.on) continue
      ctx.strokeStyle = fn.color
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.beginPath()
      let started = false
      let prevPy = 0
      const stepPx = 1.5
      for (let X = -2; X <= w + 2; X += stepPx) {
        const x = xmin + X / sx
        const y = evaluate(x)
        if (!Number.isFinite(y) || Math.abs(y) > 1e7) {
          started = false
          continue
        }
        const Y = py(y)
        if (started && Math.abs(Y - prevPy) > h * 2) started = false // discontinuity
        if (!started) {
          ctx.moveTo(X, Y)
          started = true
        } else {
          ctx.lineTo(X, Y)
        }
        prevPy = Y
      }
      ctx.stroke()
    }

    // Trace markers
    if (trace) {
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(trace.px, 0)
      ctx.lineTo(trace.px, h)
      ctx.stroke()
      for (const t of trace.ys) {
        ctx.fillStyle = t.color
        ctx.beginPath()
        ctx.arc(trace.px, py(t.y), 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = dark ? '#000' : '#fff'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }
  }, [compiled, view, size, trace, dark])

  useEffect(() => {
    draw()
  }, [draw])

  const toGraphX = (clientX: number) => {
    const rect = stageRef.current!.getBoundingClientRect()
    return view.xmin + ((clientX - rect.left) / rect.width) * (view.xmax - view.xmin)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { px: e.clientX, py: e.clientY, view: { ...view } }
    setTrace(null)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (drag) {
      const rect = stageRef.current!.getBoundingClientRect()
      const dxUnits = ((e.clientX - drag.px) / rect.width) * (drag.view.xmax - drag.view.xmin)
      const dyUnits = ((e.clientY - drag.py) / rect.height) * (drag.view.ymax - drag.view.ymin)
      setView({
        xmin: drag.view.xmin - dxUnits,
        xmax: drag.view.xmax - dxUnits,
        ymin: drag.view.ymin + dyUnits,
        ymax: drag.view.ymax + dyUnits,
      })
      return
    }
    // Hover trace
    const rect = stageRef.current!.getBoundingClientRect()
    const gx = toGraphX(e.clientX)
    const ys = compiled
      .filter((c) => c.fn.on && !c.error)
      .map((c) => {
        const y = c.evaluate(gx)
        return { color: c.fn.color, y, text: `${c.fn.text.trim() || 'f(x)'} = ${formatShort(y)}` }
      })
      .filter((t) => Number.isFinite(t.y))
    if (ys.length === 0) {
      setTrace(null)
      return
    }
    setTrace({ px: e.clientX - rect.left, py: e.clientY - rect.top, x: gx, ys })
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  // Wheel zoom
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = stage.getBoundingClientRect()
      const fx = (e.clientX - rect.left) / rect.width
      const fy = (e.clientY - rect.top) / rect.height
      const f = Math.exp(e.deltaY * 0.0012)
      setView((v) => {
        const xAt = v.xmin + fx * (v.xmax - v.xmin)
        const yAt = v.ymax - fy * (v.ymax - v.ymin)
        const nxmin = xAt - (xAt - v.xmin) * f
        const nxmax = xAt + (v.xmax - xAt) * f
        const nymin = yAt - (yAt - v.ymin) * f
        const nymax = yAt + (v.ymax - yAt) * f
        const clamp = (a: number, b: number) => (Math.abs(b - a) > 1e12 || Math.abs(b - a) < 1e-12 ? v : { xmin: a, xmax: b })
        return clamp(nxmin, nxmax) === v
          ? v
          : Math.abs(nymax - nymin) > 1e12 || Math.abs(nymax - nymin) < 1e-12
            ? v
            : { xmin: nxmin, xmax: nxmax, ymin: nymin, ymax: nymax }
      })
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [])

  const zoom = (factor: number) => {
    setView((v) => {
      const cx = (v.xmin + v.xmax) / 2
      const cy = (v.ymin + v.ymax) / 2
      const hx = (v.xmax - v.xmin) / 2 * factor
      const hy = (v.ymax - v.ymin) / 2 * factor
      return { xmin: cx - hx, xmax: cx + hx, ymin: cy - hy, ymax: cy + hy }
    })
  }

  const fitY = () => {
    let lo = Infinity
    let hi = -Infinity
    for (let i = 0; i <= 400; i++) {
      const x = view.xmin + ((view.xmax - view.xmin) * i) / 400
      for (const c of compiled) {
        if (!c.fn.on || c.error) continue
        const y = c.evaluate(x)
        if (Number.isFinite(y) && Math.abs(y) < 1e9) {
          lo = Math.min(lo, y)
          hi = Math.max(hi, y)
        }
      }
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return
    if (hi - lo < 1e-9) {
      lo -= 1
      hi += 1
    }
    const pad = (hi - lo) * 0.15
    setView((v) => ({ ...v, ymin: lo - pad, ymax: hi + pad }))
  }

  const exportPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'numera-graph.png'
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  const updateFn = (id: number, patch: Partial<FnState>) => {
    setFns((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  return (
    <div className="mode-graph">
      <div className="graph-toolbar">
        <div className="fn-list">
          {fns.map((f, i) => {
            const c = compiled.find((x) => x.fn.id === f.id)
            const err = c?.error ?? null
            return (
              <div key={f.id} className={`fn-chip ${err ? 'error' : ''}`} title={err ?? undefined}>
                <span className="fn-dot" style={{ background: f.color }} />
                <span className="fn-eq">y{i + 1} =</span>
                <input
                  value={f.text}
                  onChange={(e) => updateFn(f.id, { text: e.target.value })}
                  placeholder="x^2"
                  spellCheck={false}
                  aria-label={`Function ${i + 1}`}
                />
                <button
                  className="icon-btn small"
                  onClick={() => updateFn(f.id, { on: !f.on })}
                  aria-label={f.on ? 'Hide function' : 'Show function'}
                >
                  {f.on ? <IconEye size={15} /> : <IconEyeOff size={15} />}
                </button>
                {fns.length > 1 && (
                  <button
                    className="icon-btn small"
                    onClick={() => setFns((prev) => prev.filter((x) => x.id !== f.id))}
                    aria-label="Remove function"
                  >
                    <IconTrash size={15} />
                  </button>
                )}
              </div>
            )
          })}
          {fns.length < MAX_FNS && (
            <button
              className="fn-add"
              onClick={() => setFns((prev) => [...prev, makeFn('')])}
              disabled={fns.length >= MAX_FNS}
            >
              <IconPlus size={14} /> Add function
            </button>
          )}
        </div>
        <div className="graph-actions">
          <button className="btn ghost" onClick={() => zoom(1 / 1.35)} aria-label="Zoom in">
            +
          </button>
          <button className="btn ghost" onClick={() => zoom(1.35)} aria-label="Zoom out">
            −
          </button>
          <button className="btn ghost" onClick={fitY}>
            Fit Y
          </button>
          <button className="btn ghost" onClick={() => setView(DEFAULT_VIEW)}>
            Reset
          </button>
          <button className="icon-btn" onClick={exportPng} aria-label="Export as PNG" title="Export as PNG">
            <IconDownload size={17} />
          </button>
        </div>
      </div>

      <div
        className="graph-stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          dragRef.current = null
          setTrace(null)
        }}
      >
        <canvas ref={canvasRef} style={{ width: size.w, height: size.h }} />
        {trace && (
          <div
            className="graph-trace"
            style={{ left: Math.min(trace.px + 12, size.w - 170), top: Math.min(trace.py + 12, size.h - 90) }}
          >
            <div className="graph-trace-x">x = {formatShort(trace.x)}</div>
            {trace.ys.map((t, i) => (
              <div key={i} className="graph-trace-y">
                <span className="fn-dot" style={{ background: t.color }} />
                {t.text}
              </div>
            ))}
          </div>
        )}
        <div className="graph-hint">scroll to zoom · drag to pan · hover to trace</div>
      </div>
    </div>
  )
}
