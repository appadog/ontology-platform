# MVP6.2 Frontend UX/API Requirements

Status: `WAVE31 TARGETED CONTRACT HARDENED`
Date: 2026-06-22
Owner: Frontend / UIUX Architecture

This document defines the frontend requirements for MVP6.2 Active Learning /
Continuous Improvement after Wave31 targeted contract hardening. It is
requirements only: no runtime route, component, seed, API client, or mock
fixture implementation is included in this wave.

## Source Documents

- `AGENTS.md`
- `.agents/skills/handoff-reporting/SKILL.md`
- `docs/handoffs/CURRENT_STATE.md`
- `docs/handoffs/wave-030/NEXT_ORDERS.md`
- `docs/handoffs/wave-030/PM_REPORT.md`
- `docs/handoffs/wave-031/NEXT_ORDERS.md`
- `docs/handoffs/wave-031/PM_REPORT.md`
- `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md`
- `docs/api/MVP6_2_API_CONTRACT_DRAFT.md`
- `docs/api/openapi-mvp6-2-draft.json`
- `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`
- `docs/backlog/MVP6_DRAFT_BACKLOG.md`
- `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`
- `/Users/hanati/Downloads/product_showcase_styled_components_agent_guide.md`

## Backlog Coverage

| ID | Requirement output |
|---|---|
| `FE6-011` | Learning Insights IA placement and contextual navigation |
| `FE6-012` | Correction Pattern Dashboard fields, states, and source drilldown requirements |
| `FE6-013` | Prompt Improvement Board workflow, decision, and audit requirements |
| `FE6-014` | Auto Approval Candidate Review preview-only requirements |
| `FE6-015` | Product Showcase style application plan, distilled into `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md` |
| `FE6-016` | Decision command vocabulary aligned to `ACCEPT`/`DISMISS` while preserving resulting states |
| `FE6-017` | Backend/OpenAPI field naming alignment for summary, source artifacts, and auto-approval previews |

## Scope Guard

MVP6.2 P0 is a human-reviewed recommendation loop:

```text
select project
-> view learning signal summary
-> inspect correction pattern
-> inspect prompt suggestion
-> accept/dismiss suggestion
-> see decision audit note
```

The UI must not imply that accepting a suggestion rewrites a prompt, reruns an
extraction job, approves a candidate, changes an auto-approval policy, or
mutates a published graph. Auto-approval candidates are recommendation previews
only.

Out of scope for Wave31 and MVP6.2 P0 UI: fine-tuning execution, live
retraining, dataset export execution, real provider prompt rewriting,
autonomous publish, automatic approval enforcement, ontology governance,
impact simulation, copilot/agent runtime, connector/plugin SDK, multi-tenant
runtime, ontology packs, and advanced visualization/storytelling.

## Information Architecture

Learning Insights should be a project-scoped workflow area, not a global set of
ID-bound routes.

Global LNB placement:

- Add at most one stable top-level work area when implemented:
  `Learning Insights`.
- Do not add `Pattern Detail`, `Suggestion Detail`, `Auto Approval Candidate
  Detail`, or `Decision Detail` as flat global LNB entries.
- If no project is selected, the entry should resolve to a project picker or
  selected-project required state.

Contextual navigation inside the Learning Insights area:

- Parent area: `/projects/{project_id}/learning-insights`
- Suggested contextual sections:
  - `Summary`
  - `Correction Patterns`
  - `Prompt Improvements`
  - `Auto-Approval Preview`
  - `Decision History`
- Suggested contextual detail routes or panels:
  - `/projects/{project_id}/learning-insights/patterns/{pattern_id}`
  - `/projects/{project_id}/learning-insights/suggestions/{suggestion_id}`
  - `/projects/{project_id}/learning-insights/auto-approval-candidates/{auto_approval_preview_id}`
- Detail views must be reached from parent rows, cards, breadcrumbs, tabs, or a
  right-side detail panel. They must preserve the project context and a return
  path to the parent list.

Recommended page structure:

```text
Project context header
-> Learning signal summary band
-> Action section tabs or action button bar
-> Main workflow list/board
-> Contextual detail panel
-> Decision/audit timeline
```

## UX Surfaces

### 1. Learning Signal Summary

Purpose: answer "what does the system keep getting wrong?" in the first screen.

Required content:

- Project name/id and `generated_at` timestamp.
- `signal_counts` by frozen PM taxonomy:
  - `RELATION_DIRECTION_CORRECTION`
  - `CLASS_CONFUSION`
  - `RELATION_TYPE_CONFUSION`
  - `EVIDENCE_MISSING`
  - `EVIDENCE_MISMATCH`
  - `REPEATED_VALIDATION_FAILURE`
  - `LOW_BENCHMARK_METRIC_CLUSTER`
- `open_prompt_suggestion_count`, `accepted_prompt_suggestion_count`,
  `dismissed_prompt_suggestion_count`, and
  `superseded_prompt_suggestion_count`.
- `high_risk_prompt_suggestion_count`.
- `auto_approval_preview_count` with explicit `not enforced` semantics.
- `source_artifact_scope` summary for MVP3, MVP4, and MVP6.1 artifacts.
- Stale/unavailable indicator when applicable.

Product workflow treatment:

- Use one strong summary card for the primary learning-health story.
- Use secondary metric cards for counts, risk, coverage, and recent decisions.
- Provide quick filters into correction patterns, prompt suggestions, and
  auto-approval previews.
- Avoid presenting the summary as only a raw table of enum counts.

### 2. Correction Pattern Dashboard

Purpose: show repeated correction patterns with source-backed examples and
clear confidence boundaries.

Required content:

- Pattern id, project id, title, and plain-language explanation.
- Primary signal type and related signal types.
- Affected ontology class/relation ids when available.
- Support count and denominator when measurable.
- Example count, first seen, and last seen.
- Source artifact references and representative examples.
- Safety note when evidence is thin, conflicting, or not measurable.
- Related prompt suggestion ids when available.

Required interactions:

- Filter by signal type, affected ontology object, source artifact type,
  prompt version, model run, risk/confidence, and time range when fields exist.
- Select a pattern to open a contextual detail panel.
- Detail panel order:
  1. explanation and support summary;
  2. representative examples with before/after or candidate-vs-gold context;
  3. source artifact refs;
  4. related prompt suggestions;
  5. safety note.

Product workflow treatment:

- Use selected rows/cards with signal badges and source coverage indicators.
- Use a compact evidence/example preview before any action prompt.
- Use tables only inside secondary drilldown sections; the main dashboard
  should read as a prioritized workflow queue.

### 3. Prompt Improvement Board

Purpose: let a human inspect, accept, or dismiss a prompt recommendation while
preserving audit-only semantics.

Required content:

- Suggestion id, project id, title, kind, and state.
- Suggestion states: `SUGGESTED`, `ACCEPTED`, `DISMISSED`, `SUPERSEDED`.
- Suggestion kinds:
  - `ADD_RELATION_DIRECTION_EXAMPLE`
  - `CLARIFY_CLASS_BOUNDARY`
  - `CLARIFY_RELATION_TYPE_BOUNDARY`
  - `ADD_EVIDENCE_REQUIREMENT`
  - `ADD_NEGATIVE_EXAMPLE`
  - `ADD_VALIDATION_FAILURE_GUIDANCE`
  - `INVESTIGATE_LOW_METRIC_CLUSTER`
- Rationale, expected impact, and preview text or structured proposal.
- Target prompt version id when known.
- Source learning signal ids, correction pattern ids, and source artifacts.
- Confidence label and risk label: `LOW`, `MEDIUM`, `HIGH`.
- Created/updated timestamps and `decision_audit_note` when decided.

Required interactions:

- Board/list grouping by state, with `SUGGESTED` as the default work queue.
- Select suggestion to inspect source patterns and preview text.
- Accept action sends command value `ACCEPT` and records human intent for
  future prompt drafting only. The resulting display/state value is
  `ACCEPTED`.
- Dismiss action sends command value `DISMISS` and requires one reason code.
  The resulting display/state value is `DISMISSED`.
  - `NOT_RELEVANT`
  - `INSUFFICIENT_EVIDENCE`
  - `DUPLICATE`
  - `OUT_OF_SCOPE`
  - `RISK_TOO_HIGH`
  - `OTHER`
- `SUPERSEDED` is read-side only in MVP6.2 P0. It is never offered as a human
  decision command.
- Decision actions are enabled only for `SUGGESTED` suggestions. A command
  against `ACCEPTED`, `DISMISSED`, or `SUPERSEDED` should surface the Backend
  conflict response by default unless a later PM freeze adds idempotency.
- Decision confirmation UI must state that no prompt, candidate, policy, job,
  or published graph is mutated.
- After decision, show the created decision audit note in context.

Product workflow treatment:

- Use action-oriented cards or rows with risk/confidence badges.
- Use a detail panel with source-backed rationale and preview text.
- Use a decision modal or drawer with a short summary header, reason field, and
  audit-only safety copy.
- Do not label accepted suggestions as "applied" or "deployed".

### 4. Auto Approval Candidate Review

Purpose: show where a future auto-approval policy might be safe while keeping
P0 preview-only boundaries visible.

Required content:

- Auto-approval preview `id` and project id.
- Rule preview title and structured rule criteria.
- Supporting metrics and correction patterns.
- Historical match preview.
- Source artifacts and representative examples when exposed by the API.
- Evidence quality should be conveyed through `supporting_metrics`,
  `historical_match_preview`, `source_artifacts`, and `safety_note`.
- Risk/confidence labels and safety note.
- Enforcement status semantics: recommendation only, not enforced, requires
  later policy approval.

Required interactions:

- View candidate rule preview.
- Inspect historical matches and source signals.
- Link back to related correction patterns and prompt suggestions.
- No create, edit, enable, enforce, approve, reject, publish, or policy
  mutation action is available in MVP6.2 P0.

Product workflow treatment:

- Use warning/info surfaces to make preview-only status visible.
- Disabled enforcement controls may appear only if they explain the boundary;
  otherwise omit enforcement buttons entirely.
- The primary action should be inspection/navigation, not activation.

### 5. Decision History

Purpose: make the improvement loop auditable.

Required content:

- Decision id and suggestion id.
- Actor id and actor role.
- Decision command value and resulting suggestion state.
- Reason code when required.
- Note when supplied.
- `decided_at` timestamp.
- Suggestion snapshot at decision time.
- Source learning signal ids and target prompt/version context.

Required interactions:

- Timeline grouped by suggestion or date.
- Link from a decided suggestion to its audit note.
- Link from an audit note back to source signals and correction patterns.

## State Requirements

| State | Required behavior |
|---|---|
| Loading | Skeleton or staged loading for summary, lists, and detail panel. Do not show zero counts before data arrives. |
| Empty summary | Explain that no traceable learning signals exist for the selected project yet. Point to review, quality, or evaluation artifacts without opening new runtime scope. |
| Empty correction patterns | Show that signals exist but no repeated pattern passed the grouping threshold, or that source artifacts are missing. |
| Empty prompt suggestions | Show that no human decision is needed. Do not imply the system has improved itself. |
| Empty auto-approval candidates | Show that no safe preview candidate is available. Keep enforcement out of scope. |
| Empty decision history | Show that no accept/dismiss decision has been recorded yet. |
| Error | Preserve project context, show retry affordance, and distinguish unavailable source artifacts from server/API failure when the backend exposes it. |
| Permission-limited | Show readable summary where allowed, hide or disable decision actions, and state which permission is needed to accept/dismiss. |
| Stale data | If `generated_at` or source snapshot version is stale, mark the summary and affected sections without blocking read access. |
| Superseded | Keep historical suggestions visible but visually de-prioritized. Do not allow new accept/dismiss on superseded suggestions. |

## Backend Contract Fields

This section is aligned to the Wave31 PM hardening freeze and the MVP6.2
Backend/OpenAPI naming convention: DTO/schema names use PascalCase, JSON fields
use snake_case, enum literals use UPPER_SNAKE_CASE. `Blocking` fields are
needed for P0 UX correctness and QA acceptance. `Optional` fields improve
usability but can be deferred without changing the P0 flow.

### Common Blocking Fields

- `project_id`
- `generated_at` for the learning summary freshness timestamp
- stable ids for signals, patterns, suggestions, auto-approval previews, and
  decision audit notes
- source artifact references for every signal, pattern, suggestion, and
  preview candidate
- permission or capability hints for decision actions when the API can expose
  them

### Source Artifact Reference

Blocking fields:

- `artifact_type`: one of the Backend/OpenAPI `LearningSourceArtifactType`
  values:
  - `REVIEW_DECISION`
  - `REVIEW_CORRECTION`
  - `VALIDATION_RESULT`
  - `QUALITY_METRIC`
  - `QUALITY_DRILLDOWN`
  - `EVALUATION_RUN`
  - `EVALUATION_METRIC`
  - `EVALUATION_ERROR_CASE`
- `artifact_id`
- `project_id`
- evidence locator or evidence ref when available
- ontology version context when available
- prompt version, model run, parser, or evaluation run context when available
- route or display label sufficient for contextual navigation

Optional fields:

- source domain bucket
- human-readable source title
- reviewer display name
- compact quote/snippet preview

### Learning Signal Summary

Blocking fields:

- `generated_at`
- `source_artifact_scope`
- `signal_counts` covering all frozen signal taxonomy values
- `total_signal_count`
- `open_prompt_suggestion_count`
- `accepted_prompt_suggestion_count`
- `dismissed_prompt_suggestion_count`
- `superseded_prompt_suggestion_count`
- `high_risk_prompt_suggestion_count`
- `auto_approval_preview_count`

Optional fields:

- trend deltas by signal type
- top affected classes/relations
- last decision summary
- stale source warning details

### Correction Pattern

Blocking fields:

- `id`
- `project_id`
- `primary_signal_type`
- `related_signal_types`
- `title`
- `explanation`
- `support_count`
- `denominator`
- `affected_classes`
- `affected_relations`
- `representative_examples`
- `source_learning_signal_ids`
- `source_artifacts`
- `first_seen_at`
- `last_seen_at`
- `safety_note`
- `prompt_suggestion_ids`

Optional fields:

- display names for affected classes/relations
- grouped by prompt version/model run/source type
- trend sparkline or severity score
- related prompt suggestion ids

### Prompt Suggestion

Blocking fields:

- `id`
- `project_id`
- `target_prompt_version_id`
- `suggestion_kind`
- `state`
- `title`
- `rationale`
- `expected_impact`
- `preview_text` or `structured_proposal`
- `source_learning_signal_ids`
- `correction_pattern_ids`
- `source_artifacts`
- `confidence_label`
- `risk_label`
- `created_at`
- `updated_at`
- `decision_audit_note`
- `safety_note`

Optional fields:

- target prompt version display label
- affected prompt section
- duplicate/superseded-by suggestion id
- estimated metric impact range

### Suggestion Decision

Blocking request fields:

- `decision`: `ACCEPT` or `DISMISS`
- `dismiss_reason_code` for `DISMISS`
- `note`
- `intended_next_action` for accepted suggestions when supported
- `client_request_id` when supported as future idempotency metadata

Blocking response fields:

- `suggestion_id`
- `project_id`
- `previous_state`
- `new_state`
- `decision_audit_note`

Blocking audit note fields inside `decision_audit_note`:

- `id`
- `actor_id`
- `actor_role`
- `decision`
- `dismiss_reason_code`
- `note`
- `decided_at`
- `suggestion_snapshot`
- `source_learning_signal_ids`
- `target_prompt_version_id`
- `mutation_guard`
- resulting suggestion `state`

Optional fields:

- actor display name
- permission/capability explanation
- audit event route hint

Mutation boundary:

- The decision endpoint may create an audit decision record and update the
  suggestion state only.
- It must not mutate prompt versions, extraction jobs, candidates, review
  decisions, auto-approval policies, publish jobs, or published graph state.
- A decision command against a non-`SUGGESTED` state returns a conflict by
  default. The UI should show that conflict as an already-decided or historical
  suggestion state, not retry silently as a successful action.

### Auto-Approval Candidate Preview

Blocking fields:

- `id`
- `project_id`
- `title`
- `preview_status`
- `recommendation_only`
- `not_enforced`
- `requires_later_policy_approval`
- `rule_preview`
- `supporting_metrics`
- `correction_pattern_ids`
- `source_learning_signal_ids`
- `source_artifacts`
- `historical_match_preview`
- `risk_label`
- `confidence_label`
- `safety_note`
- `blocked_actions`

Optional fields:

- sample historical matches
- estimated false positive risk explanation
- related prompt suggestion ids
- policy owner or reviewer recommendation

## Frontend Acceptance Notes

- Learning Insights must feel like a guided product workflow: summary, triage,
  inspect, decide, audit.
- Tables may appear in drilldowns, but the primary interaction must use cards,
  queue rows, boards, badges, panels, and decision/audit surfaces.
- Detail pages must be contextual to the parent Learning Insights area.
- Every visible recommendation must preserve traceable source artifacts.
- Every accept/dismiss affordance must preserve the audit-only safety boundary.
- Permission-limited users can inspect allowed read surfaces but cannot create
  decisions.
