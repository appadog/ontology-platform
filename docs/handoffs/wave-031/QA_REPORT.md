# QA / Integration Report - Wave 31

## 담당 범위

- backlog ID:
  - `INT6-015` MVP6.2 hardening recheck
  - `INT6-016` Wave32 implementation recommendation
- 작업 경로:
  - `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`
  - `docs/handoffs/wave-031/QA_REPORT.md`

## 완료한 작업

- Wave31 PM, Backend, Frontend reports를 읽고 targeted contract hardening
  결과를 재검증했다.
- PM brief, Backend API draft, OpenAPI planning artifact, Frontend UX
  requirements, INT6.2 acceptance checklist를 기준으로 command/state와 DTO
  field alignment를 확인했다.
- `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md` verdict를 Wave31
  recheck 기준으로 업데이트했다.
- Decision command/state vocabulary alignment를 확인했다:
  - request command: `ACCEPT`, `DISMISS`
  - resulting states: `ACCEPTED`, `DISMISSED`
  - `SUPERSEDED`: read-side only
  - non-`SUGGESTED` command: default conflict
- Summary field alignment를 확인했다:
  - `generated_at`
  - `source_artifact_scope`
  - `signal_counts`
  - `open_prompt_suggestion_count`
  - `accepted_prompt_suggestion_count`
  - `dismissed_prompt_suggestion_count`
  - `superseded_prompt_suggestion_count`
  - `high_risk_prompt_suggestion_count`
  - `auto_approval_preview_count`
- Source artifact enum alignment를 확인했다. `VALIDATION_RESULT`와
  `EVALUATION_METRIC`이 PM, Backend/OpenAPI, Frontend requirements 모두에
  포함되어 있다.
- Auto-approval preview field alignment를 확인했다:
  - `id`
  - `historical_match_preview`
  - `source_artifacts`
  - `supporting_metrics`
  - `safety_note`
  - `evidence_quality_summary`는 P0 required field가 아니다.
- Scope guard를 재확인했다. Wave31 artifacts는 runtime implementation을
  열지 않았고, targeted leakage search에서 MVP6.2 learning-signal runtime
  hit가 없었다.
- Wave32는 MVP6.2 thin implementation으로 진입해도 된다고 권고한다.

## 변경 파일

- 수정:
  - `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`
- 생성:
  - `docs/handoffs/wave-031/QA_REPORT.md`
- Runtime code 변경:
  - 없음.

## 실행/검증

- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp6-2-draft.json >/tmp/openapi-mvp6-2-draft.wave31-qa.pretty.json`
  - `node <<'NODE' <OpenAPI path/schema/required-field/enum assertion script> NODE`
  - `rg -n 'computed_at|signal_counts_by_type|source_artifact_coverage|accepted_suggestion_count|dismissed_suggestion_count|superseded_suggestion_count|high_risk_suggestion_count|auto_approval_candidate_count|candidate_id|historical_match_count|historical_match_denominator|evidence_quality_summary|"ACCEPTED"\s*/\s*"DISMISSED"|decision request.*ACCEPTED|decision request.*DISMISSED' docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md`
  - `rg -n "learning-signals|learning-signal|LearningInsights|Learning Insights|Active Learning|PromptSuggestion|AutoApprovalCandidate|CorrectionPattern|auto-approval candidates|MVP6\\.2|mvp6\\.2" apps infra --glob '!**/node_modules/**'`
  - `git status --short -- apps infra`
  - `git diff --check`
  - `git diff --check --no-index /dev/null docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`
  - `git diff --check --no-index /dev/null docs/handoffs/wave-031/QA_REPORT.md`
- 결과:
  - `PASS`: OpenAPI JSON parse 성공. Pretty artifact:
    `/tmp/openapi-mvp6-2-draft.wave31-qa.pretty.json`.
  - `PASS`: Node assertion 결과:
    - `openapi`: `3.1.0`
    - `info.version`: `0.6.2-draft`
    - paths: `5`
    - schemas: `37`
    - decision command enum: `ACCEPT`, `DISMISS`
    - prompt suggestion state enum: `SUGGESTED`, `ACCEPTED`, `DISMISSED`,
      `SUPERSEDED`
    - summary required fields checked: `9`
    - auto-preview required fields checked: `5`
    - forbidden auto-preview fields absent:
      `candidate_id`, `historical_match_count`,
      `historical_match_denominator`, `evidence_quality_summary`
  - `PASS`: Frontend requirements old drift exact-term search returned no
    matches. `rg` exit code `1` means no matches for this command.
  - `PASS`: runtime leakage search under `apps/` and `infra/` returned no
    MVP6.2 active-learning implementation hits. `rg` exit code `1` means no
    matches for this command.
  - `INFO`: `git status --short -- apps infra` shows prior-wave runtime
    modified/untracked files in MVP5/MVP6.1 areas. This is not a Wave31 blocker
    because Wave31 role reports changed only planning docs/reports and the
    targeted MVP6.2 leakage search returned no runtime implementation hits.
  - `PASS`: `git diff --check` 출력 없음.
  - `PASS`: no-index whitespace checks for the updated checklist and this QA
    report produced no whitespace diagnostics. Direct no-index commands return
    exit code `1` because each file differs from `/dev/null`; empty diagnostic
    output is treated as success.
- 실행하지 못한 검증:
  - Backend pytest/ruff, frontend build/test/smoke, actual API smoke, Docker
    Compose smoke는 수행하지 않았다. Wave31 범위는 planning contract
    recheck이며 MVP6.2 runtime implementation은 아직 존재하지 않는다.

## API/Enum/DTO 변경

- 변경 여부: 있음, planning contract hardening 확인 및 QA checklist verdict
  업데이트만 있음.
- 상세:
  - QA가 runtime API, DB model, migration, frontend route/component/client/mock,
    seed, smoke/test code를 추가하거나 수정하지 않았다.
  - Backend/OpenAPI planning artifact는 Wave31 Backend report 기준으로
    `LearningSignalSummaryResponse`, `SuggestionDecisionType`,
    `PromptSuggestionState`, `LearningSourceArtifactType`,
    `AutoApprovalCandidatePreview` naming을 PM freeze와 맞춘 상태다.
  - QA는 위 변경을 검증하고 checklist verdict를 업데이트했다.
- 영향받는 역할:
  - PM: Wave31 hardening PASS 승인 가능.
  - Backend: Wave32 thin implementation 시 frozen DTO/enum names를 그대로
    구현해야 한다.
  - Frontend: Wave32 thin implementation 시 UX requirements의 blocking fields
    와 command/state vocabulary를 그대로 따라야 한다.

## Blocker

- 없음.

## 남은 TODO

- Wave32:
  - MVP6.2 thin Backend/Frontend implementation을 열 수 있다.
  - 구현 범위는 frozen P0 endpoint families, DTO names, no-mutation boundary,
    deterministic seed/mock/smoke evidence로 제한한다.
  - Runtime acceptance checks는 Wave32 구현 후 추가한다.

## 다른 역할에 전달할 내용

- PM:
  - 추가 PM redesign이나 Wave32 전 targeted hardening pass는 필요하지 않다.
- Backend:
  - request command는 `ACCEPT`/`DISMISS`만 구현한다.
  - `SUPERSEDED`는 P0 read-side state로 유지한다.
  - non-`SUGGESTED` decision command는 conflict가 기본이다.
  - Auto-approval preview는 recommendation-only/not-enforced semantics를
    유지한다.
- Frontend:
  - UI action labels는 사용자 친화적으로 표현할 수 있지만 API request value는
    `ACCEPT`/`DISMISS`를 사용한다.
  - accepted suggestion을 applied/deployed prompt change처럼 표시하지 않는다.
  - `evidence_quality_summary`를 blocking field로 요구하지 않는다.
- QA:
  - Wave32에서는 runtime implementation 이후 actual API/mock/route smoke와
    mutation guard assertions를 추가한다.

## 총괄에게 요청하는 결정

- Wave31 MVP6.2 targeted contract hardening recheck를 `PASS`로 승인해 달라.
- Wave32를 MVP6.2 thin implementation wave로 열어 달라.

## 현재 판정

- PASS
