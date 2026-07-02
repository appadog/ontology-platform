# Frontend Report - Wave 42

## 담당 범위
- backlog ID: `FE6-061` (route/IA + LNB + types/client/mocks), `FE6-062` (board + propose),
  `FE6-063` (detail: review thread + decision panel + audit + QUEUED banner), `FE6-064` (mock + actual smoke)
- 작업 경로: `apps/frontend/src` (types/client/queries/mocks/pages/nav/router), `apps/frontend/scripts`
  (smoke + responsive), `apps/frontend/package.json`. MOCK-FIRST against the frozen contract
  `docs/api/openapi-mvp6-5-draft.json`; actual mode wired and RUN (backend was bootable on SQLite).

## 완료한 작업
Wave41-frozen MVP6.5 Governance THIN UI 전체를 구현했다(이전 FE 세션은 산출물 0). 프론트는
모두 frozen OpenAPI + PM G1/G2/G4 동결 규칙에 정확히 맞췄고, 병렬로 완성된 Backend
`governance/` 모듈과 필드/enum/경로/에러코드/actor 메커니즘이 완전 일치함을 actual smoke로 확인했다.

- **FE6-061 IA/route/LNB + 타입/클라이언트/목**: Review 그룹 3번째에 신규 project-zone LNB 항목
  `Governance`(`Scale` 아이콘) 추가; `resolveActiveSection`에 `/governance` 분기 추가(단일 활성 LNB
  유지). 라우트 `/projects/:p/governance`(보드, LNB destination), `/governance/new`(propose,
  contextual), `/governance/:changeRequestId`(detail, contextual — LNB 아님). types.ts에 6개 enum +
  DTO 전부를 OpenAPI verbatim으로 추가(리네임 없음; 기존 FE에 없던 `Role` mirror는 `GovernanceRole`로
  additive 신설). client.ts에 `GovernanceError` + process-local store(goldset 선례) + 9개 apiClient
  메서드(mock+actual 양쪽); queries.ts에 query/mutation 훅 + governance 전용 invalidation.
- **FE6-062 보드 + propose**: 보드는 status client-side 그룹핑(G4), 상시 approval-is-intent 배너,
  단일 primary `변경 요청 생성`, APPROVED 행에 warning-tone `큐잉됨 (미적용)` 배지. Propose는
  title/summary + 변경 항목(`target_kind × change_type` + element ref[ADD는 null/숨김] +
  `ontology_version_id` + opaque `proposed_change`), 단일 primary `제출`(임시저장은 secondary),
  ADD/MODIFY/DEPRECATE 클라이언트 검증, 비변경 안내 카피.
- **FE6-063 detail**: 요약 + 4-mode permission band(approver/reviewer/read-only + PERMISSION_LIMITED)
  + 변경 항목(참조 read-only) + 검토 스레드(disclosure) + decision panel(reason-required gating,
  role별 단일 primary, 직무분리 카피, mutation-guard proof line) + 감사 추적(disclosure, wire asc를
  UI에서 newest-first로 뒤집음). 상시 approval-is-intent 배너 + APPROVE 성공 시 QUEUED 확인 카피.
  `적용`/`게시` CTA 전무. 409는 non-destructive conflict notice + 새로고침.
- **FE6-064 smoke**: `smoke:mvp6:governance:mock`(Playwright, 6 route/screenshot) +
  `smoke:mvp6:governance:actual`(10 assertion). 둘 다 PASS. 유닛 목 계약 테스트 10개 신규.

## 변경 파일
- 신규: `src/pages/GovernanceBoardPage.tsx`, `GovernanceProposePage.tsx`, `GovernanceDetailPage.tsx`,
  `src/pages/governanceShared.tsx`, `src/shared/mocks/mvp6GovernanceFixtures.ts`,
  `src/shared/api/mvp6GovernanceMock.test.ts`, `scripts/mvp6-governance-mock-route-smoke.mjs`,
  `scripts/mvp6-governance-actual-api-smoke.mjs`
- 수정(additive): `src/shared/api/types.ts`(enum+DTO), `src/shared/api/client.ts`(store+methods),
  `src/shared/api/queries.ts`(hooks), `src/shared/layout/navigation.ts`(LNB item + resolver),
  `src/app/router.tsx`(3 routes), `scripts/wave35-responsive-check.mjs`(3 governance routes),
  `package.json`(2 smoke scripts)

## 실행/검증
- `cd apps/frontend && npm run test` → **PASS**: `Test Files 11 passed (11) · Tests 53 passed (53)`
  (신규 governance 10 + 기존 43, 회귀 0).
- `npm run build` → **PASS**: `tsc --noEmit`(app+node) 통과, `vite build ✓ built in 2.07s`,
  `1880 modules transformed`.
- `npm run smoke:mvp6:governance:mock` → **PASS**: `{"status":"PASS","routeCount":6,"screenshotCount":6}`.
  (board KO title 거버넌스 + MVP6.5 marker + 상시 배너 + primary 변경 요청 생성 + QUEUED 미적용 배지 +
  단일 활성 LNB + no 적용/게시 CTA / propose ADD element-ref 숨김 + 제출 / detail approver band +
  reason-gating + proof line / APPROVE→QUEUED 확인 + no apply CTA / audit disclosure)
- `npm run smoke:mvp6:governance:actual` → **RAN, PASS**: `{"status":"PASS","apiCheckCount":10}`.
  Backend를 SQLite(`sqlite+pysqlite`)로 부팅 + `Base.metadata.create_all`(25 tables)로 실행. 검증:
  propose(DRAFT)→submit(OPEN); submit 0 items→409 CHANGE_REQUEST_NO_ITEMS; G1 first-touch COMMENT→
  IN_REVIEW & REVIEW_STARTED가 COMMENT_ADDED보다 먼저; APPROVE reason 누락→422 REASON_REQUIRED;
  proposer 본인 승인→403 SELF_APPROVAL_FORBIDDEN; 비권한 role 승인→403 PERMISSION_DENIED;
  APPROVE→status=APPROVED·application_state=QUEUED·change_auto_applied=false·all-false 7-flag guard·
  resulting_application_state=QUEUED; terminal 결정→409 CHANGE_REQUEST_STATE_CONFLICT; audit asc +
  APPLIED/SUPERSEDED 미생성.
- responsive 0-overflow 재검(`scripts/wave35-responsive-check.mjs`, governance board/propose/detail):
  1440/1366/1280/768(+1920/1024) 전부 `overflowX=0`, `RESULT: 0 horizontal overflow on all
  routes/resolutions`. 스크린샷은 scratchpad(`gov-responsive/`, `gov-mock-smoke/`, `gov-actual-smoke/`).
- `git diff --check` → **CLEAN** (whitespace 오류 없음). 종료 후 8000/5173 리스너 없음.
- 실행하지 못한 검증: 없음.

## API/Enum/DTO 변경
- 변경 여부: **없음**. OpenAPI/DTO/enum 신규·리네임 요청 없음.
- 상세: FE 타입은 `docs/api/openapi-mvp6-5-draft.json`을 verbatim으로 미러링. MVP3
  `ReviewDecisionType`/MVP5 `Role`/`AuditEventType`/ontology-element 필드 리네임 전혀 없음. 기존 FE에는
  OpenAPI `Role` enum(SYSTEM_ADMIN/ONTOLOGY_MANAGER/…) 리터럴을 가진 타입이 없어 `GovernanceRole`을
  additive로 신설(기존 `EnterpriseRole` 등과 무관, 리네임 아님).
- 영향받는 역할: 없음(FE 내부 additive).

## Blocker
- 없음.

## 남은 TODO
- StatusBadge 공유 토큰 테이블의 `QUEUED`는 기존 잡 큐(대기열, info tone)용이라 governance QUEUED는
  `StatusBadge`의 `koLabel`/`tone` 오버라이드로 `큐잉됨 (미적용)`·warning을 렌더(공유 토큰 미변경으로
  회귀 회피). 후속에서 governance 전용 배지 토큰을 원하면 별도 논의.
- Detail의 현재 reviewer는 G4대로 리스트 DTO에 없음 — detail의 review thread/latest decision에서 파생.

## 다른 역할에 전달할 내용
- PM: 스코프/게이트 그대로 구현. 이견 없음.
- Backend: `governance/` 모듈과 FE 계약 완전 일치 확인(경로/DTO/enum/에러코드/actor_id+actor_role
  query 메커니즘). 주의점 2가지 — (1) APPROVE/REJECT 권한은 `actor_role` 쿼리(기본 REVIEWER)로 게이팅되고
  segregation은 `actor_id`로 판정하므로 클라이언트/스모크는 approver 호출 시 `actor_role=ONTOLOGY_MANAGER`를
  명시해야 함(actual smoke 반영). (2) 변경 항목 ref/`ontology_version_id`는 시드된 고정 known-id 집합
  (`ontology-v7`/`ontology-v1`, `class-clause` 등)에 대해서만 resolve; smoke는 ADD 항목(ref 불필요)+
  `ontology-v7`로 통과. BACKEND_REPORT.md가 없어 서비스 소스를 진리원으로 확인함 — 최종 필드명이 바뀌면
  통지 바람(현재 불일치 0).
- QA: mock+actual 둘 다 PASS. actual은 SQLite 부팅 + `Base.metadata.create_all` 필요(마이그레이션 미적용
  DB). approval-≠-auto-apply·all-false guard·authz+segregation·422/409·G1 순서를 actual에서 독립 재현
  가능. `smoke:mvp6:governance:actual` 그대로 재사용 권장.

## 총괄에게 요청하는 결정
- FE6-061..064 구현 완료 + mock/actual/build/test/responsive 전부 PASS, 계약 불일치 0. Wave42 FE
  클로즈아웃 승인 요청. (QA가 backend 런타임 게이트 독립 검증만 남음.)

## 현재 판정
- **PASS** (test 53/53, build OK, mock smoke PASS 6-route, actual smoke PASS 10-check against live
  backend, responsive 0-overflow @1440/1366/1280/768, single active Governance LNB, KO titles + D6
  badges + warning-tone QUEUED, no 적용/게시 CTA; API/Enum/DTO 변경 없음; git diff --check clean;
  Wave35-40 무회귀).
