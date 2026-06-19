# MVP 3 Closeout Checklist

Status: `PM RECOMMENDS MVP 3 PRODUCT P0 CLOSEOUT`
Date: 2026-06-19

This document is the shared closeout reference for PM, Backend, Frontend, and
QA. MVP 3 added validation, expert review, correction, audit, publish jobs,
published graph snapshots, and quality dashboard v0.1 on top of the closed MVP
2 candidate/evidence foundation.

PM recommendation: MVP 3 product P0 can close as `PASS` once Wave 18 QA accepts
the closeout matrix. Remaining items are P1 tooling, environment, or expansion
follow-ups, not product P0 blockers.

## Closeout Decision Rule

MVP 3 can close when all P0 rows below have evidence from Wave 15, Wave 16, or
Wave 17 reports, and no role reports a product blocker requiring a new MVP 3
endpoint, enum, DTO, or workflow change.

Allowed closeout verdicts:

- `PASS`: all P0 rows pass with no active product exception.
- `PASS WITH P1 FOLLOW-UPS`: product P0 passes and only approved P1
  environment/tooling/expansion follow-ups remain.
- `PARTIAL`: at least one P0 product row needs targeted hardening.
- `FAIL`: a product rule is violated, especially candidate/published graph
  separation or publish eligibility.

## Closeout Evidence Summary

| Evidence source | Verdict | Closeout relevance |
|---|---|---|
| Wave 15 Backend report | PASS | Validation, review, correction, audit, publish, relational published graph, quality summary, OpenAPI export, backend tests, ruff, and SQLite Alembic smoke passed. |
| Wave 15 Frontend report | PASS for mock-first UX | Review inbox, workbench, publish queue/job, published graph explorer, and quality dashboard mock routes passed. |
| Wave 15 QA report | PARTIAL | Backend runtime and mock UI passed, but actual Frontend DTO drift blocked full actual API closeout for quality/publish/published graph. |
| Wave 16 Frontend report | PASS | Quality, publish, and published graph DTOs were aligned to actual OpenAPI names with view-model helpers for display-only fields. |
| Wave 16 QA report | PASS | `INT3-006` contract/mock consistency passed; MVP2 actual API regression passed. Actual MVP3 route smoke remained a seed follow-up. |
| Wave 17 Backend report | PASS | Deterministic `seed_mvp3.py` created review tasks, publish candidates with frozen reason codes, current published graph facts, and quality metrics. |
| Wave 17 Frontend report | PASS | `npm run smoke:mvp3:actual` passed against actual API mode and produced route screenshots/artifacts. |
| Wave 17 QA report | PASS | MVP3 actual API smoke passed on supported port `5173`; MVP2 actual API regression passed; no product/API blocker remained. |

## MVP 3 P0 Closeout Matrix

| Area | Required P0 behavior | Evidence | PM closeout status |
|---|---|---|---|
| Validation | Candidates expose validation jobs/results with severity `INFO`, `WARNING`, `FAILED`; failed validation blocks publish; warning requires reviewer reason before publish. | Wave 15 Backend tests and OpenAPI assertion; Wave 15/16/17 QA `INT3-001` PASS. | PASS |
| Expert review | Review task list/detail and four decisions use canonical `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`; decisions map to `APPROVED`, `REJECTED`, `NEEDS_DISCUSSION`, `MODIFIED`. | Wave 15 Backend tests; Wave 15/16/17 QA `INT3-002` PASS. | PASS |
| Correction | Expert correction is stored separately from original LLM output; `MODIFY_AND_APPROVE` requires non-empty correction diff. | Wave 15 Backend correction/audit tests; Wave 15 Frontend workbench UX; Wave 17 actual workbench route smoke. | PASS |
| Audit | Original snapshot, corrected snapshot, reviewer, decision, reason, timestamp, validation, review, and publish lifecycle are reconstructable. | Wave 15 Backend tests; Wave 15 QA `INT3-005` PASS. | PASS |
| Publish eligibility | Only approved or modified eligible candidates publish; pending, rejected, needs-discussion, failed-validation, missing-evidence, broken-evidence, warning-without-reason, and already-published candidates are blocked or skipped idempotently with frozen reason codes. | Wave 15 Backend tests; Wave 17 seed exposes reason codes; Wave 17 actual publish route smoke; Wave 17 QA `INT3-003` PASS. | PASS |
| Published graph | Published graph reads canonical relational `PublishedEntity` and `PublishedRelation` snapshot/current APIs, not candidate APIs; pending/rejected/needs-discussion/ineligible candidates do not leak. | Wave 15 Backend tests; Wave 17 seed and actual smoke show `entities=2`, `relations=1`; Wave 17 QA `INT3-004` PASS. | PASS |
| Published graph versioning | Each successful publish creates an immutable published graph version and updates project current pointer. | Wave 15 Backend implementation/tests; Wave 17 seed includes current version and published graph version id. | PASS |
| Quality dashboard v0.1 | Dashboard exposes typed `candidate_counts`, `validation_counts`, `review_counts`, `publish_counts`, and `rates`; published ratio and counts match seeded data. | Wave 16 DTO sync; Wave 17 actual smoke renders typed metrics and `published_ratio=3/14=0.2143`; Wave 17 QA `INT3-006` PASS. | PASS |
| Actual API route smoke | Frontend actual API mode renders review inbox, review workbench, publish queue, published graph, and quality dashboard against deterministic seed. | Wave 17 Frontend and QA actual smoke PASS with artifacts under `/tmp/ontology-wave17-qa-mvp3-actual-smoke`. | PASS |
| MVP2 regression | MVP2 source/profile/parse/prompt/job/candidate/evidence actual smoke remains passing. | Wave 15, Wave 16, and Wave 17 QA MVP2 regression PASS. | PASS |

## Demo Script

Use a local SQLite backend and actual API frontend mode unless Docker/PostgreSQL
is available.

1. Apply backend migrations to a fresh local database.
2. Run `apps/backend/scripts/seed_mvp3.py` and keep the generated seed JSON.
3. Start backend API on a local port, for example `8018`.
4. Start frontend with `VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL`
   pointing at the backend. Use frontend port `5173` unless CORS is expanded.
5. Open the seeded project `project-corp-knowledge`.
6. Review inbox: confirm actual review tasks are listed.
7. Review workbench: open the seeded task and inspect evidence, validation,
   original/corrected snapshot, and decision actions.
8. Publish queue: confirm eligible candidates and frozen blocked reason codes.
9. Published graph: confirm `PUBLISHED FACTS`, current snapshot, two entities,
   one relation, and lineage.
10. Quality dashboard: confirm typed metric groups and published ratio.
11. Run MVP2 actual smoke as regression guard.

## Release Notes Scope

MVP 3 is a controlled review and publishing milestone. It proves that LLM
candidate output can be validated, reviewed, corrected, audited, and published
into a separate published graph with quality metrics.

Included:

- Ontology validation result model and API.
- Review task, decision, assignment/claim, and correction workflow.
- Audit log for candidate lifecycle and publish events.
- Publish job and eligibility reason code workflow.
- Relational published graph snapshot/current APIs.
- Published graph explorer v0.1.
- Quality dashboard v0.1.
- Deterministic MVP3 seed and actual API smoke harness as QA/development
  support.

Excluded or deferred:

- Actual external LLM extraction changes.
- Automatic approval or automatic reviewer load balancing.
- Production RBAC/SSO.
- RAG/search over published graph.
- Advanced model/prompt performance dashboard.
- Full rollback UI beyond stored publish history and audit record.
- Required Neo4j write path.

## P1 Follow-Ups

| Follow-up | Type | Closeout impact | Suggested owner |
|---|---|---|---|
| Docker/PostgreSQL Compose smoke | Environment/tooling | Not a product P0 blocker while Docker CLI is unavailable; run in Docker-capable environment. | Infra/Backend/QA |
| Formal Playwright suite | Tooling | Current actual smoke command is accepted; formal Playwright Test suite can improve repeatability. | Frontend/QA |
| Optional CORS expansion | Local developer experience | Actual smoke passes on supported `5173`; add extra dev ports only if needed. | Backend/Frontend |
| Neo4j adapter write | Product expansion | P1 because relational published graph APIs are P0 canonical. | Backend |
| Broader rollback UI | Product expansion | P1 because MVP3 stores version/audit history but does not require full rollback UX. | PM/Backend/Frontend |

## Final Recommendation

PM recommends closing MVP 3 product P0 as `PASS` after Wave 18 QA validates this
matrix. The product rule is intact: LLM output remains candidate data until
expert review and publish eligibility allow it into an immutable published graph
snapshot.

