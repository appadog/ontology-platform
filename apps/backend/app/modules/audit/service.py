from typing import Any

from sqlalchemy.orm import Session

from app.core.enums import AuditEventType, CandidateKind
from app.modules.audit.models import AuditLog
from app.modules.audit.schemas import AuditLog as AuditLogSchema


def record_audit_event(
    db: Session,
    *,
    project_id: str,
    event_type: AuditEventType,
    actor_id: str | None = "dev-user",
    candidate_kind: CandidateKind | None = None,
    candidate_id: str | None = None,
    review_task_id: str | None = None,
    review_decision_id: str | None = None,
    validation_job_id: str | None = None,
    publish_job_id: str | None = None,
    published_graph_version_id: str | None = None,
    original_snapshot: dict[str, Any] | None = None,
    corrected_snapshot: dict[str, Any] | None = None,
    reason: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    event = AuditLog(
        project_id=project_id,
        event_type=event_type,
        actor_id=actor_id,
        candidate_kind=candidate_kind,
        candidate_id=candidate_id,
        review_task_id=review_task_id,
        review_decision_id=review_decision_id,
        validation_job_id=validation_job_id,
        publish_job_id=publish_job_id,
        published_graph_version_id=published_graph_version_id,
        original_snapshot=original_snapshot,
        corrected_snapshot=corrected_snapshot,
        reason=reason,
        metadata_=metadata or {},
    )
    db.add(event)
    db.flush()
    return event


def to_audit_log(event: AuditLog) -> AuditLogSchema:
    return AuditLogSchema(
        id=event.id,
        project_id=event.project_id,
        event_type=event.event_type,
        actor_id=event.actor_id,
        candidate_kind=event.candidate_kind,
        candidate_id=event.candidate_id,
        review_task_id=event.review_task_id,
        review_decision_id=event.review_decision_id,
        validation_job_id=event.validation_job_id,
        publish_job_id=event.publish_job_id,
        published_graph_version_id=event.published_graph_version_id,
        original_snapshot=event.original_snapshot,
        corrected_snapshot=event.corrected_snapshot,
        reason=event.reason,
        metadata=event.metadata_ or {},
        created_at=event.created_at,
    )
