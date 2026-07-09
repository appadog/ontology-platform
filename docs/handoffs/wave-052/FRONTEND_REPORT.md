# Frontend Report - Wave 52

Role: Frontend / MVP6.10 Multi-tenant THIN IMPLEMENTATION — tenant context surface
Status: `PASS` — read-only tenant context + client-side switcher + strict-isolation
states + all-false 8-flag guard proof shipped MOCK-FIRST against the frozen
contract. test/build/mock-smoke green, 0 overflow. `:actual` NOT RUN (backend
tenancy router not yet registered — parallel wave).
Date: 2026-07-09

## 담당 범위
- Backlog IDs: `FE6-095` (app-shell tenant switcher + types/client/mocks),
  `FE6-096` (read-only tenant view: summary + tenant-scoped projects),
  `FE6-097` (isolation-limited states + no-provisioning boundary + all-false guard
  proof), `FE6-098` (mock + actual smoke).
- Implemented per `docs/pm/MVP6_10_FRONTEND_UX_REQUIREMENTS.md` + PM6-034 frozen
  fixture matrix + `openapi-mvp6-10-draft.json` (4 GET paths / 13 schemas).
- ISOLATION is the headline invariant and is honored in two layers (by
  construction + clean denial). Additive; no MVP1–MVP6.9 break; no API/DTO/enum
  change; existing global `Projects` list NOT re-scoped.

## 완료한 작업

### FE6-095 — app-shell header Tenant Context indicator + client-side switcher
- New `TenantSwitcher` in the app-shell header (`AppShell.tsx`), placed in a new
  `TopbarLeft` cluster alongside the existing project selector — NOT an LNB item
  (ADR 0010 two-zone IA unchanged; the tenant is the outer scoping context).
- The dropdown is populated ONLY from `GET /tenants` (the actor's ACTIVE
  visibility set). For the default dev actor it lists exactly `Acme Workspace` +
  `Globex Workspace`; a non-visible tenant (initech/umbrella/soylent/hooli) is
  NEVER offered, autocompleted, or hinted → cross-tenant selection is unreachable
  by construction. No free-text id entry, no "create/join org".
- Switching writes ONLY the client-side active-tenant key
  (`shared/lib/activeTenant.ts`, `useSyncExternalStore` over localStorage + a
  window event; mirrors the existing recent-project key) and opens the read-only
  view. No server session/state write (gate G5). Label = active tenant name +
  live `TenantStatus` D6 badge + a "보기" open control. Empty set → neutral
  "소속된 테넌트 없음" (no create CTA, no redirect).
- Types (`types.ts`), client (`client.ts`), query hooks (`queries.ts`), and mock
  fixtures (`mvp6TenancyFixtures.ts`) match the frozen OpenAPI EXACTLY; MVP5
  `Role` reused by reference (`GovernanceRole`, no rename); MVP1 `ProjectSummary`
  mirrored as `ProjectSummaryRef` (no `tenant_id` field added).

### FE6-096 — read-only tenant view (summary + tenant-scoped projects)
- New contextual route `/tenant` (`TenantContextPage.tsx`) driven by the
  client-side active tenant (no id in the path; contextual-detail carve-out of
  ADR 0010). H1 `테넌트 컨텍스트` (D3). Section + Card design language.
- Tenant summary card: `TenantStatus` D6 badge + my membership `Role` + separate
  `TenantMembershipStatus` D6 badge (rendered in their own labelled slots so the
  two enums are never conflated), description, id, project_count, created_at.
- Tenant-scoped project list: the active tenant's projects ONLY (from
  `GET /tenants/{id}/projects`, fully server-authoritative — no cross-tenant
  merge/cache); rows link into the EXISTING per-project routes (unchanged,
  tenant-unaware). First-class loading / empty(no-tenants, no-projects) / error
  states.

### FE6-097 — isolation-limited states + no-provisioning boundary + guard proof
- `404 TENANT_NOT_FOUND` → neutral not-found state; reveals NOTHING about
  existence/name/count (verified: initech's name/project never render on the 404).
  `403 TENANT_ACCESS_SUSPENDED` → access-suspended state with the
  `TenantAccessDenialReason` D6 badge (MEMBERSHIP_SUSPENDED / TENANT_SUSPENDED),
  no tenant data rendered. `404 PROJECT_NOT_FOUND` → neutral not-found on the
  project→tenant resolve. All driven by `ApiError.details.denial_reason` via a
  typed `TenantAccessError`.
- Stale tenant-A data is cleared before resolving tenant-B: every read is keyed by
  `(actorId, tenantId)` and only the current key's `data` renders; a denial swaps
  to the isolation state instead of a summary card. No cross-tenant response reuse.
- Persistent non-dismissible read-only-context banner + 5 boundary chips
  (`READ_ONLY_CONTEXT`, `NO_PROVISIONING`, `NO_CROSS_TENANT`, `SCOPING_UNCHANGED`,
  `CLIENT_SIDE_SWITCH`). Live all-false 8-flag `TenantMutationGuard` proof line
  read FROM the 200 response (never hardcoded); `project_rehomed` +
  `cross_tenant_access_granted` surfaced; any `true` flag → guard-violation state.
  Errors carry NO guard (proof is 200-only; ratified error-envelope-guard ruling).
- NO create / edit / rename / delete / invite / add-member / remove-member /
  role-change / provision / switch-org-write affordance anywhere (asserted in the
  mock smoke).
- New D6 tokens added to `StatusBadge` with the same rule (tone + icon + EN token
  + KO gloss): `SUSPENDED`, `NOT_A_MEMBER`, `TENANT_ARCHIVED`,
  `MEMBERSHIP_SUSPENDED`, `TENANT_SUSPENDED` (existing `ACTIVE`/`ARCHIVED` reused).

### FE6-098 — mock + actual smoke
- `npm run smoke:mvp6:tenancy:mock` (3 routes) — drives the header switcher
  (visibility set only + non-visible tenants absent), the read-only view (banner /
  chips / 8-flag guard proof / summary / project list), ≤1 active LNB, no
  provisioning affordance, and the two ISOLATION negatives (deep-linked
  not-a-member → 404 with NO name/project leak; suspended → 403). PASS.
- `npm run smoke:mvp6:tenancy:actual` — 4 endpoints + isolation matrix
  (visibility set {acme,globex}, disjoint dev-user-2 {initech}, not-a-member 404
  no-leak, suspended 403, cross-tenant projects/project→tenant no-leak). Verified
  to degrade gracefully to NOT RUN when the backend is unreachable / the tenancy
  module is not yet registered.

## 변경 파일
- `apps/frontend/src/shared/api/types.ts` — MVP6.10 tenancy types block (13 shapes
  incl. `TenantMutationGuard`, `TenantSummary`, `TenantMembership`,
  `ProjectSummaryRef`, 4 `*Response`, 3 enums, `TenantApiError`).
- `apps/frontend/src/shared/mocks/mvp6TenancyFixtures.ts` (new) — deterministic
  fixtures matching PM6-034 + backend service VERBATIM; the single isolation
  decision function.
- `apps/frontend/src/shared/api/client.ts` — `TenantAccessError` + 4 read methods
  (mock + actual paths) + `tenantDenial`/`tenantActualGet` helpers (parses the
  frozen ApiError envelope into denial_reason).
- `apps/frontend/src/shared/api/queries.ts` — `tenantKeys` + `useMyTenants` /
  `useTenantSummary` / `useTenantProjects` (retry disabled so isolation states
  render immediately; actor folded into the key).
- `apps/frontend/src/shared/lib/activeTenant.ts` (new) — client-side active-tenant
  store hook (no server write).
- `apps/frontend/src/shared/layout/AppShell.tsx` — header `TenantSwitcher` +
  `TopbarLeft` cluster (project selector width 420→320 to make room).
- `apps/frontend/src/pages/TenantContextPage.tsx` (new) — the read-only view.
- `apps/frontend/src/app/router.tsx` — `/tenant` contextual route.
- `apps/frontend/src/shared/ui/platform/StatusBadge.tsx` — 5 new D6 tokens (+
  `Archive`/`PauseCircle` icons).
- `apps/frontend/src/shared/api/mvp6TenancyMock.test.ts` (new) — 15 mock contract
  tests.
- `apps/frontend/scripts/mvp6-tenancy-mock-route-smoke.mjs` +
  `apps/frontend/scripts/mvp6-tenancy-actual-api-smoke.mjs` (new).
- `apps/frontend/package.json` — `smoke:mvp6:tenancy:mock` + `:actual` scripts.

## 실행/검증 (exact output)
- `npm run test` →
  `Test Files  15 passed (15)` / `Tests  100 passed (100)` (was 85; +15 tenancy).
- `npm run build` → `tsc` clean; `vite build` → `✓ built in 2.27s` (no TS errors).
- `npm run smoke:mvp6:tenancy:mock` →
  `{ "status": "PASS", "routeCount": 3, "screenshotCount": 3 }`.
- `npm run smoke:mvp6:tenancy:actual` →
  `{ "status": "NOT RUN", "reason": "backend unreachable at http://127.0.0.1:8000: TypeError: fetch failed" }`
  (backend tenancy router not yet registered — `app/modules/tenancy/` has
  schemas.py + service.py but no router / no `main.py` include; parallel wave).
- Responsive 0-overflow re-check (`/tenant`, `?tenant=tenant-initech` 404,
  `?tenant=tenant-umbrella` 403) at 1440 / 1366 / 1280 / 768:
  `scrollWidth == clientWidth` at every width → `RESULT: 0 overflow at all widths`.
- No-regression spot-check with the new header switcher present:
  `smoke:mvp6:connectors:mock` PASS (single active LNB intact),
  `smoke:mvp6:governance:mock` PASS.
- `git diff --check` → `CHECK_OK` (no whitespace errors).

## API / Enum / DTO 변경
- 변경 여부: **없음 (none)**. Types/client/query/mocks mirror
  `openapi-mvp6-10-draft.json` exactly; 0 enum/field drift. MVP5 `Role`
  (GovernanceRole) + MVP1 `ProjectSummary` reused by reference (no rename); no
  `tenant_id` field added to any project shape.

## Contract mismatch vs Backend
- None. FE fixtures were built to the PM6-034 matrix and independently match the
  backend `apps/backend/app/modules/tenancy/service.py` fixtures VERBATIM (same
  tenant ids/statuses, 6 memberships, 7 projects, counts, and the identical
  isolation decision: not-a-member/archived → 404, suspended membership/tenant →
  403). When the backend registers the router, `:actual` should pass unchanged.

## Blocker
- None for the FE deliverable. `:actual` cannot be exercised until the Backend
  registers the tenancy router (parallel wave) — non-blocking, expected.

## 남은 TODO
- QA to run `npm run smoke:mvp6:tenancy:actual` at the backend-up gate (already
  reconciled; includes the isolation negatives) and the independent data-level
  isolation + no-mutation verification (INT6-090..093).

## 총괄에게 요청하는 결정
- None required. Route treatment chosen = option (b) minimal: a single contextual
  `/tenant` route (no id in path), reached only from the header indicator — never
  an LNB item. If a future wave wants the global `Projects` list to reflect the
  active tenant, that remains a separate PM-frozen decision (explicitly NOT done
  this wave).

## 현재 판정
- `PASS` (mock-first). test 100/100, build clean, tenancy mock smoke PASS, 0
  overflow at 1440/1366/1280/768, no API/DTO/enum change, no regression (single
  active LNB, KO titles, D6 badges intact). Isolation honored: the switcher never
  offers a non-visible tenant, direct access to a non-visible tenant → 404 with no
  leak, suspended → 403, no cross-tenant data ever rendered, all-false 8-flag
  guard proof on 200 only. `:actual` NOT RUN (backend router pending).
