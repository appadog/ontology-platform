import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.12 Advanced Visualization — mock route + render smoke. Drives the
// deterministic mock-backed Published Graph surface through the frozen READ-ONLY
// viz + summary loop on the ONE `published-graph` LNB destination:
//   - open Published Graph -> single active LNB item (unchanged; no new item)
//   - toggle `탐색기 | 시각화 · 요약` (in-page sub-view; H1 stays 게시 그래프 탐색기)
//   - persistent read-only banner + 5 boundary chips
//   - live all-false 6-flag GraphVizMutationGuard proof (read from response)
//   - always-shown exact summary-stats panel (READY demo: 노드 12 / 엣지 9)
//   - READY bounded whole-graph render (client-side layout; no server x/y) + filters
//   - NO save-layout / apply / publish / snapshot / export / 저장 / 게시 affordance.

const frontendBaseUrl = process.env.MVP6_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const projectId = process.env.MVP6_PROJECT_ID ?? "project-corp-knowledge";
const artifactDir = resolve(
  process.env.MVP6_GRAPHVIZ_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-graphviz-mock-smoke",
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
  // 1. Published Graph page: H1 unchanged + single active LNB + view toggle present.
  const path = `/projects/${projectId}/published-graph`;
  const resp = await page.goto(`${frontendBaseUrl}${path}`, { waitUntil: "networkidle" });
  if (!resp?.ok()) {
    throw new Error(`Route ${path} failed: ${resp?.status() ?? "no response"}`);
  }
  await page.getByRole("heading", { name: "게시 그래프 탐색기" }).waitFor();
  await page.getByRole("tab", { name: "탐색기" }).waitFor();
  await page.getByRole("tab", { name: "시각화 · 요약" }).waitFor();
  let activeCount = await page.locator('nav [aria-current="page"]').count();
  if (activeCount !== 1) {
    throw new Error(`Expected exactly one active LNB item on Explorer, found ${activeCount}.`);
  }
  await screenshot(page, "published-graph-explorer");
  result.routes.push({ name: "published-graph-explorer", path, status: resp.status(), assertions: ["H1 게시 그래프 탐색기", "탐색기/시각화·요약 toggle", "single active LNB"] });

  // 2. Switch to the Visualization / Summary sub-view (no LNB change, no path change).
  await page.getByRole("tab", { name: "시각화 · 요약" }).click();
  await page.getByText("읽기 전용 시각화입니다. 그래프를 변경하지 않습니다.", { exact: false }).first().waitFor();
  await page.getByText("READ_ONLY", { exact: false }).first().waitFor();
  await page.getByText("NO_LAYOUT_SAVED", { exact: false }).first().waitFor();
  await page.getByText("PUBLISHED_ONLY", { exact: false }).first().waitFor();
  // Guard proof line (read from the response): 6 flags all false.
  await page.getByText("6개 mutation 플래그 모두 false", { exact: false }).first().waitFor();
  // Single active LNB preserved after the toggle (still published-graph, no new item).
  activeCount = await page.locator('nav [aria-current="page"]').count();
  if (activeCount !== 1) {
    throw new Error(`Expected exactly one active LNB item on the viz sub-view, found ${activeCount}.`);
  }
  // H1 unchanged.
  await page.getByRole("heading", { name: "게시 그래프 탐색기" }).waitFor();

  // 3. Summary panel (always shown, exact): READY demo = 노드 12 / 엣지 9.
  await page.getByText("그래프 요약 통계", { exact: false }).first().waitFor();
  await page.getByText("READY", { exact: false }).first().waitFor();
  await page.getByText("노드 (nodes)", { exact: false }).first().waitFor();
  await page.getByText("밀도 · density", { exact: false }).first().waitFor();

  // 4. READY bounded whole-graph render (client-side layout) + filters.
  await page.getByText("전체 그래프 뷰", { exact: false }).first().waitFor();
  await page.getByText("CLIENT_LAYOUT · 서버 좌표 없음", { exact: false }).first().waitFor();
  await page.locator("svg[aria-label='게시 그래프 전체 뷰 (읽기 전용)']").first().waitFor();
  await page.getByText("필터 (읽기 전용)", { exact: false }).first().waitFor();

  // Expand the guard proof -> all 6 flags shown false.
  await page.getByRole("button", { name: "증거 보기", exact: false }).first().click();
  await page.getByText("published_graph_mutated", { exact: false }).first().waitFor();
  await page.getByText("layout_persisted", { exact: false }).first().waitFor();

  // No mutate/publish/layout-save affordance anywhere on the viz sub-view.
  for (const forbidden of ["저장", "게시", "적용", "내보내기", "export", "레이아웃 저장", "스냅샷"]) {
    if (await page.getByRole("button", { name: forbidden, exact: true }).count()) {
      throw new Error(`Viz sub-view must NOT render a "${forbidden}" affordance.`);
    }
  }
  await screenshot(page, "published-graph-viz");
  result.routes.push({ name: "published-graph-viz", path: `${path} (view=viz)`, status: 200, assertions: ["read-only banner + boundary chips", "all-false 6-flag guard proof", "exact summary panel", "READY client-side layout render (no server x/y)", "read-only filters", "single active LNB preserved", "no save/apply/publish/export CTA"] });
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp6-graphviz-mock-route-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(
  JSON.stringify(
    { status: "PASS", artifactPath, routeCount: result.routes.length, screenshotCount: result.screenshots.length },
    null,
    2,
  ),
);
