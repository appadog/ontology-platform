# Next Orders - Wave 51

Status: `MVP6.10 MULTI-TENANT RUNTIME — CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-08

Next MVP6 theme (user-directed sequence): **Multi-tenant runtime**. Cut to a
minimal, SAFE, read-only P0: a tenant/workspace CONTEXT + scoping/isolation model
surfaced over the existing project scoping. NO cross-tenant data access, NO tenant
provisioning/mutation, deterministic, all-false guard. Every existing invariant
(candidate/published separation, evidence/version traceability, RBAC) is preserved
and now additionally tenant-scoped.

Wave51 is **contract-first planning only** (no runtime/UI/test/seed code). Runtime
waits for Wave52. Mirrors the planning-wave pattern (Wave14/.../49).

## Non-negotiable boundary (this becomes ADR 0017)
- P0 is READ-ONLY tenant context + tenant-scoped listing/summary only. NO tenant
  create/update/delete, NO membership mutation, NO cross-tenant read (a caller in
  tenant A can never see tenant B's projects/data), deterministic mock tenants.
- Tenant scoping is ADDITIVE over existing project scoping: projects belong to a
  tenant; existing per-project endpoints keep working; the new surface just
  exposes the tenant a project lives in + a tenant-scoped project/summary list.
  No existing MVP1-MVP6.9 data is re-homed or renamed.
- Isolation is the headline invariant: QA must be able to prove cross-tenant access
  returns 403/404 and never leaks another tenant's data.
- Every response carries an all-false mutation guard. Additive; no break of
  MVP1-MVP6.9 surfaces/smokes; reuse existing shapes by reference (no renames).

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md` (multi-tenant theme)
  + `docs/backlog/MVP6_DRAFT_BACKLOG.md`.
- Study precedents: MVP5 admin/RBAC + `Role` + audit; the project scoping model
  (MVP1 projects) the tenant wraps; the recent read-only + all-false-guard themes
  (MVP6.7 impact / MVP6.9 connectors) for the guard + isolation-assertion style.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-051/{ROLE}_REPORT.md`.

## Theme Scope (PM freezes the smallest coherent, safe P0)
Suggested minimal P0 (PM to confirm/trim): read-only tenant context — list the
tenants the current actor belongs to; get a tenant summary; list a tenant's
projects (tenant-scoped) — with strict isolation (cross-tenant access denied) and
an explicit "read-only context; no provisioning; existing project scoping
unchanged" boundary.

## Execution Sequence
1. PM freezes the smallest coherent, safe multi-tenant P0 + brief + ADR 0017
   (read-only tenant context + strict isolation / no provisioning-mutation /
   additive-over-project-scoping / all-false guard).
2. Backend drafts an additive API contract + OpenAPI planning artifact.
3. Frontend reviews fields/states/IA (tenant switcher/context surface; isolation-
   limited states) — planning only.
4. QA writes an executable acceptance checklist (isolation the headline gate) and
   recommends Wave52.

## PM Agent Order
Role: PM / Architect — MVP6.10 Multi-tenant P0 Freeze
Write report: `docs/handoffs/wave-051/PM_REPORT.md`
Backlog ID: `PM6-033`
Tasks:
- Freeze the smallest coherent P0: the tenant/workspace model (a few deterministic
  mock tenants + membership), the read-only endpoints (my-tenants / tenant summary
  / tenant-scoped projects), the isolation rule (cross-tenant -> 403/404, no leak),
  enums/states, authz (tenant membership + reuse MVP5 `Role`), and the all-false
  mutation guard. Make explicit that existing project scoping is unchanged and
  tenant scoping is additive.
- Explicitly exclude: tenant create/update/delete, membership mutation, cross-tenant
  access, tenant-level billing/quota enforcement, data re-homing/migration, real
  auth/SSO tenancy.
- Write `docs/pm/MVP6_10_MULTI_TENANT_BRIEF.md`; add `docs/adr/0017-...md`; update
  `docs/backlog/MVP6_DRAFT_BACKLOG.md` with PM/BE/FE/INT IDs (continue numbering;
  INT6 used through INT6-079, so QA IDs start INT6-080).
- Confirm durable invariants preserved (isolation, candidate/published separation,
  additive-only, no mutation).
Validation: `git diff --check`. Do NOT touch apps/.

## Backend Agent Order
Role: Backend — Multi-tenant Contract Draft (planning only)
Start condition: read `docs/handoffs/wave-051/PM_REPORT.md`.
Write report: `docs/handoffs/wave-051/BACKEND_REPORT.md`
Tasks:
- Draft additive endpoint(s) + DTO/enum names in
  `docs/api/MVP6_10_MULTI_TENANT_API_CONTRACT_DRAFT.md` (e.g. list my tenants; get
  tenant summary; list tenant-scoped projects), reusing project + MVP5 `Role` +
  audit shapes by reference (no renames). All-false mutation guard; strict isolation
  (cross-tenant -> 403/404). Model the isolation error codes explicitly.
- Produce `docs/api/openapi-mvp6-10-draft.json` (OpenAPI 3.1.0, additive to
  MVP1-MVP6.9, e.g. `0.6.10-draft`). No runtime code. Capture open questions.
Validation: OpenAPI JSON parse; `git diff --check`.

## Frontend Agent Order
Role: Frontend — Multi-tenant UX/API Requirements (planning only)
Start condition: read PM report + Backend draft if ready.
Write report: `docs/handoffs/wave-051/FRONTEND_REPORT.md`
Tasks:
- Document, in `docs/pm/MVP6_10_FRONTEND_UX_REQUIREMENTS.md`: the tenant context/
  switcher surface (where it lives per ADR 0010 — e.g. a top-level tenant context
  indicator + a read-only tenant/workspace view), the tenant-scoped project list,
  the isolation-limited states (cross-tenant denied — clear, no data leak), and the
  "read-only context; no provisioning" boundary copy; first-class loading/empty/
  error/permission states. Apply the closed design language. DTO gap analysis vs
  the Backend draft. No route/component/type/mock/smoke code.
Validation: `git diff --check`.

## QA Agent Order
Role: Integration / QA — Multi-tenant Acceptance Checklist
Start condition: read Wave51 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-051/QA_REPORT.md`
Tasks:
- Create `docs/backlog/INT6_10_MULTI_TENANT_ACCEPTANCE.md` (C planning + R
  NOT-RUNNABLE runtime gates), continuing INT6 numbering (INT6-080+). Make ISOLATION
  the headline runtime gate (cross-tenant access denied, no leak).
- Verify PM/BE/FE agree on the P0, tenant model, the read-only + strict-isolation +
  no-provisioning + additive-over-project-scoping boundary, all-false guard, and
  exclusions. Confirm no runtime leaked (apps/ + infra/). OpenAPI parse.
- Recommend Wave52 thin implementation, hardening, or redesign.
Validation: OpenAPI parse; runtime-leakage search; `git diff --check`.
