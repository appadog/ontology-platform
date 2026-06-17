from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.enums import (
    CandidateReviewStatus,
    CandidateValidationCode,
    ExtractionJobStatus,
    ModelRunStatus,
    ProjectStatus,
    PublishStatus,
    ValidationStatus,
)
from app.core.errors import ApiErrorResponse, ApiException
from app.db.session import get_db
from app.integrations.llm.base import LLMRequest
from app.integrations.llm.mock_provider import MockFixtureNotFoundError, MockProvider
from app.modules.candidate.models import (
    CandidateEntity as CandidateEntityModel,
    CandidateEvidence as CandidateEvidenceModel,
    CandidateRelation as CandidateRelationModel,
)
from app.modules.extraction.models import ExtractionJob as ExtractionJobModel
from app.modules.extraction.models import ModelRun as ModelRunModel
from app.modules.extraction.schemas import (
    ExtractionJob,
    ExtractionJobCreateRequest,
    ExtractionJobDetail,
    ModelRun,
)
from app.modules.ontology.models import (
    OntologyClass as OntologyClassModel,
    OntologyRelation as OntologyRelationModel,
    OntologyVersion as OntologyVersionModel,
)
from app.modules.project.models import Project
from app.modules.prompt.models import PromptTemplate as PromptTemplateModel
from app.modules.prompt.models import PromptVersion as PromptVersionModel
from app.modules.source.models import SourceData as SourceDataModel
from app.modules.source.models import SourceSegment as SourceSegmentModel

router = APIRouter(tags=["Extraction"])


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _not_found(code: str, message: str, **details: str) -> ApiException:
    return ApiException(status_code=404, code=code, message=message, details=details)


def _project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None or project.status == ProjectStatus.DELETED:
        raise _not_found("PROJECT_NOT_FOUND", "Project was not found.", project_id=project_id)
    return project


def _source_or_404(db: Session, source_id: str) -> SourceDataModel:
    source = db.get(SourceDataModel, source_id)
    if source is None or source.is_deleted:
        raise _not_found("SOURCE_NOT_FOUND", "Source data was not found.", source_id=source_id)
    return source


def _ontology_version_or_404(db: Session, version_id: str) -> OntologyVersionModel:
    version = db.get(OntologyVersionModel, version_id)
    if version is None:
        raise _not_found(
            "ONTOLOGY_VERSION_NOT_FOUND",
            "Ontology version was not found.",
            version_id=version_id,
        )
    return version


def _prompt_version_or_404(db: Session, prompt_version_id: str) -> PromptVersionModel:
    prompt_version = db.get(PromptVersionModel, prompt_version_id)
    if prompt_version is None:
        raise _not_found(
            "PROMPT_VERSION_NOT_FOUND",
            "Prompt version was not found.",
            prompt_version_id=prompt_version_id,
        )
    return prompt_version


def _job_or_404(db: Session, job_id: str) -> ExtractionJobModel:
    job = db.get(ExtractionJobModel, job_id)
    if job is None:
        raise _not_found("EXTRACTION_JOB_NOT_FOUND", "Extraction job was not found.", job_id=job_id)
    return job


def _ensure_same_project(project_id: str, field_name: str, actual_project_id: str) -> None:
    if actual_project_id != project_id:
        raise ApiException(
            status_code=422,
            code="PROJECT_SCOPE_MISMATCH",
            message="Referenced resource does not belong to the target project.",
            details={"project_id": project_id, field_name: actual_project_id},
        )


def _validate_job_references(
    db: Session, project_id: str, payload: ExtractionJobCreateRequest
) -> None:
    _project_or_404(db, project_id)
    source = _source_or_404(db, payload.source_id)
    _ensure_same_project(project_id, "source_project_id", source.project_id)
    ontology_version = _ontology_version_or_404(db, payload.ontology_version_id)
    _ensure_same_project(project_id, "ontology_project_id", ontology_version.project_id)
    prompt_version = _prompt_version_or_404(db, payload.prompt_version_id)
    prompt = db.get(PromptTemplateModel, prompt_version.prompt_template_id)
    if prompt is None:
        raise _not_found(
            "PROMPT_TEMPLATE_NOT_FOUND",
            "Prompt template was not found.",
            prompt_id=prompt_version.prompt_template_id,
        )
    _ensure_same_project(project_id, "prompt_project_id", prompt.project_id)
    if payload.provider != "mock":
        raise ApiException(
            status_code=422,
            code="LLM_PROVIDER_NOT_AVAILABLE",
            message="Only the deterministic mock provider is available in this thin slice.",
            details={"provider": payload.provider},
        )


def _job_counts(db: Session, job_id: str) -> tuple[int, int]:
    entity_count = db.scalar(
        select(func.count(CandidateEntityModel.id)).where(
            CandidateEntityModel.extraction_job_id == job_id
        )
    )
    relation_count = db.scalar(
        select(func.count(CandidateRelationModel.id)).where(
            CandidateRelationModel.extraction_job_id == job_id
        )
    )
    return int(entity_count or 0), int(relation_count or 0)


def _to_model_run(model_run: ModelRunModel) -> ModelRun:
    return ModelRun(
        id=model_run.id,
        extraction_job_id=model_run.extraction_job_id,
        prompt_version_id=model_run.prompt_version_id,
        ontology_version_id=model_run.ontology_version_id,
        provider=model_run.provider,
        model_name=model_run.model_name,
        status=model_run.status,
        input_token_count=model_run.input_token_count,
        output_token_count=model_run.output_token_count,
        cost_estimate=model_run.cost_estimate,
        raw_request=model_run.raw_request,
        raw_response=model_run.raw_response,
        masking_version=model_run.masking_version,
        redaction_summary=model_run.redaction_summary,
        started_at=model_run.started_at,
        ended_at=model_run.ended_at,
    )


def _to_job(db: Session, job: ExtractionJobModel) -> ExtractionJob:
    entity_count, relation_count = _job_counts(db, job.id)
    return ExtractionJob(
        id=job.id,
        project_id=job.project_id,
        source_id=job.source_id,
        ontology_version_id=job.ontology_version_id,
        prompt_version_id=job.prompt_version_id,
        provider=job.provider,
        model_name=job.model_name,
        fixture_id=job.fixture_id,
        status=job.status,
        progress=job.progress,
        retry_of_job_id=job.retry_of_job_id,
        error_code=job.error_code,
        error_message=job.error_message,
        created_at=job.created_at,
        started_at=job.started_at,
        ended_at=job.ended_at,
        candidate_entity_count=entity_count,
        candidate_relation_count=relation_count,
    )


def _to_job_detail(db: Session, job: ExtractionJobModel) -> ExtractionJobDetail:
    job_schema = _to_job(db, job)
    model_runs = db.scalars(
        select(ModelRunModel)
        .where(ModelRunModel.extraction_job_id == job.id)
        .order_by(ModelRunModel.started_at.asc(), ModelRunModel.id.asc())
    ).all()
    return ExtractionJobDetail(
        **job_schema.model_dump(),
        model_runs=[_to_model_run(model_run) for model_run in model_runs],
    )


def _segments_for_source(db: Session, source_id: str) -> list[SourceSegmentModel]:
    return db.scalars(
        select(SourceSegmentModel)
        .where(SourceSegmentModel.source_id == source_id)
        .order_by(SourceSegmentModel.sequence.asc())
    ).all()


def _text_segments(segments: list[SourceSegmentModel]) -> list[SourceSegmentModel]:
    return [segment for segment in segments if segment.text]


def _classes_for_version(db: Session, version_id: str) -> list[OntologyClassModel]:
    return db.scalars(
        select(OntologyClassModel)
        .where(OntologyClassModel.version_id == version_id)
        .order_by(OntologyClassModel.created_at.asc())
    ).all()


def _relations_for_version(db: Session, version_id: str) -> list[OntologyRelationModel]:
    return db.scalars(
        select(OntologyRelationModel)
        .where(OntologyRelationModel.version_id == version_id)
        .order_by(OntologyRelationModel.created_at.asc())
    ).all()


def _raw_request(
    job: ExtractionJobModel, segment_count: int, classes: list[str], relations: list[str]
) -> dict:
    return {
        "provider": job.provider,
        "model_name": job.model_name,
        "fixture_id": job.fixture_id,
        "source_id": job.source_id,
        "segment_count": segment_count,
        "ontology_version_id": job.ontology_version_id,
        "class_names": classes,
        "relation_names": relations,
    }


def _redaction_summary() -> dict:
    return {"redacted_keys": [], "truncated_fields": [], "policy": "no_source_text_or_secrets"}


def _create_model_run(
    db: Session,
    job: ExtractionJobModel,
    *,
    status_value: ModelRunStatus,
    raw_request: dict,
    raw_response: dict,
    started_at: datetime,
    ended_at: datetime,
) -> ModelRunModel:
    model_run = ModelRunModel(
        extraction_job_id=job.id,
        prompt_version_id=job.prompt_version_id,
        ontology_version_id=job.ontology_version_id,
        provider=job.provider,
        model_name=job.model_name,
        status=status_value,
        input_token_count=0,
        output_token_count=0,
        cost_estimate=0.0,
        raw_request=raw_request,
        raw_response=raw_response,
        masking_version="v1",
        redaction_summary=_redaction_summary(),
        started_at=started_at,
        ended_at=ended_at,
    )
    db.add(model_run)
    db.flush()
    return model_run


def _create_evidence(
    db: Session,
    source: SourceDataModel,
    segment: SourceSegmentModel,
) -> CandidateEvidenceModel:
    evidence_text = segment.text or ""
    evidence = CandidateEvidenceModel(
        source_id=source.id,
        source_segment_id=segment.id,
        source_type=source.source_type,
        file_name=source.file_name,
        sheet_name=source.sheet_name,
        row_index=segment.row_index,
        column_name=segment.column_name,
        page_number=segment.page_number,
        section_title=segment.section_title,
        paragraph_id=segment.paragraph_index,
        chunk_id=segment.chunk_index,
        evidence_text=evidence_text[:500],
        start_offset=0,
        end_offset=min(len(evidence_text), 500),
        metadata_={"segment_type": segment.segment_type.value},
    )
    db.add(evidence)
    db.flush()
    return evidence


def _persist_candidates(
    db: Session,
    *,
    job: ExtractionJobModel,
    source: SourceDataModel,
    model_run: ModelRunModel,
    segments: list[SourceSegmentModel],
    classes: list[OntologyClassModel],
    relations: list[OntologyRelationModel],
    provider_entities: list[dict],
    provider_relations: list[dict],
) -> None:
    text_segments = _text_segments(segments) or segments
    classes_by_name = {ontology_class.name: ontology_class for ontology_class in classes}
    relations_by_name = {relation.name: relation for relation in relations}
    created_entities: list[CandidateEntityModel] = []

    for index, payload in enumerate(provider_entities):
        class_model = classes_by_name.get(payload.get("class_name"))
        validation_status = ValidationStatus.PASSED
        validation_codes: list[str] = []
        evidence_ids: list[str] = []
        source_segment_id = None

        if payload.get("force_missing_evidence") or not text_segments:
            validation_status = ValidationStatus.WARNING
            validation_codes.append(CandidateValidationCode.MISSING_EVIDENCE.value)
        else:
            segment = text_segments[min(index, len(text_segments) - 1)]
            evidence = _create_evidence(db, source, segment)
            evidence_ids.append(evidence.id)
            source_segment_id = segment.id

        if class_model is None:
            validation_status = ValidationStatus.FAILED
            validation_codes.append(CandidateValidationCode.ONTOLOGY_ELEMENT_NOT_FOUND.value)

        entity = CandidateEntityModel(
            extraction_job_id=job.id,
            project_id=job.project_id,
            source_id=job.source_id,
            source_segment_id=source_segment_id,
            ontology_version_id=job.ontology_version_id,
            class_id=class_model.id if class_model else None,
            model_run_id=model_run.id,
            prompt_version_id=job.prompt_version_id,
            entity_name=payload["name"],
            normalized_name=payload["name"].casefold(),
            property_values={},
            confidence=payload.get("confidence", 0.0),
            evidence_ids=evidence_ids,
            raw_payload={"fixture_id": job.fixture_id, "provider_index": index},
            validation_status=validation_status,
            validation_codes=validation_codes,
            review_status=CandidateReviewStatus.PENDING,
            publish_status=PublishStatus.NOT_PUBLISHED,
        )
        db.add(entity)
        db.flush()
        created_entities.append(entity)

    for index, payload in enumerate(provider_relations):
        relation_model = relations_by_name.get(payload.get("relation_name"))
        source_entity_index = payload.get("source_entity_index", 0)
        target_entity_index = payload.get("target_entity_index", 1)
        source_entity = (
            created_entities[source_entity_index]
            if source_entity_index < len(created_entities)
            else None
        )
        target_entity = (
            created_entities[target_entity_index]
            if target_entity_index < len(created_entities)
            else None
        )
        validation_status = ValidationStatus.PASSED
        validation_codes: list[str] = []
        if relation_model is None:
            validation_status = ValidationStatus.FAILED
            validation_codes.append(CandidateValidationCode.ONTOLOGY_ELEMENT_NOT_FOUND.value)
        if source_entity is None or target_entity is None:
            validation_status = ValidationStatus.FAILED
            validation_codes.append(CandidateValidationCode.RELATION_ENDPOINT_MISSING.value)

        segment = text_segments[min(index, len(text_segments) - 1)] if text_segments else None
        evidence_ids: list[str] = []
        source_segment_id = None
        if segment is not None:
            evidence = _create_evidence(db, source, segment)
            evidence_ids.append(evidence.id)
            source_segment_id = segment.id
        else:
            validation_status = ValidationStatus.WARNING
            validation_codes.append(CandidateValidationCode.MISSING_EVIDENCE.value)

        candidate_relation = CandidateRelationModel(
            extraction_job_id=job.id,
            project_id=job.project_id,
            source_id=job.source_id,
            source_segment_id=source_segment_id,
            ontology_version_id=job.ontology_version_id,
            relation_id=relation_model.id if relation_model else None,
            model_run_id=model_run.id,
            prompt_version_id=job.prompt_version_id,
            source_candidate_entity_id=source_entity.id if source_entity else None,
            target_candidate_entity_id=target_entity.id if target_entity else None,
            confidence=payload.get("confidence", 0.0),
            evidence_ids=evidence_ids,
            raw_payload={"fixture_id": job.fixture_id, "provider_index": index},
            validation_status=validation_status,
            validation_codes=validation_codes,
            review_status=CandidateReviewStatus.PENDING,
            publish_status=PublishStatus.NOT_PUBLISHED,
        )
        db.add(candidate_relation)


@router.get(
    "/projects/{project_id}/extraction-jobs",
    response_model=list[ExtractionJob],
    summary="List extraction jobs",
    responses={404: {"model": ApiErrorResponse}},
)
def list_extraction_jobs(
    project_id: str,
    db: Session = Depends(get_db),
    status_filter: ExtractionJobStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[ExtractionJob]:
    _project_or_404(db, project_id)
    statement = select(ExtractionJobModel).where(ExtractionJobModel.project_id == project_id)
    if status_filter is not None:
        statement = statement.where(ExtractionJobModel.status == status_filter)
    jobs = db.scalars(
        statement.order_by(ExtractionJobModel.created_at.desc()).limit(limit).offset(offset)
    ).all()
    return [_to_job(db, job) for job in jobs]


@router.post(
    "/projects/{project_id}/extraction-jobs",
    response_model=ExtractionJob,
    status_code=status.HTTP_201_CREATED,
    summary="Create extraction job",
    responses={404: {"model": ApiErrorResponse}, 422: {"model": ApiErrorResponse}},
)
def create_extraction_job(
    project_id: str,
    payload: ExtractionJobCreateRequest,
    db: Session = Depends(get_db),
) -> ExtractionJob:
    _validate_job_references(db, project_id, payload)
    job = ExtractionJobModel(
        project_id=project_id,
        source_id=payload.source_id,
        ontology_version_id=payload.ontology_version_id,
        prompt_version_id=payload.prompt_version_id,
        provider=payload.provider,
        model_name=payload.model_name,
        fixture_id=payload.fixture_id,
        status=ExtractionJobStatus.PENDING,
        progress=0,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _to_job(db, job)


@router.get(
    "/extraction-jobs/{job_id}",
    response_model=ExtractionJobDetail,
    summary="Get extraction job detail",
    responses={404: {"model": ApiErrorResponse}},
)
def get_extraction_job(job_id: str, db: Session = Depends(get_db)) -> ExtractionJobDetail:
    return _to_job_detail(db, _job_or_404(db, job_id))


@router.post(
    "/extraction-jobs/{job_id}/run",
    response_model=ExtractionJobDetail,
    summary="Run extraction job with deterministic mock provider",
    responses={404: {"model": ApiErrorResponse}},
)
def run_extraction_job(job_id: str, db: Session = Depends(get_db)) -> ExtractionJobDetail:
    job = _job_or_404(db, job_id)
    if job.status in {
        ExtractionJobStatus.SUCCESS,
        ExtractionJobStatus.PARTIAL_FAILED,
        ExtractionJobStatus.FAILED,
        ExtractionJobStatus.CANCELLED,
        ExtractionJobStatus.RETRYING,
    }:
        return _to_job_detail(db, job)

    source = _source_or_404(db, job.source_id)
    segments = _segments_for_source(db, job.source_id)
    classes = _classes_for_version(db, job.ontology_version_id)
    relations = _relations_for_version(db, job.ontology_version_id)
    class_names = [ontology_class.name for ontology_class in classes]
    relation_names = [relation.name for relation in relations]
    raw_request = _raw_request(job, len(segments), class_names, relation_names)

    started_at = _utc_now()
    job.status = ExtractionJobStatus.RUNNING
    job.started_at = started_at
    job.progress = 25
    db.add(job)
    db.flush()

    if not segments:
        ended_at = _utc_now()
        _create_model_run(
            db,
            job,
            status_value=ModelRunStatus.FAILED,
            raw_request=raw_request,
            raw_response={"error_code": "SOURCE_SEGMENTS_NOT_FOUND"},
            started_at=started_at,
            ended_at=ended_at,
        )
        job.status = ExtractionJobStatus.FAILED
        job.progress = 100
        job.error_code = "SOURCE_SEGMENTS_NOT_FOUND"
        job.error_message = "Run source parse before extraction."
        job.ended_at = ended_at
        db.add(job)
        db.commit()
        db.refresh(job)
        return _to_job_detail(db, job)

    provider = MockProvider()
    try:
        response = provider.generate(
            LLMRequest(
                fixture_id=job.fixture_id,
                source_id=job.source_id,
                segment_count=len(segments),
                ontology_class_names=class_names,
                ontology_relation_names=relation_names,
            )
        )
    except MockFixtureNotFoundError:
        ended_at = _utc_now()
        _create_model_run(
            db,
            job,
            status_value=ModelRunStatus.FAILED,
            raw_request=raw_request,
            raw_response={"error_code": "MOCK_FIXTURE_NOT_FOUND"},
            started_at=started_at,
            ended_at=ended_at,
        )
        job.status = ExtractionJobStatus.FAILED
        job.progress = 100
        job.error_code = "MOCK_FIXTURE_NOT_FOUND"
        job.error_message = "Mock fixture was not found."
        job.ended_at = ended_at
        db.add(job)
        db.commit()
        db.refresh(job)
        return _to_job_detail(db, job)

    ended_at = _utc_now()
    model_run = _create_model_run(
        db,
        job,
        status_value=ModelRunStatus.SUCCESS,
        raw_request=raw_request,
        raw_response={
            "fixture_id": response.fixture_id,
            "entity_count": len(response.entities),
            "relation_count": len(response.relations),
            "warnings": response.warnings,
        },
        started_at=started_at,
        ended_at=ended_at,
    )
    _persist_candidates(
        db,
        job=job,
        source=source,
        model_run=model_run,
        segments=segments,
        classes=classes,
        relations=relations,
        provider_entities=response.entities,
        provider_relations=response.relations,
    )
    job.status = (
        ExtractionJobStatus.PARTIAL_FAILED
        if response.partial_failed
        else ExtractionJobStatus.SUCCESS
    )
    job.progress = 100
    job.error_code = "PARTIAL_FAILED" if response.partial_failed else None
    job.error_message = "; ".join(response.warnings) if response.warnings else None
    job.ended_at = ended_at
    db.add(job)
    db.commit()
    db.refresh(job)
    return _to_job_detail(db, job)


@router.post(
    "/extraction-jobs/{job_id}/retry",
    response_model=ExtractionJob,
    status_code=status.HTTP_201_CREATED,
    summary="Create retry extraction job",
    responses={404: {"model": ApiErrorResponse}, 409: {"model": ApiErrorResponse}},
)
def retry_extraction_job(job_id: str, db: Session = Depends(get_db)) -> ExtractionJob:
    source_job = _job_or_404(db, job_id)
    if source_job.status not in {ExtractionJobStatus.FAILED, ExtractionJobStatus.PARTIAL_FAILED}:
        raise ApiException(
            status_code=409,
            code="EXTRACTION_JOB_NOT_RETRYABLE",
            message="Only FAILED or PARTIAL_FAILED extraction jobs can be retried.",
            details={"job_id": job_id, "status": source_job.status.value},
        )
    retry_job = ExtractionJobModel(
        project_id=source_job.project_id,
        source_id=source_job.source_id,
        ontology_version_id=source_job.ontology_version_id,
        prompt_version_id=source_job.prompt_version_id,
        provider=source_job.provider,
        model_name=source_job.model_name,
        fixture_id=source_job.fixture_id,
        status=ExtractionJobStatus.PENDING,
        progress=0,
        retry_of_job_id=source_job.id,
    )
    db.add(retry_job)
    source_job.status = ExtractionJobStatus.RETRYING
    db.add(source_job)
    db.commit()
    db.refresh(retry_job)
    return _to_job(db, retry_job)
