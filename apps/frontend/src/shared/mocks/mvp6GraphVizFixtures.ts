import {
  GraphVizClassCount,
  GraphVizEdge,
  GraphVizMutationGuard,
  GraphVizNode,
  GraphVizRelationCount,
  GraphVizResponse,
  GraphVizStatus,
  GraphVizSummary,
  GraphVizTooLargeState,
  PublishedGraphVersionRef,
} from "../api/types";

// Deterministic MVP6.12 Advanced Visualization fixtures. READ-ONLY whole-graph viz
// data + graph-level summary statistics over a project's PUBLISHED graph. Field/enum
// names match docs/api/openapi-mvp6-12-draft.json EXACTLY. The surface MUTATES
// NOTHING: no graph/version/snapshot write, no server-side layout, no layout
// persistence. Every response carries an ALL-FALSE 6-flag GraphVizMutationGuard.
//
// The fixture matrix is FROZEN by PM6-038 (Wave56 PM_REPORT §11.1/§11.2):
//   proj-viz-demo  = 12 nodes / 9 edges (within caps) -> READY, exact summary
//                    (density 0.068, components 3, largest 8, isolated 1, max_degree 3)
//   proj-viz-large = 210 nodes / 480 edges (over 150/300) -> TOO_LARGE_SUMMARY_ONLY
//                    (summary exact over the full graph; nodes[]/edges[] EMPTY)
//   proj-viz-empty = no current published version -> 200 EMPTY (zeroed summary)
// The demo graph is the DEFAULT for any resolvable project id (so the mock-backed UI
// on `project-corp-knowledge` renders READY); an id containing "viz-large" resolves
// to the too-large case and "viz-empty" to the no-version case. Summary is ALWAYS
// exact over the FULL graph (G1); status is set by full-graph totals vs caps.

/** ALL 6 FLAGS FALSE, on every response. MVP6.12 turns NO flag true, ever. */
export const allFalseGraphVizGuard: GraphVizMutationGuard = {
  published_graph_mutated: false,
  candidate_graph_mutated: false,
  ontology_draft_mutated: false,
  published_version_created: false,
  graph_snapshot_created: false,
  layout_persisted: false,
};

export const GRAPH_VIZ_BOUNDARY_NOTE =
  "read-only visualization - nothing changes the graph; publishing stays the separate MVP3 publish path.";

export const GRAPH_VIZ_NODE_CAP_MAX = 150;
export const GRAPH_VIZ_EDGE_CAP_MAX = 300;

export const CLASS_LABELS: Record<string, string> = {
  "class-person": "인물(Person)",
  "class-org": "조직(Organization)",
  "class-doc": "문서(Document)",
};

export const RELATION_LABELS: Record<string, string> = {
  "rel-employs": "고용(employs)",
  "rel-authored": "작성(authored)",
  "rel-partner": "파트너(partner)",
};

interface RawNode {
  id: string;
  published_entity_id: string;
  class_id: string;
  label: string;
  source_count: number;
  evidence_count: number;
  lineage_available: boolean;
}

interface RawEdge {
  id: string;
  published_relation_id: string;
  source_node_id: string;
  target_node_id: string;
  relation_id: string;
  label: string;
  evidence_count: number;
  lineage_available: boolean;
}

interface RawGraph {
  version_ref: PublishedGraphVersionRef | null;
  nodes: RawNode[];
  edges: RawEdge[];
}

// ---- proj-viz-demo (12 nodes / 9 edges) — the frozen PM §11.2 graph ----

const DEMO_VERSION_ID = "pgv-viz-demo-v1";

function demoGraph(): RawGraph {
  const spec: Array<[string, string]> = [
    ["n1", "class-person"],
    ["n2", "class-person"],
    ["n3", "class-person"],
    ["n4", "class-person"],
    ["n5", "class-person"],
    ["n6", "class-org"],
    ["n7", "class-org"],
    ["n8", "class-org"],
    ["n9", "class-org"],
    ["n10", "class-doc"],
    ["n11", "class-doc"],
    ["n12", "class-doc"],
  ];
  const nodes: RawNode[] = spec.map(([id, classId], index) => ({
    id,
    // Zero-padded so `published_entity_id asc` matches n1..n12 order.
    published_entity_id: `pe-${String(index + 1).padStart(2, "0")}`,
    class_id: classId,
    label: `${CLASS_LABELS[classId]} ${id}`,
    source_count: 1 + (index % 3),
    evidence_count: 1 + (index % 4),
    lineage_available: index % 2 === 0,
  }));

  const edgeSpec: Array<[string, string, string]> = [
    // employs (org -> person)
    ["n6", "n1", "rel-employs"],
    ["n6", "n2", "rel-employs"],
    ["n7", "n3", "rel-employs"],
    ["n8", "n4", "rel-employs"],
    // authored (person -> doc)
    ["n1", "n10", "rel-authored"],
    ["n2", "n11", "rel-authored"],
    ["n3", "n12", "rel-authored"],
    // partner (org -> org)
    ["n6", "n7", "rel-partner"],
    ["n8", "n9", "rel-partner"],
  ];
  const edges: RawEdge[] = edgeSpec.map(([source, target, relationId], index) => ({
    id: `e-${String(index + 1).padStart(2, "0")}`,
    published_relation_id: `pr-${String(index + 1).padStart(2, "0")}`,
    source_node_id: source,
    target_node_id: target,
    relation_id: relationId,
    label: RELATION_LABELS[relationId],
    evidence_count: 1 + (index % 3),
    lineage_available: index % 2 === 0,
  }));

  return {
    version_ref: {
      published_graph_version_id: DEMO_VERSION_ID,
      published_graph_version: 1,
      ontology_version_id: "otv-viz-demo",
      is_current: true,
      created_at: "2026-07-01T09:00:00Z",
    },
    nodes,
    edges,
  };
}

// ---- proj-viz-large (210 nodes / 480 edges) — over the 150/300 caps ----

const LARGE_VERSION_ID = "pgv-viz-large-v1";
const LARGE_CLASSES = ["class-person", "class-org", "class-doc"];
const LARGE_RELATIONS = ["rel-employs", "rel-authored", "rel-partner"];

function largeGraph(): RawGraph {
  const NODE_COUNT = 210;
  const EDGE_COUNT = 480;
  const nodes: RawNode[] = Array.from({ length: NODE_COUNT }, (_, i) => {
    const classId = LARGE_CLASSES[i % LARGE_CLASSES.length];
    return {
      id: `ln-${String(i + 1).padStart(3, "0")}`,
      published_entity_id: `lpe-${String(i + 1).padStart(3, "0")}`,
      class_id: classId,
      label: `${CLASS_LABELS[classId]} ${i + 1}`,
      source_count: 1 + (i % 3),
      evidence_count: 1 + (i % 4),
      lineage_available: i % 2 === 0,
    };
  });

  const edges: RawEdge[] = [];
  for (let j = 0; j < EDGE_COUNT; j += 1) {
    const s = j % NODE_COUNT;
    let t = (j * 7 + 3) % NODE_COUNT;
    if (t === s) t = (t + 1) % NODE_COUNT; // deterministic self-loop avoidance
    const relationId = LARGE_RELATIONS[j % LARGE_RELATIONS.length];
    edges.push({
      id: `le-${String(j + 1).padStart(3, "0")}`,
      published_relation_id: `lpr-${String(j + 1).padStart(3, "0")}`,
      source_node_id: nodes[s].id,
      target_node_id: nodes[t].id,
      relation_id: relationId,
      label: RELATION_LABELS[relationId],
      evidence_count: 1 + (j % 3),
      lineage_available: j % 2 === 0,
    });
  }

  return {
    version_ref: {
      published_graph_version_id: LARGE_VERSION_ID,
      published_graph_version: 1,
      ontology_version_id: "otv-viz-large",
      is_current: true,
      created_at: "2026-07-01T09:00:00Z",
    },
    nodes,
    edges,
  };
}

const EMPTY_GRAPH: RawGraph = { version_ref: null, nodes: [], edges: [] };

type FixtureKind = "DEMO" | "LARGE" | "EMPTY";

function resolveFixtureKind(projectId: string): FixtureKind {
  if (projectId.includes("viz-empty")) return "EMPTY";
  if (projectId.includes("viz-large")) return "LARGE";
  return "DEMO";
}

function fixtureFor(kind: FixtureKind): RawGraph {
  if (kind === "EMPTY") return EMPTY_GRAPH;
  if (kind === "LARGE") return largeGraph();
  return demoGraph();
}

/** True when the requested project id targets an unknown project (test lever). */
export function graphVizProjectMissing(projectId: string): boolean {
  return projectId.includes("viz-missing");
}

// ---- Summary + layout-hint computation (single O(V+E) pass) ----
//
// G3 formulas (deterministic):
//   density = E / (V*(V-1)) for V>1, else 0 (directed convention, no x2).
//   component_count / largest_component_size = connected components over the
//     UNDIRECTED projection of edges (isolated node = its own component of size 1).
//   isolated_node_count = nodes with undirected total degree 0.
//   max_degree = max undirected total degree (incident edges; multi-edges counted).

interface Computed {
  summary: GraphVizSummary;
  degreeById: Record<string, number>;
  componentById: Record<string, string>;
}

function sortedCounts<T extends { class_id?: string; relation_id?: string; count: number }>(
  map: Record<string, number>,
  key: "class_id" | "relation_id",
): T[] {
  // Buckets ordered by id asc (deterministic, byte-stable).
  return Object.keys(map)
    .sort()
    .map((id) => ({ [key]: id, count: map[id] }) as unknown as T);
}

function computeGraph(graph: RawGraph): Computed {
  const nodeIds = graph.nodes.map((n) => n.id);
  const parent: Record<string, string> = {};
  const degreeById: Record<string, number> = {};
  for (const id of nodeIds) {
    parent[id] = id;
    degreeById[id] = 0;
  }

  const find = (x: string): string => {
    let root = x;
    while (parent[root] !== root) root = parent[root];
    let cur = x;
    while (parent[cur] !== root) {
      const next = parent[cur];
      parent[cur] = root;
      cur = next;
    }
    return root;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  const classCounts: Record<string, number> = {};
  for (const node of graph.nodes) {
    classCounts[node.class_id] = (classCounts[node.class_id] ?? 0) + 1;
  }

  const relationCounts: Record<string, number> = {};
  for (const edge of graph.edges) {
    relationCounts[edge.relation_id] = (relationCounts[edge.relation_id] ?? 0) + 1;
    // Undirected degree: count every incident endpoint (multi-edges included).
    if (degreeById[edge.source_node_id] !== undefined) degreeById[edge.source_node_id] += 1;
    if (degreeById[edge.target_node_id] !== undefined) degreeById[edge.target_node_id] += 1;
    if (parent[edge.source_node_id] !== undefined && parent[edge.target_node_id] !== undefined) {
      union(edge.source_node_id, edge.target_node_id);
    }
  }

  // Deterministic component ids: assign in first-seen order over nodes sorted by
  // published_entity_id (byte-stable). component_id is a HINT, not a coordinate.
  const orderedNodes = [...graph.nodes].sort((a, b) =>
    a.published_entity_id < b.published_entity_id ? -1 : a.published_entity_id > b.published_entity_id ? 1 : 0,
  );
  const rootToComponent: Record<string, string> = {};
  const componentSizes: Record<string, number> = {};
  const componentById: Record<string, string> = {};
  let nextComponent = 0;
  for (const node of orderedNodes) {
    const root = find(node.id);
    if (rootToComponent[root] === undefined) {
      rootToComponent[root] = `c-${nextComponent}`;
      nextComponent += 1;
    }
    const componentId = rootToComponent[root];
    componentById[node.id] = componentId;
    componentSizes[componentId] = (componentSizes[componentId] ?? 0) + 1;
  }

  const v = graph.nodes.length;
  const e = graph.edges.length;
  const density = v > 1 ? e / (v * (v - 1)) : 0;
  const componentCount = Object.keys(componentSizes).length;
  const largestComponentSize = Object.values(componentSizes).reduce((max, size) => Math.max(max, size), 0);
  const isolatedNodeCount = nodeIds.filter((id) => degreeById[id] === 0).length;
  const maxDegree = nodeIds.reduce((max, id) => Math.max(max, degreeById[id]), 0);

  const summary: GraphVizSummary = {
    total_node_count: v,
    total_edge_count: e,
    node_counts_by_class: sortedCounts<GraphVizClassCount>(classCounts, "class_id"),
    edge_counts_by_relation: sortedCounts<GraphVizRelationCount>(relationCounts, "relation_id"),
    density,
    component_count: componentCount,
    largest_component_size: largestComponentSize,
    isolated_node_count: isolatedNodeCount,
    max_degree: maxDegree,
  };

  return { summary, degreeById, componentById };
}

function toVizNode(node: RawNode, degree: number, componentId: string): GraphVizNode {
  return {
    id: node.id,
    published_entity_id: node.published_entity_id,
    class_id: node.class_id,
    label: node.label,
    properties: {},
    quality_summary: {},
    source_count: node.source_count,
    evidence_count: node.evidence_count,
    lineage_available: node.lineage_available,
    degree,
    component_id: componentId,
  };
}

function toVizEdge(edge: RawEdge): GraphVizEdge {
  return {
    id: edge.id,
    published_relation_id: edge.published_relation_id,
    source_node_id: edge.source_node_id,
    target_node_id: edge.target_node_id,
    relation_id: edge.relation_id,
    label: edge.label,
    properties: {},
    quality_summary: {},
    evidence_count: edge.evidence_count,
    lineage_available: edge.lineage_available,
  };
}

/** Error signal the client maps to the frozen ApiError codes. */
export interface GraphVizFixtureError {
  code: "INVALID_CAP" | "PROJECT_NOT_FOUND" | "PUBLISHED_GRAPH_VERSION_NOT_FOUND";
  message: string;
  status: number;
}

function fail(error: GraphVizFixtureError): never {
  throw error;
}

/**
 * Deterministic read-only graph-viz projection. Byte-stable modulo generated_at
 * (set by the caller). Creates/mutates NOTHING; carries an all-false 6-flag guard.
 * Throws a GraphVizFixtureError for 400/404 conditions.
 */
export function buildGraphViz(
  projectId: string,
  params: {
    version_id?: string;
    node_cap?: number;
    edge_cap?: number;
    class_ids?: string[];
    relation_ids?: string[];
  } = {},
): Omit<GraphVizResponse, "generated_at"> {
  if (graphVizProjectMissing(projectId)) {
    fail({ code: "PROJECT_NOT_FOUND", message: "요청한 프로젝트를 찾을 수 없습니다.", status: 404 });
  }

  const nodeCap = params.node_cap ?? GRAPH_VIZ_NODE_CAP_MAX;
  const edgeCap = params.edge_cap ?? GRAPH_VIZ_EDGE_CAP_MAX;
  if (!Number.isInteger(nodeCap) || nodeCap < 1 || nodeCap > GRAPH_VIZ_NODE_CAP_MAX) {
    fail({ code: "INVALID_CAP", message: `node_cap must be in [1, ${GRAPH_VIZ_NODE_CAP_MAX}].`, status: 400 });
  }
  if (!Number.isInteger(edgeCap) || edgeCap < 1 || edgeCap > GRAPH_VIZ_EDGE_CAP_MAX) {
    fail({ code: "INVALID_CAP", message: `edge_cap must be in [1, ${GRAPH_VIZ_EDGE_CAP_MAX}].`, status: 400 });
  }

  const kind = resolveFixtureKind(projectId);
  const graph = fixtureFor(kind);

  // Explicitly-requested version that does not match -> 404 (G2). No current
  // published version + none requested -> 200 EMPTY (handled below).
  if (params.version_id) {
    const currentVersionId = graph.version_ref?.published_graph_version_id ?? null;
    if (params.version_id !== currentVersionId) {
      fail({
        code: "PUBLISHED_GRAPH_VERSION_NOT_FOUND",
        message: "요청한 게시 그래프 버전을 찾을 수 없습니다.",
        status: 404,
      });
    }
  }

  const { summary, degreeById, componentById } = computeGraph(graph);

  const totalNodes = summary.total_node_count;
  const totalEdges = summary.total_edge_count;

  let status: GraphVizStatus;
  if (totalNodes === 0) {
    status = "EMPTY";
  } else if (totalNodes > nodeCap || totalEdges > edgeCap) {
    status = "TOO_LARGE_SUMMARY_ONLY";
  } else {
    status = "READY";
  }

  let nodes: GraphVizNode[] = [];
  let edges: GraphVizEdge[] = [];
  let tooLarge: GraphVizTooLargeState | null = null;
  const truncated = status === "TOO_LARGE_SUMMARY_ONLY";

  if (status === "READY") {
    // G1 induced element-view: filters bound the element set only; summary/status
    // + each node's degree/component_id hints stay over the FULL, UNFILTERED graph.
    const classFilter = params.class_ids && params.class_ids.length > 0 ? new Set(params.class_ids) : null;
    const relationFilter =
      params.relation_ids && params.relation_ids.length > 0 ? new Set(params.relation_ids) : null;

    const orderedNodes = [...graph.nodes].sort((a, b) =>
      a.published_entity_id < b.published_entity_id ? -1 : a.published_entity_id > b.published_entity_id ? 1 : 0,
    );
    const includedNodeIds = new Set(
      orderedNodes.filter((n) => !classFilter || classFilter.has(n.class_id)).map((n) => n.id),
    );
    nodes = orderedNodes
      .filter((n) => includedNodeIds.has(n.id))
      .map((n) => toVizNode(n, degreeById[n.id] ?? 0, componentById[n.id] ?? "c-0"));

    edges = [...graph.edges]
      .sort((a, b) => {
        const keyA = `${a.source_node_id}|${a.target_node_id}|${a.published_relation_id}`;
        const keyB = `${b.source_node_id}|${b.target_node_id}|${b.published_relation_id}`;
        return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
      })
      .filter(
        (edge) =>
          (!relationFilter || relationFilter.has(edge.relation_id)) &&
          includedNodeIds.has(edge.source_node_id) &&
          includedNodeIds.has(edge.target_node_id),
      )
      .map(toVizEdge);
  } else if (status === "TOO_LARGE_SUMMARY_ONLY") {
    // Top classes/relations as read-only narrowing hints (deterministic order).
    const topClass = [...summary.node_counts_by_class].sort((a, b) => b.count - a.count)[0];
    const topRelation = [...summary.edge_counts_by_relation].sort((a, b) => b.count - a.count)[0];
    const suggested: string[] = [];
    if (topClass) suggested.push(`class_ids=${topClass.class_id}`);
    if (topRelation) suggested.push(`relation_ids=${topRelation.relation_id}`);
    tooLarge = {
      estimated_nodes: totalNodes,
      estimated_edges: totalEdges,
      node_budget: nodeCap,
      edge_budget: edgeCap,
      suggested_filters: suggested,
      message: `이 게시 그래프는 전체를 그리기에 너무 큽니다 (${totalNodes} 노드 / ${totalEdges} 엣지 · 예산 ${nodeCap} / ${edgeCap}). 요약 통계만 표시합니다 — 클래스/관계 필터로 범위를 좁혀 보세요.`,
    };
  }

  return {
    project_id: projectId,
    scope: "PUBLISHED",
    published_graph_version_ref: graph.version_ref,
    status,
    summary,
    node_cap: nodeCap,
    edge_cap: edgeCap,
    truncated,
    nodes,
    edges,
    too_large: tooLarge,
    mutation_guard: { ...allFalseGraphVizGuard },
    boundary_note: GRAPH_VIZ_BOUNDARY_NOTE,
  };
}
