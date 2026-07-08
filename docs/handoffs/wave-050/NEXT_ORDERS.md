# Next Orders - Wave 50

Status: `MVP6.9 CONNECTORS THIN IMPLEMENTATION`
Date: 2026-07-08

Wave49 closed MVP6.9 Connectors contract-first planning as PASS. Wave50 implements
the smallest deterministic READ-ONLY catalog + DRY-RUN PREVIEW slice.

```text
open project Connectors (BUILD group, after Sources)
-> view connector catalog (3 mock kinds) + masked config schema
-> run dry-run import preview (mock config) -> deterministic would-be candidate-layer items + compatibility/summary
-> (nothing imported; no external call; no secret stored; real import would route through extraction->candidate->review->publish)
```

Sequence: PM (freeze G1/G5/G6/G7 + G12 copy FIRST) -> Backend ∥ Frontend -> QA.

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read Wave49 artifacts: `docs/handoffs/wave-049/{PM,BACKEND,FRONTEND,QA}_REPORT.md`,
  `docs/pm/MVP6_9_CONNECTORS_BRIEF.md`, `docs/adr/0016-...md`,
  `docs/api/MVP6_9_CONNECTORS_API_CONTRACT_DRAFT.md`, `docs/api/openapi-mvp6-9-draft.json`,
  `docs/pm/MVP6_9_FRONTEND_UX_REQUIREMENTS.md`,
  `docs/backlog/INT6_9_CONNECTORS_ACCEPTANCE.md` (C1-C8, R1-R8, gates G1/G5/G6/G7/G12).
- Follow the MVP6.8 copilot / MVP6.7 impact module precedents (process-local store +
  reset hook). Reuse MVP5 masked-secret/import-dry-run + candidate + `OntologyElementRef`
  + `Role` by reference; NO renames. Masked secrets only; NON-SECRET placeholders.
- Apply the closed design language. Use `docs/handoffs/REPORT_TEMPLATE.md`; finish
  with role reports in `docs/handoffs/wave-050/{ROLE}_REPORT.md`.

## Scope Guard (ADR 0016)
- READ-ONLY catalog + DRY-RUN preview only. No external write, no live/scheduled
  sync, no real network/credential execution (mock connectors on fixtures), no
  plugin code execution. Preview CREATES NOTHING (no candidate/source/extraction;
  published graph untouched) and is deterministic/byte-stable + independent of any
  secret value. Every response carries an all-false 9-flag `ConnectorMutationGuard`.
- Masked secrets only: `raw_secret_present:false`; no raw secret shown/entered/
  returned/persisted/logged. Authz = any project-read member; 403/404 per contract.
- Additive; no break of MVP1-MVP6.8 surfaces/smokes.

## PM Agent Order
Role: PM / MVP6.9 Implementation Scope Guard + Gate Freeze
Write report: `docs/handoffs/wave-050/PM_REPORT.md`
Backlog ID: `PM6-032`
Tasks: freeze G1 (`preview_id` persist-vs-compute — recommend compute-on-read /
ephemeral since preview persists nothing), G5 (per-kind fixture + `source_locator`
shape), G6 (`warnings`/`blocked_reasons` element shape), G7 (optional `generated_at`),
and G12 copy (H1 `커넥터` vs `Connectors` + KO glosses; ratify the BUILD/after-Sources
LNB placement). State each as one precise rule. Confirm scope unchanged (read-only,
dry-run, creates nothing, masked secrets, all-false guard). Update
`docs/backlog/MVP6_DRAFT_BACKLOG.md` if IDs (BE6-070+, FE6-090+, INT6-076+) need
recording. Validation: `git diff --check`; no apps/.

## Backend Agent Order
Role: Backend / MVP6.9 Runtime Thin Slice
Start condition: read `docs/handoffs/wave-050/PM_REPORT.md` (frozen G1/G5/G6/G7).
Write report: `docs/handoffs/wave-050/BACKEND_REPORT.md`
Backlog IDs: `BE6-070` catalog + config-schema (masked), `BE6-071` dry-run
import-preview (deterministic fixture-derived would-be candidate items + compat/
summary + bounding/truncation), `BE6-072` all-false 9-flag guard + no-secret + creates-
nothing guarantees, `BE6-073` OpenAPI export/alignment + no-mutation regression guard.
Tasks: implement the 3 endpoints in a new module (e.g. `apps/backend/app/modules/connectors/`,
registered additively) matching `openapi-mvp6-9-draft.json` EXACTLY; deterministic
process-local (per G1) + fixtures (per G5). Preview creates NOTHING; byte-stable;
secret-independent; masked secrets (`raw_secret_present:false`). Every response
carries the all-false 9-flag `ConnectorMutationGuard`. Reuse MVP5/candidate/
`OntologyElementRef`/`Role` by reference (no renames). Focused tests
(`tests/test_mvp6_9_connectors_api.py`): catalog + config-schema (secrets masked);
import-preview deterministic/byte-stable + secret-independent + bounded/truncated +
would-be candidate mapping; DATA-LEVEL no-mutation (ALL surface tables + no source/
candidate/extraction created before==after every call incl. preview); all-false
9-flag guard; no-raw-secret assertion; authz 403/404; OpenAPI alignment.
Validation: `cd apps/backend && .venv/bin/pytest tests/test_mvp6_9_connectors_api.py -q`
and `tests/test_mvp6_8_copilot_api.py -q`; `ruff check app tests scripts`; OpenAPI
compare; a no-raw-secret grep of new code/tests; `git diff --check`.

## Frontend Agent Order
Role: Frontend / MVP6.9 Connectors surface
Start condition: read `docs/handoffs/wave-050/PM_REPORT.md`; coordinate with the
Backend report if contracts shift.
Write report: `docs/handoffs/wave-050/FRONTEND_REPORT.md`
Backlog IDs: `FE6-090` LNB item(BUILD/after-Sources) + route/IA + types/client/mocks,
`FE6-091` catalog + masked config form, `FE6-092` dry-run preview result + states +
"nothing imported" banner, `FE6-093` mock + actual smoke.
Tasks: implement the Connectors surface per `MVP6_9_FRONTEND_UX_REQUIREMENTS.md`:
catalog (3 kinds, no add/register affordance), masked config form (SECRET fields
masked/placeholder, no raw secret entered), dry-run preview action + result
(would-be candidate items counts + capped sample + `mapped_ontology_class_ref` +
compatibility/summary + truncation), persistent "PREVIEW ONLY — nothing imported;
real run routes through extraction->candidate->review->publish" banner + live all-
false 9-flag guard + `raw_secret_present:false` proof line; D6 badges for status/
compatibility; loading/empty/error/permission-limited + INCOMPATIBLE/BLOCKED states.
NO connect/import/sync/execute affordance. Types/client/query/mocks match the frozen
OpenAPI exactly; reuse shapes by reference (no rename). Add `npm run smoke:mvp6:connectors:mock`
and, if backend runnable, `:actual`.
Validation: `npm run test`, `npm run build`, the new mock smoke (+ actual if
runnable), responsive 0-overflow re-check, `git diff --check`.

## QA Agent Order
Role: Integration / QA
Start condition: read Wave50 PM, Backend, Frontend reports.
Write report: `docs/handoffs/wave-050/QA_REPORT.md`
Backlog IDs: `INT6-076` backend runtime, `INT6-077` frontend mock/API, `INT6-078`
read-only/creates-nothing/no-secret + all-false guard data-level, `INT6-079` Wave50 closeout.
Tasks: update `docs/backlog/INT6_9_CONNECTORS_ACCEPTANCE.md` R1-R8 with verdicts.
Validate the 3 endpoints, deterministic/byte-stable + secret-independent preview,
bounding/truncation, would-be candidate mapping, compatibility/status, authz 403/404.
INDEPENDENTLY verify at the DATA level that NO connector call (esp. import-preview)
creates a source/candidate/extraction or mutates any table (before==after), the
9-flag guard is all-false, and `raw_secret_present:false` with no raw secret in any
response/log. Validate the FE mock + actual flow (boot backend on SQLite as prior
waves). Run MVP6.8/earlier regression + smokes touched; confirm additive-only +
candidate/published separation intact. Recommend closeout / hardening / redesign.
Exact commands; no leftover listeners on 8000/5173; `git diff --check`.
