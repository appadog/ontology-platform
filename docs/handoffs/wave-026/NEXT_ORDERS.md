# Next Orders - Wave 26

Status: `POST-MVP5 USABILITY / CODE SPLIT / REFACTOR REVIEW`
Date: 2026-06-19

Wave25 QA recommends MVP5 P0 closeout. Wave26 begins the post-closeout quality
track requested by the commander: usability improvement, code splitting,
refactoring review, and safe follow-up execution.

This wave must start with review and prioritization. Do not launch broad
refactors before PM/Architecture defines risk, ownership, and verification.

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read Wave25 reports:
  - `docs/handoffs/wave-025/PM_REPORT.md`
  - `docs/handoffs/wave-025/BACKEND_REPORT.md`
  - `docs/handoffs/wave-025/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-025/QA_REPORT.md`
- Use `docs/handoffs/REPORT_TEMPLATE.md`.
- Finish by writing your role report in `docs/handoffs/wave-026/{ROLE}_REPORT.md`.

## Post-Closeout Guardrails

- MVP5 P0 behavior must remain stable.
- Do not change API/DTO/enum contracts unless PM explicitly approves a small
  compatibility-preserving cleanup.
- Preserve no-secret invariants. Any wave touching credentials, screenshots,
  smoke artifacts, reports, or fixtures must run a no-secret scan.
- Docker/PostgreSQL Compose smoke, broader Playwright formalization,
  production SSO/OIDC, vault/KMS, secret rotation, full ABAC, RDF/OWL/SHACL
  fidelity, distributed HA/DR, and external write APIs remain P1/P2 unless PM
  promotes them.
- Prefer small, reversible, verified improvements over broad rewrites.

## Execution Sequence

1. PM/Architecture reviews the product and codebase and creates a prioritized
   post-MVP5 improvement plan.
2. Backend and Frontend may execute only the highest-value low-risk items from
   that plan in disjoint ownership areas.
3. QA verifies that MVP1-MVP5 smoke/regression evidence remains green and that
   usability/refactor changes did not create new acceptance gaps.

## PM Agent Order

Role: PM / Architecture / UX Review

Write report:

- `docs/handoffs/wave-026/PM_REPORT.md`

Primary scope:

- Post-MVP5 usability review
- Code split/refactor risk review
- Verification strategy

Tasks:

- Review Wave25 QA closeout and formally accept MVP5 P0 closeout in the PM
  report.
- Produce a prioritized improvement plan with three tiers:
  - P0 safe cleanup: very low risk, improves maintainability/usability now.
  - P1 product polish: useful but should not destabilize closeout.
  - P2 larger refactor: needs a dedicated future wave.
- Usability review targets:
  - Admin/import-export discoverability and task flow.
  - Cross-MVP navigation consistency from project context.
  - Dense admin pages on mobile/tablet.
  - Copy consistency for dry-run, confirmation, audit, read-only, and no-secret
    states.
  - Empty/loading/error states after all MVP5 additions.
- Code split/refactor review targets:
  - Frontend `AdminPages.tsx`, `shared/api/client.ts`, `types.ts`, and MVP5
    fixtures/scripts size and ownership.
  - Backend MVP5 `schemas.py`, `service.py`, `router.py`, tests, and seed helper
    size and ownership.
  - Duplication between MVP3/MVP4/MVP5 smoke scripts and API normalizers.
  - Opportunities to split by feature without changing behavior.
- Recommend exact Wave26 execution scope for Backend and Frontend.
  - Prefer low-risk code splitting and smoke script cleanup if the codebase has
    obvious hotspots.
  - If implementation risk is too high, recommend documentation-only review and
    open Wave27 targeted refactor instead.
- Do not edit runtime code.

Validation:

- `git diff --check` for changed PM/report files.

## Backend Agent Order

Role: Backend / Low-Risk Refactor or Review

Start condition:

- Read `docs/handoffs/wave-026/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-026/BACKEND_REPORT.md`

Tasks:

- Execute only PM-approved backend scope.
- Candidate low-risk scopes:
  - split MVP5 seed/test helper fixtures out of large service/test files;
  - extract import/export helper functions without changing API behavior;
  - improve README smoke command clarity;
  - add no-secret scan helper documentation;
  - expand tests only if risk is low.
- Do not alter public API response shapes unless PM explicitly approves.
- Preserve all MVP5 no-secret and dry-run-only boundaries.

Validation:

- `cd apps/backend && .venv/bin/pytest tests/test_mvp5_api.py -q`
- `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
- `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
- `cd apps/backend && .venv/bin/pytest tests/test_project_ontology_api.py -q`
- `cd apps/backend && .venv/bin/ruff check app tests scripts`
- OpenAPI export/parse if API files or router/schema files change.
- no-secret scan if MVP5 artifacts/fixtures/reports change.
- `git diff --check` for changed backend/report files.

## Frontend Agent Order

Role: Frontend / Usability and Low-Risk Code Split

Start condition:

- Read `docs/handoffs/wave-026/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-026/FRONTEND_REPORT.md`

Tasks:

- Execute only PM-approved frontend scope.
- Candidate low-risk scopes:
  - split `AdminPages.tsx` into focused admin page modules;
  - split MVP5 client/types/fixtures into focused admin/import-export modules
    only if build/test risk is manageable;
  - improve import/export admin page usability without changing API behavior;
  - tighten mobile layout, table overflow, and scan order for admin pages;
  - reduce duplicated smoke assertions while preserving coverage.
- Keep global LNB stable and contextual project admin routes intact.
- Do not remove existing smoke markers without updating tests/scripts.
- Do not add import apply/overwrite/publish UI.

Validation:

- `cd apps/frontend && npm run test`
- `cd apps/frontend && npm run build`
- `cd apps/frontend && npm run smoke:mvp5:mock`
- `cd apps/frontend && npm run smoke:mvp5:actual` if backend runtime is
  available or can be started.
- Run MVP3/MVP4 actual smokes where practical if admin shell/shared client
  changes are made.
- no-secret scan if MVP5 fixtures/scripts/reports change.
- `git diff --check` for changed frontend/report files.

## QA Agent Order

Role: Integration / QA

Start condition:

- Read Wave26 PM, Backend, and Frontend reports first.

Write report:

- `docs/handoffs/wave-026/QA_REPORT.md`

Tasks:

- Verify MVP5 P0 remains closed after Wave26 changes.
- Re-run targeted regression based on changed files:
  - backend tests if backend changed;
  - frontend tests/build/smokes if frontend changed;
  - no-secret scan if MVP5/credential/smoke/report surfaces changed.
- Check usability outcomes against PM report.
- Classify whether the codebase is ready for:
  - Wave27 targeted implementation;
  - further refactor review;
  - release/demo packaging.

Validation:

- Include exact commands and artifact paths.
- `git diff --check` for `docs/handoffs/wave-026/QA_REPORT.md`.

