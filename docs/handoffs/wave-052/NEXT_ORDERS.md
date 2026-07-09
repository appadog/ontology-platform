# Next Orders - Wave 52

Status: `MVP6.10 MULTI-TENANT THIN IMPLEMENTATION`
Date: 2026-07-08

Wave51 closed MVP6.10 Multi-tenant contract-first planning as PASS. Wave52
implements the smallest deterministic READ-ONLY tenant-context + strict-isolation
slice. ISOLATION is the headline invariant.

```text
tenant context (app-shell switcher, my ACTIVE tenants only)
-> GET /tenants (visibility set) / GET /tenants/{id} (summary) / GET /tenants/{id}/projects / GET /projects/{id}/tenant
-> strict isolation: cross-tenant -> 404 TENANT_NOT_FOUND (no leak) / 403 TENANT_ACCESS_SUSPENDED; never returns another tenant's data
-> (read-only; no tenant CRUD / membership mutation / cross-tenant access; all-false 8-flag guard)
```

Sequence: PM (freeze G1/G3/G5 FIRST) -> Backend ∥ Frontend -> QA.

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read Wave51 artifacts: `docs/handoffs/wave-051/{PM,BACKEND,FRONTEND,QA}_REPORT.md`,
  `docs/pm/MVP6_10_MULTI_TENANT_BRIEF.md`, `docs/adr/0017-...md`,
  `docs/api/MVP6_10_MULTI_TENANT_API_CONTRACT_DRAFT.md`, `docs/api/openapi-mvp6-10-draft.json`,
  `docs/pm/MVP6_10_FRONTEND_UX_REQUIREMENTS.md`,
  `docs/backlog/INT6_10_MULTI_TENANT_ACCEPTANCE.md` (C1-C10, R1-R9, gates G1/G3/G5).
- Follow the MVP6.9 connectors / MVP6.8 copilot module precedents (process-local
  store + reset hook + fixtures). Reuse MVP1 project + MVP5 `Role` by reference; NO
  renames. Additive over existing project scoping (no tenant_id column/FK/migration/
  re-homing; existing per-project endpoints unchanged).
- Apply the closed design language. Use `docs/handoffs/REPORT_TEMPLATE.md`; finish
  with role reports in `docs/handoffs/wave-052/{ROLE}_REPORT.md`.

## Scope Guard (ADR 0017 — read-only + strict isolation)
- READ-ONLY only (4 GET endpoints). No tenant CRUD, no membership mutation, no
  cross-tenant access, no provisioning, no data re-homing. Every 200 response
  carries an all-false 8-flag `TenantMutationGuard`.
- ISOLATION (headline): visibility set = tenants with an ACTIVE membership on a
  non-ARCHIVED tenant. Cross-tenant / unknown / archived / not-a-member ->
  `404 TENANT_NOT_FOUND` (existence NEVER leaked, 404 not 403); inactive
  (membership/tenant SUSPENDED) -> `403 TENANT_ACCESS_SUSPENDED`;
  `/tenants/{A}/projects` never returns another tenant's projects;
  `/projects/{id}/tenant` out-of-visibility -> `404 PROJECT_NOT_FOUND`. Default-deny.
- Error responses carry no `mutation_guard` (errors mutate nothing; guard proof is
  a 200-only concept; denial states driven by `ApiError.details.denial_reason`).
- Additive; no break of MVP1-MVP6.9 surfaces/smokes.

## PM Agent Order
Role: PM / MVP6.10 Implementation Scope Guard + Gate Freeze
Write report: `docs/handoffs/wave-052/PM_REPORT.md`
Backlog ID: `PM6-034`
Tasks: freeze G1 (dev-only `actor_id` query param actor resolution for negative
tests — how the actor/tenant membership is determined in this dev slice), G3
(`preview`... n/a; here = persist-vs-compute for the tenant/membership store —
recommend deterministic process-local fixtures), G5 (fixture tenant ids/counts +
memberships covering ALL 3 isolation outcomes: a member tenant, a not-a-member
tenant -> 404, a suspended relationship -> 403; plus project<->tenant fixture
mapping). Ratify the error-envelope-guard ruling (no guard on errors). State each
as one precise rule. Confirm scope unchanged (read-only, strict isolation, no
mutation). Update `docs/backlog/MVP6_DRAFT_BACKLOG.md` if IDs (BE6-076+, FE6-095+,
INT6-090+) need recording. Validation: `git diff --check`; no apps/.

## Backend Agent Order
Role: Backend / MVP6.10 Runtime Thin Slice
Start condition: read `docs/handoffs/wave-052/PM_REPORT.md` (frozen G1/G3/G5).
Write report: `docs/handoffs/wave-052/BACKEND_REPORT.md`
Backlog IDs: `BE6-076` tenant list/summary/projects endpoints + fixtures, `BE6-077`
project->tenant resolve + isolation enforcement (404-not-leak/403-suspended),
`BE6-078` all-false 8-flag guard + no-mutation guarantees, `BE6-079` OpenAPI
export/alignment + isolation regression guard.
Tasks: implement the 4 read-only endpoints in a new module (e.g.
`apps/backend/app/modules/tenancy/`, registered additively) matching
`openapi-mvp6-10-draft.json` EXACTLY; deterministic process-local fixtures per G5
(tenants + memberships + project mapping). Enforce strict isolation exactly
(visibility set; 404-not-leak; 403-suspended; no cross-tenant data). Every 200
carries the all-false 8-flag `TenantMutationGuard`. NO tenant_id column/FK/
migration; reuse MVP1 project + MVP5 `Role` by reference (no renames). Focused
tests (`tests/test_mvp6_10_tenancy_api.py`): the 4 endpoints; ISOLATION matrix
(member sees only own tenant/projects; not-a-member -> 404 TENANT_NOT_FOUND with
NO name/count/data leak; suspended -> 403 TENANT_ACCESS_SUSPENDED; cross-tenant
`/tenants/{B}/projects` and `/projects/{B-proj}/tenant` -> 404); all-false 8-flag
guard on every 200; error envelopes carry denial_reason + no guard; DATA-LEVEL
no-mutation (all tables before==after); additive (existing project endpoints
unchanged); OpenAPI alignment.
Validation: `cd apps/backend && .venv/bin/pytest tests/test_mvp6_10_tenancy_api.py -q`
and `tests/test_mvp6_9_connectors_api.py -q`; `ruff check app tests scripts`;
OpenAPI compare; `git diff --check`.

## Frontend Agent Order
Role: Frontend / MVP6.10 Tenant context surface
Start condition: read `docs/handoffs/wave-052/PM_REPORT.md`; coordinate with the
Backend report if contracts shift.
Write report: `docs/handoffs/wave-052/FRONTEND_REPORT.md`
Backlog IDs: `FE6-095` app-shell tenant switcher + types/client/mocks, `FE6-096`
read-only tenant view (summary + tenant-scoped projects), `FE6-097` isolation-
limited states + "no provisioning" boundary + all-false guard proof, `FE6-098`
mock + actual smoke.
Tasks: implement the tenant context indicator + client-side switcher in the app-
shell header (only the actor's ACTIVE visibility set; cross-tenant selection
unreachable) + a read-only tenant view (summary + tenant-scoped project list) per
`MVP6_10_FRONTEND_UX_REQUIREMENTS.md`. Isolation-limited states: 404
TENANT_NOT_FOUND (no existence/data leak) / 403 TENANT_ACCESS_SUSPENDED driven by
`denial_reason`; clear stale tenant-A data before resolving tenant-B; never reuse a
cross-tenant response. `TenantStatus`/`TenantMembershipStatus` D6 badges; persistent
"read-only context; no provisioning; project scoping unchanged; client-side switch
only" banner + live all-false 8-flag guard proof (200-only). NO create/edit/invite/
provision affordance. Existing global Projects list NOT re-scoped this wave. Types/
client/query/mocks match the frozen OpenAPI exactly; reuse by reference (no rename).
Add `npm run smoke:mvp6:tenancy:mock` and, if backend runnable, `:actual` (incl. an
isolation negative check).
Validation: `npm run test`, `npm run build`, the new mock smoke (+ actual if
runnable), responsive 0-overflow re-check, `git diff --check`.

## QA Agent Order
Role: Integration / QA
Start condition: read Wave52 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-052/QA_REPORT.md`
Backlog IDs: `INT6-090` backend runtime, `INT6-091` frontend mock/API, `INT6-092`
ISOLATION + no-mutation data-level guard, `INT6-093` Wave52 closeout.
Tasks: update `docs/backlog/INT6_10_MULTI_TENANT_ACCEPTANCE.md` R1-R9 with verdicts.
Validate the 4 endpoints, enums, all-false 8-flag guard, additive-over-project-
scoping. INDEPENDENTLY verify the ISOLATION headline at the data level (own script):
a not-a-member actor gets 404 TENANT_NOT_FOUND with NO name/count/project/data leak;
a suspended relationship gets 403; `/tenants/{B}/projects` + `/projects/{B}/tenant`
never leak another tenant's data; and NO connector/tenant call mutates any table
(before==after). Validate the FE mock + actual flow incl. an isolation negative
case. Run MVP6.9/earlier regression + smokes touched; confirm additive-only +
candidate/published separation intact. Recommend closeout / hardening / redesign.
Exact commands; no leftover listeners on 8000/5173; `git diff --check`.
