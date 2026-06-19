from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.orm import Session

from app.core.enums import ExternalApiAuthMode, GoldenSetItemKind, SearchResultKind
from app.core.errors import ApiErrorResponse, ApiException
from app.db.session import get_db
from app.modules.mvp4 import service
from app.modules.mvp4.schemas import (
    EvaluationDataset,
    EvaluationDatasetCreateRequest,
    EvaluationDatasetVersion,
    EvaluationDatasetVersionCreateRequest,
    EvaluationRun,
    EvaluationRunCreateRequest,
    ExternalEvidenceEnvelope,
    ExternalPublishedEntityEnvelope,
    ExternalPublishedGraphEnvelope,
    ExternalPublishedRelationEnvelope,
    ExternalRagAnswerEnvelope,
    ExternalSearchEnvelope,
    ExternalSourceEnvelope,
    GoldenSetItem,
    GoldenSetItemCreateRequest,
    GraphExploreResponse,
    PromptExperiment,
    PromptExperimentCreateRequest,
    PromptPerformanceSummary,
    PublishedLineagePanel,
    QualityMetric,
    QualityMetricsResponse,
    RagAnswerRequest,
    RagAnswerResponse,
    SearchResponse,
    SimilarEvidenceRequest,
    SimilarEvidenceResponse,
    VectorAdapterState,
)

router = APIRouter(tags=["MVP4"])


def _require_dev_auth(x_dev_auth: Annotated[str | None, Header()] = None) -> None:
    if x_dev_auth != "mvp4-dev":
        raise ApiException(
            status_code=401,
            code="DEV_AUTH_REQUIRED",
            message="MVP4 external API requires X-Dev-Auth: mvp4-dev.",
            details={"auth_mode": ExternalApiAuthMode.DEV_AUTH.value},
        )


@router.get(
    "/projects/{project_id}/quality/metrics",
    response_model=QualityMetricsResponse,
    summary="List advanced quality metrics",
    responses={404: {"model": ApiErrorResponse}},
)
def get_quality_metrics(project_id: str, db: Session = Depends(get_db)) -> QualityMetricsResponse:
    return service.quality_metrics(db, project_id)


@router.get(
    "/projects/{project_id}/quality/metrics/{metric_id}",
    response_model=QualityMetric,
    summary="Get advanced quality metric detail",
    responses={404: {"model": ApiErrorResponse}},
)
def get_quality_metric_detail(
    project_id: str,
    metric_id: str,
    db: Session = Depends(get_db),
) -> QualityMetric:
    return service.quality_metric_detail(db, project_id, metric_id)


@router.get(
    "/projects/{project_id}/evaluation-datasets",
    response_model=list[EvaluationDataset],
    summary="List evaluation datasets",
    responses={404: {"model": ApiErrorResponse}},
)
def list_evaluation_datasets(
    project_id: str,
    db: Session = Depends(get_db),
) -> list[EvaluationDataset]:
    service.project_or_404(db, project_id)
    return service.evaluation_datasets(project_id)


@router.post(
    "/projects/{project_id}/evaluation-datasets",
    response_model=EvaluationDataset,
    status_code=status.HTTP_201_CREATED,
    summary="Create evaluation dataset draft",
    responses={404: {"model": ApiErrorResponse}},
)
def create_evaluation_dataset(
    project_id: str,
    payload: EvaluationDatasetCreateRequest,
    db: Session = Depends(get_db),
) -> EvaluationDataset:
    service.project_or_404(db, project_id)
    now = service.utc_now()
    return EvaluationDataset(
        id=f"{project_id}-eval-dataset-draft-created",
        project_id=project_id,
        name=payload.name,
        description=payload.description,
        status="DRAFT",
        owner_id="dev-user",
        created_at=now,
        updated_at=now,
        notes=payload.notes,
    )


@router.get(
    "/evaluation-datasets/{dataset_id}",
    response_model=EvaluationDataset,
    summary="Get evaluation dataset",
    responses={404: {"model": ApiErrorResponse}},
)
def get_evaluation_dataset(dataset_id: str, db: Session = Depends(get_db)) -> EvaluationDataset:
    project_id = dataset_id.split("-eval-dataset-", 1)[0]
    service.project_or_404(db, project_id)
    return service.dataset_or_404(project_id, dataset_id)


@router.get(
    "/evaluation-datasets/{dataset_id}/versions",
    response_model=list[EvaluationDatasetVersion],
    summary="List evaluation dataset versions",
    responses={404: {"model": ApiErrorResponse}},
)
def list_evaluation_dataset_versions(
    dataset_id: str,
    db: Session = Depends(get_db),
) -> list[EvaluationDatasetVersion]:
    return service.dataset_versions(db, dataset_id)


@router.post(
    "/evaluation-datasets/{dataset_id}/versions",
    response_model=EvaluationDatasetVersion,
    status_code=status.HTTP_201_CREATED,
    summary="Create evaluation dataset version draft",
    responses={404: {"model": ApiErrorResponse}},
)
def create_evaluation_dataset_version(
    dataset_id: str,
    payload: EvaluationDatasetVersionCreateRequest,
    db: Session = Depends(get_db),
) -> EvaluationDatasetVersion:
    version = service.dataset_versions(db, dataset_id)[0]
    return version.model_copy(
        update={
            "id": f"{version.project_id}-eval-version-draft-created-v1",
            "status": "DRAFT",
            "golden_item_count": 0,
            "notes": payload.notes,
        }
    )


@router.get(
    "/evaluation-dataset-versions/{dataset_version_id}",
    response_model=EvaluationDatasetVersion,
    summary="Get evaluation dataset version",
    responses={404: {"model": ApiErrorResponse}},
)
def get_evaluation_dataset_version(
    dataset_version_id: str,
    db: Session = Depends(get_db),
) -> EvaluationDatasetVersion:
    return service.dataset_version_or_404(db, dataset_version_id)


@router.get(
    "/evaluation-dataset-versions/{dataset_version_id}/golden-items",
    response_model=list[GoldenSetItem],
    summary="List golden set items",
    responses={404: {"model": ApiErrorResponse}},
)
def list_golden_items(
    dataset_version_id: str,
    db: Session = Depends(get_db),
    kind: GoldenSetItemKind | None = Query(default=None),
) -> list[GoldenSetItem]:
    items = service.golden_items(db, dataset_version_id)
    if kind is not None:
        return [item for item in items if item.kind == kind]
    return items


@router.post(
    "/evaluation-dataset-versions/{dataset_version_id}/golden-items",
    response_model=GoldenSetItem,
    status_code=status.HTTP_201_CREATED,
    summary="Create golden set item draft",
    responses={404: {"model": ApiErrorResponse}},
)
def create_golden_item(
    dataset_version_id: str,
    payload: GoldenSetItemCreateRequest,
    db: Session = Depends(get_db),
) -> GoldenSetItem:
    version = service.dataset_version_or_404(db, dataset_version_id)
    return GoldenSetItem(
        id=f"{dataset_version_id}-golden-created",
        dataset_version_id=dataset_version_id,
        project_id=version.project_id,
        kind=payload.kind,
        expected_payload=payload.expected_payload,
        created_at=service.utc_now(),
        notes=payload.notes,
    )


@router.get(
    "/projects/{project_id}/evaluation-runs",
    response_model=list[EvaluationRun],
    summary="List evaluation runs",
    responses={404: {"model": ApiErrorResponse}},
)
def list_evaluation_runs(project_id: str, db: Session = Depends(get_db)) -> list[EvaluationRun]:
    service.project_or_404(db, project_id)
    return service.evaluation_runs(project_id)


@router.post(
    "/projects/{project_id}/evaluation-runs",
    response_model=EvaluationRun,
    status_code=status.HTTP_201_CREATED,
    summary="Create evaluation run draft",
    responses={404: {"model": ApiErrorResponse}},
)
def create_evaluation_run(
    project_id: str,
    payload: EvaluationRunCreateRequest,
    db: Session = Depends(get_db),
) -> EvaluationRun:
    service.project_or_404(db, project_id)
    run = service.evaluation_runs(project_id)[0]
    return run.model_copy(
        update={
            "id": f"{project_id}-eval-run-draft-created",
            "dataset_version_id": payload.dataset_version_id or run.dataset_version_id,
            "experiment_id": payload.experiment_id,
            "status": "PENDING",
            "started_at": None,
            "ended_at": None,
        }
    )


@router.get(
    "/evaluation-runs/{evaluation_run_id}",
    response_model=EvaluationRun,
    summary="Get evaluation run",
    responses={404: {"model": ApiErrorResponse}},
)
def get_evaluation_run(evaluation_run_id: str, db: Session = Depends(get_db)) -> EvaluationRun:
    project_id = evaluation_run_id.split("-eval-run-", 1)[0]
    service.project_or_404(db, project_id)
    for run in service.evaluation_runs(project_id):
        if run.id == evaluation_run_id:
            return run
    raise ApiException(
        status_code=404,
        code="EVALUATION_RUN_NOT_FOUND",
        message="Evaluation run was not found.",
        details={"evaluation_run_id": evaluation_run_id},
    )


@router.get(
    "/projects/{project_id}/prompt-performance/summary",
    response_model=PromptPerformanceSummary,
    summary="Get prompt/model performance summary",
    responses={404: {"model": ApiErrorResponse}},
)
def get_prompt_performance_summary(
    project_id: str,
    db: Session = Depends(get_db),
) -> PromptPerformanceSummary:
    service.project_or_404(db, project_id)
    return service.prompt_performance_summary(project_id)


@router.get(
    "/projects/{project_id}/prompt-experiments",
    response_model=list[PromptExperiment],
    summary="List prompt experiments",
    responses={404: {"model": ApiErrorResponse}},
)
def list_prompt_experiments(
    project_id: str,
    db: Session = Depends(get_db),
) -> list[PromptExperiment]:
    service.project_or_404(db, project_id)
    return service.prompt_experiments(project_id)


@router.post(
    "/projects/{project_id}/prompt-experiments",
    response_model=PromptExperiment,
    status_code=status.HTTP_201_CREATED,
    summary="Create prompt experiment draft",
    responses={404: {"model": ApiErrorResponse}},
)
def create_prompt_experiment(
    project_id: str,
    payload: PromptExperimentCreateRequest,
    db: Session = Depends(get_db),
) -> PromptExperiment:
    service.project_or_404(db, project_id)
    experiment = service.prompt_experiments(project_id)[0]
    return experiment.model_copy(
        update={
            "id": f"{project_id}-experiment-created",
            "name": payload.name,
            "hypothesis": payload.hypothesis,
            "dataset_id": payload.dataset_id or experiment.dataset_id,
            "dataset_version_id": payload.dataset_version_id or experiment.dataset_version_id,
            "notes": payload.notes,
        }
    )


@router.get(
    "/prompt-experiments/{experiment_id}",
    response_model=PromptExperiment,
    summary="Get prompt experiment",
    responses={404: {"model": ApiErrorResponse}},
)
def get_prompt_experiment(experiment_id: str, db: Session = Depends(get_db)) -> PromptExperiment:
    project_id = experiment_id.split("-experiment-", 1)[0]
    service.project_or_404(db, project_id)
    for experiment in service.prompt_experiments(project_id):
        if experiment.id == experiment_id:
            return experiment
    raise ApiException(
        status_code=404,
        code="PROMPT_EXPERIMENT_NOT_FOUND",
        message="Prompt experiment was not found.",
        details={"experiment_id": experiment_id},
    )


@router.get(
    "/projects/{project_id}/search",
    response_model=SearchResponse,
    summary="Search grouped MVP4 results",
    responses={404: {"model": ApiErrorResponse}},
)
def search(
    project_id: str,
    db: Session = Depends(get_db),
    q: str = Query(default=""),
    scope: list[SearchResultKind] | None = Query(default=None),
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> SearchResponse:
    del scope
    return service.search(db, project_id, q, limit, offset)


@router.get(
    "/projects/{project_id}/vector/status",
    response_model=VectorAdapterState,
    summary="Get vector adapter status",
    responses={404: {"model": ApiErrorResponse}},
)
def get_vector_status(project_id: str, db: Session = Depends(get_db)) -> VectorAdapterState:
    return service.vector_status(db, project_id)


@router.post(
    "/projects/{project_id}/similar-evidence",
    response_model=SimilarEvidenceResponse,
    summary="Find similar evidence with fallback adapter",
    responses={404: {"model": ApiErrorResponse}},
)
def find_similar_evidence(
    project_id: str,
    payload: SimilarEvidenceRequest,
    db: Session = Depends(get_db),
) -> SimilarEvidenceResponse:
    return service.similar_evidence(db, project_id, query=payload.query, limit=payload.limit)


@router.post(
    "/projects/{project_id}/rag/answers",
    response_model=RagAnswerResponse,
    summary="Answer a grounded RAG question",
    responses={404: {"model": ApiErrorResponse}},
)
def answer_rag_question(
    project_id: str,
    payload: RagAnswerRequest,
    db: Session = Depends(get_db),
) -> RagAnswerResponse:
    return service.rag_answer(db, project_id, payload)


@router.get(
    "/projects/{project_id}/published-graph/explore",
    response_model=GraphExploreResponse,
    summary="Explore current published graph",
    responses={404: {"model": ApiErrorResponse}},
)
def explore_current_published_graph(
    project_id: str,
    db: Session = Depends(get_db),
    root_entity_id: str | None = Query(default=None),
    published_graph_version_id: str | None = Query(default=None),
    max_hops: int = Query(default=2, ge=1),
    node_budget: int = Query(default=150, ge=1),
    edge_budget: int = Query(default=300, ge=1),
) -> GraphExploreResponse:
    return service.graph_explore(
        db,
        project_id=project_id,
        version_id=published_graph_version_id,
        root_entity_id=root_entity_id,
        max_hops=max_hops,
        node_budget=node_budget,
        edge_budget=edge_budget,
    )


@router.get(
    "/published-graph/versions/{version_id}/explore",
    response_model=GraphExploreResponse,
    summary="Explore selected published graph version",
    responses={404: {"model": ApiErrorResponse}},
)
def explore_published_graph_version(
    version_id: str,
    db: Session = Depends(get_db),
    root_entity_id: str | None = Query(default=None),
    max_hops: int = Query(default=2, ge=1),
    node_budget: int = Query(default=150, ge=1),
    edge_budget: int = Query(default=300, ge=1),
) -> GraphExploreResponse:
    version = service.graph_version_or_404(db, version_id)
    return service.graph_explore(
        db,
        project_id=version.project_id,
        version_id=version_id,
        root_entity_id=root_entity_id,
        max_hops=max_hops,
        node_budget=node_budget,
        edge_budget=edge_budget,
    )


@router.get(
    "/published-graph/lineage",
    response_model=PublishedLineagePanel,
    summary="Get published graph lineage panel",
    responses={404: {"model": ApiErrorResponse}},
)
def get_published_lineage(
    db: Session = Depends(get_db),
    fact_type: SearchResultKind = Query(default=SearchResultKind.PUBLISHED_ENTITY),
    fact_id: str = Query(),
):
    return service.lineage_for_fact(db, fact_type=fact_type, fact_id=fact_id)


@router.get(
    "/external/projects/{project_id}/published-graph/current",
    response_model=ExternalPublishedGraphEnvelope,
    summary="External read-only current graph snapshot",
    responses={401: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
    dependencies=[Depends(_require_dev_auth)],
)
def external_current_graph(
    project_id: str,
    db: Session = Depends(get_db),
) -> ExternalPublishedGraphEnvelope:
    version = service.current_graph_version(db, project_id)
    return ExternalPublishedGraphEnvelope(
        auth_mode=ExternalApiAuthMode.DEV_AUTH,
        project_id=project_id,
        published_graph_version_ref=service.version_ref(version),
        data=service.external_graph_snapshot(db, project_id),
    )


@router.get(
    "/external/published-graph/entities/{entity_id}",
    response_model=ExternalPublishedEntityEnvelope,
    summary="External read-only published entity lookup",
    responses={401: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
    dependencies=[Depends(_require_dev_auth)],
)
def external_published_entity(
    entity_id: str,
    db: Session = Depends(get_db),
) -> ExternalPublishedEntityEnvelope:
    entity = service.external_entity(db, entity_id)
    version = service.graph_version_or_404(db, entity.published_graph_version_id)
    return ExternalPublishedEntityEnvelope(
        auth_mode=ExternalApiAuthMode.DEV_AUTH,
        project_id=entity.project_id,
        published_graph_version_ref=service.version_ref(version),
        data=entity,
    )


@router.get(
    "/external/published-graph/relations/{relation_id}",
    response_model=ExternalPublishedRelationEnvelope,
    summary="External read-only published relation lookup",
    responses={401: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
    dependencies=[Depends(_require_dev_auth)],
)
def external_published_relation(
    relation_id: str,
    db: Session = Depends(get_db),
) -> ExternalPublishedRelationEnvelope:
    relation = service.external_relation(db, relation_id)
    version = service.graph_version_or_404(db, relation.published_graph_version_id)
    return ExternalPublishedRelationEnvelope(
        auth_mode=ExternalApiAuthMode.DEV_AUTH,
        project_id=relation.project_id,
        published_graph_version_ref=service.version_ref(version),
        data=relation,
    )


@router.get(
    "/external/sources/{source_id}",
    response_model=ExternalSourceEnvelope,
    summary="External read-only source lookup",
    responses={401: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
    dependencies=[Depends(_require_dev_auth)],
)
def external_source(source_id: str, db: Session = Depends(get_db)) -> ExternalSourceEnvelope:
    source = service.source_read(db, source_id)
    return ExternalSourceEnvelope(
        auth_mode=ExternalApiAuthMode.DEV_AUTH,
        project_id=source.project_id,
        data=source,
    )


@router.get(
    "/external/evidence/{evidence_id}",
    response_model=ExternalEvidenceEnvelope,
    summary="External read-only evidence lookup",
    responses={401: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
    dependencies=[Depends(_require_dev_auth)],
)
def external_evidence(evidence_id: str, db: Session = Depends(get_db)) -> ExternalEvidenceEnvelope:
    evidence = service.evidence_read(db, evidence_id)
    version = service.current_graph_version(db, evidence.project_id)
    return ExternalEvidenceEnvelope(
        auth_mode=ExternalApiAuthMode.DEV_AUTH,
        project_id=evidence.project_id,
        published_graph_version_ref=service.version_ref(version),
        data=evidence,
    )


@router.get(
    "/external/projects/{project_id}/search",
    response_model=ExternalSearchEnvelope,
    summary="External read-only grouped search",
    responses={401: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
    dependencies=[Depends(_require_dev_auth)],
)
def external_search(
    project_id: str,
    db: Session = Depends(get_db),
    q: str = Query(default=""),
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> ExternalSearchEnvelope:
    version = service.current_graph_version(db, project_id)
    return ExternalSearchEnvelope(
        auth_mode=ExternalApiAuthMode.DEV_AUTH,
        project_id=project_id,
        published_graph_version_ref=service.version_ref(version),
        data=service.search(db, project_id, q, limit, offset),
    )


@router.post(
    "/external/projects/{project_id}/rag/answers",
    response_model=ExternalRagAnswerEnvelope,
    summary="External read-only grounded RAG answer",
    responses={401: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
    dependencies=[Depends(_require_dev_auth)],
)
def external_rag_answer(
    project_id: str,
    payload: RagAnswerRequest,
    db: Session = Depends(get_db),
) -> ExternalRagAnswerEnvelope:
    version = service.current_graph_version(db, project_id)
    return ExternalRagAnswerEnvelope(
        auth_mode=ExternalApiAuthMode.DEV_AUTH,
        project_id=project_id,
        published_graph_version_ref=service.version_ref(version),
        data=service.rag_answer(db, project_id, payload),
    )
