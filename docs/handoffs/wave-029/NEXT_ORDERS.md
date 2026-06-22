# Next Orders - Wave 29

Status: `MVP6.1 TARGETED HARDENING`
Date: 2026-06-20

Wave28 accepted the MVP6.1 Gold Set / Benchmark Studio thin slice as PASS.
Wave29 must not broaden into MVP6.2 yet. Its purpose is to make the MVP6.1
slice more reproducible by closing actual API smoke, Frontend nested
`candidate_ref` DTO alignment, and persistence timing decisions.

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read Wave28 reports:
  - `docs/handoffs/wave-028/PM_REPORT.md`
  - `docs/handoffs/wave-028/BACKEND_REPORT.md`
  - `docs/handoffs/wave-028/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-028/QA_REPORT.md`
- Read:
  - `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`
  - `docs/pm/MVP6_PREP_BRIEF.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/backlog/INT6_MVP6_ACCEPTANCE.md`
- Use `docs/handoffs/REPORT_TEMPLATE.md`.
- Finish by writing your role report in `docs/handoffs/wave-029/{ROLE}_REPORT.md`.

## Scope Guard

- MVP6.1 hardening only.
- Do not implement MVP6.2 Active Learning.
- Do not implement ontology governance, impact simulation, copilot/agent,
  connector/plugin SDK, multi-tenant runtime, ontology packs, or advanced
  visualization/storytelling.
- Do not add real LLM benchmark provider execution.
- Do not mutate candidate review, publish, or published graph state from
  evaluation operations.
- Durable DB/Alembic persistence is a PM decision first; do not implement it
  until PM explicitly promotes it.

## Execution Sequence

1. PM freezes the Wave29 hardening boundary and decides whether durable
   persistence remains P1/P2.
2. Backend adds only support needed for reproducible MVP6.1 actual smoke and
   contract stability.
3. Frontend widens DTO alignment and adds actual smoke.
4. QA validates mock and actual MVP6.1 flows plus selected regression guards.

## PM Agent Order

Role: PM / MVP6.1 Hardening Scope

Write report:

- `docs/handoffs/wave-029/PM_REPORT.md`

Backlog IDs:

- PM6-008 Wave29 hardening freeze
- PM6-009 Durable persistence decision

Tasks:

- Confirm that Wave29 is hardening, not MVP6.2 expansion.
- Decide exact PASS/PARTIAL criteria for `smoke:mvp6:actual`.
- Decide whether process-local runtime store remains acceptable for MVP6.1
  closeout. Default recommendation: keep durable DB/Alembic as P1/P2 unless
  actual API smoke cannot be made reproducible without it.
- Confirm that Frontend nested `candidate_ref` must match Backend
  `EvaluationCandidateRef` before deeper error-case actual UI.
- Update `docs/backlog/MVP6_DRAFT_BACKLOG.md` and/or
  `docs/backlog/INT6_MVP6_ACCEPTANCE.md` only if the acceptance criteria need
  clarifying.

Validation:

- `git diff --check` for changed docs/report files.

## Backend Agent Order

Role: Backend / MVP6.1 Actual Smoke Support

Start condition:

- Read `docs/handoffs/wave-029/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-029/BACKEND_REPORT.md`

Backlog IDs:

- BE6-010 Actual smoke support
- BE6-011 Evaluation contract stability

Tasks:

- Provide only the backend support needed for Frontend actual API smoke.
- Keep the process-local runtime store unless PM promotes durable persistence.
- If needed, add a small deterministic seed/reset helper or documented command
  that lets actual smoke create and inspect the MVP6.1 happy path repeatedly.
- Confirm OpenAPI still exposes the Wave28 MVP6.1 paths/schemas/enums.
- Preserve MVP4 compatibility routes and existing MVP1-MVP5 behavior.
- Do not add new MVP6 theme runtime.

Validation:

- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_evaluation_api.py -q`
- `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
- `cd apps/backend && .venv/bin/ruff check app tests scripts`
- OpenAPI export/parse if backend API docs change.
- `git diff --check`.

## Frontend Agent Order

Role: Frontend / MVP6.1 Actual Smoke and DTO Alignment

Start condition:

- Read `docs/handoffs/wave-029/PM_REPORT.md`.
- Coordinate with Backend report or implementation notes if backend smoke
  support changes.

Write report:

- `docs/handoffs/wave-029/FRONTEND_REPORT.md`

Backlog IDs:

- FE6-009 Actual API smoke
- FE6-010 Candidate ref DTO widening

Tasks:

- Widen Frontend `candidate_ref` nested type/display to match Backend
  `EvaluationCandidateRef`, including sample id, ontology ids, label/value,
  relation endpoints, and evidence.
- Add `npm run smoke:mvp6:actual` or equivalent script that exercises the
  MVP6.1 route against an actual backend API.
- Preserve existing `smoke:mvp6:mock`.
- Keep ID-bound evaluation detail routes contextual and out of the global LNB.
- Do not add MVP6.2+ UI.

Validation:

- `cd apps/frontend && npm run test`
- `cd apps/frontend && npm run build`
- `cd apps/frontend && npm run smoke:mvp6:mock`
- `cd apps/frontend && npm run smoke:mvp6:actual` if backend is runnable.
- `git diff --check`.

## QA Agent Order

Role: Integration / QA

Start condition:

- Read Wave29 PM, Backend, and Frontend reports.

Write report:

- `docs/handoffs/wave-029/QA_REPORT.md`

Backlog IDs:

- INT6-006 MVP6.1 actual API smoke
- INT6-007 Candidate ref DTO consistency
- INT6-008 MVP6.1 closeout recommendation

Tasks:

- Validate Wave29 did not broaden into MVP6.2 or later themes.
- Validate actual API happy path if `smoke:mvp6:actual` exists:
  `create dataset -> add sample -> add gold entity/relation -> run deterministic evaluation -> view metrics/errors`.
- Validate `candidate_ref` type/display consistency against Backend OpenAPI.
- Re-run selected regression guards:
  - MVP6 focused backend tests;
  - MVP4 focused regression;
  - frontend tests/build;
  - MVP6 mock and actual smoke where available.
- Confirm published graph, candidate review, and publish state are not mutated
  by evaluation operations.
- Recommend one:
  - MVP6.1 closeout and MVP6.2 contract-first planning;
  - targeted Wave30 hardening;
  - stop for PM redesign.

Validation:

- Include exact commands and artifacts.
- `git diff --check` for QA report.
