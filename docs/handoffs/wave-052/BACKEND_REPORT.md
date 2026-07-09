# Backend Report - Wave 52

Role: Backend / MVP6.10 Multi-tenant Runtime Thin Slice
Status: `PASS` — 4 read-only endpoints, strict isolation matrix, all-false 8-flag guard, data-level no-mutation, OpenAPI aligned exactly. No contract change.
Date: 2026-07-09

## 담당 범위
- backlog ID: `BE6-076` (tenant list/summary/projects + fixtures), `BE6-077` (project->tenant resolve + isolation 404-not-leak/403-suspended), `BE6-078` (all-false 8-flag guard + no-mutation), `BE6-079` (OpenAPI export/alignment + isolation regression guard).
- 작업 경로: new module `apps/backend/app/modules/tenancy/` (additive, registered after connectors); `apps/backend/tests/test_mvp6_10_tenancy_api.py`.

## 완료한 작업
- Implemented the 4 READ-ONLY GET endpoints matching `docs/api/openapi-mvp6-10-draft.json` EXACTLY:
  - `GET /api/v1/tenants` — the actor's visibility set only.
  - `GET /api/v1/tenants/{tenant_id}` — single tenant summary (member-only).
  - `GET /api/v1/tenants/{tenant_id}/projects` — tenant-scoped project list.
  - `GET /api/v1/projects/{project_id}/tenant` — resolve a project's owning tenant.
- G1: optional dev-only `actor_id` query param (nullable, no hard default in schema); resolves `None -> "dev-user"` in code so the OpenAPI param stays `["string","null"]` optional. Membership by exact `(actor_id, tenant_id)` fixture lookup.
- G3: deterministic process-local fixtures + `reset_runtime_store()` (connectors/goldset precedent). NO DB, NO `tenant_id` column/FK/migration. Fixtures seeded at import and re-seeded on reset (idempotent; P0 mutates nothing).
- G5: 6 tenants / 2 actors / 6 memberships / 7 projects, built VERBATIM to the frozen matrix. `dev-user` visibility set = exactly `{tenant-acme (2 proj), tenant-globex (1 proj)}`, `total_count=2`. `dev-user-2` = member of `tenant-initech` ONLY (disjoint).
- One default-deny isolation function `_decide(actor, tenant)` drives all four endpoints: unknown/not-a-member -> 404; ARCHIVED tenant -> 404; membership SUSPENDED -> 403; tenant SUSPENDED -> 403; else VISIBLE (ACTIVE membership on ACTIVE tenant). Visibility-set membership == "a direct GET would 200".
- `/tenants/{A}/projects` returns only tenant A's projects (never another tenant's). `/projects/{id}/tenant` mirrors the owning tenant's decision: VISIBLE->200, SUSPENDED->403 `TENANT_ACCESS_SUSPENDED` (+denial_reason), not-a-member/archived/unknown->404 `PROJECT_NOT_FOUND` (no denial_reason, existence not leaked).
- Every 200 carries an all-false 8-flag `TenantMutationGuard`. Errors carry NO guard; `ApiError.details.denial_reason` = `TenantAccessDenialReason`. Reused MVP5 `Role` by reference (no rename); `ProjectSummaryRef` is a self-contained MVP1-shape overlay (no `tenant_id` added to the project).
- Added a documentation-only `TenantApiErrorResponse` (mirrors the runtime `{"error":{code,message,details}}` wrapper) used in the router `responses={403,404}` so `TenantAccessDenialReason` surfaces in the exported OpenAPI.

## 변경 파일
- `apps/backend/app/modules/tenancy/__init__.py` (new)
- `apps/backend/app/modules/tenancy/schemas.py` (new)
- `apps/backend/app/modules/tenancy/service.py` (new — fixtures, `_decide`, `reset_runtime_store`)
- `apps/backend/app/modules/tenancy/router.py` (new — 4 GET endpoints)
- `apps/backend/app/api/router.py` (register `tenancy_router` after `connectors_router`)
- `apps/backend/tests/test_mvp6_10_tenancy_api.py` (new — 30 tests)

## 실행/검증
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_10_tenancy_api.py -q` -> **30 passed in 1.60s**
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_9_connectors_api.py -q` -> **30 passed in 5.93s**
- `cd apps/backend && .venv/bin/pytest -q` (full regression) -> **229 passed in 38.54s**
- `cd apps/backend && .venv/bin/ruff check app tests scripts` -> **All checks passed!**
- OpenAPI export/parse/compare (all True): 4 paths present (GET only); enums `TenantStatus`/`TenantMembershipStatus`/`TenantAccessDenialReason`/`Role` == draft; `TenantMutationGuard` = 8 flags; `TenantSummary`/`TenantMembership`/`ProjectSummaryRef`/4 `*Response` props == draft; `actor_id` param required=False.
- `git diff --check` -> CHECK_OK.

### Isolation matrix evidence (dev-user; verified by tests)
| tenant | status | membership | GET /tenants/{id} | denial_reason |
|---|---|---|---|---|
| tenant-acme | ACTIVE | ACTIVE | 200 | — |
| tenant-globex | ACTIVE | ACTIVE | 200 | — |
| tenant-initech | ACTIVE | none (dev-user-2 is member) | 404 TENANT_NOT_FOUND | NOT_A_MEMBER |
| tenant-umbrella | ACTIVE | SUSPENDED | 403 TENANT_ACCESS_SUSPENDED | MEMBERSHIP_SUSPENDED |
| tenant-soylent | SUSPENDED | ACTIVE | 403 TENANT_ACCESS_SUSPENDED | TENANT_SUSPENDED |
| tenant-hooli | ARCHIVED | ACTIVE | 404 TENANT_NOT_FOUND | TENANT_ARCHIVED |

- `GET /tenants` (dev-user) = `[tenant-acme, tenant-globex]`, total_count=2; (dev-user-2) = `[tenant-initech]`, total_count=1 (disjoint); unknown actor = `[]`, total_count=0.
- No-leak asserted: `tenant-initech` 404 for dev-user carries no name/`project_count`/`proj-initech-secret`; yet dev-user-2 gets 200 with project_count=1 (initech genuinely exists).
- `/tenants/tenant-acme/projects` = `[proj-acme-kg, proj-acme-catalog]`; `/tenants/tenant-initech/projects` (dev-user) -> 404, `proj-initech-secret` never in body.
- `/projects/{id}/tenant`: proj-acme-kg->200; proj-initech-secret->404 PROJECT_NOT_FOUND (no leak); proj-umbrella-01->403 MEMBERSHIP_SUSPENDED; proj-soylent-01->403 TENANT_SUSPENDED; proj-hooli-01->404; unknown->404.
- DATA-LEVEL no-mutation: all DB tables (COUNT(*)) AND fixture tables (tenants/memberships/project_owner/projects_by_tenant) before==after exercising every endpoint x every branch x 3 actors. Existing `GET /projects` unchanged and tenant-unaware.

## API/Enum/DTO 변경
- 변경 여부: 없음 (contract shape). Implemented exactly as `openapi-mvp6-10-draft.json`.
- 상세: added `TenantApiError`/`TenantApiErrorResponse` documentation models only to surface the `TenantAccessDenialReason` enum + document the wrapped error shape; no new endpoint/field/enum beyond the frozen draft. `Role` reused verbatim.
- 영향받는 역할: FE (mirror types/client/mocks), QA (assert matrix).

## Blocker
- 없음.

## 남은 TODO
- P1/P2 (out of scope this wave): durable DB tenants/memberships, `tenant_id` on Project, provisioning/mutation surfaces, real auth actor.

## 다른 역할에 전달할 내용
- PM: none. Freeze implemented exactly; no decision needed.
- Frontend: base path `/api/v1`. Shapes — `TenantSummary{id, display_name, description?, status:TenantStatus, my_membership:{actor_id,tenant_id,role:Role,status:TenantMembershipStatus}, project_count, created_at}`; list = `{actor_id, items[], total_count, mutation_guard}`; summary = `{actor_id, tenant, mutation_guard}`; projects = `{actor_id, tenant_id, items:ProjectSummaryRef[], total_count, mutation_guard}`; project->tenant = `{actor_id, project_id, tenant, mutation_guard}`. `ProjectSummaryRef{id,name,description?,status,created_at,updated_at,source_count,ontology_version_count}`. Isolation error codes: 404 `TENANT_NOT_FOUND` / 404 `PROJECT_NOT_FOUND` / 403 `TENANT_ACCESS_SUSPENDED`, wrapped as `{"error":{code,message,details}}`; drive UI from `error.details.denial_reason` (NOT_A_MEMBER/TENANT_ARCHIVED/MEMBERSHIP_SUSPENDED/TENANT_SUSPENDED). `TENANT_NOT_FOUND` carries denial_reason; `PROJECT_NOT_FOUND` carries none (no leak). All-false 8-flag guard on 200 ONLY; errors carry NO guard. `actor_id` is a dev-only query lever, not a production control. Default actor = `dev-user` sees exactly `{tenant-acme, tenant-globex}`.
- QA: the three isolation outcomes = tenant-initech (404 NOT_A_MEMBER), tenant-umbrella (403 MEMBERSHIP_SUSPENDED), tenant-soylent (403 TENANT_SUSPENDED), + tenant-hooli (404 TENANT_ARCHIVED). Use `dev-user-2` to prove disjoint sets / no-leak of proj-initech-secret. `service.reset_runtime_store()` re-seeds fixtures; snapshot `service._TENANTS/_MEMBERSHIPS/_PROJECT_OWNER/_PROJECTS_BY_TENANT` for a data-level before==after check.

## 총괄에게 요청하는 결정
- None. `/projects/{id}/tenant` uses the mirror-the-tenant-decision rule (200/403/404) per the PM freeze; if a pure-404-not-leak variant on that path is preferred, one line in `resolve_project_tenant` collapses the 403 branch to 404.

## 현재 판정
- `PASS` — 4 endpoints + full isolation matrix (200 / 404-not-leak / 403-suspended / 404-archived) for dev-user AND dev-user-2, all-false 8-flag guard on every 200, errors carry denial_reason + no guard, data-level no-mutation, additive (229/229 regression green), OpenAPI aligned exactly. Frontend/QA unblocked.
