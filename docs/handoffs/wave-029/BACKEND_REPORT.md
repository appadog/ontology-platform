# Backend Report - Wave 29

## 담당 범위
- backlog ID:
  - `BE6-010` Actual smoke support
  - `BE6-011` Evaluation contract stability
- 작업 경로:
  - `apps/backend/app/modules/evaluation/`
  - `apps/backend/tests/test_mvp6_evaluation_api.py`
  - `docs/api/openapi-mvp6-draft.json`
  - `docs/handoffs/wave-029/BACKEND_REPORT.md`

## 완료한 작업
- Wave29 PM 결정에 따라 durable DB model/Alembic persistence를 구현하지 않고 process-local evaluation runtime store를 유지했다.
- MVP6.1 actual smoke가 같은 backend runtime에서 반복적으로 happy path를 만들 수 있는지 확인했다.
- 추가 production endpoint, seed/reset helper, script는 만들지 않았다. 현재 API가 actual smoke에 필요한 `create/list/detail/read metrics/errors` 흐름을 제공한다.
- `tests/test_mvp6_evaluation_api.py`에 actual smoke 지원 guard를 보강했다:
  - dataset create 후 project list와 dataset detail 조회;
  - sample/gold entity/gold relation list 조회;
  - run list/detail 조회와 ontology/prompt/model/parser context 확인;
  - entity/relation error case의 `candidate_ref` 세부 필드 확인;
  - OpenAPI runtime schema와 draft artifact의 `EvaluationCandidateRef` 필드 노출 확인.
- `EvaluationCandidateRef`가 `candidate_id`, `candidate_kind`, `sample_id`, `ontology_class_id`, `ontology_relation_id`, `label`, `normalized_value`, `source_gold_entity_id`, `target_gold_entity_id`, `evidence`를 노출하는 것을 확인했다.
- evaluation operation이 candidate review, publish job, published graph version/entity/relation, current published graph pointer를 mutate하지 않는 기존 guard를 유지했다.
- MVP6.2+ active learning, governance, agent, connector, multi-tenant, real LLM benchmark runtime은 추가하지 않았다.

## 변경 파일
- 수정:
  - `apps/backend/tests/test_mvp6_evaluation_api.py`
- 생성:
  - `docs/handoffs/wave-029/BACKEND_REPORT.md`
- 변경 없음:
  - `apps/backend/app/modules/evaluation/`
  - `apps/backend/scripts/`
  - `apps/backend/README.md`
  - `docs/api/openapi-mvp6-draft.json`

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp6_evaluation_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output /tmp/ontology-wave29-openapi-mvp6.json`
  - `cmp -s /tmp/ontology-wave29-openapi-mvp6.json docs/api/openapi-mvp6-draft.json`
  - `python3 -m json.tool docs/api/openapi-mvp6-draft.json`
  - `python3 -m json.tool /tmp/ontology-wave29-openapi-mvp6.json`
  - `git diff --check`
- 결과:
  - `PASS`: MVP6 focused pytest `4 passed`
  - `PASS`: MVP4 focused regression `7 passed`
  - `PASS`: ruff `All checks passed!`
  - `PASS`: OpenAPI temp export succeeded.
  - `PASS`: temp export and `docs/api/openapi-mvp6-draft.json` match by `cmp -s`; artifact update not needed.
  - `PASS`: OpenAPI JSON parse succeeded for both files.
  - `PASS`: `git diff --check` whitespace check passed.
- 실행하지 못한 검증:
  - Frontend `npm run smoke:mvp6:actual`은 Backend 역할 범위 밖이며 Frontend Wave29 작업 산출물이다.
  - Docker/PostgreSQL compose smoke는 기존 P1 environment/tooling follow-up이라 실행하지 않았다.
  - Durable DB/Alembic persistence smoke는 PM이 Wave29 제외로 결정했으므로 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - Runtime API, enum literal, DTO schema, OpenAPI artifact는 변경하지 않았다.
  - `EvaluationCandidateRef`의 현재 OpenAPI 노출 필드를 test guard로 고정했다.
  - process-local runtime store를 유지했다.
  - Backend actual smoke 지원을 위해 별도 reset/seed helper가 필요하지 않다고 판단했다.
- 영향받는 역할:
  - Frontend: actual smoke는 backend가 실행 중인 같은 프로세스에서 dataset/sample/gold/run을 직접 생성하고, 응답 ID로 detail/metrics/errors를 읽으면 된다.
  - QA: `EvaluationCandidateRef` DTO consistency와 published graph/review/publish non-mutation은 focused backend test로 재검증 가능하다.

## Blocker
- 없음.
- 주의:
  - 현재 작업트리에는 Wave28/Wave29 및 다른 역할의 modified/untracked 파일이 다수 있다. Backend는 지정된 소유 범위만 편집했고 기존 변경을 되돌리지 않았다.
  - process-local store는 backend process 재시작 시 evaluation artifact가 사라진다. Frontend actual smoke는 stale id에 의존하지 말고 매 실행마다 필요한 데이터를 생성해야 한다.

## 남은 TODO
- Frontend:
  - `npm run smoke:mvp6:actual`에서 실제 backend API를 대상으로 다음 흐름을 실행한다:
    `create dataset -> add sample -> add gold entity -> add gold relation -> run DETERMINISTIC_MOCK -> read run detail -> read metrics -> read errors`.
  - `EvaluationErrorCase.candidate_ref`는 Backend `EvaluationCandidateRef`와 같은 MVP6 전용 타입으로 모델링한다.
- QA:
  - `INT6-006`~`INT6-008` 기준으로 actual smoke, candidate_ref DTO consistency, MVP6.1 closeout recommendation을 검증한다.
- Backend P1/P2:
  - Durable DB/Alembic persistence, dataset revision history, real LLM benchmark, benchmark comparison/confusion matrix는 별도 PM freeze 전까지 열지 않는다.

## 다른 역할에 전달할 내용
- PM:
  - Wave29 Backend는 hardening-only로 완료했다. durable persistence는 구현하지 않았고 P1/P2 유지 결정을 따랐다.
- Backend:
  - 추가 production code나 helper는 필요하지 않았다. 현재 process-local API surface와 test guard를 유지하면 된다.
- Frontend:
  - `model_run_id`는 요청에서 생략 가능하며 backend가 `{run_id}-model-run` 형태로 생성한다.
  - actual smoke는 같은 backend process 안에서 생성한 응답 ID를 사용해야 한다.
  - `candidate_ref.evidence`는 nullable이지만 현재 deterministic extra entity/relation error cases에는 evidence가 포함된다.
- QA:
  - MVP6 focused test는 dataset/sample/gold/run/metrics/errors와 non-mutation guard를 함께 확인한다.
  - MVP4 focused regression은 overlapping evaluation routes compatibility를 확인한다.

## 총괄에게 요청하는 결정
- Wave29 Backend는 추가 runtime 변경 없이 PASS로 받아도 된다.
- Durable DB/Alembic persistence는 MVP6.1 closeout blocker가 아니며 P1/P2로 유지해 달라.
- MVP6.2+ 테마는 Wave29 QA closeout 후 별도 contract-first wave에서 다시 열어 달라.

## 현재 판정
- PASS
