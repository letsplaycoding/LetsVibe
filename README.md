# VibeLog

Turn AI-assisted coding changes into explainable development history.

VibeLog is a local-first developer tool that collects Git changes, asks for a short work note, stores session history locally, generates readable Markdown logs, and displays everything in a small Next.js dashboard.

## Current Features

- CLI command: `vibelog end`
- CLI command: `vibelog list`
- CLI command: `vibelog show`
- CLI command: `vibelog replay`
- Local JSON session export
- Local Markdown log export
- Optional OpenAI analysis
- Mock AI analysis fallback when `OPENAI_API_KEY` is missing or OpenAI fails
- Web dashboard
- Session list
- Session detail page
- Rendered Markdown preview
- Portfolio generator
- Portfolio Markdown export

## Local-First Storage

VibeLog writes local files under `.vibelog/`:

```text
.vibelog/
  sessions/
    {timestamp}.json
  logs/
    {timestamp}-{slug}.md
  portfolio/
    portfolio-{timestamp}.md
```

No database, authentication, payment system, or hosted backend is required.

## OpenAI Is Optional

Set `OPENAI_API_KEY` in `.env` if you want real AI analysis:

```text
OPENAI_API_KEY=your_api_key_here
```

If the key is missing, invalid, or the OpenAI request fails, VibeLog automatically uses mock analysis and prints:

```text
Using mock AI analysis
```

Mock mode works without billing.

## Install

```bash
corepack pnpm install
```

## CLI Usage

From `apps/cli`:

```bash
npm run dev -- end
npm run dev -- list
npm run dev -- show
npm run dev -- show 1
npm run dev -- replay
npm run dev -- replay 1
```

Build the CLI:

```bash
corepack pnpm --filter @letsvibe/cli build
```

### `vibelog end`

Collects:

- current Git repository
- `git diff`
- `git status --short`
- changed files from `git diff --name-only`
- user note
- AI or mock analysis

Saves:

- `.vibelog/sessions/{timestamp}.json`
- `.vibelog/logs/{timestamp}-{slug}.md`

### `vibelog list`

Lists local sessions newest first and shows:

- index
- feature name
- creation time
- changed files count
- Markdown log path

### `vibelog show`

Shows a detailed session. Defaults to the latest session.

```bash
npm run dev -- show
npm run dev -- show 1
npm run dev -- show 2026-05-26T06-00-00-000Z
```

### `vibelog replay`

Displays a timeline-style replay of a session. Defaults to the latest session.

```bash
npm run dev -- replay
npm run dev -- replay 1
```

## Web Dashboard Usage

Run the dashboard:

```bash
corepack pnpm web:dev
```

Then open:

```text
http://localhost:3000
http://localhost:3000/dashboard
```

If port `3000` is already in use, Next.js may choose another port such as `3001`.

Dashboard routes:

- `/` - product intro and dashboard link
- `/dashboard` - local session list
- `/dashboard/session/[id]` - session detail page with Markdown preview
- `/dashboard/portfolio` - select sessions, generate portfolio Markdown, copy it, and export it locally

## Web Features

The dashboard reads local session JSON files server-side from `.vibelog/sessions`.

It supports:

- session count
- newest-first session list
- clickable session cards
- relative timestamps
- session detail pages
- rendered Markdown log preview
- Git status code block
- portfolio generation from selected sessions
- portfolio export to `.vibelog/portfolio/portfolio-{timestamp}.md`

## Tech Stack

- TypeScript
- Node.js
- pnpm
- Next.js App Router
- React
- Local filesystem storage

## Project Structure

```text
apps/
  cli/
  web/
docs/
packages/
README.md
AGENTS.md
```

## Non-Goals

Current non-goals:

- database
- authentication
- payment
- hosted SaaS backend
- required OpenAI billing

## Build

```bash
corepack pnpm --filter @letsvibe/cli build
corepack pnpm --filter @letsvibe/web build
```

## Status

Current working phase includes CLI logging, local Markdown exports, local web dashboard, session detail pages, rendered Markdown previews, portfolio generation, and local portfolio Markdown export.
