# API Contract Priority MVP 2 Draft

Status: `READY FOR WAVE 6 IMPLEMENTATION KICKOFF / CONTRACT STILL DRAFT`

This document is still a contract draft, but Wave 5 closed MVP 1 app acceptance with an accepted Docker environment exception. Wave 6 may implement thin slices from this contract while reporting any enum, DTO, status lifecycle, evidence, or privacy issue before expanding scope.

Wave 7 is a contract sync closeout wave. It keeps backend runtime shape stable and aligns Frontend actual API mode to `docs/api/openapi-mvp2-draft.json`; it does not open candidate detail drawer, evidence highlight, advanced PDF parsing, external LLM provider, review/publish, or RAG scope.

## MVP 2 API Entry Gate

- MVP 1 `docs/api/openapi-mvp1.json` is fresh and remains the canonical MVP 1 artifact.
- MVP 1 `/api/v1/dashboard` exclusion is closed on the Frontend actual API boundary; Backend does not add the endpoint.
- MVP 1 `INT-001`, `INT-002`, and `INT-003` are PASS or PM-approved exceptions.
- Source upload/preview and ontology authoring actual FE-to-BE smoke evidence exists.
- Browser click smoke or manual UAT evidence exists for the MVP 1 demo flow.
- Any remaining MVP 1 blocker is documented as not changing MVP 2 SourceSegment, ExtractionJob, ModelRun, CandidateEvidence, or candidate graph assumptions.

## P0 Domains

| Priority | Domain | Purpose |
|---|---|---|
| P0 | SourceSegment | profiling, chunking, evidence anchor |
| P0 | SourceProfile | CSV/Excel profiling |
| P0 | PromptTemplate / PromptVersion | extraction prompt versioning |
| P0 | ExtractionJob | job creation and status monitoring |
| P0 | ModelRun | provider/model/prompt/version execution metadata |
| P0 | Mock LLM Provider | deterministic local extraction |
| P0 | CandidateEntity / CandidateRelation / CandidateEvidence | candidate graph persistence |

## Provider Literal / Display Split

MVP 2 thin slice provider API literal is `mock`.

```text
API request/response value: mock
UI display label: MockProvider
```

`MockProvider` is not accepted as a provider API value in Wave 7. Frontend must send `provider: "mock"` in `ExtractionJobCreateRequest`; it may display `MockProvider` in labels, chips, and selects.

## MVP 2 Enum Binding

| Field | Enum source |
|---|---|
| `SourceSegment.segment_type` | `SourceSegmentType` |
| `SourceProfileColumn.inferred_type` | `ProfileInferredType` |
| `ExtractionJob.status` | `ExtractionJobStatus` |
| `ModelRun.status` | `ModelRunStatus` |
| `CandidateEntity.validation_status`, `CandidateRelation.validation_status` | `ValidationStatus` |
| `CandidateEntity.validation_codes[]`, `CandidateRelation.validation_codes[]` | `CandidateValidationCode` |
| `CandidateEntity.review_status`, `CandidateRelation.review_status` | `CandidateReviewStatus` |
| `CandidateEntity.publish_status`, `CandidateRelation.publish_status` | `PublishStatus` |

MVP 2에서는 review/publish workflow를 구현하지 않는다. Candidate `review_status`는 기본 `PENDING`, `publish_status`는 기본 `NOT_PUBLISHED`이며, 승인/게시 action은 MVP 3 범위다.

## Endpoint Draft

### Source Profiling / Segments

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/sources/{source_id}/profile` | structured source profiling 실행 |
| GET | `/api/v1/sources/{source_id}/profile` | profile result 조회 |
| POST | `/api/v1/sources/{source_id}/parse` | document parsing/chunking 실행 |
| GET | `/api/v1/sources/{source_id}/segments` | source segment/chunk 목록 조회 |

`POST /api/v1/sources/{source_id}/parse` returns `SourceParseResponse`. It does not return `SourceSegment[]`. Use `GET /api/v1/sources/{source_id}/segments` to fetch the parsed segment list.

### Prompt

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/projects/{project_id}/prompts` | prompt template 목록 |
| POST | `/api/v1/projects/{project_id}/prompts` | prompt template 생성 |
| GET | `/api/v1/prompts/{prompt_id}/versions` | prompt version 목록 |
| POST | `/api/v1/prompts/{prompt_id}/versions` | prompt version 생성 |

### Extraction

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/projects/{project_id}/extraction-jobs` | extraction job 생성 |
| GET | `/api/v1/projects/{project_id}/extraction-jobs` | extraction job 목록 |
| GET | `/api/v1/extraction-jobs/{job_id}` | extraction job 상세 |
| POST | `/api/v1/extraction-jobs/{job_id}/run` | local/mock extraction 실행 |
| POST | `/api/v1/extraction-jobs/{job_id}/retry` | failed job retry |

### Candidate

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/extraction-jobs/{job_id}/candidates/entities` | candidate entity 목록 |
| GET | `/api/v1/extraction-jobs/{job_id}/candidates/relations` | candidate relation 목록 |
| GET | `/api/v1/candidate-evidence/{evidence_id}` | evidence 상세 |

Candidate list endpoints must support `limit`, `offset`, `source_id`, `ontology_version_id`, `validation_status`, and `has_evidence` query filters before the contract is considered ready for FE actual API mode.

Wave 7 keeps candidate list response shape as plain arrays: `CandidateEntity[]` and `CandidateRelation[]`. Do not introduce `CandidateEntityListResponse` or `CandidateRelationListResponse` wrappers in this sync wave. `limit`/`offset` are request parameters only; `total_count` and cursor metadata are deferred until a later pagination hardening wave.

## Key DTO Draft

### SourceSegment

```text
id
source_id
segment_type
sequence
row_index
column_name
page_number
section_title
paragraph_index
chunk_index
text
metadata
created_at
```

`segment_type` uses `SourceSegmentType`.

### SourceProfile

```text
id
source_id
columns[]
row_count
sample_size
warnings[]
created_at
```

### SourceProfileColumn

```text
name
inferred_type
nullable
null_ratio
distinct_count_sampled
sample_values[]
candidate_key_score
```

`inferred_type` uses `ProfileInferredType`.

### SourceParseResponse

```text
source_id
segment_count
segment_types[]
warnings[]
```

`segment_types[]` uses `SourceSegmentType`. This response is a parse summary. It intentionally omits `segments[]` so large parsed source payloads are fetched through `GET /api/v1/sources/{source_id}/segments`.

### PromptTemplate

```text
id
project_id
name
description
created_at
updated_at
```

`active_version_id` is not part of the MVP 2 API DTO. Frontend may compute active display state from `PromptVersion.is_active`.

### PromptVersion

```text
id
prompt_template_id
version
template
output_schema
is_active
created_at
created_by
```

`status`, `prompt_id`, and `prompt_text` are not MVP 2 API fields. Frontend uses `prompt_template_id`, `template`, and `is_active`.

### ExtractionJobCreateRequest

```text
source_id
ontology_version_id
prompt_version_id
provider
model_name
fixture_id
```

`provider` defaults to `mock` and only accepts `mock` in the MVP 2 thin slice. `fixture_id` is optional and defaults to `default`.

### ExtractionJob

```text
id
project_id
source_id
ontology_version_id
prompt_version_id
provider
model_name
fixture_id
status
progress
created_at
started_at
ended_at
error_code
error_message
retry_of_job_id
```

`status` uses `ExtractionJobStatus`. Basic lifecycle:

```text
PENDING -> QUEUED -> RUNNING -> SUCCESS
PENDING -> QUEUED -> RUNNING -> PARTIAL_FAILED
PENDING -> QUEUED -> RUNNING -> FAILED
FAILED/PARTIAL_FAILED -> RETRYING -> QUEUED -> RUNNING
```

Retry behavior:

- `POST /api/v1/extraction-jobs/{job_id}/retry` creates a new `ExtractionJob` with `retry_of_job_id` pointing to the source job.
- The no-duplicate natural key scope is the full retry chain, not only a single job.
- The retry root is the oldest ancestor whose `retry_of_job_id` is null.
- Candidate natural key: `retry_root_job_id`, `provider`, `fixture_id`, `source_id`, `ontology_version_id`, `prompt_version_id`, candidate kind (`entity` or `relation`), and provider stable `client_candidate_id`.
- If the provider output lacks `client_candidate_id`, MockProvider thin slice derives it from fixture id, candidate kind, and provider output index.
- Evidence natural key: `retry_root_job_id`, `provider`, `fixture_id`, `source_id`, `source_segment_id`, provider stable `client_evidence_id` or deterministic segment locator.
- A retry must not create duplicate candidate/evidence records for the same retry-chain natural key. It should reuse or upsert the existing natural key record, or otherwise make duplicates invisible to list responses.

### ModelRun

```text
id
extraction_job_id
provider
model_name
prompt_version_id
ontology_version_id
input_token_count
output_token_count
cost_estimate
raw_request
raw_response
masking_version
redaction_summary
status
started_at
ended_at
```

`status` uses `ModelRunStatus`. `raw_request` and `raw_response` are masked JSON objects by contract; unmasked provider payloads must not be persisted.

### CandidateEntity

```text
id
project_id
source_id
source_segment_id
ontology_version_id
model_run_id
prompt_version_id
class_id
entity_name
normalized_name
property_values
confidence
evidence_ids[]
raw_payload
validation_status
validation_codes[]
review_status
publish_status
created_at
```

### CandidateRelation

```text
id
project_id
source_id
source_segment_id
ontology_version_id
model_run_id
prompt_version_id
source_candidate_entity_id
relation_id
target_candidate_entity_id
confidence
evidence_ids[]
raw_payload
validation_status
validation_codes[]
review_status
publish_status
created_at
```

### CandidateEvidence

```text
id
source_id
source_segment_id
source_type
file_name
sheet_name
row_index
column_name
page_number
section_title
paragraph_id
chunk_id
evidence_text
start_offset
end_offset
metadata
```

`source_segment_id` is required for normal evidence. For structured sources, `row_index` and `column_name` locate row/cell evidence. For text sources, `page_number`, `section_title`, `paragraph_id`, `chunk_id`, `start_offset`, and `end_offset` locate the text span.

## LLM / MockProvider Output JSON Shape

Provider output is normalized into this shape before persistence:

```text
candidate_entities[]
candidate_relations[]
evidence[]
```

Each candidate entity includes:

```text
client_candidate_id
class_id
entity_name
normalized_name
property_values
confidence
evidence_refs[]
```

Each candidate relation includes:

```text
client_candidate_id
source_client_candidate_id
relation_id
target_client_candidate_id
confidence
evidence_refs[]
```

Each evidence item includes:

```text
client_evidence_id
source_id
source_segment_id
row_index
column_name
page_number
section_title
paragraph_id
chunk_id
evidence_text
start_offset
end_offset
```

Backend maps `client_candidate_id` and `client_evidence_id` to persistent IDs. MockProvider fixtures must use stable client IDs so repeated runs are deterministic.

## Evidence Policy

- Normal candidate entities and relations must have at least one `CandidateEvidence`.
- Entity evidence must identify the source segment or structured row/cell that supports the entity.
- Relation evidence must identify the source segment or span that supports the relation and the endpoint candidates must also have evidence.
- A candidate without evidence may be persisted only to preserve provider output for debugging/QA. It must have `validation_status=WARNING`, `validation_codes=["MISSING_EVIDENCE"]`, `evidence_ids=[]`, and `publish_status=NOT_PUBLISHED`.
- A candidate with a broken source/evidence reference must have `validation_status=FAILED` and `validation_codes=["INVALID_EVIDENCE_REFERENCE"]`.
- `validation_status=PASSED` requires valid evidence references and schema-conformant candidate fields.
- Wave 7 requires a deterministic fixture or backend test hook that can produce `INVALID_EVIDENCE_REFERENCE` without opening review/publish/RAG scope. Preferred fixture id: `invalid_evidence_reference`.

## MockProvider Determinism

- MockProvider must not call external networks or require provider credentials.
- The same source, ontology version, prompt version, fixture id, and fixture content must produce the same candidate content and evidence locators.
- `extraction_job_id` and `model_run_id` may differ per run, but fixture-derived candidate natural keys must be stable.
- Missing fixture produces `ExtractionJob.status=FAILED` with `error_code=MOCK_FIXTURE_NOT_FOUND`.
- Invalid evidence fixture produces at least one persisted candidate with `validation_status=FAILED`, `validation_codes=["INVALID_EVIDENCE_REFERENCE"]`, and a broken or unresolved evidence/source segment reference. This fixture exists for contract/QA smoke only and must not be exposed as a product workflow.
- Partially invalid fixture output produces `ExtractionJob.status=PARTIAL_FAILED` with valid candidates persisted and invalid candidates marked with validation status/code.
- Retry must not duplicate candidates for the same retry-chain natural key.

## Raw Payload Masking

- `ModelRun.raw_request` and `ModelRun.raw_response` are masked JSON by definition.
- Keys matching `api_key`, `token`, `secret`, `password`, `authorization`, `cookie`, `set_cookie`, `credential`, `access_key`, `secret_key`, `connection_string`, or `signed_url` are redacted case-insensitively.
- `raw_request` stores IDs and metadata, not full source file content. Long excerpts must be truncated or replaced by source segment references.
- `raw_response` stores normalized provider output and masking metadata. Evidence text belongs in `CandidateEvidence.evidence_text`; long source text should not be duplicated in raw payloads.
- `masking_version` and `redaction_summary` must be present when raw payload fields are stored.

## Required MVP 2 Rules

- MockProvider is required.
- Extraction must be pinned to `ontology_version_id`.
- Candidate output must retain `prompt_version_id` and `model_run_id`.
- LLM output must never write directly to the published graph.
- Candidate entity/relation/property value records must retain source/evidence references.
- Candidates without evidence may be stored only with validation warning and must not be considered ready for review or publish.
- Candidate list endpoints require pagination and project/source/ontology_version/status filters before FE actual API mode is considered ready.
