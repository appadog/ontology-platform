# Next Orders - Wave 34

Status: `MVP6.3 BENCHMARK COMPARISON THIN IMPLEMENTATION`
Date: 2026-06-26

Wave33 closed MVP6.3 Benchmark Comparison contract-first planning as PASS. Wave34
implements the smallest deterministic runtime/UI slice of the frozen P0 loop.

```text
select project
-> open Benchmark Comparison
-> select 2+ terminal-success evaluation runs
-> side-by-side metric comparison with deltas
-> per-class / per-relation-type confusion matrix
-> drill a cell to contributing error cases
```

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read Wave33 planning artifacts:
  - `docs/handoffs/wave-033/PM_REPORT.md`, `BACKEND_REPORT.md`, `FRONTEND_REPORT.md`, `QA_REPORT.md`
  - `docs/pm/MVP6_3_BENCHMARK_COMPARISON_BRIEF.md`
  - `docs/adr/0009-mvp6-3-benchmark-comparison-read-only-boundary.md`
  - `docs/api/MVP6_3_BENCHMARK_COMPARISON_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp6-3-draft.json`
  - `docs/pm/MVP6_3_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/backlog/INT6_3_BENCHMARK_COMPARISON_ACCEPTANCE.md` (C1-C12 planning gates, R1-R10 runtime gates)
- Build on the closed MVP6.1 evaluation module/UI — reuse its shapes by `$ref`/type reuse; do NOT rename existing MVP6.1 fields/enums.
- Use `docs/handoffs/REPORT_TEMPLATE.md`.
- Finish by writing your role report in `docs/handoffs/wave-034/{ROLE}_REPORT.md`.

## Scope Guard

- MVP6.3 thin implementation only. Implement exactly the four frozen endpoint
  families:
  - `GET  /api/v1/projects/{project_id}/benchmark-comparisons`
  - `POST /api/v1/projects/{project_id}/benchmark-comparisons`
  - `GET  /api/v1/benchmark-comparisons/{comparison_id}`
  - `GET  /api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix`
  - `GET  /api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix/cells/{cell_id}/error-cases`
- Read-only aggregation over existing MVP6.1 evaluation artifacts. NO mutation of
  candidates, candidate review, prompts, extraction, evaluation runs, publish
  jobs, published graph, or policy. If a comparison object is persisted it must
  carry an all-false `BenchmarkMutationGuard`.
- Reuse the frozen MVP6.1 metric names (`EvaluationMetricName` x8) and error
  types verbatim. Use only the Wave33-frozen new enums.
- Deterministic local/process-local or computed data is acceptable for the first
  slice (follow the MVP6.1 evaluation store pattern). No real LLM calls.
- Do NOT add benchmark P1+ scope (gold set authoring/versioning, real provider
  execution, governance, agents, connectors, tenants, packs, advanced viz).

## Execution Sequence

1. PM confirms Wave34 scope guard and FREEZES the persist-vs-compute decision
   (acceptance gate C12), or delegates it to Backend with a recorded rationale.
2. Backend implements the deterministic MVP6.3 endpoints, comparison +
   confusion-matrix + cell error-case drilldown, all-false mutation guard,
   focused tests, and OpenAPI export/alignment.
3. Frontend implements the project-scoped Benchmark Comparison UI, types/client/
   mocks, and mock + (if backend runnable) actual smoke.
4. QA validates against `INT6_3` runtime gates R1-R10, the no-mutation guard, and
   MVP1-MVP6.2 regression; recommends closeout or targeted Wave35 hardening.

## PM Agent Order

Role: PM / MVP6.3 Implementation Scope Guard
Write report: `docs/handoffs/wave-034/PM_REPORT.md`
Backlog ID: `PM6-018` Wave34 implementation scope guard + persist-vs-compute freeze

Tasks:
- Confirm no new product scope beyond the frozen P0 flow and the four endpoint
  families.
- Freeze the persist-vs-compute decision for comparison objects (C12): either
  (a) persist a deterministic process-local comparison record keyed by
  `comparison_id`, or (b) compute-on-read with a stable derived id. Record the
  choice + rationale; ensure list/GET-by-id round-trip is satisfiable.
- Restate the acceptance gates: all-false `BenchmarkMutationGuard`; no MVP6.1
  field/enum renames; comparability flags surfaced honestly; NOT_APPLICABLE /
  `__NONE__` semantics preserved.
- Update `docs/backlog/MVP6_DRAFT_BACKLOG.md` only if implementation backlog IDs
  need clarification.

Validation: `git diff --check`.

## Backend Agent Order

Role: Backend / MVP6.3 Runtime Thin Slice
Start condition: read `docs/handoffs/wave-034/PM_REPORT.md`.
Write report: `docs/handoffs/wave-034/BACKEND_REPORT.md`
Backlog IDs: `BE6-024` comparison + delta endpoints, `BE6-025` confusion matrix +
cell error-case drilldown, `BE6-026` OpenAPI export/runtime alignment,
`BE6-027` no-mutation regression guard

Tasks:
- Implement the four frozen endpoint families matching
  `docs/api/openapi-mvp6-3-draft.json` field/enum names exactly.
- Aggregate over existing MVP6.1 evaluation runs/metrics/error-cases; reuse
  their schemas by reference (no renames). Compute per-metric signed deltas with
  the frozen `MetricDeltaStatus` (IMPROVED/REGRESSED/UNCHANGED/NOT_COMPARABLE,
  fixed epsilon), comparability flags (3-level: per-run/per-set/per-metric-row),
  confusion matrix by `ENTITY_CLASS`/`RELATION_TYPE` with `NOT_APPLICABLE` empty
  buckets and `__NONE__` false-pos/neg sentinel, and cell -> contributing
  `EvaluationErrorCase` drilldown with pagination.
- Implement the persist-or-compute approach PM froze; ensure list/GET-by-id work.
- Decision/response objects expose an all-false `BenchmarkMutationGuard`
  (prompt/candidate/published/policy + extraction/evaluation as applicable).
- Require >=2 terminal-success runs; surface `RunExclusionReason` / `excluded_runs[]`
  rather than crashing on a missing/ineligible run.
- Add focused backend tests (endpoints, delta math + epsilon boundary,
  comparability flags, confusion matrix sparse/empty + `__NONE__`, cell
  drilldown, eligibility/exclusion, no-mutation guard). Export/align OpenAPI.

Validation:
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_3_benchmark_api.py -q`
  (or the focused file you create) and `tests/test_mvp6_evaluation_api.py -q`.
- `cd apps/backend && .venv/bin/ruff check app tests scripts`.
- OpenAPI export/parse/compare for the MVP6.3 paths.
- `git diff --check`.

## Frontend Agent Order

Role: Frontend / MVP6.3 Benchmark Comparison Thin UI
Start condition: read `docs/handoffs/wave-034/PM_REPORT.md`; coordinate with the
Backend report/implementation if contracts shift.
Write report: `docs/handoffs/wave-034/FRONTEND_REPORT.md`
Backlog IDs: `FE6-023` route/IA, `FE6-024` types/client/mocks, `FE6-025`
comparison + confusion-matrix UI, `FE6-026` mock + actual smoke

Tasks:
- Add a project-scoped Benchmark Comparison area contextual to the existing
  MVP6.1 Evaluation/Benchmark surface; no ID-bound pages in the global LNB.
- Implement the flow: run selection (>=2 terminal-success) + group-by + baseline
  -> side-by-side metric table with signed deltas + delta-status badges ->
  comparability warning band -> confusion matrix with ENTITY_CLASS/RELATION_TYPE
  toggle -> cell drilldown into contributing error cases.
- Honest states: loading/empty(no runs / <2 runs / no metrics / empty matrix /
  empty cell)/error(degrade missing run to excluded_runs, no full crash)/
  permission-limited/comparability-flagged/not-comparable/stale. Render
  `NOT_APPLICABLE` (never fake 0/100%) and `__NONE__` as a labeled sentinel.
- Types/client/query/mocks match the frozen OpenAPI exactly. No copy implies
  automated model selection, autonomous publish, or metric-triggered actions.
- Add `npm run smoke:mvp6:benchmark:mock` and, if backend runnable,
  `npm run smoke:mvp6:benchmark:actual`.

Validation:
- `cd apps/frontend && npm run test`, `npm run build`,
  `npm run smoke:mvp6:benchmark:mock`, and `:actual` if backend runnable.
- `git diff --check`.

## QA Agent Order

Role: Integration / QA
Start condition: read Wave34 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-034/QA_REPORT.md`
Backlog IDs: `INT6-022` backend runtime acceptance, `INT6-023` frontend mock/API
acceptance, `INT6-024` no-mutation guard, `INT6-025` Wave34 closeout
recommendation

Tasks:
- Update `docs/backlog/INT6_3_BENCHMARK_COMPARISON_ACCEPTANCE.md` runtime gates
  R1-R10 with verdicts.
- Validate the four endpoint families, DTO/enum alignment to OpenAPI, delta math
  + epsilon, comparability flags, confusion matrix sparse/`__NONE__`, cell
  drilldown, and run eligibility/exclusion.
- Validate the frontend mock + actual flow run-selection -> deltas -> confusion
  matrix -> cell drilldown, including comparability/NOT_APPLICABLE states.
- Confirm read-only: all-false mutation guard and no candidate/published/prompt/
  policy/extraction/evaluation mutation; reverify no MVP6.1 field/enum renames.
- Run selected MVP6.1/earlier regression tests + smokes that BE/FE touched.
- Recommend: MVP6.3 thin slice closeout, targeted Wave35 hardening, or PM
  redesign. Include exact commands/artifacts; confirm no leftover listeners on
  8000/5173; `git diff --check`.
