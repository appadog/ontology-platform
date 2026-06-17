"""add mvp2 thin slice models

Revision ID: 20260617_0003
Revises: 20260617_0002
Create Date: 2026-06-17 00:00:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260617_0003"
down_revision: Union[str, None] = "20260617_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

source_segment_type = sa.Enum(
    "SHEET",
    "ROW",
    "CELL",
    "PAGE",
    "SECTION",
    "PARAGRAPH",
    "CHUNK",
    name="sourcesegmenttype",
    native_enum=False,
    length=32,
)
extraction_job_status = sa.Enum(
    "PENDING",
    "QUEUED",
    "RUNNING",
    "SUCCESS",
    "PARTIAL_FAILED",
    "FAILED",
    "CANCELLED",
    "RETRYING",
    name="extractionjobstatus",
    native_enum=False,
    length=32,
)
model_run_status = sa.Enum(
    "PENDING",
    "RUNNING",
    "SUCCESS",
    "FAILED",
    "CANCELLED",
    name="modelrunstatus",
    native_enum=False,
    length=32,
)
source_type = sa.Enum("CSV", "EXCEL", "TXT", "PDF", name="sourcetype", native_enum=False, length=32)
validation_status = sa.Enum(
    "NOT_VALIDATED",
    "PASSED",
    "WARNING",
    "FAILED",
    name="validationstatus",
    native_enum=False,
    length=32,
)
candidate_review_status = sa.Enum(
    "PENDING",
    "APPROVED",
    "REJECTED",
    "MODIFIED",
    "NEEDS_DISCUSSION",
    name="candidatereviewstatus",
    native_enum=False,
    length=32,
)
publish_status = sa.Enum(
    "NOT_PUBLISHED",
    "PUBLISHED",
    "ROLLED_BACK",
    name="publishstatus",
    native_enum=False,
    length=32,
)


def upgrade() -> None:
    op.create_table(
        "source_profiles",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_id", sa.String(length=36), nullable=False),
        sa.Column("columns", sa.JSON(), nullable=False),
        sa.Column("row_count", sa.Integer(), nullable=False),
        sa.Column("sample_size", sa.Integer(), nullable=False),
        sa.Column("warnings", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["source_id"], ["source_data.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_source_profiles_source_id"), "source_profiles", ["source_id"], unique=False
    )

    op.create_table(
        "source_segments",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_id", sa.String(length=36), nullable=False),
        sa.Column("segment_type", source_segment_type, nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("row_index", sa.Integer(), nullable=True),
        sa.Column("column_name", sa.String(length=120), nullable=True),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("section_title", sa.String(length=255), nullable=True),
        sa.Column("paragraph_index", sa.Integer(), nullable=True),
        sa.Column("chunk_index", sa.Integer(), nullable=True),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["source_id"], ["source_data.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_source_segments_sequence"), "source_segments", ["sequence"], unique=False
    )
    op.create_index(
        op.f("ix_source_segments_source_id"), "source_segments", ["source_id"], unique=False
    )
    op.create_index(
        op.f("ix_source_segments_segment_type"), "source_segments", ["segment_type"], unique=False
    )

    op.create_table(
        "prompt_templates",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_prompt_templates_project_id"), "prompt_templates", ["project_id"], unique=False
    )

    op.create_table(
        "prompt_versions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("prompt_template_id", sa.String(length=36), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("template", sa.Text(), nullable=False),
        sa.Column("output_schema", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(
            ["prompt_template_id"], ["prompt_templates.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("prompt_template_id", "version", name="uq_prompt_version_template"),
    )
    op.create_index(
        op.f("ix_prompt_versions_is_active"), "prompt_versions", ["is_active"], unique=False
    )
    op.create_index(
        op.f("ix_prompt_versions_prompt_template_id"),
        "prompt_versions",
        ["prompt_template_id"],
        unique=False,
    )

    op.create_table(
        "extraction_jobs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("source_id", sa.String(length=36), nullable=False),
        sa.Column("ontology_version_id", sa.String(length=36), nullable=False),
        sa.Column("prompt_version_id", sa.String(length=36), nullable=False),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("model_name", sa.String(length=120), nullable=False),
        sa.Column("fixture_id", sa.String(length=120), nullable=True),
        sa.Column("status", extraction_job_status, nullable=False),
        sa.Column("progress", sa.Integer(), nullable=False),
        sa.Column("retry_of_job_id", sa.String(length=36), nullable=True),
        sa.Column("error_code", sa.String(length=120), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["ontology_version_id"], ["ontology_versions.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["prompt_version_id"], ["prompt_versions.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["retry_of_job_id"], ["extraction_jobs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["source_id"], ["source_data.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_extraction_jobs_project_id"), "extraction_jobs", ["project_id"], unique=False
    )
    op.create_index(
        op.f("ix_extraction_jobs_source_id"), "extraction_jobs", ["source_id"], unique=False
    )
    op.create_index(
        op.f("ix_extraction_jobs_ontology_version_id"),
        "extraction_jobs",
        ["ontology_version_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_extraction_jobs_prompt_version_id"),
        "extraction_jobs",
        ["prompt_version_id"],
        unique=False,
    )
    op.create_index(op.f("ix_extraction_jobs_status"), "extraction_jobs", ["status"], unique=False)
    op.create_index(
        op.f("ix_extraction_jobs_retry_of_job_id"),
        "extraction_jobs",
        ["retry_of_job_id"],
        unique=False,
    )

    op.create_table(
        "model_runs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("extraction_job_id", sa.String(length=36), nullable=False),
        sa.Column("prompt_version_id", sa.String(length=36), nullable=False),
        sa.Column("ontology_version_id", sa.String(length=36), nullable=False),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("model_name", sa.String(length=120), nullable=False),
        sa.Column("status", model_run_status, nullable=False),
        sa.Column("input_token_count", sa.Integer(), nullable=False),
        sa.Column("output_token_count", sa.Integer(), nullable=False),
        sa.Column("cost_estimate", sa.Float(), nullable=False),
        sa.Column("raw_request", sa.JSON(), nullable=False),
        sa.Column("raw_response", sa.JSON(), nullable=False),
        sa.Column("masking_version", sa.String(length=40), nullable=False),
        sa.Column("redaction_summary", sa.JSON(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["extraction_job_id"], ["extraction_jobs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["ontology_version_id"], ["ontology_versions.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["prompt_version_id"], ["prompt_versions.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_model_runs_extraction_job_id"), "model_runs", ["extraction_job_id"], unique=False
    )
    op.create_index(
        op.f("ix_model_runs_ontology_version_id"),
        "model_runs",
        ["ontology_version_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_model_runs_prompt_version_id"),
        "model_runs",
        ["prompt_version_id"],
        unique=False,
    )
    op.create_index(op.f("ix_model_runs_status"), "model_runs", ["status"], unique=False)

    op.create_table(
        "candidate_evidence",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_id", sa.String(length=36), nullable=False),
        sa.Column("source_segment_id", sa.String(length=36), nullable=True),
        sa.Column("source_type", source_type, nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("sheet_name", sa.String(length=255), nullable=True),
        sa.Column("row_index", sa.Integer(), nullable=True),
        sa.Column("column_name", sa.String(length=120), nullable=True),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("section_title", sa.String(length=255), nullable=True),
        sa.Column("paragraph_id", sa.Integer(), nullable=True),
        sa.Column("chunk_id", sa.Integer(), nullable=True),
        sa.Column("evidence_text", sa.Text(), nullable=True),
        sa.Column("start_offset", sa.Integer(), nullable=True),
        sa.Column("end_offset", sa.Integer(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["source_id"], ["source_data.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_segment_id"], ["source_segments.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_candidate_evidence_source_id"), "candidate_evidence", ["source_id"], unique=False
    )
    op.create_index(
        op.f("ix_candidate_evidence_source_segment_id"),
        "candidate_evidence",
        ["source_segment_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_evidence_source_type"),
        "candidate_evidence",
        ["source_type"],
        unique=False,
    )

    op.create_table(
        "candidate_entities",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("extraction_job_id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("source_id", sa.String(length=36), nullable=False),
        sa.Column("source_segment_id", sa.String(length=36), nullable=True),
        sa.Column("ontology_version_id", sa.String(length=36), nullable=False),
        sa.Column("class_id", sa.String(length=36), nullable=True),
        sa.Column("model_run_id", sa.String(length=36), nullable=False),
        sa.Column("prompt_version_id", sa.String(length=36), nullable=False),
        sa.Column("entity_name", sa.String(length=255), nullable=False),
        sa.Column("normalized_name", sa.String(length=255), nullable=True),
        sa.Column("property_values", sa.JSON(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("evidence_ids", sa.JSON(), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=False),
        sa.Column("validation_status", validation_status, nullable=False),
        sa.Column("validation_codes", sa.JSON(), nullable=False),
        sa.Column("review_status", candidate_review_status, nullable=False),
        sa.Column("publish_status", publish_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["class_id"], ["ontology_classes.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["extraction_job_id"], ["extraction_jobs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["model_run_id"], ["model_runs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["ontology_version_id"], ["ontology_versions.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["prompt_version_id"], ["prompt_versions.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["source_id"], ["source_data.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_segment_id"], ["source_segments.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_candidate_entities_class_id"), "candidate_entities", ["class_id"], unique=False
    )
    op.create_index(
        op.f("ix_candidate_entities_extraction_job_id"),
        "candidate_entities",
        ["extraction_job_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_entities_model_run_id"),
        "candidate_entities",
        ["model_run_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_entities_ontology_version_id"),
        "candidate_entities",
        ["ontology_version_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_entities_project_id"), "candidate_entities", ["project_id"], unique=False
    )
    op.create_index(
        op.f("ix_candidate_entities_prompt_version_id"),
        "candidate_entities",
        ["prompt_version_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_entities_publish_status"),
        "candidate_entities",
        ["publish_status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_entities_review_status"),
        "candidate_entities",
        ["review_status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_entities_source_id"), "candidate_entities", ["source_id"], unique=False
    )
    op.create_index(
        op.f("ix_candidate_entities_source_segment_id"),
        "candidate_entities",
        ["source_segment_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_entities_validation_status"),
        "candidate_entities",
        ["validation_status"],
        unique=False,
    )

    op.create_table(
        "candidate_relations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("extraction_job_id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("source_id", sa.String(length=36), nullable=False),
        sa.Column("source_segment_id", sa.String(length=36), nullable=True),
        sa.Column("ontology_version_id", sa.String(length=36), nullable=False),
        sa.Column("relation_id", sa.String(length=36), nullable=True),
        sa.Column("model_run_id", sa.String(length=36), nullable=False),
        sa.Column("prompt_version_id", sa.String(length=36), nullable=False),
        sa.Column("source_candidate_entity_id", sa.String(length=36), nullable=True),
        sa.Column("target_candidate_entity_id", sa.String(length=36), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("evidence_ids", sa.JSON(), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=False),
        sa.Column("validation_status", validation_status, nullable=False),
        sa.Column("validation_codes", sa.JSON(), nullable=False),
        sa.Column("review_status", candidate_review_status, nullable=False),
        sa.Column("publish_status", publish_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["extraction_job_id"], ["extraction_jobs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["model_run_id"], ["model_runs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["ontology_version_id"], ["ontology_versions.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["prompt_version_id"], ["prompt_versions.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["relation_id"], ["ontology_relations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["source_candidate_entity_id"], ["candidate_entities.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["source_id"], ["source_data.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_segment_id"], ["source_segments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["target_candidate_entity_id"], ["candidate_entities.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_candidate_relations_extraction_job_id"),
        "candidate_relations",
        ["extraction_job_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_relations_model_run_id"),
        "candidate_relations",
        ["model_run_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_relations_ontology_version_id"),
        "candidate_relations",
        ["ontology_version_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_relations_project_id"),
        "candidate_relations",
        ["project_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_relations_prompt_version_id"),
        "candidate_relations",
        ["prompt_version_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_relations_publish_status"),
        "candidate_relations",
        ["publish_status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_relations_relation_id"),
        "candidate_relations",
        ["relation_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_relations_review_status"),
        "candidate_relations",
        ["review_status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_relations_source_id"), "candidate_relations", ["source_id"], unique=False
    )
    op.create_index(
        op.f("ix_candidate_relations_source_candidate_entity_id"),
        "candidate_relations",
        ["source_candidate_entity_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_relations_source_segment_id"),
        "candidate_relations",
        ["source_segment_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_relations_target_candidate_entity_id"),
        "candidate_relations",
        ["target_candidate_entity_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_candidate_relations_validation_status"),
        "candidate_relations",
        ["validation_status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_candidate_relations_validation_status"), table_name="candidate_relations"
    )
    op.drop_index(
        op.f("ix_candidate_relations_target_candidate_entity_id"), table_name="candidate_relations"
    )
    op.drop_index(
        op.f("ix_candidate_relations_source_segment_id"), table_name="candidate_relations"
    )
    op.drop_index(
        op.f("ix_candidate_relations_source_candidate_entity_id"), table_name="candidate_relations"
    )
    op.drop_index(op.f("ix_candidate_relations_source_id"), table_name="candidate_relations")
    op.drop_index(op.f("ix_candidate_relations_review_status"), table_name="candidate_relations")
    op.drop_index(op.f("ix_candidate_relations_relation_id"), table_name="candidate_relations")
    op.drop_index(op.f("ix_candidate_relations_publish_status"), table_name="candidate_relations")
    op.drop_index(
        op.f("ix_candidate_relations_prompt_version_id"), table_name="candidate_relations"
    )
    op.drop_index(op.f("ix_candidate_relations_project_id"), table_name="candidate_relations")
    op.drop_index(
        op.f("ix_candidate_relations_ontology_version_id"), table_name="candidate_relations"
    )
    op.drop_index(op.f("ix_candidate_relations_model_run_id"), table_name="candidate_relations")
    op.drop_index(
        op.f("ix_candidate_relations_extraction_job_id"), table_name="candidate_relations"
    )
    op.drop_table("candidate_relations")

    op.drop_index(op.f("ix_candidate_entities_validation_status"), table_name="candidate_entities")
    op.drop_index(op.f("ix_candidate_entities_source_segment_id"), table_name="candidate_entities")
    op.drop_index(op.f("ix_candidate_entities_source_id"), table_name="candidate_entities")
    op.drop_index(op.f("ix_candidate_entities_review_status"), table_name="candidate_entities")
    op.drop_index(op.f("ix_candidate_entities_publish_status"), table_name="candidate_entities")
    op.drop_index(op.f("ix_candidate_entities_prompt_version_id"), table_name="candidate_entities")
    op.drop_index(op.f("ix_candidate_entities_project_id"), table_name="candidate_entities")
    op.drop_index(
        op.f("ix_candidate_entities_ontology_version_id"), table_name="candidate_entities"
    )
    op.drop_index(op.f("ix_candidate_entities_model_run_id"), table_name="candidate_entities")
    op.drop_index(op.f("ix_candidate_entities_extraction_job_id"), table_name="candidate_entities")
    op.drop_index(op.f("ix_candidate_entities_class_id"), table_name="candidate_entities")
    op.drop_table("candidate_entities")

    op.drop_index(op.f("ix_candidate_evidence_source_type"), table_name="candidate_evidence")
    op.drop_index(op.f("ix_candidate_evidence_source_segment_id"), table_name="candidate_evidence")
    op.drop_index(op.f("ix_candidate_evidence_source_id"), table_name="candidate_evidence")
    op.drop_table("candidate_evidence")

    op.drop_index(op.f("ix_model_runs_status"), table_name="model_runs")
    op.drop_index(op.f("ix_model_runs_prompt_version_id"), table_name="model_runs")
    op.drop_index(op.f("ix_model_runs_ontology_version_id"), table_name="model_runs")
    op.drop_index(op.f("ix_model_runs_extraction_job_id"), table_name="model_runs")
    op.drop_table("model_runs")

    op.drop_index(op.f("ix_extraction_jobs_retry_of_job_id"), table_name="extraction_jobs")
    op.drop_index(op.f("ix_extraction_jobs_status"), table_name="extraction_jobs")
    op.drop_index(op.f("ix_extraction_jobs_prompt_version_id"), table_name="extraction_jobs")
    op.drop_index(op.f("ix_extraction_jobs_ontology_version_id"), table_name="extraction_jobs")
    op.drop_index(op.f("ix_extraction_jobs_source_id"), table_name="extraction_jobs")
    op.drop_index(op.f("ix_extraction_jobs_project_id"), table_name="extraction_jobs")
    op.drop_table("extraction_jobs")

    op.drop_index(op.f("ix_prompt_versions_prompt_template_id"), table_name="prompt_versions")
    op.drop_index(op.f("ix_prompt_versions_is_active"), table_name="prompt_versions")
    op.drop_table("prompt_versions")

    op.drop_index(op.f("ix_prompt_templates_project_id"), table_name="prompt_templates")
    op.drop_table("prompt_templates")

    op.drop_index(op.f("ix_source_segments_segment_type"), table_name="source_segments")
    op.drop_index(op.f("ix_source_segments_source_id"), table_name="source_segments")
    op.drop_index(op.f("ix_source_segments_sequence"), table_name="source_segments")
    op.drop_table("source_segments")

    op.drop_index(op.f("ix_source_profiles_source_id"), table_name="source_profiles")
    op.drop_table("source_profiles")
