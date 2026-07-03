import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.6 Governance change application — mock route + render smoke. Drives the
// deterministic mock-backed UI through the frozen apply P0 loop on the existing
// Governance detail page (no new route/LNB):
//   - open an APPROVED+QUEUED request -> read-only application pre-check panel
//     (target DRAFT version + per-item before/after + advisory staleness hint)
//   - press 초안에 적용 -> required human-confirmation modal (draft-only + publish
//     separate) -> 적용 -> APPLIED success badge (초안에 적용됨 (미게시)) +
//     applied-not-published banner + one-true-flag proof (ontology_draft_mutated=true)
//   - staleness fixture: apply -> non-destructive SUPERSEDED conflict notice +
//     SUPERSEDED (대체됨 (미적용)) badge, nothing applied, terminal
//   - NO 게시/배포/apply-and-publish CTA anywhere.

const frontendBaseUrl = process.env.MVP6_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const projectId = process.env.MVP6_PROJECT_ID ?? "project-corp-knowledge";
const approvedId = process.env.MVP6_GOVERNANCE_APPROVED_ID ?? "ocr-approved-004";
const staleId = process.env.MVP6_GOVERNANCE_STALE_ID ?? "ocr-approved-stale-007";
const artifactDir = resolve(
  process.env.MVP6_GOVERNANCE_APPLY_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-governance-apply-mock-smoke",
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
  // 1. APPROVED+QUEUED detail: read-only application pre-check panel + apply action.
  const detailPath = `/projects/${projectId}/governance/${approvedId}`;
  const detailResp = await page.goto(`${frontendBaseUrl}${detailPath}`, { waitUntil: "networkidle" });
  if (!detailResp?.ok()) {
    throw new Error(`Route ${detailPath} failed: ${detailResp?.status() ?? "no response"}`);
  }
  await page.getByText("요청 요약", { exact: false }).first().waitFor();
  await page.getByText("적용 미리보기 (읽기 전용)", { exact: false }).first().waitFor();
  await page.getByText("적용 대상 DRAFT 버전", { exact: false }).first().waitFor();
  await page.getByText("이 미리보기는 읽기 전용", { exact: false }).first().waitFor();
  // Single active LNB item = Governance.
  const activeCount = await page.locator('nav [aria-current="page"]').count();
  if (activeCount !== 1) {
    throw new Error(`Expected exactly one active LNB item, found ${activeCount}.`);
  }
  // No publish/deploy CTA anywhere on the detail.
  for (const forbidden of ["게시", "배포", "적용 및 게시", "지금 게시"]) {
    if (await page.getByRole("button", { name: forbidden, exact: true }).count()) {
      throw new Error(`Detail must NOT render a "${forbidden}" CTA.`);
    }
  }
  await screenshot(page, "apply-precheck");
  result.routes.push({ name: "apply-precheck", path: detailPath, status: detailResp.status(), assertions: ["read-only pre-check panel", "target DRAFT version", "read-only reassurance", "single active LNB", "no 게시/배포 CTA"] });

  // 2. Human-confirmation modal (apply never fires on a single click).
  const applyBtn = page.getByRole("button", { name: "초안에 적용", exact: true });
  await applyBtn.first().waitFor();
  await applyBtn.first().click();
  await page.getByRole("dialog").waitFor();
  await page.getByText("초안에 적용하시겠습니까?", { exact: false }).first().waitFor();
  await page.getByText("게시 그래프는 변경되지 않으며", { exact: false }).first().waitFor();
  await screenshot(page, "apply-confirm-modal");
  result.routes.push({ name: "apply-confirm-modal", path: detailPath, status: 200, assertions: ["required human-confirmation modal", "draft-only + publish-separate copy"] });

  // 3. Confirm 적용 -> APPLIED badge + applied-not-published banner + one-true-flag proof.
  await page.getByRole("button", { name: "적용", exact: true }).click();
  await page.getByText("초안 온톨로지에 적용되었습니다 — 아직 게시되지 않았습니다.", { exact: false }).first().waitFor();
  await page.getByText("초안에 적용됨 (미게시)", { exact: false }).first().waitFor();
  await page.getByText("ontology_draft_mutated=true", { exact: false }).first().waitFor();
  await page.getByText("게시 그래프는 변경되지 않았습니다", { exact: false }).first().waitFor();
  // Apply control gone (idempotent, no re-apply).
  if (await page.getByRole("button", { name: "초안에 적용", exact: true }).count()) {
    throw new Error("Apply control must be absent after APPLIED.");
  }
  await screenshot(page, "apply-applied");
  result.routes.push({ name: "apply-applied", path: detailPath, status: 200, assertions: ["APPLIED success badge 초안에 적용됨 (미게시)", "applied-not-published banner", "one-true-flag proof line", "apply control absent"] });

  // 4. Application audit shows the CHANGE_REQUEST_APPLIED entry.
  await page.getByText("적용 감사 추적 보기", { exact: false }).first().click();
  await page.getByText("CHANGE_REQUEST_APPLIED", { exact: false }).first().waitFor();
  await screenshot(page, "apply-audit");
  result.routes.push({ name: "apply-audit", path: detailPath, status: 200, assertions: ["application audit disclosure", "CHANGE_REQUEST_APPLIED entry"] });

  // 5. Staleness fixture: apply -> non-destructive SUPERSEDED conflict, nothing applied.
  const stalePath = `/projects/${projectId}/governance/${staleId}`;
  await page.goto(`${frontendBaseUrl}${stalePath}`, { waitUntil: "networkidle" });
  await page.getByText("적용 미리보기 (읽기 전용)", { exact: false }).first().waitFor();
  // Advisory staleness hint present.
  await page.getByText("적용 시 대체(SUPERSEDED)될 수 있습니다", { exact: false }).first().waitFor();
  const staleApplyBtn = page.getByRole("button", { name: "초안에 적용", exact: true });
  await staleApplyBtn.first().click();
  await page.getByRole("button", { name: "적용", exact: true }).click();
  await page.getByText("아무 것도 변경되지 않았으며 요청이 대체됨(SUPERSEDED) 상태가 되었습니다", { exact: false }).first().waitFor();
  await screenshot(page, "apply-superseded");
  result.routes.push({ name: "apply-superseded", path: stalePath, status: 200, assertions: ["staleness advisory hint", "409 SUPERSEDED non-destructive conflict notice", "nothing applied"] });
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp6-governance-apply-mock-route-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(
  JSON.stringify(
    { status: "PASS", artifactPath, routeCount: result.routes.length, screenshotCount: result.screenshots.length },
    null,
    2,
  ),
);
