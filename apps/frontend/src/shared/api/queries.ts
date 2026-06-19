import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import {
  CandidateListFilters,
  ExtractionJobCreateRequest,
  GraphExploreRequest,
  OntologyClassCreateRequest,
  OntologyClassUpdateRequest,
  OntologyPropertyCreateRequest,
  OntologyPropertyUpdateRequest,
  OntologyRelationCreateRequest,
  OntologyRelationUpdateRequest,
  OntologyVersionCreateRequest,
  PublishCandidate,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  RagAnswerRequest,
  ReviewTaskListFilters,
  SearchRequest,
  SimilarEvidenceRequest,
  SourceUploadRequest,
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
