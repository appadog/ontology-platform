# Next Orders - Wave 45

Status: `MVP6.7 IMPACT SIMULATION — CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-01

Next MVP6 theme (user-directed sequence): **Impact Simulation** — before applying
an ontology change, simulate/analyze its impact on the current graph. READ-ONLY
analysis, no mutation. Builds on MVP6.6 (governance change requests) + the
candidate/published graph + MVP4 quality/validation surfaces.

Wave45 is **contract-first planning only** (no runtime/UI/test/seed code). Runtime
waits for Wave46. Mirrors the planning-wave pattern (Wave14/19/23/30/33/39/41/43).

## Theme Scope (PM freezes the smallest coherent P0)
Target P0: a read-only impact report for a change set. Suggested minimal flow (PM
to confirm/trim):

```text
select an ontology change request (APPROVED/QUEUED or DRAFT) OR a hypothetical change set
-> run impact simulation (read-only)
-> view impact report: affected ontology elements, dependent candidate entities/relations,
   dependent published elements, validations/quality checks that would be affected,
   and a severity/summary rollup
-> (no apply, no publish, no mutation — this is analysis that informs the human before Wave44 apply)
```

## Non-negotiable boundary (this becomes ADR 0014)
- Impact simulation is PURE READ/ANALYSIS. It mutates NOTHING — not the ontology
  (draft or published), candidates, prompts, extraction, evaluation, governance
  state, or the published graph. Every response carries an all-false mutation
  guard (mirror the MVP6.2/6.3 read-only pattern).
- It reads existing surfaces only (ontology versions, candidate graph, published
  graph, MVP4 validation/quality, governance change requests). No real LLM.
- It does NOT auto-apply, auto-publish, or gate/enforce anything — it is advisory
  input a human uses before the separate MVP6.6 apply / MVP3 publish steps.
- Deterministic. Additive; do not break MVP1-MVP6.6 surfaces/smokes; reuse
  existing shapes by reference (no renames).

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md` (impact-analysis
  theme) + `docs/backlog/MVP6_DRAFT_BACKLOG.md`.
- Study the surfaces you read: MVP6.6 governance change requests
  (`apps/backend/app/modules/governance/`, `docs/api/openapi-mvp6-6-draft.json`);
  the candidate + published graph + MVP4 quality/validation modules under
  `apps/backend/app/modules/` and `docs/api/openapi-mvp4-draft.json`.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-045/{ROLE}_REPORT.md`.

## Execution Sequence
1. PM freezes the smallest coherent impact-simulation P0 + brief + ADR 0014
   (read-only/no-mutation analysis).
2. Backend drafts an additive API contract + OpenAPI planning artifact.
3. Frontend reviews fields/states/IA (where the impact report appears — likely
   contextual to the Governance change-request detail and/or the ontology
   modeler) — planning only.
4. QA writes an executable acceptance checklist and recommends Wave46.

## PM Agent Order
Role: PM / Architect — MVP6.7 Impact Simulation P0 Freeze
Write report: `docs/handoffs/wave-045/PM_REPORT.md`
Backlog ID: `PM6-027`
Tasks:
- Freeze the smallest coherent P0: the simulation input (a governance change
  request id, and/or a hypothetical change set of target_kind x change_type +
  element ref), the impact dimensions to report (affected ontology elements;
  dependent candidate entities/relations; dependent published elements;
  affected validations/quality checks; a severity/summary rollup), the severity
  taxonomy/enums, and the read-only/no-mutation boundary + all-false guard.
- Decide where the report is consumed (recommend: contextual to the Governance
  change-request detail as an "impact" panel, reusing ADR 0010 IA — no new global
  LNB item).
- Write `docs/pm/MVP6_7_IMPACT_SIMULATION_BRIEF.md`; add `docs/adr/0014-...md`;
  update `docs/backlog/MVP6_DRAFT_BACKLOG.md` with PM/BE/FE/INT IDs (continue
  numbering; INT6 used through INT6-058, so QA IDs start INT6-059).
- Confirm durable invariants preserved.
Validation: `git diff --check`. Do NOT touch apps/.

## Backend Agent Order
Role: Backend — Impact Simulation Contract Draft (planning only)
Start condition: read `docs/handoffs/wave-045/PM_REPORT.md`.
Write report: `docs/handoffs/wave-045/BACKEND_REPORT.md`
Tasks:
- Draft additive endpoint(s) + DTO/enum names in
  `docs/api/MVP6_7_IMPACT_SIMULATION_API_CONTRACT_DRAFT.md` (e.g. run/read an
  impact report for a change request or a posted hypothetical change set),
  reusing governance + candidate/published graph + MVP4 quality shapes by
  reference (no renames). All-false mutation guard on every response.
- Produce `docs/api/openapi-mvp6-7-draft.json` (OpenAPI 3.1.0, additive to
  MVP1-MVP6.6, e.g. version `0.6.7-draft`). No runtime code. Capture open
  questions.
Validation: OpenAPI JSON parse; `git diff --check`.

## Frontend Agent Order
Role: Frontend — Impact Simulation UX/API Requirements (planning only)
Start condition: read PM report + Backend draft if ready.
Write report: `docs/handoffs/wave-045/FRONTEND_REPORT.md`
Tasks:
- Document, in `docs/pm/MVP6_7_FRONTEND_UX_REQUIREMENTS.md`: where the impact
  report appears (contextual impact panel on the Governance change-request
  detail; no new global LNB item per ADR 0010), the report layout (affected
  elements, dependents, affected validations, severity rollup), first-class
  loading/empty/error/permission states, and copy that makes clear this is
  read-only analysis (no apply/publish/enforcement). Apply the closed design
  language (Section+Card, KO titles, D6 badges for severity). DTO gap analysis
  vs the Backend draft. No route/component/type/mock/smoke code.
Validation: `git diff --check`.

## QA Agent Order
Role: Integration / QA — Impact Simulation Acceptance Checklist
Start condition: read Wave45 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-045/QA_REPORT.md`
Tasks:
- Create `docs/backlog/INT6_7_IMPACT_SIMULATION_ACCEPTANCE.md` (C planning + R
  NOT-RUNNABLE runtime gates), continuing INT6 numbering (INT6-059+).
- Verify PM/BE/FE agree on the P0, impact dimensions/enums, the read-only/
  no-mutation boundary, exclusions. Confirm no runtime leaked (apps/ + infra/).
  OpenAPI parse.
- Recommend Wave46 thin implementation, hardening, or redesign.
Validation: OpenAPI parse; runtime-leakage search; `git diff --check`.
