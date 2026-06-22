# QA / Integration Report - Wave 28

## 담당 범위
- backlog ID:
  - `INT6-001` MVP6.1 roadmap alignment
  - `INT6-002` Backend contract/runtime smoke
  - `INT6-003` Frontend mock/API contract consistency
  - `INT6-004` Gold Set to EvaluationRun happy path
  - `INT6-005` MVP1-MVP5 invariant regression guard
- 작업 경로:
  - `docs/handoffs/wave-028/QA_REPORT.md`

## 완료한 작업
- 필수 운영 문서, Wave28 order, PM/Backend/Frontend report, MVP6 roadmap, MVP6 prep/backlog/acceptance checklist를 확인했다.
- `AGENTS.md`와 `docs/handoffs/wave-028/NEXT_ORDERS.md`가 `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`를 참조하는 것을 확인했다.
- PM 범위가 MVP6.1 Theme 1 Gold Set / Benchmark Studio P0 thin slice로 제한되어 있고, real LLM benchmark, fine-tuning, active learning, governance, copilot/agent, connector/plugin, multi-tenant runtime이 제외된 것을 확인했다.
- Backend MVP6.1 endpoint, DTO/enum, metric `status/value`, error case context, OpenAPI artifact, published graph non-mutation guard를 검토했다.
- Frontend MVP6.1 route, mock fixtures, API types/client/query hooks, route smoke, LNB 노출 범위를 검토했다.
- deterministic happy path는 backend focused pytest와 frontend mock route smoke로 검증했다:
  `create dataset -> add sample -> add gold entity/relation -> run DETERMINISTIC_MOCK -> metrics/errors`.
- MVP1-MVP5 invariant regression guard는 MVP4 focused regression, route/LNB inspection, published graph/review/publish non-mutation test로 확인했다.

## 변경 파일
- 생성:
  - `docs/handoffs/wave-028/QA_REPORT.md`
- 코드 변경:
  - 없음. 기존 작업트리 변경은 되돌리지 않았다.

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp6_evaluation_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `python -m json.tool docs/api/openapi-mvp6-draft.json`
  - `python3 -m json.tool docs/api/openapi-mvp6-draft.json`
  - `node - <<'NODE' ... OpenAPI required MVP6 path/schema/enum check ... NODE`
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && npm run smoke:mvp6:mock`
  - `lsof -ti tcp:5173`
  - `kill 50100`
  - `git diff --check`
- 결과:
  - `PASS`: MVP6 backend focused pytest `4 passed in 1.52s`
  - `PASS`: MVP4 backend regression pytest `7 passed in 2.22s`
  - `PASS`: backend ruff `All checks passed!`
  - `NOT RUNNABLE / ENV`: `python` alias 없음, `zsh:1: command not found: python`
  - `PASS`: `python3 -m json.tool docs/api/openapi-mvp6-draft.json` JSON parse 성공
  - `PASS`: Node OpenAPI 구조 검사 성공, OpenAPI `3.1.0`, version `0.1.0`, `123` paths, `276` schemas
  - `PASS`: frontend test `6 files / 13 tests passed`
  - `PASS`: frontend build 성공, Vite build completed
  - `PASS`: `npm run smoke:mvp6:mock`, artifact `/tmp/ontology-mvp6-frontend-smoke/mvp6-mock-route-smoke.json`, screenshot `/tmp/ontology-mvp6-frontend-smoke/evaluation-datasets-mvp6.png`
  - `PASS`: `git diff --check` 출력 없음
- 실행하지 못한 검증:
  - `smoke:mvp6:actual`은 스크립트가 없다. FE report가 mock-first P0 closure를 명시했고, backend actual API는 focused pytest로 독립 검증했으므로 이번 Wave28 판정에서는 blocker가 아니라 Wave29/P1 hardening follow-up으로 분류한다.
  - Docker/PostgreSQL compose smoke와 full backend pytest는 기존 P1 환경/범위 밖이라 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
  - Backend OpenAPI에 MVP6.1 P0 paths가 존재함을 확인했다:
    - `/api/v1/projects/{project_id}/evaluation-datasets`
    - `/api/v1/evaluation-datasets/{dataset_id}`
    - `/api/v1/evaluation-datasets/{dataset_id}/samples`
    - `/api/v1/evaluation-datasets/{dataset_id}/gold-entities`
    - `/api/v1/evaluation-datasets/{dataset_id}/gold-relations`
    - `/api/v1/projects/{project_id}/evaluation-runs`
    - `/api/v1/evaluation-runs/{run_id}`
    - `/api/v1/evaluation-runs/{run_id}/metrics`
    - `/api/v1/evaluation-runs/{run_id}/errors`
    - `/api/v1/evaluation-error-cases/{error_case_id}`
  - Enum 확인:
    - `EvaluationDatasetStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`
    - `EvaluationSampleKind`: `SOURCE_SEGMENT`, `MANUAL_TEXT`, `TABLE_ROW`
    - `EvaluationRunMode`: `DETERMINISTIC_MOCK`
    - `EvaluationRunStatus`: `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`
    - `EvaluationMetricStatus`: `MEASURED`, `NOT_APPLICABLE`
    - `EvaluationErrorType`: PM P0 8개 literal 일치
  - Metric DTO는 `value`, `numerator`, `denominator`, `formula`, `status`, `computed_at`을 노출하고, zero denominator는 `status: NOT_APPLICABLE`, `value: null`로 pytest 검증됐다.
  - ErrorCase DTO는 `candidate_ref`, `comparison_summary`, `gold_evidence`, `candidate_evidence`, `sample_id`를 노출한다.
  - Frontend 타입/fixture/client/query는 P0 read/write flow와 mock smoke 기준으로 동작한다. 단, `candidate_ref`의 TypeScript 타입은 backend `EvaluationCandidateRef` 전체보다 좁게 모델링되어 있어 actual UI 상세 확장 시 Wave29에서 보강하는 것이 좋다.
- 영향받는 역할:
  - Backend: process-local runtime store는 Wave28 thin slice로 허용 가능하나 durable DB/Alembic persistence는 P1/P2 follow-up.
  - Frontend: actual API client path는 있으나 `smoke:mvp6:actual` harness 추가와 `candidate_ref` nested type 정합 보강을 Wave29 후보로 권장.
  - QA: 다음 wave에서 actual frontend API route smoke를 추가하면 INT6 regression evidence가 더 강해진다.

## Blocker
- 없음.
- Scope leak 없음: Wave28 신규 MVP6 구현에서 real LLM benchmark, fine-tuning, active learning, ontology governance workflow, copilot/agent runtime, connector/plugin SDK, multi-tenant runtime 추가를 발견하지 못했다.
- Published graph mutation 없음: `tests/test_mvp6_evaluation_api.py`가 published graph version/entity/relation, publish job, review task/decision count와 current pointer를 before/after로 비교한다.

## 남은 TODO
- P1 / Wave29:
  - `smoke:mvp6:actual` 추가 후 backend actual API와 frontend route를 cross-process로 검증한다.
  - Frontend `candidate_ref` 타입을 backend `EvaluationCandidateRef`의 `sample_id`, ontology ids, label/value, relation endpoint, evidence 필드까지 반영한다.
  - Backend process-local store를 durable DB/Alembic 모델로 승격할지 PM이 별도 freeze한다.
- P2:
  - full backend pytest, Docker/PostgreSQL compose smoke, formal Playwright suite는 기존 환경/tooling follow-up으로 유지한다.

## 다른 역할에 전달할 내용
- PM:
  - Wave28 P0는 MVP6.1 Theme 1만 열린 상태로 검증됐다. MVP6.2+ 테마는 계속 별도 freeze가 필요하다.
  - actual frontend API smoke 부재는 이번 wave PASS를 막지 않는 P1 hardening으로 판단했다.
- Backend:
  - MVP6 focused tests와 MVP4 regression은 PASS다.
  - durable persistence/Alembic은 이번 P0 blocker가 아니며, process-local store는 thin slice 기준으로 허용 가능하다.
- Frontend:
  - Mock-first UI, route smoke, tests/build는 PASS다.
  - LNB에는 ID-bound evaluation route가 추가되지 않았고, project contextual route로만 진입한다.
  - Wave29에서 actual API smoke와 nested `candidate_ref` 타입 보강을 권장한다.
- QA:
  - 다음 QA는 `smoke:mvp6:actual`이 생기면 INT6-003 evidence를 cross-process actual mode까지 확장한다.

## 총괄에게 요청하는 결정
- Wave28 MVP6.1 thin slice는 PASS로 받아도 된다.
- Wave29는 MVP6.1 확장 전에 actual frontend API smoke와 DTO nested detail 보강을 targeted hardening으로 먼저 닫는 것을 권장한다.
- MVP6.2 이상, durable DB persistence, real LLM benchmark provider는 별도 PM freeze 전까지 열지 않는 결정을 유지해 달라.

## 현재 판정
- PASS
