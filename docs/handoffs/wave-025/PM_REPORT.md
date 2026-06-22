# PM / Architecture Report - Wave 25

## 담당 범위
- backlog ID:
  - `PM5-005`
  - `BE5-005`
  - `FE5-005`
  - `INT5-005`
  - `INT5-009`
- 작업 경로:
  - `docs/backlog/MVP5_DRAFT_BACKLOG.md`
  - `docs/backlog/INT5_MVP5_ACCEPTANCE.md`
  - `docs/pm/MVP5_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/handoffs/wave-025/PM_REPORT.md`
- 확인한 source 문서:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-025/NEXT_ORDERS.md`
  - `docs/handoffs/wave-024/PM_REPORT.md`
  - `docs/handoffs/wave-024/BACKEND_REPORT.md`
  - `docs/handoffs/wave-024/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-024/QA_REPORT.md`
  - `docs/pm/MVP5_PREP_BRIEF.md`
  - `docs/backlog/MVP5_DRAFT_BACKLOG.md`
  - `docs/backlog/INT5_MVP5_ACCEPTANCE.md`
  - `docs/adr/0008-mvp5-enterprise-governance-boundary.md`
  - `docs/api/MVP5_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp5-draft.json`
  - `docs/pm/MVP5_FRONTEND_UX_REQUIREMENTS.md`

## 완료한 작업
- Wave25 PM/Architecture 기준으로 `INT5-005` JSON ontology import/export P0
  behavior를 freeze했다.
- Export P0 metadata를 아래로 확정했다.
  - `package_id`
  - `schema_version`
  - `project_id`
  - `ontology_version_id`
  - class/property/relation counts
  - `generated_at`
  - compatibility notes
  - audit ref
- Export acceptance를 safe package readiness로 확정했다.
  - ready/loading/error/empty states.
  - JSON format.
  - download or inline package summary.
  - expiry/checksum where available.
  - no raw credential material in package, preview, filename, metadata, or
    audit text.
- Import P0를 dry-run only로 확정했다.
  - upload/paste JSON package or deterministic dry-run request input.
  - package parse summary.
  - compatibility status.
  - create/update/delete/no-op counts.
  - conflict rows, warning rows, destructive impact rows.
  - rollback guidance.
  - confirmation requirement.
  - audit preview/ref.
- Import apply, overwrite, publish, or graph mutation은 Wave25 P0에서 제외했다.
  - 추천 기본값인 dry-run only를 채택했다.
  - narrow safe mutation은 이번 PM decision에서 승인하지 않았다.
- Import dry-run non-mutation proof를 acceptance에 추가했다.
  - project state, ontology versions, candidate graph, published graph, package
    history는 mutate하지 않는다.
  - QA는 before/after counts 또는 stable snapshots로 검증한다.
- RDF/Turtle/OWL/SHACL은 P1 compatibility/fidelity target으로 유지했다.
  - Wave25 P0는 explicit JSON package shape만 검증한다.
- Frontend route/IA acceptance를 freeze했다.
  - route: `/projects/:projectId/admin/import-export`.
  - project admin tabs/cards may include `Import/export`.
  - global LNB remains one stable `Admin` entry only.
  - import/export route is contextual, not a flat global menu item.
- Frontend states를 freeze했다.
  - export: ready, loading, error, empty, running, expired.
  - import dry-run: compatible, warning, conflict, destructive, invalid,
    loading, error, metadata ready.
  - audit link, rollback guidance, confirmation required, permission denied,
    read-only.
  - no raw credential material.
- `INT5-009` regression matrix를 freeze했다.
  - Backend: MVP5 focused tests plus MVP4/MVP3 focused regression tests.
  - Backend MVP1/MVP2 checks run if available and cheap; unavailable commands
    are documented honestly.
  - Frontend: `npm run test`, `npm run build`, `npm run smoke:mvp5:mock`,
    `npm run smoke:mvp5:actual` when Backend runtime exists.
  - Frontend MVP3/MVP4 actual smokes run when repo scripts and seed/runtime
    support exist.
  - MVP1/MVP2 frontend smokes run only if available and cheap.
  - Docker/PostgreSQL Compose remains P1 environment follow-up.

## 변경 파일
- `docs/backlog/MVP5_DRAFT_BACKLOG.md`
  - Wave25 PM Freeze Addendum 추가.
- `docs/backlog/INT5_MVP5_ACCEPTANCE.md`
  - `INT5-005` import/export exact acceptance와 non-mutation proof 보강.
  - `INT5-009` Wave25 regression matrix 보강.
- `docs/pm/MVP5_FRONTEND_UX_REQUIREMENTS.md`
  - `FE5-005` route, dry-run only UX, UI states, DTO asks 보강.
- `docs/handoffs/wave-025/PM_REPORT.md`
  - 본 보고서 작성.
- 수정하지 않음:
  - `apps/backend/`
  - `apps/frontend/`
  - runtime implementation files
  - `docs/api/MVP5_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp5-draft.json`

## 실행/검증
- 실행한 명령:
  - `rg -n "raw_secret|sk_|secret|password|token|credential" docs/backlog/INT5_MVP5_ACCEPTANCE.md docs/pm/MVP5_FRONTEND_UX_REQUIREMENTS.md docs/backlog/MVP5_DRAFT_BACKLOG.md`
  - `rg -n "(?i)(sk-[A-Za-z0-9_-]{12,}|api[_-]?key[=:][A-Za-z0-9_-]{12,}|password[=:][^[:space:]]+|token[=:][A-Za-z0-9_-]{12,}|secret[=:][A-Za-z0-9_-]{12,})" docs/backlog/MVP5_DRAFT_BACKLOG.md docs/backlog/INT5_MVP5_ACCEPTANCE.md docs/pm/MVP5_FRONTEND_UX_REQUIREMENTS.md docs/handoffs/wave-025/PM_REPORT.md`
  - `git diff --check -- docs/backlog/MVP5_DRAFT_BACKLOG.md docs/backlog/INT5_MVP5_ACCEPTANCE.md docs/pm/MVP5_FRONTEND_UX_REQUIREMENTS.md docs/handoffs/wave-025/PM_REPORT.md`
  - untracked-aware whitespace check with `git diff --no-index --check
    /dev/null <file>` for changed PM/report files.
- 결과:
  - broad term review: PASS. Matches are policy terms such as secret safety,
    credential, `raw_secret` field-name references, and masked display
    requirements.
  - secret-like regex scan: PASS, no matches.
  - whitespace check: PASS.
- 실행하지 못한 검증:
  - Backend/Frontend runtime tests and smokes are out of PM scope and should run
    after Backend/Frontend implement Wave25 import/export.

## API/Enum/DTO 변경
- 변경 여부: 없음 by PM runtime/API artifact.
- 상세:
  - Runtime code, OpenAPI draft JSON, and API contract draft were not modified.
  - PM acceptance now requires Backend/Frontend to expose or map the exact
    Wave25 metadata and dry-run fields in implementation.
  - `schema_version` is the PM-facing required metadata concept for Wave25
    acceptance. Backend may preserve existing internal names only if the actual
    response/Frontend/QA evidence exposes the accepted semantics clearly.
- 영향받는 역할:
  - Backend: implement export/import dry-run runtime against the frozen
    acceptance, then update actual OpenAPI/critical compare as needed.
  - Frontend: implement the contextual route and all frozen states; do not add
    import apply mutation UI.
  - QA: judge `INT5-005` against dry-run only and non-mutation proof.

## Blocker
- PM blocker: 없음.
- Scope blocker:
  - Import apply mutation is not approved in Wave25. If Backend/Frontend need an
    apply path, it must be promoted by a later PM/commander decision.
- Existing environment blocker:
  - Docker/PostgreSQL Compose smoke remains P1 environment follow-up and is not
    an MVP5 P0 closeout blocker unless commander changes the gate.

## 남은 TODO
- Backend:
  - Add JSON export and import dry-run endpoints.
  - Include export metadata/counts/audit and import parse summary,
    compatibility, counts, conflict/warning/destructive rows, rollback
    guidance, confirmation requirement, audit preview/ref.
  - Prove import dry-run is non-mutating.
  - Preserve no-secret invariants.
- Frontend:
  - Add `/projects/:projectId/admin/import-export`.
  - Keep global LNB to a single `Admin` entry.
  - Add mock/client/types/states for export and import dry-run.
  - Show confirmation requirement as dry-run evidence only; do not enable import
    apply mutation.
- QA:
  - Verify `INT5-005` first, then broaden `INT5-009`.
  - Record MVP1/MVP2 command availability honestly.

## 다른 역할에 전달할 내용
- PM:
  - No further PM decision is needed before Backend/Frontend start Wave25
    implementation.
- Backend:
  - Default implementation target is dry-run only. Do not implement import apply
    mutation unless a later PM decision promotes it.
  - No RDF/Turtle/OWL/SHACL semantic fidelity claims in P0.
  - Export/import packages must not include raw credential material.
- Frontend:
  - The import/export route is contextual under project admin.
  - Do not add project-scoped import/export as a global LNB item.
  - Render compatible/warning/conflict/destructive/invalid dry-run states,
    audit link, rollback guidance, and confirmation-required state.
- QA:
  - `INT5-005` PASS requires non-mutation proof plus mock/actual UI visibility.
  - `INT5-009` PASS requires the Wave25 regression matrix, with unavailable
    historical harnesses documented instead of silently skipped.

## 총괄에게 요청하는 결정
- 추가 결정 요청 없음.
- Wave25 PM recommendation:
  - Backend/Frontend may proceed in parallel on `INT5-005`.
  - QA should verify `INT5-005` before recommending MVP5 closeout.
  - If `INT5-005` and `INT5-009` pass, MVP5 P0 closeout can be considered.

## 현재 판정
- PASS
