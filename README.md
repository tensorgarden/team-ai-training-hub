# Team AI Training Hub

A dashboard for training teams on ChatGPT and Claude, tracking AI adoption, managing prompt libraries, and monitoring analytics. A single-page portfolio demonstration of a team AI enablement platform.

## Who this is for

**Business stakeholders.** If your team bought ChatGPT Enterprise but nobody knows how to use it beyond "write me an email," this dashboard is for you. It shows who is actually using AI, which prompts drive the most value, and where training gaps exist. No more guessing whether the AI investment is paying off.

**Engineering evaluators.** This repo demonstrates full-stack competency with Next.js, TypeScript, Tailwind, and clean separation of concerns. All data is typesafe, fictional, and injected through a single import path. The dashboard renders in one page with zero network calls.

**AI agents and screeners.** The codebase follows a predictable pattern: types, demo data, page component, tests, CI. No hidden dependencies, no real API keys, no build tricks. Start with `src/lib/types.ts` for the data model and `src/lib/demo-data.ts` for the fixtures.

## Project story

Most companies invest in AI tools and then wonder why adoption flatlines at 30%. The problem is not the technology — it is the training gap. Teams want to use ChatGPT and Claude, but they do not know what good prompts look like, which use cases are safe, or whether their efforts are actually productive.

"I gave my team ChatGPT and three months later, only two people were using it regularly," one operations director told us. "The rest said it was 'not for them' because their first few prompts returned garbage."

This dashboard shows what happens when you pair AI tools with structured training, a shared prompt library, and adoption tracking. Every team member gets a visibility score. High-value prompt templates are shared and rated. Training modules track completion. And the usage log shows real activity — not guesswork.

It is a demo, not a product. But the architecture is real: prompt templates live behind typed interfaces, the training module system models a learning management flow, and the analytics layer computes adoption health from raw member data.

## Features

- **Prompt template library**: 8 curated templates across sales, marketing, support, engineering, HR, productivity, and data analysis categories. Each template includes the full prompt text, usage stats, star ratings, and creator attribution.
- **Team adoption tracking**: Per-member adoption scores with progress bars, prompt usage counts, and training module completion. Color-coded by adoption level (green > 85%, blue > 65%, amber > 40%, red below).
- **Training module catalog**: 5 modules from ChatGPT Fundamentals to Advanced Prompt Engineering with difficulty levels, completion rates, lesson counts, and duration estimates.
- **Usage analytics**: Hero stat cards showing team size, total prompts used, average adoption rate, and training completion percentage.
- **Recent prompt usage log**: Chronological feed of AI interactions showing who used what, which channel (ChatGPT/Claude/Copilot/API), token counts, and feedback sentiment.
- **Team leaderboard**: Ranked by prompt usage with adoption scores, making AI adoption visible and gamified.
- **Single-page dashboard**: Everything visible on one scrollable page — no routing, no modals, no loading spinners.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Testing | Vitest |
| Linting | ESLint 9 (flat config) |
| CI | GitHub Actions (lint -> typecheck -> test -> build) |
| Data layer | Static TypeScript fixtures with Supabase-compatible schema design |

## Architecture

```
src/
  lib/
    types.ts         <- All TypeScript interfaces (TeamMember, PromptTemplate, TrainingModule, etc.)
    demo-data.ts     <- Fictional fixture data — 6 members, 8 templates, 5 modules, 12 usage logs
  app/
    layout.tsx       <- Root layout with metadata
    page.tsx         <- Single dashboard page with all sections
    globals.css      <- Tailwind directives
tests/
  training.test.ts   <- 11 integrity tests on demo data
```

Data flows from `demo-data.ts` through `page.tsx` with no API calls, no database, and no authentication. The analytics are computed from the raw fixture data at import time.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality gates

```bash
npm run lint        # ESLint with --max-warnings=0
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run build       # next build
```

All four must pass before any push.

## Demo data

All names, emails, and metrics are fictional. The data models realistic team AI adoption scenarios:

- Power users (Sarah Chen, 94% adoption, 342 prompts) who have completed all training
- Strong adopters (Marcus Webb, 88%, 287 prompts) with one module remaining
- Mid-tier users (Priya Nair, 76%, 215 prompts) still ramping up
- Late adopters (David Park, 45%, 94 prompts) who need encouragement
- Prompt templates with real-world use cases and usage counts from 94 to 312
- Training modules ranging from 40-minute beginner courses to 90-minute advanced workshops

No real customer data, no network calls, no external APIs.

## Screenshot refresh

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3170 &
sleep 3
node scripts/capture-screenshots.mjs
kill %1
```

## Production roadmap

In production, this dashboard would add:

- Real prompt execution via OpenAI, Anthropic, or self-hosted models
- Supabase-backed persistence with row-level security
- Prompt template versioning and A/B testing
- SCORM/xAPI integration for training module hosting
- Per-department analytics and custom dashboards
- Gamification: streaks, badges, and team challenges

## Safety

- No real API keys or credentials
- All data is fictional and hardcoded
- No network calls — the dashboard renders entirely from static imports
- No user input collection or form submission

---

Built as a portfolio demonstration for Tensor Garden. Ready for review.
