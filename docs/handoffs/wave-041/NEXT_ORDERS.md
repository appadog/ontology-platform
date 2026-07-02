# Next Orders - Wave 41

Status: `MVP6.5 GOVERNANCE WORKFLOW — CONTRACT-FIRST PLANNING ONLY`
Date: 2026-06-30

By user direction, the next MVP6 theme is **Governance workflow** (ontology
change request -> review -> approval -> audit). Closed MVP6 themes: 6.1/6.2/6.3/
6.4. This theme builds on the existing MVP3 review/publish/audit surface and the
MVP5 admin/governance control plane.

Wave41 is **contract-first planning only**. No runtime API route, FastAPI
service, DB model, Alembic migration, frontend route/component, seed, smoke, or
test implementation this wave. Runtime waits for a Wave42 thin-implementation
order after PM freeze + Backend contract draft + Frontend field/state/IA review +
QA executable checklist. Mirrors the proven planning-wave pattern
(Wave14/19/23/30/33/39).

## Common Rules
- Read `AGENTS.md` first; `.agents/skills/handoff-reporting/SKILL.md`;
  `docs/handoffs/CURRENT_STATE.md`; this file.
- Read the MVP6 roadmap: `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`
  (governance/change-management theme).
- Read `docs/backlog/MVP6_DRAFT_BACKLOG.md`.
- Study the surfaces you build on so the design is grounded and additive:
  MVP3 review/correction/publish/audit (ADR 0006, `docs/api/openapi-mvp3-draft.json`,
  the review/publish modules under `apps/backend/app/modules/`), MVP5
  admin/governance + RBAC/audit (ADR 0008, `docs/api/openapi-mvp5-draft.json`),
  and MVP6.4 gold-set authoring audit/mutation-guard pattern (ADR 0011) as the
  audit-only precedent to mirror.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-041/{ROLE}_REPORT.md`.

## Theme Scope (PM freezes the smallest coherent P0)
Target P0: an auditable **ontology change-request lifecycle**. Suggested minimal
flow (PM to confirm/trim):

```text
propose ontology change request (add/modify/deprecate class/property/relation)
-> reviewer review (comment / request changes)
-> approve or reject (with reason)
-> audit trail of the decision
-> (approved requests are QUEUED as intent only; they do NOT auto-mutate the
   published graph or the ontology — application goes through the existing
   ontology-edit / publish path in a later slice)
```

## Durable Product Invariants (apply)
- A change request is a PROPOSAL in the candidate/analysis layer. Approval records
  intent + audit; it must NOT autonomously mutate the published graph, the
  ontology, candidates, or prompts. No autonomous publish, no automatic
  enforcement. (Mirror the MVP6.2/6.4 all-false mutation-guard pattern.)
- Candidate/published separation, evidence/version/model-run/audit traceability
  preserved. Every decision is audited (actor, action, reason, timestamp,
  target ontology element + version context).
- No real LLM execution in P0. Additive only — do not break MVP1-MVP6.4 surfaces
  or smokes. Reuse existing review-decision / audit / RBAC shapes by reference;
  no renames.

## Execution Sequence
1. PM freezes the smallest coherent governance P0 (change-request lifecycle),
   writes the brief, updates the backlog split, defines exclusions, adds an ADR
   (next number after 0011) for the durable boundary (approval != auto-apply).
2. Backend drafts an additive API contract + OpenAPI planning artifact (no
   runtime code).
3. Frontend reviews required fields/states/IA and documents UX requirements
   (no route/component code), applying the closed design language.
4. QA writes an executable acceptance checklist (continue `INT6-*`, use the next
   free range) and recommends Wave42 thin implementation, hardening, or redesign.

## PM Agent Order
Role: PM / Architect — MVP6.5 Governance P0 Freeze
Write report: `docs/handoffs/wave-041/PM_REPORT.md`
Backlog ID: `PM6-023` (governance P0 freeze)

Tasks:
- Freeze the smallest coherent governance P0 (ontology change-request lifecycle).
  Define: the P0 demo flow, change-request target kinds (class/property/relation
  add/modify/deprecate), request states + decision commands + reason rules,
  reviewer/approver roles (reuse MVP3 review-decision + MVP5 RBAC vocabulary; no
  renames), and the audit content.
- CRITICAL boundary decision: approval records intent + audit only; it does NOT
  auto-apply to the ontology or published graph in P0. State exactly what
  "approved" means and what is explicitly deferred (application/enforcement).
- Write `docs/pm/MVP6_5_GOVERNANCE_BRIEF.md`; update
  `docs/backlog/MVP6_DRAFT_BACKLOG.md` with PM/BE/FE/INT backlog IDs (continue
  numbering; note the INT6 range already used through INT6-042).
- Add an ADR (next number after 0011) for the approval-!=-auto-apply boundary.
- Confirm durable invariants preserved.

Validation: `git diff --check`. Do NOT touch apps/.

## Backend Agent Order
Role: Backend — Governance Contract Draft (planning only)
Start condition: read `docs/handoffs/wave-041/PM_REPORT.md`.
Write report: `docs/handoffs/wave-041/BACKEND_REPORT.md`

Tasks:
- Draft additive endpoint families + DTO/enum names for the frozen P0 in
  `docs/api/MVP6_5_GOVERNANCE_API_CONTRACT_DRAFT.md`, reusing MVP3 review-decision
  / audit and MVP5 RBAC shapes by reference (no renames). Include an all-false
  governance mutation-guard mirroring the MVP6.2/6.4 pattern.
- Produce `docs/api/openapi-mvp6-5-draft.json` — parses as OpenAPI 3.1.0,
  additive to MVP1-MVP6.4 paths, draft version label (e.g. 0.6.5-draft).
- No runtime code/models/migrations/tests. Capture open questions.

Validation: OpenAPI JSON parse; `git diff --check`.

## Frontend Agent Order
Role: Frontend — Governance UX/API Requirements (planning only)
Start condition: read `docs/handoffs/wave-041/PM_REPORT.md` + Backend draft if ready.
Write report: `docs/handoffs/wave-041/FRONTEND_REPORT.md`

Tasks:
- Document route/IA placement (project-scoped; per ADR 0010 no ID-bound pages in
  the global LNB — likely a Governance area under the Review group), required
  fields, first-class loading/empty/error/permission-limited states, the
  reviewer/approver permission-boundary UX, and any DTO gaps vs the Backend draft.
  Apply the closed design language (Section+Card, KO titles, D6 badges, one
  primary action). Make clear approval != auto-apply.
- No route/component/type/mock/smoke code this wave.

Validation: `git diff --check`.

## QA Agent Order
Role: Integration / QA — Governance Acceptance Checklist
Start condition: read Wave41 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-041/QA_REPORT.md`

Tasks:
- Create an executable acceptance checklist (continue `INT6-*` from the next free
  number, i.e. INT6-043+) in a backlog doc.
- Verify PM/Backend/Frontend planning artifacts agree on P0 flow, states/enums,
  the approval-!=-auto-apply boundary, safety, and exclusions.
- Confirm no runtime implementation leaked into Wave41 (search apps/ + infra/).
- Recommend Wave42 thin implementation, targeted hardening, or PM redesign.

Validation: OpenAPI parse if applicable; runtime-leakage search; `git diff --check`.
