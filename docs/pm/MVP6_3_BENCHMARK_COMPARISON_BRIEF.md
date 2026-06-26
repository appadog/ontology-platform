# MVP6.3 Benchmark Comparison / Confusion Matrix Brief

Status: `FROZEN / WAVE 33 PM DECISION`
Date: 2026-06-26

This brief freezes the next MVP6 theme P0 after MVP6.1 (Gold Set / Benchmark
Studio) and MVP6.2 (Active Learning) closed. The chosen theme is **Benchmark
Comparison / Confusion Matrix**, the smallest coherent extension of the already
closed MVP6.1 evaluation surface.

Wave33 is **contract-first planning only**. No runtime API route, FastAPI
service, DB model, Alembic migration, frontend route/component, seed, smoke
script, or test may be added in Wave33. Runtime implementation waits for a
Wave34 thin-implementation order after Backend contract draft, Frontend
field/state/IA review, and a QA executable checklist are ready.

## Theme Choice and Rationale

- Chosen P0: **Benchmark Comparison / Confusion Matrix** (`PM6-017`, `BE6-023`,
  `FE6-022`, `INT6-021`).
- Rationale:
  - It is the **smallest coherent delta** on closed surfaces. MVP6.1 already
    produces `EvaluationRun` records with `model_name`, `model_provider`,
    `prompt_version_id`, `ontology_version_id`, `parser_version`,
    `dataset_id`/`dataset_version_id`, per-`EvaluationMetricName` metrics, and
    `EvaluationErrorCase` rows typed by `EvaluationErrorType` with class/relation
    context. Comparison and confusion matrix are pure **read-side aggregation**
    over these existing artifacts.
  - It is **read-only by construction**: no gold-set authoring, no dataset
    revisioning write, no new run execution, no LLM call. This keeps the safety
    boundary trivially intact and is the lowest-risk next slice.
  - It directly completes the roadmap's stated MVP6.1 benchmark goals that were
    explicitly deferred to P1 in `docs/pm/MVP6_PREP_BRIEF.md`: "Model/prompt
    comparison board across multiple runs", "Relation-type matrix and confusion
    matrix", "Class classification accuracy", and "Benchmark filters by source
    type, relation type, class, prompt, model, ontology version".
  - The roadmap (`04_...md` §4.1–4.4) lists confusion matrix and model/prompt
    comparison as core MVP6.1 Benchmark Studio capabilities, so this closes the
    Benchmark Studio theme rather than opening a larger new theme.
- Rejected alternatives for this slice:
  - **Gold Set authoring policy + dataset revisioning** (`PM6-005`/`BE6-006`):
    introduces write/ownership/edit/archive and revision lifecycle semantics —
    a larger, mutation-bearing surface. Defer to a later wave.
  - **Theme-3+ slices** (governance, impact simulation, copilot/agents,
    connector SDK, multi-tenant, ontology packs, advanced visualization): each is
    a much larger theme requiring its own boundary and ADR. Out of scope for the
    smallest next step.

## P0 Goal

Enable this deterministic read-only happy path:

```text
select project
-> open Benchmark Comparison
-> select 2+ existing evaluation runs (by model/prompt/ontology/dataset version)
-> view side-by-side metric comparison with deltas
-> view per-class / per-relation-type confusion matrix and bucket accuracy
-> drill into a confusion cell to its contributing error cases
```

Every number shown is recomputed/aggregated from already-stored MVP6.1 run,
metric, and error-case artifacts. No new evaluation run is executed, no gold set
is authored, and nothing mutates candidate/published graph state.

## Source Artifacts This P0 May Analyze

P0 reads **only** existing closed MVP6.1 evaluation artifacts:

- `EvaluationRun` (run context: `model_name`, `model_provider`,
  `prompt_version_id`, `ontology_version_id`, `parser_version`, `dataset_id`,
  `dataset_version_id`, `status`, `started_at`, `completed_at`, `metric_summary`).
- `EvaluationMetric` per `EvaluationMetricName` (`value`, `numerator`,
  `denominator`, `formula`, `status`).
- `EvaluationErrorCase` typed by `EvaluationErrorType`, carrying
  `gold_entity_id`/`gold_relation_id`, `candidate_ref` (`EvaluationCandidateRef`
  with class/relation context), `sample_id`, and evidence context.
- `EvaluationDimensions` bucket fields (`class_type`, `relation_type`,
  `source_type`) for grouping.

P0 must **not** read or join MVP3 review/correction tables, MVP4 quality
metrics, MVP6.2 learning signals, or published-graph data. Those are separate
surfaces and out of this slice.

## Frozen Enums / States / Definitions

### Comparison run eligibility

A run is comparable in a comparison set when:

- `status` is `SUCCESS` / `SUCCEEDED` (a terminal successful run);
- it belongs to the same `project_id` as the comparison request.

Cross-dataset comparison is allowed but must be **flagged**, not blocked (see
`ComparisonComparabilityFlag`). `PENDING`/`RUNNING`/`FAILED` runs are not
eligible and are excluded with a reason.

### `BenchmarkComparisonGroupBy` (new enum)

Dimension by which runs are grouped/labeled in a comparison:

- `MODEL` (by `model_name` + `model_provider`)
- `PROMPT_VERSION` (by `prompt_version_id`)
- `ONTOLOGY_VERSION` (by `ontology_version_id`)
- `DATASET_VERSION` (by `dataset_id` + `dataset_version_id`)
- `PARSER_VERSION` (by `parser_version`)

### `ComparisonComparabilityFlag` (new enum)

Per-pair / per-set comparability warnings so deltas are never silently
misleading:

- `SAME_DATASET` — runs share dataset + dataset version (fully comparable).
- `DIFFERENT_DATASET_VERSION` — same dataset, different version.
- `DIFFERENT_DATASET` — different dataset entirely.
- `DIFFERENT_ONTOLOGY_VERSION` — ontology version differs.
- `MISSING_METRIC` — a metric is `NOT_APPLICABLE`/absent in at least one run, so
  its delta is not computable.

### `ConfusionMatrixAxis` (new enum)

What the confusion matrix is computed over (reusing MVP6.1 buckets only):

- `ENTITY_CLASS` — rows/cols are ontology class buckets (`class_type`);
  gold class vs. candidate class.
- `RELATION_TYPE` — rows/cols are relation-type buckets (`relation_type`);
  gold relation type vs. candidate relation type.

### Metric set reused (no new metric names)

Comparison reuses the existing frozen `EvaluationMetricName` set verbatim:
`ENTITY_PRECISION`, `ENTITY_RECALL`, `ENTITY_F1`, `RELATION_PRECISION`,
`RELATION_RECALL`, `RELATION_F1`, `RELATION_DIRECTION_ACCURACY`,
`EVIDENCE_MATCH_RATE`. No new metric name is introduced in this slice.

### Delta definition

For each metric and each compared run vs. a chosen baseline run:

- `delta = run.value - baseline.value` when both are `MEASURED`.
- `delta_status`: `IMPROVED` (delta > epsilon), `REGRESSED` (delta < -epsilon),
  `UNCHANGED` (|delta| <= epsilon), `NOT_COMPARABLE` (either side
  `NOT_APPLICABLE`/absent). Epsilon is a fixed small constant (e.g. `0.0001`),
  defined by Backend in the contract draft; PM only requires it be explicit and
  deterministic.
- Baseline selection is explicit in the request (a chosen `baseline_run_id`); if
  omitted, the first run in the set is the baseline.

### Confusion matrix cell definition

- Cells are counts derived **only** from `EvaluationErrorCase` rows plus matched
  (true-positive) pairs already implied by a run's stored metrics/error set.
- For `ENTITY_CLASS`: a `WRONG_ENTITY_CLASS` error contributes to cell
  (gold_class, candidate_class); a `MISSING_ENTITY` contributes to
  (gold_class, `__NONE__`); an `EXTRA_ENTITY` contributes to (`__NONE__`,
  candidate_class); correct matches contribute to the diagonal.
- For `RELATION_TYPE`: `WRONG_RELATION_TYPE` and `WRONG_RELATION_DIRECTION`,
  `MISSING_RELATION`, `EXTRA_RELATION`, and matched relations map analogously.
- `__NONE__` is a reserved sentinel axis label for absent gold (false positive)
  or absent candidate (false negative); it is a display sentinel, not a stored
  ontology id.
- Each cell exposes `count` and the list of contributing `error_case_id`s (or a
  count plus a drill query), so the UI can drill from a cell to error cases.
- Zero-denominator / empty-bucket rule mirrors MVP6.1: an empty bucket reports a
  count of 0 and any derived rate as `NOT_APPLICABLE`, never a fabricated 0%/100%.

## Proposed Additive Endpoint Families (Backend will finalize names)

All additive, read-only, project-scoped, and additive to MVP1–MVP6.2 paths:

```text
POST /api/v1/projects/{project_id}/benchmark-comparisons
GET  /api/v1/projects/{project_id}/benchmark-comparisons
GET  /api/v1/benchmark-comparisons/{comparison_id}
GET  /api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix
GET  /api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix/cells/{cell_id}/error-cases
```

Notes for Backend:

- `POST .../benchmark-comparisons` is a **read-aggregation builder**, not a
  mutation of evaluation data. It composes a comparison view object from
  selected `run_ids` + `group_by` + optional `baseline_run_id`. Whether the
  comparison object is persisted or computed on the fly is a Backend P0 decision;
  if persisted, it is an analysis artifact only and must carry a no-mutation
  guard analogous to MVP6.2 (`candidate_graph_mutated: false`,
  `published_graph_mutated: false`, `evaluation_run_started: false`,
  `gold_set_mutated: false`).
- The confusion-matrix cell error-case endpoint reuses existing
  `EvaluationErrorCase` shapes; it does not define a new error model.

## Required Fields (PM-frozen, Backend may refine names)

### BenchmarkComparison (request)

```text
project_id
run_ids[]            (>= 2 eligible run ids)
group_by             (BenchmarkComparisonGroupBy)
baseline_run_id      (optional; default = run_ids[0])
metric_names[]       (optional; default = full EvaluationMetricName set)
```

### BenchmarkComparison (response)

```text
id
project_id
group_by
baseline_run_id
runs[]               (each: run_id, label, group_value, run context echo,
                      comparability_flags[])
metric_rows[]        (each: metric_name, baseline_value, per-run value/delta/
                      delta_status/metric_status)
excluded_runs[]      (each: run_id, exclusion_reason)
comparability_summary (flags[] across the set)
generated_at
mutation_guard       (all-false analysis-only guard)
```

### ConfusionMatrix (response)

```text
comparison_id
run_id               (matrix is computed per run; one matrix per compared run)
axis                 (ConfusionMatrixAxis)
labels[]             (ontology class/relation labels + reserved __NONE__)
cells[]              (each: id, gold_label, candidate_label, count,
                      contributing_error_case_ref)
totals               (row/col/diagonal counts, NOT_APPLICABLE where empty)
generated_at
```

## Safety Boundary

- This slice is **read-only analysis**. It reads existing evaluation runs,
  metrics, and error cases and produces comparison and confusion-matrix views.
- It does **not** execute new evaluation runs, call any LLM/provider, author or
  edit gold sets, revise datasets, or write to candidate review, publish, or
  published-graph paths.
- Candidate graph and published graph separation is untouched.
- Evidence / ontology version / prompt version / model run / parser version
  traceability is preserved because comparison echoes the existing run context
  and links to existing error cases with their evidence; it never strips or
  invents context.
- If a comparison object is persisted, it is an analysis artifact with an
  all-false `mutation_guard`, mirroring the MVP6.2 audit-only pattern.
- No autonomous publish, no automatic policy enforcement, no real LLM execution.

## Explicit Exclusions (P1 / later)

- Gold Set authoring policy, expert ownership, edit/archive, dataset revisioning
  write workflow (`PM6-005`/`BE6-006`).
- Executing new evaluation runs from the comparison UI (runs must already exist).
- Real LLM / real provider benchmark execution.
- Ontology constraint pass-rate metric and any new `EvaluationMetricName`.
- Statistical significance testing, trend charts over time, scheduled benchmark
  regression alerts.
- Export of comparison results to fine-tuning / training datasets.
- Cross-project or cross-organization benchmark comparison.
- MVP6.2 learning-signal, MVP3 review/correction, and MVP4 quality joins.
- Ontology governance, impact simulation, copilot/agent runtime, connector/
  plugin SDK, multi-tenant runtime, ontology packs, advanced
  visualization/storytelling.

## Product Invariants Confirmation

| Invariant | Preserved? | Why |
|---|---|---|
| Candidate vs published graph separation | Yes | No graph read/write at all; only evaluation artifacts. |
| Evidence/version/model-run/audit traceability | Yes | Comparison echoes run context and links to existing error cases with evidence. |
| No autonomous publish | Yes | No publish path touched. |
| No automatic policy enforcement | Yes | No policy surface touched. |
| No real LLM execution in P0 thin slice | Yes | Reads stored runs; executes nothing. |
| Additive only | Yes | New read-only endpoints; no change to MVP1–MVP6.2 paths or smokes. |
