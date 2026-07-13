# Frontend Report - Wave 55

## 담당 범위
- backlog ID: `FE6-104`
- 작업 경로: `docs/pm/MVP6_12_FRONTEND_UX_REQUIREMENTS.md`, this report.
- 역할: Frontend — MVP6.12 Advanced Visualization UX/API requirements
  (CONTRACT-FIRST PLANNING ONLY; no route/component/type/mock/smoke code under `apps/`).

## 완료한 작업
- Wrote `docs/pm/MVP6_12_FRONTEND_UX_REQUIREMENTS.md` grounded on the frozen PM brief
  (`MVP6_12_ADVANCED_VIZ_BRIEF.md`) + ADR 0019 (Backend draft not yet landed).
- **Placement (COMMANDER RATIFIED):** the advanced-viz surface is a **contextual
  sub-view of the existing Publish-group `Published Graph`** destination
  (`/projects/:p/published-graph`, section `published-graph`) — NO new global LNB
  item (ADR 0010; brief §11 G4). Documented the in-screen `Explorer | Visualization
  · Summary` view toggle, justification, and rejected alternatives (new Analyze item;
  new global item). Single-active-LNB invariant preserved; active-state derivation
  unchanged.
- Specified the viz enhancements the `graph-viz` endpoint enables: an always-shown,
  exact-in-every-status **summary-stats panel** (`total_node_count`,
  `total_edge_count`, `node_counts_by_class[]`, `edge_counts_by_relation[]`,
  `density`, `component_count`, `largest_component_size`, `isolated_node_count`,
  `max_degree`); a **READY bounded whole-graph view** laid out **client-side from
  layout hints** (`degree` / `component_id` / `class_id`; NO server x/y); read-only
  class/relation filters (summary always over the full graph); focus/neighborhood
  **reusing the existing MVP4 explore endpoint** (no new focus endpoint).
- Specified states: loading / `EMPTY` (no published version → zeroed summary) /
  transport error / permission-limited; `TOO_LARGE_SUMMARY_ONLY` (summary + "too
  large to render fully" notice, **zero fabricated nodes**, reuses MVP4
  SAFE_TOO_LARGE precedent); truncation (150/300 caps + exact totals); the
  "read-only visualization — nothing changes the graph" boundary banner +
  `boundary_note` + live **all-false 6-flag `GraphVizMutationGuard` proof line**;
  defensive guard-violation state.
- Applied the design language: Section + Card, KO titles (reuse existing
  `게시 그래프 탐색기` H1 + KO sub-view labels), D6 status badges
  (`GraphVizStatus` / `GraphVizScope` + boundary chips) with tone/icon/KO gloss,
  aligned to the MVP4 `stateTone` mapping.
- §8 DTO/field **gap analysis** (G1–G12) vs the pending Backend draft, using exact
  frozen enum/field names.

## 변경 파일
- `docs/pm/MVP6_12_FRONTEND_UX_REQUIREMENTS.md` (new)
- `docs/handoffs/wave-055/FRONTEND_REPORT.md` (this)

## 실행/검증
- 실행한 명령: `git diff --check`; `git status --short apps/ infra/`.
- 결과: PASS — no whitespace/conflict-marker errors; **no `apps/` or `infra/`
  runtime touched** (requirements doc only).
- 실행하지 못한 검증: none required for planning (no runtime/OpenAPI/test in this
  slice). Backend contract draft + OpenAPI absent → §8 is a forward need-list, not a
  reconciliation (mirrors the MVP6.11 FE planning precedent).

## API/Enum/DTO 변경
- 변경 여부: 없음 (planning only — no runtime code; documents the PM/Backend-frozen
  contract from the FE view; proposes no new field/enum).
- 상세: FE consumes the PM-frozen `GraphVizResponse` / `GraphVizSummary` /
  `GraphVizNode`+`GraphVizEdge` (reuse MVP4 element shapes by ref + `degree` /
  `component_id` hints, NO x/y) / `GraphVizStatus` (READY / TOO_LARGE_SUMMARY_ONLY /
  EMPTY) / `GraphVizScope` (PUBLISHED) / all-false 6-flag `GraphVizMutationGuard`.
  Surfaced FE-specific DTO gaps for Backend: **G5** (`hop` on the reused
  `GraphExploreNode` shape is root-anchored → confirm omitted/nullable for
  whole-graph viz), G1 (filter hints P0/P1), G6 (hints present + x/y absent), G9
  (result-vs-error split), G10 (summary present+exact in too-large).
- 영향받는 역할: Backend (must confirm §8 gaps in the contract draft), QA (acceptance
  must gate no-mutation + summary-exact + too-large-empty + client-side-layout-only).

## Blocker
- 없음 (planning deliverable complete). Soft dependency: the Backend contract draft
  + `openapi-mvp6-12-draft.json` are not yet present; §8 must be re-reconciled
  field-by-field once the draft lands (currently PENDING). Does not block this
  planning output or the P0 UX shape.

## 남은 TODO
- **DTO gaps to close vs the Backend draft (Wave56 pre-impl):** G1 (filter hints),
  G2 (`version_id` + no-current-version → 200 EMPTY), G3 (density/component
  definitions), **G5 (`hop` on reused element shape for whole-graph viz)**, G6
  (layout hints present, NO x/y), G7 (`generated_at`), G9 (result-vs-transport-error
  split), G10 (summary exact in TOO_LARGE_SUMMARY_ONLY), G11 (caps echoed +
  `truncated` semantics).
- **PM/commander copy confirm (G12):** KO sub-view labels (`탐색기` /
  `시각화 · 요약`) + `GraphVizStatus` / boundary-chip glosses. LNB label unchanged.

## 다른 역할에 전달할 내용
- PM: G4 placement ratified as a contextual sub-view of Published Graph (no new LNB
  item) — reflected in §1. Please confirm the KO sub-view labels + status glosses
  (G12).
- Backend: In the contract draft, close §8 gaps — especially **G5** (`hop` field on
  `GraphVizNode` for a non-root-anchored whole-graph view: omit/nullable/sentinel),
  G6 (expose `degree` + `component_id` as required, emit NO x/y), G10 (`summary`
  always populated + exact when `TOO_LARGE_SUMMARY_ONLY`), G9 (EMPTY /
  TOO_LARGE_SUMMARY_ONLY are 200 result states, not 4xx). Reuse MVP3/MVP4 shapes by
  `$ref` (no rename); expose all 6 `GraphVizMutationGuard` flags as `const:false` /
  required.
- Frontend: Wave56 impl builds the viz as an in-screen sub-view on
  `PublishedGraphExplorerPage` (query-param or tab), reusing the existing
  SAFE_TOO_LARGE card pattern + `StateBadge`/`stateTone`; add `GraphVizStatus`
  literals to the shared tone/badge mapping additively.
- QA: Make **no-mutation** the headline gate (`GraphVizMutationGuard` all-false;
  before==after for published/candidate/ontology/version/snapshot; `layout_persisted`
  false) + summary exact & byte-stable modulo `generated_at` + READY cap-bounded vs
  over-cap `TOO_LARGE_SUMMARY_ONLY` empty-elements + layout hints present with NO
  coordinates + EMPTY no-version + 400/403/404. Confirm no runtime leaked
  (`apps/`+`infra/`).

## 총괄에게 요청하는 결정
- **Confirm the ratified placement** = contextual sub-view of the existing Published
  Graph surface (no new LNB item; single-active-LNB preserved). Documented as
  ratified per brief §11 G4; flag if a distinct destination is wanted instead.
- **Confirm G12 copy** (KO sub-view labels + status glosses); FE proposals in §1.3 /
  §4.

## 현재 판정
- PASS (planning). Requirements doc written per the PM/ADR-0019 freeze; placement +
  summary-stats/bounded-view/too-large/EMPTY states + read-only boundary + all-false
  6-flag guard proof + DTO gap analysis all covered; `git diff --check` clean; no
  `apps/`/`infra/` touched. Runtime is `NOT RUNNABLE` by design until Wave56;
  §8 reconciliation vs the Backend draft is PENDING (blocking for Wave56 impl only).
</content>
