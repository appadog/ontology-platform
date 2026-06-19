# Next Orders - Wave 14

## 현재 단계 판정

- Previous wave: `wave-013`
- Previous status: `MVP 2 WAVE 13 UIUX PRODUCT POLISH PASS`
- Current wave: `wave-014`
- Current status: `MVP 3 CONTRACT-FIRST PLANNING`
- MVP 2 product scope is closed as `PASS WITH P1 TOOLING/ENVIRONMENT EXCEPTIONS`.

## 총괄 결정

- MVP 2는 제품 P0 범위 기준 완료다.
- MVP 3로 진입한다.
- Wave 14는 구현 wave가 아니라 contract-first planning wave다.
- PM open decisions를 먼저 닫고, Backend/Frontend/QA가 그 계약 위에서 다음 wave 구현을 시작한다.

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- `AGENTS.md`, `docs/handoffs/CURRENT_STATE.md`, 이 문서, `docs/pm/MVP3_PREP_BRIEF.md`, `docs/backlog/MVP3_DRAFT_BACKLOG.md`를 먼저 확인한다.
- 작업 종료 전 반드시 지정 report path에 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- 후보 그래프와 게시 그래프를 반드시 분리한다.
- LLM 원본값과 전문가 수정값을 감사 가능하게 분리한다.
- 승인 전 candidate를 published graph에 반영하지 않는다.

## 진행 순서

1. PM: MVP 3 open decisions를 확정한다.
2. Backend: Validation/Review/Publish/Audit/PublishedGraph API와 data model 초안을 제안한다.
3. Frontend: Review workbench, publish queue, published graph explorer, quality dashboard의 필드/상태/UX 요구를 검토한다.
4. PM: Backend/Frontend mismatch를 조율하고 P0/P1을 확정한다.
5. QA: INT3 checklist를 구체화한다.

## PM 지시

- Report path: `docs/handoffs/wave-014/PM_REPORT.md`
- Backlog IDs: `PM3-001`~`PM3-005`
- 해야 할 일:
  - 아래 open decisions를 확정한다.
    - review decision enum과 `CandidateReviewStatus` mapping
    - `WARNING` candidate publish 허용 여부
    - Neo4j write를 P0로 볼지, relational published tables + graph adapter를 P0로 볼지
    - published graph versioning 단위
    - review task assignment policy
  - 필요 시 ADR 작성.
  - MVP 3 UAT scenario를 더 구체화한다.
- 완료 기준:
  - Backend/Frontend/QA가 구현/검증으로 들어갈 수 있는 결정표가 있어야 한다.

## Backend 지시

- Report path: `docs/handoffs/wave-014/BACKEND_REPORT.md`
- Backlog IDs: `BE3-001`~`BE3-010`
- 선행 조건:
  - PM open decision 확정본을 먼저 읽는다.
- 해야 할 일:
  - ValidationJob/ValidationResult model/API draft.
  - ReviewTask/ReviewDecision model/API draft.
  - Candidate correction API draft.
  - AuditLog draft.
  - PublishJob + PublishedEntity/PublishedRelation draft.
  - Published graph query API draft.
  - Quality summary API draft.
  - OpenAPI artifact strategy 제안.
- 제한:
  - 아직 대규모 구현하지 않는다 unless 총괄이 Wave 15 구현을 연다.
  - 후보를 publish graph에 바로 쓰는 shortcut 금지.
- 완료 기준:
  - endpoint/DTO/enum draft와 migration impact가 보고서에 정리된다.

## Frontend 지시

- Report path: `docs/handoffs/wave-014/FRONTEND_REPORT.md`
- Backlog IDs: `FE3-001`~`FE3-008`
- 선행 조건:
  - PM open decision 확정본과 Backend draft를 읽는다.
- 해야 할 일:
  - Review inbox/workbench IA와 필요한 DTO 필드 검토.
  - Candidate correction UI 상태 정의.
  - Decision action UX 정의.
  - Publish queue/job UI 요구 정리.
  - Published graph explorer v0.1 요구 정리.
  - Quality dashboard v0.1 metric display 요구 정리.
- 제한:
  - 아직 mock 구현도 크게 열지 않는다 unless 총괄이 Wave 15/16 구현을 연다.
- 완료 기준:
  - Backend draft에 대한 field/status/error 요구와 UX risks가 보고된다.

## QA 지시

- Report path: `docs/handoffs/wave-014/QA_REPORT.md`
- Backlog IDs: `INT3-001`~`INT3-007`
- 선행 조건:
  - PM decisions, Backend draft, Frontend field review를 읽는다.
- 해야 할 일:
  - Validation contract checklist.
  - Review decision flow checklist.
  - Publish-only-approved smoke checklist.
  - Published graph separation checklist.
  - Audit trail verification checklist.
  - Quality dashboard consistency checklist.
  - MVP 2 regression checklist.
- 완료 기준:
  - Wave 15+ 구현자가 그대로 테스트 기준으로 쓸 수 있는 INT3 acceptance가 작성된다.

## 다음 보고 위치

- PM: `docs/handoffs/wave-014/PM_REPORT.md`
- Backend: `docs/handoffs/wave-014/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-014/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-014/QA_REPORT.md`
