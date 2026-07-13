# ADR 0019: MVP6.12 Advanced Visualization — Read-Only Bounded Published-Graph Viz Data + Summary Stats, Deterministic Too-Large-Summary-Only Fallback, No-Mutation, No-Layout-Persist, All-False Mutation Guard Boundary

## Status

Accepted

## Context

MVP6.12 is the FINAL MVP6 theme (user-directed sequence) — roadmap §12 Theme 9
**Advanced Visualization & Knowledge Storytelling**. The roadmap theme is broad:
Graph Lens, quality-layer graph coloring, candidate/published comparison layers,
time-lapse graph animation, Ontology Diff Graph, Source-to-Graph Trace View,
Relation Matrix, Evidence Heatmap, Data Quality Storyboard, Executive Summary
View, plus a backend wishlist of "visualization-only graph snapshot API",
relation-neighborhood API, timeline API, source-to-graph trace API, quality-layer
API, and a **graph layout cache**. Taken whole it is large and risky: server-side
layout computation/caching, candidate/published mixing in one canvas, time-lapse
requiring historical snapshots, and multiple new heavy read surfaces.

The platform already ships two graph read surfaces: the MVP3 relational **published
graph** (`PublishedEntity` / `PublishedRelation` / `PublishedGraphSnapshot` /
`PublishedGraphVersion`, ADR 0006) and the MVP4 **graph-explore** endpoint, which
already returns a root-anchored, bounded node/edge neighborhood with a
deterministic **safe-too-large** fallback (`GraphExploreState.SAFE_TOO_LARGE` +
`GraphTooLargeState` with node/edge budgets 150/300 and suggested filters, returning
empty elements + a too-large state). The FE already has a Published Graph Explorer
page + a graph vendor bundle.

The genuine additive gap MVP6.12 P0 fills — and the only thing it should fill — is a
read-only, **whole-graph** (not root-anchored) **viz data + summary-stats** surface
over a project's PUBLISHED graph: bounded node/edge elements with layout-ready
metadata (degree, component id, class group) **plus** graph-level summary statistics
the existing surfaces lack (node counts by class, edge counts by relation, density,
component count, largest-component size, isolated-node count, max degree), with the
same deterministic bounded + too-large-summary-only fallback the MVP4 explore
established. Neighborhood/focus stays served by the existing MVP4 explore endpoint
(root + hops) — it is NOT re-implemented here. This ADR fixes the boundary so the
viz surface cannot be mistaken for a graph-mutation path, a layout-persistence /
layout-cache write path, a published-version writer, a candidate-graph write/mix, a
time-lapse snapshot generator, or a heavy server-side layout engine.

Surfaces reused **by reference, no renames**:
- MVP3 published graph: `PublishedEntity`, `PublishedRelation`,
  `PublishedGraphVersion`, `PublishedGraphSnapshot` — the read-only source the viz
  data is projected from; never mutated, never re-created.
- MVP4 graph-explore: `GraphExploreNode` / `GraphExploreEdge` (element shape),
  `GraphTooLargeState` (too-large-state shape + node/edge budget precedent),
  `PublishedGraphVersionRef` — reused by reference; `GraphExploreState`
  (READY/SAFE_TOO_LARGE/EMPTY/ERROR) is the structural precedent for the new
  viz-scoped status enum, not renamed.
- MVP1 ontology: `class_id` / `relation_id` grouping keys for the summary buckets
  (opaque ids, not new enums).
- MVP5 `Role` — read authorization; no new role literal.

## Decision

- **MVP6.12 P0 is a single read-only, whole-graph VIZ DATA + SUMMARY surface over a
  project's PUBLISHED graph.** One additive endpoint returns, for a project's current
  published graph version (or an explicitly-requested published version): a
  `GraphVizStatus`, graph-level `GraphVizSummary` statistics, a **bounded** set of
  viz nodes/edges with layout-ready metadata, a deterministic too-large state, a
  `generated_at`, and an all-false mutation guard. Nothing is written, cached,
  persisted, or published.

- **PUBLISHED-ONLY in P0; candidate viz is P1.** The scope is a single literal
  `GraphVizScope=PUBLISHED` (asserting the surface reads the published graph only,
  mirroring the single-literal `PackApplyTargetLayer=DRAFT` pattern). `CANDIDATE` is
  reserved and **never produced** in P0. Candidate-graph viz and candidate/published
  comparison layers are deferred to keep candidate/published separation crisp in the
  UI and because the candidate graph has no stable version pointer to bound against.

- **Deterministic bounding + too-large-summary-only fallback (load-bearing).** Node
  and edge caps (defaults reuse the MVP4 budgets: `node_cap=150`, `edge_cap=300`;
  overridable within `[1,150]` / `[1,300]`, invalid → `400`). When
  `total_node_count <= node_cap AND total_edge_count <= edge_cap` → `READY`: the full
  bounded node/edge lists + the full summary. When either total exceeds its cap →
  `TOO_LARGE_SUMMARY_ONLY`: the node/edge element lists are **omitted (empty)**, the
  `summary` is still computed over the **full** published graph (exact totals + exact
  by-kind counts + density + components — all O(V+E), cheap, no layout), `truncated`
  is `true`, and a `too_large` state carries exact estimated totals + budgets +
  suggested filters + message (reusing the `GraphTooLargeState` shape). When the
  published graph has zero entities → `EMPTY` (200; zeroed summary). This mirrors the
  trusted MVP4 `SAFE_TOO_LARGE` precedent exactly (summary-only, empty elements). A
  bounded **representative** subgraph on too-large (rather than summary-only) is a
  named P1 refinement, out of P0. Given the same project + published version + caps,
  the response is byte-stable modulo `generated_at`.

- **Summary statistics (frozen, cheap, exact).** `GraphVizSummary` carries:
  `total_node_count`, `total_edge_count`, `node_counts_by_class[]` (each
  `{class_id, count}`), `edge_counts_by_relation[]` (each `{relation_id, count}`),
  `density` (deterministic `E / (V*(V-1))` for `V>1`, else `0`), `component_count`,
  `largest_component_size`, `isolated_node_count`, `max_degree`. All computed by a
  single linear O(V+E) pass (counts + union-find for components); no layout, no
  centrality, no clustering, no heavy analytics. Counts are always exact even when
  `TOO_LARGE_SUMMARY_ONLY`.

- **Layout-ready metadata only — NO server-side layout, NO layout persistence /
  cache.** Each `GraphVizNode` carries layout **hints** — `degree`, `component_id`,
  and its `class_id` group — so the FE (which owns the graph vendor bundle) computes
  positions client-side. The response carries **no x/y coordinates**, computes no
  force-directed / hierarchical layout server-side, and persists / caches **nothing**
  (`layout_persisted:false` is a headline guard flag). The roadmap "graph layout
  cache" is explicitly out of P0.

- **NO MUTATION of any graph or version.** The surface reads the published graph and
  the ontology read-only. It creates no `PublishedGraphVersion`, no
  `PublishedGraphSnapshot`, no `PublishedEntity` / `PublishedRelation`, touches
  neither the candidate nor the draft-ontology layer, and publishes nothing.
  Publishing stays the separate MVP3 path.

- **ALL-FALSE mutation guard (frozen flags).** Every viz response carries an
  all-false `GraphVizMutationGuard`; every flag false, no exceptions:
  - `published_graph_mutated: false`
  - `candidate_graph_mutated: false`
  - `ontology_draft_mutated: false`
  - `published_version_created: false`
  - `graph_snapshot_created: false`
  - `layout_persisted: false`

  `published_graph_mutated` and `layout_persisted` are the headline assertions. This
  mirrors the MVP6.1–6.11 all-false pattern; MVP6.12 turns **no** flag true, ever.

- **Authorization (frozen).** Read-only over already-published facts, mutates
  nothing, grants nothing → any project member who can view the project (and the
  existing MVP3 Published Graph Explorer) may read the viz surface; no elevated role.
  Reuse MVP5 `Role`; no new role literal. Unknown project → `404 PROJECT_NOT_FOUND`;
  an explicitly-requested unknown published version → `404
  PUBLISHED_GRAPH_VERSION_NOT_FOUND`; no version requested + no current published
  version → `200 EMPTY` (zeroed summary; a result state, not a 4xx); non-member →
  `403 PERMISSION_DENIED`; invalid cap (`node_cap`/`edge_cap` out of range) → `400`.

- **Persist-vs-compute (deferred to Backend/Wave56).** The viz response is a
  compute-on-read projection of the published graph; no `viz_id`, no GET-by-id, no
  list. Either way it is read-only + all-false-guarded. The proven deterministic
  process-local pattern (`reset_runtime_store()`) plus the existing relational
  published-graph reader is acceptable; durable DB/Alembic persistence is NOT required
  for the P0 thin slice.

- **Out of scope (P1 or later unless explicitly promoted):** any graph mutation /
  publish / version creation; candidate-graph viz + candidate/published comparison
  layers (`GraphVizScope=CANDIDATE`); layout persistence / layout cache / stored
  presets; server-side layout computation (x/y coordinates, force-directed /
  hierarchical layout, clustering); heavy analytics (centrality, community
  detection beyond connected-component count, path-finding); a bounded representative
  subgraph on too-large (P0 is summary-only); time-lapse / temporal graph animation;
  Ontology Diff Graph; Source-to-Graph Trace View; Relation Matrix View; Evidence
  Heatmap; Data Quality Storyboard / Executive Summary narrative; quality-layer
  coloring beyond the reused per-element `quality_summary`; real-time collaboration;
  external export / embed / image render; a new neighborhood/focus endpoint (the
  existing MVP4 graph-explore root+hops endpoint serves focus in P0).

## Consequences

- Backend can draft **one** additive read-only endpoint (`GET
  /api/v1/projects/{project_id}/graph-viz`) reusing MVP3 published-graph +
  MVP4 explore element/too-large shapes **by reference (no renames)**, importing
  **no** publish / version-write / candidate-write / ontology-write / layout-persist
  path. It models `GraphVizStatus`, `GraphVizScope`, the `GraphVizSummary` +
  by-class / by-relation count buckets, `GraphVizNode` / `GraphVizEdge` (element +
  layout hints), the too-large state (reusing `GraphTooLargeState`), the all-false
  `GraphVizMutationGuard`, and the `400` / `403` / `404` transport rules.
- Frontend can enhance the existing Published Graph area (ADR 0010: contextual to the
  Publish-group Published Graph surface; no new ID-bound global LNB page) with a
  summary/statistics panel + a whole-graph bounded viz using layout hints, honest
  `TOO_LARGE_SUMMARY_ONLY` / `EMPTY` states, read-only class/relation filters +
  focus/neighborhood (reusing MVP4 explore), a persistent "read-only visualization —
  nothing changes the graph" boundary banner, a live all-false-guard proof line, and
  first-class loading / empty / error / permission states in the closed design
  language. No mutate / publish / save-layout CTA.
- QA can build deterministic local acceptance: the summary counts are exact and
  stable; `READY` returns cap-bounded elements; over-cap returns
  `TOO_LARGE_SUMMARY_ONLY` with empty elements + `truncated:true` + exact totals +
  too-large state; layout hints present but no coordinates; `GraphVizMutationGuard`
  all-false and data-level no published/candidate/ontology/version row created or
  mutated after a viz read (before==after); `EMPTY` for no published version;
  `400`/`403`/`404` transport; and MVP1–MVP6.11 regression + smokes green.
- The platform preserves candidate/published separation (viz reads the published
  graph only; candidate viz deferred), evidence/version traceability (elements carry
  the published-version ref + reused lineage-backed element shapes), no autonomous or
  unreviewed graph write, no server-side layout / cache, and additive-only change
  that does not alter MVP1–MVP6.11 paths, enums, or smokes. MVP6.12 keeps the
  all-false mutation-guard posture; it turns **no** mutation flag true.
</content>
</invoke>
