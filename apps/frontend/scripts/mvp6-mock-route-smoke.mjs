import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const frontendBaseUrl = process.env.MVP6_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const projectId = process.env.MVP6_PROJECT_ID ?? "project-corp-knowledge";
const artifactDir = resolve(process.env.MVP6_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-frontend-smoke");

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
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

try {
  await assertRoute(page, `/projects/${projectId}/evaluation-datasets`, "evaluation-datasets-mvp6", [
    { name: "evaluation title", run: () => page.getByRole("heading", { name: "Evaluation Datasets" }).waitFor() },
    { name: "mvp6 marker", run: () => page.getByText("MVP6.1", { exact: true }).waitFor() },
    { name: "deterministic marker", run: () => page.getByText("DETERMINISTIC_MOCK", { exact: true }).first().waitFor() },
    { name: "gold set manager", run: () => page.getByRole("heading", { name: "Gold Set Manager" }).waitFor() },
    { name: "deterministic run", run: () => page.getByRole("heading", { name: "Deterministic Run" }).waitFor() },
    { name: "benchmark metrics", run: () => page.getByRole("heading", { name: "Benchmark metrics" }).waitFor() },
    { name: "metric formulas", run: () => page.getByRole("heading", { name: "Metric formulas" }).waitFor() },
    { name: "not applicable metric", run: () => page.getByText("NOT_APPLICABLE", { exact: true }).waitFor() },
    { name: "error explorer", run: () => page.getByRole("heading", { name: "Error Case Explorer" }).waitFor() },
    { name: "direction error", run: () => page.getByText("WRONG_RELATION_DIRECTION", { exact: true }).waitFor() },
    { name: "legacy golden marker", run: () => page.getByRole("heading", { name: "Golden item kinds" }).waitFor() },
  ]);
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp6-mock-route-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({ status: "PASS", artifactPath, ...result }, null, 2));
