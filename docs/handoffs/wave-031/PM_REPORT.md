# PM / Architecture Report - Wave 31

## 담당 범위

- backlog ID:
  - `PM6-014` Decision command/state vocabulary freeze
  - `PM6-015` DTO field naming freeze
- 작업 경로:
  - `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-031/PM_REPORT.md`

## 완료한 작업

- Wave31을 MVP6.2 targeted contract hardening으로 수행했다. Runtime API,
  DB migration, frontend route/component, mock/client, seed, smoke/test
  implementation은 만들지 않았다.
- Decision vocabulary를 freeze했다:
  - request command values: `ACCEPT`, `DISMISS`
  - resulting prompt suggestion states: `ACCEPTED`, `DISMISSED`
  - read-side state: `SUPERSEDED`
  - non-`SUGGESTED` 상태에 대한 command는 conflict가 기본
- Learning summary field names를 freeze했다:
  - `generated_at`
  - `source_artifact_scope`
  - `signal_counts`
  - `open_prompt_suggestion_count`
  - `accepted_prompt_suggestion_count`
  - `dismissed_prompt_suggestion_count`
  - `superseded_prompt_suggestion_count`
  - `high_risk_prompt_suggestion_count`
  - `auto_approval_preview_count`
- Source artifact enum은 Backend/OpenAPI `LearningSourceArtifactType`과
  맞추는 것으로 확정했다:
  - `REVIEW_DECISION`
  - `REVIEW_CORRECTION`
  - `VALIDATION_RESULT`
  - `QUALITY_METRIC`
  - `QUALITY_DRILLDOWN`
  - `EVALUATION_RUN`
  - `EVALUATION_METRIC`
  - `EVALUATION_ERROR_CASE`
- Auto-approval preview field naming을 `id`, `historical_match_preview`,
  `source_artifacts`, `supporting_metrics`, `safety_note` 중심으로 freeze했다.
  별도 `evidence_quality_summary`는 MVP6.2 P0 기본 필드로 추가하지 않는다.
- `docs/backlog/MVP6_DRAFT_BACKLOG.md`에 `PM6-014`와 `PM6-015`를 추가하고,
  `BE6-014` 문구에서 `SUPERSEDED`가 human command처럼 읽히지 않도록
  정정했다.

## 변경 파일

- 수정:
  - `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
- 생성:
  - `docs/handoffs/wave-031/PM_REPORT.md`

## 실행/검증

- 실행한 명령:
  - `git diff --check`
  - `git diff --check --no-index /dev/null docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md`
  - `git diff --check --no-index /dev/null docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `git diff --check --no-index /dev/null docs/handoffs/wave-031/PM_REPORT.md`
  - no-index whitespace wrapper for the three untracked PM files
- 결과:
  - `PASS`: `git diff --check` exit code `0`, 출력 없음.
  - `PASS`: no-index checks produced no whitespace diagnostics. Direct
    no-index commands return exit code `1` because each file differs from
    `/dev/null`, so the wrapper treats empty diagnostic output as success.
- 실행하지 못한 검증:
  - PM/Architecture 문서 범위라 backend/frontend runtime test, OpenAPI JSON
    parse, frontend build/smoke는 수행하지 않았다.

## API/Enum/DTO 변경

- 변경 여부: 있음, PM 문서 계약 freeze만 있음.
- 상세:
  - Runtime API, OpenAPI artifact, DB schema, frontend TypeScript type은
    변경하지 않았다.
  - Backend/OpenAPI는 후속 Wave31 Backend 작업에서
    `superseded_prompt_suggestion_count`,
    `high_risk_prompt_suggestion_count`, command/state enum, source artifact
    enum, auto-approval preview field names를 반영해야 한다.
  - Frontend requirements는 후속 Wave31 Frontend 작업에서 command values와
    resulting states를 분리하고, summary/source artifact/auto-approval field
    names를 Backend/OpenAPI와 맞춰야 한다.
- 영향받는 역할:
  - Backend
  - Frontend
  - QA

## Blocker

- 없음.
- 주의:
  - 현재 작업트리에는 이전 wave와 다른 역할의 modified/untracked 파일이 다수
    있다. PM은 지정된 PM/backlog/handoff 문서만 편집했고 기존 변경을
    되돌리거나 덮어쓰지 않았다.

## 남은 TODO

- Backend:
  - `docs/api/MVP6_2_API_CONTRACT_DRAFT.md`와
    `docs/api/openapi-mvp6-2-draft.json`를 PM freeze에 맞춰 업데이트한다.
- Frontend:
  - `docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md`를 PM/Backend naming에 맞춘다.
- QA:
  - `INT6-012`와 `INT6-014`를 재검증하고 Wave32 thin implementation 가능
    여부를 판정한다.

## 다른 역할에 전달할 내용

- PM:
  - MVP6.2 scope redesign은 필요하지 않다. Wave31은 구현 전 contract drift
    제거만 수행한다.
- Backend:
  - `ACCEPT`/`DISMISS`만 request command다. `ACCEPTED`/`DISMISSED`는 response
    resulting state이며 `SUPERSEDED`는 read-side state다.
  - non-`SUGGESTED` 상태에 대한 decision command는 conflict가 기본이다.
  - Learning summary required field list에
    `superseded_prompt_suggestion_count`와
    `high_risk_prompt_suggestion_count`를 포함해야 한다.
- Frontend:
  - Decision UI action label은 사용자 친화적으로 표현할 수 있으나 API command
    value는 `ACCEPT`/`DISMISS`로 맞춘다.
  - `evidence_quality_summary`를 별도 P0 field로 요구하지 말고
    `source_artifacts`, `supporting_metrics`, `historical_match_preview`,
    `safety_note`로 evidence quality를 표현한다.
- QA:
  - PM 문서 기준으로 Backend/OpenAPI와 Frontend requirements의 naming drift가
    닫혔는지 확인해 달라.

## 총괄에게 요청하는 결정

- Wave31 PM targeted hardening을 PASS로 승인하고 Backend/Frontend가 같은
  frozen names로 문서 계약을 맞추도록 진행해 달라.
- Runtime implementation은 Backend/Frontend/QA hardening report가 나온 뒤
  Wave32에서 열지 판단해 달라.

## 현재 판정

- PASS
