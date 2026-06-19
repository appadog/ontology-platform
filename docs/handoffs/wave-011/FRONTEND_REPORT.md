# Frontend Report - Wave 11

## 담당 범위
- backlog ID: `FE2-001`, `FE2-002`, `FE2-003`, `FE2-004`, `FE2-005`, `FE2-006`
- 작업 경로:
  - `apps/frontend/**`
  - `docs/handoffs/wave-011/FRONTEND_REPORT.md`

## 완료한 작업
- `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`의 `CO-01`~`CO-09` 중 frontend evidence 항목을 기준으로 MVP 2 demo path를 점검했다.
- 사용자 주 화면 visible copy를 closeout 기준에 맞춰 정리했다.
  - source/project/ontology 화면의 endpoint, DTO, mock fixture, API boundary 중심 문구를 제거했다.
  - source profile 화면의 `MVP2 THIN` 배지를 사용자 상태 중심 문구로 변경했다.
  - extraction fixture 설명은 QA 재현성을 위해 fixture id는 유지하되 primary summary를 결과 중심으로 낮췄다.
- visible copy regression guard를 추가했다.
  - `src/pages/visibleCopy.test.ts`
  - endpoint/debug 중심 문구가 primary page source에 다시 들어오면 Vitest가 실패한다.
- actual API browser smoke 재현성을 높였다.
  - `@playwright/test`를 frontend devDependency로 고정했다.
  - `npm run smoke:mvp2:actual` script를 추가했다.
  - script는 actual Backend API에 demo data를 생성하고, actual frontend route/browser smoke와 screenshot artifact를 남긴다.
- `apps/frontend/README.md`에 MVP 2 actual API smoke 실행 명령과 artifact 경로를 추가했다.

## 변경 파일
- `apps/frontend/README.md`
- `apps/frontend/package.json`
- `apps/frontend/package-lock.json`
- `apps/frontend/scripts/mvp2-actual-api-smoke.mjs`
- `apps/frontend/src/pages/visibleCopy.test.ts`
- `apps/frontend/src/pages/ExtractionJobCreatePage.tsx`
- `apps/frontend/src/pages/OntologyModelerPage.tsx`
- `apps/frontend/src/pages/ProjectDetailPage.tsx`
- `apps/frontend/src/pages/ProjectListPage.tsx`
- `apps/frontend/src/pages/SourceManagerPage.tsx`
- `apps/frontend/src/pages/SourceProfilingPage.tsx`
- `docs/handoffs/wave-011/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/frontend && npm run test -- src/pages/visibleCopy.test.ts`
    - RED 확인: endpoint/debug 중심 copy 8건을 잡아 실패함.
    - GREEN 확인: copy 수정 후 PASS.
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave11-frontend-smoke.db LOCAL_STORAGE_PATH=/tmp/ontology-wave11-frontend-storage .venv/bin/python - <<'PY' ... Base.metadata.create_all(bind=engine) ...`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave11-frontend-smoke.db LOCAL_STORAGE_PATH=/tmp/ontology-wave11-frontend-storage CORS_ORIGINS='["http://localhost:5173","http://127.0.0.1:5173","http://127.0.0.1:5178"]' .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8014`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8014 npm run dev -- --host 127.0.0.1 --port 5178 --strictPort`
  - `cd apps/frontend && MVP2_API_BASE_URL=http://127.0.0.1:8014 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5178 MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave11-frontend-smoke npm run smoke:mvp2:actual`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && npm run test`
  - `git diff --check -- apps/frontend docs/handoffs/wave-011/FRONTEND_REPORT.md`
- 결과:
  - `npm run build`: PASS.
  - `npm run test`: PASS, `1 passed`.
  - `git diff --check`: PASS.
  - actual API smoke: PASS.
    - backend actual server: `http://127.0.0.1:8014`
    - frontend actual API mode: `http://127.0.0.1:5178`
    - project_id: `0a521240-17c9-4142-af27-f6156b52633c`
    - source_id: `ebc56452-4465-46b6-94c0-e30a32447b5f`
    - default job: `d1ac8337-77d0-45c0-b573-7c22a2d1eb5d`
    - partial job: `eee1e975-f908-4911-96b4-0aa849912784`
    - invalid evidence job: `db559b68-4024-421f-86ee-6d6650c44f63`
    - missing fixture job: `f528956b-2c7d-44f2-82fd-bc221e6437b4`
    - retry job: `69c80c24-ee28-494b-a0f7-db9af7b43e6a`
  - actual browser route coverage:
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
  - browser screenshot/log artifacts:
    - `/tmp/ontology-wave11-frontend-smoke/mvp2-actual-api-smoke.json`
    - `/tmp/ontology-wave11-frontend-smoke/source-profile.png`
    - `/tmp/ontology-wave11-frontend-smoke/source-chunks.png`
    - `/tmp/ontology-wave11-frontend-smoke/job-monitor.png`
    - `/tmp/ontology-wave11-frontend-smoke/candidate-filters.png`
    - `/tmp/ontology-wave11-frontend-smoke/evidence-normal.png`
    - `/tmp/ontology-wave11-frontend-smoke/evidence-direct-missing.png`
- 실행하지 못한 검증:
  - Docker Compose smoke는 Frontend 범위가 아니며 실행하지 않았다. 기존 Docker CLI environment exception 유지.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - 신규 Backend endpoint, enum, DTO/schema 요구 없음.
  - actual smoke script는 기존 MVP 2 draft endpoint만 사용한다.
  - review/publish action UI, external LLM provider 설정 UI, RAG 화면은 추가하지 않았다.
- 영향받는 역할:
  - Backend: 없음.
  - QA: `npm run smoke:mvp2:actual`와 README 명령으로 frontend actual API browser smoke를 재실행 가능.

## Blocker
- product blocker 없음.
- `npm install` 후 기존 npm audit findings가 계속 표시된다.
  - `5 vulnerabilities (3 moderate, 1 high, 1 critical)`
  - Wave 5~10에서 dependency hardening follow-up으로 분리된 성격이며 이번 closeout product blocker로 보지 않았다.

## 남은 TODO
- QA가 Wave 11 closeout matrix 기준으로 independent regression을 수행한다.
- Browser smoke harness는 이제 frontend npm script로 고정했지만, 필요하면 후속 wave에서 Playwright Test suite 형태로 더 정규화할 수 있다.

## 다른 역할에 전달할 내용
- PM:
  - `CO-01`~`CO-09` frontend evidence는 actual API smoke와 browser screenshots 기준으로 대응 완료.
- Backend:
  - 신규 API 요구 없음. Frontend smoke는 기존 actual API contract로 통과했다.
- Frontend:
  - visible copy guard가 primary page source의 endpoint/debug 회귀를 잡는다.
- QA:
  - `apps/frontend/README.md`의 MVP 2 Actual API Smoke 섹션과 `/tmp/ontology-wave11-frontend-smoke` artifacts를 기준으로 재현 가능.

## 총괄에게 요청하는 결정
- QA가 동일 closeout matrix를 통과하면 Frontend 관점에서는 MVP 2 closeout `PASS` 판정을 요청한다.

## 현재 판정
- PASS
