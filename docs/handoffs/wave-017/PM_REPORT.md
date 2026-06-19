# PM Report - Wave 17

## 담당 범위
- backlog ID: `PM3-005`, support `INT3-003`, `INT3-004`, `INT3-006`
- 작업 경로:
  - `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
  - `docs/handoffs/wave-017/PM_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `03_PM_AGENT_SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-017/NEXT_ORDERS.md`
  - `docs/handoffs/wave-016/QA_REPORT.md`
  - `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- Wave 17 actual API smoke acceptance boundary를 `docs/backlog/INT3_MVP3_ACCEPTANCE.md`에 추가했다.
- Deterministic MVP3 seed/harness는 QA/development support이며 제품 기능 범위가 아님을 명시했다.
- MVP3 seeded frontend route smoke의 `PASS`, `PARTIAL`, `FAIL`, `NOT RUNNABLE` 판정 기준을 정했다.

## 변경 파일
- `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
- `docs/handoffs/wave-017/PM_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `git diff --check`
  - `git diff --check --no-index /dev/null docs/backlog/INT3_MVP3_ACCEPTANCE.md`
  - `git diff --check --no-index /dev/null docs/handoffs/wave-017/PM_REPORT.md`
- 결과:
  - `git diff --check` PASS
  - 두 `--no-index` checks는 whitespace error output 없음. Exit code `1`은 `/dev/null` 대비 diff 존재 때문이며 whitespace 실패가 아니다.
- 실행하지 못한 검증:
  - PM 문서 작업 범위이므로 backend/frontend runtime smoke는 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - API contract, OpenAPI artifact, enum, DTO, backend code, frontend code는 변경하지 않았다.
  - Actual API smoke는 기존 MVP3 API contract가 실제 라우트에서 재현되는지 확인하는 acceptance gate다.
- 영향받는 역할:
  - Backend: deterministic seed/smoke helper가 이 기준을 만족하는 고정 프로젝트와 MVP3 데이터 상태를 제공해야 한다.
  - Frontend: actual API mode route smoke가 mock-only shape로 회귀하지 않고 실제 API DTO를 렌더해야 한다.
  - QA: 아래 기준으로 Wave17 actual API smoke를 판정한다.

## Wave 17 actual API smoke 판정 기준
- `PASS`:
  - seeded project exists: `project-corp-knowledge` 또는 동등하게 문서화된 fixed project가 실제 API에서 조회된다.
  - review inbox has tasks: `/projects/{projectId}/review`가 actual API review task 목록을 렌더한다.
  - workbench opens one task: `/projects/{projectId}/review/{reviewTaskId}`가 actual API task detail을 열고 evidence/review context를 표시한다.
  - publish queue shows eligibility reason codes: `/projects/{projectId}/publish`가 per-candidate eligibility와 frozen reason code를 표시한다.
  - published graph current renders only published facts: `/projects/{projectId}/published-graph`가 published graph API의 current snapshot만 사용하고 candidate graph facts를 섞지 않는다.
  - quality dashboard renders typed metrics: `/projects/{projectId}/quality`가 `candidate_counts`, `validation_counts`, `review_counts`, `publish_counts`, `rates`를 actual API schema로 렌더한다.
- `PARTIAL`:
  - deterministic seed/harness가 재현 가능하고 actual API mode frontend가 최소 1개 이상 MVP3 route에서 API-backed state를 렌더하지만, 위 `PASS` evidence 중 일부 route, seed coverage, screenshot/assertion, 또는 automation evidence가 빠져 있다.
  - seed data가 아직 publish queue negative reason code 전체 또는 published graph current snapshot까지 만들지 못하지만, 실패 원인이 제품 정책 위반이 아니라 harness coverage gap으로 재현 가능하게 보고된다.
- `FAIL`:
  - seed/harness가 성공했다고 보고했는데 실제 route가 MVP3 정책을 위반한다.
  - 예: ineligible candidate가 published graph에 쓰임, published graph route가 candidate graph data를 published fact처럼 렌더함, eligibility reason code가 누락되거나 mock-only alias로 대체됨, quality dashboard가 actual API typed metric group이 아닌 mock-only shape에 의존함.
- `NOT RUNNABLE`:
  - backend/frontend process, dependency, port/CORS, DB migration 등 환경 또는 실행 단계가 route assertion 전에 막혀 actual API route evidence를 만들 수 없다.

## Blocker
- PM 기준 정의에는 blocker 없음.
- Wave17 closeout 전 남은 실행 blocker는 Backend/Frontend/QA 쪽 deterministic seed와 actual API route smoke evidence 생산 여부다.

## 남은 TODO
- Backend: fixed project, review task, publish candidates/jobs, current published graph, quality summary를 재현 가능한 seed/smoke helper로 제공한다.
- Frontend: `VITE_USE_MOCK_API=false`에서 seed data를 사용하는 MVP3 route smoke를 실행하거나 문서화한다.
- QA: PM 기준에 따라 actual API smoke를 `PASS`, `PARTIAL`, `FAIL`, `NOT RUNNABLE` 중 하나로 판정한다.

## 다른 역할에 전달할 내용
- PM:
  - Product policy change는 없다. Harness는 QA/dev support다.
- Backend:
  - Seed helper는 제품 endpoint/DTO/enum 변경 없이 기존 MVP3 fixture flow를 재사용해야 한다.
- Frontend:
  - Actual API route smoke의 증거는 mock route smoke와 분리해서 남겨야 한다.
  - Publish eligibility와 quality metrics는 actual API field names를 그대로 사용해야 한다.
- QA:
  - `PARTIAL`은 harness coverage/evidence gap일 때만 사용한다.
  - Product rule violation이 확인되면 `FAIL`로 판정한다.

## 총괄에게 요청하는 결정
- Wave17 PM actual API smoke boundary를 승인하고 Backend/Frontend/QA가 동일 기준으로 증거를 작성하게 한다.

## 현재 판정
- PASS
