# MVP 4 API Contract Draft

Status: `WAVE 19 BACKEND CONTRACT DRAFT`
Date: 2026-06-19

This draft extends the closed MVP 3 contract with advanced quality metrics,
evaluation datasets/golden sets, prompt/model performance evaluation, keyword
search, vector/similar-evidence adapter contracts, grounded RAG, advanced
published graph exploration, and external read-only APIs.

Canonical machine-readable draft: `docs/api/openapi-mvp4-draft.json`.

## Contract Principles

- MVP4 is additive. Existing MVP3 paths in `docs/api/openapi-mvp3-draft.json`
  remain stable and are not renamed or removed.
- Candidate graph and published graph remain separate. MVP4 search, RAG,
  external APIs, and graph explorer read published graph facts only when they
  expose approved graph facts.
- RAG answer facts and citations come from published graph facts plus
  evidence/source chunks. Candidate graph facts are excluded from answer facts
  and citations.
- Search, RAG, graph explorer, and external APIs are read-only with respect to
  graph data. They must not create candidates, change review decisions, or
  publish facts.
- MVP4 P0 quality uses explainable metric groups only. Weighted composite
  quality score, default weights, and cross-metric rollups are P1.
- Vector/similar evidence is P0 as an adapter/fallback contract. Production
  vector DB hardening is P1.
- External APIs are read-only and use MVP4 development auth only. API keys,
  service accounts, quotas, and production security remain MVP5.

## Preserved MVP3 Boundary

MVP4 reuses these MVP3 concepts without changing their contracts:

- `PublishedGraphVersion`
- `PublishedEntity`
- `PublishedRelation`
- `PublishedLineage`
- `EvidenceRef`
- `SourceData`
- `SourceSegment`
- `ValidationResultSeverity`
- `ReviewDecisionType`
- `PublishJob`
- `QualitySummary` v0.1 at `/api/v1/projects/{project_id}/quality/summary`

MVP4 adds richer endpoints beside the MVP3 endpoints rather than changing the
MVP3 response shapes. For example, advanced quality metrics live at
`/api/v1/projects/{project_id}/quality/metrics`, while the MVP3 v0.1 summary
endpoint remains valid.

## Enum Contract

### PM-Frozen MVP4 Enums

`EvaluationDatasetStatus`

```text
DRAFT
ACTIVE
ARCHIVED
```

`GoldenSetItemKind`

```text
ENTITY
RELATION
PROPERTY_VALUE
EVIDENCE_LINK
```

`PromptExperimentStatus`

```text
DRAFT
RUNNING
COMPLETED
CANCELLED
```

### Backend-Drafted MVP4 Enums

`QualityMetricGroup`

```text
COMPLETENESS
CONSISTENCY
TRACEABILITY
VALIDATION
REVIEW
DUPLICATE
RELATION_DENSITY
```

`QualityMetricUnit`

```text
COUNT
RATE
RATIO
PERCENT
```

`SearchResultKind`

```text
PUBLISHED_ENTITY
PUBLISHED_RELATION
SOURCE
SOURCE_CHUNK
EVIDENCE
LINEAGE
```

`VectorAdapterStatus`

```text
AVAILABLE
FALLBACK_KEYWORD
UNAVAILABLE
NOT_CONFIGURED
```

`VectorFallbackReason`

```text
VECTOR_DB_NOT_CONFIGURED
INDEX_NOT_READY
ADAPTER_ERROR
KEYWORD_FALLBACK_USED
```

`RagAnswerState`

```text
ANSWERED
INSUFFICIENT_EVIDENCE
ERROR
```

`RagCitationKind`

```text
EVIDENCE_CHUNK
SOURCE_CHUNK
PUBLISHED_ENTITY
PUBLISHED_RELATION
```

`GraphExploreState`

```text
READY
SAFE_TOO_LARGE
EMPTY
ERROR
```

`ExternalApiAuthMode`

```text
DEV_AUTH
```

## Endpoint Summary

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE4-001 | `GET` | `/api/v1/projects/{project_id}/quality/metrics` | Advanced metric groups with formula metadata and drilldown hints |
| BE4-001 | `GET` | `/api/v1/projects/{project_id}/quality/metrics/{metric_id}` | Single metric detail with breakdown rows |
| BE4-002 | `GET` | `/api/v1/projects/{project_id}/evaluation-datasets` | List evaluation datasets |
| BE4-002 | `POST` | `/api/v1/projects/{project_id}/evaluation-datasets` | Create evaluation dataset draft |
| BE4-002 | `GET` | `/api/v1/evaluation-datasets/{dataset_id}` | Dataset detail |
| BE4-002 | `GET` | `/api/v1/evaluation-datasets/{dataset_id}/versions` | List dataset versions |
| BE4-002 | `POST` | `/api/v1/evaluation-datasets/{dataset_id}/versions` | Create dataset version draft |
| BE4-002 | `GET` | `/api/v1/evaluation-dataset-versions/{dataset_version_id}` | Dataset version detail |
| BE4-002 | `GET` | `/api/v1/evaluation-dataset-versions/{dataset_version_id}/golden-items` | List golden items |
| BE4-002 | `POST` | `/api/v1/evaluation-dataset-versions/{dataset_version_id}/golden-items` | Create golden item draft |
| BE4-003 | `GET` | `/api/v1/projects/{project_id}/evaluation-runs` | List evaluation runs |
| BE4-003 | `POST` | `/api/v1/projects/{project_id}/evaluation-runs` | Create manual evaluation run draft |
| BE4-003 | `GET` | `/api/v1/evaluation-runs/{evaluation_run_id}` | Evaluation run detail |
| BE4-003 | `GET` | `/api/v1/projects/{project_id}/prompt-performance/summary` | Prompt/model performance comparison |
| BE4-003 | `GET` | `/api/v1/projects/{project_id}/prompt-experiments` | List prompt experiments |
| BE4-003 | `POST` | `/api/v1/projects/{project_id}/prompt-experiments` | Create manual prompt experiment |
| BE4-003 | `GET` | `/api/v1/prompt-experiments/{experiment_id}` | Prompt experiment detail |
| BE4-004 | `GET` | `/api/v1/projects/{project_id}/search` | Keyword search grouped by result kind |
| BE4-005 | `GET` | `/api/v1/projects/{project_id}/vector/status` | Vector adapter status and fallback state |
| BE4-005 | `POST` | `/api/v1/projects/{project_id}/similar-evidence` | Similar evidence lookup with adapter/fallback contract |
| BE4-006 | `POST` | `/api/v1/projects/{project_id}/rag/answers` | Grounded RAG answer with citations and insufficient-evidence state |
| BE4-007 | `GET` | `/api/v1/projects/{project_id}/published-graph/explore` | Current or selected published graph n-hop explorer |
| BE4-007 | `GET` | `/api/v1/published-graph/versions/{version_id}/explore` | Version-specific n-hop explorer |
| BE4-007 | `GET` | `/api/v1/published-graph/lineage` | Published fact lineage panel data |
| BE4-008 | `GET` | `/api/v1/external/projects/{project_id}/published-graph/current` | External current published graph snapshot metadata |
| BE4-008 | `GET` | `/api/v1/external/published-graph/entities/{entity_id}` | External published entity lookup |
| BE4-008 | `GET` | `/api/v1/external/published-graph/relations/{relation_id}` | External published relation lookup |
| BE4-008 | `GET` | `/api/v1/external/sources/{source_id}` | External source lookup |
| BE4-008 | `GET` | `/api/v1/external/evidence/{evidence_id}` | External evidence lookup |
| BE4-008 | `GET` | `/api/v1/external/projects/{project_id}/search` | External read-only keyword search |
| BE4-008 | `POST` | `/api/v1/external/projects/{project_id}/rag/answers` | External read-only grounded RAG answer |

## Advanced Quality Metrics

### QualityMetricsResponse

```text
project_id
published_graph_version_ref
generated_at
filters
metric_groups[]
```

### PublishedGraphVersionRef

```text
published_graph_version_id
published_graph_version
ontology_version_id
is_current
created_at
```

Every advanced quality response must include a published graph version ref
when metrics are based on published graph facts.

### QualityMetricGroupResult

```text
group
label
description
metrics[]
```

### QualityMetric

```text
metric_id
group
label
description
unit
value
rate
trend
formula
drilldown
evidence_refs[]
published_graph_version_ref
breakdowns[]
```

`value` is used for count-like metrics. `rate` is used for ratio/rate metrics.
P0 must not require a `composite_score` field.

### QualityFormulaMetadata

P0 required fields:

```text
formula_id
numerator
denominator
scope
time_window
breakdown_dimension
drilldown_target
```

Optional helper fields:

```text
description
unit
notes
```

### QualityDrilldownHint

```text
target
label
query
```

`target` should point to existing or new read surfaces such as
`review_inbox`, `published_graph`, `evidence`, `evaluation_runs`, `search`, or
`quality_metric_detail`. Query objects use the target endpoint field names.

### Required Metric Groups

P0 metric groups:

- completeness
- consistency
- traceability
- validation pass rate
- review approval rate
- duplicate rate
- relation density

## Evaluation Dataset and Golden Set

### EvaluationDataset

```text
id
project_id
name
description
status
owner_id
created_at
updated_at
active_version_id
notes
```

New datasets default to `DRAFT`.

### EvaluationDatasetVersion

```text
id
dataset_id
project_id
version
status
source_refs[]
source_segment_refs[]
candidate_refs[]
evidence_refs[]
golden_item_count
created_by
created_at
notes
```

Dataset versions are project-scoped and should be immutable once used by a
completed evaluation run. Later implementation may model status on dataset
versions separately, but Wave19 keeps it aligned to `EvaluationDatasetStatus`
for the planning draft.

### GoldenSetItem

```text
id
dataset_version_id
project_id
kind
expected_payload
source_refs[]
evidence_refs[]
review_decision_ref
published_graph_version_ref
reviewer_id
created_at
notes
```

Every golden item must preserve provenance through source/evidence refs and
review decision context. `expected_payload` is kind-specific:

- `ENTITY`: canonical name, class id, expected property values.
- `RELATION`: source entity ref, relation id, target entity ref, direction,
  expected properties.
- `PROPERTY_VALUE`: entity or relation ref, property id, expected value.
- `EVIDENCE_LINK`: expected source/evidence link for a fact.

## Evaluation Runs and Prompt/Model Performance

### PromptExperiment

```text
id
project_id
name
hypothesis
status
dataset_id
dataset_version_id
control_prompt_version_id
treatment_prompt_version_id
model_provider
model_name
run_window
created_by
created_at
updated_at
notes
```

P0 supports manual experiment creation and manual run creation. Automated
traffic splitting, scheduling, and online experiment routing are P1.

### EvaluationRun

```text
id
project_id
dataset_version_id
experiment_id
prompt_version_id
model_run_id
model_provider
model_name
status
started_at
ended_at
requested_by
metrics
dimensions
error_code
error_message
```

P0 dimensions:

```text
prompt_version_id
model_run_id
source_type
class_type
relation_type
validation_outcome
review_decision
correction_pattern
```

### PromptPerformanceSummary

```text
project_id
generated_at
filters
comparison_dimensions[]
rows[]
```

### PromptPerformanceRow

```text
prompt_version_id
model_run_id
model_provider
model_name
source_type
class_type
relation_type
validation_outcome
review_decision
correction_pattern
approval_rate
rejection_rate
modification_rate
failed_validation_rate
missing_evidence_rate
latency_ms
token_count
cost
drilldown
```

`latency_ms`, `token_count`, and `cost` are optional P0 fields. They may be
null if the source model run did not capture provider telemetry.

## Keyword Search

### SearchRequest Query Fields

```text
q
scope[]
published_graph_version_id
ontology_version_id
source_id
limit
offset
```

`scope[]` values use `SearchResultKind`. If omitted, P0 default scopes are
published entity, published relation, source/source chunk, evidence, and
lineage.

### SearchResponse

```text
project_id
query
published_graph_version_ref
groups[]
total_count
limit
offset
index_state
```

### SearchResultGroup

```text
kind
total_count
items[]
```

### SearchResultItem

```text
id
kind
title
snippet
score
published_graph_version_ref
source_ref
evidence_refs[]
lineage_ref
metadata
```

Search must preserve source/evidence context for result actions. Search can
return lineage context, but it must not expose candidate facts as approved graph
facts.

## Vector and Similar Evidence

### VectorAdapterState

```text
project_id
status
embedding_target
index_name
indexed_chunk_count
last_indexed_at
fallback_reason
message
```

`status=AVAILABLE` means vector adapter search can run. `FALLBACK_KEYWORD`
means the similar-evidence endpoint can return keyword-backed results.
`UNAVAILABLE` or `NOT_CONFIGURED` means the endpoint should return an explicit
fallback state rather than pretending vector search is active.

### SimilarEvidenceRequest

```text
query
source_segment_id
evidence_id
published_fact_id
published_fact_type
published_graph_version_id
limit
```

At least one of `query`, `source_segment_id`, `evidence_id`, or
`published_fact_id` is required.

### SimilarEvidenceResponse

```text
project_id
adapter_state
fallback_used
items[]
```

### SimilarEvidenceItem

```text
evidence_ref
source_ref
snippet
similarity_score
match_reason
published_graph_version_ref
linked_published_fact_refs[]
```

## Grounded RAG

### RagAnswerRequest

```text
question
published_graph_version_id
scope[]
source_ids[]
max_citations
```

Candidate scope is intentionally absent. Backend must not accept candidate refs
as RAG fact scope in MVP4 P0.

### RagAnswerResponse

```text
project_id
question
state
answer
coverage
published_graph_version_ref
citations[]
linked_published_facts[]
insufficient_evidence
debug
```

`state=INSUFFICIENT_EVIDENCE` returns `answer=null` or a short refusal-style
answer plus `insufficient_evidence` details. Backend must prefer this state over
unsupported claims.

### RagCitation

```text
citation_id
kind
evidence_ref
source_ref
published_fact_ref
quote
snippet
locator
```

### PublishedFactRef

```text
fact_type
fact_id
published_graph_version_id
label
```

`fact_type` values:

```text
PUBLISHED_ENTITY
PUBLISHED_RELATION
```

### InsufficientEvidenceState

```text
reason_code
message
missing_scopes[]
suggested_queries[]
```

Suggested reason codes:

```text
NO_RELEVANT_EVIDENCE
NO_PUBLISHED_FACTS
CITATION_COVERAGE_TOO_LOW
VECTOR_UNAVAILABLE
```

## Advanced Published Graph Explorer

### GraphExploreRequest Query Fields

```text
root_entity_id
published_graph_version_id
max_hops
class_ids[]
relation_ids[]
include_quality_overlay
include_source_overlay
include_lineage
node_budget
edge_budget
```

Defaults:

- `max_hops=2`
- maximum accepted `max_hops=3`
- `node_budget=150`
- `edge_budget=300`

If a request would exceed the budget, Backend returns `state=SAFE_TOO_LARGE`
with estimates and suggested filters instead of returning an unsafe graph.

### GraphExploreResponse

```text
project_id
state
published_graph_version_ref
root_entity_id
max_hops
nodes[]
edges[]
quality_overlays[]
source_overlays[]
lineage_panel
too_large
```

### GraphExploreNode

```text
id
published_entity_id
class_id
label
hop
properties
quality_summary
source_count
evidence_count
lineage_available
```

### GraphExploreEdge

```text
id
published_relation_id
source_node_id
target_node_id
relation_id
label
properties
quality_summary
evidence_count
lineage_available
```

### GraphTooLargeState

```text
estimated_nodes
estimated_edges
node_budget
edge_budget
suggested_filters[]
message
```

### PublishedLineagePanel

```text
fact_ref
published_graph_version_ref
publish_job_id
review_decision_ref
candidate_ref
evidence_refs[]
source_refs[]
ontology_version_id
model_run_id
prompt_version_id
created_at
```

## External Read-Only APIs

External APIs mirror internal read surfaces but are explicitly constrained:

- read-only only;
- MVP4 development auth only;
- no candidate graph fact exposure as approved graph facts;
- every graph fact response includes published graph version context;
- evidence/source refs are preserved for consumer trust.

### ExternalApiEnvelope

```text
auth_mode
project_id
published_graph_version_ref
data
```

`auth_mode` is `DEV_AUTH` in MVP4.

External API paths may reuse the same DTOs as internal read APIs when useful,
wrapped in `ExternalApiEnvelope` or documented as direct read responses.

## Error and State Contract

MVP4 endpoints should use the existing `ApiErrorResponse` envelope where
runtime implementation supports it. Suggested new error/state codes:

```text
QUALITY_METRIC_NOT_FOUND
EVALUATION_DATASET_NOT_FOUND
EVALUATION_DATASET_VERSION_NOT_FOUND
GOLDEN_SET_ITEM_NOT_FOUND
PROMPT_EXPERIMENT_NOT_FOUND
EVALUATION_RUN_NOT_FOUND
SEARCH_SCOPE_UNSUPPORTED
VECTOR_ADAPTER_UNAVAILABLE
RAG_INSUFFICIENT_EVIDENCE
RAG_CANDIDATE_SCOPE_NOT_ALLOWED
GRAPH_EXPLORE_TOO_LARGE
PUBLISHED_GRAPH_VERSION_REQUIRED
PUBLISHED_GRAPH_VERSION_NOT_FOUND
EXTERNAL_API_READ_ONLY
DEV_AUTH_REQUIRED
```

State DTOs must make these product states explicit:

- insufficient evidence for RAG;
- vector unavailable or keyword fallback state;
- safe-too-large graph explorer state;
- empty search result groups;
- stale or selected published graph version context.

## Migration and Model Implications for Wave20

Likely new modules:

- `apps/backend/app/modules/quality/advanced_schemas.py`
- `apps/backend/app/modules/evaluation/models.py`
- `apps/backend/app/modules/evaluation/schemas.py`
- `apps/backend/app/modules/evaluation/router.py`
- `apps/backend/app/modules/search/schemas.py`
- `apps/backend/app/modules/search/router.py`
- `apps/backend/app/modules/rag/schemas.py`
- `apps/backend/app/modules/rag/router.py`
- `apps/backend/app/modules/graph_explorer/schemas.py`
- `apps/backend/app/modules/graph_explorer/router.py`
- `apps/backend/app/modules/external_api/router.py`
- `apps/backend/app/integrations/vector/base.py`
- `apps/backend/app/integrations/vector/mock_or_keyword_adapter.py`

Likely existing modules to touch:

- `apps/backend/app/core/enums.py`
- `apps/backend/app/api/router.py`
- `apps/backend/app/modules/quality/router.py`
- `apps/backend/app/modules/publish/models.py`
- `apps/backend/app/modules/source/models.py`
- `apps/backend/app/modules/candidate/models.py`
- `apps/backend/app/modules/prompt/models.py`
- `apps/backend/app/db/migrations/`

Likely schema changes:

- Add evaluation dataset table.
- Add evaluation dataset version table.
- Add golden set item table.
- Add prompt experiment table.
- Add evaluation run table.
- Add optional evaluation metric result table if metric snapshots should be
  persisted rather than recomputed.
- Add search index metadata table or materialized index state table if keyword
  indexing is not computed live.
- Add vector index metadata table for adapter state, even when the initial
  local adapter is keyword-backed.
- Add indexes on project id, dataset status, dataset version, prompt version,
  model run, published graph version, source/evidence refs, and created time.

Wave20 implementation should add Alembic migrations only after this contract is
accepted by Frontend and QA.

## Deterministic Seed Needs for Wave20

QA and Frontend need deterministic seed data for:

- at least one current published graph version and one non-current selected
  version;
- enough published entities/relations to exercise 1-hop, 2-hop, and
  safe-too-large graph explorer states;
- quality metric groups with known numerator/denominator values;
- source/evidence chunks tied to published facts;
- one evaluation dataset in `DRAFT`, one in `ACTIVE`, and one `ARCHIVED`;
- golden items for all `GoldenSetItemKind` values;
- prompt/model evaluation rows covering approval, rejection, modification,
  failed validation, missing evidence, and correction pattern dimensions;
- keyword search hits for each `SearchResultKind`;
- vector adapter `AVAILABLE`, `FALLBACK_KEYWORD`, and `UNAVAILABLE` fixture
  states;
- one grounded RAG answer and one `INSUFFICIENT_EVIDENCE` answer;
- external read-only API smoke examples under dev auth.

## Non-Goals and P1 Exclusions

- Weighted composite quality score and default metric weights.
- Automated prompt traffic splitting, online A/B scheduling, or provider
  orchestration.
- Production vector DB hardening, scaling, and tuning.
- Candidate graph facts in RAG answer facts or citations.
- Graph mutation from search or RAG.
- Production SSO/RBAC, API key management, service accounts, quotas, and key
  rotation.
- Collaboration/SLA runtime model, comments, due dates, notifications, and SLA
  dashboards.
- Broad MVP4 runtime implementation in Wave19.
