# MVP 6 Draft Backlog

Status: `MVP6.3 WAVE33 BENCHMARK COMPARISON CONTRACT-FIRST PLANNING`
Date: 2026-06-26

MVP6 is broad. Wave28 and Wave29 closed MVP6.1 Gold Set / Benchmark Studio.
Wave30 freezes MVP6.2 Active Learning / Continuous Improvement as a
contract-first planning slice only. Wave31 hardens implementation-facing
command/state and DTO naming only. Wave32 may implement the smallest
deterministic runtime/UI slice for the frozen MVP6.2 P0 loop, but runtime
scope must not expand beyond the endpoint families and acceptance guardrails
listed below. Fine-tuning, live retraining, autonomous publish, automatic
policy enforcement, governance workflow, agents, connectors, tenant runtime,
ontology packs, and advanced visualization remain out of MVP6.2 P0.

## MVP6.1 Entry Gate

- [x] MVP6 source of truth exists:
      `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`.
- [x] PM freezes the Wave28 P0 thin slice in
      `docs/pm/MVP6_PREP_BRIEF.md`.
- [x] PM creates this PM/BE/FE/INT backlog split.
- [x] PM creates `docs/backlog/INT6_MVP6_ACCEPTANCE.md`.
- [x] Backend implements only the approved additive P0 API/runtime slice.
- [x] Frontend implements only the approved MVP6.1 mock/actual UI slice.
- [x] QA verifies deterministic Gold Set to EvaluationRun happy path.

## Wave28 PM Freeze Summary

- Same-wave Backend/Frontend implementation is approved after PM report is
  published.
- P0 center: Gold Set / Benchmark Studio deterministic thin slice.
- P0 demo path:
  `create dataset -> add sample -> add gold entity/relation -> run deterministic evaluation -> view metrics/errors`.
- P0 run mode: `DETERMINISTIC_MOCK`.
- Required version/run context: `ontology_version_id`, `prompt_version_id`,
  `model_name`, `model_run_id`, and `parser_version`.
- Gold entities and relations require sample/source evidence context.
- Evaluation results are analysis artifacts only; they cannot mutate candidate
  review, publish, or published graph state.
- Wave28 excludes real LLM benchmark execution, fine-tuning, active learning,
  governance workflow, copilot/agent runtime, connector/plugin SDK, and
  multi-tenant runtime.

## Wave29 PM Hardening Freeze Summary

- Wave29 is targeted MVP6.1 hardening only. It does not open MVP6.2 or any
  later MVP6 theme.
- Hardening center:
  - `smoke:mvp6:actual` reproducibility;
  - Frontend `candidate_ref` nested type/display alignment with Backend
    `EvaluationCandidateRef`;
  - process-local runtime store closeout decision.
- `smoke:mvp6:actual` may rely on the existing process-local evaluation store
  when the script creates or seeds all data it reads in the same actual backend
  runtime. A minimal dev-only reset/seed helper is allowed only if repeated
  actual smoke cannot be made reproducible without it.
- Durable DB models and Alembic persistence remain P1/P2 and are not required
  for MVP6.1 closeout.
- Wave29 excludes Active Learning, ontology governance, impact simulation,
  copilot/agent runtime, connector/plugin SDK, multi-tenant runtime, ontology
  packs, advanced visualization/storytelling, and real LLM benchmark provider
  execution.

## Wave29 Closeout Summary

- Wave29 PM, Backend, Frontend, and QA reports are PASS.
- `smoke:mvp6:actual` is accepted for MVP6.1 closeout. It self-creates
  project/dataset/sample/gold/run data against the actual backend runtime and
  verifies the actual frontend route markers.
- Frontend `EvaluationErrorCase.candidate_ref` is aligned to Backend
  `EvaluationCandidateRef`, including entity/relation context and nullable
  evidence fallback.
- Process-local evaluation runtime store is accepted for MVP6.1. Durable
  persistence, dataset revisioning, benchmark comparison, confusion matrix, and
  real LLM benchmark provider execution remain later work.
- MVP6.2 starts after MVP6.1 closeout as contract-first planning for Active
  Learning / Continuous Improvement.

## Wave30 MVP6.2 PM Freeze Summary

Wave30 defines the smallest coherent MVP6.2 P0 loop from Theme 2. Runtime
implementation must wait until Backend drafts an additive contract, Frontend
reviews fields/states/IA, and QA creates an executable acceptance checklist.

Frozen MVP6.2 P0 demo flow:

```text
select project
-> view learning signal summary
-> inspect correction pattern
-> inspect prompt suggestion
-> accept/dismiss suggestion
-> see decision audit note
```

P0 may analyze these existing source artifacts only:

- MVP3 review/correction history and review decision audit trails.
- MVP4 quality metrics and validation/quality drilldown evidence.
- MVP6.1 evaluation errors, metrics, run context, and candidate-vs-gold
  comparison artifacts.

P0 learning signal taxonomy:

- `RELATION_DIRECTION_CORRECTION`
- `CLASS_CONFUSION`
- `RELATION_TYPE_CONFUSION`
- `EVIDENCE_MISSING`
- `EVIDENCE_MISMATCH`
- `REPEATED_VALIDATION_FAILURE`
- `LOW_BENCHMARK_METRIC_CLUSTER`

P0 prompt suggestion states:

- `SUGGESTED`: generated from one or more learning signals and awaiting human
  decision.
- `ACCEPTED`: user records intent to use the suggestion in a future prompt
  version drafting workflow; no prompt version is mutated in P0.
- `DISMISSED`: user rejects or defers the suggestion with a reason.
- `SUPERSEDED`: suggestion is no longer current because a newer signal or
  suggestion covers the same pattern.

Wave31 decision vocabulary freeze:

- Request command values are `ACCEPT` and `DISMISS`.
- Resulting prompt suggestion states are `ACCEPTED` and `DISMISSED`.
- `SUPERSEDED` is a read-side state in MVP6.2 P0 and is not a human command.
- A decision command against a non-`SUGGESTED` suggestion returns a conflict by
  default unless a later PM freeze explicitly adds idempotency behavior.

P0 decision capture is audit-only. It records actor, command value, reason/note,
timestamp, source signal ids, target prompt/version context, suggestion
snapshot, and resulting suggestion state. It does not rewrite prompts, trigger
extraction, publish candidates, or mutate the published graph.

Wave31 DTO field naming freeze:

- Learning summary uses `generated_at`, `source_artifact_scope`,
  `signal_counts`, `open_prompt_suggestion_count`,
  `accepted_prompt_suggestion_count`, `dismissed_prompt_suggestion_count`,
  `superseded_prompt_suggestion_count`,
  `high_risk_prompt_suggestion_count`, and
  `auto_approval_preview_count`.
- Source artifact values align with Backend/OpenAPI
  `LearningSourceArtifactType`: `REVIEW_DECISION`, `REVIEW_CORRECTION`,
  `VALIDATION_RESULT`, `QUALITY_METRIC`, `QUALITY_DRILLDOWN`,
  `EVALUATION_RUN`, `EVALUATION_METRIC`, `EVALUATION_ERROR_CASE`.
- Auto-approval preview fields center on `id`,
  `historical_match_preview`, `source_artifacts`, `supporting_metrics`, and
  `safety_note`. A separate `evidence_quality_summary` field is not part of P0
  unless PM explicitly freezes it later.

Auto-approval candidates are recommendation/preview only. MVP6.2 P0 may show
why a rule might be safe, what metrics/signals support it, and what it would
match. It cannot create, update, enable, enforce, or auto-execute an
auto-approval policy.

Wave30 P0 excludes fine-tuning execution, live retraining, dataset export
execution, real provider prompt rewriting, autonomous publish, automatic policy
enforcement, ontology governance, impact simulation, copilot/agent runtime,
connector/plugin SDK, multi-tenant runtime, ontology packs, and advanced
visualization/storytelling.

## Wave32 MVP6.2 Implementation Scope Guard

Wave32 is approved only as a thin implementation of the frozen P0 loop:

```text
select project
-> view learning signal summary
-> inspect correction pattern
-> inspect prompt suggestion
-> accept/dismiss suggestion
-> see decision audit note
```

Deterministic local data is acceptable for the first thin slice. Backend may
use deterministic process-local or mock-derived data if it is project-scoped,
source-artifact-shaped, reproducible for tests/smoke, and clearly separated
from real provider execution. Frontend may use matching deterministic fixtures
for mock mode before wiring actual API mode.

Wave32 Backend runtime acceptance is limited to the frozen endpoint families:

- `GET /api/v1/projects/{project_id}/learning-signals/summary`
- `GET /api/v1/projects/{project_id}/learning-signals/correction-patterns`
- `GET /api/v1/projects/{project_id}/learning-signals/prompt-suggestions`
- `GET /api/v1/projects/{project_id}/learning-signals/auto-approval-candidates`
- `POST /api/v1/learning-signal-suggestions/{suggestion_id}/decisions`

Backend acceptance requires those endpoints to match the Wave31 OpenAPI
planning fields, return deterministic project-scoped data, preserve source
artifact references, implement decision conflict behavior, and expose mutation
guard evidence.

Wave32 Frontend UI acceptance requires a project-scoped Learning Insights
workflow that renders the summary, correction pattern, prompt suggestion,
auto-approval preview, and decision audit note. The UI must keep ID-bound
details contextual to Learning Insights, show loading/empty/error and
permission-limited states, and verify the flow in mock mode plus actual mode
when the Backend runtime is available.

Decision transition rules are frozen:

- `ACCEPT` transitions only a `SUGGESTED` suggestion to `ACCEPTED`.
- `DISMISS` transitions only a `SUGGESTED` suggestion to `DISMISSED` and
  requires the frozen reason code rules.
- `SUPERSEDED` remains read-side only.
- A command against `ACCEPTED`, `DISMISSED`, or `SUPERSEDED` must return a
  non-`SUGGESTED` conflict and that conflict must be visible/tested by
  Backend, Frontend, or QA.

Mutation guard evidence must remain all false for every suggestion decision:

- `prompt_version_mutated: false`
- `candidate_graph_mutated: false`
- `published_graph_mutated: false`
- `auto_approval_policy_mutated: false`
- `extraction_job_started: false`
- `evaluation_run_started: false`

Wave32 must not add real LLM calls, fine-tuning, live retraining, training
export execution, prompt rewriting, prompt version mutation, candidate review
mutation, candidate graph mutation, published graph mutation, policy
create/update/enable/enforce behavior, ontology governance, impact simulation,
agent/copilot runtime, connector/plugin SDK, tenant runtime, ontology packs, or
advanced visualization/storytelling.

## Wave33 MVP6.3 Benchmark Comparison PM Freeze Summary

Wave33 opens the next MVP6 theme as contract-first planning only. The chosen
P0 is **Benchmark Comparison / Confusion Matrix**, the smallest coherent
extension of the closed MVP6.1 evaluation surface. It is read-only aggregation
over already-stored `EvaluationRun` / `EvaluationMetric` / `EvaluationErrorCase`
artifacts. Runtime implementation waits for Wave34 after Backend contract draft,
Frontend field/state/IA review, and a QA executable checklist are ready. The
full freeze is in `docs/pm/MVP6_3_BENCHMARK_COMPARISON_BRIEF.md` and the durable
boundary is recorded in `docs/adr/0009-mvp6-3-benchmark-comparison-read-only-boundary.md`.

Frozen MVP6.3 P0 demo flow:

```text
select project
-> open Benchmark Comparison
-> select 2+ existing evaluation runs (by model/prompt/ontology/dataset version)
-> view side-by-side metric comparison with deltas
-> view per-class / per-relation-type confusion matrix and bucket accuracy
-> drill into a confusion cell to its contributing error cases
```

P0 may analyze these existing source artifacts only: MVP6.1 `EvaluationRun`,
`EvaluationMetric`, `EvaluationErrorCase` (typed by `EvaluationErrorType`),
`EvaluationCandidateRef`, and `EvaluationDimensions` class/relation/source
buckets. It must not join MVP3 review/correction, MVP4 quality, MVP6.2 learning
signals, or published-graph data.

New P0 enums (no new metric names — `EvaluationMetricName` is reused verbatim):

- `BenchmarkComparisonGroupBy`: `MODEL`, `PROMPT_VERSION`, `ONTOLOGY_VERSION`,
  `DATASET_VERSION`, `PARSER_VERSION`.
- `ComparisonComparabilityFlag`: `SAME_DATASET`, `DIFFERENT_DATASET_VERSION`,
  `DIFFERENT_DATASET`, `DIFFERENT_ONTOLOGY_VERSION`, `MISSING_METRIC`.
- `ConfusionMatrixAxis`: `ENTITY_CLASS`, `RELATION_TYPE`.
- Metric delta status (response-side): `IMPROVED`, `REGRESSED`, `UNCHANGED`,
  `NOT_COMPARABLE`.

Frozen safety boundary: read-only analysis only. No new run execution, no LLM
call, no gold-set authoring, no dataset revisioning write, no candidate/publish/
published-graph mutation. If a comparison object is persisted it is an analysis
artifact with an all-false `mutation_guard` mirroring the MVP6.2 audit-only
pattern.

Frozen exclusions: Gold Set authoring/dataset revisioning write, executing new
runs from the comparison UI, real LLM/provider execution, new metric names /
ontology constraint pass-rate, significance testing / time-trend / scheduled
alerts, comparison export to training datasets, cross-project/cross-org
comparison, MVP3/MVP4/MVP6.2 joins, and all Theme-3+ surfaces.

## Wave34 MVP6.3 Implementation Scope Guard + Persist-vs-Compute Freeze

Wave34 is approved only as a thin implementation of the frozen MVP6.3 P0 flow.
No new product scope: the demo flow (select project -> open Benchmark Comparison
-> select 2+ terminal-success runs -> side-by-side metric deltas -> per-class /
per-relation-type confusion matrix -> drill a cell to contributing error cases)
and the four endpoint families are unchanged from the Wave33 freeze. No benchmark
P1+ scope (gold-set authoring/versioning write, real provider execution,
significance/trend/alerts, training export, cross-project comparison, governance,
agents, connectors, tenants, packs, advanced viz).

Frozen endpoint families:

- `POST /api/v1/projects/{project_id}/benchmark-comparisons`
- `GET  /api/v1/projects/{project_id}/benchmark-comparisons`
- `GET  /api/v1/benchmark-comparisons/{comparison_id}`
- `GET  /api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix`
- `GET  /api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix/cells/{cell_id}/error-cases`

**Persist-vs-compute decision (acceptance gate C12) — FROZEN: option (a) persist
a deterministic process-local comparison record keyed by `comparison_id`.**

Rationale:

- It matches the existing MVP6.1 evaluation pattern exactly: that module keeps
  module-level dicts keyed by id (`_runs: dict[str, EvaluationRun]`, etc.) with a
  `reset_runtime_store()`, and MVP6.2 learning follows the same shape. Persisting
  `_comparisons: dict[str, BenchmarkComparison]` is the same proven pattern, not a
  new mechanism.
- It satisfies the list + GET-by-id round-trip (R3) directly: `POST` composes and
  stores the comparison record, `GET list` returns the project's stored records,
  and `GET by id` returns the same composed object — no recomputation-determinism
  risk on read.
- The stored record stays a read-only analysis artifact: it carries an all-false
  `BenchmarkMutationGuard` and is rebuilt from existing runs, so persistence adds
  no mutation surface to candidate/published/prompt/gold/policy paths.

Restated Wave34 acceptance gates (all required):

- All responses (and any persisted comparison) expose an all-false
  `BenchmarkMutationGuard` (`candidate_graph_mutated`, `published_graph_mutated`,
  `evaluation_run_started`, `gold_set_mutated`).
- No MVP6.1 field/enum rename; MVP6.1 shapes reused by `$ref`.
- Comparability flags surfaced honestly at all three levels (per-run, per-set,
  per-metric-row); cross-dataset/cross-ontology flagged, never blocked or hidden.
- `NOT_APPLICABLE` (never fabricated 0%/100%) and `__NONE__` (display sentinel,
  never a stored ontology id) semantics preserved.
- `>=2` terminal-success run eligibility; ineligible runs surfaced via
  `excluded_runs[]` + `RunExclusionReason`, never a crash.

Backlog IDs: PM `PM6-018`; Backend `BE6-024`~`BE6-027`; Frontend
`FE6-023`~`FE6-026`; QA `INT6-022`~`INT6-025`.

## PM Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| PM6-001 | P0 | PM | MVP6.1 scope freeze | MVP5 closeout, MVP6 roadmap | `docs/pm/MVP6_PREP_BRIEF.md` defines the smallest Gold Set / Benchmark Studio P0 thin slice and excludes later MVP6 themes |
| PM6-002 | P0 | PM | Gold Set / Benchmark acceptance criteria | PM6-001 | `docs/backlog/INT6_MVP6_ACCEPTANCE.md` includes dataset, sample, gold entity/relation, deterministic run, metrics, and errors happy path |
| PM6-003 | P0 | PM | Evaluation metric definitions | PM6-001 | entity/relation precision, recall, F1, relation direction accuracy, and evidence match rate definitions plus zero-denominator policy are frozen |
| PM6-004 | P0 | PM | MVP6 entry guardrails and exclusions | PM6-001 | published graph safety, evidence/version traceability, and Wave28 exclusions are documented for Backend/Frontend/QA |
| PM6-005 | P1 | PM | Gold Set authoring policy | PM6-001 | expert ownership, edit/archive policy, dataset revisioning, and import/export rules are defined after P0 runtime passes |
| PM6-006 | P1 | PM | Benchmark comparison policy | PM6-003 | model/prompt comparison, relation matrix, class accuracy, and constraint pass-rate policy are documented after P0 metrics pass |
| PM6-007 | P2 | PM | MVP6.2+ roadmap breakdown | PM6-001 | active learning, governance, impact simulation, agents, connectors, tenants, and ontology packs are split into later thin slices |
| PM6-008 | P1 | PM | Wave29 hardening freeze | Wave28 reports | Wave29 is frozen as MVP6.1 hardening only, with `smoke:mvp6:actual` PASS/PARTIAL/FAIL criteria and later-theme exclusions documented |
| PM6-009 | P1 | PM | Durable persistence decision | PM6-008, BE6-003 | process-local runtime store is accepted for MVP6.1 closeout if actual smoke is reproducible; durable DB/Alembic stays P1/P2 |
| PM6-010 | P0 | PM | MVP6.2 P0 scope freeze | Wave29 closeout, MVP6 roadmap Theme 2 | `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md` freezes the P0 demo flow, source artifacts, safety boundary, and exclusions |
| PM6-011 | P0 | PM | Learning signal taxonomy | PM6-010, MVP3/MVP4/MVP6.1 artifacts | P0 signal types cover relation direction correction, class confusion, relation type confusion, evidence missing/mismatch, repeated validation failure, and low benchmark metric cluster |
| PM6-012 | P0 | PM | Prompt suggestion and decision policy | PM6-011 | suggestion states, accept/dismiss rules, decision reason requirements, and audit note content are frozen without mutating prompt versions |
| PM6-013 | P0 | PM | Auto-approval candidate safety boundary | PM6-010 | auto-approval candidates are preview/recommendation only and cannot create, enable, enforce, approve, publish, or mutate policies/graphs |
| PM6-014 | P0 | PM | Decision command/state vocabulary freeze | Wave30 QA finding, PM6-012 | `ACCEPT`/`DISMISS` are request commands; `ACCEPTED`/`DISMISSED` are resulting states; `SUPERSEDED` is read-side only; non-`SUGGESTED` commands conflict by default |
| PM6-015 | P0 | PM | DTO field naming freeze | Wave30 QA finding, BE6-012~BE6-015, FE6-011~FE6-014 | learning summary, source artifact enum, and auto-approval preview field names are frozen for Backend/OpenAPI and Frontend alignment before runtime implementation |
| PM6-016 | P0 | PM | Wave32 implementation scope guard | PM6-014, PM6-015, INT6-016 | deterministic local thin data is acceptable; Backend/Frontend acceptance stays inside frozen endpoints/UI flow; `ACCEPT`/`DISMISS` transition only `SUGGESTED`; non-`SUGGESTED` conflict and all-false mutation guard are required; later MVP6 themes remain out of scope |
| PM6-017 | P0 | PM | MVP6.3 Benchmark Comparison P0 scope freeze | MVP6.1 closeout, MVP6 roadmap Theme 1 §4.1-4.4 | `docs/pm/MVP6_3_BENCHMARK_COMPARISON_BRIEF.md` freezes the read-only comparison/confusion-matrix P0 demo flow, source artifacts, enums/states, delta and cell definitions, safety boundary, and exclusions; durable boundary recorded in ADR 0009 |
| PM6-018 | P0 | PM | Wave34 MVP6.3 implementation scope guard + persist-vs-compute freeze | PM6-017, INT6-021 (C12) | scope unchanged from the frozen P0 flow and 4 endpoint families; persist-vs-compute frozen to option (a) persist a deterministic process-local comparison record keyed by `comparison_id` (mirrors MVP6.1 `_runs` store, satisfies list + GET-by-id round-trip R3); all-false `BenchmarkMutationGuard`, no MVP6.1 field/enum rename, comparability flags + `NOT_APPLICABLE`/`__NONE__` semantics preserved, `>=2` terminal-success eligibility with `RunExclusionReason`; no benchmark P1+ scope |

## Backend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| BE6-001 | P0 | Backend | Evaluation dataset schemas/API | PM6-001 | project-scoped create/list/detail endpoints expose dataset status, counts, timestamps, and OpenAPI schemas |
| BE6-002 | P0 | Backend | Evaluation sample and gold item schemas/API | BE6-001 | sample create/list plus gold entity/relation create/list preserve sample/source evidence context |
| BE6-003 | P0 | Backend | Deterministic evaluation run service | BE6-001, BE6-002, PM6-003 | `DETERMINISTIC_MOCK` run stores ontology/prompt/model/parser context and produces reproducible candidate-vs-gold comparison |
| BE6-004 | P0 | Backend | Metric and error-case read API | BE6-003 | metrics expose value/numerator/denominator/formula/status; errors expose candidate-vs-gold and evidence context |
| BE6-005 | P0 | Backend | MVP6 OpenAPI/export/update | BE6-001~BE6-004 | actual OpenAPI includes selected MVP6.1 paths/schemas/enums and existing MVP1-MVP5 paths remain compatible |
| BE6-006 | P1 | Backend | Dataset versioning and gold evidence object | BE6-001~BE6-004 | dataset revisions and standalone gold evidence CRUD are added after P0 happy path passes |
| BE6-007 | P1 | Backend | Benchmark comparison and confusion matrix | BE6-003, BE6-004 | multiple runs can be compared by prompt/model/ontology version and relation/class buckets |
| BE6-008 | P2 | Backend | Real LLM benchmark provider execution | BE6-003 | real provider execution is added only after deterministic run contract and safety checks are stable |
| BE6-009 | P2 | Backend | Active learning and governance foundations | PM6-007 | learning signals, prompt suggestions, ontology change requests, and impact simulation are separate future slices |
| BE6-010 | P1 | Backend | Actual smoke support | PM6-008, PM6-009 | actual backend runtime supports repeated dataset/sample/gold/run/metrics/errors smoke without durable DB persistence |
| BE6-011 | P1 | Backend | Evaluation contract stability | PM6-008, BE6-005 | OpenAPI keeps `EvaluationCandidateRef`, metrics/errors, and Wave28 MVP6.1 schemas stable for Frontend/QA actual smoke |
| BE6-012 | P0 | Backend | Learning signal API contract | PM6-010, PM6-011 | planning-only additive endpoints expose project-scoped summary and signal lists from approved source artifacts |
| BE6-013 | P0 | Backend | Correction pattern and prompt suggestion DTOs | PM6-011, PM6-012 | DTOs include source artifact refs, signal taxonomy, pattern support counts, prompt suggestion preview, and safety notes |
| BE6-014 | P0 | Backend | Suggestion decision API contract | PM6-012 | decision contract records `ACCEPT`/`DISMISS` audit notes without mutating prompts, candidates, policies, or published graph; `SUPERSEDED` remains read-side only in P0 |
| BE6-015 | P0 | Backend | MVP6.2 OpenAPI planning artifact | BE6-012~BE6-014 | `docs/api/MVP6_2_API_CONTRACT_DRAFT.md` and optional `openapi-mvp6-2-draft.json` parse and remain planning-only |
| BE6-016 | P0 | Backend | Decision vocabulary contract alignment | PM6-014 | Wave31 contract keeps request commands `ACCEPT`/`DISMISS`, resulting states `ACCEPTED`/`DISMISSED`, read-side `SUPERSEDED`, and default non-`SUGGESTED` conflict |
| BE6-017 | P0 | Backend | Learning summary field alignment | PM6-015 | summary contract uses the Wave31 frozen field names including superseded and high-risk suggestion counts |
| BE6-018 | P0 | Backend | Source artifact and auto-approval preview field alignment | PM6-015 | source artifact enum and auto-approval preview fields align to the frozen PM/OpenAPI/Frontend names without adding `evidence_quality_summary` |
| BE6-019 | P0 | Backend | Learning signal runtime endpoints | PM6-016, BE6-012~BE6-018 | deterministic project-scoped runtime endpoints return summary, correction patterns, prompt suggestions, and auto-approval previews matching the frozen OpenAPI fields |
| BE6-020 | P0 | Backend | Suggestion decision audit runtime | PM6-016, BE6-014 | `ACCEPT`/`DISMISS` transition only `SUGGESTED` suggestions, `DISMISS` enforces reason rules, and non-`SUGGESTED` decisions return conflict |
| BE6-021 | P0 | Backend | MVP6.2 OpenAPI export/runtime alignment | BE6-019, BE6-020 | runtime OpenAPI export or comparison keeps the five MVP6.2 endpoint families and DTO/enums aligned with the Wave31 planning artifact |
| BE6-022 | P0 | Backend | No-mutation regression guard | PM6-016, BE6-020 | decision responses and tests prove prompt, candidate graph, published graph, policy, extraction, and evaluation mutation flags remain false |
| BE6-023 | P0 | Backend | MVP6.3 Benchmark Comparison contract draft | PM6-017, BE6-005, BE6-007 | `docs/api/MVP6_3_BENCHMARK_COMPARISON_API_CONTRACT_DRAFT.md` and `docs/api/openapi-mvp6-3-draft.json` define additive read-only comparison/confusion-matrix endpoints, the new enums, metric delta/comparability/confusion-cell DTOs, baseline + epsilon rule, and an all-false analysis mutation guard; planning-only, parses as OpenAPI 3.1.0, additive to MVP1-MVP6.2 paths |
| BE6-024 | P0 | Backend | MVP6.3 comparison + delta endpoints | PM6-018, BE6-023 | `POST/GET /api/v1/projects/{project_id}/benchmark-comparisons` and `GET /api/v1/benchmark-comparisons/{comparison_id}` implement the read-aggregation builder over existing MVP6.1 runs, persist a deterministic process-local comparison record keyed by `comparison_id` (list + GET-by-id round-trip), per-metric signed delta with `MetricDeltaStatus` + fixed epsilon `0.0001` (`NOT_COMPARABLE` -> `delta: null`), and 3-level comparability flags |
| BE6-025 | P0 | Backend | MVP6.3 confusion matrix + cell error-case drilldown | PM6-018, BE6-024 | `GET .../confusion-matrix` per run + `ConfusionMatrixAxis`, `GET .../confusion-matrix/cells/{cell_id}/error-cases` with pagination; cells derive only from existing `EvaluationErrorCase` + implied matches, `NOT_APPLICABLE` empty buckets, `__NONE__` false-pos/neg sentinel, deterministic URL-safe `cell_id` |
| BE6-026 | P0 | Backend | MVP6.3 OpenAPI export / runtime alignment | PM6-018, BE6-024, BE6-025 | runtime DTO field names + new enums match `openapi-mvp6-3-draft.json` (0 field-name mismatch on shared schemas); MVP6.1 shapes reused by `$ref` with no rename |
| BE6-027 | P0 | Backend | MVP6.3 no-mutation regression guard | PM6-018, BE6-024 | all responses expose an all-false `BenchmarkMutationGuard`; `>=2` terminal-success eligibility with `excluded_runs[]`/`RunExclusionReason`; focused tests cover endpoints, delta + epsilon boundary, comparability flags, sparse/`__NONE__` matrix, cell drilldown, eligibility/exclusion, no-mutation; MVP6.1 evaluation tests stay green |

## Frontend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| FE6-001 | P0 | Frontend | Evaluation Studio IA/route | PM6-001 | one stable Evaluation/Benchmark area is added without ID-bound pages in global LNB; loading/empty/error states exist |
| FE6-002 | P0 | Frontend | Gold Set Manager mock/actual boundary | BE6-001, BE6-002 | users can see/create dataset, sample, gold entity, and gold relation through mock fixtures first and actual API when available |
| FE6-003 | P0 | Frontend | Benchmark Dashboard metric cards/table | BE6-003, BE6-004, PM6-003 | entity/relation precision, recall, F1, direction accuracy, evidence match, formula, and not-applicable states are visible |
| FE6-004 | P0 | Frontend | Error Case Explorer | BE6-004 | candidate-vs-gold comparison, sample text, evidence match state, and error type are inspectable |
| FE6-005 | P0 | Frontend | MVP6 API types/client/mocks | BE6-005 | TypeScript types, client calls, and fixtures match backend OpenAPI for the selected P0 slice |
| FE6-006 | P1 | Frontend | Benchmark comparison UX | BE6-007 | compare multiple runs by model, prompt, ontology version, relation type, and source type after P0 passes |
| FE6-007 | P1 | Frontend | Gold Set import/export UX | BE6-006 | import/export states, compatibility warnings, and dataset revision states are designed after backend P1 scope exists |
| FE6-008 | P2 | Frontend | Learning/governance/agent UI shells | PM6-007 | later MVP6 themes remain out of Wave28 and get separate IA/acceptance criteria |
| FE6-009 | P1 | Frontend | Actual API smoke | BE6-010, FE6-005 | `npm run smoke:mvp6:actual` or equivalent verifies the MVP6.1 happy path against actual backend API and keeps `smoke:mvp6:mock` passing |
| FE6-010 | P1 | Frontend | Candidate ref DTO widening | BE6-011, FE6-005 | `EvaluationErrorCase.candidate_ref` uses a frontend `EvaluationCandidateRef` matching Backend fields, not the narrower generic `CandidateRef` |
| FE6-011 | P0 | Frontend | Learning Insights IA | PM6-010 | Learning Insights is placed as a project-scoped workflow area without adding ID-bound pages to the global LNB |
| FE6-012 | P0 | Frontend | Correction Pattern Dashboard requirements | PM6-011, BE6-013 | states and fields support signal summary, correction patterns, source artifact drilldown, loading, empty, error, and permission-limited views |
| FE6-013 | P0 | Frontend | Prompt Improvement Board requirements | PM6-012, BE6-013 | prompt suggestions show preview, rationale, source signals, accept/dismiss decisions, reason notes, and audit result |
| FE6-014 | P0 | Frontend | Auto Approval Candidate Review requirements | PM6-013 | auto-approval candidates render as preview-only recommendations with clear disabled enforcement boundary |
| FE6-015 | P1 | Frontend | Product Showcase style application plan | PM6-010 | any external style guide is distilled into repo-owned guidance before implementation and does not broaden Wave30 runtime scope |
| FE6-016 | P0 | Frontend | Decision vocabulary UX alignment | PM6-014 | UI actions send `ACCEPT`/`DISMISS`, display resulting states separately, keep `SUPERSEDED` read-side only, and show non-`SUGGESTED` conflicts as historical/already-decided states |
| FE6-017 | P0 | Frontend | Backend field naming alignment | PM6-015, BE6-016~BE6-018 | frontend requirements use the Wave31 frozen summary, source artifact, and auto-approval preview field names |
| FE6-018 | P0 | Frontend | Learning Insights route and IA | PM6-016, FE6-011 | project-scoped Learning Insights route renders inside the existing app shell without adding ID-bound detail pages to the global LNB |
| FE6-019 | P0 | Frontend | Learning Insights API types/client/mocks | BE6-019~BE6-021, FE6-017 | TypeScript types, client calls, and deterministic mocks match the frozen MVP6.2 endpoint families and DTO fields |
| FE6-020 | P0 | Frontend | Product Showcase style application | FE6-015, FE6-018 | summary card, workflow queues, badges, action bar, detail panel, decision drawer/modal, and audit timeline make the P0 loop readable without implying automation |
| FE6-021 | P0 | Frontend | Mock and actual smoke | BE6-019~BE6-021, FE6-018~FE6-020 | mock smoke verifies summary to decision audit flow; actual smoke verifies the same flow when Backend runtime is available, including conflict/error state |
| FE6-022 | P0 | Frontend | MVP6.3 Benchmark Comparison UX/API requirements | PM6-017, BE6-023 | document Benchmark Comparison route/IA (project-scoped, contextual to Evaluation/Benchmark area, no ID-bound pages in global LNB), required fields, run-selector + baseline picker, metric delta table, confusion-matrix view with cell drilldown to error cases, comparability-flag display, and first-class loading/empty/error/permission/not-comparable states; planning-only, no route/component/type/mock/smoke code |
| FE6-023 | P0 | Frontend | MVP6.3 route / IA | PM6-018, FE6-022 | project-scoped Benchmark Comparison area contextual to the existing Evaluation/Benchmark surface; no ID-bound pages in the global LNB |
| FE6-024 | P0 | Frontend | MVP6.3 types / client / mocks | PM6-018, BE6-026 | TypeScript types, API client, query hooks, and mocks match the frozen `openapi-mvp6-3-draft.json` exactly; reuse MVP6.1 shapes without rename |
| FE6-025 | P0 | Frontend | MVP6.3 comparison + confusion-matrix UI | PM6-018, FE6-024 | run selection (`>=2` terminal-success) + group-by + baseline -> side-by-side metric table with signed deltas + delta-status badges -> comparability warning band -> confusion matrix with ENTITY_CLASS/RELATION_TYPE toggle -> cell drilldown; honest loading/empty/error/permission/not-comparable/stale states, render `NOT_APPLICABLE` (never fake 0/100%) and `__NONE__` as labeled sentinel, degrade missing run to `excluded_runs` without full crash; no copy implying model selection/autonomous publish |
| FE6-026 | P0 | Frontend | MVP6.3 mock + actual smoke | PM6-018, FE6-025 | `npm run smoke:mvp6:benchmark:mock` and, if backend runnable, `npm run smoke:mvp6:benchmark:actual` exercise run-selection -> deltas -> confusion matrix -> cell drilldown |

## QA / Integration Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| INT6-001 | P0 | QA | MVP6.1 roadmap alignment | PM6-001~PM6-004 | implementation matches Theme 1 only and excludes real LLM, active learning, governance, agents, connectors, tenants |
| INT6-002 | P0 | QA | Backend contract/runtime smoke | BE6-001~BE6-005 | OpenAPI parses; dataset/sample/gold/run/metric/error endpoints satisfy the PM contract |
| INT6-003 | P0 | QA | Frontend mock/API contract consistency | FE6-001~FE6-005, BE6-005 | frontend types/mocks/client and route states match backend actual API for selected P0 scope |
| INT6-004 | P0 | QA | Gold Set to EvaluationRun happy path | BE6-001~BE6-004, FE6-001~FE6-004 | create dataset, add sample, add gold entity/relation, run deterministic evaluation, view metrics/errors |
| INT6-005 | P0 | QA | Regression guard for MVP1-MVP5 invariants | BE6-005, FE6-005 | candidate/published graph separation, evidence/version traceability, existing smoke markers, and no published graph mutation are preserved |
| INT6-006 | P1 | QA | MVP6.1 actual API smoke | BE6-010, FE6-009 | actual API smoke passes the dataset/sample/gold/run/metrics/errors flow or is classified by the Wave29 PASS/PARTIAL/FAIL rules |
| INT6-007 | P1 | QA | Candidate ref DTO consistency | BE6-011, FE6-010 | Frontend `EvaluationCandidateRef` matches Backend OpenAPI and displays entity/relation candidate context without crashes on nullable fields |
| INT6-008 | P1 | QA | MVP6.1 closeout recommendation | INT6-001~INT6-007 | QA recommends MVP6.1 closeout, targeted Wave30 hardening, or stop for PM redesign based on actual smoke and invariant evidence |
| INT6-009 | P1 | QA | Benchmark comparison acceptance | BE6-007, FE6-006 | multi-run comparison and confusion matrix are verified after MVP6.1 closeout and a separate PM freeze |
| INT6-010 | P2 | QA | Future MVP6 theme acceptance | PM6-007 | active learning, governance, agents, connectors, tenants, and ontology packs receive separate checklists before implementation |
| INT6-011 | P0 | QA | MVP6.2 scope alignment | PM6-010~PM6-013 | Wave30 artifacts agree on P0 flow, source artifacts, exclusions, and no runtime implementation |
| INT6-012 | P0 | QA | Active Learning contract checklist | PM6-011, BE6-012~BE6-015, FE6-011~FE6-014 | acceptance checklist verifies learning signal taxonomy, prompt suggestion states, and decision audit behavior |
| INT6-013 | P0 | QA | Learning signal safety guard | PM6-013 | checklist verifies no candidate/published graph mutation, no automatic policy enforcement, and preview-only auto-approval candidates |
| INT6-014 | P0 | QA | Wave31 implementation recommendation | INT6-011~INT6-013 | QA recommends MVP6.2 thin implementation, targeted contract hardening, or PM redesign |
| INT6-015 | P0 | QA | MVP6.2 hardening recheck | PM6-014, PM6-015, BE6-016~BE6-018, FE6-016~FE6-017 | Wave31 verifies command/state vocabulary, summary fields, source artifact enum, auto-preview fields, and no runtime leakage |
| INT6-016 | P0 | QA | Wave32 implementation recommendation | INT6-015 | QA recommends Wave32 thin implementation with frozen endpoint families, deterministic local data, and no-mutation safety boundary |
| INT6-017 | P0 | QA | MVP6.2 backend runtime acceptance | PM6-016, BE6-019~BE6-022 | QA verifies endpoint behavior, DTO/enums, decision transitions, non-`SUGGESTED` conflict, OpenAPI alignment, and mutation guard evidence |
| INT6-018 | P0 | QA | MVP6.2 frontend mock/API acceptance | PM6-016, FE6-018~FE6-021 | QA verifies Learning Insights mock/actual flow from summary through decision audit note, including loading, empty, error, permission, and conflict states |
| INT6-019 | P0 | QA | MVP6.2 no-mutation guard | PM6-016, BE6-022, FE6-021 | QA confirms no prompt, candidate, published graph, policy, extraction, or evaluation mutation occurs through learning signal operations |
| INT6-020 | P0 | QA | Wave32 closeout recommendation | INT6-017~INT6-019 | QA recommends MVP6.2 thin slice closeout, targeted Wave33 hardening, or stop for PM redesign based on runtime/UI evidence |
| INT6-021 | P0 | QA | MVP6.3 Benchmark Comparison acceptance checklist | PM6-017, BE6-023, FE6-022 | executable checklist verifies OpenAPI parse/additivity, comparison/confusion-matrix happy path over existing runs, new enums and metric delta/comparability/confusion-cell definitions, baseline + epsilon + NOT_COMPARABLE handling, read-only/no-mutation safety boundary, exclusions, and no runtime leakage under `apps/`/`infra/`; recommends Wave34 thin implementation, hardening, or PM redesign |
| INT6-022 | P0 | QA | MVP6.3 backend runtime acceptance | PM6-018, BE6-024~BE6-027 | validate the 4 endpoint families against `INT6_3` runtime gates R1-R10: DTO/enum alignment to OpenAPI, delta math + epsilon, comparability flags, confusion matrix sparse/`__NONE__`, cell drilldown, `POST` -> list -> GET-by-id round-trip (R3), eligibility/exclusion |
| INT6-023 | P0 | QA | MVP6.3 frontend mock/API acceptance | PM6-018, FE6-023~FE6-026 | validate the mock + actual flow run-selection -> deltas -> confusion matrix -> cell drilldown, including comparability / `NOT_APPLICABLE` / `__NONE__` / not-comparable / excluded-run states |
| INT6-024 | P0 | QA | MVP6.3 no-mutation guard | PM6-018, BE6-027 | confirm all-false `BenchmarkMutationGuard` at runtime and no candidate/published/prompt/policy/extraction/evaluation/gold mutation; reverify no MVP6.1 field/enum rename |
| INT6-025 | P0 | QA | Wave34 closeout recommendation | PM6-018, INT6-022~INT6-024 | run selected MVP1-MVP6.2 regression + smokes BE/FE touched; recommend MVP6.3 thin-slice closeout, targeted Wave35 hardening, or PM redesign with exact commands/artifacts and no leftover listeners on 8000/5173 |

## Scope Limits

- No MVP6-wide implementation in Wave28, Wave29, or Wave30.
- No real LLM benchmark provider call in MVP6.1 or MVP6.2 P0.
- No fine-tuning execution, live retraining, or training dataset export
  execution in MVP6.2 P0.
- No real prompt rewriting or prompt version mutation in MVP6.2 P0.
- No ontology governance approval workflow or impact simulation in MVP6.2 P0.
- No copilot, agent runtime, or autonomous action approval in MVP6.2 P0.
- No connector/plugin SDK or external sync runtime in MVP6.2 P0.
- No multi-tenant runtime in MVP6.2 P0.
- No candidate review, publish, or published graph mutation through evaluation
  or learning-signal analysis.
- No automatic policy enforcement or auto-approval execution in MVP6.2 P0.

## Backend Contract-First Scope

- Additive endpoint families for evaluation datasets, samples, gold entities,
  gold relations, deterministic evaluation runs, metrics, and error cases.
- Enum literals for dataset status, sample kind, run mode, run status, metric
  name, metric status, and error type.
- Focused tests for deterministic metric calculation and API happy path.
- OpenAPI export/parse according to existing project pattern.

## Frontend Field/UX Review Scope

- Evaluation/Benchmark route placement and contextual detail navigation.
- Dataset and sample create/list states.
- Gold entity/relation authoring with evidence context.
- Deterministic run action and status display.
- Metric cards/table with formula and not-applicable state.
- Error case explorer with candidate-vs-gold and evidence comparison.
- Loading, empty, error, and no-data states.

## QA Acceptance Checklist Scope

- `INT6-*` contract checks.
- deterministic seed requirements.
- backend API happy path.
- frontend mock and actual API consistency.
- metric formula and zero-denominator behavior.
- error case comparison context.
- MVP1-MVP5 invariant regression guard.
