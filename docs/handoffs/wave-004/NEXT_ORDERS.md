# Next Orders - Wave 5

## 현재 단계 판정

- Overall: `MVP 1 ACCEPTANCE CLOSEOUT REQUIRED / MVP 2 PREP DRAFT READY`
- `INT-002`: PASS
- `INT-003`: PARTIAL
- `INT-001`: PARTIAL

## 총괄 결정

- 아직 MVP 2 구현 착수는 이르다.
- Wave 5는 MVP 1 acceptance closeout 전용이다.
- MVP 2는 `DRAFT / DO NOT IMPLEMENT UNTIL MVP 1 ACCEPTANCE` 상태로 설계 문서만 준비한다.
- `/api/v1/dashboard`는 MVP 1 actual API contract에 포함하지 않는다. Frontend actual API mode는 P0 API 조합으로 dashboard summary를 계산하거나 mock-only/P1 boundary로 분리한다.
- Source archive/delete UI는 INT-001에서 제외하고 후속 UX task로 남긴다.
- Browser click smoke는 가능하면 수행한다. 도구가 없으면 수동 UAT 체크리스트와 미수행 사유를 남긴다.
- Docker Compose 검증은 Docker CLI가 있는 환경에서 별도 gate로 수행한다. 현재 환경에서 Docker가 없으면 blocker로 기록한다.

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- 작업 종료 전 반드시 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 지정된 report path에 완료 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.

## PM 지시

- Report path: `docs/handoffs/wave-005/PM_REPORT.md`
- Backlog IDs: `PM-006`, `PM-007`, `INT-004`, MVP2 prep
- 해야 할 일:
  - `/api/v1/dashboard` 제외 결정을 `docs/api/API_CONTRACT_PRIORITY_MVP1.md`, `docs/backlog/MVP1_BACKLOG.md`, 필요 시 ADR에 반영한다.
  - `INT-001` pass 기준에 browser/manual UAT smoke 처리 기준을 명확히 한다.
  - MVP 1 acceptance closeout checklist를 갱신한다.
  - MVP 2 prep 문서 3개를 검토하고 필요한 문구를 보완한다.
    - `docs/pm/MVP2_PREP_BRIEF.md`
    - `docs/backlog/MVP2_DRAFT_BACKLOG.md`
    - `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
- 완료 기준:
  - MVP 1에서 남은 blocker와 MVP 2 진입 조건이 문서상 분리되어 있다.
  - `docs/handoffs/wave-005/PM_REPORT.md`가 작성되어 있다.

## Backend 지시

- Report path: `docs/handoffs/wave-005/BACKEND_REPORT.md`
- Backlog IDs: support `INT-001`, `INT-003`, optional MVP2 prep review
- 해야 할 일:
  - 현재 Backend/OpenAPI는 PASS 상태이므로 신규 P0 API를 추가하지 않는다.
  - Frontend/QA가 actual FE-to-BE smoke 중 발견한 backend issue가 있으면 수정한다.
  - `/api/v1/dashboard`는 MVP 1에 추가하지 않는다.
  - `docs/api/openapi-mvp1.json` freshness check를 유지한다.
  - MVP 2 draft API 중 backend 관점에서 위험한 설계가 있으면 report에 의견을 남긴다.
- 완료 기준:
  - Backend regression check 결과가 있다.
  - 추가 변경이 없으면 "no backend change required"로 명확히 보고한다.
  - `docs/handoffs/wave-005/BACKEND_REPORT.md`가 작성되어 있다.

## Frontend 지시

- Report path: `docs/handoffs/wave-005/FRONTEND_REPORT.md`
- Backlog IDs: `FE-008`, `FE-009`, `FE-014`, `INT-001`
- 해야 할 일:
  - actual API mode에서 `/api/v1/dashboard`를 호출하지 않도록 수정한다.
    - P0 API 조합으로 summary를 계산하거나, dashboard는 mock-only/P1 boundary로 분리한다.
  - `OntologyGraph.classes?: OntologyClass[] | null`, `relations?: OntologyRelation[] | null`로 nullable compatibility field를 반영한다.
  - Ontology draft version 생성, class/property/relation 생성 API wrapper를 추가한다.
  - 가능하면 최소 UI action까지 연결해 actual API mode에서 ontology authoring smoke가 가능하게 한다.
  - `VITE_USE_MOCK_API=false` actual FE-to-BE smoke를 재수행한다.
  - Browser automation이 없으면 수동 UAT 가능한 절차와 미수행 사유를 report에 남긴다.
- 완료 기준:
  - actual API mode에서 dashboard 404가 발생하지 않는다.
  - FE type/client/mock contract가 OpenAPI와 다시 맞는다.
  - ontology authoring actual API boundary가 있다.
  - `docs/handoffs/wave-005/FRONTEND_REPORT.md`가 작성되어 있다.

## QA 지시

- Report path: `docs/handoffs/wave-005/QA_REPORT.md`
- Backlog IDs: `INT-001`, `INT-003`, `INT-005`
- 선행 조건:
  - PM/Backend/Frontend wave-005 report를 먼저 읽는다.
- 해야 할 일:
  - `/api/v1/dashboard` 관련 contract mismatch가 해소됐는지 확인한다.
  - `OntologyGraph.classes`/`relations` nullable compatibility type이 FE에 반영됐는지 확인한다.
  - Backend API INT-001 full flow를 재실행한다.
  - Frontend actual FE-to-BE smoke를 재검증한다.
  - 가능하면 Browser/manual UAT smoke evidence를 남긴다.
  - Docker CLI가 없으면 compose 검증 blocker를 유지한다.
- 완료 기준:
  - `INT-003`가 PASS 또는 명확한 accepted exception 상태다.
  - `INT-001`이 PASS 또는 PM 승인 예외 상태다.
  - MVP 2 구현 착수 가능 여부를 명확히 판정한다.
  - `docs/handoffs/wave-005/QA_REPORT.md`가 작성되어 있다.

## MVP 2 준비 산출물

- `docs/pm/MVP2_PREP_BRIEF.md`
- `docs/backlog/MVP2_DRAFT_BACKLOG.md`
- `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`

## 다음 보고 위치

- PM: `docs/handoffs/wave-005/PM_REPORT.md`
- Backend: `docs/handoffs/wave-005/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-005/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-005/QA_REPORT.md`
