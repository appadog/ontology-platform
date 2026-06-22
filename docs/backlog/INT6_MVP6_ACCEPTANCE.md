# INT6 MVP 6.1 Acceptance Checklist

Status: `MVP6.1 CLOSED / MVP6.2 CHECKLIST NEXT`
Date: 2026-06-20
Owner: QA / Integration

This checklist turns `INT6-001` through `INT6-005` into executable acceptance
criteria for MVP6.1 Gold Set / Benchmark Studio. Wave28 may implement runtime
and UI only for the PM-approved P0 thin slice.

## Scope and Source of Truth

Source documents:

- Agent rules: `AGENTS.md`
- Handoff process: `.agents/skills/handoff-reporting/SKILL.md`
- Current state: `docs/handoffs/CURRENT_STATE.md`
- Wave order: `docs/handoffs/wave-028/NEXT_ORDERS.md`
- MVP6 roadmap: `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`
- MVP6 prep brief: `docs/pm/MVP6_PREP_BRIEF.md`
- MVP6 backlog: `docs/backlog/MVP6_DRAFT_BACKLOG.md`
- PM report: `docs/handoffs/wave-028/PM_REPORT.md`

MVP6.1 P0 boundary:

- EvaluationDataset list/detail/create.
- EvaluationSample list/create using source/sample metadata or deterministic
  manual snippet; no parser rebuild.
- GoldEntity and GoldRelation list/create with evidence context.
- EvaluationRun deterministic mock execution.
- Metrics: entity precision/recall/F1, relation precision/recall/F1, relation
  direction accuracy, evidence match rate.
- EvaluationErrorCase list/detail with candidate-vs-gold and evidence context.

Explicit Wave28 exclusions:

- real LLM benchmark execution;
- fine-tuning or training export;
- active learning and prompt improvement suggestions;
- ontology governance workflow and impact simulation;
- copilot/agent runtime;
- connector/plugin SDK;
- multi-tenant runtime;
- mutation of candidate review, publish, or published graph paths.

## Current QA Verdict

- MVP6.1 Gold Set / Benchmark Studio: `PASS`
- Wave28 `INT6-001` through `INT6-005`: `PASS`
- Wave29 `INT6-006` through `INT6-008`: `PASS`
- `smoke:mvp6:mock`: `PASS`
- `smoke:mvp6:actual`: `PASS`
- Recommended next step: open MVP6.2 Active Learning / Continuous Improvement
  as a contract-first planning wave before runtime implementation.

## Verdict Semantics

- `PASS`: contract, seed/runtime behavior, frontend UI state, and regression
  assertions all match this checklist.
- `PARTIAL`: the surface exists but a required metric, evidence/version field,
  UI state, seed, or assertion is missing.
- `FAIL`: behavior violates a P0 boundary, especially published graph mutation,
  missing evidence, missing version context, or later MVP6 scope leakage.
- `NOT RUNNABLE`: required runtime endpoint, frontend route, seed, or harness is
  absent or cannot start.

## Deterministic Seed Requirements

Wave28 QA needs one fixed project fixture with:

| Seed area | Required fixture data | Purpose |
|---|---|---|
| Project context | one active project, current ontology version, prompt version, parser version, deterministic mock model name | verify run version context |
| Source/sample | one text or table sample with stable source/source segment locator and content text | create evaluation sample without parser rebuild |
| Gold entities | at least two gold entities with class ids, normalized values, and evidence locators | verify entity precision/recall/F1 |
| Gold relation | one gold relation connecting the gold entities with relation id, direction, and evidence locator | verify relation metrics and direction accuracy |
| Deterministic predictions | one exact match, one missing item, one extra item, and one direction or evidence mismatch | verify metric numerator/denominator and error cases |
| Error cases | stable error ids or deterministic ordering | verify error list/detail and UI explorer |

Seed invariants:

- Gold items are evaluation artifacts, not published graph facts.
- Candidate graph and published graph remain separated.
- Evaluation run output cannot approve, reject, publish, or mutate candidates.
- Evidence context is present on gold items and error cases.
- Version/run context is present on every evaluation run.

## Wave28 Runnable Acceptance Gates

Gate 1, backend thin runtime:

- Implement selected additive `/api/v1` endpoints.
- Provide deterministic metric calculation without external LLM calls.
- Export or update OpenAPI according to existing project pattern.
- Run focused backend tests for metric calculation and happy path.

Gate 2, frontend mock-first UI:

- Add stable Evaluation/Benchmark navigation without flattening ID-bound detail
  routes into global LNB.
- Provide mock fixtures for dataset, sample, gold entity/relation, run, metrics,
  and error cases.
- Render loading, empty, error, not-applicable metric, and no-error states.
- Wire actual API mode if backend endpoints are available in this wave.

Gate 3, deterministic happy path:

1. Create an evaluation dataset.
2. Add a sample to the dataset.
3. Add at least one gold entity to the sample.
4. Add at least one gold relation using the gold entity ids.
5. Create a `DETERMINISTIC_MOCK` evaluation run with ontology, prompt, model,
   model run, and parser context.
6. Read run detail and confirm status reaches `SUCCEEDED`.
7. Read metrics and confirm formulas, numerator, denominator, value/status.
8. Read error cases and confirm candidate-vs-gold plus evidence context.
9. Confirm no candidate review, publish job, or published graph row is mutated.

Gate 4, regression guard:

- Existing MVP1-MVP5 smoke markers and routes remain intact.
- Existing closed safety decisions remain true:
  - LLM/evaluation output does not write to published graph;
  - evidence is preserved;
  - candidate and published graph remain separate;
  - version context is not dropped.

## INT6-001 MVP6.1 Roadmap Alignment

Checks:

- Implementation references `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`
  Theme 1 only.
- Backend/Frontend/QA reports state that later MVP6 themes are excluded.
- No runtime code or UI is added for active learning, governance, agents,
  connectors, ontology packs, multi-tenant, or advanced storytelling.

Exit criterion:

- `PASS` when scope matches MVP6.1 P0 only.
- `FAIL` when later MVP6 themes enter Wave28 runtime/UI scope.

## INT6-002 Backend Contract/Runtime Smoke

Contract checks:

- OpenAPI includes selected dataset, sample, gold entity, gold relation,
  evaluation run, metric, and error case paths.
- Required schemas expose evidence context and version/run context.
- Enum literals match PM freeze:
  - `EvaluationDatasetStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`
  - `EvaluationSampleKind`: `SOURCE_SEGMENT`, `MANUAL_TEXT`, `TABLE_ROW`
  - `EvaluationRunMode`: `DETERMINISTIC_MOCK`
  - `EvaluationRunStatus`: `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`
  - `EvaluationMetricStatus`: `MEASURED`, `NOT_APPLICABLE`
  - `EvaluationErrorType`: `MISSING_ENTITY`, `EXTRA_ENTITY`,
    `WRONG_ENTITY_CLASS`, `MISSING_RELATION`, `EXTRA_RELATION`,
    `WRONG_RELATION_TYPE`, `WRONG_RELATION_DIRECTION`, `EVIDENCE_MISMATCH`

Runtime checks:

- Dataset create/list/detail returns stable ids and counts.
- Sample create/list preserves content or source locator.
- Gold entity/relation create/list preserves evidence context.
- Deterministic run computes metrics without network or LLM provider calls.
- Error case list/detail returns candidate-vs-gold comparison context.

Exit criterion:

- `PASS` when contract and runtime smoke pass.
- `PARTIAL` when endpoints exist but metrics/errors/evidence/version fields are
  incomplete.
- `FAIL` when an endpoint mutates published graph or drops evidence/version
  context.

## INT6-003 Frontend Mock/API Contract Consistency

Checks:

- Frontend TypeScript types match actual backend OpenAPI for selected MVP6.1
  schemas.
- Mock fixtures cover:
  - dataset list/detail/create result;
  - sample list/create result;
  - gold entity/relation list/create result;
  - evaluation run detail/status;
  - metric table/cards;
  - error case list/detail.
- UI shows loading, empty, error, `NOT_APPLICABLE`, and no-error states.
- Detail pages are reached contextually from the Evaluation/Benchmark area, not
  as ID-bound global LNB entries.

Exit criterion:

- `PASS` when mock and actual API modes agree for selected fields and route
  smoke passes.
- `PARTIAL` when mock UI exists but actual API or DTO sync is incomplete.
- `FAIL` when UI claims real benchmark/LLM behavior not present in P0.

## INT6-004 Gold Set to EvaluationRun Happy Path

Required flow:

```text
create dataset
-> add sample
-> add gold entity
-> add gold relation
-> run deterministic evaluation
-> view metrics
-> view errors
```

Metric checks:

- Entity precision, recall, and F1 use entity TP/FP/FN counts.
- Relation precision, recall, and F1 use relation TP/FP/FN counts.
- Relation direction accuracy counts correctly directed matched relation pairs.
- Evidence match rate uses same-sample/source evidence overlap or quote match.
- Zero-denominator metrics return `NOT_APPLICABLE`, not fake zero.

Exit criterion:

- `PASS` when the full flow is runnable by API and visible in UI.
- `PARTIAL` when API flow passes but UI or metric display is incomplete.
- `FAIL` when metric formulas are wrong or the flow requires real LLM calls.

## INT6-005 MVP1-MVP5 Invariant Regression Guard

Checks:

- Published graph mutation count or version pointer is unchanged by evaluation
  dataset/gold/run operations.
- Candidate review and publish APIs are not called as part of evaluation run.
- Gold/evaluation records remain separate from candidate and published graph
  records.
- Existing smoke scripts or route markers for closed MVP2-MVP5 flows are not
  removed or renamed without explicit PM/QA approval.
- Reports list any skipped regression command and why.

Exit criterion:

- `PASS` when invariants are verified by focused tests, smoke evidence, or
  documented inspection.
- `PARTIAL` when checks are documented but not executable in the environment.
- `FAIL` when evaluation mutates candidate review/publish/published graph state.

## Wave29 Hardening Addendum

Wave29 is a targeted MVP6.1 hardening wave. It does not expand the product into
MVP6.2 or later MVP6 themes.

Wave29 excluded scope:

- Active Learning or prompt-improvement suggestions.
- Ontology governance approval workflow.
- Impact simulation.
- Copilot, agent runtime, or autonomous action execution.
- Connector/plugin SDK or external connector runtime.
- Multi-tenant runtime or tenant isolation.
- Ontology packs or domain template marketplace.
- Advanced visualization/storytelling.

## Wave29 Closeout

Accepted checks:

- `INT6-006`: actual API smoke self-creates project, dataset, sample, gold
  entities, gold relations, deterministic evaluation run, metrics, errors, and
  frontend actual route markers.
- `INT6-007`: Frontend `EvaluationCandidateRef` matches Backend OpenAPI fields
  and displays entity/relation candidate context with nullable evidence
  fallback.
- `INT6-008`: QA recommends MVP6.1 closeout and MVP6.2 contract-first planning.

Non-blocking follow-ups:

- Durable DB/Alembic persistence remains P1/P2.
- Legacy `/api/v1/evaluation-datasets/{dataset_id}/versions` 404 during actual
  route render remains a cleanup candidate.
- Docker/PostgreSQL compose smoke and broader Playwright formalization remain
  environment/tooling follow-ups.
- Real LLM benchmark provider execution.

### INT6-006 MVP6.1 Actual API Smoke

Required command:

```text
cd apps/frontend && npm run smoke:mvp6:actual
```

Equivalent naming is acceptable only if the Frontend report documents the exact
command and it is wired to the same actual backend API flow.

`PASS` criteria:

- The command exists and exits `0` against a running actual backend API, not
  mock-only fixtures.
- The smoke creates or seeds all data it reads, so repeated runs are
  reproducible without durable DB/Alembic persistence.
- The flow covers:
  `create dataset -> add sample -> add gold entity -> add gold relation -> run DETERMINISTIC_MOCK -> read run detail -> read metrics -> read errors`.
- Run detail reaches `SUCCEEDED` and keeps `ontology_version_id`,
  `prompt_version_id`, `model_name`, `model_run_id`, and `parser_version`.
- Metrics include the Wave28 P0 metric set and verify `value`, `numerator`,
  `denominator`, `formula`, and `status`; zero-denominator metrics remain
  `NOT_APPLICABLE` with `value: null`.
- Error list/detail expose `sample_id`, `error_type`, `comparison_summary`,
  gold/candidate evidence context, and `candidate_ref` when applicable.
- The route visibly renders actual-mode MVP6.1 markers for dataset/sample/gold
  item/run/metric/error states.
- The smoke does not require real LLM provider calls and does not mutate
  candidate review, publish job, or published graph state.

`PARTIAL` criteria:

- Backend actual API focused tests and `smoke:mvp6:mock` pass, but the actual
  frontend smoke script is missing, not wired, or not runnable in the current
  environment.
- The actual API flow succeeds but the frontend route smoke does not verify
  metrics, error cases, or actual-mode rendering.
- The script can run only with undocumented manual setup, stale in-memory
  state, or non-repeatable ids.
- Metric/error content exists but one non-safety field is missing from the smoke
  assertion and is documented as a follow-up.

`FAIL` criteria:

- The command claims actual mode while using mock-only data.
- The flow requires a real LLM provider, fine-tuning, MVP6.2+ runtime, or
  durable persistence that PM has not promoted.
- Evaluation operations mutate candidate review, publish job, or published
  graph state.
- Evidence or version/run context is dropped from run, metric, or error-case
  surfaces.
- The actual API smoke cannot create/read the MVP6.1 happy path at all.

### INT6-007 Candidate Ref DTO Consistency

Frontend must model `EvaluationErrorCase.candidate_ref` as
`EvaluationCandidateRef | null`, separate from the narrower generic
`CandidateRef` used by validation/review/publish surfaces.

Required fields:

- `candidate_id`
- `candidate_kind`: `ENTITY` or `RELATION`
- `sample_id`
- `ontology_class_id`
- `ontology_relation_id`
- `label`
- `normalized_value`
- `source_gold_entity_id`
- `target_gold_entity_id`
- `evidence`: `GoldEvidenceRef | null`

`PASS` criteria:

- Frontend TypeScript fields match Backend OpenAPI for
  `EvaluationCandidateRef`.
- Entity error cases display candidate kind/id, sample id, ontology class id,
  label or normalized value, and evidence locator/quote when present.
- Relation error cases display candidate kind/id, sample id, ontology relation
  id, source/target gold entity ids, and evidence locator/quote when present.
- Nullable optional fields render stable fallback text and do not crash route,
  mock smoke, or actual smoke.

`PARTIAL` criteria:

- Type widening is present but display still omits relation endpoint or evidence
  context.
- Mock data covers the widened fields but actual API smoke does not assert them.

`FAIL` criteria:

- Frontend still uses the generic `CandidateRef` shape for
  `EvaluationErrorCase.candidate_ref`.
- Candidate ref rendering crashes on a valid Backend `EvaluationCandidateRef`.

### INT6-008 MVP6.1 Closeout Recommendation

`PASS` criteria:

- `INT6-001` through `INT6-007` are PASS or have only documented P1 tooling/env
  exceptions that do not affect product safety.
- Process-local runtime store is sufficient for reproducible MVP6.1 actual
  smoke.
- Later MVP6 themes remain excluded.

`PARTIAL` criteria:

- MVP6.1 product flow works but actual smoke, candidate ref display, or selected
  regression evidence remains incomplete.

`FAIL` criteria:

- Any safety invariant fails, especially published graph mutation, missing
  evidence, missing version/run context, or MVP6.2+ scope leakage.
