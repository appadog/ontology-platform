# PM / Architecture Scope Guard Report - Wave 20

## 담당 범위
- backlog ID: `PM4-001`~`PM4-008`, `INT4-001`~`INT4-008`
- 작업 경로:
  - `docs/handoffs/wave-020/PM_REPORT.md`
- 확인만 수행한 경로:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-020/NEXT_ORDERS.md`
  - `docs/handoffs/wave-019/PM_REPORT.md`
  - `docs/handoffs/wave-019/BACKEND_REPORT.md`
  - `docs/handoffs/wave-019/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-019/QA_REPORT.md`
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/backlog/MVP4_DRAFT_BACKLOG.md`
  - `docs/pm/MVP4_PREP_BRIEF.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`

## 완료한 작업
- Wave19 PM, Backend, Frontend, QA 보고서가 모두 MVP4 contract-first PASS로 정렬되어 있음을 확인했다.
- Wave20 implementation priorities가 Wave19 계약을 벗어나지 않음을 확인했다.
- Wave20 P0 thin implementation 범위를 다음으로 고정했다:
  - deterministic MVP4 seed.
  - Backend additive endpoints, schemas, tests, and actual OpenAPI export alignment.
  - Frontend DTO/client/mock foundation and first UI slices.
  - first slices for quality, search/vector/RAG, graph explorer states, datasets/performance, and external API docs.
  - MVP3 regression guard.
- P1 제외를 재확인했다:
  - weighted composite quality score.
  - production vector DB hardening.
  - collaboration/SLA.
  - production API keys/service accounts.
  - broad graph performance optimization beyond `SAFE_TOO_LARGE`.
- `docs/backlog/INT4_MVP4_ACCEPTANCE.md`의 Wave20 entry recommendation이 위 범위와 일치함을 확인했다.
- `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`의 non-blocking refinements는 Wave20 구현 중 고려 사항이며 새 PM 결정을 요구하지 않는다고 판단했다.
- 새 PM decision 또는 backlog/prep clarification은 필요하지 않다고 판단했다.
- 앱 runtime/backend/frontend 코드는 수정하지 않았다.

## 변경 파일
- `docs/handoffs/wave-020/PM_REPORT.md`
- 수정하지 않음:
  - `docs/backlog/MVP4_DRAFT_BACKLOG.md`
  - `docs/pm/MVP4_PREP_BRIEF.md`

## 실행/검증
- 실행한 명령:
  - `sed -n '1,260p' AGENTS.md`
  - `sed -n '1,260p' .agents/skills/handoff-reporting/SKILL.md`
  - `sed -n '1,260p' docs/handoffs/CURRENT_STATE.md`
  - `sed -n '1,260p' docs/handoffs/wave-020/NEXT_ORDERS.md`
  - `sed -n '1,260p' docs/handoffs/wave-019/PM_REPORT.md`
  - `sed -n '1,260p' docs/handoffs/wave-019/BACKEND_REPORT.md`
  - `sed -n '1,260p' docs/handoffs/wave-019/FRONTEND_REPORT.md`
  - `sed -n '1,260p' docs/handoffs/wave-019/QA_REPORT.md`
  - `sed -n '1,320p' docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `sed -n '1,320p' docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`
  - `sed -n '1,360p' docs/backlog/MVP4_DRAFT_BACKLOG.md`
  - `sed -n '1,260p' docs/pm/MVP4_PREP_BRIEF.md`
  - `sed -n '1,260p' docs/handoffs/REPORT_TEMPLATE.md`
  - `rg -n "weighted composite|production vector|collaboration|SLA|service accounts|SAFE_TOO_LARGE|safe-too-large|deterministic|MVP3 regression|Wave20|Wave 20" docs/backlog/INT4_MVP4_ACCEPTANCE.md docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md docs/backlog/MVP4_DRAFT_BACKLOG.md docs/pm/MVP4_PREP_BRIEF.md docs/handoffs/wave-020/NEXT_ORDERS.md`
  - `sed -n '502,535p' docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `git diff --check -- docs/handoffs/wave-020/PM_REPORT.md`
  - `git diff --no-index --check /dev/null docs/handoffs/wave-020/PM_REPORT.md`
- 결과:
  - 필수 문서 확인 완료.
  - Wave20 scope guard PASS: Wave20 priorities are consistent with Wave19 PM freeze, Backend contract draft, Frontend field/state review, and QA checklist.
  - `git diff --check -- docs/handoffs/wave-020/PM_REPORT.md` PASS with no whitespace error output.
  - `git diff --no-index --check /dev/null docs/handoffs/wave-020/PM_REPORT.md` returned expected diff exit code `1` for new/untracked file, with no whitespace error output.
- 실행하지 못한 검증:
  - PM scope guard 문서 작업이므로 backend/frontend test/build/runtime smoke는 실행하지 않았다.
  - MVP4 runtime acceptance는 아직 Backend/Frontend thin implementation 전이므로 실행 대상이 아니다.

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세:
  - 새 API, enum, DTO 결정을 열지 않았다.
  - Wave19 frozen enum and DTO boundaries remain source of truth:
    - `EvaluationDatasetStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`
    - `GoldenSetItemKind`: `ENTITY`, `RELATION`, `PROPERTY_VALUE`, `EVIDENCE_LINK`
    - `PromptExperimentStatus`: `DRAFT`, `RUNNING`, `COMPLETED`, `CANCELLED`
    - `RagAnswerState`, `GraphExploreState`, `VectorAdapterStatus`, and `ExternalApiAuthMode` stay as Wave19 Backend/QA recorded.
  - Frontend non-blocking refinements are implementation-time considerations, not PM scope changes.
- 영향받는 역할:
  - Backend: may proceed with additive MVP4 runtime implementation against Wave19 contract artifacts.
  - Frontend: may proceed mock-first and actual-client-ready against Wave19 OpenAPI/UX requirements.
  - QA: should execute `INT4-001`~`INT4-008` as runtime becomes available; keep `INT4-009` P1.

## Blocker
- PM scope blocker: 없음.
- Wave20 Backend/Frontend start blocker: 없음.
- Known runtime gates:
  - deterministic MVP4 seed must exist before full QA runtime PASS.
  - actual Backend OpenAPI must be compared against `docs/api/openapi-mvp4-draft.json`.
  - Frontend MVP4 route smoke depends on first UI slices.
  - MVP3 regression guard must remain passing before Wave20 completion.

## 남은 TODO
- Backend:
  - Implement additive MVP4 endpoints/OpenAPI, deterministic seed, tests, and read-only/candidate-exclusion negative checks.
- Frontend:
  - Implement DTO/client/mock foundation and first project-scoped UI slices while preserving MVP3 routes.
- QA:
  - Run `INT4-001`~`INT4-008` where runtime exists, keep `INT4-009` P1, and verify MVP3 regression.
- Commander:
  - If Wave20 QA is PARTIAL, issue focused Wave21 hardening before broader MVP4 depth.

## 다른 역할에 전달할 내용
- PM:
  - No new PM decision is needed for Wave20.
  - Do not promote collaboration/SLA or weighted composite score into P0.
- Backend:
  - Proceed after this report.
  - Keep implementation additive to MVP3.
  - RAG/search/graph/external surfaces must stay read-only and must exclude candidate graph facts from answer facts/citations.
  - `SAFE_TOO_LARGE` is the P0 graph safety boundary; broader graph performance optimization remains P1.
- Frontend:
  - Proceed after this report.
  - Keep MVP4 routes project-scoped and detail routes contextual.
  - Do not invent a P0 composite quality score.
  - Treat vector fallback, insufficient evidence, stale/partial index, selected version, and `SAFE_TOO_LARGE` as first-class states.
- QA:
  - Use `docs/backlog/INT4_MVP4_ACCEPTANCE.md` as the executable checklist.
  - Runtime `PARTIAL` is acceptable if missing slices are separated from implemented slices and no P0 boundary is violated.

## 총괄에게 요청하는 결정
- Accept Wave20 PM scope guard as PASS.
- Allow Backend and Frontend agents to proceed in parallel with the Wave20 thin implementation slice.
- Keep Wave20 P1 exclusions unchanged unless a later explicit PM order reopens scope.

## 현재 판정
- PASS
