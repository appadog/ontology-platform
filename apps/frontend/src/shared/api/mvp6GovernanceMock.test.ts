import { describe, expect, it } from "vitest";
import { apiClient, GovernanceError } from "./client";
import {
  MVP6_GOVERNANCE_APPROVED_ID,
  MVP6_GOVERNANCE_OPEN_ID,
  MVP6_GOVERNANCE_PROJECT_ID,
  MVP6_GOVERNANCE_REJECTED_ID,
} from "../mocks/mvp6GovernanceFixtures";
import type { GovernanceMutationGuard } from "./types";

const ALL_FALSE_GUARD: GovernanceMutationGuard = {
  ontology_definition_mutated: false,
  published_graph_mutated: false,
  candidate_graph_mutated: false,
  prompt_version_mutated: false,
  publish_job_started: false,
  extraction_job_started: false,
  change_auto_applied: false,
};

describe("MVP6.5 Governance mock contract", () => {
  it("lists project change requests grouped by status with the frozen enums", async () => {
    const list = await apiClient.listOntologyChangeRequests(MVP6_GOVERNANCE_PROJECT_ID);
    expect(list.total_count).toBeGreaterThan(0);
    const statuses = new Set(list.items.map((cr) => cr.status));
    expect(statuses.has("OPEN")).toBe(true);
    expect(statuses.has("APPROVED")).toBe(true);
    const approved = list.items.find((cr) => cr.id === MVP6_GOVERNANCE_APPROVED_ID);
    expect(approved?.application_state).toBe("QUEUED");
  });

  it("proposes a DRAFT, submits it to OPEN, and every write carries an all-false guard", async () => {
    const created = await apiClient.proposeOntologyChangeRequest(MVP6_GOVERNANCE_PROJECT_ID, {
      title: "테스트 변경 요청",
      summary: "unit-test proposal",
      items: [
        {
          target_kind: "CLASS",
          change_type: "ADD",
          ontology_version_id: "onto-v6-gov",
          proposed_change: { name: "TestClass" },
        },
      ],
    });
    expect(created.change_request.status).toBe("DRAFT");
    expect(created.change_request.application_state).toBe("NOT_APPLICABLE");
    expect(created.mutation_guard).toEqual(ALL_FALSE_GUARD);
    expect(created.audit_entry.action).toBe("CHANGE_REQUEST_CREATED");

    const submitted = await apiClient.submitOntologyChangeRequest(created.change_request.id);
    expect(submitted.change_request.status).toBe("OPEN");
    expect(submitted.audit_entry.action).toBe("CHANGE_REQUEST_SUBMITTED");
    expect(submitted.mutation_guard).toEqual(ALL_FALSE_GUARD);
  });

  it("409s when submitting a request with zero items (CHANGE_REQUEST_NO_ITEMS)", async () => {
    const created = await apiClient.proposeOntologyChangeRequest(MVP6_GOVERNANCE_PROJECT_ID, {
      title: "빈 요청",
    });
    await expect(apiClient.submitOntologyChangeRequest(created.change_request.id)).rejects.toMatchObject({
      code: "CHANGE_REQUEST_NO_ITEMS",
    });
  });

  it("APPROVE queues the request (application_state=QUEUED) and applies NOTHING", async () => {
    // Create + submit a fresh request (proposer != mock approver actor), then approve.
    const created = await apiClient.proposeOntologyChangeRequest(MVP6_GOVERNANCE_PROJECT_ID, {
      title: "승인 대상",
      summary: "approve me",
      items: [{ target_kind: "PROPERTY", change_type: "ADD", ontology_version_id: "onto-v6-gov" }],
    });
    await apiClient.submitOntologyChangeRequest(created.change_request.id);
    const approved = await apiClient.recordGovernanceReviewDecision(created.change_request.id, {
      action: "APPROVE",
      reason: "queued approval justification",
    });
    expect(approved.change_request.status).toBe("APPROVED");
    expect(approved.change_request.application_state).toBe("QUEUED");
    expect(approved.review_decision?.resulting_application_state).toBe("QUEUED");
    expect(approved.mutation_guard.change_auto_applied).toBe(false);
    expect(approved.mutation_guard).toEqual(ALL_FALSE_GUARD);
    expect(approved.audit_entry.action).toBe("CHANGE_REQUEST_APPROVED");
  });

  it("422 REASON_REQUIRED when approving/rejecting/requesting-changes without a reason", async () => {
    await expect(
      apiClient.recordGovernanceReviewDecision(MVP6_GOVERNANCE_OPEN_ID, { action: "APPROVE" }),
    ).rejects.toMatchObject({ code: "REASON_REQUIRED" });
    await expect(
      apiClient.recordGovernanceReviewDecision(MVP6_GOVERNANCE_OPEN_ID, { action: "REJECT", reason: "  " }),
    ).rejects.toMatchObject({ code: "REASON_REQUIRED" });
  });

  it("G1 first-touch: COMMENT on an OPEN request auto-advances it to IN_REVIEW", async () => {
    const created = await apiClient.proposeOntologyChangeRequest(MVP6_GOVERNANCE_PROJECT_ID, {
      title: "first-touch 대상",
      summary: "comment advances",
      items: [{ target_kind: "CLASS", change_type: "ADD", ontology_version_id: "onto-v6-gov" }],
    });
    await apiClient.submitOntologyChangeRequest(created.change_request.id);
    const commented = await apiClient.recordGovernanceReviewDecision(created.change_request.id, {
      action: "COMMENT",
      reason: "first review touch",
    });
    expect(commented.change_request.status).toBe("IN_REVIEW");
    const audit = await apiClient.listChangeRequestAudit(created.change_request.id);
    // REVIEW_STARTED is audited before the COMMENT_ADDED action (G1 ordering).
    const startedIdx = audit.items.findIndex((e) => e.action === "REVIEW_STARTED");
    const commentIdx = audit.items.findIndex((e) => e.action === "COMMENT_ADDED");
    expect(startedIdx).toBeGreaterThanOrEqual(0);
    expect(startedIdx).toBeLessThan(commentIdx);
  });

  it("capabilities gate the decision surface: approver may approve a non-own request", async () => {
    // The seeded OPEN request is proposed by gov-proposer (not the mock actor),
    // so the approver may approve; the capability hint reflects that. The
    // segregation-of-duties 403 SELF_APPROVAL_FORBIDDEN backstop is exercised in
    // the actual-API smoke where a proposer attempts to approve their own request.
    const detail = await apiClient.getOntologyChangeRequest(MVP6_GOVERNANCE_OPEN_ID);
    expect(detail.capabilities.can_view).toBe(true);
    expect(detail.capabilities.can_approve).toBe(true);
    expect(detail.capabilities.can_reject).toBe(true);
  });

  it("409 CHANGE_REQUEST_STATE_CONFLICT when deciding on a terminal request", async () => {
    await expect(
      apiClient.recordGovernanceReviewDecision(MVP6_GOVERNANCE_REJECTED_ID, {
        action: "APPROVE",
        reason: "too late",
      }),
    ).rejects.toBeInstanceOf(GovernanceError);
    await expect(
      apiClient.recordGovernanceReviewDecision(MVP6_GOVERNANCE_REJECTED_ID, {
        action: "APPROVE",
        reason: "too late",
      }),
    ).rejects.toMatchObject({ code: "CHANGE_REQUEST_STATE_CONFLICT" });
  });

  it("detail exposes capabilities + application banner; approved request banner states nothing applied", async () => {
    const detail = await apiClient.getOntologyChangeRequest(MVP6_GOVERNANCE_APPROVED_ID);
    expect(detail.capabilities.can_view).toBe(true);
    expect(detail.application_banner?.application_state).toBe("QUEUED");
    expect(detail.application_banner?.message).toContain("변경되지 않");
  });

  it("audit is delivered chronological ascending (G4 wire order)", async () => {
    const audit = await apiClient.listChangeRequestAudit(MVP6_GOVERNANCE_APPROVED_ID);
    const times = audit.items.map((e) => e.created_at);
    const sorted = [...times].sort((a, b) => a.localeCompare(b));
    expect(times).toEqual(sorted);
    expect(audit.items[0].action).toBe("CHANGE_REQUEST_CREATED");
  });
});
