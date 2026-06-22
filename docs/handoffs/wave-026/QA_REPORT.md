# QA / Integration Report - Wave 26

## 담당 범위
- backlog ID:
  - `INT5-001`~`INT5-010`
  - Post-MVP5 cleanup verification
- 작업 경로:
  - `docs/handoffs/wave-026/QA_REPORT.md`
  - 검증 artifacts:
    - `/tmp/ontology-wave26-qa-openapi.json`
    - `/tmp/ontology-wave26-qa-mvp5-seed.json`
    - `/tmp/ontology-wave26-qa-mvp5-mock-smoke/mvp5-mock-route-smoke.json`
    - `/tmp/ontology-wave26-qa-mvp5-actual-smoke/mvp5-actual-api-smoke.json`
    - `/tmp/ontology-wave26-qa-mvp3-actual-smoke/mvp3-actual-api-smoke.json`
    - `/tmp/ontology-wave26-qa-mvp4-actual-smoke/mvp4-actual-api-smoke.json`
- 확인한 source 문서:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-026/NEXT_ORDERS.md`
  - `docs/handoffs/wave-026/PM_REPORT.md`
  - `docs/handoffs/wave-026/BACKEND_REPORT.md`
  - `docs/handoffs/wave-026/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-025/QA_REPORT.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`

## 완료한 작업
- Wave26 Backend cleanup을 독립 검증했다.
  - `_import_export.py` helper extraction은 `service.py` public facade
    `ontology_export()`, `ontology_import_dry_run()`,
    `current_ontology_package()` 뒤로 분리되어 있다.
  - endpoint route, DTO/schema names, enum values, dry-run-only boundary,
    response shape 변경 징후는 발견하지 못했다.
  - Backend MVP5/MVP4/MVP3/MVP1-style regression, ruff, OpenAPI export/parse가
    모두 PASS했다.
- Wave26 Frontend cleanup을 독립 검증했다.
  - `AdminPages.tsx`는 compatibility barrel로 유지되고 `router.tsx` import
    boundary와 exported page names가 유지된다.
  - page modules는 `apps/frontend/src/pages/admin/`로 분리되었고 global LNB는
    `Admin` 단일 entry 및 contextual project admin route 방식을 유지한다.
  - smoke marker sweep에서 MVP5 주요 `data-testid`가 유지됨을 확인했다.
  - import/export UI는 `Dry-run only`, `Import apply is not available in
    Wave26`, disabled apply placeholder, `mutation applied false` smoke
    evidence로 dry-run-only 의미를 유지한다.
- Frontend test/build/MVP5 mock smoke/MVP5 actual smoke를 재실행했다.
  - 최초 actual smoke는 QA가 frontend를 CORS 허용 범위 밖 포트 `5177`에
    띄워 `/admin` loading state에 머물렀고 FAIL했다.
  - root cause 확인 후 허용 포트 `5173`으로 재실행해 PASS했다.
  - 이 실패는 product regression이 아니라 QA runtime port 선택 문제로
    분류한다.
- MVP3/MVP4 actual smokes를 같은 seeded runtime에서 추가 실행했다.
- No-secret scan을 changed backend helper, frontend page modules, Wave26
  reports, fresh seed/OpenAPI/smoke JSON artifacts 대상으로 실행했다.
  - `raw_secret` 필드명, `RAW_SECRET_PLACEHOLDER`, masked display values는
    허용했다.
  - concrete raw-secret-looking violation은 0건이었다.
- QA-owned local servers를 사용했고 종료했다.
  - Mock frontend: `127.0.0.1:5176`, 종료 완료.
  - Initial actual frontend: `127.0.0.1:5177`, CORS 진단 후 종료 완료.
  - Backend: `127.0.0.1:8016`, 종료 완료.
  - Actual frontend: `127.0.0.1:5173`, 종료 완료.

## 변경 파일
- `docs/handoffs/wave-026/QA_REPORT.md`
- 수정하지 않음:
  - `apps/backend/`
  - `apps/frontend/`
  - `docs/api/`
  - `docs/backlog/`
  - `docs/handoffs/CURRENT_STATE.md`
  - PM/Backend/Frontend reports

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp5_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_project_ontology_api.py -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output /tmp/ontology-wave26-qa-openapi.json && python3 -m json.tool /tmp/ontology-wave26-qa-openapi.json >/tmp/ontology-wave26-qa-openapi.pretty.json`
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && MVP5_FRONTEND_BASE_URL=http://127.0.0.1:5176 MVP5_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave26-qa-mvp5-mock-smoke npm run smoke:mvp5:mock`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave26-qa-mvp5-seed.db .venv/bin/alembic upgrade head`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave26-qa-mvp5-seed.db .venv/bin/python scripts/seed_mvp5.py --output /tmp/ontology-wave26-qa-mvp5-seed.json`
  - `cd apps/frontend && MVP5_API_BASE_URL=http://127.0.0.1:8016 MVP5_FRONTEND_BASE_URL=http://127.0.0.1:5177 MVP5_SEED_JSON=/tmp/ontology-wave26-qa-mvp5-seed.json MVP5_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave26-qa-mvp5-actual-smoke npm run smoke:mvp5:actual`
  - `cd apps/frontend && MVP5_API_BASE_URL=http://127.0.0.1:8016 MVP5_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP5_SEED_JSON=/tmp/ontology-wave26-qa-mvp5-seed.json MVP5_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave26-qa-mvp5-actual-smoke npm run smoke:mvp5:actual`
  - `cd apps/frontend && MVP3_API_BASE_URL=http://127.0.0.1:8016 MVP3_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP3_SEED_JSON=/tmp/ontology-wave26-qa-mvp5-seed.json MVP3_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave26-qa-mvp3-actual-smoke npm run smoke:mvp3:actual`
  - `cd apps/frontend && MVP4_API_BASE_URL=http://127.0.0.1:8016 MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP4_SEED_JSON=/tmp/ontology-wave26-qa-mvp5-seed.json MVP4_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave26-qa-mvp4-actual-smoke npm run smoke:mvp4:actual`
  - marker/copy sweep with `rg` over `apps/frontend/src/pages/AdminPages.tsx`,
    `apps/frontend/src/pages/admin`, and `apps/frontend/src/pages/mvp5Shared.tsx`
  - no-secret scan over changed MVP5 backend/frontend/report files and fresh
    seed/OpenAPI/smoke JSON artifacts
- 결과:
  - Backend MVP5 focused tests: PASS, `10 passed`.
  - Backend MVP4 regression tests: PASS, `7 passed`.
  - Backend MVP3 regression tests: PASS, `4 passed`.
  - Backend MVP1-style project ontology regression: PASS, `11 passed`.
  - Backend ruff: PASS, `All checks passed!`.
  - OpenAPI export/parse: PASS.
    - artifact: `/tmp/ontology-wave26-qa-openapi.json`
    - OpenAPI `3.1.0`, version `0.1.0`, `116` paths, `261` schemas.
  - Frontend tests: PASS, 5 files / 12 tests.
  - Frontend build: PASS.
  - MVP5 mock smoke: PASS, 9 routes.
    - artifact: `/tmp/ontology-wave26-qa-mvp5-mock-smoke/mvp5-mock-route-smoke.json`
    - `rawSecretPrinted: false`, `persistentViewsMaskedOnly: true`.
  - Fresh SQLite Alembic + MVP5 seed: PASS.
    - artifact: `/tmp/ontology-wave26-qa-mvp5-seed.json`
  - MVP5 actual smoke first run on `5177`: FAIL due CORS/environment mismatch.
    - browser console showed `No Access-Control-Allow-Origin` for origin
      `http://127.0.0.1:5177`.
    - `/admin` remained loading; `mvp5-admin-shell` timeout was expected under
      blocked API fetches.
  - MVP5 actual smoke rerun on `5173`: PASS, 9 API checks / 6 routes.
    - artifact: `/tmp/ontology-wave26-qa-mvp5-actual-smoke/mvp5-actual-api-smoke.json`
    - `hasRawSecret: true`, `rawSecretPrinted: false`, `listMaskedOnly: true`.
  - MVP3 actual smoke: PASS.
    - artifact: `/tmp/ontology-wave26-qa-mvp3-actual-smoke/mvp3-actual-api-smoke.json`
    - 6 API checks / 5 routes.
  - MVP4 actual smoke: PASS.
    - artifact: `/tmp/ontology-wave26-qa-mvp4-actual-smoke/mvp4-actual-api-smoke.json`
    - 6 API checks / 5 routes.
  - Marker/copy sweep: PASS.
    - `mvp5-admin-shell`, admin scope, credential, policy, import/export,
      operations, retention/backup, audit markers are present.
    - Import/export copy continues to say dry-run only and import apply is not
      available.
  - No-secret scan: PASS.
    - Initial broad regex found only allowed placeholder/masked references:
      `RAW_SECRET_PLACEHOLDER`, `MASKED_SERVICE_ACCOUNT_...SVC1`,
      `MASKED_API_KEY_...RVKD`.
    - concrete raw-secret-looking violations after allowed placeholder/masked
      filtering: `0`.
- 실행하지 못한 검증:
  - Docker/PostgreSQL Compose smoke는 기존 P1 environment follow-up으로 실행하지
    않았다.
  - Full formal Playwright suite는 아직 P1 tooling follow-up이다.

## API/Enum/DTO 변경
- 변경 여부: 없음 by QA.
- 상세:
  - QA did not change API, enum, DTO, backend code, or frontend code.
  - Wave26 Backend helper extraction did not require route/schema/enum changes.
  - Wave26 Frontend page split did not change API client/types/queries, route
    paths, or mock fixtures.
- 영향받는 역할:
  - Backend: no corrective action required.
  - Frontend: Admin page split is accepted as the new structure.
  - PM/Commander: MVP5 P0 closeout remains intact.

## Blocker
- Blocking issue: 없음.
- Non-blocking note:
  - Actual frontend smokes should continue using CORS-allowed frontend port
    `5173` unless backend CORS config is intentionally expanded.

## 남은 TODO
- MVP5 P0: 없음 by QA.
- P1/P2 follow-ups remain unchanged:
  - Docker/PostgreSQL Compose smoke.
  - Broader formal Playwright suite.
  - Production SSO/OIDC, vault/KMS, secret rotation, full ABAC language,
    RDF/OWL/SHACL fidelity, distributed HA/DR, external write APIs.
- Wave27 candidate:
  - Use Wave27 for targeted implementation only if PM wants the next small
    cleanup slice, such as shared admin UI helpers or a narrow backend MVP5
    service-domain split with explicit OpenAPI comparison.
  - Avoid broad API client/type modularization and unified smoke harness until a
    dedicated refactor wave.

## 다른 역할에 전달할 내용
- PM:
  - MVP5 P0 remains closed after Wave26 cleanup.
  - Release/demo packaging is safe from QA perspective, with P1 tooling/env
    exceptions unchanged.
- Backend:
  - `_import_export.py` helper extraction is accepted as behavior-preserving.
  - Keep any further service decomposition targeted and OpenAPI-compared.
- Frontend:
  - Admin page split is accepted as structure.
  - Route exports, global LNB, smoke markers, import dry-run-only UI, and secret
    safety evidence were preserved.
- QA:
  - Reuse `/tmp/ontology-wave26-qa-*` artifacts for Wave26 evidence.
  - If actual smoke is rerun locally, use frontend `5173` with backend `8016` or
    another backend port that allows `5173` CORS.

## 총괄에게 요청하는 결정
- Recommendation: `RELEASE/DEMO PACKAGING`.
- Rationale:
  - MVP5 P0 closeout remains intact after post-closeout cleanup.
  - Backend and Frontend low-risk refactors are verified.
  - No targeted Wave27 hardening is required for the Wave26 changes.
  - Wave27 targeted implementation may proceed only if the commander chooses a
    narrow P1/P2 cleanup item; it is not required to protect MVP5 P0.

## 현재 판정
- PASS
