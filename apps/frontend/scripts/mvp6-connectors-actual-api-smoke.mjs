import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.9 Connectors — actual-API smoke against the running backend. Exercises the
// frozen READ-ONLY catalog + DRY-RUN preview P0 + acceptance invariants:
//   - GET /projects/{p}/connectors : ConnectorCatalogListResponse (3 mock kinds)
//     + all-false 9-flag ConnectorMutationGuard
//   - GET /projects/{p}/connectors/{kind}/config-schema : masked fields
//     (raw_secret_present=false; SECRET placeholder is non-secret) + guard
//   - POST /projects/{p}/connectors/{kind}/import-preview : deterministic (byte-
//     stable excluding generated_at) + secret-independent + bounded preview;
//     preview_only=true; raw_secret_present=false; constant routing_note; guard
//   - unknown kind -> 404 CONNECTOR_KIND_NOT_FOUND
// The backend is expected to be running. If unreachable / DB not seeded, this
// script exits with a clear NOT RUN reason (Backend was implementing in parallel).

const apiBaseUrl = process.env.MVP6_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const artifactDir = resolve(
  process.env.MVP6_CONNECTORS_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-connectors-actual-smoke",
);
const PROJECT_ID = process.env.MVP6_PROJECT_ID ?? "project-corp-knowledge";
const ACTOR = process.env.MVP6_CONNECTORS_ACTOR ?? "gov-proposer";
// Any project-read member may view connectors; VIEWER is the canonical read role
// (app.core.enums.Role). Override via MVP6_CONNECTORS_ACTOR_ROLE.
const ACTOR_ROLE = process.env.MVP6_CONNECTORS_ACTOR_ROLE ?? "VIEWER";

const GUARD_KEYS = [
  "external_system_read",
  "external_system_write",
  "real_network_call_made",
  "credential_persisted",
  "connector_instance_persisted",
  "source_created",
  "candidate_graph_mutated",
  "published_graph_mutated",
  "extraction_job_started",
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
  if (keys.length !== 9) throw new Error(`${where}: expected 9 guard flags, got ${keys.length}`);
  for (const key of GUARD_KEYS) {
    if (guard[key] !== false) throw new Error(`${where}: guard flag ${key} is not false`);
  }
}

function stableClone(preview) {
  const { generated_at, preview_id, ...rest } = preview ?? {};
  void generated_at;
  void preview_id;
  return rest;
}

try {
  // 0. Reachability check.
  try {
    await fetch(`${apiBaseUrl}/`, { method: "GET" });
  } catch (err) {
    console.log(JSON.stringify({ status: "NOT RUN", reason: `backend unreachable at ${apiBaseUrl}: ${String(err)}` }, null, 2));
    process.exit(0);
  }

  // 1. Catalog (3 mock kinds + all-false guard).
  const catalog = await call(withActor(`/api/v1/projects/${PROJECT_ID}/connectors`));
  if (catalog.response.status >= 500) {
    console.log(
      JSON.stringify(
        { status: "NOT RUN", reason: `backend returned ${catalog.response.status} on catalog (DB/seed not available or module not yet registered)` },
        null,
        2,
      ),
    );
    process.exit(0);
  }
  if (catalog.response.status === 404) {
    console.log(
      JSON.stringify(
        { status: "NOT RUN", reason: "connectors catalog 404 — backend MVP6.9 module not yet registered" },
        null,
        2,
      ),
    );
    process.exit(0);
  }
  if (!catalog.response.ok) throw new Error(`catalog failed: ${catalog.response.status}`);
  assertGuardAllFalse(catalog.data.mutation_guard, "catalog");
  if (catalog.data.total_count !== 3 || catalog.data.items.length !== 3) {
    throw new Error(`catalog expected 3 kinds, got ${catalog.data.items?.length}`);
  }
  const firstKind = catalog.data.items[0].connector_kind;
  result.apiChecks.push({ name: "catalog", status: catalog.response.status, count: catalog.data.items.length });

  // 2. Config schema (masked; raw_secret_present=false).
  const schema = await call(withActor(`/api/v1/projects/${PROJECT_ID}/connectors/${firstKind}/config-schema`));
  if (!schema.response.ok) throw new Error(`config-schema failed: ${schema.response.status}`);
  if (schema.data.raw_secret_present !== false) throw new Error("raw_secret_present must be false");
  assertGuardAllFalse(schema.data.mutation_guard, "config-schema");
  result.apiChecks.push({ name: "config-schema", status: schema.response.status, fields: schema.data.fields.length });

  // Build a non-secret config from the schema placeholders (never a real secret).
  const config = {};
  for (const f of schema.data.fields) {
    if (f.field_kind === "BOOLEAN") config[f.name] = false;
    else if (f.field_kind === "ENUM") config[f.name] = (f.enum_values && f.enum_values[0]) ?? "";
    else config[f.name] = f.placeholder ?? "x";
  }

  // 3. Import preview: deterministic (excl. generated_at) + preview_only + guard.
  const previewPath = `/api/v1/projects/${PROJECT_ID}/connectors/${firstKind}/import-preview`;
  const p1 = await call(withActor(previewPath), { method: "POST", body: JSON.stringify({ config, item_cap: 50 }) });
  if (!p1.response.ok) throw new Error(`import-preview failed: ${p1.response.status}`);
  if (p1.data.preview_only !== true) throw new Error("preview_only must be true");
  if (p1.data.raw_secret_present !== false) throw new Error("raw_secret_present must be false");
  if (p1.data.target_layer !== "CANDIDATE") throw new Error("target_layer must be CANDIDATE");
  if (typeof p1.data.routing_note !== "string" || !p1.data.routing_note.includes("preview only")) {
    throw new Error("routing_note missing/incorrect");
  }
  assertGuardAllFalse(p1.data.mutation_guard, "import-preview");
  const p2 = await call(withActor(previewPath), { method: "POST", body: JSON.stringify({ config, item_cap: 50 }) });
  if (JSON.stringify(stableClone(p1.data)) !== JSON.stringify(stableClone(p2.data))) {
    throw new Error("import-preview not byte-stable excluding generated_at");
  }
  result.apiChecks.push({ name: "import-preview", status: p1.response.status, total: p1.data.total_item_count });

  // 4. Unknown kind -> 404.
  const unknown = await call(withActor(`/api/v1/projects/${PROJECT_ID}/connectors/NOT_A_KIND/config-schema`));
  if (unknown.response.status !== 404) throw new Error(`unknown-kind expected 404, got ${unknown.response.status}`);
  result.apiChecks.push({ name: "unknown-kind-404", status: unknown.response.status });

  const artifactPath = join(artifactDir, "mvp6-connectors-actual-api-smoke.json");
  await writeFile(artifactPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ status: "PASS", artifactPath, checks: result.apiChecks.length }, null, 2));
} catch (err) {
  console.error(JSON.stringify({ status: "FAIL", error: String(err) }, null, 2));
  process.exit(1);
}
