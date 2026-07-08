from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums (copilot-scoped; mirror MVP6.2 vocabulary values, no rename of the
# reused MVP6.2 / governance enums which are referenced by value only).
# ---------------------------------------------------------------------------


class CopilotSuggestionKind(str, Enum):
    DRAFT_GOVERNANCE_CHANGE_REQUEST = "DRAFT_GOVERNANCE_CHANGE_REQUEST"
    REVIEW_THESE_CANDIDATES = "REVIEW_THESE_CANDIDATES"
    INSPECT_QUALITY_OR_VALIDATION_SIGNAL = "INSPECT_QUALITY_OR_VALIDATION_SIGNAL"
    RUN_IMPACT_SIMULATION = "RUN_IMPACT_SIMULATION"


class CopilotSuggestionState(str, Enum):
    SUGGESTED = "SUGGESTED"
    ACCEPTED = "ACCEPTED"
    DISMISSED = "DISMISSED"
    SUPERSEDED = "SUPERSEDED"


class CopilotDecisionCommand(str, Enum):
    ACCEPT = "ACCEPT"
    DISMISS = "DISMISS"


class CopilotDismissReasonCode(str, Enum):
    NOT_RELEVANT = "NOT_RELEVANT"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    DUPLICATE = "DUPLICATE"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    RISK_TOO_HIGH = "RISK_TOO_HIGH"
    OTHER = "OTHER"


class CopilotRoutingTargetKind(str, Enum):
    GOVERNANCE_CHANGE_REQUEST_DRAFT = "GOVERNANCE_CHANGE_REQUEST_DRAFT"
    CANDIDATE_REVIEW_LOCATION = "CANDIDATE_REVIEW_LOCATION"
    QUALITY_OR_VALIDATION_LOCATION = "QUALITY_OR_VALIDATION_LOCATION"
    IMPACT_REPORT_LOCATION = "IMPACT_REPORT_LOCATION"


class CopilotConfidenceLabel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class CopilotRiskLabel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class CopilotSourceArtifactType(str, Enum):
    REVIEW_DECISION = "REVIEW_DECISION"
    REVIEW_CORRECTION = "REVIEW_CORRECTION"
    VALIDATION_RESULT = "VALIDATION_RESULT"
    QUALITY_METRIC = "QUALITY_METRIC"
    QUALITY_DRILLDOWN = "QUALITY_DRILLDOWN"
    EVALUATION_RUN = "EVALUATION_RUN"
    EVALUATION_METRIC = "EVALUATION_METRIC"
    EVALUATION_ERROR_CASE = "EVALUATION_ERROR_CASE"
    LEARNING_SIGNAL = "LEARNING_SIGNAL"
    CANDIDATE = "CANDIDATE"
    GOVERNANCE_CHANGE_REQUEST = "GOVERNANCE_CHANGE_REQUEST"
    IMPACT_REPORT = "IMPACT_REPORT"


# ---------------------------------------------------------------------------
# All-false mutation guard (14 flags). Every flag is const false, always.
# ---------------------------------------------------------------------------


class CopilotMutationGuard(BaseModel):
    ontology_draft_mutated: Literal[False] = False
    ontology_published_mutated: Literal[False] = False
    candidate_graph_mutated: Literal[False] = False
    published_graph_mutated: Literal[False] = False
    prompt_version_mutated: Literal[False] = False
    governance_state_mutated: Literal[False] = False
    change_request_created: Literal[False] = False
    change_request_applied: Literal[False] = False
    candidate_approved_or_published: Literal[False] = False
    extraction_job_started: Literal[False] = False
    evaluation_run_started: Literal[False] = False
    auto_approval_policy_mutated: Literal[False] = False
    copilot_executed_action: Literal[False] = False
    real_model_invoked: Literal[False] = False


# ---------------------------------------------------------------------------
# Grounding refs (reused by reference from MVP6.2 / governance shapes).
# ---------------------------------------------------------------------------


class CopilotEvidenceRef(BaseModel):
    source_id: str
    source_segment_id: str | None = None
    locator: str | None = None
    quote: str | None = None


class CopilotSourceArtifactRef(BaseModel):
    artifact_type: CopilotSourceArtifactType
    artifact_id: str
    project_id: str
    candidate_id: str | None = None
    candidate_kind: str | None = None
    review_task_id: str | None = None
    review_decision_id: str | None = None
    validation_result_id: str | None = None
    quality_metric_id: str | None = None
    evaluation_run_id: str | None = None
    evaluation_error_case_id: str | None = None
    learning_signal_id: str | None = None
    governance_change_request_id: str | None = None
    impact_report_id: str | None = None
    ontology_version_id: str | None = None
    prompt_version_id: str | None = None
    model_run_id: str | None = None
    evidence_refs: list[CopilotEvidenceRef] = Field(default_factory=list)
    observed_at: datetime | None = None


# Named CopilotOntologyElementRef to avoid a component-name collision with the
# governance application module's unrelated OntologyElementRef (different shape).
# The field shape (element_kind/element_id/label) matches the frozen draft's
# OntologyElementRef exactly.
class CopilotOntologyElementRef(BaseModel):
    element_kind: str
    element_id: str
    label: str | None = None


class GovernanceChangeRequestDraftPrefill(BaseModel):
    target_kind: str
    change_type: str
    ontology_version_id: str | None = None
    element_refs: list[CopilotOntologyElementRef] = Field(default_factory=list)
    proposed_title: str | None = None
    proposed_rationale: str | None = None


class CopilotRoutingTarget(BaseModel):
    kind: CopilotRoutingTargetKind
    deep_link: str
    target_ref: dict[str, Any] = Field(default_factory=dict)
    governance_change_request_draft_prefill: GovernanceChangeRequestDraftPrefill | None = None
    executes_nothing: Literal[True] = True
    human_gate_note: str


class CopilotDecisionAuditNote(BaseModel):
    id: str
    suggestion_id: str
    project_id: str
    actor_id: str
    actor_role: str
    decision: CopilotDecisionCommand
    dismiss_reason_code: CopilotDismissReasonCode | None = None
    note: str | None = None
    decided_at: datetime
    suggestion_snapshot: "CopilotSuggestionSnapshot"
    source_artifact_ids: list[str] = Field(default_factory=list)
    routing_target: CopilotRoutingTarget | None = None
    mutation_guard: CopilotMutationGuard = Field(default_factory=CopilotMutationGuard)


class CopilotSuggestionSnapshot(BaseModel):
    kind: CopilotSuggestionKind
    title: str
    rationale: str
    confidence_label: CopilotConfidenceLabel
    risk_label: CopilotRiskLabel


class CopilotSuggestion(BaseModel):
    id: str
    project_id: str
    kind: CopilotSuggestionKind
    state: CopilotSuggestionState
    title: str
    rationale: str
    expected_next_step: str
    routing_target: CopilotRoutingTarget
    source_artifacts: list[CopilotSourceArtifactRef] = Field(min_length=1)
    confidence_label: CopilotConfidenceLabel
    risk_label: CopilotRiskLabel
    created_at: datetime
    updated_at: datetime
    decision_audit_note: CopilotDecisionAuditNote | None = None
    safety_note: str


class CopilotSuggestionKindCount(BaseModel):
    kind: CopilotSuggestionKind
    count: int = Field(ge=0)
    high_risk_count: int = Field(ge=0)


class CopilotSummaryResponse(BaseModel):
    project_id: str
    generated_at: datetime
    source_artifact_scope: list[CopilotSourceArtifactType] = Field(default_factory=list)
    total_suggestion_count: int = Field(ge=0)
    suggested_count: int = Field(ge=0)
    accepted_count: int = Field(ge=0)
    dismissed_count: int = Field(ge=0)
    superseded_count: int = Field(ge=0)
    high_risk_count: int = Field(ge=0)
    counts_by_kind: list[CopilotSuggestionKindCount] = Field(default_factory=list)
    advisory_notes: list[str] = Field(default_factory=list)
    mutation_guard: CopilotMutationGuard = Field(default_factory=CopilotMutationGuard)


class CopilotSuggestionListResponse(BaseModel):
    project_id: str
    items: list[CopilotSuggestion] = Field(default_factory=list)
    next_cursor: str | None = None
    mutation_guard: CopilotMutationGuard = Field(default_factory=CopilotMutationGuard)


class CopilotSuggestionDetailResponse(BaseModel):
    suggestion: CopilotSuggestion
    mutation_guard: CopilotMutationGuard = Field(default_factory=CopilotMutationGuard)


class CopilotSuggestionDecisionRequest(BaseModel):
    decision: CopilotDecisionCommand
    dismiss_reason_code: CopilotDismissReasonCode | None = None
    note: str | None = None
    client_request_id: str | None = None


class CopilotSuggestionDecisionResponse(BaseModel):
    suggestion_id: str
    project_id: str
    previous_state: CopilotSuggestionState
    new_state: CopilotSuggestionState
    decision_audit_note: CopilotDecisionAuditNote
    routing_target: CopilotRoutingTarget | None = None
    mutation_guard: CopilotMutationGuard = Field(default_factory=CopilotMutationGuard)


CopilotDecisionAuditNote.model_rebuild()
