# Next Orders - Wave 40

Status: `MVP6.4 GOLD SET AUTHORING + DATASET REVISIONING THIN IMPLEMENTATION`
Date: 2026-06-29

Wave39 closed MVP6.4 contract-first planning as PASS. Wave40 implements the
smallest deterministic runtime/UI slice of the frozen P0 loop.

```text
open dataset as expert owner
-> edit/archive gold item
-> attach/edit standalone Gold Evidence
-> cut new dataset revision (prior becomes FROZEN/immutable)
-> export JSON bundle
-> import dry-run compatibility report -> confirm-with-strategy
-> confirm an existing run still pins the revision it used
```

Sequence: PM (freeze the open gate FIRST) -> Backend ∥ Frontend -> QA.

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read Wave39 planning artifacts: `docs/handoffs/wave-039/{PM,BACKEND,FRONTEND,QA}_REPORT.md`,
  `docs/pm/MVP6_4_GOLD_SET_AUTHORING_BRIEF.md`,
  `docs/adr/0011-mvp6-4-gold-set-authoring-revision-immutability-boundary.md`,
  `docs/api/MVP6_4_GOLD_SET_AUTHORING_API_CONTRACT_DRAFT.md`,
  `docs/api/openapi-mvp6-4-draft.json`,
  `docs/pm/MVP6_4_FRONTEND_UX_REQUIREMENTS.md`,
  `docs/backlog/INT6_4_GOLD_SET_AUTHORING_ACCEPTANCE.md` (C1-C12 / R1-R12).
- Build on the closed MVP6.1 evaluation module/UI — reuse its shapes by
  `$ref`/type reuse; do NOT rename existing MVP6.1 fields/enums.
- Apply the closed design language (tokens, Section+Card, KO titles, status
  badges, single primary action) and respect ADR 0010 LNB IA.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-040/{ROLE}_REPORT.md`.

## Scope Guard
- MVP6.4 thin implementation only — exactly the 5 frozen endpoint families:
  A) gold item edit/archive/restore; B) standalone GoldEvidence CRUD;
  C) DatasetRevision cut/list/get/activate; D) export GET + import dry-run/confirm;
  E) authoring audit log.
- Authoring is candidate/analysis-layer only. NO mutation of published graph,
  candidates, candidate review, prompts, extraction, or evaluation RUN scores.
  Every authoring/import response carries an all-false 7-flag
  `GoldAuthoringMutationGuard`. `EvaluationRun.dataset_version_id` is NEVER
  rewritten (reproducibility). Gold items/evidence are archived/frozen, never
  hard-deleted.
- Owner/admin-only authorization (`GoldAuthoringCapabilities` + 403).
- Import dry-run-first; INCOMPATIBLE blocked; no auto-merge; explicit strategy on
  confirm.
- Deterministic local/process-local data acceptable (follow MVP6.1 store
  pattern). No real LLM calls. No benchmark P1+/governance/agent scope.

## Execution Sequence
1. PM freezes the freeze-on-pin rule (gate) + scope guard.
2. Backend implements the 5 endpoint families, tests, OpenAPI export/alignment.
3. Frontend implements the Gold Set Manager UI, types/client/mocks, mock +
   (if backend runnable) actual smoke.
4. QA validates `INT6_4` runtime gates R1-R12, mutation guard, reproducibility,
   regression; recommends closeout or hardening.

## PM Agent Order
Role: PM / MVP6.4 Implementation Scope Guard + Freeze-on-pin Freeze
Write report: `docs/handoffs/wave-040/PM_REPORT.md`
Backlog ID: `PM6-022`

Tasks:
- FREEZE the freeze-on-pin rule (the Wave39 open gate): decide whether a revision
  becomes immutable while still ACTIVE once `pinned_run_count > 0`, OR only when
  it transitions to FROZEN. Resolve the tension with "at most one ACTIVE /
  FROZEN=immutable". State the single rule precisely so Backend/Frontend/QA all
  implement/test one behavior. Record rationale. Update the brief/ADR 0011 if the
  ruling refines them.
- Confirm no scope expansion beyond the frozen P0 + 5 endpoint families.
- Restate the acceptance gates: all-false mutation guard; no MVP6.1 renames;
  run-pin never rewritten; owner/admin-only; import dry-run-first/INCOMPATIBLE
  blocked.
- Update `docs/backlog/MVP6_DRAFT_BACKLOG.md` only if implementation IDs need
  recording (Backend BE6-032+, Frontend FE6-053+, QA INT6-039+).

Validation: `git diff --check`. Do NOT touch apps/.

## Backend Agent Order
Role: Backend / MVP6.4 Runtime Thin Slice
Start condition: read `docs/handoffs/wave-040/PM_REPORT.md` (esp. the frozen
freeze-on-pin rule).
Write report: `docs/handoffs/wave-040/BACKEND_REPORT.md`
Backlog IDs: `BE6-032` gold item edit/archive + GoldEvidence CRUD, `BE6-033`
dataset revision cut/activate + immutability/run-pinning, `BE6-034` export/import
dry-run+confirm + audit log, `BE6-035` OpenAPI export/alignment + no-mutation
regression guard

Tasks:
- Implement the 5 frozen endpoint families matching
  `docs/api/openapi-mvp6-4-draft.json` field/enum names EXACTLY, in a new module
  (e.g. `apps/backend/app/modules/goldset_authoring/` or extend the evaluation
  module per the existing pattern). Deterministic process-local store consistent
  with the MVP6.1 evaluation store; add a `reset_runtime_store()`-style hook for
  test/smoke determinism.
- Enforce: the PM-frozen freeze-on-pin rule; FROZEN immutability (409
  REVISION_FROZEN / GOLD_ITEM_IMMUTABLE on mutation attempts); at most one ACTIVE
  per dataset; `EvaluationRun.dataset_version_id` never rewritten; archive/freeze
  not hard-delete; owner/admin-only (403); import dry-run-first with the 4
  compatibility states + explicit strategy on confirm + INCOMPATIBLE blocked.
- Every authoring/import response includes the all-false `GoldAuthoringMutationGuard`.
- Reuse MVP6.1 gold shapes by `$ref`/`allOf` overlay; no renames; no new metric.
- Focused tests: edit/archive/restore, GoldEvidence CRUD, revision cut/activate +
  immutability, run-pin-not-rewritten, export/import dry-run/confirm + compat
  states, authz 403, mutation-guard all-false, OpenAPI field/enum alignment.

Validation (capture exact output):
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_4_goldset_authoring_api.py -q`
  (or the focused file you create) and `tests/test_mvp6_evaluation_api.py -q`
- `cd apps/backend && .venv/bin/ruff check app tests scripts`
- OpenAPI export/parse/compare for the MVP6.4 paths
- `git diff --check`

## Frontend Agent Order
Role: Frontend / MVP6.4 Gold Set Manager Thin UI
Start condition: read `docs/handoffs/wave-040/PM_REPORT.md`; coordinate with the
Backend report if contracts shift.
Write report: `docs/handoffs/wave-040/FRONTEND_REPORT.md`
Backlog IDs: `FE6-053` route/IA + types/client/mocks, `FE6-054` authoring UI
(edit/archive + GoldEvidence), `FE6-055` revision lifecycle + export/import UI,
`FE6-056` mock + actual smoke

Tasks:
- Implement Gold Set Manager contextual under the existing Evaluation surface
  (no ID-bound page in the global LNB) per `MVP6_4_FRONTEND_UX_REQUIREMENTS.md`.
- Flow: open dataset as owner -> edit/archive/restore gold item -> attach/edit
  standalone Gold Evidence -> cut revision (prior FROZEN) -> export JSON ->
  import dry-run compatibility report -> confirm-with-strategy -> run-pin display.
- States: permission-limited (non-owner read-only via capability hint),
  revision lifecycle DRAFT/ACTIVE/FROZEN/ARCHIVED (D6 badges; FROZEN read-only +
  immutable banner), import compatibility COMPATIBLE/WARNING/CONFLICT/INCOMPATIBLE
  (dry-run before confirm; INCOMPATIBLE blocks), plus loading/empty/error.
- Make reproducibility visible: each run shows its pinned FROZEN revision; copy
  states authoring never rescps existing runs. Apply design language (Section+
  Card, KO titles, one primary action). No publish/enforce/auto-merge copy.
- Types/client/query/mocks match the frozen OpenAPI exactly; reuse MVP6.1
  evaluation types where `$ref`'d (no redefine/rename).
- Add `npm run smoke:mvp6:goldset:mock` and, if backend runnable,
  `npm run smoke:mvp6:goldset:actual`.

Validation (capture exact output):
- `cd apps/frontend && npm run test`, `npm run build`,
  `npm run smoke:mvp6:goldset:mock`, `:actual` if backend runnable
- responsive re-check 0 overflow at 1440/1366/1280/768 for the new screens
- `git diff --check`

## QA Agent Order
Role: Integration / QA
Start condition: read Wave40 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-040/QA_REPORT.md`
Backlog IDs: `INT6-039` backend runtime acceptance, `INT6-040` frontend mock/API
acceptance, `INT6-041` no-mutation + reproducibility guard, `INT6-042` Wave40
closeout recommendation

Tasks:
- Update `docs/backlog/INT6_4_GOLD_SET_AUTHORING_ACCEPTANCE.md` runtime gates
  R1-R12 with verdicts.
- Validate the 5 endpoint families, DTO/enum alignment to OpenAPI, the frozen
  freeze-on-pin rule, FROZEN immutability (409s), at-most-one-ACTIVE, authz 403,
  import dry-run/compat/strategy/INCOMPATIBLE-blocked, archive-not-delete.
- Validate the frontend mock + actual flow open->edit/archive->evidence->cut
  revision->export->import dry-run->confirm->run-pin.
- **Reproducibility**: independently confirm `EvaluationRun.dataset_version_id`
  is NEVER rewritten by any authoring action and that an old run still resolves
  its exact snapshot. Confirm all-false mutation guard at response + data level
  (no published/candidate/prompt/extraction/evaluation-score mutation).
- Run selected MVP6.1/earlier regression tests + smokes BE/FE touched; confirm
  additive-only and candidate/published separation intact.
- Recommend: MVP6.4 thin closeout, targeted Wave41 hardening, or PM redesign.
  Exact commands/artifacts; no leftover listeners on 8000/5173; `git diff --check`.
