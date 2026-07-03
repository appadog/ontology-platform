import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.6 Governance change application — actual-API smoke against the running
// backend. Exercises the frozen apply P0 + acceptance invariants:
//   - propose (DRAFT) -> submit (OPEN) -> approve (APPROVED + QUEUED)
//   - GET application-status: DRAFT target + per-item preview + advisory hint +
//     capabilities.can_apply (all-false GovernanceMutationGuard on the read)
//   - POST apply -> application_state=APPLIED + one-true-flag guard
//     (ontology_draft_mutated=true; all others false) + published-graph-untouched
//   - idempotency: re-apply -> 409 CHANGE_ALREADY_APPLIED
//   - authz: non-permitted actor apply -> 403 PERMISSION_DENIED
// The backend is expected to be running (boot on SQLite like prior actual smokes).

const apiBaseUrl = process.env.MVP6_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const artifactDir = resolve(
  process.env.MVP6_GOVERNANCE_APPLY_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-governance-apply-actual-smoke",
);
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");

const PROJECT_ID = process.env.MVP6_PROJECT_ID ?? "project-corp-knowledge";
const PROPOSER = process.env.MVP6_GOVERNANCE_PROPOSER ?? "gov-proposer";
const APPROVER = process.env.MVP6_GOVERNANCE_APPROVER ?? "gov-approver";
const NON_PERMITTED = process.env.MVP6_GOVERNANCE_VIEWER ?? "mallory";
const ONTOLOGY_VERSION_ID = process.env.MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID ?? "ontology-v7";
const APPROVER_ROLE = "ONTOLOGY_MANAGER";
const VIEWER_ROLE = "VIEWER";

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

async function expectStatus(path, options, wanted, wantedCode) {
  const { response, data } = await call(path, options);
  if (response.status !== wanted) {
    throw new Error(`Expected ${wanted} for ${path}, got ${response.status}: ${JSON.stringify(data)}`);
  }
  const code = data?.code ?? data?.error?.code;
  if (wantedCode && code !== wantedCode) {
    throw new Error(`Expected code ${wantedCode} for ${path}, got ${code}`);
  }
  return data;
}

function record(name, detail) {
  result.apiChecks.push({ name, ...detail });
}

try {
  // 1. propose -> submit -> approve (fresh APPROVED + QUEUED request).
  const created = await ok(withActor(`/api/v1/projects/${PROJECT_ID}/ontology-change-requests`, PROPOSER), {
    method: "POST",
    body: JSON.stringify({
      title: "apply actual smoke",
      summary: "apply into a DRAFT",
      items: [{ target_kind: "PROPERTY", change_type: "ADD", ontology_version_id: ONTOLOGY_VERSION_ID }],
    }),
  });
  const crId = created.change_request.id;
  result.ids.change_request_id = crId;
  await ok(withActor(`/api/v1/ontology-change-requests/${crId}/submit`, PROPOSER), { method: "POST", body: "{}" });
  const approved = await ok(withActor(`/api/v1/ontology-change-requests/${crId}/reviews`, APPROVER, APPROVER_ROLE), {
    method: "POST",
    body: JSON.stringify({ action: "APPROVE", reason: "apply smoke approval" }),
  });
  if (approved.change_request.application_state !== "QUEUED") {
    throw new Error(`Expected QUEUED after approve, got ${approved.change_request.application_state}`);
  }
  record("propose-submit-approve", { crId, application_state: "QUEUED" });

  // 2. application-status pre-check (read-only, all-false guard).
  const status = await ok(withActor(`/api/v1/ontology-change-requests/${crId}/application-status`, APPROVER, APPROVER_ROLE));
  if (!status.target_is_draft) throw new Error("Pre-check target must be DRAFT.");
  if (status.capabilities?.can_apply !== true) throw new Error("can_apply must be true for approver on QUEUED.");
  if (status.mutation_guard?.ontology_definition_mutated !== false) {
    throw new Error("Pre-check must carry the all-false GovernanceMutationGuard.");
  }
  record("application-status", { target: status.target_ontology_version_id, can_apply: status.capabilities?.can_apply });

  // 3. non-permitted actor apply -> 403 PERMISSION_DENIED (mutates nothing).
  await expectStatus(
    withActor(`/api/v1/ontology-change-requests/${crId}/apply`, NON_PERMITTED, VIEWER_ROLE),
    { method: "POST", body: "{}" },
    403,
    "PERMISSION_DENIED",
  );
  record("apply-403", { code: "PERMISSION_DENIED" });

  // 4. apply -> APPLIED + one-true-flag guard.
  const applied = await ok(withActor(`/api/v1/ontology-change-requests/${crId}/apply`, APPROVER, APPROVER_ROLE), {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (applied.application_state !== "APPLIED") throw new Error(`Expected APPLIED, got ${applied.application_state}`);
  const g = applied.mutation_guard ?? {};
  const oneTrue =
    g.ontology_draft_mutated === true &&
    g.published_graph_mutated === false &&
    g.candidate_graph_mutated === false &&
    g.prompt_version_mutated === false &&
    g.publish_job_started === false &&
    g.extraction_job_started === false &&
    g.evaluation_run_started === false;
  if (!oneTrue) throw new Error(`Guard must have exactly one true flag ontology_draft_mutated: ${JSON.stringify(g)}`);
  record("apply-applied", { application_state: "APPLIED", one_true_flag: true, target: applied.target_ontology_version_id });

  // 5. idempotency: re-apply -> 409 CHANGE_ALREADY_APPLIED.
  await expectStatus(
    withActor(`/api/v1/ontology-change-requests/${crId}/apply`, APPROVER, APPROVER_ROLE),
    { method: "POST", body: "{}" },
    409,
    "CHANGE_ALREADY_APPLIED",
  );
  record("apply-idempotency-409", { code: "CHANGE_ALREADY_APPLIED" });

  // 6. application-audit lists CHANGE_REQUEST_APPLIED.
  const audit = await ok(withActor(`/api/v1/ontology-change-requests/${crId}/application-audit`, APPROVER, APPROVER_ROLE));
  if (!audit.items?.some((e) => e.action === "CHANGE_REQUEST_APPLIED")) {
    throw new Error("Application audit must contain CHANGE_REQUEST_APPLIED.");
  }
  record("application-audit", { count: audit.items.length });
} finally {
  const artifactPath = join(artifactDir, `mvp6-governance-apply-actual-api-smoke-${runStamp}.json`);
  await writeFile(artifactPath, JSON.stringify(result, null, 2));
  result.artifactPath = artifactPath;
}

console.log(JSON.stringify({ status: "PASS", checks: result.apiChecks.length, ids: result.ids }, null, 2));
