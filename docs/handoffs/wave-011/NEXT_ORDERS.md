# Next Orders - Wave 12

## 현재 단계 판정

- Previous closeout: `MVP 2 WAVE 11 CLOSEOUT PASS WITH EXCEPTION`
- New user direction: Frontend UI/UX should evolve into a product-like experience.
- Wave 12 status: `FRONTEND PRODUCTIZATION / UI-UX MATURITY STARTED`
- MVP 2 API/Backend scope remains closed unless a hard blocker is found.
- Docker Compose smoke remains a P1 environment follow-up.

## 총괄 결정

- Wave 12는 MVP 2 API 확장이 아니라 Frontend productization wave다.
- 목표는 “데모는 되지만 화면이 개발 산출물처럼 보이는 상태”에서 “사용자가 온톨로지 기반 데이터 구축 작업을 자연스럽게 수행할 수 있는 상품 경험”으로 끌어올리는 것이다.
- PM이 먼저 상품화/UX acceptance를 확정한다.
- Frontend가 중심 작업자다.
- Backend는 기본적으로 대기한다. 새 endpoint/DTO/enum 없이 기존 API 위에서 해결한다.
- QA는 실제 브라우저로 사용 흐름, 반응형, navigation clarity, regression을 검증한다.

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- `AGENTS.md`, `docs/handoffs/CURRENT_STATE.md`, 이 문서를 먼저 확인한다.
- 작업 종료 전 반드시 지정 report path에 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- MVP 2 closeout P0 contract를 깨지 않는다.
- External LLM provider, review/publish workflow, RAG, advanced PDF parsing, production auth/RBAC, 신규 candidate detail endpoint는 열지 않는다.

## 진행 순서

1. PM subagent: Wave 12 Frontend Productization acceptance 정의.
2. Frontend subagent: PM 기준에 맞춰 UI/UX/product polish 수행.
3. QA subagent: 실제 브라우저와 actual API smoke로 검증.
4. Backend subagent: 기본 미실행. QA나 Frontend가 API blocker를 명시할 때만 실행.

## PM 지시

- Report path: `docs/handoffs/wave-012/PM_REPORT.md`
- Backlog IDs: `FE-012`, `FE2-001`~`FE2-006`, support `INT2-003`
- 해야 할 일:
  - Frontend productization acceptance를 정의한다.
  - 사용자가 이해해야 하는 primary workflow를 다시 정리한다.
    - project 선택
    - ontology draft 구성
    - source upload/profile/parse
    - extraction job 생성/실행
    - candidate/evidence 확인
  - 상품화 UX 기준을 정한다.
    - app shell/navigation hierarchy
    - project context와 breadcrumb
    - page-level primary action
    - task progression/next action
    - empty/error/recovery state
    - candidate/evidence inspection density
    - responsive layout
    - visible copy style
  - Visual style guardrail을 정의한다.
    - operational SaaS 제품처럼 차분하고 정보 밀도가 있는 UI
    - landing/marketing hero 금지
    - endpoint/debug 중심 문구 금지
    - 카드 남용/카드 안 카드 지양
    - LNB는 top-level 업무 영역만 유지
    - ID-bound detail은 contextual drilldown 유지
  - QA가 검증할 browser acceptance checklist를 작성한다.
  - 필요 시 아래 문서를 갱신한다.
    - `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`
    - `docs/pm/MVP2_PREP_BRIEF.md`
    - `docs/backlog/MVP2_DRAFT_BACKLOG.md`
- 제한:
  - Backend/API 신규 요구를 만들지 않는다 unless productization blocker로 명확히 필요하다.
- 완료 기준:
  - Frontend가 바로 작업할 수 있는 구체적 UI/UX acceptance가 있어야 한다.
  - `docs/handoffs/wave-012/PM_REPORT.md`가 작성되어 있다.

## Frontend 지시

- Report path: `docs/handoffs/wave-012/FRONTEND_REPORT.md`
- Backlog IDs: `FE-012`, `FE2-001`~`FE2-006`
- 선행 조건:
  - PM Wave 12 report를 먼저 읽는다.
- 해야 할 일:
  - MVP 2 source-to-evidence journey를 상품 화면처럼 다듬는다.
  - App shell/navigation:
    - LNB top-level 구조 유지
    - 현재 project/source/job/evidence context가 보이게 한다
    - ID-bound pages는 breadcrumb/context action으로 진입
  - 화면 hierarchy:
    - 각 화면의 primary action을 분명히 한다
    - 다음 action CTA를 자연스럽게 제공한다
    - loading/empty/error/recovery state를 제품 톤으로 정리한다
  - Visual system:
    - existing hana adapter/styled-components 경계를 유지한다
    - 업무 화면에서 hana-style-component 직접 import 금지
    - spacing/type/status/table/filter/button 스타일을 일관화한다
    - endpoint/debug/dev 문구는 사용자 주 화면에서 제거하거나 낮춘다
  - Core screens polish:
    - Dashboard/Projects
    - Project detail
    - Ontology modeler
    - Source list/detail/profile/chunks
    - Extraction job create/monitor
    - Candidate results
    - Evidence viewer
  - Responsive/browser:
    - desktop과 mobile-ish viewport에서 텍스트/버튼/테이블이 겹치지 않게 한다
    - `npm run smoke:mvp2:actual` 또는 보강된 smoke로 screenshot evidence를 남긴다
  - 기존 API contract, mock/API boundary, actual API smoke를 유지한다.
- 제한:
  - 대규모 redesign으로 scope를 폭발시키지 않는다.
  - 새 backend endpoint를 요구하지 않는다.
  - review/publish, external LLM, RAG UI 추가 금지.
- 검증:
  - `npm run build`
  - `npm run test`
  - actual API smoke
  - browser screenshot/click smoke, 가능하면 desktop/mobile viewport
  - `git diff --check`
- 완료 기준:
  - 사용자가 project에서 evidence까지 흐름을 이해할 수 있어야 한다.
  - 화면이 개발용 scaffold가 아니라 MVP 제품처럼 보여야 한다.
  - `docs/handoffs/wave-012/FRONTEND_REPORT.md`가 작성되어 있다.

## Backend 지시

- Report path: `docs/handoffs/wave-012/BACKEND_REPORT.md`
- 기본 지시: 실행하지 않는다.
- 실행 조건:
  - PM/Frontend/QA가 API blocker를 명시한 경우에만 Backend subagent를 실행한다.
- 제한:
  - 신규 feature/API scope는 열지 않는다.

## QA 지시

- Report path: `docs/handoffs/wave-012/QA_REPORT.md`
- Backlog IDs: `INT2-003`, support `FE-012`, `FE2-001`~`FE2-006`
- 선행 조건:
  - PM/Frontend wave-012 report를 먼저 읽는다.
- 해야 할 일:
  - Frontend productization acceptance 기준으로 browser QA를 수행한다.
  - 실제 사용자 흐름을 검증한다.
    - project 선택/복구
    - ontology draft 구성
    - source profile/chunk
    - job create/run
    - candidate filter/browse
    - evidence normal/broken/direct fallback
  - desktop/mobile-ish viewport smoke를 수행한다.
  - LNB와 breadcrumb/contextual drilldown이 혼란스럽지 않은지 확인한다.
  - endpoint/debug 문구가 사용자 주 화면에 남아 있지 않은지 확인한다.
  - MVP 2 closeout regression이 깨지지 않았는지 확인한다.
- 완료 기준:
  - Wave 12 productization을 `PASS`, `PARTIAL`, `FAIL`로 판정한다.
  - 남은 UX gap은 `FE-012`, `FE2-*`, `INT2-003`에 연결한다.
  - `docs/handoffs/wave-012/QA_REPORT.md`가 작성되어 있다.

## 다음 보고 위치

- PM: `docs/handoffs/wave-012/PM_REPORT.md`
- Frontend: `docs/handoffs/wave-012/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-012/QA_REPORT.md`
- Backend: `docs/handoffs/wave-012/BACKEND_REPORT.md` only if needed
