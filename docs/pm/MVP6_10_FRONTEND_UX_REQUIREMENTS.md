# MVP6.10 Multi-tenant Frontend UX/API Requirements

Status: `WAVE51 CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-09
Owner: Frontend / UIUX Architecture
Backlog ID: `FE6-094`

This document defines the frontend requirements for the MVP6.10 **Multi-tenant
Runtime** P0 (read-only tenant context + strict isolation; no provisioning; no
tenant/membership mutation; no cross-tenant read; existing project scoping
unchanged; deterministic mock; all-false 8-flag mutation guard). It is
**requirements only**: no runtime route, component, type, API client, mock
fixture, or smoke code is produced in this wave. Runtime waits for Wave52.

## Source Documents

- `AGENTS.md` (Frontend Rules)
- `.agents/skills/handoff-reporting/SKILL.md`
- `docs/handoffs/CURRENT_STATE.md`
- `docs/handoffs/wave-051/NEXT_ORDERS.md`
- `docs/handoffs/wave-051/PM_REPORT.md`
- `docs/pm/MVP6_10_MULTI_TENANT_BRIEF.md`
- `docs/adr/0017-mvp6-10-multi-tenant-read-only-context-strict-isolation-no-provisioning-additive-over-project-scoping-boundary.md`
- `docs/pm/UIUX_REMEDIATION_DECISIONS.md` (D1 LNB IA, D3 copy policy, D6 badges)
- `docs/adr/0010-lnb-project-context-information-architecture.md`
- `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md`
- Format precedent: `docs/pm/MVP6_9_FRONTEND_UX_REQUIREMENTS.md`
- UX precedent: MVP5 admin/RBAC permission-limited surfaces; the existing
  app-shell header + global-zone `Projects` list (`apps/frontend/src/shared/layout/AppShell.tsx`,
  `navigation.ts`, `ProjectsPage`).

> **Backend draft: reconciled.** The Backend contract draft
> (`docs/api/MVP6_10_MULTI_TENANT_API_CONTRACT_DRAFT.md` +
> `docs/api/openapi-mvp6-10-draft.json`) landed during this wave (Backend
> `BE6-074`~`BE6-075`). This document is grounded on the frozen PM brief and
> **reconciled against that Backend draft**; field/enum names below match the
> draft verbatim (`TenantStatus`, `TenantMembershipStatus`,
> `TenantAccessDenialReason`, the 8-flag `TenantMutationGuard`, `TenantSummary`,
> `TenantMembership`, `ProjectSummaryRef`, the four `*Response` wrappers). §8
> records which FE gaps the draft resolved and the one that remains
> **NEEDS-CONFIRM** (guard on error envelopes). There is **0 enum/field drift**
> between this doc and the draft; the draft reuses MVP5 `Role` + MVP1
> `Project`/`ProjectSummary` by reference with no renames (ADR 0017).

## Backlog Coverage

| ID | Requirement output |
|---|---|
| `FE6-094` | Tenant context indicator/switcher placement per ADR 0010; read-only tenant/workspace view (tenant summary + tenant-scoped project list); isolation-limited states (cross-tenant denied — 404-not-leak / 403-suspended, no data leak); "read-only context; no provisioning; existing project scoping unchanged" boundary copy; live all-false 8-flag `TenantMutationGuard` proof line; first-class loading / empty(no-tenants) / error / permission states; `TenantStatus`/`TenantMembershipStatus` as D6 badges; DTO gap analysis vs the Backend draft |

## Scope Guard

MVP6.10 P0 is a **read-only tenant context surfaced over the existing project
scoping**, with strict isolation as the headline invariant:

```text
authenticate as the dev actor
-> open the Tenant Context indicator (top-level, app-shell header)
-> see ONLY the tenants I am an ACTIVE member of (my visibility set)
-> switch active tenant (client-side only — no server session write)
-> read the active tenant summary (TenantStatus + my membership role/status)
-> read that tenant's projects (tenant-scoped project list)
-> from a project, resolve which tenant it lives in
-> a tenant I do NOT belong to (deep-link/stale id) -> 404 TENANT_NOT_FOUND (no leak)
-> a tenant with a suspended relationship -> 403 TENANT_ACCESS_SUSPENDED
```

The UI must **never** imply that opening the tenant surface provisions a tenant,
that switching creates/joins/leaves an organization, that any membership or role
is mutated, or that a project is re-homed into a different tenant. There is **no**
create / edit / rename / delete / invite / add-member / remove-member /
role-change / switch-org-write / provision affordance anywhere in this surface.
The switcher only changes **client-side view state** — it writes no server
session/state (PM gate G5). The UI must **NEVER** display another tenant's
record, name, count, or data.

Out of scope for Wave51 and MVP6.10 P0 UI (mirror the PM exclusions): tenant
create / update / delete; membership mutation (invite / add / remove /
role-change); cross-tenant access of any kind; tenant-level billing / quota /
usage enforcement; data re-homing / migration / `tenant_id` backfill; real
auth / SSO / OIDC tenancy + JWT tenant claim; per-tenant object-storage / search
/ vector partitioning; two-level Organization↔Workspace hierarchy
(`Organization` / `Workspace` / `TenantSetting` as distinct objects);
cross-domain ontology alignment / mapping; domain / usage dashboards; server-side
/ session-scoped tenant switching; any candidate or published-graph mutation.

## 1. Placement / Information Architecture (per ADR 0010)

### 1.1 Decision: a top-level tenant CONTEXT INDICATOR + client-side switcher in the app-shell header (global, above the two zones)

Per ADR 0010 (LNB two-zone IA) and D1, the tenant surface is **not** a new LNB
item. A tenant is not a "work area" (Build/Review/Publish/Analyze) and not a
project-scoped destination; it is the **outer context that scopes everything
else**. It therefore lives as a **top-level context indicator + client-side
switcher in the app-shell header** — above the Global zone (Dashboard / Projects
/ Admin) and the Project zone — analogous to a workspace/org switcher, alongside
the existing brand + project selector + user chip.

```text
APP-SHELL HEADER (global, above both LNB zones)
├─ Brand (Ontology · Data Platform)
├─ [ Tenant Context indicator ▾ ]   ← NEW: active tenant + client-side switcher
│     • label: active tenant name + TenantStatus badge
│     • dropdown: MY ACTIVE tenants only (visibility set); no "create/join org"
├─ Project selector (existing)
└─ User chip (existing)

LNB (unchanged by this theme)
├─ GLOBAL  : Dashboard · Projects · Admin
└─ PROJECT : Build · Review · Publish · Analyze   (rendered when a project selected)
```

**Justification (header indicator over a new LNB item):**

1. **ADR 0010 §Decision forbids ID-bound detail pages in the LNB**, and freezes
   the global zone as exactly Dashboard / Projects / Admin. A tenant view is
   parameterized by `tenant_id`; promoting it to a global LNB item would be
   exactly the ID-bound global page ADR 0010 (and PM gate G5) forbid. A header
   context indicator adds **zero** LNB items and keeps the frozen two-zone model
   intact.
2. **A tenant is a scoping context, not a destination.** It conditions which
   projects the Projects list and the whole Project zone operate over — the same
   role a workspace/org switcher plays in mainstream tools. The header is where
   users expect to see and change "which world am I in", separate from "where am
   I going" (the LNB).
3. **The switcher is client-side only (G5).** It sets a view-state active-tenant
   (persisted in local storage like the existing recent-project key), never a
   server session write, and only ever lists the actor's ACTIVE-member tenants —
   so cross-tenant selection is not reachable through the control at all
   (isolation-by-construction; see §2).
4. Discoverability + honesty: a persistent header indicator makes the current
   tenant always visible (so the user never misreads project data as belonging to
   the wrong tenant), while keeping the "read-only context; nothing provisioned"
   story attached to the one place tenancy is expressed.

**Considered and rejected — a global LNB `Tenants` item.** It would violate the
ADR 0010 frozen global zone + the ID-bound-page rule and read as a
provisioning/admin console (tenant management), which is explicitly out of P0.
Rejected.

### 1.2 Read-only tenant/workspace view (contextual, not an LNB item)

The tenant summary + tenant-scoped project list render in a **read-only Tenant
Context view** reached **from the header indicator** (open detail / "테넌트
컨텍스트 보기"), kept as a **contextual view keyed by the active tenant**, not a
new global LNB destination and not a promoted ID-bound page.

Recommended structure (Section + Card design language):

```text
App-shell header: Tenant Context indicator (active tenant + TenantStatus badge)
-> Read-only-context boundary banner (read-only; no provisioning; project scoping unchanged)
-> Tenant summary card (tenant name/id, TenantStatus badge, my membership role + TenantMembershipStatus)
-> Tenant-scoped project list (Section + Card rows; the active tenant's projects only)
-> live all-false 8-flag TenantMutationGuard proof line
```

**Route treatment (per ADR 0010 / gate G5).** Two acceptable renderings; FE picks
one at Wave52 and keeps it consistent:

- **(a) Preferred — panel/drawer from the header indicator** (no new top-level
  route): the Tenant Context view opens as a contextual panel; the tenant-by-id
  read is driven by the client-side active-tenant, not by a URL id segment. This
  most cleanly honors "no ID-bound global page".
- **(b) Acceptable — a single contextual route** `/tenant` (active-tenant, no id
  in the path) or a contextual `/tenants/:tenantId` reached only from the
  indicator (never surfaced as an LNB item, never linked from a global menu).
  `tenant_id` in the path is a contextual detail (like `review workbench task` /
  `publish job`), not an LNB destination — permitted by ADR 0010's
  contextual-detail carve-out.

### 1.3 Relationship to the existing global `Projects` list (additive, unchanged)

The existing global-zone `Projects` destination and every MVP1–MVP6.9
per-project route are **unchanged and remain tenant-unaware** (ADR 0017 §9): no
`tenant_id` column, no migration, no re-home. In P0 the tenant-scoped project
list is a **new read surface inside the Tenant Context view** (§1.2, driven by
`GET /tenants/{id}/projects`), NOT a rewrite of the global Projects page. FE must
**not** silently re-scope or filter the existing `ProjectsPage` by tenant in this
wave (that would be a behavior change to a shipped surface); if a future wave
wants the global Projects list to reflect the active tenant, that is a separate
PM-frozen decision. The header indicator + Tenant Context view is the only new
surface.

### 1.4 Breadcrumb + copy policy (D3, D4)

- Header indicator label (D3 — active tenant is a data value, shown as-is):
  `<테넌트 이름>` + a `TenantStatus` D6 badge. The control affordance label
  (Korean prose per D3): e.g. `테넌트 컨텍스트`.
- Page/panel H1 (Korean primary, D3): recommend **`테넌트 컨텍스트`**. All prose
  (banner, empty/error/loading, section headers, help text) Korean; system enum
  tokens (`TenantStatus`, `TenantMembershipStatus`, `TenantAccessDenialReason`)
  stay English with a Korean secondary label (D3 intentional-English scope). **PM
  to confirm the H1 wording** (§8 G-C1).
- Breadcrumb (D4): if rendered as a contextual route, `테넌트 컨텍스트 > <테넌트
  이름>`; the tenant-scoped project list rows link into the existing project
  routes (which keep their own breadcrumbs, tenant-unaware).
- No auto-redirect: if the actor has no visible tenant (empty visibility set),
  render the empty state (§3), never redirect.

## 2. Isolation-limited UX (the headline invariant)

Strict isolation is the load-bearing requirement (ADR 0017 §1: **default-deny,
404-not-leak**). The UI enforces it in two layers:

### 2.1 Isolation-by-construction (the switcher only offers the visibility set)

The header switcher dropdown is populated **only** from `GET /api/v1/tenants`
(the actor's visibility set = tenants where the actor has an `ACTIVE`
`TenantMembership` on a non-`ARCHIVED` tenant). It **never** lists, autocompletes,
or hints at any other tenant's id/name/count. There is no free-text tenant-id
entry, no "browse all tenants", no search-across-tenants. Cross-tenant selection
is therefore **not reachable** through the normal UI — the primary isolation
guarantee is that the UI simply never offers another tenant.

### 2.2 Clean denial for out-of-set access (deep-link / stale id / suspended)

A tenant id can still arrive out-of-band (a bookmarked/deep-linked contextual
route, a stale client-side active-tenant after a membership change). The UI must
resolve these cleanly and **never render another tenant's data**:

| Backend response | `TenantAccessDenialReason` | UI treatment |
|---|---|---|
| `404 TENANT_NOT_FOUND` | `NOT_A_MEMBER` or `TENANT_ARCHIVED` | Neutral **not-found** state — "요청하신 테넌트를 찾을 수 없습니다." Reveal **nothing** about existence, name, or count (the 404 exists precisely so the UI cannot leak that the tenant exists). Recovery: return to the visibility set (re-open the switcher / fall back to a valid active tenant). NEVER a 403 here (existence not leaked). |
| `403 TENANT_ACCESS_SUSPENDED` | `MEMBERSHIP_SUSPENDED` or `TENANT_SUSPENDED` | **Access-suspended** state (permission-limited tone) — "이 테넌트에 대한 접근이 일시 중단되었습니다." May acknowledge the relationship exists but is inactive; render **no** tenant summary/project data. Recovery: switch to an active tenant. |
| `404 PROJECT_NOT_FOUND` | (project→tenant resolve out of visibility) | Neutral not-found on the project→tenant resolve; no cross-tenant project data shown. |

Hard rules:

- On **any** denial (404/403), the previously shown tenant's data must be cleared
  — never leave stale tenant-A data on screen while resolving tenant-B.
- The tenant-scoped project list for tenant `A` renders **only** tenant `A`'s
  projects; a project from tenant `B` must never appear under `A` (the list is
  fully server-authoritative — FE does not merge/cache across tenants).
- After a client-side switch, all tenant-scoped reads (summary, project list) are
  re-fetched for the new active tenant; no cross-tenant response reuse.
- `403 PERMISSION_DENIED` is **reserved** for future role-gated writes and is not
  produced by P0 reads; FE treats an unexpected `PERMISSION_DENIED` as a
  standard permission-limited surface but does not build P0 UX around it.

## 3. State Requirements (first-class)

Per AGENTS.md Frontend Rules ("모든 화면은 loading, empty, error 상태를 가진다"),
every tenant surface has loading / empty / error / permission states.

| State | Required behavior |
|---|---|
| Loading — my tenants | Skeleton in the header indicator while `GET /tenants` resolves; the read-only-context boundary banner (§4) renders immediately (static safety copy), independent of data load. |
| Loading — tenant summary | Skeleton for the summary card while `GET /tenants/{id}` resolves. |
| Loading — tenant projects | Skeleton rows for the tenant-scoped project list while `GET /tenants/{id}/projects` resolves; do not show a previous tenant's projects as if current. |
| **Empty — no tenants** (first-class) | Visibility set is empty: the indicator shows a neutral "소속된 테넌트 없음" state and the Tenant Context view shows an empty state — "표시할 테넌트가 없습니다. 활성 멤버십이 있는 테넌트만 표시됩니다." NEVER fabricate a tenant, NEVER show another tenant, NEVER offer a "create tenant" CTA. No auto-redirect. |
| Empty — tenant has no projects | `GET /tenants/{id}/projects` returns 0: "이 테넌트에 프로젝트가 없습니다." — do not imply a project was moved/removed. |
| Error | Preserve the current valid active-tenant context, show a retry affordance. Distinguish a transport/server failure from a valid isolation **denial** (404/403 are handled per §2, not as generic errors). |
| Permission-limited / suspended | `403 TENANT_ACCESS_SUSPENDED` → access-suspended surface (§2.2), `PERMISSION_LIMITED` D6 tone; render no tenant data. |
| Not-found | `404 TENANT_NOT_FOUND` / `404 PROJECT_NOT_FOUND` → neutral not-found surface (§2.2); no existence/data leak. |
| Guard-violation (defensive) | If any of the 8 `TenantMutationGuard` flags is ever `true` in a response (impossible in P0), switch to an error/guard-violation state. The guard is rendered as **live evidence** read from the response, never hardcoded (§4). |

## 4. Read-only-context boundary banner + all-false guard proof line

### 4.1 Boundary banner (always visible) — the safety spine

A persistent, non-dismissible info banner at the top of the Tenant Context view.
This is the load-bearing "read-only context; no provisioning; existing project
scoping unchanged" statement the PM order + QA require to be crystal clear.

Required copy (Korean primary, tokens stay English per D3):

- Headline: `테넌트 컨텍스트는 읽기 전용입니다. 아무것도 만들거나 변경하지 않습니다.`
  ("The tenant context is read-only. Nothing is created or changed.")
- Supporting line:
  `내가 활성 멤버인 테넌트만 조회합니다. 테넌트나 멤버십을 만들거나 수정·삭제하지 않고, 프로젝트를 다른 테넌트로 옮기지 않으며, 다른 테넌트의 데이터에는 접근하지 않습니다. 기존 프로젝트 범위는 그대로입니다. 테넌트 전환은 화면 상태만 바꿀 뿐 서버에 저장되지 않습니다.`
  ("Only tenants I'm an active member of. No tenant/membership create/edit/delete,
  no project re-homing, no cross-tenant data access. Existing project scoping is
  unchanged. Switching tenant only changes view state — it is not saved to the
  server.")
- Boundary chips (small, `info`/`neutral`/`warning` tone), each an
  intentional-English token with a Korean gloss:
  `READ_ONLY_CONTEXT · 읽기 전용 컨텍스트`, `NO_PROVISIONING · 프로비저닝 없음`,
  `NO_CROSS_TENANT · 교차 테넌트 없음`, `SCOPING_UNCHANGED · 기존 범위 유지`,
  `CLIENT_SIDE_SWITCH · 화면 전환만`.

### 4.2 The all-false 8-flag `TenantMutationGuard` proof line (required)

The banner (or an adjacent collapsible block) renders the response
`TenantMutationGuard` as a **live** read-only proof block, present on every
tenant surface. It lists all **8** frozen guard flags and shows each as `false`:

```text
tenant_created: false             tenant_updated: false
tenant_deleted: false             membership_mutated: false
project_rehomed: false            cross_tenant_access_granted: false
candidate_graph_mutated: false    published_graph_mutated: false
```

The UI reads these flags **from the API response** (it does not hardcode them);
if any flag is ever `true`, the UI must switch to an error/guard-violation state
(§3). `project_rehomed` and `cross_tenant_access_granted` are the
isolation-specific flags to surface most prominently as the "nothing re-homed /
no cross-tenant access" proof (PM brief §8). The guard is live evidence, not
decorative copy.

### 4.3 No mutation affordances (restated)

No create / edit / rename / delete / invite / add-member / remove-member /
role-change / provision / "switch org (server)" / apply button exists anywhere in
this surface. The only interactive control is the **client-side** active-tenant
switcher (§2.1) and read navigation (open tenant summary, open a project). The
switcher must never render as a mutation ("join"/"leave"/"create org") — its copy
is "테넌트 전환" (switch view), not "테넌트 생성/참여".

## 5. Design Language Application (Section + Card, KO titles, D6 badges)

- **Section + Card** layout: the Tenant Context view is a Section header +
  read-only-context boundary banner + tenant summary card + tenant-scoped project
  list (Section + Card rows) + live guard proof line. Tables only if a dense
  project list needs them; cards preferred.
- **Korean titles** (D3): H1 `테넌트 컨텍스트` (PM to confirm); all prose Korean;
  system enum tokens stay English with a Korean secondary label; tenant/project
  **names** are data values shown as-is.
- **D6 status-token badges** — every status token renders as
  `[icon] TOKEN · 한국어보조라벨` in one `HanaBadge` (tone + icon + English token
  + Korean gloss; never color alone). New tokens extend the D6 §6.3 table with the
  same rule (glosses are FE proposals, **PM to confirm** — §8 G-C1):

  | Token | Enum | Tone | Icon (lucide) | Korean secondary label |
  |---|---|---|---|---|
  | `ACTIVE` | `TenantStatus` / `TenantMembershipStatus` | success | `CheckCircle2` | 활성 |
  | `SUSPENDED` | `TenantStatus` / `TenantMembershipStatus` | warning | `PauseCircle` | 일시 중단 |
  | `ARCHIVED` | `TenantStatus` | neutral | `Archive` | 보관됨 |
  | `NOT_A_MEMBER` | `TenantAccessDenialReason` | neutral | `MinusCircle` | 멤버 아님 |
  | `TENANT_ARCHIVED` | `TenantAccessDenialReason` | neutral | `Archive` | 테넌트 보관됨 |
  | `MEMBERSHIP_SUSPENDED` | `TenantAccessDenialReason` | warning | `PauseCircle` | 멤버십 중단 |
  | `TENANT_SUSPENDED` | `TenantAccessDenialReason` | warning | `PauseCircle` | 테넌트 중단 |

  Note: `TenantStatus` and `TenantMembershipStatus` share the `ACTIVE`/`SUSPENDED`
  literals but are **different enums** on **different objects** (tenant vs the
  actor's membership); render them in their own labelled slots (tenant status on
  the summary; membership status next to the membership `Role`) so the two are
  never conflated. The membership `role` renders with the existing MVP5 `Role`
  badge treatment (reused verbatim; no new token). Reason tokens
  (`TenantAccessDenialReason`) appear only in the denial states (§2.2), reusing
  the `PERMISSION_LIMITED` warning tone for suspended.

## 6. Frontend Acceptance Notes

- The active tenant is always visible in the header; the user can never misread
  project data as belonging to the wrong tenant.
- The switcher lists **only** the actor's ACTIVE-member tenants (visibility set);
  no other tenant's id/name/count is ever offered, autocompleted, or shown.
- Cross-tenant access is denied cleanly: `404 TENANT_NOT_FOUND` (no
  existence/name/count/data leak) for not-a-member/archived; `403
  TENANT_ACCESS_SUSPENDED` for a suspended relationship; another tenant's data is
  never rendered; stale tenant-A data is cleared before resolving tenant-B.
- The read-only-context / no-provisioning / scoping-unchanged boundary is visible
  at all times (persistent banner + live all-false 8-flag guard proof line); no
  create/edit/invite/switch-org-write/provision affordance exists anywhere.
- The switcher changes **client-side view state only** (no server session/state
  write, gate G5).
- Existing global `Projects` + all MVP1–MVP6.9 per-project routes are unchanged
  (tenant-unaware); the tenant-scoped project list is a new read surface, not a
  re-scope of the shipped Projects page.
- hana components only via `src/shared/ui/hana` adapter. Additive only; no
  MVP1–MVP6.9 route/enum/smoke break; no rename of reused shapes (MVP5 `Role`,
  MVP1 `Project`/`ProjectStatus`). Boundary per ADR 0017.

## 7. API / Field Requirements + Enum Inventory (exact frozen names)

Naming convention (MVP6.x + the PM brief): DTO/schema names PascalCase, JSON
fields snake_case, enum literals UPPER_SNAKE_CASE. `Blocking` = needed for P0 UX
correctness + QA acceptance. `Optional` = usability, deferrable.

### 7.1 Endpoints (from PM brief §4 — Backend to finalize)

```text
GET  /api/v1/tenants                          # my tenants (visibility set only)
GET  /api/v1/tenants/{tenant_id}              # tenant summary (member-only)
GET  /api/v1/tenants/{tenant_id}/projects     # tenant-scoped projects
GET  /api/v1/projects/{project_id}/tenant     # resolve a project's tenant (trimmable — gate G4)
```

Isolation error mapping (PM brief §5): `404 TENANT_NOT_FOUND`
(not-a-member/archived — existence not leaked); `403 TENANT_ACCESS_SUSPENDED`
(membership or tenant `SUSPENDED`); `404 PROJECT_NOT_FOUND` (project→tenant out of
visibility). `403 PERMISSION_DENIED` reserved (not produced by P0 reads).

### 7.2 Blocking fields (matched to the Backend draft `Key DTOs`)

- `mutation_guard` (`TenantMutationGuard`) on **every** 200 response, all 8
  frozen flags present and `false` (§4.2).
- **`TenantSummary`** — the shared item shape for the list, the summary, and the
  project→tenant resolve: `id`, `display_name`, `description`, `status`
  (`TenantStatus`), `my_membership` (`TenantMembership` — `actor_id`, `tenant_id`,
  `role`=MVP5 `Role`, `status`=`TenantMembershipStatus`), `project_count` (exact,
  tenant-scoped), `created_at`. Drives both the switcher rows (name + status +
  my_membership badge) and the summary card with **no** N+1 fetch. Never carries
  another actor's membership or another tenant's data.
- **`TenantListResponse`** (`GET /tenants`): `actor_id`, `items[TenantSummary]`,
  exact `total_count`, `mutation_guard`.
- **`TenantSummaryResponse`** (`GET /tenants/{id}`): `actor_id`, `tenant`
  (`TenantSummary`), `mutation_guard`.
- **`TenantProjectListResponse`** (`GET /tenants/{id}/projects`): `actor_id`,
  `tenant_id`, `items[ProjectSummaryRef]`, exact `total_count`, `mutation_guard`.
  `ProjectSummaryRef` reuses MVP1 `ProjectSummary` by reference (`id`, `name`,
  `description`, `status`, `created_at`, `updated_at`, `source_count`,
  `ontology_version_count`; **no `tenant_id` field added**) — rows link into the
  existing project routes.
- **`ProjectTenantResponse`** (`GET /projects/{id}/tenant`, kept — G4 default):
  `actor_id`, `project_id`, `tenant` (`TenantSummary`), `mutation_guard`.
- **Denial** (`ApiError` `{code, message, details}`): `code` ∈ {`TENANT_NOT_FOUND`,
  `TENANT_ACCESS_SUSPENDED`, `PROJECT_NOT_FOUND`}; `details.denial_reason` is a
  `TenantAccessDenialReason` — FE reads it to pick the denial state + D6 badge
  (§2.2).

### 7.3 Enum Inventory (exact frozen names — PM brief §6)

- `TenantStatus`: `ACTIVE`, `SUSPENDED`, `ARCHIVED`.
- `TenantMembershipStatus`: `ACTIVE`, `SUSPENDED`.
- `TenantAccessDenialReason`: `NOT_A_MEMBER`, `TENANT_ARCHIVED`,
  `MEMBERSHIP_SUSPENDED`, `TENANT_SUSPENDED`.
- `TenantMutationGuard` (8 flags, all always `false`): `tenant_created`,
  `tenant_updated`, `tenant_deleted`, `membership_mutated`, `project_rehomed`,
  `cross_tenant_access_granted`, `candidate_graph_mutated`,
  `published_graph_mutated`.
- Membership `role`: MVP5 `Role` verbatim (no new literal/enum).

Reused by reference (no rename): MVP5 `Role` + dev-auth actor + audit-shape
conventions; MVP1 `Project` / `ProjectStatus` + per-project endpoints (tenant
data reused as the **would-be** container only, never re-homed).

## 8. DTO / Field Gap Analysis vs the Backend Draft

Reconciled against `docs/api/MVP6_10_MULTI_TENANT_API_CONTRACT_DRAFT.md` +
`docs/api/openapi-mvp6-10-draft.json` (landed this wave). Most FE gaps are
**RESOLVED** by the draft; one is **NEEDS-CONFIRM** (guard on error envelopes),
several are Backend/PM **Wave52 gates**, and one is a **PM-DECISION** (copy/IA).
There is **0 enum/field-name drift** between this doc and the draft.

| # | Gap | FE need | Status vs Backend draft |
|---|---|---|---|
| G1 | **My-tenants list item shape** | Badge each switcher row with membership role + status without an N+1 fetch. | **RESOLVED.** `GET /tenants` → `TenantListResponse.items[TenantSummary]`, and `TenantSummary` carries `my_membership` (`role`=MVP5 `Role` + `status`=`TenantMembershipStatus`) + `status` (`TenantStatus`) inline. FE renders the switcher + summary from the list alone. |
| G2 | **Denial-reason field on 403/404 body** | Pick the exact `TenantAccessDenialReason` denial state + D6 badge (§2.2). | **RESOLVED.** `ApiError.details.denial_reason` is a `TenantAccessDenialReason`; `code` ∈ {`TENANT_NOT_FOUND`(404), `TENANT_ACCESS_SUSPENDED`(403), `PROJECT_NOT_FOUND`(404)}. Split frozen (draft G2): not-a-member/ARCHIVED→404, suspended→403. |
| G3 | **Guard on error responses** | Whether the all-false guard proof line renders on 403/404, not only 200. | **NEEDS-CONFIRM.** The draft states "all-false guard on every response" but the `ApiError` shape is `{code, message, details}` — **no `mutation_guard` field on the error envelope**. FE therefore renders the guard proof line on **200 only**; on denial the `denial_reason` drives the state (§2.2). If QA wants a guard on error bodies too, Backend adds `mutation_guard` to `ApiError` in Wave52; otherwise this is the documented behavior. Non-blocking. |
| G4 | **Project→tenant endpoint (#4) in/out** | Whether to build the project→tenant read. | **RESOLVED (kept).** `GET /projects/{id}/tenant` → `ProjectTenantResponse` is in the draft; default keep (draft G4). Out-of-visibility → `404 PROJECT_NOT_FOUND`. |
| G5 | **Tenant-scoped project item shape** | Reuse MVP1 project shape; rows link into existing routes. | **RESOLVED.** `ProjectSummaryRef` reuses MVP1 `ProjectSummary` by reference (`id`, `name`, `description`, `status`, `created_at`, `updated_at`, `source_count`, `ontology_version_count`); **no `tenant_id` field added**, no rename. |
| G6 | **Project count source** | Show a tenant's project count on the summary. | **RESOLVED.** `TenantSummary.project_count` = exact tenant-scoped count. |
| G7 | **Actor simulation for negative/cross-tenant demo** | Wave52 smoke must act as member / non-member / suspended actor to exercise 404/403. | **RESOLVED (Wave52 gate).** Optional `actor_id` query param modeled on every endpoint (draft G1), mirroring MVP6.5 governance; never a real auth/JWT claim. Exact mechanism finalized in Wave52; affects smoke, not the P0 UI shape. |
| G8 | **Persist-vs-compute / active-tenant continuity** | Client-side active-tenant persists (local storage); a stale id must resolve to 404/403, not crash. | **Wave52 gate (draft G3).** Either backend choice is fine; no contract shape change. FE treats active-tenant as client view state and always re-validates against `GET /tenants`. |
| G9 | **H1 wording + KO glosses + chip/token labels** | `테넌트 컨텍스트` H1; KO secondary labels for the new D6 tokens + boundary chips. | **PM-DECISION** (not a Backend field). FE proposals in §1.4/§4.1/§5. |
| G10 | **Response timestamp / determinism** | Any freshness marker on the tenant view. | **RESOLVED (none in P0).** `TenantSummary.created_at` is fixture-stable; no response-time `generated_at` is modeled (draft "Response timestamp"). FE shows no freshness marker; nothing to gate on. |

Only **G3** (guard-on-error) is a real open confirm, and it is non-blocking (FE
renders the guard on 200, denial state on error). G7/G8 are Wave52 gates; G9 is a
PM copy/IA confirm. There is 0 enum/field drift; the brief's names hold — no
renames (ADR 0017).

## 9. Non-negotiable Boundary Restated (FE view)

- The tenant surface is **read-only context only.** It **provisions nothing,
  mutates nothing, re-homes nothing.** No create / edit / rename / delete /
  invite / add-member / remove-member / role-change / provision / switch-org-write
  affordance exists anywhere.
- **Strict isolation (default-deny, 404-not-leak).** The switcher offers only the
  actor's ACTIVE-member visibility set; out-of-set access returns `404
  TENANT_NOT_FOUND` (no existence/name/count/data leak) or `403
  TENANT_ACCESS_SUSPENDED`; another tenant's data is **never** rendered; no
  cross-tenant response reuse or merge.
- **Existing project scoping unchanged.** MVP1 `Project` + all MVP1–MVP6.9
  per-project routes remain tenant-unaware; no `tenant_id` column, migration, or
  re-home; the tenant-scoped project list is an additive read surface.
- **Client-side switch only** (gate G5): the switcher writes no server
  session/state.
- Every response carries an **all-false** `TenantMutationGuard` (8 flags),
  rendered as a live proof line read from the response, not hardcoded; any `true`
  flag (impossible in P0) forces a guard-violation state.
- Additive only; no MVP1–MVP6.9 break; no rename of reused shapes (MVP5 `Role`,
  MVP1 `Project`/`ProjectStatus`); boundary per ADR 0017.
</content>
</invoke>
