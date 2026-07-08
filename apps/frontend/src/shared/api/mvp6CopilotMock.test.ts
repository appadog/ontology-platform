import { afterEach, describe, expect, it } from "vitest";
import { apiClient, CopilotDecisionError } from "./client";
import { MVP6_COPILOT_PROJECT_ID } from "../mocks/mvp6CopilotFixtures";
import type { CopilotMutationGuard } from "./types";

// MVP6.8 Copilot mock contract. ADVISORY-ONLY: the copilot SUGGESTS and (on
// accept) ROUTES; it EXECUTES NOTHING and invokes NO real model. Every response
// carries an ALL-FALSE 14-flag CopilotMutationGuard. Decisions are audit-only;
// non-SUGGESTED -> 409. Field/enum shapes match openapi-mvp6-8-draft.json.

const P = MVP6_COPILOT_PROJECT_ID;

function guardAllFalse(guard: CopilotMutationGuard): boolean {
  const values = Object.values(guard);
  expect(values).toHaveLength(14);
  return values.every((v) => v === false);
}

// Reset the process-local store between decision tests (accept/dismiss mutate the
// SUGGESTED state audit-only). Re-import a fresh module instance is not trivial
// here; instead each decision test targets a distinct SUGGESTED suggestion id.

describe("MVP6.8 Copilot mock contract", () => {
  it("returns a deterministic, all-false-guard summary with by-kind counts", async () => {
    const summary = await apiClient.getCopilotSummary(P);
    expect(summary.project_id).toBe(P);
    expect(guardAllFalse(summary.mutation_guard)).toBe(true);
    expect(summary.mutation_guard.copilot_executed_action).toBe(false);
    expect(summary.mutation_guard.real_model_invoked).toBe(false);
    expect(summary.counts_by_kind).toHaveLength(4);
    expect(summary.source_artifact_scope.length).toBeGreaterThan(0);
    expect(summary.total_suggestion_count).toBeGreaterThan(0);
  });

  it("lists byte-stable, source-grounded suggestions across all four kinds", async () => {
    const first = await apiClient.listCopilotSuggestions(P);
    const second = await apiClient.listCopilotSuggestions(P);
    expect(JSON.stringify(first.items)).toBe(JSON.stringify(second.items));
    expect(guardAllFalse(first.mutation_guard)).toBe(true);
    // Every suggestion is source-grounded (non-empty) and names a routing target.
    for (const s of first.items) {
      expect(s.source_artifacts.length).toBeGreaterThan(0);
      expect(s.routing_target.executes_nothing).toBe(true);
      expect(s.routing_target.deep_link).toBeTruthy();
    }
    const kinds = new Set(first.items.map((s) => s.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(3);
  });

  it("filters suggestions by kind / state / risk", async () => {
    const highRisk = await apiClient.listCopilotSuggestions(P, { riskLabel: "HIGH" });
    expect(highRisk.items.every((s) => s.risk_label === "HIGH")).toBe(true);
    const dismissed = await apiClient.listCopilotSuggestions(P, { state: "DISMISSED" });
    expect(dismissed.items.every((s) => s.state === "DISMISSED")).toBe(true);
  });

  it("returns detail by id with full grounding + all-false guard", async () => {
    const detail = await apiClient.getCopilotSuggestion("copilot-suggestion-002");
    expect(detail.suggestion.id).toBe("copilot-suggestion-002");
    expect(detail.suggestion.source_artifacts.length).toBeGreaterThan(0);
    expect(guardAllFalse(detail.mutation_guard)).toBe(true);
  });

  it("404s an unknown suggestion id", async () => {
    await expect(apiClient.getCopilotSuggestion("copilot-suggestion-does-not-exist")).rejects.toMatchObject({
      code: "COPILOT_SUGGESTION_NOT_FOUND",
      status: 404,
    });
  });

  it("ACCEPT returns a routing-target descriptor and executes nothing", async () => {
    const before = await apiClient.getCopilotSuggestion("copilot-suggestion-002");
    expect(before.suggestion.state).toBe("SUGGESTED");
    const res = await apiClient.createCopilotSuggestionDecision("copilot-suggestion-002", { decision: "ACCEPT" });
    expect(res.previous_state).toBe("SUGGESTED");
    expect(res.new_state).toBe("ACCEPTED");
    expect(res.routing_target).not.toBeNull();
    expect(res.routing_target?.executes_nothing).toBe(true);
    expect(guardAllFalse(res.mutation_guard)).toBe(true);
    expect(res.decision_audit_note.decision).toBe("ACCEPT");
    expect(guardAllFalse(res.decision_audit_note.mutation_guard)).toBe(true);
  });

  it("re-deciding an already-ACCEPTED suggestion returns 409 conflict", async () => {
    // copilot-suggestion-002 was accepted in the prior test (process-local store).
    await expect(
      apiClient.createCopilotSuggestionDecision("copilot-suggestion-002", { decision: "DISMISS", dismiss_reason_code: "DUPLICATE" }),
    ).rejects.toMatchObject({ code: "COPILOT_SUGGESTION_DECISION_CONFLICT", status: 409 });
  });

  it("DISMISS requires a reason code and returns no routing target", async () => {
    await expect(
      apiClient.createCopilotSuggestionDecision("copilot-suggestion-003", { decision: "DISMISS" }),
    ).rejects.toMatchObject({ code: "DISMISS_REASON_REQUIRED", status: 400 });

    const res = await apiClient.createCopilotSuggestionDecision("copilot-suggestion-003", {
      decision: "DISMISS",
      dismiss_reason_code: "INSUFFICIENT_EVIDENCE",
    });
    expect(res.new_state).toBe("DISMISSED");
    expect(res.routing_target).toBeNull();
    expect(res.decision_audit_note.dismiss_reason_code).toBe("INSUFFICIENT_EVIDENCE");
    expect(guardAllFalse(res.mutation_guard)).toBe(true);
  });

  it("deciding an already-decided (DISMISSED seed) suggestion returns 409", async () => {
    await expect(
      apiClient.createCopilotSuggestionDecision("copilot-suggestion-005", { decision: "ACCEPT" }),
    ).rejects.toBeInstanceOf(CopilotDecisionError);
  });
});
