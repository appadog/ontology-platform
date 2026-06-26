# INT6.3 MVP6.3 Benchmark Comparison / Confusion Matrix Acceptance Checklist

Status: `WAVE33 QA CONTRACT-FIRST PLANNING ACCEPTANCE`
Date: 2026-06-26
Owner: QA / Integration
Backlog: `INT6-021` (theme `PM6-017`; Backend `BE6-023`; Frontend `FE6-022`)

This checklist turns `INT6-021` into contract-first acceptance criteria for
MVP6.3 **Benchmark Comparison / Confusion Matrix** (read-only aggregation over
closed MVP6.1 evaluation artifacts). Wave33 is **planning only**. Runtime API,
FastAPI service, database model, Alembic migration, frontend route/component,
seed data, smoke script, and test implementation remain out of scope until a
Wave34 thin-implementation order is explicitly opened.

## Source Documents

- Agent rules: `AGENTS.md`
- Handoff process: `.agents/skills/handoff-reporting/SKILL.md`
- Current state: `docs/handoffs/CURRENT_STATE.md`
- Wave order: `docs/handoffs/wave-033/NEXT_ORDERS.md`
- PM report: `docs/handoffs/wave-033/PM_REPORT.md`
- Backend report: `docs/handoffs/wave-033/BACKEND_REPORT.md`
- Frontend report: `docs/handoffs/wave-033/FRONTEND_REPORT.md`
- PM brief: `docs/pm/MVP6_3_BENCHMARK_COMPARISON_BRIEF.md`
- ADR: `docs/adr/0009-mvp6-3-benchmark-comparison-read-only-boundary.md`
- API draft: `docs/api/MVP6_3_BENCHMARK_COMPARISON_API_CONTRACT_DRAFT.md`
- OpenAPI draft: `docs/api/openapi-mvp6-3-draft.json`
- Frontend requirements: `docs/pm/MVP6_3_FRONTEND_UX_REQUIREMENTS.md`
- Format precedent: `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`
- MVP6 backlog: `docs/backlog/MVP6_DRAFT_BACKLOG.md`

## MVP6.3 P0 Boundary

Frozen P0 demo flow (PM brief, ADR 0009, Backend draft, Frontend requirements
all agree):

```text
select project
-> open Benchmark Comparison
-> select 2+ existing successful evaluation runs
-> view side-by-side metric comparison with deltas vs a baseline run
-> view per-class / per-relation-type confusion matrix and bucket accuracy
-> drill a confusion cell into its contributing error cases
```

Every number is recomputed/aggregated from already-stored MVP6.1 `EvaluationRun`,
`EvaluationMetric`, and `EvaluationErrorCase` artifacts. No new run is executed,
no LLM is called, no gold set is authored, and nothing mutates candidate or
published graph state.

Approved source artifact families (read-only):

- `EvaluationRun` (run/version context echo).
- `EvaluationMetric` per `EvaluationMetricName` (the existing 8).
- `EvaluationErrorCase` typed by `EvaluationErrorType` (the existing 8), with
  `EvaluationCandidateRef` and evidence.
- `EvaluationDimensions` buckets (`class_type`, `relation_type`, `source_type`).

P0 exclusions:

- executing new evaluation runs from the comparison surface;
- real LLM / real provider benchmark execution;
- gold-set authoring policy / dataset revisioning write (`PM6-005`/`BE6-006`);
- ontology constraint pass-rate metric or any new `EvaluationMetricName`;
- statistical significance testing, trend charts over time, scheduled regression
  alerts;
- export of comparison results to fine-tuning / training datasets;
- cross-project / cross-organization comparison;
- MVP3 review/correction, MVP4 quality, MVP6.2 learning-signal, published-graph
  joins;
- candidate review / candidate graph / published graph / policy mutation;
- autonomous publish, automatic policy enforcement;
- ontology governance, impact simulation, copilot/agent runtime, connector/plugin
  SDK, multi-tenant runtime, ontology packs, advanced visualization/storytelling.

## Verdict Semantics

- `PASS`: planning artifacts agree and preserve the read-only safety boundary.
- `PARTIAL`: contract is usable for review, but named fields/enums or
  implementation-facing details need targeted hardening before runtime work.
- `FAIL`: planning opens forbidden runtime scope, removes evidence/version/
  model-run traceability, allows candidate/published graph or gold-set/policy
  mutation, or renames a reused MVP6.1 field (breaking).
- `NOT RUNNABLE`: expected for runtime checks before Wave34 because no MVP6.3
  runtime implementation exists by design.

## Current Wave33 QA Verdict

| ID | Verdict | QA note |
|---|---|---|
| `INT6-021` | `PASS` (planning) | PM brief, ADR 0009, Backend contract/OpenAPI, and Frontend requirements agree on the P0 flow, frozen enums/states, MVP6.1-only source artifacts, read-only safety boundary, and later-theme exclusions. All 10 Frontend DTO gaps are resolved by the final Backend draft (7 pre-answered + 3 amended). OpenAPI parses (3.1.0, `0.6.3-draft`, 4 path objects / 5 operations, 30 schemas); 4 benchmark path families + all new enums/schemas present. Runtime-leakage search under `apps/`/`infra/` found no MVP6.3 implementation. Runtime acceptance is `NOT RUNNABLE` by design. |

## C1 — Scope / Flow Alignment

Exit criterion: `PASS` when all checks are true.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C1.1 | P0 demo flow identical across PM brief, ADR, Backend draft, Frontend requirements | PASS | run-selection -> side-by-side deltas -> confusion matrix -> cell error-case drilldown is verbatim in all four (brief §P0 Goal, ADR Decision, contract §Contract Principles + Endpoint Details, FE §Scope Guard / Screen Flow). |
| C1.2 | Source artifacts restricted to closed MVP6.1 evaluation artifacts only | PASS | `EvaluationRun`/`EvaluationMetric`/`EvaluationErrorCase`/`EvaluationCandidateRef`/`EvaluationDimensions` reused by `$ref`; no MVP3/MVP4/MVP6.2/published-graph join in any artifact. |
| C1.3 | Exclusions (P1/later) consistent across artifacts | PASS | brief §Explicit Exclusions, contract §Out of Scope, FE §Scope Guard all list the same exclusions (new runs, LLM, gold-set/dataset write, new metric, significance/trend/alerts, training export, cross-project, Theme-3+). |
| C1.4 | Wave33 changed only documentation/planning artifacts | PASS | `git diff --check` clean; runtime-leakage search empty; role reports state no `apps/`/`infra/` change. |

## C2 — Frozen Endpoint Families (4)

Exit criterion: `PASS` when all four families are present, additive, read-only,
and project-scoped where required.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C2.1 | `POST/GET /api/v1/projects/{project_id}/benchmark-comparisons` present (builder + list) | PASS | OpenAPI path object exposes `get` + `post`. |
| C2.2 | `GET /api/v1/benchmark-comparisons/{comparison_id}` present (full comparison) | PASS | OpenAPI path object `get`. |
| C2.3 | `GET .../{comparison_id}/confusion-matrix` present (per run + axis) | PASS | OpenAPI path object `get`; `run_id` + `axis` query params required. |
| C2.4 | `GET .../confusion-matrix/cells/{cell_id}/error-cases` present (cell drilldown) | PASS | OpenAPI path object `get`; `limit`/`cursor` pagination; reuses `EvaluationErrorCase` via `$ref`. |
| C2.5 | All paths additive — no MVP1–MVP6.2 path renamed/moved/removed | PASS | standalone draft contains only the 4 benchmark path families (disjoint-additive, per-MVP draft pattern). |
| C2.6 | `POST` is a read-aggregation builder, not a data mutation | PASS | contract §Endpoint Details: composes view from existing runs; exposes all-false `mutation_guard`. |

## C3 — Frozen Enums

Exit criterion: `PASS` when each enum and its literals are present and identical
across PM brief, Backend draft, OpenAPI, and Frontend requirements.

| # | Enum | Literals | Verdict |
|---|---|---|---|
| C3.1 | `BenchmarkComparisonGroupBy` | `MODEL`, `PROMPT_VERSION`, `ONTOLOGY_VERSION`, `DATASET_VERSION`, `PARSER_VERSION` | PASS |
| C3.2 | `ComparisonComparabilityFlag` | `SAME_DATASET`, `DIFFERENT_DATASET_VERSION`, `DIFFERENT_DATASET`, `DIFFERENT_ONTOLOGY_VERSION`, `MISSING_METRIC` | PASS |
| C3.3 | `ConfusionMatrixAxis` | `ENTITY_CLASS`, `RELATION_TYPE` | PASS |
| C3.4 | `MetricDeltaStatus` (delta status) | `IMPROVED`, `REGRESSED`, `UNCHANGED`, `NOT_COMPARABLE` | PASS |
| C3.5 | `RunExclusionReason` | `NOT_TERMINAL_SUCCESS`, `DIFFERENT_PROJECT`, `RUN_NOT_FOUND`, `DUPLICATE_RUN_ID` | PASS |
| C3.6 | `NOT_APPLICABLE` semantics for empty bucket / unmeasured metric | reused `EvaluationMetricStatus` (`MEASURED`/`NOT_APPLICABLE`); empty matrix accuracy -> `NOT_APPLICABLE` | PASS |
| C3.7 | `__NONE__` sentinel for absent gold/candidate axis label | display sentinel only; never a stored ontology id; present in `ConfusionMatrix` label/cell semantics | PASS |
| C3.8 | No new `EvaluationMetricName` introduced | PASS | the 8-metric set is reused verbatim in the OpenAPI `EvaluationMetricName` enum; no rename, no addition. |

## C4 — Reused MVP6.1 Metric / Error Names (no renames)

Exit criterion: `PASS` when every reused name is verbatim and no MVP6.1 field is
renamed.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C4.1 | `EvaluationMetricName` reused verbatim (8) | PASS | `ENTITY_PRECISION/ENTITY_RECALL/ENTITY_F1/RELATION_PRECISION/RELATION_RECALL/RELATION_F1/RELATION_DIRECTION_ACCURACY/EVIDENCE_MATCH_RATE`. |
| C4.2 | `EvaluationErrorType` reused verbatim (8) | PASS | `MISSING_ENTITY/EXTRA_ENTITY/WRONG_ENTITY_CLASS/MISSING_RELATION/EXTRA_RELATION/WRONG_RELATION_TYPE/WRONG_RELATION_DIRECTION/EVIDENCE_MISMATCH`. |
| C4.3 | `EvaluationMetricStatus` reused verbatim | PASS | `MEASURED`/`NOT_APPLICABLE`. |
| C4.4 | `EvaluationRun`/`EvaluationErrorCase`/`EvaluationCandidateRef`/`EvaluationDimensions` reused by `$ref`, not redefined | PASS | contract §Reused MVP6.1 Artifacts; cell drill `error_cases[]` is `$ref` to the MVP6.1 error case shape. |
| C4.5 | No MVP6.1 field renamed (any rename = breaking FAIL) | PASS | FE §DTO Gap Analysis explicitly forbids rename; Backend confirms verbatim echo. |

## C5 — Screen Flow Coverage

Exit criterion: `PASS` when each P0 surface maps to a contract shape.

| # | Surface | Maps to | Verdict |
|---|---|---|---|
| C5.1 | Run selection + group-by + baseline picker | `BenchmarkComparisonCreateRequest` (`run_ids[]`>=2, `group_by`, optional `baseline_run_id`, optional `metric_names[]`) | PASS |
| C5.2 | Side-by-side metric deltas vs baseline | `BenchmarkComparison.metric_rows[]` -> `BenchmarkMetricRow` -> `per_run[]` `BenchmarkMetricCell` (`run_id`, `value`, `metric_status`, `delta`, `delta_status`) | PASS |
| C5.3 | Confusion matrix per run + axis | `ConfusionMatrix` (`run_id`, `axis`, `labels[]`, `cells[]`, `totals`) | PASS |
| C5.4 | Cell error-case drilldown | `ConfusionCellErrorCasesResponse` (cell context + `EvaluationErrorCase[]` via `$ref`, `next_cursor`) | PASS |
| C5.5 | First-class loading/empty/error/permission/not-comparable/stale states defined | FE §State Requirements covers loading, no-runs, not-enough-runs (<2), no-metrics, empty matrix, empty cell, error, permission-limited, comparability-flagged, not-comparable, stale | PASS |

## C6 — Delta Semantics

Exit criterion: `PASS` when delta and baseline rules are deterministic and never
fabricate a number.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C6.1 | `delta = run.value - baseline.value` when both `MEASURED` | PASS | contract §Delta definition. |
| C6.2 | Fixed deterministic epsilon, echoed for assertion | PASS | `delta_epsilon = 0.0001`, present in OpenAPI and response example. |
| C6.3 | `IMPROVED`/`REGRESSED`/`UNCHANGED` by epsilon thresholds | PASS | contract §Delta definition. |
| C6.4 | `NOT_COMPARABLE` when either side `NOT_APPLICABLE`/absent; `delta: null` not `delta: 0` | PASS | contract example shows `delta: null` + `delta_status: NOT_COMPARABLE`; FE table forbids fake `0`. |
| C6.5 | Baseline explicit; default `run_ids[0]`; ineligible baseline -> `400 BENCHMARK_BASELINE_INELIGIBLE` | PASS | contract §Baseline selection. |
| C6.6 | `>=2` eligible runs required; else `400 BENCHMARK_INSUFFICIENT_RUNS` | PASS | contract §Run eligibility. |
| C6.7 | Ineligible runs surfaced (not silently dropped) | PASS | `excluded_runs[]` with `RunExclusionReason`. |

## C7 — Comparability-Warning Correctness (never imply false apples-to-apples)

Exit criterion: `PASS` when comparability is exposed at the right granularity and
cross-dataset/ontology is flagged, never blocked or hidden.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C7.1 | Flags computed per run, per set, and per metric row | PASS | `runs[].comparability_flags[]`, `comparability_summary.flags[]`, `metric_rows[].row_comparability_flags[]` (FE gap 7 amended). |
| C7.2 | `MISSING_METRIC` is the metric-row-level signal | PASS | contract §Comparability flags; row example carries `["MISSING_METRIC"]`. |
| C7.3 | Cross-dataset / cross-ontology flagged, not blocked | PASS | contract + ADR: `DIFFERENT_DATASET*`/`DIFFERENT_ONTOLOGY_VERSION` flag and still compute. |
| C7.4 | Warning band shown before deltas; per-run badges | PASS | FE §Comparability Warning UX + State Requirements (comparability-flagged composes with data state). |
| C7.5 | No copy implies model selection/promotion/winning model | PASS | FE delta-status copy rules forbid "promote"/"use this model"/"wins". |

## C8 — Confusion Matrix Cell Correctness

Exit criterion: `PASS` when cells derive only from existing error cases + implied
matches and never fabricate rates.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C8.1 | `ENTITY_CLASS` mapping: `WRONG_ENTITY_CLASS`->(gold,cand), `MISSING_ENTITY`->(gold,`__NONE__`), `EXTRA_ENTITY`->(`__NONE__`,cand), matches->diagonal | PASS | contract §Confusion matrix cell definition. |
| C8.2 | `RELATION_TYPE` mapping analogous (`WRONG_RELATION_TYPE`/`WRONG_RELATION_DIRECTION`/`MISSING_RELATION`/`EXTRA_RELATION`/matches) | PASS | contract §Confusion matrix cell definition. |
| C8.3 | No new error model; cells reuse `EvaluationErrorCase` | PASS | contract + ADR. |
| C8.4 | `cell_id` deterministic, opaque, URL-safe; raw ontology ids not exposed in URL | PASS | contract §cell_id rule (FE gap 4). |
| C8.5 | Labels are ontology ids; display names via optional `label_display_names` map; `__NONE__` never a map key | PASS | `ConfusionMatrix.label_display_names` (FE gap 6 amended). |
| C8.6 | Empty bucket -> `count: 0`, rate `NOT_APPLICABLE`, never fabricated 0%/100% | PASS | contract §empty-bucket rule; `accuracy_status` `NOT_APPLICABLE` when denominator 0. |
| C8.7 | Diagonal/true-positive cells may have `error_case_count: 0` (correct matches yield no error case) | PASS | `ConfusionCellErrorCaseRef`. |

## C9 — Read-Only / No-Mutation Safety Boundary

Exit criterion: `PASS` when no mutation surface is opened and the persisted-case
guard is all-false.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C9.1 | If persisted, `BenchmarkMutationGuard` keys all `const: false` | PASS | `candidate_graph_mutated`/`published_graph_mutated`/`evaluation_run_started`/`gold_set_mutated` all `const: false` (OpenAPI). |
| C9.2 | No new run execution / no LLM call | PASS | contract + ADR + brief §Safety Boundary. |
| C9.3 | No candidate / published graph mutation; separation untouched | PASS | brief, contract, ADR all assert no graph read/write. |
| C9.4 | No gold-set authoring / dataset revisioning write | PASS | excluded in all artifacts; `gold_set_mutated: false`. |
| C9.5 | No autonomous publish, no automatic policy enforcement | PASS | brief/ADR/contract §Safety Boundary. |
| C9.6 | `capabilities` is a display hint only; server-side 403 still enforced; never widens read-only boundary | PASS | `BenchmarkComparisonCapabilities` (FE gap 10 amended): `can_view`/`can_create_comparison`/`can_drill_error_cases`. |

## C10 — Evidence / Version / Model-Run Traceability Preserved

Exit criterion: `PASS` when comparison echoes existing context and never strips
or invents it.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C10.1 | Run context echoed (model/provider, prompt version, ontology version, parser version, dataset/dataset version, model run id, status, timestamps) | PASS | `BenchmarkRunContext` includes `model_run_id` + all version fields. |
| C10.2 | Cell drilldown links to existing `EvaluationErrorCase` with gold/candidate evidence | PASS | `ConfusionCellErrorCasesResponse.error_cases[]` `$ref` to MVP6.1 shape (carries `gold_evidence`/`candidate_evidence`). |
| C10.3 | Comparison never strips or invents context | PASS | contract §Preserved Boundary; FE acceptance notes. |

## C11 — Frontend DTO Gap Closure (10)

Exit criterion: `PASS` when all 10 FE gaps are resolved by the final Backend
draft.

| # | FE gap | Resolution | Verdict |
|---|---|---|---|
| 1 | delta-status enum + `delta: null` on `NOT_COMPARABLE` | `MetricDeltaStatus`; `BenchmarkMetricCell.delta` nullable; example `delta: null` | PASS (pre-answered) |
| 2 | stable `run_id` key per per-run metric entry | `per_run[]` is array of `BenchmarkMetricCell`, each with required `run_id` | PASS (pre-answered) |
| 3 | `contributing_error_case_ref` shape + pagination | `ConfusionCellErrorCaseRef` (`cell_id`,`error_case_count`); drill endpoint `limit`/`cursor`/`next_cursor` | PASS (pre-answered) |
| 4 | `cell_id` formation + URL-safe | deterministic, opaque, URL-safe; raw ontology id not in URL | PASS (pre-answered) |
| 5 | `__NONE__` literal placement, not an ontology id | display sentinel only; never persisted as ontology id | PASS (pre-answered) |
| 6 | labels id vs display name + display-name map | labels = ontology id; `ConfusionMatrix.label_display_names` optional map | PASS (amended) |
| 7 | comparability flag granularity (metric-row level) | `BenchmarkMetricRow.row_comparability_flags[]`; `MISSING_METRIC` row-level | PASS (amended) |
| 8 | `mutation_guard` keys aligned to MVP6.2 all-false | `BenchmarkMutationGuard` 4 keys all `const: false` | PASS (pre-answered) |
| 9 | `SUCCESS` vs `SUCCEEDED` + `exclusion_reason` enum | both terminal-success; `RunExclusionReason` enum | PASS (pre-answered) |
| 10 | permission/capability hint | `BenchmarkComparison.capabilities` optional hint; 403 still server-enforced | PASS (amended) |

## C12 — Wave34 Deferred Assumption (Backend persist-vs-compute)

Exit criterion: `PASS` (documented) when the open decision is captured as a
Wave34 assumption, not a Wave33 blocker.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C12.1 | Persist-vs-compute decision deferred to Wave34 | PASS (noted) | Backend report §남은 TODO + contract Open Question 5. |
| C12.2 | List + GET-by-id contract assumes composed comparisons are retrievable (implies persistence or deterministic ids) | ASSUMPTION | Wave34 must freeze either durable persistence or compute-on-the-fly with deterministic ids before the list/GET-by-id round-trip runtime gate (R3 below) can pass. |
| C12.3 | Either way the comparison is an analysis artifact with all-false `mutation_guard` | PASS | brief/contract/ADR. |

## Runtime Acceptance Gates (Wave34 — VERIFIED)

Verified by QA in Wave34 against a live backend (uvicorn on file-backed SQLite at
`127.0.0.1:8000`) + frontend actual-API mode (`VITE_USE_MOCK_API=false`,
`VITE_API_BASE_URL=http://127.0.0.1:8000`) on `127.0.0.1:5173`. The actual-API
smoke that was NOT RUN in the parallel Wave34 (`npm run smoke:mvp6:benchmark:actual`)
was executed and PASSED here.

| ID | Gate | Status |
|---|---|---|
| R1 | All 4 benchmark path families exist in the running app and respond per contract (build/list/get/matrix/cell-drill) | PASS — running `/api/v1/openapi.json` exposes 4 benchmark paths / 5 operations; actual smoke exercised all four families. |
| R2 | Runtime DTO field names + enums match `openapi-mvp6-3-draft.json` (0 field-name mismatch on shared schemas; new enums exact) | PASS — runtime `app.openapi()` vs draft: 0 mismatches across 30 shared schemas; 8 `EvaluationMetricName` + 8 `EvaluationErrorType` reused verbatim; 5 new MVP6.3 enums exact. |
| R3 | `POST` -> `GET list` -> `GET by id` round-trip returns the composed comparison (resolves C12 persistence assumption) | PASS — actual smoke `list-getbyid-roundtrip` check listed + fetched the same `comparison_id` (process-local persist, PM C12 option a). |
| R4 | Delta math deterministic against seeded runs; epsilon `0.0001`; `NOT_COMPARABLE` -> `delta: null` | PASS — live GET-by-id: `delta_epsilon=0.0001`, baseline cell `delta 0.0/UNCHANGED`, signed `MEASURED` deltas. NOT_COMPARABLE->`delta:null` covered by backend test + mock test (deterministic-mock runs are identical, so IMPROVED/REGRESSED exercised in tests not the seeded pair). |
| R5 | Comparability flags correct on a cross-dataset / cross-ontology seeded pair (flagged, not blocked) | PASS — live `comparability_summary.flags=[SAME_DATASET]` + per-run flags; `DIFFERENT_DATASET*`/`DIFFERENT_ONTOLOGY_VERSION`/`MISSING_METRIC` flag-not-block covered in `test_mvp6_3_benchmark_api.py`. |
| R6 | Confusion matrix cell counts reconcile to underlying `EvaluationErrorCase` rows; `__NONE__` + empty-bucket `NOT_APPLICABLE` correct | PASS — actual matrix: axis `ENTITY_CLASS`, 4 labels / 3 cells; drilled cell_id decodes to `["ENTITY_CLASS","__NONE__","class-extra"]` (false-positive `__NONE__`); empty-bucket `NOT_APPLICABLE` covered in tests. |
| R7 | Cell drilldown returns exactly the contributing `EvaluationErrorCase` rows (paginated); diagonal cells empty | PASS — actual `cell-drilldown` returned 1 contributing error case for the `__NONE__` cell; pagination + empty diagonal covered in backend + mock tests. |
| R8 | `mutation_guard` all-false at runtime; published/candidate/prompt/gold tables unchanged after build/list/get/drill | PASS — live `mutation_guard` all 4 keys false; SQLite row counts after full flow: candidate_entities/relations/evidence/corrections, publish_jobs, published_entities/relations/graph_versions, prompt_templates/versions, extraction_jobs, review_tasks/decisions ALL = 0. |
| R9 | Error contract: `400 BENCHMARK_INSUFFICIENT_RUNS`/`BENCHMARK_BASELINE_INELIGIBLE`/`BENCHMARK_METRIC_NAME_INVALID`, `404`s, `403` | PASS — live: dup-run -> `400 BENCHMARK_INSUFFICIENT_RUNS`; unknown id -> `404 BENCHMARK_COMPARISON_NOT_FOUND`; bad run -> `404 BENCHMARK_RUN_NOT_IN_COMPARISON`. BASELINE_INELIGIBLE/METRIC_NAME_INVALID covered in backend tests. |
| R10 | MVP1–MVP6.2 regression green; additive-only; no path renamed/removed | PASS — 56 backend tests (project/ontology + MVP3/4/5/6.1/6.2/6.3) pass; `smoke:mvp6:actual` (MVP6.1 evaluation) PASS; runtime paths additive-only (4 new benchmark paths, no rename/removal). |

## Validation Commands (Wave33 QA — executed)

```text
python3 -m json.tool docs/api/openapi-mvp6-3-draft.json > /dev/null && echo PARSE_OK
# -> PARSE_OK

python3 <path/schema/enum assertion script over openapi-mvp6-3-draft.json>
# -> openapi 3.1.0 ; info.version 0.6.3-draft ; path_objects 4 ; operations 5 ; schemas 30
# -> 4 benchmark path families: all OK
# -> enums BenchmarkComparisonGroupBy / ComparisonComparabilityFlag / ConfusionMatrixAxis /
#    MetricDeltaStatus / RunExclusionReason: all OK with exact literals
# -> 18 new schemas (incl. BenchmarkComparisonCapabilities): all OK
# -> 3 amended FE-gap fields present: label_display_names, row_comparability_flags, capabilities
# -> BenchmarkMutationGuard 4 keys all const:false
# -> EvaluationMetricName reused (8) verbatim; EvaluationErrorType (8) / EvaluationMetricStatus reused
# -> __NONE__ + delta_epsilon present in doc

rg -n 'benchmark.compar|BenchmarkComparison|confusion.matrix|ConfusionMatrix|MVP6.3|mvp6.3' apps infra --glob '!**/node_modules/**'
# -> no matches (exit 1): no MVP6.3 runtime implementation leaked

git diff --check
# -> clean (exit 0)
```

Expected runtime acceptance status before Wave34 implementation:
`NOT RUNNABLE` by design. MVP6.3 runtime gates (R1–R10) are added only after the
Wave34 thin implementation is explicitly opened.

## Wave34 Recommendation

Recommended next step: `WAVE34 MVP6.3 THIN IMPLEMENTATION`.

Why:

- PM brief, ADR 0009, Backend contract/OpenAPI, and Frontend requirements agree
  on the P0 flow, frozen enums/states, MVP6.1-only source artifacts, read-only
  safety boundary, and exclusions.
- The OpenAPI planning artifact parses and exposes all 4 frozen path families,
  all new enums with exact literals, and all 18 new schemas; nothing breaks
  MVP1–MVP6.2 paths.
- All 10 Frontend DTO gaps are resolved (7 pre-answered + 3 amended:
  `label_display_names`, `row_comparability_flags`, `capabilities`).
- No runtime implementation leaked into Wave33; the boundary is intact.
- The only open item is the Backend persist-vs-compute decision (C12), which is
  a Wave34 implementation choice, not a Wave33 blocker.

Wave34 implementation should remain thin and additive:

1. Implement only the 4 frozen endpoint families and the DTO/enum names exactly
   as drafted; reuse MVP6.1 shapes by `$ref` with no rename.
2. Freeze the persist-vs-compute decision (C12) and make the list/GET-by-id
   round-trip (R3) deterministic.
3. Expose an all-false `mutation_guard`; touch no candidate/published/prompt/
   gold/policy/evaluation-run path.
4. Add deterministic seed/mock/smoke evidence only for the approved P0 flow.
5. Do not broaden into new runs, LLM calls, gold-set/dataset writes, new
   metrics, training export, cross-project comparison, or any Theme-3+ surface.
