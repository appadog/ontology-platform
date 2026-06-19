# PM / Architecture Hardening Decision Report - Wave 21

## 담당 범위
- backlog ID:
  - `INT4-001` MVP4 contract/runtime alignment
  - `INT4-007` MVP3 regression guard
  - `INT4-008` external read-only API
- 작업 경로:
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `docs/handoffs/wave-021/PM_REPORT.md`

## 완료한 작업
- Wave20 QA FAIL 근거와 Backend/Frontend 보고서를 검토했다.
- Commander default decision을 수용했다.
  - actual FastAPI OpenAPI가 standalone `ExternalApiEnvelopeBase` component를 emit하지 않아도 된다.
  - concrete external envelope schemas가 `auth_mode`, `project_id`, relevant optional published graph version context, and `data`를 보존하면 actual runtime contract로 인정한다.
  - QA는 abstract base component 존재가 아니라 concrete envelope shape를 비교한다.
- `INT4-001` acceptance checklist에 runtime OpenAPI envelope 비교 기준을 명시했다.
- no scope expansion을 재확인했다.
  - weighted composite score는 P1이다.
  - collaboration/SLA는 P1이다.
  - production vector DB hardening은 P1이다.
  - production API keys/service accounts는 MVP5이다.

## 변경 파일
- `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
- `docs/handoffs/wave-021/PM_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `git diff --check -- docs/backlog/INT4_MVP4_ACCEPTANCE.md docs/handoffs/wave-021/PM_REPORT.md`
  - `git diff --no-index --check /dev/null docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `git diff --no-index --check /dev/null docs/handoffs/wave-021/PM_REPORT.md`
- 결과:
  - PASS. Whitespace error 출력 없음.
  - 현재 작업트리에서 MVP4 문서 묶음이 untracked 상태라 일반 `git diff --check` 출력은 없었고, untracked 파일은 `--no-index --check`로 추가 확인했다.
- 실행하지 못한 검증:
  - Backend/Frontend runtime smoke는 이 PM decision task 범위가 아니어서 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세:
  - API path, enum literal, DTO field를 변경하지 않았다.
  - acceptance 기준만 명확히 했다.
  - `ExternalApiEnvelopeBase`는 planning draft의 abstract/base schema로 유지한다.
  - actual OpenAPI에서는 concrete external envelope schemas가 required envelope fields를 보존하면 contract-aligned로 본다.
- 영향받는 역할:
  - Backend: standalone `ExternalApiEnvelopeBase` component를 강제로 emit할 필요는 없다. Concrete external envelope schemas의 `auth_mode`, `project_id`, relevant optional published graph version context, and `data` 보존을 테스트하면 된다.
  - Frontend: concrete envelope schemas 기준으로 actual DTO/client를 맞추면 된다.
  - QA: `INT4-001` OpenAPI compare에서 abstract base component presence 대신 concrete envelope shape를 비교한다.

## Blocker
- PM decision blocker: 없음.
- 남은 Wave21 blocker:
  - Backend `INT4-008`: external source/evidence valid dev-auth read가 Wave20에서 500을 반환했다.
  - Frontend `INT4-007`: `npm run smoke:mvp3:actual`이 Wave20에서 published graph route marker assertion으로 실패했다.
  - Frontend actual MVP4 route probe는 RAG, graph, prompt telemetry, external API marker/state 보강이 필요하다.

## 남은 TODO
- Backend:
  - external source/evidence 500 수정과 regression test 추가.
  - concrete external envelope field comparison을 OpenAPI critical compare에 반영.
- Frontend:
  - MVP3 actual smoke PASS 복구.
  - MVP4 actual smoke/route markers 보강.
- QA:
  - PM envelope decision을 반영해 `INT4-001`, `INT4-005`, `INT4-006`, `INT4-007`, `INT4-008` targeted rerun.

## 다른 역할에 전달할 내용
- PM:
  - Scope expansion 없음. Wave21은 hardening only로 유지한다.
- Backend:
  - default decision accepted. `ExternalApiEnvelopeBase` standalone actual component를 만들지 말고, concrete external envelopes의 required fields와 source/evidence 200 fix에 집중해도 된다.
- Frontend:
  - API/DTO는 concrete envelope shape 기준으로 동기화한다. Production API key/service account UI는 MVP5 범위라 추가하지 않는다.
- QA:
  - `ExternalApiEnvelopeBase` absence alone must not fail `INT4-001` when concrete envelopes preserve required fields.

## 총괄에게 요청하는 결정
- 추가 결정 요청 없음. Commander default decision을 수용했고 acceptance 기준에 반영했다.
- Backend/Frontend는 Wave21 hardening을 진행해도 된다.

## 현재 판정
- PASS
