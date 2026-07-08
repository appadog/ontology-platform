import {
  mockOntologyGraph,
  mockOntologyVersions,
  mockProjects,
  mockSourcePreviews,
  mockSources,
} from "../mocks/fixtures";
import {
  mockCandidateEntities,
  mockCandidateEvidences,
  mockCandidateRelations,
  mockExtractionJobs,
  mockModelRuns,
  mockPromptTemplates,
  mockPromptVersions,
  mockSourceProfiles,
  mockSourceSegments,
} from "../mocks/mvp2Fixtures";
import {
  mockPublishedGraph,
  mockPublishCandidates,
  mockPublishJobs,
  mockQualitySummary,
  mockReviewTaskDetails,
  mockReviewTasks,
} from "../mocks/mvp3Fixtures";
import {
  buildMockGraphExplore,
  buildMockRagAnswer,
  buildMockSearchResponse,
  mockMvp4DatasetVersions,
  mockMvp4Datasets,
  mockMvp4EvaluationRuns,
  mockMvp4ExternalApiDocs,
  mockMvp4GoldenItems,
  mockMvp4PromptExperiments,
  mockMvp4PromptPerformance,
  mockMvp4QualityMetrics,
  mockMvp4SimilarEvidence,
  mockMvp4VectorStatus,
} from "../mocks/mvp4Fixtures";
import {
  buildMockCredentialCreateResponse,
  buildMockMvp5PermissionCheck,
  buildMockRestoreDryRun,
  mockMvp5AuditEvents,
  mockMvp5AutomaticApprovalPolicy,
  mockMvp5Backups,
  mockMvp5Credentials,
  mockMvp5DeletionDryRun,
  mockMvp5EnforcePreview,
  mockMvp5ExportDownload,
  mockMvp5ExportJobs,
  mockMvp5ImportDryRun,
  mockMvp5OperationsDashboard,
  mockMvp5OrganizationSummary,
  mockMvp5PolicyDiff,
  mockMvp5PolicyEvaluation,
  mockMvp5ProjectSummaries,
  mockMvp5RetentionPolicy,
  mockMvp5RoleAssignments,
  MVP5_ORGANIZATION_ID,
  MVP5_PROJECT_ID,
} from "../mocks/mvp5Fixtures";
import {
  buildMockMvp6EvaluationRun,
  mockMvp6Datasets,
  mockMvp6ErrorCases,
  mockMvp6EvaluationRuns,
  mockMvp6GoldEntities,
  mockMvp6GoldRelations,
  mockMvp6Metrics,
  mockMvp6Samples,
} from "../mocks/mvp6Fixtures";
import {
  buildMockLearningSummary,
  mockLearningAutoApprovalCandidates,
  mockLearningCorrectionPatterns,
  mockLearningPromptSuggestions,
} from "../mocks/mvp6LearningFixtures";
import {
  buildMockMvp6BenchmarkComparison,
  buildMockMvp6ConfusionMatrix,
  findMockMvp6Cell,
  findMockMvp6CellErrorCases,
  mockMvp6BenchmarkRuns,
  MVP6_BENCHMARK_COMPARISON_ID,
  MVP6_BENCHMARK_PROJECT_ID,
} from "../mocks/mvp6BenchmarkFixtures";
import {
  allFalseMutationGuard,
  buildAuthoringOverview,
  buildExportBundle,
  mockGoldsetAuditEntries,
  mockGoldsetEntities,
  mockGoldsetEvidence,
  mockGoldsetRelations,
  mockGoldsetRevisions,
  mockImportReports,
  ownerCapabilities,
  toRevisionSummary,
  MVP6_GOLDSET_DATASET_ID,
  MVP6_GOLDSET_OWNER_ID,
} from "../mocks/mvp6GoldsetFixtures";
import {
  allFalseGovernanceGuard,
  applyCapabilitiesApplied,
  applyCapabilitiesQueued,
  applyCapabilitiesReadOnly,
  applyMutationGuard,
  approverCapabilities,
  bannerFor,
  buildApplicationAudit,
  buildItemPreviews,
  mockGovernanceAudit,
  mockGovernanceItems,
  mockGovernanceRequests,
  mockGovernanceReviews,
  MVP6_GOVERNANCE_APPROVER_ID,
  MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
  MVP6_GOVERNANCE_PROJECT_ID,
  MVP6_GOVERNANCE_PROPOSER_ID,
  MVP6_GOVERNANCE_STALE_APPROVED_ID,
  MVP6_GOVERNANCE_TARGET_DRAFT_VERSION_ID,
} from "../mocks/mvp6GovernanceFixtures";
import {
  buildEmptyImpactReport,
  mockImpactReports,
} from "../mocks/mvp6ImpactFixtures";
import {
  allFalseCopilotGuard,
  mockCopilotAdvisoryNotes,
  mockCopilotSourceArtifactScope,
  mockCopilotSuggestions,
  MVP6_COPILOT_GENERATED_AT,
} from "../mocks/mvp6CopilotFixtures";
import {
  allFalseConnectorGuard,
  buildConnectorCatalog,
  buildConnectorConfigSchema,
  buildConnectorImportPreview,
  isConnectorKind,
} from "../mocks/mvp6ConnectorsFixtures";
import {
  AuditEvent,
  AutoApprovalCandidatePreview,
  AutomaticApprovalPolicyDocument,
  BackupSnapshot,
  BenchmarkComparison,
  BenchmarkComparisonCreateRequest,
  BenchmarkComparisonListResponse,
  BenchmarkComparisonSummary,
  ConfusionMatrix,
  ConfusionMatrixAxis,
  ConfusionCellErrorCasesResponse,
  ConnectorCatalogListResponse,
  ConnectorConfigSchemaResponse,
  ConnectorImportPreviewRequest,
  ConnectorImportPreviewResponse,
  ConnectorKind,
  CorrectionPattern,
  LearningSignalSummaryResponse,
  PromptSuggestion,
  SuggestionDecisionAuditNote,
  SuggestionDecisionRequest,
  SuggestionDecisionResponse,
  SuggestionIntendedNextAction,
  CandidateEntity,
  CandidateListFilters,
  CandidateEvidence,
  CandidateRelation,
  CredentialCreateResponse,
  CredentialKind,
  CredentialView,
  DashboardSummary,
  EnforcePreviewResponse,
  EvaluationDataset,
  EvaluationDatasetCreateRequest,
  EvaluationDatasetVersion,
  EvaluationErrorCase,
  EvaluationMetric,
  EvaluationRun,
  EvaluationRunCreateRequest,
  EvaluationSample,
  EvaluationSampleCreateRequest,
  ExternalApiDocsSurface,
  ExtractionJob,
  ExtractionJobCreateRequest,
  ExtractionJobDetail,
  GoldEntity,
  GoldEntityCreateRequest,
  GoldRelation,
  GoldRelationCreateRequest,
  GoldenSetItem,
  DatasetAuthoringOverview,
  DatasetRevisionCutRequest,
  DatasetRevisionListResponse,
  DatasetRevisionMutationResponse,
  GoldAuthoringAuditListResponse,
  GoldEntityEditRequest,
  GoldEntityMutationResponse,
  GoldEvidenceAttachRequest,
  GoldEvidenceEditRequest,
  GoldEvidenceListResponse,
  GoldEvidenceMutationResponse,
  GoldItemArchiveRequest,
  GoldRelationEditRequest,
  GoldRelationMutationResponse,
  GoldSetExportBundle,
  GoldSetImportConfirmRequest,
  GoldSetImportConfirmResponse,
  GoldSetImportDryRunRequest,
  GoldSetImportReport,
  GovernanceApplicationAuditEntry,
  GovernanceApplicationAuditListResponse,
  GovernanceApplicationState,
  GovernanceApplicationStatusResponse,
  GovernanceApplyRequest,
  GovernanceApplyResponse,
  GovernanceAuditListResponse,
  GovernanceMutationResponse,
  GovernanceReviewDecision,
  GovernanceReviewDecisionRequest,
  GovernanceWithdrawRequest,
  ImpactSimulationReport,
  CopilotDecisionAuditNote,
  CopilotSuggestion,
  CopilotSuggestionDecisionRequest,
  CopilotSuggestionDecisionResponse,
  CopilotSuggestionDetailResponse,
  CopilotSuggestionKind,
  CopilotSuggestionKindCount,
  CopilotSuggestionListResponse,
  CopilotSuggestionState,
  CopilotRiskLabel,
  CopilotSummaryResponse,
  OntologyChangeItem,
  OntologyChangeItemRequest,
  OntologyChangeRequest,
  OntologyChangeRequestCreateRequest,
  OntologyChangeRequestDetail,
  OntologyChangeRequestListResponse,
  OntologyChangeRequestStatus,
  OntologyChangeRequestUpdateRequest,
  GraphExploreRequest,
  GraphExploreResponse,
  ModelRun,
  OperationsDashboardResponse,
  OrganizationAdminSummary,
  OntologyExportDownload,
  OntologyExportJob,
  OntologyImportCreateRequest,
  OntologyImportDryRunJob,
  OntologyPackageMetadata,
  OntologyGraph,
  OntologyClass,
  OntologyClassCreateRequest,
  OntologyClassUpdateRequest,
  OntologyProperty,
  OntologyPropertyCreateRequest,
  OntologyPropertyUpdateRequest,
  OntologyRelation,
  OntologyRelationCreateRequest,
  OntologyRelationUpdateRequest,
  OntologyVersion,
  OntologyVersionCreateRequest,
  OperationEventSeverity,
  PermissionCheckRequest,
  PermissionCheckResponse,
  PolicyDiffResponse,
  PolicyEvaluationResponse,
  ProjectAdminSummary,
  ProjectCreateRequest,
  ProjectDetail,
  ProjectSummary,
  ProjectUpdateRequest,
  PublishedGraphSnapshot,
  PublishCandidate,
  PublishJob,
  PromptExperiment,
  PromptPerformanceSummary,
  QualitySummary,
  QualityMetricDetail,
  QualityMetricsResponse,
  RagAnswerRequest,
  RagAnswerResponse,
  ReviewTaskDetail,
  ReviewTaskListFilters,
  ReviewTaskListResponse,
  RestoreDryRunResponse,
  RetentionDeletionDryRunResponse,
  RetentionPolicy,
  RoleAssignment,
  SearchRequest,
  SearchResponse,
  SimilarEvidenceRequest,
  SimilarEvidenceResponse,
  PromptTemplate,
  PromptVersion,
  SourceData,
  SourceParseResponse,
  SourcePreview,
  SourceProfile,
  SourceSegment,
  SourceUploadRequest,
  VectorAdapterState,
} from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const DEFAULT_MVP5_ORGANIZATION_ID = import.meta.env.VITE_MVP5_ORGANIZATION_ID ?? MVP5_ORGANIZATION_ID;
let mockProjectStore: ProjectDetail[] = mockProjects.map((project) => ({
  ...project,
  current_ontology_version_id: project.id === "project-corp-knowledge" ? "onto-v1-draft" : null,
}));
let mockOntologyVersionStore: OntologyVersion[] = [...mockOntologyVersions];
let mockOntologyGraphStore: Record<string, OntologyGraph> = {
  [mockOntologyGraph.version_id]: {
    ...mockOntologyGraph,
    nodes: [...mockOntologyGraph.nodes],
    edges: [...mockOntologyGraph.edges],
    properties: [...mockOntologyGraph.properties],
    classes: mockOntologyGraph.classes ? [...mockOntologyGraph.classes] : null,
    relations: mockOntologyGraph.relations ? [...mockOntologyGraph.relations] : null,
  },
};
let mockSourceStore: SourceData[] = [...mockSources];
const mockPreviewStore: Record<string, SourcePreview> = { ...mockSourcePreviews };
const mockProfileStore: Record<string, SourceProfile> = { ...mockSourceProfiles };
const mockSegmentStore: Record<string, SourceSegment[]> = { ...mockSourceSegments };
let mockExtractionJobStore: ExtractionJob[] = [...mockExtractionJobs];
let mockModelRunStore: ModelRun[] = [...mockModelRuns];
let mockCandidateEntityStore: CandidateEntity[] = [...mockCandidateEntities];
let mockCandidateRelationStore: CandidateRelation[] = [...mockCandidateRelations];
let mockCandidateEvidenceStore: Record<string, CandidateEvidence> = { ...mockCandidateEvidences };
let mockMvp6DatasetStore: EvaluationDataset[] = [...mockMvp6Datasets];
let mockMvp6SampleStore: EvaluationSample[] = [...mockMvp6Samples];
let mockMvp6GoldEntityStore: GoldEntity[] = [...mockMvp6GoldEntities];
let mockMvp6GoldRelationStore: GoldRelation[] = [...mockMvp6GoldRelations];
let mockMvp6EvaluationRunStore: EvaluationRun[] = [...mockMvp6EvaluationRuns];
let mockMvp6RunCounter = 1;
let mockLearningSuggestionStore: PromptSuggestion[] = mockLearningPromptSuggestions.map((item) => ({ ...item }));
let mockLearningDecisionCounter = 0;

export class SuggestionDecisionError extends Error {
  code: string;
  state?: string;
  status: number;

  constructor(message: string, code: string, status: number, state?: string) {
    super(message);
    this.name = "SuggestionDecisionError";
    this.code = code;
    this.status = status;
    this.state = state;
  }
}

// ---- MVP6.8 Copilot error + deterministic process-local store ----
// The copilot is ADVISORY-ONLY: it SUGGESTS and (on accept) ROUTES; it EXECUTES
// NOTHING and invokes NO real model. Decisions are audit-only. A decision command
// against a non-SUGGESTED state -> 409 COPILOT_SUGGESTION_DECISION_CONFLICT.
export class CopilotDecisionError extends Error {
  code: string;
  status: number;
  state?: string;

  constructor(message: string, code: string, status: number, state?: string) {
    super(message);
    this.name = "CopilotDecisionError";
    this.code = code;
    this.status = status;
    this.state = state;
  }
}

// Process-local suggestion store (mirror the learning/governance precedent: clone
// the fixtures so audit-only decision state persists within a mock session). The
// ACCEPT/DISMISS decision mutates ONLY the suggestion state + its audit note; it
// creates/mutates/applies NO gated-flow object (see the all-false guard).
let mockCopilotSuggestionStore: CopilotSuggestion[] = mockCopilotSuggestions.map((s) => ({ ...s }));
let mockCopilotDecisionCounter = 0;

// ---- MVP6.9 Connectors error ----
// READ-ONLY catalog + DRY-RUN preview. Unknown kind -> 404 CONNECTOR_KIND_NOT_FOUND;
// non-member -> 403 PERMISSION_DENIED; missing project -> 404 PROJECT_NOT_FOUND.
// A well-formed-but-invalid config is NOT an error: it returns a 200 preview with
// status=BLOCKED (a result state), never a throw.
export class ConnectorError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ConnectorError";
    this.code = code;
    this.status = status;
  }
}

export class BenchmarkComparisonError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "BenchmarkComparisonError";
    this.code = code;
    this.status = status;
  }
}

// Process-local persisted comparison store keyed by comparison_id (PM C12 = option a).
let mockMvp6BenchmarkStore: BenchmarkComparison[] = [buildMockMvp6BenchmarkComparison(MVP6_BENCHMARK_PROJECT_ID)];
let mockMvp6BenchmarkCounter = 0;

// ---- MVP6.4 Gold Set Authoring error + process-local store ----
export class GoldAuthoringError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "GoldAuthoringError";
    this.code = code;
    this.status = status;
  }
}

let mockGoldsetImportCounter = 0;

// ---- MVP6.5 Governance error + process-local store ----
export class GovernanceError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "GovernanceError";
    this.code = code;
    this.status = status;
  }
}

// Deterministic process-local governance stores (mirror the goldset precedent:
// clone the fixtures so mock mutations persist within a session).
let mockGovernanceRequestStore: OntologyChangeRequest[] = mockGovernanceRequests.map((cr) => ({ ...cr }));
const mockGovernanceItemStore: Record<string, OntologyChangeItem[]> = Object.fromEntries(
  Object.entries(mockGovernanceItems).map(([id, items]) => [id, items.map((item) => ({ ...item }))]),
);
const mockGovernanceReviewStore: Record<string, GovernanceReviewDecision[]> = Object.fromEntries(
  Object.entries(mockGovernanceReviews).map(([id, reviews]) => [id, reviews.map((r) => ({ ...r }))]),
);
const mockGovernanceAuditStore: Record<string, GovernanceAuditListResponse["items"]> = Object.fromEntries(
  Object.entries(mockGovernanceAudit).map(([id, entries]) => [id, entries.map((e) => ({ ...e }))]),
);
let mockGovernanceCounter = 0;

// MVP6.6 application-audit store (CHANGE_REQUEST_APPLIED / CHANGE_REQUEST_SUPERSEDED),
// process-local, chronological ascending.
const mockApplicationAuditStore: Record<string, GovernanceApplicationAuditEntry[]> = {};

// The mock actor. In actual mode the backend derives the actor; the mock treats
// the approver identity as "the current viewer" so the approver decision surface
// (and the segregation-of-duties disable on own requests) is exercisable.
const MOCK_GOVERNANCE_ACTOR_ID = MVP6_GOVERNANCE_APPROVER_ID;

function governanceCapabilitiesFor(request: OntologyChangeRequest) {
  // Approver viewer: full decision authority, but cannot approve own proposals.
  const isProposer = request.proposer_id === MOCK_GOVERNANCE_ACTOR_ID;
  return {
    ...approverCapabilities,
    can_approve: approverCapabilities.can_approve && !isProposer,
    can_reject: approverCapabilities.can_reject,
  };
}

function governanceBannerFor(request: OntologyChangeRequest) {
  return bannerFor(request.application_state);
}

function nextGovernanceAudit(
  changeRequestId: string,
  action: GovernanceAuditListResponse["items"][number]["action"],
  beforeStatus: OntologyChangeRequestStatus | null,
  afterStatus: OntologyChangeRequestStatus | null,
  reason?: string | null,
): GovernanceAuditListResponse["items"][number] {
  mockGovernanceCounter += 1;
  const entry: GovernanceAuditListResponse["items"][number] = {
    id: `gov-audit-mock-${mockGovernanceCounter}`,
    project_id: MVP6_GOVERNANCE_PROJECT_ID,
    change_request_id: changeRequestId,
    action,
    actor_id: MOCK_GOVERNANCE_ACTOR_ID,
    target_item_ids: [],
    target_ontology_element_ids: [],
    ontology_version_id: MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
    before_status: beforeStatus,
    after_status: afterStatus,
    reason: reason ?? null,
    created_at: new Date().toISOString(),
  };
  const bucket = mockGovernanceAuditStore[changeRequestId] ?? [];
  // G4: audit stored chronological ascending.
  mockGovernanceAuditStore[changeRequestId] = [...bucket, entry];
  return entry;
}

async function delay<T>(value: T): Promise<T> {
  await new Promise((resolve) => globalThis.setTimeout(resolve, 180));
  return value;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK_API) {
    throw new Error(`No mock handler registered for ${path}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function jsonRequest<T>(path: string, init: RequestInit): Promise<T> {
  if (USE_MOCK_API) {
    throw new Error(`No mock handler registered for ${path}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  if (USE_MOCK_API) {
    throw new Error(`No mock handler registered for ${path}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function unwrapItems<T>(payload: T[] | { items?: T[] }): T[] {
  return Array.isArray(payload) ? payload : payload.items ?? [];
}

function normalizeAdminSummary(payload: Record<string, unknown>): OrganizationAdminSummary {
  return {
    ...payload,
    organization_name: String(payload.organization_name ?? payload.name ?? payload.organization_id),
  } as OrganizationAdminSummary;
}

function normalizeProjectAdminSummary(payload: Record<string, unknown>): ProjectAdminSummary {
  return {
    ...payload,
    project_name: String(payload.project_name ?? payload.name ?? payload.project_id),
    project_status: payload.project_status ?? payload.status,
    selected_ontology_version_id: payload.selected_ontology_version_id ?? payload.current_ontology_version_id,
    credential_count: payload.credential_count ?? payload.active_credential_count,
    automatic_approval_policy_ref: payload.automatic_approval_policy_ref ?? payload.policy_mode,
    latest_audit_events: payload.latest_audit_events ?? payload.audit_event_refs,
  } as ProjectAdminSummary;
}

function normalizeRoleAssignment(payload: Record<string, unknown>): RoleAssignment {
  return {
    ...payload,
    assignment_id: String(payload.assignment_id ?? payload.id),
    organization_id:
      payload.organization_id ??
      (payload.scope_type === "ORGANIZATION" ? payload.scope_id : undefined),
    project_id:
      payload.project_id ??
      (payload.scope_type === "PROJECT" ? payload.scope_id : undefined),
  } as RoleAssignment;
}

function normalizeCredential(payload: Record<string, unknown>): CredentialView {
  const quota = payload.quota as Record<string, unknown> | null | undefined;

  return {
    ...payload,
    credential_id: String(payload.credential_id ?? payload.id),
    credential_kind: (payload.credential_kind ?? payload.kind) as CredentialKind,
    quota: quota
      ? {
          ...quota,
          monthly_requests_used: quota.monthly_requests_used ?? quota.current_month_requests,
          status: quota.status ?? "WITHIN_LIMIT",
        }
      : null,
  } as CredentialView;
}

function normalizePolicy(payload: Record<string, unknown>): AutomaticApprovalPolicyDocument {
  const conditions = (payload.conditions ?? {}) as Record<string, unknown>;

  return {
    ...payload,
    policy_id: String(payload.policy_id ?? payload.id),
    conditions: {
      ...conditions,
      confidence_threshold: conditions.confidence_threshold ?? conditions.min_confidence,
      require_validation_passed:
        conditions.require_validation_passed ?? conditions.require_validation_pass,
    },
  } as AutomaticApprovalPolicyDocument;
}

function normalizePolicyEvaluation(payload: Record<string, unknown>): PolicyEvaluationResponse {
  const rows: Array<Record<string, unknown>> = Array.isArray(payload.rows)
    ? (payload.rows as Array<Record<string, unknown>>).map((row) => {
        const gateStatus = (row.gate_status ?? {}) as Record<string, unknown>;

        return {
          ...row,
          row_id: String(row.row_id ?? row.candidate_id),
          candidate_label: String(row.candidate_label ?? row.candidate_id),
          block_reasons: row.block_reasons ?? row.blocked_reasons ?? [],
          evidence_state: row.evidence_state ?? (gateStatus.evidence === false ? "BLOCKED" : "PASS"),
          validation_state: row.validation_state ?? (gateStatus.validation === false ? "BLOCKED" : "PASS"),
          version_state: row.version_state ?? (gateStatus.version === false ? "STALE_ONTOLOGY_VERSION" : "CURRENT"),
        };
      })
    : [];

  return {
    ...payload,
    status: payload.status ?? (rows.some((row) => row.status === "BLOCKED") ? "BLOCKED" : "WOULD_APPROVE"),
    rows,
  } as unknown as PolicyEvaluationResponse;
}

function normalizePolicyDiff(payload: Record<string, unknown>): PolicyDiffResponse {
  const before = (payload.before ?? {}) as Record<string, unknown>;
  const after = (payload.after ?? {}) as Record<string, unknown>;
  const changedFields = Array.isArray(payload.changed_fields)
    ? (payload.changed_fields as unknown[]).map(String)
    : [];

  return {
    ...payload,
    mode_change:
      payload.mode_change ??
      (before.mode || after.mode ? `${String(before.mode ?? "unknown")} -> ${String(after.mode ?? "unknown")}` : "No mode change"),
    condition_changes: payload.condition_changes ?? changedFields,
    action_changes: payload.action_changes ?? [],
    destructive_or_sensitive_changes: payload.destructive_or_sensitive_changes ?? [],
  } as PolicyDiffResponse;
}

function normalizeEnforcePreview(payload: Record<string, unknown>): EnforcePreviewResponse {
  return {
    ...payload,
    requested_mode: payload.requested_mode ?? payload.target_mode,
    gate_status: payload.gate_status ?? (payload.can_enforce ? "PASS" : "BLOCKED"),
    gate_reasons: payload.gate_reasons ?? payload.blocked_reasons ?? [],
    requires_confirmation:
      payload.requires_confirmation ?? Boolean(payload.required_confirmation) ?? true,
    affected_candidate_count: payload.affected_candidate_count ?? payload.affected_count ?? 0,
  } as unknown as EnforcePreviewResponse;
}

function numberFrom(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePackageMetadata(payload: Record<string, unknown> | null | undefined): OntologyPackageMetadata | null {
  if (!payload) {
    return null;
  }

  const contentsSummary = (payload.contents_summary ?? {}) as Record<string, unknown>;
  const counts = (payload.counts ?? contentsSummary) as Record<string, unknown>;
  const schemaVersion = String(payload.schema_version ?? payload.package_schema_version ?? "ontology-package.v1");
  const generatedAt = String(payload.generated_at ?? payload.created_at ?? new Date().toISOString());

  return {
    ...payload,
    package_id: String(payload.package_id ?? payload.id ?? "pkg-preview"),
    schema_version: schemaVersion,
    package_schema_version: String(payload.package_schema_version ?? schemaVersion),
    format: "JSON",
    project_id: String(payload.project_id ?? MVP5_PROJECT_ID),
    ontology_version_id: String(payload.ontology_version_id ?? payload.version_id ?? "unknown-ontology-version"),
    generated_at: generatedAt,
    created_at: payload.created_at ? String(payload.created_at) : generatedAt,
    counts: {
      class_count: numberFrom(counts.class_count ?? counts.classes ?? contentsSummary.class_count ?? contentsSummary.classes),
      property_count: numberFrom(counts.property_count ?? counts.properties ?? contentsSummary.property_count ?? contentsSummary.properties),
      relation_count: numberFrom(counts.relation_count ?? counts.relations ?? contentsSummary.relation_count ?? contentsSummary.relations),
    },
    compatibility_notes: Array.isArray(payload.compatibility_notes)
      ? (payload.compatibility_notes as unknown[]).map(String)
      : payload.compatibility_note
        ? [String(payload.compatibility_note)]
        : ["JSON P0 package"],
    audit_event_ref: (payload.audit_event_ref ?? null) as OntologyPackageMetadata["audit_event_ref"],
  } as OntologyPackageMetadata;
}

function normalizeExportJob(payload: Record<string, unknown>): OntologyExportJob {
  const metadata = normalizePackageMetadata(
    (payload.package_metadata ?? payload.metadata ?? (payload.package_id || payload.schema_version ? payload : payload.package)) as Record<string, unknown> | null,
  );
  const download = (payload.download ?? {}) as Record<string, unknown>;

  return {
    ...payload,
    job_id: String(payload.job_id ?? payload.id),
    project_id: String(payload.project_id ?? metadata?.project_id ?? MVP5_PROJECT_ID),
    status: String(payload.status ?? (payload.completed_at ? "SUCCEEDED" : "RUNNING")) as OntologyExportJob["status"],
    format: "JSON",
    package_metadata: metadata,
    download_url: (payload.download_url ?? download.download_url ?? payload.download_ref ?? null) as string | null,
    file_name: (payload.file_name ?? download.file_name ?? payload.filename ?? null) as string | null,
    checksum: (payload.checksum ?? download.checksum ?? metadata?.checksum ?? null) as string | null,
    expires_at: (payload.expires_at ?? download.expires_at ?? null) as string | null,
    audit_event_ref: (payload.audit_event_ref ?? metadata?.audit_event_ref ?? null) as OntologyExportJob["audit_event_ref"],
  } as OntologyExportJob;
}

function buildDefaultOntologyPackage(projectId: string): Record<string, unknown> {
  return {
    package_id: "ontology-package-wave25-frontend-dry-run",
    schema_version: "ontology-package.v1",
    project_id: projectId,
    ontology_version_id: "ontology-version-mvp5-current",
    published_graph_version_id: "published-graph-version-mvp5-current",
    generated_at: "2026-06-19T09:00:00Z",
    classes: [
      { stable_id: "class-customer-imported-other", name: "Customer", description: "Conflicting Customer identifier." },
      { stable_id: "class-account", name: "Account", description: "Financial account." },
    ],
    properties: [
      { stable_id: "property-customer-email", class_stable_id: "class-customer-imported-other", name: "email", data_type: "STRING" },
      { stable_id: "property-customer-tier", class_stable_id: "class-customer-imported-other", name: "tier", data_type: "STRING" },
      { stable_id: "property-account-status", class_stable_id: "class-account", name: "status", data_type: "STRING" },
    ],
    relations: [
      {
        stable_id: "relation-customer-owns-account",
        name: "OWNS_ACCOUNT",
        source_class_stable_id: "class-customer-imported-other",
        target_class_stable_id: "class-account",
      },
      {
        stable_id: "relation-customer-reviewed-by-account",
        name: "REVIEWED_BY",
        source_class_stable_id: "class-customer-imported-other",
        target_class_stable_id: "class-account",
      },
    ],
  };
}

function normalizeImportRow(
  row: Record<string, unknown> | string,
  index: number,
  rowType: "CONFLICT" | "WARNING" | "DESTRUCTIVE" | "INVALID",
) {
  if (typeof row === "string") {
    return {
      row_id: `${rowType.toLowerCase()}-${index + 1}`,
      row_type: rowType,
      conflict_type: rowType === "WARNING" ? "NO_OP" : "UNKNOWN",
      severity: rowType === "WARNING" ? "WARNING" : "BLOCKING",
      blocking: rowType !== "WARNING",
      path: "package",
      message: row,
    } as const;
  }

  const severity = String(row.severity ?? (row.blocking === false ? "WARNING" : rowType === "WARNING" ? "WARNING" : "BLOCKING"));

  return {
    ...row,
    row_id: String(row.row_id ?? row.id ?? `${rowType.toLowerCase()}-${index + 1}`),
    row_type: rowType,
    conflict_type: String(row.conflict_type ?? row.type ?? (rowType === "WARNING" ? "NO_OP" : "UNKNOWN")),
    severity,
    blocking: row.blocking !== undefined ? Boolean(row.blocking) : severity === "BLOCKING" || rowType === "DESTRUCTIVE" || rowType === "INVALID",
    path: String(row.path ?? row.resource_path ?? "package"),
    message: String(row.message ?? row.impact ?? "Import dry-run row"),
    local_ref: (row.local_ref ?? row.local_object_ref ?? null) as string | null,
    package_ref: (row.package_ref ?? row.package_object_ref ?? null) as string | null,
    affected_lineage_ref: (row.affected_lineage_ref ?? row.lineage_ref ?? null) as string | null,
    proposed_resolution: (row.proposed_resolution ?? row.resolution ?? null) as string | null,
  };
}

function normalizeImportDryRun(payload: Record<string, unknown>, fallbackPackage?: Record<string, unknown>): OntologyImportDryRunJob {
  const metadata = normalizePackageMetadata(
    (payload.package_metadata ?? payload.metadata ?? (payload.package_id || payload.schema_version ? payload : payload.package) ?? fallbackPackage) as Record<string, unknown> | null,
  );
  const summary = (payload.summary ?? {}) as Record<string, unknown>;
  const rawConflicts = Array.isArray(payload.conflicts) ? (payload.conflicts as Array<Record<string, unknown>>) : [];
  const rawWarnings = Array.isArray(payload.warnings) ? (payload.warnings as Array<Record<string, unknown> | string>) : [];
  const destructiveImpact = (payload.destructive_impact ?? {}) as Record<string, unknown>;
  const rawDestructiveRows = Array.isArray(payload.destructive_impact_rows)
    ? (payload.destructive_impact_rows as Array<Record<string, unknown>>)
    : Array.isArray(payload.destructive_impacts)
      ? (payload.destructive_impacts as Array<Record<string, unknown>>)
    : [];
  const conflicts = rawConflicts.map((row, index) =>
    normalizeImportRow(row, index, row.severity === "DESTRUCTIVE" ? "DESTRUCTIVE" : "CONFLICT"),
  );
  const warnings = rawWarnings.map((row, index) => normalizeImportRow(row, index, "WARNING"));
  const destructiveRows = rawDestructiveRows.length
    ? rawDestructiveRows.map((row, index) => ({
        row_id: String(row.row_id ?? row.id ?? `destructive-${index + 1}`),
        resource_type: String(row.resource_type ?? "UNKNOWN"),
        resource_id: (row.resource_id ?? null) as string | null,
        impact: String(row.impact ?? row.message ?? "Destructive impact preview"),
        blocked: row.blocked !== undefined ? Boolean(row.blocked) : true,
        lineage_ref: (row.lineage_ref ?? null) as string | null,
      }))
    : [
        {
          row_id: "destructive-summary",
          resource_type: "PUBLISHED_GRAPH_REF",
          resource_id: null,
          impact: `${numberFrom(destructiveImpact.published_graph_refs_affected)} published graph refs affected`,
          blocked: numberFrom(destructiveImpact.published_graph_refs_affected) > 0,
          lineage_ref: null,
        },
      ];
  const computedDestructiveImpact = {
    would_delete_classes: numberFrom(destructiveImpact.would_delete_classes),
    would_delete_properties: numberFrom(destructiveImpact.would_delete_properties),
    would_delete_relations: numberFrom(destructiveImpact.would_delete_relations),
    published_graph_refs_affected: numberFrom(destructiveImpact.published_graph_refs_affected),
  };
  if (
    !computedDestructiveImpact.would_delete_classes &&
    !computedDestructiveImpact.would_delete_properties &&
    !computedDestructiveImpact.would_delete_relations &&
    rawDestructiveRows.length
  ) {
    computedDestructiveImpact.would_delete_classes = rawDestructiveRows.filter((row) => row.resource_type === "CLASS").length;
    computedDestructiveImpact.would_delete_properties = rawDestructiveRows.filter((row) => row.resource_type === "PROPERTY").length;
    computedDestructiveImpact.would_delete_relations = rawDestructiveRows.filter((row) => row.resource_type === "RELATION").length;
    computedDestructiveImpact.published_graph_refs_affected = rawDestructiveRows.filter((row) => row.lineage_ref || row.affected_lineage_ref).length;
  }
  const rawCompatibilityStatus = String(
    payload.compatibility_status ??
      (payload.status === "BLOCKED"
        ? computedDestructiveImpact.published_graph_refs_affected > 0 || destructiveRows.some((row) => row.blocked)
          ? "DESTRUCTIVE_BLOCKED"
          : "CONFLICT_BLOCKED"
        : warnings.length > 0
          ? "WARNING_COMPATIBLE"
          : "COMPATIBLE"),
  );
  const compatibilityStatus =
    rawCompatibilityStatus === "WARNING"
      ? "WARNING_COMPATIBLE"
      : rawCompatibilityStatus === "BLOCKED"
        ? destructiveRows.some((row) => row.blocked)
          ? "DESTRUCTIVE_BLOCKED"
          : "CONFLICT_BLOCKED"
        : rawCompatibilityStatus;

  return {
    ...payload,
    job_id: String(payload.job_id ?? payload.id),
    project_id: String(payload.project_id ?? metadata?.project_id ?? MVP5_PROJECT_ID),
    status: String(payload.status ?? "BLOCKED") as OntologyImportDryRunJob["status"],
    format: "JSON",
    compatibility_status: compatibilityStatus as OntologyImportDryRunJob["compatibility_status"],
    package_metadata: metadata,
    summary: {
      create_count: numberFrom(summary.create_count),
      update_count: numberFrom(summary.update_count),
      delete_count: numberFrom(summary.delete_count),
      no_op_count: numberFrom(summary.no_op_count ?? summary.noop_count),
      conflict_count: numberFrom(summary.conflict_count ?? conflicts.length, conflicts.length),
      warning_count: numberFrom(summary.warning_count ?? warnings.length, warnings.length),
    },
    conflicts,
    warnings,
    destructive_impact: computedDestructiveImpact,
    destructive_impact_rows: destructiveRows,
    rollback_guidance: Array.isArray(payload.rollback_guidance)
      ? (payload.rollback_guidance as unknown[]).map(String)
      : ["Dry-run only; no ontology mutation was applied."],
    requires_confirmation: payload.requires_confirmation !== undefined ? Boolean(payload.requires_confirmation) : payload.confirmation_required !== undefined ? Boolean(payload.confirmation_required) : true,
    confirmation_text: (payload.confirmation_text ?? payload.confirmation_required_text ?? "Confirmation is recorded as future-gated evidence only.") as string,
    audit_preview: (payload.audit_preview ?? (payload.audit_event_ref ? { audit_event_ref: payload.audit_event_ref } : null)) as OntologyImportDryRunJob["audit_preview"],
    audit_event_ref: (payload.audit_event_ref ?? null) as OntologyImportDryRunJob["audit_event_ref"],
    dry_run_only: true,
    mutation_applied: false,
  } as OntologyImportDryRunJob;
}

function normalizeOperationsDashboard(payload: Record<string, unknown>): OperationsDashboardResponse {
  const healthRows = Array.isArray(payload.health)
    ? (payload.health as Array<Record<string, unknown>>)
    : [];
  const jobs: Array<Record<string, unknown>> = Array.isArray(payload.jobs)
    ? (payload.jobs as Array<Record<string, unknown>>).map((job) => ({
        ...job,
        job_id: String(job.job_id ?? job.id),
        attempts: job.attempts ?? job.retry_count ?? 0,
        max_attempts: job.max_attempts ?? 3,
      }))
    : [];
  const dlqRows = Array.isArray(payload.dlq_rows)
    ? (payload.dlq_rows as Array<Record<string, unknown>>).map((row) => ({
        ...row,
        dlq_id: String(row.dlq_id ?? row.id),
        failure_code: row.failure_code ?? row.reason,
        blocked_reasons: row.blocked_reasons ?? (row.reason ? [String(row.reason)] : []),
      }))
    : [];
  const costBudget = (payload.cost_budget ?? {}) as Record<string, unknown>;
  const observability = (payload.observability ?? {}) as Record<string, unknown>;

  return {
    ...payload,
    project_id: String(payload.project_id ?? MVP5_PROJECT_ID),
    job_health: {
      failed_count: healthRows.reduce((sum, row) => sum + Number(row.failed_count ?? 0), 0),
      retrying_count: jobs.filter((job) => job.status === "RETRYING").length,
      dlq_count: dlqRows.length,
      healthy_count: jobs.filter((job) => job.status === "SUCCEEDED").length,
    },
    jobs,
    dlq_rows: dlqRows,
    cost_budget: {
      ...costBudget,
      budget_status: costBudget.budget_status ?? costBudget.status ?? "DISABLED",
      budget_amount: costBudget.budget_amount ?? costBudget.monthly_budget_usd,
      estimated_spend: costBudget.estimated_spend ?? costBudget.current_spend_usd,
      token_limit: costBudget.token_limit ?? costBudget.token_budget,
      tokens_used: costBudget.tokens_used ?? costBudget.current_tokens,
    },
    observability: {
      ...observability,
      traces: observability.traces ?? observability.tracing ?? "NOT_CONFIGURED",
      logs: observability.logs ?? observability.logging ?? "UNAVAILABLE",
      structured_events: observability.structured_events ?? "AVAILABLE",
    },
    recent_events: payload.recent_events ?? [],
  } as unknown as OperationsDashboardResponse;
}

function normalizeBackup(payload: Record<string, unknown>): BackupSnapshot {
  return {
    ...payload,
    snapshot_id: String(payload.snapshot_id ?? payload.id),
    restore_eligibility: payload.restore_eligibility ?? {
      eligible: payload.restore_eligible,
      block_reasons: payload.restore_block_reason ? [String(payload.restore_block_reason)] : [],
    },
  } as BackupSnapshot;
}

function normalizeRetentionPolicy(payload: Record<string, unknown>): RetentionPolicy {
  const rules: Array<Record<string, unknown>> = Array.isArray(payload.rules)
    ? (payload.rules as Array<Record<string, unknown>>).map((rule, index) => ({
        ...rule,
        rule_id: String(rule.rule_id ?? `${payload.project_id ?? "project"}-retention-rule-${index + 1}`),
        mode: rule.mode ?? rule.action_mode,
      }))
    : [];

  return {
    ...payload,
    legal_hold_enabled:
      payload.legal_hold_enabled ?? rules.some((rule) => Boolean(rule.legal_hold)),
    rules,
  } as unknown as RetentionPolicy;
}

function normalizeRetentionDeletionDryRun(payload: Record<string, unknown>): RetentionDeletionDryRunResponse {
  const impactSummary = (payload.impact_summary ?? {}) as Record<string, unknown>;
  const lineageRows = Array.isArray(payload.lineage_impact)
    ? (payload.lineage_impact as Array<Record<string, unknown>>)
    : Array.isArray(payload.lineage_impacts)
      ? (payload.lineage_impacts as Array<Record<string, unknown>>).map((impact) => ({
          ...impact,
          resource_type: impact.resource_type ?? payload.requested_resource_type ?? "SOURCE",
          impact:
            impact.impact ??
            `published ${Array.isArray(impact.published_graph_version_ids) ? impact.published_graph_version_ids.length : 0}, candidates ${
              Array.isArray(impact.candidate_ids) ? impact.candidate_ids.length : 0
            }, evidence ${Array.isArray(impact.evidence_ids) ? impact.evidence_ids.length : 0}`,
          blocked: impact.blocked ?? impact.blocked_by_lineage ?? false,
        }))
      : [];

  return {
    ...payload,
    requested_resource_type: payload.requested_resource_type ?? "SOURCE",
    lineage_impact: lineageRows,
    impact_summary: {
      ...impactSummary,
      affected_count: impactSummary.affected_count ?? impactSummary.requested_count ?? 0,
      irreversible_count: impactSummary.irreversible_count ?? 0,
      destructive: impactSummary.destructive ?? Boolean(impactSummary.blocked_count),
    },
    requires_confirmation: payload.requires_confirmation ?? impactSummary.requires_confirmation ?? true,
  } as unknown as RetentionDeletionDryRunResponse;
}

function normalizeRestoreDryRun(payload: Record<string, unknown>): RestoreDryRunResponse {
  return {
    ...payload,
    status:
      payload.status ??
      (payload.eligible ? "RESTORE_DRY_RUN_AVAILABLE" : "RESTORE_BLOCKED"),
    block_reasons: payload.block_reasons ?? payload.blocked_reasons ?? [],
    restore_impact: payload.restore_impact ?? payload.impacted_resources ?? {},
  } as RestoreDryRunResponse;
}

function normalizeAuditEvent(payload: Record<string, unknown>): AuditEvent {
  return {
    ...payload,
    audit_event_id: String(payload.audit_event_id ?? payload.id),
    event_type: String(payload.event_type ?? payload.action ?? payload.category),
    severity: (payload.severity ?? "INFO") as OperationEventSeverity,
    actor: payload.actor ?? { principal_id: payload.actor_id },
    target: payload.target ?? { target_type: payload.target_type, target_id: payload.target_id },
  } as AuditEvent;
}

function createMockPreview(source: SourceData): SourcePreview {
  const baseName = source.file_name.replace(/\.[^.]+$/, "");

  return {
    source_id: source.id,
    columns: [
      {
        name: "name",
        data_type: "STRING",
        nullable: false,
        sample_values: [baseName],
      },
      {
        name: "source_type",
        data_type: "STRING",
        nullable: false,
        sample_values: [source.source_type],
      },
    ],
    rows: [
      {
        name: baseName,
        source_type: source.source_type,
      },
    ],
    row_count_sampled: 1,
    total_row_count: 1,
    sheet_name: source.source_type === "EXCEL" ? "Sheet1" : null,
    warnings: ["mock upload preview입니다. Backend preview API 연결 후 실제 sample rows로 대체됩니다."],
  };
}

function cloneGraph(graph: OntologyGraph): OntologyGraph {
  return {
    ...graph,
    nodes: [...graph.nodes],
    edges: [...graph.edges],
    properties: [...graph.properties],
    classes: graph.classes ? [...graph.classes] : graph.classes,
    relations: graph.relations ? [...graph.relations] : graph.relations,
  };
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "item";
}

function pickLatestVersion(versions: OntologyVersion[]): OntologyVersion | undefined {
  return [...versions].sort((a, b) => b.version - a.version)[0];
}

function buildDashboardSummary(projects: ProjectSummary[], sources: SourceData[], graphs: OntologyGraph[]): DashboardSummary {
  const recentActivity = [
    ...sources.map((source) => ({
      id: `source-${source.id}`,
      label: source.file_name,
      timestamp: source.uploaded_at,
      status: source.preview_status,
    })),
    ...projects.map((project) => ({
      id: `project-${project.id}`,
      label: project.name,
      timestamp: project.updated_at,
      status: project.status,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return {
    active_project_count: projects.filter((project) => project.status === "ACTIVE").length,
    source_count: sources.length,
    ontology_class_count: graphs.reduce((sum, graph) => sum + graph.nodes.length, 0),
    ontology_relation_count: graphs.reduce((sum, graph) => sum + graph.edges.length, 0),
    failed_source_count: sources.filter((source) => source.status === "FAILED").length,
    recent_activity: recentActivity,
  };
}

function buildMockDashboardSummary(): DashboardSummary {
  const graphs = mockProjectStore
    .map((project) => pickLatestVersion(mockOntologyVersionStore.filter((version) => version.project_id === project.id)))
    .filter((version): version is OntologyVersion => Boolean(version))
    .map((version) => mockOntologyGraphStore[version.id])
    .filter((graph): graph is OntologyGraph => Boolean(graph));

  return buildDashboardSummary(mockProjectStore, mockSourceStore, graphs);
}

async function buildActualDashboardSummary(): Promise<DashboardSummary> {
  const projects = await request<ProjectSummary[]>("/api/v1/projects");
  const sourceLists = await Promise.all(
    projects.map((project) => request<SourceData[]>(`/api/v1/projects/${project.id}/sources`).catch(() => [])),
  );
  const versionLists = await Promise.all(
    projects.map((project) =>
      request<OntologyVersion[]>(`/api/v1/projects/${project.id}/ontology/versions`).catch(() => []),
    ),
  );
  const latestVersions = versionLists
    .map((versions) => pickLatestVersion(versions))
    .filter((version): version is OntologyVersion => Boolean(version));
  const graphs = (
    await Promise.all(
      latestVersions.map((version) => request<OntologyGraph>(`/api/v1/ontology/versions/${version.id}/graph`).catch(() => null)),
    )
  ).filter((graph): graph is OntologyGraph => Boolean(graph));

  return buildDashboardSummary(projects, sourceLists.flat(), graphs);
}

function getMockGraph(versionId: string): OntologyGraph {
  const graph = mockOntologyGraphStore[versionId];

  if (!graph) {
    throw new Error("Ontology graph not found");
  }

  return graph;
}

function buildQueryString(filters: CandidateListFilters = {}): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

function buildAnyQueryString(filters: Record<string, unknown> = {}): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "ALL" && value !== "all") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

function assertMvp4Project(projectId: string) {
  if (projectId !== mockMvp4QualityMetrics.project_id) {
    throw new Error("MVP4 fixture not found");
  }
}

function filterReviewTasks(projectId: string, filters: ReviewTaskListFilters = {}): ReviewTaskListResponse {
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;
  const filtered = mockReviewTasks.filter((task) => {
    if (task.project_id !== projectId) {
      return false;
    }
    if (filters.assignment === "assigned-to-me" && !task.is_assigned_to_me) {
      return false;
    }
    if (filters.assignment === "unassigned" && task.assignee_id) {
      return false;
    }
    if (filters.status && filters.status !== "ALL" && task.review_status !== filters.status) {
      return false;
    }
    if (filters.validation_status && filters.validation_status !== "ALL" && task.validation_status !== filters.validation_status) {
      return false;
    }
    if (filters.confidence === "low" && task.confidence >= 0.7) {
      return false;
    }
    if (filters.confidence === "medium" && (task.confidence < 0.7 || task.confidence >= 0.9)) {
      return false;
    }
    if (filters.confidence === "high" && task.confidence < 0.9) {
      return false;
    }
    if (filters.source_id && task.source_id !== filters.source_id) {
      return false;
    }
    if (filters.extraction_job_id && task.extraction_job_id !== filters.extraction_job_id) {
      return false;
    }
    return true;
  });

  return {
    items: filtered.slice(offset, offset + limit),
    total_count: filtered.length,
    limit,
    offset,
  };
}

function filterCandidatesByJob<T extends CandidateEntity | CandidateRelation>(
  candidates: T[],
  jobId: string,
  filters: CandidateListFilters = {},
): T[] {
  const job = mockExtractionJobStore.find((item) => item.id === jobId);

  if (!job) {
    return [];
  }

  return candidates.filter((candidate) => {
    if (candidate.extraction_job_id !== jobId) {
      return false;
    }
    if (filters.source_id && candidate.source_id !== filters.source_id) {
      return false;
    }
    if (filters.ontology_version_id && candidate.ontology_version_id !== filters.ontology_version_id) {
      return false;
    }
    if (filters.validation_status && candidate.validation_status !== filters.validation_status) {
      return false;
    }
    if (filters.has_evidence !== undefined && (candidate.evidence_ids.length > 0) !== filters.has_evidence) {
      return false;
    }
    return candidate.project_id === job.project_id;
  });
}

function buildMockJobDetail(job: ExtractionJob): ExtractionJobDetail {
  return {
    ...job,
    model_runs: mockModelRunStore.filter((run) => run.extraction_job_id === job.id),
  };
}

function pickEvidenceSourceSegment(sourceId: string): SourceSegment | undefined {
  return mockSegmentStore[sourceId]?.[0];
}

function findMockSource(sourceId: string): SourceData | undefined {
  return mockSourceStore.find((source) => source.id === sourceId);
}

function getPrimaryClassId(versionId: string) {
  const graph = mockOntologyGraphStore[versionId];
  return graph?.classes?.[0]?.id ?? graph?.nodes[0]?.class_id ?? null;
}

function getSecondaryClassId(versionId: string) {
  const graph = mockOntologyGraphStore[versionId];
  return graph?.classes?.[1]?.id ?? graph?.nodes[1]?.class_id ?? getPrimaryClassId(versionId);
}

function getPrimaryRelationId(versionId: string) {
  const graph = mockOntologyGraphStore[versionId];
  return graph?.relations?.[0]?.id ?? graph?.edges[0]?.relation_id ?? null;
}

function buildMockEvidence(job: ExtractionJob, suffix: string, evidenceText: string, now: string): CandidateEvidence {
  const source = findMockSource(job.source_id);
  const segment = pickEvidenceSourceSegment(job.source_id);
  const sourceType = source?.source_type ?? "CSV";
  const isStructured = sourceType === "CSV" || sourceType === "EXCEL";

  return {
    id: `evidence-${job.id}-${suffix}`,
    source_id: job.source_id,
    source_segment_id: segment?.id ?? `segment-${job.source_id}-${suffix}`,
    source_type: sourceType,
    file_name: source?.file_name ?? "mock-source.csv",
    sheet_name: isStructured ? "Sheet1" : null,
    row_index: isStructured ? segment?.row_index ?? 1 : null,
    column_name: isStructured ? segment?.column_name ?? "name" : null,
    page_number: isStructured ? null : segment?.page_number ?? 1,
    section_title: isStructured ? null : segment?.section_title ?? "Mock Section",
    paragraph_id: isStructured ? null : segment?.paragraph_index ?? 1,
    chunk_id: isStructured ? null : segment?.chunk_index ?? 1,
    evidence_text: evidenceText,
    start_offset: isStructured ? null : 0,
    end_offset: isStructured ? null : evidenceText.length,
    metadata: {
      extraction_job_id: job.id,
      fixture_id: job.fixture_id ?? "default",
      locator: isStructured ? "Sheet1!A2" : "paragraph 1",
      segment_type: segment?.segment_type ?? (isStructured ? "ROW" : "CHUNK"),
    },
    created_at: now,
  };
}

function removeMockArtifactsForJob(jobId: string) {
  mockModelRunStore = mockModelRunStore.filter((run) => run.extraction_job_id !== jobId);
  mockCandidateEntityStore = mockCandidateEntityStore.filter((candidate) => candidate.extraction_job_id !== jobId);
  mockCandidateRelationStore = mockCandidateRelationStore.filter((candidate) => candidate.extraction_job_id !== jobId);
  mockCandidateEvidenceStore = Object.fromEntries(
    Object.entries(mockCandidateEvidenceStore).filter(([, evidence]) => evidence.metadata?.extraction_job_id !== jobId),
  );
}

function buildDedupeSummary(job: ExtractionJob, createdCandidateCount: number) {
  if (!job.retry_of_job_id) {
    return {
      retry_of_job_id: null,
      created_candidates: createdCandidateCount,
      reused_candidates: 0,
      skipped_duplicates: 0,
    };
  }

  return {
    retry_of_job_id: job.retry_of_job_id,
    created_candidates: 0,
    reused_candidates: createdCandidateCount,
    skipped_duplicates: createdCandidateCount,
  };
}

function createMockModelRun(
  job: ExtractionJob,
  now: string,
  status: ModelRun["status"],
  candidateCount: number,
  errorCode: string | null,
): ModelRun {
  return {
    id: `model-run-${job.id}`,
    extraction_job_id: job.id,
    provider: job.provider,
    model_name: job.model_name,
    prompt_version_id: job.prompt_version_id,
    ontology_version_id: job.ontology_version_id,
    input_token_count: status === "FAILED" ? 0 : 256,
    output_token_count: status === "FAILED" ? 0 : 128,
    cost_estimate: 0,
    raw_request: {
      source_id: job.source_id,
      ontology_version_id: job.ontology_version_id,
      prompt_version_id: job.prompt_version_id,
      fixture_id: job.fixture_id ?? "default",
      masking_version: "mock-v1",
    },
    raw_response: {
      fixture_id: job.fixture_id ?? "default",
      candidate_count: candidateCount,
      error_code: errorCode,
      dedupe: buildDedupeSummary(job, candidateCount),
    },
    masking_version: "mock-v1",
    redaction_summary: { redacted_keys: [], truncated_fields: ["segments.text"] },
    status,
    started_at: now,
    ended_at: now,
  };
}

function buildMockRunArtifacts(job: ExtractionJob, now: string) {
  const fixtureId = job.fixture_id ?? "default";
  const primaryEvidence = buildMockEvidence(job, "primary", "정보보호 기본 정책", now);
  const secondaryEvidence = buildMockEvidence(job, "secondary", "Security", now);
  const modelRunId = `model-run-${job.id}`;
  const primaryClassId = getPrimaryClassId(job.ontology_version_id);
  const secondaryClassId = getSecondaryClassId(job.ontology_version_id);
  const relationId = getPrimaryRelationId(job.ontology_version_id);
  const baseEntity = {
    extraction_job_id: job.id,
    project_id: job.project_id,
    source_id: job.source_id,
    ontology_version_id: job.ontology_version_id,
    model_run_id: modelRunId,
    prompt_version_id: job.prompt_version_id,
    review_status: "PENDING" as const,
    publish_status: "NOT_PUBLISHED" as const,
    created_at: now,
  };

  if (fixtureId === "missing") {
    return {
      status: "FAILED" as const,
      progress: 100,
      error_code: "MOCK_FIXTURE_NOT_FOUND",
      error_message: "Selected fixture is not available.",
      modelRun: createMockModelRun(job, now, "FAILED", 0, "MOCK_FIXTURE_NOT_FOUND"),
      evidences: {},
      entities: [],
      relations: [],
    };
  }

  const primaryEntity: CandidateEntity = {
    ...baseEntity,
    id: `candidate-entity-${job.id}-primary`,
    source_segment_id: primaryEvidence.source_segment_id,
    class_id: primaryClassId,
    entity_name: "정보보호 기본 정책",
    normalized_name: "information-security-policy",
    property_values: { policyCode: "POL-001", sourceFixture: fixtureId },
    confidence: 0.94,
    evidence_ids: [primaryEvidence.id],
    raw_payload: { client_candidate_id: `entity-primary-${fixtureId}` },
    validation_status: "PASSED",
    validation_codes: [],
  };

  const secondaryEntity: CandidateEntity = {
    ...baseEntity,
    id: `candidate-entity-${job.id}-secondary`,
    source_segment_id: secondaryEvidence.source_segment_id,
    class_id: secondaryClassId,
    entity_name: "Security",
    normalized_name: "security",
    property_values: { ownerName: "Security" },
    confidence: 0.91,
    evidence_ids: [secondaryEvidence.id],
    raw_payload: { client_candidate_id: `entity-secondary-${fixtureId}` },
    validation_status: "PASSED",
    validation_codes: [],
  };

  const relation: CandidateRelation = {
    ...baseEntity,
    id: `candidate-relation-${job.id}-owner`,
    source_segment_id: primaryEvidence.source_segment_id,
    source_candidate_entity_id: primaryEntity.id,
    relation_id: relationId,
    target_candidate_entity_id: secondaryEntity.id,
    confidence: 0.88,
    evidence_ids: [primaryEvidence.id, secondaryEvidence.id],
    raw_payload: { client_candidate_id: `relation-owner-${fixtureId}` },
    validation_status: "PASSED",
    validation_codes: [],
  };

  if (fixtureId === "partial_invalid") {
    const warningEntity: CandidateEntity = {
      ...baseEntity,
      id: `candidate-entity-${job.id}-missing-evidence`,
      source_segment_id: null,
      class_id: primaryClassId,
      entity_name: "권한 정책",
      normalized_name: "access-control-policy",
      property_values: {},
      confidence: 0.68,
      evidence_ids: [],
      raw_payload: { client_candidate_id: "entity-missing-evidence" },
      validation_status: "WARNING",
      validation_codes: ["MISSING_EVIDENCE"],
    };

    return {
      status: "PARTIAL_FAILED" as const,
      progress: 100,
      error_code: "PARTIAL_INVALID_FIXTURE",
      error_message: "Some candidates need evidence review.",
      modelRun: createMockModelRun(job, now, "SUCCESS", 2, "PARTIAL_INVALID_FIXTURE"),
      evidences: { [primaryEvidence.id]: primaryEvidence },
      entities: [primaryEntity, warningEntity],
      relations: [],
    };
  }

  if (fixtureId === "invalid_evidence_reference") {
    const brokenEvidenceId = `evidence-${job.id}-broken-reference`;
    const brokenSegmentId = `segment-${job.source_id}-broken-reference`;
    const brokenEntity: CandidateEntity = {
      ...baseEntity,
      id: `candidate-entity-${job.id}-broken-evidence`,
      source_segment_id: brokenSegmentId,
      class_id: primaryClassId,
      entity_name: "깨진 근거 후보",
      normalized_name: "broken-evidence-candidate",
      property_values: {},
      confidence: 0.51,
      evidence_ids: [brokenEvidenceId],
      raw_payload: { client_candidate_id: "entity-invalid-evidence-reference" },
      validation_status: "FAILED",
      validation_codes: ["INVALID_EVIDENCE_REFERENCE"],
    };

    return {
      status: "PARTIAL_FAILED" as const,
      progress: 100,
      error_code: "INVALID_EVIDENCE_REFERENCE",
      error_message: "An evidence reference could not be resolved.",
      modelRun: createMockModelRun(job, now, "SUCCESS", 2, "INVALID_EVIDENCE_REFERENCE"),
      evidences: { [primaryEvidence.id]: primaryEvidence },
      entities: [primaryEntity, brokenEntity],
      relations: [],
    };
  }

  return {
    status: "SUCCESS" as const,
    progress: 100,
    error_code: null,
    error_message: null,
    modelRun: createMockModelRun(job, now, "SUCCESS", 3, null),
    evidences: { [primaryEvidence.id]: primaryEvidence, [secondaryEvidence.id]: secondaryEvidence },
    entities: [primaryEntity, secondaryEntity],
    relations: [relation],
  };
}

function buildMockParseResponse(sourceId: string): SourceParseResponse {
  const segments = mockSegmentStore[sourceId] ?? [];
  const segmentTypes = [...new Set(segments.map((segment) => segment.segment_type))];

  return {
    source_id: sourceId,
    segment_count: segments.length,
    segment_types: segmentTypes,
    warnings: segments.length === 0 ? ["No deterministic segments are available for this source fixture."] : [],
  };
}

export const apiClient = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    if (USE_MOCK_API) {
      return delay(buildMockDashboardSummary());
    }

    return buildActualDashboardSummary();
  },

  async listProjects(): Promise<ProjectSummary[]> {
    if (USE_MOCK_API) {
      return delay(mockProjectStore);
    }

    return request<ProjectSummary[]>("/api/v1/projects");
  },

  async createProject(payload: ProjectCreateRequest): Promise<ProjectDetail> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      const project: ProjectDetail = {
        id: `project-${Date.now()}`,
        name: payload.name,
        description: payload.description ?? null,
        status: "DRAFT",
        current_ontology_version_id: null,
        created_at: now,
        updated_at: now,
        source_count: 0,
        ontology_version_count: 0,
      };

      mockProjectStore = [project, ...mockProjectStore];

      return delay(project);
    }

    return jsonRequest<ProjectDetail>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getProject(projectId: string): Promise<ProjectDetail> {
    if (USE_MOCK_API) {
      const project = mockProjectStore.find((item) => item.id === projectId);

      if (!project) {
        throw new Error("Project not found");
      }

      return delay(project);
    }

    return request<ProjectDetail>(`/api/v1/projects/${projectId}`);
  },

  async updateProject(projectId: string, payload: ProjectUpdateRequest): Promise<ProjectDetail> {
    if (USE_MOCK_API) {
      const project = mockProjectStore.find((item) => item.id === projectId);

      if (!project) {
        throw new Error("Project not found");
      }

      const updatedProject: ProjectDetail = {
        ...project,
        name: payload.name ?? project.name,
        description: payload.description === undefined ? project.description : payload.description,
        status: payload.status ?? project.status,
        updated_at: new Date().toISOString(),
      };

      mockProjectStore = mockProjectStore.map((item) => (item.id === projectId ? updatedProject : item));

      return delay(updatedProject);
    }

    return jsonRequest<ProjectDetail>(`/api/v1/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async listOntologyVersions(projectId: string): Promise<OntologyVersion[]> {
    if (USE_MOCK_API) {
      return delay(
        mockOntologyVersionStore
          .filter((version) => version.project_id === projectId)
          .sort((a, b) => b.version - a.version),
      );
    }

    return request<OntologyVersion[]>(`/api/v1/projects/${projectId}/ontology/versions`);
  },

  async createOntologyVersion(projectId: string, payload: OntologyVersionCreateRequest = {}): Promise<OntologyVersion> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      const nextVersion =
        (pickLatestVersion(mockOntologyVersionStore.filter((version) => version.project_id === projectId))?.version ?? 0) + 1;
      const version: OntologyVersion = {
        id: `onto-v${nextVersion}-${Date.now()}`,
        project_id: projectId,
        version: nextVersion,
        status: "DRAFT",
        created_at: now,
        published_at: null,
        created_by: payload.created_by ?? "dev-admin",
      };

      mockOntologyVersionStore = [version, ...mockOntologyVersionStore];
      mockOntologyGraphStore[version.id] = {
        version_id: version.id,
        version_status: "DRAFT",
        nodes: [],
        edges: [],
        properties: [],
        classes: [],
        relations: [],
      };
      mockProjectStore = mockProjectStore.map((project) =>
        project.id === projectId
          ? {
              ...project,
              current_ontology_version_id: version.id,
              ontology_version_count: project.ontology_version_count + 1,
              updated_at: now,
            }
          : project,
      );

      return delay(version);
    }

    return jsonRequest<OntologyVersion>(`/api/v1/projects/${projectId}/ontology/versions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getOntologyGraph(versionId: string): Promise<OntologyGraph> {
    if (USE_MOCK_API) {
      return delay(cloneGraph(getMockGraph(versionId)));
    }

    return request<OntologyGraph>(`/api/v1/ontology/versions/${versionId}/graph`);
  },

  async createOntologyClass(versionId: string, payload: OntologyClassCreateRequest): Promise<OntologyClass> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      const graph = getMockGraph(versionId);
      const classSlug = slugify(payload.name);
      const ontologyClass: OntologyClass = {
        id: `class-${classSlug}-${Date.now()}`,
        version_id: versionId,
        name: payload.name,
        label: payload.label || payload.name,
        description: payload.description ?? null,
        status: "ACTIVE",
        position: payload.position ?? { x: 140 + graph.nodes.length * 180, y: 140 + graph.nodes.length * 40 },
        created_at: now,
        updated_at: now,
      };

      mockOntologyGraphStore[versionId] = {
        ...graph,
        nodes: [
          ...graph.nodes,
          {
            id: ontologyClass.id,
            class_id: ontologyClass.id,
            label: ontologyClass.label,
            position: ontologyClass.position,
            status: ontologyClass.status,
          },
        ],
        classes: [...(graph.classes ?? []), ontologyClass],
      };

      return delay(ontologyClass);
    }

    return jsonRequest<OntologyClass>(`/api/v1/ontology/versions/${versionId}/classes`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateOntologyClass(classId: string, payload: OntologyClassUpdateRequest): Promise<OntologyClass> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      const graphEntry = Object.entries(mockOntologyGraphStore).find(([, graph]) =>
        (graph.classes ?? []).some((ontologyClass) => ontologyClass.id === classId),
      );

      if (!graphEntry) {
        throw new Error("Ontology class not found");
      }

      const [versionId, graph] = graphEntry;
      const currentClass = (graph.classes ?? []).find((ontologyClass) => ontologyClass.id === classId);

      if (!currentClass) {
        throw new Error("Ontology class not found");
      }

      const nextClass: OntologyClass = {
        ...currentClass,
        name: payload.name ?? currentClass.name,
        label: payload.label ?? currentClass.label,
        description: payload.description === undefined ? currentClass.description : payload.description,
        status: payload.status ?? currentClass.status,
        position: payload.position ?? currentClass.position,
        updated_at: now,
      };

      mockOntologyGraphStore[versionId] = {
        ...graph,
        nodes: graph.nodes.map((node) =>
          node.class_id === classId
            ? {
                ...node,
                label: nextClass.label,
                position: nextClass.position,
                status: nextClass.status,
              }
            : node,
        ),
        classes: (graph.classes ?? []).map((ontologyClass) =>
          ontologyClass.id === classId ? nextClass : ontologyClass,
        ),
      };

      return delay(nextClass);
    }

    return jsonRequest<OntologyClass>(`/api/v1/ontology/classes/${classId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async deleteOntologyClass(classId: string): Promise<OntologyClass> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      const graphEntry = Object.entries(mockOntologyGraphStore).find(([, graph]) =>
        (graph.classes ?? []).some((ontologyClass) => ontologyClass.id === classId),
      );

      if (!graphEntry) {
        throw new Error("Ontology class not found");
      }

      const [versionId, graph] = graphEntry;
      const currentClass = (graph.classes ?? []).find((ontologyClass) => ontologyClass.id === classId);

      if (!currentClass) {
        throw new Error("Ontology class not found");
      }

      const deletedClass: OntologyClass = {
        ...currentClass,
        status: "DELETED",
        updated_at: now,
      };

      mockOntologyGraphStore[versionId] = {
        ...graph,
        nodes: graph.nodes.filter((node) => node.class_id !== classId),
        edges: graph.edges.filter((edge) => edge.source_class_id !== classId && edge.target_class_id !== classId),
        properties: graph.properties.filter((property) => property.class_id !== classId),
        classes: (graph.classes ?? []).filter((ontologyClass) => ontologyClass.id !== classId),
        relations: (graph.relations ?? []).filter(
          (relation) => relation.domain_class_id !== classId && relation.range_class_id !== classId,
        ),
      };

      return delay(deletedClass);
    }

    return jsonRequest<OntologyClass>(`/api/v1/ontology/classes/${classId}`, {
      method: "DELETE",
    });
  },

  async createOntologyProperty(versionId: string, payload: OntologyPropertyCreateRequest): Promise<OntologyProperty> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      const graph = getMockGraph(versionId);
      const property: OntologyProperty = {
        id: `property-${slugify(payload.name)}-${Date.now()}`,
        version_id: versionId,
        class_id: payload.class_id,
        name: payload.name,
        label: payload.label || payload.name,
        description: payload.description ?? null,
        data_type: payload.data_type ?? "STRING",
        cardinality: payload.cardinality ?? "OPTIONAL",
        required: payload.required ?? false,
        status: "ACTIVE",
        created_at: now,
        updated_at: now,
      };

      mockOntologyGraphStore[versionId] = {
        ...graph,
        properties: [...graph.properties, property],
      };

      return delay(property);
    }

    return jsonRequest<OntologyProperty>(`/api/v1/ontology/versions/${versionId}/properties`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateOntologyProperty(propertyId: string, payload: OntologyPropertyUpdateRequest): Promise<OntologyProperty> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      const graphEntry = Object.entries(mockOntologyGraphStore).find(([, graph]) =>
        graph.properties.some((property) => property.id === propertyId),
      );

      if (!graphEntry) {
        throw new Error("Ontology property not found");
      }

      const [versionId, graph] = graphEntry;
      const currentProperty = graph.properties.find((property) => property.id === propertyId);

      if (!currentProperty) {
        throw new Error("Ontology property not found");
      }

      const nextProperty: OntologyProperty = {
        ...currentProperty,
        name: payload.name ?? currentProperty.name,
        label: payload.label ?? currentProperty.label,
        description: payload.description === undefined ? currentProperty.description ?? null : payload.description,
        data_type: payload.data_type ?? currentProperty.data_type,
        cardinality: payload.cardinality ?? currentProperty.cardinality,
        required: payload.required ?? currentProperty.required,
        status: payload.status ?? currentProperty.status,
        updated_at: now,
      };

      mockOntologyGraphStore[versionId] = {
        ...graph,
        properties: graph.properties.map((property) => (property.id === propertyId ? nextProperty : property)),
      };

      return delay(nextProperty);
    }

    return jsonRequest<OntologyProperty>(`/api/v1/ontology/properties/${propertyId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async deleteOntologyProperty(propertyId: string): Promise<OntologyProperty> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      const graphEntry = Object.entries(mockOntologyGraphStore).find(([, graph]) =>
        graph.properties.some((property) => property.id === propertyId),
      );

      if (!graphEntry) {
        throw new Error("Ontology property not found");
      }

      const [versionId, graph] = graphEntry;
      const currentProperty = graph.properties.find((property) => property.id === propertyId);

      if (!currentProperty) {
        throw new Error("Ontology property not found");
      }

      const deletedProperty: OntologyProperty = {
        ...currentProperty,
        status: "DELETED",
        updated_at: now,
      };

      mockOntologyGraphStore[versionId] = {
        ...graph,
        properties: graph.properties.filter((property) => property.id !== propertyId),
      };

      return delay(deletedProperty);
    }

    return jsonRequest<OntologyProperty>(`/api/v1/ontology/properties/${propertyId}`, {
      method: "DELETE",
    });
  },

  async createOntologyRelation(versionId: string, payload: OntologyRelationCreateRequest): Promise<OntologyRelation> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      const graph = getMockGraph(versionId);
      const relation: OntologyRelation = {
        id: `relation-${slugify(payload.name)}-${Date.now()}`,
        version_id: versionId,
        name: payload.name,
        label: payload.label || payload.name,
        description: payload.description ?? null,
        domain_class_id: payload.domain_class_id,
        range_class_id: payload.range_class_id,
        cardinality: payload.cardinality ?? "MANY_TO_MANY",
        required: payload.required ?? false,
        status: "ACTIVE",
        created_at: now,
        updated_at: now,
      };

      mockOntologyGraphStore[versionId] = {
        ...graph,
        edges: [
          ...graph.edges,
          {
            id: relation.id,
            relation_id: relation.id,
            source_class_id: relation.domain_class_id,
            target_class_id: relation.range_class_id,
            label: relation.label,
            cardinality: relation.cardinality,
            status: relation.status,
          },
        ],
        relations: [...(graph.relations ?? []), relation],
      };

      return delay(relation);
    }

    return jsonRequest<OntologyRelation>(`/api/v1/ontology/versions/${versionId}/relations`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateOntologyRelation(relationId: string, payload: OntologyRelationUpdateRequest): Promise<OntologyRelation> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      const graphEntry = Object.entries(mockOntologyGraphStore).find(([, graph]) =>
        (graph.relations ?? []).some((relation) => relation.id === relationId),
      );

      if (!graphEntry) {
        throw new Error("Ontology relation not found");
      }

      const [versionId, graph] = graphEntry;
      const currentRelation = (graph.relations ?? []).find((relation) => relation.id === relationId);

      if (!currentRelation) {
        throw new Error("Ontology relation not found");
      }

      const nextRelation: OntologyRelation = {
        ...currentRelation,
        name: payload.name ?? currentRelation.name,
        label: payload.label ?? currentRelation.label,
        description: payload.description === undefined ? currentRelation.description : payload.description,
        domain_class_id: payload.domain_class_id ?? currentRelation.domain_class_id,
        range_class_id: payload.range_class_id ?? currentRelation.range_class_id,
        cardinality: payload.cardinality ?? currentRelation.cardinality,
        required: payload.required ?? currentRelation.required,
        status: payload.status ?? currentRelation.status,
        updated_at: now,
      };

      mockOntologyGraphStore[versionId] = {
        ...graph,
        edges: graph.edges.map((edge) =>
          edge.relation_id === relationId
            ? {
                ...edge,
                source_class_id: nextRelation.domain_class_id,
                target_class_id: nextRelation.range_class_id,
                label: nextRelation.label,
                cardinality: nextRelation.cardinality,
                status: nextRelation.status,
              }
            : edge,
        ),
        relations: (graph.relations ?? []).map((relation) =>
          relation.id === relationId ? nextRelation : relation,
        ),
      };

      return delay(nextRelation);
    }

    return jsonRequest<OntologyRelation>(`/api/v1/ontology/relations/${relationId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async deleteOntologyRelation(relationId: string): Promise<OntologyRelation> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      const graphEntry = Object.entries(mockOntologyGraphStore).find(([, graph]) =>
        (graph.relations ?? []).some((relation) => relation.id === relationId),
      );

      if (!graphEntry) {
        throw new Error("Ontology relation not found");
      }

      const [versionId, graph] = graphEntry;
      const currentRelation = (graph.relations ?? []).find((relation) => relation.id === relationId);

      if (!currentRelation) {
        throw new Error("Ontology relation not found");
      }

      const deletedRelation: OntologyRelation = {
        ...currentRelation,
        status: "DELETED",
        updated_at: now,
      };

      mockOntologyGraphStore[versionId] = {
        ...graph,
        edges: graph.edges.filter((edge) => edge.relation_id !== relationId),
        relations: (graph.relations ?? []).filter((relation) => relation.id !== relationId),
      };

      return delay(deletedRelation);
    }

    return jsonRequest<OntologyRelation>(`/api/v1/ontology/relations/${relationId}`, {
      method: "DELETE",
    });
  },

  async listSources(projectId: string): Promise<SourceData[]> {
    if (USE_MOCK_API) {
      return delay(mockSourceStore.filter((source) => source.project_id === projectId));
    }

    return request<SourceData[]>(`/api/v1/projects/${projectId}/sources`);
  },

  async getSource(sourceId: string): Promise<SourceData> {
    if (USE_MOCK_API) {
      const source = mockSourceStore.find((item) => item.id === sourceId);

      if (!source) {
        throw new Error("Source not found");
      }

      return delay(source);
    }

    return request<SourceData>(`/api/v1/sources/${sourceId}`);
  },

  async getSourcePreview(sourceId: string): Promise<SourcePreview> {
    if (USE_MOCK_API) {
      const preview = mockPreviewStore[sourceId];

      if (!preview) {
        throw new Error("Source preview not available");
      }

      return delay(preview);
    }

    return request<SourcePreview>(`/api/v1/sources/${sourceId}/preview`);
  },

  async uploadSource(projectId: string, payload: SourceUploadRequest): Promise<SourceData> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      const isTabular = payload.source_type === "CSV" || payload.source_type === "EXCEL";
      const source: SourceData = {
        id: `source-${Date.now()}`,
        project_id: projectId,
        file_name: payload.display_name?.trim() || payload.file.name,
        source_type: payload.source_type,
        mime_type: payload.file.type || null,
        size_bytes: payload.file.size,
        status: "UPLOADED",
        preview_status: isTabular ? "READY" : "NOT_AVAILABLE",
        storage_uri: `minio://ontology-local/sources/${payload.file.name}`,
        uploaded_at: now,
        created_by: "dev-admin",
        metadata: {
          mock_upload: true,
        },
      };

      mockSourceStore = [source, ...mockSourceStore];
      mockProjectStore = mockProjectStore.map((project) =>
        project.id === projectId
          ? {
              ...project,
              source_count: project.source_count + 1,
              updated_at: now,
            }
          : project,
      );

      if (isTabular) {
        mockPreviewStore[source.id] = createMockPreview(source);
      }

      return delay(source);
    }

    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("source_type", payload.source_type);

    if (payload.display_name) {
      formData.append("display_name", payload.display_name);
    }

    return uploadRequest<SourceData>(`/api/v1/projects/${projectId}/sources/upload`, formData);
  },

  async runSourceProfile(sourceId: string): Promise<SourceProfile> {
    if (USE_MOCK_API) {
      const profile = mockProfileStore[sourceId];

      if (!profile) {
        throw new Error("Source profile fixture not found");
      }

      return delay(profile);
    }

    return jsonRequest<SourceProfile>(`/api/v1/sources/${sourceId}/profile`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async getSourceProfile(sourceId: string): Promise<SourceProfile> {
    if (USE_MOCK_API) {
      const profile = mockProfileStore[sourceId];

      if (!profile) {
        throw new Error("Source profile fixture not found");
      }

      return delay(profile);
    }

    return request<SourceProfile>(`/api/v1/sources/${sourceId}/profile`);
  },

  async parseSource(sourceId: string): Promise<SourceParseResponse> {
    if (USE_MOCK_API) {
      return delay(buildMockParseResponse(sourceId));
    }

    return jsonRequest<SourceParseResponse>(`/api/v1/sources/${sourceId}/parse`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async listSourceSegments(sourceId: string): Promise<SourceSegment[]> {
    if (USE_MOCK_API) {
      return delay(mockSegmentStore[sourceId] ?? []);
    }

    return request<SourceSegment[]>(`/api/v1/sources/${sourceId}/segments`);
  },

  async listPromptTemplates(projectId: string): Promise<PromptTemplate[]> {
    if (USE_MOCK_API) {
      return delay(mockPromptTemplates.filter((prompt) => prompt.project_id === projectId));
    }

    return request<PromptTemplate[]>(`/api/v1/projects/${projectId}/prompts`);
  },

  async listPromptVersions(promptId: string): Promise<PromptVersion[]> {
    if (USE_MOCK_API) {
      return delay(mockPromptVersions[promptId] ?? []);
    }

    return request<PromptVersion[]>(`/api/v1/prompts/${promptId}/versions`);
  },

  async createExtractionJob(projectId: string, payload: ExtractionJobCreateRequest): Promise<ExtractionJob> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      const job: ExtractionJob = {
        id: `job-${Date.now()}`,
        project_id: projectId,
        source_id: payload.source_id,
        ontology_version_id: payload.ontology_version_id,
        prompt_version_id: payload.prompt_version_id,
        provider: payload.provider ?? "mock",
        model_name: payload.model_name ?? "mock-deterministic",
        fixture_id: payload.fixture_id ?? "default",
        status: "PENDING",
        progress: 0,
        created_at: now,
        started_at: null,
        ended_at: null,
        error_code: null,
        error_message: null,
        retry_of_job_id: null,
      };

      mockExtractionJobStore = [job, ...mockExtractionJobStore];

      return delay(job);
    }

    return jsonRequest<ExtractionJob>(`/api/v1/projects/${projectId}/extraction-jobs`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async listExtractionJobs(projectId: string): Promise<ExtractionJob[]> {
    if (USE_MOCK_API) {
      return delay(mockExtractionJobStore.filter((job) => job.project_id === projectId));
    }

    return request<ExtractionJob[]>(`/api/v1/projects/${projectId}/extraction-jobs`);
  },

  async getExtractionJob(jobId: string): Promise<ExtractionJobDetail> {
    if (USE_MOCK_API) {
      const job = mockExtractionJobStore.find((item) => item.id === jobId);

      if (!job) {
        throw new Error("Extraction job fixture not found");
      }

      return delay(buildMockJobDetail(job));
    }

    return request<ExtractionJobDetail>(`/api/v1/extraction-jobs/${jobId}`);
  },

  async runExtractionJob(jobId: string): Promise<ExtractionJobDetail> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      let updatedJob: ExtractionJob | undefined;
      const originalJob = mockExtractionJobStore.find((job) => job.id === jobId);

      if (!originalJob) {
        throw new Error("Extraction job fixture not found");
      }

      removeMockArtifactsForJob(jobId);
      const artifacts = buildMockRunArtifacts(originalJob, now);

      mockExtractionJobStore = mockExtractionJobStore.map((job) => {
        if (job.id !== jobId) {
          return job;
        }

        updatedJob = {
          ...job,
          status: artifacts.status,
          progress: artifacts.progress,
          started_at: job.started_at ?? now,
          ended_at: now,
          error_code: artifacts.error_code,
          error_message: artifacts.error_message,
          candidate_entity_count: artifacts.entities.length,
          candidate_relation_count: artifacts.relations.length,
        };

        return updatedJob;
      });

      if (!updatedJob) {
        throw new Error("Extraction job fixture not found");
      }

      mockModelRunStore = [artifacts.modelRun, ...mockModelRunStore];
      mockCandidateEntityStore = [...artifacts.entities, ...mockCandidateEntityStore];
      mockCandidateRelationStore = [...artifacts.relations, ...mockCandidateRelationStore];
      mockCandidateEvidenceStore = { ...mockCandidateEvidenceStore, ...artifacts.evidences };

      return delay(buildMockJobDetail(updatedJob));
    }

    return jsonRequest<ExtractionJobDetail>(`/api/v1/extraction-jobs/${jobId}/run`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async retryExtractionJob(jobId: string): Promise<ExtractionJob> {
    if (USE_MOCK_API) {
      const original = mockExtractionJobStore.find((job) => job.id === jobId);

      if (!original) {
        throw new Error("Extraction job fixture not found");
      }

      const now = new Date().toISOString();
      const retryJob: ExtractionJob = {
        ...original,
        id: `job-retry-${Date.now()}`,
        status: "RETRYING",
        progress: 0,
        created_at: now,
        started_at: null,
        ended_at: null,
        error_code: null,
        error_message: null,
        retry_of_job_id: original.id,
      };

      mockExtractionJobStore = [retryJob, ...mockExtractionJobStore];

      return delay(retryJob);
    }

    return jsonRequest<ExtractionJob>(`/api/v1/extraction-jobs/${jobId}/retry`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async listCandidateEntities(jobId: string, filters: CandidateListFilters = {}): Promise<CandidateEntity[]> {
    if (USE_MOCK_API) {
      return delay(filterCandidatesByJob(mockCandidateEntityStore, jobId, filters));
    }

    return request<CandidateEntity[]>(`/api/v1/extraction-jobs/${jobId}/candidates/entities${buildQueryString(filters)}`);
  },

  async listCandidateRelations(jobId: string, filters: CandidateListFilters = {}): Promise<CandidateRelation[]> {
    if (USE_MOCK_API) {
      return delay(filterCandidatesByJob(mockCandidateRelationStore, jobId, filters));
    }

    return request<CandidateRelation[]>(`/api/v1/extraction-jobs/${jobId}/candidates/relations${buildQueryString(filters)}`);
  },

  async getCandidateEvidence(evidenceId: string): Promise<CandidateEvidence> {
    if (USE_MOCK_API) {
      const evidence = mockCandidateEvidenceStore[evidenceId];

      if (!evidence) {
        throw new Error("Candidate evidence fixture not found");
      }

      return delay(evidence);
    }

    return request<CandidateEvidence>(`/api/v1/candidate-evidence/${evidenceId}`);
  },

  async listReviewTasks(projectId: string, filters: ReviewTaskListFilters = {}): Promise<ReviewTaskListResponse> {
    if (USE_MOCK_API) {
      return delay(filterReviewTasks(projectId, filters));
    }

    return request<ReviewTaskListResponse>(
      `/api/v1/projects/${projectId}/review-tasks${buildAnyQueryString(filters as Record<string, unknown>)}`,
    );
  },

  async getReviewTask(reviewTaskId: string): Promise<ReviewTaskDetail> {
    if (USE_MOCK_API) {
      const task = mockReviewTaskDetails[reviewTaskId];

      if (!task) {
        throw new Error("Review task fixture not found");
      }

      return delay(task);
    }

    return request<ReviewTaskDetail>(`/api/v1/review-tasks/${reviewTaskId}`);
  },

  async listPublishCandidates(projectId: string): Promise<PublishCandidate[]> {
    if (USE_MOCK_API) {
      return delay(projectId === "project-corp-knowledge" ? mockPublishCandidates : []);
    }

    return request<PublishCandidate[]>(`/api/v1/projects/${projectId}/publish-candidates`);
  },

  async listPublishJobs(projectId: string): Promise<PublishJob[]> {
    if (USE_MOCK_API) {
      return delay(mockPublishJobs.filter((job) => job.project_id === projectId));
    }

    return request<PublishJob[]>(`/api/v1/projects/${projectId}/publish-jobs`);
  },

  async createPublishJob(projectId: string, candidates: PublishCandidate[]): Promise<PublishJob> {
    const selectedCandidates = candidates;
    const candidateRefs = selectedCandidates.map((candidate) => ({
      candidate_kind: candidate.candidate_kind,
      candidate_id: candidate.candidate_id,
    }));
    const ontologyVersionId = mockPublishJobs.find((job) => job.project_id === projectId)?.ontology_version_id;

    if (USE_MOCK_API) {
      const eligible = selectedCandidates.filter((candidate) => candidate.eligible);
      const job: PublishJob = {
        ...mockPublishJobs[0],
        id: `publish-job-${Date.now()}`,
        project_id: projectId,
        ontology_version_id: ontologyVersionId ?? mockPublishJobs[0].ontology_version_id,
        status: "PENDING",
        requested_by: mockPublishJobs[0].requested_by,
        candidate_refs: candidateRefs,
        eligible_count: eligible.length,
        published_entity_count: 0,
        published_relation_count: 0,
        skipped_count: selectedCandidates.length - eligible.length,
        skip_reasons: selectedCandidates.filter((candidate) => !candidate.eligible),
        published_graph_version_id: null,
        created_at: new Date().toISOString(),
        started_at: null,
        ended_at: null,
        error_code: null,
        error_message: null,
      };

      mockPublishJobs.unshift(job);
      return delay(job);
    }

    if (!ontologyVersionId) {
      throw new Error("Cannot create publish job without an ontology version id");
    }

    return jsonRequest<PublishJob>(`/api/v1/projects/${projectId}/publish-jobs`, {
      method: "POST",
      body: JSON.stringify({
        ontology_version_id: ontologyVersionId,
        candidate_refs: candidateRefs,
      }),
    });
  },

  async runPublishJob(publishJobId: string): Promise<PublishJob> {
    if (USE_MOCK_API) {
      const jobIndex = mockPublishJobs.findIndex((job) => job.id === publishJobId);

      if (jobIndex === -1) {
        throw new Error("Publish job fixture not found");
      }

      const updatedJob: PublishJob = {
        ...mockPublishJobs[jobIndex],
        status: "SUCCESS",
        published_entity_count: 1,
        published_relation_count: 1,
        published_graph_version_id: mockPublishedGraph.version.id,
        started_at: mockPublishJobs[jobIndex].started_at ?? new Date().toISOString(),
        ended_at: new Date().toISOString(),
      };

      mockPublishJobs[jobIndex] = updatedJob;
      return delay(updatedJob);
    }

    return jsonRequest<PublishJob>(`/api/v1/publish-jobs/${publishJobId}/run`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async getCurrentPublishedGraph(projectId: string): Promise<PublishedGraphSnapshot> {
    if (USE_MOCK_API) {
      if (projectId !== mockPublishedGraph.version.project_id) {
        throw new Error("Published graph fixture not found");
      }

      return delay(mockPublishedGraph);
    }

    return request<PublishedGraphSnapshot>(`/api/v1/projects/${projectId}/published-graph/current`);
  },

  async getQualitySummary(projectId: string): Promise<QualitySummary> {
    if (USE_MOCK_API) {
      if (projectId !== mockQualitySummary.project_id) {
        throw new Error("Quality summary fixture not found");
      }

      return delay(mockQualitySummary);
    }

    return request<QualitySummary>(`/api/v1/projects/${projectId}/quality/summary`);
  },

  async getQualityMetrics(projectId: string): Promise<QualityMetricsResponse> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      return delay(mockMvp4QualityMetrics);
    }

    return request<QualityMetricsResponse>(`/api/v1/projects/${projectId}/quality/metrics`);
  },

  async getQualityMetricDetail(projectId: string, metricId: string): Promise<QualityMetricDetail> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      const metric = mockMvp4QualityMetrics.metric_groups
        .flatMap((group) => group.metrics)
        .find((item) => item.metric_id === metricId);

      if (!metric) {
        throw new Error("Quality metric fixture not found");
      }

      return delay({
        project_id: projectId,
        metric,
        breakdown_rows: metric.breakdowns ?? [],
      });
    }

    return request<QualityMetricDetail>(`/api/v1/projects/${projectId}/quality/metrics/${metricId}`);
  },

  async listEvaluationDatasets(projectId: string): Promise<EvaluationDataset[]> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      return delay(mockMvp6DatasetStore.filter((dataset) => dataset.project_id === projectId));
    }

    const payload = await request<EvaluationDataset[] | { items?: EvaluationDataset[] }>(`/api/v1/projects/${projectId}/evaluation-datasets`);
    return unwrapItems(payload);
  },

  async createEvaluationDataset(projectId: string, payload: EvaluationDatasetCreateRequest): Promise<EvaluationDataset> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      const now = new Date().toISOString();
      const dataset: EvaluationDataset = {
        id: `eval-dataset-mvp6-${mockMvp6DatasetStore.length + 1}`,
        project_id: projectId,
        name: payload.name,
        description: payload.description ?? null,
        status: "DRAFT",
        sample_count: 0,
        gold_entity_count: 0,
        gold_relation_count: 0,
        owner_id: "qa-owner",
        active_version_id: null,
        created_at: now,
        updated_at: now,
        notes: "Created in mock mode for MVP6.1 evaluation workflow.",
      };
      mockMvp6DatasetStore = [dataset, ...mockMvp6DatasetStore];
      return delay(dataset);
    }

    return jsonRequest<EvaluationDataset>(`/api/v1/projects/${projectId}/evaluation-datasets`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getEvaluationDataset(datasetId: string): Promise<EvaluationDataset> {
    if (USE_MOCK_API) {
      const dataset =
        mockMvp6DatasetStore.find((item) => item.id === datasetId) ??
        mockMvp4Datasets.find((item) => item.id === datasetId);

      if (!dataset) {
        throw new Error("Evaluation dataset fixture not found");
      }

      return delay(dataset);
    }

    return request<EvaluationDataset>(`/api/v1/evaluation-datasets/${datasetId}`);
  },

  async listEvaluationSamples(datasetId: string): Promise<EvaluationSample[]> {
    if (USE_MOCK_API) {
      return delay(mockMvp6SampleStore.filter((sample) => sample.dataset_id === datasetId));
    }

    const payload = await request<EvaluationSample[] | { items?: EvaluationSample[] }>(`/api/v1/evaluation-datasets/${datasetId}/samples`);
    return unwrapItems(payload);
  },

  async createEvaluationSample(datasetId: string, payload: EvaluationSampleCreateRequest): Promise<EvaluationSample> {
    if (USE_MOCK_API) {
      const dataset = mockMvp6DatasetStore.find((item) => item.id === datasetId);

      if (!dataset) {
        throw new Error("Evaluation dataset fixture not found");
      }

      const sample: EvaluationSample = {
        id: `eval-sample-mvp6-${mockMvp6SampleStore.length + 1}`,
        project_id: dataset.project_id,
        dataset_id: dataset.id,
        sample_kind: payload.sample_kind,
        source_id: payload.source_id ?? null,
        source_segment_id: payload.source_segment_id ?? null,
        source_locator: payload.source_locator ?? null,
        title: payload.title,
        content_text: payload.content_text ?? null,
        metadata: payload.metadata ?? {},
        created_at: new Date().toISOString(),
      };
      mockMvp6SampleStore = [sample, ...mockMvp6SampleStore];
      mockMvp6DatasetStore = mockMvp6DatasetStore.map((item) =>
        item.id === dataset.id ? { ...item, sample_count: (item.sample_count ?? 0) + 1, updated_at: sample.created_at } : item,
      );
      return delay(sample);
    }

    return jsonRequest<EvaluationSample>(`/api/v1/evaluation-datasets/${datasetId}/samples`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async listGoldEntities(datasetId: string): Promise<GoldEntity[]> {
    if (USE_MOCK_API) {
      return delay(mockMvp6GoldEntityStore.filter((entity) => entity.dataset_id === datasetId));
    }

    const payload = await request<GoldEntity[] | { items?: GoldEntity[] }>(`/api/v1/evaluation-datasets/${datasetId}/gold-entities`);
    return unwrapItems(payload);
  },

  async createGoldEntity(datasetId: string, payload: GoldEntityCreateRequest): Promise<GoldEntity> {
    if (USE_MOCK_API) {
      const dataset = mockMvp6DatasetStore.find((item) => item.id === datasetId);

      if (!dataset) {
        throw new Error("Evaluation dataset fixture not found");
      }

      const entity: GoldEntity = {
        id: `gold-entity-mvp6-${mockMvp6GoldEntityStore.length + 1}`,
        project_id: dataset.project_id,
        dataset_id: dataset.id,
        sample_id: payload.sample_id,
        ontology_class_id: payload.ontology_class_id,
        label: payload.label,
        normalized_value: payload.normalized_value ?? null,
        evidence: payload.evidence,
        created_at: new Date().toISOString(),
      };
      mockMvp6GoldEntityStore = [entity, ...mockMvp6GoldEntityStore];
      mockMvp6DatasetStore = mockMvp6DatasetStore.map((item) =>
        item.id === dataset.id ? { ...item, gold_entity_count: (item.gold_entity_count ?? 0) + 1, updated_at: entity.created_at } : item,
      );
      return delay(entity);
    }

    return jsonRequest<GoldEntity>(`/api/v1/evaluation-datasets/${datasetId}/gold-entities`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async listGoldRelations(datasetId: string): Promise<GoldRelation[]> {
    if (USE_MOCK_API) {
      return delay(mockMvp6GoldRelationStore.filter((relation) => relation.dataset_id === datasetId));
    }

    const payload = await request<GoldRelation[] | { items?: GoldRelation[] }>(`/api/v1/evaluation-datasets/${datasetId}/gold-relations`);
    return unwrapItems(payload);
  },

  async createGoldRelation(datasetId: string, payload: GoldRelationCreateRequest): Promise<GoldRelation> {
    if (USE_MOCK_API) {
      const dataset = mockMvp6DatasetStore.find((item) => item.id === datasetId);

      if (!dataset) {
        throw new Error("Evaluation dataset fixture not found");
      }

      const relation: GoldRelation = {
        id: `gold-relation-mvp6-${mockMvp6GoldRelationStore.length + 1}`,
        project_id: dataset.project_id,
        dataset_id: dataset.id,
        sample_id: payload.sample_id,
        ontology_relation_id: payload.ontology_relation_id,
        source_gold_entity_id: payload.source_gold_entity_id,
        target_gold_entity_id: payload.target_gold_entity_id,
        evidence: payload.evidence,
        created_at: new Date().toISOString(),
      };
      mockMvp6GoldRelationStore = [relation, ...mockMvp6GoldRelationStore];
      mockMvp6DatasetStore = mockMvp6DatasetStore.map((item) =>
        item.id === dataset.id ? { ...item, gold_relation_count: (item.gold_relation_count ?? 0) + 1, updated_at: relation.created_at } : item,
      );
      return delay(relation);
    }

    return jsonRequest<GoldRelation>(`/api/v1/evaluation-datasets/${datasetId}/gold-relations`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async listEvaluationDatasetVersions(datasetId: string): Promise<EvaluationDatasetVersion[]> {
    if (USE_MOCK_API) {
      return delay(mockMvp4DatasetVersions.filter((version) => version.dataset_id === datasetId));
    }

    return request<EvaluationDatasetVersion[]>(`/api/v1/evaluation-datasets/${datasetId}/versions`);
  },

  async getEvaluationDatasetVersion(datasetVersionId: string): Promise<EvaluationDatasetVersion> {
    if (USE_MOCK_API) {
      const version = mockMvp4DatasetVersions.find((item) => item.id === datasetVersionId);

      if (!version) {
        throw new Error("Evaluation dataset version fixture not found");
      }

      return delay(version);
    }

    return request<EvaluationDatasetVersion>(`/api/v1/evaluation-dataset-versions/${datasetVersionId}`);
  },

  async listGoldenItems(datasetVersionId: string): Promise<GoldenSetItem[]> {
    if (USE_MOCK_API) {
      return delay(mockMvp4GoldenItems.filter((item) => item.dataset_version_id === datasetVersionId));
    }

    return request<GoldenSetItem[]>(`/api/v1/evaluation-dataset-versions/${datasetVersionId}/golden-items`);
  },

  async getPromptPerformanceSummary(projectId: string): Promise<PromptPerformanceSummary> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      return delay(mockMvp4PromptPerformance);
    }

    return request<PromptPerformanceSummary>(`/api/v1/projects/${projectId}/prompt-performance/summary`);
  },

  async listPromptExperiments(projectId: string): Promise<PromptExperiment[]> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      return delay(mockMvp4PromptExperiments.filter((experiment) => experiment.project_id === projectId));
    }

    return request<PromptExperiment[]>(`/api/v1/projects/${projectId}/prompt-experiments`);
  },

  async listEvaluationRuns(projectId: string): Promise<EvaluationRun[]> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      // Benchmark comparison reads existing evaluation runs; include the deterministic MVP6.3
      // benchmark fixtures (2 SUCCEEDED + 1 FAILED) so the comparison builder has >=2 eligible runs.
      const benchmarkRuns = mockMvp6BenchmarkRuns.filter((run) => run.project_id === projectId);
      const stored = mockMvp6EvaluationRunStore.filter((run) => run.project_id === projectId);
      const seen = new Set(stored.map((run) => run.id));
      return delay([...stored, ...benchmarkRuns.filter((run) => !seen.has(run.id))]);
    }

    const payload = await request<EvaluationRun[] | { items?: EvaluationRun[] }>(`/api/v1/projects/${projectId}/evaluation-runs`);
    return unwrapItems(payload);
  },

  async createEvaluationRun(projectId: string, payload: EvaluationRunCreateRequest): Promise<EvaluationRun> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      const run = buildMockMvp6EvaluationRun(projectId, payload, `eval-run-mvp6-deterministic-${mockMvp6RunCounter}`);
      mockMvp6RunCounter += 1;
      mockMvp6EvaluationRunStore = [run, ...mockMvp6EvaluationRunStore];
      return delay(run);
    }

    return jsonRequest<EvaluationRun>(`/api/v1/projects/${projectId}/evaluation-runs`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getEvaluationRun(runId: string): Promise<EvaluationRun> {
    if (USE_MOCK_API) {
      const run = mockMvp6EvaluationRunStore.find((item) => item.id === runId) ?? mockMvp4EvaluationRuns.find((item) => item.id === runId);

      if (!run) {
        throw new Error("Evaluation run fixture not found");
      }

      return delay(run);
    }

    return request<EvaluationRun>(`/api/v1/evaluation-runs/${runId}`);
  },

  async listEvaluationMetrics(runId: string): Promise<EvaluationMetric[]> {
    if (USE_MOCK_API) {
      const run = mockMvp6EvaluationRunStore.find((item) => item.id === runId);

      if (!run) {
        return delay([]);
      }

      return delay(mockMvp6Metrics.map((metric) => ({ ...metric, run_id: run.id })));
    }

    const payload = await request<EvaluationMetric[] | { items?: EvaluationMetric[] }>(`/api/v1/evaluation-runs/${runId}/metrics`);
    return unwrapItems(payload);
  },

  async listEvaluationErrorCases(runId: string): Promise<EvaluationErrorCase[]> {
    if (USE_MOCK_API) {
      const run = mockMvp6EvaluationRunStore.find((item) => item.id === runId);

      if (!run) {
        return delay([]);
      }

      return delay(
        mockMvp6ErrorCases.map((errorCase) => ({
          ...errorCase,
          run_id: run.id,
          project_id: run.project_id,
          dataset_id: run.dataset_id ?? errorCase.dataset_id,
        })),
      );
    }

    const payload = await request<EvaluationErrorCase[] | { items?: EvaluationErrorCase[] }>(`/api/v1/evaluation-runs/${runId}/errors`);
    return unwrapItems(payload);
  },

  async getEvaluationErrorCase(errorCaseId: string): Promise<EvaluationErrorCase> {
    if (USE_MOCK_API) {
      const errorCase = mockMvp6ErrorCases.find((item) => item.id === errorCaseId);

      if (!errorCase) {
        throw new Error("Evaluation error case fixture not found");
      }

      return delay(errorCase);
    }

    return request<EvaluationErrorCase>(`/api/v1/evaluation-error-cases/${errorCaseId}`);
  },

  async searchProject(projectId: string, filters: SearchRequest = {}): Promise<SearchResponse> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      return delay(buildMockSearchResponse(projectId, filters.query ?? "", filters.index_state));
    }

    return request<SearchResponse>(`/api/v1/projects/${projectId}/search${buildAnyQueryString(filters as Record<string, unknown>)}`);
  },

  async getVectorStatus(projectId: string): Promise<VectorAdapterState> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      return delay(mockMvp4VectorStatus);
    }

    return request<VectorAdapterState>(`/api/v1/projects/${projectId}/vector/status`);
  },

  async findSimilarEvidence(projectId: string, payload: SimilarEvidenceRequest): Promise<SimilarEvidenceResponse> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      return delay({
        ...mockMvp4SimilarEvidence,
        items: mockMvp4SimilarEvidence.items.slice(0, payload.limit ?? mockMvp4SimilarEvidence.items.length),
      });
    }

    return jsonRequest<SimilarEvidenceResponse>(`/api/v1/projects/${projectId}/similar-evidence`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async createRagAnswer(projectId: string, payload: RagAnswerRequest): Promise<RagAnswerResponse> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      return delay(buildMockRagAnswer(projectId, payload.question));
    }

    return jsonRequest<RagAnswerResponse>(`/api/v1/projects/${projectId}/rag/answers`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async explorePublishedGraph(projectId: string, filters: GraphExploreRequest = {}): Promise<GraphExploreResponse> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      const state = filters.max_hops && filters.max_hops > 3 ? "SAFE_TOO_LARGE" : filters.state ?? "READY";
      return delay(buildMockGraphExplore(projectId, state));
    }

    return request<GraphExploreResponse>(
      `/api/v1/projects/${projectId}/published-graph/explore${buildAnyQueryString(filters as Record<string, unknown>)}`,
    );
  },

  async getExternalApiDocs(projectId: string): Promise<ExternalApiDocsSurface> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      return delay(mockMvp4ExternalApiDocs);
    }

    const graph = await request<Record<string, unknown>>(`/api/v1/external/projects/${projectId}/published-graph/current`, {
      headers: { "X-Dev-Auth": "mvp4-dev" },
    });
    return {
      project_id: projectId,
      auth_mode: "DEV_AUTH",
      published_graph_version_ref:
        "published_graph_version_ref" in graph
          ? (graph.published_graph_version_ref as ExternalApiDocsSurface["published_graph_version_ref"])
          : undefined,
      read_only: true,
      dev_auth_missing: false,
      endpoints: mockMvp4ExternalApiDocs.endpoints,
    };
  },

  async getAdminOrganizationSummary(organizationId = DEFAULT_MVP5_ORGANIZATION_ID): Promise<OrganizationAdminSummary> {
    if (USE_MOCK_API) {
      if (organizationId !== mockMvp5OrganizationSummary.organization_id) {
        throw new Error("MVP5 organization admin fixture not found");
      }

      return delay(mockMvp5OrganizationSummary);
    }

    const payload = await request<Record<string, unknown>>(`/api/v1/admin/organizations/${organizationId}/summary`);
    return normalizeAdminSummary(payload);
  },

  async listAdminProjectSummaries(): Promise<ProjectAdminSummary[]> {
    if (USE_MOCK_API) {
      return delay(mockMvp5ProjectSummaries);
    }

    const organization = await this.getAdminOrganizationSummary();
    const projects = await request<ProjectSummary[]>("/api/v1/projects");
    const summaries = await Promise.all(
      projects.map(async (project) => {
        const payload = await request<Record<string, unknown>>(`/api/v1/admin/projects/${project.id}/summary`);
        return normalizeProjectAdminSummary(payload);
      }),
    );
    return summaries.filter((summary) => summary.organization_id === organization.organization_id);
  },

  async getAdminProjectSummary(projectId = MVP5_PROJECT_ID): Promise<ProjectAdminSummary> {
    if (USE_MOCK_API) {
      const project = mockMvp5ProjectSummaries.find((item) => item.project_id === projectId);

      if (!project) {
        throw new Error("MVP5 project admin fixture not found");
      }

      return delay(project);
    }

    const payload = await request<Record<string, unknown>>(`/api/v1/admin/projects/${projectId}/summary`);
    return normalizeProjectAdminSummary(payload);
  },

  async listAdminRoleAssignments(projectId: string): Promise<RoleAssignment[]> {
    if (USE_MOCK_API) {
      return delay(mockMvp5RoleAssignments.filter((assignment) => !assignment.project_id || assignment.project_id === projectId));
    }

    const payload = await request<RoleAssignment[] | { items?: RoleAssignment[] }>(
      `/api/v1/admin/projects/${projectId}/role-assignments`,
    );
    return unwrapItems(payload).map((item) => normalizeRoleAssignment(item as unknown as Record<string, unknown>));
  },

  async checkAdminPermission(payload: PermissionCheckRequest): Promise<PermissionCheckResponse> {
    if (USE_MOCK_API) {
      return delay(buildMockMvp5PermissionCheck(payload));
    }

    return jsonRequest<PermissionCheckResponse>("/api/v1/admin/permission-checks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async listAdminCredentials(projectId: string): Promise<CredentialView[]> {
    if (USE_MOCK_API) {
      return delay(mockMvp5Credentials.filter((credential) => credential.project_id === projectId));
    }

    const [serviceAccountsPayload, apiKeysPayload] = await Promise.all([
      request<CredentialView[] | { items?: CredentialView[] }>(`/api/v1/admin/projects/${projectId}/service-accounts`),
      request<CredentialView[] | { items?: CredentialView[] }>(`/api/v1/admin/projects/${projectId}/api-keys`),
    ]);
    const serviceAccounts = unwrapItems(serviceAccountsPayload).map((item) => normalizeCredential(item as unknown as Record<string, unknown>));
    const apiKeys = unwrapItems(apiKeysPayload).map((item) => normalizeCredential(item as unknown as Record<string, unknown>));
    return [...serviceAccounts, ...apiKeys];
  },

  async createAdminServiceAccount(projectId: string): Promise<CredentialCreateResponse> {
    if (USE_MOCK_API) {
      return delay(buildMockCredentialCreateResponse(projectId));
    }

    const payload = await jsonRequest<CredentialCreateResponse>(`/api/v1/admin/projects/${projectId}/service-accounts`, {
      method: "POST",
      body: JSON.stringify({
        name: "New dry-run service account",
        scopes: ["PROJECT_ADMIN_READ", "QUALITY_READ"],
        reason: "Wave24 frontend smoke create assertion",
      }),
    });
    return {
      ...payload,
      credential: normalizeCredential(payload.credential as unknown as Record<string, unknown>),
    };
  },

  async revokeAdminCredential(credentialId: string, reason: string): Promise<CredentialView> {
    if (USE_MOCK_API) {
      const credential = mockMvp5Credentials.find((item) => item.credential_id === credentialId) ?? mockMvp5Credentials[0];
      return delay({
        ...credential,
        status: "REVOKED",
        revoked_at: "2026-06-19T09:05:00.000Z",
        audit_event_refs: [...(credential.audit_event_refs ?? []), { audit_event_id: "audit-credential-revoke-confirm", event_type: "credential.revoked" }],
      });
    }

    const kindPath = credentialId.includes("service") ? "service-accounts" : "api-keys";
    const payload = await jsonRequest<CredentialView>(`/api/v1/admin/${kindPath}/${credentialId}/revoke`, {
      method: "POST",
      body: JSON.stringify({ reason, confirmation: "REVOKE" }),
    });
    return normalizeCredential(payload as unknown as Record<string, unknown>);
  },

  async getAutomaticApprovalPolicy(projectId: string): Promise<AutomaticApprovalPolicyDocument> {
    if (USE_MOCK_API) {
      if (projectId !== mockMvp5AutomaticApprovalPolicy.project_id) {
        throw new Error("MVP5 automatic approval policy fixture not found");
      }

      return delay(mockMvp5AutomaticApprovalPolicy);
    }

    const payload = await request<AutomaticApprovalPolicyDocument[] | { items?: AutomaticApprovalPolicyDocument[] }>(
      `/api/v1/admin/projects/${projectId}/automatic-approval-policies`,
    );
    const policy = unwrapItems(payload)[0];

    if (!policy) {
      throw new Error("No automatic approval policy returned by API");
    }

    return normalizePolicy(policy as unknown as Record<string, unknown>);
  },

  async evaluateAutomaticApprovalPolicy(policyId: string): Promise<PolicyEvaluationResponse> {
    if (USE_MOCK_API) {
      return delay({ ...mockMvp5PolicyEvaluation, policy_id: policyId });
    }

    const payload = await jsonRequest<PolicyEvaluationResponse>(`/api/v1/admin/automatic-approval-policies/${policyId}/evaluate`, {
      method: "POST",
      body: JSON.stringify({ mode: "DRY_RUN" }),
    });
    return normalizePolicyEvaluation(payload as unknown as Record<string, unknown>);
  },

  async diffAutomaticApprovalPolicy(policyId: string): Promise<PolicyDiffResponse> {
    if (USE_MOCK_API) {
      return delay({ ...mockMvp5PolicyDiff, policy_id: policyId });
    }

    const payload = await jsonRequest<PolicyDiffResponse>(`/api/v1/admin/automatic-approval-policies/${policyId}/diff`, {
      method: "POST",
      body: JSON.stringify({ target_mode: "DRY_RUN", reason: "Wave24 frontend dry-run diff preview" }),
    });
    return normalizePolicyDiff(payload as unknown as Record<string, unknown>);
  },

  async previewAutomaticApprovalEnforce(policyId: string): Promise<EnforcePreviewResponse> {
    if (USE_MOCK_API) {
      return delay({ ...mockMvp5EnforcePreview, policy_id: policyId });
    }

    const payload = await jsonRequest<EnforcePreviewResponse>(`/api/v1/admin/automatic-approval-policies/${policyId}/enforce-preview`, {
      method: "POST",
      body: JSON.stringify({
        target_mode: "ENFORCE",
        reason: "Wave24 gated preview",
        confirmation: "PREVIEW_ENFORCE",
      }),
    });
    return normalizeEnforcePreview(payload as unknown as Record<string, unknown>);
  },

  async createOntologyExport(projectId: string): Promise<OntologyExportJob> {
    if (USE_MOCK_API) {
      return delay({ ...mockMvp5ExportJobs[0], project_id: projectId });
    }

    const requestInit = {
      method: "POST",
      body: JSON.stringify({
        format: "JSON",
        include_published_graph_refs: true,
      }),
    };
    const payload = await jsonRequest<Record<string, unknown>>(`/api/v1/admin/projects/${projectId}/ontology-export`, requestInit).catch(() =>
      jsonRequest<Record<string, unknown>>(`/api/v1/admin/projects/${projectId}/ontology-exports`, requestInit),
    );
    return normalizeExportJob(payload);
  },

  async getOntologyExport(jobId: string): Promise<OntologyExportJob> {
    if (USE_MOCK_API) {
      const job = mockMvp5ExportJobs.find((item) => item.job_id === jobId) ?? mockMvp5ExportJobs[0];
      return delay(job);
    }

    const payload = await request<Record<string, unknown>>(`/api/v1/admin/ontology-exports/${jobId}`);
    return normalizeExportJob(payload);
  },

  async listOntologyExports(projectId: string): Promise<OntologyExportJob[]> {
    if (USE_MOCK_API) {
      return delay(mockMvp5ExportJobs.filter((job) => job.project_id === projectId));
    }

    const payload = await request<Record<string, unknown>>(`/api/v1/admin/projects/${projectId}/ontology-export`);
    const job = normalizeExportJob(payload);
    return [job];
  },

  async getOntologyExportDownload(jobId: string): Promise<OntologyExportDownload> {
    if (USE_MOCK_API) {
      return delay({ ...mockMvp5ExportDownload, job_id: jobId });
    }

    const payload = await request<Record<string, unknown>>(`/api/v1/admin/ontology-exports/${jobId}/download`).catch(() =>
      request<Record<string, unknown>>(`/api/v1/admin/ontology-exports/${jobId}`),
    );
    const metadata = normalizePackageMetadata((payload.package_metadata ?? payload.metadata) as Record<string, unknown> | null);

    if (!metadata) {
      throw new Error("Ontology export download metadata missing package metadata.");
    }

    return {
      ...payload,
      job_id: String(payload.job_id ?? jobId),
      download_url: (payload.download_url ?? payload.download_ref ?? null) as string | null,
      expires_at: (payload.expires_at ?? null) as string | null,
      content_type: String(payload.content_type ?? "application/json"),
      file_name: (payload.file_name ?? payload.filename ?? null) as string | null,
      checksum: (payload.checksum ?? metadata.checksum ?? null) as string | null,
      package_metadata: metadata,
    };
  },

  async createOntologyImportDryRun(projectId: string, payload: OntologyImportCreateRequest = { format: "JSON", mode: "DRY_RUN" }): Promise<OntologyImportDryRunJob> {
    if (USE_MOCK_API) {
      return delay({ ...mockMvp5ImportDryRun, project_id: projectId });
    }

    const packagePayload = payload.package_payload ?? buildDefaultOntologyPackage(projectId);
    const requestBody = JSON.stringify({
      mode: "DRY_RUN",
      package: packagePayload,
    });
    const response = await jsonRequest<Record<string, unknown>>(`/api/v1/admin/projects/${projectId}/ontology-import/dry-run`, {
      method: "POST",
      body: requestBody,
    });
    return normalizeImportDryRun(response, packagePayload);
  },

  async getOntologyImportDryRun(jobId: string): Promise<OntologyImportDryRunJob> {
    if (USE_MOCK_API) {
      return delay({ ...mockMvp5ImportDryRun, job_id: jobId });
    }

    const payload = await request<Record<string, unknown>>(`/api/v1/admin/ontology-imports/${jobId}`);
    return normalizeImportDryRun(payload);
  },

  async getOperationsDashboard(projectId: string): Promise<OperationsDashboardResponse> {
    if (USE_MOCK_API) {
      if (projectId !== mockMvp5OperationsDashboard.project_id) {
        throw new Error("MVP5 operations fixture not found");
      }

      return delay(mockMvp5OperationsDashboard);
    }

    const payload = await request<Record<string, unknown>>(`/api/v1/admin/projects/${projectId}/operations/dashboard`);
    return normalizeOperationsDashboard(payload);
  },

  async getRetentionPolicy(projectId: string): Promise<RetentionPolicy> {
    if (USE_MOCK_API) {
      if (projectId !== mockMvp5RetentionPolicy.project_id) {
        throw new Error("MVP5 retention policy fixture not found");
      }

      return delay(mockMvp5RetentionPolicy);
    }

    const payload = await request<Record<string, unknown>>(`/api/v1/admin/projects/${projectId}/retention-policy`);
    return normalizeRetentionPolicy(payload);
  },

  async runRetentionDeletionDryRun(projectId: string): Promise<RetentionDeletionDryRunResponse> {
    if (USE_MOCK_API) {
      return delay({ ...mockMvp5DeletionDryRun, project_id: projectId });
    }

    const payload = await jsonRequest<RetentionDeletionDryRunResponse>(`/api/v1/admin/projects/${projectId}/retention/deletion-dry-run`, {
      method: "POST",
      body: JSON.stringify({
        resource_type: "SOURCE",
        resource_ids: ["source-security-policy"],
        reason: "Wave24 deletion dry-run preview",
      }),
    });
    return normalizeRetentionDeletionDryRun(payload as unknown as Record<string, unknown>);
  },

  async listBackupSnapshots(projectId: string): Promise<BackupSnapshot[]> {
    if (USE_MOCK_API) {
      return delay(mockMvp5Backups.filter((backup) => backup.project_id === projectId));
    }

    const payload = await request<BackupSnapshot[] | { items?: BackupSnapshot[] }>(
      `/api/v1/admin/projects/${projectId}/backup-snapshots`,
    );
    return unwrapItems(payload).map((item) => normalizeBackup(item as unknown as Record<string, unknown>));
  },

  async runBackupRestoreDryRun(snapshotId: string): Promise<RestoreDryRunResponse> {
    if (USE_MOCK_API) {
      return delay(buildMockRestoreDryRun(snapshotId));
    }

    const payload = await jsonRequest<RestoreDryRunResponse>(`/api/v1/admin/backup-snapshots/${snapshotId}/restore-dry-run`, {
      method: "POST",
      body: JSON.stringify({ reason: "Wave24 restore dry-run preview" }),
    });
    return normalizeRestoreDryRun(payload as unknown as Record<string, unknown>);
  },

  async listAdminAuditEvents(projectId: string): Promise<AuditEvent[]> {
    if (USE_MOCK_API) {
      return delay(mockMvp5AuditEvents.filter((event) => event.project_id === projectId));
    }

    const payload = await request<AuditEvent[] | { items?: AuditEvent[] }>(
      `/api/v1/admin/projects/${projectId}/audit-events`,
    );
    return unwrapItems(payload).map((item) => normalizeAuditEvent(item as unknown as Record<string, unknown>));
  },

  async listModelRuns(jobId: string): Promise<ModelRun[]> {
    if (USE_MOCK_API) {
      return delay(mockModelRunStore.filter((run) => run.extraction_job_id === jobId));
    }

    const job = await request<ExtractionJobDetail>(`/api/v1/extraction-jobs/${jobId}`);
    return job.model_runs ?? [];
  },

  // ---- MVP6.2 Active Learning / Learning Insights ----

  async getLearningSummary(projectId: string): Promise<LearningSignalSummaryResponse> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      return delay(buildMockLearningSummary(mockLearningSuggestionStore, mockLearningCorrectionPatterns));
    }

    return request<LearningSignalSummaryResponse>(`/api/v1/projects/${projectId}/learning-signals/summary`);
  },

  async listLearningCorrectionPatterns(projectId: string): Promise<CorrectionPattern[]> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      return delay(mockLearningCorrectionPatterns.filter((pattern) => pattern.project_id === projectId));
    }

    const payload = await request<CorrectionPattern[] | { items?: CorrectionPattern[] }>(
      `/api/v1/projects/${projectId}/learning-signals/correction-patterns`,
    );
    return unwrapItems(payload);
  },

  async listLearningPromptSuggestions(projectId: string): Promise<PromptSuggestion[]> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      return delay(mockLearningSuggestionStore.filter((suggestion) => suggestion.project_id === projectId));
    }

    const payload = await request<PromptSuggestion[] | { items?: PromptSuggestion[] }>(
      `/api/v1/projects/${projectId}/learning-signals/prompt-suggestions`,
    );
    return unwrapItems(payload);
  },

  async listLearningAutoApprovalCandidates(projectId: string): Promise<AutoApprovalCandidatePreview[]> {
    if (USE_MOCK_API) {
      assertMvp4Project(projectId);
      return delay(mockLearningAutoApprovalCandidates.filter((preview) => preview.project_id === projectId));
    }

    const payload = await request<AutoApprovalCandidatePreview[] | { items?: AutoApprovalCandidatePreview[] }>(
      `/api/v1/projects/${projectId}/learning-signals/auto-approval-candidates`,
    );
    return unwrapItems(payload);
  },

  async decideLearningSuggestion(
    suggestionId: string,
    payload: SuggestionDecisionRequest,
  ): Promise<SuggestionDecisionResponse> {
    if (USE_MOCK_API) {
      const suggestion = mockLearningSuggestionStore.find((item) => item.id === suggestionId);
      if (!suggestion) {
        throw new SuggestionDecisionError("Prompt suggestion was not found.", "PROMPT_SUGGESTION_NOT_FOUND", 404);
      }
      if (suggestion.state !== "SUGGESTED") {
        throw new SuggestionDecisionError(
          "Only SUGGESTED prompt suggestions can receive a decision command.",
          "PROMPT_SUGGESTION_DECISION_CONFLICT",
          409,
          suggestion.state,
        );
      }
      if (payload.decision === "DISMISS" && !payload.dismiss_reason_code) {
        throw new SuggestionDecisionError(
          "dismiss_reason_code is required when decision is DISMISS.",
          "DISMISS_REASON_REQUIRED",
          400,
        );
      }
      if (payload.decision === "ACCEPT" && payload.dismiss_reason_code) {
        throw new SuggestionDecisionError(
          "dismiss_reason_code is only allowed when decision is DISMISS.",
          "DISMISS_REASON_NOT_ALLOWED",
          400,
        );
      }

      const previousState = suggestion.state;
      const newState = payload.decision === "ACCEPT" ? "ACCEPTED" : "DISMISSED";
      const decidedAt = new Date().toISOString();
      mockLearningDecisionCounter += 1;
      const intendedNextAction: SuggestionIntendedNextAction =
        payload.intended_next_action ?? (payload.decision === "ACCEPT" ? "USE_IN_NEXT_PROMPT_DRAFT" : "NO_ACTION");
      const auditNote: SuggestionDecisionAuditNote = {
        id: `${suggestionId}-decision-${mockLearningDecisionCounter}`,
        suggestion_id: suggestionId,
        project_id: suggestion.project_id,
        actor_id: "dev-user",
        actor_role: "PROJECT_ADMIN",
        decision: payload.decision,
        dismiss_reason_code: payload.dismiss_reason_code ?? null,
        note: payload.note ?? null,
        intended_next_action: intendedNextAction,
        decided_at: decidedAt,
        source_learning_signal_ids: suggestion.source_learning_signal_ids,
        target_prompt_version_id: suggestion.target_prompt_version_id,
        suggestion_snapshot: {
          suggestion_kind: suggestion.suggestion_kind,
          title: suggestion.title,
          preview_text: suggestion.preview_text,
        },
        mutation_guard: {
          prompt_version_mutated: false,
          candidate_graph_mutated: false,
          published_graph_mutated: false,
          auto_approval_policy_mutated: false,
          extraction_job_started: false,
          evaluation_run_started: false,
        },
      };
      mockLearningSuggestionStore = mockLearningSuggestionStore.map((item) =>
        item.id === suggestionId
          ? { ...item, state: newState, updated_at: decidedAt, decision_audit_note: auditNote }
          : item,
      );
      return delay({
        suggestion_id: suggestionId,
        project_id: suggestion.project_id,
        previous_state: previousState,
        new_state: newState,
        decision_audit_note: auditNote,
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/learning-signal-suggestions/${suggestionId}/decisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const raw = (await response.json().catch(() => null)) as
        | { error?: { code?: string; message?: string; details?: { state?: string } }; code?: string; message?: string; details?: { state?: string } }
        | null;
      const apiError = raw?.error ?? raw ?? undefined;
      throw new SuggestionDecisionError(
        apiError?.message ?? `Suggestion decision failed: ${response.status}`,
        apiError?.code ?? "SUGGESTION_DECISION_FAILED",
        response.status,
        apiError?.details?.state,
      );
    }
    return response.json() as Promise<SuggestionDecisionResponse>;
  },

  // ---- MVP6.3 Benchmark Comparison / Confusion Matrix (read-only aggregation) ----

  async listBenchmarkComparisons(
    projectId: string,
    filters: { group_by?: string; limit?: number; cursor?: string } = {},
  ): Promise<BenchmarkComparisonListResponse> {
    if (USE_MOCK_API) {
      const items: BenchmarkComparisonSummary[] = mockMvp6BenchmarkStore
        .filter((comparison) => comparison.project_id === projectId)
        .filter((comparison) => !filters.group_by || comparison.group_by === filters.group_by)
        .map((comparison) => ({
          id: comparison.id,
          project_id: comparison.project_id,
          group_by: comparison.group_by,
          baseline_run_id: comparison.baseline_run_id,
          run_count: comparison.runs.length,
          comparability_flags: comparison.comparability_summary.flags,
          generated_at: comparison.generated_at,
        }));
      return delay({ items, next_cursor: null });
    }

    const query = buildAnyQueryString({ group_by: filters.group_by, limit: filters.limit, cursor: filters.cursor });
    return request<BenchmarkComparisonListResponse>(
      `/api/v1/projects/${projectId}/benchmark-comparisons${query}`,
    );
  },

  async createBenchmarkComparison(
    projectId: string,
    payload: BenchmarkComparisonCreateRequest,
  ): Promise<BenchmarkComparison> {
    if (USE_MOCK_API) {
      const uniqueRunIds = [...new Set(payload.run_ids)];
      if (uniqueRunIds.length < 2) {
        throw new BenchmarkComparisonError(
          "At least two eligible terminal-success runs are required for a comparison.",
          "BENCHMARK_INSUFFICIENT_RUNS",
          400,
        );
      }
      mockMvp6BenchmarkCounter += 1;
      const comparison = buildMockMvp6BenchmarkComparison(projectId, {
        id: `${MVP6_BENCHMARK_COMPARISON_ID}-${mockMvp6BenchmarkCounter}`,
        groupBy: payload.group_by,
        baselineRunId: payload.baseline_run_id ?? undefined,
        metricNames: payload.metric_names ?? undefined,
      });
      mockMvp6BenchmarkStore = [comparison, ...mockMvp6BenchmarkStore];
      return delay(comparison);
    }

    return jsonRequest<BenchmarkComparison>(`/api/v1/projects/${projectId}/benchmark-comparisons`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getBenchmarkComparison(comparisonId: string): Promise<BenchmarkComparison> {
    if (USE_MOCK_API) {
      const comparison = mockMvp6BenchmarkStore.find((item) => item.id === comparisonId);
      if (!comparison) {
        throw new BenchmarkComparisonError(
          "Benchmark comparison was not found.",
          "BENCHMARK_COMPARISON_NOT_FOUND",
          404,
        );
      }
      return delay(comparison);
    }

    return request<BenchmarkComparison>(`/api/v1/benchmark-comparisons/${comparisonId}`);
  },

  async getBenchmarkConfusionMatrix(
    comparisonId: string,
    runId: string,
    axis: ConfusionMatrixAxis,
  ): Promise<ConfusionMatrix> {
    if (USE_MOCK_API) {
      const comparison = mockMvp6BenchmarkStore.find((item) => item.id === comparisonId);
      if (!comparison) {
        throw new BenchmarkComparisonError(
          "Benchmark comparison was not found.",
          "BENCHMARK_COMPARISON_NOT_FOUND",
          404,
        );
      }
      if (!comparison.runs.some((run) => run.run_id === runId)) {
        throw new BenchmarkComparisonError(
          "The requested run is not part of this comparison.",
          "BENCHMARK_RUN_NOT_IN_COMPARISON",
          404,
        );
      }
      return delay(buildMockMvp6ConfusionMatrix(comparisonId, runId, axis));
    }

    const query = buildAnyQueryString({ run_id: runId, axis });
    return request<ConfusionMatrix>(
      `/api/v1/benchmark-comparisons/${comparisonId}/confusion-matrix${query}`,
    );
  },

  async getBenchmarkCellErrorCases(
    comparisonId: string,
    runId: string,
    axis: ConfusionMatrixAxis,
    cellId: string,
    filters: { limit?: number; cursor?: string } = {},
  ): Promise<ConfusionCellErrorCasesResponse> {
    if (USE_MOCK_API) {
      const comparison = mockMvp6BenchmarkStore.find((item) => item.id === comparisonId);
      if (!comparison) {
        throw new BenchmarkComparisonError(
          "Benchmark comparison was not found.",
          "BENCHMARK_COMPARISON_NOT_FOUND",
          404,
        );
      }
      const cell = findMockMvp6Cell(axis, cellId);
      if (!cell) {
        throw new BenchmarkComparisonError("Confusion cell was not found.", "CONFUSION_CELL_NOT_FOUND", 404);
      }
      return delay({
        comparison_id: comparisonId,
        run_id: runId,
        axis,
        cell_id: cellId,
        gold_label: cell.gold,
        candidate_label: cell.candidate,
        error_cases: findMockMvp6CellErrorCases(axis, cellId),
        next_cursor: null,
      });
    }

    const query = buildAnyQueryString({ limit: filters.limit, cursor: filters.cursor });
    return request<ConfusionCellErrorCasesResponse>(
      `/api/v1/benchmark-comparisons/${comparisonId}/confusion-matrix/cells/${cellId}/error-cases${query}`,
    );
  },

  // ---- MVP6.4 Gold Set Authoring + Dataset Revisioning (expert-owned) ----
  // Candidate/analysis-layer only. Every authoring/import response carries the
  // all-false GoldAuthoringMutationGuard. EvaluationRun.dataset_version_id is
  // never rewritten. Owner/admin-only; non-owners get a read-only capability hint.

  async getDatasetAuthoringOverview(projectId: string, datasetId: string): Promise<DatasetAuthoringOverview> {
    if (USE_MOCK_API) {
      return delay(buildAuthoringOverview(ownerCapabilities));
    }

    return request<DatasetAuthoringOverview>(
      `/api/v1/projects/${projectId}/evaluation-datasets/${datasetId}/authoring`,
    );
  },

  async listGoldEvidence(datasetId: string): Promise<GoldEvidenceListResponse> {
    if (USE_MOCK_API) {
      return delay({ items: mockGoldsetEvidence.map((item) => ({ ...item })), next_cursor: null });
    }

    return request<GoldEvidenceListResponse>(`/api/v1/evaluation-datasets/${datasetId}/gold-evidence`);
  },

  async listDatasetRevisions(datasetId: string): Promise<DatasetRevisionListResponse> {
    if (USE_MOCK_API) {
      return delay({ items: mockGoldsetRevisions.map(toRevisionSummary), next_cursor: null });
    }

    return request<DatasetRevisionListResponse>(`/api/v1/evaluation-datasets/${datasetId}/revisions`);
  },

  async listGoldAuthoringAudit(datasetId: string): Promise<GoldAuthoringAuditListResponse> {
    if (USE_MOCK_API) {
      return delay({ items: mockGoldsetAuditEntries.map((entry) => ({ ...entry })), next_cursor: null });
    }

    return request<GoldAuthoringAuditListResponse>(
      `/api/v1/evaluation-datasets/${datasetId}/authoring-audit`,
    );
  },

  async editGoldEntity(
    datasetId: string,
    goldEntityId: string,
    payload: GoldEntityEditRequest,
  ): Promise<GoldEntityMutationResponse> {
    if (USE_MOCK_API) {
      const existing = mockGoldsetEntities.find((entity) => entity.id === goldEntityId);
      if (!existing) {
        throw new GoldAuthoringError("Gold entity was not found.", "GOLD_ITEM_NOT_FOUND", 404);
      }
      const updated = {
        ...existing,
        label: payload.label ?? existing.label,
        normalized_value: payload.normalized_value ?? existing.normalized_value,
        ontology_class_id: payload.ontology_class_id ?? existing.ontology_class_id,
        evidence: payload.evidence ?? existing.evidence,
        updated_at: new Date().toISOString(),
      };
      return delay({
        gold_entity: updated,
        audit_entry: buildMockGoldAudit("EDIT", "GOLD_ENTITY", goldEntityId, payload.reason),
        mutation_guard: { ...allFalseMutationGuard },
        capabilities: ownerCapabilities,
      });
    }

    return jsonRequest<GoldEntityMutationResponse>(
      `/api/v1/evaluation-datasets/${datasetId}/gold-entities/${goldEntityId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    );
  },

  async archiveGoldEntity(
    datasetId: string,
    goldEntityId: string,
    payload: GoldItemArchiveRequest = {},
  ): Promise<GoldEntityMutationResponse> {
    if (USE_MOCK_API) {
      const existing = mockGoldsetEntities.find((entity) => entity.id === goldEntityId);
      if (!existing) {
        throw new GoldAuthoringError("Gold entity was not found.", "GOLD_ITEM_NOT_FOUND", 404);
      }
      return delay({
        gold_entity: { ...existing, status: "ARCHIVED", archived_at: new Date().toISOString() },
        audit_entry: buildMockGoldAudit("ARCHIVE", "GOLD_ENTITY", goldEntityId, payload.reason),
        mutation_guard: { ...allFalseMutationGuard },
        capabilities: ownerCapabilities,
      });
    }

    return jsonRequest<GoldEntityMutationResponse>(
      `/api/v1/evaluation-datasets/${datasetId}/gold-entities/${goldEntityId}/archive`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  async restoreGoldEntity(
    datasetId: string,
    goldEntityId: string,
    payload: GoldItemArchiveRequest = {},
  ): Promise<GoldEntityMutationResponse> {
    if (USE_MOCK_API) {
      const existing = mockGoldsetEntities.find((entity) => entity.id === goldEntityId);
      if (!existing) {
        throw new GoldAuthoringError("Gold entity was not found.", "GOLD_ITEM_NOT_FOUND", 404);
      }
      return delay({
        gold_entity: { ...existing, status: "ACTIVE", archived_at: null },
        audit_entry: buildMockGoldAudit("RESTORE", "GOLD_ENTITY", goldEntityId, payload.reason),
        mutation_guard: { ...allFalseMutationGuard },
        capabilities: ownerCapabilities,
      });
    }

    return jsonRequest<GoldEntityMutationResponse>(
      `/api/v1/evaluation-datasets/${datasetId}/gold-entities/${goldEntityId}/restore`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  async editGoldRelation(
    datasetId: string,
    goldRelationId: string,
    payload: GoldRelationEditRequest,
  ): Promise<GoldRelationMutationResponse> {
    if (USE_MOCK_API) {
      const existing = mockGoldsetRelations.find((relation) => relation.id === goldRelationId);
      if (!existing) {
        throw new GoldAuthoringError("Gold relation was not found.", "GOLD_ITEM_NOT_FOUND", 404);
      }
      return delay({
        gold_relation: {
          ...existing,
          ontology_relation_id: payload.ontology_relation_id ?? existing.ontology_relation_id,
          source_gold_entity_id: payload.source_gold_entity_id ?? existing.source_gold_entity_id,
          target_gold_entity_id: payload.target_gold_entity_id ?? existing.target_gold_entity_id,
          evidence: payload.evidence ?? existing.evidence,
          updated_at: new Date().toISOString(),
        },
        audit_entry: buildMockGoldAudit("EDIT", "GOLD_RELATION", goldRelationId, payload.reason),
        mutation_guard: { ...allFalseMutationGuard },
        capabilities: ownerCapabilities,
      });
    }

    return jsonRequest<GoldRelationMutationResponse>(
      `/api/v1/evaluation-datasets/${datasetId}/gold-relations/${goldRelationId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    );
  },

  async archiveGoldRelation(
    datasetId: string,
    goldRelationId: string,
    payload: GoldItemArchiveRequest = {},
  ): Promise<GoldRelationMutationResponse> {
    if (USE_MOCK_API) {
      const existing = mockGoldsetRelations.find((relation) => relation.id === goldRelationId);
      if (!existing) {
        throw new GoldAuthoringError("Gold relation was not found.", "GOLD_ITEM_NOT_FOUND", 404);
      }
      return delay({
        gold_relation: { ...existing, status: "ARCHIVED", archived_at: new Date().toISOString() },
        audit_entry: buildMockGoldAudit("ARCHIVE", "GOLD_RELATION", goldRelationId, payload.reason),
        mutation_guard: { ...allFalseMutationGuard },
        capabilities: ownerCapabilities,
      });
    }

    return jsonRequest<GoldRelationMutationResponse>(
      `/api/v1/evaluation-datasets/${datasetId}/gold-relations/${goldRelationId}/archive`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  async restoreGoldRelation(
    datasetId: string,
    goldRelationId: string,
    payload: GoldItemArchiveRequest = {},
  ): Promise<GoldRelationMutationResponse> {
    if (USE_MOCK_API) {
      const existing = mockGoldsetRelations.find((relation) => relation.id === goldRelationId);
      if (!existing) {
        throw new GoldAuthoringError("Gold relation was not found.", "GOLD_ITEM_NOT_FOUND", 404);
      }
      return delay({
        gold_relation: { ...existing, status: "ACTIVE", archived_at: null },
        audit_entry: buildMockGoldAudit("RESTORE", "GOLD_RELATION", goldRelationId, payload.reason),
        mutation_guard: { ...allFalseMutationGuard },
        capabilities: ownerCapabilities,
      });
    }

    return jsonRequest<GoldRelationMutationResponse>(
      `/api/v1/evaluation-datasets/${datasetId}/gold-relations/${goldRelationId}/restore`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  async attachGoldEvidence(
    datasetId: string,
    payload: GoldEvidenceAttachRequest,
  ): Promise<GoldEvidenceMutationResponse> {
    if (USE_MOCK_API) {
      if (Boolean(payload.gold_entity_id) === Boolean(payload.gold_relation_id)) {
        throw new GoldAuthoringError(
          "Provide exactly one of gold_entity_id / gold_relation_id.",
          "GOLD_EVIDENCE_TARGET_INVALID",
          422,
        );
      }
      const now = new Date().toISOString();
      const evidence = {
        id: `gold-evidence-${mockGoldsetEvidence.length + 1}`,
        project_id: mockGoldsetDatasetProjectId(),
        dataset_id: datasetId,
        revision_id: null,
        gold_entity_id: payload.gold_entity_id ?? null,
        gold_relation_id: payload.gold_relation_id ?? null,
        status: "ACTIVE" as const,
        sample_id: payload.sample_id,
        source_id: payload.source_id ?? null,
        source_segment_id: payload.source_segment_id ?? null,
        locator: payload.locator ?? null,
        offset_start: payload.offset_start ?? null,
        offset_end: payload.offset_end ?? null,
        quote: payload.quote ?? null,
        created_at: now,
        updated_at: now,
        archived_at: null,
      };
      return delay({
        gold_evidence: evidence,
        audit_entry: buildMockGoldAudit(
          "EVIDENCE_ATTACH",
          "GOLD_EVIDENCE",
          evidence.id,
          payload.reason,
        ),
        mutation_guard: { ...allFalseMutationGuard },
        capabilities: ownerCapabilities,
      });
    }

    return jsonRequest<GoldEvidenceMutationResponse>(
      `/api/v1/evaluation-datasets/${datasetId}/gold-evidence`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  async editGoldEvidence(
    evidenceId: string,
    payload: GoldEvidenceEditRequest,
  ): Promise<GoldEvidenceMutationResponse> {
    if (USE_MOCK_API) {
      const existing = mockGoldsetEvidence.find((item) => item.id === evidenceId);
      if (!existing) {
        throw new GoldAuthoringError("Gold evidence was not found.", "GOLD_EVIDENCE_NOT_FOUND", 404);
      }
      return delay({
        gold_evidence: {
          ...existing,
          source_id: payload.source_id ?? existing.source_id,
          source_segment_id: payload.source_segment_id ?? existing.source_segment_id,
          locator: payload.locator ?? existing.locator,
          offset_start: payload.offset_start ?? existing.offset_start,
          offset_end: payload.offset_end ?? existing.offset_end,
          quote: payload.quote ?? existing.quote,
          updated_at: new Date().toISOString(),
        },
        audit_entry: buildMockGoldAudit("EVIDENCE_EDIT", "GOLD_EVIDENCE", evidenceId, payload.reason),
        mutation_guard: { ...allFalseMutationGuard },
        capabilities: ownerCapabilities,
      });
    }

    return jsonRequest<GoldEvidenceMutationResponse>(`/api/v1/gold-evidence/${evidenceId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async cutDatasetRevision(
    datasetId: string,
    payload: DatasetRevisionCutRequest,
  ): Promise<DatasetRevisionMutationResponse> {
    if (USE_MOCK_API) {
      const now = new Date().toISOString();
      const nextNumber = mockGoldsetRevisions.length + 1;
      const status = payload.activate ? "ACTIVE" : "DRAFT";
      const revision = {
        id: `${datasetId}-v${nextNumber}`,
        dataset_id: datasetId,
        project_id: mockGoldsetDatasetProjectId(),
        revision_number: nextNumber,
        status: status as "ACTIVE" | "DRAFT",
        is_immutable: false,
        frozen_reason: null,
        sample_count: 2,
        gold_entity_count: 3,
        gold_relation_count: 1,
        gold_evidence_count: 4,
        pinned_run_count: 0,
        parent_revision_id: mockGoldsetRevisions[0]?.id ?? null,
        ontology_version_id: mockGoldsetRevisions[0]?.ontology_version_id ?? null,
        created_at: now,
        activated_at: payload.activate ? now : null,
        frozen_at: null,
        created_by: MVP6_GOLDSET_OWNER_ID,
      };
      // When the new revision is activated, the prior ACTIVE freezes
      // (NEWER_REVISION_ACTIVATED). No EvaluationRun.dataset_version_id rewrite.
      const frozenRevisionId = payload.activate ? mockGoldsetRevisions[0]?.id ?? null : null;
      return delay({
        revision,
        dataset: null,
        frozen_revision_id: frozenRevisionId,
        audit_entry: buildMockGoldAudit("REVISION_CUT", "DATASET_REVISION", revision.id, payload.note),
        mutation_guard: { ...allFalseMutationGuard },
        capabilities: ownerCapabilities,
      });
    }

    return jsonRequest<DatasetRevisionMutationResponse>(
      `/api/v1/evaluation-datasets/${datasetId}/revisions`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  async activateDatasetRevision(revisionId: string): Promise<DatasetRevisionMutationResponse> {
    if (USE_MOCK_API) {
      const existing = mockGoldsetRevisions.find((rev) => rev.id === revisionId);
      if (!existing) {
        throw new GoldAuthoringError("Revision was not found.", "REVISION_NOT_FOUND", 404);
      }
      if (existing.status !== "DRAFT") {
        throw new GoldAuthoringError("Only a DRAFT revision may be activated.", "REVISION_NOT_DRAFT", 409);
      }
      return delay({
        revision: { ...existing, status: "ACTIVE", activated_at: new Date().toISOString() },
        dataset: null,
        frozen_revision_id: mockGoldsetRevisions[0]?.id ?? null,
        audit_entry: buildMockGoldAudit("REVISION_ACTIVATE", "DATASET_REVISION", revisionId),
        mutation_guard: { ...allFalseMutationGuard },
        capabilities: ownerCapabilities,
      });
    }

    return jsonRequest<DatasetRevisionMutationResponse>(
      `/api/v1/dataset-revisions/${revisionId}/activate`,
      { method: "POST" },
    );
  },

  async exportDatasetRevision(revisionId: string): Promise<GoldSetExportBundle> {
    if (USE_MOCK_API) {
      return delay(buildExportBundle(revisionId));
    }

    return request<GoldSetExportBundle>(`/api/v1/dataset-revisions/${revisionId}/export`);
  },

  async dryRunGoldSetImport(
    projectId: string,
    payload: GoldSetImportDryRunRequest,
  ): Promise<GoldSetImportReport> {
    if (USE_MOCK_API) {
      // Deterministic mock: pick the compatibility state from a bundle hint so
      // the UI/smoke can exercise all four states. Defaults to WARNING.
      const hint = (payload.bundle?.revision_status as string) ?? "";
      const key =
        hint && mockImportReports[hint] ? hint : "WARNING";
      mockGoldsetImportCounter += 1;
      return delay({ ...mockImportReports[key] });
    }

    return jsonRequest<GoldSetImportReport>(`/api/v1/projects/${projectId}/gold-set-imports`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async confirmGoldSetImport(
    projectId: string,
    importId: string,
    payload: GoldSetImportConfirmRequest,
  ): Promise<GoldSetImportConfirmResponse> {
    if (USE_MOCK_API) {
      if (importId === mockImportReports.INCOMPATIBLE.import_id) {
        throw new GoldAuthoringError(
          "The dry-run was INCOMPATIBLE; import is blocked.",
          "IMPORT_INCOMPATIBLE",
          409,
        );
      }
      const createdDatasetId =
        payload.strategy === "NEW_REVISION_OF_EXISTING"
          ? payload.target_dataset_id ?? MVP6_GOLDSET_DATASET_ID
          : `${MVP6_GOLDSET_DATASET_ID}-import-${mockGoldsetImportCounter || 1}`;
      return delay({
        import_id: importId,
        strategy: payload.strategy,
        created_dataset_id: createdDatasetId,
        created_revision_id: `${createdDatasetId}-v${payload.activate ? "active" : "draft"}`,
        created_revision_status: payload.activate ? "ACTIVE" : "DRAFT",
        imported_counts: { samples: 2, gold_entities: 3, gold_relations: 1, gold_evidence: 4 },
        audit_entry: buildMockGoldAudit("IMPORT", "DATASET_REVISION", createdDatasetId),
        mutation_guard: { ...allFalseMutationGuard },
      });
    }

    return jsonRequest<GoldSetImportConfirmResponse>(
      `/api/v1/projects/${projectId}/gold-set-imports/${importId}/confirm`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  // ---- MVP6.5 Governance ----
  async listOntologyChangeRequests(
    projectId: string,
    params?: { status?: OntologyChangeRequestStatus; limit?: number; cursor?: string },
  ): Promise<OntologyChangeRequestListResponse> {
    if (USE_MOCK_API) {
      let items = mockGovernanceRequestStore.filter((cr) => cr.project_id === projectId);
      if (params?.status) {
        items = items.filter((cr) => cr.status === params.status);
      }
      return delay({ items: items.map((cr) => ({ ...cr })), total_count: items.length, next_cursor: null });
    }
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.cursor) query.set("cursor", params.cursor);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<OntologyChangeRequestListResponse>(
      `/api/v1/projects/${projectId}/ontology-change-requests${suffix}`,
    );
  },

  async getOntologyChangeRequest(changeRequestId: string): Promise<OntologyChangeRequestDetail> {
    if (USE_MOCK_API) {
      const request_ = mockGovernanceRequestStore.find((cr) => cr.id === changeRequestId);
      if (!request_) {
        throw new GovernanceError("Change request was not found.", "CHANGE_REQUEST_NOT_FOUND", 404);
      }
      return delay({
        change_request: { ...request_ },
        items: (mockGovernanceItemStore[changeRequestId] ?? []).map((item) => ({ ...item })),
        reviews: (mockGovernanceReviewStore[changeRequestId] ?? []).map((r) => ({ ...r })),
        capabilities: governanceCapabilitiesFor(request_),
        application_banner: governanceBannerFor(request_),
      });
    }
    return request<OntologyChangeRequestDetail>(
      `/api/v1/ontology-change-requests/${changeRequestId}`,
    );
  },

  async proposeOntologyChangeRequest(
    projectId: string,
    payload: OntologyChangeRequestCreateRequest,
  ): Promise<GovernanceMutationResponse> {
    if (USE_MOCK_API) {
      mockGovernanceCounter += 1;
      const id = `ocr-mock-${mockGovernanceCounter}`;
      const created: OntologyChangeRequest = {
        id,
        project_id: projectId,
        title: payload.title,
        summary: payload.summary ?? null,
        status: "DRAFT",
        application_state: "NOT_APPLICABLE",
        proposer_id: MVP6_GOVERNANCE_PROPOSER_ID,
        item_count: payload.items?.length ?? 0,
        ontology_version_id: payload.ontology_version_id ?? MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        submitted_at: null,
        decided_at: null,
        decided_by: null,
        decision_reason: null,
      };
      mockGovernanceRequestStore = [created, ...mockGovernanceRequestStore];
      mockGovernanceItemStore[id] = (payload.items ?? []).map((item, index) => ({
        id: `${id}-item-${index + 1}`,
        change_request_id: id,
        ...item,
        created_at: new Date().toISOString(),
        updated_at: null,
      }));
      mockGovernanceReviewStore[id] = [];
      const audit = nextGovernanceAudit(id, "CHANGE_REQUEST_CREATED", null, "DRAFT");
      return delay({
        change_request: { ...created },
        review_decision: null,
        audit_entry: audit,
        mutation_guard: { ...allFalseGovernanceGuard },
        capabilities: governanceCapabilitiesFor(created),
      });
    }
    return jsonRequest<GovernanceMutationResponse>(
      `/api/v1/projects/${projectId}/ontology-change-requests`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  async updateOntologyChangeRequest(
    changeRequestId: string,
    payload: OntologyChangeRequestUpdateRequest,
  ): Promise<GovernanceMutationResponse> {
    if (USE_MOCK_API) {
      const existing = mockGovernanceRequestStore.find((cr) => cr.id === changeRequestId);
      if (!existing) {
        throw new GovernanceError("Change request was not found.", "CHANGE_REQUEST_NOT_FOUND", 404);
      }
      if (existing.status !== "DRAFT" && existing.status !== "OPEN") {
        throw new GovernanceError("Only DRAFT/OPEN requests may be edited.", "CHANGE_REQUEST_STATE_CONFLICT", 409);
      }
      const updated = { ...existing, title: payload.title ?? existing.title, summary: payload.summary ?? existing.summary, updated_at: new Date().toISOString() };
      mockGovernanceRequestStore = mockGovernanceRequestStore.map((cr) => (cr.id === changeRequestId ? updated : cr));
      const audit = nextGovernanceAudit(changeRequestId, "CHANGE_REQUEST_UPDATED", existing.status, updated.status);
      return delay({ change_request: { ...updated }, review_decision: null, audit_entry: audit, mutation_guard: { ...allFalseGovernanceGuard }, capabilities: governanceCapabilitiesFor(updated) });
    }
    return jsonRequest<GovernanceMutationResponse>(
      `/api/v1/ontology-change-requests/${changeRequestId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    );
  },

  async addOntologyChangeItem(
    changeRequestId: string,
    payload: OntologyChangeItemRequest,
  ): Promise<GovernanceMutationResponse> {
    if (USE_MOCK_API) {
      const existing = mockGovernanceRequestStore.find((cr) => cr.id === changeRequestId);
      if (!existing) {
        throw new GovernanceError("Change request was not found.", "CHANGE_REQUEST_NOT_FOUND", 404);
      }
      const bucket = mockGovernanceItemStore[changeRequestId] ?? [];
      const item: OntologyChangeItem = {
        id: `${changeRequestId}-item-${bucket.length + 1}`,
        change_request_id: changeRequestId,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: null,
      };
      mockGovernanceItemStore[changeRequestId] = [...bucket, item];
      const updated = { ...existing, item_count: bucket.length + 1 };
      mockGovernanceRequestStore = mockGovernanceRequestStore.map((cr) => (cr.id === changeRequestId ? updated : cr));
      const audit = nextGovernanceAudit(changeRequestId, "CHANGE_REQUEST_UPDATED", existing.status, existing.status);
      return delay({ change_request: { ...updated }, review_decision: null, audit_entry: audit, mutation_guard: { ...allFalseGovernanceGuard }, capabilities: governanceCapabilitiesFor(updated) });
    }
    return jsonRequest<GovernanceMutationResponse>(
      `/api/v1/ontology-change-requests/${changeRequestId}/items`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  async submitOntologyChangeRequest(changeRequestId: string): Promise<GovernanceMutationResponse> {
    if (USE_MOCK_API) {
      const existing = mockGovernanceRequestStore.find((cr) => cr.id === changeRequestId);
      if (!existing) {
        throw new GovernanceError("Change request was not found.", "CHANGE_REQUEST_NOT_FOUND", 404);
      }
      if (existing.status !== "DRAFT") {
        throw new GovernanceError("Only a DRAFT request may be submitted.", "CHANGE_REQUEST_STATE_CONFLICT", 409);
      }
      if ((mockGovernanceItemStore[changeRequestId] ?? []).length === 0) {
        throw new GovernanceError("A change request must have at least one item to submit.", "CHANGE_REQUEST_NO_ITEMS", 409);
      }
      const updated = { ...existing, status: "OPEN" as OntologyChangeRequestStatus, submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      mockGovernanceRequestStore = mockGovernanceRequestStore.map((cr) => (cr.id === changeRequestId ? updated : cr));
      const audit = nextGovernanceAudit(changeRequestId, "CHANGE_REQUEST_SUBMITTED", "DRAFT", "OPEN");
      return delay({ change_request: { ...updated }, review_decision: null, audit_entry: audit, mutation_guard: { ...allFalseGovernanceGuard }, capabilities: governanceCapabilitiesFor(updated) });
    }
    return jsonRequest<GovernanceMutationResponse>(
      `/api/v1/ontology-change-requests/${changeRequestId}/submit`,
      { method: "POST", body: JSON.stringify({}) },
    );
  },

  async withdrawOntologyChangeRequest(
    changeRequestId: string,
    payload: GovernanceWithdrawRequest = {},
  ): Promise<GovernanceMutationResponse> {
    if (USE_MOCK_API) {
      const existing = mockGovernanceRequestStore.find((cr) => cr.id === changeRequestId);
      if (!existing) {
        throw new GovernanceError("Change request was not found.", "CHANGE_REQUEST_NOT_FOUND", 404);
      }
      if (!["DRAFT", "OPEN", "IN_REVIEW"].includes(existing.status)) {
        throw new GovernanceError("Only DRAFT/OPEN/IN_REVIEW requests may be withdrawn.", "CHANGE_REQUEST_STATE_CONFLICT", 409);
      }
      const updated = { ...existing, status: "WITHDRAWN" as OntologyChangeRequestStatus, updated_at: new Date().toISOString() };
      mockGovernanceRequestStore = mockGovernanceRequestStore.map((cr) => (cr.id === changeRequestId ? updated : cr));
      const audit = nextGovernanceAudit(changeRequestId, "CHANGE_REQUEST_WITHDRAWN", existing.status, "WITHDRAWN", payload.reason);
      return delay({ change_request: { ...updated }, review_decision: null, audit_entry: audit, mutation_guard: { ...allFalseGovernanceGuard }, capabilities: governanceCapabilitiesFor(updated) });
    }
    return jsonRequest<GovernanceMutationResponse>(
      `/api/v1/ontology-change-requests/${changeRequestId}/withdraw`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  async recordGovernanceReviewDecision(
    changeRequestId: string,
    payload: GovernanceReviewDecisionRequest,
  ): Promise<GovernanceMutationResponse> {
    if (USE_MOCK_API) {
      const existing = mockGovernanceRequestStore.find((cr) => cr.id === changeRequestId);
      if (!existing) {
        throw new GovernanceError("Change request was not found.", "CHANGE_REQUEST_NOT_FOUND", 404);
      }
      const reasonRequired = payload.action === "REQUEST_CHANGES" || payload.action === "APPROVE" || payload.action === "REJECT";
      if (reasonRequired && !payload.reason?.trim()) {
        throw new GovernanceError("A non-empty reason is required for this action.", "REASON_REQUIRED", 422);
      }
      // Only OPEN / IN_REVIEW requests accept decisions.
      if (existing.status !== "OPEN" && existing.status !== "IN_REVIEW") {
        throw new GovernanceError("The request is not in a reviewable state.", "CHANGE_REQUEST_STATE_CONFLICT", 409);
      }
      // Segregation of duties: proposer may not approve their own request.
      if (payload.action === "APPROVE" && existing.proposer_id === MOCK_GOVERNANCE_ACTOR_ID) {
        throw new GovernanceError("Proposers cannot approve their own request.", "SELF_APPROVAL_FORBIDDEN", 403);
      }

      // G1 first-touch: COMMENT/REQUEST_CHANGES on OPEN auto-advances to IN_REVIEW.
      let nextStatus: OntologyChangeRequestStatus = existing.status;
      let nextApplicationState = existing.application_state;
      if (payload.action === "APPROVE") {
        nextStatus = "APPROVED";
        nextApplicationState = "QUEUED";
      } else if (payload.action === "REJECT") {
        nextStatus = "REJECTED";
      } else if (payload.action === "REQUEST_CHANGES") {
        nextStatus = "OPEN";
        if (existing.status === "OPEN") {
          nextGovernanceAudit(changeRequestId, "REVIEW_STARTED", "OPEN", "IN_REVIEW");
        }
      } else if (payload.action === "COMMENT") {
        if (existing.status === "OPEN") {
          nextStatus = "IN_REVIEW";
          nextGovernanceAudit(changeRequestId, "REVIEW_STARTED", "OPEN", "IN_REVIEW");
        }
      }

      const updated: OntologyChangeRequest = {
        ...existing,
        status: nextStatus,
        application_state: nextApplicationState,
        updated_at: new Date().toISOString(),
        decided_at: payload.action === "APPROVE" || payload.action === "REJECT" ? new Date().toISOString() : existing.decided_at,
        decided_by: payload.action === "APPROVE" || payload.action === "REJECT" ? MOCK_GOVERNANCE_ACTOR_ID : existing.decided_by,
        decision_reason: payload.action === "APPROVE" || payload.action === "REJECT" ? payload.reason ?? null : existing.decision_reason,
      };
      mockGovernanceRequestStore = mockGovernanceRequestStore.map((cr) => (cr.id === changeRequestId ? updated : cr));

      const decision: GovernanceReviewDecision = {
        id: `rev-mock-${(mockGovernanceReviewStore[changeRequestId]?.length ?? 0) + 1}-${changeRequestId}`,
        change_request_id: changeRequestId,
        action: payload.action,
        actor_id: MOCK_GOVERNANCE_ACTOR_ID,
        actor_role: "ONTOLOGY_MANAGER",
        reason: payload.reason ?? null,
        resulting_status: nextStatus,
        resulting_application_state: nextApplicationState,
        created_at: new Date().toISOString(),
      };
      mockGovernanceReviewStore[changeRequestId] = [...(mockGovernanceReviewStore[changeRequestId] ?? []), decision];

      const auditAction =
        payload.action === "APPROVE"
          ? "CHANGE_REQUEST_APPROVED"
          : payload.action === "REJECT"
            ? "CHANGE_REQUEST_REJECTED"
            : payload.action === "REQUEST_CHANGES"
              ? "CHANGES_REQUESTED"
              : "COMMENT_ADDED";
      const audit = nextGovernanceAudit(changeRequestId, auditAction, existing.status, nextStatus, payload.reason);

      return delay({
        change_request: { ...updated },
        review_decision: decision,
        audit_entry: audit,
        mutation_guard: { ...allFalseGovernanceGuard },
        capabilities: governanceCapabilitiesFor(updated),
      });
    }
    return jsonRequest<GovernanceMutationResponse>(
      `/api/v1/ontology-change-requests/${changeRequestId}/reviews`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  async listChangeRequestAudit(changeRequestId: string): Promise<GovernanceAuditListResponse> {
    if (USE_MOCK_API) {
      const items = (mockGovernanceAuditStore[changeRequestId] ?? []).map((e) => ({ ...e }));
      // G4: wire order ascending.
      return delay({ items, total_count: items.length, next_cursor: null });
    }
    return request<GovernanceAuditListResponse>(
      `/api/v1/ontology-change-requests/${changeRequestId}/audit`,
    );
  },

  async listProjectGovernanceAudit(projectId: string): Promise<GovernanceAuditListResponse> {
    if (USE_MOCK_API) {
      const items = Object.values(mockGovernanceAuditStore)
        .flat()
        .filter((e) => e.project_id === projectId)
        .map((e) => ({ ...e }))
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      return delay({ items, total_count: items.length, next_cursor: null });
    }
    return request<GovernanceAuditListResponse>(
      `/api/v1/projects/${projectId}/governance-audit`,
    );
  },

  // ---- MVP6.6 Governance change application (apply into a DRAFT ontology version) ----
  async getChangeRequestApplicationStatus(
    changeRequestId: string,
    params?: { targetOntologyVersionId?: string },
  ): Promise<GovernanceApplicationStatusResponse> {
    if (USE_MOCK_API) {
      const req = mockGovernanceRequestStore.find((cr) => cr.id === changeRequestId);
      if (!req) {
        throw new GovernanceError("Change request was not found.", "CHANGE_REQUEST_NOT_FOUND", 404);
      }
      const items = mockGovernanceItemStore[changeRequestId] ?? [];
      const targetVersionId = params?.targetOntologyVersionId ?? MVP6_GOVERNANCE_TARGET_DRAFT_VERSION_ID;
      // Advisory-only staleness hint (G5): the pre-check NEVER flips QUEUED->SUPERSEDED.
      const wouldSupersede =
        req.status === "APPROVED" &&
        req.application_state === "QUEUED" &&
        changeRequestId === MVP6_GOVERNANCE_STALE_APPROVED_ID;
      const isQueuedApproved = req.status === "APPROVED" && req.application_state === "QUEUED";
      const canApply = isQueuedApproved; // mock actor holds apply rights
      return delay({
        change_request_id: req.id,
        project_id: req.project_id,
        status: req.status,
        application_state: req.application_state,
        target_ontology_version_id: targetVersionId,
        target_version_status: "DRAFT",
        target_is_draft: true,
        applicable: isQueuedApproved && !wouldSupersede,
        would_supersede: wouldSupersede,
        item_previews: buildItemPreviews(items, targetVersionId, wouldSupersede),
        capabilities: canApply ? applyCapabilitiesQueued : applyCapabilitiesReadOnly,
        mutation_guard: { ...allFalseGovernanceGuard },
      });
    }
    const query = new URLSearchParams();
    if (params?.targetOntologyVersionId) query.set("target_ontology_version_id", params.targetOntologyVersionId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<GovernanceApplicationStatusResponse>(
      `/api/v1/ontology-change-requests/${changeRequestId}/application-status${suffix}`,
    );
  },

  async applyOntologyChangeRequest(
    changeRequestId: string,
    payload: GovernanceApplyRequest = {},
  ): Promise<GovernanceApplyResponse> {
    if (USE_MOCK_API) {
      const existing = mockGovernanceRequestStore.find((cr) => cr.id === changeRequestId);
      if (!existing) {
        throw new GovernanceError("Change request was not found.", "CHANGE_REQUEST_NOT_FOUND", 404);
      }
      // Idempotency (409): already APPLIED.
      if (existing.application_state === "APPLIED") {
        throw new GovernanceError("This change request is already applied.", "CHANGE_ALREADY_APPLIED", 409);
      }
      // Terminal SUPERSEDED (409): not applicable.
      if (existing.application_state === "SUPERSEDED") {
        throw new GovernanceError("This change request has been superseded.", "CHANGE_NOT_APPLICABLE", 409);
      }
      // Precondition (409): must be APPROVED + QUEUED.
      if (existing.status !== "APPROVED" || existing.application_state !== "QUEUED") {
        throw new GovernanceError("The request is not in an applicable state (APPROVED + QUEUED).", "CHANGE_NOT_APPLICABLE", 409);
      }
      const targetVersionId = payload.target_ontology_version_id ?? MVP6_GOVERNANCE_TARGET_DRAFT_VERSION_ID;
      const items = mockGovernanceItemStore[changeRequestId] ?? [];

      // Staleness auto-detected at apply -> block, mutate nothing, QUEUED -> SUPERSEDED,
      // write a CHANGE_REQUEST_SUPERSEDED audit entry, 409 CHANGE_REQUEST_SUPERSEDED.
      if (changeRequestId === MVP6_GOVERNANCE_STALE_APPROVED_ID) {
        const superseded = { ...existing, application_state: "SUPERSEDED" as GovernanceApplicationState, updated_at: new Date().toISOString() };
        mockGovernanceRequestStore = mockGovernanceRequestStore.map((cr) => (cr.id === changeRequestId ? superseded : cr));
        const supersedeAudit = buildApplicationAudit(changeRequestId, existing.project_id, "CHANGE_REQUEST_SUPERSEDED", {
          target_ontology_version_id: targetVersionId,
          applied_item_ids: [],
          before_after_refs: [],
          before_application_state: "QUEUED",
          after_application_state: "SUPERSEDED",
          note: payload.note ?? null,
          stale_detail: { reason: "TARGET_ELEMENT_ARCHIVED", stale_item_ids: items.map((i) => i.id) },
        });
        mockApplicationAuditStore[changeRequestId] = [...(mockApplicationAuditStore[changeRequestId] ?? []), supersedeAudit];
        throw new GovernanceError(
          "The target draft changed since approval; nothing was applied and the request is now SUPERSEDED.",
          "CHANGE_REQUEST_SUPERSEDED",
          409,
        );
      }

      // Apply (all-or-nothing): mutate ONLY the DRAFT (mocked) + set APPLIED.
      const previews = buildItemPreviews(items, targetVersionId, false);
      const beforeAfterRefs = previews.map((p) => ({
        change_item_id: p.change_item_id,
        change_type: p.change_type,
        before: p.before_ref ?? null,
        after: p.after_ref ?? null,
      }));
      const applied = { ...existing, application_state: "APPLIED" as GovernanceApplicationState, updated_at: new Date().toISOString() };
      mockGovernanceRequestStore = mockGovernanceRequestStore.map((cr) => (cr.id === changeRequestId ? applied : cr));
      const auditEntry = buildApplicationAudit(changeRequestId, existing.project_id, "CHANGE_REQUEST_APPLIED", {
        target_ontology_version_id: targetVersionId,
        applied_item_ids: items.map((i) => i.id),
        before_after_refs: beforeAfterRefs,
        before_application_state: "QUEUED",
        after_application_state: "APPLIED",
        note: payload.note ?? null,
        stale_detail: null,
      });
      mockApplicationAuditStore[changeRequestId] = [...(mockApplicationAuditStore[changeRequestId] ?? []), auditEntry];
      return delay({
        change_request_id: applied.id,
        project_id: applied.project_id,
        application_state: "APPLIED",
        target_ontology_version_id: targetVersionId,
        applied_item_ids: items.map((i) => i.id),
        before_after_refs: beforeAfterRefs,
        audit_entry: auditEntry,
        mutation_guard: { ...applyMutationGuard },
        capabilities: { ...applyCapabilitiesApplied },
      });
    }
    return jsonRequest<GovernanceApplyResponse>(
      `/api/v1/ontology-change-requests/${changeRequestId}/apply`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  async listChangeRequestApplicationAudit(
    changeRequestId: string,
  ): Promise<GovernanceApplicationAuditListResponse> {
    if (USE_MOCK_API) {
      const items = (mockApplicationAuditStore[changeRequestId] ?? []).map((e) => ({ ...e }));
      // Chronological ascending (wire order).
      return delay({ items, total_count: items.length, next_cursor: null });
    }
    return request<GovernanceApplicationAuditListResponse>(
      `/api/v1/ontology-change-requests/${changeRequestId}/application-audit`,
    );
  },

  // ---- MVP6.7 Impact Simulation (read-only impact analysis of a change request) ----
  // Idempotent GET. Mutates NOTHING (all-false ImpactSimulationMutationGuard on
  // every response). Advisory only; never applies/publishes/enforces/gates.
  async getChangeRequestImpactSimulation(
    changeRequestId: string,
    params?: { targetOntologyVersionId?: string; refCap?: number },
  ): Promise<ImpactSimulationReport> {
    if (USE_MOCK_API) {
      const req = mockGovernanceRequestStore.find((cr) => cr.id === changeRequestId);
      if (!req) {
        throw new GovernanceError("Change request was not found.", "CHANGE_REQUEST_NOT_FOUND", 404);
      }
      const report =
        mockImpactReports[changeRequestId] ??
        buildEmptyImpactReport(changeRequestId, req.project_id, req.status);
      // Read-only echo of the request's current lifecycle status; never mutated.
      return delay({ ...report, change_request_status: req.status });
    }
    const query = new URLSearchParams();
    if (params?.targetOntologyVersionId) query.set("target_ontology_version_id", params.targetOntologyVersionId);
    if (params?.refCap != null) query.set("ref_cap", String(params.refCap));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ImpactSimulationReport>(
      `/api/v1/ontology-change-requests/${changeRequestId}/impact-simulation${suffix}`,
    );
  },

  // ---- MVP6.8 Copilot (advisory-only; suggests + routes; executes nothing) ----

  async getCopilotSummary(projectId: string): Promise<CopilotSummaryResponse> {
    if (USE_MOCK_API) {
      const items = mockCopilotSuggestionStore.filter((s) => s.project_id === projectId);
      const countBy = (state: CopilotSuggestionState) => items.filter((s) => s.state === state).length;
      const kinds: CopilotSuggestionKind[] = [
        "DRAFT_GOVERNANCE_CHANGE_REQUEST",
        "REVIEW_THESE_CANDIDATES",
        "INSPECT_QUALITY_OR_VALIDATION_SIGNAL",
        "RUN_IMPACT_SIMULATION",
      ];
      const counts_by_kind: CopilotSuggestionKindCount[] = kinds.map((kind) => {
        const forKind = items.filter((s) => s.kind === kind);
        return {
          kind,
          count: forKind.length,
          high_risk_count: forKind.filter((s) => s.risk_label === "HIGH").length,
        };
      });
      return delay({
        project_id: projectId,
        generated_at: MVP6_COPILOT_GENERATED_AT,
        source_artifact_scope: mockCopilotSourceArtifactScope,
        total_suggestion_count: items.length,
        suggested_count: countBy("SUGGESTED"),
        accepted_count: countBy("ACCEPTED"),
        dismissed_count: countBy("DISMISSED"),
        superseded_count: countBy("SUPERSEDED"),
        high_risk_count: items.filter((s) => s.risk_label === "HIGH").length,
        counts_by_kind,
        advisory_notes: mockCopilotAdvisoryNotes,
        mutation_guard: { ...allFalseCopilotGuard },
      });
    }
    return request<CopilotSummaryResponse>(`/api/v1/projects/${projectId}/copilot/summary`);
  },

  async listCopilotSuggestions(
    projectId: string,
    params?: { kind?: CopilotSuggestionKind; state?: CopilotSuggestionState; riskLabel?: CopilotRiskLabel },
  ): Promise<CopilotSuggestionListResponse> {
    if (USE_MOCK_API) {
      let items = mockCopilotSuggestionStore.filter((s) => s.project_id === projectId);
      if (params?.kind) items = items.filter((s) => s.kind === params.kind);
      if (params?.state) items = items.filter((s) => s.state === params.state);
      if (params?.riskLabel) items = items.filter((s) => s.risk_label === params.riskLabel);
      return delay({
        project_id: projectId,
        items: items.map((s) => ({ ...s })),
        next_cursor: null,
        mutation_guard: { ...allFalseCopilotGuard },
      });
    }
    const query = new URLSearchParams();
    if (params?.kind) query.set("kind", params.kind);
    if (params?.state) query.set("state", params.state);
    if (params?.riskLabel) query.set("risk_label", params.riskLabel);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<CopilotSuggestionListResponse>(
      `/api/v1/projects/${projectId}/copilot/suggestions${suffix}`,
    );
  },

  async getCopilotSuggestion(suggestionId: string): Promise<CopilotSuggestionDetailResponse> {
    if (USE_MOCK_API) {
      const suggestion = mockCopilotSuggestionStore.find((s) => s.id === suggestionId);
      if (!suggestion) {
        throw new CopilotDecisionError(
          "Copilot suggestion was not found.",
          "COPILOT_SUGGESTION_NOT_FOUND",
          404,
        );
      }
      return delay({ suggestion: { ...suggestion }, mutation_guard: { ...allFalseCopilotGuard } });
    }
    return request<CopilotSuggestionDetailResponse>(`/api/v1/copilot-suggestions/${suggestionId}`);
  },

  async createCopilotSuggestionDecision(
    suggestionId: string,
    payload: CopilotSuggestionDecisionRequest,
  ): Promise<CopilotSuggestionDecisionResponse> {
    if (USE_MOCK_API) {
      const suggestion = mockCopilotSuggestionStore.find((s) => s.id === suggestionId);
      if (!suggestion) {
        throw new CopilotDecisionError(
          "Copilot suggestion was not found.",
          "COPILOT_SUGGESTION_NOT_FOUND",
          404,
        );
      }
      // Audit-only: only SUGGESTED can receive a decision. Non-SUGGESTED -> 409.
      if (suggestion.state !== "SUGGESTED") {
        throw new CopilotDecisionError(
          "Only SUGGESTED copilot suggestions can receive a decision command.",
          "COPILOT_SUGGESTION_DECISION_CONFLICT",
          409,
          suggestion.state,
        );
      }
      if (payload.decision === "DISMISS" && !payload.dismiss_reason_code) {
        throw new CopilotDecisionError(
          "dismiss_reason_code is required when decision is DISMISS.",
          "DISMISS_REASON_REQUIRED",
          400,
        );
      }
      if (payload.decision === "ACCEPT" && payload.dismiss_reason_code) {
        throw new CopilotDecisionError(
          "dismiss_reason_code is only allowed when decision is DISMISS.",
          "DISMISS_REASON_NOT_ALLOWED",
          400,
        );
      }
      if (payload.decision === "DISMISS" && payload.dismiss_reason_code === "OTHER" && !payload.note?.trim()) {
        throw new CopilotDecisionError(
          "note is required when dismiss_reason_code is OTHER.",
          "DECISION_NOTE_REQUIRED",
          400,
        );
      }

      const previousState = suggestion.state;
      const newState: CopilotSuggestionState = payload.decision === "ACCEPT" ? "ACCEPTED" : "DISMISSED";
      const decidedAt = new Date().toISOString();
      mockCopilotDecisionCounter += 1;
      // ACCEPT returns the suggestion's routing target (a destination descriptor
      // with NO authority). The copilot creates/mutates/applies NOTHING.
      const routingTarget = payload.decision === "ACCEPT" ? { ...suggestion.routing_target } : null;
      const auditNote: CopilotDecisionAuditNote = {
        id: `copilot-decision-mock-${mockCopilotDecisionCounter}`,
        suggestion_id: suggestionId,
        project_id: suggestion.project_id,
        actor_id: "dev-user",
        actor_role: "PROJECT_MEMBER",
        decision: payload.decision,
        dismiss_reason_code: payload.dismiss_reason_code ?? null,
        note: payload.note ?? null,
        decided_at: decidedAt,
        suggestion_snapshot: {
          kind: suggestion.kind,
          title: suggestion.title,
          rationale: suggestion.rationale,
          confidence_label: suggestion.confidence_label,
          risk_label: suggestion.risk_label,
        },
        source_artifact_ids: suggestion.source_artifacts.map((a) => a.artifact_id),
        routing_target: routingTarget,
        mutation_guard: { ...allFalseCopilotGuard },
      };
      // Persist the audit-only state transition (no gated-flow object touched).
      mockCopilotSuggestionStore = mockCopilotSuggestionStore.map((s) =>
        s.id === suggestionId
          ? { ...s, state: newState, updated_at: decidedAt, decision_audit_note: auditNote }
          : s,
      );
      return delay({
        suggestion_id: suggestionId,
        project_id: suggestion.project_id,
        previous_state: previousState,
        new_state: newState,
        decision_audit_note: auditNote,
        routing_target: routingTarget,
        mutation_guard: { ...allFalseCopilotGuard },
      });
    }
    return jsonRequest<CopilotSuggestionDecisionResponse>(
      `/api/v1/copilot-suggestions/${suggestionId}/decisions`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  // ---- MVP6.9 Connectors (read-only catalog + deterministic DRY-RUN preview) ----
  // Connects to NOTHING, writes NOTHING, imports NOTHING. Every response carries an
  // all-false 9-flag ConnectorMutationGuard; raw_secret_present=false; the preview
  // is deterministic + secret-independent and CREATES NOTHING.

  async getConnectorCatalog(projectId: string): Promise<ConnectorCatalogListResponse> {
    if (USE_MOCK_API) {
      const items = buildConnectorCatalog();
      return delay({
        project_id: projectId,
        items,
        total_count: items.length,
        mutation_guard: { ...allFalseConnectorGuard },
      });
    }
    return request<ConnectorCatalogListResponse>(`/api/v1/projects/${projectId}/connectors`);
  },

  async getConnectorConfigSchema(
    projectId: string,
    connectorKind: ConnectorKind,
  ): Promise<ConnectorConfigSchemaResponse> {
    if (USE_MOCK_API) {
      if (!isConnectorKind(connectorKind)) {
        throw new ConnectorError("Unknown connector kind.", "CONNECTOR_KIND_NOT_FOUND", 404);
      }
      return delay(buildConnectorConfigSchema(projectId, connectorKind));
    }
    return request<ConnectorConfigSchemaResponse>(
      `/api/v1/projects/${projectId}/connectors/${connectorKind}/config-schema`,
    );
  },

  async runConnectorImportPreview(
    projectId: string,
    connectorKind: ConnectorKind,
    payload: ConnectorImportPreviewRequest,
  ): Promise<ConnectorImportPreviewResponse> {
    if (USE_MOCK_API) {
      if (!isConnectorKind(connectorKind)) {
        throw new ConnectorError("Unknown connector kind.", "CONNECTOR_KIND_NOT_FOUND", 404);
      }
      // Deterministic dry-run computed from the fixture (secret-independent).
      // generated_at is set here at "response time" and is EXCLUDED from the
      // byte-stable determinism assertion (G7).
      const computed = buildConnectorImportPreview(
        projectId,
        connectorKind,
        payload.config ?? {},
        payload.item_cap,
      );
      return delay({ ...computed, generated_at: new Date().toISOString() });
    }
    return jsonRequest<ConnectorImportPreviewResponse>(
      `/api/v1/projects/${projectId}/connectors/${connectorKind}/import-preview`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  },
};

function mockGoldsetDatasetProjectId(): string {
  return mockGoldsetRevisions[0]?.project_id ?? "project-corp-knowledge";
}

function buildMockGoldAudit(
  action: GoldAuthoringAuditListResponse["items"][number]["action"],
  targetKind: GoldAuthoringAuditListResponse["items"][number]["target_kind"],
  targetId: string,
  reason?: string | null,
): GoldAuthoringAuditListResponse["items"][number] {
  return {
    id: `gold-audit-mock-${Date.now()}`,
    project_id: mockGoldsetDatasetProjectId(),
    dataset_id: MVP6_GOLDSET_DATASET_ID,
    revision_id: mockGoldsetRevisions[0]?.id ?? null,
    action,
    actor_id: MVP6_GOLDSET_OWNER_ID,
    is_owner: true,
    target_kind: targetKind,
    target_id: targetId,
    before: null,
    after: null,
    reason: reason ?? null,
    created_at: new Date().toISOString(),
  };
}
