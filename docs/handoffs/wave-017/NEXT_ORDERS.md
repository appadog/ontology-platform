# Next Orders - Wave 17

## 현재 단계 판정

- Previous wave: `wave-016`
- Previous status: `MVP 3 DTO SYNC PASS`
- Current wave: `wave-017`
- Current status: `MVP 3 ACTUAL API SMOKE HARNESS`

## 총괄 결정

- Wave 16은 PASS다.
- `INT3-006`은 contract/mock consistency 기준 PASS로 수용한다.
- MVP 3 closeout 전에 deterministic actual API smoke 경로를 만드는 것이 좋다.
- Wave 17은 새 기능 확장이 아니라 reproducible seed/smoke harness와 actual API verification wave다.

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- `AGENTS.md`, `docs/handoffs/CURRENT_STATE.md`, 이 문서, `docs/handoffs/wave-016/QA_REPORT.md`, `docs/api/openapi-mvp3-draft.json`, `docs/backlog/INT3_MVP3_ACCEPTANCE.md`를 먼저 확인한다.
- 작업 종료 전 반드시 지정 report path에 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- 후보 그래프와 게시 그래프 분리, original/corrected snapshot 분리, publish eligibility reason code 직접 사용 원칙을 유지한다.
- MVP4/RAG/enterprise 기능을 열지 않는다.

## 이번 wave의 핵심 목표

MVP3 actual frontend route smoke가 mock-only에 머물지 않도록, deterministic backend seed/smoke data를 준비하고 다음 route들을 actual API mode에서 검증한다.

- `/projects/project-corp-knowledge/review`
- `/projects/project-corp-knowledge/review/{reviewTaskId}`
- `/projects/project-corp-knowledge/publish`
- `/projects/project-corp-knowledge/published-graph`
- `/projects/project-corp-knowledge/quality`

## PM 지시

- Report path: `docs/handoffs/wave-017/PM_REPORT.md`
- Backlog IDs: `PM3-005`, support `INT3-003`, `INT3-004`, `INT3-006`
- 해야 할 일:
  - Wave 17 actual API smoke acceptance boundary를 정한다.
  - Deterministic MVP3 seed/harness는 제품 기능이 아니라 QA/development support임을 명시한다.
  - Actual API smoke의 PASS 기준을 정한다:
    - seeded project exists
    - review inbox has tasks
    - workbench can open one task
    - publish queue shows eligibility reason codes
    - published graph current snapshot renders only published facts
    - quality dashboard renders typed metrics
  - 부족한 경우 어떤 항목을 `PARTIAL`로 둘지 기준을 작성한다.
- 산출물:
  - `docs/handoffs/wave-017/PM_REPORT.md`
  - 필요 시 `docs/backlog/INT3_MVP3_ACCEPTANCE.md`에 actual smoke note
- 완료 기준:
  - Backend/Frontend/QA가 actual smoke를 어떤 증거로 PASS 처리할지 안다.

## Backend 지시

- Report path: `docs/handoffs/wave-017/BACKEND_REPORT.md`
- Backlog IDs: support `BE3-006`, `BE3-007`, `BE3-008`, `BE3-010`, `INT3-003`, `INT3-004`, `INT3-006`
- 해야 할 일:
  - `apps/backend/tests/test_mvp3_api.py`의 deterministic fixture flow를 재사용 가능한 seed/smoke helper로 추출한다.
  - 권장 산출물:
    - `apps/backend/scripts/seed_mvp3.py` 또는 동등한 script
    - fixed project id/name usable by frontend smoke, preferably `project-corp-knowledge`
    - created review task id(s), publish job id, current published graph version id를 출력하거나 JSON으로 저장
  - SQLite/local dev 환경에서 동작해야 한다.
  - 기존 MVP1/MVP2 seed를 깨지 않는다.
  - OpenAPI contract를 바꾸지 않는다 unless unavoidable.
- 검증:
  - focused MVP3 backend tests
  - seed script run against temp SQLite DB
  - selected API checks for review tasks, publish candidates, current published graph, quality summary
- 완료 기준:
  - Frontend/QA가 actual API mode에서 같은 data id를 써서 route smoke를 반복할 수 있다.

## Frontend 지시

- Report path: `docs/handoffs/wave-017/FRONTEND_REPORT.md`
- Backlog IDs: support `FE3-001`, `FE3-002`, `FE3-005`, `FE3-006`, `FE3-007`, `FE3-008`, `INT3-006`
- 선행 조건:
  - Backend seed/smoke helper report를 확인한다.
- 해야 할 일:
  - MVP3 actual API mode route smoke를 위한 script 또는 documented command를 추가/정리한다.
  - `VITE_USE_MOCK_API=false`에서 seeded backend data를 사용하는 5개 route를 확인한다.
  - Backend seed가 task/job ids를 출력하면 smoke가 그 값을 읽도록 한다.
  - Mock route smoke는 계속 PASS해야 한다.
  - Actual API 응답이 비어 있거나 seed가 실패할 때 명확한 empty/error 상태가 보이게 한다.
- 제한:
  - API DTO를 다시 mock-only shape로 되돌리지 않는다.
  - 새 UI polish를 크게 열지 않는다.
- 검증:
  - `npm run test`
  - `npm run build`
  - MVP3 mock route smoke
  - 가능한 경우 MVP3 actual API route smoke
- 완료 기준:
  - actual API smoke가 PASS하거나, seed/harness blocker가 정확히 재현 가능한 형태로 보고된다.

## QA 지시

- Report path: `docs/handoffs/wave-017/QA_REPORT.md`
- Backlog IDs: `INT3-003`, `INT3-004`, `INT3-006`, regression `INT3-001`~`INT3-007`
- 선행 조건:
  - `docs/handoffs/wave-017/PM_REPORT.md`
  - `docs/handoffs/wave-017/BACKEND_REPORT.md`
  - `docs/handoffs/wave-017/FRONTEND_REPORT.md`
- 해야 할 일:
  - Backend seed reproducibility를 검증한다.
  - MVP3 actual API route smoke를 실행하거나 Frontend report evidence를 재현한다.
  - Published graph가 candidate API가 아니라 published graph API에서 렌더되는지 확인한다.
  - Quality dashboard actual API metrics가 typed schema로 렌더되는지 확인한다.
  - Backend focused tests, Frontend tests/build, MVP2 actual API regression guard를 유지한다.
- 완료 기준:
  - MVP3 actual API smoke를 `PASS`, `PARTIAL`, `FAIL`, `NOT RUNNABLE`로 판정한다.
  - MVP3 closeout에 남은 blocker를 명확히 분류한다.

## Contract Freeze / 변경 제한

- `docs/api/openapi-mvp3-draft.json` remains the actual MVP3 contract source.
- Seed/harness changes must not change product policy.
- Neo4j is still P1/optional and cannot be an actual smoke dependency.
- Docker Compose/PostgreSQL smoke remains environment follow-up unless explicitly available.

## 다음 보고 위치

- PM: `docs/handoffs/wave-017/PM_REPORT.md`
- Backend: `docs/handoffs/wave-017/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-017/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-017/QA_REPORT.md`
