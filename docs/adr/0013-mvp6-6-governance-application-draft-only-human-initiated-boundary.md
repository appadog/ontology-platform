# ADR 0013: MVP6.6 Governance Change Application — Application-Is-Not-Publish, Draft-Only, Human-Initiated, Staleness→SUPERSEDED Boundary

## Status

Accepted

## Context

ADR 0012 (MVP6.5) shipped an auditable ontology change-request lifecycle whose
**approval records intent + audit only**: an `APPROVED` request is QUEUED
(`GovernanceApplicationState=QUEUED`, `change_auto_applied=false`) and nothing is
applied. ADR 0012 explicitly **reserved** `APPLIED` and `SUPERSEDED` for a later,
human-initiated, separately-audited "application" slice through the existing
MVP1 ontology-edit and MVP3 publish paths.

MVP6.6 is that deferred slice — and it is the **first governance operation that
mutates ontology state**. Every prior MVP6 theme (6.1–6.5) was audit-only /
read-only and asserted an all-false mutation guard. MVP6.6 legitimately turns
**exactly one** mutation flag true. Because that crosses the platform's hardest
line — the candidate/published separation and "no autonomous publish/apply" — the
boundary must be crisp and inspectable, or the whole governance safety story
collapses. This ADR fixes that boundary.

The sanctioned mutation surfaces already exist and are reused **by reference, no
renames**:
- MVP1 ontology-edit: `POST /ontology-versions` (create DRAFT version),
  `POST/PATCH/DELETE` class/property/relation on a DRAFT version, with
  `OntologyElementStatus` (`DRAFT`/`ACTIVE`/`ARCHIVED`/`DELETED`) and
  `OntologyVersionStatus` (`DRAFT`/`PUBLISHED`/`ARCHIVED`). A `DRAFT` version is
  the only editable target; `_draft_version_or_error` already guards this.
- MVP3 publish: `POST /projects/{id}/publish-jobs` → immutable
  `PublishedGraphVersion`. **Untouched by MVP6.6.**
- MVP5 `Role` for authorization; MVP6.5 governance change-request/item/audit
  shapes and `GovernanceApplicationState`.

## Decision

- **MVP6.6 P0 is human-initiated application of an APPROVED+QUEUED change request
  onto a DRAFT ontology version.** A privileged human explicitly triggers an
  `apply` action on a change request whose `status == APPROVED` **and**
  `application_state == QUEUED`. Application executes the request's change items
  against a **DRAFT** ontology version using the existing MVP1 ontology-edit
  semantics (ADD → create element, MODIFY → update element, DEPRECATE → set
  `OntologyElementStatus=ARCHIVED`), then sets `application_state=APPLIED`. There
  is **no automatic application**: approval never triggers apply; only an explicit
  human `apply` call does.

- **APPLICATION ≠ PUBLISH. Draft-only.** This is the load-bearing rule. Apply
  writes **only** to a DRAFT ontology version. It **never** touches the published
  graph, never creates/starts a publish job, never rolls back. Publishing the
  resulting draft remains the separate, separately-audited existing MVP3 publish
  path, performed as a later human step. The candidate/published separation is
  preserved: apply changes the ontology *definition draft*, not the published
  graph and not the candidate graph.

- **Target DRAFT version selection (frozen).** Apply targets a **DRAFT** ontology
  version supplied by the applier (`target_ontology_version_id`) OR, if omitted,
  the project's current DRAFT version. The target MUST be
  `OntologyVersionStatus=DRAFT`; applying against a `PUBLISHED`/`ARCHIVED` version
  is rejected `409 APPLY_TARGET_NOT_DRAFT`. Apply does **not** itself cut a new
  version; version creation stays the operator's explicit MVP1 step so the applier
  chooses the draft that receives the change.

- **Idempotency (frozen).** `apply` is valid **only** from `APPROVED` +
  `application_state==QUEUED`. Applying a request that is already `APPLIED`, or in
  any non-`QUEUED` application state, or whose request status is not `APPROVED`,
  is a no-op-reject: `409 CHANGE_ALREADY_APPLIED` (already `APPLIED`) or
  `409 CHANGE_NOT_APPLICABLE` (not `APPROVED`/`QUEUED`). There is never a double
  apply and never a silent second mutation.

- **Staleness/conflict → SUPERSEDED (frozen; the ADR-0012 reserved state becomes
  real).** The approved change carries a snapshot of its target: for each change
  item, the `ontology_version_id` context and the target element ref
  (`ontology_class_id`/`ontology_property_id`/`ontology_relation_id`) captured at
  approval. A request is **stale** if, at apply time, the approved snapshot no
  longer matches the current apply target — specifically:
  1. the target DRAFT version advanced/diverged from the approved
     `ontology_version_id` context in a way that changed a targeted element, OR
  2. a `MODIFY`/`DEPRECATE` target element was itself modified, archived, or
     deleted since approval (its current state no longer equals the approved
     before-state).
  When stale, apply is **blocked and mutates nothing**; the request transitions
  `application_state=QUEUED → SUPERSEDED`, an audit entry records the staleness,
  and the response is `409 CHANGE_REQUEST_SUPERSEDED`. No silent overwrite. A
  `SUPERSEDED` request is terminal for application (it must be re-proposed /
  re-approved to apply). Staleness is **auto-detected at apply time**; a
  read-only pre-check (`GET .../application-status`) MAY also surface a
  `stale`/`would-supersede` indicator so the UI can warn before the human
  commits, but the authoritative transition happens on the apply attempt. (Pure
  ADD items with a null ref have no before-state and cannot be stale on that basis
  alone; they can still be superseded if their `ontology_version_id` context no
  longer resolves to the target draft.)

- **Authorization (frozen).** Apply reuses the MVP5 `Role` restriction and the
  **same** elevated set as MVP6.5 approve rights:
  `ONTOLOGY_MANAGER` / `PROJECT_ADMIN` / `SYSTEM_ADMIN`. Apply rights **equal**
  approver rights (no distinct "apply" role literal is introduced) — the same
  trust boundary that authorizes a governance decision authorizes carrying it
  into a draft. The applier **MAY differ from the approver and from the proposer**
  (recommended, and audited): separating "who approved" from "who applied"
  strengthens the trail. There is deliberately **no** self-apply prohibition (an
  approver applying their own approved request is allowed) — segregation of duties
  was already enforced at the approve step (approver ≠ proposer). Unauthorized
  apply returns `403 PERMISSION_DENIED`.

- **Redefined mutation guard for the apply action (frozen).** MVP6.1–6.5 asserted
  an all-false guard. The apply response carries a
  `GovernanceApplicationMutationGuard` in which **exactly one** flag is
  legitimately `true`:
  - `ontology_draft_mutated: true` — the ONE sanctioned mutation surface.
  - `published_graph_mutated: false`
  - `candidate_graph_mutated: false`
  - `prompt_version_mutated: false`
  - `publish_job_started: false`
  - `extraction_job_started: false`
  - `evaluation_run_started: false`

  All **read/lifecycle** governance endpoints (list/get/propose/submit/withdraw/
  review/decision/audit from MVP6.5, plus the apply pre-check read and the
  application-audit read) keep the existing **all-false** `GovernanceMutationGuard`
  — they are unchanged. Only the successful `apply` mutation response uses the new
  guard with `ontology_draft_mutated=true`. A blocked apply (idempotency/staleness/
  authz) mutates nothing and therefore returns an **all-false** guard. QA thus has
  exactly one sanctioned mutation surface to assert (`ontology_draft_mutated` on a
  successful apply only), and any other true flag, or a true `ontology_draft_mutated`
  on any non-apply endpoint, is a defect.

- **Application audit content (frozen).** A successful apply writes a dedicated
  application audit entry (reusing the MVP3/MVP5 audit shape by reference; a new
  `GovernanceApplicationAuditAction` = `CHANGE_REQUEST_APPLIED` / `CHANGE_REQUEST_SUPERSEDED`
  names the events) recording: actor id + role, timestamp, source change-request
  id + applied change-item ids, the resulting **DRAFT** `target_ontology_version_id`,
  and per-item **before/after element refs** (element id + before-state / after-state
  so the exact draft mutation is reconstructable). A staleness block writes a
  `CHANGE_REQUEST_SUPERSEDED` audit entry with the mismatch detail and mutates
  nothing else.

- Durable DB/Alembic persistence is not required for the P0 thin slice; the proven
  deterministic process-local store pattern (with `reset_runtime_store()`) is
  acceptable, consistent with MVP6.1–6.5. Durable persistence stays P1/P2.
  (Implementation note for Wave44: the store must reflect the applied element
  state so a subsequent staleness re-check and the before/after audit are honest.)

- **Out of scope (P1 or later unless explicitly promoted):** publishing the
  applied draft (stays the separate MVP3 publish path); auto-apply / auto-publish;
  automatic enforcement; autonomous/agent apply; rollback/undo of an applied
  change; impact simulation / impact-analysis reports; migration-plan or
  release-note generation; post-apply re-validation/re-extraction job creation;
  bulk/batch multi-request apply; conflict auto-merge; multi-tenant runtime;
  copilot/agent runtime; connector/plugin SDK; real LLM execution.

## Consequences

- Backend can draft an additive `apply` endpoint on a change request plus an
  application-status read and an application-audit read, reusing MVP6.5 governance
  shapes, MVP1 ontology-edit semantics, and MVP3/MVP5 audit/RBAC by reference,
  without touching the publish/candidate/prompt/extraction/evaluation write paths
  and without ever mutating the published graph. It models `409 APPLY_TARGET_NOT_DRAFT`,
  `409 CHANGE_ALREADY_APPLIED`, `409 CHANGE_NOT_APPLICABLE`, `409 CHANGE_REQUEST_SUPERSEDED`,
  `403 PERMISSION_DENIED`, and the redefined `GovernanceApplicationMutationGuard`.
- Frontend can add the apply action to the existing MVP6.5 Governance detail —
  visible only for `APPROVED`+`QUEUED`, only to permitted roles, behind an explicit
  human-confirmation step — plus an `APPLIED` state badge, a staleness/`SUPERSEDED`
  conflict UX, and an "applied to DRAFT ontology, NOT published — publish separately"
  banner so users never mistake apply for publish.
- QA can build deterministic local acceptance: apply only from `APPROVED`+`QUEUED`;
  draft-only mutation with `ontology_draft_mutated=true` and every other flag false
  and the published graph provably unchanged; idempotency 409s; staleness→SUPERSEDED
  transition with no mutation; authz 403; full before/after application audit; and
  MVP1–MVP6.5 regression.
- The platform preserves candidate/published graph separation (apply touches only
  the ontology *definition draft*), evidence / ontology-version / audit traceability
  (before/after refs + resulting draft version id), no autonomous publish, no
  automatic enforcement, no auto-apply, and no real LLM execution. The change is
  additive and does not alter MVP1–MVP6.5 paths, enums, or smokes; `APPLIED` and
  `SUPERSEDED` — reserved in ADR 0012 — become real only here.
