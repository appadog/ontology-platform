from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field

from app.modules.evaluation.schemas import (
    EvaluationErrorCase,
    EvaluationMetricName,
    EvaluationMetricStatus,
)


class BenchmarkComparisonGroupBy(str, Enum):
    MODEL = "MODEL"
    PROMPT_VERSION = "PROMPT_VERSION"
    ONTOLOGY_VERSION = "ONTOLOGY_VERSION"
    DATASET_VERSION = "DATASET_VERSION"
    PARSER_VERSION = "PARSER_VERSION"


class ComparisonComparabilityFlag(str, Enum):
    SAME_DATASET = "SAME_DATASET"
    DIFFERENT_DATASET_VERSION = "DIFFERENT_DATASET_VERSION"
    DIFFERENT_DATASET = "DIFFERENT_DATASET"
    DIFFERENT_ONTOLOGY_VERSION = "DIFFERENT_ONTOLOGY_VERSION"
    MISSING_METRIC = "MISSING_METRIC"


class ConfusionMatrixAxis(str, Enum):
    ENTITY_CLASS = "ENTITY_CLASS"
    RELATION_TYPE = "RELATION_TYPE"


class MetricDeltaStatus(str, Enum):
    IMPROVED = "IMPROVED"
    REGRESSED = "REGRESSED"
    UNCHANGED = "UNCHANGED"
    NOT_COMPARABLE = "NOT_COMPARABLE"


class RunExclusionReason(str, Enum):
    NOT_TERMINAL_SUCCESS = "NOT_TERMINAL_SUCCESS"
    DIFFERENT_PROJECT = "DIFFERENT_PROJECT"
    RUN_NOT_FOUND = "RUN_NOT_FOUND"
    DUPLICATE_RUN_ID = "DUPLICATE_RUN_ID"


class BenchmarkMutationGuard(BaseModel):
    candidate_graph_mutated: bool = False
    published_graph_mutated: bool = False
    evaluation_run_started: bool = False
    gold_set_mutated: bool = False


class BenchmarkComparisonCreateRequest(BaseModel):
    run_ids: list[str] = Field(min_length=2)
    group_by: BenchmarkComparisonGroupBy
    baseline_run_id: str | None = None
    metric_names: list[EvaluationMetricName] | None = None


class BenchmarkRunContext(BaseModel):
    model_name: str | None = None
    model_provider: str | None = None
    prompt_version_id: str | None = None
    ontology_version_id: str | None = None
    parser_version: str | None = None
    dataset_id: str | None = None
    dataset_version_id: str | None = None
    model_run_id: str | None = None
    status: str
    started_at: datetime | None = None
    completed_at: datetime | None = None


class BenchmarkComparisonRun(BaseModel):
    run_id: str
    label: str
    group_value: str
    is_baseline: bool
    run_context: BenchmarkRunContext
    comparability_flags: list[ComparisonComparabilityFlag] = Field(default_factory=list)


class BenchmarkMetricCell(BaseModel):
    run_id: str
    value: float | None = None
    metric_status: EvaluationMetricStatus
    delta: float | None = None
    delta_status: MetricDeltaStatus


class BenchmarkMetricRow(BaseModel):
    metric_name: EvaluationMetricName
    baseline_value: float | None = None
    baseline_metric_status: EvaluationMetricStatus
    row_comparability_flags: list[ComparisonComparabilityFlag] = Field(default_factory=list)
    per_run: list[BenchmarkMetricCell] = Field(default_factory=list)


class BenchmarkExcludedRun(BaseModel):
    run_id: str
    exclusion_reason: RunExclusionReason
    detail: str | None = None


class ComparabilitySummary(BaseModel):
    flags: list[ComparisonComparabilityFlag] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class BenchmarkComparisonCapabilities(BaseModel):
    can_view: bool = True
    can_create_comparison: bool = True
    can_drill_error_cases: bool = True


class BenchmarkComparison(BaseModel):
    id: str
    project_id: str
    group_by: BenchmarkComparisonGroupBy
    baseline_run_id: str
    metric_names: list[EvaluationMetricName]
    delta_epsilon: float
    runs: list[BenchmarkComparisonRun]
    metric_rows: list[BenchmarkMetricRow]
    excluded_runs: list[BenchmarkExcludedRun] = Field(default_factory=list)
    comparability_summary: ComparabilitySummary
    generated_at: datetime
    mutation_guard: BenchmarkMutationGuard = Field(default_factory=BenchmarkMutationGuard)
    capabilities: BenchmarkComparisonCapabilities | None = None
    safety_note: str | None = None


class BenchmarkComparisonSummary(BaseModel):
    id: str
    project_id: str
    group_by: BenchmarkComparisonGroupBy
    baseline_run_id: str
    run_count: int
    comparability_flags: list[ComparisonComparabilityFlag] = Field(default_factory=list)
    generated_at: datetime


class BenchmarkComparisonListResponse(BaseModel):
    items: list[BenchmarkComparisonSummary] = Field(default_factory=list)
    next_cursor: str | None = None


class ConfusionCellErrorCaseRef(BaseModel):
    cell_id: str
    error_case_count: int


class ConfusionMatrixCell(BaseModel):
    id: str
    gold_label: str
    candidate_label: str
    is_diagonal: bool
    count: int
    contributing_error_case_ref: ConfusionCellErrorCaseRef


class ConfusionMatrixLabelCount(BaseModel):
    label: str
    count: int


class ConfusionMatrixTotals(BaseModel):
    row_totals: list[ConfusionMatrixLabelCount] = Field(default_factory=list)
    col_totals: list[ConfusionMatrixLabelCount] = Field(default_factory=list)
    diagonal_count: int
    off_diagonal_count: int
    accuracy: float | None = None
    accuracy_status: EvaluationMetricStatus


class ConfusionMatrix(BaseModel):
    comparison_id: str
    run_id: str
    axis: ConfusionMatrixAxis
    labels: list[str] = Field(default_factory=list)
    label_display_names: dict[str, str] = Field(default_factory=dict)
    cells: list[ConfusionMatrixCell] = Field(default_factory=list)
    totals: ConfusionMatrixTotals
    generated_at: datetime
    mutation_guard: BenchmarkMutationGuard = Field(default_factory=BenchmarkMutationGuard)


class ConfusionCellErrorCasesResponse(BaseModel):
    comparison_id: str
    run_id: str
    axis: ConfusionMatrixAxis
    cell_id: str
    gold_label: str
    candidate_label: str
    error_cases: list[EvaluationErrorCase] = Field(default_factory=list)
    next_cursor: str | None = None
