# Next Orders - Wave 8

## 현재 단계 판정

- Overall: `MVP 2 ACTUAL API CONTRACT SYNC CLOSED / FEATURE EXPANSION READY`
- MVP 1 regression: PASS, Docker environment exception maintained
- Wave 7:
  - `INT2-001`: PASS
  - `INT2-002`: PASS
  - `INT2-003`: PASS
  - `INT2-004`: PASS
- Docker Compose smoke: NOT RUNNABLE in current environment, accepted environment exception maintained

## 총괄 결정

- Wave 8은 기능 확장을 열 수 있다.
- 단, 범위는 focused expansion으로 제한한다.
- MVP 1/MVP 2 OpenAPI artifacts는 계속 분리한다.
  - MVP 1: `docs/api/openapi-mvp1.json`
  - MVP 2: `docs/api/openapi-mvp2-draft.json`
- Wave 8에서 열 수 있는 범위:
  - retry-chain dedupe
  - candidate detail drawer/panel
  - evidence text/locator highlight
  - selected/recent project/job navigation cleanup
  - LNB hierarchy and ID-based drilldown information architecture cleanup
  - ontology-building workflow clarity and information architecture cleanup
  - ontology modeler edit/delete UX for draft classes, properties, and relations
  - browser smoke tooling regularization
- Wave 8에서 열지 않는 범위:
  - external LLM provider
  - review/publish workflow
  - RAG
  - advanced PDF parsing dependency
  - large UI redesign

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- 작업 종료 전 반드시 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 지정된 report path에 완료 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- MVP 1 regression 또는 Wave 7 contract sync가 깨지면 즉시 중단하고 보고한다.

## PM 지시

- Report path: `docs/handoffs/wave-008/PM_REPORT.md`
- Backlog IDs: `PM2-004`, support `FE2-004`~`FE2-006`, support `INT2-004`
- 해야 할 일:
  - Wave 8 focused expansion acceptance를 확정한다.
  - 사용자가 온톨로지를 구성하기 위해 따라야 하는 primary workflow를 정의한다.
    - project 선택/생성
    - ontology draft 작성
    - class/property/relation 구성
    - source upload/profile/parse
    - extraction job 생성/실행
    - candidate/evidence 확인
  - Frontend가 긴 설명문에 의존하지 않고 화면 구조, next action, 상태, 이동 경로로 흐름을 보여줄 수 있도록 acceptance를 작성한다.
  - Ontology modeler의 수정/삭제 acceptance를 확정한다.
    - draft version에서 class/property/relation은 생성, 수정, 삭제가 가능해야 한다.
    - published/archived version은 읽기 전용이며 새 draft 생성 CTA를 제공한다.
    - delete는 즉시 사라지는 물리 삭제가 아니라 backend contract의 `status=DELETED` 처리로 이해한다.
    - class 삭제 시 연결된 property/relation 영향이 UI에서 명확해야 한다.
    - 삭제 action은 확인 절차가 있어야 하며, 삭제 후 graph/list/detail 선택 상태가 깨지면 안 된다.
  - Retry-chain dedupe acceptance를 구체화한다.
    - root retry job 기준 dedupe scope
    - duplicate candidate natural key
    - duplicate evidence natural key
    - retry 후 표시해야 할 user-facing 상태
  - Candidate detail drawer/panel 범위를 정의한다.
  - Evidence highlight 범위를 정의한다.
    - table row/cell
    - text chunk/paragraph
    - missing/broken evidence fallback
  - selected/recent project/job navigation 기준을 정의한다.
  - LNB와 하위 화면의 IA 기준을 정의한다.
    - LNB에는 전역 최상위 업무 영역만 둔다.
    - 특정 project/source/job/evidence id가 필요한 화면은 LNB에 평면 나열하지 않는다.
    - ID 기반 화면은 parent screen의 row/action/context link에서 진입한다.
    - 현재 위치는 breadcrumb 또는 compact path로 표시한다.
  - browser smoke tooling을 dev dependency로 둘지, manual/headless fallback으로 둘지 결정한다.
  - 필요한 경우 `docs/backlog/MVP2_DRAFT_BACKLOG.md`, `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`, `docs/pm/MVP2_PREP_BRIEF.md`를 갱신한다.
- 완료 기준:
  - Backend/Frontend/QA가 Wave 8 구현과 검증을 같은 acceptance로 수행할 수 있다.
  - ontology-building workflow와 navigation acceptance가 문서화되어 있다.
  - `docs/handoffs/wave-008/PM_REPORT.md`가 작성되어 있다.

## Backend 지시

- Report path: `docs/handoffs/wave-008/BACKEND_REPORT.md`
- Backlog IDs: `BE2-008`, support `BE2-005`~`BE2-007`, `BE2-009`, `INT2-004`
- 해야 할 일:
  - PM Wave 8 decision을 먼저 읽는다.
  - 승인된 경우 retry-chain dedupe를 구현한다.
  - retry root/descendant 범위에서 duplicate candidate/evidence natural key를 안정적으로 처리한다.
  - status transition이 기존 `PENDING/RUNNING/SUCCESS/PARTIAL_FAILED/FAILED/RETRYING` 정책과 맞는지 확인한다.
  - 필요한 schema/example/OpenAPI 변경이 있으면 `docs/api/openapi-mvp2-draft.json`을 갱신한다.
  - MVP 1 regression, MVP 2 contract smoke, retry-chain dedupe test를 수행한다.
- 제한:
  - external LLM provider, review/publish, RAG, advanced PDF parsing은 추가하지 않는다.
  - candidate detail 전용 신규 endpoint는 만들지 않는다 unless PM이 명시 승인한다. 기존 job/candidate/evidence API를 우선 사용한다.
- 완료 기준:
  - Backend tests PASS.
  - OpenAPI freshness PASS.
  - Retry-chain dedupe behavior가 테스트로 검증된다.
  - `docs/handoffs/wave-008/BACKEND_REPORT.md`가 작성되어 있다.

## Frontend 지시

- Report path: `docs/handoffs/wave-008/FRONTEND_REPORT.md`
- Backlog IDs: `FE2-004`, `FE2-005`, `FE2-006`, support `INT2-002`~`INT2-004`
- 해야 할 일:
  - PM Wave 8 decision을 먼저 읽는다.
  - Ontology modeler에서 class/property/relation 수정과 삭제 UX를 추가한다.
    - Backend에는 이미 `PATCH /api/v1/ontology/classes/{class_id}`, `DELETE /api/v1/ontology/classes/{class_id}`, `PATCH /api/v1/ontology/properties/{property_id}`, `DELETE /api/v1/ontology/properties/{property_id}`, `PATCH /api/v1/ontology/relations/{relation_id}`, `DELETE /api/v1/ontology/relations/{relation_id}` 계약이 있다.
    - `shared/api/client.ts`, `shared/api/queries.ts`에 update/delete boundary와 mutation hook을 추가한다.
    - selected class/detail panel에서 이름, label, description, position 등 수정 가능한 값을 편집할 수 있게 한다.
    - property panel에서 label, description, data_type, cardinality, required를 수정/삭제할 수 있게 한다.
    - relation panel에서 label, description, domain/range, cardinality, required를 수정/삭제할 수 있게 한다.
    - draft version에서만 edit/delete action을 활성화한다.
    - published/archived version에서는 read-only notice와 `Create Draft Version` 또는 draft 이동 CTA를 제공한다.
    - 삭제는 confirm dialog 또는 명확한 confirmation UI를 거치고, 삭제 후 graph/list/detail selection을 안전하게 갱신한다.
    - 삭제된 element는 graph/list에서 사라져야 하며, actual API mode에서 graph refetch가 이루어져야 한다.
  - deterministic fixture shortcut 중심 navigation을 selected/recent project/job 기반 흐름으로 정리한다.
  - LNB를 “모든 페이지 나열” 구조에서 “최상위 업무 영역 + context drilldown” 구조로 정리한다.
    - LNB top-level 예시: Dashboard, Projects, Ontology, Sources, Extraction, Candidates 정도로 제한한다.
    - `/projects/:projectId`, `/sources/:sourceId`, `/extraction-jobs/:jobId`, `/candidate-evidence/:evidenceId`처럼 ID가 필요한 화면은 LNB 직접 메뉴로 두지 않는다.
    - ID 기반 화면은 list/detail row, primary action, related link, breadcrumb를 통해 타고 들어가게 한다.
    - 하위 화면에서는 breadcrumb/path 예시처럼 `Project / Source / Profile`, `Project / Extraction Job / Candidates`, `Candidate / Evidence` 맥락을 보여준다.
    - selected/recent project가 없을 때는 먼저 project 선택 또는 생성 화면으로 유도한다.
    - fixture id가 URL이나 메뉴의 중심이 되지 않도록 실제 선택된 project/source/job/evidence 상태를 기준으로 이동한다.
  - 사용자가 “내 온톨로지를 구성하기 위해 다음에 무엇을 해야 하는지” 알 수 있도록 앱 흐름을 보강한다.
    - project context가 모든 MVP2 화면에서 유지되어야 한다.
    - breadcrumbs 또는 compact step context로 현재 위치를 보여준다.
    - 각 화면의 primary action은 다음 업무 단계와 연결되어야 한다.
    - empty state는 막다른 화면이 아니라 다음 action으로 이어져야 한다.
    - source detail에서 profile/parse/extraction으로 이어지는 흐름이 분명해야 한다.
    - ontology modeler에서 draft version, class, property, relation 생성 순서가 끊기지 않아야 한다.
    - extraction job monitor에서 candidates/evidence로 이동하는 길이 명확해야 한다.
  - sidebar/topbar/project selector/navigation label을 점검하고, 사용자 업무 흐름에 맞지 않는 shortcut 또는 fixture 중심 entry를 정리한다.
  - 긴 안내문이나 기능 설명을 잔뜩 추가하는 방식이 아니라, 레이아웃/상태/CTA/이동 경로로 흐름을 해결한다.
  - candidate result 화면에 detail drawer 또는 detail panel을 추가한다.
  - evidence viewer에 evidence locator highlight를 추가한다.
    - row/cell evidence
    - paragraph/chunk evidence
    - missing/broken evidence fallback
  - retry-chain dedupe 결과를 job monitor/candidate 화면에서 오해 없이 표시한다.
  - actual API mode smoke를 수행한다.
  - `npm run build`를 수행한다.
- 제한:
  - review/publish workflow UI는 만들지 않는다.
  - external LLM provider 설정 UI는 만들지 않는다.
  - RAG 화면은 만들지 않는다.
  - 대규모 리디자인은 하지 않는다.
- 완료 기준:
  - selected/recent flow로 MVP2 주요 화면을 이동할 수 있다.
  - draft ontology modeler에서 class/property/relation 생성, 수정, 삭제가 모두 actual API mode로 동작한다.
  - published/archived ontology version에서는 edit/delete가 비활성화되고 다음 action이 명확하다.
  - LNB가 전역 최상위 업무 영역만 보여주고, ID 기반 하위 화면은 parent context에서 drilldown으로 접근된다.
  - 새 사용자가 Project → Ontology → Source → Extraction → Candidate/Evidence 흐름을 UI 이동만으로 따라갈 수 있다.
  - 주요 empty/loading/error 상태에 다음 action이 연결되어 있다.
  - candidate detail/evidence highlight가 actual API data로 동작한다.
  - `docs/handoffs/wave-008/FRONTEND_REPORT.md`가 작성되어 있다.

## QA 지시

- Report path: `docs/handoffs/wave-008/QA_REPORT.md`
- Backlog IDs: `INT2-002`, `INT2-003`, `INT2-004`
- 선행 조건:
  - PM/Backend/Frontend wave-008 report를 먼저 읽는다.
- 해야 할 일:
  - MVP 1 regression gate를 재확인한다.
  - Wave 7 contract sync가 유지되는지 재확인한다.
  - Ontology modeler CRUD smoke를 수행한다.
    - draft version에서 class 생성/수정/삭제
    - property 생성/수정/삭제
    - relation 생성/수정/삭제
    - 삭제 후 graph/list/detail selection 정상화
    - published/archived version read-only 동작
  - Retry-chain dedupe smoke를 수행한다.
  - ontology-building workflow smoke를 수행한다.
    - project 선택/생성 진입
    - ontology draft/class/property/relation 이동
    - source profile/parse 이동
    - extraction job 생성/monitor 이동
    - candidate/evidence 확인 이동
  - Candidate detail/evidence highlight smoke를 수행한다.
  - selected/recent project/job navigation smoke를 수행한다.
  - LNB/drilldown IA smoke를 수행한다.
    - LNB에 ID 기반 detail page가 평면 메뉴로 노출되지 않는지 확인한다.
    - project/source/job/candidate/evidence detail이 parent screen에서 contextual action으로 연결되는지 확인한다.
    - breadcrumb/path가 현재 project/source/job/evidence 맥락을 잃지 않는지 확인한다.
  - Browser automation 또는 documented fallback을 사용해 화면 evidence를 남긴다.
  - Docker CLI가 있으면 Compose smoke를 재시도하고, 없으면 기존 환경 예외를 유지한다.
- 완료 기준:
  - Wave 8 focused expansion을 PASS/PARTIAL/FAIL로 명확히 판정한다.
  - Ontology modeler edit/delete UX가 사용자가 온톨로지를 구성하는 데 충분한지 PASS/PARTIAL/FAIL로 판정한다.
  - UI 흐름이 사용자가 온톨로지 구성 과정을 이해하는 데 충분한지 PASS/PARTIAL/FAIL로 판정한다.
  - LNB와 하위 page drilldown 구조가 사용자 혼란을 줄이는지 PASS/PARTIAL/FAIL로 판정한다.
  - Wave 9에서 더 넓은 MVP2 기능을 열어도 되는지 판단한다.
  - `docs/handoffs/wave-008/QA_REPORT.md`가 작성되어 있다.

## 다음 보고 위치

- PM: `docs/handoffs/wave-008/PM_REPORT.md`
- Backend: `docs/handoffs/wave-008/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-008/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-008/QA_REPORT.md`
