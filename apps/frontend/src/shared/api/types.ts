export type ProjectStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "DELETED";

export type OntologyVersionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type SourceStatus =
  | "UPLOADED"
  | "PARSING"
  | "PARSED"
  | "PROFILED"
  | "EXTRACTION_READY"
  | "FAILED";

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
  status: OntologyVersionStatus;
  validation_status: ValidationStatus;
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
  validation_status: ValidationStatus;
  created_at: string;
  updated_at: string;
}

export interface OntologyProperty {
  id: string;
  version_id: string;
  class_id: string;
  name: string;
  label: string;
  data_type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN";
  required: boolean;
  validation_status: ValidationStatus;
}

export interface OntologyGraph {
  version_id: string;
  version_status: OntologyVersionStatus;
  classes: OntologyClass[];
  relations: OntologyRelation[];
  properties: OntologyProperty[];
}

export interface SourceData {
  id: string;
  project_id: string;
  file_name: string;
  source_type: "CSV" | "EXCEL" | "TXT" | "PDF";
  mime_type: string;
  size_bytes: number;
  status: SourceStatus;
  preview_status: ValidationStatus;
  storage_uri: string;
  uploaded_at: string;
  created_by: string;
  metadata: Record<string, string | number | boolean>;
}

export interface SourcePreview {
  source_id: string;
  columns: string[];
  rows: Array<Record<string, string | number | null>>;
  row_count_sampled: number;
  total_row_count: number;
  sheet_name?: string;
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
