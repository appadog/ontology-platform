from typing import Any

from fastapi import APIRouter, status

from app.modules.mvp5 import service
from app.modules.mvp5.schemas import (
    AuditEventListResponse,
    AutomaticApprovalPolicyDocument,
    AutomaticApprovalPolicyListResponse,
    BackupSnapshot,
    BackupSnapshotListResponse,
    CredentialCreateRequest,
    CredentialCreateResponse,
    CredentialKind,
    CredentialListResponse,
    CredentialRevokeRequest,
    CredentialView,
    DlqListResponse,
    DlqRow,
    EnforcePreviewRequest,
    EnforcePreviewResponse,
    MembershipListResponse,
    OperationActionResponse,
    OperationJob,
    OperationsDashboardResponse,
    OrganizationAdminSummary,
    OntologyExportResponse,
    OntologyImportDryRunRequest,
    OntologyImportDryRunResponse,
    PermissionCheckRequest,
    PermissionCheckResponse,
    PolicyDiffRequest,
    PolicyDiffResponse,
    PolicyEvaluationRequest,
    PolicyEvaluationResponse,
    ProjectAdminSummary,
    RestoreDryRunResponse,
    RetentionDeletionDryRunRequest,
    RetentionDeletionDryRunResponse,
    RetentionPolicy,
    RoleAssignment,
    RoleAssignmentCreateRequest,
    RoleAssignmentListResponse,
    StructuredEventListResponse,
    CostBudgetSummary,
    ObservabilityAvailability,
)

router = APIRouter(prefix="/admin", tags=["MVP5 Admin"])


@router.get(
    "/organizations/{organization_id}/summary",
    response_model=OrganizationAdminSummary,
    summary="Get MVP5 organization admin summary",
)
def get_organization_summary(organization_id: str) -> OrganizationAdminSummary:
    return service.organization_summary(organization_id)


@router.get(
    "/organizations/{organization_id}/membership",
    response_model=MembershipListResponse,
    summary="List MVP5 organization membership",
)
def get_organization_membership(organization_id: str) -> MembershipListResponse:
    return service.membership(organization_id=organization_id)


@router.get(
    "/projects/{project_id}/summary",
    response_model=ProjectAdminSummary,
    summary="Get MVP5 project admin summary",
)
def get_project_summary(project_id: str) -> ProjectAdminSummary:
    return service.project_summary(project_id)


@router.get(
    "/projects/{project_id}/membership",
    response_model=MembershipListResponse,
    summary="List MVP5 project membership",
)
def get_project_membership(project_id: str) -> MembershipListResponse:
    return service.membership(project_id=project_id)


@router.get(
    "/projects/{project_id}/ontology-export",
    response_model=OntologyExportResponse,
    summary="Get MVP5 project ontology JSON export package",
)
def get_ontology_export(project_id: str) -> OntologyExportResponse:
    return service.ontology_export(project_id)


@router.post(
    "/projects/{project_id}/ontology-export",
    response_model=OntologyExportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create MVP5 project ontology JSON export package",
)
def create_ontology_export(project_id: str) -> OntologyExportResponse:
    return service.ontology_export(project_id)


@router.post(
    "/projects/{project_id}/ontology-import/dry-run",
    response_model=OntologyImportDryRunResponse,
    summary="Run MVP5 ontology JSON import dry-run",
)
def run_ontology_import_dry_run(
    project_id: str, payload: OntologyImportDryRunRequest
) -> OntologyImportDryRunResponse:
    return service.ontology_import_dry_run(project_id, payload)


@router.post(
    "/projects/{project_id}/ontology-exports",
    response_model=OntologyExportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create MVP5 project ontology JSON export package",
)
def create_ontology_export_job(project_id: str) -> OntologyExportResponse:
    return service.ontology_export(project_id)


@router.post(
    "/projects/{project_id}/ontology-imports",
    response_model=OntologyImportDryRunResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create MVP5 ontology JSON import dry-run job",
)
def create_ontology_import_dry_run_job(
    project_id: str, payload: OntologyImportDryRunRequest
) -> OntologyImportDryRunResponse:
    return service.ontology_import_dry_run(project_id, payload)


@router.get(
    "/projects/{project_id}/role-assignments",
    response_model=RoleAssignmentListResponse,
    summary="List MVP5 role assignments",
)
def list_role_assignments(project_id: str) -> RoleAssignmentListResponse:
    return service.role_assignments(project_id)


@router.post(
    "/projects/{project_id}/role-assignments",
    response_model=RoleAssignment,
    status_code=status.HTTP_201_CREATED,
    summary="Create MVP5 role assignment preview",
)
def create_role_assignment(
    project_id: str, payload: RoleAssignmentCreateRequest
) -> RoleAssignment:
    return service.create_role_assignment(project_id, payload)


@router.post(
    "/permission-checks",
    response_model=PermissionCheckResponse,
    summary="Evaluate MVP5 permission check",
)
def check_permission(payload: PermissionCheckRequest) -> PermissionCheckResponse:
    return service.permission_check(payload)


@router.get(
    "/projects/{project_id}/service-accounts",
    response_model=CredentialListResponse,
    summary="List MVP5 service accounts",
)
def list_service_accounts(project_id: str) -> CredentialListResponse:
    return service.list_credentials(project_id, CredentialKind.SERVICE_ACCOUNT)


@router.post(
    "/projects/{project_id}/service-accounts",
    response_model=CredentialCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create MVP5 service account with one-time secret response",
)
def create_service_account(
    project_id: str, payload: CredentialCreateRequest
) -> CredentialCreateResponse:
    return service.create_credential(project_id, CredentialKind.SERVICE_ACCOUNT, payload)


@router.get(
    "/service-accounts/{credential_id}",
    response_model=CredentialView,
    summary="Get masked MVP5 service account detail",
)
def get_service_account(credential_id: str) -> CredentialView:
    return service.credential_or_404(credential_id, CredentialKind.SERVICE_ACCOUNT)


@router.post(
    "/service-accounts/{credential_id}/revoke",
    response_model=CredentialView,
    summary="Revoke MVP5 service account",
)
def revoke_service_account(
    credential_id: str, payload: CredentialRevokeRequest
) -> CredentialView:
    return service.revoke_credential(credential_id, CredentialKind.SERVICE_ACCOUNT, payload)


@router.get(
    "/projects/{project_id}/api-keys",
    response_model=CredentialListResponse,
    summary="List MVP5 API keys",
)
def list_api_keys(project_id: str) -> CredentialListResponse:
    return service.list_credentials(project_id, CredentialKind.API_KEY)


@router.post(
    "/projects/{project_id}/api-keys",
    response_model=CredentialCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create MVP5 API key with one-time secret response",
)
def create_api_key(project_id: str, payload: CredentialCreateRequest) -> CredentialCreateResponse:
    return service.create_credential(project_id, CredentialKind.API_KEY, payload)


@router.get(
    "/api-keys/{credential_id}",
    response_model=CredentialView,
    summary="Get masked MVP5 API key detail",
)
def get_api_key(credential_id: str) -> CredentialView:
    return service.credential_or_404(credential_id, CredentialKind.API_KEY)


@router.post(
    "/api-keys/{credential_id}/revoke",
    response_model=CredentialView,
    summary="Revoke MVP5 API key",
)
def revoke_api_key(credential_id: str, payload: CredentialRevokeRequest) -> CredentialView:
    return service.revoke_credential(credential_id, CredentialKind.API_KEY, payload)


@router.get(
    "/projects/{project_id}/automatic-approval-policies",
    response_model=AutomaticApprovalPolicyListResponse,
    summary="List MVP5 automatic approval policies",
)
def list_automatic_approval_policies(project_id: str) -> AutomaticApprovalPolicyListResponse:
    return service.policies(project_id)


@router.get(
    "/automatic-approval-policies/{policy_id}",
    response_model=AutomaticApprovalPolicyDocument,
    summary="Get MVP5 automatic approval policy",
)
def get_automatic_approval_policy(policy_id: str) -> AutomaticApprovalPolicyDocument:
    return service.policy_by_id(policy_id)


@router.post(
    "/automatic-approval-policies/{policy_id}/evaluate",
    response_model=PolicyEvaluationResponse,
    summary="Evaluate MVP5 automatic approval policy dry-run",
)
def evaluate_automatic_approval_policy(
    policy_id: str, payload: PolicyEvaluationRequest
) -> PolicyEvaluationResponse:
    return service.evaluate_policy(policy_id, payload)


@router.post(
    "/automatic-approval-policies/{policy_id}/diff",
    response_model=PolicyDiffResponse,
    summary="Preview MVP5 automatic approval policy diff",
)
def diff_automatic_approval_policy(
    policy_id: str, payload: PolicyDiffRequest
) -> PolicyDiffResponse:
    return service.policy_diff(policy_id, payload)


@router.post(
    "/automatic-approval-policies/{policy_id}/enforce-preview",
    response_model=EnforcePreviewResponse,
    summary="Preview gated MVP5 automatic approval enforce action",
)
def enforce_preview_automatic_approval_policy(
    policy_id: str, payload: EnforcePreviewRequest
) -> EnforcePreviewResponse:
    return service.enforce_preview(policy_id, payload)


@router.get(
    "/projects/{project_id}/operations/dashboard",
    response_model=OperationsDashboardResponse,
    summary="Get MVP5 operations dashboard",
)
def get_operations_dashboard(project_id: str) -> OperationsDashboardResponse:
    return service.operations_dashboard(project_id)


@router.get(
    "/projects/{project_id}/operations/jobs",
    response_model=list[OperationJob],
    summary="List MVP5 operation jobs",
)
def list_operation_jobs(project_id: str) -> list[OperationJob]:
    return service.operation_jobs(project_id)


@router.get(
    "/operations/jobs/{job_id}",
    response_model=OperationJob,
    summary="Get MVP5 operation job detail",
)
def get_operation_job(job_id: str) -> OperationJob:
    return service.operation_job_or_404(job_id)


@router.post(
    "/operations/jobs/{job_id}/retry",
    response_model=OperationActionResponse,
    summary="Preview MVP5 operation job retry eligibility",
)
def retry_operation_job(job_id: str) -> OperationActionResponse:
    return service.retry_operation_job(job_id)


@router.get(
    "/projects/{project_id}/operations/dlq",
    response_model=DlqListResponse,
    summary="List MVP5 DLQ rows",
)
def list_dlq_rows(project_id: str) -> DlqListResponse:
    return DlqListResponse(project_id=project_id, items=service.dlq_rows(project_id))


@router.get(
    "/operations/dlq/{dlq_id}",
    response_model=DlqRow,
    summary="Get MVP5 DLQ row detail",
)
def get_dlq_row(dlq_id: str) -> DlqRow:
    return service.dlq_row_or_404(dlq_id)


@router.post(
    "/operations/dlq/{dlq_id}/retry",
    response_model=OperationActionResponse,
    summary="Preview MVP5 DLQ retry eligibility",
)
def retry_dlq_row(dlq_id: str) -> OperationActionResponse:
    return service.dlq_action(dlq_id, "RETRY_DLQ")


@router.post(
    "/operations/dlq/{dlq_id}/acknowledge",
    response_model=OperationActionResponse,
    summary="Preview MVP5 DLQ acknowledge eligibility",
)
def acknowledge_dlq_row(dlq_id: str) -> OperationActionResponse:
    return service.dlq_action(dlq_id, "ACKNOWLEDGE_DLQ")


@router.get(
    "/projects/{project_id}/operations/cost-budget",
    response_model=CostBudgetSummary,
    summary="Get MVP5 cost budget",
)
def get_cost_budget(project_id: str) -> CostBudgetSummary:
    return service.cost_budget(project_id)


@router.get(
    "/projects/{project_id}/operations/events",
    response_model=StructuredEventListResponse,
    summary="List MVP5 structured operation events",
)
def list_structured_events(project_id: str) -> StructuredEventListResponse:
    return service.structured_events(project_id)


@router.get(
    "/projects/{project_id}/operations/observability",
    response_model=ObservabilityAvailability,
    summary="Get MVP5 observability availability",
)
def get_observability(project_id: str) -> ObservabilityAvailability:
    return service.observability(project_id)


@router.get(
    "/projects/{project_id}/retention-policy",
    response_model=RetentionPolicy,
    summary="Get MVP5 retention policy",
)
def get_retention_policy(project_id: str) -> RetentionPolicy:
    return service.retention_policy(project_id)


@router.post(
    "/projects/{project_id}/retention/deletion-dry-run",
    response_model=RetentionDeletionDryRunResponse,
    summary="Run MVP5 retention deletion dry-run",
)
def run_retention_deletion_dry_run(
    project_id: str, payload: RetentionDeletionDryRunRequest
) -> RetentionDeletionDryRunResponse:
    return service.retention_deletion_dry_run(project_id, payload)


@router.get(
    "/projects/{project_id}/backup-snapshots",
    response_model=BackupSnapshotListResponse,
    summary="List MVP5 backup snapshots",
)
def list_backup_snapshots(project_id: str) -> BackupSnapshotListResponse:
    return service.backup_snapshots(project_id)


@router.get(
    "/backup-snapshots/{snapshot_id}",
    response_model=BackupSnapshot,
    summary="Get MVP5 backup snapshot detail",
)
def get_backup_snapshot(snapshot_id: str) -> BackupSnapshot:
    return service.backup_snapshot_or_404(snapshot_id)


@router.post(
    "/backup-snapshots/{snapshot_id}/restore-dry-run",
    response_model=RestoreDryRunResponse,
    summary="Run MVP5 restore dry-run",
)
def run_restore_dry_run(snapshot_id: str, payload: dict[str, Any]) -> RestoreDryRunResponse:
    return service.restore_dry_run(snapshot_id, payload)


@router.get(
    "/projects/{project_id}/audit-events",
    response_model=AuditEventListResponse,
    summary="List MVP5 project audit events",
)
def list_audit_events(project_id: str) -> AuditEventListResponse:
    return service.audit_events(project_id)


@router.get(
    "/organizations/{organization_id}/security-events",
    response_model=AuditEventListResponse,
    summary="List MVP5 organization security events",
)
def list_security_events(organization_id: str) -> AuditEventListResponse:
    return service.security_events(organization_id)
