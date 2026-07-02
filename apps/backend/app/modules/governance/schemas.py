from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from app.core.enums import Role

# ---------------------------------------------------------------------------
# Frozen MVP6.5 enums (verbatim from openapi-mvp6-5-draft.json).
# MVP3 ReviewDecisionType literals (APPROVE/REJECT/REQUEST_CHANGES) + Role are
# reused by reference from app.core.enums; NOT renamed / redefined here.
# ---------------------------------------------------------------------------


class OntologyChangeRequestStatus(str, Enum):
    DRAFT = "DRAFT"
    OPEN = "OPEN"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"


class GovernanceApplicationState(str, Enum):
    NOT_APPLICABLE = "NOT_APPLICABLE"
    QUEUED = "QUEUED"
    APPLIED = "APPLIED"
    SUPERSEDED = "SUPERSEDED"


class GovernanceReviewAction(str, Enum):
    COMMENT = "COMMENT"
    REQUEST_CHANGES = "REQUEST_CHANGES"
    APPROVE = "APPROVE"
    REJECT = "REJECT"


class ChangeRequestTargetKind(str, Enum):
    CLASS = "CLASS"
    PROPERTY = "PROPERTY"
    RELATION = "RELATION"


class ChangeRequestChangeType(str, Enum):
    ADD = "ADD"
    MODIFY = "MODIFY"
    DEPRECATE = "DEPRECATE"


class GovernanceAuditAction(str, Enum):
    CHANGE_REQUEST_CREATED = "CHANGE_REQUEST_CREATED"
    CHANGE_REQUEST_UPDATED = "CHANGE_REQUEST_UPDATED"
    CHANGE_REQUEST_SUBMITTED = "CHANGE_REQUEST_SUBMITTED"
    CHANGE_REQUEST_WITHDRAWN = "CHANGE_REQUEST_WITHDRAWN"
    REVIEW_STARTED = "REVIEW_STARTED"
    COMMENT_ADDED = "COMMENT_ADDED"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"
    CHANGE_REQUEST_APPROVED = "CHANGE_REQUEST_APPROVED"
    CHANGE_REQUEST_REJECTED = "CHANGE_REQUEST_REJECTED"


# ---------------------------------------------------------------------------
# Guard + capability hint
# ---------------------------------------------------------------------------


class GovernanceMutationGuard(BaseModel):
    ontology_definition_mutated: bool = False
    published_graph_mutated: bool = False
    candidate_graph_mutated: bool = False
    prompt_version_mutated: bool = False
    publish_job_started: bool = False
    extraction_job_started: bool = False
    change_auto_applied: bool = False


class GovernanceCapabilities(BaseModel):
    can_view: bool = True
    can_edit_request: bool = False
    can_submit: bool = False
    can_withdraw: bool = False
    can_comment: bool = False
    can_request_changes: bool = False
    can_approve: bool = False
    can_reject: bool = False


# ---------------------------------------------------------------------------
# Core resources
# ---------------------------------------------------------------------------


class OntologyChangeItem(BaseModel):
    id: str
    change_request_id: str
    target_kind: ChangeRequestTargetKind
    change_type: ChangeRequestChangeType
    ontology_class_id: str | None = None
    ontology_property_id: str | None = None
    ontology_relation_id: str | None = None
    ontology_version_id: str
    proposed_change: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime | None = None


class OntologyChangeRequest(BaseModel):
    id: str
    project_id: str
    title: str
    summary: str | None = None
    status: OntologyChangeRequestStatus
    application_state: GovernanceApplicationState
    proposer_id: str
    item_count: int = 0
    ontology_version_id: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    submitted_at: datetime | None = None
    decided_at: datetime | None = None
    decided_by: str | None = None
    decision_reason: str | None = None


class GovernanceReviewDecision(BaseModel):
    id: str
    change_request_id: str
    action: GovernanceReviewAction
    actor_id: str
    actor_role: Role | None = None
    reason: str | None = None
    resulting_status: OntologyChangeRequestStatus
    resulting_application_state: GovernanceApplicationState = (
        GovernanceApplicationState.NOT_APPLICABLE
    )
    created_at: datetime


class GovernanceAuditEntry(BaseModel):
    id: str
    project_id: str
    change_request_id: str
    action: GovernanceAuditAction
    actor_id: str
    actor_role: Role | None = None
    target_item_ids: list[str] = Field(default_factory=list)
    target_ontology_element_ids: list[str] = Field(default_factory=list)
    ontology_version_id: str | None = None
    before_status: OntologyChangeRequestStatus | None = None
    after_status: OntologyChangeRequestStatus | None = None
    reason: str | None = None
    created_at: datetime


class GovernanceApplicationBanner(BaseModel):
    application_state: GovernanceApplicationState
    message: str


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------


class OntologyChangeItemRequest(BaseModel):
    target_kind: ChangeRequestTargetKind
    change_type: ChangeRequestChangeType
    ontology_class_id: str | None = None
    ontology_property_id: str | None = None
    ontology_relation_id: str | None = None
    ontology_version_id: str
    proposed_change: dict[str, Any] | None = None


class OntologyChangeRequestCreateRequest(BaseModel):
    title: str = Field(min_length=1)
    summary: str | None = None
    ontology_version_id: str | None = None
    items: list[OntologyChangeItemRequest] = Field(default_factory=list)


class OntologyChangeRequestUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    summary: str | None = None


class GovernanceWithdrawRequest(BaseModel):
    reason: str | None = None


class GovernanceReviewDecisionRequest(BaseModel):
    action: GovernanceReviewAction
    reason: str | None = None


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------


class OntologyChangeRequestDetail(BaseModel):
    change_request: OntologyChangeRequest
    items: list[OntologyChangeItem] = Field(default_factory=list)
    reviews: list[GovernanceReviewDecision] = Field(default_factory=list)
    capabilities: GovernanceCapabilities = Field(default_factory=GovernanceCapabilities)
    application_banner: GovernanceApplicationBanner | None = None


class GovernanceMutationResponse(BaseModel):
    change_request: OntologyChangeRequest
    review_decision: GovernanceReviewDecision | None = None
    audit_entry: GovernanceAuditEntry
    mutation_guard: GovernanceMutationGuard = Field(default_factory=GovernanceMutationGuard)
    capabilities: GovernanceCapabilities | None = None


class OntologyChangeRequestListResponse(BaseModel):
    items: list[OntologyChangeRequest] = Field(default_factory=list)
    total_count: int = 0
    next_cursor: str | None = None


class GovernanceAuditListResponse(BaseModel):
    items: list[GovernanceAuditEntry] = Field(default_factory=list)
    total_count: int = 0
    next_cursor: str | None = None
