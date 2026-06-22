# Next Orders - Wave 27

Status: `RELEASE / DEMO PACKAGING`
Date: 2026-06-19

Wave26 QA verified that MVP5 P0 remains closed after low-risk cleanup and
recommended release/demo packaging. Wave27 should make the local demo
reproducible and explainable without reopening MVP scope.

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read Wave26 reports:
  - `docs/handoffs/wave-026/PM_REPORT.md`
  - `docs/handoffs/wave-026/BACKEND_REPORT.md`
  - `docs/handoffs/wave-026/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-026/QA_REPORT.md`
- Use `docs/handoffs/REPORT_TEMPLATE.md`.
- Finish by writing your role report in `docs/handoffs/wave-027/{ROLE}_REPORT.md`.

## Guardrails

- No new MVP product scope.
- No API/DTO/enum changes unless explicitly required to fix packaging commands.
- Preserve MVP5 P0 behavior and no-secret invariants.
- Keep import dry-run only. Do not add import apply/overwrite/publish.
- Docker/PostgreSQL Compose smoke remains P1 unless PM explicitly promotes it;
  current packaging can document the environment exception.

## Execution Sequence

1. PM creates the release/demo packaging checklist and demo script.
2. Backend and Frontend make only packaging/readme/script polish needed to run
   the demo reliably.
3. QA validates that a fresh local operator can follow the packaging docs and
   that MVP5 closeout evidence remains green.

## PM Agent Order

Role: PM / Release-Demo Packaging

Write report:

- `docs/handoffs/wave-027/PM_REPORT.md`

Tasks:

- Create or update release/demo documentation for MVP1-MVP5 local demo.
- Include:
  - demo narrative from project creation through MVP5 admin/import-export;
  - exact local setup and run commands;
  - seed commands and artifact locations;
  - backend/frontend ports and CORS note for `5173`;
  - smoke command matrix;
  - no-secret safety checklist;
  - accepted P1/P2 exclusions and environment exceptions;
  - rollback/recovery notes if a smoke fails.
- Recommend whether Backend/Frontend need packaging command changes or
  README-only updates.
- Do not edit runtime code.

Validation:

- `git diff --check` for changed docs/report files.

## Backend Agent Order

Role: Backend / Packaging Support

Start condition:

- Read `docs/handoffs/wave-027/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-027/BACKEND_REPORT.md`

Tasks:

- Execute only PM-approved packaging support.
- Candidate scope:
  - README command cleanup;
  - seed/export command documentation;
  - optional small script wrapper if it only composes existing commands and does
    not alter runtime behavior;
  - no-secret scan command documentation.
- Do not change API behavior.

Validation:

- Run backend tests relevant to changed files.
- If commands/scripts change, run them.
- `ruff check` if Python code changes.
- `git diff --check`.

## Frontend Agent Order

Role: Frontend / Demo Packaging Support

Start condition:

- Read `docs/handoffs/wave-027/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-027/FRONTEND_REPORT.md`

Tasks:

- Execute only PM-approved packaging support.
- Candidate scope:
  - README/local demo command cleanup;
  - smoke command documentation;
  - ensure package scripts are named and described clearly;
  - optional minor demo affordance if PM requires it and it does not change
    behavior or route structure.
- Do not change API behavior, route paths, global LNB, smoke marker IDs, or
  import dry-run-only boundary.

Validation:

- `npm run test`
- `npm run build`
- relevant smoke commands if frontend files/scripts/docs change.
- `git diff --check`.

## QA Agent Order

Role: Integration / QA

Start condition:

- Read Wave27 PM, Backend, and Frontend reports first.

Write report:

- `docs/handoffs/wave-027/QA_REPORT.md`

Tasks:

- Validate the release/demo packaging docs and command matrix.
- Run the minimum packaging smoke set recommended by PM.
- Confirm no-secret scan guidance remains intact.
- Confirm MVP5 P0 remains closed.
- Recommend one of:
  - ready for demo/release handoff;
  - Wave28 targeted packaging fix;
  - Wave28 broader refactor/tooling track.

Validation:

- Include exact commands and artifacts.
- `git diff --check` for QA report.

