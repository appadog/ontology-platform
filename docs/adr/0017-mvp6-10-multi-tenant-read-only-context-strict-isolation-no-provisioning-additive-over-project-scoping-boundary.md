# ADR 0017: MVP6.10 Multi-tenant Runtime — Read-Only Tenant Context + Strict Isolation, No Provisioning/Mutation, Additive-Over-Project-Scoping, All-False Mutation Guard Boundary

## Status

Accepted

## Context

MVP6.9 (ADR 0016) kept the platform in its read-only, all-false posture: a
connector catalog + dry-run preview that connects to nothing and writes nothing.
MVP6.10 is the next user-directed theme — roadmap §9 Theme 6 **Multi-domain /
Multi-tenant 확장** — kept to its smallest coherent, SAFE form.

The roadmap theme is broad and dangerous if taken whole: an
Organization/Workspace/Tenant hierarchy, `organization_id`/`workspace_id` on
every major table, per-tenant object-storage/search/vector partitioning,
cross-domain ontology alignment, per-org RBAC/quota/billing, and org/workspace
switchers. Taken literally, that means a schema-wide `tenant_id` backfill
(re-homing all MVP1–MVP6.9 data), a new authorization dimension threaded through
every endpoint, and — worst for this platform — a plausible path for one
tenant's data to leak into another tenant's read surface. None of that is
acceptable in a first thin slice.

The product need at P0 is modest and safe: let an actor **see which tenants they
belong to**, **read a tenant summary**, and **list that tenant's projects** —
deterministically, from fixture data, with **strict isolation** (a caller in
tenant A can never see tenant B's tenant/projects/data) and with **no tenant
provisioning, no membership mutation, and no re-homing of existing data**. This
reuses two shipped, trusted precedents: MVP5's `Role` + dev-auth actor +
audit-style authorization (ADR 0008, `apps/backend/app/core/enums.py`), and the
MVP1 per-project scoping model that the tenant layer now wraps additively. It
also follows the recent read-only + all-false-guard + isolation-assertion themes
(MVP6.7 impact ADR 0014, MVP6.9 connectors ADR 0016). This ADR fixes the boundary
so the tenant surface cannot be mistaken for a provisioning console, a
membership-management surface, a data-migration, or a second (leaky) way to read
across tenants.

Surfaces reused **by reference, no renames**:
- MVP5 `Role` (membership carries a `Role` within a tenant; no new role literal),
  the dev-auth actor identity pattern, and audit-shape conventions.
- MVP1 project scoping (`Project` + `ProjectStatus`) and existing per-project
  endpoints — the tenant layer wraps these **additively**; nothing is re-homed.

## Decision

- **MVP6.10 P0 is a project-actor-scoped, READ-ONLY tenant CONTEXT with STRICT
  ISOLATION.** Four read-only surfaces only: (1) list the tenants the current
  actor is an ACTIVE member of ("my tenants"); (2) get a single tenant's summary;
  (3) list a tenant's projects (tenant-scoped); (4) resolve the tenant a given
  project lives in. Nothing is created, updated, deleted, or re-homed.

- **STRICT ISOLATION — the headline invariant.** The caller's **visibility set**
  is exactly the tenants where the caller has an `ACTIVE` `TenantMembership` on a
  non-`ARCHIVED` tenant. Every tenant-scoped response is filtered to the
  visibility set:
  - `GET /tenants` returns **exactly** the visibility set — never any other
    tenant, never a count/name/summary of a tenant the caller cannot see.
  - A `tenant_id` **not in** the caller's visibility set (unknown, ARCHIVED, or
    simply not-a-member) → `404 TENANT_NOT_FOUND`. **404, not 403** — the
    existence of a tenant the caller has no relationship to is never leaked.
  - A `tenant_id` the caller **has a relationship to but it is inactive**
    (membership `SUSPENDED`, or tenant `SUSPENDED`) → `403 TENANT_ACCESS_SUSPENDED`.
    403 is safe here because the caller already knows the tenant exists.
  - `.../tenants/{A}/projects` returns **only** projects whose owning tenant is
    `A`; a project belonging to tenant `B` is **never** returned under `A`, even
    for a caller who is a member of `A`.
  - `/projects/{project_id}/tenant`: if the project's tenant is not in the
    caller's visibility set → `404 PROJECT_NOT_FOUND` (project existence not
    leaked across the tenant boundary).
  The rule in one line: **default-deny, 404-not-leak** — a caller sees only
  tenants they are an ACTIVE member of; everything else is 404 (existence
  hidden), a known-but-inactive relationship is 403, and no response ever
  contains another tenant's data.

- **NO PROVISIONING / NO MUTATION.** P0 has **no** tenant create/update/delete,
  **no** membership create/remove/role-change/invite, and **no** switching that
  writes server state (a "tenant switcher" is a client-side selection over the
  read-only my-tenants list). Tenants and memberships are **deterministic mock
  fixtures**. There is no admin surface to provision a tenant.

- **ADDITIVE OVER PROJECT SCOPING — no data re-homing.** Existing MVP1 `Project`
  model and **every** existing per-project endpoint (MVP1–MVP6.9) keep working
  exactly as before and remain tenant-unaware. P0 adds **no** `tenant_id` column,
  runs **no** migration/backfill, and re-homes/renames **no** existing data. The
  tenant→project mapping is a deterministic fixture inside the tenant module
  (mirrors the proven process-local store pattern). The new surface only *exposes*
  the tenant a project logically lives in plus a tenant-scoped project/summary
  list; it is a read overlay, not a schema change.

- **Tenant / membership model (frozen, minimal).**
  - A single-level **Tenant** (organization/workspace collapsed to one level in
    P0). A few deterministic mock tenants (Backend fixes the exact set; the
    fixture MUST include: tenants the dev actor is an ACTIVE member of, at least
    one tenant the actor is NOT a member of — the isolation target — and one
    inactive relationship, so all three isolation outcomes are provable).
  - `TenantMembership` = `(actor_id, tenant_id, role, status)`. `role` reuses
    MVP5 `Role` **verbatim** (no new literal); `status` is `TenantMembershipStatus`.
  - A `Project` belongs to exactly one tenant via the fixture mapping (logical,
    not a DB FK in P0).

- **Enums / states (frozen).**
  - `TenantStatus`: `ACTIVE`, `SUSPENDED`, `ARCHIVED`.
  - `TenantMembershipStatus`: `ACTIVE`, `SUSPENDED`.
  - Membership `role`: reuse MVP5 `Role` verbatim (no new enum).
  - `TenantAccessDenialReason` (isolation error taxonomy, response-side):
    `NOT_A_MEMBER` → `404 TENANT_NOT_FOUND`; `MEMBERSHIP_SUSPENDED` /
    `TENANT_SUSPENDED` → `403 TENANT_ACCESS_SUSPENDED`; `TENANT_ARCHIVED` →
    `404 TENANT_NOT_FOUND`.

- **Authorization (frozen).** Read access to a tenant is gated by an `ACTIVE`
  `TenantMembership` on a non-inactive tenant — that is the isolation gate. Any
  ACTIVE member (even `Role = VIEWER`) may read the tenant summary and its
  project list in P0; `Role` is carried on the membership and surfaced in the
  DTO for future write/admin surfaces, but P0 reads do not require an elevated
  role. Reuse MVP5 `Role`; no new role literal. Actor identity reuses the MVP5
  dev-auth actor pattern; how a different actor is simulated for negative/
  cross-tenant tests (e.g. `actor_id` query param, mirroring MVP6.5) is a Backend
  detail deferred to Wave52. Errors: `404 TENANT_NOT_FOUND` /
  `403 TENANT_ACCESS_SUSPENDED` / `404 PROJECT_NOT_FOUND` as above;
  `403 PERMISSION_DENIED` is reserved for future role-gated writes and is not
  produced by P0 reads.

- **ALL-FALSE mutation guard (frozen flags).** Every tenant response
  (my-tenants list, tenant summary, tenant projects, project→tenant) carries an
  all-false `TenantMutationGuard`; every flag false, no exceptions:
  - `tenant_created: false`
  - `tenant_updated: false`
  - `tenant_deleted: false`
  - `membership_mutated: false`
  - `project_rehomed: false`
  - `cross_tenant_access_granted: false`
  - `candidate_graph_mutated: false`
  - `published_graph_mutated: false`

  This mirrors the MVP6.1–6.5 / 6.7 / 6.9 all-false pattern (distinct from the
  single-flag MVP6.6 apply guard). MVP6.10 turns **no** flag true, ever.
  `cross_tenant_access_granted: false` and `project_rehomed: false` are the
  isolation-specific assertions QA leans on.

- **Persist-vs-compute (deferred to Backend/Wave52).** Whether tenant/membership/
  mapping fixtures live in a process-local store keyed by id (with
  `reset_runtime_store()`, the MVP6.1–6.9 pattern) or are computed on demand is a
  Backend decision; either way it is read-only and carries the all-false guard.
  Durable DB/Alembic persistence and any real `tenant_id` column are **not**
  required for the P0 thin slice and are P1/P2.

- **Out of scope (P1 or later unless explicitly promoted):** tenant
  create/update/delete; membership mutation (invite/add/remove/role-change);
  cross-tenant access of any kind; tenant-level billing / quota / usage
  enforcement (`UsageQuota`, `BillingUsageEvent`); data re-homing / migration /
  `tenant_id` backfill of existing MVP1–MVP6.9 tables; real auth / SSO / OIDC
  multi-tenancy and JWT tenant claims; per-tenant object-storage / search /
  vector-index partitioning; the two-level Organization↔Workspace hierarchy
  (`Organization`, `Workspace`, `TenantSetting` as distinct objects); cross-domain
  ontology alignment / mapping (`Domain`, `OntologyAlignment`,
  `CrossDomainMapping`); domain/usage dashboards; server-side tenant switching /
  session-scoped tenant context; any candidate or published-graph mutation.

## Consequences

- Backend can draft additive, read-only endpoint(s) — list my tenants, get a
  tenant summary, list a tenant's projects, resolve a project's tenant — reusing
  MVP5 `Role` + dev-auth actor and MVP1 project shapes **by reference (no
  renames)**, importing **no** tenant-provisioning / membership-mutation /
  data-migration path. It models `TenantStatus`, `TenantMembershipStatus`,
  `TenantAccessDenialReason`, the all-false `TenantMutationGuard`, the
  visibility-set filter, and the `404 TENANT_NOT_FOUND` /
  `403 TENANT_ACCESS_SUSPENDED` / `404 PROJECT_NOT_FOUND` isolation codes.
- Frontend can add a read-only tenant context surface (ADR 0010: a top-level
  tenant-context indicator / client-side switcher over the my-tenants list, plus
  a read-only tenant/workspace view; no new ID-bound global LNB page for the
  tenant detail), a tenant-scoped project list, honest isolation-limited states
  (cross-tenant denied — clear message, no data leak), a persistent "read-only
  context; no provisioning; existing project scoping unchanged" boundary line, a
  live all-false-guard proof line, and first-class loading/empty/error/permission
  states in the closed design language.
- QA can build deterministic local acceptance with **isolation as the headline
  gate**: `GET /tenants` returns only the actor's tenants; a not-a-member tenant
  returns `404` and leaks no name/count/summary; a suspended relationship returns
  `403`; `.../tenants/{A}/projects` never returns tenant `B`'s projects;
  `/projects/{id}/tenant` for an out-of-visibility project returns `404`; the
  `TenantMutationGuard` is all-false on every response; and at the data level no
  tenant call creates/updates/deletes any tenant/membership/project row or
  re-homes existing data (before == after). MVP1–MVP6.9 regression + smokes stay
  green.
- The platform preserves strict tenant isolation (default-deny, 404-not-leak),
  candidate/published separation, evidence/version/audit traceability, and the
  all-false mutation-guard posture. The change is additive and does not alter
  MVP1–MVP6.9 paths, enums, project scoping, or smokes; no existing data is
  re-homed or renamed. MVP6.10 turns **no** mutation flag true.
