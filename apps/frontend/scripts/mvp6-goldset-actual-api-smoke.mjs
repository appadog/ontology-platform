import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.4 Gold Set Authoring — actual-API smoke against the running backend.
// Exercises the frozen P0 loop and the acceptance invariants:
//   - open authoring overview (owner caps + all-false mutation guard)
//   - reproducibility: a run pins the FROZEN v1; pin is immutable
//   - edit/archive/restore gold item (all-false guard; run pin NOT rewritten)
//   - freeze-on-pin / immutability: activate FROZEN -> 409; mutate item on a
//     FROZEN revision -> 409 GOLD_ITEM_IMMUTABLE
//   - cut+activate a revision (prior ACTIVE freezes; run pin unchanged)
//   - export bundle -> import dry-run (COMPATIBLE) -> confirm (new revision)
//   - 403 PERMISSION_DENIED for a non-owner actor
// The backend is expected to be running (boot it on SQLite as prior actual
// smokes do). The gold-set store is deterministic/process-local and seeds a
// `<project>-authoring-dataset` under project id `project-corp-knowledge`.

const apiBaseUrl = process.env.MVP6_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const artifactDir = resolve(
  process.env.MVP6_GOLDSET_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-goldset-actual-smoke",
);
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");

// Seeded gold-set identifiers (apps/backend/app/modules/goldset_authoring/service.py).
const SEED_PROJECT_ID = "project-corp-knowledge";
const SEED_DATASET_ID = `${SEED_PROJECT_ID}-authoring-dataset`;
const SEED_ACTIVE_REVISION_ID = `${SEED_DATASET_ID}-v2`;
const SEED_FROZEN_REVISION_ID = `${SEED_DATASET_ID}-v1`;
const SEED_ENTITY_ID = `${SEED_DATASET_ID}-gold-entity-1`;
const SEED_PINNED_RUN_ID = `${SEED_PROJECT_ID}-eval-run-pinned-v1`;
const OWNER = "dev-user";
const NON_OWNER = "mallory";

await mkdir(artifactDir, { recursive: true });
const result = { apiBaseUrl, artifactDir, apiChecks: [], ids: {} };

function withActor(path, actor) {
  return `${path}${path.includes("?") ? "&" : "?"}actor_id=${encodeURIComponent(actor)}`;
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
}

// ---- 1. A real DB project (import endpoints require a Project row). ----
const project = await ok("/api/v1/projects", {
  method: "POST",
  body: JSON.stringify({ name: `MVP6.4 Gold Set Actual Smoke ${runStamp}`, description: "Wave40 goldset actual smoke" }),
});
result.ids.import_project_id = project.id;

// The seeded gold-set lives under project-corp-knowledge; the overview endpoint
// requires that project to exist in the DB. Most authoring endpoints do not.
const { response: seedProjResp } = await call(`/api/v1/projects/${SEED_PROJECT_ID}`);
const seedProjectExists = seedProjResp.ok;
result.ids.seed_project_in_db = seedProjectExists;

// ---- 2. Authoring overview (only if seed project resolves in the DB). ----
if (seedProjectExists) {
  const overview = await ok(
    withActor(`/api/v1/projects/${SEED_PROJECT_ID}/evaluation-datasets/${SEED_DATASET_ID}/authoring`, OWNER),
  );
  assertAllFalseGuard(overview.mutation_guard, "authoring overview");
  if (!overview.capabilities.can_edit_gold_item || !overview.capabilities.can_cut_revision) {
    throw new Error("Owner overview must grant edit + cut-revision capabilities.");
  }
  if (overview.active_revision?.status !== "ACTIVE") {
    throw new Error("Seeded overview must expose an ACTIVE revision.");
  }
  const pin = (overview.pinned_runs ?? []).find((p) => p.run_id === SEED_PINNED_RUN_ID);
  if (!pin || pin.dataset_version_id !== SEED_FROZEN_REVISION_ID || pin.pin_immutable !== true) {
    throw new Error("Reproducibility: pinned run must resolve the FROZEN v1 with pin_immutable=true.");
  }
  result.apiChecks.push({ name: "authoring-overview", active: overview.active_revision.id, pinned_run: pin.run_id, pin_immutable: pin.pin_immutable });
} else {
  result.apiChecks.push({ name: "authoring-overview", skipped: "seed project not in DB; import flow exercised via fresh project below" });
}

// ---- 3. Edit / archive / restore a gold item (all-false guard; pin unchanged). ----
const edited = await ok(
  withActor(`/api/v1/evaluation-datasets/${SEED_DATASET_ID}/gold-entities/${SEED_ENTITY_ID}`, OWNER),
  { method: "PATCH", body: JSON.stringify({ normalized_value: "claim filing deadline (reviewed)", reason: "expert re-review" }) },
);
assertAllFalseGuard(edited.mutation_guard, "gold-entity edit");
if (edited.mutation_guard.prior_run_pin_rewritten !== false) {
  throw new Error("Edit must not rewrite a prior run pin.");
}
result.apiChecks.push({ name: "edit-gold-entity", action: edited.audit_entry.action, guard_all_false: true });

const archived = await ok(
  withActor(`/api/v1/evaluation-datasets/${SEED_DATASET_ID}/gold-entities/${SEED_ENTITY_ID}/archive`, OWNER),
  { method: "POST", body: JSON.stringify({ reason: "stale item retired" }) },
);
if (archived.gold_entity.status !== "ARCHIVED") throw new Error("Archive must soft-set status=ARCHIVED.");
const restored = await ok(
  withActor(`/api/v1/evaluation-datasets/${SEED_DATASET_ID}/gold-entities/${SEED_ENTITY_ID}/restore`, OWNER),
  { method: "POST", body: JSON.stringify({ reason: "restore reviewed item" }) },
);
if (restored.gold_entity.status !== "ACTIVE") throw new Error("Restore must return the item to ACTIVE.");
result.apiChecks.push({ name: "archive-restore-gold-entity", archived: "ARCHIVED", restored: "ACTIVE" });

// ---- 4. Freeze-on-pin / immutability: activating the FROZEN v1 is blocked. ----
const frozenActivate = await expectStatus(
  withActor(`/api/v1/dataset-revisions/${SEED_FROZEN_REVISION_ID}/activate`, OWNER),
  { method: "POST" },
  409,
  "REVISION_FROZEN",
);
result.apiChecks.push({ name: "activate-frozen-blocked", ...frozenActivate });

// ---- 5. run-pin-not-rewritten at the data level: GET the FROZEN revision; it
//         still reports its pin and the original run pin is intact. ----
const frozenRev = await ok(`/api/v1/dataset-revisions/${SEED_FROZEN_REVISION_ID}`);
if (frozenRev.status !== "FROZEN" || frozenRev.is_immutable !== true || frozenRev.pinned_run_count < 1) {
  throw new Error("FROZEN v1 must remain FROZEN/immutable with its run pin intact after authoring.");
}
result.apiChecks.push({ name: "run-pin-not-rewritten", revision: frozenRev.id, status: frozenRev.status, pinned_run_count: frozenRev.pinned_run_count });

// ---- 6. Cut + activate a new revision; prior ACTIVE v2 freezes. ----
const cut = await ok(
  withActor(`/api/v1/evaluation-datasets/${SEED_DATASET_ID}/revisions`, OWNER),
  { method: "POST", body: JSON.stringify({ note: "Wave40 smoke snapshot", activate: true }) },
);
assertAllFalseGuard(cut.mutation_guard, "revision cut");
if (cut.revision.status !== "ACTIVE") throw new Error("Activated cut must yield an ACTIVE revision.");
if (cut.frozen_revision_id !== SEED_ACTIVE_REVISION_ID) {
  throw new Error(`Cut+activate must freeze the prior ACTIVE (${SEED_ACTIVE_REVISION_ID}); got ${cut.frozen_revision_id}.`);
}
result.ids.new_revision_id = cut.revision.id;
result.apiChecks.push({ name: "cut-activate-revision", new: cut.revision.id, frozen_prior: cut.frozen_revision_id });

// Mutating a gold item now on the frozen prior revision (v2) is immutable.
const immutableEdit = await expectStatus(
  withActor(`/api/v1/evaluation-datasets/${SEED_DATASET_ID}/gold-entities/${SEED_ENTITY_ID}`, OWNER),
  { method: "PATCH", body: JSON.stringify({ normalized_value: "should be blocked", reason: "x" }) },
  409,
  "GOLD_ITEM_IMMUTABLE",
);
result.apiChecks.push({ name: "edit-on-frozen-revision-blocked", ...immutableEdit });

// ---- 7. Export -> import dry-run (COMPATIBLE in a fresh project) -> confirm. ----
const bundle = await ok(`/api/v1/dataset-revisions/${SEED_FROZEN_REVISION_ID}/export`);
assertAllFalseGuard(bundle.mutation_guard, "export bundle");
if ("candidates" in bundle || "published_entities" in bundle) {
  throw new Error("Export bundle must not carry candidates/published facts.");
}
result.apiChecks.push({ name: "export-bundle", revision: bundle.source_revision_id, samples: bundle.samples.length });

const dryRun = await ok(
  withActor(`/api/v1/projects/${project.id}/gold-set-imports`, OWNER),
  { method: "POST", body: JSON.stringify({ bundle }) },
);
assertAllFalseGuard(dryRun.mutation_guard, "import dry-run");
if (dryRun.compatibility !== "COMPATIBLE") {
  throw new Error(`Dry-run of a known-ontology bundle into a fresh project should be COMPATIBLE; got ${dryRun.compatibility} ${JSON.stringify(dryRun.issues)}`);
}
if (dryRun.blocking !== false || dryRun.allowed_strategies.length === 0) {
  throw new Error("COMPATIBLE dry-run must be non-blocking with at least one allowed strategy.");
}
result.apiChecks.push({ name: "import-dry-run", compatibility: dryRun.compatibility, strategies: dryRun.allowed_strategies });

const confirmed = await ok(
  withActor(`/api/v1/projects/${project.id}/gold-set-imports/${dryRun.import_id}/confirm`, OWNER),
  { method: "POST", body: JSON.stringify({ strategy: "CREATE_NEW_DATASET", activate: false }) },
);
assertAllFalseGuard(confirmed.mutation_guard, "import confirm");
if (!confirmed.created_revision_id) throw new Error("Confirm must create a NEW revision.");
result.ids.imported_revision_id = confirmed.created_revision_id;
result.apiChecks.push({ name: "import-confirm", created_revision: confirmed.created_revision_id, status: confirmed.created_revision_status });

// INCOMPATIBLE dry-run is blocked at confirm.
const incompatibleBundle = {
  ...bundle,
  gold_entities: bundle.gold_entities.map((e) => ({ ...e, ontology_class_id: "class-does-not-exist" })),
};
const incompatible = await ok(
  withActor(`/api/v1/projects/${project.id}/gold-set-imports`, OWNER),
  { method: "POST", body: JSON.stringify({ bundle: incompatibleBundle }) },
);
if (incompatible.compatibility !== "INCOMPATIBLE" || incompatible.blocking !== true || incompatible.allowed_strategies.length !== 0) {
  throw new Error("INCOMPATIBLE dry-run must be blocking with no allowed strategies.");
}
const incompatibleConfirm = await expectStatus(
  withActor(`/api/v1/projects/${project.id}/gold-set-imports/${incompatible.import_id}/confirm`, OWNER),
  { method: "POST", body: JSON.stringify({ strategy: "CREATE_NEW_DATASET" }) },
  409,
  "IMPORT_INCOMPATIBLE",
);
result.apiChecks.push({ name: "import-incompatible-blocked", ...incompatibleConfirm });

// ---- 8. 403 PERMISSION_DENIED for a non-owner authoring action. ----
const forbidden = await expectStatus(
  withActor(`/api/v1/evaluation-datasets/${SEED_DATASET_ID}/revisions`, NON_OWNER),
  { method: "POST", body: JSON.stringify({ note: "intruder", activate: false }) },
  403,
  "PERMISSION_DENIED",
);
result.apiChecks.push({ name: "non-owner-403", ...forbidden });

const artifactPath = join(artifactDir, "mvp6-goldset-actual-api-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({ status: "PASS", artifactPath, apiCheckCount: result.apiChecks.length, ids: result.ids }, null, 2));
