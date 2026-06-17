# QA/Integration Report - Wave 7

## 담당 범위
- backlog ID: INT2-001, INT2-002, INT2-003, INT2-004
- 작업 경로:
  - `docs/api/openapi-mvp2-draft.json`
  - `docs/backlog/MVP2_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-006/QA_REPORT.md`
  - `docs/handoffs/wave-007/PM_REPORT.md`
  - `docs/handoffs/wave-007/BACKEND_REPORT.md`
  - `docs/handoffs/wave-007/FRONTEND_REPORT.md`
  - `apps/frontend/src/shared/api/types.ts`
  - `apps/frontend/src/shared/api/client.ts`
  - `apps/frontend/src/shared/mocks/mvp2Fixtures.ts`

## 완료한 작업
- 필수 문서와 PM/Backend/Frontend Wave 7 보고서를 먼저 읽었다.
- MVP 1 regression gate를 actual HTTP smoke로 재확인했다.
  - `/health`, `/api/v1/me`
  - project create/list/detail
  - ontology version/class/property/relation/graph
  - CSV/Excel upload + READY preview
  - TXT/PDF upload + NOT_AVAILABLE preview
- OpenAPI vs FE type/client/mock contract review를 재수행했다.
  - enum set exact match 확인
  - `SourceProfile.id`, `SourceProfileColumn.nullable`, `distinct_count_sampled` 확인
  - `SourceSegment.sequence` 확인
  - `SourceParseResponse` 타입/client 반환 확인
  - `PromptTemplate`/`PromptVersion` OpenAPI DTO 반영 확인
  - stale fields 제거 확인: `distinct_count`, `active_version_id`, `prompt_text`, `provider: "MockProvider"`
  - candidate/evidence nullable 및 `extraction_job_id`, `created_at`, numeric `paragraph_id/chunk_id` 확인
- Frontend actual API mode smoke를 재수행했다.
  - `VITE_USE_MOCK_API=false`
  - `VITE_API_BASE_URL=http://127.0.0.1:8011`
  - profile POST/GET
  - parse POST `SourceParseResponse` + segments GET
  - prompt/version create/list
  - job create/run/detail
  - candidate entity/relation list
  - candidate evidence read
- Provider payload가 `mock`으로 전송되고 job create 422가 사라졌는지 확인했다.
  - `POST /api/v1/projects/{project_id}/extraction-jobs` returned `201`
  - response `provider=mock`, `fixture_id=default`
- Backend가 추가한 `invalid_evidence_reference` hook을 runtime smoke에 포함했다.
  - job status `PARTIAL_FAILED`
  - failed candidate `validation_codes=["INVALID_EVIDENCE_REFERENCE"]`
  - broken evidence id `invalid-evidence-reference`
  - `/api/v1/candidate-evidence/invalid-evidence-reference` returned `404`
- Docker CLI와 Browser automation을 시도했다.
  - Docker CLI는 여전히 없음.
  - Playwright Chromium은 TLS 검증 비활성화 환경변수로 설치 후 actual route screenshot smoke를 수행했다.

## 변경 파일
- `docs/handoffs/wave-007/QA_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/frontend && npm run build`
  - `cd apps/backend && tmpfile=$(mktemp /private/tmp/openapi-mvp2-qa7.XXXXXX); .venv/bin/python scripts/export_openapi.py --output "$tmpfile" && cmp -s "$tmpfile" ../../docs/api/openapi-mvp2-draft.json`
  - Python contract review script: OpenAPI vs `apps/frontend/src/shared/api/types.ts`, `client.ts`, `mvp2Fixtures.ts`
  - SQLite actual backend server:
    - `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-wave7-qa.sqlite`
    - `LOCAL_STORAGE_PATH=/private/tmp/ontology-platform-wave7-qa-storage`
    - `uvicorn app.main:app --host 127.0.0.1 --port 8011`
  - Vite actual mode:
    - `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8011 npm run dev -- --host 127.0.0.1 --port 5187 --strictPort`
  - Python HTTP route smoke for FE routes
  - `NODE_TLS_REJECT_UNAUTHORIZED=0 npx playwright install chromium`
  - `npx playwright screenshot --wait-for-timeout=2500 --viewport-size=1365,768 ...`
  - `docker --version`
- 결과:
  - Backend pytest: PASS, `7 passed`
  - Backend ruff: PASS
  - Frontend build: PASS
  - OpenAPI MVP2 draft freshness: PASS
  - Contract review script: PASS
  - MVP1 regression actual HTTP smoke: PASS
  - FE actual API mode smoke: PASS
  - Provider `mock` / no 422: PASS
  - `SourceParseResponse` mismatch: resolved
  - `PromptVersion` mismatch: resolved
  - `CandidateEvidence` mismatch: resolved
  - `INVALID_EVIDENCE_REFERENCE` runtime smoke: PASS
  - Browser render smoke: PASS
    - `/private/tmp/wave7-profile-smoke.png`
    - `/private/tmp/wave7-candidates-smoke.png`
  - Docker Compose smoke: NOT RUNNABLE
    - `docker --version` -> `command not found`
- 실행하지 못한 검증:
  - Docker Compose `up` smoke는 Docker CLI 부재로 미수행. 기존 환경 예외 유지.
  - Playwright 설치는 local certificate chain 문제 때문에 `NODE_TLS_REJECT_UNAUTHORIZED=0`를 사용했다. 렌더 smoke는 성공했지만 이 환경 우회는 CI/정규 브라우저 검증 방식으로 보지는 않는다.

## API/Enum/DTO 변경
- 변경 여부: QA 변경 없음. Wave 7 contract sync 결과 확인 있음.
- 상세:
  - `ExtractionJobCreateRequest.provider`: OpenAPI const `mock`, FE payload `mock`, UI label `MockProvider`.
  - `POST /api/v1/sources/{source_id}/parse`: `SourceParseResponse` 반환 확인.
  - `GET /api/v1/sources/{source_id}/segments`: `SourceSegment[]` 조회 확인.
  - `PromptTemplate`: `updated_at` 포함, `active_version_id` 제거 확인.
  - `PromptVersion`: `prompt_template_id`, `template`, `output_schema`, `is_active`, `created_by` 반영 확인.
  - `CandidateEntity`/`CandidateRelation`: `extraction_job_id`, nullable class/relation/endpoint fields 반영 확인.
  - `CandidateEvidence`: `created_at`, nullable `source_segment_id/evidence_text`, numeric nullable `paragraph_id/chunk_id` 반영 확인.
  - Candidate list response는 PM 결정대로 plain array 유지 확인.
- 영향받는 역할:
  - PM: Wave 7 contract decisions가 실제 API/FE에 반영되어 QA PASS.
  - Backend: `invalid_evidence_reference` hook runtime PASS.
  - Frontend: actual API mode job create/run/candidate/evidence path PASS.

## Blocker
- MVP 2 actual API contract sync closeout blocker 없음.
- 유지되는 환경 예외:
  - Docker CLI 부재로 Compose smoke 미수행. linked: BE-002.
- 후속 scope:
  - Retry chain 전체 dedupe natural key 구현은 PM/Backend가 Wave 8 기능 범위로 열지 결정해야 한다. 현재 INT2-004 status/retry smoke의 blocker는 아님.

## 남은 TODO
- Wave 8에서 기능 확장을 시작해도 된다.
- Docker CLI가 제공되는 환경에서 `infra/local/docker-compose.yml` smoke를 재시도한다.
- 정규 브라우저 자동화는 Playwright를 dev dependency 또는 CI 도구로 고정한 뒤 재실행하는 것이 좋다.
- Wave 8에서 retry-chain dedupe를 열 경우, 같은 retry root 하위 중복 candidate/evidence를 별도 INT 항목으로 검증한다.

## 다른 역할에 전달할 내용
- PM:
  - INT2-001~INT2-004 모두 PASS.
  - Wave 8 기능 확장 착수 가능.
  - retry-chain dedupe 구현 여부만 Wave 8 scope decision으로 남는다.
- Backend:
  - `mock` provider literal, OpenAPI freshness, invalid evidence hook 모두 QA PASS.
  - `invalid_evidence_reference` hook은 QA smoke 전용으로 의도대로 동작한다.
- Frontend:
  - Wave 6 FE contract mismatch는 해소됨.
  - actual API mode route/render smoke도 PASS.
  - sidebar shortcut의 deterministic fixture route 개선은 UX 후속이며 contract blocker는 아님.
- QA:
  - 다음 wave에서는 contract 재검증보다 새 기능 범위별 acceptance checklist를 먼저 갱신한다.

## 총괄에게 요청하는 결정
- Wave 7은 `MVP 2 actual API contract sync closeout PASS`로 종료해도 된다.
- Wave 8에서 기능 확장을 열어도 된다.
- Docker/Compose는 계속 환경 예외로 둘지, 별도 검증 머신을 배정할지 결정이 필요하다.
- Retry chain dedupe 구현을 Wave 8에 포함할지 결정이 필요하다.

## 현재 판정
- MVP 1 regression gate: PASS
- INT2-001 Profiling contract review: PASS
- INT2-002 Chunk/evidence traceability: PASS
- INT2-003 Mock extraction flow: PASS
- INT2-004 Failure/retry smoke: PASS
- Wave 7 MVP 2 actual API contract sync closeout: PASS
