# Next Orders - Wave 18

## 현재 단계 판정

- Previous wave: `wave-017`
- Previous status: `MVP 3 ACTUAL API SMOKE PASS`
- Current wave: `wave-018`
- Current status: `MVP 3 CLOSEOUT / MVP 4 CONTRACT-FIRST PREP`

## 총괄 결정

- Wave 17은 PASS다.
- MVP 3 P0 product flow는 closeout 가능한 상태다.
- Wave 18은 MVP 3 product P0 closeout을 문서화하고, MVP 4 contract-first 진입 준비를 만든다.
- Wave 18은 대규모 MVP 4 구현 wave가 아니다. MVP4 implementation은 PM/contract/acceptance가 정리된 뒤 Wave 19+에서 연다.

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- `AGENTS.md`, `docs/handoffs/CURRENT_STATE.md`, 이 문서, `docs/handoffs/wave-017/QA_REPORT.md`, `00_PROJECT_ROADMAP_MVP_1_TO_5.md`, `docs/api/openapi-mvp3-draft.json`, `docs/backlog/MVP3_DRAFT_BACKLOG.md`, `docs/backlog/INT3_MVP3_ACCEPTANCE.md`를 먼저 확인한다.
- 작업 종료 전 반드시 지정 report path에 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- MVP4/RAG/search/vector/evaluation 기능을 코드로 크게 열지 않는다. 이번 wave는 closeout and prep이다.

## MVP 3 Closeout 기준

MVP 3 closeout은 아래가 문서/검증으로 확인되면 PASS 가능하다.

- Validation, review, correction, audit, publish, published graph, quality dashboard P0 flow가 실제 API와 frontend route smoke로 검증됨.
- Pending/rejected/needs-discussion/failed/missing-evidence/warning-without-reason candidates do not publish.
- Published graph current snapshot reads published graph APIs, not candidate APIs.
- Original LLM snapshot and expert correction remain traceable.
- MVP2 regression remains PASS.
- Remaining Docker/PostgreSQL compose smoke and formal Playwright suite are P1 tooling/environment follow-ups, not product blockers.

## PM 지시

- Report path: `docs/handoffs/wave-018/PM_REPORT.md`
- Backlog IDs: `PM3-001`~`PM3-005`, `INT3-001`~`INT3-007`, initial `PM4-*`
- 해야 할 일:
  - MVP 3 completion review / closeout checklist를 작성한다.
  - MVP 3 demo script/release note를 작성한다.
  - MVP 3 P1 follow-up을 분리한다.
  - MVP 4 prep brief를 작성한다.
    - 품질평가 고도화
    - 고급 그래프 탐색
    - 검색/RAG 1차
    - 운영 UX
    - evaluation dataset / golden set / prompt/model performance
  - MVP 4 draft backlog를 PM/Backend/Frontend/QA로 나눈다.
  - MVP4 non-goals와 Wave19 contract-first entry criteria를 정한다.
- 산출물 후보:
  - `docs/pm/MVP3_CLOSEOUT_CHECKLIST.md`
  - `docs/pm/MVP4_PREP_BRIEF.md`
  - `docs/backlog/MVP4_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-018/PM_REPORT.md`
- 완료 기준:
  - QA가 MVP3 closeout을 판정할 수 있다.
  - Backend/Frontend가 MVP4 contract-first review를 시작할 수 있다.

## Backend 지시

- Report path: `docs/handoffs/wave-018/BACKEND_REPORT.md`
- Backlog IDs: `BE3-001`~`BE3-010`, support initial `BE4-*`
- 선행 조건:
  - PM closeout/prep report를 먼저 읽는다.
- 해야 할 일:
  - MVP3 backend closeout regression을 실행한다.
    - focused MVP3 tests
    - full backend tests
    - ruff
    - OpenAPI export compare
    - seed_mvp3 smoke command sanity
  - Backend README 또는 docs에 MVP3 seed/smoke command가 빠져 있으면 짧게 보강한다.
  - MVP4 backend contract implications를 검토한다:
    - quality metrics advanced
    - evaluation dataset/golden set
    - prompt/model performance
    - keyword/search/vector/RAG boundaries
    - external graph/source/evidence API
  - 이번 wave에서는 broad MVP4 runtime implementation을 하지 않는다.
- 완료 기준:
  - MVP3 backend closeout evidence가 있고, MVP4 backend contract questions가 정리된다.

## Frontend 지시

- Report path: `docs/handoffs/wave-018/FRONTEND_REPORT.md`
- Backlog IDs: `FE3-001`~`FE3-008`, support initial `FE4-*`
- 선행 조건:
  - PM closeout/prep report를 먼저 읽는다.
- 해야 할 일:
  - MVP3 frontend closeout regression을 실행한다.
    - `npm run test`
    - `npm run build`
    - `npm run smoke:mvp3:actual`
    - existing MVP2 actual smoke if feasible
  - MVP3 review/publish/quality flow의 UX closeout gaps를 정리한다.
  - MVP4 frontend IA/UX implications를 검토한다:
    - advanced graph explorer
    - quality dashboard advanced
    - integrated search UI
    - RAG answer screen
    - collaboration/SLA UI
  - 이번 wave에서는 broad MVP4 UI implementation을 하지 않는다.
- 완료 기준:
  - MVP3 frontend actual path regression evidence가 있고, MVP4 UI contract questions가 정리된다.

## QA 지시

- Report path: `docs/handoffs/wave-018/QA_REPORT.md`
- Backlog IDs: `INT3-001`~`INT3-007`, initial `INT4-*`
- 선행 조건:
  - `docs/handoffs/wave-018/PM_REPORT.md`
  - `docs/handoffs/wave-018/BACKEND_REPORT.md`
  - `docs/handoffs/wave-018/FRONTEND_REPORT.md`
- 해야 할 일:
  - MVP3 closeout checklist를 기준으로 product P0 PASS 여부를 판정한다.
  - Backend/Frontend validation evidence를 재검토한다.
  - MVP2 regression guard 유지 여부를 확인한다.
  - MVP4 draft backlog를 QA 관점에서 `INT4-*` acceptance skeleton으로 바꿀 준비를 한다.
- 완료 기준:
  - MVP3를 close할지, Wave19에서 추가 hardening이 필요한지 명확히 판정한다.
  - MVP4 contract-first wave로 갈 수 있는지 추천한다.

## Contract Freeze / 변경 제한

- MVP3 OpenAPI source: `docs/api/openapi-mvp3-draft.json`
- MVP4 implementation은 아직 열지 않는다.
- Seed/smoke harness는 QA/dev support다.
- Docker Compose/PostgreSQL smoke remains existing environment follow-up unless Docker CLI is available.

## 다음 보고 위치

- PM: `docs/handoffs/wave-018/PM_REPORT.md`
- Backend: `docs/handoffs/wave-018/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-018/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-018/QA_REPORT.md`
