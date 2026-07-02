# ADR 0012: MVP6.5 Governance Workflow — Approval-Is-Intent-Not-Auto-Apply Boundary

## Status

Accepted

## Context

MVP6.1–6.4 closed the evaluation/gold-set knowledge-ops themes. By commander
direction the next MVP6 theme is **Governance workflow**: an auditable ontology
change-request lifecycle (propose → review → approve/reject → audit). The
roadmap (`04_...md` §6 "Theme 3 — 온톨로지 거버넌스") frames this as managing
ontology change "개인 작업이 아니라 조직적 승인 프로세스로" and lists
`OntologyChangeRequest` + propose/review/approve/reject/publish/rollback plus
impact analysis, migration plans, and release notes as the full theme.

That full theme is far larger than one coherent P0. Its dangerous edge is the
`.../publish` and `.../rollback` operations and the "변경 후 재검증/재추출 작업
생성" step: if an approval could auto-mutate the ontology definition or the
published graph, it would collide with the platform's hardest invariants —
candidate/published separation, no autonomous publish, and human-gated
application through the existing MVP1 ontology-edit and MVP3 publish paths.

MVP3 (review/correction/publish/audit, ADR 0006), MVP5 (admin/governance +
RBAC/audit, ADR 0008), and the MVP6.2/6.4 audit-only + all-false
mutation-guard precedent (ADR 0011) established a durable pattern for adding a
review/decision surface on top of closed data without weakening those rules.
MVP6.5 P0 reuses that pattern for a change-request lifecycle whose approval is
**recorded intent + audit only**.

## Decision

- **MVP6.5 P0 is an auditable ontology change-request lifecycle**: propose a
  change request (add / modify / deprecate a class, property, or relation) →
  reviewer comments / requests changes → an approver approves or rejects with a
  reason → a full audit trail. It is a **proposal/decision record in the
  candidate/analysis (governance) layer**. It is NOT an ontology-definition
  editor, NOT a publish engine, and NOT a rollback engine.

- **Approval records INTENT + AUDIT only; it does NOT auto-apply.** An
  `APPROVED` change request is QUEUED as intent (`application_state=QUEUED`). In
  P0 nothing is applied to the ontology definition, the candidate graph, or the
  published graph as a side effect of approval. Actual application flows through
  the existing MVP1 ontology-edit path and the existing MVP3 review/publish path
  in a LATER slice — as a separate, human-initiated, separately-audited action.
  "Approved" means: *a decision of record exists, with actor + reason +
  timestamp + target element + ontology version context, authorizing a future
  application that has not yet happened.*

- **What the states mean (frozen).** A change request moves
  `DRAFT → OPEN → IN_REVIEW → {APPROVED | REJECTED}` with `WITHDRAWN` reachable
  by the proposer from `DRAFT`/`OPEN`/`IN_REVIEW`. `REQUEST_CHANGES` returns an
  `IN_REVIEW` request to `OPEN` (proposer revises, no new request needed).
  `APPROVED` and `REJECTED` are terminal decision states. An **orthogonal
  application-state** field (`application_state`) tracks post-approval
  intent-only lifecycle: `NOT_APPLICABLE` (not yet approved) → `QUEUED`
  (approved, awaiting a later application slice). `APPLIED` and `SUPERSEDED`
  application-states are RESERVED for the later application slice and are NOT
  produced by any P0 operation.

- **Reason rules (frozen).** `REJECT` and `REQUEST_CHANGES` require a
  non-empty reason. `APPROVE` requires a reason/justification note (governance
  approvals are auditable and must be justified). `COMMENT` and `WITHDRAW`
  reasons are optional. A decision on a non-`OPEN`/non-`IN_REVIEW` request
  returns `409` (conflict) rather than mutating.

- **Reuse MVP3 review-decision + MVP5 RBAC vocabulary by reference; no
  renames.** Decision semantics mirror MVP3 `ReviewDecisionType`
  (`APPROVE`/`REJECT`/`REQUEST_CHANGES`) plus `COMMENT`; MVP3's
  `MODIFY_AND_APPROVE` is intentionally excluded because governance approval
  never applies an inline modification in P0. Roles reuse the shipped `Role`
  enum verbatim (`apps/backend/app/core/enums.py`): any project member may
  propose; `REVIEWER` (and elevated `PROJECT_ADMIN`/`ONTOLOGY_MANAGER`/
  `SYSTEM_ADMIN`) may review/comment/request-changes; the **approve/reject
  decision is restricted to `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`**.
  The proposer may not approve their own request (segregation of duties). No new
  role literal is introduced in P0.

- **Change-request target kinds are references, not edits.** A change item
  names a `target_kind` (`CLASS`/`PROPERTY`/`RELATION`), a `change_type`
  (`ADD`/`MODIFY`/`DEPRECATE`), the target `ontology_class_id` /
  `ontology_property_id` / `ontology_relation_id` (null for `ADD`), the
  `ontology_version_id` context, and a proposed-change payload that is stored as
  intent only. The governance module reads ontology definitions to render
  context; it never writes them.

- **Every decision is audited.** Each lifecycle event records actor, action,
  reason/note, timestamp, target change request + change item ids, target
  ontology element + ontology version context, and the before/after request
  state. Audit reuses the MVP3/MVP5 audit shape by reference; a new
  `GovernanceAuditAction` enum names the governance-specific events.

- **All-false mutation guard.** Every governance write response exposes an
  all-false `GovernanceMutationGuard`:
  `ontology_definition_mutated: false`, `published_graph_mutated: false`,
  `candidate_graph_mutated: false`, `prompt_version_mutated: false`,
  `publish_job_started: false`, `extraction_job_started: false`,
  `change_auto_applied: false`. This mirrors the MVP6.2/6.4 pattern and proves
  approval did not apply anything.

- Durable DB/Alembic persistence is not required for the P0 thin slice; the
  proven deterministic process-local store pattern (with
  `reset_runtime_store()`) is acceptable. Durable persistence stays P1/P2.

- **Out of scope (P1 or later unless explicitly promoted):** auto-apply of an
  approved change to the ontology or published graph; automatic enforcement;
  autonomous/agent publish or rollback; impact simulation / impact analysis
  reports; migration plan generation; automatic release-note generation;
  post-change re-validation/re-extraction job creation; ontology diff
  visualization beyond a plain change-item summary; multi-tenant runtime;
  copilot/agent runtime; connector/plugin SDK; real LLM execution.

## Consequences

- Backend can draft additive change-request CRUD, submit/withdraw, review
  (comment / request-changes), approve/reject-with-reason, and audit-log
  endpoints plus an OpenAPI planning artifact, reusing MVP3 review-decision and
  MVP3/MVP5 audit/RBAC shapes by reference, without touching the ontology-edit,
  candidate, prompt, publish, or graph write paths, and without applying any
  approved change.
- Frontend can design a project-scoped Governance area (contextual under the
  Review group per ADR 0010, no ID-bound pages in the global LNB): a change
  request list/board, a change-request detail with the change items + review
  thread + decision panel, honest permission-limited states for
  propose/review/approve, and an explicit "approved = queued intent, not yet
  applied" banner so users never mistake approval for application.
- QA can build deterministic local acceptance: the lifecycle state machine,
  reason-required decisions, `409` on decisions against terminal/wrong states,
  the approver/proposer segregation-of-duties rule, the all-false mutation
  guard at response and data level (no ontology/candidate/published/prompt/
  publish/extraction mutation), and MVP1–MVP6.4 regression.
- The platform preserves candidate/published graph separation, evidence /
  ontology-version / audit traceability, no autonomous publish, no automatic
  enforcement, and no real LLM execution in this P0 thin slice. The change is
  additive and does not alter MVP1–MVP6.4 paths, enums, or smokes.
