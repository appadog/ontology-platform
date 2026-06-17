import {
  mockOntologyGraph,
  mockOntologyVersions,
  mockProjects,
  mockSourcePreviews,
  mockSources,
} from "../mocks/fixtures";
import {
  DashboardSummary,
  OntologyGraph,
  OntologyClass,
  OntologyClassCreateRequest,
  OntologyProperty,
  OntologyPropertyCreateRequest,
  OntologyRelation,
  OntologyRelationCreateRequest,
  OntologyVersion,
  OntologyVersionCreateRequest,
  ProjectCreateRequest,
  ProjectDetail,
  ProjectSummary,
  ProjectUpdateRequest,
  SourceData,
  SourcePreview,
  SourceUploadRequest,
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
};
