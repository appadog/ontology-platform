# QA Report - Wave 16

## 담당 범위
- backlog ID: `INT3-006`, regression `INT3-001`~`INT3-007`
- 작업 경로:
  - `docs/handoffs/wave-016/QA_REPORT.md`
  - verification-only reads/checks across `docs/api/openapi-mvp3-draft.json`, `apps/frontend`, and `apps/backend`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-016/NEXT_ORDERS.md`
  - `docs/handoffs/wave-016/PM_REPORT.md`
  - `docs/handoffs/wave-016/BACKEND_REPORT.md`
  - `docs/handoffs/wave-016/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-015/QA_REPORT.md`
  - `docs/api/openapi-mvp3-draft.json`
  - `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- `docs/api/openapi-mvp3-draft.json`을 JSON parse하고 path/schema count 및 frozen enum을 재확인했다.
- Wave 15 DTO drift 목록을 Backend actual OpenAPI와 Frontend API DTO/mock/page/test/view-model helper에 대해 재검증했다.
- `QualitySummary`, `PublishJob`, `PublishedGraphVersion`, `PublishedLineage`, `PublishedEntity`, `PublishedRelation`의 OpenAPI schema property와 Frontend TypeScript API DTO property를 기계적으로 비교했다.
- MVP3 mock route smoke를 5개 요구 route에서 재실행했다.
- Frontend test/build, Backend focused MVP3 test, MVP2 actual API regression smoke를 재실행했다.
- MVP3 actual API route smoke 가능 여부를 검토하고 deterministic MVP3 seed 부재를 분리 판정했다.

## 변경 파일
- `docs/handoffs/wave-016/QA_REPORT.md`
- 앱 코드, Backend/Frontend 구현 파일, API artifact는 수정하지 않았다.

## 실행/검증
- 실행한 명령:
  - `node --input-type=module <<'NODE' ... JSON.parse('docs/api/openapi-mvp3-draft.json') ... NODE`
  - `rg -n "publish_queue" apps/frontend/src/shared/api/types.ts apps/frontend/src/shared/mocks/mvp3Fixtures.ts apps/frontend/src/shared/api/mvp3Mock.test.ts apps/frontend/src/pages/QualityDashboardPage.tsx apps/frontend/src/pages/PublishQueuePage.tsx apps/frontend/src/pages/PublishedGraphExplorerPage.tsx apps/frontend/src/pages/mvp3Shared.tsx`
  - `node --input-type=module <<'NODE' ... OpenAPI schema properties vs TypeScript API DTO properties ... NODE`
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/frontend && npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - Playwright one-off MVP3 mock route smoke for:
    - `/projects/project-corp-knowledge/review`
    - `/projects/project-corp-knowledge/review/review-task-clean-entity`
    - `/projects/project-corp-knowledge/publish`
    - `/projects/project-corp-knowledge/published-graph`
    - `/projects/project-corp-knowledge/quality`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave16-mvp2-regression.db .venv/bin/alembic upgrade head`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave16-mvp2-regression.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8016`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8016 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP2_API_BASE_URL=http://127.0.0.1:8016 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave16-mvp2-regression-smoke npm run smoke:mvp2:actual`
- 결과:
  - OpenAPI parse PASS:
    - `openapi=3.1.0`, `version=0.1.0`, `51 paths`, `108 schemas`
    - `ValidationResultSeverity`: `INFO`, `WARNING`, `FAILED`
    - `ReviewDecisionType`: `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`
    - `PublishEligibilityReasonCode`: `ELIGIBLE`, `NOT_APPROVED_OR_MODIFIED`, `PENDING`, `REJECTED`, `NEEDS_DISCUSSION`, `MISSING_EVIDENCE`, `BROKEN_EVIDENCE`, `FAILED_VALIDATION`, `WARNING_REASON_REQUIRED`, `ALREADY_PUBLISHED`, `ONTOLOGY_VERSION_MISMATCH`, `PUBLISH_PERMISSION_REQUIRED`, `CORRECTION_DIFF_REQUIRED`
    - `QualityDrilldownTarget`: `review_inbox`, `publish_jobs`, `published_graph`
  - Wave 15 DTO drift recheck PASS:
    - `QualityDrilldownTarget` uses `publish_jobs`; `publish_queue` is absent from MVP3 API DTO/mocks/pages/tests except no matches.
    - `QualitySummary.candidate_counts`, `validation_counts`, `publish_counts`, and `rates` match OpenAPI field names.
    - `PublishJob`, `PublishedGraphVersion`, `PublishedLineage`, `PublishedEntity`, and `PublishedRelation` TypeScript API DTO fields match OpenAPI schema properties with no missing/extra fields in the comparison script.
    - UI-only display/progress fields are derived in `apps/frontend/src/pages/mvp3Shared.tsx` helpers, not mixed into API DTO interfaces.
    - Old alias strings such as `version_number`, `graph_version_id`, `publish_rate`, `selected_candidate_count`, `eligibility_summary`, `result_version_id`, and `finished_at` only appeared in negative `not.toHaveProperty` assertions or unrelated DOM state text.
  - Frontend tests PASS: `2 passed`, `7 tests`.
  - Frontend build PASS: TypeScript and Vite production build completed.
  - Backend focused MVP3 tests PASS: `3 passed in 1.47s`.
  - MVP3 mock route smoke PASS: all five routes returned HTTP `200`, rendered expected route text, and rendered `Review to published facts`.
  - MVP2 actual API regression smoke PASS after using CORS-allowed frontend port `5173`:
    - artifact JSON: `/tmp/ontology-wave16-mvp2-regression-smoke/mvp2-actual-api-smoke.json`
    - route, screenshot, and mobile overflow checks passed.
- 실행하지 못한 검증:
  - MVP3 actual API route smoke was not run. Backend runtime tests create deterministic MVP3 data in-process, but there is no cross-process deterministic MVP3 seed/smoke script or stable project id such as `project-corp-knowledge` for the actual frontend routes.
  - Docker Compose/PostgreSQL smoke remains outside this Wave16 QA scope and within the existing environment exception.
- 주의:
  - First MVP3 mock route smoke attempt used an incorrect guessed heading for the workbench route. The route returned HTTP `200` and rendered the workflow marker; rerun with actual `Review Workbench` heading passed.
  - First optional MVP2 actual smoke attempt used frontend port `5174` and failed on CORS. Rerun on port `5173`, which matches the backend dev CORS origin, passed.

## INT3 판정
| ID | Verdict | 근거 |
|---|---|---|
| `INT3-001` Validation contract review | PASS | OpenAPI parse/frozen enums still PASS; Backend focused MVP3 tests still PASS. |
| `INT3-002` Review decision flow smoke | PASS | Backend focused MVP3 tests cover decisions, corrections, reason/diff rules, and audit trail. MVP3 review/workbench mock routes render. |
| `INT3-003` Publish-only-approved smoke | PASS | Backend focused MVP3 tests cover publish eligibility positives/negatives and frozen reason codes. Publish mock route renders. |
| `INT3-004` Published graph separation/current snapshot | PASS | Backend focused MVP3 tests verify published graph separation/current snapshot behavior. Published graph mock route renders with OpenAPI field names. |
| `INT3-005` Audit trail verification | PASS | Backend focused MVP3 tests assert correction/review/publish audit coverage. |
| `INT3-006` Quality dashboard consistency | PASS for contract/mock consistency | Wave 15 DTO drift is closed: OpenAPI and Frontend API DTO/mock/page/test shapes align for quality, publish jobs, and published graph. Quality dashboard mock route renders. Actual API route smoke remains a follow-up because deterministic MVP3 seed data is not available cross-process. |
| `INT3-007` MVP2 regression | PASS | Frontend test/build PASS, Backend focused MVP3 regression PASS, and MVP2 actual API browser smoke PASS against temp SQLite backend and actual frontend mode. |

## API/Enum/DTO 변경
- 변경 여부: 없음 by QA.
- 상세:
  - QA did not modify API, enum, DTO, Backend, or Frontend implementation files.
  - `docs/api/openapi-mvp3-draft.json` remains the Wave16 source of truth and parses as `51 paths` / `108 schemas`.
  - No Backend contract bug was found.
  - Frontend API DTOs now match the OpenAPI field names for the Wave 15 drift list:
    - `QualitySummary.candidate_counts`: `total`, `entity`, `relation`, `property_value`, `missing_evidence`
    - `QualitySummary.validation_counts`: `not_validated`, `passed`, `warning`, `failed`, `by_rule_code`
    - `QualitySummary.publish_counts`: `not_published`, `published`, `rolled_back`, `published_entities`, `published_relations`, `publish_success`, `publish_failed`, `current_version_id`, `current_version`
    - `QualitySummary.rates`: `approval_rate`, `rejection_rate`, `modification_rate`, `validation_failure_rate`, `evidence_missing_rate`, `published_ratio`
    - `QualityDrilldownTarget`: `publish_jobs`, not `publish_queue`
    - `PublishJob`: actual API fields, with display progress/result labels derived in view-model helper
    - `PublishedGraphVersion`: `version`, `is_current`, `summary`
    - `PublishedLineage`: `published_graph_version_id`, `published_graph_version`, `review_decision_id`, `review_decision_type`
    - `PublishedEntity` / `PublishedRelation`: actual API field names in types, mocks, and pages
- 영향받는 역할:
  - Backend: no API change requested. Optional deterministic MVP3 seed/smoke helper would improve future actual API route verification.
  - Frontend: keep API DTOs OpenAPI-shaped; add display-only fields only through typed view-model helpers.
  - QA: future actual API route smoke should use deterministic MVP3 seed/setup before becoming a hard gate.

## Blocker
- Current Wave16 blocker: 없음.
- Follow-up, not a Wave16 blocker:
  - Deterministic cross-process MVP3 seed/smoke data is missing for actual frontend API route smoke. Link to Backend/QA follow-up: extract the setup flow from `apps/backend/tests/test_mvp3_api.py` into a small seed/smoke helper or add an equivalent QA harness. This should remain a follow-up until actual API route smoke is required as a hard gate; `INT3-006` can pass contract/mock consistency without it.

## 남은 TODO
- Backend:
  - Optional: add `scripts/seed_mvp3.py` or documented deterministic MVP3 smoke setup using the existing `tests/test_mvp3_api.py` fixture flow.
- Frontend:
  - No remaining Wave15 DTO drift found for Quality/Publish/PublishedGraph.
- QA:
  - Run MVP3 actual API route smoke once deterministic MVP3 seed data exists.
  - Keep MVP2 actual API smoke on frontend port `5173` unless backend CORS settings are expanded.

## 다른 역할에 전달할 내용
- PM:
  - No new product/API policy decision is required for `INT3-006`.
  - Treat Wave16 DTO sync as closed for contract/mock consistency.
- Backend:
  - Focused MVP3 backend tests PASS. No contract bug found.
  - Deterministic MVP3 seed is recommended as a follow-up, not a current blocker.
- Frontend:
  - Wave 15 DTO drift list is closed. `mvp3Mock.test.ts` now guards old-alias regression.
  - UI-only progress/result/version label fields are correctly isolated in typed view-model helpers.
- QA:
  - Reuse `/tmp/ontology-wave16-mvp2-regression-smoke/mvp2-actual-api-smoke.json` for Wave16 MVP2 regression trace.

## 총괄에게 요청하는 결정
- Accept `INT3-006` as PASS for Wave16 contract/mock consistency.
- Track deterministic MVP3 actual API seed/smoke as a Backend/QA follow-up before requiring actual MVP3 frontend route smoke as a hard gate.

## 현재 판정
- PASS
