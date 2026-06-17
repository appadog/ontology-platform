import {
  mockDashboard,
  mockOntologyGraph,
  mockOntologyVersions,
  mockProjects,
  mockSourcePreview,
  mockSources,
} from "../mocks/fixtures";
import {
  DashboardSummary,
  OntologyGraph,
  OntologyVersionSummary,
  ProjectSummary,
  SourceData,
  SourcePreview,
} from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function delay<T>(value: T): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  return value;
}

async function request<T>(path: string): Promise<T> {
  if (USE_MOCK_API) {
    throw new Error(`No mock handler registered for ${path}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    if (USE_MOCK_API) {
      return delay(mockDashboard);
    }

    return request<DashboardSummary>("/api/v1/dashboard");
  },

  async listProjects(): Promise<ProjectSummary[]> {
    if (USE_MOCK_API) {
      return delay(mockProjects);
    }

    return request<ProjectSummary[]>("/api/v1/projects");
  },

  async getProject(projectId: string): Promise<ProjectSummary> {
    if (USE_MOCK_API) {
      const project = mockProjects.find((item) => item.id === projectId);

      if (!project) {
        throw new Error("Project not found");
      }

      return delay(project);
    }

    return request<ProjectSummary>(`/api/v1/projects/${projectId}`);
  },

  async listOntologyVersions(projectId: string): Promise<OntologyVersionSummary[]> {
    if (USE_MOCK_API) {
      return delay(mockOntologyVersions.filter((version) => version.project_id === projectId));
    }

    return request<OntologyVersionSummary[]>(`/api/v1/projects/${projectId}/ontology/versions`);
  },

  async getOntologyGraph(versionId: string): Promise<OntologyGraph> {
    if (USE_MOCK_API) {
      return delay({
        ...mockOntologyGraph,
        version_id: versionId,
      });
    }

    return request<OntologyGraph>(`/api/v1/ontology/versions/${versionId}/graph`);
  },

  async listSources(projectId: string): Promise<SourceData[]> {
    if (USE_MOCK_API) {
      return delay(mockSources.filter((source) => source.project_id === projectId));
    }

    return request<SourceData[]>(`/api/v1/projects/${projectId}/sources`);
  },

  async getSource(sourceId: string): Promise<SourceData> {
    if (USE_MOCK_API) {
      const source = mockSources.find((item) => item.id === sourceId);

      if (!source) {
        throw new Error("Source not found");
      }

      return delay(source);
    }

    return request<SourceData>(`/api/v1/sources/${sourceId}`);
  },

  async getSourcePreview(sourceId: string): Promise<SourcePreview> {
    if (USE_MOCK_API) {
      return delay({
        ...mockSourcePreview,
        source_id: sourceId,
      });
    }

    return request<SourcePreview>(`/api/v1/sources/${sourceId}/preview`);
  },
};
