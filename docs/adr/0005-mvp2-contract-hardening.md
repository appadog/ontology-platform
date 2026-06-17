# ADR 0005: MVP 2 Contract Hardening

## Status

Accepted

## Context

Wave 5 closed MVP 1 app acceptance with an accepted Docker environment exception. Wave 6 may begin MVP 2, but only as contract hardening plus the first thin slice. Backend, Frontend, and QA need the same enum, status, evidence, deterministic fixture, and raw payload masking rules before implementation expands.

MVP 2 remains limited to parsing/profiling, prompt/model-run/extraction job scaffolding, MockProvider, and candidate/evidence persistence. Expert review, publish graph, RAG, automatic approval, and large distributed processing remain out of scope.

## Decision

- `SourceSegment.segment_type` uses `SourceSegmentType`: `SHEET`, `ROW`, `CELL`, `PAGE`, `SECTION`, `PARAGRAPH`, `CHUNK`.
- `SourceProfileColumn.inferred_type` uses `ProfileInferredType`, not `PropertyDataType` directly.
- `ExtractionJob.status` uses `ExtractionJobStatus`; `ModelRun.status` uses `ModelRunStatus`.
- Candidate status fields use existing shared sources:
  - `validation_status`: `ValidationStatus`
  - `validation_codes[]`: `CandidateValidationCode`
  - `review_status`: `CandidateReviewStatus`
  - `publish_status`: `PublishStatus`
- MVP 2 does not implement review or publish workflow. Candidates default to `review_status=PENDING` and `publish_status=NOT_PUBLISHED`.
- Normal candidates must have at least one `CandidateEvidence`.
- Candidates without evidence may be stored only as warning/debug records with `validation_status=WARNING`, `validation_codes=["MISSING_EVIDENCE"]`, and `publish_status=NOT_PUBLISHED`.
- Broken evidence references use `validation_status=FAILED` and `validation_codes=["INVALID_EVIDENCE_REFERENCE"]`.
- MockProvider must be deterministic: same source, ontology version, prompt version, fixture id, and fixture content produce the same candidate content and evidence locators.
- `ModelRun.raw_request` and `ModelRun.raw_response` are masked JSON by contract. Unmasked provider payloads, secrets, API keys, tokens, signed URLs, and full source files are not persisted.

## Consequences

- Backend can implement Wave 6 thin slice without inventing enum names or status values.
- Frontend can build mock/API boundary against the same enum strings and evidence shape.
- QA can assert deterministic fixture behavior, missing evidence warning behavior, broken evidence failure behavior, and raw payload masking.
- Candidate review and publish UI/API must not be introduced in Wave 6.

## Follow-up

- Backend: export MVP 2 OpenAPI draft after implementing the thin slice and keep enum names aligned with `docs/pm/GLOSSARY.md`.
- Frontend: use these enum strings at `shared/api` boundary and avoid local enum aliases.
- QA: add contract checks for `SourceSegmentType`, `ProfileInferredType`, job/model status lifecycles, evidence policy, MockProvider determinism, and raw payload masking.
