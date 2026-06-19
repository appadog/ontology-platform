# Frontend Report - Wave 13

## 담당 범위
- backlog ID: `FE-012`, `FE2-001`, `FE2-002`, `FE2-003`, `FE2-004`, `FE2-005`, `FE2-006`, support `UX13-01`~`UX13-08`, `INT2-003`
- 작업 경로:
  - `apps/frontend/**`
  - `docs/handoffs/wave-013/FRONTEND_REPORT.md`

## 완료한 작업
- 필수 문서 확인:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-012/NEXT_ORDERS.md`
  - `docs/handoffs/wave-013/PM_REPORT.md`
  - `docs/pm/WAVE13_UIUX_REVIEW.md`
  - `02_FRONTEND_AGENT_SKILL.md`
  - `apps/frontend/README.md`
- 공통 compact workflow/stage primitive를 추가하고 Dashboard, Project detail, Source detail, Job monitor/list, Candidate results, Evidence viewer에 적용했다.
- Source detail에 `Readiness` 영역을 추가했다.
  - CSV/Excel은 `Profile / Preview`를 우선 action으로 보여준다.
  - TXT/PDF 계열은 `Chunks`를 우선 action으로 보여주도록 분기했다.
  - `Create job`은 readiness 이후 다음 action으로 배치했다.
- Candidate results를 review workspace로 정리했다.
  - desktop table은 유지하되 row primary content와 context를 보강했다.
  - mobile에서는 `CandidateCardList`로 entity/relation 후보를 카드형 list로 보여준다.
  - 후보명/endpoints, kind, validation status/code, confidence, evidence CTA, source/job/segment context를 card 안에서 바로 볼 수 있게 했다.
  - full ID와 raw payload는 `Technical details`로 낮췄다.
- Evidence viewer를 evidence-first reading order로 정리했다.
  - `Evidence reading`에서 candidate summary, validation, source, evidence text를 먼저 보여준다.
  - locator와 full IDs는 `Evidence locator` / `Technical details`로 분리했다.
  - normal, broken, direct missing recovery action을 유지했다.
- 주요 CTA와 설명 문구를 한국어 중심으로 정리하고 endpoint/debug/dev copy가 primary 화면에 나오지 않도록 visible-copy test를 보강했다.
- actual API smoke script에 `390x900` mobile screenshot과 document-level horizontal overflow check를 추가했다.

## UX13 자체 판정
- `UX13-01` Workflow Stage Pattern: PASS
  - Dashboard, Project detail, Source detail, Extraction Job, Candidate, Evidence에 공통 `WorkflowStage` 적용.
- `UX13-02` Source Readiness and Next Action: PASS
  - Source type별 priority와 readiness/next action hierarchy 반영.
- `UX13-03` Candidate Review Workspace: PASS
  - desktop table 유지, mobile card/list 추가, technical details 분리.
- `UX13-04` Evidence Reading Priority: PASS
  - evidence-first reading order와 recovery action 유지.
- `UX13-05` Copy and Terminology Cleanup: PASS
  - domain nouns 유지, 주 화면 설명/CTA 한국어 정리, visible copy guard 보강.
- `UX13-06` Visual Hierarchy and Rhythm: PASS
  - metric card 반복 축소, summary -> action -> review content -> technical details 흐름 강화.
- `UX13-07` Responsive Product Quality: PASS
  - smoke artifact에서 Source detail, Job monitor, Candidate review, Evidence reading 모두 `390x900` document overflow 없음.
- `UX13-08` Regression Preservation: PASS
  - 신규 Backend endpoint/DTO/enum 없음. test/build/actual smoke PASS.

## UX13-05 follow-up
- QA 판정:
  - QA는 기능/회귀는 PASS로 보았지만 `UX13-05 Copy and Terminology Cleanup`을 PARTIAL로 판정했다.
  - 지적 대상은 primary 화면의 mixed copy였다.
- 수정 내용:
  - `Create job`, `New job`, `Job inputs`, `Run context`, `Model runs` 등 CTA/섹션 문구를 `추출 작업 만들기`, `추출 입력`, `실행 맥락`, `실행 기록` 등으로 정리했다.
  - `Candidate results 열기`, `Candidate 열기`, `Open`, `Open chunks`, `Chunks 열기` 등 CTA를 `후보 결과 보기`, `구간 보기`로 정리했다.
  - `Profile`, `Profile 확인`, `Run profile` 계열 CTA를 `컬럼 프로파일`, `컬럼 프로파일 보기`, `프로파일 실행`으로 정리했다.
  - `endpoints`, `validation code`, `source evidence`, `prompt version`, `candidate extraction job`이 들어간 설명문을 사용자 언어로 풀어 썼다.
  - visible copy guard에 QA 지적 표현을 추가했고, 구현 전 RED 확인 후 GREEN으로 통과시켰다.
  - copy 변경에 맞춰 actual API smoke selector를 갱신했다.
- follow-up 판정:
  - `UX13-05` PASS.
  - API/Enum/DTO 변경 없음.

## 변경 파일
- `apps/frontend/src/pages/mvp2Shared.tsx`
- `apps/frontend/src/pages/DashboardPage.tsx`
- `apps/frontend/src/pages/ProjectDetailPage.tsx`
- `apps/frontend/src/pages/OntologyModelerPage.tsx`
- `apps/frontend/src/pages/SourceManagerPage.tsx`
- `apps/frontend/src/pages/SourceDetailPage.tsx`
- `apps/frontend/src/pages/SourceProfilingPage.tsx`
- `apps/frontend/src/pages/ExtractionJobCreatePage.tsx`
- `apps/frontend/src/pages/ExtractionJobMonitorPage.tsx`
- `apps/frontend/src/pages/CandidateResultsPage.tsx`
- `apps/frontend/src/pages/EvidenceViewerPage.tsx`
- `apps/frontend/src/pages/visibleCopy.test.ts`
- `apps/frontend/scripts/mvp2-actual-api-smoke.mjs`
- `docs/handoffs/wave-013/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/frontend && npm run test -- --run src/pages/visibleCopy.test.ts`
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave13-smoke.db .venv/bin/alembic upgrade head`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave13-smoke.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP2_API_BASE_URL=http://127.0.0.1:8000 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave13-frontend-smoke npm run smoke:mvp2:actual`
  - follow-up RED check: `cd apps/frontend && npm run test -- --run src/pages/visibleCopy.test.ts`
  - follow-up verification: `cd apps/frontend && npm run test`
  - follow-up verification: `cd apps/frontend && npm run build`
  - follow-up actual smoke:
    - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave13-copy-smoke.db .venv/bin/alembic upgrade head`
    - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave13-copy-smoke.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000`
    - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
    - `cd apps/frontend && MVP2_API_BASE_URL=http://127.0.0.1:8000 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave13-copy-smoke npm run smoke:mvp2:actual`
  - `git diff --check -- apps/frontend docs/handoffs/wave-013/FRONTEND_REPORT.md`
- 결과:
  - `npm run test -- --run src/pages/visibleCopy.test.ts`: PASS. 새 Wave 13 test는 구현 전 RED를 확인한 뒤 GREEN 통과.
  - `npm run test`: PASS. 1 file, 2 tests.
  - `npm run build`: PASS.
  - SQLite Alembic migration: PASS.
  - actual API smoke: PASS.
  - follow-up visible copy guard: PASS. QA 지적 표현 28개를 RED로 확인한 뒤 copy-only 수정 후 PASS.
  - follow-up actual API smoke: PASS. 변경된 selector와 `390x900` mobile overflow checks 통과.
  - `git diff --check`: PASS.
- Artifact path:
  - `/tmp/ontology-wave13-frontend-smoke/mvp2-actual-api-smoke.json`
  - `/tmp/ontology-wave13-frontend-smoke/source-profile.png`
  - `/tmp/ontology-wave13-frontend-smoke/source-chunks.png`
  - `/tmp/ontology-wave13-frontend-smoke/job-monitor.png`
  - `/tmp/ontology-wave13-frontend-smoke/candidate-filters.png`
  - `/tmp/ontology-wave13-frontend-smoke/evidence-normal.png`
  - `/tmp/ontology-wave13-frontend-smoke/evidence-direct-missing.png`
  - `/tmp/ontology-wave13-frontend-smoke/mobile-source-detail.png`
  - `/tmp/ontology-wave13-frontend-smoke/mobile-job-monitor.png`
  - `/tmp/ontology-wave13-frontend-smoke/mobile-candidate-review.png`
  - `/tmp/ontology-wave13-frontend-smoke/mobile-evidence-reading.png`
  - follow-up artifact:
    - `/tmp/ontology-wave13-copy-smoke/mvp2-actual-api-smoke.json`
    - `/tmp/ontology-wave13-copy-smoke/source-profile.png`
    - `/tmp/ontology-wave13-copy-smoke/source-chunks.png`
    - `/tmp/ontology-wave13-copy-smoke/job-monitor.png`
    - `/tmp/ontology-wave13-copy-smoke/candidate-filters.png`
    - `/tmp/ontology-wave13-copy-smoke/evidence-normal.png`
    - `/tmp/ontology-wave13-copy-smoke/evidence-direct-missing.png`
    - `/tmp/ontology-wave13-copy-smoke/mobile-source-detail.png`
    - `/tmp/ontology-wave13-copy-smoke/mobile-job-monitor.png`
    - `/tmp/ontology-wave13-copy-smoke/mobile-candidate-review.png`
    - `/tmp/ontology-wave13-copy-smoke/mobile-evidence-reading.png`
- 실행하지 못한 검증:
  - Docker Compose smoke는 기존 P1 environment exception으로 유지했다.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - 신규 Backend endpoint, DTO, enum 요구 없음.
  - actual smoke는 기존 MVP 2 API contract 위에서 실행했다.
- 영향받는 역할:
  - Backend: 추가 작업 없음.
  - QA: 위 artifact와 actual smoke 결과 기준으로 독립 검증 가능.

## Blocker
- 없음.
- 참고:
  - 최초 actual smoke 실행은 새 mobile card의 hidden badge와 desktop badge가 같은 text를 가져 smoke selector가 hidden element를 먼저 잡아 실패했다. selector를 `:visible`로 수정하고 재실행해 PASS 확인했다.
  - copy follow-up actual smoke 첫 실행은 `Missing or broken evidence` selector가 새 한국어 섹션명과 맞지 않아 실패했다. selector를 `누락되었거나 끊어진 Evidence`로 갱신하고 재실행해 PASS 확인했다.

## 남은 TODO
- QA가 copy follow-up 이후 `UX13-05`를 재확인한다.
- 후속 P1로 browser smoke harness를 Playwright Test suite로 정규화할 수 있다.

## 다른 역할에 전달할 내용
- PM:
  - Wave 13 acceptance는 Frontend 자체 판정 기준 PASS.
- Backend:
  - API/Enum/DTO blocker 없음. Backend work 불필요.
- Frontend:
  - `WorkflowStage`는 `mvp2Shared.tsx`에 두었고, MVP 2 demo path 화면에서 재사용 가능하다.
- QA:
  - `/tmp/ontology-wave13-copy-smoke/mvp2-actual-api-smoke.json`의 `mobileChecks`에 copy follow-up 이후 `390x900` overflow 결과가 있다.
  - Candidate mobile card는 desktop table과 같은 데이터를 중복 렌더링하므로 visible selector는 `:visible` 또는 viewport별 selector를 사용해야 한다.

## 총괄에게 요청하는 결정
- QA subagent가 copy follow-up만 재확인해 달라.
- QA가 `UX13-05` PASS로 재판정하면 Wave 13을 Frontend product polish PASS로 닫아도 된다.

## 현재 판정
- PASS
