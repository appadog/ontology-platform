# Frontend Report - Wave 40

## 담당 범위
- backlog ID: `FE6-053` (route/IA + types/client/mocks), `FE6-054` (authoring UI:
  edit/archive + GoldEvidence), `FE6-055` (revision lifecycle + export/import UI),
  `FE6-056` (mock + actual smoke).
- 작업 경로: `apps/frontend/` only (additive). New Gold Set Manager UI, types/
  client/queries/mocks, smoke scripts, a mock contract test, and a responsive
  re-check route. No backend/contract change.
- Scope: finished the interrupted Wave40 FE task — added the missing smoke
  scripts, the responsive re-check, the optional mock contract test, reconciled
  FE types vs the actual Backend module, and validated end-to-end. The working
  UI (page + fixtures + router/types/client/queries wiring) was verified, not
  rewritten.

## 완료한 작업
- **FE6-053 (route/IA + types/client/mocks) — verified, contract-reconciled.**
  Route `/projects/:projectId/evaluation-datasets/:datasetId/gold-set` mounts
  `GoldSetManagerPage` contextually under Evaluation (no global LNB entry); entry
  link "정답셋 관리" added on `EvaluationDatasetsPage`. Confirmed every MVP6.4
  type in `src/shared/api/types.ts` matches `goldset_authoring/schemas.py` field-
  for-field: 7 enums (`GoldItemStatus`, `DatasetRevisionStatus`,
  `GoldAuthoringAction`, `GoldSetImportCompatibility`, `GoldSetImportStrategy`,
  `RevisionFrozenReason`, target-kind), the all-false 7-flag
  `GoldAuthoringMutationGuard`, `GoldAuthoringCapabilities` (can_view + 6),
  mutation envelopes (`gold_*`/`audit_entry`/`mutation_guard`/`capabilities`;
  revision env adds `revision`/`dataset`/`frozen_revision_id`), `RunRevisionPin`
  (`run_id`/`dataset_version_id`/`revision_status`/`pin_immutable`),
  `GoldSetExportBundle`, `GoldSetImportReport`/`Confirm*`. Client paths match the
  Backend router exactly (PATCH gold-entities/relations, `/archive` `/restore`,
  `/gold-evidence`, `/revisions`, `/dataset-revisions/{id}` `/activate`
  `/export`, `/gold-set-imports` `/confirm`, `/authoring`, `/authoring-audit`).
  **No real mock/type drift found** — the page builds against the frozen
  contract and the DTO names match the BE module, not just the draft. The only
  nominal difference is the FE-internal type name `GoldAuthoringTargetKind` vs
  the BE enum `AuditTargetKind`; the wire **values** are identical
  (`GOLD_ENTITY`/`GOLD_RELATION`/`GOLD_EVIDENCE`/`DATASET_REVISION`/`DATASET`),
  so there is no contract drift to fix.
- **FE6-054 (authoring UI) — verified.** Gold item edit / soft-archive / restore
  + standalone Gold Evidence rendering, owner-only via capability hint
  (non-owner read-only band), FROZEN/ARCHIVED → read-only + immutable banner,
  loading/empty/error states. Every authoring action surfaces the non-mutating
  safety notice; no publish/enforce/auto-merge copy.
- **FE6-055 (revision lifecycle + export/import) — verified.** Revision table
  DRAFT/ACTIVE/FROZEN/ARCHIVED with D6 badges + "데이터셋당 ACTIVE는 1개",
  freeze-reason badge, run-pin reproducibility section (each run shows its pinned
  FROZEN revision + `pin_immutable`), export to JSON bundle, import honest dry-
  run-before-confirm across all four compatibility states (INCOMPATIBLE blocks /
  no confirm; WARNING needs ack; CONFLICT explicit no-auto-merge), confirm-with-
  strategy.
- **FE6-056 (mock + actual smoke) — added.**
  - `npm run smoke:mvp6:goldset:mock` (`scripts/mvp6-goldset-mock-route-smoke.mjs`)
    — route + render smoke following the existing mock-smoke pattern; drives the
    P0 loop (overview → run-pin reproducibility → gold items + revision lifecycle
    → import dry-run for all 4 states → confirm → audit). 9 routes, 9 screenshots.
  - `npm run smoke:mvp6:goldset:actual`
    (`scripts/mvp6-goldset-actual-api-smoke.mjs`) — boots against the running
    backend (SQLite) and asserts the P0 flow + invariants at the API level:
    dry-run import, freeze-on-pin/immutability (409), run-pin-not-rewritten,
    all-false mutation guard, INCOMPATIBLE-blocked, and 403 for a non-owner.
  - Both registered in `package.json`.
- **Optional mock contract test (non-blocking).** `mvp6GoldsetMock.test.ts`
  (12 tests) — overview owner caps + all-false guard, run-pin reproducibility,
  edit/archive (soft) / 404, evidence XOR-target guard, revision cut/activate +
  freeze-on-activate, activate-non-DRAFT 409, export bundle shape (no
  candidates/published), all-four import compat states, confirm creates a NEW
  revision + INCOMPATIBLE blocked, list round-trips.
- **Responsive re-check.** Added the Gold Set Manager route to
  `scripts/wave35-responsive-check.mjs`; 0 horizontal overflow at every
  breakpoint (screenshots to scratchpad only).

## 변경 파일
- `apps/frontend/src/pages/GoldSetManagerPage.tsx` (verified; one prior commander
  fix already applied — not re-touched).
- `apps/frontend/src/shared/mocks/mvp6GoldsetFixtures.ts` (verified).
- `apps/frontend/src/app/router.tsx`,
  `apps/frontend/src/pages/EvaluationDatasetsPage.tsx`,
  `apps/frontend/src/shared/api/{client,queries,types}.ts` (verified).
- `apps/frontend/scripts/mvp6-goldset-mock-route-smoke.mjs` (new).
- `apps/frontend/scripts/mvp6-goldset-actual-api-smoke.mjs` (new).
- `apps/frontend/src/shared/api/mvp6GoldsetMock.test.ts` (new).
- `apps/frontend/scripts/wave35-responsive-check.mjs` (added gold-set route).
- `apps/frontend/package.json` (added `smoke:mvp6:goldset:mock` / `:actual`).

## 실행/검증
- `cd apps/frontend && npm run test` → **`Test Files 10 passed (10)`,
  `Tests 43 passed (43)`** (was 31; +12 new goldset contract tests).
- `cd apps/frontend && npm run build` → **CLEAN** (tsc app + node typecheck +
  vite build `✓ built`; no TS errors).
- `npm run smoke:mvp6:goldset:mock` →
  `{ "status": "PASS", "routeCount": 9, "screenshotCount": 9 }`.
- `npm run smoke:mvp6:goldset:actual` → **RAN, PASS** (backend booted on SQLite:
  `DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave40-goldset.db ... uvicorn
  app.main:app --port 8000`, tables created, seed project
  `project-corp-knowledge` inserted so the overview endpoint resolves).
  `{ "status": "PASS", "apiCheckCount": 12 }`. The 12 checks:
  - `authoring-overview`: active `...-v2`, pinned run
    `project-corp-knowledge-eval-run-pinned-v1`, `pin_immutable=true`.
  - `edit-gold-entity`: action EDIT, guard all-false.
  - `archive-restore-gold-entity`: ARCHIVED → ACTIVE (soft, never deleted).
  - `activate-frozen-blocked`: **409 REVISION_FROZEN**.
  - `run-pin-not-rewritten`: FROZEN `...-v1` still `pinned_run_count=1` after
    authoring (run pin intact).
  - `cut-activate-revision`: new `...-v3` ACTIVE; prior ACTIVE `...-v2` frozen.
  - `edit-on-frozen-revision-blocked`: **409 GOLD_ITEM_IMMUTABLE**.
  - `export-bundle`: no candidates/published fields, all-false guard.
  - `import-dry-run`: COMPATIBLE, strategies [CREATE_NEW_DATASET,
    NEW_REVISION_OF_EXISTING].
  - `import-confirm`: created a NEW DRAFT revision, all-false guard.
  - `import-incompatible-blocked`: **409 IMPORT_INCOMPATIBLE**.
  - `non-owner-403`: **403 PERMISSION_DENIED**.
- Existing smokes (no regression): `smoke:mvp6:mock` PASS,
  `smoke:mvp6:benchmark:mock` PASS (5 routes), `smoke:mvp6:learning:mock` PASS
  (6 routes).
- Responsive (label `wave40-goldset`, route `gold-set-manager`):
  1920×1080 / 1440×900 / 1366×768 / 1280×800 / 1024×768 / 768×1024 →
  **overflowX=0 on every breakpoint; "RESULT: 0 horizontal overflow on all
  routes/resolutions"** (ontology-modeler + candidate-results also still 0).
- No-regression spot checks on touched routes: KO titles intact (정답셋 관리,
  활성 리비전, 정답 항목, 리비전, 가져오기), D6 status badges intact
  (ACTIVE·활성 / FROZEN / ARCHIVED·보관됨), single active LNB (Evaluation context;
  no new global LNB item).
- `git diff --check` → **clean (exit 0)**.
- No leftover listeners: ports 5173 and 8000 freed after validation.
- 실행하지 못한 검증: the existing `smoke:mvp6:benchmark:actual` /
  `:learning:actual` / `mvp6:actual` UI-driving smokes were NOT run to green —
  they require the **frontend** booted in actual-API mode
  (`VITE_USE_MOCK_API=false`) pointed at the backend, a pre-existing environment
  precondition unrelated to this change (their API-only portion completes; only
  the live-API UI heading step times out under the default mock dev server).
  The new goldset actual smoke is API-only by design and ran fully.

## API/Enum/DTO 변경
- 변경 여부: **없음 (no new/renamed API path, DTO, or enum on any existing
  surface).** All work is additive FE consumption of the already-frozen MVP6.4
  contract; MVP6.1 evaluation types reused verbatim (no rename). No change to
  existing MVP1–MVP6.3 FE surfaces.
- 상세: FE types verified to mirror the Backend module 1:1; no field/enum edited.
- 영향받는 역할: QA (`INT6-040` FE mock/API acceptance).

## Blocker
- 없음.

## 남은 TODO
- In mock mode the Gold Set Manager's gold-item *list* renders the empty state
  for the seeded dataset because `useGoldEntities`/`useGoldRelations` read the
  MVP6.1 evaluation client (which has no gold items for
  `dataset-corp-knowledge-gold`), while the goldset overview/revision/run-pin/
  import sections are fully populated from the goldset fixtures. The empty state
  is an honest, intended state; wiring the mock gold-item list to the goldset
  fixtures (so the table shows the 3 seeded entities) is a small additive polish
  for a later wave — not contract-affecting. The actual-API path is unaffected
  (the backend serves real gold items).
- Pagination (`limit`/`cursor`) is accepted by the contract but lists are single-
  page in the thin slice (mirrors Backend).

## 다른 역할에 전달할 내용
- PM: scope unchanged; FROZEN-transition freeze-on-pin and the all-false guard
  are reflected in the UI exactly as frozen (no ACTIVE-but-immutable).
- Backend: contract consumed verbatim; no change requested. The actual smoke
  confirms the documented 409 codes (`REVISION_FROZEN`, `GOLD_ITEM_IMMUTABLE`,
  `IMPORT_INCOMPATIBLE`), 403 `PERMISSION_DENIED`, all-false guard, and run-pin-
  not-rewritten at the data level.
- Frontend: n/a.
- QA: to reproduce the actual smoke — create the SQLite DB +
  `Base.metadata.create_all`, boot `uvicorn app.main:app --port 8000`, insert a
  `project-corp-knowledge` Project row (the goldset store seeds its dataset under
  that fixed id), then `npm run smoke:mvp6:goldset:actual`. For the UI-driving
  actual smokes (benchmark/learning/mvp6), boot the FE with
  `VITE_USE_MOCK_API=false`. Mock acceptance needs only `npm run
  smoke:mvp6:goldset:mock` + `npm run test`.

## 총괄에게 요청하는 결정
- 없음.

## 현재 판정
- **PASS** — FE6-053..056 complete. `npm run test` 43/43, `npm run build` clean,
  `smoke:mvp6:goldset:mock` PASS (9 routes), `smoke:mvp6:goldset:actual` RAN +
  PASS (12 API checks incl. freeze-on-pin 409s, run-pin-not-rewritten, all-false
  guard, INCOMPATIBLE-blocked, 403), existing mock smokes PASS, responsive 0
  horizontal overflow at 1440/1366/1280/768, no KO-title / D6-badge / single-LNB
  regression, `git diff --check` clean, additive-only with no API/Enum/DTO change
  to existing surfaces.
