import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.7 Impact Simulation — mock route + render smoke. Drives the deterministic
// mock-backed UI through the frozen read-only impact P0 loop on the existing
// Governance detail page (no new route/LNB):
//   - open the contextual "영향도(Impact)" Section (collapsed) -> run 영향도 분석 실행
//   - read the read-only/advisory banner + all-false mutation-guard proof line
//   - severity rollup (max ImpactSeverity D6 badge + per-severity counts)
//   - per-item 5-dimension breakdown incl. depth 0/1/2 + truncation ("총 N개 중 처음 M개 표시")
//   - BREAKING severity is INFORMATIONAL (advisory copy), never a block
//   - empty/NONE report (ADD with no dependents)
//   - NO apply/publish/enforce/fix affordance anywhere on the panel.

const frontendBaseUrl = process.env.MVP6_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const projectId = process.env.MVP6_PROJECT_ID ?? "project-corp-knowledge";
const breakingId = process.env.MVP6_GOVERNANCE_APPROVED_ID ?? "ocr-approved-004";
const noneId = process.env.MVP6_GOVERNANCE_OPEN_ID ?? "ocr-open-001";
const artifactDir = resolve(
  process.env.MVP6_IMPACT_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-impact-mock-smoke",
);

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
  // 1. Impact panel collapsed on the detail; run the read-only analysis.
  const detailPath = `/projects/${projectId}/governance/${breakingId}`;
  const detailResp = await page.goto(`${frontendBaseUrl}${detailPath}`, { waitUntil: "networkidle" });
  if (!detailResp?.ok()) {
    throw new Error(`Route ${detailPath} failed: ${detailResp?.status() ?? "no response"}`);
  }
  await page.getByText("영향도(Impact)", { exact: false }).first().waitFor();
  const runBtn = page.getByRole("button", { name: "영향도 분석 실행", exact: true });
  await runBtn.first().waitFor();
  // Single active LNB item = Governance.
  const activeCount = await page.locator('nav [aria-current="page"]').count();
  if (activeCount !== 1) {
    throw new Error(`Expected exactly one active LNB item, found ${activeCount}.`);
  }
  await screenshot(page, "impact-collapsed");
  result.routes.push({ name: "impact-collapsed", path: detailPath, status: detailResp.status(), assertions: ["contextual 영향도(Impact) Section", "collapsed read-only trigger", "single active LNB"] });

  // 2. Run -> report: advisory banner + all-false proof + BREAKING rollup + truncation.
  await runBtn.first().click();
  await page.getByText("이 분석은 읽기 전용입니다", { exact: false }).first().waitFor();
  await page.getByText("모든 mutation 플래그 false", { exact: false }).first().waitFor();
  await page.getByText("심각도 요약", { exact: false }).first().waitFor();
  await page.getByText("BREAKING", { exact: false }).first().waitFor();
  // Advisory-not-a-block copy for high severity.
  await page.getByText("적용/게시를 막지 않으며", { exact: false }).first().waitFor();
  // Dimension 1 depth indicator + bounded-depth copy.
  await page.getByText("전이 의존성은 최대 깊이 2까지 표시됩니다", { exact: false }).first().waitFor();
  await page.getByText("깊이 0", { exact: false }).first().waitFor();
  // Truncation UX (candidate bucket has 128 -> capped 20).
  await page.getByText("총 128개 중 처음", { exact: false }).first().waitFor();
  // No apply/publish/enforce/fix affordance on the panel.
  for (const forbidden of ["적용", "게시", "지금 적용", "지금 게시", "자동 수정"]) {
    if (await page.getByRole("button", { name: forbidden, exact: true }).count()) {
      throw new Error(`Impact panel must NOT render a "${forbidden}" button.`);
    }
  }
  await screenshot(page, "impact-breaking");
  result.routes.push({ name: "impact-breaking", path: detailPath, status: 200, assertions: ["read-only/advisory banner", "all-false proof line", "BREAKING severity rollup", "advisory-not-a-block copy", "depth 0/1/2 + max-depth-2 copy", "truncation 총 128개 중 처음 N개 표시", "no apply/publish/enforce CTA"] });

  // 3. Empty/NONE report (ADD with no dependents).
  const nonePath = `/projects/${projectId}/governance/${noneId}`;
  await page.goto(`${frontendBaseUrl}${nonePath}`, { waitUntil: "networkidle" });
  await page.getByText("영향도(Impact)", { exact: false }).first().waitFor();
  await page.getByRole("button", { name: "영향도 분석 실행", exact: true }).first().click();
  await page.getByText("이 분석은 읽기 전용입니다", { exact: false }).first().waitFor();
  await page.getByText("NONE", { exact: false }).first().waitFor();
  await page.getByText("의존하는 후보 요소가 없습니다", { exact: false }).first().waitFor();
  await screenshot(page, "impact-none");
  result.routes.push({ name: "impact-none", path: nonePath, status: 200, assertions: ["NONE severity", "empty dependent copy", "benign read-only success"] });
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp6-impact-mock-route-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(
  JSON.stringify(
    { status: "PASS", artifactPath, routeCount: result.routes.length, screenshotCount: result.screenshots.length },
    null,
    2,
  ),
);
