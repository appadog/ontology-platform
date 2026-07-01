import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.4 Gold Set Manager — mock route + render smoke. Drives the deterministic
// mock-backed UI through the frozen P0 loop: open dataset as owner -> see active
// revision + run-pin reproducibility -> gold items -> revision lifecycle ->
// import dry-run (all four compatibility states) -> confirm.

const frontendBaseUrl = process.env.MVP6_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const projectId = process.env.MVP6_PROJECT_ID ?? "project-corp-knowledge";
const datasetId = process.env.MVP6_GOLDSET_DATASET_ID ?? "dataset-corp-knowledge-gold";
const artifactDir = resolve(
  process.env.MVP6_GOLDSET_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-goldset-mock-smoke",
);

await mkdir(artifactDir, { recursive: true });

const result = { frontendBaseUrl, projectId, datasetId, artifactDir, routes: [], screenshots: [] };

async function screenshot(page, name) {
  const path = join(artifactDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  result.screenshots.push(path);
  return path;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  const path = `/projects/${projectId}/evaluation-datasets/${datasetId}/gold-set`;
  const response = await page.goto(`${frontendBaseUrl}${path}`, { waitUntil: "networkidle" });
  if (!response?.ok()) {
    throw new Error(`Route ${path} failed: ${response?.status() ?? "no response"}`);
  }

  // 1. Page shell: KO title, MVP6.4 marker, owner permission band, active revision.
  await page.getByRole("heading", { name: "정답셋 관리" }).waitFor();
  await page.getByText("MVP6.4", { exact: true }).waitFor();
  await page.getByText("소유 전문가 권한", { exact: false }).first().waitFor();
  await page.getByRole("heading", { name: /활성 리비전/ }).first().waitFor();
  await screenshot(page, "goldset-overview");
  result.routes.push({
    name: "goldset-overview",
    path,
    status: response.status(),
    assertions: ["KO title 정답셋 관리", "MVP6.4 marker", "owner permission band", "active revision header"],
  });

  // 2. Reproducibility: run-pin section shows the run pinned to its FROZEN revision.
  await page.getByRole("heading", { name: /실행 → 리비전 고정/ }).waitFor();
  await page.getByText("eval-run-mvp6-pinned", { exact: false }).first().waitFor();
  await page.getByText("기존 실행을 변경하지 않습니다", { exact: false }).first().waitFor();
  await screenshot(page, "goldset-run-pin");
  result.routes.push({
    name: "goldset-run-pin",
    path,
    status: 200,
    assertions: ["run -> revision pin", "pinned run id", "reproducibility safety copy"],
  });

  // 3. Gold items + revision lifecycle. In mock mode the gold-item list is
  // sourced from the MVP6.1 evaluation surface; for this seeded dataset it is
  // empty, so the honest empty state renders. The revision lifecycle table
  // (DRAFT/ACTIVE/FROZEN/ARCHIVED, at-most-one-ACTIVE, D6 badges) always renders.
  await page.getByText("정답 항목", { exact: false }).first().waitFor();
  await page.getByRole("heading", { name: /^리비전$/ }).waitFor();
  await page.getByText("데이터셋당 ACTIVE는 1개", { exact: false }).first().waitFor();
  await page.getByText("FROZEN", { exact: true }).first().waitFor();
  await page.getByText("ARCHIVED", { exact: true }).first().waitFor();
  await screenshot(page, "goldset-items-and-revisions");
  result.routes.push({
    name: "goldset-items-and-revisions",
    path,
    status: 200,
    assertions: ["gold item section", "revision lifecycle table", "at-most-one-ACTIVE copy", "FROZEN/ARCHIVED D6 badges"],
  });

  // 4. Import dry-run before confirm — exercise all four compatibility states.
  await page.getByRole("heading", { name: /가져오기/ }).first().waitFor();
  await page.getByText("드라이런은 아무것도 변경하지 않습니다", { exact: false }).first().waitFor();

  // COMPATIBLE -> shows a confirmable report with a strategy selector.
  await page.getByRole("button", { name: "COMPATIBLE", exact: true }).click();
  await page.getByText("호환성 항목", { exact: false }).first().waitFor();
  await page.getByRole("button", { name: "가져오기 확정" }).waitFor();
  await screenshot(page, "goldset-import-compatible");
  result.routes.push({ name: "goldset-import-compatible", path, status: 200, assertions: ["dry-run report", "confirm enabled"] });

  // WARNING -> requires an explicit acknowledgement checkbox.
  await page.getByRole("button", { name: "WARNING", exact: true }).click();
  await page.getByText("경고를 확인했습니다", { exact: false }).first().waitFor();
  await screenshot(page, "goldset-import-warning");
  result.routes.push({ name: "goldset-import-warning", path, status: 200, assertions: ["warning ack required"] });

  // CONFLICT -> explicit no-auto-merge copy.
  await page.getByRole("button", { name: "CONFLICT", exact: true }).click();
  await page.getByText("자동 병합하지 않습니다", { exact: false }).first().waitFor();
  await screenshot(page, "goldset-import-conflict");
  result.routes.push({ name: "goldset-import-conflict", path, status: 200, assertions: ["conflict no-auto-merge copy"] });

  // INCOMPATIBLE -> blocked, no confirm button.
  await page.getByRole("button", { name: "INCOMPATIBLE", exact: true }).click();
  await page.getByText("INCOMPATIBLE", { exact: false }).first().waitFor();
  await page.getByText("가져오기가 차단되며", { exact: false }).first().waitFor();
  if (await page.getByRole("button", { name: "가져오기 확정" }).count()) {
    throw new Error("INCOMPATIBLE dry-run must NOT render a confirm button (import blocked).");
  }
  await screenshot(page, "goldset-import-incompatible");
  result.routes.push({ name: "goldset-import-incompatible", path, status: 200, assertions: ["incompatible blocked", "no confirm button"] });

  // 5. Confirm a COMPATIBLE import -> non-mutating success notice.
  await page.getByRole("button", { name: "COMPATIBLE", exact: true }).click();
  await page.getByRole("button", { name: "가져오기 확정" }).click();
  await page.getByText("가져오기를 확정했습니다", { exact: false }).first().waitFor();
  await page.getByText("기존 실행은 변경되지 않습니다", { exact: false }).first().waitFor();
  await screenshot(page, "goldset-import-confirmed");
  result.routes.push({ name: "goldset-import-confirmed", path, status: 200, assertions: ["confirm success", "non-mutating notice"] });

  // 6. Authoring audit log disclosure.
  await page.getByText("감사 로그 자세히 보기", { exact: false }).first().click();
  await screenshot(page, "goldset-audit");
  result.routes.push({ name: "goldset-audit", path, status: 200, assertions: ["authoring audit log"] });
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp6-goldset-mock-route-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(
  JSON.stringify(
    { status: "PASS", artifactPath, routeCount: result.routes.length, screenshotCount: result.screenshots.length },
    null,
    2,
  ),
);
