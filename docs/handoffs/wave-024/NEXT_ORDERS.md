# Next Orders - Wave 24

Status: `MVP 5 THIN IMPLEMENTATION`
Date: 2026-06-19

Wave 23 closed MVP5 contract-first planning. Wave 24 begins the first runnable
MVP5 thin slice. This wave must stay narrow: implement the admin/operator
governance control plane slice, not all enterprise features.

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read Wave23 reports:
  - `docs/handoffs/wave-023/PM_REPORT.md`
  - `docs/handoffs/wave-023/BACKEND_REPORT.md`
  - `docs/handoffs/wave-023/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-023/QA_REPORT.md`
- Read MVP5 references:
  - `docs/pm/MVP5_PREP_BRIEF.md`
  - `docs/backlog/MVP5_DRAFT_BACKLOG.md`
  - `docs/backlog/INT5_MVP5_ACCEPTANCE.md`
  - `docs/adr/0008-mvp5-enterprise-governance-boundary.md`
  - `docs/api/MVP5_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp5-draft.json`
  - `docs/pm/MVP5_FRONTEND_UX_REQUIREMENTS.md`
- Use `docs/handoffs/REPORT_TEMPLATE.md`.
- Finish by writing your role report in `docs/handoffs/wave-024/{ROLE}_REPORT.md`.

## Hard Gate 0: Secret Example Cleanup

Before any seed/runtime/mock/report/screenshot artifact is generated:

- Replace raw-secret-looking example literals in:
  - `docs/api/MVP5_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp5-draft.json`
- Use a clearly non-secret placeholder such as
  `ONE_TIME_SECRET_PLACEHOLDER_NOT_A_REAL_SECRET`.
- Keep the `raw_secret` field contract only in create response schemas/examples.
- List/detail/audit/event/report/fixture examples must use only masked values
  and must not contain raw-secret-looking literals.
- No agent may print, persist, log, screenshot, or report a raw credential
  secret value. Runtime smoke may assert that `raw_secret` exists, but must not
  echo its value.

## Execution Sequence

1. PM verifies Gate 0 and confirms no new MVP5 scope is promoted.
2. Backend implements Gate 0 cleanup, deterministic seed, runtime API slice,
   backend tests, and actual OpenAPI export/compare.
3. Frontend implements mock-first admin UX slice in parallel, then actual API
   mode after Backend runtime/seed is available.
4. QA runs Gate 0 no-secret scan, backend/frontend validations, actual MVP5
   smoke, and MVP1~MVP4 regression guard.

## PM Agent Order

Role: PM / Wave24 Scope Guard

Write report:

- `docs/handoffs/wave-024/PM_REPORT.md`

Primary backlog:

- `PM5-001`~`PM5-010` scope guard
- `INT5-001`~`INT5-010` acceptance guard

Tasks:

- Confirm Wave24 implementation is limited to the first thin slice:
  - organization/project admin summary;
  - role assignments and permission check allow/deny/read-only;
  - service account/API key create with one-time raw field contract, masked
    list/detail, revoke;
  - automatic approval policy dry-run and enforce-preview gates;
  - operations/DLQ/cost/observability summary;
  - retention deletion dry-run and backup restore dry-run;
  - audit/security event summaries;
  - optional JSON import/export only if Backend/Frontend can keep it thin.
- Reconfirm P1 exclusions:
  - production SSO/OIDC;
  - vault/KMS or production secret rotation;
  - full ABAC expression language;
  - full RDF/Turtle/OWL/SHACL fidelity;
  - full SPARQL/Cypher console;
  - distributed observability/HA/DR;
  - external write APIs;
  - ungated autonomous publish.
- Confirm Gate 0 raw-secret-looking example cleanup is mandatory before
  runtime/fixture/smoke artifacts.
- If Backend or Frontend proposes a narrower slice, approve the narrower
  implementation if it still supports a coherent admin/operator smoke.
- Do not edit runtime code.

Validation:

- `git diff --check` for changed PM/report files.

## Backend Agent Order

Role: Backend / MVP5 Thin Runtime

Start condition:

- Read `docs/handoffs/wave-024/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-024/BACKEND_REPORT.md`

Primary backlog:

- `BE5-001` admin/org/project API runtime
- `BE5-002` RBAC/permission check runtime
- `BE5-003` API key/service account runtime
- `BE5-004` automatic approval dry-run/enforce-preview runtime
- `BE5-006` operations/DLQ/cost runtime
- `BE5-007` retention/backup dry-run runtime
- `BE5-008` audit/security event runtime
- `BE5-009` deterministic seed/smoke helper
- `BE5-010` actual OpenAPI export/compare

Tasks:

- Perform Gate 0 cleanup in `docs/api/MVP5_API_CONTRACT_DRAFT.md` and
  `docs/api/openapi-mvp5-draft.json` before creating seed/runtime artifacts.
- Add a deterministic MVP5 seed helper, preferably
  `apps/backend/scripts/seed_mvp5.py`.
- Implement only the accepted narrow admin/operator runtime slice.
- Suggested module boundary:
  - `apps/backend/app/modules/mvp5/`
  - `router.py`, `schemas.py`, `service.py`, optional `seed_data.py`
  - keep implementation deterministic and in-memory/DB-light if that matches
    existing MVP3/MVP4 seed patterns.
- Required runtime surfaces:
  - admin organization/project summary;
  - role assignments list and permission check;
  - service account/API key create, masked list/detail, revoke;
  - automatic approval policy list/detail/evaluate/diff/enforce-preview;
  - operations dashboard, job detail/retry eligibility, DLQ retry/ack
    eligibility, cost budget, structured events, observability availability;
  - retention policy, deletion dry-run, backup snapshots, restore dry-run;
  - audit/security event list.
- Credential safety:
  - create response may contain `raw_secret`, but tests must not print the
    value;
  - list/detail/audit/events must never return `raw_secret`;
  - masked values only after create;
  - include tests that scan serialized list/detail/audit/event responses for
    absence of raw secret field/value.
- Preserve existing MVP1~MVP4 endpoints and tests.
- Export actual OpenAPI after implementation and compare MVP5 critical paths,
  schemas, and enums against the draft or document approved deviations.

Validation:

- Backend focused tests for MVP5, for example:
  - `pytest tests/test_mvp5_api.py -q`
- Regression:
  - `pytest tests/test_mvp4_api.py -q`
  - `pytest tests/test_mvp3_api.py -q`
  - selected MVP1/MVP2 tests if available and cheap
- Lint:
  - `ruff check app tests scripts`
- Seed:
  - fresh SQLite Alembic + `scripts/seed_mvp5.py --output /tmp/ontology-wave24-mvp5-seed.json`
  - `python3 -m json.tool /tmp/ontology-wave24-mvp5-seed.json`
- OpenAPI:
  - actual export and JSON parse;
  - critical compare against accepted MVP5 draft.
- No-secret scan:
  - scan seed output, test artifacts, OpenAPI examples, and handoff report for
    raw-secret-looking literals without printing them.
- `git diff --check` for changed backend/API/report files.

## Frontend Agent Order

Role: Frontend / MVP5 Admin Thin UI

Start condition:

- Read `docs/handoffs/wave-024/PM_REPORT.md`.
- Read Backend report if available for actual API details; otherwise implement
  mock-first using Wave23 contract and leave actual API as pending.

Write report:

- `docs/handoffs/wave-024/FRONTEND_REPORT.md`

Primary backlog:

- `FE5-001` admin shell IA
- `FE5-002` role/permission management UX
- `FE5-003` API key/service account UX
- `FE5-004` automatic approval policy UX
- `FE5-006` operations dashboard UX
- `FE5-007` retention/backup governance UX
- `FE5-008` frontend API/DTO field sync

Tasks:

- Implement mock-first MVP5 admin routes without broad redesign:
  - `/admin`
  - `/admin/projects`
  - `/projects/:projectId/admin`
  - `/projects/:projectId/admin/roles`
  - `/projects/:projectId/admin/credentials`
  - `/projects/:projectId/admin/policies/approval`
  - `/projects/:projectId/admin/operations`
  - `/projects/:projectId/admin/retention-backup`
- Keep global LNB clean:
  - add only stable `Admin` top-level entry;
  - project admin detail routes are contextual, not flat LNB entries.
- Add shared MVP5 API types, mock fixtures, client/queries consistent with
  Backend actual/draft names.
- Add visible safety markers and test ids from
  `docs/pm/MVP5_FRONTEND_UX_REQUIREMENTS.md`.
- Required visible states:
  - organization/project context;
  - permission denied and read-only;
  - one-time secret reveal UI that does not persist or reprint secret values;
  - masked credential list/detail;
  - revoke confirmation;
  - dry-run vs enforce-preview distinction;
  - blocked automatic approval reasons;
  - operations job/DLQ/cost/observability states;
  - retention deletion dry-run and backup restore dry-run;
  - audit links.
- Add smoke script or extend existing smoke tooling:
  - `npm run smoke:mvp5:mock`
  - `npm run smoke:mvp5:actual` if Backend runtime is available.
- No raw secret literal may appear in mocks, screenshots, smoke artifacts,
  console output, local storage, session storage, or report text.

Validation:

- `npm run test`
- `npm run build`
- `npm run smoke:mvp5:mock`
- If Backend runtime exists:
  - seed Backend;
  - run frontend actual API mode;
  - `npm run smoke:mvp5:actual`
- Existing regression smokes where cheap:
  - `npm run smoke:mvp4:mock`
  - `npm run smoke:mvp4:actual` if backend runtime available
  - `npm run smoke:mvp3:actual` if backend runtime available
- No-secret scan for frontend fixtures/artifacts/reports.
- `git diff --check` for changed frontend/report files.

## QA Agent Order

Role: Integration / QA

Start condition:

- Read Wave24 PM, Backend, and Frontend reports first.

Write report:

- `docs/handoffs/wave-024/QA_REPORT.md`

Primary backlog:

- `INT5-001`~`INT5-010`
- MVP1~MVP4 regression guard

Tasks:

- Verify Gate 0 cleanup:
  - `docs/api/MVP5_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp5-draft.json`
  - seed outputs;
  - frontend fixtures;
  - smoke artifacts;
  - reports.
- Do not print raw secret values. If found, report location and classification
  only.
- Parse actual OpenAPI and compare MVP5 critical paths/schemas/enums.
- Run backend focused tests, seed, lint, and regressions.
- Run frontend tests/build/mock smoke and actual smoke if runnable.
- Run MVP1~MVP4 regression guard commands that remain supported in the repo.
- Reclassify `INT5-001`~`INT5-010`.
- Recommend:
  - Wave25 MVP5 expansion if thin slice passes;
  - Wave25 targeted hardening if any P0 safety/contract/runtime issue remains.

Validation:

- `python3 -m json.tool` for seed/OpenAPI/smoke artifacts.
- no-secret scan.
- `git diff --check` for changed QA/report files.

## Commander Notes

- This wave should produce a usable first MVP5 admin/operator slice, not the
  full enterprise roadmap.
- Gate 0 is non-negotiable. A raw secret value appearing in fixtures, logs,
  screenshots, smoke artifacts, reports, list/detail API, audit text, or
  frontend persistence is a P0 FAIL.
- If actual API smoke is blocked by timing between Backend and Frontend, QA may
  mark the exact surface PARTIAL and recommend targeted hardening, but should
  not broaden scope.
