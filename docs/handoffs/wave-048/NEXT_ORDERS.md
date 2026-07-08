# Next Orders - Wave 48

Status: `MVP6.8 COPILOT THIN IMPLEMENTATION`
Date: 2026-07-03

Wave47 closed MVP6.8 Copilot contract-first planning as PASS. Wave48 implements the
smallest deterministic ADVISORY-ONLY copilot slice.

```text
open project copilot
-> GET deterministic, source-grounded suggestions (each: kind, why, source refs, target gated flow)
-> ACCEPT (returns a CopilotRoutingTarget deep-link/pre-fill into an existing gated flow — executes NOTHING)
   or DISMISS (reason) -> decision audit note
-> (copilot mutates nothing; no real LLM; every real change still goes through the human gate)
```

Sequence: PM (freeze G1-G3 FIRST) -> Backend ∥ Frontend -> QA.

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read Wave47 artifacts: `docs/handoffs/wave-047/{PM,BACKEND,FRONTEND,QA}_REPORT.md`,
  `docs/pm/MVP6_8_COPILOT_BRIEF.md`, `docs/adr/0015-...md`,
  `docs/api/MVP6_8_COPILOT_API_CONTRACT_DRAFT.md`,
  `docs/api/openapi-mvp6-8-draft.json`,
  `docs/pm/MVP6_8_FRONTEND_UX_REQUIREMENTS.md`,
  `docs/backlog/INT6_8_COPILOT_ACCEPTANCE.md` (C1-C11, R1-R7, gates G1-G3).
- Follow the MVP6.2 learning module + the recent governance/impact module
  precedents (process-local store + reset hook). READ existing governance/
  candidate/quality/impact surfaces by reference for grounding; NO renames.
- Apply the closed design language. Use `docs/handoffs/REPORT_TEMPLATE.md`; finish
  with role reports in `docs/handoffs/wave-048/{ROLE}_REPORT.md`.

## Scope Guard (ADR 0015 — advisory-only)
- The copilot SUGGESTS and (on accept) ROUTES; it EXECUTES NOTHING. No autonomous
  action, no auto-apply/publish/approve, no policy enforcement, no direct mutation
  of ontology/candidate/published graph/prompts/governance state.
- ACCEPT returns a `CopilotRoutingTarget` (deep-link + optional pre-fill payload)
  with NO authority. Decisions are audit-only. non-SUGGESTED decision -> `409
  COPILOT_SUGGESTION_DECISION_CONFLICT`.
- Every response carries an all-false 14-flag `CopilotMutationGuard` (incl.
  `copilot_executed_action:false`, `real_model_invoked:false`). NO real LLM —
  deterministic mock; every suggestion cites non-empty source-artifact refs.
- Additive; no break of MVP1-MVP6.7 surfaces/smokes.

## PM Agent Order
Role: PM / MVP6.8 Implementation Scope Guard + Gate Freeze
Write report: `docs/handoffs/wave-048/PM_REPORT.md`
Backlog ID: `PM6-030`
Tasks: freeze G1 (deterministic suggestion-generation source rules per
`CopilotSuggestionKind` — what existing artifacts each kind derives from, and the
deterministic trigger), G2 (routing pre-fill payload shape per
`CopilotRoutingTargetKind`), G3 (copilot summary DTO fields). State each as one
precise rule. Confirm scope unchanged (advisory-only, executes nothing, no real
LLM). Update `docs/backlog/MVP6_DRAFT_BACKLOG.md` if IDs (BE6-064+, FE6-085+,
INT6-071+) need recording. Validation: `git diff --check`; no apps/.

## Backend Agent Order
Role: Backend / MVP6.8 Runtime Thin Slice
Start condition: read `docs/handoffs/wave-048/PM_REPORT.md` (frozen G1-G3).
Write report: `docs/handoffs/wave-048/BACKEND_REPORT.md`
Backlog IDs: `BE6-064` copilot summary + suggestions (deterministic, source-grounded),
`BE6-065` suggestion detail + decision (accept-returns-routing / dismiss, audit-only,
409 conflict), `BE6-066` all-false 14-flag guard + no-execution/no-LLM guarantees,
`BE6-067` OpenAPI export/alignment + no-mutation regression guard.
Tasks: implement the 4 endpoints (`copilot/summary`, `copilot/suggestions`,
`copilot-suggestions/{id}`, `.../decisions`) in a new module (e.g.
`apps/backend/app/modules/copilot/`, registered additively) matching
`openapi-mvp6-8-draft.json` EXACTLY; deterministic process-local store + reset
hook. Suggestions are deterministic + cite non-empty source refs (per G1); ACCEPT
returns a `CopilotRoutingTarget` (per G2) and creates/mutates NOTHING; DISMISS
requires reason; non-SUGGESTED -> 409. Every response carries the all-false 14-flag
`CopilotMutationGuard`. Reuse MVP6.2/governance/candidate/quality/impact shapes by
reference (no renames). Focused tests (`tests/test_mvp6_8_copilot_api.py`): summary
+ suggestion list (deterministic, grounded); detail; ACCEPT returns routing target;
DATA-LEVEL no-mutation (all surface tables + governance state before==after any
copilot call incl. ACCEPT); all-false 14-flag guard incl. `copilot_executed_action`/
`real_model_invoked` false; DISMISS reason 422; non-SUGGESTED 409; authz; OpenAPI
alignment.
Validation: `cd apps/backend && .venv/bin/pytest tests/test_mvp6_8_copilot_api.py -q`
and `tests/test_mvp6_7_impact_simulation_api.py -q`; `ruff check app tests scripts`;
OpenAPI compare; `git diff --check`.

## Frontend Agent Order
Role: Frontend / MVP6.8 Copilot surface
Start condition: read `docs/handoffs/wave-048/PM_REPORT.md`; coordinate with the
Backend report if contracts shift.
Write report: `docs/handoffs/wave-048/FRONTEND_REPORT.md`
Backlog IDs: `FE6-085` route/IA + types/client/mocks, `FE6-086` suggestion list +
detail, `FE6-087` accept-routing + dismiss + audit note + advisory/"executes
nothing" copy, `FE6-088` mock + actual smoke.
Tasks: implement the project-scoped copilot surface per
`MVP6_8_FRONTEND_UX_REQUIREMENTS.md`: suggestion list (kind/why/source grounding/
target flow), `CopilotSuggestionState` D6 badges, accept -> follows the
`CopilotRoutingTarget` deep-link into the existing gated flow (governance draft /
candidate review / quality-validation / impact) WITHOUT the copilot executing
anything, dismiss+reason, decision audit note, non-SUGGESTED conflict, and explicit
advisory/read-only copy + all-false "executes nothing / no real model" proof line;
loading/empty/error/permission-limited. Types/client/query/mocks match the frozen
OpenAPI exactly; reuse MVP6.2/governance types by reference (no rename). Add
`npm run smoke:mvp6:copilot:mock` and, if backend runnable, `:actual`.
Validation: `npm run test`, `npm run build`, the new mock smoke (+ actual if
runnable), responsive 0-overflow re-check, `git diff --check`.

## QA Agent Order
Role: Integration / QA
Start condition: read Wave48 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-048/QA_REPORT.md`
Backlog IDs: `INT6-071` backend runtime, `INT6-072` frontend mock/API, `INT6-073`
advisory-only/no-execution + all-false guard data-level, `INT6-074` Wave48 closeout.
Tasks: update `docs/backlog/INT6_8_COPILOT_ACCEPTANCE.md` R1-R7 with verdicts.
Validate the 4 endpoints, deterministic grounded suggestions, decision transitions +
409, authz. INDEPENDENTLY verify at the DATA level that NO copilot call (esp.
ACCEPT) mutates any table / governance state (before==after), the 14-flag guard is
all-false (incl. `copilot_executed_action`/`real_model_invoked`), and ACCEPT returns
only a routing target. Validate the FE mock + actual flow. Run MVP6.7/earlier
regression + smokes touched; confirm additive-only + candidate/published separation
intact. Recommend closeout / hardening / redesign. Exact commands; no leftover
listeners on 8000/5173; `git diff --check`.
