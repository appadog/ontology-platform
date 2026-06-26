# MVP 6.3 Benchmark Comparison / Confusion Matrix API Contract Draft

Status: `WAVE 33 CONTRACT-FIRST PLANNING ONLY`
Date: 2026-06-26
Backlog: `BE6-023` (theme `PM6-017`; Frontend `FE6-022`; QA `INT6-021`)

This draft extends the closed MVP6.1 Gold Set / Benchmark Studio evaluation
surface with read-only **Benchmark Comparison / Confusion Matrix** planning
contracts. It is the smallest coherent delta on the already-closed MVP6.1
evaluation artifacts and introduces no new evaluation run engine and no
gold-set authoring.

Canonical machine-readable planning artifact:
`docs/api/openapi-mvp6-3-draft.json` (OpenAPI 3.1.0, `info.version`
`0.6.3-draft`).

Wave33 is contract-first planning only. This draft does **not** implement
FastAPI routes, runtime services, database models, migrations, seed data,
workers, or tests. Runtime implementation waits for a Wave34 thin-implementation
order after Frontend field/state/IA review (`FE6-022`) and a QA executable
checklist (`INT6-021`) are ready.

Frozen by `docs/pm/MVP6_3_BENCHMARK_COMPARISON_BRIEF.md` and
`docs/adr/0009-mvp6-3-benchmark-comparison-read-only-boundary.md`. Where the
PM brief and this draft differ on a name, the PM brief wins; this draft only
refines field names the PM brief explicitly delegated to Backend.

## Contract Principles

- MVP6.3 is **additive**. Existing MVP1–MVP6.2 paths and schemas are not
  renamed, moved, or removed. Existing MVP6.1 evaluation paths in
  `docs/api/openapi-mvp6-draft.json` remain the source of truth for evaluation
  run/metric/error-case shapes.
- The contract is **read-only aggregation**. It reads existing
  `EvaluationRun`, `EvaluationMetric`, `EvaluationErrorCase`,
  `EvaluationCandidateRef`, and `EvaluationDimensions` data and produces
  comparison and confusion-matrix views. It executes no new evaluation run,
  calls no LLM/provider, and authors/edits no gold set.
- The only write-shaped operation is `POST .../benchmark-comparisons`, which is
  a **read-aggregation builder** that composes a comparison view object from
  selected `run_ids`. Whether the comparison object is persisted or computed on
  the fly is a Backend implementation choice; either way it is an analysis
  artifact only and carries an all-false `mutation_guard` mirroring the MVP6.2
  audit-only pattern.
- **No new `EvaluationMetricName`.** The existing eight-metric set is reused
  verbatim.
- DTO/schema names use PascalCase. JSON fields use snake_case. Enum literals use
  UPPER_SNAKE_CASE.
- Comparison never presents a silently misleading delta: cross-dataset /
  cross-ontology-version comparisons are **flagged**, not blocked; missing or
  `NOT_APPLICABLE` metrics yield `NOT_COMPARABLE`; empty buckets yield
  `NOT_APPLICABLE`, never a fabricated 0%/100%.

## Preserved MVP6.1 / MVP6.2 Boundary

- Evaluation artifacts remain analysis artifacts, not published graph facts.
- Comparison cannot approve, reject, or publish candidates and cannot move the
  current published graph pointer.
- Comparison echoes existing run context (model/provider, prompt version,
  ontology version, parser version, dataset/dataset version, model run) and
  links to existing `EvaluationErrorCase` rows with their evidence. It never
  strips or invents context.
- P0 reads **only** MVP6.1 evaluation artifacts. It does not join MVP3
  review/correction, MVP4 quality, MVP6.2 learning signals, or published-graph
  data.
- Durable persistence of comparison objects (if implemented) remains a Backend
  P0 implementation choice and an analysis artifact only; durable evaluation
  persistence policy is unchanged.

## Reused MVP6.1 Artifacts (verbatim, not redefined)

These are referenced by `$ref` to the MVP6.1 shapes. This draft does not
redefine them. Field names below are quoted from
`apps/backend/app/modules/evaluation/schemas.py` and
`docs/api/openapi-mvp6-draft.json`.

| Reused type | Key fields used by comparison |
|---|---|
| `EvaluationRun` | `id`, `project_id`, `dataset_id`, `status` (`EvaluationRunStatus` or `"SUCCESS"` literal), `run_mode`, `ontology_version_id`, `prompt_version_id`, `model_name`, `model_provider`, `model_run_id`, `parser_version`, `dataset_version_id`, `started_at`, `completed_at`, `metric_summary`, `dimensions` |
| `EvaluationMetric` | `run_id`, `metric_name` (`EvaluationMetricName`), `value`, `numerator`, `denominator`, `formula`, `status` (`EvaluationMetricStatus`) |
| `EvaluationErrorCase` | `id`, `run_id`, `project_id`, `dataset_id`, `sample_id`, `error_type` (`EvaluationErrorType`), `gold_entity_id`, `gold_relation_id`, `candidate_ref` (`EvaluationCandidateRef`), `comparison_summary`, `gold_evidence`, `candidate_evidence`, `created_at` |
| `EvaluationCandidateRef` | `candidate_id`, `candidate_kind`, `sample_id`, `ontology_class_id`, `ontology_relation_id`, `label`, `source_gold_entity_id`, `target_gold_entity_id`, `evidence` |
| `EvaluationDimensions` | `class_type`, `relation_type`, `source_type` buckets for grouping |
| `EvaluationMetricName` | `ENTITY_PRECISION`, `ENTITY_RECALL`, `ENTITY_F1`, `RELATION_PRECISION`, `RELATION_RECALL`, `RELATION_F1`, `RELATION_DIRECTION_ACCURACY`, `EVIDENCE_MATCH_RATE` |
| `EvaluationMetricStatus` | `MEASURED`, `NOT_APPLICABLE` |
| `EvaluationErrorType` | `MISSING_ENTITY`, `EXTRA_ENTITY`, `WRONG_ENTITY_CLASS`, `MISSING_RELATION`, `EXTRA_RELATION`, `WRONG_RELATION_TYPE`, `WRONG_RELATION_DIRECTION`, `EVIDENCE_MISMATCH` |
| `GoldEvidenceRef` | evidence locator echo on error cases |

Note: `EvaluationRunStatus` literals are `PENDING`, `RUNNING`, `SUCCEEDED`,
`FAILED`. `EvaluationRun.status` additionally allows the string literal
`"SUCCESS"`. A run is treated as a **terminal successful run** when its status
is `SUCCEEDED` or `SUCCESS`. `PENDING`, `RUNNING`, and `FAILED` are not
eligible.

## New Enums (MVP6.3 only)

No new metric name is introduced. New enums are limited to
comparison/confusion concerns and match the PM brief verbatim.

### `BenchmarkComparisonGroupBy`

Dimension by which runs are grouped/labeled in a comparison:

```text
MODEL              (by model_name + model_provider)
PROMPT_VERSION     (by prompt_version_id)
ONTOLOGY_VERSION   (by ontology_version_id)
DATASET_VERSION    (by dataset_id + dataset_version_id)
PARSER_VERSION     (by parser_version)
```

### `ComparisonComparabilityFlag`

Per-pair / per-set comparability warnings so deltas are never silently
misleading:

```text
SAME_DATASET                 (runs share dataset + dataset version; fully comparable)
DIFFERENT_DATASET_VERSION    (same dataset, different version)
DIFFERENT_DATASET            (different dataset entirely)
DIFFERENT_ONTOLOGY_VERSION   (ontology version differs)
MISSING_METRIC               (a metric is NOT_APPLICABLE/absent in >=1 run; its delta is not computable)
```

### `ConfusionMatrixAxis`

What the confusion matrix is computed over (reusing MVP6.1 buckets only):

```text
ENTITY_CLASS     (rows/cols = ontology class buckets / class_type; gold class vs candidate class)
RELATION_TYPE    (rows/cols = relation-type buckets / relation_type; gold relation type vs candidate relation type)
```

### `MetricDeltaStatus`

Per-metric, per-run delta status against the baseline run:

```text
IMPROVED         (delta > epsilon)
REGRESSED        (delta < -epsilon)
UNCHANGED        (|delta| <= epsilon)
NOT_COMPARABLE   (either side NOT_APPLICABLE / absent)
```

### `RunExclusionReason`

Why an eligible-looking run was excluded from the comparison set:

```text
NOT_TERMINAL_SUCCESS    (status is PENDING / RUNNING / FAILED)
DIFFERENT_PROJECT       (run.project_id != request project_id)
RUN_NOT_FOUND           (run id does not resolve)
DUPLICATE_RUN_ID        (run id repeated in run_ids[])
```

## Definitions and Deterministic Rules

### Comparison epsilon

`delta_epsilon = 0.0001` (fixed deterministic constant; same tolerance used by
the MVP4 quality recomputation proof). It is echoed in the response as
`delta_epsilon` so the UI and QA can assert it explicitly.

### Delta definition

For each metric and each compared run vs. the baseline run:

- `delta = run.value - baseline.value` when both metric values are `MEASURED`.
- `delta_status` is `IMPROVED` / `REGRESSED` / `UNCHANGED` per the epsilon
  thresholds above, or `NOT_COMPARABLE` when either side is `NOT_APPLICABLE` or
  absent (which also raises a `MISSING_METRIC` comparability flag for that run).
- The baseline run row reports `delta = 0.0` and `delta_status = UNCHANGED`
  against itself.

### Baseline selection

- `baseline_run_id` is explicit in the request.
- If omitted, the baseline is `run_ids[0]` (the first run in the request set
  after de-duplication and eligibility filtering).
- If the requested `baseline_run_id` is itself ineligible/excluded, the
  comparison fails with `400 BENCHMARK_BASELINE_INELIGIBLE`.

### Run eligibility

A run is included in a comparison set when:

- `status` is a terminal successful run (`SUCCEEDED` or `SUCCESS`); and
- `run.project_id` equals the request `project_id`.

Ineligible runs are not silently dropped: each appears in `excluded_runs[]`
with a `RunExclusionReason`. A comparison requires at least **2 eligible**
runs after filtering; otherwise it fails with
`400 BENCHMARK_INSUFFICIENT_RUNS`.

### Comparability flags

- Computed per compared run relative to the baseline, and aggregated into
  `comparability_summary.flags[]` for the whole set.
- `SAME_DATASET` when both `dataset_id` and `dataset_version_id` match the
  baseline; `DIFFERENT_DATASET_VERSION` / `DIFFERENT_DATASET` /
  `DIFFERENT_ONTOLOGY_VERSION` per the brief; `MISSING_METRIC` when any metric
  delta is `NOT_COMPARABLE`.
- Cross-dataset / cross-ontology comparisons are **flagged, never blocked**.
- **Flag granularity (FE6-022 gap 7).** Comparability flags are exposed at three
  levels: per run (`runs[].comparability_flags[]`), per set
  (`comparability_summary.flags[]`), and per metric row
  (`metric_rows[].row_comparability_flags[]`). `MISSING_METRIC` is the
  metric-row-level signal; `SAME_DATASET` / `DIFFERENT_DATASET*` /
  `DIFFERENT_ONTOLOGY_VERSION` are per-run/per-set.

### Confusion matrix cell definition

- Cells are counts derived **only** from existing `EvaluationErrorCase` rows
  plus matched (true-positive) pairs implied by a run's stored metrics/error
  set. No new error model is introduced.
- `ENTITY_CLASS` axis:
  - `WRONG_ENTITY_CLASS` -> cell (gold_class, candidate_class)
  - `MISSING_ENTITY` -> cell (gold_class, `__NONE__`)  (false negative)
  - `EXTRA_ENTITY` -> cell (`__NONE__`, candidate_class)  (false positive)
  - correct matches -> diagonal cell (class, class)
- `RELATION_TYPE` axis:
  - `WRONG_RELATION_TYPE` / `WRONG_RELATION_DIRECTION` -> cell
    (gold_relation_type, candidate_relation_type)
  - `MISSING_RELATION` -> cell (gold_relation_type, `__NONE__`)
  - `EXTRA_RELATION` -> cell (`__NONE__`, candidate_relation_type)
  - matched relations -> diagonal cell (relation_type, relation_type)
- `__NONE__` is a reserved **display sentinel** axis label for absent gold
  (false positive column source) or absent candidate (false negative). It is
  not a stored ontology id and must never be persisted as one.
- **Label semantics (FE6-022 gap 6).** `labels[]`, `cells[].gold_label`, and
  `cells[].candidate_label` carry the **ontology id** of the class/relation
  bucket (e.g. `ontology_class_id` / `ontology_relation_id` echoed verbatim from
  `EvaluationCandidateRef` / `EvaluationDimensions`), plus the literal
  `__NONE__` sentinel; the matrix never invents a display string. Human-readable
  names are supplied separately by an optional `label_display_names` map on the
  `ConfusionMatrix` response (`{ ontology_id: display_name }`), so the UI can
  render names without the contract conflating id and display name. `__NONE__`
  is never a key in that map and is rendered by the UI as an explicit
  "(no match)" label.
- Each cell exposes `count` and a `contributing_error_case_ref`
  (`error_case_count` plus a `cell_id` the drill endpoint resolves to the
  contributing `EvaluationErrorCase` rows). Diagonal/true-positive cells may
  have `error_case_count = 0` because correct matches produce no error case.
- Empty-bucket / zero-denominator rule mirrors MVP6.1: an empty bucket reports
  `count = 0` and any derived rate as `NOT_APPLICABLE`, never a fabricated
  0%/100%.
- `cell_id` is a deterministic, opaque, URL-safe identifier of the cell within
  the matrix (encodes axis + gold_label + candidate_label). The drill endpoint
  resolves it back to error cases without exposing raw ontology ids in the URL.
- A confusion matrix is computed **per run** (one matrix per compared run);
  `axis` selects entity-class vs relation-type.

## Additive Endpoint Families

All additive, read-only, project-scoped, and additive to MVP1–MVP6.2 paths.

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-023 | `POST` | `/api/v1/projects/{project_id}/benchmark-comparisons` | Build (compose) a comparison view from selected run ids; read-aggregation only |
| BE6-023 | `GET` | `/api/v1/projects/{project_id}/benchmark-comparisons` | List comparison views previously composed in the project |
| BE6-023 | `GET` | `/api/v1/benchmark-comparisons/{comparison_id}` | Retrieve a single comparison view (metric rows + deltas) |
| BE6-023 | `GET` | `/api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix` | Confusion matrix for one compared run + axis |
| BE6-023 | `GET` | `/api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix/cells/{cell_id}/error-cases` | Drill a confusion cell to its contributing `EvaluationErrorCase` rows |

### Query parameters

| Query | Type | Applies to | Notes |
|---|---|---|---|
| `limit` | integer | comparison list, error-case drill | Default `50`, max `100` |
| `cursor` | string | comparison list, error-case drill | Opaque pagination cursor |
| `group_by` | `BenchmarkComparisonGroupBy` | comparison list | Optional filter on previously built comparisons |
| `run_id` | string | confusion-matrix GET | **Required**; which compared run the matrix is computed for |
| `axis` | `ConfusionMatrixAxis` | confusion-matrix GET | **Required**; `ENTITY_CLASS` or `RELATION_TYPE` |

## DTO Contract

### BenchmarkComparisonCreateRequest (request)

```json
{
  "run_ids": ["eval-run-20260620-001", "eval-run-20260620-002"],
  "group_by": "MODEL",
  "baseline_run_id": "eval-run-20260620-001",
  "metric_names": [
    "ENTITY_F1",
    "RELATION_F1",
    "RELATION_DIRECTION_ACCURACY",
    "EVIDENCE_MATCH_RATE"
  ]
}
```

Rules / required fields:

```text
run_ids        (required; >= 2 ids; de-duplicated; >= 2 must be eligible)
group_by       (required; BenchmarkComparisonGroupBy)
baseline_run_id (optional; default = first eligible run in run_ids)
metric_names   (optional; default = full EvaluationMetricName set; subset must be valid EvaluationMetricName values)
```

### BenchmarkComparison (response)

```json
{
  "id": "benchmark-comparison-20260626-001",
  "project_id": "project-insurance-demo",
  "group_by": "MODEL",
  "baseline_run_id": "eval-run-20260620-001",
  "metric_names": [
    "ENTITY_PRECISION", "ENTITY_RECALL", "ENTITY_F1",
    "RELATION_PRECISION", "RELATION_RECALL", "RELATION_F1",
    "RELATION_DIRECTION_ACCURACY", "EVIDENCE_MATCH_RATE"
  ],
  "delta_epsilon": 0.0001,
  "runs": [
    {
      "run_id": "eval-run-20260620-001",
      "label": "deterministic-mock (baseline)",
      "group_value": "deterministic-mock / mock",
      "is_baseline": true,
      "run_context": {
        "model_name": "deterministic-mock",
        "model_provider": "mock",
        "prompt_version_id": "prompt-v12",
        "ontology_version_id": "ontology-v7",
        "parser_version": "parser-v3",
        "dataset_id": "dataset-insurance-gold",
        "dataset_version_id": "dataset-insurance-gold-v2",
        "model_run_id": "model-run-982",
        "status": "SUCCEEDED",
        "started_at": "2026-06-20T09:00:00Z",
        "completed_at": "2026-06-20T09:01:30Z"
      },
      "comparability_flags": ["SAME_DATASET"]
    },
    {
      "run_id": "eval-run-20260620-002",
      "label": "gpt-mock-b",
      "group_value": "gpt-mock-b / mock",
      "is_baseline": false,
      "run_context": {
        "model_name": "gpt-mock-b",
        "model_provider": "mock",
        "prompt_version_id": "prompt-v12",
        "ontology_version_id": "ontology-v7",
        "parser_version": "parser-v3",
        "dataset_id": "dataset-insurance-gold",
        "dataset_version_id": "dataset-insurance-gold-v2",
        "model_run_id": "model-run-983",
        "status": "SUCCEEDED",
        "started_at": "2026-06-20T09:05:00Z",
        "completed_at": "2026-06-20T09:06:20Z"
      },
      "comparability_flags": ["SAME_DATASET"]
    }
  ],
  "metric_rows": [
    {
      "metric_name": "ENTITY_F1",
      "baseline_value": 0.82,
      "baseline_metric_status": "MEASURED",
      "row_comparability_flags": [],
      "per_run": [
        {
          "run_id": "eval-run-20260620-001",
          "value": 0.82,
          "metric_status": "MEASURED",
          "delta": 0.0,
          "delta_status": "UNCHANGED"
        },
        {
          "run_id": "eval-run-20260620-002",
          "value": 0.88,
          "metric_status": "MEASURED",
          "delta": 0.06,
          "delta_status": "IMPROVED"
        }
      ]
    },
    {
      "metric_name": "RELATION_DIRECTION_ACCURACY",
      "baseline_value": null,
      "baseline_metric_status": "NOT_APPLICABLE",
      "row_comparability_flags": ["MISSING_METRIC"],
      "per_run": [
        {
          "run_id": "eval-run-20260620-001",
          "value": null,
          "metric_status": "NOT_APPLICABLE",
          "delta": null,
          "delta_status": "NOT_COMPARABLE"
        },
        {
          "run_id": "eval-run-20260620-002",
          "value": 0.91,
          "metric_status": "MEASURED",
          "delta": null,
          "delta_status": "NOT_COMPARABLE"
        }
      ]
    }
  ],
  "excluded_runs": [
    {
      "run_id": "eval-run-20260620-003",
      "exclusion_reason": "NOT_TERMINAL_SUCCESS",
      "detail": "status is FAILED"
    }
  ],
  "comparability_summary": {
    "flags": ["SAME_DATASET", "MISSING_METRIC"],
    "notes": [
      "All compared runs share dataset and dataset version.",
      "RELATION_DIRECTION_ACCURACY is not comparable because the baseline run did not measure it."
    ]
  },
  "generated_at": "2026-06-26T09:00:00Z",
  "mutation_guard": {
    "candidate_graph_mutated": false,
    "published_graph_mutated": false,
    "evaluation_run_started": false,
    "gold_set_mutated": false
  },
  "capabilities": {
    "can_view": true,
    "can_create_comparison": true,
    "can_drill_error_cases": true
  },
  "safety_note": "Read-only aggregation over existing evaluation runs, metrics, and error cases. No run executed, no gold set authored, no graph mutated."
}
```

Required fields:

```text
id
project_id
group_by
baseline_run_id
metric_names
delta_epsilon
runs
metric_rows
excluded_runs
comparability_summary
generated_at
mutation_guard
```

Sub-shapes:

- `BenchmarkComparisonRun`: `run_id`, `label`, `group_value`, `is_baseline`,
  `run_context`, `comparability_flags[]` (required: `run_id`, `label`,
  `group_value`, `is_baseline`, `run_context`, `comparability_flags`).
- `BenchmarkRunContext`: echoed run context (`model_name`, `model_provider`,
  `prompt_version_id`, `ontology_version_id`, `parser_version`, `dataset_id`,
  `dataset_version_id`, `model_run_id`, `status`, `started_at`,
  `completed_at`). All nullable except `status`, mirroring `EvaluationRun`.
- `BenchmarkMetricRow`: `metric_name` (`EvaluationMetricName`),
  `baseline_value` (nullable), `baseline_metric_status`
  (`EvaluationMetricStatus`), `row_comparability_flags[]`
  (`ComparisonComparabilityFlag`; metric-row-level granularity for gap 7 —
  carries `MISSING_METRIC` when this metric is `NOT_APPLICABLE`/absent in the
  baseline or any compared run, so the UI can flag a single row without
  scanning per-run deltas), `per_run[]` (required: `metric_name`,
  `baseline_metric_status`, `row_comparability_flags`, `per_run`).
- `BenchmarkMetricCell`: `run_id`, `value` (nullable),
  `metric_status` (`EvaluationMetricStatus`), `delta` (nullable),
  `delta_status` (`MetricDeltaStatus`) (required: `run_id`, `metric_status`,
  `delta_status`).
- `BenchmarkExcludedRun`: `run_id`, `exclusion_reason` (`RunExclusionReason`),
  `detail` (optional).
- `ComparabilitySummary`: `flags[]` (`ComparisonComparabilityFlag`), `notes[]`.
- `BenchmarkMutationGuard`: all-false analysis guard
  (`candidate_graph_mutated`, `published_graph_mutated`,
  `evaluation_run_started`, `gold_set_mutated`).
- `BenchmarkComparisonCapabilities` (optional, FE6-022 gap 10): a read-only
  permission/capability hint so the UI can disable actions it lacks permission
  for instead of guessing (`can_view`, `can_create_comparison`,
  `can_drill_error_cases`, all boolean). It is a display hint only;
  authorization is still enforced server-side (`403 PERMISSION_DENIED`). It
  never widens the read-only boundary and grants no mutation capability.

### BenchmarkComparisonListResponse

```json
{
  "items": [
    {
      "id": "benchmark-comparison-20260626-001",
      "project_id": "project-insurance-demo",
      "group_by": "MODEL",
      "baseline_run_id": "eval-run-20260620-001",
      "run_count": 2,
      "comparability_flags": ["SAME_DATASET", "MISSING_METRIC"],
      "generated_at": "2026-06-26T09:00:00Z"
    }
  ],
  "next_cursor": null
}
```

`BenchmarkComparisonSummary` items are a lightweight projection (no metric
rows). Required: `id`, `project_id`, `group_by`, `baseline_run_id`,
`run_count`, `comparability_flags`, `generated_at`.

### ConfusionMatrix (response)

```json
{
  "comparison_id": "benchmark-comparison-20260626-001",
  "run_id": "eval-run-20260620-002",
  "axis": "RELATION_TYPE",
  "labels": ["rel-includes", "rel-covers", "rel-excludes", "__NONE__"],
  "label_display_names": {
    "rel-includes": "includes",
    "rel-covers": "covers",
    "rel-excludes": "excludes"
  },
  "cells": [
    {
      "id": "cm_rel_includes__includes",
      "gold_label": "rel-includes",
      "candidate_label": "rel-includes",
      "is_diagonal": true,
      "count": 14,
      "contributing_error_case_ref": {
        "cell_id": "cm_rel_includes__includes",
        "error_case_count": 0
      }
    },
    {
      "id": "cm_rel_includes__covers",
      "gold_label": "rel-includes",
      "candidate_label": "rel-covers",
      "is_diagonal": false,
      "count": 3,
      "contributing_error_case_ref": {
        "cell_id": "cm_rel_includes__covers",
        "error_case_count": 3
      }
    },
    {
      "id": "cm_rel_includes__NONE",
      "gold_label": "rel-includes",
      "candidate_label": "__NONE__",
      "is_diagonal": false,
      "count": 2,
      "contributing_error_case_ref": {
        "cell_id": "cm_rel_includes__NONE",
        "error_case_count": 2
      }
    }
  ],
  "totals": {
    "row_totals": [
      { "label": "rel-includes", "count": 19 },
      { "label": "rel-covers", "count": 7 }
    ],
    "col_totals": [
      { "label": "rel-includes", "count": 14 },
      { "label": "rel-covers", "count": 9 }
    ],
    "diagonal_count": 21,
    "off_diagonal_count": 7,
    "accuracy": 0.75,
    "accuracy_status": "MEASURED"
  },
  "generated_at": "2026-06-26T09:00:30Z",
  "mutation_guard": {
    "candidate_graph_mutated": false,
    "published_graph_mutated": false,
    "evaluation_run_started": false,
    "gold_set_mutated": false
  }
}
```

Required fields:

```text
comparison_id
run_id
axis
labels
cells
totals
generated_at
mutation_guard
```

Sub-shapes:

- `ConfusionMatrixCell`: `id`, `gold_label`, `candidate_label`, `is_diagonal`,
  `count`, `contributing_error_case_ref` (required: `id`, `gold_label`,
  `candidate_label`, `is_diagonal`, `count`, `contributing_error_case_ref`).
- `ConfusionCellErrorCaseRef`: `cell_id`, `error_case_count` (the drill
  pointer). Diagonal/true-positive cells report `error_case_count = 0`.
- `ConfusionMatrixTotals`: `row_totals[]`, `col_totals[]`, `diagonal_count`,
  `off_diagonal_count`, `accuracy` (nullable), `accuracy_status`
  (`EvaluationMetricStatus`; `NOT_APPLICABLE` for an empty matrix). `accuracy`
  is `diagonal_count / (diagonal_count + off_diagonal_count)`; when the
  denominator is 0 the matrix is empty -> `accuracy = null`,
  `accuracy_status = NOT_APPLICABLE`.
- `ConfusionMatrixLabelCount`: `label`, `count`.
- `label_display_names` (optional): `{ ontology_id: display_name }` map so the
  UI can render human names without the contract conflating ontology id and
  display name. `labels[]` / `gold_label` / `candidate_label` are ontology ids
  (plus `__NONE__`); `__NONE__` is never a key here.
- `__NONE__` appears as a label only when an absent gold/candidate bucket has a
  nonzero count.

### ConfusionCellErrorCasesResponse (drill)

```json
{
  "comparison_id": "benchmark-comparison-20260626-001",
  "run_id": "eval-run-20260620-002",
  "axis": "RELATION_TYPE",
  "cell_id": "cm_rel_includes__covers",
  "gold_label": "rel-includes",
  "candidate_label": "rel-covers",
  "error_cases": [
    { "...": "existing EvaluationErrorCase shape, reused verbatim via $ref" }
  ],
  "next_cursor": null
}
```

`error_cases[]` items are the existing `EvaluationErrorCase` shape, referenced
by `$ref` to the MVP6.1 schema (this draft does not redefine the error model).
Required: `comparison_id`, `run_id`, `axis`, `cell_id`, `gold_label`,
`candidate_label`, `error_cases`.

## Endpoint Details

### POST `/api/v1/projects/{project_id}/benchmark-comparisons`

Builds (composes) a `BenchmarkComparison` from selected run ids. Returns `201`.

P0 behavior:

- read-aggregation only; reads existing runs/metrics/error cases;
- de-duplicates `run_ids`, filters to terminal-success runs in the same
  project, requires >= 2 eligible runs;
- resolves baseline (explicit or first eligible), computes metric rows/deltas
  and comparability flags;
- exposes an all-false `mutation_guard`;
- does **not** execute a run, call an LLM, or mutate any graph/gold/policy data;
- whether the composed object is persisted is a Backend choice; if persisted it
  is an analysis artifact only.

Errors: `400 BENCHMARK_INSUFFICIENT_RUNS`, `400 BENCHMARK_BASELINE_INELIGIBLE`,
`400 BENCHMARK_METRIC_NAME_INVALID`, `403`, `404 PROJECT_NOT_FOUND`.

### GET `/api/v1/projects/{project_id}/benchmark-comparisons`

Lists previously composed comparisons (lightweight summaries). Supports
`group_by`, `limit`, `cursor`. Returns empty `items[]` when none exist.

### GET `/api/v1/benchmark-comparisons/{comparison_id}`

Returns the full `BenchmarkComparison`. `404 BENCHMARK_COMPARISON_NOT_FOUND`
when absent.

### GET `/api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix`

Returns a `ConfusionMatrix` for one compared run + axis. Requires `run_id` and
`axis` query params. `run_id` must be a compared run in the comparison.

Errors: `400 CONFUSION_AXIS_REQUIRED` / `400 CONFUSION_RUN_REQUIRED` when query
params are missing, `404 BENCHMARK_COMPARISON_NOT_FOUND`,
`404 BENCHMARK_RUN_NOT_IN_COMPARISON`.

### GET `/api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix/cells/{cell_id}/error-cases`

Drills a confusion cell to its contributing existing `EvaluationErrorCase`
rows. Supports `limit`, `cursor`. Diagonal cells return an empty
`error_cases[]`.

Errors: `404 BENCHMARK_COMPARISON_NOT_FOUND`,
`404 CONFUSION_CELL_NOT_FOUND`.

## Error Contract

`ApiError`

```json
{
  "code": "BENCHMARK_INSUFFICIENT_RUNS",
  "message": "At least two eligible terminal-success runs are required for a comparison.",
  "details": {
    "project_id": "project-insurance-demo",
    "eligible_run_count": 1
  }
}
```

Recommended error codes:

```text
PROJECT_NOT_FOUND
BENCHMARK_INSUFFICIENT_RUNS
BENCHMARK_BASELINE_INELIGIBLE
BENCHMARK_METRIC_NAME_INVALID
BENCHMARK_COMPARISON_NOT_FOUND
BENCHMARK_RUN_NOT_IN_COMPARISON
CONFUSION_AXIS_REQUIRED
CONFUSION_RUN_REQUIRED
CONFUSION_CELL_NOT_FOUND
PERMISSION_DENIED
```

## Safety Boundary

- Read-only analysis only. Reads existing evaluation runs, metrics, and error
  cases; produces comparison and confusion-matrix views.
- Does not execute new evaluation runs, call any LLM/provider, author or edit
  gold sets, revise datasets, or write to candidate review, publish, or
  published-graph paths.
- Candidate graph and published graph separation is untouched.
- Evidence / ontology version / prompt version / model run / parser version
  traceability is preserved (echoed run context + linked existing error cases
  with evidence; never stripped or invented).
- If a comparison object is persisted, it is an analysis artifact with an
  all-false `mutation_guard`, mirroring the MVP6.2 audit-only pattern.
- No autonomous publish, no automatic policy enforcement, no real LLM execution.

## Open Questions for Frontend / QA

1. **Per-run matrix retrieval shape.** The confusion matrix is computed per run
   via `run_id` + `axis` query params on a single endpoint. Does Frontend
   prefer one matrix per request (current draft) or a batched
   "all-runs-one-axis" response? Current draft keeps it one-per-request for a
   tighter payload and simpler caching.
2. **Cell drill payload size.** Should the cell drill default `limit` (50) be
   lower for the matrix overlay, and should diagonal/true-positive cells be
   non-clickable in the UI (they always return empty `error_cases[]`)?
3. **`__NONE__` rendering.** Confirm Frontend renders `__NONE__` as an explicit
   "(no match)" row/column label, not a blank, so false positives/negatives are
   legible.
4. **Comparability flag surfacing.** Confirm `NOT_COMPARABLE` cells and
   `MISSING_METRIC` / `DIFFERENT_DATASET*` flags are shown as first-class warning
   states (not silently blank), per ADR 0009.
5. **Persistence vs on-the-fly.** Backend will decide persistence in Wave34.
   QA: should the acceptance checklist assert list/GET-by-id round-trip
   (implies persistence) or accept compute-on-the-fly with deterministic ids?
   The list endpoint contract assumes composed comparisons are retrievable.
6. **Group label format.** `group_value` for `MODEL` is `"model_name /
   model_provider"`. Confirm this label format is acceptable for the comparison
   table header, or whether Frontend wants the structured fields instead of a
   joined string.
7. **Empty-bucket axis.** When an axis has no buckets at all (e.g. a run with no
   relations), the matrix returns `labels: ["__NONE__"]` or `labels: []` with
   `accuracy_status = NOT_APPLICABLE`. Confirm the empty-matrix UX state.

## Planning-Only OpenAPI Artifact

`docs/api/openapi-mvp6-3-draft.json` is a standalone planning artifact for this
MVP6.3 surface. It intentionally contains only the additive MVP6.3 paths and
schemas needed for contract review, rather than replacing
`docs/api/openapi-mvp6-draft.json` or the other per-MVP drafts.

Expected parse metadata:

```text
openapi: 3.1.0
info.version: 0.6.3-draft
paths: 4 path objects (5 operations: 2 on the project-scoped collection path
  + 3 single-comparison paths)
schemas: 30
```

## Out of Scope for MVP6.3 P0

- Runtime API implementation, DB models, Alembic migrations, seed data,
  deterministic runtime stores, tests.
- Executing new evaluation runs from the comparison UI (runs must already
  exist).
- Real LLM / real provider benchmark execution.
- Ontology constraint pass-rate metric and any new `EvaluationMetricName`.
- Statistical significance testing, trend charts over time, scheduled benchmark
  regression alerts.
- Export of comparison results to fine-tuning / training datasets.
- Cross-project or cross-organization benchmark comparison.
- MVP6.2 learning-signal, MVP3 review/correction, and MVP4 quality joins.
- Gold Set authoring policy, dataset revisioning write workflow
  (`PM6-005`/`BE6-006`).
- Ontology governance, impact simulation, copilot/agent runtime,
  connector/plugin SDK, multi-tenant runtime, ontology packs, advanced
  visualization/storytelling.
