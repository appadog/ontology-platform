# Next Orders - Wave 43

Status: `MVP6.6 GOVERNANCE CHANGE APPLICATION — CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-01

Next MVP6 theme (user-directed sequence): **Governance Change Application** — the
deferred slice from ADR 0012. An APPROVED + QUEUED ontology change request can be
**explicitly applied by a human** to a DRAFT ontology version, transitioning
`GovernanceApplicationState` QUEUED -> APPLIED, with separate audit. This is the
FIRST governance slice that actually mutates ontology state, so the safety
boundary must be crisp.

Wave43 is **contract-first planning only** (no runtime/UI/test/seed code). Runtime
waits for Wave44. Mirrors the planning-wave pattern (Wave14/19/23/30/33/39/41).

## Non-negotiable boundary (this becomes ADR 0013)
- Application is **human-initiated only** (never automatic), permitted only from
  an `APPROVED` request whose `application_state == QUEUED`.
- Application writes ONLY to a **DRAFT ontology version** via the existing MVP1
  ontology-edit semantics. It must NOT write to the **published graph** — the
  published graph is changed only through the existing MVP3 publish path in a
  separate, separately-audited step. Candidates, prompts, extraction, evaluation
  are never mutated.
- Idempotent: applying an already-APPLIED request is a no-op/409, never a double
  apply.
- **Staleness/conflict**: if the target ontology changed since approval (the
  approved snapshot no longer matches the current draft target), application is
  blocked and the request goes to `SUPERSEDED` (the ADR-0012 reserved state now
  becomes real) — no silent overwrite.
- Full application audit: actor, timestamp, source change request + items, the
  resulting draft ontology version, and the before/after element refs.
- The mutation-guard concept is REDEFINED for this action: PM must specify which
  flags stay false (published_graph, candidate_graph, prompt, extraction,
  evaluation) and which mutation is now legitimately true (draft ontology only),
  so QA can assert exactly one sanctioned mutation surface.

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read the MVP6.5 governance artifacts you extend: `docs/pm/MVP6_5_GOVERNANCE_BRIEF.md`,
  `docs/adr/0012-...md`, `docs/api/openapi-mvp6-5-draft.json`, and the module
  `apps/backend/app/modules/governance/`.
- Study the MVP1 ontology-edit path + MVP3 publish path under
  `apps/backend/app/modules/` (draft ontology versions, publish jobs) so the
  application reuses sanctioned semantics by reference (no renames).
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-043/{ROLE}_REPORT.md`.

## Execution Sequence
1. PM freezes the smallest coherent application P0 + writes brief + ADR 0013
   (application != publish; draft-only; human-initiated; staleness->SUPERSEDED).
2. Backend drafts an additive API contract + OpenAPI planning artifact.
3. Frontend reviews fields/states/IA (apply action UX, staleness/conflict,
   applied-not-published banner) — planning only.
4. QA writes an executable acceptance checklist and recommends Wave44.

## PM Agent Order
Role: PM / Architect — MVP6.6 Governance Application P0 Freeze
Write report: `docs/handoffs/wave-043/PM_REPORT.md`
Backlog ID: `PM6-025`
Tasks:
- Freeze the smallest coherent application P0: the apply action (APPROVED+QUEUED
  -> APPLIED into a DRAFT ontology version), the staleness rule (-> SUPERSEDED),
  idempotency, authorization (who may apply — reuse the MVP5 Role restriction;
  decide if it equals approver rights or a distinct apply right), and the
  application audit content.
- Redefine the mutation-guard for the apply action (which flags false, which
  ontology-draft mutation is legitimately true). Make explicit that publish is
  NOT part of this slice.
- Write `docs/pm/MVP6_6_GOVERNANCE_APPLICATION_BRIEF.md`; add
  `docs/adr/0013-...md`; update `docs/backlog/MVP6_DRAFT_BACKLOG.md` with
  PM/BE/FE/INT IDs (continue numbering; INT6 used through INT6-050).
- Confirm durable invariants (published-graph untouched, candidate/published
  separation, evidence/version/audit traceability, additive-only, no real LLM).
Validation: `git diff --check`. Do NOT touch apps/.

## Backend Agent Order
Role: Backend — Application Contract Draft (planning only)
Start condition: read `docs/handoffs/wave-043/PM_REPORT.md`.
Write report: `docs/handoffs/wave-043/BACKEND_REPORT.md`
Tasks:
- Draft additive endpoint(s) + DTO/enum names in
  `docs/api/MVP6_6_GOVERNANCE_APPLICATION_API_CONTRACT_DRAFT.md` (e.g. an apply
  endpoint on a change request, application status/read, application audit),
  reusing governance + MVP1 ontology-version + MVP3/MVP5 shapes by reference (no
  renames). Model the staleness->SUPERSEDED 409, idempotency 409, authz 403, and
  the redefined application mutation-guard.
- Produce `docs/api/openapi-mvp6-6-draft.json` (OpenAPI 3.1.0, additive to
  MVP1-MVP6.5, e.g. version 0.6.6-draft). No runtime code. Capture open questions.
Validation: OpenAPI JSON parse; `git diff --check`.

## Frontend Agent Order
Role: Frontend — Application UX/API Requirements (planning only)
Start condition: read PM report + Backend draft if ready.
Write report: `docs/handoffs/wave-043/FRONTEND_REPORT.md`
Tasks:
- Document, in `docs/pm/MVP6_6_FRONTEND_UX_REQUIREMENTS.md`: how the apply action
  appears in the existing Governance detail (only for APPROVED+QUEUED, permitted
  roles; human-confirmation step), the APPLIED state badge, the staleness/
  SUPERSEDED conflict UX, and an "applied to draft, NOT published — publish
  separately" banner. First-class loading/empty/error/permission states. Apply
  the closed design language (Section+Card, KO titles, D6 badges). DTO gap
  analysis vs the Backend draft. No route/component/type/mock/smoke code.
Validation: `git diff --check`.

## QA Agent Order
Role: Integration / QA — Application Acceptance Checklist
Start condition: read Wave43 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-043/QA_REPORT.md`
Tasks:
- Create `docs/backlog/INT6_6_GOVERNANCE_APPLICATION_ACCEPTANCE.md` (C planning +
  R NOT-RUNNABLE runtime gates), continuing INT6 numbering (INT6-051+).
- Verify PM/BE/FE agree on the apply P0, states, the application-!=-publish +
  draft-only boundary, staleness->SUPERSEDED, idempotency, authz, exclusions.
- Confirm no runtime leaked (search apps/ + infra/). OpenAPI parse.
- Recommend Wave44 thin implementation, hardening, or redesign.
Validation: OpenAPI parse; runtime-leakage search; `git diff --check`.
