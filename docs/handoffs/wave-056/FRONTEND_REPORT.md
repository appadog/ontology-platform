# Frontend Report - Wave 56

Role: Frontend / MVP6.12 Published Graph Visualization·Summary sub-view (FINAL MVP6 theme)
Status: `PASS` — sub-view + toggle + summary panel + client-side layout + too-large/EMPTY states + all-false 6-flag guard proof shipped; test/build/mock-smoke all green; contract matched EXACTLY (no deviations).
Date: 2026-07-13

## 담당 범위
- backlog ID: `FE6-105` (sub-view/toggle + client/query/mock wiring), `FE6-106` (always-shown exact summary-stats panel), `FE6-107` (READY client-side layout + too-large/EMPTY states + banner + guard proof + D6 badges + states), `FE6-108` (mock contract test + `smoke:mvp6:graphviz:mock` + `:actual`).
- 작업 경로: `apps/frontend/src/pages/GraphVizSummaryView.tsx` (new), `apps/frontend/src/pages/PublishedGraphExplorerPage.tsx` (toggle), `apps/frontend/src/shared/api/{client,queries}.ts`, `apps/frontend/src/shared/ui/platform/StatusBadge.tsx`, `apps/frontend/src/shared/api/mvp6GraphVizMock.test.ts` (new), `apps/frontend/scripts/mvp6-graphviz-{mock-route,actual-api}-smoke.mjs` (new), `apps/frontend/package.json`.
- Built ON the pre-existing artifacts (NOT redone): `src/shared/api/types.ts` GraphViz* types and `src/shared/mocks/mvp6GraphVizFixtures.ts` fixtures — reused by reference.

## 완료한 작업
- **FE6-105 — client + query + mock wiring + toggle.**
  - `client.ts`: added `GraphVizError` (INVALID_CAP/PROJECT_NOT_FOUND/PUBLISHED_GRAPH_VERSION_NOT_FOUND) + `getProjectGraphViz(projectId, params)`. Mock path calls the existing `buildGraphViz` fixture, sets `generated_at` at response time, and maps the fixture error to `GraphVizError`. Actual path calls `GET /api/v1/projects/{project_id}/graph-viz` with a dedicated query builder that emits `class_ids`/`relation_ids` as REPEATED array params per the frozen OpenAPI (scalars via set()).
  - `queries.ts`: `graphVizKeys` + `useProjectGraphViz(projectId, params, enabled)` (`retry:false` so EMPTY/TOO_LARGE 200 result states + 4xx render immediately; params folded into the key so a filter/cap change re-fetches).
  - `PublishedGraphExplorerPage.tsx`: added the `탐색기 | 시각화 · 요약` in-page toggle (segmented control, `role=tab`). H1 stays `게시 그래프 탐색기`; default sub-view = Explorer (existing behavior preserved); NO new LNB item, NO new route/path — `resolveActiveSection` (matched on `/published-graph`) untouched. Extracted the existing Explorer body into a local `ExplorerView` verbatim.
- **FE6-106 — summary-stats panel (always shown, exact).** `SummaryPanel` renders totals (node/edge), density (3-dp), component_count, largest_component_size, isolated_node_count, max_degree as stat tiles, plus `node_counts_by_class[]` / `edge_counts_by_relation[]` as compact bucket lists (class label resolved where available, opaque id shown). Rendered first + always, in every status; states verbatim that filters never change these numbers.
- **FE6-107 — status-driven body.**
  - READY: bounded whole-graph rendered as an SVG laid out CLIENT-SIDE from the layout HINTS only — cluster by `component_id`, size by `degree`, stable order by `published_entity_id` (deterministic, no reshuffle). Response carries NO x/y; FE computes and never sends a layout back. Read-only class/relation filter chips derived from the summary buckets (re-fetch on change; element view only). Hover shows reused element metadata (class/degree/component/source/evidence/lineage).
  - TOO_LARGE_SUMMARY_ONLY: summary + warning notice + `too_large` (exact totals vs budgets + message + suggested_filters chips), ZERO fabricated nodes/edges.
  - EMPTY: zeroed summary + `게시된 그래프가 아직 없습니다 — 먼저 버전을 게시하세요.` + contextual link to Publish.
  - Persistent read-only banner (headline + supporting line + 5 boundary chips `READ_ONLY`/`NOTHING_CHANGES`/`NO_PUBLISH`/`NO_LAYOUT_SAVED`/`PUBLISHED_ONLY` + `boundary_note` verbatim). Live all-false 6-flag `GraphVizMutationGuard` proof line read FROM the response (not hardcoded); any true flag → guard-violation state. `GraphVizStatus` + `GraphVizScope` D6 badges. loading (skeleton) / error (400 INVALID_CAP guidance, 404 retry) / permission (403) states. NO mutate/publish/layout-save/export/저장/게시 affordance anywhere.
  - `StatusBadge.tsx`: added D6 tokens `TOO_LARGE_SUMMARY_ONLY` (warning · 너무 큼 · 요약만) + `EMPTY` (neutral · 데이터 없음), additively (READY/PUBLISHED/CANDIDATE/WARNING already present; MVP4 `SAFE_TOO_LARGE` NOT renamed).
- **FE6-108 — test + smoke.** New Vitest mock contract (8 tests, mirrors the packs precedent) + `smoke:mvp6:graphviz:mock` (Playwright, 2 routes) + `smoke:mvp6:graphviz:actual` (backend on SQLite, graceful NOT RUN when unreachable), both registered in `package.json`.

## 변경 파일
- `apps/frontend/src/pages/GraphVizSummaryView.tsx` (new — the viz sub-view).
- `apps/frontend/src/pages/PublishedGraphExplorerPage.tsx` (toggle + ExplorerView extraction; H1/LNB/route unchanged).
- `apps/frontend/src/shared/api/client.ts` (GraphVizError + getProjectGraphViz + query builder + fixture import).
- `apps/frontend/src/shared/api/queries.ts` (graphVizKeys + useProjectGraphViz).
- `apps/frontend/src/shared/ui/platform/StatusBadge.tsx` (TOO_LARGE_SUMMARY_ONLY + EMPTY tokens).
- `apps/frontend/src/shared/api/mvp6GraphVizMock.test.ts` (new — 8 tests).
- `apps/frontend/scripts/mvp6-graphviz-mock-route-smoke.mjs` (new), `apps/frontend/scripts/mvp6-graphviz-actual-api-smoke.mjs` (new).
- `apps/frontend/package.json` (2 smoke scripts).
- Reused as-is (NOT modified this wave): `src/shared/api/types.ts` (GraphViz* types, pre-existing), `src/shared/mocks/mvp6GraphVizFixtures.ts` (fixtures, pre-existing).

## 실행/검증
- 실행한 명령 / 결과:
  - `npm run test` → **PASS · 17 files / 116 tests** (incl. the new `mvp6GraphVizMock.test.ts` 8/8). Covers: READY exact frozen summary (12/9, density 0.068, components 3, largest 8, isolated 1, max_degree 3; by-class doc3/org4/person5; by-relation authored3/employs4/partner2) + bounded elements + layout hints (NO x/y, NO hop); byte-stable modulo generated_at; filter hints bound elements only (summary unchanged); TOO_LARGE_SUMMARY_ONLY (empty elements, exact totals 210/480, too_large populated); EMPTY (zeroed, null ref); 400 INVALID_CAP; 404 project/version; in-range lowered cap → TOO_LARGE_SUMMARY_ONLY; all-false 6-flag guard on every response.
  - `npm run build` → **PASS** (`tsc --noEmit` app + node configs + `vite build` — 1893 modules, built in ~3s).
  - `npm run smoke:mvp6:graphviz:mock` → **PASS** (2 routes, 2 screenshots). Asserts: H1 `게시 그래프 탐색기` unchanged; `탐색기 | 시각화 · 요약` toggle; single active LNB (=1) on BOTH the Explorer and the viz sub-view; read-only banner + boundary chips; `6개 mutation 플래그 모두 false` proof (expanded → `published_graph_mutated`/`layout_persisted` false); exact summary panel; READY client-side SVG render + `CLIENT_LAYOUT · 서버 좌표 없음`; read-only filters; NO 저장/게시/적용/내보내기/export/레이아웃 저장/스냅샷 CTA.
  - Responsive 0-overflow re-check (375 / 768 / 1440) → **overflow 0 at all three** (the whole-graph SVG scrolls inside its own `overflow-x:auto` container, never the page body).
  - `git diff --check` → **CHECK_OK** (clean).
  - `npm run smoke:mvp6:graphviz:actual` → **NOT RUN** (backend unreachable at :8000; script exits 0 with a clear reason — no local backend this wave).
- 실행하지 못한 검증: `:actual` against a live backend (backend not booted in this FE session). Script is ready; QA boots the backend on SQLite and runs it.

## API/Enum/DTO 변경
- 변경 여부: 없음 (contract matched EXACTLY).
- 상세: types/client/query/mocks match `docs/api/openapi-mvp6-12-draft.json` verbatim — `GraphVizResponse`/`GraphVizSummary`/`GraphVizNode`(degree+component_id, NO hop, NO x/y)/`GraphVizEdge`/`GraphVizTooLargeState`, `GraphVizStatus`/`GraphVizScope`, all-false 6-flag `GraphVizMutationGuard`. Used the backend-renamed `GraphVizPublishedVersionRef` field shape (unchanged JSON) via the reused `PublishedGraphVersionRef` type. Only additive UI-token rows added to the shared D6 `StatusBadge` table (`TOO_LARGE_SUMMARY_ONLY`, `EMPTY`).
- 영향받는 역할: QA (assert the FE mock + actual flow; matrix + all-false guard + single active LNB).

## Blocker
- 없음.

## 남은 TODO
- QA: boot backend on SQLite → run `smoke:mvp6:graphviz:actual`; verify the FE mock + actual flow; data-level creates-nothing + all-false 6-flag guard; MVP6.11/earlier regression + single active LNB. Note MVP6.12 closeout completes the MVP6 theme sequence (6.1–6.12).

## 다른 역할에 전달할 내용
- PM: G1 (filters bound the element view only; status stays over full-graph totals) is honored in the UI — a filtered element view NEVER changes the summary numbers, stated verbatim on-screen. G5 confirmed (no hop, no x/y rendered). G12 copy shipped as ratified.
- Backend: FE consumes the frozen contract as-is; class_ids/relation_ids sent as repeated array params on the actual GET. No shape asks.
- Frontend: none.
- QA: mock project resolution — `project-corp-knowledge` → READY demo (12n/9e); ids containing `viz-large` → TOO_LARGE, `viz-empty` → EMPTY, `viz-missing` → 404. Guard proof + banner render on EVERY status. Single active LNB preserved across the in-page toggle (no new item). Focus/neighborhood deferred to the existing MVP4 Explorer sub-view (the toggle itself) per §2.6 — no new endpoint called.

## 총괄에게 요청하는 결정
- None required. One note: per-node "focus this node" wiring into the Explorer root is intentionally NOT added (the Explorer sub-view does not take a root param in its current UI; §2.6 lists focus as optional reuse). The Explorer/Viz toggle is the in-screen switch. Clean P1 refinement if desired.

## 현재 판정
- `PASS` — FE6-105..108 complete; `npm run test` (116) + `npm run build` + `smoke:mvp6:graphviz:mock` green; responsive 0-overflow; `git diff --check` clean; read-only / no-mutation / all-false 6-flag guard proof + single-active-LNB verified in the UI; zero contract deviations. FINAL MVP6 theme FE slice ready for QA.
