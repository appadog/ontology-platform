from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import PublishJobStatus
from app.db.base_class import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PublishJob(Base):
    __tablename__ = "publish_jobs"

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
    status: Mapped[PublishJobStatus] = mapped_column(
        Enum(PublishJobStatus, native_enum=False, length=32),
        nullable=False,
        default=PublishJobStatus.PENDING,
        index=True,
    )
    requested_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    candidate_refs: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    eligible_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    published_entity_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    published_relation_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    skipped_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    skip_reasons: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    published_graph_version_id: Mapped[str | None] = mapped_column(
        String(36), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(120), nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)


class PublishedGraphVersion(Base):
    __tablename__ = "published_graph_versions"
    __table_args__ = (
        UniqueConstraint("project_id", "version", name="uq_published_graph_version_project"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    ontology_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("ontology_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    publish_job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("publish_jobs.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    is_current: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    created_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    summary: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class PublishedEntity(Base):
    __tablename__ = "published_entities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    published_graph_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("published_graph_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ontology_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("ontology_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    class_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    canonical_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    properties: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    source_candidate_entity_ids: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    original_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    corrected_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    lineage: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class PublishedRelation(Base):
    __tablename__ = "published_relations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    published_graph_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("published_graph_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ontology_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("ontology_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    source_published_entity_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    relation_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    target_published_entity_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    properties: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    source_candidate_relation_ids: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    original_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    corrected_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    lineage: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
