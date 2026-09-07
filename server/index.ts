import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { providerInfo, solveImage } from './ai.js'

// Works in dev (ESM via tsx) and in the bundled CJS build.
declare const __dirname: string | undefined
const here =
  typeof __dirname !== 'undefined' && __dirname
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(here, '../dist')

const app = express()
app.use(express.json({ limit: '12mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'numera', ...providerInfo() })
})

app.post('/api/ai/help', async (req, res) => {
  const image: unknown = req.body?.image
  const question: unknown = req.body?.question

  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    res.status(400).json({ error: 'bad_request', message: 'Send { image: dataURL, question?: string }' })
    return
  }
  if (image.length > 11_000_000) {
    res.status(413).json({ error: 'image_too_large', message: 'Image must be under ~8 MB' })
    return
  }

  try {
    const result = await solveImage(
      image,
      typeof question === 'string' ? question.slice(0, 500) : undefined,
    )
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message === 'no_api_key') {
      res.status(503).json({
        error: 'no_api_key',
        message:
          'No AI key is configured. Set the GROQ_API_KEY environment variable (get a key at console.groq.com/keys) and restart.',
      })
      return
    }
    console.error('[ai/help]', message)
    res.status(502).json({ error: 'ai_error', message: `The AI request failed: ${message}` })
  }
})

app.use(express.static(distDir))
// SPA fallback for any non-API route
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

const port = Number(process.env.PORT || 3000)
app.listen(port, () => {
  console.log(`Numera running on http://localhost:${port}`)
})
