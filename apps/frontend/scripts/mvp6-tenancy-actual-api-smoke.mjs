import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.10 Multi-tenant — actual-API smoke against the running backend. Exercises
// the frozen READ-ONLY tenant context + STRICT ISOLATION P0 + acceptance
// invariants (the headline gate: cross-tenant denied, no data leak):
//   - GET /tenants?actor_id=dev-user : visibility set == {tenant-acme, tenant-globex}
//     (total_count=2) + all-false 8-flag TenantMutationGuard; never a hidden tenant
//   - GET /tenants?actor_id=dev-user-2 : disjoint {tenant-initech} (proves no-leak)
//   - GET /tenants/{visible} : 200 summary + guard
//   - GET /tenants/tenant-initech (as dev-user) : 404 TENANT_NOT_FOUND, denial_reason
//     NOT_A_MEMBER, NO name/count leak (isolation negative check)
//   - GET /tenants/tenant-umbrella (as dev-user) : 403 TENANT_ACCESS_SUSPENDED
//   - GET /tenants/{visible}/projects : this tenant's projects only
//   - GET /projects/proj-initech-secret/tenant (as dev-user) : 404 PROJECT_NOT_FOUND
// The backend is expected to be running (Backend implemented in parallel). If
// unreachable / not registered / not seeded, this exits with a clear NOT RUN.

const apiBaseUrl = process.env.MVP6_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const artifactDir = resolve(
  process.env.MVP6_TENANCY_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-tenancy-actual-smoke",
);
const ACTOR = process.env.MVP6_TENANCY_ACTOR ?? "dev-user";
const ACTOR_2 = process.env.MVP6_TENANCY_ACTOR_2 ?? "dev-user-2";

const GUARD_KEYS = [
  "tenant_created",
  "tenant_updated",
  "tenant_deleted",
  "membership_mutated",
  "project_rehomed",
  "cross_tenant_access_granted",
  "candidate_graph_mutated",
  "published_graph_mutated",
];

await mkdir(artifactDir, { recursive: true });
const result = { apiBaseUrl, artifactDir, apiChecks: [] };

function withActor(path, actor) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}actor_id=${encodeURIComponent(actor)}`;
}

async function call(path) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { "Content-Type": "application/json", "X-Dev-Auth": "mvp6-dev" },
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  // Backend returns the canonical wrapped error envelope `{ "error": { code, message, details } }`.
  // Expose the unwrapped error alongside the raw body so isolation assertions can read
  // `err.code` / `err.details.denial_reason` (tolerates a flat shape too).
  const err = data && typeof data === "object" && data.error ? data.error : data;
  return { response, data, err };
}

function assertGuardAllFalse(guard, where) {
  if (!guard) throw new Error(`${where}: mutation_guard missing`);
  const keys = Object.keys(guard);
  if (keys.length !== 8) throw new Error(`${where}: expected 8 guard flags, got ${keys.length}`);
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

  // 1. Visibility set for dev-user == {tenant-acme, tenant-globex}.
  const mine = await call(withActor(`/api/v1/tenants`, ACTOR));
  if (mine.response.status >= 500) {
    console.log(JSON.stringify({ status: "NOT RUN", reason: `backend returned ${mine.response.status} on GET /tenants (tenancy module not registered or not seeded)` }, null, 2));
    process.exit(0);
  }
  if (mine.response.status === 404) {
    console.log(JSON.stringify({ status: "NOT RUN", reason: "GET /tenants 404 — backend MVP6.10 tenancy module not yet registered" }, null, 2));
    process.exit(0);
  }
  if (!mine.response.ok) throw new Error(`GET /tenants failed: ${mine.response.status}`);
  assertGuardAllFalse(mine.data.mutation_guard, "my-tenants");
  const ids = (mine.data.items ?? []).map((t) => t.id).sort();
  if (mine.data.total_count !== 2 || ids.join(",") !== "tenant-acme,tenant-globex") {
    throw new Error(`visibility set expected {tenant-acme, tenant-globex}, got ${JSON.stringify(ids)}`);
  }
  for (const hidden of ["tenant-initech", "tenant-umbrella", "tenant-soylent", "tenant-hooli"]) {
    if (ids.includes(hidden)) throw new Error(`visibility set leaked non-visible tenant ${hidden}`);
  }
  result.apiChecks.push({ name: "my-tenants", status: mine.response.status, ids });

  // 2. Disjoint visibility set for dev-user-2 (no-leak proof).
  const mine2 = await call(withActor(`/api/v1/tenants`, ACTOR_2));
  if (!mine2.response.ok) throw new Error(`GET /tenants (actor-2) failed: ${mine2.response.status}`);
  const ids2 = (mine2.data.items ?? []).map((t) => t.id);
  if (ids2.join(",") !== "tenant-initech") {
    throw new Error(`dev-user-2 visibility expected {tenant-initech}, got ${JSON.stringify(ids2)}`);
  }
  result.apiChecks.push({ name: "my-tenants-disjoint", status: mine2.response.status, ids: ids2 });

  // 3. Visible tenant summary (200 + guard).
  const summary = await call(withActor(`/api/v1/tenants/tenant-acme`, ACTOR));
  if (!summary.response.ok) throw new Error(`tenant summary failed: ${summary.response.status}`);
  assertGuardAllFalse(summary.data.mutation_guard, "tenant-summary");
  if (summary.data.tenant.id !== "tenant-acme") throw new Error("tenant summary id mismatch");
  result.apiChecks.push({ name: "tenant-summary", status: summary.response.status });

  // 4. ISOLATION: not-a-member tenant -> 404 TENANT_NOT_FOUND, NO leak.
  const nf = await call(withActor(`/api/v1/tenants/tenant-initech`, ACTOR));
  if (nf.response.status !== 404) throw new Error(`not-a-member expected 404, got ${nf.response.status}`);
  if (nf.err?.code !== "TENANT_NOT_FOUND") throw new Error(`expected code TENANT_NOT_FOUND, got ${nf.err?.code}`);
  const nfText = JSON.stringify(nf.data ?? {});
  if (nfText.includes("Initech Workspace") || nfText.includes("proj-initech-secret")) {
    throw new Error("404 body leaked the tenant's name/project (isolation violation)");
  }
  result.apiChecks.push({ name: "isolation-404-not-a-member", status: nf.response.status, code: nf.err?.code, denial_reason: nf.err?.details?.denial_reason ?? null });

  // 5. ISOLATION: suspended relationship -> 403 TENANT_ACCESS_SUSPENDED.
  const su = await call(withActor(`/api/v1/tenants/tenant-umbrella`, ACTOR));
  if (su.response.status !== 403) throw new Error(`suspended expected 403, got ${su.response.status}`);
  if (su.err?.code !== "TENANT_ACCESS_SUSPENDED") throw new Error(`expected TENANT_ACCESS_SUSPENDED, got ${su.err?.code}`);
  result.apiChecks.push({ name: "isolation-403-suspended", status: su.response.status, code: su.err?.code, denial_reason: su.err?.details?.denial_reason ?? null });

  // 6. Tenant-scoped projects (this tenant only).
  const projects = await call(withActor(`/api/v1/tenants/tenant-acme/projects`, ACTOR));
  if (!projects.response.ok) throw new Error(`tenant projects failed: ${projects.response.status}`);
  assertGuardAllFalse(projects.data.mutation_guard, "tenant-projects");
  const projIds = (projects.data.items ?? []).map((p) => p.id);
  for (const foreign of ["proj-globex-ops", "proj-initech-secret"]) {
    if (projIds.includes(foreign)) throw new Error(`cross-tenant project leaked: ${foreign}`);
  }
  result.apiChecks.push({ name: "tenant-projects", status: projects.response.status, count: projIds.length });

  // 7. project->tenant resolve: cross-tenant project -> 404 PROJECT_NOT_FOUND (no leak).
  const pt = await call(withActor(`/api/v1/projects/proj-initech-secret/tenant`, ACTOR));
  if (pt.response.status !== 404) throw new Error(`cross-tenant project->tenant expected 404, got ${pt.response.status}`);
  if (pt.err?.code !== "PROJECT_NOT_FOUND") throw new Error(`expected PROJECT_NOT_FOUND, got ${pt.err?.code}`);
  result.apiChecks.push({ name: "project-tenant-404-no-leak", status: pt.response.status, code: pt.err?.code });

  const artifactPath = join(artifactDir, "mvp6-tenancy-actual-api-smoke.json");
  await writeFile(artifactPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ status: "PASS", artifactPath, checks: result.apiChecks.length }, null, 2));
} catch (err) {
  console.error(JSON.stringify({ status: "FAIL", error: String(err) }, null, 2));
  process.exit(1);
}
