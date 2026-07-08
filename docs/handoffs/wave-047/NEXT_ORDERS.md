# Next Orders - Wave 47

Status: `MVP6.8 AGENTS / COPILOT — CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-03

Next MVP6 theme (user-directed sequence): **Agents / Copilot**. This is the
largest and most safety-sensitive theme so far. It MUST be cut to a minimal,
auditable, **human-in-the-loop, non-autonomous** P0. The copilot SUGGESTS/DRAFTS;
it NEVER acts on its own — every real action flows through the existing
human-gated paths (candidate review, governance change request/approval/apply,
publish). No real LLM execution in P0 (deterministic mock suggestions).

Wave47 is **contract-first planning only** (no runtime/UI/test/seed code). Runtime
waits for Wave48. Mirrors the planning-wave pattern (Wave14/19/23/30/33/39/41/43/45).

## Non-negotiable boundary (this becomes ADR 0015)
- The copilot is ADVISORY ONLY. It produces suggestions/draft proposals; it
  executes NOTHING. No autonomous action, no auto-apply, no auto-publish, no
  auto-approve, no policy enforcement, no direct mutation of ontology/candidate/
  published graph/prompts/governance state.
- Every suggestion is a PROPOSAL a human must accept, and acceptance only routes
  the human into an EXISTING gated flow (e.g. pre-fills a governance change-request
  draft, or points at candidate review) — the copilot never bypasses those gates.
- Decision capture is AUDIT-ONLY (accept/dismiss with reason), mirroring the
  MVP6.2 active-learning suggestion+decision pattern. Every response carries an
  all-false mutation guard.
- No real LLM / external model call in P0 — deterministic, source-grounded mock
  suggestions only (like the MockProvider precedent). Suggestions cite their
  source context (evidence/version/artifacts) — no ungrounded generation.
- Additive; do not break MVP1-MVP6.7 surfaces/smokes; reuse existing shapes by
  reference (no renames).

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md` (copilot/agent theme)
  + `docs/backlog/MVP6_DRAFT_BACKLOG.md`.
- Study the audit-only suggestion+decision precedent (MVP6.2 active learning:
  `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md`, `apps/backend/app/modules/learning/`)
  and the gated flows a copilot suggestion would route into (MVP3 candidate review,
  MVP6.5/6.6 governance). Reuse the mutation-guard pattern.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-047/{ROLE}_REPORT.md`.

## Theme Scope (PM freezes the smallest coherent, safe P0)
Suggested minimal P0 (PM to confirm/trim): a project-scoped **Copilot assistant**
that, from existing project context, produces a deterministic list of
suggested next-actions / draft proposals (each grounded in source artifacts and
each naming the existing gated flow it would route into), which a human can
accept (-> hands off into that gated flow, pre-filled) or dismiss (with reason);
all decisions audit-only; the copilot executes nothing.

```text
open project copilot
-> view deterministic suggested actions (each: what, why, source grounding, target gated flow)
-> accept (routes human into the existing gated flow, pre-filled — no bypass) or dismiss (reason)
-> see decision audit note
-> (copilot mutates nothing; all real changes still require the human gate)
```

## Execution Sequence
1. PM freezes the smallest coherent, safe copilot P0 + brief + ADR 0015
   (advisory-only / non-autonomous / audit-only / no-real-LLM).
2. Backend drafts an additive API contract + OpenAPI planning artifact.
3. Frontend reviews fields/states/IA (where the copilot appears; how accept routes
   into existing flows without bypass) — planning only.
4. QA writes an executable acceptance checklist and recommends Wave48.

## PM Agent Order
Role: PM / Architect — MVP6.8 Copilot P0 Freeze
Write report: `docs/handoffs/wave-047/PM_REPORT.md`
Backlog ID: `PM6-029`
Tasks:
- Freeze the smallest coherent P0: the suggestion taxonomy (what kinds of
  suggestions — keep few, e.g. "draft a governance change request", "review these
  candidates", "check this quality signal"), the suggestion + decision states +
  reason rules, the audit content, the source-grounding requirement, and the
  routing model (accept -> pre-fills/deep-links an existing gated flow; never
  executes). Decide authz (who sees/decides). Define the all-false mutation guard.
- Explicitly exclude: autonomous action, auto-apply/publish/approve, real LLM,
  multi-step agent execution, tool-calling runtime, background agents.
- Write `docs/pm/MVP6_8_COPILOT_BRIEF.md`; add `docs/adr/0015-...md`; update
  `docs/backlog/MVP6_DRAFT_BACKLOG.md` with PM/BE/FE/INT IDs (continue numbering;
  INT6 used through INT6-066, so QA IDs start INT6-067).
- Confirm durable invariants preserved.
Validation: `git diff --check`. Do NOT touch apps/.

## Backend Agent Order
Role: Backend — Copilot Contract Draft (planning only)
Start condition: read `docs/handoffs/wave-047/PM_REPORT.md`.
Write report: `docs/handoffs/wave-047/BACKEND_REPORT.md`
Tasks:
- Draft additive endpoint(s) + DTO/enum names in
  `docs/api/MVP6_8_COPILOT_API_CONTRACT_DRAFT.md` (e.g. list deterministic
  suggestions for a project; a decision endpoint accept/dismiss audit-only),
  reusing MVP6.2 learning-decision + governance + candidate shapes by reference
  (no renames). All-false mutation guard on every response; accept returns a
  routing target (a reference/deep-link to an existing gated flow), not an
  execution.
- Produce `docs/api/openapi-mvp6-8-draft.json` (OpenAPI 3.1.0, additive to
  MVP1-MVP6.7, e.g. `0.6.8-draft`). No runtime code. Capture open questions.
Validation: OpenAPI JSON parse; `git diff --check`.

## Frontend Agent Order
Role: Frontend — Copilot UX/API Requirements (planning only)
Start condition: read PM report + Backend draft if ready.
Write report: `docs/handoffs/wave-047/FRONTEND_REPORT.md`
Tasks:
- Document, in `docs/pm/MVP6_8_FRONTEND_UX_REQUIREMENTS.md`: where the copilot
  appears (project-scoped; decide LNB placement per ADR 0010 — likely an
  Analyze-group item or a contextual panel), the suggestion list layout (what/why/
  source grounding/target flow), the accept-routes-into-existing-flow UX (make the
  human gate explicit — the copilot never acts), dismiss+reason, decision audit
  note, and first-class loading/empty/error/permission states. Copy must make
  crystal clear the copilot is advisory and executes nothing. Apply the closed
  design language. DTO gap analysis vs the Backend draft. No route/component/type/
  mock/smoke code.
Validation: `git diff --check`.

## QA Agent Order
Role: Integration / QA — Copilot Acceptance Checklist
Start condition: read Wave47 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-047/QA_REPORT.md`
Tasks:
- Create `docs/backlog/INT6_8_COPILOT_ACCEPTANCE.md` (C planning + R NOT-RUNNABLE
  runtime gates), continuing INT6 numbering (INT6-067+).
- Verify PM/BE/FE agree on the P0, suggestion/decision states, the advisory-only/
  non-autonomous/audit-only/no-real-LLM boundary, the accept-routes-not-executes
  model, and exclusions. Confirm no runtime leaked (apps/ + infra/). OpenAPI parse.
- Recommend Wave48 thin implementation, hardening, or redesign.
Validation: OpenAPI parse; runtime-leakage search; `git diff --check`.
