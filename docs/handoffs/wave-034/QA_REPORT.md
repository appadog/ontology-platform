# QA / Integration Report - Wave 34

Role: Integration / QA — MVP6.3 Benchmark Comparison thin implementation
Date: 2026-06-26
Verdict: `PASS / MVP6.3 THIN-SLICE CLOSEOUT RECOMMENDED`

## 담당 범위

- backlog ID: `INT6-022` backend runtime acceptance, `INT6-023` frontend mock/API
  acceptance (incl. the ACTUAL smoke not run in the parallel wave), `INT6-024`
  no-mutation guard, `INT6-025` Wave34 closeout recommendation.
- 작업 경로:
  - `docs/backlog/INT6_3_BENCHMARK_COMPARISON_ACCEPTANCE.md` (R1-R10 updated)
  - `docs/handoffs/wave-034/QA_REPORT.md`
- Read-only validation of `apps/backend/app/modules/benchmark/` and
  `apps/frontend` benchmark surface. No runtime code changed by QA.

## Key gap closed this wave

The parallel Wave34 reported Frontend `:actual` smoke as **NOT RUN** because the
backend benchmark module did not exist yet at the moment FE ran. Both sides now
exist. QA **booted the backend runtime and ran
`npm run smoke:mvp6:benchmark:actual` — it PASSED**, exercising all four endpoint
families end-to-end (create -> list/get-by-id round-trip -> confusion matrix ->
cell drilldown) plus the actual UI route, with an all-false mutation guard.

## 완료한 작업 / 실행·검증 (EXACT commands + output)

### INT6-022 Backend runtime — PASS

- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_3_benchmark_api.py -q`
  -> `13 passed in 4.41s`.
- `.venv/bin/pytest tests/test_mvp6_evaluation_api.py -q` -> `4 passed in 1.74s`.
- `.venv/bin/ruff check app tests scripts` -> `All checks passed!`.
- Runtime OpenAPI compare (`app.openapi()` vs `docs/api/openapi-mvp6-3-draft.json`):
  `Runtime benchmark paths: 4`, `operations: 5`, `Shared schemas checked: 30`,
  `Field/enum mismatches: 0`. **(R1, R2)**
- Reused enums verbatim in runtime OpenAPI: `EvaluationMetricName` (8),
  `EvaluationErrorType` (8), `EvaluationMetricStatus` (MEASURED/NOT_APPLICABLE);
  new MVP6.3 enums exact: `BenchmarkComparisonGroupBy`,
  `ComparisonComparabilityFlag`, `ConfusionMatrixAxis`, `MetricDeltaStatus`,
  `RunExclusionReason`. **No MVP6.1 rename.**
- Live error contract probes against the running app **(R9)**:
  - dup run_ids -> `400 BENCHMARK_INSUFFICIENT_RUNS` (`eligible_run_count:1`).
  - unknown id -> `404 BENCHMARK_COMPARISON_NOT_FOUND`.
  - confusion-matrix bad run_id -> `404 BENCHMARK_RUN_NOT_IN_COMPARISON`.
  - `BENCHMARK_BASELINE_INELIGIBLE` / `BENCHMARK_METRIC_NAME_INVALID` covered by
    `test_mvp6_3_benchmark_api.py`.
- Live GET-by-id body **(R4, R5)**: `delta_epsilon=0.0001`; baseline cell
  `delta 0.0 / UNCHANGED`; signed `MEASURED` deltas; per-run + per-set
  `comparability_flags=[SAME_DATASET]`. The two deterministic-mock runs produce
  identical metrics, so IMPROVED/REGRESSED/NOT_COMPARABLE(`delta:null`)/
  MISSING_METRIC are exercised in the backend + mock test suites rather than the
  seeded smoke pair.

### INT6-023 Frontend mock + ACTUAL — PASS

- `cd apps/frontend && npm run test` -> `Test Files 8 passed (8) · Tests 28 passed
  (28)` (incl. 9 benchmark mock tests).
- `npm run build` -> PASS (`✓ built in 2.50s`, no type errors).
- `npm run smoke:mvp6:benchmark:mock` -> `{ "status": "PASS", "routeCount": 5,
  "screenshotCount": 5 }`. (vite started with `VITE_USE_MOCK_API=true` on 5173.)
- **`npm run smoke:mvp6:benchmark:actual` -> `{ "status": "PASS",
  "apiCheckCount": 4, "routeCount": 1 }`** against live backend (uvicorn on
  file-backed SQLite at `127.0.0.1:8000`) + vite actual mode
  (`VITE_USE_MOCK_API=false`, `VITE_API_BASE_URL=http://127.0.0.1:8000`).
  apiChecks captured: `create-comparison` (mutation_guard all-false, run_count 2),
  `list-getbyid-roundtrip` (R3 satisfied), `confusion-matrix` (axis ENTITY_CLASS,
  4 labels / 3 cells, R6), `cell-drilldown` (cell_id decodes to
  `["ENTITY_CLASS","__NONE__","class-extra"]`, 1 contributing error case, R7). UI
  route `/projects/{id}/benchmark-comparisons` returned 200 and rendered
  builder + side-by-side metrics + confusion matrix.
- Artifacts: `/tmp/ontology-mvp6-benchmark-mock-smoke/`,
  `/tmp/ontology-mvp6-benchmark-actual-smoke/mvp6-benchmark-actual-api-smoke.json`.
- **No FE/BE contract drift found.** Field/enum names, `cell_id` opacity,
  `run_id`+`axis` query params, and `__NONE__`/`NOT_APPLICABLE` rendering matched
  the running backend exactly.

### INT6-024 No-mutation guard — PASS (3 layers)

- Response level: live `mutation_guard` = all 4 keys `false`
  (`candidate_graph_mutated`, `published_graph_mutated`, `evaluation_run_started`,
  `gold_set_mutated`); both comparison and matrix carry it. Schema fields default
  `False`.
- Code level: `app/modules/benchmark/service.py` imports only
  `evaluation.service` + `evaluation.schemas` + `project.models` (read). Calls are
  all reads (`metrics_for_run`, `errors_for_run`, `run_or_404`, `list_gold_*`,
  `_match_*`, `_build_deterministic_*_candidates`, dict reads). No `session.add/
  commit/delete`, no INSERT/UPDATE; the only write is its own process-local
  `_comparisons: dict[str, BenchmarkComparison]` store (PM C12 option a). `seen.add`
  is a local dedupe set.
- Data level: after a full build/list/get/matrix/drill flow against live SQLite,
  row counts = 0 for candidate_entities/relations/evidence/corrections,
  publish_jobs, published_entities/relations/graph_versions,
  prompt_templates/versions, extraction_jobs, review_tasks/decisions. **(R8)**
- No MVP6.1 field/enum rename reconfirmed at runtime (R2 above).

### Regression — PASS (R10)

- `cd apps/backend && .venv/bin/pytest tests/test_project_ontology_api.py
  tests/test_mvp3_api.py tests/test_mvp4_api.py tests/test_mvp5_api.py
  tests/test_mvp6_evaluation_api.py tests/test_mvp6_2_learning_api.py
  tests/test_mvp6_3_benchmark_api.py -q` -> `56 passed in 7.05s`.
- `cd apps/frontend && npm run smoke:mvp6:actual` (MVP6.1 evaluation actual smoke,
  the FE surface benchmark reads from) -> `{ "status": "PASS" }`.
- Additive-only: 4 new benchmark paths; no MVP1-MVP6.2 path renamed/removed.

## R1-R10 verdicts

| Gate | Verdict |
|---|---|
| R1 paths exist/respond | PASS |
| R2 DTO/enum match (0 mismatch / 30 schemas) | PASS |
| R3 POST->list->get-by-id round-trip | PASS |
| R4 delta math + epsilon 0.0001 | PASS |
| R5 comparability flags (flag-not-block) | PASS |
| R6 confusion matrix counts + `__NONE__`/NOT_APPLICABLE | PASS |
| R7 cell drilldown + empty diagonal | PASS |
| R8 mutation_guard all-false + tables unchanged | PASS |
| R9 error contract 400/404 | PASS |
| R10 MVP1-MVP6.2 regression additive | PASS |

(`INT6_3` acceptance doc R1-R10 table updated with this evidence.)

## 변경 파일

- 수정: `docs/backlog/INT6_3_BENCHMARK_COMPARISON_ACCEPTANCE.md` (R1-R10 verdicts).
- 생성: `docs/handoffs/wave-034/QA_REPORT.md`.
- Runtime code (`apps/`): 변경 없음.

## API/Enum/DTO 변경

- 변경 여부: 없음 (QA validation only). Backend's Wave34 additions are additive
  read-only; verified no rename/removal of MVP1-MVP6.2 contract.

## Blocker

- 없음.

## 환경 노트

- Backend default `database_url` targets PostgreSQL:5432 (not running locally), so
  a naive `uvicorn` boot 500s on first DB call. QA booted with
  `DATABASE_URL=sqlite+pysqlite:///<file>` after `Base.metadata.create_all` (same
  pattern as `tests/test_mvp6_3_benchmark_api.py` and prior MVP smokes). This is an
  environment/config nuance, not a benchmark defect. Documenting the SQLite boot
  recipe for the benchmark actual smoke is a P2 doc follow-up.
- No leftover listeners on 8000/5173 after teardown. `git diff --check` clean.

## 남은 TODO / Wave35 hardening candidates (all non-blocking, P1/P2)

- (P2) Document the SQLite uvicorn boot recipe so `smoke:mvp6:benchmark:actual` is
  one-command reproducible (mirror MVP6.1 smoke runbook).
- (P1, carried from MVP6.2) regenerate the stale full-runtime
  `openapi-mvp2-draft.json` snapshot (omits learning + benchmark paths). Unrelated
  to MVP6.3 correctness.
- (P2) the seeded deterministic-mock run pair yields identical metrics
  (UNCHANGED). IMPROVED/REGRESSED/NOT_COMPARABLE are well covered by unit tests; a
  divergent-run seed for the actual smoke would make the side-by-side delta UI
  visually richer.

## 다른 역할에 전달할 내용

- PM: MVP6.3 thin slice meets all R1-R10 runtime gates with a verified actual-API
  smoke and 3-layer no-mutation evidence. Recommend closeout; no Wave35 hardening
  is required to protect the MVP6.3 P0 boundary.
- Backend: clean. Optional P2 — provide a SQLite boot doc for the actual smoke.
- Frontend: actual smoke passed with zero contract drift against the live backend.

## 총괄에게 요청하는 결정

- Accept Wave34 MVP6.3 Benchmark Comparison thin slice as `PASS` and close it. The
  actual-API smoke gap from the parallel wave is closed. Remaining items are
  P1/P2 follow-ups, not blockers.

## 현재 판정

- PASS — `MVP6.3 THIN-SLICE CLOSEOUT` recommended.
