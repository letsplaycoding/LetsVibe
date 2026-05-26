# Architecture

VibeLog uses a local-first architecture.

```text
Developer
  |
  v
CLI: vibelog end
  |
  v
Git Collector
  |
  v
User Note Prompt
  |
  v
AI Analysis
  |-- OpenAI when OPENAI_API_KEY is available
  |-- Mock analysis fallback when missing or failed
  |
  v
Local Writers
  |-- .vibelog/sessions/{timestamp}.json
  |-- .vibelog/logs/{timestamp}-{slug}.md
```

## CLI Modules

The CLI lives under:

```text
apps/cli
```

Implemented responsibilities:

- detect current Git repository
- collect Git diff
- collect short Git status
- collect changed file names
- prompt for user note
- call optional OpenAI analysis
- fall back to mock analysis
- save local JSON session
- save local Markdown log
- list sessions
- show session details
- replay session timeline

## Local Data Layout

```text
.vibelog/
  sessions/
    {timestamp}.json
  logs/
    {timestamp}-{slug}.md
  portfolio/
    portfolio-{timestamp}.md
```

## Web Dashboard

The web app lives under:

```text
apps/web
```

It uses Next.js App Router and reads local files server-side.

Routes:

```text
/
/dashboard
/dashboard/session/[id]
/dashboard/portfolio
```

Dashboard behavior:

- reads `.vibelog/sessions`
- sorts sessions newest first
- links to session details
- renders Markdown logs with a Markdown renderer
- generates portfolio Markdown from selected sessions
- exports portfolio Markdown locally

## Portfolio Export Flow

```text
/dashboard/portfolio
  |
  v
Select sessions
  |
  v
Generate Markdown in browser state
  |
  v
Server action writes local file
  |
  v
.vibelog/portfolio/portfolio-{timestamp}.md
```

## OpenAI Behavior

OpenAI is optional.

If `OPENAI_API_KEY` is present, the CLI attempts OpenAI analysis.

If the key is missing, invalid, or the request fails, the CLI prints:

```text
Using mock AI analysis
```

and generates local fallback analysis.

## Boundaries

VibeLog currently does not use:

- database
- authentication
- payment
- hosted API backend
- required OpenAI billing

Keep future work aligned with this local-first model unless explicitly changing product direction.
