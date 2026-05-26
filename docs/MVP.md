# MVP

## Goal

Build a local-first tool for turning AI-assisted coding changes into explainable development logs.

## Implemented CLI Commands

```bash
vibelog end
vibelog list
vibelog show
vibelog replay
```

For local development from `apps/cli`:

```bash
npm run dev -- end
npm run dev -- list
npm run dev -- show
npm run dev -- replay
```

## `vibelog end`

Collects:

- current Git repository
- `git diff`
- `git status --short`
- changed files from `git diff --name-only`
- user note
- OpenAI analysis when available
- mock analysis when `OPENAI_API_KEY` is missing or OpenAI fails

Writes:

```text
.vibelog/sessions/{timestamp}.json
.vibelog/logs/{timestamp}-{slug}.md
```

## `vibelog list`

Reads `.vibelog/sessions`, sorts by `createdAt` descending, and prints recent sessions with:

- index
- feature name
- created time
- changed files count
- Markdown log path

## `vibelog show`

Shows detailed session information.

Supported selectors:

```bash
npm run dev -- show
npm run dev -- show 1
npm run dev -- show {session-id}
npm run dev -- show {session-filename}.json
```

## `vibelog replay`

Shows a readable timeline for a session.

Supported selectors:

```bash
npm run dev -- replay
npm run dev -- replay 1
```

## Implemented Web Dashboard

Routes:

```text
/
/dashboard
/dashboard/session/[id]
/dashboard/portfolio
```

Features:

- session list from local JSON files
- session count
- newest-first sorting
- clickable session cards
- relative timestamps
- session detail page
- Markdown preview rendering
- Git status code block
- portfolio generator from selected sessions
- portfolio Markdown export

Portfolio exports are saved to:

```text
.vibelog/portfolio/portfolio-{timestamp}.md
```

## Local Development

Install:

```bash
corepack pnpm install
```

Run web dashboard:

```bash
corepack pnpm web:dev
```

Build:

```bash
corepack pnpm --filter @letsvibe/cli build
corepack pnpm --filter @letsvibe/web build
```

## Non-Goals

- No database
- No authentication
- No payment
- No required OpenAI billing
- No hosted backend

OpenAI is optional. Mock mode works without billing.
