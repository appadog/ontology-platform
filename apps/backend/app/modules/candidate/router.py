from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import ValidationStatus
from app.core.errors import ApiErrorResponse, ApiException
from app.db.session import get_db
from app.modules.candidate.models import (
    CandidateEntity as CandidateEntityModel,
    CandidateEvidence as CandidateEvidenceModel,
    CandidateRelation as CandidateRelationModel,
)
from app.modules.candidate.schemas import CandidateEntity, CandidateEvidence, CandidateRelation
from app.modules.extraction.models import ExtractionJob as ExtractionJobModel

router = APIRouter(tags=["Candidate"])


def _not_found(code: str, message: str, **details: str) -> ApiException:
    return ApiException(status_code=404, code=code, message=message, details=details)


def _job_or_404(db: Session, job_id: str) -> ExtractionJobModel:
    job = db.get(ExtractionJobModel, job_id)
    if job is None:
        raise _not_found("EXTRACTION_JOB_NOT_FOUND", "Extraction job was not found.", job_id=job_id)
    return job


def _evidence_or_404(db: Session, evidence_id: str) -> CandidateEvidenceModel:
    evidence = db.get(CandidateEvidenceModel, evidence_id)
    if evidence is None:
        raise _not_found(
            "CANDIDATE_EVIDENCE_NOT_FOUND",
            "Candidate evidence was not found.",
            evidence_id=evidence_id,
        )
    return evidence


def _to_evidence(evidence: CandidateEvidenceModel) -> CandidateEvidence:
    return CandidateEvidence(
        id=evidence.id,
        source_id=evidence.source_id,
        source_segment_id=evidence.source_segment_id,
        source_type=evidence.source_type,
        file_name=evidence.file_name,
        sheet_name=evidence.sheet_name,
        row_index=evidence.row_index,
        column_name=evidence.column_name,
        page_number=evidence.page_number,
        section_title=evidence.section_title,
        paragraph_id=evidence.paragraph_id,
        chunk_id=evidence.chunk_id,
        evidence_text=evidence.evidence_text,
        start_offset=evidence.start_offset,
        end_offset=evidence.end_offset,
        metadata=evidence.metadata_ or {},
        created_at=evidence.created_at,
    )


def _to_entity(candidate: CandidateEntityModel) -> CandidateEntity:
    return CandidateEntity(
        id=candidate.id,
        extraction_job_id=candidate.extraction_job_id,
        project_id=candidate.project_id,
        source_id=candidate.source_id,
        source_segment_id=candidate.source_segment_id,
        ontology_version_id=candidate.ontology_version_id,
        class_id=candidate.class_id,
        model_run_id=candidate.model_run_id,
        prompt_version_id=candidate.prompt_version_id,
        entity_name=candidate.entity_name,
        normalized_name=candidate.normalized_name,
        property_values=candidate.property_values,
        confidence=candidate.confidence,
        evidence_ids=candidate.evidence_ids,
        raw_payload=candidate.raw_payload,
        validation_status=candidate.validation_status,
        validation_codes=candidate.validation_codes,
        review_status=candidate.review_status,
        publish_status=candidate.publish_status,
        created_at=candidate.created_at,
    )


def _to_relation(candidate: CandidateRelationModel) -> CandidateRelation:
    return CandidateRelation(
        id=candidate.id,
        extraction_job_id=candidate.extraction_job_id,
        project_id=candidate.project_id,
        source_id=candidate.source_id,
        source_segment_id=candidate.source_segment_id,
        ontology_version_id=candidate.ontology_version_id,
        relation_id=candidate.relation_id,
        model_run_id=candidate.model_run_id,
        prompt_version_id=candidate.prompt_version_id,
        source_candidate_entity_id=candidate.source_candidate_entity_id,
        target_candidate_entity_id=candidate.target_candidate_entity_id,
        confidence=candidate.confidence,
        evidence_ids=candidate.evidence_ids,
        raw_payload=candidate.raw_payload,
        validation_status=candidate.validation_status,
        validation_codes=candidate.validation_codes,
        review_status=candidate.review_status,
        publish_status=candidate.publish_status,
        created_at=candidate.created_at,
    )


@router.get(
    "/extraction-jobs/{job_id}/candidates/entities",
    response_model=list[CandidateEntity],
    summary="List candidate entities for an extraction job",
    responses={404: {"model": ApiErrorResponse}},
)
def list_candidate_entities(
    job_id: str,
    db: Session = Depends(get_db),
    source_id: str | None = Query(default=None),
    ontology_version_id: str | None = Query(default=None),
    validation_status: ValidationStatus | None = Query(default=None),
    has_evidence: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[CandidateEntity]:
    _job_or_404(db, job_id)
    statement = select(CandidateEntityModel).where(CandidateEntityModel.extraction_job_id == job_id)
    if source_id is not None:
        statement = statement.where(CandidateEntityModel.source_id == source_id)
    if ontology_version_id is not None:
        statement = statement.where(CandidateEntityModel.ontology_version_id == ontology_version_id)
    if validation_status is not None:
        statement = statement.where(CandidateEntityModel.validation_status == validation_status)
    candidates = db.scalars(statement.order_by(CandidateEntityModel.created_at.asc())).all()
    if has_evidence is not None:
        candidates = [
            candidate for candidate in candidates if bool(candidate.evidence_ids) is has_evidence
        ]
    return [_to_entity(candidate) for candidate in candidates[offset : offset + limit]]


@router.get(
    "/extraction-jobs/{job_id}/candidates/relations",
    response_model=list[CandidateRelation],
    summary="List candidate relations for an extraction job",
    responses={404: {"model": ApiErrorResponse}},
)
def list_candidate_relations(
    job_id: str,
    db: Session = Depends(get_db),
    source_id: str | None = Query(default=None),
    ontology_version_id: str | None = Query(default=None),
    validation_status: ValidationStatus | None = Query(default=None),
    has_evidence: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[CandidateRelation]:
    _job_or_404(db, job_id)
    statement = select(CandidateRelationModel).where(
        CandidateRelationModel.extraction_job_id == job_id
    )
    if source_id is not None:
        statement = statement.where(CandidateRelationModel.source_id == source_id)
    if ontology_version_id is not None:
        statement = statement.where(
            CandidateRelationModel.ontology_version_id == ontology_version_id
        )
    if validation_status is not None:
        statement = statement.where(CandidateRelationModel.validation_status == validation_status)
    candidates = db.scalars(statement.order_by(CandidateRelationModel.created_at.asc())).all()
    if has_evidence is not None:
        candidates = [
            candidate for candidate in candidates if bool(candidate.evidence_ids) is has_evidence
        ]
    return [_to_relation(candidate) for candidate in candidates[offset : offset + limit]]


@router.get(
    "/candidate-evidence/{evidence_id}",
    response_model=CandidateEvidence,
    summary="Get candidate evidence detail",
    responses={404: {"model": ApiErrorResponse}},
)
def get_candidate_evidence(evidence_id: str, db: Session = Depends(get_db)) -> CandidateEvidence:
    return _to_evidence(_evidence_or_404(db, evidence_id))
