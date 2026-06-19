# MVP 4 Prep Brief

Status: `FROZEN / WAVE 19 PM DECISION`
Date: 2026-06-19

MVP 4 turns the MVP 3 published graph into a daily quality, exploration, search,
and grounded-answer workspace. It must build on the closed MVP 3 rule set:
candidate graph and published graph remain separate, evidence remains required
for trust, and RAG/search must not mutate graph data.

## Goal

Raise the platform from review/publish workflow to operational quality and
graph utilization:

```text
Published graph + Evidence + Review history
-> Advanced quality evaluation
-> Model/prompt performance comparison
-> Advanced graph exploration
-> Integrated search
-> Grounded RAG answer
-> External graph/source/evidence API
```

## Entry Criteria

- MVP 3 product P0 is closed or Wave 18 QA has approved closeout with only P1
  follow-ups.
- `docs/api/openapi-mvp3-draft.json` remains the source for existing review,
  publish, published graph, and quality v0.1 contracts.
- MVP2 actual API regression remains PASS.
- MVP4 implementation does not start until PM decisions, backend contract
  draft, frontend field/UX review, and QA acceptance checklist exist.

## Wave19 PM Decision Freeze

The following decisions are frozen for Backend contract drafting, Frontend
field/state review, and QA `INT4-*` checklist creation.

| Area | Frozen decision |
|---|---|
| Quality score model | P0 uses explainable metric groups only. Weighted composite quality score is P1 and must not be required for MVP4 closeout. |
| Formula metadata | Every P0 metric formula declares `numerator`, `denominator`, `scope`, `time_window`, `breakdown_dimension`, and `drilldown_target`. |
| Evaluation dataset status | `EvaluationDatasetStatus` is `DRAFT`, `ACTIVE`, `ARCHIVED`; default is `DRAFT`. |
| Golden set item kinds | `GoldenSetItemKind` is `ENTITY`, `RELATION`, `PROPERTY_VALUE`, `EVIDENCE_LINK`. |
| Prompt experiment status | `PromptExperimentStatus` is `DRAFT`, `RUNNING`, `COMPLETED`, `CANCELLED`. |
| Evaluation dimensions | P0 comparisons support prompt version, model run, source type, class type, relation type, validation outcome, review decision, and correction pattern. |
| Search scope | Keyword search P0 covers published graph facts, source records/chunks, evidence chunks, and review/audit lineage context. |
| Vector boundary | MVP4 P0 defines the adapter contract and local fallback for chunk embedding/similar evidence. Production vector DB hardening remains P1. |
| RAG source boundary | RAG answer facts come only from published graph facts plus evidence/source chunks. Candidate graph facts are excluded from answer generation and citations. |
| Advanced graph explorer | P0 supports n-hop expansion, class/relation filters, quality overlay, source/evidence overlay, lineage panel, and current or selected published version context. |
| Graph explorer safety | Local demo P0 supports up to `max_hops=3`, default `max_hops=2`, and a response budget of `150` nodes / `300` edges. Larger requests return a safe-too-large state with suggested filters. |
| External API auth | MVP4 external read-only APIs use development auth only. Production API keys/service accounts stay MVP5 unless security scope is explicitly opened early. |
| Collaboration/SLA | Remains P1. No MVP4 P0 slice is promoted in Wave19. |

## P0 Product Scope

### Advanced Quality Metrics

MVP4 P0 extends quality beyond count/rate v0.1 with explainable metric groups.
It does not include a weighted composite quality score in P0:

- completeness: required properties/evidence coverage over published graph.
- consistency: ontology constraint and relation endpoint consistency.
- traceability: percentage of published facts with usable source/evidence and
  review lineage.
- validation pass rate: pass/warning/failed trend by project, source, ontology
  version, model, prompt version, and relation type.
- review approval rate: approved/modified/rejected distribution over reviewed
  candidates.
- duplicate rate: duplicate candidate or duplicate published fact indicators.
- relation density: relation count relative to entity count by class/domain.

P0 formulas must declare numerator, denominator, scope, time window, breakdown
dimension, and drilldown target. Backend DTOs should also preserve metric group,
formula id/name, unit, and value/rate shape when useful for UI explainers.
Weighted composite scoring, default weights, and cross-metric rollup labels are
P1.

### Model/Prompt Performance Evaluation

MVP4 P0 should compare model runs and prompt versions using review outcomes and
validation outcomes:

- PromptVersion approval, rejection, modification, failed-validation, and
  missing-evidence rates.
- mandatory comparison dimensions: prompt version, model run, source type,
  class type, relation type, validation outcome, review decision, and
  correction pattern.
- relation type and class type error distribution.
- source type performance for structured and unstructured inputs.
- expert correction pattern summaries by field, relation endpoint, and reason.
- model run cost/latency/token fields only if already available or easy to add
  without external provider integration.

### Evaluation Dataset and Golden Set

MVP4 P0 needs a managed evaluation dataset concept before prompt/model
performance numbers are treated as product metrics:

- evaluation dataset: named project-scoped collection of source segments,
  candidate refs, evidence refs, and expected extraction/review targets.
- golden set: reviewed and frozen expected answers/facts used to score
  prompt/model runs.
- versioning: datasets and golden sets need version/id, owner, created time,
  status, and notes.
- dataset status enum: `DRAFT`, `ACTIVE`, `ARCHIVED`; new datasets default to
  `DRAFT`.
- golden item kind enum: `ENTITY`, `RELATION`, `PROPERTY_VALUE`,
  `EVIDENCE_LINK`.
- provenance: every golden item must trace to source/evidence and reviewer
  decision.

### Prompt A/B Structure

P0 should define the structure for A/B comparison without requiring automated
traffic splitting:

- experiment with name, hypothesis, dataset/golden set, control prompt version,
  treatment prompt version, model/provider, run window, and status.
- experiment status enum: `DRAFT`, `RUNNING`, `COMPLETED`, `CANCELLED`.
- evaluation run with result metrics by prompt/model/source/relation type.
- manual run creation is acceptable; automatic scheduling is P1.

### Search, Vector, and RAG Boundaries

MVP4 search/RAG must be grounded and read-only.

- keyword search P0: published entity, published relation, source, evidence,
  and audit/review lineage search where useful.
- integrated search UI P0: a single entry point that separates result kinds and
  makes evidence/source context visible.
- vector search P0/P1 boundary: contract, adapter status, embedding target, and
  similar-evidence result shape are P0. Local fallback may return keyword-backed
  similar evidence or an explicit vector-unavailable state. Full vector DB
  operational hardening is P1.
- RAG answer P0: answer only from published graph plus evidence/source chunks;
  show cited evidence chunks and linked published graph facts.
- RAG exclusion: candidate graph facts must not be used as answer facts or
  citations, even when a candidate has strong evidence.
- RAG non-goal: no answer should create candidates, modify review decisions, or
  publish facts.
- unsafe/insufficient evidence behavior: return "not enough evidence" style
  state with source/evidence gaps rather than hallucinated claims.

### Advanced Graph Explorer

P0 graph explorer should focus on useful published graph investigation:

- n-hop expansion from a selected published entity.
- relation type and class filters.
- confidence/quality overlay derived from validation/review/publish lineage.
- source/evidence overlay.
- selected fact lineage panel.
- impact view for source, prompt, model, ontology version, or publish version.
- current published graph version by default, with explicit selected published
  version context when the user switches versions.
- local demo safety: default `max_hops=2`, maximum `max_hops=3`, and response
  budget of `150` nodes / `300` edges. If a query would exceed the budget, the
  API/UI must expose a safe-too-large state with counts or estimates and
  suggested filters instead of attempting an unsafe render.

Large graph performance optimization and server-side progressive expansion are
P1 after the safe-too-large state exists.

### Advanced Quality Dashboard

P0 dashboard should compare quality by:

- project, source, ontology version, prompt version, model run, relation type,
  class type, reviewer, and time range.
- top validation failure and correction reason types.
- trend over time for quality metrics and publish outcomes.
- drilldowns into review inbox, published graph, evidence, search results, and
  evaluation runs.

### RAG Answer Screen

P0 answer screen should show:

- user question.
- grounded answer.
- cited evidence chunks with source locator.
- linked published entities/relations.
- answer confidence or coverage state.
- "not enough evidence" and error states.

### Collaboration and SLA Ideas

Collaboration/SLA can start as P1 unless PM chooses a minimal P0 slice:

- comments on review tasks, published facts, evaluation runs, or quality alerts.
- assignee and due date for quality issues.
- SLA states such as on track, at risk, overdue.
- reviewer throughput and queue age dashboard widgets.

Wave19 decision: collaboration/SLA remains P1. Do not add P0 Backend or
Frontend implementation requirements for comments, assignment, due dates, SLA
states, or notifications in MVP4 unless a later PM order deliberately reopens
scope.

### External Graph/Source/Evidence API

MVP4 should expose read-only external API boundaries for consumers:

- graph entity lookup.
- relation lookup.
- source/evidence lookup.
- search endpoint.
- RAG answer endpoint.
- version/current snapshot selection.
- API responses must preserve evidence and published graph version context.

Development auth is sufficient for MVP4 P0. API keys, service accounts,
consumer key rotation, quota policy, and production RBAC/SSO integration remain
MVP5 unless security scope is explicitly opened early.

## Non-Goals

- Automatic graph mutation from RAG or search.
- Automatic approval.
- Production SSO/RBAC or full API key management.
- High-availability deployment.
- Full vector DB operations hardening before contract and local smoke exist.
- Enterprise observability, backup/restore, and multi-tenant governance.

## PM Decisions Needed Before Implementation

| Decision | Needed for | PM default |
|---|---|---|
| Composite quality score | Backend formula, dashboard labels, QA expected values | Frozen: explainable metric groups only in P0; weighted score P1. |
| Evaluation dataset status enum | Backend model/API, Frontend filters | `DRAFT`, `ACTIVE`, `ARCHIVED`. |
| Golden set item kinds | Backend DTO, QA fixture | `ENTITY`, `RELATION`, `PROPERTY_VALUE`, `EVIDENCE_LINK`. |
| Prompt experiment status enum | Backend/Frontend workflow | `DRAFT`, `RUNNING`, `COMPLETED`, `CANCELLED`. |
| Prompt/model evaluation dimensions | Backend metrics, Frontend filters, QA seed | prompt version, model run, source type, class type, relation type, validation outcome, review decision, correction pattern. |
| Search index scope | Backend adapter and UI tabs | P0 keyword across published graph, source, evidence, and lineage; vector similar evidence adapter/fallback contract P0, production hardening P1. |
| RAG source boundary | Backend answer API, QA acceptance | Published graph plus evidence/source chunks only. Candidate graph excluded from answer facts and citations. |
| Graph explorer safe limit | Backend graph query, Frontend render guard, QA seed | default `max_hops=2`, max `3`, budget `150` nodes / `300` edges, safe-too-large state required. |
| External API auth | Backend contract | Dev auth only for MVP4 unless MVP5 security scope is opened early. |
| Collaboration/SLA | Backend/Frontend/QA scope | P1; no P0 slice promoted in Wave19. |

## Wave19 Entry Criteria

Wave19 should be a contract-first wave, not broad implementation.

- PM freezes P0/P1 decisions in `docs/backlog/MVP4_DRAFT_BACKLOG.md`.
- Backend drafts MVP4 endpoint families, DTOs, enums, formula definitions, and
  OpenAPI artifact.
- Frontend reviews fields, states, empty/error behavior, IA, and drilldown needs
  before screens are built.
- QA writes `INT4-*` acceptance checklist with deterministic seed needs and
  MVP3 regression guard.
- No app code should implement broad MVP4 runtime until the above artifacts are
  coherent.
