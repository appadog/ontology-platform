# Frontend Report - Wave 31

## 담당 범위

- backlog ID:
  - `FE6-016` Decision vocabulary UX alignment
  - `FE6-017` Backend field naming alignment
- 작업 경로:
  - `docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/handoffs/wave-031/FRONTEND_REPORT.md`

## 완료한 작업

- Wave31 targeted contract hardening 범위로 Frontend UX requirements만
  업데이트했다.
- Runtime route, component, API client, mock fixture, seed, smoke/test code는
  생성하거나 수정하지 않았다.
- Decision vocabulary를 Wave31 PM freeze에 맞췄다:
  - request command values: `ACCEPT`, `DISMISS`
  - resulting display/state values: `ACCEPTED`, `DISMISSED`
  - `SUPERSEDED`는 read-side state only
  - non-`SUGGESTED` suggestion에 대한 command는 conflict가 기본
- Learning summary blocking fields를 Wave31 freeze 이름으로 맞췄다:
  - `generated_at`
  - `source_artifact_scope`
  - `signal_counts`
  - `open_prompt_suggestion_count`
  - `accepted_prompt_suggestion_count`
  - `dismissed_prompt_suggestion_count`
  - `superseded_prompt_suggestion_count`
  - `high_risk_prompt_suggestion_count`
  - `auto_approval_preview_count`
- Source artifact enum values를 Backend/OpenAPI `LearningSourceArtifactType`
  기준으로 명시했다:
  - `REVIEW_DECISION`
  - `REVIEW_CORRECTION`
  - `VALIDATION_RESULT`
  - `QUALITY_METRIC`
  - `QUALITY_DRILLDOWN`
  - `EVALUATION_RUN`
  - `EVALUATION_METRIC`
  - `EVALUATION_ERROR_CASE`
- Auto-approval preview blocking fields를 `id`,
  `historical_match_preview`, `source_artifacts`, `supporting_metrics`,
  `safety_note` 중심으로 정렬했다.
- `candidate_id`, 별도 historical count fields,
  `evidence_quality_summary`를 Frontend blocking field에서 제거했다.
- Backend Wave31 report는 작업 시점에 아직 없어서, Wave31 PM report와 현재
  Backend/OpenAPI planning artifact를 기준으로 정렬했다.

## 변경 파일

- 수정:
  - `docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md`
- 생성:
  - `docs/handoffs/wave-031/FRONTEND_REPORT.md`

## 실행/검증

- 실행한 명령:
  - `git diff --check`
  - `rg -n 'computed_at|signal_counts_by_type|source_artifact_coverage|accepted_suggestion_count|dismissed_suggestion_count|superseded_suggestion_count|high_risk_suggestion_count|auto_approval_candidate_count|candidate_id|historical_match_count|historical_match_denominator|evidence_quality_summary' docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md`
  - no-index whitespace wrapper for `docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md`
  - no-index whitespace wrapper for `docs/handoffs/wave-031/FRONTEND_REPORT.md`
- 결과:
  - `PASS`: `git diff --check` 출력 없음.
  - `PASS`: UX requirements에서 old drift exact terms 검색 결과 없음.
  - `PASS`: no-index whitespace wrappers 출력 없음.
- 실행하지 못한 검증:
  - Frontend build/test/smoke, backend tests, OpenAPI runtime export compare는
    수행하지 않았다. Wave31 Frontend 범위는 문서 계약 정렬이며 runtime
    implementation은 명시적으로 금지되어 있다.

## API/Enum/DTO 변경

- 변경 여부: 있음, 문서 요구사항/계약 정렬만 있음.
- 상세:
  - Runtime API, Backend DTO implementation, OpenAPI artifact, Frontend
    TypeScript type/client/mock은 변경하지 않았다.
  - Frontend UX requirements의 request command/state vocabulary와 blocking
    field names를 Wave31 PM freeze 및 Backend/OpenAPI naming 방향에 맞췄다.
- 영향받는 역할:
  - Backend:
    - Wave31 Backend hardening에서 summary counts와 auto-approval preview
      fields가 동일한 이름으로 노출되는지 확인해야 한다.
  - QA:
    - `INT6-012`와 `INT6-014`에서 Frontend requirements의 old drift terms가
      제거됐는지 재검증할 수 있다.

## Blocker

- 없음.
- 주의:
  - 작업 시점에 `docs/handoffs/wave-031/BACKEND_REPORT.md`는 아직 존재하지
    않았다. Frontend는 PM freeze와 현재 Backend/OpenAPI planning artifact를
    기준으로 문서만 정렬했다.

## 남은 TODO

- Backend:
  - Wave31 Backend report와 OpenAPI hardening 산출물이 나오면 QA가 같은 frozen
    names로 교차 검증한다.
- QA:
  - `INT6-012`와 `INT6-014`를 재실행하고 Wave32 thin implementation 가능
    여부를 판정한다.
- Frontend:
  - Wave32 implementation이 명시적으로 열리기 전까지 runtime route/component/
    client/mock code를 만들지 않는다.

## 다른 역할에 전달할 내용

- PM:
  - Frontend UX requirements는 PM hardening freeze를 따랐고 MVP6.2 P0 범위를
    넓히지 않았다.
- Backend:
  - Decision request는 `ACCEPT`/`DISMISS`만 사용한다. UI 표시와 state 필터는
    `ACCEPTED`/`DISMISSED`/`SUPERSEDED`를 read-side state로 유지한다.
  - Auto-approval preview는 `id`, `historical_match_preview`,
    `source_artifacts`, `supporting_metrics`, `safety_note`를 blocking field로
    요구한다.
- Frontend:
  - Future implementation에서는 accepted suggestion을 applied/deployed로
    표시하지 않는다.
  - non-`SUGGESTED` suggestion의 decision action은 숨기거나 비활성화하고,
    Backend conflict가 오면 이미 결정된/historical state로 표시한다.
- QA:
  - UX requirements에서 `candidate_id`, `historical_match_count`,
    `historical_match_denominator`, `evidence_quality_summary`,
    `signal_counts_by_type`, `computed_at` exact drift terms가 제거됐다.

## 총괄에게 요청하는 결정

- Wave31 Frontend targeted hardening을 PASS로 승인하고, Backend/QA가 같은
  frozen names 기준으로 후속 검증을 진행하도록 해 달라.
- Runtime implementation은 PM/Backend/Frontend/QA hardening reports가 모두
  나온 뒤 Wave32에서만 열어 달라.

## 현재 판정

- PASS
