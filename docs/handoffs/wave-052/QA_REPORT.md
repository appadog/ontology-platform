# QA Report - Wave 52

Role: QA / Integration — MVP6.10 Multi-tenant THIN IMPLEMENTATION
Status: `PASS` — R1-R9 all PASS (verified live). ISOLATION headline holds at the
data level (404-not-leak / 403-suspended / disjoint sets / no-mutation). Actual
smoke RAN and PASSes after a small in-wave QA fix. Recommend **MVP6.10 thin closeout**.
Date: 2026-07-09

## 담당 범위
- Backlog IDs: `INT6-090` backend runtime, `INT6-091` FE mock/actual, `INT6-092`
  ISOLATION + data-level no-mutation, `INT6-093` Wave52 closeout.
- Independently verified the headline invariant (strict isolation, default-deny,
  404-not-leak) at the data level with my own script against a live backend.

## 완료한 작업 / 실행·검증 (exact commands + output)

### INT6-090 — Backend runtime
```text
cd apps/backend && .venv/bin/pytest tests/test_mvp6_10_tenancy_api.py -q  -> 30 passed in 1.98s
cd apps/backend && .venv/bin/pytest tests/test_mvp6_9_connectors_api.py -q -> 30 passed in 7.33s
cd apps/backend && .venv/bin/pytest -q                                     -> 229 passed in 49.21s
cd apps/backend && .venv/bin/ruff check app tests scripts                  -> All checks passed!
```
- Router registered: `app/api/router.py:23` imports `tenancy_router`, `:48`
  `include_router(tenancy_router)`. 4 GET endpoints reachable on the live backend.
- OpenAPI draft `docs/api/openapi-mvp6-10-draft.json` parses (3.1.0, `0.6.10-draft`,
  4 paths); `TenantMutationGuard` = 8 flags all `const:false`; `ApiError` = {code,
  message,details}. Runtime schemas (`schemas.py`) match verbatim (3 enums + `Role`
  by reference + 8-flag guard + 4 `*Response`). (App runtime `/openapi.json` is
  disabled in this deployment; endpoints exercised directly.)

### INT6-092 — ISOLATION + data-level no-mutation (own script vs LIVE backend)
Booted backend on file-backed SQLite (`Base.metadata.create_all` + `seed_mvp3(reset=True)`
+ `uvicorn app.main:app --port 8000` with that `DATABASE_URL`; `/health` 200).
Ran `scratchpad/isolation_check.py` (68 assertions) — **ALL PASS**. Key evidence:

| assertion | result |
|---|---|
| `dev-user` visibility set | `{tenant-acme(2p), tenant-globex(1p)}`, `total_count=2`, all-false guard |
| `GET /tenants` no-leak | body contains none of initech/umbrella/soylent/hooli names/ids or `proj-initech-secret` |
| `dev-user-2` visibility | `{tenant-initech}`, `total_count=1` — **DISJOINT** from `dev-user` |
| disjoint-proves-policy | `dev-user-2` sees initech 200 (project_count=1) while `dev-user` gets 404 → 404 is a policy decision, not a missing record (no-leak proven) |
| unknown actor | `[]`, `total_count=0` |
| initech (dev-user) | **404 TENANT_NOT_FOUND** / `NOT_A_MEMBER`; NO name/count/`proj-initech-secret` leak; NO guard |
| hooli ARCHIVED | **404 TENANT_NOT_FOUND** / `TENANT_ARCHIVED`; NO guard |
| umbrella | **403 TENANT_ACCESS_SUSPENDED** / `MEMBERSHIP_SUSPENDED`; NO guard |
| soylent | **403 TENANT_ACCESS_SUSPENDED** / `TENANT_SUSPENDED`; NO guard |
| `/tenants/acme/projects` | exactly `[proj-acme-catalog, proj-acme-kg]`; NO globex/initech/other project; all-false guard |
| `/tenants/initech/projects` (dev-user) | 404, `proj-initech-secret` never in body |
| `/projects/proj-initech-secret/tenant` (dev-user) | **404 PROJECT_NOT_FOUND**, NO denial_reason, NO owning-tenant leak |
| `/projects/{proj-umbrella-01,proj-soylent-01}/tenant` | 403 mirroring the owning tenant decision |
| `/projects/{proj-hooli-01, unknown}/tenant` | 404 PROJECT_NOT_FOUND, no leak |
| all-false 8-flag guard | present + all `false` on EVERY 200 (list/summary/projects/resolve) incl. `cross_tenant_access_granted` + `project_rehomed` |
| existing `GET /projects` | 200, NO `tenant_id` (tenant-unaware, unchanged) |
| **DATA-LEVEL no-mutation** | all **25** SQLite tables COUNT(*) before==after every endpoint × branch × 3 actors — changed=`{}` |

### INT6-091 — Frontend mock/API
```text
cd apps/frontend && npm run test                        -> Test Files 15 passed; Tests 100 passed
cd apps/frontend && npm run build                       -> tsc clean; vite ✓ built in 2.04s
cd apps/frontend && npm run smoke:mvp6:tenancy:mock      -> PASS (routeCount 3, screenshotCount 3)
cd apps/frontend && npm run smoke:mvp6:tenancy:actual    -> PASS (checks 7)  [vs LIVE backend]
```
- Actual smoke asserts: visibility {acme,globex} + guard; disjoint dev-user-2
  {initech}; visible summary; not-a-member→404 `TENANT_NOT_FOUND` no-leak;
  suspended→403; tenant-scoped projects (no cross-tenant); project→tenant
  404 `PROJECT_NOT_FOUND` no-leak.
- **The Frontend recorded `:actual` as NOT RUN (it checked before the router
  landed). QA RAN it here** — it initially **FAILED**, correctly catching a real
  FE-actual drift (see below), then PASSed after the fix.

## Found + fixed in-wave (QA) — FE actual error-envelope drift
The backend returns the canonical **wrapped** error envelope
`{"error":{code,message,details}}` (its own `TenantApiErrorResponse{error:...}` /
core `ApiErrorResponse`). But the new `tenantActualGet` (client.ts) and the actual
smoke read `body.code` / `body.details` at the **top level** — so on the ACTUAL
path `denial_reason` was lost and the exact code fell back to a status-derived
default (mock path unaffected; **no leak** either way — 404/403 deny states still
render). This is a genuine, low-severity FE-actual bug the smoke was designed to
catch. Minimal correct fix applied (unwrap `.error`, tolerate flat shape):
- `apps/frontend/src/shared/api/client.ts` — `tenantActualGet` unwraps `raw.error ?? raw`.
- `apps/frontend/scripts/mvp6-tenancy-actual-api-smoke.mjs` — `call()` exposes the
  unwrapped `err`; assertions read `err.code` / `err.details.denial_reason`.
Re-ran: FE test 100/100, build clean, actual smoke PASS (7 checks), mock smoke
PASS. (Same in-wave QA-fix precedent as Wave48/Wave36.)

## Regression
- Backend full suite **229 passed**, ruff clean; tenancy 30 + connectors 30.
- FE **100/100** tests, build clean; `smoke:mvp6:connectors:mock` + `smoke:mvp6:governance:mock`
  PASS with the new header switcher present → single active LNB / candidate-published
  separation intact; existing `Projects` NOT re-scoped; `GET /projects` tenant-unaware.
- Additive: tenancy is a new module; router registration +2 lines; no MVP1-MVP6.9
  path/enum/shape touched; no `tenant_id` column/FK/migration; MVP5 `Role` + MVP1
  `Project`/`ProjectSummary` reused by reference (no rename).

## R1-R9 verdicts (detail in `docs/backlog/INT6_10_MULTI_TENANT_ACCEPTANCE.md`)
R1 PASS · R2 PASS · R3 PASS · R4 PASS · R5 PASS · R6 PASS · R7 PASS · R8 PASS · R9 PASS.

## Did the actual smoke run?
**YES.** Frontend recorded it NOT RUN (backend router not yet registered when FE
ran). QA booted the backend on file-backed SQLite + `seed_mvp3` and ran it; it
caught a real FE-actual envelope-unwrap drift, which QA fixed in-wave; the smoke
then PASSes (7 checks).

## 변경 파일 (QA)
- `apps/frontend/src/shared/api/client.ts` (unwrap wrapped error envelope on actual path).
- `apps/frontend/scripts/mvp6-tenancy-actual-api-smoke.mjs` (read unwrapped error).
- `docs/backlog/INT6_10_MULTI_TENANT_ACCEPTANCE.md` (R1-R9 verdicts).
- `docs/handoffs/wave-052/QA_REPORT.md` (this report).

## Blocker
- None. `git diff --check` → CHECK_OK. No leftover listeners on 8000/5173 (both cleared).

## 남은 TODO (P1/P2, non-blocking)
- Consider a shared FE error-envelope unwrap helper so future actual-path parsers
  don't re-introduce the top-level-vs-`.error` mistake.
- Mock route smoke uses Playwright `networkidle` (needs a running dev server; hit
  the known Wave50 flake once, passed on retry with a live server) — the P2
  `networkidle`→`domcontentloaded`+selector harness fix still applies.
- Durable DB tenants/memberships, real auth actor, provisioning surfaces (out of P0).

## 다른 역할에 전달할 내용
- Backend: no change needed; the wrapped `{"error":{...}}` envelope is correct.
- Frontend: the `.error` unwrap fix is applied to `tenantActualGet`; audit other
  actual-path error parsers for the same top-level assumption (P1).
- PM: MVP6.10 thin slice is contract-clean and closeout-ready.

## 총괄에게 요청하는 결정
- None required.

## 현재 판정
- `PASS` — R1-R9 9/9 verified live; ISOLATION headline (404-not-leak / 403-suspended
  / disjoint sets / no data-level mutation across 25 tables) confirmed; all-false
  8-flag guard on every 200, no guard on errors; actual smoke RAN + PASS after an
  in-wave FE-actual envelope-unwrap fix; regression clean; additive-only.
  Recommend **MVP6.10 Multi-tenant thin closeout** (no hardening/redesign wave needed).
