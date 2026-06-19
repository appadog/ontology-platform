# Next Orders - Wave 9

## 현재 단계 판정

- Overall: `MVP 2 WAVE 8 FOCUSED EXPANSION PARTIAL / TARGETED HARDENING REQUIRED`
- MVP 1 regression: PASS, Docker environment exception maintained
- Wave 7 contract sync: PASS
- Wave 8:
  - Retry-chain dedupe: PASS
  - UI ontology-building workflow clarity: PASS
  - `INT2-003`: PASS
  - `INT2-004`: PASS
  - Ontology modeler edit/delete UX: PARTIAL
  - LNB/drilldown IA: PARTIAL
  - Candidate detail/evidence highlight: PARTIAL

## 총괄 결정

- Wave 9는 더 넓은 MVP 2 기능 확장이 아니라 targeted hardening wave다.
- Retry-chain dedupe는 PASS로 수용한다.
- Backend는 class delete orphan property issue를 우선 수정한다.
- Frontend는 delete confirmation, evidence breadcrumb/fallback, LNB/drilldown residual gaps를 보강한다.
- QA는 full contract sync가 아니라 targeted regression을 수행한다.
- External LLM provider, review/publish workflow, RAG, advanced PDF parsing, large redesign은 여전히 열지 않는다.

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- 작업 종료 전 반드시 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 지정된 report path에 완료 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- MVP 1 regression 또는 Wave 7 contract sync가 깨지면 즉시 중단하고 보고한다.

## PM 지시

- Report path: `docs/handoffs/wave-009/PM_REPORT.md`
- Backlog IDs: support `BE-004`, `BE-005`, `FE-005`, `FE-014`, `FE2-006`, `INT2-002`
- 해야 할 일:
  - Ontology class delete semantics를 확정한다.
    - class soft delete 시 연결 property/relation을 함께 `DELETED` 처리할지
    - 아니면 graph/extraction endpoint에서 deleted class에 연결된 property/relation을 제외할지 결정한다.
  - Delete confirmation copy acceptance를 확정한다.
    - class name
    - affected property count
    - inbound relation count
    - outbound relation count
    - draft-only 적용 사실
  - Evidence broken/direct route fallback acceptance를 확정한다.
    - source id
    - source segment id
    - validation code
    - parent candidate/job 복귀 action
  - LNB/drilldown targeted acceptance를 재확인한다.
  - 필요한 경우 `docs/backlog/MVP2_DRAFT_BACKLOG.md`, `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`, `docs/pm/MVP2_PREP_BRIEF.md`를 갱신한다.
- 완료 기준:
  - Backend/Frontend/QA가 orphan property, delete confirm, evidence fallback을 같은 기준으로 닫을 수 있다.
  - `docs/handoffs/wave-009/PM_REPORT.md`가 작성되어 있다.

## Backend 지시

- Report path: `docs/handoffs/wave-009/BACKEND_REPORT.md`
- Backlog IDs: `BE-004`, `BE-005`, support `INT2-002`, support `INT2-003`
- 해야 할 일:
  - PM Wave 9 decision을 먼저 읽는다.
  - class soft delete 후 deleted class에 연결된 property가 `GET /api/v1/ontology/versions/{version_id}/graph`의 `properties[]`에 남지 않도록 수정한다.
  - 연결 relation도 deleted class를 domain/range로 가진 경우 graph에서 제외되거나 함께 `DELETED` 처리되어야 한다.
  - extraction `_classes_for_version`/`_relations_for_version` 및 후보 생성 input에서 deleted ontology element가 제외되는지 확인하고 필요 시 수정한다.
  - 기존 ontology class/property/relation PATCH/DELETE 계약은 유지한다.
  - 필요한 경우 `docs/api/openapi-mvp2-draft.json` freshness를 유지한다. schema 변경이 없다면 diff 없어도 된다.
  - regression test를 추가/수정한다.
    - class delete 후 orphan property 없음
    - class delete 후 connected relation 없음
    - extraction input에서 deleted element 제외
    - existing MVP1/MVP2 smoke 유지
- 제한:
  - physical delete로 바꾸지 않는다 unless PM이 명시 승인한다.
  - external LLM provider, review/publish, RAG, advanced PDF parsing은 추가하지 않는다.
  - candidate detail 전용 신규 endpoint는 만들지 않는다.
- 완료 기준:
  - Backend tests PASS.
  - Orphan property graph issue 재현 케이스가 PASS로 바뀐다.
  - OpenAPI freshness PASS.
  - `docs/handoffs/wave-009/BACKEND_REPORT.md`가 작성되어 있다.

## Frontend 지시

- Report path: `docs/handoffs/wave-009/FRONTEND_REPORT.md`
- Backlog IDs: `FE-005`, `FE-014`, `FE2-006`, support `INT2-002`
- 해야 할 일:
  - PM/Backend Wave 9 report를 먼저 읽는다.
  - Ontology modeler delete confirmation을 보강한다.
    - class delete confirm에서 class name, affected property count, inbound relation count, outbound relation count를 분리 표시한다.
    - class/property/relation delete confirm copy에 draft-only 적용 사실을 포함한다.
    - 삭제 후 graph/list/detail selection이 안전하게 clear되거나 parent/draft context로 이동한다.
  - Backend orphan property fix 이후 actual API mode에서 graph refetch 결과를 기준으로 UI가 deleted/orphan element를 표시하지 않는지 확인한다.
  - Evidence viewer breadcrumb/link context를 보강한다.
    - project/source/job/candidate/evidence 맥락을 가능한 범위에서 breadcrumb 또는 compact path로 표시한다.
    - broken evidence fallback에 source id, source segment id, validation code, parent candidate/job 복귀 action을 표시한다.
  - LNB/drilldown residual gaps를 정리한다.
    - ID 기반 detail page가 LNB에 평면 노출되지 않도록 유지한다.
    - parent row/action/context link에서 detail로 들어가는 흐름을 QA가 확인할 수 있게 한다.
  - actual API mode smoke와 `npm run build`를 수행한다.
- 제한:
  - 새 review/publish workflow UI를 만들지 않는다.
  - external LLM provider 설정 UI를 만들지 않는다.
  - RAG 화면을 만들지 않는다.
  - 대규모 리디자인을 하지 않는다.
- 완료 기준:
  - Delete confirm acceptance가 충족된다.
  - Evidence broken/direct route fallback이 parent context를 제공한다.
  - Backend orphan fix와 함께 graph/list/detail이 안정적으로 동작한다.
  - `docs/handoffs/wave-009/FRONTEND_REPORT.md`가 작성되어 있다.

## QA 지시

- Report path: `docs/handoffs/wave-009/QA_REPORT.md`
- Backlog IDs: `INT2-002`, support `FE-005`, `FE-014`, support `BE-004`, `BE-005`
- 선행 조건:
  - PM/Backend/Frontend wave-009 report를 먼저 읽는다.
- 해야 할 일:
  - MVP 1 regression gate를 재확인한다.
  - Wave 7 contract sync가 유지되는지 재확인한다.
  - Targeted ontology delete regression을 수행한다.
    - class 생성
    - property 생성
    - relation 생성
    - class 삭제
    - graph refetch에서 orphan property/connected relation 미노출 확인
    - deleted ontology element가 extraction input에 들어가지 않는지 확인
  - Frontend delete confirmation smoke를 수행한다.
    - class name
    - property count
    - inbound/outbound relation count
    - draft-only copy
    - property/relation delete confirm
  - Evidence fallback/breadcrumb smoke를 수행한다.
    - normal evidence route
    - broken evidence route
    - parent candidate/job/source 복귀 action
  - LNB/drilldown targeted smoke를 수행한다.
  - Browser automation 또는 documented fallback을 사용해 화면 evidence를 남긴다.
  - Docker CLI가 있으면 Compose smoke를 재시도하고, 없으면 기존 환경 예외를 유지한다.
- 완료 기준:
  - Wave 9 targeted hardening을 PASS/PARTIAL/FAIL로 명확히 판정한다.
  - Wave 10에서 더 넓은 MVP 2 기능 확장을 열어도 되는지 판단한다.
  - `docs/handoffs/wave-009/QA_REPORT.md`가 작성되어 있다.

## 다음 보고 위치

- PM: `docs/handoffs/wave-009/PM_REPORT.md`
- Backend: `docs/handoffs/wave-009/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-009/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-009/QA_REPORT.md`
