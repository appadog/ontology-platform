# INT6.10 MVP6.10 Multi-tenant Acceptance Checklist

Status: `WAVE52 QA RUNTIME — PASS (C-series PASS; R1-R9 all PASS, verified live). MVP6.10 thin closeout recommended.`
Date: 2026-07-09
Owner: QA / Integration
Backlog: `INT6-080`..`INT6-089` (continues INT6 numbering; `INT6-*` used through `INT6-079` in Wave49/50)

Wave51 verdict: **PASS (planning)** — PM brief + ADR 0017, Backend
`openapi-mvp6-10-draft.json` (3.1.0, `0.6.10-draft`, **4 paths / 4 GET operations
/ 13 schemas**) + companion contract, and Frontend UX requirements agree on the
read-only tenant context + strict isolation P0, the no-provisioning /
no-cross-tenant-read / additive-over-project-scoping / no-`tenant_id`-column
boundary, the all-false **8-flag** `TenantMutationGuard`, the frozen 3 enums
(+ MVP5 `Role` verbatim reuse), and the default-deny 404-not-leak isolation model.
OpenAPI parses, is additive/disjoint to MVP1–MVP6.9. No runtime leaked under
`apps/`/`infra/`. Backend reports **enum/field drift 0** with Frontend (FE
reconciled during the wave). R-series NOT RUNNABLE by design until Wave52.

> **QA ID note.** `INT6-*` used through `INT6-079` (Wave49/50). This theme uses
> **`INT6-080`~`INT6-089`** (`INT6-080` = the checklist slot in the backlog).

## Source Documents
- Wave order: `docs/handoffs/wave-051/NEXT_ORDERS.md`
- Reports: `docs/handoffs/wave-051/{PM,BACKEND,FRONTEND}_REPORT.md`
- PM brief: `docs/pm/MVP6_10_MULTI_TENANT_BRIEF.md`
- ADR: `docs/adr/0017-mvp6-10-multi-tenant-read-only-context-strict-isolation-no-provisioning-additive-over-project-scoping-boundary.md`
- API: `docs/api/MVP6_10_MULTI_TENANT_API_CONTRACT_DRAFT.md` + `docs/api/openapi-mvp6-10-draft.json`
- Frontend requirements: `docs/pm/MVP6_10_FRONTEND_UX_REQUIREMENTS.md`

## Verdict Semantics
- `PASS`: artifacts agree and preserve the read-only + strict-isolation + no-provisioning + additive-over-project-scoping boundary with an all-false guard.
- `PARTIAL`: usable but named fields/enums/rules need targeted hardening.
- `FAIL`: opens tenant/membership mutation, cross-tenant read/leak, data re-homing / `tenant_id` migration, or any candidate/published mutation; or a denial that leaks a non-visible tenant's existence (403 where 404 is required).
- `NOT RUNNABLE`: expected for runtime checks before Wave52.

## ISOLATION — the headline invariant (default-deny, 404-not-leak)
Cross-tenant access must be provably impossible. The single rule: an actor may
touch **only** tenants in its **visibility set** (an `ACTIVE` `TenantMembership`
on a **non-`ARCHIVED`** tenant). Everything else is denied, and existence is
never leaked.

| Scenario | Required outcome |
|---|---|
| `tenant_id` not in visibility set (unknown / `ARCHIVED` / not-a-member) | **`404 TENANT_NOT_FOUND`** — 404 **not** 403; id/name/count/summary never leaked |
| `tenant_id` known-but-inactive (membership `SUSPENDED` or tenant `SUSPENDED`) | **`403 TENANT_ACCESS_SUSPENDED`** — caller already knows tenant exists |
| `GET /tenants` | returns **exactly** the visibility set; never another tenant's id/name/count/summary |
| `GET /tenants/{A}/projects` | returns **only** A's projects; B's project is **never** returned under A, even for an A member (`cross_tenant_access_granted` stays false) |
| `GET /projects/{id}/tenant` for out-of-visibility / unknown project | **`404 PROJECT_NOT_FOUND`** — cross-tenant project existence not leaked |
| Denial reason surfaced | `ApiError.details.denial_reason` ∈ `TenantAccessDenialReason`; mapping `NOT_A_MEMBER`→404, `TENANT_ARCHIVED`→404, `MEMBERSHIP_SUSPENDED`→403, `TENANT_SUSPENDED`→403 |
| `403 PERMISSION_DENIED` | **reserved** for future role-gated writes; **not** produced by any P0 read |

## C-Series — Planning Gates (Wave51)
| ID | Gate | Verdict |
|---|---|---|
| INT6-080 / C1 | 4 read-only endpoints present, all GET, zero mutating verbs: `GET /api/v1/tenants`, `GET /api/v1/tenants/{tenant_id}`, `GET /api/v1/tenants/{tenant_id}/projects`, `GET /api/v1/projects/{project_id}/tenant` | PASS — OpenAPI has exactly these 4 paths, each `['get']` only; no POST/PUT/PATCH/DELETE anywhere |
| INT6-081 / C2 | 3 frozen enums verbatim + MVP5 `Role` reused verbatim: `TenantStatus`(ACTIVE/SUSPENDED/ARCHIVED), `TenantMembershipStatus`(ACTIVE/SUSPENDED), `TenantAccessDenialReason`(NOT_A_MEMBER/TENANT_ARCHIVED/MEMBERSHIP_SUSPENDED/TENANT_SUSPENDED), `Role`(8 literals) | PASS — all four match PM/ADR/BE/FE exactly; `Role` = 8 MVP5 literals, no new literal, no rename |
| INT6-082 / C3 | **ISOLATION (headline):** default-deny 404-not-leak; not-a-member/ARCHIVED/unknown→`404 TENANT_NOT_FOUND`; inactive (membership/tenant SUSPENDED)→`403 TENANT_ACCESS_SUSPENDED`; `/tenants/{A}/projects` never returns B; `/projects/{id}/tenant` out-of-visibility→`404 PROJECT_NOT_FOUND`; `GET /tenants` returns visibility set only | PASS — OpenAPI: 3 member-gated endpoints each carry `403`+`404`; `GET /tenants` is `200`-only (never denies, just its own set); all 3 error codes present; `ApiError.details.denial_reason`=`TenantAccessDenialReason`. PM §ISOLATION, ADR, BE draft §Isolation, FE §Isolation-limited agree |
| INT6-083 / C4 | All-false **8-flag** `TenantMutationGuard` (`tenant_created`, `tenant_updated`, `tenant_deleted`, `membership_mutated`, `project_rehomed`, `cross_tenant_access_granted`, `candidate_graph_mutated`, `published_graph_mutated`) on **every** response; `cross_tenant_access_granted`+`project_rehomed` are the isolation-specific assertions | PASS — 8 flags all `const:false` + all `required`; `mutation_guard` present on all 4 `*Response` schemas |
| INT6-084 / C5 | tenant↔project is a **deterministic fixture mapping** — no `tenant_id` column / FK / migration / backfill; project item = MVP1 `ProjectSummary` by reference (`ProjectSummaryRef`, no `tenant_id` field added) | PASS — contract §Boundary/§Reuse + ADR + OpenAPI: `ProjectSummaryRef` reuses MVP1 shape by reference, no `tenant_id` field; no schema/migration artifact |
| INT6-085 / C6 | **Additive-over-project-scoping:** MVP1 `Project` + all MVP1–MVP6.9 per-project endpoints unchanged and tenant-unaware; no re-homing/rename; new surface is a read overlay | PASS — 4 new paths disjoint from every existing `openapi-mvp*.json`; no existing path/enum touched; PM/BE/FE agree |
| INT6-086 / C7 | Authz + dev actor: any `ACTIVE` member (even `Role=VIEWER`) may read summary + project list; membership `role` surfaced for future write/admin, not required for P0 read; optional dev-only `actor_id` query param (never a real auth/JWT claim) | PASS — contract §Authz + `ActorIdQuery` parameter present in OpenAPI; FE marks `actor_id` dev-only (not a production UI element) |
| INT6-087 / C8 | Deterministic + no-leak DTOs: `TenantSummary.my_membership` = caller's OWN membership only (never another actor's); responses byte-stable for a given actor+fixture (modulo any adopted response-time timestamp) | PASS — contract §Key DTOs; `TenantSummary` carries only `my_membership`; no cross-actor/cross-tenant field |
| INT6-088 / C9 | Error-envelope-guard decision (COMMANDER RULING): error responses do **not** carry `mutation_guard`; FE renders the all-false guard proof on **200 responses only** and drives denial states from `ApiError.details.denial_reason`. Errors mutate nothing by definition, so no guard on error envelopes is required | PASS — `ApiError`={code,message,details}, no `mutation_guard`; FE G3 aligned; ruling recorded (see Wave52 gates) |
| INT6-089 / C10 | OpenAPI parses + additive/disjoint + no runtime leaked + durable invariants (isolation, candidate/published separation, additive-only, no mutation); PM/BE/FE agree on P0, tenant/membership model, boundary, exclusions; enum/field drift 0 | PASS — parse OK (3.1.0, `0.6.10-draft`, 4 paths/13 schemas), disjoint from all `openapi-mvp*.json`, `apps/`+`infra/` leak scan empty (0 matches), BE↔FE drift 0 |

## R-Series — Runtime Gates (Wave52 — VERIFIED LIVE by QA)
QA booted the backend on file-backed SQLite (`Base.metadata.create_all` + `seed_mvp3(reset=True)` +
`uvicorn app.main:app --port 8000` with that `DATABASE_URL`) and ran an independent isolation + data-level
no-mutation script (`scratchpad/isolation_check.py`, 68 assertions, ALL PASS) plus the FE actual/mock smokes.

| ID | Runtime gate | Verdict |
|---|---|---|
| R1 | 4 endpoints live; `GET /tenants` returns exactly the actor's visibility set with exact `total_count`; `TenantSummary` carries `status`, own `my_membership`(role/status), exact tenant-scoped `project_count`; response carries `actor_id` + all-false guard | **PASS** — `dev-user` → `{tenant-acme(2 proj), tenant-globex(1 proj)}`, `total_count=2`; each 200 carries `actor_id` + all-false 8-flag guard; summaries carry own `my_membership` role/status + exact `project_count` |
| R2 | **ISOLATION headline — cross-tenant denied, no leak:** not-a-member/ARCHIVED/unknown tenant → `404 TENANT_NOT_FOUND` (no id/name/count leaked); inactive relationship → `403 TENANT_ACCESS_SUSPENDED`; `/tenants/{A}/projects` returns only A's projects (B never appears for an A member); `/projects/{id}/tenant` out-of-visibility → `404 PROJECT_NOT_FOUND`; `ApiError.details.denial_reason` correct per mapping | **PASS** — initech→404 `TENANT_NOT_FOUND`/`NOT_A_MEMBER` (no name/count/`proj-initech-secret` in body); hooli(ARCHIVED)→404/`TENANT_ARCHIVED`; umbrella→403/`MEMBERSHIP_SUSPENDED`; soylent→403/`TENANT_SUSPENDED`; `/tenants/acme/projects`=its own 2 only (no globex/initech); `/projects/proj-initech-secret/tenant`→404 `PROJECT_NOT_FOUND` (no denial_reason, no owning-tenant leak); `/projects/{umbrella,soylent}` mirror 403 |
| R3 | **Isolation is data-level, not just HTTP:** across all flows a cross-tenant caller can never obtain another tenant's rows; `GET /tenants` for actor-X and actor-Y produce disjoint sets exactly matching each fixture's memberships; no response body contains a non-visible tenant/project id | **PASS** — `dev-user`={acme,globex} and `dev-user-2`={initech} are DISJOINT; unknown actor → `[]`. `dev-user-2` gets initech 200 (project_count=1) while `dev-user` gets 404 → the 404 is a policy decision, not a missing record (no-leak proven). No non-visible tenant/project id in any body |
| R4 | **Nothing provisioned/mutated/re-homed — DATA-LEVEL:** tenant/membership/project fixtures and all candidate/published/source tables show before==after across the full catalog+summary+projects+resolve flow; no `tenant_id` column created; no migration/backfill run | **PASS** — all **25** SQLite tables COUNT(*) before==after exercising every endpoint × every branch × 3 actors (changed=`{}`); no `tenant_id` column on any table; fixtures are process-local, no migration/backfill |
| R5 | All-false 8-flag `TenantMutationGuard` on every live response (list/summary/projects/resolve); `cross_tenant_access_granted=false` and `project_rehomed=false` observed at runtime; error responses carry NO `mutation_guard` (guard proof rendered on 200 only, denial via `denial_reason`) | **PASS** — all 8 flags `false` on every 200 (list/summary/projects/resolve), incl. `cross_tenant_access_granted` + `project_rehomed`; every 403/404 envelope carries NO `mutation_guard` (asserted at top-level and inside `error`) |
| R6 | Deterministic + fixture coverage: byte-stable responses for a fixed actor+fixture (modulo any adopted response-time timestamp); fixture proves all 3 isolation outcomes — ≥1 ACTIVE-member tenant (with projects), ≥1 not-a-member tenant (→404, projects never appear), ≥1 inactive relationship (membership or tenant SUSPENDED →403) (G5) | **PASS** — 6 tenants/2 actors/6 memberships/7 projects cover all outcomes: ACTIVE (acme/globex), not-a-member (initech→404), ARCHIVED (hooli→404), membership-suspended (umbrella→403), tenant-suspended (soylent→403); responses deterministic (fixture-stable `created_at`, no response-time timestamp) |
| R7 | No code-level import of any provisioning/membership-mutation/data-migration/`tenant_id`-backfill path; read overlay only; MVP5 `Role`/MVP1 `Project`/`ProjectSummary` reused by reference with no rename | **PASS** — `tenancy/service.py` imports only `Role` (by reference) + `ApiException`; no DB session, no model write, no migration import; `_decide`/list/get/resolve are pure reads over module-level fixtures; `Role` = 8 MVP5 literals verbatim, `ProjectSummaryRef` = MVP1 shape (no `tenant_id`) |
| R8 | Frontend flow: header tenant-context indicator + client-side switcher (visibility set only; no free-text tenant-id, cross-tenant unreachable by construction); read-only tenant view (summary + tenant-scoped projects); denial states (404-not-leak / 403 suspended / 404 project) clear stale data on switch; persistent "read-only; no provisioning; project scoping unchanged; client-side switch only" boundary banner; live all-false-guard proof line (200 only); no create/edit/invite/switch-write affordance; mock + actual smoke | **PASS** — `smoke:mvp6:tenancy:mock` PASS (3 routes: switcher shows only {Acme,Globex}, non-visible absent, 404-no-leak + 403 negatives, banner+chips+guard proof, no provisioning affordance) and `smoke:mvp6:tenancy:actual` PASS (7 checks vs live backend). **QA fix (in-wave):** `tenantActualGet` + the actual smoke read the error at top-level, but the backend returns the canonical **wrapped** `{"error":{code,message,details}}` envelope — so `denial_reason`/exact-code were lost on the ACTUAL path (mock path unaffected; no leak either way). Fixed by unwrapping `.error` in both; re-ran green |
| R9 | MVP1–MVP6.9 regression + touched smokes green; additive module + additive router registration; existing `Projects` surface NOT re-scoped; candidate/published separation intact | **PASS** — backend full suite **229 passed**, ruff clean; tenancy 30 + connectors 30; FE test **100/100**, build clean; connectors + governance mock smokes PASS (single active LNB intact); router registration is +2 lines additive; `GET /projects` unchanged and tenant-unaware (no `tenant_id`); candidate/published tables 0-row/unchanged |

## Wave52 Gates (recorded)
- **G1 — dev actor resolution: RECORDED.** Optional dev-only `actor_id` query param
  (modeled as `ActorIdQuery` on every endpoint) lets QA be a member / non-member /
  suspended actor deterministically for the negative isolation gates; absent →
  MVP5 dev-auth actor. **Never a real auth/JWT claim.** Exact mechanism finalized
  in Wave52.
- **G3 — persist-vs-compute: RECORDED (open).** Process-local store +
  `reset_runtime_store()` (MVP6.1–6.9 pattern) vs compute-on-read for the
  tenant/membership/mapping fixtures — Backend/Wave52 decision. Either way:
  read-only + all-false guard; no contract shape change.
- **G5 — fixture ids/counts covering all 3 isolation outcomes: RECORDED.** The mock
  set MUST prove: ≥1 tenant the actor is an ACTIVE member of (with projects); ≥1
  tenant the actor is NOT a member of (isolation target → 404, its projects never
  appear); ≥1 inactive relationship (membership or tenant SUSPENDED → 403). Backend
  fixes exact ids/counts in Wave52; contract already types everything for it.
- **ERROR-ENVELOPE-GUARD — COMMANDER RULING (recorded, resolves FE G3):** error
  responses do **NOT** carry `mutation_guard`. FE renders the all-false guard proof
  on **200 responses only** and drives denial states from
  `ApiError.details.denial_reason`. Errors mutate nothing by definition, so no
  guard on error envelopes is required. `ApiError` stays `{code, message, details}`;
  no `mutation_guard` added. This is the frozen behavior for Wave52 — QA does NOT
  assert a guard on 403/404 envelopes.
- **G4 — endpoint #4 (`/projects/{id}/tenant`): default KEEP** (adds demo value;
  enforces the same isolation). Trim only if it complicates isolation without payoff.
- **Response timestamp:** `created_at` on tenants is fixture-stable; no response-time
  `generated_at` modeled in P0. If added later it MUST be excluded from any
  byte-stable determinism assertion.

## PM/BE/FE Agreement + FE Gap Reconciliation
- **Agree:** P0 flow, single-level tenant + `TenantMembership(actor_id, tenant_id,
  role, status)` model, read-only + strict-isolation + no-provisioning +
  additive-over-project-scoping boundary, all-false 8-flag guard, authz, exclusions,
  reuse-by-reference (MVP5 `Role`, MVP1 `Project`/`ProjectSummary`; no renames). No
  contradiction found across PM brief / ADR 0017 / BE draft+OpenAPI / FE requirements.
- **Enum/field drift: 0.** Backend draft landed during the wave; Frontend reconciled
  §7/§8 against it and reports drift 0 (`TenantSummary.my_membership` supplies
  switcher row role/status inline — no N+1; `ProjectSummaryRef` = MVP1 by reference,
  no `tenant_id`; 4 `*Response` wrappers confirmed).
- **FE gaps resolved by the BE draft:** G1/G2/G4/G5/G6/G7/G10 RESOLVED. G3 (no guard
  on error envelope) resolved by the COMMANDER RULING above. G8 → Wave52 gate
  (persist-vs-compute / client-side active-tenant continuity). G9 → PM copy (H1
  `테넌트 컨텍스트`, D6 token KO glosses, boundary chip labels).
- **No renames:** MVP5 `Role` (8 literals verbatim) and MVP1 `Project`/`ProjectStatus`/
  `ProjectSummary` reused by reference; `Role`/`ProjectSummaryRef` declared locally in
  the OpenAPI only to keep the draft self-contained (shapes/names match MVP5/MVP1).

## Validation (Wave51) — exact commands + output
```text
$ python3 -m json.tool docs/api/openapi-mvp6-10-draft.json > /dev/null && echo PARSE_OK
PARSE_OK

# structural + isolation assertion (python)
openapi: 3.1.0 | version: 0.6.10-draft
num_paths: 4
PATH /api/v1/projects/{project_id}/tenant ['get']
PATH /api/v1/tenants ['get']
PATH /api/v1/tenants/{tenant_id} ['get']
PATH /api/v1/tenants/{tenant_id}/projects ['get']
num_schemas: 13
ENUM TenantStatus = ['ACTIVE', 'SUSPENDED', 'ARCHIVED']
ENUM TenantMembershipStatus = ['ACTIVE', 'SUSPENDED']
ENUM TenantAccessDenialReason = ['NOT_A_MEMBER', 'TENANT_ARCHIVED', 'MEMBERSHIP_SUSPENDED', 'TENANT_SUSPENDED']
ENUM Role = ['SYSTEM_ADMIN','PROJECT_ADMIN','ONTOLOGY_MANAGER','DATA_MANAGER','EXTRACTION_MANAGER','REVIEWER','VIEWER','API_CLIENT']
guard flags: 8 | ALL_FALSE: True | required: 8
guard flag names: ['candidate_graph_mutated','cross_tenant_access_granted','membership_mutated','project_rehomed','published_graph_mutated','tenant_created','tenant_deleted','tenant_updated']
error code present: TENANT_NOT_FOUND -> True
error code present: TENANT_ACCESS_SUSPENDED -> True
error code present: PROJECT_NOT_FOUND -> True
mutation_guard on TenantListResponse/TenantSummaryResponse/TenantProjectListResponse/ProjectTenantResponse : True (all four)

# per-operation error responses (isolation wiring)
/api/v1/tenants            GET -> ['200']            (visibility-set only; never denies)
/api/v1/tenants/{tenant_id} GET -> ['200','403','404']
/api/v1/tenants/{tenant_id}/projects GET -> ['200','403','404']
/api/v1/projects/{project_id}/tenant GET -> ['200','403','404']
ApiError props: ['code','details','message']   (NO mutation_guard — commander ruling)
ApiError.details.denial_reason -> $ref TenantAccessDenialReason
params: ['ActorIdQuery','ProjectIdPath','TenantIdPath']   (dev-only actor_id present, G1)
DISJOINT_ADDITIVE: True   (4 paths disjoint from every existing openapi-mvp*.json)

$ rg -n 'tenant|Tenant|TenantMutationGuard|multi-tenant|mvp6.10' apps infra --glob '!**/node_modules/**'
(0 matches — EXIT=1; no runtime leaked)

$ git diff --check
CHECK_OK
```

## Recommendation
Open **Wave52 MVP6.10 Multi-tenant thin implementation** (read-only tenant context
+ strict isolation; deterministic tenant/membership/mapping fixtures covering all 3
isolation outcomes; process-local store if persist is chosen; all-false 8-flag
guard; no `tenant_id` column/migration; existing project scoping untouched). PM
freezes G1(`actor_id`)/G3(persist-vs-compute)/G5(fixture ids·counts) and the G9 copy;
Backend implements the 4 additive read-only endpoints; Frontend adds the header
tenant-context indicator + client-side switcher + contextual read-only tenant view
(no new global LNB item, per ADR 0010); QA independently verifies R1–R9 with the
**isolation gate (R2/R3) as the headline** — cross-tenant access denied, 404-not-leak,
no data-level leak — plus the data-level "nothing provisioned/mutated/re-homed /
all-false guard / no `tenant_id` migration" proof. Not a hardening or redesign wave —
the planning contract is coherent, additive, and drift-free.
```
