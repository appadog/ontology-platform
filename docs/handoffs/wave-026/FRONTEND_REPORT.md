# Frontend Report - Wave 26

## 담당 범위
- backlog ID:
  - `INT5-001`~`INT5-010`
  - Post-MVP5 frontend safe cleanup
- 작업 경로:
  - `apps/frontend/src/pages/AdminPages.tsx`
  - `apps/frontend/src/pages/admin/`
  - `apps/frontend/src/pages/mvp5Shared.tsx`
  - `docs/handoffs/wave-026/FRONTEND_REPORT.md`

## 완료한 작업
- PM 승인 범위에 맞춰 `AdminPages.tsx` 844-line 단일 파일을 page 단위 모듈로 분리했다.
  - `AdminConsolePage`
  - `AdminProjectsPage`
  - `ProjectAdminPage`
  - `ProjectAdminRolesPage`
  - `ProjectAdminCredentialsPage`
  - `ProjectAdminApprovalPolicyPage`
  - `ProjectAdminImportExportPage`
  - `ProjectAdminOperationsPage`
  - `ProjectAdminRetentionBackupPage`
- `AdminPages.tsx`는 compatibility barrel로 유지했다.
  - `router.tsx` import path와 exported page component names는 변경하지 않았다.
  - route paths, global LNB semantics, API hooks, DTO/client behavior는 변경하지 않았다.
- `apps/frontend/src/pages/admin/shared.tsx`를 추가해 admin page 전용 imports를 모았다.
- MVP5 smoke marker `data-testid` 값은 유지했다.
- 작은 UI polish를 적용했다.
  - admin table wrapper에 `min-width: 0`, `max-width: 100%`, touch scrolling, cell overflow wrapping을 추가해 panel 내부 가로 스크롤 containment를 강화했다.
  - visible copy 일부를 `Dry-run`, `confirmation required`, `read-only`, `masked`, `no credential material` 용어로 정리했다.
- 금지 범위 준수:
  - backend 파일 미수정.
  - `shared/api/client.ts`, `shared/api/types.ts`, fixtures/scripts 미수정.
  - import apply/overwrite/publish UI 미추가.

## 변경 파일
- `apps/frontend/src/pages/AdminPages.tsx`
- `apps/frontend/src/pages/admin/shared.tsx`
- `apps/frontend/src/pages/admin/AdminConsolePage.tsx`
- `apps/frontend/src/pages/admin/AdminProjectsPage.tsx`
- `apps/frontend/src/pages/admin/ProjectAdminPage.tsx`
- `apps/frontend/src/pages/admin/ProjectAdminRolesPage.tsx`
- `apps/frontend/src/pages/admin/ProjectAdminCredentialsPage.tsx`
- `apps/frontend/src/pages/admin/ProjectAdminApprovalPolicyPage.tsx`
- `apps/frontend/src/pages/admin/ProjectAdminImportExportPage.tsx`
- `apps/frontend/src/pages/admin/ProjectAdminOperationsPage.tsx`
- `apps/frontend/src/pages/admin/ProjectAdminRetentionBackupPage.tsx`
- `apps/frontend/src/pages/mvp5Shared.tsx`
- `docs/handoffs/wave-026/FRONTEND_REPORT.md`
- 수정하지 않음:
  - `apps/backend/`
  - `apps/frontend/src/shared/api/client.ts`
  - `apps/frontend/src/shared/api/types.ts`
  - `apps/frontend/src/shared/mocks/`
  - `apps/frontend/scripts/`
  - `apps/frontend/src/app/router.tsx`

## 실행/검증
- 실행한 명령:
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && VITE_USE_MOCK_API=true npm run dev -- --port 5175 --strictPort`
  - `cd apps/frontend && MVP5_FRONTEND_BASE_URL=http://127.0.0.1:5175 MVP5_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave26-frontend-mvp5-mock-smoke npm run smoke:mvp5:mock`
  - `cd apps/backend && rm -f /tmp/ontology-wave26-mvp5-seed.db /tmp/ontology-wave26-mvp5-seed.json /tmp/ontology-wave26-mvp5-seed.stdout.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave26-mvp5-seed.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave26-mvp5-seed.db .venv/bin/python scripts/seed_mvp5.py --output /tmp/ontology-wave26-mvp5-seed.json >/tmp/ontology-wave26-mvp5-seed.stdout.json && python3 -m json.tool /tmp/ontology-wave26-mvp5-seed.json >/tmp/ontology-wave26-mvp5-seed.pretty.json`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave26-mvp5-seed.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8015`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8015 VITE_MVP5_ORGANIZATION_ID=org-corp-knowledge npm run dev -- --port 5173 --strictPort`
  - `cd apps/frontend && MVP5_API_BASE_URL=http://127.0.0.1:8015 MVP5_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP5_SEED_JSON=/tmp/ontology-wave26-mvp5-seed.json MVP5_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave26-frontend-mvp5-actual-smoke npm run smoke:mvp5:actual`
  - `rg -n "data-testid=|mvp5-|confirmation_required|CONFIRM_REQUIRED|READ_ONLY|dry-run required|mutation_applied|export_running|export_expired|export_error|export_empty" apps/frontend/src/pages/AdminPages.tsx apps/frontend/src/pages/admin apps/frontend/src/pages/mvp5Shared.tsx`
  - `rg -n "(?i)(sk-[A-Za-z0-9_-]{12,}|api[_-]?key[=:][A-Za-z0-9_-]{12,}|password[=:][^[:space:]]+|token[=:][A-Za-z0-9_-]{12,}|secret[=:][A-Za-z0-9_-]{12,})" apps/frontend/src/pages/AdminPages.tsx apps/frontend/src/pages/admin apps/frontend/src/pages/mvp5Shared.tsx`
  - `git diff --check -- apps/frontend/src/pages/AdminPages.tsx apps/frontend/src/pages/mvp5Shared.tsx`
  - `for f in apps/frontend/src/pages/AdminPages.tsx apps/frontend/src/pages/mvp5Shared.tsx apps/frontend/src/pages/admin/*.tsx docs/handoffs/wave-026/FRONTEND_REPORT.md; do output=$(git diff --no-index --check /dev/null "$f" 2>&1 || true); if [ -n "$output" ]; then printf '%s\n' "$output"; exit 1; fi; done`
- 결과:
  - `npm run test`: PASS, 5 files / 12 tests.
  - `npm run build`: PASS.
  - `smoke:mvp5:mock`: PASS, 9 routes.
    - artifact: `/tmp/ontology-wave26-frontend-mvp5-mock-smoke/mvp5-mock-route-smoke.json`
    - `rawSecretPrinted: false`, `persistentViewsMaskedOnly: true`.
  - fresh SQLite Alembic + MVP5 seed: PASS.
    - seed artifact: `/tmp/ontology-wave26-mvp5-seed.json`
  - `smoke:mvp5:actual`: PASS, 9 API checks / 6 routes.
    - artifact: `/tmp/ontology-wave26-frontend-mvp5-actual-smoke/mvp5-actual-api-smoke.json`
    - `hasRawSecret: true`, `rawSecretPrinted: false`, `listMaskedOnly: true`.
  - marker/copy sweep: PASS. Existing smoke marker names are present after split.
  - no-secret regex scan on changed frontend page surfaces: PASS, no matches.
  - `git diff --check` tracked frontend surfaces: PASS.
  - untracked frontend page/report whitespace check: PASS, no whitespace warnings.
- 실행하지 못한 검증:
  - MVP3/MVP4 actual smokes는 실행하지 않았다. `router.tsx`, shared API client/types, global app layout을 변경하지 않았고, 변경 범위는 MVP5 admin page split 및 `mvp5Shared.tsx` admin helper containment로 제한된다.
  - Docker/PostgreSQL Compose smoke는 기존 P1 environment follow-up으로 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세:
  - API route, DTO, enum, query hook behavior, mock fixtures, actual client normalizer를 변경하지 않았다.
  - `useAdminPermissionCheck` request shape는 기존 값을 유지했다.
- 영향받는 역할:
  - Backend: 추가 작업 요청 없음.
  - QA: MVP5 mock/actual smoke artifacts로 behavior preserved 재검증 가능.

## Blocker
- Frontend blocker: 없음.

## 남은 TODO
- P1/P2로 분류된 `shared/api/client.ts`, `shared/api/types.ts`, smoke harness modularization은 Wave26에서 건드리지 않았다.
- 더 큰 admin component/helper extraction은 QA가 이번 split 안정성을 확인한 뒤 Wave27+에서 판단하는 것이 안전하다.

## 다른 역할에 전달할 내용
- PM:
  - PM 승인 P0 safe cleanup 범위 안에서 page split과 작은 copy/containment polish를 완료했다.
- Backend:
  - Backend/API 변경 요청 없음.
- Frontend:
  - `AdminPages.tsx`는 compatibility barrel이다. 신규 admin page 수정은 `apps/frontend/src/pages/admin/`의 해당 page module에서 하면 된다.
- QA:
  - MVP5 behavior preserved 검증 근거:
    - test/build PASS
    - MVP5 mock smoke PASS
    - MVP5 actual smoke PASS
    - smoke marker names preserved
    - no-secret scan PASS

## 총괄에게 요청하는 결정
- 추가 결정 요청 없음.
- 추천: QA가 Wave26 frontend cleanup을 `PASS`로 확인하면 Admin page split을 기준 구조로 받아도 된다.

## 현재 판정
- PASS
