# PM Report - Wave 52

Role: PM / Architect — MVP6.10 Multi-tenant THIN IMPLEMENTATION scope guard + gate freeze
Status: `PASS` — G1/G3/G5 frozen, error-envelope-guard ratified, scope unchanged. BE/FE unblocked.
Date: 2026-07-09

## 담당 범위
- backlog ID: `PM6-034` (this freeze). Records implementation IDs `BE6-076`..`BE6-079`, `FE6-095`..`FE6-098`, `INT6-090`..`INT6-093`.
- 작업 경로: `docs/handoffs/wave-052/PM_REPORT.md`, `docs/pm/MVP6_10_MULTI_TENANT_BRIEF.md` (minimal refine), `docs/backlog/MVP6_DRAFT_BACKLOG.md` (ID recording).
- My job runs FIRST and BLOCKS Backend/Frontend. ISOLATION is the headline invariant.

## 완료한 작업
Froze the three open Wave52 gates as single implementable rules, ratified the
error-envelope-guard ruling, and confirmed the scope is unchanged from the Wave51
freeze (ADR 0017 + the brief + `openapi-mvp6-10-draft.json`). No contract shape
change: the OpenAPI (4 GET paths / 13 schemas / 3 enums + `Role` verbatim /
all-false 8-flag `TenantMutationGuard`) is implemented EXACTLY as drafted.

### G1 — dev actor resolution (FROZEN)
> Every one of the 4 endpoints carries an OPTIONAL dev-only `actor_id` query param
> (`ActorIdQuery`), **default `"dev-user"`** (matches the MVP5/MVP6.5 governance
> dev-auth actor `Query("dev-user", ...)`). The acting actor = that value.
> Membership is resolved by exact `(actor_id, tenant_id)` lookup in the fixture
> membership table; NO `actor_role` param is required for P0 reads (any `ACTIVE`
> member, even `VIEWER`, may read). `actor_id` is NEVER a real auth/JWT claim and
> is not a production UI element. This lets QA deterministically be a member
> (`dev-user`), a different-tenant member (`dev-user-2`), or a member-of-nothing
> (any unknown id → empty visibility set / all-404) for the negative isolation gates.

### G3 — persist-vs-compute (FROZEN)
> Deterministic **process-local fixtures**, no DB persistence. Tenants /
> memberships / project-mapping / project summaries live as module-level constant
> fixture tables inside the new `tenancy` module and are read (never mutated).
> Expose `reset_runtime_store()` mirroring the MVP6.1–6.9 module contract
> (connectors/goldset/governance precedent) for test/seed-harness parity — it is
> effectively a no-op/re-seed because P0 mutates nothing. **NO `tenant_id`
> column, NO FK, NO migration, NO backfill, NO Alembic.** Durable DB is P1/P2.

### G5 — fixtures covering all 3 isolation outcomes (FROZEN)
> **6 tenants, 2 dev actors, 6 memberships, 7 fixture projects** (tenancy-owned
> `ProjectSummaryRef`, MVP1 shape by reference — self-contained, so isolation
> tests do NOT depend on MVP1 seed state). Default actor `dev-user` visibility set
> = exactly `{tenant-acme, tenant-globex}` (`total_count=2`). Full matrix below.

## Fixture isolation matrix (frozen — BE builds exactly this; FE/QA test against it)

Default actor = **`dev-user`**. Second actor = **`dev-user-2`** (proves disjoint
visibility sets / no-leak). Any other id = member of nothing.

| tenant_id | `TenantStatus` | `dev-user` membership | role | projects (count) | `GET /tenants/{id}` (dev-user) | denial_reason | in visibility set? |
|---|---|---|---|---|---|---|---|
| `tenant-acme` | ACTIVE | ACTIVE | PROJECT_ADMIN | `proj-acme-kg`, `proj-acme-catalog` (2) | **200** | — | YES |
| `tenant-globex` | ACTIVE | ACTIVE | VIEWER | `proj-globex-ops` (1) | **200** | — | YES |
| `tenant-initech` | ACTIVE | (none; `dev-user-2` ACTIVE) | — | `proj-initech-secret` (1) | **404 TENANT_NOT_FOUND** | `NOT_A_MEMBER` | NO |
| `tenant-umbrella` | ACTIVE | SUSPENDED | REVIEWER | `proj-umbrella-01` (1) | **403 TENANT_ACCESS_SUSPENDED** | `MEMBERSHIP_SUSPENDED` | NO |
| `tenant-soylent` | SUSPENDED | ACTIVE | DATA_MANAGER | `proj-soylent-01` (1) | **403 TENANT_ACCESS_SUSPENDED** | `TENANT_SUSPENDED` | NO |
| `tenant-hooli` | ARCHIVED | ACTIVE | VIEWER | `proj-hooli-01` (1) | **404 TENANT_NOT_FOUND** | `TENANT_ARCHIVED` | NO |

- `GET /tenants` as `dev-user` → **exactly** `{tenant-acme, tenant-globex}`, `total_count=2`. Never any other tenant's id/name/count/summary.
- `GET /tenants` as `dev-user-2` → `{tenant-initech}`, `total_count=1` (disjoint from `dev-user` — proves R3; and `tenant-initech` genuinely exists WITH a project yet `dev-user` gets 404 → no-leak).
- `GET /tenants` as unknown id → `[]`, `total_count=0`; every `GET /tenants/{id}` → 404 `TENANT_NOT_FOUND`.
- `GET /tenants/tenant-acme/projects` (dev-user) → exactly `[proj-acme-kg, proj-acme-catalog]`, `total_count=2`; **never** returns globex/initech/etc. projects (`cross_tenant_access_granted` stays false).

### `/projects/{project_id}/tenant` resolution (dev-user) — mirrors the owning tenant's access decision
| project_id | owning tenant | outcome | code / denial_reason |
|---|---|---|---|
| `proj-acme-kg` | tenant-acme (visible) | **200** → tenant-acme summary | — |
| `proj-globex-ops` | tenant-globex (visible) | **200** → tenant-globex summary | — |
| `proj-initech-secret` | tenant-initech (not-a-member) | **404 PROJECT_NOT_FOUND** | no leak |
| `proj-umbrella-01` | tenant-umbrella (membership suspended) | **403 TENANT_ACCESS_SUSPENDED** | `MEMBERSHIP_SUSPENDED` |
| `proj-soylent-01` | tenant-soylent (tenant suspended) | **403 TENANT_ACCESS_SUSPENDED** | `TENANT_SUSPENDED` |
| `proj-hooli-01` | tenant-hooli (archived) | **404 PROJECT_NOT_FOUND** | no leak |
| any unknown project id | — | **404 PROJECT_NOT_FOUND** | no leak |

Clarification (no contract shape change; the OpenAPI already models 200/403/404
on this path): `/projects/{id}/tenant` applies the **same** isolation decision to
the project's OWNING tenant as if the actor had requested that tenant directly —
visible→200, known-but-inactive (suspended membership/tenant)→403
`TENANT_ACCESS_SUSPENDED`, not-a-member/archived/unknown→404 `PROJECT_NOT_FOUND`.
The actor thereby learns nothing about a tenant it did not already know.

## ERROR-ENVELOPE-GUARD ruling (RATIFIED)
> Error responses carry **NO** `mutation_guard`. `ApiError = {code, message,
> details}`; `details.denial_reason ∈ TenantAccessDenialReason`. The all-false
> 8-flag `TenantMutationGuard` is a **200-only** proof (present on all 4
> `*Response` schemas). Denial states are driven by
> `ApiError.details.denial_reason`. Errors mutate nothing by definition, so no
> guard on 403/404 envelopes. QA does NOT assert a guard on error responses.

## Scope confirmation (UNCHANGED from ADR 0017 / Wave51 freeze)
- **Read-only**: exactly 4 GET endpoints; no POST/PUT/PATCH/DELETE anywhere; no tenant CRUD, no membership mutation, no provisioning, no cross-tenant access, no data re-homing.
- **Strict isolation (headline, default-deny, 404-not-leak)**: visibility set = ACTIVE membership on non-ARCHIVED tenant; not-a-member/archived/unknown → 404 `TENANT_NOT_FOUND` (existence never leaked); suspended membership/tenant → 403 `TENANT_ACCESS_SUSPENDED`; `/tenants/{A}/projects` never returns B; `/projects/{id}/tenant` out-of-visibility → 404 `PROJECT_NOT_FOUND`.
- **Additive over project scoping**: MVP1 `Project` + all MVP1–MVP6.9 per-project endpoints unchanged and tenant-unaware; NO `tenant_id` column/FK/migration/backfill/re-homing/rename; new surface is a read overlay. Reuse MVP5 `Role` (8 literals verbatim) + MVP1 `Project`/`ProjectSummary` by reference.
- **All-false 8-flag guard** on every 200; `cross_tenant_access_granted` + `project_rehomed` are the hardest QA assertions.

## Acceptance gates BE/FE/QA must hit (ISOLATION headline)
- **BE6-076..079**: 4 endpoints match `openapi-mvp6-10-draft.json` EXACTLY; G5 fixtures; strict isolation (404-not-leak / 403-suspended / no cross-tenant data); all-false 8-flag guard on every 200; error envelopes carry `denial_reason` + no guard; data-level no-mutation (all tables before==after); additive; OpenAPI alignment.
- **FE6-095..098**: header tenant-context indicator + client-side switcher (visibility set only; cross-tenant unreachable by construction); read-only tenant view; 404/403 states driven by `denial_reason`, clear stale tenant-A data before resolving tenant-B; `TenantStatus`/`TenantMembershipStatus` D6 badges; persistent "read-only; no provisioning; project scoping unchanged; client-side switch only" banner + live all-false 8-flag guard proof (200 only); NO create/edit/invite/provision affordance; existing global Projects list NOT re-scoped.
- **INT6-090..093**: independently verify the isolation headline at the DATA level (not-a-member → 404 no leak; suspended → 403; `/tenants/{B}/projects` + `/projects/{B}/tenant` never leak B's data; before==after across all tables); FE mock + actual incl. an isolation negative case; MVP6.9/earlier regression + touched smokes green; additive-only + candidate/published separation intact.

## 변경 파일
- `docs/handoffs/wave-052/PM_REPORT.md` (this file, new).
- `docs/pm/MVP6_10_MULTI_TENANT_BRIEF.md` (minimal: §5 project-resolve clarification note; §11 G1/G3/G5 marked FROZEN with the Wave52 decisions).
- `docs/backlog/MVP6_DRAFT_BACKLOG.md` (record `PM6-034` + implementation IDs `BE6-076`..`079`, `FE6-095`..`098`, `INT6-090`..`093`).

## 실행/검증
- 실행한 명령: `git diff --check`
- 결과: CHECK_OK (no whitespace errors; docs-only).
- 실행하지 못한 검증: none applicable (planning/freeze role; no `apps/` code written).

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세: G1/G3/G5 freeze introduces NO contract shape change. `actor_id` (`ActorIdQuery`), 3 enums, `Role` verbatim, 8-flag guard, `ApiError` {code,message,details} are all as in `openapi-mvp6-10-draft.json`. The `/projects/{id}/tenant` 403/404 clarification uses codes ALREADY modeled on that path (200/403/404).
- 영향받는 역할: BE (implement exactly), FE (mirror types/client/mocks), QA (assert matrix).

## Blocker
- 없음. BE/FE unblocked.

## 남은 TODO
- BE: implement `apps/backend/app/modules/tenancy/` (4 endpoints + G5 fixtures + `reset_runtime_store()`); no `tenant_id` column.
- FE: header switcher + read-only view + isolation-limited states + guard proof; `smoke:mvp6:tenancy:mock` (+ `:actual`).
- QA: R1–R9 verdicts in `INT6_10_MULTI_TENANT_ACCEPTANCE.md`; data-level isolation + no-mutation proof.

## 다른 역할에 전달할 내용
- Backend: build the fixture matrix above VERBATIM (ids, statuses, memberships, project mapping, counts). Default `actor_id="dev-user"`. `/projects/{id}/tenant` mirrors the owning tenant's access decision (200/403/404). Every 200 → all-false 8-flag guard; errors → `denial_reason`, no guard. No `tenant_id` column; process-local fixtures + `reset_runtime_store()`.
- Frontend: switcher shows ONLY `{tenant-acme, tenant-globex}` for the default actor; cross-tenant unreachable by construction. Drive 404/403 from `denial_reason`. Guard proof line renders on 200 only. `actor_id` is a dev-only QA lever, not a production control.
- QA: the three isolation outcomes are tenant-initech (404 NOT_A_MEMBER), tenant-umbrella (403 MEMBERSHIP_SUSPENDED), tenant-soylent (403 TENANT_SUSPENDED) + tenant-hooli (404 TENANT_ARCHIVED). Use `dev-user-2` to prove disjoint sets / no-leak of tenant-initech's real project.
- PM: none.

## 총괄에게 요청하는 결정
- None required. The Wave52 freeze stays inside the Wave51 contract; if you prefer `/projects/{id}/tenant` to collapse the suspended case to 404 (pure 404-not-leak, dropping 403 on that path) say so — I chose the mirror-the-tenant-decision rule because the OpenAPI already models 403 there and it keeps one consistent isolation function.

## 현재 판정
- `PASS` — G1/G3/G5 frozen, error-envelope-guard ratified, scope unchanged, IDs recorded. Backend ∥ Frontend may proceed.
