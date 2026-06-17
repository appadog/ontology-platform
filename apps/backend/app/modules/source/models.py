from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import SourcePreviewStatus, SourceSegmentType, SourceStatus, SourceType
from app.db.base_class import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SourceData(Base):
    __tablename__ = "source_data"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[SourceType] = mapped_column(
        Enum(SourceType, native_enum=False, length=32), nullable=False, index=True
    )
    mime_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[SourceStatus] = mapped_column(
        Enum(SourceStatus, native_enum=False, length=32),
        nullable=False,
        default=SourceStatus.UPLOADED,
        index=True,
    )
    preview_status: Mapped[SourcePreviewStatus] = mapped_column(
        Enum(SourcePreviewStatus, native_enum=False, length=32),
        nullable=False,
        default=SourcePreviewStatus.PENDING,
        index=True,
    )
    storage_uri: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    created_by: Mapped[str] = mapped_column(String(100), nullable=False, default="dev-user")
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)
    preview_columns: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    preview_rows: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    row_count_sampled: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_row_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sheet_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    preview_warnings: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)


class SourceProfile(Base):
    __tablename__ = "source_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    source_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("source_data.id", ondelete="CASCADE"), nullable=False, index=True
    )
    columns: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    row_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sample_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warnings: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class SourceSegment(Base):
    __tablename__ = "source_segments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    source_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("source_data.id", ondelete="CASCADE"), nullable=False, index=True
    )
    segment_type: Mapped[SourceSegmentType] = mapped_column(
        Enum(SourceSegmentType, native_enum=False, length=32), nullable=False, index=True
    )
    sequence: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    row_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    column_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    section_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    paragraph_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    chunk_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
