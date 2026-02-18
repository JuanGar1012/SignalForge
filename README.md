# SignalForge

SignalForge is an AI-driven app built in fast vertical slices with production-minded defaults.

## Fastest Architecture (for MVP)

- Web + API: Next.js App Router (single deploy target for speed).
- Auth: server-issued JWT in HttpOnly cookie, validated on protected endpoints.
- Validation: Zod at API boundaries.
- AI (Slice 2): OpenAI API through server route handlers.
- Data (Slice 3): Postgres + pgvector for retrieval and citations.
- Deploy (Slice 4): Vercel for web/API, managed Postgres (Neon/Supabase/Railway).
- CI: GitHub Actions (`lint`, `test`, `build`).

## Current Repo Structure

```text
.
|-- .github/workflows/ci.yml
|-- evals/prompts.json
|-- scripts/run-evals.mjs
|-- src/
|   |-- data/knowledge-base.json
|   |-- app/
|   |   |-- api/
|   |   |   |-- auth/{login,logout,session}/route.ts
|   |   |   |-- ai/respond/route.ts
|   |   |   |-- health/route.ts
|   |   |   `-- protected/ping/route.ts
|   |   |-- dashboard/page.tsx
|   |   |-- login/page.tsx
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   `-- lib/
|       |-- ai.ts
|       |-- auth.ts
|       |-- env.ts
|       |-- retrieval.ts
|       |-- session-token.ts
|       `-- auth.spec.ts
|-- PROJECT_STATE.md
`-- README.md
```

## Slice 1 Implemented

- Skeleton pages: `/`, `/login`, `/dashboard`.
- Health check: `GET /api/health`.
- Auth flow:
  - `POST /api/auth/login` (zod-validated credentials).
  - `POST /api/auth/logout`.
  - `GET /api/auth/session`.
- Server-enforced authz:
  - `/dashboard` redirects to `/login` if unauthenticated.
  - `GET /api/protected/ping` returns `401` without session cookie.

## Slice 2 Implemented

- Core AI flow:
  - `POST /api/ai/respond` with zod payload validation (`prompt`).
  - Server-enforced auth required on AI endpoint.
  - Deterministic generation settings (`temperature: 0`, `top_p: 1`).
- UI integration:
  - Dashboard AI playground for end-to-end prompt -> response testing.
- Runtime behavior:
  - Uses OpenAI when `OPENAI_API_KEY` is set.
  - Falls back to deterministic mock response when key is missing.

## Slice 3 Implemented

- Retrieval:
  - Added deterministic lexical retrieval over local knowledge base.
  - Top 3 relevant sources are selected for each prompt.
- Citations:
  - `POST /api/ai/respond` now returns structured citations (`id`, `title`, `snippet`, `score`).
  - Dashboard now displays citation list with ranking scores.
- Eval quality gate:
  - Added 10 retrieval-grounding eval cases with expected top citation and required grounded output terms.
  - Eval script now reports pass rate and fails below 80%.

## Slice 4 Baseline Implemented

- Observability:
  - Middleware injects and propagates `x-request-id` for all API routes.
  - Structured JSON logs for key auth and AI events.
  - API responses include `x-request-id` for trace correlation.
- Deploy scaffolding:
  - Added `vercel.json` with Next.js framework config and baseline security headers.

## Local Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure env:
   ```bash
   cp .env.example .env.local
   ```
3. Run app:
   ```bash
   npm run dev
   ```
4. Checks:
   ```bash
   npm run lint
   npm run test
   npm run build
   npm run evals
   ```
5. AI setup (optional for real model):
   ```bash
   # in .env.local
   OPENAI_API_KEY=...
   OPENAI_MODEL=gpt-4.1-mini
   ```

## Deploy (Vercel)

1. Push repository to GitHub.
2. Import project in Vercel.
3. Set env vars in Vercel project settings:
   - `AUTH_JWT_SECRET` (32+ chars)
   - `AUTH_COOKIE_NAME` (default `signalforge_session`)
   - `AUTH_DEMO_USER`
   - `AUTH_DEMO_PASSWORD`
   - `OPENAI_API_KEY` (optional; app uses deterministic mock if missing)
   - `OPENAI_MODEL` (optional)
4. Deploy and verify:
   - `/api/health`
   - `/login` -> `/dashboard`
   - dashboard AI playground end-to-end

## Tradeoffs

- Chose Next.js-only stack for Slice 1 to minimize deployment and integration overhead.
- Used demo credential auth for speed; replace with real identity provider in Slice 4.
- Added eval harness scaffold now to prevent delayed quality work.

## Demo Steps

1. Open `/login`, sign in with env credentials.
2. Open `/dashboard` to verify protected server-rendered page.
3. Hit `/api/protected/ping` and `/api/health`.
4. In `/dashboard`, submit a prompt in AI Playground and verify response/provider/latency.
