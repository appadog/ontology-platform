import { describe, expect, it } from "vitest";
import { apiClient } from "./client";

describe("MVP3 mock workflow contract", () => {
  it("returns a wrapped review inbox with frozen review and validation literals", async () => {
    const inbox = await apiClient.listReviewTasks("project-corp-knowledge", {
      assignment: "assigned-to-me",
      limit: 20,
      offset: 0,
    });

    expect(inbox).toMatchObject({
      total_count: expect.any(Number),
      limit: 20,
      offset: 0,
    });
    expect(inbox.items.length).toBeGreaterThan(0);
    expect(inbox.items[0]).toMatchObject({
      review_status: expect.stringMatching(/PENDING|APPROVED|REJECTED|MODIFIED|NEEDS_DISCUSSION/),
      top_validation: {
        severity: expect.stringMatching(/INFO|WARNING|FAILED/),
        field_path: expect.any(String),
      },
    });
  });

  it("exposes publish eligibility reason codes instead of requiring UI inference", async () => {
    const queue = await apiClient.listPublishCandidates("project-corp-knowledge");
    const reasonCodes = queue.map((candidate) => candidate.reasons[0]);

    expect(reasonCodes).toContain("ELIGIBLE");
    expect(reasonCodes).toContain("WARNING_REASON_REQUIRED");
    expect(reasonCodes).toContain("FAILED_VALIDATION");
    expect(reasonCodes).toContain("MISSING_EVIDENCE");
    expect(reasonCodes).toContain("ALREADY_PUBLISHED");
    expect(queue[0]).toMatchObject({
      candidate_kind: expect.stringMatching(/ENTITY|RELATION|PROPERTY_VALUE/),
      candidate_id: expect.any(String),
      eligible: expect.any(Boolean),
      reasons: expect.any(Array),
      has_evidence: expect.any(Boolean),
      has_warning_reason: expect.any(Boolean),
    });
    expect(queue[0]).not.toHaveProperty("publish_eligibility");
    expect(queue[0]).not.toHaveProperty("display_label");
  });

  it("keeps published graph facts separate from review candidates", async () => {
    const snapshot = await apiClient.getCurrentPublishedGraph("project-corp-knowledge");

    expect(snapshot.version.is_current).toBe(true);
    expect(snapshot.version).toMatchObject({
      version: expect.any(Number),
      summary: expect.any(Object),
    });
    expect(snapshot.entities.every((entity) => entity.published_graph_version_id === snapshot.version.id)).toBe(true);
    expect(snapshot.relations.every((relation) => relation.published_graph_version_id === snapshot.version.id)).toBe(true);
    expect(snapshot.entities.flatMap((entity) => entity.source_candidate_entity_ids)).not.toContain("candidate-warning-no-reason");
    expect(snapshot.entities[0]).toMatchObject({
      canonical_name: expect.any(String),
      source_candidate_entity_ids: expect.any(Array),
    });
    expect(snapshot.relations[0]).toMatchObject({
      source_published_entity_id: expect.any(String),
      target_published_entity_id: expect.any(String),
      source_candidate_relation_ids: expect.any(Array),
    });
    expect(snapshot.entities[0].lineage).toMatchObject({
      published_graph_version_id: snapshot.version.id,
      published_graph_version: snapshot.version.version,
      review_decision_id: expect.any(String),
      review_decision_type: expect.stringMatching(/APPROVE|REJECT|REQUEST_CHANGES|MODIFY_AND_APPROVE/),
    });
    expect(snapshot.version).not.toHaveProperty("version_number");
    expect(snapshot.entities[0].lineage).not.toHaveProperty("graph_version_id");
    expect(snapshot.entities[0].lineage).not.toHaveProperty("decision");
  });

  it("returns typed quality summary count and rate groups with drilldown hints", async () => {
    const summary = await apiClient.getQualitySummary("project-corp-knowledge");

    expect(summary.candidate_counts.total.value).toBeGreaterThan(0);
    expect(summary.candidate_counts.entity.value).toBeGreaterThan(0);
    expect(summary.candidate_counts.relation.value).toBeGreaterThan(0);
    expect(summary.candidate_counts.property_value.value).toBeGreaterThanOrEqual(0);
    expect(summary.candidate_counts.missing_evidence.drilldown?.target).toBe("publish_jobs");
    expect(summary.candidate_counts).not.toHaveProperty("entities");
    expect(summary.candidate_counts).not.toHaveProperty("relations");
    expect(summary.validation_counts.not_validated.value).toBeGreaterThanOrEqual(0);
    expect(summary.validation_counts.failed.drilldown?.target).toBe("review_inbox");
    expect(summary.validation_counts.by_rule_code.EVIDENCE_MISSING?.value).toBeGreaterThanOrEqual(0);
    expect(summary.validation_counts).not.toHaveProperty("missing_evidence");
    expect(summary.review_counts.needs_discussion.value).toBeGreaterThanOrEqual(0);
    expect(summary.publish_counts.published_entities.value).toBeGreaterThan(0);
    expect(summary.publish_counts.rolled_back.value).toBeGreaterThanOrEqual(0);
    expect(summary.publish_counts.publish_success.value).toBeGreaterThanOrEqual(0);
    expect(summary.publish_counts.current_version_id).toBe("published-graph-v3");
    expect(summary.rates.approval_rate.rate).toBeGreaterThan(0);
    expect(summary.rates.approval_rate.numerator).toBeLessThanOrEqual(summary.rates.approval_rate.denominator);
    expect(summary.rates.validation_failure_rate.rate).toBeGreaterThanOrEqual(0);
    expect(summary.rates.evidence_missing_rate.rate).toBeGreaterThanOrEqual(0);
    expect(summary.rates.published_ratio.rate).toBeGreaterThanOrEqual(0);
    expect(summary.rates).not.toHaveProperty("publish_rate");
  });

  it("uses OpenAPI publish job field names and keeps display progress derived", async () => {
    const jobs = await apiClient.listPublishJobs("project-corp-knowledge");
    const job = jobs[0];

    expect(job).toMatchObject({
      ontology_version_id: expect.any(String),
      requested_by: expect.any(String),
      candidate_refs: expect.any(Array),
      eligible_count: expect.any(Number),
      skip_reasons: expect.any(Array),
      published_graph_version_id: expect.any(String),
      ended_at: expect.any(String),
    });
    expect(job.candidate_refs[0]).toMatchObject({
      candidate_kind: expect.stringMatching(/ENTITY|RELATION|PROPERTY_VALUE/),
      candidate_id: expect.any(String),
    });
    expect(job.skip_reasons[0]).toMatchObject({
      candidate_kind: expect.stringMatching(/ENTITY|RELATION|PROPERTY_VALUE/),
      candidate_id: expect.any(String),
      review_status: expect.stringMatching(/PENDING|APPROVED|REJECTED|MODIFIED|NEEDS_DISCUSSION/),
      publish_status: expect.stringMatching(/NOT_PUBLISHED|PUBLISHED|ROLLED_BACK/),
      validation_status: expect.stringMatching(/NOT_VALIDATED|PASSED|WARNING|FAILED/),
      has_evidence: expect.any(Boolean),
      has_warning_reason: expect.any(Boolean),
    });
    expect(job).not.toHaveProperty("progress");
    expect(job).not.toHaveProperty("selected_candidate_count");
    expect(job).not.toHaveProperty("eligibility_summary");
    expect(job).not.toHaveProperty("result_version_id");
    expect(job).not.toHaveProperty("finished_at");
  });
});
