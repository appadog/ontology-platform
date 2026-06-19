from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import (
    AuditEventType,
    CandidateKind,
    ValidationJobStatus,
    ValidationResultSeverity,
    ValidationRuleCode,
    ValidationStatus,
)
from app.core.errors import ApiErrorResponse, ApiException
from app.db.session import get_db
from app.modules.audit.service import record_audit_event
from app.modules.candidate.models import CandidateEntity, CandidateRelation
from app.modules.candidate.service import (
    CandidateRecord,
    candidate_snapshot,
    evidence_integrity,
    get_candidate_or_404,
    list_project_candidates,
)
from app.modules.project.models import Project
from app.modules.validation.models import (
    ValidationJob as ValidationJobModel,
    ValidationResult as ValidationResultModel,
)
from app.modules.validation.schemas import (
    ValidationJob,
    ValidationJobCreateRequest,
    ValidationResult,
    ValidationSummary,
)

router = APIRouter(tags=["Validation"])


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


def _validation_job_or_404(db: Session, validation_job_id: str) -> ValidationJobModel:
    job = db.get(ValidationJobModel, validation_job_id)
    if job is None:
        raise ApiException(
            status_code=404,
            code="VALIDATION_JOB_NOT_FOUND",
            message="Validation job was not found.",
            details={"validation_job_id": validation_job_id},
        )
    return job


def _to_summary(summary: dict) -> ValidationSummary:
    return ValidationSummary(**(summary or {}))


def to_validation_job(job: ValidationJobModel) -> ValidationJob:
    return ValidationJob(
        id=job.id,
        project_id=job.project_id,
        ontology_version_id=job.ontology_version_id,
        source_id=job.source_id,
        extraction_job_id=job.extraction_job_id,
        status=job.status,
        requested_by=job.requested_by,
        created_at=job.created_at,
        started_at=job.started_at,
        ended_at=job.ended_at,
        summary=_to_summary(job.summary),
        error_code=job.error_code,
        error_message=job.error_message,
    )


def to_validation_result(result: ValidationResultModel) -> ValidationResult:
    return ValidationResult(
        id=result.id,
        validation_job_id=result.validation_job_id,
        project_id=result.project_id,
        ontology_version_id=result.ontology_version_id,
        candidate_kind=result.candidate_kind,
        candidate_id=result.candidate_id,
        rule_code=result.rule_code,
        severity=result.severity,
        message=result.message,
        field_path=result.field_path,
        blocking=result.blocking,
        suggested_fix=result.suggested_fix,
        details=result.details or {},
        created_at=result.created_at,
    )


def _candidate_refs_for_scope(
    db: Session,
    project_id: str,
    payload: ValidationJobCreateRequest,
) -> list[tuple[CandidateKind, CandidateRecord]]:
    if payload.candidate_refs:
        candidates = [
            (ref.candidate_kind, get_candidate_or_404(db, ref.candidate_kind, ref.candidate_id))
            for ref in payload.candidate_refs
        ]
    else:
        candidates = list_project_candidates(
            db,
            project_id,
            ontology_version_id=payload.ontology_version_id,
            source_id=payload.source_id,
            extraction_job_id=payload.extraction_job_id,
        )
    scoped: list[tuple[CandidateKind, CandidateRecord]] = []
    for kind, candidate in candidates:
        if candidate.project_id != project_id:
            raise ApiException(
                status_code=422,
                code="PROJECT_SCOPE_MISMATCH",
                message="Candidate does not belong to the target project.",
                details={"candidate_kind": kind.value, "candidate_id": candidate.id},
            )
        scoped.append((kind, candidate))
    return scoped


def _candidate_results(
    db: Session,
    *,
    kind: CandidateKind,
    candidate: CandidateRecord,
    validation_job: ValidationJobModel,
) -> list[ValidationResultModel]:
    planned: list[dict] = []
    if candidate.ontology_version_id != validation_job.ontology_version_id:
        planned.append(
            {
                "rule_code": ValidationRuleCode.ONTOLOGY_VERSION_MISMATCH,
                "severity": ValidationResultSeverity.FAILED,
                "message": "Candidate ontology version does not match validation job.",
                "field_path": "ontology_version_id",
                "blocking": True,
                "suggested_fix": "Validate candidates against their source ontology version.",
            }
        )
    if kind == CandidateKind.ENTITY:
        assert isinstance(candidate, CandidateEntity)
        if candidate.class_id is None:
            planned.append(
                {
                    "rule_code": ValidationRuleCode.CLASS_EXISTS,
                    "severity": ValidationResultSeverity.FAILED,
                    "message": "Candidate entity has no ontology class.",
                    "field_path": "class_id",
                    "blocking": True,
                    "suggested_fix": "Select an ontology class before publishing.",
                }
            )
    elif kind == CandidateKind.RELATION:
        assert isinstance(candidate, CandidateRelation)
        if candidate.relation_id is None:
            planned.append(
                {
                    "rule_code": ValidationRuleCode.RELATION_EXISTS,
                    "severity": ValidationResultSeverity.FAILED,
                    "message": "Candidate relation has no ontology relation.",
                    "field_path": "relation_id",
                    "blocking": True,
                    "suggested_fix": "Select an ontology relation before publishing.",
                }
            )
        if candidate.source_candidate_entity_id is None or candidate.target_candidate_entity_id is None:
            planned.append(
                {
                    "rule_code": ValidationRuleCode.ORPHAN_NODE,
                    "severity": ValidationResultSeverity.FAILED,
                    "message": "Candidate relation is missing source or target entity.",
                    "field_path": "source_candidate_entity_id",
                    "blocking": True,
                    "suggested_fix": "Attach both relation endpoints before publishing.",
                }
            )

    has_evidence, has_broken_evidence = evidence_integrity(db, candidate)
    if has_broken_evidence:
        planned.append(
            {
                "rule_code": ValidationRuleCode.EVIDENCE_MISSING,
                "severity": ValidationResultSeverity.FAILED,
                "message": "Candidate evidence reference is broken.",
                "field_path": "evidence_ids",
                "blocking": True,
                "suggested_fix": "Repair or replace the evidence reference.",
                "details": {"broken_evidence": True},
            }
        )
    elif not has_evidence:
        planned.append(
            {
                "rule_code": ValidationRuleCode.EVIDENCE_MISSING,
                "severity": ValidationResultSeverity.WARNING,
                "message": "Candidate has no publishable evidence.",
                "field_path": "evidence_ids",
                "blocking": True,
                "suggested_fix": "Attach evidence before publishing.",
            }
        )
    elif candidate.confidence < 0.9:
        planned.append(
            {
                "rule_code": ValidationRuleCode.LOW_CONFIDENCE,
                "severity": ValidationResultSeverity.WARNING,
                "message": "Candidate confidence is below review threshold.",
                "field_path": "confidence",
                "blocking": False,
                "suggested_fix": "Confirm the candidate against evidence.",
                "details": {"confidence": candidate.confidence},
            }
        )

    if not planned:
        planned.append(
            {
                "rule_code": (
                    ValidationRuleCode.CLASS_EXISTS
                    if kind == CandidateKind.ENTITY
                    else ValidationRuleCode.RELATION_EXISTS
                ),
                "severity": ValidationResultSeverity.INFO,
                "message": "Candidate passed deterministic validation.",
                "field_path": "",
                "blocking": False,
                "suggested_fix": None,
            }
        )

    results = [
        ValidationResultModel(
            validation_job_id=validation_job.id,
            project_id=validation_job.project_id,
            ontology_version_id=validation_job.ontology_version_id,
            candidate_kind=kind,
            candidate_id=candidate.id,
            rule_code=item["rule_code"],
            severity=item["severity"],
            message=item["message"],
            field_path=item["field_path"],
            blocking=item["blocking"],
            suggested_fix=item.get("suggested_fix"),
            details=item.get("details", {}),
        )
        for item in planned
    ]
    for result in results:
        db.add(result)
    if any(result.severity == ValidationResultSeverity.FAILED for result in results):
        candidate.validation_status = ValidationStatus.FAILED
    elif any(result.severity == ValidationResultSeverity.WARNING for result in results):
        candidate.validation_status = ValidationStatus.WARNING
    else:
        candidate.validation_status = ValidationStatus.PASSED
    candidate.validation_codes = [result.rule_code.value for result in results]
    db.add(candidate)
    db.flush()
    return results


def _summary(results_by_candidate: list[list[ValidationResultModel]]) -> ValidationSummary:
    passed = 0
    warning = 0
    failed = 0
    missing = 0
    for results in results_by_candidate:
        if any(result.rule_code == ValidationRuleCode.EVIDENCE_MISSING for result in results):
            missing += 1
        if any(result.severity == ValidationResultSeverity.FAILED for result in results):
            failed += 1
        elif any(result.severity == ValidationResultSeverity.WARNING for result in results):
            warning += 1
        else:
            passed += 1
    return ValidationSummary(
        target_count=len(results_by_candidate),
        passed_count=passed,
        warning_count=warning,
        failed_count=failed,
        missing_evidence_count=missing,
    )


@router.post(
    "/projects/{project_id}/validation-jobs",
    response_model=ValidationJob,
    status_code=status.HTTP_201_CREATED,
    summary="Create validation job",
    responses={404: {"model": ApiErrorResponse}, 422: {"model": ApiErrorResponse}},
)
def create_validation_job(
    project_id: str,
    payload: ValidationJobCreateRequest,
    db: Session = Depends(get_db),
) -> ValidationJob:
    _project_or_404(db, project_id)
    candidates = _candidate_refs_for_scope(db, project_id, payload)
    now = utc_now()
    validation_job = ValidationJobModel(
        project_id=project_id,
        ontology_version_id=payload.ontology_version_id,
        source_id=payload.source_id,
        extraction_job_id=payload.extraction_job_id,
        status=ValidationJobStatus.RUNNING,
        requested_by="dev-user",
        started_at=now,
        summary={},
    )
    db.add(validation_job)
    db.flush()
    record_audit_event(
        db,
        project_id=project_id,
        event_type=AuditEventType.VALIDATION_JOB_CREATED,
        validation_job_id=validation_job.id,
        metadata={"target_count": len(candidates)},
    )

    results_by_candidate = [
        _candidate_results(db, kind=kind, candidate=candidate, validation_job=validation_job)
        for kind, candidate in candidates
    ]
    for (kind, candidate), results in zip(candidates, results_by_candidate, strict=True):
        for result in results:
            record_audit_event(
                db,
                project_id=project_id,
                event_type=AuditEventType.VALIDATION_RESULT_RECORDED,
                candidate_kind=kind,
                candidate_id=candidate.id,
                validation_job_id=validation_job.id,
                original_snapshot=candidate_snapshot(kind, candidate),
                metadata={
                    "validation_result_id": result.id,
                    "rule_code": result.rule_code.value,
                    "severity": result.severity.value,
                },
            )

    summary = _summary(results_by_candidate)
    validation_job.status = ValidationJobStatus.SUCCESS
    validation_job.summary = summary.model_dump()
    validation_job.ended_at = utc_now()
    db.add(validation_job)
    db.commit()
    db.refresh(validation_job)
    return to_validation_job(validation_job)


@router.get(
    "/projects/{project_id}/validation-jobs",
    response_model=list[ValidationJob],
    summary="List validation jobs",
    responses={404: {"model": ApiErrorResponse}},
)
def list_validation_jobs(
    project_id: str,
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[ValidationJob]:
    _project_or_404(db, project_id)
    jobs = db.scalars(
        select(ValidationJobModel)
        .where(ValidationJobModel.project_id == project_id)
        .order_by(ValidationJobModel.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return [to_validation_job(job) for job in jobs]


@router.get(
    "/validation-jobs/{validation_job_id}",
    response_model=ValidationJob,
    summary="Get validation job",
    responses={404: {"model": ApiErrorResponse}},
)
def get_validation_job(validation_job_id: str, db: Session = Depends(get_db)) -> ValidationJob:
    return to_validation_job(_validation_job_or_404(db, validation_job_id))


@router.get(
    "/validation-jobs/{validation_job_id}/results",
    response_model=list[ValidationResult],
    summary="List validation results",
    responses={404: {"model": ApiErrorResponse}},
)
def list_validation_results(
    validation_job_id: str,
    db: Session = Depends(get_db),
    candidate_kind: CandidateKind | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[ValidationResult]:
    _validation_job_or_404(db, validation_job_id)
    statement = select(ValidationResultModel).where(
        ValidationResultModel.validation_job_id == validation_job_id
    )
    if candidate_kind is not None:
        statement = statement.where(ValidationResultModel.candidate_kind == candidate_kind)
    results = db.scalars(
        statement.order_by(ValidationResultModel.created_at.asc()).limit(limit).offset(offset)
    ).all()
    return [to_validation_result(result) for result in results]
