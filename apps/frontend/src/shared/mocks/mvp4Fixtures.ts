import {
  EvaluationDataset,
  EvaluationDatasetVersion,
  EvaluationRun,
  ExternalApiDocsSurface,
  GoldenSetItemKind,
  GoldenSetItem,
  GraphExploreResponse,
  GraphExploreState,
  PromptExperiment,
  PromptPerformanceSummary,
  QualityMetric,
  QualityMetricGroup,
  QualityMetricsResponse,
  RagAnswerResponse,
  RagAnswerState,
  SearchResponse,
  SearchResultKind,
  SimilarEvidenceResponse,
  VectorAdapterState,
  VectorAdapterStatus,
} from "../api/types";

export const MVP4_PROJECT_ID = "project-corp-knowledge";

export const QUALITY_METRIC_GROUPS: QualityMetricGroup[] = [
  "COMPLETENESS",
  "CONSISTENCY",
  "TRACEABILITY",
  "VALIDATION",
  "REVIEW",
  "DUPLICATE",
  "RELATION_DENSITY",
];

export const SEARCH_RESULT_KINDS: SearchResultKind[] = [
  "PUBLISHED_ENTITY",
  "PUBLISHED_RELATION",
  "SOURCE",
  "SOURCE_CHUNK",
  "EVIDENCE",
  "LINEAGE",
];

export const VECTOR_ADAPTER_STATUSES: VectorAdapterStatus[] = [
  "AVAILABLE",
  "FALLBACK_KEYWORD",
  "UNAVAILABLE",
  "NOT_CONFIGURED",
];

export const GRAPH_EXPLORE_STATES: GraphExploreState[] = ["READY", "SAFE_TOO_LARGE", "EMPTY", "ERROR"];

const now = "2026-06-19T06:00:00.000Z";
const publishedGraphVersionRef = {
  published_graph_version_id: "published-graph-v3",
  published_graph_version: 3,
  ontology_version_id: "onto-v3-published",
  is_current: true,
  created_at: "2026-06-18T09:30:00.000Z",
};
const historicalGraphVersionRef = {
  ...publishedGraphVersionRef,
  published_graph_version_id: "published-graph-v2",
  published_graph_version: 2,
  is_current: false,
  created_at: "2026-06-14T09:30:00.000Z",
};
const sourceRef = {
  source_id: "source-security-policy",
  source_segment_id: "segment-security-policy-001",
  locator: "policy.csv row 12",
  label: "Security policy source",
};
const evidenceRef = {
  evidence_id: "evidence-policy-owner",
  source_id: sourceRef.source_id,
  source_display_name: "security-policy.csv",
  locator: sourceRef.locator,
};
const policyFactRef = {
  fact_type: "ENTITY" as const,
  fact_id: "published-entity-policy",
  published_graph_version_id: publishedGraphVersionRef.published_graph_version_id,
  label: "Information Security Policy",
};
const ownerFactRef = {
  fact_type: "RELATION" as const,
  fact_id: "published-relation-policy-owner",
  published_graph_version_id: publishedGraphVersionRef.published_graph_version_id,
  label: "owned by Security Office",
};

const qualityGroupContext: Record<
  QualityMetricGroup,
  {
    numerator: string;
    denominator: string;
    scope: string;
    breakdown_dimension: string;
    drilldown_target: string;
    drilldown_label: string;
  }
> = {
  COMPLETENESS: {
    numerator: "18 seeded facts with required property and evidence coverage",
    denominator: "24 seeded facts subject to completeness rules",
    scope: "selected project and selected published graph version",
    breakdown_dimension: "class_type",
    drilldown_target: "quality_metric_detail",
    drilldown_label: "Inspect incomplete facts",
  },
  CONSISTENCY: {
    numerator: "21 seeded facts passing ontology constraint checks",
    denominator: "24 seeded facts checked by the same rule set",
    scope: "published graph plus reviewed candidate lineage",
    breakdown_dimension: "constraint_type",
    drilldown_target: "review_inbox",
    drilldown_label: "Inspect consistency failures",
  },
  TRACEABILITY: {
    numerator: "22 published facts with source, evidence, review, and publish lineage",
    denominator: "24 published facts in selected graph version",
    scope: "selected project and selected published graph version",
    breakdown_dimension: "source_id",
    drilldown_target: "evidence",
    drilldown_label: "Inspect missing traceability",
  },
  VALIDATION: {
    numerator: "20 validation outcomes counted as pass-equivalent",
    denominator: "24 validation outcomes in formula scope",
    scope: "formula-declared validation population",
    breakdown_dimension: "validation_outcome",
    drilldown_target: "evaluation_runs",
    drilldown_label: "Inspect validation outcomes",
  },
  REVIEW: {
    numerator: "16 approve or modify-and-approve review decisions",
    denominator: "20 non-pending reviewed decisions",
    scope: "reviewed candidate lineage relevant to published facts",
    breakdown_dimension: "review_decision",
    drilldown_target: "review_inbox",
    drilldown_label: "Inspect review decisions",
  },
  DUPLICATE: {
    numerator: "3 deterministic duplicate indicators",
    denominator: "24 comparable facts and candidates in duplicate scope",
    scope: "formula-declared duplicate population",
    breakdown_dimension: "duplicate_bucket",
    drilldown_target: "search",
    drilldown_label: "Inspect duplicate buckets",
  },
  RELATION_DENSITY: {
    numerator: "7 published relations in selected version",
    denominator: "10 published entities in the same selected version",
    scope: "selected project and selected published graph version",
    breakdown_dimension: "domain_class",
    drilldown_target: "published_graph",
    drilldown_label: "Inspect relation density graph",
  },
};

function metric(group: QualityMetricGroup, index: number, label: string, rate: number | null, value: number | null): QualityMetric {
  const metricId = `${group.toLowerCase()}-${index}`;
  const context = qualityGroupContext[group];

  return {
    metric_id: metricId,
    group,
    label,
    description: `${label} for the selected published graph version.`,
    unit: rate === null ? "COUNT" : "RATE",
    value,
    rate,
    trend: index % 2 === 0 ? 0.03 : null,
    formula: {
      formula_id: `${metricId}-formula`,
      numerator: context.numerator,
      denominator: context.denominator,
      scope: context.scope,
      time_window: "current snapshot",
      breakdown_dimension: context.breakdown_dimension,
      drilldown_target: context.drilldown_target,
      description: "Deterministic MVP4 formula metadata for visible recomputation context.",
      unit: rate === null ? "COUNT" : "RATE",
      notes: "MVP4 P0 reports each metric group separately and leaves authoritative recomputation to Backend proof.",
    },
    drilldown: {
      target: context.drilldown_target,
      label: context.drilldown_label,
      query: { metric_id: metricId, published_graph_version_id: publishedGraphVersionRef.published_graph_version_id },
    },
    evidence_refs: [evidenceRef],
    published_graph_version_ref: index === 1 ? historicalGraphVersionRef : publishedGraphVersionRef,
    breakdowns: [
      {
        dimension: context.breakdown_dimension,
        key: "policy",
        label: "Policy facts",
        value: value ?? Math.round((rate ?? 0) * 10),
        rate,
        drilldown: {
          target: context.drilldown_target,
          label: context.drilldown_label,
          query: { metric_id: metricId, published_graph_version_id: publishedGraphVersionRef.published_graph_version_id },
        },
      },
    ],
  };
}

export const mockMvp4QualityMetrics: QualityMetricsResponse = {
  project_id: MVP4_PROJECT_ID,
  published_graph_version_ref: publishedGraphVersionRef,
  generated_at: now,
  filters: {
    published_graph_version_id: publishedGraphVersionRef.published_graph_version_id,
  },
  metric_groups: QUALITY_METRIC_GROUPS.map((group, index) => ({
    group,
    label: group
      .toLowerCase()
      .split("_")
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(" "),
    description: `${group} metrics are shown as explainable facts with formula metadata.`,
    metrics: [
      metric(group, 0, `${group} rate`, 0.72 + index * 0.02, null),
      metric(group, 1, `${group} exceptions`, null, index === 0 ? 0 : index + 1),
    ],
  })),
};

export const mockMvp4Datasets: EvaluationDataset[] = [
  {
    id: "eval-dataset-draft",
    project_id: MVP4_PROJECT_ID,
    name: "Policy review draft set",
    description: "Draft golden examples for policy and ownership facts.",
    status: "DRAFT",
    owner_id: "qa-owner",
    active_version_id: null,
    created_at: "2026-06-17T02:00:00.000Z",
    updated_at: now,
    notes: "Editable draft.",
  },
  {
    id: "eval-dataset-active",
    project_id: MVP4_PROJECT_ID,
    name: "Security policy golden set",
    description: "Active deterministic set for MVP4 smoke.",
    status: "ACTIVE",
    owner_id: "qa-owner",
    active_version_id: "eval-version-active-v1",
    created_at: "2026-06-16T02:00:00.000Z",
    updated_at: now,
    notes: "Used by completed evaluation runs; treat version as read-only.",
  },
  {
    id: "eval-dataset-archived",
    project_id: MVP4_PROJECT_ID,
    name: "Archived extraction baseline",
    description: "Archived sample retained for regression comparison.",
    status: "ARCHIVED",
    owner_id: "qa-owner",
    active_version_id: "eval-version-archived-v1",
    created_at: "2026-06-12T02:00:00.000Z",
    updated_at: "2026-06-13T02:00:00.000Z",
    notes: "Read-only.",
  },
];

export const mockMvp4DatasetVersions: EvaluationDatasetVersion[] = [
  {
    id: "eval-version-active-v1",
    dataset_id: "eval-dataset-active",
    project_id: MVP4_PROJECT_ID,
    version: 1,
    status: "ACTIVE",
    source_refs: [sourceRef],
    source_segment_refs: [sourceRef],
    candidate_refs: [{ candidate_kind: "ENTITY", candidate_id: "candidate-entity-policy" }],
    evidence_refs: [evidenceRef],
    golden_item_count: 4,
    created_by: "qa-owner",
    created_at: "2026-06-16T03:00:00.000Z",
    notes: "Locked by completed run eval-run-success.",
  },
  {
    id: "eval-version-draft-v1",
    dataset_id: "eval-dataset-draft",
    project_id: MVP4_PROJECT_ID,
    version: 1,
    status: "DRAFT",
    source_refs: [sourceRef],
    source_segment_refs: [],
    candidate_refs: [],
    evidence_refs: [],
    golden_item_count: 0,
    created_by: "qa-owner",
    created_at: now,
    notes: "Provenance missing warning state fixture.",
  },
  {
    id: "eval-version-archived-v1",
    dataset_id: "eval-dataset-archived",
    project_id: MVP4_PROJECT_ID,
    version: 1,
    status: "ARCHIVED",
    source_refs: [sourceRef],
    source_segment_refs: [sourceRef],
    candidate_refs: [],
    evidence_refs: [evidenceRef],
    golden_item_count: 1,
    created_by: "qa-owner",
    created_at: "2026-06-12T03:00:00.000Z",
    notes: "Archived version.",
  },
];

const goldenItemKinds: GoldenSetItemKind[] = ["ENTITY", "RELATION", "PROPERTY_VALUE", "EVIDENCE_LINK"];

export const mockMvp4GoldenItems: GoldenSetItem[] = goldenItemKinds.map(
  (kind, index) => ({
    id: `golden-${kind.toLowerCase()}`,
    dataset_version_id: "eval-version-active-v1",
    project_id: MVP4_PROJECT_ID,
    kind,
    expected_payload: {
      label: index === 1 ? "owned by Security Office" : "Information Security Policy",
      field: kind,
      expected: true,
    },
    source_refs: [sourceRef],
    evidence_refs: [evidenceRef],
    review_decision_ref: {
      review_decision_id: "review-decision-policy",
      review_decision_type: "APPROVE",
      reviewer_id: "expert-1",
      reviewed_at: "2026-06-18T07:20:00.000Z",
    },
    published_graph_version_ref: publishedGraphVersionRef,
    reviewer_id: "expert-1",
    created_at: now,
    notes: "Provenance-backed golden item.",
  }),
);

export const mockMvp4PromptPerformance: PromptPerformanceSummary = {
  project_id: MVP4_PROJECT_ID,
  generated_at: now,
  comparison_dimensions: [
    "prompt_version_id",
    "model_run_id",
    "source_type",
    "class_type",
    "relation_type",
    "validation_outcome",
    "review_decision",
    "correction_pattern",
  ],
  rows: [
    {
      dimensions: {
        prompt_version_id: "prompt-v3",
        model_run_id: "model-run-gpt-4.1-mini",
        source_type: "CSV",
        class_type: "Policy",
        relation_type: "OWNER",
        validation_outcome: "PASSED",
        review_decision: "APPROVE",
        correction_pattern: "none",
      },
      approval_rate: 0.82,
      rejection_rate: 0.05,
      modification_rate: 0.09,
      failed_validation_rate: 0.04,
      missing_evidence_rate: 0.03,
      latency_ms: null,
      token_count: null,
      cost: null,
    },
    {
      dimensions: {
        prompt_version_id: "prompt-v4-treatment",
        model_run_id: "model-run-local-fallback",
        source_type: "TXT",
        class_type: "Control",
        relation_type: "APPLIES_TO",
        validation_outcome: "WARNING",
        review_decision: "MODIFY_AND_APPROVE",
        correction_pattern: "relation_endpoint",
      },
      approval_rate: 0.7,
      rejection_rate: 0.08,
      modification_rate: 0.16,
      failed_validation_rate: 0.06,
      missing_evidence_rate: 0.12,
      latency_ms: 920,
      token_count: 1800,
      cost: 0.12,
    },
  ],
};

export const mockMvp4PromptExperiments: PromptExperiment[] = [
  {
    id: "prompt-experiment-running",
    project_id: MVP4_PROJECT_ID,
    name: "Policy owner extraction wording",
    hypothesis: "Treatment prompt reduces relation endpoint corrections.",
    status: "RUNNING",
    dataset_id: "eval-dataset-active",
    dataset_version_id: "eval-version-active-v1",
    control_prompt_version_id: "prompt-v3",
    treatment_prompt_version_id: "prompt-v4-treatment",
    model_provider: "mock",
    model_name: "deterministic-local",
    run_window: { started_at: now, ended_at: null },
    created_by: "qa-owner",
    created_at: now,
    updated_at: now,
    notes: "Running state fixture.",
  },
  {
    id: "prompt-experiment-completed",
    project_id: MVP4_PROJECT_ID,
    name: "Evidence locator prompt comparison",
    hypothesis: "Treatment prompt increases traceable answers.",
    status: "COMPLETED",
    dataset_id: "eval-dataset-active",
    dataset_version_id: "eval-version-active-v1",
    control_prompt_version_id: "prompt-v2",
    treatment_prompt_version_id: "prompt-v3",
    model_provider: "mock",
    model_name: "deterministic-local",
    run_window: { started_at: "2026-06-18T05:00:00.000Z", ended_at: "2026-06-18T06:00:00.000Z" },
    created_by: "qa-owner",
    created_at: "2026-06-18T04:30:00.000Z",
    updated_at: "2026-06-18T06:00:00.000Z",
    notes: "Completed comparison fixture.",
  },
];

export const mockMvp4EvaluationRuns: EvaluationRun[] = [
  {
    id: "eval-run-success",
    project_id: MVP4_PROJECT_ID,
    dataset_version_id: "eval-version-active-v1",
    experiment_id: "prompt-experiment-completed",
    prompt_version_id: "prompt-v3",
    model_run_id: "model-run-gpt-4.1-mini",
    model_provider: "mock",
    model_name: "deterministic-local",
    status: "SUCCESS",
    started_at: "2026-06-18T05:10:00.000Z",
    ended_at: "2026-06-18T05:40:00.000Z",
    requested_by: "qa-owner",
    metrics: {
      approval_rate: 0.82,
      rejection_rate: 0.05,
      modification_rate: 0.09,
      failed_validation_rate: 0.04,
      missing_evidence_rate: 0.03,
      correction_pattern_counts: { none: 21, relation_endpoint: 3, evidence_locator: 2 },
    },
    dimensions: { prompt_version_id: "prompt-v3", model_run_id: "model-run-gpt-4.1-mini" },
    error_code: null,
    error_message: null,
  },
  {
    id: "eval-run-failed",
    project_id: MVP4_PROJECT_ID,
    dataset_version_id: "eval-version-active-v1",
    experiment_id: "prompt-experiment-running",
    prompt_version_id: "prompt-v4-treatment",
    model_run_id: "model-run-local-fallback",
    model_provider: "mock",
    model_name: "deterministic-local",
    status: "FAILED",
    started_at: now,
    ended_at: now,
    requested_by: "qa-owner",
    metrics: { correction_pattern_counts: {} },
    dimensions: { prompt_version_id: "prompt-v4-treatment", model_run_id: "model-run-local-fallback" },
    error_code: "EVAL_FIXTURE_TIMEOUT",
    error_message: "The deterministic evaluation fixture timed out before scoring.",
  },
];

function searchGroup(kind: SearchResultKind) {
  return {
    kind,
    total_count: 1,
    items: [
      {
        id: `${kind.toLowerCase()}-policy`,
        kind,
        title: kind === "PUBLISHED_RELATION" ? "Policy owned by Security Office" : "Information Security Policy",
        snippet: "The information security policy is owned by the Security Office and backed by reviewed evidence.",
        score: 0.92,
        published_graph_version_ref: publishedGraphVersionRef,
        source_ref: sourceRef,
        evidence_refs: [evidenceRef],
        lineage_ref: kind === "LINEAGE" ? policyFactRef : undefined,
        metadata: { fixture: "mvp4-positive" },
      },
    ],
  };
}

export function buildMockSearchResponse(projectId: string, query = "", indexState?: "READY" | "PARTIAL" | "STALE"): SearchResponse {
  const normalizedQuery = query.trim().toLowerCase();
  const state = indexState ?? (normalizedQuery.includes("stale") ? "STALE" : normalizedQuery.includes("partial") ? "PARTIAL" : "READY");
  const noResults = normalizedQuery.includes("no-results") || normalizedQuery.includes("zz-empty");
  const groups = noResults || !normalizedQuery ? [] : SEARCH_RESULT_KINDS.map(searchGroup);

  return {
    project_id: projectId,
    query,
    published_graph_version_ref: state === "STALE" ? historicalGraphVersionRef : publishedGraphVersionRef,
    groups,
    total_count: groups.reduce((sum, group) => sum + group.total_count, 0),
    limit: 20,
    offset: 0,
    index_state: state,
  };
}

export const mockMvp4VectorStatus: VectorAdapterState = {
  project_id: MVP4_PROJECT_ID,
  status: "FALLBACK_KEYWORD",
  embedding_target: "published evidence chunks",
  index_name: null,
  indexed_chunk_count: 0,
  last_indexed_at: null,
  fallback_reason: "VECTOR_DB_NOT_CONFIGURED",
  message: "Local MVP4 fixture is using keyword fallback instead of a production vector index.",
};

export const mockMvp4SimilarEvidence: SimilarEvidenceResponse = {
  project_id: MVP4_PROJECT_ID,
  adapter_state: mockMvp4VectorStatus,
  fallback_used: true,
  items: [
    {
      evidence_ref: evidenceRef,
      source_ref: sourceRef,
      snippet: "Security Office owns the policy according to reviewed source evidence.",
      similarity_score: 0.62,
      match_reason: "Keyword fallback matched policy and owner terms.",
      published_graph_version_ref: publishedGraphVersionRef,
      linked_published_fact_refs: [policyFactRef, ownerFactRef],
    },
  ],
};

export function buildMockRagAnswer(projectId: string, question: string): RagAnswerResponse {
  const insufficient = question.toLowerCase().includes("candidate") || question.toLowerCase().includes("unsupported");

  if (insufficient) {
    return {
      project_id: projectId,
      question,
      state: "INSUFFICIENT_EVIDENCE" as RagAnswerState,
      answer: null,
      coverage: 0.2,
      published_graph_version_ref: publishedGraphVersionRef,
      citations: [],
      linked_published_facts: [],
      insufficient_evidence: {
        reason_code: "NO_PUBLISHED_FACTS",
        message: "Only candidate or unsupported facts matched the question.",
        missing_scopes: ["published graph fact", "reviewed evidence"],
        suggested_queries: ["security policy owner", "published policy evidence"],
      },
    };
  }

  return {
    project_id: projectId,
    question,
    state: "ANSWERED",
    answer: "The Information Security Policy is owned by the Security Office in the current published graph.",
    coverage: 0.88,
    published_graph_version_ref: publishedGraphVersionRef,
    citations: [
      {
        citation_id: "citation-policy-owner",
        kind: "EVIDENCE_CHUNK",
        evidence_ref: evidenceRef,
        source_ref: sourceRef,
        quote: "Security Office owns the policy.",
        snippet: "Security Office owns the policy according to reviewed evidence.",
        locator: sourceRef.locator,
      },
      {
        citation_id: "citation-published-fact",
        kind: "PUBLISHED_RELATION",
        published_fact_ref: ownerFactRef,
        snippet: "Published relation: Information Security Policy owned by Security Office.",
        locator: "published graph v3",
      },
    ],
    linked_published_facts: [policyFactRef, ownerFactRef],
    insufficient_evidence: undefined,
  };
}

const lineagePanel = {
  fact_ref: ownerFactRef,
  published_graph_version_ref: publishedGraphVersionRef,
  publish_job_id: "publish-job-success",
  review_decision_ref: {
    review_decision_id: "review-decision-policy",
    review_decision_type: "APPROVE" as const,
    reviewer_id: "expert-1",
    reviewed_at: "2026-06-18T07:20:00.000Z",
  },
  candidate_ref: { candidate_kind: "RELATION" as const, candidate_id: "candidate-relation-policy-owner" },
  evidence_refs: [evidenceRef],
  source_refs: [sourceRef],
  ontology_version_id: "onto-v3-published",
  model_run_id: "model-run-gpt-4.1-mini",
  prompt_version_id: "prompt-v3",
  created_at: "2026-06-18T09:30:00.000Z",
};

export function buildMockGraphExplore(projectId: string, state: GraphExploreState = "READY"): GraphExploreResponse {
  if (state === "SAFE_TOO_LARGE") {
    return {
      project_id: projectId,
      state,
      published_graph_version_ref: publishedGraphVersionRef,
      root_entity_id: "published-entity-policy",
      max_hops: 3,
      nodes: [],
      edges: [],
      too_large: {
        estimated_nodes: 250,
        estimated_edges: 520,
        node_budget: 150,
        edge_budget: 300,
        suggested_filters: ["Limit to Policy class", "Disable lineage overlay", "Use max hops 2"],
        message: "The selected neighborhood exceeds the safe MVP4 render budget.",
      },
    };
  }

  if (state === "EMPTY" || state === "ERROR") {
    return {
      project_id: projectId,
      state,
      published_graph_version_ref: publishedGraphVersionRef,
      root_entity_id: "published-entity-empty",
      max_hops: 2,
      nodes: [],
      edges: [],
      too_large: undefined,
      lineage_panel: undefined,
    };
  }

  return {
    project_id: projectId,
    state: "READY",
    published_graph_version_ref: publishedGraphVersionRef,
    root_entity_id: "published-entity-policy",
    max_hops: 2,
    nodes: [
      {
        id: "node-policy",
        published_entity_id: "published-entity-policy",
        class_id: "class-policy",
        label: "Information Security Policy",
        hop: 0,
        properties: { policy_code: "POL-001" },
        quality_summary: { traceability_rate: 1 },
        source_count: 1,
        evidence_count: 1,
        lineage_available: true,
      },
      {
        id: "node-security-office",
        published_entity_id: "published-entity-security-office",
        class_id: "class-organization",
        label: "Security Office",
        hop: 1,
        properties: { owner_type: "department" },
        quality_summary: { traceability_rate: 0.95 },
        source_count: 1,
        evidence_count: 1,
        lineage_available: true,
      },
    ],
    edges: [
      {
        id: "edge-policy-owner",
        published_relation_id: "published-relation-policy-owner",
        source_node_id: "node-policy",
        target_node_id: "node-security-office",
        relation_id: "relation-owner",
        label: "owned by",
        quality_summary: { validation_state: "PASSED" },
        evidence_count: 1,
        lineage_available: true,
      },
    ],
    quality_overlays: [{ fact_id: "published-entity-policy", metric: "traceability_rate", value: 1 }],
    source_overlays: [{ fact_id: "published-entity-policy", source_count: 1, evidence_count: 1 }],
    lineage_panel: lineagePanel,
  };
}

export const mockMvp4ExternalApiDocs: ExternalApiDocsSurface = {
  project_id: MVP4_PROJECT_ID,
  auth_mode: "DEV_AUTH",
  published_graph_version_ref: publishedGraphVersionRef,
  read_only: true,
  dev_auth_missing: false,
  endpoints: [
    {
      group: "graph",
      method: "GET",
      path: "/api/v1/external/projects/{project_id}/published-graph/current",
      title: "Current published graph",
      description: "Reads the current published graph snapshot metadata.",
      response_example: { auth_mode: "DEV_AUTH", project_id: MVP4_PROJECT_ID, published_graph_version_ref: publishedGraphVersionRef },
    },
    {
      group: "source_evidence",
      method: "GET",
      path: "/api/v1/external/evidence/{evidence_id}",
      title: "Evidence lookup",
      description: "Reads one evidence record with locator and project context.",
      response_example: { auth_mode: "DEV_AUTH", project_id: MVP4_PROJECT_ID, evidence_ref: evidenceRef },
    },
    {
      group: "search",
      method: "GET",
      path: "/api/v1/external/projects/{project_id}/search?q=policy",
      title: "Grouped search",
      description: "Runs read-only grouped search over published graph and evidence context.",
      response_example: buildMockSearchResponse(MVP4_PROJECT_ID, "policy") as unknown as Record<string, unknown>,
    },
    {
      group: "rag",
      method: "POST",
      path: "/api/v1/external/projects/{project_id}/rag/answers",
      title: "Grounded answer",
      description: "Returns a cited answer using published facts and evidence only.",
      request_example: { question: "Who owns the security policy?", max_citations: 5 },
      response_example: buildMockRagAnswer(MVP4_PROJECT_ID, "Who owns the security policy?") as unknown as Record<string, unknown>,
    },
  ],
};
