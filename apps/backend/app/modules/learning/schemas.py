from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.core.enums import CandidateKind


class LearningSignalType(str, Enum):
    RELATION_DIRECTION_CORRECTION = "RELATION_DIRECTION_CORRECTION"
    CLASS_CONFUSION = "CLASS_CONFUSION"
    RELATION_TYPE_CONFUSION = "RELATION_TYPE_CONFUSION"
    EVIDENCE_MISSING = "EVIDENCE_MISSING"
    EVIDENCE_MISMATCH = "EVIDENCE_MISMATCH"
    REPEATED_VALIDATION_FAILURE = "REPEATED_VALIDATION_FAILURE"
    LOW_BENCHMARK_METRIC_CLUSTER = "LOW_BENCHMARK_METRIC_CLUSTER"


class LearningSourceArtifactType(str, Enum):
    REVIEW_DECISION = "REVIEW_DECISION"
    REVIEW_CORRECTION = "REVIEW_CORRECTION"
    VALIDATION_RESULT = "VALIDATION_RESULT"
    QUALITY_METRIC = "QUALITY_METRIC"
    QUALITY_DRILLDOWN = "QUALITY_DRILLDOWN"
    EVALUATION_RUN = "EVALUATION_RUN"
    EVALUATION_METRIC = "EVALUATION_METRIC"
    EVALUATION_ERROR_CASE = "EVALUATION_ERROR_CASE"


class PromptSuggestionKind(str, Enum):
    ADD_RELATION_DIRECTION_EXAMPLE = "ADD_RELATION_DIRECTION_EXAMPLE"
    CLARIFY_CLASS_BOUNDARY = "CLARIFY_CLASS_BOUNDARY"
    CLARIFY_RELATION_TYPE_BOUNDARY = "CLARIFY_RELATION_TYPE_BOUNDARY"
    ADD_EVIDENCE_REQUIREMENT = "ADD_EVIDENCE_REQUIREMENT"
    ADD_NEGATIVE_EXAMPLE = "ADD_NEGATIVE_EXAMPLE"
    ADD_VALIDATION_FAILURE_GUIDANCE = "ADD_VALIDATION_FAILURE_GUIDANCE"
    INVESTIGATE_LOW_METRIC_CLUSTER = "INVESTIGATE_LOW_METRIC_CLUSTER"


class PromptSuggestionState(str, Enum):
    SUGGESTED = "SUGGESTED"
    ACCEPTED = "ACCEPTED"
    DISMISSED = "DISMISSED"
    SUPERSEDED = "SUPERSEDED"


class SuggestionDecisionType(str, Enum):
    ACCEPT = "ACCEPT"
    DISMISS = "DISMISS"


class SuggestionDismissReasonCode(str, Enum):
    NOT_RELEVANT = "NOT_RELEVANT"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    DUPLICATE = "DUPLICATE"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    RISK_TOO_HIGH = "RISK_TOO_HIGH"
    OTHER = "OTHER"


class SuggestionIntendedNextAction(str, Enum):
    USE_IN_NEXT_PROMPT_DRAFT = "USE_IN_NEXT_PROMPT_DRAFT"
    DISCUSS_WITH_ONTOLOGY_OWNER = "DISCUSS_WITH_ONTOLOGY_OWNER"
    MONITOR_FOR_MORE_EVIDENCE = "MONITOR_FOR_MORE_EVIDENCE"
    NO_ACTION = "NO_ACTION"


class LearningConfidenceLabel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class LearningRiskLabel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class AutoApprovalPreviewStatus(str, Enum):
    RECOMMENDATION_ONLY = "RECOMMENDATION_ONLY"
    NOT_ENFORCED = "NOT_ENFORCED"
    REQUIRES_POLICY_APPROVAL = "REQUIRES_POLICY_APPROVAL"


class AutoApprovalHistoricalMatchOutcome(str, Enum):
    WOULD_MATCH = "WOULD_MATCH"
    WOULD_NOT_MATCH = "WOULD_NOT_MATCH"
    BLOCKED_BY_SAFETY_RULE = "BLOCKED_BY_SAFETY_RULE"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class LearningWindow(BaseModel):
    label: str
    started_at: datetime
    ended_at: datetime


class LearningSignalTypeCount(BaseModel):
    signal_type: LearningSignalType
    count: int = Field(ge=0)
    high_risk_count: int = Field(ge=0)
    latest_observed_at: datetime | None = None


class LearningPatternSummary(BaseModel):
    pattern_id: str
    primary_signal_type: LearningSignalType
    title: str
    support_count: int = Field(ge=0)
    risk_label: LearningRiskLabel


class LearningEvidenceRef(BaseModel):
    evidence_id: str | None = None
    source_id: str | None = None
    source_segment_id: str | None = None
    locator: str | None = None
    quote: str | None = None


class LearningSourceArtifactRef(BaseModel):
    artifact_type: LearningSourceArtifactType
    artifact_id: str
    project_id: str
    candidate_id: str | None = None
    candidate_kind: CandidateKind | None = None
    review_task_id: str | None = None
    review_decision_id: str | None = None
    validation_result_id: str | None = None
    quality_metric_id: str | None = None
    evaluation_run_id: str | None = None
    evaluation_error_case_id: str | None = None
    ontology_version_id: str | None = None
    prompt_version_id: str | None = None
    model_run_id: str | None = None
    evidence_refs: list[LearningEvidenceRef] = Field(default_factory=list)
    observed_at: datetime


class OntologyClassRef(BaseModel):
    class_id: str
    label: str


class OntologyRelationRef(BaseModel):
    relation_id: str
    label: str


class CorrectionPatternExample(BaseModel):
    example_id: str
    before: str | None = None
    after: str | None = None
    source_artifact_id: str


class CorrectionPattern(BaseModel):
    id: str
    project_id: str
    primary_signal_type: LearningSignalType
    related_signal_types: list[LearningSignalType]
    title: str
    affected_classes: list[OntologyClassRef] = Field(default_factory=list)
    affected_relations: list[OntologyRelationRef] = Field(default_factory=list)
    support_count: int = Field(ge=0)
    denominator: int | None = Field(default=None, ge=0)
    confidence_label: LearningConfidenceLabel
    risk_label: LearningRiskLabel
    first_seen_at: datetime
    last_seen_at: datetime
    explanation: str
    representative_examples: list[CorrectionPatternExample]
    source_learning_signal_ids: list[str]
    source_artifacts: list[LearningSourceArtifactRef]
    safety_note: str
    prompt_suggestion_ids: list[str] = Field(default_factory=list)


class LearningSignalSummaryResponse(BaseModel):
    project_id: str
    generated_at: datetime
    window: LearningWindow
    source_artifact_scope: list[LearningSourceArtifactType]
    total_signal_count: int = Field(ge=0)
    signal_counts: list[LearningSignalTypeCount]
    open_prompt_suggestion_count: int = Field(ge=0)
    accepted_prompt_suggestion_count: int = Field(ge=0)
    dismissed_prompt_suggestion_count: int = Field(ge=0)
    superseded_prompt_suggestion_count: int = Field(ge=0)
    high_risk_prompt_suggestion_count: int = Field(ge=0)
    auto_approval_preview_count: int = Field(ge=0)
    top_patterns: list[LearningPatternSummary]
    safety_notes: list[str] = Field(default_factory=list)


class SuggestionSnapshot(BaseModel):
    suggestion_kind: PromptSuggestionKind
    title: str
    preview_text: str


class MutationGuard(BaseModel):
    prompt_version_mutated: Literal[False] = False
    candidate_graph_mutated: Literal[False] = False
    published_graph_mutated: Literal[False] = False
    auto_approval_policy_mutated: Literal[False] = False
    extraction_job_started: Literal[False] = False
    evaluation_run_started: Literal[False] = False


class SuggestionDecisionAuditNote(BaseModel):
    id: str
    suggestion_id: str
    project_id: str
    actor_id: str
    actor_role: str
    decision: SuggestionDecisionType
    dismiss_reason_code: SuggestionDismissReasonCode | None = None
    note: str | None = None
    intended_next_action: SuggestionIntendedNextAction | None = None
    decided_at: datetime
    source_learning_signal_ids: list[str]
    target_prompt_version_id: str | None = None
    suggestion_snapshot: SuggestionSnapshot
    mutation_guard: MutationGuard


class PromptSuggestion(BaseModel):
    id: str
    project_id: str
    target_prompt_version_id: str | None = None
    suggestion_kind: PromptSuggestionKind
    state: PromptSuggestionState
    title: str
    rationale: str
    expected_impact: str
    preview_text: str
    structured_proposal: dict[str, Any] = Field(default_factory=dict)
    source_learning_signal_ids: list[str]
    correction_pattern_ids: list[str]
    source_artifacts: list[LearningSourceArtifactRef]
    confidence_label: LearningConfidenceLabel
    risk_label: LearningRiskLabel
    created_at: datetime
    updated_at: datetime
    decision_audit_note: SuggestionDecisionAuditNote | None = None
    safety_note: str


class SuggestionDecisionRequest(BaseModel):
    decision: SuggestionDecisionType
    dismiss_reason_code: SuggestionDismissReasonCode | None = None
    note: str | None = None
    intended_next_action: SuggestionIntendedNextAction | None = None
    client_request_id: str | None = None


class SuggestionDecisionResponse(BaseModel):
    suggestion_id: str
    project_id: str
    previous_state: PromptSuggestionState
    new_state: PromptSuggestionState
    decision_audit_note: SuggestionDecisionAuditNote


class AutoApprovalRulePreview(BaseModel):
    candidate_kind: Literal["ENTITY", "RELATION"]
    conditions: list[str]


class AutoApprovalPreviewMetric(BaseModel):
    metric_name: str
    value: float | None = None
    numerator: float | None = None
    denominator: float | None = None


class AutoApprovalHistoricalOutcomeItem(BaseModel):
    artifact_id: str
    outcome: AutoApprovalHistoricalMatchOutcome
    explanation: str


class AutoApprovalHistoricalMatchPreview(BaseModel):
    total_examined: int = Field(ge=0)
    would_match_count: int = Field(ge=0)
    blocked_count: int = Field(ge=0)
    outcomes: list[AutoApprovalHistoricalOutcomeItem]


class AutoApprovalCandidatePreview(BaseModel):
    id: str
    project_id: str
    title: str
    preview_status: AutoApprovalPreviewStatus
    recommendation_only: Literal[True] = True
    not_enforced: Literal[True] = True
    requires_later_policy_approval: Literal[True] = True
    rule_preview: AutoApprovalRulePreview
    supporting_metrics: list[AutoApprovalPreviewMetric]
    historical_match_preview: AutoApprovalHistoricalMatchPreview
    source_learning_signal_ids: list[str]
    correction_pattern_ids: list[str]
    source_artifacts: list[LearningSourceArtifactRef]
    confidence_label: LearningConfidenceLabel
    risk_label: LearningRiskLabel
    safety_note: str
    blocked_actions: list[str]
