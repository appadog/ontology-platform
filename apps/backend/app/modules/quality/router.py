from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import (
    CandidateReviewStatus,
    PublishJobStatus,
    PublishStatus,
    QualityDrilldownTarget,
    ValidationStatus,
)
from app.core.errors import ApiErrorResponse, ApiException
from app.db.session import get_db
from app.modules.candidate.models import CandidateEntity, CandidateRelation
from app.modules.project.models import Project
from app.modules.publish.models import PublishedEntity, PublishedGraphVersion, PublishedRelation, PublishJob
from app.modules.quality.schemas import (
    QualityCandidateCounts,
    QualityPublishCounts,
    QualityRates,
    QualityReviewCounts,
    QualitySummary,
    QualityValidationCounts,
    count_metric,
    rate_metric,
)

router = APIRouter(tags=["Quality"])


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


def _candidates(
    db: Session,
    project_id: str,
    *,
    ontology_version_id: str | None,
    source_id: str | None,
    extraction_job_id: str | None,
) -> tuple[list[CandidateEntity], list[CandidateRelation]]:
    entity_statement = select(CandidateEntity).where(CandidateEntity.project_id == project_id)
    relation_statement = select(CandidateRelation).where(CandidateRelation.project_id == project_id)
    if ontology_version_id is not None:
        entity_statement = entity_statement.where(CandidateEntity.ontology_version_id == ontology_version_id)
        relation_statement = relation_statement.where(
            CandidateRelation.ontology_version_id == ontology_version_id
        )
    if source_id is not None:
        entity_statement = entity_statement.where(CandidateEntity.source_id == source_id)
        relation_statement = relation_statement.where(CandidateRelation.source_id == source_id)
    if extraction_job_id is not None:
        entity_statement = entity_statement.where(CandidateEntity.extraction_job_id == extraction_job_id)
        relation_statement = relation_statement.where(
            CandidateRelation.extraction_job_id == extraction_job_id
        )
    return db.scalars(entity_statement).all(), db.scalars(relation_statement).all()


def _current_version(db: Session, project_id: str) -> PublishedGraphVersion | None:
    return db.scalars(
        select(PublishedGraphVersion)
        .where(PublishedGraphVersion.project_id == project_id, PublishedGraphVersion.is_current.is_(True))
        .order_by(PublishedGraphVersion.version.desc())
        .limit(1)
    ).first()


@router.get(
    "/projects/{project_id}/quality/summary",
    response_model=QualitySummary,
    summary="Get quality summary v0.1",
    responses={404: {"model": ApiErrorResponse}},
)
def get_quality_summary(
    project_id: str,
    db: Session = Depends(get_db),
    ontology_version_id: str | None = Query(default=None),
    source_id: str | None = Query(default=None),
    extraction_job_id: str | None = Query(default=None),
) -> QualitySummary:
    _project_or_404(db, project_id)
    entities, relations = _candidates(
        db,
        project_id,
        ontology_version_id=ontology_version_id,
        source_id=source_id,
        extraction_job_id=extraction_job_id,
    )
    all_candidates = [*entities, *relations]
    total = len(all_candidates)
    missing_evidence = sum(
        1
        for candidate in all_candidates
        if not candidate.evidence_ids or "MISSING_EVIDENCE" in set(candidate.validation_codes or [])
    )

    validation_by_status = {
        status: sum(1 for candidate in all_candidates if candidate.validation_status == status)
        for status in ValidationStatus
    }
    by_rule_code: dict[str, int] = {}
    for candidate in all_candidates:
        for code in candidate.validation_codes or []:
            by_rule_code[code] = by_rule_code.get(code, 0) + 1

    review_by_status = {
        status: sum(1 for candidate in all_candidates if candidate.review_status == status)
        for status in CandidateReviewStatus
    }
    publish_by_status = {
        status: sum(1 for candidate in all_candidates if candidate.publish_status == status)
        for status in PublishStatus
    }

    current_version = _current_version(db, project_id)
    current_version_id = current_version.id if current_version else None
    published_entities = 0
    published_relations = 0
    if current_version is not None:
        published_entities = len(
            db.scalars(
                select(PublishedEntity).where(
                    PublishedEntity.published_graph_version_id == current_version.id
                )
            ).all()
        )
        published_relations = len(
            db.scalars(
                select(PublishedRelation).where(
                    PublishedRelation.published_graph_version_id == current_version.id
                )
            ).all()
        )

    publish_jobs = db.scalars(select(PublishJob).where(PublishJob.project_id == project_id)).all()
    publish_success = sum(
        1 for job in publish_jobs if job.status in {PublishJobStatus.SUCCESS, PublishJobStatus.PARTIAL_FAILED}
    )
    publish_failed = sum(1 for job in publish_jobs if job.status == PublishJobStatus.FAILED)
    reviewed = (
        review_by_status[CandidateReviewStatus.APPROVED]
        + review_by_status[CandidateReviewStatus.REJECTED]
        + review_by_status[CandidateReviewStatus.MODIFIED]
    )
    validated = (
        validation_by_status[ValidationStatus.PASSED]
        + validation_by_status[ValidationStatus.WARNING]
        + validation_by_status[ValidationStatus.FAILED]
    )

    return QualitySummary(
        project_id=project_id,
        ontology_version_id=ontology_version_id,
        generated_at=datetime.now(timezone.utc),
        candidate_counts=QualityCandidateCounts(
            total=count_metric(total, target=QualityDrilldownTarget.REVIEW_INBOX, query={}),
            entity=count_metric(
                len(entities),
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"candidate_kind": "ENTITY"},
            ),
            relation=count_metric(
                len(relations),
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"candidate_kind": "RELATION"},
            ),
            property_value=count_metric(0, target=QualityDrilldownTarget.REVIEW_INBOX, query={"candidate_kind": "PROPERTY_VALUE"}),
            missing_evidence=count_metric(
                missing_evidence,
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"evidence_state": "missing"},
            ),
        ),
        validation_counts=QualityValidationCounts(
            not_validated=count_metric(
                validation_by_status[ValidationStatus.NOT_VALIDATED],
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"validation_status": "NOT_VALIDATED"},
            ),
            passed=count_metric(
                validation_by_status[ValidationStatus.PASSED],
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"validation_status": "PASSED"},
            ),
            warning=count_metric(
                validation_by_status[ValidationStatus.WARNING],
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"validation_status": "WARNING"},
            ),
            failed=count_metric(
                validation_by_status[ValidationStatus.FAILED],
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"validation_status": "FAILED"},
            ),
            by_rule_code={
                code: count_metric(
                    value,
                    target=QualityDrilldownTarget.REVIEW_INBOX,
                    query={"validation_code": code},
                )
                for code, value in sorted(by_rule_code.items())
            },
        ),
        review_counts=QualityReviewCounts(
            pending=count_metric(
                review_by_status[CandidateReviewStatus.PENDING],
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"review_status": "PENDING"},
            ),
            approved=count_metric(
                review_by_status[CandidateReviewStatus.APPROVED],
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"review_status": "APPROVED"},
            ),
            rejected=count_metric(
                review_by_status[CandidateReviewStatus.REJECTED],
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"review_status": "REJECTED"},
            ),
            modified=count_metric(
                review_by_status[CandidateReviewStatus.MODIFIED],
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"review_status": "MODIFIED"},
            ),
            needs_discussion=count_metric(
                review_by_status[CandidateReviewStatus.NEEDS_DISCUSSION],
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"review_status": "NEEDS_DISCUSSION"},
            ),
        ),
        publish_counts=QualityPublishCounts(
            not_published=count_metric(
                publish_by_status[PublishStatus.NOT_PUBLISHED],
                target=QualityDrilldownTarget.PUBLISH_JOBS,
                query={"publish_status": "NOT_PUBLISHED"},
            ),
            published=count_metric(
                publish_by_status[PublishStatus.PUBLISHED],
                target=QualityDrilldownTarget.PUBLISHED_GRAPH,
                query={"publish_status": "PUBLISHED"},
            ),
            rolled_back=count_metric(
                publish_by_status[PublishStatus.ROLLED_BACK],
                target=QualityDrilldownTarget.PUBLISHED_GRAPH,
                query={"publish_status": "ROLLED_BACK"},
            ),
            published_entities=count_metric(
                published_entities,
                target=QualityDrilldownTarget.PUBLISHED_GRAPH,
                query={"kind": "entity"},
            ),
            published_relations=count_metric(
                published_relations,
                target=QualityDrilldownTarget.PUBLISHED_GRAPH,
                query={"kind": "relation"},
            ),
            publish_success=count_metric(
                publish_success,
                target=QualityDrilldownTarget.PUBLISH_JOBS,
                query={"status": "SUCCESS"},
            ),
            publish_failed=count_metric(
                publish_failed,
                target=QualityDrilldownTarget.PUBLISH_JOBS,
                query={"status": "FAILED"},
            ),
            current_version_id=current_version_id,
            current_version=current_version.version if current_version else None,
        ),
        rates=QualityRates(
            approval_rate=rate_metric(
                review_by_status[CandidateReviewStatus.APPROVED],
                reviewed,
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"review_status": "APPROVED"},
            ),
            rejection_rate=rate_metric(
                review_by_status[CandidateReviewStatus.REJECTED],
                reviewed,
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"review_status": "REJECTED"},
            ),
            modification_rate=rate_metric(
                review_by_status[CandidateReviewStatus.MODIFIED],
                reviewed,
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"review_status": "MODIFIED"},
            ),
            validation_failure_rate=rate_metric(
                validation_by_status[ValidationStatus.FAILED],
                validated,
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"validation_status": "FAILED"},
            ),
            evidence_missing_rate=rate_metric(
                missing_evidence,
                total,
                target=QualityDrilldownTarget.REVIEW_INBOX,
                query={"evidence_state": "missing"},
            ),
            published_ratio=rate_metric(
                publish_by_status[PublishStatus.PUBLISHED],
                total,
                target=QualityDrilldownTarget.PUBLISHED_GRAPH,
                query={"publish_status": "PUBLISHED"},
            ),
        ),
    )
