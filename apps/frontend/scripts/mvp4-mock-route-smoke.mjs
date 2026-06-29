import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const frontendBaseUrl = process.env.MVP4_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const projectId = process.env.MVP4_PROJECT_ID ?? "project-corp-knowledge";
const artifactDir = resolve(process.env.MVP4_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp4-frontend-smoke");

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
  await assertRoute(page, `/projects/${projectId}/quality`, "quality-dashboard", [
    // Wave36 D3: page H1 Koreanized (UIUX_REMEDIATION_DECISIONS §3.2). 1:1 string
    // swap of the canonical H1; still asserts the page title rendered.
    { name: "advanced quality title", run: () => page.getByRole("heading", { name: "품질 대시보드" }).waitFor() },
    { name: "metric group marker", run: () => page.getByText("METRIC GROUPS", { exact: true }).waitFor() },
    { name: "formula metadata", run: () => page.getByRole("heading", { name: "Formula explainer" }).waitFor() },
    { name: "formula numerator", run: () => page.getByText("Numerator", { exact: true }).first().waitFor() },
    { name: "formula denominator", run: () => page.getByText("Denominator", { exact: true }).first().waitFor() },
    { name: "formula drilldown target", run: () => page.getByText("Drilldown target", { exact: true }).first().waitFor() },
    { name: "published graph version context", run: () => page.getByText("Published graph version context").waitFor() },
    { name: "rate context marker", run: () => page.getByText("Rate context", { exact: true }).first().waitFor() },
    { name: "no composite score", run: () => page.getByText("NO COMPOSITE SCORE", { exact: true }).waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/search`, "integrated-search", [
    { name: "search title", run: () => page.getByRole("heading", { name: "통합 검색" }).waitFor() },
    { name: "vector fallback", run: () => page.getByText("Keyword fallback in use").waitFor() },
    { name: "published entities group", run: () => page.getByRole("heading", { name: "Published entities" }).waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/rag`, "rag-workspace", [
    { name: "rag title", run: () => page.getByRole("heading", { name: "RAG 답변 작업 공간" }).waitFor() },
    { name: "grounded rag marker", run: () => page.getByText("Grounded RAG", { exact: true }).waitFor() },
    { name: "candidate exclusion copy", run: () => page.getByText("Candidate graph facts are excluded").waitFor() },
    { name: "empty state", run: () => page.getByText("No answer yet").waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/published-graph`, "published-graph-explorer", [
    { name: "graph explorer title", run: () => page.getByRole("heading", { name: "게시 그래프 탐색기" }).waitFor() },
    { name: "published only marker", run: () => page.getByText("PUBLISHED ONLY", { exact: true }).waitFor() },
    { name: "safe too large marker", run: () => page.getByText("SAFE TOO LARGE").waitFor() },
    { name: "published only state", run: () => page.getByText("Published-only graph state").waitFor() },
    { name: "lineage panel", run: () => page.getByRole("heading", { name: "Lineage panel" }).waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/evaluation-datasets`, "evaluation-datasets", [
    { name: "evaluation title", run: () => page.getByRole("heading", { name: "평가 데이터셋" }).waitFor() },
    { name: "golden items", run: () => page.getByRole("heading", { name: "Golden item kinds" }).waitFor() },
    { name: "archived state", run: () => page.getByText("ARCHIVED", { exact: true }).first().waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/prompt-performance`, "prompt-performance", [
    { name: "prompt performance title", run: () => page.getByRole("heading", { name: "프롬프트·모델 성능" }).waitFor() },
    { name: "telemetry unavailable", run: () => page.getByText("Telemetry unavailable").first().waitFor() },
    { name: "failed run state", run: () => page.getByText("FAILED", { exact: true }).first().waitFor() },
  ]);

  await assertRoute(page, `/projects/${projectId}/external-api`, "external-api", [
    { name: "external api title", run: () => page.getByRole("heading", { name: "외부 API" }).waitFor() },
    { name: "dev auth", run: () => page.getByText("DEV_AUTH", { exact: true }).first().waitFor() },
    { name: "read only", run: () => page.getByText("READ ONLY", { exact: true }).waitFor() },
    { name: "read only copy", run: () => page.getByText("read-only").first().waitFor() },
  ]);
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp4-mock-route-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({ status: "PASS", artifactPath, ...result }, null, 2));
