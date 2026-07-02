# Next Orders - Wave 42

Status: `MVP6.5 GOVERNANCE WORKFLOW THIN IMPLEMENTATION`
Date: 2026-06-30

Wave41 closed MVP6.5 Governance contract-first planning as PASS. Wave42
implements the smallest deterministic runtime/UI slice of the frozen P0 loop.

```text
propose ontology change request (items = target_kind x change_type + element ref + ontology_version_id)
-> submit (DRAFT->OPEN)
-> reviewer COMMENT / REQUEST_CHANGES(reason)
-> approver APPROVE(justify) / REJECT(reason)
-> on APPROVE the request is QUEUED as intent; NOTHING is applied
-> audit trail + "approved = queued, not yet applied" banner
```

Sequence: PM (freeze G1/G2 + confirm G4 + ratify G3 FIRST) -> Backend ∥ Frontend -> QA.

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read Wave41 artifacts: `docs/handoffs/wave-041/{PM,BACKEND,FRONTEND,QA}_REPORT.md`,
  `docs/pm/MVP6_5_GOVERNANCE_BRIEF.md`, `docs/adr/0012-...md`,
  `docs/api/MVP6_5_GOVERNANCE_API_CONTRACT_DRAFT.md`,
  `docs/api/openapi-mvp6-5-draft.json`,
  `docs/pm/MVP6_5_FRONTEND_UX_REQUIREMENTS.md`,
  `docs/backlog/INT6_5_GOVERNANCE_ACCEPTANCE.md`.
- Reuse MVP3 review-decision/audit + MVP5 RBAC `Role` shapes by reference; do NOT
  rename existing fields/enums. Follow the MVP6.4 `goldset_authoring` module +
  process-local store + reset-hook precedent.
- Apply the closed design language (tokens, Section+Card, KO titles, D6 badges,
  one primary action) + ADR 0010 LNB IA.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-042/{ROLE}_REPORT.md`.

## Scope Guard
- MVP6.5 thin implementation only. Change requests are PROPOSALS in the
  candidate/analysis layer. APPROVE sets `GovernanceApplicationState=QUEUED` and
  applies NOTHING to the ontology / published graph / candidates / prompts;
  `change_auto_applied=false`; `APPLIED`/`SUPERSEDED` reserved, never produced.
  Every write carries the all-false 7-flag `GovernanceMutationGuard`.
- Authz: approve/reject restricted to ONTOLOGY_MANAGER/PROJECT_ADMIN/SYSTEM_ADMIN;
  approver != proposer (403 SELF_APPROVAL_FORBIDDEN). Reason required for
  REJECT/REQUEST_CHANGES/APPROVE (422). Wrong-state (409
  CHANGE_REQUEST_STATE_CONFLICT); submit 0 items (409 CHANGE_REQUEST_NO_ITEMS).
- Deterministic process-local data; no real LLM. Additive; no break of
  MVP1-MVP6.4 surfaces/smokes. No auto-apply/enforcement/impact-sim/agents.

## Execution Sequence
1. PM freezes G1 + G2, confirms G4 field shapes, ratifies G3 IA, confirms scope.
2. Backend implements endpoint families + tests + OpenAPI export/alignment.
3. Frontend implements the Governance UI + types/client/mocks + mock/actual smoke.
4. QA validates `INT6_5` runtime gates + approval-!=-auto-apply invariant + authz
   + regression; recommends closeout or hardening.

## PM Agent Order
Role: PM / MVP6.5 Implementation Scope Guard + Gate Freeze
Write report: `docs/handoffs/wave-042/PM_REPORT.md`
Backlog ID: `PM6-024`

Tasks:
- FREEZE **G1**: the OPEN->IN_REVIEW auto-advance trigger — decide first-touch
  (first review action auto-advances) vs an explicit "start review" action.
  State one rule precisely.
- FREEZE **G2**: approve justification — single `reason` field vs a separate
  `application_note`. State one rule (default to the simpler single `reason`
  unless there is a clear need).
- CONFIRM **G4** field shapes: audit ordering + pagination, board pagination, and
  whether a current-reviewer field must be added to the list DTO.
- RATIFY **G3** IA (already commander-ruled): Governance = new project-zone LNB
  item under the Review group (`/projects/:p/governance`); detail is a contextual
  ID-bound route.
- Confirm scope unchanged; restate the acceptance gates (approval=QUEUED-not-
  applied, all-false guard, authz+segregation, 403/409/422 rules, no MVP3/MVP5
  renames). Update `docs/backlog/MVP6_DRAFT_BACKLOG.md` if IDs (BE6-040+,
  FE6-061+, INT6-047+) need recording.

Validation: `git diff --check`. Do NOT touch apps/.

## Backend Agent Order
Role: Backend / MVP6.5 Runtime Thin Slice
Start condition: read `docs/handoffs/wave-042/PM_REPORT.md` (the frozen G1/G2/G4).
Write report: `docs/handoffs/wave-042/BACKEND_REPORT.md`
Backlog IDs: `BE6-040` change-request CRUD + items, `BE6-041` submit/withdraw +
review-decision (COMMENT/REQUEST_CHANGES/APPROVE/REJECT) + state machine,
`BE6-042` audit log + governance mutation guard + authz/segregation,
`BE6-043` OpenAPI export/alignment + no-mutation regression guard

Tasks:
- Implement the frozen endpoint families matching `openapi-mvp6-5-draft.json`
  field/enum names EXACTLY, in a new module (e.g.
  `apps/backend/app/modules/governance/`, registered after goldset_authoring; or
  extend per the existing pattern). Deterministic process-local store + reset
  hook (mirror goldset_authoring / evaluation).
- Enforce the frozen G1 auto-advance rule and G2 justification shape; the full
  state machine (DRAFT/OPEN/IN_REVIEW/APPROVED/REJECTED/WITHDRAWN); reason rules
  (422); approver != proposer + role restriction (403); wrong-state / no-items
  (409); APPROVE -> `application_state=QUEUED`, `change_auto_applied=false`,
  NOTHING applied; every write returns the all-false 7-flag
  `GovernanceMutationGuard`; full audit entries (actor/action/reason/timestamp/
  target element + ontology version).
- Reuse MVP3 ReviewDecisionType literals + MVP5 `Role` + audit shapes by
  reference; no renames; no new metric.
- Focused tests (`tests/test_mvp6_5_governance_api.py`): propose/items/submit/
  withdraw; each review action + state transitions; reason-required 422;
  self-approval 403; role-restriction 403; wrong-state 409; no-items 409;
  APPROVE=QUEUED-nothing-applied; all-false guard; audit; OpenAPI alignment.

Validation:
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_5_governance_api.py -q`
  and `tests/test_mvp6_4_goldset_authoring_api.py -q`
- `cd apps/backend && .venv/bin/ruff check app tests scripts`
- OpenAPI export/parse/compare for the MVP6.5 paths
- `git diff --check`

## Frontend Agent Order
Role: Frontend / MVP6.5 Governance Thin UI
Start condition: read `docs/handoffs/wave-042/PM_REPORT.md`; coordinate with the
Backend report if contracts shift.
Write report: `docs/handoffs/wave-042/FRONTEND_REPORT.md`
Backlog IDs: `FE6-061` route/IA + LNB item + types/client/mocks, `FE6-062`
board + propose UI, `FE6-063` detail (review thread + decision panel + audit +
QUEUED banner), `FE6-064` mock + actual smoke

Tasks:
- Add the Governance project-zone LNB item under the Review group
  (`/projects/:p/governance`); detail (`/governance/:id`) is a contextual
  ID-bound route (ADR 0010), not an LNB item. Keep single active LNB item.
- Implement board (state-grouped, primary `변경 요청 생성`) -> propose (items =
  target_kind x change_type + element ref + ontology_version_id) -> detail
  (summary + items + review thread + decision panel + audit trail).
- States: permission boundary from `GovernanceCapabilities` (approve/reject only
  for permitted roles; own-request approve pre-disabled + segregation copy;
  non-permitted read-only + PERMISSION_LIMITED badge); reason required for
  REQUEST_CHANGES/APPROVE/REJECT; approval-not-applied persistent banner +
  QUEUED shown as a warning-toned `큐잉됨(미적용)` badge (not success); no
  적용/게시 CTA; state-machine D6 badges. loading/empty/error preserved.
- Types/client/query/mocks match the frozen OpenAPI exactly; reuse MVP3/MVP5
  types where `$ref`'d (no redefine/rename). Design language applied.
- Add `npm run smoke:mvp6:governance:mock` and, if backend runnable,
  `npm run smoke:mvp6:governance:actual`.

Validation:
- `cd apps/frontend && npm run test`, `npm run build`,
  `npm run smoke:mvp6:governance:mock`, `:actual` if backend runnable
- responsive re-check 0 overflow at 1440/1366/1280/768 for the new screens
- `git diff --check`

## QA Agent Order
Role: Integration / QA
Start condition: read Wave42 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-042/QA_REPORT.md`
Backlog IDs: `INT6-047` backend runtime, `INT6-048` frontend mock/API,
`INT6-049` approval-!=-auto-apply + no-mutation guard, `INT6-050` Wave42 closeout

Tasks:
- Update `docs/backlog/INT6_5_GOVERNANCE_ACCEPTANCE.md` runtime gates with
  verdicts.
- Validate the endpoint families, DTO/enum alignment, the frozen G1/G2 behavior,
  the full state machine, reason-required (422), self-approval + role
  restriction (403), wrong-state / no-items (409), audit content.
- **INDEPENDENTLY verify the approval-!=-auto-apply invariant**: after APPROVE,
  confirm `application_state=QUEUED`, `change_auto_applied=false`, and at the data
  level that the ontology / published graph / candidates / prompts are NOT
  mutated; `APPLIED`/`SUPERSEDED` never produced. Confirm all-false guard.
- Validate the frontend mock + actual flow; confirm no MVP3/MVP5 renames.
- Run selected MVP6.4/earlier regression + smokes BE/FE touched; confirm
  additive-only + candidate/published separation intact + Wave35-38 UI invariants.
- Recommend closeout / targeted hardening / redesign. Exact commands; no leftover
  listeners on 8000/5173; `git diff --check`.
