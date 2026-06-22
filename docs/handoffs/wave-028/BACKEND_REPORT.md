# Backend Report - Wave 28

## 담당 범위
- backlog ID:
  - `BE6-001` Evaluation dataset schemas/API
  - `BE6-002` Gold entity/relation schemas/API
  - `BE6-003` Deterministic evaluation run service
  - `BE6-004` Metric and error-case read API
  - `BE6-005` OpenAPI export/update
- 작업 경로:
  - `apps/backend/app/modules/evaluation/`
  - `apps/backend/app/api/router.py`
  - `apps/backend/app/modules/mvp4/router.py`
  - `apps/backend/tests/test_mvp6_evaluation_api.py`
  - `docs/api/openapi-mvp6-draft.json`
  - `docs/handoffs/wave-028/BACKEND_REPORT.md`

## 완료한 작업
- PM 계약의 MVP6.1 P0 endpoint surface를 additive로 구현했다.
- `apps/backend/app/modules/evaluation/`에 MVP6.1 전용 schema, service, router를 추가했다.
- 저장소는 외부 인프라 없이 deterministic process-local runtime store로 제한했다.
- `POST /api/v1/projects/{project_id}/evaluation-runs`는 `DETERMINISTIC_MOCK`만 허용하는 P0 계약에 맞춰 deterministic candidate-vs-gold 비교로 metrics/errors를 산출한다.
- Metric DTO는 `value`, `numerator`, `denominator`, `formula`, `status`, `computed_at`을 노출한다.
- denominator가 0인 metric은 `status: NOT_APPLICABLE`, `value: null`로 반환한다.
- ErrorCase DTO는 candidate-vs-gold context, sample/evidence context, `error_type`을 포함한다.
- evaluation operation이 review task, review decision, publish job, published graph version/entity/relation을 mutate하지 않는 focused test guard를 추가했다.
- 기존 MVP4 evaluation dataset/run path와 겹치는 FastAPI route는 MVP6 router를 먼저 등록하고, MVP4 overlapping route만 OpenAPI에서 숨겼다. MVP4 compatibility regression은 focused test로 확인했다.
- `docs/api/openapi-mvp6-draft.json`을 생성했고 JSON parse 가능성을 확인했다.

## 변경 파일
- 생성: `apps/backend/app/modules/evaluation/__init__.py`
- 생성: `apps/backend/app/modules/evaluation/schemas.py`
- 생성: `apps/backend/app/modules/evaluation/service.py`
- 생성: `apps/backend/app/modules/evaluation/router.py`
- 수정: `apps/backend/app/api/router.py`
- 수정: `apps/backend/app/modules/mvp4/router.py`
- 생성: `apps/backend/tests/test_mvp6_evaluation_api.py`
- 생성: `docs/api/openapi-mvp6-draft.json`
- 생성: `docs/handoffs/wave-028/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp6_evaluation_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output ../../docs/api/openapi-mvp6-draft.json && .venv/bin/python -m json.tool ../../docs/api/openapi-mvp6-draft.json >/tmp/openapi-mvp6-draft.verify.json`
  - `git diff --check`
- 결과:
  - `PASS`: MVP6 focused pytest `4 passed in 1.38s`
  - `PASS`: MVP4 focused regression `7 passed in 1.90s`
  - `PASS`: ruff `All checks passed!`
  - `PASS`: OpenAPI export wrote `docs/api/openapi-mvp6-draft.json`; `json.tool` parse succeeded.
  - `PASS`: `git diff --check` 출력 없음.
- 실행하지 못한 검증:
  - 전체 backend pytest는 Wave28 P0 20분 마감 범위 밖이라 실행하지 않았다.
  - Docker/PostgreSQL compose smoke는 기존 환경/P1 follow-up 범위라 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
  - 신규 endpoint:
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
  - 신규/갱신 DTO:
    - `EvaluationDataset`
    - `EvaluationSample`
    - `GoldEvidenceRef`
    - `GoldEntity`
    - `GoldRelation`
    - `EvaluationRun`
    - `EvaluationMetric`
    - `EvaluationErrorCase`
  - enum:
    - 기존 `EvaluationDatasetStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`
    - 신규 `EvaluationSampleKind`: `SOURCE_SEGMENT`, `MANUAL_TEXT`, `TABLE_ROW`
    - 신규 `EvaluationRunMode`: `DETERMINISTIC_MOCK`
    - 신규 `EvaluationRunStatus`: `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`
    - 신규 `EvaluationMetricName`: `ENTITY_PRECISION`, `ENTITY_RECALL`, `ENTITY_F1`, `RELATION_PRECISION`, `RELATION_RECALL`, `RELATION_F1`, `RELATION_DIRECTION_ACCURACY`, `EVIDENCE_MATCH_RATE`
    - 신규 `EvaluationMetricStatus`: `MEASURED`, `NOT_APPLICABLE`
    - 신규 `EvaluationErrorType`: `MISSING_ENTITY`, `EXTRA_ENTITY`, `WRONG_ENTITY_CLASS`, `MISSING_RELATION`, `EXTRA_RELATION`, `WRONG_RELATION_TYPE`, `WRONG_RELATION_DIRECTION`, `EVIDENCE_MISMATCH`
- 영향받는 역할:
  - Frontend: `docs/api/openapi-mvp6-draft.json` 기준으로 MVP6.1 types/client/mock/UI를 맞출 수 있다.
  - QA: `INT6-002`, `INT6-004`, `INT6-005` backend/API 검증에 사용할 수 있다.
  - PM: P0 thin slice 외 MVP6 테마는 열지 않았다.

## Blocker
- 없음.
- 현재 workspace에는 Wave28 이전 또는 다른 역할 작업으로 보이는 modified/untracked 파일이 다수 있다. Backend는 소유 범위 파일만 수정했고 기존 변경은 되돌리지 않았다.

## 남은 TODO
- Frontend:
  - MVP6.1 actual API 타입/client/mock/UI를 `docs/api/openapi-mvp6-draft.json`에 맞춰 구현한다.
- QA:
  - API happy path와 OpenAPI artifact, invariant guard를 독립 검증한다.
- Backend P1 이후:
  - dataset revision history, gold evidence standalone object, model/prompt comparison, confusion matrix, real LLM benchmark execution은 별도 PM freeze 후 진행한다.

## 다른 역할에 전달할 내용
- PM:
  - Wave28 Backend 구현은 MVP6.1 Gold Set / Benchmark Studio P0 thin slice만 포함한다.
  - real LLM benchmark, fine-tuning, active learning, governance, copilot/agent, connector/plugin, multi-tenant runtime은 구현하지 않았다.
- Backend:
  - process-local runtime store이므로 dev/test deterministic happy path 용도다. durable DB 모델/Alembic은 P1 이후 별도 결정이 필요하다.
  - MVP4 overlapping routes는 MVP6 router가 runtime/OpenAPI를 담당하고, MVP4 dataset version/golden-items compatibility routes는 유지했다.
- Frontend:
  - `POST /evaluation-runs` 요청에는 `dataset_id`, `run_mode: DETERMINISTIC_MOCK`, `ontology_version_id`, `prompt_version_id`, `model_name`, `parser_version`를 보내면 된다.
  - `model_run_id`를 생략하면 backend가 deterministic mock run id를 생성한다.
  - metric `status: NOT_APPLICABLE` + `value: null`은 0점이 아니라 미측정/분모 없음 상태로 표시해야 한다.
- QA:
  - `tests/test_mvp6_evaluation_api.py`가 create dataset -> add sample -> add gold entities/relations -> run -> metrics/errors -> non-mutation guard를 검증한다.
  - published graph/review/publish mutation guard는 DB count와 current pointer 비교로 확인했다.

## 총괄에게 요청하는 결정
- Wave28에서는 현재 P0 thin slice를 기준으로 QA 검증을 진행해도 된다.
- durable DB persistence, Alembic migration, real benchmark provider, comparison dashboard backend는 Wave29 이후 별도 PM freeze 없이는 열지 않는 결정을 유지해 달라.

## 현재 판정
- PASS
