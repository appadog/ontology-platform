# Next Orders - Wave 56

Status: `MVP6.12 ADVANCED VISUALIZATION THIN IMPLEMENTATION (FINAL MVP6 THEME)`
Date: 2026-07-08

Wave55 closed MVP6.12 contract-first planning as PASS. Wave56 implements the
smallest deterministic READ-ONLY graph-viz + summary slice. This is the FINAL theme
of the user-directed MVP6 sequence (6.1-6.12).

```text
open project Published Graph -> Visualization·Summary sub-view
-> GET /projects/{id}/graph-viz (read-only, published graph)
-> summary stats (exact, full graph) + bounded whole-graph view (caps 150/300, layout hints only) OR TOO_LARGE_SUMMARY_ONLY OR EMPTY
-> (read-only; no graph/version/snapshot mutation; no server layout/persistence; all-false 6-flag guard)
```

Sequence: PM (freeze G1/G2/G3/G5 + G12 copy FIRST) -> Backend ∥ Frontend -> QA.

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read Wave55 artifacts: `docs/handoffs/wave-055/{PM,BACKEND,FRONTEND,QA}_REPORT.md`,
  `docs/pm/MVP6_12_ADVANCED_VIZ_BRIEF.md`, `docs/adr/0019-...md`,
  `docs/api/MVP6_12_ADVANCED_VIZ_API_CONTRACT_DRAFT.md`, `docs/api/openapi-mvp6-12-draft.json`,
  `docs/pm/MVP6_12_FRONTEND_UX_REQUIREMENTS.md`,
  `docs/backlog/INT6_12_ADVANCED_VIZ_ACCEPTANCE.md` (C1-C13, R1-R9, gates G1/G2/G3/G5/G12).
- Follow the MVP6.11 packs / MVP6.7 impact module precedents (process-local store +
  reset hook + fixtures). Reuse MVP3 published-graph + MVP4 `GraphExploreNode/Edge/
  GraphTooLargeState` by reference; NO renames. Apply the closed design language.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-056/{ROLE}_REPORT.md`.

## Scope Guard (ADR 0019 — read-only viz)
- READ-ONLY graph-viz data only (1 GET endpoint). No mutation of any graph /
  version / snapshot; NO server-side layout (x/y); NO layout persistence/cache. Every
  response carries an all-false 6-flag `GraphVizMutationGuard`.
- Summary is exact over the FULL graph in every status. Bounded whole-graph view
  (caps 150/300 + `truncated` + exact totals; layout HINTS only, `hop` omitted).
  Over-cap -> `TOO_LARGE_SUMMARY_ONLY` (summary only, zero fabricated elements). No
  current published version -> `200 EMPTY`. Authz: any project viewer; 400/403/404.
- Deterministic/byte-stable modulo `generated_at`. Additive; no break of MVP1-MVP6.11
  surfaces/smokes.

## PM Agent Order
Role: PM / MVP6.12 Implementation Scope Guard + Gate Freeze
Write report: `docs/handoffs/wave-056/PM_REPORT.md`
Backlog ID: `PM6-038`
Tasks: freeze G1 (filter-hints `class_ids`/`relation_ids` in P0 — commander-accepted;
state the filter semantics + that summary stays over the full graph), G2 (no-version ->
200 EMPTY — accepted), G3 (density = directed convention; components = undirected;
state the formulas), G5 (`hop` OMITTED on whole-graph nodes — confirm), and ratify G12
Korean copy (H1 / toggle labels `Explorer` / `Visualization·Summary` / KO glosses).
Also freeze a small deterministic published-graph fixture matrix so QA can exercise
READY / TOO_LARGE_SUMMARY_ONLY / EMPTY. State each as one precise rule. Confirm scope
unchanged (read-only, no mutation/layout/persistence). Update
`docs/backlog/MVP6_DRAFT_BACKLOG.md` if IDs (BE6-088+, FE6-105+, INT6-103+) need
recording. Validation: `git diff --check`; no apps/.

## Backend Agent Order
Role: Backend / MVP6.12 Runtime Thin Slice
Start condition: read `docs/handoffs/wave-056/PM_REPORT.md` (frozen G1/G2/G3/G5).
Write report: `docs/handoffs/wave-056/BACKEND_REPORT.md`
Backlog IDs: `BE6-088` graph-viz endpoint + summary stats (O(V+E)), `BE6-089` bounded
whole-graph view + too-large-summary + EMPTY, `BE6-090` all-false 6-flag guard +
no-mutation/no-layout guarantees, `BE6-091` OpenAPI export/alignment + regression guard.
Tasks: implement `GET /api/v1/projects/{project_id}/graph-viz` in a new module (e.g.
`apps/backend/app/modules/graph_viz/`, registered additively) matching
`openapi-mvp6-12-draft.json` EXACTLY; deterministic process-local published-graph
fixtures + reset hook per the PM matrix. Compute `GraphVizSummary` exactly over the
full graph (one O(V+E) pass; G3 formulas); bounded whole-graph node/edge view (caps
150/300 + truncated + exact totals; layout HINTS `degree`/`component_id`, no x/y, no
`hop`); over-cap -> TOO_LARGE_SUMMARY_ONLY (empty elements); no published version ->
200 EMPTY; G1 filter hints. Every response carries the all-false 6-flag guard. Reuse
MVP3/MVP4 shapes by reference (no renames). Focused tests
(`tests/test_mvp6_12_graph_viz_api.py`): READY (bounded + summary exact + layout
hints, no x/y/hop); TOO_LARGE_SUMMARY_ONLY (summary exact, empty elements, truncated);
EMPTY (no version); filter hints; byte-stable modulo generated_at; invalid cap 400;
authz 403/404; DATA-LEVEL no-mutation (ALL tables before==after; no version/snapshot
created); all-false 6-flag guard; OpenAPI alignment.
Validation: `cd apps/backend && .venv/bin/pytest tests/test_mvp6_12_graph_viz_api.py -q`
and `tests/test_mvp6_11_ontology_packs_api.py -q`; `ruff check app tests scripts`;
OpenAPI compare; `git diff --check`.

## Frontend Agent Order
Role: Frontend / MVP6.12 Published Graph Visualization·Summary sub-view
Start condition: read `docs/handoffs/wave-056/PM_REPORT.md`; coordinate with the
Backend report if contracts shift.
Write report: `docs/handoffs/wave-056/FRONTEND_REPORT.md`
Backlog IDs: `FE6-105` sub-view/toggle + types/client/mocks, `FE6-106` summary-stats
panel, `FE6-107` bounded whole-graph render (client-side layout from hints) + too-large/
EMPTY states, `FE6-108` mock + actual smoke.
Tasks: enhance the existing Published Graph surface with a `Visualization·Summary`
sub-view (toggle `Explorer | Visualization·Summary`; NO new LNB item; single active LNB
preserved) per `MVP6_12_FRONTEND_UX_REQUIREMENTS.md`: summary-stats panel (always shown,
exact); READY bounded whole-graph render laid out CLIENT-SIDE from the layout hints
(`degree`/`component_id`/`class_id`; no server x/y) with read-only class/relation
filters; TOO_LARGE_SUMMARY_ONLY (summary + "too large" notice, zero fabricated nodes);
EMPTY (no published version -> zeroed summary + publish-first guidance); persistent
"read-only visualization; nothing changes the graph" banner + live all-false 6-flag
guard proof; `GraphVizStatus` D6 badges; loading/error/permission states. NO
mutate/publish/layout-save affordance. Types/client/query/mocks match the frozen
OpenAPI exactly; reuse by reference (no rename). Add `npm run smoke:mvp6:graphviz:mock`
and, if backend runnable, `:actual`.
Validation: `npm run test`, `npm run build`, the new mock smoke (+ actual if runnable),
responsive 0-overflow re-check, `git diff --check`.

## QA Agent Order
Role: Integration / QA
Start condition: read Wave56 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-056/QA_REPORT.md`
Backlog IDs: `INT6-103` backend runtime, `INT6-104` frontend mock/API, `INT6-105`
read-only/no-mutation + all-false guard data-level, `INT6-106` Wave56 closeout (+ MVP6
sequence complete).
Tasks: update `docs/backlog/INT6_12_ADVANCED_VIZ_ACCEPTANCE.md` R1-R9 with verdicts.
Validate the endpoint, summary exactness, bounded view + layout hints (no x/y/hop),
TOO_LARGE_SUMMARY_ONLY + EMPTY states, filter hints, authz. INDEPENDENTLY verify at the
DATA level that the graph-viz call mutates NOTHING (all tables before==after; no
version/snapshot created), the 6-flag guard is all-false, and there is no server-side
layout/persistence. Validate the FE mock + actual flow (boot backend on SQLite). Run
MVP6.11/earlier regression + smokes touched; confirm additive-only + candidate/published
separation intact + single active LNB. Recommend closeout / hardening / redesign, and
note that MVP6.12 closeout completes the user-directed MVP6 theme sequence (6.1-6.12).
Exact commands; no leftover listeners on 8000/5173; `git diff --check`.
