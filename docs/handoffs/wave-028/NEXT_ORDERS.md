# Next Orders - Wave 28

Status: `MVP6 CONTRACT-FIRST ENTRY + MVP6.1 THIN SLICE`
Date: 2026-06-20

The user has added `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`
as the roadmap extension after MVP5. Wave28 opens MVP6 work while preserving
all MVP1-MVP5 P0 closeout decisions. MVP6 is broad, so this wave must begin
with MVP6.1 only: Gold Set / Benchmark Studio.

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`.
- Preserve the MVP1-MVP5 invariants:
  - LLM output never writes directly to the published graph.
  - Candidate graph and published graph remain separate.
  - Candidate/evaluation items retain evidence and version context.
  - Agent/copilot functionality cannot mutate the published graph without
    explicit approval workflow.
- Use `docs/handoffs/REPORT_TEMPLATE.md`.
- Finish by writing your role report in `docs/handoffs/wave-028/{ROLE}_REPORT.md`.

## Scope Guard

- MVP6.1 only in this wave.
- Do not start Active Learning, Ontology Governance, Impact Simulation,
  Agentic Ops, multi-tenant, connector/plugin, ontology pack, or advanced
  visualization runtime implementation yet.
- Backend/Frontend implementation may proceed only after PM freezes the MVP6.1
  P0 thin-slice contract in `docs/handoffs/wave-028/PM_REPORT.md`.
- Release/demo packaging from Wave27 remains useful but does not block this
  MVP6 entry wave.

## Execution Sequence

1. PM/Architecture freezes the smallest MVP6.1 P0 thin slice.
2. Backend implements the approved additive API/runtime slice.
3. Frontend implements the approved mock/actual UI slice.
4. QA validates contract, runtime/API smoke, frontend smoke, and roadmap
   alignment.

## PM Agent Order

Role: PM / MVP6 Architecture

Write report:

- `docs/handoffs/wave-028/PM_REPORT.md`

Backlog IDs:

- PM6-001 MVP6.1 scope freeze
- PM6-002 Gold Set / Benchmark acceptance criteria
- PM6-003 Evaluation metric definitions
- PM6-004 MVP6 entry guardrails and exclusions

Tasks:

- Treat `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md` as the MVP6
  roadmap source.
- Create `docs/pm/MVP6_PREP_BRIEF.md`.
- Create `docs/backlog/MVP6_DRAFT_BACKLOG.md`.
- Create or update `docs/backlog/INT6_MVP6_ACCEPTANCE.md` with MVP6.1
  acceptance checklist.
- Decide the smallest coherent MVP6.1 P0 thin slice. Recommended starting
  boundary:
  - EvaluationDataset list/detail/create.
  - EvaluationSample list/create using source/sample metadata, not full parser
    rebuild.
  - GoldEntity and GoldRelation create/list.
  - EvaluationRun deterministic mock execution.
  - Metrics: entity precision/recall/F1, relation precision/recall/F1,
    relation direction accuracy, evidence match rate.
  - ErrorCase list/detail with candidate-vs-gold comparison context.
- Freeze statuses/enums, required version fields, and evidence/version
  traceability expectations.
- Explicitly exclude fine-tuning, real LLM benchmark execution, governance
  approval workflow, agent/copilot runtime, connector SDK, and multi-tenant
  runtime from Wave28.
- State whether Backend/Frontend may implement runtime/UI in this same wave.

Validation:

- `git diff --check` for PM docs and report.

## Backend Agent Order

Role: Backend / MVP6.1 Thin Runtime

Start condition:

- Read `docs/handoffs/wave-028/PM_REPORT.md`.
- Proceed only if PM report says same-wave implementation is approved.

Write report:

- `docs/handoffs/wave-028/BACKEND_REPORT.md`

Backlog IDs:

- BE6-001 Evaluation dataset schemas/API
- BE6-002 Gold entity/relation schemas/API
- BE6-003 Deterministic evaluation run service
- BE6-004 Metric and error-case read API
- BE6-005 OpenAPI export/update

Tasks:

- Implement an additive MVP6 backend module following existing FastAPI module
  patterns.
- Keep storage local/in-memory or existing DB-compatible according to current
  repo pattern; do not introduce new infrastructure.
- Provide P0 endpoints under `/api/v1` for the PM-approved EvaluationDataset,
  Gold Set, EvaluationRun, Metrics, and ErrorCase surfaces.
- Ensure every run stores ontology_version_id, prompt_version_id, model_name,
  model_run_id or a deliberate mock equivalent approved by PM.
- Make deterministic metric calculation testable without an external LLM.
- Do not touch published graph mutation paths.
- Update OpenAPI planning/export artifact for MVP6 if the project pattern
  supports it.

Validation:

- Focused backend tests for metrics and API happy path.
- `ruff check`.
- OpenAPI generation/parse if changed.
- `git diff --check`.

## Frontend Agent Order

Role: Frontend / MVP6.1 Product UI

Start condition:

- Read `docs/handoffs/wave-028/PM_REPORT.md`.
- Proceed only if PM report says same-wave implementation is approved.

Write report:

- `docs/handoffs/wave-028/FRONTEND_REPORT.md`

Backlog IDs:

- FE6-001 Evaluation Studio IA/route
- FE6-002 Gold Set Manager mock/actual boundary
- FE6-003 Benchmark Dashboard metric cards/table
- FE6-004 Error Case Explorer
- FE6-005 MVP6 API types/client/mocks

Tasks:

- Add the smallest product-quality MVP6.1 UI slice approved by PM.
- Keep LNB clean: add a stable top-level Evaluation/Benchmark area only if it
  fits the existing IA; ID-bound pages must remain contextual.
- Build mock fixtures first, then wire actual API client if Backend endpoints
  are available in this wave.
- Show metric cards, model/prompt/version context, gold-vs-candidate
  comparison, evidence match state, loading/empty/error states.
- Do not add Copilot, connector, multi-tenant, or governance runtime UI in this
  wave.
- Preserve existing MVP2-MVP5 route markers and smoke scripts.

Validation:

- `npm run test`.
- `npm run build`.
- Relevant route/API smoke if scripts exist or are added.
- `git diff --check`.

## QA Agent Order

Role: Integration / QA

Start condition:

- Read Wave28 PM, Backend, and Frontend reports first.

Write report:

- `docs/handoffs/wave-028/QA_REPORT.md`

Backlog IDs:

- INT6-001 MVP6.1 roadmap alignment
- INT6-002 Backend contract/runtime smoke
- INT6-003 Frontend mock/API contract consistency
- INT6-004 Gold Set to EvaluationRun happy path
- INT6-005 Regression guard for MVP1-MVP5 invariants

Tasks:

- Verify that the added MVP6 roadmap file is referenced by operating docs.
- Verify PM has frozen a small MVP6.1 P0 boundary and excluded the rest.
- Validate Backend API/OpenAPI and Frontend types/mocks for the MVP6.1 slice.
- Run or inspect a deterministic happy path:
  - create/list evaluation dataset;
  - add sample;
  - add gold entity/relation;
  - run deterministic evaluation;
  - view metrics and error cases.
- Confirm published graph mutation does not occur.
- Confirm existing MVP1-MVP5 safety invariants remain intact.
- Recommend:
  - MVP6.1 continue/expand;
  - targeted Wave29 hardening;
  - or stop for PM redesign.

Validation:

- Include exact commands, artifacts, and route/API checks.
- `git diff --check` for QA report.
