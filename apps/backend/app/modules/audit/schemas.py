from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.core.enums import AuditEventType, CandidateKind


class AuditLog(BaseModel):
    id: str
    project_id: str
    event_type: AuditEventType
    actor_id: str | None = None
    candidate_kind: CandidateKind | None = None
    candidate_id: str | None = None
    review_task_id: str | None = None
    review_decision_id: str | None = None
    validation_job_id: str | None = None
    publish_job_id: str | None = None
    published_graph_version_id: str | None = None
    original_snapshot: dict[str, Any] | None = None
    corrected_snapshot: dict[str, Any] | None = None
    reason: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
