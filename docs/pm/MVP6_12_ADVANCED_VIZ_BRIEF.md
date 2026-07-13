# MVP6.12 Advanced Visualization — P0 Freeze Brief

Status: `WAVE56 GATE FREEZE (PM6-038): G1/G3 frozen, G2/G5 confirmed, G12 ratified, fixture matrix frozen (§11); prev WAVE55 PLANNING (PM6-037, ADR 0019)`
Date: 2026-07-13

Contract-first planning freeze for the smallest coherent, SAFE advanced-visualization
P0: a single read-only, whole-graph **viz data + summary-stats** surface over a
project's **PUBLISHED** graph. Bounded node/edge elements + layout-ready metadata +
graph-level summary statistics, with a deterministic **too-large → summary-only**
fallback (reusing the MVP4 safe-too-large precedent). No graph mutation, no publish,
no version/snapshot creation, no candidate viz, no server-side layout, no layout
persistence/cache. All-false mutation guard on every response. Durable boundary: ADR
0019. Runtime waits for Wave56.

This is the FINAL MVP6 theme (roadmap §12 Theme 9). It is deliberately the thinnest
additive delta over the two existing graph read surfaces (MVP3 published graph, MVP4
graph-explore): the genuine gap it fills is **graph-level summary statistics** + a
**whole-graph** (not root-anchored) bounded view with layout hints. Neighborhood /
focus stays served by the existing MVP4 explore endpoint — it is NOT re-implemented.

## 1. P0 demo flow (frozen)

```text
select project
-> open Published Graph (Publish / Published Graph area)
-> open the Visualization / Summary panel
-> read graph-level summary stats: node counts by class, edge counts by relation,
   density, component count, largest-component size, isolated-node count, max degree
-> when within budget (READY): see the whole-graph bounded node/edge view with
   layout hints (degree / component / class group); apply read-only class/relation
   filters; focus a node's neighborhood (reuses MVP4 explore root+hops)
-> when over budget (TOO_LARGE_SUMMARY_ONLY): see the full summary + exact totals +
   "too large — showing summary only; narrow with filters" state (no element list)
-> read the explicit "read-only visualization — nothing changes the graph" boundary
```

Nothing is written, published, versioned, snapshotted, cached, or persisted.

## 2. Non-negotiable boundary (= ADR 0019)

- **Read-only viz data + summary only.** No graph mutation, no publish, no
  `PublishedGraphVersion` / `PublishedGraphSnapshot` / entity / relation creation.
- **Published-only in P0.** `GraphVizScope=PUBLISHED` single literal; `CANDIDATE`
  reserved, never produced. Candidate viz + candidate/published comparison = P1.
- **No server-side layout, no layout persistence/cache.** Layout **hints** only
  (degree / component_id / class group); NO x/y coordinates computed server-side;
  nothing cached or stored. `layout_persisted:false` is a headline guard flag.
- **Deterministic bounded + too-large-summary-only.** Node/edge caps (150 / 300,
  MVP4 budgets) + `truncated` + exact totals; over-cap → `TOO_LARGE_SUMMARY_ONLY`
  (summary over the FULL graph, elements omitted). `published_graph_mutated` always
  false (headline invariant).
- **All-false mutation guard on every response** (§6). Additive only; no break of
  MVP1–MVP6.11 surfaces/smokes; reuse existing shapes by reference (no renames).

## 3. Viz data model (frozen)

Single response `GraphVizResponse` (Backend finalizes exact field names) for a
project's current published graph version (or an explicitly-requested published
version):

- `project_id`, `scope` (`GraphVizScope=PUBLISHED`),
  `published_graph_version_ref` (reuse MVP4 `PublishedGraphVersionRef`), `generated_at`
- `status` — `GraphVizStatus`
- `summary` — `GraphVizSummary` (§3.1)
- `node_cap`, `edge_cap`, `truncated` (bool)
- `nodes[]` — `GraphVizNode` (§3.2); present when `READY`, empty otherwise
- `edges[]` — `GraphVizEdge` (§3.2); present when `READY`, empty otherwise
- `too_large` — `GraphVizTooLargeState` (reuse MVP4 `GraphTooLargeState` shape:
  `estimated_nodes`, `estimated_edges`, `node_budget`, `edge_budget`,
  `suggested_filters[]`, `message`); present ONLY when `TOO_LARGE_SUMMARY_ONLY`
- `mutation_guard` — all-false `GraphVizMutationGuard` (§6)
- `boundary_note` — *"read-only visualization — nothing changes the graph;
  publishing stays the separate MVP3 publish path."*

### 3.1 `GraphVizSummary` (exact, cheap, always computed — even when too large)
- `total_node_count`, `total_edge_count`
- `node_counts_by_class[]` — each `{class_id, count}` (opaque MVP1 `class_id` key)
- `edge_counts_by_relation[]` — each `{relation_id, count}` (opaque MVP1 `relation_id` key)
- `density` — deterministic `E / (V*(V-1))` for `V>1`, else `0`
- `component_count`, `largest_component_size`, `isolated_node_count`, `max_degree`

Computed by a single linear O(V+E) pass (counts + union-find). No layout, no
centrality, no clustering, no path-finding. Counts are exact in every status.

### 3.2 `GraphVizNode` / `GraphVizEdge` (reuse MVP4 explore element shapes by ref)
- `GraphVizNode`: reuse `GraphExploreNode` fields (`published_entity_id`, `class_id`,
  `label`, `properties`, `quality_summary`, `source_count`, `evidence_count`,
  `lineage_available`) **by reference**, plus layout **hints**: `degree`,
  `component_id`. NO `x`/`y` coordinates.
- `GraphVizEdge`: reuse `GraphExploreEdge` fields (`published_relation_id`,
  `source_node_id`, `target_node_id`, `relation_id`, `label`, `properties`,
  `quality_summary`, `evidence_count`, `lineage_available`) **by reference**.
- Deterministic node/edge ordering; byte-stable modulo `generated_at`.

## 4. Bounding rule + too-large fallback (frozen, deterministic)

- Caps: `node_cap` default `150`, `edge_cap` default `300` (reuse MVP4 budgets).
  Overridable via query within `[1,150]` / `[1,300]`; out of range → `400`.
- `total_node_count <= node_cap AND total_edge_count <= edge_cap` → `READY`: full
  bounded `nodes[]`/`edges[]` + full `summary`; `truncated:false`; `too_large:null`.
- Either total > its cap → `TOO_LARGE_SUMMARY_ONLY`: `nodes[]`/`edges[]` **empty**;
  `summary` computed over the **full** published graph (exact totals + by-kind +
  density + components); `truncated:true`; `too_large` populated (exact estimates +
  budgets + suggested filters + message). Mirrors MVP4 `SAFE_TOO_LARGE` exactly.
- Zero entities → `EMPTY` (200; zeroed summary; empty elements; `too_large:null`).
- A bounded **representative** subgraph on too-large is a named **P1** refinement.

### `GraphVizStatus` (viz-scoped; structural precedent = MVP4 `GraphExploreState`)
- `READY` — full bounded viz data + summary within budget.
- `TOO_LARGE_SUMMARY_ONLY` — over budget; summary + exact totals only, no elements.
- `EMPTY` — published graph has zero entities.

(No `ERROR` state in P0: invalid target is a `400`/`403`/`404`, not a result state.)

### `GraphVizScope`
- `PUBLISHED` — single literal; asserts the viz reads the published graph only,
  never candidate, never draft. `CANDIDATE` reserved (P1), never produced in P0.

## 5. Reuse (by reference, no renames)

| Precedent | Reuse |
|---|---|
| MVP3 published graph (ADR 0006) | `PublishedEntity` / `PublishedRelation` / `PublishedGraphVersion` / `PublishedGraphSnapshot` — the read-only source projected from; never mutated/created. |
| MVP4 graph-explore | `GraphExploreNode` / `GraphExploreEdge` (element shape), `GraphTooLargeState` (too-large state + 150/300 budget precedent), `PublishedGraphVersionRef` — by reference. `GraphExploreState` = structural precedent for `GraphVizStatus` (not renamed). Neighborhood/focus = the existing explore endpoint (root+hops), not re-implemented. |
| MVP1 ontology | `class_id` / `relation_id` grouping keys for summary buckets (opaque ids, no new enum). |
| MVP5 `Role` | read authorization (no new role literal). |

## 6. All-false `GraphVizMutationGuard` (frozen; every response)

- `published_graph_mutated: false`
- `candidate_graph_mutated: false`
- `ontology_draft_mutated: false`
- `published_version_created: false`
- `graph_snapshot_created: false`
- `layout_persisted: false`

Every flag false on every viz response. `published_graph_mutated` + `layout_persisted`
are the headline assertions. MVP6.12 turns **no** flag true.

## 7. Authorization (frozen)

- Read-only over already-published facts, mutates/grants nothing → any project member
  who can view the project (and the existing MVP3 Published Graph Explorer) may read
  the viz surface. No elevated role. Reuse MVP5 `Role`; no new role literal.
- Unknown project → `404 PROJECT_NOT_FOUND`. Explicitly-requested unknown published
  version → `404 PUBLISHED_GRAPH_VERSION_NOT_FOUND`. No version requested + no current
  published version → `200 EMPTY` (a result state, not a 4xx). Non-member → `403
  PERMISSION_DENIED`. Invalid `node_cap`/`edge_cap` → `400`.

## 8. Suggested endpoint (planning; Backend finalizes)

- `GET /api/v1/projects/{project_id}/graph-viz` — read-only bounded whole-graph viz
  data + summary for the project's current published graph. Optional query:
  `version_id` (target a specific published version), `node_cap` (`[1,150]`),
  `edge_cap` (`[1,300]`), and read-only filter hints (`class_ids`, `relation_ids`)
  Backend may accept for the bounded element set (summary always over the full graph).
  Returns `GraphVizResponse` (§3). Compute-on-read; no `viz_id`, no GET-by-id, no
  list. Process-local `reset_runtime_store()` + the existing relational published
  reader acceptable; durable DB/Alembic is P1/P2.

Neighborhood/focus is served by the existing MVP4 graph-explore endpoint (root +
hops) — NOT a new endpoint in P0.

## 9. Explicit exclusions (P1+ unless PM re-freezes)

Any graph mutation / publish / version or snapshot creation; candidate-graph viz +
candidate/published comparison layers (`GraphVizScope=CANDIDATE`); layout persistence
/ layout cache / stored presets; server-side layout computation (x/y coordinates,
force-directed / hierarchical layout, clustering); heavy analytics (centrality,
community detection beyond connected-component count, path-finding); a bounded
representative subgraph on too-large (P0 is summary-only); time-lapse / temporal graph
animation; Ontology Diff Graph; Source-to-Graph Trace View; Relation Matrix View;
Evidence Heatmap; Data Quality Storyboard / Executive Summary narrative; extra
quality-layer coloring beyond the reused per-element `quality_summary`; real-time
collaboration; external export / embed / image render; a new neighborhood/focus
endpoint (reuse MVP4 explore).

## 10. Durable invariants preserved

- Candidate/published separation: the viz reads the published graph only; candidate
  viz deferred; `candidate_graph_mutated` + `published_graph_mutated` always false.
- Evidence/version traceability: elements carry `published_graph_version_ref` + the
  reused lineage-backed element shapes; summary is over a single published version.
- Contract-first + additive-only: no MVP1–MVP6.11 rename/break; reuse by reference.
- No autonomous / unreviewed graph write; no server-side layout or cache; no publish.
- Deterministic + bounded: exact summary counts, cap+`truncated`+too-large fallback,
  byte-stable modulo `generated_at`.

## 11. Wave56 gates (FROZEN by PM6-038 — Wave56 PM freeze)

Frozen at Wave56 PM (`docs/handoffs/wave-056/PM_REPORT.md`, PM6-038). No contract
shape change vs `openapi-mvp6-12-draft.json`; these are deterministic refinements.

- **G1 — filter hints in P0 (FROZEN).** `GET /graph-viz` accepts optional read-only
  `class_ids` / `relation_ids` query params in P0. Semantics (deterministic, induced
  subgraph, **element-view only**): with `class_ids` non-empty a node is included in
  `nodes[]` iff its `class_id` ∈ `class_ids`; with `relation_ids` non-empty an edge is
  included in `edges[]` iff its `relation_id` ∈ `relation_ids` **AND** both endpoint
  nodes are included; an omitted/empty filter imposes no restriction on that
  dimension. `GraphVizSummary`, `status`, `truncated`, and each node's `degree` /
  `component_id` layout hints are ALWAYS computed over the FULL, UNFILTERED graph —
  filters never change them. Filters do NOT rescue a `TOO_LARGE_SUMMARY_ONLY` graph:
  status is decided by the full-graph totals vs caps, so a too-large graph keeps
  empty elements regardless of filters (P0).
- **G2 — no-current-version response (CONFIRMED).** No current published version and
  none requested → **`200 EMPTY`** (not `404`): zeroed `GraphVizSummary`, empty
  `nodes[]`/`edges[]`, `too_large:null`, `truncated:false`, `published_graph_version_
  ref` may be null, all-false 6-flag guard. An explicitly-requested unknown
  `version_id` → `404 PUBLISHED_GRAPH_VERSION_NOT_FOUND`.
- **G3 — stat formulas (FROZEN, deterministic; single O(V+E) pass).**
  `density` = `total_edge_count / (total_node_count * (total_node_count - 1))` for
  `V>1`, else `0` (directed convention — no ×2). `component_count` /
  `largest_component_size` = connected components over the UNDIRECTED projection of
  edges (each edge bidirectional; an isolated node = its own component of size 1).
  `isolated_node_count` = nodes with undirected total degree 0.
  `max_degree` = max over nodes of undirected total degree (count of incident edges;
  multi-edges counted per edge; no self-loops in the published graph). Counts +
  union-find only; no centrality / clustering / path-finding.
- **G4 — LNB/IA placement (RATIFIED, commander).** Contextual sub-view of the
  existing Publish-group **Published Graph** surface (ADR 0010; route
  `/projects/:p/published-graph`, in-screen `탐색기 | 시각화 · 요약` toggle) — NO new
  LNB item; single-active-LNB invariant preserved. Not a new Analyze/global item.
- **G5 — `hop` disposition (CONFIRMED).** `GraphVizNode` OMITS the MVP4 root-anchored
  `hop` (dropped, not nullable/sentinel — verified absent in `openapi-mvp6-12-draft.
  json`); it carries `degree` + `component_id` layout hints and NO x/y. Runtime emits
  no `hop` on `GraphVizNode`.
- **G12 — Korean copy (RATIFIED).** LNB label `Published Graph` UNCHANGED (no new
  item); page H1 `게시 그래프 탐색기` unchanged; sub-view toggle labels `탐색기`
  (Explorer) / `시각화 · 요약` (Visualization·Summary). Status glosses: `READY · 준비됨`,
  `TOO_LARGE_SUMMARY_ONLY · 너무 큼 · 요약만`, `EMPTY · 데이터 없음`; scope
  `PUBLISHED · 게시 전용`; boundary chips `READ_ONLY · 읽기 전용`,
  `NOTHING_CHANGES · 변경 없음`, `NO_PUBLISH · 게시 없음`,
  `NO_LAYOUT_SAVED · 레이아웃 저장 없음`, `PUBLISHED_ONLY · 게시 전용`. Banner + EMPTY /
  too-large copy per FE UX requirements §2.1/§2.4/§3 ratified as-is.

### 11.1 Fixture matrix (FROZEN — BE builds exactly this; FE/QA test against it)

Deterministic process-local published-graph fixtures keyed by `project_id`, re-seeded
by `reset_runtime_store()` (MVP6.11 packs / MVP6.7 impact precedent). Read-only source
projected from; never mutated. Default caps `node_cap=150`, `edge_cap=300`.

| project / version | size | status | key summary values |
|---|---|---|---|
| `proj-viz-demo` / `pgv-viz-demo-v1` | 12 nodes, 9 directed edges (within caps) | **READY** | see §11.2 exact values; full bounded `nodes[]`/`edges[]`; `truncated:false`; `too_large:null` |
| `proj-viz-large` / `pgv-viz-large-v1` | 210 nodes, 480 edges (over 150/300) | **TOO_LARGE_SUMMARY_ONLY** | `total_node_count:210`, `total_edge_count:480`; `nodes[]`/`edges[]` EMPTY; `truncated:true`; `too_large` = `{estimated_nodes:210, estimated_edges:480, node_budget:150, edge_budget:300, suggested_filters[], message}`; summary still EXACT over the full 210/480 graph |
| `proj-viz-empty` / — (no current published version) | 0 | **EMPTY (200)** | zeroed summary (all counts `0`, `density:0`); empty elements; `too_large:null`; `truncated:false`; ref may be null |

Authz/transport fixtures: unknown project → `404 PROJECT_NOT_FOUND`; `proj-viz-demo`
+ unknown `version_id` → `404 PUBLISHED_GRAPH_VERSION_NOT_FOUND`; non-member →
`403 PERMISSION_DENIED`; `node_cap`∉[1,150] or `edge_cap`∉[1,300] → `400 INVALID_CAP`.

### 11.2 `proj-viz-demo` READY exact graph (frozen — QA recomputes against this)

Nodes (12): `class-person`={n1..n5} (5), `class-org`={n6,n7,n8,n9} (4),
`class-doc`={n10,n11,n12} (3).
Edges (9, directed): `rel-employs` (org→person) n6→n1, n6→n2, n7→n3, n8→n4 (4);
`rel-authored` (person→doc) n1→n10, n2→n11, n3→n12 (3); `rel-partner` (org→org)
n6→n7, n8→n9 (2).

Derived `GraphVizSummary` (exact):
- `total_node_count`=12, `total_edge_count`=9
- `node_counts_by_class` = person 5, org 4, doc 3
- `edge_counts_by_relation` = employs 4, authored 3, partner 2
- `density` = 9 / (12×11) = 9/132 = **0.068** (3-dp)
- Undirected components: A={n6,n1,n2,n7,n3,n10,n11,n12} (8), B={n8,n4,n9} (3),
  C={n5} (1). → `component_count`=**3**, `largest_component_size`=**8**
- `isolated_node_count` = **1** (n5)
- `max_degree` = **3** (n6: incident to n1,n2,n7)

Deterministic ordering: `nodes[]` by `published_entity_id` asc; `edges[]` by
`(source_node_id, target_node_id, published_relation_id)` asc; `node_counts_by_class`
by `class_id` asc; `edge_counts_by_relation` by `relation_id` asc. Byte-stable modulo
`generated_at`.

## 12. Backlog IDs

PM `PM6-037`; Backend `BE6-086`~`BE6-087`; Frontend `FE6-104`; QA `INT6-102`.
(See `docs/backlog/MVP6_DRAFT_BACKLOG.md` Wave55 section.)
</content>
