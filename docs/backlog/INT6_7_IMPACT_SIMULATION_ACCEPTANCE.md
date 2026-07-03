# INT6.7 MVP6.7 Impact Simulation Acceptance Checklist

Status: `WAVE45 QA PLANNING ACCEPTANCE — PASS (C-series PASS; R-series NOT RUNNABLE by design)`
Date: 2026-07-02
Owner: QA / Integration (Wave45 authored by commander due to account session-limit interruptions; independent runtime verification deferred to the Wave46 implementation QA)
Backlog: `INT6-059`..`INT6-062` (Wave45 planning)

Wave45 verdict: **PASS (planning)** — PM brief + ADR 0014, Backend contract +
`openapi-mvp6-7-draft.json`, and Frontend UX requirements agree on the read-only
impact-report P0, the 5 impact dimensions, the `ImpactSeverity` taxonomy, the
bounding/truncation rules, the all-false `ImpactSimulationMutationGuard`, and
reuse-by-reference (no renames). OpenAPI parses (3.1.0, `0.6.7-draft`, 1 path / 23
schemas), additive/disjoint. No runtime leaked under `apps/`/`infra/`. R-series
NOT RUNNABLE by design until Wave46.

> **QA ID note.** `INT6-*` used through `INT6-058` (Wave44). This theme uses
> **`INT6-059`~`INT6-062`**.

## Source Documents
- Wave order: `docs/handoffs/wave-045/NEXT_ORDERS.md`
- Reports: `docs/handoffs/wave-045/{PM,BACKEND,FRONTEND}_REPORT.md`
- PM brief: `docs/pm/MVP6_7_IMPACT_SIMULATION_BRIEF.md`
- ADR: `docs/adr/0014-mvp6-7-impact-simulation-read-only-analysis-boundary.md`
- API draft: `docs/api/MVP6_7_IMPACT_SIMULATION_API_CONTRACT_DRAFT.md`
- OpenAPI draft: `docs/api/openapi-mvp6-7-draft.json`
- Frontend requirements: `docs/pm/MVP6_7_FRONTEND_UX_REQUIREMENTS.md`

## Verdict Semantics
- `PASS`: artifacts agree and preserve the read-only boundary.
- `PARTIAL`: usable but named fields/enums/rules need targeted hardening.
- `FAIL`: opens any mutation, removes traceability, or implies apply/publish/enforce.
- `NOT RUNNABLE`: expected for runtime checks before Wave46.

## C-Series — Planning Gates (Wave45)
| ID | Gate | Verdict |
|---|---|---|
| C1 | Read-only endpoint present: `GET .../ontology-change-requests/{id}/impact-simulation` (idempotent GET; mutates nothing) | PASS |
| C2 | 5 impact dimensions modeled: affected ontology elements (direct + bounded transitive); dependent candidate entities/relations; dependent published elements; affected MVP3 `ValidationRuleCode` + MVP4 `QualityMetricGroup`; severity/summary rollup | PASS |
| C3 | `ImpactSeverity` = NONE/LOW/MEDIUM/HIGH/BREAKING + `ImpactSeverityReason`, deterministic computation per the brief | PASS |
| C4 | Bounding: transitive depth = 2; per-dimension ref cap + `truncated` + exact `count`; byte-stable/deterministic | PASS |
| C5 | Read-only boundary: all-false `ImpactSimulationMutationGuard` on every response; no flag ever true; no apply/publish/enforce; never flips governance status/application_state | PASS |
| C6 | Read authz = any project member who can view the request (no elevated role) | PASS |
| C7 | Reuse of MVP6.5/6.6 governance + candidate/published + MVP3/MVP4 shapes by reference, no renames; new enums `ImpactSeverity`/`ImpactSeverityReason` only | PASS |
| C8 | OpenAPI parses (3.1.0, `0.6.7-draft`, 1 path / 23 schemas), additive/disjoint to MVP1-MVP6.6 | PASS |
| C9 | FE placement = contextual "영향도(Impact)" panel on the Governance change-request detail (no new global LNB item, ADR 0010); severity D6 badges; truncation + read-only states | PASS |
| C10 | Durable invariants preserved: mutates nothing, candidate/published separation, evidence/version traceability, additive-only, no real LLM | PASS |

## R-Series — Runtime Gates (Wave46, NOT RUNNABLE now)
| ID | Runtime gate | Status |
|---|---|---|
| R1 | endpoint returns a deterministic `ImpactSimulationReport` for a change request | NOT RUNNABLE |
| R2 | data-level: NO table mutated by the call; all-false guard on the response | NOT RUNNABLE |
| R3 | 5 dimensions populated correctly incl. bounded transitive + `truncated`/`count` | NOT RUNNABLE |
| R4 | severity computed per the frozen rules (NONE..BREAKING) + rollup | NOT RUNNABLE |
| R5 | read authz (viewer allowed); governance status/application_state never changed | NOT RUNNABLE |
| R6 | frontend impact panel (5 dimensions + severity badges + truncation + read-only copy), mock + actual smoke | NOT RUNNABLE |
| R7 | MVP1-MVP6.6 regression, additive-only, no renames | NOT RUNNABLE |

## Wave46 Gates (freeze at implementation)
- G1 dependency-graph source for the transitive walk (candidate vs published vs both).
- G2 exact per-dimension ref-cap sizes.
- G3 severity edge cases (e.g. MODIFY on element with only candidate dependents vs published).

## Validation (Wave45)
```text
python3 -m json.tool docs/api/openapi-mvp6-7-draft.json >/dev/null && echo PARSE_OK   # PARSE_OK
rg -n 'impact-simulation|ImpactSimulation|ImpactSeverity|mvp6.7' apps infra --glob '!**/node_modules/**'   # 0 (no leak)
git diff --check   # clean
```

## Recommendation
Open **Wave46 MVP6.7 thin implementation** (read-only endpoint + impact panel).
PM freezes G1-G3; QA independently verifies R1-R7 incl. the data-level
"nothing mutated / all-false guard" proof.
