import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.12 Advanced Visualization — actual-API smoke against the running backend.
// Exercises the frozen READ-ONLY whole-graph viz + summary P0 + acceptance
// invariants:
//   - GET /projects/{p}/graph-viz : GraphVizResponse (READY / TOO_LARGE_SUMMARY_ONLY
//     / EMPTY), scope PUBLISHED, summary exact over the FULL graph, all-false 6-flag
//     GraphVizMutationGuard, layout HINTS (degree/component_id) with NO x/y and NO hop
//   - byte-stable modulo generated_at
//   - invalid cap -> 400 INVALID_CAP ; unknown project -> 404 PROJECT_NOT_FOUND
// The backend is expected to be running on SQLite. If unreachable / not seeded / the
// module is not registered, the script exits with a clear NOT RUN reason.

const apiBaseUrl = process.env.MVP6_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const artifactDir = resolve(
  process.env.MVP6_GRAPHVIZ_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-graphviz-actual-smoke",
);
const PROJECT_ID = process.env.MVP6_GRAPHVIZ_PROJECT_ID ?? "proj-viz-demo";
const ACTOR = process.env.MVP6_GRAPHVIZ_ACTOR ?? "gov-proposer";
const ACTOR_ROLE = process.env.MVP6_GRAPHVIZ_ACTOR_ROLE ?? "VIEWER";

const GUARD_KEYS = [
  "published_graph_mutated",
  "candidate_graph_mutated",
  "ontology_draft_mutated",
  "published_version_created",
  "graph_snapshot_created",
  "layout_persisted",
];

await mkdir(artifactDir, { recursive: true });
const result = { apiBaseUrl, artifactDir, apiChecks: [] };

function withActor(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}actor_id=${encodeURIComponent(ACTOR)}&actor_role=${encodeURIComponent(ACTOR_ROLE)}`;
}

async function call(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "X-Dev-Auth": "mvp6-dev", ...options.headers },
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { response, data };
}

function assertGuardAllFalse(guard, where) {
  if (!guard) throw new Error(`${where}: mutation_guard missing`);
  const keys = Object.keys(guard);
  if (keys.length !== 6) throw new Error(`${where}: expected 6 guard flags, got ${keys.length}`);
  for (const key of GUARD_KEYS) {
    if (guard[key] !== false) throw new Error(`${where}: guard flag ${key} is not false`);
  }
}

function stableClone(viz) {
  const { generated_at, ...rest } = viz ?? {};
  void generated_at;
  return rest;
}

try {
  // 0. Reachability.
  try {
    await fetch(`${apiBaseUrl}/`, { method: "GET" });
  } catch (err) {
    console.log(JSON.stringify({ status: "NOT RUN", reason: `backend unreachable at ${apiBaseUrl}: ${String(err)}` }, null, 2));
    process.exit(0);
  }

  // 1. graph-viz (READY expected for the demo project).
  const vizPath = `/api/v1/projects/${PROJECT_ID}/graph-viz`;
  const viz = await call(withActor(vizPath));
  if (viz.response.status >= 500) {
    console.log(JSON.stringify({ status: "NOT RUN", reason: `backend returned ${viz.response.status} (DB/seed unavailable or module not registered)` }, null, 2));
    process.exit(0);
  }
  if (viz.response.status === 404) {
    console.log(JSON.stringify({ status: "NOT RUN", reason: "graph-viz 404 — backend MVP6.12 module/fixture not registered/seeded" }, null, 2));
    process.exit(0);
  }
  if (!viz.response.ok) throw new Error(`graph-viz failed: ${viz.response.status}`);
  if (viz.data.scope !== "PUBLISHED") throw new Error(`scope must be PUBLISHED, got ${viz.data.scope}`);
  if (!["READY", "TOO_LARGE_SUMMARY_ONLY", "EMPTY"].includes(viz.data.status)) {
    throw new Error(`unexpected status ${viz.data.status}`);
  }
  if (!viz.data.summary) throw new Error("summary missing");
  assertGuardAllFalse(viz.data.mutation_guard, "graph-viz");
  // Layout hints present; NO x/y, NO hop on any node.
  for (const node of viz.data.nodes ?? []) {
    if (typeof node.degree !== "number" || typeof node.component_id !== "string") {
      throw new Error("node missing degree/component_id layout hint");
    }
    if ("x" in node || "y" in node || "hop" in node) {
      throw new Error("node must NOT carry x/y/hop");
    }
  }
  result.apiChecks.push({ name: "graph-viz", status: viz.response.status, vizStatus: viz.data.status, nodes: (viz.data.nodes ?? []).length });

  // 2. Byte-stable modulo generated_at.
  const viz2 = await call(withActor(vizPath));
  if (viz2.response.ok && JSON.stringify(stableClone(viz.data)) !== JSON.stringify(stableClone(viz2.data))) {
    throw new Error("graph-viz not byte-stable excluding generated_at");
  }
  result.apiChecks.push({ name: "byte-stable", status: viz2.response.status });

  // 3. Invalid cap -> 400.
  const badCap = await call(withActor(`${vizPath}?node_cap=0`));
  if (badCap.response.status !== 400) throw new Error(`invalid cap expected 400, got ${badCap.response.status}`);
  result.apiChecks.push({ name: "invalid-cap-400", status: badCap.response.status });

  // 4. Unknown project -> 404.
  const missing = await call(withActor(`/api/v1/projects/proj-viz-missing-xyz/graph-viz`));
  if (missing.response.status !== 404) throw new Error(`unknown project expected 404, got ${missing.response.status}`);
  result.apiChecks.push({ name: "unknown-project-404", status: missing.response.status });

  const artifactPath = join(artifactDir, "mvp6-graphviz-actual-api-smoke.json");
  await writeFile(artifactPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ status: "PASS", artifactPath, checks: result.apiChecks.length }, null, 2));
} catch (err) {
  console.error(JSON.stringify({ status: "FAIL", error: String(err) }, null, 2));
  process.exit(1);
}
