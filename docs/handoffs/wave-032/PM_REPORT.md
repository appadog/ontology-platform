# PM / Architecture Report - Wave 32

## 담당 범위

- backlog ID:
  - `PM6-016` Wave32 implementation scope guard
- 작업 경로:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-032/PM_REPORT.md`

## 완료한 작업

- 필수 시작 문서와 Wave31 PM/Backend/Frontend/QA reports, MVP6.2 planning
  docs를 읽고 Wave32 구현 범위를 PM 관점에서 재확인했다.
- `docs/backlog/MVP6_DRAFT_BACKLOG.md`에 Wave32 MVP6.2 implementation scope
  guard를 추가했다.
- deterministic local/process-local/mock-derived data가 첫 thin slice에
  허용됨을 명시했다. 단, project-scoped, source-artifact-shaped,
  reproducible test/smoke data여야 하며 real provider execution과 분리되어야
  한다.
- Backend runtime acceptance 조건을 frozen endpoint families 기준으로
  고정했다:
  - `GET /api/v1/projects/{project_id}/learning-signals/summary`
  - `GET /api/v1/projects/{project_id}/learning-signals/correction-patterns`
  - `GET /api/v1/projects/{project_id}/learning-signals/prompt-suggestions`
  - `GET /api/v1/projects/{project_id}/learning-signals/auto-approval-candidates`
  - `POST /api/v1/learning-signal-suggestions/{suggestion_id}/decisions`
- Frontend UI acceptance 조건을 project-scoped Learning Insights workflow로
  고정했다: summary, correction pattern, prompt suggestion, auto-approval
  preview, decision audit note가 렌더링되어야 하며 mock mode와 backend
  runtime available actual mode에서 검증한다.
- decision transition guard를 명시했다:
  - `ACCEPT`는 `SUGGESTED`만 `ACCEPTED`로 전환한다.
  - `DISMISS`는 `SUGGESTED`만 `DISMISSED`로 전환하고 frozen reason code
    rules를 따른다.
  - `SUPERSEDED`는 read-side only다.
  - `ACCEPTED`, `DISMISSED`, `SUPERSEDED`에 대한 command는 non-`SUGGESTED`
    conflict로 visible/tested 상태여야 한다.
- mutation guard는 모든 decision response에서 아래가 false임을 요구했다:
  - `prompt_version_mutated`
  - `candidate_graph_mutated`
  - `published_graph_mutated`
  - `auto_approval_policy_mutated`
  - `extraction_job_started`
  - `evaluation_run_started`
- Wave32 out-of-scope를 재고정했다: real LLM call, fine-tuning, live
  retraining, training export execution, prompt rewriting/version mutation,
  candidate/review mutation, published graph mutation, policy enforcement,
  governance, impact simulation, agent/copilot runtime, connector/plugin SDK,
  tenant runtime, ontology packs, advanced visualization/storytelling은 열지
  않는다.
- Wave32 implementation backlog IDs를 문서화해 Backend/Frontend/QA가 같은
  guard를 보고 작업하도록 정리했다:
  - Backend: `BE6-019`~`BE6-022`
  - Frontend: `FE6-018`~`FE6-021`
  - QA: `INT6-017`~`INT6-020`
- Runtime API, DB migration, frontend route/component, seed, smoke/test
  implementation은 만들지 않았다.

## 변경 파일

- 수정:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
- 생성:
  - `docs/handoffs/wave-032/PM_REPORT.md`
- Runtime code 변경:
  - 없음.

## 실행/검증

- 실행한 명령:
  - `git diff --check`
  - `git diff --check --no-index /dev/null docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `git diff --check --no-index /dev/null docs/handoffs/wave-032/PM_REPORT.md`
- 결과:
  - `PASS`: `git diff --check` 출력 없음.
  - `PASS`: no-index whitespace checks 출력 없음. Direct no-index commands는
    파일이 `/dev/null`과 다르기 때문에 exit code `1`을 반환하지만,
    whitespace diagnostic이 없으므로 통과로 판단했다.
- 실행하지 못한 검증:
  - Backend pytest/ruff, OpenAPI runtime export compare, Frontend test/build/
    smoke는 수행하지 않았다. PM/Architecture scope guard 문서 작업이며
    runtime code를 구현하지 않았기 때문이다.

## API/Enum/DTO 변경

- 변경 여부: 없음.
- 상세:
  - Runtime API, OpenAPI artifact, DB schema, migration, frontend TypeScript
    type/client/mock은 변경하지 않았다.
  - PM backlog에서 Wave31 frozen endpoint, enum, DTO field names, mutation
    guard requirements를 implementation acceptance 조건으로 재명시했다.
- 영향받는 역할:
  - Backend: `BE6-019`~`BE6-022` 구현 시 frozen endpoint families,
    decision transition, conflict, all-false mutation guard를 지켜야 한다.
  - Frontend: `FE6-018`~`FE6-021` 구현 시 Learning Insights flow와
    mock/actual smoke에서 audit-only boundary를 visible하게 유지해야 한다.
  - QA: `INT6-017`~`INT6-020`에서 endpoint/UI/conflict/mutation guard를
    runtime evidence로 검증해야 한다.

## Blocker

- 없음.
- 주의:
  - 작업 시작 시 기존 modified/untracked 파일이 다수 있었다. PM은 지정된
    backlog/report 문서만 편집했고 runtime code나 다른 역할 변경을 되돌리거나
    덮어쓰지 않았다.

## 남은 TODO

- Backend:
  - `docs/handoffs/wave-032/PM_REPORT.md`를 시작 조건으로 읽은 뒤
    `BE6-019`~`BE6-022` 범위 안에서만 thin runtime을 구현한다.
- Frontend:
  - Backend report 또는 구현 notes와 맞춰 `FE6-018`~`FE6-021` 범위 안에서만
    Learning Insights UI를 구현한다.
- QA:
  - Wave32 Backend/Frontend reports 이후 `INT6-017`~`INT6-020` runtime
    acceptance를 검증한다.

## 다른 역할에 전달할 내용

- PM:
  - 추가 product scope 확장은 승인하지 않았다. Wave32는 frozen P0 loop의
    deterministic thin implementation만 허용한다.
- Backend:
  - deterministic local data는 허용되지만 real LLM/fine-tuning/retraining
    또는 prompt/candidate/published graph/policy/extraction/evaluation
    mutation으로 이어지면 scope violation이다.
  - `POST /decisions`는 audit note와 suggestion state transition만 허용한다.
- Frontend:
  - accepted suggestion을 applied/deployed prompt change처럼 표시하지 않는다.
  - auto-approval preview는 recommendation only, not enforced, requires later
    policy approval semantics를 계속 보여야 한다.
- QA:
  - non-`SUGGESTED` conflict와 mutation guard all false는 Wave32 acceptance
    gate다.

## 총괄에게 요청하는 결정

- Wave32 PM implementation scope guard를 `PASS`로 승인하고 Backend/Frontend
  가 해당 guard 안에서 thin implementation을 진행하도록 해 달라.
- Backend 또는 Frontend가 frozen P0 loop 밖의 scope를 요구하면 Wave32 내에서
  구현하지 말고 별도 PM freeze로 돌려 달라.

## 현재 판정

- PASS
