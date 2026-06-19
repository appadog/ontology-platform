# Backend Report - Wave 11

## 담당 범위
- backlog ID: `BE2-001`, `BE2-002`, `BE2-003`, `BE2-004`, `BE2-005`, `BE2-006`, `BE2-007`, `BE2-008`, `BE2-009`
- 작업 경로: `apps/backend/`, `docs/api/openapi-mvp2-draft.json`, `docs/handoffs/wave-011/BACKEND_REPORT.md`

## 완료한 작업
- PM Wave 11 report와 `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`의 `CO-01`~`CO-09` backend evidence 항목을 확인했다.
- Backend closeout 안정화만 수행했다. 신규 product scope, runtime endpoint, enum, DTO/schema는 추가하지 않았다.
- fixture catalog regression을 더 찾기 쉽게 명확화했다.
  - `tests/test_project_ontology_api.py`의 fixture catalog/job lifecycle/retry smoke 테스트명을 `test_wave11_mvp2_closeout_fixture_catalog_prompt_extraction_and_retry_flow`로 정리했다.
  - `default`, `partial_invalid`, `invalid_evidence_reference`, `missing` fixture coverage는 기존 actual API-style TestClient flow로 유지했다.
  - masked `ModelRun.raw_request`/`raw_response` evidence에 `masking_version=v1`과 missing fixture `raw_response` assertion을 보강했다.
- Backend local closeout 재현성을 `apps/backend/README.md`에 문서화했다.
  - selected closeout smoke command를 추가했다.
  - fixture catalog, retry/dedupe, model run masking coverage map을 추가했다.
  - full backend closeout verification command set을 추가했다.
- `docs/api/openapi-mvp2-draft.json`을 backend export로 재생성했고, 별도 temp export와 byte-for-byte freshness를 확인했다.
- Closeout matrix backend 대응 상태:
  - `CO-01` Source profile: empty/header-only/mixed/null-heavy/repeated profile regression 유지.
  - `CO-02` Source parse/chunk: TXT sequence/PDF warning/repeated parse no-duplicate regression 유지.
  - `CO-03` Prompt version selection: prompt template/version create/list, active display/default hint, explicit `prompt_version_id` job payload regression 유지.
  - `CO-04` Extraction lifecycle: create/run/detail/retry, terminal statuses, failure reason, masked model run metadata regression 유지.
  - `CO-05` Fixture catalog: four fixture ids reproducible through actual API-style backend tests.
  - `CO-06` Retry/dedupe: retry-chain natural key no-duplicate visible candidate/evidence regression 유지.
  - `CO-07` Candidate/evidence browsing: existing candidate list filters and evidence detail endpoint 유지; 신규 candidate detail endpoint 없음.
  - `CO-08` Evidence traceability/fallback: normal/missing/broken fixture metadata and evidence detail support 유지.
  - `CO-09` Frontend navigation/browser smoke: backend actual API server/test surface available; browser validation is Frontend/QA owner.

## 변경 파일
- `apps/backend/README.md`
- `apps/backend/tests/test_project_ontology_api.py`
- `docs/handoffs/wave-011/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && .venv/bin/pytest`
  - `cd apps/backend && .venv/bin/pytest tests/test_project_ontology_api.py -k "wave11_mvp2_closeout_fixture_catalog or wave10_source_profile or wave10_source_parse"`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py`
  - `cd apps/backend && tmpfile=$(mktemp /tmp/openapi-mvp2-wave11.XXXXXX); .venv/bin/python scripts/export_openapi.py --output "$tmpfile" && cmp -s "$tmpfile" ../../docs/api/openapi-mvp2-draft.json && echo OPENAPI_MVP2_DRAFT_FRESH`
  - `git diff --check -- apps/backend docs/api/openapi-mvp2-draft.json docs/handoffs/wave-011/BACKEND_REPORT.md`
- 결과:
  - Ruff: `All checks passed!`
  - Backend selected closeout smoke: `3 passed, 8 deselected`
  - Backend full pytest: `11 passed`
  - OpenAPI export: `Wrote /Users/hanati/Desktop/ontology-platform/docs/api/openapi-mvp2-draft.json`
  - OpenAPI freshness: `OPENAPI_MVP2_DRAFT_FRESH`
  - diff whitespace check for Backend-owned edits: PASS
- 실행하지 못한 검증:
  - Docker Compose smoke는 Backend Wave 11 범위가 아니며 QA P1 environment gate다.
  - Frontend build/browser smoke는 Frontend/QA 범위라 수행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - 신규 endpoint, enum, DTO/schema 추가 없음.
  - `docs/api/openapi-mvp2-draft.json`은 재생성 후 backend export와 freshness 확인 완료. artifact 내용 diff는 없다.
  - provider API literal은 계속 `mock`만 허용한다.
  - external LLM provider, review/publish, RAG, advanced PDF parsing, candidate detail endpoint는 추가하지 않았다.
- 영향받는 역할:
  - Frontend: 기존 OpenAPI/endpoint shape 그대로 사용 가능.
  - QA: README의 selected closeout smoke와 full verification command를 backend regression 재현 근거로 사용할 수 있다.

## Blocker
- Backend blocker 없음.
- 참고: 작업 시작 시 PM/commander 문서 변경과 `docs/handoffs/wave-011/` 신규 파일들이 이미 존재했다. Backend 소유 범위 밖 변경은 되돌리거나 수정하지 않았다.

## 남은 TODO
- Backend TODO 없음.
- QA가 Docker CLI를 사용할 수 있으면 Compose smoke를 P1 gate로 재시도한다. Docker CLI가 없으면 PM closeout exception policy를 따른다.

## 다른 역할에 전달할 내용
- PM: Wave 11 Backend는 closeout 안정화만 수행했고 schema/API/enum/DTO 변경은 없다.
- Backend: closeout smoke command는 `apps/backend/README.md`의 `MVP 2 Closeout Regression` 섹션에 있다.
- Frontend: backend contract shape는 변하지 않았다. Candidate/evidence UI는 기존 candidate list arrays, job detail, evidence detail endpoint를 계속 사용하면 된다.
- QA: `default`, `partial_invalid`, `invalid_evidence_reference`, `missing`, retry/dedupe, source profile/parse edge cases, prompt selection, masked model run metadata가 backend pytest에 포함되어 있다.

## 총괄에게 요청하는 결정
- 없음.

## 현재 판정
- PASS
