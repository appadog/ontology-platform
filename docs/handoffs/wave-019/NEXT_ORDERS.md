# Next Orders - Wave 19

Status: `MVP 4 CONTRACT-FIRST PLANNING`
Date: 2026-06-19

Wave 19 opens MVP4 as a contract-first planning wave. Do not implement broad
MVP4 runtime/UI code in this wave. Close the PM decisions first, then draft the
Backend contract, then review Frontend field/state/IA needs, then let QA turn
the aligned contract into an executable INT4 checklist.

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read `docs/pm/MVP4_PREP_BRIEF.md`.
- Read `docs/backlog/MVP4_DRAFT_BACKLOG.md`.
- Read `docs/pm/MVP3_CLOSEOUT_CHECKLIST.md` and `docs/handoffs/wave-018/QA_REPORT.md`
  for the closed MVP3 baseline.
- Preserve MVP3 actual smoke and MVP2 regression as future gates.
- Use `docs/handoffs/REPORT_TEMPLATE.md` for your report.
- Finish by writing your role report in `docs/handoffs/wave-019/{ROLE}_REPORT.md`.
- Treat report creation as part of completion.

## Execution Sequence

1. PM runs first and freezes MVP4 P0/P1 decisions.
2. Backend reads PM report and drafts API/DTO/OpenAPI contracts.
3. Frontend reads PM report plus Backend draft and performs field/state/IA review.
4. QA reads PM, Backend, and Frontend reports and writes the INT4 acceptance checklist.

## PM Agent Order

Role: PM / Architecture

Write report:

- `docs/handoffs/wave-019/PM_REPORT.md`

Primary backlog:

- `PM4-001` Advanced quality metric framework
- `PM4-002` Evaluation dataset and golden set policy
- `PM4-003` Model/prompt performance policy
- `PM4-004` Prompt A/B structure
- `PM4-005` Search/RAG boundary
- `PM4-006` Graph explorer and quality dashboard UX priorities
- `PM4-007` Collaboration/SLA policy
- `PM4-008` External graph/source/evidence API policy

Tasks:

- Freeze whether MVP4 P0 uses explainable metric groups only or includes a
  weighted composite quality score.
- Freeze P0 metric formula metadata requirements: numerator, denominator,
  scope, time window, breakdown dimension, and drilldown target.
- Freeze evaluation dataset status enum. Default: `DRAFT`, `ACTIVE`, `ARCHIVED`.
- Freeze golden set item kinds. Default: `ENTITY`, `RELATION`, `PROPERTY_VALUE`,
  `EVIDENCE_LINK`.
- Freeze prompt experiment status enum. Default: `DRAFT`, `RUNNING`,
  `COMPLETED`, `CANCELLED`.
- Freeze minimum prompt/model evaluation dimensions: prompt version, model run,
  source type, class type, relation type, validation outcome, review decision,
  correction pattern.
- Freeze search scope: keyword P0 across published graph, source, evidence, and
  lineage context; vector/similar evidence adapter boundary may be staged.
- Freeze RAG source boundary: published graph plus evidence/source chunks only;
  candidate graph is excluded from answer facts.
- Freeze advanced graph explorer P0 behavior: n-hop expansion, class/relation
  filters, quality overlay, source/evidence overlay, lineage panel, current or
  selected published version context.
- Freeze graph explorer seed/performance expectation for local demo, including
  max hop/depth and safe too-large state.
- Freeze external API auth boundary: dev auth only for MVP4 unless MVP5
  security/API-key scope is opened early.
- Decide whether collaboration/SLA remains P1 or has a minimal MVP4 P0 slice.
- Update `docs/pm/MVP4_PREP_BRIEF.md` and `docs/backlog/MVP4_DRAFT_BACKLOG.md`
  with frozen decisions.
- Add an ADR only if the decision creates a durable architecture boundary.

Validation:

- Run `git diff --check` for changed PM/backlog/report files.

Do not:

- Modify app runtime code.
- Create broad Backend/Frontend implementation tasks beyond contract-first
  readiness.

## Backend Agent Order

Role: Backend

Start condition:

- Read `docs/handoffs/wave-019/PM_REPORT.md` before contract drafting.

Write report:

- `docs/handoffs/wave-019/BACKEND_REPORT.md`

Primary backlog:

- `BE4-001` Advanced quality metrics contract
- `BE4-002` Evaluation dataset/golden set model draft
- `BE4-003` Evaluation run and prompt/model performance contract
- `BE4-004` Keyword search API
- `BE4-005` Vector/similar evidence adapter boundary
- `BE4-006` Grounded RAG answer API draft
- `BE4-007` Advanced published graph explorer API
- `BE4-008` External read-only graph/source/evidence API draft
- `BE4-009` MVP4 OpenAPI draft/export
- `BE4-010` Collaboration/SLA backend model, only if PM promotes it

Tasks:

- Draft `docs/api/MVP4_API_CONTRACT_DRAFT.md`.
- Draft a machine-readable OpenAPI planning artifact such as
  `docs/api/openapi-mvp4-draft.json`.
- Define endpoint families and DTOs for:
  - advanced quality metrics and formula metadata;
  - evaluation datasets, dataset versions, golden sets, and golden items;
  - evaluation runs and prompt/model performance summaries;
  - keyword search result groups;
  - vector/similar evidence adapter boundary and local fallback;
  - grounded RAG answer with citations, linked published facts, and
    insufficient-evidence state;
  - advanced published graph explorer n-hop expansion, filters, overlays,
    lineage, and version context;
  - external read-only graph/source/evidence/search/RAG API boundary.
- Preserve existing MVP3 endpoints and document any intentional extension.
- Identify enums, schema names, migration implications, seed needs, and adapter
  seams for later implementation.
- Keep JSON fields `snake_case`, DTO schema names `PascalCase`, and enum values
  uppercase snake case.
- Do not implement runtime MVP4 endpoints yet unless a tiny code change is
  needed only to export a draft artifact; prefer docs-first in this wave.

Validation:

- Parse the OpenAPI draft JSON with `python3 -m json.tool`.
- Run `git diff --check` for changed API/docs/report files.

## Frontend Agent Order

Role: Frontend / UIUX

Start condition:

- Read `docs/handoffs/wave-019/PM_REPORT.md`.
- Read Backend MVP4 contract draft and `docs/handoffs/wave-019/BACKEND_REPORT.md`.

Write report:

- `docs/handoffs/wave-019/FRONTEND_REPORT.md`

Primary backlog:

- `FE4-001` Advanced quality dashboard IA/UX review
- `FE4-002` Model/prompt performance UI review
- `FE4-003` Evaluation dataset/golden set UI review
- `FE4-004` Advanced graph explorer design
- `FE4-005` Integrated search UI design
- `FE4-006` RAG answer screen design
- `FE4-007` External API consumer documentation surface review
- `FE4-008` Collaboration/SLA UI concept, only if PM promotes it

Tasks:

- Create a field/state/IA review document, preferably
  `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`.
- Review whether Backend DTOs support product-grade UI states for:
  - advanced quality overview, breakdowns, formula explainers, trends, and
    drilldowns;
  - evaluation dataset list/detail/version and golden item provenance;
  - prompt/model comparison tables, charts, correction patterns, and filters;
  - graph explorer n-hop flow, overlays, selected fact lineage panel, version
    context, large-graph and empty states;
  - integrated search grouping, snippets, stale/partial-index state, no-result
    state, and result actions;
  - RAG answer, citations, linked facts, insufficient-evidence, error, and
    audit-friendly copy states;
  - external read-only API docs/consumer surface.
- Recommend route/IA structure without destabilizing closed MVP3 regression
  routes.
- Identify any DTO gaps or API shape changes needed before implementation.
- Keep this wave review-first. Do not build broad MVP4 screens yet.

Validation:

- Run `git diff --check` for changed frontend review/report files.
- No frontend build is required unless frontend code changes are made.

## QA Agent Order

Role: Integration / QA

Start condition:

- Read Wave19 PM, Backend, and Frontend reports first.

Write report:

- `docs/handoffs/wave-019/QA_REPORT.md`

Primary backlog:

- `INT4-001` MVP4 contract review
- `INT4-002` Advanced quality metric consistency
- `INT4-003` Evaluation dataset/golden set smoke
- `INT4-004` Prompt/model evaluation smoke
- `INT4-005` Search and RAG grounding smoke
- `INT4-006` Advanced graph explorer separation test
- `INT4-007` MVP3 regression
- `INT4-008` External API smoke
- `INT4-009` Collaboration/SLA smoke, only if PM promotes it

Tasks:

- Create `docs/backlog/INT4_MVP4_ACCEPTANCE.md`.
- Review PM freeze, Backend OpenAPI/API draft, and Frontend field/state/IA
  review for alignment.
- Define deterministic MVP4 seed requirements for:
  - advanced metric recomputation;
  - dataset/golden set examples;
  - prompt/model evaluation outcomes;
  - search result groups;
  - grounded RAG answer and insufficient-evidence state;
  - published graph n-hop explorer with candidate graph separation;
  - external read-only API smoke if P0/P1 scope allows.
- Include MVP3 regression guard using `npm run smoke:mvp3:actual` and existing
  Backend focused tests once MVP4 implementation starts.
- Mark any contract inconsistency with linked `PM4-*`, `BE4-*`, `FE4-*`,
  `INT4-*` IDs.

Validation:

- Parse `docs/api/openapi-mvp4-draft.json` if Backend creates it.
- Run `git diff --check` for changed QA/backlog/report files.

## Commander Notes

- MVP3 product P0 is closed as `PASS WITH P1 FOLLOW-UPS`.
- P1 follow-ups remain tracked but should not block MVP4 contract-first entry:
  Docker/PostgreSQL Compose smoke, formal Playwright suite, optional CORS
  expansion, Neo4j adapter write, and broader rollback UI.
- Wave20 should only open MVP4 thin implementation after Wave19 PM/Backend/
  Frontend/QA artifacts align.
