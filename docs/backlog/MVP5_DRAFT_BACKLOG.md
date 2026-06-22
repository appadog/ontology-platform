# MVP 5 Draft Backlog

Status: `FROZEN / WAVE 23 PM DECISION INPUT`
Date: 2026-06-19

MVP 5 covers enterprise governance, admin/operator workflows, RBAC/ABAC policy
surface, service account/API key lifecycle, automatic approval policy,
ontology import/export, operations observability, cost/DLQ visibility,
retention, backup, release, incident, and admin training scope.

## MVP 5 Entry Gate

- [x] MVP 4 P0 closeout accepted by QA.
- [x] MVP4 P1 follow-ups are separated from MVP5 P0 scope.
- [x] PM decisions in `docs/pm/MVP5_PREP_BRIEF.md` are reviewed and frozen for
      Wave23 contract drafting.
- [ ] Backend produces contract-first API/DTO draft before runtime
      implementation.
- [ ] Frontend reviews admin UX/field needs against the backend draft before
      broad UI implementation.
- [ ] QA produces `INT5-*` acceptance checklist and deterministic seed needs.

## Wave23 PM Freeze Summary

- MVP5 P0 demo is admin/operator centered and must not repeat the MVP4
  search/RAG demo.
- Local development auth remains allowed. Production SSO/OIDC is P1
  contract/documentation unless explicitly promoted later.
- Canonical roles:
  - `ORGANIZATION_ADMIN`
  - `PROJECT_ADMIN`
  - `ONTOLOGY_EDITOR`
  - `SOURCE_MANAGER`
  - `REVIEWER`
  - `PUBLISHER`
  - `ANALYST_VIEWER`
  - `EXTERNAL_API_CONSUMER`
  - `SERVICE_ACCOUNT`
- P0 permission dimensions include principal type, organization/project scope,
  role, resource type, action, data state, version context, sensitivity, and
  environment.
- API key/service account P0 uses local lifecycle semantics: create, one-time
  secret reveal, masked list/detail, revoke, scope/expiry/quota fields, and
  audit. Production secret rotation and vault/KMS integration are P1.
- Automatic approval P0 starts with policy definition and dry-run preview.
  `ENFORCE` mode remains gated by evidence, validation, version, candidate
  eligibility, policy version, and audit. Ungated autonomous publish is out.
- Ontology import/export P0 uses JSON package import/export with dry-run
  compatibility/conflict/destructive-impact checks. Full RDF/Turtle/OWL/SHACL
  fidelity is P1.
- Operations P0 exposes job health, retry, DLQ, cost budget, structured event,
  metrics/tracing availability, and audit links in local seedable form.
- Retention/backup P0 exposes policy, deletion dry-run impact, backup snapshot
  metadata, restore dry-run eligibility, confirmation, and audit expectations.
- Full SPARQL/Cypher console, full HA/distributed infra, production
  observability stack, full ABAC expression language, and production SSO/OIDC
  are P1.

## Wave25 PM Freeze Addendum

- `PM5-005` / `INT5-005` Wave25 P0 closes JSON ontology import/export only.
- Export package metadata must expose `package_id`, `schema_version`,
  `project_id`, `ontology_version_id`, class/property/relation counts,
  `generated_at`, compatibility notes, and audit ref. Download/checksum/expiry
  metadata may be added where available.
- Import is dry-run only in Wave25. Upload/paste JSON package or deterministic
  dry-run request input is allowed, but import apply, overwrite, publish, or
  graph mutation remains out of scope.
- Import dry-run must return package parse summary, compatibility status,
  create/update/delete/no-op counts, conflict rows, warning rows, destructive
  impact rows, rollback guidance, confirmation requirement, and audit
  preview/ref.
- Import dry-run must not mutate project state, ontology versions, candidate
  graph, or published graph. QA should verify before/after counts or stable
  snapshots.
- Frontend route is `/projects/:projectId/admin/import-export`; project admin
  tabs may include `Import/export`; global LNB remains a single stable `Admin`
  entry.
- `INT5-009` Wave25 regression requires Backend MVP5/MVP4/MVP3 focused tests,
  Frontend test/build plus MVP5 mock/actual smoke, and MVP3/MVP4 actual smokes
  where repo scripts and seed/runtime support exist. MVP1/MVP2 checks run when
  available and cheap. Docker/PostgreSQL Compose remains P1.

## PM Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| PM5-001 | P0 | PM | MVP5 prep brief and scope boundary | MVP4 closeout | `docs/pm/MVP5_PREP_BRIEF.md` defines P0 admin/operator demo flow, P0/P1 split, acceptance criteria, and security invariants |
| PM5-002 | P0 | PM | Enterprise role/permission model | PM5-001 | canonical roles and permission dimensions are frozen for Backend/Frontend/QA |
| PM5-003 | P0 | PM | API key/service account policy | PM5-002 | one-time secret reveal, masked display, revoke, scope, expiry, quota, and audit semantics are documented |
| PM5-004 | P0 | PM | Automatic approval policy | MVP3 review/publish rules, PM5-002 | dry-run default, enforce gate, evidence, validation, version, policy, and audit requirements are documented |
| PM5-005 | P0 | PM | Ontology import/export scope | MVP1 ontology model, MVP3 published versioning | JSON P0 package and dry-run conflict model are defined; RDF/Turtle/OWL/SHACL fidelity remains P1 |
| PM5-006 | P0 | PM | Operations/observability scope | MVP2 job flow, MVP4 quality closeout | job health, retry, DLQ, cost, structured events, metrics/tracing availability, and local seed expectations are scoped |
| PM5-007 | P0 | PM | Retention/backup/governance policy | PM5-006 | retention, deletion dry-run, backup snapshot metadata, restore dry-run, confirmation, and audit expectations are documented |
| PM5-008 | P0 | PM | Release/incident/admin training notes | PM5-001 | admin training topics, release checklist, incident triage, rollback/restore boundaries, and operator handoff notes are defined |
| PM5-009 | P0 | PM | MVP5 draft backlog | PM5-001~PM5-008 | PM5/BE5/FE5/INT5 backlog exists with P0/P1 split and acceptance drafts |
| PM5-010 | P0 | PM | ADR for MVP5 enterprise boundary | PM5-001~PM5-009 | ADR 0008 records enterprise/governance P0 boundary and P1 exclusions |

## Backend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| BE5-001 | P0 | Backend | Admin organization/project API draft | PM5-001 | additive endpoints/DTOs cover organization/project admin summary, settings, membership, and audit links under dev auth |
| BE5-002 | P0 | Backend | RBAC/ABAC DTO and policy draft | PM5-002 | role assignment, permission check, principal type, scope, resource, action, sensitivity, version context, and denial reason DTOs are drafted |
| BE5-003 | P0 | Backend | API key/service account API draft | PM5-003 | create returns raw secret once; list/detail return masked secret only; revoke/scope/expiry/quota/audit fields are present |
| BE5-004 | P0 | Backend | Automatic approval policy/evaluation API draft | PM5-004 | policy modes, conditions, dry-run evaluation, blocked reason codes, policy diff, enforce gate, and audit preview are drafted |
| BE5-005 | P0 | Backend | Ontology import/export job API draft | PM5-005 | JSON export, import dry-run, conflict/warning/destructive impact, package schema version, status, download refs, and audit events are drafted |
| BE5-006 | P0 | Backend | Operations/job/DLQ/cost API draft | PM5-006 | job health, retries, DLQ list/detail, retry/ack boundaries, cost budget, structured event, and observability availability DTOs are drafted |
| BE5-007 | P0 | Backend | Retention/backup governance API draft | PM5-007 | retention policy, deletion dry-run, backup snapshot list/status, restore dry-run eligibility, confirmation, and audit refs are drafted |
| BE5-008 | P0 | Backend | Audit/security event extension draft | PM5-002~PM5-007 | role, credential, policy, import/export, DLQ, retention, backup, and destructive actions produce auditable event DTOs |
| BE5-009 | P0 | Backend | Deterministic seed/smoke plan | BE5-001~BE5-008 | seed plan covers role matrix, masked credential, policy dry-run blocks, JSON import/export, DLQ, cost, retention, backup, and MVP4 regression |
| BE5-010 | P0 | Backend | MVP5 OpenAPI planning artifact | BE5-001~BE5-009 | `docs/api/MVP5_API_CONTRACT_DRAFT.md` and `docs/api/openapi-mvp5-draft.json` exist and parse |
| BE5-011 | P1 | Backend | Production SSO/OIDC integration | PM5-001 | provider metadata, callback, session, tenant mapping, logout, and JIT provisioning are implemented after P0 contract is stable |
| BE5-012 | P1 | Backend | Production secret rotation/vault integration | PM5-003 | rotation, KMS/vault storage, credential versioning, and emergency revoke are implemented after local masked lifecycle passes |
| BE5-013 | P1 | Backend | Full RDF/OWL/SHACL fidelity | PM5-005 | standards parser/exporter conformance and semantic validation are implemented after JSON package flow passes |

## Frontend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| FE5-001 | P0 | Frontend | Admin shell IA and navigation model | PM5-001, BE5-001 | organization/project admin areas, nav placement, selected scope, permission denied, loading, empty, and error states are specified |
| FE5-002 | P0 | Frontend | Role/permission management UX | PM5-002, BE5-002 | role assignment list/edit, permission preview, denial reasons, audit links, and read-only states are specified |
| FE5-003 | P0 | Frontend | API key/service account UX | PM5-003, BE5-003 | one-time secret reveal, masked secret display, revoke confirmation, expiry/quota/scope fields, and audit trail link are specified |
| FE5-004 | P0 | Frontend | Automatic approval policy UX | PM5-004, BE5-004 | draft edit, policy diff, dry-run table, blocked reasons, enforce confirmation, and audit preview are specified |
| FE5-005 | P0 | Frontend | Ontology import/export UX | PM5-005, BE5-005 | export package metadata, import dry-run, conflict/warning/destructive impact states, download/upload states, and audit links are specified |
| FE5-006 | P0 | Frontend | Operations dashboard UX | PM5-006, BE5-006 | job health, retry, DLQ, cost, observability availability, structured event detail, and action confirmations are specified |
| FE5-007 | P0 | Frontend | Retention/backup governance UX | PM5-007, BE5-007 | retention policy, deletion dry-run impact, backup snapshot list, restore dry-run, destructive confirmation, and audit links are specified |
| FE5-008 | P0 | Frontend | Frontend API/DTO field review | BE5-001~BE5-010 | blocking and non-blocking DTO gaps are listed, and smoke-testable markers for Wave24 are defined |
| FE5-009 | P1 | Frontend | SSO/OIDC admin UX | BE5-011 | provider setup, login callback errors, JIT mapping, and tenant session states are designed after PM promotion |
| FE5-010 | P1 | Frontend | Full query console UX | PM5-001 | SPARQL/Cypher editor, explain plans, saved queries, and result virtualization are designed after permission/performance guards exist |

## QA / Integration Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| INT5-001 | P0 | QA | MVP5 contract review | BE5-010, FE5-008 | OpenAPI draft parses; PM P0 scope is represented; Backend/Frontend field review has no unresolved P0 blocker |
| INT5-002 | P0 | QA | Authorization matrix review | PM5-002, BE5-002, FE5-002 | canonical roles, permission dimensions, allow/deny examples, and UI denied/read-only states are covered |
| INT5-003 | P0 | QA | API key/service account safety checklist | BE5-003, FE5-003 | raw secret appears only once, list/detail are masked, revoke is confirmed, raw secrets are absent from logs/reports/fixtures, and audit events exist |
| INT5-004 | P0 | QA | Automatic approval policy safety checklist | BE5-004, FE5-004 | dry-run is default; blocked reasons cover evidence, validation, version, candidate eligibility, and policy; enforce requires confirmation and audit |
| INT5-005 | P0 | QA | Ontology import/export acceptance checklist | BE5-005, FE5-005 | JSON export/import dry-run handles package metadata, conflicts, warnings, destructive impact, compatibility, and audit |
| INT5-006 | P0 | QA | Operations/DLQ/cost observability checklist | BE5-006, FE5-006 | job health, retry, DLQ, cost budget, structured event, metrics/tracing availability, and action boundaries are seedable and visible |
| INT5-007 | P0 | QA | Retention/backup governance checklist | BE5-007, FE5-007 | retention policy, deletion dry-run, backup snapshot, restore dry-run, destructive confirmation, and audit expectations are testable |
| INT5-008 | P0 | QA | Frontend admin UX state checklist | FE5-001~FE5-008 | admin pages define loading, empty, error, permission denied, read-only, masked-secret, dry-run, enforce, destructive confirmation, and audit-link states |
| INT5-009 | P0 | QA | MVP1-MVP4 regression guard plan | MVP4 closeout | project/ontology/source, extraction/evidence, review/publish, quality/search/RAG/external read-only smokes remain protected |
| INT5-010 | P0 | QA | Local seed/smoke runnable plan | BE5-009, FE5-008 | deterministic seed plan covers admin user, service account, policy dry-run, JSON import/export, DLQ/cost, retention/backup, and current MVP regressions |
| INT5-011 | P1 | QA | Production SSO/OIDC acceptance | BE5-011, FE5-009 | provider integration and tenant/session hardening are verified after promotion |
| INT5-012 | P1 | QA | Standards import/export conformance | BE5-013 | RDF/Turtle/OWL/SHACL compatibility and semantic fidelity are verified after JSON P0 passes |

## MVP 5 Acceptance Draft

- Organization admin can inspect admin console state with organization/project
  context and audit links.
- Admin can manage role assignments using canonical roles and can see
  permission denied/read-only states.
- Admin can create service account/API key credentials with one-time raw secret
  reveal, then only masked values, revoke confirmation, scope/expiry/quota
  context, and audit records.
- Admin can define automatic approval policy, run dry-run preview, inspect
  blocked reasons, review policy diff, and enforce only with evidence,
  validation, version, policy, and audit gates.
- Admin can export ontology JSON package and run import dry-run with conflicts,
  warnings, destructive impact, compatibility, and audit context.
- Admin can inspect operations health including jobs, retry, DLQ, cost budget,
  structured event examples, and observability availability states.
- Admin can inspect retention and backup governance, run deletion/restore
  dry-runs, and see destructive confirmation and audit expectations.
- MVP1 through MVP4 product flows remain regression-protected.

## Scope Limits

- No production SSO/OIDC implementation in P0.
- No raw secret logging, fixture storage, report output, or repeat display.
- No production secret rotation/vault/KMS requirement in P0.
- No full HA/distributed infrastructure or cross-region DR in P0.
- No full SPARQL/Cypher console in P0.
- No full RDF/Turtle/OWL/SHACL fidelity in P0.
- No full ABAC expression engine in P0.
- No automatic approval path that bypasses evidence, validation, version, and
  audit gates.
- No candidate graph facts in published graph or RAG answer surfaces.
- No broad MVP5 runtime implementation before Wave23 contract-first review.

## Backend Contract-First Scope

- Endpoint families and DTOs for organization/project admin, role assignment,
  permission checks, service accounts/API keys, policy documents, policy
  evaluation, import/export jobs, operations/DLQ/cost, retention/backup, and
  audit events.
- Enum literals for roles, principal types, permission actions, policy modes,
  blocked reasons, credential status, job status, event severity, backup
  status, and retention action mode.
- OpenAPI draft/export and deterministic seed/smoke plan.

## Frontend Field/UX Review Scope

- Admin console IA and organization/project context.
- Permission, read-only, denied, loading, empty, error, masked secret,
  one-time reveal, dry-run, enforce, destructive confirmation, and audit link
  states.
- Field needs for role matrix, credential lifecycle, policy editor, import
  dry-run, operations dashboard, retention, backup, and release/incident notes.

## QA Acceptance Checklist Scope

- `INT5-*` contract checks.
- deterministic seed requirements.
- authorization matrix.
- security invariant assertions.
- automatic approval safety.
- JSON import/export compatibility.
- operations/DLQ/cost visibility.
- retention/backup dry-run.
- MVP1-MVP4 regression guard.
