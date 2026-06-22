# Next Orders - Wave 32

Status: `MVP6.2 ACTIVE LEARNING THIN IMPLEMENTATION`
Date: 2026-06-22

Wave31 closed targeted contract hardening as PASS. Wave32 may implement the
smallest MVP6.2 runtime/UI slice for Active Learning / Continuous Improvement.

The implementation goal is a deterministic local demo loop:

```text
select project
-> view learning signal summary
-> inspect correction pattern
-> inspect prompt suggestion
-> accept/dismiss suggestion
-> see decision audit note
```

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read Wave31 reports:
  - `docs/handoffs/wave-031/PM_REPORT.md`
  - `docs/handoffs/wave-031/BACKEND_REPORT.md`
  - `docs/handoffs/wave-031/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-031/QA_REPORT.md`
- Read Wave31-aligned planning docs:
  - `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md`
  - `docs/api/MVP6_2_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp6-2-draft.json`
  - `docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md`
  - `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`
- Use `docs/handoffs/REPORT_TEMPLATE.md`.
- Finish by writing your role report in `docs/handoffs/wave-032/{ROLE}_REPORT.md`.

## Scope Guard

- MVP6.2 thin implementation only.
- Use deterministic local/mock data derived from approved MVP3/MVP4/MVP6.1
  artifact shapes. Do not call real LLM providers.
- `POST /decisions` may create/update a suggestion decision audit record and
  resulting suggestion state only.
- Do not mutate prompt versions, extraction jobs, candidates, candidate review,
  auto-approval policy, publish jobs, or published graph state.
- Do not add fine-tuning, live retraining, training export execution, ontology
  governance, impact simulation, copilot/agent runtime, connector/plugin SDK,
  multi-tenant runtime, ontology packs, or advanced visualization/storytelling.
- Durable DB/Alembic persistence is not required unless Backend determines the
  existing project pattern makes an in-memory/process-local store unsafe. If
  persistence is added, it must be minimal and covered by tests.

## Execution Sequence

1. PM confirms Wave32 implementation scope guard and updates backlog only if
   necessary.
2. Backend implements deterministic MVP6.2 endpoints and tests.
3. Frontend implements Learning Insights UI, types/client/mocks, and mock/actual
   smoke.
4. QA validates runtime/API/UI, no-mutation guard, and recommends closeout or
   targeted hardening.

## PM Agent Order

Role: PM / MVP6.2 Implementation Scope Guard

Write report:

- `docs/handoffs/wave-032/PM_REPORT.md`

Backlog IDs:

- `PM6-016` Wave32 implementation scope guard

Tasks:

- Confirm no new product scope beyond the frozen P0 flow.
- Confirm deterministic local data is acceptable for the first thin slice.
- Confirm actual implementation acceptance for Wave32:
  - Backend runtime endpoints exist and match OpenAPI planning fields.
  - Frontend can render summary, correction pattern, prompt suggestion,
    auto-approval preview, and decision audit note.
  - `ACCEPT`/`DISMISS` commands transition only `SUGGESTED` suggestions.
  - non-`SUGGESTED` command conflict is visible/tested.
  - mutation guard evidence remains false for prompt/candidate/published
    graph/policy/extraction/evaluation mutation.
- Update `docs/backlog/MVP6_DRAFT_BACKLOG.md` only if implementation backlog IDs
  need clarification.

Validation:

- `git diff --check`.

## Backend Agent Order

Role: Backend / MVP6.2 Runtime Thin Slice

Start condition:

- Read `docs/handoffs/wave-032/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-032/BACKEND_REPORT.md`

Backlog IDs:

- `BE6-019` Learning signal runtime endpoints
- `BE6-020` Suggestion decision audit runtime
- `BE6-021` MVP6.2 OpenAPI export/runtime alignment
- `BE6-022` No-mutation regression guard

Tasks:

- Implement additive `/api/v1` endpoints matching
  `docs/api/MVP6_2_API_CONTRACT_DRAFT.md`:
  - `GET /api/v1/projects/{project_id}/learning-signals/summary`
  - `GET /api/v1/projects/{project_id}/learning-signals/correction-patterns`
  - `GET /api/v1/projects/{project_id}/learning-signals/prompt-suggestions`
  - `GET /api/v1/projects/{project_id}/learning-signals/auto-approval-candidates`
  - `POST /api/v1/learning-signal-suggestions/{suggestion_id}/decisions`
- Prefer a deterministic process-local service/store for this thin slice unless
  the app's existing patterns strongly favor persistence.
- Seed deterministic project-scoped data from approved source artifact shapes.
- Implement decision behavior:
  - `ACCEPT` moves `SUGGESTED` to `ACCEPTED`;
  - `DISMISS` moves `SUGGESTED` to `DISMISSED`;
  - `DISMISS` requires reason code;
  - decision against non-`SUGGESTED` returns conflict;
  - response includes mutation guard with all mutation flags false.
- Export/update runtime OpenAPI and keep `docs/api/openapi-mvp6-2-draft.json`
  aligned if this repo pattern expects an artifact.
- Add focused backend tests for endpoints, decision transitions, conflict,
  enum/field alignment, and no-mutation guard.

Validation:

- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_2_learning_api.py -q`
  or the actual focused test file you create.
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_evaluation_api.py -q`.
- `cd apps/backend && .venv/bin/ruff check app tests scripts`.
- OpenAPI export/parse/compare for MVP6.2 relevant paths.
- `git diff --check`.

## Frontend Agent Order

Role: Frontend / MVP6.2 Learning Insights Thin UI

Start condition:

- Read `docs/handoffs/wave-032/PM_REPORT.md`.
- Coordinate with Backend report or implementation notes if backend contracts
  change.

Write report:

- `docs/handoffs/wave-032/FRONTEND_REPORT.md`

Backlog IDs:

- `FE6-018` Learning Insights route and IA
- `FE6-019` Learning Insights API types/client/mocks
- `FE6-020` Product Showcase style application
- `FE6-021` Mock and actual smoke

Tasks:

- Implement a project-scoped Learning Insights area without adding ID-bound
  detail pages to the global LNB.
- Add Frontend types/client/query/mocks for the frozen MVP6.2 contract.
- Render:
  - learning signal summary;
  - correction pattern list/detail;
  - prompt suggestion board/detail;
  - auto-approval preview card/list;
  - decision audit note after accept/dismiss;
  - conflict/error state for already-decided suggestions if available.
- Use Product Showcase style guidance in
  `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md`: strong summary card, visible
  status badges, action bar, detail panel/drawer/modal patterns, readable
  workflow rather than raw tables.
- Preserve loading, empty, error, permission-limited, stale, and superseded
  states in mocks or UI states.
- Add `npm run smoke:mvp6:learning:mock` and, if backend is runnable,
  `npm run smoke:mvp6:learning:actual` or an equivalent script.

Validation:

- `cd apps/frontend && npm run test`.
- `cd apps/frontend && npm run build`.
- `cd apps/frontend && npm run smoke:mvp6:learning:mock`.
- `cd apps/frontend && npm run smoke:mvp6:learning:actual` if backend is
  runnable.
- `git diff --check`.

## QA Agent Order

Role: Integration / QA

Start condition:

- Read Wave32 PM, Backend, and Frontend reports.

Write report:

- `docs/handoffs/wave-032/QA_REPORT.md`

Backlog IDs:

- `INT6-017` MVP6.2 backend runtime acceptance
- `INT6-018` MVP6.2 frontend mock/API acceptance
- `INT6-019` MVP6.2 no-mutation guard
- `INT6-020` Wave32 closeout recommendation

Tasks:

- Update `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md` with runtime gates.
- Validate backend endpoints, DTOs, enum values, decision transitions, conflict
  behavior, and mutation guard.
- Validate frontend mock/actual flow:
  `summary -> correction pattern -> prompt suggestion -> accept/dismiss -> audit note`.
- Confirm no prompt/candidate/published graph/policy/extraction/evaluation
  mutation from learning signal operations.
- Run selected MVP6.1 regression tests/smokes and any MVP4/MVP5 guard that
  Backend/Frontend touched.
- Recommend one:
  - MVP6.2 thin slice closeout;
  - targeted Wave33 hardening;
  - stop for PM redesign.

Validation:

- Include exact commands and artifacts.
- Confirm no leftover local dev server listeners on `8000` or `5173`.
- `git diff --check`.
