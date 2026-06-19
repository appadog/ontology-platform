"""add mvp3 validation review publish models

Revision ID: 20260619_0004
Revises: 20260617_0003
Create Date: 2026-06-19 00:00:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260619_0004"
down_revision: Union[str, None] = "20260617_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

candidate_kind = sa.Enum(
    "ENTITY",
    "RELATION",
    "PROPERTY_VALUE",
    name="candidatekind",
    native_enum=False,
    length=32,
)
validation_job_status = sa.Enum(
    "PENDING",
    "RUNNING",
    "SUCCESS",
    "FAILED",
    name="validationjobstatus",
    native_enum=False,
    length=32,
)
validation_rule_code = sa.Enum(
    "CLASS_EXISTS",
    "RELATION_EXISTS",
    "RELATION_DOMAIN_RANGE",
    "RELATION_DIRECTION",
    "REQUIRED_PROPERTY",
    "DATATYPE",
    "CARDINALITY",
    "DUPLICATE_CANDIDATE",
    "ORPHAN_NODE",
    "EVIDENCE_MISSING",
    "ONTOLOGY_VERSION_MISMATCH",
    "LOW_CONFIDENCE",
    name="validationrulecode",
    native_enum=False,
    length=64,
)
validation_result_severity = sa.Enum(
    "INFO",
    "WARNING",
    "FAILED",
    name="validationresultseverity",
    native_enum=False,
    length=32,
)
review_task_status = sa.Enum(
    "OPEN",
    "ASSIGNED",
    "IN_REVIEW",
    "DECIDED",
    "CANCELLED",
    name="reviewtaskstatus",
    native_enum=False,
    length=32,
)
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
correction_status = sa.Enum(
    "DRAFT",
    "SUBMITTED",
    "APPLIED",
    "SUPERSEDED",
    name="correctionstatus",
    native_enum=False,
    length=32,
)
review_decision_type = sa.Enum(
    "APPROVE",
    "REJECT",
    "REQUEST_CHANGES",
    "MODIFY_AND_APPROVE",
    name="reviewdecisiontype",
    native_enum=False,
    length=32,
)
audit_event_type = sa.Enum(
    "VALIDATION_JOB_CREATED",
    "VALIDATION_RESULT_RECORDED",
    "REVIEW_TASK_CREATED",
    "REVIEW_TASK_ASSIGNED",
    "CORRECTION_SUBMITTED",
    "REVIEW_DECISION_RECORDED",
    "PUBLISH_JOB_CREATED",
    "PUBLISH_JOB_COMPLETED",
    "PUBLISHED_GRAPH_VERSION_CREATED",
    "PUBLISHED_GRAPH_CURRENT_POINTER_UPDATED",
    name="auditeventtype",
    native_enum=False,
    length=80,
)
publish_job_status = sa.Enum(
    "PENDING",
    "RUNNING",
    "SUCCESS",
    "PARTIAL_FAILED",
    "FAILED",
    name="publishjobstatus",
    native_enum=False,
    length=32,
)


def upgrade() -> None:
    op.create_table(
        "validation_jobs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("ontology_version_id", sa.String(length=36), nullable=False),
        sa.Column("source_id", sa.String(length=36), nullable=True),
        sa.Column("extraction_job_id", sa.String(length=36), nullable=True),
        sa.Column("status", validation_job_status, nullable=False),
        sa.Column("requested_by", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("summary", sa.JSON(), nullable=False),
        sa.Column("error_code", sa.String(length=120), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["extraction_job_id"], ["extraction_jobs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["ontology_version_id"], ["ontology_versions.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_id"], ["source_data.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_validation_jobs_project_id"), "validation_jobs", ["project_id"])
    op.create_index(
        op.f("ix_validation_jobs_ontology_version_id"),
        "validation_jobs",
        ["ontology_version_id"],
    )
    op.create_index(op.f("ix_validation_jobs_source_id"), "validation_jobs", ["source_id"])
    op.create_index(
        op.f("ix_validation_jobs_extraction_job_id"),
        "validation_jobs",
        ["extraction_job_id"],
    )
    op.create_index(op.f("ix_validation_jobs_status"), "validation_jobs", ["status"])

    op.create_table(
        "validation_results",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("validation_job_id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("ontology_version_id", sa.String(length=36), nullable=False),
        sa.Column("candidate_kind", candidate_kind, nullable=False),
        sa.Column("candidate_id", sa.String(length=36), nullable=False),
        sa.Column("rule_code", validation_rule_code, nullable=False),
        sa.Column("severity", validation_result_severity, nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("field_path", sa.String(length=255), nullable=False),
        sa.Column("blocking", sa.Boolean(), nullable=False),
        sa.Column("suggested_fix", sa.Text(), nullable=True),
        sa.Column("details", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["ontology_version_id"], ["ontology_versions.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["validation_job_id"], ["validation_jobs.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_validation_results_validation_job_id"),
        "validation_results",
        ["validation_job_id"],
    )
    op.create_index(op.f("ix_validation_results_project_id"), "validation_results", ["project_id"])
    op.create_index(
        op.f("ix_validation_results_ontology_version_id"),
        "validation_results",
        ["ontology_version_id"],
    )
    op.create_index(
        op.f("ix_validation_results_candidate_kind"),
        "validation_results",
        ["candidate_kind"],
    )
    op.create_index(
        op.f("ix_validation_results_candidate_id"),
        "validation_results",
        ["candidate_id"],
    )
    op.create_index(
        op.f("ix_validation_results_rule_code"),
        "validation_results",
        ["rule_code"],
    )
    op.create_index(op.f("ix_validation_results_severity"), "validation_results", ["severity"])

    op.create_table(
        "review_tasks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("candidate_kind", candidate_kind, nullable=False),
        sa.Column("candidate_id", sa.String(length=36), nullable=False),
        sa.Column("ontology_version_id", sa.String(length=36), nullable=False),
        sa.Column("source_id", sa.String(length=36), nullable=True),
        sa.Column("extraction_job_id", sa.String(length=36), nullable=True),
        sa.Column("status", review_task_status, nullable=False),
        sa.Column("assignee_id", sa.String(length=100), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=False),
        sa.Column("validation_status", validation_status, nullable=False),
        sa.Column("validation_codes", sa.JSON(), nullable=False),
        sa.Column("priority_reason", sa.Text(), nullable=True),
        sa.Column("candidate_display_name", sa.String(length=255), nullable=True),
        sa.Column("assignee_display_name", sa.String(length=255), nullable=True),
        sa.Column("evidence_count", sa.Integer(), nullable=False),
        sa.Column("evidence_state", sa.String(length=32), nullable=True),
        sa.Column("top_validation_message", sa.Text(), nullable=True),
        sa.Column("last_decision_summary", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["extraction_job_id"], ["extraction_jobs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["ontology_version_id"], ["ontology_versions.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_id"], ["source_data.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "project_id",
            "candidate_kind",
            "candidate_id",
            name="uq_review_task_project_candidate",
        ),
    )
    op.create_index(op.f("ix_review_tasks_project_id"), "review_tasks", ["project_id"])
    op.create_index(op.f("ix_review_tasks_candidate_kind"), "review_tasks", ["candidate_kind"])
    op.create_index(op.f("ix_review_tasks_candidate_id"), "review_tasks", ["candidate_id"])
    op.create_index(
        op.f("ix_review_tasks_ontology_version_id"),
        "review_tasks",
        ["ontology_version_id"],
    )
    op.create_index(op.f("ix_review_tasks_source_id"), "review_tasks", ["source_id"])
    op.create_index(
        op.f("ix_review_tasks_extraction_job_id"),
        "review_tasks",
        ["extraction_job_id"],
    )
    op.create_index(op.f("ix_review_tasks_status"), "review_tasks", ["status"])
    op.create_index(op.f("ix_review_tasks_assignee_id"), "review_tasks", ["assignee_id"])
    op.create_index(
        op.f("ix_review_tasks_validation_status"),
        "review_tasks",
        ["validation_status"],
    )

    op.create_table(
        "candidate_corrections",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("candidate_kind", candidate_kind, nullable=False),
        sa.Column("candidate_id", sa.String(length=36), nullable=False),
        sa.Column("review_task_id", sa.String(length=36), nullable=False),
        sa.Column("base_candidate_snapshot", sa.JSON(), nullable=False),
        sa.Column("corrected_payload", sa.JSON(), nullable=False),
        sa.Column("correction_diff", sa.JSON(), nullable=False),
        sa.Column("status", correction_status, nullable=False),
        sa.Column("created_by", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["review_task_id"], ["review_tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_candidate_corrections_project_id"),
        "candidate_corrections",
        ["project_id"],
    )
    op.create_index(
        op.f("ix_candidate_corrections_candidate_kind"),
        "candidate_corrections",
        ["candidate_kind"],
    )
    op.create_index(
        op.f("ix_candidate_corrections_candidate_id"),
        "candidate_corrections",
        ["candidate_id"],
    )
    op.create_index(
        op.f("ix_candidate_corrections_review_task_id"),
        "candidate_corrections",
        ["review_task_id"],
    )
    op.create_index(op.f("ix_candidate_corrections_status"), "candidate_corrections", ["status"])

    op.create_table(
        "review_decisions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("review_task_id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("candidate_kind", candidate_kind, nullable=False),
        sa.Column("candidate_id", sa.String(length=36), nullable=False),
        sa.Column("decision", review_decision_type, nullable=False),
        sa.Column("resulting_review_status", candidate_review_status, nullable=False),
        sa.Column("reviewer_id", sa.String(length=100), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("before_snapshot", sa.JSON(), nullable=False),
        sa.Column("correction_id", sa.String(length=36), nullable=True),
        sa.Column("correction_diff", sa.JSON(), nullable=False),
        sa.Column("validation_summary", sa.JSON(), nullable=False),
        sa.Column("publish_eligibility", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["correction_id"], ["candidate_corrections.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["review_task_id"], ["review_tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_review_decisions_review_task_id"), "review_decisions", ["review_task_id"])
    op.create_index(op.f("ix_review_decisions_project_id"), "review_decisions", ["project_id"])
    op.create_index(
        op.f("ix_review_decisions_candidate_kind"),
        "review_decisions",
        ["candidate_kind"],
    )
    op.create_index(op.f("ix_review_decisions_candidate_id"), "review_decisions", ["candidate_id"])
    op.create_index(op.f("ix_review_decisions_decision"), "review_decisions", ["decision"])
    op.create_index(
        op.f("ix_review_decisions_resulting_review_status"),
        "review_decisions",
        ["resulting_review_status"],
    )

    op.create_table(
        "publish_jobs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("ontology_version_id", sa.String(length=36), nullable=False),
        sa.Column("status", publish_job_status, nullable=False),
        sa.Column("requested_by", sa.String(length=100), nullable=True),
        sa.Column("candidate_refs", sa.JSON(), nullable=False),
        sa.Column("eligible_count", sa.Integer(), nullable=False),
        sa.Column("published_entity_count", sa.Integer(), nullable=False),
        sa.Column("published_relation_count", sa.Integer(), nullable=False),
        sa.Column("skipped_count", sa.Integer(), nullable=False),
        sa.Column("skip_reasons", sa.JSON(), nullable=False),
        sa.Column("published_graph_version_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_code", sa.String(length=120), nullable=True),
        sa.Column("error_message", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(
            ["ontology_version_id"], ["ontology_versions.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_publish_jobs_project_id"), "publish_jobs", ["project_id"])
    op.create_index(
        op.f("ix_publish_jobs_ontology_version_id"),
        "publish_jobs",
        ["ontology_version_id"],
    )
    op.create_index(op.f("ix_publish_jobs_status"), "publish_jobs", ["status"])
    op.create_index(
        op.f("ix_publish_jobs_published_graph_version_id"),
        "publish_jobs",
        ["published_graph_version_id"],
    )

    op.create_table(
        "published_graph_versions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("ontology_version_id", sa.String(length=36), nullable=False),
        sa.Column("publish_job_id", sa.String(length=36), nullable=False),
        sa.Column("is_current", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("summary", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(
            ["ontology_version_id"], ["ontology_versions.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["publish_job_id"], ["publish_jobs.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "version", name="uq_published_graph_version_project"),
    )
    op.create_index(
        op.f("ix_published_graph_versions_project_id"),
        "published_graph_versions",
        ["project_id"],
    )
    op.create_index(
        op.f("ix_published_graph_versions_ontology_version_id"),
        "published_graph_versions",
        ["ontology_version_id"],
    )
    op.create_index(
        op.f("ix_published_graph_versions_publish_job_id"),
        "published_graph_versions",
        ["publish_job_id"],
    )
    op.create_index(
        op.f("ix_published_graph_versions_is_current"),
        "published_graph_versions",
        ["is_current"],
    )

    op.create_table(
        "published_entities",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("published_graph_version_id", sa.String(length=36), nullable=False),
        sa.Column("ontology_version_id", sa.String(length=36), nullable=False),
        sa.Column("class_id", sa.String(length=36), nullable=False),
        sa.Column("canonical_name", sa.String(length=255), nullable=False),
        sa.Column("properties", sa.JSON(), nullable=False),
        sa.Column("source_candidate_entity_ids", sa.JSON(), nullable=False),
        sa.Column("original_snapshot", sa.JSON(), nullable=True),
        sa.Column("corrected_snapshot", sa.JSON(), nullable=True),
        sa.Column("lineage", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["ontology_version_id"], ["ontology_versions.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["published_graph_version_id"], ["published_graph_versions.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_published_entities_project_id"), "published_entities", ["project_id"])
    op.create_index(
        op.f("ix_published_entities_published_graph_version_id"),
        "published_entities",
        ["published_graph_version_id"],
    )
    op.create_index(
        op.f("ix_published_entities_ontology_version_id"),
        "published_entities",
        ["ontology_version_id"],
    )
    op.create_index(op.f("ix_published_entities_class_id"), "published_entities", ["class_id"])
    op.create_index(
        op.f("ix_published_entities_canonical_name"),
        "published_entities",
        ["canonical_name"],
    )

    op.create_table(
        "published_relations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("published_graph_version_id", sa.String(length=36), nullable=False),
        sa.Column("ontology_version_id", sa.String(length=36), nullable=False),
        sa.Column("source_published_entity_id", sa.String(length=36), nullable=False),
        sa.Column("relation_id", sa.String(length=36), nullable=False),
        sa.Column("target_published_entity_id", sa.String(length=36), nullable=False),
        sa.Column("properties", sa.JSON(), nullable=False),
        sa.Column("source_candidate_relation_ids", sa.JSON(), nullable=False),
        sa.Column("original_snapshot", sa.JSON(), nullable=True),
        sa.Column("corrected_snapshot", sa.JSON(), nullable=True),
        sa.Column("lineage", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["ontology_version_id"], ["ontology_versions.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["published_graph_version_id"], ["published_graph_versions.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_published_relations_project_id"), "published_relations", ["project_id"])
    op.create_index(
        op.f("ix_published_relations_published_graph_version_id"),
        "published_relations",
        ["published_graph_version_id"],
    )
    op.create_index(
        op.f("ix_published_relations_ontology_version_id"),
        "published_relations",
        ["ontology_version_id"],
    )
    op.create_index(
        op.f("ix_published_relations_source_published_entity_id"),
        "published_relations",
        ["source_published_entity_id"],
    )
    op.create_index(
        op.f("ix_published_relations_relation_id"),
        "published_relations",
        ["relation_id"],
    )
    op.create_index(
        op.f("ix_published_relations_target_published_entity_id"),
        "published_relations",
        ["target_published_entity_id"],
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("event_type", audit_event_type, nullable=False),
        sa.Column("actor_id", sa.String(length=100), nullable=True),
        sa.Column("candidate_kind", candidate_kind, nullable=True),
        sa.Column("candidate_id", sa.String(length=36), nullable=True),
        sa.Column("review_task_id", sa.String(length=36), nullable=True),
        sa.Column("review_decision_id", sa.String(length=36), nullable=True),
        sa.Column("validation_job_id", sa.String(length=36), nullable=True),
        sa.Column("publish_job_id", sa.String(length=36), nullable=True),
        sa.Column("published_graph_version_id", sa.String(length=36), nullable=True),
        sa.Column("original_snapshot", sa.JSON(), nullable=True),
        sa.Column("corrected_snapshot", sa.JSON(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["publish_job_id"], ["publish_jobs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["published_graph_version_id"],
            ["published_graph_versions.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["review_decision_id"], ["review_decisions.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["review_task_id"], ["review_tasks.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["validation_job_id"], ["validation_jobs.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_logs_project_id"), "audit_logs", ["project_id"])
    op.create_index(op.f("ix_audit_logs_event_type"), "audit_logs", ["event_type"])
    op.create_index(op.f("ix_audit_logs_actor_id"), "audit_logs", ["actor_id"])
    op.create_index(op.f("ix_audit_logs_candidate_kind"), "audit_logs", ["candidate_kind"])
    op.create_index(op.f("ix_audit_logs_candidate_id"), "audit_logs", ["candidate_id"])
    op.create_index(op.f("ix_audit_logs_review_task_id"), "audit_logs", ["review_task_id"])
    op.create_index(op.f("ix_audit_logs_validation_job_id"), "audit_logs", ["validation_job_id"])
    op.create_index(op.f("ix_audit_logs_publish_job_id"), "audit_logs", ["publish_job_id"])
    op.create_index(
        op.f("ix_audit_logs_published_graph_version_id"),
        "audit_logs",
        ["published_graph_version_id"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_logs_published_graph_version_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_publish_job_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_validation_job_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_review_task_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_candidate_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_candidate_kind"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_actor_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_event_type"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_project_id"), table_name="audit_logs")
    op.drop_table("audit_logs")

    op.drop_index(op.f("ix_published_relations_target_published_entity_id"), table_name="published_relations")
    op.drop_index(op.f("ix_published_relations_relation_id"), table_name="published_relations")
    op.drop_index(op.f("ix_published_relations_source_published_entity_id"), table_name="published_relations")
    op.drop_index(op.f("ix_published_relations_ontology_version_id"), table_name="published_relations")
    op.drop_index(op.f("ix_published_relations_published_graph_version_id"), table_name="published_relations")
    op.drop_index(op.f("ix_published_relations_project_id"), table_name="published_relations")
    op.drop_table("published_relations")

    op.drop_index(op.f("ix_published_entities_canonical_name"), table_name="published_entities")
    op.drop_index(op.f("ix_published_entities_class_id"), table_name="published_entities")
    op.drop_index(op.f("ix_published_entities_ontology_version_id"), table_name="published_entities")
    op.drop_index(op.f("ix_published_entities_published_graph_version_id"), table_name="published_entities")
    op.drop_index(op.f("ix_published_entities_project_id"), table_name="published_entities")
    op.drop_table("published_entities")

    op.drop_index(op.f("ix_published_graph_versions_is_current"), table_name="published_graph_versions")
    op.drop_index(op.f("ix_published_graph_versions_publish_job_id"), table_name="published_graph_versions")
    op.drop_index(op.f("ix_published_graph_versions_ontology_version_id"), table_name="published_graph_versions")
    op.drop_index(op.f("ix_published_graph_versions_project_id"), table_name="published_graph_versions")
    op.drop_table("published_graph_versions")

    op.drop_index(op.f("ix_publish_jobs_published_graph_version_id"), table_name="publish_jobs")
    op.drop_index(op.f("ix_publish_jobs_status"), table_name="publish_jobs")
    op.drop_index(op.f("ix_publish_jobs_ontology_version_id"), table_name="publish_jobs")
    op.drop_index(op.f("ix_publish_jobs_project_id"), table_name="publish_jobs")
    op.drop_table("publish_jobs")

    op.drop_index(op.f("ix_review_decisions_resulting_review_status"), table_name="review_decisions")
    op.drop_index(op.f("ix_review_decisions_decision"), table_name="review_decisions")
    op.drop_index(op.f("ix_review_decisions_candidate_id"), table_name="review_decisions")
    op.drop_index(op.f("ix_review_decisions_candidate_kind"), table_name="review_decisions")
    op.drop_index(op.f("ix_review_decisions_project_id"), table_name="review_decisions")
    op.drop_index(op.f("ix_review_decisions_review_task_id"), table_name="review_decisions")
    op.drop_table("review_decisions")

    op.drop_index(op.f("ix_candidate_corrections_status"), table_name="candidate_corrections")
    op.drop_index(op.f("ix_candidate_corrections_review_task_id"), table_name="candidate_corrections")
    op.drop_index(op.f("ix_candidate_corrections_candidate_id"), table_name="candidate_corrections")
    op.drop_index(op.f("ix_candidate_corrections_candidate_kind"), table_name="candidate_corrections")
    op.drop_index(op.f("ix_candidate_corrections_project_id"), table_name="candidate_corrections")
    op.drop_table("candidate_corrections")

    op.drop_index(op.f("ix_review_tasks_validation_status"), table_name="review_tasks")
    op.drop_index(op.f("ix_review_tasks_assignee_id"), table_name="review_tasks")
    op.drop_index(op.f("ix_review_tasks_status"), table_name="review_tasks")
    op.drop_index(op.f("ix_review_tasks_extraction_job_id"), table_name="review_tasks")
    op.drop_index(op.f("ix_review_tasks_source_id"), table_name="review_tasks")
    op.drop_index(op.f("ix_review_tasks_ontology_version_id"), table_name="review_tasks")
    op.drop_index(op.f("ix_review_tasks_candidate_id"), table_name="review_tasks")
    op.drop_index(op.f("ix_review_tasks_candidate_kind"), table_name="review_tasks")
    op.drop_index(op.f("ix_review_tasks_project_id"), table_name="review_tasks")
    op.drop_table("review_tasks")

    op.drop_index(op.f("ix_validation_results_severity"), table_name="validation_results")
    op.drop_index(op.f("ix_validation_results_rule_code"), table_name="validation_results")
    op.drop_index(op.f("ix_validation_results_candidate_id"), table_name="validation_results")
    op.drop_index(op.f("ix_validation_results_candidate_kind"), table_name="validation_results")
    op.drop_index(op.f("ix_validation_results_ontology_version_id"), table_name="validation_results")
    op.drop_index(op.f("ix_validation_results_project_id"), table_name="validation_results")
    op.drop_index(op.f("ix_validation_results_validation_job_id"), table_name="validation_results")
    op.drop_table("validation_results")

    op.drop_index(op.f("ix_validation_jobs_status"), table_name="validation_jobs")
    op.drop_index(op.f("ix_validation_jobs_extraction_job_id"), table_name="validation_jobs")
    op.drop_index(op.f("ix_validation_jobs_source_id"), table_name="validation_jobs")
    op.drop_index(op.f("ix_validation_jobs_ontology_version_id"), table_name="validation_jobs")
    op.drop_index(op.f("ix_validation_jobs_project_id"), table_name="validation_jobs")
    op.drop_table("validation_jobs")
