# Frontend / UIUX Hardening Report - Wave 21

## 담당 범위
- backlog ID:
  - `INT4-005` Search/RAG grounding UI marker hardening
  - `INT4-006` Published graph explorer separation marker hardening
  - `INT4-007` MVP3 actual smoke regression guard
  - Frontend regression for `FE4-001`~`FE4-007`
- 작업 경로:
  - `apps/frontend/src/pages/*`
  - `apps/frontend/src/shared/api/*`
  - `apps/frontend/scripts/*`
  - `apps/frontend/package.json`
  - `docs/handoffs/wave-021/FRONTEND_REPORT.md`

## 완료한 작업
- Wave20 QA FAIL 중 Frontend smoke/actual marker 문제를 hardening했다.
- `npm run smoke:mvp3:actual` 회귀를 복구했다.
  - `/projects/:projectId/published-graph`의 MVP4 explorer에 legacy `Review to published facts`, `PUBLISHED FACTS`, `Current snapshot`, `Published entities and relations` markers를 보존했다.
  - `/projects/:projectId/quality`의 MVP4 advanced metrics 화면에 MVP3 summary compatibility layer를 추가해 `Candidates`, `Validation`, `Review`, `Publish`, `Published ratio · n/d` markers를 보존했다.
  - MVP4 metric group heading 중 `Validation`/`Review`는 `Validation metrics`/`Review metrics`로 구체화해 Playwright strict heading 충돌을 제거했다.
- actual route markers를 보강했다.
  - RAG route: `Grounded RAG` marker와 candidate exclusion copy를 노출.
  - Graph route: `SAFE TOO LARGE`, `Published-only graph state`, `PUBLISHED ONLY`, `PUBLISHED FACTS` markers 노출.
  - Prompt route: telemetry field가 `null` 또는 absent일 때 `Telemetry unavailable` 노출.
  - External API route: `DEV_AUTH`와 lowercase `read-only` copy 노출.
- actual external docs page가 Backend external read endpoint를 조회할 때 `X-Dev-Auth: mvp4-dev` 헤더를 보내도록 보강했다.
- `smoke:mvp4:actual` package script를 추가했다.
  - Backend actual API precheck: project, quality metrics, `SAFE_TOO_LARGE` graph, candidate-only RAG insufficient evidence, prompt rows, external `DEV_AUTH`.
  - Browser route checks: quality, RAG, published graph, prompt performance, external API docs route 200과 marker assertions.
- `smoke:mvp4:mock`도 같은 marker 계약을 보도록 강화했다.
- global LNB 변경 없음. MVP4 routes는 project-scoped 유지. Weighted composite score, collaboration/SLA UI 추가 없음.

## 변경 파일
- `apps/frontend/package.json`
- `apps/frontend/scripts/mvp4-actual-api-smoke.mjs`
- `apps/frontend/scripts/mvp4-mock-route-smoke.mjs`
- `apps/frontend/src/pages/PublishedGraphExplorerPage.tsx`
- `apps/frontend/src/pages/QualityDashboardPage.tsx`
- `apps/frontend/src/pages/RagAnswerWorkspacePage.tsx`
- `apps/frontend/src/pages/PromptPerformancePage.tsx`
- `apps/frontend/src/pages/ExternalApiDocsPage.tsx`
- `apps/frontend/src/shared/api/client.ts`
- `docs/handoffs/wave-021/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP4_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave21-mvp4-mock-smoke npm run smoke:mvp4:mock`
  - `cd apps/backend && rm -f /tmp/ontology-wave21-seed.db /tmp/ontology-wave21-seed.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave21-seed.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave21-seed.db .venv/bin/python scripts/seed_mvp4.py --output /tmp/ontology-wave21-seed.json`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave21-seed.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8014`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8014 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP3_API_BASE_URL=http://127.0.0.1:8014 MVP3_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP3_SEED_JSON=/tmp/ontology-wave21-seed.json MVP3_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave21-mvp3-actual-smoke npm run smoke:mvp3:actual`
  - `cd apps/frontend && MVP4_API_BASE_URL=http://127.0.0.1:8014 MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP4_SEED_JSON=/tmp/ontology-wave21-seed.json MVP4_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave21-mvp4-actual-smoke npm run smoke:mvp4:actual`
  - `git diff --check -- apps/frontend/src/pages apps/frontend/src/shared/api apps/frontend/src/shared/mocks apps/frontend/scripts apps/frontend/package.json docs/handoffs/wave-021/FRONTEND_REPORT.md`
  - `git diff --no-index --check /dev/null apps/frontend/scripts/mvp4-actual-api-smoke.mjs`
  - `git diff --no-index --check /dev/null docs/handoffs/wave-021/FRONTEND_REPORT.md`
- 결과:
  - `npm run test`: PASS, 4 files / 10 tests.
  - `npm run build`: PASS.
  - `smoke:mvp4:mock`: PASS.
    - artifact: `/tmp/ontology-wave21-mvp4-mock-smoke/mvp4-mock-route-smoke.json`
  - MVP4 seed creation: PASS.
    - seed: `/tmp/ontology-wave21-seed.json`
  - `smoke:mvp3:actual`: PASS.
    - artifact: `/tmp/ontology-wave21-mvp3-actual-smoke/mvp3-actual-api-smoke.json`
    - routes passed: review inbox, review workbench, publish queue, published graph, quality dashboard.
  - `smoke:mvp4:actual`: PASS.
    - artifact: `/tmp/ontology-wave21-mvp4-actual-smoke/mvp4-actual-api-smoke.json`
    - API checks passed: quality 7 groups, graph `SAFE_TOO_LARGE`, RAG `INSUFFICIENT_EVIDENCE`, prompt rows, external `DEV_AUTH`.
    - routes passed: quality, RAG, published graph, prompt performance, external API docs.
  - `git diff --check`: PASS after report write.
- 실행하지 못한 검증:
  - 없음.

## API/Enum/DTO 변경
- 변경 여부: 있음, Frontend client/smoke only.
- 상세:
  - `request<T>` helper가 optional `RequestInit`을 받을 수 있게 됐다.
  - actual external docs metadata read에 `X-Dev-Auth: mvp4-dev` header를 추가했다.
  - Backend API path, enum, DTO schema는 변경하지 않았다.
- 영향받는 역할:
  - Backend: external docs page now calls current external graph metadata with the documented dev-auth header.
  - QA: `npm run smoke:mvp4:actual` can replace the Wave20 one-off route probe for the covered markers and route 200 assertions.

## Blocker
- Frontend blocker 없음.
- Backend parallel blocker였던 external source/evidence 500은 Frontend가 수정하지 않았다. 이 Frontend smoke는 external docs current graph metadata와 UI marker를 검증한다.

## 남은 TODO
- QA가 Wave21 Backend fix 이후 `INT4-008` external source/evidence read checks를 별도로 재검증해야 한다.
- Broader Playwright suite formalization은 기존 P1 tooling follow-up으로 유지한다.

## 다른 역할에 전달할 내용
- PM:
  - Scope expansion 없음. Weighted composite score, collaboration/SLA, production API key UI를 추가하지 않았다.
- Backend:
  - Frontend actual external docs read는 `X-Dev-Auth: mvp4-dev`를 사용한다.
  - `smoke:mvp4:actual` API precheck는 graph current external endpoint만 확인한다. Source/evidence external 200은 Backend/QA smoke가 별도로 닫아야 한다.
- Frontend:
  - MVP3 legacy markers are intentionally preserved inside upgraded MVP4 routes.
  - Quality route now renders MVP3 summary compatibility plus MVP4 advanced metrics.
- QA:
  - Run actual frontend smoke with:
    - backend seeded DB on `8014`
    - actual frontend on `5173` with `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8014`
    - `MVP4_API_BASE_URL=http://127.0.0.1:8014 MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP4_SEED_JSON=/tmp/ontology-wave21-seed.json npm run smoke:mvp4:actual`

## 총괄에게 요청하는 결정
- 추가 결정 요청 없음.
- Frontend side of `INT4-005`, `INT4-006`, and `INT4-007` is ready for QA targeted rerun.

## 현재 판정
- PASS
