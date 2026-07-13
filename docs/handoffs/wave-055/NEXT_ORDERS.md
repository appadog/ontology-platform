# Next Orders - Wave 55

Status: `MVP6.12 ADVANCED VISUALIZATION — CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-08

FINAL MVP6 theme (user-directed sequence): **Advanced Visualization** — richer
read-only graph visualization over the published (and/or candidate) graph. Cut to a
minimal SAFE P0: a read-only graph-viz data/summary surface (bounded node/edge
subgraph + layout-ready stats), NO mutation, deterministic, bounded for large graphs
(reuse the MVP3 published-graph "safe too large" precedent). Every existing invariant
(candidate/published separation, read-only over the published graph) preserved.

Wave55 is **contract-first planning only** (no runtime/UI/test/seed code). Runtime
waits for Wave56. Mirrors the planning-wave pattern (Wave14/.../53).

## Non-negotiable boundary (this becomes ADR 0019)
- P0 is READ-ONLY graph visualization data only. No mutation of any graph
  (published/candidate/draft), no publish, no layout persistence. Deterministic +
  bounded (node/edge caps + `truncated` + exact totals + a "too large -> summary
  only" fallback, mirroring MVP3 published-graph safe-too-large behavior).
- It reads existing published (and optionally candidate) graph data only; it does
  not compute anything that mutates or re-homes data. Every response carries an
  all-false mutation guard.
- Additive; no break of MVP1-MVP6.11 surfaces/smokes; reuse existing published-graph
  / candidate shapes by reference (no renames).

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md` (advanced-viz theme)
  + `docs/backlog/MVP6_DRAFT_BACKLOG.md`.
- Study precedents: MVP3 published graph + its "safe too large" bounding (ADR 0006,
  published-graph module + FE explorer); MVP1 ontology graph view; the recent
  read-only + all-false-guard + bounded/truncation themes (MVP6.7 impact, MVP6.9
  connectors, MVP6.11 packs). The FE already has a published-graph explorer + graph
  vendor bundle.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-055/{ROLE}_REPORT.md`.

## Theme Scope (PM freezes the smallest coherent, safe P0)
Suggested minimal P0 (PM to confirm/trim): a read-only **graph-visualization data**
endpoint for a project's published graph (bounded node/edge subgraph + layout-ready
metadata + summary stats: node/edge counts by kind, density, largest components) with
a deterministic bound + "too large -> summary-only" fallback, plus the FE viz
enhancements it enables (e.g. class/relation filters, focus/neighborhood view) — all
read-only. Decide whether candidate-graph viz is P0 or P1.

## Execution Sequence
1. PM freezes the smallest coherent, safe advanced-viz P0 + brief + ADR 0019.
2. Backend drafts an additive API contract + OpenAPI planning artifact.
3. Frontend reviews fields/states/IA (viz surface enhancements; bounded/too-large
   states) — planning only.
4. QA writes an executable acceptance checklist and recommends Wave56.

## PM Agent Order
Role: PM / Architect — MVP6.12 Advanced Visualization P0 Freeze
Write report: `docs/handoffs/wave-055/PM_REPORT.md`
Backlog ID: `PM6-037`
Tasks:
- Freeze the smallest coherent P0: the read-only graph-viz data model (bounded
  node/edge subgraph + layout-ready metadata + summary stats), the bounding rule +
  "too large -> summary-only" fallback (reuse MVP3 safe-too-large), the enums/states,
  which graph(s) are in scope (published P0; candidate P0-or-P1), the read-only +
  no-mutation boundary, and the all-false mutation guard. Decide authz.
- Explicitly exclude: any graph mutation/publish, layout persistence, real-time
  collaboration, external export/embed, heavy server-side layout computation.
- Write `docs/pm/MVP6_12_ADVANCED_VIZ_BRIEF.md`; add `docs/adr/0019-...md`; update
  `docs/backlog/MVP6_DRAFT_BACKLOG.md` with PM/BE/FE/INT IDs (continue numbering;
  INT6 used through INT6-101, so QA IDs start INT6-102).
- Confirm durable invariants preserved.
Validation: `git diff --check`. Do NOT touch apps/.

## Backend Agent Order
Role: Backend — Advanced Viz Contract Draft (planning only)
Start condition: read `docs/handoffs/wave-055/PM_REPORT.md`.
Write report: `docs/handoffs/wave-055/BACKEND_REPORT.md`
Tasks:
- Draft additive endpoint(s) + DTO/enum names in
  `docs/api/MVP6_12_ADVANCED_VIZ_API_CONTRACT_DRAFT.md` (e.g. a read-only graph-viz
  data endpoint for a project's published graph + summary/too-large fallback),
  reusing MVP3 published-graph + MVP1 ontology shapes by reference (no renames).
  All-false mutation guard; read-only; bounded/truncated + too-large summary.
- Produce `docs/api/openapi-mvp6-12-draft.json` (OpenAPI 3.1.0, additive to
  MVP1-MVP6.11, e.g. `0.6.12-draft`). No runtime code. Capture open questions.
Validation: OpenAPI JSON parse; `git diff --check`.

## Frontend Agent Order
Role: Frontend — Advanced Viz UX/API Requirements (planning only)
Start condition: read PM report + Backend draft if ready.
Write report: `docs/handoffs/wave-055/FRONTEND_REPORT.md`
Tasks:
- Document, in `docs/pm/MVP6_12_FRONTEND_UX_REQUIREMENTS.md`: the viz surface
  enhancements (placement per ADR 0010 — likely the existing Published Graph /
  Ontology area), the bounded/too-large-summary states, filters/focus/neighborhood
  (read-only), first-class loading/empty/error/permission states, and the "read-only
  visualization; nothing changes the graph" boundary copy. Apply the closed design
  language. DTO gap analysis vs the Backend draft. No route/component/type/mock/smoke
  code.
Validation: `git diff --check`.

## QA Agent Order
Role: Integration / QA — Advanced Viz Acceptance Checklist
Start condition: read Wave55 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-055/QA_REPORT.md`
Tasks:
- Create `docs/backlog/INT6_12_ADVANCED_VIZ_ACCEPTANCE.md` (C planning + R
  NOT-RUNNABLE runtime gates), continuing INT6 numbering (INT6-102+).
- Verify PM/BE/FE agree on the P0, the read-only + bounded + too-large-summary + no-
  mutation boundary, all-false guard, and exclusions. Confirm no runtime leaked
  (apps/ + infra/). OpenAPI parse.
- Recommend Wave56 thin implementation, hardening, or redesign.
Validation: OpenAPI parse; runtime-leakage search; `git diff --check`.
