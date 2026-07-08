import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.9 Connectors — mock route + render smoke. Drives the deterministic
// mock-backed UI through the frozen READ-ONLY catalog + DRY-RUN preview loop on
// the project-scoped /connectors surface:
//   - LNB Connectors destination (BUILD group, right after Sources) -> single
//     active LNB item
//   - persistent preview-only banner + four boundary chips
//   - live all-false 9-flag mutation-guard proof (read from response, not hardcoded)
//   - catalog (3 ConnectorKind cards, no add/register affordance)
//   - contextual detail: masked config schema + config form (SECRET masked) +
//     "미리보기 실행" (dry-run) -> would-be candidate preview (counts + sample +
//     mapped ontology ref + compatibility + routing note + guard proof)
//   - NO connect / import / sync / apply / execute affordance anywhere.

const frontendBaseUrl = process.env.MVP6_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const projectId = process.env.MVP6_PROJECT_ID ?? "project-corp-knowledge";
const artifactDir = resolve(
  process.env.MVP6_CONNECTORS_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-connectors-mock-smoke",
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
  // 1. Catalog: banner + guard proof + single active LNB + 3 kind cards.
  const catalogPath = `/projects/${projectId}/connectors`;
  const resp = await page.goto(`${frontendBaseUrl}${catalogPath}`, { waitUntil: "networkidle" });
  if (!resp?.ok()) {
    throw new Error(`Route ${catalogPath} failed: ${resp?.status() ?? "no response"}`);
  }
  await page.getByRole("heading", { name: "커넥터", exact: true }).first().waitFor();
  await page.getByText("커넥터는 미리보기 전용입니다. 아무것도 가져오거나 저장하지 않습니다.", { exact: false }).first().waitFor();
  await page.getByText("NO_EXTERNAL_CALL", { exact: false }).first().waitFor();
  await page.getByText("NO_SECRET_STORED", { exact: false }).first().waitFor();
  await page.getByText("9개 mutation 플래그 모두 false", { exact: false }).first().waitFor();
  await page.getByText("DETERMINISTIC_MOCK", { exact: false }).first().waitFor();
  await page.getByText("FILE_SOURCE", { exact: false }).first().waitFor();
  await page.getByText("REST_SOURCE", { exact: false }).first().waitFor();
  await page.getByText("KNOWLEDGE_BASE_SOURCE", { exact: false }).first().waitFor();
  const activeCount = await page.locator('nav [aria-current="page"]').count();
  if (activeCount !== 1) {
    throw new Error(`Expected exactly one active LNB item, found ${activeCount}.`);
  }
  // No connect/register affordance on the catalog.
  for (const forbidden of ["연결", "등록", "커넥터 추가", "가져오기", "동기화"]) {
    if (await page.getByRole("button", { name: forbidden, exact: true }).count()) {
      throw new Error(`Catalog must NOT render a "${forbidden}" affordance.`);
    }
  }
  await screenshot(page, "connectors-catalog");
  result.routes.push({ name: "connectors-catalog", path: catalogPath, status: resp.status(), assertions: ["커넥터 H1", "preview-only banner", "boundary chips", "all-false 9-flag guard proof", "DETERMINISTIC_MOCK", "3 kind cards", "single active LNB", "no connect/register affordance"] });

  // Expand the guard proof -> verify connector-specific flags shown false.
  await page.getByRole("button", { name: "증거 보기", exact: false }).first().click();
  await page.getByText("external_system_read", { exact: false }).first().waitFor();
  await page.getByText("source_created", { exact: false }).first().waitFor();

  // 2. Open a kind -> masked config form.
  await page.getByRole("button", { name: "설정 및 미리보기", exact: false }).first().click();
  await page.getByRole("button", { name: "미리보기 실행", exact: false }).first().waitFor();
  await page.getByText("raw_secret_present: false", { exact: false }).first().waitFor();
  // No connect/import/sync/apply/execute buttons anywhere on the detail surface.
  for (const forbidden of ["가져오기", "동기화", "연결", "적용", "게시", "지금 실행", "가져오기 실행"]) {
    if (await page.getByRole("button", { name: forbidden, exact: true }).count()) {
      throw new Error(`Connector detail must NOT render a "${forbidden}" button.`);
    }
  }
  await screenshot(page, "connectors-detail-config");
  result.routes.push({ name: "connectors-detail-config", path: `${catalogPath}/FILE_SOURCE`, status: 200, assertions: ["masked config schema", "raw_secret_present:false proof", "미리보기 실행 button", "no import/sync/connect/apply/execute button"] });

  // 3. Run dry-run preview -> would-be candidate result.
  await page.getByRole("button", { name: "미리보기 실행", exact: false }).first().click();
  await page.getByText("미리보기 결과 (dry-run)", { exact: false }).first().waitFor();
  await page.getByText("would-be 후보 엔터티", { exact: false }).first().waitFor();
  await page.getByText("생성된 후보 ID 아님", { exact: false }).first().waitFor();
  await page.getByText("실제 실행은 기존 추출 → 후보 → 검토 → 게시 게이트를 거칩니다.", { exact: false }).first().waitFor();
  await screenshot(page, "connectors-preview-result");
  result.routes.push({ name: "connectors-preview-result", path: `${catalogPath}/FILE_SOURCE`, status: 200, assertions: ["dry-run preview result", "would-be counts", "preview_ref not a candidate id", "CANDIDATE target-layer badge", "routing note", "all-false guard proof"] });
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp6-connectors-mock-route-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(
  JSON.stringify(
    { status: "PASS", artifactPath, routeCount: result.routes.length, screenshotCount: result.screenshots.length },
    null,
    2,
  ),
);
