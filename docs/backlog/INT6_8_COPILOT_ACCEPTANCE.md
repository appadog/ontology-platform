# INT6.8 MVP6.8 Copilot Acceptance Checklist

Status: `WAVE47 QA PLANNING ACCEPTANCE — PASS (C-series PASS; R-series NOT RUNNABLE by design)`
Date: 2026-07-03
Owner: QA / Integration (Wave47 authored by commander due to repeated agent session-limit / connection-drop interruptions; independent runtime verification deferred to the Wave48 implementation QA)
Backlog: `INT6-067`..`INT6-070` (Wave47 planning)

Wave47 verdict: **PASS (planning)** — PM brief + ADR 0015, Backend
`openapi-mvp6-8-draft.json` + companion contract, and Frontend UX requirements
agree on the advisory-only copilot P0, the accept-routes-not-executes model, the
audit-only decision capture, the all-false 14-flag `CopilotMutationGuard`, no real
LLM (deterministic mock), and source grounding. OpenAPI parses (3.1.0,
`0.6.8-draft`, 4 paths / 24 schemas), additive/disjoint. No runtime leaked under
`apps/`/`infra/`. R-series NOT RUNNABLE by design until Wave48.

> **QA ID note.** `INT6-*` used through `INT6-066` (Wave46). This theme uses
> **`INT6-067`~`INT6-070`**.

## Source Documents
- Wave order: `docs/handoffs/wave-047/NEXT_ORDERS.md`
- Reports: `docs/handoffs/wave-047/{PM,BACKEND,FRONTEND}_REPORT.md`
- PM brief: `docs/pm/MVP6_8_COPILOT_BRIEF.md`
- ADR: `docs/adr/0015-...boundary.md`
- API: `docs/api/MVP6_8_COPILOT_API_CONTRACT_DRAFT.md` + `docs/api/openapi-mvp6-8-draft.json`
- Frontend requirements: `docs/pm/MVP6_8_FRONTEND_UX_REQUIREMENTS.md`

## Verdict Semantics
- `PASS`: artifacts agree and preserve the advisory-only/non-autonomous boundary.
- `PARTIAL`: usable but named fields/enums/rules need targeted hardening.
- `FAIL`: opens autonomous action / execution, real LLM, or any mutation.
- `NOT RUNNABLE`: expected for runtime checks before Wave48.

## C-Series — Planning Gates (Wave47)
| ID | Gate | Verdict |
|---|---|---|
| C1 | 4 endpoints present: copilot/summary, copilot/suggestions, copilot-suggestions/{id}, .../decisions | PASS |
| C2 | `CopilotSuggestionKind` = 4 kinds, each naming its target existing gated flow | PASS |
| C3 | `CopilotSuggestionState` SUGGESTED->ACCEPTED/DISMISSED/SUPERSEDED; commands ACCEPT/DISMISS (DISMISS reuses MVP6.2 reason codes); non-SUGGESTED -> 409 COPILOT_SUGGESTION_DECISION_CONFLICT | PASS |
| C4 | ACCEPT returns a `CopilotRoutingTarget` (deep-link + optional pre-fill) with NO authority — routes into an existing gated flow, executes/mutates nothing | PASS |
| C5 | all-false `CopilotMutationGuard` (14 flags incl. `copilot_executed_action`, `real_model_invoked`) on every response — no flag ever true | PASS |
| C6 | No real LLM — deterministic mock; every suggestion cites non-empty source-artifact refs (no ungrounded generation) | PASS |
| C7 | Authz: any project member views + records audit-only decisions (MVP5 `Role`, no new literal); downstream gate keeps its own RBAC | PASS |
| C8 | Reuse of MVP6.2/governance/candidate/quality/impact shapes by reference, no renames | PASS |
| C9 | OpenAPI parses (3.1.0, `0.6.8-draft`, 4 paths / 24 schemas), additive/disjoint to MVP1-MVP6.7 | PASS |
| C10 | FE advisory-only surface (suggestion list + accept-routes/dismiss + audit note + "executes nothing" proof), no auto-apply/publish/execute affordance; design language applied | PASS |
| C11 | Durable invariants: no autonomous action, candidate/published separation, evidence grounding, additive-only | PASS |

## R-Series — Runtime Gates (Wave48, NOT RUNNABLE now)
| ID | Runtime gate | Status |
|---|---|---|
| R1 | endpoints return deterministic, source-grounded suggestions + summary | NOT RUNNABLE |
| R2 | ACCEPT returns a routing target and executes NOTHING; DATA-LEVEL: no table mutated by any copilot call; all-false 14-flag guard | NOT RUNNABLE |
| R3 | decision transitions + non-SUGGESTED 409 conflict; audit-only capture | NOT RUNNABLE |
| R4 | authz (viewer decides audit-only); downstream gate RBAC untouched | NOT RUNNABLE |
| R5 | frontend copilot flow (suggestions -> accept-routes/dismiss -> audit note), mock + actual smoke; no execute affordance | NOT RUNNABLE |
| R6 | no real LLM invoked (`real_model_invoked=false`), suggestions grounded | NOT RUNNABLE |
| R7 | MVP1-MVP6.7 regression, additive-only, no renames | NOT RUNNABLE |

## Wave48 Gates (freeze at implementation)
- G1 deterministic suggestion-generation source rules per `CopilotSuggestionKind`.
- G2 routing pre-fill payload shape per `CopilotRoutingTargetKind`.
- G3 summary DTO fields.

## Validation (Wave47)
```text
python3 -m json.tool docs/api/openapi-mvp6-8-draft.json >/dev/null && echo PARSE_OK   # PARSE_OK (4 paths / 24 schemas)
rg -n 'copilot|Copilot|mvp6.8' apps infra --glob '!**/node_modules/**'   # 0 (no leak)
git diff --check   # clean
```

## Recommendation
Open **Wave48 MVP6.8 thin implementation** (advisory copilot: deterministic
suggestions + accept-routing-not-execution + audit-only decisions). PM freezes
G1-G3; QA independently verifies R1-R7 incl. the data-level "copilot executes/
mutates nothing / all-false guard / no real model" proof.
