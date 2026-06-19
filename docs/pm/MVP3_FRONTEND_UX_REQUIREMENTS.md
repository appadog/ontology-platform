# MVP 3 Frontend UX/API Requirements

Status: `WAVE 14 FRONTEND CONTRACT REVIEW`
Date: 2026-06-19
Owner: Frontend

## Purpose

This document defines Frontend field, state, error, and UX requirements for MVP 3 contract-first planning. It is not an implementation spec and does not add app code.

MVP 3 must feel like one product workflow:

```text
Review inbox
-> Review workbench
-> Correction and decision
-> Publish queue/job
-> Published graph explorer
-> Quality dashboard
```

Candidate graph and published graph must remain visually and navigationally separate. The UI must never imply that a raw LLM candidate is a published fact before review and publish eligibility pass.

## P0/P1 Line

### P0

- Review tasks can be browsed by assignment, status, priority, validation type, confidence, source, and extraction job context.
- Review workbench shows evidence/source context, candidate detail, candidate graph or list context, validation results, correction state, and decision history together.
- Correction UI preserves original LLM values and shows corrected values as a separate diff layer.
- Decision actions use canonical API enum values: `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`.
- Required reason rules are enforced before submit.
- Publish queue shows eligibility reasons, selected candidates, job progress, and result.
- Published graph explorer defaults to the project current published graph snapshot and does not mix candidate graph facts.
- Quality dashboard v0.1 shows count/rate cards and drilldown links to filtered review/publish views.
- Every screen has loading, empty, error, and permission states.

### P1 / Later

- Automatic assignment or load balancing.
- Collaboration comments, SLA timers, mentions, or review inbox notifications.
- Bulk approve beyond a carefully constrained future design.
- Rollback UI, graph diff UI, or version comparison UI.
- Neo4j-specific UI or dependency on graph database availability.
- RAG/search over the published graph.
- Advanced model/provider quality comparison.
- Production RBAC/SSO management UI.
- Mobile-first dense review optimization beyond a safe responsive fallback.

## 1. Review Inbox IA

The review inbox is the entry point for reviewers. It should not be a generic candidate table; it should answer "what needs my decision next?"

### Required Filters

| Filter | P0 behavior | Backend field/API need |
|---|---|---|
| Assignment | `assigned-to-me`, `unassigned`, `all reviewable` | `assignee_id`, `assignee_display_name`, current viewer id or `is_assigned_to_me` |
| Status | `PENDING`, `NEEDS_DISCUSSION`, `APPROVED`, `REJECTED`, `MODIFIED` | `review_status` |
| Priority | sortable and filterable | `priority` enum or numeric rank plus `priority_reason` |
| Validation status | passed, warning, failed | aggregate `validation_status` |
| Validation error type | rule/code filter | `validation_codes[]` or latest `ValidationResult.rule_code` |
| Confidence | low/medium/high range | numeric `confidence`; optional server buckets |
| Candidate kind | entity, relation | `candidate_kind` |
| Source/job context | source and extraction job filter | `source_id`, `source_display_name`, `extraction_job_id`, `job_display_label` |
| Evidence state | present, missing, broken | `evidence_state` or computable `evidence_count` plus validation codes |

### Required Row/Card Fields

- `review_task_id`
- `candidate_id`
- `candidate_kind`
- `candidate_display_name`
- relation summary when relation: source label, relation label, target label, direction
- entity summary when entity: entity name, class label, key properties count
- `review_status`
- `publish_status`
- `validation_status`
- top validation code/message
- `confidence`
- `priority`
- `assignee_id`, `assignee_display_name`
- evidence count and evidence state
- source label, source type, segment/chunk/row label
- extraction job id and short job label/status
- ontology version label/id
- last decision summary and timestamp, if any
- created/updated timestamps

### Inbox States

- Loading: skeleton rows with filter bar disabled except project selector.
- Empty: explain the current filter produced no tasks and offer clear filter reset.
- Error: retry and preserve current filters.
- Permission denied: show review permission notice, not a generic error.
- Partial data: if counts load but rows fail, keep filters visible and show row-level failure.

## 2. Review Workbench Layout

P0 layout should keep evidence, candidate context, correction controls, validation, and history in one workflow. It can be desktop-first with a safe responsive fallback.

### P0 Desktop Structure

```text
Top: project, review task status, assignment, primary decision actions
Left: evidence/source viewer
Center: candidate list or compact graph context
Right: editable detail and correction panel
Bottom or tabbed lower panel: validation results, decision history, audit preview
```

### Required API Data

- Review task summary: task id, assignee, status, priority, candidate id/kind.
- Candidate original snapshot from MVP2 candidate entity/relation DTO.
- Correction snapshot or draft correction, if existing.
- Evidence detail list with source segment locators.
- Validation result list tied to candidate and ontology version.
- Decision history list with reviewer, decision enum, mapped review status, reason, timestamp, and correction diff summary.
- Source/job context: source name/type/status, extraction job status, model run, prompt version, ontology version.
- Publish eligibility preview: eligible boolean and reasons.

### Workbench States

- No selected task: show queue-first empty state with inbox link.
- Evidence missing: keep candidate visible, show blocked decision/publish affordance, and provide source/job recovery links.
- Evidence fetch error: show retry and preserve candidate context.
- Validation stale/version mismatch: show blocking or warning state depending on Backend severity.
- Assignee mismatch: allow read-only view if API says the viewer cannot decide.
- Already published: render candidate decision state read-only and link to published snapshot.

## 3. Correction UI State

Corrections must not overwrite raw LLM values in the UI model. Original and corrected values must be displayed together when a field changes.

### Required Correction Fields

Entity correction:

- original entity name and corrected entity name
- original class id/label and corrected class id/label
- original normalized name and corrected normalized name, if editable
- original property values and corrected property values
- property value datatype and validation result
- evidence ids selected/confirmed for the correction

Relation correction:

- original source candidate entity and corrected source candidate entity
- original relation id/label and corrected relation id/label
- original target candidate entity and corrected target candidate entity
- original direction and corrected direction, including `direction_reversed=true` when used
- domain/range validation after endpoint or relation changes
- evidence ids selected/confirmed for the relation

### Required UI State

- Clean: no correction diff.
- Dirty: at least one local edit differs from original or saved correction.
- Diff ready: Backend-valid correction payload can be submitted.
- Invalid local edit: missing required value, incompatible datatype, invalid endpoint, or impossible relation direction.
- Evidence unconfirmed: correction changed but supporting evidence was not confirmed.
- Saving: correction mutation in progress.
- Save failed: preserve local draft and show retry.
- Saved correction: show corrected snapshot, reviewer, timestamp, and diff summary.

### Required Backend Contract

- A correction draft/detail response should return original snapshot and corrected snapshot separately.
- Correction diff should be available as field-level changes or be reliably computable from stable original/corrected shapes.
- Backend should reject `MODIFY_AND_APPROVE` when no correction diff exists.
- Backend should expose field-level validation errors for correction payloads.

## 4. Decision Actions

UI labels may be user-friendly, but API decisions must use canonical enum values.

| UI action | API enum | Required reason | P0 enablement |
|---|---|---|---|
| Approve | `APPROVE` | only if non-blocking `WARNING` exists | enabled when evidence exists, no `FAILED` validation, and correction is clean or saved |
| Reject | `REJECT` | always | enabled for reviewable candidates when reason is present |
| Needs discussion | `REQUEST_CHANGES` | always | enabled for reviewable candidates when reason is present |
| Modify and approve | `MODIFY_AND_APPROVE` | always | enabled when saved/submittable correction diff exists, evidence exists, and no `FAILED` validation |

### Warning-With-Reason UX

- `WARNING` candidates can be approved/published only with explicit reviewer reason.
- The decision panel should show the warning code/message next to the reason field.
- The reason field label should explain that the reviewer is accepting the warning, not bypassing validation.
- `MISSING_EVIDENCE` remains non-publishable even when represented as warning.

### Disabled States

Decision buttons must expose the reason they are disabled:

- missing evidence
- broken evidence reference
- failed validation
- stale ontology version
- no correction diff for `MODIFY_AND_APPROVE`
- required reason missing
- user lacks review permission
- task assigned to another reviewer and API does not allow claim/decision
- candidate already published or no longer reviewable

### Error Handling

- `400` validation error: show field-level or action-level message.
- `403`: permission notice and read-only state.
- `404`: task/candidate no longer available; return to inbox with refresh.
- `409`: stale task, already decided, already published, or version conflict; refresh task and show changed state.
- `422`: correction schema or required reason error; keep draft values.
- `500`: retry with no local draft loss.

## 5. Publish Queue and Job UI

Publish is a separate workflow from review. The queue should show why candidates can or cannot be published.

### Required Queue Fields

- candidate id/kind/display label
- review status
- publish status
- validation status and blocking validation codes
- evidence state and evidence count
- warning reason presence
- corrected/modified flag and diff summary
- source/job/ontology version context
- publish eligibility boolean
- publish eligibility reasons
- last review decision id/timestamp/reviewer
- selected state for publish job

### Eligibility Reason Codes Needed

Backend should return stable reason codes so Frontend does not reverse-engineer policy:

- `ELIGIBLE`
- `NOT_APPROVED_OR_MODIFIED`
- `NEEDS_DISCUSSION`
- `REJECTED`
- `MISSING_EVIDENCE`
- `BROKEN_EVIDENCE`
- `FAILED_VALIDATION`
- `WARNING_REASON_REQUIRED`
- `ALREADY_PUBLISHED`
- `ONTOLOGY_VERSION_MISMATCH`
- `PUBLISH_PERMISSION_REQUIRED`

### Publish Job Fields

- `publish_job_id`
- `project_id`
- `status`
- `progress`
- `selected_candidate_count`
- `published_entity_count`
- `published_relation_count`
- `skipped_count`
- `failed_count`
- `eligibility_summary`
- `result_version_id` or version number
- `created_by`, `created_at`, `started_at`, `finished_at`
- `error_code`, `error_message`
- per-candidate result rows with status and reason

### Publish Job States

- Loading queue.
- Empty eligible queue.
- Mixed eligible/ineligible queue.
- Selection empty.
- Creating job.
- Queued/running with progress.
- Success with link to current published graph snapshot.
- Partial failed with published/skipped/failed counts.
- Failed with retry or return to queue.

## 6. Published Graph Explorer v0.1

The published graph explorer is not the candidate graph. It should have a distinct route, title, copy, visual treatment, and data source.

### P0 Requirements

- Default query target is the project current published graph snapshot.
- Header shows version id/number, publish job id, created timestamp, ontology version, and current pointer state.
- Entity/relation graph uses only published API data.
- Pending, rejected, needs discussion, and unpublished candidates are never shown as facts.
- Detail panel shows published entity/relation fields plus source candidate id, review decision, reviewer, reason, and evidence/source lineage.
- If no published snapshot exists, show empty state with link to publish queue.

### Explicit P1

- Version selector beyond showing current metadata.
- Rollback.
- Snapshot diff.
- RAG/search.
- Neo4j health or adapter-specific controls.
- Unlimited graph rendering.

### API Needs

- `GET current published graph for project` default endpoint.
- Optional `version_id` query param for future compatibility, but UI can keep it hidden in P0.
- Stable node/edge DTOs with published ids, labels, class/relation labels, property summaries, source candidate ids, and evidence lineage ids.
- Total counts and server-side limit/offset or expansion guard for large graphs.

## 7. Quality Dashboard v0.1

The dashboard should connect metrics to action. It should not become an advanced analytics product in MVP 3.

### P0 Metric Cards

- total candidates
- validation passed/warning/failed counts
- review pending/approved/rejected/modified/needs discussion counts
- publish count and not published count
- approval rate
- rejection rate
- modification rate
- validation failure rate
- evidence missing rate
- publish success/failure count

### Drilldown Needs

Each metric card should link to a filtered workflow view:

- failed validation -> review inbox filtered by validation failed
- warning validation -> review inbox filtered by warning
- missing evidence -> review inbox filtered by evidence missing
- pending review -> assigned/unassigned inbox
- rejected/needs discussion -> review inbox filtered by status
- publish failures -> publish job result list
- published count -> published graph explorer

### API Needs

- Metric values should include numerator, denominator, rate, and timestamp.
- Backend should return filter hints or canonical query params for drilldowns where possible.
- Counts should be scoped by project and current selected time/filter if filters exist.
- MVP3 P0 can use project-wide current counts; trend charts are P1.

## 8. Cross-Screen API Field Requirements

### Core Enums

- `ReviewDecision`: `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`
- `CandidateReviewStatus`: `PENDING`, `APPROVED`, `REJECTED`, `MODIFIED`, `NEEDS_DISCUSSION`
- `ValidationStatus`: `NOT_VALIDATED`, `PASSED`, `WARNING`, `FAILED`
- `PublishStatus`: `NOT_PUBLISHED`, `PUBLISHED`, `ROLLED_BACK`
- Publish job status should include queued/running/success/partial failed/failed/cancelled states or equivalent.

### Validation Result Fields

- `validation_result_id`
- `candidate_id`
- `candidate_kind`
- `ontology_version_id`
- `rule_code`
- `severity`
- `status`
- `message`
- `field_path`
- `blocking`
- `created_at`
- optional suggested fix summary

### Review Task Fields

- `review_task_id`
- `project_id`
- `candidate_id`
- `candidate_kind`
- `status`
- `priority`
- `priority_reason`
- `assignee_id`
- `assignee_display_name`
- `created_at`, `updated_at`
- `due_at` only if already available; do not add SLA UI in P0

### Review Decision Fields

- `review_decision_id`
- `candidate_id`
- `candidate_kind`
- `decision`
- `resulting_review_status`
- `reviewer_id`
- `reviewer_display_name`
- `reason`
- `correction_id` or correction snapshot reference
- `created_at`

### Audit Fields

- project id
- candidate id/kind
- original snapshot/reference
- corrected snapshot when applicable
- review decision
- reviewer
- timestamp
- reason
- publish job id when published

## 9. UX Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Review feels like disconnected pages | Reviewers lose task flow and context | Keep inbox/workbench/publish links contextual and preserve filters/breadcrumbs |
| Candidate and published graph are visually mixed | Product rule violation; users trust unreviewed facts | Separate routes, labels, colors, empty states, and API clients/view models |
| Warning approval looks like validation bypass | Review quality/audit ambiguity | Reason field says reviewer accepts warning; audit stores reason |
| Required reasons are enforced only after submit | Frustrating decision flow | Disable actions until reason is present and show inline rule |
| Correction overwrites original values in UI state | Audit trust loss | Always render original and corrected snapshots separately |
| Backend omits eligibility reason codes | Frontend duplicates policy and drifts | Require stable reason codes from publish eligibility API |
| Quality dashboard overbuilds into analytics | MVP3 scope creep | Keep v0.1 as cards plus drilldown, no trends/model comparison P0 |
| Dense workbench fails on small screens | Review unusable outside desktop | P0 desktop-first with responsive stacked fallback; full mobile optimization P1 |
| Raw IDs dominate expert workflow | Product feels like API console | Use display labels first, full IDs in technical details |

## 10. Backend API Asks

1. Provide a review task list DTO optimized for inbox rows, not only raw candidate arrays.
2. Provide stable publish eligibility booleans and reason codes per candidate.
3. Return original and corrected candidate snapshots separately for correction and audit.
4. Return field-level validation errors for correction and decision mutations.
5. Return decision history and audit records with reviewer display labels and timestamps.
6. Return published graph current snapshot metadata with every published graph response.
7. Return quality summary values with numerator, denominator, rate, and drilldown-friendly dimensions.
8. Add an MVP3 OpenAPI draft artifact or equivalent contract file before frontend implementation begins.

## 11. Backend Draft Review Notes

Reviewed draft: `docs/api/MVP3_API_CONTRACT_DRAFT.md` with status `WAVE 14 BACKEND DRAFT`.

### Covered Well

- Canonical `ReviewDecisionType` matches PM decision: `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`.
- Candidate and published graph separation is explicit.
- Correction model keeps `base_candidate_snapshot`, `corrected_payload`, and `correction_diff` separate.
- Published graph current endpoint exists: `/api/v1/projects/{project_id}/published-graph/current`.
- Quality summary includes validation, review, publish, evidence, and rate groups.
- Publish hard blocks include pending, rejected, needs discussion, failed validation, missing evidence, and warning without reason.

### Frontend Gaps to Close Before Implementation

- The draft says the canonical machine-readable draft is `docs/api/openapi-mvp3-draft.json`, but that file was not present during this review.
- `ReviewTask` list fields need display labels or companion fields for inbox UX:
  - `assignee_display_name`
  - source display name/type
  - extraction job display label/status
  - ontology version label
  - evidence count/state
  - top validation message
  - last decision summary
  - `priority_reason`
- `ValidationResult` should expose `field_path`, `blocking`, and optional suggested fix summary for correction-adjacent error display.
- `GET /api/v1/projects/{project_id}/publish-candidates` needs a response DTO with per-candidate `eligible` and stable `eligibility_reasons[]`; `skip_reasons` on `PublishJob` is not enough for pre-job queue UX.
- Eligibility reason codes should be stable policy codes, not only generic mutation error codes.
- Published graph entity/relation list DTOs should include enough lineage for detail panels:
  - source candidate ids
  - review decision id or summary
  - reviewer/reason where available
  - evidence/source lineage ids
- Quality summary should either return drilldown filter hints or document canonical query params for each metric card.
- `ReviewDecision` and audit records should include reviewer display label or a clear user lookup strategy.

## 12. QA Asks

- Verify all decision actions map to the PM-approved status transitions.
- Verify warning-with-reason publish is allowed and warning-without-reason is blocked.
- Verify failed validation, missing evidence, broken evidence, rejected, and needs discussion candidates cannot publish.
- Verify original and corrected values both appear in correction/audit views.
- Verify published graph current snapshot excludes pending/rejected/needs discussion candidates.
- Verify quality metric counts match review/publish data.
- Verify empty/loading/error/permission states for inbox, workbench, publish queue, graph explorer, and quality dashboard.
