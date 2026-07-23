# FRONTEND Report - Wave 63

## 담당 범위
- backlog ID: PM6-041
- 작업 경로: `apps/frontend`
- 근거 문서: `docs/pm/DESIGN_DIRECTION_ONBOARDING_SELFSERVE.md` (FROZEN)

## 완료한 작업

### §2.1 커맨드팔레트 — DONE
- 신규 `apps/frontend/src/shared/layout/CommandPalette.tsx`. `AppShell`의 Topbar에 1회 마운트되어 전 화면에서 사용 가능.
- 액션 목록은 `navigation.ts`의 `globalNavItems` + `projectNavGroups`를 그대로 순회해 생성(별도 라우트 목록을 만들지 않음). "새 프로젝트 만들기"(→`/projects`)와 기존 `recentProjectStorageKey`(`ontology-platform:recent-project-id`) localStorage 값으로 "최근 프로젝트" 항목을 우선 노출.
- 트리거: `Cmd/Ctrl+K`(전역, 텍스트 입력 포커스 중에도 표준 커맨드팔레트 관례대로 동작) + 상단바의 "검색... ⌘K" 버튼(발견 가능한 트리거, `aria-label="커맨드 팔레트 열기 (검색)"`).
- 상호작용: 토큰 기반 substring 매칭으로 fuzzy-filter(별도 fuzzy-search 의존성 추가 안 함 — 항목 수가 ~60개 수준이라 과함), ↑/↓ 이동, Enter로 `react-router-dom`의 `navigate` 호출, Esc로 닫힘, 오버레이 바깥 클릭으로 닫힘.
- 접근성: `role="dialog"` `aria-modal="true"` `aria-label`, 열릴 때 입력창에 포커스 이동, 닫힐 때 트리거 버튼(또는 열기 직전 포커스 요소)으로 포커스 복귀, `document.body.style.overflow = "hidden"`으로 스크롤 잠금, Tab 키는 입력창에 포커스를 고정(단일 포커서블 필드).
- 의도적으로 추가하지 않은 것: fuzzy-search 라이브러리(design doc §2.1 "dependency-light" 지침에 따라 substring/token match로 충분).

### §2.2 Empty state 강화 — DONE
- `apps/frontend/src/shared/ui/platform/PageState.tsx`: `icon?: LucideIcon`, `secondaryAction?: { label, onAction }` 두 개의 선택적 prop 추가.
- **회귀 방지 전략**: `secondaryAction`이 없으면 완전히 예전 그대로의 분기(단일 `HanaButton`이 `StateBox`의 직계 자식, 감싸는 wrapper 없음, variant 그대로)를 렌더 — 20+ 기존 호출부는 100% 동일한 마크업. `secondaryAction`이 있을 때만 새 `Actions` flex wrapper와 `variant="primary"` primary CTA + 보조 `HanaButton`을 렌더(P1: 경쟁하는 두 개의 동급 버튼이 아니라 primary 1개 + secondary 1개).
- `ProjectListPage.tsx`의 `kind="empty"` 분기에 적용: 아이콘 `FolderKanban`(nav의 Projects 아이콘과 통일), 주 CTA "새 프로젝트 만들기"(→ 기존 인라인 생성 폼 `setShowCreateForm(true)` 오픈). **보조 CTA는 의도적으로 생략** — 이 분기는 정확히 프로젝트 0개 상태이므로 design doc §3("프로젝트가 0개면 보조 CTA 자체를 숨긴다")에 따라 실제로 링크할 기존 프로젝트가 없음.
- `DashboardPage.tsx`의 Hero 영역은 손대지 않음 — 이미 "프로젝트 시작하기"(주)/"최근 프로젝트 열기"(보조, `recentProject`가 있을 때만 조건부 렌더)로 P2 패턴을 구현하고 있어 추가 변경이 불필요하다고 판단(design doc이 "adapt 가능"이라고 명시한 기존 구현).

### §2.3 프로젝트 홈 온보딩 체크리스트 — DONE
- 신규 `apps/frontend/src/pages/ProjectOnboardingChecklist.tsx`, `ProjectDetailPage.tsx`(Workflow 스테퍼가 있는 프로젝트 홈)의 `MetricGrid` 바로 아래에 배치.
- 4개 항목 전부 **이미 존재하는 훅**으로 판정(신규 API 없음):
  1. 온톨로지 클래스/관계 — `useOntologyVersions(projectId)`로 최신 버전(`versions[0]`, `OntologyModelerPage.tsx`와 동일한 관례) → `useOntologyGraph(versionId)`의 `classes`/`relations`(없으면 `nodes`/`edges`로 폴백) 합산 길이 > 0
  2. 소스 — 프로젝트 홈이 `useProject`로 이미 로드한 `project.source_count`를 prop으로 재사용(재조회 없음)
  3. 추출 잡 — `useExtractionJobs(projectId).data.length > 0`
  4. 게시 그래프 버전 — `useCurrentPublishedGraph(projectId)`가 성공적으로 데이터를 반환하는지(`isSuccess && data`)
- 전부 완료 시 카드 자동 숨김. 수동 닫기(X) 버튼은 `localStorage["onboarding-checklist-dismissed:{projectId}"]="true"`로 기억(프로젝트별 키).

## 변경 파일
- `apps/frontend/src/shared/layout/CommandPalette.tsx` (신규)
- `apps/frontend/src/shared/layout/AppShell.tsx` (CommandPalette import + Topbar 마운트, 2줄 추가)
- `apps/frontend/src/shared/ui/platform/PageState.tsx` (icon/secondaryAction opt-in)
- `apps/frontend/src/shared/ui/platform/PageState.test.tsx` (신규 — 백워드컴팻 + 신규 옵션 테스트 5건)
- `apps/frontend/src/pages/ProjectListPage.tsx` (empty state에 아이콘 + 주 CTA 적용)
- `apps/frontend/src/pages/ProjectOnboardingChecklist.tsx` (신규)
- `apps/frontend/src/pages/ProjectDetailPage.tsx` (체크리스트 위젯 삽입, 2줄 추가)

## 실행/검증
- 실행한 명령 및 결과:
  ```
  npm run test
  → Test Files 18 passed (18) / Tests 121 passed (121)

  npm run build
  → tsc --noEmit (app+node) PASS, vite build 성공 (dist 산출, 기존 chunk-size 경고만 존재 — 이번 wave 이전부터 있던 정보성 경고)

  git diff --check
  → exit 0 (clean)
  ```
- 브라우저 검증(Vite dev server, `localhost:5173`, mock API 모드):
  - Cmd/Ctrl+K로 팔레트 오픈 확인, 상단바 "검색... ⌘K" 버튼 클릭으로도 오픈 확인.
  - `quality` 입력 → substring 필터로 Quality 1건만 남는 것 확인 → Enter로 `/projects/:id/quality`로 정확히 이동 확인.
  - Ctrl+K 재오픈 → `sources` 입력 → Enter로 `/projects/:id/sources` 이동 확인(서로 다른 2개 라우트 이동 검증 완료).
  - Ctrl+K 오픈 → ArrowDown x2 → Escape → 팔레트 닫히고 페이지 이동 없음, 포커스가 트리거 버튼으로 복귀(시각적 포커스 링 확인).
  - 프로젝트 홈 체크리스트: `project-corp-knowledge`(모든 항목 충족 시나리오로 추정 — 카드 자동 숨김 확인, 의도된 동작), `project-product-catalog`(소스만 체크, 나머지 3개 미체크인 부분 진행 상태 확인) → X로 닫기 → 새로고침 후에도 숨김 유지(`localStorage["onboarding-checklist-dismissed:project-product-catalog"] === "true"` 확인).
  - 모바일 375px: `document.documentElement.scrollWidth === window.innerWidth === 375`(수평 오버플로 없음), 햄버거 버튼으로 드로어 열림/닫힘(`data-open` 속성 true/false 토글) 확인.
  - 데스크톱 아이콘 레일 collapse: 토글 클릭 시 사이드바가 라벨 숨김 아이콘 전용 레일로 축소되는 것을 스크린샷으로 확인 — wave-058/059 회귀 없음.
  - 서버 종료 후 `lsof -i :5173 -i :8000` 빈 결과로 리스너 잔존 없음 확인.
- 실행하지 못한 검증:
  - `ProjectListPage`의 실제 "프로젝트 0개" 시나리오는 **브라우저로 재현하지 못함** — mock/actual 두 API 모드 모두 fixture에 프로젝트가 이미 존재해 런타임에서 0개 상태를 만들 방법이 없었음. 대신 (a) `PageState.test.tsx`에서 icon/secondaryAction 유무에 따른 렌더링을 유닛 테스트로 커버, (b) 코드 인스펙션으로 `projects.length === 0` 분기가 `secondaryAction`을 전달하지 않는다는 것을 확인함.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세: 신규 컴포넌트 2개(CommandPalette, ProjectOnboardingChecklist)는 전부 기존 `queries.ts` 훅(`useProjects`, `useOntologyVersions`, `useOntologyGraph`, `useExtractionJobs`, `useCurrentPublishedGraph`)만 재사용. `PageState`는 옵셔널 prop 2개만 추가(기존 시그니처 100% 하위호환). 라우트/네비게이션 데이터 구조 변경 없음.
- 영향받는 역할: 없음(백엔드/계약 변경 없음)

## Blocker
- 없음

## 남은 TODO
- 없음(design doc §2 scope 전 항목 DONE). §3에 명시된 범위 밖 항목(툴팁 투어, 백엔드 샘플 시딩, 인앱 헬프 사이드바)은 의도적으로 미구현.

## 다른 역할에 전달할 내용
- PM: design doc §2.1/§2.2/§2.3 전부 DONE. secondaryAction은 실제 존재하는 프로젝트로만 이동하며, 0개 상태에서는 노출되지 않음을 확인.
- Backend: 변경 없음.
- Frontend(후속): 커맨드팔레트 액션 리스트는 `navigation.ts`가 확장될 때마다 자동으로 따라가므로 별도 유지보수 불필요.
- QA: 브라우저 시나리오는 위 "실행/검증" 절 참고. 실제 API 모드(0-프로젝트 계정)에서의 empty-state 수동 확인을 권장.

## 총괄에게 요청하는 결정
- 없음

## 현재 판정
- PASS
