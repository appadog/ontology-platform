# PM / Architecture Report - Wave 28

## 담당 범위

- backlog ID:
  - `PM6-001` MVP6.1 scope freeze
  - `PM6-002` Gold Set / Benchmark acceptance criteria
  - `PM6-003` Evaluation metric definitions
  - `PM6-004` MVP6 entry guardrails and exclusions
- 작업 경로:
  - `docs/pm/MVP6_PREP_BRIEF.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/backlog/INT6_MVP6_ACCEPTANCE.md`
  - `docs/handoffs/wave-028/PM_REPORT.md`

## 완료한 작업

- `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`를 MVP6 source of
  truth로 보고 Wave28 범위를 MVP6.1 Gold Set / Benchmark Studio P0 thin slice로
  제한했다.
- MVP6 전체 구현을 열지 않고 다음 happy path만 P0로 고정했다:
  `create dataset -> add sample -> add gold entity/relation -> run deterministic evaluation -> view metrics/errors`.
- Backend/Frontend가 같은 Wave28에서 얇은 구현을 시작해도 된다고 결정했다.
  단, 구현은 이 보고서와 `docs/pm/MVP6_PREP_BRIEF.md`의 P0 계약으로 제한한다.
- P0 API/DTO/enum 최소 계약을 `docs/pm/MVP6_PREP_BRIEF.md`에 명시했다.
- PM6/BE6/FE6/INT6 백로그를 P0/P1/P2로 분리해
  `docs/backlog/MVP6_DRAFT_BACKLOG.md`에 작성했다.
- MVP6.1 수용 체크리스트와 QA gate를
  `docs/backlog/INT6_MVP6_ACCEPTANCE.md`에 작성했다.
- 실제 LLM benchmark, fine-tuning, active learning, governance workflow,
  copilot/agent runtime, connector/plugin SDK, multi-tenant runtime은 Wave28
  제외로 명시했다.

## 변경 파일

- 생성: `docs/pm/MVP6_PREP_BRIEF.md`
- 생성: `docs/backlog/MVP6_DRAFT_BACKLOG.md`
- 생성: `docs/backlog/INT6_MVP6_ACCEPTANCE.md`
- 생성: `docs/handoffs/wave-028/PM_REPORT.md`

## 실행/검증

- 실행한 명령:
  - `git diff --check`
- 결과:
  - `PASS`: 출력 없음, whitespace/error 없음.
- 실행하지 못한 검증:
  - 없음. PM 문서 작업 범위라 런타임 테스트는 수행하지 않았다.

## API/Enum/DTO 변경

- 변경 여부: 있음
- 상세:
  - PM 문서상 MVP6.1 P0 최소 계약을 새로 고정했다. 아직 runtime code 또는
    OpenAPI artifact를 직접 변경하지 않았다.
  - 최소 endpoint surface:
    - `GET/POST /api/v1/projects/{project_id}/evaluation-datasets`
    - `GET /api/v1/evaluation-datasets/{dataset_id}`
    - `GET/POST /api/v1/evaluation-datasets/{dataset_id}/samples`
    - `GET/POST /api/v1/evaluation-datasets/{dataset_id}/gold-entities`
    - `GET/POST /api/v1/evaluation-datasets/{dataset_id}/gold-relations`
    - `GET/POST /api/v1/projects/{project_id}/evaluation-runs`
    - `GET /api/v1/evaluation-runs/{run_id}`
    - `GET /api/v1/evaluation-runs/{run_id}/metrics`
    - `GET /api/v1/evaluation-runs/{run_id}/errors`
    - `GET /api/v1/evaluation-error-cases/{error_case_id}`
  - 최소 DTO:
    - `EvaluationDataset`
    - `EvaluationSample`
    - `GoldEvidenceRef`
    - `GoldEntity`
    - `GoldRelation`
    - `EvaluationRun`
    - `EvaluationMetric`
    - `EvaluationErrorCase`
  - 최소 enum/status:
    - `EvaluationDatasetStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`
    - `EvaluationSampleKind`: `SOURCE_SEGMENT`, `MANUAL_TEXT`, `TABLE_ROW`
    - `EvaluationRunMode`: `DETERMINISTIC_MOCK`
    - `EvaluationRunStatus`: `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`
    - `EvaluationMetricStatus`: `MEASURED`, `NOT_APPLICABLE`
    - `EvaluationMetricName`: `ENTITY_PRECISION`, `ENTITY_RECALL`,
      `ENTITY_F1`, `RELATION_PRECISION`, `RELATION_RECALL`, `RELATION_F1`,
      `RELATION_DIRECTION_ACCURACY`, `EVIDENCE_MATCH_RATE`
    - `EvaluationErrorType`: `MISSING_ENTITY`, `EXTRA_ENTITY`,
      `WRONG_ENTITY_CLASS`, `MISSING_RELATION`, `EXTRA_RELATION`,
      `WRONG_RELATION_TYPE`, `WRONG_RELATION_DIRECTION`, `EVIDENCE_MISMATCH`
- 영향받는 역할:
  - Backend: 위 API/DTO/enum을 additive runtime/OpenAPI slice로 구현한다.
  - Frontend: 위 타입/fixture/client/UI state를 mock-first로 맞춘다.
  - QA: `INT6-*` 체크리스트로 contract/runtime/UI/invariant를 검증한다.

## Blocker

- 없음.
- 현재 작업 디렉터리에는 Wave28 이전 또는 다른 에이전트 변경으로 보이는
  다수의 untracked/modified 파일이 있다. PM은 요청받은 네 개 문서만
  생성했고 기존 변경은 되돌리지 않았다.

## 남은 TODO

- Backend:
  - PM 계약을 읽고 `BE6-001`~`BE6-005` P0 runtime/OpenAPI/tests를 구현한다.
- Frontend:
  - PM 계약과 Backend 실제 OpenAPI를 읽고 `FE6-001`~`FE6-005` mock/actual UI를
    구현한다.
- QA:
  - Backend/Frontend 보고 후 `INT6-001`~`INT6-005`를 검증한다.

## 다른 역할에 전달할 내용

- PM:
  - MVP6 전체가 아니라 MVP6.1 Theme 1만 열린 상태다.
  - Wave28 P0는 deterministic evaluation만이며, P1/P2는 별도 wave에서 다시
    freeze해야 한다.
- Backend:
  - 같은 wave 구현 시작 가능.
  - real LLM provider call 없이 `DETERMINISTIC_MOCK` run으로 metrics/errors를
    산출한다.
  - 모든 gold/error/run record는 evidence와 ontology/prompt/model/parser/run
    context를 보존해야 한다.
  - evaluation operation은 candidate review, publish, published graph를
    mutate하면 안 된다.
- Frontend:
  - 같은 wave 구현 시작 가능.
  - Evaluation/Benchmark는 stable top-level area로 둘 수 있으나 ID-bound detail
    route를 LNB에 평면 노출하지 않는다.
  - metric zero denominator는 `NOT_APPLICABLE`로 표시하고 측정값 0처럼 보이지
    않게 한다.
- QA:
  - `docs/backlog/INT6_MVP6_ACCEPTANCE.md`의 deterministic happy path를 기준으로
    검증한다.
  - MVP1-MVP5 invariant regression guard를 반드시 포함한다.

## 총괄에게 요청하는 결정

- Wave28 Backend/Frontend same-wave thin implementation을 승인 상태로 두었다.
  별도 PM 재승인은 필요하지 않다.
- MVP6.2 이상 테마는 Wave28에서 열지 않는 것으로 유지해 달라.

## 현재 판정

- PASS
