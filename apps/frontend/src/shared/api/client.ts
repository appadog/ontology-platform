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
  CandidateEntity,
  CandidateListFilters,
  CandidateEvidence,
  CandidateRelation,
  DashboardSummary,
  EvaluationDataset,
  EvaluationDatasetVersion,
  EvaluationRun,
  ExternalApiDocsSurface,
  ExtractionJob,
  ExtractionJobCreateRequest,
  ExtractionJobDetail,
  GoldenSetItem,
  GraphExploreRequest,
  GraphExploreResponse,
  ModelRun,
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
      label: `${source.file_name} ${source.preview_status}`,
      timestamp: source.uploaded_at,
    })),
    ...projects.map((project) => ({
      id: `project-${project.id}`,
      label: `${project.name} ${project.status}`,
      timestamp: project.updated_at,
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
      return delay(mockMvp4Datasets.filter((dataset) => dataset.project_id === projectId));
    }

    return request<EvaluationDataset[]>(`/api/v1/projects/${projectId}/evaluation-datasets`);
  },

  async getEvaluationDataset(datasetId: string): Promise<EvaluationDataset> {
    if (USE_MOCK_API) {
      const dataset = mockMvp4Datasets.find((item) => item.id === datasetId);

      if (!dataset) {
        throw new Error("Evaluation dataset fixture not found");
      }

      return delay(dataset);
    }

    return request<EvaluationDataset>(`/api/v1/evaluation-datasets/${datasetId}`);
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
      return delay(mockMvp4EvaluationRuns.filter((run) => run.project_id === projectId));
    }

    return request<EvaluationRun[]>(`/api/v1/projects/${projectId}/evaluation-runs`);
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

  async listModelRuns(jobId: string): Promise<ModelRun[]> {
    if (USE_MOCK_API) {
      return delay(mockModelRunStore.filter((run) => run.extraction_job_id === jobId));
    }

    const job = await request<ExtractionJobDetail>(`/api/v1/extraction-jobs/${jobId}`);
    return job.model_runs ?? [];
  },
};
