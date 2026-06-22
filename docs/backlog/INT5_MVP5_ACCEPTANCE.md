# INT5 MVP 5 Acceptance Checklist

Status: `WAVE 23 CONTRACT-FIRST READY`
Date: 2026-06-19
Owner: QA / Integration

This checklist turns `INT5-001` through `INT5-010` into executable acceptance
criteria for Wave24+. Wave23 is contract-first planning only. Runtime endpoint,
frontend route, seed, and smoke validation remain `NOT RUNNABLE` until Wave24
implements the accepted thin slice.

## Scope and Source of Truth

Source documents:

- Agent rules: `AGENTS.md`
- Handoff process: `.agents/skills/handoff-reporting/SKILL.md`
- Current state: `docs/handoffs/CURRENT_STATE.md`
- Wave order: `docs/handoffs/wave-023/NEXT_ORDERS.md`
- PM freeze: `docs/handoffs/wave-023/PM_REPORT.md`
- Backend contract report: `docs/handoffs/wave-023/BACKEND_REPORT.md`
- Frontend UX report: `docs/handoffs/wave-023/FRONTEND_REPORT.md`
- MVP5 prep brief: `docs/pm/MVP5_PREP_BRIEF.md`
- MVP5 backlog: `docs/backlog/MVP5_DRAFT_BACKLOG.md`
- MVP5 boundary ADR: `docs/adr/0008-mvp5-enterprise-governance-boundary.md`
- Backend draft: `docs/api/MVP5_API_CONTRACT_DRAFT.md`
- Machine-readable draft: `docs/api/openapi-mvp5-draft.json`
- Frontend field/state review: `docs/pm/MVP5_FRONTEND_UX_REQUIREMENTS.md`
- Closed MVP4 baseline: `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
- Wave22 MVP4 closeout: `docs/handoffs/wave-022/QA_REPORT.md`

MVP5 P0 boundaries:

- P0 is an admin/operator governance control plane, not another search/RAG
  demo.
- Local dev auth remains allowed. Production SSO/OIDC is P1 unless PM promotes
  it later.
- API key/service account P0 covers local lifecycle, one-time secret reveal,
  masked list/detail, scope, expiry, quota, revoke, and audit. Production
  secret rotation and vault/KMS are P1.
- Automatic approval is dry-run-first and enforce-gated by evidence,
  validation, ontology/version context, candidate eligibility, policy version,
  and audit. Ungated autonomous publish is out of scope.
- Ontology import/export P0 is JSON with dry-run compatibility, conflicts,
  warnings, destructive impact, rollback guidance, and audit. Full
  RDF/Turtle/OWL/SHACL fidelity is P1.
- Operations P0 exposes local job health, retries, DLQ, cost budget,
  structured events, observability availability, and audit links.
- Retention/backup P0 exposes policy, deletion dry-run, backup snapshot
  metadata, restore dry-run eligibility, destructive confirmation, and audit.
- MVP1 through MVP4 flows remain regression-protected.

## Current QA Verdict

- Contract alignment: `PASS`
- OpenAPI draft parse/schema sanity: `PASS`
- Runtime acceptance: `NOT RUNNABLE`
- Wave24 entry recommendation: `PASS TO ENTER THIN IMPLEMENTATION`
- Required Wave24 Gate 0 cleanup: replace raw-secret-looking example literals
  in Backend draft/OpenAPI examples with non-secret placeholders before runtime
  fixtures, screenshots, or reports are generated.
- Blockers: none requiring another contract-hardening wave.

OpenAPI sanity checked in Wave23:

- `python3 -m json.tool docs/api/openapi-mvp5-draft.json` parses.
- Draft reports OpenAPI `3.1.0`, version `0.5.0-draft`, `43` paths, and `91`
  schemas.
- Critical endpoint families for admin summaries, role assignments,
  permission checks, credentials, automatic approval, import/export,
  operations/DLQ/cost, retention/backup, and audit/security events are present.

Security-sensitive example scan:

- `raw_secret` appears in the one-time credential create example only.
- List/detail examples use masked fields.
- Raw-secret-looking example literals remain in:
  - `docs/api/MVP5_API_CONTRACT_DRAFT.md`, one create-response example.
  - `docs/api/openapi-mvp5-draft.json`, `OneTimeSecretReveal` example.
- These are not treated as a Wave23 P0 blocker because they are confined to the
  one-time create-response contract and are not actual secrets. They are a
  Wave24 Gate 0 follow-up because such literals must not be copied into
  runtime fixtures, logs, screenshots, generated reports, or audit text.

## Verdict Semantics

Use these labels consistently for every `INT5-*` item:

- `PASS`: contract, seed expectation, runtime API behavior, frontend state, and
  regression assertions all match this checklist.
- `PARTIAL`: the surface exists and some checks pass, but a required seed,
  assertion, security state, UI state, or regression guard is missing.
- `FAIL`: behavior violates a P0 boundary, such as raw secret persistence,
  ungated automatic approval, missing audit for destructive actions, external
  write access, or regression of MVP1-MVP4 flows.
- `NOT RUNNABLE`: the required backend/frontend/runtime/seed/harness is absent
  or cannot start before assertions can execute.

## Deterministic MVP5 Seed Requirements

Wave24 runtime QA needs one fixed organization and project fixture, preferably
extending the MVP4 deterministic seed project, with these stable objects:

| Seed area | Required fixture data | Purpose |
|---|---|---|
| Admin scope | one organization, one active project, current ontology version, current published graph version, dev-auth actor context | verify admin shell, org/project summaries, context, and version markers |
| Principals and roles | organization admin, project admin, analyst viewer, service account principal, role assignments for allow, deny, conditional, read-only, expired/revoked | verify authorization matrix and denied/read-only UI |
| Permission checks | allow case, deny case, conditional/read-only case, denied revoke attempt, sensitivity-restricted case | verify evaluated context and reason codes |
| Credentials | one service account/API key create response with one-time secret, masked list/detail response, revoked credential, expired credential, quota-limited credential | verify one-time reveal, masking, revoke, expiry, quota, and audit |
| Automatic approval | one dry-run policy, one diff, one enforce-preview blocked by missing evidence, failed validation, stale ontology version, unsafe relation type, ineligible candidate, and audit gate | verify dry-run default and enforce gates |
| Import/export | one JSON export job with package metadata and download metadata; one JSON import dry-run with create/update/delete counts, conflict, warning, compatibility state, destructive impact, rollback guidance | verify JSON P0 package flow |
| Operations | healthy job, retrying job, failed job, DLQ row, retry/ack eligible row, retry/ack blocked row, structured event with redaction metadata | verify operations and action boundaries |
| Cost/observability | one near-limit budget, one disabled/unavailable budget, metrics available, tracing not configured, logging partial | verify cost and availability states |
| Retention/backup | retention policy, deletion dry-run blocked by published lineage, restore-eligible backup snapshot, restore-blocked snapshot | verify governance dry-runs and destructive impact |
| Audit/security events | role, credential, policy, import/export, DLQ, retention, backup, destructive confirmation, and security event rows | verify audit links and no raw secret audit text |
| MVP1-MVP4 regression | project, ontology/source preview, extraction/evidence, review/publish, quality/search/RAG, graph explorer, external read-only API fixtures | protect closed product flows |

Seed invariants:

- No seed fixture, smoke artifact, log, generated report, screenshot, audit text,
  or structured event may contain a raw-secret-looking literal except the
  one-time create response assertion path, and that value must not be printed.
- Candidate graph and published graph remain separated.
- Automatic approval seed rows must include blocked cases for evidence,
  validation, version, candidate eligibility, policy, and audit gates.
- External API examples remain read-only unless PM explicitly promotes a write
  scope in a later wave.
- Every destructive or sensitive action seed must expose impact preview,
  confirmation requirement, actor, reason, and audit preview/ref.

## Wave24 Runnable Acceptance Gates

Gate 0, contract cleanup:

- Replace raw-secret-looking example literals in Backend draft/OpenAPI examples
  with non-secret placeholders.
- Re-run JSON parse for `docs/api/openapi-mvp5-draft.json`.
- Verify `raw_secret` appears only in credential create response schema/example
  and never in list/detail/audit/event/report/fixture schemas.

Gate 1, backend thin runtime:

- Add deterministic MVP5 seed helper and focused tests for the selected thin
  slice.
- Export actual OpenAPI and compare critical MVP5 paths/schemas/enums against
  the accepted draft or document approved deviations.
- Implement only the accepted narrow endpoint families; do not broaden into
  production SSO/OIDC, vault/KMS, full ABAC language, full standards import, or
  external write APIs.

Gate 2, frontend mock-first route smoke:

- Render admin shell, scope context, role table, permission preview,
  credential table, policy dry-run, import/export panel, operations dashboard,
  retention/backup panels, and audit links using stable test markers.
- Verify loading, empty, error, permission denied, read-only, stale context,
  audit unavailable, masked secret, dry-run, enforce, and destructive
  confirmation states.

Gate 3, actual API smoke:

- Seed backend deterministically.
- Start backend and frontend in actual API mode.
- Verify masked secret behavior without printing the raw create secret.
- Verify automatic approval dry-run blocked rows and enforce-preview gate.
- Verify import/export, operations/DLQ/cost, retention/backup, and audit event
  surfaces.

Gate 4, regression:

- Run existing MVP1 source/ontology smoke where available.
- Run MVP2 extraction/evidence actual regression smoke.
- Run MVP3 review/publish/quality actual regression smoke.
- Run MVP4 quality/search/RAG/graph/external read-only actual regression smoke.
- Keep Docker/PostgreSQL Compose smoke as the existing P1 environment follow-up
  unless commander promotes it.

## INT5-001 MVP5 Contract Review

Contract readiness checks:

- `docs/api/openapi-mvp5-draft.json` parses with `python3 -m json.tool`.
- OpenAPI draft reports version, path count, and schema count in QA report.
- Endpoint families exist for admin organization/project summaries, settings,
  memberships, role assignments, permission checks, service accounts/API keys,
  automatic approval policy/evaluation/diff/enforce-preview, ontology
  import/export, operations/jobs/DLQ/cost/events/observability,
  retention/backup, and audit/security events.
- Critical schema groups exist for organization/project summaries,
  `RoleAssignment`, `PermissionCheckRequest`, `PermissionCheckResponse`,
  credential create/view/revoke, automatic approval policy/evaluation/diff,
  import/export jobs, operations dashboard/jobs/DLQ/cost/observability,
  retention/deletion dry-run, backup/restore dry-run, and audit events.
- PM P0/P1 boundaries, Backend draft, and Frontend UX requirements have no
  unresolved P0 contradiction.
- Backend and Frontend agree that Wave23 is planning-only and runtime
  implementation starts only after QA checklist and Wave24 order.

Runtime acceptance checks:

- Actual exported OpenAPI after implementation keeps accepted MVP5 critical
  paths/schemas/enums or records approved deviations.
- Existing MVP1-MVP4 paths remain compatible.
- Frontend types/client/mocks match the actual backend OpenAPI for the selected
  MVP5 thin slice.

Exit criterion:

- `PASS` when planning contract, actual OpenAPI, frontend types/mocks, and
  runtime smoke align.
- `PARTIAL` when planning contract is ready but one runtime/client/mock check
  is missing.
- `FAIL` when a P0 boundary is contradicted.
- `NOT RUNNABLE` until runtime endpoints/seed/client/harness exist.

## INT5-002 Authorization Matrix Review

Contract readiness checks:

- Canonical roles are represented consistently:
  `ORGANIZATION_ADMIN`, `PROJECT_ADMIN`, `ONTOLOGY_EDITOR`, `SOURCE_MANAGER`,
  `REVIEWER`, `PUBLISHER`, `ANALYST_VIEWER`, `EXTERNAL_API_CONSUMER`,
  `SERVICE_ACCOUNT`.
- Permission dimensions cover principal type, organization/project scope,
  role assignment status, resource type, action, data state, version context,
  sensitivity, and environment.
- `PermissionCheckResponse` returns decision, allowed/read-only or conditional
  semantics, deny reasons, matched/required roles, evaluated context, and audit
  preview/ref.
- Role assignments are first-class resources with stable id, scope, actor,
  status, expiry, revocation, and audit refs.
- Frontend requirements define permission denied and read-only states for each
  P0 admin page.

Runtime acceptance checks:

- Seeded permission checks include allow, deny, conditional/read-only, scope
  mismatch, sensitivity restricted, revoked credential, and environment
  restricted cases.
- UI renders denied reason, required permission, scope, actor/principal, and
  safe next action without inferring authorization from role name alone.
- Mutating controls are disabled or hidden in read-only states with reason
  tooltip/copy and audit/support link where available.

Exit criterion:

- `PASS` when matrix rows, API decisions, and UI denied/read-only states align.
- `PARTIAL` when role rows exist but evaluated context or UI denied states are
  incomplete.
- `FAIL` when unauthorized mutation is possible or permission is inferred only
  from visible role labels.
- `NOT RUNNABLE` until permission endpoints and UI states exist.

## INT5-003 API Key and Service Account Safety Checklist

Contract readiness checks:

- `raw_secret` appears only in credential create response.
- List/detail credential schemas use masked display only and do not expose
  `raw_secret`.
- Credential DTOs include kind, status, scopes, role bindings, expiry, quota,
  last used, revoked metadata, and audit refs.
- Revoke requires explicit reason/confirmation and returns final status plus
  audit ref.
- API key/service account scopes remain explicit and do not imply external
  write access.
- Docs/examples/fixtures/reports/log-like output use non-secret placeholders
  or masked examples only, except for the one-time create field contract.

Runtime acceptance checks:

- Create response contains a one-time secret field, but smoke tooling does not
  print its value.
- After create, list/detail/refresh/navigation show only masked value.
- Raw secret is absent from frontend state persistence, URL, local storage,
  session storage, console output, screenshots, test fixtures, smoke artifacts,
  backend logs, structured events, audit text, and handoff reports.
- Revoke confirmation shows credential name, scope, impact, reason, and audit
  preview/ref.
- Expired, revoked, disabled, and quota-exceeded credentials have distinct UI
  states and no reveal action.

Exit criterion:

- `PASS` when one-time reveal, masking, revoke, scope/expiry/quota, audit, and
  negative raw-secret assertions pass.
- `PARTIAL` when lifecycle works but negative artifact scan or one state is
  missing.
- `FAIL` when raw secret appears outside create response or mutation is
  unaudited.
- `NOT RUNNABLE` until credential endpoints, seed, and UI exist.

## INT5-004 Automatic Approval Policy Safety Checklist

Contract readiness checks:

- Default mode is `DISABLED` or `DRY_RUN`, never accidental `ENFORCE`.
- Policy modes are `DISABLED`, `DRY_RUN`, and `ENFORCE`.
- Dry-run evaluation returns policy version, candidate rows, decision status,
  blocked reason codes, gate status fields, and audit preview.
- Block reasons cover missing evidence, failed validation, warning requiring
  reviewer reason, stale ontology version, ineligible candidate status, unsafe
  relation type, confidence threshold, disabled policy, publish gate, and audit
  preview requirement.
- Enforce-preview requires policy diff, actor, reason, previous/target policy
  version, affected count, blocked count, gate status, confirmation, and audit.
- Automatic approval cannot bypass existing review/publish lineage or write
  candidate facts directly into the published graph.

Runtime acceptance checks:

- Dry-run includes at least one would-approve row, one blocked row, and one
  manual-review row when supported by Backend status semantics.
- Seeded blocked rows prove evidence, validation, version, candidate
  eligibility, policy, and audit gates.
- Enforce remains disabled when audit is unavailable, context is stale, or any
  required safety gate is missing.
- Enforce confirmation shows policy diff, counts, reason, audit preview, and
  destructive/sensitive impact.
- UI clearly distinguishes dry-run and enforce with text/icon/state, not color
  alone.

Exit criterion:

- `PASS` when dry-run, blocked reasons, enforce-preview, confirmation, and
  audit gates pass.
- `PARTIAL` when dry-run exists but one gate or UI state is missing.
- `FAIL` when policy can enforce/publish without required gates.
- `NOT RUNNABLE` until policy endpoints, seed, and UI exist.

## INT5-005 Ontology Import and Export Acceptance Checklist

Contract readiness checks:

- P0 format is JSON. RDF/Turtle/OWL/SHACL are compatibility/P1 targets only.
- Wave25 P0 export package metadata is frozen as: `package_id`,
  `schema_version`, `project_id`, `ontology_version_id`, class/property/relation
  counts, `generated_at`, compatibility notes, and audit ref. Existing package
  schema fields may include richer content summaries, but QA must be able to
  verify those exact metadata values.
- Export returns safe package readiness: ready/loading/error/empty states,
  package metadata, JSON format, download or inline package summary, expiry or
  checksum where available, and audit ref. Export packages must not include raw
  credential material.
- Wave25 P0 import is dry-run only. Upload/paste JSON package or deterministic
  request input is accepted; import apply, overwrite, publish, or graph mutation
  is out of Wave25 scope.
- Import dry-run returns package parse summary, compatibility status,
  create/update/delete/no-op counts, conflict rows, warning rows, destructive
  impact rows, rollback guidance, confirmation requirement, affected
  ontology/version context, and audit preview/ref.
- Conflict, warning, and destructive impact rows have stable ids, type/severity,
  blocking flag, path, message, local/package object refs where available, and
  affected lineage/version context where relevant.
- Import dry-run must not mutate project state, ontology versions, candidate
  graph, published graph, audit history beyond an explicit preview/ref, or
  package history. QA must compare before/after counts or stable snapshots.
- Compatibility status must distinguish compatible, warning-compatible,
  conflict-blocked, destructive-blocked, and invalid/incompatible schema
  package states.
- Import overwrite/destructive execution remains P1/future unless a later PM
  decision explicitly promotes a narrow safe mutation with dry-run, impact
  preview, confirmation, reason, and audit.

Runtime acceptance checks:

- Export job progresses through queued/running/succeeded or failed state and
  exposes safe download metadata.
- Import dry-run includes at least one blocking conflict, one warning, one
  invalid/incompatible package state, one destructive impact row, one no-op
  count, rollback guidance, confirmation requirement, and audit preview/ref.
- Incompatible schema/version blocks import.
- Candidate/published graph separation remains intact after any import preview;
  dry-run does not create, update, delete, or publish ontology objects.
- UI shows loading, empty, error, permission denied, read-only, export running,
  export ready/expired, metadata ready, dry-run compatible, dry-run warning,
  dry-run conflict, dry-run destructive, invalid package, dry-run running,
  audit link, rollback guidance, confirmation required, and compatibility
  blocked states.

Exit criterion:

- `PASS` when JSON package export/import dry-run is seedable, safe, auditable,
  visible, and proven non-mutating.
- `PARTIAL` when package flow exists but one required metadata,
  conflict/warning/destructive/invalid state, non-mutation proof, or UI state is
  missing.
- `FAIL` when import mutates project/ontology graph state, exposes raw
  credential material, bypasses dry-run/confirmation/audit semantics, or claims
  P1 standards fidelity as P0.
- `NOT RUNNABLE` until import/export endpoints, seed, and UI exist.

## INT5-006 Operations, DLQ, Cost, and Observability Checklist

Contract readiness checks:

- Operations dashboard distinguishes job health, retry backlog, DLQ count,
  cost budget, observability availability, and recent events.
- Operation jobs expose job type, status, attempts, max attempts, last error,
  next retry, timestamps, and audit refs.
- DLQ rows expose job id/type, failure code/message, redacted payload preview,
  retry count, retry eligibility, acknowledge eligibility, blocked reasons,
  event ref, and audit refs.
- Cost budget exposes budget status, period, currency, amount, spend/usage,
  token limit/usage, threshold, and unavailable/disabled states.
- Observability exposes metrics, tracing, logging, structured event
  availability, and links where available.
- Structured events identify redacted sensitive fields and must not reveal raw
  secrets or source content beyond permitted summaries.

Runtime acceptance checks:

- Seed includes healthy, retrying, failed, and dead-lettered jobs.
- Retry and acknowledge actions require eligibility, reason, confirmation, and
  audit preview/ref.
- UI supports partial panel failure without hiding other healthy panels.
- Metrics/tracing/logging unavailable states are explicit and not treated as
  zero data.
- Structured event detail includes correlation/request/trace ids when
  available and redaction metadata.

Exit criterion:

- `PASS` when jobs, retry, DLQ, cost, structured events, and observability
  states are seedable and visible.
- `PARTIAL` when dashboard exists but one action boundary or availability
  state is missing.
- `FAIL` when DLQ/retry actions mutate without confirmation/audit or sensitive
  payloads are exposed.
- `NOT RUNNABLE` until operations endpoints, seed, and UI exist.

## INT5-007 Retention and Backup Governance Checklist

Contract readiness checks:

- Retention policy covers sources, evidence, candidates, audit events,
  published graph snapshots, and operation events.
- Retention rules expose resource type, period, action mode, include-deleted
  flag, minimum audit retention, legal hold or managed-by/read-only state where
  available, update metadata, and audit refs.
- Deletion dry-run returns affected counts, graph lineage impact, irreversible
  impact, blocked reasons, confirmation text, and audit preview without
  deleting anything.
- Backup snapshots expose status, scope, created metadata, expiry, storage ref,
  contents summary, restore eligibility, compatibility, and audit refs.
- Restore dry-run returns compatibility, affected resources, destructive
  overwrite impact, blocked reasons, confirmation requirement, and audit
  preview.
- Execution of deletion or restore is not required for P0 unless PM/Backend
  explicitly promotes it after dry-run safety is implemented.

Runtime acceptance checks:

- Seed includes deletion dry-run blocked by published graph lineage.
- Seed includes one restore-eligible snapshot and one restore-blocked snapshot.
- UI shows policy read-only, deletion dry-run ready, deletion blocked, restore
  dry-run ready, restore blocked, destructive confirming, permission denied,
  read-only, and audit unavailable states.
- Audit events are retained or explicitly protected according to policy and are
  not silently deleted by retention preview.

Exit criterion:

- `PASS` when retention policy, deletion dry-run, backup snapshots, restore
  dry-run, confirmation, and audit expectations pass.
- `PARTIAL` when surfaces exist but lineage/restore/dry-run state is missing.
- `FAIL` when data is deleted/restored without dry-run, impact preview,
  confirmation, and audit.
- `NOT RUNNABLE` until retention/backup endpoints, seed, and UI exist.

## INT5-008 Frontend Admin UX State Checklist

Contract readiness checks:

- Admin IA has a stable top-level `/admin` area and contextual project admin
  routes without adding ID-bound detail pages to global LNB.
- Every P0 admin page defines loading, empty, error, permission denied,
  read-only, stale context, audit unavailable, and safe next action states.
- Credential UX defines one-time reveal, masked future display, revoke
  confirmation, expired/revoked/disabled/quota states, and audit links.
- Policy UX defines draft, dry-run required/running/complete/blocked, enforce
  ready/confirming/enforced, diff, blocked rows, and audit preview states.
- Import/export, operations, retention, and backup UX define destructive impact,
  confirmation, compatibility, partial unavailable, and audit states.
- Smoke-testable markers are documented for admin shell, scope context,
  permission denied, read-only, role table, permission preview, credential
  table, secret reveal, masked display, policy dry-run/enforce, blocked rows,
  import/export, operations, DLQ, structured events, retention, backup, restore
  dry-run, and audit links.

Runtime acceptance checks:

- Mock route smoke passes before actual API integration.
- Actual API smoke passes after deterministic seed.
- Critical states do not rely only on color and do not expose raw secrets in
  screenshots, reports, console output, or fixtures.
- Admin detail pages remain contextual and preserve organization/project/version
  context.

Exit criterion:

- `PASS` when all P0 admin screens render required states and markers in mock
  and actual API mode.
- `PARTIAL` when screens render but one safety state or marker is missing.
- `FAIL` when UI allows unsafe action, hides denied/read-only state, or exposes
  secret values.
- `NOT RUNNABLE` until frontend routes/mocks/client exist.

## INT5-009 MVP1-MVP4 Regression Guard Plan

Regression checks:

- MVP1: project creation, ontology draft class/property/relation authoring,
  graph view, source upload/preview, OpenAPI freshness where available.
- MVP2: source profile/parse, prompt/job lifecycle, extraction candidate and
  evidence browsing, retry/dedupe, invalid evidence fallback, selected-project
  navigation.
- MVP3: validation, review inbox/workbench, correction/audit, publish queue,
  current published graph, quality summary, candidate/published graph
  separation.
- MVP4: quality recomputation proof, search groups, vector/fallback state,
  RAG candidate exclusion/insufficient evidence, graph explorer safe-too-large,
  external read-only DEV_AUTH APIs.

Wave25 regression matrix:

- Backend must run MVP5 focused tests plus MVP4 and MVP3 focused regression
  tests. MVP1 and MVP2 backend checks should run when repository commands are
  available and cheap; otherwise QA records the unavailable command/path
  honestly.
- Frontend must run `npm run test`, `npm run build`, `npm run smoke:mvp5:mock`,
  and `npm run smoke:mvp5:actual` when Backend runtime is available.
- Frontend should run MVP3 and MVP4 actual smokes when the repo scripts and
  seed/runtime support exist. MVP1/MVP2 frontend smokes are run if available
  and cheap; missing historical harnesses are documented, not silently skipped.
- Docker/PostgreSQL Compose smoke remains a P1 environment follow-up unless a
  later commander order promotes it.
- No MVP5 admin credential, automation, import/export, or retention work may
  weaken candidate/published separation, evidence lineage, read-only external
  APIs, RAG candidate exclusion, or previous ontology/source/review/publish
  flows.

Wave24 baseline carried into Wave25:

- Existing backend focused tests for MVP3/MVP4 remain passing where touched.
- Existing frontend build/tests remain passing where touched.
- Existing actual smoke commands for MVP3 and MVP4 remain passing after MVP5
  routes are added.
- No MVP5 admin credential, automation, import/export, or retention work
  weakens candidate/published separation, evidence lineage, read-only external
  APIs, or RAG candidate exclusion.

Exit criterion:

- `PASS` when all selected closed-MVP regression smokes pass.
- `PARTIAL` when one non-blocking smoke is unavailable with an accepted
  environment/tooling exception.
- `FAIL` when a closed MVP P0 flow regresses.
- `NOT RUNNABLE` until the relevant smoke harness can start.

## INT5-010 Local Seed and Smoke Runnable Plan

Required Wave24 commands or equivalents:

- JSON parse for planning and actual OpenAPI artifacts.
- Backend deterministic MVP5 seed generation with output JSON.
- Backend focused tests for selected MVP5 endpoints plus MVP3/MVP4 regression
  tests where touched.
- Frontend mock route smoke for MVP5 admin routes.
- Frontend actual API smoke for MVP5 admin routes without printing raw secret
  values.
- Existing MVP3 actual smoke and MVP4 actual smoke after MVP5 changes.
- `git diff --check` for changed files plus whitespace check for new/untracked
  files.

Suggested Wave24 smoke sequence:

```text
seed_mvp5_demo
-> GET organization summary
-> POST permission check allow and deny cases
-> POST service account create and assert one-time raw_secret field without printing value
-> GET credential list/detail and assert masked_secret only
-> POST credential revoke preview/confirm and assert audit ref
-> POST automatic approval dry-run and assert blocked reasons
-> POST policy enforce-preview and assert gate failure plus audit preview
-> POST ontology export and GET status/download metadata
-> POST ontology import dry-run and assert conflict/warning/destructive impact
-> GET operations dashboard, DLQ row, cost budget, observability
-> POST DLQ retry/ack blocked or confirmed cases
-> POST retention deletion dry-run and backup restore dry-run
-> GET audit/security events and assert no raw secret text
-> run MVP1-MVP4 regression smoke commands
```

Exit criterion:

- `PASS` when deterministic seed, backend tests, frontend mock smoke, frontend
  actual smoke, OpenAPI compare, security scans, and MVP1-MVP4 regression
  guards pass.
- `PARTIAL` when thin slice works but one accepted non-critical state remains
  fixture-only or one environment exception is approved.
- `FAIL` when the smoke is nondeterministic, prints raw secrets, skips audit
  gates, or regresses closed MVP flows.
- `NOT RUNNABLE` until Wave24 implementation provides seed/runtime/harness.

## Recommendation

Wave24 should proceed with a thin implementation, not another contract
hardening wave. Start with:

- deterministic MVP5 seed and no-secret artifact scan;
- organization/project admin summary;
- permission check allow/deny/read-only cases;
- service account/API key one-time create plus masked list/detail/revoke;
- automatic approval dry-run and enforce-preview gate only;
- operations/DLQ/cost/observability summary;
- retention deletion dry-run and backup restore dry-run;
- mock-first frontend admin shell followed by actual API smoke;
- MVP1-MVP4 regression smoke preservation.

Do not promote production SSO/OIDC, vault/KMS, full ABAC expression language,
full RDF/OWL/SHACL fidelity, distributed observability, cross-region backup, or
external write APIs into Wave24 unless PM explicitly changes the scope.
