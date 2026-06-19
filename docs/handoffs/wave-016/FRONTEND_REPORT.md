# Frontend Report - Wave 16

## 담당 범위
- backlog ID: `FE3-006`, `FE3-007`, `FE3-008`, support `INT3-006`
- 작업 경로:
  - `apps/frontend/src/shared/api/types.ts`
  - `apps/frontend/src/shared/api/client.ts`
  - `apps/frontend/src/shared/api/queries.ts`
  - `apps/frontend/src/shared/api/mvp3Mock.test.ts`
  - `apps/frontend/src/shared/mocks/mvp3Fixtures.ts`
  - `apps/frontend/src/pages/QualityDashboardPage.tsx`
  - `apps/frontend/src/pages/PublishQueuePage.tsx`
  - `apps/frontend/src/pages/PublishedGraphExplorerPage.tsx`
  - `apps/frontend/src/pages/mvp3Shared.tsx`
  - `docs/handoffs/wave-016/FRONTEND_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-016/NEXT_ORDERS.md`
  - `docs/handoffs/wave-016/PM_REPORT.md`
  - `docs/handoffs/wave-016/BACKEND_REPORT.md`
  - `docs/handoffs/wave-015/QA_REPORT.md`
  - `docs/api/openapi-mvp3-draft.json`
  - `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
  - `02_FRONTEND_AGENT_SKILL.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- Backend actual OpenAPI를 기준으로 MVP3 Quality/Publish/PublishedGraph frontend API DTO를 동기화했다.
- `QualityDrilldownTarget`을 `publish_jobs` canonical literal로 교체했다.
- `QualitySummary` nested groups를 OpenAPI field names에 맞췄다:
  - `candidate_counts`: `total`, `entity`, `relation`, `property_value`, `missing_evidence`
  - `validation_counts`: `not_validated`, `passed`, `warning`, `failed`, `by_rule_code`
  - `publish_counts`: `not_published`, `published`, `rolled_back`, `published_entities`, `published_relations`, `publish_success`, `publish_failed`, `current_version_id`, `current_version`
  - `rates`: `approval_rate`, `rejection_rate`, `modification_rate`, `validation_failure_rate`, `evidence_missing_rate`, `published_ratio`
- `PublishJob`을 actual API fields로 정렬했다:
  - `ontology_version_id`, `requested_by`, `candidate_refs`, `eligible_count`, `skip_reasons`, `published_graph_version_id`, `ended_at`
  - UI progress/selected count/reason summary/result link는 `toPublishJobView` view-model helper에서 파생하도록 분리했다.
- `PublishedGraphVersion`, `PublishedLineage`, `PublishedEntity`, `PublishedRelation`, `PublishedGraphSnapshot`을 actual API field names로 정렬했다.
  - UI label/source-target display는 `toPublishedGraphView` helper에서 파생한다.
- `PublishEligibility`도 `PublishJob.skip_reasons`에 쓰이는 actual API shape로 맞췄다.
- mock fixtures를 API-shaped DTO로 갱신했다.
- `mvp3Mock.test.ts`에 OpenAPI-critical field-name assertions를 추가해 old alias drift를 방지했다.

## 변경 파일
- `apps/frontend/src/shared/api/types.ts`
- `apps/frontend/src/shared/api/client.ts`
- `apps/frontend/src/shared/api/queries.ts`
- `apps/frontend/src/shared/api/mvp3Mock.test.ts`
- `apps/frontend/src/shared/mocks/mvp3Fixtures.ts`
- `apps/frontend/src/pages/QualityDashboardPage.tsx`
- `apps/frontend/src/pages/PublishQueuePage.tsx`
- `apps/frontend/src/pages/PublishedGraphExplorerPage.tsx`
- `apps/frontend/src/pages/mvp3Shared.tsx`
- `docs/handoffs/wave-016/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `npm run test`
  - `npm run build`
  - `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - Playwright one-off MVP3 mock route smoke for:
    - `/projects/project-corp-knowledge/review`
    - `/projects/project-corp-knowledge/review/review-task-clean-entity`
    - `/projects/project-corp-knowledge/publish`
    - `/projects/project-corp-knowledge/published-graph`
    - `/projects/project-corp-knowledge/quality`
  - `git diff --check -- apps/frontend docs/handoffs/wave-016/FRONTEND_REPORT.md`
- 결과:
  - `npm run test` PASS: `2 passed`, `7 tests`.
  - `npm run build` PASS: TypeScript and Vite production build completed.
  - MVP3 mock route smoke PASS: all five routes returned HTTP `200`, rendered expected headings, and rendered `Review to published facts` workflow marker.
  - `git diff --check` PASS.
- 실행하지 못한 검증:
  - MVP3 actual API route smoke was not run. Backend Wave 16 confirmed the API is stable but did not add a deterministic MVP3 seed/smoke script. A fresh local actual backend would not have the required project/review/publish fixture data for the five route checks, so marking actual API smoke PASS would be fabricated.

## API/Enum/DTO 변경
- 변경 여부: 있음, Frontend DTO sync only.
- 상세:
  - Backend API artifact `docs/api/openapi-mvp3-draft.json` was not changed.
  - Backend files were not edited.
  - Frontend API DTOs now mirror the Wave16 source-of-truth OpenAPI names for Quality/Publish/PublishedGraph surfaces.
  - UI-only display/progress/version label fields are now derived by typed view-model helpers instead of being mixed into API DTOs.
  - Closed Wave15 QA drift items:
    1. `QualityDrilldownTarget`: `publish_jobs` is used; `publish_queue` removed from API DTO/mocks/pages.
    2. `QualitySummary.candidate_counts`: `entity`, `relation`, `property_value`, `missing_evidence` added; `entities`/`relations` removed.
    3. `QualitySummary.validation_counts`: `not_validated` and `by_rule_code` added; frontend-only `missing_evidence` removed from validation group.
    4. `QualitySummary.publish_counts`: `rolled_back`, `publish_success`, `publish_failed`, `current_version_id`, `current_version` added.
    5. `QualitySummary.rates`: `validation_failure_rate`, `evidence_missing_rate`, `published_ratio` used; API DTO `publish_rate` removed.
    6. `PublishJob`: OpenAPI fields aligned; UI progress/result aliases moved to view model.
    7. `PublishedGraphVersion`: `version`, `is_current`, `summary` used.
    8. `PublishedLineage`: `published_graph_version_id`, `published_graph_version`, `review_decision_id`, `review_decision_type` used.
    9. `PublishedEntity` / `PublishedRelation`: actual API field names used in types, mocks, and pages.
    10. Derived labels/progress/counts are isolated in `mvp3Shared.tsx` helpers.
- 영향받는 역할:
  - QA: re-run `INT3-006` DTO parity and MVP3 actual API smoke if/when deterministic seed data is available.
  - Backend: no API change requested.
  - PM: no new product decision requested.

## Blocker
- Frontend code blocker: 없음.
- Actual API route smoke blocker: deterministic MVP3 actual API seed/smoke data is not available in this wave. Backend report suggests extracting the fixture flow from `apps/backend/tests/test_mvp3_api.py` later if cross-process FE smoke needs repeatable data.

## 남은 TODO
- QA:
  - Re-run OpenAPI-vs-Frontend DTO parity for `INT3-006`.
  - Run MVP3 actual API route smoke once seed data or a setup script exists.
- Frontend:
  - No known DTO drift remains for the Wave15 Quality/Publish/PublishedGraph finding list.

## 다른 역할에 전달할 내용
- PM:
  - No new policy/literal decision was needed.
- Backend:
  - No backend change requested. A deterministic MVP3 seed/smoke helper would make future actual API frontend route smoke repeatable.
- Frontend:
  - Keep API DTOs OpenAPI-shaped. Add UI display fields only through typed view-model helpers.
- QA:
  - `mvp3Mock.test.ts` now asserts OpenAPI-critical field names and old-alias absence for the drift list.
  - Mock route smoke is PASS; actual API smoke remains not run due missing deterministic data.

## 총괄에게 요청하는 결정
- None for DTO sync.
- Optional future decision: whether Backend should add a deterministic MVP3 seed/smoke helper before QA requires actual API route smoke as a hard gate.

## 현재 판정
- PASS
