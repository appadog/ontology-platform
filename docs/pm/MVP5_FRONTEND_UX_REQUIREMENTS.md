# MVP 5 Frontend UX Requirements

Status: `WAVE 23 FRONTEND ADMIN UX/API REQUIREMENTS`
Date: 2026-06-19

This document defines the MVP5 admin/operator UX requirements from a
Frontend/UI perspective. It is intentionally planning-only. Wave23 does not
implement React routes, UI components, runtime clients, mocks, or fixtures.

Primary inputs:

- `docs/pm/MVP5_PREP_BRIEF.md`
- `docs/backlog/MVP5_DRAFT_BACKLOG.md`
- `docs/adr/0008-mvp5-enterprise-governance-boundary.md`
- `docs/handoffs/wave-023/PM_REPORT.md`
- `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`
- `02_FRONTEND_AGENT_SKILL.md`

Backend draft status:

- `docs/api/MVP5_API_CONTRACT_DRAFT.md` appeared during this Frontend review
  and was reviewed after the initial PM-freeze pass.
- `docs/handoffs/wave-023/BACKEND_REPORT.md` was not present during this
  Frontend review.
- `docs/api/openapi-mvp5-draft.json` was not present during this Frontend
  review, although the Backend draft names it as the canonical
  machine-readable artifact.

## Review Summary

- MVP5 P0 should add an admin/operator control plane, not another search/RAG
  workspace. The first screen should make organization/project governance,
  automation safety, operations health, and auditability visible.
- The admin console should live as a global app shell area at `/admin`, with
  organization context always visible and project context selected when a
  screen acts on project resources.
- Organization-scoped pages manage organization membership, global defaults,
  service accounts that span projects, and organization audit summaries.
  Project-scoped admin pages manage project roles, policies, import/export,
  operations, retention, and backup.
- P0 UX must distinguish permission denied, read-only, dry-run, enforce,
  destructive confirmation, one-time secret reveal, masked secret, revoked
  credential, expired credential, and audit-linked states.
- No screen may rely only on color for critical safety markers. Labels,
  badges, icons, copy, disabled affordances, and confirmation text must carry
  the state.
- Automatic approval remains dry-run-first. Enforce mode is a guarded workflow
  with policy diff, blocked reason review, explicit confirmation, and audit
  preview.
- Raw API secrets must only appear in the create success step. They must never
  appear again in list/detail views, audit rows, fixtures, reports, or logs.
- The Backend draft broadly covers the PM P0 areas, but Wave24 should not start
  actual frontend API integration until the OpenAPI draft exists and raw-secret
  examples are removed from planning/docs/examples.

## Referenced Backend Contract Draft

The Backend planning draft reviewed by Frontend is
`docs/api/MVP5_API_CONTRACT_DRAFT.md`, status
`WAVE 23 BACKEND CONTRACT DRAFT`.

Draft endpoint families reviewed:

| UI area | Endpoint examples | Draft schemas/enums |
|---|---|---|
| Organization/project admin | `/api/v1/admin/organizations/{organization_id}/summary`, `/api/v1/admin/projects/{project_id}/summary` | `OrganizationAdminSummary`, `ProjectAdminSummary`, `AdminMembershipMember` |
| RBAC/permission preview | `/api/v1/admin/projects/{project_id}/role-assignments`, `/api/v1/admin/permission-checks` | `RoleAssignment`, `PermissionCheckRequest`, `PermissionCheckResponse`, `EnterpriseRole`, `PermissionDecision`, `PermissionDenyReason` |
| Service accounts/API keys | `/api/v1/admin/projects/{project_id}/service-accounts`, `/api/v1/admin/projects/{project_id}/api-keys`, revoke endpoints | `CredentialCreateRequest`, `CredentialCreateResponse`, `CredentialView`, `CredentialRevokeRequest`, `CredentialStatus`, `CredentialScope` |
| Automatic approval | `/api/v1/admin/projects/{project_id}/automatic-approval-policies`, evaluate/diff/enforce-preview endpoints | `AutomaticApprovalPolicyDocument`, `PolicyEvaluationResponse`, `PolicyDiffResponse`, `EnforcePreviewResponse`, `PolicyMode`, `PolicyBlockReason` |
| Ontology import/export | ontology export/import job endpoints | `OntologyPackageMetadata`, `OntologyExportJob`, `OntologyImportDryRunJob`, `ImportConflictType`, `ImportConflictSeverity` |
| Operations | operations dashboard, jobs, DLQ, cost budget, events, observability endpoints | `OperationsDashboardResponse`, `OperationJob`, `DlqRow`, `CostBudgetSummary`, `ObservabilityAvailability` |
| Retention/backup | retention policy, deletion dry-run, backup snapshot, restore dry-run endpoints | `RetentionPolicy`, `RetentionRule`, `RetentionDeletionDryRunResponse`, `BackupSnapshot`, `RestoreDryRunResponse` |
| Audit/security | project audit events, organization security events | `AuditEvent`, `AuditEventCategory`, MVP5 error/state codes |

Frontend draft review result:

- Blocking before Wave24 API integration:
  - `docs/api/openapi-mvp5-draft.json` must exist and parse.
  - Backend examples/OpenAPI examples/fixtures/reports must not include
    raw-secret-looking literals. Use a non-secret placeholder for the one-time
    create field example and ensure list/detail examples contain only masked
    values.
  - Admin summary and every page response need actor permission summary or a
    reusable permission-check response so the UI can render denied/read-only
    states without role-name inference.
  - Permission check response should echo evaluated context and expose
    read-only/conditional semantics explicitly, not only `ALLOW`/`DENY`.
  - DLQ/job action DTOs need retry/ack eligibility plus blocked reason fields.
- Non-blocking refinements:
  - Add display labels for principals, roles, policy conditions, and reason
    codes.
  - Add correlation/request/trace ids consistently across operations, audit,
    and error DTOs.
  - Add checksum/integrity metadata for exports and backup snapshots where
    available.

## Admin IA And Navigation Model

Recommended top-level placement:

| Route | Scope | Purpose | LNB entry |
|---|---|---|---|
| `/admin` | Organization | Admin console overview and governance status. | Yes |
| `/admin/organization` | Organization | Organization settings, users, role defaults, org audit summary. | Yes, under Admin |
| `/admin/projects` | Organization | Project admin index and selected project launcher. | Yes, under Admin |
| `/admin/service-accounts` | Organization | Organization-level service accounts and API credentials. | Yes, under Admin |
| `/admin/audit` | Organization | Cross-project governance audit browser. | Yes, under Admin |
| `/projects/:projectId/admin` | Project | Project admin overview and governance summary. | Contextual link |
| `/projects/:projectId/admin/roles` | Project | Project role assignments and permission preview. | Contextual link |
| `/projects/:projectId/admin/credentials` | Project | Project API keys and service account bindings. | Contextual link |
| `/projects/:projectId/admin/policies/approval` | Project | Automatic approval policy editor and evaluation. | Contextual link |
| `/projects/:projectId/admin/import-export` | Project | JSON ontology export and import dry-run. | Contextual link |
| `/projects/:projectId/admin/operations` | Project | Jobs, retries, DLQ, cost, events, observability. | Contextual link |
| `/projects/:projectId/admin/retention-backup` | Project | Retention policy, deletion dry-run, backups, restore dry-run. | Contextual link |

Navigation rules:

- Add only `Admin` as a stable top-level LNB area. Do not add every admin
  detail route to the global LNB.
- Admin overview cards and project settings tabs should provide contextual
  entry points for project-scoped pages.
- ID-bound pages such as credential detail, policy version detail, DLQ event
  detail, backup snapshot detail, and audit event detail should be reached from
  parent tables or drawers, not the LNB.
- The app shell should show the active organization selector in the header.
  Project-scoped admin pages should also show selected project, project status,
  and active ontology/published graph version context when relevant.
- If no organization is selected, global admin pages show an organization
  selection empty state. If no project is selected, project admin links route to
  `/admin/projects` and prompt selection.
- Organization admins may see both org and project admin surfaces. Project
  admins may see project-scoped admin surfaces only. Other roles may see
  read-only or denied states based on permission checks.

Context display:

- Organization context: organization name, organization id, environment
  marker, auth mode marker, and current actor/principal.
- Project context: project name, project id, project status, current ontology
  version, current published graph version, and selected admin section.
- Sensitive context marker: show when the screen can affect secrets, policy
  enforcement, deletion, restore, import overwrite, or DLQ acknowledge.

## Common State Requirements

Every P0 admin screen must define these states:

- `loading`: skeleton or placeholder that preserves table/detail layout.
- `empty`: no resources or no selected scope, with a safe next action.
- `error`: API error message, request id if available, retry action, and back
  link to the nearest stable admin page.
- `permission_denied`: actor cannot read the resource. Show denied reason,
  needed permission, scope, and audit/support link when available.
- `read_only`: actor can read but cannot mutate. Hide destructive primary
  buttons or render disabled buttons with reason tooltips.
- `stale_context`: selected organization/project/version changed or no longer
  matches the action draft. Require refresh before mutation.
- `audit_unavailable`: do not block non-destructive reads, but clearly mark
  audit link unavailable and prevent enforce/destructive actions if audit is a
  required gate.

Permission state fields needed from Backend:

- `can_read`, `can_create`, `can_update`, `can_delete`, `can_assign_role`,
  `can_preview_policy`, `can_enforce_policy`, `can_import`, `can_export`,
  `can_retry_job`, `can_ack_dlq`, `can_revoke_credential`,
  `can_restore_dry_run`.
- `denied_reason_code`, `denied_reason_message`, `required_permission`,
  `scope_type`, `scope_id`, `principal_id`, `principal_type`, and
  `audit_event_ref`.

## FE5-001 Admin Shell IA

Primary screens:

- Admin overview.
- Organization settings and membership summary.
- Project admin index.
- Project admin overview.

Admin overview content:

- Organization governance status.
- Project count and selected project launcher.
- Role assignment summary by role and scope.
- Credential summary: active, expiring, revoked.
- Policy summary: disabled, dry-run, enforce, pending draft.
- Operations health: failing jobs, retry backlog, DLQ count, cost budget.
- Retention/backup summary.
- Recent audit events.

P0 states:

- `loading`: skeleton for summary bands and recent audit rows.
- `empty`: organization has no projects or current actor has no admin scope.
- `error`: organization summary failed; keep navigation and context visible.
- `permission_denied`: no org/project admin read permission.
- `read_only`: analyst/viewer can inspect non-sensitive summaries only; hide
  credential secret actions and destructive actions.

Blocking DTO asks:

- Admin summary must return explicit scope, actor, permission summary, and
  audit refs. The UI should not infer admin capability from role name alone.
- Project admin index needs project id, name, status, current ontology version,
  current published graph version, and current actor permission summary.

Non-blocking DTO asks:

- Include `last_admin_activity_at`, `open_risk_count`, and
  `recommended_next_action` for better overview prioritization.

## FE5-002 Role And Permission Management UX

Route:

- `/projects/:projectId/admin/roles`

Required UX:

- Role assignment table with principal, principal type, role, scope, status,
  created by, created at, expires at, last updated, and audit link.
- Filters for role, principal type, assignment status, scope, and permission
  action.
- Create/edit assignment drawer with principal selector, role selector, scope,
  expiry, reason, and preview before save.
- Permission preview panel that evaluates a principal against selected
  resource/action/version/sensitivity context.
- Denied reasons table for failed preview examples.
- Audit trail link on every assignment row and save confirmation.

Assignment list states:

- `loading`: stable table skeleton.
- `empty`: no assignments in selected project; show create action only if
  `can_assign_role`.
- `error`: table load failed; retry and return to project admin overview.
- `permission_denied`: cannot read role assignments.
- `read_only`: can read assignments but cannot create/edit/revoke; edit
  controls disabled with denied reason.

Edit flow states:

- `draft`: local unsaved assignment.
- `preview_required`: save disabled until permission preview succeeds.
- `preview_allowed`: show allowed permissions and audit preview.
- `preview_denied`: show blocking reason rows and keep save disabled.
- `save_pending`: disable duplicate submit.
- `save_error`: preserve draft and show field or permission errors.
- `saved`: show audit event link and updated assignment row.

Permission preview fields:

- Principal: id, display name, principal type.
- Scope: organization id, project id.
- Role: canonical role literal.
- Resource: resource type, resource id if applicable.
- Action: permission action literal.
- Data state: draft, candidate, approved, published, archived, deleted,
  dry-run, enforce.
- Version context: ontology version, prompt version, model run, published graph
  version, policy version.
- Sensitivity: secret, masked secret, evidence content, source content, audit
  event, cost data.
- Decision: allowed/denied/read-only plus reason code and message.

Blocking DTO asks:

- Role assignment must be a first-class resource with stable id, scope,
  status, actor metadata, expiry, and audit refs.
- Permission preview response must include allowed boolean, read-only boolean,
  denied reason code, required permission, and the evaluated context. Without
  evaluated context, QA cannot prove the UI asked the intended question.

Non-blocking DTO asks:

- Include human-readable `principal_display_name` and `role_label` to avoid
  Frontend-only label reconstruction.
- Include `assignment_risk_level` for assignments that grant secret,
  destructive, or enforce-policy permissions.

## FE5-003 API Key And Service Account UX

Routes:

- `/admin/service-accounts`
- `/projects/:projectId/admin/credentials`

Required UX:

- Credential list with name, credential type, principal/service account, scope,
  roles, status, masked secret prefix/suffix, created at, created by, expires
  at, last used at, quota, and audit link.
- Create flow that collects name, description, scope, role binding,
  expiration, quota, allowed endpoints or permission actions, and reason.
- Create success screen with one-time raw secret reveal and copy action.
- Future list/detail views show masked secret only.
- Revoke confirmation requires credential name, scope, and typed confirmation
  or equivalent explicit confirmation.
- Expired, revoked, disabled, and quota-exceeded credentials have distinct
  states and no secret reveal action.
- Audit trail link appears on create, scope change, expiry change, quota
  change, reveal, revoke, and failed permission attempts when available.

One-time secret reveal rules:

- Raw secret appears only in the create success step.
- Raw secret is never stored in frontend state longer than the reveal step
  requires. It should not be persisted in URL, local storage, session storage,
  logs, mocks, screenshots, reports, or audit text.
- After closing the reveal step, refreshing, navigating away, or opening detail
  later must show only masked value and a "secret cannot be shown again" state.
- A "copy" action should mark copied state but not re-render the raw secret in
  another location.

P0 states:

- `loading`: credential table skeleton.
- `empty`: no credentials; show create action only if permitted.
- `error`: list/detail/create/revoke failed; raw secret must not be included in
  error detail.
- `permission_denied`: cannot read credential metadata.
- `read_only`: can read masked metadata but cannot create/revoke/change scope.
- `created_secret_reveal`: raw secret visible once with copy and close actions.
- `masked_display`: list/detail shows masked value only.
- `revoked`: row remains visible with revoked badge, revoked by/at, audit ref.
- `expired`: disabled row action; renewal is P1 unless Backend promotes it.
- `quota_exceeded`: show quota status and last failure event.

Blocking DTO asks:

- Create response must separate `raw_secret` from persistent
  `credential` metadata. List/detail schemas must not include `raw_secret`.
- Credential DTO must include status, masked display value, scope, role
  bindings, expiry, quota, last used, and audit refs.
- Revoke response must include final status and audit event ref.
- Backend examples and deterministic seed must not contain raw fixture secrets.

Non-blocking DTO asks:

- Include `secret_display_hint` such as `sk_...abcd` and `secret_last_four`
  rather than asking Frontend to mask.
- Include `days_until_expiry` and `quota_usage_percent` for clearer list
  sorting and status badges.

## FE5-004 Automatic Approval Policy UX

Route:

- `/projects/:projectId/admin/policies/approval`

Required UX:

- Policy header with current mode: `DISABLED`, `DRY_RUN`, or `ENFORCE`.
- Draft policy editor for conditions such as candidate type, confidence
  threshold, validation outcome, evidence presence, reviewer pattern, relation
  risk, ontology version, and source type.
- Side-by-side policy diff between active policy version and draft policy.
- Dry-run action that evaluates the draft against seeded candidates before
  enforce is available.
- Dry-run result table with would approve, blocked, requires manual review,
  candidate refs, evidence state, validation state, version state, policy
  reason, and audit preview.
- Blocked reason rows for missing evidence, failed validation, stale ontology
  version, unsafe relation type, missing reviewer pattern, ineligible candidate
  status, policy version mismatch, and audit unavailable.
- Enforce confirmation step with policy diff, affected count, blocked count,
  safe count, required gates, typed reason, and audit preview.
- Persistent visual marker for dry-run versus enforce mode in header, policy
  cards, result table, and confirmation modal.

P0 states:

- `loading`: policy and evaluation skeleton.
- `empty`: no policy exists; default to `DISABLED` or create draft action.
- `error`: policy load/evaluation/save failed; preserve draft.
- `permission_denied`: cannot read or preview policy.
- `read_only`: can read policy and dry-run results but cannot save/enforce.
- `draft_dirty`: local changes not evaluated.
- `dry_run_required`: enforce disabled until latest draft has dry-run result.
- `dry_run_running`: result table disabled with progress state.
- `dry_run_complete`: show result table and audit preview.
- `dry_run_blocked`: show blocked rows; enforce disabled for unsafe policy.
- `enforce_ready`: all required gates pass and actor can enforce.
- `enforce_confirming`: confirmation with diff, counts, reason, audit preview.
- `enforced`: show new policy version and audit event link.

Safety rules:

- The default mode must be `DRY_RUN` or `DISABLED`, never accidental
  `ENFORCE`.
- Save draft, run dry-run, and enforce are separate actions.
- Enforce is unavailable if audit is unavailable, version context is stale, or
  any required safety gate is missing.
- The UI must not imply direct publication without existing review/publish
  eligibility gates.

Blocking DTO asks:

- Policy DTO must include policy id, policy version, mode, scope, conditions,
  created/updated metadata, active/draft status, and audit refs.
- Evaluation response must include evaluated policy version, candidate rows,
  decision status, blocked reason codes, gate status fields, and audit preview.
- Enforce request/response must include reason, previous policy version,
  target policy version, affected count, blocked count, actor, and audit ref.

Non-blocking DTO asks:

- Include policy condition labels and reason display labels from Backend so
  QA can assert stable copy without Frontend-only dictionaries.
- Include sample candidate names and source labels for dry-run table readability.

## FE5-005 Ontology Import/Export UX

Route:

- `/projects/:projectId/admin/import-export`

Required export UX:

- Export panel showing package format `JSON`, package schema version, project
  id, ontology version, generated timestamp, counts for
  classes/properties/relations, compatibility notes, and audit link.
- Export job progress with queued/running/succeeded/failed states.
- Download state with file name, checksum if available, expiry if available,
  and audit event link.
- Export must support ready, loading, error, and empty states without exposing
  raw credential material in previews, filenames, download metadata, or audit
  text.

Required import UX:

- Upload/select or paste a JSON package, or run a deterministic dry-run request
  supplied by seed/mock data.
- Package metadata preview before dry-run: package id, schema version, source
  project id, source ontology version, generated timestamp, class/property/
  relation counts, compatibility notes, and compatibility status.
- Import dry-run table with create/update/delete/no-op counts, conflict rows,
  warning rows, incompatible schema/version, destructive impact rows, rollback
  guidance, confirmation requirement, and audit preview/ref.
- Conflict detail drawer with local item, package item, affected graph lineage,
  proposed resolution, and whether the action is destructive.
- Wave25 UI must not provide an import apply/overwrite/publish mutation. If a
  confirmation requirement is returned, show it as a disabled/future-gated
  requirement with destructive impact summary, rollback guidance, and audit
  preview.
- Copy must make clear that dry-run does not mutate ontology/project state.

P0 states:

- `loading`: package/export/import job skeleton.
- `empty`: no export jobs or no import package selected.
- `error`: upload, dry-run, job, or download failure.
- `permission_denied`: cannot export/import.
- `read_only`: can view package history but cannot start jobs.
- `export_running`: job status visible and download disabled.
- `export_ready`: download enabled with audit link.
- `export_expired`: download disabled, rerun export action if permitted.
- `import_metadata_ready`: metadata parsed, dry-run required.
- `import_dry_run_running`: conflicts disabled until result.
- `import_compatible`: dry-run completed with no blocking conflicts.
- `import_conflicts`: conflicts block enforce until resolved or acknowledged.
- `import_warnings`: warnings visible but may not block if Backend marks
  non-blocking.
- `import_destructive`: confirmation requires explicit destructive impact
  acknowledgment.
- `import_invalid`: malformed JSON, missing package shape, unsupported schema,
  or incompatible version blocks dry-run/apply.
- `import_error`: dry-run request failed after package parse.
- `compatibility_blocked`: incompatible schema/version blocks import.
- `audit_link`: audit preview/ref visible when available.
- `rollback_guidance`: rollback guidance visible even when apply is out of
  Wave25 scope.
- `confirmation_required`: confirmation requirement visible, but no mutation
  button is enabled in Wave25.

Blocking DTO asks:

- Export response needs package metadata, job status, download ref, checksum or
  integrity hint, expiry if applicable, and audit refs.
- Import dry-run response needs package parse summary, compatibility status,
  conflicts, warnings, destructive impact rows, create/update/delete/no-op
  counts, affected ontology version, rollback guidance, confirmation
  requirement, and audit preview/ref.
- Conflict and warning rows need stable ids and severity/blocking flags.
- Dry-run response needs an explicit non-mutating contract marker or enough
  stable before/after identifiers for QA to prove project and ontology state did
  not change.

Non-blocking DTO asks:

- Include package display labels and object-level stable references for
  classes/properties/relations to improve conflict drawers.
- Include checksum/integrity metadata and package display labels if available.

## FE5-006 Operations Dashboard UX

Route:

- `/projects/:projectId/admin/operations`

Required UX:

- Job health summary by type and status.
- Retry queue summary with retry count, last error, next retry at, and action
  availability.
- DLQ list with event id, job id, job type, severity, reason, created at, last
  error, retry eligibility, acknowledge eligibility, and audit link.
- Structured event detail drawer with payload summary, correlation id, trace id
  if available, actor/principal, resource refs, and redacted sensitive fields.
- Cost budget panel with budget amount, period, current spend/usage, token
  usage if available, threshold status, and unavailable state.
- Metrics/tracing availability panel that states whether metrics, traces, logs,
  and structured events are available in the current environment.
- Retry and acknowledge actions with boundary labels: retry requeues work;
  acknowledge marks operator handling and does not silently delete lineage.

P0 states:

- `loading`: summary and table skeletons.
- `empty`: no jobs or no DLQ rows; show healthy empty state.
- `error`: partial panel failure allowed if other panels load.
- `permission_denied`: cannot read operations.
- `read_only`: can inspect operations but cannot retry or acknowledge.
- `partial_unavailable`: metrics/tracing/cost panel unavailable but job/DLQ
  data remains visible.
- `retry_confirming`: confirm job id, reason, eligibility, and audit preview.
- `ack_confirming`: confirm DLQ row, reason, and audit preview.
- `action_blocked`: retry/ack disabled with reason.

Blocking DTO asks:

- Operations summary must distinguish job status, retry backlog, DLQ count,
  cost budget status, and observability availability.
- DLQ rows need retry/ack eligibility, blocked reason, severity, structured
  event ref, and audit refs.
- Structured events must identify redacted sensitive fields so the UI does not
  accidentally expose secrets or source content.

Non-blocking DTO asks:

- Include `correlation_id`, `trace_id`, and `request_id` consistently across
  job, DLQ, structured event, and audit refs.
- Include recommended operator action where Backend can derive one safely.

## FE5-007 Retention And Backup Governance UX

Route:

- `/projects/:projectId/admin/retention-backup`

Required UX:

- Retention policy table by resource type: sources, evidence, candidates,
  audit events, published graph snapshots, operation events.
- Policy fields: retention period, deletion mode, legal hold status if present,
  last updated, updated by, and audit link.
- Deletion dry-run flow with resource type, filter/window, affected counts,
  graph lineage impact, irreversible impact, blocked reasons, and audit preview.
- Backup snapshot list with snapshot id, status, created at, created by,
  size/counts if available, included resources, restore eligibility, and audit
  link.
- Restore dry-run flow with selected snapshot, compatibility status, affected
  resources, destructive overwrite impact, blocked reasons, and audit preview.
- Destructive confirmations for deletion execution and restore execution if
  Backend promotes execution after dry-run. Wave23 Frontend requirement treats
  dry-run as P0 and execution as guarded/future unless Backend explicitly
  drafts it.

P0 states:

- `loading`: policy/snapshot skeletons.
- `empty`: no backups or no retention policy; show setup action only if
  permitted.
- `error`: retention, dry-run, snapshot, or restore failure.
- `permission_denied`: cannot read governance.
- `read_only`: can inspect policy/snapshots but cannot run dry-runs or update.
- `policy_read_only`: policy is managed externally or outside actor scope.
- `deletion_dry_run_ready`: impact available, execution still separate.
- `deletion_blocked`: legal/audit/version/permission block.
- `restore_dry_run_ready`: compatibility and impact available.
- `restore_blocked`: incompatible snapshot or insufficient permission.
- `destructive_confirming`: typed reason and impact acknowledgment required.

Blocking DTO asks:

- Retention policy DTO needs resource type, period, mode, scope, update
  metadata, read-only/managed-by flags, and audit refs.
- Deletion dry-run must return affected counts, lineage impact, irreversible
  impact, blocked reasons, and audit preview without deleting anything.
- Backup snapshot DTO needs status, scope, created metadata, resource coverage,
  compatibility, restore eligibility, and audit refs.
- Restore dry-run must return compatibility, affected resources, destructive
  impact, blocked reasons, and audit preview.

Non-blocking DTO asks:

- Include human-readable runbook/doc links for incident, release, backup, and
  restore guidance if PM keeps admin training notes linked from the console.
- Include snapshot size and checksum/integrity metadata when available.

## FE5-008 Frontend API/DTO Field Review

The following P0 Frontend asks remain after reviewing the Backend planning
draft. Some are already partially covered in `docs/api/MVP5_API_CONTRACT_DRAFT.md`
and should be verified again against `openapi-mvp5-draft.json` when it exists.

Blocking asks for Backend draft:

- Return explicit permission summaries for every admin page or provide a
  reusable permission-check endpoint that includes denied/read-only reasons.
- Model role assignments as first-class resources with ids, scope, expiry,
  status, actor metadata, and audit refs.
- Separate credential create response raw secret from persistent masked
  credential DTOs. List/detail must never contain `raw_secret`.
- Include stable reason codes for permission denial, policy blocked rows,
  import/export conflicts, operation action blocks, deletion blocks, and
  restore blocks.
- Include audit event refs on role changes, credential changes, policy changes,
  import/export jobs, DLQ retry/ack actions, retention dry-runs, backup
  snapshots, and restore dry-runs.
- Include version context on policy evaluation, import/export, deletion
  dry-run, and restore dry-run so stale context can block mutation.
- Include action eligibility fields and blocked reasons for destructive or
  sensitive actions.
- Include redaction metadata for structured events and operations details.
- Provide deterministic seed examples for all P0 screens without raw secrets.
- Produce `docs/api/openapi-mvp5-draft.json` and ensure QA can parse it.
- Replace raw-secret-looking literals in examples with non-secret placeholders
  and verify generated fixtures/reports do not contain raw secrets.
- Add retry/ack eligibility and blocked reason fields to DLQ/job action rows.
- Echo evaluated permission context and explicit read-only/conditional decision
  metadata in permission checks.

Non-blocking asks for Backend draft:

- Provide display labels in addition to ids for principals, roles, resources,
  policy conditions, reason codes, and ontology package objects.
- Provide sample counts and grouped summaries for admin overview cards.
- Provide recommended next operator action where Backend can derive it from
  status without hiding raw evidence.
- Provide checksum/integrity hints for export packages and backup snapshots.
- Provide `request_id`, `correlation_id`, and `trace_id` consistently for
  operations, audit, and error responses.

Open questions for Backend and QA:

- Are organization-scoped credentials allowed to span multiple projects in
  P0, or should every credential be project-scoped for the thin slice?
- Does automatic approval `ENFORCE` perform approval only, publish enqueue, or
  policy evaluation with existing publish gates? Frontend should label the
  actual action precisely.
- Which policy blocked reason codes are canonical and which are non-blocking
  warnings?
- Are retention deletion and restore execution P0, or are dry-run and
  confirmation planning the only runnable P0 actions?
- What audit event URL pattern should Frontend use for deep links?
- What deterministic seed ids should QA expect for role assignment, masked
  credential, dry-run blocked candidates, import conflicts, DLQ rows, cost
  budget, retention dry-run, and backup snapshot?

## Wave24 Smoke-Testable Markers

Recommended stable markers for frontend implementation:

| Area | Marker | Expected proof |
|---|---|---|
| Admin shell | `data-testid="mvp5-admin-shell"` | Admin route renders with organization context. |
| Scope selector | `data-testid="mvp5-admin-scope-context"` | Organization and selected project are visible. |
| Permission denied | `data-testid="mvp5-permission-denied-state"` | Denied reason and required permission visible. |
| Read-only | `data-testid="mvp5-read-only-state"` | Mutating controls disabled with reason. |
| Role list | `data-testid="mvp5-role-assignment-table"` | Canonical roles and audit links visible. |
| Permission preview | `data-testid="mvp5-permission-preview"` | Allowed/denied decision and evaluated context visible. |
| Credential list | `data-testid="mvp5-credential-table"` | Masked secret values only. |
| Secret reveal | `data-testid="mvp5-secret-one-time-reveal"` | Raw secret appears only immediately after create in mock/seed flow. |
| Masked secret | `data-testid="mvp5-secret-masked-display"` | Future detail/list shows masked display only. |
| Revoke confirm | `data-testid="mvp5-credential-revoke-confirm"` | Credential revoke requires explicit confirmation and audit preview. |
| Policy editor | `data-testid="mvp5-policy-draft-editor"` | Draft fields render separately from active policy. |
| Policy diff | `data-testid="mvp5-policy-diff"` | Active versus draft policy visible. |
| Dry-run marker | `data-testid="mvp5-policy-dry-run-marker"` | Dry-run mode clearly labelled. |
| Enforce marker | `data-testid="mvp5-policy-enforce-marker"` | Enforce mode clearly labelled and confirmation gated. |
| Blocked rows | `data-testid="mvp5-policy-blocked-rows"` | Missing evidence/failed validation/version reasons visible. |
| Import/export | `data-testid="mvp5-import-export-panel"` | JSON package metadata and job status visible. |
| Import dry-run | `data-testid="mvp5-import-dry-run-result"` | Conflicts, warnings, destructive impact, compatibility visible. |
| Operations | `data-testid="mvp5-operations-dashboard"` | Job health, retry, DLQ, cost, observability panels visible. |
| DLQ action | `data-testid="mvp5-dlq-action-boundary"` | Retry/ack action boundaries and blocked reasons visible. |
| Structured event | `data-testid="mvp5-structured-event-detail"` | Event detail shows redaction and correlation metadata. |
| Retention | `data-testid="mvp5-retention-policy-table"` | Resource policies and audit links visible. |
| Deletion dry-run | `data-testid="mvp5-deletion-dry-run-impact"` | Affected counts and lineage/destructive impact visible. |
| Backup | `data-testid="mvp5-backup-snapshot-list"` | Snapshot status and restore eligibility visible. |
| Restore dry-run | `data-testid="mvp5-restore-dry-run-impact"` | Compatibility and destructive impact visible. |
| Audit link | `data-testid="mvp5-audit-link"` | Each sensitive action links to audit trail. |

Smoke constraints:

- Wave24 route smoke should verify that the admin shell renders in mock mode
  before actual API mode.
- Actual API smoke should verify masked secret behavior without printing a raw
  secret to stdout, screenshots, reports, or fixtures.
- Policy dry-run smoke should include at least one `WOULD_APPROVE`, one
  `BLOCKED`, and one `REQUIRES_MANUAL_REVIEW` row if Backend keeps these
  statuses.
- Import dry-run smoke should include at least one conflict, one warning, one
  compatibility status, and one destructive impact count.
- Operations smoke should include at least one healthy job, one retryable
  failure, one DLQ row, one cost budget status, and one metrics/tracing
  unavailable state.
- Retention/backup smoke should include at least one deletion dry-run with
  lineage impact and one restore dry-run with compatibility status.

## Frontend Implementation Guardrails For Later Waves

- Do not implement MVP5 runtime UI before Backend contract draft and QA INT5
  checklist are available.
- Keep admin detail routes contextual and avoid expanding the global LNB with
  ID-bound pages.
- Use existing React, TypeScript, Vite, styled-components, router, API client,
  mock, and hana adapter patterns when Wave24 implementation begins.
- Keep every admin screen permission-aware from the first implementation slice.
- Never introduce raw secret sample strings in frontend fixtures, tests,
  reports, screenshots, or console output.
