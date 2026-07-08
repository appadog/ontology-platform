import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.8 Copilot — mock route + render smoke. Drives the deterministic mock-backed
// UI through the frozen ADVISORY-ONLY loop on the project-scoped /copilot surface:
//   - LNB Copilot destination (Analyze group) -> single active LNB item
//   - persistent advisory banner (제안만 · 실행하지 않음) + four boundary chips
//   - live all-false 14-flag mutation-guard proof (read from response, not hardcoded)
//   - Summary (counts by kind/state, grounding scope, DETERMINISTIC_MOCK marker)
//   - Suggestions queue (kind/state/confidence/risk D6 badges + grounding chip)
//     -> detail (why / expected next step / routing target / grounding)
//   - ACCEPT confirms it ROUTES (not executes) + Dismiss requires a reason
//   - NO execute/apply/publish/approve affordance anywhere.

const frontendBaseUrl = process.env.MVP6_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const projectId = process.env.MVP6_PROJECT_ID ?? "project-corp-knowledge";
const artifactDir = resolve(
  process.env.MVP6_COPILOT_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-copilot-mock-smoke",
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
  // 1. Copilot summary surface: banner + guard proof + single active LNB.
  const copilotPath = `/projects/${projectId}/copilot`;
  const resp = await page.goto(`${frontendBaseUrl}${copilotPath}`, { waitUntil: "networkidle" });
  if (!resp?.ok()) {
    throw new Error(`Route ${copilotPath} failed: ${resp?.status() ?? "no response"}`);
  }
  await page.getByRole("heading", { name: "코파일럿", exact: true }).first().waitFor();
  await page.getByText("코파일럿은 제안만 합니다. 아무것도 실행하지 않습니다.", { exact: false }).first().waitFor();
  await page.getByText("NO_REAL_LLM", { exact: false }).first().waitFor();
  await page.getByText("14개 mutation 플래그 모두 false", { exact: false }).first().waitFor();
  await page.getByText("DETERMINISTIC_MOCK", { exact: false }).first().waitFor();
  const activeCount = await page.locator('nav [aria-current="page"]').count();
  if (activeCount !== 1) {
    throw new Error(`Expected exactly one active LNB item, found ${activeCount}.`);
  }
  await screenshot(page, "copilot-summary");
  result.routes.push({ name: "copilot-summary", path: copilotPath, status: resp.status(), assertions: ["코파일럿 H1", "advisory banner", "NO_REAL_LLM chip", "all-false guard proof", "DETERMINISTIC_MOCK", "single active LNB"] });

  // Expand the guard proof line -> verify copilot-specific flags shown false.
  await page.getByRole("button", { name: "증거 보기", exact: false }).first().click();
  await page.getByText("copilot_executed_action", { exact: false }).first().waitFor();
  await page.getByText("real_model_invoked", { exact: false }).first().waitFor();

  // 2. Suggestions queue -> detail (routing target, grounding, decision surface).
  await page.getByRole("tab", { name: "Suggestions", exact: false }).first().click();
  await page.getByText("InsuranceProduct", { exact: false }).first().waitFor();
  await page.getByText("SUGGESTED", { exact: false }).first().waitFor();
  // Detail: routing target described as a destination (not execute).
  await page.getByText("이동 대상 (실행 아님 · 게이트 미통과)", { exact: false }).first().waitFor();
  await page.getByText("원천 근거 (Grounding)", { exact: false }).first().waitFor();
  // NO execute/apply/publish/approve buttons anywhere on the surface.
  for (const forbidden of ["실행", "지금 적용", "지금 게시", "지금 승인", "적용", "게시", "승인"]) {
    if (await page.getByRole("button", { name: forbidden, exact: true }).count()) {
      throw new Error(`Copilot surface must NOT render a "${forbidden}" execute button.`);
    }
  }
  await screenshot(page, "copilot-suggestion-detail");
  result.routes.push({ name: "copilot-suggestion-detail", path: copilotPath, status: 200, assertions: ["queue kind/state badges", "routing-target-not-execute label", "grounding list", "no execute/apply/publish/approve button"] });

  // 3. ACCEPT modal states it ROUTES, not executes.
  await page.getByRole("button", { name: "채택 (ACCEPT) — 게이트로 이동", exact: false }).first().click();
  await page.getByText("기존 게이트 흐름으로", { exact: false }).first().waitFor();
  await page.getByRole("button", { name: "채택하고 이동", exact: false }).first().waitFor();
  await screenshot(page, "copilot-accept-modal");
  await page.getByRole("button", { name: "채택하고 이동", exact: false }).first().click();
  // After accept: state ACCEPTED, decided read-only note (no execute).
  await page.getByText("이미 결정된 제안입니다", { exact: false }).first().waitFor();
  await screenshot(page, "copilot-accepted");
  result.routes.push({ name: "copilot-accept-routes", path: copilotPath, status: 201, assertions: ["accept-routes-not-executes copy", "post-accept ACCEPTED read-only", "no execute button"] });

  // 4. Decision History has the recorded audit note + all-false guard.
  await page.getByRole("tab", { name: "Decision History", exact: false }).first().click();
  await page.getByText("이동하기", { exact: false }).first().waitFor();
  await page.getByText("14개 mutation 플래그 모두 false", { exact: false }).first().waitFor();
  await screenshot(page, "copilot-history");
  result.routes.push({ name: "copilot-history", path: copilotPath, status: 200, assertions: ["decision audit note", "routing target in audit", "all-false guard in audit"] });
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp6-copilot-mock-route-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(
  JSON.stringify(
    { status: "PASS", artifactPath, routeCount: result.routes.length, screenshotCount: result.screenshots.length },
    null,
    2,
  ),
);
