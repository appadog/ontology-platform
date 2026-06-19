from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import AuditEventType, CandidateKind
from app.core.errors import ApiErrorResponse, ApiException
from app.db.session import get_db
from app.modules.audit.models import AuditLog as AuditLogModel
from app.modules.audit.schemas import AuditLog
from app.modules.audit.service import to_audit_log
from app.modules.candidate.service import get_candidate_or_404
from app.modules.project.models import Project

router = APIRouter(tags=["Audit"])


def _project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise ApiException(
            status_code=404,
            code="PROJECT_NOT_FOUND",
            message="Project was not found.",
            details={"project_id": project_id},
        )
    return project


@router.get(
    "/projects/{project_id}/audit-logs",
    response_model=list[AuditLog],
    summary="List project audit logs",
    responses={404: {"model": ApiErrorResponse}},
)
def list_project_audit_logs(
    project_id: str,
    db: Session = Depends(get_db),
    event_type: AuditEventType | None = Query(default=None),
    candidate_kind: CandidateKind | None = Query(default=None),
    candidate_id: str | None = Query(default=None),
    review_task_id: str | None = Query(default=None),
    publish_job_id: str | None = Query(default=None),
    actor_id: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[AuditLog]:
    _project_or_404(db, project_id)
    statement = select(AuditLogModel).where(AuditLogModel.project_id == project_id)
    if event_type is not None:
        statement = statement.where(AuditLogModel.event_type == event_type)
    if candidate_kind is not None:
        statement = statement.where(AuditLogModel.candidate_kind == candidate_kind)
    if candidate_id is not None:
        statement = statement.where(AuditLogModel.candidate_id == candidate_id)
    if review_task_id is not None:
        statement = statement.where(AuditLogModel.review_task_id == review_task_id)
    if publish_job_id is not None:
        statement = statement.where(AuditLogModel.publish_job_id == publish_job_id)
    if actor_id is not None:
        statement = statement.where(AuditLogModel.actor_id == actor_id)
    events = db.scalars(
        statement.order_by(AuditLogModel.created_at.asc()).limit(limit).offset(offset)
    ).all()
    return [to_audit_log(event) for event in events]


@router.get(
    "/candidates/{candidate_kind}/{candidate_id}/audit-logs",
    response_model=list[AuditLog],
    summary="List candidate audit logs",
    responses={404: {"model": ApiErrorResponse}},
)
def list_candidate_audit_logs(
    candidate_kind: CandidateKind,
    candidate_id: str,
    db: Session = Depends(get_db),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[AuditLog]:
    get_candidate_or_404(db, candidate_kind, candidate_id)
    events = db.scalars(
        select(AuditLogModel)
        .where(
            AuditLogModel.candidate_kind == candidate_kind,
            AuditLogModel.candidate_id == candidate_id,
        )
        .order_by(AuditLogModel.created_at.asc())
        .limit(limit)
        .offset(offset)
    ).all()
    return [to_audit_log(event) for event in events]
