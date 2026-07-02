import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.5 Governance — actual-API smoke against the running backend. Exercises the
// frozen P0 loop + acceptance invariants:
//   - propose (DRAFT) -> add item -> submit (OPEN); submit with 0 items -> 409
//   - reviewer COMMENT on OPEN auto-advances to IN_REVIEW (G1 first-touch)
//   - reason-required 422 for APPROVE/REJECT/REQUEST_CHANGES
//   - approver APPROVE -> status=APPROVED, application_state=QUEUED,
//     change_auto_applied=false, all-false GovernanceMutationGuard
//   - proposer approving own request -> 403 SELF_APPROVAL_FORBIDDEN
//   - non-permitted actor approve -> 403 PERMISSION_DENIED
//   - decision on a terminal request -> 409 CHANGE_REQUEST_STATE_CONFLICT
//   - audit trail chronological ascending; APPLIED/SUPERSEDED never produced
// The backend is expected to be running (boot on SQLite like prior actual smokes).

const apiBaseUrl = process.env.MVP6_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const artifactDir = resolve(
  process.env.MVP6_GOVERNANCE_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-governance-actual-smoke",
);
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");

const PROPOSER = process.env.MVP6_GOVERNANCE_PROPOSER ?? "gov-proposer";
const APPROVER = process.env.MVP6_GOVERNANCE_APPROVER ?? "gov-approver";
const NON_PERMITTED = process.env.MVP6_GOVERNANCE_VIEWER ?? "mallory";
// The backend resolves change-item refs against a fixed set of known ids in the
// seeded demo project (apps/backend/app/modules/governance/service.py). Use an
// ADD item so no element ref is required; only the ontology_version_id must
// resolve (ontology-v7 / ontology-v1).
const ONTOLOGY_VERSION_ID = process.env.MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID ?? "ontology-v7";

// Backend gates APPROVE/REJECT on actor_role (default REVIEWER) AND segregation
// on actor_id. The smoke sends both explicitly so role gating + self-approval
// are exercised deterministically.
const REVIEWER_ROLE = "REVIEWER";
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
    throw new Error(`${options?.method ?? "GET"} ${path} failed: ${response.status} ${text}`);
  }
  return data;
}

async function expectStatus(path, options, status, expectedCode) {
  const { response, data, text } = await call(path, options);
  if (response.status !== status) {
    throw new Error(`Expected ${status} for ${options?.method ?? "GET"} ${path}, got ${response.status} ${text}`);
  }
  const code = data?.error?.code ?? data?.code ?? data?.detail?.code;
  if (expectedCode && code !== expectedCode) {
    throw new Error(`Expected error code ${expectedCode} for ${path}, got ${code} (${text})`);
  }
  return { status: response.status, code };
}

function assertAllFalseGuard(guard, where) {
  if (!guard) throw new Error(`Missing mutation_guard in ${where}.`);
  const offending = Object.entries(guard).filter(([, v]) => v !== false);
  if (offending.length) {
    throw new Error(`Mutation guard not all-false in ${where}: ${JSON.stringify(offending)}`);
  }
  if (guard.change_auto_applied !== false) {
    throw new Error(`change_auto_applied must be false in ${where}.`);
  }
}

// ---- 1. Project for the change-request family. ----
const project = await ok("/api/v1/projects", {
  method: "POST",
  body: JSON.stringify({ name: `MVP6.5 Governance Actual Smoke ${runStamp}`, description: "Wave42 governance actual smoke" }),
});
result.ids.project_id = project.id;

// ---- 2. Propose (DRAFT) with one item; submit -> OPEN. ----
const created = await ok(withActor(`/api/v1/projects/${project.id}/ontology-change-requests`, PROPOSER), {
  method: "POST",
  body: JSON.stringify({
    title: "Add risk_tier property",
    summary: "actual smoke proposal",
    ontology_version_id: ONTOLOGY_VERSION_ID,
    items: [{ target_kind: "PROPERTY", change_type: "ADD", ontology_version_id: ONTOLOGY_VERSION_ID, proposed_change: { name: "risk_tier" } }],
  }),
});
assertAllFalseGuard(created.mutation_guard, "propose");
if (created.change_request.status !== "DRAFT") throw new Error("Propose must yield a DRAFT.");
if (created.change_request.application_state !== "NOT_APPLICABLE") throw new Error("DRAFT application_state must be NOT_APPLICABLE.");
const crId = created.change_request.id;
result.ids.change_request_id = crId;
result.apiChecks.push({ name: "propose", status: created.change_request.status, guard_all_false: true });

const submitted = await ok(withActor(`/api/v1/ontology-change-requests/${crId}/submit`, PROPOSER), { method: "POST" });
if (submitted.change_request.status !== "OPEN") throw new Error("Submit must yield OPEN.");
assertAllFalseGuard(submitted.mutation_guard, "submit");
result.apiChecks.push({ name: "submit", status: submitted.change_request.status });

// ---- 3. Submit with 0 items -> 409 CHANGE_REQUEST_NO_ITEMS. ----
const empty = await ok(withActor(`/api/v1/projects/${project.id}/ontology-change-requests`, PROPOSER), {
  method: "POST",
  body: JSON.stringify({ title: "Empty request", summary: "no items" }),
});
const noItems = await expectStatus(
  withActor(`/api/v1/ontology-change-requests/${empty.change_request.id}/submit`, PROPOSER),
  { method: "POST" },
  409,
  "CHANGE_REQUEST_NO_ITEMS",
);
result.apiChecks.push({ name: "submit-no-items-409", ...noItems });

// ---- 4. G1 first-touch: reviewer COMMENT on OPEN auto-advances to IN_REVIEW. ----
const commented = await ok(withActor(`/api/v1/ontology-change-requests/${crId}/reviews`, "gov-reviewer", REVIEWER_ROLE), {
  method: "POST",
  body: JSON.stringify({ action: "COMMENT", reason: "first review touch" }),
});
if (commented.change_request.status !== "IN_REVIEW") throw new Error("COMMENT on OPEN must auto-advance to IN_REVIEW (G1).");
assertAllFalseGuard(commented.mutation_guard, "comment");
const auditAfterComment = await ok(`/api/v1/ontology-change-requests/${crId}/audit`);
const startedIdx = auditAfterComment.items.findIndex((e) => e.action === "REVIEW_STARTED");
const commentIdx = auditAfterComment.items.findIndex((e) => e.action === "COMMENT_ADDED");
if (startedIdx < 0 || startedIdx >= commentIdx) throw new Error("REVIEW_STARTED must be audited before COMMENT_ADDED (G1).");
result.apiChecks.push({ name: "g1-first-touch", status: commented.change_request.status, review_started_before_comment: true });

// ---- 5. reason-required 422 for APPROVE. ----
const reason422 = await expectStatus(
  withActor(`/api/v1/ontology-change-requests/${crId}/reviews`, APPROVER, APPROVER_ROLE),
  { method: "POST", body: JSON.stringify({ action: "APPROVE" }) },
  422,
  "REASON_REQUIRED",
);
result.apiChecks.push({ name: "approve-reason-required-422", ...reason422 });

// ---- 6. proposer approving own request -> 403 SELF_APPROVAL_FORBIDDEN.
//         The proposer carries an approver role, so role gating passes and the
//         segregation-of-duties check is what rejects it. ----
const selfApprove = await expectStatus(
  withActor(`/api/v1/ontology-change-requests/${crId}/reviews`, PROPOSER, APPROVER_ROLE),
  { method: "POST", body: JSON.stringify({ action: "APPROVE", reason: "self-approve attempt" }) },
  403,
  "SELF_APPROVAL_FORBIDDEN",
);
result.apiChecks.push({ name: "self-approval-403", ...selfApprove });

// ---- 7. non-permitted role approve -> 403 PERMISSION_DENIED. ----
const permDenied = await expectStatus(
  withActor(`/api/v1/ontology-change-requests/${crId}/reviews`, NON_PERMITTED, VIEWER_ROLE),
  { method: "POST", body: JSON.stringify({ action: "APPROVE", reason: "intruder" }) },
  403,
  "PERMISSION_DENIED",
);
result.apiChecks.push({ name: "non-permitted-403", ...permDenied });

// ---- 8. approver APPROVE -> APPROVED + QUEUED, nothing applied. ----
const approved = await ok(withActor(`/api/v1/ontology-change-requests/${crId}/reviews`, APPROVER, APPROVER_ROLE), {
  method: "POST",
  body: JSON.stringify({ action: "APPROVE", reason: "queued approval justification" }),
});
if (approved.change_request.status !== "APPROVED") throw new Error("APPROVE must yield APPROVED.");
if (approved.change_request.application_state !== "QUEUED") throw new Error("APPROVE must set application_state=QUEUED.");
assertAllFalseGuard(approved.mutation_guard, "approve");
if (approved.review_decision?.resulting_application_state !== "QUEUED") throw new Error("Review response must echo resulting_application_state=QUEUED.");
result.apiChecks.push({ name: "approve-queued-not-applied", status: approved.change_request.status, application_state: approved.change_request.application_state, change_auto_applied: approved.mutation_guard.change_auto_applied });

// ---- 9. decision on a terminal (APPROVED) request -> 409. ----
const terminal = await expectStatus(
  withActor(`/api/v1/ontology-change-requests/${crId}/reviews`, APPROVER, APPROVER_ROLE),
  { method: "POST", body: JSON.stringify({ action: "REJECT", reason: "too late" }) },
  409,
  "CHANGE_REQUEST_STATE_CONFLICT",
);
result.apiChecks.push({ name: "terminal-decision-409", ...terminal });

// ---- 10. audit ascending; APPLIED/SUPERSEDED never produced. ----
const audit = await ok(`/api/v1/ontology-change-requests/${crId}/audit`);
const times = audit.items.map((e) => e.created_at);
const sorted = [...times].sort((a, b) => a.localeCompare(b));
if (JSON.stringify(times) !== JSON.stringify(sorted)) throw new Error("Audit must be chronological ascending (G4).");
const detail = await ok(`/api/v1/ontology-change-requests/${crId}`);
if (["APPLIED", "SUPERSEDED"].includes(detail.change_request.application_state)) {
  throw new Error("APPLIED/SUPERSEDED must never be produced in P0.");
}
result.apiChecks.push({ name: "audit-ascending-and-no-applied", audit_count: audit.items.length, application_state: detail.change_request.application_state });

const artifactPath = join(artifactDir, "mvp6-governance-actual-api-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({ status: "PASS", artifactPath, apiCheckCount: result.apiChecks.length, ids: result.ids }, null, 2));
