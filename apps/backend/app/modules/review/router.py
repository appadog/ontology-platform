from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.enums import (
    AuditEventType,
    CandidateKind,
    CandidateReviewStatus,
    CorrectionStatus,
    PublishStatus,
    ReviewDecisionType,
    ReviewTaskStatus,
    ValidationResultSeverity,
    ValidationStatus,
)
from app.core.errors import ApiErrorResponse, ApiException
from app.db.session import get_db
from app.modules.audit.service import record_audit_event
from app.modules.candidate.service import (
    CandidateRecord,
    candidate_display_name,
    candidate_snapshot,
    correction_diff,
    evidence_integrity,
    get_candidate_or_404,
)
from app.modules.project.models import Project
from app.modules.publish.service import (
    publish_eligibility_for_candidate,
    validation_results_for_candidate,
    validation_summary_dict,
)
from app.modules.review.models import (
    CandidateCorrection as CandidateCorrectionModel,
    ReviewDecision as ReviewDecisionModel,
    ReviewTask as ReviewTaskModel,
)
from app.modules.review.schemas import (
    CandidateCorrection,
    CandidateCorrectionCreateRequest,
    CorrectionDiffItem,
    ReviewDecision,
    ReviewDecisionCreateRequest,
    ReviewTask,
    ReviewTaskAssignRequest,
    ReviewTaskCreateRequest,
    ReviewTaskDetail,
    ReviewTaskListResponse,
)
from app.modules.validation.router import to_validation_result

router = APIRouter(tags=["Review"])


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise ApiException(
            status_code=404,
            code="PROJECT_NOT_FOUND",
            message="Project was not found.",
            details={"project_id": project_id},
        )
    return project


def _task_or_404(db: Session, review_task_id: str) -> ReviewTaskModel:
    task = db.get(ReviewTaskModel, review_task_id)
    if task is None:
        raise ApiException(
            status_code=404,
            code="REVIEW_TASK_NOT_FOUND",
            message="Review task was not found.",
            details={"review_task_id": review_task_id},
        )
    return task


def _correction_or_404(db: Session, correction_id: str) -> CandidateCorrectionModel:
    correction = db.get(CandidateCorrectionModel, correction_id)
    if correction is None:
        raise ApiException(
            status_code=404,
            code="CANDIDATE_CORRECTION_NOT_FOUND",
            message="Candidate correction was not found.",
            details={"correction_id": correction_id},
        )
    return correction


def _top_validation_message(db: Session, kind: CandidateKind, candidate_id: str) -> str | None:
    results = validation_results_for_candidate(db, kind, candidate_id)
    for severity in (ValidationResultSeverity.FAILED, ValidationResultSeverity.WARNING):
        for result in results:
            if result.severity == severity:
                return result.message
    return None


def _evidence_state(db: Session, candidate: CandidateRecord) -> str:
    has_evidence, has_broken_evidence = evidence_integrity(db, candidate)
    if has_broken_evidence:
        return "broken"
    if not has_evidence:
        return "missing"
    return "present"


def _to_task(task: ReviewTaskModel) -> ReviewTask:
    return ReviewTask(
        id=task.id,
        project_id=task.project_id,
        candidate_kind=task.candidate_kind,
        candidate_id=task.candidate_id,
        ontology_version_id=task.ontology_version_id,
        source_id=task.source_id,
        extraction_job_id=task.extraction_job_id,
        status=task.status,
        assignee_id=task.assignee_id,
        priority=task.priority,
        validation_status=task.validation_status,
        validation_codes=list(task.validation_codes or []),
        priority_reason=task.priority_reason,
        candidate_display_name=task.candidate_display_name,
        assignee_display_name=task.assignee_display_name,
        evidence_count=task.evidence_count,
        evidence_state=task.evidence_state,
        top_validation_message=task.top_validation_message,
        last_decision_summary=task.last_decision_summary,
        created_at=task.created_at,
        updated_at=task.updated_at,
        decided_at=task.decided_at,
    )


def _to_correction(correction: CandidateCorrectionModel) -> CandidateCorrection:
    return CandidateCorrection(
        id=correction.id,
        project_id=correction.project_id,
        candidate_kind=correction.candidate_kind,
        candidate_id=correction.candidate_id,
        review_task_id=correction.review_task_id,
        base_candidate_snapshot=correction.base_candidate_snapshot,
        corrected_payload=correction.corrected_payload,
        correction_diff=[CorrectionDiffItem(**item) for item in correction.correction_diff],
        status=correction.status,
        created_by=correction.created_by,
        created_at=correction.created_at,
        updated_at=correction.updated_at,
    )


def _to_decision(decision: ReviewDecisionModel) -> ReviewDecision:
    return ReviewDecision(
        id=decision.id,
        review_task_id=decision.review_task_id,
        project_id=decision.project_id,
        candidate_kind=decision.candidate_kind,
        candidate_id=decision.candidate_id,
        decision=decision.decision,
        resulting_review_status=decision.resulting_review_status,
        reviewer_id=decision.reviewer_id,
        reason=decision.reason,
        before_snapshot=decision.before_snapshot,
        correction_id=decision.correction_id,
        correction_diff=[CorrectionDiffItem(**item) for item in decision.correction_diff],
        validation_summary=validation_summary_dict([]) | decision.validation_summary,
        publish_eligibility=decision.publish_eligibility,
        created_at=decision.created_at,
    )


def _existing_task(
    db: Session,
    project_id: str,
    kind: CandidateKind,
    candidate_id: str,
) -> ReviewTaskModel | None:
    return db.scalars(
        select(ReviewTaskModel)
        .where(
            ReviewTaskModel.project_id == project_id,
            ReviewTaskModel.candidate_kind == kind,
            ReviewTaskModel.candidate_id == candidate_id,
        )
        .limit(1)
    ).first()


def _create_or_update_task(
    db: Session,
    *,
    project_id: str,
    kind: CandidateKind,
    candidate: CandidateRecord,
    assignee_id: str | None,
    priority: int,
) -> ReviewTaskModel:
    task = _existing_task(db, project_id, kind, candidate.id)
    status_value = ReviewTaskStatus.ASSIGNED if assignee_id else ReviewTaskStatus.OPEN
    evidence_state = _evidence_state(db, candidate)
    top_message = _top_validation_message(db, kind, candidate.id)
    evidence_count = len(candidate.evidence_ids or [])
    if task is None:
        task = ReviewTaskModel(
            project_id=project_id,
            candidate_kind=kind,
            candidate_id=candidate.id,
            ontology_version_id=candidate.ontology_version_id,
            source_id=candidate.source_id,
            extraction_job_id=candidate.extraction_job_id,
            status=status_value,
            assignee_id=assignee_id,
            priority=priority,
            validation_status=candidate.validation_status,
            validation_codes=list(candidate.validation_codes or []),
            priority_reason=top_message,
            candidate_display_name=candidate_display_name(kind, candidate),
            assignee_display_name=assignee_id,
            evidence_count=evidence_count,
            evidence_state=evidence_state,
            top_validation_message=top_message,
        )
        db.add(task)
        db.flush()
        record_audit_event(
            db,
            project_id=project_id,
            event_type=AuditEventType.REVIEW_TASK_CREATED,
            candidate_kind=kind,
            candidate_id=candidate.id,
            review_task_id=task.id,
            original_snapshot=candidate_snapshot(kind, candidate),
        )
    else:
        task.validation_status = candidate.validation_status
        task.validation_codes = list(candidate.validation_codes or [])
        task.evidence_count = evidence_count
        task.evidence_state = evidence_state
        task.top_validation_message = top_message
        task.priority_reason = top_message
        if assignee_id:
            task.assignee_id = assignee_id
            task.assignee_display_name = assignee_id
            task.status = ReviewTaskStatus.ASSIGNED
    return task


def _requires_reason(
    db: Session,
    decision: ReviewDecisionType,
    kind: CandidateKind,
    candidate: CandidateRecord,
) -> bool:
    if decision in {
        ReviewDecisionType.REJECT,
        ReviewDecisionType.REQUEST_CHANGES,
        ReviewDecisionType.MODIFY_AND_APPROVE,
    }:
        return True
    results = validation_results_for_candidate(db, kind, candidate.id)
    has_warning = any(result.severity == ValidationResultSeverity.WARNING for result in results)
    return has_warning or candidate.validation_status == ValidationStatus.WARNING


def _resulting_status(
    current_status: CandidateReviewStatus,
    decision: ReviewDecisionType,
) -> CandidateReviewStatus:
    if decision == ReviewDecisionType.APPROVE and current_status in {
        CandidateReviewStatus.PENDING,
        CandidateReviewStatus.NEEDS_DISCUSSION,
    }:
        return CandidateReviewStatus.APPROVED
    if decision == ReviewDecisionType.REJECT and current_status in {
        CandidateReviewStatus.PENDING,
        CandidateReviewStatus.NEEDS_DISCUSSION,
    }:
        return CandidateReviewStatus.REJECTED
    if decision == ReviewDecisionType.REQUEST_CHANGES and current_status in {
        CandidateReviewStatus.PENDING,
        CandidateReviewStatus.APPROVED,
        CandidateReviewStatus.MODIFIED,
    }:
        return CandidateReviewStatus.NEEDS_DISCUSSION
    if decision == ReviewDecisionType.MODIFY_AND_APPROVE and current_status in {
        CandidateReviewStatus.PENDING,
        CandidateReviewStatus.NEEDS_DISCUSSION,
    }:
        return CandidateReviewStatus.MODIFIED
    raise ApiException(
        status_code=409,
        code="INVALID_REVIEW_TRANSITION",
        message="Review decision is not allowed from the current candidate status.",
        details={"current_status": current_status.value, "decision": decision.value},
    )


def _create_correction(
    db: Session,
    *,
    task: ReviewTaskModel,
    candidate: CandidateRecord,
    corrected_payload: dict[str, Any],
    status_value: CorrectionStatus = CorrectionStatus.SUBMITTED,
) -> CandidateCorrectionModel:
    before = candidate_snapshot(task.candidate_kind, candidate)
    diff = correction_diff(before, corrected_payload)
    correction = CandidateCorrectionModel(
        project_id=task.project_id,
        candidate_kind=task.candidate_kind,
        candidate_id=task.candidate_id,
        review_task_id=task.id,
        base_candidate_snapshot=before,
        corrected_payload=corrected_payload,
        correction_diff=diff,
        status=status_value,
        created_by="dev-user",
    )
    db.add(correction)
    db.flush()
    record_audit_event(
        db,
        project_id=task.project_id,
        event_type=AuditEventType.CORRECTION_SUBMITTED,
        candidate_kind=task.candidate_kind,
        candidate_id=task.candidate_id,
        review_task_id=task.id,
        original_snapshot=before,
        corrected_snapshot=corrected_payload,
        metadata={"correction_id": correction.id, "diff_count": len(diff)},
    )
    return correction


@router.get(
    "/projects/{project_id}/review-tasks",
    response_model=ReviewTaskListResponse,
    summary="List review tasks",
    responses={404: {"model": ApiErrorResponse}},
)
def list_review_tasks(
    project_id: str,
    db: Session = Depends(get_db),
    status_filter: ReviewTaskStatus | None = Query(default=None, alias="status"),
    assignee_id: str | None = Query(default=None),
    assigned_to_me: bool | None = Query(default=None),
    unassigned: bool | None = Query(default=None),
    candidate_kind: CandidateKind | None = Query(default=None),
    validation_status: ValidationStatus | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> ReviewTaskListResponse:
    _project_or_404(db, project_id)
    statement = select(ReviewTaskModel).where(ReviewTaskModel.project_id == project_id)
    if status_filter is not None:
        statement = statement.where(ReviewTaskModel.status == status_filter)
    if assignee_id is not None:
        statement = statement.where(ReviewTaskModel.assignee_id == assignee_id)
    if assigned_to_me:
        statement = statement.where(ReviewTaskModel.assignee_id == "dev-user")
    if unassigned:
        statement = statement.where(ReviewTaskModel.assignee_id.is_(None))
    if candidate_kind is not None:
        statement = statement.where(ReviewTaskModel.candidate_kind == candidate_kind)
    if validation_status is not None:
        statement = statement.where(ReviewTaskModel.validation_status == validation_status)
    total_count = int(db.scalar(select(func.count()).select_from(statement.subquery())) or 0)
    tasks = db.scalars(
        statement.order_by(ReviewTaskModel.created_at.asc()).limit(limit).offset(offset)
    ).all()
    return ReviewTaskListResponse(
        items=[_to_task(task) for task in tasks],
        total_count=total_count,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/projects/{project_id}/review-tasks",
    response_model=list[ReviewTask],
    status_code=status.HTTP_201_CREATED,
    summary="Create review tasks",
    responses={404: {"model": ApiErrorResponse}, 422: {"model": ApiErrorResponse}},
)
def create_review_tasks(
    project_id: str,
    payload: ReviewTaskCreateRequest,
    db: Session = Depends(get_db),
) -> list[ReviewTask]:
    _project_or_404(db, project_id)
    tasks: list[ReviewTaskModel] = []
    for ref in payload.candidate_refs:
        candidate = get_candidate_or_404(db, ref.candidate_kind, ref.candidate_id)
        if candidate.project_id != project_id:
            raise ApiException(
                status_code=422,
                code="PROJECT_SCOPE_MISMATCH",
                message="Candidate does not belong to the target project.",
                details={"candidate_id": candidate.id},
            )
        tasks.append(
            _create_or_update_task(
                db,
                project_id=project_id,
                kind=ref.candidate_kind,
                candidate=candidate,
                assignee_id=payload.assignee_id,
                priority=payload.priority,
            )
        )
    db.commit()
    return [_to_task(task) for task in tasks]


@router.get(
    "/review-tasks/{review_task_id}",
    response_model=ReviewTaskDetail,
    summary="Get review task",
    responses={404: {"model": ApiErrorResponse}},
)
def get_review_task(review_task_id: str, db: Session = Depends(get_db)) -> ReviewTaskDetail:
    task = _task_or_404(db, review_task_id)
    candidate = get_candidate_or_404(db, task.candidate_kind, task.candidate_id)
    results = validation_results_for_candidate(db, task.candidate_kind, task.candidate_id)
    corrections = db.scalars(
        select(CandidateCorrectionModel)
        .where(CandidateCorrectionModel.review_task_id == task.id)
        .order_by(CandidateCorrectionModel.created_at.asc())
    ).all()
    decisions = db.scalars(
        select(ReviewDecisionModel)
        .where(ReviewDecisionModel.review_task_id == task.id)
        .order_by(ReviewDecisionModel.created_at.asc())
    ).all()
    task_schema = _to_task(task)
    return ReviewTaskDetail(
        **task_schema.model_dump(),
        candidate_snapshot=candidate_snapshot(task.candidate_kind, candidate),
        validation_results=[to_validation_result(result) for result in results],
        corrections=[_to_correction(correction) for correction in corrections],
        decisions=[_to_decision(decision) for decision in decisions],
    )


@router.post(
    "/review-tasks/{review_task_id}/assign",
    response_model=ReviewTask,
    summary="Assign review task",
    responses={404: {"model": ApiErrorResponse}},
)
def assign_review_task(
    review_task_id: str,
    payload: ReviewTaskAssignRequest,
    db: Session = Depends(get_db),
) -> ReviewTask:
    task = _task_or_404(db, review_task_id)
    task.assignee_id = payload.assignee_id
    task.assignee_display_name = payload.assignee_id
    task.status = ReviewTaskStatus.ASSIGNED
    db.add(task)
    record_audit_event(
        db,
        project_id=task.project_id,
        event_type=AuditEventType.REVIEW_TASK_ASSIGNED,
        candidate_kind=task.candidate_kind,
        candidate_id=task.candidate_id,
        review_task_id=task.id,
        metadata={"assignee_id": payload.assignee_id},
    )
    db.commit()
    db.refresh(task)
    return _to_task(task)


@router.post(
    "/review-tasks/{review_task_id}/claim",
    response_model=ReviewTask,
    summary="Claim unassigned review task",
    responses={404: {"model": ApiErrorResponse}},
)
def claim_review_task(review_task_id: str, db: Session = Depends(get_db)) -> ReviewTask:
    task = _task_or_404(db, review_task_id)
    task.assignee_id = "dev-user"
    task.assignee_display_name = "dev-user"
    task.status = ReviewTaskStatus.ASSIGNED
    db.add(task)
    record_audit_event(
        db,
        project_id=task.project_id,
        event_type=AuditEventType.REVIEW_TASK_ASSIGNED,
        candidate_kind=task.candidate_kind,
        candidate_id=task.candidate_id,
        review_task_id=task.id,
        metadata={"assignee_id": "dev-user"},
    )
    db.commit()
    db.refresh(task)
    return _to_task(task)


@router.post(
    "/review-tasks/{review_task_id}/decisions",
    response_model=ReviewDecision,
    status_code=status.HTTP_201_CREATED,
    summary="Record review decision",
    responses={404: {"model": ApiErrorResponse}, 409: {"model": ApiErrorResponse}},
)
def create_review_decision(
    review_task_id: str,
    payload: ReviewDecisionCreateRequest,
    db: Session = Depends(get_db),
) -> ReviewDecision:
    task = _task_or_404(db, review_task_id)
    candidate = get_candidate_or_404(db, task.candidate_kind, task.candidate_id)
    if candidate.publish_status == PublishStatus.PUBLISHED:
        raise ApiException(
            status_code=409,
            code="PUBLISHED_CANDIDATE_IMMUTABLE",
            message="Published candidates cannot be modified in place.",
            details={"candidate_id": candidate.id},
        )
    if _requires_reason(db, payload.decision, task.candidate_kind, candidate) and not (
        payload.reason and payload.reason.strip()
    ):
        raise ApiException(
            status_code=409,
            code="REASON_REQUIRED",
            message="A reviewer reason is required for this decision.",
            details={"decision": payload.decision.value},
        )
    resulting_status = _resulting_status(candidate.review_status, payload.decision)
    before = candidate_snapshot(task.candidate_kind, candidate)

    correction: CandidateCorrectionModel | None = None
    if payload.correction_id is not None:
        correction = _correction_or_404(db, payload.correction_id)
    elif payload.corrected_payload is not None:
        correction = _create_correction(
            db,
            task=task,
            candidate=candidate,
            corrected_payload=payload.corrected_payload,
        )
    if payload.decision == ReviewDecisionType.MODIFY_AND_APPROVE and (
        correction is None or not correction.correction_diff
    ):
        raise ApiException(
            status_code=409,
            code="CORRECTION_DIFF_REQUIRED",
            message="Modify-and-approve requires a non-empty correction diff.",
            details={"review_task_id": review_task_id},
        )

    candidate.review_status = resulting_status
    task.status = ReviewTaskStatus.DECIDED
    task.decided_at = utc_now()
    task.last_decision_summary = payload.decision.value
    db.add(candidate)
    db.add(task)
    decision = ReviewDecisionModel(
        review_task_id=task.id,
        project_id=task.project_id,
        candidate_kind=task.candidate_kind,
        candidate_id=task.candidate_id,
        decision=payload.decision,
        resulting_review_status=resulting_status,
        reviewer_id="dev-user",
        reason=payload.reason,
        before_snapshot=before,
        correction_id=correction.id if correction else None,
        correction_diff=correction.correction_diff if correction else [],
        validation_summary=validation_summary_dict(
            validation_results_for_candidate(db, task.candidate_kind, candidate.id)
        ),
        publish_eligibility={},
    )
    db.add(decision)
    db.flush()
    eligibility = publish_eligibility_for_candidate(db, task.candidate_kind, candidate)
    decision.publish_eligibility = eligibility.model_dump(mode="json")
    db.add(decision)
    record_audit_event(
        db,
        project_id=task.project_id,
        event_type=AuditEventType.REVIEW_DECISION_RECORDED,
        candidate_kind=task.candidate_kind,
        candidate_id=task.candidate_id,
        review_task_id=task.id,
        review_decision_id=decision.id,
        original_snapshot=before,
        corrected_snapshot=correction.corrected_payload if correction else None,
        reason=payload.reason,
        metadata={
            "decision": payload.decision.value,
            "resulting_review_status": resulting_status.value,
        },
    )
    db.commit()
    db.refresh(decision)
    return _to_decision(decision)


@router.get(
    "/candidates/{candidate_kind}/{candidate_id}/corrections",
    response_model=list[CandidateCorrection],
    summary="List candidate corrections",
    responses={404: {"model": ApiErrorResponse}},
)
def list_candidate_corrections(
    candidate_kind: CandidateKind,
    candidate_id: str,
    db: Session = Depends(get_db),
) -> list[CandidateCorrection]:
    get_candidate_or_404(db, candidate_kind, candidate_id)
    corrections = db.scalars(
        select(CandidateCorrectionModel)
        .where(
            CandidateCorrectionModel.candidate_kind == candidate_kind,
            CandidateCorrectionModel.candidate_id == candidate_id,
        )
        .order_by(CandidateCorrectionModel.created_at.asc())
    ).all()
    return [_to_correction(correction) for correction in corrections]


@router.post(
    "/candidates/{candidate_kind}/{candidate_id}/corrections",
    response_model=CandidateCorrection,
    status_code=status.HTTP_201_CREATED,
    summary="Create candidate correction",
    responses={404: {"model": ApiErrorResponse}},
)
def create_candidate_correction(
    candidate_kind: CandidateKind,
    candidate_id: str,
    payload: CandidateCorrectionCreateRequest,
    db: Session = Depends(get_db),
) -> CandidateCorrection:
    task = _task_or_404(db, payload.review_task_id)
    candidate = get_candidate_or_404(db, candidate_kind, candidate_id)
    if task.candidate_kind != candidate_kind or task.candidate_id != candidate_id:
        raise ApiException(
            status_code=422,
            code="REVIEW_TASK_CANDIDATE_MISMATCH",
            message="Review task does not target the requested candidate.",
            details={"review_task_id": task.id, "candidate_id": candidate_id},
        )
    correction = _create_correction(
        db,
        task=task,
        candidate=candidate,
        corrected_payload=payload.corrected_payload,
        status_value=payload.status,
    )
    db.commit()
    db.refresh(correction)
    return _to_correction(correction)
