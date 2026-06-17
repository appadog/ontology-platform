export type ProjectStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "DELETED";

export type OntologyVersionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type OntologyElementStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "DELETED";

export type SourceType = "CSV" | "EXCEL" | "TXT" | "PDF";

export type SourceStatus =
  | "UPLOADED"
  | "PARSING"
  | "PARSED"
  | "PROFILED"
  | "EXTRACTION_READY"
  | "FAILED";

export type SourcePreviewStatus = "PENDING" | "READY" | "NOT_AVAILABLE" | "FAILED";

export type CandidateReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "MODIFIED" | "NEEDS_DISCUSSION";

export type ValidationStatus = "NOT_VALIDATED" | "PASSED" | "WARNING" | "FAILED";

export type PublishStatus = "NOT_PUBLISHED" | "PUBLISHED" | "ROLLED_BACK";

export type ExtractionJobStatus =
  | "PENDING"
  | "QUEUED"
  | "RUNNING"
  | "SUCCESS"
  | "PARTIAL_FAILED"
  | "FAILED"
  | "CANCELLED"
  | "RETRYING";

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  source_count: number;
  ontology_version_count: number;
}

export interface ProjectDetail extends ProjectSummary {
  current_ontology_version_id?: string | null;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface OntologyVersionSummary {
  id: string;
  project_id: string;
  name: string;
  status: OntologyVersionStatus;
  created_at: string;
  updated_at: string;
}

export interface OntologyClass {
  id: string;
  version_id: string;
  name: string;
  label: string;
  description: string;
  status: OntologyElementStatus;
  position: {
    x: number;
    y: number;
  };
  created_at: string;
  updated_at: string;
}

export interface OntologyRelation {
  id: string;
  version_id: string;
  name: string;
  label: string;
  description: string;
  domain_class_id: string;
  range_class_id: string;
  cardinality: "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_ONE" | "MANY_TO_MANY";
  required: boolean;
  status: OntologyElementStatus;
  created_at: string;
  updated_at: string;
}

export interface OntologyProperty {
  id: string;
  version_id: string;
  class_id: string;
  name: string;
  label: string;
  description?: string | null;
  data_type: "STRING" | "TEXT" | "INTEGER" | "FLOAT" | "BOOLEAN" | "DATE" | "DATETIME" | "URI";
  cardinality: "OPTIONAL" | "REQUIRED" | "MULTIPLE" | "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_ONE" | "MANY_TO_MANY";
  required: boolean;
  status: OntologyElementStatus;
  created_at: string;
  updated_at: string;
}

export interface OntologyGraphNode {
  id: string;
  class_id: string;
  label: string;
  position: {
    x: number;
    y: number;
  };
  status: OntologyElementStatus;
}

export interface OntologyGraphEdge {
  id: string;
  relation_id: string;
  source_class_id: string;
  target_class_id: string;
  label: string;
  cardinality: OntologyRelation["cardinality"];
  status: OntologyElementStatus;
}

export interface OntologyGraph {
  version_id: string;
  version_status: OntologyVersionStatus;
  nodes: OntologyGraphNode[];
  edges: OntologyGraphEdge[];
  properties: OntologyProperty[];
  classes?: OntologyClass[];
  relations?: OntologyRelation[];
}

export interface SourceData {
  id: string;
  project_id: string;
  file_name: string;
  source_type: SourceType;
  mime_type: string;
  size_bytes: number;
  status: SourceStatus;
  preview_status: SourcePreviewStatus;
  storage_uri: string;
  uploaded_at: string;
  created_by: string;
  metadata: Record<string, string | number | boolean>;
}

export interface SourceUploadRequest {
  file: File;
  source_type: SourceType;
  display_name?: string;
}

export interface SourcePreviewColumn {
  name: string;
  data_type: OntologyProperty["data_type"];
  nullable: boolean;
  sample_values: Array<string | number | boolean | null>;
}

export interface SourcePreview {
  source_id: string;
  columns: SourcePreviewColumn[];
  rows: Array<Record<string, string | number | null>>;
  row_count_sampled: number;
  total_row_count: number;
  sheet_name?: string | null;
  warnings: string[];
}

export interface DashboardSummary {
  active_project_count: number;
  source_count: number;
  ontology_class_count: number;
  ontology_relation_count: number;
  failed_source_count: number;
  recent_activity: Array<{
    id: string;
    label: string;
    timestamp: string;
  }>;
}
