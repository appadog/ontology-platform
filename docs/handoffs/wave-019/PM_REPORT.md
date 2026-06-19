# PM / Architecture Report - Wave 19

## 담당 범위
- backlog ID: `PM4-001`~`PM4-008`
- 작업 경로:
  - `docs/pm/MVP4_PREP_BRIEF.md`
  - `docs/backlog/MVP4_DRAFT_BACKLOG.md`
  - `docs/adr/0007-mvp4-search-rag-read-only-boundary.md`
  - `docs/handoffs/wave-019/PM_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-019/NEXT_ORDERS.md`
  - `docs/pm/MVP4_PREP_BRIEF.md`
  - `docs/backlog/MVP4_DRAFT_BACKLOG.md`
  - `docs/pm/MVP3_CLOSEOUT_CHECKLIST.md`
  - `docs/handoffs/wave-018/QA_REPORT.md`
  - `00_PROJECT_ROADMAP_MVP_1_TO_5.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- MVP4 P0/P1 결정을 Wave19 contract-first 입력으로 freeze했다.
- `PM4-001` advanced quality metric framework:
  - P0는 explainable metric groups only로 결정했다.
  - weighted composite quality score, default weights, cross-metric rollup은 P1로 분리했다.
  - P0 formula metadata 필수 필드를 `numerator`, `denominator`, `scope`, `time_window`, `breakdown_dimension`, `drilldown_target`로 고정했다.
- `PM4-002` evaluation dataset/golden set:
  - `EvaluationDatasetStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`; 기본값 `DRAFT`.
  - `GoldenSetItemKind`: `ENTITY`, `RELATION`, `PROPERTY_VALUE`, `EVIDENCE_LINK`.
  - golden item provenance는 source/evidence/reviewer decision 추적을 유지한다.
- `PM4-003`~`PM4-004` prompt/model evaluation and experiment:
  - 최소 evaluation dimensions를 prompt version, model run, source type, class type, relation type, validation outcome, review decision, correction pattern으로 고정했다.
  - `PromptExperimentStatus`: `DRAFT`, `RUNNING`, `COMPLETED`, `CANCELLED`.
  - 자동 traffic splitting/scheduling은 P1로 유지했다.
- `PM4-005` search/RAG:
  - keyword P0 scope를 published graph facts, source records/chunks, evidence chunks, review/audit lineage context로 고정했다.
  - vector/similar evidence는 P0 adapter/fallback contract로 두고 production vector DB hardening은 P1로 분리했다.
  - RAG facts/citations는 published graph facts + evidence/source chunks only로 고정하고 candidate graph facts를 제외했다.
- `PM4-006` graph explorer/dashboard:
  - P0 graph explorer는 n-hop, class/relation filters, quality overlay, source/evidence overlay, lineage panel, current/selected published version context를 포함한다.
  - local demo guard는 default `max_hops=2`, max `max_hops=3`, response budget `150` nodes / `300` edges, safe-too-large state로 고정했다.
- `PM4-007` collaboration/SLA:
  - comments, assignment, due date, SLA states, notifications는 P1로 유지했다.
  - Wave19에서 tiny P0 slice를 promote하지 않았다.
- `PM4-008` external API:
  - graph/source/evidence/search/RAG read-only external API boundary는 P0로 유지했다.
  - MVP4 auth는 dev auth only로 고정하고 API keys/service accounts/production security는 MVP5로 유지했다.
- Search/RAG read-only boundary는 durable architecture boundary로 판단하여 ADR 0007을 추가했다.

## 변경 파일
- `docs/pm/MVP4_PREP_BRIEF.md`
  - Wave19 PM decision freeze 표 추가.
  - quality, evaluation dataset/golden set, prompt experiment, search/vector/RAG, graph explorer, collaboration/SLA, external API auth 범위를 명확히 수정.
- `docs/backlog/MVP4_DRAFT_BACKLOG.md`
  - status를 Wave19 PM freeze 입력으로 변경.
  - PM freeze summary 추가.
  - `PM4-*`, `BE4-*`, `FE4-*`, `INT4-*` acceptance draft를 frozen decision과 맞게 갱신.
  - `INT4-008` external API smoke를 P0로 정렬했다.
- `docs/adr/0007-mvp4-search-rag-read-only-boundary.md`
  - MVP4 search/RAG read-only boundary, candidate graph exclusion, vector adapter/fallback, external API dev-auth boundary를 기록.
- `docs/handoffs/wave-019/PM_REPORT.md`
  - 본 보고서 작성.
- 앱 runtime/backend/frontend 코드는 수정하지 않았다.

## 실행/검증
- 실행한 명령:
  - `git diff --check -- docs/pm/MVP4_PREP_BRIEF.md docs/backlog/MVP4_DRAFT_BACKLOG.md docs/adr/0007-mvp4-search-rag-read-only-boundary.md docs/handoffs/wave-019/PM_REPORT.md`
  - `git diff --check --no-index /dev/null docs/pm/MVP4_PREP_BRIEF.md`
  - `git diff --check --no-index /dev/null docs/backlog/MVP4_DRAFT_BACKLOG.md`
  - `git diff --check --no-index /dev/null docs/adr/0007-mvp4-search-rag-read-only-boundary.md`
  - `git diff --check --no-index /dev/null docs/handoffs/wave-019/PM_REPORT.md`
- 결과:
  - `git diff --check -- ...` PASS with exit code `0` and no whitespace error output.
  - `--no-index /dev/null ...` checks returned expected diff exit code `1` for new/untracked files, with no whitespace error output.
- 실행하지 못한 검증:
  - PM/Architecture planning 문서 작업이므로 backend/frontend test/build/runtime smoke는 실행하지 않았다.
  - Backend OpenAPI draft parse와 Frontend field/state review 검증은 후속 Wave19 Backend/Frontend/QA 순서에서 수행해야 한다.

## API/Enum/DTO 변경
- 변경 여부: 있음, planning contract freeze.
- 상세:
  - Backend가 신규 enum으로 반영해야 하는 값:
    - `EvaluationDatasetStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`.
    - `GoldenSetItemKind`: `ENTITY`, `RELATION`, `PROPERTY_VALUE`, `EVIDENCE_LINK`.
    - `PromptExperimentStatus`: `DRAFT`, `RUNNING`, `COMPLETED`, `CANCELLED`.
  - Backend DTO가 포함해야 하는 P0 metric formula metadata:
    - `numerator`
    - `denominator`
    - `scope`
    - `time_window`
    - `breakdown_dimension`
    - `drilldown_target`
  - Prompt/model evaluation DTO/filter dimensions:
    - prompt version
    - model run
    - source type
    - class type
    - relation type
    - validation outcome
    - review decision
    - correction pattern
  - Search/RAG DTO boundary:
    - keyword search result groups cover published graph/source/evidence/lineage context.
    - vector adapter DTO exposes embedding target, adapter status, similar-evidence result shape, and fallback state.
    - RAG answer response must cite evidence/source chunks and linked published graph facts, and must support insufficient-evidence state.
  - Graph explorer DTO boundary:
    - current/selected published graph version context.
    - max hop/depth controls.
    - safe-too-large state.
  - External API boundary:
    - read-only graph/source/evidence/search/RAG APIs under dev auth only.
- 영향받는 역할:
  - Backend: use this report and updated docs to draft `docs/api/MVP4_API_CONTRACT_DRAFT.md` and `docs/api/openapi-mvp4-draft.json`.
  - Frontend: review Backend draft for metric explainers, filters, version context, search/RAG states, safe-too-large state, and external API docs surface.
  - QA: convert these decisions into deterministic `INT4-*` checklist and seed assertions.

## Blocker
- PM freeze blocker: 없음.
- MVP4 broad implementation blocker:
  - Backend MVP4 endpoint/DTO/OpenAPI draft is not complete yet by wave sequence.
  - Frontend field/state/IA review is not complete yet by wave sequence.
  - QA executable `INT4-*` checklist is not complete yet by wave sequence.

## 남은 TODO
- Backend:
  - Draft endpoint families, DTOs, enums, migration implications, seed needs, and OpenAPI artifact against this freeze.
  - Preserve MVP3 actual contracts and document any intentional extension.
- Frontend:
  - Review field/state/IA needs after Backend draft, especially formula explainers, dataset/golden provenance, graph safe-too-large, RAG insufficient evidence, and vector fallback states.
- QA:
  - Create executable `INT4-*` acceptance checklist after Backend and Frontend artifacts exist.
  - Include metric recomputation, RAG grounding, candidate exclusion, graph explorer safe-too-large, external dev-auth API, and MVP3 regression guards.

## 다른 역할에 전달할 내용
- PM:
  - PM4 decisions are frozen for Wave19 contract-first planning.
  - Collaboration/SLA stays P1; no P0 slice was promoted.
- Backend:
  - Do not add weighted composite quality score as a P0 requirement.
  - Treat vector/similar evidence as P0 adapter/fallback contract and production hardening as P1.
  - RAG must exclude candidate graph facts from answer generation and citations.
  - External API auth is dev auth only for MVP4.
- Frontend:
  - Build IA review around explainable metric groups, not a single quality score.
  - Show version context and safe-too-large graph states as first-class UX requirements.
  - Search/RAG UI must preserve evidence/source context and insufficient-evidence states.
- QA:
  - `INT4-008` external API smoke is now P0 because read-only external API boundary is MVP4 P0.
  - Candidate graph exclusion from RAG answers should be an explicit acceptance assertion.

## 총괄에게 요청하는 결정
- Accept Wave19 PM freeze as PASS and allow Backend to start MVP4 contract drafting.
- Accept ADR 0007 as the durable MVP4 search/RAG read-only boundary.

## 현재 판정
- PASS
