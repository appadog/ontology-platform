# MVP 5 API Contract Draft

Status: `WAVE 23 BACKEND CONTRACT DRAFT`
Date: 2026-06-19

This draft extends the closed MVP 4 contract with enterprise governance,
admin/operator control-plane APIs, RBAC/ABAC planning DTOs, local service
account/API key lifecycle semantics, automatic approval policy dry-runs,
JSON ontology import/export jobs, operations/DLQ/cost visibility, retention,
backup, and security/audit event extensions.

Canonical machine-readable draft: `docs/api/openapi-mvp5-draft.json`.

Wave23 is contract-first planning only. Runtime FastAPI endpoints, database
models, migrations, workers, and production identity integrations are not
implemented by this draft.

## Contract Principles

- MVP5 is additive. Existing MVP1 through MVP4 paths remain stable and are not
  renamed or removed.
- MVP4 external APIs remain read-only. MVP5 service accounts and API keys define
  credential lifecycle and scopes, but do not implicitly promote external write
  APIs or production auth.
- Candidate graph and published graph remain separated. Automatic approval can
  evaluate candidate/review/publish eligibility, but it cannot bypass evidence,
  validation, version context, review/publish lineage, or audit gates.
- Development auth may remain for local MVP5 thin slices. Production SSO/OIDC,
  vault/KMS, production secret rotation, and full custom ABAC expression
  language remain P1 unless PM promotes them later.
- Raw credential secrets are returned only once in create responses. List,
  detail, audit, fixture, report, log, and future views use masked values only.
- Destructive or governance-sensitive actions require preview data and audit
  context: credential revoke, role change, policy enforce, import overwrite,
  retry/DLQ action, retention deletion, and restore dry-run.
- DTO/schema names use PascalCase. JSON fields use snake_case. Enum literals use
  UPPER_SNAKE_CASE.

## Preserved MVP4 Boundary

MVP5 reuses these MVP4 rules without changing their contract:

- search, RAG, graph explorer, and external APIs are read-only with respect to
  graph data;
- RAG answer facts and citations exclude candidate graph facts;
- external read-only responses preserve published graph version context where
  graph facts are exposed;
- `ExternalApiAuthMode` remains `DEV_AUTH` for MVP4 surfaces until production
  auth is explicitly designed and implemented;
- API keys and service accounts in MVP5 grant scoped access to allowed read
  surfaces first. They do not create implicit graph mutation rights.

## Enum Contract

### Role and Principal Enums

`EnterpriseRole`

```text
ORGANIZATION_ADMIN
PROJECT_ADMIN
ONTOLOGY_EDITOR
SOURCE_MANAGER
REVIEWER
PUBLISHER
ANALYST_VIEWER
EXTERNAL_API_CONSUMER
SERVICE_ACCOUNT
```

`PrincipalType`

```text
HUMAN_USER
SERVICE_ACCOUNT
API_KEY
SYSTEM
```

`AssignmentScopeType`

```text
ORGANIZATION
PROJECT
ONTOLOGY_VERSION
SOURCE
PUBLISHED_GRAPH
```

`RoleAssignmentStatus`

```text
ACTIVE
EXPIRED
REVOKED
PENDING
```

### Permission and Policy Enums

`PermissionResourceType`

```text
ORGANIZATION
PROJECT
ONTOLOGY_VERSION
SOURCE
CANDIDATE
REVIEW_TASK
PUBLISH_JOB
PUBLISHED_GRAPH
POLICY
API_CREDENTIAL
IMPORT_JOB
EXPORT_JOB
OPERATION_EVENT
BACKUP_SNAPSHOT
RETENTION_POLICY
AUDIT_EVENT
```

`PermissionAction`

```text
READ
CREATE
UPDATE
DELETE
ASSIGN_ROLE
PREVIEW_POLICY
ENFORCE_POLICY
APPROVE
PUBLISH
IMPORT
EXPORT
RETRY_JOB
ACKNOWLEDGE_DLQ
REVOKE_CREDENTIAL
RESTORE_DRY_RUN
```

`PermissionDecision`

```text
ALLOW
DENY
CONDITIONAL
```

`PermissionDenyReason`

```text
MISSING_ROLE
SCOPE_MISMATCH
RESOURCE_STATE_BLOCKED
VERSION_CONTEXT_REQUIRED
SENSITIVITY_RESTRICTED
ENVIRONMENT_RESTRICTED
CREDENTIAL_REVOKED
POLICY_DISABLED
```

`PolicyMode`

```text
DISABLED
DRY_RUN
ENFORCE
```

`PolicyEvaluationStatus`

```text
WOULD_APPROVE
WOULD_ENQUEUE_PUBLISH
BLOCKED
REQUIRES_MANUAL_REVIEW
SKIPPED
ERROR
```

`PolicyBlockReason`

```text
MISSING_EVIDENCE
FAILED_VALIDATION
WARNING_REQUIRES_REVIEWER_REASON
STALE_ONTOLOGY_VERSION
CANDIDATE_STATUS_NOT_ELIGIBLE
UNSAFE_RELATION_TYPE
CONFIDENCE_BELOW_THRESHOLD
POLICY_MODE_DISABLED
PUBLISH_GATE_NOT_SATISFIED
AUDIT_PREVIEW_REQUIRED
```

### Credential Enums

`CredentialKind`

```text
SERVICE_ACCOUNT
API_KEY
```

`CredentialStatus`

```text
ACTIVE
DISABLED
EXPIRED
REVOKED
PENDING
```

`CredentialScope`

```text
EXTERNAL_READ
PROJECT_ADMIN_READ
QUALITY_READ
PUBLISHED_GRAPH_READ
RAG_READ
SEARCH_READ
IMPORT_EXPORT_MANAGE
OPERATIONS_READ
```

### Import, Export, Operations, Retention, and Backup Enums

`GovernanceJobStatus`

```text
QUEUED
RUNNING
SUCCEEDED
FAILED
BLOCKED
CANCELLED
```

`ImportConflictType`

```text
NAME_COLLISION
SCHEMA_VERSION_INCOMPATIBLE
DESTRUCTIVE_DELETE
RELATION_RANGE_MISMATCH
PROPERTY_TYPE_MISMATCH
PUBLISHED_VERSION_CONFLICT
```

`ImportConflictSeverity`

```text
INFO
WARNING
BLOCKING
```

`OperationJobType`

```text
SOURCE_PARSE
EXTRACTION
VALIDATION
PUBLISH
QUALITY_RECOMPUTE
IMPORT
EXPORT
POLICY_EVALUATION
BACKUP
RETENTION_DELETE
```

`OperationJobStatus`

```text
QUEUED
RUNNING
SUCCEEDED
FAILED
RETRYING
DEAD_LETTERED
CANCELLED
```

`OperationEventSeverity`

```text
INFO
WARNING
ERROR
CRITICAL
SECURITY
```

`BudgetStatus`

```text
WITHIN_LIMIT
NEAR_LIMIT
EXCEEDED
DISABLED
```

`ObservabilityAvailabilityStatus`

```text
AVAILABLE
PARTIAL
NOT_CONFIGURED
UNAVAILABLE
```

`RetentionActionMode`

```text
READ_ONLY
DRY_RUN
CONFIRM_REQUIRED
EXECUTE
```

`RetentionResourceType`

```text
SOURCE
EVIDENCE
CANDIDATE
AUDIT_EVENT
PUBLISHED_GRAPH_SNAPSHOT
OPERATION_EVENT
```

`BackupStatus`

```text
AVAILABLE
RUNNING
FAILED
EXPIRED
RESTORE_DRY_RUN_AVAILABLE
RESTORE_BLOCKED
```

`AuditEventCategory`

```text
ROLE
CREDENTIAL
POLICY
IMPORT_EXPORT
DLQ
RETENTION
BACKUP
DESTRUCTIVE_ACTION
SECURITY
```

## Endpoint Summary

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE5-001 | `GET` | `/api/v1/admin/organizations/{organization_id}/summary` | Organization admin summary |
| BE5-001 | `GET` | `/api/v1/admin/organizations/{organization_id}/settings` | Organization settings |
| BE5-001 | `PATCH` | `/api/v1/admin/organizations/{organization_id}/settings` | Update organization settings draft |
| BE5-001 | `GET` | `/api/v1/admin/organizations/{organization_id}/membership` | Organization membership list |
| BE5-001 | `GET` | `/api/v1/admin/projects/{project_id}/summary` | Project admin summary |
| BE5-001 | `GET` | `/api/v1/admin/projects/{project_id}/settings` | Project settings |
| BE5-001 | `PATCH` | `/api/v1/admin/projects/{project_id}/settings` | Update project settings draft |
| BE5-001 | `GET` | `/api/v1/admin/projects/{project_id}/membership` | Project membership list |
| BE5-002 | `GET` | `/api/v1/admin/projects/{project_id}/role-assignments` | List role assignments |
| BE5-002 | `POST` | `/api/v1/admin/projects/{project_id}/role-assignments` | Create role assignment |
| BE5-002 | `DELETE` | `/api/v1/admin/role-assignments/{assignment_id}` | Revoke role assignment |
| BE5-002 | `POST` | `/api/v1/admin/permission-checks` | Evaluate permission check |
| BE5-003 | `GET` | `/api/v1/admin/projects/{project_id}/service-accounts` | List service accounts |
| BE5-003 | `POST` | `/api/v1/admin/projects/{project_id}/service-accounts` | Create service account and one-time secret |
| BE5-003 | `GET` | `/api/v1/admin/service-accounts/{credential_id}` | Credential detail with masked secret |
| BE5-003 | `POST` | `/api/v1/admin/service-accounts/{credential_id}/revoke` | Revoke service account |
| BE5-003 | `GET` | `/api/v1/admin/projects/{project_id}/api-keys` | List API keys |
| BE5-003 | `POST` | `/api/v1/admin/projects/{project_id}/api-keys` | Create API key and one-time secret |
| BE5-003 | `GET` | `/api/v1/admin/api-keys/{credential_id}` | API key detail with masked secret |
| BE5-003 | `POST` | `/api/v1/admin/api-keys/{credential_id}/revoke` | Revoke API key |
| BE5-004 | `GET` | `/api/v1/admin/projects/{project_id}/automatic-approval-policies` | List policy documents |
| BE5-004 | `POST` | `/api/v1/admin/projects/{project_id}/automatic-approval-policies` | Create policy draft |
| BE5-004 | `GET` | `/api/v1/admin/automatic-approval-policies/{policy_id}` | Policy detail |
| BE5-004 | `POST` | `/api/v1/admin/automatic-approval-policies/{policy_id}/evaluate` | Dry-run policy evaluation |
| BE5-004 | `POST` | `/api/v1/admin/automatic-approval-policies/{policy_id}/diff` | Policy version diff |
| BE5-004 | `POST` | `/api/v1/admin/automatic-approval-policies/{policy_id}/enforce-preview` | Enforce gate and audit preview |
| BE5-005 | `GET` | `/api/v1/admin/projects/{project_id}/ontology-export` | Wave25 actual JSON export package metadata and inline package |
| BE5-005 | `POST` | `/api/v1/admin/projects/{project_id}/ontology-export` | Wave25 actual JSON export package creation/readiness |
| BE5-005 | `POST` | `/api/v1/admin/projects/{project_id}/ontology-import/dry-run` | Wave25 actual JSON import dry-run; no apply mutation |
| BE5-005 | `POST` | `/api/v1/admin/projects/{project_id}/ontology-exports` | Create JSON export job |
| BE5-005 | `GET` | `/api/v1/admin/ontology-exports/{job_id}` | Export job status |
| BE5-005 | `GET` | `/api/v1/admin/ontology-exports/{job_id}/download` | Export package download metadata |
| BE5-005 | `POST` | `/api/v1/admin/projects/{project_id}/ontology-imports` | Create JSON import dry-run job |
| BE5-005 | `GET` | `/api/v1/admin/ontology-imports/{job_id}` | Import job status and dry-run conflicts |
| BE5-006 | `GET` | `/api/v1/admin/projects/{project_id}/operations/dashboard` | Job/DLQ/cost dashboard |
| BE5-006 | `GET` | `/api/v1/admin/projects/{project_id}/operations/jobs` | List operation jobs |
| BE5-006 | `GET` | `/api/v1/admin/operations/jobs/{job_id}` | Operation job detail |
| BE5-006 | `POST` | `/api/v1/admin/operations/jobs/{job_id}/retry` | Retry job |
| BE5-006 | `GET` | `/api/v1/admin/projects/{project_id}/operations/dlq` | List DLQ rows |
| BE5-006 | `GET` | `/api/v1/admin/operations/dlq/{dlq_id}` | DLQ detail |
| BE5-006 | `POST` | `/api/v1/admin/operations/dlq/{dlq_id}/retry` | Retry DLQ item |
| BE5-006 | `POST` | `/api/v1/admin/operations/dlq/{dlq_id}/acknowledge` | Acknowledge DLQ item |
| BE5-006 | `GET` | `/api/v1/admin/projects/{project_id}/operations/cost-budget` | Cost budget summary |
| BE5-006 | `PATCH` | `/api/v1/admin/projects/{project_id}/operations/cost-budget` | Update budget draft |
| BE5-006 | `GET` | `/api/v1/admin/projects/{project_id}/operations/events` | Structured operation events |
| BE5-006 | `GET` | `/api/v1/admin/projects/{project_id}/operations/observability` | Metrics/tracing/logging availability |
| BE5-007 | `GET` | `/api/v1/admin/projects/{project_id}/retention-policy` | Retention policy |
| BE5-007 | `PATCH` | `/api/v1/admin/projects/{project_id}/retention-policy` | Update retention policy draft |
| BE5-007 | `POST` | `/api/v1/admin/projects/{project_id}/retention/deletion-dry-run` | Deletion dry-run impact |
| BE5-007 | `GET` | `/api/v1/admin/projects/{project_id}/backup-snapshots` | Backup snapshot list |
| BE5-007 | `GET` | `/api/v1/admin/backup-snapshots/{snapshot_id}` | Backup snapshot detail |
| BE5-007 | `POST` | `/api/v1/admin/backup-snapshots/{snapshot_id}/restore-dry-run` | Restore dry-run eligibility |
| BE5-008 | `GET` | `/api/v1/admin/projects/{project_id}/audit-events` | Project audit/security events |
| BE5-008 | `GET` | `/api/v1/admin/organizations/{organization_id}/security-events` | Organization security events |

## Admin Organization and Project DTOs

### OrganizationAdminSummary

```text
organization_id
organization_name
environment
auth_mode
project_count
active_member_count
service_account_count
policy_summary
operations_summary
retention_summary
backup_summary
latest_audit_events[]
```

`auth_mode` is `DEV_AUTH` for Wave24 local smoke unless production identity is
explicitly promoted.

### ProjectAdminSummary

```text
project_id
organization_id
project_name
selected_ontology_version_id
current_published_graph_version_id
member_count
role_assignment_count
credential_count
automatic_approval_policy_ref
operation_health
cost_budget
retention_policy_ref
backup_summary
latest_audit_events[]
```

### AdminMembershipMember

```text
principal_id
principal_type
display_name
email
service_account_name
assignment_status
roles[]
last_active_at
created_at
```

## RBAC and Permission DTOs

### RoleAssignment

```text
assignment_id
principal_id
principal_type
principal_display_name
scope_type
organization_id
project_id
resource_id
role
status
expires_at
created_by
created_at
revoked_at
audit_event_refs[]
```

Role assignment is a first-class resource. This keeps assignment, revocation,
expiry, audit, and future delegated admin workflows explicit.

### PermissionCheckRequest

```text
principal_id
principal_type
organization_id
project_id
resource_type
resource_id
action
data_state
version_context
sensitivity
environment
```

### PermissionCheckResponse

```text
decision
allowed
deny_reasons[]
matched_roles[]
required_roles[]
policy_version_id
audit_preview
```

## Service Account and API Key DTOs

### CredentialCreateRequest

```text
name
description
credential_kind
scopes[]
role_bindings[]
expires_at
quota
```

### CredentialCreateResponse

```text
credential
raw_secret
secret_reveal
audit_event_ref
```

`raw_secret` exists only in `CredentialCreateResponse`. It must never be present
in list, detail, audit, logs, fixtures, or reports. For example:

```json
{
  "credential": {
    "credential_id": "cred_demo_service_account",
    "credential_kind": "SERVICE_ACCOUNT",
    "name": "MVP5 Demo Export Bot",
    "status": "ACTIVE",
    "masked_secret": "MASKED_API_KEY_...9F2A",
    "scopes": ["EXTERNAL_READ", "PUBLISHED_GRAPH_READ", "OPERATIONS_READ"],
    "expires_at": "2026-07-19T00:00:00Z"
  },
  "raw_secret": "ONE_TIME_SECRET_PLACEHOLDER_NOT_A_REAL_SECRET",
  "secret_reveal": {
    "reveal_type": "ONE_TIME_CREATE_RESPONSE",
    "shown_at": "2026-06-19T09:00:00Z",
    "repeat_display_allowed": false
  },
  "audit_event_ref": {
    "audit_event_id": "audit_cred_create_001",
    "category": "CREDENTIAL"
  }
}
```

### CredentialView

```text
credential_id
credential_kind
project_id
name
description
status
masked_secret
scopes[]
role_bindings[]
quota
expires_at
created_by
created_at
last_used_at
revoked_at
audit_event_refs[]
```

`CredentialView` never contains `raw_secret`.

### CredentialRevokeRequest

```text
reason
confirmation_text
```

## Automatic Approval DTOs

### AutomaticApprovalPolicyDocument

```text
policy_id
project_id
name
mode
version
status
conditions
actions
created_by
created_at
updated_at
last_evaluated_at
audit_event_refs[]
```

P0 action semantics should be represented as policy-gated approve and/or
publish eligibility preview. Runtime implementation must still use existing
review/publish gates and must not directly write candidate facts into the
published graph.

### PolicyConditionSet

```text
candidate_types[]
min_confidence
allowed_validation_severities[]
require_evidence
require_current_ontology_version
allowed_source_types[]
low_risk_relation_types[]
reviewer_pattern
```

### PolicyEvaluationRequest

```text
mode
candidate_ids[]
ontology_version_id
published_graph_version_id
include_audit_preview
```

### PolicyEvaluationResponse

```text
policy_id
policy_version
mode
status
evaluated_at
summary
rows[]
audit_preview
```

Blocked automatic approval demo response:

```json
{
  "policy_id": "policy_auto_approval_demo",
  "policy_version": 3,
  "mode": "DRY_RUN",
  "status": "BLOCKED",
  "evaluated_at": "2026-06-19T09:10:00Z",
  "summary": {
    "evaluated_count": 4,
    "would_approve_count": 1,
    "blocked_count": 3,
    "requires_manual_review_count": 0
  },
  "rows": [
    {
      "candidate_id": "cand_missing_evidence",
      "candidate_type": "ENTITY",
      "status": "BLOCKED",
      "block_reasons": ["MISSING_EVIDENCE"],
      "evidence_count": 0,
      "validation_severity": "INFO",
      "ontology_version_id": "ov_current"
    },
    {
      "candidate_id": "cand_failed_validation",
      "candidate_type": "RELATION",
      "status": "BLOCKED",
      "block_reasons": ["FAILED_VALIDATION"],
      "evidence_count": 2,
      "validation_severity": "FAILED",
      "ontology_version_id": "ov_current"
    },
    {
      "candidate_id": "cand_stale_version",
      "candidate_type": "PROPERTY_VALUE",
      "status": "BLOCKED",
      "block_reasons": ["STALE_ONTOLOGY_VERSION"],
      "evidence_count": 1,
      "validation_severity": "INFO",
      "ontology_version_id": "ov_previous"
    }
  ],
  "audit_preview": {
    "category": "POLICY",
    "would_create_event": true,
    "reason_required": true
  }
}
```

### PolicyDiffResponse

```text
policy_id
from_version
to_version
mode_change
condition_changes[]
action_changes[]
destructive_or_sensitive_changes[]
audit_preview
```

### EnforcePreviewResponse

```text
policy_id
policy_version
requested_mode
gate_status
gate_reasons[]
requires_confirmation
audit_preview
affected_candidate_count
```

## Ontology Import and Export DTOs

### OntologyPackageMetadata

```text
package_id
package_schema_version
format
project_id
ontology_id
ontology_version_id
published_graph_version_id
created_by
created_at
contents_summary
```

P0 `format` is JSON. RDF, Turtle, OWL, and SHACL are P1 fidelity targets and
must be represented as unsupported or compatibility-only in P0.

### OntologyExportJob

```text
job_id
project_id
status
format
package_metadata
download_url
expires_at
created_by
created_at
completed_at
audit_event_ref
```

Wave25 actual export response uses the project-scoped path
`GET /api/v1/admin/projects/{project_id}/ontology-export` and returns:

```text
package_id
schema_version
project_id
ontology_version_id
generated_at
counts { classes, properties, relations }
compatibility_notes[]
package { package_id, schema_version, project_id, ontology_version_id, published_graph_version_id, generated_at, classes[], properties[], relations[], compatibility_notes[] }
download { download_url, content_type, checksum_sha256, expires_at, inline_package_available }
audit_event_ref
```

### OntologyImportDryRunJob

```text
job_id
project_id
status
format
package_metadata
summary
conflicts[]
warnings[]
destructive_impact
rollback_guidance
audit_event_ref
```

Wave25 actual import response uses
`POST /api/v1/admin/projects/{project_id}/ontology-import/dry-run`. The request
is dry-run only:

```text
mode = DRY_RUN
package = OntologyPackagePayload
```

The response returns:

```text
job_id
project_id
dry_run
status
compatibility_status
package_id
schema_version
ontology_version_id
parsed_at
summary { create_count, update_count, delete_count, no_op_count, conflict_count, warning_count, destructive_impact_count }
conflicts[]
warnings[]
destructive_impacts[]
rollback_guidance[]
confirmation_required
audit_preview
audit_event_ref
```

Import apply, overwrite, publish, candidate graph mutation, published graph
mutation, ontology version mutation, and package history mutation are out of
Wave25 P0 scope.

Import dry-run conflict demo response:

```json
{
  "job_id": "import_dry_run_001",
  "project_id": "mvp5-demo-project",
  "status": "BLOCKED",
  "format": "JSON",
  "package_metadata": {
    "package_schema_version": "ontology-package.v1",
    "ontology_version_id": "ov_import_candidate",
    "created_at": "2026-06-19T08:45:00Z"
  },
  "summary": {
    "create_count": 2,
    "update_count": 3,
    "delete_count": 1,
    "conflict_count": 2,
    "warning_count": 1
  },
  "conflicts": [
    {
      "conflict_type": "NAME_COLLISION",
      "severity": "BLOCKING",
      "path": "classes[Customer]",
      "message": "Class name already exists with a different stable identifier."
    },
    {
      "conflict_type": "DESTRUCTIVE_DELETE",
      "severity": "BLOCKING",
      "path": "relations[ownsAccount]",
      "message": "Package would remove a relation used by the current published graph."
    }
  ],
  "destructive_impact": {
    "would_delete_classes": 0,
    "would_delete_properties": 1,
    "would_delete_relations": 1,
    "published_graph_refs_affected": 4
  }
}
```

## Operations, DLQ, Cost, and Observability DTOs

### OperationsDashboardResponse

```text
project_id
generated_at
job_health
dlq_summary
cost_budget
observability
recent_events[]
```

### OperationJob

```text
job_id
project_id
job_type
status
attempt
max_attempts
last_error_code
last_error_message
created_at
started_at
completed_at
next_retry_at
audit_event_refs[]
```

### DlqRow

```text
dlq_id
job_id
project_id
job_type
failure_code
failure_message
payload_ref
redacted_payload_preview
retry_count
first_failed_at
last_failed_at
acknowledged_at
audit_event_refs[]
```

DLQ row demo response:

```json
{
  "dlq_id": "dlq_import_001",
  "job_id": "import_dry_run_001",
  "project_id": "mvp5-demo-project",
  "job_type": "IMPORT",
  "failure_code": "SCHEMA_VERSION_INCOMPATIBLE",
  "failure_message": "Package schema ontology-package.v9 is not supported by P0 importer.",
  "payload_ref": "minio://ops-payloads/import_dry_run_001.redacted.json",
  "redacted_payload_preview": {
    "package_schema_version": "ontology-package.v9",
    "raw_secret_present": false
  },
  "retry_count": 2,
  "audit_event_refs": [
    {
      "audit_event_id": "audit_dlq_001",
      "category": "DLQ"
    }
  ]
}
```

### CostBudgetSummary

```text
project_id
period_start
period_end
budget_status
currency
budget_amount
estimated_spend
token_limit
tokens_used
near_limit_threshold
last_updated_at
```

Cost budget demo response:

```json
{
  "project_id": "mvp5-demo-project",
  "budget_status": "NEAR_LIMIT",
  "currency": "USD",
  "budget_amount": 100.0,
  "estimated_spend": 82.4,
  "token_limit": 1000000,
  "tokens_used": 845120,
  "near_limit_threshold": 0.8
}
```

### ObservabilityAvailability

```text
metrics_status
tracing_status
logging_status
message
available_links[]
```

## Retention and Backup DTOs

### RetentionPolicy

```text
project_id
mode
rules[]
legal_hold_enabled
updated_by
updated_at
audit_event_refs[]
```

### RetentionRule

```text
resource_type
retention_days
action_mode
include_deleted
minimum_audit_retention_days
```

### RetentionDeletionDryRunResponse

```text
project_id
requested_resource_type
mode
generated_at
impact_summary
lineage_impact[]
requires_confirmation
confirmation_text
audit_preview
```

Retention deletion dry-run demo response:

```json
{
  "project_id": "mvp5-demo-project",
  "requested_resource_type": "SOURCE",
  "mode": "DRY_RUN",
  "impact_summary": {
    "source_count": 3,
    "evidence_count": 28,
    "candidate_count": 14,
    "published_graph_refs_affected": 5,
    "audit_events_retained": 41
  },
  "lineage_impact": [
    {
      "source_id": "source_old_csv",
      "evidence_count": 9,
      "candidate_count": 4,
      "published_graph_version_ids": ["pgv_current"],
      "blocked": true,
      "block_reason": "PUBLISHED_GRAPH_LINEAGE_REFERENCES_SOURCE"
    }
  ],
  "requires_confirmation": true,
  "confirmation_text": "DELETE SOURCE PREVIEW ONLY"
}
```

### BackupSnapshot

```text
snapshot_id
project_id
status
snapshot_type
created_at
expires_at
storage_ref
contents_summary
restore_eligibility
audit_event_refs[]
```

### RestoreDryRunResponse

```text
snapshot_id
project_id
eligible
status
block_reasons[]
restore_impact
requires_confirmation
audit_preview
```

## Audit and Security Event DTOs

### AuditEvent

```text
audit_event_id
organization_id
project_id
category
event_type
severity
actor
target
reason
before_ref
after_ref
diff_summary
request_id
created_at
```

Audit/security events are required for:

- role assignment create/update/revoke;
- credential create, one-time reveal, scope change, expiry, revoke;
- policy create/update/diff/dry-run/enforce-preview/enforce attempt;
- ontology import/export create/status/download and import conflict decisions;
- operation retry, DLQ retry, DLQ acknowledge, DLQ purge if later added;
- cost budget update;
- retention policy update and deletion dry-run/execute if later added;
- backup snapshot create/status and restore dry-run;
- destructive confirmation preview or execution.

Audit event text and diff summaries must not include raw credential secrets.

## Error and State Contract

Suggested MVP5 error/state codes:

```text
ADMIN_ORGANIZATION_NOT_FOUND
ADMIN_PROJECT_NOT_FOUND
ROLE_ASSIGNMENT_NOT_FOUND
PERMISSION_DENIED
PERMISSION_SCOPE_MISMATCH
CREDENTIAL_NOT_FOUND
CREDENTIAL_REVOKED
CREDENTIAL_SECRET_NOT_REPEATABLE
POLICY_NOT_FOUND
POLICY_EVALUATION_BLOCKED
POLICY_ENFORCE_GATE_FAILED
ONTOLOGY_PACKAGE_UNSUPPORTED_FORMAT
ONTOLOGY_PACKAGE_SCHEMA_UNSUPPORTED
ONTOLOGY_IMPORT_CONFLICT_BLOCKING
ONTOLOGY_EXPORT_NOT_READY
OPERATION_JOB_NOT_FOUND
DLQ_ITEM_NOT_FOUND
COST_BUDGET_NOT_CONFIGURED
OBSERVABILITY_NOT_CONFIGURED
RETENTION_POLICY_NOT_FOUND
RETENTION_DELETE_BLOCKED_BY_LINEAGE
BACKUP_SNAPSHOT_NOT_FOUND
RESTORE_DRY_RUN_BLOCKED
AUDIT_EVENT_NOT_FOUND
DEV_AUTH_REQUIRED
EXTERNAL_API_READ_ONLY
```

## Deterministic Seed and Smoke Expectations for Wave24

Wave24 should add a deterministic MVP5 seed/smoke helper only after this
contract is accepted by Frontend and QA. Seed data should include:

- one organization, one active project, one organization admin, one project
  admin, one analyst viewer, and one service account principal;
- role assignments covering `ALLOW`, `DENY`, and `CONDITIONAL` permission
  checks, including a denied revoke attempt and a read-only analyst view;
- one service account create fixture that returns `raw_secret` once, followed by
  list/detail fixtures that contain only `masked_secret`;
- one revoked credential and one expired credential for disabled-state UX;
- one automatic approval policy in `DRY_RUN`, one policy diff, and one
  enforce-preview response blocked by at least `MISSING_EVIDENCE`,
  `FAILED_VALIDATION`, `STALE_ONTOLOGY_VERSION`, and
  `UNSAFE_RELATION_TYPE`;
- one JSON ontology export job with download metadata;
- one JSON ontology import dry-run job with create/update/delete counts,
  blocking conflict, warning, destructive impact, and rollback guidance;
- operations rows for a healthy job, retrying job, failed job, and DLQ row;
- one cost budget in `NEAR_LIMIT` plus one project with budget disabled if QA
  needs empty-state coverage;
- observability states for metrics available, tracing not configured, and
  logging partial;
- one retention policy and deletion dry-run blocked by published graph lineage;
- at least two backup snapshots: one restore dry-run eligible and one blocked;
- audit/security events for role, credential, policy, import/export, DLQ,
  retention, backup, and destructive confirmation previews;
- MVP1 through MVP4 regression smoke fixtures remain available: project,
  ontology/source preview, extraction/evidence, review/publish, quality/search,
  RAG, graph explorer, and external read-only API examples.

Suggested Wave24 smoke sequence:

```text
seed_mvp5_demo
-> GET organization summary
-> POST permission check allow and deny cases
-> POST service account create and verify one-time raw_secret
-> GET credential detail and verify only masked_secret remains
-> POST automatic approval dry-run and verify blocked reasons
-> POST policy enforce-preview and verify gate failure/audit preview
-> POST ontology export and GET status/download metadata
-> POST ontology import dry-run and verify conflict/destructive impact
-> GET operations dashboard, DLQ row, cost budget, observability
-> POST retention deletion dry-run and backup restore dry-run
-> GET audit/security events
-> run MVP1-MVP4 regression smoke commands
```

## Non-Goals and P1 Exclusions

- Runtime implementation in Wave23.
- Production SSO/OIDC provider integration.
- Production secret rotation, vault/KMS, or emergency key rollover.
- Full customer-authored ABAC expression language.
- Full HA/distributed worker topology, alert routing, or production log stack.
- Full RDF/Turtle/OWL/SHACL parser/exporter fidelity.
- Full SPARQL/Cypher query console.
- Automatic approval that bypasses evidence, validation, version context,
  review/publish lineage, or audit.
- External production write APIs.
