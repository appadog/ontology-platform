# INT6.2 MVP6.2 Active Learning Acceptance Checklist

Status: `WAVE32 QA RUNTIME ACCEPTANCE / THIN SLICE CLOSEOUT RECOMMENDED`
Date: 2026-06-26
Owner: QA / Integration

This checklist turns `INT6-011` through `INT6-016` into contract-first
acceptance criteria for MVP6.2 Active Learning / Continuous Improvement.
Wave30 established the planning contract, and Wave31 closed the targeted
command/state and DTO naming hardening gate. Runtime API, database migration,
frontend route or component code, seed data, smoke script, and test
implementation remain out of scope until Wave32 explicitly opens thin
implementation.

## Source Documents

- Agent rules: `AGENTS.md`
- Handoff process: `.agents/skills/handoff-reporting/SKILL.md`
- Current state: `docs/handoffs/CURRENT_STATE.md`
- Wave order: `docs/handoffs/wave-030/NEXT_ORDERS.md`
- Wave31 order: `docs/handoffs/wave-031/NEXT_ORDERS.md`
- Wave30 PM report: `docs/handoffs/wave-030/PM_REPORT.md`
- Wave30 Backend report: `docs/handoffs/wave-030/BACKEND_REPORT.md`
- Wave30 Frontend report: `docs/handoffs/wave-030/FRONTEND_REPORT.md`
- Wave31 PM report: `docs/handoffs/wave-031/PM_REPORT.md`
- Wave31 Backend report: `docs/handoffs/wave-031/BACKEND_REPORT.md`
- Wave31 Frontend report: `docs/handoffs/wave-031/FRONTEND_REPORT.md`
- MVP6 roadmap: `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`
- MVP6 backlog: `docs/backlog/MVP6_DRAFT_BACKLOG.md`
- PM brief: `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md`
- API draft: `docs/api/MVP6_2_API_CONTRACT_DRAFT.md`
- OpenAPI draft: `docs/api/openapi-mvp6-2-draft.json`
- Frontend requirements: `docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md`
- Frontend style guide: `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md`

## MVP6.2 P0 Boundary

Frozen P0 demo flow:

```text
select project
-> view learning signal summary
-> inspect correction pattern
-> inspect prompt suggestion
-> accept/dismiss suggestion
-> see decision audit note
```

P0 is an auditable recommendation loop. It may analyze approved existing
artifacts and record human suggestion decisions. It must not make the
improvement automatically.

Approved source artifact families:

- MVP3 review/correction history, validation results, and review decision
  audit context.
- MVP4 quality metrics and validation or quality drilldown evidence.
- MVP6.1 evaluation runs, metrics, error cases, and candidate-vs-gold context.

P0 exclusions:

- fine-tuning execution;
- live retraining;
- training dataset export execution;
- real provider prompt rewriting;
- prompt version mutation;
- extraction job creation or rerun;
- candidate review mutation;
- candidate graph mutation;
- published graph mutation;
- auto-approval policy create/update/enable/enforce;
- autonomous publish;
- ontology governance workflow;
- impact simulation;
- copilot or agent runtime;
- connector/plugin SDK;
- multi-tenant runtime;
- ontology packs;
- advanced visualization/storytelling.

## Verdict Semantics

- `PASS`: planning artifacts agree and preserve the safety boundary.
- `PARTIAL`: contract is usable for review, but named fields/enums or
  implementation-facing details need targeted hardening before runtime work.
- `FAIL`: planning opens forbidden runtime scope, removes evidence/version
  traceability, or allows prompt/candidate/published graph/policy mutation.
- `NOT RUNNABLE`: expected for runtime checks before Wave32 because no MVP6.2
  runtime implementation exists by design.

## Current Wave31 QA Recheck Verdict

| ID | Verdict | QA note |
|---|---|---|
| `INT6-011` | `PASS` | PM, Backend, and Frontend still agree on the P0 demo flow, source artifact families, planning-only boundary, and later-theme exclusions. Runtime leakage search found no MVP6.2 learning-signal implementation under `apps/` or `infra/`. |
| `INT6-012` | `PASS` | Wave31 closed the contract drift. PM, Backend/OpenAPI, and Frontend now align on request commands `ACCEPT`/`DISMISS`, resulting states `ACCEPTED`/`DISMISSED`, read-side-only `SUPERSEDED`, default conflict on non-`SUGGESTED` commands, summary fields, source artifact enum values, and auto-approval preview field names. |
| `INT6-013` | `PASS` | Decision audit and auto-approval preview safety are consistent: no prompt, candidate, published graph, evaluation run, extraction job, or auto-approval policy mutation is allowed. Auto-approval candidates are recommendation-only and not enforced. |
| `INT6-014` | `PASS` | Targeted hardening is complete. No additional PM redesign or contract-hardening wave is required before Wave32 thin implementation. |
| `INT6-015` | `PASS` | Wave31 hardening recheck passed OpenAPI JSON parse, Node required field/enum assertions, Frontend old-drift term search, runtime leakage search, and whitespace checks. |
| `INT6-016` | `PASS` | Recommend Wave32 MVP6.2 thin implementation with the frozen planning contract and the same no-mutation safety boundary. |

## INT6-011 Scope Alignment Checks

Exit criterion: `PASS` when all checks below are true.

- P0 flow is the same across PM brief, Backend API draft, Frontend
  requirements, and role reports.
- Source artifact scope is restricted to MVP3, MVP4, and MVP6.1 closed
  surfaces.
- Active learning uses source-backed signals and correction patterns, not raw
  published graph facts as training labels.
- Wave30 changed only documentation or planning contract artifacts.
- No MVP6.2 runtime API route, FastAPI service, database model, Alembic
  migration, frontend route/component, seed, smoke script, or test
  implementation is introduced.
- Later MVP6 themes remain excluded unless separately frozen by PM.

Wave31 recheck result: `PASS`.

## INT6-012 Active Learning Contract Checklist

Exit criterion: `PASS` when taxonomy, states, source refs, endpoint families,
and DTO field names are aligned enough for implementation without guesswork.

Required endpoint families:

```text
GET  /api/v1/projects/{project_id}/learning-signals/summary
GET  /api/v1/projects/{project_id}/learning-signals/correction-patterns
GET  /api/v1/projects/{project_id}/learning-signals/prompt-suggestions
GET  /api/v1/projects/{project_id}/learning-signals/auto-approval-candidates
POST /api/v1/learning-signal-suggestions/{suggestion_id}/decisions
```

Required learning signal taxonomy:

```text
RELATION_DIRECTION_CORRECTION
CLASS_CONFUSION
RELATION_TYPE_CONFUSION
EVIDENCE_MISSING
EVIDENCE_MISMATCH
REPEATED_VALIDATION_FAILURE
LOW_BENCHMARK_METRIC_CLUSTER
```

Required prompt suggestion states:

```text
SUGGESTED
ACCEPTED
DISMISSED
SUPERSEDED
```

Required decision command values:

```text
ACCEPT
DISMISS
```

Decision state transition expectation:

- `ACCEPT` moves a `SUGGESTED` suggestion to `ACCEPTED`.
- `DISMISS` moves a `SUGGESTED` suggestion to `DISMISSED`.
- `SUPERSEDED` is a read-side state, not a human command in MVP6.2 P0.
- A decision against `ACCEPTED`, `DISMISSED`, or `SUPERSEDED` should return a
  conflict unless a later PM/runtime freeze adds idempotency behavior.

Wave31 hardening closure:

- Frontend `Suggestion Decision` request wording now uses Backend/OpenAPI
  command values `ACCEPT`/`DISMISS`, while preserving resulting states
  `ACCEPTED`/`DISMISSED`.
- PM, Backend/OpenAPI, and Frontend all state that `SUPERSEDED` is read-side
  only in MVP6.2 P0.
- PM, Backend/OpenAPI, and Frontend all state that commands against
  non-`SUGGESTED` suggestions return a conflict by default unless a later PM
  freeze adds idempotency behavior.
- Summary fields are aligned to `generated_at`, `source_artifact_scope`,
  `signal_counts`, `open_prompt_suggestion_count`,
  `accepted_prompt_suggestion_count`, `dismissed_prompt_suggestion_count`,
  `superseded_prompt_suggestion_count`,
  `high_risk_prompt_suggestion_count`, and
  `auto_approval_preview_count`.
- Source artifact enum values include `VALIDATION_RESULT` and
  `EVALUATION_METRIC` across PM, Backend/OpenAPI, and Frontend requirements.
- Auto-approval preview fields are aligned to `id`,
  `historical_match_preview`, `source_artifacts`, `supporting_metrics`, and
  `safety_note`. `evidence_quality_summary` is not required in P0.

Wave31 recheck result: `PASS`.

## INT6-013 Learning Signal Safety Guard

Exit criterion: `PASS` when all learning-signal and suggestion paths preserve
candidate/published graph separation, evidence traceability, and policy safety.

Required checks:

- Every learning signal, correction pattern, prompt suggestion, and
  auto-approval preview retains source artifact references.
- A signal without traceable source artifacts is invalid for P0 display and
  cannot create a prompt suggestion.
- Suggestion accept/dismiss writes only a decision audit note and suggestion
  state transition.
- Decision response exposes mutation guard evidence or equivalent behavior:
  - prompt version not mutated;
  - candidate graph not mutated;
  - published graph not mutated;
  - auto-approval policy not mutated;
  - extraction job not started;
  - evaluation run not started.
- Accepted suggestions are labeled as future prompt-drafting intent, not
  applied/deployed prompt changes.
- Dismissed suggestions require a reason code.
- Auto-approval candidates are recommendation-only, not enforced, and require
  later policy approval.
- No UI or API copy implies autonomous approval, autonomous publish, live
  retraining, or production-safe enforcement.

Wave31 recheck result: `PASS`.

## INT6-014 Wave32 Recommendation

Recommended next step: `WAVE32 MVP6.2 THIN IMPLEMENTATION`.

Why:

- Scope, safety, and OpenAPI parse remain healthy.
- The Product Showcase style guide is repo-owned guidance, not a mechanical
  copy of the external guide.
- Wave31 closed the implementation-facing DTO and enum wording drifts.
- No PM redesign or additional targeted hardening pass is needed.

Wave32 implementation should remain thin and additive:

1. Implement only the frozen endpoint families and DTO names.
2. Preserve decision audit-only semantics and default non-`SUGGESTED` conflict.
3. Keep auto-approval previews recommendation-only and not enforced.
4. Add deterministic seed/mock/smoke evidence only for the approved P0 flow.
5. Do not broaden into fine-tuning, live retraining, prompt mutation, candidate
   mutation, published graph mutation, policy enforcement, governance workflow,
   copilot/agent runtime, connector/plugin SDK, or multi-tenant runtime.

Wave31 recheck result: `PASS`.

## INT6-015 MVP6.2 Hardening Recheck

Exit criterion: `PASS` when Wave31 PM, Backend/OpenAPI, and Frontend artifacts
are aligned on the hardened command/state vocabulary and DTO field names, and
when scope guard checks show no MVP6.2 runtime implementation leakage.

Wave31 verification result: `PASS`.

- OpenAPI JSON parse passed for
  `docs/api/openapi-mvp6-2-draft.json`.
- Node assertions passed for required paths, command/state enums, summary
  required fields/properties, source artifact enum values, auto-approval
  preview required fields, and forbidden auto-preview fields.
- Frontend old-drift exact-term search returned no matches.
- Runtime leakage search under `apps/` and `infra/` returned no MVP6.2
  learning-signal/active-learning implementation hits.
- `git status --short -- apps infra` is dirty from earlier MVP runtime work,
  but Wave31 role reports and targeted leakage search show no Wave31 runtime
  addition for MVP6.2 Active Learning.

## INT6-016 Wave32 Implementation Recommendation

Exit criterion: `PASS` when QA can recommend one clear next step after the
targeted recheck.

Wave31 recommendation result: `PASS`.

Recommended next step: open Wave32 MVP6.2 thin implementation.

Implementation guardrails:

- Use the Wave31 frozen command/state vocabulary and DTO names exactly.
- Treat `SUPERSEDED` as read-side only in P0.
- Return conflict by default for decision commands on non-`SUGGESTED`
  suggestions.
- Keep accepted suggestions as future prompt-drafting intent, not applied
  prompt changes.
- Keep auto-approval candidates preview-only and not enforced.
- Add runtime smoke only after the thin implementation exists.

## Validation Commands

Executed during Wave31 QA recheck:

```text
python3 -m json.tool docs/api/openapi-mvp6-2-draft.json >/tmp/openapi-mvp6-2-draft.wave31-qa.pretty.json
node <<'NODE'
<OpenAPI path/schema/required-field/enum assertion script>
NODE
rg -n 'computed_at|signal_counts_by_type|source_artifact_coverage|accepted_suggestion_count|dismissed_suggestion_count|superseded_suggestion_count|high_risk_suggestion_count|auto_approval_candidate_count|candidate_id|historical_match_count|historical_match_denominator|evidence_quality_summary|"ACCEPTED"\s*/\s*"DISMISSED"|decision request.*ACCEPTED|decision request.*DISMISSED' docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md
rg -n "learning-signals|learning-signal|LearningInsights|Learning Insights|Active Learning|PromptSuggestion|AutoApprovalCandidate|CorrectionPattern|auto-approval candidates|MVP6\\.2|mvp6\\.2" apps infra --glob '!**/node_modules/**'
git status --short -- apps infra
git diff --check
git diff --check --no-index /dev/null docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md
git diff --check --no-index /dev/null docs/handoffs/wave-031/QA_REPORT.md
```

Expected runtime acceptance status before Wave32 implementation:
`NOT RUNNABLE` by design. MVP6.2 runtime checks should be added only after the
Wave32 thin implementation is explicitly opened.

## Wave32 Runtime Acceptance Gates (INT6-017..INT6-020)

Wave32 opened thin implementation. The gates below are now runtime-executable
and were independently validated by QA on 2026-06-26 (not trusting role
reports). Verdict summary:

| ID | Gate | Verdict |
|---|---|---|
| `INT6-017` | MVP6.2 backend runtime acceptance | `PASS` |
| `INT6-018` | MVP6.2 frontend mock/API acceptance | `PASS` |
| `INT6-019` | MVP6.2 no-mutation guard | `PASS` |
| `INT6-020` | Wave32 closeout recommendation | `PASS` (recommend thin-slice closeout) |

### INT6-017 Backend Runtime Acceptance — `PASS`

- All 5 frozen endpoint families exist in the running app (runtime OpenAPI
  export, 128 paths) and respond per contract:
  - `GET .../learning-signals/summary` -> 200; unknown project -> 404.
  - `GET .../learning-signals/correction-patterns` -> 200 (bare array).
  - `GET .../learning-signals/prompt-suggestions` -> 200 (bare array).
  - `GET .../learning-signals/auto-approval-candidates` -> 200 (bare array).
  - `POST /learning-signal-suggestions/{id}/decisions` -> 201.
- Decision transitions verified live:
  - `ACCEPT` SUGGESTED -> ACCEPTED (201).
  - `DISMISS` requires `dismiss_reason_code`; missing -> 400
    `DISMISS_REASON_REQUIRED`; `OTHER` without note -> 400
    `DECISION_NOTE_REQUIRED`; `ACCEPT` with reason -> 400
    `DISMISS_REASON_NOT_ALLOWED`.
  - Command on `ACCEPTED`/`SUPERSEDED` (non-`SUGGESTED`) -> 409
    `PROMPT_SUGGESTION_DECISION_CONFLICT`.
  - Unknown suggestion -> 404 `PROMPT_SUGGESTION_NOT_FOUND`.
- DTO field names and enums match `docs/api/openapi-mvp6-2-draft.json`: runtime
  vs draft comparison over 34 shared schemas found 0 field-name mismatches;
  `PromptSuggestionState` = SUGGESTED/ACCEPTED/DISMISSED/SUPERSEDED,
  `SuggestionDecisionType` = ACCEPT/DISMISS.
- `pytest test_mvp6_2_learning_api.py` 7 passed; `test_mvp6_evaluation_api.py`
  4 passed; `ruff check app tests scripts` clean.

### INT6-018 Frontend Mock/API Acceptance — `PASS`

- Full flow rendered in both modes:
  `summary -> correction pattern -> prompt suggestion -> accept/dismiss ->
  audit note`, plus auto-approval preview (recommendation-only/not-enforced),
  superseded read-side state, and conflict/already-decided states.
- `npm run test` 19 passed (incl. 6 MVP6.2 learning mock tests); `npm run
  build` PASS; `npm run smoke:mvp6:learning:mock` PASS (routeCount 6);
  `npm run smoke:mvp6:learning:actual` PASS (apiCheckCount 7) against live
  SQLite backend + actual-mode Vite.

### INT6-019 No-Mutation Guard — `PASS`

- Decision response `mutation_guard` flags ALL false, verified live:
  prompt_version_mutated / candidate_graph_mutated / published_graph_mutated /
  auto_approval_policy_mutated / extraction_job_started /
  evaluation_run_started.
- Code-level: `app/modules/learning/` imports only `Project` (read-only 404
  guard), `CandidateKind` enum, errors, and DB session — no prompt/candidate/
  publish/extraction/evaluation/policy model or service. Decision writes touch
  only the in-memory `_suggestions_by_project` store.
- Runtime data-level proof: after live summary/list/ACCEPT/DISMISS operations,
  `published_entities`, `published_relations`, `candidate_entities`,
  `candidate_relations`, and `prompt_versions` tables all show 0 rows.
- FE/BE field-name drift independently confirmed CLOSED: backend
  `schemas.py` and frontend `types.ts` + `mvp6LearningFixtures.ts` agree on
  `ontology_class_id`, `ontology_relation_id`, outcome `reason`; no stray
  `evidence_id` in `LearningEvidenceRef` on either side.

### INT6-020 Closeout Recommendation — `PASS`

Recommend `(a) MVP6.2 thin-slice closeout`. All Wave32 gates PASS with no
blocker. Regression additive-only: MVP3 + project/ontology (15), MVP4 + MVP5
(17), MVP6.1 evaluation (4) all pass; candidate/published-graph separation
invariant intact. P1 follow-ups only (non-blocking): promote always-populated
optional summary/pattern fields to `required` in the draft for strict-match;
regenerate the stale full-runtime `openapi-mvp2-draft.json` snapshot (it omits
learning paths); optional permission-limited/stale signal wiring.

### Wave32 QA Validation Commands

```text
cd apps/backend && .venv/bin/pytest tests/test_mvp6_2_learning_api.py -q   # 7 passed
cd apps/backend && .venv/bin/pytest tests/test_mvp6_evaluation_api.py -q   # 4 passed
cd apps/backend && .venv/bin/ruff check app tests scripts                  # clean
cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py tests/test_project_ontology_api.py -q  # 15 passed
cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py tests/test_mvp5_api.py -q              # 17 passed
cd apps/frontend && npm run test    # 19 passed
cd apps/frontend && npm run build   # PASS
cd apps/frontend && npm run smoke:mvp6:learning:mock     # PASS (6 routes)
cd apps/frontend && npm run smoke:mvp6:learning:actual   # PASS (7 api checks)
# runtime OpenAPI export + 34-schema field-name compare vs draft -> 0 mismatch
# live curl decision matrix: 201/400/409/404 + mutation_guard all false
git diff --check  # clean
lsof -nP -iTCP:8000/-iTCP:5173 -sTCP:LISTEN  # no listeners after teardown
```
