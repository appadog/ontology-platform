from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import (
    CandidateKind,
    CandidateReviewStatus,
    CorrectionStatus,
    ReviewDecisionType,
    ReviewTaskStatus,
    ValidationStatus,
)
from app.db.base_class import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ReviewTask(Base):
    __tablename__ = "review_tasks"
    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "candidate_kind",
            "candidate_id",
            name="uq_review_task_project_candidate",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    candidate_kind: Mapped[CandidateKind] = mapped_column(
        Enum(CandidateKind, native_enum=False, length=32), nullable=False, index=True
    )
    candidate_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    ontology_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("ontology_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    source_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("source_data.id", ondelete="SET NULL"), nullable=True, index=True
    )
    extraction_job_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("extraction_jobs.id", ondelete="SET NULL"), nullable=True, index=True
    )
    status: Mapped[ReviewTaskStatus] = mapped_column(
        Enum(ReviewTaskStatus, native_enum=False, length=32),
        nullable=False,
        default=ReviewTaskStatus.OPEN,
        index=True,
    )
    assignee_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    validation_status: Mapped[ValidationStatus] = mapped_column(
        Enum(ValidationStatus, native_enum=False, length=32),
        nullable=False,
        default=ValidationStatus.NOT_VALIDATED,
        index=True,
    )
    validation_codes: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    priority_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    candidate_display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    assignee_display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    evidence_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    evidence_state: Mapped[str | None] = mapped_column(String(32), nullable=True)
    top_validation_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_decision_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CandidateCorrection(Base):
    __tablename__ = "candidate_corrections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    candidate_kind: Mapped[CandidateKind] = mapped_column(
        Enum(CandidateKind, native_enum=False, length=32), nullable=False, index=True
    )
    candidate_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    review_task_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("review_tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    base_candidate_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    corrected_payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    correction_diff: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[CorrectionStatus] = mapped_column(
        Enum(CorrectionStatus, native_enum=False, length=32),
        nullable=False,
        default=CorrectionStatus.SUBMITTED,
        index=True,
    )
    created_by: Mapped[str] = mapped_column(String(100), nullable=False, default="dev-user")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )


class ReviewDecision(Base):
    __tablename__ = "review_decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    review_task_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("review_tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    candidate_kind: Mapped[CandidateKind] = mapped_column(
        Enum(CandidateKind, native_enum=False, length=32), nullable=False, index=True
    )
    candidate_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    decision: Mapped[ReviewDecisionType] = mapped_column(
        Enum(ReviewDecisionType, native_enum=False, length=32), nullable=False, index=True
    )
    resulting_review_status: Mapped[CandidateReviewStatus] = mapped_column(
        Enum(CandidateReviewStatus, native_enum=False, length=32), nullable=False, index=True
    )
    reviewer_id: Mapped[str] = mapped_column(String(100), nullable=False, default="dev-user")
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    before_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    correction_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("candidate_corrections.id", ondelete="SET NULL"), nullable=True
    )
    correction_diff: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    validation_summary: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    publish_eligibility: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
