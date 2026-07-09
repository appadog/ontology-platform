# QA / Integration Report - Wave 51

## 담당 범위
- backlog ID: `INT6-080`..`INT6-089` (MVP6.10 Multi-tenant acceptance; `INT6-080` = checklist slot)
- 작업 경로:
  - `docs/backlog/INT6_10_MULTI_TENANT_ACCEPTANCE.md` (생성)
  - `docs/handoffs/wave-051/QA_REPORT.md` (이 보고서)
- 성격: contract-first PLANNING ONLY. runtime/route/component/test/seed 코드 없음
  (Wave52 대기). `apps/`, `infra/` 미변경.

## 완료한 작업
- MVP6.10 read-only tenant context + strict isolation P0의 executable acceptance
  checklist을 작성했다. **C1–C10 planning gate(PASS)** + **R1–R9 runtime gate
  (NOT RUNNABLE by design)**, 그리고 ISOLATION을 headline runtime gate로 전면 배치
  (별도 ISOLATION 표 + R2/R3가 headline). INT6 번호를 `INT6-080`부터 이어썼다.
- PM(brief+ADR 0017)/BE(contract+OpenAPI)/FE(UX 요구)가 P0 flow·단일 레벨
  tenant + `TenantMembership(actor_id,tenant_id,role,status)` 모델·read-only +
  strict-isolation + no-provisioning + additive-over-project-scoping boundary·
  all-false **8-flag** guard·exclusion·reuse-by-reference(no rename)에 합의함을
  대조 검증했다. **모순 없음.** BE는 FE와 **enum/field drift 0**을 보고.
- OpenAPI(`0.6.10-draft`, 3.1.0)를 parse + 구조/isolation-error assertion으로
  검증(4 paths / 4 GET / 13 schemas; 3 enum + `Role` 8리터럴 verbatim; 8-flag
  all-false guard가 4개 응답 전부에; 3개 isolation error code 존재; 3개 member-gated
  endpoint에 403+404 배선; `GET /tenants`는 200-only). 기존 `openapi-mvp*.json`과
  **disjoint-additive** 확인.
- `apps/`/`infra/` runtime leakage 스캔 = **0 matches**(runtime 미유출).

## 주요 per-area 판정
- **PM:** P0/모델/boundary/exclusion freeze 명확. ADR 0017이 durable boundary로
  기존 0006–0016 패턴 계승. PASS.
- **Backend:** contract가 PM freeze와 일치. isolation을 error response로 명시적
  모델링(404-not-leak/403-suspended/404-project). guard 8-flag const:false+required.
  `ProjectSummaryRef`가 MVP1 shape by reference(`tenant_id` 미추가). OpenAPI
  additive/disjoint. PASS.
- **Frontend:** placement(ADR 0010 준수 — header context indicator + client-side
  switcher, 신규 global LNB 없음), isolation-limited state(404 무유출/403/404
  project), guard proof line(200 only), 상태표 일급. drift 0. PASS.

## Wave52 gates (recorded)
- **G1 — dev actor resolution:** dev-only `actor_id` query param(`ActorIdQuery`,
  모든 endpoint에 modeled)으로 member/non-member/suspended actor를 결정적으로
  전환 — negative isolation gate 실행에 필수. real auth/JWT claim 아님. 정확한
  메커니즘은 Wave52 확정.
- **G3 — persist-vs-compute:** process-local store + `reset_runtime_store()` vs
  compute-on-read(fixtures). Backend/Wave52 결정. 어느 쪽이든 read-only +
  all-false guard, contract shape 무변.
- **G5 — fixture ids/counts (3 isolation outcomes):** ≥1 ACTIVE-member tenant
  (with projects) / ≥1 not-a-member tenant(→404, projects 무노출) / ≥1 inactive
  relationship(membership 또는 tenant SUSPENDED→403). Backend가 Wave52에 정확한
  ids/counts 확정.
- **ERROR-ENVELOPE-GUARD — COMMANDER RULING (recorded):** error 응답은
  `mutation_guard`를 **싣지 않는다**. FE는 all-false guard proof를 **200 응답에만**
  렌더하고, denial 상태는 `ApiError.details.denial_reason`으로 구동. error는
  정의상 아무것도 mutate하지 않으므로 error envelope에 guard 불필요. `ApiError`는
  `{code,message,details}` 유지. Wave52 확정 동작 — QA는 403/404 envelope에 guard를
  **assert하지 않는다.** (FE G3 해소.)
- **G4 — endpoint #4 (`/projects/{id}/tenant`): default KEEP.** isolation 복잡화
  없이 demo 가치 추가.
- **Response timestamp:** P0는 response-time `generated_at` 미모델. 추후 추가 시
  byte-stable determinism assertion에서 제외.

## 실행/검증 — exact commands + output
```text
$ python3 -m json.tool docs/api/openapi-mvp6-10-draft.json > /dev/null && echo PARSE_OK
PARSE_OK

# 구조 + isolation assertion (python)
openapi: 3.1.0 | version: 0.6.10-draft
num_paths: 4
PATH /api/v1/projects/{project_id}/tenant ['get']
PATH /api/v1/tenants ['get']
PATH /api/v1/tenants/{tenant_id} ['get']
PATH /api/v1/tenants/{tenant_id}/projects ['get']
num_schemas: 13
ENUM TenantStatus = ['ACTIVE','SUSPENDED','ARCHIVED']
ENUM TenantMembershipStatus = ['ACTIVE','SUSPENDED']
ENUM TenantAccessDenialReason = ['NOT_A_MEMBER','TENANT_ARCHIVED','MEMBERSHIP_SUSPENDED','TENANT_SUSPENDED']
ENUM Role = ['SYSTEM_ADMIN','PROJECT_ADMIN','ONTOLOGY_MANAGER','DATA_MANAGER','EXTRACTION_MANAGER','REVIEWER','VIEWER','API_CLIENT']
guard flags: 8 | ALL_FALSE: True | required: 8
guard flag names: ['candidate_graph_mutated','cross_tenant_access_granted','membership_mutated','project_rehomed','published_graph_mutated','tenant_created','tenant_deleted','tenant_updated']
error code present: TENANT_NOT_FOUND -> True | TENANT_ACCESS_SUSPENDED -> True | PROJECT_NOT_FOUND -> True
mutation_guard on all four *Response schemas: True

# per-operation error wiring
/api/v1/tenants                       GET -> ['200']            (visibility-set only; never denies)
/api/v1/tenants/{tenant_id}           GET -> ['200','403','404']
/api/v1/tenants/{tenant_id}/projects  GET -> ['200','403','404']
/api/v1/projects/{project_id}/tenant  GET -> ['200','403','404']
ApiError props: ['code','details','message']   (NO mutation_guard — commander ruling)
ApiError.details.denial_reason -> $ref TenantAccessDenialReason
params: ['ActorIdQuery','ProjectIdPath','TenantIdPath']   (dev-only actor_id present, G1)
DISJOINT_ADDITIVE: True

$ rg -n 'tenant|Tenant|TenantMutationGuard|multi-tenant|mvp6.10' apps infra --glob '!**/node_modules/**'
(0 matches — EXIT=1; no runtime leaked)

$ git diff --check
CHECK_OK
```
- 실행하지 못한 검증: runtime/route/test/OpenAPI export/smoke는 planning wave 범위
  밖(Wave52). R1–R9 NOT RUNNABLE by design.

## API/Enum/DTO 변경
- 변경 여부: 없음 (acceptance checklist 문서 + QA 보고서만; runtime/type/OpenAPI 무변).
- 상세: enum/DTO 이름은 BE draft/PM brief에서 verbatim 인용. 신규 리터럴 없음.
- 영향받는 역할: PM/Backend/Frontend (Wave52 gate 확정).

## Blocker
- 없음.

## 남은 TODO
- Wave52 구현: G1(`actor_id`)/G3(persist-vs-compute)/G5(fixture ids·counts) PM
  freeze; Backend 4개 additive read-only endpoint 구현; Frontend header tenant
  context indicator + client-side switcher + contextual read-only view(신규 global
  LNB 없음); QA가 R1–R9 독립 검증(R2/R3 isolation headline).

## 다른 역할에 전달할 내용
- PM: G1/G3/G5 + G9 copy(H1 `테넌트 컨텍스트`, D6 토큰 KO gloss, boundary chip
  라벨) Wave52 freeze 요청. G4 default keep 승인 권고.
- Backend: fixture가 3 isolation outcome(member/not-a-member/inactive) 전부
  커버해야 negative gate 실행 가능(G5). error envelope에 guard 미부착(commander
  ruling) — `ApiError` shape 유지.
- Frontend: guard proof line은 200 응답에만; denial은 `denial_reason`으로.
  기존 `ProjectsPage` 재-스코프 금지(별도 PM freeze 전까지). switcher client-side only.
- QA(Wave52 self): R2/R3(isolation) headline; data-level no-provision/no-migration
  proof; all-false 8-flag guard; `actor_id`로 3 outcome 결정적 전환.

## 총괄에게 요청하는 결정
- Wave51 전체(PM/BE/FE/QA planning)를 PASS로 승인하고 Wave52 thin implementation
  개시를 허용해 달라.
- Wave52 착수 전 G1(`actor_id`)/G3(persist-vs-compute)/G5(fixture ids·counts)
  PM freeze, G4 default keep 확인.
- ERROR-ENVELOPE-GUARD ruling(error 응답에 guard 미부착; 200에만 proof,
  denial은 `denial_reason`)을 최종 확정으로 기록해 달라.

## 현재 판정
- PASS (planning) — C1–C10 PASS; R1–R9 NOT RUNNABLE by design until Wave52.
  Recommendation: **Wave52 thin implementation** (isolation gate가 headline).
