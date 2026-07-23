"""add ontology class owner (SME point of contact) fields

Revision ID: 20260723_0006
Revises: 20260723_0005
Create Date: 2026-07-23 00:00:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260723_0006"
down_revision: Union[str, None] = "20260723_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ontology_classes",
        sa.Column("owner_id", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "ontology_classes",
        sa.Column("owner_display_name", sa.String(length=200), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("ontology_classes", "owner_display_name")
    op.drop_column("ontology_classes", "owner_id")
