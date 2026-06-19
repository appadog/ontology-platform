import { describe, expect, it } from "vitest";
import { apiClient } from "./client";
import {
  GRAPH_EXPLORE_STATES,
  QUALITY_METRIC_GROUPS,
  SEARCH_RESULT_KINDS,
  VECTOR_ADAPTER_STATUSES,
} from "../mocks/mvp4Fixtures";

const projectId = "project-corp-knowledge";

describe("MVP4 mock contract", () => {
  it("covers frozen enum/state fixtures without adding a composite score", async () => {
    const quality = await apiClient.getQualityMetrics(projectId);
    const groups = quality.metric_groups.map((group) => group.group);

    expect(groups).toEqual(QUALITY_METRIC_GROUPS);
    expect(JSON.stringify(quality)).not.toMatch(/composite/i);

    for (const group of quality.metric_groups) {
      expect(group.metrics.length).toBeGreaterThan(0);

      for (const metric of group.metrics) {
        expect(metric.formula).toMatchObject({
          numerator: expect.any(String),
          denominator: expect.any(String),
          scope: expect.any(String),
          time_window: expect.any(String),
          breakdown_dimension: expect.any(String),
          drilldown_target: expect.any(String),
        });
        expect(metric.drilldown?.query).toMatchObject({
          published_graph_version_id: expect.any(String),
        });
        expect(metric.published_graph_version_ref?.published_graph_version_id).toEqual(expect.any(String));
      }
    }
    expect(
      quality.metric_groups.every((group) =>
        group.metrics.every((metric) => metric.formula.numerator.length > 0 && metric.formula.denominator.length > 0),
      ),
    ).toBe(true);
  });

  it("keeps search, vector, RAG, and graph acceptance-negative states visible", async () => {
    const search = await apiClient.searchProject(projectId, { query: "policy" });
    const noResults = await apiClient.searchProject(projectId, { query: "no-results" });
    const staleSearch = await apiClient.searchProject(projectId, { query: "stale index" });
    const vector = await apiClient.getVectorStatus(projectId);
    const ragAnswered = await apiClient.createRagAnswer(projectId, { question: "Which policy owns security evidence?" });
    const ragInsufficient = await apiClient.createRagAnswer(projectId, { question: "candidate only unsupported fact" });
    const readyGraph = await apiClient.explorePublishedGraph(projectId, { state: "READY" });
    const tooLargeGraph = await apiClient.explorePublishedGraph(projectId, { state: "SAFE_TOO_LARGE" });

    expect(search.groups.map((group) => group.kind)).toEqual(SEARCH_RESULT_KINDS);
    expect(noResults.total_count).toBe(0);
    expect(staleSearch.index_state).toBe("STALE");
    expect(VECTOR_ADAPTER_STATUSES).toContain(vector.status);
    expect(ragAnswered.state).toBe("ANSWERED");
    expect(ragAnswered.citations.length).toBeGreaterThan(0);
    expect(ragInsufficient.state).toBe("INSUFFICIENT_EVIDENCE");
    expect(JSON.stringify(ragAnswered.linked_published_facts)).not.toMatch(/candidate/i);
    expect(GRAPH_EXPLORE_STATES).toContain(readyGraph.state);
    expect(tooLargeGraph.state).toBe("SAFE_TOO_LARGE");
    expect(tooLargeGraph.too_large?.node_budget).toBe(150);
  });
});
