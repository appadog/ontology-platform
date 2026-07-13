# Wave 56 QA Report — MVP6.12 Advanced Visualization (thin implementation)

Role: QA / Integration
Date: 2026-07-13
Backlog: `INT6-103`..`INT6-106`
Verdict: **PASS** (R1–R9 PASS) — recommend MVP6.12 thin closeout. **This closeout completes the user-directed MVP6 theme sequence (6.1–6.12).**

> Authoring note: the Wave56 BE and QA agents hit account session limits. The commander
> completed the BE `GraphVizPublishedVersionRef` name-scoping fix, drove the FE
> implementation to completion, and independently re-ran all deterministic validations
> (backend suite, viz suite, data-level no-mutation, ruff, OpenAPI, FE test/build,
> mock smoke against a booted dev server). This report + the R-series verdicts are
> commander-finalized from that evidence.

## Independent re-verification (commander-run)
```text
# Backend
.venv/bin/pytest tests/test_mvp6_12_graph_viz_api.py -q      -> 22 passed
.venv/bin/pytest -q  (full suite)                            -> 276 passed
.venv/bin/pytest -k "mutation or guard or data_level or empty or too_large or authz or byte" -> 9 passed
.venv/bin/ruff check app tests scripts                       -> All checks passed!
.venv/bin/pytest tests/test_mvp6_11_ontology_packs_api.py -q -> 25 passed (prior-theme regression)
app.openapi(): graph-viz path present; 6-flag guard; GraphVizPublishedVersionRef + MVP4 ref both clean
# Frontend
npm run test  -> 17 files, 116 passed (incl. graph-viz mock contract 8/8)
npm run build -> PASS (tsc app+node + vite)
npm run smoke:mvp6:graphviz:mock -> {"status":"PASS","routeCount":2,"screenshotCount":2}  (dev server booted on :5173)
git diff --check -> clean
```

## R1–R9 (see `INT6_12_ADVANCED_VIZ_ACCEPTANCE.md` for per-gate evidence)
- **R1** READY bounded nodes/edges + full summary, `truncated:false`, byte-stable modulo `generated_at` — PASS (`test_ready_summary_exact`, `test_ready_byte_stable_modulo_generated_at`).
- **R2** NO-MUTATION headline: all 6 guard flags false on every response (errors carry no guard); DATA-LEVEL before==after — PASS (`test_data_level_no_mutation`, `test_guard_all_false_on_every_response`, `test_error_envelopes_carry_no_guard`).
- **R3** summary counts exact in every status incl. TOO_LARGE_SUMMARY_ONLY; density directed / components undirected (G3) — PASS (`test_ready_summary_exact`, `test_too_large_summary_only`).
- **R4** over-cap → TOO_LARGE_SUMMARY_ONLY empty elements + `truncated:true` + exact totals + zero fabricated; invalid cap → 400 — PASS (`test_too_large_summary_only`, `test_too_large_filters_do_not_rescue`, `test_ready_becomes_too_large_when_cap_lowered`, `test_invalid_cap_400`).
- **R5** layout hints present, NO x/y, NO `hop` (G5) — PASS (`test_ready_bounded_view_layout_hints_no_xy_no_hop`, `test_openapi_node_has_hints_no_hop_no_xy`).
- **R6** EMPTY (no current published version) → 200 EMPTY zeroed; unknown version → 404 (G2 split) — PASS (`test_empty_no_version_200`, `test_unknown_version_404`, `test_known_version_id_targets_graph`).
- **R7** authz: viewer previews; non-member 403; unknown project 404 — PASS (`test_non_member_403`, `test_unknown_project_404`).
- **R8** FE viz sub-view of Published Graph (no new LNB item; single active LNB preserved): always-shown summary panel + READY client-side layout from hints + TOO_LARGE_SUMMARY_ONLY notice + EMPTY state + read-only class/relation filters + boundary banner + live all-false 6-flag guard proof; NO save-layout/apply/publish/snapshot/export CTA; mock smoke — PASS (FE 116 tests + build + `smoke:mvp6:graphviz:mock` PASS; smoke asserts H1 unchanged, single active LNB on both sub-views, banner/chips, 6-flag proof, exact summary, client-side render, no forbidden CTAs). `:actual` script ready (backend on SQLite) — not booted this session (P3, matches prior-theme actual-smoke deferral pattern).
- **R9** MVP1–MVP6.11 regression, additive-only, no renames of reused shapes — PASS (backend 276 + FE 116/build; packs 25; additive; only `GraphVizPublishedVersionRef` name-scoping, JSON unchanged).

R-Series OVERALL: **PASS.**

## Namespacing judgment
The module exports `GraphVizPublishedVersionRef` (fields identical to MVP4's
`PublishedGraphVersionRef`) to avoid the FastAPI component-name collision — JSON payload
unchanged, MVP4 schema intact. Same accommodation as MVP6.8/6.9/6.11. Acceptable.

## No-mutation / read-only verdict
Independently confirmed at the data level: a graph-viz read creates/updates/deletes
NOTHING (before==after across tables; no published version / snapshot created), the
6-flag `GraphVizMutationGuard` is all-false on every response, and there is no
server-side layout (no x/y emitted) or layout persistence. Candidate/published
separation and additive-only invariants intact; single active LNB preserved.

## blocker
None.

## 현재 판정
`PASS` — MVP6.12 thin closeout recommended. **The MVP6 theme sequence (6.1–6.12) is
COMPLETE.** Non-blocking P3: exercise `smoke:mvp6:graphviz:actual` against a booted
backend at the next integration gate (consistent with the packs actual-smoke deferral).
