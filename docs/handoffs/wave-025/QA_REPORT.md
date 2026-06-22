# QA / Integration Report - Wave 25

## 담당 범위
- backlog ID:
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
  - primary focus: `INT5-005`, `INT5-009`
- 작업 경로:
  - `docs/handoffs/wave-025/QA_REPORT.md`
  - 검증 artifacts:
    - `/tmp/ontology-wave25-qa-mvp5-seed.json`
    - `/tmp/ontology-wave25-qa-mvp5-openapi.json`
    - `/tmp/ontology-wave25-qa-mvp5-mock-smoke/mvp5-mock-route-smoke.json`
    - `/tmp/ontology-wave25-qa-mvp5-actual-smoke/mvp5-actual-api-smoke.json`
    - `/tmp/ontology-wave25-qa-mvp2-actual-smoke/mvp2-actual-api-smoke.json`
    - `/tmp/ontology-wave25-qa-mvp3-actual-smoke/mvp3-actual-api-smoke.json`
    - `/tmp/ontology-wave25-qa-mvp4-actual-smoke/mvp4-actual-api-smoke.json`

## 완료한 작업
- 지정된 Wave25 PM, Backend, Frontend 보고와 Wave24 QA 보고를 먼저 읽고
  `INT5-005` / `INT5-009` 판정 기준을 확정했다.
- Gate 0 no-secret scan을 changed MVP5 docs/OpenAPI/backend/frontend
  scripts/fixtures/reports 및 fresh seed/OpenAPI/smoke artifacts 대상으로
  재실행했다.
  - `raw_secret` 필드명과 create-response 존재 assertion은 허용했다.
  - masked placeholder와 `ONE_TIME_SECRET_PLACEHOLDER_NOT_A_REAL_SECRET`은
    허용했다.
  - concrete raw-secret-looking value violation은 0건이었다.
- Backend 재검증을 수행했다.
  - MVP5 focused API tests.
  - MVP4/MVP3 regression tests.
  - MVP1-style project ontology regression.
  - Ruff.
  - SQLite Alembic + MVP5 seed + JSON parse.
  - actual OpenAPI export + JSON parse.
  - selected import/export path/schema/enum compare.
- `INT5-005` JSON ontology import/export를 직접 검증했다.
  - export metadata/counts/audit 확인.
  - import dry-run compatible, conflict-blocked, warning/destructive 상태 확인.
  - invalid schema and apply-mode rejection은 backend focused test에서 확인.
  - before/after export package/count comparison으로 dry-run non-mutation 확인.
  - import/export payload에 raw credential material이 없음을 확인.
  - apply/overwrite/publish/mutation endpoint or UI가 없는 dry-run-only 경계를
    확인했다.
- Frontend 재검증을 수행했다.
  - Vitest 전체.
  - production build.
  - MVP5 mock route smoke.
  - MVP5 actual API smoke.
  - MVP2/MVP3/MVP4 actual regression smokes.
- QA-owned local servers를 사용했다.
  - Backend: `127.0.0.1:8015`.
  - Actual frontend: `127.0.0.1:5173`.
  - Mock frontend: `127.0.0.1:5175`.
- `INT5-001`~`INT5-010`을 전부 재분류했다.

## 변경 파일
- `docs/handoffs/wave-025/QA_REPORT.md`
- 수정하지 않음:
  - `apps/backend/`
  - `apps/frontend/`
  - `docs/api/`
  - PM/Backend/Frontend reports
  - `docs/handoffs/CURRENT_STATE.md`

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp5-draft.json`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp5_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_project_ontology_api.py -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave25-qa-mvp5-seed.db .venv/bin/alembic upgrade head`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave25-qa-mvp5-seed.db .venv/bin/python scripts/seed_mvp5.py --output /tmp/ontology-wave25-qa-mvp5-seed.json`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output /tmp/ontology-wave25-qa-mvp5-openapi.json`
  - selected actual-vs-draft import/export path/schema/enum compare.
  - direct import/export API probe against `127.0.0.1:8015`.
  - refined no-secret scan across 27 changed/generated surfaces and 5 smoke
    artifacts.
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && MVP5_FRONTEND_BASE_URL=http://127.0.0.1:5175 MVP5_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave25-qa-mvp5-mock-smoke npm run smoke:mvp5:mock`
  - `cd apps/frontend && MVP5_API_BASE_URL=http://127.0.0.1:8015 MVP5_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP5_SEED_JSON=/tmp/ontology-wave25-qa-mvp5-seed.json MVP5_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave25-qa-mvp5-actual-smoke npm run smoke:mvp5:actual`
  - `cd apps/frontend && MVP2_API_BASE_URL=http://127.0.0.1:8015 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP2_SEED_JSON=/tmp/ontology-wave25-qa-mvp5-seed.json MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave25-qa-mvp2-actual-smoke npm run smoke:mvp2:actual`
  - `cd apps/frontend && MVP3_API_BASE_URL=http://127.0.0.1:8015 MVP3_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP3_SEED_JSON=/tmp/ontology-wave25-qa-mvp5-seed.json MVP3_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave25-qa-mvp3-actual-smoke npm run smoke:mvp3:actual`
  - `cd apps/frontend && MVP4_API_BASE_URL=http://127.0.0.1:8015 MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP4_SEED_JSON=/tmp/ontology-wave25-qa-mvp5-seed.json MVP4_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave25-qa-mvp4-actual-smoke npm run smoke:mvp4:actual`
  - `git diff --check`
- 결과:
  - Draft OpenAPI parse: PASS, OpenAPI `3.1.0`, version `0.5.0-draft`, `45`
    paths, `103` schemas.
  - Backend MVP5 focused tests: PASS, `10 passed`.
  - Backend MVP4 regression tests: PASS, `7 passed`.
  - Backend MVP3 regression tests: PASS, `4 passed`.
  - Backend MVP1-style project ontology regression: PASS, `11 passed`.
  - Backend ruff: PASS, `All checks passed!`.
  - Fresh SQLite Alembic + MVP5 seed + JSON parse: PASS.
  - Actual OpenAPI export + JSON parse: PASS, OpenAPI `3.1.0`, `116` paths,
    `261` schemas.
  - Selected import/export actual-vs-draft compare: PASS.
    - missing actual paths: `[]`
    - missing draft paths: `[]`
    - missing actual schemas: `[]`
    - missing draft schemas: `[]`
    - enum mismatches: none for `GovernanceJobStatus`, `ImportConflictType`,
      `ImportConflictSeverity`, `ImportCompatibilityStatus`.
  - Direct export probe: PASS.
    - counts: classes `3`, properties `4`, relations `2`.
    - metadata includes `package_id`, `schema_version`, `project_id`,
      `ontology_version_id`, `counts`, `generated_at`, and `audit_event_ref`.
    - raw secret in export: `false`.
  - Direct import dry-run probe: PASS.
    - clean package: `COMPATIBLE`, no-op count `9`, confirmation not required.
    - conflict fixture: `BLOCKED`, conflict count `2`, confirmation required.
    - warning/destructive fixture: `WARNING`, warning count `1`, destructive
      impact count `3`, confirmation required.
    - dry-run non-mutation: before/after export counts and package were equal.
  - Frontend tests: PASS, 5 files / 12 tests.
  - Frontend build: PASS.
  - MVP5 mock smoke: PASS, 9 routes.
    - artifact: `/tmp/ontology-wave25-qa-mvp5-mock-smoke/mvp5-mock-route-smoke.json`
    - import/export route assertions: panel, dry-run result, export ready,
      conflict rows, warning rows, destructive impact, rollback guidance,
      confirmation required, audit link, no-secret preview.
    - `rawSecretPrinted: false`, `persistentViewsMaskedOnly: true`.
  - MVP5 actual smoke: PASS, 9 API checks / 6 routes.
    - artifact: `/tmp/ontology-wave25-qa-mvp5-actual-smoke/mvp5-actual-api-smoke.json`
    - import/export route assertions: panel, dry-run result, conflict rows,
      warning rows, destructive impact, rollback guidance, confirmation
      required.
    - `hasRawSecret: true`, `rawSecretPrinted: false`, `listMaskedOnly: true`.
  - MVP2 actual smoke: PASS.
    - artifact: `/tmp/ontology-wave25-qa-mvp2-actual-smoke/mvp2-actual-api-smoke.json`
    - covered dashboard/projects/source/profile/chunks/job/candidates/evidence
      routes plus mobile overflow checks.
  - MVP3 actual smoke: PASS.
    - artifact: `/tmp/ontology-wave25-qa-mvp3-actual-smoke/mvp3-actual-api-smoke.json`
    - covered review inbox/workbench, publish queue, published graph, quality.
  - MVP4 actual smoke: PASS.
    - artifact: `/tmp/ontology-wave25-qa-mvp4-actual-smoke/mvp4-actual-api-smoke.json`
    - covered quality, RAG candidate exclusion, graph safe-too-large,
      prompt performance, external read-only API.
  - No-secret scan: PASS.
    - 27 changed/generated source surfaces scanned.
    - 5 smoke artifacts scanned.
    - concrete raw-secret-looking violations: `0`.
  - `git diff --check`: PASS.
- 실행하지 못한 검증:
  - Docker/PostgreSQL Compose smoke는 기존 P1 environment follow-up으로
    실행하지 않았다.
  - MVP1 browser smoke는 별도 runnable command가 지정되어 있지 않아 실행하지
    않았다. 대신 `tests/test_project_ontology_api.py`로 MVP1-style backend
    project/ontology regression을 실행했고 PASS했다.

## INT5 판정
- `INT5-001` MVP5 Contract Review: PASS
  - Draft OpenAPI parses; actual OpenAPI contains selected implemented MVP5
    critical paths/schemas; Frontend mock/actual smoke aligns with actual API.
- `INT5-002` Authorization Matrix Review: PASS
  - Wave24 accepted authorization matrix remains passing through MVP5 focused
    tests and MVP5 mock/actual smoke.
- `INT5-003` API Key and Service Account Safety Checklist: PASS
  - One-time `raw_secret` existence is asserted without printing; list/detail
    remain masked; fresh source/artifact scan found 0 concrete violations.
- `INT5-004` Automatic Approval Policy Safety Checklist: PASS
  - Dry-run/enforce-preview gates remain covered by MVP5 tests and smoke; no
    ungated publish/mutation path was introduced.
- `INT5-005` Ontology Import and Export Acceptance Checklist: PASS
  - JSON export metadata/counts/audit are present.
  - Import dry-run covers compatible, blocked conflict, warning/destructive,
    invalid schema/apply rejection through tests and direct probes.
  - Non-mutation proof exists.
  - No apply/overwrite/publish/mutation endpoint or UI is present.
  - `/projects/:projectId/admin/import-export` passes mock and actual smoke.
- `INT5-006` Operations, DLQ, Cost, and Observability Checklist: PASS
  - Wave24 accepted surfaces remain covered by MVP5 tests/smoke; regression
    smoke did not expose a blocker.
- `INT5-007` Retention and Backup Governance Checklist: PASS
  - Retention deletion dry-run and backup restore dry-run surfaces remain
    covered by MVP5 tests/smoke; no mutation boundary regression found.
- `INT5-008` Frontend Admin UX State Checklist: PASS
  - MVP5 mock and actual route smokes cover 9 mock routes and 6 actual routes
    including import/export states and safety markers.
- `INT5-009` MVP1-MVP4 Regression Guard Plan: PASS
  - Backend MVP1-style, MVP3, MVP4 regression tests passed.
  - Frontend build/test passed.
  - MVP2, MVP3, and MVP4 actual smokes passed against the Wave25 seeded runtime.
  - Docker Compose remains P1 and not a product closeout blocker.
- `INT5-010` Local Seed and Smoke Runnable Plan: PASS
  - Deterministic seed, backend tests, OpenAPI export/parse, frontend mock and
    actual smoke, security scans, and regression smokes all passed.

## API/Enum/DTO 변경
- 변경 여부: 없음 by QA.
- 상세:
  - QA did not change API, enum, DTO, backend code, or frontend code.
  - Verified Backend/Frontend Wave25 additive import/export API and DTO work as
    reported.
- 영향받는 역할:
  - PM/Commander: can use this report as MVP5 P0 closeout evidence.
  - Backend/Frontend: no targeted hardening blocker from QA.

## Blocker
- Blocking issue: 없음.
- Accepted P1 follow-up:
  - Docker/PostgreSQL Compose smoke.
  - Broader formal Playwright suite.
  - Production SSO/OIDC, vault/KMS, secret rotation, full ABAC language,
    full RDF/OWL/SHACL fidelity, distributed HA/DR, external write APIs.

## 남은 TODO
- MVP5 P0: 없음 by QA.
- Post-closeout candidate:
  - Wave26 usability/code-split/refactor review may proceed after commander
    accepts MVP5 P0 closeout.
  - Keep no-secret scan in future waves whenever credential fixtures,
    screenshots, reports, or smoke artifacts change.

## 다른 역할에 전달할 내용
- PM:
  - `INT5-005` and `INT5-009` are PASS. MVP5 P0 closeout is supportable.
- Backend:
  - Import/export dry-run runtime passed direct and test evidence. No raw
    credential material was found in package/export/import artifacts.
- Frontend:
  - Mock and actual smoke passed for `/projects/:projectId/admin/import-export`
    and regression smokes stayed green on `5173`.
- QA:
  - Future QA can reuse `/tmp/ontology-wave25-qa-*` artifacts as closeout
    evidence, but should regenerate if code changes.

## 총괄에게 요청하는 결정
- Recommendation: `MVP5 P0 CLOSEOUT RECOMMENDED`.
- No Wave26 targeted hardening is required for MVP5 P0.

## 현재 판정
- PASS
