from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.enums import CandidateKind
from app.core.errors import ApiException
from app.modules.project.models import Project

from .schemas import (
    AutoApprovalCandidatePreview,
    AutoApprovalHistoricalMatchOutcome,
    AutoApprovalHistoricalMatchPreview,
    AutoApprovalHistoricalOutcomeItem,
    AutoApprovalPreviewMetric,
    AutoApprovalPreviewStatus,
    AutoApprovalRulePreview,
    CorrectionPattern,
    CorrectionPatternExample,
    LearningConfidenceLabel,
    LearningEvidenceRef,
    LearningPatternSummary,
    LearningRiskLabel,
    LearningSignalSummaryResponse,
    LearningSignalType,
    LearningSignalTypeCount,
    LearningSourceArtifactRef,
    LearningSourceArtifactType,
    LearningWindow,
    MutationGuard,
    OntologyClassRef,
    OntologyRelationRef,
    PromptSuggestion,
    PromptSuggestionKind,
    PromptSuggestionState,
    SuggestionDecisionAuditNote,
    SuggestionDecisionRequest,
    SuggestionDecisionResponse,
    SuggestionDecisionType,
    SuggestionDismissReasonCode,
    SuggestionIntendedNextAction,
    SuggestionSnapshot,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


_patterns_by_project: dict[str, list[CorrectionPattern]] = {}
_suggestions_by_project: dict[str, list[PromptSuggestion]] = {}
_auto_approval_by_project: dict[str, list[AutoApprovalCandidatePreview]] = {}
_audit_counter = 0


def reset_runtime_store() -> None:
    global _audit_counter
    _patterns_by_project.clear()
    _suggestions_by_project.clear()
    _auto_approval_by_project.clear()
    _audit_counter = 0


def project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise ApiException(
            status_code=404,
            code="PROJECT_NOT_FOUND",
            message="Project was not found.",
            details={"project_id": project_id},
        )
    return project


def _artifact(
    *,
    project_id: str,
    artifact_type: LearningSourceArtifactType,
    artifact_id: str,
    observed_at: datetime,
    candidate_kind: CandidateKind | None = None,
    candidate_id: str | None = None,
    review_task_id: str | None = None,
    review_decision_id: str | None = None,
    validation_result_id: str | None = None,
    quality_metric_id: str | None = None,
    evaluation_run_id: str | None = None,
    evaluation_error_case_id: str | None = None,
    quote: str | None = None,
) -> LearningSourceArtifactRef:
    return LearningSourceArtifactRef(
        artifact_type=artifact_type,
        artifact_id=artifact_id,
        project_id=project_id,
        candidate_id=candidate_id,
        candidate_kind=candidate_kind,
        review_task_id=review_task_id,
        review_decision_id=review_decision_id,
        validation_result_id=validation_result_id,
        quality_metric_id=quality_metric_id,
        evaluation_run_id=evaluation_run_id,
        evaluation_error_case_id=evaluation_error_case_id,
        ontology_version_id="onto-v6-learning",
        prompt_version_id="prompt-v12",
        model_run_id="model-run-v6-learning",
        evidence_refs=[
            LearningEvidenceRef(
                source_id="source-policy-csv",
                source_segment_id="segment-policy-001",
                locator=f"learning://{artifact_id}",
                quote=quote,
            )
        ]
        if quote
        else [],
        observed_at=observed_at,
    )


def _ensure_project_data(project_id: str) -> None:
    if project_id in _patterns_by_project:
        return

    now = utc_now()
    first_seen = now - timedelta(days=14)
    review_artifact = _artifact(
        project_id=project_id,
        artifact_type=LearningSourceArtifactType.REVIEW_CORRECTION,
        artifact_id=f"{project_id}-review-correction-direction-001",
        candidate_kind=CandidateKind.RELATION,
        candidate_id=f"{project_id}-candidate-relation-001",
        review_task_id=f"{project_id}-review-task-001",
        review_decision_id=f"{project_id}-review-decision-001",
        observed_at=first_seen,
        quote="담보 - 포함한다 -> 보험상품 was corrected to 보험상품 - 포함한다 -> 담보.",
    )
    metric_artifact = _artifact(
        project_id=project_id,
        artifact_type=LearningSourceArtifactType.EVALUATION_METRIC,
        artifact_id=f"{project_id}-evaluation-metric-direction-001",
        quality_metric_id=f"{project_id}-quality-direction-001",
        evaluation_run_id=f"{project_id}-eval-run-learning-001",
        observed_at=now - timedelta(days=3),
        quote="RELATION_DIRECTION_ACCURACY remained below the project guardrail.",
    )
    error_artifact = _artifact(
        project_id=project_id,
        artifact_type=LearningSourceArtifactType.EVALUATION_ERROR_CASE,
        artifact_id=f"{project_id}-evaluation-error-direction-001",
        candidate_kind=CandidateKind.RELATION,
        candidate_id=f"{project_id}-candidate-relation-002",
        evaluation_run_id=f"{project_id}-eval-run-learning-001",
        evaluation_error_case_id=f"{project_id}-error-wrong-direction-001",
        observed_at=now - timedelta(days=1),
        quote="Gold direction uses InsuranceProduct as source and Coverage as target.",
    )
    validation_artifact = _artifact(
        project_id=project_id,
        artifact_type=LearningSourceArtifactType.VALIDATION_RESULT,
        artifact_id=f"{project_id}-validation-evidence-001",
        validation_result_id=f"{project_id}-validation-result-001",
        observed_at=now - timedelta(days=2),
        quote="Evidence was missing for repeated relation candidates.",
    )

    pattern = CorrectionPattern(
        id=f"{project_id}-pattern-relation-direction",
        project_id=project_id,
        primary_signal_type=LearningSignalType.RELATION_DIRECTION_CORRECTION,
        related_signal_types=[
            LearningSignalType.LOW_BENCHMARK_METRIC_CLUSTER,
            LearningSignalType.EVIDENCE_MISMATCH,
        ],
        title="Contains relation direction drifts in insurance samples",
        affected_classes=[
            OntologyClassRef(ontology_class_id="class-insurance-product", label="Insurance Product"),
            OntologyClassRef(ontology_class_id="class-coverage", label="Coverage"),
        ],
        affected_relations=[
            OntologyRelationRef(ontology_relation_id="relation-includes", label="includes")
        ],
        support_count=7,
        denominator=18,
        confidence_label=LearningConfidenceLabel.HIGH,
        risk_label=LearningRiskLabel.HIGH,
        first_seen_at=first_seen,
        last_seen_at=now,
        explanation=(
            "Review corrections and benchmark error cases repeatedly show the "
            "includes relation being extracted in the reverse direction."
        ),
        representative_examples=[
            CorrectionPatternExample(
                example_id=f"{project_id}-example-direction-001",
                before="Coverage includes Insurance Product",
                after="Insurance Product includes Coverage",
                source_artifact_id=review_artifact.artifact_id,
            )
        ],
        source_learning_signal_ids=[
            f"{project_id}-signal-direction-001",
            f"{project_id}-signal-low-metric-001",
        ],
        source_artifacts=[review_artifact, metric_artifact, error_artifact],
        safety_note="Observed from traceable review and evaluation artifacts; recommendation only.",
        prompt_suggestion_ids=[f"{project_id}-suggestion-direction-example"],
    )
    suggestion = PromptSuggestion(
        id=f"{project_id}-suggestion-direction-example",
        project_id=project_id,
        target_prompt_version_id="prompt-v12",
        suggestion_kind=PromptSuggestionKind.ADD_RELATION_DIRECTION_EXAMPLE,
        state=PromptSuggestionState.SUGGESTED,
        title="Add a direction example for product-to-coverage includes",
        rationale="Repeated corrections show the relation direction is ambiguous without a concrete example.",
        expected_impact="May reduce wrong-direction relation cases in the insurance domain.",
        preview_text=(
            "When extracting 포함한다/includes, use Insurance Product as the source "
            "and Coverage or Rider as the target."
        ),
        structured_proposal={
            "section": "relation_examples",
            "example": {
                "source": "Insurance Product",
                "relation": "includes",
                "target": "Coverage",
            },
        },
        source_learning_signal_ids=pattern.source_learning_signal_ids,
        correction_pattern_ids=[pattern.id],
        source_artifacts=[review_artifact, metric_artifact, error_artifact],
        confidence_label=LearningConfidenceLabel.HIGH,
        risk_label=LearningRiskLabel.HIGH,
        created_at=first_seen,
        updated_at=now,
        safety_note="Accepted means future prompt-drafting intent, not an applied prompt change.",
    )
    superseded = PromptSuggestion(
        id=f"{project_id}-suggestion-superseded-evidence",
        project_id=project_id,
        target_prompt_version_id="prompt-v11",
        suggestion_kind=PromptSuggestionKind.ADD_EVIDENCE_REQUIREMENT,
        state=PromptSuggestionState.SUPERSEDED,
        title="Old evidence guidance candidate",
        rationale="Earlier evidence wording was replaced by the current direction suggestion.",
        expected_impact="Historical context only.",
        preview_text="Require direct quote evidence for every extracted relation.",
        structured_proposal={"superseded_by": suggestion.id},
        source_learning_signal_ids=[f"{project_id}-signal-evidence-001"],
        correction_pattern_ids=[],
        source_artifacts=[validation_artifact],
        confidence_label=LearningConfidenceLabel.LOW,
        risk_label=LearningRiskLabel.LOW,
        created_at=first_seen,
        updated_at=now - timedelta(days=4),
        safety_note="Read-side superseded state; no human command sets this in P0.",
    )
    auto_approval = AutoApprovalCandidatePreview(
        id=f"{project_id}-auto-preview-high-evidence-relations",
        project_id=project_id,
        title="Preview only: high-evidence relation candidates",
        preview_status=AutoApprovalPreviewStatus.RECOMMENDATION_ONLY,
        rule_preview=AutoApprovalRulePreview(
            candidate_kind="RELATION",
            conditions=[
                "validation_status == PASSED",
                "evidence_refs >= 2",
                "relation_direction_accuracy cluster is stable",
            ],
        ),
        supporting_metrics=[
            AutoApprovalPreviewMetric(
                metric_name="historical_precision",
                value=0.93,
                numerator=14,
                denominator=15,
            )
        ],
        historical_match_preview=AutoApprovalHistoricalMatchPreview(
            total_examined=15,
            would_match_count=14,
            blocked_count=1,
            outcomes=[
                AutoApprovalHistoricalOutcomeItem(
                    artifact_id=review_artifact.artifact_id,
                    outcome=AutoApprovalHistoricalMatchOutcome.WOULD_MATCH,
                    reason="Historically approved with evidence and no failed validation.",
                ),
                AutoApprovalHistoricalOutcomeItem(
                    artifact_id=validation_artifact.artifact_id,
                    outcome=AutoApprovalHistoricalMatchOutcome.BLOCKED_BY_SAFETY_RULE,
                    reason="Blocked because evidence was missing.",
                ),
            ],
        ),
        source_learning_signal_ids=[f"{project_id}-signal-direction-001"],
        correction_pattern_ids=[pattern.id],
        source_artifacts=[review_artifact, validation_artifact],
        confidence_label=LearningConfidenceLabel.MEDIUM,
        risk_label=LearningRiskLabel.HIGH,
        safety_note="Recommendation only. Not enforced. Requires later policy approval.",
        blocked_actions=[
            "CREATE_POLICY",
            "ENABLE_POLICY",
            "APPROVE_CANDIDATE",
            "PUBLISH_GRAPH",
        ],
    )

    _patterns_by_project[project_id] = [pattern]
    _suggestions_by_project[project_id] = [suggestion, superseded]
    _auto_approval_by_project[project_id] = [auto_approval]


def learning_summary(project_id: str) -> LearningSignalSummaryResponse:
    _ensure_project_data(project_id)
    now = utc_now()
    suggestions = _suggestions_by_project[project_id]
    patterns = _patterns_by_project[project_id]
    signal_counts = [
        LearningSignalTypeCount(
            signal_type=LearningSignalType.RELATION_DIRECTION_CORRECTION,
            count=7,
            high_risk_count=2,
            latest_observed_at=now - timedelta(days=1),
        ),
        LearningSignalTypeCount(
            signal_type=LearningSignalType.EVIDENCE_MISMATCH,
            count=3,
            high_risk_count=1,
            latest_observed_at=now - timedelta(days=2),
        ),
        LearningSignalTypeCount(
            signal_type=LearningSignalType.LOW_BENCHMARK_METRIC_CLUSTER,
            count=2,
            high_risk_count=1,
            latest_observed_at=now - timedelta(days=3),
        ),
        LearningSignalTypeCount(
            signal_type=LearningSignalType.CLASS_CONFUSION,
            count=0,
            high_risk_count=0,
            latest_observed_at=None,
        ),
        LearningSignalTypeCount(
            signal_type=LearningSignalType.RELATION_TYPE_CONFUSION,
            count=0,
            high_risk_count=0,
            latest_observed_at=None,
        ),
        LearningSignalTypeCount(
            signal_type=LearningSignalType.EVIDENCE_MISSING,
            count=1,
            high_risk_count=0,
            latest_observed_at=now - timedelta(days=2),
        ),
        LearningSignalTypeCount(
            signal_type=LearningSignalType.REPEATED_VALIDATION_FAILURE,
            count=1,
            high_risk_count=0,
            latest_observed_at=now - timedelta(days=2),
        ),
    ]
    return LearningSignalSummaryResponse(
        project_id=project_id,
        generated_at=now,
        window=LearningWindow(
            label="Last 30 days",
            started_at=now - timedelta(days=30),
            ended_at=now,
        ),
        source_artifact_scope=[
            LearningSourceArtifactType.REVIEW_CORRECTION,
            LearningSourceArtifactType.VALIDATION_RESULT,
            LearningSourceArtifactType.QUALITY_METRIC,
            LearningSourceArtifactType.EVALUATION_METRIC,
            LearningSourceArtifactType.EVALUATION_ERROR_CASE,
        ],
        total_signal_count=sum(item.count for item in signal_counts),
        signal_counts=signal_counts,
        open_prompt_suggestion_count=sum(
            1 for item in suggestions if item.state == PromptSuggestionState.SUGGESTED
        ),
        accepted_prompt_suggestion_count=sum(
            1 for item in suggestions if item.state == PromptSuggestionState.ACCEPTED
        ),
        dismissed_prompt_suggestion_count=sum(
            1 for item in suggestions if item.state == PromptSuggestionState.DISMISSED
        ),
        superseded_prompt_suggestion_count=sum(
            1 for item in suggestions if item.state == PromptSuggestionState.SUPERSEDED
        ),
        high_risk_prompt_suggestion_count=sum(
            1 for item in suggestions if item.risk_label == LearningRiskLabel.HIGH
        ),
        auto_approval_preview_count=len(_auto_approval_by_project[project_id]),
        top_patterns=[
            LearningPatternSummary(
                pattern_id=pattern.id,
                primary_signal_type=pattern.primary_signal_type,
                title=pattern.title,
                support_count=pattern.support_count,
                risk_label=pattern.risk_label,
            )
            for pattern in patterns
        ],
        safety_notes=[
            "Learning signals are generated from traceable source artifacts only.",
            "Prompt suggestion decisions are audit records, not applied prompt changes.",
        ],
    )


def list_correction_patterns(project_id: str) -> list[CorrectionPattern]:
    _ensure_project_data(project_id)
    return _patterns_by_project[project_id]


def list_prompt_suggestions(project_id: str) -> list[PromptSuggestion]:
    _ensure_project_data(project_id)
    return _suggestions_by_project[project_id]


def list_auto_approval_candidates(project_id: str) -> list[AutoApprovalCandidatePreview]:
    _ensure_project_data(project_id)
    return _auto_approval_by_project[project_id]


def _find_suggestion(suggestion_id: str) -> PromptSuggestion:
    for suggestions in _suggestions_by_project.values():
        for suggestion in suggestions:
            if suggestion.id == suggestion_id:
                return suggestion
    raise ApiException(
        status_code=404,
        code="PROMPT_SUGGESTION_NOT_FOUND",
        message="Prompt suggestion was not found.",
        details={"suggestion_id": suggestion_id},
    )


def decide_suggestion(
    suggestion_id: str,
    payload: SuggestionDecisionRequest,
) -> SuggestionDecisionResponse:
    global _audit_counter
    suggestion = _find_suggestion(suggestion_id)
    if suggestion.state != PromptSuggestionState.SUGGESTED:
        raise ApiException(
            status_code=409,
            code="PROMPT_SUGGESTION_DECISION_CONFLICT",
            message="Only SUGGESTED prompt suggestions can receive a decision command.",
            details={"suggestion_id": suggestion_id, "state": suggestion.state.value},
        )
    if payload.decision == SuggestionDecisionType.DISMISS and payload.dismiss_reason_code is None:
        raise ApiException(
            status_code=400,
            code="DISMISS_REASON_REQUIRED",
            message="dismiss_reason_code is required when decision is DISMISS.",
            details={"suggestion_id": suggestion_id},
        )
    if payload.decision == SuggestionDecisionType.ACCEPT and payload.dismiss_reason_code is not None:
        raise ApiException(
            status_code=400,
            code="DISMISS_REASON_NOT_ALLOWED",
            message="dismiss_reason_code is only allowed when decision is DISMISS.",
            details={"suggestion_id": suggestion_id},
        )
    if (
        payload.decision == SuggestionDecisionType.DISMISS
        and payload.dismiss_reason_code == SuggestionDismissReasonCode.OTHER
        and not (payload.note and payload.note.strip())
    ):
        raise ApiException(
            status_code=400,
            code="DECISION_NOTE_REQUIRED",
            message="note is required when dismiss_reason_code is OTHER.",
            details={"suggestion_id": suggestion_id},
        )

    previous_state = suggestion.state
    new_state = (
        PromptSuggestionState.ACCEPTED
        if payload.decision == SuggestionDecisionType.ACCEPT
        else PromptSuggestionState.DISMISSED
    )
    _audit_counter += 1
    audit_note = SuggestionDecisionAuditNote(
        id=f"{suggestion_id}-decision-{_audit_counter}",
        suggestion_id=suggestion_id,
        project_id=suggestion.project_id,
        actor_id="dev-user",
        actor_role="PROJECT_ADMIN",
        decision=payload.decision,
        dismiss_reason_code=payload.dismiss_reason_code,
        note=payload.note,
        intended_next_action=payload.intended_next_action
        or (
            SuggestionIntendedNextAction.USE_IN_NEXT_PROMPT_DRAFT
            if payload.decision == SuggestionDecisionType.ACCEPT
            else SuggestionIntendedNextAction.NO_ACTION
        ),
        decided_at=utc_now(),
        source_learning_signal_ids=suggestion.source_learning_signal_ids,
        target_prompt_version_id=suggestion.target_prompt_version_id,
        suggestion_snapshot=SuggestionSnapshot(
            suggestion_kind=suggestion.suggestion_kind,
            title=suggestion.title,
            preview_text=suggestion.preview_text,
        ),
        mutation_guard=MutationGuard(),
    )
    updated = suggestion.model_copy(
        update={
            "state": new_state,
            "updated_at": audit_note.decided_at,
            "decision_audit_note": audit_note,
        }
    )
    suggestions = _suggestions_by_project[suggestion.project_id]
    _suggestions_by_project[suggestion.project_id] = [
        updated if item.id == suggestion_id else item for item in suggestions
    ]
    return SuggestionDecisionResponse(
        suggestion_id=suggestion_id,
        project_id=suggestion.project_id,
        previous_state=previous_state,
        new_state=new_state,
        decision_audit_note=audit_note,
    )
