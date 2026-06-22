# Next Orders - Wave 30

Status: `MVP6.2 ACTIVE LEARNING CONTRACT-FIRST PLANNING`
Date: 2026-06-22

Wave29 closed MVP6.1 Gold Set / Benchmark Studio hardening as PASS. Wave30 opens
MVP6.2 Theme 2, Active Learning / Continuous Improvement, as contract-first
planning only.

Do not implement runtime code until the PM freeze, Backend contract draft,
Frontend field/state/IA review, and QA checklist are complete.

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read Wave29 reports:
  - `docs/handoffs/wave-029/PM_REPORT.md`
  - `docs/handoffs/wave-029/BACKEND_REPORT.md`
  - `docs/handoffs/wave-029/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-029/QA_REPORT.md`
- Read:
  - `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`
  - `docs/pm/MVP6_PREP_BRIEF.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/backlog/INT6_MVP6_ACCEPTANCE.md`
- Use `docs/handoffs/REPORT_TEMPLATE.md`.
- Finish by writing your role report in `docs/handoffs/wave-030/{ROLE}_REPORT.md`.

## Scope Guard

- MVP6.2 planning only.
- Focus on the smallest continuous-improvement loop after MVP6.1:
  review/correction/evaluation artifacts -> learning signals -> prompt
  suggestions -> accept/dismiss decision capture.
- Do not implement runtime API, database migration, frontend route code, or seed
  code in Wave30.
- Do not add real fine-tuning, live retraining, real provider prompt rewriting,
  autonomous approval, candidate/published graph mutation, ontology governance,
  impact simulation, copilot/agent runtime, connector/plugin SDK,
  multi-tenant runtime, ontology packs, or advanced visualization/storytelling.
- Auto-approval in MVP6.2 planning must be recommendation/preview only unless a
  later PM freeze explicitly promotes enforcement.

## Execution Sequence

1. PM freezes the MVP6.2 P0 boundary and updates MVP6 backlog/docs.
2. Backend drafts additive API/DTO/OpenAPI planning artifacts only.
3. Frontend drafts Learning Insights IA, field/state requirements, and style
   direction only.
4. QA writes the MVP6.2 acceptance checklist and recommends Wave31
   implementation or another contract hardening pass.

## PM Agent Order

Role: PM / MVP6.2 Active Learning Scope Freeze

Write report:

- `docs/handoffs/wave-030/PM_REPORT.md`

Backlog IDs:

- `PM6-010` MVP6.2 P0 scope freeze
- `PM6-011` Learning signal taxonomy
- `PM6-012` Prompt suggestion and decision policy
- `PM6-013` Auto-approval candidate safety boundary

Tasks:

- Freeze the smallest MVP6.2 P0 demo flow. Recommended draft:
  `select project -> view learning signal summary -> inspect correction pattern -> inspect prompt suggestion -> accept/dismiss suggestion -> see decision audit note`.
- Define the learning signal taxonomy:
  - relation direction correction;
  - class confusion;
  - relation type confusion;
  - evidence missing/mismatch;
  - repeated validation failure;
  - low benchmark metric cluster.
- Decide which source artifacts MVP6.2 P0 may analyze:
  - MVP3 review/correction history;
  - MVP4 quality metrics;
  - MVP6.1 evaluation errors/metrics.
- Define prompt suggestion states and decision rules.
- Define auto-approval candidate scope as recommendation/preview only.
- Explicitly exclude fine-tuning execution, live retraining, autonomous publish,
  and automatic policy enforcement from P0.
- Update `docs/backlog/MVP6_DRAFT_BACKLOG.md` and create or update a PM brief
  for MVP6.2, such as `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md`.

Validation:

- `git diff --check`.

## Backend Agent Order

Role: Backend / MVP6.2 Contract Draft

Start condition:

- Read `docs/handoffs/wave-030/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-030/BACKEND_REPORT.md`

Backlog IDs:

- `BE6-012` Learning signal API contract
- `BE6-013` Correction pattern and prompt suggestion DTOs
- `BE6-014` Suggestion decision API contract
- `BE6-015` MVP6.2 OpenAPI planning artifact

Tasks:

- Draft additive API/DTO contract only; do not implement runtime code.
- Recommended endpoint families:
  - `GET /api/v1/projects/{project_id}/learning-signals/summary`
  - `GET /api/v1/projects/{project_id}/learning-signals/correction-patterns`
  - `GET /api/v1/projects/{project_id}/learning-signals/prompt-suggestions`
  - `GET /api/v1/projects/{project_id}/learning-signals/auto-approval-candidates`
  - `POST /api/v1/learning-signal-suggestions/{suggestion_id}/decisions`
- Include examples for correction pattern, prompt suggestion, auto-approval
  candidate preview, and decision audit note.
- Ensure contracts are read-mostly and cannot mutate candidates, published
  graph, prompt versions, or auto-approval policies directly.
- Create or update `docs/api/MVP6_2_API_CONTRACT_DRAFT.md`.
- If practical, create a planning-only OpenAPI artifact
  `docs/api/openapi-mvp6-2-draft.json`.

Validation:

- JSON parse for any OpenAPI artifact you create.
- `git diff --check`.

## Frontend Agent Order

Role: Frontend / MVP6.2 UX and API Requirements

Start condition:

- Read `docs/handoffs/wave-030/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-030/FRONTEND_REPORT.md`

Backlog IDs:

- `FE6-011` Learning Insights IA
- `FE6-012` Correction Pattern Dashboard requirements
- `FE6-013` Prompt Improvement Board requirements
- `FE6-014` Auto Approval Candidate Review requirements
- `FE6-015` Product Showcase style application plan

Tasks:

- Draft Frontend requirements only; do not implement route/component code.
- Define IA placement for Learning Insights without flattening ID-bound pages in
  the global LNB.
- Define states for summary, correction patterns, prompt suggestions,
  auto-approval candidates, decision history, loading, empty, error, and
  permission-limited views.
- Review fields required from Backend contract and note blocking/optional fields.
- Translate `/Users/hanati/Downloads/product_showcase_styled_components_agent_guide.md`
  into repo-owned guidance if useful, for example
  `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md`, without large implementation.
- Make sure the planned UI reads like a product workflow, not a raw admin table.

Validation:

- `git diff --check`.

## QA Agent Order

Role: Integration / QA

Start condition:

- Read Wave30 PM, Backend, and Frontend reports.

Write report:

- `docs/handoffs/wave-030/QA_REPORT.md`

Backlog IDs:

- `INT6-011` MVP6.2 scope alignment
- `INT6-012` Active Learning contract checklist
- `INT6-013` Learning signal safety guard
- `INT6-014` Wave31 implementation recommendation

Tasks:

- Create `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`.
- Validate Wave30 did not implement runtime code or broaden into later MVP6
  themes.
- Validate PM/Backend/Frontend agree on:
  - learning signal taxonomy;
  - source artifacts;
  - prompt suggestion states;
  - suggestion decision/audit behavior;
  - auto-approval candidate preview safety;
  - no candidate/published graph mutation.
- Confirm OpenAPI planning artifact parses if created.
- Recommend one:
  - Wave31 MVP6.2 thin implementation;
  - targeted Wave31 contract hardening;
  - stop for PM redesign.

Validation:

- Include exact commands and artifacts.
- `git diff --check`.
