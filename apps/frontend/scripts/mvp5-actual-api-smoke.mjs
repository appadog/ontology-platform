import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const apiBaseUrl = process.env.MVP5_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const frontendBaseUrl = process.env.MVP5_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const seedJsonPath = resolve(process.env.MVP5_SEED_JSON ?? "/tmp/ontology-wave24-mvp5-seed.json");
const artifactDir = resolve(process.env.MVP5_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp5-actual-frontend-smoke");

await mkdir(artifactDir, { recursive: true });

const result = {
  apiBaseUrl,
  frontendBaseUrl,
  seedJsonPath,
  artifactDir,
  apiChecks: [],
  routes: [],
  screenshots: [],
  secretSafety: {
    hasRawSecret: false,
    rawSecretPrinted: false,
    listMaskedOnly: false,
  },
};

function apiPath(path) {
  return `${apiBaseUrl}${path}`;
}

async function requestJson(path, init = {}) {
  const response = await fetch(apiPath(path), init);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} failed: ${response.status}`);
  }

  return data;
}

async function requestJsonFallback(primaryPath, fallbackPath, init = {}) {
  try {
    return await requestJson(primaryPath, init);
  } catch (error) {
    if (!fallbackPath) {
      throw error;
    }
    return requestJson(fallbackPath, init);
  }
}

async function readSeedJson() {
  let text;

  try {
    text = await readFile(seedJsonPath, "utf8");
  } catch (error) {
    throw new Error(
      `MVP5 seed JSON was not readable at ${seedJsonPath}. Run the backend seed helper first or set MVP5_SEED_JSON. ${error.message}`,
    );
  }

  const seed = JSON.parse(text);

  if (!seed.project_id) {
    throw new Error("MVP5 seed JSON must include project_id.");
  }

  return seed;
}

// Wave 65 (follow-up on the Wave57 QA report's mvp5:actual harness gap): the
// frontend's admin console reads its organization id from the BUILD-TIME
// `VITE_MVP5_ORGANIZATION_ID` env var (defaults to the mock fixture id
// "org-ontology-demo" — see `src/pages/mvp5Shared.tsx`). If the running dev
// server wasn't started with that env var set to the SEEDED org id, every
// admin-console assertion below fails with an opaque 30s Playwright timeout.
// Fail fast with an actionable message instead. (The frontend env is baked in
// at dev-server start, so this script cannot fix a mismatch itself — it can
// only detect one early.) The seed should also be run against an ISOLATED
// mvp5-only DB: the admin console fetches a per-project summary for every
// project in the tenant, and self-seeded projects from other MVP6 actual
// smokes (sharing a DB) have no admin record, which 404s.
function assertFrontendOrgEnvMatchesSeed(seed) {
  const organizationId = seed.organization_id ?? "org-ontology-demo";
  const configured = process.env.VITE_MVP5_ORGANIZATION_ID ?? "org-ontology-demo";
  if (configured !== organizationId) {
    throw new Error(
      `Frontend org-id mismatch: the seed created organization_id="${organizationId}", but the running frontend ` +
        `dev server was started with VITE_MVP5_ORGANIZATION_ID="${configured}" (or unset, defaulting to the mock ` +
        `fixture "org-ontology-demo"). Restart the frontend dev server with ` +
        `VITE_MVP5_ORGANIZATION_ID=${organizationId} before re-running this smoke, and run it against an isolated ` +
        `mvp5-only DB (not shared with other MVP6 actual-smoke self-seeded data) to avoid admin-console 404s on ` +
        `projects lacking admin records.`,
    );
  }
}

function recordApiCheck(name, details) {
  result.apiChecks.push({ name, ...details });
}

function unwrapItems(payload) {
  return Array.isArray(payload) ? payload : payload.items ?? [];
}

function getId(payload, fallbackKey) {
  return payload?.[fallbackKey] ?? payload?.id;
}

function buildOntologyPackage(projectId) {
  return {
    package_id: "ontology-package-wave25-frontend-smoke",
    schema_version: "ontology-package.v1",
    project_id: projectId,
    ontology_version_id: "ontology-version-mvp5-current",
    published_graph_version_id: "published-graph-version-mvp5-current",
    generated_at: "2026-06-19T09:00:00Z",
    classes: [
      { stable_id: "class-customer-imported-other", name: "Customer", description: "Conflicting Customer identifier." },
      { stable_id: "class-account", name: "Account", description: "Financial account." },
    ],
    properties: [
      { stable_id: "property-customer-email", class_stable_id: "class-customer-imported-other", name: "email", data_type: "STRING" },
      { stable_id: "property-customer-tier", class_stable_id: "class-customer-imported-other", name: "tier", data_type: "STRING" },
      { stable_id: "property-account-status", class_stable_id: "class-account", name: "status", data_type: "STRING" },
    ],
    relations: [
      {
        stable_id: "relation-customer-owns-account",
        name: "OWNS_ACCOUNT",
        source_class_stable_id: "class-customer-imported-other",
        target_class_stable_id: "class-account",
      },
      {
        stable_id: "relation-customer-reviewed-by-account",
        name: "REVIEWED_BY",
        source_class_stable_id: "class-customer-imported-other",
        target_class_stable_id: "class-account",
      },
    ],
  };
}

async function assertSeededApi(seed) {
  const projectId = seed.project_id;
  const organizationId = seed.organization_id ?? "org-ontology-demo";
  const org = await requestJson(`/api/v1/admin/organizations/${organizationId}/summary`);
  const project = await requestJson(`/api/v1/admin/projects/${projectId}/summary`);
  const permission = await requestJson("/api/v1/admin/permission-checks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      principal_id: "user-analyst-viewer",
      principal_type: "HUMAN_USER",
      organization_id: organizationId,
      project_id: projectId,
      resource_type: "API_CREDENTIAL",
      action: "REVOKE_CREDENTIAL",
      data_state: "masked secret",
      sensitivity: "secret",
    }),
  });
  const created = await requestJson(`/api/v1/admin/projects/${projectId}/service-accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Wave24 smoke service account",
      scopes: ["PROJECT_ADMIN_READ", "QUALITY_READ"],
      reason: "Wave24 actual smoke one-time reveal existence assertion",
    }),
  });
  const serviceAccounts = unwrapItems(await requestJson(`/api/v1/admin/projects/${projectId}/service-accounts`));
  const policy = unwrapItems(await requestJson(`/api/v1/admin/projects/${projectId}/automatic-approval-policies`))[0];
  const policyId = getId(policy, "policy_id");
  const evaluation = await requestJson(`/api/v1/admin/automatic-approval-policies/${policyId}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "DRY_RUN" }),
  });
  const enforcePreview = await requestJson(`/api/v1/admin/automatic-approval-policies/${policyId}/enforce-preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target_mode: "ENFORCE",
      reason: "Wave24 actual smoke gated preview",
      confirmation: "PREVIEW_ENFORCE",
    }),
  });
  const operations = await requestJson(`/api/v1/admin/projects/${projectId}/operations/dashboard`);
  const exportStatus = await requestJson(`/api/v1/admin/projects/${projectId}/ontology-export`);
  const exportJobId = getId(exportStatus, "job_id") ?? exportStatus.package_id;
  const exportDownload = exportStatus.download ?? exportStatus;
  const importPackage = seed.import_package ?? buildOntologyPackage(projectId);
  const importInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "DRY_RUN",
      package: importPackage,
    }),
  };
  const importDryRun = await requestJson(`/api/v1/admin/projects/${projectId}/ontology-import/dry-run`, importInit);
  const deletion = await requestJson(`/api/v1/admin/projects/${projectId}/retention/deletion-dry-run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resource_type: "SOURCE",
      resource_ids: ["source-security-policy"],
      reason: "Wave24 deletion dry-run preview",
    }),
  });
  const backups = unwrapItems(await requestJson(`/api/v1/admin/projects/${projectId}/backup-snapshots`));
  const restore = await requestJson(`/api/v1/admin/backup-snapshots/${getId(backups[0], "snapshot_id")}/restore-dry-run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "Wave24 restore dry-run preview" }),
  });

  const hasRawSecret = Boolean(created && Object.prototype.hasOwnProperty.call(created, "raw_secret") && created.raw_secret);
  const listMaskedOnly = serviceAccounts.every((credential) => credential.masked_secret && !Object.prototype.hasOwnProperty.call(credential, "raw_secret"));
  result.secretSafety.hasRawSecret = hasRawSecret;
  result.secretSafety.listMaskedOnly = listMaskedOnly;

  if (!hasRawSecret) {
    throw new Error("Credential create response must include a one-time raw_secret field.");
  }
  if (!listMaskedOnly) {
    throw new Error("Credential list must be masked only and must not expose raw_secret.");
  }
  if (permission.allowed !== false) {
    throw new Error("Expected seeded analyst credential revoke check to be denied.");
  }
  if (!evaluation.rows?.some((row) => row.status === "BLOCKED")) {
    throw new Error("Expected automatic approval dry-run to include blocked rows.");
  }
  const enforceBlocked =
    enforcePreview.gate_status === "BLOCKED" ||
    enforcePreview.can_enforce === false ||
    Number(enforcePreview.blocked_count ?? 0) > 0;
  if (!enforceBlocked) {
    throw new Error("Expected enforce preview to expose a blocked or gated safety state.");
  }
  if (!deletion.impact_summary?.requires_confirmation || !restore.requires_confirmation) {
    throw new Error("Deletion and restore dry-runs must require confirmation.");
  }
  const exportMetadata = exportStatus.package_metadata ?? exportStatus ?? {};
  const exportCounts = exportMetadata.counts ?? exportStatus.counts ?? exportMetadata.contents_summary ?? {};
  if (!exportMetadata.project_id || !(exportMetadata.schema_version ?? exportMetadata.package_schema_version)) {
    throw new Error("Ontology export metadata must include project_id and schema_version/package_schema_version.");
  }
  if (Number(exportCounts.class_count ?? exportCounts.classes ?? 0) < 0 || Number(exportCounts.property_count ?? exportCounts.properties ?? 0) < 0 || Number(exportCounts.relation_count ?? exportCounts.relations ?? 0) < 0) {
    throw new Error("Ontology export counts must be present as non-negative numbers.");
  }
  const importSummary = importDryRun.summary ?? {};
  const importCompatibility = importDryRun.compatibility_status ?? importDryRun.status;
  if (!importCompatibility) {
    throw new Error("Import dry-run must include compatibility/status.");
  }
  if (!Array.isArray(importDryRun.conflicts) || !Array.isArray(importDryRun.rollback_guidance ?? [])) {
    throw new Error("Import dry-run must include conflict rows and rollback guidance.");
  }
  if (importDryRun.mutation_applied === true || importDryRun.mode === "APPLY") {
    throw new Error("Import dry-run smoke detected mutation/apply semantics.");
  }

  recordApiCheck("organization-summary", { organization_id: org.organization_id, auth_mode: org.auth_mode });
  recordApiCheck("project-summary", { project_id: project.project_id, role_assignment_count: project.role_assignment_count });
  recordApiCheck("permission-denied", { decision: permission.decision, deny_reasons: permission.deny_reasons });
  recordApiCheck("credential-safety", { hasRawSecret, listMaskedOnly, credentialCount: serviceAccounts.length });
  recordApiCheck("policy-gates", {
    dryRunRows: evaluation.rows?.length ?? 0,
    enforceGate: enforcePreview.gate_status ?? (enforcePreview.can_enforce ? "PASS" : "BLOCKED"),
  });
  recordApiCheck("operations", { dlqCount: operations.job_health?.dlq_count, budgetStatus: operations.cost_budget?.budget_status });
  recordApiCheck("ontology-export", {
    jobId: exportJobId,
    status: exportStatus.status,
    schemaVersion: exportMetadata.schema_version ?? exportMetadata.package_schema_version,
    classCount: exportCounts.class_count ?? exportCounts.classes,
    expiresAt: exportDownload.expires_at,
  });
  recordApiCheck("ontology-import-dry-run", {
    jobId: getId(importDryRun, "job_id"),
    status: importDryRun.status,
    compatibility: importCompatibility,
    createCount: importSummary.create_count,
    updateCount: importSummary.update_count,
    deleteCount: importSummary.delete_count,
    noOpCount: importSummary.no_op_count ?? importSummary.noop_count,
    conflictCount: importDryRun.conflicts?.length ?? importSummary.conflict_count,
    warningCount: importDryRun.warnings?.length ?? importSummary.warning_count,
    mutationApplied: importDryRun.mutation_applied === true,
  });
  recordApiCheck("retention-backup", { deletionRequiresConfirmation: deletion.requires_confirmation, restoreEligible: restore.eligible });
}

async function screenshot(page, name) {
  const path = join(artifactDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  result.screenshots.push(path);
  return path;
}

async function assertRoute(page, path, name, assertions) {
  const response = await page.goto(`${frontendBaseUrl}${path}`, { waitUntil: "networkidle" });

  if (!response?.ok()) {
    throw new Error(`Route ${path} failed: ${response?.status() ?? "no response"}`);
  }

  const passedAssertions = [];

  for (const assertion of assertions) {
    await assertion.run();
    passedAssertions.push(assertion.name);
  }

  const screenshotPath = await screenshot(page, name);
  result.routes.push({ name, path, status: response.status(), assertions: passedAssertions, screenshotPath });
}

const seed = await readSeedJson();
const projectId = seed.project_id;
assertFrontendOrgEnvMatchesSeed(seed);
await assertSeededApi(seed);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  await assertRoute(page, "/admin", "admin-console", [
    { name: "admin shell", run: () => page.getByTestId("mvp5-admin-shell").waitFor() },
    { name: "scope context", run: () => page.getByTestId("mvp5-admin-scope-context").waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/admin/credentials`, "project-admin-credentials", [
    { name: "credential table", run: () => page.getByTestId("mvp5-credential-table").waitFor() },
    { name: "masked display", run: () => page.getByTestId("mvp5-secret-masked-display").first().waitFor() },
    { name: "revoke confirm", run: () => page.getByTestId("mvp5-credential-revoke-confirm").waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/admin/policies/approval`, "project-admin-approval-policy", [
    { name: "dry run marker", run: () => page.getByTestId("mvp5-policy-dry-run-marker").waitFor() },
    { name: "enforce marker", run: () => page.getByTestId("mvp5-policy-enforce-marker").waitFor() },
    { name: "blocked rows", run: () => page.getByTestId("mvp5-policy-blocked-rows").waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/admin/import-export`, "project-admin-import-export", [
    { name: "import export panel", run: () => page.getByTestId("mvp5-import-export-panel").waitFor() },
    { name: "import dry run result", run: () => page.getByTestId("mvp5-import-dry-run-result").waitFor() },
    { name: "conflict rows", run: () => page.getByTestId("mvp5-import-conflict-rows").waitFor() },
    { name: "warning rows", run: () => page.getByTestId("mvp5-import-warning-rows").waitFor() },
    { name: "destructive impact", run: () => page.getByTestId("mvp5-import-destructive-impact").waitFor() },
    { name: "rollback guidance", run: () => page.getByTestId("mvp5-import-rollback-guidance").waitFor() },
    { name: "confirmation required", run: () => page.getByTestId("mvp5-import-confirmation-required").waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/admin/operations`, "project-admin-operations", [
    { name: "operations dashboard", run: () => page.getByTestId("mvp5-operations-dashboard").waitFor() },
    { name: "dlq boundary", run: () => page.getByTestId("mvp5-dlq-action-boundary").waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/admin/retention-backup`, "project-admin-retention-backup", [
    { name: "deletion dry run", run: () => page.getByTestId("mvp5-deletion-dry-run-impact").waitFor() },
    { name: "restore dry run", run: () => page.getByTestId("mvp5-restore-dry-run-impact").waitFor() },
  ]);
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp5-actual-api-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(
  JSON.stringify(
    {
      status: "PASS",
      artifactPath,
      apiCheckCount: result.apiChecks.length,
      routeCount: result.routes.length,
      secretSafety: result.secretSafety,
    },
    null,
    2,
  ),
);
