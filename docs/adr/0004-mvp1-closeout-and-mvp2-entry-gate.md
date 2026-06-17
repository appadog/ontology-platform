# ADR 0004: MVP 1 Closeout and MVP 2 Entry Gate

## Status

Accepted

## Context

Wave 4 QA found that backend P0 APIs and OpenAPI export were largely aligned, but MVP 1 acceptance could not be closed because actual frontend-to-backend evidence and browser/manual UAT evidence were incomplete.

Wave 4 also found a frontend actual API mismatch: the frontend client attempted `/api/v1/dashboard`, while MVP 1 OpenAPI does not expose that endpoint. Backend Wave 5 confirmed no backend change is required and `/api/v1/dashboard` remains absent from `docs/api/openapi-mvp1.json`.

MVP 2 preparation documents now exist, but MVP 2 must not become a workaround for unresolved MVP 1 acceptance blockers.

## Decision

- `/api/v1/dashboard` is excluded from the MVP 1 actual API contract.
- Backend must not add a dashboard endpoint for MVP 1 closeout.
- Frontend actual API mode must compute dashboard summary from P0 Project/Ontology/Source APIs or keep dashboard behind a mock-only/P1 boundary.
- INT-001 full pass requires actual frontend-to-backend smoke with `VITE_USE_MOCK_API=false`.
- Browser click smoke is the preferred UAT evidence. If browser automation is unavailable, QA must record a manual UAT checklist, execution environment, and not-run reason for PM exception review.
- MVP 2 design review may continue, but implementation must not begin until MVP 1 `INT-001`, `INT-002`, and `INT-003` are PASS or explicitly accepted as PM exceptions.
- MVP 1 blockers and MVP 2 entry conditions must be tracked separately in backlog and handoff reports.

## Consequences

- Dashboard 404 in actual API mode is a frontend boundary blocker, not a backend endpoint request.
- MVP 1 closeout remains PARTIAL until frontend actual API, ontology authoring, source upload/preview, and browser/manual UAT evidence are complete or explicitly excepted.
- MVP 2 draft backlog and API contract can be reviewed for naming, DTO, enum, and risk, but must not trigger code, migration, endpoint, worker, or route implementation.
- QA should treat missing browser automation as an evidence issue that needs a manual UAT substitute or explicit exception, not as an automatic PASS.

## Follow-up

- Frontend: remove or isolate `/api/v1/dashboard` actual API calls.
- Frontend: provide `VITE_USE_MOCK_API=false` source and ontology authoring smoke evidence.
- QA: rerun INT-001/INT-002/INT-003 after Frontend Wave 5 evidence lands.
- PM: keep `docs/backlog/INT-001_MVP1_DEMO_ACCEPTANCE.md` and `docs/backlog/MVP1_BACKLOG.md` synchronized with closeout status.
