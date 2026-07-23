from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import AuditEventType, CandidateKind, PublishJobStatus
from app.core.errors import ApiErrorResponse, ApiException
from app.db.session import get_db
from app.modules.audit.service import record_audit_event
from app.modules.candidate.service import get_candidate_or_404
from app.modules.project.models import Project
from app.modules.publish.models import (
    PublishedEntity as PublishedEntityModel,
    PublishedGraphVersion as PublishedGraphVersionModel,
    PublishedRelation as PublishedRelationModel,
    PublishJob as PublishJobModel,
)
from app.modules.publish.schemas import (
    PublishedEntity,
    PublishedGraphSnapshot,
    PublishedGraphVersion,
    PublishedRelation,
    PublishEligibility,
    PublishJob,
    PublishJobCreateRequest,
)
from app.modules.publish.service import (
    current_graph_version,
    graph_snapshot,
    publish_eligibility_for_candidate,
    publish_eligibility_rows,
    run_publish_job,
    to_graph_version,
    to_publish_job,
    to_published_entity,
    to_published_relation,
)

router = APIRouter(tags=["Publish"])


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


def _publish_job_or_404(db: Session, publish_job_id: str) -> PublishJobModel:
    job = db.get(PublishJobModel, publish_job_id)
    if job is None:
        raise ApiException(
            status_code=404,
            code="PUBLISH_JOB_NOT_FOUND",
            message="Publish job was not found.",
            details={"publish_job_id": publish_job_id},
        )
    return job


def _graph_version_or_404(db: Session, version_id: str) -> PublishedGraphVersionModel:
    version = db.get(PublishedGraphVersionModel, version_id)
    if version is None:
        raise ApiException(
            status_code=404,
            code="PUBLISHED_GRAPH_VERSION_NOT_FOUND",
            message="Published graph version was not found.",
            details={"version_id": version_id},
        )
    return version


@router.get(
    "/projects/{project_id}/publish-candidates",
    response_model=list[PublishEligibility],
    summary="List candidate publish eligibility",
    responses={404: {"model": ApiErrorResponse}},
)
def list_publish_candidates(
    project_id: str,
    db: Session = Depends(get_db),
    candidate_kind: CandidateKind | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[PublishEligibility]:
    _project_or_404(db, project_id)
    rows = publish_eligibility_rows(db, project_id, candidate_kind=candidate_kind)
    return rows[offset : offset + limit]


@router.post(
    "/projects/{project_id}/publish-jobs",
    response_model=PublishJob,
    status_code=status.HTTP_201_CREATED,
    summary="Create publish job",
    responses={404: {"model": ApiErrorResponse}, 422: {"model": ApiErrorResponse}},
)
def create_publish_job(
    project_id: str,
    payload: PublishJobCreateRequest,
    db: Session = Depends(get_db),
) -> PublishJob:
    _project_or_404(db, project_id)
    skip_reasons = []
    eligible_count = 0
    for ref in payload.candidate_refs:
        candidate = get_candidate_or_404(db, ref.candidate_kind, ref.candidate_id)
        if candidate.project_id != project_id:
            raise ApiException(
                status_code=422,
                code="PROJECT_SCOPE_MISMATCH",
                message="Candidate does not belong to the target project.",
                details={"candidate_id": candidate.id},
            )
        eligibility = publish_eligibility_for_candidate(
            db,
            ref.candidate_kind,
            candidate,
            ontology_version_id=payload.ontology_version_id,
        )
        if eligibility.eligible:
            eligible_count += 1
        else:
            skip_reasons.append(eligibility)

    job = PublishJobModel(
        project_id=project_id,
        ontology_version_id=payload.ontology_version_id,
        status=PublishJobStatus.SUCCESS if payload.dry_run else PublishJobStatus.PENDING,
        requested_by="dev-user",
        candidate_refs=[ref.model_dump(mode="json") for ref in payload.candidate_refs],
        eligible_count=eligible_count,
        skipped_count=len(skip_reasons),
        skip_reasons=[reason.model_dump(mode="json") for reason in skip_reasons],
        notify_webhook_url=payload.notify_webhook_url,
    )
    db.add(job)
    db.flush()
    record_audit_event(
        db,
        project_id=project_id,
        event_type=AuditEventType.PUBLISH_JOB_CREATED,
        publish_job_id=job.id,
        metadata={"dry_run": payload.dry_run, "eligible_count": eligible_count},
    )
    db.commit()
    db.refresh(job)
    return to_publish_job(job)


@router.get(
    "/projects/{project_id}/publish-jobs",
    response_model=list[PublishJob],
    summary="List publish jobs",
    responses={404: {"model": ApiErrorResponse}},
)
def list_publish_jobs(
    project_id: str,
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[PublishJob]:
    _project_or_404(db, project_id)
    jobs = db.scalars(
        select(PublishJobModel)
        .where(PublishJobModel.project_id == project_id)
        .order_by(PublishJobModel.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return [to_publish_job(job) for job in jobs]


@router.get(
    "/publish-jobs/{publish_job_id}",
    response_model=PublishJob,
    summary="Get publish job",
    responses={404: {"model": ApiErrorResponse}},
)
def get_publish_job(publish_job_id: str, db: Session = Depends(get_db)) -> PublishJob:
    return to_publish_job(_publish_job_or_404(db, publish_job_id))


@router.post(
    "/publish-jobs/{publish_job_id}/run",
    response_model=PublishJob,
    summary="Run pending publish job",
    responses={404: {"model": ApiErrorResponse}, 409: {"model": ApiErrorResponse}},
)
def run_publish_job_endpoint(publish_job_id: str, db: Session = Depends(get_db)) -> PublishJob:
    job = _publish_job_or_404(db, publish_job_id)
    job = run_publish_job(db, job)
    db.commit()
    db.refresh(job)
    return to_publish_job(job)


@router.get(
    "/projects/{project_id}/published-graph/versions",
    response_model=list[PublishedGraphVersion],
    summary="List published graph versions",
    responses={404: {"model": ApiErrorResponse}},
)
def list_published_graph_versions(
    project_id: str,
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[PublishedGraphVersion]:
    _project_or_404(db, project_id)
    versions = db.scalars(
        select(PublishedGraphVersionModel)
        .where(PublishedGraphVersionModel.project_id == project_id)
        .order_by(PublishedGraphVersionModel.version.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return [to_graph_version(version) for version in versions]


@router.get(
    "/projects/{project_id}/published-graph/current",
    response_model=PublishedGraphSnapshot,
    summary="Get current published graph snapshot",
    responses={404: {"model": ApiErrorResponse}},
)
def get_current_published_graph(
    project_id: str,
    db: Session = Depends(get_db),
) -> PublishedGraphSnapshot:
    _project_or_404(db, project_id)
    version = current_graph_version(db, project_id)
    if version is None:
        raise ApiException(
            status_code=404,
            code="PUBLISHED_GRAPH_CURRENT_NOT_FOUND",
            message="Project has no current published graph version.",
            details={"project_id": project_id},
        )
    return graph_snapshot(db, version)


@router.get(
    "/published-graph/versions/{version_id}",
    response_model=PublishedGraphVersion,
    summary="Get published graph version",
    responses={404: {"model": ApiErrorResponse}},
)
def get_published_graph_version(
    version_id: str,
    db: Session = Depends(get_db),
) -> PublishedGraphVersion:
    return to_graph_version(_graph_version_or_404(db, version_id))


@router.get(
    "/published-graph/versions/{version_id}/entities",
    response_model=list[PublishedEntity],
    summary="List published entities",
    responses={404: {"model": ApiErrorResponse}},
)
def list_published_entities(
    version_id: str,
    db: Session = Depends(get_db),
    class_id: str | None = Query(default=None),
    search: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[PublishedEntity]:
    _graph_version_or_404(db, version_id)
    statement = select(PublishedEntityModel).where(
        PublishedEntityModel.published_graph_version_id == version_id
    )
    if class_id is not None:
        statement = statement.where(PublishedEntityModel.class_id == class_id)
    if search is not None:
        statement = statement.where(PublishedEntityModel.canonical_name.contains(search))
    entities = db.scalars(
        statement.order_by(PublishedEntityModel.created_at.asc()).limit(limit).offset(offset)
    ).all()
    return [to_published_entity(entity) for entity in entities]


@router.get(
    "/published-graph/versions/{version_id}/relations",
    response_model=list[PublishedRelation],
    summary="List published relations",
    responses={404: {"model": ApiErrorResponse}},
)
def list_published_relations(
    version_id: str,
    db: Session = Depends(get_db),
    relation_id: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[PublishedRelation]:
    _graph_version_or_404(db, version_id)
    statement = select(PublishedRelationModel).where(
        PublishedRelationModel.published_graph_version_id == version_id
    )
    if relation_id is not None:
        statement = statement.where(PublishedRelationModel.relation_id == relation_id)
    relations = db.scalars(
        statement.order_by(PublishedRelationModel.created_at.asc()).limit(limit).offset(offset)
    ).all()
    return [to_published_relation(relation) for relation in relations]
