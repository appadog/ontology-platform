# Backend Report - Wave 55

## 담당 범위
- backlog ID: `BE6-086`~`BE6-087`
- 역할: Backend — MVP6.12 Advanced Visualization contract draft (CONTRACT-FIRST
  PLANNING ONLY; no runtime code/models/migrations/tests). `apps/`/`infra/` 미변경.
- 작업 경로: `docs/api/MVP6_12_ADVANCED_VIZ_API_CONTRACT_DRAFT.md`,
  `docs/api/openapi-mvp6-12-draft.json`, this report.
- Freeze source: `docs/pm/MVP6_12_ADVANCED_VIZ_BRIEF.md` (PM6-037), ADR 0019,
  `docs/handoffs/wave-055/{NEXT_ORDERS,PM_REPORT}.md`.

## 완료한 작업
- Drafted the single additive read-only endpoint
  `GET /api/v1/projects/{project_id}/graph-viz` (compute-on-read; published graph;
  no viz_id/GET-by-id/list) with query params `version_id`, `node_cap [1,150]`,
  `edge_cap [1,300]`, and G1 filter hints `class_ids`/`relation_ids`.
- Froze enums exactly per PM: `GraphVizStatus` (READY / TOO_LARGE_SUMMARY_ONLY /
  EMPTY) and `GraphVizScope` (PUBLISHED produced; CANDIDATE reserved, never produced).
- Froze the response model: `GraphVizResponse` + `GraphVizSummary` (single O(V+E)
  pass: node_counts_by_class, edge_counts_by_relation, density, component_count,
  largest_component_size, isolated_node_count, max_degree — exact in every status) +
  bounded `GraphVizNode`/`GraphVizEdge` (reuse MVP4 element fields by reference,
  added layout HINTS `degree`/`component_id`, NO x/y, dropped MVP4 `hop`) +
  `GraphVizTooLargeState` (reuse MVP4 `GraphTooLargeState` verbatim) + all-false
  6-flag `GraphVizMutationGuard`.
- Froze the bounding rule / too-large fallback mirroring MVP4 `SAFE_TOO_LARGE`: caps
  150/300 + `truncated` + exact totals; over-cap → `TOO_LARGE_SUMMARY_ONLY` (summary
  over full graph, elements empty); no current published version → `200 EMPTY`.
- Froze transport: `400 INVALID_CAP`, `403 PERMISSION_DENIED`,
  `404 PROJECT_NOT_FOUND`, `404 PUBLISHED_GRAPH_VERSION_NOT_FOUND`. Authz = any
  viewing project member (reuse MVP5 `Role`, no new literal).
- Produced `openapi-mvp6-12-draft.json` (3.1.0, `0.6.12-draft`) with 3 examples
  (READY / TOO_LARGE_SUMMARY_ONLY / EMPTY). Recorded G1–G4 as open questions.

## 변경 파일
- `docs/api/MVP6_12_ADVANCED_VIZ_API_CONTRACT_DRAFT.md` (new)
- `docs/api/openapi-mvp6-12-draft.json` (new)
- `docs/handoffs/wave-055/BACKEND_REPORT.md` (this)

## 실행/검증
- `python3 -m json.tool docs/api/openapi-mvp6-12-draft.json > /dev/null` → **PARSE_OK**.
- Path/schema counts: `openapi 3.1.0`, `version 0.6.12-draft`, **paths 1**,
  **operations 1**, **schemas 12**, params 6, responses 3, examples 3.
  Schemas: GraphVizStatus, GraphVizScope, GraphVizMutationGuard,
  PublishedGraphVersionRef, GraphVizClassCount, GraphVizRelationCount,
  GraphVizSummary, GraphVizNode, GraphVizEdge, GraphVizTooLargeState,
  GraphVizResponse, ApiError.
- `git diff --check` → clean. Runtime-leak scan (`apps/`+`infra/`) → **NO_RUNTIME_LEAK**.
- Disjoint-additive to MVP1–MVP6.11: 1 new path, redefines no prior OpenAPI path.

## API/Enum/DTO 변경 (planning only — no runtime)
- 변경 여부: 있음 (planning-only additive; for Wave56 runtime).
- Endpoint: `GET /api/v1/projects/{project_id}/graph-viz`.
- Enums: `GraphVizStatus` (READY/TOO_LARGE_SUMMARY_ONLY/EMPTY), `GraphVizScope`
  (PUBLISHED; CANDIDATE reserved).
- DTOs: `GraphVizResponse`, `GraphVizSummary`, `GraphVizNode`, `GraphVizEdge`,
  `GraphVizTooLargeState`, `GraphVizMutationGuard` (+ `GraphVizClassCount`/
  `GraphVizRelationCount` summary-bucket helpers, `ApiError`).
- Reuse by reference (no rename): MVP3 `PublishedEntity`/`PublishedRelation`/
  `PublishedGraphVersion`/`PublishedGraphSnapshot`; MVP4 `GraphExploreNode`/
  `GraphExploreEdge`/`GraphTooLargeState`/`PublishedGraphVersionRef`
  (`GraphExploreState` = structural precedent); MVP1 `class_id`/`relation_id`;
  MVP5 `Role`.

## Blocker
- 없음. All precedents in-repo and reused by reference; PM freeze unambiguous.

## 남은 TODO
- **Frontend (FE6-104):** `docs/pm/MVP6_12_FRONTEND_UX_REQUIREMENTS.md` — summary
  panel + whole-graph bounded view (layout hints, client-side layout, no coords);
  READY/TOO_LARGE_SUMMARY_ONLY/EMPTY + loading/error/permission states; read-only
  filters + MVP4-explore focus; boundary copy; live all-false-guard proof line; DTO
  gap vs this draft; G4 contextual sub-view of Published Graph.
- **QA (INT6-102):** `docs/backlog/INT6_12_ADVANCED_VIZ_ACCEPTANCE.md` (C planning +
  R NOT-RUNNABLE runtime gates); no-mutation headline gate; OpenAPI parse;
  runtime-leak scan.
- **Wave56 PM:** freeze G1 (filter hints P0/P1), G2 (200 EMPTY vs 404), G3
  (directed density / undirected components — this draft freezes as such), G4 (LNB
  placement — commander ratified contextual sub-view).

## Frontend/QA 전달 notes
- **Viz-data shape:** `GraphVizResponse.nodes[]`/`edges[]` are the WHOLE-GRAPH bounded
  view (not root-anchored). Nodes carry layout **hints** `degree`+`component_id` only
  — **NO server-side x/y**; FE computes layout client-side. `nodes`/`edges` are
  populated ONLY when `status=READY`; empty for TOO_LARGE_SUMMARY_ONLY and EMPTY.
- **Summary-stats shape:** `GraphVizSummary` is EXACT in every status (READY,
  TOO_LARGE_SUMMARY_ONLY, EMPTY) — computed over the FULL graph in one O(V+E) pass.
  `node_counts_by_class[]`={class_id,count}, `edge_counts_by_relation[]`=
  {relation_id,count}; `density` directed `E/(V*(V-1))`; components undirected (G3).
- **Too-large fallback:** over-cap → `status=TOO_LARGE_SUMMARY_ONLY`, `truncated=true`,
  empty elements, `too_large` populated (exact estimates + budgets + suggested_filters
  + message). Mirrors MVP4 `SAFE_TOO_LARGE`. Narrow via filters or MVP4-explore focus.
- **All-false 6-flag guard:** every response carries `mutation_guard` with
  published_graph_mutated / candidate_graph_mutated / ontology_draft_mutated /
  published_version_created / graph_snapshot_created / layout_persisted — ALL false.
  Headline: `published_graph_mutated` + `layout_persisted`. Use as the FE proof line
  and the QA headline runtime gate.
- **Empty vs error:** no current published version (none requested) → `200 EMPTY`
  (result state), NOT 404. 404 only for unknown project / unknown requested version.
  Invalid cap → 400; non-member → 403.
- **Determinism:** byte-stable modulo `generated_at` (the only non-stable field).

## 총괄에게 요청하는 결정
- **Confirm G1** — accept optional `class_ids`/`relation_ids` filter hints in P0
  (recommended; summary always over the full graph). Removable without changing the
  response shape if PM defers to P1.
- **Confirm G2** — `200 EMPTY` for no-current-version (recommended; drafted as such).
- **Confirm G3** — directed density / undirected components (drafted as such).
- G4 already ratified (contextual sub-view of Published Graph; no new LNB item).

## 현재 판정
- **PASS (planning).** Additive contract + OpenAPI `0.6.12-draft` drafted, parses OK,
  1 path / 12 schemas, all enums/DTOs/guard per PM freeze, reuse-by-reference intact,
  `git diff --check` clean, no `apps/`/`infra/` touched. Runtime acceptance is
  `NOT RUNNABLE` by design until Wave56. Frontend/QA planning slices may proceed.
