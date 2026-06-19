from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.core.enums import (
    CandidateKind,
    CandidateReviewStatus,
    CorrectionStatus,
    ReviewDecisionType,
    ReviewTaskStatus,
    ValidationStatus,
)
from app.modules.publish.schemas import PublishEligibility
from app.modules.validation.schemas import CandidateRef, ValidationResult, ValidationSummary


class ReviewTaskCreateRequest(BaseModel):
    candidate_refs: list[CandidateRef]
    assignee_id: str | None = None
    priority: int = Field(default=3, ge=0, le=5)


class ReviewTaskAssignRequest(BaseModel):
    assignee_id: str


class ReviewTask(BaseModel):
    id: str
    project_id: str
    candidate_kind: CandidateKind
    candidate_id: str
    ontology_version_id: str
    source_id: str | None = None
    extraction_job_id: str | None = None
    status: ReviewTaskStatus
    assignee_id: str | None = None
    priority: int
    validation_status: ValidationStatus
    validation_codes: list[str]
    priority_reason: str | None = None
    candidate_display_name: str | None = None
    assignee_display_name: str | None = None
    evidence_count: int = 0
    evidence_state: str | None = None
    top_validation_message: str | None = None
    last_decision_summary: str | None = None
    created_at: datetime
    updated_at: datetime
    decided_at: datetime | None = None


class CorrectionDiffItem(BaseModel):
    path: str
    before: Any
    after: Any


class CandidateCorrectionCreateRequest(BaseModel):
    review_task_id: str
    corrected_payload: dict[str, Any]
    status: CorrectionStatus = CorrectionStatus.SUBMITTED


class CandidateCorrection(BaseModel):
    id: str
    project_id: str
    candidate_kind: CandidateKind
    candidate_id: str
    review_task_id: str
    base_candidate_snapshot: dict[str, Any]
    corrected_payload: dict[str, Any]
    correction_diff: list[CorrectionDiffItem]
    status: CorrectionStatus
    created_by: str
    created_at: datetime
    updated_at: datetime


class ReviewDecisionCreateRequest(BaseModel):
    decision: ReviewDecisionType
    reason: str | None = None
    correction_id: str | None = None
    corrected_payload: dict[str, Any] | None = None


class ReviewDecision(BaseModel):
    id: str
    review_task_id: str
    project_id: str
    candidate_kind: CandidateKind
    candidate_id: str
    decision: ReviewDecisionType
    resulting_review_status: CandidateReviewStatus
    reviewer_id: str
    reason: str | None = None
    before_snapshot: dict[str, Any]
    correction_id: str | None = None
    correction_diff: list[CorrectionDiffItem]
    validation_summary: ValidationSummary
    publish_eligibility: PublishEligibility
    created_at: datetime


class ReviewTaskDetail(ReviewTask):
    candidate_snapshot: dict[str, Any] = Field(default_factory=dict)
    validation_results: list[ValidationResult] = Field(default_factory=list)
    corrections: list[CandidateCorrection] = Field(default_factory=list)
    decisions: list[ReviewDecision] = Field(default_factory=list)


class ReviewTaskListResponse(BaseModel):
    items: list[ReviewTask]
    total_count: int
    limit: int
    offset: int
