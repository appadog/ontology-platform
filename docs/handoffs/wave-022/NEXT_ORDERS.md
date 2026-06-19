# Next Orders - Wave 22

Status: `MVP 4 QUALITY RECOMPUTATION CLOSEOUT`
Date: 2026-06-19

Wave 21 closed targeted hardening. Wave 22 may proceed to MVP4 expansion, but
the first closeout target is `INT4-002`: prove advanced quality metrics are
recomputable from deterministic seed/raw API data.

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read Wave21 reports:
  - `docs/handoffs/wave-021/PM_REPORT.md`
  - `docs/handoffs/wave-021/BACKEND_REPORT.md`
  - `docs/handoffs/wave-021/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-021/QA_REPORT.md`
- Read MVP4 references:
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `docs/pm/MVP4_PREP_BRIEF.md`
  - `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/api/MVP4_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp4-draft.json`
- Keep Wave21 passing surfaces stable:
  - `npm run smoke:mvp3:actual`
  - `npm run smoke:mvp4:mock`
  - `npm run smoke:mvp4:actual`
  - external read-only API smoke
- Use `docs/handoffs/REPORT_TEMPLATE.md`.
- Finish by writing your role report in `docs/handoffs/wave-022/{ROLE}_REPORT.md`.

## Execution Sequence

1. PM defines the `INT4-002` recomputation proof standard.
2. Backend and Frontend implement proof/support in parallel after PM report.
3. QA reruns `INT4-002` and regression guards.

## PM Agent Order

Role: PM / Quality Closeout Criteria

Write report:

- `docs/handoffs/wave-022/PM_REPORT.md`

Primary backlog:

- `PM4-001`
- `BE4-001`
- `FE4-001`
- `INT4-002`

Tasks:

- Define exact closeout criteria for `INT4-002`.
- Specify accepted metric groups:
  - `COMPLETENESS`
  - `CONSISTENCY`
  - `TRACEABILITY`
  - `VALIDATION`
  - `REVIEW`
  - `DUPLICATE`
  - `RELATION_DENSITY`
- For each metric group, define:
  - numerator source;
  - denominator source;
  - scope;
  - time window;
  - breakdown dimension;
  - precision/tolerance;
  - drilldown target;
  - required evidence artifact.
- Decide whether recomputation proof should be:
  - a Backend seed output section;
  - a Backend QA endpoint;
  - a test artifact JSON;
  - or a combination.
- Preferred default:
  - Backend should produce a deterministic JSON proof artifact from seed/API
    data, and tests should compare API metric values to recomputed values.
  - Frontend should expose numerator/denominator/formula/drilldown context
    visibly but should not perform authoritative metric computation.
- Reconfirm no weighted composite quality score in P0.
- Update `docs/backlog/INT4_MVP4_ACCEPTANCE.md` only if the closeout criteria
  need more precise wording.

Validation:

- `git diff --check` for changed PM/backlog/report files.

## Backend Agent Order

Role: Backend

Start condition:

- Read `docs/handoffs/wave-022/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-022/BACKEND_REPORT.md`

Primary backlog:

- `BE4-001`
- `INT4-002`
- Regression guard for `INT4-001`, `INT4-003`~`INT4-008`

Tasks:

- Add deterministic recomputation proof for advanced quality metrics.
- The proof must cover all seven P0 groups:
  - completeness;
  - consistency;
  - traceability;
  - validation;
  - review;
  - duplicate;
  - relation density.
- Use deterministic seed/raw API data, not hand-written expected values only.
- Implement one or more of:
  - `scripts/seed_mvp4.py` output includes `quality_recompute_proof`;
  - a small script such as `scripts/verify_mvp4_quality_metrics.py`;
  - focused backend tests that recompute metrics from fixture/raw service data;
  - optional QA-facing endpoint only if PM permits.
- Each proof row should include:
  - `metric_id`;
  - `group`;
  - `api_value` or `api_rate`;
  - `recomputed_value` or `recomputed_rate`;
  - `numerator`;
  - `denominator`;
  - `formula_metadata`;
  - `drilldown_target`;
  - `passed`;
  - `tolerance`.
- Keep current public API compatible unless PM explicitly approves additions.
- Preserve no-composite-score boundary.
- Rerun backend validations:
  - `pytest tests/test_mvp4_api.py -q`
  - `pytest tests/test_mvp3_api.py -q`
  - `ruff check app tests scripts`
  - fresh SQLite Alembic + `scripts/seed_mvp4.py`
  - OpenAPI export/parse/critical compare
  - quality recomputation proof artifact parse

Validation:

- Commands above.
- `git diff --check` for changed backend/report files.

## Frontend Agent Order

Role: Frontend / UIUX Quality Evidence

Start condition:

- Read `docs/handoffs/wave-022/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-022/FRONTEND_REPORT.md`

Primary backlog:

- `FE4-001`
- `INT4-002`
- Regression guard for `INT4-005`~`INT4-007`

Tasks:

- Improve the advanced quality dashboard so QA can visually verify formula
  and recomputation context:
  - show numerator;
  - show denominator;
  - show rate/value;
  - show formula metadata;
  - show drilldown target;
  - show published graph version context;
  - show no weighted composite P0 score.
- If Backend exposes or seeds recomputation proof artifact data through API/mock
  fixtures, add mock/client support for it. If not, keep UI focused on visible
  formula context and report no API dependency.
- Add/adjust frontend tests or smoke assertions for:
  - formula explainer fields;
  - numerator/denominator text;
  - no composite score;
  - selected published version context.
- Keep Wave21 smoke passing:
  - `smoke:mvp4:mock`
  - `smoke:mvp3:actual`
  - `smoke:mvp4:actual`
- Do not add weighted composite score or collaboration/SLA.

Validation:

- `npm run test`
- `npm run build`
- `npm run smoke:mvp4:mock`
- `npm run smoke:mvp3:actual` if backend runtime is available
- `npm run smoke:mvp4:actual` if backend runtime is available
- `git diff --check` for changed frontend/report files.

## QA Agent Order

Role: Integration / QA

Start condition:

- Read Wave22 PM, Backend, and Frontend reports first.

Write report:

- `docs/handoffs/wave-022/QA_REPORT.md`

Primary backlog:

- `INT4-002`
- Regression guard for `INT4-001`, `INT4-003`~`INT4-008`
- `INT4-009` remains P1 unless PM promotes it

Tasks:

- Verify the Backend quality recomputation proof.
- Recompute or independently verify all seven groups from seed/API/proof
  artifacts:
  - completeness;
  - consistency;
  - traceability;
  - validation;
  - review;
  - duplicate;
  - relation density.
- Confirm every proof row has formula metadata, numerator, denominator,
  tolerance, and drilldown target.
- Confirm Frontend quality UI exposes enough formula/numerator/denominator
  context for user trust.
- Rerun regression guards:
  - Backend tests/ruff/seed/OpenAPI compare;
  - frontend test/build;
  - `smoke:mvp4:mock`;
  - `smoke:mvp3:actual`;
  - `smoke:mvp4:actual`;
  - external read-only API smoke as cheap sanity.
- Reclassify `INT4-002`.
- Recommend:
  - MVP4 closeout if `INT4-002` passes and remaining items are accepted P1;
  - another focused hardening wave if `INT4-002` remains partial/fail.

Validation:

- `python3 -m json.tool` for proof/seed/smoke artifacts.
- `git diff --check` for changed QA/report files.

## Commander Notes

- MVP4 should not move to MVP5 until `INT4-002` is closed or explicitly
  accepted as a P1 follow-up.
- Preferred outcome: Wave22 closes `INT4-002`, then Wave23 can prepare MVP4
  closeout or enter MVP5 contract-first planning.
