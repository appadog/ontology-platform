import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.5 Governance — mock route + render smoke. Drives the deterministic
// mock-backed UI through the frozen P0 loop: open the board (state-grouped) ->
// propose a change request -> submit -> open detail -> approve -> confirm the
// QUEUED-not-applied badge + persistent approval-is-intent banner + audit trail.
// Asserts: no 적용/게시 CTA, single active Governance LNB item, D6 badges.

const frontendBaseUrl = process.env.MVP6_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const projectId = process.env.MVP6_PROJECT_ID ?? "project-corp-knowledge";
const approvedId = process.env.MVP6_GOVERNANCE_APPROVED_ID ?? "ocr-approved-004";
const openId = process.env.MVP6_GOVERNANCE_OPEN_ID ?? "ocr-open-001";
const artifactDir = resolve(
  process.env.MVP6_GOVERNANCE_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-governance-mock-smoke",
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
  // 1. Board: KO title, MVP6.5 marker, persistent approval-is-intent banner,
  //    state-grouped rows, primary 변경 요청 생성, QUEUED badge on approved row.
  const boardPath = `/projects/${projectId}/governance`;
  const boardResp = await page.goto(`${frontendBaseUrl}${boardPath}`, { waitUntil: "networkidle" });
  if (!boardResp?.ok()) {
    throw new Error(`Route ${boardPath} failed: ${boardResp?.status() ?? "no response"}`);
  }
  await page.getByRole("heading", { name: "거버넌스" }).waitFor();
  await page.getByText("MVP6.5", { exact: true }).waitFor();
  await page.getByText("승인은 큐잉된 의도이며, 아직 적용되지 않았습니다.", { exact: false }).first().waitFor();
  await page.getByRole("button", { name: "변경 요청 생성" }).first().waitFor();
  await page.getByText("큐잉됨 (미적용)", { exact: false }).first().waitFor();
  // Single active LNB item = Governance.
  const activeCount = await page.locator('nav [aria-current="page"]').count();
  if (activeCount !== 1) {
    throw new Error(`Expected exactly one active LNB item, found ${activeCount}.`);
  }
  // No apply/publish CTA anywhere on the board.
  for (const forbidden of ["적용", "게시"]) {
    if (await page.getByRole("button", { name: forbidden, exact: true }).count()) {
      throw new Error(`Board must NOT render a "${forbidden}" CTA.`);
    }
  }
  await screenshot(page, "governance-board");
  result.routes.push({ name: "governance-board", path: boardPath, status: boardResp.status(), assertions: ["KO title 거버넌스", "MVP6.5 marker", "approval-is-intent banner", "primary 변경 요청 생성", "QUEUED 미적용 badge", "single active LNB", "no 적용/게시 CTA"] });

  // 2. Propose: title/summary + a change item; ADD hides element ref; primary 제출.
  await page.getByRole("button", { name: "변경 요청 생성" }).first().click();
  await page.waitForURL(`**/governance/new`);
  await page.getByRole("heading", { name: "새 변경 요청" }).waitFor();
  await page.getByText("추가 — 대상 요소 없음", { exact: false }).first().waitFor();
  await page.locator('input[placeholder*="위험등급"]').fill("스모크 변경 요청");
  await page.locator("textarea").first().fill("mock route smoke proposal summary");
  await page.getByRole("button", { name: "제출" }).waitFor();
  await screenshot(page, "governance-propose");
  result.routes.push({ name: "governance-propose", path: `${boardPath}/new`, status: 200, assertions: ["propose form", "ADD hides element ref", "primary 제출"] });

  // Submit -> lands on detail of the new request (DRAFT -> OPEN).
  await page.getByRole("button", { name: "제출" }).click();
  await page.waitForURL(`**/governance/ocr-mock-**`);
  await page.getByText("요청 요약", { exact: false }).first().waitFor();
  await page.getByText("스모크 변경 요청", { exact: false }).first().waitFor();
  await page.getByText("검토 대기", { exact: false }).first().waitFor();
  await screenshot(page, "governance-submitted");
  result.routes.push({ name: "governance-submitted", path: "detail", status: 200, assertions: ["submit -> OPEN (검토 대기)", "detail summary rendered"] });

  // 3. Detail of an OPEN request: approver decision panel, reason-required gating.
  const detailPath = `/projects/${projectId}/governance/${openId}`;
  await page.goto(`${frontendBaseUrl}${detailPath}`, { waitUntil: "networkidle" });
  await page.getByText("요청 요약", { exact: false }).first().waitFor();
  await page.getByText("승인자 권한", { exact: false }).first().waitFor();
  await page.getByText("이 결정은 온톨로지", { exact: false }).first().waitFor();
  // 승인 button disabled until a reason is entered.
  const approveBtn = page.getByRole("button", { name: "승인", exact: true });
  if (!(await approveBtn.isDisabled())) {
    throw new Error("승인 must be disabled until a non-empty reason is entered.");
  }
  await page.locator("textarea").first().fill("스모크 승인 정당화");
  if (await approveBtn.isDisabled()) {
    throw new Error("승인 must be enabled once a reason is present.");
  }
  await screenshot(page, "governance-detail-open");
  result.routes.push({ name: "governance-detail-open", path: detailPath, status: 200, assertions: ["approver permission band", "reason-required gating", "mutation-guard proof line"] });

  // 4. Approve -> QUEUED confirmation + no apply/publish affordance.
  await approveBtn.click();
  await page.getByText("승인되어 큐잉(QUEUED)되었습니다", { exact: false }).first().waitFor();
  await page.getByText("큐잉됨 (미적용)", { exact: false }).first().waitFor();
  for (const forbidden of ["적용", "게시", "적용하기", "지금 적용"]) {
    if (await page.getByRole("button", { name: forbidden, exact: true }).count()) {
      throw new Error(`Detail must NOT render a "${forbidden}" CTA after approval.`);
    }
  }
  await screenshot(page, "governance-approved");
  result.routes.push({ name: "governance-approved", path: detailPath, status: 200, assertions: ["APPROVE -> QUEUED confirmation", "QUEUED 미적용 badge", "no apply/publish CTA"] });

  // 5. Audit trail disclosure on an approved request.
  const approvedPath = `/projects/${projectId}/governance/${approvedId}`;
  await page.goto(`${frontendBaseUrl}${approvedPath}`, { waitUntil: "networkidle" });
  await page.getByText("승인된 변경 요청은 감사 가능한 결정 기록", { exact: false }).first().waitFor();
  await page.getByText("감사 추적 보기", { exact: false }).first().click();
  await page.getByText("CHANGE_REQUEST_APPROVED", { exact: false }).first().waitFor();
  await screenshot(page, "governance-audit");
  result.routes.push({ name: "governance-audit", path: approvedPath, status: 200, assertions: ["audit trail disclosure", "CHANGE_REQUEST_APPROVED entry"] });
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp6-governance-mock-route-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(
  JSON.stringify(
    { status: "PASS", artifactPath, routeCount: result.routes.length, screenshotCount: result.screenshots.length },
    null,
    2,
  ),
);
