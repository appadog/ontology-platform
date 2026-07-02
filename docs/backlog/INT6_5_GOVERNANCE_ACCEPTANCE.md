# INT6.5 MVP6.5 Governance Workflow Acceptance Checklist

Status: `WAVE42 QA RUNTIME ACCEPTANCE — PASS (all C-series PASS; R1–R12 all PASS at runtime)`
Date: 2026-07-02
Owner: QA / Integration
Backlog: `INT6-043`..`INT6-046` (Wave41 planning), `INT6-047`..`INT6-050` (Wave42 runtime — this update)
Wave41 verdict: **PASS (planning)** — PM brief, ADR 0012, Backend contract +
OpenAPI, and Frontend UX requirements agree on the P0 flow, the frozen
enums/states, the approval-!=-auto-apply boundary, RBAC + segregation of duties,
reason rules, the all-false `GovernanceMutationGuard`, reuse-by-reference of
MVP3/MVP5 shapes with no rename, and the exclusions. OpenAPI parses (3.1.0,
`0.6.5-draft`, 9 paths / 12 operations / 24 schemas / 8 parameters / 4 responses);
all endpoint families, all 6 frozen enums (exact literals), the 7-flag all-false
guard, and all key DTOs are present. No runtime implementation leaked under
`apps/`/`infra/`. Runtime acceptance (R1–R12) is `NOT RUNNABLE` by design until a
Wave42 thin-implementation order is opened. See Wave42 gates + Validation Commands
below and `docs/handoffs/wave-041/QA_REPORT.md`.

This checklist turns `INT6-043`~`INT6-046` into contract-first acceptance criteria
for MVP6.5 **Governance workflow** — an auditable ontology **change-request
lifecycle** (propose → review → approve/reject → audit) in the candidate/analysis
(governance/decision-record) layer, built additively on top of the closed MVP3
review/publish/audit surface and MVP5 admin/RBAC/audit control plane. Wave41 is
**planning only**. Runtime API, FastAPI service, database model, Alembic
migration, frontend route/component, seed data, smoke script, and test
implementation remain out of scope until a Wave42 thin-implementation order is
explicitly opened.

> **QA ID note (Wave41).** `INT6-*` was consumed through `INT6-042` (Wave40 MVP6.4
> runtime). This theme therefore uses **`INT6-043`~`INT6-046`** per the PM freeze
> and the Wave41 order. `docs/backlog/MVP6_DRAFT_BACKLOG.md` reflects the same
> range.

## Source Documents

- Agent rules: `AGENTS.md`
- Handoff process: `.agents/skills/handoff-reporting/SKILL.md`
- Current state: `docs/handoffs/CURRENT_STATE.md`
- Wave order: `docs/handoffs/wave-041/NEXT_ORDERS.md`
- PM report: `docs/handoffs/wave-041/PM_REPORT.md`
- Backend report: `docs/handoffs/wave-041/BACKEND_REPORT.md`
- Frontend report: `docs/handoffs/wave-041/FRONTEND_REPORT.md`
- PM brief: `docs/pm/MVP6_5_GOVERNANCE_BRIEF.md`
- ADR: `docs/adr/0012-mvp6-5-governance-approval-not-auto-apply-boundary.md`
- API draft: `docs/api/MVP6_5_GOVERNANCE_API_CONTRACT_DRAFT.md`
- OpenAPI draft: `docs/api/openapi-mvp6-5-draft.json`
- Frontend requirements: `docs/pm/MVP6_5_FRONTEND_UX_REQUIREMENTS.md`
- Format precedent: `docs/backlog/INT6_4_GOLD_SET_AUTHORING_ACCEPTANCE.md`
- IA precedent: `docs/adr/0010-lnb-project-context-information-architecture.md`
- MVP6 backlog: `docs/backlog/MVP6_DRAFT_BACKLOG.md`

## MVP6.5 P0 Boundary

Frozen P0 demo flow (PM brief §2, ADR 0012 Decision, Backend contract §Endpoint
Details, Frontend requirements all agree):

```text
select project
-> open Governance (change-request board, under the Review group)
-> propose a change request: title + summary + one or more change items, each
     naming target_kind (CLASS/PROPERTY/RELATION), change_type (ADD/MODIFY/
     DEPRECATE), the target ontology element ref (null for ADD) + ontology_version_id,
     and a proposed_change payload (stored as intent only)
-> submit (DRAFT -> OPEN); submit with 0 items -> 409 CHANGE_REQUEST_NO_ITEMS
-> reviewer COMMENT (OPEN auto-advances to IN_REVIEW) / REQUEST_CHANGES
     (reason required -> back to OPEN for the proposer to revise)
-> approver APPROVE (justification/reason required) / REJECT (reason required)
     -> APPROVED: terminal AND queued as intent (application_state = QUEUED);
        NOTHING applied to the ontology definition, candidate graph, or published
        graph; no publish/extraction job started (change_auto_applied = false)
     -> REJECTED: terminal, with reason
-> open the audit trail (actor, action, reason, timestamp, target change item +
     ontology element + version context, before/after request state)
-> confirm the "approved = queued intent, not yet applied" banner
```

Governance reads/writes **only** its own change-request / change-item / review-
decision / governance-audit records; it **references** ontology elements
(`ontology_class_id`/`ontology_property_id`/`ontology_relation_id` +
`ontology_version_id`) read-only. It executes no ontology edit, no publish, no
rollback, no extraction, no re-validation/re-extraction, no LLM call, and never
applies an approved change to any non-governance surface.

Reused source shapes (referenced verbatim / by reference, no rename):

- `ReviewDecisionType` (`APPROVE`/`REJECT`/`REQUEST_CHANGES`/`MODIFY_AND_APPROVE`,
  `core/enums.py`) — `GovernanceReviewAction` reuses the `APPROVE`/`REJECT`/
  `REQUEST_CHANGES` literals verbatim + adds `COMMENT`; `MODIFY_AND_APPROVE` is
  **intentionally excluded** (governance approval never inline-applies).
- `Role` (`SYSTEM_ADMIN`/`PROJECT_ADMIN`/`ONTOLOGY_MANAGER`/`DATA_MANAGER`/
  `EXTRACTION_MANAGER`/`REVIEWER`/`VIEWER`/`API_CLIENT`, `core/enums.py`) — reused
  verbatim for gating; no new role literal.
- MVP3/MVP5 audit shape + `AuditEventType` + `AuditLog` — the `GovernanceAuditEntry`
  reuses the audit record shape by reference; the new `GovernanceAuditAction` enum
  names governance-specific events and does not rename `AuditEventType`.
- Ontology definition (`OntologyElementStatus`, element ids, `ontology_version_id`)
  — READ-ONLY reference target of a change item; never written.
- MVP6.2/6.4 all-false mutation-guard precedent (ADR 0011,
  `GoldAuthoringMutationGuard`) — mirrored by the all-false `GovernanceMutationGuard`.

P0 exclusions (out of MVP6.5 P0):

- auto-apply of an approved change to the ontology definition or published graph;
  `GovernanceApplicationState.APPLIED`/`SUPERSEDED` production;
- automatic enforcement, autonomous/agent publish, and rollback;
- impact simulation / impact analysis reports (`OntologyImpactReport`),
  migration-plan generation (`OntologyMigrationPlan`), automatic release-note
  generation (`OntologyReleaseNote`);
- post-change re-validation / re-extraction job creation;
- automatic reviewer assignment / load-balancing; ontology diff visualization
  beyond a plain change-item summary;
- real LLM/provider execution; copilot/agent runtime; connector/plugin SDK;
  multi-tenant runtime;
- hard-delete of any change request or audit entry (withdraw/terminal states only);
- durable DB/Alembic persistence (a deterministic process-local store with
  `reset_runtime_store()` is acceptable; durable persistence stays P1/P2).

## Verdict Semantics

- `PASS`: planning artifacts agree and preserve the governance decision-record
  safety boundary + the approval-!=-auto-apply invariant.
- `PARTIAL`: contract is usable for review, but named fields/enums or
  implementation-facing details need targeted hardening before runtime work.
- `FAIL`: planning opens forbidden runtime scope, lets any governance action
  mutate the ontology definition / candidate graph / published graph / prompts, or
  auto-apply an approved change; starts a publish/extraction job; produces
  `APPLIED`/`SUPERSEDED` in P0; removes audit/version/actor traceability;
  hard-deletes a change request or audit entry; drops the segregation-of-duties or
  approver-role gate; or renames a reused MVP3/MVP5 shape (breaking).
- `NOT RUNNABLE`: expected for runtime checks (R-series) before Wave42 because no
  MVP6.5 runtime implementation exists by design.

## Current Wave41 QA Verdict

| ID | Verdict | QA note |
|---|---|---|
| `INT6-043` | `PASS` (planning) | PM brief, ADR 0012, Backend contract/OpenAPI, and Frontend requirements agree on the P0 flow, frozen enums/states, decision commands + reason rules, RBAC + segregation of duties, reuse-by-reference of MVP3/MVP5 shapes (no rename), the safety boundary, and later-theme exclusions. OpenAPI parses (3.1.0, `0.6.5-draft`, 9 path objects / 12 operations / 24 schemas / 8 parameters / 4 responses); all endpoint families, all 6 frozen enums (exact literals), the all-false 7-flag `GovernanceMutationGuard`, the 8-flag `GovernanceCapabilities`, and all key DTOs are present. Runtime-leakage search under `apps/`/`infra/` found no MVP6.5 implementation. Runtime acceptance (R1–R12) is `NOT RUNNABLE` by design. |
| `INT6-044` | `PASS` (planning) | The lifecycle state machine + approval-is-intent boundary are frozen identically in brief §2/§4/§5, ADR 0012 Decision, and contract §New Enums/§Endpoint Details: `DRAFT→OPEN→IN_REVIEW→{APPROVED\|REJECTED}` + `WITHDRAWN`; `REQUEST_CHANGES` returns `{OPEN\|IN_REVIEW}→OPEN`; reason required for `REJECT`/`REQUEST_CHANGES`/`APPROVE` (`422`); `409 CHANGE_REQUEST_STATE_CONFLICT` on terminal/wrong-state; `409 CHANGE_REQUEST_NO_ITEMS` on 0-item submit; approver≠proposer → `403 SELF_APPROVAL_FORBIDDEN`; on `APPROVE` `application_state=QUEUED` and nothing applied; `APPLIED`/`SUPERSEDED` reserved, never produced in P0. The two Backend open questions (approve-justification vs `application_note`; `OPEN→IN_REVIEW` auto-advance trigger) are recorded as **Wave42 PM-freeze gates** (below), not Wave41 blockers. |
| `INT6-045` | `PASS` (planning) | No-mutation + audit boundary is frozen: all-false 7-flag `GovernanceMutationGuard` on every governance write response (`ontology_definition_mutated`/`published_graph_mutated`/`candidate_graph_mutated`/`prompt_version_mutated`/`publish_job_started`/`extraction_job_started`/`change_auto_applied` all `false`); full audit trail via `GovernanceAuditEntry` (actor + role, action, reason, target change-item + ontology element + `ontology_version_id`, before/after status, timestamp) with the 9 `GovernanceAuditAction` literals; ontology element refs read-only; no hard-delete (withdraw/terminal only). |
| `INT6-046` | `PASS` (planning) | All five Wave41 artifacts (brief, ADR 0012, backlog, Backend contract/OpenAPI, Frontend requirements) agree; no runtime leaked; the two Backend open questions + the FE non-blocking confirms are recorded as Wave42 gates (below); the commander IA ruling (Governance = new project-zone LNB item under the Review group) is recorded. Recommendation: **Wave42 thin implementation**. |

## Wave42 Gates (recorded; analogous to MVP6.3 C12 / MVP6.4 freeze-on-pin)

These are the explicit items PM/FE must freeze/confirm at the **start of Wave42**
so Backend/Frontend/QA implement and test one rule. None blocks Wave41 planning.

### Gate G1 — Backend Open Q2: `OPEN → IN_REVIEW` auto-advance trigger (PM freeze)

Contract §Open Questions #1 and Backend report "총괄에게 요청하는 결정" flag the
exact auto-advance trigger as undecided.

- **Draft assumption:** the **first reviewer touch** (any `COMMENT` /
  `REQUEST_CHANGES`, or an explicit reviewer open) advances `OPEN → IN_REVIEW` and
  audits `REVIEW_STARTED`; `REQUEST_CHANGES` from `IN_REVIEW` returns to `OPEN` and
  re-triggers `REVIEW_STARTED` on the next touch.
- **Alternative:** an explicit "start review" action (separate endpoint/command)
  performs the `OPEN → IN_REVIEW` transition, and `COMMENT` does not auto-advance.

PM must decide which; the choice sets whether a "start review" endpoint exists and
what QA gate **R3** asserts (auto-advance-on-first-COMMENT vs explicit-start).

### Gate G2 — Backend Open Q1: approve justification vs a separate `application_note` (PM/FE freeze)

Contract §Open Questions #2 and Backend report flag whether `APPROVE` reuses the
single `reason` field or adds a distinct optional `application_note` describing the
queued intent for the later application slice.

- **Draft assumption:** a single required `reason` carries the approval
  justification; no separate `application_note`.
- **Alternative:** add an optional `application_note` on `APPROVE` (and surface it
  on `application_banner` / the QUEUED intent).

FE + PM must confirm before Wave42 so Backend freezes the `GovernanceReviewDecisionRequest`
shape once; QA gate **R11** (audit content) tests the frozen shape.

### Gate G3 — COMMANDER IA RULING (already decided; recorded here)

Governance is added as a **NEW project-zone LNB item** under the **Review group**
(`/projects/:p/governance`) — **not** the zero-new-item fallback. The change-request
detail (`/projects/:p/governance/:changeRequestId`) stays a **contextual, ID-bound
route reached from the board / breadcrumb**, NOT a global-LNB item, consistent with
ADR 0010 (no ID-bound pages in the global LNB). The Frontend report documented (A)
the Review-group LNB item as primary and (B) a Review-inbox-entry fallback for a
zero-new-LNB preference; the commander ruling selects **(A)**. QA gate **R12**
asserts exactly one active LNB item (`Governance`) resolves for
`/projects/:p/governance[/…]`, after `Review` (`/review`).

### Gate G4 — Frontend non-blocking confirms (Wave42, not blocking)

FE report "남은 TODO (DTO gaps)" #9–#11 (all non-blocking):

- **#9 audit ordering/pagination** — confirm newest-first + `limit`/`cursor` for
  both `.../{id}/audit` and `.../governance-audit` (draft: yes, opaque cursor;
  contract §Open Questions #3).
- **#10 board pagination** — confirm list `limit`/`cursor` pagination vs client-side
  grouping for the change-request board.
- **#11 current reviewer/approver field** — confirm whether the board row derives
  the current reviewer/approver from the review thread / latest decision, or whether
  `OntologyChangeRequest` needs an added field (draft exposes only `proposer_id` +
  `item_count`).

These are field-shape confirmations to freeze before Wave42 implementation; none
changes the boundary or blocks Wave41.

## C1 — Scope / Flow Alignment

Exit criterion: `PASS` when all checks are true.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C1.1 | P0 demo flow identical across PM brief, ADR 0012, Backend draft, Frontend requirements | PASS | propose (title + summary + change items) → submit (DRAFT→OPEN) → reviewer COMMENT (auto-advance IN_REVIEW) / REQUEST_CHANGES → approver APPROVE(justify)/REJECT → APPROVED sets `application_state=QUEUED`, nothing applied → audit trail → "approved = queued intent" banner, verbatim in all four (brief §2, ADR Decision, contract §Endpoint Details, FE §Screen Flow). |
| C1.2 | Governance touches only its own records + reads ontology refs read-only | PASS | contract §Preserved Boundary + §Safety Boundary; change items reference `ontology_class_id`/`ontology_property_id`/`ontology_relation_id` + `ontology_version_id` only; no MVP3 candidate-review / MVP3 publish / candidate / prompt / published-graph write in any artifact. |
| C1.3 | Exclusions (P1/later) consistent across artifacts | PASS | brief §7, ADR "Out of scope", contract §Out of Scope, FE Scope Guard all list the same exclusions (auto-apply, enforcement, autonomous/agent publish + rollback, impact simulation, migration/release-note generation, re-validation/re-extraction, diff viz, auto reviewer assignment, real LLM, agents, connectors, multi-tenant, hard-delete, durable persistence P1/P2). |
| C1.4 | Wave41 changed only documentation/planning artifacts | PASS | `git diff --check` clean (exit 0); runtime-leakage search found no MVP6.5 runtime (exit 1); role reports state no `apps/`/`infra/` change. |

## C2 — Frozen Endpoint Families

Exit criterion: `PASS` when every family is present, additive, and
project/resource-scoped as required.

| # | Family | Criterion | Verdict | Evidence |
|---|---|---|---|---|
| C2.1 | A. Change-request CRUD | `POST`/`GET /projects/{project_id}/ontology-change-requests`; `GET`/`PATCH /ontology-change-requests/{change_request_id}` | PASS | 3 path objects (collection + item) present in OpenAPI; propose/list/get/update-while-draft-or-open. |
| C2.2 | B. Change-item management | `POST .../{change_request_id}/items`; `PATCH`/`DELETE .../items/{item_id}` | PASS | 2 item path objects present; add/edit/remove (proposal-only). |
| C2.3 | C. Lifecycle | `POST .../submit`; `POST .../withdraw` | PASS | submit + withdraw present. |
| C2.4 | D. Review + decision | `POST .../reviews` (single endpoint keyed by `action`) | PASS | one decision endpoint present; `GovernanceReviewAction` key mirrors MVP3 `ReviewDecisionCreateRequest`. |
| C2.5 | E. Governance audit log (read-only) | `GET .../{change_request_id}/audit`; `GET /projects/{project_id}/governance-audit` | PASS | per-request + project-scoped audit reads present. |
| C2.6 | All paths additive — no MVP1–MVP6.4 path renamed/moved/removed | PASS | standalone draft holds only the 9 MVP6.5 paths; disjoint from all 8 prior per-MVP drafts (OVERLAP: NONE, verified). |
| C2.7 | Every write is a gated governance-record mutation only — never a graph/ontology/publish mutation | PASS | every write response carries the all-false `GovernanceMutationGuard`; contract §Safety Boundary. |

## C3 — Frozen Enums

Exit criterion: `PASS` when each enum + its literals are present and identical
across PM brief, Backend draft, OpenAPI, and Frontend requirements.

| # | Enum | Literals | Verdict |
|---|---|---|---|
| C3.1 | `OntologyChangeRequestStatus` | `DRAFT`, `OPEN`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `WITHDRAWN` | PASS |
| C3.2 | `GovernanceReviewAction` | `COMMENT`, `REQUEST_CHANGES`, `APPROVE`, `REJECT` (MVP3 `ReviewDecisionType` literals reused; `MODIFY_AND_APPROVE` excluded) | PASS |
| C3.3 | `GovernanceApplicationState` | `NOT_APPLICABLE`, `QUEUED`, `APPLIED`(reserved), `SUPERSEDED`(reserved) | PASS |
| C3.4 | `ChangeRequestTargetKind` | `CLASS`, `PROPERTY`, `RELATION` | PASS |
| C3.5 | `ChangeRequestChangeType` | `ADD`, `MODIFY`, `DEPRECATE` | PASS |
| C3.6 | `GovernanceAuditAction` (9) | `CHANGE_REQUEST_CREATED`, `CHANGE_REQUEST_UPDATED`, `CHANGE_REQUEST_SUBMITTED`, `CHANGE_REQUEST_WITHDRAWN`, `REVIEW_STARTED`, `COMMENT_ADDED`, `CHANGES_REQUESTED`, `CHANGE_REQUEST_APPROVED`, `CHANGE_REQUEST_REJECTED` | PASS |
| C3.7 | `GovernanceReviewAction` excludes `MODIFY_AND_APPROVE` | PASS | asserted absent from the enum literal set; governance approval never inline-applies. |
| C3.8 | `APPLIED`/`SUPERSEDED` are declared-but-reserved (never produced in P0) | PASS | brief §4, ADR Decision, contract §`GovernanceApplicationState` ("NOT produced by any P0 operation"). |

## C4 — Reused MVP3/MVP5 Shapes (no renames; reuse by reference)

Exit criterion: `PASS` when every reused name + field is verbatim and no MVP3/MVP5
shape is renamed.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C4.1 | `ReviewDecisionType` literals reused verbatim by `GovernanceReviewAction` (+`COMMENT`, −`MODIFY_AND_APPROVE`) | PASS | brief §3, ADR, contract §Reused Artifacts; enum literal check confirms exact overlap + exclusion. |
| C4.2 | `Role` reused verbatim (approve/reject = `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`); no new role literal | PASS | brief §3/§6, ADR, contract §Authorization Model; PM report confirms the real shipped `Role` (not ADR-0008's planned set) is what is reused verbatim. |
| C4.3 | MVP3/MVP5 audit shape + `AuditEventType` reused by reference; `GovernanceAuditAction` names governance events, does not rename `AuditEventType` | PASS | brief §4, ADR, contract §Reused Artifacts; `GovernanceAuditEntry` reuses `actor_id`/action/reason/timestamp + adds governance target/state context. |
| C4.4 | Ontology element ids + `ontology_version_id` referenced read-only; `DEPRECATE` never sets `OntologyElementStatus` | PASS | brief §3, ADR, contract §Preserved Boundary. |
| C4.5 | No MVP3/MVP5/MVP6.1–6.4 field/enum renamed (any rename = breaking FAIL) | PASS | FE report "0 enum/DTO mismatch"; contract §Contract Principles ("No reuse-by-rename"); additivity check disjoint from all prior drafts. |

## C5 — Screen Flow Coverage

Exit criterion: `PASS` when each P0 surface maps to a contract shape.

| # | Surface | Maps to | Verdict |
|---|---|---|---|
| C5.1 | Governance board (by state) | `GET /projects/{id}/ontology-change-requests` → `OntologyChangeRequestListResponse` (filter by `status`/`application_state`/proposer) | PASS |
| C5.2 | Propose form (title/summary + change items) | `POST /projects/{id}/ontology-change-requests` + `POST .../items` ← `OntologyChangeItemRequest` (`target_kind`×`change_type` + element ref[null for ADD] + `ontology_version_id` + `proposed_change`) | PASS |
| C5.3 | Change-request detail (items + thread + decision panel + banner) | `GET /ontology-change-requests/{id}` → `OntologyChangeRequestDetail` (`change_request` + `items` + `reviews` + `capabilities` + `application_banner`) | PASS |
| C5.4 | Submit / withdraw (proposer) | `POST .../submit` (DRAFT→OPEN, ≥1 item), `POST .../withdraw` (→WITHDRAWN) → `GovernanceMutationResponse` | PASS |
| C5.5 | Review / decision (reviewer / approver) | `POST .../reviews` ← `GovernanceReviewDecisionRequest` (`action` + `reason`) → `GovernanceMutationResponse` (`review_decision` + `mutation_guard` + `capabilities`) | PASS |
| C5.6 | Approval-is-intent banner | `OntologyChangeRequestDetail.application_banner` (`application_state` + KO message); `GovernanceApplicationState` QUEUED rendered as warning-tone `큐잉됨(미적용)`, no 적용/게시 CTA | PASS |
| C5.7 | Audit trail (per-request + project-scoped) | `GET .../{id}/audit`, `GET /projects/{id}/governance-audit` → `GovernanceAuditListResponse` of `GovernanceAuditEntry` | PASS |
| C5.8 | Permission-boundary UX (4 actor modes) | `GovernanceCapabilities` (8 `can_*` flags) pre-renders proposer/reviewer/approver/read-only; approver≠proposer disables self-approve; server `403` backstop | PASS |
| C5.9 | State-machine + application-state badges (D6) | `OntologyChangeRequestStatus` + `GovernanceApplicationState` mapped to D6 EN token + icon + KO label; some rows reuse existing D6 rows | PASS |
| C5.10 | First-class loading/empty/error/permission/409-conflict/queued/reason-required states defined | PASS | FE §State Requirements covers loading, empty (no project / no request / no activity), error, permission-limited (`PERMISSION_LIMITED` badge), 409 conflict, approval-queued, reason-required. |

## C6 — Lifecycle State Machine + Reason Rules (load-bearing)

Exit criterion: `PASS` when the state machine + reason rules are frozen
identically across all artifacts.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C6.1 | `DRAFT→OPEN→IN_REVIEW→{APPROVED\|REJECTED}` + `WITHDRAWN` from `DRAFT`/`OPEN`/`IN_REVIEW` | PASS | brief §4, ADR Decision, contract §`OntologyChangeRequestStatus` (state machine block). |
| C6.2 | `REQUEST_CHANGES` returns `{OPEN\|IN_REVIEW}→OPEN` (proposer revises, no re-create) | PASS | brief §4, ADR, contract §`GovernanceReviewAction` + §Endpoint Details. |
| C6.3 | `APPROVED`/`REJECTED`/`WITHDRAWN` terminal + immutable; item/title edit only in `DRAFT`/`OPEN` | PASS | brief §4, contract §`OntologyChangeRequestStatus` + §Item management. |
| C6.4 | Reason required (non-empty) for `REJECT`/`REQUEST_CHANGES`/`APPROVE` → `422 REASON_REQUIRED`; optional for `COMMENT`/`withdraw` | PASS | brief §6, ADR "Reason rules", contract §Reason Rules + §Error Contract. |
| C6.5 | `submit` with 0 change items → `409 CHANGE_REQUEST_NO_ITEMS` | PASS | contract §Endpoint Details (submit) + §Error Contract. |
| C6.6 | Mutating/deciding a terminal or wrong-state request → `409 CHANGE_REQUEST_STATE_CONFLICT` | PASS | brief §4, contract §`OntologyChangeRequestStatus` + §Endpoint Details + §Error Contract. |
| C6.7 | Change-item ref rule: null for `ADD`; exactly one matching ref for `MODIFY`/`DEPRECATE` → `409 CHANGE_ITEM_TARGET_INVALID` / `ONTOLOGY_REF_INVALID` | PASS | brief §4, contract §`OntologyChangeItem` (Rules) + §Error Contract. |

## C7 — Approval-Is-Intent-Not-Auto-Apply Boundary (the critical decision)

Exit criterion: `PASS` when approval records intent + audit only and applies
nothing, frozen identically across all artifacts (ADR 0012 is the durable record).

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C7.1 | `APPROVE` sets `status=APPROVED` + `application_state=QUEUED`; nothing applied to ontology/candidate/published graph | PASS | brief §5, ADR Decision, contract §Endpoint Details (APPROVE) — "Applies nothing (all-false guard; `change_auto_applied=false`)". |
| C7.2 | `change_auto_applied` is always `false` (boundary proof) | PASS | brief §6, ADR, contract §`GovernanceMutationGuard`; OpenAPI guard flag `change_auto_applied` const/default `false`. |
| C7.3 | `APPLIED`/`SUPERSEDED` reserved; never produced by any P0 operation | PASS | brief §4/§5, ADR Decision, contract §`GovernanceApplicationState` + §Out of Scope. |
| C7.4 | "Approved" = decision of record (actor + role + reason + timestamp + target element(s) + `ontology_version_id`), authorizing a future, human-initiated, separately-audited application | PASS | brief §5, ADR Decision; `GovernanceAuditEntry` + `GovernanceReviewDecision` carry the full decision context. |
| C7.5 | Actual application deferred to a later slice via existing MVP1 ontology-edit + MVP3 publish paths; no publish/rollback endpoint added here | PASS | brief §1/§5/§7, ADR, contract §Preserved Boundary + §Out of Scope; no `.../publish` / `.../rollback` path in the OpenAPI. |

## C8 — Authorization / Segregation of Duties Boundary

Exit criterion: `PASS` when propose is open, review/decide is role-gated, and the
proposer cannot approve their own request.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C8.1 | Read (list/get requests, items, thread, audit) open to any project member incl. `VIEWER` | PASS | contract §Authorization Model. |
| C8.2 | Propose / update-while-draft-or-open / submit / withdraw = the proposer | PASS | contract §Authorization Model; brief §6. |
| C8.3 | `COMMENT`/`REQUEST_CHANGES` = `REVIEWER` + elevated | PASS | brief §6, ADR, contract §Authorization Model. |
| C8.4 | `APPROVE`/`REJECT` restricted to `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN` | PASS | brief §6, ADR Decision, contract §Authorization Model. |
| C8.5 | Proposer may not approve own request → `403 SELF_APPROVAL_FORBIDDEN` | PASS | brief §2/§6, ADR, contract §Authorization Model + §Error Contract; FE pre-disables self-approve with server backstop. |
| C8.6 | Unauthorized action → `403 PERMISSION_DENIED`, never a partial mutation | PASS | contract §Authorization Model + §Error Contract. |
| C8.7 | `GovernanceCapabilities` (8 `can_*` flags) is display-only; server enforces independently; never widens the boundary | PASS | OpenAPI `GovernanceCapabilities` = `can_view`/`can_edit_request`/`can_submit`/`can_withdraw`/`can_comment`/`can_request_changes`/`can_approve`/`can_reject`; contract §Authorization Model. |

## C9 — No-Mutation Safety Boundary (all-false guard)

Exit criterion: `PASS` when the 7-flag guard is all-false and no forbidden surface
is opened.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C9.1 | `GovernanceMutationGuard` exposes all 7 flags, every flag `const/default: false` | PASS | OpenAPI guard: `ontology_definition_mutated`/`published_graph_mutated`/`candidate_graph_mutated`/`prompt_version_mutated`/`publish_job_started`/`extraction_job_started`/`change_auto_applied` all `false`. |
| C9.2 | Guard present on every governance write response (`GovernanceMutationResponse` envelope) | PASS | contract §`GovernanceMutationResponse` — every propose/update/item/submit/withdraw/review response carries `mutation_guard`. |
| C9.3 | No ontology-definition / element / version mutation (references only) | PASS | brief §6, ADR, contract §Preserved Boundary + §Safety Boundary. |
| C9.4 | No published-graph / candidate-graph / prompt / prompt-version mutation | PASS | brief §6, ADR, contract §Safety Boundary. |
| C9.5 | No publish / extraction / re-validation / re-extraction job started; no LLM call | PASS | brief §6, ADR, contract §Safety Boundary; `publish_job_started`/`extraction_job_started: false`. |
| C9.6 | No hard-delete of a change request or audit entry (withdraw/terminal only) | PASS | brief §6, ADR, contract §Contract Principles + §Out of Scope. |

## C10 — Audit / Version / Actor Traceability Preserved

Exit criterion: `PASS` when every governance action is audited with full context.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C10.1 | Every lifecycle event records a `GovernanceAuditEntry` (actor id + role, action, reason/note, target change-request + change-item ids, target ontology element(s) + `ontology_version_id`, before/after status, timestamp) | PASS | brief §4, ADR, contract §`GovernanceAuditEntry` + §`GovernanceAuditAction` (9 literals). |
| C10.2 | Audit action vocabulary = `GovernanceAuditAction` (9), does not rename `AuditEventType` | PASS | brief §4, contract §Reused Artifacts + §New Enums. |
| C10.3 | Audit is read-only and mutates no non-governance surface; never hard-deleted | PASS | contract §`GovernanceAuditEntry` ("Audit-only; mutates no non-governance surface. Never hard-deleted"). |
| C10.4 | Both per-request (`.../{id}/audit`) and project-scoped (`.../governance-audit`) audit reads exist | PASS | OpenAPI paths present; contract §E. |

## C11 — Frontend DTO Gap Closure (8 Blocking resolved + 4 non-blocking)

Exit criterion: `PASS` when all 8 Blocking FE gaps are resolved by the Backend
draft; the non-blocking items are confirmed deferrable to Wave42 (Gate G4).

| # | FE gap | Resolution | Verdict |
|---|---|---|---|
| 1 | Permission capability hint | `GovernanceCapabilities` (8 `can_*`) on list/get/write; `403 PERMISSION_DENIED` | PASS (resolved) |
| 2 | Approval-is-intent surfacing | `application_state` field + `application_banner` on detail; warning-tone `큐잉됨(미적용)` badge | PASS (resolved) |
| 3 | Field names (`proposer_id`, `item_count`, `can_edit_request`) | verbatim in the Backend draft; FE reconciled | PASS (resolved) |
| 4 | Change item as a separate `.../items` endpoint family | family B present; `OntologyChangeItem`/`OntologyChangeItemRequest` | PASS (resolved) |
| 5 | `proposed_change` shape | opaque intent-only object (never applied) | PASS (resolved) |
| 6 | Decision response linkage | `GovernanceReviewDecision` with `resulting_status`/`resulting_application_state` | PASS (resolved) |
| 7 | `GovernanceMutationGuard` 7 keys | 7 keys verbatim incl. `change_auto_applied` | PASS (resolved) |
| 8 | Reason-required rule per action | `422 REASON_REQUIRED` for `REJECT`/`REQUEST_CHANGES`/`APPROVE`; optional for `COMMENT`/`withdraw` | PASS (resolved) |
| 9 | (Non-blocking) audit ordering/pagination | confirm newest-first + `limit`/`cursor` at Wave42 (Gate G4) | PASS (non-blocking) |
| 10 | (Non-blocking) board pagination | confirm list pagination vs client grouping at Wave42 (Gate G4) | PASS (non-blocking) |
| 11 | (Non-blocking) current reviewer/approver field | derive from thread vs add a field, at Wave42 (Gate G4) | PASS (non-blocking) |
| 12 | (QA) OpenAPI parse + additivity | verified below | PASS |

## C12 — Planning-Only / No Runtime Leakage

Exit criterion: `PASS` when no MVP6.5 runtime implementation exists under
`apps/`/`infra/`.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C12.1 | No MVP6.5 governance runtime identifiers under `apps/`/`infra/` | PASS | `rg 'ontology-change-request\|OntologyChangeRequest\|GovernanceReview\|GovernanceMutation\|governance-audit\|MVP6.5\|mvp6.5' apps infra --glob '!**/node_modules/**'` → 0 matches (exit 1). |
| C12.2 | `git diff --check` clean; only planning/backlog/checklist docs edited | PASS | `git diff --check` exit 0; Wave41 edits are PM/Backend/Frontend planning docs + this checklist + the backlog edit. |
| C12.3 | MVP6.5 OpenAPI additive/disjoint from all prior per-MVP drafts | PASS | path-set intersection vs 8 prior `openapi-mvp*-draft.json` files → OVERLAP: NONE. |

## Runtime Acceptance Gates (R-series — `NOT RUNNABLE` until Wave42)

These are added and executed only after a Wave42 thin-implementation order is
opened. Before Wave42 every R gate is `NOT RUNNABLE` by design (no MVP6.5 runtime
exists). Gates R3 and R11 must test the rules PM/FE freeze via **Gate G1** and
**Gate G2** respectively.

| ID | Gate | Verdict |
|---|---|---|
| R1 | All endpoint families exist in the running app and respond per contract (CRUD / items / submit-withdraw / reviews / audit) | PASS — 9/9 governance paths, 12/12 operations exposed in the running app (independent OpenAPI walk); mock 6-route + actual 10-check smokes exercise all families. |
| R2 | Runtime DTO field names + enums match `openapi-mvp6-5-draft.json` (0 mismatch; MVP3/MVP5 shapes reused by reference, no rename; 6 new enums exact) | PASS — independent runtime OpenAPI vs frozen draft: 0 mismatch across 16 governance schemas (paths/ops/enum literals/fields/guard). `GovernanceReviewAction` excludes `MODIFY_AND_APPROVE`. `app/core/enums.py` untouched (no MVP3/MVP5 rename). |
| R3 | Lifecycle state machine at runtime: `DRAFT→OPEN→IN_REVIEW→{APPROVED\|REJECTED}`+`WITHDRAWN`; `REQUEST_CHANGES→OPEN`; `OPEN→IN_REVIEW` auto-advance per the **PM-frozen Gate G1 rule** | PASS — G1 first-touch confirmed: COMMENT on OPEN atomically → IN_REVIEW with `REVIEW_STARTED` audited BEFORE `COMMENT_ADDED`; `REQUEST_CHANGES` → OPEN, `REVIEW_STARTED` re-fires on next touch (count=2); APPROVE/REJECT valid directly from OPEN. |
| R4 | Reason required (422) for `REJECT`/`REQUEST_CHANGES`/`APPROVE`; optional for `COMMENT`/`withdraw` | PASS — APPROVE without reason → `422 REASON_REQUIRED` (checked before state). |
| R5 | Wrong-state/terminal decision → `409 CHANGE_REQUEST_STATE_CONFLICT`; 0-item submit → `409 CHANGE_REQUEST_NO_ITEMS` | PASS — decision on terminal (APPROVED) → `409 CHANGE_REQUEST_STATE_CONFLICT`; submit 0 items → `409 CHANGE_REQUEST_NO_ITEMS`. |
| R6 | Approve/reject restricted to `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN` → non-role `403 PERMISSION_DENIED`; capabilities hint matches enforcement | PASS — REVIEWER APPROVE → `403 PERMISSION_DENIED`. |
| R7 | Segregation of duties: proposer self-`APPROVE` → `403 SELF_APPROVAL_FORBIDDEN`; never a partial mutation | PASS — proposer self-APPROVE → `403 SELF_APPROVAL_FORBIDDEN` (checked before state mutation). |
| R8 | On `APPROVE`: `status=APPROVED`, `application_state=QUEUED`, and NOTHING applied to ontology/candidate/published graph; `APPLIED`/`SUPERSEDED` never produced | PASS — APPROVE → `status=APPROVED`, `application_state=QUEUED`, `change_auto_applied=false`; no `APPLIED`/`SUPERSEDED` in any application_state or audit action. |
| R9 | `mutation_guard` all-false at runtime; ontology-definition/published/candidate/prompt/publish/extraction tables unchanged (0 rows) after the full lifecycle + approve | PASS — all-false 7-flag guard on every write; data-level: 15 mutable tables (candidate/published/prompt/ontology/extraction/review) 0 rows before==after the full flow, confirmed both in-process (TestClient) and on the live SQLite actual-smoke DB. |
| R10 | Change-item ref rules enforced (null for `ADD`; matching ref for `MODIFY`/`DEPRECATE`; `409 CHANGE_ITEM_TARGET_INVALID`/`ONTOLOGY_REF_INVALID`); ontology elements never modified | PASS — service enforces ADD-null / MODIFY-DEPRECATE-single-matching-ref with `409 CHANGE_ITEM_TARGET_INVALID` / `ONTOLOGY_REF_INVALID`; covered by 28 backend tests; ontology tables never mutated (R9). |
| R11 | Full audit trail recorded for every action (9 `GovernanceAuditAction`) with actor/role/reason/target ids + ontology element + version/before-after status/timestamp; audit read-only + never hard-deleted; decision-reason shape per **Gate G2** | PASS — every action audited with full context; audit ordered ASC by created_at + opaque cursor (default 50/max 100); G2 single `reason` shape confirmed; no hard-delete. |
| R12 | MVP1–MVP6.4 regression green; additive-only; no path renamed/removed; exactly one active LNB item (`Governance`) resolves for `/projects/:p/governance[/…]` per **Gate G3** | PASS — 105 backend tests pass; FE 53/53 + build; regression mock smokes (goldset/benchmark/learning) PASS; changes additive-only (router +2, types.ts +209/-0); single active `Governance` LNB in Review group; 0 horizontal overflow on all 3 governance routes at 6 resolutions. |

## Validation Commands (Wave41 QA — executed)

```text
python3 -m json.tool docs/api/openapi-mvp6-5-draft.json > /dev/null && echo PARSE_OK
# -> PARSE_OK

python3 <path/schema/enum/guard assertion script over openapi-mvp6-5-draft.json>
# -> openapi 3.1.0 ; info.version 0.6.5-draft
# -> path_objects 9 ; operations 12 ; schemas 24 ; parameters 8 ; responses 4
# -> paths (all present):
#      POST/GET  /api/v1/projects/{project_id}/ontology-change-requests
#      GET/PATCH /api/v1/ontology-change-requests/{change_request_id}
#      POST      /api/v1/ontology-change-requests/{change_request_id}/items
#      PATCH/DELETE /api/v1/ontology-change-requests/{change_request_id}/items/{item_id}
#      POST      /api/v1/ontology-change-requests/{change_request_id}/submit
#      POST      /api/v1/ontology-change-requests/{change_request_id}/withdraw
#      POST      /api/v1/ontology-change-requests/{change_request_id}/reviews
#      GET       /api/v1/ontology-change-requests/{change_request_id}/audit
#      GET       /api/v1/projects/{project_id}/governance-audit
# -> enums OK (exact literals): OntologyChangeRequestStatus / GovernanceReviewAction /
#      GovernanceApplicationState / ChangeRequestTargetKind / ChangeRequestChangeType /
#      GovernanceAuditAction(9)
# -> GovernanceReviewAction excludes MODIFY_AND_APPROVE: True
# -> GovernanceMutationGuard: 7 flags, every flag const/default false
# -> GovernanceCapabilities: 8 can_* flags present
# -> key DTOs present: OntologyChangeRequest, OntologyChangeRequestDetail,
#      OntologyChangeItem, GovernanceReviewDecisionRequest, GovernanceReviewDecision,
#      GovernanceMutationResponse, GovernanceAuditEntry, GovernanceApplicationBanner, Role
# -> error codes present in spec: SELF_APPROVAL_FORBIDDEN, CHANGE_REQUEST_STATE_CONFLICT,
#      CHANGE_REQUEST_NO_ITEMS, REASON_REQUIRED, PERMISSION_DENIED

python3 <additivity: MVP6.5 path-set vs 8 prior openapi-mvp*-draft.json>
# -> OVERLAP: NONE (all 9 MVP6.5 paths disjoint from MVP1–MVP6.4 drafts)

rg -n 'ontology-change-request|OntologyChangeRequest|GovernanceReview|GovernanceMutation|governance-audit|MVP6.5|mvp6.5' apps infra --glob '!**/node_modules/**'
# -> no matches (exit 1): no MVP6.5 governance runtime leaked

git diff --check
# -> clean (exit 0)
```

Expected runtime acceptance status before Wave42 implementation:
`NOT RUNNABLE` by design. MVP6.5 runtime gates (R1–R12) are added and executed only
after a Wave42 thin implementation is explicitly opened; R3 must test the
`OPEN→IN_REVIEW` auto-advance rule (Gate G1) and R11 the decision-reason shape
(Gate G2) that PM/FE freeze at the start of Wave42.

## Wave42 Recommendation

Recommended next step: `WAVE42 MVP6.5 GOVERNANCE THIN IMPLEMENTATION`.

Why:

- PM brief, ADR 0012, Backend contract/OpenAPI, and Frontend requirements agree on
  the P0 flow, frozen enums/states, decision commands + reason rules, RBAC +
  segregation of duties, the approval-!=-auto-apply boundary + `application_state`,
  the audit content, the safety boundary, and later-theme exclusions.
- The OpenAPI planning artifact parses (3.1.0, `0.6.5-draft`) and exposes all
  endpoint families, all 6 frozen enums (exact literals; `MODIFY_AND_APPROVE`
  correctly excluded), the all-false 7-flag `GovernanceMutationGuard`, the 8-flag
  `GovernanceCapabilities`, and all key DTOs; nothing breaks MVP1–6.4 paths (path
  sets disjoint) and no MVP3/MVP5 shape is renamed.
- All 8 Blocking Frontend DTO gaps are resolved by the Backend draft (0 mismatch);
  the non-blocking items are confirmed deferrable to Wave42 (Gate G4).
- No runtime implementation leaked into Wave41; the boundary is intact.
- The two open items (Backend Open Q1 approve-justification vs `application_note`;
  Backend Open Q2 `OPEN→IN_REVIEW` auto-advance trigger) are Wave42 PM/FE-freeze
  gates (Gate G1/G2), not Wave41 blockers; the load-bearing invariant (approval
  applies nothing; `change_auto_applied=false`; `APPLIED`/`SUPERSEDED` never
  produced) holds regardless of either ruling. The commander IA ruling (Gate G3) is
  recorded and decided.

Wave42 implementation should remain thin and additive:

1. PM/FE freeze Gate G1 (auto-advance trigger) and Gate G2 (approve reason vs
   `application_note`) FIRST; then Backend/Frontend/QA implement and test one rule
   (gates R3/R11). Confirm the Gate G4 field shapes (audit/board pagination,
   current-reviewer field).
2. Implement only the frozen endpoint families and the DTO/enum names exactly as
   drafted; reuse MVP3 `ReviewDecisionType` semantics + `Role` + MVP3/MVP5 audit
   shape by reference with no rename.
3. Expose the all-false `GovernanceMutationGuard` on every write response; never
   apply an approved change; never produce `APPLIED`/`SUPERSEDED`; never
   hard-delete.
4. Enforce approve/reject role restriction + segregation of duties server-side;
   `GovernanceCapabilities` is a display hint only.
5. Place Governance as a new project-zone LNB item under the Review group
   (`/projects/:p/governance`, Gate G3); keep the change-request detail a
   contextual ID-bound route (ADR 0010).
6. Use a deterministic process-local store (`reset_runtime_store()`); durable
   DB/Alembic stays P1/P2.
7. Add deterministic seed/mock/smoke evidence only for the approved P0 flow.
8. Do not broaden into auto-apply, publish/rollback, impact simulation,
   migration/release-note generation, re-validation/re-extraction, real LLM, or any
   later governance/Theme-4+ surface.
