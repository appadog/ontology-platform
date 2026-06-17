# MVP 2 Draft Backlog

Status: `READY FOR WAVE 6 IMPLEMENTATION KICKOFF / CONTRACT STILL DRAFT`

This backlog is now eligible for Wave 6 implementation kickoff. The contract is still draft, so Wave 6 must keep implementation thin and report any enum, DTO, job lifecycle, evidence, or privacy issue before expanding scope.

## MVP 2 Entry Gate

- [x] MVP 1 `INT-001`, `INT-002`, and `INT-003` are PASS or explicitly accepted as PM exceptions.
- [x] `/api/v1/dashboard` has been removed from Frontend actual API mode or isolated as mock-only/P1 boundary. Backend does not add the endpoint for MVP 1.
- [x] Source upload/list/detail/preview actual FE-to-BE smoke is PASS.
- [x] Ontology draft/class/property/relation actual API smoke is PASS.
- [x] Browser click smoke is PASS, or manual UAT evidence plus not-run reason is accepted by PM.
- [x] `docs/api/openapi-mvp1.json` remains the canonical and fresh MVP 1 OpenAPI artifact.
- [x] Remaining MVP 1 blockers do not change MVP 2 source/evidence/extraction/candidate domain assumptions.
- [x] Docker/local infra status is either PASS or documented as an accepted environment exception.

## PM Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| PM2-001 | P0 | PM | Extraction user flow | MVP1 acceptance | source 선택 → profile/parse → ontology/prompt 선택 → job 생성/실행 → monitor → candidate/evidence 확인 흐름이 `docs/pm/MVP2_PREP_BRIEF.md`에 정의됨 |
| PM2-002 | P0 | PM | LLM output JSON schema | PM2-001 | candidate entity/relation/evidence JSON shape, evidence ids, validation status/code가 API draft에 정의됨 |
| PM2-003 | P0 | PM | Evidence policy | PM2-001 | 정상 후보는 evidence 필수, evidence 없는 후보는 warning-only 저장 기준이 정의됨 |
| PM2-004 | P1 | PM | Failure/retry policy | PM2-001 | `ExtractionJobStatus` lifecycle, partial failure, retry/idempotency 기준이 정의됨 |
| PM2-005 | P1 | PM | Mock provider acceptance | PM2-002 | deterministic fixture, missing fixture failure, repeated run stability 기준이 정의됨 |

## Backend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| BE2-001 | P0 | Backend | SourceSegment model | MVP1 SourceData | `SourceSegmentType` 전체 값(`SHEET`, `ROW`, `CELL`, `PAGE`, `SECTION`, `PARAGRAPH`, `CHUNK`)이 저장됨 |
| BE2-002 | P0 | Backend | CSV/Excel profiling | BE2-001 | columns, inferred type, null ratio, distinct count, sample values 반환 |
| BE2-003 | P0 | Backend | TXT/PDF parsing and chunking | BE2-001 | TXT/PDF text chunks with metadata 생성 |
| BE2-004 | P0 | Backend | PromptTemplate/PromptVersion | none | prompt version CRUD와 active version 조회 가능 |
| BE2-005 | P0 | Backend | ExtractionJob/ModelRun | BE2-004 | job 생성, 상태 조회, model run metadata 저장 |
| BE2-006 | P0 | Backend | LLM provider interface and MockProvider | BE2-005 | 외부 LLM 없이 deterministic candidate 결과 생성 |
| BE2-007 | P0 | Backend | CandidateEntity/Relation/Evidence persistence | BE2-006 | 후보와 evidence가 DB에 저장되고 조회됨 |
| BE2-008 | P1 | Backend | Extraction job runner | BE2-005, BE2-006 | sync/local worker 방식으로 job status transition 검증 |
| BE2-009 | P1 | Backend | MVP2 OpenAPI export | BE2-001~BE2-008 | `docs/api/openapi-mvp2-draft.json` 또는 후속 export가 생성됨 |

## Frontend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| FE2-001 | P0 | Frontend | Source profiling screen | BE2-002 | 컬럼 프로파일과 sample values를 볼 수 있음 |
| FE2-002 | P0 | Frontend | Document chunk viewer | BE2-003 | page/section/chunk 목록과 metadata를 볼 수 있음 |
| FE2-003 | P0 | Frontend | Extraction job creation screen | BE2-004, BE2-005 | source, ontology version, prompt, model, scope 선택 후 job 생성 |
| FE2-004 | P0 | Frontend | Extraction job monitor | BE2-005 | status, progress, failure reason 표시 |
| FE2-005 | P0 | Frontend | Candidate result view | BE2-007 | candidate entity/relation list와 evidence 표시 |
| FE2-006 | P1 | Frontend | Evidence viewer UI | BE2-007 | source text/table row/chunk evidence를 확인 가능 |

## QA Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| INT2-001 | P0 | QA | Profiling contract review | BE2-002, FE2-001 | OpenAPI/profile fixture/UI fields가 일치 |
| INT2-002 | P0 | QA | Chunk/evidence traceability | BE2-003, BE2-007 | candidate evidence가 source segment로 추적됨 |
| INT2-003 | P0 | QA | Mock extraction flow | BE2-006, FE2-003, FE2-004 | MockProvider로 job 생성부터 후보 조회까지 통과 |
| INT2-004 | P1 | QA | Failure/retry smoke | BE2-008 | failed/partial/retry status가 검증됨 |

## MVP 2 Acceptance Draft

- CSV/Excel에서 컬럼 프로파일링 결과를 볼 수 있다.
- TXT/PDF를 chunk 단위로 볼 수 있다.
- Mock LLM으로 후보 엔티티/관계가 생성된다.
- 모든 후보는 source/evidence 참조를 가진다.
- ExtractionJob 상태를 UI에서 확인할 수 있다.

## Wave 6 Contract Decisions

- `SourceSegment.segment_type`은 `SourceSegmentType`을 사용한다: `SHEET`, `ROW`, `CELL`, `PAGE`, `SECTION`, `PARAGRAPH`, `CHUNK`.
- `SourceProfileColumn.inferred_type`은 `ProfileInferredType`을 사용한다. `PropertyDataType`을 직접 재사용하지 않는다.
- `ExtractionJob.status`는 `ExtractionJobStatus`, `ModelRun.status`는 `ModelRunStatus`를 사용한다.
- Candidate `validation_status`, `review_status`, `publish_status`는 각각 `ValidationStatus`, `CandidateReviewStatus`, `PublishStatus`를 사용한다.
- MVP 2에서는 `review_status=PENDING`, `publish_status=NOT_PUBLISHED`만 실제 workflow 값으로 사용한다.
- Evidence 없는 candidate는 저장 가능하지만 정상 후보가 아니며 `validation_status=WARNING`, `validation_codes=["MISSING_EVIDENCE"]`가 필수다.
- Evidence 참조가 깨진 candidate는 `validation_status=FAILED`, `validation_codes=["INVALID_EVIDENCE_REFERENCE"]`를 사용한다.
- MockProvider는 deterministic fixture 기반이며 같은 input/fixture는 같은 candidate content와 evidence locator를 반환해야 한다.
- `ModelRun.raw_request`/`raw_response`는 masked JSON만 저장한다. secret/API key/token/signed URL/raw full source text는 저장하지 않는다.

## Remaining Draft Risks

- Candidate 조회는 extraction-job 하위 endpoint만으로 충분한지, project/source/ontology_version filter가 필요한지 FE와 함께 확인해야 한다.
- Candidate confidence scale과 threshold는 first thin slice QA 이후 조정할 수 있다.
- PDF parsing library와 chunking default size/overlap은 thin slice 구현 결과를 보고 확정한다.
