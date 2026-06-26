import {
  BenchmarkComparison,
  BenchmarkComparisonGroupBy,
  ComparisonComparabilityFlag,
  ConfusionMatrix,
  ConfusionMatrixAxis,
  EvaluationErrorCase,
  EvaluationMetricName,
  EvaluationRun,
  MetricDeltaStatus,
} from "../api/types";
import { MVP6_PROJECT_ID } from "./mvp6Fixtures";

// Deterministic MVP6.3 Benchmark Comparison fixtures, project-scoped.
// Read-only aggregation over MVP6.1 evaluation artifacts. Field/enum names match
// docs/api/openapi-mvp6-3-draft.json exactly. No new evaluation run engine,
// no gold-set authoring, no graph/policy mutation.

export const MVP6_BENCHMARK_PROJECT_ID = MVP6_PROJECT_ID;
export const MVP6_BENCHMARK_COMPARISON_ID = "benchmark-comparison-mvp6-3-001";
export const MVP6_BENCHMARK_DELTA_EPSILON = 0.0001;

export const MVP6_BENCHMARK_BASELINE_RUN_ID = "eval-run-mvp6-baseline";
export const MVP6_BENCHMARK_CANDIDATE_RUN_ID = "eval-run-mvp6-candidate";
export const MVP6_BENCHMARK_FAILED_RUN_ID = "eval-run-mvp6-failed-benchmark";

const NOW = "2026-06-26T09:00:00.000Z";

export const MVP6_BENCHMARK_METRIC_NAMES: EvaluationMetricName[] = [
  "ENTITY_PRECISION",
  "ENTITY_RECALL",
  "ENTITY_F1",
  "RELATION_PRECISION",
  "RELATION_RECALL",
  "RELATION_F1",
  "RELATION_DIRECTION_ACCURACY",
  "EVIDENCE_MATCH_RATE",
];

// Eligible (terminal-success) runs plus one FAILED run that must degrade to excluded_runs[].
export const mockMvp6BenchmarkRuns: EvaluationRun[] = [
  {
    id: MVP6_BENCHMARK_BASELINE_RUN_ID,
    project_id: MVP6_BENCHMARK_PROJECT_ID,
    dataset_id: "eval-dataset-mvp6-gold",
    dataset_version_id: "eval-dataset-mvp6-gold-v2",
    status: "SUCCEEDED",
    run_mode: "DETERMINISTIC_MOCK",
    ontology_version_id: "onto-v6-eval",
    prompt_version_id: "prompt-v6-eval",
    model_name: "deterministic-mock",
    model_provider: "mock",
    model_run_id: "model-run-mvp6-baseline",
    parser_version: "parser-v6.1",
    started_at: "2026-06-20T09:00:00.000Z",
    completed_at: "2026-06-20T09:01:30.000Z",
    ended_at: "2026-06-20T09:01:30.000Z",
    requested_by: "qa-owner",
    metrics: {},
    dimensions: { class_type: "class-policy", relation_type: "relation-owned-by" },
  },
  {
    id: MVP6_BENCHMARK_CANDIDATE_RUN_ID,
    project_id: MVP6_BENCHMARK_PROJECT_ID,
    dataset_id: "eval-dataset-mvp6-gold",
    // Different dataset version on purpose -> exercises DIFFERENT_DATASET_VERSION warning band.
    dataset_version_id: "eval-dataset-mvp6-gold-v3",
    status: "SUCCEEDED",
    run_mode: "DETERMINISTIC_MOCK",
    ontology_version_id: "onto-v6-eval",
    prompt_version_id: "prompt-v6-eval-b",
    model_name: "gpt-mock-b",
    model_provider: "mock",
    model_run_id: "model-run-mvp6-candidate",
    parser_version: "parser-v6.1",
    started_at: "2026-06-20T09:05:00.000Z",
    completed_at: "2026-06-20T09:06:20.000Z",
    ended_at: "2026-06-20T09:06:20.000Z",
    requested_by: "qa-owner",
    metrics: {},
    dimensions: { class_type: "class-policy", relation_type: "relation-owned-by" },
  },
  {
    id: MVP6_BENCHMARK_FAILED_RUN_ID,
    project_id: MVP6_BENCHMARK_PROJECT_ID,
    dataset_id: "eval-dataset-mvp6-gold",
    dataset_version_id: "eval-dataset-mvp6-gold-v2",
    status: "FAILED",
    run_mode: "DETERMINISTIC_MOCK",
    ontology_version_id: "onto-v6-eval",
    prompt_version_id: "prompt-v6-eval-failed",
    model_name: "deterministic-mock",
    model_provider: "mock",
    model_run_id: "model-run-mvp6-failed",
    parser_version: "parser-v6.1",
    started_at: "2026-06-20T09:10:00.000Z",
    completed_at: NOW,
    ended_at: NOW,
    requested_by: "qa-owner",
    metrics: {},
    dimensions: {},
    error_code: "DETERMINISTIC_FIXTURE_BLOCKED",
    error_message: "The fixture intentionally exposes the failed run state.",
  },
];

// Per-run measured metric values used to derive signed deltas. EVIDENCE_MATCH_RATE is
// NOT_APPLICABLE in both runs -> NOT_COMPARABLE row + MISSING_METRIC flag.
const baselineValues: Record<EvaluationMetricName, number | null> = {
  ENTITY_PRECISION: 0.82,
  ENTITY_RECALL: 0.78,
  ENTITY_F1: 0.8,
  RELATION_PRECISION: 0.66,
  RELATION_RECALL: 0.6,
  RELATION_F1: 0.63,
  RELATION_DIRECTION_ACCURACY: 0.7,
  EVIDENCE_MATCH_RATE: null,
};

const candidateValues: Record<EvaluationMetricName, number | null> = {
  ENTITY_PRECISION: 0.88, // improved
  ENTITY_RECALL: 0.78, // unchanged (within epsilon)
  ENTITY_F1: 0.83, // improved
  RELATION_PRECISION: 0.58, // regressed
  RELATION_RECALL: 0.62, // improved
  RELATION_F1: 0.6, // regressed
  RELATION_DIRECTION_ACCURACY: 0.7, // unchanged
  EVIDENCE_MATCH_RATE: null, // not comparable
};

function metricStatus(value: number | null): "MEASURED" | "NOT_APPLICABLE" {
  return value === null ? "NOT_APPLICABLE" : "MEASURED";
}

function deltaStatus(baseline: number | null, value: number | null): MetricDeltaStatus {
  if (baseline === null || value === null) {
    return "NOT_COMPARABLE";
  }
  const delta = value - baseline;
  if (delta > MVP6_BENCHMARK_DELTA_EPSILON) {
    return "IMPROVED";
  }
  if (delta < -MVP6_BENCHMARK_DELTA_EPSILON) {
    return "REGRESSED";
  }
  return "UNCHANGED";
}

function buildMetricRows(metricNames: EvaluationMetricName[]): BenchmarkComparison["metric_rows"] {
  return metricNames.map((metricName) => {
    const baselineValue = baselineValues[metricName];
    const candidateValue = candidateValues[metricName];
    const notComparable = baselineValue === null || candidateValue === null;
    const candidateDelta = notComparable ? null : Number((candidateValue! - baselineValue!).toFixed(4));

    return {
      metric_name: metricName,
      baseline_value: baselineValue,
      baseline_metric_status: metricStatus(baselineValue),
      row_comparability_flags: (notComparable ? ["MISSING_METRIC"] : []) as ComparisonComparabilityFlag[],
      per_run: [
        {
          run_id: MVP6_BENCHMARK_BASELINE_RUN_ID,
          value: baselineValue,
          metric_status: metricStatus(baselineValue),
          delta: baselineValue === null ? null : 0,
          delta_status: (baselineValue === null ? "NOT_COMPARABLE" : "UNCHANGED") as MetricDeltaStatus,
        },
        {
          run_id: MVP6_BENCHMARK_CANDIDATE_RUN_ID,
          value: candidateValue,
          metric_status: metricStatus(candidateValue),
          delta: candidateDelta,
          delta_status: deltaStatus(baselineValue, candidateValue),
        },
      ],
    };
  });
}

const groupValue: Record<BenchmarkComparisonGroupBy, (run: EvaluationRun) => string> = {
  MODEL: (run) => `${run.model_name ?? "unknown"} / ${run.model_provider ?? "unknown"}`,
  PROMPT_VERSION: (run) => run.prompt_version_id ?? "unknown",
  ONTOLOGY_VERSION: (run) => run.ontology_version_id ?? "unknown",
  DATASET_VERSION: (run) => `${run.dataset_id ?? "unknown"} / ${run.dataset_version_id ?? "unknown"}`,
  PARSER_VERSION: (run) => run.parser_version ?? "unknown",
};

export function buildMockMvp6BenchmarkComparison(
  projectId: string,
  options: {
    id?: string;
    groupBy?: BenchmarkComparisonGroupBy;
    baselineRunId?: string;
    metricNames?: EvaluationMetricName[];
  } = {},
): BenchmarkComparison {
  const groupBy = options.groupBy ?? "MODEL";
  const baselineRunId = options.baselineRunId ?? MVP6_BENCHMARK_BASELINE_RUN_ID;
  const metricNames = options.metricNames ?? MVP6_BENCHMARK_METRIC_NAMES;
  const baseRun = mockMvp6BenchmarkRuns.find((run) => run.id === MVP6_BENCHMARK_BASELINE_RUN_ID)!;
  const candidateRun = mockMvp6BenchmarkRuns.find((run) => run.id === MVP6_BENCHMARK_CANDIDATE_RUN_ID)!;

  function runContext(run: EvaluationRun) {
    return {
      model_name: run.model_name ?? null,
      model_provider: run.model_provider ?? null,
      prompt_version_id: run.prompt_version_id ?? null,
      ontology_version_id: run.ontology_version_id ?? null,
      parser_version: run.parser_version ?? null,
      dataset_id: run.dataset_id ?? null,
      dataset_version_id: run.dataset_version_id ?? null,
      model_run_id: run.model_run_id ?? null,
      status: run.status,
      started_at: run.started_at ?? null,
      completed_at: run.completed_at ?? null,
    };
  }

  const metricRows = buildMetricRows(metricNames);
  const hasMissingMetric = metricRows.some((row) => row.row_comparability_flags.includes("MISSING_METRIC"));
  // Candidate run differs from baseline on dataset version.
  const candidateFlags: ComparisonComparabilityFlag[] = ["DIFFERENT_DATASET_VERSION"];
  if (hasMissingMetric) {
    candidateFlags.push("MISSING_METRIC");
  }

  return {
    id: options.id ?? MVP6_BENCHMARK_COMPARISON_ID,
    project_id: projectId,
    group_by: groupBy,
    baseline_run_id: baselineRunId,
    metric_names: metricNames,
    delta_epsilon: MVP6_BENCHMARK_DELTA_EPSILON,
    runs: [
      {
        run_id: baseRun.id,
        label: `${baseRun.model_name} (baseline)`,
        group_value: groupValue[groupBy](baseRun),
        is_baseline: true,
        run_context: runContext(baseRun),
        comparability_flags: ["SAME_DATASET"],
      },
      {
        run_id: candidateRun.id,
        label: candidateRun.model_name ?? candidateRun.id,
        group_value: groupValue[groupBy](candidateRun),
        is_baseline: false,
        run_context: runContext(candidateRun),
        comparability_flags: candidateFlags,
      },
    ],
    metric_rows: metricRows,
    excluded_runs: [
      {
        run_id: MVP6_BENCHMARK_FAILED_RUN_ID,
        exclusion_reason: "NOT_TERMINAL_SUCCESS",
        detail: "status is FAILED",
      },
    ],
    comparability_summary: {
      flags: hasMissingMetric
        ? ["SAME_DATASET", "DIFFERENT_DATASET_VERSION", "MISSING_METRIC"]
        : ["SAME_DATASET", "DIFFERENT_DATASET_VERSION"],
      notes: [
        "The compared run uses a different dataset version than the baseline; deltas may not be a like-for-like comparison.",
        ...(hasMissingMetric
          ? ["EVIDENCE_MATCH_RATE is not comparable because at least one run did not measure it."]
          : []),
      ],
    },
    generated_at: NOW,
    mutation_guard: {
      candidate_graph_mutated: false,
      published_graph_mutated: false,
      evaluation_run_started: false,
      gold_set_mutated: false,
    },
    capabilities: {
      can_view: true,
      can_create_comparison: true,
      can_drill_error_cases: true,
    },
    safety_note:
      "Read-only aggregation over existing evaluation runs, metrics, and error cases. No run executed, no gold set authored, no graph mutated.",
  };
}

export const mockMvp6BenchmarkComparison = buildMockMvp6BenchmarkComparison(MVP6_BENCHMARK_PROJECT_ID);

const NONE = "__NONE__";

const guard = {
  candidate_graph_mutated: false,
  published_graph_mutated: false,
  evaluation_run_started: false,
  gold_set_mutated: false,
} as const;

// Cell ids encode axis + gold + candidate labels deterministically (URL-safe).
function cellId(axis: ConfusionMatrixAxis, gold: string, candidate: string): string {
  const prefix = axis === "ENTITY_CLASS" ? "cm_ent" : "cm_rel";
  const safe = (label: string) => (label === NONE ? "NONE" : label.replace(/[^a-zA-Z0-9]+/g, "_"));
  return `${prefix}__${safe(gold)}__${safe(candidate)}`;
}

interface CellSeed {
  gold: string;
  candidate: string;
  count: number;
  errorCases: EvaluationErrorCase[];
}

function evidence(quote: string) {
  return {
    sample_id: "eval-sample-mvp6-policy",
    source_id: "source-security-policy",
    source_segment_id: "segment-security-policy-001",
    locator: "security-policy.csv row 12",
    offset_start: 0,
    offset_end: quote.length,
    quote,
  };
}

function entityErrorCase(
  id: string,
  errorType: EvaluationErrorCase["error_type"],
  goldClass: string | null,
  candidateClass: string | null,
  summary: string,
): EvaluationErrorCase {
  return {
    id,
    run_id: MVP6_BENCHMARK_CANDIDATE_RUN_ID,
    project_id: MVP6_BENCHMARK_PROJECT_ID,
    dataset_id: "eval-dataset-mvp6-gold",
    sample_id: "eval-sample-mvp6-policy",
    error_type: errorType,
    gold_entity_id: goldClass ? `gold-entity-${goldClass}` : null,
    gold_relation_id: null,
    candidate_ref: candidateClass
      ? {
          candidate_kind: "ENTITY",
          candidate_id: `candidate-${id}`,
          sample_id: "eval-sample-mvp6-policy",
          ontology_class_id: candidateClass,
          label: "Candidate entity",
          normalized_value: "candidate entity",
          evidence: evidence("Candidate evidence span"),
        }
      : null,
    comparison_summary: summary,
    gold_evidence: goldClass ? evidence("Gold evidence span") : null,
    candidate_evidence: candidateClass ? evidence("Candidate evidence span") : null,
    created_at: NOW,
  };
}

function relationErrorCase(
  id: string,
  errorType: EvaluationErrorCase["error_type"],
  goldRel: string | null,
  candidateRel: string | null,
  summary: string,
): EvaluationErrorCase {
  return {
    id,
    run_id: MVP6_BENCHMARK_CANDIDATE_RUN_ID,
    project_id: MVP6_BENCHMARK_PROJECT_ID,
    dataset_id: "eval-dataset-mvp6-gold",
    sample_id: "eval-sample-mvp6-policy",
    error_type: errorType,
    gold_entity_id: null,
    gold_relation_id: goldRel ? `gold-relation-${goldRel}` : null,
    candidate_ref: candidateRel
      ? {
          candidate_kind: "RELATION",
          candidate_id: `candidate-${id}`,
          sample_id: "eval-sample-mvp6-policy",
          ontology_relation_id: candidateRel,
          source_gold_entity_id: "gold-entity-class-policy",
          target_gold_entity_id: "gold-entity-class-organization",
          evidence: evidence("Candidate relation evidence span"),
        }
      : null,
    comparison_summary: summary,
    gold_evidence: goldRel ? evidence("Gold relation evidence span") : null,
    candidate_evidence: candidateRel ? evidence("Candidate relation evidence span") : null,
    created_at: NOW,
  };
}

// Entity-class axis seeds: diagonal matches (no error cases) + off-diagonal + __NONE__ FP/FN.
const entityCellSeeds: CellSeed[] = [
  { gold: "class-policy", candidate: "class-policy", count: 6, errorCases: [] },
  { gold: "class-organization", candidate: "class-organization", count: 4, errorCases: [] },
  {
    gold: "class-policy",
    candidate: "class-control",
    count: 2,
    errorCases: [
      entityErrorCase("eval-error-ent-wrong-1", "WRONG_ENTITY_CLASS", "class-policy", "class-control", "Predicted class-control where gold expected class-policy."),
      entityErrorCase("eval-error-ent-wrong-2", "WRONG_ENTITY_CLASS", "class-policy", "class-control", "Second class-policy span misclassified as class-control."),
    ],
  },
  {
    gold: "class-organization",
    candidate: NONE,
    count: 1,
    errorCases: [entityErrorCase("eval-error-ent-missing-1", "MISSING_ENTITY", "class-organization", null, "Gold class-organization entity was not predicted (false negative).")],
  },
  {
    gold: NONE,
    candidate: "class-control",
    count: 1,
    errorCases: [entityErrorCase("eval-error-ent-extra-1", "EXTRA_ENTITY", null, "class-control", "Predicted a class-control entity with no gold match (false positive).")],
  },
];

// Relation-type axis seeds.
const relationCellSeeds: CellSeed[] = [
  { gold: "relation-owned-by", candidate: "relation-owned-by", count: 5, errorCases: [] },
  {
    gold: "relation-owned-by",
    candidate: "relation-managed-by",
    count: 2,
    errorCases: [
      relationErrorCase("eval-error-rel-wrong-1", "WRONG_RELATION_TYPE", "relation-owned-by", "relation-managed-by", "Predicted relation-managed-by where gold expected relation-owned-by."),
      relationErrorCase("eval-error-rel-dir-1", "WRONG_RELATION_DIRECTION", "relation-owned-by", "relation-managed-by", "Relation direction reversed between candidate and gold."),
    ],
  },
  {
    gold: "relation-owned-by",
    candidate: NONE,
    count: 1,
    errorCases: [relationErrorCase("eval-error-rel-missing-1", "MISSING_RELATION", "relation-owned-by", null, "Gold relation-owned-by relation was not predicted (false negative).")],
  },
  {
    gold: NONE,
    candidate: "relation-managed-by",
    count: 1,
    errorCases: [relationErrorCase("eval-error-rel-extra-1", "EXTRA_RELATION", null, "relation-managed-by", "Predicted a relation-managed-by relation with no gold match (false positive).")],
  },
];

function buildMatrix(axis: ConfusionMatrixAxis, comparisonId: string, runId: string, seeds: CellSeed[]): ConfusionMatrix {
  const labelSet = new Set<string>();
  seeds.forEach((seed) => {
    labelSet.add(seed.gold);
    labelSet.add(seed.candidate);
  });
  // Deterministic order: real labels sorted, __NONE__ always last.
  const labels = [...labelSet].filter((label) => label !== NONE).sort();
  if (labelSet.has(NONE)) {
    labels.push(NONE);
  }

  const cells = seeds.map((seed) => ({
    id: cellId(axis, seed.gold, seed.candidate),
    gold_label: seed.gold,
    candidate_label: seed.candidate,
    is_diagonal: seed.gold === seed.candidate && seed.gold !== NONE,
    count: seed.count,
    contributing_error_case_ref: {
      cell_id: cellId(axis, seed.gold, seed.candidate),
      error_case_count: seed.errorCases.length,
    },
  }));

  const rowTotalsMap = new Map<string, number>();
  const colTotalsMap = new Map<string, number>();
  let diagonal = 0;
  let offDiagonal = 0;
  seeds.forEach((seed) => {
    rowTotalsMap.set(seed.gold, (rowTotalsMap.get(seed.gold) ?? 0) + seed.count);
    colTotalsMap.set(seed.candidate, (colTotalsMap.get(seed.candidate) ?? 0) + seed.count);
    if (seed.gold === seed.candidate && seed.gold !== NONE) {
      diagonal += seed.count;
    } else {
      offDiagonal += seed.count;
    }
  });

  const denom = diagonal + offDiagonal;
  const labelDisplayNames: Record<string, string> = {};
  labels
    .filter((label) => label !== NONE)
    .forEach((label) => {
      labelDisplayNames[label] = label.replace(/^(class|relation)-/, "").replace(/-/g, " ");
    });

  return {
    comparison_id: comparisonId,
    run_id: runId,
    axis,
    labels,
    label_display_names: labelDisplayNames,
    cells,
    totals: {
      row_totals: [...rowTotalsMap.entries()].map(([label, count]) => ({ label, count })),
      col_totals: [...colTotalsMap.entries()].map(([label, count]) => ({ label, count })),
      diagonal_count: diagonal,
      off_diagonal_count: offDiagonal,
      accuracy: denom === 0 ? null : Number((diagonal / denom).toFixed(4)),
      accuracy_status: denom === 0 ? "NOT_APPLICABLE" : "MEASURED",
    },
    generated_at: NOW,
    mutation_guard: { ...guard },
  };
}

const matrixSeedsByAxis: Record<ConfusionMatrixAxis, CellSeed[]> = {
  ENTITY_CLASS: entityCellSeeds,
  RELATION_TYPE: relationCellSeeds,
};

export function buildMockMvp6ConfusionMatrix(
  comparisonId: string,
  runId: string,
  axis: ConfusionMatrixAxis,
): ConfusionMatrix {
  return buildMatrix(axis, comparisonId, runId, matrixSeedsByAxis[axis]);
}

export function findMockMvp6CellErrorCases(axis: ConfusionMatrixAxis, cellIdValue: string): EvaluationErrorCase[] {
  const seed = matrixSeedsByAxis[axis].find((item) => cellId(axis, item.gold, item.candidate) === cellIdValue);
  return seed?.errorCases ?? [];
}

export function findMockMvp6Cell(axis: ConfusionMatrixAxis, cellIdValue: string): CellSeed | undefined {
  return matrixSeedsByAxis[axis].find((item) => cellId(axis, item.gold, item.candidate) === cellIdValue);
}
