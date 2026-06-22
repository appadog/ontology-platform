import { describe, expect, it } from "vitest";
import { apiClient } from "./client";
import {
  MVP6_ERROR_TYPES,
  MVP6_METRIC_NAMES,
  MVP6_PROJECT_ID,
} from "../mocks/mvp6Fixtures";

describe("MVP6.1 mock contract", () => {
  it("covers the deterministic Gold Set to Benchmark Studio happy path", async () => {
    const datasets = await apiClient.listEvaluationDatasets(MVP6_PROJECT_ID);
    const activeDataset = datasets.find((dataset) => dataset.status === "ACTIVE");

    expect(activeDataset).toMatchObject({
      project_id: MVP6_PROJECT_ID,
      sample_count: expect.any(Number),
      gold_entity_count: expect.any(Number),
      gold_relation_count: expect.any(Number),
    });
    expect(activeDataset?.sample_count).toBeGreaterThan(0);
    expect(activeDataset?.gold_entity_count).toBeGreaterThan(0);
    expect(activeDataset?.gold_relation_count).toBeGreaterThan(0);

    const dataset = await apiClient.getEvaluationDataset(activeDataset?.id ?? "");
    const samples = await apiClient.listEvaluationSamples(dataset.id);
    const goldEntities = await apiClient.listGoldEntities(dataset.id);
    const goldRelations = await apiClient.listGoldRelations(dataset.id);

    expect(samples[0]).toMatchObject({
      project_id: MVP6_PROJECT_ID,
      dataset_id: dataset.id,
      sample_kind: expect.stringMatching(/SOURCE_SEGMENT|MANUAL_TEXT|TABLE_ROW/),
      content_text: expect.any(String),
    });
    expect(goldEntities[0].evidence).toMatchObject({
      sample_id: samples[0].id,
      quote: expect.any(String),
    });
    expect(goldRelations[0]).toMatchObject({
      source_gold_entity_id: goldEntities[0].id,
      target_gold_entity_id: goldEntities[1].id,
      evidence: {
        sample_id: samples[0].id,
        quote: expect.any(String),
      },
    });

    const run = await apiClient.createEvaluationRun(MVP6_PROJECT_ID, {
      dataset_id: dataset.id,
      run_mode: "DETERMINISTIC_MOCK",
      ontology_version_id: "onto-v6-eval",
      prompt_version_id: "prompt-v6-eval",
      model_name: "deterministic-mock",
      parser_version: "parser-v6.1",
    });

    expect(run).toMatchObject({
      project_id: MVP6_PROJECT_ID,
      dataset_id: dataset.id,
      run_mode: "DETERMINISTIC_MOCK",
      status: "SUCCEEDED",
      ontology_version_id: "onto-v6-eval",
      prompt_version_id: "prompt-v6-eval",
      model_name: "deterministic-mock",
      model_run_id: expect.stringContaining("model-run"),
      parser_version: "parser-v6.1",
    });

    const metrics = await apiClient.listEvaluationMetrics(run.id);
    expect(metrics.map((metric) => metric.metric_name)).toEqual(MVP6_METRIC_NAMES);
    expect(metrics.every((metric) => metric.formula && metric.numerator >= 0 && metric.denominator >= 0)).toBe(true);
    expect(metrics.some((metric) => metric.status === "NOT_APPLICABLE" && metric.value === null && metric.denominator === 0)).toBe(true);

    const errors = await apiClient.listEvaluationErrorCases(run.id);
    expect(errors.map((error) => error.error_type)).toEqual(expect.arrayContaining(MVP6_ERROR_TYPES));
    const entityCandidateError = errors.find((error) => error.candidate_ref?.candidate_kind === "ENTITY");
    const relationCandidateError = errors.find((error) => error.candidate_ref?.candidate_kind === "RELATION");
    const nullableCandidateEvidenceError = errors.find((error) => error.candidate_ref?.evidence === null && error.candidate_evidence === null);

    expect(entityCandidateError).toMatchObject({
      sample_id: samples[0].id,
      comparison_summary: expect.any(String),
      candidate_ref: expect.objectContaining({
        candidate_kind: "ENTITY",
        candidate_id: expect.any(String),
        sample_id: samples[0].id,
        ontology_class_id: expect.any(String),
        label: expect.any(String),
        normalized_value: expect.any(String),
        evidence: expect.objectContaining({
          sample_id: samples[0].id,
        }),
      }),
      candidate_evidence: expect.objectContaining({
        quote: expect.any(String),
      }),
    });
    expect(relationCandidateError).toMatchObject({
      sample_id: samples[0].id,
      candidate_ref: expect.objectContaining({
        candidate_kind: "RELATION",
        candidate_id: expect.any(String),
        sample_id: samples[0].id,
        ontology_relation_id: expect.any(String),
        source_gold_entity_id: expect.any(String),
        target_gold_entity_id: expect.any(String),
      }),
    });
    expect(nullableCandidateEvidenceError).toBeDefined();

    const errorDetail = await apiClient.getEvaluationErrorCase(errors[0].id);
    expect(errorDetail.id).toBe(errors[0].id);
  });
});
