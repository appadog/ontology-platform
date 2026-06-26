import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import {
  PermissionCheckRequest,
  CandidateListFilters,
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
