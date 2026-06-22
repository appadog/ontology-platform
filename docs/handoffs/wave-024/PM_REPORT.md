# PM / Wave24 Scope Guard Report - Wave 24

## 담당 범위
- backlog ID:
  - `PM5-001`
  - `PM5-002`
  - `PM5-003`
  - `PM5-004`
  - `PM5-005`
  - `PM5-006`
  - `PM5-007`
  - `PM5-008`
  - `PM5-009`
  - `PM5-010`
  - `INT5-001`
  - `INT5-002`
  - `INT5-003`
  - `INT5-004`
  - `INT5-005`
  - `INT5-006`
  - `INT5-007`
  - `INT5-008`
  - `INT5-009`
  - `INT5-010`
- 작업 경로:
  - `docs/handoffs/wave-024/PM_REPORT.md`
- 확인한 source 문서:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-024/NEXT_ORDERS.md`
  - `docs/handoffs/wave-023/PM_REPORT.md`
  - `docs/handoffs/wave-023/BACKEND_REPORT.md`
  - `docs/handoffs/wave-023/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-023/QA_REPORT.md`
  - `docs/pm/MVP5_PREP_BRIEF.md`
  - `docs/backlog/MVP5_DRAFT_BACKLOG.md`
  - `docs/backlog/INT5_MVP5_ACCEPTANCE.md`
  - `docs/adr/0008-mvp5-enterprise-governance-boundary.md`

## 완료한 작업
- Wave24를 새 PM 범위 결정 wave가 아니라 MVP5 첫 thin implementation
  scope guard로 확인했다.
- Wave23 PM/Backend/Frontend/QA 산출물이 모두 같은 P0/P1 경계를 공유함을
  확인했다.
  - P0는 admin/operator governance control plane이다.
  - 검색/RAG 반복 데모, production enterprise hardening, external write
    expansion은 Wave24 대상이 아니다.
- Wave24 첫 thin slice 허용 범위를 아래로 제한한다.
  - organization/project admin summary.
  - role assignments and permission check allow/deny/read-only.
  - service account/API key create with one-time `raw_secret` field contract,
    masked list/detail, revoke.
  - automatic approval policy dry-run and enforce-preview gates.
  - operations/DLQ/cost/observability summary.
  - retention deletion dry-run and backup restore dry-run.
  - audit/security event summaries.
  - JSON import/export는 optional. Backend/Frontend 구현량이 커지면 Wave25로
    미룰 수 있으며, Wave24 PASS의 필수 조건으로 강제하지 않는다.
- `INT5-001`~`INT5-010` acceptance guard를 재확인했다.
  - Gate 0 no-secret cleanup.
  - Backend deterministic seed and selected thin runtime.
  - Frontend mock-first admin route smoke.
  - Actual API smoke where backend runtime is available.
  - MVP1-MVP4 regression guard.
- P1 exclusions를 재확인했다.
  - production SSO/OIDC.
  - vault/KMS or production secret rotation.
  - full ABAC expression language.
  - full RDF/Turtle/OWL/SHACL fidelity.
  - full SPARQL/Cypher console.
  - distributed observability/HA/DR.
  - external write APIs.
  - ungated autonomous publish.
- Gate 0 raw-secret-looking example cleanup이 mandatory임을 확인했다.
  - `docs/api/MVP5_API_CONTRACT_DRAFT.md`와
    `docs/api/openapi-mvp5-draft.json`의 raw-secret-looking examples는
    seed/runtime/mock/report/screenshot 산출물 생성 전에 non-secret
    placeholder로 교체되어야 한다.
  - 권장 placeholder:
    `ONE_TIME_SECRET_PLACEHOLDER_NOT_A_REAL_SECRET`.
  - create response의 `raw_secret` 필드 계약은 유지하되, 검증은 존재 여부만
    확인하고 값을 출력하지 않는다.

## 변경 파일
- `docs/handoffs/wave-024/PM_REPORT.md`
- 수정하지 않음:
  - `docs/backlog/MVP5_DRAFT_BACKLOG.md`
  - `apps/backend/`
  - `apps/frontend/`
  - runtime implementation files
  - Backend/Frontend/QA owned files

## 실행/검증
- 실행한 명령:
  - `git diff --check -- docs/handoffs/wave-024/PM_REPORT.md docs/backlog/MVP5_DRAFT_BACKLOG.md`
  - `for file in docs/handoffs/wave-024/PM_REPORT.md docs/backlog/MVP5_DRAFT_BACKLOG.md; do output=$(git diff --no-index --check /dev/null "$file" 2>&1 || true); if [ -n "$output" ]; then printf '%s\n' "$output"; exit 1; fi; done`
- 결과:
  - PASS. `git diff --check` produced no whitespace errors.
  - PASS. Untracked-file `--no-index --check` wrapper produced no whitespace
    error output.
- 실행하지 못한 검증:
  - Backend/Frontend runtime smoke는 PM scope guard 역할 범위가 아니므로
    실행하지 않는다.

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세:
  - 새 API, enum, DTO, runtime behavior를 정의하지 않았다.
  - Wave23에서 이미 frozen된 PM scope와 Wave23 Backend planning draft를
    Wave24 thin implementation guard로 재확인했다.
  - JSON import/export는 Wave23 P0 contract area이지만 Wave24 first thin
    runtime에서는 optional로 둔다. 이 선택은 범위 축소이며 새 범위 확장이
    아니다.
- 영향받는 역할:
  - Backend: Gate 0 cleanup 후 selected thin runtime만 구현한다.
  - Frontend: mock-first admin shell과 selected P0 states만 구현한다.
  - QA: `INT5-*`를 thin slice 기준으로 판정하되, Gate 0 실패는 P0 FAIL로
    본다.

## Blocker
- PM scope blocker: 없음.
- Mandatory Gate 0 blocker:
  - raw-secret-looking examples cleanup이 완료되기 전에는 Backend seed,
    runtime fixture, Frontend mock, screenshot, smoke artifact, report 생성이
    진행되면 안 된다.
- Implementation blocker:
  - Backend/Frontend가 JSON import/export까지 포함하면 Wave24 thin slice가
    커질 수 있다. 커지면 JSON import/export는 Wave25로 이관한다.

## 남은 TODO
- Backend:
  - `docs/api/MVP5_API_CONTRACT_DRAFT.md`와
    `docs/api/openapi-mvp5-draft.json` Gate 0 cleanup을 먼저 수행한다.
  - deterministic MVP5 seed와 selected admin/operator thin runtime을 구현한다.
  - create response 외 list/detail/audit/event/report/fixture에서
    `raw_secret` 또는 raw secret value가 없음을 테스트한다.
  - service account/API key scopes must not imply external write APIs.
  - automatic approval enforce-preview must not bypass review/publish lineage.
- Frontend:
  - Admin global LNB entry는 안정적인 `Admin` 하나만 추가한다.
  - project admin detail routes는 contextual route로 유지한다.
  - mocks, screenshots, console output, local/session storage, report text에
    raw secret literal을 넣지 않는다.
  - permission denied/read-only, masked credential, dry-run/enforce-preview,
    destructive confirmation, audit link states를 selected thin slice에 맞춰
    구현한다.
- QA:
  - Gate 0 no-secret scan을 runtime smoke보다 먼저 수행한다.
  - actual smoke는 raw create secret value를 출력하지 않고 존재 여부와
    masking transition만 검증한다.
  - MVP1-MVP4 regression guard를 유지한다.

## 다른 역할에 전달할 내용
- PM:
  - 새 PM decision은 열지 않는다.
  - Wave24는 범위 확장이 아니라 Wave23 frozen MVP5 P0의 첫 thin slice다.
- Backend:
  - 절대 하지 말 것: production SSO/OIDC, vault/KMS, production rotation,
    full ABAC language, full RDF/OWL/SHACL, full SPARQL/Cypher, distributed
    observability/HA/DR, external write APIs, ungated autonomous publish.
  - 절대 하지 말 것: raw secret value를 tests, logs, fixtures, reports,
    audit events, OpenAPI examples, seed output에 출력하거나 저장하는 것.
  - JSON import/export는 optional이다. first thin runtime이 커지면 Wave25로
    미룬다.
- Frontend:
  - 절대 하지 말 것: raw secret literal을 mock fixture, browser screenshot,
    local/session storage, console output, report에 넣는 것.
  - 절대 하지 말 것: Admin 외 project-scoped detail routes를 global LNB에
    평면적으로 추가하는 것.
  - 절대 하지 말 것: enforce를 dry-run/audit/confirmation 없이 실행 가능한
    자동 승인 UI로 보이게 하는 것.
- QA:
  - Gate 0 실패는 Wave24 implementation 전체를 막는 P0 issue로 처리한다.
  - JSON import/export 누락은 PM이 approved narrower slice로 인정한 경우
    Wave24 FAIL 사유가 아니라 Wave25 TODO로 판정할 수 있다.
  - P1 exclusion 침범 또는 raw secret artifact 노출은 FAIL로 판정한다.

## 총괄에게 요청하는 결정
- 추가 총괄 결정 요청 없음.
- Backend/Frontend가 coherent admin/operator smoke를 유지하면서 더 좁은
  thin slice를 제안하면 PM 관점에서는 승인 가능하다.
- JSON import/export를 Wave24에서 제외하고 Wave25로 넘기는 것은 허용된
  범위 축소로 본다.

## 현재 판정
- PASS
