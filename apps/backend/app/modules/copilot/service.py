from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.errors import ApiException
from app.modules.project.models import Project

from .schemas import (
    CopilotConfidenceLabel,
    CopilotOntologyElementRef,
    CopilotDecisionAuditNote,
    CopilotDecisionCommand,
    CopilotDismissReasonCode,
    CopilotEvidenceRef,
    CopilotMutationGuard,
    CopilotRiskLabel,
    CopilotRoutingTarget,
    CopilotRoutingTargetKind,
    CopilotSourceArtifactRef,
    CopilotSourceArtifactType,
    CopilotSuggestion,
    CopilotSuggestionDecisionRequest,
    CopilotSuggestionDecisionResponse,
    CopilotSuggestionDetailResponse,
    CopilotSuggestionKind,
    CopilotSuggestionKindCount,
    CopilotSuggestionListResponse,
    CopilotSuggestionSnapshot,
    CopilotSuggestionState,
    CopilotSummaryResponse,
    GovernanceChangeRequestDraftPrefill,
)

SUGGESTION_CAP = 20

# Deterministic fixed generation timestamp keeps the list/summary byte-stable
# (no wall-clock in the persisted suggestion body). A real derivation would use
# artifact observation times; here it is a fixed deterministic instant.
_GEN_AT = datetime(2026, 7, 3, 9, 0, 0, tzinfo=timezone.utc)

# Deterministic ordering ordinal per kind (used for (kind ordinal, group key)).
_KIND_ORDINAL = {
    CopilotSuggestionKind.DRAFT_GOVERNANCE_CHANGE_REQUEST: 0,
    CopilotSuggestionKind.REVIEW_THESE_CANDIDATES: 1,
    CopilotSuggestionKind.INSPECT_QUALITY_OR_VALIDATION_SIGNAL: 2,
    CopilotSuggestionKind.RUN_IMPACT_SIMULATION: 3,
}

ADVISORY_NOTES = [
    "Copilot is advisory only. It executes nothing, calls no real model, and "
    "mutates no ontology/candidate/published/governance state.",
    "Accepting a suggestion records human intent and routes you into an existing "
    "human-gated flow, pre-filled. You still pass every gate.",
]

SAFETY_NOTE = (
    "Advisory only. Accepting records your intent and routes you into an existing "
    "gated flow; the copilot creates/mutates/applies/approves/publishes nothing."
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Process-local store (mirrors the MVP6.1-6.7 pattern; reset_runtime_store).
# ---------------------------------------------------------------------------

_suggestions_by_project: dict[str, list[CopilotSuggestion]] = {}
_audit_counter = 0


def reset_runtime_store() -> None:
    global _audit_counter
    _suggestions_by_project.clear()
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


# ---------------------------------------------------------------------------
# Deterministic, source-grounded suggestion generation (G1).
#
# The copilot reads no other module's write path. It derives a deterministic,
# byte-stable set of grounded suggestions from a per-project deterministic mock
# of the source surfaces (mirrors the MVP6.2 learning module precedent). Each
# suggestion cites >=1 non-empty source-artifact ref; ordering is
# (kind ordinal, group key asc); total capped at SUGGESTION_CAP.
# ---------------------------------------------------------------------------


def _artifact(
    *,
    project_id: str,
    artifact_type: CopilotSourceArtifactType,
    artifact_id: str,
    **kwargs: object,
) -> CopilotSourceArtifactRef:
    return CopilotSourceArtifactRef(
        artifact_type=artifact_type,
        artifact_id=artifact_id,
        project_id=project_id,
        observed_at=_GEN_AT,
        **kwargs,  # type: ignore[arg-type]
    )


def _governance_suggestion(project_id: str) -> CopilotSuggestion:
    # G1: recurring correction/validation signal -> DRAFT_GOVERNANCE_CHANGE_REQUEST.
    # Trigger key = affected ontology element id.
    artifacts = [
        _artifact(
            project_id=project_id,
            artifact_type=CopilotSourceArtifactType.REVIEW_CORRECTION,
            artifact_id=f"{project_id}-review-correction-441",
            candidate_id=f"{project_id}-candidate-entity-201",
            candidate_kind="ENTITY",
            review_task_id=f"{project_id}-review-task-88",
            review_decision_id=f"{project_id}-review-decision-777",
            learning_signal_id=f"{project_id}-signal-class-confusion-003",
            ontology_version_id="ontology-v7",
            prompt_version_id="prompt-v12",
            model_run_id="model-run-982",
            evidence_refs=[
                CopilotEvidenceRef(
                    source_id="source-policy-001",
                    source_segment_id="segment-42",
                    locator="page=3:paragraph=8",
                    quote="The rider is an optional add-on to the base product.",
                )
            ],
        ),
    ]
    routing_target = CopilotRoutingTarget(
        kind=CopilotRoutingTargetKind.GOVERNANCE_CHANGE_REQUEST_DRAFT,
        deep_link=f"/projects/{project_id}/governance/change-requests/new",
        target_ref={"ontology_version_id": "ontology-v7"},
        governance_change_request_draft_prefill=GovernanceChangeRequestDraftPrefill(
            target_kind="CLASS",
            change_type="MODIFY",
            ontology_version_id="ontology-v7",
            element_refs=[
                CopilotOntologyElementRef(
                    element_kind="CLASS",
                    element_id="class-insurance-product",
                    label="InsuranceProduct",
                ),
                CopilotOntologyElementRef(
                    element_kind="CLASS",
                    element_id="class-rider",
                    label="Rider",
                ),
            ],
            proposed_title="Clarify InsuranceProduct vs Rider boundary",
            proposed_rationale="Repeated review corrections indicate an ambiguous class boundary.",
        ),
        human_gate_note=(
            "This only opens a pre-filled draft. The copilot creates nothing; you "
            "still propose -> review -> approve -> apply."
        ),
    )
    return CopilotSuggestion(
        id=f"{project_id}-copilot-suggestion-governance-001",
        project_id=project_id,
        kind=CopilotSuggestionKind.DRAFT_GOVERNANCE_CHANGE_REQUEST,
        state=CopilotSuggestionState.SUGGESTED,
        title="Clarify the boundary between InsuranceProduct and Rider",
        rationale=(
            "Recurring review corrections on the same class boundary indicate the "
            "InsuranceProduct/Rider distinction is ambiguous."
        ),
        expected_next_step=(
            "Open the governance change-request create screen (pre-filled) and "
            "propose a class-boundary clarification. You still propose, review, "
            "approve, and apply."
        ),
        routing_target=routing_target,
        source_artifacts=artifacts,
        confidence_label=CopilotConfidenceLabel.MEDIUM,
        risk_label=CopilotRiskLabel.MEDIUM,
        created_at=_GEN_AT,
        updated_at=_GEN_AT,
        decision_audit_note=None,
        safety_note=SAFETY_NOTE,
    )


def _candidate_suggestion(project_id: str) -> CopilotSuggestion:
    # G1: PENDING candidates tied to an evaluation error cluster -> REVIEW_THESE_CANDIDATES.
    candidate_ids = [
        f"{project_id}-candidate-relation-778",
        f"{project_id}-candidate-relation-779",
    ]
    artifacts = [
        _artifact(
            project_id=project_id,
            artifact_type=CopilotSourceArtifactType.EVALUATION_ERROR_CASE,
            artifact_id=f"{project_id}-error-case-101",
            candidate_id=candidate_ids[0],
            candidate_kind="RELATION",
            evaluation_run_id=f"{project_id}-eval-run-20260701-001",
            evaluation_error_case_id=f"{project_id}-error-case-101",
            ontology_version_id="ontology-v7",
        ),
        _artifact(
            project_id=project_id,
            artifact_type=CopilotSourceArtifactType.CANDIDATE,
            artifact_id=candidate_ids[1],
            candidate_id=candidate_ids[1],
            candidate_kind="RELATION",
            ontology_version_id="ontology-v7",
        ),
    ]
    routing_target = CopilotRoutingTarget(
        kind=CopilotRoutingTargetKind.CANDIDATE_REVIEW_LOCATION,
        deep_link=(
            f"/projects/{project_id}/review?candidate_ids={','.join(candidate_ids)}"
        ),
        target_ref={"candidate_ids": candidate_ids},
        governance_change_request_draft_prefill=None,
        human_gate_note=(
            "This only deep-links you to the review inbox. The copilot "
            "approves/corrects nothing; you still review and decide."
        ),
    )
    return CopilotSuggestion(
        id=f"{project_id}-copilot-suggestion-candidate-001",
        project_id=project_id,
        kind=CopilotSuggestionKind.REVIEW_THESE_CANDIDATES,
        state=CopilotSuggestionState.SUGGESTED,
        title="Review 2 pending relation candidates in an error cluster",
        rationale=(
            "These pending relation candidates share an evaluation error cluster "
            "and are worth a focused review pass."
        ),
        expected_next_step=(
            "Open the candidate review inbox deep-linked to these candidates. You "
            "still review, correct, and decide."
        ),
        routing_target=routing_target,
        source_artifacts=artifacts,
        confidence_label=CopilotConfidenceLabel.HIGH,
        risk_label=CopilotRiskLabel.MEDIUM,
        created_at=_GEN_AT,
        updated_at=_GEN_AT,
        decision_audit_note=None,
        safety_note=SAFETY_NOTE,
    )


def _quality_suggestion(project_id: str) -> CopilotSuggestion:
    # G1: low QualityMetric (rate < 0.8) / FAILED validation -> INSPECT_QUALITY_OR_VALIDATION_SIGNAL.
    artifacts = [
        _artifact(
            project_id=project_id,
            artifact_type=CopilotSourceArtifactType.QUALITY_METRIC,
            artifact_id=f"{project_id}-quality-traceability-001",
            quality_metric_id=f"{project_id}-quality-traceability-001",
            ontology_version_id="ontology-v7",
        ),
        _artifact(
            project_id=project_id,
            artifact_type=CopilotSourceArtifactType.VALIDATION_RESULT,
            artifact_id=f"{project_id}-validation-result-evidence-001",
            validation_result_id=f"{project_id}-validation-result-evidence-001",
            ontology_version_id="ontology-v7",
        ),
    ]
    routing_target = CopilotRoutingTarget(
        kind=CopilotRoutingTargetKind.QUALITY_OR_VALIDATION_LOCATION,
        deep_link=f"/projects/{project_id}/quality?group=TRACEABILITY",
        target_ref={"quality_metric_group": "TRACEABILITY"},
        governance_change_request_draft_prefill=None,
        human_gate_note=(
            "This only deep-links you to the quality/validation drilldown. It is a "
            "read-only destination; you decide any follow-up."
        ),
    )
    return CopilotSuggestion(
        id=f"{project_id}-copilot-suggestion-quality-001",
        project_id=project_id,
        kind=CopilotSuggestionKind.INSPECT_QUALITY_OR_VALIDATION_SIGNAL,
        state=CopilotSuggestionState.SUGGESTED,
        title="Inspect the TRACEABILITY quality metric group",
        rationale=(
            "The TRACEABILITY quality metric is below the project guardrail and "
            "there is a FAILED evidence validation result to inspect."
        ),
        expected_next_step=(
            "Open the quality dashboard deep-linked to the TRACEABILITY group. "
            "Read-only; you decide any follow-up."
        ),
        routing_target=routing_target,
        source_artifacts=artifacts,
        confidence_label=CopilotConfidenceLabel.HIGH,
        risk_label=CopilotRiskLabel.LOW,
        created_at=_GEN_AT,
        updated_at=_GEN_AT,
        decision_audit_note=None,
        safety_note=SAFETY_NOTE,
    )


def _impact_suggestion(project_id: str) -> CopilotSuggestion:
    # G1: APPROVED + QUEUED change request -> RUN_IMPACT_SIMULATION.
    change_request_id = f"{project_id}-ocr-approved-001"
    artifacts = [
        _artifact(
            project_id=project_id,
            artifact_type=CopilotSourceArtifactType.GOVERNANCE_CHANGE_REQUEST,
            artifact_id=change_request_id,
            governance_change_request_id=change_request_id,
            ontology_version_id="ontology-v7",
        ),
    ]
    routing_target = CopilotRoutingTarget(
        kind=CopilotRoutingTargetKind.IMPACT_REPORT_LOCATION,
        deep_link=(
            f"/projects/{project_id}/governance/change-requests/{change_request_id}/impact"
        ),
        target_ref={"change_request_id": change_request_id},
        governance_change_request_draft_prefill=None,
        human_gate_note=(
            "This only deep-links you to the impact-report panel. It is a "
            "read-only analysis; you still decide apply/publish."
        ),
    )
    return CopilotSuggestion(
        id=f"{project_id}-copilot-suggestion-impact-001",
        project_id=project_id,
        kind=CopilotSuggestionKind.RUN_IMPACT_SIMULATION,
        state=CopilotSuggestionState.SUGGESTED,
        title="Run the impact simulation before applying an approved change request",
        rationale=(
            "This change request is APPROVED and QUEUED for apply; running the "
            "read-only impact simulation first is recommended."
        ),
        expected_next_step=(
            "Open the impact-report panel for this change request. Read-only "
            "analysis; you still decide apply/publish."
        ),
        routing_target=routing_target,
        source_artifacts=artifacts,
        confidence_label=CopilotConfidenceLabel.MEDIUM,
        risk_label=CopilotRiskLabel.MEDIUM,
        created_at=_GEN_AT,
        updated_at=_GEN_AT,
        decision_audit_note=None,
        safety_note=SAFETY_NOTE,
    )


def _generate_suggestions(project_id: str) -> list[CopilotSuggestion]:
    suggestions = [
        _governance_suggestion(project_id),
        _candidate_suggestion(project_id),
        _quality_suggestion(project_id),
        _impact_suggestion(project_id),
    ]
    # Deterministic order: (kind ordinal, id ascending as the group key).
    suggestions.sort(key=lambda s: (_KIND_ORDINAL[s.kind], s.id))
    return suggestions[:SUGGESTION_CAP]


def _ensure_project_data(project_id: str) -> list[CopilotSuggestion]:
    if project_id not in _suggestions_by_project:
        _suggestions_by_project[project_id] = _generate_suggestions(project_id)
    return _suggestions_by_project[project_id]


# ---------------------------------------------------------------------------
# Read endpoints.
# ---------------------------------------------------------------------------


def summary(project_id: str) -> CopilotSummaryResponse:
    suggestions = _ensure_project_data(project_id)

    scope: list[CopilotSourceArtifactType] = []
    for suggestion in suggestions:
        for artifact in suggestion.source_artifacts:
            if artifact.artifact_type not in scope:
                scope.append(artifact.artifact_type)

    counts_by_kind = [
        CopilotSuggestionKindCount(
            kind=kind,
            count=sum(1 for s in suggestions if s.kind == kind),
            high_risk_count=sum(
                1
                for s in suggestions
                if s.kind == kind and s.risk_label == CopilotRiskLabel.HIGH
            ),
        )
        for kind in CopilotSuggestionKind
    ]

    return CopilotSummaryResponse(
        project_id=project_id,
        generated_at=_GEN_AT,
        source_artifact_scope=scope,
        total_suggestion_count=len(suggestions),
        suggested_count=sum(
            1 for s in suggestions if s.state == CopilotSuggestionState.SUGGESTED
        ),
        accepted_count=sum(
            1 for s in suggestions if s.state == CopilotSuggestionState.ACCEPTED
        ),
        dismissed_count=sum(
            1 for s in suggestions if s.state == CopilotSuggestionState.DISMISSED
        ),
        superseded_count=sum(
            1 for s in suggestions if s.state == CopilotSuggestionState.SUPERSEDED
        ),
        high_risk_count=sum(
            1 for s in suggestions if s.risk_label == CopilotRiskLabel.HIGH
        ),
        counts_by_kind=counts_by_kind,
        advisory_notes=list(ADVISORY_NOTES),
        mutation_guard=CopilotMutationGuard(),
    )


def list_suggestions(
    project_id: str,
    *,
    kind: CopilotSuggestionKind | None = None,
    state: CopilotSuggestionState | None = None,
    risk_label: CopilotRiskLabel | None = None,
    limit: int = 50,
    cursor: str | None = None,
) -> CopilotSuggestionListResponse:
    suggestions = _ensure_project_data(project_id)
    items = [
        s
        for s in suggestions
        if (kind is None or s.kind == kind)
        and (state is None or s.state == state)
        and (risk_label is None or s.risk_label == risk_label)
    ]

    start = 0
    if cursor is not None:
        try:
            start = int(cursor)
        except ValueError:
            start = 0
    page = items[start : start + limit]
    next_cursor = str(start + limit) if start + limit < len(items) else None

    return CopilotSuggestionListResponse(
        project_id=project_id,
        items=page,
        next_cursor=next_cursor,
        mutation_guard=CopilotMutationGuard(),
    )


def _find_suggestion(suggestion_id: str) -> CopilotSuggestion:
    for suggestions in _suggestions_by_project.values():
        for suggestion in suggestions:
            if suggestion.id == suggestion_id:
                return suggestion
    raise ApiException(
        status_code=404,
        code="COPILOT_SUGGESTION_NOT_FOUND",
        message="Copilot suggestion was not found.",
        details={"suggestion_id": suggestion_id},
    )


def get_suggestion(suggestion_id: str) -> CopilotSuggestionDetailResponse:
    suggestion = _find_suggestion(suggestion_id)
    return CopilotSuggestionDetailResponse(
        suggestion=suggestion,
        mutation_guard=CopilotMutationGuard(),
    )


# ---------------------------------------------------------------------------
# Decision (audit-only). ACCEPT returns the routing target and executes nothing.
# ---------------------------------------------------------------------------


def decide(
    suggestion_id: str,
    payload: CopilotSuggestionDecisionRequest,
    *,
    actor_id: str,
    actor_role: str,
) -> CopilotSuggestionDecisionResponse:
    global _audit_counter
    suggestion = _find_suggestion(suggestion_id)

    if suggestion.state != CopilotSuggestionState.SUGGESTED:
        raise ApiException(
            status_code=409,
            code="COPILOT_SUGGESTION_DECISION_CONFLICT",
            message="Only SUGGESTED copilot suggestions can receive a decision command.",
            details={"suggestion_id": suggestion_id, "state": suggestion.state.value},
        )

    if payload.decision == CopilotDecisionCommand.DISMISS and payload.dismiss_reason_code is None:
        raise ApiException(
            status_code=422,
            code="DISMISS_REASON_REQUIRED",
            message="dismiss_reason_code is required when decision is DISMISS.",
            details={"suggestion_id": suggestion_id},
        )
    if payload.decision == CopilotDecisionCommand.ACCEPT and payload.dismiss_reason_code is not None:
        raise ApiException(
            status_code=422,
            code="DISMISS_REASON_NOT_ALLOWED",
            message="dismiss_reason_code is only allowed when decision is DISMISS.",
            details={"suggestion_id": suggestion_id},
        )
    if (
        payload.decision == CopilotDecisionCommand.DISMISS
        and payload.dismiss_reason_code == CopilotDismissReasonCode.OTHER
        and not (payload.note and payload.note.strip())
    ):
        raise ApiException(
            status_code=422,
            code="DECISION_NOTE_REQUIRED",
            message="note is required when dismiss_reason_code is OTHER.",
            details={"suggestion_id": suggestion_id},
        )

    previous_state = suggestion.state
    is_accept = payload.decision == CopilotDecisionCommand.ACCEPT
    new_state = (
        CopilotSuggestionState.ACCEPTED if is_accept else CopilotSuggestionState.DISMISSED
    )
    decided_at = utc_now()
    _audit_counter += 1

    routing_target = suggestion.routing_target if is_accept else None
    audit_note = CopilotDecisionAuditNote(
        id=f"{suggestion_id}-decision-{_audit_counter}",
        suggestion_id=suggestion_id,
        project_id=suggestion.project_id,
        actor_id=actor_id,
        actor_role=actor_role,
        decision=payload.decision,
        dismiss_reason_code=payload.dismiss_reason_code,
        note=payload.note,
        decided_at=decided_at,
        suggestion_snapshot=CopilotSuggestionSnapshot(
            kind=suggestion.kind,
            title=suggestion.title,
            rationale=suggestion.rationale,
            confidence_label=suggestion.confidence_label,
            risk_label=suggestion.risk_label,
        ),
        source_artifact_ids=[a.artifact_id for a in suggestion.source_artifacts],
        routing_target=routing_target,
        mutation_guard=CopilotMutationGuard(),
    )

    updated = suggestion.model_copy(
        update={
            "state": new_state,
            "updated_at": decided_at,
            "decision_audit_note": audit_note,
        }
    )
    suggestions = _suggestions_by_project[suggestion.project_id]
    _suggestions_by_project[suggestion.project_id] = [
        updated if s.id == suggestion_id else s for s in suggestions
    ]

    return CopilotSuggestionDecisionResponse(
        suggestion_id=suggestion_id,
        project_id=suggestion.project_id,
        previous_state=previous_state,
        new_state=new_state,
        decision_audit_note=audit_note,
        routing_target=routing_target,
        mutation_guard=CopilotMutationGuard(),
    )
