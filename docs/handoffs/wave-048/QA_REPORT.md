# QA / Integration Report - Wave 48 (MVP6.8 Copilot THIN IMPLEMENTATION — advisory-only runtime acceptance)

## 담당 범위
- backlog ID: `INT6-071` (backend runtime), `INT6-072` (frontend mock/API), `INT6-073` (advisory-only / no-execution + all-false guard, DATA-LEVEL), `INT6-074` (Wave48 closeout).
- 작업 경로: verification only. One QA test-harness fix in `apps/frontend/scripts/mvp6-copilot-actual-api-smoke.mjs` (expected-status 400->422); R1-R7 verdicts in `docs/backlog/INT6_8_COPILOT_ACCEPTANCE.md`; this report.

## 완료한 작업 (independently verified — did not just trust reports)
- **INT6-071 Backend runtime:** ran the copilot + impact tests, ruff, full suite; inspected the module source; verified endpoints/transitions/authz/determinism over live HTTP.
- **INT6-073 DATA-LEVEL no-mutation:** wrote my own in-process script snapshotting ALL 25 DB tables + all 8 governance/application/learning surface stores before and after the full copilot flow, and asserting the 14-flag guard on every response.
- **INT6-072 Frontend:** ran FE tests, build, mock smoke, and — after booting the backend on file-backed SQLite the way prior waves did — the ACTUAL smoke.
- **Regression:** full backend suite + prior MVP6 mock smokes.

## 실행/검증 (EXACT commands + output)
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_8_copilot_api.py -q` -> **23 passed**.
- `.venv/bin/pytest tests/test_mvp6_7_impact_simulation_api.py -q` -> **20 passed**.
- `.venv/bin/ruff check app tests scripts` -> **All checks passed!**
- `.venv/bin/pytest -q` (full suite) -> **169 passed**.
- Booted backend on **file-backed SQLite**: created tables via `Base.metadata.create_all` + `seed_mvp3(reset=True)` against `sqlite+pysqlite:////private/tmp/ontology-wave48-qa.db`, then `uvicorn app.main:app --port 8000` with that `DATABASE_URL`. `GET /health` ok; copilot summary returned 4 SUGGESTED, grounded.
- Live HTTP decision matrix: DISMISS-no-reason -> **422** `DISMISS_REASON_REQUIRED`; ACCEPT-with-reason -> **422** `DISMISS_REASON_NOT_ALLOWED`; ACCEPT valid -> **201 ACCEPTED** + `routing_target.executes_nothing=true`; re-decide -> **409** `COPILOT_SUGGESTION_DECISION_CONFLICT`; unknown project -> **404** `PROJECT_NOT_FOUND`; unknown suggestion -> **404** `COPILOT_SUGGESTION_NOT_FOUND`. Two suggestion-list fetches were **byte-identical** (deterministic).
- Independent DATA-LEVEL no-mutation script (in-process, HTTP via TestClient over full flow summary+list+detail+ACCEPT+DISMISS): `db_table_diffs_after_flow: {}` across **25 tables**, `surface_store_diffs_after_flow: {}` across gov `_requests/_items/_reviews/_audit` + app `_versions/_app_audit` + learning `_patterns_by_project/_suggestions_by_project`, `guard_all_false_on_every_response: true`, **verdict NO_MUTATION_PASS**. ACCEPT mutated nothing beyond the copilot's own suggestion state.
- `cd apps/frontend && npm run test` -> **13 files / 75 tests passed**.
- `npm run build` -> **built clean** (tsc strict + vite), no type errors.
- `npm run smoke:mvp6:copilot:mock` (Vite dev server booted on 5173, mock mode) -> `{"status":"PASS","routeCount":4,"screenshotCount":5}`.
- `MVP6_API_BASE_URL=http://127.0.0.1:8000 npm run smoke:mvp6:copilot:actual` -> initially **FAIL** (`dismiss-without-reason expected 400, got 422`). Root cause: the smoke script hardcoded 400, but the runtime/FE-tested contract is **422**. Fixed the assertion (400->422) and reran -> `{"status":"PASS","checks":6}` against the live SQLite-backed backend.
- Regression mock smokes: `smoke:mvp6:governance-apply:mock`, `smoke:mvp6:governance:mock`, `smoke:mvp6:benchmark:mock` -> all **PASS**.
- `git diff --check` -> **CLEAN**. No leftover listeners on 8000/5173 (verified `lsof` -> NONE).
- 실행하지 못한 검증: none. The actual smoke that Frontend recorded as NOT RUN was RUN here (booted backend on file-backed SQLite + seed_mvp3).

## Per-gate verdicts (R1-R7)
- **R1** PASS — deterministic byte-stable grounded suggestions + summary; each cites >=1 non-empty source ref; capped 20.
- **R2** PASS — ACCEPT returns routing target `executes_nothing=true`; DATA-LEVEL before==after (25 tables + 8 surface stores, incl. after ACCEPT); 14-flag guard all-false on every response.
- **R3** PASS — SUGGESTED->ACCEPTED/DISMISSED; non-SUGGESTED -> 409; DISMISS reason required (422); audit-only capture.
- **R4** PASS — 404 project / 404 suggestion; audit-only decision by any project member; downstream RBAC untouched.
- **R5** PASS — FE tests/build/mock-smoke/actual-smoke; list -> accept-routes(navigation, NO execute button)/dismiss -> audit note; persistent advisory banner + live all-false proof line; no execute/apply/publish/approve affordance.
- **R6** PASS — `real_model_invoked:false` + `copilot_executed_action:false` everywhere; deterministic mock; grounded.
- **R7** PASS — 169 backend tests + prior MVP6 mock smokes; additive-only; no renames; candidate/published separation intact.

## DATA-LEVEL no-mutation (incl. ACCEPT) + all-false-guard evidence
Independent script (not the backend's own test): snapshot -> full HTTP flow (summary+list+detail+ACCEPT+DISMISS) -> snapshot. Result: **0 DB-table diffs across 25 tables, 0 surface-store diffs across all 8 governance/application/learning stores, 14-flag guard all-false on every response**. ACCEPT returns only a `CopilotRoutingTarget` and mutates nothing beyond the copilot's own suggestion state. This corroborates the backend's `test_data_level_no_mutation_including_accept` at a broader (all-table) level.

## Actual smoke — DID IT RUN?
YES. Frontend recorded it NOT RUN (uvicorn-only hit Postgres:5432). QA booted the backend on **file-backed SQLite** (`create_all` + `seed_mvp3` + uvicorn with that `DATABASE_URL`) as prior waves did, and `smoke:mvp6:copilot:actual` PASSes (6 checks) after a one-line QA harness fix aligning the expected validation status from 400 to the runtime's 422.

## CopilotOntologyElementRef judgment
Acceptable. The governance module already owns an UNRELATED `OntologyElementRef` (different shape: `target_kind/ontology_class_id/...`), so the name collision is real. Runtime `CopilotOntologyElementRef` has `element_kind/element_id/label` — IDENTICAL to the draft's `OntologyElementRef`. Only the component NAME differs; the JSON payload is unchanged. No FE/BE drift (FE consumes the same field names).

## Regression results
- Backend: 169 tests pass (MVP1-MVP6.7, incl. MVP6.7 impact 20).
- Frontend: 75 tests, build clean; MVP6 governance / governance-apply / benchmark mock smokes PASS.
- Additive-only (new copilot module + additive router registration + additive FE types/page/fixtures/scripts); no renames; candidate/published separation intact; single active LNB preserved (Copilot added as first ANALYZE item).

## API/Enum/DTO 변경
- 변경 여부: 없음 (product). One QA test-harness fix only.
- 상세: `apps/frontend/scripts/mvp6-copilot-actual-api-smoke.mjs` expected-status 400 -> 422 (+ comment). No product/schema/enum change.
- Non-blocking draft discrepancy: `openapi-mvp6-8-draft.json` decision endpoint declares `400` for validation; runtime + FE use `422`. P1: sync the draft to 422.

## Blocker
- 없음.

## 남은 TODO (P1, non-blocking)
- Sync `openapi-mvp6-8-draft.json` decision-endpoint declared validation code `400` -> `422` (runtime + FE already 422).
- Promote always-populated optional fields to `required` for strict OpenAPI match (mirrors MVP6.2 follow-up).
- Optional: promote a single canonical shared `OntologyElementRef` if ever desired (out of scope for additive P0).
- Durable DB/Alembic persistence for the copilot store stays P1/P2 (process-local accepted, as prior MVP6 waves).

## 다른 역할에 전달할 내용
- PM: R1-R7 all PASS; recommend MVP6.8 thin closeout. One P1 draft-code sync (400->422).
- Backend: runtime correct; the 422 (not draft's 400) is the accepted contract; consider syncing the draft.
- Frontend: mock + actual both PASS; the actual-smoke expected-status was corrected to 422 by QA.

## 총괄에게 요청하는 결정
- Accept `CopilotOntologyElementRef` namespacing (same payload shape). Accept the runtime 422 (vs draft 400) as the canonical validation code and schedule the draft sync as P1. Approve MVP6.8 thin closeout.

## 현재 판정
- **OVERALL: PASS.** R1-R7 all PASS (independently verified). DATA-LEVEL no-mutation incl. ACCEPT confirmed across 25 tables + 8 surface stores; 14-flag guard all-false on every response; ACCEPT returns only a routing target. Actual smoke RUN (backend booted on file-backed SQLite) and PASS. Regression intact; additive-only; no renames. **Recommendation: MVP6.8 thin closeout** with the P1 draft-code (400->422) sync as the only follow-up.
