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

export type CandidateKind = "ENTITY" | "RELATION" | "PROPERTY_VALUE";

export type ValidationRuleCode =
  | "CLASS_EXISTS"
  | "RELATION_EXISTS"
  | "RELATION_DOMAIN_RANGE"
  | "RELATION_DIRECTION"
  | "REQUIRED_PROPERTY"
  | "DATATYPE"
  | "CARDINALITY"
  | "DUPLICATE_CANDIDATE"
  | "ORPHAN_NODE"
  | "EVIDENCE_MISSING"
  | "ONTOLOGY_VERSION_MISMATCH"
  | "LOW_CONFIDENCE";

export type ValidationResultSeverity = "INFO" | "WARNING" | "FAILED";

export type ReviewTaskStatus = "OPEN" | "ASSIGNED" | "IN_REVIEW" | "DECIDED" | "CANCELLED";

export type ReviewDecisionType = "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "MODIFY_AND_APPROVE";

export type CorrectionStatus = "DRAFT" | "SUBMITTED" | "APPLIED" | "SUPERSEDED";

export type PublishJobStatus = "PENDING" | "RUNNING" | "SUCCESS" | "PARTIAL_FAILED" | "FAILED";

export type PublishEligibilityReasonCode =
  | "ELIGIBLE"
  | "NOT_APPROVED_OR_MODIFIED"
  | "PENDING"
  | "REJECTED"
  | "NEEDS_DISCUSSION"
  | "MISSING_EVIDENCE"
  | "BROKEN_EVIDENCE"
  | "FAILED_VALIDATION"
  | "WARNING_REASON_REQUIRED"
  | "ALREADY_PUBLISHED"
  | "ONTOLOGY_VERSION_MISMATCH"
  | "PUBLISH_PERMISSION_REQUIRED"
  | "CORRECTION_DIFF_REQUIRED";

export interface CandidateRef {
  candidate_kind: CandidateKind;
  candidate_id: string;
}

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

export interface ValidationResult {
  id: string;
  candidate_kind: CandidateKind;
  candidate_id: string;
  rule_code: ValidationRuleCode;
  severity: ValidationResultSeverity;
  message: string;
  field_path: string;
  blocking: boolean;
  suggested_fix: string | null;
  created_at: string;
}

export interface PublishEligibility {
  candidate_kind: CandidateKind;
  candidate_id: string;
  eligible: boolean;
  reasons: PublishEligibilityReasonCode[];
  review_status: CandidateReviewStatus;
  publish_status: PublishStatus;
  validation_status: ValidationStatus;
  has_evidence: boolean;
  has_warning_reason: boolean;
}

export interface ReviewTaskListFilters {
  assignment?: "assigned-to-me" | "unassigned" | "all";
  status?: CandidateReviewStatus | "ALL";
  validation_status?: ValidationStatus | "ALL";
  confidence?: "low" | "medium" | "high" | "all";
  source_id?: string;
  extraction_job_id?: string;
  limit?: number;
  offset?: number;
}

export interface ReviewTask {
  id: string;
  project_id: string;
  candidate_kind: CandidateKind;
  candidate_id: string;
  ontology_version_id: string;
  source_id: string;
  source_display_name: string;
  source_context_label: string;
  extraction_job_id: string;
  job_display_label: string;
  status: ReviewTaskStatus;
  review_status: CandidateReviewStatus;
  publish_status: PublishStatus;
  assignee_id: string | null;
  assignee_display_name: string | null;
  is_assigned_to_me: boolean;
  priority: "HIGH" | "MEDIUM" | "LOW";
  priority_reason: string;
  validation_status: ValidationStatus;
  validation_codes: ValidationRuleCode[];
  top_validation: ValidationResult;
  candidate_display_name: string;
  candidate_summary: string;
  confidence: number;
  evidence_count: number;
  evidence_state: "PRESENT" | "MISSING" | "BROKEN";
  last_decision_summary: string | null;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
}

export interface ReviewTaskListResponse {
  items: ReviewTask[];
  total_count: number;
  limit: number;
  offset: number;
}

export interface CorrectionDiffItem {
  field_path: string;
  original_value: unknown;
  corrected_value: unknown;
}

export interface CandidateCorrection {
  id: string;
  status: CorrectionStatus;
  original_snapshot: Record<string, unknown> | null;
  corrected_snapshot: Record<string, unknown>;
  diff: CorrectionDiffItem[];
  evidence_ids: string[];
  reviewer_id: string;
  reviewer_display_name: string;
  updated_at: string;
}

export interface ReviewDecision {
  id: string;
  review_task_id: string;
  decision: ReviewDecisionType;
  resulting_review_status: CandidateReviewStatus;
  reviewer_id: string;
  reviewer_display_name: string;
  reason: string | null;
  correction_diff: CorrectionDiffItem[];
  publish_eligibility: PublishEligibility;
  created_at: string;
}

export interface ReviewTaskDetail extends ReviewTask {
  original_snapshot: Record<string, unknown>;
  corrected_snapshot: Record<string, unknown> | null;
  correction: CandidateCorrection | null;
  validation_results: ValidationResult[];
  decision_history: ReviewDecision[];
  publish_eligibility: PublishEligibility;
  source_excerpt: string;
  source_locator: string;
  can_decide: boolean;
  read_only_reason: string | null;
}

export type PublishCandidate = PublishEligibility;

export interface PublishJob {
  id: string;
  project_id: string;
  ontology_version_id: string;
  status: PublishJobStatus;
  requested_by: string | null;
  candidate_refs: CandidateRef[];
  eligible_count: number;
  published_entity_count: number;
  published_relation_count: number;
  skipped_count: number;
  skip_reasons: PublishEligibility[];
  published_graph_version_id: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  error_code: string | null;
  error_message: string | null;
}

export interface PublishedGraphVersion {
  id: string;
  project_id: string;
  version: number;
  ontology_version_id: string;
  publish_job_id: string;
  is_current: boolean;
  created_by: string | null;
  created_at: string;
  summary?: Record<string, unknown>;
}

export interface EvidenceRef {
  evidence_id: string;
  source_id: string;
  source_display_name: string;
  locator: string;
}

export interface PublishedLineage {
  publish_job_id: string;
  published_graph_version_id: string;
  published_graph_version: number;
  ontology_version_id: string;
  candidate_kind: CandidateKind;
  candidate_id: string;
  original_snapshot: Record<string, unknown>;
  original_snapshot_ref: string | null;
  corrected_snapshot: Record<string, unknown> | null;
  evidence_refs: EvidenceRef[];
  reviewer_id: string;
  reviewer_display_name: string | null;
  review_decision_id: string;
  review_decision_type: ReviewDecisionType;
  reason: string | null;
  reviewed_at: string;
  published_at: string;
}

export interface PublishedEntity {
  id: string;
  project_id: string;
  published_graph_version_id: string;
  ontology_version_id: string;
  class_id: string;
  canonical_name: string;
  properties: Record<string, unknown>;
  source_candidate_entity_ids: string[];
  original_snapshot: Record<string, unknown> | null;
  corrected_snapshot: Record<string, unknown> | null;
  lineage: PublishedLineage;
  created_at: string;
}

export interface PublishedRelation {
  id: string;
  project_id: string;
  published_graph_version_id: string;
  ontology_version_id: string;
  source_published_entity_id: string;
  relation_id: string;
  target_published_entity_id: string;
  properties: Record<string, unknown>;
  source_candidate_relation_ids: string[];
  original_snapshot: Record<string, unknown> | null;
  corrected_snapshot: Record<string, unknown> | null;
  lineage: PublishedLineage;
  created_at: string;
}

export interface PublishedGraphSnapshot {
  version: PublishedGraphVersion;
  entities: PublishedEntity[];
  relations: PublishedRelation[];
}

export type QualityDrilldownTarget = "review_inbox" | "publish_jobs" | "published_graph";

export interface QualityDrilldownHint {
  target: QualityDrilldownTarget;
  label: string;
  params: Record<string, string>;
}

export interface QualityCountMetric {
  value: number;
  drilldown?: QualityDrilldownHint;
}

export interface QualityRateMetric {
  numerator: number;
  denominator: number;
  rate: number;
  drilldown?: QualityDrilldownHint;
}

export interface QualitySummary {
  project_id: string;
  ontology_version_id: string | null;
  generated_at: string;
  candidate_counts: {
    total: QualityCountMetric;
    entity: QualityCountMetric;
    relation: QualityCountMetric;
    property_value: QualityCountMetric;
    missing_evidence: QualityCountMetric;
  };
  validation_counts: {
    not_validated: QualityCountMetric;
    passed: QualityCountMetric;
    warning: QualityCountMetric;
    failed: QualityCountMetric;
    by_rule_code: Partial<Record<ValidationRuleCode, QualityCountMetric>> & Record<string, QualityCountMetric>;
  };
  review_counts: {
    pending: QualityCountMetric;
    approved: QualityCountMetric;
    rejected: QualityCountMetric;
    modified: QualityCountMetric;
    needs_discussion: QualityCountMetric;
  };
  publish_counts: {
    not_published: QualityCountMetric;
    published: QualityCountMetric;
    rolled_back: QualityCountMetric;
    published_entities: QualityCountMetric;
    published_relations: QualityCountMetric;
    publish_success: QualityCountMetric;
    publish_failed: QualityCountMetric;
    current_version_id?: string | null;
    current_version?: number | null;
  };
  rates: {
    approval_rate: QualityRateMetric;
    rejection_rate: QualityRateMetric;
    modification_rate: QualityRateMetric;
    validation_failure_rate: QualityRateMetric;
    evidence_missing_rate: QualityRateMetric;
    published_ratio: QualityRateMetric;
  };
}

export interface PublishedGraphVersionRef {
  published_graph_version_id: string;
  published_graph_version: number;
  ontology_version_id: string;
  is_current: boolean;
  created_at?: string;
}

export interface SourceRef {
  source_id: string;
  source_segment_id?: string | null;
  locator?: string | null;
  label?: string | null;
}

export interface ReviewDecisionRef {
  review_decision_id?: string;
  review_decision_type?: ReviewDecisionType;
  reviewer_id?: string | null;
  reviewed_at?: string | null;
}

export type QualityMetricGroup =
  | "COMPLETENESS"
  | "CONSISTENCY"
  | "TRACEABILITY"
  | "VALIDATION"
  | "REVIEW"
  | "DUPLICATE"
  | "RELATION_DENSITY";

export type QualityMetricUnit = "COUNT" | "RATE" | "RATIO" | "PERCENT";

export interface AdvancedQualityDrilldownHint {
  target: string;
  label?: string | null;
  query: Record<string, unknown>;
}

export interface QualityFormulaMetadata {
  formula_id: string;
  numerator: string;
  denominator: string;
  scope: string;
  time_window: string;
  breakdown_dimension: string;
  drilldown_target: string;
  description?: string | null;
  unit?: QualityMetricUnit;
  notes?: string | null;
}

export interface QualityMetricBreakdown {
  dimension: string;
  key?: string;
  label: string;
  value: number;
  rate?: number | null;
  drilldown?: AdvancedQualityDrilldownHint;
}

export interface QualityMetric {
  metric_id: string;
  group: QualityMetricGroup;
  label: string;
  description?: string | null;
  unit: QualityMetricUnit;
  value?: number | null;
  rate?: number | null;
  trend?: number | null;
  formula: QualityFormulaMetadata;
  drilldown?: AdvancedQualityDrilldownHint;
  evidence_refs?: EvidenceRef[];
  published_graph_version_ref?: PublishedGraphVersionRef;
  breakdowns?: QualityMetricBreakdown[];
}

export interface QualityMetricGroupResult {
  group: QualityMetricGroup;
  label: string;
  description?: string | null;
  metrics: QualityMetric[];
}

export interface QualityMetricsResponse {
  project_id: string;
  published_graph_version_ref?: PublishedGraphVersionRef;
  generated_at: string;
  filters?: Record<string, unknown>;
  metric_groups: QualityMetricGroupResult[];
}

export interface QualityMetricDetail {
  project_id: string;
  metric: QualityMetric;
  breakdown_rows?: QualityMetricBreakdown[];
}

export type EvaluationDatasetStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type EvaluationSampleKind = "SOURCE_SEGMENT" | "MANUAL_TEXT" | "TABLE_ROW";

export type GoldenSetItemKind = "ENTITY" | "RELATION" | "PROPERTY_VALUE" | "EVIDENCE_LINK";

export interface EvaluationDataset {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  status: EvaluationDatasetStatus;
  sample_count?: number;
  gold_entity_count?: number;
  gold_relation_count?: number;
  owner_id?: string | null;
  active_version_id?: string | null;
  created_at: string;
  updated_at: string;
  notes?: string | null;
}

export interface EvaluationDatasetCreateRequest {
  name: string;
  description?: string | null;
}

export interface EvaluationDatasetVersion {
  id: string;
  dataset_id: string;
  project_id: string;
  version: number;
  status: EvaluationDatasetStatus;
  source_refs?: SourceRef[];
  source_segment_refs?: SourceRef[];
  candidate_refs?: CandidateRef[];
  evidence_refs?: EvidenceRef[];
  golden_item_count: number;
  created_by?: string | null;
  created_at: string;
  notes?: string | null;
}

export interface GoldenSetItem {
  id: string;
  dataset_version_id: string;
  project_id: string;
  kind: GoldenSetItemKind;
  expected_payload: Record<string, unknown>;
  source_refs?: SourceRef[];
  evidence_refs?: EvidenceRef[];
  review_decision_ref?: ReviewDecisionRef;
  published_graph_version_ref?: PublishedGraphVersionRef;
  reviewer_id?: string | null;
  created_at: string;
  notes?: string | null;
}

export interface EvaluationSample {
  id: string;
  project_id: string;
  dataset_id: string;
  sample_kind: EvaluationSampleKind;
  source_id?: string | null;
  source_segment_id?: string | null;
  source_locator?: string | null;
  title: string;
  content_text?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface EvaluationSampleCreateRequest {
  sample_kind: EvaluationSampleKind;
  source_id?: string | null;
  source_segment_id?: string | null;
  source_locator?: string | null;
  title: string;
  content_text?: string | null;
  metadata?: Record<string, unknown>;
}

export interface GoldEvidenceRef {
  sample_id: string;
  source_id?: string | null;
  source_segment_id?: string | null;
  locator?: string | null;
  offset_start?: number | null;
  offset_end?: number | null;
  quote?: string | null;
}

export interface GoldEntity {
  id: string;
  project_id: string;
  dataset_id: string;
  sample_id: string;
  ontology_class_id: string;
  label: string;
  normalized_value?: string | null;
  evidence: GoldEvidenceRef;
  created_at: string;
}

export interface GoldEntityCreateRequest {
  sample_id: string;
  ontology_class_id: string;
  label: string;
  normalized_value?: string | null;
  evidence: GoldEvidenceRef;
}

export interface GoldRelation {
  id: string;
  project_id: string;
  dataset_id: string;
  sample_id: string;
  ontology_relation_id: string;
  source_gold_entity_id: string;
  target_gold_entity_id: string;
  evidence: GoldEvidenceRef;
  created_at: string;
}

export interface GoldRelationCreateRequest {
  sample_id: string;
  ontology_relation_id: string;
  source_gold_entity_id: string;
  target_gold_entity_id: string;
  evidence: GoldEvidenceRef;
}

export interface EvaluationDimensions {
  prompt_version_id?: string | null;
  model_run_id?: string | null;
  source_type?: string | null;
  class_type?: string | null;
  relation_type?: string | null;
  validation_outcome?: string | null;
  review_decision?: string | null;
  correction_pattern?: string | null;
}

export interface PromptPerformanceRow {
  dimensions: EvaluationDimensions;
  approval_rate: number;
  rejection_rate: number;
  modification_rate: number;
  failed_validation_rate: number;
  missing_evidence_rate: number;
  latency_ms?: number | null;
  token_count?: number | null;
  cost?: number | null;
  drilldown?: AdvancedQualityDrilldownHint;
}

export interface PromptPerformanceSummary {
  project_id: string;
  generated_at: string;
  filters?: Record<string, unknown>;
  comparison_dimensions: string[];
  rows: PromptPerformanceRow[];
}

export type PromptExperimentStatus = "DRAFT" | "RUNNING" | "COMPLETED" | "CANCELLED";

export interface PromptExperiment {
  id: string;
  project_id: string;
  name: string;
  hypothesis?: string | null;
  status: PromptExperimentStatus;
  dataset_id: string;
  dataset_version_id: string;
  control_prompt_version_id: string;
  treatment_prompt_version_id: string;
  model_provider?: string | null;
  model_name?: string | null;
  run_window?: {
    started_at?: string | null;
    ended_at?: string | null;
  };
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  notes?: string | null;
}

export interface EvaluationRunMetrics {
  approval_rate?: number | null;
  rejection_rate?: number | null;
  modification_rate?: number | null;
  failed_validation_rate?: number | null;
  missing_evidence_rate?: number | null;
  correction_pattern_counts?: Record<string, number>;
}

export type EvaluationRunMode = "DETERMINISTIC_MOCK";

export type EvaluationRunStatus = "PENDING" | "RUNNING" | "SUCCESS" | "SUCCEEDED" | "FAILED";

export type EvaluationMetricStatus = "MEASURED" | "NOT_APPLICABLE";

export type EvaluationMetricName =
  | "ENTITY_PRECISION"
  | "ENTITY_RECALL"
  | "ENTITY_F1"
  | "RELATION_PRECISION"
  | "RELATION_RECALL"
  | "RELATION_F1"
  | "RELATION_DIRECTION_ACCURACY"
  | "EVIDENCE_MATCH_RATE";

export type EvaluationErrorType =
  | "MISSING_ENTITY"
  | "EXTRA_ENTITY"
  | "WRONG_ENTITY_CLASS"
  | "MISSING_RELATION"
  | "EXTRA_RELATION"
  | "WRONG_RELATION_TYPE"
  | "WRONG_RELATION_DIRECTION"
  | "EVIDENCE_MISMATCH";

export type EvaluationCandidateKind = "ENTITY" | "RELATION";

export interface EvaluationCandidateRef {
  candidate_id: string;
  candidate_kind: EvaluationCandidateKind;
  sample_id: string;
  ontology_class_id?: string | null;
  ontology_relation_id?: string | null;
  label?: string | null;
  normalized_value?: string | null;
  source_gold_entity_id?: string | null;
  target_gold_entity_id?: string | null;
  evidence?: GoldEvidenceRef | null;
}

export interface EvaluationMetric {
  run_id: string;
  metric_name: EvaluationMetricName;
  value: number | null;
  numerator: number;
  denominator: number;
  formula: string;
  status: EvaluationMetricStatus;
  computed_at: string;
}

export interface EvaluationRunCreateRequest {
  dataset_id: string;
  run_mode: EvaluationRunMode;
  ontology_version_id: string;
  prompt_version_id: string;
  model_name: string;
  model_run_id?: string | null;
  parser_version: string;
}

export interface EvaluationRun {
  id: string;
  project_id: string;
  dataset_id?: string;
  dataset_version_id?: string;
  experiment_id?: string | null;
  status: EvaluationRunStatus;
  run_mode?: EvaluationRunMode;
  ontology_version_id?: string | null;
  prompt_version_id?: string | null;
  model_run_id?: string | null;
  model_provider?: string | null;
  model_name?: string | null;
  parser_version?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  ended_at?: string | null;
  requested_by?: string | null;
  metric_summary?: Partial<Record<EvaluationMetricName, number | null>>;
  metrics: EvaluationRunMetrics;
  dimensions: EvaluationDimensions;
  error_code?: string | null;
  error_message?: string | null;
}

export interface EvaluationErrorCase {
  id: string;
  run_id: string;
  project_id: string;
  dataset_id: string;
  sample_id: string;
  error_type: EvaluationErrorType;
  gold_entity_id?: string | null;
  gold_relation_id?: string | null;
  candidate_ref?: EvaluationCandidateRef | null;
  comparison_summary: string;
  gold_evidence?: GoldEvidenceRef | null;
  candidate_evidence?: GoldEvidenceRef | null;
  created_at: string;
}

// ---- MVP6.3 Benchmark Comparison / Confusion Matrix ----
// Field/enum names match docs/api/openapi-mvp6-3-draft.json exactly.
// Reuses MVP6.1 EvaluationRun / EvaluationMetric* / EvaluationErrorCase / EvaluationCandidateRef
// / GoldEvidenceRef verbatim — no renames.

export type BenchmarkComparisonGroupBy =
  | "MODEL"
  | "PROMPT_VERSION"
  | "ONTOLOGY_VERSION"
  | "DATASET_VERSION"
  | "PARSER_VERSION";

export type ComparisonComparabilityFlag =
  | "SAME_DATASET"
  | "DIFFERENT_DATASET_VERSION"
  | "DIFFERENT_DATASET"
  | "DIFFERENT_ONTOLOGY_VERSION"
  | "MISSING_METRIC";

export type ConfusionMatrixAxis = "ENTITY_CLASS" | "RELATION_TYPE";

export type MetricDeltaStatus = "IMPROVED" | "REGRESSED" | "UNCHANGED" | "NOT_COMPARABLE";

export type RunExclusionReason =
  | "NOT_TERMINAL_SUCCESS"
  | "DIFFERENT_PROJECT"
  | "RUN_NOT_FOUND"
  | "DUPLICATE_RUN_ID";

export interface BenchmarkMutationGuard {
  candidate_graph_mutated: boolean;
  published_graph_mutated: boolean;
  evaluation_run_started: boolean;
  gold_set_mutated: boolean;
}

export interface BenchmarkComparisonCreateRequest {
  run_ids: string[];
  group_by: BenchmarkComparisonGroupBy;
  baseline_run_id?: string | null;
  metric_names?: EvaluationMetricName[] | null;
}

export interface BenchmarkRunContext {
  model_name?: string | null;
  model_provider?: string | null;
  prompt_version_id?: string | null;
  ontology_version_id?: string | null;
  parser_version?: string | null;
  dataset_id?: string | null;
  dataset_version_id?: string | null;
  model_run_id?: string | null;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface BenchmarkComparisonRun {
  run_id: string;
  label: string;
  group_value: string;
  is_baseline: boolean;
  run_context: BenchmarkRunContext;
  comparability_flags: ComparisonComparabilityFlag[];
}

export interface BenchmarkMetricCell {
  run_id: string;
  value?: number | null;
  metric_status: EvaluationMetricStatus;
  delta?: number | null;
  delta_status: MetricDeltaStatus;
}

export interface BenchmarkMetricRow {
  metric_name: EvaluationMetricName;
  baseline_value?: number | null;
  baseline_metric_status: EvaluationMetricStatus;
  row_comparability_flags: ComparisonComparabilityFlag[];
  per_run: BenchmarkMetricCell[];
}

export interface BenchmarkExcludedRun {
  run_id: string;
  exclusion_reason: RunExclusionReason;
  detail?: string | null;
}

export interface ComparabilitySummary {
  flags: ComparisonComparabilityFlag[];
  notes: string[];
}

export interface BenchmarkComparisonCapabilities {
  can_view?: boolean;
  can_create_comparison?: boolean;
  can_drill_error_cases?: boolean;
}

export interface BenchmarkComparison {
  id: string;
  project_id: string;
  group_by: BenchmarkComparisonGroupBy;
  baseline_run_id: string;
  metric_names: EvaluationMetricName[];
  delta_epsilon: number;
  runs: BenchmarkComparisonRun[];
  metric_rows: BenchmarkMetricRow[];
  excluded_runs: BenchmarkExcludedRun[];
  comparability_summary: ComparabilitySummary;
  generated_at: string;
  mutation_guard: BenchmarkMutationGuard;
  capabilities?: BenchmarkComparisonCapabilities;
  safety_note?: string | null;
}

export interface BenchmarkComparisonSummary {
  id: string;
  project_id: string;
  group_by: BenchmarkComparisonGroupBy;
  baseline_run_id: string;
  run_count: number;
  comparability_flags: ComparisonComparabilityFlag[];
  generated_at: string;
}

export interface BenchmarkComparisonListResponse {
  items: BenchmarkComparisonSummary[];
  next_cursor?: string | null;
}

export interface ConfusionCellErrorCaseRef {
  cell_id: string;
  error_case_count: number;
}

export interface ConfusionMatrixCell {
  id: string;
  gold_label: string;
  candidate_label: string;
  is_diagonal: boolean;
  count: number;
  contributing_error_case_ref: ConfusionCellErrorCaseRef;
}

export interface ConfusionMatrixLabelCount {
  label: string;
  count: number;
}

export interface ConfusionMatrixTotals {
  row_totals: ConfusionMatrixLabelCount[];
  col_totals: ConfusionMatrixLabelCount[];
  diagonal_count: number;
  off_diagonal_count: number;
  accuracy?: number | null;
  accuracy_status: EvaluationMetricStatus;
}

export interface ConfusionMatrix {
  comparison_id: string;
  run_id: string;
  axis: ConfusionMatrixAxis;
  labels: string[];
  label_display_names?: Record<string, string>;
  cells: ConfusionMatrixCell[];
  totals: ConfusionMatrixTotals;
  generated_at: string;
  mutation_guard: BenchmarkMutationGuard;
}

export interface ConfusionCellErrorCasesResponse {
  comparison_id: string;
  run_id: string;
  axis: ConfusionMatrixAxis;
  cell_id: string;
  gold_label: string;
  candidate_label: string;
  error_cases: EvaluationErrorCase[];
  next_cursor?: string | null;
}

/** Reserved display sentinel for an absent gold (false positive) or candidate (false negative) bucket. */
export const CONFUSION_NONE_LABEL = "__NONE__";

export type SearchResultKind =
  | "PUBLISHED_ENTITY"
  | "PUBLISHED_RELATION"
  | "SOURCE"
  | "SOURCE_CHUNK"
  | "EVIDENCE"
  | "LINEAGE";

export type SearchIndexState = "READY" | "PARTIAL" | "STALE";

export interface SearchResultItem {
  id: string;
  kind: SearchResultKind;
  title: string;
  snippet: string;
  score: number;
  published_graph_version_ref?: PublishedGraphVersionRef;
  source_ref?: SourceRef;
  evidence_refs?: EvidenceRef[];
  lineage_ref?: PublishedFactRef;
  metadata?: Record<string, unknown>;
}

export interface SearchResultGroup {
  kind: SearchResultKind;
  total_count: number;
  items: SearchResultItem[];
}

export interface SearchResponse {
  project_id: string;
  query: string;
  published_graph_version_ref?: PublishedGraphVersionRef;
  groups: SearchResultGroup[];
  total_count: number;
  limit: number;
  offset: number;
  index_state: SearchIndexState;
}

export interface SearchRequest {
  query?: string;
  kind?: SearchResultKind | "ALL";
  index_state?: SearchIndexState;
  limit?: number;
  offset?: number;
}

export type VectorAdapterStatus = "AVAILABLE" | "FALLBACK_KEYWORD" | "UNAVAILABLE" | "NOT_CONFIGURED";

export type VectorFallbackReason =
  | "VECTOR_DB_NOT_CONFIGURED"
  | "INDEX_NOT_READY"
  | "ADAPTER_ERROR"
  | "KEYWORD_FALLBACK_USED";

export interface VectorAdapterState {
  project_id: string;
  status: VectorAdapterStatus;
  embedding_target: string;
  index_name?: string | null;
  indexed_chunk_count?: number | null;
  last_indexed_at?: string | null;
  fallback_reason?: VectorFallbackReason | null;
  message?: string | null;
}

export type PublishedFactType = "ENTITY" | "RELATION";

export interface PublishedFactRef {
  fact_type: PublishedFactType;
  fact_id: string;
  published_graph_version_id: string;
  label: string;
}

export interface SimilarEvidenceRequest {
  query?: string | null;
  source_segment_id?: string | null;
  evidence_id?: string | null;
  published_fact_id?: string | null;
  published_fact_type?: PublishedFactType | null;
  published_graph_version_id?: string | null;
  limit?: number;
}

export interface SimilarEvidenceItem {
  evidence_ref: EvidenceRef;
  source_ref?: SourceRef;
  snippet: string;
  similarity_score: number;
  match_reason?: string | null;
  published_graph_version_ref?: PublishedGraphVersionRef;
  linked_published_fact_refs?: PublishedFactRef[];
}

export interface SimilarEvidenceResponse {
  project_id: string;
  adapter_state: VectorAdapterState;
  fallback_used: boolean;
  items: SimilarEvidenceItem[];
}

export type RagAnswerState = "ANSWERED" | "INSUFFICIENT_EVIDENCE" | "ERROR";

export type RagCitationKind = "EVIDENCE_CHUNK" | "SOURCE_CHUNK" | "PUBLISHED_ENTITY" | "PUBLISHED_RELATION";

export interface RagAnswerRequest {
  question: string;
  published_graph_version_id?: string | null;
  scope?: SearchResultKind[];
  source_ids?: string[];
  max_citations?: number;
}

export interface RagCitation {
  citation_id: string;
  kind: RagCitationKind;
  evidence_ref?: EvidenceRef;
  source_ref?: SourceRef;
  published_fact_ref?: PublishedFactRef;
  quote?: string | null;
  snippet: string;
  locator?: string | null;
}

export interface InsufficientEvidenceState {
  reason_code: "NO_RELEVANT_EVIDENCE" | "NO_PUBLISHED_FACTS" | "CITATION_COVERAGE_TOO_LOW" | "VECTOR_UNAVAILABLE";
  message: string;
  missing_scopes?: string[];
  suggested_queries?: string[];
}

export interface RagAnswerResponse {
  project_id: string;
  question: string;
  state: RagAnswerState;
  answer?: string | null;
  coverage?: number | null;
  published_graph_version_ref?: PublishedGraphVersionRef;
  citations: RagCitation[];
  linked_published_facts: PublishedFactRef[];
  insufficient_evidence?: InsufficientEvidenceState;
  debug?: Record<string, unknown>;
}

export type GraphExploreState = "READY" | "SAFE_TOO_LARGE" | "EMPTY" | "ERROR";

export interface GraphExploreNode {
  id: string;
  published_entity_id: string;
  class_id: string;
  label: string;
  hop: number;
  properties?: Record<string, unknown>;
  quality_summary?: Record<string, unknown>;
  source_count?: number;
  evidence_count?: number;
  lineage_available?: boolean;
}

export interface GraphExploreEdge {
  id: string;
  published_relation_id: string;
  source_node_id: string;
  target_node_id: string;
  relation_id: string;
  label: string;
  properties?: Record<string, unknown>;
  quality_summary?: Record<string, unknown>;
  evidence_count?: number;
  lineage_available?: boolean;
}

export interface GraphTooLargeState {
  estimated_nodes: number;
  estimated_edges: number;
  node_budget: number;
  edge_budget: number;
  suggested_filters?: string[];
  message: string;
}

export interface PublishedLineagePanel {
  fact_ref: PublishedFactRef;
  published_graph_version_ref: PublishedGraphVersionRef;
  publish_job_id?: string | null;
  review_decision_ref?: ReviewDecisionRef;
  candidate_ref?: CandidateRef;
  evidence_refs: EvidenceRef[];
  source_refs: SourceRef[];
  ontology_version_id?: string | null;
  model_run_id?: string | null;
  prompt_version_id?: string | null;
  created_at?: string | null;
}

export interface GraphExploreRequest {
  root_entity_id?: string;
  max_hops?: number;
  state?: GraphExploreState;
  published_graph_version_id?: string;
}

export interface GraphExploreResponse {
  project_id: string;
  state: GraphExploreState;
  published_graph_version_ref: PublishedGraphVersionRef;
  root_entity_id: string;
  max_hops: number;
  nodes: GraphExploreNode[];
  edges: GraphExploreEdge[];
  quality_overlays?: Array<Record<string, unknown>>;
  source_overlays?: Array<Record<string, unknown>>;
  lineage_panel?: PublishedLineagePanel;
  too_large?: GraphTooLargeState;
}

export type ExternalApiAuthMode = "DEV_AUTH";

export interface ExternalApiEndpointDoc {
  group: "graph" | "source_evidence" | "search" | "rag";
  method: "GET" | "POST";
  path: string;
  title: string;
  description: string;
  request_example?: Record<string, unknown>;
  response_example: Record<string, unknown>;
}

export interface ExternalApiDocsSurface {
  project_id: string;
  auth_mode: ExternalApiAuthMode;
  published_graph_version_ref?: PublishedGraphVersionRef;
  endpoints: ExternalApiEndpointDoc[];
  read_only: true;
  dev_auth_missing: boolean;
}

export type EnterpriseRole =
  | "ORGANIZATION_ADMIN"
  | "PROJECT_ADMIN"
  | "ONTOLOGY_EDITOR"
  | "SOURCE_MANAGER"
  | "REVIEWER"
  | "PUBLISHER"
  | "ANALYST_VIEWER"
  | "EXTERNAL_API_CONSUMER"
  | "SERVICE_ACCOUNT";

export type PrincipalType = "HUMAN_USER" | "SERVICE_ACCOUNT" | "API_KEY" | "SYSTEM";

export type AssignmentScopeType = "ORGANIZATION" | "PROJECT" | "ONTOLOGY_VERSION" | "SOURCE" | "PUBLISHED_GRAPH";

export type RoleAssignmentStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "PENDING";

export type PermissionResourceType =
  | "ORGANIZATION"
  | "PROJECT"
  | "ONTOLOGY_VERSION"
  | "SOURCE"
  | "CANDIDATE"
  | "REVIEW_TASK"
  | "PUBLISH_JOB"
  | "PUBLISHED_GRAPH"
  | "POLICY"
  | "API_CREDENTIAL"
  | "IMPORT_JOB"
  | "EXPORT_JOB"
  | "OPERATION_EVENT"
  | "BACKUP_SNAPSHOT"
  | "RETENTION_POLICY"
  | "AUDIT_EVENT";

export type PermissionAction =
  | "READ"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "ASSIGN_ROLE"
  | "PREVIEW_POLICY"
  | "ENFORCE_POLICY"
  | "APPROVE"
  | "PUBLISH"
  | "IMPORT"
  | "EXPORT"
  | "RETRY_JOB"
  | "ACKNOWLEDGE_DLQ"
  | "REVOKE_CREDENTIAL"
  | "RESTORE_DRY_RUN";

export type PermissionDecision = "ALLOW" | "DENY" | "CONDITIONAL";

export type PermissionDenyReason =
  | "MISSING_ROLE"
  | "SCOPE_MISMATCH"
  | "RESOURCE_STATE_BLOCKED"
  | "VERSION_CONTEXT_REQUIRED"
  | "SENSITIVITY_RESTRICTED"
  | "ENVIRONMENT_RESTRICTED"
  | "CREDENTIAL_REVOKED"
  | "POLICY_DISABLED";

export interface AuditEventRef {
  audit_event_id: string;
  category?: AuditEventCategory;
  event_type?: string;
  href?: string;
}

export interface AuditPreview {
  audit_event_ref?: AuditEventRef | null;
  category?: AuditEventCategory;
  event_type?: string;
  actor?: string;
  reason_required?: boolean;
  message?: string;
}

export interface OrganizationAdminSummary {
  organization_id: string;
  organization_name: string;
  environment?: string;
  auth_mode: "DEV_AUTH";
  project_count?: number;
  active_member_count?: number;
  service_account_count?: number;
  policy_summary?: Record<string, unknown>;
  operations_summary?: Record<string, unknown>;
  retention_summary?: Record<string, unknown>;
  backup_summary?: Record<string, unknown>;
  latest_audit_events?: AuditEventRef[];
}

export interface OperationHealthSummary {
  healthy_count?: number;
  running_count?: number;
  failed_count?: number;
  retrying_count?: number;
  dlq_count?: number;
  last_failed_job_id?: string | null;
}

export interface ProjectAdminSummary {
  project_id: string;
  organization_id: string;
  project_name: string;
  project_status?: ProjectStatus;
  selected_ontology_version_id?: string | null;
  current_published_graph_version_id?: string | null;
  member_count?: number;
  role_assignment_count?: number;
  credential_count?: number;
  automatic_approval_policy_ref?: string | null;
  operation_health?: OperationHealthSummary;
  cost_budget?: CostBudgetSummary;
  retention_policy_ref?: string | null;
  backup_summary?: Record<string, unknown>;
  latest_audit_events?: AuditEventRef[];
  permission_summary?: AdminPermissionSummary;
}

export interface AdminPermissionSummary {
  can_read: boolean;
  can_create?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
  can_assign_role?: boolean;
  can_preview_policy?: boolean;
  can_enforce_policy?: boolean;
  can_retry_job?: boolean;
  can_ack_dlq?: boolean;
  can_revoke_credential?: boolean;
  can_restore_dry_run?: boolean;
  read_only?: boolean;
  denied_reason_code?: PermissionDenyReason | PolicyBlockReason | string | null;
  denied_reason_message?: string | null;
  required_permission?: PermissionAction | string | null;
  audit_event_ref?: AuditEventRef | null;
}

export interface RoleAssignment {
  assignment_id: string;
  principal_id: string;
  principal_type: PrincipalType;
  principal_display_name?: string;
  scope_type: AssignmentScopeType;
  organization_id?: string;
  project_id?: string;
  resource_id?: string | null;
  role: EnterpriseRole;
  status: RoleAssignmentStatus;
  expires_at?: string | null;
  created_by?: string;
  created_at?: string;
  revoked_at?: string | null;
  audit_event_refs?: AuditEventRef[];
}

export interface PermissionCheckRequest {
  principal_id: string;
  principal_type: PrincipalType;
  organization_id?: string;
  project_id?: string;
  resource_type: PermissionResourceType;
  resource_id?: string | null;
  action: PermissionAction;
  data_state?: string;
  sensitivity?: string;
  version_context?: Record<string, string | null | undefined>;
}

export interface PermissionCheckResponse {
  decision: PermissionDecision;
  allowed: boolean;
  read_only?: boolean;
  deny_reasons: PermissionDenyReason[];
  matched_roles: EnterpriseRole[];
  required_roles: EnterpriseRole[];
  policy_version_id?: string | null;
  evaluated_context?: PermissionCheckRequest;
  required_permission?: PermissionAction;
  audit_preview?: AuditPreview | null;
}

export type CredentialKind = "SERVICE_ACCOUNT" | "API_KEY";

export type CredentialStatus = "ACTIVE" | "DISABLED" | "EXPIRED" | "REVOKED" | "PENDING";

export type CredentialScope =
  | "EXTERNAL_READ"
  | "PROJECT_ADMIN_READ"
  | "QUALITY_READ"
  | "PUBLISHED_GRAPH_READ"
  | "RAG_READ"
  | "SEARCH_READ"
  | "IMPORT_EXPORT_MANAGE"
  | "OPERATIONS_READ";

export interface CredentialQuota {
  monthly_request_limit?: number;
  monthly_requests_used?: number;
  budget_limit?: number;
  budget_used?: number;
  status?: "WITHIN_LIMIT" | "NEAR_LIMIT" | "EXCEEDED" | "DISABLED";
}

export interface CredentialRoleBinding {
  role: EnterpriseRole;
  scope_type: AssignmentScopeType;
  project_id?: string;
}

export interface CredentialView {
  credential_id: string;
  credential_kind: CredentialKind;
  project_id?: string;
  name?: string;
  description?: string | null;
  status: CredentialStatus;
  masked_secret: string;
  scopes: CredentialScope[];
  role_bindings?: CredentialRoleBinding[];
  quota?: CredentialQuota | null;
  expires_at?: string | null;
  created_by?: string;
  created_at?: string;
  last_used_at?: string | null;
  revoked_at?: string | null;
  audit_event_refs?: AuditEventRef[];
}

export interface CredentialSecretReveal {
  reveal_id: string;
  one_time: true;
  expires_at?: string;
  copy_allowed?: boolean;
  persistence_forbidden?: boolean;
}

export interface CredentialCreateResponse {
  credential: CredentialView;
  raw_secret: string;
  secret_reveal: CredentialSecretReveal;
  audit_event_ref: AuditEventRef;
}

export type PolicyMode = "DISABLED" | "DRY_RUN" | "ENFORCE";

export type PolicyEvaluationStatus = "WOULD_APPROVE" | "WOULD_ENQUEUE_PUBLISH" | "BLOCKED" | "REQUIRES_MANUAL_REVIEW" | "SKIPPED" | "ERROR";

export type PolicyBlockReason =
  | "MISSING_EVIDENCE"
  | "FAILED_VALIDATION"
  | "WARNING_REQUIRES_REVIEWER_REASON"
  | "STALE_ONTOLOGY_VERSION"
  | "CANDIDATE_STATUS_NOT_ELIGIBLE"
  | "UNSAFE_RELATION_TYPE"
  | "CONFIDENCE_BELOW_THRESHOLD"
  | "POLICY_MODE_DISABLED"
  | "PUBLISH_GATE_NOT_SATISFIED"
  | "AUDIT_PREVIEW_REQUIRED";

export interface PolicyConditionSet {
  confidence_threshold?: number;
  require_evidence?: boolean;
  allowed_candidate_kinds?: CandidateKind[];
  require_validation_passed?: boolean;
  reviewer_pattern?: string;
  ontology_version_id?: string;
}

export interface AutomaticApprovalPolicyDocument {
  policy_id: string;
  project_id: string;
  name: string;
  mode: PolicyMode;
  version: number;
  status?: string;
  conditions: PolicyConditionSet;
  actions?: Array<"APPROVE" | "ENQUEUE_PUBLISH">;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  last_evaluated_at?: string | null;
  audit_event_refs?: AuditEventRef[];
}

export interface PolicyEvaluationSummary {
  would_approve_count: number;
  blocked_count: number;
  manual_review_count: number;
  skipped_count?: number;
}

export interface PolicyEvaluationRow {
  row_id: string;
  candidate_ref?: CandidateRef;
  candidate_label?: string;
  status: PolicyEvaluationStatus;
  block_reasons: PolicyBlockReason[];
  evidence_state?: string;
  validation_state?: string;
  version_state?: string;
  policy_reason?: string;
  audit_preview?: AuditPreview | null;
}

export interface PolicyEvaluationResponse {
  policy_id: string;
  policy_version: number;
  mode: PolicyMode;
  status: PolicyEvaluationStatus;
  evaluated_at?: string;
  summary: PolicyEvaluationSummary;
  rows: PolicyEvaluationRow[];
  audit_preview?: AuditPreview | null;
}

export interface PolicyDiffResponse {
  policy_id: string;
  from_version: number;
  to_version: number;
  mode_change?: string;
  condition_changes: string[];
  action_changes: string[];
  destructive_or_sensitive_changes: string[];
  audit_preview?: AuditPreview | null;
}

export interface EnforcePreviewResponse {
  policy_id: string;
  policy_version: number;
  requested_mode: PolicyMode;
  gate_status: "PASS" | "BLOCKED";
  gate_reasons: PolicyBlockReason[];
  requires_confirmation: boolean;
  audit_preview?: AuditPreview | null;
  affected_candidate_count: number;
}

export type OntologyPackageFormat = "JSON";

export type GovernanceJobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "BLOCKED" | "EXPIRED";

export type ImportCompatibilityStatus =
  | "COMPATIBLE"
  | "WARNING_COMPATIBLE"
  | "CONFLICT_BLOCKED"
  | "DESTRUCTIVE_BLOCKED"
  | "INVALID_SCHEMA"
  | "INCOMPATIBLE_SCHEMA";

export type ImportConflictSeverity = "INFO" | "WARNING" | "BLOCKING" | "DESTRUCTIVE";

export type ImportConflictType =
  | "NAME_COLLISION"
  | "STABLE_ID_COLLISION"
  | "SCHEMA_VERSION_INCOMPATIBLE"
  | "MISSING_REQUIRED_FIELD"
  | "DESTRUCTIVE_DELETE"
  | "PUBLISHED_GRAPH_LINEAGE"
  | "NO_OP"
  | "UNKNOWN";

export interface OntologyPackageCounts {
  class_count: number;
  property_count: number;
  relation_count: number;
}

export interface OntologyPackageMetadata {
  package_id: string;
  schema_version: string;
  package_schema_version?: string;
  format: OntologyPackageFormat;
  project_id: string;
  ontology_id?: string | null;
  ontology_version_id: string;
  published_graph_version_id?: string | null;
  generated_at: string;
  created_at?: string;
  created_by?: string;
  counts: OntologyPackageCounts;
  contents_summary?: Record<string, unknown>;
  compatibility_notes: string[];
  checksum?: string | null;
  audit_event_ref?: AuditEventRef | null;
}

export interface OntologyExportCreateRequest {
  format: OntologyPackageFormat;
  ontology_version_id?: string | null;
  include_published_graph_refs?: boolean;
}

export interface OntologyExportJob {
  job_id: string;
  project_id: string;
  status: GovernanceJobStatus;
  format: OntologyPackageFormat;
  package_metadata?: OntologyPackageMetadata | null;
  download_url?: string | null;
  file_name?: string | null;
  checksum?: string | null;
  expires_at?: string | null;
  created_by?: string;
  created_at?: string;
  completed_at?: string | null;
  audit_event_ref?: AuditEventRef | null;
}

export interface OntologyExportDownload {
  job_id: string;
  download_url?: string | null;
  expires_at?: string | null;
  content_type?: string;
  file_name?: string | null;
  checksum?: string | null;
  package_metadata: OntologyPackageMetadata;
}

export interface OntologyImportCreateRequest {
  format: OntologyPackageFormat;
  package_ref?: string | null;
  mode: "DRY_RUN";
  package_payload?: Record<string, unknown>;
}

export interface ImportDryRunSummary {
  create_count: number;
  update_count: number;
  delete_count: number;
  no_op_count: number;
  conflict_count: number;
  warning_count: number;
}

export interface ImportDryRunRow {
  row_id: string;
  row_type: "CONFLICT" | "WARNING" | "DESTRUCTIVE" | "INVALID";
  conflict_type: ImportConflictType | string;
  severity: ImportConflictSeverity;
  blocking: boolean;
  path: string;
  message: string;
  local_ref?: string | null;
  package_ref?: string | null;
  affected_lineage_ref?: string | null;
  proposed_resolution?: string | null;
}

export interface DestructiveImpactSummary {
  would_delete_classes: number;
  would_delete_properties: number;
  would_delete_relations: number;
  published_graph_refs_affected: number;
}

export interface DestructiveImpactRow {
  row_id: string;
  resource_type: "CLASS" | "PROPERTY" | "RELATION" | "PUBLISHED_GRAPH_REF" | "UNKNOWN";
  resource_id?: string | null;
  impact: string;
  blocked: boolean;
  lineage_ref?: string | null;
}

export interface OntologyImportDryRunJob {
  job_id: string;
  project_id: string;
  status: GovernanceJobStatus;
  format: OntologyPackageFormat;
  compatibility_status: ImportCompatibilityStatus;
  package_metadata?: OntologyPackageMetadata | null;
  summary: ImportDryRunSummary;
  conflicts: ImportDryRunRow[];
  warnings: ImportDryRunRow[];
  destructive_impact: DestructiveImpactSummary;
  destructive_impact_rows: DestructiveImpactRow[];
  rollback_guidance: string[];
  requires_confirmation: boolean;
  confirmation_text?: string | null;
  audit_preview?: AuditPreview | null;
  audit_event_ref?: AuditEventRef | null;
  dry_run_only: boolean;
  mutation_applied: false;
}

export type OperationJobType =
  | "SOURCE_PARSE"
  | "EXTRACTION"
  | "VALIDATION"
  | "PUBLISH"
  | "QUALITY_RECOMPUTE"
  | "IMPORT"
  | "EXPORT"
  | "POLICY_EVALUATION"
  | "BACKUP"
  | "RETENTION_DELETE";

export type OperationJobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "RETRYING" | "DEAD_LETTERED" | "CANCELLED";

export type OperationEventSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL" | "SECURITY";

export type BudgetStatus = "WITHIN_LIMIT" | "NEAR_LIMIT" | "EXCEEDED" | "DISABLED";

export type ObservabilityAvailabilityStatus = "AVAILABLE" | "PARTIAL" | "NOT_CONFIGURED" | "UNAVAILABLE";

export interface OperationJob {
  job_id: string;
  project_id: string;
  job_type: OperationJobType;
  status: OperationJobStatus;
  attempts: number;
  max_attempts: number;
  last_error?: string | null;
  next_retry_at?: string | null;
  retry_eligible?: boolean;
  blocked_reason?: string | null;
  audit_event_refs?: AuditEventRef[];
}

export interface DlqRow {
  dlq_id: string;
  job_id: string;
  project_id: string;
  job_type: OperationJobType;
  failure_code?: string;
  failure_message?: string;
  payload_ref?: string;
  redacted_payload_preview?: Record<string, unknown>;
  retry_count?: number;
  retry_eligible?: boolean;
  acknowledge_eligible?: boolean;
  blocked_reasons?: string[];
  first_failed_at?: string;
  last_failed_at?: string;
  acknowledged_at?: string | null;
  audit_event_refs?: AuditEventRef[];
}

export interface CostBudgetSummary {
  project_id: string;
  period_start?: string;
  period_end?: string;
  budget_status: BudgetStatus;
  currency?: string;
  budget_amount?: number;
  estimated_spend?: number;
  token_limit?: number;
  tokens_used?: number;
  near_limit_threshold?: number;
  last_updated_at?: string;
}

export interface ObservabilityAvailability {
  metrics: ObservabilityAvailabilityStatus;
  traces: ObservabilityAvailabilityStatus;
  logs: ObservabilityAvailabilityStatus;
  structured_events: ObservabilityAvailabilityStatus;
  message?: string;
}

export interface StructuredEvent {
  event_id: string;
  severity: OperationEventSeverity;
  event_type: string;
  message: string;
  correlation_id?: string;
  trace_id?: string | null;
  request_id?: string;
  redacted_fields?: string[];
  resource_refs?: string[];
  created_at?: string;
}

export interface OperationsDashboardResponse {
  project_id: string;
  generated_at?: string;
  job_health: OperationHealthSummary;
  jobs?: OperationJob[];
  dlq_summary?: Record<string, unknown>;
  dlq_rows?: DlqRow[];
  cost_budget: CostBudgetSummary;
  observability: ObservabilityAvailability;
  recent_events: StructuredEvent[];
}

export type RetentionActionMode = "READ_ONLY" | "DRY_RUN" | "CONFIRM_REQUIRED" | "EXECUTE";

export type RetentionResourceType = "SOURCE" | "EVIDENCE" | "CANDIDATE" | "AUDIT_EVENT" | "PUBLISHED_GRAPH_SNAPSHOT" | "OPERATION_EVENT";

export type BackupStatus = "AVAILABLE" | "RUNNING" | "FAILED" | "EXPIRED" | "RESTORE_DRY_RUN_AVAILABLE" | "RESTORE_BLOCKED";

export interface RetentionRule {
  rule_id: string;
  resource_type: RetentionResourceType;
  retention_days: number;
  mode: RetentionActionMode;
  include_deleted?: boolean;
  legal_hold?: boolean;
  managed_by?: string;
  read_only?: boolean;
  audit_event_refs?: AuditEventRef[];
}

export interface RetentionPolicy {
  project_id: string;
  mode: RetentionActionMode;
  rules: RetentionRule[];
  legal_hold_enabled: boolean;
  updated_by?: string;
  updated_at?: string;
  audit_event_refs?: AuditEventRef[];
}

export interface RetentionDeletionImpactSummary {
  affected_count: number;
  blocked_count: number;
  irreversible_count: number;
  destructive: boolean;
  block_reasons?: string[];
}

export interface RetentionLineageImpact {
  resource_type: RetentionResourceType;
  resource_id: string;
  impact: string;
  blocked: boolean;
}

export interface RetentionDeletionDryRunResponse {
  project_id: string;
  requested_resource_type: RetentionResourceType;
  mode: RetentionActionMode;
  generated_at?: string;
  impact_summary: RetentionDeletionImpactSummary;
  lineage_impact: RetentionLineageImpact[];
  requires_confirmation: boolean;
  confirmation_text?: string;
  audit_preview?: AuditPreview | null;
}

export interface BackupSnapshot {
  snapshot_id: string;
  project_id: string;
  status: BackupStatus;
  snapshot_type?: string;
  created_at?: string;
  expires_at?: string;
  storage_ref?: string;
  contents_summary?: Record<string, unknown>;
  restore_eligibility?: {
    eligible?: boolean;
    block_reasons?: string[];
    compatibility?: string;
  };
  audit_event_refs?: AuditEventRef[];
}

export interface RestoreDryRunResponse {
  snapshot_id: string;
  project_id: string;
  eligible: boolean;
  status: BackupStatus;
  block_reasons: string[];
  restore_impact: Record<string, unknown>;
  requires_confirmation: boolean;
  audit_preview?: AuditPreview | null;
}

export type AuditEventCategory = "ROLE" | "CREDENTIAL" | "POLICY" | "IMPORT_EXPORT" | "DLQ" | "RETENTION" | "BACKUP" | "DESTRUCTIVE_ACTION" | "SECURITY";

export interface AuditEvent {
  audit_event_id: string;
  organization_id?: string;
  project_id?: string;
  category: AuditEventCategory;
  event_type: string;
  severity: OperationEventSeverity;
  actor?: Record<string, unknown>;
  target?: Record<string, unknown>;
  reason?: string;
  before_ref?: string;
  after_ref?: string;
  diff_summary?: string[];
  request_id?: string;
  created_at?: string;
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
    /** UPPER_SNAKE status token for the activity, rendered as a D6 badge. */
    status?: string;
  }>;
}

// ---------------------------------------------------------------------------
// MVP6.2 Active Learning / Continuous Improvement (Learning Insights)
// Field/enum names match Backend OpenAPI (apps/backend/app/modules/learning/schemas.py).
// ---------------------------------------------------------------------------

export type LearningSignalType =
  | "RELATION_DIRECTION_CORRECTION"
  | "CLASS_CONFUSION"
  | "RELATION_TYPE_CONFUSION"
  | "EVIDENCE_MISSING"
  | "EVIDENCE_MISMATCH"
  | "REPEATED_VALIDATION_FAILURE"
  | "LOW_BENCHMARK_METRIC_CLUSTER";

export type LearningSourceArtifactType =
  | "REVIEW_DECISION"
  | "REVIEW_CORRECTION"
  | "VALIDATION_RESULT"
  | "QUALITY_METRIC"
  | "QUALITY_DRILLDOWN"
  | "EVALUATION_RUN"
  | "EVALUATION_METRIC"
  | "EVALUATION_ERROR_CASE";

export type PromptSuggestionKind =
  | "ADD_RELATION_DIRECTION_EXAMPLE"
  | "CLARIFY_CLASS_BOUNDARY"
  | "CLARIFY_RELATION_TYPE_BOUNDARY"
  | "ADD_EVIDENCE_REQUIREMENT"
  | "ADD_NEGATIVE_EXAMPLE"
  | "ADD_VALIDATION_FAILURE_GUIDANCE"
  | "INVESTIGATE_LOW_METRIC_CLUSTER";

export type PromptSuggestionState = "SUGGESTED" | "ACCEPTED" | "DISMISSED" | "SUPERSEDED";

export type SuggestionDecisionType = "ACCEPT" | "DISMISS";

export type SuggestionDismissReasonCode =
  | "NOT_RELEVANT"
  | "INSUFFICIENT_EVIDENCE"
  | "DUPLICATE"
  | "OUT_OF_SCOPE"
  | "RISK_TOO_HIGH"
  | "OTHER";

export type SuggestionIntendedNextAction =
  | "USE_IN_NEXT_PROMPT_DRAFT"
  | "DISCUSS_WITH_ONTOLOGY_OWNER"
  | "MONITOR_FOR_MORE_EVIDENCE"
  | "NO_ACTION";

export type LearningConfidenceLabel = "LOW" | "MEDIUM" | "HIGH";

export type LearningRiskLabel = "LOW" | "MEDIUM" | "HIGH";

export type AutoApprovalPreviewStatus = "RECOMMENDATION_ONLY" | "NOT_ENFORCED" | "REQUIRES_POLICY_APPROVAL";

export type AutoApprovalHistoricalMatchOutcome =
  | "WOULD_MATCH"
  | "WOULD_NOT_MATCH"
  | "BLOCKED_BY_SAFETY_RULE"
  | "INSUFFICIENT_EVIDENCE";

export interface LearningWindow {
  label: string;
  started_at: string;
  ended_at: string;
}

export interface LearningSignalTypeCount {
  signal_type: LearningSignalType;
  count: number;
  high_risk_count: number;
  latest_observed_at: string | null;
}

export interface LearningPatternSummary {
  pattern_id: string;
  primary_signal_type: LearningSignalType;
  title: string;
  support_count: number;
  risk_label: LearningRiskLabel;
}

export interface LearningEvidenceRef {
  source_id: string | null;
  source_segment_id: string | null;
  locator: string | null;
  quote: string | null;
}

export interface LearningSourceArtifactRef {
  artifact_type: LearningSourceArtifactType;
  artifact_id: string;
  project_id: string;
  candidate_id: string | null;
  candidate_kind: CandidateKind | null;
  review_task_id: string | null;
  review_decision_id: string | null;
  validation_result_id: string | null;
  quality_metric_id: string | null;
  evaluation_run_id: string | null;
  evaluation_error_case_id: string | null;
  ontology_version_id: string | null;
  prompt_version_id: string | null;
  model_run_id: string | null;
  evidence_refs: LearningEvidenceRef[];
  observed_at: string;
}

export interface OntologyClassRef {
  ontology_class_id: string;
  label: string;
}

export interface OntologyRelationRef {
  ontology_relation_id: string;
  label: string;
}

export interface CorrectionPatternExample {
  example_id: string;
  before: string | null;
  after: string | null;
  source_artifact_id: string;
}

export interface CorrectionPattern {
  id: string;
  project_id: string;
  primary_signal_type: LearningSignalType;
  related_signal_types: LearningSignalType[];
  title: string;
  affected_classes: OntologyClassRef[];
  affected_relations: OntologyRelationRef[];
  support_count: number;
  denominator: number | null;
  confidence_label: LearningConfidenceLabel;
  risk_label: LearningRiskLabel;
  first_seen_at: string;
  last_seen_at: string;
  explanation: string;
  representative_examples: CorrectionPatternExample[];
  source_learning_signal_ids: string[];
  source_artifacts: LearningSourceArtifactRef[];
  safety_note: string;
  prompt_suggestion_ids: string[];
}

export interface LearningSignalSummaryResponse {
  project_id: string;
  generated_at: string;
  window: LearningWindow;
  source_artifact_scope: LearningSourceArtifactType[];
  total_signal_count: number;
  signal_counts: LearningSignalTypeCount[];
  open_prompt_suggestion_count: number;
  accepted_prompt_suggestion_count: number;
  dismissed_prompt_suggestion_count: number;
  superseded_prompt_suggestion_count: number;
  high_risk_prompt_suggestion_count: number;
  auto_approval_preview_count: number;
  top_patterns: LearningPatternSummary[];
  safety_notes: string[];
}

export interface SuggestionSnapshot {
  suggestion_kind: PromptSuggestionKind;
  title: string;
  preview_text: string;
}

export interface MutationGuard {
  prompt_version_mutated: false;
  candidate_graph_mutated: false;
  published_graph_mutated: false;
  auto_approval_policy_mutated: false;
  extraction_job_started: false;
  evaluation_run_started: false;
}

export interface SuggestionDecisionAuditNote {
  id: string;
  suggestion_id: string;
  project_id: string;
  actor_id: string;
  actor_role: string;
  decision: SuggestionDecisionType;
  dismiss_reason_code: SuggestionDismissReasonCode | null;
  note: string | null;
  intended_next_action: SuggestionIntendedNextAction | null;
  decided_at: string;
  source_learning_signal_ids: string[];
  target_prompt_version_id: string | null;
  suggestion_snapshot: SuggestionSnapshot;
  mutation_guard: MutationGuard;
}

export interface PromptSuggestion {
  id: string;
  project_id: string;
  target_prompt_version_id: string | null;
  suggestion_kind: PromptSuggestionKind;
  state: PromptSuggestionState;
  title: string;
  rationale: string;
  expected_impact: string;
  preview_text: string;
  structured_proposal: Record<string, unknown>;
  source_learning_signal_ids: string[];
  correction_pattern_ids: string[];
  source_artifacts: LearningSourceArtifactRef[];
  confidence_label: LearningConfidenceLabel;
  risk_label: LearningRiskLabel;
  created_at: string;
  updated_at: string;
  decision_audit_note: SuggestionDecisionAuditNote | null;
  safety_note: string;
}

export interface SuggestionDecisionRequest {
  decision: SuggestionDecisionType;
  dismiss_reason_code?: SuggestionDismissReasonCode | null;
  note?: string | null;
  intended_next_action?: SuggestionIntendedNextAction | null;
  client_request_id?: string | null;
}

export interface SuggestionDecisionResponse {
  suggestion_id: string;
  project_id: string;
  previous_state: PromptSuggestionState;
  new_state: PromptSuggestionState;
  decision_audit_note: SuggestionDecisionAuditNote;
}

export interface AutoApprovalRulePreview {
  candidate_kind: "ENTITY" | "RELATION";
  conditions: string[];
}

export interface AutoApprovalPreviewMetric {
  metric_name: string;
  value: number | null;
  numerator: number | null;
  denominator: number | null;
}

export interface AutoApprovalHistoricalOutcomeItem {
  artifact_id: string;
  outcome: AutoApprovalHistoricalMatchOutcome;
  reason: string;
}

export interface AutoApprovalHistoricalMatchPreview {
  total_examined: number;
  would_match_count: number;
  blocked_count: number;
  outcomes: AutoApprovalHistoricalOutcomeItem[];
}

export interface AutoApprovalCandidatePreview {
  id: string;
  project_id: string;
  title: string;
  preview_status: AutoApprovalPreviewStatus;
  recommendation_only: true;
  not_enforced: true;
  requires_later_policy_approval: true;
  rule_preview: AutoApprovalRulePreview;
  supporting_metrics: AutoApprovalPreviewMetric[];
  historical_match_preview: AutoApprovalHistoricalMatchPreview;
  source_learning_signal_ids: string[];
  correction_pattern_ids: string[];
  source_artifacts: LearningSourceArtifactRef[];
  confidence_label: LearningConfidenceLabel;
  risk_label: LearningRiskLabel;
  safety_note: string;
  blocked_actions: string[];
}

// ---- MVP6.4 Gold Set Authoring + Dataset Revisioning ----
// Field/enum names match docs/api/openapi-mvp6-4-draft.json and
// apps/backend/app/modules/goldset_authoring/schemas.py EXACTLY.
// Reuses MVP6.1 EvaluationDataset / EvaluationSample / GoldEntity / GoldRelation
// / GoldEvidenceRef / EvaluationRun verbatim — no renames (additive overlay).

export type GoldItemStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type DatasetRevisionStatus = "DRAFT" | "ACTIVE" | "FROZEN" | "ARCHIVED";

export type GoldAuthoringAction =
  | "CREATE"
  | "EDIT"
  | "ARCHIVE"
  | "RESTORE"
  | "EVIDENCE_ATTACH"
  | "EVIDENCE_EDIT"
  | "REVISION_CUT"
  | "REVISION_ACTIVATE"
  | "IMPORT";

export type GoldSetImportCompatibility = "COMPATIBLE" | "WARNING" | "CONFLICT" | "INCOMPATIBLE";

export type GoldSetImportStrategy = "CREATE_NEW_DATASET" | "NEW_REVISION_OF_EXISTING";

export type RevisionFrozenReason = "NEWER_REVISION_ACTIVATED" | "PINNED_BY_RUN";

export type GoldAuthoringTargetKind =
  | "GOLD_ENTITY"
  | "GOLD_RELATION"
  | "GOLD_EVIDENCE"
  | "DATASET_REVISION"
  | "DATASET";

export interface GoldAuthoringMutationGuard {
  published_graph_mutated: boolean;
  candidate_graph_mutated: boolean;
  prompt_version_mutated: boolean;
  ontology_definition_mutated: boolean;
  extraction_job_started: boolean;
  evaluation_run_started: boolean;
  prior_run_pin_rewritten: boolean;
}

export interface GoldAuthoringCapabilities {
  can_view: boolean;
  can_edit_gold_item: boolean;
  can_archive_gold_item: boolean;
  can_author_evidence: boolean;
  can_cut_revision: boolean;
  can_activate_revision: boolean;
  can_import: boolean;
}

// Additive overlay over MVP6.1 GoldEntity / GoldRelation (allOf; no rename).
export interface GoldItemAuthoringOverlay {
  status: GoldItemStatus;
  revision_id?: string | null;
  evidence_id?: string | null;
  updated_at?: string | null;
  archived_at?: string | null;
}

export type GoldEntityAuthoringView = GoldEntity & GoldItemAuthoringOverlay;

export type GoldRelationAuthoringView = GoldRelation & GoldItemAuthoringOverlay;

// Standalone first-class evidence; preserves all GoldEvidenceRef fields verbatim.
export interface GoldEvidence {
  id: string;
  project_id: string;
  dataset_id: string;
  revision_id?: string | null;
  gold_entity_id?: string | null;
  gold_relation_id?: string | null;
  status: GoldItemStatus;
  sample_id: string;
  source_id?: string | null;
  source_segment_id?: string | null;
  locator?: string | null;
  offset_start?: number | null;
  offset_end?: number | null;
  quote?: string | null;
  created_at: string;
  updated_at?: string | null;
  archived_at?: string | null;
}

export interface RunRevisionPin {
  run_id: string;
  dataset_version_id?: string | null;
  revision_status?: DatasetRevisionStatus | null;
  pin_immutable: boolean;
}

export interface DatasetRevision {
  id: string;
  dataset_id: string;
  project_id: string;
  revision_number: number;
  status: DatasetRevisionStatus;
  is_immutable: boolean;
  frozen_reason?: RevisionFrozenReason | null;
  sample_count: number;
  gold_entity_count: number;
  gold_relation_count: number;
  gold_evidence_count: number;
  pinned_run_count: number;
  parent_revision_id?: string | null;
  ontology_version_id?: string | null;
  created_at: string;
  activated_at?: string | null;
  frozen_at?: string | null;
  created_by?: string | null;
}

export interface DatasetRevisionSummary {
  id: string;
  dataset_id: string;
  revision_number: number;
  status: DatasetRevisionStatus;
  is_immutable: boolean;
  frozen_reason?: RevisionFrozenReason | null;
  pinned_run_count: number;
  created_at: string;
}

export interface GoldEntityEditRequest {
  label?: string | null;
  normalized_value?: string | null;
  ontology_class_id?: string | null;
  evidence?: GoldEvidenceRef | null;
  reason?: string | null;
}

export interface GoldRelationEditRequest {
  ontology_relation_id?: string | null;
  source_gold_entity_id?: string | null;
  target_gold_entity_id?: string | null;
  evidence?: GoldEvidenceRef | null;
  reason?: string | null;
}

export interface GoldItemArchiveRequest {
  reason?: string | null;
}

export interface GoldEvidenceAttachRequest {
  gold_entity_id?: string | null;
  gold_relation_id?: string | null;
  sample_id: string;
  source_id?: string | null;
  source_segment_id?: string | null;
  locator?: string | null;
  offset_start?: number | null;
  offset_end?: number | null;
  quote?: string | null;
  reason?: string | null;
}

export interface GoldEvidenceEditRequest {
  source_id?: string | null;
  source_segment_id?: string | null;
  locator?: string | null;
  offset_start?: number | null;
  offset_end?: number | null;
  quote?: string | null;
  reason?: string | null;
}

export interface DatasetRevisionCutRequest {
  note?: string | null;
  activate?: boolean;
}

export interface GoldAuthoringAuditEntry {
  id: string;
  project_id: string;
  dataset_id: string;
  revision_id?: string | null;
  action: GoldAuthoringAction;
  actor_id: string;
  is_owner: boolean;
  target_kind: GoldAuthoringTargetKind;
  target_id: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
  created_at: string;
}

export interface GoldEntityMutationResponse {
  gold_entity: GoldEntityAuthoringView;
  audit_entry: GoldAuthoringAuditEntry;
  mutation_guard: GoldAuthoringMutationGuard;
  capabilities?: GoldAuthoringCapabilities | null;
}

export interface GoldRelationMutationResponse {
  gold_relation: GoldRelationAuthoringView;
  audit_entry: GoldAuthoringAuditEntry;
  mutation_guard: GoldAuthoringMutationGuard;
  capabilities?: GoldAuthoringCapabilities | null;
}

export interface GoldEvidenceMutationResponse {
  gold_evidence: GoldEvidence;
  audit_entry: GoldAuthoringAuditEntry;
  mutation_guard: GoldAuthoringMutationGuard;
  capabilities?: GoldAuthoringCapabilities | null;
}

export interface DatasetRevisionMutationResponse {
  revision: DatasetRevision;
  dataset?: EvaluationDataset | null;
  frozen_revision_id?: string | null;
  audit_entry: GoldAuthoringAuditEntry;
  mutation_guard: GoldAuthoringMutationGuard;
  capabilities?: GoldAuthoringCapabilities | null;
}

export interface DatasetAuthoringOverview {
  dataset: EvaluationDataset;
  active_revision?: DatasetRevision | null;
  revision_count: number;
  gold_status_counts: Record<string, number>;
  pinned_runs: RunRevisionPin[];
  capabilities: GoldAuthoringCapabilities;
  mutation_guard: GoldAuthoringMutationGuard;
}

export interface GoldEvidenceListResponse {
  items: GoldEvidence[];
  next_cursor?: string | null;
}

export interface DatasetRevisionListResponse {
  items: DatasetRevisionSummary[];
  next_cursor?: string | null;
}

export interface GoldAuthoringAuditListResponse {
  items: GoldAuthoringAuditEntry[];
  next_cursor?: string | null;
}

export interface GoldSetExportBundle {
  bundle_version: string;
  source_project_id: string;
  source_dataset_id: string;
  source_revision_id: string;
  revision_status?: DatasetRevisionStatus | null;
  ontology_version_id?: string | null;
  exported_at: string;
  samples: EvaluationSample[];
  gold_entities: GoldEntityAuthoringView[];
  gold_relations: GoldRelationAuthoringView[];
  gold_evidence: GoldEvidence[];
  mutation_guard: GoldAuthoringMutationGuard;
}

export interface GoldSetImportDryRunRequest {
  bundle: GoldSetExportBundle;
}

export interface GoldSetImportIssue {
  code: string;
  severity: GoldSetImportCompatibility;
  ontology_class_id?: string | null;
  ontology_relation_id?: string | null;
  sample_id?: string | null;
  message: string;
}

export interface GoldSetBundleSummary {
  bundle_version: string;
  source_dataset_id?: string | null;
  source_revision_id?: string | null;
  sample_count: number;
  gold_entity_count: number;
  gold_relation_count: number;
  gold_evidence_count: number;
}

export interface GoldSetImportReport {
  import_id: string;
  project_id: string;
  compatibility: GoldSetImportCompatibility;
  bundle_summary: GoldSetBundleSummary;
  target_ontology_version_id?: string | null;
  issues: GoldSetImportIssue[];
  allowed_strategies: GoldSetImportStrategy[];
  blocking: boolean;
  mutation_guard: GoldAuthoringMutationGuard;
}

export interface GoldSetImportConfirmRequest {
  strategy: GoldSetImportStrategy;
  target_dataset_id?: string | null;
  activate?: boolean;
  acknowledge_warnings?: boolean;
}

export interface ImportedCounts {
  samples: number;
  gold_entities: number;
  gold_relations: number;
  gold_evidence: number;
}

export interface GoldSetImportConfirmResponse {
  import_id: string;
  strategy: GoldSetImportStrategy;
  created_dataset_id?: string | null;
  created_revision_id: string;
  created_revision_status: DatasetRevisionStatus;
  imported_counts: ImportedCounts;
  audit_entry: GoldAuthoringAuditEntry;
  mutation_guard: GoldAuthoringMutationGuard;
}

// ---- MVP6.5 Governance workflow (ontology change-request lifecycle) ----
// Additive decision-record surface in the candidate/analysis layer. Field/enum
// names match docs/api/openapi-mvp6-5-draft.json EXACTLY. Approval records intent
// + audit ONLY (application_state=QUEUED); it applies NOTHING (change_auto_applied
// always false). APPLIED/SUPERSEDED are reserved and never produced in P0.

/** Change-request lifecycle. DRAFT->OPEN->IN_REVIEW->{APPROVED|REJECTED}; WITHDRAWN from DRAFT/OPEN/IN_REVIEW. */
export type OntologyChangeRequestStatus =
  | "DRAFT"
  | "OPEN"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

/** Orthogonal post-approval intent lifecycle. QUEUED on APPROVE. APPLIED/SUPERSEDED reserved (never produced in P0). */
export type GovernanceApplicationState = "NOT_APPLICABLE" | "QUEUED" | "APPLIED" | "SUPERSEDED";

/** Decision commands. Reuses MVP3 APPROVE/REQUEST_CHANGES/REJECT verbatim + adds COMMENT (no MODIFY_AND_APPROVE). */
export type GovernanceReviewAction = "COMMENT" | "REQUEST_CHANGES" | "APPROVE" | "REJECT";

/** Ontology element kind a change item targets (reference only; never edited). */
export type ChangeRequestTargetKind = "CLASS" | "PROPERTY" | "RELATION";

/** Proposed change type. Element ref null for ADD; required for MODIFY/DEPRECATE. */
export type ChangeRequestChangeType = "ADD" | "MODIFY" | "DEPRECATE";

/** Governance-specific audit actions (does NOT rename MVP3/MVP5 AuditEventType). */
export type GovernanceAuditAction =
  | "CHANGE_REQUEST_CREATED"
  | "CHANGE_REQUEST_UPDATED"
  | "CHANGE_REQUEST_SUBMITTED"
  | "CHANGE_REQUEST_WITHDRAWN"
  | "REVIEW_STARTED"
  | "COMMENT_ADDED"
  | "CHANGES_REQUESTED"
  | "CHANGE_REQUEST_APPROVED"
  | "CHANGE_REQUEST_REJECTED";

/**
 * Reused verbatim from the backend Role enum (apps/backend/app/core/enums.py) and
 * mirrored in the OpenAPI `Role` schema. Not a rename of any existing FE type.
 * Approve/reject restricted to ONTOLOGY_MANAGER/PROJECT_ADMIN/SYSTEM_ADMIN.
 */
export type GovernanceRole =
  | "SYSTEM_ADMIN"
  | "PROJECT_ADMIN"
  | "ONTOLOGY_MANAGER"
  | "DATA_MANAGER"
  | "EXTRACTION_MANAGER"
  | "REVIEWER"
  | "VIEWER"
  | "API_CLIENT";

/** All-false on every governance write response. change_auto_applied=false is the approval-!=-auto-apply proof. */
export interface GovernanceMutationGuard {
  ontology_definition_mutated: false;
  published_graph_mutated: false;
  candidate_graph_mutated: false;
  prompt_version_mutated: false;
  publish_job_started: false;
  extraction_job_started: false;
  change_auto_applied: false;
}

/** Read-only permission hint for the UI. Display-only; the server enforces authorization independently. */
export interface GovernanceCapabilities {
  can_view: boolean;
  can_edit_request?: boolean;
  can_submit?: boolean;
  can_withdraw?: boolean;
  can_comment?: boolean;
  can_request_changes?: boolean;
  can_approve?: boolean;
  can_reject?: boolean;
}

/** A proposed change to a single ontology element. The proposed_change payload is intent only, never applied. */
export interface OntologyChangeItem {
  id: string;
  change_request_id: string;
  target_kind: ChangeRequestTargetKind;
  change_type: ChangeRequestChangeType;
  ontology_class_id?: string | null;
  ontology_property_id?: string | null;
  ontology_relation_id?: string | null;
  ontology_version_id: string;
  proposed_change?: Record<string, unknown>;
  created_at: string;
  updated_at?: string | null;
}

/** Add/edit a change item. Element ref null for ADD; exactly one matching target_kind for MODIFY/DEPRECATE. */
export interface OntologyChangeItemRequest {
  target_kind: ChangeRequestTargetKind;
  change_type: ChangeRequestChangeType;
  ontology_class_id?: string | null;
  ontology_property_id?: string | null;
  ontology_relation_id?: string | null;
  ontology_version_id: string;
  proposed_change?: Record<string, unknown>;
}

/** A proposal record in the governance/decision layer. application_state is QUEUED iff status==APPROVED. */
export interface OntologyChangeRequest {
  id: string;
  project_id: string;
  title: string;
  summary?: string | null;
  status: OntologyChangeRequestStatus;
  application_state: GovernanceApplicationState;
  proposer_id: string;
  item_count: number;
  ontology_version_id?: string | null;
  created_at: string;
  updated_at?: string | null;
  submitted_at?: string | null;
  decided_at?: string | null;
  decided_by?: string | null;
  decision_reason?: string | null;
}

export interface OntologyChangeRequestCreateRequest {
  title: string;
  summary?: string | null;
  ontology_version_id?: string | null;
  items?: OntologyChangeItemRequest[];
}

export interface OntologyChangeRequestUpdateRequest {
  title?: string;
  summary?: string | null;
}

export interface GovernanceWithdrawRequest {
  reason?: string | null;
}

/** Record a review decision. reason REQUIRED (non-empty) for REQUEST_CHANGES/APPROVE/REJECT; optional for COMMENT. */
export interface GovernanceReviewDecisionRequest {
  action: GovernanceReviewAction;
  reason?: string | null;
}

/** One entry in the review thread. resulting_application_state is QUEUED only on APPROVE. */
export interface GovernanceReviewDecision {
  id: string;
  change_request_id: string;
  action: GovernanceReviewAction;
  actor_id: string;
  actor_role?: GovernanceRole;
  reason?: string | null;
  resulting_status: OntologyChangeRequestStatus;
  resulting_application_state?: GovernanceApplicationState;
  created_at: string;
}

/** Surfaces the approval-!=-auto-apply state for the UI. */
export interface GovernanceApplicationBanner {
  application_state: GovernanceApplicationState;
  message: string;
}

export interface OntologyChangeRequestDetail {
  change_request: OntologyChangeRequest;
  items: OntologyChangeItem[];
  reviews: GovernanceReviewDecision[];
  capabilities: GovernanceCapabilities;
  application_banner?: GovernanceApplicationBanner;
}

/** Governance audit entry. Reuses the MVP3/MVP5 audit shape by reference; adds governance target/state context. */
export interface GovernanceAuditEntry {
  id: string;
  project_id: string;
  change_request_id: string;
  action: GovernanceAuditAction;
  actor_id: string;
  actor_role?: GovernanceRole;
  target_item_ids?: string[];
  target_ontology_element_ids?: string[];
  ontology_version_id?: string | null;
  before_status?: OntologyChangeRequestStatus | null;
  after_status?: OntologyChangeRequestStatus | null;
  reason?: string | null;
  created_at: string;
}

/** Envelope for every governance write. review_decision is null for non-review writes. */
export interface GovernanceMutationResponse {
  change_request: OntologyChangeRequest;
  review_decision?: GovernanceReviewDecision | null;
  audit_entry: GovernanceAuditEntry;
  mutation_guard: GovernanceMutationGuard;
  capabilities?: GovernanceCapabilities;
}

export interface OntologyChangeRequestListResponse {
  items: OntologyChangeRequest[];
  total_count: number;
  next_cursor?: string | null;
}

export interface GovernanceAuditListResponse {
  items: GovernanceAuditEntry[];
  total_count: number;
  next_cursor?: string | null;
}

// ---- MVP6.6 Governance change application (APPROVED+QUEUED -> APPLIED into a DRAFT ontology version) ----
// Additive/disjoint to MVP6.5. Field/enum names match docs/api/openapi-mvp6-6-draft.json
// EXACTLY. Apply is human-initiated only, from APPROVED + application_state==QUEUED
// only; it mutates ONLY a DRAFT ontology version (never the published graph).
// MVP6.6 is the FIRST slice that produces APPLIED (successful apply) and
// SUPERSEDED (staleness block); both reserved in MVP6.5. Reuses MVP6.5
// GovernanceApplicationState / ChangeRequestChangeType / ChangeRequestTargetKind
// and MVP1 OntologyElementStatus / OntologyVersionStatus by reference (no renames).

// OntologyElementStatus / OntologyVersionStatus are reused verbatim from the
// existing top-of-file MVP1 declarations (DEPRECATE -> ARCHIVED; apply targets a
// DRAFT version only). No re-declaration here.

/** MVP6.6 application audit events. Additive; does NOT rename MVP6.5 GovernanceAuditAction. */
export type GovernanceApplicationAuditAction = "CHANGE_REQUEST_APPLIED" | "CHANGE_REQUEST_SUPERSEDED";

/**
 * REDEFINED guard for the SUCCESSFUL apply response ONLY. Exactly one flag is
 * legitimately true: ontology_draft_mutated. Distinct from the all-false MVP6.5
 * GovernanceMutationGuard (which keys on ontology_definition_mutated / change_auto_applied).
 */
export interface GovernanceApplicationMutationGuard {
  ontology_draft_mutated: boolean;
  published_graph_mutated: false;
  candidate_graph_mutated: false;
  prompt_version_mutated: false;
  publish_job_started: false;
  extraction_job_started: false;
  evaluation_run_started: false;
}

/** A reference to a single ontology element the apply touches. Exactly one id field matches target_kind. */
export interface OntologyElementRef {
  target_kind: ChangeRequestTargetKind;
  ontology_class_id?: string | null;
  ontology_property_id?: string | null;
  ontology_relation_id?: string | null;
  ontology_version_id: string;
  status?: OntologyElementStatus | null;
}

/** Per-change-item before/after preview for the pre-check. before_ref null for ADD. stale is advisory. */
export interface ApplicationItemPreview {
  change_item_id: string;
  target_kind: ChangeRequestTargetKind;
  change_type: ChangeRequestChangeType;
  before_ref?: OntologyElementRef | null;
  after_ref?: OntologyElementRef | null;
  stale: boolean;
  stale_reason?: string | null;
}

/** Read-only permission + eligibility hint. can_apply is true only for apply rights AND APPROVED AND QUEUED. */
export interface ApplicationCapabilities {
  can_view: boolean;
  can_apply: boolean;
}

/** Read-only apply pre-check. Never mutates; mutation_guard is all-false. Never flips QUEUED->SUPERSEDED. */
export interface GovernanceApplicationStatusResponse {
  change_request_id: string;
  project_id: string;
  status: string;
  application_state: GovernanceApplicationState;
  target_ontology_version_id?: string | null;
  target_version_status?: OntologyVersionStatus | null;
  target_is_draft: boolean;
  applicable: boolean;
  would_supersede: boolean;
  item_previews: ApplicationItemPreview[];
  capabilities: ApplicationCapabilities;
  mutation_guard: GovernanceMutationGuard;
}

/** Optional apply body. Omit target_ontology_version_id for the project current DRAFT. */
export interface GovernanceApplyRequest {
  target_ontology_version_id?: string | null;
  note?: string | null;
}

/** Per-item before/after element ref pair for a successful apply. before null for ADD. */
export interface ApplicationBeforeAfterRef {
  change_item_id: string;
  change_type: ChangeRequestChangeType;
  before?: OntologyElementRef | null;
  after?: OntologyElementRef | null;
}

/** Application audit entry. action is GovernanceApplicationAuditAction. Never hard-deleted. */
export interface GovernanceApplicationAuditEntry {
  id: string;
  project_id: string;
  change_request_id: string;
  action: GovernanceApplicationAuditAction;
  actor_id: string;
  actor_role?: GovernanceRole;
  target_ontology_version_id?: string | null;
  applied_item_ids?: string[];
  before_after_refs?: ApplicationBeforeAfterRef[];
  before_application_state?: GovernanceApplicationState | null;
  after_application_state?: GovernanceApplicationState | null;
  note?: string | null;
  stale_detail?: Record<string, unknown> | null;
  created_at: string;
}

/** Successful apply envelope. application_state=APPLIED; guard ontology_draft_mutated=true (all others false). */
export interface GovernanceApplyResponse {
  change_request_id: string;
  project_id: string;
  application_state: GovernanceApplicationState;
  target_ontology_version_id: string;
  applied_item_ids: string[];
  before_after_refs?: ApplicationBeforeAfterRef[];
  audit_entry: GovernanceApplicationAuditEntry;
  mutation_guard: GovernanceApplicationMutationGuard;
  capabilities?: ApplicationCapabilities;
}

export interface GovernanceApplicationAuditListResponse {
  items: GovernanceApplicationAuditEntry[];
  total_count: number;
  next_cursor?: string | null;
}
