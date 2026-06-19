from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import CandidateKind
from app.core.errors import ApiException
from app.modules.candidate.models import CandidateEntity, CandidateEvidence, CandidateRelation
from app.modules.source.models import SourceSegment

CandidateRecord = CandidateEntity | CandidateRelation


def unsupported_candidate_kind(kind: CandidateKind) -> ApiException:
    return ApiException(
        status_code=422,
        code="CANDIDATE_KIND_NOT_SUPPORTED",
        message="This candidate kind is not implemented in the MVP3 thin slice.",
        details={"candidate_kind": kind.value},
    )


def get_candidate_or_404(
    db: Session,
    kind: CandidateKind,
    candidate_id: str,
) -> CandidateRecord:
    if kind == CandidateKind.ENTITY:
        candidate = db.get(CandidateEntity, candidate_id)
    elif kind == CandidateKind.RELATION:
        candidate = db.get(CandidateRelation, candidate_id)
    else:
        raise unsupported_candidate_kind(kind)
    if candidate is None:
        raise ApiException(
            status_code=404,
            code="CANDIDATE_NOT_FOUND",
            message="Candidate was not found.",
            details={"candidate_kind": kind.value, "candidate_id": candidate_id},
        )
    return candidate


def list_project_candidates(
    db: Session,
    project_id: str,
    *,
    ontology_version_id: str | None = None,
    source_id: str | None = None,
    extraction_job_id: str | None = None,
) -> list[tuple[CandidateKind, CandidateRecord]]:
    entity_statement = select(CandidateEntity).where(CandidateEntity.project_id == project_id)
    relation_statement = select(CandidateRelation).where(CandidateRelation.project_id == project_id)
    if ontology_version_id is not None:
        entity_statement = entity_statement.where(
            CandidateEntity.ontology_version_id == ontology_version_id
        )
        relation_statement = relation_statement.where(
            CandidateRelation.ontology_version_id == ontology_version_id
        )
    if source_id is not None:
        entity_statement = entity_statement.where(CandidateEntity.source_id == source_id)
        relation_statement = relation_statement.where(CandidateRelation.source_id == source_id)
    if extraction_job_id is not None:
        entity_statement = entity_statement.where(
            CandidateEntity.extraction_job_id == extraction_job_id
        )
        relation_statement = relation_statement.where(
            CandidateRelation.extraction_job_id == extraction_job_id
        )
    entities = db.scalars(entity_statement.order_by(CandidateEntity.created_at.asc())).all()
    relations = db.scalars(relation_statement.order_by(CandidateRelation.created_at.asc())).all()
    return [(CandidateKind.ENTITY, entity) for entity in entities] + [
        (CandidateKind.RELATION, relation) for relation in relations
    ]


def candidate_display_name(kind: CandidateKind, candidate: CandidateRecord) -> str:
    if kind == CandidateKind.ENTITY:
        return candidate.entity_name
    if candidate.relation_id is not None:
        return f"Relation {candidate.relation_id}"
    return "Relation candidate"


def candidate_snapshot(kind: CandidateKind, candidate: CandidateRecord) -> dict[str, Any]:
    base = {
        "id": candidate.id,
        "project_id": candidate.project_id,
        "source_id": candidate.source_id,
        "source_segment_id": candidate.source_segment_id,
        "ontology_version_id": candidate.ontology_version_id,
        "extraction_job_id": candidate.extraction_job_id,
        "model_run_id": candidate.model_run_id,
        "prompt_version_id": candidate.prompt_version_id,
        "confidence": candidate.confidence,
        "evidence_ids": list(candidate.evidence_ids or []),
        "raw_payload": dict(candidate.raw_payload or {}),
        "validation_status": candidate.validation_status.value,
        "validation_codes": list(candidate.validation_codes or []),
        "review_status": candidate.review_status.value,
        "publish_status": candidate.publish_status.value,
        "created_at": candidate.created_at.isoformat(),
    }
    if kind == CandidateKind.ENTITY:
        return {
            **base,
            "candidate_kind": kind.value,
            "class_id": candidate.class_id,
            "entity_name": candidate.entity_name,
            "normalized_name": candidate.normalized_name,
            "property_values": dict(candidate.property_values or {}),
        }
    return {
        **base,
        "candidate_kind": kind.value,
        "relation_id": candidate.relation_id,
        "source_candidate_entity_id": candidate.source_candidate_entity_id,
        "target_candidate_entity_id": candidate.target_candidate_entity_id,
    }


def correction_diff(
    before_snapshot: dict[str, Any],
    corrected_payload: dict[str, Any],
) -> list[dict[str, Any]]:
    diff: list[dict[str, Any]] = []
    for path, after in corrected_payload.items():
        before = before_snapshot.get(path)
        if before != after:
            diff.append({"path": path, "before": before, "after": after})
    return diff


def evidence_integrity(db: Session, candidate: CandidateRecord) -> tuple[bool, bool]:
    evidence_ids = list(candidate.evidence_ids or [])
    if not evidence_ids:
        return False, False
    evidence_rows = db.scalars(
        select(CandidateEvidence).where(CandidateEvidence.id.in_(evidence_ids))
    ).all()
    if len(evidence_rows) != len(set(evidence_ids)):
        return False, True
    for evidence in evidence_rows:
        if evidence.source_segment_id is None:
            continue
        segment = db.get(SourceSegment, evidence.source_segment_id)
        if segment is None or segment.source_id != evidence.source_id:
            return False, True
    return True, False


def evidence_refs(db: Session, candidate: CandidateRecord) -> list[dict[str, str | None]]:
    evidence_ids = list(candidate.evidence_ids or [])
    if not evidence_ids:
        return []
    evidence_rows = db.scalars(
        select(CandidateEvidence).where(CandidateEvidence.id.in_(evidence_ids))
    ).all()
    rows_by_id = {row.id: row for row in evidence_rows}
    refs: list[dict[str, str | None]] = []
    for evidence_id in evidence_ids:
        evidence = rows_by_id.get(evidence_id)
        refs.append(
            {
                "evidence_id": evidence_id,
                "source_id": evidence.source_id if evidence else None,
                "source_segment_id": evidence.source_segment_id if evidence else None,
                "label": evidence.evidence_text[:80] if evidence and evidence.evidence_text else None,
            }
        )
    return refs
