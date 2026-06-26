# Frontend Report - Wave 33

## 담당 범위
- backlog ID: `FE6-022` (MVP6.3 Benchmark Comparison / Confusion Matrix UX/API 요구사항, contract-first planning only)
- 작업 경로:
  - `docs/pm/MVP6_3_FRONTEND_UX_REQUIREMENTS.md` (생성)
  - `docs/handoffs/wave-033/FRONTEND_REPORT.md` (본 보고서)

## 완료한 작업
- Benchmark Comparison UX/API 요구사항 문서를 작성했다. 코드(route/component/type/mock/smoke) 변경 없음 — planning only.
- route/IA placement을 확정했다: project-scoped, 기존 MVP6.1 Evaluation surface에 contextual. global LNB에 ID-bound page 추가 없음. 부모 라우트 `/projects/{projectId}/benchmark-comparisons`, 진입은 Evaluation Datasets 페이지의 `Prompt performance` 옆 `Compare runs` 액션.
- screen flow를 5개 surface로 문서화: (1) run selector + baseline/group-by builder, (2) side-by-side metric comparison + delta-status badge, (3) comparability warning band, (4) confusion matrix(axis toggle), (5) cell drilldown -> contributing error cases.
- first-class loading / empty(no runs, not-enough-runs<2, no metrics, empty matrix, empty cell) / error / permission-limited / comparability-flagged / not-comparable / stale state를 정의했다.
- comparability-warning UX: `SAME_DATASET`/`DIFFERENT_DATASET_VERSION`/`DIFFERENT_DATASET`/`DIFFERENT_ONTOLOGY_VERSION`/`MISSING_METRIC` flag를 set-level band + per-run badge로 표시, false apples-to-apples 비교 암시 금지.
- confusion matrix sparse/empty bucket은 `NOT_APPLICABLE`(N/A, 가짜 0%/100% 금지), `__NONE__`는 display sentinel(false-pos/false-neg)로만 렌더, ontology id로 노출 금지.
- delta status 시각화(`IMPROVED`/`REGRESSED`/`UNCHANGED`/`NOT_COMPARABLE`)를 톤/부호/카피 규칙으로 정의. `NOT_COMPARABLE`은 숫자 delta 없이 사유 표기.
- 모든 카피에서 model selection/autonomous publish/policy enforcement/new run/LLM 호출/metric-triggered action 암시 금지를 명시.
- 기존 MVP6.1 타입(`EvaluationRun`/`EvaluationMetric`/`EvaluationErrorCase`/`EvaluationCandidateRef`/`EvaluationMetricName`/`EvaluationErrorType`/`EvaluationRunStatus`/`EvaluationMetricStatus`)의 정확한 필드명을 `apps/frontend/src/shared/api/types.ts`에서 확인해 verbatim 재사용으로 명시했다.

## 변경 파일
- 생성: `docs/pm/MVP6_3_FRONTEND_UX_REQUIREMENTS.md`
- 생성: `docs/handoffs/wave-033/FRONTEND_REPORT.md`
- `apps/` 하위 코드 변경 없음.

## 실행/검증
- 실행한 명령: `git diff --check`
- 결과: PASS (whitespace/conflict 에러 없음).
- 실행하지 못한 검증: 없음(planning 문서 범위). Backend OpenAPI draft가 아직 없어 필드/enum 명 대조는 PM brief 기준으로만 수행.

## API/Enum/DTO 변경
- 변경 여부: 없음(runtime). 문서상 요구하는 enum/DTO는 PM brief를 따른다.
- 상세: 신규 enum `BenchmarkComparisonGroupBy`, `ComparisonComparabilityFlag`, `ConfusionMatrixAxis`, metric delta status(이름 미정). 신규 DTO `BenchmarkComparison`(req/resp), `ConfusionMatrix`(resp), all-false `mutation_guard`. 기존 MVP6.1 필드 rename 요구 없음.
- 영향받는 역할: Backend(`BE6-023`)가 OpenAPI draft에서 최종 확정, QA(`INT6-021`)가 정합성 검증.

## Blocker
- 없음(planning 완료 가능). 단, 의존성: Backend `BE6-023` contract draft + `openapi-mvp6-3-draft.json`이 작성 시점에 부재. 모든 필드/enum 명은 PM brief 기준 provisional이며 Wave34 구현 전 export된 draft와 재대조 필요.

## 남은 TODO (DTO gaps for Backend/QA)
1. delta-status enum 타입명 + 필드명 + `NOT_COMPARABLE` 시 `delta: null` freeze.
2. `metric_rows[]` per-run 엔트리에 안정적 `run_id` 키(map vs array) freeze.
3. `contributing_error_case_ref` 형태(cell id / query token / inline id list) + cell endpoint pagination freeze.
4. `cells[].id`(`cell_id`) 형성 규칙 + URL-safe(`__NONE__`/임의 라벨) freeze.
5. `__NONE__`가 `labels[]` 및 `gold_label`/`candidate_label`에 리터럴 `"__NONE__"`로만 등장, ontology id로 미노출 확인.
6. `labels[]`/`gold_label`/`candidate_label`가 id인지 display name인지 + 선택적 display-name map.
7. `comparability_flags[]` 위치(per-run + per-set, `MISSING_METRIC`은 metric-row 레벨) 확정.
8. `mutation_guard` 정확한 키명(MVP6.2 all-false 패턴 정렬).
9. eligibility status(`SUCCESS` vs `SUCCEEDED`) 및 `excluded_runs[].exclusion_reason`의 enum 여부.
10. permission/capability hint 필드 노출 여부.

## 다른 역할에 전달할 내용
- PM: route/IA를 project-scoped contextual로 두고 global LNB 신규 entry는 추가하지 않는 결정을 따랐다. 위 DTO gap 10건은 Backend freeze 필요.
- Backend(`BE6-023`): 위 "남은 TODO" 10건을 OpenAPI draft에서 명시적으로 freeze. 기존 MVP6.1 필드는 verbatim echo(rename 금지=breaking). `mutation_guard` all-false, `delta` `NOT_COMPARABLE` 시 null 권장.
- QA(`INT6-021`): planning artifact 4종이 P0 flow/enum/state/source artifact/safety boundary/exclusion에 합의하는지, 위 gap이 Backend draft에서 해소되는지, `apps/`/`infra/`에 runtime leakage 없는지 검증.
- Frontend: Wave34 구현 시 confusion matrix는 수평 스크롤 컨테이너(`CompactTable` overflow 패턴)로 body overflow 방지; 모든 상태/카피 가드 준수.

## 총괄에게 요청하는 결정
- Wave33 FE planning을 PASS로 승인하고 Wave34 thin implementation은 Backend `BE6-023` draft 작성 + 위 10개 gap freeze 이후로 게이트해 달라.
- MVP6.3을 read-only Benchmark Comparison으로 유지(no model selection/publish/policy/new run)하는 경계를 확인해 달라.

## 현재 판정
- PASS (planning only; Backend contract draft 부재는 의존성으로 문서화, blocker 아님)
