from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.core.enums import (
    CandidateKind,
    CandidateReviewStatus,
    PublishEligibilityReasonCode,
    PublishJobStatus,
    PublishStatus,
    ReviewDecisionType,
    ValidationStatus,
)
from app.modules.validation.schemas import CandidateRef


class EvidenceRef(BaseModel):
    evidence_id: str
    source_id: str | None = None
    source_segment_id: str | None = None
    label: str | None = None


class PublishEligibility(BaseModel):
    candidate_kind: CandidateKind
    candidate_id: str
    eligible: bool
    reasons: list[PublishEligibilityReasonCode]
    review_status: CandidateReviewStatus
    publish_status: PublishStatus
    validation_status: ValidationStatus
    has_evidence: bool
    has_warning_reason: bool


class PublishJobCreateRequest(BaseModel):
    ontology_version_id: str
    candidate_refs: list[CandidateRef]
    dry_run: bool = False


class PublishJob(BaseModel):
    id: str
    project_id: str
    ontology_version_id: str
    status: PublishJobStatus
    requested_by: str | None = None
    candidate_refs: list[CandidateRef]
    eligible_count: int
    published_entity_count: int
    published_relation_count: int
    skipped_count: int
    skip_reasons: list[PublishEligibility]
    published_graph_version_id: str | None = None
    created_at: datetime
    started_at: datetime | None = None
    ended_at: datetime | None = None
    error_code: str | None = None
    error_message: str | None = None


class PublishedGraphVersion(BaseModel):
    id: str
    project_id: str
    version: int
    ontology_version_id: str
    publish_job_id: str
    is_current: bool
    created_by: str | None = None
    created_at: datetime
    summary: dict[str, Any] = Field(default_factory=dict)


class PublishedLineage(BaseModel):
    publish_job_id: str
    published_graph_version_id: str
    published_graph_version: int
    ontology_version_id: str
    candidate_kind: CandidateKind
    candidate_id: str
    original_snapshot: dict[str, Any] | None = None
    original_snapshot_ref: str | None = None
    corrected_snapshot: dict[str, Any] | None = None
    evidence_refs: list[EvidenceRef]
    reviewer_id: str
    reviewer_display_name: str | None = None
    review_decision_id: str
    review_decision_type: ReviewDecisionType
    reason: str | None = None
    reviewed_at: datetime
    published_at: datetime


class PublishedEntity(BaseModel):
    id: str
    project_id: str
    published_graph_version_id: str
    ontology_version_id: str
    class_id: str
    canonical_name: str
    properties: dict[str, Any]
    source_candidate_entity_ids: list[str]
    original_snapshot: dict[str, Any] | None = None
    corrected_snapshot: dict[str, Any] | None = None
    lineage: PublishedLineage
    created_at: datetime


class PublishedRelation(BaseModel):
    id: str
    project_id: str
    published_graph_version_id: str
    ontology_version_id: str
    source_published_entity_id: str
    relation_id: str
    target_published_entity_id: str
    properties: dict[str, Any]
    source_candidate_relation_ids: list[str]
    original_snapshot: dict[str, Any] | None = None
    corrected_snapshot: dict[str, Any] | None = None
    lineage: PublishedLineage
    created_at: datetime


class PublishedGraphSnapshot(BaseModel):
    version: PublishedGraphVersion
    entities: list[PublishedEntity]
    relations: list[PublishedRelation]
