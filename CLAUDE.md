# CLAUDE.md

Rules for working on JD Agent. Short answers, straight to the point.

## Before acting
- Read `docs/decisioni.md` first: it is the source of truth. A new decision goes there, one line, dated.
- Ambiguous → ask. Before writing code: list assumptions and edge cases, wait for OK.
- Do exactly what is asked. No unrequested features.

## Product
- Standalone demo, no login. GTM job titles only (`data/catalog.json`). Out of catalog → say so, still write the JD.
- The JD draft is a typed object (`docs/schema-bozza.md`); the posting is a view of it. The user never edits the text by hand: they select a passage and ask in chat.
- Questions follow `docs/domande.md`: one per message, never ask what is already known.
- Never age, gender, marital status, nationality. Equal opportunity line is fixed text.
- UI follows `design/` (tokens, wireframe). One screen, no scroll.

## Architecture
- Next.js App Router + TypeScript. Mastra for orchestration: one workflow (extract → diagnose → plan questions → suspend for answer → render).
- Three LLM agents, one folder each under `src/agents/<name>/`: `schema.ts` (Zod in/out), `prompt.md` (the prompt, never inline in code), `agent.ts`, `PROMPT_VERSION` constant bumped on every prompt change.
  - `extractor`: user text → draft fields. Fast model.
  - `role-diagnosis`: draft → catalog job title × seniority, or several candidates, or out of catalog. Fast model, catalog as a tool.
  - `renderer`: draft → posting + internal sheet, section by section. Writer model.
- Question planner and validators are plain code with unit tests, no LLM.
- Postgres via Drizzle: sessions and drafts. Short transactions; never call the LLM inside a transaction.
- Model ids and keys only from env (`.env.example`). Never hardcode.

## Code
- Code, comments, commits in English. Product copy in Italian.
- Closed sets → enums/const in one place (field ids, seniority, statuses). No magic strings.
- No `any`, no `@ts-ignore`, no dead code, no TODOs.
- Files under 200 lines; split when they grow.

## Tests
- Unit tests for planner and validators.
- Scorers on `docs/golden-dataset/` run before UI work: role diagnosed correctly, fields extracted correctly, no redundant questions. Real API calls cost money: run them on demand, not in watch mode.

## Infra
- Railway config in the repo (infra as code); secrets only as Railway variables.
- Domain: demo-agent.heyclover.it.
