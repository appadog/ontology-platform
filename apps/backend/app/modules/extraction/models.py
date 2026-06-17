from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import ExtractionJobStatus, ModelRunStatus
from app.db.base_class import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ExtractionJob(Base):
    __tablename__ = "extraction_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("source_data.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    ontology_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("ontology_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    prompt_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("prompt_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    provider: Mapped[str] = mapped_column(String(80), nullable=False, default="mock")
    model_name: Mapped[str] = mapped_column(
        String(120), nullable=False, default="mock-deterministic"
    )
    fixture_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[ExtractionJobStatus] = mapped_column(
        Enum(ExtractionJobStatus, native_enum=False, length=32),
        nullable=False,
        default=ExtractionJobStatus.PENDING,
        index=True,
    )
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    retry_of_job_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("extraction_jobs.id", ondelete="SET NULL"), nullable=True, index=True
    )
    error_code: Mapped[str | None] = mapped_column(String(120), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ModelRun(Base):
    __tablename__ = "model_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    extraction_job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("extraction_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    prompt_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("prompt_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    ontology_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("ontology_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    provider: Mapped[str] = mapped_column(String(80), nullable=False)
    model_name: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[ModelRunStatus] = mapped_column(
        Enum(ModelRunStatus, native_enum=False, length=32),
        nullable=False,
        default=ModelRunStatus.PENDING,
        index=True,
    )
    input_token_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    output_token_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cost_estimate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    raw_request: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    raw_response: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    masking_version: Mapped[str] = mapped_column(String(40), nullable=False, default="v1")
    redaction_summary: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
