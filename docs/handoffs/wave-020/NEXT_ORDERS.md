# Next Orders - Wave 20

Status: `MVP 4 THIN IMPLEMENTATION`
Date: 2026-06-19

Wave 20 starts the first MVP4 runtime/UI slice after Wave19 contract-first
PASS. Keep the implementation thin, deterministic, additive, and smokeable.
Do not try to finish all MVP4 product depth in one wave.

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read the Wave19 reports:
  - `docs/handoffs/wave-019/PM_REPORT.md`
  - `docs/handoffs/wave-019/BACKEND_REPORT.md`
  - `docs/handoffs/wave-019/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-019/QA_REPORT.md`
- Read Wave19 contract artifacts:
  - `docs/pm/MVP4_PREP_BRIEF.md`
  - `docs/backlog/MVP4_DRAFT_BACKLOG.md`
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `docs/adr/0007-mvp4-search-rag-read-only-boundary.md`
  - `docs/api/MVP4_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp4-draft.json`
  - `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`
- Preserve MVP3 behavior and regression commands.
- Use `docs/handoffs/REPORT_TEMPLATE.md` for your report.
- Finish by writing your role report in `docs/handoffs/wave-020/{ROLE}_REPORT.md`.

## Execution Sequence

1. PM runs a short scope guard and confirms the Wave20 implementation slice.
2. Backend and Frontend run in parallel after PM report exists.
3. QA runs after Backend and Frontend reports exist.
4. Commander decides whether Wave21 is hardening or broader MVP4 expansion.

## PM Agent Order

Role: PM / Architecture Scope Guard

Write report:

- `docs/handoffs/wave-020/PM_REPORT.md`

Primary backlog:

- `PM4-001`~`PM4-008`
- `INT4-001`~`INT4-008`

Tasks:

- Confirm Wave20 implementation priorities from `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  and `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`.
- Keep Wave20 P0 implementation focused on:
  - deterministic MVP4 seed;
  - actual Backend endpoint families for quality, dataset/golden set,
    prompt/model performance, search, vector status/similar evidence, RAG,
    graph explorer, and external read-only API;
  - Frontend DTO/client/mock foundation;
  - first UI slices for quality, search/vector/RAG, graph explorer states,
    datasets/performance, and external API docs;
  - MVP3 regression guard.
- Reconfirm P1 exclusions:
  - weighted composite quality score;
  - production vector DB hardening;
  - collaboration/SLA;
  - production API keys/service accounts;
  - broad graph performance optimization beyond safe-too-large state.
- If no new decision is needed, do not rewrite PM docs. Write the report only.
- If a tiny clarification is necessary, update the smallest relevant PM/backlog
  doc and explain why.

Validation:

- Run `git diff --check` for changed PM/report files.

## Backend Agent Order

Role: Backend

Start condition:

- Read `docs/handoffs/wave-020/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-020/BACKEND_REPORT.md`

Primary backlog:

- `BE4-001` Advanced quality metrics runtime
- `BE4-002` Evaluation dataset/golden set runtime
- `BE4-003` Evaluation run and prompt/model performance runtime
- `BE4-004` Keyword search runtime
- `BE4-005` Vector/similar evidence adapter fallback runtime
- `BE4-006` Grounded RAG answer runtime
- `BE4-007` Advanced published graph explorer runtime
- `BE4-008` External read-only API runtime
- `BE4-009` Actual OpenAPI export alignment

Tasks:

- Implement additive MVP4 backend modules without breaking MVP3 routes.
- Add enums and Pydantic schemas matching `docs/api/openapi-mvp4-draft.json`.
- Add thin routers/services for:
  - `GET /api/v1/projects/{project_id}/quality/metrics`
  - `GET /api/v1/projects/{project_id}/quality/metrics/{metric_id}`
  - evaluation dataset/version/golden item list/detail/create draft endpoints
  - evaluation run and prompt experiment list/detail/create draft endpoints
  - `GET /api/v1/projects/{project_id}/prompt-performance/summary`
  - `GET /api/v1/projects/{project_id}/search`
  - `GET /api/v1/projects/{project_id}/vector/status`
  - `POST /api/v1/projects/{project_id}/similar-evidence`
  - `POST /api/v1/projects/{project_id}/rag/answers`
  - published graph explorer and lineage endpoints
  - external read-only graph/source/evidence/search/RAG endpoints
- Prefer deterministic local data derived from existing MVP3 seed and simple
  thin tables/fixtures over complex production storage.
- Add `apps/backend/scripts/seed_mvp4.py` or extend seed support so QA can
  create stable MVP4 examples described in `INT4_MVP4_ACCEPTANCE.md`.
- Add Alembic migration only for state that genuinely needs persistence in this
  thin slice. Static/demo service data may be acceptable if documented.
- Prove read-only boundaries:
  - RAG must not accept candidate facts as answer facts/citations.
  - external APIs must expose read-only methods only.
  - search/RAG/graph explorer must not mutate candidates, reviews, or published
    graph.
- Export actual OpenAPI to a temp file and compare or diff against the planning
  artifact. Document expected differences if exact equality is not feasible.
- Add focused tests for key MVP4 runtime boundaries and seed sanity.
- Run existing MVP3 focused tests to protect regression.

Validation:

- Backend tests relevant to MVP4 plus MVP3 regression.
- `ruff check app tests scripts`.
- `python scripts/export_openapi.py --output /tmp/ontology-wave20-openapi.json`.
- `python3 -m json.tool` on any generated JSON artifacts.
- `git diff --check` for changed backend/docs/report files.

## Frontend Agent Order

Role: Frontend / UIUX

Start condition:

- Read `docs/handoffs/wave-020/PM_REPORT.md`.
- Backend may still be working; implement mock-first and actual-client-ready
  against `docs/api/openapi-mvp4-draft.json` and `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`.

Write report:

- `docs/handoffs/wave-020/FRONTEND_REPORT.md`

Primary backlog:

- `FE4-001` Advanced quality dashboard thin UI
- `FE4-002` Model/prompt performance thin UI
- `FE4-003` Evaluation dataset/golden set thin UI
- `FE4-004` Advanced graph explorer states
- `FE4-005` Integrated search thin UI
- `FE4-006` RAG answer thin UI
- `FE4-007` External API docs surface

Tasks:

- Add MVP4 TypeScript DTOs/client methods/mock fixtures under the existing
  `shared/api` and `shared/mocks` boundaries.
- Keep `hana-style-component` behind the existing adapter if UI primitives are
  needed.
- Add additive project-scoped routes from `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`.
  Do not destabilize existing MVP3 route anchors.
- Implement thin but usable UI slices:
  - advanced quality dashboard with metric groups, formula explainer, version
    context, and no composite P0 score;
  - integrated search with grouped results and no-result/stale/partial states;
  - vector status/fallback treatment;
  - RAG answer workspace with citations, linked published facts,
    `INSUFFICIENT_EVIDENCE`, and candidate-exclusion copy;
  - advanced graph explorer state handling for `READY`, `SAFE_TOO_LARGE`,
    `EMPTY`, and `ERROR`;
  - evaluation dataset/golden set and prompt/model performance overview;
  - minimal external read-only API docs surface.
- Add mock fixture coverage for positive and negative states from
  `INT4_MVP4_ACCEPTANCE.md`.
- Add or update smoke/test scripts if practical:
  - keep existing MVP3 smoke intact;
  - add `smoke:mvp4:mock` and/or `smoke:mvp4:actual` only if the app surface is
    ready enough in this wave.
- Product UX expectations:
  - project context should always be clear;
  - ID-bound detail pages are reached by contextual links and breadcrumbs, not
    flat global LNB entries;
  - loading, empty, error, insufficient-evidence, vector fallback,
    stale/partial index, and safe-too-large states must be visible.

Validation:

- `npm run test`.
- `npm run build`.
- route smoke for MVP4 mock pages if added.
- existing MVP3 smoke if backend actual API is available, or document why not.
- `git diff --check` for changed frontend/docs/report files.

## QA Agent Order

Role: Integration / QA

Start condition:

- Read Wave20 PM, Backend, and Frontend reports first.

Write report:

- `docs/handoffs/wave-020/QA_REPORT.md`

Primary backlog:

- `INT4-001`~`INT4-008`
- `INT4-009` remains P1 unless PM promotes it
- MVP3 regression guard

Tasks:

- Execute as much of `docs/backlog/INT4_MVP4_ACCEPTANCE.md` as Wave20 runtime
  allows.
- Parse actual Backend OpenAPI export if produced and compare critical paths,
  schemas, and enum literals to `docs/api/openapi-mvp4-draft.json`.
- Verify deterministic MVP4 seed output if Backend provides it.
- Run Backend tests and Frontend build/test evidence if available, or validate
  reported command outputs and rerun focused checks when cheap.
- Verify Frontend MVP4 mock/actual routes where available:
  - quality metrics and formula explainer;
  - search result groups and stale/no-result states;
  - vector fallback;
  - RAG answered and insufficient-evidence states;
  - graph `READY` and `SAFE_TOO_LARGE` states;
  - dataset/golden set and prompt/model overview;
  - external API docs surface.
- Run MVP3 regression guard if runtime surfaces support it.
- Classify each `INT4-*` as `PASS`, `PARTIAL`, `FAIL`, or `NOT RUNNABLE`.
- Recommend Wave21 as hardening or expansion.

Validation:

- `python3 -m json.tool` for OpenAPI/seed artifacts.
- Backend/Frontend smoke commands as available.
- `git diff --check` for changed QA/report files.

## Commander Notes

- Wave19 contract is accepted as PASS.
- Wave20 does not need another PM scope expansion; PM role is a scope guard.
- A `PARTIAL` QA verdict is acceptable if it clearly separates implemented
  runtime slices from not-yet-runnable MVP4 surfaces.
- Do not move to MVP5 until MVP4 runtime acceptance is closed or explicitly
  accepted with non-blocking P1 follow-ups.
