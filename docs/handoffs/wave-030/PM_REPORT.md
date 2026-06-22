# PM / Architecture Report - Wave 30

## 담당 범위

- backlog ID:
  - `PM6-010` MVP6.2 P0 scope freeze
  - `PM6-011` Learning signal taxonomy
  - `PM6-012` Prompt suggestion and decision policy
  - `PM6-013` Auto-approval candidate safety boundary
- 작업 경로:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md`
  - `docs/handoffs/wave-030/PM_REPORT.md`

## 완료한 작업

- Wave30을 MVP6.2 Active Learning / Continuous Improvement contract-first
  planning으로 freeze했다. Runtime API, DB migration, frontend route/component,
  seed/batch implementation은 열지 않았다.
- MVP6.2 P0 demo flow를 다음 흐름으로 확정했다:
  `select project -> view learning signal summary -> inspect correction pattern -> inspect prompt suggestion -> accept/dismiss suggestion -> see decision audit note`.
- P0가 분석할 수 있는 source artifacts를 기존 닫힌 surface로 제한했다:
  - MVP3 review/correction history와 review decision audit trail;
  - MVP4 quality metrics와 validation/quality drilldown evidence;
  - MVP6.1 evaluation errors/metrics/run context와 candidate-vs-gold artifacts.
- Learning signal taxonomy를 P0 enum 후보로 확정했다:
  - `RELATION_DIRECTION_CORRECTION`
  - `CLASS_CONFUSION`
  - `RELATION_TYPE_CONFUSION`
  - `EVIDENCE_MISSING`
  - `EVIDENCE_MISMATCH`
  - `REPEATED_VALIDATION_FAILURE`
  - `LOW_BENCHMARK_METRIC_CLUSTER`
- Prompt suggestion states와 decision policy를 확정했다:
  - states: `SUGGESTED`, `ACCEPTED`, `DISMISSED`, `SUPERSEDED`;
  - accept/dismiss는 human decision audit record만 생성한다;
  - prompt version, extraction job, candidate graph, published graph,
    auto-approval policy를 mutate하지 않는다.
- Auto-approval candidate는 recommendation/preview only로 freeze했다. P0는
  candidate rule preview, supporting metrics, historical match preview, safety
  note를 보여줄 수 있지만 policy 생성/수정/활성화/집행 또는 후보 자동 승인,
  게시 그래프 변경을 할 수 없다.
- Fine-tuning execution, live retraining, training dataset export execution,
  real provider prompt rewriting, autonomous publish, automatic policy
  enforcement, ontology governance, impact simulation, copilot/agent runtime,
  connector/plugin SDK, multi-tenant runtime, ontology packs, advanced
  visualization/storytelling을 P0 제외로 명시했다.
- Backend/Frontend/QA가 이어받을 Wave30 backlog IDs를
  `docs/backlog/MVP6_DRAFT_BACKLOG.md`에 문서 계약 수준으로 추가했다.

## 변경 파일

- 생성:
  - `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md`
  - `docs/handoffs/wave-030/PM_REPORT.md`
- 수정:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`

## 실행/검증

- 실행한 명령:
  - `git diff --check`
- 결과:
  - `PASS`: 출력 없음, whitespace/error 없음.
- 실행하지 못한 검증:
  - PM/Architecture 문서 범위라 backend/frontend runtime test는 수행하지 않는다.

## API/Enum/DTO 변경

- 변경 여부: 있음, 문서 계약 변경
- 상세:
  - Runtime API, OpenAPI artifact, DB migration, frontend route/component는
    변경하지 않았다.
  - P0 learning signal taxonomy enum 후보를 문서상 확정했다.
  - Prompt suggestion state 후보를 문서상 확정했다:
    `SUGGESTED`, `ACCEPTED`, `DISMISSED`, `SUPERSEDED`.
  - Decision audit note 필수 맥락을 문서상 확정했다:
    actor id/role, decision, reason code, note, timestamp, suggestion snapshot,
    source signal ids, target prompt/version context.
  - Backend는 후속 계약 초안에서 read-mostly endpoint와 audit-only decision
    endpoint를 설계해야 하며, 해당 decision endpoint는 prompt/candidate/policy
    /published graph mutation을 수행하면 안 된다.
- 영향받는 역할:
  - Backend:
    - `docs/handoffs/wave-030/PM_REPORT.md`와
      `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md`를 읽고 `BE6-012`~`BE6-015`
      planning-only contract draft를 작성한다.
  - Frontend:
    - `FE6-011`~`FE6-014`는 Learning Insights IA, correction pattern,
      prompt suggestion board, auto-approval preview states만 요구사항으로
      작성한다. Runtime route/component 구현은 Wave30 범위가 아니다.
  - QA:
    - `INT6-011`~`INT6-014` checklist에서 taxonomy, source artifacts,
      decision audit, auto-approval preview safety, no-mutation guard를 검증한다.

## Blocker

- 없음.
- 주의:
  - 현재 작업트리에는 이전 wave와 다른 역할의 modified/untracked 파일이 다수
    있다. PM은 지정된 PM/backlog/handoff 문서만 편집했고 기존 변경을
    되돌리거나 덮어쓰지 않았다.

## 남은 TODO

- Backend:
  - PM freeze를 기준으로 `docs/api/MVP6_2_API_CONTRACT_DRAFT.md`와 optional
    `docs/api/openapi-mvp6-2-draft.json` planning artifact를 작성한다.
  - Contract는 read-mostly여야 하고 accept/dismiss는 decision audit만
    기록해야 한다.
- Frontend:
  - Learning Insights IA와 field/state/error/permission-limited requirements를
    작성한다.
  - Auto-approval candidate는 preview-only임을 UI copy/state에서 명확히 한다.
- QA:
  - `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`를 생성하고 Wave30
    planning artifacts 간 정합성을 검증한다.

## 다른 역할에 전달할 내용

- PM:
  - MVP6.2 P0는 improvement recommendation loop까지다. 실제 prompt draft
    editor, training export, fine-tuning, governance, automatic enforcement는
    별도 freeze 전까지 열지 않는다.
- Backend:
  - P0 source artifact refs는 필수다. Traceable source artifact 없는 learning
    signal은 prompt suggestion을 만들 수 없다.
  - Suggestion decision endpoint가 생기더라도 prompt version, extraction job,
    candidate review, auto-approval policy, published graph를 mutate하면 안 된다.
- Frontend:
  - Learning Insights는 project-scoped workflow area로 설계하고 ID-bound detail
    page를 global LNB에 평면 노출하지 않는다.
  - Accept/dismiss 뒤에는 decision audit note를 보여준다. "Accepted"는 적용됨이
    아니라 future prompt drafting intent임을 드러내야 한다.
- QA:
  - Scope leakage 검색에서 fine-tuning execution, live retraining, governance,
    impact simulation, copilot/agent runtime, connector/plugin, multi-tenant,
    auto-enforcement, autonomous publish가 runtime/UI implementation으로 들어오지
    않았는지 확인한다.

## 총괄에게 요청하는 결정

- Wave30 PM freeze를 PASS로 승인하고 Backend/Frontend/QA가 contract-first
  planning을 이어가도록 허용해 달라.
- MVP6.2 P0를 recommendation/audit loop로 유지하고 auto-approval enforcement나
  prompt mutation은 후속 wave로 분리해 달라.

## 현재 판정

- PASS
