# MVP6.12 Advanced Visualization Frontend UX/API Requirements

Status: `WAVE55 CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-13
Owner: Frontend / UIUX Architecture
Backlog ID: `FE6-104`

This document defines the frontend requirements for the MVP6.12 **Advanced
Visualization** P0 (a single read-only, whole-graph **viz data + summary-stats**
surface over a project's **PUBLISHED** graph; bounded node/edge elements with
client-side layout **hints**; deterministic **too-large → summary-only** fallback;
no graph mutation, no publish, no version/snapshot creation, no candidate viz, no
server-side layout, no layout persistence/cache; all-false mutation guard on every
response). It is **requirements only**: no runtime route, component, type, API
client, mock fixture, or smoke code is produced in this wave. Runtime waits for
Wave56.

## Source Documents

- `AGENTS.md` (Frontend Rules)
- `.agents/skills/handoff-reporting/SKILL.md`
- `docs/handoffs/CURRENT_STATE.md`
- `docs/handoffs/wave-055/NEXT_ORDERS.md` (Frontend Agent Order + Non-negotiable boundary)
- `docs/handoffs/wave-055/PM_REPORT.md`
- `docs/pm/MVP6_12_ADVANCED_VIZ_BRIEF.md`
- `docs/adr/0019-mvp6-12-advanced-viz-read-only-bounded-published-graph-summary-too-large-summary-only-no-mutation-no-layout-persist-boundary.md`
- `docs/pm/UIUX_REMEDIATION_DECISIONS.md` (D1 LNB IA, D3 copy policy, D6 badges)
- `docs/adr/0010-lnb-project-context-information-architecture.md`
- `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md`
- Existing surface this theme enhances: the Publish-group **Published Graph** area
  (`apps/frontend/src/pages/PublishedGraphExplorerPage.tsx`, route
  `/projects/:p/published-graph`, LNB section `published-graph`) + the MVP4
  graph-explore shapes (`GraphExploreNode` / `GraphExploreEdge` /
  `GraphTooLargeState` / `PublishedGraphVersionRef` / `GraphExploreState` in
  `apps/frontend/src/shared/api/types.ts`) + the graph vendor bundle.
- Format + UX precedent: `docs/pm/MVP6_11_FRONTEND_UX_REQUIREMENTS.md` (the closest
  structural precedent — read-only surface + bounded/too-large + all-false guard
  proof line + `{code, message}` notice + cap/`truncated`/exact-total bounding + DTO
  gap analysis).

> **Backend draft dependency (OPEN — not yet landed).** As of this writing
> `docs/api/MVP6_12_ADVANCED_VIZ_API_CONTRACT_DRAFT.md` and
> `docs/api/openapi-mvp6-12-draft.json` are **not present** (Backend `BE6-086`~
> `BE6-087` runs in parallel this wave). This document is therefore grounded on the
> **frozen PM brief** (`docs/pm/MVP6_12_ADVANCED_VIZ_BRIEF.md`) + ADR 0019, and §8
> is a forward **field/state need + gap list** the Backend draft must
> confirm/finalize — NOT a reconciliation against a landed draft. Field/enum names
> below are the PM-frozen names, used verbatim; where the brief marks a field as
> "Backend finalizes" it is flagged in §8. **Blocking dependency:** §8 gaps must be
> closed against the Backend draft before Wave56 implementation.

## Backlog Coverage

| ID | Requirement output |
|---|---|
| `FE6-104` | Advanced-viz surface placement as a contextual sub-view of the existing Publish-group **Published Graph** surface per ADR 0010 (NO new global LNB item); graph-level **summary-stats** panel (`node_counts_by_class` / `edge_counts_by_relation` / `density` / `component_count` / `largest_component_size` / `isolated_node_count` / `max_degree`); a **bounded whole-graph view** rendered client-side from layout **hints** (`degree` / `component_id` / `class_id` group; NO server x/y); read-only class/relation filters + focus/neighborhood (reusing the existing MVP4 explore endpoint); `GraphVizStatus` (`READY` / `TOO_LARGE_SUMMARY_ONLY` / `EMPTY`) as D6 badges; first-class loading / empty / error / permission states; `TOO_LARGE_SUMMARY_ONLY` state (summary + "too large to render fully" notice, no fabricated nodes); truncation notice (150/300 + exact totals); "read-only visualization — nothing changes the graph" boundary copy + live all-false 6-flag `GraphVizMutationGuard` proof line; DTO gap analysis vs the Backend draft |

## Scope Guard

MVP6.12 P0 is a **read-only whole-graph viz data + summary-stats** enhancement of
the existing Published Graph surface:

```text
select project
-> open Published Graph (Publish group)
-> open the Visualization / Summary sub-view (contextual tab/segment on the same surface)
-> read graph-level summary stats (node counts by class, edge counts by relation,
   density, component count, largest-component size, isolated-node count, max degree)
-> when within budget (READY): see the whole-graph bounded node/edge view laid out
   CLIENT-SIDE from layout hints (degree / component_id / class group); apply
   read-only class/relation filters; focus a node's neighborhood (reuses the MVP4
   graph-explore root+hops endpoint — NOT re-implemented)
-> when over budget (TOO_LARGE_SUMMARY_ONLY): see the full summary + exact totals +
   a "too large to render fully — showing summary only; narrow with filters" notice
   (NO element list, NO fabricated nodes)
-> when no published version (EMPTY): zeroed summary + guidance to publish first
-> read the explicit "read-only visualization — nothing changes the graph" boundary
```

The UI must **never** imply that opening the viz mutates the published graph, the
candidate graph, or the draft ontology; that it creates a published version or a
graph snapshot; that any layout the client renders is saved/cached server-side; or
that it publishes anything. There is **no** save-layout / apply / publish / snapshot
/ "저장" / "게시" affordance anywhere on this surface. Rendered node positions are
**ephemeral client-side layout** computed from hints — never persisted, never sent
back. The too-large fallback shows **summary only** (no element list, no
representative/fabricated subgraph — that is a named P1 refinement).

Out of scope for Wave55 and MVP6.12 P0 UI (mirror the PM brief §9 / ADR 0019
exclusions): any graph mutation / publish / version or snapshot creation;
candidate-graph viz + candidate/published comparison layers
(`GraphVizScope=CANDIDATE`); layout persistence / layout cache / stored presets;
server-side layout computation (x/y coordinates, force-directed / hierarchical
layout, clustering); heavy analytics (centrality, community detection beyond the
connected-component count, path-finding); a bounded **representative** subgraph on
too-large (P0 is summary-only); time-lapse / temporal graph animation; Ontology
Diff Graph; Source-to-Graph Trace View; Relation Matrix View; Evidence Heatmap;
Data Quality Storyboard / Executive Summary narrative; quality-layer coloring beyond
the reused per-element `quality_summary`; real-time collaboration; external export /
embed / image render; a **new** neighborhood/focus endpoint (focus reuses the
existing MVP4 graph-explore root+hops endpoint).

## 1. Placement / Information Architecture (per ADR 0010)

### 1.1 Decision (COMMANDER RATIFIED): a contextual sub-view of the existing Publish-group `Published Graph` surface — NO new global LNB item

Per ADR 0010 (LNB two-zone project-context IA), D1, and PM brief §11 G4 (commander
recommendation "contextual sub-view of Published Graph; single active LNB
preserved"), the advanced-viz surface is added as a **contextual sub-view of the
existing `Published Graph` LNB destination** (`published-graph` section, route
`/projects/:p/published-graph`), **not** a new global LNB item and **not** a new
Analyze-group item. The single active-LNB invariant (ADR 0010 §Decision; D1 §1.6)
is preserved: the LNB gains nothing; the existing `Published Graph` item stays the
one active destination while the user is on the viz sub-view.

```text
PROJECT  (rendered only when a project is selected)
├─ BUILD     …
├─ REVIEW    …
├─ PUBLISH
│  ├─ Publish          → /projects/:p/publish
│  └─ Published Graph  → /projects/:p/published-graph   (UNCHANGED LNB item)
│        ├─ (sub-view) Explorer  — the existing root+hops MVP4 explorer
│        └─ (sub-view) Visualization / Summary  — NEW MVP6.12 whole-graph + stats
└─ ANALYZE   …
```

**Justification (contextual sub-view of Published Graph; no new LNB item):**

1. **Same mental space, same data source.** The viz surface reads the **published
   graph only** (`GraphVizScope=PUBLISHED`, single literal) — exactly the surface
   the existing `Published Graph` LNB destination already owns. ADR 0019 §Decision
   and the PM brief §1 both frame it as "the thinnest additive delta over the two
   existing graph read surfaces"; its natural home is the surface that already reads
   the published graph, not a new destination.
2. **ADR 0010 forbids proliferating LNB items for a read sub-mode.** The viz surface
   is a different *view* (whole-graph + stats) of the same published-graph data the
   explorer already shows (root-anchored neighborhood). ADR 0010 keeps one stable
   LNB item per coherent destination and pushes alternate views down to in-screen
   sub-views; the commander ratified this (brief §11 G4). No `viz_id` / detail id
   exists (compute-on-read; ADR 0019 §Persist-vs-compute), so there is nothing
   ID-bound to route to anyway.
3. **Boundary clarity.** Co-locating the whole-graph/summary viz with the existing
   Published Graph Explorer reinforces "this is all read-only over published facts"
   — the surface that already carries `PUBLISHED ONLY` / `PUBLISHED FACTS` badges
   and renders no write control. The viz sub-view inherits that read-only framing
   rather than reintroducing it on a fresh screen.
4. **Focus/neighborhood is already here.** The PM brief defers focus/neighborhood to
   the existing MVP4 explore endpoint (root+hops) — which *is* the current
   `Published Graph` Explorer sub-view. Placing the whole-graph/summary viz beside
   it makes "zoom out to the whole graph + stats" ↔ "focus a node's neighborhood" a
   single in-screen toggle, no cross-navigation.

**Considered and rejected:**

- **A new Analyze-group LNB item (e.g. `Visualization`).** Analyze holds post-hoc
  read/insight surfaces (Search / RAG / Evaluation / Copilot / Learning Insights /
  Benchmark / External API). But the viz surface is a view *of the published graph
  itself*, tightly coupled to the Published Graph destination's data + version
  pointer, not a downstream analysis over already-extracted data. A separate item
  would also split the two published-graph views across two LNB destinations and add
  an LNB item ADR 0010 §G4 explicitly recommends against. Rejected.
- **A new global/top-level item.** Violates the single-active-LNB invariant and ADR
  0010's project-zone grouping; the surface is project-scoped and
  published-graph-scoped. Rejected.

### 1.2 Contextual sub-navigation inside the Published Graph surface

Parent LNB destination stays `/projects/:p/published-graph`. The advanced-viz
surface is an **in-screen sub-view** (a segmented control / tab on the existing
Published Graph page), reached without an LNB change and without a new global route.
Two view modes on the one destination:

- **Explorer** (existing) — root-anchored neighborhood (MVP4 explore, root+hops).
  Unchanged.
- **Visualization / Summary** (NEW, MVP6.12) — the whole-graph bounded view +
  graph-level summary stats over the same published graph version.

Suggested contextual view state (no new LNB item, project context + version pointer
preserved across the toggle):

- `/projects/:p/published-graph` — default = Explorer (existing behavior preserved).
- `/projects/:p/published-graph?view=viz` (or an in-page tab with no path change) —
  the Visualization / Summary sub-view. A query-param sub-view (not a new path
  segment) keeps the LNB active-state derivation (`resolveActiveSection` →
  `published-graph`, matched on `/published-graph`) untouched. **Exact sub-view
  mechanism (query param vs in-page tab state) is an FE implementation choice for
  Wave56; either preserves the single-LNB-item + active-state rule.**

Recommended page structure (Section + Card design language) for the viz sub-view:

```text
Published Graph page header + breadcrumb  (프로젝트명 > Published Graph)
-> view toggle: [ Explorer | Visualization / Summary ]
-> READ-ONLY boundary banner (nothing changes the graph / no layout saved / no publish)
-> Graph summary-stats panel (counts by class / by relation / density / components / degree)
-> Status-driven body:
   READY               -> whole-graph bounded viz (client-side layout from hints) + filters + focus
   TOO_LARGE_SUMMARY_ONLY -> summary panel + "too large to render fully" notice + suggested filters (NO elements)
   EMPTY               -> zeroed summary + "publish a version first" guidance
-> live all-false 6-flag GraphVizMutationGuard proof line
```

### 1.3 Breadcrumb + copy policy (D3, D4)

- LNB label: **unchanged** — the existing `Published Graph` (English noun, D3).
  MVP6.12 adds **no** new LNB label.
- Page H1 (Korean primary, D3): the existing Published Graph H1 is
  `게시 그래프 탐색기`. Recommend keeping that page H1 and labeling the two sub-views
  with Korean segment labels: `탐색기` (Explorer) and `시각화 · 요약`
  (Visualization / Summary). **PM to confirm the sub-view labels** (§8 G12). Do not
  introduce a second page-level H1 for the sub-view (no ko/en title mismatch on the
  same screen).
- Breadcrumb (D4 `프로젝트명 > 섹션`): unchanged — `프로젝트명 > Published Graph`
  for both sub-views (the sub-view is not a new breadcrumb segment). If a deep-link
  query param is used, the breadcrumb stays the same; the active sub-view is shown
  by the in-screen toggle, not the breadcrumb.
- No-project-selected behavior (D1): unchanged — `Published Graph` lives in the
  project zone, not rendered until a project is selected.
- Active-state derivation (D1 §1.6): unchanged — active when the path contains
  `/published-graph`; the `?view=viz` query param does not change section
  resolution.

## 2. UX Surfaces

### 2.1 READ-ONLY boundary banner (always visible on the viz sub-view) — the safety spine

A persistent, non-dismissible info banner at the top of the Visualization / Summary
sub-view. This is the load-bearing "read-only visualization — nothing changes the
graph; nothing is published; no layout is saved" statement ADR 0019 + the PM brief +
QA require.

Required copy (Korean primary, tokens stay English per D3):

- Headline: `읽기 전용 시각화입니다. 그래프를 변경하지 않습니다.`
  ("Read-only visualization. Nothing changes the graph.")
- Supporting line:
  `게시 그래프를 읽기 전용으로 시각화하고 요약 통계를 보여줄 뿐입니다. 후보/게시/DRAFT 그래프를 변경하지 않고, 게시 버전이나 스냅샷을 만들지 않으며, 화면에 그려진 레이아웃은 클라이언트에서만 계산되어 서버에 저장·캐시되지 않습니다. 게시는 기존 MVP3 게시 경로로만 이루어집니다.`
  ("It only visualizes the published graph read-only and shows summary statistics.
  It changes no candidate/published/DRAFT graph, creates no published version or
  snapshot, and any layout drawn on screen is computed client-side only — never
  saved or cached server-side. Publishing stays the separate MVP3 publish path.")
- Boundary chips (small, `info`/`neutral` tone), each an intentional-English token
  with a Korean gloss:
  `READ_ONLY · 읽기 전용`, `NOTHING_CHANGES · 변경 없음`,
  `NO_PUBLISH · 게시 없음`, `NO_LAYOUT_SAVED · 레이아웃 저장 없음`,
  `PUBLISHED_ONLY · 게시 전용`.

Render `boundary_note` (from the response) verbatim as a persistent line under the
banner: *"read-only visualization — nothing changes the graph; publishing stays the
separate MVP3 publish path."* Korean primary:
`읽기 전용 시각화입니다 — 그래프를 변경하지 않습니다. 게시는 별도의 MVP3 게시 경로로만 이루어집니다.`

**The all-false "nothing changes" proof line (required).** The banner (or an
adjacent collapsible block) renders the response `GraphVizMutationGuard` as a live
read-only proof block, present on the viz sub-view for **every** status
(`READY` / `TOO_LARGE_SUMMARY_ONLY` / `EMPTY`). It lists all **6** frozen guard
flags and shows each as `false`:

```text
published_graph_mutated: false      candidate_graph_mutated: false
ontology_draft_mutated: false       published_version_created: false
graph_snapshot_created: false       layout_persisted: false
```

The UI reads these flags **from the API response** (it does not hardcode them);
`published_graph_mutated` and `layout_persisted` are the **headline** assertions
(brief §6 / ADR 0019). If any flag is ever `true` (impossible in P0), the UI must
switch to an error/guard-violation state and stop rendering the viz as trustworthy
(§3). The guard is displayed as live evidence, not decorative copy.

Contrast note (documented so FE + QA share the intent): unlike the MVP3 publish path
(which *does* create a `PublishedGraphVersion`), MVP6.12 turns **no** flag true on
any response; the banner copy must never resemble a publish/snapshot/save-layout
action.

### 2.2 Graph summary-stats panel (always shown; exact in every status)

Purpose: answer "what is the shape of my published graph?" The `GraphVizSummary` is
**exact and cheap in every status** (computed by a single O(V+E) pass — counts +
union-find), including `TOO_LARGE_SUMMARY_ONLY`. It is the headline value MVP6.12
adds over the two existing surfaces, so it renders **first** and **always** (even
when the element list is omitted).

Rendered from `summary` (`GraphVizSummary`), Section + Card:

- **Totals row** — `total_node_count`, `total_edge_count` as prominent stat tiles
  (`노드 N · 엣지 N`).
- **Node counts by class** — `node_counts_by_class[]` (each `{class_id, count}`),
  a compact bar/table keyed by the opaque MVP1 `class_id` (resolve to a human class
  label where the reused ontology/class label is available; otherwise show the
  `class_id`). Deterministic order as returned.
- **Edge counts by relation** — `edge_counts_by_relation[]` (each
  `{relation_id, count}`), same treatment keyed by the opaque MVP1 `relation_id`.
- **Structure stats** — `density`, `component_count`, `largest_component_size`,
  `isolated_node_count`, `max_degree`, as labeled stat tiles / a KeyValue block:
  `밀도 · density`, `컴포넌트 수 · components`, `최대 컴포넌트 크기`,
  `고립 노드 수`, `최대 차수 · max degree`.
- `density` is a ratio in `[0,1]` (directed `E / (V*(V-1))`, `0` for `V<=1`, brief
  §11 G3); render as a fixed-precision number (e.g. 3 decimals), never as a
  fabricated percentage of something else.

Every count is **exact** (never "estimated") and byte-stable modulo `generated_at`.
No stat tile is ever blank: a zero is shown as `0` (see §3 EMPTY / zeroed summary),
never omitted or faked.

### 2.3 READY — bounded whole-graph view (client-side layout from hints)

When `status = READY` (`total_node_count <= node_cap AND total_edge_count <=
edge_cap`), the sub-view renders the full bounded `nodes[]` / `edges[]` as a
whole-graph visualization, **laid out client-side** using the layout **hints** on
each node. Per ADR 0019 the response carries **NO x/y coordinates**; the FE (which
owns the graph vendor bundle) computes positions.

- **Layout hints (per `GraphVizNode`):** `degree`, `component_id`, and the node's
  `class_id` group. Recommended client-side treatment: group/cluster by
  `component_id` (and secondarily by `class_id`); size/emphasize by `degree`. These
  are **hints for a client layout**, not coordinates — the FE never expects `x`/`y`
  and never sends a computed layout back.
- **Node rendering** (reuse `GraphExploreNode` fields by reference):
  `published_entity_id`, `class_id`, `label`, `properties`, `quality_summary`,
  `source_count`, `evidence_count`, `lineage_available`, plus the `degree` /
  `component_id` hints. Color/group by `class_id`; show `degree` and `component_id`
  as node metadata; reuse the existing per-element `quality_summary` overlay (no new
  quality-layer coloring — brief §9 exclusion).
- **Edge rendering** (reuse `GraphExploreEdge` fields by reference):
  `published_relation_id`, `source_node_id`, `target_node_id`, `relation_id`,
  `label`, `properties`, `quality_summary`, `evidence_count`, `lineage_available`.
- Deterministic node/edge ordering as returned (byte-stable modulo `generated_at`);
  the client layout must be deterministic given the same input (stable seed) so the
  view does not reshuffle on re-render.
- `truncated: false` in READY (the full bounded set is present within cap). The view
  states the active caps (`node_cap` / `edge_cap`) as context, e.g. a quiet
  `상위 N개 이내` marker, so READY vs the too-large fallback is legible.
- **No save-layout / export / snapshot control.** The only actions are read-only:
  pan/zoom, hover a node/edge for its reused metadata, apply filters (§2.5), focus a
  node's neighborhood (§2.6). No "save view", "저장", "export", "publish".

### 2.4 TOO_LARGE_SUMMARY_ONLY — summary + "too large to render fully" notice (NO fabricated nodes)

When either total exceeds its cap, `status = TOO_LARGE_SUMMARY_ONLY`: `nodes[]` /
`edges[]` are **empty**, `truncated: true`, and `too_large` is populated. This
mirrors the existing MVP4 `SAFE_TOO_LARGE` behavior the Published Graph Explorer
already renders (see `PublishedGraphExplorerPage` "Safe too large" card) — reuse
that pattern.

- Render the **full summary-stats panel** (§2.2) — it is computed over the **full**
  published graph and is exact even here (the headline value in this state).
- Render a clear `TOO_LARGE_SUMMARY_ONLY` notice (D6 warning-tone badge):
  `그래프가 너무 커서 전체를 그릴 수 없습니다 — 요약 통계만 표시합니다. 필터로 범위를 좁혀 보세요.`
  ("The graph is too large to render fully — showing summary only. Narrow it with
  filters.")
- Render `too_large` (`GraphTooLargeState` shape, reused): `estimated_nodes`,
  `estimated_edges`, `node_budget`, `edge_budget`, `message`, and
  `suggested_filters[]` (each a clickable read-only filter chip that narrows the
  class/relation filter set, §2.5). Show exact totals from `summary`
  (`total_node_count` / `total_edge_count`) alongside the budgets so the user sees
  how far over budget the graph is.
- **Zero fabricated nodes/edges.** No node canvas, no partial graph, no
  representative/synthetic subgraph, no "showing a sample" — the element list is
  empty by contract and the UI must not invent one. (A bounded representative
  subgraph on too-large is a named P1 refinement — brief §9 / ADR 0019.)
- The read-only boundary banner (§2.1) + all-false guard proof line stay rendered.

### 2.5 Read-only class/relation filters

Read-only filters that narrow which classes/relations are in view. The PM brief
§11 G1 leaves it open whether the `GET /graph-viz` endpoint accepts `class_ids` /
`relation_ids` filter params in P0 (recommended: accept them, cheap + read-only) or
the FE filters client-side. Either way:

- Filter controls are derived from `node_counts_by_class[]` /
  `edge_counts_by_relation[]` (the classes/relations actually present), each with its
  count. Selecting/deselecting narrows the rendered element set (READY) or is offered
  as a suggested narrowing (from `too_large.suggested_filters`) in
  `TOO_LARGE_SUMMARY_ONLY`.
- **Filters bound the element view only; the summary is ALWAYS over the full
  published graph** (brief §11 G1 recommendation). The UI must state this — a
  filtered element view does not change the summary-stats panel numbers. Never
  present a filtered count as if it were the whole-graph total.
- Filters mutate nothing (read-only view state). No "save filter preset" (layout /
  preset persistence is out of P0).
- If Backend accepts filter params, re-fetch on filter change (server bounds the
  element set); if not, filter the already-fetched bounded set client-side. **This
  depends on G1 (§8) — FE builds behind whichever the Backend draft freezes.**

### 2.6 Focus / neighborhood (reuse the MVP4 explore endpoint — NOT re-implemented)

Focusing a node's neighborhood is served by the **existing** MVP4 graph-explore
endpoint (root + hops) — the Explorer sub-view already on this surface. MVP6.12 adds
**no** new neighborhood/focus endpoint (brief §9 / ADR 0019 exclusion).

- From a node in the READY whole-graph view, "이 노드 중심 보기" (focus this node)
  switches to the Explorer sub-view with that node as the root entity
  (`root_entity_id`) at the default hop depth — i.e. it drives the existing
  `usePublishedGraphExplore(projectId, { root_entity_id, max_hops })` path, not a new
  API. This is the single in-screen toggle described in §1.2.
- Focus is read-only navigation between two views of the same published graph
  version; it creates/persists nothing.

## 3. State Requirements (first-class)

Per AGENTS.md Frontend Rules ("모든 화면은 loading, empty, error 상태를 가진다"),
the viz sub-view has loading / empty / error / permission states, plus the
viz-specific status, too-large, and guard states. Note `GraphVizStatus` has **no
`ERROR` result state** in P0 (brief §4; unlike MVP4 `GraphExploreState` which does)
— an invalid target is a transport `400`/`403`/`404`, not a result state, so the FE
must not treat a transport error as a `GraphVizStatus`.

| State | Required behavior |
|---|---|
| Loading — viz sub-view | Skeleton for the summary-stats panel + the graph canvas area while the viz response resolves. The boundary banner (§2.1, static safety copy) renders immediately, independent of data load. |
| `READY` | Summary panel + bounded whole-graph view (client-side layout from hints) + filters + focus (§2.3). `truncated:false`; caps shown as context. |
| `TOO_LARGE_SUMMARY_ONLY` | Summary panel + "too large to render fully" notice + `too_large` (estimates / budgets / message / suggested filters) + exact totals; **empty element list, zero fabricated nodes** (§2.4). A normal 200 result state, NOT an error. |
| `EMPTY` (no published version) | The published graph has zero entities / the project has no current published version (brief §7 → `200 EMPTY`, a result state not a 4xx). Show a zeroed summary panel (all counts `0`, `density 0`) + a neutral empty state: `게시된 그래프가 아직 없습니다 — 먼저 버전을 게시하세요.` with a contextual link to the Publish surface. Never fabricate nodes/edges/counts. |
| Empty — a class/relation bucket with 0 | Within a non-empty graph, a summary bucket at 0 shows `0`, never omitted (§2.2). |
| Error (transport) | `400` (invalid `node_cap`/`edge_cap` out of `[1,150]`/`[1,300]`), `404 PROJECT_NOT_FOUND`, `404 PUBLISHED_GRAPH_VERSION_NOT_FOUND` (explicitly-requested unknown version), or a server/transport failure. Preserve project context, show a retry affordance. **Distinguish a transport error from the valid `TOO_LARGE_SUMMARY_ONLY` / `EMPTY` result states** (those are normal 200 results, §2.4/EMPTY row, not errors). Never fabricate a node/count to fill an error. For an invalid cap, guide the user back into range rather than showing a broken view. |
| Permission-limited | Any project member who can view the project (and the existing Published Graph Explorer) may read the viz surface — read-only, mutates/grants nothing, no elevated role (brief §7 / ADR 0019). So the viz sub-view is **not** hidden for a project reader. On `403 PERMISSION_DENIED` (non-member) → standard permission-denied surface. There is no apply/publish affordance to gate. |
| Truncated | `truncated:true` co-occurs with `TOO_LARGE_SUMMARY_ONLY` in P0 (element list omitted, summary exact). Show the too-large notice + exact totals vs budgets (§2.4). Summary counts stay exact regardless. |
| Guard-violation (defensive) | If any `GraphVizMutationGuard` flag is ever `true` (especially `published_graph_mutated` / `layout_persisted`), the UI switches to an error/guard-violation state and stops presenting the viz as trustworthy read-only output. The guard is live evidence (§2.1), not decoration. |

## 4. Design Language Application (Section + Card, KO titles, D6 badges)

- **Section + Card** layout throughout: the viz sub-view is the boundary banner + a
  summary-stats Section (stat tiles + by-class / by-relation cards) + a status-driven
  body (READY graph canvas / too-large notice card / EMPTY state) + the guard proof
  line. Tables only inside the by-class / by-relation drilldown, never as the primary
  surface.
- **Korean titles** (D3): reuse the existing Published Graph page H1
  (`게시 그래프 탐색기`); sub-view labels Korean (`탐색기` / `시각화 · 요약`, PM to
  confirm); all prose (banner, empty/error/loading, notices, section headers, help)
  Korean; system enum tokens stay English with a Korean secondary label (D3
  intentional-English scope). No new LNB label.
- **D6 status-token badges** — every status token renders as
  `[icon] TOKEN · 한국어보조라벨` in one `HanaBadge` / the shared `StatusBadge` (tone
  + icon + English token + Korean gloss; never color alone). Tokens not already in
  the D6 §6.3 table are new; extend the table with the same rule (documented here as
  the frozen FE choice; glosses are FE proposals, **PM to confirm** — §8 G12):

  | Token | Enum | Tone | Icon (lucide) | Korean secondary label |
  |---|---|---|---|---|
  | `READY` | `GraphVizStatus` | success | `CheckCircle2` | 준비됨 (D6 §6.3 existing) |
  | `TOO_LARGE_SUMMARY_ONLY` | `GraphVizStatus` | warning | `AlertTriangle` | 너무 큼 · 요약만 |
  | `EMPTY` | `GraphVizStatus` | neutral | `Inbox` | 데이터 없음 |
  | `PUBLISHED` | `GraphVizScope` | success | `Share2` | 게시 전용 |

  The `GraphVizStatus` tokens reuse the MVP4 status-tone mapping precedent
  (`stateTone` in `mvp4Shared.tsx`: `READY`→success, too-large→warning); note the
  MVP4 token is `SAFE_TOO_LARGE` and the viz token is `TOO_LARGE_SUMMARY_ONLY` — a
  distinct literal (no rename of the MVP4 enum). Add the viz literals to the shared
  tone/badge mapping additively.

  Boundary chips (§2.1) use `info`/`neutral` tone:
  `READ_ONLY · 읽기 전용`, `NOTHING_CHANGES · 변경 없음`, `NO_PUBLISH · 게시 없음`,
  `NO_LAYOUT_SAVED · 레이아웃 저장 없음`, `PUBLISHED_ONLY · 게시 전용`.

  The existing `Published Graph` page already renders `PUBLISHED ONLY` /
  `PUBLISHED FACTS` badges; the viz sub-view inherits/aligns with those and adds the
  `GraphVizStatus` badge in the page-actions row (mirroring how the Explorer renders
  its `StateBadge`).

## 5. Frontend Acceptance Notes

- The viz sub-view feels like a read-only lens on the published graph: boundary
  banner → exact summary stats (always) → whole-graph view (READY) or too-large
  notice (TOO_LARGE_SUMMARY_ONLY) or empty state (EMPTY) → optional read-only filters
  + focus (via the existing explorer).
- The read-only / nothing-changes / no-publish / no-layout-saved boundary is visible
  at all times (persistent banner + `boundary_note` + live all-false 6-flag guard
  proof line), on every status.
- No save-layout / apply / publish / snapshot / export / "저장" / "게시" affordance
  exists anywhere on the surface. Rendered node positions are ephemeral client-side
  layout from hints (`degree` / `component_id` / `class_id`); the response carries no
  x/y and the FE never sends a layout back.
- Summary stats are **exact in every status** (including too-large) and byte-stable
  modulo `generated_at`; the too-large fallback shows summary only and **fabricates
  zero nodes/edges**; EMPTY shows a zeroed summary, never invented data.
- Filters bound the element view only; the summary is always over the full published
  graph — the UI states this and never presents a filtered count as a whole-graph
  total.
- Focus/neighborhood reuses the existing MVP4 explore endpoint (root+hops); no new
  focus endpoint is called.
- hana components only via `src/shared/ui/hana` adapter. Additive only; no
  MVP1–MVP6.11 route/enum/smoke break; no rename of reused shapes
  (`GraphExploreNode` / `GraphExploreEdge` / `GraphTooLargeState` /
  `PublishedGraphVersionRef` / `GraphExploreState`).

## 6. API / Field Requirements (blocking vs optional)

Naming convention (matching MVP6.x + the PM brief): DTO/schema names PascalCase,
JSON fields snake_case, enum literals UPPER_SNAKE_CASE. `Blocking` = needed for P0
UX correctness + QA acceptance. `Optional` = usability, deferrable.

### 6.1 Common blocking fields (`GraphVizResponse`)

- `project_id`, `scope` (`GraphVizScope=PUBLISHED`), `published_graph_version_ref`
  (reuse `PublishedGraphVersionRef`), `generated_at`.
- `status` (`GraphVizStatus`).
- `summary` (`GraphVizSummary`, §6.2) — present and exact in **every** status.
- `node_cap`, `edge_cap`, `truncated` (bool).
- `nodes[]` (`GraphVizNode`, §6.3) — present when `READY`, empty otherwise.
- `edges[]` (`GraphVizEdge`, §6.3) — present when `READY`, empty otherwise.
- `too_large` (`GraphTooLargeState` shape) — present ONLY when
  `TOO_LARGE_SUMMARY_ONLY`.
- `mutation_guard` (all-false 6-flag `GraphVizMutationGuard`) on **every** response.
- `boundary_note` (string, rendered verbatim, §2.1).

### 6.2 `GraphVizSummary` (blocking; exact in every status)

- `total_node_count`, `total_edge_count`.
- `node_counts_by_class[]` — each `{class_id, count}` (opaque MVP1 `class_id`).
- `edge_counts_by_relation[]` — each `{relation_id, count}` (opaque MVP1
  `relation_id`).
- `density`, `component_count`, `largest_component_size`, `isolated_node_count`,
  `max_degree`.

### 6.3 `GraphVizNode` / `GraphVizEdge` (blocking; reuse MVP4 element shapes by ref)

- `GraphVizNode`: reuse `GraphExploreNode` fields (`published_entity_id`, `class_id`,
  `label`, `properties`, `quality_summary`, `source_count`, `evidence_count`,
  `lineage_available`) **by reference**, plus layout **hints** `degree` +
  `component_id`. **NO `x` / `y` coordinates.** (See §8 G5 on `hop`: whole-graph viz
  is not root-anchored, so `hop` is not meaningful — Backend must confirm whether the
  reused shape's `hop` is present/nullable/omitted for viz.)
- `GraphVizEdge`: reuse `GraphExploreEdge` fields (`published_relation_id`,
  `source_node_id`, `target_node_id`, `relation_id`, `label`, `properties`,
  `quality_summary`, `evidence_count`, `lineage_available`) **by reference**.

### 6.4 Request (blocking + optional)

- **Path:** `project_id`.
- **Optional query (§8 G1/G2):** `version_id` (target a specific published version),
  `node_cap` (`[1,150]`, default 150), `edge_cap` (`[1,300]`, default 300), and —
  pending G1 — read-only filter hints `class_ids` / `relation_ids` (bounding the
  element set only; summary always over the full graph). Out-of-range caps → `400`.

### 6.5 Endpoint (from PM brief — Backend to finalize)

```text
GET /api/v1/projects/{project_id}/graph-viz   (read-only whole-graph viz data + summary; creates nothing)
```

Compute-on-read; no `viz_id`, no GET-by-id, no list (ADR 0019). Focus/neighborhood
is the **existing** MVP4 graph-explore endpoint (root+hops), NOT a new endpoint.
Authz / error mapping: `403 PERMISSION_DENIED` (non-member); `404
PROJECT_NOT_FOUND`; `404 PUBLISHED_GRAPH_VERSION_NOT_FOUND` (explicit unknown
version); no version requested + no current published version → **200 `EMPTY`** (a
result state, not a 4xx); invalid cap → `400`. FE must distinguish the `200`
result states (`EMPTY` / `TOO_LARGE_SUMMARY_ONLY`) from `4xx` transport errors
(§8 G9).

## 7. Enum Inventory (exact frozen names)

New viz-scoped enums (from the PM freeze / ADR 0019):

- `GraphVizStatus`: `READY`, `TOO_LARGE_SUMMARY_ONLY`, `EMPTY` (no `ERROR` result
  state in P0). Structural precedent = MVP4 `GraphExploreState` (not renamed).
- `GraphVizScope`: `PUBLISHED` (single literal; `CANDIDATE` reserved, never produced
  in P0).
- `GraphVizMutationGuard` (6 flags, all always false): `published_graph_mutated`,
  `candidate_graph_mutated`, `ontology_draft_mutated`, `published_version_created`,
  `graph_snapshot_created`, `layout_persisted`. Headline: `published_graph_mutated`
  + `layout_persisted`.

Reused by reference (no rename): MVP3 `PublishedEntity` / `PublishedRelation` /
`PublishedGraphVersion` / `PublishedGraphSnapshot` (read-only source, never
mutated/created); MVP4 `GraphExploreNode` / `GraphExploreEdge` (element shape),
`GraphTooLargeState` (too-large state + 150/300 budget precedent),
`PublishedGraphVersionRef`, `GraphExploreState` (structural precedent for
`GraphVizStatus`); MVP1 `class_id` / `relation_id` (summary bucket keys, opaque, no
new enum); MVP5 `Role` (read authorization). Focus/neighborhood = the existing MVP4
graph-explore endpoint (not re-implemented).

## 8. DTO / Field Gap Analysis vs the Backend Draft

**Reconciliation status: PENDING.** The Backend contract draft
(`docs/api/MVP6_12_ADVANCED_VIZ_API_CONTRACT_DRAFT.md`) and
`docs/api/openapi-mvp6-12-draft.json` were **not present** when this document was
written (Backend `BE6-086`~`BE6-087` runs in parallel). The table below is therefore
the FE **field/state need list** derived from the frozen PM brief + ADR 0019; each
row's status is FE's expectation that the Backend draft must **confirm / finalize**.
This is a **blocking dependency**: §8 must be reconciled against the landed Backend
draft (and this section updated) before Wave56 implementation. G1–G4 map to the PM
brief §11 Wave56 open gates.

| # | Gap | FE need | Status / action |
|---|---|---|---|
| G1 | **Filter hints in P0 or P1** | Whether `GET /graph-viz` accepts read-only `class_ids` / `relation_ids` params (server bounds the element set) or the FE filters client-side. | **OPEN (brief §11 G1).** Recommend Backend accept optional filter params in P0 (cheap, read-only); **summary ALWAYS over the full published graph**. FE builds §2.5 behind whichever is frozen. Backend confirms. |
| G2 | **`version_id` param + no-current-version response** | Target a specific published version; behavior when none current. | **NEEDS CONFIRM (brief §11 G2).** Expected: optional `version_id`; explicit unknown → `404 PUBLISHED_GRAPH_VERSION_NOT_FOUND`; none requested + none current → **200 `EMPTY`** (recommended). Backend confirms the split. |
| G3 | **`density` / `component_count` definitions** | Accurate stat labels/precision (§2.2). | **OPEN (brief §11 G3).** FE renders as returned; assumes directed `density = E/(V*(V-1))` (`0` for `V<=1`) and `component_count` over the **undirected** projection. Backend freezes the definitions. |
| G4 | **LNB/IA placement** | Contextual sub-view of Published Graph vs a new LNB item. | **RATIFIED (brief §11 G4 / commander).** Contextual sub-view of the existing Published Graph surface; NO new LNB item (§1). Sub-view mechanism (query param vs in-page tab) is an FE Wave56 choice. |
| G5 | **Reused element shape: `hop` field for whole-graph viz** | `GraphVizNode` reuses `GraphExploreNode`, whose `hop` is root-anchored and meaningless for a whole-graph (not root-anchored) view. | **NEEDS CONFIRM.** FE does not render `hop` on the viz surface. Backend confirms whether `hop` is omitted / nullable / a fixed sentinel on `GraphVizNode`, so the reused shape is not misread as root-anchored. FE renders `degree` / `component_id` instead. |
| G6 | **Layout-hint fields present, coordinates absent** | Client-side layout needs `degree` + `component_id` on every node; must confirm NO x/y. | **FROZEN, confirm.** Brief §3.2 / ADR 0019: `degree` + `component_id` present; **no x/y**. FE computes positions client-side. Backend exposes both hints as required on `GraphVizNode` and emits no coordinate field. |
| G7 | **`generated_at` freshness field** | Freshness/stale marker + "byte-stable modulo `generated_at`" framing. | **NEEDS CONFIRM (likely present).** Brief §3 lists `generated_at` on the response; if omitted, FE drops the stale marker (non-blocking). Backend confirms. |
| G8 | **Guard flag list stability (exactly 6)** | Proof line renders exactly 6 flag names, all `false`, all required, on every status. | **FROZEN, confirm.** Brief §6 / ADR 0019 freeze the 6 `GraphVizMutationGuard` flags; Backend exposes all 6 as `const:false` / `required` on every response. FE reads them live (§2.1). |
| G9 | **Result state vs transport error split** | 200 result (`EMPTY` / `TOO_LARGE_SUMMARY_ONLY`) vs 4xx (`400`/`403`/`404`). | **NEEDS CONFIRM.** Expected: `EMPTY` + `TOO_LARGE_SUMMARY_ONLY` are 200 result states; invalid cap → `400`; non-member → `403`; unknown project/version → `404`. Backend confirms so FE distinguishes error vs result (§3). |
| G10 | **Summary present + exact in `TOO_LARGE_SUMMARY_ONLY`** | Summary panel renders exact stats even when elements omitted. | **FROZEN, confirm.** Brief §4 / ADR 0019: `summary` computed over the FULL graph, exact, in every status; elements empty only in too-large. Backend confirms `summary` is always populated (not null) when `TOO_LARGE_SUMMARY_ONLY`. |
| G11 | **Caps echoed + `truncated` semantics** | Show active `node_cap`/`edge_cap`; `truncated:true` ⇔ `TOO_LARGE_SUMMARY_ONLY`. | **FROZEN, confirm.** Brief §4: `node_cap`/`edge_cap` echoed; `truncated:true` co-occurs with the too-large fallback (elements omitted), `false` in READY/EMPTY. Backend confirms. |
| G12 | **Korean sub-view labels + status glosses (no LNB label change)** | KO sub-view labels (`탐색기` / `시각화 · 요약`); `GraphVizStatus` / boundary-chip glosses. | **PM/COMMANDER DECISION** (not a Backend field). FE proposals in §1.3 / §4; ratify per brief §11. LNB label unchanged (no new item, G4 ratified). |

Remaining open items for Wave56 (Backend closes in the draft): **G1** (filter
hints), **G2** (`version_id` + no-current-version split), **G3** (density/component
definitions), **G5** (`hop` on the reused element shape), **G7** (`generated_at`),
**G9** (result-vs-error split). None block the *planning* deliverable or the P0 UX
shape; **G4** is ratified (contextual sub-view, no new LNB item); **G12** is a
PM/commander copy confirm. Once the Backend draft lands, this section must be
re-reconciled field-by-field (currently PENDING, not reconciled).

## 9. Non-negotiable Boundary Restated (FE view)

- The advanced-viz surface is **read-only visualization of the published graph +
  summary stats only.** It **mutates nothing, publishes nothing, saves nothing.** No
  save-layout / apply / publish / snapshot / export / "저장" / "게시" affordance
  exists anywhere.
- **Published-only in P0.** `GraphVizScope=PUBLISHED` (single literal); candidate viz
  + candidate/published comparison are P1 (`CANDIDATE` reserved, never produced). The
  surface reads the published graph only.
- **No server-side layout, no layout persistence/cache.** The response carries layout
  **hints** (`degree` / `component_id` / `class_id`) and **no x/y coordinates**; the
  FE computes positions client-side and never sends a layout back;
  `layout_persisted` is always `false` (headline invariant).
- **Deterministic bounded + too-large-summary-only.** Caps 150/300 (overridable in
  range); over-cap → `TOO_LARGE_SUMMARY_ONLY` with **empty elements + exact
  summary** (no fabricated/representative subgraph); zero entities → `EMPTY` with a
  zeroed summary; summary exact + byte-stable modulo `generated_at` in every status.
- Every response carries an **all-false** `GraphVizMutationGuard` (6 flags), rendered
  as a live proof line — read from the response, not hardcoded as decoration.
  `published_graph_mutated` + `layout_persisted` are the headline assertions. Any
  `true` flag (impossible in P0) forces a guard-violation state.
- Focus/neighborhood reuses the **existing** MVP4 graph-explore endpoint (root+hops)
  — no new focus endpoint. Additive only; no MVP1–MVP6.11 break; no rename of reused
  shapes; boundary per ADR 0019.
</content>
</invoke>
