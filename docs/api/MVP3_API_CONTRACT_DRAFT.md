# MVP 3 API Contract Draft

Status: `WAVE 15 PM CONTRACT FROZEN`
Date: 2026-06-19

This draft extends the closed MVP 2 candidate/evidence contract with validation,
expert review, correction, audit, publishing, published graph query, and quality
summary v0.1. It is a contract-first artifact only; Wave 14 does not implement
runtime code.

Canonical machine-readable draft: `docs/api/openapi-mvp3-draft.json`.

## Source Decisions

- PM decisions: `docs/pm/MVP3_PREP_BRIEF.md`
- Backlog: `docs/backlog/MVP3_DRAFT_BACKLOG.md`
- Published graph ADR: `docs/adr/0006-mvp3-published-graph-boundary-and-versioning.md`
- Existing runtime baseline: `docs/api/openapi-mvp2-draft.json`

MVP 3 P0 must preserve candidate and published graph separation:

- LLM candidate output is not written directly to published graph tables.
- Original candidate payload remains traceable.
- Expert corrections are stored separately from original LLM output.
- Review approval and publishing are separate actions.
- Relational `PublishedEntity` and `PublishedRelation` tables are P0 canonical.
- Neo4j write is P1/optional adapter behavior.

## Enum Contract

### Existing MVP 2 Enums Reused

`ValidationStatus`

```text
NOT_VALIDATED
PASSED
WARNING
FAILED
```

`CandidateReviewStatus`

```text
PENDING
APPROVED
REJECTED
MODIFIED
NEEDS_DISCUSSION
```

`PublishStatus`

```text
NOT_PUBLISHED
PUBLISHED
ROLLED_BACK
```

### New MVP 3 Enums

`CandidateKind`

```text
ENTITY
RELATION
PROPERTY_VALUE
```

`ValidationJobStatus`

```text
PENDING
RUNNING
SUCCESS
FAILED
```

`ValidationRuleCode`

```text
CLASS_EXISTS
RELATION_EXISTS
RELATION_DOMAIN_RANGE
RELATION_DIRECTION
REQUIRED_PROPERTY
DATATYPE
CARDINALITY
DUPLICATE_CANDIDATE
ORPHAN_NODE
EVIDENCE_MISSING
ONTOLOGY_VERSION_MISMATCH
LOW_CONFIDENCE
```

`ValidationResultSeverity`

```text
INFO
WARNING
FAILED
```

`ReviewTaskStatus`

```text
OPEN
ASSIGNED
IN_REVIEW
DECIDED
CANCELLED
```

`ReviewDecisionType`

```text
APPROVE
REJECT
REQUEST_CHANGES
MODIFY_AND_APPROVE
```

`CorrectionStatus`

```text
DRAFT
SUBMITTED
APPLIED
SUPERSEDED
```

`AuditEventType`

```text
VALIDATION_JOB_CREATED
VALIDATION_RESULT_RECORDED
REVIEW_TASK_CREATED
REVIEW_TASK_ASSIGNED
CORRECTION_SUBMITTED
REVIEW_DECISION_RECORDED
PUBLISH_JOB_CREATED
PUBLISH_JOB_COMPLETED
PUBLISHED_GRAPH_VERSION_CREATED
PUBLISHED_GRAPH_CURRENT_POINTER_UPDATED
```

`PublishJobStatus`

```text
PENDING
RUNNING
SUCCESS
PARTIAL_FAILED
FAILED
```

`PublishEligibilityReasonCode`

```text
ELIGIBLE
NOT_APPROVED_OR_MODIFIED
PENDING
REJECTED
NEEDS_DISCUSSION
MISSING_EVIDENCE
BROKEN_EVIDENCE
FAILED_VALIDATION
WARNING_REASON_REQUIRED
ALREADY_PUBLISHED
ONTOLOGY_VERSION_MISMATCH
PUBLISH_PERMISSION_REQUIRED
CORRECTION_DIFF_REQUIRED
```

Backend must return these stable reason codes from publish eligibility APIs.
Frontend and QA must not infer publish policy from scattered fields when these
codes are available.

## Validation Model

### ValidationJob

```text
id
project_id
ontology_version_id
source_id
extraction_job_id
status
requested_by
created_at
started_at
ended_at
summary
error_code
error_message
```

`summary` includes `target_count`, `passed_count`, `warning_count`,
`failed_count`, and `missing_evidence_count`.

### ValidationResult

```text
id
validation_job_id
project_id
ontology_version_id
candidate_kind
candidate_id
rule_code
severity
message
field_path
blocking
suggested_fix
details
created_at
```

Rules:

- `FAILED` severity blocks publishing.
- `ValidationResultSeverity` is frozen as exactly `INFO`, `WARNING`, `FAILED`.
- `WARNING` severity does not block review, but publish requires explicit
  reviewer reason, evidence present, and no `FAILED` result.
- `EVIDENCE_MISSING` is always non-publishable even if represented through
  existing candidate `validation_status=WARNING`.
- Validation writes do not mutate published graph tables.
- `field_path`, `blocking`, and `suggested_fix` are first-class UI/API fields,
  not hidden keys inside `details`. `field_path` may be an empty string or a
  candidate-level path for candidate-wide validation.

## Review Model

### ReviewTask

```text
id
project_id
candidate_kind
candidate_id
ontology_version_id
source_id
extraction_job_id
status
assignee_id
priority
validation_status
validation_codes
priority_reason
candidate_display_name
assignee_display_name
evidence_count
evidence_state
top_validation_message
last_decision_summary
created_at
updated_at
decided_at
```

Manual assignment is P0. `assignee_id` is nullable for the unassigned queue.

### ReviewDecision

```text
id
review_task_id
project_id
candidate_kind
candidate_id
decision
resulting_review_status
reviewer_id
reason
before_snapshot
correction_id
correction_diff
validation_summary
publish_eligibility
created_at
```

Decision mapping:

| Decision | Resulting review status | Required reason | Extra validation |
|---|---|---|---|
| `APPROVE` | `APPROVED` | Required only when any non-blocking warning exists | evidence exists, no `FAILED` validation for publish eligibility |
| `REJECT` | `REJECTED` | Required | not publishable |
| `REQUEST_CHANGES` | `NEEDS_DISCUSSION` | Required | not publishable |
| `MODIFY_AND_APPROVE` | `MODIFIED` | Required | correction diff must be non-empty |

Allowed transitions:

- `PENDING` or `NEEDS_DISCUSSION` -> `APPROVED` through `APPROVE`.
- `PENDING` or `NEEDS_DISCUSSION` -> `REJECTED` through `REJECT`.
- `PENDING`, `APPROVED`, or `MODIFIED` -> `NEEDS_DISCUSSION` through
  `REQUEST_CHANGES`.
- `PENDING` or `NEEDS_DISCUSSION` -> `MODIFIED` through
  `MODIFY_AND_APPROVE`.
- Published candidates are not modified in place in MVP 3 P0.

Validation errors:

- `REASON_REQUIRED` when reason is missing for `REJECT`, `REQUEST_CHANGES`,
  `MODIFY_AND_APPROVE`, or warning approval.
- `CORRECTION_DIFF_REQUIRED` when `MODIFY_AND_APPROVE` lacks a non-empty diff.
- `INVALID_REVIEW_TRANSITION` when current status and decision do not match the
  transition table.
- `PUBLISHED_CANDIDATE_IMMUTABLE` when attempting to decide or correct an
  already published candidate in place.

## Candidate Correction Model

### CandidateCorrection

```text
id
project_id
candidate_kind
candidate_id
review_task_id
base_candidate_snapshot
corrected_payload
correction_diff
status
created_by
created_at
updated_at
```

Rules:

- `base_candidate_snapshot` captures original LLM output and current candidate
  fields at correction time.
- `corrected_payload` is the expert correction layer.
- `correction_diff` stores field-level changes and must not be empty for
  `MODIFY_AND_APPROVE`.
- Candidate raw payload is not overwritten by correction.
- Publish reads corrected payload when review status is `MODIFIED`; otherwise it
  reads the approved candidate payload.

Minimum correction payload shape:

Entity correction:

```text
entity_name
normalized_name
class_id
property_values
evidence_ids
```

Relation correction:

```text
source_candidate_entity_id
relation_id
target_candidate_entity_id
direction
evidence_ids
```

## Audit Model

### AuditLog

```text
id
project_id
event_type
actor_id
candidate_kind
candidate_id
review_task_id
review_decision_id
validation_job_id
publish_job_id
published_graph_version_id
original_snapshot
corrected_snapshot
reason
metadata
created_at
```

Rules:

- Every mutation in validation/review/correction/publish creates audit data.
- Audit records must preserve original LLM value reference or snapshot.
- Audit records must preserve corrected value snapshot when applicable.
- Audit query is read-only in MVP 3.

## Publish Model

### PublishJob

```text
id
project_id
ontology_version_id
status
requested_by
candidate_refs
eligible_count
published_entity_count
published_relation_count
skipped_count
skip_reasons
published_graph_version_id
created_at
started_at
ended_at
error_code
error_message
```

Publish eligibility:

- `review_status` is `APPROVED` or `MODIFIED`.
- `publish_status` is `NOT_PUBLISHED`.
- Evidence exists.
- No `FAILED` validation exists.
- `EVIDENCE_MISSING` / `MISSING_EVIDENCE` is absent.
- Warning candidates have explicit reviewer reason.
- Candidate ontology version matches the publish job ontology version.

`PublishEligibility.reasons[]` uses `PublishEligibilityReasonCode` exactly.
Return `ELIGIBLE` for eligible rows. Return one or more blocking reason codes
for ineligible rows.

Hard blocks:

- pending candidates
- rejected candidates
- needs-discussion candidates
- failed-validation candidates
- missing-evidence candidates
- warning-without-reason candidates

### PublishedGraphVersion

```text
id
project_id
version
ontology_version_id
publish_job_id
is_current
created_by
created_at
summary
```

Each successful `PublishJob` creates an immutable snapshot/version and updates
the project current pointer to that version. The current pointer can be stored
directly on `projects.current_published_graph_version_id` or in a separate
project graph state table if the implementation wants to keep `Project` small.

### PublishedEntity

```text
id
project_id
published_graph_version_id
ontology_version_id
class_id
canonical_name
properties
source_candidate_entity_ids
original_snapshot
corrected_snapshot
lineage
created_at
```

### PublishedRelation

```text
id
project_id
published_graph_version_id
ontology_version_id
source_published_entity_id
relation_id
target_published_entity_id
properties
source_candidate_relation_ids
original_snapshot
corrected_snapshot
lineage
created_at
```

Rules:

- P0 query APIs read relational `PublishedEntity` and `PublishedRelation`.
- Neo4j write is optional P1 and must not be required for P0 tests.
- Published graph snapshots are immutable. Later replacement/rollback can create
  a new snapshot in a future wave.
- Publish should be idempotent for the same candidate refs and target ontology
  version; duplicate facts must not appear in the same snapshot.
- `lineage` on every published entity/relation includes publish job id,
  published graph version id and number, ontology version id, candidate id/kind,
  original snapshot or snapshot reference, corrected snapshot when applicable,
  evidence ids/refs, reviewer id/display name, review decision id/type, reason,
  reviewed timestamp, and published timestamp.

## Quality Summary Model v0.1

### QualitySummary

```text
project_id
ontology_version_id
generated_at
candidate_counts
validation_counts
review_counts
publish_counts
rates
```

`candidate_counts`

```text
total
entity
relation
property_value
missing_evidence
```

`validation_counts`

```text
not_validated
passed
warning
failed
by_rule_code
```

`review_counts`

```text
pending
approved
rejected
modified
needs_discussion
```

`publish_counts`

```text
not_published
published
rolled_back
published_entities
published_relations
current_version
publish_success
publish_failed
```

`rates`

```text
approval_rate
rejection_rate
modification_rate
validation_failure_rate
evidence_missing_rate
published_ratio
```

Quality metric value shapes are typed:

```text
count metric: value, drilldown
rate metric: numerator, denominator, rate, drilldown
drilldown hint: target, query
```

Canonical drilldown `target` values are `review_inbox`, `publish_jobs`, and
`published_graph`. Query objects use the same query parameter names as the
target API where possible, for example `validation_status=FAILED`,
`review_status=NEEDS_DISCUSSION`, `evidence_state=missing`, or
`publish_status=PUBLISHED`.

## Endpoint Draft

### Validation

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/projects/{project_id}/validation-jobs` | Create/run deterministic validation job for candidate scope |
| `GET` | `/api/v1/projects/{project_id}/validation-jobs` | List validation jobs |
| `GET` | `/api/v1/validation-jobs/{validation_job_id}` | Validation job detail |
| `GET` | `/api/v1/validation-jobs/{validation_job_id}/results` | Validation result list |

`ValidationJobCreateRequest`

```text
ontology_version_id
extraction_job_id
source_id
candidate_refs[]
rule_codes[]
```

If `candidate_refs` is omitted, Backend validates the project/job/source scope.

### Review

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/projects/{project_id}/review-tasks` | Review inbox with filters |
| `POST` | `/api/v1/projects/{project_id}/review-tasks` | Create review tasks from candidate refs |
| `GET` | `/api/v1/review-tasks/{review_task_id}` | Review task detail |
| `POST` | `/api/v1/review-tasks/{review_task_id}/assign` | Assign or reassign task |
| `POST` | `/api/v1/review-tasks/{review_task_id}/claim` | Claim unassigned task |
| `POST` | `/api/v1/review-tasks/{review_task_id}/decisions` | Record review decision |

Review inbox filters:

```text
status
assignee_id
assigned_to_me
unassigned
candidate_kind
validation_status
validation_code
source_id
extraction_job_id
limit
offset
```

Review inbox response shape is frozen as:

```text
items[]
total_count
limit
offset
```

Backend must return wrapped pagination metadata in the JSON body. Frontend must
not rely on response headers to derive inbox pagination.

`ReviewDecisionCreateRequest`

```text
decision
reason
correction_id
corrected_payload
```

`corrected_payload` is optional for `APPROVE`, `REJECT`, and
`REQUEST_CHANGES`; it is required for `MODIFY_AND_APPROVE` unless
`correction_id` references a submitted correction with non-empty diff.

### Candidate Correction

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/candidates/{candidate_kind}/{candidate_id}/corrections` | List correction records |
| `POST` | `/api/v1/candidates/{candidate_kind}/{candidate_id}/corrections` | Create correction layer |

### Audit

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/projects/{project_id}/audit-logs` | Project audit history |
| `GET` | `/api/v1/candidates/{candidate_kind}/{candidate_id}/audit-logs` | Candidate audit history |

Audit filters:

```text
event_type
candidate_kind
candidate_id
review_task_id
publish_job_id
actor_id
limit
offset
```

### Publish

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/projects/{project_id}/publish-candidates` | List publish eligibility decisions |
| `POST` | `/api/v1/projects/{project_id}/publish-jobs` | Create publish job |
| `GET` | `/api/v1/projects/{project_id}/publish-jobs` | List publish jobs |
| `GET` | `/api/v1/publish-jobs/{publish_job_id}` | Publish job detail |
| `POST` | `/api/v1/publish-jobs/{publish_job_id}/run` | Run pending publish job locally |

`PublishJobCreateRequest`

```text
ontology_version_id
candidate_refs[]
dry_run
```

`dry_run=true` returns eligibility/skipped reasons without creating published
graph rows.

### Published Graph

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/projects/{project_id}/published-graph/versions` | List published graph versions |
| `GET` | `/api/v1/projects/{project_id}/published-graph/current` | Current published graph snapshot |
| `GET` | `/api/v1/published-graph/versions/{version_id}` | Version metadata |
| `GET` | `/api/v1/published-graph/versions/{version_id}/entities` | Published entities |
| `GET` | `/api/v1/published-graph/versions/{version_id}/relations` | Published relations |

Published graph list filters:

```text
class_id
relation_id
search
limit
offset
```

### Quality

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/projects/{project_id}/quality/summary` | Quality summary v0.1 |

Quality filters:

```text
ontology_version_id
source_id
extraction_job_id
```

## Error Codes

```text
VALIDATION_JOB_SCOPE_EMPTY
REASON_REQUIRED
CORRECTION_DIFF_REQUIRED
INVALID_REVIEW_TRANSITION
PUBLISHED_CANDIDATE_IMMUTABLE
PUBLISH_CANDIDATE_NOT_ELIGIBLE
PUBLISH_WARNING_REASON_REQUIRED
PUBLISH_FAILED_VALIDATION
PUBLISH_MISSING_EVIDENCE
PUBLISH_ONTOLOGY_VERSION_MISMATCH
PUBLISHED_GRAPH_VERSION_NOT_FOUND
```

## OpenAPI Artifact Strategy

Wave 14 creates `docs/api/openapi-mvp3-draft.json` manually from the contract
draft because runtime FastAPI routes do not exist yet. In Wave 15, Backend
should implement Pydantic schemas and routers, then export the actual FastAPI
OpenAPI and compare it against this draft. Once implementation is stable, the
exported artifact should replace the hand-authored draft.

`docs/api/openapi-mvp1.json` and `docs/api/openapi-mvp2-draft.json` remain
separate artifacts. MVP 3 does not replace them in Wave 14.

## Migration Impact for Wave 15

Likely new modules:

- `apps/backend/app/modules/validation/models.py`
- `apps/backend/app/modules/validation/schemas.py`
- `apps/backend/app/modules/validation/router.py`
- `apps/backend/app/modules/review/models.py`
- `apps/backend/app/modules/review/schemas.py`
- `apps/backend/app/modules/review/router.py`
- `apps/backend/app/modules/audit/models.py`
- `apps/backend/app/modules/audit/schemas.py`
- `apps/backend/app/modules/audit/router.py`
- `apps/backend/app/modules/publish/models.py`
- `apps/backend/app/modules/publish/schemas.py`
- `apps/backend/app/modules/publish/router.py`
- `apps/backend/app/modules/quality/schemas.py`
- `apps/backend/app/modules/quality/router.py`

Likely existing modules to touch:

- `apps/backend/app/core/enums.py`
- `apps/backend/app/api/router.py`
- `apps/backend/app/modules/candidate/models.py`
- `apps/backend/app/modules/candidate/schemas.py`
- `apps/backend/app/modules/project/models.py`
- `apps/backend/app/db/migrations/`

Likely schema changes:

- Add enums listed in this draft.
- Add validation job/result tables.
- Add review task/decision/correction tables.
- Add audit log table.
- Add publish job table.
- Add published graph version table.
- Add published entity/relation tables.
- Add project current published graph pointer, either
  `projects.current_published_graph_version_id` or a separate
  `project_published_graph_state` table.
- Consider indexes on project, candidate refs, status fields, ontology version,
  published graph version, and created timestamps.

Wave 15 should include Alembic migration after implementation begins.
