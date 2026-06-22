# Frontend Report - Wave 28

## 담당 범위
- backlog ID:
  - `FE6-001` Evaluation Studio IA/route
  - `FE6-002` Gold Set Manager mock/actual boundary
  - `FE6-003` Benchmark Dashboard metric cards/table
  - `FE6-004` Error Case Explorer
  - `FE6-005` MVP6 API types/client/mocks
- 작업 경로:
  - `apps/frontend/src/pages/EvaluationDatasetsPage.tsx`
  - `apps/frontend/src/shared/api/types.ts`
  - `apps/frontend/src/shared/api/client.ts`
  - `apps/frontend/src/shared/api/queries.ts`
  - `apps/frontend/src/shared/mocks/mvp6Fixtures.ts`
  - `apps/frontend/src/shared/api/mvp6Mock.test.ts`
  - `apps/frontend/scripts/mvp6-mock-route-smoke.mjs`
  - `apps/frontend/package.json`

## 완료한 작업
- 기존 `EvaluationDatasetsPage`를 확장해 MVP6.1 P0 흐름을 한 화면에서 확인할 수 있게 했다:
  `dataset -> sample -> gold entity/relation -> deterministic run -> metrics -> error cases`.
- PM 계약의 P0 DTO/enum을 TypeScript 타입에 추가했다.
- MVP6.1 mock fixtures를 추가해 dataset, sample, gold entity, gold relation, deterministic run, metrics, error cases를 고정 데이터로 제공했다.
- API client와 TanStack Query hook을 PM endpoint surface 기준으로 연결했다.
- metric card/table에 `ENTITY/RELATION` precision, recall, F1, relation direction accuracy, evidence match rate, formula, numerator/denominator, `NOT_APPLICABLE` 상태를 표시했다.
- Error Case Explorer에 `error_type`, sample, `comparison_summary`, gold evidence, candidate evidence, `candidate_ref`를 표시했다.
- 기존 project-scoped route를 사용했고, ID-bound detail route를 전역 LNB에 새로 노출하지 않았다.
- 후속 MVP6 테마 UI는 추가하지 않았다:
  active learning, governance, copilot/agent, connector/plugin, multi-tenant, real LLM benchmark, fine-tuning UI 없음.

## 변경 파일
- 수정:
  - `apps/frontend/src/pages/EvaluationDatasetsPage.tsx`
  - `apps/frontend/src/shared/api/types.ts`
  - `apps/frontend/src/shared/api/client.ts`
  - `apps/frontend/src/shared/api/queries.ts`
  - `apps/frontend/src/pages/PromptPerformancePage.tsx`
  - `apps/frontend/package.json`
- 생성:
  - `apps/frontend/src/shared/mocks/mvp6Fixtures.ts`
  - `apps/frontend/src/shared/api/mvp6Mock.test.ts`
  - `apps/frontend/scripts/mvp6-mock-route-smoke.mjs`
- 참고:
  - 작업트리에는 Admin/MVP5/Backend/Wave28 문서 등 다른 에이전트 또는 이전 작업으로 보이는 변경이 함께 존재한다. 기존 변경은 되돌리지 않았다.

## 실행/검증
- 실행한 명령:
  - `npm run test`
  - `npm run build`
  - `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `npm run smoke:mvp6:mock`
  - `git diff --check`
- 결과:
  - `npm run test`: `PASS`, 6 files / 13 tests passed. `mvp6Mock.test.ts` 포함.
  - `npm run build`: `PASS`, TypeScript checks and Vite build completed.
  - `npm run smoke:mvp6:mock`: `PASS`, artifact:
    `/tmp/ontology-mvp6-frontend-smoke/mvp6-mock-route-smoke.json`
  - `git diff --check`: `PASS`, 출력 없음.
- 실행하지 못한 검증:
  - `smoke:mvp6:actual`은 만들지 않았다. 이번 마무리는 사용자 지시에 따라 P0 mock-first route/API 계약과 build 가능한 최소 상태로 제한했다.

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
  - 추가/확장 TypeScript DTO:
    - `EvaluationDatasetCreateRequest`
    - `EvaluationSample`, `EvaluationSampleCreateRequest`
    - `GoldEvidenceRef`
    - `GoldEntity`, `GoldEntityCreateRequest`
    - `GoldRelation`, `GoldRelationCreateRequest`
    - `EvaluationRunCreateRequest`
    - `EvaluationMetric`
    - `EvaluationErrorCase`
  - 추가/확장 enum:
    - `EvaluationSampleKind`: `SOURCE_SEGMENT`, `MANUAL_TEXT`, `TABLE_ROW`
    - `EvaluationRunMode`: `DETERMINISTIC_MOCK`
    - `EvaluationRunStatus`: 기존 `SUCCESS` 호환 유지 + PM 계약 `SUCCEEDED` 추가
    - `EvaluationMetricStatus`: `MEASURED`, `NOT_APPLICABLE`
    - `EvaluationMetricName`: PM P0 8개 metric
    - `EvaluationErrorType`: PM P0 8개 error type
  - 추가 client/query surface:
    - dataset create/list/detail
    - sample create/list
    - gold entity create/list
    - gold relation create/list
    - evaluation run create/list/detail
    - evaluation metrics list
    - evaluation error cases list/detail
- 영향받는 역할:
  - Backend: actual API mode는 PM 계약 endpoint path를 기준으로 호출한다. list 응답은 array 또는 `{ items }` wrapper를 모두 허용한다.
  - QA: `mvp6Mock.test.ts`와 `smoke:mvp6:mock`로 FE mock/route contract를 확인할 수 있다.

## Blocker
- 없음.
- actual backend smoke는 이번 FE P0 최소 마무리 범위에서 제외했다.

## 남은 TODO
- Backend actual endpoint가 고정된 뒤 필요하면 `smoke:mvp6:actual`을 별도 Wave29에서 추가한다.
- MVP6.1 P1인 dataset revision, import/export, multi-run comparison, confusion matrix는 아직 열지 않았다.

## 다른 역할에 전달할 내용
- PM:
  - MVP6.1 P0만 구현했다. 후속 MVP6 테마 UI는 열지 않았다.
- Backend:
  - FE client는 PM 계약의 `/api/v1/projects/{project_id}/evaluation-datasets`, `/api/v1/evaluation-datasets/{dataset_id}/samples`, gold entity/relation, evaluation run/metrics/errors endpoint를 호출한다.
  - `EvaluationRun.status`는 PM 계약의 `SUCCEEDED`를 표시하되, 기존 MVP4 prompt performance 화면 호환을 위해 `SUCCESS`도 타입에 남겼다.
- Frontend:
  - 전역 LNB에는 평가 detail route를 추가하지 않았다. 프로젝트 상세에서 기존 contextual route로 진입한다.
- QA:
  - 확인 포인트: `Evaluation Datasets` route에서 `MVP6.1`, `DETERMINISTIC_MOCK`, `Gold Set Manager`, `Benchmark metrics`, `NOT_APPLICABLE`, `Error Case Explorer`, `WRONG_RELATION_DIRECTION` marker가 smoke로 검증된다.

## 총괄에게 요청하는 결정
- Wave28 FE는 MVP6.1 P0 mock-first UI/API 계약 기준으로 닫고, actual API route smoke는 Backend/QA와 함께 Wave29 hardening 후보로 둘지 결정해 달라.

## 현재 판정
- PASS
