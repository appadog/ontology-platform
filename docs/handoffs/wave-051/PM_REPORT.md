# PM / Architecture Report - Wave 51

## 담당 범위
- backlog ID:
  - `PM6-033` MVP6.10 Multi-tenant Runtime P0 scope freeze (contract-first
    planning only)
  - (생성한 후속 ID: `BE6-074`~`BE6-075`, `FE6-094`, `INT6-080`)
- 작업 경로:
  - `docs/pm/MVP6_10_MULTI_TENANT_BRIEF.md`
  - `docs/adr/0017-mvp6-10-multi-tenant-read-only-context-strict-isolation-no-provisioning-additive-over-project-scoping-boundary.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-051/PM_REPORT.md`

## 완료한 작업
- MVP6.10 Multi-tenant Runtime(roadmap §9 Theme 6)을 **가장 작고 SAFE한 read-only
  tenant CONTEXT + strict isolation** P0로 contract-first planning freeze했다.
  runtime/route/component/model/migration/seed/smoke/test는 열지 않았다(Wave52 대기).
- **P0 flow 확정**: `dev actor 인증 -> Tenant Context(my-tenants 위 top-level
  indicator/switcher) 열기 -> 내가 ACTIVE member인 tenant만 보기 -> tenant summary
  -> tenant-scoped project list -> project가 속한 tenant resolve -> 내가 속하지
  않은 tenant 시도 -> 404(이름/개수/데이터 무유출) -> suspended 관계 tenant 시도
  -> 403`. 아무것도 provision/mutate/re-home하지 않는다.
- **Tenant/membership 모델 확정(최소)**: 단일 레벨 **Tenant**(P0에서
  org/workspace 통합) + 몇 개의 deterministic mock tenant. `TenantMembership =
  (actor_id, tenant_id, role, status)`이며 `role`은 MVP5 `Role`을 **그대로**
  재사용(신규 리터럴 없음). `Project → Tenant`는 tenant 모듈 내부의 deterministic
  fixture 매핑(논리적 매핑, **DB FK/`tenant_id` 컬럼 없음**). fixture는 3가지
  isolation 결과(member / not-a-member / inactive relationship)를 모두 커버해야
  한다.
- **읽기 전용 endpoint(Backend가 최종 확정)**: (1) `GET /api/v1/tenants` my
  tenants(visibility set만), (2) `GET /api/v1/tenants/{id}` tenant summary
  (member 전용), (3) `GET /api/v1/tenants/{id}/projects` tenant-scoped projects,
  (4) `GET /api/v1/projects/{id}/tenant` project의 tenant resolve(trimmable).
  mutation 전무.
- **ISOLATION 규칙 + error code 확정(헤드라인 invariant)**: visibility set =
  actor가 non-`ARCHIVED` tenant에 `ACTIVE` membership을 가진 tenant. `GET
  /tenants`는 정확히 그 set만 반환(다른 tenant의 id/name/count/summary 무유출).
  set 밖(unknown/archived/not-a-member) → `404 TENANT_NOT_FOUND`(존재 자체를
  누설하지 않도록 403이 아닌 **404**). inactive 관계(membership 또는 tenant
  `SUSPENDED`) → `403 TENANT_ACCESS_SUSPENDED`. `.../tenants/{A}/projects`는 오직
  A의 project만 반환(B의 project는 A가 member여도 절대 반환 안 함).
  `/projects/{id}/tenant`가 visibility 밖이면 `404 PROJECT_NOT_FOUND`.
  `403 PERMISSION_DENIED`는 향후 role-gated write용으로 예약(P0 read는 생성 안 함).
  한 줄 규칙: **default-deny, 404-not-leak**.
- **enum/state 확정**: `TenantStatus`(`ACTIVE`/`SUSPENDED`/`ARCHIVED`),
  `TenantMembershipStatus`(`ACTIVE`/`SUSPENDED`), `TenantAccessDenialReason`
  (`NOT_A_MEMBER`/`TENANT_ARCHIVED`/`MEMBERSHIP_SUSPENDED`/`TENANT_SUSPENDED`).
  membership `role`은 MVP5 `Role` 재사용(신규 enum 없음).
- **all-false 8-flag guard 확정**: 모든 응답이 all-false `TenantMutationGuard`
  (`tenant_created`/`tenant_updated`/`tenant_deleted`/`membership_mutated`/
  `project_rehomed`/`cross_tenant_access_granted`/`candidate_graph_mutated`/
  `published_graph_mutated`) — 모두 false. `cross_tenant_access_granted`와
  `project_rehomed`가 isolation 전용 assertion.
- **authz 결정**: read는 non-inactive tenant의 `ACTIVE` membership으로 gate(=
  isolation gate). ACTIVE member면(`VIEWER`라도) P0에서 summary+project list 읽기
  가능. `Role`은 membership에 실려 DTO로 노출(향후 write/admin용)되나 P0 read엔
  불필요. MVP5 `Role` 재사용, 신규 role literal 없음. actor identity는 MVP5
  dev-auth actor 패턴 재사용.
- **additive-over-project-scoping 확정**: 기존 MVP1 `Project` + 모든 MVP1–MVP6.9
  per-project endpoint 불변(tenant-unaware). `tenant_id` 컬럼 없음, migration/
  backfill 없음, 기존 데이터 re-home/rename 없음. 기존 shape는 `$ref`로만 재사용.
- **exclusion 명시**: tenant create/update/delete; membership mutation
  (invite/add/remove/role-change); cross-tenant access; tenant-level billing/
  quota/usage 집행(`UsageQuota`/`BillingUsageEvent`); data re-homing/migration/
  `tenant_id` backfill; real auth/SSO/OIDC tenancy + JWT tenant claim; per-tenant
  object-storage/search/vector 분리; 2단계 Organization↔Workspace 계층
  (`Organization`/`Workspace`/`TenantSetting`); cross-domain alignment/mapping
  (`Domain`/`OntologyAlignment`/`CrossDomainMapping`); domain/usage dashboard;
  server-side/session tenant switching; 모든 candidate/published-graph mutation.
- backlog에 Wave51 freeze summary + `PM6-033`/`BE6-074`~`075`/`FE6-094`/`INT6-080`
  을 기존 번호 체계를 이어 추가하고 상단 status를 갱신했다. QA ID는 지시대로
  `INT6-080`부터(INT6는 INT6-079까지 사용됨).
- 새 durable boundary(read-only tenant context + strict isolation / no
  provisioning-mutation / additive-over-project-scoping / all-false guard)이므로
  ADR `0017`을 기존 per-MVP boundary 패턴(0006~0016)으로 추가했다.

## 변경 파일
- 생성:
  - `docs/pm/MVP6_10_MULTI_TENANT_BRIEF.md`
  - `docs/adr/0017-mvp6-10-multi-tenant-read-only-context-strict-isolation-no-provisioning-additive-over-project-scoping-boundary.md`
  - `docs/handoffs/wave-051/PM_REPORT.md`
- 수정:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md` (상단 status + Wave51 freeze summary + ID 표)

## 실행/검증
- 실행한 명령:
  - `git diff --check` → PASS (whitespace/충돌 경고 없음).
  - `git status --porcelain` → PM/backlog/ADR/handoff 문서만 변경.
  - runtime leakage 스캔(`apps/`/`infra/`에 tenant runtime 부재).
- 결과: `git diff --check` PASS; runtime leakage 없음.
- 실행하지 못한 검증: PM/Architecture 문서 범위라 backend/frontend runtime/test/
  OpenAPI export는 수행하지 않는다. OpenAPI planning artifact
  (`openapi-mvp6-10-draft.json`) 작성/parse는 Backend(`BE6-075`) 몫.

## API/Enum/DTO 변경 (planning only)
- 변경 여부: 있음, **문서 계약 한정** (runtime/OpenAPI/DB/route 변경 없음)
- 신규 enum 후보(문서 계약): `TenantStatus`(`ACTIVE`/`SUSPENDED`/`ARCHIVED`),
  `TenantMembershipStatus`(`ACTIVE`/`SUSPENDED`), `TenantAccessDenialReason`
  (`NOT_A_MEMBER`/`TENANT_ARCHIVED`/`MEMBERSHIP_SUSPENDED`/`TENANT_SUSPENDED`).
- 신규 DTO 후보(문서 계약): tenant summary item; `TenantMembership`
  (`actor_id`/`tenant_id`/`role`=MVP5 `Role`/`status`); tenant-scoped project
  list item(기존 project shape 재사용); project→tenant resolve; all-false 8-flag
  `TenantMutationGuard`. Backend가 `BE6-074`~`075`에서 최종 필드/이름/경로/
  persist-vs-compute를 확정한다.
- 재사용(by `$ref`, rename 없음): MVP5 `Role` + dev-auth actor + audit shape,
  MVP1 `Project`/`ProjectStatus` + per-project endpoint.
- 영향받는 역할: Backend/Frontend/QA (아래 전달 내용 참조).

## Blocker
- 없음.

## 남은 TODO
- Backend(`BE6-074`~`075`): `docs/api/MVP6_10_MULTI_TENANT_API_CONTRACT_DRAFT.md`
  (additive read-only endpoint families + enums/DTOs + all-false 8-flag guard +
  isolation error code 명시) + `docs/api/openapi-mvp6-10-draft.json`(additive,
  OpenAPI 3.1.0, `0.6.10-draft`, disjoint-additive). open question(gate):
  G1 dev actor resolution(negative/cross-tenant 테스트용 `actor_id` query param
  등), G3 persist-vs-compute(process-local `reset_runtime_store()` vs
  compute-on-read), G4 endpoint #4(`/projects/{id}/tenant`) in/out.
- Frontend(`FE6-094`): `docs/pm/MVP6_10_FRONTEND_UX_REQUIREMENTS.md`(tenant
  context indicator/client-side switcher + read-only tenant view의 ADR 0010
  placement, tenant-scoped project list, isolation-limited state, "read-only
  context; no provisioning; project scoping unchanged" boundary copy, live
  all-false-guard proof line, loading/empty/error/permission 상태, DTO gap).
  route/component/type/mock/smoke 코드 없음.
- QA(`INT6-080`): `docs/backlog/INT6_10_MULTI_TENANT_ACCEPTANCE.md`(C planning +
  R NOT-RUNNABLE) + ISOLATION headline gate + all-false/no-leak/additive/
  no-provisioning guard + Wave52 권고.

## 다른 역할에 전달할 내용
- Backend:
  - **draft할 contract**: 4개 read-only endpoint family(`GET /tenants`,
    `GET /tenants/{id}`, `GET /tenants/{id}/projects`, `GET /projects/{id}/tenant`).
    mutation 전무. MVP5 `Role`/dev-auth actor + MVP1 `Project`를 `$ref`로만
    재사용(rename 금지); tenant-provisioning/membership-mutation/data-migration
    path 미import.
  - **검토할 필드/상태**: 3 enum(`TenantStatus`, `TenantMembershipStatus`,
    `TenantAccessDenialReason`); `TenantMembership`(role=MVP5 `Role`); tenant
    summary + tenant-scoped project list(기존 project shape 재사용);
    **모든** 응답에 all-false 8-flag `TenantMutationGuard`; isolation error code
    (`404 TENANT_NOT_FOUND` not-leak / `403 TENANT_ACCESS_SUSPENDED` /
    `404 PROJECT_NOT_FOUND`). G1/G2/G3/G4 open question 해소.
  - **checklist에 넣을 것**: visibility-set 필터가 정확(my set만); not-a-member
    → 404 무유출; suspended → 403; `.../tenants/{A}/projects`는 절대 B 반환 안 함;
    all-false guard; deterministic; `tenant_id` 컬럼/migration/backfill 없음.
- Frontend:
  - **검토할 fields+states**: tenant context indicator/client-side switcher +
    read-only tenant/workspace view placement(ADR 0010 — top-level global
    indicator; tenant detail은 contextual, 신규 ID-bound global LNB page 없음);
    tenant-scoped project list; isolation-limited state(cross-tenant denied —
    명확, 데이터 무유출); **persistent "read-only context; no provisioning;
    existing project scoping unchanged" boundary banner** + live all-false-guard
    proof line; loading/empty/error/permission 일급. 닫힌 design language
    (Section+Card, KO title, D6 badge). provisioning/switch-write copy 금지.
    switcher는 client-side only(server state write 없음, gate G5). DTO gap을
    Backend draft 대비 기록. route/component/type/mock/smoke 코드 없음.
- QA:
  - **checklist에 넣을 것**: PM/BE/FE가 P0 flow·tenant/membership 모델·read-only
    + strict-isolation + no-provisioning + additive-over-project-scoping
    boundary·all-false 8-flag guard·exclusion에 합의하는지; **ISOLATION을
    headline runtime gate로**(my-tenants가 my set만; not-a-member→404 무유출;
    suspended→403; `.../tenants/{A}/projects`는 B 미반환; project→tenant
    out-of-visibility→404); all-false guard(응답) + data-level
    (tenant/membership/project row create/update/delete 없음, re-homing 없음,
    before==after) + code-level(provisioning/membership-mutation/migration path
    미import); deterministic; MVP5 `Role`/MVP1 `Project` rename 부재; OpenAPI
    parse/additivity; `apps/`/`infra/` runtime leakage 부재. Wave52 권고.

## 총괄에게 요청하는 결정
- Wave51 PM freeze를 PASS로 승인하고 Backend/Frontend/QA가 contract-first
  planning(`BE6-074`~`075`/`FE6-094`/`INT6-080`)을 이어가도록 허용해 달라.
- MVP6.10 P0를 **read-only tenant context + strict isolation까지**로 유지하고
  (nothing provisioned/mutated/re-homed; my-tenants/tenant summary/tenant-scoped
  projects/project→tenant 4개 read-only endpoint; default-deny 404-not-leak
  isolation; 모든 응답 all-false 8-flag guard), tenant provisioning/membership
  mutation·cross-tenant access·billing/quota·data re-homing/migration·real
  auth/SSO tenancy·2단계 org/workspace 계층·cross-domain alignment는 별도
  wave(P1+)로 분리해 달라.
- single-level **Tenant**(org/workspace 통합)를 P0 상한으로 승인해 달라(2단계
  Organization↔Workspace 계층은 이후 PM freeze로만 추가).

## 현재 판정
- PASS
