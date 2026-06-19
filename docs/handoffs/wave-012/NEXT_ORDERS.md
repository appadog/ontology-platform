# Next Orders - Wave 13

## 현재 단계 판정

- Previous wave: `MVP 2 WAVE 12 FRONTEND PRODUCTIZATION PASS`
- New direction: 총괄/PM/UIUX expert review 기반 Frontend product polish.
- Wave 13 status: `UI/UX EXPERT REVIEW -> FRONTEND POLISH -> QA VERIFICATION`
- Backend/API scope remains closed.
- Docker Compose smoke remains a P1 environment follow-up.

## 총괄 결정

- Wave 12 UI/UX는 분명히 개선되었다.
- Wave 13은 새 기능을 여는 wave가 아니라, 사용자가 Project에서 Evidence까지 더 자연스럽게 따라가도록 화면 정보 구조와 interaction hierarchy를 다듬는 wave다.
- 총괄/PM/UIUX review 기준 문서는 `docs/pm/WAVE13_UIUX_REVIEW.md`다.
- Frontend가 중심 작업자다.
- Backend는 실행하지 않는다 unless Frontend/QA가 명확한 API blocker를 보고한다.
- QA는 actual API smoke와 desktop/mobile screenshot으로 검증한다.

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- `AGENTS.md`, `docs/handoffs/CURRENT_STATE.md`, 이 문서, `docs/pm/WAVE13_UIUX_REVIEW.md`를 먼저 확인한다.
- 작업 종료 전 반드시 지정 report path에 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- MVP 2 closeout P0 contract를 깨지 않는다.
- External LLM provider, review/publish workflow, RAG, advanced PDF parsing, production auth/RBAC, 신규 candidate detail endpoint는 열지 않는다.

## 진행 순서

1. Commander/PM: UI/UX expert review와 Wave 13 orders를 작성한다.
2. Frontend subagent: `UX13-01`~`UX13-08` 기준으로 구현한다.
3. QA subagent: 구현 결과를 browser/actual API smoke로 검증한다.
4. Commander: reports를 읽고 `CURRENT_STATE.md`와 backlog를 갱신한다.

## PM/Commander 지시

- Report path: `docs/handoffs/wave-013/PM_REPORT.md`
- Backlog IDs: `FE-012`, `FE2-001`~`FE2-006`, support `INT2-003`
- 완료 기준:
  - `docs/pm/WAVE13_UIUX_REVIEW.md` 작성.
  - Frontend가 바로 실행할 수 있는 `UX13-01`~`UX13-08` acceptance 정의.
  - `docs/backlog/MVP2_DRAFT_BACKLOG.md`에 Wave 13 scope 연결.
  - `docs/handoffs/wave-013/PM_REPORT.md` 작성.

## Frontend 지시

- Report path: `docs/handoffs/wave-013/FRONTEND_REPORT.md`
- Backlog IDs: `FE-012`, `FE2-001`~`FE2-006`, support `UX13-01`~`UX13-08`
- 선행 조건:
  - `docs/pm/WAVE13_UIUX_REVIEW.md`
  - `docs/handoffs/wave-012/NEXT_ORDERS.md`
  - `docs/handoffs/wave-013/PM_REPORT.md`
- 해야 할 일:
  - 공통 workflow/stage pattern을 만들고 Dashboard/Project/Source/Job/Candidate 흐름에 적용한다.
  - Source detail의 readiness와 next action hierarchy를 개선한다.
  - Candidate results를 review workspace로 다듬는다.
    - Desktop table은 유지 가능.
    - Mobile에서는 entity/relation candidates가 card/list 형태로 읽혀야 한다.
    - raw ID/raw payload는 technical details로 낮춘다.
  - Evidence viewer를 evidence-first reading order로 정리한다.
    - candidate summary와 evidence text가 먼저 읽혀야 한다.
    - locator metadata는 근거 위치로 묶되 full ID list가 첫 화면을 지배하지 않게 한다.
  - 사용자 문구를 정리한다.
    - 도메인 명사는 Project/Ontology/Source/Extraction/Candidate/Evidence 유지.
    - 설명/CTA는 자연스러운 한국어로 정리.
    - endpoint/debug/dev copy는 주 화면에서 제거.
  - `390x900`에서 Candidates, Evidence, Source detail, Job monitor를 확인한다.
  - existing hana adapter/styled-components 경계를 지킨다.
  - 업무 화면에서 `hana-style-component` 직접 import 금지.
- 제한:
  - Backend endpoint/DTO/enum 신규 요구 금지.
  - review/publish, external LLM, RAG UI 추가 금지.
  - 장식적 hero, gradient/orb/background illustration 금지.
  - 카드 안 카드 구조 금지.
- 검증:
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - actual API smoke: `npm run smoke:mvp2:actual`
  - desktop/mobile screenshot or DOM artifact
  - `git diff --check -- apps/frontend docs/handoffs/wave-013/FRONTEND_REPORT.md`
- 완료 기준:
  - `UX13-01`~`UX13-08` 자체 판정 작성.
  - 변경 파일과 artifact path를 보고.
  - `docs/handoffs/wave-013/FRONTEND_REPORT.md` 작성.

## Backend 지시

- Report path: `docs/handoffs/wave-013/BACKEND_REPORT.md`
- 기본 지시: 실행하지 않는다.
- 실행 조건:
  - Frontend/QA가 API blocker를 명시한 경우에만 실행한다.
- 현재 예상: No backend work.

## QA 지시

- Report path: `docs/handoffs/wave-013/QA_REPORT.md`
- Backlog IDs: `INT2-003`, support `FE-012`, `FE2-001`~`FE2-006`, `UX13-01`~`UX13-08`
- 선행 조건:
  - Frontend report를 먼저 읽는다.
- 해야 할 일:
  - `UX13-01`~`UX13-08` 기준으로 독립 검증한다.
  - 실제 사용자 흐름을 검증한다:
    - Dashboard/Project에서 현재 단계와 다음 action 이해 가능 여부
    - Source detail/profile/chunks readiness
    - Job monitor에서 candidate로 이어지는 action
    - Candidate review workspace desktop/mobile readability
    - Evidence viewer normal/broken/direct missing recovery
  - `390x900` viewport에서 Candidates, Evidence, Source detail, Job monitor를 screenshot/DOM으로 확인한다.
  - visible copy에 endpoint/debug/dev 중심 문구가 남았는지 확인한다.
  - MVP 2 closeout regression이 깨지지 않았는지 확인한다.
- 검증:
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - actual API smoke
  - mobile DOM/screenshot checks
  - 필요 시 selected backend regression
- 완료 기준:
  - Wave 13을 `PASS`, `PARTIAL`, `FAIL`, `NOT RUNNABLE`로 판정한다.
  - 남은 UX gap을 `UX13-*`와 backlog ID에 연결한다.
  - `docs/handoffs/wave-013/QA_REPORT.md` 작성.

## 다음 보고 위치

- PM: `docs/handoffs/wave-013/PM_REPORT.md`
- Frontend: `docs/handoffs/wave-013/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-013/QA_REPORT.md`
- Backend: `docs/handoffs/wave-013/BACKEND_REPORT.md` only if needed
