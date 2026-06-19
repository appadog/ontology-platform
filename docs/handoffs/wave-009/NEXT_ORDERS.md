# Next Orders - Wave 10

## 현재 단계 판정

- Overall: `MVP 2 WAVE 9 TARGETED HARDENING PASS / WAVE 10 BROADER LOCAL DEMO EXPANSION READY`
- MVP 1 regression gate: PASS
- Wave 7 contract sync 유지: PASS
- Wave 9 targeted hardening:
  - Ontology delete orphan issue: PASS
  - Delete confirmation UX: PASS
  - Evidence fallback/breadcrumb context: PASS
  - LNB/drilldown targeted smoke: PASS
- Docker Compose smoke: Docker CLI 부재로 `NOT RUNNABLE`, 기존 environment exception 유지

## 총괄 결정

- Wave 10은 더 넓은 MVP 2 local demo expansion을 연다.
- 단, PM 결정이 먼저다. PM이 Wave 10 acceptance를 확정한 뒤 Backend/Frontend가 병렬 진행하고, 마지막에 QA가 broader local demo regression을 수행한다.
- Wave 10 목표는 사용자가 source profile/parse → prompt/job 생성 → mock extraction 실행/retry → candidate/evidence 확인 흐름을 로컬에서 반복 검증할 수 있게 하는 것이다.
- External LLM provider, review/publish workflow, RAG, advanced PDF parsing, 신규 candidate detail endpoint, 대규모 리디자인은 여전히 열지 않는다.

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- `docs/handoffs/CURRENT_STATE.md`와 이 문서를 먼저 확인한다.
- 작업 종료 전 반드시 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 지정된 report path에 완료 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- MVP 1 regression, Wave 7 contract sync, Wave 9 targeted hardening이 깨지면 즉시 중단하고 보고한다.

## 진행 순서

1. PM이 먼저 Wave 10 acceptance와 fixture/source/prompt/job 정책을 확정한다.
2. Backend와 Frontend는 PM report를 읽은 뒤 병렬 작업한다.
3. QA는 PM/Backend/Frontend report를 모두 읽은 뒤 broader MVP 2 local demo regression을 수행한다.

## PM 지시

- Report path: `docs/handoffs/wave-010/PM_REPORT.md`
- Backlog IDs: `PM2-001`, `PM2-002`, `PM2-003`, `PM2-004`, `PM2-005`, support `INT2-001`~`INT2-004`
- 해야 할 일:
  - Wave 10 MVP 2 local demo acceptance를 확정한다.
    - source upload/profile/parse/chunk
    - prompt template/version 선택
    - extraction job 생성/실행/retry/failure
    - candidate entity/relation 결과 확인
    - normal/missing/broken evidence 확인
  - Fixture catalog 기준을 확정한다.
    - `default`: 정상 candidate/evidence
    - `partial_invalid`: missing evidence warning/partial failure
    - `invalid_evidence_reference`: broken evidence fallback
    - `missing`: `MOCK_FIXTURE_NOT_FOUND` failure path
  - Broken evidence fixture에서 `source_segment_id`가 반드시 non-null이어야 하는지, 아니면 UI placeholder fallback으로 충분한지 결정한다.
  - Prompt lifecycle 범위를 결정한다.
    - Wave 10에서 active version 표시만 할지
    - active version 변경 API/UI까지 열지 여부
  - Source profile/parse acceptance를 결정한다.
    - CSV/Excel empty/small/mixed/null sample 처리
    - TXT/PDF deterministic parse/chunk warnings 처리
  - Frontend visible copy 기준을 정리한다.
    - 사용자 화면에는 endpoint/debug 설명을 최소화하고, 행동 가능한 CTA/status/breadcrumb 중심으로 흐름을 전달한다.
  - 필요한 경우 `docs/backlog/MVP2_DRAFT_BACKLOG.md`, `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`, `docs/pm/MVP2_PREP_BRIEF.md`를 갱신한다.
- 제한:
  - External LLM provider, review/publish workflow, RAG, advanced PDF parsing, 신규 candidate detail endpoint를 열지 않는다.
- 완료 기준:
  - Backend/Frontend/QA가 같은 fixture/source/prompt/job/evidence 기준으로 작업할 수 있다.
  - `docs/handoffs/wave-010/PM_REPORT.md`가 작성되어 있다.

## Backend 지시

- Report path: `docs/handoffs/wave-010/BACKEND_REPORT.md`
- Backlog IDs: `BE2-001`, `BE2-002`, `BE2-003`, `BE2-004`, `BE2-005`, `BE2-006`, `BE2-007`, `BE2-008`, `BE2-009`
- 선행 조건:
  - PM Wave 10 report를 먼저 읽는다.
- 해야 할 일:
  - PM이 확정한 fixture catalog를 backend actual API에서 안정적으로 재현 가능하게 한다.
    - `default`
    - `partial_invalid`
    - `invalid_evidence_reference`
    - `missing`
  - source profile/parse edge case regression을 보강한다.
    - CSV/Excel profile columns, inferred type, null ratio, distinct/sample values
    - empty/small/mixed sample handling
    - TXT/PDF deterministic parse/chunk warnings
  - extraction job lifecycle regression을 보강한다.
    - create
    - run success
    - partial failure
    - missing fixture failure
    - retry and dedupe preservation
    - masked model run raw_request/raw_response
  - candidate/evidence persistence를 검증한다.
    - normal evidence
    - missing evidence warning
    - invalid evidence reference
    - entity/relation candidate query filters
  - Prompt template/version active handling을 PM 결정에 맞게 보강한다.
    - schema 변경이 필요하면 OpenAPI export와 docs를 함께 갱신한다.
    - schema 변경이 없으면 existing DTO를 유지한다.
  - `docs/api/openapi-mvp2-draft.json` freshness를 유지한다.
- 제한:
  - External LLM provider adapter는 추가하지 않는다.
  - review/publish/RAG/advanced PDF parsing은 추가하지 않는다.
  - 신규 candidate detail endpoint는 만들지 않는다 unless PM이 명시 승인한다.
- 완료 기준:
  - Backend full pytest PASS.
  - fixture catalog smoke PASS.
  - OpenAPI MVP2 draft freshness PASS.
  - `docs/handoffs/wave-010/BACKEND_REPORT.md`가 작성되어 있다.

## Frontend 지시

- Report path: `docs/handoffs/wave-010/FRONTEND_REPORT.md`
- Backlog IDs: `FE2-001`, `FE2-002`, `FE2-003`, `FE2-004`, `FE2-005`, `FE2-006`
- 선행 조건:
  - PM Wave 10 report를 먼저 읽는다.
  - Backend Wave 10 report가 완료되기 전에는 mock/API boundary를 유지하고, 완료 후 actual API smoke를 수행한다.
- 해야 할 일:
  - source → extraction → candidate → evidence 흐름을 사용자가 따라갈 수 있게 다듬는다.
    - source detail에서 profile/parse/chunk로 이어지는 CTA와 상태를 명확히 한다.
    - extraction job create에서 source, ontology version, prompt version, fixture 선택을 명확히 한다.
    - fixture 선택 UI는 QA가 `default`, `partial_invalid`, `invalid_evidence_reference`, `missing`을 재현할 수 있어야 한다.
  - job monitor UX를 보강한다.
    - success, partial failure, failed, retry 상태와 model run metadata를 읽기 쉽게 표시한다.
    - retry 후 dedupe/reused/skipped 정보를 기존 contract 범위에서 표시한다.
  - candidate/evidence browsing을 보강한다.
    - entity/relation, validation status/code, evidence presence filter를 실제 API와 mock 양쪽에서 유지한다.
    - missing/broken evidence empty/error/fallback state가 crash 없이 parent context로 복구된다.
  - 사용자 화면의 기술 설명을 줄인다.
    - endpoint 이름, fixture/debug 설명, "Backend actual API mode" 같은 문구는 필요한 경우 dev-facing report나 작고 덜 눈에 띄는 debug context로 낮춘다.
    - 사용자에게는 primary action, status, breadcrumb, row action, empty state 중심으로 흐름을 보여준다.
  - LNB는 top-level 업무 영역만 유지하고 ID-bound detail route를 평면 노출하지 않는다.
  - `npm run build`, actual API route smoke, browser screenshot/click smoke를 수행한다.
- 제한:
  - review/publish action UI를 만들지 않는다.
  - external LLM provider 설정 UI를 만들지 않는다.
  - RAG 화면을 만들지 않는다.
  - 대규모 visual redesign을 하지 않는다.
- 완료 기준:
  - 사용자 흐름이 source부터 evidence까지 끊기지 않는다.
  - fixture catalog를 UI에서 재현할 수 있다.
  - actual API mode smoke PASS.
  - `docs/handoffs/wave-010/FRONTEND_REPORT.md`가 작성되어 있다.

## QA 지시

- Report path: `docs/handoffs/wave-010/QA_REPORT.md`
- Backlog IDs: `INT2-001`, `INT2-002`, `INT2-003`, `INT2-004`
- 선행 조건:
  - PM/Backend/Frontend wave-010 report를 먼저 읽는다.
- 해야 할 일:
  - MVP 1 regression gate를 재확인한다.
  - Wave 7 contract sync와 Wave 9 targeted hardening이 유지되는지 확인한다.
  - Broader MVP 2 local demo regression을 수행한다.
    - CSV/Excel upload/profile/preview
    - TXT/PDF upload/parse/chunk
    - prompt template/version 준비
    - extraction job create/run
    - `default` fixture success
    - `partial_invalid` fixture partial failure/missing evidence
    - `invalid_evidence_reference` fixture broken evidence fallback
    - `missing` fixture failure path
    - retry/dedupe 유지
    - candidate filters
    - evidence normal/missing/broken route
  - Frontend browser smoke를 수행한다.
    - source detail/profile/chunk
    - job create/monitor
    - candidate results
    - evidence viewer
    - LNB/contextual drilldown
  - Docker CLI가 있으면 Compose smoke를 재시도하고, 없으면 기존 environment exception을 유지한다.
- 완료 기준:
  - Wave 10 broader local demo를 PASS/PARTIAL/FAIL로 판정한다.
  - 다음 wave가 MVP 2 closeout 준비인지, 추가 targeted hardening인지 결정 제안을 남긴다.
  - `docs/handoffs/wave-010/QA_REPORT.md`가 작성되어 있다.

## 다음 보고 위치

- PM: `docs/handoffs/wave-010/PM_REPORT.md`
- Backend: `docs/handoffs/wave-010/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-010/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-010/QA_REPORT.md`
