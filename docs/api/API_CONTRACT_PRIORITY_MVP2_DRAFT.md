# API Contract Priority MVP 2 Draft

Status: `DRAFT / DESIGN REVIEW ONLY / DO NOT IMPLEMENT UNTIL MVP 1 ACCEPTANCE CLOSEOUT`

This document is a contract draft for review only. It must not trigger backend endpoint implementation, database migration, frontend route work, worker setup, or provider integration until MVP 1 acceptance closeout is PASS or explicitly excepted by PM/Commander.

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

## Endpoint Draft

### Source Profiling / Segments

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/sources/{source_id}/profile` | structured source profiling 실행 |
| GET | `/api/v1/sources/{source_id}/profile` | profile result 조회 |
| POST | `/api/v1/sources/{source_id}/parse` | document parsing/chunking 실행 |
| GET | `/api/v1/sources/{source_id}/segments` | source segment/chunk 목록 조회 |

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

## Key DTO Draft

### SourceSegment

```text
id
source_id
segment_type
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

### SourceProfile

```text
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
null_ratio
distinct_count
sample_values[]
candidate_key_score
```

### ExtractionJob

```text
id
project_id
source_id
ontology_version_id
prompt_version_id
provider
model_name
status
progress
created_at
started_at
ended_at
error_message
```

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
status
started_at
ended_at
```

### CandidateEntity

```text
id
project_id
source_id
source_segment_id
ontology_version_id
model_run_id
class_id
entity_name
normalized_name
confidence
raw_payload
validation_status
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
source_candidate_entity_id
relation_id
target_candidate_entity_id
confidence
evidence_id
raw_payload
validation_status
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

## Required MVP 2 Rules

- MockProvider is required.
- Candidates without evidence may be stored only with validation warning.
- Extraction must be pinned to `ontology_version_id`.
- Candidate output must retain `prompt_version_id` and `model_run_id`.
- LLM output must never write directly to the published graph.
- Candidate entity/relation/property value records must retain source/evidence references.
- `SourceSegment.segment_type` enum must be fixed before implementation. Draft candidates include row/cell/page/section/paragraph/chunk/table-oriented segments, but the MVP 2 subset is not locked yet.
- `SourceProfileColumn.inferred_type` must either reuse MVP 1 `PropertyDataType` or define a separate profiling enum before FE/BE implementation.
- `ExtractionJob.status` must bind to a glossary/API enum before implementation.
- Missing evidence policy must be explicit: if storage is allowed, the candidate must carry a validation warning/failure status and machine-readable reason.
- `ModelRun.raw_request` and `raw_response` require secret/PII masking rules before persistence.
- Candidate list endpoints require pagination and likely project/source/ontology_version filters before the contract is considered implementation-ready.
