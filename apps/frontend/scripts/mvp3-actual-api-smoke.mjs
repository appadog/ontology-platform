import { chromium } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const apiBaseUrl = process.env.MVP3_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const frontendBaseUrl = process.env.MVP3_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const seedJsonPath = resolve(process.env.MVP3_SEED_JSON ?? "/tmp/ontology-wave17-mvp3-seed.json");
const artifactDir = resolve(process.env.MVP3_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp3-frontend-smoke");

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

async function requestJson(path) {
  const response = await fetch(apiPath(path));
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.status} ${text}`);
  }

  return data;
}

async function readSeedJson() {
  let text;

  try {
    text = await readFile(seedJsonPath, "utf8");
  } catch (error) {
    throw new Error(
      `MVP3 seed JSON was not readable at ${seedJsonPath}. Run the backend seed helper first or set MVP3_SEED_JSON. ${error.message}`,
    );
  }

  const seed = JSON.parse(text);

  if (!seed.project_id || !seed.review_task_id) {
    throw new Error("MVP3 seed JSON must include project_id and review_task_id.");
  }

  return seed;
}

function recordApiCheck(name, details) {
  result.apiChecks.push({ name, ...details });
}

function uniqueReasonCodes(candidates, jobs) {
  return Array.from(
    new Set([
      ...candidates.flatMap((candidate) => candidate.reasons ?? []),
      ...jobs.flatMap((job) => job.skip_reasons ?? []).flatMap((eligibility) => eligibility.reasons ?? []),
    ]),
  ).sort();
}

async function assertSeededApi(seed) {
  const project = await requestJson(`/api/v1/projects/${seed.project_id}`);
  const reviewTasks = await requestJson(`/api/v1/projects/${seed.project_id}/review-tasks?limit=20&offset=0`);
  const reviewTask = await requestJson(`/api/v1/review-tasks/${seed.review_task_id}`);
  const publishCandidates = await requestJson(`/api/v1/projects/${seed.project_id}/publish-candidates`);
  const publishJobs = await requestJson(`/api/v1/projects/${seed.project_id}/publish-jobs`);
  const publishedGraph = await requestJson(`/api/v1/projects/${seed.project_id}/published-graph/current`);
  const quality = await requestJson(`/api/v1/projects/${seed.project_id}/quality/summary`);

  if (project.id !== seed.project_id) {
    throw new Error(`Seeded project mismatch: expected ${seed.project_id}, received ${project.id}`);
  }
  if (!reviewTasks.items?.length) {
    throw new Error("Seeded review inbox is empty.");
  }
  if (reviewTask.id !== seed.review_task_id) {
    throw new Error(`Seeded review task mismatch: expected ${seed.review_task_id}, received ${reviewTask.id}`);
  }
  if (!publishCandidates.length) {
    throw new Error("Seeded publish candidate queue is empty.");
  }
  if (!publishJobs.length) {
    throw new Error("Seeded publish job list is empty.");
  }
  if (!publishedGraph.entities?.length && !publishedGraph.relations?.length) {
    throw new Error("Seeded current published graph has no published facts.");
  }
  if (!quality.rates?.published_ratio || !quality.candidate_counts?.total) {
    throw new Error("Seeded quality summary is missing typed metric groups or published_ratio.");
  }

  const reasonCodes = uniqueReasonCodes(publishCandidates, publishJobs);
  const expectedReasonCodes = seed.api_checks?.publish_reason_codes ?? ["ELIGIBLE"];
  const missingReasonCodes = expectedReasonCodes.filter((reason) => !reasonCodes.includes(reason));

  if (missingReasonCodes.length > 0) {
    throw new Error(`Seeded publish queue is missing reason codes: ${missingReasonCodes.join(", ")}`);
  }

  recordApiCheck("project", { id: project.id, name: project.name });
  recordApiCheck("review-inbox", { total_count: reviewTasks.total_count, rendered_count: reviewTasks.items.length });
  recordApiCheck("review-workbench", {
    review_task_id: reviewTask.id,
    candidate_display_name: reviewTask.candidate_display_name,
    candidate_kind: reviewTask.candidate_kind,
  });
  recordApiCheck("publish-queue", { candidate_count: publishCandidates.length, job_count: publishJobs.length, reasonCodes });
  recordApiCheck("published-graph", {
    version_id: publishedGraph.version.id,
    version: publishedGraph.version.version,
    entity_count: publishedGraph.entities.length,
    relation_count: publishedGraph.relations.length,
    first_fact: publishedGraph.entities[0]?.canonical_name ?? publishedGraph.relations[0]?.id,
  });
  recordApiCheck("quality", {
    total_candidates: quality.candidate_counts.total.value,
    published_ratio: quality.rates.published_ratio,
  });

  return { project, reviewTask, publishCandidates, publishJobs, publishedGraph, quality, reasonCodes };
}

async function screenshot(page, name) {
  const path = join(artifactDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  result.screenshots.push(path);
  return path;
}

async function assertFrontendRoute(page, path, name, assertions) {
  const response = await page.goto(`${frontendBaseUrl}${path}`, { waitUntil: "networkidle" });

  if (!response?.ok()) {
    throw new Error(`Frontend route ${path} failed: ${response?.status() ?? "no response"}`);
  }

  await page.getByText("Review to published facts").waitFor();

  const passedAssertions = [];

  for (const assertion of assertions) {
    await assertion.run();
    passedAssertions.push(assertion.name);
  }

  const screenshotPath = await screenshot(page, name);
  result.routes.push({ name, path, status: response.status(), assertions: passedAssertions, screenshotPath });
}

async function runBrowserSmoke(seed, apiState) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const projectId = seed.project_id;
  const expectedRoutes = seed.recommended_frontend_routes ?? [
    `/projects/${projectId}/review`,
    `/projects/${projectId}/review/${seed.review_task_id}`,
    `/projects/${projectId}/publish`,
    `/projects/${projectId}/published-graph`,
    `/projects/${projectId}/quality`,
  ];
  const [reviewRoute, workbenchRoute, publishRoute, publishedGraphRoute, qualityRoute] = expectedRoutes;

  try {
    await assertFrontendRoute(page, reviewRoute, "review-inbox", [
      { name: "review inbox title", run: () => page.getByRole("heading", { name: "Review Inbox" }).waitFor() },
      { name: "review task queue marker", run: () => page.getByText("review tasks").first().waitFor() },
      { name: "wrapped queue response", run: () => page.getByText("Queue response").waitFor() },
    ]);

    await assertFrontendRoute(page, workbenchRoute, "review-workbench", [
      { name: "workbench title", run: () => page.getByRole("heading", { name: "Review Workbench" }).waitFor() },
      { name: "seeded task candidate", run: () => page.getByText(apiState.reviewTask.candidate_display_name).first().waitFor() },
      { name: "decision actions", run: () => page.getByText("Decision actions").waitFor() },
    ]);

    await assertFrontendRoute(page, publishRoute, "publish-queue", [
      { name: "publish queue title", run: () => page.getByRole("heading", { name: "Publish Queue" }).waitFor() },
      { name: "candidate eligibility", run: () => page.getByText("Candidate eligibility").waitFor() },
      ...apiState.reasonCodes.map((reason) => ({
        name: `reason code ${reason}`,
        run: () => page.getByText(reason, { exact: true }).first().waitFor(),
      })),
    ]);

    await assertFrontendRoute(page, publishedGraphRoute, "published-graph", [
      { name: "published graph title", run: () => page.getByRole("heading", { name: "Published Graph" }).waitFor() },
      { name: "published facts marker", run: () => page.getByText("PUBLISHED FACTS", { exact: true }).waitFor() },
      { name: "current snapshot", run: () => page.getByRole("heading", { name: "Current snapshot" }).waitFor() },
      { name: "published facts list", run: () => page.getByText("Published entities and relations").waitFor() },
      {
        name: "seeded published fact",
        run: () => page.getByText(apiState.publishedGraph.entities[0]?.canonical_name ?? "Published entities and relations").first().waitFor(),
      },
    ]);

    await assertFrontendRoute(page, qualityRoute, "quality-dashboard", [
      { name: "quality title", run: () => page.getByRole("heading", { name: "Quality Dashboard" }).waitFor() },
      { name: "typed candidate metrics", run: () => page.getByRole("heading", { name: "Candidates", exact: true }).waitFor() },
      { name: "typed validation metrics", run: () => page.getByRole("heading", { name: "Validation", exact: true }).waitFor() },
      { name: "typed review metrics", run: () => page.getByRole("heading", { name: "Review", exact: true }).waitFor() },
      { name: "typed publish metrics", run: () => page.getByRole("heading", { name: "Publish", exact: true }).waitFor() },
      { name: "published ratio", run: () => page.getByText("Published ratio").waitFor() },
      {
        name: "seeded published ratio value",
        run: () =>
          page
            .getByText(
              `Published ratio · ${apiState.quality.rates.published_ratio.numerator}/${apiState.quality.rates.published_ratio.denominator}`,
            )
            .waitFor(),
      },
    ]);
  } finally {
    await browser.close();
  }
}

const seed = await readSeedJson();
const apiState = await assertSeededApi(seed);
await runBrowserSmoke(seed, apiState);

const artifactPath = join(artifactDir, "mvp3-actual-api-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({ status: "PASS", artifactPath, ...result }, null, 2));
