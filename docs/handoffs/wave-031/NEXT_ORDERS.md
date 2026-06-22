# Next Orders - Wave 31

Status: `MVP6.2 TARGETED CONTRACT HARDENING`
Date: 2026-06-22

Wave30 produced valid MVP6.2 planning artifacts, but QA marked the contract
`PARTIAL` because implementation-facing command/state vocabulary and several
DTO field names drift across Backend/OpenAPI and Frontend requirements.

Wave31 must close those drifts only. Do not implement runtime code.

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read Wave30 reports:
  - `docs/handoffs/wave-030/PM_REPORT.md`
  - `docs/handoffs/wave-030/BACKEND_REPORT.md`
  - `docs/handoffs/wave-030/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-030/QA_REPORT.md`
- Read Wave30 planning artifacts:
  - `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md`
  - `docs/api/MVP6_2_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp6-2-draft.json`
  - `docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md`
  - `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`
- Use `docs/handoffs/REPORT_TEMPLATE.md`.
- Finish by writing your role report in `docs/handoffs/wave-031/{ROLE}_REPORT.md`.

## Scope Guard

- Targeted contract hardening only.
- Do not add FastAPI runtime routes, services, DB models, Alembic migrations,
  seed scripts, frontend route/component code, mocks, clients, or smoke tests.
- Do not broaden MVP6.2 product scope.
- Do not open fine-tuning, live retraining, prompt mutation, extraction rerun,
  autonomous publish, automatic auto-approval enforcement, ontology governance,
  impact simulation, copilot/agent runtime, connector/plugin SDK,
  multi-tenant runtime, ontology packs, or advanced visualization/storytelling.

## Hardening Decisions To Close

Wave31 should align the docs around these implementation-facing decisions:

1. Decision vocabulary:
   - request command values are `ACCEPT` and `DISMISS`;
   - resulting suggestion states are `ACCEPTED` and `DISMISSED`;
   - `SUPERSEDED` is read-side only in P0;
   - command against non-`SUGGESTED` state returns conflict unless a later PM
     freeze adds idempotency.
2. Learning summary fields:
   - use `generated_at`;
   - use `source_artifact_scope`;
   - use `signal_counts` as typed counts, not `signal_counts_by_type`;
   - include `open_prompt_suggestion_count`,
     `accepted_prompt_suggestion_count`, `dismissed_prompt_suggestion_count`,
     `superseded_prompt_suggestion_count`,
     `high_risk_prompt_suggestion_count`, and
     `auto_approval_preview_count`.
3. Source artifact refs:
   - align Frontend requirements to `LearningSourceArtifactType` values in the
     OpenAPI artifact, including `VALIDATION_RESULT` and `EVALUATION_METRIC`.
4. Auto-approval preview:
   - use `id`, not `candidate_id`;
   - use `historical_match_preview`, not separate historical count fields;
   - carry evidence quality through `source_artifacts`, `supporting_metrics`,
     and `safety_note` unless Backend explicitly adds a named
     `evidence_quality_summary` field.

## Execution Sequence

1. PM confirms the above as final hardening decisions and updates PM/backlog
   docs only if needed.
2. Backend updates `docs/api/MVP6_2_API_CONTRACT_DRAFT.md` and
   `docs/api/openapi-mvp6-2-draft.json` to include any missing fields and
   examples.
3. Frontend updates `docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md` to align with
   Backend/OpenAPI naming and command/state vocabulary.
4. QA re-runs `INT6-012` and `INT6-014` and recommends Wave32 implementation
   only if the drift is closed.

## PM Agent Order

Role: PM / MVP6.2 Contract Hardening Freeze

Write report:

- `docs/handoffs/wave-031/PM_REPORT.md`

Backlog IDs:

- `PM6-014` Decision command/state vocabulary freeze
- `PM6-015` DTO field naming freeze

Tasks:

- Confirm that `ACCEPT`/`DISMISS` are request commands and
  `ACCEPTED`/`DISMISSED` are resulting states.
- Confirm `SUPERSEDED` is read-side only in P0.
- Confirm the summary/source-artifact/auto-approval field naming decisions in
  this order.
- Update `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md` and
  `docs/backlog/MVP6_DRAFT_BACKLOG.md` only if they need clarification.
- Do not redesign MVP6.2 scope.

Validation:

- `git diff --check`.

## Backend Agent Order

Role: Backend / MVP6.2 Contract Field Alignment

Start condition:

- Read `docs/handoffs/wave-031/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-031/BACKEND_REPORT.md`

Backlog IDs:

- `BE6-016` Decision vocabulary contract alignment
- `BE6-017` Learning summary field alignment
- `BE6-018` Source artifact and auto-approval preview field alignment

Tasks:

- Update `docs/api/MVP6_2_API_CONTRACT_DRAFT.md`.
- Update `docs/api/openapi-mvp6-2-draft.json`.
- Preserve planning-only status.
- Ensure OpenAPI includes:
  - `superseded_prompt_suggestion_count`;
  - `high_risk_prompt_suggestion_count`;
  - decision command enum `ACCEPT`, `DISMISS`;
  - suggestion state enum `SUGGESTED`, `ACCEPTED`, `DISMISSED`, `SUPERSEDED`;
  - source artifact enum values required by PM/Frontend;
  - auto-approval preview fields named as in this order.
- Keep mutation guard and preview-only semantics unchanged.

Validation:

- JSON parse for `docs/api/openapi-mvp6-2-draft.json`.
- Optional Node/schema assertion for the required fields/enums.
- `git diff --check`.

## Frontend Agent Order

Role: Frontend / MVP6.2 UX Requirement Alignment

Start condition:

- Read `docs/handoffs/wave-031/PM_REPORT.md`.
- Coordinate with Backend report or updated contract if available.

Write report:

- `docs/handoffs/wave-031/FRONTEND_REPORT.md`

Backlog IDs:

- `FE6-016` Decision vocabulary UX alignment
- `FE6-017` Backend field naming alignment

Tasks:

- Update `docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md`.
- Change decision request wording to command values `ACCEPT`/`DISMISS`.
- Preserve display/result states as `ACCEPTED`/`DISMISSED`.
- Align summary fields with Backend/OpenAPI names.
- Align source artifact enum names with Backend/OpenAPI.
- Align auto-approval preview fields with Backend/OpenAPI.
- Keep `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md` unchanged unless a tiny
  clarification is truly needed.
- Do not implement route/component/runtime code.

Validation:

- `git diff --check`.

## QA Agent Order

Role: Integration / QA

Start condition:

- Read Wave31 PM, Backend, and Frontend reports.

Write report:

- `docs/handoffs/wave-031/QA_REPORT.md`

Backlog IDs:

- `INT6-015` MVP6.2 hardening recheck
- `INT6-016` Wave32 implementation recommendation

Tasks:

- Update `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md` verdicts.
- Re-run OpenAPI JSON parse and field/enum assertions.
- Verify Frontend requirements now use `ACCEPT`/`DISMISS` for request commands
  and `ACCEPTED`/`DISMISSED` for states.
- Verify summary/source artifact/auto-approval field names are aligned across
  PM/Backend/Frontend docs.
- Confirm no runtime implementation leakage.
- Recommend one:
  - Wave32 MVP6.2 thin implementation;
  - another targeted contract hardening pass;
  - stop for PM redesign.

Validation:

- Include exact commands and artifacts.
- `git diff --check`.
