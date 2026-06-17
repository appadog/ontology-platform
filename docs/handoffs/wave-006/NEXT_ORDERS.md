# Next Orders - Wave 7

## 현재 단계 판정

- Overall: `MVP 2 WAVE 6 THIN SLICE PARTIAL / FE CONTRACT SYNC REQUIRED`
- MVP 1 regression: PASS, Docker environment exception maintained
- PM Wave 6: PASS
- Backend Wave 6: PASS
- Frontend Wave 6: PASS for mock/navigation, PARTIAL for actual API mode
- QA Wave 6:
  - `INT2-001`: FAIL
  - `INT2-002`: PARTIAL
  - `INT2-003`: PARTIAL
  - `INT2-004`: PASS

## 총괄 결정

- Wave 7은 MVP 2 기능 확장이 아니라 contract sync closeout wave다.
- Provider API literal은 `mock`으로 고정한다. `MockProvider`는 UI 표시명으로만 사용한다.
- `POST /api/v1/sources/{source_id}/parse` 응답은 `SourceParseResponse`로 고정한다.
- `GET /api/v1/extraction-jobs/{job_id}`의 `model_runs[]`를 Frontend monitor의 model run source로 유지한다.
- FE actual API mode가 PASS하기 전에는 candidate detail drawer, evidence highlight, 고급 PDF parsing, 외부 LLM provider, review/publish/RAG 범위를 열지 않는다.
- Docker/Browser automation은 기존 환경 예외를 유지하되, 가능한 환경이 생기면 별도 smoke를 수행한다.

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- 작업 종료 전 반드시 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 지정된 report path에 완료 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- MVP 1 regression이 깨지면 MVP 2 작업을 중단하고 즉시 보고한다.

## PM 지시

- Report path: `docs/handoffs/wave-007/PM_REPORT.md`
- Backlog IDs: `PM2-003`, `PM2-004`, `PM2-005`, support `INT2-001`~`INT2-003`
- 해야 할 일:
  - Provider literal/display split을 문서에 명확히 반영한다.
    - API value: `mock`
    - UI display label: `MockProvider`
  - `SourceParseResponse` 반환 형태를 API draft에 명확히 고정한다.
  - Retry no-duplicate natural key 범위를 정의한다.
    - 같은 job 안에서만 중복 방지인지, retry chain 전체에서 중복 방지인지 결정한다.
  - `INVALID_EVIDENCE_REFERENCE` deterministic fixture 또는 test hook 필요 여부를 결정한다.
  - Candidate pagination/list response shape를 유지할지 보강할지 결정한다.
  - 필요한 경우 `docs/pm/GLOSSARY.md`, `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`, `docs/backlog/MVP2_DRAFT_BACKLOG.md`를 갱신한다.
- 완료 기준:
  - FE와 Backend가 Wave 7 contract sync를 같은 기준으로 수행할 수 있다.
  - `docs/handoffs/wave-007/PM_REPORT.md`가 작성되어 있다.

## Backend 지시

- Report path: `docs/handoffs/wave-007/BACKEND_REPORT.md`
- Backlog IDs: support `BE2-001`~`BE2-007`, `BE2-009`, `INT2-001`~`INT2-004`
- 해야 할 일:
  - 기본 방침은 API 안정화다. 불필요한 신규 기능을 추가하지 않는다.
  - `docs/api/openapi-mvp2-draft.json` freshness를 유지한다.
  - OpenAPI examples를 FE sync에 충분한 수준으로 보강한다.
    - `SourceProfile`
    - `SourceParseResponse`
    - `PromptTemplate`
    - `PromptVersion`
    - `ExtractionJobCreateRequest`
    - `ExtractionJobDetail`
    - `CandidateEntity`
    - `CandidateRelation`
    - `CandidateEvidence`
  - Provider는 `mock` literal을 canonical로 유지한다. `MockProvider` alias는 추가하지 않는다 unless PM이 명시적으로 변경한다.
  - PM이 승인하면 `INVALID_EVIDENCE_REFERENCE` deterministic fixture/test hook을 추가한다.
  - MVP 1 regression과 MVP 2 backend smoke를 다시 수행한다.
- 완료 기준:
  - OpenAPI freshness PASS.
  - Backend regression PASS.
  - FE가 `docs/api/openapi-mvp2-draft.json`만 보고 sync할 수 있다.
  - `docs/handoffs/wave-007/BACKEND_REPORT.md`가 작성되어 있다.

## Frontend 지시

- Report path: `docs/handoffs/wave-007/FRONTEND_REPORT.md`
- Backlog IDs: `FE2-001`, `FE2-002`, `FE2-003`, `FE2-005`, `FE2-006`, support `INT2-001`~`INT2-003`
- 해야 할 일:
  - `docs/api/openapi-mvp2-draft.json` 기준으로 `shared/api/types.ts`, `shared/api/client.ts`, `shared/mocks/mvp2Fixtures.ts`를 재동기화한다.
  - `SourceProfile`/`SourceProfileColumn` mismatch를 수정한다.
    - `id`
    - `nullable`
    - `distinct_count_sampled`
  - `SourceSegment.sequence`와 `SourceParseResponse`를 반영한다.
    - `parseSource()`는 `SourceParseResponse`를 반환해야 한다.
  - `PromptTemplate`/`PromptVersion` DTO mismatch를 수정한다.
    - OpenAPI에 없는 `active_version_id`, `status`, `prompt_text` 의존을 제거하거나 UI 계산값/display field로 분리한다.
  - job creation provider payload를 `mock`으로 보낸다.
    - UI label은 `MockProvider`로 표시 가능하나 API value는 `mock`이다.
  - candidate/evidence DTO를 OpenAPI nullable shape와 맞춘다.
    - `extraction_job_id`
    - `created_at`
    - nullable `class_id`, `normalized_name`, `relation_id`, `source_candidate_entity_id`, `target_candidate_entity_id`
    - nullable `source_segment_id`, `evidence_text`
    - numeric nullable `paragraph_id`, `chunk_id`
  - actual API mode smoke를 수행한다.
    - profile
    - parse/chunks
    - prompt/version
    - job create/run
    - candidate/evidence read
  - `npm run build`를 수행한다.
- 제한:
  - candidate detail drawer, evidence highlight, 고급 UX 확장은 이번 Wave에서 하지 않는다.
  - 외부 LLM provider 설정 UI, review/publish/RAG 화면은 만들지 않는다.
- 완료 기준:
  - FE actual API job creation이 422 없이 성공한다.
  - profile/chunk/prompt/candidate/evidence 화면에서 undefined field가 나오지 않는다.
  - `docs/handoffs/wave-007/FRONTEND_REPORT.md`가 작성되어 있다.

## QA 지시

- Report path: `docs/handoffs/wave-007/QA_REPORT.md`
- Backlog IDs: `INT2-001`, `INT2-002`, `INT2-003`, `INT2-004`
- 선행 조건:
  - PM/Backend/Frontend wave-007 report를 먼저 읽는다.
- 해야 할 일:
  - MVP 1 regression gate를 재확인한다.
  - OpenAPI vs FE type/client/mock contract review를 재수행한다.
  - Frontend actual API mode smoke를 재수행한다.
    - profile
    - parse/chunks
    - prompt/version
    - job create/run
    - candidate/evidence read
  - Provider payload가 `mock`으로 전송되고 422가 사라졌는지 확인한다.
  - `SourceParseResponse`, `PromptVersion`, `CandidateEvidence` mismatch가 해소됐는지 확인한다.
  - PM/Backend가 `INVALID_EVIDENCE_REFERENCE` fixture/test hook을 추가했다면 runtime smoke를 수행한다.
  - Docker CLI와 Browser automation은 가능하면 시도하고, 불가하면 기존 환경 예외와 사유를 유지한다.
- 완료 기준:
  - `INT2-001`, `INT2-002`, `INT2-003`, `INT2-004`를 PASS/PARTIAL/FAIL로 명확히 판정한다.
  - Wave 8에서 기능 확장을 해도 되는지, 아니면 추가 sync wave가 필요한지 결론을 낸다.
  - `docs/handoffs/wave-007/QA_REPORT.md`가 작성되어 있다.

## 다음 보고 위치

- PM: `docs/handoffs/wave-007/PM_REPORT.md`
- Backend: `docs/handoffs/wave-007/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-007/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-007/QA_REPORT.md`
