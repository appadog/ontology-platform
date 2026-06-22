# Integration / QA Report - Wave 22

## 담당 범위
- backlog ID:
  - `INT4-002`
  - Regression guard for `INT4-001`, `INT4-003`, `INT4-004`, `INT4-005`, `INT4-006`, `INT4-007`, `INT4-008`
  - Status review for `INT4-009`
- 작업 경로:
  - `docs/handoffs/wave-022/QA_REPORT.md`
- 확인만 수행한 경로:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-022/NEXT_ORDERS.md`
  - `docs/handoffs/wave-022/PM_REPORT.md`
  - `docs/handoffs/wave-022/BACKEND_REPORT.md`
  - `docs/handoffs/wave-022/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-021/QA_REPORT.md`
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `docs/api/MVP4_API_CONTRACT_DRAFT.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`

## 완료한 작업
- Wave22 PM/Backend/Frontend reports를 읽고 QA start condition을 충족했다.
- Backend proof artifact `/tmp/ontology-wave22-quality-proof.json`를 fresh SQLite DB에서 재생성하고 JSON parse를 확인했다.
- `INT4-002` proof JSON top-level과 row schema를 PM 기준으로 독립 검증했다.
  - top-level: `project_id`, `published_graph_version_ref`, `generated_at`, `source`, `tolerance`, `no_weighted_composite_score`, `metric_rows`.
  - rows: 7개 P0 group, required row fields, non-zero denominator, `passed=true`, rate tolerance `0.0001`.
- seed output의 accepted-equivalent proof section `mvp4.quality_recompute_proof`도 확인했다.
- weighted composite quality score가 P0 API/fixture/UI로 추가되지 않았는지 확인했다.
- Backend MVP4/MVP3 tests, ruff, fresh SQLite Alembic/seed/proof, actual OpenAPI export/critical compare를 재실행했다.
- Frontend tests/build, MVP4 mock route smoke, MVP3 actual smoke, MVP4 actual smoke를 재실행했다.
- Frontend quality UI/smoke artifact가 numerator, denominator, drilldown target, published graph version context, rate context, `NO COMPOSITE SCORE` marker를 확인하는지 검증했다.
- Actual smoke용 dev servers를 종료하고 사용 포트 `8014`, `5173`, `5174`에 listen process가 없음을 확인했다.

## 변경 파일
- `docs/handoffs/wave-022/QA_REPORT.md`
- 수정하지 않음:
  - Backend 구현 파일
  - Frontend 구현 파일
  - API/backlog/PM 문서

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && rm -f /tmp/ontology-wave22-qa-seed.db /tmp/ontology-wave22-qa-seed.json /tmp/ontology-wave22-quality-proof.json /tmp/ontology-wave22-quality-proof.pretty.json /tmp/ontology-wave22-qa-seed.pretty.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave22-qa-seed.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave22-qa-seed.db .venv/bin/python scripts/seed_mvp4.py --output /tmp/ontology-wave22-qa-seed.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave22-qa-seed.db .venv/bin/python scripts/verify_mvp4_quality_metrics.py --output /tmp/ontology-wave22-quality-proof.json && python3 -m json.tool /tmp/ontology-wave22-qa-seed.json >/tmp/ontology-wave22-qa-seed.pretty.json && python3 -m json.tool /tmp/ontology-wave22-quality-proof.json >/tmp/ontology-wave22-quality-proof.pretty.json`
  - proof schema/tolerance scan via `python3` for `/tmp/ontology-wave22-quality-proof.json`
  - `rg -n "weighted|composite|composite_score|weighted_composite|quality_score" apps/backend docs/api apps/frontend/src apps/frontend/scripts --glob '!**/node_modules/**'`
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && npm run dev -- --host 127.0.0.1 --port 5174 --strictPort`
  - `cd apps/frontend && MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5174 MVP4_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave22-qa-mvp4-mock-smoke npm run smoke:mvp4:mock`
  - `cd apps/backend && rm -f /tmp/ontology-wave22-qa-actual.db /tmp/ontology-wave22-qa-actual-seed.json /tmp/ontology-wave22-qa-actual-seed.pretty.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave22-qa-actual.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave22-qa-actual.db .venv/bin/python scripts/seed_mvp4.py --output /tmp/ontology-wave22-qa-actual-seed.json && python3 -m json.tool /tmp/ontology-wave22-qa-actual-seed.json >/tmp/ontology-wave22-qa-actual-seed.pretty.json`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave22-qa-actual.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8014`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8014 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP3_API_BASE_URL=http://127.0.0.1:8014 MVP3_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP3_SEED_JSON=/tmp/ontology-wave22-qa-actual-seed.json MVP3_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave22-qa-mvp3-actual-smoke npm run smoke:mvp3:actual`
  - `cd apps/frontend && MVP4_API_BASE_URL=http://127.0.0.1:8014 MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP4_SEED_JSON=/tmp/ontology-wave22-qa-actual-seed.json MVP4_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave22-qa-mvp4-actual-smoke npm run smoke:mvp4:actual`
  - `python3 -m json.tool` for proof, seed, mock smoke, MVP3 actual smoke, MVP4 actual smoke, OpenAPI, and compare artifacts.
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output /tmp/ontology-wave22-qa-openapi.json`
  - OpenAPI critical compare via `python3`, artifact `/tmp/ontology-wave22-qa-openapi-compare.json`
  - `lsof -nP -iTCP:8014 -sTCP:LISTEN || true`
  - `lsof -nP -iTCP:5173 -sTCP:LISTEN || true`
  - `lsof -nP -iTCP:5174 -sTCP:LISTEN || true`
- 결과:
  - Backend MVP4 focused tests: PASS, `7 passed in 2.27s`.
  - Backend MVP3 regression tests: PASS, `4 passed in 1.45s`.
  - Backend ruff: PASS, `All checks passed!`.
  - Fresh SQLite Alembic upgrade: PASS.
  - `/tmp/ontology-wave22-quality-proof.json` JSON parse: PASS.
  - proof scan: PASS.
    - row count `7`.
    - groups: `COMPLETENESS`, `CONSISTENCY`, `TRACEABILITY`, `VALIDATION`, `REVIEW`, `DUPLICATE`, `RELATION_DENSITY`.
    - denominators: `14`, `14`, `3`, `14`, `9`, `14`, `2`.
    - all rows `passed=true`.
    - top-level `no_weighted_composite_score=true`.
    - no missing required fields or tolerance issues.
  - seed proof section: PASS, `/tmp/ontology-wave22-qa-seed.json` contains `mvp4.quality_recompute_proof.metric_rows` with 7 rows and all `passed=true`.
  - Composite score search: PASS. Matches were P0 exclusion docs/tests/markers only; no `QualityMetric`/fixture/UI composite score field was added.
  - Frontend tests: PASS, 4 files / 10 tests.
  - Frontend build: PASS.
  - `smoke:mvp4:mock`: PASS, artifact `/tmp/ontology-wave22-qa-mvp4-mock-smoke/mvp4-mock-route-smoke.json`.
    - quality route assertions include formula numerator, denominator, drilldown target, published graph version context, rate context, and no composite score.
  - `smoke:mvp3:actual`: PASS, artifact `/tmp/ontology-wave22-qa-mvp3-actual-smoke/mvp3-actual-api-smoke.json`.
    - review inbox/workbench, publish queue, published graph, and MVP3 quality summary route/API checks passed.
  - `smoke:mvp4:actual`: PASS, artifact `/tmp/ontology-wave22-qa-mvp4-actual-smoke/mvp4-actual-api-smoke.json`.
    - API quality check covered 7 metric groups and 7 formula-checked metrics.
    - route quality assertions include numerator, denominator, drilldown target, published graph version context, rate context, and no composite score.
    - graph `SAFE_TOO_LARGE`, RAG `INSUFFICIENT_EVIDENCE`, prompt performance, and external `DEV_AUTH` checks passed.
  - Actual OpenAPI export/parse: PASS, `/tmp/ontology-wave22-qa-openapi.json`.
  - Actual OpenAPI critical compare: PASS.
    - OpenAPI `3.1.0`.
    - path count `77`.
    - schema count `171`.
    - missing critical paths `[]`.
    - missing critical schemas `[]`.
    - `QualityMetric` composite score present: `false`.
  - Dev servers stopped; `8014`, `5173`, and `5174` had no listen process after shutdown.
- 실행 중 확인한 절차 이슈:
  - first attempt of `smoke:mvp3:actual` against `/tmp/ontology-wave22-qa-seed.db` failed with `404 REVIEW_TASK_NOT_FOUND`.
  - Root cause: `scripts/verify_mvp4_quality_metrics.py` defaults to `seed_mvp4(reset=True)` unless `--no-reset` is passed, so the proof script reseeded the same DB after `/tmp/ontology-wave22-qa-seed.json` was written.
  - Resolution for QA execution: actual smokes were rerun against a separate fresh DB `/tmp/ontology-wave22-qa-actual.db` and matching seed JSON `/tmp/ontology-wave22-qa-actual-seed.json`.
  - Product verdict impact: none. This was a QA command sequencing issue, not an app regression.
- 실행하지 못한 검증:
  - Docker/PostgreSQL Compose smoke는 기존 P1 environment follow-up이라 실행하지 않았다.

## INT4 판정
| ID | 판정 | 근거 |
|---|---|---|
| `INT4-001` | PASS | Actual OpenAPI critical compare passed with all MVP4 critical paths/schemas present, enums covered by backend tests, and `QualityMetric` has no composite score field. |
| `INT4-002` | PASS | Backend proof artifact and seed proof section cover all seven P0 groups with required fields, non-zero denominators, `passed=true`, and tolerance `0.0001`; Frontend mock/actual smoke verifies numerator, denominator, formula/drilldown/version context, and `NO COMPOSITE SCORE`. |
| `INT4-003` | PASS | Backend MVP4 tests and MVP4 actual smoke continue to cover dataset/golden set runtime, statuses, and route regression. No Wave22 regression observed. |
| `INT4-004` | PASS | Backend MVP4 tests and MVP4 actual smoke cover prompt performance/evaluation rows, failed/success state, and telemetry-unavailable UI state. No Wave22 regression observed. |
| `INT4-005` | PASS | MVP4 actual smoke covers RAG candidate exclusion/insufficient evidence; backend tests cover search/vector/RAG grounding and candidate exclusion. No Wave22 regression observed. |
| `INT4-006` | PASS | MVP4 actual smoke covers graph `SAFE_TOO_LARGE`; backend tests cover graph `READY`, published-only separation, and safe-too-large behavior. No Wave22 regression observed. |
| `INT4-007` | PASS | Backend MVP3 tests pass and `smoke:mvp3:actual` passes against fresh seeded backend/frontend. |
| `INT4-008` | PASS | Backend MVP4 tests cover external graph/source/evidence valid dev-auth reads, missing auth, and write blocking; MVP4 actual smoke covers external `DEV_AUTH` API/docs route. |
| `INT4-009` | NOT RUNNABLE / P1 | PM has not promoted collaboration/SLA into MVP4 P0. Status remains intentionally non-blocking P1. |

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세:
  - QA did not modify Backend API, Frontend DTOs, enum literals, fixtures, or implementation.
  - Observed actual OpenAPI remains aligned with MVP4 critical runtime surface.
  - No weighted composite quality score was added to the P0 `QualityMetric` contract, fixture, proof, or UI.
- 영향받는 역할:
  - PM/Commander: `INT4-002` can be reclassified from PARTIAL to PASS.
  - Backend: proof artifact is accepted as QA evidence. Note that default verifier behavior reseeds the DB unless `--no-reset` is used.
  - Frontend: visible formula/evidence markers are accepted as enough UI trust evidence for `INT4-002`.
  - QA: keep `/tmp/ontology-wave22-qa-*` and `/tmp/ontology-wave22-quality-proof.json` artifacts as local evidence.

## Blocker
- Wave22 P0 blocker: 없음.
- Existing P1 follow-ups remain:
  - Docker/PostgreSQL Compose smoke.
  - broader Playwright suite formalization.
  - collaboration/SLA `INT4-009`.

## 남은 TODO
- No Wave23 hardening wave is required for MVP4 P0 based on this QA closeout.
- Optional Backend follow-up: document that `scripts/verify_mvp4_quality_metrics.py --no-reset` should be used when the caller wants to preserve an already generated seed JSON/DB pair.
- Optional QA follow-up: keep actual smoke DB and proof DB separate, or run verifier with `--no-reset`, to avoid seed-ID drift in future closeout runs.

## 다른 역할에 전달할 내용
- PM:
  - `INT4-002` is now PASS. MVP4 P0 can close with existing P1 follow-ups only.
- Backend:
  - Backend proof artifact `/tmp/ontology-wave22-quality-proof.json` passes the PM closeout schema and tolerance criteria.
  - The verifier default reseed behavior is not a product blocker but should be called out in future QA command notes.
- Frontend:
  - Mock and actual route smoke artifacts verify numerator, denominator, drilldown target, published graph version context, rate context, and no composite score marker.
- QA:
  - Artifacts:
    - `/tmp/ontology-wave22-quality-proof.json`
    - `/tmp/ontology-wave22-quality-proof.pretty.json`
    - `/tmp/ontology-wave22-qa-seed.json`
    - `/tmp/ontology-wave22-qa-actual-seed.json`
    - `/tmp/ontology-wave22-qa-openapi.json`
    - `/tmp/ontology-wave22-qa-openapi-compare.json`
    - `/tmp/ontology-wave22-qa-mvp4-mock-smoke/mvp4-mock-route-smoke.json`
    - `/tmp/ontology-wave22-qa-mvp3-actual-smoke/mvp3-actual-api-smoke.json`
    - `/tmp/ontology-wave22-qa-mvp4-actual-smoke/mvp4-actual-api-smoke.json`

## 총괄에게 요청하는 결정
- Recommend closing MVP4 P0.
- Recommend Wave23 enter MVP5 contract-first planning rather than another focused MVP4 hardening wave.
- Keep `INT4-009`, Docker/PostgreSQL Compose smoke, and broader Playwright formalization as P1 follow-ups unless PM explicitly promotes them.

## 현재 판정
- PASS
