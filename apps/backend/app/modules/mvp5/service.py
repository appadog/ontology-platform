from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
from typing import Any

from app.core.errors import ApiException

from ._import_export import analyze_import_dry_run, build_current_ontology_package
from .schemas import (
    AssignmentScopeType,
    AuditEvent,
    AuditEventCategory,
    AuditEventListResponse,
    AuditEventRef,
    AuditPreview,
    AutomaticApprovalPolicyDocument,
    AutomaticApprovalPolicyListResponse,
    BackupSnapshot,
    BackupSnapshotListResponse,
    BackupStatus,
    BudgetStatus,
    CostBudgetSummary,
    CredentialCreateRequest,
    CredentialCreateResponse,
    CredentialKind,
    CredentialListResponse,
    CredentialQuota,
    CredentialRevokeRequest,
    CredentialScope,
    CredentialStatus,
    CredentialView,
    DlqRow,
    EnforcePreviewRequest,
    EnforcePreviewResponse,
    EnterpriseRole,
    MembershipListResponse,
    MembershipMember,
    ObservabilityAvailability,
    ObservabilityAvailabilityStatus,
    OperationActionResponse,
    OperationEventSeverity,
    OperationHealthSummary,
    OperationJob,
    OperationJobStatus,
    OperationJobType,
    OperationsDashboardResponse,
    OrganizationAdminSummary,
    OntologyExportDownloadMetadata,
    OntologyExportResponse,
    OntologyImportDryRunRequest,
    OntologyImportDryRunResponse,
    OntologyPackageCounts,
    OntologyPackagePayload,
    PermissionAction,
    PermissionCheckRequest,
    PermissionCheckResponse,
    PermissionDecision,
    PermissionDenyReason,
    PolicyBlockReason,
    PolicyConditionSet,
    PolicyDiffRequest,
    PolicyDiffResponse,
    PolicyEvaluationRequest,
    PolicyEvaluationResponse,
    PolicyEvaluationRow,
    PolicyEvaluationStatus,
    PolicyEvaluationSummary,
    PolicyMode,
    PrincipalType,
    ProjectAdminSummary,
    RestoreDryRunResponse,
    RetentionActionMode,
    RetentionDeletionDryRunRequest,
    RetentionDeletionDryRunResponse,
    RetentionDeletionImpactSummary,
    RetentionLineageImpact,
    RetentionPolicy,
    RetentionResourceType,
    RetentionRule,
    RoleAssignment,
    RoleAssignmentCreateRequest,
    RoleAssignmentListResponse,
    RoleAssignmentStatus,
    StructuredEvent,
    StructuredEventListResponse,
)

ORGANIZATION_ID = "org-corp-knowledge"
PROJECT_ID = "project-corp-knowledge"
NOW = datetime(2026, 6, 19, 9, 0, tzinfo=timezone.utc)
RAW_SECRET_PLACEHOLDER = "ONE_TIME_SECRET_PLACEHOLDER_NOT_A_REAL_SECRET"

_created_credentials: dict[str, CredentialView] = {}
_credential_counter = 0


def reset_runtime_state() -> None:
    global _credential_counter
    _created_credentials.clear()
    _credential_counter = 0


def audit_ref(category: AuditEventCategory, suffix: str) -> AuditEventRef:
    return AuditEventRef(
        audit_event_id=f"audit-mvp5-{suffix}",
        category=category,
        created_at=NOW,
    )


def audit_preview(category: AuditEventCategory, suffix: str) -> AuditPreview:
    return AuditPreview(
        category=category,
        actor_id="user-org-admin",
        reason_required=True,
        preview_event_id=f"audit-preview-mvp5-{suffix}",
    )


def organization_summary(organization_id: str) -> OrganizationAdminSummary:
    _ensure_organization(organization_id)
    return OrganizationAdminSummary(
        organization_id=organization_id,
        name="Corporate Knowledge Organization",
        admin_count=2,
        project_count=1,
        active_project_count=1,
        audit_event_refs=[audit_ref(AuditEventCategory.ROLE, "org-summary")],
    )


def project_summary(project_id: str) -> ProjectAdminSummary:
    _ensure_project(project_id)
    active_credentials = [
        credential
        for credential in credential_seed(project_id) + list(_created_credentials.values())
        if credential.project_id == project_id and credential.status == CredentialStatus.ACTIVE
    ]
    return ProjectAdminSummary(
        project_id=project_id,
        organization_id=ORGANIZATION_ID,
        name="Corporate Knowledge MVP5 Admin",
        status="ACTIVE",
        current_ontology_version_id="ontology-version-mvp5-current",
        current_published_graph_version_id="published-graph-version-mvp5-current",
        role_assignment_count=len(role_assignments(project_id).items),
        active_credential_count=len(active_credentials),
        policy_mode=PolicyMode.DRY_RUN,
        operations_health="DEGRADED_WITH_RETRYABLE_FAILURES",
        audit_event_refs=[audit_ref(AuditEventCategory.SECURITY, "project-summary")],
    )


def ontology_export(project_id: str) -> OntologyExportResponse:
    _ensure_project(project_id)
    package = current_ontology_package(project_id)
    package_json = json.dumps(
        package.model_dump(mode="json"),
        sort_keys=True,
        separators=(",", ":"),
    )
    return OntologyExportResponse(
        package_id=package.package_id,
        schema_version=package.schema_version,
        project_id=project_id,
        ontology_version_id=package.ontology_version_id,
        generated_at=package.generated_at,
        counts=OntologyPackageCounts(
            classes=len(package.classes),
            properties=len(package.properties),
            relations=len(package.relations),
        ),
        compatibility_notes=package.compatibility_notes,
        package=package,
        download=OntologyExportDownloadMetadata(
            download_url=f"local://mvp5/{project_id}/ontology-package.json",
            checksum_sha256=hashlib.sha256(package_json.encode("utf-8")).hexdigest(),
            expires_at=datetime(2026, 6, 20, 9, 0, tzinfo=timezone.utc),
        ),
        audit_event_ref=audit_ref(AuditEventCategory.IMPORT_EXPORT, "ontology-export"),
    )


def ontology_import_dry_run(
    project_id: str, payload: OntologyImportDryRunRequest
) -> OntologyImportDryRunResponse:
    _ensure_project(project_id)
    package = payload.package
    current = current_ontology_package(project_id)
    analysis = analyze_import_dry_run(project_id=project_id, current=current, package=package)

    rollback_guidance = [
        "Dry-run only: no project, ontology, candidate graph, published graph, or package history state was changed.",
        "To proceed in a future apply-capable wave, export the current package and require an audited confirmation.",
    ]
    return OntologyImportDryRunResponse(
        job_id=f"ontology-import-dry-run-{package.package_id}",
        project_id=project_id,
        status=analysis.status,
        compatibility_status=analysis.compatibility_status,
        package_id=package.package_id,
        schema_version=package.schema_version,
        ontology_version_id=package.ontology_version_id,
        parsed_at=NOW,
        summary=analysis.summary,
        conflicts=analysis.conflicts,
        warnings=analysis.warnings,
        destructive_impacts=analysis.destructive_impacts,
        rollback_guidance=rollback_guidance,
        confirmation_required=analysis.confirmation_required,
        audit_preview=audit_preview(AuditEventCategory.IMPORT_EXPORT, "ontology-import-dry-run"),
        audit_event_ref=audit_ref(AuditEventCategory.IMPORT_EXPORT, "ontology-import-dry-run"),
    )


def current_ontology_package(project_id: str) -> OntologyPackagePayload:
    _ensure_project(project_id)
    return build_current_ontology_package(project_id=project_id, generated_at=NOW)


def membership(organization_id: str | None = None, project_id: str | None = None) -> MembershipListResponse:
    if organization_id is not None:
        _ensure_organization(organization_id)
    if project_id is not None:
        _ensure_project(project_id)
    return MembershipListResponse(
        organization_id=organization_id,
        project_id=project_id,
        items=[
            MembershipMember(
                principal_id="user-org-admin",
                principal_type=PrincipalType.HUMAN_USER,
                display_name="Organization Admin",
                email="admin@example.test",
                roles=[EnterpriseRole.ORGANIZATION_ADMIN, EnterpriseRole.PROJECT_ADMIN],
            ),
            MembershipMember(
                principal_id="user-analyst-viewer",
                principal_type=PrincipalType.HUMAN_USER,
                display_name="Analyst Viewer",
                email="analyst@example.test",
                roles=[EnterpriseRole.ANALYST_VIEWER],
            ),
            MembershipMember(
                principal_id="svc-mvp5-readonly",
                principal_type=PrincipalType.SERVICE_ACCOUNT,
                display_name="MVP5 Read-only Service Account",
                roles=[EnterpriseRole.EXTERNAL_API_CONSUMER],
            ),
        ],
    )


def role_assignments(project_id: str) -> RoleAssignmentListResponse:
    _ensure_project(project_id)
    return RoleAssignmentListResponse(
        project_id=project_id,
        items=[
            RoleAssignment(
                id="role-assignment-org-admin",
                principal_id="user-org-admin",
                principal_type=PrincipalType.HUMAN_USER,
                role=EnterpriseRole.ORGANIZATION_ADMIN,
                scope_type=AssignmentScopeType.ORGANIZATION,
                scope_id=ORGANIZATION_ID,
                status=RoleAssignmentStatus.ACTIVE,
                created_by="system",
                created_at=NOW,
                audit_event_refs=[audit_ref(AuditEventCategory.ROLE, "role-org-admin")],
            ),
            RoleAssignment(
                id="role-assignment-project-admin",
                principal_id="user-project-admin",
                principal_type=PrincipalType.HUMAN_USER,
                role=EnterpriseRole.PROJECT_ADMIN,
                scope_type=AssignmentScopeType.PROJECT,
                scope_id=project_id,
                status=RoleAssignmentStatus.ACTIVE,
                created_by="user-org-admin",
                created_at=NOW,
                audit_event_refs=[audit_ref(AuditEventCategory.ROLE, "role-project-admin")],
            ),
            RoleAssignment(
                id="role-assignment-viewer-readonly",
                principal_id="user-analyst-viewer",
                principal_type=PrincipalType.HUMAN_USER,
                role=EnterpriseRole.ANALYST_VIEWER,
                scope_type=AssignmentScopeType.PROJECT,
                scope_id=project_id,
                status=RoleAssignmentStatus.ACTIVE,
                created_by="user-project-admin",
                created_at=NOW,
                audit_event_refs=[audit_ref(AuditEventCategory.ROLE, "role-viewer")],
            ),
            RoleAssignment(
                id="role-assignment-revoked-credential",
                principal_id="svc-revoked-reader",
                principal_type=PrincipalType.SERVICE_ACCOUNT,
                role=EnterpriseRole.EXTERNAL_API_CONSUMER,
                scope_type=AssignmentScopeType.PROJECT,
                scope_id=project_id,
                status=RoleAssignmentStatus.REVOKED,
                created_by="user-project-admin",
                created_at=NOW,
                revoked_at=NOW,
                audit_event_refs=[audit_ref(AuditEventCategory.ROLE, "role-revoked")],
            ),
        ],
    )


def create_role_assignment(
    project_id: str, payload: RoleAssignmentCreateRequest
) -> RoleAssignment:
    _ensure_project(project_id)
    return RoleAssignment(
        id=f"role-assignment-created-{payload.principal_id}",
        principal_id=payload.principal_id,
        principal_type=payload.principal_type,
        role=payload.role,
        scope_type=payload.scope_type,
        scope_id=payload.scope_id or project_id,
        status=RoleAssignmentStatus.ACTIVE,
        created_by="user-org-admin",
        created_at=NOW,
        expires_at=payload.expires_at,
        audit_event_refs=[audit_ref(AuditEventCategory.ROLE, "role-created")],
    )


def permission_check(payload: PermissionCheckRequest) -> PermissionCheckResponse:
    if payload.principal_id == "user-org-admin":
        return PermissionCheckResponse(
            decision=PermissionDecision.ALLOW,
            allowed=True,
            read_only=False,
            matched_roles=[EnterpriseRole.ORGANIZATION_ADMIN],
            required_roles=[EnterpriseRole.ORGANIZATION_ADMIN, EnterpriseRole.PROJECT_ADMIN],
            evaluated_context=_permission_context(payload),
            audit_preview=audit_preview(AuditEventCategory.SECURITY, "permission-allow"),
        )
    if payload.action == PermissionAction.READ and payload.principal_id == "user-analyst-viewer":
        return PermissionCheckResponse(
            decision=PermissionDecision.CONDITIONAL,
            allowed=True,
            read_only=True,
            matched_roles=[EnterpriseRole.ANALYST_VIEWER],
            required_roles=[EnterpriseRole.ANALYST_VIEWER],
            evaluated_context=_permission_context(payload) | {"condition": "READ_ONLY"},
            audit_preview=audit_preview(AuditEventCategory.SECURITY, "permission-readonly"),
        )

    deny_reasons = [PermissionDenyReason.MISSING_ROLE]
    if payload.sensitivity in {"secret", "masked_secret", "audit"}:
        deny_reasons.append(PermissionDenyReason.SENSITIVITY_RESTRICTED)
    if payload.principal_type != PrincipalType.HUMAN_USER:
        deny_reasons.append(PermissionDenyReason.CREDENTIAL_REVOKED)
    return PermissionCheckResponse(
        decision=PermissionDecision.DENY,
        allowed=False,
        deny_reasons=deny_reasons,
        matched_roles=[EnterpriseRole.ANALYST_VIEWER]
        if payload.principal_id == "user-analyst-viewer"
        else [],
        required_roles=[EnterpriseRole.PROJECT_ADMIN, EnterpriseRole.ORGANIZATION_ADMIN],
        evaluated_context=_permission_context(payload),
        audit_preview=audit_preview(AuditEventCategory.SECURITY, "permission-deny"),
    )


def credential_seed(project_id: str) -> list[CredentialView]:
    _ensure_project(project_id)
    return [
        CredentialView(
            id="cred-service-account-readonly",
            project_id=project_id,
            kind=CredentialKind.SERVICE_ACCOUNT,
            name="MVP5 read-only service account",
            description="Seeded masked service account.",
            status=CredentialStatus.ACTIVE,
            masked_secret="MASKED_SERVICE_ACCOUNT_...SVC1",
            scopes=[
                CredentialScope.EXTERNAL_READ,
                CredentialScope.QUALITY_READ,
                CredentialScope.OPERATIONS_READ,
            ],
            role_bindings=[],
            quota=CredentialQuota(monthly_token_limit=50000, monthly_request_limit=1000),
            created_by="user-org-admin",
            created_at=NOW,
            audit_event_refs=[audit_ref(AuditEventCategory.CREDENTIAL, "cred-seeded")],
        ),
        CredentialView(
            id="cred-api-key-revoked",
            project_id=project_id,
            kind=CredentialKind.API_KEY,
            name="Revoked API key",
            status=CredentialStatus.REVOKED,
            masked_secret="MASKED_API_KEY_...RVKD",
            scopes=[CredentialScope.EXTERNAL_READ],
            created_by="user-org-admin",
            created_at=NOW,
            revoked_at=NOW,
            revoked_reason="Seeded revoke state.",
            audit_event_refs=[audit_ref(AuditEventCategory.CREDENTIAL, "cred-revoked")],
        ),
    ]


def list_credentials(project_id: str, kind: CredentialKind) -> CredentialListResponse:
    items = [
        credential
        for credential in credential_seed(project_id) + list(_created_credentials.values())
        if credential.kind == kind and credential.project_id == project_id
    ]
    return CredentialListResponse(project_id=project_id, items=items)


def create_credential(
    project_id: str, kind: CredentialKind, payload: CredentialCreateRequest
) -> CredentialCreateResponse:
    global _credential_counter
    _ensure_project(project_id)
    _credential_counter += 1
    prefix = "service-account" if kind == CredentialKind.SERVICE_ACCOUNT else "api-key"
    suffix = f"{_credential_counter:03d}"
    credential = CredentialView(
        id=f"cred-{prefix}-created-{suffix}",
        project_id=project_id,
        kind=kind,
        name=payload.name,
        description=payload.description,
        status=CredentialStatus.ACTIVE,
        masked_secret=f"MASKED_{kind.value}_...{suffix}",
        scopes=payload.scopes,
        role_bindings=payload.role_bindings,
        expires_at=payload.expires_at,
        quota=payload.quota,
        created_by="user-org-admin",
        created_at=NOW,
        audit_event_refs=[audit_ref(AuditEventCategory.CREDENTIAL, f"cred-created-{suffix}")],
    )
    _created_credentials[credential.id] = credential
    return CredentialCreateResponse(
        credential=credential,
        raw_secret=RAW_SECRET_PLACEHOLDER,
        reveal_expires_at=NOW,
        one_time_warning="This value is shown once and is not persisted by the MVP5 thin runtime.",
        audit_event_ref=audit_ref(AuditEventCategory.CREDENTIAL, f"cred-create-response-{suffix}"),
    )


def credential_or_404(credential_id: str, kind: CredentialKind) -> CredentialView:
    for credential in credential_seed(PROJECT_ID) + list(_created_credentials.values()):
        if credential.id == credential_id and credential.kind == kind:
            return credential
    raise ApiException(
        status_code=404,
        code="CREDENTIAL_NOT_FOUND",
        message="Credential was not found.",
        details={"credential_id": credential_id},
    )


def revoke_credential(
    credential_id: str, kind: CredentialKind, payload: CredentialRevokeRequest
) -> CredentialView:
    credential = credential_or_404(credential_id, kind)
    revoked = credential.model_copy(
        update={
            "status": CredentialStatus.REVOKED,
            "revoked_at": NOW,
            "revoked_reason": payload.reason,
            "audit_event_refs": [
                *credential.audit_event_refs,
                audit_ref(AuditEventCategory.CREDENTIAL, f"cred-revoke-{credential_id}"),
            ],
        }
    )
    if credential_id in _created_credentials:
        _created_credentials[credential_id] = revoked
    return revoked


def policies(project_id: str) -> AutomaticApprovalPolicyListResponse:
    return AutomaticApprovalPolicyListResponse(project_id=project_id, items=[policy(project_id)])


def policy(project_id: str, policy_id: str = "policy-auto-approval-mvp5") -> AutomaticApprovalPolicyDocument:
    _ensure_project(project_id)
    return AutomaticApprovalPolicyDocument(
        id=policy_id,
        project_id=project_id,
        name="MVP5 dry-run automatic approval policy",
        mode=PolicyMode.DRY_RUN,
        version=3,
        conditions=PolicyConditionSet(
            min_confidence=0.86,
            allowed_relation_types=["BELONGS_TO", "LOCATED_IN"],
        ),
        updated_by="user-org-admin",
        updated_at=NOW,
        audit_event_refs=[audit_ref(AuditEventCategory.POLICY, "policy-current")],
    )


def policy_by_id(policy_id: str) -> AutomaticApprovalPolicyDocument:
    if policy_id != "policy-auto-approval-mvp5":
        raise ApiException(
            status_code=404,
            code="POLICY_NOT_FOUND",
            message="Automatic approval policy was not found.",
            details={"policy_id": policy_id},
        )
    return policy(PROJECT_ID, policy_id)


def evaluate_policy(
    policy_id: str, payload: PolicyEvaluationRequest
) -> PolicyEvaluationResponse:
    document = policy_by_id(policy_id)
    rows = [
        PolicyEvaluationRow(
            candidate_id="candidate-clean-approved",
            status=PolicyEvaluationStatus.WOULD_APPROVE,
            gate_status={
                "evidence": True,
                "validation": True,
                "version": True,
                "policy": True,
                "audit": True,
            },
            audit_preview=audit_preview(AuditEventCategory.POLICY, "policy-row-approve"),
        ),
        PolicyEvaluationRow(
            candidate_id="candidate-missing-evidence",
            status=PolicyEvaluationStatus.BLOCKED,
            blocked_reasons=[PolicyBlockReason.MISSING_EVIDENCE],
            gate_status={"evidence": False, "validation": True, "version": True},
        ),
        PolicyEvaluationRow(
            candidate_id="candidate-failed-validation",
            status=PolicyEvaluationStatus.BLOCKED,
            blocked_reasons=[PolicyBlockReason.FAILED_VALIDATION],
            gate_status={"evidence": True, "validation": False, "version": True},
        ),
        PolicyEvaluationRow(
            candidate_id="candidate-stale-version",
            status=PolicyEvaluationStatus.BLOCKED,
            blocked_reasons=[PolicyBlockReason.STALE_ONTOLOGY_VERSION],
            gate_status={"evidence": True, "validation": True, "version": False},
        ),
        PolicyEvaluationRow(
            candidate_id="candidate-ineligible-policy-audit",
            status=PolicyEvaluationStatus.BLOCKED,
            blocked_reasons=[
                PolicyBlockReason.CANDIDATE_STATUS_NOT_ELIGIBLE,
                PolicyBlockReason.POLICY_MODE_DISABLED,
                PolicyBlockReason.AUDIT_PREVIEW_REQUIRED,
            ],
            gate_status={"policy": False, "audit": False},
        ),
        PolicyEvaluationRow(
            candidate_id="candidate-manual-review",
            status=PolicyEvaluationStatus.REQUIRES_MANUAL_REVIEW,
            blocked_reasons=[PolicyBlockReason.WARNING_REQUIRES_REVIEWER_REASON],
            gate_status={"validation": True, "reviewer_reason": False},
        ),
    ]
    if payload.candidate_ids:
        rows = [row for row in rows if row.candidate_id in set(payload.candidate_ids)]
    if not payload.include_blocked:
        rows = [row for row in rows if row.status != PolicyEvaluationStatus.BLOCKED]
    return PolicyEvaluationResponse(
        policy_id=document.id,
        project_id=document.project_id,
        mode=document.mode,
        policy_version=document.version,
        dry_run=payload.dry_run,
        summary=PolicyEvaluationSummary(
            would_approve_count=sum(1 for row in rows if row.status == PolicyEvaluationStatus.WOULD_APPROVE),
            blocked_count=sum(1 for row in rows if row.status == PolicyEvaluationStatus.BLOCKED),
            manual_review_count=sum(
                1 for row in rows if row.status == PolicyEvaluationStatus.REQUIRES_MANUAL_REVIEW
            ),
            evaluated_count=len(rows),
        ),
        rows=rows,
        audit_preview=audit_preview(AuditEventCategory.POLICY, "policy-evaluation"),
    )


def policy_diff(policy_id: str, payload: PolicyDiffRequest) -> PolicyDiffResponse:
    document = policy_by_id(policy_id)
    return PolicyDiffResponse(
        policy_id=policy_id,
        from_version=document.version,
        to_version=document.version + 1,
        changed_fields=["mode"],
        before={"mode": document.mode},
        after={"mode": payload.target_mode, "reason": payload.reason},
        audit_preview=audit_preview(AuditEventCategory.POLICY, "policy-diff"),
    )


def enforce_preview(policy_id: str, payload: EnforcePreviewRequest) -> EnforcePreviewResponse:
    evaluation = evaluate_policy(
        policy_id,
        PolicyEvaluationRequest(candidate_ids=[], include_blocked=True, dry_run=True),
    )
    blocked = sorted(
        {
            reason
            for row in evaluation.rows
            for reason in row.blocked_reasons
            if reason
        },
        key=lambda reason: reason.value,
    )
    return EnforcePreviewResponse(
        policy_id=policy_id,
        target_mode=payload.target_mode,
        can_enforce=False,
        affected_count=evaluation.summary.evaluated_count,
        blocked_count=evaluation.summary.blocked_count,
        blocked_reasons=blocked,
        required_confirmation="ENFORCE_POLICY",
        audit_preview=audit_preview(AuditEventCategory.POLICY, "policy-enforce-preview"),
    )


def operation_jobs(project_id: str) -> list[OperationJob]:
    _ensure_project(project_id)
    return [
        OperationJob(
            id="operation-job-policy-evaluation",
            project_id=project_id,
            job_type=OperationJobType.POLICY_EVALUATION,
            status=OperationJobStatus.SUCCEEDED,
            retry_count=0,
            retry_eligible=False,
            created_at=NOW,
            updated_at=NOW,
            audit_event_refs=[audit_ref(AuditEventCategory.POLICY, "job-policy")],
        ),
        OperationJob(
            id="operation-job-import-failed",
            project_id=project_id,
            job_type=OperationJobType.IMPORT,
            status=OperationJobStatus.FAILED,
            retry_count=1,
            retry_eligible=True,
            last_error="Dry-run import conflict requires operator review.",
            created_at=NOW,
            updated_at=NOW,
            audit_event_refs=[audit_ref(AuditEventCategory.IMPORT_EXPORT, "job-import")],
        ),
    ]


def operation_job_or_404(job_id: str) -> OperationJob:
    for job in operation_jobs(PROJECT_ID):
        if job.id == job_id:
            return job
    raise ApiException(
        status_code=404,
        code="OPERATION_JOB_NOT_FOUND",
        message="Operation job was not found.",
        details={"job_id": job_id},
    )


def retry_operation_job(job_id: str) -> OperationActionResponse:
    job = operation_job_or_404(job_id)
    return OperationActionResponse(
        id=job_id,
        action="RETRY_JOB",
        eligible=job.retry_eligible,
        status="QUEUED_FOR_RETRY" if job.retry_eligible else "NOT_ELIGIBLE",
        reason=None if job.retry_eligible else "Job is not in a retryable state.",
        audit_event_ref=audit_ref(AuditEventCategory.DESTRUCTIVE_ACTION, f"job-retry-{job_id}"),
    )


def dlq_rows(project_id: str) -> list[DlqRow]:
    _ensure_project(project_id)
    return [
        DlqRow(
            id="dlq-import-conflict",
            project_id=project_id,
            job_id="operation-job-import-failed",
            job_type=OperationJobType.IMPORT,
            retry_eligible=True,
            acknowledge_eligible=True,
            redaction_applied=True,
            reason="Import dry-run produced blocking conflicts.",
            created_at=NOW,
            audit_event_refs=[audit_ref(AuditEventCategory.DLQ, "dlq-import")],
        ),
        DlqRow(
            id="dlq-retention-lineage-blocked",
            project_id=project_id,
            job_id="operation-job-retention-delete",
            job_type=OperationJobType.RETENTION_DELETE,
            retry_eligible=False,
            acknowledge_eligible=True,
            redaction_applied=True,
            reason="Published graph lineage blocks deletion.",
            created_at=NOW,
            audit_event_refs=[audit_ref(AuditEventCategory.DLQ, "dlq-retention")],
        ),
    ]


def dlq_row_or_404(dlq_id: str) -> DlqRow:
    for row in dlq_rows(PROJECT_ID):
        if row.id == dlq_id:
            return row
    raise ApiException(
        status_code=404,
        code="DLQ_ROW_NOT_FOUND",
        message="DLQ row was not found.",
        details={"dlq_id": dlq_id},
    )


def dlq_action(dlq_id: str, action: str) -> OperationActionResponse:
    row = dlq_row_or_404(dlq_id)
    eligible = row.retry_eligible if action == "RETRY_DLQ" else row.acknowledge_eligible
    return OperationActionResponse(
        id=dlq_id,
        action=action,
        eligible=eligible,
        status="ACCEPTED" if eligible else "BLOCKED",
        reason=None if eligible else "DLQ action is not eligible for this row.",
        audit_event_ref=audit_ref(AuditEventCategory.DLQ, f"{action.lower()}-{dlq_id}"),
    )


def cost_budget(project_id: str) -> CostBudgetSummary:
    _ensure_project(project_id)
    return CostBudgetSummary(
        project_id=project_id,
        status=BudgetStatus.NEAR_LIMIT,
        monthly_budget_usd=250.0,
        current_spend_usd=217.35,
        token_budget=2_000_000,
        current_tokens=1_840_000,
        reset_at=datetime(2026, 7, 1, tzinfo=timezone.utc),
    )


def observability(project_id: str) -> ObservabilityAvailability:
    _ensure_project(project_id)
    return ObservabilityAvailability(
        project_id=project_id,
        metrics=ObservabilityAvailabilityStatus.AVAILABLE,
        tracing=ObservabilityAvailabilityStatus.NOT_CONFIGURED,
        logging=ObservabilityAvailabilityStatus.PARTIAL,
        notes=["Local structured events are available; distributed tracing is P1."],
    )


def structured_events(project_id: str) -> StructuredEventListResponse:
    _ensure_project(project_id)
    return StructuredEventListResponse(
        project_id=project_id,
        items=[
            StructuredEvent(
                id="event-policy-blocked",
                project_id=project_id,
                severity=OperationEventSeverity.SECURITY,
                message="Policy enforce preview blocked by audit gate.",
                redaction_applied=True,
                created_at=NOW,
                metadata={"policy_id": "policy-auto-approval-mvp5", "raw_secret_present": False},
            ),
            StructuredEvent(
                id="event-dlq-import",
                project_id=project_id,
                severity=OperationEventSeverity.WARNING,
                message="Import dry-run moved to DLQ with redacted details.",
                redaction_applied=True,
                created_at=NOW,
                metadata={"dlq_id": "dlq-import-conflict"},
            ),
        ],
    )


def operations_dashboard(project_id: str) -> OperationsDashboardResponse:
    jobs = operation_jobs(project_id)
    dlq = dlq_rows(project_id)
    return OperationsDashboardResponse(
        project_id=project_id,
        health=[
            OperationHealthSummary(
                job_type=OperationJobType.POLICY_EVALUATION,
                failed_count=0,
            ),
            OperationHealthSummary(
                job_type=OperationJobType.IMPORT,
                failed_count=1,
                dead_lettered_count=1,
            ),
        ],
        jobs=jobs,
        dlq_rows=dlq,
        cost_budget=cost_budget(project_id),
        observability=observability(project_id),
    )


def retention_policy(project_id: str) -> RetentionPolicy:
    _ensure_project(project_id)
    return RetentionPolicy(
        id="retention-policy-mvp5",
        project_id=project_id,
        mode=RetentionActionMode.DRY_RUN,
        rules=[
            RetentionRule(
                resource_type=RetentionResourceType.SOURCE,
                retention_days=365,
                action_mode=RetentionActionMode.CONFIRM_REQUIRED,
            ),
            RetentionRule(
                resource_type=RetentionResourceType.AUDIT_EVENT,
                retention_days=2555,
                action_mode=RetentionActionMode.READ_ONLY,
                legal_hold=True,
            ),
        ],
        updated_by="user-org-admin",
        updated_at=NOW,
        audit_event_refs=[audit_ref(AuditEventCategory.RETENTION, "retention-policy")],
    )


def retention_deletion_dry_run(
    project_id: str, payload: RetentionDeletionDryRunRequest
) -> RetentionDeletionDryRunResponse:
    _ensure_project(project_id)
    impacts = [
        RetentionLineageImpact(
            resource_id=resource_id,
            published_graph_version_ids=["published-graph-version-mvp5-current"],
            candidate_ids=["candidate-clean-approved"],
            evidence_ids=["evidence-mvp5-source-row-1"],
            blocked_by_lineage=True,
        )
        for resource_id in payload.resource_ids
    ]
    return RetentionDeletionDryRunResponse(
        project_id=project_id,
        mode=RetentionActionMode.DRY_RUN,
        impact_summary=RetentionDeletionImpactSummary(
            requested_count=len(payload.resource_ids),
            deletable_count=0,
            blocked_count=len(payload.resource_ids),
            requires_confirmation=True,
        ),
        lineage_impacts=impacts,
        audit_preview=audit_preview(AuditEventCategory.RETENTION, "deletion-dry-run"),
    )


def backup_snapshots(project_id: str) -> BackupSnapshotListResponse:
    _ensure_project(project_id)
    return BackupSnapshotListResponse(
        project_id=project_id,
        items=[
            BackupSnapshot(
                id="backup-snapshot-restore-ready",
                project_id=project_id,
                status=BackupStatus.RESTORE_DRY_RUN_AVAILABLE,
                label="MVP5 deterministic restore-ready snapshot",
                created_at=NOW,
                size_bytes=2048,
                restore_eligible=True,
                audit_event_refs=[audit_ref(AuditEventCategory.BACKUP, "backup-ready")],
            ),
            BackupSnapshot(
                id="backup-snapshot-restore-blocked",
                project_id=project_id,
                status=BackupStatus.RESTORE_BLOCKED,
                label="MVP5 blocked snapshot",
                created_at=NOW,
                size_bytes=1024,
                restore_eligible=False,
                restore_block_reason="Snapshot predates current ontology version.",
                audit_event_refs=[audit_ref(AuditEventCategory.BACKUP, "backup-blocked")],
            ),
        ],
    )


def backup_snapshot_or_404(snapshot_id: str) -> BackupSnapshot:
    for snapshot in backup_snapshots(PROJECT_ID).items:
        if snapshot.id == snapshot_id:
            return snapshot
    raise ApiException(
        status_code=404,
        code="BACKUP_SNAPSHOT_NOT_FOUND",
        message="Backup snapshot was not found.",
        details={"snapshot_id": snapshot_id},
    )


def restore_dry_run(snapshot_id: str, payload: dict[str, Any]) -> RestoreDryRunResponse:
    snapshot = backup_snapshot_or_404(snapshot_id)
    return RestoreDryRunResponse(
        snapshot_id=snapshot_id,
        project_id=snapshot.project_id,
        eligible=snapshot.restore_eligible,
        impacted_resources={"classes": 5, "relations": 4, "published_graph_versions": 1},
        requires_confirmation=True,
        audit_preview=audit_preview(AuditEventCategory.BACKUP, "restore-dry-run"),
    )


def audit_events(project_id: str) -> AuditEventListResponse:
    _ensure_project(project_id)
    items = [
        AuditEvent(
            id="audit-mvp5-role-change",
            project_id=project_id,
            category=AuditEventCategory.ROLE,
            actor_id="user-org-admin",
            action="ASSIGN_ROLE",
            target_type="ROLE_ASSIGNMENT",
            target_id="role-assignment-project-admin",
            summary="Project admin role assignment recorded.",
            created_at=NOW,
        ),
        AuditEvent(
            id="audit-mvp5-credential-created",
            project_id=project_id,
            category=AuditEventCategory.CREDENTIAL,
            actor_id="user-org-admin",
            action="CREATE_CREDENTIAL",
            target_type="API_CREDENTIAL",
            target_id="cred-service-account-readonly",
            summary="Credential create event recorded with masked future display.",
            created_at=NOW,
            metadata={"masked_secret": "MASKED_SERVICE_ACCOUNT_...SVC1"},
        ),
        AuditEvent(
            id="audit-mvp5-policy-preview",
            project_id=project_id,
            category=AuditEventCategory.POLICY,
            actor_id="user-org-admin",
            action="ENFORCE_PREVIEW",
            target_type="AUTOMATIC_APPROVAL_POLICY",
            target_id="policy-auto-approval-mvp5",
            summary="Automatic approval enforce preview blocked by safety gates.",
            created_at=NOW,
        ),
        AuditEvent(
            id="audit-mvp5-retention-dry-run",
            project_id=project_id,
            category=AuditEventCategory.RETENTION,
            actor_id="user-org-admin",
            action="DELETION_DRY_RUN",
            target_type="RETENTION_POLICY",
            target_id="retention-policy-mvp5",
            summary="Deletion dry-run blocked by published graph lineage.",
            created_at=NOW,
        ),
    ]
    return AuditEventListResponse(project_id=project_id, items=items)


def security_events(organization_id: str) -> AuditEventListResponse:
    _ensure_organization(organization_id)
    return AuditEventListResponse(
        organization_id=organization_id,
        items=[
            AuditEvent(
                id="security-event-mvp5-denied-secret",
                organization_id=organization_id,
                category=AuditEventCategory.SECURITY,
                actor_id="user-analyst-viewer",
                action="DENIED_REVOKE_CREDENTIAL",
                target_type="API_CREDENTIAL",
                target_id="cred-service-account-readonly",
                summary="Viewer was denied a credential revoke action.",
                created_at=NOW,
                metadata={"deny_reasons": ["SENSITIVITY_RESTRICTED"]},
            )
        ],
    )


def seed_summary() -> dict[str, Any]:
    return {
        "organization_id": ORGANIZATION_ID,
        "project_id": PROJECT_ID,
        "project_name": "Corporate Knowledge MVP5 Admin",
        "mvp5": {
            "role_assignment_ids": [item.id for item in role_assignments(PROJECT_ID).items],
            "permission_cases": ["ALLOW", "DENY", "CONDITIONAL_READ_ONLY"],
            "credential_ids": [item.id for item in credential_seed(PROJECT_ID)],
            "raw_secret_create_response_available": True,
            "policy_id": "policy-auto-approval-mvp5",
            "policy_block_reasons": [
                "MISSING_EVIDENCE",
                "FAILED_VALIDATION",
                "STALE_ONTOLOGY_VERSION",
                "CANDIDATE_STATUS_NOT_ELIGIBLE",
                "POLICY_MODE_DISABLED",
                "AUDIT_PREVIEW_REQUIRED",
            ],
            "operation_job_ids": [job.id for job in operation_jobs(PROJECT_ID)],
            "dlq_ids": [row.id for row in dlq_rows(PROJECT_ID)],
            "backup_snapshot_ids": [item.id for item in backup_snapshots(PROJECT_ID).items],
            "ontology_export_package_id": ontology_export(PROJECT_ID).package_id,
            "ontology_import_dry_run_cases": [
                "clean-compatible",
                "conflict",
                "warning-destructive",
                "invalid-schema",
                "non-mutation-proof",
            ],
            "recommended_frontend_routes": [
                "/admin",
                f"/projects/{PROJECT_ID}/admin",
                f"/projects/{PROJECT_ID}/admin/roles",
                f"/projects/{PROJECT_ID}/admin/credentials",
                f"/projects/{PROJECT_ID}/admin/policies/approval",
                f"/projects/{PROJECT_ID}/admin/import-export",
                f"/projects/{PROJECT_ID}/admin/operations",
                f"/projects/{PROJECT_ID}/admin/retention-backup",
            ],
        },
    }


def _permission_context(payload: PermissionCheckRequest) -> dict[str, Any]:
    return {
        "principal_id": payload.principal_id,
        "principal_type": payload.principal_type,
        "organization_id": payload.organization_id,
        "project_id": payload.project_id,
        "resource_type": payload.resource_type,
        "action": payload.action,
        "environment": payload.environment,
        "version_context": payload.version_context,
    }


def _ensure_organization(organization_id: str) -> None:
    if organization_id != ORGANIZATION_ID:
        raise ApiException(
            status_code=404,
            code="ORGANIZATION_NOT_FOUND",
            message="Organization was not found.",
            details={"organization_id": organization_id},
        )


def _ensure_project(project_id: str) -> None:
    if project_id != PROJECT_ID:
        raise ApiException(
            status_code=404,
            code="PROJECT_NOT_FOUND",
            message="Project was not found.",
            details={"project_id": project_id},
        )
