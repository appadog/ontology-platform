# Next Orders - Wave 44

Status: `MVP6.6 GOVERNANCE CHANGE APPLICATION THIN IMPLEMENTATION`
Date: 2026-07-01

Wave43 closed MVP6.6 contract-first planning as PASS. Wave44 implements the
smallest deterministic runtime/UI slice of the frozen apply P0.

```text
open APPROVED + application_state=QUEUED change request
-> read-only application-status pre-check (target DRAFT version + per-item before/after + staleness hint)
-> permitted role confirms "apply to draft" (human-confirmation, never automatic)
-> items apply to a DRAFT ontology version (ADD=create / MODIFY=update / DEPRECATE=ARCHIVED)
-> application_state=APPLIED + "applied to DRAFT, NOT published" banner + application audit
```

Sequence: PM (freeze G1-G6 + confirm G7/G8 FIRST) -> Backend ∥ Frontend -> QA.

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read Wave43 artifacts: `docs/handoffs/wave-043/{PM,BACKEND,FRONTEND,QA}_REPORT.md`,
  `docs/pm/MVP6_6_GOVERNANCE_APPLICATION_BRIEF.md`, `docs/adr/0013-...md`,
  `docs/api/MVP6_6_GOVERNANCE_APPLICATION_API_CONTRACT_DRAFT.md`,
  `docs/api/openapi-mvp6-6-draft.json`,
  `docs/pm/MVP6_6_FRONTEND_UX_REQUIREMENTS.md`,
  `docs/backlog/INT6_6_GOVERNANCE_APPLICATION_ACCEPTANCE.md` (G1-G8 gates, R1-R9).
- Extend the MVP6.5 `apps/backend/app/modules/governance/` module + the FE
  Governance detail page. Reuse MVP1 ontology-edit/draft-version + MVP3/MVP5
  shapes by reference; NO renames. Apply the closed design language.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-044/{ROLE}_REPORT.md`.

## Scope Guard (the non-negotiable boundary — ADR 0013)
- Apply is human-initiated only, from APPROVED + `application_state=QUEUED` only.
- Apply mutates ONLY a DRAFT ontology version. The published graph is NEVER
  touched; no publish job; no hard delete. Publishing stays the separate MVP3
  path (out of scope).
- Staleness auto-detected at apply -> `409 CHANGE_REQUEST_SUPERSEDED` +
  `application_state=SUPERSEDED` (terminal), nothing mutated.
- Idempotency: `409 CHANGE_ALREADY_APPLIED` / `CHANGE_NOT_APPLICABLE` /
  `APPLY_TARGET_NOT_DRAFT`. Authz = approver rights, applier may differ, `403`.
- Successful apply carries `GovernanceApplicationMutationGuard` with EXACTLY ONE
  true flag `ontology_draft_mutated`; all others false. Pre-check/audit/blocked
  keep the all-false `GovernanceMutationGuard`.
- Deterministic process-local data; no real LLM. Additive; no break of
  MVP1-MVP6.5 surfaces/smokes.

## PM Agent Order
Role: PM / MVP6.6 Implementation Scope Guard + Gate Freeze
Write report: `docs/handoffs/wave-044/PM_REPORT.md`
Backlog ID: `PM6-026`
Tasks: freeze G1 (target-draft default), G2 (per-change_type staleness key), G3
(approved-snapshot capture point), G4 (all-or-nothing, no partial apply + failure
semantics), G5 (pre-check advisory only vs may flip QUEUED->SUPERSEDED), G6
(post-apply capability values); confirm G7 (FE StatusBadge `APPLIED` token +
`SUPERSEDED` warning tone) and G8 (application-guard 7-key names). State each as
one precise rule. Confirm scope unchanged; restate the acceptance gates. Update
`docs/backlog/MVP6_DRAFT_BACKLOG.md` if IDs (BE6-048+, FE6-069+, INT6-055+) need
recording. Validation: `git diff --check`; no apps/.

## Backend Agent Order
Role: Backend / MVP6.6 Runtime Thin Slice
Start condition: read `docs/handoffs/wave-044/PM_REPORT.md` (frozen G1-G6).
Write report: `docs/handoffs/wave-044/BACKEND_REPORT.md`
Backlog IDs: `BE6-048` application-status pre-check, `BE6-049` apply action +
DRAFT ontology mutation + state transitions, `BE6-050` staleness/idempotency/authz
+ one-true-flag guard, `BE6-051` application audit + OpenAPI export/alignment +
no-published-mutation regression guard.
Tasks: implement the 3 endpoint families in the governance module matching
`openapi-mvp6-6-draft.json` EXACTLY; apply mutates a DRAFT ontology version via
the MVP1 ontology-edit path (reuse by reference); enforce the frozen G1-G6 rules,
staleness->409 SUPERSEDED, idempotency 409s, authz 403; successful apply returns
the one-true-flag `ontology_draft_mutated` guard; full application audit. Focused
tests (`tests/test_mvp6_6_governance_application_api.py`): pre-check; apply happy
path (draft mutated, APPLIED); published-graph/candidate/prompt/publish-job
UNCHANGED after apply (data-level); staleness 409 SUPERSEDED (nothing mutated);
idempotency 409s; authz 403; one-true-flag guard; audit; OpenAPI alignment.
Validation: `cd apps/backend && .venv/bin/pytest tests/test_mvp6_6_governance_application_api.py -q`
and `tests/test_mvp6_5_governance_api.py -q`; `ruff check app tests scripts`;
OpenAPI compare; `git diff --check`.

## Frontend Agent Order
Role: Frontend / MVP6.6 Apply UI (in the Governance detail)
Start condition: read `docs/handoffs/wave-044/PM_REPORT.md`; coordinate with the
Backend report if contracts shift.
Write report: `docs/handoffs/wave-044/FRONTEND_REPORT.md`
Backlog IDs: `FE6-069` types/client/mocks + StatusBadge APPLIED/SUPERSEDED
(G7/G8), `FE6-070` pre-check panel, `FE6-071` apply confirmation + APPLIED/
SUPERSEDED/conflict states + applied-not-published banner, `FE6-072` mock + actual
smoke.
Tasks: extend the existing Governance detail page (no new LNB/route) with the
pre-check panel, the apply confirmation modal (human-confirmation, gated on
APPROVED+QUEUED + capability), the APPLIED (success `초안에 적용됨(미게시)`) and
SUPERSEDED (warning `대체됨(미적용)`) badges, the 409 conflict/idempotency notices,
and the applied-not-published banner + one-true-flag proof line. Add the `APPLIED`
StatusBadge token + `SUPERSEDED` warning tone (G7). Types/client/query/mocks match
the frozen OpenAPI exactly. Add `npm run smoke:mvp6:governance-apply:mock` and, if
backend runnable, `:actual` (assert apply->APPLIED + one-true-flag + staleness 409
+ published-graph-untouched + 403). Design language applied; loading/empty/error
states.
Validation: `npm run test`, `npm run build`, the new mock smoke (+ actual if
runnable), responsive 0-overflow re-check on the detail page, `git diff --check`.

## QA Agent Order
Role: Integration / QA
Start condition: read Wave44 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-044/QA_REPORT.md`
Backlog IDs: `INT6-055` backend runtime, `INT6-056` frontend mock/API, `INT6-057`
application-!=-publish + one-true-flag data-level guard, `INT6-058` Wave44 closeout.
Tasks: update `docs/backlog/INT6_6_GOVERNANCE_APPLICATION_ACCEPTANCE.md` R1-R9 with
verdicts. Validate the 3 endpoint families, the frozen G1-G6 behavior, staleness
409 SUPERSEDED, idempotency 409s, authz 403. INDEPENDENTLY verify at the DATA
level that after a successful apply the DRAFT ontology IS updated but the published
graph / candidates / prompts / publish-job tables are UNCHANGED, and the guard has
exactly one true flag. Validate the FE mock + actual flow. Run MVP6.5/earlier
regression + smokes touched; confirm additive-only + candidate/published separation
intact. Recommend closeout / hardening / redesign. Exact commands; no leftover
listeners on 8000/5173; `git diff --check`.
