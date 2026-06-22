# Next Orders - Wave 25

Status: `MVP 5 IMPORT/EXPORT AND REGRESSION CLOSEOUT`
Date: 2026-06-19

Wave24 produced a runnable MVP5 admin/operator thin slice. QA found no blocking
FAIL, but MVP5 is not closed yet because two P0 acceptance items remain
PARTIAL:

- `INT5-005`: ontology JSON import/export runtime and UI were intentionally
  deferred from Wave24.
- `INT5-009`: full MVP1-MVP4 regression breadth was not rerun in Wave24 QA.

Wave25 must stay focused. Close JSON import/export first, then prove the broader
regression guard. Do not reopen production enterprise scope.

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read Wave24 reports:
  - `docs/handoffs/wave-024/PM_REPORT.md`
  - `docs/handoffs/wave-024/BACKEND_REPORT.md`
  - `docs/handoffs/wave-024/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-024/QA_REPORT.md`
- Read MVP5 references:
  - `docs/pm/MVP5_PREP_BRIEF.md`
  - `docs/backlog/MVP5_DRAFT_BACKLOG.md`
  - `docs/backlog/INT5_MVP5_ACCEPTANCE.md`
  - `docs/adr/0008-mvp5-enterprise-governance-boundary.md`
  - `docs/api/MVP5_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp5-draft.json`
  - `docs/pm/MVP5_FRONTEND_UX_REQUIREMENTS.md`
- Use `docs/handoffs/REPORT_TEMPLATE.md`.
- Finish by writing your role report in `docs/handoffs/wave-025/{ROLE}_REPORT.md`.

## Non-Negotiable Security Rules

- Do not print, persist, screenshot, log, or report raw credential secret
  values.
- `raw_secret` may exist only in create response contract/smoke existence
  assertions.
- Import/export packages must never include raw credential material.
- Import dry-run must not mutate ontology/project state.
- Import apply/publish is out of Wave25 scope unless PM explicitly documents a
  narrower safe mutation. Default is dry-run only.
- External write APIs, production SSO/OIDC, vault/KMS, full ABAC language,
  full RDF/OWL/SHACL fidelity, full SPARQL/Cypher console, distributed HA/DR,
  and ungated autonomous publish remain P1 exclusions.

## Execution Sequence

1. PM freezes the Wave25 import/export acceptance details and regression matrix.
2. Backend and Frontend work in parallel after PM report exists.
3. QA verifies `INT5-005`, reruns regression breadth for `INT5-009`, and
   recommends whether MVP5 P0 can close or needs Wave26 hardening.

## PM Agent Order

Role: PM / Wave25 Import-Export and Regression Scope Freeze

Write report:

- `docs/handoffs/wave-025/PM_REPORT.md`

Primary backlog:

- `PM5-005`
- `BE5-005`
- `FE5-005`
- `INT5-005`
- `INT5-009`

Tasks:

- Freeze the exact JSON import/export P0 behavior for Wave25:
  - export package metadata, schema version, project id, ontology version id,
    class/property/relation counts, compatibility notes, and audit ref;
  - import dry-run only: upload/paste JSON package, parse summary, create/update
    counts, conflict rows, warning rows, destructive impact, compatibility
    status, rollback guidance, confirmation requirement, and audit preview;
  - no RDF/Turtle/OWL/SHACL fidelity beyond explicit JSON package shape;
  - no import apply mutation unless PM adds a bounded dry-run-to-apply decision.
- Decide the minimal route/UX acceptance for Frontend:
  - contextual route `/projects/:projectId/admin/import-export`;
  - project admin tabs may include `Import/export`;
  - global LNB remains one stable `Admin` entry only.
- Freeze the Wave25 regression matrix:
  - Backend: MVP5 focused tests plus MVP4/MVP3 regression tests; MVP1/MVP2 if
    cheap/available.
  - Frontend: `npm run test`, `npm run build`, `smoke:mvp5:mock`,
    `smoke:mvp5:actual`, and actual MVP3/MVP4 smokes where seed/runtime support
    exists.
  - Existing Docker/PostgreSQL Compose smoke remains P1 environment follow-up.
- Update docs only if needed. Do not edit runtime code.

Validation:

- `git diff --check` for changed PM/report files.

## Backend Agent Order

Role: Backend / MVP5 JSON Import-Export Runtime

Start condition:

- Read `docs/handoffs/wave-025/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-025/BACKEND_REPORT.md`

Primary backlog:

- `BE5-005`
- `BE5-008`
- `BE5-009`
- `BE5-010`
- `INT5-005`
- `INT5-009`

Tasks:

- Implement additive MVP5 JSON import/export runtime surfaces under the existing
  MVP5 module.
- Required export surface:
  - project-scoped ontology JSON export endpoint;
  - response includes package id, schema version, project id, ontology version
    id, counts, generated timestamp, download metadata or inline package
    summary, compatibility notes, and audit ref.
- Required import dry-run surface:
  - project-scoped import dry-run endpoint;
  - accepts deterministic JSON package payload or dry-run request;
  - returns package metadata, compatibility status, create/update/delete/no-op
    counts, conflict rows, warning rows, destructive impact rows, rollback
    guidance, confirmation requirement, and audit preview/ref.
- Add seed data and tests for:
  - clean compatible package;
  - conflict package;
  - warning/destructive impact package;
  - invalid schema/package;
  - no mutation after dry-run.
- Update actual OpenAPI export/compare for implemented import/export critical
  paths/schemas.
- Preserve Wave24 credential no-secret invariants and MVP1-MVP4 existing tests.

Validation:

- `cd apps/backend && .venv/bin/pytest tests/test_mvp5_api.py -q`
- Add or update focused import/export tests, then run them.
- `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
- `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
- `cd apps/backend && .venv/bin/ruff check app tests scripts`
- deterministic seed JSON parse.
- actual OpenAPI export and JSON parse.
- selected MVP5 import/export critical path/schema compare.
- no-secret scan for changed backend/API/seed/report artifacts.
- `git diff --check` for changed backend/API/report files.

## Frontend Agent Order

Role: Frontend / MVP5 Import-Export Admin UX

Start condition:

- Read `docs/handoffs/wave-025/PM_REPORT.md`.
- Prefer reading Backend report if available; otherwise implement mock-first and
  leave actual import/export smoke pending with a clear report note.

Write report:

- `docs/handoffs/wave-025/FRONTEND_REPORT.md`

Primary backlog:

- `FE5-005`
- `FE5-008`
- `INT5-005`
- `INT5-008`
- `INT5-009`

Tasks:

- Add contextual MVP5 route:
  - `/projects/:projectId/admin/import-export`
- Add project admin tab/card entry for import/export, while keeping global LNB
  as a single stable `Admin` entry.
- Add Frontend DTOs/client/query hooks/mock fixtures for:
  - export package metadata and counts;
  - import dry-run summary;
  - compatibility status;
  - conflict rows;
  - warning rows;
  - destructive impact rows;
  - rollback guidance;
  - confirmation requirement and audit link.
- UI must show:
  - export package readiness and counts;
  - import dry-run upload/paste placeholder;
  - compatible, warning, conflict, destructive, invalid package, loading, empty,
    and error states;
  - dry-run does not apply mutations;
  - audit preview/ref;
  - no credential or raw secret material in package preview.
- Extend smoke tooling:
  - mock route smoke must cover import/export markers;
  - actual route smoke should cover import/export when Backend runtime exists.

Validation:

- `cd apps/frontend && npm run test`
- `cd apps/frontend && npm run build`
- `cd apps/frontend && npm run smoke:mvp5:mock`
- If Backend runtime exists:
  - `cd apps/frontend && npm run smoke:mvp5:actual`
- Run existing MVP4/MVP3 actual smokes where available and cheap.
- no-secret scan for frontend fixtures/artifacts/reports.
- `git diff --check` for changed frontend/report files.

## QA Agent Order

Role: Integration / QA

Start condition:

- Read Wave25 PM, Backend, and Frontend reports first.

Write report:

- `docs/handoffs/wave-025/QA_REPORT.md`

Primary backlog:

- `INT5-001`~`INT5-010`, with focus on `INT5-005` and `INT5-009`

Tasks:

- Re-run Gate 0 no-secret scan across changed MVP5 docs/OpenAPI/backend/frontend
  reports and smoke artifacts.
- Verify `INT5-005` JSON import/export:
  - backend export package metadata/counts/audit;
  - backend import dry-run compatibility/conflicts/warnings/destructive impact;
  - dry-run is non-mutating;
  - frontend route and markers;
  - mock and actual smoke where available.
- Verify `INT5-009` regression breadth:
  - Backend MVP5/MVP4/MVP3 tests.
  - Frontend tests/build.
  - MVP5 mock and actual smokes.
  - MVP3/MVP4 actual smokes if the repository scripts and seed/runtime support
    are available.
  - Document MVP1/MVP2 availability honestly; classify as PASS/PARTIAL with
    evidence.
- Reclassify `INT5-001`~`INT5-010`.
- Recommend one of:
  - MVP5 P0 closeout;
  - Wave26 targeted hardening;
  - Wave26 usability/code-split/refactor review if MVP5 P0 is closed.

Validation:

- Include exact commands and artifact paths.
- `git diff --check` for `docs/handoffs/wave-025/QA_REPORT.md`.

