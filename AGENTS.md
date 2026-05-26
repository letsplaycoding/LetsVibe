# LetsVibe Agent Rules

## Goal

LetsVibe turns AI-assisted coding changes into explainable development logs and portfolio-ready local artifacts.

## Current Phase

Current working product includes:

- TypeScript CLI
- local JSON session storage
- local Markdown log export
- optional OpenAI analysis
- mock AI fallback
- Next.js web dashboard
- session list and detail pages
- rendered Markdown preview
- portfolio generator
- portfolio Markdown export

## Stack

- TypeScript
- Node.js
- pnpm
- Monorepo
- Next.js App Router
- Local filesystem storage

## Rules

- Keep implementation local-first.
- Do not add a database unless explicitly requested.
- Do not add authentication unless explicitly requested.
- Do not add payments unless explicitly requested.
- Do not require OpenAI billing.
- Keep OpenAI optional.
- Preserve mock analysis fallback.
- Use TypeScript.
- Avoid over engineering.
- Keep CLI behavior stable unless the task explicitly asks to change it.
- Save logs and portfolio exports locally first.

## CLI Commands

```bash
vibelog end
vibelog list
vibelog show
vibelog replay
```

Local development from `apps/cli`:

```bash
npm run dev -- end
npm run dev -- list
npm run dev -- show
npm run dev -- replay
```

## Expected CLI Flow

```text
User implements feature
-> run vibelog end
-> collect Git data
-> prompt for user note
-> run OpenAI analysis or mock fallback
-> save local JSON session
-> save local Markdown log
```

## Local Files

```text
.vibelog/
  sessions/
  logs/
  portfolio/
```

## Web Dashboard

Routes:

```text
/
/dashboard
/dashboard/session/[id]
/dashboard/portfolio
```

The dashboard reads local files server-side. It must stay local-first and should not introduce database, auth, payment, or required external AI services.
