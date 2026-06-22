# Frontend Report - Wave 24

## 담당 범위
- backlog ID:
  - `FE5-001`
  - `FE5-002`
  - `FE5-003`
  - `FE5-004`
  - `FE5-006`
  - `FE5-007`
  - `FE5-008`
- 작업 경로:
  - `apps/frontend/package.json`
  - `apps/frontend/src/app/router.tsx`
  - `apps/frontend/src/shared/layout/navigation.ts`
  - `apps/frontend/src/shared/layout/AppShell.tsx`
  - `apps/frontend/src/shared/api/types.ts`
  - `apps/frontend/src/shared/api/client.ts`
  - `apps/frontend/src/shared/api/queries.ts`
  - `apps/frontend/src/shared/mocks/mvp5Fixtures.ts`
  - `apps/frontend/src/shared/api/mvp5Mock.test.ts`
  - `apps/frontend/src/pages/AdminPages.tsx`
  - `apps/frontend/src/pages/mvp5Shared.tsx`
  - `apps/frontend/scripts/mvp5-mock-route-smoke.mjs`
  - `apps/frontend/scripts/mvp5-actual-api-smoke.mjs`
  - `docs/handoffs/wave-024/FRONTEND_REPORT.md`

## 완료한 작업
- MVP5 admin mock-first route slice를 구현했다.
  - `/admin`
  - `/admin/projects`
  - `/projects/:projectId/admin`
  - `/projects/:projectId/admin/roles`
  - `/projects/:projectId/admin/credentials`
  - `/projects/:projectId/admin/policies/approval`
  - `/projects/:projectId/admin/operations`
  - `/projects/:projectId/admin/retention-backup`
- LNB에는 stable top-level `Admin` entry 하나만 추가했다.
  - project admin detail routes는 global LNB에 평면 추가하지 않았다.
  - project admin overview와 contextual tabs/cards로 진입한다.
- MVP5 DTO/type, mock fixture, client, query hook을 추가했다.
  - organization/project admin summary.
  - role assignments and permission check.
  - credential create/list/revoke boundary.
  - automatic approval policy, dry-run, diff, enforce-preview.
  - operations dashboard, DLQ, cost, structured events, observability.
  - retention policy, deletion dry-run, backup snapshots, restore dry-run.
  - audit events.
- UI에 Wave23 Frontend requirements의 smoke markers를 반영했다.
  - `mvp5-admin-shell`
  - `mvp5-admin-scope-context`
  - `mvp5-permission-denied-state`
  - `mvp5-read-only-state`
  - `mvp5-role-assignment-table`
  - `mvp5-permission-preview`
  - `mvp5-credential-table`
  - `mvp5-secret-one-time-reveal`
  - `mvp5-secret-masked-display`
  - `mvp5-credential-revoke-confirm`
  - `mvp5-policy-draft-editor`
  - `mvp5-policy-diff`
  - `mvp5-policy-dry-run-marker`
  - `mvp5-policy-enforce-marker`
  - `mvp5-policy-blocked-rows`
  - `mvp5-operations-dashboard`
  - `mvp5-dlq-action-boundary`
  - `mvp5-structured-event-detail`
  - `mvp5-retention-policy-table`
  - `mvp5-deletion-dry-run-impact`
  - `mvp5-backup-snapshot-list`
  - `mvp5-restore-dry-run-impact`
  - `mvp5-audit-link`
- Secret safety UX를 mock-first로 구현했다.
  - create response의 one-time field는 client/test contract에서 존재만 확인한다.
  - UI는 one-time reveal placeholder를 보여주며 raw value를 persist/reprint하지 않는다.
  - list/detail/table/audit/event fixture는 masked display만 사용한다.
- Smoke scripts를 추가하고 package script를 등록했다.
  - `npm run smoke:mvp5:mock`
  - `npm run smoke:mvp5:actual`
- MVP5 mock fixture/type test를 추가했다.
  - selected context, permission denied, blocked policy rows, operations,
    retention/backup dry-run, no persistent raw credential material을 검증한다.

## 변경 파일
- `apps/frontend/package.json`
- `apps/frontend/src/app/router.tsx`
- `apps/frontend/src/shared/layout/navigation.ts`
- `apps/frontend/src/shared/layout/AppShell.tsx`
- `apps/frontend/src/shared/api/types.ts`
- `apps/frontend/src/shared/api/client.ts`
- `apps/frontend/src/shared/api/queries.ts`
- `apps/frontend/src/shared/mocks/mvp5Fixtures.ts`
- `apps/frontend/src/shared/api/mvp5Mock.test.ts`
- `apps/frontend/src/pages/AdminPages.tsx`
- `apps/frontend/src/pages/mvp5Shared.tsx`
- `apps/frontend/scripts/mvp5-mock-route-smoke.mjs`
- `apps/frontend/scripts/mvp5-actual-api-smoke.mjs`
- `docs/handoffs/wave-024/FRONTEND_REPORT.md`
- 수정하지 않음:
  - `apps/backend/`
  - PM/Backend/QA reports
  - Backend API draft/OpenAPI files

## 실행/검증
- 실행한 명령:
  - `cd apps/frontend && npm run test -- src/shared/api/mvp5Mock.test.ts`
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && npm run dev -- --port 5173`
  - `cd apps/frontend && npm run smoke:mvp5:mock`
  - `cd apps/frontend && npm run smoke:mvp4:mock`
  - 총괄 후속 검증:
    - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8015 VITE_MVP5_ORGANIZATION_ID=org-corp-knowledge npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
    - `cd apps/frontend && VITE_USE_MOCK_API=true npm run dev -- --host 127.0.0.1 --port 5174 --strictPort`
    - `cd apps/frontend && MVP5_API_BASE_URL=http://127.0.0.1:8015 MVP5_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP5_SEED_JSON=/tmp/ontology-wave24-commander-mvp5-seed.json MVP5_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave24-commander-mvp5-actual-smoke npm run smoke:mvp5:actual`
    - `cd apps/frontend && MVP5_FRONTEND_BASE_URL=http://127.0.0.1:5174 MVP5_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave24-commander-mvp5-mock-smoke npm run smoke:mvp5:mock`
    - `node -e "JSON.parse(require('fs').readFileSync('docs/api/openapi-mvp5-draft.json','utf8')); console.log('openapi json parse PASS')"`
    - no-secret scan for MVP5 frontend/docs/report surfaces.
  - Backend actual availability check:
    - seed file parse check for `/tmp/ontology-wave24-mvp5-seed.json`
    - `curl -fsS http://127.0.0.1:8000/docs`
  - frontend no-secret scan for MVP5 fixture/test/scripts/mock smoke artifact.
  - ASCII scan for newly added frontend files.
  - `git diff --check` for changed frontend files.
- 결과:
  - `npm run test -- src/shared/api/mvp5Mock.test.ts`: PASS, 2 tests.
  - `npm run test`: PASS, 5 files / 12 tests.
  - `npm run build`: PASS.
  - `npm run smoke:mvp5:mock`: PASS, 8 admin routes.
    - artifact: `/tmp/ontology-mvp5-frontend-smoke/mvp5-mock-route-smoke.json`
    - secret safety summary reports `rawSecretPrinted: false` and masked persistent views.
  - 총괄 후속 `npm run smoke:mvp5:mock`: PASS, 8 admin routes.
    - artifact: `/tmp/ontology-wave24-commander-mvp5-mock-smoke/mvp5-mock-route-smoke.json`
  - 총괄 후속 `npm run smoke:mvp5:actual`: PASS, 5 admin routes / 7 API checks.
    - artifact: `/tmp/ontology-wave24-commander-mvp5-actual-smoke/mvp5-actual-api-smoke.json`
    - secret safety summary: `hasRawSecret: true`, `rawSecretPrinted: false`, `listMaskedOnly: true`.
  - `npm run smoke:mvp4:mock`: PASS, 7 MVP4 routes.
    - artifact: `/tmp/ontology-mvp4-frontend-smoke/mvp4-mock-route-smoke.json`
  - no-secret scan: PASS, 0 violations.
  - 총괄 후속 no-secret scan: PASS, 0 matches after replacing secret-looking masked examples with `MASKED_API_KEY_...9F2A`.
  - OpenAPI JSON parse: PASS.
  - ASCII scan: PASS for newly added frontend files.
  - `git diff --check`: PASS for changed frontend files.
- 실행하지 못한 검증:
  - `npm run smoke:mvp4:actual` and `npm run smoke:mvp3:actual`: NOT RUNNABLE in this follow-up
    because Wave24 scope was MVP5 admin thin-slice actual validation.

## API/Enum/DTO 변경
- 변경 여부: 있음, Frontend DTO/client/mock only.
- 상세:
  - Runtime Backend API는 변경하지 않았다.
  - Frontend `types.ts`에 MVP5 draft-aligned admin DTO/enums를 추가했다.
  - Frontend client actual mode는 Wave23 draft paths를 호출하도록 준비했다.
  - 총괄 후속 보정으로 actual mode client가 backend runtime의 `items`,
    `id`, `action_mode`, `blocked_reasons`, `lineage_impacts`,
    `impacted_resources` aliases를 UI DTO로 normalize한다.
  - `VITE_MVP5_ORGANIZATION_ID`로 actual seed organization context를 주입할 수 있다.
  - Mock fixture는 selected thin slice의 permission, credential, policy,
    operations, retention/backup, audit states를 포함한다.
- 영향받는 역할:
  - Backend: actual runtime이 준비되면 registered `smoke:mvp5:actual`로
    frontend actual route/API smoke를 재실행할 수 있다.
  - QA: `mvp5-*` data-testid markers와 mock smoke artifact를 기준으로
    `INT5-008`을 검증할 수 있다.

## Blocker
- Frontend mock-first blocker: 없음.
- Actual API blocker: 없음.
  - 총괄 후속 검증에서 backend actual server `127.0.0.1:8015`와 frontend actual server
    `127.0.0.1:5173` 조합으로 `smoke:mvp5:actual` PASS.

## 남은 TODO
- 필요 시 `npm run smoke:mvp4:actual` / `npm run smoke:mvp3:actual`
  regression을 Wave25에서 재실행한다.
- JSON import/export admin route는 Wave24 PM-approved optional/narrower slice로
  제외했다. 필요하면 Wave25에서 `/projects/:projectId/admin/import-export`
  UI를 추가한다.
- actual API response shape가 draft와 다르면 Frontend DTO/client를 Wave25에서
  좁게 sync한다.

## 다른 역할에 전달할 내용
- PM:
  - Wave24 Frontend는 approved narrower admin/operator slice로 완료했다.
  - JSON import/export UI는 이번 Frontend slice에서 제외했다.
- Backend:
  - Frontend actual smoke script가 draft endpoint paths와 one-time secret
    existence-only assertion을 사용하며 Wave24 총괄 후속 검증에서 PASS했다.
  - list/detail/audit/event response에는 raw credential value가 없어야 한다.
- Frontend:
  - Admin global LNB entry는 하나만 유지한다.
  - Project admin detail은 contextual tabs/cards로만 추가한다.
- QA:
  - Mock smoke artifact와 screenshots are under
    `/tmp/ontology-mvp5-frontend-smoke`.
  - 총괄 후속 mock smoke artifact:
    `/tmp/ontology-wave24-commander-mvp5-mock-smoke/mvp5-mock-route-smoke.json`.
  - 총괄 후속 actual smoke artifact:
    `/tmp/ontology-wave24-commander-mvp5-actual-smoke/mvp5-actual-api-smoke.json`.

## 총괄에게 요청하는 결정
- 추가 결정 요청 없음.
- Actual smoke는 Backend runtime availability 후 재검증 요청.

## 현재 판정
- PASS
