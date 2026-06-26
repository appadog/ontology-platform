# Backend Report - Wave 33

## 담당 범위
- backlog ID: `BE6-023` (MVP6.3 Benchmark Comparison / Confusion Matrix
  contract draft + OpenAPI planning artifact; theme `PM6-017`, Frontend
  `FE6-022`, QA `INT6-021`). Contract-first planning only.
- 작업 경로:
  - `docs/api/MVP6_3_BENCHMARK_COMPARISON_API_CONTRACT_DRAFT.md` (검증 + 최소 보강)
  - `docs/api/openapi-mvp6-3-draft.json` (검증 + 최소 보강)
  - `docs/handoffs/wave-033/BACKEND_REPORT.md` (본 보고서)

## 완료한 작업
- 이전 run이 작성한 두 산출물(contract draft ~29KB, OpenAPI 3.1.0 `0.6.3-draft`)을
  VERIFY/FINALIZE했다. 처음부터 재작성하지 않았다.
- 두 산출물의 내부 정합성을 확인했다: enum/DTO 이름, required 필드, 예시 JSON이
  서로 일치하고 PM brief(`MVP6_3_BENCHMARK_COMPARISON_BRIEF.md`)·ADR 0009와
  합치한다.
- additivity를 확인했다: OpenAPI artifact는 **benchmark-only standalone** planning
  파일이다. 4개 path objects 전부 `/...benchmark-comparisons/*`이고 MVP1–MVP6.2
  path/schema를 redefine·rename·이동하지 않는다(`openapi-mvp6-2-draft.json`와 같은
  per-MVP draft 패턴). superset이 아니라 disjoint-additive다.
- 기존 frozen MVP6.1 metric name/enum(`EvaluationMetricName` 8개,
  `EvaluationErrorType`, `EvaluationMetricStatus`)을 verbatim 재사용했다. rename
  없음(=breaking 회피). 새 metric name 도입 없음.
- Frontend가 flag한 **10개 DTO gap**을 draft+OpenAPI에 대조해, 7개는 이미 해소되어
  있음을 확인하고 3개는 최소 additive 보강을 했다(아래 "실행/검증" 표 참조).
- parse·whitespace 검증을 보강 후 재실행했다.

## 변경 파일
- 수정(이전 run이 생성, 이번에 finalize):
  - `docs/api/MVP6_3_BENCHMARK_COMPARISON_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp6-3-draft.json`
- 생성:
  - `docs/handoffs/wave-033/BACKEND_REPORT.md`
- `apps/` / `infra/` 변경: 없음 (확인함).

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp6-3-draft.json > /dev/null` → `PARSE_OK`
  - OpenAPI metadata 추출(openapi/version/path·schema count, 신규 필드 존재 확인)
  - `git diff --check` (tracked) → 출력 없음(clean)
  - `git diff --check --no-index /dev/null <각 산출물>` whitespace grep → none
  - `git status --porcelain | grep apps/\|infra/` → 변경 없음
- 결과:
  - `PASS`: OpenAPI parse 성공.
  - `PASS`: `openapi` `3.1.0`, `info.version` `0.6.3-draft`,
    **paths 4 (path objects; 5 operations)**, **schemas 30**(보강 전 29).
  - `PASS`: `git diff --check` 및 신규 산출물 no-index whitespace 확인 출력 없음.
  - `PASS`: apps/infra 무변경.

### 10개 Frontend DTO gap 처리 결과
| # | FE gap | 상태 | 근거 / 보강 |
|---|---|---|---|
| 1 | delta-status enum + `NOT_COMPARABLE` 시 `delta:null` | ANSWERED | `MetricDeltaStatus` enum 존재; `BenchmarkMetricCell.delta` nullable; 예시에서 `NOT_COMPARABLE` 시 `delta:null` |
| 2 | per-run metric 엔트리 안정 `run_id` 키 | ANSWERED | `BenchmarkMetricRow.per_run[]` = array of `BenchmarkMetricCell`, 각 cell에 required `run_id`(array+run_id 키, map 아님) |
| 3 | `contributing_error_case_ref` 형태 + pagination | ANSWERED | `ConfusionCellErrorCaseRef`=`{cell_id,error_case_count}`; drill endpoint `limit`/`cursor`+`next_cursor` |
| 4 | `cell_id` 형성 규칙 + URL-safe | ANSWERED | draft: deterministic·opaque·URL-safe, axis+gold+candidate 인코딩, raw ontology id URL 미노출 |
| 5 | `__NONE__` 리터럴 위치(ontology id 미노출) | ANSWERED | labels/cell label 설명에 `__NONE__` sentinel 명시, 저장 ontology id 아님 |
| 6 | labels id vs display name + display-name map | **AMENDED** | label은 ontology id로 명시, `ConfusionMatrix.label_display_names`(`{id:display}`) optional map 추가(draft+OpenAPI). 예시도 id로 정정 |
| 7 | comparability flag granularity(metric-row 레벨) | **AMENDED** | `BenchmarkMetricRow.row_comparability_flags[]` 추가(required), `MISSING_METRIC`은 row 레벨; per-run/per-set/per-row 3단계 규칙 명문화 |
| 8 | `mutation_guard` 키명(MVP6.2 정렬) | ANSWERED | `BenchmarkMutationGuard` 4키 all-false `const:false`; MVP6.2 패턴(공유 3키 + 도메인 `gold_set_mutated`)과 정렬, brief가 지정한 키와 일치 |
| 9 | `SUCCESS` vs `SUCCEEDED` + `exclusion_reason` enum | ANSWERED | draft가 SUCCEEDED/SUCCESS 둘 다 terminal-success로 명시; `RunExclusionReason` enum 존재 |
| 10 | permission/capability hint 필드 | **AMENDED** | `BenchmarkComparison.capabilities`(`BenchmarkComparisonCapabilities`, optional, display-hint only, 서버측 403 enforce 유지) 추가 |

- 실행하지 못한 검증: 계약 문서 범위이므로 backend pytest/ruff/runtime OpenAPI
  export 비교/frontend build·smoke는 수행하지 않았다. runtime route가 없으므로
  실제 `/docs` export에 MVP6.3 path가 없는 것이 정상이다.

## API/Enum/DTO 변경
- 변경 여부: 있음, **문서 계약 + planning OpenAPI artifact 한정** (runtime/DB/migration/
  test 변경 없음, additive only).
- 상세:
  - 신규 enum(문서·planning): `BenchmarkComparisonGroupBy`,
    `ComparisonComparabilityFlag`, `ConfusionMatrixAxis`, `MetricDeltaStatus`,
    `RunExclusionReason`. 신규 `EvaluationMetricName` 없음.
  - 신규 DTO(문서·planning): `BenchmarkComparisonCreateRequest`,
    `BenchmarkComparison`, `BenchmarkComparisonRun`, `BenchmarkRunContext`,
    `BenchmarkMetricRow`, `BenchmarkMetricCell`, `BenchmarkExcludedRun`,
    `ComparabilitySummary`, `BenchmarkMutationGuard`,
    `BenchmarkComparisonSummary`, `BenchmarkComparisonListResponse`,
    `ConfusionMatrix`, `ConfusionMatrixCell`, `ConfusionMatrixTotals`,
    `ConfusionMatrixLabelCount`, `ConfusionCellErrorCaseRef`,
    `ConfusionCellErrorCasesResponse`, + 이번에 추가한
    `BenchmarkComparisonCapabilities`.
  - 이번 보강(additive, 비파괴): `BenchmarkMetricRow.row_comparability_flags`,
    `ConfusionMatrix.label_display_names`(optional), `BenchmarkComparison.capabilities`(optional)
    및 신규 `BenchmarkComparisonCapabilities` schema. 기존 필드 rename/삭제 없음.
  - 기존 MVP6.1 shape(`EvaluationRun`/`EvaluationMetric`/`EvaluationErrorCase`/
    `EvaluationCandidateRef`/`EvaluationDimensions`)는 verbatim 재사용/`$ref`,
    redefine 없음.
- 영향받는 역할:
  - Frontend(`FE6-022`): 10개 gap 모두 draft에서 해소됨. id-vs-display는
    `label_display_names` map으로, metric-row flag는 `row_comparability_flags`로,
    permission은 `capabilities` hint로 렌더 가능. id는 ontology id, 표시명은 map 사용.
  - QA(`INT6-021`): planning artifact 정합성·additivity·leakage 검증. 잔여 항목은
    Backend의 persistence(persist vs on-the-fly) 결정이 Wave34로 남는 것뿐.

## Blocker
- 없음.
- 주의: 작업트리에 이전 wave/다른 역할의 modified·untracked 파일이 있다. Backend는
  지정된 BE6-023 산출물 2개와 본 보고서만 편집/생성했고 다른 변경을 되돌리거나
  덮어쓰지 않았다. `git diff --check`는 tracked 기준이므로 신규 untracked 산출물은
  no-index whitespace 확인을 별도 수행했다.

## 남은 TODO
- Backend(Wave34 implementation 시): comparison object **persist vs
  compute-on-the-fly** 결정(list/GET-by-id round-trip이 persistence를 함의),
  `cell_id` 인코딩 구체화, `capabilities`/`label_display_names` 실제 채움 정책,
  cell drill `limit` 기본값(현재 50) 확정.
- Frontend(`FE6-022`): 10개 gap 해소를 반영해 confusion matrix(id+display map),
  metric-row flag, capability 기반 액션 disable 상태를 요구사항에 반영.
- QA(`INT6-021`): planning artifact 4종 정합성, additivity, runtime leakage 부재,
  10개 gap 해소를 acceptance checklist에 반영.

## 다른 역할에 전달할 내용
- PM: MVP6.3 Backend 계약은 read-only/additive 경계를 유지했다. 새 run 실행, LLM
  호출, gold-set/dataset write, graph mutation 없음. `mutation_guard` all-false.
- Backend(후속): 모든 endpoint는 additive·read-only·project-scoped. `POST
  .../benchmark-comparisons`는 read-aggregation builder이며 persist하더라도
  analysis artifact + all-false guard. `EvaluationMetricName` 재사용, 새 metric
  금지.
- Frontend: `delta`는 `NOT_COMPARABLE` 시 null. `labels[]`/`gold_label`/
  `candidate_label`는 ontology id이고 표시명은 `label_display_names` map 사용.
  `__NONE__`는 "(no match)"로 렌더, ontology id로 노출 금지. metric-row
  `MISSING_METRIC`은 `row_comparability_flags`로 표시. `capabilities`는 display
  hint일 뿐 서버측 403 enforce 유지.
- QA: parse 대상은 `docs/api/openapi-mvp6-3-draft.json`(standalone planning,
  actual backend export 비교 대상 아님). persistence 정책은 Wave34 결정이므로
  checklist에 list/GET-by-id round-trip 가정 여부를 명시 요청.

## 총괄에게 요청하는 결정
- Wave33 Backend contract draft를 PASS로 승인하고 QA(`INT6-021`)가 이 계약 기준으로
  acceptance checklist를 작성하도록 허용해 달라.
- Wave34 thin implementation 진입 전, comparison persistence(persist vs
  on-the-fly) 정책을 QA checklist 결과와 함께 freeze해 달라.

## 현재 판정
- PASS
