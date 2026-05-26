<div align="center">

# VibeLog

### Turn AI coding into explainable development history.

AI-generated code is fast.  
But can you explain it later?

VibeLog converts AI coding sessions into:

📝 Development Logs  
📦 Commit Messages  
📚 Portfolio Entries  
📄 README Sections  
🎯 Technical Decision Records  

---

**Built for Claude, Codex, Cursor, and Vibe Coders**

</div>

---

## Why VibeLog?

Modern AI coding is incredibly fast.

But after a few days:

```text
Why was this changed?
Which files were affected?
What feature was implemented?
How do I explain this in my portfolio?
```

AI helps us build faster.

VibeLog helps us remember.

---

## Problem

When using AI coding tools:

```text
Claude refactored authentication

Codex changed database schema

Cursor modified API structure

...
```

A few days later:

```text
What exactly happened?
```

Git shows:

```diff
+ 15 files changed
- 2 files removed
```

But Git does not explain:

- Why it changed
- What feature was implemented
- Impact scope
- Risks
- Portfolio explanation

---

## Solution

VibeLog analyzes:

```text
Git Diff
Changed Files
User Notes
Commits
```

Then generates:

```yaml
Feature:
JWT Authentication

Summary:
Implemented token-based login system.

Impact:
Auth API
Security Config
User Flow

Risks:
Missing refresh token handling

Commit:
feat: add JWT authentication

Portfolio:
Implemented JWT authentication using Spring Security...
```

---

## Workflow

```text
AI Coding
      ↓
Feature Implementation
      ↓
npx vibelog end
      ↓
Git Diff Analysis
      ↓
AI Interpretation
      ↓
Development Log Generated
      ↓
Portfolio / README / Commit Output
```

---

## Example

User:

```text
Create login using Spring Security + JWT
```

AI changes:

```text
AuthController.java
AuthService.java
JwtProvider.java
SecurityConfig.java
```

Run:

```bash
npx vibelog end
```

Generated:

```yaml
Feature:
JWT Login

Reason:
Authentication system implementation

Impact:
Login API
Security Layer

Todo:
Add integration tests

Portfolio:
Implemented authentication workflow using JWT...
```

---

## MVP Scope

### CLI

```bash
npx vibelog init
npx vibelog end
npx vibelog list
```

Functions:

- Git diff collection
- AI analysis
- Log generation
- Markdown export
- Portfolio generation

---

### Dashboard

Planned:

```text
Projects

DevLint
 ├ JWT Authentication
 ├ GitHub Integration
 └ Security Refactor
```

Features:

- Session history
- Portfolio generator
- README generator
- Release notes
- Technical timeline

---

## Tech Stack

### Frontend

- Next.js
- TailwindCSS
- shadcn/ui

### Backend

- Next.js API Routes
- Supabase

### AI

- OpenAI
- Anthropic

### CLI

- Node.js
- TypeScript

### Deploy

- Vercel

---

## Project Structure

```text
vibelog/

apps/
 ├ web
 └ cli

packages/
 ├ ai
 ├ shared
 └ types

docs/

README.md
```

---

## Vision

AI writes code.

VibeLog preserves understanding.

We believe future developers will need:

- AI memory
- Development history
- Explainable portfolios
- Technical storytelling

---

## Status

🚧 Planning Phase

Current Goal:

```text
git diff
      ↓
AI Analysis
      ↓
Development Log
      ↓
Markdown Export
```

---

## Roadmap

### Phase 1

CLI MVP

- [ ] init command
- [ ] end command
- [ ] git diff parser
- [ ] markdown export

### Phase 2

AI Analysis

- [ ] feature detection
- [ ] risk analysis
- [ ] commit generation
- [ ] portfolio generation

### Phase 3

Dashboard

- [ ] project management
- [ ] session history
- [ ] portfolio builder

### Phase 4

SaaS

- [ ] authentication
- [ ] subscriptions
- [ ] billing

---

## License

Currently private development.

License TBD.

---

<div align="center">

Built for vibe coders.

</div>
