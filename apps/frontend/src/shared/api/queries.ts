import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import {
  GovernanceApplyRequest,
  GovernanceReviewDecisionRequest,
  GovernanceWithdrawRequest,
  ConnectorImportPreviewRequest,
  ConnectorKind,
  CopilotRiskLabel,
  CopilotSuggestionDecisionRequest,
  CopilotSuggestionKind,
  CopilotSuggestionState,
  OntologyChangeItemRequest,
  OntologyChangeRequestCreateRequest,
  OntologyChangeRequestStatus,
  OntologyChangeRequestUpdateRequest,
  PermissionCheckRequest,
  CandidateListFilters,
  DatasetRevisionCutRequest,
  GoldEntityEditRequest,
  GoldEvidenceAttachRequest,
  GoldEvidenceEditRequest,
  GoldItemArchiveRequest,
  GoldRelationEditRequest,
  GoldSetImportConfirmRequest,
  GoldSetImportDryRunRequest,
  EvaluationDatasetCreateRequest,
  EvaluationRunCreateRequest,
  EvaluationSampleCreateRequest,
  ExtractionJobCreateRequest,
  GoldEntityCreateRequest,
  GoldRelationCreateRequest,
  GraphExploreRequest,
  OntologyClassCreateRequest,
  OntologyClassUpdateRequest,
  OntologyPropertyCreateRequest,
  OntologyPropertyUpdateRequest,
  OntologyImportCreateRequest,
  OntologyRelationCreateRequest,
  OntologyRelationUpdateRequest,
  OntologyVersionCreateRequest,
  BenchmarkComparisonCreateRequest,
  ConfusionMatrixAxis,
  PublishCandidate,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  RagAnswerRequest,
  ReviewTaskListFilters,
  SearchRequest,
  SimilarEvidenceRequest,
  SourceUploadRequest,
  SuggestionDecisionRequest,
} from "./types";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: apiClient.getDashboardSummary,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: apiClient.listProjects,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectCreateRequest) => apiClient.createProject(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => apiClient.getProject(projectId),
    enabled: Boolean(projectId),
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectUpdateRequest) => apiClient.updateProject(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useOntologyVersions(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "ontology", "versions"],
    queryFn: () => apiClient.listOntologyVersions(projectId),
    enabled: Boolean(projectId),
  });
}

export function useCreateOntologyVersion(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OntologyVersionCreateRequest = {}) => apiClient.createOntologyVersion(projectId, payload),
    onSuccess: (version) => {
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "ontology", "versions"] });
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["ontology", "versions", version.id, "graph"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useOntologyGraph(versionId: string) {
  return useQuery({
    queryKey: ["ontology", "versions", versionId, "graph"],
    queryFn: () => apiClient.getOntologyGraph(versionId),
    enabled: Boolean(versionId),
  });
}

export function useCreateOntologyClass(versionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OntologyClassCreateRequest) => apiClient.createOntologyClass(versionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ontology", "versions", versionId, "graph"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateOntologyClass(versionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, payload }: { classId: string; payload: OntologyClassUpdateRequest }) =>
      apiClient.updateOntologyClass(classId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ontology", "versions", versionId, "graph"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteOntologyClass(versionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classId: string) => apiClient.deleteOntologyClass(classId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ontology", "versions", versionId, "graph"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateOntologyProperty(versionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OntologyPropertyCreateRequest) => apiClient.createOntologyProperty(versionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ontology", "versions", versionId, "graph"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateOntologyProperty(versionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, payload }: { propertyId: string; payload: OntologyPropertyUpdateRequest }) =>
      apiClient.updateOntologyProperty(propertyId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ontology", "versions", versionId, "graph"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteOntologyProperty(versionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) => apiClient.deleteOntologyProperty(propertyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ontology", "versions", versionId, "graph"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateOntologyRelation(versionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OntologyRelationCreateRequest) => apiClient.createOntologyRelation(versionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ontology", "versions", versionId, "graph"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateOntologyRelation(versionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ relationId, payload }: { relationId: string; payload: OntologyRelationUpdateRequest }) =>
      apiClient.updateOntologyRelation(relationId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ontology", "versions", versionId, "graph"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteOntologyRelation(versionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (relationId: string) => apiClient.deleteOntologyRelation(relationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ontology", "versions", versionId, "graph"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useSources(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "sources"],
    queryFn: () => apiClient.listSources(projectId),
    enabled: Boolean(projectId),
  });
}

export function useUploadSource(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SourceUploadRequest) => apiClient.uploadSource(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "sources"] });
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useSource(sourceId: string) {
  return useQuery({
    queryKey: ["sources", sourceId],
    queryFn: () => apiClient.getSource(sourceId),
    enabled: Boolean(sourceId),
  });
}

export function useSourcePreview(sourceId: string, enabled = true) {
  return useQuery({
    queryKey: ["sources", sourceId, "preview"],
    queryFn: () => apiClient.getSourcePreview(sourceId),
    enabled: Boolean(sourceId) && enabled,
  });
}

export function useSourceProfile(sourceId: string) {
  return useQuery({
    queryKey: ["sources", sourceId, "profile"],
    queryFn: () => apiClient.getSourceProfile(sourceId),
    enabled: Boolean(sourceId),
  });
}

export function useRunSourceProfile(sourceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.runSourceProfile(sourceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sources", sourceId, "profile"] });
    },
  });
}

export function useSourceSegments(sourceId: string) {
  return useQuery({
    queryKey: ["sources", sourceId, "segments"],
    queryFn: () => apiClient.listSourceSegments(sourceId),
    enabled: Boolean(sourceId),
  });
}

export function useParseSource(sourceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.parseSource(sourceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sources", sourceId, "segments"] });
    },
  });
}

export function usePromptTemplates(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "prompts"],
    queryFn: () => apiClient.listPromptTemplates(projectId),
    enabled: Boolean(projectId),
  });
}

export function usePromptVersions(promptId: string) {
  return useQuery({
    queryKey: ["prompts", promptId, "versions"],
    queryFn: () => apiClient.listPromptVersions(promptId),
    enabled: Boolean(promptId),
  });
}

export function useExtractionJobs(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "extraction-jobs"],
    queryFn: () => apiClient.listExtractionJobs(projectId),
    enabled: Boolean(projectId),
  });
}

export function useExtractionJob(jobId: string) {
  return useQuery({
    queryKey: ["extraction-jobs", jobId],
    queryFn: () => apiClient.getExtractionJob(jobId),
    enabled: Boolean(jobId),
  });
}

export function useCreateExtractionJob(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ExtractionJobCreateRequest) => apiClient.createExtractionJob(projectId, payload),
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "extraction-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["extraction-jobs", job.id] });
    },
  });
}

export function useRunExtractionJob(jobId: string, projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.runExtractionJob(jobId),
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: ["extraction-jobs", jobId] });
      void queryClient.invalidateQueries({ queryKey: ["extraction-jobs", jobId, "model-runs"] });
      void queryClient.invalidateQueries({ queryKey: ["extraction-jobs", jobId, "candidate-entities"] });
      void queryClient.invalidateQueries({ queryKey: ["extraction-jobs", jobId, "candidate-relations"] });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "extraction-jobs"] });
      }
      void queryClient.invalidateQueries({ queryKey: ["extraction-jobs", job.id] });
    },
  });
}

export function useRetryExtractionJob(jobId: string, projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.retryExtractionJob(jobId),
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: ["extraction-jobs", jobId] });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "extraction-jobs"] });
      }
      void queryClient.invalidateQueries({ queryKey: ["extraction-jobs", job.id] });
    },
  });
}

export function useModelRuns(jobId: string) {
  return useQuery({
    queryKey: ["extraction-jobs", jobId, "model-runs"],
    queryFn: () => apiClient.listModelRuns(jobId),
    enabled: Boolean(jobId),
  });
}

export function useCandidateEntities(jobId: string, filters: CandidateListFilters = {}) {
  return useQuery({
    queryKey: ["extraction-jobs", jobId, "candidate-entities", filters],
    queryFn: () => apiClient.listCandidateEntities(jobId, filters),
    enabled: Boolean(jobId),
  });
}

export function useCandidateRelations(jobId: string, filters: CandidateListFilters = {}) {
  return useQuery({
    queryKey: ["extraction-jobs", jobId, "candidate-relations", filters],
    queryFn: () => apiClient.listCandidateRelations(jobId, filters),
    enabled: Boolean(jobId),
  });
}

export function useCandidateEvidence(evidenceId: string) {
  return useQuery({
    queryKey: ["candidate-evidence", evidenceId],
    queryFn: () => apiClient.getCandidateEvidence(evidenceId),
    enabled: Boolean(evidenceId),
  });
}

export function useReviewTasks(projectId: string, filters: ReviewTaskListFilters = {}) {
  return useQuery({
    queryKey: ["projects", projectId, "review-tasks", filters],
    queryFn: () => apiClient.listReviewTasks(projectId, filters),
    enabled: Boolean(projectId),
  });
}

export function useReviewTask(reviewTaskId: string) {
  return useQuery({
    queryKey: ["review-tasks", reviewTaskId],
    queryFn: () => apiClient.getReviewTask(reviewTaskId),
    enabled: Boolean(reviewTaskId),
  });
}

export function usePublishCandidates(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "publish-candidates"],
    queryFn: () => apiClient.listPublishCandidates(projectId),
    enabled: Boolean(projectId),
  });
}

export function usePublishJobs(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "publish-jobs"],
    queryFn: () => apiClient.listPublishJobs(projectId),
    enabled: Boolean(projectId),
  });
}

export function useCreatePublishJob(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (candidates: PublishCandidate[]) => apiClient.createPublishJob(projectId, candidates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "publish-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "publish-candidates"] });
    },
  });
}

export function useRunPublishJob(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publishJobId: string) => apiClient.runPublishJob(publishJobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "publish-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "publish-candidates"] });
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "published-graph", "current"] });
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "quality-summary"] });
    },
  });
}

export function useCurrentPublishedGraph(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "published-graph", "current"],
    queryFn: () => apiClient.getCurrentPublishedGraph(projectId),
    enabled: Boolean(projectId),
  });
}

export function useQualitySummary(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "quality-summary"],
    queryFn: () => apiClient.getQualitySummary(projectId),
    enabled: Boolean(projectId),
  });
}

export function useQualityMetrics(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "quality-metrics"],
    queryFn: () => apiClient.getQualityMetrics(projectId),
    enabled: Boolean(projectId),
  });
}

export function useEvaluationDatasets(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "evaluation-datasets"],
    queryFn: () => apiClient.listEvaluationDatasets(projectId),
    enabled: Boolean(projectId),
  });
}

export function useCreateEvaluationDataset(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EvaluationDatasetCreateRequest) => apiClient.createEvaluationDataset(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "evaluation-datasets"] });
    },
  });
}

export function useEvaluationSamples(datasetId: string) {
  return useQuery({
    queryKey: ["evaluation-datasets", datasetId, "samples"],
    queryFn: () => apiClient.listEvaluationSamples(datasetId),
    enabled: Boolean(datasetId),
  });
}

export function useCreateEvaluationSample(datasetId: string, projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EvaluationSampleCreateRequest) => apiClient.createEvaluationSample(datasetId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["evaluation-datasets", datasetId, "samples"] });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "evaluation-datasets"] });
      }
    },
  });
}

export function useEvaluationDatasetVersions(datasetId: string) {
  return useQuery({
    queryKey: ["evaluation-datasets", datasetId, "versions"],
    queryFn: () => apiClient.listEvaluationDatasetVersions(datasetId),
    enabled: Boolean(datasetId),
  });
}

export function useGoldenItems(datasetVersionId: string) {
  return useQuery({
    queryKey: ["evaluation-dataset-versions", datasetVersionId, "golden-items"],
    queryFn: () => apiClient.listGoldenItems(datasetVersionId),
    enabled: Boolean(datasetVersionId),
  });
}

export function useGoldEntities(datasetId: string) {
  return useQuery({
    queryKey: ["evaluation-datasets", datasetId, "gold-entities"],
    queryFn: () => apiClient.listGoldEntities(datasetId),
    enabled: Boolean(datasetId),
  });
}

export function useCreateGoldEntity(datasetId: string, projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GoldEntityCreateRequest) => apiClient.createGoldEntity(datasetId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["evaluation-datasets", datasetId, "gold-entities"] });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "evaluation-datasets"] });
      }
    },
  });
}

export function useGoldRelations(datasetId: string) {
  return useQuery({
    queryKey: ["evaluation-datasets", datasetId, "gold-relations"],
    queryFn: () => apiClient.listGoldRelations(datasetId),
    enabled: Boolean(datasetId),
  });
}

export function useCreateGoldRelation(datasetId: string, projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GoldRelationCreateRequest) => apiClient.createGoldRelation(datasetId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["evaluation-datasets", datasetId, "gold-relations"] });
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "evaluation-datasets"] });
      }
    },
  });
}

export function usePromptPerformanceSummary(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "prompt-performance-summary"],
    queryFn: () => apiClient.getPromptPerformanceSummary(projectId),
    enabled: Boolean(projectId),
  });
}

export function usePromptExperiments(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "prompt-experiments"],
    queryFn: () => apiClient.listPromptExperiments(projectId),
    enabled: Boolean(projectId),
  });
}

export function useEvaluationRuns(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "evaluation-runs"],
    queryFn: () => apiClient.listEvaluationRuns(projectId),
    enabled: Boolean(projectId),
  });
}

export function useCreateEvaluationRun(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EvaluationRunCreateRequest) => apiClient.createEvaluationRun(projectId, payload),
    onSuccess: (run) => {
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "evaluation-runs"] });
      void queryClient.invalidateQueries({ queryKey: ["evaluation-runs", run.id] });
      void queryClient.invalidateQueries({ queryKey: ["evaluation-runs", run.id, "metrics"] });
      void queryClient.invalidateQueries({ queryKey: ["evaluation-runs", run.id, "errors"] });
    },
  });
}

export function useEvaluationRun(runId: string) {
  return useQuery({
    queryKey: ["evaluation-runs", runId],
    queryFn: () => apiClient.getEvaluationRun(runId),
    enabled: Boolean(runId),
  });
}

export function useEvaluationMetrics(runId: string) {
  return useQuery({
    queryKey: ["evaluation-runs", runId, "metrics"],
    queryFn: () => apiClient.listEvaluationMetrics(runId),
    enabled: Boolean(runId),
  });
}

export function useEvaluationErrorCases(runId: string) {
  return useQuery({
    queryKey: ["evaluation-runs", runId, "errors"],
    queryFn: () => apiClient.listEvaluationErrorCases(runId),
    enabled: Boolean(runId),
  });
}

export function useEvaluationErrorCase(errorCaseId: string) {
  return useQuery({
    queryKey: ["evaluation-error-cases", errorCaseId],
    queryFn: () => apiClient.getEvaluationErrorCase(errorCaseId),
    enabled: Boolean(errorCaseId),
  });
}

export function useProjectSearch(projectId: string, filters: SearchRequest = {}) {
  return useQuery({
    queryKey: ["projects", projectId, "search", filters],
    queryFn: () => apiClient.searchProject(projectId, filters),
    enabled: Boolean(projectId) && Boolean(filters.query),
  });
}

export function useVectorStatus(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "vector-status"],
    queryFn: () => apiClient.getVectorStatus(projectId),
    enabled: Boolean(projectId),
  });
}

export function useSimilarEvidence(projectId: string, payload: SimilarEvidenceRequest) {
  return useQuery({
    queryKey: ["projects", projectId, "similar-evidence", payload],
    queryFn: () => apiClient.findSimilarEvidence(projectId, payload),
    enabled: Boolean(projectId) && Boolean(payload.query || payload.evidence_id || payload.source_segment_id || payload.published_fact_id),
  });
}

export function useCreateRagAnswer(projectId: string) {
  return useMutation({
    mutationFn: (payload: RagAnswerRequest) => apiClient.createRagAnswer(projectId, payload),
  });
}

export function usePublishedGraphExplore(projectId: string, filters: GraphExploreRequest = {}) {
  return useQuery({
    queryKey: ["projects", projectId, "published-graph-explore", filters],
    queryFn: () => apiClient.explorePublishedGraph(projectId, filters),
    enabled: Boolean(projectId),
  });
}

export function useExternalApiDocs(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "external-api-docs"],
    queryFn: () => apiClient.getExternalApiDocs(projectId),
    enabled: Boolean(projectId),
  });
}

export function useAdminOrganizationSummary(organizationId?: string) {
  return useQuery({
    queryKey: ["admin", "organization", organizationId ?? "default", "summary"],
    queryFn: () => apiClient.getAdminOrganizationSummary(organizationId),
  });
}

export function useAdminProjectSummaries() {
  return useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => apiClient.listAdminProjectSummaries(),
  });
}

export function useAdminProjectSummary(projectId: string) {
  return useQuery({
    queryKey: ["admin", "projects", projectId, "summary"],
    queryFn: () => apiClient.getAdminProjectSummary(projectId),
    enabled: Boolean(projectId),
  });
}

export function useAdminRoleAssignments(projectId: string) {
  return useQuery({
    queryKey: ["admin", "projects", projectId, "role-assignments"],
    queryFn: () => apiClient.listAdminRoleAssignments(projectId),
    enabled: Boolean(projectId),
  });
}

export function useAdminPermissionCheck(payload: PermissionCheckRequest) {
  return useQuery({
    queryKey: ["admin", "permission-check", payload],
    queryFn: () => apiClient.checkAdminPermission(payload),
    enabled: Boolean(payload.principal_id && payload.action && payload.resource_type),
  });
}

export function useAdminCredentials(projectId: string) {
  return useQuery({
    queryKey: ["admin", "projects", projectId, "credentials"],
    queryFn: () => apiClient.listAdminCredentials(projectId),
    enabled: Boolean(projectId),
  });
}

export function useCreateAdminServiceAccount(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.createAdminServiceAccount(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "projects", projectId, "credentials"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "projects", projectId, "summary"] });
    },
  });
}

export function useRevokeAdminCredential(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ credentialId, reason }: { credentialId: string; reason: string }) => apiClient.revokeAdminCredential(credentialId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "projects", projectId, "credentials"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "projects", projectId, "summary"] });
    },
  });
}

export function useAutomaticApprovalPolicy(projectId: string) {
  return useQuery({
    queryKey: ["admin", "projects", projectId, "automatic-approval-policy"],
    queryFn: () => apiClient.getAutomaticApprovalPolicy(projectId),
    enabled: Boolean(projectId),
  });
}

export function useAutomaticApprovalEvaluation(policyId: string) {
  return useQuery({
    queryKey: ["admin", "automatic-approval-policy", policyId, "evaluation"],
    queryFn: () => apiClient.evaluateAutomaticApprovalPolicy(policyId),
    enabled: Boolean(policyId),
  });
}

export function useAutomaticApprovalDiff(policyId: string) {
  return useQuery({
    queryKey: ["admin", "automatic-approval-policy", policyId, "diff"],
    queryFn: () => apiClient.diffAutomaticApprovalPolicy(policyId),
    enabled: Boolean(policyId),
  });
}

export function useAutomaticApprovalEnforcePreview(policyId: string) {
  return useQuery({
    queryKey: ["admin", "automatic-approval-policy", policyId, "enforce-preview"],
    queryFn: () => apiClient.previewAutomaticApprovalEnforce(policyId),
    enabled: Boolean(policyId),
  });
}

export function useOntologyExports(projectId: string) {
  return useQuery({
    queryKey: ["admin", "projects", projectId, "ontology-exports"],
    queryFn: () => apiClient.listOntologyExports(projectId),
    enabled: Boolean(projectId),
  });
}

export function useOntologyExportDownload(jobId: string) {
  return useQuery({
    queryKey: ["admin", "ontology-exports", jobId, "download"],
    queryFn: () => apiClient.getOntologyExportDownload(jobId),
    enabled: Boolean(jobId),
  });
}

export function useOntologyImportDryRun(projectId: string, payload: OntologyImportCreateRequest = { format: "JSON", mode: "DRY_RUN" }) {
  return useQuery({
    queryKey: ["admin", "projects", projectId, "ontology-imports", "dry-run", payload],
    queryFn: () => apiClient.createOntologyImportDryRun(projectId, payload),
    enabled: Boolean(projectId),
  });
}

export function useOperationsDashboard(projectId: string) {
  return useQuery({
    queryKey: ["admin", "projects", projectId, "operations"],
    queryFn: () => apiClient.getOperationsDashboard(projectId),
    enabled: Boolean(projectId),
  });
}

export function useRetentionPolicy(projectId: string) {
  return useQuery({
    queryKey: ["admin", "projects", projectId, "retention-policy"],
    queryFn: () => apiClient.getRetentionPolicy(projectId),
    enabled: Boolean(projectId),
  });
}

export function useRetentionDeletionDryRun(projectId: string) {
  return useQuery({
    queryKey: ["admin", "projects", projectId, "retention-deletion-dry-run"],
    queryFn: () => apiClient.runRetentionDeletionDryRun(projectId),
    enabled: Boolean(projectId),
  });
}

export function useBackupSnapshots(projectId: string) {
  return useQuery({
    queryKey: ["admin", "projects", projectId, "backup-snapshots"],
    queryFn: () => apiClient.listBackupSnapshots(projectId),
    enabled: Boolean(projectId),
  });
}

export function useBackupRestoreDryRun(snapshotId: string) {
  return useQuery({
    queryKey: ["admin", "backup-snapshots", snapshotId, "restore-dry-run"],
    queryFn: () => apiClient.runBackupRestoreDryRun(snapshotId),
    enabled: Boolean(snapshotId),
  });
}

export function useAdminAuditEvents(projectId: string) {
  return useQuery({
    queryKey: ["admin", "projects", projectId, "audit-events"],
    queryFn: () => apiClient.listAdminAuditEvents(projectId),
    enabled: Boolean(projectId),
  });
}

// ---- MVP6.2 Active Learning / Learning Insights ----

export function useLearningSummary(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "learning-signals", "summary"],
    queryFn: () => apiClient.getLearningSummary(projectId),
    enabled: Boolean(projectId),
  });
}

export function useLearningCorrectionPatterns(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "learning-signals", "correction-patterns"],
    queryFn: () => apiClient.listLearningCorrectionPatterns(projectId),
    enabled: Boolean(projectId),
  });
}

export function useLearningPromptSuggestions(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "learning-signals", "prompt-suggestions"],
    queryFn: () => apiClient.listLearningPromptSuggestions(projectId),
    enabled: Boolean(projectId),
  });
}

export function useLearningAutoApprovalCandidates(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "learning-signals", "auto-approval-candidates"],
    queryFn: () => apiClient.listLearningAutoApprovalCandidates(projectId),
    enabled: Boolean(projectId),
  });
}

export function useDecideLearningSuggestion(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ suggestionId, payload }: { suggestionId: string; payload: SuggestionDecisionRequest }) =>
      apiClient.decideLearningSuggestion(suggestionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "learning-signals", "prompt-suggestions"] });
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "learning-signals", "summary"] });
    },
  });
}

// ---- MVP6.3 Benchmark Comparison / Confusion Matrix ----

export function useBenchmarkComparisons(projectId: string, groupBy?: string) {
  return useQuery({
    queryKey: ["projects", projectId, "benchmark-comparisons", groupBy ?? "ALL"],
    queryFn: () => apiClient.listBenchmarkComparisons(projectId, { group_by: groupBy }),
    enabled: Boolean(projectId),
  });
}

export function useBenchmarkComparison(comparisonId: string) {
  return useQuery({
    queryKey: ["benchmark-comparisons", comparisonId],
    queryFn: () => apiClient.getBenchmarkComparison(comparisonId),
    enabled: Boolean(comparisonId),
  });
}

export function useCreateBenchmarkComparison(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BenchmarkComparisonCreateRequest) => apiClient.createBenchmarkComparison(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "benchmark-comparisons"] });
    },
  });
}

export function useBenchmarkConfusionMatrix(comparisonId: string, runId: string, axis: ConfusionMatrixAxis) {
  return useQuery({
    queryKey: ["benchmark-comparisons", comparisonId, "confusion-matrix", runId, axis],
    queryFn: () => apiClient.getBenchmarkConfusionMatrix(comparisonId, runId, axis),
    enabled: Boolean(comparisonId) && Boolean(runId),
  });
}

export function useBenchmarkCellErrorCases(
  comparisonId: string,
  runId: string,
  axis: ConfusionMatrixAxis,
  cellId: string,
) {
  return useQuery({
    queryKey: ["benchmark-comparisons", comparisonId, "confusion-matrix", runId, axis, "cells", cellId],
    queryFn: () => apiClient.getBenchmarkCellErrorCases(comparisonId, runId, axis, cellId),
    enabled: Boolean(comparisonId) && Boolean(runId) && Boolean(cellId),
  });
}

// ---- MVP6.4 Gold Set Authoring + Dataset Revisioning ----
// Authoring is candidate/analysis-layer only; no run/score/publish invalidation.

const goldsetKeys = {
  overview: (datasetId: string) => ["evaluation-datasets", datasetId, "authoring"] as const,
  evidence: (datasetId: string) => ["evaluation-datasets", datasetId, "gold-evidence"] as const,
  revisions: (datasetId: string) => ["evaluation-datasets", datasetId, "revisions"] as const,
  audit: (datasetId: string) => ["evaluation-datasets", datasetId, "authoring-audit"] as const,
};

export function useDatasetAuthoringOverview(projectId: string, datasetId: string) {
  return useQuery({
    queryKey: goldsetKeys.overview(datasetId),
    queryFn: () => apiClient.getDatasetAuthoringOverview(projectId, datasetId),
    enabled: Boolean(projectId) && Boolean(datasetId),
  });
}

export function useGoldEvidence(datasetId: string) {
  return useQuery({
    queryKey: goldsetKeys.evidence(datasetId),
    queryFn: () => apiClient.listGoldEvidence(datasetId),
    enabled: Boolean(datasetId),
  });
}

export function useDatasetRevisions(datasetId: string) {
  return useQuery({
    queryKey: goldsetKeys.revisions(datasetId),
    queryFn: () => apiClient.listDatasetRevisions(datasetId),
    enabled: Boolean(datasetId),
  });
}

export function useGoldAuthoringAudit(datasetId: string) {
  return useQuery({
    queryKey: goldsetKeys.audit(datasetId),
    queryFn: () => apiClient.listGoldAuthoringAudit(datasetId),
    enabled: Boolean(datasetId),
  });
}

function useGoldsetInvalidate(datasetId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: goldsetKeys.overview(datasetId) });
    void queryClient.invalidateQueries({ queryKey: goldsetKeys.evidence(datasetId) });
    void queryClient.invalidateQueries({ queryKey: goldsetKeys.revisions(datasetId) });
    void queryClient.invalidateQueries({ queryKey: goldsetKeys.audit(datasetId) });
    void queryClient.invalidateQueries({ queryKey: ["evaluation-datasets", datasetId, "gold-entities"] });
    void queryClient.invalidateQueries({ queryKey: ["evaluation-datasets", datasetId, "gold-relations"] });
  };
}

export function useEditGoldEntity(datasetId: string) {
  const invalidate = useGoldsetInvalidate(datasetId);
  return useMutation({
    mutationFn: ({ goldEntityId, payload }: { goldEntityId: string; payload: GoldEntityEditRequest }) =>
      apiClient.editGoldEntity(datasetId, goldEntityId, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveGoldEntity(datasetId: string) {
  const invalidate = useGoldsetInvalidate(datasetId);
  return useMutation({
    mutationFn: ({ goldEntityId, payload }: { goldEntityId: string; payload?: GoldItemArchiveRequest }) =>
      apiClient.archiveGoldEntity(datasetId, goldEntityId, payload),
    onSuccess: invalidate,
  });
}

export function useRestoreGoldEntity(datasetId: string) {
  const invalidate = useGoldsetInvalidate(datasetId);
  return useMutation({
    mutationFn: ({ goldEntityId, payload }: { goldEntityId: string; payload?: GoldItemArchiveRequest }) =>
      apiClient.restoreGoldEntity(datasetId, goldEntityId, payload),
    onSuccess: invalidate,
  });
}

export function useEditGoldRelation(datasetId: string) {
  const invalidate = useGoldsetInvalidate(datasetId);
  return useMutation({
    mutationFn: ({ goldRelationId, payload }: { goldRelationId: string; payload: GoldRelationEditRequest }) =>
      apiClient.editGoldRelation(datasetId, goldRelationId, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveGoldRelation(datasetId: string) {
  const invalidate = useGoldsetInvalidate(datasetId);
  return useMutation({
    mutationFn: ({ goldRelationId, payload }: { goldRelationId: string; payload?: GoldItemArchiveRequest }) =>
      apiClient.archiveGoldRelation(datasetId, goldRelationId, payload),
    onSuccess: invalidate,
  });
}

export function useRestoreGoldRelation(datasetId: string) {
  const invalidate = useGoldsetInvalidate(datasetId);
  return useMutation({
    mutationFn: ({ goldRelationId, payload }: { goldRelationId: string; payload?: GoldItemArchiveRequest }) =>
      apiClient.restoreGoldRelation(datasetId, goldRelationId, payload),
    onSuccess: invalidate,
  });
}

export function useAttachGoldEvidence(datasetId: string) {
  const invalidate = useGoldsetInvalidate(datasetId);
  return useMutation({
    mutationFn: (payload: GoldEvidenceAttachRequest) => apiClient.attachGoldEvidence(datasetId, payload),
    onSuccess: invalidate,
  });
}

export function useEditGoldEvidence(datasetId: string) {
  const invalidate = useGoldsetInvalidate(datasetId);
  return useMutation({
    mutationFn: ({ evidenceId, payload }: { evidenceId: string; payload: GoldEvidenceEditRequest }) =>
      apiClient.editGoldEvidence(evidenceId, payload),
    onSuccess: invalidate,
  });
}

export function useCutDatasetRevision(datasetId: string) {
  const invalidate = useGoldsetInvalidate(datasetId);
  return useMutation({
    mutationFn: (payload: DatasetRevisionCutRequest) => apiClient.cutDatasetRevision(datasetId, payload),
    onSuccess: invalidate,
  });
}

export function useActivateDatasetRevision(datasetId: string) {
  const invalidate = useGoldsetInvalidate(datasetId);
  return useMutation({
    mutationFn: (revisionId: string) => apiClient.activateDatasetRevision(revisionId),
    onSuccess: invalidate,
  });
}

export function useDryRunGoldSetImport(projectId: string) {
  return useMutation({
    mutationFn: (payload: GoldSetImportDryRunRequest) => apiClient.dryRunGoldSetImport(projectId, payload),
  });
}

export function useConfirmGoldSetImport(projectId: string) {
  return useMutation({
    mutationFn: ({ importId, payload }: { importId: string; payload: GoldSetImportConfirmRequest }) =>
      apiClient.confirmGoldSetImport(projectId, importId, payload),
  });
}

// ---- MVP6.5 Governance (ontology change-request lifecycle) ----
// Decision-record surface in the candidate/analysis layer; no publish/candidate/
// ontology invalidation. Writes invalidate only the governance queries.

const governanceKeys = {
  board: (projectId: string, status?: OntologyChangeRequestStatus) =>
    ["governance", "change-requests", projectId, status ?? "ALL"] as const,
  detail: (changeRequestId: string) => ["governance", "change-request", changeRequestId] as const,
  audit: (changeRequestId: string) => ["governance", "change-request", changeRequestId, "audit"] as const,
  applicationStatus: (changeRequestId: string) =>
    ["governance", "change-request", changeRequestId, "application-status"] as const,
  applicationAudit: (changeRequestId: string) =>
    ["governance", "change-request", changeRequestId, "application-audit"] as const,
  impact: (changeRequestId: string) =>
    ["governance", "change-request", changeRequestId, "impact-simulation"] as const,
};

export function useOntologyChangeRequests(projectId: string, status?: OntologyChangeRequestStatus) {
  return useQuery({
    queryKey: governanceKeys.board(projectId, status),
    queryFn: () => apiClient.listOntologyChangeRequests(projectId, status ? { status } : undefined),
    enabled: Boolean(projectId),
  });
}

export function useOntologyChangeRequestDetail(changeRequestId: string) {
  return useQuery({
    queryKey: governanceKeys.detail(changeRequestId),
    queryFn: () => apiClient.getOntologyChangeRequest(changeRequestId),
    enabled: Boolean(changeRequestId),
  });
}

export function useChangeRequestAudit(changeRequestId: string) {
  return useQuery({
    queryKey: governanceKeys.audit(changeRequestId),
    queryFn: () => apiClient.listChangeRequestAudit(changeRequestId),
    enabled: Boolean(changeRequestId),
  });
}

function useGovernanceInvalidate(changeRequestId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: governanceKeys.detail(changeRequestId) });
    void queryClient.invalidateQueries({ queryKey: governanceKeys.audit(changeRequestId) });
    void queryClient.invalidateQueries({ queryKey: governanceKeys.applicationStatus(changeRequestId) });
    void queryClient.invalidateQueries({ queryKey: governanceKeys.applicationAudit(changeRequestId) });
    void queryClient.invalidateQueries({ queryKey: ["governance", "change-requests"] });
  };
}

// ---- MVP6.6 Governance change application (apply into a DRAFT ontology version) ----

/** Read-only application-status pre-check. Enabled only when the request is APPROVED. */
export function useChangeRequestApplicationStatus(changeRequestId: string, enabled: boolean) {
  return useQuery({
    queryKey: governanceKeys.applicationStatus(changeRequestId),
    queryFn: () => apiClient.getChangeRequestApplicationStatus(changeRequestId),
    enabled: Boolean(changeRequestId) && enabled,
  });
}

/** Read-only application audit (CHANGE_REQUEST_APPLIED / CHANGE_REQUEST_SUPERSEDED). */
export function useChangeRequestApplicationAudit(changeRequestId: string, enabled: boolean) {
  return useQuery({
    queryKey: governanceKeys.applicationAudit(changeRequestId),
    queryFn: () => apiClient.listChangeRequestApplicationAudit(changeRequestId),
    enabled: Boolean(changeRequestId) && enabled,
  });
}

// ---- MVP6.7 Impact Simulation (read-only impact analysis of a change request) ----

/**
 * Read-only impact simulation for a change request. Idempotent GET; mutates
 * NOTHING (all-false ImpactSimulationMutationGuard). Disabled until `enabled`
 * (the panel runs it on demand via the read-only "영향도 분석 실행" trigger).
 * Advisory only for ANY lifecycle state (not gated on APPROVED).
 */
export function useChangeRequestImpactSimulation(changeRequestId: string, enabled: boolean) {
  return useQuery({
    queryKey: governanceKeys.impact(changeRequestId),
    queryFn: () => apiClient.getChangeRequestImpactSimulation(changeRequestId),
    enabled: Boolean(changeRequestId) && enabled,
    staleTime: Infinity, // Byte-stable for a fixed change request + graph snapshot.
  });
}

/** Human-initiated apply into a DRAFT ontology version. Invalidates governance queries. */
export function useApplyOntologyChangeRequest(changeRequestId: string) {
  const invalidate = useGovernanceInvalidate(changeRequestId);
  return useMutation({
    mutationFn: (payload?: GovernanceApplyRequest) =>
      apiClient.applyOntologyChangeRequest(changeRequestId, payload),
    onSuccess: invalidate,
    // A staleness 409 still transitions QUEUED->SUPERSEDED server-side; refresh.
    onError: invalidate,
  });
}

export function useProposeOntologyChangeRequest(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OntologyChangeRequestCreateRequest) =>
      apiClient.proposeOntologyChangeRequest(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["governance", "change-requests"] });
    },
  });
}

export function useAddOntologyChangeItem(changeRequestId: string) {
  const invalidate = useGovernanceInvalidate(changeRequestId);
  return useMutation({
    mutationFn: (payload: OntologyChangeItemRequest) =>
      apiClient.addOntologyChangeItem(changeRequestId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateOntologyChangeRequest(changeRequestId: string) {
  const invalidate = useGovernanceInvalidate(changeRequestId);
  return useMutation({
    mutationFn: (payload: OntologyChangeRequestUpdateRequest) =>
      apiClient.updateOntologyChangeRequest(changeRequestId, payload),
    onSuccess: invalidate,
  });
}

export function useSubmitOntologyChangeRequest(changeRequestId: string) {
  const invalidate = useGovernanceInvalidate(changeRequestId);
  return useMutation({
    mutationFn: () => apiClient.submitOntologyChangeRequest(changeRequestId),
    onSuccess: invalidate,
  });
}

export function useWithdrawOntologyChangeRequest(changeRequestId: string) {
  const invalidate = useGovernanceInvalidate(changeRequestId);
  return useMutation({
    mutationFn: (payload?: GovernanceWithdrawRequest) =>
      apiClient.withdrawOntologyChangeRequest(changeRequestId, payload),
    onSuccess: invalidate,
  });
}

export function useRecordGovernanceReviewDecision(changeRequestId: string) {
  const invalidate = useGovernanceInvalidate(changeRequestId);
  return useMutation({
    mutationFn: (payload: GovernanceReviewDecisionRequest) =>
      apiClient.recordGovernanceReviewDecision(changeRequestId, payload),
    onSuccess: invalidate,
  });
}

// ---- MVP6.8 Copilot (advisory-only; suggests + routes; executes nothing) ----

export const copilotKeys = {
  summary: (projectId: string) => ["projects", projectId, "copilot", "summary"] as const,
  suggestions: (
    projectId: string,
    filters?: { kind?: CopilotSuggestionKind; state?: CopilotSuggestionState; riskLabel?: CopilotRiskLabel },
  ) =>
    [
      "projects",
      projectId,
      "copilot",
      "suggestions",
      filters?.kind ?? "ALL",
      filters?.state ?? "ALL",
      filters?.riskLabel ?? "ALL",
    ] as const,
  suggestion: (suggestionId: string) => ["copilot-suggestions", suggestionId] as const,
};

/** Read-only project copilot summary. Idempotent GET; all-false guard; no real model. */
export function useCopilotSummary(projectId: string) {
  return useQuery({
    queryKey: copilotKeys.summary(projectId),
    queryFn: () => apiClient.getCopilotSummary(projectId),
    enabled: Boolean(projectId),
  });
}

/** Deterministic (byte-stable) copilot suggestion list; every item is source-grounded. */
export function useCopilotSuggestions(
  projectId: string,
  filters?: { kind?: CopilotSuggestionKind; state?: CopilotSuggestionState; riskLabel?: CopilotRiskLabel },
) {
  return useQuery({
    queryKey: copilotKeys.suggestions(projectId, filters),
    queryFn: () =>
      apiClient.listCopilotSuggestions(projectId, {
        kind: filters?.kind,
        state: filters?.state,
        riskLabel: filters?.riskLabel,
      }),
    enabled: Boolean(projectId),
  });
}

/** Read-only single suggestion detail (full grounding + routing-target descriptor). */
export function useCopilotSuggestion(suggestionId: string, enabled = true) {
  return useQuery({
    queryKey: copilotKeys.suggestion(suggestionId),
    queryFn: () => apiClient.getCopilotSuggestion(suggestionId),
    enabled: Boolean(suggestionId) && enabled,
  });
}

/**
 * Audit-only ACCEPT/DISMISS decision. ACCEPT returns a routing-target descriptor
 * (deep-link + optional pre-fill) into an existing gated flow and executes
 * nothing; DISMISS requires a reason code. Invalidates the copilot queries.
 */
export function useDecideCopilotSuggestion(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ suggestionId, payload }: { suggestionId: string; payload: CopilotSuggestionDecisionRequest }) =>
      apiClient.createCopilotSuggestionDecision(suggestionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "copilot"] });
      void queryClient.invalidateQueries({ queryKey: ["copilot-suggestions"] });
    },
  });
}

// ---- MVP6.9 Connectors (read-only catalog + deterministic DRY-RUN preview) ----

export const connectorKeys = {
  catalog: (projectId: string) => ["projects", projectId, "connectors", "catalog"] as const,
  configSchema: (projectId: string, connectorKind: ConnectorKind) =>
    ["projects", projectId, "connectors", connectorKind, "config-schema"] as const,
};

/** Read-only connector catalog (3 frozen mock kinds). Idempotent GET; all-false guard; connects to nothing. */
export function useConnectorCatalog(projectId: string) {
  return useQuery({
    queryKey: connectorKeys.catalog(projectId),
    queryFn: () => apiClient.getConnectorCatalog(projectId),
    enabled: Boolean(projectId),
  });
}

/** Read-only masked config schema for one connector kind. SECRET fields masked; raw_secret_present=false. */
export function useConnectorConfigSchema(projectId: string, connectorKind: ConnectorKind, enabled = true) {
  return useQuery({
    queryKey: connectorKeys.configSchema(projectId, connectorKind),
    queryFn: () => apiClient.getConnectorConfigSchema(projectId, connectorKind),
    enabled: Boolean(projectId) && Boolean(connectorKind) && enabled,
  });
}

/**
 * Deterministic DRY-RUN import preview. Creates NOTHING (no candidate/source/
 * extraction; the published graph is untouched); no external call; no secret used.
 * Modeled as a mutation because it is a POST action the user triggers ("미리보기
 * 실행"), NOT because it mutates state — it does not.
 */
export function useRunConnectorImportPreview(projectId: string, connectorKind: ConnectorKind) {
  return useMutation({
    mutationFn: (payload: ConnectorImportPreviewRequest) =>
      apiClient.runConnectorImportPreview(projectId, connectorKind, payload),
  });
}

// ---- MVP6.10 Multi-tenant (read-only tenant context + strict isolation) ----
// Read-only GETs. `actorId` is a dev-only QA lever (default "dev-user") folded
// into the query key so switching actor re-fetches. A denied read rejects with a
// TenantAccessError (retry disabled so the isolation state renders immediately).

export const tenantKeys = {
  myTenants: (actorId: string) => ["tenants", "mine", actorId] as const,
  summary: (actorId: string, tenantId: string) => ["tenants", actorId, tenantId, "summary"] as const,
  projects: (actorId: string, tenantId: string) => ["tenants", actorId, tenantId, "projects"] as const,
};

/** The actor's visibility set (my tenants). Idempotent GET; all-false guard; never lists another tenant. */
export function useMyTenants(actorId: string) {
  return useQuery({
    queryKey: tenantKeys.myTenants(actorId),
    queryFn: () => apiClient.getMyTenants(actorId),
    enabled: Boolean(actorId),
  });
}

/** A single tenant summary (member-only). Denied -> TenantAccessError (404-not-leak / 403-suspended). */
export function useTenantSummary(actorId: string, tenantId: string, enabled = true) {
  return useQuery({
    queryKey: tenantKeys.summary(actorId, tenantId),
    queryFn: () => apiClient.getTenantSummary(tenantId, actorId),
    enabled: Boolean(actorId) && Boolean(tenantId) && enabled,
    retry: false,
  });
}

/** Tenant-scoped project list (this tenant only; never another tenant's projects). */
export function useTenantProjects(actorId: string, tenantId: string, enabled = true) {
  return useQuery({
    queryKey: tenantKeys.projects(actorId, tenantId),
    queryFn: () => apiClient.getTenantProjects(tenantId, actorId),
    enabled: Boolean(actorId) && Boolean(tenantId) && enabled,
    retry: false,
  });
}
