export interface HistoryEntry {
  id: string
  mode: string
  expr: string
  result: string
  ts: number
}

const HISTORY_KEY = 'numera.history.v1'
const PREFS_KEY = 'numera.prefs.v1'
const HISTORY_CAP = 200

export interface Prefs {
  theme: 'light' | 'dark' | 'system'
  angle: 'deg' | 'rad'
  lastMode: string
  introSeen: boolean
}

export const defaultPrefs: Prefs = {
  theme: 'system',
  angle: 'rad',
  lastMode: 'basic',
  introSeen: false,
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadPrefs(): Prefs {
  if (typeof localStorage === 'undefined') return { ...defaultPrefs }
  const stored = safeParse<Partial<Prefs>>(localStorage.getItem(PREFS_KEY), {})
  return { ...defaultPrefs, ...stored }
}

export function savePrefs(prefs: Prefs): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    /* storage full or blocked — non-fatal */
  }
}

export function loadHistory(): HistoryEntry[] {
  if (typeof localStorage === 'undefined') return []
  return safeParse<HistoryEntry[]>(localStorage.getItem(HISTORY_KEY), []).filter(
    (e) => e && typeof e.expr === 'string' && typeof e.result === 'string',
  )
}

export function saveHistory(entries: HistoryEntry[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_CAP)))
  } catch {
    /* non-fatal */
  }
}

export function makeEntry(mode: string, expr: string, result: string): HistoryEntry {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    mode,
    expr,
    result,
    ts: Date.now(),
  }
}
