import { useCallback, useEffect, useRef, useState } from 'react'
import {
  IconCamera,
  IconClipboard,
  IconImage,
  IconRotateCcw,
  IconSparkle,
  IconZap,
} from '../components/Icons'
import { makeEntry } from '../lib/storage'
import type { HistoryEntry } from '../lib/storage'

interface SolveResult {
  expression: string | null
  answer: string
  steps: { title: string; detail: string }[]
  note: string | null
  model: string
}

type Stage = 'capture' | 'preview' | 'analyzing' | 'result'

const STATUS_LINES = [
  'Reading the image…',
  'Recognizing the problem…',
  'Working through the steps…',
  'Double-checking the math…',
]

export default function PhotoHelp({
  pushHistory,
  onUseExpression,
}: {
  pushHistory: (e: HistoryEntry) => void
  onUseExpression: (expr: string) => void
}) {
  const [stage, setStage] = useState<Stage>('capture')
  const [imageData, setImageData] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<SolveResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cameraState, setCameraState] = useState<'idle' | 'on' | 'denied' | 'unavailable'>('idle')
  const [statusIdx, setStatusIdx] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraState('idle')
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  // Rotate fun status lines while analyzing
  useEffect(() => {
    if (stage !== 'analyzing') return
    const t = setInterval(() => setStatusIdx((i) => (i + 1) % STATUS_LINES.length), 1800)
    return () => clearInterval(t)
  }, [stage])

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 } },
        audio: false,
      })
      streamRef.current = stream
      setCameraState('on')
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play()
        }
      })
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        setCameraState('denied')
      } else {
        setCameraState('unavailable')
      }
    }
  }, [])

  const readFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setImageData(String(reader.result))
      setStage('preview')
    }
    reader.readAsDataURL(file)
  }, [])

  // Clipboard paste support
  useEffect(() => {
    if (stage !== 'capture' && stage !== 'preview') return
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'))
      const file = item?.getAsFile()
      if (file) {
        e.preventDefault()
        readFile(file)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [stage, readFile])

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, 1))
    canvas.width = Math.max(video.videoWidth * scale, 1)
    canvas.height = Math.max(video.videoHeight * scale, 1)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    setImageData(canvas.toDataURL('image/jpeg', 0.85))
    setStage('preview')
  }

  const retake = () => {
    setImageData(null)
    setResult(null)
    setError(null)
    setStage('capture')
  }

  const analyze = async () => {
    if (!imageData) return
    setStage('analyzing')
    setError(null)
    try {
      const res = await fetch('/api/ai/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData, question: question.trim() || undefined }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.message ?? `Request failed (${res.status})`)
        setStage('preview')
        return
      }
      const r = body as SolveResult
      setResult(r)
      setStage('result')
      if (r.expression) {
        pushHistory(makeEntry('photo', r.expression, r.answer))
      }
    } catch {
      setError('Could not reach the server. Is the app running?')
      setStage('preview')
    }
  }

  return (
    <div className="mode-photo">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) readFile(f)
          e.target.value = ''
        }}
      />
      <canvas ref={canvasRef} hidden />

      {stage === 'capture' && (
        <div className="photo-card">
          <div className="photo-stage">
            {cameraState === 'on' ? (
              <>
                <video ref={videoRef} muted playsInline className="photo-video" />
                <button className="photo-shutter" onClick={capture} aria-label="Take photo">
                  <span />
                </button>
              </>
            ) : (
              <div className="photo-fallback">
                <IconCamera size={44} />
                {cameraState === 'denied' ? (
                  <p>
                    Camera access was blocked. You can still upload a photo or paste one from the clipboard
                    (Ctrl+V).
                  </p>
                ) : cameraState === 'unavailable' ? (
                  <p>No camera is available here. Upload a photo or paste one from the clipboard (Ctrl+V).</p>
                ) : (
                  <p>Point your camera at a math problem — on paper, a whiteboard, or a screen.</p>
                )}
                <div className="photo-fallback-actions">
                  {cameraState !== 'unavailable' && (
                    <button className="btn primary" onClick={startCamera}>
                      <IconCamera size={16} /> {cameraState === 'denied' ? 'Try camera again' : 'Open camera'}
                    </button>
                  )}
                  <button className="btn ghost" onClick={() => fileRef.current?.click()}>
                    <IconImage size={16} /> Upload photo
                  </button>
                </div>
                <p className="photo-hint">
                  <IconClipboard size={13} /> …or paste a screenshot with Ctrl+V
                </p>
              </div>
            )}
          </div>
          <textarea
            className="photo-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Optional: e.g. “solve for x”, “explain like I'm 12”, “just part 2”"
            rows={2}
          />
        </div>
      )}

      {stage === 'preview' && imageData && (
        <div className="photo-card">
          <div className="photo-stage">
            <img src={imageData} alt="Captured math problem" className="photo-preview-img" />
            <div className="photo-preview-actions">
              <button className="btn ghost" onClick={retake}>
                <IconRotateCcw size={16} /> Retake
              </button>
              <button className="btn primary" onClick={analyze}>
                <IconZap size={16} /> Solve with AI
              </button>
            </div>
          </div>
          <textarea
            className="photo-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Optional: add a question about this problem"
            rows={2}
          />
        </div>
      )}

      {stage === 'analyzing' && imageData && (
        <div className="photo-card">
          <div className="photo-analyzing">
            <img src={imageData} alt="Math problem being analyzed" className="photo-preview-img dimmed" />
            <div className="photo-status">
              <span className="spinner" aria-hidden="true" />
              <span key={statusIdx} className="photo-status-line">
                {STATUS_LINES[statusIdx]}
              </span>
            </div>
          </div>
        </div>
      )}

      {stage === 'result' && result && (
        <div className="photo-card photo-result">
          {result.expression && (
            <div className="photo-expr">
              <code>{result.expression}</code>
              <button className="btn primary small" onClick={() => onUseExpression(result.expression!)}>
                Use in calculator
              </button>
            </div>
          )}
          <div className="photo-answer">
            <span className="photo-answer-label">Answer</span>
            <span className="photo-answer-value">{result.answer}</span>
          </div>
          {result.steps.length > 0 && (
            <ol className="photo-steps">
              {result.steps.map((s, i) => (
                <li key={i}>
                  <b>{s.title}</b>
                  <p>{s.detail}</p>
                </li>
              ))}
            </ol>
          )}
          {result.note && <p className="photo-note">ℹ️ {result.note}</p>}
          <div className="photo-result-actions">
            <button className="btn ghost" onClick={retake}>
              <IconSparkle size={16} /> Solve another
            </button>
            <span className="photo-model-tag">via {result.model} on Groq</span>
          </div>
        </div>
      )}

      {error && (
        <div className="photo-error" role="alert">
          <b>Photo help hit a snag</b>
          <p>{error}</p>
          {error.includes('GROQ_API_KEY') && (
            <pre>GROQ_API_KEY=your-key-here{"\n"}GROQ_MODEL=qwen/qwen3.8-27b</pre>
          )}
        </div>
      )}
    </div>
  )
}
