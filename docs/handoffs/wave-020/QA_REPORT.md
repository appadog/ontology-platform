# Integration / QA Report - Wave 20

## 담당 범위
- backlog ID:
  - `INT4-001` MVP4 contract/runtime alignment
  - `INT4-002` advanced quality metrics
  - `INT4-003` evaluation dataset/golden set
  - `INT4-004` prompt/model evaluation
  - `INT4-005` search/vector/RAG grounding
  - `INT4-006` graph explorer separation
  - `INT4-007` MVP3 regression guard
  - `INT4-008` external read-only API
  - `INT4-009` collaboration/SLA remains P1, not Wave20 P0
- 작업 경로:
  - `docs/handoffs/wave-020/QA_REPORT.md`
- 확인만 수행한 경로:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-020/NEXT_ORDERS.md`
  - `docs/handoffs/wave-020/PM_REPORT.md`
  - `docs/handoffs/wave-020/BACKEND_REPORT.md`
  - `docs/handoffs/wave-020/FRONTEND_REPORT.md`
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `docs/api/MVP4_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp4-draft.json`
  - `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`

## 완료한 작업
- Wave20 PM/Backend/Frontend 보고서와 INT4 체크리스트를 기준으로 Backend/Frontend thin implementation을 재검증했다.
- Backend actual OpenAPI export를 생성하고 JSON parse, critical path/schema/enum presence를 확인했다.
- Backend MVP4 focused tests, MVP3 regression tests, ruff를 재실행했다.
- fresh SQLite DB에 Alembic upgrade 후 `scripts/seed_mvp4.py`를 실행하고 `/tmp/ontology-wave20-qa-seed.json` sanity를 확인했다.
- TestClient 기반 API smoke를 직접 실행했다:
  - quality metrics 7개 group, no composite score.
  - dataset statuses `DRAFT`/`ACTIVE`/`ARCHIVED`, golden item kinds 4종.
  - prompt/evaluation run success/failed, prompt experiment draft/completed, sample count.
  - search groups 6종, no-result.
  - vector `FALLBACK_KEYWORD`, similar evidence fallback.
  - RAG `ANSWERED` and `INSUFFICIENT_EVIDENCE`, candidate exclusion debug.
  - graph `READY` and `SAFE_TOO_LARGE`, candidate node count 0.
  - external missing auth 401, graph/entity/relation/search/RAG reads, write attempts blocked.
- Frontend `npm run test`, `npm run build`, `smoke:mvp4:mock`를 재실행했다.
- Backend/Frontend dev servers를 fresh seed로 기동해 actual smoke를 실행했다:
  - `npm run smoke:mvp3:actual` 실행 결과 FAIL.
  - one-off MVP4 actual route probe 실행 결과 PARTIAL.
- 기동한 dev server는 종료했고 `8014`, `5173`, `5174` listen process가 없음을 확인했다.

## 변경 파일
- `docs/handoffs/wave-020/QA_REPORT.md`
- 수정하지 않음:
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - 앱 runtime/backend/frontend 구현 파일

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp4-draft.json >/tmp/qa-openapi-mvp4-draft.pretty.json`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output /tmp/ontology-wave20-qa-openapi.json`
  - `cd apps/backend && python3 -m json.tool /tmp/ontology-wave20-qa-openapi.json >/tmp/ontology-wave20-qa-openapi.pretty.json`
  - `cd apps/backend && rm -f /tmp/ontology-wave20-qa-seed.db /tmp/ontology-wave20-qa-seed.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave20-qa-seed.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave20-qa-seed.db .venv/bin/python scripts/seed_mvp4.py --output /tmp/ontology-wave20-qa-seed.json && python3 -m json.tool /tmp/ontology-wave20-qa-seed.json >/tmp/ontology-wave20-qa-seed.pretty.json`
  - `cd apps/backend && .venv/bin/python - <<'PY' ...` actual OpenAPI critical compare
  - `cd apps/backend && .venv/bin/python - <<'PY' ...` TestClient MVP4 API smoke
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && npm run dev -- --host 127.0.0.1 --port 5174 --strictPort`
  - `cd apps/frontend && MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5174 MVP4_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave20-qa-mvp4-mock-smoke npm run smoke:mvp4:mock`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave20-qa-seed.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8014`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8014 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP3_API_BASE_URL=http://127.0.0.1:8014 MVP3_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP3_SEED_JSON=/tmp/ontology-wave20-qa-seed.json MVP3_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave20-qa-mvp3-actual-smoke npm run smoke:mvp3:actual`
  - `cd apps/frontend && node --input-type=module - <<'JS' ...` one-off MVP4 actual route probe
  - `python3 -m json.tool /tmp/ontology-wave20-qa-mvp4-mock-smoke/mvp4-mock-route-smoke.json >/tmp/ontology-wave20-qa-mvp4-mock-smoke.pretty.json`
  - `python3 -m json.tool /tmp/ontology-wave20-qa-mvp4-actual-probe/mvp4-actual-probe.json >/tmp/ontology-wave20-qa-mvp4-actual-probe.pretty.json`
  - `lsof -nP -iTCP:8014 -sTCP:LISTEN || true && lsof -nP -iTCP:5173 -sTCP:LISTEN || true && lsof -nP -iTCP:5174 -sTCP:LISTEN || true`
- 결과:
  - Backend MVP4 tests: PASS, `5 passed in 2.00s`.
  - Backend MVP3 regression tests: PASS, `4 passed in 1.56s`.
  - Backend ruff: PASS, `All checks passed!`.
  - Actual OpenAPI export JSON parse: PASS.
  - Actual OpenAPI critical compare:
    - draft parse: OpenAPI `3.1.0`, version `0.4.0-draft`, `26` paths, `78` schemas.
    - actual export: OpenAPI `3.1.0`, app version `0.1.0`, `77` paths, `171` schemas.
    - missing critical paths: `[]`.
    - enum mismatches: `{}`.
    - missing critical schema: `ExternalApiEnvelopeBase`.
    - concrete external envelope schemas exist: `ExternalEvidenceEnvelope`, `ExternalPublishedEntityEnvelope`, `ExternalPublishedGraphEnvelope`, `ExternalPublishedRelationEnvelope`, `ExternalRagAnswerEnvelope`, `ExternalSearchEnvelope`, `ExternalSourceEnvelope`.
  - MVP4 seed: PASS, `/tmp/ontology-wave20-qa-seed.json` parsed and includes `project-corp-knowledge`, dataset IDs, golden item IDs, `FALLBACK_KEYWORD`, RAG `ANSWERED`/`INSUFFICIENT_EVIDENCE`, graph `READY`/`SAFE_TOO_LARGE`, and `DEV_AUTH`.
  - TestClient MVP4 API smoke:
    - quality metrics: PASS, 7 groups, no `composite_score`.
    - datasets/golden set: PASS, statuses `ACTIVE`/`ARCHIVED`/`DRAFT`, golden kinds `ENTITY`/`EVIDENCE_LINK`/`PROPERTY_VALUE`/`RELATION`.
    - prompt/model: PASS, run statuses `FAILED`/`SUCCESS`, experiment statuses `COMPLETED`/`DRAFT`, sample count `8`.
    - search/vector/RAG/graph: PASS for critical positive and negative cases.
    - external API: PARTIAL/FAIL. Graph/entity/relation/search/RAG reads PASS; missing auth returns 401; write attempts return 405; `GET /api/v1/external/sources/{source_id}` returns 500; `GET /api/v1/external/evidence/{evidence_id}` returns 500.
  - Frontend tests: PASS, `4 passed (4)` files / `10 passed (10)` tests.
  - Frontend build: PASS.
  - `smoke:mvp4:mock`: PASS, artifact `/tmp/ontology-wave20-qa-mvp4-mock-smoke/mvp4-mock-route-smoke.json`.
  - `smoke:mvp3:actual`: FAIL. API prechecks and earlier routes reached backend successfully, but browser smoke timed out waiting for legacy marker text `Review to published facts` while executing the published graph route assertion.
  - MVP4 actual route probe: PARTIAL. All 7 routes returned 200, but actual mode missed several expected state/copy markers:
    - RAG route: missing `Grounded RAG` marker, candidate exclusion copy present.
    - Graph route: missing `SAFE TOO LARGE` and `Published-only` markers in the probe.
    - Prompt route: missing `Telemetry unavailable` marker.
    - External API route: missing `DEV_AUTH` and `read-only` markers.
  - Dev servers stopped; no listeners remained on `8014`, `5173`, or `5174`.
- 실행하지 못한 검증:
  - Full formal `smoke:mvp4:actual` was not available as a package script. QA ran a one-off actual route probe instead.
  - Full metric recomputation for every formula from raw DB rows was not performed; QA verified seed/API formula metadata, groups, no composite score, and Backend focused tests.

## INT4 판정
| ID | 판정 | 근거 |
|---|---|---|
| `INT4-001` | PARTIAL | Actual OpenAPI has all draft paths and frozen enum literals, but abstract `ExternalApiEnvelopeBase` is missing as standalone schema. Backend documented concrete-envelope drift; commander/PM should accept drift or order alignment. |
| `INT4-002` | PARTIAL | Backend quality API and Frontend mock/actual page load pass; no composite score. Full raw-data recomputation and all frontend state assertions were not fully proven by QA. |
| `INT4-003` | PASS | Dataset/golden endpoints, seed statuses, golden item kinds, provenance-backed API smoke, Frontend mock smoke, and actual route 200 all passed. |
| `INT4-004` | PASS | Evaluation runs, prompt experiments, prompt performance rows/sample count passed API smoke; Frontend tests/build/mock route passed. Actual probe had a missing telemetry-unavailable marker, but telemetry is optional and backend sample count is present. |
| `INT4-005` | PARTIAL | Search groups, no-result, vector fallback, RAG answered, RAG insufficient evidence, and candidate exclusion pass API smoke; Frontend mock smoke passes. Actual MVP4 probe is partial because RAG title/state coverage was not fully asserted. |
| `INT4-006` | PARTIAL | Backend graph `READY` and `SAFE_TOO_LARGE` pass with candidate node count 0; mock smoke passes. Actual route returned 200 but probe did not find `SAFE TOO LARGE` / `Published-only` markers. |
| `INT4-007` | FAIL | Backend MVP3 tests pass, but `npm run smoke:mvp3:actual` failed after Wave20 changes on the existing actual browser smoke. The upgraded published graph route no longer satisfied the legacy marker assertion. |
| `INT4-008` | FAIL | External graph/entity/relation/search/RAG, dev-auth negative, and read-only method blocks pass; external source and evidence read endpoints return 500 with valid dev auth. |
| `INT4-009` | NOT RUNNABLE / P1 | PM did not promote collaboration/SLA into Wave20 P0. Not a gate for `INT4-001`~`INT4-008`. |

## API/Enum/DTO 변경
- 변경 여부: QA 변경 없음.
- 상세:
  - QA did not modify API/enum/DTO files.
  - Observed Backend/API drift: actual OpenAPI emits concrete external envelope schemas but not `ExternalApiEnvelopeBase`.
  - Observed Backend runtime defect: external source/evidence reads return 500 under valid `X-Dev-Auth: mvp4-dev`.
  - Observed Frontend regression/harness break: existing `smoke:mvp3:actual` no longer passes on the published graph route.
- 영향받는 역할:
  - Backend: fix external source/evidence read DTO validation and decide/implement `ExternalApiEnvelopeBase` alignment if commander requires exact schema component.
  - Frontend: restore MVP3 actual smoke compatibility or update the smoke/route contract with PM approval; improve actual MVP4 state/copy markers for RAG, graph, prompt telemetry, and external API docs.
  - PM/Commander: decide whether abstract envelope schema drift is acceptable and issue Wave21 hardening before broader MVP4 expansion.

## Blocker
- `INT4-008` blocker: valid dev-auth external source/evidence read endpoints return 500.
  - Root cause observed from TestClient stack: `SourceData.model_validate(source, from_attributes=True)` receives SQLAlchemy `MetaData()` for `metadata` instead of a dict-like source metadata field.
  - Evidence endpoint also returns 500 in captured-mode smoke.
- `INT4-007` blocker: `npm run smoke:mvp3:actual` fails on existing browser route assertion after Wave20 Frontend route changes.
- `INT4-001` decision blocker: `ExternalApiEnvelopeBase` standalone component is absent from actual OpenAPI; Backend documented this as expected drift, but QA cannot accept it unilaterally.

## 남은 TODO
- Backend:
  - Fix external source/evidence envelope reads and add regression coverage for both.
  - Add or align standalone `ExternalApiEnvelopeBase` schema, or get commander/PM acceptance of concrete-envelope-only OpenAPI.
- Frontend:
  - Restore `npm run smoke:mvp3:actual` PASS, or update the smoke contract only if PM accepts the published graph route behavior change.
  - Add a formal `smoke:mvp4:actual` script once actual UI assertions are stable.
  - Ensure actual mode visibly covers RAG answered/insufficient states, graph `SAFE_TOO_LARGE`, prompt telemetry-unavailable state when applicable, and external `DEV_AUTH`/read-only docs copy.
- QA:
  - Re-run `INT4-001`, `INT4-007`, and `INT4-008` after hardening.
  - Re-run `INT4-005`/`INT4-006` actual UI probes after Frontend markers/states are hardened.

## 다른 역할에 전달할 내용
- PM:
  - Wave20 delivered a useful MVP4 thin slice, but current INT4 gate is not clean enough for expansion.
  - Keep `INT4-009` P1 unless explicitly promoted.
- Backend:
  - Internal MVP4 API smoke is strong. Focus Wave21 on external source/evidence 500s and OpenAPI envelope drift.
- Frontend:
  - Mock MVP4 route smoke passes. Actual MVP3 smoke regression and actual MVP4 route state/copy gaps need hardening.
- QA:
  - Preserve `/tmp/ontology-wave20-qa-openapi.json`, `/tmp/ontology-wave20-qa-seed.json`, `/tmp/ontology-wave20-qa-mvp4-mock-smoke/`, and `/tmp/ontology-wave20-qa-mvp4-actual-probe/` as local evidence for this run.

## 총괄에게 요청하는 결정
- Do not expand MVP4 depth in Wave21 yet.
- Issue focused Wave21 hardening orders:
  - Backend: external source/evidence 500 fix plus OpenAPI envelope drift decision/implementation.
  - Frontend: restore MVP3 actual smoke and formalize/repair actual MVP4 smoke states.
  - QA: re-run targeted `INT4-001`, `INT4-007`, `INT4-008`, and actual UI checks after fixes.
- Decide whether the missing standalone `ExternalApiEnvelopeBase` component is acceptable as documented implementation drift.

## 현재 판정
- FAIL / WAVE21 HARDENING REQUIRED
