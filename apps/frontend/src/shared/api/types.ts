export type ProjectStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "DELETED";

export type OntologyVersionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type OntologyElementStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "DELETED";

export type Cardinality =
  | "ONE_TO_ONE"
  | "ONE_TO_MANY"
  | "MANY_TO_ONE"
  | "MANY_TO_MANY"
  | "OPTIONAL"
  | "REQUIRED"
  | "MULTIPLE";

export type SourceType = "CSV" | "EXCEL" | "TXT" | "PDF";

export type SourceStatus =
  | "UPLOADED"
  | "PARSING"
  | "PARSED"
  | "PROFILED"
  | "EXTRACTION_READY"
  | "FAILED";

export type SourcePreviewStatus = "PENDING" | "READY" | "NOT_AVAILABLE" | "FAILED";

export type PropertyDataType = "STRING" | "TEXT" | "INTEGER" | "FLOAT" | "BOOLEAN" | "DATE" | "DATETIME" | "URI";

export type SourceSegmentType = "SHEET" | "ROW" | "CELL" | "PAGE" | "SECTION" | "PARAGRAPH" | "CHUNK";

export type ProfileInferredType =
  | "STRING"
  | "TEXT"
  | "INTEGER"
  | "FLOAT"
  | "BOOLEAN"
  | "DATE"
  | "DATETIME"
  | "URI"
  | "EMPTY"
  | "MIXED"
  | "UNKNOWN";

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

export type ModelRunStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";

export type CandidateValidationCode =
  | "MISSING_EVIDENCE"
  | "INVALID_EVIDENCE_REFERENCE"
  | "SCHEMA_MISMATCH"
  | "ONTOLOGY_ELEMENT_NOT_FOUND"
  | "RELATION_ENDPOINT_MISSING"
  | "LOW_CONFIDENCE"
  | "PROVIDER_OUTPUT_INVALID";

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  source_count: number;
  ontology_version_count: number;
}

export interface ProjectDetail extends ProjectSummary {
  current_ontology_version_id: string | null;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string | null;
}

export interface ProjectUpdateRequest {
  name?: string | null;
  description?: string | null;
  status?: ProjectStatus | null;
}

export interface OntologyVersion {
  id: string;
  project_id: string;
  version: number;
  status: OntologyVersionStatus;
  created_at: string;
  published_at: string | null;
  created_by: string;
}

export interface OntologyVersionCreateRequest {
  created_by?: string | null;
}

export interface Position {
  x: number;
  y: number;
}

export interface OntologyClass {
  id: string;
  version_id: string;
  name: string;
  label: string;
  description: string | null;
  status: OntologyElementStatus;
  position: Position;
  created_at: string;
  updated_at: string;
}

export interface OntologyClassCreateRequest {
  name: string;
  label?: string | null;
  description?: string | null;
  position?: Position;
}

export interface OntologyClassUpdateRequest {
  name?: string | null;
  label?: string | null;
  description?: string | null;
  status?: OntologyElementStatus | null;
  position?: Position | null;
}

export interface OntologyRelation {
  id: string;
  version_id: string;
  name: string;
  label: string;
  description: string | null;
  domain_class_id: string;
  range_class_id: string;
  cardinality: Cardinality;
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
  data_type: PropertyDataType;
  cardinality: Cardinality;
  required: boolean;
  status: OntologyElementStatus;
  created_at: string;
  updated_at: string;
}

export interface OntologyPropertyCreateRequest {
  class_id: string;
  name: string;
  label?: string | null;
  description?: string | null;
  data_type?: PropertyDataType;
  cardinality?: Cardinality;
  required?: boolean;
}

export interface OntologyPropertyUpdateRequest {
  name?: string | null;
  label?: string | null;
  description?: string | null;
  data_type?: PropertyDataType | null;
  cardinality?: Cardinality | null;
  required?: boolean | null;
  status?: OntologyElementStatus | null;
}

export interface OntologyRelationCreateRequest {
  name: string;
  label?: string | null;
  description?: string | null;
  domain_class_id: string;
  range_class_id: string;
  cardinality?: Cardinality;
  required?: boolean;
}

export interface OntologyRelationUpdateRequest {
  name?: string | null;
  label?: string | null;
  description?: string | null;
  domain_class_id?: string | null;
  range_class_id?: string | null;
  cardinality?: Cardinality | null;
  required?: boolean | null;
  status?: OntologyElementStatus | null;
}

export interface OntologyGraphNode {
  id: string;
  class_id: string;
  label: string;
  position: Position;
  status: OntologyElementStatus;
}

export interface OntologyGraphEdge {
  id: string;
  relation_id: string;
  source_class_id: string;
  target_class_id: string;
  label: string;
  cardinality: Cardinality;
  status: OntologyElementStatus;
}

export interface OntologyGraph {
  version_id: string;
  version_status: OntologyVersionStatus;
  nodes: OntologyGraphNode[];
  edges: OntologyGraphEdge[];
  properties: OntologyProperty[];
  classes?: OntologyClass[] | null;
  relations?: OntologyRelation[] | null;
}

export interface SourceData {
  id: string;
  project_id: string;
  file_name: string;
  source_type: SourceType;
  mime_type: string | null;
  size_bytes: number;
  status: SourceStatus;
  preview_status: SourcePreviewStatus;
  storage_uri: string;
  uploaded_at: string;
  created_by: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface SourceUploadRequest {
  file: File;
  source_type: SourceType;
  display_name?: string;
}

export interface SourcePreviewColumn {
  name: string;
  data_type: PropertyDataType;
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
  warnings?: string[];
}

export interface SourceProfileColumn {
  name: string;
  inferred_type: ProfileInferredType;
  nullable: boolean;
  null_ratio: number;
  distinct_count_sampled: number;
  sample_values: unknown[];
  candidate_key_score: number;
}

export interface SourceProfile {
  id: string;
  source_id: string;
  columns: SourceProfileColumn[];
  row_count: number;
  sample_size: number;
  warnings?: string[];
  created_at: string;
}

export interface SourceSegment {
  id: string;
  source_id: string;
  segment_type: SourceSegmentType;
  sequence: number;
  row_index?: number | null;
  column_name?: string | null;
  page_number?: number | null;
  section_title?: string | null;
  paragraph_index?: number | null;
  chunk_index?: number | null;
  text?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SourceParseResponse {
  source_id: string;
  segment_count: number;
  segment_types: SourceSegmentType[];
  warnings?: string[];
}

export interface PromptTemplate {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptVersion {
  id: string;
  prompt_template_id: string;
  version: number;
  template: string;
  output_schema: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export interface ExtractionJob {
  id: string;
  project_id: string;
  source_id: string;
  ontology_version_id: string;
  prompt_version_id: string;
  provider: string;
  model_name: string;
  fixture_id: string | null;
  status: ExtractionJobStatus;
  progress: number;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  error_code: string | null;
  error_message: string | null;
  retry_of_job_id: string | null;
  candidate_entity_count?: number;
  candidate_relation_count?: number;
}

export interface ExtractionJobCreateRequest {
  source_id: string;
  ontology_version_id: string;
  prompt_version_id: string;
  provider?: "mock";
  model_name?: string;
  fixture_id?: string | null;
}

export interface ModelRun {
  id: string;
  extraction_job_id: string;
  provider: string;
  model_name: string;
  prompt_version_id: string;
  ontology_version_id: string;
  input_token_count: number;
  output_token_count: number;
  cost_estimate: number;
  raw_request: Record<string, unknown>;
  raw_response: Record<string, unknown>;
  masking_version: string;
  redaction_summary: Record<string, unknown>;
  status: ModelRunStatus;
  started_at: string | null;
  ended_at: string | null;
}

export interface ExtractionJobDetail extends ExtractionJob {
  model_runs?: ModelRun[];
}

export interface CandidateEntity {
  id: string;
  extraction_job_id: string;
  project_id: string;
  source_id: string;
  source_segment_id: string | null;
  ontology_version_id: string;
  model_run_id: string;
  prompt_version_id: string;
  class_id: string | null;
  entity_name: string;
  normalized_name: string | null;
  property_values: Record<string, unknown>;
  confidence: number;
  evidence_ids: string[];
  raw_payload: Record<string, unknown>;
  validation_status: ValidationStatus;
  validation_codes: CandidateValidationCode[];
  review_status: CandidateReviewStatus;
  publish_status: PublishStatus;
  created_at: string;
}

export interface CandidateRelation {
  id: string;
  extraction_job_id: string;
  project_id: string;
  source_id: string;
  source_segment_id: string | null;
  ontology_version_id: string;
  model_run_id: string;
  prompt_version_id: string;
  source_candidate_entity_id: string | null;
  relation_id: string | null;
  target_candidate_entity_id: string | null;
  confidence: number;
  evidence_ids: string[];
  raw_payload: Record<string, unknown>;
  validation_status: ValidationStatus;
  validation_codes: CandidateValidationCode[];
  review_status: CandidateReviewStatus;
  publish_status: PublishStatus;
  created_at: string;
}

export interface CandidateEvidence {
  id: string;
  source_id: string;
  source_segment_id: string | null;
  source_type: SourceType;
  file_name: string;
  sheet_name?: string | null;
  row_index?: number | null;
  column_name?: string | null;
  page_number?: number | null;
  section_title?: string | null;
  paragraph_id?: number | null;
  chunk_id?: number | null;
  evidence_text?: string | null;
  start_offset?: number | null;
  end_offset?: number | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface CandidateListFilters {
  limit?: number;
  offset?: number;
  source_id?: string;
  ontology_version_id?: string;
  validation_status?: ValidationStatus;
  has_evidence?: boolean;
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
