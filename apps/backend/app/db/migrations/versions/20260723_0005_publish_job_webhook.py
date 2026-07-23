"""add publish job webhook notification fields

Revision ID: 20260723_0005
Revises: 20260619_0004
Create Date: 2026-07-23 00:00:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260723_0005"
down_revision: Union[str, None] = "20260619_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

webhook_delivery_status = sa.Enum(
    "NOT_CONFIGURED",
    "DELIVERED",
    "FAILED",
    name="webhookdeliverystatus",
    native_enum=False,
    length=32,
)


def upgrade() -> None:
    op.add_column(
        "publish_jobs",
        sa.Column("notify_webhook_url", sa.String(length=2048), nullable=True),
    )
    op.add_column(
        "publish_jobs",
        sa.Column(
            "webhook_delivery_status",
            webhook_delivery_status,
            nullable=False,
            server_default="NOT_CONFIGURED",
        ),
    )
    op.add_column(
        "publish_jobs",
        sa.Column("webhook_delivered_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "publish_jobs",
        sa.Column("webhook_error_message", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("publish_jobs", "webhook_error_message")
    op.drop_column("publish_jobs", "webhook_delivered_at")
    op.drop_column("publish_jobs", "webhook_delivery_status")
    op.drop_column("publish_jobs", "notify_webhook_url")
