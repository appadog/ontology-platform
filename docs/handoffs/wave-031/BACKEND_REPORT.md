# Backend / API Architecture Report - Wave 31

## 담당 범위

- backlog ID:
  - `BE6-016` Decision vocabulary contract alignment
  - `BE6-017` Learning summary field alignment
  - `BE6-018` Source artifact and auto-approval preview field alignment
- 작업 경로:
  - `docs/api/MVP6_2_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp6-2-draft.json`
  - `docs/handoffs/wave-031/BACKEND_REPORT.md`

## 완료한 작업

- Wave31 PM freeze와 `PM_REPORT.md` 기준으로 Backend/OpenAPI planning
  contract를 targeted hardening했다.
- Runtime FastAPI route, service, model, migration, seed, worker, test
  implementation은 만들지 않았다.
- Decision vocabulary 계약을 확인하고 유지했다:
  - request command enum: `ACCEPT`, `DISMISS`
  - suggestion state enum: `SUGGESTED`, `ACCEPTED`, `DISMISSED`, `SUPERSEDED`
  - `SUPERSEDED`는 P0 read-side state이며 human decision command가 아니다.
- `LearningSignalSummaryResponse`에 PM freeze 필드를 추가했다:
  - `superseded_prompt_suggestion_count`
  - `high_risk_prompt_suggestion_count`
- Summary 계약이 `generated_at`, `source_artifact_scope`,
  `signal_counts`를 쓰는 상태를 유지하고 예시/required/schema를 맞췄다.
- `LearningSourceArtifactType` enum이 PM freeze와 일치함을 확인했다:
  - `REVIEW_DECISION`
  - `REVIEW_CORRECTION`
  - `VALIDATION_RESULT`
  - `QUALITY_METRIC`
  - `QUALITY_DRILLDOWN`
  - `EVALUATION_RUN`
  - `EVALUATION_METRIC`
  - `EVALUATION_ERROR_CASE`
- `AutoApprovalCandidatePreview`가 `id`,
  `historical_match_preview`, `source_artifacts`, `supporting_metrics`,
  `safety_note`를 사용하고, `evidence_quality_summary`를 추가하지 않음을
  확인했다.
- Mutation guard와 preview-only semantics는 변경하지 않았다.

## 변경 파일

- 수정:
  - `docs/api/MVP6_2_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp6-2-draft.json`
- 생성:
  - `docs/handoffs/wave-031/BACKEND_REPORT.md`
- Runtime code 변경:
  - 없음.

## 실행/검증

- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp6-2-draft.json >/tmp/openapi-mvp6-2-draft.wave31.pretty.json`
  - Node OpenAPI schema assertion:
    - OpenAPI metadata
    - required path presence
    - summary required fields/properties/example fields
    - `LearningSourceArtifactType`
    - `PromptSuggestionState`
    - `SuggestionDecisionType`
    - `AutoApprovalCandidatePreview` required fields
    - forbidden auto-preview fields absence
  - `git diff --check`
- 결과:
  - `PASS`: OpenAPI JSON parse 성공.
  - `PASS`: Node assertion 결과:
    - `openapi`: `3.1.0`
    - `info.version`: `0.6.2-draft`
    - paths: `5`
    - schemas: `37`
    - summary required fields checked: `9`
    - source artifact enum matches PM freeze.
    - prompt suggestion state enum is `SUGGESTED`, `ACCEPTED`, `DISMISSED`,
      `SUPERSEDED`.
    - decision command enum is `ACCEPT`, `DISMISS`.
    - auto-preview required fields checked: `5`.
    - forbidden auto-preview fields absent:
      `candidate_id`, `historical_match_count`,
      `historical_match_denominator`, `evidence_quality_summary`.
  - `PASS`: `git diff --check` exit code `0`, 출력 없음.
- 실행하지 못한 검증:
  - Backend pytest/ruff, runtime OpenAPI export compare, frontend build/smoke는
    수행하지 않았다. Wave31 Backend 범위가 planning contract hardening이고
    runtime implementation 금지였기 때문이다.

## API/Enum/DTO 변경

- 변경 여부: 있음, 문서 계약 및 planning OpenAPI artifact만 변경.
- 상세:
  - Runtime API 변경 없음.
  - DB schema/migration 변경 없음.
  - Seed/test implementation 변경 없음.
  - `LearningSignalSummaryResponse`에
    `superseded_prompt_suggestion_count`와
    `high_risk_prompt_suggestion_count`를 required field/property/example로
    추가했다.
  - Decision command/state enum, source artifact enum, auto-approval preview
    field names는 PM freeze와 일치하는 상태를 유지했다.
- 영향받는 역할:
  - Frontend:
    - Summary DTO에서 같은 field names를 사용해야 한다.
    - Decision request는 `ACCEPT`/`DISMISS`, resulting state는
      `ACCEPTED`/`DISMISSED`로 분리해야 한다.
    - Auto-approval preview는 `evidence_quality_summary` 없이
      `source_artifacts`, `supporting_metrics`,
      `historical_match_preview`, `safety_note`로 표현해야 한다.
  - QA:
    - `INT6-012`와 `INT6-014` 재검증 시 위 schema assertion 기준을 사용할 수
      있다.

## Blocker

- 없음.
- 주의:
  - 작업 시작 시 기존 modified/untracked 파일이 다수 있었다. Backend는 지정된
    두 API 문서와 Wave31 Backend report만 변경했고, PM/Frontend/QA 또는 기존
    wave 변경을 되돌리거나 덮어쓰지 않았다.

## 남은 TODO

- Frontend:
  - `docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md`를 동일한 field/enum naming에
    맞춘다.
- QA:
  - Wave31 PM/Backend/Frontend 결과를 기준으로 `INT6-012`와 `INT6-014`를
    재검증한다.
- Backend:
  - 추가 TODO 없음. Runtime implementation은 Wave32 승인 전까지 열지 않는다.

## 다른 역할에 전달할 내용

- PM:
  - PM freeze를 Backend/OpenAPI planning artifact에 반영했다. Scope redesign은
    필요하지 않다.
- Backend:
  - 후속 runtime 구현 전까지 이 artifact는 planning-only 계약이다.
  - Decision endpoint는 audit-only mutation boundary와 conflict semantics를
    유지해야 한다.
- Frontend:
  - Summary field names는 `generated_at`, `source_artifact_scope`,
    `signal_counts`, `superseded_prompt_suggestion_count`,
    `high_risk_prompt_suggestion_count`를 기준으로 맞춘다.
  - Auto-approval preview에는 별도 `evidence_quality_summary`를 요구하지
    않는다.
- QA:
  - OpenAPI parse/schema assertion은 PASS다. Frontend requirements alignment
    이후 cross-doc drift가 닫혔는지 재확인해 달라.

## 총괄에게 요청하는 결정

- Wave31 Backend targeted contract hardening을 PASS로 승인하고, Frontend/QA가
  같은 frozen names로 후속 정합성 검증을 진행하도록 해 달라.
- MVP6.2 runtime implementation은 Wave31 Frontend/QA report 이후 Wave32에서
  별도 승인해 달라.

## 현재 판정

- PASS
