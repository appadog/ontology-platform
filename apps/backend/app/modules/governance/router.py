from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.enums import Role
from app.core.errors import ApiErrorResponse
from app.db.session import get_db
from app.modules.evaluation import service as evaluation_service
from app.modules.governance import application as application_service
from app.modules.governance import service
from app.modules.governance.application import (
    GovernanceApplicationAuditAction,
    GovernanceApplicationAuditListResponse,
    GovernanceApplicationStatusResponse,
    GovernanceApplyRequest,
    GovernanceApplyResponse,
)
from app.modules.governance.schemas import (
    GovernanceApplicationState,
    GovernanceAuditAction,
    GovernanceAuditListResponse,
    GovernanceMutationResponse,
    GovernanceReviewDecisionRequest,
    GovernanceWithdrawRequest,
    OntologyChangeItemRequest,
    OntologyChangeRequestCreateRequest,
    OntologyChangeRequestDetail,
    OntologyChangeRequestListResponse,
    OntologyChangeRequestStatus,
    OntologyChangeRequestUpdateRequest,
)

router = APIRouter(tags=["MVP6.5 Governance"])

_ERRORS = {
    403: {"model": ApiErrorResponse},
    404: {"model": ApiErrorResponse},
    409: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
}

ActorId = Query("dev-user", description="Acting user id (dev auth).")
ActorRole = Query(
    Role.REVIEWER,
    description="Acting user role (dev auth). Governs review/decision authorization.",
)


# --- A. Change-request CRUD -------------------------------------------------


@router.post(
    "/projects/{project_id}/ontology-change-requests",
    response_model=GovernanceMutationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Propose an ontology change request",
    responses=_ERRORS,
)
def propose_change_request(
    project_id: str,
    payload: OntologyChangeRequestCreateRequest,
    actor_id: str = ActorId,
    actor_role: Role = ActorRole,
    db: Session = Depends(get_db),
) -> GovernanceMutationResponse:
    evaluation_service.project_or_404(db, project_id)
    return service.propose_change_request(project_id, payload, actor_id, actor_role)


@router.get(
    "/projects/{project_id}/ontology-change-requests",
    response_model=OntologyChangeRequestListResponse,
    summary="List ontology change requests",
    responses=_ERRORS,
)
def list_change_requests(
    project_id: str,
    status_filter: OntologyChangeRequestStatus | None = Query(None, alias="status"),
    application_state: GovernanceApplicationState | None = Query(None),
    limit: int | None = Query(None, ge=1, le=100),
    cursor: str | None = Query(None),
    db: Session = Depends(get_db),
) -> OntologyChangeRequestListResponse:
    evaluation_service.project_or_404(db, project_id)
    return service.list_change_requests(
        project_id, status_filter, application_state, limit, cursor
    )


@router.get(
    "/ontology-change-requests/{change_request_id}",
    response_model=OntologyChangeRequestDetail,
    summary="Get one ontology change request",
    responses=_ERRORS,
)
def get_change_request(
    change_request_id: str,
    actor_id: str = ActorId,
    actor_role: Role = ActorRole,
) -> OntologyChangeRequestDetail:
    return service.get_change_request_detail(change_request_id, actor_id, actor_role)


@router.patch(
    "/ontology-change-requests/{change_request_id}",
    response_model=GovernanceMutationResponse,
    summary="Update change request (proposer, while DRAFT/OPEN)",
    responses=_ERRORS,
)
def update_change_request(
    change_request_id: str,
    payload: OntologyChangeRequestUpdateRequest,
    actor_id: str = ActorId,
    actor_role: Role = ActorRole,
) -> GovernanceMutationResponse:
    return service.update_change_request(
        change_request_id, payload, actor_id, actor_role
    )


# --- B. Change-item management ---------------------------------------------


@router.post(
    "/ontology-change-requests/{change_request_id}/items",
    response_model=GovernanceMutationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a change item",
    responses=_ERRORS,
)
def add_change_item(
    change_request_id: str,
    payload: OntologyChangeItemRequest,
    actor_id: str = ActorId,
    actor_role: Role = ActorRole,
) -> GovernanceMutationResponse:
    return service.add_item(change_request_id, payload, actor_id, actor_role)


@router.patch(
    "/ontology-change-requests/{change_request_id}/items/{item_id}",
    response_model=GovernanceMutationResponse,
    summary="Edit a change item",
    responses=_ERRORS,
)
def edit_change_item(
    change_request_id: str,
    item_id: str,
    payload: OntologyChangeItemRequest,
    actor_id: str = ActorId,
    actor_role: Role = ActorRole,
) -> GovernanceMutationResponse:
    return service.edit_item(change_request_id, item_id, payload, actor_id, actor_role)


@router.delete(
    "/ontology-change-requests/{change_request_id}/items/{item_id}",
    response_model=GovernanceMutationResponse,
    summary="Remove a change item",
    responses=_ERRORS,
)
def remove_change_item(
    change_request_id: str,
    item_id: str,
    actor_id: str = ActorId,
    actor_role: Role = ActorRole,
) -> GovernanceMutationResponse:
    return service.remove_item(change_request_id, item_id, actor_id, actor_role)


# --- C. Lifecycle (submit / withdraw) --------------------------------------


@router.post(
    "/ontology-change-requests/{change_request_id}/submit",
    response_model=GovernanceMutationResponse,
    summary="Submit a change request (DRAFT -> OPEN)",
    responses=_ERRORS,
)
def submit_change_request(
    change_request_id: str,
    actor_id: str = ActorId,
    actor_role: Role = ActorRole,
) -> GovernanceMutationResponse:
    return service.submit_change_request(change_request_id, actor_id, actor_role)


@router.post(
    "/ontology-change-requests/{change_request_id}/withdraw",
    response_model=GovernanceMutationResponse,
    summary="Withdraw a change request (-> WITHDRAWN)",
    responses=_ERRORS,
)
def withdraw_change_request(
    change_request_id: str,
    payload: GovernanceWithdrawRequest | None = None,
    actor_id: str = ActorId,
    actor_role: Role = ActorRole,
) -> GovernanceMutationResponse:
    return service.withdraw_change_request(
        change_request_id, payload or GovernanceWithdrawRequest(), actor_id, actor_role
    )


# --- D. Review + decision ---------------------------------------------------


@router.post(
    "/ontology-change-requests/{change_request_id}/reviews",
    response_model=GovernanceMutationResponse,
    summary="Record a governance review decision",
    responses=_ERRORS,
)
def record_review_decision(
    change_request_id: str,
    payload: GovernanceReviewDecisionRequest,
    actor_id: str = ActorId,
    actor_role: Role = ActorRole,
) -> GovernanceMutationResponse:
    return service.record_review_decision(
        change_request_id, payload, actor_id, actor_role
    )


# --- E. Governance audit log (read-only) -----------------------------------


@router.get(
    "/ontology-change-requests/{change_request_id}/audit",
    response_model=GovernanceAuditListResponse,
    summary="List audit entries for a change request",
    responses=_ERRORS,
)
def list_change_request_audit(
    change_request_id: str,
    action: GovernanceAuditAction | None = Query(None),
    limit: int | None = Query(None, ge=1, le=100),
    cursor: str | None = Query(None),
) -> GovernanceAuditListResponse:
    return service.list_change_request_audit(change_request_id, action, limit, cursor)


# --- F. MVP6.6 Governance Change Application --------------------------------


@router.get(
    "/ontology-change-requests/{change_request_id}/application-status",
    response_model=GovernanceApplicationStatusResponse,
    summary="Read-only application-status pre-check (advisory)",
    responses=_ERRORS,
    tags=["MVP6.6 Governance Application"],
)
def get_application_status(
    change_request_id: str,
    target_ontology_version_id: str | None = Query(None),
    actor_id: str = ActorId,
    actor_role: Role = ActorRole,
) -> GovernanceApplicationStatusResponse:
    return application_service.get_application_status(
        change_request_id, target_ontology_version_id, actor_id, actor_role
    )


@router.post(
    "/ontology-change-requests/{change_request_id}/apply",
    response_model=GovernanceApplyResponse,
    summary="Apply an APPROVED+QUEUED change request to a DRAFT ontology version",
    responses=_ERRORS,
    tags=["MVP6.6 Governance Application"],
)
def apply_change_request(
    change_request_id: str,
    payload: GovernanceApplyRequest | None = None,
    actor_id: str = ActorId,
    actor_role: Role = ActorRole,
) -> GovernanceApplyResponse:
    return application_service.apply_change_request(
        change_request_id, payload, actor_id, actor_role
    )


@router.get(
    "/ontology-change-requests/{change_request_id}/application-audit",
    response_model=GovernanceApplicationAuditListResponse,
    summary="Read the application audit trail for a change request",
    responses=_ERRORS,
    tags=["MVP6.6 Governance Application"],
)
def list_application_audit(
    change_request_id: str,
    action: GovernanceApplicationAuditAction | None = Query(None),
    limit: int | None = Query(None, ge=1, le=100),
    cursor: str | None = Query(None),
) -> GovernanceApplicationAuditListResponse:
    return application_service.list_application_audit(
        change_request_id, action, limit, cursor
    )


@router.get(
    "/projects/{project_id}/governance-audit",
    response_model=GovernanceAuditListResponse,
    summary="Project-scoped governance audit feed",
    responses=_ERRORS,
)
def list_project_governance_audit(
    project_id: str,
    action: GovernanceAuditAction | None = Query(None),
    limit: int | None = Query(None, ge=1, le=100),
    cursor: str | None = Query(None),
    db: Session = Depends(get_db),
) -> GovernanceAuditListResponse:
    evaluation_service.project_or_404(db, project_id)
    return service.list_project_governance_audit(project_id, action, limit, cursor)
