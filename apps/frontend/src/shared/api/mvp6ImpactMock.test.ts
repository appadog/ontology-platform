import { describe, expect, it } from "vitest";
import { apiClient, GovernanceError } from "./client";
import {
  MVP6_GOVERNANCE_APPROVED_ID,
  MVP6_GOVERNANCE_IN_REVIEW_ID,
  MVP6_GOVERNANCE_OPEN_ID,
  MVP6_GOVERNANCE_WITHDRAWN_ID,
} from "../mocks/mvp6GovernanceFixtures";
import { MVP6_IMPACT_REF_CAP } from "../mocks/mvp6ImpactFixtures";
import type { ImpactSimulationMutationGuard } from "./types";

function guardAllFalse(guard: ImpactSimulationMutationGuard): boolean {
  return Object.values(guard).every((v) => v === false);
}

describe("MVP6.7 Impact Simulation mock contract", () => {
  it("returns a BREAKING report with a truncated candidate bucket + exact counts", async () => {
    const report = await apiClient.getChangeRequestImpactSimulation(MVP6_GOVERNANCE_APPROVED_ID);
    expect(report.change_request_id).toBe(MVP6_GOVERNANCE_APPROVED_ID);
    expect(report.summary.max_severity).toBe("BREAKING");
    expect(report.bounding.max_dependent_depth).toBe(2);
    expect(report.bounding.ref_cap).toBe(MVP6_IMPACT_REF_CAP);

    const item = report.items[0];
    // Dimension 1: direct target (depth 0) + bounded transitive dependents.
    expect(item.affected_ontology_elements[0].depth).toBe(0);
    expect(item.affected_ontology_elements[0].relation_to_target).toBe("DIRECT_TARGET");
    expect(item.affected_ontology_elements.some((e) => e.depth > 0)).toBe(true);
    // Dimension 2: exact count is never capped; refs are capped; truncated when hit.
    expect(item.dependent_candidates.count).toBe(128);
    expect(item.dependent_candidates.refs.length).toBeLessThanOrEqual(MVP6_IMPACT_REF_CAP);
    expect(item.dependent_candidates.truncated).toBe(true);
    // Dimension 3: published dependents drive BREAKING.
    expect(item.dependent_published.count).toBeGreaterThan(0);
    expect(item.severity).toBe("BREAKING");
    expect(item.severity_reason).toBe("DEPRECATE_MODIFY_WITH_PUBLISHED_DEPENDENTS");
    expect(report.bounding.any_dimension_truncated).toBe(true);
  });

  it("returns a HIGH report for a DEPRECATE with only candidate dependents", async () => {
    const report = await apiClient.getChangeRequestImpactSimulation(MVP6_GOVERNANCE_IN_REVIEW_ID);
    expect(report.summary.max_severity).toBe("HIGH");
    expect(report.items[0].dependent_published.count).toBe(0);
    expect(report.items[0].severity_reason).toBe("DEPRECATE_MODIFY_WITH_CANDIDATE_DEPENDENTS");
  });

  it("returns a benign NONE-tier report for an ADD with no dependents", async () => {
    const report = await apiClient.getChangeRequestImpactSimulation(MVP6_GOVERNANCE_OPEN_ID);
    const addItem = report.items.find((i) => i.change_type === "ADD");
    expect(addItem?.severity).toBe("NONE");
    expect(addItem?.dependent_candidates.count).toBe(0);
    expect(addItem?.dependent_published.count).toBe(0);
  });

  it("carries an ALL-FALSE ImpactSimulationMutationGuard on every response", async () => {
    for (const id of [MVP6_GOVERNANCE_APPROVED_ID, MVP6_GOVERNANCE_IN_REVIEW_ID, MVP6_GOVERNANCE_OPEN_ID]) {
      const report = await apiClient.getChangeRequestImpactSimulation(id);
      expect(guardAllFalse(report.mutation_guard)).toBe(true);
    }
  });

  it("falls back to an empty NONE report for a request without a bespoke fixture", async () => {
    const report = await apiClient.getChangeRequestImpactSimulation(MVP6_GOVERNANCE_WITHDRAWN_ID);
    expect(report.items).toHaveLength(0);
    expect(report.summary.max_severity).toBe("NONE");
    expect(guardAllFalse(report.mutation_guard)).toBe(true);
  });

  it("404s for a missing change request (mutates nothing)", async () => {
    await expect(apiClient.getChangeRequestImpactSimulation("ocr-does-not-exist")).rejects.toBeInstanceOf(
      GovernanceError,
    );
  });

  it("is deterministic/byte-stable across repeated reads (ignoring computed_at)", async () => {
    const a = await apiClient.getChangeRequestImpactSimulation(MVP6_GOVERNANCE_APPROVED_ID);
    const b = await apiClient.getChangeRequestImpactSimulation(MVP6_GOVERNANCE_APPROVED_ID);
    expect(JSON.stringify({ ...a, computed_at: null })).toBe(JSON.stringify({ ...b, computed_at: null }));
  });
});
