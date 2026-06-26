from __future__ import annotations

import base64
import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.errors import ApiException
from app.modules.evaluation import service as evaluation_service
from app.modules.evaluation.schemas import (
    EvaluationErrorCase,
    EvaluationErrorType,
    EvaluationMetricName,
    EvaluationMetricStatus,
    EvaluationRun,
    EvaluationRunStatus,
)
from app.modules.project.models import Project

from .schemas import (
    BenchmarkComparison,
    BenchmarkComparisonCapabilities,
    BenchmarkComparisonCreateRequest,
    BenchmarkComparisonGroupBy,
    BenchmarkComparisonListResponse,
    BenchmarkComparisonRun,
    BenchmarkComparisonSummary,
    BenchmarkExcludedRun,
    BenchmarkMetricCell,
    BenchmarkMetricRow,
    BenchmarkMutationGuard,
    BenchmarkRunContext,
    ComparabilitySummary,
    ComparisonComparabilityFlag,
    ConfusionCellErrorCaseRef,
    ConfusionCellErrorCasesResponse,
    ConfusionMatrix,
    ConfusionMatrixAxis,
    ConfusionMatrixCell,
    ConfusionMatrixLabelCount,
    ConfusionMatrixTotals,
    MetricDeltaStatus,
    RunExclusionReason,
)

DELTA_EPSILON = 0.0001
NONE_SENTINEL = "__NONE__"
SAFETY_NOTE = (
    "Read-only aggregation over existing evaluation runs, metrics, and error cases. "
    "No run executed, no gold set authored, no graph mutated."
)
_TERMINAL_SUCCESS = {EvaluationRunStatus.SUCCEEDED, "SUCCESS"}

_comparisons: dict[str, BenchmarkComparison] = {}
_comparison_runs: dict[str, list[EvaluationRun]] = {}
_comparison_counter = 0


def reset_runtime_store() -> None:
    global _comparison_counter
    _comparisons.clear()
    _comparison_runs.clear()
    _comparison_counter = 0


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise ApiException(
            status_code=404,
            code="PROJECT_NOT_FOUND",
            message="Project was not found.",
            details={"project_id": project_id},
        )
    return project


def _is_terminal_success(run: EvaluationRun) -> bool:
    status = run.status
    if isinstance(status, EvaluationRunStatus):
        return status == EvaluationRunStatus.SUCCEEDED
    return status == "SUCCESS"


def _resolve_run(run_id: str) -> EvaluationRun | None:
    try:
        return evaluation_service.run_or_404(run_id)
    except ApiException:
        return None


def _metric_lookup(run_id: str) -> dict[str, tuple[float | None, EvaluationMetricStatus]]:
    result: dict[str, tuple[float | None, EvaluationMetricStatus]] = {}
    try:
        metrics = evaluation_service.metrics_for_run(run_id)
    except ApiException:
        metrics = []
    for metric in metrics:
        result[metric.metric_name.value] = (metric.value, metric.status)
    return result


def _group_value(run: EvaluationRun, group_by: BenchmarkComparisonGroupBy) -> str:
    if group_by == BenchmarkComparisonGroupBy.MODEL:
        return f"{run.model_name or '-'} / {run.model_provider or '-'}"
    if group_by == BenchmarkComparisonGroupBy.PROMPT_VERSION:
        return run.prompt_version_id or "-"
    if group_by == BenchmarkComparisonGroupBy.ONTOLOGY_VERSION:
        return run.ontology_version_id or "-"
    if group_by == BenchmarkComparisonGroupBy.DATASET_VERSION:
        return f"{run.dataset_id or '-'} / {run.dataset_version_id or '-'}"
    if group_by == BenchmarkComparisonGroupBy.PARSER_VERSION:
        return run.parser_version or "-"
    return "-"


def _run_context(run: EvaluationRun) -> BenchmarkRunContext:
    status = run.status.value if isinstance(run.status, EvaluationRunStatus) else run.status
    return BenchmarkRunContext(
        model_name=run.model_name,
        model_provider=run.model_provider,
        prompt_version_id=run.prompt_version_id,
        ontology_version_id=run.ontology_version_id,
        parser_version=run.parser_version,
        dataset_id=run.dataset_id,
        dataset_version_id=run.dataset_version_id,
        model_run_id=run.model_run_id,
        status=status,
        started_at=run.started_at,
        completed_at=run.completed_at,
    )


def _run_comparability_flags(
    run: EvaluationRun, baseline: EvaluationRun
) -> list[ComparisonComparabilityFlag]:
    flags: list[ComparisonComparabilityFlag] = []
    if run.dataset_id == baseline.dataset_id:
        if run.dataset_version_id == baseline.dataset_version_id:
            flags.append(ComparisonComparabilityFlag.SAME_DATASET)
        else:
            flags.append(ComparisonComparabilityFlag.DIFFERENT_DATASET_VERSION)
    else:
        flags.append(ComparisonComparabilityFlag.DIFFERENT_DATASET)
    if run.ontology_version_id != baseline.ontology_version_id:
        flags.append(ComparisonComparabilityFlag.DIFFERENT_ONTOLOGY_VERSION)
    return flags


def build_comparison(
    project_id: str, payload: BenchmarkComparisonCreateRequest
) -> BenchmarkComparison:
    global _comparison_counter

    metric_names = payload.metric_names or list(EvaluationMetricName)

    eligible: list[EvaluationRun] = []
    eligible_ids: list[str] = []
    excluded: list[BenchmarkExcludedRun] = []
    seen: set[str] = set()

    for run_id in payload.run_ids:
        if run_id in seen:
            excluded.append(
                BenchmarkExcludedRun(
                    run_id=run_id,
                    exclusion_reason=RunExclusionReason.DUPLICATE_RUN_ID,
                    detail="run id repeated in run_ids[]",
                )
            )
            continue
        seen.add(run_id)
        run = _resolve_run(run_id)
        if run is None:
            excluded.append(
                BenchmarkExcludedRun(
                    run_id=run_id,
                    exclusion_reason=RunExclusionReason.RUN_NOT_FOUND,
                    detail="run id does not resolve",
                )
            )
            continue
        if run.project_id != project_id:
            excluded.append(
                BenchmarkExcludedRun(
                    run_id=run_id,
                    exclusion_reason=RunExclusionReason.DIFFERENT_PROJECT,
                    detail=f"run belongs to project {run.project_id}",
                )
            )
            continue
        if not _is_terminal_success(run):
            status = run.status.value if isinstance(run.status, EvaluationRunStatus) else run.status
            excluded.append(
                BenchmarkExcludedRun(
                    run_id=run_id,
                    exclusion_reason=RunExclusionReason.NOT_TERMINAL_SUCCESS,
                    detail=f"status is {status}",
                )
            )
            continue
        eligible.append(run)
        eligible_ids.append(run_id)

    if len(eligible) < 2:
        raise ApiException(
            status_code=400,
            code="BENCHMARK_INSUFFICIENT_RUNS",
            message="At least two eligible terminal-success runs are required for a comparison.",
            details={"project_id": project_id, "eligible_run_count": len(eligible)},
        )

    baseline_run_id = payload.baseline_run_id or eligible_ids[0]
    if baseline_run_id not in eligible_ids:
        raise ApiException(
            status_code=400,
            code="BENCHMARK_BASELINE_INELIGIBLE",
            message="The requested baseline run is not an eligible run in this comparison.",
            details={"project_id": project_id, "baseline_run_id": baseline_run_id},
        )
    baseline_run = next(run for run in eligible if run.id == baseline_run_id)

    runs: list[BenchmarkComparisonRun] = []
    per_run_flags: dict[str, list[ComparisonComparabilityFlag]] = {}
    for run in eligible:
        flags = _run_comparability_flags(run, baseline_run)
        per_run_flags[run.id] = flags
        runs.append(
            BenchmarkComparisonRun(
                run_id=run.id,
                label=_group_value(run, payload.group_by)
                + (" (baseline)" if run.id == baseline_run_id else ""),
                group_value=_group_value(run, payload.group_by),
                is_baseline=run.id == baseline_run_id,
                run_context=_run_context(run),
                comparability_flags=flags,
            )
        )

    baseline_metrics = _metric_lookup(baseline_run_id)
    run_metric_lookups = {run.id: _metric_lookup(run.id) for run in eligible}

    metric_rows: list[BenchmarkMetricRow] = []
    any_missing_metric = False
    for metric_name in metric_names:
        key = metric_name.value
        baseline_value, baseline_status = baseline_metrics.get(
            key, (None, EvaluationMetricStatus.NOT_APPLICABLE)
        )
        row_missing = baseline_status != EvaluationMetricStatus.MEASURED
        per_run_cells: list[BenchmarkMetricCell] = []
        for run in eligible:
            value, status = run_metric_lookups[run.id].get(
                key, (None, EvaluationMetricStatus.NOT_APPLICABLE)
            )
            if (
                status == EvaluationMetricStatus.MEASURED
                and baseline_status == EvaluationMetricStatus.MEASURED
                and value is not None
                and baseline_value is not None
            ):
                delta = round(value - baseline_value, 6)
                if delta > DELTA_EPSILON:
                    delta_status = MetricDeltaStatus.IMPROVED
                elif delta < -DELTA_EPSILON:
                    delta_status = MetricDeltaStatus.REGRESSED
                else:
                    delta_status = MetricDeltaStatus.UNCHANGED
            else:
                delta = None
                delta_status = MetricDeltaStatus.NOT_COMPARABLE
                row_missing = True
            per_run_cells.append(
                BenchmarkMetricCell(
                    run_id=run.id,
                    value=value,
                    metric_status=status,
                    delta=delta,
                    delta_status=delta_status,
                )
            )
        row_flags = [ComparisonComparabilityFlag.MISSING_METRIC] if row_missing else []
        if row_missing:
            any_missing_metric = True
        metric_rows.append(
            BenchmarkMetricRow(
                metric_name=metric_name,
                baseline_value=baseline_value,
                baseline_metric_status=baseline_status,
                row_comparability_flags=row_flags,
                per_run=per_run_cells,
            )
        )

    set_flags: list[ComparisonComparabilityFlag] = []
    for flags in per_run_flags.values():
        for flag in flags:
            if flag not in set_flags:
                set_flags.append(flag)
    if any_missing_metric and ComparisonComparabilityFlag.MISSING_METRIC not in set_flags:
        set_flags.append(ComparisonComparabilityFlag.MISSING_METRIC)

    notes: list[str] = []
    if ComparisonComparabilityFlag.SAME_DATASET in set_flags and len(
        [f for f in set_flags if f.value.startswith("DIFFERENT_DATASET")]
    ) == 0:
        notes.append("All compared runs share dataset and dataset version.")
    if ComparisonComparabilityFlag.DIFFERENT_DATASET in set_flags:
        notes.append("At least one compared run uses a different dataset; deltas may not be comparable.")
    if ComparisonComparabilityFlag.DIFFERENT_DATASET_VERSION in set_flags:
        notes.append("At least one compared run uses a different dataset version.")
    if ComparisonComparabilityFlag.DIFFERENT_ONTOLOGY_VERSION in set_flags:
        notes.append("At least one compared run uses a different ontology version.")
    if ComparisonComparabilityFlag.MISSING_METRIC in set_flags:
        notes.append("One or more metrics are not comparable because a run did not measure them.")

    _comparison_counter += 1
    now = utc_now()
    comparison_id = f"{project_id}-benchmark-comparison-{_comparison_counter}"
    comparison = BenchmarkComparison(
        id=comparison_id,
        project_id=project_id,
        group_by=payload.group_by,
        baseline_run_id=baseline_run_id,
        metric_names=metric_names,
        delta_epsilon=DELTA_EPSILON,
        runs=runs,
        metric_rows=metric_rows,
        excluded_runs=excluded,
        comparability_summary=ComparabilitySummary(flags=set_flags, notes=notes),
        generated_at=now,
        mutation_guard=BenchmarkMutationGuard(),
        capabilities=BenchmarkComparisonCapabilities(),
        safety_note=SAFETY_NOTE,
    )
    _comparisons[comparison_id] = comparison
    _comparison_runs[comparison_id] = eligible
    return comparison


def list_comparisons(
    project_id: str,
    group_by: BenchmarkComparisonGroupBy | None = None,
    limit: int = 50,
    cursor: str | None = None,
) -> BenchmarkComparisonListResponse:
    items = [
        comparison
        for comparison in _comparisons.values()
        if comparison.project_id == project_id
        and (group_by is None or comparison.group_by == group_by)
    ]
    items.sort(key=lambda c: c.generated_at)
    summaries = [
        BenchmarkComparisonSummary(
            id=comparison.id,
            project_id=comparison.project_id,
            group_by=comparison.group_by,
            baseline_run_id=comparison.baseline_run_id,
            run_count=len(comparison.runs),
            comparability_flags=comparison.comparability_summary.flags,
            generated_at=comparison.generated_at,
        )
        for comparison in items
    ]
    start = 0
    if cursor is not None:
        try:
            start = int(cursor)
        except ValueError:
            start = 0
    window = summaries[start : start + limit]
    next_cursor = str(start + limit) if start + limit < len(summaries) else None
    return BenchmarkComparisonListResponse(items=window, next_cursor=next_cursor)


def comparison_or_404(comparison_id: str) -> BenchmarkComparison:
    comparison = _comparisons.get(comparison_id)
    if comparison is None:
        raise ApiException(
            status_code=404,
            code="BENCHMARK_COMPARISON_NOT_FOUND",
            message="Benchmark comparison was not found.",
            details={"comparison_id": comparison_id},
        )
    return comparison


def _compared_run_or_404(comparison: BenchmarkComparison, run_id: str) -> None:
    if not any(run.run_id == run_id for run in comparison.runs):
        raise ApiException(
            status_code=404,
            code="BENCHMARK_RUN_NOT_IN_COMPARISON",
            message="The run is not part of this comparison.",
            details={"comparison_id": comparison.id, "run_id": run_id},
        )


def _gold_entity_class(gold_entity_id: str | None) -> str | None:
    if gold_entity_id is None:
        return None
    entity = evaluation_service._gold_entities.get(gold_entity_id)
    return entity.ontology_class_id if entity else None


def _gold_relation_type(gold_relation_id: str | None) -> str | None:
    if gold_relation_id is None:
        return None
    relation = evaluation_service._gold_relations.get(gold_relation_id)
    return relation.ontology_relation_id if relation else None


def _encode_cell_id(axis: ConfusionMatrixAxis, gold_label: str, candidate_label: str) -> str:
    raw = json.dumps([axis.value, gold_label, candidate_label], separators=(",", ":"))
    return "cm_" + base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii").rstrip("=")


def _decode_cell_id(cell_id: str) -> tuple[str, str, str] | None:
    if not cell_id.startswith("cm_"):
        return None
    payload = cell_id[3:]
    padding = "=" * (-len(payload) % 4)
    try:
        raw = base64.urlsafe_b64decode(payload + padding).decode("utf-8")
        axis_value, gold_label, candidate_label = json.loads(raw)
    except (ValueError, TypeError):
        return None
    return axis_value, gold_label, candidate_label


def _cell_labels_for_error(
    axis: ConfusionMatrixAxis, error: EvaluationErrorCase
) -> tuple[str, str] | None:
    """Return (gold_label, candidate_label) for an error case on the given axis."""
    candidate = error.candidate_ref
    if axis == ConfusionMatrixAxis.ENTITY_CLASS:
        if error.error_type == EvaluationErrorType.MISSING_ENTITY:
            gold = _gold_entity_class(error.gold_entity_id)
            return (gold or NONE_SENTINEL, NONE_SENTINEL)
        if error.error_type == EvaluationErrorType.EXTRA_ENTITY:
            cand = candidate.ontology_class_id if candidate else None
            return (NONE_SENTINEL, cand or NONE_SENTINEL)
        if error.error_type == EvaluationErrorType.WRONG_ENTITY_CLASS:
            gold = _gold_entity_class(error.gold_entity_id)
            cand = candidate.ontology_class_id if candidate else None
            return (gold or NONE_SENTINEL, cand or NONE_SENTINEL)
        return None
    # RELATION_TYPE
    if error.error_type in {
        EvaluationErrorType.WRONG_RELATION_TYPE,
        EvaluationErrorType.WRONG_RELATION_DIRECTION,
    }:
        gold = _gold_relation_type(error.gold_relation_id)
        cand = candidate.ontology_relation_id if candidate else None
        return (gold or NONE_SENTINEL, cand or NONE_SENTINEL)
    if error.error_type == EvaluationErrorType.MISSING_RELATION:
        gold = _gold_relation_type(error.gold_relation_id)
        return (gold or NONE_SENTINEL, NONE_SENTINEL)
    if error.error_type == EvaluationErrorType.EXTRA_RELATION:
        cand = candidate.ontology_relation_id if candidate else None
        return (NONE_SENTINEL, cand or NONE_SENTINEL)
    return None


def _diagonal_matches(run: EvaluationRun, axis: ConfusionMatrixAxis) -> dict[str, int]:
    """Recompute true-positive (matched) pairs per ontology bucket for the run's dataset.

    Returns {ontology_id: matched_count}. Mirrors the deterministic matching the
    evaluation engine used; read-only (no mutation)."""
    dataset_id = run.dataset_id
    if not dataset_id or dataset_id not in evaluation_service._datasets:
        return {}
    diagonal: dict[str, int] = {}
    if axis == ConfusionMatrixAxis.ENTITY_CLASS:
        gold_entities = evaluation_service.list_gold_entities(dataset_id)
        candidates = evaluation_service._build_deterministic_entity_candidates(dataset_id)
        matches, _missing, _extra = evaluation_service._match_entities(gold_entities, candidates)
        for gold, _candidate in matches:
            diagonal[gold.ontology_class_id] = diagonal.get(gold.ontology_class_id, 0) + 1
    else:
        gold_relations = evaluation_service.list_gold_relations(dataset_id)
        candidates = evaluation_service._build_deterministic_relation_candidates(dataset_id)
        matches, _missing, _extra, _wrong_dir = evaluation_service._match_relations(
            gold_relations, candidates
        )
        for gold, _candidate in matches:
            diagonal[gold.ontology_relation_id] = diagonal.get(gold.ontology_relation_id, 0) + 1
    return diagonal


def _contributing_errors(
    run_id: str, axis: ConfusionMatrixAxis, gold_label: str, candidate_label: str
) -> list[EvaluationErrorCase]:
    try:
        errors = evaluation_service.errors_for_run(run_id)
    except ApiException:
        errors = []
    matched: list[EvaluationErrorCase] = []
    for error in errors:
        labels = _cell_labels_for_error(axis, error)
        if labels is None:
            continue
        if labels[0] == gold_label and labels[1] == candidate_label:
            matched.append(error)
    return matched


def build_confusion_matrix(
    comparison_id: str, run_id: str, axis: ConfusionMatrixAxis
) -> ConfusionMatrix:
    comparison = comparison_or_404(comparison_id)
    _compared_run_or_404(comparison, run_id)
    run = _resolve_run(run_id)

    # Aggregate cell counts: (gold_label, candidate_label) -> count
    cell_counts: dict[tuple[str, str], int] = {}
    cell_error_counts: dict[tuple[str, str], int] = {}

    try:
        errors = evaluation_service.errors_for_run(run_id)
    except ApiException:
        errors = []
    for error in errors:
        labels = _cell_labels_for_error(axis, error)
        if labels is None:
            continue
        cell_counts[labels] = cell_counts.get(labels, 0) + 1
        cell_error_counts[labels] = cell_error_counts.get(labels, 0) + 1

    if run is not None:
        for ontology_id, count in _diagonal_matches(run, axis).items():
            key = (ontology_id, ontology_id)
            cell_counts[key] = cell_counts.get(key, 0) + count

    # Collect ontology-id labels (excluding sentinel) in deterministic order.
    ontology_labels: list[str] = []
    for gold_label, candidate_label in cell_counts:
        for label in (gold_label, candidate_label):
            if label != NONE_SENTINEL and label not in ontology_labels:
                ontology_labels.append(label)
    ontology_labels.sort()
    has_sentinel = any(
        NONE_SENTINEL in (g, c) for (g, c) in cell_counts if cell_counts[(g, c)] > 0
    )
    labels = list(ontology_labels)
    if has_sentinel:
        labels.append(NONE_SENTINEL)

    cells: list[ConfusionMatrixCell] = []
    diagonal_count = 0
    off_diagonal_count = 0
    row_totals: dict[str, int] = {}
    col_totals: dict[str, int] = {}
    for (gold_label, candidate_label), count in sorted(
        cell_counts.items(), key=lambda item: (item[0][0], item[0][1])
    ):
        if count == 0:
            continue
        is_diagonal = (
            gold_label == candidate_label and gold_label != NONE_SENTINEL
        )
        if is_diagonal:
            diagonal_count += count
        else:
            off_diagonal_count += count
        row_totals[gold_label] = row_totals.get(gold_label, 0) + count
        col_totals[candidate_label] = col_totals.get(candidate_label, 0) + count
        cell_id = _encode_cell_id(axis, gold_label, candidate_label)
        error_case_count = cell_error_counts.get((gold_label, candidate_label), 0)
        cells.append(
            ConfusionMatrixCell(
                id=cell_id,
                gold_label=gold_label,
                candidate_label=candidate_label,
                is_diagonal=is_diagonal,
                count=count,
                contributing_error_case_ref=ConfusionCellErrorCaseRef(
                    cell_id=cell_id,
                    error_case_count=error_case_count,
                ),
            )
        )

    denominator = diagonal_count + off_diagonal_count
    if denominator == 0:
        accuracy: float | None = None
        accuracy_status = EvaluationMetricStatus.NOT_APPLICABLE
    else:
        accuracy = round(diagonal_count / denominator, 4)
        accuracy_status = EvaluationMetricStatus.MEASURED

    label_display_names = _label_display_names(run, axis, ontology_labels)

    totals = ConfusionMatrixTotals(
        row_totals=[
            ConfusionMatrixLabelCount(label=label, count=count)
            for label, count in sorted(row_totals.items())
        ],
        col_totals=[
            ConfusionMatrixLabelCount(label=label, count=count)
            for label, count in sorted(col_totals.items())
        ],
        diagonal_count=diagonal_count,
        off_diagonal_count=off_diagonal_count,
        accuracy=accuracy,
        accuracy_status=accuracy_status,
    )

    return ConfusionMatrix(
        comparison_id=comparison_id,
        run_id=run_id,
        axis=axis,
        labels=labels,
        label_display_names=label_display_names,
        cells=cells,
        totals=totals,
        generated_at=utc_now(),
        mutation_guard=BenchmarkMutationGuard(),
    )


def _label_display_names(
    run: EvaluationRun | None, axis: ConfusionMatrixAxis, ontology_labels: list[str]
) -> dict[str, str]:
    """Map ontology id -> human label from gold items in the run dataset (best effort)."""
    display: dict[str, str] = {}
    if run is None or not run.dataset_id:
        return display
    dataset_id = run.dataset_id
    if axis == ConfusionMatrixAxis.ENTITY_CLASS:
        for entity in evaluation_service._gold_entities.values():
            if entity.dataset_id == dataset_id and entity.ontology_class_id in ontology_labels:
                display.setdefault(entity.ontology_class_id, entity.ontology_class_id)
    else:
        for relation in evaluation_service._gold_relations.values():
            if (
                relation.dataset_id == dataset_id
                and relation.ontology_relation_id in ontology_labels
            ):
                display.setdefault(
                    relation.ontology_relation_id, relation.ontology_relation_id
                )
    return display


def confusion_cell_error_cases(
    comparison_id: str,
    cell_id: str,
    limit: int = 50,
    cursor: str | None = None,
) -> ConfusionCellErrorCasesResponse:
    comparison = comparison_or_404(comparison_id)
    decoded = _decode_cell_id(cell_id)
    if decoded is None:
        raise ApiException(
            status_code=404,
            code="CONFUSION_CELL_NOT_FOUND",
            message="Confusion cell was not found.",
            details={"comparison_id": comparison_id, "cell_id": cell_id},
        )
    axis_value, gold_label, candidate_label = decoded
    try:
        axis = ConfusionMatrixAxis(axis_value)
    except ValueError:
        raise ApiException(
            status_code=404,
            code="CONFUSION_CELL_NOT_FOUND",
            message="Confusion cell was not found.",
            details={"comparison_id": comparison_id, "cell_id": cell_id},
        ) from None

    # The drill endpoint does not carry run_id; resolve the cell against any
    # compared run that contains it. Cells are addressed within a single
    # comparison; the contributing run is the one whose error cases match.
    matched_run_id: str | None = None
    contributing: list[EvaluationErrorCase] = []
    for run in comparison.runs:
        run_errors = _contributing_errors(run.run_id, axis, gold_label, candidate_label)
        if run_errors:
            matched_run_id = run.run_id
            contributing = run_errors
            break
    if matched_run_id is None:
        # Diagonal / true-positive cell or a cell that resolves but has no error
        # cases; verify the cell exists in at least one run's matrix.
        if not _cell_exists(comparison, axis, gold_label, candidate_label):
            raise ApiException(
                status_code=404,
                code="CONFUSION_CELL_NOT_FOUND",
                message="Confusion cell was not found.",
                details={"comparison_id": comparison_id, "cell_id": cell_id},
            )
        matched_run_id = comparison.runs[0].run_id

    start = 0
    if cursor is not None:
        try:
            start = int(cursor)
        except ValueError:
            start = 0
    window = contributing[start : start + limit]
    next_cursor = str(start + limit) if start + limit < len(contributing) else None

    return ConfusionCellErrorCasesResponse(
        comparison_id=comparison_id,
        run_id=matched_run_id,
        axis=axis,
        cell_id=cell_id,
        gold_label=gold_label,
        candidate_label=candidate_label,
        error_cases=window,
        next_cursor=next_cursor,
    )


def _cell_exists(
    comparison: BenchmarkComparison,
    axis: ConfusionMatrixAxis,
    gold_label: str,
    candidate_label: str,
) -> bool:
    for run in comparison.runs:
        matrix = build_confusion_matrix(comparison.id, run.run_id, axis)
        for cell in matrix.cells:
            if cell.gold_label == gold_label and cell.candidate_label == candidate_label:
                return True
    return False
