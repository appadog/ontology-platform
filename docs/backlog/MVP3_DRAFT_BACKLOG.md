# MVP 3 Draft Backlog

Status: `WAVE 15 PM IMPLEMENTATION CONTRACT FROZEN`

MVP 3 adds validation, expert review, correction, audit, publishing, published graph query, and quality dashboard v0.1 on top of the closed MVP 2 candidate/evidence foundation.

## MVP 3 Entry Gate

- [x] MVP 2 candidate/evidence generation and browsing are PASS.
- [x] Evidence traceability and fallback are PASS.
- [x] Candidate `review_status` and `publish_status` fields exist.
- [x] Review/publish workflow was intentionally excluded from MVP 2 and is now opened as MVP 3 scope.
- [x] Docker Compose smoke remains P1 environment follow-up and is not an MVP 3 entry blocker.

## PM Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| PM3-001 | P0 | PM | Review policy | MVP2 closeout | review decision types, required reason rules, status transitions, and publish eligibility are documented |
| PM3-002 | P0 | PM | Validation policy | PM3-001 | blocking vs warning validation rules and publish impact are documented |
| PM3-003 | P0 | PM | Publish policy | PM3-001 | approval vs publish permission split and publish idempotency rules are documented |
| PM3-004 | P0 | PM | Quality metrics v0.1 | PM3-001 | counts/rates for validation, review, publish, evidence are defined |
| PM3-005 | P0 | PM | MVP 3 UAT scenario | PM3-001~PM3-004 | candidate -> validation -> review -> publish -> graph -> audit path is testable |

Wave 14 PM closeout:

- `PM3-001`: `ReviewDecision` is `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`; mapping is `APPROVED`, `REJECTED`, `NEEDS_DISCUSSION`, `MODIFIED`.
- `PM3-002`: `WARNING` candidates may publish only with explicit reviewer reason, evidence present, and no `FAILED` validation. `MISSING_EVIDENCE` remains non-publishable.
- `PM3-003`: relational `PublishedEntity` / `PublishedRelation` tables are P0 canonical; Neo4j write is P1/optional adapter behavior. Each successful publish job creates a published graph snapshot and updates the project current pointer.
- `PM3-004`: quality metrics v0.1 remain count/rate based and must distinguish validation `PASSED`/`WARNING`/`FAILED`, review status, publish status, and evidence missing.
- `PM3-005`: UAT must include warning-with-reason publish, warning-without-reason block, failed-validation block, missing-evidence block, request-changes non-publishable state, and published graph current snapshot query.

Wave 15 PM implementation contract freeze:

- `ValidationResultSeverity` is exactly `INFO`, `WARNING`, `FAILED`.
- Publish eligibility reason codes are stable literals: `ELIGIBLE`,
  `NOT_APPROVED_OR_MODIFIED`, `PENDING`, `REJECTED`, `NEEDS_DISCUSSION`,
  `MISSING_EVIDENCE`, `BROKEN_EVIDENCE`, `FAILED_VALIDATION`,
  `WARNING_REASON_REQUIRED`, `ALREADY_PUBLISHED`,
  `ONTOLOGY_VERSION_MISMATCH`, `PUBLISH_PERMISSION_REQUIRED`,
  `CORRECTION_DIFF_REQUIRED`.
- Review inbox list response is `{ items, total_count, limit, offset }`.
- `ValidationResult` exposes `field_path`, `blocking`, and `suggested_fix`.
- Published graph entity/relation DTOs expose audit-friendly lineage fields:
  publish job id, graph version id/number, ontology version id, candidate id/kind,
  original/corrected snapshots, evidence refs, reviewer id/name, decision id/type,
  reason, and timestamps.
- `QualitySummary` is typed by candidate, validation, review, publish, and rate
  groups; metrics expose drilldown hints.
- Backend/Frontend must not infer publish policy from scattered fields when
  eligibility reason codes are available.

## Backend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| BE3-001 | P0 | Backend | ValidationJob/ValidationResult model | PM3-002 | candidates can be validated with rule code, severity `INFO`/`WARNING`/`FAILED`, message, `field_path`, `blocking`, `suggested_fix`, ontology version, timestamp |
| BE3-002 | P0 | Backend | ReviewTask/ReviewDecision model | PM3-001 | review tasks can be listed and `APPROVE`/`REJECT`/`REQUEST_CHANGES`/`MODIFY_AND_APPROVE` decisions can be recorded with reviewer, reason rules, timestamp, and assignee |
| BE3-003 | P0 | Backend | Candidate correction API | BE3-002 | original LLM output remains traceable and corrected fields are stored separately or versioned |
| BE3-004 | P0 | Backend | Review status transition API | BE3-002, BE3-003 | decision transitions map to `APPROVED`/`REJECTED`/`NEEDS_DISCUSSION`/`MODIFIED` and enforce required reason, correction diff, and validation constraints |
| BE3-005 | P0 | Backend | AuditLog model/API | BE3-002~BE3-004 | original, corrected, reviewer, decision, reason, timestamp are queryable |
| BE3-006 | P0 | Backend | PublishJob + published tables | BE3-004 | only eligible reviewed candidates are published idempotently into relational published tables; warning publish requires reviewer reason and no failed validation; publish eligibility uses frozen reason codes |
| BE3-007 | P0 | Backend | Published graph query API | BE3-006 | project current published graph snapshot can be queried without pending/rejected/needs-discussion candidates leaking in; entity/relation rows expose frozen lineage fields |
| BE3-008 | P0 | Backend | Quality summary API v0.1 | BE3-001~BE3-006 | typed validation/review/publish/evidence counts, rates, and drilldown hints are returned |
| BE3-009 | P1 | Backend | Graph DB adapter write | BE3-006 | published graph can be written to Neo4j when local graph DB is available |
| BE3-010 | P0 | Backend | MVP3 OpenAPI draft/export | BE3-001~BE3-008 | `docs/api/openapi-mvp3-draft.json` or equivalent contract artifact exists |

## Frontend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| FE3-001 | P0 | Frontend | Review inbox | PM3-001, BE3-002 | reviewer can browse tasks by status, validation type, confidence, source/job context, assigned-to-me, and unassigned/manual assignment state using wrapped `{ items, total_count, limit, offset }` response |
| FE3-002 | P0 | Frontend | Review workbench | FE3-001 | evidence/source context, candidate details, validation results, and decision history are visible together |
| FE3-003 | P0 | Frontend | Candidate correction UI | FE3-002, BE3-003 | entity values and relation endpoints can be edited in a correction layer |
| FE3-004 | P0 | Frontend | Review decision actions | FE3-003, BE3-004 | approve/reject/request-changes/modify-and-approve flows show required reason, warning publish reason, and result state |
| FE3-005 | P0 | Frontend | Publish queue/job UI | BE3-006 | publish-capable user can see eligible candidates, frozen eligibility reason codes, and run publish job without duplicating backend publish policy |
| FE3-006 | P0 | Frontend | Published graph explorer v0.1 | BE3-007 | project current published graph snapshot entities/relations can be browsed separately from candidates with lineage detail visible |
| FE3-007 | P0 | Frontend | Quality dashboard v0.1 | BE3-008 | review/validation/publish/evidence metrics and drilldown hints are visible |
| FE3-008 | P1 | Frontend | Review workbench polish | FE3-001~FE3-007 | dense review UI works on desktop and has safe responsive fallback |

## QA Backlog

Detailed QA acceptance checklist: `docs/backlog/INT3_MVP3_ACCEPTANCE.md`.

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| INT3-001 | P0 | QA | Validation contract review | BE3-001, FE3-002 | validation result API and UI fields match |
| INT3-002 | P0 | QA | Review decision flow smoke | BE3-002~BE3-004, FE3-001~FE3-004 | approve/reject/request-changes/modify-and-approve flows map to the correct candidate review status |
| INT3-003 | P0 | QA | Publish-only-approved smoke | BE3-006, FE3-005 | only eligible approved/modified candidates are published; warning-with-reason passes and warning-without-reason, failed, missing-evidence, rejected, and needs-discussion candidates are blocked |
| INT3-004 | P0 | QA | Published graph separation test | BE3-007, FE3-006 | pending/rejected/needs-discussion candidates do not appear in the project current published graph snapshot |
| INT3-005 | P0 | QA | Audit trail verification | BE3-005, FE3-002 | original/corrected/reviewer/reason/timestamp are visible |
| INT3-006 | P0 | QA | Quality dashboard consistency | BE3-008, FE3-007 | metric values match underlying candidate/review/publish data |
| INT3-007 | P1 | QA | MVP 2 regression | MVP2 closeout | source->extraction->candidate->evidence smoke remains passing |

## MVP 3 Acceptance Draft

- LLM candidates show validation results.
- Reviewer can edit candidate values or relation endpoints without losing original LLM value.
- Reviewer can approve, reject, modify-and-approve, or mark needs discussion.
- Only approved/modified publish-eligible candidates can be published; warning candidates require explicit reviewer reason and no failed validation.
- Published graph can be queried separately from candidate graph using the project current published graph snapshot.
- Audit log shows LLM original, expert correction, reviewer, reason, and timestamp.
- Quality dashboard v0.1 shows validation/review/publish metrics.

## Scope Limits

- No automatic approval.
- No RAG/search over published graph.
- No advanced model/provider performance dashboard.
- No production RBAC/SSO.
- No multi-tenant governance.
- No full rollback UI beyond publish history/audit record.
