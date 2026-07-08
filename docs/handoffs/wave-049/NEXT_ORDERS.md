# Next Orders - Wave 49

Status: `MVP6.9 CONNECTORS / PLUGIN SDK — CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-08

Next MVP6 theme (user-directed sequence): **Connectors / plugin SDK**. Cut to a
minimal, SAFE, read-only + dry-run P0: a registered connector catalog and a
DRY-RUN/PREVIEW import boundary. NO external write, NO autonomous sync, NO real
network calls in P0 (deterministic mock connectors). Imported data — like all LLM/
external-origin data — lands only in the candidate/analysis layer via existing
gated flows; it NEVER writes the published graph.

Wave49 is **contract-first planning only** (no runtime/UI/test/seed code). Runtime
waits for Wave50. Mirrors the planning-wave pattern (Wave14/19/23/30/33/39/41/43/45/47).

## Non-negotiable boundary (this becomes ADR 0016)
- P0 is READ-ONLY catalog + DRY-RUN/PREVIEW import only. No external write-back, no
  live sync, no scheduled/background connector runs, no real network/credential
  execution (deterministic mock connectors + fixture sample data).
- A connector import PREVIEW produces a candidate-layer preview only; it does NOT
  create candidates/entities, does NOT touch the published graph, and does NOT
  bypass the existing extraction/candidate-review gates. Any real ingestion later
  must route through the existing gated pipeline (candidate -> review -> publish).
- Credential/secret safety: mirror MVP5 — no raw secret is printed/persisted/logged/
  returned; connector config uses masked/placeholder values in P0.
- Every response carries an all-false mutation guard. Additive; no break of
  MVP1-MVP6.8 surfaces/smokes; reuse existing shapes by reference (no renames).

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md` (connector/plugin theme)
  + `docs/backlog/MVP6_DRAFT_BACKLOG.md`.
- Study precedents: MVP5 import dry-run + credential/no-secret safety
  (`docs/pm/MVP5_*`, admin import/export + credentials modules); MVP2 source/parse
  ingestion + the candidate pipeline; the MVP5 `GoldSetImport`/import-compatibility
  dry-run pattern. Reuse the mutation-guard + dry-run + masked-secret patterns.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-049/{ROLE}_REPORT.md`.

## Theme Scope (PM freezes the smallest coherent, safe P0)
Suggested minimal P0 (PM to confirm/trim): a project-scoped **connector catalog**
(list registered deterministic mock connector types + their config schema, masked)
and a **dry-run import preview** (given a connector + mock config, return a
deterministic preview of what WOULD be ingested as candidate-layer items + a
compatibility/summary rollup) — with an explicit "preview only, nothing imported,
routes through candidate review when actually run later" boundary.

## Execution Sequence
1. PM freezes the smallest coherent, safe connector P0 + brief + ADR 0016
   (read-only catalog + dry-run preview / no external write / no real network /
   masked secrets / all-false guard).
2. Backend drafts an additive API contract + OpenAPI planning artifact.
3. Frontend reviews fields/states/IA (connector catalog + dry-run preview UX;
   masked-secret UX; "nothing imported" boundary) — planning only.
4. QA writes an executable acceptance checklist and recommends Wave50.

## PM Agent Order
Role: PM / Architect — MVP6.9 Connectors P0 Freeze
Write report: `docs/handoffs/wave-049/PM_REPORT.md`
Backlog ID: `PM6-031`
Tasks:
- Freeze the smallest coherent P0: the connector catalog model (a few deterministic
  mock connector kinds + masked config schema), the dry-run import preview
  (deterministic preview items mapped to the candidate layer + a compatibility/
  summary rollup + explicit "nothing imported" semantics), enums/states, the
  credential/no-secret safety rule (mirror MVP5), the read-only + no-external-write +
  no-real-network boundary, and the all-false mutation guard. Decide authz.
- Explicitly exclude: external write-back, live/scheduled sync, real network/
  credential execution, autonomous ingestion, plugin code execution, direct
  candidate/published-graph mutation.
- Write `docs/pm/MVP6_9_CONNECTORS_BRIEF.md`; add `docs/adr/0016-...md`; update
  `docs/backlog/MVP6_DRAFT_BACKLOG.md` with PM/BE/FE/INT IDs (continue numbering;
  INT6 used through INT6-074, so QA IDs start INT6-075).
- Confirm durable invariants preserved (candidate/published separation, no-secret,
  additive-only, no real network/LLM).
Validation: `git diff --check`. Do NOT touch apps/.

## Backend Agent Order
Role: Backend — Connectors Contract Draft (planning only)
Start condition: read `docs/handoffs/wave-049/PM_REPORT.md`.
Write report: `docs/handoffs/wave-049/BACKEND_REPORT.md`
Tasks:
- Draft additive endpoint(s) + DTO/enum names in
  `docs/api/MVP6_9_CONNECTORS_API_CONTRACT_DRAFT.md` (e.g. list connector catalog;
  get connector config schema (masked); run a dry-run import preview), reusing
  MVP5 import-dry-run + candidate + no-secret shapes by reference (no renames).
  All-false mutation guard; preview creates nothing; masked secrets only.
- Produce `docs/api/openapi-mvp6-9-draft.json` (OpenAPI 3.1.0, additive to
  MVP1-MVP6.8, e.g. `0.6.9-draft`). No runtime code. Capture open questions.
Validation: OpenAPI JSON parse; `git diff --check`.

## Frontend Agent Order
Role: Frontend — Connectors UX/API Requirements (planning only)
Start condition: read PM report + Backend draft if ready.
Write report: `docs/handoffs/wave-049/FRONTEND_REPORT.md`
Tasks:
- Document, in `docs/pm/MVP6_9_FRONTEND_UX_REQUIREMENTS.md`: connector catalog +
  dry-run preview UX (where it lives per ADR 0010 — likely an Analyze/Sources-area
  surface), masked-secret config UX (no raw secret shown/entered in P0), the
  explicit "preview only — nothing imported; real import routes through candidate
  review" boundary copy, preview result layout + compatibility/summary states,
  first-class loading/empty/error/permission states. Apply the closed design
  language. DTO gap analysis vs the Backend draft. No route/component/type/mock/
  smoke code.
Validation: `git diff --check`.

## QA Agent Order
Role: Integration / QA — Connectors Acceptance Checklist
Start condition: read Wave49 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-049/QA_REPORT.md`
Tasks:
- Create `docs/backlog/INT6_9_CONNECTORS_ACCEPTANCE.md` (C planning + R NOT-RUNNABLE
  runtime gates), continuing INT6 numbering (INT6-075+).
- Verify PM/BE/FE agree on the P0, catalog/preview model, the read-only + dry-run +
  no-external-write + no-real-network + masked-secret boundary, all-false guard,
  and exclusions. Confirm no runtime leaked (apps/ + infra/). OpenAPI parse. Do a
  no-raw-secret scan of the planning artifacts.
- Recommend Wave50 thin implementation, hardening, or redesign.
Validation: OpenAPI parse; runtime-leakage + no-secret scan; `git diff --check`.
