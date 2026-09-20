# Yoga Studio

Premium wellness product for AI-assisted yoga classes. Instructors design and publish classes; students join Daily Yoga.

Suggested domain: `yogastudio.airepro.in`

## Yoga Studio Architecture Summary

```
Student → Daily Yoga → Class (join → practice → complete)

Instructor → Create Class → AI Plan (Fable 5) → Sequence Editor
  → Fable/Media Generation → Preview → Approval → Publish → Daily Yoga
```

Layers:

```
Frontend (React)
  → Yoga Studio API (/api/v1)
    → Yoga Class Service
      → AI Content Service
        → Media Generation Provider
          → Fable 5 (Anthropic Messages API) / future video providers
```

This repository was **empty**. The app is a standalone Express + React service following Airepro conventions (JavaScript/JSX, Vite, Tailwind, MySQL, JWT Bearer auth, `/api/v1`, helmet/cors/rate-limit). It does not modify Hire/OBO.

## Verified Fable 5 integration

Official docs used:

- [Introducing Claude Fable 5](https://platform.claude.com/docs/en/models/fable-5/introducing-claude-fable-5-and-claude-mythos-5)
- [Models overview](https://docs.anthropic.com/en/docs/about-claude/models)
- [Messages API](https://platform.claude.com/docs/en/api/messages)
- [Vision](https://platform.claude.com/docs/en/build-with-claude/vision) — image **understanding only**; Claude cannot natively generate images
- [Code execution](https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool)

| Capability | Status |
|---|---|
| Class plan / sequence JSON | Implemented via Messages API (`claude-fable-5-1`) |
| Class script JSON | Implemented via Messages API |
| Pose / instructor / thumbnail visuals | Implemented as **SVG text output** (not a native image model) |
| Video, voice, music, social promo | **Not available** on the Fable 5 API. Jobs fail with `CAPABILITY_UNAVAILABLE`. UI keeps the actions for a future provider. |

Auth (server-side only): `ANTHROPIC_API_KEY` or alias `FABLE_API_KEY` sent as `x-api-key`. Adaptive thinking is always on; `thinking: disabled` is never sent. `stop_reason: refusal` is treated as failure, never as success.

## How to run locally

```bash
# 1. MySQL
docker compose up -d mysql

# 2. Env
copy .env.example .env
copy backend\.env.example backend\.env

# 3. API
cd backend
npm install
npm run migrate
npm run seed
npm run dev

# 4. UI (another terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5174

Demo password for all seeded users: `DemoPass123!`

| Email | Role |
|---|---|
| student@yogastudio.local | Student |
| instructor@yogastudio.local | Instructor |
| admin@yogastudio.local | Admin |

Without a Fable key you can still browse, join, and practice the seeded **Morning Balance Flow**. Generation jobs fail honestly until keys are set.

## How to test

```bash
cd backend && npm test
cd frontend && npm test
cd frontend && npx playwright install && npm run test:e2e   # needs API + UI running
```

## Environment variables

See `.env.example`. Required in production:

- `JWT_SECRET_KEY` (≥32 chars)
- MySQL `DATABASE_*`
- `ANTHROPIC_API_KEY` or `FABLE_API_KEY` for AI generation
- `FABLE_MODEL=claude-fable-5-1`
- `FABLE_API_BASE_URL=https://api.anthropic.com`

## Production

- Put nginx in front of the Vite build; proxy `/api` and `/media` to the Node process
- Store media on object storage instead of local disk when you scale
- Never ship Fable/Anthropic keys to the frontend (`VITE_*` must not contain them)
- Approve/publish remains a human step; AI never auto-publishes
