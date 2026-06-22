# Frontend Report - Wave 25

## 담당 범위
- backlog ID:
  - `FE5-005`
  - `FE5-008`
  - `INT5-005`
  - `INT5-008`
  - `INT5-009`
- 작업 경로:
  - `apps/frontend/src/app/router.tsx`
  - `apps/frontend/src/pages/AdminPages.tsx`
  - `apps/frontend/src/pages/mvp5Shared.tsx`
  - `apps/frontend/src/shared/api/types.ts`
  - `apps/frontend/src/shared/api/client.ts`
  - `apps/frontend/src/shared/api/queries.ts`
  - `apps/frontend/src/shared/mocks/mvp5Fixtures.ts`
  - `apps/frontend/src/shared/api/mvp5Mock.test.ts`
  - `apps/frontend/scripts/mvp5-mock-route-smoke.mjs`
  - `apps/frontend/scripts/mvp5-actual-api-smoke.mjs`
  - `docs/handoffs/wave-025/FRONTEND_REPORT.md`

## 완료한 작업
- `/projects/:projectId/admin/import-export` contextual route를 추가했다.
- Project admin tabs와 overview card/link에 `Import/export` entry를 추가했다.
  - Global LNB는 수정하지 않았고 stable `Admin` entry 하나만 유지했다.
- MVP5 JSON ontology import/export DTO, mock fixtures, client normalizers, query hooks를 추가했다.
  - Export: `package_id`, `schema_version`, `project_id`, `ontology_version_id`, `generated_at`, counts, compatibility notes, download metadata, audit ref.
  - Import dry-run: compatibility status, create/update/delete/no-op counts, conflicts, warnings, destructive impacts, rollback guidance, confirmation requirement, audit preview/ref.
- Backend Wave25 actual shape에 맞춰 actual client/smoke를 정렬했다.
  - Export actual endpoint: `GET /api/v1/admin/projects/{project_id}/ontology-export`.
  - Import dry-run actual endpoint: `POST /api/v1/admin/projects/{project_id}/ontology-import/dry-run`.
  - Import request body는 `{ "mode": "DRY_RUN", "package": { ...OntologyPackagePayload } }`.
  - Import apply/overwrite/publish/mutation UI는 만들지 않았다.
- UI states/markers를 추가했다.
  - `mvp5-import-export-panel`
  - `mvp5-import-dry-run-result`
  - `mvp5-export-ready-state`
  - `mvp5-package-no-secret-preview`
  - `mvp5-import-metadata-ready`
  - `mvp5-import-conflict-rows`
  - `mvp5-import-warning-rows`
  - `mvp5-import-destructive-impact`
  - `mvp5-import-rollback-guidance`
  - `mvp5-import-confirmation-required`
  - `mvp5-import-invalid-state`
- Package preview에는 credential, authorization header, raw secret, token material을 표시하지 않는 safety panel을 추가했다.
- Mock/actual smoke가 import/export route와 markers를 검증하도록 확장했다.

## 변경 파일
- `apps/frontend/src/app/router.tsx`
- `apps/frontend/src/pages/AdminPages.tsx`
- `apps/frontend/src/pages/mvp5Shared.tsx`
- `apps/frontend/src/shared/api/types.ts`
- `apps/frontend/src/shared/api/client.ts`
- `apps/frontend/src/shared/api/queries.ts`
- `apps/frontend/src/shared/mocks/mvp5Fixtures.ts`
- `apps/frontend/src/shared/api/mvp5Mock.test.ts`
- `apps/frontend/scripts/mvp5-mock-route-smoke.mjs`
- `apps/frontend/scripts/mvp5-actual-api-smoke.mjs`
- `docs/handoffs/wave-025/FRONTEND_REPORT.md`
- 수정하지 않음:
  - `apps/backend/`
  - `docs/api/`
  - PM/Backend/QA reports

## 실행/검증
- 실행한 명령:
  - `cd apps/frontend && npm run test -- src/shared/api/mvp5Mock.test.ts`
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/backend && rm -f /tmp/ontology-wave25-mvp5-seed.db /tmp/ontology-wave25-mvp5-seed.json /tmp/ontology-wave25-mvp5-seed.stdout.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave25-mvp5-seed.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave25-mvp5-seed.db .venv/bin/python scripts/seed_mvp5.py --output /tmp/ontology-wave25-mvp5-seed.json >/tmp/ontology-wave25-mvp5-seed.stdout.json && python3 -m json.tool /tmp/ontology-wave25-mvp5-seed.json >/tmp/ontology-wave25-mvp5-seed.pretty.json`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave25-mvp5-seed.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8015`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8015 VITE_MVP5_ORGANIZATION_ID=org-corp-knowledge npm run dev -- --port 5173 --strictPort`
  - `cd apps/frontend && VITE_USE_MOCK_API=true npm run dev -- --port 5175 --strictPort`
  - `cd apps/frontend && MVP5_FRONTEND_BASE_URL=http://127.0.0.1:5175 MVP5_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave25-frontend-mvp5-mock-smoke npm run smoke:mvp5:mock`
  - `cd apps/frontend && MVP5_API_BASE_URL=http://127.0.0.1:8015 MVP5_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP5_SEED_JSON=/tmp/ontology-wave25-mvp5-seed.json MVP5_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave25-frontend-mvp5-actual-smoke npm run smoke:mvp5:actual`
  - `cd apps/frontend && MVP3_API_BASE_URL=http://127.0.0.1:8015 MVP3_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP3_SEED_JSON=/tmp/ontology-wave25-mvp5-seed.json MVP3_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave25-frontend-mvp3-actual-smoke npm run smoke:mvp3:actual`
  - `cd apps/frontend && MVP4_API_BASE_URL=http://127.0.0.1:8015 MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP4_SEED_JSON=/tmp/ontology-wave25-mvp5-seed.json MVP4_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave25-frontend-mvp4-actual-smoke npm run smoke:mvp4:actual`
- 결과:
  - MVP5 focused mock test: PASS, 2 tests.
  - `npm run test`: PASS, 5 files / 12 tests.
  - `npm run build`: PASS.
  - `smoke:mvp5:mock`: PASS, 9 routes.
    - artifact: `/tmp/ontology-wave25-frontend-mvp5-mock-smoke/mvp5-mock-route-smoke.json`
    - `rawSecretPrinted: false`, `persistentViewsMaskedOnly: true`.
  - `smoke:mvp5:actual`: PASS, 9 API checks / 6 routes.
    - artifact: `/tmp/ontology-wave25-frontend-mvp5-actual-smoke/mvp5-actual-api-smoke.json`
    - `hasRawSecret: true`, `rawSecretPrinted: false`, `listMaskedOnly: true`.
  - `smoke:mvp3:actual`: PASS.
    - artifact: `/tmp/ontology-wave25-frontend-mvp3-actual-smoke/mvp3-actual-api-smoke.json`
  - `smoke:mvp4:actual`: PASS.
    - artifact: `/tmp/ontology-wave25-frontend-mvp4-actual-smoke/mvp4-actual-api-smoke.json`
- 실행하지 못한 검증:
  - MVP1/MVP2 actual frontend smoke는 Wave25 frontend script/seed command가 특정되지 않아 실행하지 않았다.
  - Docker/PostgreSQL Compose smoke는 기존 P1 environment follow-up으로 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 있음, Frontend DTO/client/mock only.
- 상세:
  - `OntologyPackageMetadata`, `OntologyExportJob`, `OntologyImportDryRunJob`, import compatibility/conflict/destructive DTO를 추가했다.
  - Actual client는 Backend Wave25 확정 shape를 우선 사용한다.
  - Draft/plural compatibility normalizer는 일부 남겨 두었지만 smoke는 단수형 actual endpoint를 검증한다.
  - Import dry-run response에 package metadata가 없을 때는 request package를 화면 metadata preview fallback으로 사용한다.
  - `mutation_applied`는 Frontend DTO에서 항상 `false`로 normalizing하여 dry-run-only UI를 보장한다.
- 영향받는 역할:
  - Backend: 추가 요청 없음. 현재 actual endpoints로 Frontend actual smoke PASS.
  - QA: `INT5-005`는 새 markers와 mock/actual smoke artifacts로 검증 가능.

## Blocker
- Frontend blocker: 없음.
- Actual smoke note:
  - Backend CORS가 `5173` origin 기준이라 actual-mode frontend는 `5173`에서 실행해야 한다. `5174`에서는 CORS로 route smoke가 실패했다.

## 남은 TODO
- QA가 `INT5-005`와 `INT5-009` 최종 판정을 수행한다.
- MVP1/MVP2 frontend actual regression이 필요하면 commander/QA가 실행 가능한 seed/script를 지정해야 한다.
- P1 standards import/export fidelity는 PM freeze대로 제외했다.

## 다른 역할에 전달할 내용
- PM:
  - Wave25 import는 dry-run only로 구현했고 apply/overwrite/publish mutation UI는 없다.
- Backend:
  - Frontend actual client/smoke는 확정 단수형 endpoints와 `{ mode, package }` request를 사용한다.
- Frontend:
  - Actual-mode local validation은 CORS 때문에 `http://127.0.0.1:5173` origin을 사용한다.
- QA:
  - Primary markers: `mvp5-import-export-panel`, `mvp5-import-dry-run-result`.
  - Additional markers: conflict/warning/destructive/rollback/confirmation/no-secret/audit markers.
  - Smoke artifacts are under `/tmp/ontology-wave25-frontend-mvp5-*`.

## 총괄에게 요청하는 결정
- 추가 결정 요청 없음.
- `INT5-005` Frontend side is ready for QA verification.

## 현재 판정
- PASS
