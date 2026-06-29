# QA / Integration Report - Wave 37

Status: `PASS — CLOSEOUT RECOMMENDED`
Date: 2026-06-29
Role: Integration / QA — Reference-driven design-language upgrade verification
Backlog IDs: `INT6-031` design verification, `INT6-032` regression guard

## 담당 범위
- backlog ID: `INT6-031` (design verification of FE6-038~045), `INT6-032` (regression guard)
- 작업 경로: 검증만 수행. `apps/frontend` 코드 무변경. 산출물 = 본 보고서 + scratchpad 스크린샷.
- 독립 검증: Frontend PASS 보고를 신뢰하지 않고 명령/렌더를 직접 재현.

## 완료한 작업 (INT6-031 design verification)

### 토큰 additive 확인 (FE6-038) — PASS
`apps/frontend/src/shared/styles/theme.ts` 직접 확인:
- `fontSize.lgPlus = "22px"` **추가**됨 (18→28 갭 보강), `fontSize.xl = "28px"` **유지**(rename 안 함).
- `fontWeight.semibold = 600` **추가**됨; `medium:700` / `bold:800` 그대로 **유지**(re-map 안 함) → 기존 소비자 시각 회귀 0.
- `spacing.section(24)/page(40)`, color roles(`accent/accentSoft/surfaceInfo/Success/Warning/Danger/surfaceSelected/surfaceStrong/textOnStrong`), `shadow.none/card` 모두 **추가만**.
- 이는 NEXT_ORDERS의 token-additive 기준(~22px `lgPlus` + `semibold=600`; `xl=28px` KEPT, no rename)과 정확히 일치. (디자인 문서 §2.1 "primary spec"은 xl→xxl rename을 제안했으나, 문서가 명시한 documented fallback을 택해 non-breaking으로 구현 — 총괄 결정과 합치.)
- `styled.d.ts`는 `typeof theme` 파생이라 타입 자동 정합. build PASS로 확인.

### HanaCard additive 확장 (FE6-039) — PASS
`shared/ui/hana/HanaCard.tsx`: optional `eyebrow` / 단일 `action` / `emphasis`(`default|summary|info|success|warning|danger`) 추가. `hasHeader` 가드로 기존 title/description-only 호출부 무변경 렌더. `HanaCard.test.tsx` 3 테스트 PASS(back-compat 포함).

### Section/Layout 공유 모듈 + 중복 dedup (FE6-040) — PASS
신규 `shared/ui/platform/Layout.tsx`(ScreenGrid/Stack/Split/CardBody/Muted/BadgeRow) + `Section.tsx`(SectionStack + re-export). `pages/mvp3Shared.tsx` diff 확인: 6개 중복 styled 정의가 제거되고 공유 모듈에서 import 후 동일 이름 re-export → 정의 byte-identical, import 사이트 무변경 → 시각 diff 0.

### 렌더 spot-check (desktop 1440 + tablet 768) — PASS
Puppeteer/Playwright 렌더 + 스크린샷(scratchpad `qa-*.png`):

| 화면 | H1 (KO) | 적용 원칙 확인 |
|---|---|---|
| Dashboard `/` | `대시보드` | 3-tier hierarchy(H1→hero→3 value card→KPI strip→최근활동 card), one primary CTA `프로젝트 시작하기` + secondary `최근 프로젝트 열기`, 빈 활동=PageState empty+CTA, single accent, generous whitespace |
| Review Workbench `/.../review/:id` | `검수 워크벤치` | `emphasis="summary"` 강한 요약 Section, KO 결정 라벨 `승인`/`반려`(koApprove=1/koReject=1), EN status badge 유지(D6, PENDING/WARNING 등), 원본·결정이력 `<details>` 접힘(collapsedDetails=1, P6), one primary, evidence/source 노출 |
| Benchmark `/.../benchmark-comparisons` | `벤치마크 비교` | summary-first read-only 배너, `비교할 실행 선택` KO 카드, 단일 primary `비교 실행`(runPrimaryBtn=1), 정직 badge(SAME_DATASET/DIFFERENT_DATASET_VERSION/MISSING_METRIC/NOT_APPLICABLE/`__NONE__`), 선택행 강조 |
| Sources `/.../sources` | `소스` | KO 제목, single primary 헤더 액션, 빈 상태 CTA |

7개 디자인 원칙 모두 실제 렌더에 적용됨(주장만이 아님): hierarchy(P1), single card module(P2, HanaCard+platform/Section), whitespace(P3, 토큰 rhythm), one primary action(P4), restrained accent(P5, blue 단일), progressive disclosure(P6, `<details>`+collapsed matrix), outcome-first KO copy(P7).

## 완료한 작업 (INT6-032 regression guard)

### test / build
- `npm run test` → `Test Files 9 passed (9) / Tests 31 passed (31)` (HanaCard 3 포함).
- `npm run build` → `tsc --noEmit`(app+node) 0 에러 + `vite build ✓ built in 2.15s`.

### mock smokes (dev 127.0.0.1:5173 기동 후) — 5/5 PASS
- `smoke:mvp4:mock` → status PASS
- `smoke:mvp5:mock` → status PASS (routeCount 9, rawSecretPrinted=false)
- `smoke:mvp6:mock` → status PASS
- `smoke:mvp6:benchmark:mock` → status PASS, routeCount 5, screenshotCount 5
- `smoke:mvp6:learning:mock` → status PASS, routeCount 6, screenshotCount 6

### 반응형 0 overflow (Wave35/36 불변식) — PASS
`wave35-responsive-check.mjs` (label=qa-after): ontology-modeler + candidate-results 각각 1920/1440/1366/1280/1024/768 에서 `scrollWidth==clientWidth`, overflowX=0.
`RESULT: 0 horizontal overflow on all routes/resolutions`. (요구된 1440/1366/1280/768 포함.)

### Wave35/36 불변식 유지 — PASS
- KO page titles: `대시보드`/`검수 인박스`/`검수 워크벤치`/`벤치마크 비교`/`소스` 모두 KO.
- EN+KO status badges(D6): Review/Benchmark에서 EN 토큰 badge 유지(enStatusBadge≥2; SAME_DATASET/DIFFERENT_DATASET_VERSION/MISSING_METRIC 등).
- single active LNB: 검증한 전 화면에서 `[aria-current="page"]` 카운트 = 1.

### benchmark smoke assertion token-aware 확인 — PASS
mock+actual smoke diff(vs HEAD) 검토:
- 변경: 영어 H1/버튼 리터럴만 1:1 KO 치환(`Select runs to compare`→`비교할 실행 선택`, `Build comparison`→`비교 실행`), 접힌 혼동 행렬은 `혼동 행렬 자세히 보기` disclosure 클릭으로 열고 assert.
- **보존된 acceptance marker**: `(no match)` __NONE__ sentinel, comparability band, improved/regressed/not-comparable, excluded runs, evidence-first cell drilldown, RELATION_TYPE axis, 각 route의 `assertions[]`. summary-first assertion은 **추가**(삭제 아님). regression-masking 아님.

### API/Enum/DTO 무변경 확인 — PASS
- `ReviewWorkbenchPage.tsx` diff: `decisionLabels`는 **불변 enum값**(`APPROVE/REJECT/REQUEST_CHANGES/MODIFY_AND_APPROVE`)을 key로 한 KO **표시 라벨**만 변경. enum값 무변경.
- `git status` 상 api/dto/client/openapi/enum 파일 0개 변경.

## 변경 파일
- `docs/handoffs/wave-037/QA_REPORT.md` (본 보고서)
- (코드 무변경; scratchpad 스크린샷 산출물만)

## 실행/검증 (정확 명령 + 결과)
- `git diff --check` → CLEAN
- `npm run test` → 9 files / 31 tests passed
- `npm run build` → 0 TS error, vite built in 2.15s
- `npm run smoke:mvp4:mock|mvp5:mock|mvp6:mock|mvp6:benchmark:mock|mvp6:learning:mock` → 전부 status PASS
- `node scripts/wave35-responsive-check.mjs` (label=qa-after) → 0 horizontal overflow (12 cells: 2 routes × 6 res)
- 렌더 spot-check(자체 임시 스크립트, 실행 후 삭제) → Dashboard/Workbench/Benchmark/Sources 위 표대로 확인
- 정리: 5173/8000 리스너 kill 후 FREE 확인; 임시 QA 스크립트 삭제 확인
- 실행하지 못한 검증: `*:actual` smokes (백엔드 NOT RUN 지침; benchmark actual smoke assertion은 FE가 선반영해 둠 — 다음 backend-up gate에서 실행 권장, 무계약변경이라 비차단)

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세: presentation/copy/token only. 라우트·엔드포인트·DTO·enum 무변경. KO 라벨은 불변 enum값에 매핑된 표시 문자열.
- 영향받는 역할: 없음 (Backend NOT RUN)

## 항목별 판정
| FE id | 항목 | 판정 |
|---|---|---|
| FE6-038 | theme 토큰 additive | PASS |
| FE6-039 | HanaCard 확장(additive) | PASS |
| FE6-040 | Section/Layout 공유 모듈 + dedup | PASS |
| FE6-041 | Dashboard | PASS |
| FE6-042 | Review Workbench | PASS |
| FE6-043 | Candidate Results + Sources | PASS |
| FE6-044 | Benchmark Comparison | PASS |
| FE6-045 | empty-state CTA | PASS |
| FE6-046/047/048 | P2 (PageHeader 토큰화 / breakpoint 토큰 / 잔여 Analyze 화면) | DEFERRED (이번 wave 범위 외, 저위험 후속) |

## Blocker
- 없음.

## 남은 TODO / 후속
- P2 FE6-046/047/048 — 저위험, 별도 wave.
- `*:actual` smokes — 다음 backend-up gate에서 실행(계약 무변경, 비차단). benchmark actual assertion은 KO/접힘 구조로 선반영됨.

## 다른 역할에 전달할 내용
- PM: 디자인 문서 §6 P0/P1 완료기준 전부 충족. D1-D6 불변. 토큰은 §2.1 documented fallback(non-breaking)로 구현됨.
- Backend: 변경 없음.
- Frontend: PASS 검증 완료. 신규 화면은 `HanaCard`(eyebrow/action/emphasis) + `platform/Section`/`Layout` 사용 권장.
- QA: actual smoke는 backend-up gate로 이월.

## 총괄에게 요청하는 결정
- 없음. closeout 권고.

## 현재 판정 / OVERALL
- **PASS — Wave 37 reference-driven design upgrade CLOSEOUT 권고.**
- FE6-038~045 전부 PASS; FE6-046/047/048(P2) DEFERRED.
- 토큰 additive 확인(lgPlus 추가/xl=28 유지/semibold 추가/medium·bold 유지), 7 디자인 원칙 실제 렌더 적용 확인.
- 무회귀 확인: KO 제목 / EN+KO status badge / single-active LNB / 0 horizontal overflow(6 res) 유지, API/DTO/enum 무변경.
- 31 tests + build + 5 mock smokes PASS, git diff --check CLEAN, 5173/8000 리스너 잔존 없음.
