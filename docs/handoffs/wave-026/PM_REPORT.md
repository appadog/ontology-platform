# PM / Architecture / UX Review Report - Wave 26

## 담당 범위
- backlog ID:
  - `INT5-001`~`INT5-010`
  - Post-MVP5 usability/code-split/refactor review
- 작업 경로:
  - `docs/handoffs/wave-026/PM_REPORT.md`
- 확인한 source 문서:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-026/NEXT_ORDERS.md`
  - `docs/handoffs/wave-025/PM_REPORT.md`
  - `docs/handoffs/wave-025/BACKEND_REPORT.md`
  - `docs/handoffs/wave-025/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-025/QA_REPORT.md`

## 완료한 작업
- Wave25 QA closeout evidence를 PM 관점에서 공식 수용했다.
  - `INT5-001`~`INT5-010`은 모두 `PASS`로 수용한다.
  - `INT5-005` JSON ontology import/export는 export metadata/counts/audit,
    import dry-run compatible/conflict/warning/destructive states, invalid/apply
    rejection, non-mutation proof, mock smoke, actual smoke 근거로 closed로 본다.
  - `INT5-009` regression breadth는 backend MVP1-style/MVP3/MVP4 tests,
    frontend test/build, MVP2/MVP3/MVP4 actual smoke 근거로 closed로 본다.
  - Docker/PostgreSQL Compose smoke, broader Playwright suite, production
    SSO/OIDC, vault/KMS/rotation, full ABAC, RDF/OWL/SHACL fidelity,
    distributed HA/DR, external write APIs는 기존처럼 P1/P2 follow-up이다.
- MVP5 product P0 closeout 판정:
  - PM acceptance: `MVP5 P0 CLOSED`.
  - Closeout stability guard: Wave26 이후 변경은 additive cleanup 또는
    behavior-preserving split만 허용한다.
- Post-MVP5 improvement plan을 세 티어로 정리했다.

### P0 Safe Cleanup
- Frontend `AdminPages.tsx` split:
  - 844-line single file을 route/page 단위로 나눈다.
  - 우선 후보: `AdminConsolePage`, `AdminProjectsPage`, `ProjectAdminPage`,
    `ProjectAdminImportExportPage`, `ProjectAdminCredentialsPage`,
    `ProjectAdminApprovalPolicyPage`, `ProjectAdminOperationsPage`,
    `ProjectAdminRetentionBackupPage`.
  - Router export names and smoke markers must remain unchanged.
- Frontend admin mobile/tablet containment:
  - Admin table/list sections should keep stable overflow handling, readable
    scan order, and no horizontal document overflow.
  - Highest-value targets: credentials, import/export result rows, operations,
    retention/backup.
- Frontend copy consistency pass:
  - Standardize visible labels around `Dry-run`, `confirmation required`,
    `audit preview`, `read-only`, `masked`, and `no credential material`.
  - Do not add long instructional copy or new feature claims.
- Backend import/export helper extraction:
  - In `apps/backend/app/modules/mvp5/service.py` split pure helper blocks for
    ontology package building, import dry-run analysis, and fixture package
    construction into private helper modules or clearly bounded functions.
  - Keep public endpoint behavior and DTO names unchanged.
- Backend test/seed readability:
  - Split large MVP5 test fixture builders or package fixtures out of
    `tests/test_mvp5_api.py` only if existing focused tests remain identical.
  - `scripts/seed_mvp5.py` is small enough; no split needed in Wave26.
- Smoke script cleanup:
  - Document shared environment variables and artifact conventions for MVP2/3/4/5
    smokes.
  - Do not rewrite all smoke scripts in Wave26.

### P1 Product Polish
- Improve admin/import-export discoverability without changing IA:
  - Keep one global `Admin` LNB entry.
  - Keep `/projects/:projectId/admin/import-export` contextual.
  - Add clearer project admin card/tab ordering only if it preserves existing
    route and smoke markers.
- Improve import/export task flow:
  - Export summary, package safety preview, dry-run result, conflict/warning
    rows, rollback guidance, confirmation-required panel, and audit link should
    read as one task sequence.
  - No import apply, overwrite, publish, or mutation UI.
- Empty/loading/error polish:
  - Confirm every MVP5 admin route has loading, empty where relevant, and error
    states after the Wave25 import/export additions.
  - Use compact, operator-oriented copy.
- Shared admin UI helpers:
  - Extract repeated admin panels, metric grids, row tables, audit link rows, and
    status badge helpers only after page split is stable.
- Frontend `shared/api/client.ts` and `types.ts` modularization:
  - Move MVP5 normalizers/client methods/types into feature-owned admin files
    only after a small proof split passes test/build/smokes.
  - Avoid broad import churn in the same wave as page restructuring.

### P2 Larger Refactor
- Feature-owned API client architecture:
  - Split MVP2/MVP3/MVP4/MVP5 normalizers and endpoint clients into version or
    domain modules with a stable facade.
  - Requires broad regression smokes and likely Wave27+ ownership.
- Typed runtime parsing:
  - Consider shared schema validation for actual API normalizers after closeout
    packaging, not in Wave26.
- Backend MVP5 service package decomposition:
  - Split `schemas.py` by admin domain and `service.py` by feature area
    credentials/policy/import-export/ops/retention/audit.
  - Needs careful import stability and OpenAPI compare.
- Unified smoke harness:
  - Replace duplicated MVP2/MVP3/MVP4/MVP5 smoke setup, launch checks, route
    probing, and artifact writing with a common harness.
  - This is useful but can destabilize regression evidence; target a dedicated
    future wave.
- Formal Playwright suite and Docker/PostgreSQL Compose gate:
  - Keep as release/tooling track, not a Wave26 product cleanup task.

## Usability Review
- Admin/import-export discoverability and task flow:
  - Current IA is acceptable for closeout: global `Admin` remains stable and
    import/export is contextual under project admin.
  - Improvement should focus on local scan order and card/tab clarity, not new
    global navigation.
  - Import/export should be presented as export readiness first, package safety
    second, dry-run outcome third, and audit/rollback evidence last.
- Cross-MVP navigation consistency from project context:
  - Keep ID-bound project routes contextual through project screens,
    breadcrumbs, tabs, and cards.
  - Do not flatten MVP5 project admin detail routes into the global LNB.
- Dense admin pages on mobile/tablet:
  - Credential tables, import dry-run rows, operations jobs/DLQ, and retention
    snapshot sections are the highest risk for cramped scan order.
  - Prefer responsive table wrappers, compact row cards, and stable section
    spacing over redesign.
- Copy consistency:
  - Use the same terminology for dry-run, confirmation-required, audit preview,
    read-only, masked secret/material, and no credential material.
  - Avoid implying mutation for import; import remains dry-run only.
- Empty/loading/error states:
  - MVP5 routes already include basic loading/error coverage.
  - Wave26 frontend should verify import/export empty states and admin detail
    empty rows remain visible after any split.

## Code Split / Refactor Review
- Frontend:
  - `apps/frontend/src/pages/AdminPages.tsx`: 844 lines; good Wave26 split target
    because exported page boundaries are already clear.
  - `apps/frontend/src/shared/api/client.ts`: 2,787 lines; too risky for broad
    Wave26 rewrite. Only extract MVP5 normalizers if Frontend finishes page split
    with time and can run full smoke coverage.
  - `apps/frontend/src/shared/api/types.ts`: 1,975 lines; defer broad split to P1/P2
    because type import churn can affect all MVPs.
  - `apps/frontend/src/shared/mocks/mvp5Fixtures.ts`: 1,023 lines; P0 candidate
    only for pure fixture grouping if tests remain unchanged.
  - MVP5 smoke scripts are moderate size. Keep behavior stable; document common
    conventions before unifying code.
- Backend:
  - `apps/backend/app/modules/mvp5/schemas.py`: 811 lines; split by domain is
    useful but should follow a dedicated backend refactor plan.
  - `apps/backend/app/modules/mvp5/service.py`: 1,283 lines; extract pure
    import/export helper functions first because it is the clearest Wave26
    low-risk target.
  - `apps/backend/app/modules/mvp5/router.py`: 460 lines; not urgent unless helper
    extraction reveals obvious route grouping.
  - `apps/backend/tests/test_mvp5_api.py`: 503 lines; fixture extraction is safe
    if all assertions and test names remain.
  - `apps/backend/scripts/seed_mvp5.py`: 45 lines; no refactor needed.
- Duplication:
  - MVP2/MVP3/MVP4/MVP5 smoke scripts repeat base URL, seed path, artifact dir,
    route probes, and marker assertions. Keep this as P2 unified harness.
  - Frontend API normalizers repeat envelope/item unwrap and status fallback
    patterns. Keep broad normalization refactor out of Wave26 unless narrowly
    scoped to MVP5 import/export helpers.

## Recommended Wave26 Execution Scope
- Backend approved scope:
  - P0 safe cleanup only.
  - Extract MVP5 import/export pure helpers or test fixtures if the diff is small.
  - No public API/DTO/enum changes.
  - No OpenAPI shape changes except regeneration if mechanically required by
    touched router/schema files.
  - Required verification: MVP5 focused tests, MVP4 tests, MVP3 tests,
    MVP1-style project ontology tests, ruff, no-secret scan if MVP5 artifacts or
    reports change, `git diff --check`.
- Frontend approved scope:
  - P0 safe cleanup only.
  - Split `AdminPages.tsx` into focused page modules while preserving exports,
    routes, labels, data-testid smoke markers, and behavior.
  - Optionally tighten responsive containment and copy consistency on admin pages
    if the split remains small.
  - Do not split `client.ts`/`types.ts` broadly in Wave26.
  - Do not add import apply/overwrite/publish UI.
  - Required verification: `npm run test`, `npm run build`,
    `npm run smoke:mvp5:mock`; run `smoke:mvp5:actual` if backend runtime is
    available. Run MVP3/MVP4 actual smokes if shared client/router/layout changes.
- If Backend or Frontend cannot keep the diff behavior-preserving and quickly
  verifiable, they should stop at documentation-only review and propose a Wave27
  targeted refactor.

## 변경 파일
- `docs/handoffs/wave-026/PM_REPORT.md`
- 수정하지 않음:
  - `apps/backend/`
  - `apps/frontend/`
  - `docs/api/`
  - `docs/backlog/`
  - `docs/pm/`

## 실행/검증
- 실행한 명령:
  - `wc -l apps/frontend/src/pages/AdminPages.tsx apps/frontend/src/shared/api/client.ts apps/frontend/src/shared/api/types.ts apps/frontend/src/shared/mocks/mvp5Fixtures.ts apps/frontend/scripts/mvp5-mock-route-smoke.mjs apps/frontend/scripts/mvp5-actual-api-smoke.mjs`
  - `wc -l apps/backend/app/modules/mvp5/schemas.py apps/backend/app/modules/mvp5/service.py apps/backend/app/modules/mvp5/router.py apps/backend/tests/test_mvp5_api.py apps/backend/scripts/seed_mvp5.py`
  - `rg --files apps/frontend/scripts apps/backend/scripts | rg 'mvp(2|3|4|5)|smoke|seed|verify'`
  - `rg -n "function normalize|const normalize|normalize[A-Z]|to[A-Z].*Response|fetchJson|apiRequest|dry-run|Dry-run|Dry run|read-only|read only|no-secret|masked|audit|confirmation" apps/frontend/src/shared/api apps/frontend/src/pages/AdminPages.tsx apps/frontend/src/shared/mocks/mvp5Fixtures.ts apps/frontend/scripts apps/backend/app/modules/mvp5 apps/backend/scripts/seed_mvp5.py`
  - `git diff --check -- docs/handoffs/wave-026/PM_REPORT.md`
  - `git diff --no-index --check /dev/null docs/handoffs/wave-026/PM_REPORT.md`
  - `rg -n "(?i)(sk-[A-Za-z0-9_-]{12,}|api[_-]?key[=:][A-Za-z0-9_-]{12,}|password[=:][^[:space:]]+|token[=:][A-Za-z0-9_-]{12,}|secret[=:][A-Za-z0-9_-]{12,})" docs/handoffs/wave-026/PM_REPORT.md`
  - `rg -n "raw_secret|credential|secret|token|password|api key|API key|masked|no credential" docs/handoffs/wave-026/PM_REPORT.md`
- 결과:
  - Review inputs collected.
  - Runtime code was not modified.
  - `git diff --check`: PASS.
  - untracked-aware whitespace check: PASS.
  - secret-like regex scan: PASS, no matches.
  - broad term review: PASS. Matches are policy/review terms only, including
    `credentials`, `masked`, and `no credential material`.
- 실행하지 못한 검증:
  - Backend/Frontend runtime tests and smokes were intentionally not run because
    PM scope is documentation/review only.

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세:
  - PM report only.
  - No runtime code, OpenAPI artifact, API contract, enum, or DTO file changed.
- 영향받는 역할:
  - Backend: follow the approved low-risk backend cleanup scope only.
  - Frontend: follow the approved low-risk frontend page split/usability scope
    only.
  - QA: verify MVP5 P0 remains closed after any Wave26 implementation.

## Blocker
- PM blocker: 없음.
- Execution blocker:
  - Broad API client/type/schema/service decomposition is too risky for Wave26
    unless reduced to a small behavior-preserving proof.

## 남은 TODO
- Backend:
  - Execute or decline the approved P0 cleanup scope after reading this report.
- Frontend:
  - Execute or decline the approved P0 cleanup scope after reading this report.
- QA:
  - Re-run targeted verification based on actual Wave26 changed files.

## 다른 역할에 전달할 내용
- PM:
  - MVP5 P0 closeout is accepted as closed.
- Backend:
  - Prefer import/export helper or test fixture extraction. Do not touch public
    API semantics.
- Frontend:
  - Prefer `AdminPages.tsx` page split plus small responsive/copy polish. Keep
    admin IA stable and import dry-run only.
- QA:
  - Treat Wave26 as closeout-preserving cleanup. Any behavior/API drift should
    block PASS.

## 총괄에게 요청하는 결정
- Recommended commander decision:
  - Allow Wave26 Backend/Frontend to perform only the P0 safe cleanup listed
    above.
  - Defer broad client/type/schema/service decomposition and unified smoke
    harness to Wave27 or later.

## 현재 판정
- PASS
