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
| PM2-001 | P0 | PM | Extraction user flow | MVP1 acceptance | 데이터 소스 선택부터 후보 결과 확인까지 사용자 흐름이 정의됨 |
| PM2-002 | P0 | PM | LLM output JSON schema | PM2-001 | candidate entity/relation/evidence JSON schema가 승인됨 |
| PM2-003 | P0 | PM | Evidence policy | PM2-001 | 모든 후보가 SourceSegment 또는 SourceColumn/row/chunk evidence를 갖는 기준이 정의됨 |
| PM2-004 | P1 | PM | Failure/retry policy | PM2-001 | ExtractionJob 실패/재시도/partial failure 정책이 정의됨 |
| PM2-005 | P1 | PM | Mock provider acceptance | PM2-002 | deterministic fixture 기반 QA 기준이 정의됨 |

## Backend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| BE2-001 | P0 | Backend | SourceSegment model | MVP1 SourceData | ROW, CELL, PAGE, PARAGRAPH, CHUNK segment가 저장됨 |
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

## Draft Risks To Resolve Before Implementation

- `SourceSegment.segment_type` enum 범위를 확정해야 한다.
- `SourceProfileColumn.inferred_type`이 MVP 1 `PropertyDataType`을 재사용하는지 별도 profiling enum을 두는지 결정해야 한다.
- `ExtractionJob.status`, candidate validation/review/publish status enum source를 glossary/API contract에 고정해야 한다.
- Evidence 없는 candidate 저장 허용 범위와 warning/error policy를 PM이 먼저 결정해야 한다.
- `ModelRun.raw_request`/`raw_response` 저장 시 secret/PII masking 정책이 필요하다.
- Candidate 조회는 extraction-job 하위 endpoint만으로 충분한지, project/source/ontology_version filter가 필요한지 FE와 함께 확인해야 한다.
