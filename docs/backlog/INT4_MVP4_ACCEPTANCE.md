# INT4 MVP 4 Acceptance Checklist

Status: `WAVE 19 CONTRACT-FIRST READY`
Date: 2026-06-19
Owner: QA / Integration

This checklist turns `INT4-001` through `INT4-009` into executable acceptance
criteria for Wave20+. MVP4 runtime is not implemented yet, so Wave19 verifies
contract alignment and defines deterministic seed, API, UI, and regression
assertions before implementation starts.

## Scope and Source of Truth

Source documents:

- Agent rules: `AGENTS.md`
- Handoff process: `.agents/skills/handoff-reporting/SKILL.md`
- Current state: `docs/handoffs/CURRENT_STATE.md`
- Wave order: `docs/handoffs/wave-019/NEXT_ORDERS.md`
- PM freeze: `docs/handoffs/wave-019/PM_REPORT.md`
- Backend contract report: `docs/handoffs/wave-019/BACKEND_REPORT.md`
- Frontend UX report: `docs/handoffs/wave-019/FRONTEND_REPORT.md`
- MVP4 prep brief: `docs/pm/MVP4_PREP_BRIEF.md`
- MVP4 backlog: `docs/backlog/MVP4_DRAFT_BACKLOG.md`
- Search/RAG ADR: `docs/adr/0007-mvp4-search-rag-read-only-boundary.md`
- Backend draft: `docs/api/MVP4_API_CONTRACT_DRAFT.md`
- Machine-readable draft: `docs/api/openapi-mvp4-draft.json`
- Frontend field/state review: `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`
- Closed MVP3 baseline: `docs/backlog/INT3_MVP3_ACCEPTANCE.md`

MVP4 P0 boundaries:

- Quality uses explainable metric groups only. Weighted composite score,
  default weights, and cross-metric rollups are P1.
- Candidate graph facts are excluded from RAG answers and citations.
- Search, RAG, graph explorer, and external APIs are read-only.
- Graph explorer default `max_hops=2`, maximum `max_hops=3`, and response
  budget is `150` nodes / `300` edges with `SAFE_TOO_LARGE`.
- External APIs are read-only under `DEV_AUTH` only.
- Collaboration/SLA remains P1, so `INT4-009` is not a Wave20 P0 gate unless
  PM explicitly promotes it later.

## Current QA Verdict

- Contract alignment: `PASS`
- OpenAPI draft parse/schema sanity: `PASS`
- Runtime acceptance: `NOT RUNNABLE`
- Wave20 entry recommendation: `PASS TO ENTER THIN IMPLEMENTATION`
- Blockers: none for Wave20 entry. Runtime gates require deterministic MVP4
  seed data, actual API endpoints, frontend DTO/client/mock support, and MVP3
  regression smoke preservation.

OpenAPI sanity checked in Wave19:

- `python3 -m json.tool docs/api/openapi-mvp4-draft.json` parses.
- Draft reports OpenAPI `3.1.0`, version `0.4.0-draft`, `26` paths, and `78`
  schemas.
- Critical paths and schemas for quality, datasets, prompt performance,
  search, vector, RAG, graph explorer, and external APIs are present.

## Verdict Semantics

Use these labels consistently for every `INT4-*` item:

- `PASS`: contract, API behavior, deterministic seed values, and frontend
  state assertions all match the checklist.
- `PARTIAL`: the surface exists and some checks pass, but at least one required
  seed, assertion, UI state, or regression guard is missing.
- `FAIL`: behavior violates a P0 boundary, such as candidate facts appearing as
  RAG answer facts, mutation through read-only APIs, unsafe graph rendering, or
  metric values that cannot be recomputed.
- `NOT RUNNABLE`: the required backend/frontend/runtime/seed/harness is absent
  or cannot start before the assertions can execute.

## Deterministic MVP4 Seed Requirements

Wave20+ runtime QA needs one fixed project fixture, preferably extending the
MVP3 deterministic seed project, with these stable objects:

| Seed area | Required fixture data | Purpose |
|---|---|---|
| Quality metrics | current published graph version, at least 4 published entities, 3 published relations, required property definitions, evidence refs, validation outcomes, review decisions, duplicate indicator, and relation density inputs | recompute completeness, consistency, traceability, validation, review, duplicate, and relation density metrics |
| Dataset/golden set | one `DRAFT` dataset, one `ACTIVE` dataset with active version, one `ARCHIVED` dataset, and golden items for `ENTITY`, `RELATION`, `PROPERTY_VALUE`, `EVIDENCE_LINK` | verify status filters, version detail, item kind filters, and provenance |
| Prompt/model evaluation | at least two prompt versions, two model runs, one prompt experiment, two evaluation runs, review outcomes, validation outcomes, correction patterns, missing evidence cases | verify prompt/model comparison rates and dimensions |
| Search groups | query term that returns `PUBLISHED_ENTITY`, `PUBLISHED_RELATION`, `SOURCE`, `SOURCE_CHUNK`, `EVIDENCE`, and `LINEAGE` groups, plus one no-result query and one stale/partial index state | verify grouped search and frontend states |
| RAG answered case | one question whose answer is supported by cited evidence/source chunks and linked published facts | verify grounding, citations, and published fact links |
| RAG insufficient case | one question whose only matching fact is candidate-only or unsupported by evidence | verify `INSUFFICIENT_EVIDENCE` and candidate exclusion |
| Graph explorer ready case | root published entity with a 2-hop neighborhood inside 150 nodes/300 edges, quality/source/evidence overlays, and lineage panel data | verify published-only exploration and overlays |
| Graph explorer too-large case | root/filter combination that estimates over 150 nodes or 300 edges, or max hop request over 3 | verify `SAFE_TOO_LARGE`, budgets, and suggested filters |
| Vector adapter/fallback | one state with `AVAILABLE` or fallback-backed similar evidence, and one local/dev state of `FALLBACK_KEYWORD`, `UNAVAILABLE`, or `NOT_CONFIGURED` | verify adapter status and fallback copy |
| External API | dev-auth token/header accepted for read-only graph/source/evidence/search/RAG paths; write methods rejected or absent | verify external read-only boundary |
| MVP3 regression | existing validation/review/correction/audit/publish/current published graph/quality data still seeded | verify MVP3 actual smoke remains passing |

Seed invariants:

- Candidate-only facts must be present in the candidate graph fixture but absent
  from published graph reads, RAG citations, external graph reads, and graph
  explorer nodes/edges.
- Every golden item and every RAG citation must preserve source/evidence
  provenance.
- Current and selected published graph versions must be distinguishable.
- Metric inputs must be countable from API responses without manual database
  inspection.

## INT4-001 MVP4 Contract Review

Contract readiness checks:

- `docs/api/openapi-mvp4-draft.json` parses with `python3 -m json.tool`.
- OpenAPI contains endpoint families for quality metrics, evaluation datasets,
  golden items, evaluation runs, prompt performance, prompt experiments,
  search, vector status, similar evidence, RAG answers, graph explorer, lineage,
  and external read-only APIs.
- Critical schemas exist: `QualityMetricsResponse`, `QualityMetric`,
  `QualityFormulaMetadata`, `EvaluationDataset`,
  `EvaluationDatasetVersion`, `GoldenSetItem`, `PromptExperiment`,
  `EvaluationRun`, `PromptPerformanceSummary`, `SearchResponse`,
  `SearchResultGroup`, `VectorAdapterState`, `SimilarEvidenceResponse`,
  `RagAnswerResponse`, `RagCitation`, `InsufficientEvidenceState`,
  `GraphExploreResponse`, `GraphTooLargeState`,
  `PublishedLineagePanel`, and `ExternalApiEnvelopeBase`.
- Runtime OpenAPI comparison does not require `ExternalApiEnvelopeBase` to be
  emitted as a standalone actual component. The actual external API contract is
  accepted when each concrete external envelope schema preserves `auth_mode`,
  `project_id`, relevant optional published graph version context, and `data`.
  QA should compare these concrete envelope shapes instead of requiring the
  abstract base component.
- Frozen enums exist with exact values:
  - `EvaluationDatasetStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`
  - `GoldenSetItemKind`: `ENTITY`, `RELATION`, `PROPERTY_VALUE`,
    `EVIDENCE_LINK`
  - `PromptExperimentStatus`: `DRAFT`, `RUNNING`, `COMPLETED`,
    `CANCELLED`
  - `RagAnswerState`: `ANSWERED`, `INSUFFICIENT_EVIDENCE`, `ERROR`
  - `GraphExploreState`: `READY`, `SAFE_TOO_LARGE`, `EMPTY`, `ERROR`
  - `VectorAdapterStatus`: `AVAILABLE`, `FALLBACK_KEYWORD`,
    `UNAVAILABLE`, `NOT_CONFIGURED`
  - `ExternalApiAuthMode`: `DEV_AUTH`
- Backend draft and Frontend UX review agree that there is no blocking DTO gap.
- No MVP4 P0 schema requires a weighted composite quality score.
- Collaboration/SLA schemas or routes, if later added, must be marked P1 and
  must not block `INT4-001` through `INT4-008`.

Runtime acceptance checks:

- Actual exported OpenAPI after implementation still contains all critical
  MVP4 paths and schemas, or deviations are documented and approved before QA.
  The concrete external envelope rule above is already approved and should not
  be treated as a deviation when the required envelope fields are present.
- Existing MVP3 paths remain present and compatible.
- Backend and Frontend generated or hand-maintained DTOs use the same enum
  literals and field names.

Exit criterion:

- `PASS` when contract, actual OpenAPI, frontend types, and planning docs align.
- `PARTIAL` when runtime OpenAPI exists but minor non-blocking refinements
  remain.
- `FAIL` when a P0 boundary is missing or contradicted.
- `NOT RUNNABLE` while runtime OpenAPI does not exist.

## INT4-002 Advanced Quality Metric Consistency

Contract readiness checks:

- `GET /api/v1/projects/{project_id}/quality/metrics` returns
  `QualityMetricsResponse`.
- `GET /api/v1/projects/{project_id}/quality/metrics/{metric_id}` returns
  metric detail and breakdown rows.
- Every P0 metric includes `QualityFormulaMetadata` with `numerator`,
  `denominator`, `scope`, `time_window`, `breakdown_dimension`, and
  `drilldown_target`.
- Every published-graph-based metric includes `published_graph_version_ref`.
- P0 metric groups cover `COMPLETENESS`, `CONSISTENCY`, `TRACEABILITY`,
  `VALIDATION`, `REVIEW`, `DUPLICATE`, and `RELATION_DENSITY`.
- P0 still has no weighted composite quality score. Backend, Frontend, and QA
  must treat any weighted score, default weight, or cross-metric rollup as P1
  and outside `INT4-002` closeout.

Wave22 closeout proof standard:

- Authoritative computation belongs to Backend. Frontend must expose
  numerator, denominator, formula metadata, published graph version context,
  and drilldown context visibly, but it must not be the authoritative source
  for metric recomputation.
- Preferred evidence artifact: Backend writes deterministic JSON to
  `/tmp/ontology-wave22-quality-proof.json`.
- Accepted equivalent: `scripts/seed_mvp4.py --output ...` includes the same
  proof object under `mvp4.quality_recompute_proof`. A standalone
  `/tmp/ontology-wave22-quality-proof.json` remains preferred for QA handoff.
- The proof must be computed from deterministic seed/API/service data, not
  from hand-written expected metric values alone.
- Backend tests must compare each API metric value/rate to the independently
  recomputed value/rate from the proof inputs.
- Proof JSON must include:
  - `project_id`
  - `published_graph_version_ref`
  - `generated_at`
  - `source`
  - `tolerance`
  - `no_weighted_composite_score: true`
  - `metric_rows[]`
- Every `metric_rows[]` item must include:
  - `metric_id`
  - `group`
  - `api_value` or `api_rate`
  - `recomputed_value` or `recomputed_rate`
  - `numerator`
  - `denominator`
  - `numerator_source`
  - `denominator_source`
  - `formula_metadata`
  - `scope`
  - `time_window`
  - `breakdown_dimension`
  - `drilldown_target`
  - `required_evidence_artifact`
  - `passed`
  - `tolerance`
- Counts must match exactly. Rate, percent, and ratio metrics must match within
  absolute tolerance `0.0001` after recomputing from exact numerator and
  denominator counts. Display rounding may be looser, but proof comparison must
  use the unrounded API numeric value when available.
- Denominators must be explicit. If a future filter produces a zero
  denominator, the metric must return a null/not-applicable value with formula
  metadata; the deterministic P0 seed used for closeout must include
  non-zero denominators for all seven metric groups.
- Drilldown targets must preserve the same `project_id`,
  `published_graph_version_ref`, active filter/time-window context, and the
  row-specific breakdown dimension used by the recomputation proof.

P0 metric group closeout matrix:

| Group | Numerator source | Denominator source | Scope | Time window | Breakdown dimension | Precision/tolerance | Drilldown target | Required evidence artifact |
|---|---|---|---|---|---|---|---|---|
| `COMPLETENESS` | Published facts in the selected version that satisfy required property coverage and required evidence coverage from deterministic published entity/relation/property/evidence refs. | All published facts in the selected version that are subject to required property/evidence completeness rules. | Selected project and selected/current published graph version; candidate-only facts excluded. | Seed closeout uses `all_time`; filtered runs use fact published time or selected time range recorded in formula metadata. | `class_type` first, with optional `source_id` or `required_property_id` rows when available. | Exact numerator/denominator; rate absolute tolerance `0.0001`. | `published_graph` or `quality_metric_detail` filtered to incomplete facts and preserving version/filter context. | `/tmp/ontology-wave22-quality-proof.json` row for `COMPLETENESS`, API metric JSON, backend recomputation test assertion, and drilldown query snapshot. |
| `CONSISTENCY` | Seeded facts or candidate lineage rows whose ontology constraints, relation endpoints, and required class/domain/range checks pass. | Seeded facts or candidate lineage rows that were checked by the same consistency rule set. | Selected project, selected/current published graph version, and reviewed candidate lineage used to explain published facts; candidate-only unpublished facts cannot count as published consistency. | Seed closeout uses `all_time`; filtered runs use validation/check execution time. | `constraint_type` first, with optional `relation_type` or `class_pair`. | Exact numerator/denominator; rate absolute tolerance `0.0001`. | `review_inbox`, `published_graph`, or `quality_metric_detail` filtered to failed/warning consistency rows. | Proof row for `CONSISTENCY`, raw validation/constraint input refs, API metric JSON, backend recomputation test assertion. |
| `TRACEABILITY` | Published facts with usable source/evidence refs and review/publish lineage refs. | All published facts in the selected published graph version. | Selected project and selected/current published graph version; candidate-only evidence may appear only as lineage context for already-published facts. | Seed closeout uses `all_time`; filtered runs use published time or review decision time as declared by formula metadata. | `source_id` first, with optional `evidence_kind`, `class_type`, or `relation_type`. | Exact numerator/denominator; rate absolute tolerance `0.0001`. | `evidence`, `published_graph`, `search`, or `quality_metric_detail` filtered to facts missing source/evidence/lineage. | Proof row for `TRACEABILITY`, source/evidence/review/publish refs used for recomputation, API metric JSON, backend recomputation test assertion. |
| `VALIDATION` | Validated facts or candidates with pass-equivalent outcomes declared by the metric formula, normally `PASSED` and not `FAILED`. | All facts or candidates in the selected scope that have validation outcomes included by the formula denominator. | Selected project plus formula-declared validation population; must state whether it is published facts, reviewed candidate lineage, or both. | Seed closeout uses `all_time`; filtered runs use validation result timestamp. | `validation_outcome` first, with optional `ontology_version`, `prompt_version`, `model_run`, `class_type`, or `relation_type`. | Exact numerator/denominator; rate absolute tolerance `0.0001`. | `review_inbox`, `evaluation_runs`, or `quality_metric_detail` filtered to validation failures/warnings and preserving denominator context. | Proof row for `VALIDATION`, raw validation outcome refs, API metric JSON, backend recomputation test assertion. |
| `REVIEW` | Review decisions counted as accepted by formula metadata, normally `APPROVE` plus `MODIFY_AND_APPROVE` or their candidate status equivalents. | All non-pending reviewed decisions in scope. | Selected project and reviewed candidate lineage relevant to the quality metric; pending/unreviewed rows excluded from denominator unless formula metadata explicitly says otherwise. | Seed closeout uses `all_time`; filtered runs use review decision timestamp. | `review_decision` first, with optional `reviewer_id`, `class_type`, `relation_type`, or `correction_pattern`. | Exact numerator/denominator; rate absolute tolerance `0.0001`. | `review_inbox`, `evaluation_runs`, or `quality_metric_detail` filtered to review decisions and preserving reviewer/version context. | Proof row for `REVIEW`, raw review decision refs, API metric JSON, backend recomputation test assertion. |
| `DUPLICATE` | Facts or candidates flagged by deterministic duplicate indicators, duplicate groups, or duplicate resolution metadata. | Comparable fact/candidate population declared by formula metadata. | Selected project and formula-declared population; if candidate duplicate signals are used, they must not be presented as published graph facts. | Seed closeout uses `all_time`; filtered runs use duplicate detection time or reviewed/published time declared by formula metadata. | `duplicate_bucket` first, with optional `class_type`, `source_id`, or `resolution_status`. | Exact numerator/denominator; rate absolute tolerance `0.0001`. | `search`, `review_inbox`, or `quality_metric_detail` filtered to duplicate buckets/groups. | Proof row for `DUPLICATE`, duplicate indicator/group refs, API metric JSON, backend recomputation test assertion. |
| `RELATION_DENSITY` | Published relation count in the selected version and optional class/domain/relation filter. | Published entity count in the same selected version and filter. | Selected project and selected/current published graph version; candidate relations and candidate entities excluded. | Snapshot metric for selected published graph version; seed closeout uses the current seeded version. | `class_type` or `domain_class` first, with optional `relation_type`. | Exact relation/entity counts; ratio absolute tolerance `0.0001`. | `published_graph` or `quality_metric_detail` filtered to the selected class/domain/relation context. | Proof row for `RELATION_DENSITY`, published entity/relation refs, API metric JSON, backend recomputation test assertion, graph drilldown query snapshot. |

Runtime recomputation assertions:

- Completeness rate equals seeded facts with required properties/evidence over
  all seeded required facts in the selected scope.
- Consistency count/rate equals seeded ontology constraint or relation endpoint
  consistency outcomes over the selected scope.
- Traceability rate equals published facts with usable source/evidence and
  review lineage over published facts in the selected version.
- Validation pass rate equals passed validations over validated seeded facts or
  candidates, using the formula metadata denominator.
- Review approval rate equals approved or modified review decisions over
  reviewed decisions in scope.
- Duplicate rate equals duplicate indicators over the seeded comparable fact or
  candidate population.
- Relation density equals relation count divided by entity count for the
  selected published graph version and class/domain filter.
- For every rate metric, displayed value equals the seed recomputation within a
  documented precision tolerance, and numerator/denominator/formula metadata
  explain the value.
- Drilldown hints point to matching review, published graph, evidence, search,
  or evaluation records and preserve the active filter/version context.

Frontend state assertions:

- Quality dashboard renders loading, empty, error, partial metric, and selected
  non-current version states.
- Formula explainer shows all required metadata fields.
- UI does not invent or require a composite quality score.

Exit criterion:

- `PASS` when all metric values and rates are recomputable from seed data and
  all formula metadata is visible.
- `PARTIAL` when metrics render but one group, drilldown, or recomputation proof
  is missing.
- `FAIL` when a metric uses undocumented denominators, candidate-only facts, or
  a required composite score.
- `NOT RUNNABLE` until quality endpoints and seed data exist.

## INT4-003 Evaluation Dataset and Golden Set Smoke

Contract readiness checks:

- Dataset list/detail/version/golden item paths exist and use
  `EvaluationDataset`, `EvaluationDatasetVersion`, and `GoldenSetItem`.
- Dataset status uses `DRAFT`, `ACTIVE`, `ARCHIVED`, defaulting to `DRAFT`.
- Golden item kind uses `ENTITY`, `RELATION`, `PROPERTY_VALUE`,
  `EVIDENCE_LINK`.
- Golden items expose source refs, evidence refs, review decision refs,
  reviewer context, and published graph version refs where available.

Runtime acceptance checks:

- List endpoint returns seeded `DRAFT`, `ACTIVE`, and `ARCHIVED` datasets with
  stable project scope, owner, active version, and notes.
- Dataset detail returns version history and active version context.
- Dataset version detail returns source refs, source segment refs, candidate
  refs, evidence refs, golden item count, creator, created time, and notes.
- Golden item list can be filtered or grouped by all four item kinds.
- Each golden item has kind-specific `expected_payload` and provenance back to
  source/evidence and review decision context.
- Dataset or version used by a completed evaluation run is treated as read-only
  by the UI, either through explicit backend fields or documented frontend
  policy.

Frontend state assertions:

- List/detail/version/golden item screens show loading, empty, error, and
  provenance-missing warning states.
- `DRAFT`, `ACTIVE`, and `ARCHIVED` states produce distinct editability/copy
  behavior.

Exit criterion:

- `PASS` when seeded datasets, versions, and all golden item kinds can be
  inspected with provenance.
- `PARTIAL` when list/detail exists but one status, kind, or provenance field
  is missing.
- `FAIL` when golden items lack required provenance or status semantics are
  wrong.
- `NOT RUNNABLE` until dataset/golden endpoints and seed data exist.

## INT4-004 Prompt and Model Evaluation Smoke

Contract readiness checks:

- Evaluation run and prompt experiment endpoints exist.
- `PromptExperimentStatus` uses `DRAFT`, `RUNNING`, `COMPLETED`,
  `CANCELLED`.
- Prompt/model performance summary supports dimensions: prompt version, model
  run, source type, class type, relation type, validation outcome, review
  decision, and correction pattern.
- Performance rows expose approval, rejection, modification,
  failed-validation, and missing-evidence rates, plus optional latency, token,
  and cost fields.

Runtime acceptance checks:

- Seeded prompt experiment list includes at least one `DRAFT` or `RUNNING` case
  and one `COMPLETED` comparison case.
- Evaluation run detail exposes dataset version, experiment, prompt version,
  model run, status, started/ended time, dimensions, metrics, and errors when
  failed.
- Prompt/model summary rates recompute from seeded review decisions,
  validation outcomes, missing evidence cases, and correction patterns.
- Optional telemetry fields are displayed as unavailable when null, not as zero.
- Failed evaluation run exposes safe error code/message and does not corrupt
  completed run metrics.

Frontend state assertions:

- Prompt performance UI renders loading, empty, running, failed, and telemetry
  unavailable states.
- Filters for all P0 dimensions are available or intentionally disabled with
  clear unavailable state.

Exit criterion:

- `PASS` when prompt/model rates and dimensions are recomputable and UI states
  match the UX review.
- `PARTIAL` when comparison works but one dimension, denominator/sample count,
  or state is missing.
- `FAIL` when rates cannot be tied to seeded outcomes or running/failed states
  are shown as completed performance.
- `NOT RUNNABLE` until evaluation endpoints and seed data exist.

## INT4-005 Search and RAG Grounding Smoke

Contract readiness checks:

- Search endpoint returns `SearchResponse` with grouped
  `SearchResultGroup` results.
- Search result kinds include `PUBLISHED_ENTITY`, `PUBLISHED_RELATION`,
  `SOURCE`, `SOURCE_CHUNK`, `EVIDENCE`, and `LINEAGE`.
- Vector status and similar evidence endpoints expose adapter status, embedding
  target, fallback reason, result items, and `fallback_used` on
  `SimilarEvidenceResponse`.
- RAG answer endpoint returns `RagAnswerResponse` with `state`, `answer`,
  `citations`, `linked_published_facts`, `insufficient_evidence`, and
  `published_graph_version_ref`.

Search runtime assertions:

- Seeded query returns all expected result groups with snippets, scores,
  version context, source refs, evidence refs, or lineage refs as applicable.
- No-result query returns `total_count=0` and frontend no-result state.
- `PARTIAL` and `STALE` index states produce frontend warning states.
- Search is read-only and does not create candidates, change review decisions,
  publish facts, or mutate graph data.

RAG answered-case assertions:

- `state=ANSWERED` includes answer text, cited evidence/source chunks, linked
  published facts, coverage/confidence state, and published graph version ref.
- Each citation resolves to an evidence/source chunk or linked published fact
  in the selected/current published graph version.
- Linked published facts resolve through published graph APIs and preserve
  version context.
- Candidate refs may appear only as lineage context for already published
  facts, not as answer facts.

RAG insufficient-evidence assertions:

- Candidate-only fact question returns `INSUFFICIENT_EVIDENCE`, or a supported
  refusal-style answer with no unsupported factual claim.
- Response includes reason/message, missing scopes, and suggested queries where
  available.
- Citations are empty or explicitly marked insufficient; UI must not display an
  unsupported answer as grounded.

Frontend state assertions:

- Search renders no query, loading, grouped results, no results,
  partial/stale index, and error states.
- RAG renders loading, answered, insufficient evidence, error, and empty
  citation warning states.
- Candidate-exclusion copy is visible in the RAG workspace.

Exit criterion:

- `PASS` when search groups render and RAG grounding/candidate exclusion can be
  proven from seed data.
- `PARTIAL` when search works but RAG insufficient evidence, vector fallback,
  or UI state coverage is incomplete.
- `FAIL` when RAG uses candidate-only facts, lacks citations for an answered
  claim, or search/RAG mutates graph data.
- `NOT RUNNABLE` until search/RAG endpoints, seed data, and UI route smoke
  exist.

## INT4-006 Advanced Graph Explorer Separation Test

Contract readiness checks:

- Graph explorer endpoints exist:
  - `GET /api/v1/projects/{project_id}/published-graph/explore`
  - `GET /api/v1/published-graph/versions/{version_id}/explore`
  - `GET /api/v1/published-graph/lineage`
- `GraphExploreResponse` includes `state`, `published_graph_version_ref`,
  nodes, edges, `too_large`, and lineage panel data.
- `GraphExploreState` includes `READY`, `SAFE_TOO_LARGE`, `EMPTY`, and
  `ERROR`.
- `GraphTooLargeState` includes estimated nodes, estimated edges, node budget,
  edge budget, message, and suggested filters.

Runtime published-only assertions:

- Default exploration uses current published graph version context.
- Version-specific exploration uses the selected published graph version and
  labels non-current context in the UI.
- `max_hops` defaults to `2`.
- `max_hops=3` is accepted when within budget.
- Requests above `max_hops=3` are rejected or normalized with a safe validation
  response; they must not render an unsafe graph.
- Queries estimated above `150` nodes or `300` edges return
  `state=SAFE_TOO_LARGE` and include budgets plus suggested filters.
- `READY` response contains only published entities/relations. Candidate-only
  seeded facts are absent from nodes and edges.
- `PublishedLineagePanel.candidate_ref` may appear only as provenance for a
  published fact and must not expose an editable candidate surface.
- Quality overlays, source/evidence overlays, class filters, relation filters,
  and lineage inclusion produce deterministic changes against seed data.

Frontend state assertions:

- Graph route renders loading, `READY`, `SAFE_TOO_LARGE`, `EMPTY`, and `ERROR`
  states.
- UI disables hop controls above max 3 and avoids rendering partial unsafe
  graphs in `SAFE_TOO_LARGE`.
- Selected fact lineage panel shows published version, publish job, review
  decision, candidate lineage context, evidence refs, source refs, ontology
  version, model run, prompt version, and created time where seeded.

Exit criterion:

- `PASS` when published-only separation and safe-too-large behavior are proven.
- `PARTIAL` when graph renders but overlay, lineage, or version context checks
  are incomplete.
- `FAIL` when candidate-only facts render as graph facts or unsafe large graphs
  are attempted.
- `NOT RUNNABLE` until graph explorer endpoints, seed data, and UI route smoke
  exist.

## INT4-007 MVP3 Regression

Regression scope:

- Backend focused tests for validation/review/correction/audit/publish/current
  published graph/quality still pass.
- `npm run smoke:mvp3:actual` still passes against deterministic seed data.
- MVP2 regression smoke remains passing if touched by Wave20 code.
- Existing MVP3 routes remain stable and project-scoped:
  review inbox/workbench, publish queue/job, published graph, and quality.
- MVP3 published graph still reads only published facts, not candidate graph
  facts.
- MVP3 quality summary v0.1 remains compatible while MVP4 advanced metrics are
  additive.

Exit criterion:

- `PASS` when existing MVP3 acceptance smoke remains green after MVP4 changes.
- `PARTIAL` when MVP4 changes pass but one non-touched regression harness is
  not executed with documented reason.
- `FAIL` when MVP4 changes break MVP3 closed P0 behavior.
- `NOT RUNNABLE` when backend/frontend processes or deterministic seed cannot
  start.

## INT4-008 External API Smoke

Contract readiness checks:

- External endpoints exist for current graph snapshot, published entity,
  published relation, source, evidence, search, and RAG answer.
- External envelope exposes `auth_mode=DEV_AUTH`, project context, and
  published graph version ref where graph facts are returned.
- External APIs are documented as read-only and dev-auth-only.

Runtime read-only assertions:

- Valid dev auth can read current graph snapshot metadata.
- Valid dev auth can read one published entity and one published relation with
  evidence/version context.
- Valid dev auth can read one source and one evidence record with project
  context and locator/provenance fields.
- Valid dev auth can run external search with grouped read-only results.
- Valid dev auth can request external RAG answer with the same grounding and
  candidate-exclusion behavior as internal RAG.
- Missing or invalid dev auth returns the documented auth failure shape.
- Write methods such as `POST`, `PATCH`, `PUT`, or `DELETE` on external graph,
  source, or evidence lookup endpoints are absent or return `405`/`404`/auth
  failure without mutation.
- External APIs never expose candidate-only facts as approved facts.

Frontend/docs assertions:

- `/projects/:projectId/external-api` or equivalent docs surface shows
  endpoint catalog, `DEV_AUTH` badge, read-only copy, request examples, response
  examples, and version/evidence context.
- Docs surface handles loading, no published graph, dev auth missing, and error
  states.

Exit criterion:

- `PASS` when external dev-auth reads work and mutation attempts are blocked.
- `PARTIAL` when read endpoints work but docs surface or auth-negative cases
  are incomplete.
- `FAIL` when external APIs mutate data, bypass dev auth, or expose candidate
  facts as approved facts.
- `NOT RUNNABLE` until external endpoints, seed data, and auth harness exist.

## INT4-009 Collaboration/SLA Smoke

Scope status:

- `INT4-009` is P1 because PM froze collaboration/SLA outside MVP4 P0.
- Do not block Wave20 P0 implementation or MVP4 P0 closeout on this item unless
  a later PM order promotes a minimal slice.

If promoted later, readiness checks must cover:

- Comments, assignment, due date, queue age, SLA status, and notification
  boundaries are defined by PM and Backend.
- Frontend states for comments, assignment, due date, SLA at risk/overdue, and
  notification failure are reviewed.
- Collaboration data must not change publish eligibility without an explicit PM
  policy change.

Exit criterion:

- `PASS` only if PM promotes the slice and runtime smoke passes.
- `PARTIAL` if promoted but one state or endpoint is missing.
- `FAIL` if promoted behavior changes publish/review policy unexpectedly.
- `NOT RUNNABLE` for MVP4 P0 because the item is intentionally P1.

## Wave20 Entry Recommendation

Recommendation: open MVP4 thin implementation after commander accepts Wave19
PM, Backend, Frontend, and QA artifacts.

Suggested Wave20 implementation order:

1. Backend schemas/routers/seed foundation for quality, search/RAG/vector, graph
   explorer, and external read-only surfaces.
2. Frontend type/client/mock foundation and route constants, preserving MVP3
   routes.
3. Quality metrics thin slice to validate explainable metrics and formula
   metadata.
4. Search plus vector fallback and RAG answer slice to validate grounding and
   candidate exclusion early.
5. Graph explorer slice to validate published-only separation and
   `SAFE_TOO_LARGE`.
6. Dataset/golden set and prompt/model evaluation slice.
7. External API docs/smoke slice.
8. MVP3 regression gate before completion.

Wave20 blockers to watch:

- Runtime OpenAPI must remain aligned with this Wave19 draft or document
  approved deviations.
- Deterministic seed must include both positive and negative cases, especially
  candidate-only RAG and graph separation cases.
- External API read-only behavior must be proven by negative method tests, not
  only by documentation.
- Prompt/model performance rates should expose denominator or sample-count
  context before final closeout; Frontend marked this as non-blocking but QA
  should keep it visible.
