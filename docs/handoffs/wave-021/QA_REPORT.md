# Integration / QA Report - Wave 21

## 담당 범위
- backlog ID:
  - Targeted rerun: `INT4-001`, `INT4-005`, `INT4-006`, `INT4-007`, `INT4-008`
  - Regression confirmation: `INT4-003`, `INT4-004`
  - Status review: `INT4-002`, `INT4-009`
- 작업 경로:
  - `docs/handoffs/wave-021/QA_REPORT.md`
- 확인만 수행한 경로:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-021/NEXT_ORDERS.md`
  - `docs/handoffs/wave-021/PM_REPORT.md`
  - `docs/handoffs/wave-021/BACKEND_REPORT.md`
  - `docs/handoffs/wave-021/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-020/QA_REPORT.md`
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `docs/api/MVP4_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp4-draft.json`
  - `docs/handoffs/REPORT_TEMPLATE.md`

## 완료한 작업
- Wave21 PM/Backend/Frontend hardening reports를 읽고 QA start condition을 충족했다.
- PM decision대로 actual OpenAPI compare에서 standalone `ExternalApiEnvelopeBase`를 요구하지 않고 concrete external envelope schemas를 검증했다.
- Backend MVP4 focused tests, MVP3 regression tests, ruff, fresh SQLite Alembic, `scripts/seed_mvp4.py`, actual OpenAPI export/parse, critical compare를 재실행했다.
- TestClient 기반 MVP4 API smoke를 재실행했다.
  - `INT4-003` dataset/golden set no regression 확인.
  - `INT4-004` prompt/model evaluation no regression 확인.
  - `INT4-005` search, vector fallback, RAG answered/insufficient evidence 확인.
  - `INT4-006` graph `READY`, `SAFE_TOO_LARGE`, published-only separation 확인.
  - `INT4-008` external graph/entity/relation/source/evidence/search/RAG valid dev-auth `200`, missing auth `401`, invalid auth `401`, write methods blocked 확인.
- Frontend `npm run test`, `npm run build`, `smoke:mvp4:mock`, `smoke:mvp3:actual`, `smoke:mvp4:actual`을 재실행했다.
- QA가 기동한 dev servers는 모두 종료했고 `8014`, `5173`, `5174` listen process가 없음을 확인했다.

## 변경 파일
- `docs/handoffs/wave-021/QA_REPORT.md`
- 수정하지 않음:
  - Backend 구현 파일
  - Frontend 구현 파일
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md`

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp4-draft.json >/tmp/ontology-wave21-qa-openapi-draft.pretty.json`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && rm -f /tmp/ontology-wave21-qa-seed.db /tmp/ontology-wave21-qa-seed.json /tmp/ontology-wave21-qa-seed.pretty.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave21-qa-seed.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave21-qa-seed.db .venv/bin/python scripts/seed_mvp4.py --output /tmp/ontology-wave21-qa-seed.json && python3 -m json.tool /tmp/ontology-wave21-qa-seed.json >/tmp/ontology-wave21-qa-seed.pretty.json`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output /tmp/ontology-wave21-qa-openapi.json && python3 -m json.tool /tmp/ontology-wave21-qa-openapi.json >/tmp/ontology-wave21-qa-openapi.pretty.json`
  - `cd apps/backend && .venv/bin/python - <<'PY' ...` actual OpenAPI critical compare aligned to PM concrete-envelope decision, with JSON artifact `/tmp/ontology-wave21-qa-openapi-compare.json`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave21-qa-seed.db .venv/bin/python - <<'PY' ...` MVP4 TestClient API smoke, with JSON artifact `/tmp/ontology-wave21-qa-api-smoke.json`
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && npm run dev -- --host 127.0.0.1 --port 5174 --strictPort`
  - `cd apps/frontend && MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5174 MVP4_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave21-qa-mvp4-mock-smoke npm run smoke:mvp4:mock`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave21-qa-seed.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8014`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8014 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP3_API_BASE_URL=http://127.0.0.1:8014 MVP3_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP3_SEED_JSON=/tmp/ontology-wave21-qa-seed.json MVP3_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave21-qa-mvp3-actual-smoke npm run smoke:mvp3:actual`
  - `cd apps/frontend && MVP4_API_BASE_URL=http://127.0.0.1:8014 MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP4_SEED_JSON=/tmp/ontology-wave21-qa-seed.json MVP4_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave21-qa-mvp4-actual-smoke npm run smoke:mvp4:actual`
  - `python3 -m json.tool` for generated OpenAPI, seed, API smoke, OpenAPI compare, mock smoke, MVP3 actual smoke, and MVP4 actual smoke artifacts.
  - `lsof -nP -iTCP:8014 -sTCP:LISTEN || true`
  - `lsof -nP -iTCP:5173 -sTCP:LISTEN || true`
  - `lsof -nP -iTCP:5174 -sTCP:LISTEN || true`
- 결과:
  - Backend MVP4 tests: PASS, `5 passed in 2.31s`.
  - Backend MVP3 regression tests: PASS, `4 passed in 1.84s`.
  - Backend ruff: PASS, `All checks passed!`.
  - Fresh SQLite Alembic upgrade: PASS.
  - `scripts/seed_mvp4.py` JSON parse: PASS, `/tmp/ontology-wave21-qa-seed.json`.
  - Actual OpenAPI export JSON parse: PASS, `/tmp/ontology-wave21-qa-openapi.json`.
  - Actual OpenAPI critical compare: PASS.
    - draft: OpenAPI `3.1.0`, version `0.4.0-draft`, `26` paths, `78` schemas.
    - actual: OpenAPI `3.1.0`, app version `0.1.0`, `77` paths, `171` schemas.
    - missing paths: `[]`.
    - missing critical schemas: `[]`.
    - enum mismatches: `{}`.
    - concrete external envelope mismatches: `{}`.
    - standalone `ExternalApiEnvelopeBase` required: `false`.
  - MVP4 API smoke: PASS.
    - quality groups: `COMPLETENESS`, `CONSISTENCY`, `TRACEABILITY`, `VALIDATION`, `REVIEW`, `DUPLICATE`, `RELATION_DENSITY`.
    - dataset statuses: `ACTIVE`, `ARCHIVED`, `DRAFT`.
    - golden item kinds: `ENTITY`, `EVIDENCE_LINK`, `PROPERTY_VALUE`, `RELATION`.
    - prompt run statuses: `FAILED`, `SUCCESS`; experiment statuses: `COMPLETED`, `DRAFT`; sample count `8`.
    - search groups: `PUBLISHED_ENTITY`, `PUBLISHED_RELATION`, `SOURCE`, `SOURCE_CHUNK`, `EVIDENCE`, `LINEAGE`; no-result fixture `q=no-mvp4-results` returned `0`.
    - vector status: `FALLBACK_KEYWORD`; similar evidence fallback used.
    - RAG states: `ANSWERED`, `INSUFFICIENT_EVIDENCE`.
    - graph states: `READY`, `SAFE_TOO_LARGE`; ready graph has 2 nodes / 1 edge and no candidate refs.
    - external valid reads: graph/entity/relation/source/evidence/search/RAG all `200`.
    - external missing auth: all `401`; invalid graph auth `401`.
    - external write methods on graph/entity/relation/source/evidence: all blocked with `405`.
  - Frontend tests: PASS, 4 files / 10 tests.
  - Frontend build: PASS.
  - `smoke:mvp4:mock`: PASS, artifact `/tmp/ontology-wave21-qa-mvp4-mock-smoke/mvp4-mock-route-smoke.json`.
  - `smoke:mvp3:actual`: PASS, artifact `/tmp/ontology-wave21-qa-mvp3-actual-smoke/mvp3-actual-api-smoke.json`.
  - `smoke:mvp4:actual`: PASS, artifact `/tmp/ontology-wave21-qa-mvp4-actual-smoke/mvp4-actual-api-smoke.json`.
    - API checks covered 7 quality groups, `SAFE_TOO_LARGE`, RAG `INSUFFICIENT_EVIDENCE`, prompt rows, and external `DEV_AUTH`.
    - Route checks covered quality, RAG, published graph, prompt performance, and external API docs markers.
  - Dev servers stopped; `8014`, `5173`, and `5174` had no listen process after shutdown.
- 실행하지 못한 검증:
  - Docker/PostgreSQL Compose smoke는 기존 P1 environment follow-up이라 실행하지 않았다.
  - `INT4-002` full raw DB recomputation for every metric formula was not newly expanded in this Wave21 targeted hardening rerun. Backend focused tests and QA API smoke verified explainable metric groups, formula metadata, published graph refs, no composite score, and frontend quality route smokes.

## INT4 판정
| ID | 판정 | 근거 |
|---|---|---|
| `INT4-001` | PASS | Actual OpenAPI contains all critical MVP4 paths/schemas and frozen enums. PM-approved concrete external envelope rule passes for all seven concrete envelope schemas. |
| `INT4-002` | PARTIAL | No regression observed: quality API, formula metadata, no composite score, backend focused test, mock smoke, and actual quality route pass. Full raw metric recomputation remains a deeper quality closeout check outside this targeted Wave21 hardening rerun. |
| `INT4-003` | PASS | Dataset statuses, dataset detail/version, golden item kinds, provenance-bearing items, frontend test/build/mock/actual route coverage all pass. |
| `INT4-004` | PASS | Evaluation runs, prompt experiments, prompt performance row sample count, failed/success states, telemetry-unavailable case, frontend prompt marker smoke all pass. |
| `INT4-005` | PASS | Search groups, no-result fixture, vector fallback, similar evidence fallback, RAG answered, RAG insufficient evidence, candidate exclusion, mock route smoke, and actual RAG route smoke all pass. |
| `INT4-006` | PASS | Graph `READY`, `SAFE_TOO_LARGE`, max hop safety, version graph, lineage context, published-only separation, mock route smoke, and actual graph route smoke all pass. |
| `INT4-007` | PASS | Backend MVP3 regression tests pass and `npm run smoke:mvp3:actual` passes against fresh seeded backend/frontend. Wave20 published graph marker regression is closed. |
| `INT4-008` | PASS | External graph/entity/relation/source/evidence/search/RAG valid dev-auth reads return `200`; missing/invalid auth returns `401`; write methods on external read surfaces are blocked. Wave20 source/evidence `500` blocker is closed. |
| `INT4-009` | NOT RUNNABLE / P1 | PM has not promoted collaboration/SLA into MVP4 P0. This remains a non-blocking P1 follow-up. |

## API/Enum/DTO 변경
- 변경 여부: QA 변경 없음.
- 상세:
  - QA did not modify API, enum, DTO, backend implementation, or frontend implementation files.
  - Observed actual OpenAPI is aligned with PM-approved concrete external envelope rule.
  - `ExternalApiEnvelopeBase` remains absent as a standalone actual component and is not a failure under Wave21 PM decision.
- 영향받는 역할:
  - PM/Commander: targeted Wave20 hardening blockers are closed.
  - Backend: no remaining Wave21 backend blocker found.
  - Frontend: no remaining Wave21 frontend blocker found.
  - QA: keep `/tmp/ontology-wave21-qa-*` artifacts as local evidence for this rerun.

## Blocker
- Wave21 targeted blocker: 없음.
- Remaining non-blocking follow-ups:
  - `INT4-002` full raw formula recomputation should be handled during MVP4 expansion/closeout.
  - Docker/PostgreSQL Compose smoke remains the existing P1 environment gate.
  - Broader Playwright suite formalization remains P1 tooling.

## 남은 TODO
- Wave22 should not repeat hardening for `INT4-001`, `INT4-005`, `INT4-006`, `INT4-007`, or `INT4-008` unless new regressions appear.
- Wave22 should begin MVP4 expansion, preferably with deeper quality metric recomputation proof and broader MVP4 UX/API depth.

## 다른 역할에 전달할 내용
- PM:
  - Concrete external envelope decision is validated in actual OpenAPI and runtime.
  - `INT4-009` remains P1.
- Backend:
  - External source/evidence read fix is verified with actual valid dev-auth `200`, missing auth `401`, and write method blocking.
  - Use `q=no-mvp4-results` as the deterministic no-result search fixture.
- Frontend:
  - `smoke:mvp3:actual`, `smoke:mvp4:mock`, and `smoke:mvp4:actual` all pass.
  - Actual marker coverage for RAG, graph, prompt telemetry, and external API docs is verified.
- QA:
  - Artifacts:
    - `/tmp/ontology-wave21-qa-openapi.json`
    - `/tmp/ontology-wave21-qa-openapi-compare.json`
    - `/tmp/ontology-wave21-qa-seed.json`
    - `/tmp/ontology-wave21-qa-api-smoke.json`
    - `/tmp/ontology-wave21-qa-mvp4-mock-smoke/mvp4-mock-route-smoke.json`
    - `/tmp/ontology-wave21-qa-mvp3-actual-smoke/mvp3-actual-api-smoke.json`
    - `/tmp/ontology-wave21-qa-mvp4-actual-smoke/mvp4-actual-api-smoke.json`

## 총괄에게 요청하는 결정
- Wave22 recommendation: proceed to MVP4 expansion rather than another hardening-only wave.
- Suggested first Wave22 expansion/closeout focus:
  - close `INT4-002` by adding/validating full raw metric recomputation proof;
  - broaden MVP4 UI/API depth while keeping weighted composite score, collaboration/SLA, production vector hardening, and production external auth out of P0 unless PM promotes them.

## 현재 판정
- PASS / TARGETED WAVE21 HARDENING CLOSED
