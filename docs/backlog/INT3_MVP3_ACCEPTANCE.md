# INT3 MVP 3 Acceptance Checklist

Status: `WAVE 15 PM IMPLEMENTATION CONTRACT FROZEN`
Date: 2026-06-19
Owner: QA / Integration

This checklist turns `INT3-001` through `INT3-007` into executable acceptance
criteria for Wave 15+. MVP 3 runtime is not implemented yet, so Wave 15 PM work
freezes implementation literals and response shapes before runtime QA.

## Source Contracts

- PM decisions: `docs/pm/MVP3_PREP_BRIEF.md`
- Backlog: `docs/backlog/MVP3_DRAFT_BACKLOG.md`
- Backend draft: `docs/api/MVP3_API_CONTRACT_DRAFT.md`
- Machine-readable draft: `docs/api/openapi-mvp3-draft.json`
- Frontend field review: `docs/pm/MVP3_FRONTEND_UX_REQUIREMENTS.md`
- Published graph ADR: `docs/adr/0006-mvp3-published-graph-boundary-and-versioning.md`

## Current QA Verdict

- Contract checklist readiness: `PASS / WAVE 15 FREEZE APPLIED`
- Runtime acceptance: `PARTIAL / NOT RUNNABLE`
- Reason: MVP 3 implementation does not exist yet. OpenAPI and planning docs
  are coherent enough for Wave 15+ implementation and test planning, with PM
  freeze decisions applied.

## Wave 17 Actual API Smoke Boundary

Deterministic MVP3 seed data and route smoke harnesses are QA/development
support only. They do not add product scope, product UI, new policy, new
endpoints, or new DTO/enum semantics. They make the existing MVP3 review,
publish, published graph, and quality routes reproducible in actual API mode.

Actual API smoke can be marked `PASS` only when evidence shows all of these
conditions against a seeded backend and `VITE_USE_MOCK_API=false` frontend:

- Seeded project `project-corp-knowledge` or an equivalent documented fixed
  project exists and can be loaded by the frontend routes.
- Review inbox has review tasks from actual API responses.
- Review workbench opens at least one actual review task.
- Publish queue shows per-candidate eligibility and frozen eligibility reason
  codes from the actual API.
- Published graph current renders only published facts from the published graph
  API, not candidate graph data.
- Quality dashboard renders typed actual API metric groups:
  `candidate_counts`, `validation_counts`, `review_counts`, `publish_counts`,
  and `rates`.

Mark actual API smoke `PARTIAL` when the seed or harness is reproducible and at
least one actual MVP3 frontend route renders correct API-backed state, but one
or more required evidence points above are missing, empty due to seed coverage,
or not yet automated. Mark it `FAIL` when the seed/harness reports success but
actual API route behavior violates MVP3 policy, such as publishing ineligible
candidates, showing candidate-only facts as published facts, omitting frozen
eligibility reason codes, or rendering quality metrics from mock-only aliases.
Mark it `NOT RUNNABLE` only when the backend/frontend process or environment
cannot be started before route assertions can execute.

## Shared Test Data Required for Wave 15+

Runtime QA needs a deterministic project fixture with one ontology version, one
source, one extraction job, evidence records, and these candidates:

| Fixture key | Candidate state | Required validation/evidence setup | Expected publish result |
|---|---|---|---|
| `approved_clean_entity` | `APPROVED`, `NOT_PUBLISHED` | evidence present, no `FAILED`, no `WARNING` | publish succeeds |
| `modified_clean_relation` | `MODIFIED`, `NOT_PUBLISHED` | correction diff exists, evidence present, no `FAILED`, no `WARNING` | publish succeeds using corrected payload |
| `approved_warning_with_reason` | `APPROVED`, `NOT_PUBLISHED` | evidence present, `WARNING`, reviewer reason present | publish succeeds |
| `approved_warning_without_reason` | `APPROVED`, `NOT_PUBLISHED` | evidence present, `WARNING`, no reviewer reason | publish blocked |
| `approved_failed_validation` | `APPROVED`, `NOT_PUBLISHED` | evidence present, at least one `FAILED` validation | publish blocked |
| `approved_missing_evidence` | `APPROVED`, `NOT_PUBLISHED` | no evidence or `EVIDENCE_MISSING` / `MISSING_EVIDENCE` | publish blocked |
| `rejected_candidate` | `REJECTED`, `NOT_PUBLISHED` | evidence state irrelevant | publish blocked |
| `needs_discussion_candidate` | `NEEDS_DISCUSSION`, `NOT_PUBLISHED` | evidence state irrelevant | publish blocked |
| `pending_candidate` | `PENDING`, `NOT_PUBLISHED` | evidence may be present | publish blocked |
| `already_published_candidate` | `APPROVED`, `PUBLISHED` | previously published | publish blocked or skipped idempotently |

## INT3-001 Validation Contract Review

Contract readiness checks:

- `docs/api/openapi-mvp3-draft.json` parses as JSON.
- OpenAPI contains validation paths:
  - `POST /api/v1/projects/{project_id}/validation-jobs`
  - `GET /api/v1/projects/{project_id}/validation-jobs`
  - `GET /api/v1/validation-jobs/{validation_job_id}`
  - `GET /api/v1/validation-jobs/{validation_job_id}/results`
- OpenAPI contains enums:
  - `ValidationStatus`: `NOT_VALIDATED`, `PASSED`, `WARNING`, `FAILED`
  - `ValidationResultSeverity`: `INFO`, `WARNING`, `FAILED`
  - `ValidationRuleCode` includes `EVIDENCE_MISSING`,
    `ONTOLOGY_VERSION_MISMATCH`, and `LOW_CONFIDENCE`.
- `ValidationResult` includes candidate kind/id, ontology version id, rule code,
  severity, message, details, and timestamp.
- Frontend-needed fields are formalized in OpenAPI: `field_path`, `blocking`,
  and `suggested_fix`.

Runtime acceptance checks:

- Creating a validation job for the fixture project returns `201` and a
  `ValidationJob` with `PENDING` or `RUNNING`.
- Completed validation job summary totals equal the number of target candidates.
- Results are scoped by project, candidate, ontology version, and validation job.
- `FAILED` result marks the candidate non-publishable.
- `WARNING` result allows review but requires reviewer reason before publish.
- `EVIDENCE_MISSING` is non-publishable even if represented as `WARNING`.
- Validation writes no rows to published graph tables and does not change the
  project current published graph pointer.

Exit criterion: `INT3-001 PASS` only when OpenAPI/schema, API response, and UI
field needs are aligned or intentionally deferred with a named follow-up.

## INT3-002 Review Decision Flow Smoke

Contract readiness checks:

- Canonical decision enum is `ReviewDecisionType`:
  - `APPROVE`
  - `REJECT`
  - `REQUEST_CHANGES`
  - `MODIFY_AND_APPROVE`
- Candidate review status enum remains:
  - `PENDING`
  - `APPROVED`
  - `REJECTED`
  - `MODIFIED`
  - `NEEDS_DISCUSSION`
- `POST /api/v1/review-tasks/{review_task_id}/decisions` exists.
- `ReviewDecision` stores decision, resulting review status, reviewer id,
  reason, before snapshot, correction diff, publish eligibility, and timestamp.

Runtime acceptance matrix:

| Case | Start state | Action | Required input | Expected status | Expected audit/response |
|---|---|---|---|---|---|
| approve clean | `PENDING` | `APPROVE` | no reason required when no warning | `APPROVED` | decision stored with reviewer/timestamp |
| approve warning | `PENDING` | `APPROVE` | reason required | `APPROVED` | reason stored and eligibility can pass |
| reject | `PENDING` | `REJECT` | reason required | `REJECTED` | not publishable |
| request changes | `PENDING` or `APPROVED` | `REQUEST_CHANGES` | reason required | `NEEDS_DISCUSSION` | not publishable |
| modify and approve | `PENDING` | `MODIFY_AND_APPROVE` | reason and non-empty correction diff | `MODIFIED` | corrected snapshot linked |
| missing reason | any required-reason action | submit blank reason | none | unchanged | `REASON_REQUIRED` or equivalent |
| missing diff | `MODIFY_AND_APPROVE` | no diff | none | unchanged | `CORRECTION_DIFF_REQUIRED` |
| invalid transition | already published candidate | any decision | any | unchanged | `PUBLISHED_CANDIDATE_IMMUTABLE` or `409` |

Exit criterion: all four canonical decisions produce the PM-defined
`CandidateReviewStatus` mapping and required reason/diff rules are enforced.

## INT3-003 Publish-Only-Approved Smoke

Contract readiness checks:

- Publish paths exist:
  - `GET /api/v1/projects/{project_id}/publish-candidates`
  - `POST /api/v1/projects/{project_id}/publish-jobs`
  - `GET /api/v1/projects/{project_id}/publish-jobs`
  - `GET /api/v1/publish-jobs/{publish_job_id}`
  - `POST /api/v1/publish-jobs/{publish_job_id}/run`
- Eligibility rules include:
  - `review_status` is `APPROVED` or `MODIFIED`
  - `publish_status` is `NOT_PUBLISHED`
  - evidence exists
  - no `FAILED` validation
  - no `EVIDENCE_MISSING` / `MISSING_EVIDENCE`
  - warning candidates have explicit reviewer reason
  - ontology version matches publish job
- Frontend receives per-candidate `eligible` and stable reason codes. Reason
  codes are frozen as `ELIGIBLE`, `NOT_APPROVED_OR_MODIFIED`, `PENDING`,
  `REJECTED`, `NEEDS_DISCUSSION`, `MISSING_EVIDENCE`, `BROKEN_EVIDENCE`,
  `FAILED_VALIDATION`, `WARNING_REASON_REQUIRED`, `ALREADY_PUBLISHED`,
  `ONTOLOGY_VERSION_MISMATCH`, `PUBLISH_PERMISSION_REQUIRED`, and
  `CORRECTION_DIFF_REQUIRED`.
- Backend/Frontend must not infer publish policy from scattered fields when
  eligibility reason codes are available.

Runtime positive cases:

- `approved_clean_entity` publishes successfully.
- `modified_clean_relation` publishes successfully and published relation uses
  corrected payload, not silently overwritten raw LLM values.
- `approved_warning_with_reason` publishes successfully when evidence exists,
  no `FAILED` validation exists, and the reviewer reason is stored.
- Successful publish job creates a `PublishedGraphVersion`, writes relational
  published rows, and updates project current pointer.

Runtime negative cases:

| Case | Expected eligibility | Expected publish behavior |
|---|---|---|
| `pending_candidate` | false, `PENDING` preferred; `NOT_APPROVED_OR_MODIFIED` allowed only when caller cannot see exact state | excluded or rejected |
| `rejected_candidate` | false, `REJECTED` | excluded or rejected |
| `needs_discussion_candidate` | false, `NEEDS_DISCUSSION` | excluded or rejected |
| `approved_failed_validation` | false, `FAILED_VALIDATION` | excluded or rejected |
| `approved_missing_evidence` | false, `MISSING_EVIDENCE` | excluded or rejected |
| `approved_warning_without_reason` | false, `WARNING_REASON_REQUIRED` | excluded or rejected |
| `already_published_candidate` | false, `ALREADY_PUBLISHED` | skipped idempotently, no duplicate fact |

Backend open QA question answer:

- Yes. The negative publish suite must cover pending, rejected,
  needs-discussion, failed-validation, missing-evidence, and
  warning-without-reason. These are all P0 negative cases for `INT3-003`.

Exit criterion: no ineligible candidate is written to published graph tables,
and every blocked candidate returns a frozen eligibility reason code.

## INT3-004 Published Graph Separation and Current Snapshot

Contract readiness checks:

- ADR 0006 is accepted.
- Published graph paths exist:
  - `GET /api/v1/projects/{project_id}/published-graph/versions`
  - `GET /api/v1/projects/{project_id}/published-graph/current`
  - `GET /api/v1/published-graph/versions/{version_id}`
  - `GET /api/v1/published-graph/versions/{version_id}/entities`
  - `GET /api/v1/published-graph/versions/{version_id}/relations`
- Published graph query reads relational `PublishedEntity` and
  `PublishedRelation` P0 canonical data. Neo4j is not required for acceptance.

Runtime acceptance checks:

- Before publish, current published graph is empty or returns a no-current
  snapshot state; it does not read candidate graph data as facts.
- After publishing eligible candidates, current snapshot contains only published
  entities/relations from the successful job.
- Pending, rejected, needs-discussion, failed-validation, missing-evidence, and
  warning-without-reason candidates do not appear in current snapshot.
- Each successful publish job creates a new immutable version and moves the
  project current pointer to that version.
- Re-running the same publish job or publishing the same candidate refs is
  idempotent and does not duplicate facts in the same snapshot.
- Published graph response includes version metadata: version id/number,
  publish job id, ontology version id, current flag, created by, and timestamp.
- Published graph entity/relation detail includes lineage: publish job id,
  graph version id/number, ontology version id, candidate id/kind, original
  snapshot/reference, corrected snapshot when applicable, evidence refs,
  reviewer id/name, decision id/type, reason, reviewed timestamp, and published
  timestamp.

Exit criterion: QA can prove candidate graph and published graph remain
separate by querying both candidate APIs and published graph APIs after publish.

## INT3-005 Audit Trail Verification

Contract readiness checks:

- Audit paths exist:
  - `GET /api/v1/projects/{project_id}/audit-logs`
  - `GET /api/v1/candidates/{candidate_kind}/{candidate_id}/audit-logs`
- `AuditLog` supports event type, actor id, candidate kind/id, review task id,
  review decision id, validation job id, publish job id, published graph version
  id, original snapshot, corrected snapshot, reason, metadata, and timestamp.

Runtime acceptance checks:

- Validation job creation and result recording create or expose audit events.
- Correction stores original LLM snapshot and corrected snapshot separately.
- Review decision audit contains reviewer, decision, resulting status, reason,
  timestamp, and correction id/diff when applicable.
- Publish audit contains publish job id and published graph version id.
- Candidate audit query returns the chronological lifecycle for one candidate:
  validation, review task, correction if any, decision, publish if eligible.
- Project audit query can filter by event type, candidate, review task, publish
  job, and actor where supported.

Exit criterion: an expert can reconstruct what changed, who decided it, why it
was accepted or rejected, and which published graph version contains it.

## INT3-006 Quality Dashboard Consistency

Contract readiness checks:

- Quality path exists:
  - `GET /api/v1/projects/{project_id}/quality/summary`
- Quality summary includes candidate, validation, review, publish, and rate
  groups.
- Frontend-needed drilldown hints or canonical query params are typed in the
  contract. Quality summary groups are `candidate_counts`, `validation_counts`,
  `review_counts`, `publish_counts`, and `rates`.

Runtime acceptance checks:

- `candidate_counts.total` equals entity plus relation candidates in the
  selected project scope, or any additional candidate kind is explicitly counted.
- Validation counts equal the latest validation state distribution for the same
  candidate scope.
- Review counts equal `CandidateReviewStatus` distribution:
  `PENDING`, `APPROVED`, `REJECTED`, `MODIFIED`, `NEEDS_DISCUSSION`.
- Publish counts equal `PublishStatus` distribution plus published entity and
  relation row counts for the current or requested version scope.
- Evidence missing count matches validation/evidence state used by publish
  eligibility.
- Rates use documented denominators:
  - approval rate = approved / reviewed candidates
  - rejection rate = rejected / reviewed candidates
  - modification rate = modified / reviewed candidates
  - validation failure rate = failed / validated candidates
  - evidence missing rate = missing evidence / total candidates
  - published ratio = published / total candidates
- Dashboard links or filter hints take the reviewer to matching filtered
  review, publish, or published graph views.
- Count metrics expose `value` and optional `drilldown`; rate metrics expose
  `numerator`, `denominator`, `rate`, and optional `drilldown`.

Exit criterion: dashboard numbers can be recomputed from API fixtures without
manual interpretation.

## INT3-007 MVP 2 Regression

Runtime regression scope:

- MVP 2 source profile and parse smoke still passes.
- Prompt creation, extraction job creation/run, and job detail still pass.
- Candidate entity/relation listing still returns expected MVP 2 fields:
  review status, publish status, validation status, evidence references, source
  and extraction context.
- Evidence detail and broken-evidence fallback behavior still pass.
- Retry-chain dedupe behavior remains passing.
- Candidate/evidence browser actual API smoke remains passing.
- Frontend still keeps `hana-style-component` behind the adapter layer.
- MVP 3 additions do not replace or mutate `docs/api/openapi-mvp2-draft.json`.

Exit criterion: MVP 2 closeout flows remain usable after MVP 3 routes, enums,
and tables are added.

## Contract Mismatch Review

No blocking mismatch was found for Wave 14 contract checklist readiness.

Wave 15 contract freeze review:

| Area | Finding | QA disposition |
|---|---|---|
| Review decision naming | `01_BACKEND_AGENT_SKILL.md` still has older `MODIFY` / `REQUEST_CHANGE` wording. PM, Backend, Frontend, and OpenAPI align on `MODIFY_AND_APPROVE` / `REQUEST_CHANGES`. | Not a blocker. Wave 14 PM decision supersedes older skill wording. |
| `ValidationResultSeverity` | Backend chose `INFO`, `WARNING`, `FAILED` instead of older `ERROR` / `CRITICAL` style wording. | Frozen by PM in Wave 15 as `INFO`, `WARNING`, `FAILED`; older wording is superseded. |
| Validation UI fields | Frontend asks for `field_path`, `blocking`, and suggested fix summary. | Frozen in Wave 15 as first-class `ValidationResult` fields. |
| Eligibility reason codes | Frontend asks for stable reason codes. | Frozen in Wave 15 as `PublishEligibilityReasonCode`; UI/QA must assert those literals. |
| Review inbox fields | Frontend asks for display labels, evidence state, top validation message, last decision summary, and `priority_reason`. OpenAPI `ReviewTask` is minimal. | Non-blocking if Frontend composes from detail APIs; otherwise Backend should add row DTO fields. |
| Published graph lineage | Frontend wants reviewer, reason, and evidence lineage in detail panels. | Frozen in Wave 15 as required lineage fields on published entity/relation rows. |
| Quality summary typing | Frontend wants numerator, denominator, rate, and query hints. | Frozen in Wave 15 as typed metric and drilldown hint schemas. |
| `CandidateKind.PROPERTY_VALUE` | Backend includes forward-compatible `PROPERTY_VALUE`; current MVP 2 exposes entity/relation candidates. | Accepted. QA fixtures should focus entity/relation unless Backend implements property-value candidates in P0. |

## Blockers and Follow-ups

Blockers:

- None for contract checklist readiness.
- Runtime acceptance is blocked by expected absence of MVP 3 implementation.

P0 follow-ups for Wave 15+:

- Use frozen publish eligibility reason literals.
- Use first-class validation UI fields.
- Keep warning-with-reason positive case and all six negative publish cases in
  Backend and QA fixture plans.
- Ensure published graph current pointer and relational snapshot query are
  implemented before any Neo4j-dependent acceptance.

P1 follow-ups:

- Docker Compose smoke remains an environment/tooling follow-up.
- Neo4j write adapter is optional and not required for MVP 3 P0 acceptance.
- Full rollback UI, graph diff, trend dashboard, and automatic assignment stay
  outside MVP 3 P0.
