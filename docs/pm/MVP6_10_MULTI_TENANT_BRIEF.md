# MVP6.10 Multi-tenant Runtime — P0 Freeze Brief

Status: `CONTRACT-FIRST PLANNING FROZEN (Wave51, PM6-033, ADR 0017)`
Date: 2026-07-09
Owner: PM / Architect
Roadmap: `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md` §9 Theme 6

This brief freezes the smallest coherent, SAFE multi-tenant P0. It is thin by
design. The durable boundary is ADR 0017; enforcement is the responsibility of
Backend (contract), Frontend (UX), and QA (acceptance) in Wave51 planning and
Wave52 implementation.

## 1. Headline: strict isolation

A caller scoped to tenant A can **never** read tenant B's tenant record,
projects, or data. This is the load-bearing invariant, above every other goal in
this theme. Everything else in P0 exists only to make this provable.

Rule in one line: **default-deny, 404-not-leak.**

## 2. Frozen P0 demo flow

```text
authenticate as the dev actor
-> open Tenant Context (top-level indicator / switcher over "my tenants")
-> see ONLY the tenants I am an ACTIVE member of
-> open a tenant summary (mine)
-> list that tenant's projects (tenant-scoped)
-> from a project, resolve which tenant it lives in
-> attempt a tenant I do NOT belong to  -> 404 (no name/count/data leaked)
-> attempt a tenant with a suspended relationship -> 403
```

Nothing in this flow provisions, mutates, or re-homes anything.

## 3. Tenant / membership model (frozen, minimal)

- **Tenant** (single level; organization/workspace collapsed for P0). A few
  deterministic mock tenants. The fixture MUST cover all three isolation
  outcomes (Backend fixes exact ids/counts):
  - tenant(s) the dev actor is an `ACTIVE` member of (visible) — with projects;
  - at least one tenant the actor is **not** a member of (the isolation target;
    requesting it → `404`, its projects must never appear);
  - one **inactive relationship** (membership `SUSPENDED` or tenant `SUSPENDED`)
    → `403`.
- **TenantMembership** = `(actor_id, tenant_id, role, status)`.
  - `role` reuses MVP5 `Role` **verbatim** (no new literal).
  - `status` = `TenantMembershipStatus`.
- **Project → Tenant**: each project belongs to exactly one tenant via a
  deterministic fixture mapping (logical only; **no DB FK, no `tenant_id`
  column** in P0).

## 4. Read-only endpoints (Backend finalizes exact paths/DTOs)

Suggested families:

1. `GET /api/v1/tenants` — list MY tenants (the actor's visibility set only).
2. `GET /api/v1/tenants/{tenant_id}` — tenant summary (member-only).
3. `GET /api/v1/tenants/{tenant_id}/projects` — that tenant's projects, tenant-scoped.
4. `GET /api/v1/projects/{project_id}/tenant` — resolve a project's tenant
   (member-only; the trimmable one — see §11 open gates).

No mutation. No POST/PUT/PATCH/DELETE anywhere in this theme's P0.

## 5. Isolation rule + error codes (frozen)

- **Visibility set** = tenants where the actor has an `ACTIVE`
  `TenantMembership` on a non-`ARCHIVED` tenant.
- `GET /tenants` returns **exactly** the visibility set — never another tenant's
  id/name/count/summary.
- `tenant_id` **not in** visibility set (unknown / ARCHIVED / not-a-member) →
  `404 TENANT_NOT_FOUND` (existence not leaked → 404, never 403).
- `tenant_id` with an **inactive** relationship (membership `SUSPENDED` or tenant
  `SUSPENDED`) → `403 TENANT_ACCESS_SUSPENDED`.
- `.../tenants/{A}/projects` returns **only** projects owned by `A`; tenant `B`'s
  project is never returned under `A`.
- `/projects/{project_id}/tenant` applies the **same** isolation decision to the
  project's OWNING tenant as a direct tenant request would (Wave52 PM6-034
  clarification; OpenAPI already models 200/403/404 on this path): owning tenant
  visible → `200`; owning tenant known-but-inactive (membership/tenant
  `SUSPENDED`) → `403 TENANT_ACCESS_SUSPENDED`; owning tenant
  not-a-member/`ARCHIVED`/unknown project → `404 PROJECT_NOT_FOUND` (existence
  never leaked). The actor learns nothing about a tenant it did not already know.
- `403 PERMISSION_DENIED` is **reserved** for future role-gated writes; P0 reads
  do not produce it.

`TenantAccessDenialReason` (response-side taxonomy): `NOT_A_MEMBER` →
`404 TENANT_NOT_FOUND`; `TENANT_ARCHIVED` → `404 TENANT_NOT_FOUND`;
`MEMBERSHIP_SUSPENDED` / `TENANT_SUSPENDED` → `403 TENANT_ACCESS_SUSPENDED`.

## 6. Enums / states (frozen)

- `TenantStatus`: `ACTIVE`, `SUSPENDED`, `ARCHIVED`.
- `TenantMembershipStatus`: `ACTIVE`, `SUSPENDED`.
- Membership `role`: MVP5 `Role` verbatim (no new enum).
- `TenantAccessDenialReason`: `NOT_A_MEMBER`, `TENANT_ARCHIVED`,
  `MEMBERSHIP_SUSPENDED`, `TENANT_SUSPENDED`.

## 7. Authorization (frozen)

- Read is gated by an `ACTIVE` membership on a non-inactive tenant (= the
  isolation gate).
- Any ACTIVE member (even `Role = VIEWER`) may read the tenant summary and
  project list in P0. `Role` is carried on the membership + surfaced in the DTO
  for future write/admin surfaces, but is not required for P0 reads.
- Actor identity reuses the MVP5 dev-auth actor pattern; the exact mechanism to
  simulate a different actor for negative/cross-tenant tests is a Backend detail
  (see §11 G1).

## 8. All-false mutation guard (frozen)

Every response carries an all-false `TenantMutationGuard`:

- `tenant_created: false`
- `tenant_updated: false`
- `tenant_deleted: false`
- `membership_mutated: false`
- `project_rehomed: false`
- `cross_tenant_access_granted: false`
- `candidate_graph_mutated: false`
- `published_graph_mutated: false`

`cross_tenant_access_granted` and `project_rehomed` are the isolation-specific
flags QA asserts hardest.

## 9. Additive-over-project-scoping (frozen)

- Existing MVP1 `Project` model and **all** MVP1–MVP6.9 per-project endpoints are
  **unchanged** and remain tenant-unaware.
- P0 adds **no** `tenant_id` column, runs **no** migration/backfill, re-homes and
  renames **no** existing data.
- The tenant→project mapping is a deterministic fixture in the tenant module.
- Reuse existing shapes by reference (MVP5 `Role`, MVP1 `Project`/`ProjectStatus`)
  — no renames.

## 10. Explicit exclusions (P1+ unless PM re-freezes)

- Tenant create / update / delete.
- Membership mutation: invite / add / remove / role-change.
- Cross-tenant access of any kind.
- Tenant-level billing / quota / usage enforcement (`UsageQuota`,
  `BillingUsageEvent`).
- Data re-homing / migration / `tenant_id` backfill of existing tables.
- Real auth / SSO / OIDC multi-tenancy; JWT tenant claims.
- Per-tenant object-storage / search / vector-index partitioning.
- Two-level Organization↔Workspace hierarchy (`Organization`, `Workspace`,
  `TenantSetting` as distinct objects).
- Cross-domain ontology alignment / mapping (`Domain`, `OntologyAlignment`,
  `CrossDomainMapping`).
- Domain dashboards, usage dashboards.
- Server-side / session-scoped tenant switching (switcher is client-side only).
- Any candidate or published-graph mutation.

## 11. Open gates for Wave52 (FROZEN — PM6-034, Wave52)

- **G1 — actor resolution in dev. FROZEN.** Optional dev-only `actor_id` query
  param (`ActorIdQuery`) on all 4 endpoints, **default `"dev-user"`** (matches the
  MVP5/MVP6.5 governance dev-auth actor). Membership is resolved by exact
  `(actor_id, tenant_id)` fixture lookup; NO `actor_role` param for P0 reads (any
  `ACTIVE` member reads). Never a real auth/JWT claim.
- **G2 — 404-vs-403 split.** Frozen: not-a-member/archived → `404`, suspended
  relationship → `403`. Singular behavior for QA.
- **G3 — persist-vs-compute. FROZEN.** Deterministic **process-local fixtures**
  (module-level constant tenant/membership/project tables) + `reset_runtime_store()`
  for harness parity (MVP6.1–6.9 pattern; effectively no-op/re-seed since P0
  mutates nothing). NO DB persistence, NO `tenant_id` column/FK/migration/backfill.
- **G4 — endpoint #4 in/out.** `/projects/{project_id}/tenant` KEPT (default);
  denial mirrors the owning tenant's access decision (see §5).
- **G5 — fixture set. FROZEN.** 6 tenants, 2 dev actors, 6 memberships, 7
  fixture projects covering all 3 isolation outcomes. Default `dev-user`
  visibility set = `{tenant-acme, tenant-globex}` (count 2); not-a-member
  `tenant-initech` → 404; suspended-membership `tenant-umbrella` + suspended-tenant
  `tenant-soylent` → 403; archived `tenant-hooli` → 404. Exact matrix (ids /
  statuses / memberships / project mapping / counts) in
  `docs/handoffs/wave-052/PM_REPORT.md`.
- **Tenant switcher is client-side only** (no server session/state write);
  placement per ADR 0010 (top-level context indicator, tenant detail contextual —
  not a new ID-bound global LNB page).

## 12. Durable invariants preserved

- **Strict isolation** (default-deny, 404-not-leak) — the new headline invariant,
  recorded in ADR 0017.
- Candidate / published separation intact (P0 reads neither and mutates neither).
- Evidence / version / model-run / audit traceability unchanged.
- MVP5 RBAC (`Role`) reused verbatim, now additionally tenant-scoped.
- Additive-only: no MVP1–MVP6.9 endpoint/enum/DTO/data change; no re-homing.
- All-false mutation guard on every response (no flag true, ever).

## 13. Backlog IDs

`PM6-033` (this freeze) → `BE6-074`/`BE6-075` (contract + OpenAPI) →
`FE6-094` (UX/API requirements) → `INT6-080` (acceptance checklist). See
`docs/backlog/MVP6_DRAFT_BACKLOG.md`.
