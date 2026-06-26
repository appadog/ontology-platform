import { describe, expect, it } from "vitest";
import { apiClient, BenchmarkComparisonError } from "./client";
import {
  MVP6_BENCHMARK_BASELINE_RUN_ID,
  MVP6_BENCHMARK_CANDIDATE_RUN_ID,
  MVP6_BENCHMARK_DELTA_EPSILON,
  MVP6_BENCHMARK_FAILED_RUN_ID,
  MVP6_BENCHMARK_PROJECT_ID,
} from "../mocks/mvp6BenchmarkFixtures";

describe("MVP6.3 Benchmark Comparison mock contract", () => {
  it("builds a comparison from 2+ eligible runs with all-false mutation guard", async () => {
    const comparison = await apiClient.createBenchmarkComparison(MVP6_BENCHMARK_PROJECT_ID, {
      run_ids: [MVP6_BENCHMARK_BASELINE_RUN_ID, MVP6_BENCHMARK_CANDIDATE_RUN_ID, MVP6_BENCHMARK_FAILED_RUN_ID],
      group_by: "MODEL",
      baseline_run_id: MVP6_BENCHMARK_BASELINE_RUN_ID,
    });

    expect(comparison.project_id).toBe(MVP6_BENCHMARK_PROJECT_ID);
    expect(comparison.delta_epsilon).toBe(MVP6_BENCHMARK_DELTA_EPSILON);
    expect(comparison.runs).toHaveLength(2);
    expect(comparison.runs.find((run) => run.is_baseline)?.run_id).toBe(MVP6_BENCHMARK_BASELINE_RUN_ID);
    expect(comparison.mutation_guard).toEqual({
      candidate_graph_mutated: false,
      published_graph_mutated: false,
      evaluation_run_started: false,
      gold_set_mutated: false,
    });
  });

  it("degrades the ineligible FAILED run into excluded_runs[] with a frozen reason", async () => {
    const comparison = await apiClient.createBenchmarkComparison(MVP6_BENCHMARK_PROJECT_ID, {
      run_ids: [MVP6_BENCHMARK_BASELINE_RUN_ID, MVP6_BENCHMARK_CANDIDATE_RUN_ID],
      group_by: "MODEL",
    });
    const excluded = comparison.excluded_runs.find((run) => run.run_id === MVP6_BENCHMARK_FAILED_RUN_ID);
    expect(excluded?.exclusion_reason).toBe("NOT_TERMINAL_SUCCESS");
  });

  it("rejects a comparison with fewer than 2 runs", async () => {
    await expect(
      apiClient.createBenchmarkComparison(MVP6_BENCHMARK_PROJECT_ID, {
        run_ids: [MVP6_BENCHMARK_BASELINE_RUN_ID],
        group_by: "MODEL",
      }),
    ).rejects.toBeInstanceOf(BenchmarkComparisonError);
    await expect(
      apiClient.createBenchmarkComparison(MVP6_BENCHMARK_PROJECT_ID, {
        run_ids: [MVP6_BENCHMARK_BASELINE_RUN_ID],
        group_by: "MODEL",
      }),
    ).rejects.toMatchObject({ code: "BENCHMARK_INSUFFICIENT_RUNS" });
  });

  it("computes signed deltas with delta status and a NOT_COMPARABLE row for NOT_APPLICABLE metrics", async () => {
    const comparison = await apiClient.createBenchmarkComparison(MVP6_BENCHMARK_PROJECT_ID, {
      run_ids: [MVP6_BENCHMARK_BASELINE_RUN_ID, MVP6_BENCHMARK_CANDIDATE_RUN_ID],
      group_by: "MODEL",
    });

    const entityF1 = comparison.metric_rows.find((row) => row.metric_name === "ENTITY_F1");
    const candidateCell = entityF1?.per_run.find((cell) => cell.run_id === MVP6_BENCHMARK_CANDIDATE_RUN_ID);
    expect(candidateCell?.delta_status).toBe("IMPROVED");
    expect(candidateCell?.delta).toBeGreaterThan(MVP6_BENCHMARK_DELTA_EPSILON);

    const relPrecision = comparison.metric_rows.find((row) => row.metric_name === "RELATION_PRECISION");
    expect(relPrecision?.per_run.find((cell) => cell.run_id === MVP6_BENCHMARK_CANDIDATE_RUN_ID)?.delta_status).toBe("REGRESSED");

    const directionRow = comparison.metric_rows.find((row) => row.metric_name === "RELATION_DIRECTION_ACCURACY");
    expect(directionRow?.per_run.find((cell) => cell.run_id === MVP6_BENCHMARK_CANDIDATE_RUN_ID)?.delta_status).toBe("UNCHANGED");

    const evidenceRow = comparison.metric_rows.find((row) => row.metric_name === "EVIDENCE_MATCH_RATE");
    expect(evidenceRow?.row_comparability_flags).toContain("MISSING_METRIC");
    const evidenceCell = evidenceRow?.per_run.find((cell) => cell.run_id === MVP6_BENCHMARK_CANDIDATE_RUN_ID);
    expect(evidenceCell?.delta_status).toBe("NOT_COMPARABLE");
    expect(evidenceCell?.delta).toBeNull();
    expect(evidenceCell?.metric_status).toBe("NOT_APPLICABLE");
  });

  it("surfaces comparability flags at run, set, and metric-row level", async () => {
    const comparison = await apiClient.createBenchmarkComparison(MVP6_BENCHMARK_PROJECT_ID, {
      run_ids: [MVP6_BENCHMARK_BASELINE_RUN_ID, MVP6_BENCHMARK_CANDIDATE_RUN_ID],
      group_by: "MODEL",
    });
    expect(comparison.comparability_summary.flags).toContain("DIFFERENT_DATASET_VERSION");
    const candidateRun = comparison.runs.find((run) => !run.is_baseline);
    expect(candidateRun?.comparability_flags).toContain("DIFFERENT_DATASET_VERSION");
  });

  it("persists the comparison so list and GET-by-id round-trip", async () => {
    const comparison = await apiClient.createBenchmarkComparison(MVP6_BENCHMARK_PROJECT_ID, {
      run_ids: [MVP6_BENCHMARK_BASELINE_RUN_ID, MVP6_BENCHMARK_CANDIDATE_RUN_ID],
      group_by: "PROMPT_VERSION",
    });

    const list = await apiClient.listBenchmarkComparisons(MVP6_BENCHMARK_PROJECT_ID);
    expect(list.items.some((item) => item.id === comparison.id)).toBe(true);

    const fetched = await apiClient.getBenchmarkComparison(comparison.id);
    expect(fetched.id).toBe(comparison.id);
    expect(fetched.group_by).toBe("PROMPT_VERSION");
  });

  it("404s on an unknown comparison id", async () => {
    await expect(apiClient.getBenchmarkComparison("benchmark-comparison-does-not-exist")).rejects.toMatchObject({
      code: "BENCHMARK_COMPARISON_NOT_FOUND",
    });
  });

  it("returns a confusion matrix per run/axis with __NONE__ sentinel and N/A empty accuracy semantics", async () => {
    const comparison = await apiClient.createBenchmarkComparison(MVP6_BENCHMARK_PROJECT_ID, {
      run_ids: [MVP6_BENCHMARK_BASELINE_RUN_ID, MVP6_BENCHMARK_CANDIDATE_RUN_ID],
      group_by: "MODEL",
    });

    const entityMatrix = await apiClient.getBenchmarkConfusionMatrix(comparison.id, MVP6_BENCHMARK_CANDIDATE_RUN_ID, "ENTITY_CLASS");
    expect(entityMatrix.axis).toBe("ENTITY_CLASS");
    expect(entityMatrix.labels).toContain("__NONE__");
    // __NONE__ is never a display-name key.
    expect(entityMatrix.label_display_names?.["__NONE__"]).toBeUndefined();
    expect(entityMatrix.totals.accuracy_status).toBe("MEASURED");
    // diagonal cells expose 0 contributing error cases.
    const diagonal = entityMatrix.cells.find((cell) => cell.is_diagonal);
    expect(diagonal?.contributing_error_case_ref.error_case_count).toBe(0);

    const relationMatrix = await apiClient.getBenchmarkConfusionMatrix(comparison.id, MVP6_BENCHMARK_CANDIDATE_RUN_ID, "RELATION_TYPE");
    expect(relationMatrix.axis).toBe("RELATION_TYPE");
    expect(relationMatrix.mutation_guard.published_graph_mutated).toBe(false);
  });

  it("drills a confusion cell into contributing error cases and returns empty for diagonal cells", async () => {
    const comparison = await apiClient.createBenchmarkComparison(MVP6_BENCHMARK_PROJECT_ID, {
      run_ids: [MVP6_BENCHMARK_BASELINE_RUN_ID, MVP6_BENCHMARK_CANDIDATE_RUN_ID],
      group_by: "MODEL",
    });
    const matrix = await apiClient.getBenchmarkConfusionMatrix(comparison.id, MVP6_BENCHMARK_CANDIDATE_RUN_ID, "ENTITY_CLASS");

    const offDiagonal = matrix.cells.find((cell) => !cell.is_diagonal && cell.contributing_error_case_ref.error_case_count > 0)!;
    const drill = await apiClient.getBenchmarkCellErrorCases(
      comparison.id,
      MVP6_BENCHMARK_CANDIDATE_RUN_ID,
      "ENTITY_CLASS",
      offDiagonal.id,
    );
    expect(drill.error_cases.length).toBe(offDiagonal.contributing_error_case_ref.error_case_count);
    expect(drill.error_cases.length).toBeGreaterThan(0);

    const diagonal = matrix.cells.find((cell) => cell.is_diagonal)!;
    const diagonalDrill = await apiClient.getBenchmarkCellErrorCases(
      comparison.id,
      MVP6_BENCHMARK_CANDIDATE_RUN_ID,
      "ENTITY_CLASS",
      diagonal.id,
    );
    expect(diagonalDrill.error_cases).toHaveLength(0);
  });
});
