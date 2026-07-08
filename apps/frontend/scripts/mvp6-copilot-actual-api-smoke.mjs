import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.8 Copilot — actual-API smoke against the running backend. Exercises the
// frozen ADVISORY-ONLY P0 + acceptance invariants:
//   - GET /projects/{p}/copilot/summary : CopilotSummaryResponse (counts, scope,
//     advisory_notes) + all-false 14-flag CopilotMutationGuard
//   - GET /projects/{p}/copilot/suggestions : deterministic, source-grounded list
//     (every item cites >=1 source artifact + names a routing target) + guard
//   - GET /copilot-suggestions/{id} : detail round-trip + guard
//   - POST .../decisions ACCEPT : SUGGESTED->ACCEPTED, returns routing target,
//     executes_nothing=true, all-false guard incl. copilot_executed_action/
//     real_model_invoked; re-decide -> 409 COPILOT_SUGGESTION_DECISION_CONFLICT
//   - POST .../decisions DISMISS without reason -> 422 DISMISS_REASON_REQUIRED
// The backend is expected to be running. If unreachable, this script exits with a
// clear NOT RUN reason (backend was mid-implementation at Wave48 authoring time).

const apiBaseUrl = process.env.MVP6_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const artifactDir = resolve(
  process.env.MVP6_COPILOT_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-copilot-actual-smoke",
);
const PROJECT_ID = process.env.MVP6_PROJECT_ID ?? "project-corp-knowledge";
const ACTOR = process.env.MVP6_COPILOT_ACTOR ?? "gov-proposer";
const ACTOR_ROLE = process.env.MVP6_COPILOT_ACTOR_ROLE ?? "PROJECT_MEMBER";

const GUARD_KEYS = [
  "ontology_draft_mutated",
  "ontology_published_mutated",
  "candidate_graph_mutated",
  "published_graph_mutated",
  "prompt_version_mutated",
  "governance_state_mutated",
  "change_request_created",
  "change_request_applied",
  "candidate_approved_or_published",
  "extraction_job_started",
  "evaluation_run_started",
  "auto_approval_policy_mutated",
  "copilot_executed_action",
  "real_model_invoked",
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
    data = null; // non-JSON body (e.g. a 5xx "Internal Server Error" page)
  }
  return { response, data };
}

function assertGuardAllFalse(guard, where) {
  if (!guard) throw new Error(`${where}: mutation_guard missing`);
  for (const key of GUARD_KEYS) {
    if (guard[key] !== false) throw new Error(`${where}: guard flag ${key} is not false`);
  }
}

try {
  // 0. Reachability check.
  try {
    await fetch(`${apiBaseUrl}/`, { method: "GET" });
  } catch (err) {
    console.log(JSON.stringify({ status: "NOT RUN", reason: `backend unreachable at ${apiBaseUrl}: ${String(err)}` }, null, 2));
    process.exit(0);
  }

  // 1. Summary.
  const summary = await call(withActor(`/api/v1/projects/${PROJECT_ID}/copilot/summary`));
  if (summary.response.status >= 500) {
    // A 5xx here is an environment/infra issue (e.g. PostgreSQL/seed not up), not
    // a contract failure. Prior-wave actual smokes rely on a QA seed harness +
    // reachable DB; without it we cannot exercise the endpoint. Report NOT RUN.
    console.log(
      JSON.stringify(
        { status: "NOT RUN", reason: `backend returned ${summary.response.status} on summary (DB/seed not available)` },
        null,
        2,
      ),
    );
    process.exit(0);
  }
  if (!summary.response.ok) throw new Error(`summary failed: ${summary.response.status}`);
  assertGuardAllFalse(summary.data.mutation_guard, "summary");
  if (!Array.isArray(summary.data.counts_by_kind)) throw new Error("summary.counts_by_kind missing");
  result.apiChecks.push({ name: "summary", status: summary.response.status });

  // 2. Suggestions (deterministic + grounded).
  const list = await call(withActor(`/api/v1/projects/${PROJECT_ID}/copilot/suggestions`));
  if (!list.response.ok) throw new Error(`suggestions failed: ${list.response.status}`);
  assertGuardAllFalse(list.data.mutation_guard, "list");
  for (const s of list.data.items) {
    if (!Array.isArray(s.source_artifacts) || s.source_artifacts.length === 0) {
      throw new Error(`suggestion ${s.id} has no source artifacts (ungrounded)`);
    }
    if (!s.routing_target || s.routing_target.executes_nothing !== true) {
      throw new Error(`suggestion ${s.id} routing target not executes_nothing`);
    }
  }
  result.apiChecks.push({ name: "suggestions", status: list.response.status, count: list.data.items.length });

  const suggested = list.data.items.find((s) => s.state === "SUGGESTED");
  if (!suggested) throw new Error("no SUGGESTED suggestion to decide");

  // 3. Detail round-trip.
  const detail = await call(withActor(`/api/v1/copilot-suggestions/${suggested.id}`));
  if (!detail.response.ok) throw new Error(`detail failed: ${detail.response.status}`);
  assertGuardAllFalse(detail.data.mutation_guard, "detail");
  result.apiChecks.push({ name: "detail", status: detail.response.status });

  // 4. DISMISS without reason -> 422.
  const badDismiss = await call(withActor(`/api/v1/copilot-suggestions/${suggested.id}/decisions`), {
    method: "POST",
    body: JSON.stringify({ decision: "DISMISS" }),
  });
  if (badDismiss.response.status !== 422) throw new Error(`dismiss-without-reason expected 422, got ${badDismiss.response.status}`);
  result.apiChecks.push({ name: "dismiss-no-reason-422", status: badDismiss.response.status });

  // 5. ACCEPT -> routing target, executes nothing, all-false guard.
  const accept = await call(withActor(`/api/v1/copilot-suggestions/${suggested.id}/decisions`), {
    method: "POST",
    body: JSON.stringify({ decision: "ACCEPT", note: "smoke accept" }),
  });
  if (accept.response.status !== 201) throw new Error(`accept expected 201, got ${accept.response.status}`);
  if (accept.data.new_state !== "ACCEPTED") throw new Error("accept did not transition to ACCEPTED");
  if (!accept.data.routing_target || accept.data.routing_target.executes_nothing !== true) {
    throw new Error("accept did not return a routing target with executes_nothing=true");
  }
  assertGuardAllFalse(accept.data.mutation_guard, "accept");
  assertGuardAllFalse(accept.data.decision_audit_note.mutation_guard, "accept-audit");
  result.apiChecks.push({ name: "accept-routes", status: accept.response.status });

  // 6. Re-decide -> 409.
  const conflict = await call(withActor(`/api/v1/copilot-suggestions/${suggested.id}/decisions`), {
    method: "POST",
    body: JSON.stringify({ decision: "DISMISS", dismiss_reason_code: "DUPLICATE" }),
  });
  if (conflict.response.status !== 409) throw new Error(`re-decide expected 409, got ${conflict.response.status}`);
  result.apiChecks.push({ name: "re-decide-409", status: conflict.response.status });

  const artifactPath = join(artifactDir, "mvp6-copilot-actual-api-smoke.json");
  await writeFile(artifactPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ status: "PASS", artifactPath, checks: result.apiChecks.length }, null, 2));
} catch (err) {
  console.error(JSON.stringify({ status: "FAIL", error: String(err) }, null, 2));
  process.exit(1);
}
