# MVP 6.5 — Governance Workflow (Ontology Change Request → Review → Approval → Audit) API Contract Draft

Status: `WAVE 41 CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-01
Backlog: `BE6-036`~`BE6-039` (theme `PM6-023`; Frontend `FE6-057`~`FE6-060`; QA `INT6-043`~`INT6-046`)

This draft defines an additive, **candidate/analysis-layer (governance/decision-record)**
contract for an auditable ontology **change-request lifecycle**: propose → submit
→ reviewer comment / request-changes → approver approve / reject → the approved
request is **QUEUED as intent only** → full audit trail. Approval records intent
+ audit; it applies **nothing** to the ontology definition or the published
graph. It introduces no ontology-edit path, no publish/rollback engine, no
impact/migration/release-note generation, no re-validation/re-extraction job, and
no LLM/provider execution.

Canonical machine-readable planning artifact:
`docs/api/openapi-mvp6-5-draft.json` (OpenAPI 3.1.0, `info.version` `0.6.5-draft`).

Wave41 is contract-first planning only. This draft does **not** implement FastAPI
routes, runtime services, database models, migrations, seed data, workers, or
tests. Runtime implementation waits for a Wave42 thin-implementation order after
Frontend field/state/IA review (`FE6-057`~`FE6-060`) and a QA executable checklist
(`INT6-043`~`INT6-046`) are ready.

Frozen by `docs/pm/MVP6_5_GOVERNANCE_BRIEF.md` and
`docs/adr/0012-mvp6-5-governance-approval-not-auto-apply-boundary.md`. Where the
PM brief / ADR 0012 and this draft differ on a name, the PM brief + ADR win; this
draft only refines field names the PM brief explicitly delegated to Backend.

## Contract Principles

- MVP6.5 is **additive**. Existing MVP1–MVP6.4 paths, schemas, and enums are not
  renamed, moved, or removed. New paths live under a disjoint
  `/api/v1/.../change-requests` family.
- Governance is a **decision-record surface only**. It creates/edits proposal
  records, records review/decision events, and reads an audit trail. It executes
  no ontology edit, no publish, no rollback, no extraction, no LLM call, and
  **never applies an approved change** to any non-governance surface.
- **No reuse-by-rename.** MVP3 `ReviewDecisionType` literals, the shipped `Role`
  enum, and the MVP3/MVP5 audit shape are reused **verbatim / by reference**. New
  MVP6.5 enum/DTO names are additive and must not collide with MVP3–MVP6.4 names.
- DTO/schema names use PascalCase. JSON fields use snake_case. Enum literals use
  UPPER_SNAKE_CASE.
- Every governance **write** response carries an all-false `GovernanceMutationGuard`
  (7 flags) mirroring the MVP6.2/6.4 audit-only pattern.
- Change requests are **soft-lifecycle only**: `WITHDRAWN`/`APPROVED`/`REJECTED`
  are terminal; a change request or audit entry is **never hard-deleted**.

## Preserved MVP1–MVP6.4 Boundary

- A change request is a **proposal in the candidate/analysis (governance) layer**.
  Approval records intent + audit; it does NOT mutate the ontology definition, an
  ontology element, an ontology version, the candidate graph, the published graph,
  prompts, or prompt versions, and it starts no publish or extraction job.
- Change items **reference** `ontology_class_id` / `ontology_property_id` /
  `ontology_relation_id` + `ontology_version_id` only. `DEPRECATE` proposes
  retirement; it never sets `OntologyElementStatus`. The module reads ontology
  definitions to render context; it never writes them.
- Actual application of an approved change is a **later, separately-initiated,
  separately-audited slice** via the existing MVP1 ontology-edit path and MVP3
  review/publish path. `GovernanceApplicationState` values `APPLIED` /
  `SUPERSEDED` are RESERVED for that slice and are **never produced by any P0
  operation**.
- Durable DB/Alembic persistence is **not required** for the P0 thin slice; the
  proven deterministic process-local store (with `reset_runtime_store()`) is
  acceptable. Durable persistence remains P1/P2.

## Reused Artifacts (verbatim, not redefined)

Referenced by reference; **no renames**.

| Reused artifact | Role in MVP6.5 |
|---|---|
| `ReviewDecisionType` (`APPROVE`/`REJECT`/`REQUEST_CHANGES`/`MODIFY_AND_APPROVE`, `core/enums.py`) | Governance decision semantics mirror it. `GovernanceReviewAction` reuses the `APPROVE`/`REJECT`/`REQUEST_CHANGES` literals **verbatim** and adds `COMMENT`. `MODIFY_AND_APPROVE` is intentionally **excluded** (governance approval never inline-applies). |
| `Role` enum (`SYSTEM_ADMIN`/`PROJECT_ADMIN`/`ONTOLOGY_MANAGER`/`DATA_MANAGER`/`EXTRACTION_MANAGER`/`REVIEWER`/`VIEWER`/`API_CLIENT`, `core/enums.py`) | Reused verbatim for gating. Propose = any project member; review/comment/request-changes = `REVIEWER` + elevated; approve/reject = `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`. **No new role literal.** |
| MVP3/MVP5 audit shape + `AuditEventType` (`core/enums.py`), `AuditLog` (`modules/audit/schemas.py`: `actor_id`, action, `metadata`, timestamp) | The governance audit entry reuses the audit record shape by reference; the new `GovernanceAuditAction` enum names governance-specific events and does **not** rename `AuditEventType`. |
| Ontology definition (`OntologyElementStatus`, `ontology_class_id`/`ontology_property_id`/`ontology_relation_id`, `ontology_version_id`) | READ-ONLY reference target of a change item. Never written. |
| MVP6.2/6.4 all-false mutation-guard precedent (ADR 0011, `GoldAuthoringMutationGuard`) | Pattern mirrored by the all-false `GovernanceMutationGuard`. |

## New Enums (MVP6.5 only — frozen by PM brief §4, used verbatim)

### `OntologyChangeRequestStatus` (request lifecycle)

```text
DRAFT       being authored by the proposer; not yet visible for review; proposer-mutable
OPEN        submitted; awaiting a reviewer to pick it up. REQUEST_CHANGES returns here.
IN_REVIEW   a reviewer is actively reviewing (mirrors MVP3 ReviewTaskStatus.IN_REVIEW by concept)
APPROVED    terminal decision: approved with justification; simultaneously QUEUED as intent
REJECTED    terminal decision: rejected with reason
WITHDRAWN   proposer withdrew from DRAFT/OPEN/IN_REVIEW; terminal
```

State machine (frozen):
`DRAFT --submit--> OPEN --(reviewer touch)--> IN_REVIEW`;
`{OPEN|IN_REVIEW} --REQUEST_CHANGES--> OPEN`;
`{OPEN|IN_REVIEW} --APPROVE--> APPROVED`; `{OPEN|IN_REVIEW} --REJECT--> REJECTED`;
`{DRAFT|OPEN|IN_REVIEW} --withdraw--> WITHDRAWN`.
`APPROVED`/`REJECTED`/`WITHDRAWN` are terminal and immutable. The proposer may
edit the request + change items only while `DRAFT`/`OPEN`. A mutating/decision
call on a terminal or wrong-state request returns
`409 CHANGE_REQUEST_STATE_CONFLICT`.

### `GovernanceApplicationState` (post-approval intent lifecycle — orthogonal)

```text
NOT_APPLICABLE  request is not (yet) APPROVED; default for all non-approved states
QUEUED          request is APPROVED; recorded as INTENT awaiting a later, separately-audited
                application slice. P0 stops here.
APPLIED         RESERVED for the later application slice. NOT produced by any P0 operation.
SUPERSEDED      RESERVED for the later application slice. NOT produced by any P0 operation.
```

This field is the inspectable proof of the approval-!=-auto-apply boundary.
`APPROVE` sets `application_state=QUEUED`; every other state has
`application_state=NOT_APPLICABLE`.

### `GovernanceReviewAction` (decision commands)

Reuses MVP3 `ReviewDecisionType` literals verbatim where they overlap; adds
`COMMENT`. `MODIFY_AND_APPROVE` is intentionally NOT included.

```text
COMMENT           add a note to the review thread; no state change (an OPEN request auto-advances
                  to IN_REVIEW on first reviewer touch). Reason/note optional.
REQUEST_CHANGES   send back to proposer; REASON REQUIRED; {IN_REVIEW|OPEN} -> OPEN
APPROVE           approve; JUSTIFICATION/REASON REQUIRED; -> APPROVED, application_state -> QUEUED;
                  approver must not be the proposer
REJECT            reject; REASON REQUIRED; -> REJECTED
```

`submit` (`DRAFT` -> `OPEN`) and `withdraw` (-> `WITHDRAWN`, reason optional) are
**proposer** actions, not review actions, so they are not part of
`GovernanceReviewAction`.

### Change-item target + type enums

```text
ChangeRequestTargetKind:  CLASS, PROPERTY, RELATION
ChangeRequestChangeType:  ADD, MODIFY, DEPRECATE
```

Each change item: `target_kind`, `change_type`, target element ref
(`ontology_class_id`/`ontology_property_id`/`ontology_relation_id`; null for
`ADD`), `ontology_version_id` context, and a `proposed_change` note/payload stored
as intent only.

### `GovernanceAuditAction` (audit log — the 9 actions, verbatim)

```text
CHANGE_REQUEST_CREATED
CHANGE_REQUEST_UPDATED
CHANGE_REQUEST_SUBMITTED
CHANGE_REQUEST_WITHDRAWN
REVIEW_STARTED
COMMENT_ADDED
CHANGES_REQUESTED
CHANGE_REQUEST_APPROVED
CHANGE_REQUEST_REJECTED
```

Every action records: actor id + role, action, reason/note where applicable,
target change-request id + change-item ids, target ontology element(s) +
`ontology_version_id` context, before/after request state, and timestamp.
Audit-only; it mutates no non-governance surface.

## `GovernanceMutationGuard` (all-false on every write response)

The 7 flags from the brief, all `false` for every MVP6.5 write response:

```json
{
  "ontology_definition_mutated": false,
  "published_graph_mutated": false,
  "candidate_graph_mutated": false,
  "prompt_version_mutated": false,
  "publish_job_started": false,
  "extraction_job_started": false,
  "change_auto_applied": false
}
```

`change_auto_applied: false` is the boundary proof: no approval ever applies a
change to any surface; approval only sets `application_state=QUEUED`.

## Authorization Model (RBAC — reuse shipped `Role`, no new literal)

- **Read** (list/get change requests, items, review thread, audit log): any
  project member (incl. `VIEWER`).
- **Propose / update-while-draft-or-open / submit / withdraw**: the proposer (any
  project member author of the request). Withdraw is proposer-only.
- **Review actions** (`COMMENT`, `REQUEST_CHANGES`): `REVIEWER` and elevated
  (`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`).
- **Decision actions** (`APPROVE`, `REJECT`): restricted to
  `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`.
- **Segregation of duties**: the proposer may **not** approve their own request →
  `403 SELF_APPROVAL_FORBIDDEN` (approve only). Reject/request-changes on one's own
  request is likewise disallowed for a proposer acting only as author.
- Unauthorized actions return `403 PERMISSION_DENIED` and never a partial
  mutation. Every list/get/write response carries a read-only
  `GovernanceCapabilities` hint (`can_view`, `can_edit_request`, `can_submit`,
  `can_withdraw`, `can_comment`, `can_request_changes`, `can_approve`,
  `can_reject`) so the UI disables actions it lacks permission for. The hint is
  display-only; authorization is enforced server-side and never widens the
  boundary.

## Reason Rules (frozen)

- `REJECT`, `REQUEST_CHANGES`, `APPROVE`: **non-empty `reason` required** →
  `422 REASON_REQUIRED` (or `400`) when missing/blank.
- `COMMENT`: `note`/`reason` optional.
- `withdraw`: `reason` optional.

## Additive Endpoint Families

All additive, project-scoped where collection-shaped, disjoint from MVP1–MVP6.4
paths. `{change_request_id}` / `{item_id}` are path params on contextual resource
paths (per ADR 0010, no ID-bound page in the global LNB).

### A. Change-request CRUD (propose / list / get / update-while-draft-or-open)

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-036 | `POST` | `/api/v1/projects/{project_id}/ontology-change-requests` | Propose a change request (title + summary + change items) → `DRAFT` (`CHANGE_REQUEST_CREATED`) |
| BE6-036 | `GET` | `/api/v1/projects/{project_id}/ontology-change-requests` | List change requests (filter by `status`, `application_state`, proposer) |
| BE6-036 | `GET` | `/api/v1/ontology-change-requests/{change_request_id}` | Get one change request (items + review thread + decision + capabilities) |
| BE6-036 | `PATCH` | `/api/v1/ontology-change-requests/{change_request_id}` | Update title/summary while `DRAFT`/`OPEN` (proposer) (`CHANGE_REQUEST_UPDATED`) |

### B. Change-item management (proposer, while DRAFT/OPEN)

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-037 | `POST` | `/api/v1/ontology-change-requests/{change_request_id}/items` | Add a change item (`target_kind`/`change_type`/element ref/`ontology_version_id`/`proposed_change`) |
| BE6-037 | `PATCH` | `/api/v1/ontology-change-requests/{change_request_id}/items/{item_id}` | Edit a change item |
| BE6-037 | `DELETE` | `/api/v1/ontology-change-requests/{change_request_id}/items/{item_id}` | Remove a change item from a `DRAFT`/`OPEN` request (removes from proposal only; touches no ontology) |

### C. Lifecycle (proposer submit / withdraw)

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-038 | `POST` | `/api/v1/ontology-change-requests/{change_request_id}/submit` | `DRAFT` -> `OPEN` (`CHANGE_REQUEST_SUBMITTED`); requires ≥1 change item |
| BE6-038 | `POST` | `/api/v1/ontology-change-requests/{change_request_id}/withdraw` | `{DRAFT|OPEN|IN_REVIEW}` -> `WITHDRAWN` (`CHANGE_REQUEST_WITHDRAWN`); reason optional |

### D. Review + decision (reviewer / approver)

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-038 | `POST` | `/api/v1/ontology-change-requests/{change_request_id}/reviews` | Record a `GovernanceReviewAction` decision (`COMMENT`/`REQUEST_CHANGES`/`APPROVE`/`REJECT`) |

Single decision endpoint keyed by `action` (mirrors MVP3 `ReviewDecisionCreateRequest`).
`COMMENT` on an `OPEN` request auto-advances it to `IN_REVIEW` (`REVIEW_STARTED`).
`APPROVE` sets `status=APPROVED`, `application_state=QUEUED`, applies nothing.

### E. Governance audit log (read-only)

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-039 | `GET` | `/api/v1/ontology-change-requests/{change_request_id}/audit` | List `GovernanceAuditEntry` rows for a request (actor, action, reason, before/after state, target ids, timestamp) |
| BE6-039 | `GET` | `/api/v1/projects/{project_id}/governance-audit` | Project-scoped governance audit feed (filter by `action`, `change_request_id`) |

### Query parameters

| Query | Type | Applies to | Notes |
|---|---|---|---|
| `limit` | integer | all list endpoints | Default `50`, max `100` |
| `cursor` | string | all list endpoints | Opaque pagination cursor |
| `status` | `OntologyChangeRequestStatus` | change-request list | Optional filter |
| `application_state` | `GovernanceApplicationState` | change-request list | Optional filter |
| `action` | `GovernanceAuditAction` | audit lists | Optional filter |

## DTO Contract

### OntologyChangeRequest (response)

```json
{
  "id": "ocr-20260701-0001",
  "project_id": "project-insurance-demo",
  "title": "보험금 청구 클래스 속성 추가",
  "summary": "청구 기한 속성을 신규 추가하고 사고 유형 관계를 폐기 제안",
  "status": "IN_REVIEW",
  "application_state": "NOT_APPLICABLE",
  "proposer_id": "user-analyst-3",
  "item_count": 2,
  "ontology_version_id": "ontology-v7",
  "created_at": "2026-07-01T09:00:00Z",
  "updated_at": "2026-07-01T09:30:00Z",
  "submitted_at": "2026-07-01T09:10:00Z",
  "decided_at": null,
  "decided_by": null,
  "decision_reason": null
}
```

Required: `id`, `project_id`, `title`, `status`, `application_state`,
`proposer_id`, `item_count`, `created_at`. `application_state` is `QUEUED` iff
`status == APPROVED`, otherwise `NOT_APPLICABLE`. `decided_at`/`decided_by`/
`decision_reason` are set only on `APPROVED`/`REJECTED`.

### OntologyChangeRequestDetail (get response)

```json
{
  "change_request": { "...": "OntologyChangeRequest" },
  "items": [ { "...": "OntologyChangeItem" } ],
  "reviews": [ { "...": "GovernanceReviewDecision" } ],
  "capabilities": { "...": "GovernanceCapabilities" },
  "application_banner": {
    "application_state": "NOT_APPLICABLE",
    "message": "승인은 의도 등록 + 감사 기록일 뿐이며, 온톨로지/게시 그래프에 아무것도 적용되지 않습니다."
  }
}
```

Required: `change_request`, `items`, `reviews`, `capabilities`. `application_banner`
surfaces the approval-!=-auto-apply state for the UI (`QUEUED` after approve).

### OntologyChangeItem (response) / OntologyChangeItemRequest (request)

```json
{
  "id": "ocitem-0001",
  "change_request_id": "ocr-20260701-0001",
  "target_kind": "PROPERTY",
  "change_type": "ADD",
  "ontology_class_id": null,
  "ontology_property_id": null,
  "ontology_relation_id": null,
  "ontology_version_id": "ontology-v7",
  "proposed_change": {
    "name": "claim_filing_deadline",
    "label": "청구 기한",
    "data_type": "DATE",
    "note": "청구는 사고일로부터 3년 이내"
  },
  "created_at": "2026-07-01T09:05:00Z",
  "updated_at": "2026-07-01T09:05:00Z"
}
```

Rules: `target_kind` + `change_type` required. Target element ref
(`ontology_class_id`/`ontology_property_id`/`ontology_relation_id`) is **null for
`ADD`** and **required (exactly one, matching `target_kind`) for `MODIFY`/
`DEPRECATE`** → `409 CHANGE_ITEM_TARGET_INVALID` on mismatch, or
`409 ONTOLOGY_REF_INVALID` when the referenced element/version is absent in the
project. `ontology_version_id` required. `proposed_change` is an opaque
intent-only payload; the server stores it and never applies it.

### GovernanceReviewDecisionRequest (request — POST .../reviews)

```json
{
  "action": "APPROVE",
  "reason": "제안된 속성이 규정과 일치하며 근거가 충분함"
}
```

Rules: `action` (required, `GovernanceReviewAction`). `reason` **required and
non-empty** for `REQUEST_CHANGES`/`APPROVE`/`REJECT`; optional for `COMMENT`.
Mirrors MVP3 `ReviewDecisionCreateRequest` by reference (no `correction_id`/
`corrected_payload` — governance never inline-applies).

### GovernanceReviewDecision (response item — the review thread)

```json
{
  "id": "gdec-0003",
  "change_request_id": "ocr-20260701-0001",
  "action": "APPROVE",
  "actor_id": "user-ontology-manager-1",
  "actor_role": "ONTOLOGY_MANAGER",
  "reason": "제안된 속성이 규정과 일치하며 근거가 충분함",
  "resulting_status": "APPROVED",
  "resulting_application_state": "QUEUED",
  "created_at": "2026-07-01T10:00:00Z"
}
```

Required: `id`, `change_request_id`, `action`, `actor_id`, `resulting_status`,
`created_at`. `resulting_application_state` is `QUEUED` only on `APPROVE`,
`NOT_APPLICABLE` otherwise.

### GovernanceMutationResponse (envelope for every write)

```json
{
  "change_request": { "...": "OntologyChangeRequest" },
  "review_decision": { "...": "GovernanceReviewDecision or null" },
  "audit_entry": { "...": "GovernanceAuditEntry" },
  "mutation_guard": {
    "ontology_definition_mutated": false,
    "published_graph_mutated": false,
    "candidate_graph_mutated": false,
    "prompt_version_mutated": false,
    "publish_job_started": false,
    "extraction_job_started": false,
    "change_auto_applied": false
  },
  "capabilities": { "...": "GovernanceCapabilities" }
}
```

Every propose/update/item/submit/withdraw/review response uses this envelope
(`review_decision` is null for non-review writes). Required: `change_request`,
`audit_entry`, `mutation_guard`.

### GovernanceAuditEntry (response item)

```json
{
  "id": "gaudit-20260701-0007",
  "project_id": "project-insurance-demo",
  "change_request_id": "ocr-20260701-0001",
  "action": "CHANGE_REQUEST_APPROVED",
  "actor_id": "user-ontology-manager-1",
  "actor_role": "ONTOLOGY_MANAGER",
  "target_item_ids": ["ocitem-0001", "ocitem-0002"],
  "target_ontology_element_ids": ["property:claim_filing_deadline"],
  "ontology_version_id": "ontology-v7",
  "before_status": "IN_REVIEW",
  "after_status": "APPROVED",
  "reason": "제안된 속성이 규정과 일치하며 근거가 충분함",
  "created_at": "2026-07-01T10:00:00Z"
}
```

`action` is `GovernanceAuditAction`. Reuses the MVP3/MVP5 audit shape
(`actor_id`, action, reason, timestamp) by reference; adds governance target/state
context. Required: `id`, `project_id`, `change_request_id`, `action`, `actor_id`,
`created_at`. Audit-only; mutates no non-governance surface. Never hard-deleted.

### GovernanceCapabilities (read-only permission hint)

```json
{
  "can_view": true,
  "can_edit_request": false,
  "can_submit": false,
  "can_withdraw": false,
  "can_comment": true,
  "can_request_changes": true,
  "can_approve": true,
  "can_reject": true
}
```

Display-only; server enforces authorization independently. Never widens the
boundary or grants mutation.

### List responses

`OntologyChangeRequestListResponse` (`items: OntologyChangeRequest[]`,
`total_count`, `next_cursor`), `GovernanceAuditListResponse`
(`items: GovernanceAuditEntry[]`, `total_count`, `next_cursor`).

## Endpoint Details (key behaviors)

### POST `.../reviews` (the decision surface)

- `COMMENT`: appends to the thread; if request is `OPEN`, auto-advances to
  `IN_REVIEW` and audits `REVIEW_STARTED` + `COMMENT_ADDED`. No terminal change.
- `REQUEST_CHANGES`: reason required; `{OPEN|IN_REVIEW}` -> `OPEN`; audits
  `CHANGES_REQUESTED`. Proposer revises without re-creating.
- `APPROVE`: reason required; approver ∈
  {`ONTOLOGY_MANAGER`,`PROJECT_ADMIN`,`SYSTEM_ADMIN`} **and** approver !=
  proposer; `{OPEN|IN_REVIEW}` -> `APPROVED`, `application_state` -> `QUEUED`;
  audits `CHANGE_REQUEST_APPROVED`. **Applies nothing** (all-false guard;
  `change_auto_applied=false`).
- `REJECT`: reason required; approver-role gated; `{OPEN|IN_REVIEW}` ->
  `REJECTED`; audits `CHANGE_REQUEST_REJECTED`.
- Any decision against a `DRAFT` (not yet submitted), `APPROVED`, `REJECTED`, or
  `WITHDRAWN` request returns `409 CHANGE_REQUEST_STATE_CONFLICT`.
- Wrong role → `403 PERMISSION_DENIED`; self-approve → `403 SELF_APPROVAL_FORBIDDEN`;
  missing reason → `422 REASON_REQUIRED`.

### POST `.../submit`, `.../withdraw`

- `submit`: proposer-only; `DRAFT` -> `OPEN`; requires ≥1 change item else
  `409 CHANGE_REQUEST_NO_ITEMS`; other states -> `409 CHANGE_REQUEST_STATE_CONFLICT`.
- `withdraw`: proposer-only; from `DRAFT`/`OPEN`/`IN_REVIEW` -> `WITHDRAWN`;
  terminal states -> `409`.

### Item management (PATCH/POST/DELETE `.../items`)

- Allowed only while request is `DRAFT`/`OPEN` and by the proposer; else
  `409 CHANGE_REQUEST_STATE_CONFLICT` / `403 PERMISSION_DENIED`. Removing an item
  touches only the proposal record; the referenced ontology element is never
  modified.

## Error Contract

`ApiError` (`code`, `message`, `details`). Recommended codes:

```text
PROJECT_NOT_FOUND
CHANGE_REQUEST_NOT_FOUND
CHANGE_REQUEST_STATE_CONFLICT     (mutating/deciding a terminal or wrong-state request)
CHANGE_REQUEST_NO_ITEMS           (submit with zero change items)
CHANGE_ITEM_NOT_FOUND
CHANGE_ITEM_TARGET_INVALID        (element ref present for ADD / missing or wrong kind for MODIFY/DEPRECATE)
ONTOLOGY_REF_INVALID              (element / ontology_version_id absent in project)
REASON_REQUIRED                   (REJECT/REQUEST_CHANGES/APPROVE with empty reason) — HTTP 422
SELF_APPROVAL_FORBIDDEN           (proposer approving own request) — HTTP 403
PERMISSION_DENIED                 — HTTP 403
```

HTTP mapping: `403` (PERMISSION_DENIED / SELF_APPROVAL_FORBIDDEN),
`404` (NOT_FOUND), `409` (state / target conflicts),
`422` (REASON_REQUIRED / validation).

## Safety Boundary (frozen)

Governance is candidate/analysis-layer (decision-record) only. It must NOT mutate
the ontology definition/elements/versions, the published graph or any publish
path, candidates/candidate review state, or prompts/prompt versions; start a
publish or extraction or re-validation/re-extraction job; auto-apply an approved
change (`change_auto_applied` always false); or hard-delete a change request or
audit entry. Every write response exposes the all-false `GovernanceMutationGuard`.
RBAC reuses the shipped `Role` enum (approve/reject restricted to
`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`; proposer != approver). Reason is
required for `REJECT`/`REQUEST_CHANGES`/`APPROVE`.

## Open Questions for Frontend / QA

1. **`OPEN` -> `IN_REVIEW` auto-advance timing.** Draft: the **first reviewer
   touch** (any `COMMENT`/`REQUEST_CHANGES`, or an explicit reviewer open) advances
   `OPEN` -> `IN_REVIEW` and audits `REVIEW_STARTED`. Should an explicit
   "start review" action exist, or is the first `COMMENT` sufficient? Confirm
   whether `REQUEST_CHANGES` from `IN_REVIEW` returning to `OPEN` should re-trigger
   `REVIEW_STARTED` on the next touch (draft: yes).
2. **Approve justification vs decision reason.** Draft reuses a single `reason`
   field for `APPROVE` (justification). Does Frontend want a distinct optional
   `application_note` separate from the approval reason to describe the queued
   intent for the later application slice? (Draft: single `reason`.)
3. **Audit pagination + scope.** Two audit reads exist: per-request
   (`.../{id}/audit`) and project-scoped (`.../governance-audit`). Both use
   `limit`/`cursor`. Confirm QA needs the project-scoped feed for cross-request
   assertions and whether it should page independently (draft: yes, opaque cursor).
4. **Segregation-of-duties scope.** Draft blocks only self-`APPROVE`
   (`SELF_APPROVAL_FORBIDDEN`). Should a proposer also be blocked from
   self-`REJECT`/`REQUEST_CHANGES` (draft: a pure proposer lacks reviewer role
   anyway, so this is moot unless the proposer also holds a reviewer/approver
   role)? Confirm the exact rule when one user holds both roles.
5. **State-machine edges.** Confirm: (a) `REQUEST_CHANGES` from `OPEN` (no reviewer
   yet touched) is allowed and returns to `OPEN` (idempotent-ish); (b) editing
   items/title is blocked once `IN_REVIEW` (draft: allowed only in `DRAFT`/`OPEN`);
   (c) whether re-`submit` after `REQUEST_CHANGES` is a no-op (already `OPEN`) or a
   distinct audited event.
6. **Change-item `proposed_change` schema.** Draft keeps `proposed_change` an
   opaque intent-only object (never applied). Confirm Frontend does not need a
   typed per-target-kind schema in P0 (typed payload would edge toward an
   ontology-edit contract, which is out of scope).

## Planning-Only OpenAPI Artifact

`docs/api/openapi-mvp6-5-draft.json` is a standalone planning artifact for the
MVP6.5 surface. It contains only the additive MVP6.5 paths and schemas needed for
contract review; it does not replace any prior per-MVP draft.

Expected parse metadata:

```text
openapi: 3.1.0
info.version: 0.6.5-draft
paths: 9 path objects (12 operations)
schemas: 24
parameters: 8
responses: 4 (shared 403/404/409/422)
```

All 24 schemas are reachable (no dangling/unreferenced refs). Reused MVP3/MVP5 enums
(`ReviewDecisionType`, `Role`) and the audit shape are referenced by description /
mirrored where needed so the artifact is standalone, and are noted as reused
verbatim / not renamed.

## Out of Scope for MVP6.5 P0

- Runtime API implementation, DB models, Alembic migrations, seed data,
  deterministic runtime stores, tests (Wave42+).
- Auto-apply of an approved change to the ontology definition or published graph
  (later human-initiated slice via MVP1 ontology-edit + MVP3 publish);
  `GovernanceApplicationState.APPLIED`/`SUPERSEDED` production.
- Automatic enforcement, autonomous/agent publish, and rollback.
- Impact simulation / impact analysis reports (`OntologyImpactReport`),
  migration-plan generation (`OntologyMigrationPlan`), automatic release-note
  generation (`OntologyReleaseNote`).
- Post-change re-validation / re-extraction job creation.
- Automatic reviewer assignment / load-balancing; ontology diff visualization
  beyond a plain change-item summary.
- Real LLM/provider execution; copilot/agent runtime; connector/plugin SDK;
  multi-tenant runtime.
- Hard-delete of any change request or audit entry (withdraw/terminal states only).
