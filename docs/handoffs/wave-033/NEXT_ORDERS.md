# Next Orders - Wave 33

Status: `NEXT MVP6 THEME — CONTRACT-FIRST PLANNING ONLY`
Date: 2026-06-26

Wave32 closed the MVP6.2 Active Learning thin slice as PASS. This completes the
currently frozen MVP6 P0 surface (MVP6.1 Gold Set / Benchmark Studio + MVP6.2
Active Learning). By user direction, the commander now opens the **next MVP6
theme**.

Wave33 is **contract-first planning only**. No runtime API route, FastAPI
service, database model, Alembic migration, frontend route/component, seed,
smoke script, or test implementation may be added in Wave33. Runtime
implementation waits for a Wave34 thin-implementation order after PM freeze,
Backend contract draft, Frontend field/state/IA review, and a QA executable
checklist are all ready.

This mirrors the proven planning-wave pattern used in Wave14 (MVP3), Wave19
(MVP4), Wave23 (MVP5), and Wave30 (MVP6.2).

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read the MVP6 roadmap source of truth:
  `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`.
- Read `docs/backlog/MVP6_DRAFT_BACKLOG.md` (esp. the P1/P2 rows and the
  "MVP6.2+ roadmap breakdown" item PM6-007).
- Read the closed MVP6.1/MVP6.2 artifacts you will build on:
  `docs/pm/MVP6_PREP_BRIEF.md`, `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md`,
  `docs/api/openapi-mvp6-draft.json`, `docs/api/openapi-mvp6-2-draft.json`.
- Use `docs/handoffs/REPORT_TEMPLATE.md`.
- Finish by writing your role report in `docs/handoffs/wave-033/{ROLE}_REPORT.md`.

## Theme Selection (PM owns this)

PM must choose the **smallest coherent next P0 path** and freeze it. Candidate
themes, in rough build-on-what-exists order:

1. **Benchmark comparison / confusion matrix** (`PM6-006`, `BE6-007`,
   `FE6-006`, `INT6-009`) — compare multiple MVP6.1 evaluation runs by
   model/prompt/ontology version and relation/class buckets. Builds directly on
   the closed MVP6.1 evaluation surface; smallest delta, highest coherence.
2. **Gold Set authoring policy + dataset revisioning** (`PM6-005`, `BE6-006`,
   `FE6-007`) — expert ownership, edit/archive, dataset revisions, gold
   evidence object, import/export.
3. **A Theme-3+ slice** from the roadmap (governance workflow, impact
   simulation, copilot/agent runtime, connector/plugin SDK, multi-tenant
   runtime, ontology packs, advanced visualization/storytelling). These are
   larger and must each be cut down to a minimal auditable P0 with the same
   safety boundary if chosen.

PM should default to candidate 1 (benchmark comparison) unless there is a clear
reason to prefer another — it is the smallest coherent extension of closed
surfaces and keeps momentum. Record the choice and rationale in the PM report.

## Durable Product Invariants (apply to every theme)

- LLM/eval/learning output never writes directly to the published graph; it
  stays in candidate/analysis layers with source evidence.
- Candidate graph and published graph remain separated.
- Evidence, ontology version, prompt version, model run, and audit log
  traceability must be preserved in any new contract.
- No autonomous publish, no automatic policy enforcement, no real LLM provider
  execution in a P0 thin slice unless PM explicitly and safely freezes it.
- Additive only — do not break MVP1–MVP6.2 surfaces or smokes.

## Execution Sequence

1. PM chooses + freezes the smallest coherent next-theme P0, writes the brief,
   updates the backlog split, and defines exclusions.
2. Backend drafts an additive API contract + OpenAPI planning artifact for the
   frozen P0 (no runtime code).
3. Frontend reviews required fields/states/IA and documents UX requirements
   (no route/component code).
4. QA writes an executable acceptance checklist (`INT6-*` continuation) and
   recommends Wave34 thin implementation, targeted hardening, or PM redesign.

## PM Agent Order

Role: PM / Architect — Next MVP6 Theme P0 Freeze
Write report: `docs/handoffs/wave-033/PM_REPORT.md`

Tasks:
- Choose the smallest coherent next-theme P0 (default: benchmark comparison) and
  state the rationale.
- Create/extend a PM brief for the chosen theme (e.g.
  `docs/pm/MVP6_3_<THEME>_BRIEF.md`) freezing: P0 demo flow, source artifacts it
  may analyze, enums/states, safety boundary, and explicit exclusions.
- Update `docs/backlog/MVP6_DRAFT_BACKLOG.md` with the new theme's PM/BE/FE/INT
  backlog IDs (continue the numbering).
- Add an ADR if this introduces a new durable boundary decision.
- Confirm the durable product invariants above are preserved.

Validation: `git diff --check`.

## Backend Agent Order

Role: Backend — Next-Theme Contract Draft (planning only)
Start condition: read `docs/handoffs/wave-033/PM_REPORT.md`.
Write report: `docs/handoffs/wave-033/BACKEND_REPORT.md`

Tasks:
- Draft additive endpoint families + DTO/enum names for the frozen P0 in
  `docs/api/MVP6_3_<THEME>_API_CONTRACT_DRAFT.md`.
- Produce an OpenAPI planning artifact (e.g.
  `docs/api/openapi-mvp6-3-draft.json`) that parses as OpenAPI 3.1.0 and is
  additive to existing MVP1–MVP6.2 paths.
- Do NOT add runtime code, models, migrations, or tests this wave.
- Capture open questions for Frontend/QA.

Validation: OpenAPI JSON parse; `git diff --check`.

## Frontend Agent Order

Role: Frontend — Next-Theme UX/API Requirements (planning only)
Start condition: read `docs/handoffs/wave-033/PM_REPORT.md` and the Backend
contract draft if available.
Write report: `docs/handoffs/wave-033/FRONTEND_REPORT.md`

Tasks:
- Document route/IA placement (project-scoped, no ID-bound pages in global LNB),
  required fields, first-class loading/empty/error/permission states, and any
  DTO gaps against the Backend draft.
- Do NOT add route/component/type/mock/smoke code this wave.

Validation: `git diff --check`.

## QA Agent Order

Role: Integration / QA — Next-Theme Acceptance Checklist
Start condition: read Wave33 PM, Backend, and Frontend reports.
Write report: `docs/handoffs/wave-033/QA_REPORT.md`

Tasks:
- Create an executable acceptance checklist (continue `INT6-*` numbering) in a
  backlog doc for the chosen theme.
- Verify the planning artifacts agree on P0 flow, enums/states, source
  artifacts, safety boundary, and exclusions.
- Confirm no runtime implementation leaked into Wave33.
- Recommend one: Wave34 thin implementation, targeted contract hardening, or PM
  redesign.

Validation: OpenAPI parse if applicable; runtime-leakage search under `apps/`
and `infra/`; `git diff --check`.
