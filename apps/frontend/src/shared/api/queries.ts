import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import {
  CandidateListFilters,
  ExtractionJobCreateRequest,
  OntologyClassCreateRequest,
  OntologyPropertyCreateRequest,
  OntologyRelationCreateRequest,
  OntologyVersionCreateRequest,
  ProjectCreateRequest,
  ProjectUpdateRequest,
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
