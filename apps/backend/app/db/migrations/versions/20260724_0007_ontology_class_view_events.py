"""add ontology class view events (per-object-type usage metrics)

Revision ID: 20260724_0007
Revises: 20260723_0006
Create Date: 2026-07-24 00:00:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260724_0007"
down_revision: Union[str, None] = "20260723_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ontology_class_view_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("class_id", sa.String(length=36), nullable=False),
        sa.Column("actor_id", sa.String(length=100), nullable=True),
        sa.Column("viewed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["class_id"], ["ontology_classes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_ontology_class_view_events_project_id"),
        "ontology_class_view_events",
        ["project_id"],
    )
    op.create_index(
        op.f("ix_ontology_class_view_events_class_id"),
        "ontology_class_view_events",
        ["class_id"],
    )
    op.create_index(
        op.f("ix_ontology_class_view_events_viewed_at"),
        "ontology_class_view_events",
        ["viewed_at"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_ontology_class_view_events_viewed_at"), table_name="ontology_class_view_events")
    op.drop_index(op.f("ix_ontology_class_view_events_class_id"), table_name="ontology_class_view_events")
    op.drop_index(op.f("ix_ontology_class_view_events_project_id"), table_name="ontology_class_view_events")
    op.drop_table("ontology_class_view_events")
