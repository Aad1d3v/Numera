# Numera

Every calculator you need, in one beautiful place. Basic, Scientific, Graphing, Programmer, Converter — plus **Photo AI**: snap a picture of a math problem and get a step-by-step solution.

Built with React 18 + TypeScript + Vite on the front, a tiny Express server in the back (keeps your AI key server-side), and `mathjs` under the hood. Ships as a single multi-stage Docker image.

## Modes

| Mode | What it does |
| --- | --- |
| **Basic** | Everyday arithmetic, `%`, `±`, memory (M+/MR/MC), live result preview, history |
| **Scientific** | Trig + inverses, ln/log/log₂, powers, roots, factorials, `|x|`, π/e constants, DEG/RAD toggle, `ans` |
| **Graphing** | Plot up to 6 functions, scroll to zoom, drag to pan, hover to trace, Fit-Y, export PNG |
| **Programmer** | DEC/HEX/OCT/BIN readouts, 8/16/32/64-bit words, two's-complement toggle, clickable bit grid, AND/OR/XOR/NOT/shifts |
| **Converter** | Length, mass, temperature, data, time, speed, area, volume — instant two-way conversion + every-unit table |
| **Photo AI** | Take a photo, upload, or paste (Ctrl+V) a math problem; Groq vision model returns the expression, the answer, and the steps. "Use in calculator" drops the expression straight into Scientific mode |

Plus: an animated first-launch intro, light/dark themes, keyboard-first input (press `?` for shortcuts), and persistent history.

## Quick start (Node 20+)

```bash
npm install
npm run dev          # frontend on :5173, API on :3000 (proxied)
```

Production build + run:

```bash
npm run build        # vite build + bundle server to dist-server/index.cjs
npm start            # serves the app + API on http://localhost:3000
```

Checks:

```bash
npm run typecheck    # tsc --noEmit for app + server
npm test             # vitest: evaluator, converter, programmer
```

## Docker

```bash
# Build and run with docker compose (reads optional .env)
docker compose up --build

# Or plain Docker
docker build -t numera .
docker run --rm -p 3000:3000 \
  -e GROQ_API_KEY=your-key \
  numera
```

The image is a non-root multi-stage build — static files plus a single bundled server file, healthcheck on `/api/health`, listening on port 3000.

## Photo AI configuration

The AI endpoint calls Groq's OpenAI-compatible API. Configure via environment (`.env`, or `-e` flags):

| Variable | Default | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | — | Your key from [console.groq.com/keys](https://console.groq.com/keys) |
| `GROQ_MODEL` | `qwen/qwen3.8-27b` | Any Groq vision model (e.g. `qwen/qwen3.6-27b`) |
| `PORT` | `3000` | Server port |

Without a key the app runs fine — Photo AI just shows a friendly setup card.

> ⚠️ **Rotate that key.** If an API key was ever shared in a chat or committed to a repo, generate a fresh one and replace it. `.env` is gitignored and docker-ignored, so keys never ship in the image or a commit.

## Percent, the smart way

`200×10%` → 20 (plain percent), `50+10%` → 55, `50−10%` → 45 — percent after `+`/`−` is relative to the left side, like a desk calculator.

## Project layout

```
server/    Express app + Groq vision integration (ai.ts)
src/
  components/   Intro, History, Shortcuts, Icons
  modes/        Basic, Scientific, Graphing, Programmer, Converter, PhotoHelp
  lib/          evaluate.ts (mathjs, hardened), format, storage, programmer, convert
  styles/       global.css (design system)
tests/     vitest suites
Dockerfile, docker-compose.yml
```

---

# The story behind Numera

## Why I made it

I wanted one calculator that didn't make me keep switching apps — something that could go from "quick tip at a café" to "graphing a parabola for homework" to "snapping a photo of a messy algebra problem and actually getting it explained" without changing tools. The stock calculator apps are fast but tiny; the desktop ones are powerful but ugly. I wanted **advanced under the hood, simple on the surface** — and I wanted it to look like something Apple would ship: clean typography, soft rounded keycaps, a dark mode that doesn't hurt to look at at midnight.

## How it works

Numera is deliberately boring in its architecture, which is why it's reliable:

- **A static React + TypeScript app** (`src/`) does all the calculating. Math lives in the browser — the expression engine (`src/lib/evaluate.ts`) is a hardened `mathjs` instance that handles precedence, degrees/radians, `π`, `ans`, and desk-calculator-style `%`.
- **A tiny Express server** (`server/`) does exactly two jobs: serve the built app, and proxy **Photo AI** requests to Groq so your API key never touches the browser.
- **The graph** is a hand-rolled HTML5 canvas plotter — no charting library, ~350 lines that own their rendering (grid → axes → curves → trace).
- **Everything ships in one Docker image**: a multi-stage build that ends with a non-root container holding static files plus a single bundled server file.

Nothing phony about the AI part: the photo goes to Groq as a real vision request, the model returns structured JSON (expression + answer + steps), and the app renders it with a "Use in calculator" button that drops the expression straight into Scientific mode.

## How I made it

1. **Planned first.** Modes were decided up front (Basic, Scientific, Graphing, + Programmer and Converter as bonus), plus a first-launch intro, themes, and keyboard-first input. The AI assistant drafted an implementation plan and I approved it before a single file was written.
2. **Scaffolded by hand.** Rather than a generator, every config file (`package.json`, TypeScript, Vite, Docker) was written deliberately — so the Docker build and the dev setup share one story.
3. **Built bottom-up:** pure math libraries first (with unit tests), then the UI shell, then each mode, then the AI integration, then the container.
4. **Verified, not assumed.** `tsc --noEmit` clean, **29/29 Vitest tests** green (evaluator, percent logic, converter, BigInt word arithmetic), a real production build, and a **live browser walkthrough of every mode**.
5. **Proved Photo AI end-to-end** with a real vision call on a real key — a captured frame came back as `30 × 10 = 300` with proper steps.

## How Claude helped me make it

> Claude here = the AI coding assistant that paired with me in this very session (this thread's assistant — call it whatever you like, it's the same one).

Claude did the heavy lifting, but never silently:

- **Turned the empty repo into the whole app** — about 35 files in one pass, from `server/ai.ts` to the intro animation.
- **Chose the model by asking your Groq account.** Instead of guessing, it queried the live `/models` endpoint, found the two vision-capable models (`qwen/qwen3.6-27b`, `qwen/qwen3.8-27b`), picked the newer `qwen/qwen3.8-27b`, and smoke-tested it before wiring it in.
- **Caught real bugs the fast way:** `mathjs@13.4.0` doesn't exist (pinned to `14.9.1`), `mph`/`knot`/`tbsp` aren't real mathjs units (swapped for `mi/h`, `kt`, …), a security hardening that accidentally disabled its own evaluator, a percent-precedence bug (`2+3+10%` came out 7.3 instead of 5.5), and an ESM/CJS bundling trap with `dotenv`. Each was found by running the thing, not staring at it.
- **Worked around the environment.** This machine had no Node.js and no Docker — so Claude downloaded a portable Node 22 to `%LOCALAPPDATA%\Programs\nodejs` (no admin needed) and verified everything against it.
- **QA'd in a live preview tab**, clicking through the intro, all six modes, the theme toggle and history — and reported a **zero-console-error** session.

It also nagged about security when I pasted an API key into the chat — which is why `.env` is gitignored and this README tells you to **rotate any key that's ever been shared in plaintext.**

## How much time it took

Roughly **one long sitting — a few hours of wall-clock time** (the exact number is hard to say; the transcript is what it is). The honest framing: this is the pace of an AI pair-programmer that never sleeps between steps — plan → write → install → test → fix → preview, all in one pass. The equivalent solo weekend project, done carefully, would likely take a couple of days — most of which is exactly the parts Claude automated: the 29 tests, the canvas plotter, and the Docker debugging.

## Extras & where it could go next

Already in the box: smart `%`, `ans`, memory keys, smart history that feeds back into any mode, PNG export from the graph, an every-unit conversion table, and full keyboard control (`?` for the cheat sheet).

Ideas on the shelf:
- Live **currency** conversion with caching
- **PWA** install + offline mode
- Polar plots and derivative overlays in Graphing
- Voice input (say the expression)
- A settings screen for theme, angle mode and the AI model

Built with ♥ (and React, mathjs, Express, Vite, Vitest and Groq).
