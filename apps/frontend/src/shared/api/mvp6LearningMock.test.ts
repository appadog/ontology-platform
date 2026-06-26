import { describe, expect, it } from "vitest";
import { apiClient, SuggestionDecisionError } from "./client";
import { MVP6_LEARNING_PROJECT_ID } from "../mocks/mvp6LearningFixtures";

describe("MVP6.2 learning insights mock contract", () => {
  it("returns a project-scoped learning summary with frozen taxonomy and counts", async () => {
    const summary = await apiClient.getLearningSummary(MVP6_LEARNING_PROJECT_ID);

    expect(summary.project_id).toBe(MVP6_LEARNING_PROJECT_ID);
    expect(summary.signal_counts).toHaveLength(7);
    expect(summary.signal_counts.map((item) => item.signal_type)).toEqual(
      expect.arrayContaining([
        "RELATION_DIRECTION_CORRECTION",
        "CLASS_CONFUSION",
        "RELATION_TYPE_CONFUSION",
        "EVIDENCE_MISSING",
        "EVIDENCE_MISMATCH",
        "REPEATED_VALIDATION_FAILURE",
        "LOW_BENCHMARK_METRIC_CLUSTER",
      ]),
    );
    expect(summary.auto_approval_preview_count).toBeGreaterThan(0);
    expect(summary.safety_notes.length).toBeGreaterThan(0);
  });

  it("exposes correction patterns with source artifacts and examples", async () => {
    const patterns = await apiClient.listLearningCorrectionPatterns(MVP6_LEARNING_PROJECT_ID);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]).toMatchObject({
      project_id: MVP6_LEARNING_PROJECT_ID,
      primary_signal_type: expect.any(String),
      support_count: expect.any(Number),
      source_artifacts: expect.any(Array),
      representative_examples: expect.any(Array),
      safety_note: expect.any(String),
    });
    expect(patterns[0].source_artifacts[0].artifact_type).toBeDefined();
  });

  it("exposes auto-approval previews as recommendation-only with blocked actions", async () => {
    const previews = await apiClient.listLearningAutoApprovalCandidates(MVP6_LEARNING_PROJECT_ID);
    expect(previews.length).toBeGreaterThan(0);
    expect(previews[0].recommendation_only).toBe(true);
    expect(previews[0].not_enforced).toBe(true);
    expect(previews[0].requires_later_policy_approval).toBe(true);
    expect(previews[0].blocked_actions).toEqual(
      expect.arrayContaining(["CREATE_POLICY", "ENABLE_POLICY", "APPROVE_CANDIDATE", "PUBLISH_GRAPH"]),
    );
  });

  it("accepts a SUGGESTED suggestion and records an audit note with all mutation flags false", async () => {
    const suggestions = await apiClient.listLearningPromptSuggestions(MVP6_LEARNING_PROJECT_ID);
    const open = suggestions.find((item) => item.state === "SUGGESTED");
    expect(open).toBeDefined();

    const response = await apiClient.decideLearningSuggestion(open!.id, {
      decision: "ACCEPT",
      intended_next_action: "USE_IN_NEXT_PROMPT_DRAFT",
    });

    expect(response.previous_state).toBe("SUGGESTED");
    expect(response.new_state).toBe("ACCEPTED");
    expect(response.decision_audit_note.decision).toBe("ACCEPT");
    expect(response.decision_audit_note.mutation_guard).toEqual({
      prompt_version_mutated: false,
      candidate_graph_mutated: false,
      published_graph_mutated: false,
      auto_approval_policy_mutated: false,
      extraction_job_started: false,
      evaluation_run_started: false,
    });
  });

  it("requires a reason code for DISMISS and conflicts on already-decided suggestions", async () => {
    const suggestions = await apiClient.listLearningPromptSuggestions(MVP6_LEARNING_PROJECT_ID);
    const open = suggestions.find((item) => item.state === "SUGGESTED");
    expect(open).toBeDefined();

    await expect(apiClient.decideLearningSuggestion(open!.id, { decision: "DISMISS" })).rejects.toMatchObject({
      code: "DISMISS_REASON_REQUIRED",
    });

    const dismissResponse = await apiClient.decideLearningSuggestion(open!.id, {
      decision: "DISMISS",
      dismiss_reason_code: "INSUFFICIENT_EVIDENCE",
    });
    expect(dismissResponse.new_state).toBe("DISMISSED");

    // Re-deciding the now-DISMISSED suggestion must conflict.
    await expect(
      apiClient.decideLearningSuggestion(open!.id, { decision: "ACCEPT" }),
    ).rejects.toBeInstanceOf(SuggestionDecisionError);
    await expect(apiClient.decideLearningSuggestion(open!.id, { decision: "ACCEPT" })).rejects.toMatchObject({
      code: "PROMPT_SUGGESTION_DECISION_CONFLICT",
    });
  });

  it("never offers a decision command path that sets SUPERSEDED", async () => {
    const suggestions = await apiClient.listLearningPromptSuggestions(MVP6_LEARNING_PROJECT_ID);
    const superseded = suggestions.find((item) => item.state === "SUPERSEDED");
    expect(superseded).toBeDefined();
    await expect(
      apiClient.decideLearningSuggestion(superseded!.id, { decision: "ACCEPT" }),
    ).rejects.toMatchObject({ code: "PROMPT_SUGGESTION_DECISION_CONFLICT" });
  });
});
