import {
  CandidateReviewStatus,
  ExtractionJobStatus,
  OntologyVersionStatus,
  ProjectStatus,
  PublishStatus,
  SourceStatus,
  ValidationStatus,
} from "../api/types";

export const PROJECT_STATUSES: ProjectStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED", "DELETED"];

export const ONTOLOGY_VERSION_STATUSES: OntologyVersionStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export const SOURCE_STATUSES: SourceStatus[] = [
  "UPLOADED",
  "PARSING",
  "PARSED",
  "PROFILED",
  "EXTRACTION_READY",
  "FAILED",
];

export const CANDIDATE_REVIEW_STATUSES: CandidateReviewStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "MODIFIED",
  "NEEDS_DISCUSSION",
];

export const VALIDATION_STATUSES: ValidationStatus[] = [
  "NOT_VALIDATED",
  "PASSED",
  "WARNING",
  "FAILED",
];

export const PUBLISH_STATUSES: PublishStatus[] = ["NOT_PUBLISHED", "PUBLISHED", "ROLLED_BACK"];

export const EXTRACTION_JOB_STATUSES: ExtractionJobStatus[] = [
  "PENDING",
  "QUEUED",
  "RUNNING",
  "SUCCESS",
  "PARTIAL_FAILED",
  "FAILED",
  "CANCELLED",
  "RETRYING",
];
