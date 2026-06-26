# Frontend Report - Wave 34

Role: Frontend / MVP6.3 Benchmark Comparison Thin UI
Date: 2026-06-26
Verdict: `PASS (MOCK-FIRST)` — actual smoke `NOT RUN` (backend runtime not reachable this wave)

## 담당 범위

- Backlog IDs: `FE6-023` route/IA, `FE6-024` types/client/mocks, `FE6-025`
  comparison + confusion-matrix UI, `FE6-026` mock + actual smoke.
- Project-scoped, read-only MVP6.3 Benchmark Comparison UI built MOCK-FIRST
  against the frozen contract (`docs/api/openapi-mvp6-3-draft.json`,
  `docs/api/MVP6_3_BENCHMARK_COMPARISON_API_CONTRACT_DRAFT.md`,
  `docs/pm/MVP6_3_FRONTEND_UX_REQUIREMENTS.md`) + PM persist freeze (C12 = option a,
  process-local persist keyed by `comparison_id`).

## 완료한 작업

- IA: project-scoped routes only; NO ID-bound page added to the global LNB.
  Entry is a `Compare runs` action on the Evaluation Datasets page header next to
  the existing `Prompt performance` link. Breadcrumbs:
  `Projects / {project} / Evaluation / Benchmark Comparison`.
- Flow implemented end to end: run selector (>=2 terminal-success runs, ineligible
  runs shown disabled with reason) + group-by + baseline picker -> `Build comparison`
  -> side-by-side metric table with signed deltas + delta-status badges
  (IMPROVED/REGRESSED/UNCHANGED/NOT_COMPARABLE) -> comparability warning band
  (per-set + per-run badges) -> confusion matrix with ENTITY_CLASS/RELATION_TYPE
  axis toggle and per-run selector -> cell drilldown into contributing
  `EvaluationErrorCase` rows (evidence-first).
- Honest states: loading; empty (no runs / <2 runs / no measurable metrics / empty
  matrix / empty cell); error (missing/ineligible run degrades to `excluded_runs[]`
  with `RunExclusionReason`, no full crash); comparability-flagged (warning band +
  per-run badges, composes with the data state); not-comparable (muted, explicit
  "Not comparable", no fake numeric delta). `NOT_APPLICABLE` renders `N/A` (never
  fake 0%/100%); `__NONE__` renders as a labeled "(no match)" sentinel, never an
  ontology id.
- Types/client/query/mocks match the frozen OpenAPI exactly (field/enum names
  verbatim): `BenchmarkComparisonGroupBy`, `ComparisonComparabilityFlag`,
  `ConfusionMatrixAxis`, `MetricDeltaStatus`, `RunExclusionReason`,
  `BenchmarkMutationGuard` (all-false), `label_display_names` (id->display, never
  keyed by `__NONE__`), `row_comparability_flags`, `capabilities`. Reuses MVP6.1
  `EvaluationRun` / `EvaluationMetric*` / `EvaluationErrorCase` /
  `EvaluationCandidateRef` / `GoldEvidenceRef` verbatim — no redefinition/rename.
- Product Showcase style; read-only safety banner. No copy implies automated model
  selection, autonomous publish, policy enforcement, new run execution, or that a
  regressed/improved metric triggers any action. Build action is `Build comparison`
  (never "Run"/"Evaluate").
- Mock-first client builder persists composed comparisons in a process-local store
  keyed by `comparison_id` so list + GET-by-id round-trip (matches PM C12 option a).
  Actual API mode wired for all four endpoint families behind `VITE_USE_MOCK_API`.
- Added `npm run smoke:mvp6:benchmark:mock` and `npm run smoke:mvp6:benchmark:actual`
  (additive; existing scripts/routes/smokes untouched).

## 변경 파일

- 생성:
  - `apps/frontend/src/pages/BenchmarkComparisonPage.tsx`
  - `apps/frontend/src/shared/mocks/mvp6BenchmarkFixtures.ts`
  - `apps/frontend/src/shared/api/mvp6BenchmarkMock.test.ts`
  - `apps/frontend/scripts/mvp6-benchmark-mock-route-smoke.mjs`
  - `apps/frontend/scripts/mvp6-benchmark-actual-api-smoke.mjs`
  - `docs/handoffs/wave-034/FRONTEND_REPORT.md`
- 수정:
  - `apps/frontend/src/shared/api/types.ts` (MVP6.3 types appended; MVP6.1 reused, not renamed)
  - `apps/frontend/src/shared/api/client.ts` (benchmark methods + `BenchmarkComparisonError` + process-local store; `listEvaluationRuns` mock includes benchmark fixture runs)
  - `apps/frontend/src/shared/api/queries.ts` (5 benchmark query/mutation hooks)
  - `apps/frontend/src/app/router.tsx` (2 project-scoped benchmark routes)
  - `apps/frontend/src/pages/EvaluationDatasetsPage.tsx` (`Compare runs` entry link)
  - `apps/frontend/package.json` (2 smoke scripts)

## 실행/검증 결과

- `cd apps/frontend && npm run test` -> PASS. `Test Files 8 passed (8) · Tests 28 passed (28)`.
  New file `mvp6BenchmarkMock.test.ts` = 9 tests PASS (build/insufficient-runs 400,
  excluded-run degradation, signed deltas + IMPROVED/REGRESSED/UNCHANGED, NOT_COMPARABLE
  + MISSING_METRIC, comparability flags, list/GET-by-id round-trip, 404, confusion
  matrix `__NONE__` + N/A accuracy, cell drilldown incl. empty diagonal).
- `cd apps/frontend && npm run build` -> PASS (`tsc --noEmit` app+node + `vite build`,
  `✓ built in ~2s`, 1870 modules, no type errors).
- `cd apps/frontend && npm run smoke:mvp6:benchmark:mock` -> PASS.
  `{ "status": "PASS", "routeCount": 5, "screenshotCount": 5 }`.
  Artifacts: `/tmp/ontology-mvp6-benchmark-mock-smoke/`. Asserts builder + read-only
  copy, build -> deltas (higher/lower/Not comparable/MISSING_METRIC), excluded runs
  (NOT_TERMINAL_SUCCESS), confusion matrix `__NONE__` "(no match)", cell drilldown
  evidence-first, RELATION_TYPE axis toggle.
- `cd apps/frontend && npm run smoke:mvp6:benchmark:actual` -> NOT RUN.
  Reason: backend runtime not reachable (`http://127.0.0.1:8000` returns 000) and the
  backend benchmark module `apps/backend/app/modules/benchmark/` is still empty with no
  `wave-034/BACKEND_REPORT.md`. The script is implemented and wired; it seeds an actual
  project/dataset/gold/2 runs, exercises all four endpoint families with R3 list +
  GET-by-id round-trip and all-false mutation-guard assertions, then drives the UI.
  Run once the backend runtime is up.
- `git diff --check` -> PASS (no whitespace errors / no output).

## API/Enum/DTO 변경 여부

- 신규 백엔드 변경 없음. Frontend types match frozen OpenAPI exactly; no MVP6.1
  field/enum rename. No contract mismatch found vs the frozen draft (backend runtime
  not yet available to cross-check at runtime).

## Blocker

- 없음 (none blocking). Backend runtime unavailability only blocks `:actual` smoke,
  which is explicitly mock-first this wave.

## 남은 TODO

- Run `npm run smoke:mvp6:benchmark:actual` against the live backend once the runtime
  lands, and reconcile any field-name drift (none expected; both sides target the
  same frozen OpenAPI). Watch the confusion-matrix query param order (`run_id`+`axis`)
  and `cell_id` URL-safety against the backend implementation.

## 다른 역할에 전달할 내용

- Backend: Frontend consumes `confusion-matrix?run_id=...&axis=...` (query params,
  one matrix per run) and `cell_id`-addressed drill. `label_display_names` must be
  id->display and never keyed by `__NONE__`. Keep `BenchmarkMutationGuard` 4 keys
  all-false; `metric_status`/`delta`/`delta_status` per-run keyed by `run_id`.
- QA: mock R-gate evidence is in `/tmp/ontology-mvp6-benchmark-mock-smoke/`; actual
  R-gates need the backend runtime. Reverify no MVP6.1 rename and all-false guard.

## 총괄에게 요청하는 결정

- Accept the mock-first Benchmark Comparison UI as `PASS` for FE6-023..FE6-026, with
  `:actual` smoke as a follow-up gated on backend runtime availability (not a FE blocker).

## 현재 판정

- PASS (mock-first). Actual smoke NOT RUN — backend runtime not reachable this wave.
