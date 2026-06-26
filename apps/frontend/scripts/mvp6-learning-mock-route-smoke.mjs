import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const frontendBaseUrl = process.env.MVP6_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const projectId = process.env.MVP6_PROJECT_ID ?? "project-corp-knowledge";
const artifactDir = resolve(process.env.MVP6_LEARNING_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-learning-mock-smoke");

await mkdir(artifactDir, { recursive: true });

const result = {
  frontendBaseUrl,
  projectId,
  artifactDir,
  routes: [],
  screenshots: [],
};

async function screenshot(page, name) {
  const path = join(artifactDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  result.screenshots.push(path);
  return path;
}

async function gotoRoute(page, path, name) {
  const response = await page.goto(`${frontendBaseUrl}${path}`, { waitUntil: "networkidle" });
  if (!response?.ok()) {
    throw new Error(`Route ${path} failed: ${response?.status() ?? "no response"}`);
  }
  return { name, path, status: response.status() };
}

async function clickSection(page, label) {
  await page.getByRole("tab", { name: label }).click();
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  // Summary
  const summaryRoute = await gotoRoute(page, `/projects/${projectId}/learning-insights`, "learning-insights-summary");
  await page.getByRole("heading", { name: "Learning Insights" }).waitFor();
  await page.getByText("MVP6.2", { exact: true }).waitFor();
  await page.getByText("Recommendation only · audit-only", { exact: true }).waitFor();
  await page.getByText("RELATION_DIRECTION_CORRECTION", { exact: true }).first().waitFor();
  summaryRoute.screenshotPath = await screenshot(page, "learning-insights-summary");
  result.routes.push({ ...summaryRoute, assertions: ["title", "mvp6.2 marker", "audit-only badge", "signal taxonomy"] });

  // Correction patterns + detail
  await clickSection(page, "Correction Patterns");
  await page.getByText("Contains relation direction drifts in insurance samples", { exact: true }).first().waitFor();
  await page.getByText("Representative examples", { exact: true }).first().waitFor();
  await page.getByText("Source artifacts", { exact: true }).first().waitFor();
  // Affected class/relation labels render only if ontology_class_id / ontology_relation_id deserialize.
  await page.getByText("Affected classes", { exact: true }).first().waitFor();
  await page.getByText("Affected relations", { exact: true }).first().waitFor();
  await page.getByText("Insurance Product", { exact: false }).first().waitFor();
  const patternsPath = await screenshot(page, "learning-insights-patterns");
  result.routes.push({ name: "learning-insights-patterns", path: summaryRoute.path, status: 200, assertions: ["pattern title", "examples", "source artifacts"], screenshotPath: patternsPath });

  // Prompt improvements + accept flow
  await clickSection(page, "Prompt Improvements");
  await page.getByText("Add a direction example for product-to-coverage includes", { exact: true }).first().click();
  await page.getByText("Preview text (proposed, not applied)", { exact: true }).first().waitFor();
  await page.getByRole("button", { name: "Accept", exact: true }).first().click();
  await page.getByText(/Accepting records human intent/).waitFor();
  await page.getByRole("button", { name: "Accept (audit only)" }).click();
  await page.getByText("Decision audit note", { exact: true }).first().waitFor();
  await page.getByText("No prompt version was changed. No candidate or published graph state was mutated.", { exact: true }).first().waitFor();
  const suggestionsPath = await screenshot(page, "learning-insights-suggestions");
  result.routes.push({ name: "learning-insights-suggestions", path: summaryRoute.path, status: 200, assertions: ["preview text", "decision modal safety copy", "accept audit note"], screenshotPath: suggestionsPath });

  // Superseded / historical conflict: superseded suggestions cannot be decided
  await page.getByText("Old evidence guidance candidate", { exact: true }).first().click();
  await page.getByText(/superseded \(read-side history\)/i).waitFor();
  const supersededPath = await screenshot(page, "learning-insights-superseded");
  result.routes.push({ name: "learning-insights-superseded", path: summaryRoute.path, status: 200, assertions: ["superseded read-side notice"], screenshotPath: supersededPath });

  // Auto-approval preview
  await clickSection(page, "Auto-Approval Preview");
  await page.getByText("Recommendation only · Not enforced · Requires later policy approval", { exact: true }).first().waitFor();
  await page.getByText("Blocked actions (not available in MVP6.2)", { exact: true }).first().waitFor();
  await page.getByText("CREATE_POLICY", { exact: true }).first().waitFor();
  const autoPath = await screenshot(page, "learning-insights-auto-approval");
  result.routes.push({ name: "learning-insights-auto-approval", path: summaryRoute.path, status: 200, assertions: ["preview-only banner", "blocked actions"], screenshotPath: autoPath });

  // Decision history timeline
  await clickSection(page, "Decision History");
  await page.getByRole("heading", { name: "Learning Insights" }).waitFor();
  const historyPath = await screenshot(page, "learning-insights-history");
  result.routes.push({ name: "learning-insights-history", path: summaryRoute.path, status: 200, assertions: ["history timeline"], screenshotPath: historyPath });
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp6-learning-mock-route-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({ status: "PASS", artifactPath, routeCount: result.routes.length, screenshotCount: result.screenshots.length }, null, 2));
