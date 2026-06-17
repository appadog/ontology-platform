# QA/Integration Report - Wave 6

## 담당 범위
- backlog ID: INT2-001, INT2-002, INT2-003, INT2-004
- 작업 경로: `docs/api/openapi-mvp2-draft.json`, `docs/api/openapi-mvp1.json`, `apps/backend`, `apps/frontend/src/shared/api`, `apps/frontend/src/shared/mocks`

## 완료한 작업
- PM/Backend/Frontend Wave 6 보고서와 필수 handoff 문서를 먼저 확인했다.
- MVP 1 regression gate를 재실행했다.
  - `/health`, `/api/v1/me`
  - project create/list/detail
  - ontology draft version/class/property/relation/graph
  - CSV/Excel upload + READY preview
  - TXT/PDF upload + NOT_AVAILABLE preview
- MVP 2 profiling/parse/extraction/candidate thin-slice backend smoke를 수행했다.
  - CSV profile `id`, `nullable`, `distinct_count_sampled` 확인
  - CSV/TXT/PDF parse 및 `SourceSegment.sequence` 확인
  - prompt template/version 생성
  - default extraction job 생성/실행, candidate/evidence 조회
  - repeated default run의 candidate content/evidence locator deterministic 검증
  - missing fixture `FAILED/MOCK_FIXTURE_NOT_FOUND` 확인
  - partial invalid fixture `PARTIAL_FAILED`, warning-only `MISSING_EVIDENCE` candidate 확인
  - failed/partial job retry가 새 `PENDING` job을 만들고 원 job을 `RETRYING`으로 바꾸는 것 확인
- Chunk/evidence traceability 검증 항목을 만들고 일부 실행했다.
  - 모든 normal candidate는 `evidence_ids[]`를 가진다.
  - 모든 `evidence_id`는 `/api/v1/candidate-evidence/{id}`로 조회된다.
  - `CandidateEvidence.source_segment_id`는 `/api/v1/sources/{source_id}/segments`의 segment로 해소된다.
  - evidence locator row/page/paragraph/chunk 필드는 segment locator와 연결된다.
  - evidence 없는 candidate는 `WARNING/MISSING_EVIDENCE/NOT_PUBLISHED`로만 남는다.
  - broken evidence reference는 `INVALID_EVIDENCE_REFERENCE` fixture/API가 없어 이번 smoke에서 직접 재현하지 못했다.
  - `ModelRun.raw_request`에 full source text가 저장되지 않고 `redaction_summary.policy=no_source_text_or_secrets`가 포함됨을 확인했다.
- Backend OpenAPI와 Frontend `types.ts`, `client.ts`, `mvp2Fixtures.ts` contract review를 수행했다.
- Frontend actual API mode smoke를 HTTP 수준으로 수행했다.
  - `VITE_USE_MOCK_API=false`, `VITE_API_BASE_URL=http://127.0.0.1:8010`
  - Vite actual env 주입 확인
  - API seed 후 project/profile/job/evidence GET 확인
  - FE job creation payload shape를 실제 API에 전송해 provider mismatch를 재현했다.

## 변경 파일
- `docs/handoffs/wave-006/QA_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/frontend && npm run build`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output /tmp/openapi-mvp2-wave6-qa.json && cmp -s /tmp/openapi-mvp2-wave6-qa.json ../../docs/api/openapi-mvp2-draft.json`
  - OpenAPI enum/DTO 비교 스크립트: `docs/api/openapi-mvp2-draft.json` vs `apps/frontend/src/shared/api/types.ts`
  - Backend TestClient QA smoke: MVP1 regression + MVP2 profile/parse/extraction/candidate/failure/retry
  - actual API server: `uvicorn app.main:app --host 127.0.0.1 --port 8010`
  - actual FE dev server: `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8010 npm run dev`
  - `docker --version`
- 결과:
  - Backend tests: PASS, `7 passed`
  - Backend ruff: PASS
  - Frontend build: PASS
  - MVP2 OpenAPI export freshness: PASS, `OPENAPI_MVP2_DRAFT_FRESH`
  - MVP1 regression smoke: PASS
  - Backend MVP2 profile/parse/extraction/status/retry/evidence smoke: PASS
  - Enum sync: PASS
  - Frontend actual API mode: PARTIAL
    - actual env 주입과 GET project/profile/job/evidence는 확인됨.
    - FE job creation payload `{ provider: "MockProvider" }`는 backend에서 `422 LLM_PROVIDER_NOT_AVAILABLE`로 실패함.
- 실행하지 못한 검증:
  - Browser click/manual UAT smoke: Playwright CLI는 확인됐지만 Chromium 다운로드가 `SELF_SIGNED_CERT_IN_CHAIN`으로 실패했다. Browser MCP tool도 현재 세션에 노출되지 않아 실제 렌더링/클릭 evidence는 남기지 못했다.
  - Docker Compose smoke: Docker CLI가 없어 실행하지 못했다. `docker --version` 결과 `command not found`. `infra/local/docker-compose.yml` 존재만 확인했다.

## API/Enum/DTO 변경
- 변경 여부: QA 변경 없음. Contract mismatch 확인 있음.
- Enum sync:
  - PASS: `SourceSegmentType`, `ProfileInferredType`, `ExtractionJobStatus`, `ModelRunStatus`, `CandidateValidationCode`, `ValidationStatus`, `CandidateReviewStatus`, `PublishStatus`.
- DTO/API mismatch:
  - INT2-001 / FE2-001: `SourceProfile.id`가 FE 타입/fixture에 없다.
  - INT2-001 / FE2-001: `SourceProfileColumn.nullable`이 FE 타입/fixture에 없다.
  - INT2-001 / FE2-001: OpenAPI는 `distinct_count_sampled`, FE 타입/fixture/UI는 `distinct_count`를 사용한다. 실제 profile API 응답에서 UI distinct 값이 `undefined`가 될 수 있다.
  - INT2-002 / FE2-002: `SourceSegment.sequence`가 FE 타입/fixture에 없다.
  - INT2-002 / FE2-002: FE `parseSource()`는 POST `/sources/{source_id}/parse` 응답을 `SourceSegment[]`로 타입 지정했지만 OpenAPI/backend는 `SourceParseResponse`를 반환한다.
  - INT2-003 / FE2-003: `PromptTemplate.updated_at`가 FE 타입/fixture에 없고, FE에는 OpenAPI에 없는 `active_version_id`가 있다.
  - INT2-003 / FE2-003: `PromptVersion`은 OpenAPI의 `prompt_template_id/template/output_schema/is_active/created_by`와 FE의 `prompt_id/status/prompt_text`가 다르다. 실제 API 응답에는 `status`가 없어 job 생성 화면 option에 undefined가 표시될 수 있다.
  - INT2-003 / FE2-003 / BE2-006: FE job creation은 `provider: "MockProvider"`를 전송하지만 OpenAPI/backend thin slice는 `provider="mock"`만 허용한다. 실제 API에서 `422 LLM_PROVIDER_NOT_AVAILABLE` 재현됨.
  - INT2-003 / FE2-003: `ExtractionJobCreateRequest.fixture_id`가 FE 타입에 없다. backend는 optional default를 제공하므로 즉시 blocker는 아니지만 fixture 선택 UI/테스트에는 필요하다.
  - INT2-002 / FE2-005: `CandidateEntity`와 `CandidateRelation`의 `extraction_job_id`가 FE 타입/fixture에 없다.
  - INT2-002 / FE2-005: candidate nullable 필드가 FE에서 너무 좁다. OpenAPI는 `class_id`, `normalized_name`, `relation_id`, `source_candidate_entity_id`, `target_candidate_entity_id`를 null 허용한다.
  - INT2-002 / FE2-006: `CandidateEvidence.created_at`가 FE 타입/fixture에 없다.
  - INT2-002 / FE2-006: `CandidateEvidence.source_segment_id`와 `evidence_text`는 OpenAPI에서 nullable인데 FE는 non-null로 둔다.
  - INT2-002 / FE2-006: `CandidateEvidence.paragraph_id/chunk_id`는 OpenAPI에서 integer/null인데 FE fixture/type은 string/null이다.
  - INT2-002 / PM2-003: broken evidence reference를 만드는 deterministic fixture가 없어 `INVALID_EVIDENCE_REFERENCE` 정책은 enum/contract만 확인했고 runtime smoke는 미수행.
- 영향받는 역할:
  - Frontend: `types.ts`, `client.ts`, `mvp2Fixtures.ts`, profile/job/candidate/evidence 화면 sync 필요.
  - Backend: provider literal을 contract에 맞춰 계속 `mock`으로 유지할지, FE 표기값 `MockProvider`도 alias로 받을지 결정 필요.
  - PM: provider enum/literal과 parse response shape를 MVP2 draft에 명확히 고정 필요.

## Blocker
- INT2-003 / FE2-003 / BE2-006: actual FE job creation payload가 backend에서 422로 실패한다. FE는 API value를 `mock`으로 보내거나 backend가 `MockProvider` alias를 허용해야 한다.
- INT2-001 / FE2-001: profile DTO field mismatch 때문에 actual profile 화면의 distinct count가 깨질 수 있다.
- INT2-003 / FE2-003: PromptVersion DTO mismatch 때문에 actual job creation 화면에 undefined status가 표시될 수 있다.
- INT2-002 / FE2-002 / FE2-005 / FE2-006: FE mock/type이 OpenAPI candidate/evidence/segment contract와 맞지 않는다.
- Docker/Compose: Docker CLI 부재. MVP1에서 승인된 환경 예외를 유지한다.
- Browser/manual UAT: Playwright Chromium 다운로드가 local certificate chain 문제로 실패해 click evidence 미확보.

## 남은 TODO
- FE2-001: `SourceProfile`, `SourceProfileColumn` 타입/fixture/UI를 OpenAPI 기준으로 수정한다.
- FE2-002: `SourceSegment.sequence`와 `SourceParseResponse`를 FE 타입/client에 반영한다.
- FE2-003: Prompt DTO와 job creation provider literal을 OpenAPI 기준으로 수정한다.
- FE2-005/FE2-006: Candidate/Evidence DTO nullable, `created_at`, `extraction_job_id`, numeric paragraph/chunk id를 반영한다.
- PM2-003/PM2-005/BE2-007: `INVALID_EVIDENCE_REFERENCE`를 재현할 deterministic fixture 또는 test hook을 추가할지 결정한다.
- BE2-008/PM2-004: retry no-duplicate의 natural key 범위를 “same job only”인지 “retry chain 전체”인지 명확히 한다.
- Docker CLI가 제공되는 환경에서 `infra/local/docker-compose.yml` smoke를 재시도한다.
- 브라우저 도구가 준비되면 Source profile, chunks, extraction create/monitor, candidates/evidence route를 클릭 smoke로 재검증한다.

## 다른 역할에 전달할 내용
- PM:
  - Wave 6 MVP2 thin slice는 Backend 동작 smoke는 PASS지만 FE actual contract가 깨져 전체 판정은 PARTIAL이다.
  - provider API value는 `mock`으로 고정할지, display label만 `MockProvider`로 둘지 결정해 달라.
  - `SourceParseResponse` vs `SourceSegment[]` 반환 의도를 draft에 더 명확히 적어 달라.
  - `INVALID_EVIDENCE_REFERENCE` fixture 필요 여부를 Wave 7 scope로 결정해 달라.
- Backend:
  - OpenAPI export와 backend runtime smoke는 PASS.
  - FE actual payload의 `provider: "MockProvider"`는 현재 422. alias 허용을 원하면 backend validation 변경 필요.
  - default/missing/partial retry smoke는 통과했지만 retry chain dedupe 정책은 PM 정의가 더 필요하다.
- Frontend:
  - `types.ts`, `client.ts`, `mvp2Fixtures.ts`를 `docs/api/openapi-mvp2-draft.json`에 재동기화해야 actual API mode가 닫힌다.
  - 가장 먼저 고칠 항목은 `provider`, `SourceProfileColumn.distinct_count_sampled`, `PromptVersion`, `SourceParseResponse`다.
- QA:
  - Wave 7에서 FE contract sync 후 actual browser smoke를 재수행한다.
  - Docker 가능 환경에서 Compose smoke를 별도 재시도한다.

## 총괄에게 요청하는 결정
- MVP 2 Wave 6 thin slice는 `PARTIAL`로 닫고, Wave 7 착수 전 FE contract sync를 P0로 올릴 것을 요청한다.
- Backend thin slice 확장은 가능하지만, FE actual API demo acceptance는 provider/profile/prompt DTO mismatch 해결 전에는 승인하지 않는 것을 권장한다.
- Docker/Browser smoke는 현재 환경 예외로 유지할지, 별도 검증 머신에서 수행할지 결정이 필요하다.

## 현재 판정
- MVP 1 regression gate: PASS
  - 단, Docker Compose는 Docker CLI 부재로 기존 환경 예외 유지.
- INT2-001 Profiling contract review: FAIL
  - Backend profile API는 PASS이나 FE type/fixture/UI field mismatch가 남아 acceptance 불충족.
- INT2-002 Chunk/evidence traceability: PARTIAL
  - Backend evidence-to-segment traceability smoke는 PASS.
  - FE segment/candidate/evidence DTO/fixture mismatch와 `INVALID_EVIDENCE_REFERENCE` runtime fixture 부재가 남음.
- INT2-003 Mock extraction flow: PARTIAL
  - Backend MockProvider flow와 deterministic smoke는 PASS.
  - Frontend actual job creation payload가 422로 실패해 end-to-end actual flow는 불합격.
- INT2-004 Failure/retry smoke: PASS
  - missing fixture, partial invalid fixture, retry status transition을 backend smoke로 확인.
- Wave 6 MVP 2 thin slice overall: PARTIAL
  - Backend/API core는 작동한다.
  - FE actual API contract sync 전에는 MVP2 acceptance closeout 또는 넓은 구현 확장은 위험하다.
