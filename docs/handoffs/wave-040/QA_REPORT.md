# QA Report - Wave 40

## 담당 범위
- backlog ID: `INT6-039` (backend runtime acceptance), `INT6-040` (frontend
  mock/API acceptance), `INT6-041` (no-mutation + reproducibility guard),
  `INT6-042` (Wave40 closeout recommendation).
- 작업 경로: independent verification only. Ran backend tests + a standalone
  reproducibility/no-mutation script + a standalone runtime-OpenAPI compare + FE
  test/build + mock & actual smokes. Updated
  `docs/backlog/INT6_4_GOLD_SET_AUTHORING_ACCEPTANCE.md` (R1–R12 verdicts) and
  this report. No `apps/`/`infra/` change.
- Verified the frozen freeze-on-pin rule, the 5 endpoint families, immutability
  409s, reproducibility, all-false guard, authz, import gate, regression — did
  NOT merely trust PM/Backend/Frontend reports.

## 완료한 작업 (independent verification)
- **INT6-039 Backend runtime — PASS.**
  - `pytest tests/test_mvp6_4_goldset_authoring_api.py -q` → `21 passed`.
  - `pytest tests/test_mvp6_evaluation_api.py -q` → `4 passed`.
  - `pytest -q` (full suite regression) → `77 passed`.
  - `ruff check app tests scripts` → `All checks passed!`.
  - Independent `app.openapi()` compare vs `openapi-mvp6-4-draft.json`: all 17
    MVP6.4 draft paths present in runtime (`missing=[]`); 7 enums literal-match
    (`GoldItemStatus`/`DatasetRevisionStatus`/`GoldAuthoringAction`(9)/
    `GoldSetImportCompatibility`/`GoldSetImportStrategy`/`RevisionFrozenReason`/
    `AuditTargetKind`); `GoldAuthoringMutationGuard` = 7 flags all `const/default:
    false`; `GoldEvidenceRef` 7 fields verbatim.
- **INT6-040 Frontend mock/API — PASS.**
  - `npm run test` → `Test Files 10 passed`, `Tests 43 passed` (incl. 12
    goldset mock-contract tests).
  - `npm run build` → CLEAN (`✓ built`).
  - `npm run smoke:mvp6:goldset:mock` (dev server booted mock mode) →
    `PASS`, 9 routes / 9 screenshots.
  - `npm run smoke:mvp6:goldset:actual` (backend booted on file-backed SQLite,
    `seed_mvp3` for the `project-corp-knowledge` row) → `PASS`, 12 API checks:
    authoring-overview, edit-gold-entity, archive-restore-gold-entity,
    activate-frozen-blocked (409 REVISION_FROZEN), run-pin-not-rewritten,
    cut-activate-revision, edit-on-frozen-revision-blocked (409
    GOLD_ITEM_IMMUTABLE), export-bundle, import-dry-run, import-confirm,
    import-incompatible-blocked (409 IMPORT_INCOMPATIBLE), non-owner-403 (403
    PERMISSION_DENIED).
  - Regression mock smokes with server up: `smoke:mvp6:mock` PASS,
    `smoke:mvp6:benchmark:mock` PASS (5 routes), `smoke:mvp6:learning:mock`
    PASS (6 routes).
- **INT6-041 no-mutation + reproducibility — PASS (independently, at data level).**
  - Standalone QA script (not the test file): captured original run pin
    `project-corp-knowledge-authoring-dataset-v1`, ran an edit + archive +
    restore + cut-and-activate battery, then re-read the pin → **UNCHANGED**;
    the pinned v1 stays `status=FROZEN`, `is_immutable=true` (old run resolves
    its exact immutable snapshot).
  - Same script inspected the SQLite DB after the flow: all 13
    candidate/publish/prompt/extraction/review tables (`candidate_entities`,
    `candidate_relations`, `candidate_corrections`, `candidate_evidence`,
    `extraction_jobs`, `prompt_templates`, `prompt_versions`, `publish_jobs`,
    `published_entities`, `published_relations`, `published_graph_versions`,
    `review_decisions`, `review_tasks`) = **0 rows**.
  - All-false 7-flag guard asserted on every mutating response (tests +
    standalone OpenAPI const check). No MVP6.1 field/enum renames: `git status`
    shows the evaluation module and `core/enums.py` unmodified; the goldset
    module imports MVP6.1 shapes verbatim.
- **INT6-042 closeout — recommend MVP6.4 thin closeout** (below).
- Updated `INT6_4_GOLD_SET_AUTHORING_ACCEPTANCE.md`: R1–R12 all **PASS** with
  per-gate QA evidence; header + verdict summary updated to the Wave40 runtime
  acceptance.

## R1–R12 Runtime Gate Verdicts
| Gate | Verdict | Basis |
|---|---|---|
| R1 5 endpoint families respond | PASS | 17/17 paths in runtime; actual smoke drove all 5 families |
| R2 DTO/enum align, no MVP6.1 rename | PASS | 7 enums + guard + GoldEvidenceRef verbatim; eval module untouched |
| R3 owner/admin-only, 403 non-owner | PASS | tests + actual smoke `non-owner-403` |
| R4 edit/archive/restore soft, no hard-delete | PASS | tests + actual smoke; row retained |
| R5 freeze-on-pin FROZEN transition | PASS | ACTIVE→FROZEN(PINNED_BY_RUN), vacated ACTIVE, 409s |
| R6 run pin never rewritten (reproducibility) | PASS | independent script: pin unchanged, v1 stays FROZEN |
| R7 GoldEvidence CRUD preserves ref fields | PASS | test_gold_evidence_crud; archive-not-delete |
| R8 export bundle clean, round-trips | PASS | no candidates/prompts/secrets; import dry-run |
| R9 import dry-run-first, INCOMPATIBLE blocked, no auto-merge | PASS | 4 compat states; 409 IMPORT_INCOMPATIBLE |
| R10 all-false guard + 0-row no-mutation | PASS | independent DB check 0 rows across 13 tables |
| R11 audit records every action, read-only | PASS | test_audit_log_records_actions |
| R12 MVP1–6.3 regression green, additive | PASS | 77 backend / 43 FE; router +2 lines |

## 변경 파일
- `docs/backlog/INT6_4_GOLD_SET_AUTHORING_ACCEPTANCE.md` — R1–R12 verdicts +
  Wave40 header/verdict.
- `docs/handoffs/wave-040/QA_REPORT.md` — this report.
- No `apps/`/`infra/` change (QA verification only).

## 실행/검증
- 실행한 명령 (backend, `apps/backend`, SQLite in-memory for tests):
  `pytest tests/test_mvp6_4_goldset_authoring_api.py -q` → `21 passed`;
  `pytest tests/test_mvp6_evaluation_api.py -q` → `4 passed`;
  `pytest -q` → `77 passed`; `ruff check app tests scripts` → clean;
  standalone `qa_indep.py` (reproducibility + 0-row no-mutation) and
  `qa_openapi.py` (runtime OpenAPI/enum/guard compare) both green.
- 실행한 명령 (frontend, `apps/frontend`): `npm run test` → `43 passed`;
  `npm run build` → clean; `smoke:mvp6:goldset:mock` PASS (9 routes);
  `smoke:mvp6:goldset:actual` PASS (12 checks, backend on file-backed SQLite);
  regression `smoke:mvp6:mock`/`benchmark:mock`/`learning:mock` PASS.
- No leftover listeners: 8000 and 5173 freed after validation (`lsof` empty).
- `git diff --check` → clean (exit 0).
- 실행하지 못한 검증: the UI-driving `*:actual` smokes (benchmark/learning/mvp6)
  were not re-run to green — they need the FE booted in `VITE_USE_MOCK_API=false`
  mode, a pre-existing environment precondition unrelated to this change. The
  goldset actual smoke is API-only by design and ran fully. Not an MVP6.4
  blocker (carry-over from earlier waves).

## Mock empty-state judgment (FE-flagged caveat)
- Confirmed **cosmetic, mock-only, non-blocking**. In mock mode the Gold Set
  Manager gold-item *list* renders empty because `useGoldEntities`/
  `useGoldRelations` (`queries.ts:555/577`) call the MVP6.1 evaluation client
  (`listGoldEntities`/`listGoldRelations`), which has no gold items for
  `dataset-corp-knowledge-gold`; the overview/revision/run-pin/import sections
  are populated from the goldset fixtures. The **actual** path is unaffected —
  the actual smoke edited/archived/restored the real seeded
  `...-gold-entity-1`. Verdict: acceptable for closeout; wiring the mock
  gold-item list to the goldset fixtures is a small Wave41 polish, not a
  contract or reproducibility issue.

## Regression
- Backend full suite `77 passed`, ruff clean; router change is +2 additive
  lines; evaluation module + `core/enums.py` untouched (no MVP6.1 rename;
  candidate/published separation intact — 0 rows in all candidate/published
  tables after the flow). FE `43 passed`, build clean, mvp6/benchmark/learning
  mock smokes PASS. Wave35–38 UI invariants intact per FE report (KO titles, D6
  badges, single active LNB, 0 horizontal overflow on the new gold-set route at
  all breakpoints); no new global LNB entry (route mounts contextually under
  Evaluation). Additive-only.

## API/Enum/DTO 변경
- 변경 여부: 없음 (QA verification only; no code change). Confirmed Backend/FE
  changes are additive with no MVP6.1 rename.
- 영향받는 역할: 없음.

## Blocker
- 없음.

## 남은 TODO (P1/P2, non-blocking)
- Mock gold-item list → goldset fixtures (cosmetic empty-state; Wave41 polish).
- Run the UI-driving `*:actual` smokes at the next FE-actual-mode gate.
- Durable DB/Alembic persistence for the goldset store (process-local accepted
  for the thin slice, same as MVP6.1/6.3).
- Pagination `limit`/`cursor` wired (contract accepts them; lists single-page).

## 다른 역할에 전달할 내용
- PM: freeze-on-pin FROZEN-transition rule implemented and verified exactly as
  frozen (no ACTIVE-but-immutable; vacated ACTIVE slot); scope unchanged.
- Backend: verified additive, run-pin immutable, all-false guard, 0-row
  no-mutation, OpenAPI aligned. No change requested.
- Frontend: mock empty-state judged cosmetic/non-blocking; actual path clean.
- QA: R1–R12 all PASS; recommend MVP6.4 thin closeout.

## 총괄에게 요청하는 결정
- MVP6.4 thin closeout approval. No commander decision otherwise required.

## 현재 판정
- **PASS — MVP6.4 Gold Set authoring + dataset revisioning thin slice CLOSEOUT.**
  R1–R12 all PASS (independently verified). Freeze-on-pin FROZEN transition +
  vacated ACTIVE, FROZEN/ARCHIVED 409 immutability, at-most-one-ACTIVE,
  owner/admin-only 403, import dry-run-first/INCOMPATIBLE-blocked/no-auto-merge,
  archive-not-delete, audit log, all-false guard, and — the load-bearing
  invariant — `EvaluationRun.dataset_version_id` never rewritten (old run
  resolves its exact FROZEN snapshot) all confirmed. Regression green, additive
  only, candidate/published separation intact, ports freed, `git diff --check`
  clean. Recommendation: **MVP6.4 thin closeout**; the mock gold-item empty-state
  is a cosmetic Wave41 follow-up, not a blocker.
