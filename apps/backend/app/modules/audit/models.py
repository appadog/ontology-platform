from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import AuditEventType, CandidateKind
from app.db.base_class import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type: Mapped[AuditEventType] = mapped_column(
        Enum(AuditEventType, native_enum=False, length=80), nullable=False, index=True
    )
    actor_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    candidate_kind: Mapped[CandidateKind | None] = mapped_column(
        Enum(CandidateKind, native_enum=False, length=32), nullable=True, index=True
    )
    candidate_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    review_task_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("review_tasks.id", ondelete="SET NULL"), nullable=True, index=True
    )
    review_decision_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("review_decisions.id", ondelete="SET NULL"), nullable=True
    )
    validation_job_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("validation_jobs.id", ondelete="SET NULL"), nullable=True, index=True
    )
    publish_job_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("publish_jobs.id", ondelete="SET NULL"), nullable=True, index=True
    )
    published_graph_version_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("published_graph_versions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    original_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    corrected_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
