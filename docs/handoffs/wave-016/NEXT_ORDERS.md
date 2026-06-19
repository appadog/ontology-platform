# Next Orders - Wave 16

## 현재 단계 판정

- Previous wave: `wave-015`
- Previous status: `MVP 3 THIN SLICE PARTIAL`
- Current wave: `wave-016`
- Current status: `MVP 3 ACTUAL API DTO SYNC HARDENING`

## 총괄 결정

- Backend MVP 3 runtime thin slice는 PASS로 수용한다.
- Frontend MVP 3 mock-first product workflow는 PASS로 수용한다.
- Wave 15 전체는 `PARTIAL`이다.
- 이유: `INT3-006` Quality dashboard consistency가 Frontend actual API DTO drift로 PARTIAL이다.
- Wave 16은 새 기능 확장이 아니라 Frontend actual API contract sync hardening이다.

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- `AGENTS.md`, `docs/handoffs/CURRENT_STATE.md`, 이 문서, `docs/handoffs/wave-015/QA_REPORT.md`, `docs/api/openapi-mvp3-draft.json`, `docs/backlog/INT3_MVP3_ACCEPTANCE.md`를 먼저 확인한다.
- 작업 종료 전 반드시 지정 report path에 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- MVP 3 actual API source of truth는 `docs/api/openapi-mvp3-draft.json`이다.
- 후보 그래프와 게시 그래프 분리, original/corrected snapshot 분리, publish eligibility reason code 직접 사용 원칙을 유지한다.

## 이번 wave의 핵심 blocker

QA Wave 15가 아래 DTO drift를 발견했다.

- `QualitySummary.candidate_counts`
  - API: `entity`, `relation`, `property_value`, `missing_evidence`
  - Frontend: `entities`, `relations`, missing `property_value`, `missing_evidence`
- `QualitySummary.validation_counts`
  - API: `not_validated`, `passed`, `warning`, `failed`, `by_rule_code`
  - Frontend: missing `not_validated`, `by_rule_code`, extra `missing_evidence`
- `QualitySummary.publish_counts`
  - API: `rolled_back`, `publish_success`, `publish_failed`, `current_version_id`, `current_version`
  - Frontend: missing these fields
- `QualitySummary.rates`
  - API: `validation_failure_rate`, `evidence_missing_rate`, `published_ratio`
  - Frontend: `publish_rate`
- `QualityDrilldownTarget`
  - API: `publish_jobs`
  - Frontend: `publish_queue`
- `PublishJob`
  - API: `ontology_version_id`, `requested_by`, `candidate_refs`, `eligible_count`, `skip_reasons`, `published_graph_version_id`, `ended_at`
  - Frontend: mock display/progress fields such as `progress`, `selected_candidate_count`, `eligibility_summary`, `result_version_id`, `finished_at`
- `PublishedGraphVersion`
  - API: `version`, `is_current`, `summary`
  - Frontend: `version_number`, `current`
- `PublishedLineage`
  - API: `published_graph_version_id`, `published_graph_version`, `review_decision_id`, `review_decision_type`
  - Frontend: `graph_version_id`, `graph_version_number`, `decision_id`, `decision`

## 진행 순서

1. PM: Confirm no new product decision is needed; freeze Backend actual OpenAPI as source for this sync.
2. Backend: Keep contract stable; provide optional deterministic smoke/seed support only if needed.
3. Frontend: Align DTOs, mocks, pages, and tests to actual OpenAPI or add typed API-to-view-model adapters.
4. QA: Re-run `INT3-006`, MVP3 route smoke, frontend tests/build, backend regression, MVP2 regression guard.

## PM 지시

- Report path: `docs/handoffs/wave-016/PM_REPORT.md`
- Backlog IDs: `PM3-004`, support `FE3-006`, `FE3-008`, `INT3-006`
- 해야 할 일:
  - Wave 15 QA drift를 검토한다.
  - 이번 sync의 source of truth가 Backend actual OpenAPI임을 명시한다.
  - DTO drift를 제품 정책 변경으로 보지 말고 implementation sync로 처리할지 확정한다.
  - `QualityDrilldownTarget`은 API literal `publish_jobs`를 canonical로 유지할지 확인한다.
  - PM 결정이 필요 없다면 그 사실을 명시하고 Frontend/QA가 바로 움직이게 한다.
- 산출물:
  - `docs/handoffs/wave-016/PM_REPORT.md`
  - 필요 시 `docs/pm/MVP3_PREP_BRIEF.md`에 짧은 note
- 완료 기준:
  - Frontend가 “API를 바꿀지, UI adapter를 둘지” 판단할 수 있다.

## Backend 지시

- Report path: `docs/handoffs/wave-016/BACKEND_REPORT.md`
- Backlog IDs: support `BE3-007`, `BE3-008`, `BE3-010`, `INT3-006`
- 해야 할 일:
  - `docs/api/openapi-mvp3-draft.json`이 actual FastAPI export와 계속 일치하는지 확인한다.
  - Wave 15 QA drift 항목 중 Backend contract bug가 있는지 검토한다.
  - 가능하면 MVP3 actual FE smoke를 위한 deterministic seed/script 또는 documented fixture path를 제안한다.
  - Backend API 변경은 하지 않는다 unless contract bug is proven. 변경 시 PM/QA에 명시한다.
- 산출물:
  - `docs/handoffs/wave-016/BACKEND_REPORT.md`
- 검증:
  - focused MVP3 backend tests
  - OpenAPI export compare
- 완료 기준:
  - Backend actual contract가 stable인지, Frontend가 adapter sync만 하면 되는지 보고한다.

## Frontend 지시

- Report path: `docs/handoffs/wave-016/FRONTEND_REPORT.md`
- Backlog IDs: `FE3-006`, `FE3-007`, `FE3-008`, support `INT3-006`
- 해야 할 일:
  - `apps/frontend/src/shared/api/types.ts`를 actual OpenAPI에 맞춘다.
  - `QualityDrilldownTarget`을 `publish_jobs`로 맞춘다.
  - `QualitySummary` nested metric names를 actual API와 맞춘다.
  - `PublishJob`, `PublishedGraphVersion`, `PublishedLineage`, `PublishedEntity`, `PublishedRelation` 타입을 actual API field names와 맞춘다.
  - UI가 필요로 하는 display/progress 필드는 API DTO에 섞지 말고 typed view-model adapter/helper로 분리한다.
  - mocks/fixtures/tests/pages를 새 타입에 맞춰 갱신한다.
  - Quality dashboard, Publish queue, Published graph explorer가 새 API shape에서도 깨지지 않게 한다.
  - 가능하면 `VITE_USE_MOCK_API=false` actual API mode에서 MVP3 route smoke 준비 또는 부분 실행한다. Backend seed 부재로 불가능하면 정확히 보고한다.
- 검증:
  - `npm run test`
  - `npm run build`
  - MVP3 route smoke
  - 가능한 경우 actual API smoke
- 완료 기준:
  - `INT3-006`을 막던 DTO drift가 사라진다.
  - mock fixtures가 actual OpenAPI field names를 반영한다.

## QA 지시

- Report path: `docs/handoffs/wave-016/QA_REPORT.md`
- Backlog IDs: `INT3-006`, regression `INT3-001`~`INT3-007`
- 선행 조건:
  - `docs/handoffs/wave-016/PM_REPORT.md`
  - `docs/handoffs/wave-016/BACKEND_REPORT.md`
  - `docs/handoffs/wave-016/FRONTEND_REPORT.md`
- 해야 할 일:
  - Wave 15 DTO drift 항목이 닫혔는지 확인한다.
  - Frontend mock DTO와 Backend actual OpenAPI를 다시 비교한다.
  - `INT3-006` Quality dashboard consistency를 재판정한다.
  - MVP3 mock route smoke와 가능한 actual API smoke를 수행한다.
  - Backend focused tests, frontend tests/build, MVP2 regression guard를 가능한 범위에서 유지한다.
- 완료 기준:
  - Wave 16에서 `INT3-006`이 PASS 가능한지 판정한다.
  - 남은 blocker가 있으면 FE/BE/PM backlog ID에 연결한다.

## Contract Freeze / 변경 제한

- Backend actual OpenAPI is source of truth for Wave 16.
- Do not change PM policy/enums unless PM explicitly writes a new decision.
- Do not broaden MVP 3 features until DTO sync is closed.
- Do not expose MVP4/MVP5 functionality.

## 다음 보고 위치

- PM: `docs/handoffs/wave-016/PM_REPORT.md`
- Backend: `docs/handoffs/wave-016/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-016/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-016/QA_REPORT.md`
