import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const apiBaseUrl = process.env.MVP6_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const frontendBaseUrl = process.env.MVP6_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const artifactDir = resolve(process.env.MVP6_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-actual-frontend-smoke");
const runId = new Date().toISOString().replace(/[:.]/g, "-");

const metricNames = [
  "ENTITY_PRECISION",
  "ENTITY_RECALL",
  "ENTITY_F1",
  "RELATION_PRECISION",
  "RELATION_RECALL",
  "RELATION_F1",
  "RELATION_DIRECTION_ACCURACY",
  "EVIDENCE_MATCH_RATE",
];

await mkdir(artifactDir, { recursive: true });

const result = {
  apiBaseUrl,
  frontendBaseUrl,
  artifactDir,
  apiChecks: [],
  routes: [],
  screenshots: [],
  ids: {},
};

function apiPath(path) {
  return `${apiBaseUrl}${path}`;
}

function unwrapItems(payload) {
  return Array.isArray(payload) ? payload : payload.items ?? [];
}

async function requestJson(path, options = {}) {
  const response = await fetch(apiPath(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} failed: ${response.status} ${text}`);
  }

  return data;
}

function recordApiCheck(name, details) {
  result.apiChecks.push({ name, ...details });
}

function assertMetricSet(metrics, label) {
  const byName = new Map(metrics.map((metric) => [metric.metric_name, metric]));

  for (const name of metricNames) {
    const metric = byName.get(name);

    if (!metric) {
      throw new Error(`${label} is missing metric ${name}.`);
    }
    if (!metric.formula || typeof metric.numerator !== "number" || typeof metric.denominator !== "number") {
      throw new Error(`${label} metric ${name} is missing formula or count context.`);
    }
    if (metric.status === "NOT_APPLICABLE") {
      if (metric.value !== null || metric.denominator !== 0) {
        throw new Error(`${label} metric ${name} must be null with denominator 0 when NOT_APPLICABLE.`);
      }
    } else if (metric.status !== "MEASURED" || typeof metric.value !== "number") {
      throw new Error(`${label} metric ${name} has invalid status/value: ${metric.status}.`);
    }
  }
}

async function createProject() {
  return requestJson("/api/v1/projects", {
    method: "POST",
    body: JSON.stringify({
      name: `MVP6 Actual Smoke ${runId}`,
      description: "Wave29 frontend actual API smoke project",
    }),
  });
}

function evidence(sample, quote, offsetStart = 0) {
  return {
    sample_id: sample.id,
    source_id: sample.source_id,
    source_segment_id: sample.source_segment_id,
    locator: sample.source_locator,
    offset_start: offsetStart,
    offset_end: offsetStart + quote.length,
    quote,
  };
}

async function seedActualApi() {
  const project = await createProject();
  const ontologyVersion = await requestJson(`/api/v1/projects/${project.id}/ontology/versions`, {
    method: "POST",
    body: JSON.stringify({ created_by: "frontend-mvp6-smoke" }),
  });
  const dataset = await requestJson(`/api/v1/projects/${project.id}/evaluation-datasets`, {
    method: "POST",
    body: JSON.stringify({
      name: `MVP6 Actual Smoke Dataset ${runId}`,
      description: "Self-seeded Wave29 MVP6.1 actual smoke dataset",
    }),
  });
  const sample = await requestJson(`/api/v1/evaluation-datasets/${dataset.id}/samples`, {
    method: "POST",
    body: JSON.stringify({
      sample_kind: "MANUAL_TEXT",
      title: "MVP6 actual ownership sample",
      content_text: "Acme Corp owns Beta Dept. Missing LLC is absent from predictions.",
      source_id: `source-mvp6-smoke-${runId}`,
      source_segment_id: `segment-mvp6-smoke-${runId}`,
      source_locator: `manual:mvp6-smoke:${runId}`,
      metadata: {
        smoke: "mvp6-actual",
        wave: "29",
      },
    }),
  });
  const acme = await requestJson(`/api/v1/evaluation-datasets/${dataset.id}/gold-entities`, {
    method: "POST",
    body: JSON.stringify({
      sample_id: sample.id,
      ontology_class_id: "class-company",
      label: "Acme Corp",
      normalized_value: "acme corp",
      evidence: evidence(sample, "Acme Corp", 0),
    }),
  });
  const beta = await requestJson(`/api/v1/evaluation-datasets/${dataset.id}/gold-entities`, {
    method: "POST",
    body: JSON.stringify({
      sample_id: sample.id,
      ontology_class_id: "class-department",
      label: "Beta Dept",
      normalized_value: "beta dept",
      evidence: evidence(sample, "Beta Dept", 15),
    }),
  });
  const missing = await requestJson(`/api/v1/evaluation-datasets/${dataset.id}/gold-entities`, {
    method: "POST",
    body: JSON.stringify({
      sample_id: sample.id,
      ontology_class_id: "class-company",
      label: "Missing LLC",
      normalized_value: "missing llc",
      evidence: evidence(sample, "Missing LLC", 26),
    }),
  });
  const ownsRelation = await requestJson(`/api/v1/evaluation-datasets/${dataset.id}/gold-relations`, {
    method: "POST",
    body: JSON.stringify({
      sample_id: sample.id,
      ontology_relation_id: "relation-owns",
      source_gold_entity_id: acme.id,
      target_gold_entity_id: beta.id,
      evidence: evidence(sample, "Acme Corp owns Beta Dept", 0),
    }),
  });
  const directionRelation = await requestJson(`/api/v1/evaluation-datasets/${dataset.id}/gold-relations`, {
    method: "POST",
    body: JSON.stringify({
      sample_id: sample.id,
      ontology_relation_id: "relation-extra",
      source_gold_entity_id: acme.id,
      target_gold_entity_id: beta.id,
      evidence: evidence(sample, "Acme Corp owns Beta Dept", 0),
    }),
  });
  const run = await requestJson(`/api/v1/projects/${project.id}/evaluation-runs`, {
    method: "POST",
    body: JSON.stringify({
      dataset_id: dataset.id,
      run_mode: "DETERMINISTIC_MOCK",
      ontology_version_id: ontologyVersion.id,
      prompt_version_id: `prompt-version-mvp6-smoke-${runId}`,
      model_name: "deterministic-mock",
      parser_version: "parser-mvp6-smoke-v1",
    }),
  });
  const runDetail = await requestJson(`/api/v1/evaluation-runs/${run.id}`);
  const metrics = unwrapItems(await requestJson(`/api/v1/evaluation-runs/${run.id}/metrics`));
  const errors = unwrapItems(await requestJson(`/api/v1/evaluation-runs/${run.id}/errors`));
  const errorDetails = await Promise.all(errors.map((error) => requestJson(`/api/v1/evaluation-error-cases/${error.id}`)));

  const emptyDataset = await requestJson(`/api/v1/projects/${project.id}/evaluation-datasets`, {
    method: "POST",
    body: JSON.stringify({
      name: `MVP6 Actual Empty Dataset ${runId}`,
      description: "Zero-denominator metric guard for Wave29 smoke",
    }),
  });
  const emptyRun = await requestJson(`/api/v1/projects/${project.id}/evaluation-runs`, {
    method: "POST",
    body: JSON.stringify({
      dataset_id: emptyDataset.id,
      run_mode: "DETERMINISTIC_MOCK",
      ontology_version_id: ontologyVersion.id,
      prompt_version_id: `prompt-version-mvp6-empty-${runId}`,
      model_name: "deterministic-mock",
      model_run_id: `model-run-mvp6-empty-${runId}`,
      parser_version: "parser-mvp6-smoke-v1",
    }),
  });
  const emptyMetrics = unwrapItems(await requestJson(`/api/v1/evaluation-runs/${emptyRun.id}/metrics`));

  if (runDetail.status !== "SUCCEEDED") {
    throw new Error(`Expected run status SUCCEEDED, received ${runDetail.status}.`);
  }
  for (const field of ["ontology_version_id", "prompt_version_id", "model_name", "model_run_id", "parser_version"]) {
    if (!runDetail[field]) {
      throw new Error(`Run detail is missing ${field}.`);
    }
  }

  assertMetricSet(metrics, "MVP6 actual run");
  assertMetricSet(emptyMetrics, "MVP6 empty run");
  if (!emptyMetrics.every((metric) => metric.status === "NOT_APPLICABLE" && metric.value === null && metric.denominator === 0)) {
    throw new Error("Empty MVP6 run must keep all zero-denominator metrics as NOT_APPLICABLE with null values.");
  }

  const entityError = errorDetails.find((error) => error.candidate_ref?.candidate_kind === "ENTITY");
  const relationError = errorDetails.find((error) => error.candidate_ref?.candidate_kind === "RELATION");

  if (!entityError?.candidate_ref?.sample_id || !entityError.candidate_ref.ontology_class_id) {
    throw new Error("Expected entity candidate_ref with sample_id and ontology_class_id.");
  }
  if (
    !relationError?.candidate_ref?.sample_id ||
    !relationError.candidate_ref.ontology_relation_id ||
    !relationError.candidate_ref.source_gold_entity_id ||
    !relationError.candidate_ref.target_gold_entity_id
  ) {
    throw new Error("Expected relation candidate_ref with sample_id, ontology_relation_id, and endpoint ids.");
  }
  if (!errorDetails.every((error) => error.comparison_summary && (error.gold_evidence || error.candidate_evidence || error.candidate_ref))) {
    throw new Error("Every error case must retain comparison and evidence/candidate context.");
  }

  result.ids = {
    project_id: project.id,
    ontology_version_id: ontologyVersion.id,
    dataset_id: dataset.id,
    sample_id: sample.id,
    gold_entity_ids: [acme.id, beta.id, missing.id],
    gold_relation_ids: [ownsRelation.id, directionRelation.id],
    run_id: run.id,
    empty_dataset_id: emptyDataset.id,
    empty_run_id: emptyRun.id,
    relation_candidate_id: relationError.candidate_ref.candidate_id,
  };

  recordApiCheck("dataset-sample-gold", {
    dataset_id: dataset.id,
    sample_id: sample.id,
    gold_entity_count: 3,
    gold_relation_count: 2,
  });
  recordApiCheck("run-context", {
    run_id: runDetail.id,
    status: runDetail.status,
    ontology_version_id: runDetail.ontology_version_id,
    prompt_version_id: runDetail.prompt_version_id,
    model_run_id: runDetail.model_run_id,
    parser_version: runDetail.parser_version,
  });
  recordApiCheck("metrics", {
    run_id: run.id,
    metric_count: metrics.length,
    empty_metric_count: emptyMetrics.length,
    not_applicable_metrics: emptyMetrics.filter((metric) => metric.status === "NOT_APPLICABLE").length,
  });
  recordApiCheck("errors", {
    error_count: errors.length,
    error_types: errors.map((error) => error.error_type),
    relation_candidate_id: relationError.candidate_ref.candidate_id,
  });

  return { project, dataset, sample, run: runDetail, metrics, errorDetails, relationError };
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

const seed = await seedActualApi();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  await assertRoute(page, `/projects/${seed.project.id}/evaluation-datasets/${seed.dataset.id}`, "evaluation-datasets-mvp6-actual", [
    // Wave36 D3: page H1 Koreanized (UIUX_REMEDIATION_DECISIONS section 3.2). 1:1 swap.
    { name: "evaluation title", run: () => page.getByRole("heading", { name: "평가 데이터셋" }).waitFor() },
    { name: "mvp6 marker", run: () => page.getByText("MVP6.1", { exact: true }).waitFor() },
    { name: "actual dataset", run: () => page.getByText(seed.dataset.name, { exact: true }).first().waitFor() },
    { name: "actual sample", run: () => page.getByText(seed.sample.title, { exact: true }).first().waitFor() },
    { name: "gold entity", run: () => page.getByText("Acme Corp", { exact: true }).first().waitFor() },
    { name: "gold relation", run: () => page.getByText("relation-owns", { exact: true }).first().waitFor() },
    { name: "deterministic run", run: () => page.getByRole("heading", { name: "Deterministic Run" }).waitFor() },
    { name: "run succeeded", run: () => page.getByText("SUCCEEDED", { exact: true }).first().waitFor() },
    { name: "benchmark metrics", run: () => page.getByRole("heading", { name: "Benchmark metrics" }).waitFor() },
    { name: "entity precision", run: () => page.getByText("ENTITY_PRECISION", { exact: true }).waitFor() },
    { name: "direction metric", run: () => page.getByText("RELATION_DIRECTION_ACCURACY", { exact: true }).waitFor() },
    { name: "error explorer", run: () => page.getByRole("heading", { name: "Error Case Explorer" }).waitFor() },
    { name: "wrong direction error", run: () => page.getByText("WRONG_RELATION_DIRECTION", { exact: true }).waitFor() },
    { name: "relation candidate context", run: () => page.getByText(seed.relationError.candidate_ref.candidate_id).first().waitFor() },
  ]);
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp6-actual-api-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(
  JSON.stringify(
    {
      status: "PASS",
      artifactPath,
      apiCheckCount: result.apiChecks.length,
      routeCount: result.routes.length,
      screenshotCount: result.screenshots.length,
      ids: result.ids,
    },
    null,
    2,
  ),
);
