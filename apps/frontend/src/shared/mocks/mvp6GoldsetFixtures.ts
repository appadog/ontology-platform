import {
  DatasetAuthoringOverview,
  DatasetRevision,
  DatasetRevisionSummary,
  EvaluationDataset,
  EvaluationRun,
  EvaluationSample,
  GoldAuthoringAuditEntry,
  GoldAuthoringCapabilities,
  GoldAuthoringMutationGuard,
  GoldEntityAuthoringView,
  GoldEvidence,
  GoldRelationAuthoringView,
  GoldSetExportBundle,
  GoldSetImportReport,
} from "../api/types";
import { MVP6_PROJECT_ID } from "./mvp6Fixtures";

// Deterministic MVP6.4 Gold Set Authoring + Dataset Revisioning fixtures.
// Expert-owned, candidate/analysis-layer authoring over the closed MVP6.1
// evaluation surface. Field/enum names match
// docs/api/openapi-mvp6-4-draft.json and the backend schemas EXACTLY.
// No run engine, no LLM, no published/candidate/prompt/ontology mutation.

export const MVP6_GOLDSET_PROJECT_ID = MVP6_PROJECT_ID;
export const MVP6_GOLDSET_DATASET_ID = "dataset-corp-knowledge-gold";
export const MVP6_GOLDSET_OWNER_ID = "qa-owner";
export const MVP6_GOLDSET_ONTOLOGY_VERSION_ID = "onto-v6-eval";

export const MVP6_GOLDSET_ACTIVE_REVISION_ID = "dataset-corp-knowledge-gold-v3";
export const MVP6_GOLDSET_FROZEN_REVISION_ID = "dataset-corp-knowledge-gold-v2";
export const MVP6_GOLDSET_ARCHIVED_REVISION_ID = "dataset-corp-knowledge-gold-v1";
export const MVP6_GOLDSET_DRAFT_REVISION_ID = "dataset-corp-knowledge-gold-v4";

export const MVP6_GOLDSET_PINNED_RUN_ID = "eval-run-mvp6-pinned";

// Import dry-run report ids — one fixture per GoldSetImportCompatibility state.
export const MVP6_GOLDSET_IMPORT_COMPATIBLE_ID = "gold-set-import-compatible-001";
export const MVP6_GOLDSET_IMPORT_WARNING_ID = "gold-set-import-warning-001";
export const MVP6_GOLDSET_IMPORT_CONFLICT_ID = "gold-set-import-conflict-001";
export const MVP6_GOLDSET_IMPORT_INCOMPATIBLE_ID = "gold-set-import-incompatible-001";

const NOW = "2026-06-30T09:00:00.000Z";

export const allFalseMutationGuard: GoldAuthoringMutationGuard = {
  published_graph_mutated: false,
  candidate_graph_mutated: false,
  prompt_version_mutated: false,
  ontology_definition_mutated: false,
  extraction_job_started: false,
  evaluation_run_started: false,
  prior_run_pin_rewritten: false,
};

// Expert owner: full authoring. (A read-only/non-owner hint is exported below.)
export const ownerCapabilities: GoldAuthoringCapabilities = {
  can_view: true,
  can_edit_gold_item: true,
  can_archive_gold_item: true,
  can_author_evidence: true,
  can_cut_revision: true,
  can_activate_revision: true,
  can_import: true,
};

export const readOnlyCapabilities: GoldAuthoringCapabilities = {
  can_view: true,
  can_edit_gold_item: false,
  can_archive_gold_item: false,
  can_author_evidence: false,
  can_cut_revision: false,
  can_activate_revision: false,
  can_import: false,
};

export const mockGoldsetDataset: EvaluationDataset = {
  id: MVP6_GOLDSET_DATASET_ID,
  project_id: MVP6_GOLDSET_PROJECT_ID,
  name: "기업 지식 정답셋",
  description: "Expert-owned gold set for entity/relation/evidence authoring and revisioning.",
  status: "ACTIVE",
  sample_count: 2,
  gold_entity_count: 3,
  gold_relation_count: 1,
  owner_id: MVP6_GOLDSET_OWNER_ID,
  active_version_id: MVP6_GOLDSET_ACTIVE_REVISION_ID,
  created_at: "2026-06-20T04:00:00.000Z",
  updated_at: NOW,
  notes: "Authoring touches evaluation artifacts only; never the candidate or published graph.",
};

function buildRevision(overrides: Partial<DatasetRevision> & Pick<DatasetRevision, "id" | "revision_number" | "status">): DatasetRevision {
  const immutable = overrides.status === "FROZEN" || overrides.status === "ARCHIVED";
  return {
    dataset_id: MVP6_GOLDSET_DATASET_ID,
    project_id: MVP6_GOLDSET_PROJECT_ID,
    is_immutable: immutable,
    frozen_reason: null,
    sample_count: 2,
    gold_entity_count: 3,
    gold_relation_count: 1,
    gold_evidence_count: 4,
    pinned_run_count: 0,
    parent_revision_id: null,
    ontology_version_id: MVP6_GOLDSET_ONTOLOGY_VERSION_ID,
    created_at: NOW,
    activated_at: null,
    frozen_at: null,
    created_by: MVP6_GOLDSET_OWNER_ID,
    ...overrides,
  };
}

export const mockGoldsetActiveRevision: DatasetRevision = buildRevision({
  id: MVP6_GOLDSET_ACTIVE_REVISION_ID,
  revision_number: 3,
  status: "ACTIVE",
  parent_revision_id: MVP6_GOLDSET_FROZEN_REVISION_ID,
  created_at: "2026-06-30T08:00:00.000Z",
  activated_at: "2026-06-30T08:00:00.000Z",
});

export const mockGoldsetFrozenRevision: DatasetRevision = buildRevision({
  id: MVP6_GOLDSET_FROZEN_REVISION_ID,
  revision_number: 2,
  status: "FROZEN",
  frozen_reason: "PINNED_BY_RUN",
  pinned_run_count: 1,
  parent_revision_id: MVP6_GOLDSET_ARCHIVED_REVISION_ID,
  created_at: "2026-06-22T08:00:00.000Z",
  activated_at: "2026-06-22T08:00:00.000Z",
  frozen_at: "2026-06-24T10:00:00.000Z",
});

export const mockGoldsetArchivedRevision: DatasetRevision = buildRevision({
  id: MVP6_GOLDSET_ARCHIVED_REVISION_ID,
  revision_number: 1,
  status: "ARCHIVED",
  frozen_reason: "NEWER_REVISION_ACTIVATED",
  created_at: "2026-06-20T08:00:00.000Z",
  activated_at: "2026-06-20T08:00:00.000Z",
  frozen_at: "2026-06-22T08:00:00.000Z",
});

export const mockGoldsetRevisions: DatasetRevision[] = [
  mockGoldsetActiveRevision,
  mockGoldsetFrozenRevision,
  mockGoldsetArchivedRevision,
];

export function toRevisionSummary(revision: DatasetRevision): DatasetRevisionSummary {
  return {
    id: revision.id,
    dataset_id: revision.dataset_id,
    revision_number: revision.revision_number,
    status: revision.status,
    is_immutable: revision.is_immutable,
    frozen_reason: revision.frozen_reason ?? null,
    pinned_run_count: revision.pinned_run_count,
    created_at: revision.created_at,
  };
}

const evidenceA = {
  sample_id: "gold-sample-policy",
  source_id: "source-security-policy",
  source_segment_id: "segment-001",
  locator: "p.3/para.2",
  offset_start: 0,
  offset_end: 27,
  quote: "The Information Security Policy",
};

export const mockGoldsetEntities: GoldEntityAuthoringView[] = [
  {
    id: "gold-entity-policy",
    project_id: MVP6_GOLDSET_PROJECT_ID,
    dataset_id: MVP6_GOLDSET_DATASET_ID,
    sample_id: "gold-sample-policy",
    ontology_class_id: "class-policy",
    label: "Information Security Policy",
    normalized_value: "information security policy",
    evidence: evidenceA,
    created_at: NOW,
    status: "ACTIVE",
    revision_id: MVP6_GOLDSET_ACTIVE_REVISION_ID,
    evidence_id: "gold-evidence-0001",
    updated_at: NOW,
    archived_at: null,
  },
  {
    id: "gold-entity-security-office",
    project_id: MVP6_GOLDSET_PROJECT_ID,
    dataset_id: MVP6_GOLDSET_DATASET_ID,
    sample_id: "gold-sample-policy",
    ontology_class_id: "class-organization",
    label: "Security Office",
    normalized_value: "security office",
    evidence: { ...evidenceA, offset_start: 52, offset_end: 67, quote: "Security Office" },
    created_at: NOW,
    status: "ACTIVE",
    revision_id: MVP6_GOLDSET_ACTIVE_REVISION_ID,
    evidence_id: null,
    updated_at: NOW,
    archived_at: null,
  },
  {
    id: "gold-entity-stale-term",
    project_id: MVP6_GOLDSET_PROJECT_ID,
    dataset_id: MVP6_GOLDSET_DATASET_ID,
    sample_id: "gold-sample-policy",
    ontology_class_id: "class-policy",
    label: "Legacy Privacy Note (stale)",
    normalized_value: "legacy privacy note",
    evidence: { ...evidenceA, quote: "Legacy Privacy Note" },
    created_at: "2026-06-22T08:00:00.000Z",
    status: "ARCHIVED",
    revision_id: MVP6_GOLDSET_ACTIVE_REVISION_ID,
    evidence_id: null,
    updated_at: "2026-06-29T08:00:00.000Z",
    archived_at: "2026-06-29T08:00:00.000Z",
  },
];

export const mockGoldsetRelations: GoldRelationAuthoringView[] = [
  {
    id: "gold-relation-policy-owner",
    project_id: MVP6_GOLDSET_PROJECT_ID,
    dataset_id: MVP6_GOLDSET_DATASET_ID,
    sample_id: "gold-sample-policy",
    ontology_relation_id: "relation-owned-by",
    source_gold_entity_id: "gold-entity-policy",
    target_gold_entity_id: "gold-entity-security-office",
    evidence: evidenceA,
    created_at: NOW,
    status: "ACTIVE",
    revision_id: MVP6_GOLDSET_ACTIVE_REVISION_ID,
    evidence_id: null,
    updated_at: NOW,
    archived_at: null,
  },
];

export const mockGoldsetSamples: EvaluationSample[] = [
  {
    id: "gold-sample-policy",
    project_id: MVP6_GOLDSET_PROJECT_ID,
    dataset_id: MVP6_GOLDSET_DATASET_ID,
    sample_kind: "SOURCE_SEGMENT",
    source_id: "source-security-policy",
    source_segment_id: "segment-001",
    source_locator: "security-policy.csv row 12",
    title: "Security policy owner row",
    content_text: "The Information Security Policy is owned by the Security Office.",
    metadata: { domain: "security" },
    created_at: NOW,
  },
];

export const mockGoldsetEvidence: GoldEvidence[] = [
  {
    id: "gold-evidence-0001",
    project_id: MVP6_GOLDSET_PROJECT_ID,
    dataset_id: MVP6_GOLDSET_DATASET_ID,
    revision_id: MVP6_GOLDSET_ACTIVE_REVISION_ID,
    gold_entity_id: "gold-entity-policy",
    gold_relation_id: null,
    status: "ACTIVE",
    sample_id: "gold-sample-policy",
    source_id: "source-security-policy",
    source_segment_id: "segment-001",
    locator: "p.3/para.2",
    offset_start: 0,
    offset_end: 27,
    quote: "The Information Security Policy",
    created_at: NOW,
    updated_at: NOW,
    archived_at: null,
  },
];

// An existing run pinned to the FROZEN revision — reproducibility proof.
export const mockGoldsetPinnedRun: EvaluationRun = {
  id: MVP6_GOLDSET_PINNED_RUN_ID,
  project_id: MVP6_GOLDSET_PROJECT_ID,
  dataset_id: MVP6_GOLDSET_DATASET_ID,
  dataset_version_id: MVP6_GOLDSET_FROZEN_REVISION_ID,
  status: "SUCCEEDED",
  run_mode: "DETERMINISTIC_MOCK",
  ontology_version_id: MVP6_GOLDSET_ONTOLOGY_VERSION_ID,
  prompt_version_id: "prompt-v6-eval",
  model_name: "deterministic-mock",
  model_provider: "mock",
  model_run_id: `${MVP6_GOLDSET_PINNED_RUN_ID}-model-run`,
  parser_version: "parser-v6.1",
  started_at: "2026-06-24T09:58:00.000Z",
  completed_at: "2026-06-24T10:00:00.000Z",
  ended_at: "2026-06-24T10:00:00.000Z",
  requested_by: MVP6_GOLDSET_OWNER_ID,
  metrics: {},
  dimensions: {},
};

export const mockGoldsetAuditEntries: GoldAuthoringAuditEntry[] = [
  {
    id: "gold-audit-0003",
    project_id: MVP6_GOLDSET_PROJECT_ID,
    dataset_id: MVP6_GOLDSET_DATASET_ID,
    revision_id: MVP6_GOLDSET_ACTIVE_REVISION_ID,
    action: "ARCHIVE",
    actor_id: MVP6_GOLDSET_OWNER_ID,
    is_owner: true,
    target_kind: "GOLD_ENTITY",
    target_id: "gold-entity-stale-term",
    before: { status: "ACTIVE" },
    after: { status: "ARCHIVED" },
    reason: "stale term retired; excluded from new runs, retained for traceability",
    created_at: "2026-06-29T08:00:00.000Z",
  },
  {
    id: "gold-audit-0002",
    project_id: MVP6_GOLDSET_PROJECT_ID,
    dataset_id: MVP6_GOLDSET_DATASET_ID,
    revision_id: MVP6_GOLDSET_ACTIVE_REVISION_ID,
    action: "REVISION_CUT",
    actor_id: MVP6_GOLDSET_OWNER_ID,
    is_owner: true,
    target_kind: "DATASET_REVISION",
    target_id: MVP6_GOLDSET_ACTIVE_REVISION_ID,
    before: null,
    after: null,
    reason: "Q3 expert re-review",
    created_at: "2026-06-30T08:00:00.000Z",
  },
  {
    id: "gold-audit-0001",
    project_id: MVP6_GOLDSET_PROJECT_ID,
    dataset_id: MVP6_GOLDSET_DATASET_ID,
    revision_id: MVP6_GOLDSET_ACTIVE_REVISION_ID,
    action: "EDIT",
    actor_id: MVP6_GOLDSET_OWNER_ID,
    is_owner: true,
    target_kind: "GOLD_ENTITY",
    target_id: "gold-entity-policy",
    before: { normalized_value: "infosec policy" },
    after: { normalized_value: "information security policy" },
    reason: "normalized value corrected per glossary v4",
    created_at: "2026-06-30T07:30:00.000Z",
  },
];

export function buildExportBundle(revisionId: string): GoldSetExportBundle {
  const revision =
    mockGoldsetRevisions.find((rev) => rev.id === revisionId) ?? mockGoldsetActiveRevision;
  return {
    bundle_version: "gold-set-bundle/1.0",
    source_project_id: MVP6_GOLDSET_PROJECT_ID,
    source_dataset_id: MVP6_GOLDSET_DATASET_ID,
    source_revision_id: revision.id,
    revision_status: revision.status,
    ontology_version_id: MVP6_GOLDSET_ONTOLOGY_VERSION_ID,
    exported_at: NOW,
    samples: mockGoldsetSamples,
    gold_entities: mockGoldsetEntities.filter((entity) => entity.status !== "ARCHIVED"),
    gold_relations: mockGoldsetRelations,
    gold_evidence: mockGoldsetEvidence,
    mutation_guard: allFalseMutationGuard,
  };
}

function bundleSummary() {
  return {
    bundle_version: "gold-set-bundle/1.0",
    source_dataset_id: MVP6_GOLDSET_DATASET_ID,
    source_revision_id: MVP6_GOLDSET_FROZEN_REVISION_ID,
    sample_count: 2,
    gold_entity_count: 3,
    gold_relation_count: 1,
    gold_evidence_count: 4,
  };
}

// One dry-run report per compatibility state so the UI can exercise all four.
export const mockImportReports: Record<string, GoldSetImportReport> = {
  COMPATIBLE: {
    import_id: MVP6_GOLDSET_IMPORT_COMPATIBLE_ID,
    project_id: MVP6_GOLDSET_PROJECT_ID,
    compatibility: "COMPATIBLE",
    bundle_summary: bundleSummary(),
    target_ontology_version_id: MVP6_GOLDSET_ONTOLOGY_VERSION_ID,
    issues: [
      {
        code: "ONTOLOGY_CLASS_RESOLVED",
        severity: "COMPATIBLE",
        ontology_class_id: "class-policy",
        message: "class resolves in target ontology",
      },
    ],
    allowed_strategies: ["CREATE_NEW_DATASET", "NEW_REVISION_OF_EXISTING"],
    blocking: false,
    mutation_guard: allFalseMutationGuard,
  },
  WARNING: {
    import_id: MVP6_GOLDSET_IMPORT_WARNING_ID,
    project_id: MVP6_GOLDSET_PROJECT_ID,
    compatibility: "WARNING",
    bundle_summary: bundleSummary(),
    target_ontology_version_id: MVP6_GOLDSET_ONTOLOGY_VERSION_ID,
    issues: [
      {
        code: "SAMPLE_SOURCE_NOT_LOCAL",
        severity: "WARNING",
        sample_id: "gold-sample-policy",
        message: "source segment not present locally; imported as locator-only",
      },
    ],
    allowed_strategies: ["CREATE_NEW_DATASET", "NEW_REVISION_OF_EXISTING"],
    blocking: false,
    mutation_guard: allFalseMutationGuard,
  },
  CONFLICT: {
    import_id: MVP6_GOLDSET_IMPORT_CONFLICT_ID,
    project_id: MVP6_GOLDSET_PROJECT_ID,
    compatibility: "CONFLICT",
    bundle_summary: bundleSummary(),
    target_ontology_version_id: MVP6_GOLDSET_ONTOLOGY_VERSION_ID,
    issues: [
      {
        code: "GOLD_ITEM_ID_COLLISION",
        severity: "CONFLICT",
        ontology_class_id: "class-policy",
        message: "gold item id collides with an existing item; choose a strategy (no auto-merge)",
      },
    ],
    allowed_strategies: ["CREATE_NEW_DATASET", "NEW_REVISION_OF_EXISTING"],
    blocking: false,
    mutation_guard: allFalseMutationGuard,
  },
  INCOMPATIBLE: {
    import_id: MVP6_GOLDSET_IMPORT_INCOMPATIBLE_ID,
    project_id: MVP6_GOLDSET_PROJECT_ID,
    compatibility: "INCOMPATIBLE",
    bundle_summary: bundleSummary(),
    target_ontology_version_id: "onto-v8-missing",
    issues: [
      {
        code: "ONTOLOGY_CLASS_MISSING",
        severity: "INCOMPATIBLE",
        ontology_class_id: "class-policy",
        message: "bundle references an ontology class absent from the target project; import blocked",
      },
    ],
    allowed_strategies: [],
    blocking: true,
    mutation_guard: allFalseMutationGuard,
  },
};

export function buildAuthoringOverview(
  capabilities: GoldAuthoringCapabilities = ownerCapabilities,
): DatasetAuthoringOverview {
  return {
    dataset: mockGoldsetDataset,
    active_revision: mockGoldsetActiveRevision,
    revision_count: mockGoldsetRevisions.length,
    gold_status_counts: { DRAFT: 0, ACTIVE: 3, ARCHIVED: 1 },
    pinned_runs: [
      {
        run_id: MVP6_GOLDSET_PINNED_RUN_ID,
        dataset_version_id: MVP6_GOLDSET_FROZEN_REVISION_ID,
        revision_status: "FROZEN",
        pin_immutable: true,
      },
    ],
    capabilities,
    mutation_guard: allFalseMutationGuard,
  };
}
