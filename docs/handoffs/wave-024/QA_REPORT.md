# QA / Integration Report - Wave 24

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
  - MVP3/MVP4 regression guard
- 작업 경로:
  - `docs/handoffs/wave-024/QA_REPORT.md`
  - 검증 artifact:
    - `/tmp/ontology-wave24-qa-mvp5-mock-smoke/mvp5-mock-route-smoke.json`
    - `/tmp/ontology-wave24-qa-mvp5-actual-smoke/mvp5-actual-api-smoke.json`
    - `/tmp/ontology-wave24-qa-mvp5-openapi.json`

## 완료한 작업
- Wave24 PM/Backend/Frontend reports를 먼저 읽고 검증 기준을 확정했다.
- Gate 0 no-secret scan을 MVP5 docs/OpenAPI/frontend/report/seed/smoke artifacts 대상으로 재수행했다.
  - 허용 placeholder는 `ONE_TIME_SECRET_PLACEHOLDER_NOT_A_REAL_SECRET`만 인정했다.
  - `raw_secret`은 create response 계약 필드/설명 또는 boolean safety marker로만 확인됐다.
  - raw-secret-looking concrete value violation은 0건이었다.
- Backend Wave24 evidence를 재실행했다.
  - MVP5 focused API tests.
  - MVP4/MVP3 regression tests.
  - Backend ruff.
  - Actual OpenAPI export/parse/selected critical path and schema presence.
- Frontend Wave24 evidence를 재실행했다.
  - Vitest 전체.
  - Production build.
  - MVP5 mock route smoke.
  - MVP5 actual API smoke against commander-running servers.
- Commander-provided seed and smoke artifacts를 JSON parse로 확인했다.
- `INT5-001`~`INT5-010`별 PASS/PARTIAL 판정을 정리했다.

## 변경 파일
- `docs/handoffs/wave-024/QA_REPORT.md`
- 수정하지 않음:
  - `apps/backend/`
  - `apps/frontend/`
  - `docs/api/`
  - PM/Backend/Frontend reports

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool` equivalent parse for `docs/api/openapi-mvp5-draft.json`
  - commander seed/artifact JSON parse:
    - `/tmp/ontology-wave24-commander-mvp5-seed.json`
    - `/tmp/ontology-wave24-commander-mvp5-actual-smoke/mvp5-actual-api-smoke.json`
    - `/tmp/ontology-wave24-commander-mvp5-mock-smoke/mvp5-mock-route-smoke.json`
  - refined no-secret scan across MVP5 docs/OpenAPI/frontend scripts/fixtures/reports/seed/smoke artifacts
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp5_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output /tmp/ontology-wave24-qa-mvp5-openapi.json`
  - selected actual OpenAPI critical path/schema presence check
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/frontend && MVP5_FRONTEND_BASE_URL=http://127.0.0.1:5174 MVP5_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave24-qa-mvp5-mock-smoke npm run smoke:mvp5:mock`
  - `cd apps/frontend && MVP5_API_BASE_URL=http://127.0.0.1:8015 MVP5_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP5_SEED_JSON=/tmp/ontology-wave24-commander-mvp5-seed.json MVP5_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave24-qa-mvp5-actual-smoke npm run smoke:mvp5:actual`
- 결과:
  - Draft OpenAPI parse: PASS, OpenAPI `3.1.0`, version `0.5.0-draft`, `43` paths, `91` schemas.
  - Commander seed/artifact parse: PASS.
  - No-secret scan: PASS, 13 scanned surfaces, 0 concrete raw-secret-looking violations.
  - Backend MVP5 tests: PASS, `7 passed`.
  - Backend MVP4 regression tests: PASS, `7 passed`.
  - Backend MVP3 regression tests: PASS, `4 passed`.
  - Backend ruff: PASS, `All checks passed!`.
  - Actual OpenAPI export: PASS, OpenAPI `3.1.0`, `112` paths, `244` schemas.
  - Selected actual MVP5 critical paths/schemas: PASS, missing paths `[]`, missing schemas `[]`.
  - Frontend tests: PASS, `5` files / `12` tests.
  - Frontend build: PASS.
  - MVP5 mock smoke: PASS, `8` admin routes, `rawSecretPrinted: false`, `persistentViewsMaskedOnly: true`.
  - MVP5 actual smoke: PASS, `5` admin routes / `7` API checks, `hasRawSecret: true`, `rawSecretPrinted: false`, `listMaskedOnly: true`.
- 실행하지 못한 검증:
  - Backend server `/openapi.json` direct fetch returned `404`; QA used the repo export script for actual OpenAPI instead.
  - MVP1/MVP2 regression commands were not run in this QA pass.
  - Frontend `npm run smoke:mvp3:actual` and `npm run smoke:mvp4:actual` were not run in this QA pass; MVP3/MVP4 regression evidence is backend test based plus Wave24 MVP5 smoke.
  - Docker/PostgreSQL Compose smoke remains the existing P1 environment follow-up.

## INT5 판정
- `INT5-001` MVP5 Contract Review: PASS
  - Draft parses and actual exported OpenAPI contains selected implemented MVP5 critical paths/schemas.
  - Frontend mock/actual smoke aligns with the selected thin slice.
- `INT5-002` Authorization Matrix Review: PASS
  - Permission check API/UI smoke and denied/read-only admin states are covered by tests, mocks, and route smoke.
- `INT5-003` API Key and Service Account Safety Checklist: PASS
  - Create response one-time `raw_secret` existence is asserted without printing.
  - List/detail/persistent views remain masked; refined artifact scan found 0 concrete raw-secret-looking violations.
- `INT5-004` Automatic Approval Policy Safety Checklist: PASS
  - Dry-run, diff, blocked rows, and enforce-preview gate are covered in backend/frontend smoke.
- `INT5-005` Ontology Import and Export Acceptance Checklist: PARTIAL
  - JSON import/export was explicitly deferred as PM-approved narrower Wave24 scope.
  - No runtime/UI import-export surface was verified in this QA pass.
- `INT5-006` Operations, DLQ, Cost, and Observability Checklist: PASS
  - Operations dashboard, jobs, DLQ, cost, events, and observability selected paths are present and covered by smoke/tests.
- `INT5-007` Retention and Backup Governance Checklist: PASS
  - Retention policy, deletion dry-run, backup snapshots, and restore dry-run selected surfaces are covered.
- `INT5-008` Frontend Admin UX State Checklist: PASS
  - Mock smoke covers 8 admin routes and safety-critical markers; actual smoke covers selected actual API route set.
- `INT5-009` MVP1-MVP4 Regression Guard Plan: PARTIAL
  - MVP3 and MVP4 backend regression tests passed.
  - MVP1/MVP2 regression and MVP3/MVP4 frontend actual regression smokes were not rerun by QA.
- `INT5-010` Local Seed and Smoke Runnable Plan: PASS
  - Commander seed parses; QA mock and actual MVP5 smoke artifacts were regenerated successfully.

## API/Enum/DTO 변경
- 변경 여부: 없음 by QA.
- 상세:
  - QA did not change API, enum, DTO, backend code, or frontend code.
  - Verified existing Wave24 additive MVP5 runtime/API/UI surfaces as reported by Backend and Frontend.
  - Confirmed approved deviation: JSON import/export remains Wave25 TODO for this thin slice.
- 영향받는 역할:
  - Backend: maintain no-secret negative assertions and broaden OpenAPI compare in a later wave.
  - Frontend: keep actual client normalization aligned with Backend selected runtime paths.
  - PM/Commander: decide whether Wave25 closes JSON import/export or regression breadth first.

## Blocker
- Blocking issue: 없음.
- Non-blocking PARTIAL items:
  - `INT5-005` JSON import/export not implemented in Wave24.
  - `INT5-009` full MVP1-MVP4 actual regression matrix not rerun by QA.

## 남은 TODO
- Wave25 candidate:
  - Implement and verify JSON ontology import/export dry-run/export surfaces.
  - Run broader MVP1/MVP2/MVP3/MVP4 actual regression smokes if commander keeps servers available.
  - Expand actual OpenAPI comparison from selected critical MVP5 subset to broader MVP5 coverage.
  - Document actual OpenAPI serving path if `/openapi.json` is intentionally disabled or relocated on the running server.

## 다른 역할에 전달할 내용
- PM:
  - Wave24 is acceptable as a coherent MVP5 thin slice with two explicit PARTIAL follow-ups.
  - JSON import/export deferral should remain visible in Wave25 ordering.
- Backend:
  - Re-run evidence stayed PASS.
  - Direct server `/openapi.json` was not available to QA; export script evidence is PASS.
  - Keep `CredentialCreateResponse` as the only raw-secret contract surface.
- Frontend:
  - Re-run evidence stayed PASS.
  - QA regenerated mock and actual smoke artifacts under `/tmp/ontology-wave24-qa-mvp5-*`.
  - Actual smoke covered 5 route surfaces while mock smoke covered all 8 admin routes.
- QA:
  - Future QA should prioritize `INT5-005` and full regression breadth before MVP5 closeout.

## 총괄에게 요청하는 결정
- Wave25 우선순위 결정 요청:
  - Option A: close `INT5-005` JSON import/export runtime/UI first.
  - Option B: close `INT5-009` full MVP1-MVP4 actual regression matrix first.
  - QA recommendation: do both in Wave25 if time allows, but keep `INT5-005` as the first product-scope gap.

## 현재 판정
- PARTIAL
