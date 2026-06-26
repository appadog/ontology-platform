# PM / Architecture Report - Wave 34

## 담당 범위

- backlog ID:
  - `PM6-018` Wave34 MVP6.3 implementation scope guard + persist-vs-compute freeze
- 작업 경로:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-034/PM_REPORT.md`

## 완료한 작업

- 필수 시작 문서(`AGENTS.md`, `handoff-reporting/SKILL.md`,
  `CURRENT_STATE.md`, `wave-034/NEXT_ORDERS.md`)와 Wave33 planning artifacts
  (PM brief, ADR 0009, API contract draft, `openapi-mvp6-3-draft.json`,
  `INT6_3` acceptance C12, 4개 wave-033 reports)를 읽고 Wave34 구현 범위를 PM
  관점에서 재확인했다.
- 제품 범위 확장 없음을 확인했다. Wave34는 Wave33에서 freeze된 P0 demo flow와
  4개 endpoint families의 thin implementation만 허용한다. benchmark P1+ scope
  (gold-set authoring/versioning write, real provider 실행, significance/trend/
  alerts, training export, cross-project 비교, governance/agents/connectors/
  tenants/packs/advanced viz)는 열지 않는다.
- **persist-vs-compute 결정(acceptance gate C12)을 FREEZE했다: option (a)
  deterministic process-local comparison record를 `comparison_id`로 keying하여
  persist한다.**
- MVP6.1 process-local store 패턴을 근거로 삼았다. `apps/backend/app/modules/
  evaluation/service.py`는 module-level dict (`_runs: dict[str, EvaluationRun]`
  등) + `reset_runtime_store()` 패턴을 쓰고, MVP6.2 learning 모듈도 동일하다.
  `_comparisons: dict[str, BenchmarkComparison]`는 같은 검증된 패턴이며 list +
  GET-by-id round-trip(R3)을 recomputation-determinism 위험 없이 만족한다.
- Wave34 acceptance gates를 재명시했다: all-false `BenchmarkMutationGuard`;
  MVP6.1 field/enum rename 금지; comparability flag 3-level 정직 노출;
  `NOT_APPLICABLE`/`__NONE__` semantics 유지; `>=2` terminal-success eligibility
  + `excluded_runs[]`/`RunExclusionReason`.
- `docs/backlog/MVP6_DRAFT_BACKLOG.md`에 Wave34 implementation backlog IDs를
  기록했다 (NEXT_ORDERS가 참조했으나 backlog에 없었음): PM6-018, BE6-024~027,
  FE6-023~026, INT6-022~025. 그리고 "Wave34 MVP6.3 Implementation Scope Guard
  + Persist-vs-Compute Freeze" 요약 섹션을 추가했다.
- Runtime code(`apps/`)는 변경하지 않았다.

## 변경 파일

- 수정:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
- 생성:
  - `docs/handoffs/wave-034/PM_REPORT.md`
- Runtime code 변경:
  - 없음.

## 실행/검증

- 실행한 명령:
  - `git diff --check`
- 결과:
  - `PASS`: `git diff --check` 출력 없음 (whitespace 오류 없음).
- 실행하지 못한 검증:
  - Backend pytest/ruff, OpenAPI runtime compare, Frontend test/build/smoke는
    수행하지 않았다. PM scope-guard 문서 작업이며 runtime code를 구현하지
    않았기 때문이다.

## API/Enum/DTO 변경

- 변경 여부: 없음.
- 상세:
  - Runtime API, OpenAPI artifact, DB schema, frontend type/client/mock은
    변경하지 않았다. PM backlog에서 Wave33 frozen endpoint/enum/DTO와
    persist-vs-compute 결정을 implementation acceptance 조건으로 명시했다.
- 영향받는 역할:
  - Backend: persist option (a)를 구현하고 R3 round-trip을 deterministic하게
    만든다.
  - Frontend/QA: contract는 그대로이며 frozen OpenAPI에 맞춘다.

## Blocker

- 없음.
- 주의: 작업 시작 시 다수의 untracked/modified 문서가 있었다. PM은 지정된
  backlog/report 문서만 편집했고 다른 역할 변경이나 runtime code를 건드리지
  않았다.

## 남은 TODO

- Backend: 이 보고서를 시작 조건으로 읽고 `BE6-024`~`BE6-027` 범위 안에서만
  4개 endpoint families를 구현한다. comparison record를 `comparison_id`로
  persist (process-local dict)하고, all-false `BenchmarkMutationGuard`를 노출,
  MVP6.1 shape를 `$ref`로 재사용한다.
- Frontend: `FE6-023`~`FE6-026` 범위 안에서 project-scoped UI를 구현하고
  frozen OpenAPI에 맞춘다.
- QA: `INT6-022`~`INT6-025`에서 R1-R10, no-mutation guard, MVP1-MVP6.2
  regression을 검증한다.

## 다른 역할에 전달할 내용

- PM: 제품 범위 확장은 승인하지 않았다. frozen P0 flow + 4 endpoint families
  밖의 요구는 Wave34에서 구현하지 말고 별도 PM freeze로 돌려라.
- Backend: **persist-vs-compute = (a) persist a deterministic process-local
  comparison record keyed by `comparison_id`** (MVP6.1 `_runs` dict 패턴과
  동일, R3 list+GET-by-id round-trip 충족). persist된 객체도 read-only analysis
  artifact이며 all-false guard를 carry해야 한다. `>=2` terminal-success
  eligibility, `RunExclusionReason`로 ineligible run을 surface하라.
- Frontend: `NOT_APPLICABLE`를 fake 0/100%로 렌더하지 말고, `__NONE__`은 labeled
  sentinel로 표시하라. accepted/winning model 같은 자동 선택/publish 암시 copy
  금지. missing run은 `excluded_runs`로 degrade, full crash 금지.
- QA: all-false `BenchmarkMutationGuard`와 no MVP6.1 rename, comparability flag
  honesty, R3 round-trip이 Wave34 acceptance gate다.

## 총괄에게 요청하는 결정

- Wave34 PM implementation scope guard와 persist-vs-compute freeze (option a)를
  `PASS`로 승인하고 Backend/Frontend가 해당 guard 안에서 thin implementation을
  진행하도록 해 달라.

## 현재 판정

- PASS
