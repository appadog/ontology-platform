import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const frontendBaseUrl = process.env.MVP6_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const projectId = process.env.MVP6_PROJECT_ID ?? "project-corp-knowledge";
const artifactDir = resolve(process.env.MVP6_BENCHMARK_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-benchmark-mock-smoke");

await mkdir(artifactDir, { recursive: true });

const result = { frontendBaseUrl, projectId, artifactDir, routes: [], screenshots: [] };

async function screenshot(page, name) {
  const path = join(artifactDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  result.screenshots.push(path);
  return path;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  const path = `/projects/${projectId}/benchmark-comparisons`;
  const response = await page.goto(`${frontendBaseUrl}${path}`, { waitUntil: "networkidle" });
  if (!response?.ok()) {
    throw new Error(`Route ${path} failed: ${response?.status() ?? "no response"}`);
  }

  // 1. Builder + read-only safety copy.
  // Wave36 D3: page H1 Koreanized (UIUX_REMEDIATION_DECISIONS §3.2). 1:1 swap.
  await page.getByRole("heading", { name: "벤치마크 비교" }).waitFor();
  await page.getByText("MVP6.3", { exact: true }).waitFor();
  await page.getByText("Read-only aggregation over existing evaluation runs", { exact: false }).first().waitFor();
  await page.getByRole("heading", { name: "Select runs to compare" }).waitFor();
  await screenshot(page, "benchmark-builder");
  result.routes.push({ name: "benchmark-builder", path, status: response.status(), assertions: ["title", "mvp6.3 marker", "read-only copy", "run selector"] });

  // 2. Build the comparison.
  await page.getByRole("button", { name: "Build comparison" }).click();
  await page.getByRole("heading", { name: "Side-by-side metrics" }).waitFor();
  await page.getByRole("heading", { name: "Metric deltas vs baseline" }).waitFor();
  // Comparability warning band (DIFFERENT_DATASET_VERSION present).
  await page.getByText("Compare with care", { exact: false }).first().waitFor();
  await page.getByText("DIFFERENT_DATASET_VERSION", { exact: true }).first().waitFor();
  // Honest delta states.
  await page.getByText("higher than baseline", { exact: false }).first().waitFor();
  await page.getByText("lower than baseline", { exact: false }).first().waitFor();
  await page.getByText("Not comparable", { exact: false }).first().waitFor();
  await page.getByText("MISSING_METRIC", { exact: true }).first().waitFor();
  // Excluded run degradation.
  await page.getByRole("heading", { name: "Excluded runs" }).waitFor();
  await page.getByText("NOT_TERMINAL_SUCCESS", { exact: true }).first().waitFor();
  await screenshot(page, "benchmark-deltas");
  result.routes.push({ name: "benchmark-deltas", path, status: 200, assertions: ["metric deltas", "comparability band", "improved/regressed/not-comparable", "excluded runs"] });

  // 3. Confusion matrix + __NONE__ sentinel.
  await page.getByRole("heading", { name: "Confusion matrix", exact: true }).waitFor();
  await page.getByText("(no match)", { exact: false }).first().waitFor();
  await screenshot(page, "benchmark-confusion-matrix");
  result.routes.push({ name: "benchmark-confusion-matrix", path, status: 200, assertions: ["confusion matrix", "__NONE__ (no match) sentinel"] });

  // 4. Cell drilldown into contributing error cases (off-diagonal cell with cases).
  await page.getByRole("button", { name: /cases/ }).first().click();
  await page.getByRole("heading", { name: "Contributing error cases" }).waitFor();
  await page.getByText("Gold evidence", { exact: true }).first().waitFor();
  await page.getByText("Candidate evidence", { exact: true }).first().waitFor();
  await screenshot(page, "benchmark-cell-drilldown");
  result.routes.push({ name: "benchmark-cell-drilldown", path, status: 200, assertions: ["cell drilldown", "contributing error cases", "evidence-first"] });

  // 5. Relation-type axis toggle.
  await page.getByRole("tab", { name: "RELATION_TYPE" }).click();
  await page.getByRole("heading", { name: "Confusion matrix", exact: true }).waitFor();
  await screenshot(page, "benchmark-relation-axis");
  result.routes.push({ name: "benchmark-relation-axis", path, status: 200, assertions: ["relation-type axis"] });
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp6-benchmark-mock-route-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({ status: "PASS", artifactPath, routeCount: result.routes.length, screenshotCount: result.screenshots.length }, null, 2));
