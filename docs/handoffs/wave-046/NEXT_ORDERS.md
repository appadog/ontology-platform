# Next Orders - Wave 46

Status: `MVP6.7 IMPACT SIMULATION THIN IMPLEMENTATION`
Date: 2026-07-03

Wave45 closed MVP6.7 contract-first planning as PASS. Wave46 implements the
smallest deterministic runtime/UI slice of the frozen read-only impact report.

```text
open a governance change request
-> GET impact-simulation (read-only) -> ImpactSimulationReport
-> view the "영향도(Impact)" panel: affected ontology elements (direct + bounded transitive),
   dependent candidate + published elements (count + capped refs + truncated),
   affected validations/quality, severity rollup (ImpactSeverity)
-> (no apply, no publish, no mutation — advisory only)
```

Sequence: PM (freeze G1-G3 FIRST) -> Backend ∥ Frontend -> QA.

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read Wave45 artifacts: `docs/handoffs/wave-045/{PM,BACKEND,FRONTEND,QA}_REPORT.md`,
  `docs/pm/MVP6_7_IMPACT_SIMULATION_BRIEF.md`, `docs/adr/0014-...md`,
  `docs/api/MVP6_7_IMPACT_SIMULATION_API_CONTRACT_DRAFT.md`,
  `docs/api/openapi-mvp6-7-draft.json`,
  `docs/pm/MVP6_7_FRONTEND_UX_REQUIREMENTS.md`,
  `docs/backlog/INT6_7_IMPACT_SIMULATION_ACCEPTANCE.md` (C1-C10, R1-R7, gates G1-G3).
- Extend the MVP6.6 governance module + the FE Governance detail page. READ existing
  candidate/published/validation/quality surfaces by reference; NO renames. Apply
  the closed design language.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-046/{ROLE}_REPORT.md`.

## Scope Guard (ADR 0014 — read-only)
- Impact simulation mutates NOTHING (ontology draft/published, candidates, prompts,
  extraction, evaluation, governance state). Every response carries an all-false
  `ImpactSimulationMutationGuard` (no flag ever true). Idempotent read (GET).
- Advisory only: never apply/publish/enforce; never flip governance status/
  application_state; never set SUPERSEDED.
- Deterministic; bounding = transitive depth 2 + per-dimension ref caps + `truncated`
  + exact `count`. Reuse existing shapes by reference. No real LLM. Additive; no
  break of MVP1-MVP6.6 surfaces/smokes.

## PM Agent Order
Role: PM / MVP6.7 Implementation Scope Guard + Gate Freeze
Write report: `docs/handoffs/wave-046/PM_REPORT.md`
Backlog ID: `PM6-028`
Tasks: freeze G1 (dependency-graph source for the transitive walk — recommend
BOTH candidate + published dependents, clearly labeled by layer), G2 (exact
per-dimension ref-cap sizes — recommend a single small cap e.g. 20 with `truncated`
+ exact `count`), G3 (severity edge cases — state the deterministic rule for
MODIFY/DEPRECATE with only-candidate vs published dependents, ADD with none, etc.,
consistent with the frozen ImpactSeverity computation). State each as one precise
rule. Confirm scope unchanged (read-only, all-false guard). Update
`docs/backlog/MVP6_DRAFT_BACKLOG.md` if IDs (BE6-056+, FE6-077+, INT6-063+) need
recording. Validation: `git diff --check`; no apps/.

## Backend Agent Order
Role: Backend / MVP6.7 Runtime Thin Slice
Start condition: read `docs/handoffs/wave-046/PM_REPORT.md` (frozen G1-G3).
Write report: `docs/handoffs/wave-046/BACKEND_REPORT.md`
Backlog IDs: `BE6-056` impact-simulation endpoint + report assembly, `BE6-057`
dependency walk (bounded depth 2, both layers) + severity computation, `BE6-058`
bounding/truncation + all-false guard, `BE6-059` OpenAPI export/alignment +
no-mutation regression guard.
Tasks: implement `GET /api/v1/ontology-change-requests/{id}/impact-simulation` in
the governance module matching `openapi-mvp6-7-draft.json` EXACTLY; assemble the
`ImpactSimulationReport` (5 dimensions) by READING existing candidate/published/
validation/quality data (reuse by reference); compute `ImpactSeverity`
deterministically per the frozen rules + G3; apply bounding (depth 2, ref caps,
`truncated`+`count`); every response carries the all-false
`ImpactSimulationMutationGuard`. Read authz = viewer of the request. Focused tests
(`tests/test_mvp6_7_impact_simulation_api.py`): report shape + 5 dimensions;
deterministic severity across cases; bounding/truncation; DATA-LEVEL no-mutation
(all surface tables before==after the GET); all-false guard; read authz; OpenAPI
alignment.
Validation: `cd apps/backend && .venv/bin/pytest tests/test_mvp6_7_impact_simulation_api.py -q`
and `tests/test_mvp6_6_governance_application_api.py -q`; `ruff check app tests scripts`;
OpenAPI compare; `git diff --check`.

## Frontend Agent Order
Role: Frontend / MVP6.7 Impact panel (in the Governance detail)
Start condition: read `docs/handoffs/wave-046/PM_REPORT.md`; coordinate with the
Backend report if contracts shift.
Write report: `docs/handoffs/wave-046/FRONTEND_REPORT.md`
Backlog IDs: `FE6-077` types/client/mocks, `FE6-078` impact panel (5 dimensions +
severity badges + truncation), `FE6-079` states + read-only copy, `FE6-080`
mock + actual smoke.
Tasks: extend the Governance detail (no new LNB/route) with the "영향도(Impact)"
panel per `MVP6_7_FRONTEND_UX_REQUIREMENTS.md`: 5 dimensions, `ImpactSeverity` D6
badges (BREAKING/HIGH danger/warning tones), truncation UX (exact count + "showing
first N"), loading/empty(NONE)/error/permission-limited states, and read-only copy
(no apply/publish affordance). Types/client/query/mocks match the frozen OpenAPI
exactly; reuse MVP6.5/6.6 governance types by reference (no rename). Add
`npm run smoke:mvp6:impact:mock` and, if backend runnable, `:actual` (assert the
report renders + all-false guard + no mutation).
Validation: `npm run test`, `npm run build`, the new mock smoke (+ actual if
runnable), responsive 0-overflow re-check on the detail page, `git diff --check`.

## QA Agent Order
Role: Integration / QA
Start condition: read Wave46 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-046/QA_REPORT.md`
Backlog IDs: `INT6-063` backend runtime, `INT6-064` frontend mock/API, `INT6-065`
read-only no-mutation data-level guard, `INT6-066` Wave46 closeout.
Tasks: update `docs/backlog/INT6_7_IMPACT_SIMULATION_ACCEPTANCE.md` R1-R7 with
verdicts. Validate the endpoint, the 5 dimensions, deterministic severity, bounding/
truncation, read authz. INDEPENDENTLY verify at the DATA level that the GET mutates
NOTHING (all surface tables before==after; guard all-false). Validate the FE mock +
actual flow. Run MVP6.6/earlier regression + smokes touched; confirm additive-only +
candidate/published separation intact. Recommend closeout / hardening / redesign.
Exact commands; no leftover listeners on 8000/5173; `git diff --check`.
