# MVP 6.5 — Governance Workflow (Ontology Change Request → Review → Approval → Audit) — PM Freeze

Status: `FROZEN / WAVE 41 PM DECISION — CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-01
Backlog: `PM6-023` (governance P0 freeze)

Wave41 is contract-first planning only. No runtime API route, FastAPI service,
DB model, Alembic migration, frontend route/component, seed, smoke, or test is
added this wave. Runtime implementation waits for a Wave42 thin-implementation
order after Backend contract draft + Frontend field/state/IA review + QA
executable checklist are all ready. Mirrors Wave14/19/23/30/33/39.

---

## 1. Theme Choice + Rationale

**Chosen P0: an auditable ontology change-request lifecycle**
(propose → review → approve/reject → audit), commander-directed theme
(`04_...md` §6 "Theme 3 — 온톨로지 거버넌스").

Why this is the smallest coherent governance P0 (and what is deliberately cut):

- The roadmap's full governance theme (`§6.2`/`§6.4`) is large: change proposal,
  **automatic impact analysis**, reviewer assignment, approve/reject workflow,
  **automatic release-note generation**, **migration-plan generation**, and
  **post-change re-validation/re-extraction job creation**, plus
  `OntologyImpactReport`/`OntologyMigrationPlan`/`OntologyReleaseNote` objects
  and `.../publish` + `.../rollback` endpoints. Shipping all of that as P0 would
  reopen the ontology-edit, publish, and extraction surfaces at once.
- The **smallest coherent slice** is the lifecycle spine only: a change request
  is a *proposal record*, review is *comment / request-changes*, decision is
  *approve/reject with reason*, and everything is *audited*. This delivers the
  "조직적 승인 프로세스" value with a single new decision surface and one hard
  safety boundary, and it reuses shipped MVP3 review-decision + MVP5 RBAC + audit
  vocabulary rather than inventing new ones.
- The dangerous part of the roadmap theme — the `.../publish`, `.../rollback`,
  and re-validation/re-extraction steps — is **explicitly deferred**. In P0 an
  approval only records intent; actual application flows through the existing
  MVP1 ontology-edit path and MVP3 publish path in a later slice. This preserves
  candidate/published separation and "no autonomous publish".
- Impact simulation is its own roadmap theme (`§7 Theme 4`) and is out of P0.

This theme is named **MVP6.5** (6.1/6.2/6.3/6.4 are closed). It is a
candidate/analysis-layer (governance) decision surface only. It does **not**
touch the ontology definition, candidates, prompts, or the published graph.

---

## 2. P0 Demo Flow (frozen)

```text
select project
-> open Governance (change-request board, under the Review group)
-> propose a change request:
     title + summary + one or more change items, each naming
     target_kind (CLASS / PROPERTY / RELATION),
     change_type (ADD / MODIFY / DEPRECATE),
     the target ontology element ref (null for ADD) + ontology_version_id,
     and a proposed-change note/payload (stored as intent only)
-> submit the request (DRAFT -> OPEN)
-> a reviewer opens it (OPEN -> IN_REVIEW), adds a COMMENT, or REQUEST_CHANGES
     (with reason -> back to OPEN for the proposer to revise)
-> an approver APPROVES (with justification) or REJECTS (with reason)
     -> APPROVED: request is terminal-approved AND queued as intent
        (application_state = QUEUED); NOTHING is applied to the ontology or the
        published graph
     -> REJECTED: terminal, with reason
-> open the audit trail: every action (actor, action, reason, timestamp,
     target change item + ontology element + version context, before/after
     state) is listed
-> confirm the "approved = queued intent, not yet applied" banner: the ontology
     definition and published graph are unchanged; application is a later slice
```

Non-reviewers/non-approvers can view requests, items, the review thread, and the
audit trail, but every review/decision action is gated and returns a
permission/conflict state instead of mutating. The proposer cannot approve their
own request (segregation of duties).

---

## 3. Existing Artifacts This Touches

Reuse by reference; **no renames** of any MVP3 / MVP5 shape or enum.

| Existing artifact | How MVP6.5 relates to it |
|---|---|
| `ReviewDecisionType` (`APPROVE`/`REJECT`/`REQUEST_CHANGES`/`MODIFY_AND_APPROVE`, `core/enums.py`) | Governance decision semantics mirror it by reference. P0 reuses `APPROVE`/`REJECT`/`REQUEST_CHANGES` meaning + adds `COMMENT`; `MODIFY_AND_APPROVE` is intentionally excluded (governance approval never inline-applies). The new `GovernanceReviewAction` enum reuses these literals verbatim (no rename). |
| `Role` enum (`SYSTEM_ADMIN`/`PROJECT_ADMIN`/`ONTOLOGY_MANAGER`/`DATA_MANAGER`/`EXTRACTION_MANAGER`/`REVIEWER`/`VIEWER`/`API_CLIENT`) | Reused verbatim for gating. Propose = any project member; review/comment/request-changes = `REVIEWER`+elevated; approve/reject = `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`. No new role literal. |
| MVP3 audit shape + `AuditEventType` (`core/enums.py`), MVP5 audit/security-event expectations (ADR 0008) | Governance audit entries reuse the audit record shape by reference; a new `GovernanceAuditAction` enum names governance-specific events (it does not rename `AuditEventType`). |
| Ontology definition (`OntologyElementStatus` `DRAFT`/`ACTIVE`/`ARCHIVED`/`DELETED`, `ontology_class_id`/`ontology_property_id`/`ontology_relation_id`, `ontology_version_id`) | READ-ONLY reference target of a change item. Governance renders element context but never writes the ontology. `DEPRECATE` proposes retirement; it does not set `OntologyElementStatus`. |
| MVP3 review/publish modules + ADR 0006, MVP5 governance + ADR 0008 | Prior-art for the review/decision/audit/RBAC pattern; MVP6.5 adds its own governance surface and does not reuse MVP3 candidate-review or MVP3 publish endpoints. |
| MVP6.2/6.4 all-false mutation-guard precedent (ADR 0011) | Reused as the pattern for the all-false `GovernanceMutationGuard` on every governance write response. |

---

## 4. Enums / States (frozen)

New names are MVP6.5-scoped and must not collide with MVP3–MVP6.4 names.

### `OntologyChangeRequestStatus` (request lifecycle)
- `DRAFT` — being authored by the proposer; not yet visible for review; mutable
  by the proposer.
- `OPEN` — submitted; awaiting a reviewer to pick it up. `REQUEST_CHANGES`
  returns a request here so the proposer can revise without re-creating.
- `IN_REVIEW` — a reviewer is actively reviewing (mirrors MVP3
  `ReviewTaskStatus.IN_REVIEW` semantics by concept).
- `APPROVED` — terminal decision: approved with justification. The request is
  simultaneously queued as intent (see `application_state`). No auto-apply.
- `REJECTED` — terminal decision: rejected with reason.
- `WITHDRAWN` — the proposer withdrew the request from `DRAFT`/`OPEN`/
  `IN_REVIEW`; terminal.

At most the proposer edits change items while `DRAFT`/`OPEN`. Once `APPROVED`/
`REJECTED`/`WITHDRAWN`, the request is immutable; a mutating/decision call on a
terminal (or wrong-state) request returns `409 CHANGE_REQUEST_STATE_CONFLICT`.

### `GovernanceApplicationState` (post-approval intent lifecycle — orthogonal)
This field is what makes the approval-!=-auto-apply boundary explicit and
inspectable.
- `NOT_APPLICABLE` — request is not (yet) `APPROVED`; default for all non-approved
  states.
- `QUEUED` — request is `APPROVED`; the approved change is recorded as **intent
  awaiting a later, separately-initiated, separately-audited application slice**.
  P0 stops here.
- `APPLIED` — RESERVED for the later application slice. NOT produced by any P0
  operation.
- `SUPERSEDED` — RESERVED for the later application slice. NOT produced by any P0
  operation.

### `GovernanceReviewAction` (decision commands)
Reuses MVP3 `ReviewDecisionType` literals verbatim where they overlap; adds
`COMMENT`. `MODIFY_AND_APPROVE` is intentionally NOT included.
- `COMMENT` — add a note to the review thread; does not change request state
  (except an `OPEN` request auto-advances to `IN_REVIEW` on first reviewer touch).
- `REQUEST_CHANGES` — send back to the proposer; **reason required**; state
  `IN_REVIEW`/`OPEN` -> `OPEN`.
- `APPROVE` — approve; **justification/reason required**; state -> `APPROVED`,
  `application_state` -> `QUEUED`. Approver must not be the proposer.
- `REJECT` — reject; **reason required**; state -> `REJECTED`.

Commands: `submit` (`DRAFT` -> `OPEN`), `withdraw` (-> `WITHDRAWN`, reason
optional). `submit`/`withdraw` are proposer actions, not review actions, so they
are not part of `GovernanceReviewAction`.

### Change-item target + type enums
- `ChangeRequestTargetKind`: `CLASS`, `PROPERTY`, `RELATION`.
- `ChangeRequestChangeType`: `ADD`, `MODIFY`, `DEPRECATE`.

Each change item: `target_kind`, `change_type`, target element ref
(`ontology_class_id`/`ontology_property_id`/`ontology_relation_id`; null for
`ADD`), `ontology_version_id` context, and a `proposed_change` note/payload
stored as intent only.

### Governance audit action (`GovernanceAuditAction`)
- `CHANGE_REQUEST_CREATED`, `CHANGE_REQUEST_UPDATED`, `CHANGE_REQUEST_SUBMITTED`,
  `CHANGE_REQUEST_WITHDRAWN`, `REVIEW_STARTED`, `COMMENT_ADDED`,
  `CHANGES_REQUESTED`, `CHANGE_REQUEST_APPROVED`, `CHANGE_REQUEST_REJECTED`.

Every action records: actor id + role, action, reason/note where applicable,
target change-request id + change-item ids, target ontology element(s) +
`ontology_version_id` context, before/after request state, and timestamp.
Audit-only; it does not mutate any non-governance surface.

---

## 5. Approval-Is-Intent-Not-Auto-Apply Decision (critical)

This is the load-bearing decision of the theme, recorded durably in ADR 0012.

- **Approval records intent + audit only.** An `APPROVED` change request is
  QUEUED (`application_state=QUEUED`) as a decision of record. In P0, approval
  does NOT apply the change to the ontology definition, the candidate graph, or
  the published graph, and does NOT start a publish or extraction job.
- **"Approved" means:** a decision of record exists — actor + role + reason +
  timestamp + target element(s) + `ontology_version_id` context — authorizing a
  future application that has not yet happened.
- **What is explicitly deferred (application/enforcement):** the actual mutation
  of the ontology (via the existing MVP1 ontology-edit path) and of the published
  graph (via the existing MVP3 review/publish path) is a LATER slice, initiated
  by a human as a separate, separately-audited action. `application_state`
  values `APPLIED` and `SUPERSEDED` are RESERVED for that later slice and are not
  produced by any P0 operation. Automatic enforcement, autonomous/agent publish,
  and rollback are out of P0.
- **Inspectable proof.** Every governance write response exposes an all-false
  `GovernanceMutationGuard` (see §6). The `application_state` field makes the
  "queued, not applied" status first-class and visible in the UI.

---

## 6. Safety Boundary (frozen)

Governance is **candidate/analysis-layer (decision-record) only**. It must NOT:
- mutate the ontology definition, ontology elements, or ontology versions (it
  only *references* `ontology_class_id`/`ontology_property_id`/
  `ontology_relation_id` + `ontology_version_id`);
- mutate the published graph, published entities/relations, or any publish path;
  start a publish job; or perform a rollback;
- mutate candidate entities/relations, candidate review state, prompts, or
  prompt versions;
- start an extraction job or any re-validation/re-extraction job;
- auto-apply an approved change to any surface (`change_auto_applied` is always
  false);
- hard-delete a change request or audit entry (withdraw/terminal states only).

Every governance write response must expose an all-false mutation guard
(`GovernanceMutationGuard`) mirroring the MVP6.2/6.4 audit-only pattern:
`ontology_definition_mutated: false`, `published_graph_mutated: false`,
`candidate_graph_mutated: false`, `prompt_version_mutated: false`,
`publish_job_started: false`, `extraction_job_started: false`,
`change_auto_applied: false`.

RBAC (reuse shipped `Role`, no new literal): any project member may propose;
`REVIEWER` (and elevated `PROJECT_ADMIN`/`ONTOLOGY_MANAGER`/`SYSTEM_ADMIN`) may
review/comment/request-changes; the approve/reject decision is restricted to
`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`. The proposer may not approve
their own request (segregation of duties). Unauthorized actions return `403`;
wrong-state actions return `409`.

Reason rules: `REJECT`, `REQUEST_CHANGES`, and `APPROVE` require a non-empty
reason/justification; `COMMENT` and `WITHDRAW` reasons are optional.

---

## 7. Explicit Exclusions (out of MVP6.5 P0)

- **Auto-apply** of an approved change to the ontology definition or the
  published graph. (Application is a later, human-initiated slice via the
  existing MVP1 ontology-edit + MVP3 publish paths.)
- **Automatic enforcement**, autonomous/agent publish, and **rollback**.
- **Impact simulation / impact analysis reports** (`OntologyImpactReport`,
  roadmap §7 Theme 4).
- **Migration-plan generation** (`OntologyMigrationPlan`) and **automatic
  release-note generation** (`OntologyReleaseNote`).
- **Post-change re-validation / re-extraction job creation.**
- Ontology diff visualization beyond a plain change-item summary; automatic
  reviewer assignment / load-balancing (manual is P0, as with MVP3).
- Real LLM/provider execution; copilot/agent runtime; connector/plugin SDK;
  multi-tenant runtime.
- Durable DB/Alembic persistence is NOT required for the P0 thin slice; a
  deterministic process-local store (the proven MVP6.1–6.4 pattern, with
  `reset_runtime_store()`) is acceptable. Durable persistence remains P1/P2.

---

## 8. Durable Invariants Preserved

- LLM/eval/governance output never writes to the published graph or the
  ontology definition; it stays in the candidate/analysis (governance/decision)
  layer. ✔
- Candidate graph and published graph remain separated; approval is intent, not
  application. ✔
- Evidence, ontology version, model run, and audit-log traceability preserved
  (every decision is audited with actor/action/reason/timestamp/target element +
  version context). ✔
- No autonomous publish, no automatic enforcement, no auto-apply, no real LLM
  execution in P0. ✔
- Additive only — no MVP1–MVP6.4 path/enum/smoke is broken; new objects/enums
  are additive and reuse MVP3 review-decision / MVP3/MVP5 audit / `Role` shapes
  by reference (no renames). ✔

---

## 9. Handoff Notes (what the next roles should produce)

- **Backend (`BE6-036`~`BE6-039`)**: draft additive endpoint families + DTO/enum
  names in `docs/api/MVP6_5_GOVERNANCE_API_CONTRACT_DRAFT.md` and an OpenAPI
  planning artifact `docs/api/openapi-mvp6-5-draft.json` (OpenAPI 3.1.0,
  additive/disjoint to MVP1–MVP6.4 paths, version label `0.6.5-draft`). Reuse
  `ReviewDecisionType` semantics + `Role` + the MVP3/MVP5 audit shape by
  reference (no rename). Define: change-request CRUD (create/list/get + proposer
  update while `DRAFT`/`OPEN`); `submit`; `withdraw`; review actions
  (`comment` / `request-changes`); `approve` / `reject` with reason; audit-log
  GET; the `GovernanceMutationGuard` (all-false, 7 flags) on every write
  response; the audit entry shape; `application_state` (`QUEUED` on approve,
  `APPLIED`/`SUPERSEDED` reserved). Capture open questions (esp. the exact
  reviewer-touch `OPEN`->`IN_REVIEW` auto-advance timing, and whether `approve`
  requires a distinct `application_note` vs the decision reason).
- **Frontend (`FE6-057`~`FE6-060`)**: document Governance route/IA —
  project-scoped, contextual under the **Review group** (per ADR 0010 no ID-bound
  pages in the global LNB). Specify required fields and first-class
  loading/empty/error/permission states for: the change-request board/list
  (by state), the propose form (title/summary + change items with
  `ChangeRequestTargetKind`/`ChangeRequestChangeType` + element ref +
  version context), the change-request detail (change items + review thread +
  decision panel), the reviewer/approver permission-boundary UX, reason-required
  decision inputs, the audit-trail view, and the **explicit "approved = queued
  intent, not yet applied" banner** (surface `application_state`). Apply the
  closed design language (tokens, Section+Card, KO titles, D6 status badges, one
  primary action). List any DTO gaps vs the Backend draft.
- **QA (`INT6-043`~`INT6-046`)**: executable acceptance checklist (continue
  `INT6-*` from INT6-043) in a backlog doc verifying PM/BE/FE agreement on the
  P0 flow, states/enums, decision commands + reason rules, RBAC + segregation of
  duties, the approval-!=-auto-apply boundary + `application_state`, the audit
  content, safety boundary, and exclusions; OpenAPI parse/additivity; the
  all-false `GovernanceMutationGuard`; and no runtime leakage under
  `apps/`/`infra/`. Recommend Wave42 thin implementation, hardening, or PM
  redesign.

---

## 10. Wave42 Gate Freeze (PM6-024 — THIN IMPLEMENTATION)

Status: `FROZEN / WAVE 42 PM DECISION — BLOCKS BACKEND + FRONTEND + QA`.
Wave42 implements the smallest deterministic runtime/UI slice of the P0 loop. PM
freezes the three Wave41 open gates and ratifies the commander IA ruling before
Backend/Frontend start. These rulings refine the Backend contract draft §"Open
Questions for Frontend / QA" #1, #2, #3 and the Frontend DTO gaps #9/#10/#11.
Scope is unchanged (frozen P0 + the endpoint families in §"Additive Endpoint
Families" only); every acceptance gate below is restated verbatim, nothing added.

### G1 — OPEN→IN_REVIEW auto-advance = **first-touch** (frozen, one rule)

The first **review action** recorded against an `OPEN` request auto-advances it.
Concretely: when a `COMMENT` or `REQUEST_CHANGES` is recorded on a request whose
`status == OPEN`, that single write atomically sets `status=IN_REVIEW` and audits
`REVIEW_STARTED` **before** the action's own audit event (`COMMENT_ADDED` for
`COMMENT`, `CHANGES_REQUESTED` for `REQUEST_CHANGES`). There is **no** separate
explicit "start review" endpoint/action (chosen for simplicity — a distinct
action buys no P0 value and adds a state edge).

Edge rules (frozen):
- `APPROVE`/`REJECT` are valid directly from `OPEN` (no `IN_REVIEW`
  precondition); they transition to the terminal state and do **not** emit
  `REVIEW_STARTED`. (Reviewer-touch is a convenience, not a gate on decisions.)
- `REQUEST_CHANGES` from `OPEN` (no reviewer has touched yet) is allowed, fires
  `REVIEW_STARTED` then `CHANGES_REQUESTED`, and returns the request to `OPEN`.
- When a request is returned to `OPEN` by `REQUEST_CHANGES`, the **next**
  reviewer touch re-fires `REVIEW_STARTED` (once per OPEN episode).
- A `COMMENT`/`REQUEST_CHANGES` on an already-`IN_REVIEW` request does **not**
  re-emit `REVIEW_STARTED` (only the transition emits it).

### G2 — approve justification = **single `reason` field** (frozen)

`APPROVE` reuses the one `reason` field on `GovernanceReviewDecisionRequest`.
There is **no** separate `application_note`. `reason` is required + non-empty for
`APPROVE` (as for `REJECT`/`REQUEST_CHANGES`) → `422 REASON_REQUIRED` when
missing/blank. (A distinct application note describes a later application slice
that P0 does not perform, so it is out of scope.)

### G3 — IA = **new project-zone LNB item under Review** (ratified, commander-ruled)

Governance is a NEW project-zone LNB item under the **Review** group at
`/projects/:p/governance`. The change-request detail (`/governance/:id`) is a
**contextual ID-bound route** (ADR 0010), reached from the board row/breadcrumb —
NOT an LNB item. Exactly one active LNB item per route is preserved; breadcrumb
is `프로젝트명 > Governance > 변경 요청 #<id>`. This is the commander ruling
(not the zero-new-item fallback); recorded here for the record.

### G4 — FE field shapes (confirmed, minimal)

- **Audit ordering + pagination:** both audit reads
  (`GET .../{change_request_id}/audit`, `GET
  /api/v1/projects/{project_id}/governance-audit`) return **chronological
  ascending** (oldest → newest) so the audit trail reads as an append-only
  timeline; `limit`/`cursor` opaque-cursor pagination (default 50, max 100). The
  UI may present newest-first by reversing the loaded page; the wire order is asc.
- **Board list pagination:** `limit`/`cursor` opaque-cursor pagination (default
  50, max 100). The board groups by `OntologyChangeRequestStatus` **client-side**
  within the loaded page (no server-side per-status paging in P0).
- **Current-reviewer field on the list DTO: NO — do not add.**
  `OntologyChangeRequest` stays exactly as drafted (`proposer_id`, `item_count`,
  status/application_state, timestamps, `decided_by`). The board derives the
  current reviewer/approver from the latest `GovernanceReviewDecision` shown on
  the detail; it is not needed on the list row for P0. Keeps the list DTO minimal
  and avoids a denormalized, staleness-prone field.

### Scope Guard (unchanged) + Acceptance Gates (restated)

Scope is unchanged: the frozen P0 flow + the §"Additive Endpoint Families"
(A change-request CRUD, B change-item, C submit/withdraw, D `.../reviews`,
E audit) only. Backend/Frontend/QA must hit, verbatim:
- **Approval = QUEUED, not applied:** `APPROVE` → `status=APPROVED`,
  `application_state=QUEUED`, `change_auto_applied=false`; NOTHING applied to the
  ontology definition / published graph / candidates / prompts; `APPLIED` and
  `SUPERSEDED` are RESERVED and **never produced** by any P0 operation.
- **All-false 7-flag `GovernanceMutationGuard`** on every write response
  (`ontology_definition_mutated`, `published_graph_mutated`,
  `candidate_graph_mutated`, `prompt_version_mutated`, `publish_job_started`,
  `extraction_job_started`, `change_auto_applied` — all `false`).
- **Authz + segregation:** `APPROVE`/`REJECT` restricted to
  `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN` (else `403 PERMISSION_DENIED`);
  approver != proposer (`403 SELF_APPROVAL_FORBIDDEN` on self-`APPROVE`).
- **Reason required** for `REJECT`/`REQUEST_CHANGES`/`APPROVE` → `422
  REASON_REQUIRED` when blank; optional for `COMMENT`/`withdraw`.
- **State conflicts:** decision/mutation on a terminal or wrong-state request →
  `409 CHANGE_REQUEST_STATE_CONFLICT`; `submit` with 0 items → `409
  CHANGE_REQUEST_NO_ITEMS`.
- **No renames** of any MVP3 (`ReviewDecisionType`, audit shape) or MVP5 (`Role`,
  audit) shape/enum; reuse verbatim by reference.

Contract-draft impact for Backend: adopt G1 first-touch (draft §Open Questions #1
default confirmed), G2 single `reason` (#2 default confirmed), G4 audit asc +
`limit`/`cursor` (#3 confirmed). No DTO/enum add or rename; `OntologyChangeRequest`
unchanged (G4 current-reviewer = NO). The `openapi-mvp6-5-draft.json` field/enum
names are frozen as-is and Backend must match them exactly at implementation.
