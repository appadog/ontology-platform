# Backend Report - Wave 51

## 담당 범위
- backlog ID: `BE6-074` (contract draft), `BE6-075` (OpenAPI planning artifact)
- 작업 경로:
  - `docs/api/MVP6_10_MULTI_TENANT_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp6-10-draft.json`
- 성격: contract-first PLANNING ONLY. runtime/model/migration/route/test/seed 코드
  없음(Wave52 대기). `apps/`, `infra/` 미변경.

## 완료한 작업
- MVP6.10 Multi-tenant P0(read-only tenant context + strict isolation)을
  ADR 0017 + `MVP6_10_MULTI_TENANT_BRIEF.md` freeze 그대로 additive 계약으로 draft.
- **읽기 전용 endpoint 4개** 확정(모두 GET, mutation 전무):
  1. `GET /api/v1/tenants` — my tenants(visibility set만) -> `TenantListResponse`
  2. `GET /api/v1/tenants/{tenant_id}` — tenant summary(member 전용) -> `TenantSummaryResponse`
  3. `GET /api/v1/tenants/{tenant_id}/projects` — tenant-scoped projects -> `TenantProjectListResponse`
  4. `GET /api/v1/projects/{project_id}/tenant` — project의 tenant resolve(trimmable, G4) -> `ProjectTenantResponse`
- **frozen enum 3개** verbatim 사용: `TenantStatus`(ACTIVE/SUSPENDED/ARCHIVED),
  `TenantMembershipStatus`(ACTIVE/SUSPENDED), `TenantAccessDenialReason`
  (NOT_A_MEMBER/TENANT_ARCHIVED/MEMBERSHIP_SUSPENDED/TENANT_SUSPENDED). MVP5 `Role`
  8 리터럴 verbatim 재사용(신규 리터럴 없음).
- **ISOLATION(헤드라인)을 error response로 명시적 모델링**: visibility set = actor가
  non-ARCHIVED tenant에 ACTIVE membership을 가진 tenant. set 밖(unknown/ARCHIVED/
  not-a-member) -> `404 TENANT_NOT_FOUND`(존재 무유출, 403 아님); known-but-inactive
  (membership 또는 tenant SUSPENDED) -> `403 TENANT_ACCESS_SUSPENDED`;
  `.../tenants/{A}/projects`는 A의 project만; `/projects/{id}/tenant` out-of-visibility
  -> `404 PROJECT_NOT_FOUND`. `403 PERMISSION_DENIED`는 향후 write용 예약(P0 미생성).
  `ApiError.details.denial_reason`로 `TenantAccessDenialReason` 노출.
- **all-false 8-flag `TenantMutationGuard`**(모두 `const:false` + `required`)를
  4개 응답 전부에 부착: `tenant_created`/`tenant_updated`/`tenant_deleted`/
  `membership_mutated`/`project_rehomed`/`cross_tenant_access_granted`/
  `candidate_graph_mutated`/`published_graph_mutated`.
- **tenant<->project는 fixture 매핑**(계약에 `tenant_id` 컬럼/FK/migration 없음).
  project 아이템은 MVP1 `ProjectSummary` shape를 `ProjectSummaryRef`로 by-reference
  재사용(rename 없음, project에 tenant_id 필드 미추가).
- open question(G1 dev actor `actor_id` query param / G2 404-vs-403 / G3
  persist-vs-compute / G4 endpoint#4 / G5 fixture 3-outcome / response timestamp)을
  contract에 기록.

## 변경 파일
- 생성: `docs/api/MVP6_10_MULTI_TENANT_API_CONTRACT_DRAFT.md`
- 생성: `docs/api/openapi-mvp6-10-draft.json`
- 생성: `docs/handoffs/wave-051/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp6-10-draft.json > /dev/null` -> `PARSE_OK`
  - path/schema count: **paths=4, operations=4(GET only), schemas=13**, parameters=3,
    responses=3, examples=7, version=`0.6.10-draft`.
  - `git diff --check` -> PASS(whitespace/conflict 경고 없음).
  - runtime leakage 스캔: `apps/`/`infra/` 소스에 tenant runtime 부재(node_modules
    노이즈만).
- 결과: PARSE_OK; additive/disjoint(신규 `/tenants*` + `/projects/{id}/tenant`
  경로, MVP1-MVP6.9 경로 미변경); guard/enum/isolation-code 계약대로.
- 실행하지 못한 검증: runtime/route/test/OpenAPI export는 planning wave 범위 밖
  (Wave52). 실제 서버 라우팅/스모크 없음.

## API/Enum/DTO 변경
- 변경 여부: 있음 — **문서 계약 한정(planning-only, additive)**. runtime/DB/route/
  OpenAPI export 변경 없음.
- 상세:
  - 신규 enum(계약): `TenantStatus`, `TenantMembershipStatus`,
    `TenantAccessDenialReason`. `Role`은 MVP5 verbatim 재사용(신규 아님).
  - 신규 DTO(계약): `TenantMutationGuard`(8-flag all-false), `TenantMembership`,
    `TenantSummary`, `ProjectSummaryRef`(MVP1 by-ref), `TenantListResponse`,
    `TenantSummaryResponse`, `TenantProjectListResponse`, `ProjectTenantResponse`,
    `ApiError`.
  - 재사용(by reference, rename 없음): MVP5 `Role`+dev-auth actor, MVP1
    `Project`/`ProjectStatus`/`ProjectSummary`.
- 영향받는 역할: Frontend(UX/API 요구), QA(acceptance checklist).

## Blocker
- 없음.

## 남은 TODO
- Frontend(`FE6-094`): DTO shape gap 분석 + tenant context/switcher IA + isolation-
  limited state, planning only.
- QA(`INT6-080`): isolation headline gate + all-false/no-leak/additive acceptance
  checklist(C planning + R NOT-RUNNABLE).
- Wave52(구현): G1(actor_id 해석)/G3(persist-vs-compute)/G5(fixture ids·counts)
  확정, runtime + fixture + smoke.

## 다른 역할에 전달할 내용
- Frontend:
  - **DTO shapes**: `TenantSummary` = `{id, display_name, description?, status,
    my_membership{actor_id,tenant_id,role,status}, project_count, created_at}` —
    list/summary/project->tenant 공용 아이템. `TenantListResponse`/`...Summary`/
    `...ProjectList`/`ProjectTenantResponse`는 모두 `actor_id` + `mutation_guard`
    포함; project list item은 MVP1 `ProjectSummary` shape(`ProjectSummaryRef`).
    `Role`은 `my_membership.role`로 노출(P0 read엔 불필요, 향후 write/admin용).
  - **isolation error codes(3-state 상태 UI)**: `404 TENANT_NOT_FOUND`
    (not-a-member/archived/unknown — 이름/개수/데이터 무유출, "존재 자체 비노출"
    카피), `403 TENANT_ACCESS_SUSPENDED`(known-but-inactive), `404 PROJECT_NOT_FOUND`
    (project resolve out-of-visibility). `403 PERMISSION_DENIED`는 P0에 없음.
  - **all-false 8-flag guard**는 모든 응답에 존재 -> live proof line으로 렌더 가능.
  - switcher는 client-side only(server state write 없음, G5/브리프); `actor_id`는
    dev-only 쿼리(FE 프로덕션 UI 요소 아님).
- QA:
  - **headline isolation gate**: `GET /tenants`가 my set만; not-a-member -> 404
    무유출; ARCHIVED -> 404; suspended(membership/tenant) -> 403;
    `.../tenants/{A}/projects`는 B의 project 절대 미반환; `/projects/{id}/tenant`
    out-of-visibility -> 404. `ApiError.details.denial_reason`로 사유 검증 가능.
  - **all-false guard**(응답) + `cross_tenant_access_granted`/`project_rehomed`
    false를 isolation 전용 assertion으로.
  - **additive/no-migration**: `tenant_id` 컬럼/FK/migration/backfill 없음;
    MVP1-MVP6.9 경로/enum/스모크 불변. OpenAPI parse=OK(4 paths/13 schemas).
  - `actor_id` 쿼리(G1)로 member/non-member/suspended actor를 deterministic하게
    전환하는 방식이 Wave52에서 확정되어야 negative gate가 실행 가능.
- PM:
  - 4번째 endpoint(`/projects/{id}/tenant`) default keep로 유지(G4). fixture는
    3-outcome(member/not-a-member/inactive)를 반드시 커버해야 함(G5) — 계약은 이미
    수용하도록 타이핑됨.

## 총괄에게 요청하는 결정
- Wave51 Backend contract draft(4 read-only endpoint / 3 신규 enum + `Role` 재사용 /
  8-flag all-false guard / default-deny 404-not-leak isolation, additive
  `0.6.10-draft`)를 PASS로 승인하고 FE(`FE6-094`)·QA(`INT6-080`) planning을 이어가게
  해달라.
- Wave52 구현 착수 전 G1(actor_id)·G3(persist-vs-compute)·G5(fixture ids/counts)
  PM freeze 여부 결정 요청. G4(endpoint#4)는 default keep 권고.

## 현재 판정
- PASS
