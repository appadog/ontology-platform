# Next Orders - Wave 15

## 현재 단계 판정

- Previous wave: `wave-014`
- Previous status: `MVP 3 CONTRACT-FIRST READINESS PASS`
- Current wave: `wave-015`
- Current status: `MVP 3 THIN IMPLEMENTATION SLICE`

## 총괄 결정

- MVP 3 contract-first 준비는 완료되었다.
- Wave 15는 MVP 3 첫 구현 wave다.
- PM이 남은 implementation literal을 먼저 freeze한다.
- Backend와 Frontend는 PM freeze 이후 병렬 구현한다.
- QA는 Backend/Frontend 보고서를 읽고 `INT3-001`~`INT3-007` 중 실행 가능한 항목을 runtime/contract 기준으로 재판정한다.

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- `AGENTS.md`, `docs/handoffs/CURRENT_STATE.md`, 이 문서, `docs/pm/MVP3_PREP_BRIEF.md`, `docs/backlog/MVP3_DRAFT_BACKLOG.md`, `docs/backlog/INT3_MVP3_ACCEPTANCE.md`를 먼저 확인한다.
- 작업 종료 전 반드시 지정 report path에 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- 후보 그래프와 게시 그래프를 반드시 분리한다.
- LLM 원본값과 전문가 수정값을 감사 가능하게 분리한다.
- 승인 전 candidate를 published graph에 반영하지 않는다.
- Neo4j는 MVP 3 P0 blocker가 아니다. relational published tables and snapshot metadata가 P0 canonical이다.

## 이번 wave의 핵심 blocker

- MVP 3 runtime surface가 아직 없다.
- 구현 전 아래 literal/shape가 freeze되어야 한다.
  - `ValidationResultSeverity`
  - publish eligibility reason codes
  - review inbox list response shape
  - validation result UI fields
  - published graph lineage fields
  - typed quality summary/drilldown schema

## 진행 순서

1. PM: implementation literal/shape freeze.
2. Backend + Frontend: freeze 결과를 읽고 병렬 구현.
3. QA: Backend/Frontend report와 변경 파일을 읽고 contract/runtime 재검증.
4. 총괄: Wave 15 결과를 통합하고 Wave 16 지시를 작성.

## PM 지시

- Report path: `docs/handoffs/wave-015/PM_REPORT.md`
- Backlog IDs: `PM3-001`, `PM3-002`, `PM3-003`, `PM3-004`, `PM3-005`
- 선행 문서:
  - `docs/handoffs/wave-014/QA_REPORT.md`
  - `docs/api/MVP3_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp3-draft.json`
  - `docs/pm/MVP3_FRONTEND_UX_REQUIREMENTS.md`
- 해야 할 일:
  - `ValidationResultSeverity`를 `INFO`, `WARNING`, `FAILED`로 최종 freeze한다.
  - publish eligibility reason codes를 enum/literal list로 확정한다.
  - review inbox list API shape를 확정한다. 가능하면 wrapped response with `items`, `total_count`, `limit`, `offset`를 기본으로 한다.
  - `ValidationResult` UI fields를 확정한다: `field_path`, `blocking`, `suggested_fix`.
  - published graph lineage fields를 확정한다: publish job, graph version, ontology version, original/corrected snapshot/evidence/reviewer/reason linkage.
  - `QualitySummary` typed schema와 drilldown query hints를 확정한다.
  - 필요 시 `docs/pm/MVP3_PREP_BRIEF.md`, `docs/api/MVP3_API_CONTRACT_DRAFT.md`, `docs/backlog/MVP3_DRAFT_BACKLOG.md`, ADR을 갱신한다.
- 완료 기준:
  - Backend/Frontend가 구현 중 enum/string literal을 추측하지 않아도 된다.
  - QA가 stable reason codes와 typed quality fields로 assertion을 만들 수 있다.

## Backend 지시

- Report path: `docs/handoffs/wave-015/BACKEND_REPORT.md`
- Backlog IDs: `BE3-001`, `BE3-002`, `BE3-003`, `BE3-004`, `BE3-005`, `BE3-006`, `BE3-007`, `BE3-008`, `BE3-010`
- 선행 조건:
  - `docs/handoffs/wave-015/PM_REPORT.md`를 먼저 읽는다.
- 해야 할 일:
  - MVP 3 thin backend runtime slice를 구현한다.
  - SQLAlchemy/Pydantic/API 구조는 기존 `apps/backend` 패턴을 따른다.
  - ValidationJob/ValidationResult model/schema/route를 추가한다.
  - ReviewTask/ReviewDecision/candidate correction schema/route를 추가한다.
  - Decision transition과 required reason/correction diff validation을 구현한다.
  - AuditLog model/API를 추가하거나 기존 audit extension point가 있으면 MVP 3 event를 기록한다.
  - PublishJob, PublishedGraphVersion, PublishedEntity, PublishedRelation model/schema/route를 추가한다.
  - Publish eligibility rule을 구현한다.
  - Published graph current/version query API를 추가한다.
  - Quality summary v0.1 API를 추가한다.
  - Deterministic seed/fixture or test setup을 추가해 `approved_clean_entity`, `modified_clean_relation`, `approved_warning_with_reason`, negative publish cases를 검증 가능하게 한다.
  - FastAPI OpenAPI export를 갱신한다. MVP 1/2 artifact는 덮어쓰지 말고 MVP 3 artifact를 별도로 유지한다.
- 제한:
  - Neo4j write를 P0로 만들지 않는다.
  - candidate raw output을 in-place overwrite하지 않는다.
  - pending/rejected/needs-discussion/failed-validation/missing-evidence/warning-without-reason candidate publish shortcut 금지.
- 검증:
  - Backend unit/API tests.
  - ruff 또는 repo 기존 lint.
  - OpenAPI export/parse.
  - 가능한 경우 publish eligibility smoke.
- 완료 기준:
  - Backend report에 구현된 endpoint, model/migration, OpenAPI artifact, test result, 남은 runtime gap이 정리된다.

## Frontend 지시

- Report path: `docs/handoffs/wave-015/FRONTEND_REPORT.md`
- Backlog IDs: `FE3-001`, `FE3-002`, `FE3-003`, `FE3-004`, `FE3-005`, `FE3-006`, `FE3-007`, support `FE3-008`
- 선행 조건:
  - `docs/handoffs/wave-015/PM_REPORT.md`를 먼저 읽는다.
  - Backend report가 늦어질 경우 `docs/api/openapi-mvp3-draft.json` + PM freeze 기준으로 mock-first 구현을 시작하되, actual API connection은 report에서 명확히 구분한다.
- 해야 할 일:
  - MVP 3 review workflow route를 추가한다.
    - review inbox
    - review workbench
    - publish queue/job
    - published graph explorer
    - quality dashboard v0.1
  - `shared/api` MVP 3 types/fixtures/mock client를 추가한다.
  - Review inbox는 assigned-to-me, unassigned, status, validation, confidence, source/job context를 탐색 가능하게 만든다.
  - Workbench는 evidence/source viewer, candidate context, correction diff panel, validation results, decision history를 한 흐름으로 보여준다.
  - Decision actions는 `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`를 사용하고 reason/disabled state를 표현한다.
  - Publish queue는 eligibility reasons와 selected publish job flow를 보여준다.
  - Published graph explorer는 candidate graph와 시각/route/label을 분리한다.
  - Quality dashboard v0.1은 typed summary metrics와 drilldown affordance를 보여준다.
  - 모든 주요 화면에 loading/empty/error/permission state를 둔다.
- 제한:
  - 미래 MVP4/5 기능을 활성 메뉴처럼 노출하지 않는다.
  - hana-style-component는 adapter 경계 밖에서 직접 import하지 않는다.
  - 장식적 redesign보다 검수자가 실제로 다음 행동을 이해하는 workflow clarity를 우선한다.
- 검증:
  - `npm run build`
  - 기존 frontend test/smoke가 있으면 실행
  - 가능한 경우 local route smoke
- 완료 기준:
  - Mock-first MVP 3 product flow를 사용자가 따라갈 수 있다.
  - Backend actual API 연결 여부와 남은 gap이 report에 구분되어 있다.

## QA 지시

- Report path: `docs/handoffs/wave-015/QA_REPORT.md`
- Backlog IDs: `INT3-001`, `INT3-002`, `INT3-003`, `INT3-004`, `INT3-005`, `INT3-006`, `INT3-007`
- 선행 조건:
  - `docs/handoffs/wave-015/PM_REPORT.md`
  - `docs/handoffs/wave-015/BACKEND_REPORT.md`
  - `docs/handoffs/wave-015/FRONTEND_REPORT.md`
- 해야 할 일:
  - `docs/backlog/INT3_MVP3_ACCEPTANCE.md` 기준으로 contract/runtime 검증을 수행한다.
  - OpenAPI draft와 실제 export가 다르면 diff를 blocker/follow-up으로 분리한다.
  - Backend publish positive/negative fixture를 검증한다.
  - Frontend review workflow route smoke를 수행한다.
  - Candidate graph와 published graph가 시각/계약상 분리되어 있는지 확인한다.
  - MVP 2 regression smoke를 가능한 범위에서 유지한다.
- 완료 기준:
  - `INT3-001`~`INT3-007` 각각 `PASS`, `PARTIAL`, `FAIL`, `NOT RUNNABLE`로 판정한다.
  - 다음 wave에서 닫아야 할 blocker를 Backend/Frontend/PM backlog ID에 연결한다.

## Contract Freeze / 변경 제한

- `ReviewDecisionType`: `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`
- `CandidateReviewStatus`: `PENDING`, `APPROVED`, `REJECTED`, `MODIFIED`, `NEEDS_DISCUSSION`
- `ValidationResultSeverity`: Wave 15 PM freeze 후 변경 금지
- Published graph P0 canonical storage: relational published tables + snapshot/current pointer metadata
- OpenAPI artifacts:
  - MVP 1: `docs/api/openapi-mvp1.json`
  - MVP 2: `docs/api/openapi-mvp2-draft.json`
  - MVP 3: `docs/api/openapi-mvp3-draft.json` or explicit generated equivalent

## 다음 보고 위치

- PM: `docs/handoffs/wave-015/PM_REPORT.md`
- Backend: `docs/handoffs/wave-015/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-015/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-015/QA_REPORT.md`
