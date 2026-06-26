# QA / Integration Report - Wave 33

## 담당 범위
- backlog ID: `INT6-021` (MVP6.3 Benchmark Comparison / Confusion Matrix
  executable acceptance checklist; theme `PM6-017`, Backend `BE6-023`,
  Frontend `FE6-022`). Contract-first planning only.
- 작업 경로:
  - `docs/backlog/INT6_3_BENCHMARK_COMPARISON_ACCEPTANCE.md` (생성)
  - `docs/handoffs/wave-033/QA_REPORT.md` (본 보고서)

## 완료한 작업
- MVP6.3 executable acceptance checklist를 작성했다. PASS/PARTIAL/FAIL/
  NOT RUNNABLE verdict semantics와 per-criterion 표(C1–C12 planning gates +
  R1–R10 Wave34 runtime gates)를 INT6.2 checklist 형식 그대로 따랐다.
- 4종 planning artifact(PM brief, ADR 0009, Backend contract/OpenAPI, Frontend
  requirements)가 P0 flow, frozen enum/state, source artifact, read-only safety
  boundary, exclusion에 합의함을 교차 검증했다.
- OpenAPI planning artifact를 parse하고 4개 benchmark path family + 신규
  enum/schema + 3개 amended FE-gap 필드 + all-false mutation_guard 존재를
  python assertion으로 확인했다.
- Frontend 10개 DTO gap이 최종 Backend draft에서 모두 해소됨을 확인했다
  (7 pre-answered + 3 amended).
- `apps/`/`infra/`에 MVP6.3 runtime 구현이 leak되지 않았음을 확인했다.
- 체크리스트는 C1 scope/flow, C2 4 endpoint families, C3 frozen enums(GroupBy/
  ComparabilityFlag/Axis/delta status + NOT_COMPARABLE/NOT_APPLICABLE/`__NONE__`),
  C4 MVP6.1 metric/error name verbatim reuse, C5 screen flow, C6 delta semantics,
  C7 comparability-warning correctness, C8 confusion cell correctness, C9 read-only/
  no-mutation boundary, C10 evidence/version/model-run traceability, C11 10 FE gap
  closure, C12 Backend persist-vs-compute를 Wave34 가정으로 명시했다.

## 변경 파일
- 생성:
  - `docs/backlog/INT6_3_BENCHMARK_COMPARISON_ACCEPTANCE.md`
  - `docs/handoffs/wave-033/QA_REPORT.md`
- `apps/` / `infra/` 변경: 없음 (확인함).

## 실행/검증
- 실행한 명령 및 결과:

```text
python3 -m json.tool docs/api/openapi-mvp6-3-draft.json > /dev/null && echo PARSE_OK
-> PARSE_OK

python3 <path/schema/enum assertion over openapi-mvp6-3-draft.json>
-> openapi 3.1.0 ; info.version 0.6.3-draft ; path_objects 4 ; operations 5 ; schemas 30
-> 4 benchmark path families: all OK
   /api/v1/projects/{project_id}/benchmark-comparisons            [get, post]
   /api/v1/benchmark-comparisons/{comparison_id}                  [get]
   /api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix [get]
   .../confusion-matrix/cells/{cell_id}/error-cases               [get]
-> enums OK with exact literals:
   BenchmarkComparisonGroupBy = MODEL/PROMPT_VERSION/ONTOLOGY_VERSION/DATASET_VERSION/PARSER_VERSION
   ComparisonComparabilityFlag = SAME_DATASET/DIFFERENT_DATASET_VERSION/DIFFERENT_DATASET/
                                 DIFFERENT_ONTOLOGY_VERSION/MISSING_METRIC
   ConfusionMatrixAxis = ENTITY_CLASS/RELATION_TYPE
   MetricDeltaStatus = IMPROVED/REGRESSED/UNCHANGED/NOT_COMPARABLE
   RunExclusionReason = NOT_TERMINAL_SUCCESS/DIFFERENT_PROJECT/RUN_NOT_FOUND/DUPLICATE_RUN_ID
-> 18 new schemas present (incl. BenchmarkComparisonCapabilities)
-> 3 amended FE-gap fields present:
   ConfusionMatrix.label_display_names / BenchmarkMetricRow.row_comparability_flags /
   BenchmarkComparison.capabilities
-> BenchmarkMutationGuard 4 keys all const:false
   (candidate_graph_mutated / published_graph_mutated / evaluation_run_started / gold_set_mutated)
-> reuse verbatim: EvaluationMetricName (8), EvaluationErrorType (8), EvaluationMetricStatus
-> __NONE__ and delta_epsilon present in doc

rg -n 'benchmark.compar|BenchmarkComparison|confusion.matrix|ConfusionMatrix|MVP6.3|mvp6.3' apps infra --glob '!**/node_modules/**'
-> no matches (exit 1): no MVP6.3 runtime implementation leaked

git diff --check
-> clean (exit 0)

git diff --check --no-index /dev/null docs/backlog/INT6_3_BENCHMARK_COMPARISON_ACCEPTANCE.md
-> clean (no whitespace errors)
```

- 실행하지 못한 검증: planning 문서 범위이므로 runtime OpenAPI export 비교,
  backend pytest/ruff, frontend build/smoke는 수행하지 않았다. MVP6.3 runtime
  route가 없으므로 R1–R10 runtime gate는 `NOT RUNNABLE`(설계상 정상).

## API/Enum/DTO 변경
- 변경 여부: 없음 (QA는 acceptance checklist + report 문서만 작성; runtime/
  OpenAPI/contract 변경 없음).
- 상세: Backend `BE6-023` draft가 확정한 enum/DTO를 검증만 했다.
- 영향받는 역할: 없음(검증 산출물). Wave34 implementation이 본 checklist를
  acceptance 기준으로 사용한다.

## Blocker
- 없음.
- 주의: 작업트리에 이전 wave/다른 역할의 modified·untracked 파일이 있다. QA는
  지정된 checklist + 본 보고서만 생성했고 다른 변경을 되돌리거나 덮어쓰지
  않았다. `apps/`/`infra/`는 건드리지 않았다.

## 남은 TODO
- Wave34(thin implementation 시): C12 persist-vs-compute 결정 freeze 후 R3
  list/GET-by-id round-trip을 결정적으로 만들고, R1–R10 runtime gate를 실제
  실행. cell_id 인코딩 구체화, capabilities/label_display_names 실제 채움 정책.

## 다른 역할에 전달할 내용
- PM: MVP6.3 P0 freeze는 4종 artifact가 합의하며 read-only 경계가 유지된다.
  Wave34 thin implementation 진입을 권고한다. Gold-set authoring/dataset
  revisioning/new run은 별도 wave로 유지.
- Backend: contract/OpenAPI는 PASS. Wave34에서 persist-vs-compute(C12)를 먼저
  freeze해야 list/GET-by-id round-trip(R3)이 결정적이 된다. mutation_guard는
  all-false const로 유지하고 `EvaluationMetricName`/`EvaluationErrorType`은
  verbatim reuse(rename 금지=breaking).
- Frontend: 10개 DTO gap 모두 해소 확인. labels는 ontology id +
  `label_display_names` map, metric-row flag는 `row_comparability_flags`,
  permission은 `capabilities` hint로 렌더. `__NONE__`/`NOT_COMPARABLE`/
  `NOT_APPLICABLE`는 first-class로, fabricated 숫자 금지.
- QA(Wave34): R1–R10 runtime gate를 실제 실행하고 mutation_guard all-false를
  live로 확인. MVP1–MVP6.2 regression additive-only 확인.

## 총괄에게 요청하는 결정
- Wave33 QA를 PASS(planning)로 승인하고 Wave34 MVP6.3 thin implementation을
  열어 달라.
- Wave34 진입 전 Backend persist-vs-compute(C12) 결정을 freeze해 list/GET-by-id
  round-trip 가정을 확정해 달라.

## 현재 판정
- PASS (planning). Runtime acceptance(R1–R10)는 설계상 `NOT RUNNABLE`.
- 권고: Wave34 MVP6.3 thin implementation.
