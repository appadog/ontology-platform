# MVP6.9 Connectors Frontend UX/API Requirements

Status: `WAVE49 CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-08
Owner: Frontend / UIUX Architecture
Backlog ID: `FE6-089`

This document defines the frontend requirements for the MVP6.9 **Connectors** P0
(read-only connector catalog + deterministic dry-run import preview; no external
write; no live/scheduled sync; no real network/credential execution; masked
secrets only; all-false mutation guard). It is **requirements only**: no runtime
route, component, type, API client, mock fixture, or smoke code is produced in
this wave. Runtime waits for Wave50.

## Source Documents

- `AGENTS.md` (Frontend Rules)
- `.agents/skills/handoff-reporting/SKILL.md`
- `docs/handoffs/CURRENT_STATE.md`
- `docs/handoffs/wave-049/NEXT_ORDERS.md`
- `docs/handoffs/wave-049/PM_REPORT.md`
- `docs/pm/MVP6_9_CONNECTORS_BRIEF.md`
- `docs/adr/0016-mvp6-9-connectors-read-only-catalog-dry-run-preview-no-external-write-no-real-network-masked-secret-boundary.md`
- `docs/pm/UIUX_REMEDIATION_DECISIONS.md` (D1 LNB IA, D3 copy policy, D6 badges)
- `docs/adr/0010-lnb-project-context-information-architecture.md`
- `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md`
- `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md`
- Format precedent: `docs/pm/MVP6_8_FRONTEND_UX_REQUIREMENTS.md`
- UX precedent (masked-secret + dry-run): the MVP5 admin credentials + JSON
  import dry-run UI; the MVP2 Sources ingestion UI.

> **Backend draft: reconciled.** The Backend contract draft
> (`docs/api/MVP6_9_CONNECTORS_API_CONTRACT_DRAFT.md`) and
> `docs/api/openapi-mvp6-9-draft.json` (OpenAPI 3.1.0, `0.6.9-draft`, 3 paths /
> 16 schemas, disjoint-additive) landed during this wave (Backend `BE6-068`~
> `BE6-069`). This document is grounded on the frozen PM brief and **reconciled
> against that Backend draft**; §8 records which gaps the draft resolved and which
> remain open (Backend "Open questions → Wave50 gates"). Field/enum names below
> match the Backend draft verbatim.

## Backlog Coverage

| ID | Requirement output |
|---|---|
| `FE6-089` | Connector surface placement + IA per ADR 0010; connector catalog UX; masked-secret config-form UX (no raw secret shown/entered in P0); dry-run import preview action + result layout; "preview only — nothing imported" boundary banner; live all-false-guard proof line; first-class loading / empty / error / permission states; DTO gap analysis vs the Backend draft |

## Scope Guard

MVP6.9 P0 is a project-scoped **read-only connector catalog + dry-run import
preview**:

```text
select project
-> open Connectors (Build group, next to Sources)
-> view connector catalog (3 deterministic mock ConnectorKind cards)
-> open a kind -> read its masked config schema (SECRET fields masked)
-> fill mock (non-secret) config + run dry-run import PREVIEW
-> read: compatibility + summary counts + capped sample of WOULD-BE candidate items
-> read the explicit "preview only — nothing imported; a real run would route
   through the existing extraction -> candidate -> review -> publish gate" boundary
```

The UI must **never** imply that opening a connector connects to anything, that
running a preview imports/ingests/creates data, that a source/candidate/entity/
relation/extraction-job is created, or that the published graph changes. Preview
items are **would-be** candidate-layer items, not created rows. There is **no**
connect / import / sync / apply / execute / confirm-and-ingest affordance
anywhere in this surface. No real network call is made and no credential is used
— connectors are deterministic mocks over fixture data.

Out of scope for Wave49 and MVP6.9 P0 UI (mirror the PM exclusions): external
write-back; live / scheduled / background / always-on sync; confirm-and-apply
real import; real network calls / real credential execution / external
connection; credential storage / encryption / vault / rotation; connector
**instance** persistence; setup wizard write; sync job monitor; autonomous /
auto-confirmed ingestion; **plugin code execution** and the entire Plugin*
family; real Database / S3-MinIO / Web-Crawler / Notion-Confluence-SharePoint /
Git connectors; direct candidate or published-graph mutation; source creation or
extraction-job trigger from preview; multi-tenant / cross-project connector
runtime; real LLM execution; any new connector kind beyond the frozen 3.

## 1. Placement / Information Architecture (per ADR 0010)

### 1.1 Decision: Build-group LNB destination `Connectors` (project-scoped)

Per ADR 0010 (LNB two-zone project-context IA) and D1, the connector surface is
added as **one stable project-zone LNB item in the `BUILD` group**, placed
**immediately after `Sources`**, not as a contextual panel and not as an
ID-bound global route.

```text
PROJECT  (rendered only when a project is selected)
├─ BUILD
│  ├─ Ontology       → /projects/:p/ontology
│  ├─ Sources        → /projects/:p/sources
│  ├─ Connectors     → /projects/:p/connectors        (NEW, right after Sources)
│  ├─ Extraction     → /projects/:p/extraction-jobs
│  └─ Candidates     → /projects/:p/extraction-jobs
├─ REVIEW    …
├─ PUBLISH   …
└─ ANALYZE   …
```

**Justification (Build/Sources adjacency over an Analyze destination):**

1. **It is an ingestion-funnel entry, upstream of extraction.** A connector's
   dry-run preview answers "what would land in the candidate layer if I brought
   this source in?" Its would-be output (`ConnectorPreviewTargetLayer.CANDIDATE`
   items mapped to `mapped_ontology_class_ref`) feeds the exact Build funnel
   `Ontology → Sources → (Connectors preview) → Extraction → Candidates`. Its
   natural neighbor is `Sources`, which already lives in `BUILD` per ADR 0010.
2. **The PM order names the "Analyze/Sources area"** and leaves the decision to
   FE. Because the P0 preview is source-shaped (it previews a would-be source
   ingestion), the `Sources`-adjacent Build slot is the more honest placement:
   users reach connectors while they are thinking about *where project data
   comes from*, not while analyzing published results.
3. **ADR 0010 §Decision forbids ID-bound detail pages in the LNB.** A per-kind
   config/preview view is parameterized by `connector_kind`; it therefore stays
   a **contextual sub-view** reached from the catalog (see §1.2), never a new LNB
   item. A single `Connectors` LNB item satisfies this cleanly.
4. Discoverability: a first-class Build item makes the catalog a scannable
   destination while keeping the safety story ("preview only") close to the
   Sources mental model, so users do not confuse it with the Analyze
   read/insight surfaces (Search / RAG / Benchmark) that operate on *existing*
   project data.

**Considered and rejected — Analyze group.** Analyze currently holds post-hoc
read/insight surfaces (Copilot, Search, RAG, Evaluation, Learning Insights,
Benchmark, External API) that operate on data already in the project. Connectors
is upstream ingestion, not downstream analysis; grouping it with Sources is the
better semantic fit and honors the literal "Sources area". (If PM prefers Analyze
for release consistency, the same single-item / contextual-detail rules apply —
only the group heading changes. **PM to confirm the group.**)

### 1.2 Contextual sub-navigation inside the Connectors area

Parent area route: `/projects/:p/connectors`. The area is the single LNB
destination; everything below is a **sub-view or contextual detail** reached from
the catalog cards / breadcrumbs / right-side panel, never a new LNB item and
never a global ID-bound route (ADR 0010; D1 §1.5 — LNB is the section, in-screen
views are sub-views).

Suggested contextual routes/views (reached from the catalog, project context +
return path preserved):

- `/projects/:p/connectors` — connector **catalog** (list of `ConnectorKind`
  cards). Default view.
- `/projects/:p/connectors/:connectorKind` — connector **detail**: masked config
  schema + config form + dry-run preview action + preview result. `:connectorKind`
  is a frozen enum literal (`FILE_SOURCE` / `REST_SOURCE` /
  `KNOWLEDGE_BASE_SOURCE`), not an opaque id — this is a bounded, enumerable set,
  so the route is stable and not "ID-bound" in the ADR 0010 sense; it may also be
  rendered as an in-screen panel from the catalog card without a route change.

Recommended page structure (Section + Card design language):

```text
Project context header + breadcrumb  (프로젝트명 > Connectors)
-> Preview-only boundary banner (nothing imported / no external call / no secret stored)
-> Connector catalog (cards: ConnectorKind + config-field summary + secret-field marker)
-> Connector detail (contextual): masked config schema + config form
-> Dry-run PREVIEW action ("미리보기 실행" — never "가져오기/동기화/실행")
-> Preview result: compatibility + summary rollup + capped would-be candidate sample
   + truncation notice + routing note + live all-false-guard proof line
```

### 1.3 Breadcrumb + copy policy (D3, D4)

- LNB label (English noun, D3 intentional-EN nav convention): **`Connectors`**.
- Page H1 (Korean primary, D3): recommend **`커넥터`**. If PM prefers the English
  product term as H1, `Connectors` is acceptable — pick one and use it
  consistently (no ko/en title-subtitle mismatch on the same screen). **PM to
  confirm the H1 wording** (§8 G12).
- Breadcrumb (D4 `프로젝트명 > 섹션 > 항목`):
  - `/projects/:p/connectors` → `프로젝트명 > Connectors`
  - `/projects/:p/connectors/:connectorKind` →
    `프로젝트명 > Connectors > <커넥터 이름>` (kind gloss, §4).
- No-project-selected behavior (D1): the `Connectors` item lives in the project
  zone, so it is not rendered until a project is selected; no auto-redirect.
- Active-state derivation (D1, extend the same rule): active when the path
  contains `/connectors`.

## 2. UX Surfaces

### 2.1 Preview-only boundary banner (always visible) — the safety spine

A persistent, non-dismissible info banner at the top of the Connectors area. This
is the load-bearing "read-only catalog + preview only; nothing is connected,
imported, or written" statement the PM order and QA require to be crystal clear.

Required copy (Korean primary, tokens stay English per D3):

- Headline: `커넥터는 미리보기 전용입니다. 아무것도 가져오거나 저장하지 않습니다.`
  ("Connectors are preview-only. Nothing is imported or stored.")
- Supporting line:
  `카탈로그 조회와 dry-run 미리보기만 제공합니다. 외부 시스템에 연결하거나 네트워크를 호출하지 않고, 비밀값을 저장하지 않으며, 후보/게시 그래프를 만들거나 변경하지 않습니다. 실제 가져오기는 이후 기존의 추출 → 후보 → 검토 → 게시 게이트를 거칩니다.`
  ("Only catalog browsing and dry-run preview. No external connection or network
  call, no secret stored, no candidate/published graph created or changed. A
  real import would later route through the existing extraction → candidate →
  review → publish gate.")
- Boundary chips (small, `info`/`neutral` tone), each an intentional-English
  token with a Korean gloss:
  `PREVIEW_ONLY · 미리보기 전용`, `NO_EXTERNAL_CALL · 외부 호출 없음`,
  `NO_SECRET_STORED · 비밀값 저장 없음`, `NOTHING_IMPORTED · 가져오기 없음`.

**The all-false "nothing imported" proof line (required).** The banner (or an
adjacent collapsible block) renders the response `ConnectorMutationGuard` as a
live read-only proof block, present on every Connectors screen. It lists all 9
frozen guard flags and shows each as `false`:

```text
external_system_read: false          external_system_write: false
real_network_call_made: false        credential_persisted: false
connector_instance_persisted: false  source_created: false
candidate_graph_mutated: false       published_graph_mutated: false
extraction_job_started: false
```

The UI reads these flags **from the API response** (it does not hardcode them);
if any flag is ever `true`, the UI must switch to an error/guard-violation state
and disable the preview action (this can never happen in P0, but the guard is
displayed as live evidence, not decorative copy). On the preview result, also
render the response `raw_secret_present: false` and `preview_only: true` next to
the guard as the no-secret / preview-only proof.

### 2.2 Connector catalog (list of `ConnectorKind` cards)

Purpose: answer "what can I preview importing from?" The catalog is the default
Connectors view: exactly **3 deterministic mock kinds** (frozen cap — no add
affordance, no "register new connector" button in P0).

Each **connector card** shows:

- **Kind** — `ConnectorKind` rendered as a badge/chip with icon + Korean gloss
  (§4): `FILE_SOURCE` / `REST_SOURCE` / `KNOWLEDGE_BASE_SOURCE`.
- Short description of what the mock source represents.
- A compact **config-field summary** (field count; which fields are required;
  and a clear **"secret field present"** marker when the schema has any `SECRET`
  field / `secret:true`).
- Primary action: **"설정 및 미리보기"** ("Configure & preview") → opens the
  connector detail (§2.3). The card carries **no** connect / import / sync
  affordance.

Product treatment (design language): a card grid, not a raw enum table. The
`DETERMINISTIC_MOCK` / preview-only nature is reasserted on the catalog (a small
marker) so users never read the catalog as "live integrations".

### 2.3 Connector detail — masked config schema + config form (masked-secret UX)

Contextual detail at `/projects/:p/connectors/:connectorKind` (or an in-screen
panel), preserving project context and a return path to the catalog. It renders
the config schema returned by the config-schema endpoint and a form built from
`ConnectorConfigField[]`.

Each field descriptor drives one form control: `name`, `label`, `field_kind`
(`ConnectorConfigFieldKind`), `required`, `secret`, `placeholder` (non-secret),
`help_text`.

Control mapping per `ConnectorConfigFieldKind`:

| `field_kind` | Control | Notes |
|---|---|---|
| `STRING` | text input | `placeholder` shown (non-secret example) |
| `URL` | url input | validate URL shape client-side; example `https://example.invalid/api` |
| `ENUM` | select | options from the descriptor's `enum_values[]` (added by Backend draft; §8 G2 resolved) |
| `INTEGER` | number input | |
| `BOOLEAN` | toggle/checkbox | |
| `SECRET` | **masked** input, `type=password`, non-editable placeholder story below | see masked-secret rule |

**Masked-secret rule (mirror MVP5; the non-negotiable):**

- A `SECRET` field (or any field with `secret:true`) renders **masked**: the
  input is `type=password`, its value is never echoed back into the DOM as
  plaintext, never logged, and never shown in a preview/response readout.
- In **P0 no raw secret is required or entered.** Because the preview is computed
  from fixture data keyed by `connector_kind` + non-secret config and is
  **independent of any secret value** (PM brief §2/§4), the secret field is
  presented as a **masked placeholder demonstrating the future config shape**,
  not a required credential. The form must be submittable (preview runnable)
  **without** entering any secret. Recommended treatment: render the SECRET field
  disabled/read-only with the non-secret placeholder
  (`SECRET_PLACEHOLDER_NOT_A_REAL_SECRET`) and an explanatory
  `help_text` ("P0 미리보기는 비밀값 없이 동작합니다 — 실제 자격증명은 저장/전송되지 않습니다").
- The UI must **never** display, request-echo, persist to local storage, or
  include in any copy/export a raw secret. All example values shown are
  **non-secret placeholders** only.
- **§8 G3:** confirm whether the `import-preview` request body carries the SECRET
  fields at all in P0 (expected: omitted or masked-placeholder only). FE must not
  send a real secret regardless.

Config-form actions: a single **"미리보기 실행"** (Run dry-run preview) button.
No "저장", "연결", "가져오기", "동기화" button. Client-side validation blocks the
preview only for malformed required non-secret fields (e.g. bad URL); a
config the Backend judges invalid comes back as `status = BLOCKED` /
`compatibility = INCOMPATIBLE` and is rendered as a result state (§2.5), not a
crash.

### 2.4 Dry-run preview action + result layout

On **"미리보기 실행"**, the UI calls
`POST /api/v1/projects/{project_id}/connectors/{connector_kind}/import-preview`
with the mock (non-secret) config and renders the returned preview. **Nothing is
imported; the action is a read-only computation.**

Preview result layout (Section + Card), top to bottom:

1. **Result header** — `ConnectorPreviewStatus` badge (`READY` / `BLOCKED`) +
   `ConnectorPreviewCompatibility` badge (`COMPATIBLE` / `WARNING` /
   `INCOMPATIBLE`) as D6 badges (§4); `connector_kind`;
   `preview_only: true` and `raw_secret_present: false` proof markers. (No
   freshness timestamp in the current draft — §8 G7; the preview is deterministic
   and ephemeral, so a stale marker is optional pending an added `generated_at`.)
2. **Summary rollup card** — exact counts (never estimated):
   `source_record_count`, `would_be_candidate_entity_count`,
   `would_be_candidate_relation_count`, `unmapped_record_count`, `warning_count`.
   Label them as **"would-be"** (예상/가정) counts, not "imported" counts.
3. **Would-be candidate sample** — capped list (`sample_items[]`) of preview
   items, each rendered as a row/card:
   - `preview_ref` — shown as an **opaque preview reference**, explicitly **not**
     a created candidate id (copy: "미리보기 참조 — 생성된 후보 ID 아님").
   - `target_layer` — `ConnectorPreviewTargetLayer.CANDIDATE` as a badge
     (`후보 레이어`), asserting the item maps to the candidate layer only,
     **never** published.
   - `mapped_ontology_class_ref` — the would-be ontology class as an
     `OntologyElementRef` chip with a contextual link to the ontology element.
     **Nullable** in the Backend draft: an unmapped item renders an explicit
     "미매핑" (unmapped) state, not a blank chip.
   - per-item `compatibility` (`ConnectorPreviewCompatibility`) — the Backend
     draft carries compatibility **per item** as well as on the rollup; render it
     as a small D6 badge on the row so a `WARNING`/`INCOMPATIBLE` item is
     visible within an otherwise-`COMPATIBLE` sample.
   - `label`, `source_locator` (mock locator — a would-be evidence pointer reusing
     source_segment locator semantics, not a created segment), `note`.
4. **Truncation notice** — when `truncated: true`, show
   `item_cap` and `total_item_count` (exact even when truncated): "capped X of Y"
   (`상위 X개 표시 · 전체 Y개`). Counts (§2) stay exact; only the item list is
   capped. Use the D6 `WARNING`-tone treatment for the truncation notice.
5. **Warnings** — `warnings[]` list when `compatibility = WARNING` (e.g. unmapped
   fields, missing evidence locator, locator-only source segment), each as a
   `WARNING` badge + message.
6. **Blocked reasons** — `blocked_reasons[]` when `status = BLOCKED` /
   `compatibility = INCOMPATIBLE` (§2.5).
7. **Routing note** — render `routing_note` verbatim as a persistent line under
   the result: *"preview only — nothing imported; a real run would route through
   the existing extraction → candidate → review → publish gate."* Korean primary:
   `미리보기 전용입니다 — 아무것도 가져오지 않았습니다. 실제 실행은 기존 추출 → 후보 → 검토 → 게시 게이트를 거칩니다.`
8. **Live all-false guard proof line** (§2.1) attached to the result.

The preview result carries **no** "confirm import" / "apply" / "ingest" / "create
candidates" call-to-action. The only forward action offered is contextual reading
(open the mapped ontology element, re-run preview with edited config).

### 2.5 INCOMPATIBLE / BLOCKED preview state

When `status = BLOCKED` or `compatibility = INCOMPATIBLE`:

- Render a clear non-error, non-crash result state: the config could not produce
  ingestible candidate-layer items (invalid config, or the mock source shape maps
  to no candidate-layer item).
- List `blocked_reasons[]` (§8 G6 — confirm shape: code + message) with a
  `danger`-tone `INCOMPATIBLE` / `BLOCKED` badge.
- Show **zero fabricated items** — no sample rows, `would_be_*` counts as
  returned (likely 0). Never invent a would-be item to fill the layout.
- Offer "edit config and re-run" as the recovery path. Still render the routing
  note + all-false guard proof (BLOCKED still mutated nothing).

`WARNING` is not blocking: the preview still returns items; render both the
`WARNING` compatibility badge and `warnings[]`, and show the (partial) sample.

## 3. State Requirements (first-class)

Per AGENTS.md Frontend Rules ("모든 화면은 loading, empty, error 상태를 가진다"),
every Connectors surface has loading / empty / error / permission states, plus
the preview-specific compatibility and guard states.

| State | Required behavior |
|---|---|
| Loading — catalog | Skeleton cards for the catalog. The boundary banner renders immediately (static safety copy), independent of data load. |
| Loading — config schema | Skeleton for the config form while the config-schema endpoint resolves. |
| Loading — preview | Disable the "미리보기 실행" button and show an in-progress indicator while the preview computes. Do not show stale/previous counts as if current. |
| Empty — catalog | Effectively never empty (3 frozen kinds). If the catalog returns empty, show a neutral "등록된 커넥터 없음" state; never fabricate kinds. |
| Empty — preview sample | `status = READY` with `total_item_count = 0`: show "이 설정으로 후보 레이어에 매핑되는 레코드가 없습니다" — do NOT imply an import happened or was "cleared". |
| Unmapped item | A `sample_items[]` row with `mapped_ontology_class_ref = null`: render an explicit "미매핑" (unmapped) state on the row, never a blank chip (§2.4). |
| Error | Preserve project context, show a retry affordance. Distinguish (when the API allows) a transport/server failure from a valid `BLOCKED`/`INCOMPATIBLE` **result** (the latter is a normal 200 result state, §2.5, not an error). Never fabricate a would-be item to fill an error. |
| Permission-limited | Any project member who can read the project may list the catalog, read a config schema, and run a dry-run preview (PM authz: read-only, mutates/grants nothing → no elevated role). So in P0 the preview action is **not** hidden for a project reader. On `403 PERMISSION_DENIED` (non-member) → standard permission-denied surface. `404 PROJECT_NOT_FOUND` / `404 CONNECTOR_KIND_NOT_FOUND` → standard not-found surfaces. **Downstream reminder:** later real ingestion (P1) would require an ingest-capable role (e.g. `SOURCE_MANAGER`); the UI must state that previewing grants no ingest rights. |
| INCOMPATIBLE / BLOCKED | See §2.5 — a first-class non-crash result state with `blocked_reasons[]`, zero fabricated items, and an edit-and-re-run recovery path. |
| WARNING | Non-blocking result state: render items + `warnings[]` + `WARNING` badge (§2.4). |
| Truncated | `truncated: true` → capped-list notice with `item_cap` / `total_item_count`; exact counts preserved (§2.4). |
| Guard-violation (defensive) | If any `ConnectorMutationGuard` flag is ever `true`, or `raw_secret_present` is `true`, or `preview_only` is not `true` in a response (impossible in P0), switch to an error/guard-violation state and disable the preview action. The guard is live evidence, not decorative copy. |

## 4. Design Language Application (Section + Card, KO titles, D6 badges)

- **Section + Card** layout throughout: the Connectors area is a Section header +
  preview-only boundary banner + catalog card grid + contextual connector detail
  (config form) + preview result cards. Tables only inside the preview sample
  drilldown, never as the primary catalog.
- **Korean titles** (D3): page H1 Korean (`커넥터`, PM to confirm); all prose
  (banner, empty/error/loading, buttons, section headers, help text) Korean;
  system enum tokens stay English with a Korean secondary label (D3
  intentional-English scope). LNB label stays the English noun `Connectors`.
- **D6 status-token badges** — every status token renders as
  `[icon] TOKEN · 한국어보조라벨` in one `HanaBadge` (tone + icon + English token
  + Korean gloss; never color alone). Tokens not already in the D6 §6.3 table are
  new; extend the table with the same rule (documented here as the frozen FE
  choice; glosses are FE proposals, **PM to confirm** — §8 G12):

  | Token | Enum | Tone | Icon (lucide) | Korean secondary label |
  |---|---|---|---|---|
  | `READY` | `ConnectorPreviewStatus` | success | `CheckCircle2` | 준비됨 |
  | `BLOCKED` | `ConnectorPreviewStatus` | danger | `Ban` | 차단됨 |
  | `COMPATIBLE` | `ConnectorPreviewCompatibility` | success | `CheckCircle2` | 호환됨 |
  | `WARNING` | `ConnectorPreviewCompatibility` | warning | `AlertTriangle` | 경고 (D6 §6.3 existing) |
  | `INCOMPATIBLE` | `ConnectorPreviewCompatibility` | danger | `XCircle` | 비호환 |
  | `CANDIDATE` | `ConnectorPreviewTargetLayer` | info | `Layers` | 후보 레이어 |

  `ConnectorKind` renders as a chip with icon + Korean gloss:

  | `ConnectorKind` | Korean gloss | Suggested icon (lucide) |
  |---|---|---|
  | `FILE_SOURCE` | 파일 소스 | `FileText` |
  | `REST_SOURCE` | REST API 소스 | `PlugZap` |
  | `KNOWLEDGE_BASE_SOURCE` | 지식베이스 소스 | `BookOpen` |

  Boundary chips (§2.1) use `info`/`neutral` tone: `PREVIEW_ONLY · 미리보기 전용`,
  `NO_EXTERNAL_CALL · 외부 호출 없음`, `NO_SECRET_STORED · 비밀값 저장 없음`,
  `NOTHING_IMPORTED · 가져오기 없음`. `PREVIEW_ONLY` may reuse the `warning`
  "preview-only" tone per D6 §6.2.

## 5. Frontend Acceptance Notes

- The Connectors area feels like a guided Build-funnel surface: boundary banner →
  catalog → configure → dry-run preview → read would-be candidate mapping.
- The preview-only / nothing-imported / no-external-call / no-secret-stored
  boundary is visible at all times (persistent banner + live all-false guard
  proof line + `raw_secret_present:false` + `preview_only:true`), and reasserted
  on every preview result via `routing_note`.
- No connect / import / sync / apply / execute / confirm-and-ingest affordance
  exists anywhere; the only actionable button is "미리보기 실행" (dry-run preview).
- SECRET fields are masked everywhere and never required in P0; the preview runs
  without any secret; no raw secret is displayed, echoed, persisted, or exported.
- Preview items are labelled **would-be** candidate-layer items; `preview_ref` is
  shown as an opaque reference, never a created candidate id; `target_layer` is
  always `CANDIDATE`, never published.
- Counts are exact even when the item list is `truncated`; `BLOCKED` /
  `INCOMPATIBLE` fabricates zero items.
- hana components only via `src/shared/ui/hana` adapter. Additive only; no
  MVP1–MVP6.8 route/enum/smoke break; no rename of reused shapes.

## 6. API / Field Requirements (blocking vs optional)

Naming convention (matching MVP6.x + the PM brief): DTO/schema names PascalCase,
JSON fields snake_case, enum literals UPPER_SNAKE_CASE. `Blocking` = needed for
P0 UX correctness + QA acceptance. `Optional` = usability, deferrable.

### 6.1 Common blocking fields

- `project_id`, `connector_kind`
- `ConnectorMutationGuard` on **every** response (catalog, config-schema,
  preview) with all 9 frozen flags present and `false`.
- On the preview: `preview_only: true`, `raw_secret_present: false`,
  `routing_note`.

### 6.2 Connector catalog item (blocking)

- `connector_kind` (`ConnectorKind`)
- display name + description
- a config-field summary or the field list sufficient to render the
  "secret field present" marker + required-field count.

### 6.3 Config schema — `ConnectorConfigField[]` (blocking)

- per field: `name`, `label`, `field_kind` (`ConnectorConfigFieldKind`),
  `required`, `secret`, `placeholder` (non-secret), `help_text`, `enum_values`
  (Backend draft added `enum_values[]` for the `ENUM` select — §8 G2 resolved).
- `ConnectorConfigSchemaResponse` returns ordered `fields[]` + `raw_secret_present:false`.

### 6.4 Dry-run import preview (blocking)

- `status` (`ConnectorPreviewStatus`), `compatibility`
  (`ConnectorPreviewCompatibility`), `generated_at`.
- `summary`: `source_record_count`, `would_be_candidate_entity_count`,
  `would_be_candidate_relation_count`, `unmapped_record_count`, `warning_count`.
- `sample_items[]` (`ConnectorPreviewItem`): `preview_ref` (opaque, not a
  candidate id), `target_layer` (`CANDIDATE`), `mapped_ontology_class_ref`
  (`OntologyElementRef` **or null**), per-item `compatibility`, `label`,
  `source_locator`, `note`.
- `item_cap`, `truncated`, `total_item_count` (exact even when truncated).
- `warnings[]`, `blocked_reasons[]`.
- `preview_id` (nullable — persist-vs-compute open, §8 G1), `preview_only:true`,
  `target_layer`, `raw_secret_present:false`, `routing_note`, `mutation_guard`.
- **Request** `ConnectorImportPreviewRequest`: `config` map (field name → value;
  **non-secret placeholders only**) + optional `item_cap` (≤50). FE may expose an
  item-cap control (default server max 50) but must never send a real secret.

### 6.5 Endpoints (from PM brief — Backend to finalize)

```text
GET  /api/v1/projects/{project_id}/connectors
GET  /api/v1/projects/{project_id}/connectors/{connector_kind}/config-schema
POST /api/v1/projects/{project_id}/connectors/{connector_kind}/import-preview
```

Authz / error mapping: `403 PERMISSION_DENIED` (non-member),
`404 PROJECT_NOT_FOUND`, `404 CONNECTOR_KIND_NOT_FOUND`, and (preview only) a
malformed request body → `400 INVALID_CONNECTOR_CONFIG`. Note: an *invalid but
well-formed* config is a **200 result** with `status = BLOCKED` /
`compatibility = INCOMPATIBLE` (a result state, §2.5), NOT a 400 — FE must
distinguish the two (§8 G9).

## 7. Enum Inventory (exact frozen names)

New connector-scoped enums (from the PM freeze):

- `ConnectorKind`: `FILE_SOURCE`, `REST_SOURCE`, `KNOWLEDGE_BASE_SOURCE`.
- `ConnectorConfigFieldKind`: `STRING`, `URL`, `ENUM`, `INTEGER`, `BOOLEAN`,
  `SECRET`.
- `ConnectorPreviewStatus`: `READY`, `BLOCKED`.
- `ConnectorPreviewCompatibility`: `COMPATIBLE`, `WARNING`, `INCOMPATIBLE`.
- `ConnectorPreviewTargetLayer`: `CANDIDATE` (single literal).
- `ConnectorMutationGuard` (9 flags, all always false): `external_system_read`,
  `external_system_write`, `real_network_call_made`, `credential_persisted`,
  `connector_instance_persisted`, `source_created`, `candidate_graph_mutated`,
  `published_graph_mutated`, `extraction_job_started`.

Reused by reference (no rename): MVP5 masked-secret credential safety +
import-dry-run `compatibility_status`/`summary`/nothing-applied pattern; MVP6.4
`GoldSetImportCompatibility`; MVP2 candidate shapes (`CandidateEntity` /
`CandidateRelation` / `source_segment` / `SourceParseResponse` / extraction-job)
as the **would-be** target only; MVP1 `OntologyElementRef` + ontology version
context for `mapped_ontology_class_ref`; MVP5 `Role`.

## 8. DTO / Field Gap Analysis vs the Backend Draft

Reconciled against `docs/api/MVP6_9_CONNECTORS_API_CONTRACT_DRAFT.md` +
`docs/api/openapi-mvp6-9-draft.json` (landed this wave). Most of the FE gaps are
**RESOLVED** by the draft; two remain **OPEN** (Backend "Open questions → Wave50
gates"), and two are **PM copy/display decisions**, not Backend fields.

| # | Gap | FE need | Status vs Backend draft |
|---|---|---|---|
| G1 | **Persist-vs-compute for `preview_id`** | Deep-link/refresh a preview vs keep it in view state. | **OPEN** (Backend open question 1). `preview_id` is nullable; no preview GET-by-id/list in the draft. FE must treat preview as ephemeral view state in P0; if Backend later persists, add a deep-link. |
| G2 | **`ENUM` field options** | The `ENUM` control needs an allowed-values list. | **RESOLVED.** `ConnectorConfigField` now has `enum_values`. FE renders the select from it. |
| G3 | **SECRET field in the preview request** | FE must not send a real secret. | **RESOLVED.** `ConnectorImportPreviewRequest.config` is "non-secret placeholders only"; preview is secret-independent. FE sends masked-placeholder/omit only; never a real secret. |
| G4 | **`mapped_ontology_class_ref` shape** | Render an ref chip with a contextual ontology link. | **RESOLVED** with a caveat: it reuses `OntologyElementRef` but is **nullable** — FE must render an explicit "미매핑/unmapped" state for null (§2.4). |
| G5 | **`source_locator` shape** | Render the would-be evidence pointer per item. | **PARTIAL.** Draft says it reuses source_segment locator semantics (mock), but the exact locator fields depend on the per-kind fixture shape (Backend open question 2). FE renders a generic locator readout; finalize display when the fixture shape lands in Wave50. |
| G6 | **`warnings[]` / `blocked_reasons[]` item shape** | Badge + message; ideally a stable code for i18n. | **NEEDS CONFIRM.** Draft lists the arrays but not the element shape (string vs `{code,message}`). FE prefers a `code` for D6/i18n; render defensively as message-with-optional-code. |
| G7 | **Preview freshness timestamp** | A stale marker on the preview result (§2.4/§3). | **GAP (missing field).** The draft's `ConnectorImportPreviewResponse` has **no `generated_at`/timestamp**. Because the preview is deterministic and ephemeral this is low-impact, but FE cannot show a freshness/stale marker without it. Non-blocking; drop the stale marker or Backend adds an optional `generated_at` in Wave50. |
| G8 | **Guard flag list stability** | Proof line renders exactly 9 flag names. | **RESOLVED.** `ConnectorMutationGuard` = exactly 9 flags, all `const:false`, all `required`. |
| G9 | **Invalid-config transport contract** | 200 result vs 4xx error. | **RESOLVED.** Well-formed-but-invalid/incompatible config → 200 `status:BLOCKED`/`INCOMPATIBLE` (result state, §2.5); a malformed body → `400 INVALID_CONNECTOR_CONFIG` (error state). FE distinguishes the two. |
| G10 | **Catalog config-field exposure** | Card's "secret field present" + field-count summary without a per-card schema call. | **RESOLVED.** `ConnectorCatalogItem` carries `has_secret_fields`, `config_field_count`, `mock:true`, exact `total_count`. FE renders the catalog summary from the list response alone. |
| G11 | **Counts vs items consistency under truncation** | Counts exact, list capped. | **RESOLVED.** Draft rule: counts + `total_item_count` always exact; only `sample_items[]` capped by `item_cap` (P0=50) with `truncated`. |
| G12 | **Korean gloss + H1 wording + LNB group** | KO secondary labels; H1 `커넥터` vs `Connectors`; Build vs Analyze group. | **PM DECISION** (not a Backend field). FE proposals in §1.1/§1.3/§4. |

Remaining open items for Wave50: **G1** (persist-vs-compute), **G5** (per-kind
fixture/locator shape), **G6** (warnings/blocked_reasons element shape), and
**G7** (optional freshness field). None block the *planning* deliverable or the
P0 UX; G1/G5/G6/G7 are Backend Wave50-gate closures and G12 is a PM copy/IA
confirm.

## 9. Non-negotiable Boundary Restated (FE view)

- The Connectors surface is **read-only catalog + dry-run preview only.** It
  **connects to nothing, imports nothing, writes nothing.** No connect / import /
  sync / apply / execute / confirm-and-ingest affordance exists anywhere.
- **No real network call, no credential used.** Deterministic mock connectors
  over fixture data; the preview is computed from `connector_kind` + non-secret
  config, **independent of any secret value**.
- **Masked secrets only.** No raw secret is shown, entered (not required in P0),
  echoed, persisted, logged, or exported; `raw_secret_present: false`; all
  example values are non-secret placeholders.
- **Preview items are would-be candidate-layer items**, never created rows;
  `target_layer` is always `CANDIDATE`, never published; `preview_ref` is opaque,
  never a candidate id. A real ingestion later routes through the existing
  extraction → candidate → review → publish gate (`routing_note`).
- Every response carries an **all-false** `ConnectorMutationGuard` (9 flags),
  rendered as a live proof line — read from the response, not hardcoded as
  decoration. Any `true` flag (impossible in P0) forces a guard-violation state.
- Additive only; no MVP1–MVP6.8 break; no rename of reused shapes; boundary per
  ADR 0016.
```
