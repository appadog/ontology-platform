# Next Orders - Wave 53

Status: `MVP6.11 ONTOLOGY PACKS — CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-08

Next MVP6 theme (user-directed sequence): **Ontology Packs** — reusable ontology
templates/bundles (classes/properties/relations) that can be browsed and, in P0,
**previewed** against a project. Cut to a minimal SAFE P0: a read-only pack catalog
+ a DRY-RUN apply-preview boundary. NO direct published-graph write, NO auto-apply,
deterministic mock packs. A real apply would land in the DRAFT ontology via the
existing MVP1 ontology-edit / MVP6.6 governance-application path (out of P0 scope).

Wave53 is **contract-first planning only** (no runtime/UI/test/seed code). Runtime
waits for Wave54. Mirrors the planning-wave pattern (Wave14/.../51).

## Non-negotiable boundary (this becomes ADR 0018)
- P0 is READ-ONLY pack catalog + DRY-RUN apply-preview only. No apply, no external
  fetch/registry, no published-graph write, no candidate/prompt mutation. Applying
  a pack for real is deferred and would route through the existing gated
  ontology-edit / MVP6.6 governance-application path.
- The apply-preview produces a candidate/draft-layer preview only (what the pack
  WOULD add/modify, with conflict/compat detection vs the current ontology). It
  creates NOTHING and is deterministic/byte-stable.
- Every response carries an all-false mutation guard. Additive; no break of
  MVP1-MVP6.10 surfaces/smokes; reuse existing shapes by reference (no renames).

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md` (ontology packs theme)
  + `docs/backlog/MVP6_DRAFT_BACKLOG.md`.
- Study precedents: MVP5/MVP6.4 import-dry-run + compatibility; MVP6.9 connectors
  dry-run preview (catalog + all-false guard + creates-nothing); MVP1 ontology
  class/property/relation shapes the pack contains; MVP6.6 governance-application
  (the real-apply path a pack would later route through).
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-053/{ROLE}_REPORT.md`.

## Theme Scope (PM freezes the smallest coherent, safe P0)
Suggested minimal P0 (PM to confirm/trim): a read-only **pack catalog** (a few
deterministic mock packs, each = a bundle of ontology elements + metadata) + a
**dry-run apply-preview** (given a pack + a target project/draft, return a
deterministic preview of what it WOULD add/modify + conflict/compat rollup) — with
an explicit "preview only, nothing applied; real apply routes through the
ontology-edit / governance path" boundary.

## Execution Sequence
1. PM freezes the smallest coherent, safe packs P0 + brief + ADR 0018.
2. Backend drafts an additive API contract + OpenAPI planning artifact.
3. Frontend reviews fields/states/IA (pack catalog + apply-preview UX;
   "nothing applied" boundary) — planning only.
4. QA writes an executable acceptance checklist and recommends Wave54.

## PM Agent Order
Role: PM / Architect — MVP6.11 Ontology Packs P0 Freeze
Write report: `docs/handoffs/wave-053/PM_REPORT.md`
Backlog ID: `PM6-035`
Tasks:
- Freeze the smallest coherent P0: the pack catalog model (a few deterministic mock
  packs; each pack = bundle of ontology elements (classes/properties/relations) +
  metadata/version), the dry-run apply-preview (deterministic would-add/would-modify
  items mapped to the DRAFT ontology layer + conflict/compatibility rollup +
  "nothing applied" semantics), enums/states, the read-only + no-apply +
  no-published-write boundary, and the all-false mutation guard. Decide authz.
- Explicitly exclude: real apply/install, external pack registry/fetch, published-
  graph write, pack authoring/publishing, versioned pack dependency resolution,
  auto-apply.
- Write `docs/pm/MVP6_11_ONTOLOGY_PACKS_BRIEF.md`; add `docs/adr/0018-...md`; update
  `docs/backlog/MVP6_DRAFT_BACKLOG.md` with PM/BE/FE/INT IDs (continue numbering;
  INT6 used through INT6-093, so QA IDs start INT6-094).
- Confirm durable invariants preserved.
Validation: `git diff --check`. Do NOT touch apps/.

## Backend Agent Order
Role: Backend — Ontology Packs Contract Draft (planning only)
Start condition: read `docs/handoffs/wave-053/PM_REPORT.md`.
Write report: `docs/handoffs/wave-053/BACKEND_REPORT.md`
Tasks:
- Draft additive endpoint(s) + DTO/enum names in
  `docs/api/MVP6_11_ONTOLOGY_PACKS_API_CONTRACT_DRAFT.md` (e.g. list pack catalog;
  get pack detail; run a dry-run apply-preview against a project/draft), reusing
  MVP1 ontology-element + MVP6.4/6.9 dry-run/compatibility shapes by reference (no
  renames). All-false mutation guard; preview creates nothing.
- Produce `docs/api/openapi-mvp6-11-draft.json` (OpenAPI 3.1.0, additive to
  MVP1-MVP6.10, e.g. `0.6.11-draft`). No runtime code. Capture open questions.
Validation: OpenAPI JSON parse; `git diff --check`.

## Frontend Agent Order
Role: Frontend — Ontology Packs UX/API Requirements (planning only)
Start condition: read PM report + Backend draft if ready.
Write report: `docs/handoffs/wave-053/FRONTEND_REPORT.md`
Tasks:
- Document, in `docs/pm/MVP6_11_FRONTEND_UX_REQUIREMENTS.md`: pack catalog +
  dry-run apply-preview UX (placement per ADR 0010 — likely the Build/Ontology
  area), the "preview only — nothing applied; real apply routes through
  ontology-edit/governance" boundary copy, the preview result layout (would-add/
  would-modify + conflict/compat states), first-class loading/empty/error/permission
  states. Apply the closed design language. DTO gap analysis vs the Backend draft.
  No route/component/type/mock/smoke code.
Validation: `git diff --check`.

## QA Agent Order
Role: Integration / QA — Ontology Packs Acceptance Checklist
Start condition: read Wave53 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-053/QA_REPORT.md`
Tasks:
- Create `docs/backlog/INT6_11_ONTOLOGY_PACKS_ACCEPTANCE.md` (C planning + R
  NOT-RUNNABLE runtime gates), continuing INT6 numbering (INT6-094+).
- Verify PM/BE/FE agree on the P0, catalog/apply-preview model, the read-only +
  dry-run + no-apply + no-published-write boundary, all-false guard, and
  exclusions. Confirm no runtime leaked (apps/ + infra/). OpenAPI parse.
- Recommend Wave54 thin implementation, hardening, or redesign.
Validation: OpenAPI parse; runtime-leakage search; `git diff --check`.
