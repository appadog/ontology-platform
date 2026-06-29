import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";

const baseUrl = process.env.W35_BASE_URL ?? "http://127.0.0.1:5173";
const projectId = process.env.W35_PROJECT_ID ?? "project-corp-knowledge";
const jobId = process.env.W35_JOB_ID ?? "";
const label = process.env.W35_LABEL ?? "after";
const artifactDir = resolve(
  process.env.W35_ARTIFACT_DIR ??
    "/private/tmp/claude-501/-Users-hanati-Desktop-ontology-platform/1aadf140-8c0a-4eaf-8080-c0c17f8c27c4/scratchpad",
);

await mkdir(artifactDir, { recursive: true });

const resolutions = [
  { w: 1920, h: 1080 },
  { w: 1440, h: 900 },
  { w: 1366, h: 768 },
  { w: 1280, h: 800 },
  { w: 1024, h: 768 },
  { w: 768, h: 1024 },
];

const browser = await chromium.launch({ headless: true });

// Resolve a candidates route if no jobId was provided: hit job monitor and grab first job link.
let candidatesPath = jobId ? `/extraction-jobs/${jobId}/candidates` : null;
if (!candidatesPath) {
  const probe = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await probe.goto(`${baseUrl}/projects/${projectId}/extraction-jobs`, { waitUntil: "networkidle" });
  const href = await probe
    .locator('a[href*="/candidates"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
  if (href) candidatesPath = href;
  await probe.close();
}

const routes = [
  { name: "ontology-modeler", path: `/projects/${projectId}/ontology` },
];
if (candidatesPath) routes.push({ name: "candidate-results", path: candidatesPath });

const results = [];
for (const route of routes) {
  for (const res of resolutions) {
    const page = await browser.newPage({ viewport: { width: res.w, height: res.h } });
    let overflow = null;
    try {
      const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          overflowX: doc.scrollWidth - doc.clientWidth,
        };
      });
      await page.screenshot({
        path: join(artifactDir, `${label}-${route.name}-${res.w}x${res.h}.png`),
        fullPage: false,
      });
      results.push({ route: route.name, res: `${res.w}x${res.h}`, status: response?.status(), ...overflow });
    } catch (err) {
      results.push({ route: route.name, res: `${res.w}x${res.h}`, error: String(err) });
    } finally {
      await page.close();
    }
  }
}

await browser.close();

console.log(`\n=== Wave35 responsive overflow check (label=${label}) ===`);
console.log(`base=${baseUrl} project=${projectId} candidatesPath=${candidatesPath ?? "NONE"}`);
for (const r of results) {
  if (r.error) {
    console.log(`  ${r.route.padEnd(18)} ${r.res.padEnd(10)} ERROR ${r.error}`);
  } else {
    const flag = r.overflowX > 0 ? "  <-- OVERFLOW" : "  OK";
    console.log(
      `  ${r.route.padEnd(18)} ${r.res.padEnd(10)} scrollW=${r.scrollWidth} clientW=${r.clientWidth} overflowX=${r.overflowX}${flag}`,
    );
  }
}
const anyOverflow = results.some((r) => !r.error && r.overflowX > 0);
console.log(anyOverflow ? "\nRESULT: HORIZONTAL OVERFLOW PRESENT" : "\nRESULT: 0 horizontal overflow on all routes/resolutions");
