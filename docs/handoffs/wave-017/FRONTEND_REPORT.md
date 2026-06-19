# Frontend Report - Wave 17

## 담당 범위
- backlog ID: support `FE3-001`, `FE3-002`, `FE3-005`, `FE3-006`, `FE3-007`, `FE3-008`, `INT3-006`
- 작업 경로:
  - `apps/frontend/scripts/mvp3-actual-api-smoke.mjs`
  - `apps/frontend/package.json`
  - `apps/frontend/src/shared/api/mvp3SmokeScript.test.ts`
  - `apps/frontend/src/shared/api/mvp3Mock.test.ts`
  - `apps/frontend/src/shared/api/types.ts`
  - `apps/frontend/src/shared/api/client.ts`
  - `apps/frontend/src/shared/mocks/mvp3Fixtures.ts`
  - `apps/frontend/src/pages/PublishQueuePage.tsx`
  - `apps/frontend/src/pages/ReviewInboxPage.tsx`
  - `apps/frontend/src/pages/ReviewWorkbenchPage.tsx`
  - `docs/handoffs/wave-017/FRONTEND_REPORT.md`

## 완료한 작업
- 필수 문서/입력 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-017/NEXT_ORDERS.md`
  - `docs/handoffs/wave-017/PM_REPORT.md`
  - `docs/handoffs/wave-017/BACKEND_REPORT.md`
  - `docs/handoffs/wave-016/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-016/QA_REPORT.md`
  - `/tmp/ontology-wave17-mvp3-seed.json`
  - `apps/frontend/package.json`
  - `02_FRONTEND_AGENT_SKILL.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- `npm run smoke:mvp3:actual` package script를 추가했다.
- `apps/frontend/scripts/mvp3-actual-api-smoke.mjs`를 추가했다.
  - env:
    - `MVP3_API_BASE_URL`
    - `MVP3_FRONTEND_BASE_URL`
    - `MVP3_SEED_JSON`, default `/tmp/ontology-wave17-mvp3-seed.json`
    - `MVP3_SMOKE_ARTIFACT_DIR`
  - seed JSON의 `project_id`, `review_task_id`, `recommended_frontend_routes`를 사용한다.
  - actual API seed precheck 후 5개 route를 Playwright로 렌더 검증하고 screenshot/JSON artifact를 남긴다.
- `mvp3SmokeScript.test.ts`를 추가해 smoke command/env/route marker가 유지되도록 했다.
- Actual API smoke 중 발견한 frontend actual DTO/view drift를 수정했다.
  - `/publish-candidates`는 actual OpenAPI 기준 `PublishEligibility[]`이므로 Frontend `PublishCandidate`를 `PublishEligibility` alias로 정리했다.
  - publish queue mock fixture와 page rendering을 top-level `eligible`, `reasons`, `has_evidence`, `has_warning_reason`에 맞췄다.
  - review inbox/workbench는 actual review list/detail의 lean fields(`status`, `top_validation_message`, `candidate_snapshot`, `corrections[]`, `decisions[]`)를 안전하게 렌더하도록 fallback을 추가했다.
- 기존 MVP3 mock route smoke가 계속 PASS하도록 mock fixture/test/page를 같이 맞췄다.

## 변경 파일
- `apps/frontend/package.json`
- `apps/frontend/scripts/mvp3-actual-api-smoke.mjs`
- `apps/frontend/src/shared/api/mvp3SmokeScript.test.ts`
- `apps/frontend/src/shared/api/mvp3Mock.test.ts`
- `apps/frontend/src/shared/api/types.ts`
- `apps/frontend/src/shared/api/client.ts`
- `apps/frontend/src/shared/mocks/mvp3Fixtures.ts`
- `apps/frontend/src/pages/PublishQueuePage.tsx`
- `apps/frontend/src/pages/ReviewInboxPage.tsx`
- `apps/frontend/src/pages/ReviewWorkbenchPage.tsx`
- `docs/handoffs/wave-017/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave17-mvp3-seed.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8017`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8017 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP3_API_BASE_URL=http://127.0.0.1:8017 MVP3_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP3_SEED_JSON=/tmp/ontology-wave17-mvp3-seed.json MVP3_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave17-mvp3-actual-smoke npm run smoke:mvp3:actual`
  - `cd apps/frontend && npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - Playwright one-off MVP3 mock route smoke for:
    - `/projects/project-corp-knowledge/review`
    - `/projects/project-corp-knowledge/review/review-task-clean-entity`
    - `/projects/project-corp-knowledge/publish`
    - `/projects/project-corp-knowledge/published-graph`
    - `/projects/project-corp-knowledge/quality`
  - `git diff --check -- apps/frontend docs/handoffs/wave-017/FRONTEND_REPORT.md`
- 결과:
  - `npm run test` PASS: `3 passed`, `8 tests`.
  - `npm run build` PASS: TypeScript and Vite production build completed.
  - MVP3 actual API smoke PASS:
    - artifact JSON: `/tmp/ontology-wave17-mvp3-actual-smoke/mvp3-actual-api-smoke.json`
    - screenshots:
      - `/tmp/ontology-wave17-mvp3-actual-smoke/review-inbox.png`
      - `/tmp/ontology-wave17-mvp3-actual-smoke/review-workbench.png`
      - `/tmp/ontology-wave17-mvp3-actual-smoke/publish-queue.png`
      - `/tmp/ontology-wave17-mvp3-actual-smoke/published-graph.png`
      - `/tmp/ontology-wave17-mvp3-actual-smoke/quality-dashboard.png`
    - API prechecks:
      - project `project-corp-knowledge`
      - review inbox `total_count=9`
      - workbench `review_task_id=155b3597-b6a3-4e45-b75d-4b1cfeba34be`
      - publish candidates `14`, publish jobs `1`
      - reason codes: `ALREADY_PUBLISHED`, `BROKEN_EVIDENCE`, `ELIGIBLE`, `FAILED_VALIDATION`, `MISSING_EVIDENCE`, `NEEDS_DISCUSSION`, `PENDING`, `REJECTED`, `WARNING_REASON_REQUIRED`
      - published graph `entities=2`, `relations=1`, current version `1`
      - quality total candidates `14`, published ratio `3/14`, `0.2143`
    - route assertions:
      - review inbox title, task queue marker, wrapped queue response
      - review workbench title, seeded task candidate, decision actions
      - publish queue title, candidate eligibility, all seeded reason codes
      - published graph title, `PUBLISHED FACTS`, current snapshot, published facts list, seeded fact
      - quality title, typed candidate/validation/review/publish metric groups, published ratio
  - MVP3 mock route smoke PASS:
    - artifact JSON: `/tmp/ontology-wave17-mvp3-mock-smoke/mvp3-mock-route-smoke.json`
    - route count: `5`
  - `git diff --check -- apps/frontend docs/handoffs/wave-017/FRONTEND_REPORT.md` PASS.
- 실행하지 못한 검증:
  - 없음.

## API/Enum/DTO 변경
- 변경 여부: 있음, Frontend DTO/view alignment only.
- 상세:
  - Backend files, OpenAPI artifact, product endpoint, enum은 변경하지 않았다.
  - `GET /api/v1/projects/{project_id}/publish-candidates` actual OpenAPI shape가 `PublishEligibility[]`임을 확인하고 Frontend `PublishCandidate`를 그 shape로 맞췄다.
  - Review list/detail은 actual API의 lean fields를 page fallback으로 렌더한다. Backend DTO를 mock-only shape로 가정하지 않는다.
- 영향받는 역할:
  - QA: actual smoke artifact를 그대로 재현 가능하다.
  - Backend: 추가 API 변경 요청 없음.
  - PM: 제품 정책 변경 없음. Harness/dev support 범위다.

## Blocker
- Frontend blocker 없음.
- Actual API route smoke blocker 없음. Seeded backend/frontend actual mode에서 5개 route PASS.

## 남은 TODO
- QA:
  - `/tmp/ontology-wave17-mvp3-actual-smoke/mvp3-actual-api-smoke.json`를 재현해 `INT3-003`, `INT3-004`, `INT3-006` actual route evidence로 확인한다.
- Frontend:
  - 후속 wave에서 Playwright one-off mock smoke도 npm script/Playwright Test suite로 formalize할 수 있다. Wave17 P0는 actual smoke command로 충족했다.

## 다른 역할에 전달할 내용
- PM:
  - Actual smoke harness는 QA/dev support이며 제품 정책 변경은 없다.
- Backend:
  - `/tmp/ontology-wave17-mvp3-seed.json`와 seeded SQLite DB를 사용해 frontend actual smoke가 PASS했다.
  - `publish-candidates` actual response는 `PublishEligibility[]`로 확인되었고 Frontend를 그 shape에 맞췄다.
- Frontend:
  - actual command:
    - `MVP3_API_BASE_URL=http://127.0.0.1:8017 MVP3_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP3_SEED_JSON=/tmp/ontology-wave17-mvp3-seed.json MVP3_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave17-mvp3-actual-smoke npm run smoke:mvp3:actual`
  - frontend actual dev server:
    - `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8017 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
- QA:
  - Actual smoke should fail early if seed JSON is missing, seeded API data is absent, reason codes are missing, published graph has no current facts, or quality lacks `published_ratio`.
  - Current artifacts are in `/tmp/ontology-wave17-mvp3-actual-smoke` and `/tmp/ontology-wave17-mvp3-mock-smoke`.

## 총괄에게 요청하는 결정
- Wave17 Frontend actual API smoke support를 PASS로 승인 요청.
- QA가 동일 seed/script로 actual route evidence를 재현하면 MVP3 actual frontend route smoke gate를 닫아도 된다.

## 현재 판정
- PASS
