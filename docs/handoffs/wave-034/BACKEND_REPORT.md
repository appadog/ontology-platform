# Backend Report - Wave 34

## 담당 범위
- backlog ID: `BE6-024` comparison + delta endpoints, `BE6-025` confusion matrix + cell error-case drilldown, `BE6-026` OpenAPI export/runtime alignment, `BE6-027` no-mutation regression guard
- 작업 경로:
  - `apps/backend/app/modules/benchmark/` (신규 모듈: `__init__.py`, `schemas.py`, `service.py`, `router.py`)
  - `apps/backend/app/api/router.py` (라우터 등록)
  - `apps/backend/tests/test_mvp6_3_benchmark_api.py` (신규)
  - `docs/handoffs/wave-034/BACKEND_REPORT.md`

## 완료한 작업
- PM이 FREEZE한 persist option (a)를 구현: process-local `_comparisons: dict[str, BenchmarkComparison]` + `reset_runtime_store()` (MVP6.1 `_runs` 패턴 미러). list + GET-by-id round-trip(R3) 충족.
- 4개 frozen endpoint families (5 operations) 전부 구현, `openapi-mvp6-3-draft.json` 필드/enum 이름과 정확히 일치:
  - `POST /api/v1/projects/{project_id}/benchmark-comparisons`
  - `GET  /api/v1/projects/{project_id}/benchmark-comparisons`
  - `GET  /api/v1/benchmark-comparisons/{comparison_id}`
  - `GET  /api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix`
  - `GET  /api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix/cells/{cell_id}/error-cases`
- MVP6.1 evaluation 모듈을 read-only로 재사용: `EvaluationRun`, `EvaluationMetric`, `EvaluationErrorCase`, `EvaluationMetricName`(x8 verbatim), `EvaluationMetricStatus`, `EvaluationErrorType`를 import/reference. MVP6.1 필드/enum rename 없음. confusion matrix는 evaluation service의 `errors_for_run` + 결정적 매칭 헬퍼(`_match_entities`/`_match_relations`/`_build_deterministic_*_candidates`)를 읽기 전용으로 재사용.
- Per-metric signed delta: baseline 대비 `delta = value - baseline`, 고정 epsilon `0.0001`, `IMPROVED/REGRESSED/UNCHANGED/NOT_COMPARABLE`. 한쪽이라도 `NOT_APPLICABLE`/absent이면 `delta = null` + `NOT_COMPARABLE`. baseline 자기 자신은 `delta 0.0 / UNCHANGED`.
- Comparability flag 3-level: per-run(`runs[].comparability_flags`), per-set(`comparability_summary.flags`), per-metric-row(`metric_rows[].row_comparability_flags` = `MISSING_METRIC`). dataset/version/ontology version 차이는 flag만, 차단 없음.
- Confusion matrix: `ENTITY_CLASS`/`RELATION_TYPE` 축. off-diagonal/false-pos/false-neg는 error case에서, diagonal(true-positive)은 결정적 매칭 재계산에서 도출. 빈 버킷 → `accuracy = null`, `accuracy_status = NOT_APPLICABLE` (조작된 0/100% 없음). false-pos/neg는 `__NONE__` sentinel. `label_display_names` id→display map 포함.
- `cell_id`: axis+gold_label+candidate_label을 base64url(JSON tuple)로 인코딩한 URL-safe opaque id. raw ontology id가 URL에 노출되지 않음. drill 엔드포인트가 디코드하여 contributing `EvaluationErrorCase`를 페이지네이션(`limit`/`cursor`)으로 반환.
- `>=2` terminal-success(`SUCCEEDED`/`SUCCESS`) + same-project eligibility 강제. ineligible/missing/duplicate/cross-project run은 crash 없이 `excluded_runs[]` + `RunExclusionReason`. eligible < 2면 `400 BENCHMARK_INSUFFICIENT_RUNS`, baseline ineligible면 `400 BENCHMARK_BASELINE_INELIGIBLE`.
- 모든 comparison/matrix 응답에 all-false `BenchmarkMutationGuard`. candidate/review/prompt/extraction/evaluation/publish/published graph/policy/gold에 어떤 write도 없음 (read-only import만).

## 변경 파일
- 생성: `apps/backend/app/modules/benchmark/{__init__,schemas,service,router}.py`, `apps/backend/tests/test_mvp6_3_benchmark_api.py`, 본 보고서
- 수정: `apps/backend/app/api/router.py` (benchmark_router import + include, evaluation/learning 다음에 등록)

## 실행/검증
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_3_benchmark_api.py -q` → `13 passed in 3.23s`
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_evaluation_api.py -q` → `4 passed in 1.47s`
- 회귀: `tests/test_mvp6_3_benchmark_api.py tests/test_mvp6_evaluation_api.py tests/test_mvp6_2_learning_api.py` → `24 passed in 4.50s`
- `cd apps/backend && .venv/bin/ruff check app tests scripts` → `All checks passed!`
- OpenAPI export/compare (runtime `app.openapi()` vs `docs/api/openapi-mvp6-3-draft.json`):
  - MVP6.3 paths present: 4, operations: 5
  - schema field/enum mismatches vs draft: **0** across 22 benchmark schemas
  - draft parses: `3.1.0`, `0.6.3-draft`
- `git diff --check` → clean (출력 없음)
- 사용 인터프리터: `apps/backend/.venv/bin/python` (`.venv/bin/pytest`, `.venv/bin/ruff`).
- 실행하지 못한 검증: Frontend test/build/smoke (BE 범위 아님). actual smoke(`smoke:mvp6:benchmark:actual`)는 Frontend가 추가.

## API/Enum/DTO 변경
- 변경 여부: 있음 (additive only)
- 상세: MVP6.3 신규 read-only 엔드포인트/스키마 추가. 신규 enum: `BenchmarkComparisonGroupBy`, `ComparisonComparabilityFlag`, `ConfusionMatrixAxis`, `MetricDeltaStatus`, `RunExclusionReason`. 신규 DTO: `BenchmarkComparison(+Run/MetricRow/MetricCell/ExcludedRun/Summary/ListResponse/Capabilities/MutationGuard)`, `ComparabilitySummary`, `ConfusionMatrix(+Cell/Totals/LabelCount)`, `ConfusionCellErrorCaseRef`, `ConfusionCellErrorCasesResponse`, `BenchmarkComparisonCreateRequest`, `BenchmarkRunContext`. MVP1–MVP6.2 path/schema rename·삭제 없음. MVP6.1 evaluation enum/필드 verbatim 재사용.
- 영향받는 역할: Frontend (frozen OpenAPI에 맞춰 types/client/mocks), QA (R1-R10 + no-mutation guard 검증).

## Blocker
- 없음.

## 남은 TODO
- Frontend: `FE6-023`~`FE6-026` project-scoped Benchmark Comparison UI + types/client/mocks + mock/actual smoke.
- QA: `INT6-022`~`INT6-025` R1-R10 runtime gate, no-mutation guard, MVP1-MVP6.2 회귀.
- (옵션) full-runtime `openapi-mvp2-draft.json` 스냅샷은 여전히 stale (MVP6.2 P1 follow-up과 동일 이슈). benchmark path 미포함. P1, 비차단.

## 다른 역할에 전달할 내용
- PM: 범위 확장 없음. frozen 4 endpoint families + persist option (a)만 구현.
- Frontend (계약 디테일):
  - `cell_id` 포맷: `cm_<base64url(json([axis, gold_label, candidate_label]))>` — opaque/URL-safe. FE는 matrix 응답의 `cell.id` / `contributing_error_case_ref.cell_id`를 그대로 drill URL에 사용. 직접 생성/파싱하지 말 것.
  - error-case drill 응답 shape: `ConfusionCellErrorCasesResponse { comparison_id, run_id, axis, cell_id, gold_label, candidate_label, error_cases[](EvaluationErrorCase verbatim), next_cursor }`. 페이지네이션은 opaque `cursor`(정수 offset 인코딩) + `limit`(default 50, max 100). diagonal/true-positive cell은 `error_cases: []` (FE에서 non-clickable 권장).
  - `__NONE__`은 false-pos(`gold_label=__NONE__`)/false-neg(`candidate_label=__NONE__`) sentinel. `label_display_names`의 key로는 절대 등장하지 않음 → FE는 "(no match)"로 렌더.
  - empty matrix: `cells: []`, `labels: []`, `totals.accuracy: null`, `accuracy_status: NOT_APPLICABLE`. 0/100%로 렌더 금지.
  - `NOT_COMPARABLE` cell은 `delta: null`. `row_comparability_flags=[MISSING_METRIC]`로 row 단위 경고 가능.
  - confusion-matrix GET은 `run_id`+`axis` query 필수. `run_id`는 comparison에 포함된 run이어야 함(아니면 `404 BENCHMARK_RUN_NOT_IN_COMPARISON`).
- QA: all-false `BenchmarkMutationGuard`(comparison+matrix 양쪽), MVP6.1 rename 없음, R3 round-trip, epsilon 0.0001, `__NONE__`/`NOT_APPLICABLE` 정직성, `>=2` eligibility/`RunExclusionReason`가 acceptance gate. 신규 테스트 파일 `tests/test_mvp6_3_benchmark_api.py` 13개 케이스로 이미 커버.

## 총괄에게 요청하는 결정
- Wave34 Backend MVP6.3 thin runtime을 `PASS`로 승인하고 Frontend/QA가 frozen 계약 위에서 진행하도록 해 달라.

## 현재 판정
- PASS
