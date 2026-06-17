"""initial project and ontology models

Revision ID: 20260617_0001
Revises:
Create Date: 2026-06-17 00:00:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260617_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


project_status = sa.Enum(
    "DRAFT", "ACTIVE", "ARCHIVED", "DELETED", name="projectstatus", native_enum=False, length=32
)
version_status = sa.Enum(
    "DRAFT", "PUBLISHED", "ARCHIVED", name="ontologyversionstatus", native_enum=False, length=32
)
element_status = sa.Enum(
    "DRAFT",
    "ACTIVE",
    "ARCHIVED",
    "DELETED",
    name="ontologyelementstatus",
    native_enum=False,
    length=32,
)
property_data_type = sa.Enum(
    "STRING",
    "TEXT",
    "INTEGER",
    "FLOAT",
    "BOOLEAN",
    "DATE",
    "DATETIME",
    "URI",
    name="propertydatatype",
    native_enum=False,
    length=32,
)
cardinality = sa.Enum(
    "ONE_TO_ONE",
    "ONE_TO_MANY",
    "MANY_TO_ONE",
    "MANY_TO_MANY",
    "OPTIONAL",
    "REQUIRED",
    "MULTIPLE",
    name="cardinality",
    native_enum=False,
    length=32,
)


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", project_status, nullable=False),
        sa.Column("current_ontology_version_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_projects_name"), "projects", ["name"], unique=False)
    op.create_index(op.f("ix_projects_status"), "projects", ["status"], unique=False)

    op.create_table(
        "ontology_versions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("status", version_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "version", name="uq_ontology_version_project"),
    )
    op.create_index(
        op.f("ix_ontology_versions_project_id"),
        "ontology_versions",
        ["project_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ontology_versions_status"),
        "ontology_versions",
        ["status"],
        unique=False,
    )

    op.create_table(
        "ontology_classes",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("label", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", element_status, nullable=False),
        sa.Column("position", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["version_id"], ["ontology_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("version_id", "name", name="uq_ontology_class_version_name"),
    )
    op.create_index(
        op.f("ix_ontology_classes_status"),
        "ontology_classes",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ontology_classes_version_id"),
        "ontology_classes",
        ["version_id"],
        unique=False,
    )

    op.create_table(
        "ontology_properties",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("class_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("label", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("data_type", property_data_type, nullable=False),
        sa.Column("cardinality", cardinality, nullable=False),
        sa.Column("required", sa.Boolean(), nullable=False),
        sa.Column("status", element_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["class_id"], ["ontology_classes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["version_id"], ["ontology_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("version_id", "class_id", "name", name="uq_ontology_property_class_name"),
    )
    op.create_index(
        op.f("ix_ontology_properties_class_id"),
        "ontology_properties",
        ["class_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ontology_properties_status"),
        "ontology_properties",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ontology_properties_version_id"),
        "ontology_properties",
        ["version_id"],
        unique=False,
    )

    op.create_table(
        "ontology_relations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("label", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("domain_class_id", sa.String(length=36), nullable=False),
        sa.Column("range_class_id", sa.String(length=36), nullable=False),
        sa.Column("cardinality", cardinality, nullable=False),
        sa.Column("required", sa.Boolean(), nullable=False),
        sa.Column("status", element_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["domain_class_id"], ["ontology_classes.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["range_class_id"], ["ontology_classes.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["version_id"], ["ontology_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("version_id", "name", name="uq_ontology_relation_version_name"),
    )
    op.create_index(
        op.f("ix_ontology_relations_domain_class_id"),
        "ontology_relations",
        ["domain_class_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ontology_relations_range_class_id"),
        "ontology_relations",
        ["range_class_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ontology_relations_status"),
        "ontology_relations",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ontology_relations_version_id"),
        "ontology_relations",
        ["version_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_ontology_relations_version_id"), table_name="ontology_relations")
    op.drop_index(op.f("ix_ontology_relations_status"), table_name="ontology_relations")
    op.drop_index(op.f("ix_ontology_relations_range_class_id"), table_name="ontology_relations")
    op.drop_index(op.f("ix_ontology_relations_domain_class_id"), table_name="ontology_relations")
    op.drop_table("ontology_relations")
    op.drop_index(op.f("ix_ontology_properties_version_id"), table_name="ontology_properties")
    op.drop_index(op.f("ix_ontology_properties_status"), table_name="ontology_properties")
    op.drop_index(op.f("ix_ontology_properties_class_id"), table_name="ontology_properties")
    op.drop_table("ontology_properties")
    op.drop_index(op.f("ix_ontology_classes_version_id"), table_name="ontology_classes")
    op.drop_index(op.f("ix_ontology_classes_status"), table_name="ontology_classes")
    op.drop_table("ontology_classes")
    op.drop_index(op.f("ix_ontology_versions_status"), table_name="ontology_versions")
    op.drop_index(op.f("ix_ontology_versions_project_id"), table_name="ontology_versions")
    op.drop_table("ontology_versions")
    op.drop_index(op.f("ix_projects_status"), table_name="projects")
    op.drop_index(op.f("ix_projects_name"), table_name="projects")
    op.drop_table("projects")
