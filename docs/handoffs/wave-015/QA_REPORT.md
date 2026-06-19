# QA Report - Wave 15

## 담당 범위
- backlog ID: `INT3-001`, `INT3-002`, `INT3-003`, `INT3-004`, `INT3-005`, `INT3-006`, `INT3-007`
- 작업 경로:
  - `docs/handoffs/wave-015/QA_REPORT.md`
  - verification-only reads/checks across `docs/api/openapi-mvp3-draft.json`, `apps/backend`, and `apps/frontend`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-015/NEXT_ORDERS.md`
  - `docs/handoffs/wave-015/PM_REPORT.md`
  - `docs/handoffs/wave-015/BACKEND_REPORT.md`
  - `docs/handoffs/wave-015/FRONTEND_REPORT.md`
  - `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
  - `docs/api/openapi-mvp3-draft.json`
  - `docs/api/MVP3_API_CONTRACT_DRAFT.md`
  - `docs/pm/MVP3_PREP_BRIEF.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- `docs/api/openapi-mvp3-draft.json`을 JSON parse하고 frozen enum/shape를 확인했다.
- Backend focused MVP3 tests, full backend tests, ruff, fresh OpenAPI export compare를 실행했다.
- Frontend full tests, production build, MVP3 route smoke를 실행했다.
- Existing MVP2 actual API browser smoke를 temp SQLite DB와 local backend/frontend dev server로 실행해 regression을 확인했다.
- Backend actual OpenAPI와 Frontend mock DTO expectations를 가능한 범위에서 비교했다.

## 변경 파일
- `docs/handoffs/wave-015/QA_REPORT.md`
- 앱 코드, Backend/Frontend 구현 파일, API artifact는 수정하지 않았다.

## 실행/검증
- 실행한 명령:
  - `node <<'NODE' ... JSON.parse(openapi-mvp3-draft.json) ...`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/backend && .venv/bin/pytest`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output /tmp/openapi-mvp3-qa-verify.json && cmp -s /tmp/openapi-mvp3-qa-verify.json ../../docs/api/openapi-mvp3-draft.json`
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - Playwright MVP3 mock route smoke for:
    - `/projects/project-corp-knowledge/review`
    - `/projects/project-corp-knowledge/review/review-task-clean-entity`
    - `/projects/project-corp-knowledge/publish`
    - `/projects/project-corp-knowledge/published-graph`
    - `/projects/project-corp-knowledge/quality`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave15-mvp2-regression.db .venv/bin/alembic upgrade head`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave15-mvp2-regression.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP2_API_BASE_URL=http://127.0.0.1:8000 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave15-mvp2-regression-smoke npm run smoke:mvp2:actual`
  - Backend OpenAPI vs Frontend DTO comparison scripts for `QualitySummary`, `PublishJob`, `PublishedGraphVersion`, `PublishedEntity`, `PublishedRelation`, and `PublishedLineage`
- 결과:
  - OpenAPI parse/frozen assertion PASS:
    - `openapi=3.1.0`, `version=0.1.0`, `51 paths`, `108 schemas`
    - `ValidationResultSeverity`: `INFO`, `WARNING`, `FAILED`
    - `ReviewDecisionType`: `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`
    - `PublishEligibilityReasonCode`: 13 frozen reason codes
    - `ReviewTaskListResponse`: `items,total_count,limit,offset`
    - `QualitySummary`: `project_id,ontology_version_id,generated_at,candidate_counts,validation_counts,review_counts,publish_counts,rates`
    - `ValidationResult`: `field_path`, `blocking`, `suggested_fix`
  - Focused backend MVP3 tests PASS: `3 passed in 1.18s`.
  - Full backend tests PASS: `14 passed in 1.64s`.
  - Backend ruff PASS: `All checks passed!`.
  - Fresh OpenAPI export compare PASS: `cmp -s` exit `0`.
  - Frontend tests PASS: `2 passed`, `6 tests`.
  - Frontend build PASS: TypeScript plus Vite production build completed.
  - MVP3 mock route smoke PASS: all 5 requested routes rendered expected heading and `Review to published facts` marker.
  - MVP2 actual API browser smoke PASS:
    - artifact JSON: `/tmp/ontology-wave15-mvp2-regression-smoke/mvp2-actual-api-smoke.json`
    - screenshots: `/tmp/ontology-wave15-mvp2-regression-smoke/*.png`
    - route smoke covered dashboard, project/source, profile, chunks, extraction job, candidates, normal evidence, broken evidence, and direct missing evidence fallback.
    - mobile overflow checks passed at `390x900`.
- 실행하지 못한 검증:
  - Docker Compose/PostgreSQL smoke는 기존 환경 예외 범위라 실행하지 않았다.
  - MVP3 Frontend actual API route smoke는 수행하지 않았다. Mock route smoke는 PASS이나, 아래 DTO mismatch 때문에 actual API integration은 아직 closeout 불가로 판정한다.
- 주의:
  - 첫 Playwright one-off command는 Node stdin CommonJS wrapper 때문에 `await is only valid in async functions and the top level bodies of modules`로 실패했다. `node --input-type=module`로 동일 assertion을 재실행해 PASS했다. 앱 결함은 아니다.

## INT3 판정
| ID | Verdict | 근거 |
|---|---|---|
| `INT3-001` Validation contract review | PASS | OpenAPI validation paths/enums/UI fields PASS. Backend MVP3 tests create validation jobs/results and assert warning/failed publish behavior. |
| `INT3-002` Review decision flow smoke | PASS | Backend tests cover `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`, `REASON_REQUIRED`, `CORRECTION_DIFF_REQUIRED`, correction storage, unchanged raw payload, and audit events. Frontend mock workbench route renders. |
| `INT3-003` Publish-only-approved smoke | PASS | Backend tests cover clean approved entity, modified relation, warning-with-reason positive publish, and pending/rejected/needs-discussion/failed/missing/broken/warning-without-reason/already-published reason codes. |
| `INT3-004` Published graph separation/current snapshot | PASS | Backend tests verify current snapshot contains only published rows, excludes missing/broken/warning-without-reason candidates, uses corrected relation snapshot, and returns already-published idempotency after publish. Frontend mock published graph route renders. |
| `INT3-005` Audit trail verification | PASS | Backend tests assert correction and review decision audit, project audit events for validation and publish, and original/corrected snapshot separation. |
| `INT3-006` Quality dashboard consistency | PARTIAL | Backend/OpenAPI typed quality summary PASS and backend runtime summary assertions PASS. Frontend mock dashboard route PASS, but Frontend mock DTO uses non-frozen nested metric names and drilldown target `publish_queue`, so actual API integration is not contract-clean. |
| `INT3-007` MVP2 regression | PASS | Full backend tests PASS, frontend test/build PASS, existing MVP2 actual API browser smoke PASS against local temp SQLite backend and actual API frontend mode. `docs/api/openapi-mvp2-draft.json` was not modified by QA. |

## API/Enum/DTO 변경
- 변경 여부: 없음 by QA.
- 상세:
  - QA verified Backend actual OpenAPI matches `docs/api/openapi-mvp3-draft.json`.
  - QA found Frontend mock DTO drift from Backend actual OpenAPI in MVP3 actual integration surfaces:
    - `QualitySummary.candidate_counts`: API uses `entity`, `relation`, `property_value`, `missing_evidence`; Frontend uses `entities`, `relations` and omits `property_value`, `missing_evidence`.
    - `QualitySummary.validation_counts`: API uses `not_validated`, `passed`, `warning`, `failed`, `by_rule_code`; Frontend omits `not_validated`, `by_rule_code` and adds `missing_evidence`.
    - `QualitySummary.publish_counts`: API includes `rolled_back`, `publish_success`, `publish_failed`, `current_version_id`, `current_version`; Frontend omits these.
    - `QualitySummary.rates`: API uses `validation_failure_rate`, `evidence_missing_rate`, `published_ratio`; Frontend uses `publish_rate`.
    - `QualityDrilldownTarget`: API uses `publish_jobs`; Frontend uses `publish_queue`.
    - `PublishJob`: API uses `ontology_version_id`, `requested_by`, `candidate_refs`, `eligible_count`, `skip_reasons`, `published_graph_version_id`, `ended_at`; Frontend mock type uses display/progress fields such as `progress`, `selected_candidate_count`, `eligibility_summary`, `result_version_id`, `finished_at`.
    - `PublishedGraphVersion`: API uses `version`, `is_current`, `summary`; Frontend uses `version_number`, `current`.
    - `PublishedLineage`: API uses `published_graph_version_id`, `published_graph_version`, `review_decision_id`, `review_decision_type`; Frontend uses `graph_version_id`, `graph_version_number`, `decision_id`, `decision`.
- 영향받는 역할:
  - Frontend: `FE3-006` and support `FE3-008` need actual OpenAPI DTO sync before MVP3 actual API smoke can be marked PASS.
  - Backend: no contract blocker found; actual export is fresh and stable.
  - PM: no new literal decision required unless PM wants to accept frontend display DTO adapters as a separate view-model layer. The actual API contract itself is clear.

## Blocker
- P0 for Wave 15 closeout:
  - Frontend actual API contract sync is incomplete for Quality/Publish/PublishedGraph DTOs. Link: `FE3-006`, `FE3-008`, `INT3-006`.
- Not a blocker:
  - Backend runtime/API tests pass.
  - Frontend mock-first route smoke passes.
  - Docker/PostgreSQL compose smoke remains a known environment/tooling exception, not an MVP3 thin-slice product blocker.

## 남은 TODO
- Frontend:
  - Align `apps/frontend/src/shared/api/types.ts`, mocks, and pages to actual OpenAPI field names for `QualitySummary`, `PublishJob`, `PublishedGraphVersion`, `PublishedEntity`, `PublishedRelation`, and `PublishedLineage`, or add a clearly typed adapter that maps API DTOs to UI view models.
  - After DTO sync, run MVP3 routes with `VITE_USE_MOCK_API=false` against local backend and deterministic data.
- Backend:
  - Continue exporting `docs/api/openapi-mvp3-draft.json` from FastAPI as the actual artifact.
  - Optional: provide seeded MVP3 demo fixture endpoint or script to make Frontend actual MVP3 route smoke repeatable.
- QA:
  - Re-run `INT3-006` and MVP3 actual API route smoke once Frontend DTO sync lands.
  - Keep existing MVP2 actual smoke as regression guard for Wave 16.

## 다른 역할에 전달할 내용
- PM:
  - Frozen contract is coherent. No PM enum/literal decision is blocking QA.
  - Wave 15 should be accepted as `PARTIAL`: backend/runtime and frontend mock-first are usable, but actual frontend API integration is not complete.
- Backend:
  - Backend PASS. `tests/test_mvp3_api.py` gives strong coverage for validation, review, correction, publish, published graph, audit, and quality.
  - Fresh OpenAPI export matches checked-in MVP3 artifact.
- Frontend:
  - Mock route smoke PASS, but the mock DTO shape is not a faithful mirror of actual MVP3 OpenAPI for quality and published graph surfaces.
  - Do not rely on current mock-only `QualitySummary` field names for actual API mode.
- QA:
  - Reuse `/tmp/ontology-wave15-mvp2-regression-smoke` evidence for MVP2 regression trace.
  - Generated/ignored artifacts observed: `apps/backend/**/__pycache__`, `apps/backend/.pytest_cache`, `apps/backend/.ruff_cache`, `apps/frontend/dist`, temp DB `/tmp/ontology-wave15-mvp2-regression.db`, OpenAPI temp export `/tmp/openapi-mvp3-qa-verify.json`, and smoke artifacts under `/tmp/ontology-wave15-mvp2-regression-smoke`.

## 총괄에게 요청하는 결정
- Wave 16 should prioritize Frontend actual API DTO sync for `FE3-006`/`FE3-008` before broadening MVP3 UI polish.
- Accept Backend MVP3 thin runtime as PASS.
- Accept Frontend MVP3 mock-first flow as PASS for mock UX only, not actual API integration.

## 현재 판정
- PARTIAL
