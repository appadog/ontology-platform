# PM / Architecture Report - Wave 29

## 담당 범위

- backlog ID:
  - `PM6-008` Wave29 hardening freeze
  - `PM6-009` Durable persistence decision
- 작업 경로:
  - `docs/handoffs/wave-029/PM_REPORT.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/backlog/INT6_MVP6_ACCEPTANCE.md`
  - `docs/pm/MVP6_PREP_BRIEF.md`

## 완료한 작업

- Wave29를 MVP6.1 targeted hardening으로 freeze했다. MVP6.2 또는 이후 테마
  확장이 아니다.
- `smoke:mvp6:actual`의 `PASS` / `PARTIAL` / `FAIL` 판정 기준을
  `docs/backlog/INT6_MVP6_ACCEPTANCE.md`에 추가했다.
- process-local evaluation runtime store는 MVP6.1 closeout에 허용한다고
  결정했다. 조건은 actual smoke가 같은 backend runtime에서 필요한 데이터를
  직접 생성하거나 seed해서 반복 재현 가능해야 한다는 것이다.
- Durable DB model과 Alembic migration은 Wave29에서 승격하지 않고 P1/P2로
  유지했다.
- 실제 API smoke가 process-local store만으로 반복 재현 불가능할 때에만
  Backend가 최소 dev-only reset/seed helper를 추가할 수 있다고 허용했다.
- Frontend `EvaluationErrorCase.candidate_ref`는 기존 generic `CandidateRef`가
  아니라 Backend `EvaluationCandidateRef`와 맞는 MVP6 전용 nested type이어야
  한다고 확정했다.
- Product Showcase styled-components guide는 후속 MVP6 frontend
  productization/hardening 입력으로 권장했다. 다만 Wave29에서는 디자인 전면
  개편을 열지 않는다.
- MVP6.2 Active Learning, governance, impact, copilot/agent,
  connector/plugin, multi-tenant, ontology pack, advanced visualization,
  real LLM benchmark는 Wave29 제외로 명시했다.

## 변경 파일

- 생성:
  - `docs/handoffs/wave-029/PM_REPORT.md`
- 수정:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/backlog/INT6_MVP6_ACCEPTANCE.md`
  - `docs/pm/MVP6_PREP_BRIEF.md`

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
  - runtime API, OpenAPI artifact, enum literal 자체는 변경하지 않았다.
  - `smoke:mvp6:actual` acceptance를 추가했다. 실제 API mode는 다음 흐름을
    반복 재현 가능하게 검증해야 한다:
    `create dataset -> add sample -> add gold entity -> add gold relation -> run DETERMINISTIC_MOCK -> read run detail -> read metrics -> read errors`.
  - `EvaluationErrorCase.candidate_ref` Frontend type은 Backend
    `EvaluationCandidateRef`와 맞아야 한다.
  - Frontend required fields:
    - `candidate_id`
    - `candidate_kind`: `ENTITY` 또는 `RELATION`
    - `sample_id`
    - `ontology_class_id`
    - `ontology_relation_id`
    - `label`
    - `normalized_value`
    - `source_gold_entity_id`
    - `target_gold_entity_id`
    - `evidence: GoldEvidenceRef | null`
- 영향받는 역할:
  - Backend: durable persistence를 구현하지 말고, actual smoke 재현성에 필요한
    최소 지원만 제공한다.
  - Frontend: `candidate_ref` type/display를 Backend OpenAPI에 맞추고
    `smoke:mvp6:actual`을 추가한다.
  - QA: `INT6-006`~`INT6-008` 기준으로 actual smoke, DTO consistency,
    closeout recommendation을 검증한다.

## Blocker

- 없음.
- 현재 작업트리에는 다른 wave/역할의 modified/untracked 파일이 다수 존재한다.
  PM은 지정된 문서 범위만 편집했고 기존 변경은 되돌리지 않았다.

## 남은 TODO

- Backend:
  - `docs/handoffs/wave-029/PM_REPORT.md`를 읽고 `BE6-010`, `BE6-011`만
    수행한다.
  - process-local store를 유지한다.
  - 필요한 경우 actual smoke 반복 재현을 위한 최소 dev-only reset/seed helper만
    추가한다.
- Frontend:
  - `EvaluationCandidateRef` type을 추가하거나 동등하게 분리하고
    `EvaluationErrorCase.candidate_ref`에 적용한다.
  - entity/relation candidate context와 nullable evidence fallback을 표시한다.
  - `npm run smoke:mvp6:actual` 또는 동등 명령을 추가하고 기존
    `smoke:mvp6:mock`을 유지한다.
- QA:
  - `INT6-006`~`INT6-008`를 기준으로 Wave29 closeout, targeted Wave30,
    또는 stop for PM redesign 중 하나를 권고한다.

## 다른 역할에 전달할 내용

- PM:
  - MVP6.1 closeout 전까지 Wave29는 hardening-only다.
  - MVP6.2+는 별도 contract-first PM freeze 전까지 열지 않는다.
- Backend:
  - durable DB/Alembic은 이번 wave에서 구현하지 않는다.
  - `smoke:mvp6:actual` 재현이 불가능한 경우에만 reset/seed helper를 최소로
    허용한다.
  - evaluation operation은 candidate review, publish, published graph를
    mutate하면 안 된다.
- Frontend:
  - actual smoke PASS는 mock fixture rendering이 아니라 실제 backend API flow를
    route에서 검증하는 것이다.
  - `candidate_ref`는 entity/relation별 sample, ontology id, label/value,
    endpoint ids, evidence context를 표시할 수 있어야 한다.
  - Product Showcase 스타일은 후속 MVP6 frontend hardening 참고용이며 Wave29
    전면 redesign 범위가 아니다.
- QA:
  - `PASS` / `PARTIAL` / `FAIL` 기준은
    `docs/backlog/INT6_MVP6_ACCEPTANCE.md`의 Wave29 addendum을 따른다.

## 총괄에게 요청하는 결정

- Wave29를 MVP6.1 targeted hardening으로 유지해 달라.
- durable DB/Alembic persistence는 MVP6.1 closeout blocker가 아니며 P1/P2로
  유지해 달라.
- MVP6.2 이상 테마는 Wave29 QA closeout 후 별도 contract-first wave에서 다시
  열어 달라.
- Product Showcase guide는 후속 frontend productization wave에서
  `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md` 같은 repo-owned 문서로 편입하는
  것을 권장한다.

## 현재 판정

- PASS
