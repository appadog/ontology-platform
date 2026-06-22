# Backend / MVP5 API Contract Draft Report - Wave 23

## 담당 범위
- backlog ID:
  - `BE5-001`
  - `BE5-002`
  - `BE5-003`
  - `BE5-004`
  - `BE5-005`
  - `BE5-006`
  - `BE5-007`
  - `BE5-008`
  - `BE5-009`
  - `BE5-010`
- 작업 경로:
  - `docs/api/MVP5_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp5-draft.json`
  - `docs/handoffs/wave-023/BACKEND_REPORT.md`

## 완료한 작업
- PM freeze와 ADR 0008을 기준으로 MVP5 additive API/DTO/enum contract
  draft를 작성했다.
- Wave23 planning-only boundary를 명시했고 runtime Python/FastAPI 구현,
  DB 모델, migration, worker 코드는 수정하지 않았다.
- 다음 endpoint families를 contract draft와 OpenAPI planning artifact에
  반영했다.
  - organization/project admin summary/settings/membership
  - role assignments and permission checks
  - service accounts/API keys create/list/detail/revoke
  - automatic approval policy document, dry-run evaluation, diff,
    enforce-preview gate/audit preview
  - ontology JSON export/import dry-run job create/status/download
  - operations dashboard, job retry, DLQ retry/acknowledge, cost budget,
    structured events, observability availability
  - retention policy, deletion dry-run, backup snapshot list/status,
    restore dry-run eligibility
  - audit/security events for role, credential, policy, import/export, DLQ,
    retention, backup, and destructive actions
- DTO/schema names는 PascalCase, JSON fields는 snake_case, enum literals는
  UPPER_SNAKE_CASE로 맞췄다.
- P0 demo examples를 포함했다.
  - masked secret and one-time secret reveal
  - blocked automatic approval
  - import dry-run conflict
  - DLQ row
  - cost budget near limit
  - retention deletion dry-run
- MVP4 external read-only boundary를 보존했다.
  - service accounts/API keys는 credential lifecycle and scope contract이며,
    external write API나 production auth promotion을 암시하지 않는다.
  - MVP4 search/RAG/external surfaces remain read-only.
- Wave24 deterministic seed/smoke expectations를 contract draft에 작성했다.
- OpenAPI planning artifact는 OpenAPI `3.1.0`, version `0.5.0-draft`,
  `43` paths, `91` schemas로 작성했다.

## 변경 파일
- `docs/api/MVP5_API_CONTRACT_DRAFT.md`
- `docs/api/openapi-mvp5-draft.json`
- `docs/handoffs/wave-023/BACKEND_REPORT.md`
- 수정하지 않음:
  - `apps/backend/`
  - `apps/frontend/`
  - PM/Frontend/QA 소유 문서
  - runtime implementation files

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp5-draft.json >/tmp/openapi-mvp5-draft.pretty.json`
  - `node -e "const fs=require('fs'); const spec=JSON.parse(fs.readFileSync('docs/api/openapi-mvp5-draft.json','utf8')); const s=JSON.stringify(spec); const refs=[...s.matchAll(/#\\/components\\/schemas\\/([A-Za-z0-9_]+)/g)].map(m=>m[1]); const missing=[...new Set(refs.filter(r=>!spec.components.schemas[r]))]; console.log(JSON.stringify({pathCount:Object.keys(spec.paths).length,schemaCount:Object.keys(spec.components.schemas).length,missing},null,2)); if(missing.length) process.exit(1);"`
  - `git diff --check -- docs/api/MVP5_API_CONTRACT_DRAFT.md docs/api/openapi-mvp5-draft.json docs/handoffs/wave-023/BACKEND_REPORT.md`
  - `for file in docs/api/MVP5_API_CONTRACT_DRAFT.md docs/api/openapi-mvp5-draft.json docs/handoffs/wave-023/BACKEND_REPORT.md; do output=$(git diff --no-index --check /dev/null "$file" 2>&1 || true); if [ -n "$output" ]; then printf '%s\n' "$output"; exit 1; fi; done`
- 결과:
  - PASS. JSON parse succeeded and wrote `/tmp/openapi-mvp5-draft.pretty.json`.
  - PASS. Local schema-ref scan reported `pathCount: 43`, `schemaCount: 91`,
    `missing: []`.
  - PASS. `git diff --check` produced no whitespace errors for the owned
    backend API/report files.
  - PASS. Untracked-file `--no-index --check` wrapper produced no whitespace
    error output.
- 실행하지 못한 검증:
  - Runtime backend tests/smoke are not run because Wave23 is contract-first
    planning only and no runtime endpoint implementation was requested.

## API/Enum/DTO 변경
- 변경 여부: 있음, planning artifact only.
- 상세:
  - Runtime API implementation is unchanged.
  - Drafted enums include `EnterpriseRole`, `PrincipalType`,
    `AssignmentScopeType`, `RoleAssignmentStatus`,
    `PermissionResourceType`, `PermissionAction`, `PermissionDecision`,
    `PermissionDenyReason`, `PolicyMode`, `PolicyEvaluationStatus`,
    `PolicyBlockReason`, `CredentialKind`, `CredentialStatus`,
    `CredentialScope`, `GovernanceJobStatus`, `ImportConflictType`,
    `ImportConflictSeverity`, `OperationJobType`, `OperationJobStatus`,
    `OperationEventSeverity`, `BudgetStatus`,
    `ObservabilityAvailabilityStatus`, `RetentionActionMode`,
    `RetentionResourceType`, `BackupStatus`, and `AuditEventCategory`.
  - Drafted major DTOs include `OrganizationAdminSummary`,
    `ProjectAdminSummary`, `RoleAssignment`, `PermissionCheckRequest`,
    `PermissionCheckResponse`, `CredentialCreateResponse`,
    `CredentialView`, `AutomaticApprovalPolicyDocument`,
    `PolicyEvaluationResponse`, `PolicyDiffResponse`,
    `EnforcePreviewResponse`, `OntologyExportJob`,
    `OntologyImportDryRunJob`, `OperationsDashboardResponse`, `DlqRow`,
    `CostBudgetSummary`, `RetentionPolicy`,
    `RetentionDeletionDryRunResponse`, `BackupSnapshot`,
    `RestoreDryRunResponse`, and `AuditEvent`.
- 영향받는 역할:
  - Frontend: admin IA/UX field review can use the path/schema names and P0
    examples in the draft.
  - QA: `INT5-*` checklist can parse `openapi-mvp5-draft.json` and verify
    security boundaries from examples.
  - PM: no new PM decision requested; this follows the Wave23 PM freeze.

## Blocker
- Backend blocker: 없음.
- Cross-role blockers remaining by wave order:
  - Frontend MVP5 admin UX/API field review is not yet produced.
  - QA `INT5-*` acceptance checklist is not yet produced.

## 남은 TODO
- Wave24 Backend, after PM/Frontend/QA accept this contract:
  - choose the smallest runtime thin slice from the accepted endpoint families;
  - implement deterministic seed/smoke helper for MVP5 admin/operator demo;
  - implement only accepted runtime endpoints, tests, OpenAPI export compare,
    and regression guard.
- Frontend:
  - review DTO field names, permission states, masked secret UX, policy
    dry-run/enforce states, import/export conflict states, operations/DLQ/cost
    states, and retention/backup dry-run states.
- QA:
  - verify P0/P1 consistency across PM, Backend, and Frontend docs;
  - create `INT5_MVP5_ACCEPTANCE.md`;
  - include explicit checks for raw secret absence from list/detail/audit/log/
    fixture/report views.

## 다른 역할에 전달할 내용
- PM:
  - The draft stays within the frozen P0 admin/operator governance boundary.
  - No additional PM decision is needed from Backend for Wave23.
- Backend:
  - Do not implement runtime endpoints from this draft until Frontend and QA
    complete Wave23 review and Wave24 orders select the thin slice.
  - Preserve MVP4 external read-only APIs; service account/API key scopes do
    not imply external write access.
- Frontend:
  - Treat `raw_secret` as create-response-only and design future list/detail
    views around `masked_secret`.
  - Treat policy enforce as an enforce-preview/gate/audit UX, not a silent
    publish shortcut.
  - Treat import and retention operations as dry-run-first with destructive
    impact and confirmation states.
- QA:
  - Parse `docs/api/openapi-mvp5-draft.json`.
  - Check examples for secret masking, automatic approval blocks, import
    conflicts, DLQ redaction, cost budget, and retention lineage block.
  - Keep MVP1-MVP4 regression guard in `INT5-*`.

## 총괄에게 요청하는 결정
- 추가 결정 요청 없음.
- Suggested Wave24 order after Frontend/QA PASS:
  - implement deterministic MVP5 seed plus a narrow admin/operator runtime
    slice, starting with organization/project summary, permission check,
    service account one-time secret, policy dry-run, operations/DLQ, and
    retention/backup dry-run fixtures.

## 현재 판정
- PASS
