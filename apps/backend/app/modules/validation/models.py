from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import (
    CandidateKind,
    ValidationJobStatus,
    ValidationResultSeverity,
    ValidationRuleCode,
)
from app.db.base_class import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ValidationJob(Base):
    __tablename__ = "validation_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
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
    status: Mapped[ValidationJobStatus] = mapped_column(
        Enum(ValidationJobStatus, native_enum=False, length=32),
        nullable=False,
        default=ValidationJobStatus.PENDING,
        index=True,
    )
    requested_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    summary: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    error_code: Mapped[str | None] = mapped_column(String(120), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)


class ValidationResult(Base):
    __tablename__ = "validation_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    validation_job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("validation_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ontology_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("ontology_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    candidate_kind: Mapped[CandidateKind] = mapped_column(
        Enum(CandidateKind, native_enum=False, length=32), nullable=False, index=True
    )
    candidate_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    rule_code: Mapped[ValidationRuleCode] = mapped_column(
        Enum(ValidationRuleCode, native_enum=False, length=64), nullable=False, index=True
    )
    severity: Mapped[ValidationResultSeverity] = mapped_column(
        Enum(ValidationResultSeverity, native_enum=False, length=32), nullable=False, index=True
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    field_path: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    blocking: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    suggested_fix: Mapped[str | None] = mapped_column(Text, nullable=True)
    details: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
