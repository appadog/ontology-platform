from typing import Annotated

from fastapi import APIRouter, Depends, Path, status
from sqlalchemy.orm import Session

from app.core.errors import ApiErrorResponse
from app.db.session import get_db
from app.modules.evaluation import service
from app.modules.evaluation.schemas import (
    EvaluationDataset,
    EvaluationDatasetCreateRequest,
    EvaluationErrorCase,
    EvaluationMetric,
    EvaluationRun,
    EvaluationRunCreateRequest,
    EvaluationSample,
    EvaluationSampleCreateRequest,
    GoldEntity,
    GoldEntityCreateRequest,
    GoldRelation,
    GoldRelationCreateRequest,
)

router = APIRouter(tags=["MVP6 Evaluation"])


@router.get(
    "/projects/{project_id}/evaluation-datasets",
    response_model=list[EvaluationDataset],
    summary="List MVP6.1 evaluation datasets",
    responses={404: {"model": ApiErrorResponse}},
)
def list_evaluation_datasets(
    project_id: str,
    db: Session = Depends(get_db),
) -> list[EvaluationDataset]:
    service.project_or_404(db, project_id)
    return service.list_datasets(project_id)


@router.post(
    "/projects/{project_id}/evaluation-datasets",
    response_model=EvaluationDataset,
    status_code=status.HTTP_201_CREATED,
    summary="Create MVP6.1 evaluation dataset",
    responses={404: {"model": ApiErrorResponse}},
)
def create_evaluation_dataset(
    project_id: str,
    payload: EvaluationDatasetCreateRequest,
    db: Session = Depends(get_db),
) -> EvaluationDataset:
    service.project_or_404(db, project_id)
    return service.create_dataset(project_id, payload)


@router.get(
    "/evaluation-datasets/{dataset_id}",
    response_model=EvaluationDataset,
    summary="Get MVP6.1 evaluation dataset",
    responses={404: {"model": ApiErrorResponse}},
)
def get_evaluation_dataset(dataset_id: str) -> EvaluationDataset:
    return service.dataset_or_404(dataset_id)


@router.get(
    "/evaluation-datasets/{dataset_id}/samples",
    response_model=list[EvaluationSample],
    summary="List MVP6.1 evaluation samples",
    responses={404: {"model": ApiErrorResponse}},
)
def list_evaluation_samples(dataset_id: str) -> list[EvaluationSample]:
    return service.list_samples(dataset_id)


@router.post(
    "/evaluation-datasets/{dataset_id}/samples",
    response_model=EvaluationSample,
    status_code=status.HTTP_201_CREATED,
    summary="Create MVP6.1 evaluation sample",
    responses={404: {"model": ApiErrorResponse}},
)
def create_evaluation_sample(
    dataset_id: str,
    payload: EvaluationSampleCreateRequest,
) -> EvaluationSample:
    return service.create_sample(dataset_id, payload)


@router.get(
    "/evaluation-datasets/{dataset_id}/gold-entities",
    response_model=list[GoldEntity],
    summary="List MVP6.1 gold entities",
    responses={404: {"model": ApiErrorResponse}},
)
def list_gold_entities(dataset_id: str) -> list[GoldEntity]:
    return service.list_gold_entities(dataset_id)


@router.post(
    "/evaluation-datasets/{dataset_id}/gold-entities",
    response_model=GoldEntity,
    status_code=status.HTTP_201_CREATED,
    summary="Create MVP6.1 gold entity",
    responses={404: {"model": ApiErrorResponse}},
)
def create_gold_entity(dataset_id: str, payload: GoldEntityCreateRequest) -> GoldEntity:
    return service.create_gold_entity(dataset_id, payload)


@router.get(
    "/evaluation-datasets/{dataset_id}/gold-relations",
    response_model=list[GoldRelation],
    summary="List MVP6.1 gold relations",
    responses={404: {"model": ApiErrorResponse}},
)
def list_gold_relations(dataset_id: str) -> list[GoldRelation]:
    return service.list_gold_relations(dataset_id)


@router.post(
    "/evaluation-datasets/{dataset_id}/gold-relations",
    response_model=GoldRelation,
    status_code=status.HTTP_201_CREATED,
    summary="Create MVP6.1 gold relation",
    responses={404: {"model": ApiErrorResponse}},
)
def create_gold_relation(dataset_id: str, payload: GoldRelationCreateRequest) -> GoldRelation:
    return service.create_gold_relation(dataset_id, payload)


@router.get(
    "/projects/{project_id}/evaluation-runs",
    response_model=list[EvaluationRun],
    summary="List MVP6.1 evaluation runs",
    responses={404: {"model": ApiErrorResponse}},
)
def list_evaluation_runs(project_id: str, db: Session = Depends(get_db)) -> list[EvaluationRun]:
    service.project_or_404(db, project_id)
    return service.list_runs(project_id)


@router.post(
    "/projects/{project_id}/evaluation-runs",
    response_model=EvaluationRun,
    status_code=status.HTTP_201_CREATED,
    summary="Create MVP6.1 deterministic evaluation run",
    responses={404: {"model": ApiErrorResponse}},
)
def create_evaluation_run(
    project_id: str,
    payload: EvaluationRunCreateRequest,
    db: Session = Depends(get_db),
) -> EvaluationRun:
    service.project_or_404(db, project_id)
    return service.create_run(project_id, payload)


@router.get(
    "/evaluation-runs/{run_id}",
    response_model=EvaluationRun,
    summary="Get MVP6.1 evaluation run",
    responses={404: {"model": ApiErrorResponse}},
)
def get_evaluation_run(run_id: str) -> EvaluationRun:
    return service.run_or_404(run_id)


@router.get(
    "/evaluation-runs/{evaluation_run_id}",
    response_model=EvaluationRun,
    summary="Get evaluation run by legacy path parameter name",
    responses={404: {"model": ApiErrorResponse}},
)
def get_evaluation_run_legacy_param(
    evaluation_run_id: Annotated[str, Path(alias="evaluation_run_id")],
) -> EvaluationRun:
    return service.run_or_404(evaluation_run_id)


@router.get(
    "/evaluation-runs/{run_id}/metrics",
    response_model=list[EvaluationMetric],
    summary="List MVP6.1 evaluation run metrics",
    responses={404: {"model": ApiErrorResponse}},
)
def list_evaluation_run_metrics(run_id: str) -> list[EvaluationMetric]:
    return service.metrics_for_run(run_id)


@router.get(
    "/evaluation-runs/{run_id}/errors",
    response_model=list[EvaluationErrorCase],
    summary="List MVP6.1 evaluation run error cases",
    responses={404: {"model": ApiErrorResponse}},
)
def list_evaluation_run_errors(run_id: str) -> list[EvaluationErrorCase]:
    return service.errors_for_run(run_id)


@router.get(
    "/evaluation-error-cases/{error_case_id}",
    response_model=EvaluationErrorCase,
    summary="Get MVP6.1 evaluation error case",
    responses={404: {"model": ApiErrorResponse}},
)
def get_evaluation_error_case(error_case_id: str) -> EvaluationErrorCase:
    return service.error_case_or_404(error_case_id)
