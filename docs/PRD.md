# LetsVibe PRD

## One-Liner

Turn AI-assisted coding sessions into explainable development history.

## Problem

AI coding tools help developers move quickly, but the reasoning behind changes is easy to forget.

Developers need to remember:

- what changed
- why it changed
- which files were affected
- what feature was implemented
- what risks or todos remain
- how to explain the work in a portfolio

## Users

- solo developers
- students
- vibe coders
- portfolio builders
- developers using Codex, Claude, Cursor, and similar tools

## Product Goals

- capture local coding sessions from Git state
- generate readable development history
- keep data local by default
- support portfolio writing
- work without billing or hosted infrastructure

## Current Working Features

### CLI

Implemented commands:

```bash
vibelog end
vibelog list
vibelog show
vibelog replay
```

`vibelog end` collects:

- Git diff
- Git status
- changed files
- user note
- optional OpenAI analysis
- mock analysis fallback

It outputs:

```text
.vibelog/sessions/{timestamp}.json
.vibelog/logs/{timestamp}-{slug}.md
```

### Web Dashboard

Implemented routes:

```text
/
/dashboard
/dashboard/session/[id]
/dashboard/portfolio
```

Implemented dashboard features:

- local session list
- session count
- relative timestamps
- clickable session cards
- session detail page
- rendered Markdown preview
- Git status code block
- portfolio generator
- portfolio Markdown export

Portfolio exports are written to:

```text
.vibelog/portfolio/portfolio-{timestamp}.md
```

## OpenAI and Mock Mode

OpenAI is optional.

If `OPENAI_API_KEY` exists, the CLI attempts AI analysis.

If the key is missing or the request fails, VibeLog uses mock mode and continues locally.

Mock mode:

- requires no billing
- requires no network
- still writes JSON and Markdown logs

## Non-Goals

- No database
- No authentication
- No payment
- No hosted SaaS backend
- No required OpenAI billing

## Success Criteria

A developer can:

1. Make local code changes.
2. Run `vibelog end`.
3. Save a local JSON session.
4. Save a local Markdown log.
5. List and inspect previous sessions.
6. Open the dashboard.
7. View session details with rendered Markdown.
8. Generate portfolio Markdown from selected sessions.
9. Export the portfolio Markdown locally.

## Local Development

Install:

```bash
corepack pnpm install
```

CLI:

```bash
cd apps/cli
npm run dev -- end
npm run dev -- list
npm run dev -- show
npm run dev -- replay
```

Web:

```bash
corepack pnpm web:dev
```

Build:

```bash
corepack pnpm --filter @letsvibe/cli build
corepack pnpm --filter @letsvibe/web build
```
