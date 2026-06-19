# QA Report - Wave 11

## 담당 범위
- backlog ID: `INT2-001`, `INT2-002`, `INT2-003`, `INT2-004`
- 작업 경로: `docs/handoffs/wave-011/QA_REPORT.md`
- 수정 범위: QA 보고서만 수정. 앱 코드, PM 문서, Backend/Frontend report는 수정하지 않음.

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-010/NEXT_ORDERS.md`
  - `docs/handoffs/wave-011/PM_REPORT.md`
  - `docs/handoffs/wave-011/BACKEND_REPORT.md`
  - `docs/handoffs/wave-011/FRONTEND_REPORT.md`
  - `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`
  - `docs/backlog/MVP2_DRAFT_BACKLOG.md`
  - `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `apps/backend/README.md`
  - `apps/frontend/README.md`
- PM/Backend/Frontend Wave 11 role reports의 PASS 근거를 확인했다.
  - PM: closeout checklist, CO-01~CO-09 acceptance matrix, demo script, release exclusions, exception policy 작성 PASS.
  - Backend: full pytest, ruff, selected closeout smoke, OpenAPI freshness PASS. 신규 endpoint/enum/DTO 없음.
  - Frontend: build, Vitest, actual API browser smoke, route/screenshot artifact PASS. 신규 Backend contract 요구 없음.
- MVP 1 regression gate, Wave 7 contract sync, Wave 9 targeted hardening, Wave 10 broader local demo 유지 여부를 독립 검증 결과와 기존 report chain으로 재확인했다.
- CO-01~CO-09 closeout regression matrix를 수행하고 모두 P0 PASS로 판정했다.
- Docker CLI 부재를 재확인했고, PM closeout exception policy 조건 충족 여부를 검토했다.
- Frontend smoke harness가 `npm run smoke:mvp2:actual`로 재현되는지 실제 backend/frontend local server를 띄워 확인했다.

## 변경 파일
- `docs/handoffs/wave-011/QA_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `docker --version`
  - `git diff --check -- apps/backend apps/frontend docs/api docs/backlog docs/pm docs/handoffs/wave-011`
  - `cd apps/backend && .venv/bin/pytest -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && tmpfile=$(mktemp /tmp/openapi-mvp2-wave11-qa.XXXXXX); .venv/bin/python scripts/export_openapi.py --output "$tmpfile" && cmp -s "$tmpfile" ../../docs/api/openapi-mvp2-draft.json`
  - `cd apps/backend && .venv/bin/pytest tests/test_project_ontology_api.py -q -k "wave11_mvp2_closeout_fixture_catalog or wave10_source_profile or wave10_source_parse"`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && npm run test`
  - `cd apps/backend && rm -f /tmp/ontology-wave11-qa-smoke.db; rm -rf /tmp/ontology-wave11-qa-storage /tmp/ontology-wave11-qa-frontend-smoke; DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave11-qa-smoke.db LOCAL_STORAGE_PATH=/tmp/ontology-wave11-qa-storage .venv/bin/python - <<'PY' ... Base.metadata.create_all(bind=engine) ... PY`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave11-qa-smoke.db LOCAL_STORAGE_PATH=/tmp/ontology-wave11-qa-storage CORS_ORIGINS='["http://localhost:5181","http://127.0.0.1:5181"]' .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8021`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8021 npm run dev -- --host 127.0.0.1 --port 5181 --strictPort`
  - `cd apps/frontend && MVP2_API_BASE_URL=http://127.0.0.1:8021 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5181 MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave11-qa-frontend-smoke npm run smoke:mvp2:actual`
- 결과:
  - Docker CLI: `zsh:1: command not found: docker`
  - `git diff --check`: PASS
  - Backend full pytest: `11 passed in 0.78s`
  - Backend ruff: `All checks passed!`
  - Backend selected closeout smoke: `3 passed, 8 deselected`
  - OpenAPI freshness: temp export completed and `cmp -s` PASS against `docs/api/openapi-mvp2-draft.json`
  - Frontend build: PASS
  - Frontend test: `1 passed`
  - QA actual API browser smoke: `status: PASS`
  - QA smoke artifact:
    - `/tmp/ontology-wave11-qa-frontend-smoke/mvp2-actual-api-smoke.json`
    - `/tmp/ontology-wave11-qa-frontend-smoke/source-profile.png`
    - `/tmp/ontology-wave11-qa-frontend-smoke/source-chunks.png`
    - `/tmp/ontology-wave11-qa-frontend-smoke/job-monitor.png`
    - `/tmp/ontology-wave11-qa-frontend-smoke/candidate-filters.png`
    - `/tmp/ontology-wave11-qa-frontend-smoke/evidence-normal.png`
    - `/tmp/ontology-wave11-qa-frontend-smoke/evidence-direct-missing.png`
  - QA actual smoke route coverage:
    - `/dashboard`
    - `/projects`
    - `/projects/{project_id}`
    - `/projects/{project_id}/sources/{source_id}`
    - `/projects/{project_id}/sources/{source_id}/profile`
    - `/projects/{project_id}/sources/{source_id}/chunks`
    - `/projects/{project_id}/extraction-jobs`
    - `/projects/{project_id}/extraction/new`
    - `/extraction-jobs/{default_job_id}`
    - `/extraction-jobs/{default_job_id}/candidates`
    - normal evidence viewer route
    - broken evidence viewer route
    - direct missing evidence fallback route
- 실행하지 못한 검증:
  - Docker Compose smoke: Docker CLI가 없어 `NOT RUNNABLE`.
  - 이 항목은 `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`의 P1 environment exception 조건에 해당하며, product failure로 보지 않는다.

## Closeout Regression Matrix
- `CO-01` Source profile: PASS. Backend edge-case regression과 frontend profile route/screenshot smoke PASS. `INT2-001` PASS 유지.
- `CO-02` Source parse/chunk: PASS. Backend TXT/PDF/repeated parse regression과 frontend chunks route/screenshot smoke PASS. `INT2-002` PASS 유지.
- `CO-03` Prompt version selection: PASS. Backend prompt/version/job payload regression과 actual smoke의 explicit `prompt_version_id` job creation PASS. 신규 active-version mutation API/UI 요구 없음.
- `CO-04` Extraction job lifecycle: PASS. Backend lifecycle/model run masking/retry regression과 frontend job monitor smoke PASS. `INT2-003`, `INT2-004` PASS 유지.
- `CO-05` Fixture catalog: PASS. `default`, `partial_invalid`, `invalid_evidence_reference`, `missing` fixture가 backend selected smoke와 actual frontend smoke에서 재현됨.
- `CO-06` Retry/dedupe: PASS. Backend retry-chain dedupe regression PASS, actual smoke에서 retry job 생성/run PASS. `INT2-004` PASS 유지.
- `CO-07` Candidate/evidence browsing: PASS. Candidate entity/relation route와 validation/evidence filter smoke PASS. 신규 candidate detail endpoint 없이 기존 list/evidence contract로 충분함.
- `CO-08` Evidence traceability/fallback: PASS. Normal evidence, broken evidence, direct missing fallback route가 actual browser smoke와 artifact로 확인됨. `INT2-002` PASS 유지.
- `CO-09` Frontend navigation/browser smoke: PASS. Actual API mode route coverage와 screenshots PASS. LNB/ID-bound route 정책은 Wave 9/10 reports 및 Wave 11 smoke 경로 기준 유지.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - QA는 runtime endpoint, enum, DTO/schema 변경을 요구하지 않았다.
  - `docs/api/openapi-mvp2-draft.json`은 backend temp export와 byte-for-byte freshness PASS.
  - MVP 1 `openapi-mvp1.json`과 MVP 2 `openapi-mvp2-draft.json` 분리 정책 유지.
  - provider API literal은 계속 `mock`; `MockProvider`는 UI display label 범위.
  - external LLM, review/publish, RAG, advanced PDF parsing, candidate detail endpoint, active prompt-version mutation workflow는 closeout 제외 범위로 유지.
- 영향받는 역할:
  - PM: Closeout checklist 기준의 P0 acceptance rows는 모두 PASS.
  - Backend: 추가 schema/API work 없음.
  - Frontend: `npm run smoke:mvp2:actual` harness 재현 PASS.

## Blocker
- Product blocker 없음.
- Environment/tooling blocker:
  - Docker CLI 부재로 Compose smoke는 `NOT RUNNABLE`.
  - PM exception policy 조건을 충족한다. Backend tests/OpenAPI freshness/actual API smoke, Frontend build/test/browser smoke가 모두 PASS했으므로 MVP 2 product closeout을 막지 않는다.

## 남은 TODO
- Docker Compose smoke 재시도: Docker CLI가 제공되는 환경에서 P1 infra/local acceptance gate로 수행한다. Linked IDs: `BE-002`, `INT2-003`.
- Browser smoke harness 정규화: 현재 `npm run smoke:mvp2:actual`로 재현 가능하므로 closeout blocker는 아니지만, 후속 wave에서 Playwright Test suite 형태로 더 고정할 수 있다. Linked IDs: `FE2-006`, `INT2-003`.
- Wave 12는 product targeted hardening이 아니라 closeout finalization/commander integration wave로 충분하다.

## 다른 역할에 전달할 내용
- PM:
  - `CO-01`~`CO-09` P0 closeout matrix 모두 PASS.
  - Docker Compose만 P1 environment exception으로 남으므로 MVP 2 closeout verdict는 `PASS WITH EXCEPTION` 권고.
- Backend:
  - Full pytest, ruff, selected closeout smoke, OpenAPI freshness 모두 PASS.
  - 신규 API/enum/DTO 요구 없음.
- Frontend:
  - `npm run build`, `npm run test`, `npm run smoke:mvp2:actual` 모두 PASS.
  - QA 재현 artifact는 `/tmp/ontology-wave11-qa-frontend-smoke`에 생성됨.
- QA:
  - `INT2-001`, `INT2-002`, `INT2-003`, `INT2-004` 모두 PASS 유지.
  - Docker CLI 사용 가능 환경에서만 Compose smoke를 재시도하면 된다.

## 총괄에게 요청하는 결정
- MVP 2 closeout을 `PASS WITH EXCEPTION`으로 승인할지 결정 요청.
- Wave 12가 필요하다면 신규 product hardening이 아니라 `CURRENT_STATE.md` 갱신, closeout final order, Docker P1 follow-up 분리 같은 commander finalization으로 제한하는 것을 권고한다.

## 현재 판정
- PASS WITH EXCEPTION
