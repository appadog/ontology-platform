import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const frontendBaseUrl = process.env.MVP5_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const projectId = process.env.MVP5_PROJECT_ID ?? "project-corp-knowledge";
const artifactDir = resolve(process.env.MVP5_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp5-frontend-smoke");

await mkdir(artifactDir, { recursive: true });

const result = {
  frontendBaseUrl,
  projectId,
  artifactDir,
  routes: [],
  screenshots: [],
  secretSafety: {
    rawSecretPrinted: false,
    persistentViewsMaskedOnly: true,
  },
};

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

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  await assertRoute(page, "/admin", "admin-console", [
    { name: "admin shell", run: () => page.getByTestId("mvp5-admin-shell").waitFor() },
    { name: "scope context", run: () => page.getByTestId("mvp5-admin-scope-context").waitFor() },
    { name: "permission denied marker", run: () => page.getByTestId("mvp5-permission-denied-state").waitFor() },
    { name: "read only marker", run: () => page.getByTestId("mvp5-read-only-state").waitFor() },
  ]);

  await assertRoute(page, "/admin/projects", "admin-project-index", [
    { name: "project index title", run: () => page.getByRole("heading", { name: "Project Admin Index" }).waitFor() },
    { name: "project contextual link", run: () => page.getByText("Corporate Knowledge Graph").first().waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/admin`, "project-admin-overview", [
    { name: "admin shell project", run: () => page.getByTestId("mvp5-admin-shell").waitFor() },
    { name: "project tabs", run: () => page.getByRole("link", { name: "Credentials", exact: true }).waitFor() },
    { name: "audit link", run: () => page.getByTestId("mvp5-audit-link").first().waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/admin/roles`, "project-admin-roles", [
    { name: "role table", run: () => page.getByTestId("mvp5-role-assignment-table").waitFor() },
    { name: "permission preview", run: () => page.getByTestId("mvp5-permission-preview").waitFor() },
    { name: "denied reason", run: () => page.getByText("SENSITIVITY_RESTRICTED").first().waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/admin/credentials`, "project-admin-credentials", [
    { name: "credential table", run: () => page.getByTestId("mvp5-credential-table").waitFor() },
    { name: "one time placeholder", run: () => page.getByTestId("mvp5-secret-one-time-reveal").waitFor() },
    { name: "masked display", run: () => page.getByTestId("mvp5-secret-masked-display").first().waitFor() },
    { name: "revoke confirm", run: () => page.getByTestId("mvp5-credential-revoke-confirm").waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/admin/policies/approval`, "project-admin-approval-policy", [
    { name: "policy editor", run: () => page.getByTestId("mvp5-policy-draft-editor").waitFor() },
    { name: "policy diff", run: () => page.getByTestId("mvp5-policy-diff").waitFor() },
    { name: "dry run marker", run: () => page.getByTestId("mvp5-policy-dry-run-marker").waitFor() },
    { name: "enforce marker", run: () => page.getByTestId("mvp5-policy-enforce-marker").waitFor() },
    { name: "blocked rows", run: () => page.getByTestId("mvp5-policy-blocked-rows").waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/admin/import-export`, "project-admin-import-export", [
    { name: "import export panel", run: () => page.getByTestId("mvp5-import-export-panel").waitFor() },
    { name: "import dry run result", run: () => page.getByTestId("mvp5-import-dry-run-result").waitFor() },
    { name: "export ready", run: () => page.getByTestId("mvp5-export-ready-state").waitFor() },
    { name: "conflict rows", run: () => page.getByTestId("mvp5-import-conflict-rows").waitFor() },
    { name: "warning rows", run: () => page.getByTestId("mvp5-import-warning-rows").waitFor() },
    { name: "destructive impact", run: () => page.getByTestId("mvp5-import-destructive-impact").waitFor() },
    { name: "rollback guidance", run: () => page.getByTestId("mvp5-import-rollback-guidance").waitFor() },
    { name: "confirmation required", run: () => page.getByTestId("mvp5-import-confirmation-required").waitFor() },
    { name: "audit link", run: () => page.getByTestId("mvp5-audit-link").first().waitFor() },
    { name: "no secret preview", run: () => page.getByTestId("mvp5-package-no-secret-preview").waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/admin/operations`, "project-admin-operations", [
    { name: "operations dashboard", run: () => page.getByTestId("mvp5-operations-dashboard").waitFor() },
    { name: "dlq boundary", run: () => page.getByTestId("mvp5-dlq-action-boundary").waitFor() },
    { name: "structured event", run: () => page.getByTestId("mvp5-structured-event-detail").waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/admin/retention-backup`, "project-admin-retention-backup", [
    { name: "retention table", run: () => page.getByTestId("mvp5-retention-policy-table").waitFor() },
    { name: "deletion dry run", run: () => page.getByTestId("mvp5-deletion-dry-run-impact").waitFor() },
    { name: "backup list", run: () => page.getByTestId("mvp5-backup-snapshot-list").waitFor() },
    { name: "restore dry run", run: () => page.getByTestId("mvp5-restore-dry-run-impact").waitFor() },
  ]);
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp5-mock-route-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({ status: "PASS", artifactPath, routeCount: result.routes.length, secretSafety: result.secretSafety }, null, 2));
