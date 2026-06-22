import {
  EvaluationCandidateRef,
  EvaluationDataset,
  EvaluationErrorCase,
  EvaluationErrorType,
  EvaluationMetric,
  EvaluationMetricName,
  EvaluationRun,
  EvaluationRunCreateRequest,
  EvaluationSample,
  GoldEntity,
  GoldEvidenceRef,
  GoldRelation,
} from "../api/types";

export const MVP6_PROJECT_ID = "project-corp-knowledge";
export const MVP6_DATASET_ID = "eval-dataset-mvp6-gold";
export const MVP6_RUN_ID = "eval-run-mvp6-deterministic";

const now = "2026-06-20T06:00:00.000Z";

export const MVP6_METRIC_NAMES: EvaluationMetricName[] = [
  "ENTITY_PRECISION",
  "ENTITY_RECALL",
  "ENTITY_F1",
  "RELATION_PRECISION",
  "RELATION_RECALL",
  "RELATION_F1",
  "RELATION_DIRECTION_ACCURACY",
  "EVIDENCE_MATCH_RATE",
];

export const MVP6_ERROR_TYPES: EvaluationErrorType[] = [
  "MISSING_ENTITY",
  "EXTRA_ENTITY",
  "WRONG_ENTITY_CLASS",
  "MISSING_RELATION",
  "EXTRA_RELATION",
  "WRONG_RELATION_TYPE",
  "WRONG_RELATION_DIRECTION",
  "EVIDENCE_MISMATCH",
];

const baseEvidence: GoldEvidenceRef = {
  sample_id: "eval-sample-mvp6-policy",
  source_id: "source-security-policy",
  source_segment_id: "segment-security-policy-001",
  locator: "security-policy.csv row 12",
  offset_start: 0,
  offset_end: 92,
  quote: "The Information Security Policy is owned by the Security Office.",
};

export const mockMvp6Datasets: EvaluationDataset[] = [
  {
    id: "eval-dataset-mvp6-draft",
    project_id: MVP6_PROJECT_ID,
    name: "Draft benchmark candidates",
    description: "A draft set for adding new deterministic benchmark samples.",
    status: "DRAFT",
    sample_count: 0,
    gold_entity_count: 0,
    gold_relation_count: 0,
    owner_id: "qa-owner",
    active_version_id: null,
    created_at: "2026-06-20T05:00:00.000Z",
    updated_at: now,
    notes: "Draft only; no benchmark run yet.",
  },
  {
    id: MVP6_DATASET_ID,
    project_id: MVP6_PROJECT_ID,
    name: "Security policy benchmark gold set",
    description: "MVP6.1 deterministic gold set for entity, relation, direction, and evidence scoring.",
    status: "ACTIVE",
    sample_count: 1,
    gold_entity_count: 2,
    gold_relation_count: 1,
    owner_id: "qa-owner",
    active_version_id: "eval-version-active-v1",
    created_at: "2026-06-20T04:00:00.000Z",
    updated_at: now,
    notes: "Evaluation artifacts only; this set does not mutate candidates or published graph facts.",
  },
  {
    id: "eval-dataset-mvp6-archived",
    project_id: MVP6_PROJECT_ID,
    name: "Archived MVP6 baseline",
    description: "Archived benchmark retained for regression comparison.",
    status: "ARCHIVED",
    sample_count: 1,
    gold_entity_count: 1,
    gold_relation_count: 0,
    owner_id: "qa-owner",
    active_version_id: "eval-version-archived-v1",
    created_at: "2026-06-18T04:00:00.000Z",
    updated_at: "2026-06-18T06:00:00.000Z",
    notes: "Read-only archived benchmark.",
  },
];

export const mockMvp6Samples: EvaluationSample[] = [
  {
    id: "eval-sample-mvp6-policy",
    project_id: MVP6_PROJECT_ID,
    dataset_id: MVP6_DATASET_ID,
    sample_kind: "SOURCE_SEGMENT",
    source_id: "source-security-policy",
    source_segment_id: "segment-security-policy-001",
    source_locator: "security-policy.csv row 12",
    title: "Security policy owner row",
    content_text: "The Information Security Policy is owned by the Security Office. It applies to internal systems.",
    metadata: {
      domain: "security",
      source_type: "CSV",
      evaluation_fixture: "mvp6.1",
    },
    created_at: now,
  },
];

export const mockMvp6GoldEntities: GoldEntity[] = [
  {
    id: "gold-entity-policy",
    project_id: MVP6_PROJECT_ID,
    dataset_id: MVP6_DATASET_ID,
    sample_id: "eval-sample-mvp6-policy",
    ontology_class_id: "class-policy",
    label: "Information Security Policy",
    normalized_value: "information security policy",
    evidence: baseEvidence,
    created_at: now,
  },
  {
    id: "gold-entity-security-office",
    project_id: MVP6_PROJECT_ID,
    dataset_id: MVP6_DATASET_ID,
    sample_id: "eval-sample-mvp6-policy",
    ontology_class_id: "class-organization",
    label: "Security Office",
    normalized_value: "security office",
    evidence: {
      ...baseEvidence,
      offset_start: 52,
      offset_end: 67,
      quote: "Security Office",
    },
    created_at: now,
  },
];

export const mockMvp6GoldRelations: GoldRelation[] = [
  {
    id: "gold-relation-policy-owner",
    project_id: MVP6_PROJECT_ID,
    dataset_id: MVP6_DATASET_ID,
    sample_id: "eval-sample-mvp6-policy",
    ontology_relation_id: "relation-owned-by",
    source_gold_entity_id: "gold-entity-policy",
    target_gold_entity_id: "gold-entity-security-office",
    evidence: baseEvidence,
    created_at: now,
  },
];

export function buildMockMvp6EvaluationRun(
  projectId: string,
  payload: EvaluationRunCreateRequest,
  runId = MVP6_RUN_ID,
): EvaluationRun {
  return {
    id: runId,
    project_id: projectId,
    dataset_id: payload.dataset_id,
    dataset_version_id: "eval-version-active-v1",
    status: "SUCCEEDED",
    run_mode: payload.run_mode,
    ontology_version_id: payload.ontology_version_id,
    prompt_version_id: payload.prompt_version_id,
    model_name: payload.model_name,
    model_run_id: payload.model_run_id ?? `${runId}-model-run`,
    parser_version: payload.parser_version,
    started_at: "2026-06-20T06:05:00.000Z",
    completed_at: "2026-06-20T06:05:02.000Z",
    ended_at: "2026-06-20T06:05:02.000Z",
    requested_by: "qa-owner",
    metric_summary: {
      ENTITY_PRECISION: 0.67,
      ENTITY_RECALL: 0.67,
      ENTITY_F1: 0.67,
      RELATION_PRECISION: 0.5,
      RELATION_RECALL: 0.5,
      RELATION_F1: 0.5,
      RELATION_DIRECTION_ACCURACY: 0.5,
      EVIDENCE_MATCH_RATE: null,
    },
    metrics: {
      correction_pattern_counts: {
        missing_entity: 1,
        extra_entity: 1,
        relation_direction: 1,
        evidence_mismatch: 1,
      },
    },
    dimensions: {
      prompt_version_id: payload.prompt_version_id,
      model_run_id: payload.model_run_id ?? `${runId}-model-run`,
      relation_type: "relation-owned-by",
      class_type: "class-policy",
      correction_pattern: "deterministic_mock_errors",
    },
    error_code: null,
    error_message: null,
  };
}

export const mockMvp6EvaluationRuns: EvaluationRun[] = [
  buildMockMvp6EvaluationRun(MVP6_PROJECT_ID, {
    dataset_id: MVP6_DATASET_ID,
    run_mode: "DETERMINISTIC_MOCK",
    ontology_version_id: "onto-v6-eval",
    prompt_version_id: "prompt-v6-eval",
    model_name: "deterministic-mock",
    model_run_id: "model-run-mvp6-deterministic",
    parser_version: "parser-v6.1",
  }),
  {
    ...buildMockMvp6EvaluationRun(
      MVP6_PROJECT_ID,
      {
        dataset_id: MVP6_DATASET_ID,
        run_mode: "DETERMINISTIC_MOCK",
        ontology_version_id: "onto-v6-eval",
        prompt_version_id: "prompt-v6-eval-failed",
        model_name: "deterministic-mock",
        model_run_id: "model-run-mvp6-failed",
        parser_version: "parser-v6.1",
      },
      "eval-run-mvp6-failed",
    ),
    status: "FAILED",
    completed_at: now,
    ended_at: now,
    error_code: "DETERMINISTIC_FIXTURE_BLOCKED",
    error_message: "The fixture intentionally exposes the failed run state.",
  },
];

export const mockMvp6Metrics: EvaluationMetric[] = [
  {
    run_id: MVP6_RUN_ID,
    metric_name: "ENTITY_PRECISION",
    value: 0.67,
    numerator: 2,
    denominator: 3,
    formula: "entity true positives / predicted entities",
    status: "MEASURED",
    computed_at: now,
  },
  {
    run_id: MVP6_RUN_ID,
    metric_name: "ENTITY_RECALL",
    value: 0.67,
    numerator: 2,
    denominator: 3,
    formula: "entity true positives / gold entities",
    status: "MEASURED",
    computed_at: now,
  },
  {
    run_id: MVP6_RUN_ID,
    metric_name: "ENTITY_F1",
    value: 0.67,
    numerator: 4,
    denominator: 6,
    formula: "2 * precision * recall / (precision + recall)",
    status: "MEASURED",
    computed_at: now,
  },
  {
    run_id: MVP6_RUN_ID,
    metric_name: "RELATION_PRECISION",
    value: 0.5,
    numerator: 1,
    denominator: 2,
    formula: "relation true positives / predicted relations",
    status: "MEASURED",
    computed_at: now,
  },
  {
    run_id: MVP6_RUN_ID,
    metric_name: "RELATION_RECALL",
    value: 0.5,
    numerator: 1,
    denominator: 2,
    formula: "relation true positives / gold relations",
    status: "MEASURED",
    computed_at: now,
  },
  {
    run_id: MVP6_RUN_ID,
    metric_name: "RELATION_F1",
    value: 0.5,
    numerator: 2,
    denominator: 4,
    formula: "2 * precision * recall / (precision + recall)",
    status: "MEASURED",
    computed_at: now,
  },
  {
    run_id: MVP6_RUN_ID,
    metric_name: "RELATION_DIRECTION_ACCURACY",
    value: 0.5,
    numerator: 1,
    denominator: 2,
    formula: "correctly directed matched relation pairs / matched relation pairs",
    status: "MEASURED",
    computed_at: now,
  },
  {
    run_id: MVP6_RUN_ID,
    metric_name: "EVIDENCE_MATCH_RATE",
    value: null,
    numerator: 0,
    denominator: 0,
    formula: "candidate evidence overlaps gold evidence in the same sample",
    status: "NOT_APPLICABLE",
    computed_at: now,
  },
];

function errorCase(errorType: EvaluationErrorType, index: number): EvaluationErrorCase {
  const isRelation = errorType.includes("RELATION") || errorType === "WRONG_RELATION_DIRECTION";
  const goldEntity = mockMvp6GoldEntities[index % mockMvp6GoldEntities.length];
  const goldRelation = mockMvp6GoldRelations[0];
  const hasCandidate = !errorType.startsWith("MISSING");
  const candidateEvidence =
    hasCandidate && index % 3 === 0
      ? null
      : {
          ...baseEvidence,
          locator: index % 2 === 0 ? baseEvidence.locator : "security-policy.csv row 18",
          quote: index % 2 === 0 ? baseEvidence.quote : "Security Office applies the policy.",
        };
  const candidateRef: EvaluationCandidateRef | null = !hasCandidate
    ? null
    : isRelation
      ? {
          candidate_kind: "RELATION",
          candidate_id: `candidate-${errorType.toLowerCase()}`,
          sample_id: "eval-sample-mvp6-policy",
          ontology_relation_id: errorType === "WRONG_RELATION_TYPE" ? "relation-managed-by" : goldRelation.ontology_relation_id,
          source_gold_entity_id:
            errorType === "WRONG_RELATION_DIRECTION" ? goldRelation.target_gold_entity_id : goldRelation.source_gold_entity_id,
          target_gold_entity_id:
            errorType === "WRONG_RELATION_DIRECTION" ? goldRelation.source_gold_entity_id : goldRelation.target_gold_entity_id,
          evidence: candidateEvidence,
        }
      : {
          candidate_kind: "ENTITY",
          candidate_id: `candidate-${errorType.toLowerCase()}`,
          sample_id: "eval-sample-mvp6-policy",
          ontology_class_id: errorType === "WRONG_ENTITY_CLASS" ? "class-control" : goldEntity.ontology_class_id,
          label: errorType === "EXTRA_ENTITY" ? "Extra Security Control" : goldEntity.label,
          normalized_value: errorType === "EXTRA_ENTITY" ? "extra security control" : goldEntity.normalized_value,
          evidence: candidateEvidence,
        };

  return {
    id: `eval-error-${errorType.toLowerCase()}`,
    run_id: MVP6_RUN_ID,
    project_id: MVP6_PROJECT_ID,
    dataset_id: MVP6_DATASET_ID,
    sample_id: "eval-sample-mvp6-policy",
    error_type: errorType,
    gold_entity_id: isRelation ? null : goldEntity.id,
    gold_relation_id: isRelation ? goldRelation.id : null,
    candidate_ref: candidateRef,
    comparison_summary: `${errorType} detected between deterministic candidate output and gold set evidence.`,
    gold_evidence: baseEvidence,
    candidate_evidence: candidateEvidence,
    created_at: now,
  };
}

export const mockMvp6ErrorCases: EvaluationErrorCase[] = MVP6_ERROR_TYPES.map(errorCase);
