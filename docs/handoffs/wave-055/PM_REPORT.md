# PM Report - Wave 55

## 담당 범위
- backlog ID: `PM6-037`
- 작업 경로: `docs/pm/MVP6_12_ADVANCED_VIZ_BRIEF.md`, `docs/adr/0019-*.md`,
  `docs/backlog/MVP6_DRAFT_BACKLOG.md` (Wave55 section), this report.
- 역할: PM / Architect — MVP6.12 Advanced Visualization P0 freeze (FINAL MVP6 theme).
  Contract-first PLANNING ONLY; no runtime/UI/test/seed code.

## 완료한 작업
- Froze the smallest coherent SAFE advanced-viz P0: **one** read-only, whole-graph
  **viz data + summary-stats** endpoint over a project's **PUBLISHED** graph. It is
  the thinnest additive delta over the two existing graph read surfaces (MVP3
  published graph, MVP4 graph-explore): the genuine gap = graph-level **summary
  statistics** + a **whole-graph** (not root-anchored) bounded view with layout
  hints. Neighborhood/focus stays served by the existing MVP4 explore endpoint —
  NOT re-implemented.
- Froze the **bounding rule + too-large-summary-only fallback** reusing the MVP4
  `SAFE_TOO_LARGE` precedent verbatim: caps 150/300, `truncated`, exact totals,
  `GraphTooLargeState`; over-cap → `TOO_LARGE_SUMMARY_ONLY` (summary over the FULL
  graph, elements omitted). Deterministic + byte-stable modulo `generated_at`.
- Decided **published-only P0** (candidate viz = P1): `GraphVizScope=PUBLISHED`
  single literal, `CANDIDATE` reserved and never produced. Rationale: keep
  candidate/published separation crisp; candidate graph has no stable version to
  bound against.
- Froze enums/states, the all-false 6-flag `GraphVizMutationGuard`, authz, and the
  read-only / no-mutation / no-layout-persist / no-server-layout boundary.
- Wrote `docs/pm/MVP6_12_ADVANCED_VIZ_BRIEF.md` (thin; explicit exclusions §9) and
  `docs/adr/0019-...-boundary.md`; added the Wave55 backlog section (PM6-037,
  BE6-086~087, FE6-104, INT6-102).
- Confirmed durable invariants preserved (brief §10).

## 변경 파일
- `docs/adr/0019-mvp6-12-advanced-viz-read-only-bounded-published-graph-summary-too-large-summary-only-no-mutation-no-layout-persist-boundary.md` (new)
- `docs/pm/MVP6_12_ADVANCED_VIZ_BRIEF.md` (new)
- `docs/backlog/MVP6_DRAFT_BACKLOG.md` (Wave55 section appended)
- `docs/handoffs/wave-055/PM_REPORT.md` (this)

## 실행/검증
- 실행한 명령: `git diff --check` (whitespace/conflict check).
- 결과: PASS — no whitespace or conflict-marker errors in the PM-owned docs.
- 실행하지 못한 검증: none required for planning; no `apps/`/`infra/` touched (no
  runtime/OpenAPI/test to run in this PM slice).

## API/Enum/DTO 변경 (planning only — no runtime)
- 변경 여부: 있음 (planning-only; frozen for Backend to draft in BE6-086~087).
- 상세:
  - Endpoint (planning): `GET /api/v1/projects/{project_id}/graph-viz` (optional
    `version_id` / `node_cap` `[1,150]` / `edge_cap` `[1,300]` / read-only
    `class_ids`/`relation_ids` filter hints).
  - Response DTO (planning): `GraphVizResponse` { `project_id`, `scope`,
    `published_graph_version_ref`, `generated_at`, `status`, `summary`, `node_cap`,
    `edge_cap`, `truncated`, `nodes[]`, `edges[]`, `too_large`, `mutation_guard`,
    `boundary_note` }.
  - `GraphVizSummary` { `total_node_count`, `total_edge_count`,
    `node_counts_by_class[]` {class_id,count}, `edge_counts_by_relation[]`
    {relation_id,count}, `density`, `component_count`, `largest_component_size`,
    `isolated_node_count`, `max_degree` } — single O(V+E) pass; exact in every status.
  - `GraphVizNode` / `GraphVizEdge` = reuse MVP4 `GraphExploreNode`/`GraphExploreEdge`
    by reference + layout **hints** (`degree`, `component_id`); NO x/y coordinates.
  - Enums: `GraphVizStatus` (READY / TOO_LARGE_SUMMARY_ONLY / EMPTY),
    `GraphVizScope` (PUBLISHED; CANDIDATE reserved).
  - `too_large` reuses MVP4 `GraphTooLargeState` shape.
  - All-false 6-flag `GraphVizMutationGuard`: `published_graph_mutated`,
    `candidate_graph_mutated`, `ontology_draft_mutated`, `published_version_created`,
    `graph_snapshot_created`, `layout_persisted` — all false; headline
    `published_graph_mutated` + `layout_persisted`.
  - Reuse by reference (no rename): MVP3 `PublishedEntity`/`PublishedRelation`/
    `PublishedGraphVersion`/`PublishedGraphSnapshot`, MVP4 `GraphExploreNode`/
    `GraphExploreEdge`/`GraphTooLargeState`/`PublishedGraphVersionRef`
    (`GraphExploreState` = structural precedent), MVP1 `class_id`/`relation_id`,
    MVP5 `Role`.
  - Transport: `400` invalid cap; `403 PERMISSION_DENIED`; `404 PROJECT_NOT_FOUND`;
    `404 PUBLISHED_GRAPH_VERSION_NOT_FOUND`; `200 EMPTY` (no current published version).
- 영향받는 역할: Backend (draft contract + OpenAPI `0.6.12-draft`), Frontend (UX/API
  requirements), QA (acceptance checklist).

## Blocker
- 없음. Precedents (MVP3 published graph, MVP4 safe-too-large explore, MVP6.7/6.9/6.11
  read-only + all-false + bounded themes) are all in-repo and reused by reference.

## 남은 TODO (Wave55 downstream + Wave56 gates)
- **Backend (BE6-086~087):** draft `docs/api/MVP6_12_ADVANCED_VIZ_API_CONTRACT_DRAFT.md`
  + `docs/api/openapi-mvp6-12-draft.json` (3.1.0, `0.6.12-draft`, disjoint-additive).
  Reuse MVP3/MVP4 shapes by `$ref`; import no publish/version-write/candidate-write/
  ontology-write/layout-persist path. Resolve/record G1–G4.
- **Frontend (FE6-104):** `docs/pm/MVP6_12_FRONTEND_UX_REQUIREMENTS.md` — summary panel
  + whole-graph bounded view (layout hints, no coordinates) as a contextual sub-view
  of Published Graph; READY / TOO_LARGE_SUMMARY_ONLY / EMPTY states; read-only filters
  + MVP4-explore focus; boundary copy; live all-false guard proof line; DTO gap.
- **QA (INT6-102):** `docs/backlog/INT6_12_ADVANCED_VIZ_ACCEPTANCE.md` (C + R gates);
  NO-MUTATION headline runtime gate; OpenAPI parse; runtime-leakage search; recommend
  Wave56.
- **Wave56 open gates (PM to freeze at implementation):** G1 filter-hints P0-vs-P1
  (recommend optional filters, summary always over the full graph); G2 no-current-
  version → `200 EMPTY` (recommended) vs `404`; G3 directed `density` / undirected
  `component_count`; G4 LNB/IA = contextual sub-view of Published Graph (ADR 0010,
  no new global LNB item).

## 다른 역할에 전달할 내용
- **Backend:** Draft the single additive `GET /projects/{project_id}/graph-viz`
  contract + `openapi-mvp6-12-draft.json` `0.6.12-draft`. Fields/states to lock:
  `GraphVizResponse` / `GraphVizSummary` (§3.1) / `GraphVizNode`+`GraphVizEdge`
  (layout hints, NO coordinates) / `GraphVizStatus` (READY/TOO_LARGE_SUMMARY_ONLY/
  EMPTY) / `GraphVizScope` (PUBLISHED) / all-false 6-flag `GraphVizMutationGuard` /
  reuse MVP3+MVP4 shapes by `$ref` (no rename) / bounding caps 150/300 + `truncated`
  + exact totals + `too_large` on over-cap / transport 400/403/404/200-EMPTY. Import
  NO write path. Record G1–G4.
- **Frontend:** Review `GraphVizSummary` fields for the stats panel + the three
  status states + the layout-hints-only (client-side layout) contract + the
  read-only boundary copy + live all-false-guard proof line; propose G4 placement
  (contextual sub-view of Published Graph). DTO gap vs the Backend draft.
- **QA:** Checklist must make **no-mutation** the headline runtime gate
  (`GraphVizMutationGuard` all-false; data-level before==after for published/
  candidate/ontology/version/snapshot; summary exact + byte-stable modulo
  `generated_at`; READY cap-bounded vs over-cap `TOO_LARGE_SUMMARY_ONLY` empty-
  elements + exact totals; layout hints present but NO coordinates; EMPTY no-version;
  400/403/404) + confirm no runtime leaked (`apps/`+`infra/`) + OpenAPI parse.
- **PM (Wave56):** Freeze G1–G4 before/at implementation.

## 총괄에게 요청하는 결정
- **Confirm published-only P0 (candidate viz = P1).** Recommended and frozen; flag if
  candidate viz must enter P0 (would reopen candidate/published separation risk).
- **Confirm the too-large fallback is summary-only in P0** (elements omitted;
  bounded-representative-subgraph = P1). Recommended and frozen (mirrors MVP4).
- **Confirm no new LNB item** (viz = contextual sub-view of the existing Published
  Graph surface, ADR 0010). Recommended; Frontend to ratify (G4).

## 현재 판정
- PASS (planning). P0 frozen, ADR 0019 + brief + backlog written, invariants
  preserved, `git diff --check` clean, no `apps/`/`infra/` touched. Runtime acceptance
  is `NOT RUNNABLE` by design until Wave56. Backend/Frontend/QA planning slices may
  proceed against this freeze.
</content>
