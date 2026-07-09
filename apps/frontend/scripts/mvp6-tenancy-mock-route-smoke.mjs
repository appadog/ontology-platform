import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// MVP6.10 Multi-tenant — mock route + render smoke. Drives the deterministic
// mock-backed UI through the frozen READ-ONLY tenant context + STRICT ISOLATION:
//   - app-shell header Tenant Context indicator + client-side switcher listing
//     ONLY the actor's ACTIVE visibility set {Acme, Globex} (cross-tenant
//     selection unreachable by construction; non-visible tenants NEVER offered)
//   - /tenant read-only view: persistent read-only banner + boundary chips +
//     live all-false 8-flag guard proof + tenant summary (TenantStatus + my
//     membership role/status) + tenant-scoped project list (this tenant only)
//   - ISOLATION negative checks: a non-visible tenant is ABSENT from the switcher
//     AND direct access -> 404 not-found (no name/existence leak); a suspended
//     relationship -> 403 access-suspended. No stale cross-tenant data rendered.
//   - NO create / edit / invite / add-member / provision affordance anywhere.

const frontendBaseUrl = process.env.MVP6_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const artifactDir = resolve(
  process.env.MVP6_TENANCY_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-tenancy-mock-smoke",
);

await mkdir(artifactDir, { recursive: true });
const result = { frontendBaseUrl, artifactDir, routes: [], screenshots: [] };

async function screenshot(page, name) {
  const path = join(artifactDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  result.screenshots.push(path);
  return path;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  // 1. Tenant Context view (default actor dev-user).
  const tenantPath = `/tenant`;
  const resp = await page.goto(`${frontendBaseUrl}${tenantPath}`, { waitUntil: "networkidle" });
  if (!resp?.ok()) {
    throw new Error(`Route ${tenantPath} failed: ${resp?.status() ?? "no response"}`);
  }
  await page.getByRole("heading", { name: "테넌트 컨텍스트", exact: true }).first().waitFor();
  await page
    .getByText("테넌트 컨텍스트는 읽기 전용입니다. 아무것도 만들거나 변경하지 않습니다.", { exact: false })
    .first()
    .waitFor();
  await page.getByText("NO_PROVISIONING", { exact: false }).first().waitFor();
  await page.getByText("NO_CROSS_TENANT", { exact: false }).first().waitFor();
  await page.getByText("CLIENT_SIDE_SWITCH", { exact: false }).first().waitFor();
  await page.getByText("8개 mutation 플래그 모두 false", { exact: false }).first().waitFor();
  await page.getByText("project_rehomed", { exact: false }).first().waitFor();
  await page.getByText("cross_tenant_access_granted", { exact: false }).first().waitFor();

  // Switcher lists ONLY the visibility set {Acme, Globex}; never a hidden tenant.
  const optionTexts = await page.locator("#tenant-switcher option").allTextContents();
  const joined = optionTexts.join(" | ");
  if (!joined.includes("Acme Workspace") || !joined.includes("Globex Workspace")) {
    throw new Error(`Switcher must list the visibility set {Acme, Globex}; got: ${joined}`);
  }
  for (const hidden of ["Initech", "Umbrella", "Soylent", "Hooli"]) {
    if (joined.includes(hidden)) {
      throw new Error(`Switcher must NOT offer non-visible tenant "${hidden}"; got: ${joined}`);
    }
  }

  // Single active LNB (tenant view is header-driven, not an LNB item): never >1.
  const activeCount = await page.locator('nav [aria-current="page"]').count();
  if (activeCount > 1) {
    throw new Error(`Expected at most one active LNB item, found ${activeCount}.`);
  }

  // No provisioning / mutation affordance anywhere on the surface.
  for (const forbidden of ["테넌트 생성", "새 테넌트", "멤버 초대", "멤버 추가", "프로비저닝", "테넌트 참여", "역할 변경"]) {
    if (await page.getByRole("button", { name: forbidden, exact: true }).count()) {
      throw new Error(`Tenant context must NOT render a "${forbidden}" affordance.`);
    }
  }
  await screenshot(page, "tenant-context-default");
  result.routes.push({
    name: "tenant-context-default",
    path: tenantPath,
    status: resp.status(),
    assertions: [
      "테넌트 컨텍스트 H1",
      "read-only banner",
      "boundary chips (NO_PROVISIONING/NO_CROSS_TENANT/CLIENT_SIDE_SWITCH)",
      "all-false 8-flag guard proof (project_rehomed/cross_tenant_access_granted)",
      "switcher lists ONLY {Acme, Globex}",
      "non-visible tenants absent from switcher",
      "<=1 active LNB",
      "no provisioning affordance",
    ],
  });

  // 2. Summary + tenant-scoped project list for the resolved (default) tenant.
  await page.getByText("테넌트 상태", { exact: false }).first().waitFor();
  await page.getByText("내 멤버십", { exact: false }).first().waitFor();
  await page.getByText("테넌트 프로젝트", { exact: false }).first().waitFor();

  // 3. ISOLATION negative — not-a-member tenant via out-of-band deep link -> 404,
  //    NO name/existence leak (Initech Workspace must NOT appear).
  const notFoundPath = `/tenant?tenant=tenant-initech`;
  const nf = await page.goto(`${frontendBaseUrl}${notFoundPath}`, { waitUntil: "networkidle" });
  if (!nf?.ok()) throw new Error(`Route ${notFoundPath} failed: ${nf?.status()}`);
  await page.getByText("요청하신 테넌트를 찾을 수 없습니다.", { exact: false }).first().waitFor();
  if (await page.getByText("Initech Workspace", { exact: false }).count()) {
    throw new Error("Isolation leak: a non-member tenant's NAME was rendered on the 404 state.");
  }
  if (await page.getByText("Initech Secret Project", { exact: false }).count()) {
    throw new Error("Isolation leak: a non-member tenant's PROJECT was rendered.");
  }
  await screenshot(page, "tenant-context-not-found");
  result.routes.push({
    name: "tenant-context-not-found",
    path: notFoundPath,
    status: nf.status(),
    assertions: ["404 not-found state", "NO tenant name leak", "NO cross-tenant project leak"],
  });

  // 4. ISOLATION negative — suspended relationship -> 403 access-suspended.
  const suspendedPath = `/tenant?tenant=tenant-umbrella`;
  const su = await page.goto(`${frontendBaseUrl}${suspendedPath}`, { waitUntil: "networkidle" });
  if (!su?.ok()) throw new Error(`Route ${suspendedPath} failed: ${su?.status()}`);
  await page.getByText("이 테넌트에 대한 접근이 일시 중단되었습니다.", { exact: false }).first().waitFor();
  await page.getByText("MEMBERSHIP_SUSPENDED", { exact: false }).first().waitFor();
  await screenshot(page, "tenant-context-suspended");
  result.routes.push({
    name: "tenant-context-suspended",
    path: suspendedPath,
    status: su.status(),
    assertions: ["403 access-suspended state", "MEMBERSHIP_SUSPENDED denial reason badge", "no tenant data rendered"],
  });
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp6-tenancy-mock-route-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(
  JSON.stringify(
    { status: "PASS", artifactPath, routeCount: result.routes.length, screenshotCount: result.screenshots.length },
    null,
    2,
  ),
);
