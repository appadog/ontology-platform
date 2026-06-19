import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const apiBaseUrl = process.env.MVP2_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const frontendBaseUrl = process.env.MVP2_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const artifactDir = resolve(process.env.MVP2_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp2-frontend-smoke");
const runId = new Date().toISOString().replace(/[:.]/g, "-");

await mkdir(artifactDir, { recursive: true });

const result = {
  apiBaseUrl,
  frontendBaseUrl,
  artifactDir,
  routes: [],
  screenshots: [],
  ids: {},
};

function apiPath(path) {
  return `${apiBaseUrl}${path}`;
}

async function requestJson(path, options = {}) {
  const response = await fetch(apiPath(path), {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
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

async function createProject() {
  return requestJson("/api/v1/projects", {
    method: "POST",
    body: JSON.stringify({
      name: `MVP2 Frontend Smoke ${runId}`,
      description: "Wave 11 frontend closeout smoke",
    }),
  });
}

async function uploadCsv(projectId) {
  const form = new FormData();
  const csv = "company_name,department_name,country,founded_year,industry\nAcme Corp,Research,KR,2010,Security\nBeta LLC,Sales,US,,Software\n";
  form.set("source_type", "CSV");
  form.set("display_name", "closeout-companies.csv");
  form.set("file", new Blob([csv], { type: "text/csv" }), "closeout-companies.csv");

  return requestJson(`/api/v1/projects/${projectId}/sources/upload`, {
    method: "POST",
    body: form,
  });
}

async function seedApi() {
  const project = await createProject();
  const version = await requestJson(`/api/v1/projects/${project.id}/ontology/versions`, {
    method: "POST",
    body: JSON.stringify({ created_by: "frontend-smoke" }),
  });
  const company = await requestJson(`/api/v1/ontology/versions/${version.id}/classes`, {
    method: "POST",
    body: JSON.stringify({ name: "Company", label: "Company", position: { x: 120, y: 120 } }),
  });
  const department = await requestJson(`/api/v1/ontology/versions/${version.id}/classes`, {
    method: "POST",
    body: JSON.stringify({ name: "Department", label: "Department", position: { x: 340, y: 120 } }),
  });
  await requestJson(`/api/v1/ontology/versions/${version.id}/relations`, {
    method: "POST",
    body: JSON.stringify({
      name: "HAS_DEPARTMENT",
      label: "Has Department",
      domain_class_id: company.id,
      range_class_id: department.id,
      cardinality: "ONE_TO_MANY",
    }),
  });

  const source = await uploadCsv(project.id);
  const profile = await requestJson(`/api/v1/sources/${source.id}/profile`, { method: "POST", body: JSON.stringify({}) });
  const parse = await requestJson(`/api/v1/sources/${source.id}/parse`, { method: "POST", body: JSON.stringify({}) });
  const prompt = await requestJson(`/api/v1/projects/${project.id}/prompts`, {
    method: "POST",
    body: JSON.stringify({ name: "Closeout extraction prompt", description: "Frontend actual API smoke prompt" }),
  });
  const promptVersion = await requestJson(`/api/v1/prompts/${prompt.id}/versions`, {
    method: "POST",
    body: JSON.stringify({ template: "Extract candidate entities and relations.", output_schema: { type: "object" }, is_active: true }),
  });

  const jobs = {};
  for (const fixtureId of ["default", "partial_invalid", "invalid_evidence_reference", "missing"]) {
    const job = await requestJson(`/api/v1/projects/${project.id}/extraction-jobs`, {
      method: "POST",
      body: JSON.stringify({
        source_id: source.id,
        ontology_version_id: version.id,
        prompt_version_id: promptVersion.id,
        fixture_id: fixtureId,
      }),
    });
    jobs[fixtureId] = await requestJson(`/api/v1/extraction-jobs/${job.id}/run`, { method: "POST", body: JSON.stringify({}) });
  }

  const entities = await requestJson(`/api/v1/extraction-jobs/${jobs.default.id}/candidates/entities?has_evidence=true`);
  const invalidEntities = await requestJson(`/api/v1/extraction-jobs/${jobs.invalid_evidence_reference.id}/candidates/entities?validation_status=FAILED`);
  const evidence = await requestJson(`/api/v1/candidate-evidence/${entities[0].evidence_ids[0]}`);
  const brokenEvidence = await requestJson(`/api/v1/candidate-evidence/${invalidEntities[0].evidence_ids[0]}`);
  const retryJob = await requestJson(`/api/v1/extraction-jobs/${jobs.invalid_evidence_reference.id}/retry`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  const retryRun = await requestJson(`/api/v1/extraction-jobs/${retryJob.id}/run`, { method: "POST", body: JSON.stringify({}) });

  result.ids = {
    project_id: project.id,
    ontology_version_id: version.id,
    source_id: source.id,
    profile_id: profile.id,
    segment_count: parse.segment_count,
    prompt_version_id: promptVersion.id,
    default_job_id: jobs.default.id,
    partial_job_id: jobs.partial_invalid.id,
    invalid_job_id: jobs.invalid_evidence_reference.id,
    missing_job_id: jobs.missing.id,
    retry_job_id: retryRun.id,
    evidence_id: evidence.id,
    broken_evidence_id: brokenEvidence.id,
  };

  return { project, source, jobs, entities, invalidEntities, evidence, brokenEvidence };
}

function evidencePath(evidenceId, candidate, jobId) {
  const params = new URLSearchParams({
    project_id: candidate.project_id,
    source_id: candidate.source_id,
    job_id: jobId,
    candidate_id: candidate.id,
    candidate_kind: "Entity",
    validation_code: candidate.validation_codes[0] ?? candidate.validation_status,
  });

  if (candidate.source_segment_id) {
    params.set("source_segment_id", candidate.source_segment_id);
  }

  return `/candidate-evidence/${evidenceId}?${params.toString()}`;
}

async function assertRoute(path) {
  const response = await fetch(`${frontendBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Frontend route ${path} failed: ${response.status}`);
  }

  result.routes.push(path);
}

async function screenshot(page, name) {
  const path = join(artifactDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  result.screenshots.push(path);
}

async function selectAvailableOption(page, value) {
  await page.waitForFunction((optionValue) => {
    return Array.from(document.querySelectorAll("select")).some((select) =>
      Array.from(select.options).some((option) => option.value === optionValue),
    );
  }, value);

  const index = await page.locator("select").evaluateAll((selects, optionValue) => {
    return selects.findIndex((select) =>
      Array.from(select.options).some((option) => option.value === optionValue),
    );
  }, value);

  if (index < 0) {
    throw new Error(`No select option found for ${value}`);
  }

  await page.locator("select").nth(index).selectOption(value);
}

async function runBrowserSmoke(seed) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const projectPath = `/projects/${seed.project.id}`;
  const sourcePath = `/projects/${seed.project.id}/sources/${seed.source.id}`;
  const profilePath = `${sourcePath}/profile`;
  const chunksPath = `${sourcePath}/chunks`;
  const extractionListPath = `/projects/${seed.project.id}/extraction-jobs`;
  const extractionCreatePath = `/projects/${seed.project.id}/extraction/new`;
  const jobPath = `/extraction-jobs/${seed.jobs.default.id}`;
  const candidatePath = `/extraction-jobs/${seed.jobs.default.id}/candidates`;
  const invalidCandidatePath = `/extraction-jobs/${seed.jobs.invalid_evidence_reference.id}/candidates`;
  const normalEvidencePath = evidencePath(seed.evidence.id, seed.entities[0], seed.jobs.default.id);
  const brokenEvidencePath = evidencePath(seed.brokenEvidence.id, seed.invalidEntities[0], seed.jobs.invalid_evidence_reference.id);
  const directMissingPath = `/candidate-evidence/not-found-${runId}?project_id=${seed.project.id}&source_id=${seed.source.id}&job_id=${seed.jobs.invalid_evidence_reference.id}&candidate_id=${seed.invalidEntities[0].id}&candidate_kind=Entity&validation_code=INVALID_EVIDENCE_REFERENCE&source_segment_id=${seed.invalidEntities[0].source_segment_id}`;

  for (const path of [
    "/dashboard",
    "/projects",
    projectPath,
    sourcePath,
    profilePath,
    chunksPath,
    extractionListPath,
    extractionCreatePath,
    jobPath,
    candidatePath,
    normalEvidencePath,
    brokenEvidencePath,
    directMissingPath,
  ]) {
    await assertRoute(path);
  }

  await page.goto(`${frontendBaseUrl}${sourcePath}`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Profile" }).first().click();
  await page.waitForURL(`**${profilePath}`);
  await page.getByRole("button", { name: /Run profile|Profiling/ }).click();
  await page.getByText("Column profile").waitFor();
  await screenshot(page, "source-profile");

  await page.goto(`${frontendBaseUrl}${chunksPath}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Parse source|Parsing/ }).click();
  await page.getByText("Segments").waitFor();
  await screenshot(page, "source-chunks");

  await page.goto(`${frontendBaseUrl}${jobPath}`, { waitUntil: "networkidle" });
  await page.getByText("Job detail").waitFor();
  await screenshot(page, "job-monitor");

  await page.goto(`${frontendBaseUrl}${invalidCandidatePath}`, { waitUntil: "networkidle" });
  await selectAvailableOption(page, "FAILED");
  await selectAvailableOption(page, "INVALID_EVIDENCE_REFERENCE");
  await page.locator('span[data-tone]', { hasText: "INVALID_EVIDENCE_REFERENCE" }).first().waitFor();
  await screenshot(page, "candidate-filters");

  await page.goto(`${frontendBaseUrl}${normalEvidencePath}`, { waitUntil: "networkidle" });
  await page.getByText("Evidence locator").waitFor();
  await screenshot(page, "evidence-normal");

  await page.goto(`${frontendBaseUrl}${directMissingPath}`, { waitUntil: "networkidle" });
  await page.getByText("Missing or broken evidence").waitFor();
  await screenshot(page, "evidence-direct-missing");

  await browser.close();
}

const seed = await seedApi();
await runBrowserSmoke(seed);

const artifactPath = join(artifactDir, "mvp2-actual-api-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({ status: "PASS", artifactPath, ...result }, null, 2));
