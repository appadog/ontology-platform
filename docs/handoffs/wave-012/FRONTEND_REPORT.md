# Frontend Report - Wave 12

## 담당 범위
- backlog ID: `FE-012`, `FE2-001`, `FE2-002`, `FE2-003`, `FE2-004`, `FE2-005`, `FE2-006`, support `INT2-003`
- 작업 경로: `apps/frontend/**`, `docs/handoffs/wave-012/FRONTEND_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-011/NEXT_ORDERS.md`
  - `docs/handoffs/wave-012/PM_REPORT.md`
  - `docs/pm/MVP2_PREP_BRIEF.md`의 `Wave 12 Frontend Productization Acceptance`
  - `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`의 `Wave 12 Productization Overlay`
  - `docs/backlog/MVP2_DRAFT_BACKLOG.md`의 `Wave 12 Frontend Productization Scope`
  - `02_FRONTEND_AGENT_SKILL.md`
  - `apps/frontend/README.md`
- Dashboard와 Project detail에서 개발/API boundary 중심 문구를 제거하고, project -> ontology draft -> source -> extraction -> candidate evidence 흐름을 compact path와 primary action으로 표시했다.
- Source list에 project breadcrumb와 row-level next action을 보강했다.
- Extraction job create/monitor copy와 action hierarchy를 정리하고, job monitor에서 source/job/candidate context와 candidates CTA를 더 명확히 했다.
- Candidate results에 kind, validation status/code, evidence presence, confidence, source/job/segment context를 비교하기 쉬운 컬럼과 detail panel로 보강했다.
- Candidate raw payload와 Evidence metadata는 QA 재현용 technical details로 접어 사용자 주 화면에서 낮췄다.
- Evidence viewer에 candidate context, locator, evidence text, recovery actions를 분리해 normal/direct missing/broken path 모두에서 복구 동선을 유지했다.
- 공통 `mvp2Shared` responsive primitive, `PageHeader`, `AppShell` wrapping을 보강해 desktop/mobile-ish viewport에서 버튼, breadcrumb, table, key-value panel이 겹치지 않게 했다.
- visible-copy regression test 범위를 Dashboard, job, candidate, evidence까지 확장했다.
- actual API smoke selector를 새 product copy(`Run context`)에 맞춰 갱신했다.
- QA `PX-06` PARTIAL follow-up을 같은 wave에서 보강했다.
  - `HanaCard` grid item이 내부 wide table의 min-content 폭을 따라 문서 전체를 밀지 않도록 `min-width: 0`, `max-width: 100%`를 적용했다.
  - `Breadcrumbs`, `PageHeader`, `TableWrap`, shared action link primitives에 mobile overflow containment와 wrapping을 보강했다.
  - Candidate/source/profile/job/evidence mobile-ish viewport에서 document-level horizontal overflow가 없는지 재검증했다.

## 변경 파일
- `apps/frontend/src/pages/DashboardPage.tsx`
- `apps/frontend/src/pages/ProjectDetailPage.tsx`
- `apps/frontend/src/pages/SourceManagerPage.tsx`
- `apps/frontend/src/pages/ExtractionJobCreatePage.tsx`
- `apps/frontend/src/pages/ExtractionJobMonitorPage.tsx`
- `apps/frontend/src/pages/CandidateResultsPage.tsx`
- `apps/frontend/src/pages/EvidenceViewerPage.tsx`
- `apps/frontend/src/pages/mvp2Shared.tsx`
- `apps/frontend/src/pages/visibleCopy.test.ts`
- `apps/frontend/src/shared/ui/hana/HanaCard.tsx`
- `apps/frontend/src/shared/layout/AppShell.tsx`
- `apps/frontend/src/shared/layout/Breadcrumbs.tsx`
- `apps/frontend/src/shared/layout/PageHeader.tsx`
- `apps/frontend/scripts/mvp2-actual-api-smoke.mjs`
- `docs/handoffs/wave-012/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave12-smoke.sqlite LOCAL_STORAGE_PATH=/tmp/ontology-wave12-smoke-storage CORS_ORIGINS='["http://127.0.0.1:5173","http://localhost:5173"]' .venv/bin/alembic upgrade head`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave12-smoke.sqlite LOCAL_STORAGE_PATH=/tmp/ontology-wave12-smoke-storage CORS_ORIGINS='["http://127.0.0.1:5173","http://localhost:5173"]' .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP2_API_BASE_URL=http://127.0.0.1:8000 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave12-frontend-smoke npm run smoke:mvp2:actual`
  - mobile-ish Playwright screenshot capture at `390x900` for source detail, job monitor, candidates, normal evidence, missing evidence.
  - QA follow-up responsive fix verification:
    - `cd apps/frontend && npm run test`
    - `cd apps/frontend && npm run build`
    - `MVP2_API_BASE_URL=http://127.0.0.1:8022 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5176 MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave12-responsive-fix-smoke npm run smoke:mvp2:actual`
    - 390x900 Playwright DOM/screenshot checks for candidates, source, profile, chunks, job, evidence.
  - `git diff --check -- apps/frontend docs/handoffs/wave-012/FRONTEND_REPORT.md`
- 결과:
  - `npm run test`: PASS, `src/pages/visibleCopy.test.ts` 1 test passed.
  - `npm run build`: PASS, TypeScript and Vite build passed.
  - Alembic SQLite migration: PASS.
  - actual API smoke: PASS.
    - artifact: `/tmp/ontology-wave12-frontend-smoke/mvp2-actual-api-smoke.json`
    - desktop screenshots:
      - `/tmp/ontology-wave12-frontend-smoke/source-profile.png`
      - `/tmp/ontology-wave12-frontend-smoke/source-chunks.png`
      - `/tmp/ontology-wave12-frontend-smoke/job-monitor.png`
      - `/tmp/ontology-wave12-frontend-smoke/candidate-filters.png`
      - `/tmp/ontology-wave12-frontend-smoke/evidence-normal.png`
      - `/tmp/ontology-wave12-frontend-smoke/evidence-direct-missing.png`
    - mobile-ish screenshots:
      - `/tmp/ontology-wave12-frontend-smoke/mobile-source-detail.png`
      - `/tmp/ontology-wave12-frontend-smoke/mobile-job-monitor.png`
      - `/tmp/ontology-wave12-frontend-smoke/mobile-candidates.png`
      - `/tmp/ontology-wave12-frontend-smoke/mobile-evidence-normal.png`
      - `/tmp/ontology-wave12-frontend-smoke/mobile-evidence-missing.png`
  - `git diff --check`: PASS.
- QA follow-up responsive fix results:
  - `npm run test`: PASS.
  - `npm run build`: PASS.
  - actual API smoke: PASS.
  - mobile DOM artifact: `/tmp/ontology-wave12-responsive-fix-smoke/mobile-dom-check.json`
  - candidates/source/profile/chunks/job/evidence at `390x900` all reported `documentElement.scrollWidth=390`, `bodyScrollWidth=390`, `hasPageOverflow=false`.
  - final mobile screenshots:
    - `/tmp/ontology-wave12-responsive-fix-smoke/mobile-candidates-final.png`
    - `/tmp/ontology-wave12-responsive-fix-smoke/mobile-source-final.png`
    - `/tmp/ontology-wave12-responsive-fix-smoke/mobile-profile-final.png`
    - `/tmp/ontology-wave12-responsive-fix-smoke/mobile-chunks-final.png`
    - `/tmp/ontology-wave12-responsive-fix-smoke/mobile-job-final.png`
    - `/tmp/ontology-wave12-responsive-fix-smoke/mobile-evidence-final.png`
- 실행 중 발견/조치:
  - `npm run test -- --runInBand`는 Vitest 미지원 옵션으로 실패했으나, 정식 `npm run test`는 PASS.
  - 5173 포트를 기존 Vite server가 사용 중이어서 actual API mode로 재시작했다. 5174에서는 backend CORS origin mismatch가 발생하므로 최종 smoke는 5173에서 수행했다.
- 실행하지 못한 검증:
  - Docker Compose smoke는 이번 Frontend 범위 밖이며 기존 Wave 11 environment exception을 유지한다.

## Productization Overlay 자체 판정
- `PX-01` App shell/navigation hierarchy: PASS
  - LNB는 top-level 업무 영역만 유지했고, ID-bound source/job/candidate/evidence는 row/action/breadcrumb drilldown으로 유지했다.
- `PX-02` Project context/breadcrumb: PASS
  - project-scoped source/extraction/candidate/evidence route에 breadcrumb/context link와 recovery action을 유지했다.
- `PX-03` Page primary action/next action: PASS
  - Dashboard, Project, Source, Extraction, Candidate, Evidence에 primary/next/recovery action을 보강했다.
- `PX-04` Source-to-evidence workflow comprehension: PASS
  - project에서 ontology/source/job/candidate/evidence로 이어지는 compact path, row action, header CTA를 보강했고 endpoint 설명 없이 smoke path가 통과했다.
- `PX-05` Candidate/evidence inspection density: PASS
  - candidate table에 kind/status/code/evidence/context를 비교 가능하게 노출하고, evidence viewer에 locator/candidate context/recovery를 분리했다.
- `PX-06` Responsive layout: PASS after QA follow-up fix
  - desktop actual smoke와 mobile-ish screenshot capture에서 LNB, breadcrumbs, filters, tables, buttons, evidence text 겹침을 확인하지 못했다. 좁은 viewport table은 local horizontal scroll container로 보존했고, document-level horizontal overflow는 제거했다.
- `PX-07` Visual style guardrail: PASS
  - landing/marketing hero, decorative gradient/orb, card-in-card 추가 없음. 개발/API boundary copy를 제거하거나 technical details로 낮췄다.
- `PX-08` Regression preservation: PASS
  - `npm run build`, `npm run test`, actual API smoke PASS. Wave 11 smoke behavior를 유지했다.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - 신규 Backend endpoint, DTO, enum 요구 없음.
  - review/publish, external LLM, RAG UI를 추가하지 않았다.
  - provider literal `mock`와 MockProvider display label 정책 유지.
- 영향받는 역할:
  - Backend: 추가 작업 없음.
  - QA: `/tmp/ontology-wave12-frontend-smoke` artifact와 `PX-01`~`PX-08` 기준으로 browser QA 수행 가능.

## Blocker
- Product blocker 없음.
- Docker Compose smoke는 기존 environment exception 유지.

## 남은 TODO
- QA:
  - 실제 브라우저에서 `/tmp/ontology-wave12-frontend-smoke` artifact와 route를 기준으로 Wave 12 productization overlay를 독립 검증한다.
  - 필요하면 mobile-ish table horizontal scroll UX를 추가로 확인한다.
- Frontend:
  - QA가 발견하는 copy/layout regression만 후속 수정한다.

## 다른 역할에 전달할 내용
- PM:
  - PM이 정의한 Wave 12 productization acceptance는 Frontend 자체 판정 기준 전부 PASS.
- Backend:
  - API/Enum/DTO 변경 요청 없음. Backend 대기 상태 유지 가능.
- Frontend:
  - actual API smoke script selector가 `Run context` copy에 맞춰 갱신되어 있다.
- QA:
  - 최종 actual API smoke artifact: `/tmp/ontology-wave12-frontend-smoke/mvp2-actual-api-smoke.json`
  - desktop/mobile-ish screenshot artifact는 같은 디렉터리에 있다.

## 총괄에게 요청하는 결정
- QA subagent를 실행해 Wave 12 `PX-01`~`PX-08` browser acceptance와 Wave 11 regression preservation을 독립 판정해 달라.
- Backend subagent는 현재 실행하지 않는 결정을 유지해도 된다.

## 현재 판정
- PASS
