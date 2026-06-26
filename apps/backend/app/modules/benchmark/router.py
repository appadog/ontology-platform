from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.errors import ApiErrorResponse
from app.db.session import get_db
from app.modules.benchmark import service
from app.modules.benchmark.schemas import (
    BenchmarkComparison,
    BenchmarkComparisonCreateRequest,
    BenchmarkComparisonGroupBy,
    BenchmarkComparisonListResponse,
    ConfusionCellErrorCasesResponse,
    ConfusionMatrix,
    ConfusionMatrixAxis,
)

router = APIRouter(tags=["MVP6.3 Benchmark Comparison"])


@router.post(
    "/projects/{project_id}/benchmark-comparisons",
    response_model=BenchmarkComparison,
    status_code=status.HTTP_201_CREATED,
    summary="Build a benchmark comparison view (read-aggregation only)",
    responses={
        400: {"model": ApiErrorResponse},
        403: {"model": ApiErrorResponse},
        404: {"model": ApiErrorResponse},
    },
)
def build_benchmark_comparison(
    project_id: str,
    payload: BenchmarkComparisonCreateRequest,
    db: Session = Depends(get_db),
) -> BenchmarkComparison:
    service.project_or_404(db, project_id)
    return service.build_comparison(project_id, payload)


@router.get(
    "/projects/{project_id}/benchmark-comparisons",
    response_model=BenchmarkComparisonListResponse,
    summary="List benchmark comparisons in a project",
    responses={403: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
)
def list_benchmark_comparisons(
    project_id: str,
    group_by: BenchmarkComparisonGroupBy | None = Query(default=None),
    limit: int = Query(default=50, le=100),
    cursor: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> BenchmarkComparisonListResponse:
    service.project_or_404(db, project_id)
    return service.list_comparisons(project_id, group_by=group_by, limit=limit, cursor=cursor)


@router.get(
    "/benchmark-comparisons/{comparison_id}",
    response_model=BenchmarkComparison,
    summary="Get a benchmark comparison view",
    responses={403: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
)
def get_benchmark_comparison(comparison_id: str) -> BenchmarkComparison:
    return service.comparison_or_404(comparison_id)


@router.get(
    "/benchmark-comparisons/{comparison_id}/confusion-matrix",
    response_model=ConfusionMatrix,
    summary="Get a per-run confusion matrix",
    responses={
        400: {"model": ApiErrorResponse},
        403: {"model": ApiErrorResponse},
        404: {"model": ApiErrorResponse},
    },
)
def get_benchmark_confusion_matrix(
    comparison_id: str,
    run_id: str = Query(...),
    axis: ConfusionMatrixAxis = Query(...),
) -> ConfusionMatrix:
    return service.build_confusion_matrix(comparison_id, run_id, axis)


@router.get(
    "/benchmark-comparisons/{comparison_id}/confusion-matrix/cells/{cell_id}/error-cases",
    response_model=ConfusionCellErrorCasesResponse,
    summary="Drill a confusion cell to contributing error cases",
    responses={403: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
)
def get_confusion_cell_error_cases(
    comparison_id: str,
    cell_id: str,
    limit: int = Query(default=50, le=100),
    cursor: str | None = Query(default=None),
) -> ConfusionCellErrorCasesResponse:
    return service.confusion_cell_error_cases(comparison_id, cell_id, limit=limit, cursor=cursor)
