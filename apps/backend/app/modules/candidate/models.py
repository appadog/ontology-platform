from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import (
    CandidateReviewStatus,
    PublishStatus,
    SourceType,
    ValidationStatus,
)
from app.db.base_class import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CandidateEvidence(Base):
    __tablename__ = "candidate_evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    source_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("source_data.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_segment_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("source_segments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    source_type: Mapped[SourceType] = mapped_column(
        Enum(SourceType, native_enum=False, length=32), nullable=False, index=True
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sheet_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    row_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    column_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    section_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    paragraph_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    chunk_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    evidence_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_offset: Mapped[int | None] = mapped_column(Integer, nullable=True)
    end_offset: Mapped[int | None] = mapped_column(Integer, nullable=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class CandidateEntity(Base):
    __tablename__ = "candidate_entities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    extraction_job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("extraction_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("source_data.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_segment_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("source_segments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    ontology_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("ontology_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    class_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("ontology_classes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    model_run_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("model_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    prompt_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("prompt_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    entity_name: Mapped[str] = mapped_column(String(255), nullable=False)
    normalized_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    property_values: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    evidence_ids: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    raw_payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    validation_status: Mapped[ValidationStatus] = mapped_column(
        Enum(ValidationStatus, native_enum=False, length=32),
        nullable=False,
        default=ValidationStatus.NOT_VALIDATED,
        index=True,
    )
    validation_codes: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    review_status: Mapped[CandidateReviewStatus] = mapped_column(
        Enum(CandidateReviewStatus, native_enum=False, length=32),
        nullable=False,
        default=CandidateReviewStatus.PENDING,
        index=True,
    )
    publish_status: Mapped[PublishStatus] = mapped_column(
        Enum(PublishStatus, native_enum=False, length=32),
        nullable=False,
        default=PublishStatus.NOT_PUBLISHED,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class CandidateRelation(Base):
    __tablename__ = "candidate_relations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    extraction_job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("extraction_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("source_data.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_segment_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("source_segments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    ontology_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("ontology_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    relation_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("ontology_relations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    model_run_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("model_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    prompt_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("prompt_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    source_candidate_entity_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("candidate_entities.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    target_candidate_entity_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("candidate_entities.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    evidence_ids: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    raw_payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    validation_status: Mapped[ValidationStatus] = mapped_column(
        Enum(ValidationStatus, native_enum=False, length=32),
        nullable=False,
        default=ValidationStatus.NOT_VALIDATED,
        index=True,
    )
    validation_codes: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    review_status: Mapped[CandidateReviewStatus] = mapped_column(
        Enum(CandidateReviewStatus, native_enum=False, length=32),
        nullable=False,
        default=CandidateReviewStatus.PENDING,
        index=True,
    )
    publish_status: Mapped[PublishStatus] = mapped_column(
        Enum(PublishStatus, native_enum=False, length=32),
        nullable=False,
        default=PublishStatus.NOT_PUBLISHED,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
