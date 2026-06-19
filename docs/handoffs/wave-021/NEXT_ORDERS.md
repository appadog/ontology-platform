# Next Orders - Wave 21

Status: `MVP 4 FOCUSED HARDENING`
Date: 2026-06-19

Wave 20 delivered a useful MVP4 thin slice, but QA returned
`FAIL / WAVE21 HARDENING REQUIRED`. Wave 21 is hardening only. Do not expand
MVP4 product depth or start MVP5 work.

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read Wave20 reports:
  - `docs/handoffs/wave-020/PM_REPORT.md`
  - `docs/handoffs/wave-020/BACKEND_REPORT.md`
  - `docs/handoffs/wave-020/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-020/QA_REPORT.md`
- Read core MVP4 references:
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `docs/api/MVP4_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp4-draft.json`
  - `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/adr/0007-mvp4-search-rag-read-only-boundary.md`
- Use `docs/handoffs/REPORT_TEMPLATE.md`.
- Finish by writing your role report in `docs/handoffs/wave-021/{ROLE}_REPORT.md`.

## Execution Sequence

1. PM records the external envelope comparison decision and confirms no scope
   expansion.
2. Backend and Frontend harden in parallel after PM report exists.
3. QA reruns targeted gates after Backend and Frontend reports exist.

## PM Agent Order

Role: PM / Architecture Hardening Decision

Write report:

- `docs/handoffs/wave-021/PM_REPORT.md`

Primary backlog:

- `INT4-001`
- `INT4-007`
- `INT4-008`

Tasks:

- Decide and record the OpenAPI envelope comparison rule.
- Commander default decision:
  - Accept concrete external envelope schemas as the actual runtime contract.
  - Do not require standalone `ExternalApiEnvelopeBase` as an emitted OpenAPI
    component if all concrete external envelopes preserve:
    - `auth_mode`;
    - `project_id`;
    - optional published graph version context where relevant;
    - `data`.
  - QA should compare concrete envelope shapes instead of requiring the abstract
    base schema component.
- If you accept the default, update the smallest relevant document:
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md` or
  - `docs/api/MVP4_API_CONTRACT_DRAFT.md`
  to make the acceptance rule explicit.
- If you reject the default, order Backend to make `ExternalApiEnvelopeBase`
  appear as a standalone actual OpenAPI component and explain why.
- Reconfirm no scope expansion:
  - weighted composite score stays P1;
  - collaboration/SLA stays P1;
  - production vector DB hardening stays P1;
  - production API keys/service accounts stay MVP5.

Validation:

- `git diff --check` for changed PM/backlog/API/report files.

## Backend Agent Order

Role: Backend

Start condition:

- Read `docs/handoffs/wave-021/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-021/BACKEND_REPORT.md`

Primary backlog:

- `INT4-001`
- `INT4-008`
- Backend regression for `BE4-001`~`BE4-009`

Tasks:

- Fix external source read:
  - `GET /api/v1/external/sources/{source_id}` with
    `X-Dev-Auth: mvp4-dev` must return `200`, not `500`.
  - Avoid SQLAlchemy `MetaData()` collision with API `metadata` fields.
- Fix external evidence read:
  - `GET /api/v1/external/evidence/{evidence_id}` with
    `X-Dev-Auth: mvp4-dev` must return `200`, not `500`.
  - Ensure evidence metadata comes from the correct model field, not SQLAlchemy
    class metadata.
- Add or update focused tests for:
  - external source `200`;
  - external evidence `200`;
  - missing external dev auth `401`;
  - unsupported write methods remain blocked/absent;
  - concrete external envelope fields match PM decision.
- Rerun:
  - `pytest tests/test_mvp4_api.py -q`;
  - `pytest tests/test_mvp3_api.py -q`;
  - `ruff check app tests scripts`;
  - fresh SQLite Alembic + `scripts/seed_mvp4.py`;
  - actual OpenAPI export and JSON parse;
  - critical path/schema/enum compare, aligned to the PM envelope decision.
- Do not add persistence for evaluation artifacts in this wave unless required
  to fix the blocker.

Validation:

- Commands above.
- `git diff --check` for changed backend/report files.

## Frontend Agent Order

Role: Frontend / UIUX Hardening

Start condition:

- Read `docs/handoffs/wave-021/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-021/FRONTEND_REPORT.md`

Primary backlog:

- `INT4-005`
- `INT4-006`
- `INT4-007`
- Frontend regression for `FE4-001`~`FE4-007`

Tasks:

- Restore `npm run smoke:mvp3:actual` PASS.
  - Preferred: preserve legacy smoke-visible markers in the upgraded
    published graph route without weakening the product UI.
  - Only update the smoke contract if PM explicitly approves that route
    behavior changed.
- Add formal `smoke:mvp4:actual` package script if practical.
  - It should run against a Backend actual API and assert the actual route
    markers QA found missing:
    - RAG route: `Grounded RAG` marker plus candidate-exclusion copy.
    - Graph route: `SAFE TOO LARGE` and published-only marker/state.
    - Prompt route: telemetry-unavailable marker when telemetry fields are
      absent.
    - External API route: `DEV_AUTH` and `read-only` markers.
  - If actual smoke cannot be completed in this wave, harden route markers and
    document the remaining harness gap precisely.
- Keep `smoke:mvp4:mock` passing.
- Keep MVP4 routes project-scoped and global LNB stable.
- Do not add weighted composite score or collaboration/SLA UI.

Validation:

- `npm run test`.
- `npm run build`.
- `npm run smoke:mvp4:mock`.
- `npm run smoke:mvp3:actual` against a fresh seeded backend if practical.
- `npm run smoke:mvp4:actual` if added.
- `git diff --check` for changed frontend/report files.

## QA Agent Order

Role: Integration / QA

Start condition:

- Read Wave21 PM, Backend, and Frontend reports first.

Write report:

- `docs/handoffs/wave-021/QA_REPORT.md`

Primary backlog:

- Targeted rerun: `INT4-001`, `INT4-005`, `INT4-006`, `INT4-007`, `INT4-008`
- Confirm no regression in `INT4-003`, `INT4-004`
- `INT4-009` remains P1 unless PM promotes it

Tasks:

- Re-run Backend focused tests, MVP3 backend regression, ruff, seed, and
  OpenAPI critical compare.
- Re-run external API smoke for graph/entity/relation/source/evidence/search/RAG:
  - valid dev auth returns `200`;
  - missing dev auth returns `401`;
  - write methods remain blocked/absent.
- Re-run frontend tests/build/mock smoke.
- Re-run `npm run smoke:mvp3:actual`.
- Re-run `npm run smoke:mvp4:actual` if provided; otherwise run the one-off
  actual route probe and record remaining gaps.
- Reclassify `INT4-*`.
- Recommend Wave22:
  - hardening again if any `FAIL` remains;
  - MVP4 expansion if targeted failures are closed and remaining items are
    cleanly `PASS` or accepted P1 follow-ups.

Validation:

- `python3 -m json.tool` for OpenAPI and seed/smoke artifacts.
- `git diff --check` for changed QA/report files.

## Commander Notes

- Wave21 is not allowed to expand MVP4 scope.
- The preferred PM decision is to accept concrete external envelopes instead of
  requiring `ExternalApiEnvelopeBase` as a standalone actual OpenAPI component.
- MVP5 remains blocked until MVP4 runtime acceptance is closed or explicitly
  accepted with P1 follow-ups.
