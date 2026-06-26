# MVP6.3 Benchmark Comparison / Confusion Matrix — Frontend UX/API Requirements

Status: `WAVE33 CONTRACT-FIRST PLANNING`
Date: 2026-06-26
Owner: Frontend / UIUX Architecture
Backlog ID: `FE6-022`

This document defines the frontend requirements for MVP6.3 **Benchmark
Comparison / Confusion Matrix**. It is **requirements only**. No runtime route,
component, type, API client, mock fixture, seed, smoke, or test is implemented
in Wave33 (mirrors Wave14/19/23/30 planning waves).

The feature is **read-only analysis** over closed MVP6.1 evaluation artifacts.
No copy, control, or affordance may imply automated model selection, autonomous
publish, policy enforcement, new run execution, LLM calls, or that an
`IMPROVED`/`REGRESSED` metric triggers any action.

## Source Documents

- `AGENTS.md` (Frontend Rules)
- `.agents/skills/handoff-reporting/SKILL.md`
- `docs/handoffs/CURRENT_STATE.md`
- `docs/handoffs/wave-033/NEXT_ORDERS.md`
- `docs/handoffs/wave-033/PM_REPORT.md`
- `docs/pm/MVP6_3_BENCHMARK_COMPARISON_BRIEF.md` (frozen PM brief)
- `docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md` (format precedent)
- `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md` (Product Showcase style)
- `02_FRONTEND_AGENT_SKILL.md`
- Existing MVP6.1 surface: `apps/frontend/src/pages/EvaluationDatasetsPage.tsx`,
  `apps/frontend/src/shared/api/types.ts`,
  `apps/frontend/src/shared/layout/navigation.ts`
- Backend contract draft (`BE6-023`): `docs/api/MVP6_3_BENCHMARK_COMPARISON_API_CONTRACT_DRAFT.md`
  + `docs/api/openapi-mvp6-3-draft.json` — **NOT YET PRESENT** at the time of
  writing. This document is written against the PM brief and flags the Backend
  dependency. The gap analysis section lists the field/state contract the
  Backend draft must satisfy.

## Backlog Coverage

| ID | Requirement output |
|---|---|
| `FE6-022` | Benchmark Comparison route/IA placement, screen flow, required fields, loading/empty/error/permission states, comparability-warning UX, confusion-matrix sparse/`__NONE__` rendering, delta status visualization, DTO gap analysis |

## Scope Guard

MVP6.3 P0 is a read-only benchmark analysis surface:

```text
select project
-> open Benchmark Comparison
-> select 2+ existing successful evaluation runs
-> view side-by-side metric comparison with deltas vs a baseline run
-> view per-class / per-relation-type confusion matrix and bucket accuracy
-> drill a confusion cell into its contributing error cases
```

Every number is recomputed/aggregated from already-stored MVP6.1
`EvaluationRun`, `EvaluationMetric`, and `EvaluationErrorCase` artifacts. The UI
must NOT imply that the comparison:

- executes a new evaluation run or calls any LLM/provider;
- authors or edits a gold set or revises a dataset;
- selects, promotes, or deploys a "winning" model/prompt;
- approves candidates, enforces policy, or mutates published/candidate graph;
- triggers any action because a metric improved or regressed.

Out of scope for MVP6.3 P0 UI (P1/later): statistical significance testing,
trend charts over time, scheduled regression alerts, export to fine-tuning/
training datasets, cross-project comparison, and any MVP3 review / MVP4 quality /
MVP6.2 learning-signal / published-graph join.

## Information Architecture

Benchmark Comparison is a **project-scoped** workflow area contextual to the
existing Evaluation / Benchmark Studio surface. It must NOT add ID-bound pages
to the global LNB (per AGENTS.md Frontend Rules and the standing Wave8/Wave9
LNB decision).

Global LNB placement:

- Do NOT add a new flat global LNB entry for `Benchmark Comparison` in this
  slice. The current global LNB is stable top-level work areas only
  (`Dashboard`, `Projects`, `Ontology`, `Sources`, `Extraction`, `Candidates`,
  `Admin`); Evaluation itself is reached contextually from the project, so
  Benchmark Comparison follows the same pattern.
- Do NOT add `Comparison Detail`, `Confusion Matrix`, or `Error Cases` as flat
  global LNB items.

Contextual placement (project-scoped, sits beside MVP6.1 Evaluation):

- Entry point: a `Compare runs` / `Benchmark Comparison` action from the
  Evaluation Datasets page (`/projects/{projectId}/evaluation-datasets`),
  alongside the existing `Prompt performance` action link, and from the
  project Evaluation/Benchmark area header.
- Parent area route: `/projects/{projectId}/benchmark-comparisons`
- Suggested contextual routes / panels (reached via parent rows, cards,
  breadcrumbs, tabs, or a detail panel — never as global LNB items):
  - `/projects/{projectId}/benchmark-comparisons` — builder + list
  - `/projects/{projectId}/benchmark-comparisons/{comparisonId}` — comparison
    detail (metric table + comparability summary)
  - `/projects/{projectId}/benchmark-comparisons/{comparisonId}/confusion-matrix`
    — confusion matrix per compared run (axis switch ENTITY_CLASS /
    RELATION_TYPE)
  - confusion-cell drilldown is a contextual panel/route under the matrix:
    `.../confusion-matrix/cells/{cellId}/error-cases`
- If no project is selected, the entry resolves to a project picker / selected-
  project-required state. If fewer than 2 eligible runs exist, resolve to the
  empty/not-enough-runs state (see State Requirements).

Breadcrumbs (reuse the existing `Breadcrumbs` component pattern):

```text
Projects / {project name} / Evaluation / Benchmark Comparison [ / {comparison label} ]
```

Recommended page structure (Product Showcase style — cards/badges/panels first,
tables only inside drilldowns):

```text
Project context header + breadcrumbs
-> Run selector (pick 2+ eligible runs) + group-by control + baseline picker
-> Comparability warning band (if any flag is present)
-> Side-by-side metric comparison table with deltas + delta-status badges
-> Confusion matrix (axis toggle) with sparse/empty/__NONE__ handling
-> Confusion-cell drilldown panel -> contributing error cases
```

## Screen Flow and UX Surfaces

### 1. Run Selector + Comparison Builder

Purpose: pick the runs to compare and define the baseline and grouping.

Required content (maps to `BenchmarkComparison (request)` + eligible-run list):

- Eligible-run list for the project. Each run row echoes run context:
  `id`, `status`, `model_name` + `model_provider`, `prompt_version_id`,
  `ontology_version_id`, `dataset_id` + `dataset_version_id`,
  `parser_version`, `started_at` / `completed_at`.
- Multi-select of `run_ids[]` requiring **>= 2** eligible runs.
- Eligibility: only terminal-successful runs (`status` `SUCCESS` / `SUCCEEDED`)
  in the **same project** are selectable. `PENDING` / `RUNNING` / `FAILED` runs
  are shown disabled with the reason, and appear in `excluded_runs[]` with
  `exclusion_reason` after a comparison is built.
- `group_by` control bound to `BenchmarkComparisonGroupBy`:
  `MODEL` / `PROMPT_VERSION` / `ONTOLOGY_VERSION` / `DATASET_VERSION` /
  `PARSER_VERSION`. This sets each run's `label` / `group_value`.
- `baseline_run_id` picker (optional; default = `run_ids[0]`). The chosen
  baseline is visually marked as the delta reference.
- `metric_names[]` optional filter (default = full `EvaluationMetricName` set);
  reuse the existing 8-metric set and order verbatim, no new metric name.

Required interactions:

- Build/refresh comparison (`POST .../benchmark-comparisons` — a read-side
  aggregation builder, never a mutation; copy must not say "run" or "execute").
- Change baseline / group-by re-derives deltas client-visibly.
- The builder must surface comparability flags **before** the user reads the
  deltas (warning band sits above the metric table).

Copy guard: the build action label is `Build comparison` / `Compare`, never
`Run benchmark` / `Evaluate`.

### 2. Side-by-Side Metric Comparison (deltas)

Purpose: compare each metric across runs vs the baseline, with honest deltas.

Required content (maps to `BenchmarkComparison (response)`):

- `id`, `project_id`, `group_by`, `baseline_run_id`, `generated_at`.
- `runs[]`: each `run_id`, `label`, `group_value`, run-context echo,
  `comparability_flags[]`.
- `metric_rows[]`: each row is one `metric_name` with `baseline_value` and,
  per non-baseline run, `value`, `delta`, `delta_status`, `metric_status`.
- `excluded_runs[]`: `run_id` + `exclusion_reason`.
- `comparability_summary`: set-level `flags[]`.
- `mutation_guard` (all-false analysis-only guard) — used by the
  no-mutation/audit-only copy, not necessarily rendered as a control.

Delta status visualization (`delta_status`):

| Status | Visual treatment | Copy rule |
|---|---|---|
| `IMPROVED` | Positive tone (e.g. success/up arrow), signed delta `+0.0x` | Neutral analytic copy ("higher than baseline"); never "promote" / "use this model" |
| `REGRESSED` | Negative tone (e.g. danger/down arrow), signed delta `-0.0x` | "lower than baseline"; never "blocked" / "rejected" / "triggers rollback" |
| `UNCHANGED` | Neutral tone, `≈` / `0` within epsilon | "within tolerance of baseline" |
| `NOT_COMPARABLE` | Muted / hatched, NO numeric delta, explicit `Not comparable` label with reason | Must explain why (a side is `NOT_APPLICABLE` / absent / `MISSING_METRIC`); never render a fake `0` delta |

- The baseline run's own column shows `baseline` (no delta against itself).
- Value rendering reuses the MVP6.1 convention: `MEASURED` -> percentage;
  `NOT_APPLICABLE` or `value === null` -> `N/A`, never a fabricated 0%/100%.
- `metric_status` (`MEASURED` / `NOT_APPLICABLE`) is shown per cell so the user
  can distinguish "measured and equal" from "not measurable".
- Epsilon is a fixed deterministic Backend constant (PM brief: e.g. `0.0001`);
  the UI labels `UNCHANGED` as "within tolerance", never claims significance.

### 3. Comparability Warning UX

Purpose: never imply a false apples-to-apples comparison.

`ComparisonComparabilityFlag` values to render:
`SAME_DATASET`, `DIFFERENT_DATASET_VERSION`, `DIFFERENT_DATASET`,
`DIFFERENT_ONTOLOGY_VERSION`, `MISSING_METRIC`.

Required treatment:

- A persistent warning band above the metric table whenever any
  `comparability_summary.flags[]` is present (anything other than only
  `SAME_DATASET`).
- `SAME_DATASET` is an info/neutral confirmation ("fully comparable").
- `DIFFERENT_DATASET` / `DIFFERENT_DATASET_VERSION` / `DIFFERENT_ONTOLOGY_VERSION`
  render as a warning: state plainly that runs differ on dataset/dataset
  version/ontology version and that deltas may not be a like-for-like
  comparison. Show which runs differ (use `runs[].comparability_flags[]`).
- `MISSING_METRIC` forces the affected metric row's deltas to
  `NOT_COMPARABLE` (no numeric delta) and is called out inline.
- Per-run flag badges appear on each run header chip so the warning is also
  visible at the column level, not only in the summary band.
- Copy must be descriptive analysis, never prescriptive ("these runs use
  different datasets; compare with care" — never "ignore this run" or "this
  model wins").

### 4. Confusion Matrix

Purpose: per-class / per-relation-type confusion view per compared run.

Required content (maps to `ConfusionMatrix (response)`):

- `comparison_id`, `run_id` (one matrix per compared run — a run selector/tab
  switches which run's matrix is shown), `axis`, `generated_at`.
- `axis` toggle bound to `ConfusionMatrixAxis`: `ENTITY_CLASS` /
  `RELATION_TYPE`.
- `labels[]`: ontology class/relation labels plus the reserved `__NONE__`
  sentinel.
- `cells[]`: each `id`, `gold_label`, `candidate_label`, `count`, and a
  `contributing_error_case_ref` (cell-id or drill query).
- `totals`: row / col / diagonal counts, with `NOT_APPLICABLE` where empty.

Rendering rules:

- Rows = gold label, columns = candidate label; diagonal = correct matches.
- `ENTITY_CLASS` axis derives from `WRONG_ENTITY_CLASS`
  (gold_class -> candidate_class), `MISSING_ENTITY` (gold_class -> `__NONE__`),
  `EXTRA_ENTITY` (`__NONE__` -> candidate_class), plus diagonal matches.
- `RELATION_TYPE` axis derives analogously from `WRONG_RELATION_TYPE`,
  `WRONG_RELATION_DIRECTION`, `MISSING_RELATION`, `EXTRA_RELATION`, plus matches.
- `__NONE__` sentinel: render with a distinct, clearly labeled row/column
  ("(none)" + tooltip "no gold = false positive / no candidate = false
  negative"). It is a **display sentinel only** — never linkable as an ontology
  id, never shown as a real class/relation.
- Sparse / empty buckets: a cell `count` of 0 renders as a muted/blank cell, not
  emphasized. Any derived bucket rate that is empty renders `NOT_APPLICABLE`
  (`N/A`), never a fabricated 0%/100% (mirrors MVP6.1 zero-denominator rule).
- `totals` with empty buckets show `N/A`, not `0%`.
- The matrix must remain readable for many labels: wrap the grid in a
  horizontally scrollable container (existing `CompactTable` overflow pattern)
  so the page body never overflows horizontally on narrow viewports.
- Cells with `count > 0` are interactive (focusable/clickable) and indicate
  drillability; zero/empty and diagonal cells need not be drillable unless the
  Backend returns contributing refs for them.

### 5. Confusion-Cell Drilldown -> Contributing Error Cases

Purpose: from a confusion cell, see the underlying MVP6.1 error cases.

Required content (maps to
`.../confusion-matrix/cells/{cellId}/error-cases`, reusing
`EvaluationErrorCase`):

- Cell context header: `axis`, `gold_label`, `candidate_label`, `count`,
  source `run_id`.
- A list of contributing `EvaluationErrorCase` rows reusing the existing MVP6.1
  Error Case Explorer shape verbatim:
  `id`, `error_type`, `sample_id`, `comparison_summary`,
  `gold_evidence`, `candidate_evidence`, `candidate_ref`
  (`EvaluationCandidateRef`: `candidate_id`, `candidate_kind`, `sample_id`,
  `ontology_class_id` / `ontology_relation_id`, `label`, `normalized_value`,
  `source_gold_entity_id` / `target_gold_entity_id`, `evidence`).
- Evidence-first reading order (reuse Wave13 evidence-first pattern): gold vs
  candidate evidence and `comparison_summary` are primary; ids are secondary.
- A return path back to the matrix cell and the comparison detail (breadcrumb +
  back link), preserving project context.

Interaction: open as a contextual right-side panel or contextual route under
the matrix; never as a global LNB destination.

## State Requirements (first-class)

| State | Required behavior |
|---|---|
| Loading | Staged skeleton for run selector, metric table, matrix, and drilldown. Do not render `0` counts or `0%` deltas before data arrives. |
| Empty — no runs | "No evaluation runs in this project yet." Point to the MVP6.1 Evaluation Datasets flow to create a deterministic run. Do not open new runtime scope. |
| Empty — not enough runs | Fewer than 2 eligible runs selected/available: explain that **2+** successful runs are required to compare; offer to select runs. This is the default guard for the comparison builder. |
| Empty — no metrics | A built comparison whose runs have no `MEASURED` metric rows: show that nothing is measurable, not a `0%` grid. |
| Empty — empty confusion matrix | No error cases and no matched pairs for the axis: show an empty matrix with `NOT_APPLICABLE` totals and a clear "no comparison data for this axis" note. |
| Empty — empty cell drilldown | A cell with `count` 0 (or no contributing refs): "No contributing error cases for this cell." |
| Error | Preserve project + comparison context, show retry, and distinguish "a selected run/artifact is unavailable" from "server/API failure" when the Backend exposes it. A missing/410 run should degrade to `excluded_runs[]` + a per-run notice, not a full-page crash. |
| Permission-limited | Show the read surfaces the user is allowed to see; if the user lacks comparison/build permission, disable the build action and state which permission is needed. Reads stay visible where allowed. Never expose a write/enforce affordance to anyone (none exist in P0). |
| Comparability-flagged | Whenever any flag other than `SAME_DATASET` is present, the warning band and per-run badges must be shown — this state composes with the normal data state, it does not replace it. |
| Not-comparable metric | Any `metric_rows[]` entry with `delta_status` `NOT_COMPARABLE` renders muted with an explicit reason and no numeric delta. |
| Stale data | If `generated_at` is older than the underlying runs' `completed_at` (or the Backend marks staleness), mark the comparison as stale and offer rebuild, without blocking read. |

## Backend Contract Fields (Frontend-required)

Naming convention (matching MVP6.1/MVP6.2): DTO/schema names PascalCase, JSON
fields snake_case, enum literals UPPER_SNAKE_CASE. `Blocking` = needed for P0 UX
correctness and QA acceptance. `Optional` = usability, deferrable.

### Reused MVP6.1 fields (must NOT be renamed)

- `EvaluationRun`: `id`, `project_id`, `status` (`EvaluationRunStatus`:
  `PENDING`/`RUNNING`/`SUCCESS`/`SUCCEEDED`/`FAILED`), `model_name`,
  `model_provider`, `prompt_version_id`, `ontology_version_id`, `parser_version`,
  `dataset_id`, `dataset_version_id`, `started_at`, `completed_at`.
- `EvaluationMetric`: `metric_name` (`EvaluationMetricName` — the existing 8),
  `value`, `numerator`, `denominator`, `formula`, `status`
  (`EvaluationMetricStatus`: `MEASURED`/`NOT_APPLICABLE`).
- `EvaluationErrorCase`: `id`, `run_id`, `project_id`, `dataset_id`,
  `sample_id`, `error_type` (`EvaluationErrorType` — the existing 8),
  `gold_entity_id`, `gold_relation_id`, `candidate_ref`
  (`EvaluationCandidateRef`), `comparison_summary`, `gold_evidence`,
  `candidate_evidence`, `created_at`.
- `EvaluationDimensions` bucket fields used for axes/grouping: `class_type`,
  `relation_type`, `source_type`.

### New enums (Frontend needs the exact literals)

- `BenchmarkComparisonGroupBy`: `MODEL`, `PROMPT_VERSION`, `ONTOLOGY_VERSION`,
  `DATASET_VERSION`, `PARSER_VERSION`.
- `ComparisonComparabilityFlag`: `SAME_DATASET`, `DIFFERENT_DATASET_VERSION`,
  `DIFFERENT_DATASET`, `DIFFERENT_ONTOLOGY_VERSION`, `MISSING_METRIC`.
- `ConfusionMatrixAxis`: `ENTITY_CLASS`, `RELATION_TYPE`.
- Metric delta status: `IMPROVED`, `REGRESSED`, `UNCHANGED`, `NOT_COMPARABLE`
  (Frontend needs a frozen field name + enum name — see gap analysis).

### BenchmarkComparison request (Blocking)

`project_id`, `run_ids[]` (>= 2), `group_by`, `baseline_run_id` (optional,
default `run_ids[0]`), `metric_names[]` (optional, default full set).

### BenchmarkComparison response (Blocking)

`id`, `project_id`, `group_by`, `baseline_run_id`, `generated_at`,
`runs[]` (each: `run_id`, `label`, `group_value`, run-context echo,
`comparability_flags[]`), `metric_rows[]` (each: `metric_name`,
`baseline_value`, and per-run `value` / `delta` / delta-status /
`metric_status`), `excluded_runs[]` (`run_id`, `exclusion_reason`),
`comparability_summary` (`flags[]`), `mutation_guard` (all-false).

Optional: per-run created/requested-by display labels, set-level
recommendation-free summary text.

### ConfusionMatrix response (Blocking)

`comparison_id`, `run_id`, `axis`, `labels[]` (incl. `__NONE__`), `cells[]`
(each: `id`, `gold_label`, `candidate_label`, `count`,
`contributing_error_case_ref`), `totals` (row/col/diagonal, `NOT_APPLICABLE`
where empty), `generated_at`.

Optional: per-label display names distinct from ids, per-cell precomputed
rate (with `NOT_APPLICABLE`), per-row support count.

### Cell error-cases response (Blocking)

Reuse `EvaluationErrorCase[]` verbatim plus cell context echo (`axis`,
`gold_label`, `candidate_label`, `run_id`). No new error model.

## DTO / State Gap Analysis vs Backend Draft

The Backend contract draft (`docs/api/MVP6_3_BENCHMARK_COMPARISON_API_CONTRACT_DRAFT.md`)
and `docs/api/openapi-mvp6-3-draft.json` were **not present** when this document
was written. The following must be resolved by Backend (`BE6-023`) and verified
by QA (`INT6-021`):

1. **Blocking — Backend draft dependency.** Until the OpenAPI draft exists,
   every field/enum name below is provisional from the PM brief. Frontend will
   re-confirm against the exported draft before any Wave34 implementation.
2. **Delta-status enum + field name not fully frozen.** The PM brief names the
   values (`IMPROVED`/`REGRESSED`/`UNCHANGED`/`NOT_COMPARABLE`) but no enum type
   name and no per-cell field name. Backend must freeze: the enum type name
   (e.g. `MetricDeltaStatus`), the field name on each per-run metric entry
   (e.g. `delta_status`), and the signed `delta` field type/null behavior for
   `NOT_COMPARABLE` (recommend `delta: null` + `delta_status: NOT_COMPARABLE`,
   never `delta: 0`).
3. **`metric_rows[]` shape.** Brief says "per-run value/delta/delta_status/
   metric_status" but does not freeze whether per-run entries are a keyed map
   (`by_run_id`) or a parallel array aligned to `runs[]`. Frontend needs a
   stable `run_id` key on each per-run metric entry. Backend must freeze.
4. **`contributing_error_case_ref` shape.** Brief allows either an
   `error_case_id[]` list or "a count plus a drill query". Frontend needs a
   deterministic, paginatable contract: prefer the cell-id-addressed endpoint
   `.../cells/{cell_id}/error-cases` returning `EvaluationErrorCase[]`. Backend
   must confirm whether `contributing_error_case_ref` is a cell id, a query
   token, or an inline id list, and whether the cell endpoint paginates.
5. **`cells[].id` (`cell_id`) stability.** The drilldown route depends on a
   stable cell id. Backend must freeze how `cell_id` is formed (e.g.
   `{axis}:{gold_label}:{candidate_label}`) and that it is URL-safe given
   `__NONE__` and arbitrary ontology label strings.
6. **`__NONE__` field placement.** Confirm `__NONE__` appears in `labels[]` and
   as `gold_label`/`candidate_label` literal string `"__NONE__"`, so the UI can
   special-case it; confirm it is never emitted as an ontology id field.
7. **`labels[]` = id vs display name.** Confusion axis labels — confirm whether
   `labels[]` / `gold_label` / `candidate_label` carry ontology ids or
   human-readable names. The MVP6.1 page shows raw `ontology_class_id` /
   `ontology_relation_id`; if Backend only returns ids, Frontend will display
   ids (acceptable for P0) but an optional display-name map is requested.
8. **`comparability_flags[]` granularity.** Confirm flags exist both per-run
   (`runs[].comparability_flags[]`) and per-set (`comparability_summary.flags[]`)
   so the warning band and per-column badges can both render. Confirm whether
   `MISSING_METRIC` is set-level, per-run, or per-metric-row (UI needs it at the
   metric-row level to mute the right deltas).
9. **`mutation_guard` field names.** Align to the MVP6.2 all-false pattern.
   Frontend expects flags like `candidate_graph_mutated: false`,
   `published_graph_mutated: false`, `evaluation_run_started: false`,
   `gold_set_mutated: false`. Backend must freeze the exact keys.
10. **Eligibility status literals.** `EvaluationRunStatus` carries both `SUCCESS`
    and `SUCCEEDED`. The comparison eligibility predicate must treat both as
    terminal-success (the MVP6.1 page already special-cases both). Backend must
    confirm which value comparison runs actually emit, and that
    `excluded_runs[].exclusion_reason` is a human-readable string or a frozen
    enum (Frontend prefers a frozen reason enum for consistent copy).
11. **Permission/capability hint.** No permission field is specified. If RBAC
    gating exists, Backend should expose a capability hint on the comparison/
    list response so the UI can render the permission-limited state instead of
    guessing from a 403.

No DTO **rename** of existing MVP6.1 fields is requested — the comparison must
echo `EvaluationRun` / `EvaluationMetric` / `EvaluationErrorCase` field names
verbatim. Any rename by Backend would be a breaking mismatch and a blocker.

## Frontend Acceptance Notes

- Project-scoped only; no ID-bound page added to the global LNB.
- Benchmark Comparison must read as guided analysis: select runs -> compare ->
  inspect matrix -> drill error cases. Product Showcase style: cards, badges,
  panels, scrollable matrix; tables only inside the metric comparison and
  drilldown.
- Every delta, cell, and rate must be honest: `NOT_COMPARABLE` /
  `NOT_APPLICABLE` / `__NONE__` are first-class and never replaced by a
  fabricated number.
- Comparability flags must be visible before deltas are read.
- No copy or control may imply model selection, autonomous publish, policy
  enforcement, new run execution, or that a regressed/improved metric triggers
  any action. This is read-only analysis.
- All numbers trace back to existing MVP6.1 runs/metrics/error cases with their
  evidence; the comparison echoes context and never strips or invents it.
