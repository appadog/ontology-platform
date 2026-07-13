import { describe, expect, it } from "vitest";
import { apiClient, GraphVizError } from "./client";
import type { GraphVizMutationGuard, GraphVizResponse } from "./types";

// MVP6.12 Advanced Visualization mock contract. READ-ONLY whole-graph viz data +
// graph-level summary over a project's PUBLISHED graph. MUTATES NOTHING: no
// graph/version/snapshot write, no server-side layout, no layout persistence. Every
// response carries an ALL-FALSE 6-flag GraphVizMutationGuard. The summary is EXACT
// over the FULL graph in every status; layout HINTS (degree/component_id) only, NO
// x/y, NO hop. Field/enum shapes match docs/api/openapi-mvp6-12-draft.json. Fixture
// matrix + exact READY values are frozen by PM6-038 (Wave56 PM_REPORT §11.1/§11.2).

const DEMO_PROJECT = "proj-viz-demo";
const LARGE_PROJECT = "proj-viz-large";
const EMPTY_PROJECT = "proj-viz-empty";
const MISSING_PROJECT = "proj-viz-missing";

const GUARD_KEYS: (keyof GraphVizMutationGuard)[] = [
  "published_graph_mutated",
  "candidate_graph_mutated",
  "ontology_draft_mutated",
  "published_version_created",
  "graph_snapshot_created",
  "layout_persisted",
];

function expectGuardAllFalse(guard: GraphVizMutationGuard) {
  expect(Object.keys(guard)).toHaveLength(6);
  for (const key of GUARD_KEYS) {
    expect(guard[key]).toBe(false);
  }
}

/** Strip the ONLY field allowed to vary between two identical calls (generated_at). */
function stableClone(viz: GraphVizResponse) {
  const { generated_at: _g, ...rest } = viz;
  void _g;
  return rest;
}

describe("MVP6.12 Advanced Visualization mock contract", () => {
  it("READY: exact frozen summary + bounded elements + layout hints (no x/y/hop)", async () => {
    const viz = await apiClient.getProjectGraphViz(DEMO_PROJECT);
    expect(viz.status).toBe("READY");
    expect(viz.scope).toBe("PUBLISHED");
    expect(viz.truncated).toBe(false);
    expect(viz.too_large ?? null).toBeNull();
    expect(viz.node_cap).toBe(150);
    expect(viz.edge_cap).toBe(300);
    expect(viz.boundary_note).toContain("read-only");

    const s = viz.summary;
    expect(s.total_node_count).toBe(12);
    expect(s.total_edge_count).toBe(9);
    // By-class person5/org4/doc3, by-relation employs4/authored3/partner2 (ordered by id asc).
    expect(s.node_counts_by_class).toEqual([
      { class_id: "class-doc", count: 3 },
      { class_id: "class-org", count: 4 },
      { class_id: "class-person", count: 5 },
    ]);
    expect(s.edge_counts_by_relation).toEqual([
      { relation_id: "rel-authored", count: 3 },
      { relation_id: "rel-employs", count: 4 },
      { relation_id: "rel-partner", count: 2 },
    ]);
    // G3 frozen: density 9/132=0.068, components 3, largest 8, isolated 1, max_degree 3.
    expect(s.density.toFixed(3)).toBe("0.068");
    expect(s.component_count).toBe(3);
    expect(s.largest_component_size).toBe(8);
    expect(s.isolated_node_count).toBe(1);
    expect(s.max_degree).toBe(3);

    // Bounded whole-graph elements present (READY only).
    expect(viz.nodes).toHaveLength(12);
    expect(viz.edges).toHaveLength(9);
    // Layout HINTS present; NO x/y, NO hop on any node.
    for (const node of viz.nodes) {
      expect(typeof node.degree).toBe("number");
      expect(typeof node.component_id).toBe("string");
      expect(node).not.toHaveProperty("x");
      expect(node).not.toHaveProperty("y");
      expect(node).not.toHaveProperty("hop");
    }
    // node n6 (org) has the max degree 3.
    const n6 = viz.nodes.find((n) => n.id === "n6");
    expect(n6?.degree).toBe(3);

    expectGuardAllFalse(viz.mutation_guard);
  });

  it("READY is byte-stable modulo generated_at", async () => {
    const first = await apiClient.getProjectGraphViz(DEMO_PROJECT);
    const second = await apiClient.getProjectGraphViz(DEMO_PROJECT);
    expect(JSON.stringify(stableClone(first))).toBe(JSON.stringify(stableClone(second)));
  });

  it("filter hints bound the element view only; the summary stays over the full graph", async () => {
    const viz = await apiClient.getProjectGraphViz(DEMO_PROJECT, { class_ids: ["class-person"] });
    // Elements narrowed to person nodes; edges kept only if BOTH endpoints included.
    expect(viz.nodes.every((n) => n.class_id === "class-person")).toBe(true);
    expect(viz.nodes).toHaveLength(5);
    // employs (org->person) and authored (person->doc) drop an endpoint -> 0 edges.
    expect(viz.edges).toHaveLength(0);
    // Summary is UNCHANGED (always the full graph).
    expect(viz.summary.total_node_count).toBe(12);
    expect(viz.summary.total_edge_count).toBe(9);
    expect(viz.summary.component_count).toBe(3);
    expectGuardAllFalse(viz.mutation_guard);
  });

  it("TOO_LARGE_SUMMARY_ONLY: exact summary, empty elements, truncated, too_large populated", async () => {
    const viz = await apiClient.getProjectGraphViz(LARGE_PROJECT);
    expect(viz.status).toBe("TOO_LARGE_SUMMARY_ONLY");
    expect(viz.truncated).toBe(true);
    // Zero fabricated elements.
    expect(viz.nodes).toHaveLength(0);
    expect(viz.edges).toHaveLength(0);
    // Summary is exact over the FULL 210/480 graph.
    expect(viz.summary.total_node_count).toBe(210);
    expect(viz.summary.total_edge_count).toBe(480);
    expect(viz.too_large).not.toBeNull();
    expect(viz.too_large?.estimated_nodes).toBe(210);
    expect(viz.too_large?.estimated_edges).toBe(480);
    expect(viz.too_large?.node_budget).toBe(150);
    expect(viz.too_large?.edge_budget).toBe(300);
    expect(viz.too_large?.message).toBeTruthy();
    expectGuardAllFalse(viz.mutation_guard);
  });

  it("EMPTY: no current published version -> zeroed summary, null ref, empty elements", async () => {
    const viz = await apiClient.getProjectGraphViz(EMPTY_PROJECT);
    expect(viz.status).toBe("EMPTY");
    expect(viz.published_graph_version_ref ?? null).toBeNull();
    expect(viz.truncated).toBe(false);
    expect(viz.too_large ?? null).toBeNull();
    expect(viz.nodes).toHaveLength(0);
    expect(viz.edges).toHaveLength(0);
    expect(viz.summary.total_node_count).toBe(0);
    expect(viz.summary.total_edge_count).toBe(0);
    expect(viz.summary.density).toBe(0);
    expect(viz.summary.component_count).toBe(0);
    expect(viz.summary.node_counts_by_class).toHaveLength(0);
    expectGuardAllFalse(viz.mutation_guard);
  });

  it("400 INVALID_CAP for out-of-range node_cap / edge_cap", async () => {
    await expect(apiClient.getProjectGraphViz(DEMO_PROJECT, { node_cap: 0 })).rejects.toMatchObject({
      code: "INVALID_CAP",
      status: 400,
    });
    await expect(apiClient.getProjectGraphViz(DEMO_PROJECT, { edge_cap: 999 })).rejects.toBeInstanceOf(
      GraphVizError,
    );
  });

  it("404s an unknown project and an explicitly-requested unknown version", async () => {
    await expect(apiClient.getProjectGraphViz(MISSING_PROJECT)).rejects.toMatchObject({
      code: "PROJECT_NOT_FOUND",
      status: 404,
    });
    await expect(
      apiClient.getProjectGraphViz(DEMO_PROJECT, { version_id: "pgv-does-not-exist" }),
    ).rejects.toMatchObject({ code: "PUBLISHED_GRAPH_VERSION_NOT_FOUND", status: 404 });
  });

  it("a lowered in-range cap flips a within-cap graph to TOO_LARGE_SUMMARY_ONLY (elements omitted)", async () => {
    const viz = await apiClient.getProjectGraphViz(DEMO_PROJECT, { node_cap: 5 });
    expect(viz.status).toBe("TOO_LARGE_SUMMARY_ONLY");
    expect(viz.node_cap).toBe(5);
    expect(viz.nodes).toHaveLength(0);
    // Summary stays exact over the full 12/9 graph.
    expect(viz.summary.total_node_count).toBe(12);
    expectGuardAllFalse(viz.mutation_guard);
  });
});
