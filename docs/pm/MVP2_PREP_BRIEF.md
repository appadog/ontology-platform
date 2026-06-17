# MVP 2 Prep Brief

## Status

`READY FOR WAVE 6 IMPLEMENTATION KICKOFF / CONTRACT STILL DRAFT`

MVP 2 설계 준비 문서다. Wave 5 기준으로 MVP 1 app acceptance는 통과했고 Docker Compose 검증은 환경 예외로 분리되었다. Wave 6부터 구현을 시작할 수 있지만, 이 문서의 계약은 아직 draft이므로 첫 wave는 계약 hardening과 얇은 end-to-end slice에 집중한다.

## MVP 2 Goal

정형/비정형 데이터를 파싱하고 프로파일링한 뒤, 온톨로지 기준으로 Mock LLM 또는 실제 LLM adapter가 후보 엔티티·관계를 생성한다. 모든 후보는 source/evidence와 연결되어야 한다.

## Entry Criteria

- MVP 1 backend Project/Ontology/Source/OpenAPI smoke PASS.
- MVP 1 frontend actual FE-to-BE source flow smoke PASS.
- MVP 1 ontology authoring actual API smoke PASS.
- MVP 1 dashboard actual API boundary closeout: `/api/v1/dashboard` 호출이 actual API mode에 남아 있지 않음.
- Browser click smoke PASS 또는 manual UAT evidence와 PM 승인 예외가 문서화됨.
- `docs/api/openapi-mvp1.json`이 최신 backend export와 일치.
- MVP 1 UI style foundation 문서 존재.
- Docker Compose/local infra smoke PASS 또는 Docker CLI 부재 같은 환경 blocker가 PM 예외로 분리됨.
- 남은 MVP 1 blocker가 MVP 2 `SourceSegment`, `ExtractionJob`, `ModelRun`, `CandidateEvidence` domain model을 흔들지 않음.

## Implementation Gate

- Wave 6 구현 착수 가능.
- 첫 구현 범위는 SourceSegment/profile/parse, Prompt/ExtractionJob/ModelRun/MockProvider, candidate/evidence scaffold, Frontend mock/API boundary, QA deterministic fixtures로 제한한다.
- Expert review, publish graph, RAG, automatic approval, large distributed processing은 여전히 제외한다.

## MVP 2 Extraction User Flow

1. 사용자가 project 안에서 source를 선택한다.
2. CSV/Excel source는 profile을 실행해 columns, inferred type, null ratio, distinct count, sample values를 확인한다.
3. TXT/PDF source는 parse/chunk를 실행해 page/section/paragraph/chunk segment를 확인한다.
4. 사용자가 ontology version과 prompt version을 선택한다.
5. 사용자가 provider를 선택한다. Wave 6 thin slice의 기본 provider는 `MockProvider`다.
6. 사용자가 extraction job을 생성한다. Job은 `PENDING`으로 생성되고 실행 요청 후 `QUEUED`, `RUNNING`, terminal status로 이동한다.
7. 실행 중 `ModelRun`이 생성되고 masked `raw_request`/`raw_response`와 provider metadata가 저장된다.
8. MockProvider는 deterministic fixture를 사용해 candidate entity/relation과 candidate evidence를 생성한다.
9. 사용자는 extraction job monitor에서 status, progress, failure reason을 확인한다.
10. 사용자는 candidate result view에서 entity/relation 후보와 evidence를 함께 확인한다.

## Enum / Status Source

- `SourceSegment.segment_type`: `SourceSegmentType`.
- `SourceProfileColumn.inferred_type`: `ProfileInferredType`.
- `ExtractionJob.status`: `ExtractionJobStatus`.
- `ModelRun.status`: `ModelRunStatus`.
- Candidate `validation_status`: `ValidationStatus`.
- Candidate `validation_codes[]`: `CandidateValidationCode`.
- Candidate `review_status`: `CandidateReviewStatus`.
- Candidate `publish_status`: `PublishStatus`.

MVP 2에서는 review/publish workflow가 제외 범위이므로 `review_status=PENDING`, `publish_status=NOT_PUBLISHED`를 기본값으로 둔다. review approval, rejection, publishing action은 MVP 3 이후에만 다룬다.

## Evidence Policy

- 정상 candidate는 최소 1개 이상의 `CandidateEvidence`를 가져야 한다.
- Entity candidate evidence는 `source_id`, `source_segment_id`, segment locator, evidence text 또는 structured locator를 포함한다.
- Relation candidate evidence는 relation 자체 evidence를 포함하고, source/target candidate가 각각 evidence를 가져야 한다.
- CSV/Excel evidence는 `SHEET`, `ROW`, `CELL` segment와 `row_index`, `column_name`으로 추적한다.
- TXT/PDF evidence는 `PAGE`, `SECTION`, `PARAGRAPH`, `CHUNK` segment와 `start_offset`, `end_offset`, `evidence_text`로 추적한다.
- Evidence 없는 candidate 저장은 허용하지만 정상 후보가 아니다. raw provider output 보존을 위해서만 저장하며 `validation_status=WARNING`, `validation_codes=["MISSING_EVIDENCE"]`, `publish_status=NOT_PUBLISHED`를 필수로 둔다.
- Evidence 참조가 존재하지만 깨져 있거나 source/segment를 찾을 수 없으면 `validation_status=FAILED`, `validation_codes=["INVALID_EVIDENCE_REFERENCE"]`를 사용한다.
- Schema가 맞지 않는 provider output은 candidate로 정상 노출하지 않고 job 또는 model run failure reason에 기록한다.

## MockProvider Deterministic Fixture Policy

- MockProvider는 외부 LLM credentials, network call, randomness 없이 동작해야 한다.
- 같은 `source_id`, `ontology_version_id`, `prompt_version_id`, fixture id로 실행하면 candidate content와 evidence locator가 동일해야 한다.
- `extraction_job_id`와 `model_run_id`는 실행마다 달라질 수 있지만 fixture-derived candidate natural key는 안정적이어야 한다.
- Fixture는 candidate entity, candidate relation, evidence, validation status/code, confidence를 포함한다.
- Missing fixture는 `ExtractionJobStatus=FAILED`와 machine-readable error code `MOCK_FIXTURE_NOT_FOUND`로 처리한다.
- 일부 candidate만 invalid하면 job은 `PARTIAL_FAILED`가 될 수 있고, valid candidate와 invalid candidate status/code가 함께 저장된다.
- Retry는 같은 fixture를 재사용하며 중복 candidate를 만들지 않도록 backend가 idempotency key 또는 natural key를 사용한다.

## Raw Payload Masking Policy

- `ModelRun.raw_request`와 `ModelRun.raw_response`는 저장 전 masked JSON으로만 보존한다. unmasked provider payload는 DB에 저장하지 않는다.
- 아래 key는 대소문자 구분 없이 redaction 대상이다: `api_key`, `token`, `secret`, `password`, `authorization`, `cookie`, `set_cookie`, `credential`, `access_key`, `secret_key`, `connection_string`, `signed_url`.
- `raw_request`에는 source file 원문 전체를 저장하지 않는다. 필요한 경우 segment id, prompt version id, ontology version id, source metadata, 짧은 excerpt만 저장한다.
- `raw_response`에는 provider output candidate JSON을 저장하되 evidence 원문은 `CandidateEvidence.evidence_text`로 분리하고, 장문 text는 truncate 또는 evidence reference로 대체한다.
- Masked payload에는 `masking_version`과 redaction summary를 남겨 QA가 masking 적용 여부를 확인할 수 있어야 한다.

## Scope

### Backend

- `SourceSegment` 공통 모델.
- CSV/Excel profiling.
- TXT/PDF text extraction and chunking.
- `PromptTemplate`, `PromptVersion`.
- `ExtractionJob`, `ModelRun`.
- LLM provider interface.
- Mock LLM provider.
- Structured output schema validation.
- `CandidateEntity`, `CandidateRelation`, `CandidateEvidence`.
- Extraction job status lifecycle.

### Frontend

- Source profiling view.
- Document chunk viewer.
- Extraction job creation view.
- Extraction job monitoring view.
- Candidate entity/relation result view.
- Evidence viewer.

### PM

- Extraction user flow.
- LLM output JSON schema.
- Evidence policy.
- Candidate status policy.
- Failure/retry policy.
- Mock provider acceptance criteria.

### QA

- Profiling contract review.
- Chunk/evidence traceability checks.
- Mock LLM deterministic fixture checks.
- Extraction job status transition checks.

## Non-goals

- Expert review workflow.
- Publish graph API.
- Quality score dashboard beyond basic extraction statistics.
- RAG.
- Automatic approval.
- Large distributed processing.

## Key Product Rules

- LLM output never goes directly to published graph.
- Candidate entity/relation/property value must retain source/evidence.
- `ontology_version_id`, `prompt_version_id`, `model_run_id`, execution timestamp, status, and raw payload must be persisted.
- Mock provider is required so local development and QA do not depend on external LLM credentials.

## Suggested Milestones

1. MVP2-A: SourceSegment + profiling/chunking contract.
2. MVP2-B: Prompt/ModelRun/ExtractionJob contract.
3. MVP2-C: Mock LLM provider + candidate/evidence persistence.
4. MVP2-D: Frontend profiling/chunk/extraction monitor screens.
5. MVP2-E: Integration QA with deterministic fixtures.

## Open Decisions

- CSV/Excel profile storage granularity.
- PDF parsing library choice.
- Chunking defaults: chunk size, overlap, metadata.
- Candidate confidence scale.

## Wave 6 Resolved Decisions

- Mock LLM fixture format is deterministic provider output with `candidate_entities[]`, `candidate_relations[]`, and `evidence[]`, using stable client IDs.
- Actual external LLM provider is not required for Wave 6. Any real provider integration remains optional follow-up behind environment configuration after MockProvider passes QA.
