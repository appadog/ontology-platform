# MVP 2 Prep Brief

## Status

`DRAFT / DESIGN REVIEW ONLY / DO NOT IMPLEMENT UNTIL MVP 1 ACCEPTANCE CLOSEOUT`

MVP 2 설계 준비 문서다. Wave 5 기준으로 이 문서는 architecture/design review까지만 허용하며, backend endpoint, migration, frontend route, worker, dependency 추가 같은 구현 지시는 내리지 않는다. 구현 착수 조건은 MVP 1 `INT-001`, `INT-002`, `INT-003`이 PASS 또는 PM 승인 예외 상태가 되는 것이다.

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

## Implementation Hold

- MVP 2 구현은 위 entry criteria가 충족되거나 총괄/PM이 명시 예외를 승인하기 전까지 시작하지 않는다.
- MVP 2 draft 문서 보완, 용어/DTO 검토, 위험 식별, acceptance 초안 정리는 가능하다.
- Backend/Frontend/QA에게 MVP 2 코드 작성, migration 생성, endpoint 추가, UI route 추가를 지시하지 않는다.

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
- Mock LLM fixture format.
- Whether actual LLM provider is required in MVP 2 or optional behind env var.
