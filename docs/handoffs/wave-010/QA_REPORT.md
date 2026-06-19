# QA Report - Wave 10

## 담당 범위
- backlog ID: `INT2-001`, `INT2-002`, `INT2-003`, `INT2-004`
- 작업 경로: `docs/handoffs/wave-010/`, `docs/api/openapi-mvp2-draft.json`, `apps/backend/`, `apps/frontend/`

## 완료한 작업
- PM/Backend/Frontend Wave 10 보고서를 먼저 읽고, Wave 10 목표를 broader MVP 2 local demo regression으로 확인했다.
- MVP 1 regression gate를 재확인했다.
  - `/health`, `/api/v1/me`, project create/list/detail
  - ontology draft/class/property/relation/graph
  - CSV/Excel upload/preview
  - TXT/PDF preview `NOT_AVAILABLE`
- Wave 7 contract sync 유지 여부를 재확인했다.
  - provider API literal `mock`
  - `SourceParseResponse`
  - `PromptVersion`
  - `CandidateEvidence`
  - `CandidateValidationCode`의 `MISSING_EVIDENCE`, `INVALID_EVIDENCE_REFERENCE`
  - `ExtractionJobStatus`의 `SUCCESS`, `PARTIAL_FAILED`, `FAILED`
- Wave 9 targeted hardening 유지 여부를 재확인했다.
  - draft class cascade soft delete 후 deleted class/property/relation이 graph에 노출되지 않음
  - extraction input에서 active ontology만 사용됨
  - evidence fallback/breadcrumb 및 LNB contextual drilldown 유지
- Broader MVP 2 local demo regression을 actual backend HTTP로 수행했다.
  - CSV upload/profile/preview: `READY`, mixed type, nullable/null ratio, repeated profile idempotency 확인
  - Excel upload/profile/preview: header-only sheet, `EMPTY` columns 확인
  - empty CSV profile warning 확인
  - TXT parse/chunk: `PARAGRAPH`, `CHUNK`, deterministic sequence, repeated parse idempotency 확인
  - PDF parse/chunk: first parse warning, `PAGE` segment, repeated parse visible duplicate 없음 확인
  - prompt template/version: active version 표시/선택 범위 확인
  - extraction job create/run: `default`, `partial_invalid`, `invalid_evidence_reference`, `missing`
  - default fixture success, normal evidence 조회
  - partial_invalid fixture partial failure와 `MISSING_EVIDENCE` warning candidate 확인
  - invalid_evidence_reference fixture broken evidence 200, non-null source segment, metadata mismatch 확인
  - missing fixture `FAILED`/`MOCK_FIXTURE_NOT_FOUND` 및 no candidates 확인
  - retry/dedupe: retry job 생성, source job `RETRYING`, retry result duplicate candidate/evidence 미생성 확인
  - candidate filters: `source_id`, `ontology_version_id`, `has_evidence`, `limit/offset`
- Frontend actual API mode smoke를 수행했다.
  - `VITE_USE_MOCK_API=false`, `VITE_API_BASE_URL=http://127.0.0.1:8040`
  - source detail/profile/chunk, job create/monitor, candidate results, normal/missing/broken evidence routes 확인
  - LNB는 top-level menu만 유지하고 ID-bound detail route를 평면 노출하지 않음
- Browser evidence를 남겼다.
  - `/private/tmp/ontology-wave10-qa-screenshots/source_detail.png`
  - `/private/tmp/ontology-wave10-qa-screenshots/source_profile.png`
  - `/private/tmp/ontology-wave10-qa-screenshots/source_chunks.png`
  - `/private/tmp/ontology-wave10-qa-screenshots/job_create.png`
  - `/private/tmp/ontology-wave10-qa-screenshots/job_monitor_default.png`
  - `/private/tmp/ontology-wave10-qa-screenshots/job_monitor_partial.png`
  - `/private/tmp/ontology-wave10-qa-screenshots/candidate_results_invalid.png`
  - `/private/tmp/ontology-wave10-qa-screenshots/evidence_normal.png`
  - `/private/tmp/ontology-wave10-qa-screenshots/evidence_missing_fallback.png`
  - `/private/tmp/ontology-wave10-qa-screenshots/evidence_broken.png`
  - `/private/tmp/ontology-wave10-qa-screenshots/evidence_direct_missing.png`
  - `/private/tmp/ontology-wave10-qa-screenshots/browser-checks.json`

## 변경 파일
- `docs/handoffs/wave-010/QA_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `docker --version`
  - `git diff --check -- apps/backend apps/frontend docs/api docs/backlog docs/pm docs/handoffs/wave-010`
  - `cd apps/backend && .venv/bin/pytest -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && tmpfile=$(mktemp /private/tmp/openapi-mvp2-wave10-qa.XXXXXX); .venv/bin/python scripts/export_openapi.py --output "$tmpfile" && cmp -s "$tmpfile" ../../docs/api/openapi-mvp2-draft.json`
  - OpenAPI schema spot check script for provider, parse, prompt, evidence, validation code, job status
  - `cd apps/frontend && npm run build`
  - Backend actual server: `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-wave10-qa.sqlite LOCAL_STORAGE_PATH=/private/tmp/ontology-platform-wave10-qa-storage ... uvicorn ... --port 8040`
  - Backend broader API smoke script, result: `/private/tmp/wave10-qa-api-smoke.json`
  - Frontend actual server: `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8040 npm run dev -- --host 127.0.0.1 --port 5201 --strictPort`
  - Frontend route HTTP smoke for 18 routes
  - Browser screenshot/DOM smoke for 11 pages
- 결과:
  - Docker CLI: `command not found`
  - diff whitespace check: PASS
  - Backend full pytest: `11 passed`
  - Backend ruff: PASS
  - OpenAPI MVP2 draft freshness: `OPENAPI_MVP2_DRAFT_FRESH`
  - OpenAPI contract spot check: PASS
  - Frontend build: PASS
  - Backend broader API smoke: PASS
  - Frontend actual route smoke: PASS
  - Browser smoke: PASS
- 실행하지 못한 검증:
  - Docker Compose smoke: Docker CLI가 없어 실행 불가. 기존 environment exception 유지.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - Wave 10 runtime 신규 endpoint/enum/DTO 추가는 발견되지 않았다.
  - `docs/api/openapi-mvp2-draft.json`은 backend export와 일치한다.
  - FE actual API mode는 기존 OpenAPI contract 위에서 동작한다.
  - `invalid_evidence_reference`는 이제 evidence detail 200과 metadata mismatch로 broken context를 제공한다.
- 영향받는 역할:
  - Backend: 추가 schema 작업 없음.
  - Frontend: 추가 type/client/mock contract sync 작업 없음.
  - PM: PDF repeated parse warning persistence는 후속 hardening 후보로 남길 수 있으나, visible duplicate row 방지는 PASS.

## Blocker
- Docker CLI 부재로 Compose smoke는 `NOT RUNNABLE`.
- 제품/계약 blocker는 발견되지 않았다.

## 남은 TODO
- Docker CLI가 제공되는 환경에서 Compose smoke를 재시도한다.
- Browser smoke tooling은 여전히 임시 런타임/스크린샷 방식이다. 후속 wave에서 공식 QA harness 또는 devDependency로 고정하면 재현성이 좋아진다.
- PDF parse는 첫 parse warning을 반환하고 repeated parse는 visible segment duplicate를 만들지 않는다. repeated parse warning persistence를 제품 요구로 올릴지는 PM/Backend 후속 결정 사항이다.

## 다른 역할에 전달할 내용
- PM:
  - Wave 10 broader local demo는 PASS.
  - 다음 wave는 추가 targeted hardening보다 MVP 2 closeout 준비로 전환 가능하다.
  - Docker Compose는 기존 environment exception 유지.
- Backend:
  - Fixture catalog, source profile/parse edge case, prompt lifecycle, retry/dedupe, candidate/evidence persistence 모두 actual HTTP smoke 기준 PASS.
  - `missing` fixture는 precondition 충족 후 `MOCK_FIXTURE_NOT_FOUND`로 정상 실패한다.
- Frontend:
  - actual API browser smoke 기준 source → extraction → candidate → evidence 흐름 PASS.
  - Job create route는 `/projects/:projectId/extraction/new`가 canonical UI route다.
  - Fixture selector는 user-facing label 중심으로 보이며 DOM에는 `Success`, `Partial failure`, `Broken evidence`, `Missing fixture` 옵션이 확인된다.
- QA:
  - 다음 wave에서는 closeout checklist 중심으로 regression matrix를 고정하고, Docker 가능 시 Compose smoke를 추가한다.

## 총괄에게 요청하는 결정
- Wave 11을 `MVP 2 closeout preparation`으로 진행하는 것을 제안한다.
- 추가 targeted hardening wave는 현재 필요하지 않다.
- Docker CLI 부재를 계속 environment exception으로 인정할지 유지 결정 필요.

## 현재 판정
- Wave 10 broader local demo: PASS
- MVP 1 regression gate: PASS
- Wave 7 contract sync 유지: PASS
- Wave 9 targeted hardening 유지: PASS
- `INT2-001` Profiling contract/local demo: PASS
- `INT2-002` Chunk/evidence traceability: PASS
- `INT2-003` Mock extraction flow: PASS
- `INT2-004` Failure/retry smoke: PASS
- 다음 wave 제안: `MVP 2 closeout preparation`
