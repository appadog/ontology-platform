# PM / Architecture Report - Wave 33

## 담당 범위

- backlog ID:
  - `PM6-017` MVP6.3 Benchmark Comparison P0 scope freeze
  - (생성한 후속 ID: `BE6-023`, `FE6-022`, `INT6-021`)
- 작업 경로:
  - `docs/pm/MVP6_3_BENCHMARK_COMPARISON_BRIEF.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/adr/0009-mvp6-3-benchmark-comparison-read-only-boundary.md`
  - `docs/handoffs/wave-033/PM_REPORT.md`

## 완료한 작업

- 다음 MVP6 theme P0로 **Benchmark Comparison / Confusion Matrix**를 선택하고
  contract-first planning으로 freeze했다. Runtime API/route/component/model/
  migration/seed/smoke/test는 열지 않았다.
- 선택 근거를 명시했다: 이미 닫힌 MVP6.1 evaluation surface(`EvaluationRun`,
  `EvaluationMetric`, `EvaluationErrorCase`, `EvaluationDimensions`) 위에서
  순수 read-side aggregation만 하는 가장 작은 coherent delta이며, mutation이
  전혀 없어 safety boundary가 자명하게 유지된다. MVP6.1이 P1으로 미뤄둔
  "model/prompt comparison board", "relation-type matrix and confusion matrix",
  "class classification accuracy"를 그대로 닫는다. Gold Set authoring/dataset
  revisioning(`PM6-005`/`BE6-006`)은 write/ownership 도입이라 더 크고,
  Theme-3+는 각각 별도 boundary가 필요해 제외했다.
- P0 demo flow를 확정했다:
  `select project -> open Benchmark Comparison -> select 2+ existing evaluation runs -> view side-by-side metric comparison with deltas -> view per-class / per-relation-type confusion matrix -> drill into a confusion cell to its contributing error cases`.
- 분석 가능한 source artifacts를 MVP6.1 evaluation artifact로만 제한했다.
  MVP3 review/correction, MVP4 quality, MVP6.2 learning signal, published-graph
  join은 제외다.
- 신규 enum을 확정했다(신규 metric name 없음, `EvaluationMetricName` 그대로 재사용):
  `BenchmarkComparisonGroupBy`(`MODEL`/`PROMPT_VERSION`/`ONTOLOGY_VERSION`/
  `DATASET_VERSION`/`PARSER_VERSION`), `ComparisonComparabilityFlag`
  (`SAME_DATASET`/`DIFFERENT_DATASET_VERSION`/`DIFFERENT_DATASET`/
  `DIFFERENT_ONTOLOGY_VERSION`/`MISSING_METRIC`), `ConfusionMatrixAxis`
  (`ENTITY_CLASS`/`RELATION_TYPE`), metric delta status
  (`IMPROVED`/`REGRESSED`/`UNCHANGED`/`NOT_COMPARABLE`).
- delta 정의(baseline run + 고정 epsilon), confusion cell 정의(기존
  `EvaluationErrorCase`에서 파생, `__NONE__` sentinel, empty bucket은
  `NOT_APPLICABLE`), run eligibility(성공 terminal run만, cross-dataset은 block이
  아니라 flag)를 freeze했다.
- safety boundary를 freeze했다: read-only analysis only. 신규 run 실행/LLM
  호출/gold-set authoring/dataset revisioning write/candidate/publish/
  published-graph mutation 없음. comparison object를 persist할 경우 MVP6.2처럼
  all-false `mutation_guard`를 가지는 analysis artifact다.
- 제안 additive endpoint family를 brief에 적었다(Backend가 이름 확정):
  `POST/GET /api/v1/projects/{project_id}/benchmark-comparisons`,
  `GET /api/v1/benchmark-comparisons/{comparison_id}`,
  `GET .../confusion-matrix`,
  `GET .../confusion-matrix/cells/{cell_id}/error-cases`.
- backlog에 Wave33 freeze summary와 `PM6-017`/`BE6-023`/`FE6-022`/`INT6-021`을
  기존 번호 체계를 이어 추가했다. backlog 상단 status도 갱신했다.
- 새 durable boundary 결정이므로 ADR `0009`를 기존 0006~0008 per-MVP boundary
  패턴으로 추가했다.

## 변경 파일

- 생성:
  - `docs/pm/MVP6_3_BENCHMARK_COMPARISON_BRIEF.md`
  - `docs/adr/0009-mvp6-3-benchmark-comparison-read-only-boundary.md`
  - `docs/handoffs/wave-033/PM_REPORT.md`
- 수정:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`

## 실행/검증

- 실행한 명령:
  - `git diff --check`
  - `python3 -c "json.load(open('docs/api/openapi-mvp6-draft.json'))"` (기존
    MVP6.1 surface enum/schema 확인 목적; planning 문서 정합성 확인)
- 결과:
  - `git diff --check`: PASS (출력 없음, whitespace/conflict 에러 없음).
  - MVP6.1 OpenAPI 확인: `EvaluationMetricName`(8개), `EvaluationErrorType`(8개),
    `EvaluationDimensions`(class/relation/source bucket), `EvaluationRun` 버전
    컨텍스트가 존재함을 확인하고 brief가 이를 정확히 재사용하도록 작성했다.
- 실행하지 못한 검증:
  - PM/Architecture 문서 범위라 backend/frontend runtime/test/OpenAPI export는
    수행하지 않는다. OpenAPI planning artifact 작성/parse는 Backend(`BE6-023`)
    몫이다.

## API/Enum/DTO 변경

- 변경 여부: 있음, **문서 계약 한정** (runtime/OpenAPI 변경 없음)
- 상세:
  - Runtime API, `docs/api/openapi-*.json`, DB model/migration, frontend
    route/component는 변경하지 않았다.
  - 신규 enum 후보를 문서상 확정했다(위 "완료한 작업" 참조). 신규
    `EvaluationMetricName`은 추가하지 않았다.
  - 신규 DTO 후보(문서 계약): `BenchmarkComparison`(request/response),
    `ConfusionMatrix`(response), comparison metric row, comparability summary,
    all-false `mutation_guard`. Backend가 `BE6-023`에서 최종 필드/이름을 확정한다.
- 영향받는 역할:
  - Backend(`BE6-023`): brief와 본 보고서를 읽고
    `docs/api/MVP6_3_BENCHMARK_COMPARISON_API_CONTRACT_DRAFT.md` +
    `docs/api/openapi-mvp6-3-draft.json`(OpenAPI 3.1.0, additive)을 planning-only로
    작성. epsilon 상수와 baseline default를 명시하고, persist 시 all-false
    mutation guard를 노출.
  - Frontend(`FE6-022`): Benchmark Comparison route/IA, run selector + baseline
    picker, metric delta table, confusion matrix + cell drilldown, comparability
    flag/not-comparable/loading/empty/error/permission state 요구사항 작성.
  - QA(`INT6-021`): `INT6-*` 연속 checklist 작성, planning artifact 정합성과
    runtime leakage 부재 검증.

## Blocker

- 없음.
- 주의: 작업트리에 이전 wave/다른 역할의 변경이 있을 수 있다. PM은 지정된
  PM/backlog/ADR/handoff 문서만 편집했고 다른 변경을 되돌리거나 덮어쓰지 않았다.

## 남은 TODO

- Backend: `BE6-023` contract draft + OpenAPI planning artifact.
- Frontend: `FE6-022` UX/API 요구사항 문서.
- QA: `INT6-021` executable acceptance checklist (backlog 문서) 작성 및 Wave34
  권고.

## 다른 역할에 전달할 내용

- PM:
  - MVP6.3 P0는 read-only 비교/분석까지다. 신규 run 실행, gold-set 작성, dataset
    revision write, training export, 새 metric은 별도 freeze 전까지 열지 않는다.
- Backend:
  - 모든 endpoint는 additive, read-only, project-scoped. comparison은 기존 run을
    조합/집계만 한다. epsilon은 결정적 상수(예: `0.0001`)로 명시. confusion cell은
    기존 `EvaluationErrorCase`에서만 파생하고 새 error model을 만들지 않는다.
    persist하면 all-false `mutation_guard`(candidate/published/evaluation-run/
    gold-set) 노출. `EvaluationMetricName`은 그대로 재사용하고 새 metric을 만들지
    않는다.
  - 검토 필요한 필드/상태: baseline_run_id default 규칙, metric delta_status
    임계값, `ComparisonComparabilityFlag` 산출 규칙, `__NONE__` sentinel 표현,
    excluded_runs exclusion_reason.
- Frontend:
  - Benchmark Comparison은 Evaluation/Benchmark area에 contextual한 project-scoped
    화면으로 두고 ID-bound page를 global LNB에 평면 노출하지 않는다. delta는
    부호/색으로 보여주되 `NOT_COMPARABLE`/comparability flag를 명확히 표시해
    오해를 막는다. confusion cell 클릭 시 contributing error case로 drilldown.
    checklist에 넣을 상태: loading/empty(2개 미만 run 선택)/error/permission/
    not-comparable/cross-dataset-flagged.
- QA:
  - planning artifact 4종(brief/ADR/backlog/Backend·Frontend 후속)이 P0 flow,
    enum/state, source artifact, safety boundary, exclusion에 합의하는지 검증.
    drafts할 contract: 위 endpoint family와 enum. leakage 검색에서 신규 run
    실행, LLM 호출, gold-set/dataset write, graph mutation이 `apps/`/`infra/`에
    들어오지 않았는지 확인.

## 총괄에게 요청하는 결정

- Wave33 PM freeze를 PASS로 승인하고 Backend/Frontend/QA가 contract-first
  planning(`BE6-023`/`FE6-022`/`INT6-021`)을 이어가도록 허용해 달라.
- MVP6.3 P0를 read-only Benchmark Comparison / Confusion Matrix로 유지하고
  Gold Set authoring/dataset revisioning과 신규 run 실행은 별도 wave로 분리해
  달라.

## 현재 판정

- PASS
