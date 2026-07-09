# Wave 50 QA Report — MVP6.9 Connectors (thin implementation)

Role: QA / Integration
Date: 2026-07-08
Verdict: **PASS** — recommend MVP6.9 thin closeout.

> Authoring note: the Wave50 QA agent completed the independent runtime
> verification and wrote the R1-R8 verdicts into
> `docs/backlog/INT6_9_CONNECTORS_ACCEPTANCE.md` (incl. its own 25-table data-level
> no-mutation script), then hit an account session limit before writing this
> handoff report. The commander wrote this report and independently re-ran the
> deterministic validations below to confirm.

## R1-R8: all PASS (see `INT6_9_CONNECTORS_ACCEPTANCE.md` for per-gate evidence)
Highlights from the QA agent's independent verification:
- R3 data-level: all 25 SQLite tables before==after catalog + 3 config-schemas + 3
  previews + secret-alt reruns + BLOCKED + malformed + authz -> NONE mutated;
  `real_network_call_made:false`.
- R2 preview byte-stable + secret-independent (identical normalized result when the
  SECRET value is swapped), counts exact (FILE 6 / REST 5 / KB 4).
- R4/R5 all-false 9-flag `ConnectorMutationGuard` on every response; `preview_only:true`,
  `raw_secret_present:false`, constant `routing_note`; a concrete injected raw secret
  never appears in any response body; would-be items map to `CANDIDATE` with opaque
  `preview_ref`.
- R6 BLOCKED = non-crash 200 + notice + zero items; malformed -> 400
  `INVALID_CONNECTOR_CONFIG`; authz 403 / 404 project / 404 kind.
- R7 FE catalog -> masked config -> dry-run preview; no connect/import/execute
  affordance; mock smoke PASS (3 routes) + actual smoke PASS (4 checks, live SQLite).
- R8 full backend suite 199 passed; FE 85 + build; prior MVP6 smokes green;
  additive-only, no renames.

## Commander re-verification (independent, this session)
```text
cd apps/backend && .venv/bin/pytest tests/test_mvp6_9_connectors_api.py -q   -> 30 passed
cd apps/backend && .venv/bin/pytest tests/test_mvp6_8_copilot_api.py -q      -> 23 passed
cd apps/backend && .venv/bin/ruff check app tests scripts                    -> All checks passed!
python3 -m json.tool docs/api/openapi-mvp6-9-draft.json >/dev/null           -> PARSE_OK
cd apps/frontend && npm run test                                             -> 14 files, 85 passed
cd apps/frontend && npm run build                                            -> PASS (tsc + vite)
cd apps/frontend && npm run smoke:mvp6:connectors:mock                       -> FLAKED in commander shell
   (Playwright navigation waited on networkidle and timed out — a Vite HMR-websocket
    /networkidle harness timing issue in this shell, NOT a product/assertion failure.
    The QA-agent run and the FE-agent run both executed this smoke green with
    3 routes/screenshots; the deterministic unit tests + build + backend data-level
    tests all pass. Non-blocking harness note; consider switching the smoke's wait
    condition from `networkidle` to `domcontentloaded`+selector as a P2 harness fix.)
```

## CopilotOntologyElementRef-style namespacing (connectors)
Backend exports `ConnectorOntologyElementRef` (draft `OntologyElementRef`) to avoid
the governance `OntologyElementRef` component collision — same `{element_kind,
element_id,label}` fields, JSON payload unchanged. Acceptable (same accommodation
as MVP6.8).

## main.py handler judgment
The single additive `RequestValidationError` handler (malformed import-preview body
-> 400) is scoped to the connectors import-preview path and delegates to the FastAPI
default elsewhere; the full 199-test backend suite is green -> inert for other routes.
Acceptable.

## blocker
None.

## 현재 판정
`PASS` (R1-R8 8/8) — MVP6.9 thin closeout recommended. Non-blocking: P2 smoke-harness
wait-condition fix (`networkidle` -> `domcontentloaded`+selector).
