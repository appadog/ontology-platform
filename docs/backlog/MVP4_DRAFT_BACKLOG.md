# MVP 4 Draft Backlog

Status: `FROZEN / WAVE 19 PM DECISION INPUT`
Date: 2026-06-19

MVP 4 covers advanced quality evaluation, model/prompt performance evaluation,
evaluation datasets/golden sets, prompt A/B structure, advanced graph
exploration, integrated search, grounded RAG, collaboration/SLA ideas, and
external graph/source/evidence APIs.

## MVP 4 Entry Gate

- [x] MVP 3 closeout accepted by QA.
- [x] MVP3 P1 follow-ups are separated from MVP4 P0 scope.
- [x] PM decisions in `docs/pm/MVP4_PREP_BRIEF.md` are reviewed and frozen
      for Wave19 contract drafting.
- [ ] Backend produces contract-first API/DTO draft before runtime
      implementation.
- [ ] Frontend reviews UX/field needs against the backend draft before broad UI
      implementation.
- [ ] QA produces `INT4-*` acceptance checklist and deterministic seed needs.

## Wave19 PM Freeze Summary

- MVP4 P0 quality uses explainable metric groups only. Weighted composite
  quality score, default weights, and cross-metric rollups are P1.
- P0 metric formula metadata must include `numerator`, `denominator`, `scope`,
  `time_window`, `breakdown_dimension`, and `drilldown_target`.
- `EvaluationDatasetStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`; default `DRAFT`.
- `GoldenSetItemKind`: `ENTITY`, `RELATION`, `PROPERTY_VALUE`,
  `EVIDENCE_LINK`.
- `PromptExperimentStatus`: `DRAFT`, `RUNNING`, `COMPLETED`, `CANCELLED`.
- Prompt/model evaluation dimensions: prompt version, model run, source type,
  class type, relation type, validation outcome, review decision, correction
  pattern.
- Search P0: keyword across published graph facts, source records/chunks,
  evidence chunks, and review/audit lineage context.
- Vector/similar evidence P0: adapter contract, embedding target, adapter
  status, similar-evidence result shape, and local fallback. Production vector
  DB operational hardening is P1.
- RAG P0: read-only answers from published graph facts plus evidence/source
  chunks only. Candidate graph facts are excluded from answer generation and
  citations.
- Advanced graph explorer P0: n-hop expansion, class/relation filters, quality
  overlay, source/evidence overlay, lineage panel, and current or selected
  published graph version context.
- Graph explorer local demo guard: default `max_hops=2`, maximum `max_hops=3`,
  response budget `150` nodes / `300` edges, and safe-too-large state.
- External API auth: development auth only in MVP4; production API keys/service
  accounts remain MVP5 unless explicitly opened early.
- Collaboration/SLA remains P1. No tiny P0 slice is promoted in Wave19.

## PM Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| PM4-001 | P0 | PM | Advanced quality metric framework | MVP3 quality v0.1 closeout | P0 is explainable metric groups only; weighted composite score is P1; metric groups define numerator, denominator, scope, time window, breakdown dimension, drilldown target, and P0/P1 formula boundary |
| PM4-002 | P0 | PM | Evaluation dataset and golden set policy | PM4-001 | dataset/golden set purpose, ownership, status, versioning, evidence provenance, default `DRAFT` status, and item kinds `ENTITY`/`RELATION`/`PROPERTY_VALUE`/`EVIDENCE_LINK` are documented |
| PM4-003 | P0 | PM | Model/prompt performance policy | PM4-002 | prompt/model comparison metrics support prompt version, model run, source type, class type, relation type, validation outcome, review decision, and correction pattern |
| PM4-004 | P0 | PM | Prompt A/B structure | PM4-002, PM4-003 | experiment/run/status model uses `DRAFT`/`RUNNING`/`COMPLETED`/`CANCELLED` and does not require automated traffic splitting |
| PM4-005 | P0 | PM | Search/RAG boundary | MVP3 published graph closeout | keyword, vector adapter/fallback, and RAG boundaries are documented; RAG reads published graph facts plus evidence/source chunks only and excludes candidate graph facts |
| PM4-006 | P0 | PM | Graph explorer and quality dashboard UX priorities | PM4-001, PM4-005 | n-hop, filters, overlays, lineage, version context, dashboard comparisons, drilldowns, max hop/depth, and safe-too-large state are prioritized |
| PM4-007 | P1 | PM | Collaboration/SLA policy | PM4-006 | comments, assignment, due date, SLA states, queue-age ideas, and notifications remain P1; no Wave19 P0 slice is promoted |
| PM4-008 | P0 | PM | External graph/source/evidence API policy | PM4-005 | read-only API boundaries, evidence/version requirements, and dev-auth-only MVP4 boundary are documented |

## Backend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| BE4-001 | P0 | Backend | Advanced quality metrics contract | PM4-001 | API returns metric groups with values/rates, formula metadata, scope, time window, breakdown dimension, drilldown hints, and no required composite quality score |
| BE4-002 | P0 | Backend | Evaluation dataset/golden set model draft | PM4-002 | project-scoped dataset, version, status, golden item, evidence refs, and reviewer provenance DTOs are drafted |
| BE4-003 | P0 | Backend | Evaluation run and prompt/model performance contract | PM4-003, PM4-004 | endpoints can compare prompt versions/model runs by approval, rejection, modification, validation failure, missing evidence, relation type, source type, and correction pattern |
| BE4-004 | P0 | Backend | Keyword search API | PM4-005 | search returns typed result groups for published entities, published relations, sources, evidence, and lineage context |
| BE4-005 | P0 | Backend | Vector/similar evidence adapter boundary | PM4-005 | contract identifies embedding target, adapter status, similar evidence result shape, and local fallback if vector DB is unavailable; production vector hardening is P1 |
| BE4-006 | P0 | Backend | Grounded RAG answer API draft | PM4-005 | answer response includes answer text, cited evidence chunks, linked published graph facts, coverage/confidence state, and insufficient-evidence state |
| BE4-007 | P0 | Backend | Advanced published graph explorer API | PM4-006 | n-hop expansion, relation/class filters, quality overlay, source/evidence overlay, lineage panel data, selected published version context, max hop/depth limits, and safe-too-large state are available from published graph APIs |
| BE4-008 | P0 | Backend | External read-only graph/source/evidence API draft | PM4-008 | read-only endpoints expose graph entity, relation, source, evidence, search, and current/version selection with evidence context under dev auth only |
| BE4-009 | P0 | Backend | MVP4 OpenAPI draft/export | BE4-001~BE4-008 | machine-readable OpenAPI artifact exists and parses; existing MVP3 paths remain stable or changes are documented |
| BE4-010 | P1 | Backend | Collaboration/SLA backend model | PM4-007 | comments, assignee, due date, queue age, and SLA status can be represented if PM promotes the slice |

## Frontend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| FE4-001 | P0 | Frontend | Advanced quality dashboard IA/UX review | PM4-001, BE4-001 | frontend field needs, filters, trends, drilldowns, empty/error states, formula explainers, and absence of P0 composite score are documented before implementation |
| FE4-002 | P0 | Frontend | Model/prompt performance UI review | PM4-003, BE4-003 | comparison tables/charts, correction pattern drilldowns, and source/relation filters are specified |
| FE4-003 | P0 | Frontend | Evaluation dataset/golden set UI review | PM4-002, BE4-002 | dataset list/detail, golden item provenance, version/status, and review states are specified |
| FE4-004 | P0 | Frontend | Advanced graph explorer design | PM4-006, BE4-007 | n-hop flow, class/relation filters, overlays, version selector/context, lineage panel, and safe-too-large states are specified |
| FE4-005 | P0 | Frontend | Integrated search UI design | PM4-005, BE4-004 | result grouping across published graph/source/evidence/lineage, filters, source/evidence context, keyboard/search states, and no-result/error states are specified |
| FE4-006 | P0 | Frontend | RAG answer screen design | PM4-005, BE4-006 | answer, citations, evidence chunks, linked published graph facts, candidate-exclusion copy, coverage/insufficient-evidence states, and audit-friendly copy are specified |
| FE4-007 | P0 | Frontend | External API consumer documentation surface review | PM4-008, BE4-008 | minimal UI/docs needs for read-only graph/source/evidence API under dev auth are identified |
| FE4-008 | P1 | Frontend | Collaboration/SLA UI concept | PM4-007, BE4-010 | comments, assignment, due date, SLA state, queue-age display, and notification ideas are scoped |

## QA / Integration Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| INT4-001 | P0 | QA | MVP4 contract review | BE4-009, FE4-001~FE4-007 | OpenAPI parses; backend DTOs match frontend field review; MVP3 contract regressions are documented |
| INT4-002 | P0 | QA | Advanced quality metric consistency | BE4-001, FE4-001 | seeded data recomputes metric values, rates, formula metadata, scopes, and drilldown hints |
| INT4-003 | P0 | QA | Evaluation dataset/golden set smoke | BE4-002, FE4-003 | dataset/golden set can be listed and inspected with version, status, evidence provenance, and item kinds |
| INT4-004 | P0 | QA | Prompt/model evaluation smoke | BE4-003, FE4-002 | prompt/model performance metrics match seeded review/validation/correction outcomes |
| INT4-005 | P0 | QA | Search and RAG grounding smoke | BE4-004~BE4-006, FE4-005~FE4-006 | search result groups render; RAG answer cites evidence and linked published graph facts; insufficient evidence state appears when needed |
| INT4-006 | P0 | QA | Advanced graph explorer separation test | BE4-007, FE4-004 | graph explorer uses published graph APIs, not candidate graph facts; filters/overlays/lineage render from seeded data |
| INT4-007 | P0 | QA | MVP3 regression | MVP3 closeout | validation/review/correction/audit/publish/published graph/quality actual smoke remains passing |
| INT4-008 | P0 | QA | External API smoke | BE4-008, FE4-007 | read-only graph/source/evidence/search endpoints return versioned evidence-aware responses under dev auth only |
| INT4-009 | P1 | QA | Collaboration/SLA smoke | BE4-010, FE4-008 | comments/assignment/SLA states pass if PM promotes the slice |

## MVP 4 Acceptance Draft

- Users can compare advanced quality metrics by project, source, ontology
  version, prompt version, model run, relation type, class type, reviewer, and
  time range.
- Users can inspect the formula metadata behind quality values and drill into
  affected review, publish, graph, evidence, or evaluation records.
- MVP4 P0 does not require a weighted composite quality score. Any composite
  label or weighting is P1 unless a later PM order reopens scope.
- Users can manage or inspect evaluation datasets and golden sets with
  evidence-backed expected facts.
- Users can compare prompt/model performance using review outcomes, validation
  outcomes, and expert correction patterns.
- Users can search published entities, published relations, source records, and
  evidence from one integrated search UI, with lineage context when available.
- RAG answers are grounded in published graph facts and cited evidence chunks.
  Candidate graph facts are excluded. If evidence is insufficient, the UI must
  show an insufficient-evidence state.
- Advanced graph explorer uses published graph APIs and provides n-hop,
  relation/class filters, quality overlays, evidence overlays, and lineage
  detail with current or selected published graph version context and
  safe-too-large behavior.
- External graph/source/evidence APIs are read-only and preserve current/version
  and evidence context under MVP4 development auth.
- MVP3 validation/review/publish/published graph/quality actual smoke remains
  passing.

## Scope Limits

- No automatic approval.
- No candidate graph facts in RAG answers.
- No graph mutation from search or RAG.
- No production SSO/RBAC/API key management unless MVP5 security scope is
  opened early.
- No collaboration/SLA P0 implementation in Wave19/MVP4 P0 freeze.
- No production vector DB hardening requirement before adapter/fallback contract
  and local smoke pass.
- No high-availability or enterprise operations scope.
- No broad MVP4 app implementation before Wave19 contract-first review.

## Wave19 Contract-First Scope

PM decisions needed before implementation:

- P0 metric formula list and explicit P1 boundary for weighted composite score.
- Evaluation dataset/golden set statuses and item kinds.
- Prompt experiment status enum and minimum A/B comparison fields.
- Keyword/vector/RAG boundary and local fallback when vector DB is unavailable.
- Advanced graph explorer P0 seed size, max hop/depth, version context, and
  safe-too-large expectation.
- External API auth boundary for MVP4 local/dev use.
- Collaboration/SLA P1 boundary.

Backend contract-first draft scope:

- Endpoint families and DTOs for quality metrics, datasets/golden sets,
  evaluation runs, search, vector/similar evidence, RAG answer, graph explorer,
  and external read-only APIs.
- Formula metadata, drilldown hints, evidence refs, published graph version
  refs, and insufficient-evidence states.
- OpenAPI draft/export and migration implications.

Frontend field/UX review scope:

- Field/state review for each endpoint family before broad screens.
- IA for quality, evaluation, graph explorer, search, and RAG.
- Loading, empty, error, insufficient-evidence, no-result, and stale-version
  states.
- Drilldown paths back to review, publish, evidence, and published graph.

QA acceptance checklist scope:

- `INT4-*` contract checks.
- deterministic seed requirements.
- metric recomputation assertions.
- search/RAG grounding assertions.
- published graph separation regression.
- MVP3 actual smoke regression.
