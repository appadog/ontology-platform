import {
  PublishedGraphSnapshot,
  PublishCandidate,
  PublishEligibilityReasonCode,
  PublishJob,
  QualitySummary,
  ReviewTask,
  ReviewTaskDetail,
  ValidationResult,
} from "../api/types";

const now = "2026-06-19T05:00:00.000Z";
const reviewedAt = "2026-06-19T04:36:00.000Z";
const publishedAt = "2026-06-19T04:48:00.000Z";
const projectId = "project-corp-knowledge";
const ontologyVersionId = "onto-v1-draft";
const sourceId = "source-policy-csv";
const sourceLabel = "policy_controls.csv";
const extractionJobId = "job-policy-fixture";
const reviewer = {
  id: "reviewer-hana",
  name: "Hana Reviewer",
};

function validation(
  id: string,
  candidateId: string,
  severity: ValidationResult["severity"],
  message: string,
  fieldPath: string,
  blocking: boolean,
  suggestedFix: string | null,
  ruleCode: ValidationResult["rule_code"] = severity === "FAILED" ? "RELATION_DOMAIN_RANGE" : "LOW_CONFIDENCE",
): ValidationResult {
  return {
    id,
    candidate_kind: candidateId.includes("relation") ? "RELATION" : "ENTITY",
    candidate_id: candidateId,
    rule_code: ruleCode,
    severity,
    message,
    field_path: fieldPath,
    blocking,
    suggested_fix: suggestedFix,
    created_at: now,
  };
}

const validations = {
  clean: validation("validation-clean", "candidate-clean-entity", "INFO", "No blocking validation issues.", "", false, null, "CLASS_EXISTS"),
  modified: validation(
    "validation-modified",
    "candidate-modified-relation",
    "INFO",
    "Corrected relation endpoints match domain and range.",
    "relation.endpoints",
    false,
    null,
    "RELATION_DOMAIN_RANGE",
  ),
  warning: validation(
    "validation-warning",
    "candidate-warning-no-reason",
    "WARNING",
    "Confidence is below the preferred review threshold.",
    "confidence",
    false,
    "Add reviewer reason before publish.",
    "LOW_CONFIDENCE",
  ),
  failed: validation(
    "validation-failed",
    "candidate-failed-validation",
    "FAILED",
    "Relation target is outside the ontology range.",
    "target_candidate_entity_id",
    true,
    "Choose a target entity from the Control class.",
  ),
  missingEvidence: validation(
    "validation-missing-evidence",
    "candidate-missing-evidence",
    "FAILED",
    "No source evidence is attached to this candidate.",
    "evidence_ids",
    true,
    "Attach a source segment before review.",
    "EVIDENCE_MISSING",
  ),
  rejected: validation("validation-rejected", "candidate-rejected", "INFO", "Reviewed and rejected by expert.", "", false, null),
  discussion: validation(
    "validation-discussion",
    "candidate-needs-discussion",
    "WARNING",
    "Reviewer requested ontology owner clarification.",
    "class_id",
    false,
    "Resolve class mapping before publish.",
    "CLASS_EXISTS",
  ),
  pending: validation("validation-pending", "candidate-pending", "INFO", "Ready for first review.", "", false, null),
  published: validation("validation-published", "candidate-already-published", "INFO", "Candidate was already published.", "", false, null),
};

function eligibility(task: ReviewTask, eligible: boolean, reasons: PublishEligibilityReasonCode[]) {
  return {
    candidate_kind: task.candidate_kind,
    candidate_id: task.candidate_id,
    eligible,
    reasons,
    review_status: task.review_status,
    publish_status: task.publish_status,
    validation_status: task.validation_status,
    has_evidence: task.evidence_state === "PRESENT",
    has_warning_reason: task.candidate_id !== "candidate-warning-no-reason",
  };
}

export const mockReviewTasks: ReviewTask[] = [
  {
    id: "review-task-clean-entity",
    project_id: projectId,
    candidate_kind: "ENTITY",
    candidate_id: "candidate-clean-entity",
    ontology_version_id: ontologyVersionId,
    source_id: sourceId,
    source_display_name: sourceLabel,
    source_context_label: "Sheet1 row 12",
    extraction_job_id: extractionJobId,
    job_display_label: "Policy fixture run",
    status: "IN_REVIEW",
    review_status: "PENDING",
    publish_status: "NOT_PUBLISHED",
    assignee_id: reviewer.id,
    assignee_display_name: reviewer.name,
    is_assigned_to_me: true,
    priority: "HIGH",
    priority_reason: "Clean candidate can unblock first publish job.",
    validation_status: "PASSED",
    validation_codes: ["CLASS_EXISTS"],
    top_validation: validations.clean,
    candidate_display_name: "Information Security Policy",
    candidate_summary: "Entity candidate for Policy class with policyCode=POL-001.",
    confidence: 0.94,
    evidence_count: 2,
    evidence_state: "PRESENT",
    last_decision_summary: null,
    created_at: "2026-06-19T03:00:00.000Z",
    updated_at: now,
    decided_at: null,
  },
  {
    id: "review-task-modified-relation",
    project_id: projectId,
    candidate_kind: "RELATION",
    candidate_id: "candidate-modified-relation",
    ontology_version_id: ontologyVersionId,
    source_id: sourceId,
    source_display_name: sourceLabel,
    source_context_label: "Sheet1 row 18",
    extraction_job_id: extractionJobId,
    job_display_label: "Policy fixture run",
    status: "DECIDED",
    review_status: "MODIFIED",
    publish_status: "NOT_PUBLISHED",
    assignee_id: reviewer.id,
    assignee_display_name: reviewer.name,
    is_assigned_to_me: true,
    priority: "MEDIUM",
    priority_reason: "Correction diff is saved and ready for publish.",
    validation_status: "PASSED",
    validation_codes: ["RELATION_DOMAIN_RANGE"],
    top_validation: validations.modified,
    candidate_display_name: "Security owns Information Security Policy",
    candidate_summary: "Relation candidate corrected from raw owner label to Security department entity.",
    confidence: 0.88,
    evidence_count: 2,
    evidence_state: "PRESENT",
    last_decision_summary: "Modified and approved with corrected target entity.",
    created_at: "2026-06-19T03:08:00.000Z",
    updated_at: reviewedAt,
    decided_at: reviewedAt,
  },
  {
    id: "review-task-warning",
    project_id: projectId,
    candidate_kind: "ENTITY",
    candidate_id: "candidate-warning-no-reason",
    ontology_version_id: ontologyVersionId,
    source_id: sourceId,
    source_display_name: sourceLabel,
    source_context_label: "Sheet1 row 24",
    extraction_job_id: extractionJobId,
    job_display_label: "Policy fixture run",
    status: "OPEN",
    review_status: "APPROVED",
    publish_status: "NOT_PUBLISHED",
    assignee_id: null,
    assignee_display_name: null,
    is_assigned_to_me: false,
    priority: "HIGH",
    priority_reason: "Warning approval is missing an explicit reviewer reason.",
    validation_status: "WARNING",
    validation_codes: ["LOW_CONFIDENCE"],
    top_validation: validations.warning,
    candidate_display_name: "Access Control Policy",
    candidate_summary: "Approved candidate with evidence, but warning reason is missing.",
    confidence: 0.67,
    evidence_count: 1,
    evidence_state: "PRESENT",
    last_decision_summary: "Approved without warning acceptance reason.",
    created_at: "2026-06-19T03:12:00.000Z",
    updated_at: reviewedAt,
    decided_at: reviewedAt,
  },
  {
    id: "review-task-failed",
    project_id: projectId,
    candidate_kind: "RELATION",
    candidate_id: "candidate-failed-validation",
    ontology_version_id: ontologyVersionId,
    source_id: sourceId,
    source_display_name: sourceLabel,
    source_context_label: "Sheet1 row 31",
    extraction_job_id: extractionJobId,
    job_display_label: "Policy fixture run",
    status: "ASSIGNED",
    review_status: "APPROVED",
    publish_status: "NOT_PUBLISHED",
    assignee_id: "reviewer-min",
    assignee_display_name: "Min Reviewer",
    is_assigned_to_me: false,
    priority: "HIGH",
    priority_reason: "Failed validation blocks publish until relation target is corrected.",
    validation_status: "FAILED",
    validation_codes: ["RELATION_DOMAIN_RANGE"],
    top_validation: validations.failed,
    candidate_display_name: "Policy applies to Finance Team",
    candidate_summary: "Relation candidate has a target outside the allowed range.",
    confidence: 0.79,
    evidence_count: 1,
    evidence_state: "PRESENT",
    last_decision_summary: "Approved before latest validation failed.",
    created_at: "2026-06-19T03:18:00.000Z",
    updated_at: now,
    decided_at: reviewedAt,
  },
  {
    id: "review-task-missing-evidence",
    project_id: projectId,
    candidate_kind: "ENTITY",
    candidate_id: "candidate-missing-evidence",
    ontology_version_id: ontologyVersionId,
    source_id: sourceId,
    source_display_name: sourceLabel,
    source_context_label: "Sheet1 row 39",
    extraction_job_id: extractionJobId,
    job_display_label: "Policy fixture run",
    status: "OPEN",
    review_status: "APPROVED",
    publish_status: "NOT_PUBLISHED",
    assignee_id: null,
    assignee_display_name: null,
    is_assigned_to_me: false,
    priority: "HIGH",
    priority_reason: "Missing evidence makes the candidate non-publishable.",
    validation_status: "FAILED",
    validation_codes: ["EVIDENCE_MISSING"],
    top_validation: validations.missingEvidence,
    candidate_display_name: "Unlinked Retention Policy",
    candidate_summary: "No supporting source row is attached.",
    confidence: 0.72,
    evidence_count: 0,
    evidence_state: "MISSING",
    last_decision_summary: "Approved before evidence check completed.",
    created_at: "2026-06-19T03:22:00.000Z",
    updated_at: now,
    decided_at: reviewedAt,
  },
  {
    id: "review-task-discussion",
    project_id: projectId,
    candidate_kind: "ENTITY",
    candidate_id: "candidate-needs-discussion",
    ontology_version_id: ontologyVersionId,
    source_id: sourceId,
    source_display_name: sourceLabel,
    source_context_label: "Sheet1 row 44",
    extraction_job_id: extractionJobId,
    job_display_label: "Policy fixture run",
    status: "DECIDED",
    review_status: "NEEDS_DISCUSSION",
    publish_status: "NOT_PUBLISHED",
    assignee_id: reviewer.id,
    assignee_display_name: reviewer.name,
    is_assigned_to_me: true,
    priority: "MEDIUM",
    priority_reason: "Ontology owner must confirm whether this is a Policy or Control.",
    validation_status: "WARNING",
    validation_codes: ["CLASS_EXISTS"],
    top_validation: validations.discussion,
    candidate_display_name: "Control Procedure",
    candidate_summary: "Reviewer requested changes before final decision.",
    confidence: 0.81,
    evidence_count: 1,
    evidence_state: "PRESENT",
    last_decision_summary: "Needs discussion: class mapping is unclear.",
    created_at: "2026-06-19T03:28:00.000Z",
    updated_at: reviewedAt,
    decided_at: reviewedAt,
  },
  {
    id: "review-task-published",
    project_id: projectId,
    candidate_kind: "ENTITY",
    candidate_id: "candidate-already-published",
    ontology_version_id: ontologyVersionId,
    source_id: sourceId,
    source_display_name: sourceLabel,
    source_context_label: "Sheet1 row 5",
    extraction_job_id: extractionJobId,
    job_display_label: "Policy fixture run",
    status: "DECIDED",
    review_status: "APPROVED",
    publish_status: "PUBLISHED",
    assignee_id: reviewer.id,
    assignee_display_name: reviewer.name,
    is_assigned_to_me: true,
    priority: "LOW",
    priority_reason: "Already included in current published graph snapshot.",
    validation_status: "PASSED",
    validation_codes: ["CLASS_EXISTS"],
    top_validation: validations.published,
    candidate_display_name: "Security Department",
    candidate_summary: "Published entity fact in the current snapshot.",
    confidence: 0.96,
    evidence_count: 1,
    evidence_state: "PRESENT",
    last_decision_summary: "Approved and published in graph v3.",
    created_at: "2026-06-19T02:48:00.000Z",
    updated_at: publishedAt,
    decided_at: reviewedAt,
  },
];

const baseSourceExcerpt =
  "The Security department owns the Information Security Policy and reviews access control requirements quarterly.";

export const mockReviewTaskDetails: Record<string, ReviewTaskDetail> = Object.fromEntries(
  mockReviewTasks.map((task) => {
    const hasCorrection = task.candidate_id === "candidate-modified-relation";
    const correctionDiff = hasCorrection
      ? [
          {
            field_path: "target_candidate_entity_id",
            original_value: "candidate-raw-owner-label",
            corrected_value: "published-entity-security-department",
          },
        ]
      : [];
    const warningNeedsReason = task.candidate_id === "candidate-warning-no-reason";
    const alreadyPublished = task.publish_status === "PUBLISHED";
    const failed = task.validation_status === "FAILED";
    const missingEvidence = task.evidence_state === "MISSING";
    const canDecide = task.is_assigned_to_me && !alreadyPublished;

    return [
      task.id,
      {
        ...task,
        original_snapshot: {
          label: task.candidate_display_name,
          confidence: task.confidence,
          source: task.source_context_label,
          raw_candidate_id: task.candidate_id,
        },
        corrected_snapshot: hasCorrection
          ? {
              label: task.candidate_display_name,
              confidence: task.confidence,
              target_candidate_entity_id: "published-entity-security-department",
            }
          : null,
        correction: hasCorrection
          ? {
              id: "correction-modified-relation",
              status: "APPLIED",
              original_snapshot: {
                target_candidate_entity_id: "candidate-raw-owner-label",
              },
              corrected_snapshot: {
                target_candidate_entity_id: "published-entity-security-department",
              },
              diff: correctionDiff,
              evidence_ids: ["evidence-policy-row-18"],
              reviewer_id: reviewer.id,
              reviewer_display_name: reviewer.name,
              updated_at: reviewedAt,
            }
          : null,
        validation_results: [task.top_validation],
        decision_history:
          task.review_status === "PENDING"
            ? []
            : [
                {
                  id: `decision-${task.candidate_id}`,
                  review_task_id: task.id,
                  decision: task.review_status === "MODIFIED" ? "MODIFY_AND_APPROVE" : task.review_status === "NEEDS_DISCUSSION" ? "REQUEST_CHANGES" : task.review_status === "REJECTED" ? "REJECT" : "APPROVE",
                  resulting_review_status: task.review_status,
                  reviewer_id: reviewer.id,
                  reviewer_display_name: reviewer.name,
                  reason: warningNeedsReason ? null : task.last_decision_summary,
                  correction_diff: correctionDiff,
                  publish_eligibility: eligibility(
                    task,
                    task.review_status === "APPROVED" || task.review_status === "MODIFIED",
                    warningNeedsReason
                      ? ["WARNING_REASON_REQUIRED"]
                      : missingEvidence
                        ? ["MISSING_EVIDENCE"]
                        : failed
                          ? ["FAILED_VALIDATION"]
                          : alreadyPublished
                            ? ["ALREADY_PUBLISHED"]
                            : task.review_status === "NEEDS_DISCUSSION"
                              ? ["NEEDS_DISCUSSION"]
                              : ["ELIGIBLE"],
                  ),
                  created_at: reviewedAt,
                },
              ],
        publish_eligibility: eligibility(
          task,
          task.review_status === "APPROVED" || task.review_status === "MODIFIED",
          warningNeedsReason
            ? ["WARNING_REASON_REQUIRED"]
            : missingEvidence
              ? ["MISSING_EVIDENCE"]
              : failed
                ? ["FAILED_VALIDATION"]
                : alreadyPublished
                  ? ["ALREADY_PUBLISHED"]
                  : task.review_status === "NEEDS_DISCUSSION"
                    ? ["NEEDS_DISCUSSION"]
                    : task.review_status === "PENDING"
                      ? ["PENDING"]
                      : ["ELIGIBLE"],
        ),
        source_excerpt: task.evidence_state === "MISSING" ? "" : baseSourceExcerpt,
        source_locator: task.evidence_state === "MISSING" ? "No linked evidence" : task.source_context_label,
        can_decide: canDecide,
        read_only_reason: alreadyPublished
          ? "This candidate is already published."
          : canDecide
            ? null
            : "Assigned to another reviewer or unassigned in this mock role.",
      } satisfies ReviewTaskDetail,
    ];
  }),
);

export const mockPublishCandidates: PublishCandidate[] = mockReviewTasks.map((task) => {
  const detail = mockReviewTaskDetails[task.id];

  return detail.publish_eligibility;
});

export const mockPublishJobs: PublishJob[] = [
  {
    id: "publish-job-current",
    project_id: projectId,
    ontology_version_id: ontologyVersionId,
    status: "SUCCESS",
    requested_by: reviewer.id,
    candidate_refs: [
      { candidate_kind: "ENTITY", candidate_id: "candidate-already-published" },
      { candidate_kind: "RELATION", candidate_id: "candidate-modified-relation" },
    ],
    eligible_count: 2,
    published_entity_count: 1,
    published_relation_count: 1,
    skipped_count: 0,
    skip_reasons: mockPublishCandidates.filter((candidate) => !candidate.eligible),
    published_graph_version_id: "published-graph-v3",
    created_at: "2026-06-19T04:44:00.000Z",
    started_at: "2026-06-19T04:45:00.000Z",
    ended_at: publishedAt,
    error_code: null,
    error_message: null,
    notify_webhook_url: null,
    webhook_delivery_status: "NOT_CONFIGURED",
    webhook_delivered_at: null,
    webhook_error_message: null,
  },
];

export const mockPublishedGraph: PublishedGraphSnapshot = {
  version: {
    id: "published-graph-v3",
    project_id: projectId,
    version: 3,
    ontology_version_id: ontologyVersionId,
    publish_job_id: "publish-job-current",
    is_current: true,
    created_by: reviewer.id,
    created_at: publishedAt,
    summary: {
      published_entities: 1,
      published_relations: 1,
    },
  },
  entities: [
    {
      id: "published-entity-security-department",
      project_id: projectId,
      published_graph_version_id: "published-graph-v3",
      ontology_version_id: ontologyVersionId,
      class_id: "class-department",
      canonical_name: "Security Department",
      properties: {
        ownerCode: "SEC",
      },
      source_candidate_entity_ids: ["candidate-already-published"],
      original_snapshot: { label: "Security Department", confidence: 0.96 },
      corrected_snapshot: null,
      lineage: {
        publish_job_id: "publish-job-current",
        published_graph_version_id: "published-graph-v3",
        published_graph_version: 3,
        ontology_version_id: ontologyVersionId,
        candidate_kind: "ENTITY",
        candidate_id: "candidate-already-published",
        original_snapshot: { label: "Security Department", confidence: 0.96 },
        original_snapshot_ref: null,
        corrected_snapshot: null,
        evidence_refs: [
          {
            evidence_id: "evidence-policy-row-5",
            source_id: sourceId,
            source_display_name: sourceLabel,
            locator: "Sheet1 row 5",
          },
        ],
        reviewer_id: reviewer.id,
        reviewer_display_name: reviewer.name,
        review_decision_id: "decision-candidate-already-published",
        review_decision_type: "APPROVE",
        reason: "Trusted department owner row.",
        reviewed_at: reviewedAt,
        published_at: publishedAt,
      },
      created_at: publishedAt,
    },
  ],
  relations: [
    {
      id: "published-relation-policy-owner",
      project_id: projectId,
      published_graph_version_id: "published-graph-v3",
      ontology_version_id: ontologyVersionId,
      source_published_entity_id: "published-entity-security-department",
      relation_id: "relation-owns",
      target_published_entity_id: "published-entity-information-security-policy",
      properties: {
        label: "owns",
      },
      source_candidate_relation_ids: ["candidate-modified-relation"],
      original_snapshot: { target_candidate_entity_id: "candidate-raw-owner-label" },
      corrected_snapshot: { target_candidate_entity_id: "published-entity-security-department" },
      lineage: {
        publish_job_id: "publish-job-current",
        published_graph_version_id: "published-graph-v3",
        published_graph_version: 3,
        ontology_version_id: ontologyVersionId,
        candidate_kind: "RELATION",
        candidate_id: "candidate-modified-relation",
        original_snapshot: { target_candidate_entity_id: "candidate-raw-owner-label" },
        original_snapshot_ref: null,
        corrected_snapshot: { target_candidate_entity_id: "published-entity-security-department" },
        evidence_refs: [
          {
            evidence_id: "evidence-policy-row-18",
            source_id: sourceId,
            source_display_name: sourceLabel,
            locator: "Sheet1 row 18",
          },
        ],
        reviewer_id: reviewer.id,
        reviewer_display_name: reviewer.name,
        review_decision_id: "decision-candidate-modified-relation",
        review_decision_type: "MODIFY_AND_APPROVE",
        reason: "Corrected the raw owner label to the canonical department entity.",
        reviewed_at: reviewedAt,
        published_at: publishedAt,
      },
      created_at: publishedAt,
    },
  ],
};

export const mockQualitySummary: QualitySummary = {
  project_id: projectId,
  ontology_version_id: ontologyVersionId,
  generated_at: now,
  candidate_counts: {
    total: { value: 8, drilldown: { target: "review_inbox", label: "All review tasks", params: { assignment: "all" } } },
    entity: { value: 6, drilldown: { target: "review_inbox", label: "Entity candidates", params: { candidate_kind: "ENTITY" } } },
    relation: { value: 2, drilldown: { target: "review_inbox", label: "Relation candidates", params: { candidate_kind: "RELATION" } } },
    property_value: { value: 0, drilldown: { target: "review_inbox", label: "Property value candidates", params: { candidate_kind: "PROPERTY_VALUE" } } },
    missing_evidence: { value: 1, drilldown: { target: "publish_jobs", label: "Missing evidence blocks", params: { reason: "MISSING_EVIDENCE" } } },
  },
  validation_counts: {
    not_validated: { value: 0, drilldown: { target: "review_inbox", label: "Not validated", params: { validation_status: "NOT_VALIDATED" } } },
    passed: { value: 4, drilldown: { target: "review_inbox", label: "Validation passed", params: { validation_status: "PASSED" } } },
    warning: { value: 2, drilldown: { target: "review_inbox", label: "Warnings", params: { validation_status: "WARNING" } } },
    failed: { value: 2, drilldown: { target: "review_inbox", label: "Failed validation", params: { validation_status: "FAILED" } } },
    by_rule_code: {
      EVIDENCE_MISSING: { value: 1, drilldown: { target: "publish_jobs", label: "Missing evidence blocks", params: { reason: "MISSING_EVIDENCE" } } },
      LOW_CONFIDENCE: { value: 2, drilldown: { target: "review_inbox", label: "Low confidence warnings", params: { rule_code: "LOW_CONFIDENCE" } } },
    },
  },
  review_counts: {
    pending: { value: 1, drilldown: { target: "review_inbox", label: "Pending review", params: { status: "PENDING" } } },
    approved: { value: 4, drilldown: { target: "review_inbox", label: "Approved", params: { status: "APPROVED" } } },
    rejected: { value: 0, drilldown: { target: "review_inbox", label: "Rejected", params: { status: "REJECTED" } } },
    modified: { value: 1, drilldown: { target: "review_inbox", label: "Modified", params: { status: "MODIFIED" } } },
    needs_discussion: { value: 1, drilldown: { target: "review_inbox", label: "Needs discussion", params: { status: "NEEDS_DISCUSSION" } } },
  },
  publish_counts: {
    not_published: { value: 6, drilldown: { target: "publish_jobs", label: "Publish queue", params: {} } },
    published: { value: 2, drilldown: { target: "published_graph", label: "Current published graph", params: { version: "current" } } },
    rolled_back: { value: 0, drilldown: { target: "published_graph", label: "Rolled back facts", params: { publish_status: "ROLLED_BACK" } } },
    published_entities: { value: 1, drilldown: { target: "published_graph", label: "Published entities", params: { kind: "entity" } } },
    published_relations: { value: 1, drilldown: { target: "published_graph", label: "Published relations", params: { kind: "relation" } } },
    publish_success: { value: 1, drilldown: { target: "publish_jobs", label: "Successful jobs", params: { status: "SUCCESS" } } },
    publish_failed: { value: 0, drilldown: { target: "publish_jobs", label: "Failed jobs", params: { status: "FAILED" } } },
    current_version_id: "published-graph-v3",
    current_version: 3,
  },
  rates: {
    approval_rate: {
      numerator: 5,
      denominator: 7,
      rate: 0.714,
      drilldown: { target: "review_inbox", label: "Approved or modified", params: { status: "APPROVED,MODIFIED" } },
    },
    rejection_rate: {
      numerator: 0,
      denominator: 7,
      rate: 0,
      drilldown: { target: "review_inbox", label: "Rejected", params: { status: "REJECTED" } },
    },
    modification_rate: {
      numerator: 1,
      denominator: 7,
      rate: 0.143,
      drilldown: { target: "review_inbox", label: "Modified", params: { status: "MODIFIED" } },
    },
    validation_failure_rate: {
      numerator: 2,
      denominator: 8,
      rate: 0.25,
      drilldown: { target: "review_inbox", label: "Failed validation", params: { validation_status: "FAILED" } },
    },
    evidence_missing_rate: {
      numerator: 1,
      denominator: 8,
      rate: 0.125,
      drilldown: { target: "publish_jobs", label: "Missing evidence blocks", params: { reason: "MISSING_EVIDENCE" } },
    },
    published_ratio: {
      numerator: 2,
      denominator: 8,
      rate: 0.25,
      drilldown: { target: "published_graph", label: "Published facts", params: { version: "current" } },
    },
  },
};
