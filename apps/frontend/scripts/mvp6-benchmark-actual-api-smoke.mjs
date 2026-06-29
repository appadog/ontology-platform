import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const apiBaseUrl = process.env.MVP6_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const frontendBaseUrl = process.env.MVP6_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const artifactDir = resolve(process.env.MVP6_BENCHMARK_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-benchmark-actual-smoke");
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");

await mkdir(artifactDir, { recursive: true });

const result = { apiBaseUrl, frontendBaseUrl, artifactDir, apiChecks: [], routes: [], screenshots: [], ids: {} };

async function requestJson(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "X-Dev-Auth": "mvp6-dev", ...options.headers },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  return { response, data, text };
}

async function ok(path, options) {
  const { response, data, text } = await requestJson(path, options);
  if (!response.ok) {
    throw new Error(`${options?.method ?? "GET"} ${path} failed: ${response.status} ${text}`);
  }
  return data;
}

function unwrapItems(payload) {
  return Array.isArray(payload) ? payload : payload?.items ?? [];
}

async function screenshot(page, name) {
  const path = join(artifactDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  result.screenshots.push(path);
  return path;
}

// ---- 1. Seed an actual project + dataset + sample + gold + two deterministic runs. ----
const project = await ok("/api/v1/projects", {
  method: "POST",
  body: JSON.stringify({ name: `MVP6.3 Benchmark Actual Smoke ${runStamp}`, description: "Wave34 benchmark comparison actual smoke" }),
});
result.ids.project_id = project.id;

const dataset = await ok(`/api/v1/projects/${project.id}/evaluation-datasets`, {
  method: "POST",
  body: JSON.stringify({ name: "Benchmark actual gold set", description: "Deterministic gold set for benchmark comparison." }),
});
result.ids.dataset_id = dataset.id;

const sample = await ok(`/api/v1/evaluation-datasets/${dataset.id}/samples`, {
  method: "POST",
  body: JSON.stringify({
    sample_kind: "MANUAL_TEXT",
    title: "Benchmark ownership sample",
    content_text: "The Information Security Policy is owned by the Security Office.",
    source_locator: "manual://mvp6.3/benchmark",
    metadata: { domain: "security" },
  }),
});

const evidence = {
  sample_id: sample.id,
  source_id: null,
  source_segment_id: null,
  locator: "manual://mvp6.3/benchmark",
  offset_start: 0,
  offset_end: 32,
  quote: "Information Security Policy",
};
const policyEntity = await ok(`/api/v1/evaluation-datasets/${dataset.id}/gold-entities`, {
  method: "POST",
  body: JSON.stringify({ sample_id: sample.id, ontology_class_id: "class-policy", label: "Information Security Policy", normalized_value: "information security policy", evidence }),
});
const orgEntity = await ok(`/api/v1/evaluation-datasets/${dataset.id}/gold-entities`, {
  method: "POST",
  body: JSON.stringify({ sample_id: sample.id, ontology_class_id: "class-organization", label: "Security Office", normalized_value: "security office", evidence: { ...evidence, quote: "Security Office" } }),
});
await ok(`/api/v1/evaluation-datasets/${dataset.id}/gold-relations`, {
  method: "POST",
  body: JSON.stringify({ sample_id: sample.id, ontology_relation_id: "relation-owned-by", source_gold_entity_id: policyEntity.id, target_gold_entity_id: orgEntity.id, evidence }),
});

async function createRun(modelName) {
  return ok(`/api/v1/projects/${project.id}/evaluation-runs`, {
    method: "POST",
    body: JSON.stringify({
      dataset_id: dataset.id,
      run_mode: "DETERMINISTIC_MOCK",
      ontology_version_id: "onto-v6-eval",
      prompt_version_id: "prompt-v6-eval",
      model_name: modelName,
      parser_version: "parser-v6.1",
    }),
  });
}
const runA = await createRun("deterministic-mock");
const runB = await createRun("gpt-mock-b");
result.ids.run_a = runA.id;
result.ids.run_b = runB.id;

// ---- 2. Build the comparison (POST) + list + GET-by-id round-trip (R3). ----
const comparison = await ok(`/api/v1/projects/${project.id}/benchmark-comparisons`, {
  method: "POST",
  body: JSON.stringify({ run_ids: [runA.id, runB.id], group_by: "MODEL", baseline_run_id: runA.id }),
});
result.ids.comparison_id = comparison.id;
if (Object.values(comparison.mutation_guard).some((flag) => flag !== false)) {
  throw new Error("Benchmark mutation guard must be all-false.");
}
if (comparison.runs.length < 2 || !comparison.runs.some((run) => run.is_baseline)) {
  throw new Error("Comparison must include >=2 runs and a baseline.");
}
result.apiChecks.push({ name: "create-comparison", id: comparison.id, run_count: comparison.runs.length, mutation_guard: comparison.mutation_guard });

const list = unwrapItems(await ok(`/api/v1/projects/${project.id}/benchmark-comparisons`));
if (!list.some((item) => item.id === comparison.id)) {
  throw new Error("List endpoint did not round-trip the composed comparison.");
}
const fetched = await ok(`/api/v1/benchmark-comparisons/${comparison.id}`);
if (fetched.id !== comparison.id) {
  throw new Error("GET-by-id did not round-trip the composed comparison.");
}
result.apiChecks.push({ name: "list-getbyid-roundtrip", listed: true, fetched: fetched.id });

// ---- 3. Confusion matrix per run/axis + cell drilldown. ----
const matrix = await ok(`/api/v1/benchmark-comparisons/${comparison.id}/confusion-matrix?run_id=${encodeURIComponent(runB.id)}&axis=ENTITY_CLASS`);
if (matrix.axis !== "ENTITY_CLASS" || !Array.isArray(matrix.cells)) {
  throw new Error("Confusion matrix missing axis/cells.");
}
result.apiChecks.push({ name: "confusion-matrix", axis: matrix.axis, label_count: matrix.labels.length, cell_count: matrix.cells.length });

const drillCell = matrix.cells.find((cell) => cell.contributing_error_case_ref?.error_case_count > 0);
if (drillCell) {
  const drill = await ok(
    `/api/v1/benchmark-comparisons/${comparison.id}/confusion-matrix/cells/${encodeURIComponent(drillCell.id)}/error-cases`,
  );
  result.apiChecks.push({ name: "cell-drilldown", cell_id: drillCell.id, error_case_count: drill.error_cases.length });
}

// ---- 4. Drive the actual UI against this project. ----
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
try {
  const path = `/projects/${project.id}/benchmark-comparisons`;
  const response = await page.goto(`${frontendBaseUrl}${path}`, { waitUntil: "networkidle" });
  if (!response?.ok()) {
    throw new Error(`Route ${path} failed: ${response?.status() ?? "no response"}`);
  }
  // Wave36 D3: page H1 Koreanized (UIUX_REMEDIATION_DECISIONS section 3.2). 1:1 swap.
  await page.getByRole("heading", { name: "벤치마크 비교" }).waitFor();
  // Wave37 FE6-044: run-selector card title Koreanized (D3/§5).
  await page.getByRole("heading", { name: "비교할 실행 선택" }).waitFor();
  await screenshot(page, "benchmark-actual-builder");

  // Wave37 FE6-044: single primary action "비교 실행" (§4.3 P4).
  await page.getByRole("button", { name: "비교 실행" }).click();
  await page.getByRole("heading", { name: "Side-by-side metrics" }).waitFor();
  // Wave37 FE6-044 (P6): matrix collapsed by default; open the disclosure.
  await page.getByText("혼동 행렬 자세히 보기", { exact: false }).first().click();
  await screenshot(page, "benchmark-actual-comparison");
  result.routes.push({ name: "benchmark-actual", path, status: response.status() });
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp6-benchmark-actual-api-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({ status: "PASS", artifactPath, apiCheckCount: result.apiChecks.length, routeCount: result.routes.length, ids: result.ids }, null, 2));
