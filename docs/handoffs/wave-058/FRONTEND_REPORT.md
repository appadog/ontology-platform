# Frontend Report - Wave 58

## 담당 범위
- backlog ID: Wave-058 UI/UX findings F1–F6 (Frontend-only)
- 작업 경로: `apps/frontend/src`
- 스펙: `docs/pm/UIUX_REVIEW_WAVE058.md`

## 완료한 작업 (per-finding)

### F1 (P1) — 핵심 저니 카피 한국어화 — DONE
- Review 인박스(`ReviewInboxPage.tsx`): 로딩/에러 문구, 브레드크럼("검수"), PageHeader 설명("후보 결정은 게시 적격 조건을 통과하기 전까지 게시된 사실과 분리되어 유지됩니다."), "게시 큐"/"품질 대시보드" 링크, "검수 큐 필터" + 필터 라벨(담당/상태/검증/신뢰도) + 옵션(나에게 배정됨/미배정/전체 검수 대상, 전체, 낮음/중간/높음), 상태·검증 enum 옵션에 `TOKEN · 한글 gloss` 병기, "검수 대상 N건" + 설명, 표 헤더 전체(후보/상태/검증/우선순위/담당/소스·작업/근거/수정 시각/워크벤치), 셀 fallback(후보/기본 검수 우선순위/미배정/소스·작업 정보 없음/소스 맥락), "열기" 버튼, "큐 응답"(항목/전체/페이지 크기/시작 위치).
- 게시 그래프 탐색기(`PublishedGraphExplorerPage.tsx`): 로딩/에러(2개소), 브레드크럼("게시 그래프"), 배지 gloss(PUBLISHED ONLY · 게시 전용 등), "품질 대시보드", 상태 행 "게시된 사실만", "탐색기 컨트롤" + "기본값은 2홉이며, 지원되는 최대 탐색 깊이는 3홉입니다.", 홉 버튼("N홉"), SAFE_TOO_LARGE 카드/KeyValue(예상 노드·엣지 수, 노드·엣지 예산, 제안 필터 안내), EMPTY/ERROR PageState, "현재 스냅샷" + 설명, 노드/엣지 메타(N홉, 출처/근거 N건, `→`), "오버레이"(품질/출처·근거 오버레이 N개), "계보 패널" + 모든 dt 라벨(사실/버전/게시 작업/검수 결정/후보 맥락/근거/온톨로지/모델 실행/프롬프트) + "정보 없음"/"출처 정보로만 사용"/"계보 정보가 있는 사실을 선택하세요.".
- 소스(`SourceManagerPage.tsx`): 프로젝트 미선택 PageState, 상단 업로드 버튼 라벨, 업로드 폼 필드(파일/소스 유형/표시 이름), 표 헤더(파일/유형/상태/미리보기/다음/크기/업로드), Next 컬럼("프로파일"/"구간").
- 공용: `mvp3Shared.tsx` Mvp3Workflow 스텝퍼 — 헤더("검수에서 게시된 사실까지") + 스테이지 표시 라벨을 한국어 맵으로(코드 식별자 `mvp3Stages`는 유지, 표시만 한글). `mvp4Shared.tsx` `versionLabel` → "게시 그래프 vN · 현재/선택됨" / "게시된 버전 없음".
- 코드 식별자/enum 값/route/testid/mock 키는 변경하지 않음. 상태 필터 옵션의 enum 값(PENDING 등)은 API 진실값으로 유지하고 한글 gloss만 병기.

### F2 (P2) — 개발자 용어/내부 문구 제거 — DONE
- 탐색기 `MarkerText`의 "Published-only graph state. SAFE TOO LARGE is handled..." → "게시된 사실만 표시합니다. 그래프가 안전 한도를 초과하면 부분 그래프를 위험하게 그리지 않고 요약만 처리합니다."
- 상태 시뮬레이션 토글의 raw enum(READY/SAFE_TOO_LARGE/EMPTY/ERROR) → 한국어 라벨(`exploreStateLabels` 맵; 버튼 클릭 시 넘기는 `GraphExploreState` 값은 그대로).
- 시각화·요약 배너: 중복 영어 라인(`viz.boundary_note`, 픽스처 값이 "read-only visualization ... MVP3 publish path.") 렌더 제거 + 미사용 `BoundaryNote` styled 제거. 배너 본문의 "기존 MVP3 게시 경로" → "별도의 게시 경로".
- 검증: 두 화면의 사용자 대면 텍스트에 "MVP\d" 없음(런타임 `document.body.innerText` 검사 = null).

### F3 (P2) — 타임스탬프 포맷 — DONE
- 기존 공용 헬퍼 `shared/lib/format.ts`의 `formatDateTime`(ko-KR medium+short) 재사용.
- `GraphVizSummaryView.tsx`의 "생성 시각: {viz.generated_at}"(raw ISO) → `formatDateTime(viz.generated_at)`.
- 런타임 확인: "생성 시각: 2026. 7. 14. 오후 1:53" (프로젝트 홈과 동일한 로컬 포맷). 해당 세 화면에서 raw ISO 누수는 이 지점이 유일했음.

### F4 (P1) — 모바일 내비게이션 드로어 — DONE
- `AppShell.tsx`: 모바일(≤860px, 앱의 사이드바 브레이크포인트) 상단 앱바(`MobileBar`) + 햄버거 토글(`MobileMenuButton`, Menu/X 아이콘) 추가. 사이드바는 기본 접힘(`max-height:0`), `data-open="true"`일 때 펼침. 라우트 변경 시 자동 닫힘(useEffect). 데스크톱 고정 사이드바는 그대로(드로어 스타일은 미디어쿼리 안에만). Topbar는 모바일에서 in-flow로 전환해 앱바와 이중 sticky 겹침 방지. 단일 활성 LNB 동작 유지.
- 375px 검증(Playwright): 세 화면 모두 overflowX=0, H1이 첫 뷰포트에 노출(h1Top≈358 < 812), 토글 기본 닫힘(aria-expanded=false, sidebar max-height 0px), 토글 클릭 시 펼침(max-height none, aria-expanded=true), 활성 LNB 1개 유지.

### F5 (P3) — 카디널리티 라벨 잘림 — DONE
- `OntologyModelerPage.tsx`: `cardinalityLabels` 맵 + `cardinalityLabel()` 헬퍼 추가. 4개 select(속성/관계 생성 폼 + 속성/관계 편집 폼) 모두 사용자 친화 라벨로 표시(예: MANY_TO_MANY → "N:N (다대다)", 1:1/1:N/N:1, OPTIONAL/REQUIRED/MULTIPLE → 짧은 한글 병기). option value는 Cardinality enum 그대로. 라벨이 짧아져 잘림 없음.

### F6 (P3) — 소스 업로드 진입점 — DONE
- `SourceManagerPage.tsx`: 상단 버튼의 사유 없는 disabled 제거. 파일 미선택 시 라벨 "파일 선택" + 클릭 시 인라인 파일 입력으로 스크롤·포커스(단일 진입점으로 유도). 파일 선택 시 라벨 "소스 업로드" + 클릭 시 업로드. 업로드 중 "업로드 중". 상단/인라인 이중 진입점 모호성 해소.

## 변경 파일
- `apps/frontend/src/pages/ReviewInboxPage.tsx` (F1)
- `apps/frontend/src/pages/PublishedGraphExplorerPage.tsx` (F1, F2)
- `apps/frontend/src/pages/GraphVizSummaryView.tsx` (F2, F3)
- `apps/frontend/src/pages/SourceManagerPage.tsx` (F1, F6)
- `apps/frontend/src/pages/OntologyModelerPage.tsx` (F5)
- `apps/frontend/src/pages/mvp3Shared.tsx` (F1 — 공용 스텝퍼)
- `apps/frontend/src/pages/mvp4Shared.tsx` (F1 — 공용 versionLabel)
- `apps/frontend/src/shared/layout/AppShell.tsx` (F4)

## 실행/검증
- `npm run build` → PASS (tsc app + tsc node + vite build; 1893 modules, built in ~2s).
- `npm run test` → PASS (17 files, 116 tests).
- `npm run smoke:mvp6:graphviz:mock` (dev :5174) → `{"status":"PASS","routeCount":2,"screenshotCount":2}`.
- F1 grep(세 핵심 화면 + 공용): 지정된 영어 문자열 전부 사라짐(NONE FOUND).
- F2: 두 화면 사용자 대면 텍스트에 "MVP\d" 없음; `boundary_note` 미렌더.
- F3: 런타임 렌더 "생성 시각: 2026. 7. 14. 오후 1:53".
- F4: 375px Playwright 검사 3개 화면 모두 overflowX=0 / H1 첫 뷰포트 / 토글 열림·닫힘 / 단일 활성 LNB.
- `git diff --check` → CLEAN.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세: 사용자 대면 카피/라벨/레이아웃만 수정. enum 값·route·testid·mock 키·코드 식별자 불변.
- 영향받는 역할: 없음

## Blocker
- 없음. (dev 서버는 5173이 점유되어 5174로 기동되었고, smoke/모바일 검사에 `MVP6_FRONTEND_BASE_URL`/base override로 대응.)

## 남은 TODO
- (선택) 상태 필터 옵션 enum(PENDING 등)은 gloss 병기 방식으로 유지했으며 완전 한글 단독 라벨로의 전환은 별도 판단 필요.

## 다른 역할에 전달할 내용
- PM: F1–F6 모두 DONE. 공용 프리미티브(Mvp3Workflow 스텝퍼, versionLabel)는 검수·게시 저니 전 화면(워크벤치/게시 큐/품질 포함)에 일관 반영됨.
- Backend: 변경 없음.
- QA: 375px 콘텐츠-우선 + 드로어 토글은 review/published-graph/sources에서 확인. 데스크톱 1440 smoke 통과(단일 활성 LNB 유지).
- Frontend: cardinality/versionLabel/스텝퍼 라벨은 맵 기반이라 신규 화면에서도 재사용 가능.

## 현재 판정
- PASS
