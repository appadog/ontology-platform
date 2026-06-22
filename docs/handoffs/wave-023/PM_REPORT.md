# PM / MVP5 Scope and Governance Architect Report - Wave 23

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
- 작업 경로:
  - `docs/pm/MVP5_PREP_BRIEF.md`
  - `docs/backlog/MVP5_DRAFT_BACKLOG.md`
  - `docs/adr/0008-mvp5-enterprise-governance-boundary.md`
  - `docs/handoffs/wave-023/PM_REPORT.md`

## 완료한 작업
- MVP5 P0 demo flow를 운영자/admin 중심으로 정의했다.
  - admin console
  - role/permission assignment
  - API key/service account masked-secret lifecycle
  - automatic approval dry-run and gated enforce
  - JSON ontology import/export dry-run
  - operations/DLQ/cost/observability view
  - retention/backup governance dry-run
- MVP5 P0 thin slice를 작고 응집력 있게 확정했다.
  - P0는 enterprise governance and operations control plane이다.
  - 검색/RAG 반복 데모는 P0 중심이 아니다.
- P0/P1 경계를 명확히 기록했다.
  - SSO/OIDC production integration: P1.
  - production secret rotation and vault/KMS: P1.
  - full HA/distributed infra: P1.
  - full SPARQL/Cypher console: P1.
  - full RDF/Turtle/OWL/SHACL fidelity: P1.
  - full customer-authored ABAC expression engine: P1.
  - automatic approval without evidence/validation/version/audit gates: out of scope.
- canonical roles and permission dimensions를 정의했다.
  - `ORGANIZATION_ADMIN`
  - `PROJECT_ADMIN`
  - `ONTOLOGY_EDITOR`
  - `SOURCE_MANAGER`
  - `REVIEWER`
  - `PUBLISHER`
  - `ANALYST_VIEWER`
  - `EXTERNAL_API_CONSUMER`
  - `SERVICE_ACCOUNT`
- security invariants를 확정했다.
  - dev auth local allowance.
  - masked secrets and one-time reveal only.
  - no raw secret logging, fixtures, reports, or repeat display.
  - policy change audit with diff/version/reason.
  - automatic approval evidence, validation, version, candidate eligibility,
    policy, and audit gates.
  - destructive operation impact preview and confirmation.
- Backend와 Frontend가 다음 단계에서 답해야 할 contract/UX 질문을
  구체적으로 작성했다.
- `docs/backlog/MVP5_DRAFT_BACKLOG.md`에 PM5/BE5/FE5/INT5 backlog를
  생성했다.
- ADR 0008에 MVP5 enterprise/governance boundary를 기록했다.

## 변경 파일
- `docs/pm/MVP5_PREP_BRIEF.md`
- `docs/backlog/MVP5_DRAFT_BACKLOG.md`
- `docs/adr/0008-mvp5-enterprise-governance-boundary.md`
- `docs/handoffs/wave-023/PM_REPORT.md`
- 수정하지 않음:
  - Backend 구현 파일
  - Frontend 구현 파일
  - Runtime/API implementation files
  - PM 소유 범위 밖 wave/current-state 파일

## 실행/검증
- 실행한 명령:
  - `git diff --check -- docs/pm/MVP5_PREP_BRIEF.md docs/backlog/MVP5_DRAFT_BACKLOG.md docs/adr/0008-mvp5-enterprise-governance-boundary.md docs/handoffs/wave-023/PM_REPORT.md`
  - `for file in docs/pm/MVP5_PREP_BRIEF.md docs/backlog/MVP5_DRAFT_BACKLOG.md docs/adr/0008-mvp5-enterprise-governance-boundary.md docs/handoffs/wave-023/PM_REPORT.md; do output=$(git diff --no-index --check /dev/null "$file" 2>&1 || true); if [ -n "$output" ]; then printf '%s\n' "$output"; exit 1; fi; done`
- 결과:
  - PASS. `git diff --check` produced no whitespace errors.
  - PASS. Untracked-file `--no-index --check` wrapper produced no whitespace
    error output.
  - Note: direct `git diff --no-index --check /dev/null <file>` can return
    exit `1` because `/dev/null` and the file differ. The wrapper checked the
    actual whitespace error output.
- 실행하지 못한 검증:
  - Backend/Frontend runtime smoke는 Wave23 PM contract-first planning 범위가
    아니어서 실행하지 않는다.

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세:
  - Runtime API, enum, DTO 구현은 변경하지 않았다.
  - PM canonical role literals와 policy/security semantics만 planning
    contract로 정의했다.
  - Backend가 다음 단계에서 최종 enum/DTO 이름을 제안해야 한다.
- 영향받는 역할:
  - Backend: MVP5 API/DTO/enum contract draft와 OpenAPI planning artifact를
    작성한다.
  - Frontend: admin IA, permission states, masked secret UX, dry-run/enforce
    UX, import/export states, operations states를 검토한다.
  - QA: `INT5-*` acceptance checklist와 deterministic seed/smoke plan을
    작성한다.

## Blocker
- PM blocker: 없음.
- 남은 cross-role blocker:
  - Backend contract draft가 아직 없다.
  - Frontend UX/field review가 아직 없다.
  - QA `INT5-*` checklist가 아직 없다.

## 남은 TODO
- Backend:
  - `docs/api/MVP5_API_CONTRACT_DRAFT.md` 작성.
  - `docs/api/openapi-mvp5-draft.json` 작성 및 JSON parse 검증.
  - PM P0 role/policy/security/import/export/ops/retention boundary를
    endpoint, DTO, enum, examples로 구체화.
- Frontend:
  - `docs/pm/MVP5_FRONTEND_UX_REQUIREMENTS.md` 작성.
  - admin shell IA, permission denied/read-only states, masked secret UX,
    policy dry-run/enforce UX, import/export UX, operations UX, retention/backup
    UX를 구체화.
- QA:
  - `docs/backlog/INT5_MVP5_ACCEPTANCE.md` 작성.
  - authorization matrix, security invariants, automatic approval safety,
    import/export, operations, retention/backup, regression guard를 체크리스트화.

## 다른 역할에 전달할 내용
- PM:
  - MVP5 P0는 enterprise governance and operations control plane으로 고정했다.
  - 검색/RAG, vector hardening, collaboration/SLA 확장이 아니라 admin/operator
    thin slice가 다음 구현 기준이다.
- Backend:
  - local dev auth is allowed for P0.
  - production SSO/OIDC, production secret rotation, vault/KMS, full HA,
    full RDF/OWL/SHACL fidelity, and full SPARQL/Cypher console are P1.
  - raw secrets must only appear in create response and must never appear in
    list/detail/log/report/fixture/audit text.
  - automatic approval must be dry-run-first and evidence/validation/version/
    candidate eligibility/policy/audit gated.
- Frontend:
  - admin console UX must make dry-run versus enforce, masked versus raw secret,
    permission denied versus read-only, and destructive confirmation visually
    obvious.
  - Policy diff, audit links, blocked reasons, and destructive impact preview
    are P0 state requirements.
- QA:
  - `INT5-*` should verify security invariants explicitly, not only page/API
    availability.
  - MVP1-MVP4 regression guard remains part of MVP5 acceptance.

## 총괄에게 요청하는 결정
- 추가 PM 결정 요청 없음.
- Backend may proceed with MVP5 contract draft using this PM freeze.
- Frontend and QA should wait for Backend draft where their orders require it,
  but can use this PM freeze as the scope source.

## 현재 판정
- PASS
