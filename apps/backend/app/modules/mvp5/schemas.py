from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class EnterpriseRole(str, Enum):
    ORGANIZATION_ADMIN = "ORGANIZATION_ADMIN"
    PROJECT_ADMIN = "PROJECT_ADMIN"
    ONTOLOGY_EDITOR = "ONTOLOGY_EDITOR"
    SOURCE_MANAGER = "SOURCE_MANAGER"
    REVIEWER = "REVIEWER"
    PUBLISHER = "PUBLISHER"
    ANALYST_VIEWER = "ANALYST_VIEWER"
    EXTERNAL_API_CONSUMER = "EXTERNAL_API_CONSUMER"
    SERVICE_ACCOUNT = "SERVICE_ACCOUNT"


class PrincipalType(str, Enum):
    HUMAN_USER = "HUMAN_USER"
    SERVICE_ACCOUNT = "SERVICE_ACCOUNT"
    API_KEY = "API_KEY"
    SYSTEM = "SYSTEM"


class AssignmentScopeType(str, Enum):
    ORGANIZATION = "ORGANIZATION"
    PROJECT = "PROJECT"
    ONTOLOGY_VERSION = "ONTOLOGY_VERSION"
    SOURCE = "SOURCE"
    PUBLISHED_GRAPH = "PUBLISHED_GRAPH"


class RoleAssignmentStatus(str, Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"
    PENDING = "PENDING"


class PermissionResourceType(str, Enum):
    ORGANIZATION = "ORGANIZATION"
    PROJECT = "PROJECT"
    ONTOLOGY_VERSION = "ONTOLOGY_VERSION"
    SOURCE = "SOURCE"
    CANDIDATE = "CANDIDATE"
    REVIEW_TASK = "REVIEW_TASK"
    PUBLISH_JOB = "PUBLISH_JOB"
    PUBLISHED_GRAPH = "PUBLISHED_GRAPH"
    POLICY = "POLICY"
    API_CREDENTIAL = "API_CREDENTIAL"
    IMPORT_JOB = "IMPORT_JOB"
    EXPORT_JOB = "EXPORT_JOB"
    OPERATION_EVENT = "OPERATION_EVENT"
    BACKUP_SNAPSHOT = "BACKUP_SNAPSHOT"
    RETENTION_POLICY = "RETENTION_POLICY"
    AUDIT_EVENT = "AUDIT_EVENT"


class PermissionAction(str, Enum):
    READ = "READ"
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    ASSIGN_ROLE = "ASSIGN_ROLE"
    PREVIEW_POLICY = "PREVIEW_POLICY"
    ENFORCE_POLICY = "ENFORCE_POLICY"
    APPROVE = "APPROVE"
    PUBLISH = "PUBLISH"
    IMPORT = "IMPORT"
    EXPORT = "EXPORT"
    RETRY_JOB = "RETRY_JOB"
    ACKNOWLEDGE_DLQ = "ACKNOWLEDGE_DLQ"
    REVOKE_CREDENTIAL = "REVOKE_CREDENTIAL"
    RESTORE_DRY_RUN = "RESTORE_DRY_RUN"


class PermissionDecision(str, Enum):
    ALLOW = "ALLOW"
    DENY = "DENY"
    CONDITIONAL = "CONDITIONAL"


class PermissionDenyReason(str, Enum):
    MISSING_ROLE = "MISSING_ROLE"
    SCOPE_MISMATCH = "SCOPE_MISMATCH"
    RESOURCE_STATE_BLOCKED = "RESOURCE_STATE_BLOCKED"
    VERSION_CONTEXT_REQUIRED = "VERSION_CONTEXT_REQUIRED"
    SENSITIVITY_RESTRICTED = "SENSITIVITY_RESTRICTED"
    ENVIRONMENT_RESTRICTED = "ENVIRONMENT_RESTRICTED"
    CREDENTIAL_REVOKED = "CREDENTIAL_REVOKED"
    POLICY_DISABLED = "POLICY_DISABLED"


class PolicyMode(str, Enum):
    DISABLED = "DISABLED"
    DRY_RUN = "DRY_RUN"
    ENFORCE = "ENFORCE"


class PolicyEvaluationStatus(str, Enum):
    WOULD_APPROVE = "WOULD_APPROVE"
    WOULD_ENQUEUE_PUBLISH = "WOULD_ENQUEUE_PUBLISH"
    BLOCKED = "BLOCKED"
    REQUIRES_MANUAL_REVIEW = "REQUIRES_MANUAL_REVIEW"
    SKIPPED = "SKIPPED"
    ERROR = "ERROR"


class PolicyBlockReason(str, Enum):
    MISSING_EVIDENCE = "MISSING_EVIDENCE"
    FAILED_VALIDATION = "FAILED_VALIDATION"
    WARNING_REQUIRES_REVIEWER_REASON = "WARNING_REQUIRES_REVIEWER_REASON"
    STALE_ONTOLOGY_VERSION = "STALE_ONTOLOGY_VERSION"
    CANDIDATE_STATUS_NOT_ELIGIBLE = "CANDIDATE_STATUS_NOT_ELIGIBLE"
    UNSAFE_RELATION_TYPE = "UNSAFE_RELATION_TYPE"
    CONFIDENCE_BELOW_THRESHOLD = "CONFIDENCE_BELOW_THRESHOLD"
    POLICY_MODE_DISABLED = "POLICY_MODE_DISABLED"
    PUBLISH_GATE_NOT_SATISFIED = "PUBLISH_GATE_NOT_SATISFIED"
    AUDIT_PREVIEW_REQUIRED = "AUDIT_PREVIEW_REQUIRED"


class CredentialKind(str, Enum):
    SERVICE_ACCOUNT = "SERVICE_ACCOUNT"
    API_KEY = "API_KEY"


class CredentialStatus(str, Enum):
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"
    PENDING = "PENDING"


class CredentialScope(str, Enum):
    EXTERNAL_READ = "EXTERNAL_READ"
    PROJECT_ADMIN_READ = "PROJECT_ADMIN_READ"
    QUALITY_READ = "QUALITY_READ"
    PUBLISHED_GRAPH_READ = "PUBLISHED_GRAPH_READ"
    RAG_READ = "RAG_READ"
    SEARCH_READ = "SEARCH_READ"
    IMPORT_EXPORT_MANAGE = "IMPORT_EXPORT_MANAGE"
    OPERATIONS_READ = "OPERATIONS_READ"


class GovernanceJobStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    BLOCKED = "BLOCKED"
    CANCELLED = "CANCELLED"


class ImportConflictType(str, Enum):
    NAME_COLLISION = "NAME_COLLISION"
    SCHEMA_VERSION_INCOMPATIBLE = "SCHEMA_VERSION_INCOMPATIBLE"
    DESTRUCTIVE_DELETE = "DESTRUCTIVE_DELETE"
    RELATION_RANGE_MISMATCH = "RELATION_RANGE_MISMATCH"
    PROPERTY_TYPE_MISMATCH = "PROPERTY_TYPE_MISMATCH"
    PUBLISHED_VERSION_CONFLICT = "PUBLISHED_VERSION_CONFLICT"


class ImportConflictSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    BLOCKING = "BLOCKING"


class ImportCompatibilityStatus(str, Enum):
    COMPATIBLE = "COMPATIBLE"
    WARNING = "WARNING"
    BLOCKED = "BLOCKED"


class OperationJobType(str, Enum):
    SOURCE_PARSE = "SOURCE_PARSE"
    EXTRACTION = "EXTRACTION"
    VALIDATION = "VALIDATION"
    PUBLISH = "PUBLISH"
    QUALITY_RECOMPUTE = "QUALITY_RECOMPUTE"
    IMPORT = "IMPORT"
    EXPORT = "EXPORT"
    POLICY_EVALUATION = "POLICY_EVALUATION"
    BACKUP = "BACKUP"
    RETENTION_DELETE = "RETENTION_DELETE"


class OperationJobStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    RETRYING = "RETRYING"
    DEAD_LETTERED = "DEAD_LETTERED"
    CANCELLED = "CANCELLED"


class OperationEventSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"
    SECURITY = "SECURITY"


class BudgetStatus(str, Enum):
    WITHIN_LIMIT = "WITHIN_LIMIT"
    NEAR_LIMIT = "NEAR_LIMIT"
    EXCEEDED = "EXCEEDED"
    DISABLED = "DISABLED"


class ObservabilityAvailabilityStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    PARTIAL = "PARTIAL"
    NOT_CONFIGURED = "NOT_CONFIGURED"
    UNAVAILABLE = "UNAVAILABLE"


class RetentionActionMode(str, Enum):
    READ_ONLY = "READ_ONLY"
    DRY_RUN = "DRY_RUN"
    CONFIRM_REQUIRED = "CONFIRM_REQUIRED"
    EXECUTE = "EXECUTE"


class RetentionResourceType(str, Enum):
    SOURCE = "SOURCE"
    EVIDENCE = "EVIDENCE"
    CANDIDATE = "CANDIDATE"
    AUDIT_EVENT = "AUDIT_EVENT"
    PUBLISHED_GRAPH_SNAPSHOT = "PUBLISHED_GRAPH_SNAPSHOT"
    OPERATION_EVENT = "OPERATION_EVENT"


class BackupStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    RUNNING = "RUNNING"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"
    RESTORE_DRY_RUN_AVAILABLE = "RESTORE_DRY_RUN_AVAILABLE"
    RESTORE_BLOCKED = "RESTORE_BLOCKED"


class AuditEventCategory(str, Enum):
    ROLE = "ROLE"
    CREDENTIAL = "CREDENTIAL"
    POLICY = "POLICY"
    IMPORT_EXPORT = "IMPORT_EXPORT"
    DLQ = "DLQ"
    RETENTION = "RETENTION"
    BACKUP = "BACKUP"
    DESTRUCTIVE_ACTION = "DESTRUCTIVE_ACTION"
    SECURITY = "SECURITY"


class AuditEventRef(BaseModel):
    audit_event_id: str
    category: AuditEventCategory
    created_at: datetime


class AuditPreview(BaseModel):
    category: AuditEventCategory
    actor_id: str
    reason_required: bool = True
    preview_event_id: str


class OrganizationAdminSummary(BaseModel):
    organization_id: str
    name: str
    admin_count: int
    project_count: int
    active_project_count: int
    auth_mode: str = "DEV_AUTH"
    audit_event_refs: list[AuditEventRef] = Field(default_factory=list)


class ProjectAdminSummary(BaseModel):
    project_id: str
    organization_id: str
    name: str
    status: str
    current_ontology_version_id: str
    current_published_graph_version_id: str
    role_assignment_count: int
    active_credential_count: int
    policy_mode: PolicyMode
    operations_health: str
    audit_event_refs: list[AuditEventRef] = Field(default_factory=list)


class MembershipMember(BaseModel):
    principal_id: str
    principal_type: PrincipalType
    display_name: str
    email: str | None = None
    roles: list[EnterpriseRole] = Field(default_factory=list)
    status: RoleAssignmentStatus = RoleAssignmentStatus.ACTIVE


class MembershipListResponse(BaseModel):
    organization_id: str | None = None
    project_id: str | None = None
    items: list[MembershipMember]


class RoleAssignment(BaseModel):
    id: str
    principal_id: str
    principal_type: PrincipalType
    role: EnterpriseRole
    scope_type: AssignmentScopeType
    scope_id: str
    status: RoleAssignmentStatus
    created_by: str
    created_at: datetime
    expires_at: datetime | None = None
    revoked_at: datetime | None = None
    audit_event_refs: list[AuditEventRef] = Field(default_factory=list)


class RoleAssignmentCreateRequest(BaseModel):
    principal_id: str
    principal_type: PrincipalType
    role: EnterpriseRole
    scope_type: AssignmentScopeType = AssignmentScopeType.PROJECT
    scope_id: str | None = None
    expires_at: datetime | None = None


class RoleAssignmentListResponse(BaseModel):
    project_id: str
    items: list[RoleAssignment]


class PermissionCheckRequest(BaseModel):
    principal_id: str
    principal_type: PrincipalType
    organization_id: str | None = None
    project_id: str | None = None
    resource_type: PermissionResourceType
    action: PermissionAction
    resource_state: str | None = None
    sensitivity: str | None = None
    environment: str = "local"
    version_context: dict[str, Any] = Field(default_factory=dict)


class PermissionCheckResponse(BaseModel):
    decision: PermissionDecision
    allowed: bool
    read_only: bool = False
    deny_reasons: list[PermissionDenyReason] = Field(default_factory=list)
    matched_roles: list[EnterpriseRole] = Field(default_factory=list)
    required_roles: list[EnterpriseRole] = Field(default_factory=list)
    evaluated_context: dict[str, Any] = Field(default_factory=dict)
    audit_preview: AuditPreview | None = None


class CredentialQuota(BaseModel):
    monthly_token_limit: int | None = None
    monthly_request_limit: int | None = None
    current_month_tokens: int = 0
    current_month_requests: int = 0


class CredentialRoleBinding(BaseModel):
    role: EnterpriseRole
    scope_type: AssignmentScopeType
    scope_id: str


class CredentialCreateRequest(BaseModel):
    name: str
    description: str | None = None
    scopes: list[CredentialScope]
    role_bindings: list[CredentialRoleBinding] = Field(default_factory=list)
    expires_at: datetime | None = None
    quota: CredentialQuota | None = None


class CredentialView(BaseModel):
    id: str
    project_id: str
    kind: CredentialKind
    name: str
    description: str | None = None
    status: CredentialStatus
    masked_secret: str
    scopes: list[CredentialScope]
    role_bindings: list[CredentialRoleBinding] = Field(default_factory=list)
    expires_at: datetime | None = None
    quota: CredentialQuota | None = None
    created_by: str
    created_at: datetime
    last_used_at: datetime | None = None
    revoked_at: datetime | None = None
    revoked_reason: str | None = None
    audit_event_refs: list[AuditEventRef] = Field(default_factory=list)


class CredentialCreateResponse(BaseModel):
    credential: CredentialView
    raw_secret: str
    reveal_expires_at: datetime
    one_time_warning: str
    audit_event_ref: AuditEventRef


class CredentialListResponse(BaseModel):
    project_id: str
    items: list[CredentialView]


class CredentialRevokeRequest(BaseModel):
    reason: str
    confirmation: str


class PolicyConditionSet(BaseModel):
    min_confidence: float = 0.82
    require_evidence: bool = True
    require_validation_pass: bool = True
    allow_warning_with_reviewer_reason: bool = True
    allowed_relation_types: list[str] = Field(default_factory=list)


class AutomaticApprovalPolicyDocument(BaseModel):
    id: str
    project_id: str
    name: str
    mode: PolicyMode
    version: int
    conditions: PolicyConditionSet
    updated_by: str
    updated_at: datetime
    audit_event_refs: list[AuditEventRef] = Field(default_factory=list)


class AutomaticApprovalPolicyListResponse(BaseModel):
    project_id: str
    items: list[AutomaticApprovalPolicyDocument]


class PolicyEvaluationRequest(BaseModel):
    candidate_ids: list[str] = Field(default_factory=list)
    include_blocked: bool = True
    dry_run: bool = True


class PolicyEvaluationRow(BaseModel):
    candidate_id: str
    status: PolicyEvaluationStatus
    blocked_reasons: list[PolicyBlockReason] = Field(default_factory=list)
    gate_status: dict[str, bool] = Field(default_factory=dict)
    audit_preview: AuditPreview | None = None


class PolicyEvaluationSummary(BaseModel):
    would_approve_count: int
    blocked_count: int
    manual_review_count: int
    evaluated_count: int


class PolicyEvaluationResponse(BaseModel):
    policy_id: str
    project_id: str
    mode: PolicyMode
    policy_version: int
    dry_run: bool
    summary: PolicyEvaluationSummary
    rows: list[PolicyEvaluationRow]
    audit_preview: AuditPreview


class PolicyDiffRequest(BaseModel):
    target_mode: PolicyMode
    reason: str


class PolicyDiffResponse(BaseModel):
    policy_id: str
    from_version: int
    to_version: int
    changed_fields: list[str]
    before: dict[str, Any]
    after: dict[str, Any]
    audit_preview: AuditPreview


class EnforcePreviewRequest(BaseModel):
    target_mode: PolicyMode
    reason: str
    confirmation: str


class EnforcePreviewResponse(BaseModel):
    policy_id: str
    target_mode: PolicyMode
    can_enforce: bool
    affected_count: int
    blocked_count: int
    blocked_reasons: list[PolicyBlockReason]
    required_confirmation: str
    audit_preview: AuditPreview


class OntologyPackageClass(BaseModel):
    stable_id: str
    name: str
    description: str | None = None


class OntologyPackageProperty(BaseModel):
    stable_id: str
    class_stable_id: str
    name: str
    data_type: str


class OntologyPackageRelation(BaseModel):
    stable_id: str
    name: str
    source_class_stable_id: str
    target_class_stable_id: str


class OntologyPackageCounts(BaseModel):
    classes: int
    properties: int
    relations: int


class OntologyPackagePayload(BaseModel):
    package_id: str
    schema_version: str
    project_id: str
    ontology_version_id: str
    published_graph_version_id: str | None = None
    generated_at: datetime
    classes: list[OntologyPackageClass] = Field(default_factory=list)
    properties: list[OntologyPackageProperty] = Field(default_factory=list)
    relations: list[OntologyPackageRelation] = Field(default_factory=list)
    compatibility_notes: list[str] = Field(default_factory=list)


class OntologyExportDownloadMetadata(BaseModel):
    download_url: str | None = None
    content_type: str = "application/json"
    checksum_sha256: str
    expires_at: datetime
    inline_package_available: bool = True


class OntologyExportResponse(BaseModel):
    package_id: str
    schema_version: str
    project_id: str
    ontology_version_id: str
    generated_at: datetime
    counts: OntologyPackageCounts
    compatibility_notes: list[str]
    package: OntologyPackagePayload
    download: OntologyExportDownloadMetadata
    audit_event_ref: AuditEventRef


class OntologyImportDryRunRequest(BaseModel):
    mode: Literal["DRY_RUN"] = "DRY_RUN"
    package: OntologyPackagePayload


class ImportDryRunSummary(BaseModel):
    create_count: int
    update_count: int
    delete_count: int
    no_op_count: int
    conflict_count: int
    warning_count: int
    destructive_impact_count: int


class ImportConflict(BaseModel):
    conflict_type: ImportConflictType
    severity: ImportConflictSeverity
    path: str
    message: str


class ImportWarning(BaseModel):
    severity: ImportConflictSeverity = ImportConflictSeverity.WARNING
    path: str
    message: str


class DestructiveImpactRow(BaseModel):
    resource_type: str
    resource_id: str
    action: str
    reason: str
    published_graph_refs_affected: int = 0


class OntologyImportDryRunResponse(BaseModel):
    job_id: str
    project_id: str
    dry_run: bool = True
    status: GovernanceJobStatus
    compatibility_status: ImportCompatibilityStatus
    package_id: str
    schema_version: str
    ontology_version_id: str
    parsed_at: datetime
    summary: ImportDryRunSummary
    conflicts: list[ImportConflict]
    warnings: list[ImportWarning]
    destructive_impacts: list[DestructiveImpactRow]
    rollback_guidance: list[str]
    confirmation_required: bool
    audit_preview: AuditPreview
    audit_event_ref: AuditEventRef


class OperationHealthSummary(BaseModel):
    job_type: OperationJobType
    queued_count: int = 0
    running_count: int = 0
    failed_count: int = 0
    dead_lettered_count: int = 0


class OperationJob(BaseModel):
    id: str
    project_id: str
    job_type: OperationJobType
    status: OperationJobStatus
    retry_count: int
    retry_eligible: bool
    last_error: str | None = None
    created_at: datetime
    updated_at: datetime
    audit_event_refs: list[AuditEventRef] = Field(default_factory=list)


class OperationActionResponse(BaseModel):
    id: str
    action: str
    eligible: bool
    status: str
    reason: str | None = None
    audit_event_ref: AuditEventRef


class DlqRow(BaseModel):
    id: str
    project_id: str
    job_id: str
    job_type: OperationJobType
    retry_eligible: bool
    acknowledge_eligible: bool
    redaction_applied: bool
    reason: str
    created_at: datetime
    audit_event_refs: list[AuditEventRef] = Field(default_factory=list)


class DlqListResponse(BaseModel):
    project_id: str
    items: list[DlqRow]


class CostBudgetSummary(BaseModel):
    project_id: str
    status: BudgetStatus
    monthly_budget_usd: float | None = None
    current_spend_usd: float = 0.0
    token_budget: int | None = None
    current_tokens: int = 0
    reset_at: datetime | None = None


class StructuredEvent(BaseModel):
    id: str
    project_id: str
    severity: OperationEventSeverity
    message: str
    redaction_applied: bool
    created_at: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)


class StructuredEventListResponse(BaseModel):
    project_id: str
    items: list[StructuredEvent]


class ObservabilityAvailability(BaseModel):
    project_id: str
    metrics: ObservabilityAvailabilityStatus
    tracing: ObservabilityAvailabilityStatus
    logging: ObservabilityAvailabilityStatus
    notes: list[str] = Field(default_factory=list)


class OperationsDashboardResponse(BaseModel):
    project_id: str
    health: list[OperationHealthSummary]
    jobs: list[OperationJob]
    dlq_rows: list[DlqRow]
    cost_budget: CostBudgetSummary
    observability: ObservabilityAvailability


class RetentionRule(BaseModel):
    resource_type: RetentionResourceType
    retention_days: int
    action_mode: RetentionActionMode
    legal_hold: bool = False


class RetentionPolicy(BaseModel):
    id: str
    project_id: str
    mode: RetentionActionMode
    rules: list[RetentionRule]
    updated_by: str
    updated_at: datetime
    audit_event_refs: list[AuditEventRef] = Field(default_factory=list)


class RetentionDeletionDryRunRequest(BaseModel):
    resource_type: RetentionResourceType
    resource_ids: list[str]
    reason: str


class RetentionLineageImpact(BaseModel):
    resource_id: str
    published_graph_version_ids: list[str] = Field(default_factory=list)
    candidate_ids: list[str] = Field(default_factory=list)
    evidence_ids: list[str] = Field(default_factory=list)
    blocked_by_lineage: bool = False


class RetentionDeletionImpactSummary(BaseModel):
    requested_count: int
    deletable_count: int
    blocked_count: int
    requires_confirmation: bool


class RetentionDeletionDryRunResponse(BaseModel):
    project_id: str
    mode: RetentionActionMode
    impact_summary: RetentionDeletionImpactSummary
    lineage_impacts: list[RetentionLineageImpact]
    audit_preview: AuditPreview


class BackupSnapshot(BaseModel):
    id: str
    project_id: str
    status: BackupStatus
    label: str
    created_at: datetime
    size_bytes: int
    restore_eligible: bool
    restore_block_reason: str | None = None
    audit_event_refs: list[AuditEventRef] = Field(default_factory=list)


class BackupSnapshotListResponse(BaseModel):
    project_id: str
    items: list[BackupSnapshot]


class RestoreDryRunResponse(BaseModel):
    snapshot_id: str
    project_id: str
    eligible: bool
    impacted_resources: dict[str, int]
    requires_confirmation: bool
    audit_preview: AuditPreview


class AuditEvent(BaseModel):
    id: str
    project_id: str | None = None
    organization_id: str | None = None
    category: AuditEventCategory
    actor_id: str
    action: str
    target_type: str
    target_id: str
    summary: str
    created_at: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)


class AuditEventListResponse(BaseModel):
    project_id: str | None = None
    organization_id: str | None = None
    items: list[AuditEvent]
