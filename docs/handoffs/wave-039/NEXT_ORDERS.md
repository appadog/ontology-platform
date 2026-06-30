# Next Orders - Wave 39

Status: `NEXT MVP6 THEME — CONTRACT-FIRST PLANNING ONLY`
Date: 2026-06-29

Closed MVP6 themes: 6.1 Gold Set/Benchmark Studio, 6.2 Active Learning,
6.3 Benchmark Comparison. UI/UX review remediation + reference-driven design
upgrade are also closed (Wave35-38). By user direction, open the NEXT MVP6 theme.

Wave39 is **contract-first planning only**. No runtime API route, FastAPI
service, DB model, Alembic migration, frontend route/component, seed, smoke, or
test implementation may be added this wave. Runtime implementation waits for a
Wave40 thin-implementation order after PM freeze + Backend contract draft +
Frontend field/state/IA review + QA executable checklist are all ready. Mirrors
the proven planning-wave pattern (Wave14/19/23/30/33).

## Common Rules
- Read `AGENTS.md` first; `.agents/skills/handoff-reporting/SKILL.md`;
  `docs/handoffs/CURRENT_STATE.md`; this file.
- Read the MVP6 roadmap source of truth:
  `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`.
- Read `docs/backlog/MVP6_DRAFT_BACKLOG.md` (esp. P1/P2 rows: PM6-005/006/007,
  BE6-006/007, FE6-007, INT6-009; and the "MVP6.2+ roadmap breakdown" PM6-007).
- Build on the closed MVP6.1 evaluation surface you may extend:
  `docs/pm/MVP6_PREP_BRIEF.md`, `docs/api/openapi-mvp6-draft.json`, and the
  evaluation module under `apps/backend/app/modules/`.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-039/{ROLE}_REPORT.md`.

## Theme Selection (PM owns this)
PM chooses the **smallest coherent next P0** and freezes it. Candidates, in
build-on-what-exists order:
1. **Gold Set authoring policy + dataset revisioning** (`PM6-005`, `BE6-006`,
   `FE6-007`) — expert ownership, edit/archive, dataset revisions, a standalone
   gold-evidence object, import/export. Smallest coherent extension of the
   closed MVP6.1 evaluation surface. **Commander default — choose this unless the
   roadmap gives a clear reason otherwise.**
2. A Theme-3+ slice (governance workflow, impact simulation, copilot/agent
   runtime, connector/plugin SDK, multi-tenant runtime, ontology packs, advanced
   visualization) — larger; must be cut to a minimal auditable P0 with the same
   safety boundary if chosen.

## Durable Product Invariants (apply to any theme)
- LLM/eval/learning output never writes directly to the published graph; stays
  in candidate/analysis layers with source evidence.
- Candidate graph and published graph remain separated.
- Evidence, ontology version, prompt version, model run, audit log traceability
  preserved in any new contract.
- No autonomous publish, no automatic policy enforcement, no real LLM provider
  execution in a P0 thin slice unless PM explicitly and safely freezes it.
- Additive only — do not break MVP1-MVP6.3 surfaces or smokes.

## Execution Sequence
1. PM chooses + freezes the smallest coherent next-theme P0, writes the brief,
   updates the backlog split, defines exclusions, adds an ADR if it introduces a
   durable boundary.
2. Backend drafts an additive API contract + OpenAPI planning artifact (no
   runtime code).
3. Frontend reviews required fields/states/IA, documents UX requirements (no
   route/component code).
4. QA writes an executable acceptance checklist (continue `INT6-*`) and
   recommends Wave40 thin implementation, targeted hardening, or PM redesign.

## PM Agent Order
Role: PM / Architect — Next MVP6 Theme P0 Freeze
Write report: `docs/handoffs/wave-039/PM_REPORT.md`
Backlog ID: `PM6-021` (next-theme P0 freeze)

Tasks:
- Choose the smallest coherent next-theme P0 (default: Gold Set authoring +
  dataset revisioning) and state the rationale.
- Create a PM brief (e.g. `docs/pm/MVP6_4_<THEME>_BRIEF.md`) freezing: P0 demo
  flow, source artifacts it touches, enums/states, safety boundary, exclusions,
  and (for Gold Set) the authoring/edit/archive + dataset-revision + gold-evidence
  + import/export policy and how it preserves evidence/version traceability and
  evaluation reproducibility.
- Update `docs/backlog/MVP6_DRAFT_BACKLOG.md` with the new theme's PM/BE/FE/INT
  backlog IDs (continue numbering).
- Add an ADR under `docs/adr/` (next number after 0010) if a durable boundary
  decision is introduced.
- Confirm the durable invariants above are preserved.

Validation: `git diff --check`. Do NOT touch apps/.

## Backend Agent Order
Role: Backend — Next-Theme Contract Draft (planning only)
Start condition: read `docs/handoffs/wave-039/PM_REPORT.md`.
Write report: `docs/handoffs/wave-039/BACKEND_REPORT.md`

Tasks:
- Draft additive endpoint families + DTO/enum names for the frozen P0 in
  `docs/api/MVP6_4_<THEME>_API_CONTRACT_DRAFT.md`, reusing existing MVP6.1
  evaluation shapes by reference (no renames).
- Produce an OpenAPI planning artifact (e.g. `docs/api/openapi-mvp6-4-draft.json`)
  that parses as OpenAPI 3.1.0 and is additive to MVP1-MVP6.3 paths.
- No runtime code/models/migrations/tests this wave. Capture open questions.

Validation: OpenAPI JSON parse; `git diff --check`.

## Frontend Agent Order
Role: Frontend — Next-Theme UX/API Requirements (planning only)
Start condition: read `docs/handoffs/wave-039/PM_REPORT.md` + Backend draft if ready.
Write report: `docs/handoffs/wave-039/FRONTEND_REPORT.md`

Tasks:
- Document route/IA placement (project-scoped, contextual to the existing
  Evaluation/Gold Set surface, no ID-bound pages in the global LNB per ADR 0010),
  required fields, first-class loading/empty/error/permission states, and any DTO
  gaps vs the Backend draft. Apply the closed design language (tokens, Section+Card,
  KO titles, status badges).
- No route/component/type/mock/smoke code this wave.

Validation: `git diff --check`.

## QA Agent Order
Role: Integration / QA — Next-Theme Acceptance Checklist
Start condition: read Wave39 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-039/QA_REPORT.md`

Tasks:
- Create an executable acceptance checklist (continue `INT6-*`) in a backlog doc.
- Verify PM/Backend/Frontend planning artifacts agree on P0 flow, enums/states,
  source artifacts, safety boundary, exclusions.
- Confirm no runtime implementation leaked into Wave39 (search under apps/ + infra/).
- Recommend Wave40 thin implementation, targeted hardening, or PM redesign.

Validation: OpenAPI parse if applicable; runtime-leakage search; `git diff --check`.
