# MVP 6.6 — Governance Change Application (APPROVED+QUEUED → APPLIED into a DRAFT ontology version) — PM Freeze

Status: `FROZEN / WAVE 43 PM DECISION (CONTRACT-FIRST) + WAVE 44 GATE FREEZE §9 (PM6-026, G1-G6 FROZEN / G7-G8 CONFIRMED — THIN IMPLEMENTATION)`
Date: 2026-07-02
Backlog: `PM6-025` (governance change-application P0 freeze); `PM6-026` (Wave44 gate freeze §9)

Wave43 is contract-first planning only. No runtime API route, FastAPI service,
DB model, Alembic migration, frontend route/component, seed, smoke, or test is
added this wave. Runtime implementation waits for a Wave44 thin-implementation
order after Backend contract draft + Frontend field/state/IA review + QA
executable checklist are all ready. Mirrors Wave14/19/23/30/33/39/41.

This slice is the **deferred application slice from ADR 0012**. It is the FIRST
governance operation that mutates ontology state, so the boundary is fixed
durably in **ADR 0013**. Keep this brief thin; ADR 0013 is the authority.

---

## 1. Theme Choice + Rationale

**Chosen P0: human-initiated application of an APPROVED+QUEUED ontology change
request onto a DRAFT ontology version** (QUEUED → APPLIED), with separate audit.

MVP6.5 (ADR 0012) shipped the lifecycle spine and stopped at `APPROVED` +
`application_state=QUEUED` — approval records intent + audit only, and `APPLIED`
/ `SUPERSEDED` were reserved for "a later, human-initiated, separately-audited
application slice through the existing MVP1 ontology-edit + MVP3 publish paths."
MVP6.6 is exactly that slice, kept to its smallest coherent form:

- Only the **apply-to-DRAFT** half is opened. **Publishing** the applied draft
  stays the separate existing MVP3 publish path (a later human step); it is NOT
  in this slice.
- Application reuses the **existing MVP1 ontology-edit semantics** by reference
  (create/update/archive on a DRAFT version) — no new mutation engine, no
  renames.
- The dangerous edges — auto-apply, auto-publish, enforcement, rollback, impact
  simulation, migration/release-note generation, re-validation/re-extraction —
  stay excluded (roadmap `§6`/`§7`).

This preserves candidate/published separation (apply touches only the ontology
**definition draft**), and makes `APPLIED`/`SUPERSEDED` real for the first time.

---

## 2. P0 Demo Flow (frozen)

```text
select project
-> open Governance -> open an APPROVED change request (application_state = QUEUED)
-> (read-only) see application-status pre-check: target DRAFT version + per-item
     before/after preview + a staleness warning if the approved snapshot no longer
     matches the current draft target
-> a permitted role (ONTOLOGY_MANAGER / PROJECT_ADMIN / SYSTEM_ADMIN) clicks
     "Apply to draft" and confirms (explicit human-confirmation step)
-> apply executes the change items against a DRAFT ontology version via existing
     MVP1 ontology-edit semantics:
        ADD      -> create the element in the DRAFT version
        MODIFY   -> update the element in the DRAFT version
        DEPRECATE-> set OntologyElementStatus = ARCHIVED in the DRAFT version
     and sets application_state = APPLIED
-> confirm the "applied to DRAFT ontology, NOT published — publish separately"
     banner: the published graph is unchanged; publishing is a later MVP3 step
-> open the application audit: actor + timestamp + source request/items +
     resulting DRAFT ontology version id + per-item before/after element refs
-> (idempotency) re-applying the same request -> 409, no double apply
-> (staleness) if the draft target changed since approval -> apply is blocked,
     request goes application_state = SUPERSEDED, nothing is mutated, audit records it
```

Non-permitted roles can view the request, the application status, and the
application audit, but the apply action is gated (`403`) and mutates nothing.

---

## 3. Frozen Decisions (authority: ADR 0013)

- **Apply precondition:** `status == APPROVED` AND `application_state == QUEUED`
  only. Human-initiated only (an explicit `apply` call); approval never triggers
  apply.
- **Draft-only, application ≠ publish:** apply writes ONLY to a DRAFT ontology
  version via MVP1 ontology-edit semantics. It NEVER touches the published graph,
  never starts a publish job, never rolls back. Publishing stays the separate
  MVP3 path. This is the ADR 0013 core.
- **Target draft:** applier supplies `target_ontology_version_id` (a DRAFT
  version) or defaults to the project's current DRAFT; a non-DRAFT target →
  `409 APPLY_TARGET_NOT_DRAFT`. Apply does not itself cut a version.
- **Change-item semantics:** `ADD` → create element; `MODIFY` → update element;
  `DEPRECATE` → set `OntologyElementStatus=ARCHIVED`. All on the DRAFT version.
- **Idempotency:** already-`APPLIED` → `409 CHANGE_ALREADY_APPLIED`; not
  `APPROVED`/`QUEUED` → `409 CHANGE_NOT_APPLICABLE`. Never a double apply.
- **Staleness → SUPERSEDED:** stale when, at apply time, the approved snapshot no
  longer matches the current draft target — (a) the target draft advanced/diverged
  such that a targeted element changed, or (b) a `MODIFY`/`DEPRECATE` target
  element was modified/archived/deleted since approval (current state ≠ approved
  before-state). Apply is blocked, mutates nothing, `application_state` →
  `SUPERSEDED`, response `409 CHANGE_REQUEST_SUPERSEDED`, audit records the
  mismatch. **Auto-detected at apply time**; the read-only application-status
  pre-check MAY also surface a `stale`/would-supersede hint, but the authoritative
  transition is on the apply attempt. `SUPERSEDED` is terminal for application.
- **Authorization:** apply rights **= approver rights**
  (`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`), reusing the MVP5 `Role`
  restriction; no distinct apply role literal. The applier **may differ** from the
  approver/proposer (recommended + audited). No self-apply prohibition (SoD was
  enforced at approve: approver ≠ proposer). Unauthorized → `403 PERMISSION_DENIED`.
- **Application audit:** actor + role, timestamp, source request id + applied
  item ids, resulting DRAFT `target_ontology_version_id`, per-item before/after
  element refs. New `GovernanceApplicationAuditAction`
  (`CHANGE_REQUEST_APPLIED`, `CHANGE_REQUEST_SUPERSEDED`). Reuses MVP3/MVP5 audit
  shape by reference; no rename.

---

## 4. Redefined Mutation Guard (frozen) — the ONE sanctioned mutation surface

New `GovernanceApplicationMutationGuard` on the **successful apply** response —
exactly one flag legitimately true:

| flag | value on successful apply | rationale |
|---|---|---|
| `ontology_draft_mutated` | **true** | the ONE sanctioned surface (DRAFT ontology only) |
| `published_graph_mutated` | false | publish is a separate MVP3 step |
| `candidate_graph_mutated` | false | candidates untouched |
| `prompt_version_mutated` | false | prompts untouched |
| `publish_job_started` | false | no publish job |
| `extraction_job_started` | false | no extraction |
| `evaluation_run_started` | false | no evaluation |

- **All read/lifecycle governance endpoints** (MVP6.5 list/get/propose/submit/
  withdraw/review/decision/audit, plus the MVP6.6 application-status read and
  application-audit read) keep the existing **all-false** `GovernanceMutationGuard`
  — unchanged.
- A **blocked apply** (idempotency / staleness / authz) mutates nothing and returns
  an **all-false** guard.
- QA asserts exactly one sanctioned mutation surface: `ontology_draft_mutated=true`
  **only** on a successful apply; any other true flag — or a true
  `ontology_draft_mutated` on any non-apply endpoint — is a defect.

---

## 5. Existing Artifacts This Touches (reuse by reference; no renames)

| Existing artifact | How MVP6.6 relates to it |
|---|---|
| MVP6.5 governance module (`OntologyChangeRequest`/`OntologyChangeItem`, `GovernanceApplicationState`, audit shape, `Role` gating) | Extended: apply acts on an `APPROVED`+`QUEUED` request, sets `application_state=APPLIED`/`SUPERSEDED`. No rename. |
| `GovernanceApplicationState` (`NOT_APPLICABLE`/`QUEUED`/`APPLIED`/`SUPERSEDED`) | `APPLIED` and `SUPERSEDED` — reserved in ADR 0012 — become real, produced only by MVP6.6 apply. |
| MVP1 ontology-edit (`POST /ontology-versions`; `POST/PATCH/DELETE` class/property/relation on a DRAFT version; `OntologyElementStatus`, `OntologyVersionStatus`) | The sanctioned mutation semantics apply reuses **by reference**: ADD=create, MODIFY=update, DEPRECATE=archive, on a DRAFT version only. No rename; apply does not add a new edit primitive. |
| MVP3 publish (`POST /projects/{id}/publish-jobs`, `PublishedGraphVersion`) | **NOT touched.** Publishing the applied draft stays the separate MVP3 path in a later human step. |
| MVP5 `Role` | Apply rights = approver rights (`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`); reused verbatim, no new literal. |
| MVP3/MVP5 audit shape | Application audit reuses it by reference; new `GovernanceApplicationAuditAction` names the events. |

---

## 6. Explicit Exclusions (out of MVP6.6 P0)

- **Publishing** the applied draft (stays the separate existing MVP3 publish
  path, a later human step).
- **Auto-apply / auto-publish**, automatic enforcement, autonomous/agent apply.
- **Rollback / undo** of an applied change.
- **Impact simulation / impact-analysis reports** (roadmap §7 Theme 4).
- **Migration-plan** / **release-note** generation.
- **Post-apply re-validation / re-extraction job creation.**
- Bulk/batch multi-request apply; conflict auto-merge (staleness blocks, it never
  merges); ontology diff viz beyond a per-item before/after summary.
- Real LLM/provider execution; copilot/agent runtime; connector/plugin SDK;
  multi-tenant runtime.
- Durable DB/Alembic persistence is NOT required for the P0 thin slice; a
  deterministic process-local store (`reset_runtime_store()`, the MVP6.1–6.5
  pattern) is acceptable. Durable persistence stays P1/P2.

---

## 7. Durable Invariants Preserved

- The **published graph is never mutated** by apply; publishing stays the
  separate MVP3 path. ✔
- Candidate and published graphs remain separated; apply touches only the
  ontology **definition draft**. ✔
- Evidence / ontology-version / audit traceability preserved: application audit
  records actor/timestamp/source request+items/resulting DRAFT version id/per-item
  before/after element refs. ✔
- No autonomous publish, no automatic enforcement, no auto-apply, no real LLM in
  P0. ✔
- Additive only — no MVP1–MVP6.5 path/enum/smoke is broken; new objects/enums are
  additive and reuse MVP1 ontology-edit / MVP3 publish / MVP5 `Role` / MVP3–MVP5
  audit / MVP6.5 governance shapes by reference (no renames). The one new true
  mutation flag (`ontology_draft_mutated`) is contained to the apply response. ✔

---

## 8. Handoff Notes (what the next roles should produce)

- **Backend (`BE6-044`~`BE6-047`)**: draft additive endpoint(s) + DTO/enum names
  in `docs/api/MVP6_6_GOVERNANCE_APPLICATION_API_CONTRACT_DRAFT.md` and an OpenAPI
  planning artifact `docs/api/openapi-mvp6-6-draft.json` (OpenAPI 3.1.0,
  additive/disjoint to MVP1–MVP6.5, version `0.6.6-draft`). Define: an `apply`
  action on a change request (e.g. `POST .../change-requests/{id}/apply` with
  optional `target_ontology_version_id`); a read-only application-status pre-check
  (target draft + per-item before/after preview + staleness/would-supersede hint);
  an application-audit read; the new `GovernanceApplicationMutationGuard`
  (`ontology_draft_mutated=true` on success, all others false); the new
  `GovernanceApplicationAuditAction` (`CHANGE_REQUEST_APPLIED`,
  `CHANGE_REQUEST_SUPERSEDED`). Model `409 APPLY_TARGET_NOT_DRAFT`,
  `409 CHANGE_ALREADY_APPLIED`, `409 CHANGE_NOT_APPLICABLE`,
  `409 CHANGE_REQUEST_SUPERSEDED`, `403 PERMISSION_DENIED`. Reuse MVP6.5 +
  MVP1 ontology-version + MVP3/MVP5 shapes by `$ref` (no rename). Capture open
  questions (esp.: is the target-draft default = project current DRAFT, or must it
  be explicit; the exact staleness comparison key per change_type; whether the
  read-only pre-check may itself flip QUEUED→SUPERSEDED or only the apply attempt).
- **Frontend (`FE6-065`~`FE6-068`)**: document, in
  `docs/pm/MVP6_6_FRONTEND_UX_REQUIREMENTS.md`, how the apply action appears in
  the existing MVP6.5 Governance detail (only for `APPROVED`+`QUEUED`, only for
  permitted roles, behind a human-confirmation step); the `APPLIED` state badge
  (D6); the staleness/`SUPERSEDED` conflict UX (warn before, block+explain on
  transition); the **"applied to DRAFT ontology, NOT published — publish
  separately" banner**; the application-status pre-check panel (target draft +
  per-item before/after); the application-audit view. First-class loading/empty/
  error/permission states. Apply the closed design language (Section+Card, KO
  titles, D6 badges, one primary action). DTO gap analysis vs the Backend draft.
  No route/component/type/mock/smoke code.
- **QA (`INT6-051`~`INT6-054`)**: executable acceptance checklist in
  `docs/backlog/INT6_6_GOVERNANCE_APPLICATION_ACCEPTANCE.md` (C planning gates + R
  NOT-RUNNABLE runtime gates), continuing INT6 numbering from `INT6-051` (INT6 used
  through INT6-050). Verify PM/BE/FE agree on the apply P0, states
  (`APPLIED`/`SUPERSEDED` produced only here), the application-≠-publish + draft-only
  boundary, staleness→SUPERSEDED, idempotency, authz, the redefined guard (one
  true flag), the application audit content, and exclusions. Confirm no runtime
  leaked (search `apps/`+`infra/`). OpenAPI parse/additivity. Recommend Wave44 thin
  implementation, hardening, or PM redesign.

---

## 9. Wave44 Gate Freeze (PM6-026) — implementable rulings

Wave44 opens the thin implementation. These six gates (the Backend open questions
from the Wave43 contract draft §"Open Questions") are now frozen as one precise
rule each; G7/G8 are FE-owned and confirmed. They refine — never widen — §3 and
ADR 0013. Scope is unchanged: the frozen apply P0 + the three endpoint families
only; no publish, no auto-apply, no partial apply.

- **G1 — target-draft default.** An omitted `target_ontology_version_id` resolves
  to the **project's single current DRAFT** ontology version. If **zero** DRAFT
  versions exist, apply returns `409 APPLY_TARGET_NOT_DRAFT` and does **NOT**
  auto-create a version. An explicitly supplied id must exist
  (`404 ONTOLOGY_VERSION_NOT_FOUND` otherwise) and must be
  `OntologyVersionStatus=DRAFT` (`409 APPLY_TARGET_NOT_DRAFT` otherwise). Apply
  never cuts a version.

- **G2 — per-`change_type` staleness key.** Compared at apply against the
  approval-captured snapshot (see G3):
  - `ADD`: no before-state → stale **only** if its `ontology_version_id` context
    no longer resolves to the resolved target draft
    (`stale_reason=VERSION_CONTEXT_DIVERGED`).
  - `MODIFY` / `DEPRECATE`: stale if the target element is **absent**
    (`TARGET_ELEMENT_DELETED`), **or** its current `OntologyElementStatus` ≠ the
    captured status (`TARGET_ELEMENT_ARCHIVED` when now ARCHIVED/DELETED-vs-active,
    else `TARGET_ELEMENT_MODIFIED`), **or** its **captured content fingerprint** ≠
    current. The fingerprint = (`target_kind`, element id, `OntologyElementStatus`,
    a stable hash of the approval-time element payload / `proposed_change`).
    Comparison is exact-equality of the fingerprint tuple.

- **G3 — approved-snapshot capture point.** The before-state snapshot compared at
  apply is **captured at APPROVE time** and stored on the QUEUED request. Apply
  compares against that stored snapshot; it is **not** recomputed from audit
  history at apply time. (Wave44 store note: persist the snapshot on the request
  when it transitions to `APPROVED`+`QUEUED`.)

- **G4 — partial-apply = ALL-OR-NOTHING.** If **any** item is stale or invalid,
  apply mutates **nothing**, transitions `application_state=QUEUED → SUPERSEDED`
  (terminal), and returns `409 CHANGE_REQUEST_SUPERSEDED`. There is no per-item
  partial application and no partial-success response. A `404`/`409 APPLY_TARGET_
  NOT_DRAFT` on target resolution also mutates nothing (no state transition).

- **G5 — pre-check side-effects = PURELY ADVISORY.** `GET .../application-status`
  **never** mutates state and **never** flips `QUEUED → SUPERSEDED`. Its
  `would_supersede` / per-item `stale` fields are advisory hints only. **Only** the
  `POST .../apply` attempt is authoritative and may set `SUPERSEDED`. A stale
  request may show `would_supersede=true` yet remain `QUEUED` until an apply is
  attempted.

- **G6 — post-apply capability values.** Capability shape =
  `ApplicationCapabilities{ can_view, can_apply }`. `can_apply=true` **only** when
  the actor holds apply rights (`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`)
  AND `status==APPROVED` AND `application_state==QUEUED`. After a terminal
  `APPLIED` or `SUPERSEDED` state, `can_apply=false` (state no longer `QUEUED`);
  `can_view` stays `true` for any project member.

- **G7 (FE-owned, confirmed).** FE adds an `APPLIED` `StatusBadge` token — tone
  `success`, KO `초안에 적용됨 (미게시)` (never reads as "published") — and
  **overrides `SUPERSEDED` from the current `neutral` tone to `warning`** (KO
  `대체됨 (미적용)`, terminal). The MVP6.5 `ApplicationStateBadge` unexpected-state
  guard for APPLIED/SUPERSEDED is replaced by real rendering.

- **G8 (FE-owned, confirmed).** The successful-apply response carries
  `GovernanceApplicationMutationGuard` with the **7 keys**: `ontology_draft_mutated`
  (true on success), `published_graph_mutated`, `candidate_graph_mutated`,
  `prompt_version_mutated`, `publish_job_started`, `extraction_job_started`,
  `evaluation_run_started` (all false). This is **distinct** from the all-false
  MVP6.5 `GovernanceMutationGuard` (which uses `ontology_definition_mutated` and
  `change_auto_applied`). FE renders the one-true-flag proof line from the apply
  response and the all-false guard from read/lifecycle/blocked-apply responses.

**Contract impact:** none of G1-G8 changes the frozen endpoint set, DTO field
names, or enum literals in `docs/api/openapi-mvp6-6-draft.json`; they resolve the
draft's six "Open Questions" and confirm the two FE gaps. G1-G6 pick the exact
option the draft already recommended, so the OpenAPI artifact is unchanged.
