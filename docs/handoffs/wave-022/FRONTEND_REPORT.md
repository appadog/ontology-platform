# Frontend / UIUX Quality Evidence Report - Wave 22

## 담당 범위
- backlog ID:
  - `FE4-001`
  - `INT4-002`
  - regression guard for `INT4-005`~`INT4-007`
- 작업 경로:
  - `apps/frontend/src/pages/QualityDashboardPage.tsx`
  - `apps/frontend/src/shared/mocks/mvp4Fixtures.ts`
  - `apps/frontend/src/shared/api/mvp4Mock.test.ts`
  - `apps/frontend/scripts/mvp4-mock-route-smoke.mjs`
  - `apps/frontend/scripts/mvp4-actual-api-smoke.mjs`
  - `docs/handoffs/wave-022/FRONTEND_REPORT.md`

## 완료한 작업
- MVP4 Quality Dashboard에 `INT4-002` recomputation trust evidence를 노출했다.
  - metric row마다 value/rate, numerator, denominator, formula ID, drilldown target, published graph version context를 표시한다.
  - formula explainer도 formula ID, numerator, denominator, scope, time window, breakdown, drilldown target, published version을 표시한다.
  - 상단에 `NO COMPOSITE SCORE` marker를 추가해 weighted composite P0 score가 없음을 명시했다.
- mock quality fixtures를 보강했다.
  - 7개 P0 metric group 모두 group-specific numerator/denominator source, scope, breakdown dimension, drilldown target, published graph version query context를 가진다.
  - fixture JSON에는 composite score 필드를 추가하지 않았다.
- smoke/test assertions를 보강했다.
  - `smoke:mvp4:mock`는 formula numerator/denominator/drilldown target, published graph version context, rate context, no composite score marker를 확인한다.
  - `smoke:mvp4:actual`는 API quality metrics 7개 모두 formula numerator/denominator/drilldown target/published graph version context를 포함하는지 확인하고, route에서도 같은 visible marker를 확인한다.
  - `mvp4Mock.test.ts`는 모든 metric group/metric의 formula metadata와 drilldown query version context를 확인한다.
- TDD red 확인:
  - smoke assertion 추가 직후 기존 UI에서 `smoke:mvp4:mock`가 `Drilldown target` marker timeout으로 실패함을 확인했다.
  - UI/fixture 수정 후 같은 smoke가 PASS로 전환됐다.

## 변경 파일
- `apps/frontend/src/pages/QualityDashboardPage.tsx`
- `apps/frontend/src/shared/mocks/mvp4Fixtures.ts`
- `apps/frontend/src/shared/api/mvp4Mock.test.ts`
- `apps/frontend/scripts/mvp4-mock-route-smoke.mjs`
- `apps/frontend/scripts/mvp4-actual-api-smoke.mjs`
- `docs/handoffs/wave-022/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/frontend && MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5174 MVP4_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave22-red-mvp4-mock npm run smoke:mvp4:mock`
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5174 MVP4_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave22-mvp4-mock-smoke npm run smoke:mvp4:mock`
  - `cd apps/backend && rm -f /tmp/ontology-wave22-frontend-seed.db /tmp/ontology-wave22-frontend-seed.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave22-frontend-seed.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave22-frontend-seed.db .venv/bin/python scripts/seed_mvp4.py --output /tmp/ontology-wave22-frontend-seed.json && python3 -m json.tool /tmp/ontology-wave22-frontend-seed.json >/tmp/ontology-wave22-frontend-seed.pretty.json`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave22-frontend-seed.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8014`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8014 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP3_API_BASE_URL=http://127.0.0.1:8014 MVP3_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP3_SEED_JSON=/tmp/ontology-wave22-frontend-seed.json MVP3_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave22-mvp3-actual-smoke npm run smoke:mvp3:actual`
  - `cd apps/frontend && MVP4_API_BASE_URL=http://127.0.0.1:8014 MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP4_SEED_JSON=/tmp/ontology-wave22-frontend-seed.json MVP4_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave22-mvp4-actual-smoke npm run smoke:mvp4:actual`
  - `lsof -nP -iTCP:8014 -sTCP:LISTEN || true`
  - `lsof -nP -iTCP:5173 -sTCP:LISTEN || true`
  - `lsof -nP -iTCP:5174 -sTCP:LISTEN || true`
- 결과:
  - Red check: expected FAIL. `smoke:mvp4:mock` failed on missing `Drilldown target` marker before UI change.
  - Frontend tests: PASS, 4 files / 10 tests.
  - Frontend build: PASS.
  - `smoke:mvp4:mock`: PASS. Artifact `/tmp/ontology-wave22-mvp4-mock-smoke/mvp4-mock-route-smoke.json`.
    - quality route assertions include formula numerator, denominator, drilldown target, published graph version context, rate context, and no composite score.
  - Fresh SQLite seed: PASS. Seed output `/tmp/ontology-wave22-frontend-seed.json` includes `mvp4.quality_recompute_proof`.
  - `smoke:mvp3:actual`: PASS. Artifact `/tmp/ontology-wave22-mvp3-actual-smoke/mvp3-actual-api-smoke.json`.
  - `smoke:mvp4:actual`: PASS. Artifact `/tmp/ontology-wave22-mvp4-actual-smoke/mvp4-actual-api-smoke.json`.
    - API quality check covered 7 metric groups and 7 formula-checked metrics.
    - quality route assertions include formula numerator, denominator, drilldown target, published graph version context, rate context, and no composite score.
  - Dev servers stopped; ports `8014`, `5173`, `5174` had no listen process after shutdown.
- 실행하지 못한 검증:
  - 없음.

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세:
  - Backend API, enum, DTO contract를 변경하지 않았다.
  - Frontend authoritative recomputation logic을 추가하지 않았다.
  - Existing `QualityMetric` / `QualityFormulaMetadata` / `QualityMetricBreakdown` fields를 UI에 더 명확히 표시했다.
- 영향받는 역할:
  - Backend: authoritative recomputation proof remains Backend-owned.
  - QA: frontend smoke artifacts now include visible formula/numerator/denominator/version/no-composite proof markers.

## Blocker
- 없음.
- 참고:
  - Worktree에는 Wave18~Wave22의 다른 역할 변경 및 untracked MVP4 files가 이미 존재한다. 본 보고서는 위 변경 파일 범위만 다룬다.

## 남은 TODO
- Frontend TODO 없음.
- QA가 Backend proof artifact와 frontend visible marker를 함께 검증해 `INT4-002`를 재판정해야 한다.

## 다른 역할에 전달할 내용
- PM:
  - No weighted composite score, collaboration/SLA UI, production vector/API scope를 추가하지 않았다.
- Backend:
  - Frontend는 formula context를 표시만 하며 authoritative recomputation을 수행하지 않는다.
  - Actual smoke는 API metric rows의 formula numerator/denominator/drilldown target/published version context 존재를 확인한다.
- Frontend:
  - Quality dashboard는 MVP3 summary regression card와 MVP4 advanced metric trust context를 함께 표시한다.
- QA:
  - Mock artifact: `/tmp/ontology-wave22-mvp4-mock-smoke/mvp4-mock-route-smoke.json`
  - MVP3 actual artifact: `/tmp/ontology-wave22-mvp3-actual-smoke/mvp3-actual-api-smoke.json`
  - MVP4 actual artifact: `/tmp/ontology-wave22-mvp4-actual-smoke/mvp4-actual-api-smoke.json`
  - Fresh seed artifact: `/tmp/ontology-wave22-frontend-seed.json`

## 총괄에게 요청하는 결정
- 추가 결정 요청 없음.
- QA가 Backend recomputation proof와 Frontend evidence UI를 함께 확인한 뒤 `INT4-002` closeout 여부를 결정하면 된다.

## 현재 판정
- PASS / FRONTEND QUALITY EVIDENCE READY
