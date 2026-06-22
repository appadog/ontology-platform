# QA / Integration Report - Wave 30

## 담당 범위

- backlog ID:
  - `INT6-011` MVP6.2 scope alignment
  - `INT6-012` Active Learning contract checklist
  - `INT6-013` Learning signal safety guard
  - `INT6-014` Wave31 implementation recommendation
- 작업 경로:
  - `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`
  - `docs/handoffs/wave-030/QA_REPORT.md`

## 완료한 작업

- 필수 시작 문서와 Wave30 PM/Backend/Frontend reports를 읽고 QA 범위를
  확인했다.
- `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`를 생성했다.
- PM/Backend/Frontend planning artifacts가 다음 항목에서 일치하는지 확인했다:
  - P0 demo flow;
  - learning signal taxonomy;
  - approved source artifact families;
  - prompt suggestion states;
  - accept/dismiss decision audit behavior;
  - auto-approval candidate preview-only safety;
  - no candidate/published graph/prompt/policy mutation boundary.
- Wave30 runtime scope guard를 수행했다.
  - MVP6.2 learning-signal or Learning Insights runtime terms were not found
    under `apps/` or `infra/`.
  - Existing dirty runtime files are prior-wave MVP5/MVP6.1 worktree state, not
    Wave30 MVP6.2 implementation according to role reports and targeted
    searches.
- `docs/api/openapi-mvp6-2-draft.json` JSON parse and key path/schema presence
  were verified.
- Product Showcase style guide 편입을 검토했다.
  - `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md`는 외부 원문 전체 복사가 아니라
    repo-owned MVP6 UI guidance로 요약되어 있다.
- Contract-first QA finding을 기록했다.
  - Scope and safety are acceptable.
  - Implementation-facing DTO/enum wording needs targeted hardening before
    runtime implementation.

## 변경 파일

- 생성:
  - `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`
  - `docs/handoffs/wave-030/QA_REPORT.md`
- production/runtime code 변경:
  - 없음.

## 실행/검증

- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp6-2-draft.json >/tmp/openapi-mvp6-2-draft.qa.pretty.json`
  - Node OpenAPI path/schema assertion:
    - `openapi`
    - `info.version`
    - path count
    - schema count
    - required path presence
    - key schema presence
  - Node OpenAPI enum assertion for:
    - `LearningSignalType`
    - `LearningSourceArtifactType`
    - `PromptSuggestionState`
    - `SuggestionDecisionType`
    - `SuggestionDismissReasonCode`
    - `AutoApprovalPreviewStatus`
    - `AutoApprovalHistoricalMatchOutcome`
  - Scope guard searches:
    - `rg -n "learning-signals|learning-signal|LearningInsights|Learning Insights|Active Learning|PromptSuggestion|AutoApprovalCandidate|CorrectionPattern|auto-approval candidates|MVP6\\.2|mvp6\\.2" apps infra --glob '!**/node_modules/**'`
    - `find apps/backend -path '*versions*' -type f -maxdepth 8 -print`
    - `find apps/frontend/src -maxdepth 4 -type f \( -iname '*learning*' -o -iname '*active*' -o -iname '*prompt*improvement*' -o -iname '*auto*approval*' \) -print`
    - `find apps/backend -maxdepth 6 -type f \( -iname '*learning*' -o -iname '*active*' -o -iname '*prompt*suggest*' -o -iname '*auto*approval*' \) -print`
  - Contract mismatch probe:
    - `rg -n "decision.*ACCEPTED|ACCEPTED.*decision|DISMISSED.*decision|decision.*DISMISSED|ACCEPT\\b|DISMISS\\b" docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md docs/api/MVP6_2_API_CONTRACT_DRAFT.md docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md`
  - `git diff --check`
  - `git diff --check --no-index /dev/null docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`
  - `git diff --check --no-index /dev/null docs/handoffs/wave-030/QA_REPORT.md`
- 결과:
  - `PASS`: OpenAPI planning artifact JSON parse succeeded.
  - `PASS`: OpenAPI metadata and required artifacts:
    - `openapi`: `3.1.0`
    - `info.version`: `0.6.2-draft`
    - paths: `5`
    - schemas: `37`
    - missing required paths: `[]`
    - missing key schemas: `[]`
  - `PASS`: OpenAPI enums match Backend contract expectations:
    - `LearningSignalType` has the seven PM-frozen signal types.
    - `PromptSuggestionState` is `SUGGESTED`, `ACCEPTED`, `DISMISSED`,
      `SUPERSEDED`.
    - `SuggestionDecisionType` is `ACCEPT`, `DISMISS`.
    - Auto-approval preview enums are recommendation/preview only.
  - `PASS`: MVP6.2 runtime leakage search found no matching implementation
    terms under `apps/` or `infra/`.
  - `PASS`: no MVP6.2-specific frontend/backend learning files were found.
  - `PASS`: no new Alembic migration for MVP6.2 active learning was found.
  - `PASS`: `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md` is repo-owned guidance
    and not a large external guide copy.
  - `PARTIAL`: cross-doc implementation contract needs targeted hardening:
    - Frontend decision request field says `ACCEPTED`/`DISMISSED`, while
      Backend/OpenAPI command enum is `ACCEPT`/`DISMISS`.
    - Frontend blocking summary fields need reconciliation with Backend
      `LearningSignalSummaryResponse` (`generated_at`, `source_artifact_scope`,
      missing `superseded_suggestion_count`, missing top-level
      `high_risk_suggestion_count`).
    - Frontend source artifact and auto-approval preview field lists should be
      aligned to Backend/OpenAPI enum and schema names.
  - `PASS`: final `git diff --check` produced no output.
  - `PASS`: no-index whitespace checks for newly created QA docs produced no
    output.
- 실행하지 못한 검증:
  - Backend pytest/ruff, frontend build/test/smoke, and browser checks were not
    run because Wave30 MVP6.2 runtime/frontend implementation does not exist by
    design.
  - Actual API OpenAPI export comparison was not run because
    `openapi-mvp6-2-draft.json` is a standalone planning artifact, not current
    FastAPI runtime output.

## API/Enum/DTO 변경

- 변경 여부: QA runtime 변경 없음.
- 관찰한 문서 계약 변경:
  - Backend planning artifact adds five additive MVP6.2 endpoint families and
    37 planning schemas.
  - Learning signal taxonomy is frozen as:
    `RELATION_DIRECTION_CORRECTION`, `CLASS_CONFUSION`,
    `RELATION_TYPE_CONFUSION`, `EVIDENCE_MISSING`, `EVIDENCE_MISMATCH`,
    `REPEATED_VALIDATION_FAILURE`, `LOW_BENCHMARK_METRIC_CLUSTER`.
  - Prompt suggestion states are frozen as:
    `SUGGESTED`, `ACCEPTED`, `DISMISSED`, `SUPERSEDED`.
  - Backend decision command enum is `ACCEPT`, `DISMISS`.
  - Accept/dismiss decision response includes mutation guard fields that must
    remain false.
- 영향받는 역할:
  - PM: no redesign required, but targeted contract hardening should be ordered
    before implementation.
  - Backend: keep `ACCEPT`/`DISMISS` command enum or explicitly change it in
    OpenAPI, then align Frontend wording.
  - Frontend: align request command values and blocking field names to the
    Backend/OpenAPI contract before writing TypeScript types/client/fixtures.
  - QA: re-run checklist after hardening before allowing runtime implementation.

## Blocker

- No product or safety blocker.
- Contract blocker for immediate thin implementation:
  - decision command values and several field names are not aligned across
    Frontend requirements and Backend/OpenAPI planning artifacts.

## 남은 TODO

- Wave31 targeted contract hardening:
  - Freeze decision command/state vocabulary across PM, Backend, and Frontend.
  - Freeze learning summary count/freshness/source-coverage field names.
  - Freeze source artifact enum values in Frontend requirements.
  - Freeze auto-approval preview field names and evidence quality
    representation.
  - Re-run OpenAPI JSON parse and `git diff --check`.
- After targeted hardening passes:
  - Open MVP6.2 thin implementation for Backend/Frontend with runtime tests and
    mock/actual UI checks.

## 다른 역할에 전달할 내용

- PM:
  - P0 recommendation/audit scope is sound. No PM redesign is needed.
  - Please order targeted Wave31 contract hardening instead of immediate runtime
    implementation.
- Backend:
  - OpenAPI structure is good. Keep the mutation guard and preview-only
    semantics.
  - Coordinate with Frontend on command values and field aliases before
    implementing FastAPI schemas.
- Frontend:
  - Treat `ACCEPT`/`DISMISS` as decision commands unless Backend/PM explicitly
    changes the contract.
  - Keep `ACCEPTED`/`DISMISSED` as resulting suggestion states.
  - Align summary and auto-approval preview fields before adding TypeScript
    DTOs, client calls, fixtures, routes, or components.
- QA:
  - Use `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md` as the next QA
    checklist and reclassify `INT6-012`/`INT6-014` after contract hardening.

## 총괄에게 요청하는 결정

- Approve Wave30 QA as `PARTIAL / TARGETED CONTRACT HARDENING REQUIRED`.
- Open Wave31 as targeted contract hardening, not MVP6.2 thin implementation
  yet.
- Keep runtime implementation blocked until decision command/state and field
  shape alignment is closed.

## 현재 판정

- PARTIAL
