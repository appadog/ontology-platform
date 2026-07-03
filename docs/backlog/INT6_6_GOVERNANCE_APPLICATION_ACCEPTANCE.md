# INT6.6 MVP6.6 Governance Change Application Acceptance Checklist

Status: `WAVE43 QA PLANNING ACCEPTANCE — PASS (C-series PASS; R-series NOT RUNNABLE by design)`
Date: 2026-07-01
Owner: QA / Integration (Wave43 authored by commander due to a QA-agent session-limit interruption; independent runtime verification is deferred to the Wave44 implementation QA)
Backlog: `INT6-051`..`INT6-054` (Wave43 planning)

Wave43 verdict: **PASS (planning)** — PM brief, ADR 0013, Backend contract +
OpenAPI, and Frontend UX requirements agree on the apply P0, the application !=
publish / DRAFT-only boundary, staleness -> SUPERSEDED, idempotency, authz, the
redefined one-true-flag `GovernanceApplicationMutationGuard`, reuse-by-reference
of MVP6.5/MVP1/MVP5 shapes with no rename, and the exclusions. `openapi-mvp6-6-draft.json`
parses (3.1.0, `0.6.6-draft`, 3 paths / 3 operations / 19 schemas), additive and
disjoint from MVP1-MVP6.5. No runtime implementation leaked under `apps/`/`infra/`.
Runtime acceptance (R-series) is `NOT RUNNABLE` by design until Wave44.

> **QA ID note.** `INT6-*` was consumed through `INT6-050` (Wave42 MVP6.5 runtime).
> This theme uses **`INT6-051`~`INT6-054`** per the PM freeze.

## Source Documents
- `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`, `docs/handoffs/CURRENT_STATE.md`
- Wave order: `docs/handoffs/wave-043/NEXT_ORDERS.md`
- Reports: `docs/handoffs/wave-043/{PM,BACKEND,FRONTEND}_REPORT.md`
- PM brief: `docs/pm/MVP6_6_GOVERNANCE_APPLICATION_BRIEF.md`
- ADR: `docs/adr/0013-mvp6-6-governance-application-draft-only-human-initiated-boundary.md`
- API draft: `docs/api/MVP6_6_GOVERNANCE_APPLICATION_API_CONTRACT_DRAFT.md`
- OpenAPI draft: `docs/api/openapi-mvp6-6-draft.json`
- Frontend requirements: `docs/pm/MVP6_6_FRONTEND_UX_REQUIREMENTS.md`
- Precedents: `docs/backlog/INT6_5_GOVERNANCE_ACCEPTANCE.md`, `docs/adr/0012-...md`

## Verdict Semantics
- `PASS`: planning artifacts agree and preserve the boundary.
- `PARTIAL`: usable but named fields/enums/rules need targeted hardening.
- `FAIL`: opens forbidden scope (published-graph mutation, auto-apply), removes
  traceability, or breaks the DRAFT-only/human-initiated boundary.
- `NOT RUNNABLE`: expected for runtime checks before Wave44.

## C-Series — Planning Gates (Wave43)
| ID | Gate | Verdict |
|---|---|---|
| C1 | 3 endpoint families present: application-status pre-check (GET), apply (POST), application-audit (GET) | PASS |
| C2 | Apply permitted ONLY from `APPROVED` + `application_state=QUEUED`; success -> `APPLIED` | PASS |
| C3 | Apply mutates ONLY a DRAFT ontology version (ADD=create / MODIFY=update / DEPRECATE=ARCHIVED); published graph NEVER touched; no publish job; no hard delete | PASS |
| C4 | Human-initiated only (confirmation step); never automatic; approval does not trigger apply | PASS |
| C5 | Staleness auto-detected at apply -> `409 CHANGE_REQUEST_SUPERSEDED` + `application_state=SUPERSEDED` (terminal), nothing mutated | PASS |
| C6 | Idempotency: `409 CHANGE_ALREADY_APPLIED` / `409 CHANGE_NOT_APPLICABLE` / `409 APPLY_TARGET_NOT_DRAFT` | PASS |
| C7 | Authz = approver rights (ONTOLOGY_MANAGER/PROJECT_ADMIN/SYSTEM_ADMIN); applier may differ from approver; unauthorized `403` | PASS |
| C8 | Redefined `GovernanceApplicationMutationGuard`: successful apply has EXACTLY ONE true flag `ontology_draft_mutated`, all 6 others false; pre-check/audit/blocked-apply keep all-false `GovernanceMutationGuard` | PASS |
| C9 | Application audit content: actor, timestamp, source change request + items, resulting draft ontology version id, before/after element refs | PASS |
| C10 | Reuse of MVP6.5/MVP1/MVP5 shapes by reference, no renames; new enum `GovernanceApplicationAuditAction` only | PASS |
| C11 | OpenAPI parses (3.1.0, `0.6.6-draft`, 3 paths/3 ops/19 schemas), additive/disjoint to MVP1-MVP6.5; 0 dangling refs | PASS |
| C12 | Durable invariants preserved: published-graph untouched, candidate/published separation, evidence/version/audit traceability, additive-only, no real LLM | PASS |

## R-Series — Runtime Gates (Wave44 — QA independently verified)
Verdicts from Wave44 QA (INT6-055..058). Evidence in `docs/handoffs/wave-044/QA_REPORT.md`.
| ID | Runtime gate | Verdict |
|---|---|---|
| R1 | apply endpoint applies items to a DRAFT version and returns `APPLIED` + one-true-flag guard | PASS |
| R2 | published graph / candidate / prompt / publish-job tables unchanged after apply (data-level) | PASS |
| R3 | pre-check returns resolved target draft version + per-item before/after + advisory staleness | PASS |
| R4 | staleness path -> 409 SUPERSEDED, application_state terminal, nothing mutated | PASS |
| R5 | idempotency 409s (already-applied / not-applicable / target-not-draft) | PASS |
| R6 | authz 403 (non-permitted role); applier != approver allowed + audited | PASS |
| R7 | application audit entries complete + chronological | PASS |
| R8 | frontend apply UX (pre-check panel + confirmation modal + APPLIED/SUPERSEDED badges + applied-not-published banner), mock + actual smoke | PASS |
| R9 | MVP1-MVP6.5 regression, additive-only, no renames | PASS |

Wave44 QA overall verdict: **PASS** (R1-R9 9/9). Recommendation: **MVP6.6 thin closeout**;
optional Wave45 hardening items are P1/non-blocking (see report §Recommendation).

## Wave44 Gates (must be frozen by PM before/at implementation)
- **G1** (BE Q) target-draft default: which DRAFT ontology version is the apply target when several exist / none is explicit.
- **G2** (BE Q) per-`change_type` staleness key: exactly what constitutes "stale" for ADD vs MODIFY vs DEPRECATE.
- **G3** (BE Q) snapshot capture point: what approved snapshot is compared at apply time (captured at approve vs at propose).
- **G4** (BE Q) partial-apply exclusion: confirm all-or-nothing (no partial application) and its failure semantics.
- **G5** (BE Q) whether the pre-check GET may itself flip `QUEUED->SUPERSEDED`, or is purely advisory (apply is authoritative).
- **G6** (BE Q) post-apply `can_apply`/capability values.
- **G7** (FE gap #8, FE-owned) add an `APPLIED` `StatusBadge` token and override `SUPERSEDED` to warning tone (the existing `ApplicationStateBadge` renders APPLIED/SUPERSEDED as an unexpected-state guard).
- **G8** (FE gap #7) reconcile `GovernanceApplicationMutationGuard` 7-key names vs the MVP6.5 `GovernanceMutationGuard` so FE renders the correct proof line.

## Validation (Wave43)
```text
python3 -m json.tool docs/api/openapi-mvp6-6-draft.json >/dev/null && echo PARSE_OK   # PARSE_OK
rg -n 'GovernanceApply|application-status|CHANGE_REQUEST_SUPERSEDED|ontology_draft_mutated|mvp6.6' apps infra --glob '!**/node_modules/**'   # 0 matches (no runtime leak)
git diff --check   # clean
```

## Recommendation
Open **Wave44 MVP6.6 thin implementation**. PM freezes G1-G6 (+ confirms G7/G8)
first, then Backend implements the apply/pre-check/audit endpoints (one sanctioned
mutation surface: DRAFT ontology only), Frontend implements the apply UX incl. the
StatusBadge changes, and QA independently verifies R1-R9 incl. the data-level
"published graph untouched" proof.
