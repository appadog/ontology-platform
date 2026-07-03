# MVP 6.6 — Governance Change Application (APPROVED+QUEUED → APPLIED into a DRAFT ontology version) API Contract Draft

Status: `WAVE 43 CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-02
Backlog: `BE6-044`~`BE6-047` (theme `PM6-025`; Frontend `FE6-065`~`FE6-068`; QA `INT6-051`~`INT6-054`)

This draft defines the additive contract for the **deferred application slice from
ADR 0012** — the first governance operation that mutates ontology state. A
privileged human **explicitly applies** an `APPROVED` change request whose
`application_state == QUEUED` onto a **DRAFT ontology version** (`QUEUED → APPLIED`),
executing the request's change items through the **existing MVP1 ontology-edit
semantics** (`ADD`=create, `MODIFY`=update, `DEPRECATE`=archive) on a DRAFT version
**only**. **Application ≠ publish**: apply never touches the published graph, never
starts a publish job, never rolls back — publishing the applied draft stays the
separate MVP3 path in a later human step.

Canonical machine-readable planning artifact:
`docs/api/openapi-mvp6-6-draft.json` (OpenAPI 3.1.0, `info.version` `0.6.6-draft`).

Wave43 is contract-first planning only. This draft does **not** implement FastAPI
routes, runtime services, database models, migrations, seed data, workers, or
tests. Runtime implementation waits for a Wave44 thin-implementation order after
Frontend field/state/IA review (`FE6-065`~`FE6-068`) and a QA executable checklist
(`INT6-051`~`INT6-054`) are ready.

Frozen by `docs/pm/MVP6_6_GOVERNANCE_APPLICATION_BRIEF.md` and
`docs/adr/0013-mvp6-6-governance-application-draft-only-human-initiated-boundary.md`.
Where the PM brief / ADR 0013 and this draft differ on a name, the PM brief + ADR
win; this draft only refines field names the PM brief explicitly delegated to
Backend.

## Contract Principles

- MVP6.6 is **additive and disjoint**. Existing MVP1–MVP6.5 paths, schemas, and
  enums are not renamed, moved, or removed. New paths hang off the MVP6.5
  `/api/v1/ontology-change-requests/{change_request_id}` resource as `.../apply`,
  `.../application-status`, and `.../application-audit`.
- **Application is human-initiated only.** Approval never triggers apply; only an
  explicit `apply` call does. Valid **only** from `status == APPROVED` AND
  `application_state == QUEUED`.
- **Application ≠ publish — draft-only.** Apply writes ONLY to a DRAFT ontology
  version via MVP1 ontology-edit semantics. It never mutates the published graph,
  the candidate graph, prompts, or starts any publish/extraction/evaluation job,
  and never rolls back.
- **No reuse-by-rename.** MVP6.5 governance shapes (`GovernanceApplicationState`,
  `ChangeRequestChangeType`, `ChangeRequestTargetKind`, change-request/item/audit
  shapes), MVP1 `OntologyElementStatus` / `OntologyVersionStatus` / ontology
  version, and MVP5 `Role` are reused **verbatim / by reference**. New MVP6.6
  enum/DTO names are additive and must not collide with MVP1–MVP6.5 names.
- DTO/schema names use PascalCase. JSON fields use snake_case. Enum literals use
  UPPER_SNAKE_CASE.
- The **successful apply** response carries the redefined
  `GovernanceApplicationMutationGuard` with **exactly one** true flag
  (`ontology_draft_mutated`). The application-status pre-check read, the
  application-audit read, and **every blocked apply** keep the existing all-false
  `GovernanceMutationGuard`.

## Preserved MVP1–MVP6.5 Boundary

- Apply changes the ontology **definition draft** only. The **published graph is
  never mutated**; publishing stays the separate MVP3 `publish-jobs` path.
- Candidate/published separation intact. No candidate, prompt, extraction, or
  evaluation surface is touched.
- `GovernanceApplicationState.APPLIED` and `SUPERSEDED` — reserved in ADR 0012 —
  become real **only here**, produced solely by the apply attempt.
- Durable DB/Alembic persistence is **not required** for the P0 thin slice; the
  proven deterministic process-local store (with `reset_runtime_store()`) is
  acceptable. Durable persistence remains P1/P2. (Implementation note for Wave44:
  the store must reflect the applied element state so a later staleness re-check
  and the before/after audit stay honest.)

## Reused Artifacts (verbatim, not redefined)

Referenced by reference; **no renames**. Mirrored into the OpenAPI artifact only so
it is standalone.

| Reused artifact | Role in MVP6.6 |
|---|---|
| MVP6.5 `GovernanceApplicationState` (`NOT_APPLICABLE`/`QUEUED`/`APPLIED`/`SUPERSEDED`) | Apply reads `QUEUED` as precondition and sets `APPLIED` (success) or `SUPERSEDED` (staleness). No rename. |
| MVP6.5 `ChangeRequestChangeType` (`ADD`/`MODIFY`/`DEPRECATE`), `ChangeRequestTargetKind` (`CLASS`/`PROPERTY`/`RELATION`) | Drive the applied ontology-edit semantics + the before/after refs. Verbatim. |
| MVP6.5 `OntologyChangeRequest` / `OntologyChangeItem` (id, refs, `ontology_version_id`, `proposed_change`) | The apply source; items are executed against the DRAFT target. No rename. |
| MVP1 `OntologyElementStatus` (`DRAFT`/`ACTIVE`/`ARCHIVED`/`DELETED`, `core/enums.py`) | `DEPRECATE` sets `ARCHIVED`. Apply never hard-deletes (never sets `DELETED`). |
| MVP1 `OntologyVersionStatus` (`DRAFT`/`PUBLISHED`/`ARCHIVED`, `core/enums.py`), `OntologyVersion` (`docs/api/openapi-mvp3-draft.json`) | Apply targets a `DRAFT` version only; `_draft_version_or_error` guards the edit path. Non-DRAFT → `409 APPLY_TARGET_NOT_DRAFT`. Apply does not itself cut a version. |
| MVP1 ontology-edit path (`POST /ontology-versions`; `POST/PATCH/DELETE` class/property/relation on a DRAFT version) | The sanctioned mutation semantics reused **by reference**. Apply introduces no new edit primitive. |
| MVP3 publish (`POST /projects/{id}/publish-jobs`, `PublishedGraphVersion`) | **NOT touched.** Publishing the applied draft is a later separate MVP3 step. |
| MVP5 `Role` (`core/enums.py`) | Apply rights = approver rights (`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`). No new role literal. |
| MVP3/MVP5 audit shape + MVP6.5 `GovernanceAuditEntry` | The application audit reuses the shape by reference; new `GovernanceApplicationAuditAction` names the application events. |

## New Enums (MVP6.6 only)

### `GovernanceApplicationAuditAction` (application audit events)

Additive; does **not** rename MVP6.5 `GovernanceAuditAction` or MVP3/MVP5
`AuditEventType`.

```text
CHANGE_REQUEST_APPLIED      a successful apply into a DRAFT ontology version
CHANGE_REQUEST_SUPERSEDED   a staleness-blocked apply; application_state -> SUPERSEDED, nothing mutated
```

`GovernanceApplicationState` (`NOT_APPLICABLE`/`QUEUED`/`APPLIED`/`SUPERSEDED`) is
**reused verbatim** from MVP6.5. `APPLIED`/`SUPERSEDED` are first produced here.

## Redefined Mutation Guard — the ONE sanctioned mutation surface

`GovernanceApplicationMutationGuard` on the **successful apply** response only —
exactly one flag legitimately `true`:

```json
{
  "ontology_draft_mutated": true,
  "published_graph_mutated": false,
  "candidate_graph_mutated": false,
  "prompt_version_mutated": false,
  "publish_job_started": false,
  "extraction_job_started": false,
  "evaluation_run_started": false
}
```

- All **read** endpoints (application-status pre-check, application-audit) and
  **every blocked apply** (idempotency / staleness / authz) mutate nothing and
  return the existing **all-false** `GovernanceMutationGuard` (the MVP6.5 7-flag
  shape with `change_auto_applied`).
- QA asserts exactly one sanctioned mutation surface: `ontology_draft_mutated=true`
  **only** on a successful apply; any other true flag — or a true
  `ontology_draft_mutated` on any non-apply endpoint — is a defect.

## Authorization Model (RBAC — reuse shipped `Role`, no new literal)

- **Read** (application-status pre-check, application-audit): any project member
  (incl. `VIEWER`). A non-permitted role may view status/audit; the `can_apply`
  capability is `false`.
- **Apply**: restricted to `ONTOLOGY_MANAGER` / `PROJECT_ADMIN` / `SYSTEM_ADMIN`
  (= MVP6.5 approver rights). The applier **may differ** from the approver and the
  proposer (recommended + audited). There is **no** self-apply prohibition —
  segregation of duties was already enforced at the approve step (approver ≠
  proposer). Unauthorized apply → `403 PERMISSION_DENIED`, mutates nothing.
- The read `ApplicationCapabilities` hint (`can_view`, `can_apply`) is display-only;
  the server enforces authorization + preconditions independently. `can_apply` is
  `true` only when the actor holds apply rights AND `status==APPROVED` AND
  `application_state==QUEUED`.

## Additive Endpoint Families

All additive, disjoint from MVP1–MVP6.5, on the MVP6.5 change-request resource.

### A. Application-status pre-check (read-only)

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-044 | `GET` | `/api/v1/ontology-change-requests/{change_request_id}/application-status` | Resolve the effective DRAFT target + per-item before/after preview + `would_supersede` staleness hint + `can_apply`. Read-only; all-false guard. |

Optional query `target_ontology_version_id` to pre-check against an explicit DRAFT
version (else the project current DRAFT). This read **never** flips
`QUEUED → SUPERSEDED`; the hint is advisory and only the apply attempt is
authoritative.

### B. Apply action

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-045 | `POST` | `/api/v1/ontology-change-requests/{change_request_id}/apply` | Apply an `APPROVED`+`QUEUED` request to a DRAFT ontology version → `APPLIED`. Redefined guard (`ontology_draft_mutated=true`). |

Optional body `GovernanceApplyRequest` (`target_ontology_version_id`, `note`).

### C. Application audit (read-only)

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-046 | `GET` | `/api/v1/ontology-change-requests/{change_request_id}/application-audit` | List `GovernanceApplicationAuditEntry` rows (`CHANGE_REQUEST_APPLIED`/`CHANGE_REQUEST_SUPERSEDED`), chronological ASC, paginated. |

### Query parameters

| Query | Type | Applies to | Notes |
|---|---|---|---|
| `target_ontology_version_id` | string | application-status | Optional explicit DRAFT target |
| `limit` | integer | application-audit | Default `50`, max `100` |
| `cursor` | string | application-audit | Opaque pagination cursor |
| `action` | `GovernanceApplicationAuditAction` | application-audit | Optional filter |

## DTO Contract

### GovernanceApplyRequest (request body — POST .../apply)

```json
{
  "target_ontology_version_id": "ontology-v8-draft",
  "note": "규정 반영 승인 건 draft 적용"
}
```

Both fields optional. `target_ontology_version_id` selects the **DRAFT** version to
receive the change; omit to use the project current DRAFT. A non-DRAFT target →
`409 APPLY_TARGET_NOT_DRAFT`. `note` is recorded on the application audit entry.

### GovernanceApplicationStatusResponse (GET .../application-status)

```json
{
  "change_request_id": "ocr-20260701-0001",
  "project_id": "project-insurance-demo",
  "status": "APPROVED",
  "application_state": "QUEUED",
  "target_ontology_version_id": "ontology-v8-draft",
  "target_version_status": "DRAFT",
  "target_is_draft": true,
  "applicable": true,
  "would_supersede": false,
  "item_previews": [
    {
      "change_item_id": "ocitem-0001",
      "target_kind": "PROPERTY",
      "change_type": "ADD",
      "before_ref": null,
      "after_ref": {
        "target_kind": "PROPERTY",
        "ontology_property_id": "prop:claim_filing_deadline",
        "ontology_version_id": "ontology-v8-draft",
        "status": "DRAFT"
      },
      "stale": false,
      "stale_reason": null
    }
  ],
  "capabilities": { "can_view": true, "can_apply": true },
  "mutation_guard": {
    "ontology_definition_mutated": false,
    "published_graph_mutated": false,
    "candidate_graph_mutated": false,
    "prompt_version_mutated": false,
    "publish_job_started": false,
    "extraction_job_started": false,
    "change_auto_applied": false
  }
}
```

`applicable` is `true` iff `status==APPROVED` AND `application_state==QUEUED` AND
`target_is_draft` AND not `would_supersede`. `before_ref` is null for `ADD`.
`would_supersede`/per-item `stale` are **advisory** — the authoritative transition
is on the apply attempt. `stale_reason` ∈ `TARGET_ELEMENT_MODIFIED` /
`TARGET_ELEMENT_ARCHIVED` / `TARGET_ELEMENT_DELETED` / `VERSION_CONTEXT_DIVERGED`.

### GovernanceApplyResponse (200 — POST .../apply, success)

```json
{
  "change_request_id": "ocr-20260701-0001",
  "project_id": "project-insurance-demo",
  "application_state": "APPLIED",
  "target_ontology_version_id": "ontology-v8-draft",
  "applied_item_ids": ["ocitem-0001", "ocitem-0002"],
  "before_after_refs": [
    {
      "change_item_id": "ocitem-0001",
      "change_type": "ADD",
      "before": null,
      "after": {
        "target_kind": "PROPERTY",
        "ontology_property_id": "prop:claim_filing_deadline",
        "ontology_version_id": "ontology-v8-draft",
        "status": "DRAFT"
      }
    },
    {
      "change_item_id": "ocitem-0002",
      "change_type": "DEPRECATE",
      "before": {
        "target_kind": "RELATION",
        "ontology_relation_id": "rel:accident_type",
        "ontology_version_id": "ontology-v8-draft",
        "status": "ACTIVE"
      },
      "after": {
        "target_kind": "RELATION",
        "ontology_relation_id": "rel:accident_type",
        "ontology_version_id": "ontology-v8-draft",
        "status": "ARCHIVED"
      }
    }
  ],
  "audit_entry": { "...": "GovernanceApplicationAuditEntry (CHANGE_REQUEST_APPLIED)" },
  "mutation_guard": {
    "ontology_draft_mutated": true,
    "published_graph_mutated": false,
    "candidate_graph_mutated": false,
    "prompt_version_mutated": false,
    "publish_job_started": false,
    "extraction_job_started": false,
    "evaluation_run_started": false
  },
  "capabilities": { "can_view": true, "can_apply": false }
}
```

`application_state` is `APPLIED`. `mutation_guard` is the **redefined**
`GovernanceApplicationMutationGuard` (`ontology_draft_mutated=true`, all others
false). After a successful apply, `can_apply` becomes `false` (no longer `QUEUED`).
`ADD`→`before` null; `MODIFY`→before/after both populated; `DEPRECATE`→after status
`ARCHIVED` (never hard-deleted).

### GovernanceApplicationAuditEntry (response item)

```json
{
  "id": "gappaudit-20260702-0001",
  "project_id": "project-insurance-demo",
  "change_request_id": "ocr-20260701-0001",
  "action": "CHANGE_REQUEST_APPLIED",
  "actor_id": "user-ontology-manager-2",
  "actor_role": "ONTOLOGY_MANAGER",
  "target_ontology_version_id": "ontology-v8-draft",
  "applied_item_ids": ["ocitem-0001", "ocitem-0002"],
  "before_after_refs": [ { "...": "ApplicationBeforeAfterRef" } ],
  "before_application_state": "QUEUED",
  "after_application_state": "APPLIED",
  "note": "규정 반영 승인 건 draft 적용",
  "stale_detail": null,
  "created_at": "2026-07-02T10:00:00Z"
}
```

On a staleness block: `action=CHANGE_REQUEST_SUPERSEDED`,
`before_application_state=QUEUED`, `after_application_state=SUPERSEDED`,
`before_after_refs` empty (nothing mutated), and `stale_detail` carries the
mismatch (which items/elements were stale and why). Reuses the MVP3/MVP5 audit
shape by reference. Required: `id`, `project_id`, `change_request_id`, `action`,
`actor_id`, `created_at`. Never hard-deleted.

### OntologyElementRef / ApplicationBeforeAfterRef / ApplicationItemPreview

`OntologyElementRef`: `target_kind` + exactly one of
`ontology_class_id`/`ontology_property_id`/`ontology_relation_id` +
`ontology_version_id` + `status` (`OntologyElementStatus` at that moment).
`ApplicationBeforeAfterRef`: `change_item_id`, `change_type`, `before`, `after`
(each `OntologyElementRef` or null). `ApplicationItemPreview` (pre-check only):
adds `stale`/`stale_reason` and uses `before_ref`/`after_ref`.

### List response

`GovernanceApplicationAuditListResponse` (`items:
GovernanceApplicationAuditEntry[]`, `total_count`, `next_cursor`).

## Endpoint Details (key behaviors)

### POST `.../apply` (the mutation surface)

1. **Precondition:** `status==APPROVED` AND `application_state==QUEUED`. Otherwise:
   already-`APPLIED` → `409 CHANGE_ALREADY_APPLIED`; any other non-`APPROVED`/
   non-`QUEUED` state → `409 CHANGE_NOT_APPLICABLE`. No double apply.
2. **Authz:** actor role ∈ {`ONTOLOGY_MANAGER`,`PROJECT_ADMIN`,`SYSTEM_ADMIN`} else
   `403 PERMISSION_DENIED`. No self-apply prohibition.
3. **Target resolution:** `target_ontology_version_id` (body) else project current
   DRAFT. Must be `OntologyVersionStatus=DRAFT` else `409 APPLY_TARGET_NOT_DRAFT`.
   Missing/unknown version → `404 ONTOLOGY_VERSION_NOT_FOUND`.
4. **Staleness check (auto at apply):** stale when the approved snapshot no longer
   matches the current draft target — (a) the target draft diverged so a targeted
   element changed, or (b) a `MODIFY`/`DEPRECATE` target element was modified/
   archived/deleted since approval (current ≠ approved before-state). If stale:
   block, mutate nothing, `application_state=QUEUED → SUPERSEDED`, write a
   `CHANGE_REQUEST_SUPERSEDED` audit entry, return `409 CHANGE_REQUEST_SUPERSEDED`.
   `SUPERSEDED` is terminal for application.
5. **Apply (all-or-nothing):** execute items via MVP1 ontology-edit semantics on
   the DRAFT version — `ADD`=create element, `MODIFY`=update element, `DEPRECATE`=
   set `OntologyElementStatus=ARCHIVED`. Set `application_state=APPLIED`, write a
   `CHANGE_REQUEST_APPLIED` audit entry with per-item before/after refs, return
   `200 GovernanceApplyResponse` with `ontology_draft_mutated=true`.

Apply **never** touches the published graph, starts a publish/extraction/evaluation
job, rolls back, or hard-deletes.

### GET `.../application-status`, `.../application-audit`

- `application-status`: read-only pre-check; resolves target + previews + hint;
  never mutates, never flips to `SUPERSEDED`.
- `application-audit`: read-only, chronological ASC, `limit`/`cursor` (default 50,
  max 100), optional `action` filter.

## Error Contract

`ApiError` (`code`, `message`, `details`). Codes:

```text
PROJECT_NOT_FOUND
CHANGE_REQUEST_NOT_FOUND
ONTOLOGY_VERSION_NOT_FOUND
APPLY_TARGET_NOT_DRAFT        target not OntologyVersionStatus=DRAFT — HTTP 409
CHANGE_ALREADY_APPLIED        request already APPLIED — HTTP 409
CHANGE_NOT_APPLICABLE         not APPROVED / not QUEUED — HTTP 409
CHANGE_REQUEST_SUPERSEDED     staleness block; application_state now SUPERSEDED, nothing mutated — HTTP 409
PERMISSION_DENIED             actor lacks apply rights — HTTP 403
```

HTTP mapping: `403` (PERMISSION_DENIED), `404` (NOT_FOUND family), `409`
(idempotency / target / staleness conflicts). Every blocked apply mutates nothing;
any body returned carries the all-false `GovernanceMutationGuard`.

## Safety Boundary (frozen)

Application is draft-only and human-initiated. Apply MUST NOT mutate the published
graph or any publish path, the candidate graph, prompts/prompt versions, or start
a publish/extraction/evaluation job; MUST NOT auto-apply (only an explicit human
`apply` call, only from `APPROVED`+`QUEUED`); MUST NOT double-apply (idempotency
409s); MUST NOT hard-delete (`DEPRECATE`=archive only); and MUST NOT silently
overwrite (staleness → `SUPERSEDED`, no mutation). The successful apply exposes
`GovernanceApplicationMutationGuard` with exactly one true flag
(`ontology_draft_mutated`); reads and blocked applies keep the all-false
`GovernanceMutationGuard`. Apply rights = approver rights
(`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`).

## Open Questions for Frontend / QA / Wave44 PM

1. **Target-draft default (PM-flagged).** Draft resolves an omitted target to the
   **project current DRAFT** version. Confirm the project may have at most one
   current DRAFT, and whether an explicit `target_ontology_version_id` should be
   **required** when no unambiguous current DRAFT exists (draft: 404/409 if none).
2. **Staleness comparison key per `change_type` (PM-flagged).** Draft: `MODIFY`/
   `DEPRECATE` compare the target element's current `OntologyElementStatus` + a
   content fingerprint against the approved before-state; `ADD` (null ref) cannot
   be stale on before-state, but is superseded if its `ontology_version_id`
   context no longer resolves to the target draft. Confirm the exact fingerprint
   fields Wave44 should snapshot at approval.
3. **Pre-check flip authority (PM-flagged).** Draft: the read-only
   `application-status` NEVER flips `QUEUED→SUPERSEDED`; only the apply attempt is
   authoritative (the read returns an advisory `would_supersede`). Confirm QA/FE
   accept an advisory-only pre-check (a stale request can show `would_supersede=
   true` yet remain `QUEUED` until apply).
4. **Partial-apply semantics.** Draft: apply is **all-or-nothing** (any staleness
   blocks the whole request; no per-item partial apply). Confirm no per-item apply
   is wanted in P0.
5. **Snapshot capture point.** Draft assumes the approved before-state snapshot is
   captured at **approve time** (Wave44 must persist it on the QUEUED request).
   Confirm this is acceptable vs. recomputing from audit history.
6. **`can_apply` after apply.** Draft flips `can_apply` to `false` post-apply
   (state no longer `QUEUED`). Confirm FE renders the `APPLIED` badge + the
   "applied to DRAFT, NOT published" banner and hides the apply CTA.

## Planning-Only OpenAPI Artifact

`docs/api/openapi-mvp6-6-draft.json` is a standalone planning artifact for the
MVP6.6 surface. It contains only the additive MVP6.6 paths/schemas and mirrors
reused MVP6.5/MVP1/MVP5 enums by reference so it is standalone; it does not replace
any prior per-MVP draft.

Expected parse metadata:

```text
openapi: 3.1.0
info.version: 0.6.6-draft
paths: 3 path objects (3 operations)
schemas: 19
parameters: 5
responses: 3 (403 / 404 / 409-apply-conflict)
```

All 19 schemas are reachable (no dangling/unreferenced refs; verified 0 defined-not-
referenced and 0 referenced-not-defined). The three new paths are disjoint from all
MVP1–MVP6.5 OpenAPI drafts (verified: 0 path overlap).

## Out of Scope for MVP6.6 P0

- Publishing the applied draft (stays the separate MVP3 publish path).
- Auto-apply / auto-publish, automatic enforcement, autonomous/agent apply.
- Rollback / undo of an applied change.
- Impact simulation / impact-analysis reports; migration-plan / release-note
  generation.
- Post-apply re-validation / re-extraction job creation.
- Bulk/batch multi-request apply; conflict auto-merge; per-item partial apply;
  ontology diff viz beyond a per-item before/after summary.
- Runtime API implementation, DB models, Alembic migrations, seed, tests (Wave44+).
- Real LLM/provider execution; copilot/agent runtime; connector/plugin SDK;
  multi-tenant runtime. Durable DB/Alembic persistence (P1/P2).
