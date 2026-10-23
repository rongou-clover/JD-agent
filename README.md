# JD Agent

Demo agent that writes a job description with the user: they describe the role, the agent diagnoses the job title against a GTM catalog, asks only for what is missing, and renders the posting plus an internal sheet.

Live: https://demo-agent.heyclover.it · Built by Rongouz @ Clover

## Stack
- Next.js (App Router) · TypeScript · Tailwind
- Mastra: one workflow run per chat turn (state in Postgres), three agents, catalog tool, scorers
- Postgres (Drizzle) on Railway · Anthropic API
- Infra as code: Railway config in the repo

## Run locally
1. `cp .env.example .env.local` and fill it in
2. `pnpm install`
3. `pnpm db:up` (local Postgres in Docker), then `pnpm db:migrate`
4. `pnpm dev`: every route except `/accesso`, `/api/login` and `/api/health` needs the access cookie, set by `POST /api/login` with `ACCESS_PASSWORD`

## Checks
- `pnpm typecheck` · `pnpm lint` · `pnpm test` (Vitest, unit; no Docker, no API calls)
- `pnpm test:integration` (repositories and chat service against the docker Postgres from `pnpm db:up`; recreates a `jd_agent_test` database each run; admin URL overridable with `TEST_DATABASE_ADMIN_URL`)
- `pnpm test:e2e` (Playwright: screenshots and video in `test-results/`, report in `playwright-report/`)

## Docs
- `docs/decisioni.md` — project decisions (source of truth)
- `docs/user-stories.md` — Home and Chat stories
- `docs/schema-bozza.md` — JD draft schema (the contract between agents)
- `docs/domande.md` — how the agent asks each field
- `docs/template-output.md` — posting and internal sheet layout
- `docs/golden-dataset/` — reference cases used by the scorers
- `data/catalog.json` — GTM job title catalog
