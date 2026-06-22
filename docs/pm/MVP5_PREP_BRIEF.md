# MVP 5 Prep Brief

Status: `FROZEN / WAVE 23 PM DECISION`
Date: 2026-06-19

MVP 5 turns the MVP 4 quality, graph, search, RAG, and external API surfaces
into an enterprise-governed operating workspace. It is not another search or
RAG demo. The P0 path is admin/operator centered: define who may do what,
manage safe machine access, preview and enforce automation policy, move
ontology packages safely, observe failed work, and prove governance decisions
through audit evidence.

## Goal

Make the platform operable inside an organization without weakening the core
product rules:

```text
Organization admin opens admin console
-> reviews project and role assignments
-> creates masked service account access
-> edits automatic approval policy in dry-run mode
-> imports or exports an ontology package
-> reviews operations, DLQ, cost, retention, and backup status
-> enforces a safe policy only when evidence, validation, version, and audit
   gates are satisfied
```

Candidate graph and published graph remain separated. Automatic policy may
evaluate candidates, but it cannot publish facts without evidence, validation
success, explicit policy decision context, version context, and audit records.

## Entry Criteria

- MVP 4 product P0 is closed with `INT4-001` through `INT4-008` PASS.
- MVP4 P1 follow-ups remain separated from MVP5 P0 unless explicitly promoted.
- Backend and Frontend do not implement runtime MVP5 code until this PM freeze,
  Backend contract draft, Frontend UX/field review, and QA `INT5-*` checklist
  exist.
- Production SSO/OIDC and production secret rotation are not assumed by default.
  Local dev auth can remain the runnable P0 auth mode.

## MVP5 P0 Demo Flow

The MVP5 demo must be operated from an admin/governance perspective:

1. Organization admin opens the admin console and selects an organization and
   project.
2. Admin reviews canonical roles and assigns a project role to a user or service
   account.
3. Admin creates an API key or service account credential, sees the raw secret
   only once, then sees only masked values and audit events.
4. Admin edits an automatic approval policy in `DRY_RUN`, runs policy preview
   against seeded candidates, and sees blocked rows with missing evidence,
   failed validation, stale ontology version, or missing reviewer pattern.
5. Admin switches the policy to `ENFORCE` only after reviewing a policy diff,
   destructive-operation confirmation, and audit preview.
6. Admin exports the current ontology package as JSON, then imports a JSON
   package in dry-run mode to see version compatibility, conflicts, warnings,
   and rollback guidance.
7. Admin opens operations view to inspect job health, retry counts, DLQ rows,
   cost budget status, structured event examples, and observability summary.
8. Admin reviews retention and backup governance status, including read-only
   policy settings, backup snapshot list, deletion dry-run impact, and audit
   trail links.

This flow should be seedable and smoke-testable in Wave24 without real SSO,
real secret vault integration, distributed infrastructure, or full RDF parser
fidelity.

## Wave23 PM Decision Freeze

| Area | Frozen decision |
|---|---|
| P0 product center | Admin/operator governance console, not search/RAG repetition. |
| Auth mode | Local development auth remains allowed for runnable P0 thin slices. Production SSO/OIDC is P1 contract/documentation unless later promoted. |
| Role model | P0 defines canonical roles and permission dimensions. Full custom policy language and delegated admin hierarchy are P1. |
| RBAC/ABAC | P0 supports role assignment, project/org scope, and attribute dimensions needed for policy checks. Full enterprise ABAC expression engine is P1. |
| API keys/service accounts | P0 supports local lifecycle contract: create, one-time secret reveal, masked list/detail, revoke, audit, optional scope/expiry/quota fields. Production secret storage, rotation, and vault/KMS integration are P1. |
| Automatic approval | P0 supports policy definition, dry-run preview, policy diff, and enforce mode gated by evidence, validation, version, and audit. Fully autonomous publish without review/audit gate is out of scope. |
| Ontology import/export | P0 runnable slice is JSON package import/export with dry-run compatibility check. RDF/Turtle/OWL/SHACL are P1 fidelity targets documented as compatibility boundaries. |
| Operations/observability | P0 shows local job status, retry, DLQ, cost budget, structured event examples, and metrics/tracing availability states. Full distributed observability stack is P1. |
| Backup/restore | P0 documents and surfaces backup snapshot metadata plus restore dry-run/eligibility. Full HA restore automation and cross-region backup are P1. |
| Retention/deletion | P0 defines project/source/evidence/audit retention policy, deletion dry-run impact, and destructive confirmation. Automated legal hold workflows are P1. |
| Query console | Full SPARQL/Cypher console is P1. P0 may link to published graph explorer or expose read-only query examples only. |
| Large graph performance | P0 keeps existing safe-too-large guardrails. Full progressive loading, virtualized mega graph, and server-side expansion tuning are P1 unless needed by P0 admin screens. |

## Canonical Roles

| Role | Purpose | Default scope |
|---|---|---|
| `ORGANIZATION_ADMIN` | Manage organization settings, users, project membership, global policy defaults, audit review, and governance settings. | Organization |
| `PROJECT_ADMIN` | Manage a project, member roles, project policies, imports/exports, and project operations. | Project |
| `ONTOLOGY_EDITOR` | Create and edit draft ontology classes, properties, relations, constraints, and versions. | Project / ontology version |
| `SOURCE_MANAGER` | Upload sources, manage parsing/profiling jobs, inspect source/evidence health, and request deletion dry-runs. | Project / source |
| `REVIEWER` | Review candidates, request changes, approve/reject, and provide evidence-backed decisions. | Project / review queue |
| `PUBLISHER` | Publish approved candidates and manage published graph versions under policy gates. | Project / published graph |
| `ANALYST_VIEWER` | Read published graph, quality, search, RAG, evidence, and non-sensitive operations summaries. | Project read |
| `EXTERNAL_API_CONSUMER` | Use scoped external API access through service accounts or API keys. | Project/API scope |
| `SERVICE_ACCOUNT` | Machine principal for external API and integration jobs, bound to scoped permissions and audit identity. | Project/API scope |

Role names above are canonical PM literals for Wave23 planning. Backend may
propose enum names if they preserve the same semantics and Frontend visible
labels remain clear.

## Permission Dimensions

P0 authorization checks should be expressible with these dimensions:

- principal type: human user, service account, API key.
- organization id and project id.
- role assignment and assignment status.
- resource type: organization, project, ontology version, source, candidate,
  review task, publish job, published graph, policy, API credential, import
  job, export job, operations event, backup snapshot, retention policy.
- action: read, create, update, delete, assign role, preview policy, enforce
  policy, approve, publish, import, export, retry job, move to DLQ, revoke
  credential, restore dry-run.
- data state: draft, candidate, approved, published, archived, deleted,
  dry-run, enforce.
- version context: ontology version, prompt version, model run, published graph
  version, policy version.
- sensitivity: secret, masked secret, evidence content, source content, audit
  event, cost data.
- environment: local/dev, staging-like, production.

## Security Invariants

- Development auth may remain for local MVP5 thin slices, but production
  SSO/OIDC is not implied by local demo success.
- Secrets are shown only at creation time, then masked. Raw secrets must not be
  logged, written to reports, included in fixtures, or displayed after initial
  reveal.
- API key and service account list/detail views use masked identifiers such as
  `sk_...abcd`, never full tokens.
- Policy changes create audit records with actor, timestamp, scope, before/after
  diff, reason, mode, and policy version.
- Automatic approval cannot publish candidate facts unless all gates pass:
  evidence present, validation pass or explicitly allowed warning policy,
  ontology version context, candidate status eligibility, policy version,
  auditable decision, and no failed validation.
- Dry-run policy evaluation is the default. Enforce mode requires explicit
  confirmation and policy diff review.
- Destructive operations require confirmation and impact preview: revoke
  credential, delete/retention action, restore, import overwrite, DLQ purge.
- Candidate graph and published graph separation remains mandatory. Admin
  automation cannot bypass review/publish lineage.
- Audit logs are append-only from the product perspective. P0 can mock storage,
  but API/DTO names must preserve the append-only contract.

## P0 Product Scope

### Admin Console and Governance Shell

P0 introduces a small admin console with organization/project context,
permission-aware states, and audit links. It should show:

- organization and project settings summary.
- role assignment list and edit workflow.
- policy summary and policy version status.
- API key/service account summary.
- operations health summary.
- retention and backup governance summary.

### RBAC/ABAC Policy Surface

P0 is role-based with explicit permission dimensions. Attribute checks are
limited to project, resource type, resource state, version context, principal
type, and sensitivity. A full customer-authored ABAC expression language is P1.

### API Keys and Service Accounts

P0 contract covers local lifecycle and security semantics:

- create service account or API key with name, scope, expiry, optional quota,
  and role binding.
- one-time raw secret reveal on creation.
- masked list/detail thereafter.
- revoke and disabled status.
- audit events for create/reveal/revoke/scope change.

### Automatic Approval Policy

P0 policy supports:

- policy modes: `DISABLED`, `DRY_RUN`, `ENFORCE`.
- conditions: candidate type, confidence threshold, validation outcome,
  evidence presence, repeated reviewer approval pattern, low-risk relation type,
  ontology version, source type.
- evaluation result: would approve, blocked, requires manual review, reason
  codes, affected candidates, and audit preview.
- enforce gate: only safe candidates may be approved/published according to
  existing review/publish rules and policy audit.

### Ontology Import/Export

P0 runnable format is JSON. Import runs through dry-run first:

- package metadata: package version, ontology version, project id, source,
  created by, created at.
- contents: classes, properties, relations, constraints, labels, version notes.
- dry-run result: create/update/delete counts, conflicts, warnings, incompatible
  schema version, and destructive impact.
- export result: downloadable JSON package metadata and audit event.

RDF/Turtle/OWL/SHACL are documented P1 compatibility targets. P0 should not
claim full semantic fidelity.

### Operations and Observability

P0 exposes local operational visibility:

- job health by type and status.
- retry count and last error.
- DLQ list/detail and retry or acknowledge action boundary.
- cost/token budget summary where data is available.
- structured event examples.
- metrics/tracing availability states.

Full distributed tracing backend, alert routing, worker autoscaling, and
production log aggregation are P1.

### Retention, Backup, and Governance

P0 defines policy and dry-run surfaces:

- retention policy read/update for sources, evidence, candidates, audit events,
  published graph snapshots, and operation events.
- deletion dry-run impact by resource type and graph lineage.
- backup snapshot list/status and restore dry-run eligibility.
- release, incident, and admin training notes linked from admin console or docs.

## P1 Exclusions and Rationale

| Exclusion | P1 reason |
|---|---|
| SSO/OIDC production integration | Requires provider setup, redirect/callback security, tenant mapping, and session hardening. P0 can define contract and dev-auth boundary first. |
| Production secret rotation and vault/KMS storage | Needs infrastructure and operational controls beyond a local contract-first slice. P0 freezes masked-secret semantics. |
| Full HA/distributed infrastructure | Requires multi-node deployment, failover, queue/storage topology, and runbooks. P0 focuses on observable local operations. |
| Full SPARQL/Cypher console | Broad query console creates injection, performance, and permission risks. P0 keeps published graph explorer/read-only examples. |
| Full RDF/OWL/SHACL fidelity | Standards fidelity needs parser/exporter conformance and semantic validation. P0 starts with JSON plus compatibility boundaries. |
| Full ABAC expression engine | Customer-authored rules require policy language, validation, simulation, and explainability. P0 uses fixed permission dimensions. |
| Autonomous approval without review/publish gates | Would violate evidence, validation, version, and audit invariants. P0 supports safe dry-run and gated enforce only. |
| Cross-region backup, automated restore, disaster recovery | Operationally large and risky. P0 surfaces snapshot metadata and restore dry-run eligibility. |
| Production observability stack and alerting | Requires deployed metrics/tracing/logging infrastructure. P0 shows structured summaries and availability states. |

## Backend Contract Questions for Wave23

- What endpoint group names best separate organization admin, project admin,
  role assignments, permission checks, policy documents, and audit events?
- Which enum literals should represent `PolicyMode`, `PolicyEvaluationStatus`,
  `PolicyBlockReason`, `CredentialStatus`, `PrincipalType`, `PermissionAction`,
  `ImportExportJobStatus`, `OperationEventSeverity`, `BackupStatus`, and
  `RetentionActionMode`?
- Should role assignment be modeled as a first-class resource with id, scope,
  actor, created_at, expires_at, and audit refs?
- How will service account credentials expose one-time raw secret and masked
  future views without ever returning the raw secret from list/detail?
- What deterministic seed should prove dry-run automatic approval blocks missing
  evidence, failed validation, stale ontology version, and unsafe relation type?
- Which automatic approval action is P0: approve only, publish, or approve plus
  enqueue publish? PM default is policy-gated approve/publish evaluation with
  explicit audit and no bypass of existing publish eligibility.
- What JSON import/export package schema version and dry-run conflict fields
  are needed for Frontend and QA?
- Which operations events are authoritative in P0: job table, retry/DLQ table,
  structured audit event, cost ledger, or derived summary?
- How should retention deletion dry-run report graph lineage impact without
  deleting candidate/published data during preview?
- What actual OpenAPI draft artifact path and critical comparison rules should
  QA use for MVP5?

## Frontend UX Questions for Wave23

- Where does the admin console live in navigation: global app shell,
  organization switcher, project settings, or a dedicated admin area?
- Which screens are organization-scoped versus project-scoped, and how should
  the selected project context be shown?
- How should permission denied, read-only, masked-secret, one-time reveal,
  revoked credential, and expired credential states look?
- What is the safest policy editing pattern: draft form, side-by-side diff,
  dry-run result table, then enforce confirmation?
- How should dry-run versus enforce states be visually distinct without relying
  only on color?
- What fields must be visible in automatic approval blocked rows so reviewers
  understand evidence, validation, version, and policy reasons?
- How should import/export dry-run conflicts, warnings, destructive impact, and
  compatibility status be grouped?
- What operations dashboard markers are smoke-testable in Wave24 for job health,
  DLQ, retry, cost, and observability availability?
- How should retention/delete/restore dry-run flows present destructive impact
  and confirmation without encouraging accidental execution?
- Which audit links should appear on role changes, credential changes, policy
  changes, imports/exports, retention actions, and DLQ actions?

## P0 Acceptance Criteria

- Admin can inspect organization/project governance state from an admin console.
- Canonical roles and permission dimensions are represented consistently in PM,
  Backend draft, Frontend requirements, and QA checklist.
- API key/service account flow proves one-time secret reveal, masked future
  display, revoke confirmation, and audit event expectations.
- Automatic approval policy supports dry-run preview and enforce mode with
  evidence, validation, version, candidate eligibility, and audit gates.
- JSON ontology export and import dry-run have package metadata, conflict
  reporting, destructive impact, and audit expectations.
- Operations view exposes job health, retry, DLQ, cost, and observability status
  in a seedable local way.
- Retention and backup governance expose policy, snapshot/status, deletion
  dry-run, restore dry-run, confirmation, and audit expectations.
- MVP1 through MVP4 demo flows remain protected by regression expectations.

## Wave23 Contract-First Scope

PM outputs for Wave23:

- `docs/pm/MVP5_PREP_BRIEF.md`
- `docs/backlog/MVP5_DRAFT_BACKLOG.md`
- `docs/adr/0008-mvp5-enterprise-governance-boundary.md`
- `docs/handoffs/wave-023/PM_REPORT.md`

Backend next scope:

- Draft additive MVP5 API/DTO/enum contract and OpenAPI planning artifact.
- Keep runtime implementation out of Wave23 unless commander explicitly
  reopens implementation.

Frontend next scope:

- Review IA, field needs, state model, permission UX, and smoke-testable markers
  against PM and Backend draft.

QA next scope:

- Create `INT5-*` acceptance checklist covering contract, auth matrix,
  security boundaries, admin UX, deterministic seed, and MVP1-MVP4 regression.
