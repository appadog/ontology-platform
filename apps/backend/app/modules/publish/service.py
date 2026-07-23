from collections.abc import Iterable
from datetime import datetime, timezone

import httpx
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.enums import (
    AuditEventType,
    CandidateKind,
    CandidateReviewStatus,
    PublishEligibilityReasonCode,
    PublishJobStatus,
    PublishStatus,
    ReviewDecisionType,
    ValidationResultSeverity,
    ValidationRuleCode,
    ValidationStatus,
    WebhookDeliveryStatus,
)
from app.modules.audit.service import record_audit_event
from app.modules.candidate.models import CandidateEntity, CandidateRelation
from app.modules.candidate.service import (
    CandidateRecord,
    candidate_snapshot,
    evidence_integrity,
    evidence_refs,
    get_candidate_or_404,
    list_project_candidates,
)
from app.modules.publish.models import (
    PublishedEntity as PublishedEntityModel,
    PublishedGraphVersion as PublishedGraphVersionModel,
    PublishedRelation as PublishedRelationModel,
    PublishJob as PublishJobModel,
)
from app.modules.publish.schemas import (
    EvidenceRef,
    PublishedEntity,
    PublishedGraphSnapshot,
    PublishedGraphVersion,
    PublishedLineage,
    PublishedRelation,
    PublishEligibility,
    PublishJob,
)
from app.modules.review.models import CandidateCorrection, ReviewDecision
from app.modules.validation.models import ValidationResult
from app.modules.validation.schemas import CandidateRef


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def validation_results_for_candidate(
    db: Session,
    kind: CandidateKind,
    candidate_id: str,
) -> list[ValidationResult]:
    return db.scalars(
        select(ValidationResult)
        .where(
            ValidationResult.candidate_kind == kind,
            ValidationResult.candidate_id == candidate_id,
        )
        .order_by(ValidationResult.created_at.asc())
    ).all()


def latest_review_decision(
    db: Session,
    kind: CandidateKind,
    candidate_id: str,
) -> ReviewDecision | None:
    return db.scalars(
        select(ReviewDecision)
        .where(ReviewDecision.candidate_kind == kind, ReviewDecision.candidate_id == candidate_id)
        .order_by(ReviewDecision.created_at.desc())
        .limit(1)
    ).first()


def latest_correction(
    db: Session,
    kind: CandidateKind,
    candidate_id: str,
) -> CandidateCorrection | None:
    return db.scalars(
        select(CandidateCorrection)
        .where(
            CandidateCorrection.candidate_kind == kind,
            CandidateCorrection.candidate_id == candidate_id,
        )
        .order_by(CandidateCorrection.created_at.desc())
        .limit(1)
    ).first()


def validation_summary_dict(results: Iterable[ValidationResult]) -> dict[str, int]:
    result_list = list(results)
    warning_count = sum(1 for result in result_list if result.severity == ValidationResultSeverity.WARNING)
    failed_count = sum(1 for result in result_list if result.severity == ValidationResultSeverity.FAILED)
    missing_count = sum(1 for result in result_list if result.rule_code == ValidationRuleCode.EVIDENCE_MISSING)
    return {
        "target_count": 1 if result_list else 0,
        "passed_count": 1 if result_list and warning_count == 0 and failed_count == 0 else 0,
        "warning_count": warning_count,
        "failed_count": failed_count,
        "missing_evidence_count": missing_count,
    }


def publish_eligibility_for_candidate(
    db: Session,
    kind: CandidateKind,
    candidate: CandidateRecord,
    *,
    ontology_version_id: str | None = None,
    actor_can_publish: bool = True,
) -> PublishEligibility:
    reasons: list[PublishEligibilityReasonCode] = []
    if not actor_can_publish:
        reasons.append(PublishEligibilityReasonCode.PUBLISH_PERMISSION_REQUIRED)

    if candidate.review_status == CandidateReviewStatus.PENDING:
        reasons.append(PublishEligibilityReasonCode.PENDING)
    elif candidate.review_status == CandidateReviewStatus.REJECTED:
        reasons.append(PublishEligibilityReasonCode.REJECTED)
    elif candidate.review_status == CandidateReviewStatus.NEEDS_DISCUSSION:
        reasons.append(PublishEligibilityReasonCode.NEEDS_DISCUSSION)
    elif candidate.review_status not in {
        CandidateReviewStatus.APPROVED,
        CandidateReviewStatus.MODIFIED,
    }:
        reasons.append(PublishEligibilityReasonCode.NOT_APPROVED_OR_MODIFIED)

    if candidate.publish_status == PublishStatus.PUBLISHED:
        reasons.append(PublishEligibilityReasonCode.ALREADY_PUBLISHED)

    if ontology_version_id is not None and candidate.ontology_version_id != ontology_version_id:
        reasons.append(PublishEligibilityReasonCode.ONTOLOGY_VERSION_MISMATCH)

    has_evidence, has_broken_evidence = evidence_integrity(db, candidate)
    if has_broken_evidence:
        reasons.append(PublishEligibilityReasonCode.BROKEN_EVIDENCE)
    elif not has_evidence:
        reasons.append(PublishEligibilityReasonCode.MISSING_EVIDENCE)

    results = validation_results_for_candidate(db, kind, candidate.id)
    has_failed_result = any(result.severity == ValidationResultSeverity.FAILED for result in results)
    if has_failed_result or candidate.validation_status == ValidationStatus.FAILED:
        reasons.append(PublishEligibilityReasonCode.FAILED_VALIDATION)

    has_missing_evidence_result = any(
        result.rule_code == ValidationRuleCode.EVIDENCE_MISSING for result in results
    ) or "MISSING_EVIDENCE" in set(candidate.validation_codes or [])
    if (
        has_missing_evidence_result
        and not has_broken_evidence
        and PublishEligibilityReasonCode.MISSING_EVIDENCE not in reasons
    ):
        reasons.append(PublishEligibilityReasonCode.MISSING_EVIDENCE)

    has_warning = any(result.severity == ValidationResultSeverity.WARNING for result in results) or (
        candidate.validation_status == ValidationStatus.WARNING
        and not has_missing_evidence_result
        and not has_broken_evidence
    )
    decision = latest_review_decision(db, kind, candidate.id)
    has_warning_reason = bool(decision and decision.reason and decision.reason.strip())
    if (
        has_warning
        and not has_warning_reason
        and PublishEligibilityReasonCode.MISSING_EVIDENCE not in reasons
        and PublishEligibilityReasonCode.BROKEN_EVIDENCE not in reasons
    ):
        reasons.append(PublishEligibilityReasonCode.WARNING_REASON_REQUIRED)

    if candidate.review_status == CandidateReviewStatus.MODIFIED:
        correction = latest_correction(db, kind, candidate.id)
        if correction is None or not correction.correction_diff:
            reasons.append(PublishEligibilityReasonCode.CORRECTION_DIFF_REQUIRED)

    if not reasons:
        reasons.append(PublishEligibilityReasonCode.ELIGIBLE)

    return PublishEligibility(
        candidate_kind=kind,
        candidate_id=candidate.id,
        eligible=reasons == [PublishEligibilityReasonCode.ELIGIBLE],
        reasons=reasons,
        review_status=candidate.review_status,
        publish_status=candidate.publish_status,
        validation_status=candidate.validation_status,
        has_evidence=has_evidence,
        has_warning_reason=has_warning_reason,
    )


def publish_eligibility_rows(
    db: Session,
    project_id: str,
    *,
    ontology_version_id: str | None = None,
    candidate_kind: CandidateKind | None = None,
) -> list[PublishEligibility]:
    rows = list_project_candidates(db, project_id, ontology_version_id=ontology_version_id)
    if candidate_kind is not None:
        rows = [(kind, candidate) for kind, candidate in rows if kind == candidate_kind]
    return [
        publish_eligibility_for_candidate(db, kind, candidate, ontology_version_id=ontology_version_id)
        for kind, candidate in rows
    ]


def to_publish_job(job: PublishJobModel) -> PublishJob:
    return PublishJob(
        id=job.id,
        project_id=job.project_id,
        ontology_version_id=job.ontology_version_id,
        status=job.status,
        requested_by=job.requested_by,
        candidate_refs=[CandidateRef(**ref) for ref in job.candidate_refs],
        eligible_count=job.eligible_count,
        published_entity_count=job.published_entity_count,
        published_relation_count=job.published_relation_count,
        skipped_count=job.skipped_count,
        skip_reasons=[PublishEligibility(**row) for row in job.skip_reasons],
        published_graph_version_id=job.published_graph_version_id,
        created_at=job.created_at,
        started_at=job.started_at,
        ended_at=job.ended_at,
        error_code=job.error_code,
        error_message=job.error_message,
        notify_webhook_url=job.notify_webhook_url,
        webhook_delivery_status=job.webhook_delivery_status,
        webhook_delivered_at=job.webhook_delivered_at,
        webhook_error_message=job.webhook_error_message,
    )


def to_graph_version(version: PublishedGraphVersionModel) -> PublishedGraphVersion:
    return PublishedGraphVersion(
        id=version.id,
        project_id=version.project_id,
        version=version.version,
        ontology_version_id=version.ontology_version_id,
        publish_job_id=version.publish_job_id,
        is_current=version.is_current,
        created_by=version.created_by,
        created_at=version.created_at,
        summary=version.summary or {},
    )


def _lineage(lineage: dict) -> PublishedLineage:
    return PublishedLineage(
        **{
            **lineage,
            "evidence_refs": [EvidenceRef(**ref) for ref in lineage.get("evidence_refs", [])],
        }
    )


def to_published_entity(entity: PublishedEntityModel) -> PublishedEntity:
    return PublishedEntity(
        id=entity.id,
        project_id=entity.project_id,
        published_graph_version_id=entity.published_graph_version_id,
        ontology_version_id=entity.ontology_version_id,
        class_id=entity.class_id,
        canonical_name=entity.canonical_name,
        properties=entity.properties or {},
        source_candidate_entity_ids=list(entity.source_candidate_entity_ids or []),
        original_snapshot=entity.original_snapshot,
        corrected_snapshot=entity.corrected_snapshot,
        lineage=_lineage(entity.lineage or {}),
        created_at=entity.created_at,
    )


def to_published_relation(relation: PublishedRelationModel) -> PublishedRelation:
    return PublishedRelation(
        id=relation.id,
        project_id=relation.project_id,
        published_graph_version_id=relation.published_graph_version_id,
        ontology_version_id=relation.ontology_version_id,
        source_published_entity_id=relation.source_published_entity_id,
        relation_id=relation.relation_id,
        target_published_entity_id=relation.target_published_entity_id,
        properties=relation.properties or {},
        source_candidate_relation_ids=list(relation.source_candidate_relation_ids or []),
        original_snapshot=relation.original_snapshot,
        corrected_snapshot=relation.corrected_snapshot,
        lineage=_lineage(relation.lineage or {}),
        created_at=relation.created_at,
    )


def current_graph_version(db: Session, project_id: str) -> PublishedGraphVersionModel | None:
    return db.scalars(
        select(PublishedGraphVersionModel)
        .where(
            PublishedGraphVersionModel.project_id == project_id,
            PublishedGraphVersionModel.is_current.is_(True),
        )
        .order_by(PublishedGraphVersionModel.version.desc())
        .limit(1)
    ).first()


def graph_snapshot(db: Session, version: PublishedGraphVersionModel) -> PublishedGraphSnapshot:
    entities = db.scalars(
        select(PublishedEntityModel)
        .where(PublishedEntityModel.published_graph_version_id == version.id)
        .order_by(PublishedEntityModel.created_at.asc(), PublishedEntityModel.id.asc())
    ).all()
    relations = db.scalars(
        select(PublishedRelationModel)
        .where(PublishedRelationModel.published_graph_version_id == version.id)
        .order_by(PublishedRelationModel.created_at.asc(), PublishedRelationModel.id.asc())
    ).all()
    return PublishedGraphSnapshot(
        version=to_graph_version(version),
        entities=[to_published_entity(entity) for entity in entities],
        relations=[to_published_relation(relation) for relation in relations],
    )


def deliver_publish_webhook(db: Session, job: PublishJobModel) -> None:
    if not job.notify_webhook_url:
        return

    payload = {
        "publish_job_id": job.id,
        "project_id": job.project_id,
        "status": job.status.value,
        "eligible_count": job.eligible_count,
        "published_entity_count": job.published_entity_count,
        "published_relation_count": job.published_relation_count,
        "skipped_count": job.skipped_count,
        "published_graph_version_id": job.published_graph_version_id,
        "ended_at": job.ended_at.isoformat() if job.ended_at else None,
    }
    try:
        response = httpx.post(job.notify_webhook_url, json=payload, timeout=5.0)
        response.raise_for_status()
    except Exception as error:  # noqa: BLE001 - delivery to an external URL is best-effort and must never fail the publish job
        job.webhook_delivery_status = WebhookDeliveryStatus.FAILED
        job.webhook_error_message = str(error)[:500]
        db.add(job)
        record_audit_event(
            db,
            project_id=job.project_id,
            event_type=AuditEventType.PUBLISH_JOB_WEBHOOK_FAILED,
            publish_job_id=job.id,
            metadata={"notify_webhook_url": job.notify_webhook_url, "error": job.webhook_error_message},
        )
        return

    job.webhook_delivery_status = WebhookDeliveryStatus.DELIVERED
    job.webhook_delivered_at = utc_now()
    db.add(job)
    record_audit_event(
        db,
        project_id=job.project_id,
        event_type=AuditEventType.PUBLISH_JOB_WEBHOOK_DELIVERED,
        publish_job_id=job.id,
        metadata={"notify_webhook_url": job.notify_webhook_url},
    )


def run_publish_job(db: Session, job: PublishJobModel) -> PublishJobModel:
    if job.status != PublishJobStatus.PENDING:
        return job

    started_at = utc_now()
    job.status = PublishJobStatus.RUNNING
    job.started_at = started_at
    db.add(job)
    db.flush()

    candidate_refs = [CandidateRef(**ref) for ref in job.candidate_refs]
    candidates: list[tuple[CandidateRef, CandidateRecord, PublishEligibility]] = []
    skip_reasons: list[PublishEligibility] = []
    for ref in candidate_refs:
        candidate = get_candidate_or_404(db, ref.candidate_kind, ref.candidate_id)
        eligibility = publish_eligibility_for_candidate(
            db,
            ref.candidate_kind,
            candidate,
            ontology_version_id=job.ontology_version_id,
        )
        if eligibility.eligible:
            candidates.append((ref, candidate, eligibility))
        else:
            skip_reasons.append(eligibility)

    entity_candidates = [
        (ref, candidate)
        for ref, candidate, _ in candidates
        if ref.candidate_kind == CandidateKind.ENTITY
    ]
    relation_candidates = [
        (ref, candidate)
        for ref, candidate, _ in candidates
        if ref.candidate_kind == CandidateKind.RELATION
    ]

    if not entity_candidates and not relation_candidates:
        job.status = PublishJobStatus.SUCCESS
        job.eligible_count = 0
        job.skipped_count = len(skip_reasons)
        job.skip_reasons = [reason.model_dump(mode="json") for reason in skip_reasons]
        job.ended_at = utc_now()
        db.add(job)
        db.flush()
        deliver_publish_webhook(db, job)
        db.flush()
        return job

    db.execute(
        update(PublishedGraphVersionModel)
        .where(PublishedGraphVersionModel.project_id == job.project_id)
        .values(is_current=False)
    )
    next_version = (
        db.scalar(
            select(func.max(PublishedGraphVersionModel.version)).where(
                PublishedGraphVersionModel.project_id == job.project_id
            )
        )
        or 0
    ) + 1
    graph_version = PublishedGraphVersionModel(
        project_id=job.project_id,
        version=next_version,
        ontology_version_id=job.ontology_version_id,
        publish_job_id=job.id,
        is_current=True,
        created_by=job.requested_by,
        summary={},
    )
    db.add(graph_version)
    db.flush()

    entity_id_by_candidate_id: dict[str, str] = {}
    published_entity_count = 0
    for ref, candidate in entity_candidates:
        assert isinstance(candidate, CandidateEntity)
        published = _publish_entity(db, job, graph_version, ref, candidate)
        entity_id_by_candidate_id[candidate.id] = published.id
        published_entity_count += 1

    published_relation_count = 0
    for ref, candidate in relation_candidates:
        assert isinstance(candidate, CandidateRelation)
        source_published_id = entity_id_by_candidate_id.get(candidate.source_candidate_entity_id or "")
        target_published_id = entity_id_by_candidate_id.get(candidate.target_candidate_entity_id or "")
        if source_published_id is None or target_published_id is None:
            skip_reasons.append(
                PublishEligibility(
                    candidate_kind=ref.candidate_kind,
                    candidate_id=ref.candidate_id,
                    eligible=False,
                    reasons=[PublishEligibilityReasonCode.NOT_APPROVED_OR_MODIFIED],
                    review_status=candidate.review_status,
                    publish_status=candidate.publish_status,
                    validation_status=candidate.validation_status,
                    has_evidence=evidence_integrity(db, candidate)[0],
                    has_warning_reason=bool(latest_review_decision(db, ref.candidate_kind, candidate.id)),
                )
            )
            continue
        _publish_relation(db, job, graph_version, ref, candidate, source_published_id, target_published_id)
        published_relation_count += 1

    graph_version.summary = {
        "published_entity_count": published_entity_count,
        "published_relation_count": published_relation_count,
        "skipped_count": len(skip_reasons),
    }
    job.status = PublishJobStatus.PARTIAL_FAILED if skip_reasons else PublishJobStatus.SUCCESS
    job.eligible_count = len(candidates)
    job.published_entity_count = published_entity_count
    job.published_relation_count = published_relation_count
    job.skipped_count = len(skip_reasons)
    job.skip_reasons = [reason.model_dump(mode="json") for reason in skip_reasons]
    job.published_graph_version_id = graph_version.id
    job.ended_at = utc_now()
    db.add(job)
    db.add(graph_version)
    record_audit_event(
        db,
        project_id=job.project_id,
        event_type=AuditEventType.PUBLISHED_GRAPH_VERSION_CREATED,
        publish_job_id=job.id,
        published_graph_version_id=graph_version.id,
        metadata=graph_version.summary,
    )
    record_audit_event(
        db,
        project_id=job.project_id,
        event_type=AuditEventType.PUBLISHED_GRAPH_CURRENT_POINTER_UPDATED,
        publish_job_id=job.id,
        published_graph_version_id=graph_version.id,
        metadata={"version": graph_version.version},
    )
    record_audit_event(
        db,
        project_id=job.project_id,
        event_type=AuditEventType.PUBLISH_JOB_COMPLETED,
        publish_job_id=job.id,
        published_graph_version_id=graph_version.id,
        metadata={"skip_reasons": job.skip_reasons},
    )
    deliver_publish_webhook(db, job)
    db.flush()
    return job


def _publish_entity(
    db: Session,
    job: PublishJobModel,
    graph_version: PublishedGraphVersionModel,
    ref: CandidateRef,
    candidate: CandidateEntity,
) -> PublishedEntityModel:
    snapshot = candidate_snapshot(CandidateKind.ENTITY, candidate)
    correction = latest_correction(db, CandidateKind.ENTITY, candidate.id)
    corrected_payload = correction.corrected_payload if correction is not None else None
    decision = latest_review_decision(db, CandidateKind.ENTITY, candidate.id)
    canonical_name = (
        (corrected_payload or {}).get("normalized_name")
        or (corrected_payload or {}).get("entity_name")
        or candidate.normalized_name
        or candidate.entity_name
    )
    published_at = utc_now()
    lineage = _lineage_dict(
        db,
        job=job,
        graph_version=graph_version,
        ref=ref,
        candidate=candidate,
        snapshot=snapshot,
        corrected_payload=corrected_payload,
        decision=decision,
        published_at=published_at,
    )
    published = PublishedEntityModel(
        project_id=job.project_id,
        published_graph_version_id=graph_version.id,
        ontology_version_id=job.ontology_version_id,
        class_id=(corrected_payload or {}).get("class_id") or candidate.class_id or "",
        canonical_name=canonical_name,
        properties=(corrected_payload or {}).get("property_values") or candidate.property_values or {},
        source_candidate_entity_ids=[candidate.id],
        original_snapshot=snapshot,
        corrected_snapshot=corrected_payload,
        lineage=lineage,
        created_at=published_at,
    )
    db.add(published)
    candidate.publish_status = PublishStatus.PUBLISHED
    db.add(candidate)
    db.flush()
    return published


def _publish_relation(
    db: Session,
    job: PublishJobModel,
    graph_version: PublishedGraphVersionModel,
    ref: CandidateRef,
    candidate: CandidateRelation,
    source_published_id: str,
    target_published_id: str,
) -> PublishedRelationModel:
    snapshot = candidate_snapshot(CandidateKind.RELATION, candidate)
    correction = latest_correction(db, CandidateKind.RELATION, candidate.id)
    corrected_payload = correction.corrected_payload if correction is not None else None
    decision = latest_review_decision(db, CandidateKind.RELATION, candidate.id)
    published_at = utc_now()
    lineage = _lineage_dict(
        db,
        job=job,
        graph_version=graph_version,
        ref=ref,
        candidate=candidate,
        snapshot=snapshot,
        corrected_payload=corrected_payload,
        decision=decision,
        published_at=published_at,
    )
    published = PublishedRelationModel(
        project_id=job.project_id,
        published_graph_version_id=graph_version.id,
        ontology_version_id=job.ontology_version_id,
        source_published_entity_id=source_published_id,
        relation_id=(corrected_payload or {}).get("relation_id") or candidate.relation_id or "",
        target_published_entity_id=target_published_id,
        properties=(corrected_payload or {}).get("properties") or {},
        source_candidate_relation_ids=[candidate.id],
        original_snapshot=snapshot,
        corrected_snapshot=corrected_payload,
        lineage=lineage,
        created_at=published_at,
    )
    db.add(published)
    candidate.publish_status = PublishStatus.PUBLISHED
    db.add(candidate)
    db.flush()
    return published


def _lineage_dict(
    db: Session,
    *,
    job: PublishJobModel,
    graph_version: PublishedGraphVersionModel,
    ref: CandidateRef,
    candidate: CandidateRecord,
    snapshot: dict,
    corrected_payload: dict | None,
    decision: ReviewDecision | None,
    published_at: datetime,
) -> dict:
    return {
        "publish_job_id": job.id,
        "published_graph_version_id": graph_version.id,
        "published_graph_version": graph_version.version,
        "ontology_version_id": job.ontology_version_id,
        "candidate_kind": ref.candidate_kind.value,
        "candidate_id": ref.candidate_id,
        "original_snapshot": snapshot,
        "original_snapshot_ref": f"{ref.candidate_kind.value}:{ref.candidate_id}",
        "corrected_snapshot": corrected_payload,
        "evidence_refs": evidence_refs(db, candidate),
        "reviewer_id": decision.reviewer_id if decision else "dev-user",
        "reviewer_display_name": decision.reviewer_id if decision else "dev-user",
        "review_decision_id": decision.id if decision else "",
        "review_decision_type": decision.decision.value if decision else ReviewDecisionType.APPROVE.value,
        "reason": decision.reason if decision else None,
        "reviewed_at": (decision.created_at if decision else published_at).isoformat(),
        "published_at": published_at.isoformat(),
    }
