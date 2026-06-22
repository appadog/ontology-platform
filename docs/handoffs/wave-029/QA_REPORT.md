# QA / Integration Report - Wave 29

## 담당 범위
- backlog ID:
  - `INT6-006` MVP6.1 actual API smoke
  - `INT6-007` Candidate ref DTO consistency
  - `INT6-008` MVP6.1 closeout recommendation
- 작업 경로:
  - `docs/handoffs/wave-029/QA_REPORT.md`
  - 검증 대상:
    - `docs/handoffs/wave-029/PM_REPORT.md`
    - `docs/handoffs/wave-029/BACKEND_REPORT.md`
    - `docs/handoffs/wave-029/FRONTEND_REPORT.md`
    - `docs/api/openapi-mvp6-draft.json`
    - `apps/backend/tests/test_mvp6_evaluation_api.py`
    - `apps/frontend/scripts/mvp6-actual-api-smoke.mjs`

## 완료한 작업
- 필수 시작 문서와 Wave29 PM/Backend/Frontend role report를 읽고 QA 범위를 확인했다.
- `INT6-006` 실제 API smoke를 재현했다.
  - 실제 backend runtime에 project, dataset, sample, gold entities, gold relations, evaluation run을 self-create했다.
  - run detail, metrics, errors, error detail, route rendering marker를 확인했다.
  - artifact: `/tmp/ontology-mvp6-actual-frontend-smoke/mvp6-actual-api-smoke.json`
- `INT6-007` DTO 정합성을 확인했다.
  - Backend OpenAPI `EvaluationCandidateRef` 필드:
    `candidate_id`, `candidate_kind`, `sample_id`, `ontology_class_id`,
    `ontology_relation_id`, `label`, `normalized_value`,
    `source_gold_entity_id`, `target_gold_entity_id`, `evidence`
  - Frontend `EvaluationErrorCase.candidate_ref`가
    `EvaluationCandidateRef | null`을 사용함을 확인했다.
  - UI display가 entity/relation context와 nullable evidence fallback을 표시함을 확인했다.
- `INT6-008` scope guard를 확인했다.
  - MVP6.2+ Active Learning, governance, impact simulation, copilot/agent,
    connector/plugin SDK, multi-tenant, ontology pack, real LLM benchmark
    runtime이 Wave29 MVP6.1 code path에 섞이지 않은 것으로 확인했다.
  - durable DB/Alembic migration은 추가되지 않았다.
  - evaluation operation의 candidate review, publish job, published graph
    non-mutation guard는 backend focused test로 재확인했다.
- Frontend report의 legacy
  `/api/v1/evaluation-datasets/{dataset_id}/versions` 404를 확인했다.
  - actual route rendering 중 backend log에 404가 남았다.
  - `smoke:mvp6:actual` route assertions와 MVP6.1 dataset/sample/gold/run/metrics/errors 검증은 모두 PASS했다.
  - 이 endpoint는 MVP6.1 Wave29 actual smoke required flow가 아니므로 blocking이 아니라 후속 cleanup 후보로 판정한다.
- QA 실행 중 띄운 backend/Vite dev server를 모두 종료했고, 최종 `lsof`로 8000/5173 listener가 남지 않았음을 확인했다.

## 변경 파일
- 생성:
  - `docs/handoffs/wave-029/QA_REPORT.md`
- production code 변경:
  - 없음.

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp6_evaluation_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output /tmp/ontology-wave29-qa-openapi-mvp6.json`
  - Node OpenAPI parse/check:
    - `docs/api/openapi-mvp6-draft.json` parse
    - `/tmp/ontology-wave29-qa-openapi-mvp6.json` parse
    - runtime export와 draft artifact JSON 일치 확인
    - `EvaluationCandidateRef` required field set 확인
  - Node Frontend type check:
    - `EvaluationCandidateRef` interface 필드 확인
    - `EvaluationErrorCase.candidate_ref?: EvaluationCandidateRef | null` 확인
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && npm run smoke:mvp6:mock`
    - 첫 실행은 Vite server 미기동으로 `ERR_CONNECTION_REFUSED`
    - `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` 실행 후 재실행 PASS
  - actual smoke setup:
    - `cd apps/backend && rm -f /tmp/ontology-wave29-qa-mvp6-actual.db && rm -rf /tmp/ontology-wave29-qa-mvp6-storage && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave29-qa-mvp6-actual.db .venv/bin/alembic upgrade head`
    - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave29-qa-mvp6-actual.db LOCAL_STORAGE_PATH=/tmp/ontology-wave29-qa-mvp6-storage .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000`
    - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
    - `cd apps/frontend && MVP6_API_BASE_URL=http://127.0.0.1:8000 MVP6_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP6_SMOKE_ARTIFACT_DIR=/tmp/ontology-mvp6-actual-frontend-smoke npm run smoke:mvp6:actual`
  - Scope guard search:
    - `rg -n -i "active learning|learning signal|learning-signals|prompt improvement|ontology governance|ontology-change|impact simulation|impact-simulations|copilot|agentic|agent runtime|connector|plugin sdk|multi-tenant|tenant|ontology pack|advanced visualization|real llm|openai|anthropic|fine-tun|published graph|publish job|review decision|candidate review" ...`
  - `git diff --check`
  - `lsof -nP -iTCP:8000 -sTCP:LISTEN`
  - `lsof -nP -iTCP:5173 -sTCP:LISTEN`
- 결과:
  - `PASS`: backend MVP6 focused test `4 passed`.
  - `PASS`: backend MVP4 focused regression `7 passed`.
  - `PASS`: backend ruff `All checks passed!`.
  - `PASS`: OpenAPI draft parses as `3.1.0`, version `0.1.0`.
  - `PASS`: runtime OpenAPI export matches `docs/api/openapi-mvp6-draft.json`.
  - `PASS`: OpenAPI `EvaluationCandidateRef` has all required fields and `candidate_kind` enum `ENTITY`, `RELATION`.
  - `PASS`: Frontend `EvaluationCandidateRef` type fields match Backend OpenAPI and `EvaluationErrorCase.candidate_ref` uses `EvaluationCandidateRef | null`.
  - `PASS`: frontend vitest `6 files / 13 tests passed`.
  - `PASS`: frontend build completed.
  - `PASS`: `smoke:mvp6:mock` after expected Vite server setup.
    - artifact: `/tmp/ontology-mvp6-frontend-smoke/mvp6-mock-route-smoke.json`
    - screenshot: `/tmp/ontology-mvp6-frontend-smoke/evaluation-datasets-mvp6.png`
  - `PASS`: `smoke:mvp6:actual`.
    - artifact: `/tmp/ontology-mvp6-actual-frontend-smoke/mvp6-actual-api-smoke.json`
    - screenshot: `/tmp/ontology-mvp6-actual-frontend-smoke/evaluation-datasets-mvp6-actual.png`
    - API checks:
      - dataset/sample/gold: 1 dataset, 1 sample, 3 gold entities, 2 gold relations
      - run context: `SUCCEEDED`, ontology/prompt/model/parser context present
      - metrics: 8 P0 metrics plus empty-run 8 `NOT_APPLICABLE` metrics
      - errors: 3 error cases, including relation candidate context
    - route assertions:
      - dataset, sample, gold entity, gold relation, deterministic run,
        metrics, error explorer, wrong-direction error, relation candidate context
  - `PASS`: scope guard search found no MVP6.2+ runtime leakage in the MVP6.1 evaluation code path. The only frontend fixture hit for `published graph` is a non-mutation note.
  - `PASS`: `git diff --check` output 없음.
  - `PASS`: final `lsof` checks show no listeners left on `8000` or `5173`.
- 실행하지 못한 검증:
  - Docker/PostgreSQL Compose smoke는 기존 P1 environment/tooling follow-up이라 실행하지 않았다.
  - Durable DB/Alembic persistence smoke는 PM이 Wave29 제외로 결정했으므로 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: QA 변경 없음.
- 관찰한 변경:
  - Backend runtime API, enum literal, OpenAPI artifact는 Wave29 Backend report 기준 변경 없음.
  - Frontend TypeScript DTO는 Wave29에서 `EvaluationCandidateKind`와
    `EvaluationCandidateRef`를 추가하고 `EvaluationErrorCase.candidate_ref`를
    `EvaluationCandidateRef | null`로 정렬했다.
- 영향받는 역할:
  - PM: process-local runtime store는 MVP6.1 actual smoke 재현성에 충분하다.
  - Backend: 추가 runtime 변경은 필요 없어 보인다.
  - Frontend: legacy dataset versions 404는 후속 cleanup 후보이나 MVP6.1 blocker는 아니다.

## Blocker
- 없음.

## 남은 TODO
- P1/P2:
  - Durable DB/Alembic persistence는 PM 결정대로 MVP6.1 closeout blocker가 아니며 후속 결정 필요.
  - legacy `/api/v1/evaluation-datasets/{dataset_id}/versions` 404는 실제 route rendering을 막지 않았으므로 후속 cleanup 후보로 유지.
  - Docker/PostgreSQL Compose smoke와 broader Playwright formalization은 기존 environment/tooling follow-up으로 유지.

## 다른 역할에 전달할 내용
- PM:
  - `INT6-006`, `INT6-007`, `INT6-008` 모두 PASS로 판정한다.
  - MVP6.1 closeout 후 MVP6.2는 별도 contract-first planning으로 여는 것을 권장한다.
- Backend:
  - Wave29 actual smoke는 current process-local runtime store로 반복 재현 가능했다.
  - 추가 dev-only reset/seed helper 없이 actual smoke가 self-create 방식으로 통과했다.
- Frontend:
  - `smoke:mvp6:mock`과 `smoke:mvp6:actual` 모두 server prerequisite만 맞추면 PASS한다.
  - legacy dataset versions 404는 현 시점 non-blocking cleanup 후보로 보고한다.
- QA:
  - 다음 wave에서 MVP6.2가 열리면 `INT6-009` 또는 별도 MVP6.2 checklist를 먼저 작성해야 한다.

## 총괄에게 요청하는 결정
- Wave29 MVP6.1 targeted hardening을 PASS로 승인해 달라.
- MVP6.1 Gold Set / Benchmark Studio thin slice를 closeout하고, MVP6.2 Active Learning 등 이후 테마는 별도 contract-first wave에서 시작해 달라.
- durable persistence와 legacy dataset versions cleanup은 P1/P2 follow-up으로 유지해 달라.

## 현재 판정
- PASS
