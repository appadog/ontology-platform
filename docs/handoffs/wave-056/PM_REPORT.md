# PM Report - Wave 56

Role: PM / Architect — MVP6.12 Advanced Visualization THIN IMPLEMENTATION scope guard + gate freeze (FINAL MVP6 theme)
Status: `PASS` — G1/G3 frozen, G2/G5 confirmed, G12 ratified, fixture matrix (READY/TOO_LARGE/EMPTY) frozen, scope unchanged. BE/FE unblocked.
Date: 2026-07-13

## 담당 범위
- backlog ID: `PM6-038` (this freeze). Records impl IDs `BE6-088`..`BE6-091`, `FE6-105`..`FE6-108`, `INT6-103`..`INT6-106`.
- 작업 경로: `docs/handoffs/wave-056/PM_REPORT.md`, `docs/pm/MVP6_12_ADVANCED_VIZ_BRIEF.md` (§11 refine + §11.1/§11.2 fixture matrix), `docs/backlog/MVP6_DRAFT_BACKLOG.md` (Wave56 section + status).
- My job runs FIRST and BLOCKS Backend/Frontend. NO-MUTATION / no-layout-persist is the headline invariant; `published_graph_mutated` + `layout_persisted` are the hardest assertions.

## 완료한 작업
Froze the open Wave56 gates as single deterministic implementable rules, confirmed
the FE/QA-flagged residuals, ratified the G12 Korean copy, froze a concrete
published-graph fixture matrix (READY / TOO_LARGE_SUMMARY_ONLY / EMPTY) with exact
sizes + exact READY summary values, and confirmed scope is unchanged from the Wave55
freeze (ADR 0019 + brief + `openapi-mvp6-12-draft.json`). **No contract shape change**:
the OpenAPI (`0.6.12-draft`, 1 path / 1 operation / 12 schemas / 2 enums + all-false
6-flag `GraphVizMutationGuard`) is implemented EXACTLY as drafted. Verified in the
draft that `GraphVizNode` carries `degree`+`component_id` and NO `hop`, NO x/y (G5).

### G1 — filter hints in P0 (FROZEN)
> `GET /graph-viz` accepts optional read-only `class_ids` / `relation_ids` query
> params in P0. **Induced element-view only:** with `class_ids` non-empty a node is in
> `nodes[]` iff its `class_id` ∈ `class_ids`; with `relation_ids` non-empty an edge is
> in `edges[]` iff its `relation_id` ∈ `relation_ids` **AND both endpoint nodes are
> included**; an omitted/empty filter imposes no restriction on that dimension.
> `GraphVizSummary`, `status`, `truncated`, and each node's `degree`/`component_id`
> hints are ALWAYS over the FULL, UNFILTERED graph — filters never change them.
> Filters do NOT rescue a `TOO_LARGE_SUMMARY_ONLY` graph (status is set by full-graph
> totals vs caps → elements stay empty regardless of filters in P0).

### G2 — no-current-version → 200 EMPTY (CONFIRMED)
> No current published version and none requested → **`200 EMPTY`** (not 404): zeroed
> `GraphVizSummary`, empty `nodes[]`/`edges[]`, `too_large:null`, `truncated:false`,
> `published_graph_version_ref` may be null, all-false 6-flag guard. An
> explicitly-requested unknown `version_id` → `404 PUBLISHED_GRAPH_VERSION_NOT_FOUND`.

### G3 — stat formulas (FROZEN, deterministic; single O(V+E) pass)
> `density` = `E / (V*(V-1))` for `V>1`, else `0` (directed convention, no ×2).
> `component_count` / `largest_component_size` = connected components over the
> **UNDIRECTED** projection of edges (each edge bidirectional; an isolated node = its
> own component of size 1). `isolated_node_count` = nodes with undirected total
> degree 0. `max_degree` = max undirected total degree (count of incident edges;
> multi-edges per edge; no self-loops in the published graph). Counts + union-find
> only; no centrality / clustering / path-finding.

### G5 — `hop` OMITTED on whole-graph nodes (CONFIRMED)
> `GraphVizNode` OMITS the MVP4 root-anchored `hop` (dropped — not nullable/sentinel;
> verified absent in `openapi-mvp6-12-draft.json`). It carries `degree` +
> `component_id` layout hints and NO x/y. Runtime emits no `hop` on `GraphVizNode`.

### G12 — Korean copy (RATIFIED)
> LNB label `Published Graph` UNCHANGED (no new item); page H1 `게시 그래프 탐색기`
> unchanged; sub-view toggle `탐색기` (Explorer) / `시각화 · 요약` (Visualization·Summary).
> Status glosses: `READY · 준비됨`, `TOO_LARGE_SUMMARY_ONLY · 너무 큼 · 요약만`,
> `EMPTY · 데이터 없음`; scope `PUBLISHED · 게시 전용`; boundary chips
> `READ_ONLY · 읽기 전용`, `NOTHING_CHANGES · 변경 없음`, `NO_PUBLISH · 게시 없음`,
> `NO_LAYOUT_SAVED · 레이아웃 저장 없음`, `PUBLISHED_ONLY · 게시 전용`. Banner + EMPTY
> (`게시된 그래프가 아직 없습니다 — 먼저 버전을 게시하세요.`) + too-large
> (`그래프가 너무 커서 전체를 그릴 수 없습니다 — 요약 통계만 표시합니다. 필터로 범위를 좁혀 보세요.`)
> copy per FE UX requirements §2.1/§2.4/§3 ratified as-is.

## Fixture matrix (FROZEN — BE builds exactly this; FE/QA test against it)

Process-local published-graph fixtures keyed by `project_id`, re-seeded by
`reset_runtime_store()` (MVP6.11 packs / MVP6.7 impact precedent). Default caps
`node_cap=150`, `edge_cap=300`.

| project / version | size | status | key values |
|---|---|---|---|
| `proj-viz-demo` / `pgv-viz-demo-v1` | 12 nodes / 9 edges (within caps) | **READY** | exact summary below; full bounded `nodes[]`/`edges[]`; `truncated:false`; `too_large:null` |
| `proj-viz-large` / `pgv-viz-large-v1` | 210 nodes / 480 edges (over 150/300) | **TOO_LARGE_SUMMARY_ONLY** | `total_node_count:210`, `total_edge_count:480`; `nodes[]`/`edges[]` EMPTY; `truncated:true`; `too_large={estimated_nodes:210,estimated_edges:480,node_budget:150,edge_budget:300,suggested_filters[],message}`; summary EXACT over full 210/480 |
| `proj-viz-empty` / — (no current published version) | 0 | **EMPTY (200)** | zeroed summary (all `0`, `density:0`); empty elements; `too_large:null`; `truncated:false`; ref may be null |

Authz/transport: unknown project → `404 PROJECT_NOT_FOUND`; `proj-viz-demo` + unknown
`version_id` → `404 PUBLISHED_GRAPH_VERSION_NOT_FOUND`; non-member → `403
PERMISSION_DENIED`; `node_cap`∉[1,150] / `edge_cap`∉[1,300] → `400 INVALID_CAP`.

**`proj-viz-demo` READY exact graph** — Nodes(12): person={n1..n5}(5), org={n6,n7,n8,n9}(4),
doc={n10,n11,n12}(3). Edges(9, directed): employs(org→person) n6→n1,n6→n2,n7→n3,n8→n4(4);
authored(person→doc) n1→n10,n2→n11,n3→n12(3); partner(org→org) n6→n7,n8→n9(2).
Derived summary (exact): `total_node_count`=12, `total_edge_count`=9; by-class person5/org4/doc3;
by-relation employs4/authored3/partner2; `density`=9/132=**0.068**; undirected components
A{n6,n1,n2,n7,n3,n10,n11,n12}=8, B{n8,n4,n9}=3, C{n5}=1 → `component_count`=**3**,
`largest_component_size`=**8**, `isolated_node_count`=**1** (n5), `max_degree`=**3** (n6).
Ordering: `nodes[]` by `published_entity_id` asc; `edges[]` by
`(source_node_id,target_node_id,published_relation_id)` asc; buckets by id asc. Byte-stable modulo `generated_at`.

## Scope confirmation (UNCHANGED from ADR 0019 / Wave55 freeze)
- **Read-only viz data + summary only.** Exactly 1 endpoint (`GET
  /api/v1/projects/{project_id}/graph-viz`); compute-on-read, no `viz_id`/GET-by-id/list.
  No graph mutation (published/candidate/draft), no publish, no `PublishedGraphVersion`/
  `PublishedGraphSnapshot`/entity/relation creation.
- **Published-only in P0.** `GraphVizScope=PUBLISHED` single literal; `CANDIDATE`
  reserved, never produced.
- **No server-side layout, no layout persistence/cache.** Layout HINTS only
  (`degree`/`component_id`); no x/y computed server-side; nothing stored/cached.
- **All-false 6-flag `GraphVizMutationGuard`** on every response: `published_graph_mutated`,
  `candidate_graph_mutated`, `ontology_draft_mutated`, `published_version_created`,
  `graph_snapshot_created`, `layout_persisted` — all false. Headline:
  `published_graph_mutated` + `layout_persisted`. MVP6.12 turns NO flag true, ever.
- **Additive; reuse by reference; no renames.** No MVP1–MVP6.11 path/enum/smoke break.
  Reuse MVP3 published-graph shapes, MVP4 `GraphExploreNode`/`GraphExploreEdge`/
  `GraphTooLargeState`/`PublishedGraphVersionRef`/`GraphExploreState`, MVP1
  `class_id`/`relation_id`, MVP5 `Role`. Focus/neighborhood = existing MVP4 explore
  endpoint (root+hops), NOT re-implemented. Authz: any project viewer; `400`/`403`/`404`.

## Acceptance gates BE/FE/QA must hit (NO-MUTATION + no-layout-persist headline)
- **BE6-088..091**: 1 endpoint matches `openapi-mvp6-12-draft.json` EXACTLY; new
  `apps/backend/app/modules/graph_viz/` (additive router) + process-local fixtures
  (the matrix VERBATIM) + `reset_runtime_store()`; `GraphVizSummary` exact over FULL
  graph in one O(V+E) pass (G3 formulas); bounded view caps 150/300 + `truncated` +
  exact totals + layout hints `degree`/`component_id` (no x/y, no `hop` — G5); over-cap
  → `TOO_LARGE_SUMMARY_ONLY` (empty elements); no version → `200 EMPTY` (G2); G1 filter
  hints (induced element-view only, summary always full graph); all-false 6-flag guard
  on every response; DATA-LEVEL before==after (module imports no publish/version-write/
  candidate/ontology/layout-persist path); runtime OpenAPI 0-mismatch; MVP6.11
  regression; ruff; `git diff --check`.
- **FE6-105..108**: `시각화 · 요약` sub-view on Published Graph (toggle `탐색기`|`시각화 ·
  요약`; NO new LNB item; single active LNB preserved; H1 unchanged); always-shown exact
  summary panel; READY client-side layout from hints (no server x/y); read-only
  class/relation filters (never change summary numbers); `TOO_LARGE_SUMMARY_ONLY`
  (summary + notice, zero fabricated nodes); `EMPTY` (zeroed summary + publish-first);
  persistent read-only banner + live all-false 6-flag guard proof read from the
  response; D6 status badges; loading/empty/error/permission; types/client/mocks match
  frozen OpenAPI EXACTLY; `smoke:mvp6:graphviz:mock` (+ `:actual`); `test`/`build`; 0-overflow.
- **INT6-103..106**: validate endpoint + summary exactness (G3, against `proj-viz-demo`
  values) + bounded view/layout hints (no x/y/hop) + `TOO_LARGE_SUMMARY_ONLY` empty
  elements + `EMPTY` no-version + filter hints + authz `400`/`403`/`404`; INDEPENDENTLY
  (own script) verify at the DATA level that the viz call creates/mutates NOTHING (all
  tables before==after; no version/snapshot created) and the 6-flag guard is all-false;
  FE mock + actual (boot backend on SQLite); MVP6.11/earlier regression + touched
  smokes; additive-only + candidate/published separation + single active LNB; note
  MVP6.12 closeout completes the user-directed MVP6 sequence (6.1–6.12); no leftover
  listeners on 8000/5173.

## 변경 파일
- `docs/handoffs/wave-056/PM_REPORT.md` (this file, new).
- `docs/pm/MVP6_12_ADVANCED_VIZ_BRIEF.md` (§11 gates marked FROZEN/CONFIRMED/RATIFIED; new §11.1 fixture matrix + §11.2 READY exact graph; status line; no contract shape change).
- `docs/backlog/MVP6_DRAFT_BACKLOG.md` (Wave56 section: `PM6-038` + `BE6-088`..`091`, `FE6-105`..`108`, `INT6-103`..`106`; status line updated).

## 실행/검증
- 실행한 명령: `python3` inspect of `docs/api/openapi-mvp6-12-draft.json` (confirmed `GraphVizNode` has `degree`+`component_id`, NO `hop`, NO x/y; 6-flag guard; enums); `git diff --check`.
- 결과: OpenAPI confirms the frozen shapes (G5 verified: `hop` absent). `git diff --check` → CHECK_OK (docs-only; no whitespace/conflict errors).
- 실행하지 못한 검증: none applicable (planning/freeze role; no `apps/` code written).

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세: G1/G3 freeze + G2/G5 confirm + G12 ratify introduce NO contract shape change.
  `GraphVizStatus`/`GraphVizScope`, the 6-flag `GraphVizMutationGuard`,
  `GraphVizResponse`/`GraphVizSummary`/`GraphVizNode`/`GraphVizEdge`/
  `GraphVizTooLargeState` are exactly as in `openapi-mvp6-12-draft.json`. Filter
  semantics, stat formulas, and the fixture matrix are deterministic behavioral
  refinements permitted by the drafted schema.
- 영향받는 역할: BE (implement exactly + build the fixture matrix VERBATIM), FE (mirror
  types/client/mocks; render summary/status/guard; sub-view toggle), QA (assert matrix
  + data-level no-mutation + all-false guard).

## Blocker
- 없음. BE ∥ FE unblocked.

## 남은 TODO
- BE: `apps/backend/app/modules/graph_viz/` (1 endpoint + matrix fixtures +
  `reset_runtime_store()`); `tests/test_mvp6_12_graph_viz_api.py`; runtime OpenAPI compare.
- FE: `시각화 · 요약` sub-view + summary panel + client-side layout + too-large/EMPTY +
  guard proof; `smoke:mvp6:graphviz:mock` (+ `:actual`).
- QA: R1–R9 verdicts in `INT6_12_ADVANCED_VIZ_ACCEPTANCE.md`; data-level creates-nothing
  + all-false guard proof; note MVP6 sequence complete.

## 다른 역할에 전달할 내용
- **Backend:** build the fixture matrix VERBATIM (`proj-viz-demo` 12n/9e READY with the
  exact §11.2 summary — density 0.068, components 3, largest 8, isolated 1, max_degree 3;
  `proj-viz-large` 210n/480e TOO_LARGE_SUMMARY_ONLY empty-elements; `proj-viz-empty`
  no-version 200 EMPTY). G3 formulas EXACT (directed density, undirected
  components/degree). G1 filters bound the element view only (induced; both endpoints
  in), summary/status/hints always full graph. `hop` OMITTED (G5); no x/y. Every
  response all-false 6-flag guard; DATA-LEVEL before==after; import no publish/version/
  candidate/ontology/layout-persist path. Match `openapi-mvp6-12-draft.json` EXACTLY.
- **Frontend:** `시각화 · 요약` sub-view on Published Graph, NO new LNB item, H1
  unchanged, toggle `탐색기`|`시각화 · 요약`. Summary panel always shown + exact in every
  status; density 3-dp; a filtered element view NEVER changes the summary numbers.
  READY layout is CLIENT-SIDE from `degree`/`component_id`/`class_id` (response has no
  x/y); too-large shows summary only (zero fabricated nodes); EMPTY shows zeroed
  summary + publish-first. Live all-false 6-flag guard read from the response (not
  hardcoded). NO save-layout/apply/publish/snapshot/export CTA. Reconcile FE §8 against
  the landed OpenAPI (only G12 was open — now ratified).
- **QA:** headline gate = creates-nothing + no-layout-persist + all-false 6-flag guard
  at the DATA level (own script, before==after across published/candidate/ontology/
  version/snapshot). Recompute summary against `proj-viz-demo` §11.2 exact values;
  assert TOO_LARGE empty-elements + exact totals; EMPTY no-version 200; layout hints
  present, NO x/y/hop; byte-stable modulo `generated_at`; `400`/`403`/`404` per the
  matrix. Note MVP6.12 closeout completes the MVP6 theme sequence (6.1–6.12).
- **PM:** none.

## 총괄에게 요청하는 결정
- None required. One judgment call flagged for your awareness, defensible and
  reversible: **G1** — in P0 a `TOO_LARGE_SUMMARY_ONLY` graph stays summary-only even
  when a filter would bring it under cap (status is decided by full-graph totals, and
  the summary is always over the full graph). This keeps the surface deterministic and
  honest (filters bound the *element view*, not the *status*); a filter-aware re-render
  that unlocks elements for a narrowed subgraph is a clean P1 refinement. If you prefer
  filters to re-evaluate the cap in P0, say so and I'll re-freeze G1.

## 현재 판정
- `PASS` — G1/G3 frozen, G2/G5 confirmed, G12 ratified, fixture matrix (READY/
  TOO_LARGE_SUMMARY_ONLY/EMPTY) frozen, scope unchanged, IDs recorded. Backend ∥
  Frontend may proceed. FINAL MVP6 theme.
