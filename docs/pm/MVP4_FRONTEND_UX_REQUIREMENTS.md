# MVP 4 Frontend UX Requirements

Status: `WAVE 19 FRONTEND FIELD/STATE/IA REVIEW`
Date: 2026-06-19

This document reviews the MVP4 Backend contract draft from a Frontend/UIUX
perspective. It is intentionally review-first: no runtime UI implementation is
included in Wave19.

Primary inputs:

- `docs/pm/MVP4_PREP_BRIEF.md`
- `docs/backlog/MVP4_DRAFT_BACKLOG.md`
- `docs/adr/0007-mvp4-search-rag-read-only-boundary.md`
- `docs/api/MVP4_API_CONTRACT_DRAFT.md`
- `docs/api/openapi-mvp4-draft.json`
- `apps/frontend/src/app/router.tsx`
- `apps/frontend/src/shared/layout/navigation.ts`

## Review Summary

- MVP4 UI should remain project-scoped and additive to the closed MVP3 route
  set. Existing MVP3 regression routes should not be renamed or moved.
- Backend draft is sufficient for Wave20 thin frontend implementation planning.
  There is no blocking DTO gap.
- P0 quality UI must present explainable metric groups only. Weighted composite
  score, default weights, and cross-metric rollup are P1 and must not appear as
  required MVP4 P0 UI.
- Search, RAG, graph explorer, and external consumer surfaces must remain
  read-only and must show published graph version context when graph facts are
  shown.
- Candidate graph facts must be explicitly excluded from RAG answer/citation
  copy. Candidate lineage may appear only as lineage context for an already
  published fact, not as an answer fact.
- Vector/similar evidence adapter status is a first-class UI state, not an
  implementation detail.

## Referenced Backend Contract

The OpenAPI planning artifact is `docs/api/openapi-mvp4-draft.json`, OpenAPI
`3.1.0`, version `0.4.0-draft`, with `26` paths and `78` schemas.

Frontend implementation should generate or hand-maintain types from these
schema families:

| UI area | Endpoint examples | Key schemas |
|---|---|---|
| Quality dashboard | `GET /api/v1/projects/{project_id}/quality/metrics`, `GET /api/v1/projects/{project_id}/quality/metrics/{metric_id}` | `QualityMetricsResponse`, `QualityMetric`, `QualityFormulaMetadata`, `QualityDrilldownHint`, `QualityMetricDetail` |
| Evaluation dataset/golden set | `GET/POST /api/v1/projects/{project_id}/evaluation-datasets`, `GET /api/v1/evaluation-dataset-versions/{dataset_version_id}/golden-items` | `EvaluationDataset`, `EvaluationDatasetVersion`, `GoldenSetItem`, `EvaluationDatasetStatus`, `GoldenSetItemKind` |
| Prompt/model performance | `GET /api/v1/projects/{project_id}/prompt-performance/summary`, `GET/POST /api/v1/projects/{project_id}/prompt-experiments`, `GET/POST /api/v1/projects/{project_id}/evaluation-runs` | `PromptPerformanceSummary`, `PromptPerformanceRow`, `PromptExperiment`, `EvaluationRun`, `EvaluationDimensions` |
| Search | `GET /api/v1/projects/{project_id}/search` | `SearchResponse`, `SearchResultGroup`, `SearchResultItem`, `SearchResultKind` |
| Vector/similar evidence | `GET /api/v1/projects/{project_id}/vector/status`, `POST /api/v1/projects/{project_id}/similar-evidence` | `VectorAdapterState`, `SimilarEvidenceRequest`, `SimilarEvidenceResponse`, `VectorAdapterStatus`, `VectorFallbackReason` |
| RAG answers | `POST /api/v1/projects/{project_id}/rag/answers` | `RagAnswerRequest`, `RagAnswerResponse`, `RagCitation`, `InsufficientEvidenceState`, `RagAnswerState` |
| Advanced graph explorer | `GET /api/v1/projects/{project_id}/published-graph/explore`, `GET /api/v1/published-graph/versions/{version_id}/explore`, `GET /api/v1/published-graph/lineage` | `GraphExploreResponse`, `GraphExploreNode`, `GraphExploreEdge`, `GraphExploreState`, `GraphTooLargeState`, `PublishedLineagePanel` |
| External read-only API | `/api/v1/external/...` graph/source/evidence/search/RAG paths | `ExternalApiEnvelopeBase`, external envelope schemas, read DTOs reused from internal surfaces |

## Route and IA Proposal

Keep the existing top-level navigation stable:

- `/dashboard`
- `/projects`
- `/ontology` redirecting to project selection
- `/sources` redirecting to project selection
- `/extraction` redirecting to project selection
- `/candidates` redirecting to project selection

MVP4 should add project-scoped routes under `/projects/:projectId` and avoid
adding ID-bound detail pages to the global LNB.

Recommended routes:

| Route | Purpose | MVP4 scope |
|---|---|---|
| `/projects/:projectId/quality` | Advanced quality dashboard landing. Replace/extend existing MVP3 quality page through additive feature flags or tabs. | FE4-001 |
| `/projects/:projectId/quality/metrics/:metricId` | Metric detail and breakdown drilldown. Reached from dashboard cards/tables, not LNB. | FE4-001 |
| `/projects/:projectId/evaluation-datasets` | Dataset list and status filters. | FE4-003 |
| `/projects/:projectId/evaluation-datasets/:datasetId` | Dataset detail, versions, active version context. | FE4-003 |
| `/projects/:projectId/evaluation-dataset-versions/:datasetVersionId` | Golden item list/detail context. | FE4-003 |
| `/projects/:projectId/prompt-performance` | Prompt/model comparison dashboard. | FE4-002 |
| `/projects/:projectId/prompt-experiments/:experimentId` | Experiment detail and run history. | FE4-002 |
| `/projects/:projectId/search` | Integrated search landing. | FE4-005 |
| `/projects/:projectId/rag` | Grounded answer workspace. | FE4-006 |
| `/projects/:projectId/published-graph` | Advanced graph explorer, preserving current route. | FE4-004 |
| `/projects/:projectId/external-api` | Minimal read-only API docs/consumer surface. | FE4-007 |

Project detail should expose MVP4 entry points as contextual actions or tabs:
Quality, Search, RAG, Published graph, Evaluation, and API docs. Do not add
every MVP4 detail route to `navigationItems`; keep LNB stable and use
breadcrumbs/contextual links for drilldowns.

## FE4-001 Advanced Quality Dashboard

Primary endpoint and schemas:

- `GET /api/v1/projects/{project_id}/quality/metrics`
- `GET /api/v1/projects/{project_id}/quality/metrics/{metric_id}`
- `QualityMetricsResponse`
- `QualityMetric`
- `QualityFormulaMetadata`
- `QualityDrilldownHint`
- `QualityMetricDetail`

Required dashboard structure:

- Overview band with published graph version context, generated time, active
  filters, and metric group health.
- Metric groups for `COMPLETENESS`, `CONSISTENCY`, `TRACEABILITY`,
  `VALIDATION`, `REVIEW`, `DUPLICATE`, and `RELATION_DENSITY`.
- Metric cards or rows with label, unit, value/rate, trend, group, formula
  affordance, and drilldown action.
- Formula explainer panel showing `numerator`, `denominator`, `scope`,
  `time_window`, `breakdown_dimension`, and `drilldown_target`.
- Trend area that uses the `trend` field when available and falls back to a
  static current-value presentation when trend is null.
- Filters for project context, published graph version, source, ontology
  version, prompt version, model run, relation type, class type, reviewer, and
  time range as Backend support matures.
- Drilldowns into review inbox, published graph, evidence, evaluation runs,
  search, or metric detail based on `QualityDrilldownHint.target` and `query`.

P0 state requirements:

- `loading`: skeleton overview and metric group placeholders.
- `empty`: no metrics for selected graph version/filter; show clear reset
  action and version context.
- `error`: `ApiErrorResponse` message plus retry.
- `partial`: individual metric values may have null `value`, `rate`, or
  `trend`; keep formula and drilldown visible if present.
- `version mismatch`: if selected version is non-current, show a visible
  "selected published version" badge.

Composite score guidance:

- No MVP4 P0 screen should require or invent a weighted composite quality score.
- If a later P1 composite exists, it should be visually secondary to metric
  groups and must disclose weights/formula.

DTO review:

- Blocking gap: none.
- Non-blocking refinement for Wave20: performance rows and quality breakdowns
  should expose numerator/denominator counts where practical so the UI can
  avoid showing rates without sample size context.

## FE4-003 Evaluation Dataset and Golden Set

Primary endpoints and schemas:

- `GET/POST /api/v1/projects/{project_id}/evaluation-datasets`
- `GET /api/v1/evaluation-datasets/{dataset_id}`
- `GET/POST /api/v1/evaluation-datasets/{dataset_id}/versions`
- `GET /api/v1/evaluation-dataset-versions/{dataset_version_id}`
- `GET/POST /api/v1/evaluation-dataset-versions/{dataset_version_id}/golden-items`
- `EvaluationDataset`
- `EvaluationDatasetVersion`
- `GoldenSetItem`
- `EvaluationDatasetStatus`
- `GoldenSetItemKind`

Required UI structure:

- Dataset list with name, status, owner, active version, updated time, notes,
  golden item count, and empty-state create action.
- Dataset detail with description, status badge, active version, owner, notes,
  source/evidence coverage, and version history.
- Version detail with version number, status, source refs, segment refs,
  candidate refs, evidence refs, golden item count, created by, created time,
  and notes.
- Golden item table grouped/filterable by `ENTITY`, `RELATION`,
  `PROPERTY_VALUE`, and `EVIDENCE_LINK`.
- Golden item detail drawer showing `expected_payload`, source refs, evidence
  refs, review decision ref, reviewer, published graph version ref, and notes.

Editability states:

- `DRAFT`: editable dataset metadata and golden items.
- `ACTIVE`: treat as controlled; editing should create a new version or be
  disabled unless Backend later exposes explicit mutation semantics.
- `ARCHIVED`: read-only.
- Version used by a completed evaluation run should render read-only even if
  dataset status remains `ACTIVE`.

P0 state requirements:

- `loading`: list/detail skeletons.
- `empty`: no datasets, no versions, or no golden items with clear next action.
- `error`: dataset/version/item not found and retry/back-to-list actions.
- `provenance missing`: if source/evidence/review refs are empty, show a
  warning state because golden items are expected to be provenance-backed.

DTO review:

- Blocking gap: none.
- Non-blocking refinement for Wave20: add a segment-specific ref or locator for
  `source_segment_refs`; the draft currently types segment refs as `SourceRef`,
  which is enough for planning but weak for chunk-level UI labels.
- Non-blocking refinement for Wave20: add explicit `is_editable` and
  `locked_reason` to dataset versions or golden items if Backend intends to
  enforce immutability after completed evaluation runs.

## FE4-002 Prompt and Model Performance

Primary endpoints and schemas:

- `GET /api/v1/projects/{project_id}/prompt-performance/summary`
- `GET/POST /api/v1/projects/{project_id}/prompt-experiments`
- `GET /api/v1/prompt-experiments/{experiment_id}`
- `GET/POST /api/v1/projects/{project_id}/evaluation-runs`
- `GET /api/v1/evaluation-runs/{evaluation_run_id}`
- `PromptPerformanceSummary`
- `PromptPerformanceRow`
- `PromptExperiment`
- `EvaluationRun`
- `EvaluationDimensions`

Required UI structure:

- Comparison table by prompt version and model run with approval, rejection,
  modification, failed-validation, and missing-evidence rates.
- Dimension filters for prompt version, model run, source type, class type,
  relation type, validation outcome, review decision, and correction pattern.
- Correction pattern breakdown panel to show where expert corrections cluster.
- Experiment list/detail with status `DRAFT`, `RUNNING`, `COMPLETED`,
  `CANCELLED`, hypothesis, dataset/version, control prompt, treatment prompt,
  model/provider, run window, notes, and run history.
- Evaluation run detail with status `PENDING`, `RUNNING`, `SUCCESS`, `FAILED`,
  metrics, dimensions, error code/message, started/ended time, and requested by.

P0 state requirements:

- `loading`: chart/table skeletons.
- `empty`: no rows for selected filters; reset filters and link to evaluation
  dataset setup.
- `running`: show experiment/run in-progress state without implying final
  performance.
- `failed`: show `error_code` and `error_message` with retry/create-new-run
  affordance when supported.
- `telemetry unavailable`: `latency_ms`, `token_count`, and `cost` are optional;
  hide or label as unavailable rather than showing zero.

DTO review:

- Blocking gap: none.
- Non-blocking refinement for Wave20: add per-row denominator/sample counts for
  rates to support trustworthy comparison tables.

## FE4-004 Advanced Published Graph Explorer

Primary endpoints and schemas:

- `GET /api/v1/projects/{project_id}/published-graph/explore`
- `GET /api/v1/published-graph/versions/{version_id}/explore`
- `GET /api/v1/published-graph/lineage`
- `GraphExploreResponse`
- `GraphExploreNode`
- `GraphExploreEdge`
- `GraphExploreState`
- `GraphTooLargeState`
- `PublishedLineagePanel`

Required UI structure:

- Use existing `/projects/:projectId/published-graph` route as the MVP4
  advanced graph explorer entry.
- Version selector defaults to the current published graph version and clearly
  labels non-current selected versions.
- Root entity search/selector before expansion.
- N-hop controls with default `2`, maximum `3`, and disabled state beyond max.
- Filters for class ids, relation ids, quality overlay, source/evidence
  overlay, and lineage inclusion.
- Graph canvas with hop distance, relation direction, class/relation labels,
  source/evidence counts, and quality summaries.
- Selected fact lineage panel for published entities and relations showing
  published version, publish job, review decision, candidate lineage context,
  evidence refs, source refs, ontology version, model run, prompt version, and
  created time.

P0 state requirements:

- `READY`: render nodes/edges and overlays.
- `SAFE_TOO_LARGE`: do not render partial unsafe graph; show estimated nodes,
  estimated edges, budgets, message, and suggested filters.
- `EMPTY`: no graph facts for selected root/version/filter.
- `ERROR`: API error with retry and filter reset.
- `loading`: canvas skeleton plus disabled filters.

Published graph separation:

- The graph explorer must display published graph facts only.
- `PublishedLineagePanel.candidate_ref` may appear as lineage provenance for a
  published fact, not as an editable candidate or unapproved graph fact.

DTO review:

- Blocking gap: none.
- Non-blocking refinement for Wave20: include display labels in
  `suggested_filters` or make them structured objects if QA wants deterministic
  safe-too-large UI assertions.

## FE4-005 Integrated Search

Primary endpoint and schemas:

- `GET /api/v1/projects/{project_id}/search`
- `SearchResponse`
- `SearchResultGroup`
- `SearchResultItem`
- `SearchResultKind`

Required UI structure:

- Project-scoped search page at `/projects/:projectId/search`.
- Search input with query persistence, keyboard submit, clear action, and
  scoped filters.
- Result groups for `PUBLISHED_ENTITY`, `PUBLISHED_RELATION`, `SOURCE`,
  `SOURCE_CHUNK`, `EVIDENCE`, and `LINEAGE`.
- Snippets with highlighted terms when available from `snippet`.
- Result metadata showing score, version context, source ref, evidence refs,
  and lineage ref when present.
- Result actions derived from kind:
  - published entity/relation: open graph explorer focused on fact.
  - source/source chunk: open source or chunk viewer.
  - evidence: open evidence viewer.
  - lineage: open lineage panel or published graph context.
  - RAG handoff: ask a question using this result context when safe.

P0 state requirements:

- `loading`: grouped result skeleton.
- `no query`: idle state without querying.
- `no results`: `total_count=0` with suggested filter reset.
- `partial index`: `index_state=PARTIAL` warning banner.
- `stale index`: `index_state=STALE` warning with last-known version context
  when available.
- `error`: API error and retry.

DTO review:

- Blocking gap: none.
- Non-blocking refinement for Wave20: consider an `index_message` or
  `indexed_at` field if stale/partial index copy needs to be more specific.

## FE4-006 RAG Answer Screen

Primary endpoint and schemas:

- `POST /api/v1/projects/{project_id}/rag/answers`
- `RagAnswerRequest`
- `RagAnswerResponse`
- `RagCitation`
- `RagAnswerState`
- `InsufficientEvidenceState`
- `PublishedFactRef`

Required UI structure:

- Project-scoped RAG workspace at `/projects/:projectId/rag`.
- Question composer with selected published graph version, source filters, and
  max citations.
- Answer panel with `state`, `answer`, coverage, and published graph version
  context.
- Citation rail grouped by `EVIDENCE_CHUNK`, `SOURCE_CHUNK`,
  `PUBLISHED_ENTITY`, and `PUBLISHED_RELATION`.
- Linked published facts panel using `linked_published_facts`.
- Insufficient evidence panel showing reason code, message, missing scopes, and
  suggested queries.
- Audit-friendly copy area that states answers are read-only and grounded in
  published graph plus cited source/evidence chunks.

Candidate-exclusion UX copy direction:

- Preferred copy: "Answers use published graph facts and cited evidence only.
  Candidate graph facts are excluded until they are reviewed and published."
- Do not label candidate refs in lineage as answer facts.
- If a user asks about a candidate-only fact, render
  `INSUFFICIENT_EVIDENCE` or a supported refusal-style answer rather than a
  confident answer.

P0 state requirements:

- `ANSWERED`: answer plus citations and linked published facts.
- `INSUFFICIENT_EVIDENCE`: no unsupported answer; show missing scopes and
  suggested queries.
- `ERROR`: API error or `state=ERROR`, retry, and preserve the question.
- `loading`: streaming-like or skeleton state even if API is non-streaming.
- `empty citations`: treat as insufficient or warning; do not show as fully
  grounded answer.

DTO review:

- Blocking gap: none.
- Non-blocking refinement for Wave20: if `state=ERROR` is returned as a normal
  response, require a user-safe error message field or use `ApiErrorResponse`
  consistently.

## FE4-005/FE4-006 Vector and Similar Evidence Treatment

Primary endpoints and schemas:

- `GET /api/v1/projects/{project_id}/vector/status`
- `POST /api/v1/projects/{project_id}/similar-evidence`
- `VectorAdapterState`
- `SimilarEvidenceRequest`
- `SimilarEvidenceResponse`
- `SimilarEvidenceItem`
- `VectorAdapterStatus`
- `VectorFallbackReason`

Required UI treatment:

- Show vector adapter status near search/RAG/similar-evidence entry points.
- `AVAILABLE`: label similar evidence as vector-backed.
- `FALLBACK_KEYWORD`: show keyword fallback banner and still render results.
- `UNAVAILABLE`: disable vector-specific affordances and provide fallback copy.
- `NOT_CONFIGURED`: treat as expected local/dev state, not a product failure.
- `fallback_used=true`: label each result set as fallback-backed.
- Similar evidence results should show evidence ref, source ref, snippet,
  similarity score when meaningful, match reason, version context, and linked
  published facts.

DTO review:

- Blocking gap: none.
- Non-blocking refinement for Wave20: clarify whether `similarity_score` is
  nullable for keyword fallback. If not meaningful, UI should hide the score
  and prioritize `match_reason`.

## FE4-007 External API Consumer Surface

Primary endpoint families and schemas:

- `GET /api/v1/external/projects/{project_id}/published-graph/current`
- `GET /api/v1/external/published-graph/entities/{entity_id}`
- `GET /api/v1/external/published-graph/relations/{relation_id}`
- `GET /api/v1/external/sources/{source_id}`
- `GET /api/v1/external/evidence/{evidence_id}`
- `GET /api/v1/external/projects/{project_id}/search`
- `POST /api/v1/external/projects/{project_id}/rag/answers`
- `ExternalApiEnvelopeBase`
- `ExternalApiAuthMode`

Minimal UI/docs need:

- Project-scoped docs page at `/projects/:projectId/external-api`.
- Read-only endpoint catalog grouped by graph, source/evidence, search, and
  RAG.
- Development auth badge showing `DEV_AUTH`.
- Current/selected published graph version context.
- Request examples for lookup, search, and RAG answer.
- Response examples that show evidence refs and published graph version refs.
- Clear non-goals: no writes, no candidate graph facts as approved facts, no
  production API keys/service accounts/quotas in MVP4 P0.

P0 state requirements:

- `loading`: endpoint catalog skeleton.
- `no published graph`: external graph docs remain visible but examples show
  unavailable current snapshot.
- `dev auth missing`: show setup hint for local/dev auth once Backend defines
  auth failure shape.
- `error`: OpenAPI/example load failure.

DTO review:

- Blocking gap: none.
- External docs UI can be built from static route metadata plus OpenAPI schema
  references; no extra Backend DTO is required for P0.

## DTO Gaps and API Change Requests

Blocking DTO gap: none.

The Backend draft supports product-grade MVP4 UI states for quality metrics,
evaluation datasets/golden sets, prompt/model performance, graph explorer,
integrated search, RAG answers, vector fallback, and external read-only docs.

Recommended non-blocking refinements before or during Wave20 thin
implementation:

- Add numerator/denominator or sample count fields to prompt/model performance
  rows so comparison rates are not shown without context.
- Add segment-specific refs or locator fields for dataset version
  `source_segment_refs` and golden item provenance.
- Add `is_editable` and `locked_reason` for dataset versions/golden items if
  immutability after completed runs is enforced by Backend.
- Add an `index_message`, `indexed_at`, or version marker for search
  `index_state=PARTIAL` and `index_state=STALE`.
- Clarify whether `SimilarEvidenceItem.similarity_score` is nullable or
  semantically meaningful when `fallback_used=true`.
- If graph `suggested_filters` need clickable UI, make them structured objects
  rather than opaque strings.

## Wave20 Frontend Implementation Sequence Recommendation

Recommended first sequence after Wave19 alignment:

1. Type/client foundation: add MVP4 TypeScript DTOs, mock fixtures, API client
   methods, and route constants without changing MVP3 route behavior.
2. Quality metrics thin slice: extend `/projects/:projectId/quality` with
   metric groups, formula explainer, filter shell, and drilldown stubs because
   it validates the explainable-metric P0 boundary early.
3. Search plus vector status slice: implement `/projects/:projectId/search`
   with grouped results, stale/partial index states, and vector fallback banner.
4. RAG answer slice: implement `/projects/:projectId/rag` using the same
   citation/source/fact components as search and verify candidate-exclusion
   copy.
5. Advanced graph explorer slice: upgrade `/projects/:projectId/published-graph`
   for n-hop, overlays, version selector, lineage panel, and `SAFE_TOO_LARGE`.
6. Evaluation/prompt performance slice: add dataset/golden set routes, then
   prompt performance and experiment/run detail after the shared filters and
   status badges are stable.
7. External API docs slice: add `/projects/:projectId/external-api` as a
   lightweight consumer-facing docs surface using the same version/evidence
   display language.

Validation expectation for Wave20:

- Add mock contract tests for all MVP4 state enums.
- Preserve `npm run smoke:mvp3:actual` as a regression gate once runtime code is
  touched.
- Add browser smoke for quality/search/RAG/graph safe-too-large after UI slices
  exist.
