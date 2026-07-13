# Next Orders - Wave 54

Status: `MVP6.11 ONTOLOGY PACKS THIN IMPLEMENTATION`
Date: 2026-07-08

Wave53 closed MVP6.11 contract-first planning as PASS. Wave54 implements the
smallest deterministic READ-ONLY pack-catalog + dry-run apply-preview slice.

```text
open project Ontology Packs (BUILD group, after Ontology)
-> catalog (3 mock packs + element counts) -> pack detail
-> run dry-run apply-preview -> deterministic would-add/would-modify DRAFT items + disposition + compatibility rollup
-> (nothing applied; no published-graph write; real apply routes through ontology-edit / governance; all-false 8-flag guard)
```

Sequence: PM (freeze G1/G3/G4 + G12 copy FIRST) -> Backend ∥ Frontend -> QA.

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read Wave53 artifacts: `docs/handoffs/wave-053/{PM,BACKEND,FRONTEND,QA}_REPORT.md`,
  `docs/pm/MVP6_11_ONTOLOGY_PACKS_BRIEF.md`, `docs/adr/0018-...md`,
  `docs/api/MVP6_11_ONTOLOGY_PACKS_API_CONTRACT_DRAFT.md`, `docs/api/openapi-mvp6-11-draft.json`,
  `docs/pm/MVP6_11_FRONTEND_UX_REQUIREMENTS.md`,
  `docs/backlog/INT6_11_ONTOLOGY_PACKS_ACCEPTANCE.md` (C1-C10, R1-R7, gates G1/G3/G4/G12).
- Follow the MVP6.9 connectors / MVP6.10 tenancy module precedents (process-local
  store + reset hook + fixtures). Reuse MVP1 ontology-element + `OntologyElementRef`
  by reference; NO renames. Apply the closed design language.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-054/{ROLE}_REPORT.md`.

## Scope Guard (ADR 0018 — read-only + dry-run)
- READ-ONLY catalog + DRY-RUN apply-preview only (3 endpoints). NO apply/install,
  no published-graph write, no draft mutation, no external fetch. The apply-preview
  CREATES NOTHING (no class/property/relation/change-request; DRAFT read-only for
  diff). Every response carries an all-false 8-flag `OntologyPackMutationGuard`.
- Real apply is deferred and routes through the existing MVP1 ontology-edit /
  MVP6.6 governance-application path. Authz = any project viewer; 403/404.
- Deterministic/byte-stable (modulo generated_at/preview_id) + bounded. Additive;
  no break of MVP1-MVP6.10 surfaces/smokes.

## PM Agent Order
Role: PM / MVP6.11 Implementation Scope Guard + Gate Freeze
Write report: `docs/handoffs/wave-054/PM_REPORT.md`
Backlog ID: `PM6-036`
Tasks: freeze G1 (`preview_id` compute-on-read/ephemeral — persists nothing), G3
(the DRAFT-diff basis + the fixture matrix: the 3 mock packs' elements vs a target
project's DRAFT so QA can exercise all 3 dispositions NEW/CONFLICT/DUPLICATE + 3
compatibilities COMPATIBLE/WARNING/INCOMPATIBLE), G4 (element-identity match rule:
what makes a pack element NEW vs CONFLICT vs DUPLICATE vs the DRAFT — e.g. by
element kind + stable key), and confirm the FE items G6 (notice-code vocab) / G7
(`generated_at` excluded from determinism) / G9 (invalid body -> 400 vs empty ->
200-BLOCKED) / mapped_ontology_ref nullability. Ratify G12 copy (H1 `온톨로지 팩`,
BUILD-group `Ontology Packs` LNB item after `Ontology`, detail/preview sub-views).
State each as one precise rule. Confirm scope unchanged (read-only, creates nothing).
Update `docs/backlog/MVP6_DRAFT_BACKLOG.md` if IDs (BE6-082+, FE6-100+, INT6-098+)
need recording. Validation: `git diff --check`; no apps/.

## Backend Agent Order
Role: Backend / MVP6.11 Runtime Thin Slice
Start condition: read `docs/handoffs/wave-054/PM_REPORT.md` (frozen G1/G3/G4).
Write report: `docs/handoffs/wave-054/BACKEND_REPORT.md`
Backlog IDs: `BE6-082` catalog + detail (3 mock packs), `BE6-083` apply-preview
(deterministic DRAFT-diff -> disposition + compat + bounded), `BE6-084` all-false
8-flag guard + creates-nothing guarantees, `BE6-085` OpenAPI export/alignment +
no-mutation regression guard.
Tasks: implement the 3 endpoints in a new module (e.g.
`apps/backend/app/modules/ontology_packs/`, registered additively) matching
`openapi-mvp6-11-draft.json` EXACTLY; deterministic process-local pack fixtures +
reset hook. apply-preview diffs pack elements vs the project's DRAFT ontology
(read-only) -> `PackPreviewItemDisposition` per G4 + `PackApplyCompatibility` rollup
+ bounded (item_cap/truncated/exact total) + `preview_only:true` + opaque
`preview_ref`; creates NOTHING. Every response carries the all-false 8-flag
`OntologyPackMutationGuard`. Reuse MVP1 ontology + `OntologyElementRef` by reference
(no renames). Focused tests (`tests/test_mvp6_11_ontology_packs_api.py`): catalog +
detail (3 packs, byte-stable); apply-preview deterministic/byte-stable + bounded +
all 3 dispositions + 3 compatibilities per the fixture matrix; BLOCKED non-crash-200
+ notices + zero fabricated items; invalid body 400; authz 403/404; DATA-LEVEL
no-mutation (ALL tables; no class/property/relation/change-request created
before==after every call incl. preview); all-false 8-flag guard; OpenAPI alignment.
Validation: `cd apps/backend && .venv/bin/pytest tests/test_mvp6_11_ontology_packs_api.py -q`
and `tests/test_mvp6_10_tenancy_api.py -q`; `ruff check app tests scripts`; OpenAPI
compare; `git diff --check`.

## Frontend Agent Order
Role: Frontend / MVP6.11 Ontology Packs surface
Start condition: read `docs/handoffs/wave-054/PM_REPORT.md`; coordinate with the
Backend report if contracts shift.
Write report: `docs/handoffs/wave-054/FRONTEND_REPORT.md`
Backlog IDs: `FE6-100` LNB item(BUILD/after Ontology) + route/IA + types/client/mocks,
`FE6-101` catalog + detail, `FE6-102` apply-preview result + states + "nothing
applied" banner, `FE6-103` mock + actual smoke.
Tasks: implement the Ontology Packs surface per `MVP6_11_FRONTEND_UX_REQUIREMENTS.md`:
add the `Ontology Packs` LNB item in BUILD after Ontology (single active LNB
preserved), H1 `온톨로지 팩`; catalog (3 pack cards + counts, NO install/apply
affordance) -> detail -> dry-run apply-preview result (would-add/modify DRAFT items +
`PackPreviewItemDisposition` NEW/CONFLICT/DUPLICATE + `PackApplyCompatibility`
COMPATIBLE/WARNING/INCOMPATIBLE + summary counts + truncation + `PackPreviewNotice`);
persistent "PREVIEW ONLY — nothing applied; real apply routes through ontology-edit/
governance" banner + live all-false 8-flag guard proof; D6 badges; loading/empty/
error/permission-limited + INCOMPATIBLE/BLOCKED states. NO install/apply/execute
affordance. Types/client/query/mocks match the frozen OpenAPI exactly; reuse by
reference (no rename). Add `npm run smoke:mvp6:packs:mock` and, if backend runnable,
`:actual`.
Validation: `npm run test`, `npm run build`, the new mock smoke (+ actual if
runnable), responsive 0-overflow re-check, `git diff --check`.

## QA Agent Order
Role: Integration / QA
Start condition: read Wave54 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-054/QA_REPORT.md`
Backlog IDs: `INT6-098` backend runtime, `INT6-099` frontend mock/API, `INT6-100`
creates-nothing + all-false guard data-level, `INT6-101` Wave54 closeout.
Tasks: update `docs/backlog/INT6_11_ONTOLOGY_PACKS_ACCEPTANCE.md` R1-R7 with verdicts.
Validate the 3 endpoints, deterministic/byte-stable preview, bounding/truncation, all
3 dispositions + 3 compatibilities, authz 403/404. INDEPENDENTLY verify at the DATA
level that NO pack call (esp. apply-preview) creates a class/property/relation/change-
request or mutates any table (before==after), and the 8-flag guard is all-false.
Validate the FE mock + actual flow (boot backend on SQLite). Run MVP6.10/earlier
regression + smokes touched; confirm additive-only + candidate/published separation
intact + single active LNB (now incl. Ontology Packs). Recommend closeout / hardening
/ redesign. Exact commands; no leftover listeners on 8000/5173; `git diff --check`.
