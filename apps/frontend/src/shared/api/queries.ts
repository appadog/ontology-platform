import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import {
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
