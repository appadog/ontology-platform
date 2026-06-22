# MVP 6 Prep Brief

Status: `FROZEN / WAVE 28 PM DECISION`
Date: 2026-06-20

MVP 6 is the productization and advanced knowledge-operations phase described
in `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`. Wave28 does not open
the whole MVP6 roadmap. The approved scope is the smallest MVP6.1 Gold Set /
Benchmark Studio thin slice that lets the team measure extraction quality
deterministically before investing in learning loops, governance, agents,
connectors, or multi-tenant runtime.

## MVP6 Entry Conditions

- MVP1 through MVP5 P0 closeout decisions remain accepted.
- Candidate graph and published graph separation remains mandatory.
- LLM, evaluation, and agent-derived outputs cannot mutate the published graph.
- Candidate, gold, and evaluation records must keep source evidence plus
  ontology, prompt, parser, and model/run version context where applicable.
- Docker/PostgreSQL compose and broader Playwright formalization remain P1
  environment/tooling follow-ups unless commander promotes them.

## MVP6.1 Goal

Enable this deterministic happy path:

```text
create evaluation dataset
-> add sample
-> add gold entity
-> add gold relation
-> run deterministic evaluation
-> view precision/recall/F1 metrics and error cases
```

The evaluation run uses deterministic mock predictions in Wave28. It does not
call a real LLM provider and does not start fine-tuning, active learning, or
governance automation.

## Wave28 Same-Wave Implementation Decision

Backend and Frontend may implement the MVP6.1 P0 thin slice in Wave28 after
reading this brief and `docs/handoffs/wave-028/PM_REPORT.md`.

Implementation must stay additive under `/api/v1`, follow existing local seed
and mock-first patterns, and must not alter MVP1-MVP5 closed behavior.

## P0 Scope

### Evaluation Dataset

- Project-scoped dataset list, detail, and create.
- Dataset status uses existing-compatible literals:
  - `DRAFT`
  - `ACTIVE`
  - `ARCHIVED`
- P0 may keep dataset versioning simple with a single current snapshot id or
  dataset version field. Full dataset revision workflow is P1.

### Evaluation Sample

- Add and list samples under a dataset.
- Samples may reference existing source/source segment metadata or contain a
  manual deterministic snippet. No parser rebuild is required.
- Required traceability fields: `project_id`, `dataset_id`, `sample_kind`,
  `content_text` or source locator, and `created_at`.
- `EvaluationSampleKind` P0 literals:
  - `SOURCE_SEGMENT`
  - `MANUAL_TEXT`
  - `TABLE_ROW`

### Gold Entity and Gold Relation

- Add and list gold entities under a dataset.
- Add and list gold relations under a dataset.
- Every gold entity and relation must include evidence context:
  `sample_id`, source/source segment when available, locator or offset, and
  evidence quote where available.
- Gold relation direction is explicit through `source_gold_entity_id` and
  `target_gold_entity_id`; no inverse inference is required in P0.

### Deterministic Evaluation Run

- Create/list/detail evaluation runs for a project.
- P0 run mode is `DETERMINISTIC_MOCK`.
- Required run context:
  - `project_id`
  - `dataset_id`
  - `ontology_version_id`
  - `prompt_version_id`
  - `model_name`
  - `model_run_id`
  - `parser_version`
- For Wave28, `model_name` may be `deterministic-mock` and `model_run_id` may be
  a deliberate mock equivalent tied to the run id.
- Run statuses:
  - `PENDING`
  - `RUNNING`
  - `SUCCEEDED`
  - `FAILED`

### Metrics

P0 metrics are limited to:

- `ENTITY_PRECISION`
- `ENTITY_RECALL`
- `ENTITY_F1`
- `RELATION_PRECISION`
- `RELATION_RECALL`
- `RELATION_F1`
- `RELATION_DIRECTION_ACCURACY`
- `EVIDENCE_MATCH_RATE`

Metric DTOs must expose `value`, `numerator`, `denominator`, `formula`, and
`status`. If a denominator is zero, return `status: NOT_APPLICABLE` and
`value: null`; do not display zero as if it were measured performance.

### Error Cases

- List/detail error cases for an evaluation run.
- Error cases must show candidate-vs-gold context, sample/evidence context, and
  error type.
- P0 `EvaluationErrorType` literals:
  - `MISSING_ENTITY`
  - `EXTRA_ENTITY`
  - `WRONG_ENTITY_CLASS`
  - `MISSING_RELATION`
  - `EXTRA_RELATION`
  - `WRONG_RELATION_TYPE`
  - `WRONG_RELATION_DIRECTION`
  - `EVIDENCE_MISMATCH`

## Minimal API Contract

Backend may refine names to match local router conventions, but the selected
surface must remain semantically equivalent and appear in OpenAPI.

```text
GET  /api/v1/projects/{project_id}/evaluation-datasets
POST /api/v1/projects/{project_id}/evaluation-datasets
GET  /api/v1/evaluation-datasets/{dataset_id}

GET  /api/v1/evaluation-datasets/{dataset_id}/samples
POST /api/v1/evaluation-datasets/{dataset_id}/samples

GET  /api/v1/evaluation-datasets/{dataset_id}/gold-entities
POST /api/v1/evaluation-datasets/{dataset_id}/gold-entities
GET  /api/v1/evaluation-datasets/{dataset_id}/gold-relations
POST /api/v1/evaluation-datasets/{dataset_id}/gold-relations

GET  /api/v1/projects/{project_id}/evaluation-runs
POST /api/v1/projects/{project_id}/evaluation-runs
GET  /api/v1/evaluation-runs/{run_id}
GET  /api/v1/evaluation-runs/{run_id}/metrics
GET  /api/v1/evaluation-runs/{run_id}/errors
GET  /api/v1/evaluation-error-cases/{error_case_id}
```

## Minimal DTO Contract

### EvaluationDataset

```text
id
project_id
name
description
status
sample_count
gold_entity_count
gold_relation_count
created_at
updated_at
```

### EvaluationSample

```text
id
project_id
dataset_id
sample_kind
source_id
source_segment_id
source_locator
title
content_text
metadata
created_at
```

### GoldEvidenceRef

```text
sample_id
source_id
source_segment_id
locator
offset_start
offset_end
quote
```

### GoldEntity

```text
id
project_id
dataset_id
sample_id
ontology_class_id
label
normalized_value
evidence
created_at
```

### GoldRelation

```text
id
project_id
dataset_id
sample_id
ontology_relation_id
source_gold_entity_id
target_gold_entity_id
evidence
created_at
```

### EvaluationRun

```text
id
project_id
dataset_id
status
run_mode
ontology_version_id
prompt_version_id
model_name
model_run_id
parser_version
started_at
completed_at
metric_summary
```

### EvaluationMetric

```text
run_id
metric_name
value
numerator
denominator
formula
status
computed_at
```

### EvaluationErrorCase

```text
id
run_id
project_id
dataset_id
sample_id
error_type
gold_entity_id
gold_relation_id
candidate_ref
comparison_summary
gold_evidence
candidate_evidence
created_at
```

## Metric Matching Rules

- Entity match: same `sample_id`, same `ontology_class_id`, and deterministic
  normalized label/value match.
- Relation match: matched source entity, matched target entity, and same
  `ontology_relation_id`.
- Direction accuracy: relation type and endpoint pair exist, then source/target
  direction is correct.
- Evidence match: candidate evidence overlaps the gold evidence locator or
  quote within the same sample/source segment.
- F1: `2 * precision * recall / (precision + recall)`, with
  `NOT_APPLICABLE` when precision and recall are not measurable.

## P1 Scope

- Dataset revision history and compare.
- Gold evidence as a first-class editable object.
- Import/export of gold sets.
- Model/prompt comparison board across multiple runs.
- Relation-type matrix and confusion matrix.
- Class classification accuracy.
- Ontology constraint pass rate for benchmark runs.
- Benchmark filters by source type, relation type, class, prompt, model, and
  ontology version.

## P2 / Later Scope

- Real LLM benchmark execution.
- Fine-tuning dataset export and retraining workflow.
- Active Learning and Learning Insights.
- Ontology Governance workflow and impact simulation.
- Agentic Knowledge Operations and Copilot.
- Connector/plugin SDK.
- Multi-domain and multi-tenant runtime.
- Ontology Pack/domain template marketplace.
- Advanced knowledge storytelling.

## Exclusions for Wave28

- No real LLM benchmark provider call.
- No fine-tuning or training dataset export.
- No active learning, correction-pattern mining, or prompt suggestion engine.
- No ontology governance approval workflow or impact simulation.
- No copilot, agent action runtime, or autonomous task execution.
- No connector/plugin SDK or external connector runtime.
- No multi-tenant runtime or tenant isolation implementation.
- No mutation of candidate review, publish, or published graph paths.

## Safety Principles

- Gold sets are evaluation artifacts, not published graph facts.
- Evaluation output is read-only analysis and cannot approve or publish
  candidates.
- Every gold item and error case keeps evidence context.
- Every run keeps ontology, prompt, parser, model, and run context.
- Deterministic mock runs must be reproducible from seed data and request body.
- Frontend must show loading, empty, error, and no-data states without implying
  unmeasured performance.

## Wave29 Hardening Decision

Status: `FROZEN / WAVE 29 PM DECISION`
Date: 2026-06-22

Wave29 is MVP6.1 targeted hardening only. It closes reproducibility and DTO
alignment gaps from Wave28 before any MVP6.2 planning or runtime expansion.

Hardening scope:

- `smoke:mvp6:actual` acceptance criteria and reproducibility.
- Frontend `EvaluationErrorCase.candidate_ref` alignment with Backend
  `EvaluationCandidateRef`.
- process-local runtime store closeout decision.

Persistence decision:

- The process-local evaluation runtime store is allowed for MVP6.1 closeout
  when actual API smoke creates or seeds all data it reads in the same running
  backend process.
- Backend may add a minimal dev-only reset/seed helper only if repeated actual
  smoke cannot otherwise be made deterministic.
- Durable DB models and Alembic persistence remain P1/P2 and are not promoted
  in Wave29.

Frontend DTO decision:

- `EvaluationErrorCase.candidate_ref` must use an MVP6-specific
  `EvaluationCandidateRef` shape, not the narrower generic `CandidateRef`.
- Required match fields are `candidate_id`, `candidate_kind`, `sample_id`,
  optional ontology class/relation ids, label/value fields, relation endpoint
  ids, and optional `GoldEvidenceRef` evidence.

Frontend style note:

- The user's Product Showcase styled-components guide should be treated as an
  input for future MVP6 frontend productization/hardening.
- Before implementation, copy or distill it into a repo-owned PM/UX document,
  preferably `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md`, so agents do not depend
  on a local Downloads path.
- Wave29 does not open a full visual redesign; only targeted actual smoke and
  DTO/display hardening are in scope.

Wave29 exclusions:

- Active Learning.
- Ontology governance workflow.
- Impact simulation.
- Copilot/agent runtime.
- Connector/plugin SDK.
- Multi-tenant runtime.
- Ontology packs/domain template marketplace.
- Advanced visualization/storytelling.
- Real LLM benchmark provider execution.
