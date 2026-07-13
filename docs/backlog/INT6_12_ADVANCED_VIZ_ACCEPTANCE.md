# INT6.12 MVP6.12 Advanced Visualization Acceptance Checklist

Status: `WAVE56 QA RUNTIME — PASS (C-series PASS; R1–R9 PASS). MVP6.12 thin closeout — completes the MVP6 sequence (6.1–6.12).`
Date: 2026-07-13
Owner: QA / Integration
Backlog: `INT6-102`..`INT6-105` (Wave55 planning; continues INT6 numbering — INT6-* used through INT6-101 in Wave54)

Wave55 verdict: **PASS (planning)** — PM brief + ADR 0019, Backend contract +
`openapi-mvp6-12-draft.json`, and Frontend UX requirements agree on the single
read-only, whole-graph **viz data + summary-stats** surface over a project's
**PUBLISHED** graph; the deterministic bounded + `TOO_LARGE_SUMMARY_ONLY` fallback;
the read-only / no-mutation / no-layout-persist / no-server-layout / published-only
boundary; the all-false **6-flag** `GraphVizMutationGuard`; and reuse-by-reference of
MVP3/MVP4/MVP1/MVP5 shapes (no renames). OpenAPI parses (3.1.0, `0.6.12-draft`, **1**
path / **1** operation / **12** schemas), additive/disjoint. No MVP6.12 runtime leaked
(`apps/`+`infra/`). This is the FINAL MVP6 theme. R-series NOT RUNNABLE by design until
Wave56.

> **QA ID note.** `INT6-*` used through `INT6-101` (Wave54). This theme uses
> **`INT6-102`~`INT6-105`**. PM allocated `INT6-102`; the checklist expands to a small
> range for the C/R gate families (mirrors the INT6.11 precedent).

## Source Documents
- Wave order: `docs/handoffs/wave-055/NEXT_ORDERS.md`
- Reports: `docs/handoffs/wave-055/{PM,BACKEND,FRONTEND}_REPORT.md`
- PM brief: `docs/pm/MVP6_12_ADVANCED_VIZ_BRIEF.md`
- ADR: `docs/adr/0019-mvp6-12-advanced-viz-read-only-bounded-published-graph-summary-too-large-summary-only-no-mutation-no-layout-persist-boundary.md`
- API: `docs/api/MVP6_12_ADVANCED_VIZ_API_CONTRACT_DRAFT.md` + `docs/api/openapi-mvp6-12-draft.json`
- Frontend requirements: `docs/pm/MVP6_12_FRONTEND_UX_REQUIREMENTS.md`

## Verdict Semantics
- `PASS`: artifacts agree and preserve the read-only / no-mutation / no-layout-persist boundary.
- `PARTIAL`: usable but named fields/enums/rules need targeted hardening.
- `FAIL`: opens any graph mutation, publish, version/snapshot creation, candidate viz, server-side layout, or layout persistence.
- `NOT RUNNABLE`: expected for runtime checks before Wave56.

## C-Series — Planning Gates (Wave55)
| ID | Gate | Verdict |
|---|---|---|
| C1 | **1 endpoint** present: `GET /api/v1/projects/{project_id}/graph-viz` (compute-on-read; published graph; no `viz_id`/GET-by-id/list); optional query `version_id`/`node_cap [1,150]`/`edge_cap [1,300]`/`class_ids`/`relation_ids` | PASS |
| C2 | **2 enums** verbatim: `GraphVizStatus` (READY / TOO_LARGE_SUMMARY_ONLY / EMPTY; no ERROR result state) + `GraphVizScope` (PUBLISHED produced; CANDIDATE reserved, never produced in P0) | PASS |
| C3 | Read-only + no-mutation boundary: reads already-published facts only; no graph mutation (published/candidate/draft), no publish, no `PublishedGraphVersion`/`PublishedGraphSnapshot`/entity/relation creation; no server-side layout; no layout persistence/cache | PASS |
| C4 | All-false **6-flag** `GraphVizMutationGuard` on every response: `published_graph_mutated`, `candidate_graph_mutated`, `ontology_draft_mutated`, `published_version_created`, `graph_snapshot_created`, `layout_persisted` — all `const:false` + required; headline `published_graph_mutated` + `layout_persisted` | PASS |
| C5 | `GraphVizSummary` present + **exact in every status** (READY / TOO_LARGE_SUMMARY_ONLY / EMPTY): `total_node_count`, `total_edge_count`, `node_counts_by_class[]` {class_id,count}, `edge_counts_by_relation[]` {relation_id,count}, `density`, `component_count`, `largest_component_size`, `isolated_node_count`, `max_degree`; single O(V+E) pass (counts + union-find), no centrality/clustering/path-finding | PASS |
| C6 | Bounded whole-graph view: caps 150/300 (overridable in range) + `truncated` + exact totals; layout **HINTS only** on `GraphVizNode` (`degree`, `component_id`) — **NO server x/y**; deterministic ordering, byte-stable modulo `generated_at` | PASS |
| C7 | `TOO_LARGE_SUMMARY_ONLY` fallback: over-cap → `nodes[]`/`edges[]` **empty**, `truncated:true`, `summary` still exact over the **full** graph, `too_large` populated (`GraphVizTooLargeState` reused verbatim: estimated_nodes/edges, node/edge_budget, suggested_filters, message); **zero fabricated elements**; mirrors MVP4 `SAFE_TOO_LARGE` | PASS |
| C8 | No-published-version → **200 EMPTY** (zeroed summary, empty elements, `too_large:null`, ref may be null) — a result state, not a 4xx (G2) | PASS |
| C9 | Authz/transport: any project viewer (read-only, no elevated role, reuse MVP5 `Role`); `400 INVALID_CAP`, `403 PERMISSION_DENIED`, `404 PROJECT_NOT_FOUND`, `404 PUBLISHED_GRAPH_VERSION_NOT_FOUND` | PASS |
| C10 | Reuse **by reference, no renames**: MVP3 `PublishedEntity`/`PublishedRelation`/`PublishedGraphVersion`/`PublishedGraphSnapshot`; MVP4 `GraphExploreNode`/`GraphExploreEdge`/`GraphTooLargeState`/`PublishedGraphVersionRef` (`GraphExploreState` = structural precedent for `GraphVizStatus`); MVP1 `class_id`/`relation_id`; MVP5 `Role`. Focus/neighborhood = existing MVP4 explore endpoint (root+hops), NOT re-implemented | PASS |
| C11 | **G5 residual — `hop` disposition:** `GraphVizNode` reuses MVP4 `GraphExploreNode` whose `hop` is root-anchored + meaningless for a whole-graph view. Backend draft **OMITS `hop`** from `GraphVizNode` (dropped, not nullable/sentinel); verified in OpenAPI (`hop` absent; `degree`+`component_id` present; no x/y). Residual **RESOLVED** | PASS |
| C12 | OpenAPI parses (3.1.0, `0.6.12-draft`, **1** path / **1** operation / **12** schemas: GraphVizStatus, GraphVizScope, GraphVizMutationGuard, PublishedGraphVersionRef, GraphVizClassCount, GraphVizRelationCount, GraphVizSummary, GraphVizNode, GraphVizEdge, GraphVizTooLargeState, GraphVizResponse, ApiError); additive/disjoint to MVP1–MVP6.11 (redefines no prior path); 3 examples (ready/tooLargeSummaryOnly/empty) | PASS |
| C13 | Durable invariants: candidate/published separation (viz reads published only; `candidate_graph_mutated`+`published_graph_mutated` always false); evidence/version traceability (`published_graph_version_ref` + reused lineage-backed shapes); additive-only, no MVP1–MVP6.11 rename/break; no server-side layout/cache; no publish | PASS |

## FE §8 Reconciliation vs the landed Backend draft (FE ran BEFORE the BE draft)
The FE `§8` was a forward need-list (Backend draft not yet present when FE ran). Now
reconciled field-by-field against `openapi-mvp6-12-draft.json` + the BE contract draft:

| FE gap | Resolution in the Backend draft | Status |
|---|---|---|
| G1 filter hints P0/P1 | `class_ids`/`relation_ids` accepted as **optional** query params in P0 (summary always over full graph); removable without shape change | RESOLVED (P0, Wave56-confirm) |
| G2 `version_id` + no-current-version | optional `version_id`; explicit unknown → `404 PUBLISHED_GRAPH_VERSION_NOT_FOUND`; none requested + none current → **200 EMPTY** | RESOLVED |
| G3 density/component defs | directed `density = E/(V*(V-1))` (`0` for `V<=1`); `component_count`/`largest_component_size`/`max_degree` over the **undirected** projection | RESOLVED |
| G4 LNB/IA placement | contextual sub-view of Published Graph, no new LNB item (commander IA ruling) | RATIFIED |
| **G5 `hop` on reused element shape** | **`hop` OMITTED from `GraphVizNode`** (dropped, not root-anchored); `degree`+`component_id` present instead; verified `hop` absent in OpenAPI | **RESOLVED (residual: none)** |
| G6 hints present, coords absent | `degree`+`component_id` required on `GraphVizNode`; **no x/y** field emitted | RESOLVED |
| G7 `generated_at` | present + required on `GraphVizResponse`; the only non-byte-stable field | RESOLVED |
| G8 guard exactly 6 flags | 6 flags, all `const:false`, all required, on every response | RESOLVED |
| G9 result-vs-transport-error split | `EMPTY`/`TOO_LARGE_SUMMARY_ONLY` = 200 result states; `400`/`403`/`404` transport | RESOLVED |
| G10 summary exact in too-large | `summary` required in every status (incl. `TOO_LARGE_SUMMARY_ONLY`), computed over full graph | RESOLVED |
| G11 caps echoed + `truncated` | `node_cap`/`edge_cap`/`truncated` required + echoed; `truncated:true` ⇔ too-large | RESOLVED |
| G12 KO sub-view labels + glosses | PM/commander copy confirm (not a Backend field) | OPEN (copy confirm) |

**FE §8 reconciliation: COMPLETE. No residual DTO/enum gap. G5 fully resolved (`hop` omitted).**
Only G12 (Korean sub-view labels/glosses) remains — a PM/commander copy confirm, not a contract gap.

## Wave56 Gates (freeze at implementation)
- **G1** — filter hints `class_ids`/`relation_ids` in **P0** (element-set bounding only; summary ALWAYS over the full graph). *Commander-accepted.*
- **G2** — no-current-version → **200 EMPTY** (not 404). *Commander-accepted.*
- **G3** — directed `density = E/(V*(V-1))` / **undirected** `component_count`/`largest_component_size`/`max_degree`. *Commander-accepted.*
- **G4** — **COMMANDER IA RULING (recorded):** the viz summary/whole-graph panel is a **contextual sub-view of the existing Publish-group Published Graph surface** (ADR 0010; route `/projects/:p/published-graph`, in-screen `Explorer | Visualization · Summary` toggle) — **no new LNB item**, single-active-LNB invariant preserved. NOT a new Analyze item; NOT a new global item.
- **G5** — **`hop`-field disposition for whole-graph nodes = OMITTED (dropped).** `GraphVizNode` does not carry the MVP4 root-anchored `hop`; it carries `degree`+`component_id` layout hints. Runtime must emit NO `hop` on `GraphVizNode`. *Resolved in the BE draft; freeze at impl.*
- **G12** (copy) — Korean sub-view labels (`탐색기` / `시각화 · 요약`) + `GraphVizStatus`/boundary-chip glosses; LNB label unchanged. PM/commander confirm.

## R-Series — Runtime Gates (Wave56 — commander-verified after agent session-limit interruptions)
Evidence in `docs/handoffs/wave-056/{BACKEND,FRONTEND,QA}_REPORT.md`. Backend 276 passed
(viz 22) + ruff clean + OpenAPI aligned; FE 116 passed + build + `smoke:mvp6:graphviz:mock` PASS.
| ID | Runtime gate | Status |
|---|---|---|
| R1 | `GET /projects/{id}/graph-viz` returns `READY` for an in-budget published graph: full bounded `nodes[]`/`edges[]` + full `summary`; `truncated:false`; `too_large:null`; deterministic/byte-stable modulo `generated_at` | PASS — `test_ready_summary_exact` + `test_ready_byte_stable_modulo_generated_at` |
| R2 | **NO-MUTATION headline gate:** `GraphVizMutationGuard` all 6 flags `false` on EVERY response (incl. errors carry no guard); **data-level before==after** — no published/candidate/ontology/version/snapshot row created/updated/deleted after a viz read; `published_graph_mutated`+`layout_persisted` false | PASS — `test_data_level_no_mutation` + `test_guard_all_false_on_every_response` + `test_error_envelopes_carry_no_guard` |
| R3 | `GraphVizSummary` counts **exact** (`total_node_count`/`total_edge_count`/by-class/by-relation/density/components/isolated/max_degree) and exact in EVERY status incl. `TOO_LARGE_SUMMARY_ONLY`; density directed, components undirected (G3); byte-stable modulo `generated_at` | PASS — `test_ready_summary_exact` + `test_too_large_summary_only` |
| R4 | Bounding: over-cap → `TOO_LARGE_SUMMARY_ONLY` with **empty** `nodes[]`/`edges[]`, `truncated:true`, exact totals vs budgets, `too_large` populated, **zero fabricated elements**; in-budget → READY cap-bounded; invalid cap → `400 INVALID_CAP` | PASS — `test_too_large_summary_only` + `test_too_large_filters_do_not_rescue` + `test_ready_becomes_too_large_when_cap_lowered` + `test_invalid_cap_400` |
| R5 | Layout hints present but **NO coordinates**: every `GraphVizNode` has `degree`+`component_id`, no x/y, **no `hop`** (G5); FE computes layout client-side | PASS — `test_ready_bounded_view_layout_hints_no_xy_no_hop` + `test_openapi_node_has_hints_no_hop_no_xy` |
| R6 | `EMPTY`: no current published version (none requested) → `200 EMPTY` zeroed summary + empty elements; explicit unknown version → `404 PUBLISHED_GRAPH_VERSION_NOT_FOUND` (G2 split) | PASS — `test_empty_no_version_200` + `test_unknown_version_404` + `test_known_version_id_targets_graph` |
| R7 | Authz: any project viewer previews; non-member → `403 PERMISSION_DENIED`; unknown project → `404 PROJECT_NOT_FOUND` | PASS — `test_non_member_403` + `test_unknown_project_404` |
| R8 | Frontend viz sub-view of Published Graph (no new LNB item; single active LNB preserved): summary panel (always) + READY whole-graph client-side layout + `TOO_LARGE_SUMMARY_ONLY` summary-only notice + `EMPTY` state + read-only filters + focus (reuse MVP4 explore) + boundary banner + live all-false 6-flag guard proof line; NO save-layout/apply/publish/snapshot/export CTA; mock + actual smoke | PASS — FE 116 tests (incl. `mvp6GraphVizMock.test.ts` 8/8) + build + `smoke:mvp6:graphviz:mock` PASS (asserts H1 unchanged, single active LNB on both sub-views, banner/chips, 6-flag proof, exact summary, client-side render, no forbidden CTAs). `:actual` script ready; not booted this session (P3). |
| R9 | MVP1–MVP6.11 regression, additive-only, no renames of reused shapes (`GraphExploreNode`/`GraphExploreEdge`/`GraphTooLargeState`/`PublishedGraphVersionRef`/`GraphExploreState`); backend suite + FE tests/build + prior smokes green | PASS — backend 276 + FE 116/build; packs 25 regression; additive; only `GraphVizPublishedVersionRef` name-scoping (JSON unchanged) |

R-Series OVERALL: **PASS.** MVP6.12 thin closeout recommended — **completes the MVP6 theme sequence (6.1–6.12).**

## Validation (Wave55)
```text
python3 -m json.tool docs/api/openapi-mvp6-12-draft.json >/dev/null && echo PARSE_OK
# PARSE_OK  (3.1.0, 0.6.12-draft, 1 path / 1 operation / 12 schemas;
#            GraphVizStatus[READY,TOO_LARGE_SUMMARY_ONLY,EMPTY];
#            GraphVizScope[PUBLISHED,CANDIDATE(reserved)];
#            GraphVizMutationGuard 6 flags all const:false + required;
#            GraphVizTooLargeState present; GraphVizNode has no hop, no x/y, has degree+component_id;
#            summary required in every status; 200 examples ready/tooLargeSummaryOnly/empty)

rg -n 'graph-viz|GraphViz|GraphVizMutationGuard|mvp6.12' apps infra --glob '!**/node_modules/**'
# (no matches; exit 1) — NO_RUNTIME_LEAK

git diff --check
# clean
```

## Recommendation
Open **Wave56 MVP6.12 thin implementation** (the single read-only `GET
/projects/{project_id}/graph-viz` whole-graph viz data + summary-stats endpoint + the
Published-Graph viz sub-view). PM freezes G1/G2/G3 (all commander-accepted as drafted),
ratifies G4 (contextual sub-view, no new LNB item), confirms G5 (`hop` omitted) and G12
(Korean copy). QA independently verifies R1–R9 with the **no-mutation** headline gate
(all-false 6-flag guard + data-level before==after) + summary-exact + over-cap
`TOO_LARGE_SUMMARY_ONLY` empty-elements + layout-hints-no-coordinates + `EMPTY`
no-version. No contract-hardening or redesign wave is required — the planning artifacts
are contract-clean and the FE §8 gaps (incl. G5) are fully resolved by the Backend
draft. This is the FINAL MVP6 theme.
