# Frontend Report - Wave 51

## 담당 범위
- backlog ID: `FE6-094` — MVP6.10 Multi-tenant Frontend UX/API 요구사항
  (contract-first planning only)
- 작업 경로:
  - `docs/pm/MVP6_10_FRONTEND_UX_REQUIREMENTS.md` (생성)
  - `docs/handoffs/wave-051/FRONTEND_REPORT.md` (이 보고서)

## 완료한 작업
- MVP6.10 read-only tenant context + strict isolation P0의 프론트엔드 UX/API
  요구사항을 planning-only로 작성했다. route/component/type/mock/smoke 코드는
  `apps/` 아래에 전혀 추가하지 않았다.
- **Placement (ADR 0010)**: tenant는 LNB 항목이 아니라 **app-shell 헤더의
  top-level tenant CONTEXT 인디케이터 + client-side switcher**로 배치. 근거:
  ADR 0010 global zone(Dashboard/Projects/Admin) + ID-bound global page 금지
  규칙, tenant는 destination이 아니라 scoping context, switcher는 client-side
  전용(G5)이라 visibility set만 노출 → 교차 테넌트 선택 자체가 UI에서 도달 불가.
  새 global LNB `Tenants` 항목은 명시적으로 기각.
- **Read-only tenant view**: 헤더 인디케이터에서 여는 **contextual** Tenant
  Context view(패널 또는 `/tenant` 단일 route, id는 client-side active-tenant로
  구동 — 새 LNB destination 아님). tenant summary(`TenantStatus` + 내 membership
  role/status) + tenant-scoped project list. 기존 global `Projects` 목록은 이
  wave에서 재-스코프하지 않음(shipped surface 불변, additive).
- **Isolation-limited UX**: (1) isolation-by-construction — switcher는 `GET
  /tenants` visibility set만 노출, free-text tenant-id 입력/전체 탐색 없음.
  (2) out-of-set(deep-link/stale) → `404 TENANT_NOT_FOUND`(존재/이름/개수/데이터
  무유출), suspended 관계 → `403 TENANT_ACCESS_SUSPENDED`, project→tenant
  out-of-visibility → `404 PROJECT_NOT_FOUND`. `TenantAccessDenialReason` 매핑
  표 + 상태 전환 시 이전 테넌트 데이터 clear, 교차 테넌트 응답 재사용/merge 금지.
- **Boundary + guard**: persistent 비-dismissible "read-only context; no
  provisioning; existing project scoping unchanged; client-side switch only"
  banner + boundary chips + **live all-false 8-flag `TenantMutationGuard` proof
  line**(응답에서 읽음, hardcode 아님; true flag 시 guard-violation 상태).
  create/edit/invite/switch-org-write/provision affordance 전무.
- **First-class states**: loading(my-tenants/summary/projects) / **empty(no
  tenants)** / empty(no projects) / error / permission(suspended) / not-found /
  guard-violation 상태를 표로 정의.
- **Design language**: Section+Card, KO H1(`테넌트 컨텍스트`), D6 badge —
  `TenantStatus`/`TenantMembershipStatus`(ACTIVE/SUSPENDED/ARCHIVED) +
  `TenantAccessDenialReason` 토큰을 D6 §6.3 규칙으로 확장(tone/icon/KO gloss),
  tenant status와 membership status는 별도 슬롯으로 분리(혼동 금지).
- **DTO gap 분석**: Backend draft가 이번 wave 중 착지 → **reconcile 완료**.
  enum/field drift **0**. G1/G2/G4/G5/G6/G7/G10 RESOLVED, G3(error 응답에
  guard 없음 — `ApiError`는 `{code,message,details}`)만 NEEDS-CONFIRM(non-block),
  G8 Wave52 gate, G9 PM copy. `TenantSummary.my_membership`가 switcher row
  role/status를 inline 제공(N+1 없음), `ProjectSummaryRef`는 MVP1 `ProjectSummary`
  by reference(`tenant_id` 미추가), 4개 `*Response` wrapper 확인.

## 변경 파일
- 생성: `docs/pm/MVP6_10_FRONTEND_UX_REQUIREMENTS.md`
- 생성: `docs/handoffs/wave-051/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령: `git diff --check` → **PASS** (whitespace/충돌 경고 없음).
- 결과: 문서 2개만 추가; `apps/` 하위 코드 변경 없음(planning-only 준수).
- Backend draft(`MVP6_10_MULTI_TENANT_API_CONTRACT_DRAFT.md` +
  `openapi-mvp6-10-draft.json`)가 wave 중 착지 → 요구사항 §7/§8을 draft에
  reconcile(enum/field drift 0 확인).
- 실행하지 못한 검증: FE runtime(test/build/smoke)는 이번 wave 범위 아님
  (Wave52). OpenAPI parse는 Backend(`BE6-075`) 몫.

## API/Enum/DTO 변경
- 변경 여부: 없음 (요구사항 문서만; runtime/type/OpenAPI 변경 없음)
- 상세: enum/field 이름은 PM brief §6에서 **verbatim** 인용
  (`TenantStatus`/`TenantMembershipStatus`/`TenantAccessDenialReason`,
  8-flag `TenantMutationGuard`, membership `role`=MVP5 `Role`). 신규 리터럴 없음.
- 영향받는 역할: Backend(draft가 §8 gap 해소), QA(isolation/guard/no-provision
  acceptance).

## Blocker
- 없음. Backend draft 착지 + reconcile 완료, drift 0.

## 남은 TODO (DTO gaps)
- **G3 (NEEDS-CONFIRM, non-block)**: `ApiError`가 `{code,message,details}`라
  error(403/404) 응답에는 `mutation_guard`가 없다. FE는 guard proof line을 200
  응답에만 렌더하고 denial 상태는 `details.denial_reason`로 구동. QA가 error
  응답에도 all-false guard를 원하면 Backend가 `ApiError`에 `mutation_guard` 추가
  (Wave52) — 아니면 이 동작이 확정.
- **G8 (Wave52 gate)**: persist-vs-compute / client-side active-tenant 연속성
  (stale id → 404/403 재검증). contract shape 무변.
- **G9 (PM copy/IA)**: H1 `테넌트 컨텍스트`, 신규 D6 토큰 KO gloss, boundary chip
  라벨 확정.
- G1/G2/G4/G5/G6/G7/G10은 draft로 RESOLVED.

## 다른 역할에 전달할 내용
- PM: H1 `테넌트 컨텍스트` + 신규 D6 토큰 KO gloss + boundary chip 라벨 확정
  요청(G9). Tenant Context view 렌더링 방식(패널 vs 단일 contextual route)은 ADR
  0010 준수 하 FE가 Wave52에 확정 예정 — 이견 있으면 지금 지정 요망.
- Backend: drift 0, 감사. 남은 확인 **G3** — error 응답에도 all-false guard를
  둘지(현재 `ApiError`엔 guard 없음, FE는 200에만 렌더). QA 요구 시 `ApiError`에
  `mutation_guard` 추가 검토. G8(persist-vs-compute)/G7(`actor_id` query param)은
  Wave52에 확정.
- Frontend: (Wave52 self) 헤더 인디케이터+client-side active-tenant(local storage,
  recent-project 패턴 재사용), Tenant Context view, denial 상태, guard proof line
  구현. 기존 `ProjectsPage` 재-스코프 금지(별도 PM freeze 전까지).
- QA: isolation을 headline gate로 — switcher가 visibility set만 노출;
  not-a-member/archived→404 무유출; suspended→403; `.../tenants/{A}/projects`는
  B 미반환; 상태 전환 시 stale 데이터 clear; 응답 all-false 8-flag guard(가능하면
  error 응답 포함). no create/edit/invite/switch-write affordance; client-side
  switch만(서버 state write 없음).

## 총괄에게 요청하는 결정
- Wave51 FE planning(`FE6-094`)을 PASS로 승인 요청.
- **Placement 결정 재가**: tenant CONTEXT 인디케이터+client-side switcher는
  app-shell 헤더(top-level global), read-only tenant view는 헤더에서 여는
  contextual view — 새 global LNB 항목/ID-bound global page 없음(ADR 0010 준수).
- G3(error 응답 guard) 확정 방향 지정 요청: 현행(200에만 guard, error는
  denial_reason) 유지 vs `ApiError`에 all-false `mutation_guard` 추가. QA
  isolation 게이트와 정합만 맞으면 FE는 어느 쪽도 수용.

## 현재 판정
- PASS (planning-only 완료; Backend draft dependency는 non-blocking, §8에 TODO로
  관리)
</content>
