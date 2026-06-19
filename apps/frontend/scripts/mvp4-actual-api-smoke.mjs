import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const apiBaseUrl = process.env.MVP4_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const frontendBaseUrl = process.env.MVP4_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const seedJsonPath = resolve(process.env.MVP4_SEED_JSON ?? "/tmp/ontology-mvp4-seed.json");
const artifactDir = resolve(process.env.MVP4_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp4-actual-frontend-smoke");

await mkdir(artifactDir, { recursive: true });

const result = {
  apiBaseUrl,
  frontendBaseUrl,
  seedJsonPath,
  artifactDir,
  apiChecks: [],
  routes: [],
  screenshots: [],
};

function apiPath(path) {
  return `${apiBaseUrl}${path}`;
}

async function requestJson(path, init = {}) {
  const response = await fetch(apiPath(path), init);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} failed: ${response.status} ${text}`);
  }

  return data;
}

async function readSeedJson() {
  let text;

  try {
    text = await readFile(seedJsonPath, "utf8");
  } catch (error) {
    throw new Error(
      `MVP4 seed JSON was not readable at ${seedJsonPath}. Run the backend seed helper first or set MVP4_SEED_JSON. ${error.message}`,
    );
  }

  const seed = JSON.parse(text);

  if (!seed.project_id) {
    throw new Error("MVP4 seed JSON must include project_id.");
  }

  return seed;
}

function recordApiCheck(name, details) {
  result.apiChecks.push({ name, ...details });
}

async function assertSeededApi(seed) {
  const projectId = seed.project_id;
  const project = await requestJson(`/api/v1/projects/${projectId}`);
  const quality = await requestJson(`/api/v1/projects/${projectId}/quality/metrics`);
  const graph = await requestJson(`/api/v1/projects/${projectId}/published-graph/explore?max_hops=4`);
  const prompt = await requestJson(`/api/v1/projects/${projectId}/prompt-performance/summary`);
  const rag = await requestJson(`/api/v1/projects/${projectId}/rag/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "What candidate-only fact should answer this?", max_citations: 3 }),
  });
  const externalGraph = await requestJson(`/api/v1/external/projects/${projectId}/published-graph/current`, {
    headers: { "X-Dev-Auth": "mvp4-dev" },
  });

  if (project.id !== projectId) {
    throw new Error(`Seeded project mismatch: expected ${projectId}, received ${project.id}`);
  }
  if (graph.state !== "SAFE_TOO_LARGE") {
    throw new Error(`Expected SAFE_TOO_LARGE graph state for max_hops=4, received ${graph.state}`);
  }
  if (rag.state !== "INSUFFICIENT_EVIDENCE") {
    throw new Error(`Expected candidate-only RAG to be insufficient, received ${rag.state}`);
  }
  if (externalGraph.auth_mode !== "DEV_AUTH") {
    throw new Error(`Expected external auth mode DEV_AUTH, received ${externalGraph.auth_mode}`);
  }
  const qualityMetrics = quality.metric_groups?.flatMap((group) => group.metrics ?? []) ?? [];
  const qualityMetricWithoutFormulaContext = qualityMetrics.find(
    (metric) =>
      !metric.formula?.numerator ||
      !metric.formula?.denominator ||
      !metric.formula?.drilldown_target ||
      !metric.published_graph_version_ref?.published_graph_version_id,
  );

  if (qualityMetricWithoutFormulaContext) {
    throw new Error(`Quality metric ${qualityMetricWithoutFormulaContext.metric_id} is missing formula or version context.`);
  }

  recordApiCheck("project", { id: project.id, name: project.name });
  recordApiCheck("quality", {
    metric_groups: quality.metric_groups?.length ?? 0,
    formula_checked_metrics: qualityMetrics.length,
    published_graph_version_id: quality.published_graph_version_ref?.published_graph_version_id,
  });
  recordApiCheck("graph-safe-too-large", {
    state: graph.state,
    node_budget: graph.too_large?.node_budget,
    edge_budget: graph.too_large?.edge_budget,
  });
  recordApiCheck("rag-candidate-exclusion", {
    state: rag.state,
    reason_code: rag.insufficient_evidence?.reason_code,
  });
  recordApiCheck("prompt-performance", { rows: prompt.rows?.length ?? 0 });
  recordApiCheck("external-api", { auth_mode: externalGraph.auth_mode, project_id: externalGraph.project_id });
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
await assertSeededApi(seed);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

try {
  await assertRoute(page, `/projects/${projectId}/quality`, "quality-dashboard", [
    { name: "advanced quality title", run: () => page.getByRole("heading", { name: "Quality Dashboard" }).waitFor() },
    { name: "metric group marker", run: () => page.getByText("METRIC GROUPS", { exact: true }).waitFor() },
    { name: "formula numerator", run: () => page.getByText("Numerator", { exact: true }).first().waitFor() },
    { name: "formula denominator", run: () => page.getByText("Denominator", { exact: true }).first().waitFor() },
    { name: "formula drilldown target", run: () => page.getByText("Drilldown target", { exact: true }).first().waitFor() },
    { name: "published graph version context", run: () => page.getByText("Published graph version context").waitFor() },
    { name: "rate context marker", run: () => page.getByText("Rate context", { exact: true }).first().waitFor() },
    { name: "no composite score", run: () => page.getByText("NO COMPOSITE SCORE", { exact: true }).waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/rag`, "rag-workspace", [
    { name: "rag title", run: () => page.getByRole("heading", { name: "RAG Answer Workspace" }).waitFor() },
    { name: "grounded rag marker", run: () => page.getByText("Grounded RAG", { exact: true }).waitFor() },
    { name: "candidate exclusion copy", run: () => page.getByText("Candidate graph facts are excluded").waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/published-graph`, "published-graph-explorer", [
    { name: "graph explorer title", run: () => page.getByRole("heading", { name: "Published Graph Explorer" }).waitFor() },
    { name: "legacy published facts marker", run: () => page.getByText("PUBLISHED FACTS", { exact: true }).waitFor() },
    { name: "safe too large marker", run: () => page.getByText("SAFE TOO LARGE").waitFor() },
    { name: "published only state", run: () => page.getByText("Published-only graph state").waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/prompt-performance`, "prompt-performance", [
    { name: "prompt performance title", run: () => page.getByRole("heading", { name: "Prompt and Model Performance" }).waitFor() },
    { name: "telemetry unavailable", run: () => page.getByText("Telemetry unavailable").first().waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/external-api`, "external-api", [
    { name: "external api title", run: () => page.getByRole("heading", { name: "External Read-only API" }).waitFor() },
    { name: "dev auth", run: () => page.getByText("DEV_AUTH", { exact: true }).first().waitFor() },
    { name: "read only", run: () => page.getByText("read-only").first().waitFor() },
  ]);
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp4-actual-api-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({ status: "PASS", artifactPath, ...result }, null, 2));
