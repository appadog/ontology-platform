# QA Report - Wave 13

## 담당 범위
- backlog ID: `INT2-003`, support `FE-012`, `FE2-001`, `FE2-002`, `FE2-003`, `FE2-004`, `FE2-005`, `FE2-006`, `UX13-01`~`UX13-08`
- 작업 경로:
  - 읽기/검증: `apps/frontend/**`, `apps/backend/**`, `/tmp/ontology-wave13-frontend-smoke`, `/tmp/ontology-wave13-qa-smoke`
  - 보고서 작성: `docs/handoffs/wave-013/QA_REPORT.md`

## 완료한 작업
- 필수 문서 확인:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-012/NEXT_ORDERS.md`
  - `docs/handoffs/wave-013/PM_REPORT.md`
  - `docs/handoffs/wave-013/FRONTEND_REPORT.md`
  - `docs/pm/WAVE13_UIUX_REVIEW.md`
  - `docs/backlog/MVP2_DRAFT_BACKLOG.md`
  - `apps/frontend/README.md`
- Frontend report와 `/tmp/ontology-wave13-frontend-smoke` 산출물을 확인했다.
- QA fresh artifact directory `/tmp/ontology-wave13-qa-smoke`를 만들고 fresh SQLite DB 기반 actual API smoke를 재실행했다.
- `390x900` mobile screenshots에서 Source detail, Job monitor, Candidate results, Evidence viewer를 확인했다.
- Evidence normal, broken, direct missing recovery를 확인했다.
  - normal/direct missing은 actual smoke 기본 screenshot으로 확인.
  - broken evidence는 QA가 별도 screenshot/DOM artifact를 추가 생성해 recovery action과 overflow를 확인.
- `hana-style-component` 직접 import, API contract diff, endpoint/debug/dev 중심 문구를 guardrail로 확인했다.
- UX13-05 copy follow-up 이후 `/tmp/ontology-wave13-copy-smoke`와 fresh QA recheck `/tmp/ontology-wave13-copy-qa-smoke`를 확인했다.
- 기존 PARTIAL 지적 copy가 product 화면에서 제거되었는지 DOM/screenshot/source grep으로 재확인했다.

### UX13 acceptance 판정
- `UX13-01` Workflow Stage Pattern: PASS
  - Source detail, Job monitor, Candidate results, Evidence viewer 등에서 `Project -> Ontology -> Source -> Extraction -> Candidates -> Evidence` 단계가 같은 구조로 표시된다.
  - 현재/완료/다음/준비 상태가 stage box와 status text로 구분된다.
- `UX13-02` Source Readiness and Next Action: PASS
  - Source detail에서 readiness와 next step이 분리되어 보이고, CSV source는 `Profile / Preview` 우선 흐름을 제공한다.
  - `Chunks`, `Extraction`, sample rows도 mobile에서 document-level overflow 없이 표시된다.
- `UX13-03` Candidate Review Workspace: PASS
  - desktop은 table + detail panel 구조를 유지한다.
  - mobile은 candidate card/list로 후보명, kind, validation, confidence, evidence action, source/job/segment context를 local table scroll 없이 읽을 수 있다.
- `UX13-04` Evidence Reading Priority: PASS
  - normal/broken evidence에서 `Evidence reading -> Evidence locator -> Recovery actions -> Technical details` 순서가 유지된다.
  - direct missing evidence도 crash 없이 context, validation code, recovery actions를 유지한다.
- `UX13-05` Copy and Terminology Cleanup: PASS after follow-up recheck
  - 기존 PARTIAL 지적 대상인 `Create job`, `Candidate results 열기`, `endpoints`, `validation code`, `source evidence`, `Ontology와 prompt...job`류 primary copy는 follow-up 후 렌더링된 주요 화면에서 재발견되지 않았다.
  - endpoint/debug/API URL 중심 primary copy도 계속 보이지 않는다.
  - `Project`, `Ontology`, `Source`, `Extraction`, `Candidate`, `Evidence` 같은 domain noun과 enum/status chip literal은 acceptance 허용 범위로 보았다.
- `UX13-06` Visual Hierarchy and Rhythm: PASS
  - 주요 화면은 summary/action/review/technical details 순서가 이전보다 분명하다.
  - decorative hero, gradient/orb/background illustration은 없다.
  - Source readiness/next steps 내부의 bordered action blocks는 card-like하게 보이지만, 현재 QA 기준에서는 blocker로 보지 않았다.
- `UX13-07` Responsive Product Quality: PASS
  - QA smoke JSON의 `390x900` checks에서 Source detail, Job monitor, Candidate review, Evidence reading 모두 `innerWidth=390`, `scrollWidth=390`, `bodyScrollWidth=390`.
  - Candidate/Evidence 핵심 판단 정보는 local table scroll 없이 읽힌다.
- `UX13-08` Regression Preservation: PASS
  - `npm run test`, `npm run build`, actual API smoke PASS.
  - 신규 Backend endpoint/DTO/enum 요구 또는 API contract diff 없음.

## UX13-05 follow-up recheck
- Frontend follow-up 확인:
  - `docs/handoffs/wave-013/FRONTEND_REPORT.md` 최신본에서 `UX13-05 follow-up` 섹션과 copy 변경 내역을 확인했다.
  - Frontend artifact `/tmp/ontology-wave13-copy-smoke`를 확인했다.
- QA fresh recheck:
  - fresh artifact directory: `/tmp/ontology-wave13-copy-qa-smoke`
  - fresh DB: `/tmp/ontology-wave13-copy-qa-smoke.db`
  - `npm run test`, `npm run build`, SQLite migration, actual API smoke를 재실행했다.
  - actual API smoke는 PASS했고, `390x900` mobile checks는 Source detail, Job monitor, Candidate review, Evidence reading 모두 `scrollWidth=390`, `bodyScrollWidth=390`으로 PASS.
- Targeted copy DOM recheck:
  - artifact: `/tmp/ontology-wave13-copy-qa-smoke/copy-recheck-dom.json`
  - 대상 route 8개:
    - Source detail
    - Source profile
    - Source chunks
    - Job monitor
    - Candidate results
    - Evidence normal
    - Evidence broken
    - Evidence direct missing
  - 금지/재발 확인 문자열:
    - `Create job`
    - `Candidate results 열기`
    - `Candidate 열기`
    - `Open chunks`
    - `Chunks 열기`
    - `endpoints`
    - `validation code`
    - `source evidence`
    - `Ontology와 prompt`
    - `prompt를 선택해 job`
    - `/api/v1`
    - `endpoint boundary`
    - `debug`
  - 결과: `anyForbiddenHit=false`.
- Source grep recheck:
  - product page/layout 영역에서는 위 문자열이 발견되지 않았다.
  - 해당 문자열은 `apps/frontend/src/pages/visibleCopy.test.ts`의 forbidden-pattern guard에만 남아 있다.
- Screenshot recheck:
  - `/tmp/ontology-wave13-copy-qa-smoke/mobile-source-detail.png`: `추출 작업 만들기`, `컬럼 프로파일`, `구간 보기`로 정리됨.
  - `/tmp/ontology-wave13-copy-qa-smoke/mobile-job-monitor.png`: `후보 결과 보기`, `실행 맥락`, `실행 기록`으로 정리됨.
  - `/tmp/ontology-wave13-copy-qa-smoke/mobile-candidate-review.png`: filter 설명은 한국어 중심으로 정리되었고 기존 `validation code` 표현은 `검증 코드`로 정리됨.
  - `/tmp/ontology-wave13-copy-qa-smoke/mobile-evidence-broken.png`: broken evidence에서도 `Evidence 읽기`, `Evidence 위치`, `복구 동선`, `구간 보기` 흐름이 유지됨.
- UX13-05 최종 판정:
  - PASS.

## 변경 파일
- `docs/handoffs/wave-013/QA_REPORT.md`
- product code 변경 없음.
- `/tmp/ontology-wave13-qa-smoke`에 QA 검증 artifact 생성.
- `/tmp/ontology-wave13-copy-qa-smoke`에 UX13-05 follow-up QA 검증 artifact 생성.

## 실행/검증
- 실행한 명령:
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave13-qa-smoke.db .venv/bin/alembic upgrade head`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave13-qa-smoke.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP2_API_BASE_URL=http://127.0.0.1:8000 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave13-qa-smoke npm run smoke:mvp2:actual`
  - QA 추가 broken evidence check:
    - Playwright headless로 actual smoke의 broken evidence route를 열고 `/tmp/ontology-wave13-qa-smoke/mobile-evidence-broken.png`, `/tmp/ontology-wave13-qa-smoke/evidence-broken-dom.json` 생성.
  - `rg "from ['\"]hana-style-component|from ['\"]@?hana" apps/frontend/src/pages apps/frontend/src/shared/layout apps/frontend/src/features apps/frontend/src/app`
  - `rg -n "endpoint|debug|dev|localhost|/api/v1" apps/frontend/src/pages apps/frontend/src/shared/layout apps/frontend/src/features apps/frontend/src/app`
  - `git diff -- apps/frontend/src/shared/api apps/frontend/src/pages/mvp2Types.ts apps/frontend/src/shared/mocks docs/api`
  - UX13-05 follow-up fresh recheck:
    - `cd apps/frontend && npm run test`
    - `cd apps/frontend && npm run build`
    - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave13-copy-qa-smoke.db .venv/bin/alembic upgrade head`
    - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave13-copy-qa-smoke.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000`
    - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
    - `cd apps/frontend && MVP2_API_BASE_URL=http://127.0.0.1:8000 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave13-copy-qa-smoke npm run smoke:mvp2:actual`
    - Playwright headless targeted DOM recheck across 8 actual routes, writing `/tmp/ontology-wave13-copy-qa-smoke/copy-recheck-dom.json` and `/tmp/ontology-wave13-copy-qa-smoke/mobile-evidence-broken.png`.
    - `rg -n "Create job|Candidate results 열기|Candidate 열기|Open chunks|Chunks 열기|endpoints|validation code|source evidence|Ontology와 prompt|prompt를 선택해 job|endpoint boundary|debug|/api/v1|localhost" apps/frontend/src/pages apps/frontend/src/shared/layout apps/frontend/src/features apps/frontend/src/app`
- 결과:
  - `npm run test`: PASS. 1 file, 2 tests.
  - `npm run build`: PASS.
  - SQLite Alembic migration: PASS.
  - actual API smoke: PASS.
  - broken evidence 추가 check: PASS.
    - `hasRecoveryActions=true`
    - `hasValidationCode=true`
    - `innerWidth=390`, `scrollWidth=390`, `bodyScrollWidth=390`
  - `hana-style-component` direct import search: PASS. 결과 없음.
  - API contract diff check: PASS. 결과 없음.
  - 초기 Wave 13 visible copy grep:
    - primary endpoint/debug/API URL 노출은 발견하지 못했다.
    - copy polish 잔여 항목으로 `endpoints`, `validation code`, `source evidence`, `dev-admin` user label, mixed English/Korean CTA를 확인했고, 이 근거로 최초 `UX13-05`를 PARTIAL 판정했다.
  - UX13-05 follow-up `npm run test`: PASS. 1 file, 2 tests.
  - UX13-05 follow-up `npm run build`: PASS.
  - UX13-05 follow-up SQLite Alembic migration: PASS.
  - UX13-05 follow-up actual API smoke: PASS.
  - UX13-05 follow-up targeted DOM recheck: PASS. 8 routes checked, `anyForbiddenHit=false`.
  - UX13-05 follow-up source grep: PASS. 기존 지적 문자열은 `visibleCopy.test.ts` guard 외 product page/layout에서 발견되지 않음.
- Artifact path:
  - `/tmp/ontology-wave13-qa-smoke/mvp2-actual-api-smoke.json`
  - `/tmp/ontology-wave13-qa-smoke/source-profile.png`
  - `/tmp/ontology-wave13-qa-smoke/source-chunks.png`
  - `/tmp/ontology-wave13-qa-smoke/job-monitor.png`
  - `/tmp/ontology-wave13-qa-smoke/candidate-filters.png`
  - `/tmp/ontology-wave13-qa-smoke/evidence-normal.png`
  - `/tmp/ontology-wave13-qa-smoke/evidence-direct-missing.png`
  - `/tmp/ontology-wave13-qa-smoke/mobile-source-detail.png`
  - `/tmp/ontology-wave13-qa-smoke/mobile-job-monitor.png`
  - `/tmp/ontology-wave13-qa-smoke/mobile-candidate-review.png`
  - `/tmp/ontology-wave13-qa-smoke/mobile-evidence-reading.png`
  - `/tmp/ontology-wave13-qa-smoke/mobile-evidence-broken.png`
  - `/tmp/ontology-wave13-qa-smoke/evidence-broken-dom.json`
  - `/tmp/ontology-wave13-copy-smoke/mvp2-actual-api-smoke.json`
  - `/tmp/ontology-wave13-copy-smoke/mobile-source-detail.png`
  - `/tmp/ontology-wave13-copy-smoke/mobile-job-monitor.png`
  - `/tmp/ontology-wave13-copy-smoke/mobile-candidate-review.png`
  - `/tmp/ontology-wave13-copy-smoke/mobile-evidence-reading.png`
  - `/tmp/ontology-wave13-copy-qa-smoke/mvp2-actual-api-smoke.json`
  - `/tmp/ontology-wave13-copy-qa-smoke/source-profile.png`
  - `/tmp/ontology-wave13-copy-qa-smoke/source-chunks.png`
  - `/tmp/ontology-wave13-copy-qa-smoke/job-monitor.png`
  - `/tmp/ontology-wave13-copy-qa-smoke/candidate-filters.png`
  - `/tmp/ontology-wave13-copy-qa-smoke/evidence-normal.png`
  - `/tmp/ontology-wave13-copy-qa-smoke/evidence-direct-missing.png`
  - `/tmp/ontology-wave13-copy-qa-smoke/mobile-source-detail.png`
  - `/tmp/ontology-wave13-copy-qa-smoke/mobile-job-monitor.png`
  - `/tmp/ontology-wave13-copy-qa-smoke/mobile-candidate-review.png`
  - `/tmp/ontology-wave13-copy-qa-smoke/mobile-evidence-reading.png`
  - `/tmp/ontology-wave13-copy-qa-smoke/mobile-evidence-broken.png`
  - `/tmp/ontology-wave13-copy-qa-smoke/copy-recheck-dom.json`
- 실행하지 못한 검증:
  - Docker Compose smoke는 기존 P1 environment exception으로 유지했다.
  - full manual browser click UAT는 별도로 수행하지 않았다. Headless Playwright smoke와 screenshot/DOM artifact로 대체했다.
- 참고:
  - 첫 QA smoke 시도는 frontend port `5273`으로 실행해 backend CORS 정책에 막혔다. 원인 확인 후 canonical `5173` port로 fresh DB를 재생성해 재실행했고 PASS했다. 이 실패는 제품 regression으로 판정하지 않는다.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - 신규 Backend endpoint, DTO, enum 요구 없음.
  - `apps/frontend/src/shared/api`, frontend MVP2 type/mock, `docs/api` diff 없음.
- 영향받는 역할:
  - Backend: 추가 작업 필요 없음.
  - Frontend: 추가 Wave 13 P0 작업 없음.
  - QA: actual API smoke gate는 유지 가능.

## Blocker
- 없음.

## 남은 TODO
- Frontend:
  - Wave 13 P0 기준 남은 TODO 없음.
  - 후속 P1로 smoke harness를 Playwright Test suite로 정규화할 수 있다.
- QA:
  - Wave 13 recheck 완료.

## 다른 역할에 전달할 내용
- PM:
  - `UX13-05` follow-up 재검증 결과 PASS. Wave 13을 PASS로 닫아도 된다.
- Backend:
  - API blocker 없음. Backend 실행 불필요.
- Frontend:
  - responsive, stage, candidate/evidence flow, copy follow-up 모두 QA 기준 PASS.
- QA:
  - `/tmp/ontology-wave13-copy-qa-smoke` artifact가 copy follow-up 이후 fresh QA 기준이다.

## 총괄에게 요청하는 결정
- Wave 13 UI/UX product polish를 PASS로 닫아도 된다.

## 현재 판정
- PASS
