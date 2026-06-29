# Frontend Report - Wave 37

Status: `COMPLETE`
Date: 2026-06-29
Role: Frontend — Reference-driven UI/UX upgrade (implements `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md`)

## 담당 범위
- backlog ID: `FE6-038` ~ `FE6-045` (P0 + P1). P2 (FE6-046/047/048) not in this wave.
- 작업 경로: `apps/frontend/src` (theme, shared primitives, Dashboard / Review Workbench /
  Candidate Results / Sources / Benchmark Comparison) + benchmark smoke scripts.
- 이 작업은 연결 끊김으로 중단된 이전 실행을 이어받아 검증·완료·정합화했습니다.

## 완료한 작업

### 토큰 결정 (총괄 결정 반영 확인)
이전 실행이 **NON-BREAKING ADDITIVE** 방식을 정확히 따랐음을 확인했습니다(총괄 결정과 일치).
- `fontSize.xl` = **28px 유지** (xl→xxl 리네임 안 함). 누락된 18→28 중간 단계는
  `fontSize.lgPlus = "22px"` 로 **추가**(디자인 문서 §2.1의 문서화된 fallback).
- `fontWeight` 재매핑 안 함: 기존 `medium:700 / bold:800` 유지, 진짜 누락이던
  `semibold:600` 만 **추가**. → 기존 ~65개 소비자 시각 회귀 0.
- 따라서 "renamed `xl`" 상황 아님 → 수정 불필요. (FE6-038 완료조건의 "no token
  renamed-away that breaks a screen" 충족.)

### FE6-038 — theme 토큰 (P0) ✅
`shared/styles/theme.ts`: `lgPlus(22px)`, `fontWeight.semibold(600)`, `spacing.section/page`,
color roles(`accent/accentSoft/surfaceInfo/Success/Warning/Danger/surfaceSelected/surfaceStrong/
textOnStrong`), `shadow.none/card` 추가. `styled.d.ts` 는 `typeof theme` 파생이라 자동 정합.
- 근거: build/test PASS, `fontSize.xl` 소비자는 28px 의미 그대로 유지(리네임 없음).

### FE6-039 — HanaCard 확장 (P0) ✅
`shared/ui/hana/HanaCard.tsx`: 선택적 `eyebrow` / 단일 `action` / `emphasis`
(`default|summary|info|success|warning|danger`) 추가. 순수 additive.
- 근거: 기존 title/description 호출부 무변경 렌더, `HanaCard.test.tsx` 3 테스트
  (back-compat, eyebrow+action+summary, state emphasis) PASS.

### FE6-040 — Section + Layout 공유 모듈 (P0) ✅
`shared/ui/platform/Layout.tsx`(신규: ScreenGrid/Stack/Split/CardBody/Muted/BadgeRow) +
`Section.tsx`(신규: SectionStack + re-export). `mvp3Shared.tsx` 는 중복 styled 정의를
제거하고 공유 모듈에서 import 후 동일 이름 re-export → 기존 import 사이트 무변경, 시각 diff 0.

### FE6-041 — Dashboard (P1) ✅
`pages/DashboardPage.tsx`: outcome-first 페이지 subline 적용("오늘 무엇을 검수하고
게시할지…"), Hero=`shadow.soft` / MetricCard=`shadow.card`(FE6-041 일부), 하나의 primary
CTA(`프로젝트 시작하기`) + secondary(`최근 프로젝트 열기`), 빈 최근활동 = `PageState empty` + CTA.
D2 hero 문구는 frozen 그대로 유지. 1440/768 overflow 0.

### FE6-042 — Review Workbench (P1) ✅
`pages/ReviewWorkbenchPage.tsx`: `emphasis="summary"` 강한 요약 Section(§4.3) 추가,
KO 결정 라벨(`승인/반려/논의 필요/수정 후 승인`) — `ReviewDecisionType` enum 값 무변경, 상태
badge 는 EN 토큰 유지(D6). APPROVE 만 primary, REJECT danger, 나머지 secondary(P4). 원본/수정
diff·결정 이력은 `<details>` 로 기본 접힘(P6). 빈/에러 = `PageState` + 다음행동.

### FE6-043 — Candidate Results + Sources (P1) ✅
- Candidate(`CandidateResultsPage.tsx`): 빈 상태 전부 CTA 보유, 테이블 Wave35 scroll-wrapper
  유지, 선택 행 강조. (이전 실행에서 완료, 검증함.)
- **Sources(`SourceManagerPage.tsx`) — 이번에 완료**: 업로드 카드에 eyebrow + outcome-first
  KO 카피, 목록 카드 `emphasis="default"`(flat shadow, §4.2 반복 리스트 카드), 하드코딩 px
  (`18/12/6px`, `font-weight:800`) → 토큰으로 치환. KO 제목(`소스`)·단일 primary 헤더 액션
  (`Source 업로드`)·빈 상태 CTA(`파일 선택`)·table-wrap 모두 유지.

### FE6-044 — Benchmark Comparison (P1) — 이번에 완료 ✅
`pages/BenchmarkComparisonPage.tsx` (이전 실행이 손대지 않았던 화면):
- **summary-first**: `ComparisonDetail` 최상단에 `emphasis="summary"` 강한 Section
  (`기준 실행 대비 어떤 지표가 좋아지고 나빠졌는지…`) — 향상/저하/허용오차내/비교불가/기준외 실행
  카운트 strip. 카운트는 기존 `delta_status` 에서 파생(날조 0% 없음, NOT_APPLICABLE/absent 는
  "비교 불가"로 정직 분류).
- **one primary action**: `Build comparison` → 단일 KO primary `비교 실행`(진행 중 `비교 실행 중`).
- **progressive disclosure(P6)**: 혼동 행렬 전체(컨트롤+그리드+totals+drilldown)를 native
  `<details>`(`혼동 행렬 자세히 보기`)로 기본 접힘.
- **정직 badge(D6)**: 기존 `NOT_APPLICABLE`(→N/A), `__NONE__`(→"(no match)" sentinel),
  `NOT_COMPARABLE`(→"Not comparable"), `MISSING_METRIC`, excluded-run 사유 badge 모두 유지.
- run-selector 카드 outcome-first KO 카피, 빈 상태(0개/<2개) 에 평가 데이터셋 이동 CTA 추가.

### FE6-045 — 빈 상태 CTA (P1) ✅
손댄 화면의 모든 `PageState kind="empty"` 가 next-action 보유: Dashboard(Projects 이동),
Candidate(추출 작업 상태), Sources(파일 선택/Projects 이동), Benchmark(평가 데이터셋 이동).
Review 의 결정-이력 빈 상태는 "위에서 결정을 선택하세요" 안내(상단 결정 영역이 곧 next action).

## 변경 파일
수정:
- `apps/frontend/src/shared/styles/theme.ts` (FE6-038, additive)
- `apps/frontend/src/shared/ui/hana/HanaCard.tsx` (FE6-039)
- `apps/frontend/src/shared/ui/platform/MetricCard.tsx` (FE6-041, shadow.card)
- `apps/frontend/src/pages/mvp3Shared.tsx` (FE6-040 re-export)
- `apps/frontend/src/pages/DashboardPage.tsx` (FE6-041)
- `apps/frontend/src/pages/ReviewWorkbenchPage.tsx` (FE6-042)
- `apps/frontend/src/pages/CandidateResultsPage.tsx` (FE6-043)
- `apps/frontend/src/pages/SourceManagerPage.tsx` (FE6-043 Sources)
- `apps/frontend/src/pages/BenchmarkComparisonPage.tsx` (FE6-044)
- `apps/frontend/scripts/mvp6-benchmark-mock-route-smoke.mjs` (assertion 정합화)
- `apps/frontend/scripts/mvp6-benchmark-actual-api-smoke.mjs` (assertion 정합화)

신규:
- `apps/frontend/src/shared/ui/platform/Layout.tsx` (FE6-040)
- `apps/frontend/src/shared/ui/platform/Section.tsx` (FE6-040)
- `apps/frontend/src/shared/ui/hana/HanaCard.test.tsx` (FE6-039)

## 실행/검증
- 실행한 명령 및 결과(정확 출력):
  - `npm run test` → `Test Files 9 passed (9) / Tests 31 passed (31)` (HanaCard 3 테스트 포함).
  - `npm run build` → `tsc -p app/node` 무에러 + `vite build ✓ built` (TS 에러 0).
  - mock smokes (dev server 127.0.0.1:5173 기동 후):
    - `smoke:mvp4:mock` → PASS (6 screenshots)
    - `smoke:mvp5:mock` → PASS (routeCount 9, rawSecretPrinted=false)
    - `smoke:mvp6:mock` → PASS
    - `smoke:mvp6:benchmark:mock` → `status PASS, routeCount 5, screenshotCount 5`
    - `smoke:mvp6:learning:mock` → `status PASS, routeCount 6, screenshotCount 6`
  - 반응형 `wave35-responsive-check.mjs` (label=after):
    `RESULT: 0 horizontal overflow on all routes/resolutions` — ontology-modeler /
    candidate-results 각각 1920/1440/1366/1280/1024/768 에서 scrollW==clientW (overflowX=0).
  - 추가 before/after 캡처(scratchpad): dashboard / benchmark / sources @1440·768 모두 overflowX=0.
- `git diff --check` → CLEAN. 5173/8000 리스너 잔존 없음(clear).
- 스크린샷 산출물: scratchpad (`after-dashboard-*.png`, `after-benchmark-*.png`,
  `after-sources-*.png`) + 각 smoke 의 `/tmp/ontology-*-smoke/*.png`.
- 실행하지 못한 검증: actual-API smokes (백엔드 NOT RUN 지침) — 단, 화면 카피/구조 변경에 맞춰
  `mvp6-benchmark-actual-api-smoke.mjs` assertion 은 선반영해 둠(QA actual 실행 시 정합).

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세: 모두 presentation/copy/token. `ReviewDecisionType` enum 값(APPROVE/REJECT/
  REQUEST_CHANGES/MODIFY_AND_APPROVE) 무변경, KO 라벨만 표시. 라우트/쿼리 무변경.
- 영향받는 역할: 없음

## Blocker
- 없음.

## 남은 TODO
- P2 (`FE6-046` PageHeader 토큰화, `FE6-047` breakpoint 토큰, `FE6-048` 나머지 Analyze 화면)
  — 이번 wave 범위 외, 저위험 후속.

## 다른 역할에 전달할 내용
- PM: 토큰은 디자인 문서 §2.1의 문서화된 **additive fallback**(`lgPlus` 추가, `xl=28px` 유지,
  `semibold` 추가)로 구현. xl→xxl 리네임은 하지 않음(시각 회귀/광범위 수정 회피).
- Backend: 없음 (API/DTO/enum 무변경).
- Frontend: 공유 카드 문법 = `HanaCard`(eyebrow/action/emphasis) + `platform/Layout`·`Section`.
  신규 화면은 per-MVP styled 복제 대신 이 모듈을 import.
- QA: 벤치마크 smoke assertion 이 KO primary(`비교 실행`)·KO 카드 제목(`비교할 실행 선택`)·접힌
  혼동 행렬(`혼동 행렬 자세히 보기` 클릭으로 펼침)로 갱신됨. acceptance marker(향상/저하/비교불가,
  __NONE__ sentinel, excluded runs, evidence-first)는 보존. KO 제목·EN+KO badge·single-active
  LNB·0 overflow 회귀 없음 확인.

## 총괄에게 요청하는 결정
- 없음. 토큰 방식(NON-BREAKING ADDITIVE)은 이미 내려진 총괄 결정대로 구현·확인 완료.

## 현재 판정
- **PASS** — FE6-038~045 (P0+P1) 전부 완료. build/test/5 mock smoke PASS, 0 overflow,
  Wave35/36 불변식(KO 제목·D6 badge·single-active LNB·0 overflow) 유지, API/DTO/enum 무변경,
  git diff --check clean.
