"""add source data models

Revision ID: 20260617_0002
Revises: 20260617_0001
Create Date: 2026-06-17 00:00:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260617_0002"
down_revision: Union[str, None] = "20260617_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

source_type = sa.Enum("CSV", "EXCEL", "TXT", "PDF", name="sourcetype", native_enum=False, length=32)
source_status = sa.Enum(
    "UPLOADED",
    "PARSING",
    "PARSED",
    "PROFILED",
    "EXTRACTION_READY",
    "FAILED",
    name="sourcestatus",
    native_enum=False,
    length=32,
)
source_preview_status = sa.Enum(
    "PENDING",
    "READY",
    "NOT_AVAILABLE",
    "FAILED",
    name="sourcepreviewstatus",
    native_enum=False,
    length=32,
)


def upgrade() -> None:
    op.create_table(
        "source_data",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("source_type", source_type, nullable=False),
        sa.Column("mime_type", sa.String(length=120), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("status", source_status, nullable=False),
        sa.Column("preview_status", source_preview_status, nullable=False),
        sa.Column("storage_uri", sa.String(length=500), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=100), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("preview_columns", sa.JSON(), nullable=False),
        sa.Column("preview_rows", sa.JSON(), nullable=False),
        sa.Column("row_count_sampled", sa.Integer(), nullable=False),
        sa.Column("total_row_count", sa.Integer(), nullable=False),
        sa.Column("sheet_name", sa.String(length=255), nullable=True),
        sa.Column("preview_warnings", sa.JSON(), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_source_data_is_deleted"), "source_data", ["is_deleted"], unique=False)
    op.create_index(op.f("ix_source_data_preview_status"), "source_data", ["preview_status"], unique=False)
    op.create_index(op.f("ix_source_data_project_id"), "source_data", ["project_id"], unique=False)
    op.create_index(op.f("ix_source_data_source_type"), "source_data", ["source_type"], unique=False)
    op.create_index(op.f("ix_source_data_status"), "source_data", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_source_data_status"), table_name="source_data")
    op.drop_index(op.f("ix_source_data_source_type"), table_name="source_data")
    op.drop_index(op.f("ix_source_data_project_id"), table_name="source_data")
    op.drop_index(op.f("ix_source_data_preview_status"), table_name="source_data")
    op.drop_index(op.f("ix_source_data_is_deleted"), table_name="source_data")
    op.drop_table("source_data")
