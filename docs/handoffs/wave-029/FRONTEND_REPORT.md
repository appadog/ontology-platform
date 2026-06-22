# Frontend Report - Wave 29

## 담당 범위
- backlog ID:
  - `FE6-009` Actual API smoke
  - `FE6-010` Candidate ref DTO widening
- 작업 경로:
  - `apps/frontend/src/shared/api/types.ts`
  - `apps/frontend/src/pages/EvaluationDatasetsPage.tsx`
  - `apps/frontend/src/shared/mocks/mvp6Fixtures.ts`
  - `apps/frontend/src/shared/api/mvp6Mock.test.ts`
  - `apps/frontend/scripts/mvp6-actual-api-smoke.mjs`
  - `apps/frontend/package.json`
  - `docs/handoffs/wave-029/FRONTEND_REPORT.md`

## 완료한 작업
- Backend `EvaluationCandidateRef`와 맞는 MVP6 전용 TypeScript type을 추가하고 `EvaluationErrorCase.candidate_ref`에 적용했다.
- Error Case Explorer의 candidate column을 entity/relation context 표시로 확장했다:
  - 공통: `candidate_kind`, `candidate_id`, `sample_id`
  - entity: `ontology_class_id`, `label`, `normalized_value`
  - relation: `ontology_relation_id`, `source_gold_entity_id`, `target_gold_entity_id`
  - evidence nullable fallback: gold/candidate/candidate-ref evidence 없음 상태를 안정적으로 표시
- MVP6 mock fixture와 mock contract test를 보강해 entity/relation candidate_ref 필드와 nullable evidence case를 검증했다.
- `apps/frontend/scripts/mvp6-actual-api-smoke.mjs`를 추가했다.
  - 실제 backend API에 project/dataset/sample/gold entities/gold relations/run을 직접 생성한다.
  - run detail, metrics, errors, error detail, `EvaluationCandidateRef` 필드를 API로 검증한다.
  - empty dataset run으로 zero-denominator metric이 `NOT_APPLICABLE` + `value: null`인지 검증한다.
  - Vite actual mode route에서 dataset/sample/gold item/run/metric/error/candidate context marker를 확인한다.
- `npm run smoke:mvp6:actual` package script를 추가했고 기존 `smoke:mvp6:mock`은 유지했다.
- Product Showcase guide는 참고만 했고 Wave29 전면 redesign이나 MVP6.2+ UI는 추가하지 않았다.

## 변경 파일
- 수정:
  - `apps/frontend/package.json`
  - `apps/frontend/src/pages/EvaluationDatasetsPage.tsx`
  - `apps/frontend/src/shared/api/types.ts`
  - `apps/frontend/src/shared/api/mvp6Mock.test.ts`
  - `apps/frontend/src/shared/mocks/mvp6Fixtures.ts`
- 생성:
  - `apps/frontend/scripts/mvp6-actual-api-smoke.mjs`
  - `docs/handoffs/wave-029/FRONTEND_REPORT.md`
- 수정하지 않음:
  - `apps/frontend/src/shared/api/client.ts`
  - `apps/frontend/src/shared/api/queries.ts`

## 실행/검증
- 실행한 명령:
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && npm run smoke:mvp6:mock`
  - `cd apps/backend && rm -f /tmp/ontology-wave29-mvp6-actual.db && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave29-mvp6-actual.db .venv/bin/alembic upgrade head`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave29-mvp6-actual.db LOCAL_STORAGE_PATH=/tmp/ontology-wave29-mvp6-storage .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP6_API_BASE_URL=http://127.0.0.1:8000 MVP6_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP6_SMOKE_ARTIFACT_DIR=/tmp/ontology-mvp6-actual-frontend-smoke npm run smoke:mvp6:actual`
  - `git diff --check`
- 결과:
  - `PASS`: frontend test `6 files / 13 tests passed`
  - `PASS`: frontend build completed
  - `PASS`: `smoke:mvp6:mock`
    - artifact: `/tmp/ontology-mvp6-frontend-smoke/mvp6-mock-route-smoke.json`
    - screenshot: `/tmp/ontology-mvp6-frontend-smoke/evaluation-datasets-mvp6.png`
  - `PASS`: `smoke:mvp6:actual`
    - artifact: `/tmp/ontology-mvp6-actual-frontend-smoke/mvp6-actual-api-smoke.json`
    - screenshot: `/tmp/ontology-mvp6-actual-frontend-smoke/evaluation-datasets-mvp6-actual.png`
    - API checks: dataset/sample/gold, run context, 8 metrics plus empty-run `NOT_APPLICABLE`, 3 error cases including relation candidate context
  - `PASS`: `git diff --check` 출력 없음
- 실행하지 못한 검증:
  - 없음.

## API/Enum/DTO 변경
- 변경 여부: 있음, Frontend TypeScript DTO만 변경
- 상세:
  - 추가:
    - `EvaluationCandidateKind = "ENTITY" | "RELATION"`
    - `EvaluationCandidateRef`
  - 변경:
    - `EvaluationErrorCase.candidate_ref?: EvaluationCandidateRef | null`
  - Backend API, enum literal, OpenAPI artifact는 Frontend가 변경하지 않았다.
- 영향받는 역할:
  - Backend: runtime 변경 필요 없음. Wave29 Backend report의 self-seeding actual smoke 가이드를 따랐다.
  - QA: `INT6-006`, `INT6-007`에서 actual smoke artifact와 widened candidate_ref display를 검증할 수 있다.

## Blocker
- 없음.
- 주의:
  - 현재 작업트리에는 Wave28/Wave29 및 다른 역할의 modified/untracked 파일이 다수 있다. Frontend는 지정된 소유 범위만 편집했고 기존 변경을 되돌리지 않았다.
  - actual route 렌더 중 기존 legacy dataset version query가 `/api/v1/evaluation-datasets/{dataset_id}/versions`를 호출해 404를 받지만, MVP6.1 actual smoke 경로의 dataset/sample/gold/run/metrics/errors 검증에는 영향이 없었다.

## 남은 TODO
- QA가 `INT6-006`~`INT6-008` 기준으로 mock/actual smoke와 DTO consistency를 재검증한다.
- Durable DB/Alembic persistence, benchmark comparison, confusion matrix, active learning, governance, agent, connector, multi-tenant, real LLM benchmark는 PM freeze 전까지 열지 않는다.
- legacy dataset version query의 actual 404 처리는 후속 cleanup 후보로 둘 수 있으나 Wave29 MVP6.1 actual smoke blocker는 아니다.

## 다른 역할에 전달할 내용
- PM:
  - Wave29 Frontend는 MVP6.1 hardening-only로 완료했다. Product Showcase 전면 redesign과 MVP6.2+ UI는 열지 않았다.
- Backend:
  - actual smoke는 stale id에 의존하지 않고 매 실행마다 같은 backend process에 데이터를 생성한다.
  - `model_run_id` 생략 시 backend 생성 값을 검증한다.
- Frontend:
  - Error Case Explorer는 generic `CandidateRef`가 아니라 MVP6 `EvaluationCandidateRef`를 표시한다.
  - `candidate_ref.evidence`, `candidate_evidence`, `gold_evidence` null/undefined 모두 fallback 문구로 처리한다.
- QA:
  - actual smoke artifact는 `/tmp/ontology-mvp6-actual-frontend-smoke/mvp6-actual-api-smoke.json`이다.
  - actual smoke 실행 전제는 backend `127.0.0.1:8000`, Vite actual mode `127.0.0.1:5173`, process-local backend runtime 유지다.

## 총괄에게 요청하는 결정
- Wave29 Frontend를 PASS로 받아도 된다.
- MVP6.1 closeout 전 QA가 actual smoke artifact와 candidate_ref DTO/display consistency를 최종 판정해 달라.
- durable persistence와 MVP6.2+ 테마는 PM 결정대로 P1/P2 또는 별도 contract-first wave로 유지해 달라.

## 현재 판정
- PASS
