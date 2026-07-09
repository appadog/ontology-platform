# MVP6.10 Multi-tenant API Contract Draft (planning-only, additive)

Status: Wave51 contract-first planning (`BE6-074`/`BE6-075`). Authoritative machine
artifact: `docs/api/openapi-mvp6-10-draft.json` (OpenAPI 3.1.0, `0.6.10-draft`,
**4 paths / 13 schemas**, PARSE_OK, disjoint-additive to MVP1-MVP6.9). This
markdown is the human-readable companion; the OpenAPI is the source of truth.
No runtime/model/migration/test/seed code (Wave52 waits). Frozen by
`docs/pm/MVP6_10_MULTI_TENANT_BRIEF.md` + ADR 0017.

## Boundary (ADR 0017)
MVP6.10 P0 is a **read-only tenant context + strict isolation**. Nothing is
provisioned, mutated, or re-homed: no tenant create/update/delete, no membership
mutation, no cross-tenant read, no `tenant_id` column / FK / migration / backfill.
The tenant->project mapping is a deterministic fixture inside the tenant module;
existing MVP1 `Project` + all MVP1-MVP6.9 per-project endpoints stay unchanged and
tenant-unaware (this is a read overlay, not a schema change). Every response
carries an all-false 8-flag `TenantMutationGuard`. **Strict isolation is the
headline invariant: default-deny, 404-not-leak.**

## Endpoints (4; all read-only, all additive)
- `GET /api/v1/tenants` — list MY tenants (the actor's visibility set only). -> `TenantListResponse`
- `GET /api/v1/tenants/{tenant_id}` — single tenant summary (member-only). -> `TenantSummaryResponse`
- `GET /api/v1/tenants/{tenant_id}/projects` — that tenant's projects, tenant-scoped. -> `TenantProjectListResponse`
- `GET /api/v1/projects/{project_id}/tenant` — resolve a project's tenant (member-only; trimmable, G4). -> `ProjectTenantResponse`

No POST/PUT/PATCH/DELETE anywhere in this theme's P0. Optional dev-only
`actor_id` query param on every endpoint (G1) lets QA be "the actor who is / is
not a member"; absent -> the MVP5 dev-auth actor. Never a real auth/JWT claim.

## Enums (frozen; in the OpenAPI, used verbatim)
- `TenantStatus`: `ACTIVE` / `SUSPENDED` / `ARCHIVED`.
- `TenantMembershipStatus`: `ACTIVE` / `SUSPENDED`.
- `TenantAccessDenialReason`: `NOT_A_MEMBER` / `TENANT_ARCHIVED` / `MEMBERSHIP_SUSPENDED` / `TENANT_SUSPENDED`.
- `Role`: MVP5 RBAC role reused **verbatim** (8 literals, defined locally to keep
  the draft self-contained; no new literal, no rename).

## Isolation rule + error codes (frozen, headline)
- **Visibility set** = tenants where the actor has an `ACTIVE` `TenantMembership`
  on a **non-`ARCHIVED`** tenant.
- `GET /tenants` returns **exactly** the visibility set — never another tenant's
  id/name/count/summary.
- `tenant_id` **not in** the visibility set (unknown / `ARCHIVED` / not-a-member)
  -> **`404 TENANT_NOT_FOUND`**. 404 not 403 — existence is **never** leaked.
- `tenant_id` with a **known-but-inactive** relationship (membership `SUSPENDED`
  or tenant `SUSPENDED`) -> **`403 TENANT_ACCESS_SUSPENDED`** (safe: the caller
  already knows the tenant exists).
- `.../tenants/{A}/projects` returns **only** projects owned by `A`; tenant `B`'s
  project is **never** returned under `A`, even for an `A` member
  (`cross_tenant_access_granted` stays false).
- `/projects/{id}/tenant` for an out-of-visibility (or unknown) project ->
  **`404 PROJECT_NOT_FOUND`** (cross-tenant project existence not leaked).
- `403 PERMISSION_DENIED` is **reserved** for future role-gated writes and is
  **not** produced by P0 reads.
- Denial mapping (`TenantAccessDenialReason` -> HTTP, surfaced in
  `ApiError.details.denial_reason`): `NOT_A_MEMBER` -> 404; `TENANT_ARCHIVED` ->
  404; `MEMBERSHIP_SUSPENDED` -> 403; `TENANT_SUSPENDED` -> 403.

## Key DTOs
- `TenantMutationGuard` — **8 flags**, all `const:false`, all `required`, on
  **every** response: `tenant_created`, `tenant_updated`, `tenant_deleted`,
  `membership_mutated`, `project_rehomed`, `cross_tenant_access_granted`,
  `candidate_graph_mutated`, `published_graph_mutated`.
  `cross_tenant_access_granted` + `project_rehomed` are the isolation-specific
  assertions QA leans on hardest.
- `TenantMembership` — `actor_id`, `tenant_id`, `role` (MVP5 `Role`), `status`
  (`TenantMembershipStatus`). Read-only fixture; never mutated.
- `TenantSummary` (shared item shape for list / summary / project->tenant) —
  `id`, `display_name`, `description`, `status` (`TenantStatus`), `my_membership`
  (the caller's own `TenantMembership`, surfacing `Role`), `project_count`
  (tenant-scoped exact count), `created_at`. Never carries another actor's
  membership or another tenant's data.
- `ProjectSummaryRef` — MVP1 `ProjectSummary` reused **by reference** (`id`,
  `name`, `description`, `status`, `created_at`, `updated_at`, `source_count`,
  `ontology_version_count`; no `tenant_id` field added).
- `TenantListResponse` — `actor_id`, `items[TenantSummary]`, exact `total_count`,
  `mutation_guard`.
- `TenantSummaryResponse` — `actor_id`, `tenant`, `mutation_guard`.
- `TenantProjectListResponse` — `actor_id`, `tenant_id`, `items[ProjectSummaryRef]`,
  exact `total_count`, `mutation_guard`.
- `ProjectTenantResponse` — `actor_id`, `project_id`, `tenant`, `mutation_guard`.
- `ApiError` — `{code, message, details}`; `code` in
  {`TENANT_NOT_FOUND`, `TENANT_ACCESS_SUSPENDED`, `PROJECT_NOT_FOUND`};
  `details.denial_reason` is a `TenantAccessDenialReason`.

## Rules
- **Read-only only.** No mutating verb exists in the P0 surface.
- **Default-deny, 404-not-leak.** See isolation section; existence of an
  unrelated/archived tenant or an out-of-visibility project is never leaked.
- **Deterministic.** All tenants/memberships/mappings are fixtures; responses are
  byte-stable for a given actor + fixture state (modulo any response-time
  timestamp, if adopted).
- **All-false guard on every response.** MVP6.10 turns no flag true, ever.
- **Additive-over-project-scoping.** No `tenant_id` column/FK/migration/backfill;
  MVP1 `Project` + MVP1-MVP6.9 per-project endpoints unchanged and tenant-unaware.
- **Authz.** Any `ACTIVE` member (even `Role=VIEWER`) may read summary + project
  list; `Role` surfaced for future write/admin but not required for P0 reads.

## Reuse (by reference, no renames)
- MVP5 `Role` (membership role; 8 literals verbatim) + dev-auth actor identity
  pattern + audit-shape conventions. No new role literal.
- MVP1 `Project` / `ProjectStatus` / `ProjectSummary` for the tenant-scoped
  project list and project->tenant resolution. No re-homing, no rename.
- (`Role` and `ProjectSummaryRef` are declared locally in the OpenAPI only to keep
  the draft self-contained; the shapes/names match the MVP5/MVP1 definitions.)

## Open questions -> Wave52 gates
1. **G1 — dev actor resolution.** OPTIONAL `actor_id` query param modeled on every
   endpoint so QA can be a member / non-member / suspended actor deterministically
   (mirrors MVP6.5 governance). Exact mechanism finalized in Wave52; never a real
   auth/JWT claim.
2. **G2 — 404-vs-403 split.** FROZEN here: not-a-member / ARCHIVED -> `404`;
   suspended relationship (membership or tenant) -> `403`. Singular behavior for QA.
3. **G3 — persist-vs-compute.** Process-local store + `reset_runtime_store()`
   (MVP6.1-6.9 pattern) vs compute-on-read for the tenant/membership/mapping
   fixtures — Backend/Wave52 decision. Either way read-only + all-false guard; no
   contract shape change.
4. **G4 — endpoint #4 in/out.** `/projects/{id}/tenant` is the trimmable surface;
   default **keep** (adds demo value: resolve a project's tenant while enforcing
   the same isolation). Trim only if it complicates isolation without payoff.
5. **G5 — fixture shape.** The mock set MUST prove all three isolation outcomes:
   >=1 tenant the actor is an ACTIVE member of (with projects), >=1 tenant the
   actor is NOT a member of (isolation target -> 404, its projects never appear),
   and >=1 inactive relationship (membership or tenant SUSPENDED -> 403). Backend
   fixes exact ids/counts in Wave52; contract already types everything for it.
6. **Response timestamp.** `created_at` on tenants is fixture-stable; no
   response-time `generated_at` is modeled in P0. If one is added later it must be
   excluded from any byte-stable determinism assertion.
