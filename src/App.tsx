import { useCallback, useEffect, useMemo, useState } from 'react'
import HistoryPanel from './components/HistoryPanel'
import { IconKeyboard, IconMoon, IconHistory, IconSun } from './components/Icons'
import Intro from './components/Intro'
import ShortcutsOverlay from './components/ShortcutsOverlay'
import Basic from './modes/Basic'
import Converter from './modes/Converter'
import Graphing from './modes/Graphing'
import PhotoHelp from './modes/PhotoHelp'
import Programmer from './modes/Programmer'
import Scientific from './modes/Scientific'
import { MODES, modeById } from './modes/registry'
import type { ModeId } from './modes/registry'
import type { Seed } from './modes/shared'
import {
  loadHistory,
  loadPrefs,
  saveHistory,
  savePrefs,
} from './lib/storage'
import type { HistoryEntry, Prefs } from './lib/storage'
import { LogoMark } from './components/Icons'

function useSystemDark(): boolean {
  const [dark, setDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const fn = () => setDark(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return dark
}

export default function App() {
  const [prefs, setPrefsState] = useState<Prefs>(loadPrefs)
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)
  const [mode, setMode] = useState<ModeId>((loadPrefs().lastMode as ModeId) ?? 'basic')
  const [showHistory, setShowHistory] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [seed, setSeed] = useState<Seed | null>(null)
  const systemDark = useSystemDark()

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch }
      savePrefs(next)
      return next
    })
  }, [])

  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && systemDark)
  useEffect(() => {
    if (dark) document.documentElement.dataset.theme = 'dark'
    else delete document.documentElement.dataset.theme
  }, [dark])

  const pushHistory = useCallback((e: HistoryEntry) => {
    setHistory((prev) => {
      const next = [e, ...prev].slice(0, 200)
      saveHistory(next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
  }, [])

  const insertSeed = useCallback((text: string) => {
    setSeed({ text, nonce: performance.now() })
  }, [])

  const selectMode = useCallback(
    (id: ModeId) => {
      setMode(id)
      setPrefs({ lastMode: id })
    },
    [setPrefs],
  )

  const useExpression = useCallback(
    (expr: string) => {
      insertSeed(expr)
      selectMode('scientific')
    },
    [insertSeed, selectMode],
  )

  // Global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      if (e.key === '?' && !typing) {
        e.preventDefault()
        setShowShortcuts((s) => !s)
        return
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false)
        setShowHistory(false)
        return
      }
      if (e.altKey && !e.metaKey && !e.ctrlKey && /^[1-6]$/.test(e.key)) {
        e.preventDefault()
        selectMode(MODES[Number(e.key) - 1].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectMode])

  const active = modeById(mode)

  const modeEl = useMemo(() => {
    switch (mode) {
      case 'basic':
        return <Basic pushHistory={pushHistory} seed={seed} />
      case 'scientific':
        return (
          <Scientific
            angle={prefs.angle}
            onAngleChange={(a) => setPrefs({ angle: a })}
            pushHistory={pushHistory}
            seed={seed}
          />
        )
      case 'graphing':
        return <Graphing />
      case 'programmer':
        return <Programmer pushHistory={pushHistory} />
      case 'converter':
        return <Converter />
      case 'photo':
        return <PhotoHelp pushHistory={pushHistory} onUseExpression={useExpression} />
    }
  }, [mode, prefs.angle, pushHistory, seed, setPrefs, useExpression])

  if (!prefs.introSeen) {
    return <Intro onDone={() => setPrefs({ introSeen: true })} />
  }

  return (
    <div className="app" data-mode={mode}>
      <aside className="sidebar">
        <div className="sidebar-logo" title="Numera">
          <LogoMark size={34} />
        </div>
        <nav className="sidebar-nav" aria-label="Calculator modes">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`nav-item ${m.id === mode ? 'active' : ''}`}
              style={m.id === mode ? { color: m.color } : undefined}
              onClick={() => selectMode(m.id)}
              aria-current={m.id === mode ? 'page' : undefined}
            >
              <m.Icon size={19} />
              <span>{m.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button
            className="icon-btn"
            onClick={() => setPrefs({ theme: dark ? 'light' : 'dark' })}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {dark ? <IconSun size={17} /> : <IconMoon size={17} />}
          </button>
          <button
            className="icon-btn"
            onClick={() => setShowShortcuts(true)}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <IconKeyboard size={17} />
          </button>
          <button
            className="icon-btn"
            onClick={() => setShowHistory(true)}
            aria-label="History"
            title="History"
          >
            <IconHistory size={17} />
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div className="header-title">
            <span className="header-icon" style={{ color: active.color }}>
              <active.Icon size={20} />
            </span>
            <div>
              <h1>{active.label}</h1>
              <p>{active.tagline}</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => setShowHistory(true)} aria-label="History">
              <IconHistory size={18} />
            </button>
            <button
              className="icon-btn"
              onClick={() => setPrefs({ theme: dark ? 'light' : 'dark' })}
              aria-label="Toggle theme"
            >
              {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>
          </div>
        </header>
        <section className="mode-host" key={mode}>
          {modeEl}
        </section>
      </main>

      <nav className="tabbar" aria-label="Calculator modes">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`tab-item ${m.id === mode ? 'active' : ''}`}
            style={m.id === mode ? { color: m.color } : undefined}
            onClick={() => selectMode(m.id)}
            aria-label={m.label}
          >
            <m.Icon size={21} />
            <span>{m.label}</span>
          </button>
        ))}
      </nav>

      <HistoryPanel
        open={showHistory}
        entries={history}
        onClose={() => setShowHistory(false)}
        onPick={(expr) => {
          insertSeed(expr)
          setShowHistory(false)
        }}
        onClear={clearHistory}
      />
      <ShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  )
}
