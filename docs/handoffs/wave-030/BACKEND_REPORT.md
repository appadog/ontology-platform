# Backend Report - Wave 30

## 담당 범위
- backlog ID:
  - `BE6-012` Learning signal API contract
  - `BE6-013` Correction pattern and prompt suggestion DTOs
  - `BE6-014` Suggestion decision API contract
  - `BE6-015` MVP6.2 OpenAPI planning artifact
- 작업 경로:
  - `docs/api/MVP6_2_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp6-2-draft.json`
  - `docs/handoffs/wave-030/BACKEND_REPORT.md`

## 완료한 작업
- Wave30 PM freeze와 MVP6.2 Active Learning brief를 기준으로 planning-only
  API contract draft를 작성했다.
- Runtime FastAPI route, DB model, Alembic migration, seed, worker, test
  implementation은 추가하지 않았다.
- PM freeze의 P0 demo flow를 지원하는 additive endpoint family를 정의했다:
  - `GET /api/v1/projects/{project_id}/learning-signals/summary`
  - `GET /api/v1/projects/{project_id}/learning-signals/correction-patterns`
  - `GET /api/v1/projects/{project_id}/learning-signals/prompt-suggestions`
  - `GET /api/v1/projects/{project_id}/learning-signals/auto-approval-candidates`
  - `POST /api/v1/learning-signal-suggestions/{suggestion_id}/decisions`
- 기존 MVP6.1 evaluation endpoints와 충돌하지 않도록
  `/learning-signals/...` 및 `/learning-signal-suggestions/...` additive path만
  사용했다.
- Learning signal summary, correction pattern, prompt suggestion,
  auto-approval candidate preview, suggestion decision/audit note DTO 예시를
  문서 계약에 포함했다.
- P0 enum 후보를 계약에 고정했다:
  - `LearningSignalType`
  - `LearningSourceArtifactType`
  - `PromptSuggestionKind`
  - `PromptSuggestionState`
  - `SuggestionDecisionType`
  - `SuggestionDismissReasonCode`
  - `LearningConfidenceLabel`
  - `LearningRiskLabel`
  - `AutoApprovalPreviewStatus`
  - `AutoApprovalHistoricalMatchOutcome`
- Suggestion decision endpoint는 human accept/dismiss audit note만 생성하는
  write-like operation으로 정의했다.
- Decision response에 `mutation_guard`를 포함해 prompt version, candidate
  graph, published graph, auto-approval policy, extraction job, evaluation run
  mutation이 모두 `false`여야 함을 계약화했다.
- Auto-approval candidate는 `recommendation_only`, `not_enforced`,
  `requires_later_policy_approval`, `blocked_actions`를 노출하는 preview-only
  DTO로 정의했다.
- `docs/api/openapi-mvp6-2-draft.json` standalone planning artifact를 생성했다.
  이 파일은 MVP6.2 additive paths/schemas만 포함하며
  `docs/api/openapi-mvp6-draft.json`를 대체하지 않는다.

## 변경 파일
- 생성:
  - `docs/api/MVP6_2_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp6-2-draft.json`
  - `docs/handoffs/wave-030/BACKEND_REPORT.md`
- 수정:
  - 없음.

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp6-2-draft.json >/tmp/openapi-mvp6-2-draft.pretty.json`
  - OpenAPI metadata parse:
    - `openapi`
    - `info.version`
    - path count
    - schema count
  - `git diff --check`
  - 신규 untracked 산출물 whitespace 보조 확인:
    - `git diff --check --no-index /dev/null docs/api/MVP6_2_API_CONTRACT_DRAFT.md`
    - `git diff --check --no-index /dev/null docs/api/openapi-mvp6-2-draft.json`
    - `git diff --check --no-index /dev/null docs/handoffs/wave-030/BACKEND_REPORT.md`
- 결과:
  - `PASS`: OpenAPI planning artifact JSON parse 성공.
  - `PASS`: OpenAPI metadata 확인:
    - `openapi`: `3.1.0`
    - `info.version`: `0.6.2-draft`
    - paths: `5`
    - schemas: `37`
  - `PASS`: `git diff --check` 출력 없음.
  - `PASS`: 신규 untracked 산출물 no-index whitespace 보조 확인 출력 없음.
- 실행하지 못한 검증:
  - Wave30 Backend 범위는 계약 문서 작성이므로 backend pytest, ruff,
    OpenAPI runtime export compare, frontend build/smoke는 실행하지 않았다.
  - Runtime API를 만들지 않았기 때문에 `/docs` actual OpenAPI export에는
    MVP6.2 planning paths가 나타나지 않는 것이 정상이다.

## API/Enum/DTO 변경
- 변경 여부: 있음, 문서 계약 및 planning OpenAPI artifact만 변경.
- 상세:
  - Runtime API 변경 없음.
  - DB schema/migration 변경 없음.
  - Seed/test implementation 변경 없음.
  - 새 endpoint family는 additive planning contract다.
  - `LearningSignalSummaryResponse`, `CorrectionPattern`,
    `PromptSuggestion`, `AutoApprovalCandidatePreview`,
    `SuggestionDecisionRequest`, `SuggestionDecisionResponse`,
    `SuggestionDecisionAuditNote`, `LearningSourceArtifactRef`,
    `MutationGuard` DTO를 정의했다.
  - Prompt suggestion states는 PM freeze와 같이 `SUGGESTED`, `ACCEPTED`,
    `DISMISSED`, `SUPERSEDED`를 사용한다.
  - Human decision request는 `ACCEPT` 또는 `DISMISS`만 허용한다.
    `SUPERSEDED`는 P0 read-side state이며 직접 human decision으로 설정하지
    않는다.
  - `DISMISS`에는 reason code가 필요하고, `ACCEPT`는 future prompt draft
    intent를 기록할 뿐 prompt version을 mutate하지 않는다.
- 영향받는 역할:
  - Frontend:
    - Learning Insights IA/field review에서 위 DTO와 enum을 기준으로 loading,
      empty, error, permission-limited, decided-state UI를 검토해야 한다.
    - "Accepted"는 적용 완료가 아니라 future prompt draft intent임을 표시해야
      한다.
    - Auto-approval candidate UI는 recommendation-only/not-enforced semantics를
      명확히 보여야 한다.
  - QA:
    - `INT6-012`, `INT6-013`에서 taxonomy, source artifact refs, decision
      audit behavior, mutation guard, auto-approval preview safety를 검증할 수
      있다.
    - OpenAPI artifact parse 대상은
      `docs/api/openapi-mvp6-2-draft.json`이다.
  - PM:
    - 후속 Wave31에서 runtime implementation을 열 경우 이 draft를 기준으로
      state transition conflict/idempotency 세부 정책을 freeze하면 된다.

## Blocker
- 없음.
- 주의:
  - 현재 작업트리에는 이전 wave 및 다른 역할의 modified/untracked 파일이 다수
    있다. Backend는 지정된 Wave30 문서 산출물만 생성했고 기존 변경을 되돌리거나
    덮어쓰지 않았다.
  - `git diff --check`는 git이 추적 중인 변경 기준 명령이다. 이번 산출물은
    신규 untracked 파일이므로 OpenAPI JSON parse와 문서 자체 검토를 별도로
    수행했다.

## 남은 TODO
- Frontend:
  - `FE6-011`~`FE6-014`에서 Learning Insights IA, correction pattern dashboard,
    prompt improvement board, auto-approval candidate review 요구사항을 작성한다.
  - Backend DTO 중 optional/null field와 permission-limited state에 대한
    blocking/optional 요구를 보고한다.
- QA:
  - `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`를 작성하고 PM/Backend/
    Frontend artifact 정합성을 검증한다.
  - Runtime code leakage, candidate/published graph mutation, auto-approval
    enforcement leakage가 없음을 확인한다.
- Backend 후속:
  - Wave31이 implementation으로 열리면, 이 planning artifact를 실제 FastAPI
    schemas/routes/tests/OpenAPI export로 승격할지 PM/QA 승인 후 결정한다.
  - Runtime 구현 전에는 source artifact materialization 방식과
    suggestion decision idempotency 정책을 추가로 freeze하는 것이 좋다.

## 다른 역할에 전달할 내용
- PM:
  - MVP6.2 Backend contract는 PM freeze의 recommendation/audit loop를 따랐다.
  - Auto-approval enforcement, prompt mutation, fine-tuning/retraining/export,
    governance/impact/agent/connector/multi-tenant scope는 열지 않았다.
- Backend:
  - 이 wave에서는 runtime code를 만들지 않았다. 후속 구현 시에도 decision
    endpoint는 audit-only mutation boundary를 지켜야 한다.
  - Source artifact refs가 없는 learning signal은 P0 display/prompt suggestion
    input으로 부적합하다.
- Frontend:
  - List endpoints는 empty array와 counts `0`을 정상 empty state로 처리할 수
    있게 계약화했다.
  - Auto-approval preview DTO의 `blocked_actions`와 safety flags는 UI에서
    강하게 노출해야 한다.
- QA:
  - OpenAPI artifact는 standalone planning-only이며 actual backend export와
    비교 대상이 아니다.
  - `POST /decisions`가 write-like이지만 prompt/candidate/published graph/policy
    mutation을 금지한다는 점을 acceptance checklist에 넣어 달라.

## 총괄에게 요청하는 결정
- Wave30 Backend contract draft를 PASS로 승인하고 Frontend/QA가 이 계약을
  기준으로 requirements/checklist를 이어가도록 허용해 달라.
- 후속 Wave31 시작 전, runtime implementation인지 targeted contract hardening인지
  QA checklist 결과로 결정해 달라.

## 현재 판정
- PASS
