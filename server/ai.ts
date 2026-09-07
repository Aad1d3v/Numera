/**
 * Groq-powered vision math tutor.
 * Groq exposes an OpenAI-compatible chat completions API, so vision
 * requests use the standard `image_url` content part with a data URL.
 * Default model: qwen/qwen3.8-27b (vision + reasoning). Override with GROQ_MODEL.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface SolveResult {
  expression: string | null
  answer: string
  steps: { title: string; detail: string }[]
  note: string | null
  model: string
}

export function providerInfo() {
  const configured = Boolean(process.env.GROQ_API_KEY)
  return {
    provider: configured ? ('groq' as const) : null,
    model: configured ? process.env.GROQ_MODEL || 'qwen/qwen3.8-27b' : null,
  }
}

const SYSTEM_PROMPT = `You are the math tutor inside the Numera calculator app. You receive a photo containing a math problem (handwritten, printed, or on a screen) and an optional user question.

Rules:
- Read the problem from the image carefully. If the image contains several problems, solve the most prominent one and mention the rest in "note".
- Solve it and explain the work concisely, step by step.
- If the problem reduces to a single computable expression, set "expression" to a plain mathjs-style expression using only digits, + - * / ^ ( ) ! and functions like sin cos tan asin acos atan sqrt cbrt log log10 log2 abs. Use * for multiplication and no thousands separators. Otherwise set "expression" to null.
- "answer" is the final result as a short string (number, simplified fraction, or a brief verdict for word problems).
- Every step title must be short (under 60 characters). Details are 1-3 sentences.
- "note" is an optional caveat (blurry image, assumptions made, other problems seen) or null.

Respond with ONLY minified JSON, no markdown and no code fences, exactly matching:
{"expression": string|null, "answer": string, "steps": [{"title": string, "detail": string}], "note": string|null}`

interface GroqChoice {
  message?: { content?: string | null }
}

export async function solveImage(imageDataUrl: string, question?: string): Promise<SolveResult> {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    const err = new Error('no_api_key')
    throw err
  }
  const model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'

  const userText =
    question && question.trim().length > 0
      ? `Solve the math problem in this image. Extra instruction from the user: ${question.trim()}`
      : 'Solve the math problem in this image.'

  const body = {
    model,
    temperature: 0.1,
    max_tokens: 2048,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ],
  }

  const doFetch = async (payload: unknown) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 90_000)
    try {
      return await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }
  }

  let response: Response
  try {
    response = await doFetch(body)
    // Some vision models reject response_format; the app asks for raw JSON anyway,
    // so we only add it if the provider accepted the first try. (Kept for forward compat.)
  } catch (err) {
    const msg = err instanceof Error && err.name === 'AbortError' ? 'timed out after 90s' : String(err)
    throw new Error(msg)
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    if (response.status === 401) throw new Error('Groq rejected the API key (401). Check GROQ_API_KEY.')
    if (response.status === 429) throw new Error('Rate limit reached on Groq (429). Wait a moment and retry.')
    throw new Error(`Groq returned ${response.status}: ${text.slice(0, 300)}`)
  }

  const data = (await response.json()) as { choices?: GroqChoice[] }
  const raw = data.choices?.[0]?.message?.content ?? ''

  return parseResult(raw, model)
}

function parseResult(raw: string, model: string): SolveResult {
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<SolveResult>
      const steps = Array.isArray(parsed.steps)
        ? parsed.steps
            .filter((s) => s && typeof s.title === 'string')
            .map((s) => ({ title: String(s.title), detail: String(s.detail ?? '') }))
        : []
      const expression =
        typeof parsed.expression === 'string' && parsed.expression.trim().length > 0
          ? parsed.expression.trim()
          : null
      const answer = typeof parsed.answer === 'string' && parsed.answer.trim().length > 0
        ? parsed.answer.trim()
        : cleaned.slice(0, 400)
      return {
        expression,
        answer,
        steps,
        note: typeof parsed.note === 'string' && parsed.note.trim().length > 0 ? parsed.note.trim() : null,
        model,
      }
    } catch {
      // fall through to free-text handling
    }
  }

  return {
    expression: null,
    answer: cleaned.slice(0, 400) || 'The model returned an empty response.',
    steps: [],
    note: 'The model replied in free text instead of structured steps.',
    model,
  }
}
