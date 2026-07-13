# MVP6.12 Advanced Visualization — API Contract Draft (planning only)

Status: `WAVE55 CONTRACT-FIRST PLANNING (BE6-086~087)`
Date: 2026-07-13
OpenAPI artifact: `docs/api/openapi-mvp6-12-draft.json` (3.1.0, `0.6.12-draft`)
Freeze source: `docs/pm/MVP6_12_ADVANCED_VIZ_BRIEF.md` (PM6-037), ADR 0019.

This is a **planning-only, additive** contract. No runtime code, models, migrations,
or tests are produced in Wave55 — runtime waits for Wave56. It is the thinnest
additive delta over the two existing graph read surfaces (MVP3 published graph, MVP4
graph-explore): the genuine gap it fills is **graph-level summary statistics** + a
**whole-graph** (not root-anchored) bounded node/edge view with **client-side layout
hints**. Neighborhood/focus stays served by the existing MVP4 graph-explore endpoint
(root + hops) — it is NOT re-implemented here.

## 1. Boundary (= ADR 0019, restated for implementers)

- **Read-only.** Reads already-published facts only. No graph mutation
  (published/candidate/draft), no publish, no `PublishedGraphVersion` /
  `PublishedGraphSnapshot` / entity / relation creation.
- **Published-only in P0.** `GraphVizScope=PUBLISHED` is the only literal ever
  produced; `CANDIDATE` is reserved and NEVER produced in P0.
- **No server-side layout, no persistence/cache.** Layout **hints** only
  (`degree`, `component_id`); NO x/y coordinates; nothing stored or cached.
  `layout_persisted:false` is a headline guard flag.
- **Deterministic + bounded.** Caps 150 nodes / 300 edges (MVP4 budgets) +
  `truncated` + exact totals; over-cap → `TOO_LARGE_SUMMARY_ONLY` (summary over the
  FULL graph, elements omitted). Byte-stable modulo `generated_at`.
- **All-false 6-flag mutation guard on every response.** Additive only; no MVP1–
  MVP6.11 rename/break; reuse existing shapes by reference.

## 2. Endpoint (1)

### `GET /api/v1/projects/{project_id}/graph-viz`
Read-only, compute-on-read whole-graph viz data + summary for the project's current
published graph (or an explicitly-requested published version). No `viz_id`, no
GET-by-id, no list.

**Query params (all optional):**

| Param | Type | Bounds | Semantics |
|---|---|---|---|
| `version_id` | string | — | Target a specific published version. Omitted → current published version (or `200 EMPTY` if none). Unknown → `404 PUBLISHED_GRAPH_VERSION_NOT_FOUND`. |
| `node_cap` | integer | `[1,150]`, default 150 | Node budget for the bounded view. Out of range → `400 INVALID_CAP`. |
| `edge_cap` | integer | `[1,300]`, default 300 | Edge budget for the bounded view. Out of range → `400 INVALID_CAP`. |
| `class_ids` | string[] | — | **G1 filter hint.** Bounds the element set only; summary is ALWAYS over the full graph. P0-vs-P1 open (G1). |
| `relation_ids` | string[] | — | **G1 filter hint.** Bounds the element set only; summary is ALWAYS over the full graph. P0-vs-P1 open (G1). |

**Returns:** `GraphVizResponse` (200). Errors: `400 INVALID_CAP`,
`403 PERMISSION_DENIED`, `404 PROJECT_NOT_FOUND`,
`404 PUBLISHED_GRAPH_VERSION_NOT_FOUND`.

**Authz:** any project member who can view the project (and its MVP3 Published Graph
Explorer). Reuse MVP5 `Role`; no new role literal, no elevated role.

## 3. Enums (frozen — use exactly)

- **`GraphVizStatus`** — `READY` / `TOO_LARGE_SUMMARY_ONLY` / `EMPTY`.
  (Structural precedent = MVP4 `GraphExploreState`, NOT renamed. No `ERROR` state:
  invalid target is a 400/403/404, not a result state.)
- **`GraphVizScope`** — `PUBLISHED` (only literal produced) / `CANDIDATE` (reserved,
  never produced in P0).

## 4. Response DTOs (frozen shapes)

### `GraphVizResponse`
`project_id`, `scope` (`PUBLISHED`), `published_graph_version_ref` (nullable for
EMPTY), `generated_at` (the ONLY non-byte-stable field), `status`, `summary`,
`node_cap`, `edge_cap`, `truncated`, `nodes[]`, `edges[]`, `too_large` (nullable),
`mutation_guard`, `boundary_note`.
- `nodes[]`/`edges[]` populated only when `status=READY`; empty otherwise.
- `too_large` populated only when `status=TOO_LARGE_SUMMARY_ONLY`; null otherwise.

### `GraphVizSummary` (single O(V+E) pass; exact in EVERY status)
`total_node_count`, `total_edge_count`, `node_counts_by_class[]`
(`{class_id, count}`), `edge_counts_by_relation[]` (`{relation_id, count}`),
`density`, `component_count`, `largest_component_size`, `isolated_node_count`,
`max_degree`. Counts + union-find only — no centrality, clustering, or path-finding.
- **G3:** `density` = directed `E / (V*(V-1))` for `V>1`, else `0`;
  `component_count` / `largest_component_size` over the **undirected** projection of
  edges (connectivity ignores direction). `max_degree` is undirected.

### `GraphVizNode` (reuse MVP4 `GraphExploreNode` by reference + layout hints)
Reused fields: `published_entity_id`, `class_id`, `label`, `properties`,
`quality_summary`, `source_count`, `evidence_count`, `lineage_available`.
Added layout **hints**: `degree` (undirected), `component_id`. **NO `x`/`y`.**
The MVP4 root-anchored `hop` field is omitted (not meaningful for a whole-graph view).

### `GraphVizEdge` (reuse MVP4 `GraphExploreEdge` by reference)
Reused fields: `published_relation_id`, `source_node_id`, `target_node_id`,
`relation_id`, `label`, `properties`, `quality_summary`, `evidence_count`,
`lineage_available`. No layout coordinates.

### `GraphVizTooLargeState` (reuse MVP4 `GraphTooLargeState` verbatim)
`estimated_nodes`, `estimated_edges`, `node_budget`, `edge_budget`,
`suggested_filters[]`, `message`. Present only when `TOO_LARGE_SUMMARY_ONLY`.

### `GraphVizMutationGuard` (all-false, 6 flags — every response)
`published_graph_mutated`, `candidate_graph_mutated`, `ontology_draft_mutated`,
`published_version_created`, `graph_snapshot_created`, `layout_persisted` — all
`const:false`. Headline assertions: `published_graph_mutated` + `layout_persisted`.
MVP6.12 turns NO flag true, ever.

## 5. Bounding rule + too-large fallback (deterministic)

- `total_node_count <= node_cap AND total_edge_count <= edge_cap` → **`READY`**: full
  bounded `nodes[]`/`edges[]` + full `summary`; `truncated:false`; `too_large:null`.
- Either total > its cap → **`TOO_LARGE_SUMMARY_ONLY`**: `nodes[]`/`edges[]`
  **empty**; `summary` still exact over the **full** graph; `truncated:true`;
  `too_large` populated. Mirrors MVP4 `SAFE_TOO_LARGE` exactly.
- Zero entities / no current published version (and none requested) → **`EMPTY`**
  (`200`; zeroed summary; empty elements; `too_large:null`; `ref` may be null).
- A bounded **representative** subgraph on too-large is a named **P1** refinement.

## 6. Reuse by reference (no renames)

| Precedent | Reuse | Source |
|---|---|---|
| MVP3 published graph (ADR 0006) | `PublishedEntity`/`PublishedRelation`/`PublishedGraphVersion`/`PublishedGraphSnapshot` — read-only source projected from; never mutated/created. | `openapi-mvp3-draft.json` |
| MVP4 graph-explore | `GraphExploreNode`/`GraphExploreEdge` (element shape), `GraphTooLargeState` (too-large + 150/300 budgets), `PublishedGraphVersionRef` — by reference. `GraphExploreState` = structural precedent for `GraphVizStatus`. Neighborhood/focus = the existing explore endpoint, not re-implemented. | `openapi-mvp4-draft.json` |
| MVP1 ontology | `class_id`/`relation_id` grouping keys (opaque ids, no new enum). | `apps/backend/app/core/enums.py` |
| MVP5 `Role` | read authorization (no new role literal). | `apps/backend/app/core/enums.py` |

## 7. Transport / error codes

| Status | Code | When |
|---|---|---|
| 200 | — | `READY` / `TOO_LARGE_SUMMARY_ONLY` / `EMPTY` (incl. no current published version) |
| 400 | `INVALID_CAP` | `node_cap` ∉ `[1,150]` or `edge_cap` ∉ `[1,300]` |
| 403 | `PERMISSION_DENIED` | caller not a member who can view the project |
| 404 | `PROJECT_NOT_FOUND` | unknown project |
| 404 | `PUBLISHED_GRAPH_VERSION_NOT_FOUND` | explicitly-requested unknown published version |

## 8. Open questions (for Wave56 PM freeze; recorded here for FE/QA)

- **G1 — filter hints P0 vs P1.** Whether `class_ids`/`relation_ids` are accepted in
  P0 (bounding the element set only; summary ALWAYS over the full graph) or deferred
  to FE/MVP4-explore. This draft includes them as optional (recommended P0);
  removable without touching the response shape. FE/QA: treat as optional.
- **G2 — no-current-version response.** This draft returns `200 EMPTY` (recommended)
  vs `404`. FE renders EMPTY as a first-class state, not an error.
- **G3 — density/components on directed edges.** Frozen in this draft as directed
  `density = E/(V*(V-1))` and `component_count` over the **undirected** projection.
- **G4 — LNB/IA placement.** Commander ratified: the viz summary/whole-graph panel is
  a **contextual sub-view of the existing Published Graph** surface (ADR 0010) — no
  new global LNB item. FE to place accordingly.

## 9. Validation

- `python3 -m json.tool docs/api/openapi-mvp6-12-draft.json > /dev/null` → PARSE_OK.
- `git diff --check` → clean.
- Additive to MVP1–MVP6.11: 1 new path (`GET /projects/{project_id}/graph-viz`),
  1 operation, 12 schemas, redefines no prior OpenAPI path.
