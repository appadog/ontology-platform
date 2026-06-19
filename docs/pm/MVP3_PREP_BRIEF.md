# MVP 3 Prep Brief

Status: `WAVE 15 PM IMPLEMENTATION CONTRACT FROZEN`
Date: 2026-06-19

## Goal

MVP 3 turns MVP 2's candidate/evidence output into a controlled review and publishing workflow:

```text
Candidate + Evidence
→ Validation
→ Review task
→ Expert correction / approval / rejection
→ Audit log
→ Publish job
→ Published graph
→ Quality dashboard v0.1
```

MVP 3 must preserve the core product rule: LLM output is never written directly to the published graph.

## Entry Criteria

- MVP 2 product P0 is closed as `PASS WITH P1 TOOLING/ENVIRONMENT EXCEPTIONS`.
- Candidate entity/relation/evidence APIs are available.
- Evidence traceability and fallback UX are accepted.
- Candidate `review_status=PENDING` and `publish_status=NOT_PUBLISHED` are already present.
- Actual API browser smoke remains reproducible.

## MVP 3 P0 Demo Flow

1. Select project and open candidate review inbox.
2. Run or view validation results for candidate entity/relation output.
3. Open a review task with evidence and source context.
4. Edit candidate values or relation endpoints in a correction layer.
5. Approve, reject, request changes / needs discussion, or modify and approve.
6. Publish approved candidates only.
7. Query the published entity/relation graph.
8. Open audit history and confirm original LLM value, expert correction, reviewer, timestamp, and reason.
9. View quality dashboard v0.1.

## Scope

### Backend P0

- `ValidationJob`
- `ValidationResult`
- Validation rules:
  - class exists
  - relation domain/range
  - relation direction
  - required property
  - datatype
  - cardinality
  - duplicate candidate
  - orphan node
  - evidence missing
  - ontology version mismatch
- `ReviewTask`
- `ReviewDecision`
- Candidate correction API:
  - original candidate remains immutable enough for audit
  - corrected fields are stored separately or versioned
- Approve/reject/request-changes/modify-and-approve workflow
- `AuditLog`
- `PublishJob`
- `PublishedEntity`
- `PublishedRelation`
- Published graph query API
- Quality summary API v0.1

### Frontend P0

- Review inbox:
  - priority
  - validation error type
  - confidence
  - assignee
  - status
- Review workbench:
  - source/evidence viewer
  - candidate list/graph context
  - editable detail panel
  - validation results
  - decision history
- Candidate edit UI:
  - entity name/property correction
  - relation source/relation/target correction
  - direction reversal
  - evidence selection/confirmation
- Decision actions:
  - approve
  - reject
  - request changes / needs discussion
  - modify and approve
- Publish queue/job screen
- Published graph explorer v0.1
- Quality dashboard v0.1

### PM P0

- Review policy
- Approval vs publish permission policy
- Candidate correction policy
- Publish policy
- Quality metrics v0.1
- Review workbench acceptance criteria
- UAT scenario

### QA P0

- Validation contract review
- Review decision flow smoke
- Candidate correction audit check
- Publish-only-approved smoke
- Published graph query smoke
- Quality dashboard consistency check
- MVP 2 regression check

## MVP 3 Product Policies

## Wave 14 PM Decision Table

| Decision | MVP 3 P0 ruling | Backend contract impact | Frontend / QA impact |
|---|---|---|---|
| `ReviewDecision` enum | Use `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`. | Store every decision event with decision, reviewer, timestamp, reason, and optional correction snapshot. Map decisions to `CandidateReviewStatus` exactly as listed below. | UI actions must use these four decisions. The `REQUEST_CHANGES` action can be displayed as "Needs discussion" or "Request changes" but must send the canonical enum. |
| `ReviewDecision` to `CandidateReviewStatus` mapping | `APPROVE` -> `APPROVED`; `REJECT` -> `REJECTED`; `REQUEST_CHANGES` -> `NEEDS_DISCUSSION`; `MODIFY_AND_APPROVE` -> `MODIFIED`. | `MODIFIED` requires at least one corrected field diff. `NEEDS_DISCUSSION` is not publishable. Existing `PENDING`, `APPROVED`, `REJECTED`, `MODIFIED`, `NEEDS_DISCUSSION` status values remain the status source. | QA must verify each decision produces the mapped status and that `NEEDS_DISCUSSION` cannot enter publish jobs. |
| Required reason rules | `REJECT`, `REQUEST_CHANGES`, and `MODIFY_AND_APPROVE` require reason. `APPROVE` requires reason only when any non-blocking `WARNING` exists. | Decision API rejects missing reason for required cases. Audit log stores reason. | UI must require reason before enabling those actions. |
| `WARNING` publish policy | `WARNING` candidates may publish only when an explicit reviewer reason exists, evidence is present, and no `FAILED` validation exists. `MISSING_EVIDENCE` remains non-publishable even if represented as `WARNING`. | Publish eligibility checks include validation severity, blocking warning code, evidence presence, and review reason. | QA must test passed publish, warning-with-reason publish, warning-without-reason block, failed block, and missing-evidence block. |
| Published graph persistence boundary | Relational `PublishedEntity` / `PublishedRelation` plus a graph adapter boundary are P0 canonical. Neo4j write is P1/optional adapter behavior. | Backend must not make Neo4j availability a P0 acceptance dependency. Published graph query reads canonical relational data in P0. | Frontend/QA test against API semantics, not local Neo4j presence. |
| Published graph versioning | Each successful `PublishJob` creates an immutable published graph snapshot/version. Project has a current published graph version pointer. | Store publish job id, project id, version number/id, candidate snapshot, ontology version reference, created timestamp, and current pointer update. Full rollback UI remains P1, but history is stored. | Published graph explorer defaults to project current version and can later expose version selector. QA checks current pointer and no pending/rejected leakage. |
| Review task assignment | Manual assignment is P0; automatic assignment/load balancing is P1/MVP4+. | `ReviewTask.assignee_id` may be nullable for unassigned queue. Project admin or review-capable lead can assign/reassign; reviewers can act on tasks assigned to them, and may claim unassigned tasks if the API exposes claim. | Inbox needs assigned-to-me and unassigned filters. QA does not expect automatic assignment. |

## Wave 15 Implementation Contract Freeze

Wave 15 freezes the remaining literals and response shapes before Backend and
Frontend implementation. Backend and Frontend must consume the explicit
eligibility, validation, lineage, and quality fields below. They must not infer
publish policy from scattered fields when `PublishEligibility.reason_codes[]`
or equivalent eligibility codes are available.

| Decision | Frozen contract |
|---|---|
| `ValidationResultSeverity` | Exactly `INFO`, `WARNING`, `FAILED`. Do not use `ERROR`, `CRITICAL`, lowercase values, or UI-only variants in API payloads. |
| Publish eligibility reason codes | `ELIGIBLE`, `NOT_APPROVED_OR_MODIFIED`, `PENDING`, `REJECTED`, `NEEDS_DISCUSSION`, `MISSING_EVIDENCE`, `BROKEN_EVIDENCE`, `FAILED_VALIDATION`, `WARNING_REASON_REQUIRED`, `ALREADY_PUBLISHED`, `ONTOLOGY_VERSION_MISMATCH`, `PUBLISH_PERMISSION_REQUIRED`, `CORRECTION_DIFF_REQUIRED`. |
| Review inbox list response | Wrapped response shape: `{ items, total_count, limit, offset }`. `items[]` contains review task inbox rows. Backend may add display/context fields to each row, but Frontend must not require pagination metadata from headers only. |
| Validation result UI fields | `field_path`, `blocking`, and `suggested_fix` are first-class API fields. `field_path` may be an empty string or candidate-level path for candidate-wide validation. `blocking=true` must align with publish blocking policy. |
| Published graph lineage | Published entity/relation detail must expose lineage fields: publish job id, published graph version id and number, ontology version id, candidate id/kind, original snapshot or reference, corrected snapshot when applicable, evidence ids/refs, reviewer id/display name, review decision id/type, reason, reviewed timestamp, and published timestamp. |
| `QualitySummary` schema | Typed groups are frozen as `candidate_counts`, `validation_counts`, `review_counts`, `publish_counts`, and `rates`. Each metric must expose a value or numerator/denominator/rate plus drilldown query hints. |

### Publish Eligibility Reason Code Rules

- `ELIGIBLE` is returned when a candidate can be selected for publishing.
- `NOT_APPROVED_OR_MODIFIED` is the generic review-state block when the exact
  state is not exposed to a caller; Backend should prefer `PENDING`,
  `REJECTED`, or `NEEDS_DISCUSSION` when it can safely reveal the state.
- `MISSING_EVIDENCE` means no acceptable evidence is attached.
- `BROKEN_EVIDENCE` means evidence references exist but cannot resolve to a
  valid evidence/source record.
- `FAILED_VALIDATION` means at least one `ValidationResultSeverity.FAILED`
  result blocks publishing.
- `WARNING_REASON_REQUIRED` means a `WARNING` exists and no explicit reviewer
  reason has accepted that warning.
- `ALREADY_PUBLISHED` means publishing again would duplicate an already
  published candidate; the job may skip it idempotently.
- `ONTOLOGY_VERSION_MISMATCH` means the candidate/review validation version
  differs from the publish job ontology version.
- `PUBLISH_PERMISSION_REQUIRED` means the current actor may review but cannot
  run or create the publish job.
- `CORRECTION_DIFF_REQUIRED` means a modified approval path is requested but no
  non-empty correction diff exists.

### QualitySummary v0.1 Typed Groups

`candidate_counts`:

- `total`
- `entity`
- `relation`
- `property_value`
- `missing_evidence`

`validation_counts`:

- `not_validated`
- `passed`
- `warning`
- `failed`
- `by_rule_code`

`review_counts`:

- `pending`
- `approved`
- `rejected`
- `modified`
- `needs_discussion`

`publish_counts`:

- `not_published`
- `published`
- `rolled_back`
- `published_entities`
- `published_relations`
- `publish_success`
- `publish_failed`

`rates`:

- `approval_rate`
- `rejection_rate`
- `modification_rate`
- `validation_failure_rate`
- `evidence_missing_rate`
- `published_ratio`

Each count metric returns `value` and optional `drilldown`. Each rate metric
returns `numerator`, `denominator`, `rate`, and optional `drilldown`. Drilldown
hints use canonical targets such as `review_inbox`, `publish_jobs`, and
`published_graph`, plus query params that the Frontend can apply directly.

### ReviewDecision Status Transition Rules

| Current candidate state | Decision | Resulting `CandidateReviewStatus` | Publish eligible after decision? |
|---|---|---|---|
| `PENDING` or `NEEDS_DISCUSSION` | `APPROVE` | `APPROVED` | Yes, only if evidence exists, no `FAILED` validation exists, and warning policy is satisfied. |
| `PENDING` or `NEEDS_DISCUSSION` | `REJECT` | `REJECTED` | No. |
| `PENDING`, `APPROVED`, or `MODIFIED` | `REQUEST_CHANGES` | `NEEDS_DISCUSSION` | No. |
| `PENDING` or `NEEDS_DISCUSSION` | `MODIFY_AND_APPROVE` | `MODIFIED` | Yes, only if correction diff exists, evidence exists, no `FAILED` validation exists, and warning policy is satisfied. |

Published candidates must not be modified in place. Later corrections require a new review/publish cycle or rollback/replacement design, which is outside MVP 3 P0.

### Candidate Correction Policy

- LLM original candidate values must remain traceable.
- Expert corrections must be stored as review/correction data, not as silent replacement of raw LLM output.
- A candidate can reach `review_status=MODIFIED` only when at least one corrected field differs from the original.
- Rejecting a candidate must require a reason.
- Needs discussion is a review status, not a publishable state.

### Validation Policy

- Validation results are tied to candidate id, ontology version id, validation rule id/code, severity, message, and created timestamp.
- `FAILED` validation blocks publishing unless a future PM decision creates an explicit override. MVP 3 P0 does not include automatic override.
- `WARNING` validation can be approved only with reviewer reason.
- `WARNING` validation can be published only when the reviewer reason is explicit, evidence is present, and no `FAILED` validation exists.
- Missing evidence remains not publishable in P0.

### Review and Publish Policy

- Review approval and publishing are separate actions.
- `REVIEWER` can decide review tasks.
- `PROJECT_ADMIN` or publish-capable role can run publish jobs.
- Publish job must include only candidates with:
  - `review_status=APPROVED` or `MODIFIED`
  - evidence present
  - no blocking validation failure
  - reviewer reason when validation status is `WARNING`
  - `publish_status=NOT_PUBLISHED`
- Published graph writes must be idempotent.
- Rollback history must be stored even if full rollback UI is P1.

### Audit Policy

Audit log must capture:

- project id
- candidate id and candidate kind
- original LLM value snapshot or reference
- corrected value snapshot when applicable
- review decision
- reviewer
- timestamp
- reason
- publish job id when published

### Published Graph Policy

- Candidate graph and published graph remain separate.
- P0 canonical storage is relational `PublishedEntity` / `PublishedRelation` tables with a graph adapter boundary.
- Neo4j write is P1/optional adapter behavior for MVP 3. If Neo4j is available locally, Backend may write through the adapter as a non-blocking enhancement.
- Each successful `PublishJob` creates an immutable published graph snapshot/version and moves the project-level current published graph pointer to that snapshot.
- Published graph query UI/API must not read pending candidates as published facts.

## Quality Metrics v0.1

- total candidates
- validation pass / warning / failed counts
- review pending / approved / rejected / modified counts
- publish count
- approval rate
- rejection rate
- modification rate
- validation failure rate
- evidence missing rate

## Non-goals

- Automatic approval policy
- RAG/search over published graph
- Advanced quality scoring
- Model/provider performance comparison
- Collaboration comments/SLA
- Production RBAC/SSO
- Multi-tenant governance
- Full rollback UI beyond audit/publish history

## Suggested MVP 3 Waves

1. Wave 14: PM contract and acceptance only.
2. Wave 15: Backend validation/review/publish data model and API draft.
3. Wave 16: Frontend review inbox/workbench mock-first UI and API boundary.
4. Wave 17: Backend/Frontend actual API integration and publish graph query.
5. Wave 18: QA hardening, quality dashboard, UAT closeout.

## Closed Decisions for Wave 14

- Exact review decision enum and `CandidateReviewStatus` mapping are closed in the Wave 14 PM Decision Table.
- `WARNING` candidates can publish only with explicit reviewer reason, evidence present, and no `FAILED` validation.
- Relational published tables are P0 canonical; Neo4j write is P1/optional graph adapter behavior.
- Published graph versioning is per successful publish job snapshot with a project-level current pointer.
- Review task assignment is manual in P0; automatic assignment is P1/MVP4+.

## Closed Decisions for Wave 15

- `ValidationResultSeverity` is frozen as `INFO`, `WARNING`, `FAILED`.
- Publish eligibility reason codes are frozen in the Wave 15 table and must be
  used for Backend eligibility checks, Frontend disabled states, and QA
  assertions.
- Review inbox list response is wrapped as `{ items, total_count, limit,
  offset }`.
- `ValidationResult.field_path`, `ValidationResult.blocking`, and
  `ValidationResult.suggested_fix` are first-class API fields.
- Published graph entity/relation lineage fields are required for audit-friendly
  detail panels and QA verification.
- `QualitySummary` groups, metric value shapes, and drilldown query hints are
  typed contract fields, not free-form dashboard objects.
- Backend/Frontend must not re-derive publish policy from independent review,
  validation, evidence, and permission fields when eligibility codes are present.
