import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.7 Impact Simulation — actual-API smoke against the running backend.
// Exercises the frozen read-only impact P0 + acceptance invariants:
//   - propose (DRAFT) -> submit (OPEN) -> approve (APPROVED + QUEUED)
//   - GET .../impact-simulation: ImpactSimulationReport with 5 dimensions, a
//     summary rollup (max_severity + severity_counts), bounding (depth 2 + ref_cap),
//     and the ALL-FALSE ImpactSimulationMutationGuard (no flag ever true)
//   - idempotency: two GETs return byte-stable payloads (minus computed_at)
//   - read authz: VIEWER may read the report (no elevated role, unlike MVP6.6 apply)
// The backend is expected to be running (boot on SQLite like prior actual smokes).

const apiBaseUrl = process.env.MVP6_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const artifactDir = resolve(
  process.env.MVP6_IMPACT_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-impact-actual-smoke",
);
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");

const PROJECT_ID = process.env.MVP6_PROJECT_ID ?? "project-corp-knowledge";
const PROPOSER = process.env.MVP6_GOVERNANCE_PROPOSER ?? "gov-proposer";
const APPROVER = process.env.MVP6_GOVERNANCE_APPROVER ?? "gov-approver";
const VIEWER = process.env.MVP6_GOVERNANCE_VIEWER ?? "gov-viewer";
const ONTOLOGY_VERSION_ID = process.env.MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID ?? "ontology-v7";
const APPROVER_ROLE = "ONTOLOGY_MANAGER";
const VIEWER_ROLE = "VIEWER";

const GUARD_KEYS = [
  "ontology_draft_mutated",
  "published_graph_mutated",
  "candidate_graph_mutated",
  "prompt_version_mutated",
  "governance_state_mutated",
  "publish_job_started",
  "extraction_job_started",
  "evaluation_run_started",
];

await mkdir(artifactDir, { recursive: true });
const result = { apiBaseUrl, artifactDir, apiChecks: [], ids: {} };

function withActor(path, actor, role) {
  const sep = path.includes("?") ? "&" : "?";
  const roleSuffix = role ? `&actor_role=${encodeURIComponent(role)}` : "";
  return `${path}${sep}actor_id=${encodeURIComponent(actor)}${roleSuffix}`;
}

async function call(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "X-Dev-Auth": "mvp6-dev", ...options.headers },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  return { response, data, text };
}

async function ok(path, options) {
  const { response, data, text } = await call(path, options);
  if (!response.ok) {
    throw new Error(`Expected 2xx for ${path}, got ${response.status}: ${text}`);
  }
  return data;
}

function record(name, detail) {
  result.apiChecks.push({ name, ...detail });
}

function assertAllFalseGuard(guard) {
  if (!guard) throw new Error("Report must carry an ImpactSimulationMutationGuard.");
  for (const key of GUARD_KEYS) {
    if (guard[key] !== false) {
      throw new Error(`Impact guard must be all-false; ${key}=${guard[key]}`);
    }
  }
}

try {
  // 1. propose -> submit -> approve.
  const created = await ok(withActor(`/api/v1/projects/${PROJECT_ID}/ontology-change-requests`, PROPOSER), {
    method: "POST",
    body: JSON.stringify({
      title: "impact actual smoke",
      summary: "read-only impact simulation",
      // Use a seeded-resolvable ref (governance validates refs against the demo project).
      items: [{ target_kind: "PROPERTY", change_type: "MODIFY", ontology_property_id: "property-name", ontology_version_id: ONTOLOGY_VERSION_ID }],
    }),
  });
  const crId = created.change_request.id;
  result.ids.change_request_id = crId;
  await ok(withActor(`/api/v1/ontology-change-requests/${crId}/submit`, PROPOSER), { method: "POST", body: "{}" });
  await ok(withActor(`/api/v1/ontology-change-requests/${crId}/reviews`, APPROVER, APPROVER_ROLE), {
    method: "POST",
    body: JSON.stringify({ action: "APPROVE", reason: "impact smoke approval" }),
  });
  record("propose-submit-approve", { crId });

  // 2. GET impact-simulation: 5 dimensions + summary + bounding + all-false guard.
  const report = await ok(withActor(`/api/v1/ontology-change-requests/${crId}/impact-simulation`, APPROVER, APPROVER_ROLE));
  if (!Array.isArray(report.items)) throw new Error("Report.items must be an array (dimensions 1-4).");
  if (!report.summary || typeof report.summary.max_severity !== "string") {
    throw new Error("Report.summary.max_severity (dimension 5) is required.");
  }
  if (report.bounding?.max_dependent_depth !== 2) {
    throw new Error(`bounding.max_dependent_depth must be 2, got ${report.bounding?.max_dependent_depth}`);
  }
  if (typeof report.bounding?.ref_cap !== "number") throw new Error("bounding.ref_cap must be a number.");
  for (const item of report.items) {
    for (const dim of ["affected_ontology_elements", "affected_validations", "affected_quality_groups"]) {
      if (!Array.isArray(item[dim])) throw new Error(`ImpactItem.${dim} must be an array.`);
    }
    for (const bucket of [item.dependent_candidates, item.dependent_published]) {
      if (typeof bucket?.count !== "number" || !Array.isArray(bucket?.refs) || typeof bucket?.truncated !== "boolean") {
        throw new Error("DependentRefBucket must have exact count + refs[] + truncated.");
      }
      if (bucket.count < bucket.refs.length) throw new Error("Bucket count must be >= returned refs.");
    }
  }
  assertAllFalseGuard(report.mutation_guard);
  record("impact-report", {
    max_severity: report.summary.max_severity,
    items: report.items.length,
    ref_cap: report.bounding.ref_cap,
    guard_all_false: true,
  });

  // 3. Idempotency: two GETs are byte-stable (ignoring the advisory computed_at).
  const report2 = await ok(withActor(`/api/v1/ontology-change-requests/${crId}/impact-simulation`, APPROVER, APPROVER_ROLE));
  const strip = (r) => JSON.stringify({ ...r, computed_at: null });
  if (strip(report) !== strip(report2)) {
    throw new Error("Impact report must be deterministic/byte-stable across GETs.");
  }
  record("impact-idempotent", { byte_stable: true });

  // 4. Read authz: VIEWER may read the report (no elevated role required).
  const viewerReport = await ok(withActor(`/api/v1/ontology-change-requests/${crId}/impact-simulation`, VIEWER, VIEWER_ROLE));
  assertAllFalseGuard(viewerReport.mutation_guard);
  record("impact-viewer-read", { can_view: viewerReport.capabilities?.can_view });
} finally {
  const artifactPath = join(artifactDir, `mvp6-impact-actual-api-smoke-${runStamp}.json`);
  await writeFile(artifactPath, JSON.stringify(result, null, 2));
  result.artifactPath = artifactPath;
}

console.log(JSON.stringify({ status: "PASS", checks: result.apiChecks.length, ids: result.ids }, null, 2));
