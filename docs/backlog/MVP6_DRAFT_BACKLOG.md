# MVP 6 Draft Backlog

Status: `MVP6.12 WAVE56 ADVANCED VISUALIZATION THIN IMPLEMENTATION — PM GATE FREEZE (PM6-038: G1/G3 frozen, G2/G5 confirmed, G12 ratified, fixture matrix READY/TOO_LARGE/EMPTY frozen); impl IDs BE6-088~091, FE6-105~108, INT6-103~106 (prev: MVP6.12 plan Wave55 PM6-037, ADR 0019, BE6-086~087, FE6-104, INT6-102; MVP6.11 impl Wave54 PM6-036, BE6-082~085, FE6-100~103, INT6-098~101)`
Date: 2026-07-09

MVP6 is broad. Wave28 and Wave29 closed MVP6.1 Gold Set / Benchmark Studio.
Wave30 freezes MVP6.2 Active Learning / Continuous Improvement as a
contract-first planning slice only. Wave31 hardens implementation-facing
command/state and DTO naming only. Wave32 may implement the smallest
deterministic runtime/UI slice for the frozen MVP6.2 P0 loop, but runtime
scope must not expand beyond the endpoint families and acceptance guardrails
listed below. Fine-tuning, live retraining, autonomous publish, automatic
policy enforcement, governance workflow, agents, connectors, tenant runtime,
ontology packs, and advanced visualization remain out of MVP6.2 P0.

## MVP6.1 Entry Gate

- [x] MVP6 source of truth exists:
      `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`.
- [x] PM freezes the Wave28 P0 thin slice in
      `docs/pm/MVP6_PREP_BRIEF.md`.
- [x] PM creates this PM/BE/FE/INT backlog split.
- [x] PM creates `docs/backlog/INT6_MVP6_ACCEPTANCE.md`.
- [x] Backend implements only the approved additive P0 API/runtime slice.
- [x] Frontend implements only the approved MVP6.1 mock/actual UI slice.
- [x] QA verifies deterministic Gold Set to EvaluationRun happy path.

## Wave28 PM Freeze Summary

- Same-wave Backend/Frontend implementation is approved after PM report is
  published.
- P0 center: Gold Set / Benchmark Studio deterministic thin slice.
- P0 demo path:
  `create dataset -> add sample -> add gold entity/relation -> run deterministic evaluation -> view metrics/errors`.
- P0 run mode: `DETERMINISTIC_MOCK`.
- Required version/run context: `ontology_version_id`, `prompt_version_id`,
  `model_name`, `model_run_id`, and `parser_version`.
- Gold entities and relations require sample/source evidence context.
- Evaluation results are analysis artifacts only; they cannot mutate candidate
  review, publish, or published graph state.
- Wave28 excludes real LLM benchmark execution, fine-tuning, active learning,
  governance workflow, copilot/agent runtime, connector/plugin SDK, and
  multi-tenant runtime.

## Wave29 PM Hardening Freeze Summary

- Wave29 is targeted MVP6.1 hardening only. It does not open MVP6.2 or any
  later MVP6 theme.
- Hardening center:
  - `smoke:mvp6:actual` reproducibility;
  - Frontend `candidate_ref` nested type/display alignment with Backend
    `EvaluationCandidateRef`;
  - process-local runtime store closeout decision.
- `smoke:mvp6:actual` may rely on the existing process-local evaluation store
  when the script creates or seeds all data it reads in the same actual backend
  runtime. A minimal dev-only reset/seed helper is allowed only if repeated
  actual smoke cannot be made reproducible without it.
- Durable DB models and Alembic persistence remain P1/P2 and are not required
  for MVP6.1 closeout.
- Wave29 excludes Active Learning, ontology governance, impact simulation,
  copilot/agent runtime, connector/plugin SDK, multi-tenant runtime, ontology
  packs, advanced visualization/storytelling, and real LLM benchmark provider
  execution.

## Wave29 Closeout Summary

- Wave29 PM, Backend, Frontend, and QA reports are PASS.
- `smoke:mvp6:actual` is accepted for MVP6.1 closeout. It self-creates
  project/dataset/sample/gold/run data against the actual backend runtime and
  verifies the actual frontend route markers.
- Frontend `EvaluationErrorCase.candidate_ref` is aligned to Backend
  `EvaluationCandidateRef`, including entity/relation context and nullable
  evidence fallback.
- Process-local evaluation runtime store is accepted for MVP6.1. Durable
  persistence, dataset revisioning, benchmark comparison, confusion matrix, and
  real LLM benchmark provider execution remain later work.
- MVP6.2 starts after MVP6.1 closeout as contract-first planning for Active
  Learning / Continuous Improvement.

## Wave30 MVP6.2 PM Freeze Summary

Wave30 defines the smallest coherent MVP6.2 P0 loop from Theme 2. Runtime
implementation must wait until Backend drafts an additive contract, Frontend
reviews fields/states/IA, and QA creates an executable acceptance checklist.

Frozen MVP6.2 P0 demo flow:

```text
select project
-> view learning signal summary
-> inspect correction pattern
-> inspect prompt suggestion
-> accept/dismiss suggestion
-> see decision audit note
```

P0 may analyze these existing source artifacts only:

- MVP3 review/correction history and review decision audit trails.
- MVP4 quality metrics and validation/quality drilldown evidence.
- MVP6.1 evaluation errors, metrics, run context, and candidate-vs-gold
  comparison artifacts.

P0 learning signal taxonomy:

- `RELATION_DIRECTION_CORRECTION`
- `CLASS_CONFUSION`
- `RELATION_TYPE_CONFUSION`
- `EVIDENCE_MISSING`
- `EVIDENCE_MISMATCH`
- `REPEATED_VALIDATION_FAILURE`
- `LOW_BENCHMARK_METRIC_CLUSTER`

P0 prompt suggestion states:

- `SUGGESTED`: generated from one or more learning signals and awaiting human
  decision.
- `ACCEPTED`: user records intent to use the suggestion in a future prompt
  version drafting workflow; no prompt version is mutated in P0.
- `DISMISSED`: user rejects or defers the suggestion with a reason.
- `SUPERSEDED`: suggestion is no longer current because a newer signal or
  suggestion covers the same pattern.

Wave31 decision vocabulary freeze:

- Request command values are `ACCEPT` and `DISMISS`.
- Resulting prompt suggestion states are `ACCEPTED` and `DISMISSED`.
- `SUPERSEDED` is a read-side state in MVP6.2 P0 and is not a human command.
- A decision command against a non-`SUGGESTED` suggestion returns a conflict by
  default unless a later PM freeze explicitly adds idempotency behavior.

P0 decision capture is audit-only. It records actor, command value, reason/note,
timestamp, source signal ids, target prompt/version context, suggestion
snapshot, and resulting suggestion state. It does not rewrite prompts, trigger
extraction, publish candidates, or mutate the published graph.

Wave31 DTO field naming freeze:

- Learning summary uses `generated_at`, `source_artifact_scope`,
  `signal_counts`, `open_prompt_suggestion_count`,
  `accepted_prompt_suggestion_count`, `dismissed_prompt_suggestion_count`,
  `superseded_prompt_suggestion_count`,
  `high_risk_prompt_suggestion_count`, and
  `auto_approval_preview_count`.
- Source artifact values align with Backend/OpenAPI
  `LearningSourceArtifactType`: `REVIEW_DECISION`, `REVIEW_CORRECTION`,
  `VALIDATION_RESULT`, `QUALITY_METRIC`, `QUALITY_DRILLDOWN`,
  `EVALUATION_RUN`, `EVALUATION_METRIC`, `EVALUATION_ERROR_CASE`.
- Auto-approval preview fields center on `id`,
  `historical_match_preview`, `source_artifacts`, `supporting_metrics`, and
  `safety_note`. A separate `evidence_quality_summary` field is not part of P0
  unless PM explicitly freezes it later.

Auto-approval candidates are recommendation/preview only. MVP6.2 P0 may show
why a rule might be safe, what metrics/signals support it, and what it would
match. It cannot create, update, enable, enforce, or auto-execute an
auto-approval policy.

Wave30 P0 excludes fine-tuning execution, live retraining, dataset export
execution, real provider prompt rewriting, autonomous publish, automatic policy
enforcement, ontology governance, impact simulation, copilot/agent runtime,
connector/plugin SDK, multi-tenant runtime, ontology packs, and advanced
visualization/storytelling.

## Wave32 MVP6.2 Implementation Scope Guard

Wave32 is approved only as a thin implementation of the frozen P0 loop:

```text
select project
-> view learning signal summary
-> inspect correction pattern
-> inspect prompt suggestion
-> accept/dismiss suggestion
-> see decision audit note
```

Deterministic local data is acceptable for the first thin slice. Backend may
use deterministic process-local or mock-derived data if it is project-scoped,
source-artifact-shaped, reproducible for tests/smoke, and clearly separated
from real provider execution. Frontend may use matching deterministic fixtures
for mock mode before wiring actual API mode.

Wave32 Backend runtime acceptance is limited to the frozen endpoint families:

- `GET /api/v1/projects/{project_id}/learning-signals/summary`
- `GET /api/v1/projects/{project_id}/learning-signals/correction-patterns`
- `GET /api/v1/projects/{project_id}/learning-signals/prompt-suggestions`
- `GET /api/v1/projects/{project_id}/learning-signals/auto-approval-candidates`
- `POST /api/v1/learning-signal-suggestions/{suggestion_id}/decisions`

Backend acceptance requires those endpoints to match the Wave31 OpenAPI
planning fields, return deterministic project-scoped data, preserve source
artifact references, implement decision conflict behavior, and expose mutation
guard evidence.

Wave32 Frontend UI acceptance requires a project-scoped Learning Insights
workflow that renders the summary, correction pattern, prompt suggestion,
auto-approval preview, and decision audit note. The UI must keep ID-bound
details contextual to Learning Insights, show loading/empty/error and
permission-limited states, and verify the flow in mock mode plus actual mode
when the Backend runtime is available.

Decision transition rules are frozen:

- `ACCEPT` transitions only a `SUGGESTED` suggestion to `ACCEPTED`.
- `DISMISS` transitions only a `SUGGESTED` suggestion to `DISMISSED` and
  requires the frozen reason code rules.
- `SUPERSEDED` remains read-side only.
- A command against `ACCEPTED`, `DISMISSED`, or `SUPERSEDED` must return a
  non-`SUGGESTED` conflict and that conflict must be visible/tested by
  Backend, Frontend, or QA.

Mutation guard evidence must remain all false for every suggestion decision:

- `prompt_version_mutated: false`
- `candidate_graph_mutated: false`
- `published_graph_mutated: false`
- `auto_approval_policy_mutated: false`
- `extraction_job_started: false`
- `evaluation_run_started: false`

Wave32 must not add real LLM calls, fine-tuning, live retraining, training
export execution, prompt rewriting, prompt version mutation, candidate review
mutation, candidate graph mutation, published graph mutation, policy
create/update/enable/enforce behavior, ontology governance, impact simulation,
agent/copilot runtime, connector/plugin SDK, tenant runtime, ontology packs, or
advanced visualization/storytelling.

## Wave33 MVP6.3 Benchmark Comparison PM Freeze Summary

Wave33 opens the next MVP6 theme as contract-first planning only. The chosen
P0 is **Benchmark Comparison / Confusion Matrix**, the smallest coherent
extension of the closed MVP6.1 evaluation surface. It is read-only aggregation
over already-stored `EvaluationRun` / `EvaluationMetric` / `EvaluationErrorCase`
artifacts. Runtime implementation waits for Wave34 after Backend contract draft,
Frontend field/state/IA review, and a QA executable checklist are ready. The
full freeze is in `docs/pm/MVP6_3_BENCHMARK_COMPARISON_BRIEF.md` and the durable
boundary is recorded in `docs/adr/0009-mvp6-3-benchmark-comparison-read-only-boundary.md`.

Frozen MVP6.3 P0 demo flow:

```text
select project
-> open Benchmark Comparison
-> select 2+ existing evaluation runs (by model/prompt/ontology/dataset version)
-> view side-by-side metric comparison with deltas
-> view per-class / per-relation-type confusion matrix and bucket accuracy
-> drill into a confusion cell to its contributing error cases
```

P0 may analyze these existing source artifacts only: MVP6.1 `EvaluationRun`,
`EvaluationMetric`, `EvaluationErrorCase` (typed by `EvaluationErrorType`),
`EvaluationCandidateRef`, and `EvaluationDimensions` class/relation/source
buckets. It must not join MVP3 review/correction, MVP4 quality, MVP6.2 learning
signals, or published-graph data.

New P0 enums (no new metric names — `EvaluationMetricName` is reused verbatim):

- `BenchmarkComparisonGroupBy`: `MODEL`, `PROMPT_VERSION`, `ONTOLOGY_VERSION`,
  `DATASET_VERSION`, `PARSER_VERSION`.
- `ComparisonComparabilityFlag`: `SAME_DATASET`, `DIFFERENT_DATASET_VERSION`,
  `DIFFERENT_DATASET`, `DIFFERENT_ONTOLOGY_VERSION`, `MISSING_METRIC`.
- `ConfusionMatrixAxis`: `ENTITY_CLASS`, `RELATION_TYPE`.
- Metric delta status (response-side): `IMPROVED`, `REGRESSED`, `UNCHANGED`,
  `NOT_COMPARABLE`.

Frozen safety boundary: read-only analysis only. No new run execution, no LLM
call, no gold-set authoring, no dataset revisioning write, no candidate/publish/
published-graph mutation. If a comparison object is persisted it is an analysis
artifact with an all-false `mutation_guard` mirroring the MVP6.2 audit-only
pattern.

Frozen exclusions: Gold Set authoring/dataset revisioning write, executing new
runs from the comparison UI, real LLM/provider execution, new metric names /
ontology constraint pass-rate, significance testing / time-trend / scheduled
alerts, comparison export to training datasets, cross-project/cross-org
comparison, MVP3/MVP4/MVP6.2 joins, and all Theme-3+ surfaces.

## Wave34 MVP6.3 Implementation Scope Guard + Persist-vs-Compute Freeze

Wave34 is approved only as a thin implementation of the frozen MVP6.3 P0 flow.
No new product scope: the demo flow (select project -> open Benchmark Comparison
-> select 2+ terminal-success runs -> side-by-side metric deltas -> per-class /
per-relation-type confusion matrix -> drill a cell to contributing error cases)
and the four endpoint families are unchanged from the Wave33 freeze. No benchmark
P1+ scope (gold-set authoring/versioning write, real provider execution,
significance/trend/alerts, training export, cross-project comparison, governance,
agents, connectors, tenants, packs, advanced viz).

Frozen endpoint families:

- `POST /api/v1/projects/{project_id}/benchmark-comparisons`
- `GET  /api/v1/projects/{project_id}/benchmark-comparisons`
- `GET  /api/v1/benchmark-comparisons/{comparison_id}`
- `GET  /api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix`
- `GET  /api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix/cells/{cell_id}/error-cases`

**Persist-vs-compute decision (acceptance gate C12) — FROZEN: option (a) persist
a deterministic process-local comparison record keyed by `comparison_id`.**

Rationale:

- It matches the existing MVP6.1 evaluation pattern exactly: that module keeps
  module-level dicts keyed by id (`_runs: dict[str, EvaluationRun]`, etc.) with a
  `reset_runtime_store()`, and MVP6.2 learning follows the same shape. Persisting
  `_comparisons: dict[str, BenchmarkComparison]` is the same proven pattern, not a
  new mechanism.
- It satisfies the list + GET-by-id round-trip (R3) directly: `POST` composes and
  stores the comparison record, `GET list` returns the project's stored records,
  and `GET by id` returns the same composed object — no recomputation-determinism
  risk on read.
- The stored record stays a read-only analysis artifact: it carries an all-false
  `BenchmarkMutationGuard` and is rebuilt from existing runs, so persistence adds
  no mutation surface to candidate/published/prompt/gold/policy paths.

Restated Wave34 acceptance gates (all required):

- All responses (and any persisted comparison) expose an all-false
  `BenchmarkMutationGuard` (`candidate_graph_mutated`, `published_graph_mutated`,
  `evaluation_run_started`, `gold_set_mutated`).
- No MVP6.1 field/enum rename; MVP6.1 shapes reused by `$ref`.
- Comparability flags surfaced honestly at all three levels (per-run, per-set,
  per-metric-row); cross-dataset/cross-ontology flagged, never blocked or hidden.
- `NOT_APPLICABLE` (never fabricated 0%/100%) and `__NONE__` (display sentinel,
  never a stored ontology id) semantics preserved.
- `>=2` terminal-success run eligibility; ineligible runs surfaced via
  `excluded_runs[]` + `RunExclusionReason`, never a crash.

Backlog IDs: PM `PM6-018`; Backend `BE6-024`~`BE6-027`; Frontend
`FE6-023`~`FE6-026`; QA `INT6-022`~`INT6-025`.

## Wave39 MVP6.4 Gold Set Authoring + Dataset Revisioning PM Freeze Summary

Wave39 opens the next MVP6 theme as contract-first planning only. The chosen P0
is **Gold Set authoring policy + dataset revisioning** (commander default;
closes the last un-closed MVP6.1 P1 cluster: expert ownership + edit/archive,
dataset revisions, standalone gold-evidence object, import/export). It is the
smallest coherent extension of the already-closed MVP6.1 evaluation surface —
the shipped `EvaluationDataset.owner_id`/`active_version_id` and
`EvaluationRun.dataset_version_id` already exist as hooks; this P0 supplies the
revision object + ownership/lifecycle policy behind them. Authoring is
candidate/analysis-layer only and never mutates the published graph, candidates,
prompts, or the ontology definition. Runtime implementation waits for Wave40
after Backend contract draft, Frontend field/state/IA review, and a QA
executable checklist. The full freeze is in
`docs/pm/MVP6_4_GOLD_SET_AUTHORING_BRIEF.md`; the durable boundary is in
`docs/adr/0011-mvp6-4-gold-set-authoring-revision-immutability-boundary.md`.

Frozen MVP6.4 P0 demo flow:

```text
select project
-> open Gold Set Manager
-> open a dataset as its expert owner
-> edit a gold entity/relation OR archive a stale gold item
-> attach/edit a standalone Gold Evidence object
-> cut a new dataset revision (prior revision becomes immutable)
-> export the dataset revision to a portable JSON bundle
-> import a bundle (dry-run compatibility report -> confirm as new dataset/revision)
-> confirm an existing run still points at the dataset revision it used
```

New P0 enums (no new metric names; MVP6.1 shapes reused verbatim by `$ref`):

- `GoldItemStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED` (gold entity + relation
  lifecycle; archive is soft, never hard-delete).
- `DatasetRevisionStatus`: `DRAFT`, `ACTIVE`, `FROZEN`, `ARCHIVED`. A revision is
  `FROZEN` (immutable) once a newer revision is activated OR any run pins it; at
  most one `ACTIVE` per dataset; runs pin only `ACTIVE`/`FROZEN`, never `DRAFT`.
- `GoldAuthoringAction`: `CREATE`, `EDIT`, `ARCHIVE`, `RESTORE`,
  `EVIDENCE_ATTACH`, `EVIDENCE_EDIT`, `REVISION_CUT`, `REVISION_ACTIVATE`,
  `IMPORT` (audit-only).
- `GoldSetImportCompatibility`: `COMPATIBLE`, `WARNING`, `CONFLICT`,
  `INCOMPATIBLE`. Import is dry-run-first; confirm requires a strategy
  (`CREATE_NEW_DATASET` or `NEW_REVISION_OF_EXISTING`); never auto-merges; never
  edits a FROZEN revision; `INCOMPATIBLE` is blocked.

Frozen reproducibility/traceability decision: `EvaluationRun.dataset_version_id`
is never rewritten by any authoring action; prior runs keep their pin and
metrics; a FROZEN revision is an immutable snapshot, so every old run resolves to
the exact sample+gold set it was scored against. Gold items/evidence are never
hard-deleted (archive/freeze only), preserving evidence/version traceability.

Frozen safety boundary: candidate/analysis-layer authoring only. No published
graph / candidate / prompt / ontology-definition mutation; no extraction or
evaluation run started; no prior-run pin rewrite; no hard delete; import only
after explicit confirm. Every authoring/import response exposes an all-false
`GoldAuthoringMutationGuard` (`published_graph_mutated`,
`candidate_graph_mutated`, `prompt_version_mutated`,
`ontology_definition_mutated`, `extraction_job_started`,
`evaluation_run_started`, `prior_run_pin_rewritten`).

Frozen exclusions: real LLM/provider execution, run execution from authoring UI,
new metric names / ontology constraint pass-rate, benchmark comparison change,
MVP3/MVP4/MVP6.2 joins, governance workflow, impact simulation, copilot/agent
runtime, connector/plugin SDK, multi-tenant runtime, ontology packs, advanced
visualization, concurrent-edit locking/merge, cross-project/cross-org sharing.
Durable DB/Alembic persistence is not required for P0 (process-local store with
`reset_runtime_store()` acceptable); stays P1/P2.

Backlog IDs: PM `PM6-021`; Backend `BE6-028`~`BE6-031`; Frontend
`FE6-049`~`FE6-052`; QA `INT6-035`~`INT6-038` (QA ID correction Wave39: the
earlier `INT6-026`~`INT6-029` proposal collided with IDs already consumed by the
closed UI/UX waves 35–38; re-ranged to `INT6-035`+).

## Wave41 MVP6.5 Governance Workflow PM Freeze Summary

Wave41 opens the next MVP6 theme as contract-first planning only. The chosen P0
is an **auditable ontology change-request lifecycle**: propose a change request
(add/modify/deprecate a class/property/relation) → reviewer comments /
requests-changes → an approver approves or rejects with a reason → full audit
trail. It is a candidate/analysis-layer (governance/decision) surface only; it
does NOT touch the ontology definition, candidates, prompts, or the published
graph. Runtime implementation waits for Wave42 after Backend contract draft +
Frontend field/state/IA review + QA executable checklist. The full freeze is in
`docs/pm/MVP6_5_GOVERNANCE_BRIEF.md` and the durable boundary in ADR 0012.

Request states (`OntologyChangeRequestStatus`):
`DRAFT → OPEN → IN_REVIEW → {APPROVED | REJECTED}`, plus `WITHDRAWN`
(proposer, from DRAFT/OPEN/IN_REVIEW). `REQUEST_CHANGES` returns IN_REVIEW/OPEN →
OPEN. APPROVED/REJECTED/WITHDRAWN are terminal; a decision on a terminal/wrong
state returns `409 CHANGE_REQUEST_STATE_CONFLICT`.

Decision commands (`GovernanceReviewAction`, reuses MVP3 `ReviewDecisionType`
literals verbatim; `MODIFY_AND_APPROVE` intentionally excluded): `COMMENT`,
`REQUEST_CHANGES` (reason required), `APPROVE` (justification required),
`REJECT` (reason required). Proposer commands `submit`/`withdraw` are separate.
Approver must not be the proposer (segregation of duties). RBAC reuses the
shipped `Role` enum verbatim (approve/reject restricted to `ONTOLOGY_MANAGER`/
`PROJECT_ADMIN`/`SYSTEM_ADMIN`); no new role literal.

Approval-is-intent-not-auto-apply (load-bearing decision): an `APPROVED` request
is QUEUED as intent (orthogonal `GovernanceApplicationState=QUEUED`); P0 applies
NOTHING to the ontology or published graph. Actual application is a later,
human-initiated, separately-audited slice via the existing MVP1 ontology-edit +
MVP3 publish paths; `APPLIED`/`SUPERSEDED` application-states are RESERVED and
never produced in P0. Every governance write response exposes an all-false
7-flag `GovernanceMutationGuard` (`ontology_definition_mutated`,
`published_graph_mutated`, `candidate_graph_mutated`, `prompt_version_mutated`,
`publish_job_started`, `extraction_job_started`, `change_auto_applied`).

Change-item enums: `ChangeRequestTargetKind` (CLASS/PROPERTY/RELATION),
`ChangeRequestChangeType` (ADD/MODIFY/DEPRECATE); each item references an
ontology element (null for ADD) + `ontology_version_id` (read-only reference,
never written). Audit: `GovernanceAuditAction` (9 events), reusing the MVP3/MVP5
audit record shape by reference.

Exclusions: auto-apply, automatic enforcement, autonomous/agent publish +
rollback, impact simulation/analysis reports, migration-plan +
release-note generation, post-change re-validation/re-extraction jobs, ontology
diff viz beyond a change-item summary, automatic reviewer assignment, real LLM,
copilot/agent runtime, connector/plugin SDK, multi-tenant runtime. Durable
DB/Alembic persistence not required for P0 (process-local store with
`reset_runtime_store()` acceptable); stays P1/P2.

Backlog IDs: PM `PM6-023`; Backend `BE6-036`~`BE6-039`; Frontend
`FE6-057`~`FE6-060`; QA `INT6-043`~`INT6-046` (continued cleanly; `INT6` was used
through `INT6-042`, so the QA range starts at `INT6-043`).

## Wave42 MVP6.5 Governance Workflow THIN IMPLEMENTATION — Gate Freeze

Wave42 implements the smallest deterministic runtime/UI slice of the frozen P0
loop. PM (`PM6-024`) runs first and freezes the three Wave41 open gates plus
ratifies the commander IA ruling; the freeze is recorded in
`docs/pm/MVP6_5_GOVERNANCE_BRIEF.md §10`.

- **G1 (OPEN→IN_REVIEW auto-advance) FROZEN = first-touch.** No explicit
  "start review" action exists. The transition fires when the **first review
  action** (`COMMENT` or `REQUEST_CHANGES`) is recorded against an `OPEN`
  request: that write atomically sets `status=IN_REVIEW` and audits
  `REVIEW_STARTED` *before* the action's own audit event (`COMMENT_ADDED` /
  `CHANGES_REQUESTED`). `APPROVE`/`REJECT` from `OPEN` are valid directly (no
  IN_REVIEW precondition) and do NOT emit `REVIEW_STARTED`. If a request is sent
  back to `OPEN` by `REQUEST_CHANGES`, the next reviewer touch re-fires
  `REVIEW_STARTED` (idempotent per OPEN episode, once per re-entry).
- **G2 (approve justification) FROZEN = single `reason` field.** No separate
  `application_note`. `APPROVE` reuses the one `reason` field on
  `GovernanceReviewDecisionRequest` (required, non-empty → `422 REASON_REQUIRED`
  when blank), consistent with `REJECT`/`REQUEST_CHANGES`.
- **G3 (IA) RATIFIED (commander-ruled).** Governance = a NEW project-zone LNB
  item under the **Review** group (`/projects/:p/governance`). Detail
  (`/governance/:id`) is a contextual ID-bound route (ADR 0010), NOT an LNB item;
  single active LNB item preserved.
- **G4 (FE field shapes) CONFIRMED:**
  - **Audit ordering + pagination:** both audit reads
    (`.../{id}/audit`, `/projects/{project_id}/governance-audit`) return
    **chronological ascending** (oldest→newest) for a stable audit-trail read,
    with `limit`/`cursor` opaque-cursor pagination (default 50, max 100). The UI
    may render newest-first by reversing the loaded page; the wire order is asc.
  - **Board list pagination:** `limit`/`cursor` opaque-cursor pagination
    (default 50, max 100); FE groups by `status` client-side within the loaded
    page.
  - **Current-reviewer field on list DTO: NO.** `OntologyChangeRequest` stays as
    drafted (`proposer_id`/`item_count` etc.); the board derives current
    reviewer/approver from the latest `GovernanceReviewDecision` on the detail.
    No field added — keeps the list DTO minimal and avoids a denormalized field.

Backlog IDs: PM `PM6-024`; Backend `BE6-040`~`BE6-043`; Frontend
`FE6-061`~`FE6-064`; QA `INT6-047`~`INT6-050` (continued cleanly from the Wave41
ranges above).

## Wave43 MVP6.6 Governance Change Application PM Freeze Summary

Wave43 opens the next MVP6 theme as contract-first planning only. The chosen P0
is the **deferred application slice from ADR 0012**: an APPROVED + QUEUED
ontology change request is **explicitly applied by a human** onto a DRAFT
ontology version (`GovernanceApplicationState` QUEUED → APPLIED), with separate
audit. It is the FIRST governance operation that mutates ontology state; the
durable boundary is recorded in **ADR 0013**. Runtime implementation waits for
Wave44 after Backend contract draft + Frontend field/state/IA review + QA
executable checklist. The full freeze is in
`docs/pm/MVP6_6_GOVERNANCE_APPLICATION_BRIEF.md`.

Frozen MVP6.6 P0 demo flow:

```text
select project
-> open Governance -> open an APPROVED change request (application_state = QUEUED)
-> (read-only) application-status pre-check: target DRAFT version + per-item
     before/after preview + staleness warning if the approved snapshot no longer
     matches the current draft target
-> a permitted role clicks "Apply to draft" and confirms (human-confirmation step)
-> apply executes items via existing MVP1 ontology-edit semantics
     (ADD=create, MODIFY=update, DEPRECATE=archive) on a DRAFT ontology version
     and sets application_state = APPLIED
-> "applied to DRAFT ontology, NOT published — publish separately" banner
-> application audit: actor/timestamp/source request+items/resulting DRAFT
     ontology version id/per-item before/after element refs
-> re-apply -> 409 (idempotent, no double apply)
-> stale draft target -> apply blocked, application_state = SUPERSEDED, no mutation
```

Frozen boundary (authority ADR 0013): application ≠ publish and is **draft-only**
(published graph NEVER touched; publishing stays the separate MVP3 path);
**human-initiated only** (approval never triggers apply); apply valid **only**
from `APPROVED`+`QUEUED`; **idempotent** (already-`APPLIED` → `409
CHANGE_ALREADY_APPLIED`, not-`APPROVED`/`QUEUED` → `409 CHANGE_NOT_APPLICABLE`);
**staleness → `SUPERSEDED`** auto-detected at apply time when the approved
snapshot no longer matches the current draft target — blocked, no mutation, `409
CHANGE_REQUEST_SUPERSEDED` (the ADR-0012 reserved state becomes real); non-DRAFT
target → `409 APPLY_TARGET_NOT_DRAFT`.

Authorization: apply rights **= approver rights**
(`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`), reusing MVP5 `Role`; no new
role literal; applier **may differ** from approver/proposer (recommended +
audited); no self-apply prohibition (SoD enforced at approve); unauthorized →
`403 PERMISSION_DENIED`.

Redefined mutation guard: the successful apply response carries a
`GovernanceApplicationMutationGuard` with exactly one true flag —
`ontology_draft_mutated: true` — and `published_graph_mutated`,
`candidate_graph_mutated`, `prompt_version_mutated`, `publish_job_started`,
`extraction_job_started`, `evaluation_run_started` all false. All read/lifecycle
governance endpoints (MVP6.5 + the MVP6.6 pre-check/audit reads) and any blocked
apply keep the existing **all-false** `GovernanceMutationGuard`. New audit events:
`GovernanceApplicationAuditAction` (`CHANGE_REQUEST_APPLIED`,
`CHANGE_REQUEST_SUPERSEDED`), reusing the MVP3/MVP5 audit shape by reference.

`APPLIED`/`SUPERSEDED` are produced **only** by MVP6.6 apply. MVP1 ontology-edit
+ MVP3 publish + MVP5 `Role` + MVP6.5 governance shapes reused by reference, no
renames.

Frozen exclusions: publishing the applied draft (separate MVP3 path), auto-apply/
auto-publish, automatic enforcement, autonomous/agent apply, rollback/undo,
impact simulation, migration/release-note generation, post-apply re-validation/
re-extraction, bulk/batch apply, conflict auto-merge, real LLM, copilot/agent
runtime, connector/plugin SDK, multi-tenant runtime. Durable DB/Alembic
persistence not required for P0 (process-local store with `reset_runtime_store()`
acceptable); stays P1/P2.

Backlog IDs: PM `PM6-025`; Backend `BE6-044`~`BE6-047`; Frontend
`FE6-065`~`FE6-068`; QA `INT6-051`~`INT6-054` (continued cleanly; INT6 used
through `INT6-050`, so the QA range starts at `INT6-051`).

## Wave45 MVP6.7 Impact Simulation PM Freeze Summary

Wave45 opens the next MVP6 theme as contract-first planning only. The chosen P0
is the **deferred impact-simulation theme** (ADR 0013 "Out of scope", roadmap §7
Theme 4): before a human commits the MVP6.6 apply (or the later MVP3 publish),
they run a **read-only impact simulation** on an existing governance change
request and read what it would touch. It is the **return to read-only** after the
single MVP6.6 mutation surface — it mutates NOTHING and asserts an all-false
guard. The durable boundary is recorded in **ADR 0014**. Runtime implementation
waits for Wave46 after Backend contract draft + Frontend field/state/IA review +
QA executable checklist. The full freeze is in
`docs/pm/MVP6_7_IMPACT_SIMULATION_BRIEF.md`.

Frozen MVP6.7 P0 demo flow:

```text
select project
-> open Governance -> open a change request (any lifecycle state; typically
     APPROVED + application_state = QUEUED)
-> open the contextual "영향도(Impact)" panel and run impact simulation (read-only)
-> read the impact report:
     * affected ontology elements: direct target(s) + bounded transitive dependents (max depth 2)
     * dependent candidate entities/relations: exact count + capped ref list
     * dependent published elements: exact count + capped ref list
     * affected MVP3 validations (ValidationRuleCode) + MVP4 quality (QualityMetricGroup) by ref
     * severity rollup: per-item ImpactSeverity + report-level max + per-severity counts
-> "read-only analysis — no apply / no publish / no enforcement" banner
-> the human then decides via the SEPARATE MVP6.6 apply / MVP3 publish paths; the report changes nothing
```

Frozen boundary (authority ADR 0014): **read-only / no mutation** — mutates
NOTHING (ontology draft/published, candidates, prompts, extraction, evaluation,
governance state, published graph); every response carries an **all-false**
`ImpactSimulationMutationGuard` (turns NO flag true, ever; distinct from the
MVP6.6 `GovernanceApplicationMutationGuard`). **Advisory only** — decision-support
before the separate MVP6.6 apply / MVP3 publish steps; never blocks/gates/
pre-authorizes/auto-triggers; never flips a change request's `status`/
`application_state`; never sets `SUPERSEDED` (staleness stays the MVP6.6 apply
authority). **Deterministic + bounded** — byte-stable for a fixed change request +
graph snapshot; max transitive dependent depth = 2; ref caps per dimension with
`truncated=true` + exact `count`; no unbounded walk; no real LLM.

Input (P0): an **existing change-request id** (reuse MVP6.5/6.6 shapes). A
hypothetical free-form change set (target_kind × change_type + element ref, not
tied to a stored request) is **P1**.

Severity: new `ImpactSeverity` (`NONE`/`LOW`/`MEDIUM`/`HIGH`/`BREAKING`) computed
deterministically from counted dimensions — `BREAKING` = DEPRECATE/MODIFY on an
element with dependent published elements; `HIGH` = DEPRECATE/MODIFY on an element
with dependent candidates or affected `FAILED` validations; `MEDIUM` = transitive
ontology dependents affected or affected `WARNING` validations/quality groups;
`LOW` = only the direct element; `NONE` = ADD with no existing dependents. Report
rollup = max item severity + per-severity counts.

Consumption (reuse ADR 0010 IA): a contextual "영향도(Impact)" panel/tab on the
Governance change-request detail — **no new global LNB item**, no new Analyze
destination; D6 badges for `ImpactSeverity`; closed Section+Card design language.

Authorization: read-only, so any project member who can view the change request
can view its impact report (no elevated role, unlike MVP6.6 apply); reuse MVP5
`Role` project read check; unauthorized → `403 PERMISSION_DENIED`; missing
request → `404 CHANGE_REQUEST_NOT_FOUND`.

Reuse by reference (no renames): MVP6.5/6.6 governance change request + items,
MVP1 ontology definition, candidate + MVP3 published graph, MVP3 validation
(`ValidationRuleCode`/`ValidationResultSeverity`), MVP4 quality
(`QualityMetricGroup`), MVP5 `Role`, and the MVP6.3 persist-by-id pattern.

Frozen exclusions: any mutation of any kind; applying/publishing/enforcing/gating
on the report; auto-triggering apply/publish; hypothetical free-form change set
(P1); unbounded transitive closure beyond the depth cap; migration/release-note
generation; automated remediation/auto-fix; post-apply re-validation/
re-extraction; cost/performance impact modelling; multi-request/cross-project
impact; real LLM; copilot/agent runtime; connector/plugin SDK; multi-tenant
runtime. Durable DB/Alembic persistence not required for P0 (process-local store
with `reset_runtime_store()` acceptable); stays P1/P2.

Backlog IDs: PM `PM6-027`; Backend `BE6-052`~`BE6-055`; Frontend
`FE6-073`~`FE6-076`; QA `INT6-059`~`INT6-062` (continued cleanly; INT6 used
through `INT6-058`, so the QA range starts at `INT6-059`).

## PM Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| PM6-001 | P0 | PM | MVP6.1 scope freeze | MVP5 closeout, MVP6 roadmap | `docs/pm/MVP6_PREP_BRIEF.md` defines the smallest Gold Set / Benchmark Studio P0 thin slice and excludes later MVP6 themes |
| PM6-002 | P0 | PM | Gold Set / Benchmark acceptance criteria | PM6-001 | `docs/backlog/INT6_MVP6_ACCEPTANCE.md` includes dataset, sample, gold entity/relation, deterministic run, metrics, and errors happy path |
| PM6-003 | P0 | PM | Evaluation metric definitions | PM6-001 | entity/relation precision, recall, F1, relation direction accuracy, and evidence match rate definitions plus zero-denominator policy are frozen |
| PM6-004 | P0 | PM | MVP6 entry guardrails and exclusions | PM6-001 | published graph safety, evidence/version traceability, and Wave28 exclusions are documented for Backend/Frontend/QA |
| PM6-005 | P1 | PM | Gold Set authoring policy | PM6-001 | expert ownership, edit/archive policy, dataset revisioning, and import/export rules are defined after P0 runtime passes |
| PM6-006 | P1 | PM | Benchmark comparison policy | PM6-003 | model/prompt comparison, relation matrix, class accuracy, and constraint pass-rate policy are documented after P0 metrics pass |
| PM6-007 | P2 | PM | MVP6.2+ roadmap breakdown | PM6-001 | active learning, governance, impact simulation, agents, connectors, tenants, and ontology packs are split into later thin slices |
| PM6-008 | P1 | PM | Wave29 hardening freeze | Wave28 reports | Wave29 is frozen as MVP6.1 hardening only, with `smoke:mvp6:actual` PASS/PARTIAL/FAIL criteria and later-theme exclusions documented |
| PM6-009 | P1 | PM | Durable persistence decision | PM6-008, BE6-003 | process-local runtime store is accepted for MVP6.1 closeout if actual smoke is reproducible; durable DB/Alembic stays P1/P2 |
| PM6-010 | P0 | PM | MVP6.2 P0 scope freeze | Wave29 closeout, MVP6 roadmap Theme 2 | `docs/pm/MVP6_2_ACTIVE_LEARNING_BRIEF.md` freezes the P0 demo flow, source artifacts, safety boundary, and exclusions |
| PM6-011 | P0 | PM | Learning signal taxonomy | PM6-010, MVP3/MVP4/MVP6.1 artifacts | P0 signal types cover relation direction correction, class confusion, relation type confusion, evidence missing/mismatch, repeated validation failure, and low benchmark metric cluster |
| PM6-012 | P0 | PM | Prompt suggestion and decision policy | PM6-011 | suggestion states, accept/dismiss rules, decision reason requirements, and audit note content are frozen without mutating prompt versions |
| PM6-013 | P0 | PM | Auto-approval candidate safety boundary | PM6-010 | auto-approval candidates are preview/recommendation only and cannot create, enable, enforce, approve, publish, or mutate policies/graphs |
| PM6-014 | P0 | PM | Decision command/state vocabulary freeze | Wave30 QA finding, PM6-012 | `ACCEPT`/`DISMISS` are request commands; `ACCEPTED`/`DISMISSED` are resulting states; `SUPERSEDED` is read-side only; non-`SUGGESTED` commands conflict by default |
| PM6-015 | P0 | PM | DTO field naming freeze | Wave30 QA finding, BE6-012~BE6-015, FE6-011~FE6-014 | learning summary, source artifact enum, and auto-approval preview field names are frozen for Backend/OpenAPI and Frontend alignment before runtime implementation |
| PM6-016 | P0 | PM | Wave32 implementation scope guard | PM6-014, PM6-015, INT6-016 | deterministic local thin data is acceptable; Backend/Frontend acceptance stays inside frozen endpoints/UI flow; `ACCEPT`/`DISMISS` transition only `SUGGESTED`; non-`SUGGESTED` conflict and all-false mutation guard are required; later MVP6 themes remain out of scope |
| PM6-017 | P0 | PM | MVP6.3 Benchmark Comparison P0 scope freeze | MVP6.1 closeout, MVP6 roadmap Theme 1 §4.1-4.4 | `docs/pm/MVP6_3_BENCHMARK_COMPARISON_BRIEF.md` freezes the read-only comparison/confusion-matrix P0 demo flow, source artifacts, enums/states, delta and cell definitions, safety boundary, and exclusions; durable boundary recorded in ADR 0009 |
| PM6-018 | P0 | PM | Wave34 MVP6.3 implementation scope guard + persist-vs-compute freeze | PM6-017, INT6-021 (C12) | scope unchanged from the frozen P0 flow and 4 endpoint families; persist-vs-compute frozen to option (a) persist a deterministic process-local comparison record keyed by `comparison_id` (mirrors MVP6.1 `_runs` store, satisfies list + GET-by-id round-trip R3); all-false `BenchmarkMutationGuard`, no MVP6.1 field/enum rename, comparability flags + `NOT_APPLICABLE`/`__NONE__` semantics preserved, `>=2` terminal-success eligibility with `RunExclusionReason`; no benchmark P1+ scope |
| PM6-019 | P1 | PM | Wave35 UI/UX review decision set (P1-P3) | `docs/pm/UIUX_REVIEW_FULL_PRODUCT.md` §7 | `docs/pm/UIUX_REMEDIATION_DECISIONS.md` freezes the LNB two-zone IA (Build/Review/Publish/Analyze, exact items+labels+routes, no-project vs selected behavior, LNB-vs-tabs single-location rule), Dashboard Hero/value/CTA copy, copy-language policy + glossary, breadcrumb `프로젝트명 > 섹션 > 항목` standard + per-screen map, Quality top-vs-collapsed priority, and the status-token badge/icon/Korean-label guide; durable LNB IA boundary recorded in ADR 0010; no API/DTO/enum change |
| PM6-020 | P1 | PM | Wave37 reference-driven design direction (intuitive/easy-to-use) | `https://wwit.design`, `https://ai.codle.io/kr`, PM6-019 (D1-D6), ADR 0010, `MVP6_FRONTEND_UI_STYLE_GUIDE.md` | `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md` translates the two references' PRINCIPLES into our operational console: 7 adopted principles (3-tier hierarchy, one card module, whitespace scale, one primary action, restrained single accent, progressive disclosure, outcome-first KO copy); a refined token spec expressed against the real `styles/theme.ts` (add `fontWeight.medium=500/semibold=600/bold=700`, `fontSize.xl=22px`+rename old `xl`->`xxl`, `spacing.section/page`, color roles `accent/surfaceInfo/Success/Warning/Danger/surfaceSelected/surfaceStrong/textOnStrong`, `shadow.card`); a canonical Section+Card module extending `HanaCard` (eyebrow/action/emphasis) + promoting duplicated `ScreenGrid/Split/Stack/CardBody` into one shared module; per-screen-type guidance (Dashboard/list/workbench/empty-loading-error); outcome-first KO microcopy with Dashboard + Review Workbench before/after; and the prioritized P0/P1/P2 change list (FE6-038+) with completion criteria; presentation/token-only, no API/DTO/enum change; not a 35-screen rewrite |
| PM6-021 | P0 | PM | MVP6.4 Gold Set Authoring + dataset revisioning P0 scope freeze | MVP6.1 closeout, MVP6 roadmap Theme 1 §4.2-4.4, PM6-005 | `docs/pm/MVP6_4_GOLD_SET_AUTHORING_BRIEF.md` freezes the expert-owned authoring P0: demo flow, source artifacts (reuse MVP6.1 shapes by ref, no rename), enums/states (`GoldItemStatus`, `DatasetRevisionStatus`, `GoldAuthoringAction`, `GoldSetImportCompatibility`), the reproducibility decision (runs keep `dataset_version_id` pin, FROZEN revision immutability, no hard delete), import dry-run/confirm policy, the candidate/analysis-only safety boundary + all-false `GoldAuthoringMutationGuard`, and exclusions; durable boundary recorded in ADR 0011; planning-only, no runtime/API/DTO/enum change |
| PM6-022 | P0 | PM | MVP6.4 Wave40 freeze-on-pin freeze + scope guard | PM6-021, BE6-028~BE6-031 | freezes the single freeze-on-pin rule for Wave40 thin implementation: `pinned_run_count > 0` ⇒ the revision **transitions to `status=FROZEN`** (`frozen_reason=PINNED_BY_RUN`, `is_immutable=true`), no ACTIVE-but-immutable state, `is_immutable == status in {FROZEN,ARCHIVED}`, freeze of an ACTIVE revision vacates the ACTIVE slot until a new one is cut/activated; mutating FROZEN ⇒ `409 REVISION_FROZEN`/`GOLD_ITEM_IMMUTABLE`; refines brief/ADR 0011/contract-draft minimally; confirms no scope expansion beyond P0 + the 5 endpoint families; restates Wave40 acceptance gates; planning/docs-only, no `apps/` change |
| PM6-023 | P0 | PM | MVP6.5 Governance workflow P0 scope freeze | MVP6.4 closeout, MVP6 roadmap Theme 3 §6.1-6.5 | `docs/pm/MVP6_5_GOVERNANCE_BRIEF.md` freezes the auditable ontology change-request lifecycle P0: demo flow (propose → review → approve/reject → audit); target kinds (`ChangeRequestTargetKind` CLASS/PROPERTY/RELATION × `ChangeRequestChangeType` ADD/MODIFY/DEPRECATE); request states (`OntologyChangeRequestStatus` DRAFT/OPEN/IN_REVIEW/APPROVED/REJECTED/WITHDRAWN) + decision commands (`GovernanceReviewAction` COMMENT/REQUEST_CHANGES/APPROVE/REJECT, reusing MVP3 `ReviewDecisionType` literals, no `MODIFY_AND_APPROVE`) + reason rules; RBAC (reuse shipped `Role`, approver ≠ proposer); audit content (`GovernanceAuditAction`); the **approval-is-intent-not-auto-apply** boundary + orthogonal `GovernanceApplicationState` (QUEUED on approve; APPLIED/SUPERSEDED reserved) + all-false `GovernanceMutationGuard`; and exclusions (auto-apply, enforcement, autonomous publish/rollback, impact simulation, migration/release-note, re-validation/re-extraction, multi-tenant, agents, connectors); durable boundary recorded in ADR 0012; planning-only, no runtime/API/DTO/enum change |
| PM6-025 | P0 | PM | MVP6.6 Governance Change Application P0 scope freeze | MVP6.5 closeout, ADR 0012 (deferred application slice), MVP6 roadmap Theme 3 §6 | `docs/pm/MVP6_6_GOVERNANCE_APPLICATION_BRIEF.md` freezes the human-initiated apply P0: an `APPROVED`+`application_state==QUEUED` change request is explicitly applied by a permitted human onto a **DRAFT** ontology version via existing MVP1 ontology-edit semantics (ADD=create/MODIFY=update/DEPRECATE=archive) → `application_state=APPLIED`; **application ≠ publish, draft-only** (published graph never touched; publishing stays the separate MVP3 path); idempotency (`409 CHANGE_ALREADY_APPLIED`/`CHANGE_NOT_APPLICABLE`); **staleness → `SUPERSEDED`** auto-detected at apply time (`409 CHANGE_REQUEST_SUPERSEDED`, no mutation — the ADR-0012 reserved state becomes real); non-DRAFT target `409 APPLY_TARGET_NOT_DRAFT`; authz = approver rights (`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`), applier may differ from approver (audited), no self-apply bar, `403 PERMISSION_DENIED`; redefined `GovernanceApplicationMutationGuard` with the ONE legitimately-true flag `ontology_draft_mutated` (all others false; read/lifecycle endpoints stay all-false); application audit (actor/timestamp/source request+items/resulting DRAFT version id/per-item before-after refs) via new `GovernanceApplicationAuditAction`; exclusions (publish, auto-apply, enforcement, autonomous/agent apply, rollback, impact sim, migration/release-note, re-validation/re-extraction, bulk, auto-merge, multi-tenant, agents, connectors); durable boundary recorded in ADR 0013; planning-only, no runtime/API/DTO/enum change |
| PM6-026 | P0 | PM | MVP6.6 Wave44 gate freeze + thin-implementation scope guard | PM6-025, BE6-044~BE6-047, FE6-065~FE6-068, INT6-051~INT6-054 | freezes the six open apply gates for Wave44 runtime (records into brief §9): **G1 target-draft default** = omitted `target_ontology_version_id` resolves to the project's single current DRAFT version; if zero DRAFT versions exist `409 APPLY_TARGET_NOT_DRAFT` (never auto-create); if the caller supplies an explicit id it must be `OntologyVersionStatus=DRAFT` (else `409 APPLY_TARGET_NOT_DRAFT`) and existing (else `404 ONTOLOGY_VERSION_NOT_FOUND`). **G2 per-`change_type` staleness key**: `ADD` stale only if its `ontology_version_id` context no longer resolves to the resolved target draft (no before-state); `MODIFY`/`DEPRECATE` stale if the target element is absent (`TARGET_ELEMENT_DELETED`), or its current `OntologyElementStatus` ≠ the approval-captured status (`TARGET_ELEMENT_ARCHIVED`/`TARGET_ELEMENT_MODIFIED`), or its captured content fingerprint (`target_kind` + element id + `OntologyElementStatus` + a stable hash of the approval-time `proposed_change`/element payload) ≠ current. **G3 snapshot capture point**: the approved before-state snapshot is captured at APPROVE time and stored on the QUEUED request; apply compares against that stored snapshot (not recomputed from audit history). **G4 partial-apply** = ALL-OR-NOTHING: if any item is stale/invalid, apply mutates nothing, transitions `QUEUED→SUPERSEDED`, and returns `409 CHANGE_REQUEST_SUPERSEDED`; no per-item partial application. **G5 pre-check side-effects** = the `GET .../application-status` pre-check is PURELY ADVISORY — it never mutates state and never flips `QUEUED→SUPERSEDED`; only the `POST .../apply` attempt is authoritative and may set `SUPERSEDED`. **G6 post-apply capabilities** = after a terminal `APPLIED`/`SUPERSEDED` state, `can_apply=false` (`ApplicationCapabilities{can_view, can_apply}`; `can_apply=true` only when actor holds apply rights AND `status==APPROVED` AND `application_state==QUEUED`). Confirms **G7** (FE adds an `APPLIED` `StatusBadge` token, tone `success`, KO `초안에 적용됨 (미게시)`; overrides `SUPERSEDED` from neutral to `warning` tone, KO `대체됨 (미적용)`) and **G8** (apply-response guard uses the 7 `GovernanceApplicationMutationGuard` keys `ontology_draft_mutated`/`published_graph_mutated`/`candidate_graph_mutated`/`prompt_version_mutated`/`publish_job_started`/`extraction_job_started`/`evaluation_run_started`; distinct from the all-false MVP6.5 `GovernanceMutationGuard` which uses `ontology_definition_mutated`/`change_auto_applied`; FE renders the correct proof line per endpoint). Confirms scope unchanged (frozen apply P0 + the 3 endpoint families only; no publish, no auto-apply, no partial apply); restates INT6.6 acceptance gates; docs-only, no `apps/` change |
| PM6-027 | P0 | PM | MVP6.7 Impact Simulation P0 scope freeze | MVP6.6 closeout, ADR 0013 (deferred impact-sim), MVP6 roadmap §7 Theme 4 | `docs/pm/MVP6_7_IMPACT_SIMULATION_BRIEF.md` freezes the **read-only** impact-analysis P0: given an **existing governance change-request id** (reuse MVP6.5/6.6 shapes; a hypothetical free-form change set is **P1**), run an impact simulation and read a report over five dimensions — (1) affected ontology elements = direct target(s) + **bounded transitive dependents** (max depth 2), (2) dependent candidate entities/relations = exact count + capped `truncated` ref list, (3) dependent published elements = exact count + capped ref list, (4) affected MVP3 validations (`ValidationRuleCode`) + MVP4 quality (`QualityMetricGroup`) by reference, (5) a deterministic severity rollup; new `ImpactSeverity` (`NONE`/`LOW`/`MEDIUM`/`HIGH`/`BREAKING`) computed deterministically from counted dimensions (BREAKING=DEPRECATE/MODIFY on element with dependent published; HIGH=on element with dependent candidates or affected `FAILED` validations; MEDIUM=transitive dependents or affected `WARNING` validations/quality groups; LOW=direct only; NONE=ADD no dependents), rollup = max item severity + per-severity counts; **READ-ONLY / NO MUTATION** — mutates NOTHING (ontology draft/published, candidates, prompts, extraction, evaluation, governance state, published graph), every response carries an **all-false** `ImpactSimulationMutationGuard` (turns NO flag true, ever; distinct from MVP6.6 `GovernanceApplicationMutationGuard`); **advisory only** — never applies/publishes/enforces/gates/auto-triggers, never flips `status`/`application_state`, never sets `SUPERSEDED` (staleness stays the MVP6.6 apply authority); **deterministic + bounded** (byte-stable per change request + graph snapshot; depth 2; ref caps + exact count + `truncated`; no real LLM); consumed as a contextual "영향도(Impact)" panel on the Governance change-request detail — **no new global LNB item** (reuse ADR 0010 IA), D6 severity badges; read authz = any project member who can view the request (no elevated role), `403 PERMISSION_DENIED`/`404 CHANGE_REQUEST_NOT_FOUND`; reuse MVP6.5/6.6 + MVP1 ontology + candidate + MVP3 published/validation + MVP4 quality + MVP5 `Role` + MVP6.3 persist-by-id pattern by reference (no rename); exclusions (any mutation, apply/publish/enforce/gate, auto-trigger, hypothetical change set (P1), unbounded transitive closure, migration/release-note, auto-remediation, re-validation/re-extraction, cost/perf modelling, multi-request/cross-project, real LLM, agents, connectors, multi-tenant); durable boundary recorded in ADR 0014; planning-only, no runtime/API/DTO/enum change |

## Backend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| BE6-052 | P0 | Backend | MVP6.7 impact-simulation contract draft (read-only) | PM6-027, ADR 0014 | draft `docs/api/MVP6_7_IMPACT_SIMULATION_API_CONTRACT_DRAFT.md`: additive read-only endpoint(s) for an impact report of a change request (e.g. `POST/GET .../ontology-change-requests/{id}/impact-report`), and — if persisted — list + GET-by-id (MVP6.3 pattern); reuse MVP6.5/6.6 + MVP1 ontology + candidate + MVP3 published/validation + MVP4 quality + MVP5 `Role` shapes by `$ref` (no rename); capture open questions (compute-on-demand vs persisted `impact_report_id`; per-target_kind transitive traversal rules; ref-cap value + per-dimension vs global cap; quality-group live vs by-reference) |
| BE6-053 | P0 | Backend | MVP6.7 impact dimensions + severity + bounding DTOs/enums | PM6-027, BE6-052 | model the five bounded dimensions (affected ontology elements incl. bounded transitive dependents at max depth 2; dependent candidate/published exact `count` + capped ref list with `truncated`; affected `ValidationRuleCode`/`QualityMetricGroup` refs); `ImpactSeverity` (`NONE`/`LOW`/`MEDIUM`/`HIGH`/`BREAKING`) per item + deterministic report rollup (max + per-severity counts); byte-stable ordering; reuse `OntologyElementRef`/`ChangeRequestTargetKind`/`ChangeRequestChangeType`/`ValidationResultSeverity` by ref (no rename) |
| BE6-054 | P0 | Backend | MVP6.7 all-false mutation guard + authz + error model | PM6-027, BE6-052 | every impact response carries an **all-false** `ImpactSimulationMutationGuard` (turns NO flag true, ever; never flips governance `status`/`application_state`, never SUPERSEDES); read authz = project-member view of the request (no elevated role), `403 PERMISSION_DENIED`, `404 CHANGE_REQUEST_NOT_FOUND`; advisory only (never applies/publishes/enforces/gates/auto-triggers) |
| BE6-055 | P0 | Backend | MVP6.7 OpenAPI planning artifact | PM6-027, BE6-052~BE6-054 | produce `docs/api/openapi-mvp6-7-draft.json` (OpenAPI 3.1.0, additive/disjoint to MVP1–MVP6.6, version `0.6.7-draft`); parses; redefines no MVP1–MVP6.6 path; no runtime code; captures open questions |
| BE6-056 | P0 | Backend | MVP6.7 impact-simulation endpoint + report assembly (Wave46 impl) | PM6-028, BE6-052~BE6-055 | implement `GET /api/v1/ontology-change-requests/{id}/impact-simulation` in the governance module matching `openapi-mvp6-7-draft.json` EXACTLY; assemble `ImpactSimulationReport` (5 dimensions) by READING existing candidate/published/validation/quality data by reference; read authz = viewer of the request; `403 PERMISSION_DENIED`/`404 CHANGE_REQUEST_NOT_FOUND` |
| BE6-057 | P0 | Backend | MVP6.7 dependency walk (G1) + severity computation (G3) (Wave46 impl) | PM6-028, BE6-056 | per PM G1 walk BOTH candidate + published dependents (each layer labeled); bounded transitive ontology walk depth 2 via `OntologyProperty.class_id` (property→class), `OntologyRelation.domain_class_id`/`range_class_id` (relation→class), sub/superclass; compute `ImpactSeverity`/`ImpactSeverityReason` deterministically per frozen G3 (highest rule wins: published dependents→BREAKING; candidate dependents or FAILED validation→HIGH; transitive dependents or WARNING validation/quality→MEDIUM; direct-only→LOW; ADD no dependents→NONE) |
| BE6-058 | P0 | Backend | MVP6.7 bounding/truncation (G2) + all-false guard (Wave46 impl) | PM6-028, BE6-056 | per PM G2 per-dimension `ref_cap` default 20 (query override min 1 max 200) with exact `count` (never capped) + `truncated=true` iff `count>len(refs)`; every response carries the all-false `ImpactSimulationMutationGuard` (every flag `const false`) |
| BE6-059 | P0 | Backend | MVP6.7 OpenAPI export/alignment + no-mutation regression guard (Wave46 impl) | PM6-028, BE6-056~BE6-058 | actual OpenAPI aligns with `openapi-mvp6-7-draft.json` (0 field/enum mismatch); focused tests (report shape + 5 dimensions, deterministic severity across cases, bounding/truncation, DATA-LEVEL no-mutation before==after, all-false guard, read authz); MVP6.6/earlier regression + ruff clean; additive-only |
| BE6-048 | P0 | Backend | MVP6.6 application-status pre-check runtime | PM6-026, BE6-044~BE6-047 | implement `GET /api/v1/ontology-change-requests/{id}/application-status` in the governance module: resolve the effective DRAFT target (G1), per-item before/after `OntologyElementRef` preview, advisory `would_supersede`/per-item `stale`+`stale_reason` (G2), `capabilities.can_apply` (G6), all-false `GovernanceMutationGuard`; PURELY ADVISORY — never flips `QUEUED→SUPERSEDED` (G5) |
| BE6-049 | P0 | Backend | MVP6.6 apply action + DRAFT mutation + state transitions | PM6-026, BE6-048 | implement `POST /api/v1/ontology-change-requests/{id}/apply`: valid only from `APPROVED`+`QUEUED`; ALL-OR-NOTHING (G4) apply of items to a DRAFT ontology version via MVP1 ontology-edit semantics (ADD=create/MODIFY=update/DEPRECATE=`OntologyElementStatus=ARCHIVED`); `application_state=APPLIED`; store reflects applied element state for honest re-check/audit; published graph never touched |
| BE6-050 | P0 | Backend | MVP6.6 staleness/idempotency/authz + one-true-flag guard | PM6-026, BE6-049 | staleness auto-detect at apply against the APPROVE-time snapshot (G3) → `409 CHANGE_REQUEST_SUPERSEDED` + `QUEUED→SUPERSEDED` (terminal), nothing mutated; idempotency `409 CHANGE_ALREADY_APPLIED`/`CHANGE_NOT_APPLICABLE`; target `409 APPLY_TARGET_NOT_DRAFT`; authz `403 PERMISSION_DENIED` (approver rights, applier may differ, no self-apply bar); successful apply returns `GovernanceApplicationMutationGuard` with only `ontology_draft_mutated=true` (G8); blocked apply keeps all-false guard |
| BE6-051 | P0 | Backend | MVP6.6 application audit + OpenAPI export/alignment + no-published-mutation regression guard | PM6-026, BE6-049, BE6-050 | `GET .../application-audit` (`CHANGE_REQUEST_APPLIED`/`CHANGE_REQUEST_SUPERSEDED`, chronological ASC, limit/cursor); audit records actor/role/timestamp/source request+applied item ids/resulting DRAFT version id/per-item before-after refs (`stale_detail` on supersede); actual OpenAPI matches `openapi-mvp6-6-draft.json` (3 paths/3 ops); tests: pre-check, apply happy path, published/candidate/prompt/publish-job UNCHANGED after apply (data-level), staleness 409, idempotency 409s, authz 403, guard, audit; MVP6.5 regression + ruff clean |
| BE6-001 | P0 | Backend | Evaluation dataset schemas/API | PM6-001 | project-scoped create/list/detail endpoints expose dataset status, counts, timestamps, and OpenAPI schemas |
| BE6-002 | P0 | Backend | Evaluation sample and gold item schemas/API | BE6-001 | sample create/list plus gold entity/relation create/list preserve sample/source evidence context |
| BE6-003 | P0 | Backend | Deterministic evaluation run service | BE6-001, BE6-002, PM6-003 | `DETERMINISTIC_MOCK` run stores ontology/prompt/model/parser context and produces reproducible candidate-vs-gold comparison |
| BE6-004 | P0 | Backend | Metric and error-case read API | BE6-003 | metrics expose value/numerator/denominator/formula/status; errors expose candidate-vs-gold and evidence context |
| BE6-005 | P0 | Backend | MVP6 OpenAPI/export/update | BE6-001~BE6-004 | actual OpenAPI includes selected MVP6.1 paths/schemas/enums and existing MVP1-MVP5 paths remain compatible |
| BE6-006 | P1 | Backend | Dataset versioning and gold evidence object | BE6-001~BE6-004 | dataset revisions and standalone gold evidence CRUD are added after P0 happy path passes |
| BE6-007 | P1 | Backend | Benchmark comparison and confusion matrix | BE6-003, BE6-004 | multiple runs can be compared by prompt/model/ontology version and relation/class buckets |
| BE6-008 | P2 | Backend | Real LLM benchmark provider execution | BE6-003 | real provider execution is added only after deterministic run contract and safety checks are stable |
| BE6-009 | P2 | Backend | Active learning and governance foundations | PM6-007 | learning signals, prompt suggestions, ontology change requests, and impact simulation are separate future slices |
| BE6-010 | P1 | Backend | Actual smoke support | PM6-008, PM6-009 | actual backend runtime supports repeated dataset/sample/gold/run/metrics/errors smoke without durable DB persistence |
| BE6-011 | P1 | Backend | Evaluation contract stability | PM6-008, BE6-005 | OpenAPI keeps `EvaluationCandidateRef`, metrics/errors, and Wave28 MVP6.1 schemas stable for Frontend/QA actual smoke |
| BE6-012 | P0 | Backend | Learning signal API contract | PM6-010, PM6-011 | planning-only additive endpoints expose project-scoped summary and signal lists from approved source artifacts |
| BE6-013 | P0 | Backend | Correction pattern and prompt suggestion DTOs | PM6-011, PM6-012 | DTOs include source artifact refs, signal taxonomy, pattern support counts, prompt suggestion preview, and safety notes |
| BE6-014 | P0 | Backend | Suggestion decision API contract | PM6-012 | decision contract records `ACCEPT`/`DISMISS` audit notes without mutating prompts, candidates, policies, or published graph; `SUPERSEDED` remains read-side only in P0 |
| BE6-015 | P0 | Backend | MVP6.2 OpenAPI planning artifact | BE6-012~BE6-014 | `docs/api/MVP6_2_API_CONTRACT_DRAFT.md` and optional `openapi-mvp6-2-draft.json` parse and remain planning-only |
| BE6-016 | P0 | Backend | Decision vocabulary contract alignment | PM6-014 | Wave31 contract keeps request commands `ACCEPT`/`DISMISS`, resulting states `ACCEPTED`/`DISMISSED`, read-side `SUPERSEDED`, and default non-`SUGGESTED` conflict |
| BE6-017 | P0 | Backend | Learning summary field alignment | PM6-015 | summary contract uses the Wave31 frozen field names including superseded and high-risk suggestion counts |
| BE6-018 | P0 | Backend | Source artifact and auto-approval preview field alignment | PM6-015 | source artifact enum and auto-approval preview fields align to the frozen PM/OpenAPI/Frontend names without adding `evidence_quality_summary` |
| BE6-019 | P0 | Backend | Learning signal runtime endpoints | PM6-016, BE6-012~BE6-018 | deterministic project-scoped runtime endpoints return summary, correction patterns, prompt suggestions, and auto-approval previews matching the frozen OpenAPI fields |
| BE6-020 | P0 | Backend | Suggestion decision audit runtime | PM6-016, BE6-014 | `ACCEPT`/`DISMISS` transition only `SUGGESTED` suggestions, `DISMISS` enforces reason rules, and non-`SUGGESTED` decisions return conflict |
| BE6-021 | P0 | Backend | MVP6.2 OpenAPI export/runtime alignment | BE6-019, BE6-020 | runtime OpenAPI export or comparison keeps the five MVP6.2 endpoint families and DTO/enums aligned with the Wave31 planning artifact |
| BE6-022 | P0 | Backend | No-mutation regression guard | PM6-016, BE6-020 | decision responses and tests prove prompt, candidate graph, published graph, policy, extraction, and evaluation mutation flags remain false |
| BE6-023 | P0 | Backend | MVP6.3 Benchmark Comparison contract draft | PM6-017, BE6-005, BE6-007 | `docs/api/MVP6_3_BENCHMARK_COMPARISON_API_CONTRACT_DRAFT.md` and `docs/api/openapi-mvp6-3-draft.json` define additive read-only comparison/confusion-matrix endpoints, the new enums, metric delta/comparability/confusion-cell DTOs, baseline + epsilon rule, and an all-false analysis mutation guard; planning-only, parses as OpenAPI 3.1.0, additive to MVP1-MVP6.2 paths |
| BE6-024 | P0 | Backend | MVP6.3 comparison + delta endpoints | PM6-018, BE6-023 | `POST/GET /api/v1/projects/{project_id}/benchmark-comparisons` and `GET /api/v1/benchmark-comparisons/{comparison_id}` implement the read-aggregation builder over existing MVP6.1 runs, persist a deterministic process-local comparison record keyed by `comparison_id` (list + GET-by-id round-trip), per-metric signed delta with `MetricDeltaStatus` + fixed epsilon `0.0001` (`NOT_COMPARABLE` -> `delta: null`), and 3-level comparability flags |
| BE6-025 | P0 | Backend | MVP6.3 confusion matrix + cell error-case drilldown | PM6-018, BE6-024 | `GET .../confusion-matrix` per run + `ConfusionMatrixAxis`, `GET .../confusion-matrix/cells/{cell_id}/error-cases` with pagination; cells derive only from existing `EvaluationErrorCase` + implied matches, `NOT_APPLICABLE` empty buckets, `__NONE__` false-pos/neg sentinel, deterministic URL-safe `cell_id` |
| BE6-026 | P0 | Backend | MVP6.3 OpenAPI export / runtime alignment | PM6-018, BE6-024, BE6-025 | runtime DTO field names + new enums match `openapi-mvp6-3-draft.json` (0 field-name mismatch on shared schemas); MVP6.1 shapes reused by `$ref` with no rename |
| BE6-027 | P0 | Backend | MVP6.3 no-mutation regression guard | PM6-018, BE6-024 | all responses expose an all-false `BenchmarkMutationGuard`; `>=2` terminal-success eligibility with `excluded_runs[]`/`RunExclusionReason`; focused tests cover endpoints, delta + epsilon boundary, comparability flags, sparse/`__NONE__` matrix, cell drilldown, eligibility/exclusion, no-mutation; MVP6.1 evaluation tests stay green |
| BE6-028 | P0 | Backend | MVP6.4 Gold Set authoring contract draft | PM6-021, BE6-006 | `docs/api/MVP6_4_GOLD_SET_AUTHORING_API_CONTRACT_DRAFT.md` + `docs/api/openapi-mvp6-4-draft.json` define additive endpoint families for gold-item edit/archive/restore, standalone `GoldEvidence` CRUD, dataset revision create/list/activate, export bundle GET, and import dry-run/confirm; reuse `EvaluationDataset`/`EvaluationSample`/`GoldEntity`/`GoldRelation`/`GoldEvidenceRef` by `$ref` (no rename); new enums `GoldItemStatus`/`DatasetRevisionStatus`/`GoldAuthoringAction`/`GoldSetImportCompatibility`; all-false `GoldAuthoringMutationGuard` on every authoring/import response; planning-only, parses as OpenAPI 3.1.0, additive/disjoint to MVP1-MVP6.3 paths |
| BE6-029 | P0 | Backend | MVP6.4 dataset revision + run-pin reproducibility contract | PM6-021, BE6-028 | revision lifecycle `DRAFT->ACTIVE->FROZEN->ARCHIVED` with freeze-on-pin / freeze-on-activate; at most one `ACTIVE` per dataset; runs pin only `ACTIVE`/`FROZEN`; `EvaluationRun.dataset_version_id` never rewritten; contract documents how a prior run resolves to its immutable snapshot; capture open questions on exact freeze trigger timing |
| BE6-030 | P0 | Backend | MVP6.4 import/export compatibility + ownership contract | PM6-021, BE6-028 | export = read-only single-revision JSON bundle (samples + gold items + evidence + ontology version context, no prompts/candidates/published/secrets); import = dry-run report (`GoldSetImportCompatibility`) then explicit confirm with strategy (`CREATE_NEW_DATASET`/`NEW_REVISION_OF_EXISTING`), never auto-merge, never edit FROZEN, `INCOMPATIBLE` blocked; expert-owner (`owner_id`)/admin-only authoring with permission/conflict responses |
| BE6-031 | P0 | Backend | MVP6.4 no-mutation regression guard | PM6-021, BE6-028 | every authoring/import response exposes all-false `GoldAuthoringMutationGuard` (`published_graph_mutated`, `candidate_graph_mutated`, `prompt_version_mutated`, `ontology_definition_mutated`, `extraction_job_started`, `evaluation_run_started`, `prior_run_pin_rewritten`); archive/freeze instead of hard delete; MVP6.1-6.3 evaluation/benchmark contracts stay stable (no rename) |
| BE6-032 | P0 | Backend | MVP6.4 gold item edit/archive + GoldEvidence CRUD runtime | PM6-022, BE6-028 | implement endpoint families A (gold item edit/archive/restore) + B (standalone `GoldEvidence` CRUD) in a new module with a deterministic process-local store + `reset_runtime_store()`; field/enum names match `openapi-mvp6-4-draft.json` exactly; archive-not-delete; `409 GOLD_ITEM_IMMUTABLE` on FROZEN-owned items; owner/admin-only (`403`) |
| BE6-033 | P0 | Backend | MVP6.4 dataset revision cut/activate + freeze-on-pin runtime | PM6-022, BE6-032 | implement family C (revision cut/list/get/activate); enforce the PM-frozen rule: `pinned_run_count>0` ⇒ status transitions to FROZEN, no ACTIVE-but-immutable, at most one ACTIVE per dataset (vacated on pin-freeze), runs pin only ACTIVE/FROZEN; `409 REVISION_FROZEN`/`REVISION_NOT_DRAFT`; `EvaluationRun.dataset_version_id` never rewritten |
| BE6-034 | P0 | Backend | MVP6.4 export/import dry-run+confirm + audit log runtime | PM6-022, BE6-032 | implement families D (export GET + import dry-run/confirm) + E (audit log); dry-run-first 4-state `GoldSetImportCompatibility`; explicit `GoldSetImportStrategy` on confirm; `INCOMPATIBLE` blocked (`409`), no auto-merge, never edit FROZEN; all-false `GoldAuthoringMutationGuard` on every response |
| BE6-035 | P0 | Backend | MVP6.4 OpenAPI export/alignment + no-mutation regression | PM6-022, BE6-032~BE6-034 | export runtime OpenAPI for MVP6.4 paths and compare to `openapi-mvp6-4-draft.json` (0 field/enum mismatch); focused tests for the 5 families + freeze-on-pin + run-pin-not-rewritten + authz + guard; MVP6.1 evaluation tests + ruff stay green; additive/no-rename |
| BE6-036 | P0 | Backend | MVP6.5 governance change-request contract draft | PM6-023 | draft additive endpoint families + DTO/enum names in `docs/api/MVP6_5_GOVERNANCE_API_CONTRACT_DRAFT.md`: change-request create/list/get + proposer update (while DRAFT/OPEN), submit, withdraw; reuse `ReviewDecisionType` semantics + `Role` + MVP3/MVP5 audit shape by `$ref` (no rename); define `OntologyChangeRequest` + `OntologyChangeItem` DTOs, `ChangeRequestTargetKind`/`ChangeRequestChangeType`, `OntologyChangeRequestStatus`; ontology element refs are read-only |
| BE6-037 | P0 | Backend | MVP6.5 review/decision + approval-is-intent contract | PM6-023, BE6-036 | define review actions (`comment`/`request-changes`) and `approve`/`reject` with reason rules (REJECT/REQUEST_CHANGES/APPROVE require reason); state machine `DRAFT→OPEN→IN_REVIEW→{APPROVED|REJECTED}` + WITHDRAWN; `409 CHANGE_REQUEST_STATE_CONFLICT` on terminal/wrong-state; approver≠proposer (`403`); orthogonal `GovernanceApplicationState` (`QUEUED` on approve; `APPLIED`/`SUPERSEDED` reserved, not produced in P0); document that approval applies nothing |
| BE6-038 | P0 | Backend | MVP6.5 audit log + no-mutation guard contract | PM6-023, BE6-036 | governance audit-log GET reusing the MVP3/MVP5 audit shape; `GovernanceAuditAction` enum (9 events); every governance write response exposes all-false `GovernanceMutationGuard` (`ontology_definition_mutated`, `published_graph_mutated`, `candidate_graph_mutated`, `prompt_version_mutated`, `publish_job_started`, `extraction_job_started`, `change_auto_applied`); no ontology/candidate/published/prompt mutation; no hard delete |
| BE6-039 | P0 | Backend | MVP6.5 OpenAPI planning artifact | PM6-023, BE6-036~BE6-038 | produce `docs/api/openapi-mvp6-5-draft.json` — parses as OpenAPI 3.1.0, version label `0.6.5-draft`, additive/disjoint to MVP1-MVP6.4 paths; capture open questions (OPEN→IN_REVIEW auto-advance timing; whether `approve` needs a distinct `application_note` vs decision reason); no runtime code/models/migrations/tests |
| BE6-044 | P0 | Backend | MVP6.6 change-application contract draft | PM6-025, BE6-036~BE6-039 | draft additive endpoint(s) + DTO/enum names in `docs/api/MVP6_6_GOVERNANCE_APPLICATION_API_CONTRACT_DRAFT.md`: an `apply` action on a change request (e.g. `POST .../change-requests/{id}/apply` with optional `target_ontology_version_id`) valid only from `APPROVED`+`QUEUED`; a read-only application-status pre-check (target DRAFT version + per-item before/after preview + staleness/would-supersede hint); an application-audit read; reuse MVP6.5 governance + MVP1 ontology-version + MVP3/MVP5 audit/`Role` shapes by `$ref` (no rename); ontology-edit semantics ADD=create/MODIFY=update/DEPRECATE=archive on a DRAFT version only |
| BE6-045 | P0 | Backend | MVP6.6 apply state + staleness/idempotency contract | PM6-025, BE6-044 | `application_state` QUEUED→APPLIED on success; QUEUED→SUPERSEDED on staleness (auto-detected at apply time: approved snapshot ≠ current draft target); `409 CHANGE_ALREADY_APPLIED` (already APPLIED), `409 CHANGE_NOT_APPLICABLE` (not APPROVED/QUEUED), `409 CHANGE_REQUEST_SUPERSEDED` (stale, no mutation), `409 APPLY_TARGET_NOT_DRAFT` (non-DRAFT target); authz = approver rights (`403 PERMISSION_DENIED`), applier may differ from approver, no self-apply bar; `APPLIED`/`SUPERSEDED` produced only here; document that publish is NOT part of this slice |
| BE6-046 | P0 | Backend | MVP6.6 redefined mutation guard + application audit contract | PM6-025, BE6-044 | new `GovernanceApplicationMutationGuard` on the successful-apply response with exactly one true flag `ontology_draft_mutated: true` (all of `published_graph_mutated`/`candidate_graph_mutated`/`prompt_version_mutated`/`publish_job_started`/`extraction_job_started`/`evaluation_run_started` false); read/lifecycle endpoints + blocked apply keep the existing all-false `GovernanceMutationGuard`; application audit records actor/role/timestamp/source request+applied item ids/resulting DRAFT `target_ontology_version_id`/per-item before-after element refs via new `GovernanceApplicationAuditAction` (`CHANGE_REQUEST_APPLIED`, `CHANGE_REQUEST_SUPERSEDED`), reusing MVP3/MVP5 audit shape by reference; no hard delete; no published-graph write |
| BE6-047 | P0 | Backend | MVP6.6 OpenAPI planning artifact | PM6-025, BE6-044~BE6-046 | produce `docs/api/openapi-mvp6-6-draft.json` — parses as OpenAPI 3.1.0, version label `0.6.6-draft`, additive/disjoint to MVP1-MVP6.5 paths; capture open questions (target-draft default vs explicit; exact staleness comparison key per change_type; whether the read-only pre-check may itself flip QUEUED→SUPERSEDED or only the apply attempt); no runtime code/models/migrations/tests |

## Frontend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| FE6-073 | P0 | Frontend | MVP6.7 Impact Simulation UX/API requirements (planning) | PM6-027, BE6-052~BE6-055 | document `docs/pm/MVP6_7_FRONTEND_UX_REQUIREMENTS.md`: a contextual "영향도(Impact)" panel/tab on the Governance change-request detail — **no new global LNB item** (ADR 0010), no new Analyze destination; closed Section+Card design language; run-impact-simulation affordance (read-only); no route/component/type/mock/smoke code |
| FE6-074 | P0 | Frontend | MVP6.7 impact report layout + severity badges | PM6-027, FE6-073 | report layout for the five dimensions: affected ontology elements + transitive dependents (depth 2); dependent candidate/published counts + capped lists with a "truncated / N total" affordance; affected MVP3 validations (`ValidationRuleCode`) + MVP4 quality (`QualityMetricGroup`) refs; `ImpactSeverity` per-item + rollup with **D6 badges** (`NONE`/`LOW`/`MEDIUM`/`HIGH`/`BREAKING`); KO titles |
| FE6-075 | P0 | Frontend | MVP6.7 read-only/advisory copy + states | PM6-027, FE6-073 | first-class loading/empty/error/permission states; a "read-only analysis — no apply / no publish / no enforcement" banner + reassurance line (never reads as a gate or an apply; running the simulation mutates nothing); severity is informational and never blocks the separate MVP6.6 apply / MVP3 publish paths |
| FE6-076 | P0 | Frontend | MVP6.7 DTO gap analysis vs Backend draft | PM6-027, BE6-052~BE6-055 | DTO/field/enum gap analysis of the FE impact-report needs vs `docs/api/MVP6_7_IMPACT_SIMULATION_API_CONTRACT_DRAFT.md` + `openapi-mvp6-7-draft.json` (dimensions, `truncated`+`count`, `ImpactSeverity`, all-false `ImpactSimulationMutationGuard`); confirm reuse-by-reference (no rename); no code |
| FE6-077 | P0 | Frontend | MVP6.7 types/client/mocks (Wave46 impl) | PM6-028, BE6-056~BE6-059 | types/client/query/mocks match the frozen `openapi-mvp6-7-draft.json` EXACTLY (5 dimensions, `DependentRefBucket` count/refs/truncated, `ImpactSeverity`/`ImpactSeverityReason`, all-false `ImpactSimulationMutationGuard`); reuse MVP6.5/6.6 governance types by reference (no rename) |
| FE6-078 | P0 | Frontend | MVP6.7 impact panel — 5 dimensions + severity badges + truncation (Wave46 impl) | PM6-028, FE6-077 | contextual "영향도(Impact)" panel on the Governance change-request detail (no new LNB/route); 5 dimensions; `ImpactSeverity` D6 badges (BREAKING/HIGH danger/warning tones); truncation UX = exact `count` + "showing first N" (N=20 per G2) |
| FE6-079 | P0 | Frontend | MVP6.7 states + read-only copy (Wave46 impl) | PM6-028, FE6-077 | first-class loading/empty(NONE)/error/permission-limited states; read-only "no apply / no publish / no enforcement" banner; no apply/publish affordance; severity is informational and never gates |
| FE6-080 | P0 | Frontend | MVP6.7 mock + actual smoke (Wave46 impl) | PM6-028, FE6-077~FE6-079 | add `npm run smoke:mvp6:impact:mock` and, if backend runnable, `:actual` (assert the report renders + all-false guard + no mutation); responsive 0-overflow re-check on the detail page |
| FE6-069 | P0 | Frontend | MVP6.6 types/client/mocks + StatusBadge APPLIED/SUPERSEDED (G7/G8) | PM6-026, BE6-048~BE6-051 | TS types/client/query/mocks match `openapi-mvp6-6-draft.json` exactly (new application DTOs/enums, `GovernanceApplicationMutationGuard` 7 keys per G8, `capabilities.can_apply`); add an `APPLIED` `StatusBadge` token (tone `success`, KO `초안에 적용됨 (미게시)`) and override `SUPERSEDED` from neutral to `warning` tone (KO `대체됨 (미적용)`) per G7; reuse MVP6.5/MVP1/MVP5 shapes by reference, no rename |
| FE6-070 | P0 | Frontend | MVP6.6 application-status pre-check panel | PM6-026, FE6-069 | read-only pre-check panel in the existing Governance detail: resolved target DRAFT version (+ `OntologyVersionStatus` badge), per-item before/after preview (ADD/MODIFY/DEPRECATE), advisory `would_supersede`/per-item `STALE` hint (G5 advisory-only copy — opening the panel never mutates), read-only reassurance line; loading/empty/error states |
| FE6-071 | P0 | Frontend | MVP6.6 apply confirmation + APPLIED/SUPERSEDED/conflict + applied-not-published banner | PM6-026, FE6-069 | single primary `초안에 적용` gated on `APPROVED`+`QUEUED`+`can_apply` (G6), behind a human-confirmation modal (draft-only, cancel non-destructive); `APPLIED`/`SUPERSEDED` badges; 409 conflict/idempotency (`CHANGE_REQUEST_SUPERSEDED`/`CHANGE_ALREADY_APPLIED`/`CHANGE_NOT_APPLICABLE`/`APPLY_TARGET_NOT_DRAFT`) + `403` notices; applied-not-published banner + one-true-flag `ontology_draft_mutated=true` proof line; no auto-apply/publish copy |
| FE6-072 | P0 | Frontend | MVP6.6 mock + actual smoke | PM6-026, FE6-069~FE6-071 | `npm run smoke:mvp6:governance-apply:mock` and (if backend runnable) `:actual` assert apply→APPLIED + one-true-flag guard + staleness 409 SUPERSEDED + published-graph-untouched + 403; `npm run test`/`build` pass; responsive 0-overflow re-check on the Governance detail |
| FE6-001 | P0 | Frontend | Evaluation Studio IA/route | PM6-001 | one stable Evaluation/Benchmark area is added without ID-bound pages in global LNB; loading/empty/error states exist |
| FE6-002 | P0 | Frontend | Gold Set Manager mock/actual boundary | BE6-001, BE6-002 | users can see/create dataset, sample, gold entity, and gold relation through mock fixtures first and actual API when available |
| FE6-003 | P0 | Frontend | Benchmark Dashboard metric cards/table | BE6-003, BE6-004, PM6-003 | entity/relation precision, recall, F1, direction accuracy, evidence match, formula, and not-applicable states are visible |
| FE6-004 | P0 | Frontend | Error Case Explorer | BE6-004 | candidate-vs-gold comparison, sample text, evidence match state, and error type are inspectable |
| FE6-005 | P0 | Frontend | MVP6 API types/client/mocks | BE6-005 | TypeScript types, client calls, and fixtures match backend OpenAPI for the selected P0 slice |
| FE6-006 | P1 | Frontend | Benchmark comparison UX | BE6-007 | compare multiple runs by model, prompt, ontology version, relation type, and source type after P0 passes |
| FE6-007 | P1 | Frontend | Gold Set import/export UX | BE6-006 | import/export states, compatibility warnings, and dataset revision states are designed after backend P1 scope exists |
| FE6-008 | P2 | Frontend | Learning/governance/agent UI shells | PM6-007 | later MVP6 themes remain out of Wave28 and get separate IA/acceptance criteria |
| FE6-009 | P1 | Frontend | Actual API smoke | BE6-010, FE6-005 | `npm run smoke:mvp6:actual` or equivalent verifies the MVP6.1 happy path against actual backend API and keeps `smoke:mvp6:mock` passing |
| FE6-010 | P1 | Frontend | Candidate ref DTO widening | BE6-011, FE6-005 | `EvaluationErrorCase.candidate_ref` uses a frontend `EvaluationCandidateRef` matching Backend fields, not the narrower generic `CandidateRef` |
| FE6-011 | P0 | Frontend | Learning Insights IA | PM6-010 | Learning Insights is placed as a project-scoped workflow area without adding ID-bound pages to the global LNB |
| FE6-012 | P0 | Frontend | Correction Pattern Dashboard requirements | PM6-011, BE6-013 | states and fields support signal summary, correction patterns, source artifact drilldown, loading, empty, error, and permission-limited views |
| FE6-013 | P0 | Frontend | Prompt Improvement Board requirements | PM6-012, BE6-013 | prompt suggestions show preview, rationale, source signals, accept/dismiss decisions, reason notes, and audit result |
| FE6-014 | P0 | Frontend | Auto Approval Candidate Review requirements | PM6-013 | auto-approval candidates render as preview-only recommendations with clear disabled enforcement boundary |
| FE6-015 | P1 | Frontend | Product Showcase style application plan | PM6-010 | any external style guide is distilled into repo-owned guidance before implementation and does not broaden Wave30 runtime scope |
| FE6-016 | P0 | Frontend | Decision vocabulary UX alignment | PM6-014 | UI actions send `ACCEPT`/`DISMISS`, display resulting states separately, keep `SUPERSEDED` read-side only, and show non-`SUGGESTED` conflicts as historical/already-decided states |
| FE6-017 | P0 | Frontend | Backend field naming alignment | PM6-015, BE6-016~BE6-018 | frontend requirements use the Wave31 frozen summary, source artifact, and auto-approval preview field names |
| FE6-018 | P0 | Frontend | Learning Insights route and IA | PM6-016, FE6-011 | project-scoped Learning Insights route renders inside the existing app shell without adding ID-bound detail pages to the global LNB |
| FE6-019 | P0 | Frontend | Learning Insights API types/client/mocks | BE6-019~BE6-021, FE6-017 | TypeScript types, client calls, and deterministic mocks match the frozen MVP6.2 endpoint families and DTO fields |
| FE6-020 | P0 | Frontend | Product Showcase style application | FE6-015, FE6-018 | summary card, workflow queues, badges, action bar, detail panel, decision drawer/modal, and audit timeline make the P0 loop readable without implying automation |
| FE6-021 | P0 | Frontend | Mock and actual smoke | BE6-019~BE6-021, FE6-018~FE6-020 | mock smoke verifies summary to decision audit flow; actual smoke verifies the same flow when Backend runtime is available, including conflict/error state |
| FE6-022 | P0 | Frontend | MVP6.3 Benchmark Comparison UX/API requirements | PM6-017, BE6-023 | document Benchmark Comparison route/IA (project-scoped, contextual to Evaluation/Benchmark area, no ID-bound pages in global LNB), required fields, run-selector + baseline picker, metric delta table, confusion-matrix view with cell drilldown to error cases, comparability-flag display, and first-class loading/empty/error/permission/not-comparable states; planning-only, no route/component/type/mock/smoke code |
| FE6-023 | P0 | Frontend | MVP6.3 route / IA | PM6-018, FE6-022 | project-scoped Benchmark Comparison area contextual to the existing Evaluation/Benchmark surface; no ID-bound pages in the global LNB |
| FE6-024 | P0 | Frontend | MVP6.3 types / client / mocks | PM6-018, BE6-026 | TypeScript types, API client, query hooks, and mocks match the frozen `openapi-mvp6-3-draft.json` exactly; reuse MVP6.1 shapes without rename |
| FE6-025 | P0 | Frontend | MVP6.3 comparison + confusion-matrix UI | PM6-018, FE6-024 | run selection (`>=2` terminal-success) + group-by + baseline -> side-by-side metric table with signed deltas + delta-status badges -> comparability warning band -> confusion matrix with ENTITY_CLASS/RELATION_TYPE toggle -> cell drilldown; honest loading/empty/error/permission/not-comparable/stale states, render `NOT_APPLICABLE` (never fake 0/100%) and `__NONE__` as labeled sentinel, degrade missing run to `excluded_runs` without full crash; no copy implying model selection/autonomous publish |
| FE6-026 | P0 | Frontend | MVP6.3 mock + actual smoke | PM6-018, FE6-025 | `npm run smoke:mvp6:benchmark:mock` and, if backend runnable, `npm run smoke:mvp6:benchmark:actual` exercise run-selection -> deltas -> confusion matrix -> cell drilldown |
| FE6-027 | P1 | Frontend | Candidate tables horizontal-scroll wrapper | Wave35 review §8 | `CandidateResultsPage.tsx` entity/relation tables wrapped in `overflow-x:auto` with table min-width and page-fixed card width; document scrollWidth == clientWidth (0 horizontal overflow) at 1440/1366/1280/768 and 768 CONTEXT column not clipped |
| FE6-028 | P1 | Frontend | Ontology Modeler 1280 stack | Wave35 review §8 | `OntologyModelerPage.tsx` stacks the detail panel (or shrinks canvas min-width) at <=1280; 0 horizontal overflow at 1280 |
| FE6-029 | P1 | Frontend | LNB sub-navigation (two-zone IA) | PM6-019 (§1), ADR 0010 | `navigation.ts`/`AppShell.tsx` implement the global+project two-zone LNB so a selected project exposes Quality/Review/Publish/Published Graph/Search/RAG/Evaluation/Learning Insights/Benchmark; one active item per route; no project -> global zone + hint only; no duplicate current-location confusion |
| FE6-030 | P1 | Frontend | Dashboard value copy + first-action CTA | PM6-019 (§2) | `DashboardPage.tsx` Hero shows the frozen headline+subline, 3 value points, and `프로젝트 시작하기 -> /projects` CTA above the KPI strip |
| FE6-031 | P2 | Frontend | Dashboard recent-activity badges | PM6-019 (§6) | recent-activity status tokens render as `HanaBadge` (tone + icon + Korean secondary label) per the §6 token table |
| FE6-032 | P2 | Frontend | Quality summary strip + collapse | PM6-019 (§5) | `QualityDashboardPage.tsx` shows the 5-item always-visible summary strip first; per-metric/breakdown detail collapses into labeled accordions while preserving formula/numerator/denominator evidence |
| FE6-033 | P2 | Frontend | Breadcrumb common component | PM6-019 (§4) | one breadcrumb component renders `프로젝트명 > 섹션 > 항목` per the §4 per-screen map; section segment == active LNB label; global screens omit breadcrumb |
| FE6-034 | P2 | Frontend | Apply copy-language policy | PM6-019 (§3) | Korean primary; tokens stay English with Korean secondary labels; no intra-screen ko/en title-subtitle mismatch; nav/page wording follows the §3 glossary |
| FE6-035 | P3 | Frontend | Status-token badge guide | PM6-019 (§6) | status tokens across screens render as badge = tone + icon + UPPER_SNAKE token + Korean label; never color-only |
| FE6-036 | P3 | Frontend | 1920 content alignment + Evaluation 768 table | Wave35 review §8 | content centered / max-width raised so 1920 gutters are symmetric; `EvaluationDatasetsPage.tsx` error-case table gets overflow-x + priority columns at 768 |
| FE6-038 | P0 | Frontend | Token foundation (type/space/color/elevation rungs) | PM6-020 §2 | `styles/theme.ts`+`styled.d.ts` add `fontWeight.medium=500/semibold=600/bold=700`, `fontSize.xl=22px` + rename old `xl`->`xxl` (28px), `spacing.section/page`, color roles `accent/accentSoft/surfaceInfo/Success/Warning/Danger/surfaceSelected/surfaceStrong/textOnStrong`, `shadow.card/none`; renamed consumers migrated; `npm run test`+`build` pass |
| FE6-039 | P0 | Frontend | Section+Card module (extend HanaCard) | PM6-020 §3 | `ui/hana/HanaCard.tsx` gains optional `eyebrow`/`action`(single)/`emphasis`(default/summary/info/success/warning/danger); existing call sites unchanged; test for `emphasis="summary"`+`action` |
| FE6-040 | P0 | Frontend | Shared Section/Layout primitives | PM6-020 §3 | promote duplicated `ScreenGrid/Split/Stack/CardBody/Muted/BadgeRow` from `mvp2/3/4Shared` into `ui/platform/Section.tsx`+`Layout.tsx`; per-MVP files import them; no visual diff; build/test pass |
| FE6-041 | P1 | Frontend | Dashboard token + outcome-first subline | PM6-020 §4.1/§5.1 | `DashboardPage.tsx` replaces hardcoded `14/18/26/28px` with tokens (hero `shadow.soft`, KPI `shadow.card`), §5.1 subline, one primary CTA; 0 overflow @1440/1366/1280/768; D2 hero strings unchanged |
| FE6-042 | P1 | Frontend | Review Workbench summary + KO labels + disclosure | PM6-020 §4.3/§5.2 | `ReviewWorkbenchPage.tsx` adds `emphasis="summary"` header, KO decision labels (status badge still EN token per D6), one primary decision button, collapsed raw diff/audit, `PageState` empty/error with CTA |
| FE6-043 | P1 | Frontend | List pages Section+Card grammar | PM6-020 §4.2 | Candidate Results + Sources adopt shared Section rows (`shadow.card`, `surfaceSelected` active, left accent), one primary header action, empty state with CTA; 0 overflow @4 widths (Wave35 wrapper kept) |
| FE6-044 | P1 | Frontend | Benchmark Comparison summary + disclosure | PM6-020 §4.3 | `BenchmarkComparisonPage.tsx` summary-first Section, one primary `비교 실행`, collapsed confusion-matrix/excluded-run detail, honest `NOT_APPLICABLE/__NONE__/NOT_COMPARABLE` badges (D6) |
| FE6-045 | P1 | Frontend | Empty states guide next action | PM6-020 §4.4 | every `PageState kind="empty"` on touched screens has `actionLabel`+`onAction` next step |
| FE6-046 | P2 | Frontend | PageHeader tokenization | PM6-020 §6 | `layout/PageHeader.tsx` reads type/spacing from tokens (no hardcoded 28/18/8px); visual parity; build/test pass |
| FE6-047 | P2 | Frontend | Optional breakpoint token map | PM6-020 §2.5 | optional centralized `breakpoint` tokens; no overflow regression; skippable |
| FE6-048 | P2 | Frontend | Analyze screens Section+Card rollout | PM6-020 §4 | Search/RAG/Learning Insights opportunistically adopt the Section module; each passes build/test + 0 overflow; non-blocking |
| FE6-049 | P0 | Frontend | MVP6.4 Gold Set Manager UX/API requirements | PM6-021, BE6-028 | document Gold Set Manager route/IA (project-scoped, contextual to the existing Evaluation/Gold Set area, no ID-bound pages in the global LNB per ADR 0010), required fields, and first-class loading/empty/error/permission states for gold edit/archive, evidence attach/edit, revision cut/activate, import dry-run/confirm, export, and run->revision pin display; apply closed design language (tokens, Section+Card, KO titles, status badges); list DTO gaps vs Backend draft; planning-only, no route/component/type/mock/smoke code |
| FE6-050 | P0 | Frontend | MVP6.4 gold authoring + revision UX states | PM6-021, FE6-049 | specify edit form / archive confirm / restore states for gold entity+relation; `DatasetRevisionStatus` badges (DRAFT/ACTIVE editable vs FROZEN/ARCHIVED immutable/read-only); one-ACTIVE-per-dataset rule shown; run cards display the FROZEN revision they pin so users see the basis cannot drift; honest permission-limited state for non-owners |
| FE6-051 | P0 | Frontend | MVP6.4 import/export UX | PM6-021, FE6-049 | export action -> downloadable bundle summary; import = upload -> dry-run compatibility report rendering all four `GoldSetImportCompatibility` states with per-item notes -> explicit confirm with strategy choice (`CREATE_NEW_DATASET`/`NEW_REVISION_OF_EXISTING`); `INCOMPATIBLE` blocked with reason; no copy implying auto-merge or published-graph effect |
| FE6-052 | P0 | Frontend | MVP6.4 types/client/mocks alignment plan | PM6-021, BE6-028 | requirements note that Wave40 TS types/client/mocks must match `openapi-mvp6-4-draft.json` exactly and reuse MVP6.1 shapes without rename; enumerate the new authoring DTOs/enums + all-false `GoldAuthoringMutationGuard` display; planning-only |
| FE6-053 | P0 | Frontend | MVP6.4 Gold Set Manager route/IA + types/client/mocks | PM6-022, FE6-049, BE6-032~BE6-035 | implement the project-scoped route contextual to the Evaluation surface (no global LNB ID-page, ADR 0010); TS types/client/query/mocks match the frozen OpenAPI exactly, reuse MVP6.1 evaluation types by `$ref` (no redefine/rename) |
| FE6-054 | P0 | Frontend | MVP6.4 authoring UI (gold edit/archive + GoldEvidence) | PM6-022, FE6-053 | gold entity/relation edit/archive/restore + standalone Gold Evidence attach/edit UI; owner/admin gating via `GoldAuthoringCapabilities` (non-owner read-only hint); loading/empty/error states; design language (Section+Card, KO titles, one primary action) |
| FE6-055 | P0 | Frontend | MVP6.4 revision lifecycle + export/import UI | PM6-022, FE6-053 | `DatasetRevisionStatus` D6 badges (FROZEN read-only + immutable banner reflecting the PM freeze-on-pin rule, no ACTIVE-but-immutable); each run shows its pinned FROZEN revision (reproducibility visible); export JSON; import dry-run compatibility (COMPATIBLE/WARNING/CONFLICT/INCOMPATIBLE, INCOMPATIBLE blocks) → confirm-with-strategy; no publish/auto-merge copy |
| FE6-056 | P0 | Frontend | MVP6.4 mock + actual smoke | PM6-022, FE6-053~FE6-055 | add `npm run smoke:mvp6:goldset:mock` and (if backend runnable) `:actual`; `npm run test`/`build` pass; 0 horizontal overflow @1440/1366/1280/768 for the new screens |
| FE6-057 | P0 | Frontend | MVP6.5 Governance route/IA + field/state review | PM6-023, BE6-036~BE6-039 | requirements note (planning-only, no route/component/type/mock/smoke code): project-scoped Governance area contextual under the Review group (ADR 0010, no global LNB ID-page); change-request board/list by `OntologyChangeRequestStatus`; loading/empty/error/permission states; DTO gaps vs Backend draft |
| FE6-058 | P0 | Frontend | MVP6.5 propose + detail/review UX requirements | PM6-023, FE6-057 | propose form (title/summary + change items: `ChangeRequestTargetKind`/`ChangeRequestChangeType` + element ref + `ontology_version_id`, ADD has null ref); change-request detail (change items + review thread + decision panel); reason-required decision inputs; reviewer/approver permission-boundary UX (non-authorized read-only hint); design language (Section+Card, KO titles, one primary action) |
| FE6-059 | P0 | Frontend | MVP6.5 approval-is-intent + audit UX requirements | PM6-023, FE6-057 | explicit "approved = queued intent, not yet applied" banner surfacing `GovernanceApplicationState` (QUEUED); D6 status badges for request states; audit-trail view (actor/action/reason/timestamp/target element + version/before-after state); no auto-apply/publish copy; make clear application is a later slice |
| FE6-060 | P0 | Frontend | MVP6.5 types/client/mocks alignment plan | PM6-023, BE6-039 | requirements note that Wave42 TS types/client/mocks must match `openapi-mvp6-5-draft.json` exactly and reuse MVP3 review-decision + `Role` + audit shapes without rename; enumerate the new governance DTOs/enums + all-false `GovernanceMutationGuard` display; planning-only |
| FE6-065 | P0 | Frontend | MVP6.6 apply action + field/state review | PM6-025, BE6-044~BE6-047 | requirements note (planning-only, no route/component/type/mock/smoke code) in `docs/pm/MVP6_6_FRONTEND_UX_REQUIREMENTS.md`: how the apply action appears in the existing MVP6.5 Governance detail — visible only for `APPROVED`+`application_state==QUEUED`, only for permitted roles (`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`), behind an explicit human-confirmation step; the application-status pre-check panel (target DRAFT version + per-item before/after preview); first-class loading/empty/error/permission states; DTO gaps vs the Backend draft |
| FE6-066 | P0 | Frontend | MVP6.6 APPLIED + staleness/SUPERSEDED UX | PM6-025, FE6-065 | `APPLIED` state D6 badge; staleness/`SUPERSEDED` conflict UX (warn from the pre-check before apply; on the QUEUED→SUPERSEDED transition block + explain the mismatch, show that nothing was mutated, mark terminal-for-application); idempotency (re-apply disabled / already-applied state); non-permitted read-only hint; no auto-apply/auto-publish copy |
| FE6-067 | P0 | Frontend | MVP6.6 applied-not-published banner + application audit UX | PM6-025, FE6-065 | explicit "applied to DRAFT ontology, NOT published — publish separately" banner (make clear the published graph is unchanged and publishing is a later separate MVP3 step); application-audit view (actor/action/reason/timestamp/source request+items/resulting DRAFT ontology version id/per-item before-after element refs); apply the closed design language (Section+Card, KO titles, D6 badges, one primary action) |
| FE6-068 | P0 | Frontend | MVP6.6 types/client/mocks alignment plan | PM6-025, BE6-047 | requirements note that Wave44 TS types/client/mocks must match `openapi-mvp6-6-draft.json` exactly and reuse MVP6.5 governance + MVP1 ontology-version + MVP3/MVP5 audit/`Role` shapes without rename; enumerate the new application DTOs/enums (`GovernanceApplicationAuditAction`) + the redefined `GovernanceApplicationMutationGuard` display (one true flag `ontology_draft_mutated`); planning-only |

## QA / Integration Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance draft |
|---|---|---|---|---|---|
| INT6-059 | P0 | QA | MVP6.7 Impact Simulation acceptance checklist | PM6-027, BE6-052~BE6-055, FE6-073~FE6-076 | executable `INT6-*` checklist in `docs/backlog/INT6_7_IMPACT_SIMULATION_ACCEPTANCE.md` (C planning + R NOT-RUNNABLE runtime gates) verifies PM/BE/FE agreement on the impact P0 (existing change-request input; hypothetical = P1), the five impact dimensions, the `ImpactSeverity` enum + deterministic rollup, the bounding (depth 2 + ref cap + exact `count` + `truncated`), the read-only/no-mutation boundary + all-false `ImpactSimulationMutationGuard`, the advisory-only (never-a-gate) boundary, the ADR 0010 consumption (no new LNB item), and exclusions; OpenAPI parse/additivity; planning-only with no runtime leakage under `apps/`/`infra/`; recommends Wave46 thin implementation, hardening, or PM redesign |
| INT6-060 | P0 | QA | MVP6.7 read-only + all-false guard assertion | PM6-027, BE6-054 | checklist asserts **every** impact response carries an all-false `ImpactSimulationMutationGuard` (NO flag ever true) and that ontology draft/published, candidate, prompt, extraction, evaluation, and governance state (`status`/`application_state`, no `SUPERSEDED`) are provably unchanged at the data level after running a simulation; the report never applies/publishes/enforces/gates/auto-triggers; distinct from the MVP6.6 `GovernanceApplicationMutationGuard`; reuse-by-reference (no MVP1–MVP6.6 field/enum rename) |
| INT6-061 | P0 | QA | MVP6.7 determinism + bounding + severity assertion | PM6-027, BE6-053 | checklist asserts the report is byte-stable for a fixed change request + graph snapshot; transitive dependents bounded at max depth 2; per-dimension ref lists capped with exact `count` + `truncated` when hit; `ImpactSeverity` per-item + rollup (max + per-severity counts) follows the frozen deterministic rule (BREAKING/HIGH/MEDIUM/LOW/NONE); affected MVP3 `ValidationRuleCode` + MVP4 `QualityMetricGroup` reported by reference |
| INT6-062 | P0 | QA | Wave45 planning recommendation | PM6-027, INT6-059~INT6-061 | confirm brief/ADR 0014/backlog/Backend/Frontend artifacts agree on the impact P0 flow, dimensions, `ImpactSeverity` + bounding, the read-only/no-mutation + advisory-only boundary, ADR 0010 consumption, and exclusions; recommend Wave46 thin implementation, targeted hardening, or PM redesign with exact follow-up gates |
| INT6-063 | P0 | QA | MVP6.7 backend runtime acceptance (R1/R3/R4/R5) (Wave46) | PM6-028, BE6-056~BE6-059 | validate the endpoint returns a deterministic `ImpactSimulationReport`; 5 dimensions populated incl. bounded transitive (depth 2, both candidate+published layers per G1) + `truncated`/exact `count` (ref_cap 20 per G2); severity per frozen G3 rules + rollup; read authz (viewer allowed), governance `status`/`application_state` never changed |
| INT6-064 | P0 | QA | MVP6.7 frontend mock/API acceptance (R6) (Wave46) | PM6-028, FE6-077~FE6-080 | validate the FE impact panel (5 dimensions + severity badges + truncation "showing first N" + read-only copy, no apply/publish affordance); `smoke:mvp6:impact:mock` + `:actual` (if runnable); 0-overflow re-check |
| INT6-065 | P0 | QA | MVP6.7 read-only no-mutation DATA-level guard (R2) (Wave46) | PM6-028, BE6-058 | INDEPENDENTLY verify at DATA level that the GET mutates NOTHING (all surface tables ontology draft/published/candidate/prompt/governance state before==after the call); response `ImpactSimulationMutationGuard` all-false (no flag ever true) |
| INT6-066 | P0 | QA | MVP6.7 Wave46 closeout + regression (R7) (Wave46) | PM6-028, INT6-063~INT6-065 | update `INT6_7_IMPACT_SIMULATION_ACCEPTANCE.md` R1-R7 verdicts; run MVP6.6/earlier regression + touched smokes; confirm additive-only + candidate/published separation intact; recommend closeout / hardening / redesign |
| INT6-055 | P0 | QA | MVP6.6 backend runtime acceptance (R1/R3-R7) | PM6-026, BE6-048~BE6-051 | validate the 3 endpoint families + frozen G1-G6: apply→APPLIED + one-true-flag guard, pre-check advisory (never flips SUPERSEDED, G5), staleness→409 SUPERSEDED (nothing mutated, G4), idempotency 409s, target 409 APPLY_TARGET_NOT_DRAFT (G1), authz 403 (applier≠approver allowed+audited), application audit complete+chronological |
| INT6-056 | P0 | QA | MVP6.6 frontend mock/API acceptance (R8) | PM6-026, FE6-069~FE6-072 | validate the FE apply UX: pre-check panel, confirmation modal, `APPLIED`/`SUPERSEDED` badges (G7), applied-not-published banner + one-true-flag proof line (G8), 409/403 notices; `smoke:mvp6:governance-apply:mock` + `:actual` (if runnable); 0-overflow re-check |
| INT6-057 | P0 | QA | MVP6.6 application-≠-publish + one-true-flag data-level guard (R2) | PM6-026, BE6-050, BE6-051 | INDEPENDENTLY verify at DATA level that after a successful apply the DRAFT ontology IS updated but published-graph/candidate/prompt/publish-job/extraction/evaluation tables are UNCHANGED, and the guard has exactly one true flag `ontology_draft_mutated`; blocked/read endpoints all-false |
| INT6-058 | P0 | QA | MVP6.6 Wave44 closeout + regression (R9) | PM6-026, INT6-055~INT6-057 | update `INT6_6_GOVERNANCE_APPLICATION_ACCEPTANCE.md` R1-R9 verdicts; run MVP6.5/earlier regression + touched smokes; confirm additive-only + candidate/published separation intact; recommend closeout / hardening / redesign |
| INT6-001 | P0 | QA | MVP6.1 roadmap alignment | PM6-001~PM6-004 | implementation matches Theme 1 only and excludes real LLM, active learning, governance, agents, connectors, tenants |
| INT6-002 | P0 | QA | Backend contract/runtime smoke | BE6-001~BE6-005 | OpenAPI parses; dataset/sample/gold/run/metric/error endpoints satisfy the PM contract |
| INT6-003 | P0 | QA | Frontend mock/API contract consistency | FE6-001~FE6-005, BE6-005 | frontend types/mocks/client and route states match backend actual API for selected P0 scope |
| INT6-004 | P0 | QA | Gold Set to EvaluationRun happy path | BE6-001~BE6-004, FE6-001~FE6-004 | create dataset, add sample, add gold entity/relation, run deterministic evaluation, view metrics/errors |
| INT6-005 | P0 | QA | Regression guard for MVP1-MVP5 invariants | BE6-005, FE6-005 | candidate/published graph separation, evidence/version traceability, existing smoke markers, and no published graph mutation are preserved |
| INT6-006 | P1 | QA | MVP6.1 actual API smoke | BE6-010, FE6-009 | actual API smoke passes the dataset/sample/gold/run/metrics/errors flow or is classified by the Wave29 PASS/PARTIAL/FAIL rules |
| INT6-007 | P1 | QA | Candidate ref DTO consistency | BE6-011, FE6-010 | Frontend `EvaluationCandidateRef` matches Backend OpenAPI and displays entity/relation candidate context without crashes on nullable fields |
| INT6-008 | P1 | QA | MVP6.1 closeout recommendation | INT6-001~INT6-007 | QA recommends MVP6.1 closeout, targeted Wave30 hardening, or stop for PM redesign based on actual smoke and invariant evidence |
| INT6-009 | P1 | QA | Benchmark comparison acceptance | BE6-007, FE6-006 | multi-run comparison and confusion matrix are verified after MVP6.1 closeout and a separate PM freeze |
| INT6-010 | P2 | QA | Future MVP6 theme acceptance | PM6-007 | active learning, governance, agents, connectors, tenants, and ontology packs receive separate checklists before implementation |
| INT6-011 | P0 | QA | MVP6.2 scope alignment | PM6-010~PM6-013 | Wave30 artifacts agree on P0 flow, source artifacts, exclusions, and no runtime implementation |
| INT6-012 | P0 | QA | Active Learning contract checklist | PM6-011, BE6-012~BE6-015, FE6-011~FE6-014 | acceptance checklist verifies learning signal taxonomy, prompt suggestion states, and decision audit behavior |
| INT6-013 | P0 | QA | Learning signal safety guard | PM6-013 | checklist verifies no candidate/published graph mutation, no automatic policy enforcement, and preview-only auto-approval candidates |
| INT6-014 | P0 | QA | Wave31 implementation recommendation | INT6-011~INT6-013 | QA recommends MVP6.2 thin implementation, targeted contract hardening, or PM redesign |
| INT6-015 | P0 | QA | MVP6.2 hardening recheck | PM6-014, PM6-015, BE6-016~BE6-018, FE6-016~FE6-017 | Wave31 verifies command/state vocabulary, summary fields, source artifact enum, auto-preview fields, and no runtime leakage |
| INT6-016 | P0 | QA | Wave32 implementation recommendation | INT6-015 | QA recommends Wave32 thin implementation with frozen endpoint families, deterministic local data, and no-mutation safety boundary |
| INT6-017 | P0 | QA | MVP6.2 backend runtime acceptance | PM6-016, BE6-019~BE6-022 | QA verifies endpoint behavior, DTO/enums, decision transitions, non-`SUGGESTED` conflict, OpenAPI alignment, and mutation guard evidence |
| INT6-018 | P0 | QA | MVP6.2 frontend mock/API acceptance | PM6-016, FE6-018~FE6-021 | QA verifies Learning Insights mock/actual flow from summary through decision audit note, including loading, empty, error, permission, and conflict states |
| INT6-019 | P0 | QA | MVP6.2 no-mutation guard | PM6-016, BE6-022, FE6-021 | QA confirms no prompt, candidate, published graph, policy, extraction, or evaluation mutation occurs through learning signal operations |
| INT6-020 | P0 | QA | Wave32 closeout recommendation | INT6-017~INT6-019 | QA recommends MVP6.2 thin slice closeout, targeted Wave33 hardening, or stop for PM redesign based on runtime/UI evidence |
| INT6-021 | P0 | QA | MVP6.3 Benchmark Comparison acceptance checklist | PM6-017, BE6-023, FE6-022 | executable checklist verifies OpenAPI parse/additivity, comparison/confusion-matrix happy path over existing runs, new enums and metric delta/comparability/confusion-cell definitions, baseline + epsilon + NOT_COMPARABLE handling, read-only/no-mutation safety boundary, exclusions, and no runtime leakage under `apps/`/`infra/`; recommends Wave34 thin implementation, hardening, or PM redesign |
| INT6-022 | P0 | QA | MVP6.3 backend runtime acceptance | PM6-018, BE6-024~BE6-027 | validate the 4 endpoint families against `INT6_3` runtime gates R1-R10: DTO/enum alignment to OpenAPI, delta math + epsilon, comparability flags, confusion matrix sparse/`__NONE__`, cell drilldown, `POST` -> list -> GET-by-id round-trip (R3), eligibility/exclusion |
| INT6-023 | P0 | QA | MVP6.3 frontend mock/API acceptance | PM6-018, FE6-023~FE6-026 | validate the mock + actual flow run-selection -> deltas -> confusion matrix -> cell drilldown, including comparability / `NOT_APPLICABLE` / `__NONE__` / not-comparable / excluded-run states |
| INT6-024 | P0 | QA | MVP6.3 no-mutation guard | PM6-018, BE6-027 | confirm all-false `BenchmarkMutationGuard` at runtime and no candidate/published/prompt/policy/extraction/evaluation/gold mutation; reverify no MVP6.1 field/enum rename |
| INT6-025 | P0 | QA | Wave34 closeout recommendation | PM6-018, INT6-022~INT6-024 | run selected MVP1-MVP6.2 regression + smokes BE/FE touched; recommend MVP6.3 thin-slice closeout, targeted Wave35 hardening, or PM redesign with exact commands/artifacts and no leftover listeners on 8000/5173 |
| INT6-035 | P0 | QA | MVP6.4 Gold Set authoring acceptance checklist | PM6-021, BE6-028~BE6-031, FE6-049~FE6-052 | executable `INT6-*` checklist verifies PM/BE/FE agreement on the P0 flow, enums/states, source artifacts (reuse-by-ref, no rename), safety boundary, and exclusions; OpenAPI parse/additivity; planning-only with no runtime leakage under `apps/`/`infra/`; recommends Wave40 thin implementation, hardening, or PM redesign |
| INT6-036 | P0 | QA | MVP6.4 reproducibility + revision-immutability guard | PM6-021, BE6-029 | checklist asserts prior `EvaluationRun.dataset_version_id` is never rewritten and prior metrics unchanged by authoring; FROZEN revision is immutable (freeze-on-pin / freeze-on-activate); at most one ACTIVE per dataset; runs never pin DRAFT; gold items/evidence are archived/frozen, never hard-deleted |
| INT6-037 | P0 | QA | MVP6.4 no-mutation + ownership guard | PM6-021, BE6-030, BE6-031 | checklist asserts all-false `GoldAuthoringMutationGuard` on every authoring/import response; no published/candidate/prompt/ontology-definition mutation, no extraction/eval run started; expert-owner/admin-only authoring with permission state; import dry-run-first, explicit confirm, never auto-merge, never edit FROZEN, `INCOMPATIBLE` blocked |
| INT6-038 | P0 | QA | Wave39 planning recommendation | INT6-035~INT6-037 | confirm brief/ADR/backlog/Backend/Frontend artifacts agree; recommend Wave40 thin implementation, targeted hardening, or PM redesign with exact follow-up gates |
| INT6-039 | P0 | QA | MVP6.4 backend runtime acceptance | PM6-022, BE6-032~BE6-035 | validate the 5 endpoint families against `INT6_4` runtime gates R1-R12: DTO/enum alignment to OpenAPI, the PM-frozen freeze-on-pin rule (pin ⇒ FROZEN transition, no ACTIVE-but-immutable), at-most-one-ACTIVE, `409` immutability, authz `403`, import dry-run/compat/strategy/INCOMPATIBLE-blocked, archive-not-delete |
| INT6-040 | P0 | QA | MVP6.4 frontend mock/API acceptance | PM6-022, FE6-053~FE6-056 | validate the mock + actual flow open→edit/archive→evidence→cut revision→export→import dry-run→confirm→run-pin display; FROZEN read-only/immutable banner, compatibility states, permission-limited state |
| INT6-041 | P0 | QA | MVP6.4 no-mutation + reproducibility guard | PM6-022, BE6-035 | independently confirm `EvaluationRun.dataset_version_id` is never rewritten and an old run resolves its exact snapshot; all-false `GoldAuthoringMutationGuard` at response + data level (no published/candidate/prompt/extraction/evaluation-score mutation); no MVP6.1 field/enum rename |
| INT6-042 | P0 | QA | Wave40 closeout recommendation | PM6-022, INT6-039~INT6-041 | run selected MVP6.1/earlier regression + smokes BE/FE touched; recommend MVP6.4 thin-slice closeout, targeted Wave41 hardening, or PM redesign with exact commands/artifacts; no leftover listeners on 8000/5173 |
| INT6-043 | P0 | QA | MVP6.5 Governance acceptance checklist | PM6-023, BE6-036~BE6-039, FE6-057~FE6-060 | executable `INT6-*` checklist verifies PM/BE/FE agreement on the P0 flow, states/enums (`OntologyChangeRequestStatus`, `GovernanceReviewAction`, `ChangeRequestTargetKind`/`ChangeRequestChangeType`, `GovernanceApplicationState`, `GovernanceAuditAction`), decision commands + reason rules, RBAC + segregation of duties, source artifacts (reuse-by-ref, no rename), safety boundary, and exclusions; OpenAPI parse/additivity; planning-only with no runtime leakage under `apps/`/`infra/`; recommends Wave42 thin implementation, hardening, or PM redesign |
| INT6-044 | P0 | QA | MVP6.5 lifecycle + approval-is-intent guard | PM6-023, BE6-037 | checklist asserts the state machine `DRAFT→OPEN→IN_REVIEW→{APPROVED|REJECTED}`+WITHDRAWN; reason required for REJECT/REQUEST_CHANGES/APPROVE; `409 CHANGE_REQUEST_STATE_CONFLICT` on terminal/wrong-state decisions; approver≠proposer (`403`); on APPROVE `application_state=QUEUED` and NOTHING is applied; `APPLIED`/`SUPERSEDED` never produced in P0 |
| INT6-045 | P0 | QA | MVP6.5 no-mutation + audit guard | PM6-023, BE6-038 | checklist asserts all-false `GovernanceMutationGuard` on every governance write response (no ontology-definition/published/candidate/prompt mutation, no publish/extraction job started, `change_auto_applied` false); full audit trail (actor/action/reason/timestamp/target change item + ontology element + version context/before-after state); no hard delete; ontology element refs read-only |
| INT6-046 | P0 | QA | Wave41 planning recommendation | INT6-043~INT6-045 | confirm brief/ADR 0012/backlog/Backend/Frontend artifacts agree on P0 flow, states/commands, approval-≠-auto-apply boundary, safety, and exclusions; recommend Wave42 thin implementation, targeted hardening, or PM redesign with exact follow-up gates |
| INT6-051 | P0 | QA | MVP6.6 change-application acceptance checklist | PM6-025, BE6-044~BE6-047, FE6-065~FE6-068 | executable `INT6-*` checklist in `docs/backlog/INT6_6_GOVERNANCE_APPLICATION_ACCEPTANCE.md` (C planning + R NOT-RUNNABLE runtime gates) verifies PM/BE/FE agreement on the apply P0, states (`APPLIED`/`SUPERSEDED` produced only here), the application-≠-publish + draft-only boundary, staleness→SUPERSEDED, idempotency, authz, the redefined guard (one true flag), the application audit content, and exclusions; OpenAPI parse/additivity; planning-only with no runtime leakage under `apps/`/`infra/`; recommends Wave44 thin implementation, hardening, or PM redesign |
| INT6-052 | P0 | QA | MVP6.6 apply-only-from-QUEUED + draft-only + idempotency + staleness guard | PM6-025, BE6-045 | checklist asserts apply is valid only from `status==APPROVED`+`application_state==QUEUED`; on success `application_state=APPLIED` and the change lands ONLY in a DRAFT ontology version (never the published graph, no publish/extraction job); idempotency `409 CHANGE_ALREADY_APPLIED`/`CHANGE_NOT_APPLICABLE` (no double apply); non-DRAFT target `409 APPLY_TARGET_NOT_DRAFT`; staleness auto-detected at apply time → `application_state=SUPERSEDED`, `409 CHANGE_REQUEST_SUPERSEDED`, nothing mutated; authz = approver rights `403 PERMISSION_DENIED`, applier-may-differ-from-approver audited |
| INT6-053 | P0 | QA | MVP6.6 redefined mutation guard + application audit guard | PM6-025, BE6-046 | checklist asserts the successful-apply response carries `GovernanceApplicationMutationGuard` with exactly one true flag `ontology_draft_mutated: true` and all others false, and that the published graph is provably unchanged at data level; read/lifecycle governance endpoints (MVP6.5 + MVP6.6 pre-check/audit reads) and any blocked apply keep the all-false `GovernanceMutationGuard`; full application audit (actor/role/timestamp/source request+applied item ids/resulting DRAFT `target_ontology_version_id`/per-item before-after element refs) via `GovernanceApplicationAuditAction`; no hard delete; MVP1 ontology-version + MVP3/MVP5 + MVP6.5 shapes reused by reference (no rename) |
| INT6-054 | P0 | QA | Wave43 planning recommendation | INT6-051~INT6-053 | confirm brief/ADR 0013/backlog/Backend/Frontend artifacts agree on the apply P0 flow, states, the application-≠-publish + draft-only + human-initiated boundary, staleness→SUPERSEDED, idempotency, authz, the redefined guard, and exclusions; recommend Wave44 thin implementation, targeted hardening, or PM redesign with exact follow-up gates |

## Wave47 MVP6.8 Agents / Copilot Planning Freeze (PM6-029, ADR 0015)

Wave47 freezes MVP6.8 Agents / Copilot as **contract-first planning only** — the
smallest coherent, SAFE, human-in-the-loop, **non-autonomous** P0. A
project-scoped copilot reads existing project context and produces a
deterministic, source-grounded list of suggested next-actions / draft proposals;
a human accepts (routes into an EXISTING gated flow, pre-filled/deep-linked —
executes NOTHING) or dismisses (with reason); all decisions audit-only; every
response carries an all-false `CopilotMutationGuard`; no real LLM. Boundary in
`docs/pm/MVP6_8_COPILOT_BRIEF.md` + ADR 0015. Runtime waits for Wave48.

- P0 flow: `open project copilot -> view deterministic suggested actions (what / why / source grounding / target gated flow) -> accept (routes human into that gated flow, pre-filled — copilot executes NOTHING) or dismiss (reason) -> decision audit note`.
- Suggestion taxonomy (frozen, 4 kinds; `CopilotSuggestionKind`): `DRAFT_GOVERNANCE_CHANGE_REQUEST` (→ MVP6.5 change-request create/propose, pre-filled draft), `REVIEW_THESE_CANDIDATES` (→ MVP3 candidate review, deep-linked), `INSPECT_QUALITY_OR_VALIDATION_SIGNAL` (→ MVP4 quality / MVP3 validation drilldown), `RUN_IMPACT_SIMULATION` (→ MVP6.7 impact-report panel). Each cites source artifacts + names its target existing gated flow.
- States (`CopilotSuggestionState`, mirrors MVP6.2 — no MVP6.2 rename): `SUGGESTED`→{`ACCEPTED`|`DISMISSED`|`SUPERSEDED`}; `SUPERSEDED` read-side only. Commands `ACCEPT`/`DISMISS` (≠ resulting states); `DISMISS` requires reason code (MVP6.2 set reused: `NOT_RELEVANT`/`INSUFFICIENT_EVIDENCE`/`DUPLICATE`/`OUT_OF_SCOPE`/`RISK_TOO_HIGH`/`OTHER`); non-`SUGGESTED` decision → `409 COPILOT_SUGGESTION_DECISION_CONFLICT`.
- Routing model: `ACCEPT` returns a routing-target descriptor (`CopilotRoutingTargetKind`: `GOVERNANCE_CHANGE_REQUEST_DRAFT`/`CANDIDATE_REVIEW_LOCATION`/`QUALITY_OR_VALIDATION_LOCATION`/`IMPACT_REPORT_LOCATION`) = a deep-link + optional pre-fill payload with NO authority; creates/mutates/applies/approves/publishes nothing.
- All-false `CopilotMutationGuard` on every response (incl. accept), with copilot-specific `copilot_executed_action: false` + `real_model_invoked: false`.
- Authz: any project member views + records audit-only decisions (no elevated role; downstream gate keeps its own RBAC); MVP5 `Role` reused, no new literal; `403`/`404 PROJECT_NOT_FOUND`/`404 COPILOT_SUGGESTION_NOT_FOUND`.
- Exclusions: autonomous action, auto-apply/publish/approve/create, policy enforcement/gating, real LLM, tool-calling/multi-step/orchestration runtime, background/scheduled agents, direct mutation of any graph/prompt/governance/policy state, ungrounded generation, new kinds beyond the 4, multi-tenant/connector runtime. Durable DB/Alembic not required (process-local `reset_runtime_store()` OK); durable persistence P1/P2.

| ID | Priority | Role | Item | Depends on | Acceptance summary |
|---|---|---|---|---|---|
| PM6-029 | P0 | PM | MVP6.8 Copilot P0 freeze | ADR 0015 | freeze the smallest coherent SAFE non-autonomous copilot P0: suggestion taxonomy (4 kinds each naming its target gated flow), suggestion+decision states/commands/reason rules, audit content, source-grounding requirement, accept-routes-not-executes routing model, all-false `CopilotMutationGuard` (incl. `copilot_executed_action`/`real_model_invoked` false), authz, exclusions; `docs/pm/MVP6_8_COPILOT_BRIEF.md` + ADR 0015 + this backlog; durable invariants preserved; planning-only, no `apps/` |
| BE6-060 | P0 | Backend | Copilot API contract draft | PM6-029 | `docs/api/MVP6_8_COPILOT_API_CONTRACT_DRAFT.md`: additive endpoint families (`GET .../copilot/summary`, `GET .../copilot/suggestions`, `GET /copilot-suggestions/{id}`, `POST /copilot-suggestions/{id}/decisions`), reusing MVP6.2 learning-decision + MVP3 candidate/review + MVP4 quality + MVP3 validation + MVP6.5/6.6 governance + MVP6.7 impact + MVP1 ontology/version + MVP5 `Role` by reference (no rename); no runtime code |
| BE6-061 | P0 | Backend | Copilot enums + DTOs | PM6-029 | draft `CopilotSuggestionKind` (4), `CopilotSuggestionState`, `CopilotRoutingTargetKind` (4); suggestion DTO (kind/state/title/rationale/routing-target descriptor + pre-fill payload/source-artifact refs (required)/confidence/risk/audit note); decision request (`ACCEPT`/`DISMISS`+reason) + response (routing target on accept) |
| BE6-062 | P0 | Backend | All-false guard + accept-routes-not-executes contract | PM6-029 | model all-false `CopilotMutationGuard` (14 flags incl. `copilot_executed_action`/`real_model_invoked`) on every response incl. accept; specify accept returns routing target + writes only state transition + audit + routing descriptor (no gated-flow write path); `409 COPILOT_SUGGESTION_DECISION_CONFLICT`, `403`, `404` |
| BE6-063 | P0 | Backend | Copilot OpenAPI planning artifact | BE6-060~062 | `docs/api/openapi-mvp6-8-draft.json` (OpenAPI 3.1.0, additive to MVP1–MVP6.7, e.g. `0.6.8-draft`); JSON parses; disjoint-additive (redefines no MVP1–MVP6.7 path); capture open questions (persist-vs-compute; pre-fill payload shape per kind; deep-link locator shape) |
| FE6-081 | P0 | Frontend | Copilot IA + placement | PM6-029, BE6-060 | `docs/pm/MVP6_8_FRONTEND_UX_REQUIREMENTS.md`: project-scoped copilot placement per ADR 0010 (Analyze-group destination or contextual panel; no ID-bound global LNB pages); no route/component/type/mock/smoke code |
| FE6-082 | P0 | Frontend | Suggestion list + accept-routes UX | PM6-029, BE6-060 | suggestion list layout (what/why/source grounding/target flow); accept-routes-into-existing-flow UX making the human gate explicit (copilot never acts); dismiss+reason; decision audit note; copy states copilot is advisory + executes nothing; closed design language (Section+Card, KO title, D6 badges for confidence/risk) |
| FE6-083 | P0 | Frontend | States + advisory copy | PM6-029 | first-class loading/empty/error/permission states; "advisory — no execution / no auto-apply / no auto-publish / no auto-approve" banner + reassurance; no autonomous/agent-acts copy |
| FE6-084 | P0 | Frontend | DTO gap analysis | BE6-060~063 | DTO gap analysis vs the Backend draft (suggestion/routing-target/guard/decision shapes); enumerate gaps for Backend; no code |
| INT6-067 | P0 | QA | MVP6.8 Copilot acceptance checklist | PM6-029, BE6-060~063, FE6-081~084 | executable `INT6-*` checklist in `docs/backlog/INT6_8_COPILOT_ACCEPTANCE.md` (C planning + R NOT-RUNNABLE runtime gates) verifying PM/BE/FE agreement on the P0 flow, the 4-kind taxonomy each naming its target gated flow, suggestion/decision states + commands + reason rules, source-grounding requirement, the advisory-only/non-autonomous/audit-only/no-real-LLM boundary, and exclusions; OpenAPI parse/additivity; planning-only with no runtime leakage under `apps/`/`infra/`; recommends Wave48 thin implementation, hardening, or PM redesign |
| INT6-068 | P0 | QA | Accept-routes-not-executes guard | PM6-029, BE6-062 | checklist asserts accept returns a routing-target descriptor and executes NOTHING at three layers: response all-false guard (incl. `copilot_executed_action`/`real_model_invoked` false); code-level (copilot module imports no gated-flow write path); data-level (candidate/published/prompt/ontology/governance/extraction/evaluation tables unchanged after summary/list/accept/dismiss); routing target carries no authority (no change request created, no candidate approved, no apply/publish) |
| INT6-069 | P0 | QA | All-false guard + audit + grounding + determinism guard | PM6-029, BE6-061~062 | checklist asserts all-false `CopilotMutationGuard` on every response incl. accept; audit content (actor/role/command/reason/note/timestamp/suggestion snapshot/source refs/returned routing target); every suggestion has non-empty source-artifact refs (no ungrounded generation); deterministic byte-stable suggestion list; non-`SUGGESTED` decision `409`; `DISMISS` reason required; commands ≠ resulting states; authz `403`/`404`; MVP6.2 enums not renamed |
| INT6-070 | P0 | QA | Wave47 planning recommendation | INT6-067~069 | confirm brief/ADR 0015/backlog/Backend/Frontend artifacts agree on the P0 flow, taxonomy, states/commands, accept-routes-not-executes model, all-false + no-real-LLM boundary, authz, and exclusions; recommend Wave48 thin implementation, targeted hardening, or PM redesign with exact follow-up gates |

QA ID correction (Wave39): the QA rows above were re-ranged from the PM-proposed
`INT6-026`~`INT6-029` to `INT6-035`~`INT6-038` because `INT6-026`~`INT6-034` were
already consumed by the closed UI/UX waves 35–38 (see `CURRENT_STATE.md`).

## Wave48 MVP6.8 Copilot THIN IMPLEMENTATION — Gate Freeze (PM6-030, ADR 0015)

Wave48 implements the smallest deterministic ADVISORY-ONLY copilot slice: 4
endpoints, deterministic source-grounded suggestions, accept-returns-routing /
dismiss (audit-only), all-false 14-flag `CopilotMutationGuard`, no real LLM.
PM6-030 freezes G1/G2/G3 in `docs/pm/MVP6_8_COPILOT_BRIEF.md §"Wave48
Implementation Freeze — G1 / G2 / G3"` (authority for BE/FE/QA).

- **G1 (suggestion-generation source rules):** one deterministic trigger per
  `CopilotSuggestionKind`, grouped (one SUGGESTED per natural key, never one/row),
  ordered `(kind ordinal, group key asc)`, capped `suggestion_cap = 20`, every
  suggestion cites ≥1 non-empty source ref. `DRAFT_GOVERNANCE_CHANGE_REQUEST` ←
  recurring correction/validation signal (`CorrectionPattern.support_count ≥ 3`
  OR ≥3 `REVIEW_CORRECTION` same element OR `REPEATED_VALIDATION_FAILURE`/≥3
  `FAILED` `ValidationResult`); `REVIEW_THESE_CANDIDATES` ← `CandidateReviewStatus
  == PENDING` candidates tied to `EVALUATION_ERROR_CASE`/low `QUALITY_DRILLDOWN`;
  `INSPECT_QUALITY_OR_VALIDATION_SIGNAL` ← low `QualityMetric` (`rate < 0.8`) /
  `ValidationRuleCode` cluster with ≥1 `FAILED` (or ≥3 `WARNING`);
  `RUN_IMPACT_SIMULATION` ← `OntologyChangeRequestStatus == APPROVED` AND
  `GovernanceApplicationState == QUEUED`.
- **G2 (routing pre-fill per `CopilotRoutingTargetKind`):** destination
  descriptor + optional pre-fill only, `executes_nothing = true` + `human_gate_note`.
  `GOVERNANCE_CHANGE_REQUEST_DRAFT` → `/…/governance/change-requests/new` +
  `GovernanceChangeRequestDraftPrefill` using real `ChangeRequestTargetKind`
  (**`CLASS`/`PROPERTY`/`RELATION`** — NOT `ONTOLOGY_CLASS`) + `ChangeRequestChangeType`
  (`ADD`/`MODIFY`/`DEPRECATE`) + `OntologyElementRef[]`; `CANDIDATE_REVIEW_LOCATION`
  → `/…/review?candidate_ids=…`; `QUALITY_OR_VALIDATION_LOCATION` →
  `/…/quality?group=…` or `/…/validation?rule_code=…`; `IMPACT_REPORT_LOCATION`
  → `/…/governance/change-requests/{id}/impact`.
- **G3 (summary DTO):** frozen as Wave47 `CopilotSummaryResponse` (no field
  add/rename): `project_id`, `generated_at`, `source_artifact_scope`,
  `total_suggestion_count`, `{suggested,accepted,dismissed,superseded}_count`,
  `high_risk_count`, `counts_by_kind[]`, `advisory_notes[]`, all-false
  `mutation_guard`.
- **Only contract impact:** Wave47 OpenAPI **example** value fix `ONTOLOGY_CLASS`
  → `CLASS` in the governance prefill example (match real `ChangeRequestTargetKind`);
  no schema/field/enum shape change. Scope otherwise unchanged.

| ID | Priority | Role | Item | Depends on | Acceptance summary |
|---|---|---|---|---|---|
| PM6-030 | P0 | PM | MVP6.8 Copilot G1-G3 implementation freeze + scope guard | PM6-029, ADR 0015 | freeze G1 (deterministic suggestion-generation source rules per `CopilotSuggestionKind`), G2 (routing pre-fill payload shape per `CopilotRoutingTargetKind`), G3 (summary DTO fields) as one precise deterministic rule each in `docs/pm/MVP6_8_COPILOT_BRIEF.md §"Wave48 Implementation Freeze"`; confirm scope unchanged (advisory-only, executes nothing, no real LLM, all-false 14-flag guard); record impl IDs; only contract impact is the `ONTOLOGY_CLASS`→`CLASS` example fix; no `apps/` |
| BE6-064 | P0 | Backend | Copilot summary + suggestions (deterministic, source-grounded) | PM6-030 | implement `GET .../copilot/summary` (G3) + `GET .../copilot/suggestions` (G1) in new `apps/backend/app/modules/copilot/`, registered additively, matching `openapi-mvp6-8-draft.json` exactly; deterministic process-local store + `reset_runtime_store()`; byte-stable order `(kind ordinal, group key asc)`, `suggestion_cap=20`; every suggestion cites ≥1 non-empty source ref |
| BE6-065 | P0 | Backend | Suggestion detail + decision (accept-routing / dismiss, audit-only, 409) | PM6-030, BE6-064 | `GET /copilot-suggestions/{id}` + `POST /copilot-suggestions/{id}/decisions`; ACCEPT → `SUGGESTED`→`ACCEPTED` returns `CopilotRoutingTarget` (G2, real `ChangeRequestTargetKind`=`CLASS`), creates/mutates NOTHING; DISMISS → `DISMISSED` requires reason code (422 otherwise); non-`SUGGESTED` → `409 COPILOT_SUGGESTION_DECISION_CONFLICT`; audit-only record |
| BE6-066 | P0 | Backend | All-false 14-flag guard + no-execution/no-LLM guarantees | PM6-030 | all-false `CopilotMutationGuard` (14 flags incl. `copilot_executed_action`/`real_model_invoked` false) on every response incl. accept; copilot module imports NO gated-flow write path; deterministic mock only (no real model); DATA-LEVEL before==after any copilot call incl. ACCEPT |
| BE6-067 | P0 | Backend | OpenAPI export/alignment + no-mutation regression guard | BE6-064~066 | export actual OpenAPI, compare to `openapi-mvp6-8-draft.json` (align the `ONTOLOGY_CLASS`→`CLASS` example); focused `tests/test_mvp6_8_copilot_api.py`; MVP6.7 (`test_mvp6_7_impact_simulation_api.py`) + earlier regression; `ruff`; `git diff --check`; additive-only |
| FE6-085 | P0 | Frontend | Copilot route/IA + types/client/mocks | PM6-030, BE6-064~067 | project-scoped `/projects/:p/copilot` Analyze-group LNB destination per ADR 0010 (no ID-bound global pages); types/client/query/mocks match frozen OpenAPI exactly; reuse MVP6.2/governance types by reference (no rename) |
| FE6-086 | P0 | Frontend | Suggestion list + detail | PM6-030 | suggestion queue + detail (kind/why/source grounding/target flow), `CopilotSuggestionState` D6 badges, confidence/risk badges, source-grounding preview; `SUGGESTED` default queue; contextual detail panel |
| FE6-087 | P0 | Frontend | Accept-routing + dismiss + audit note + advisory copy | PM6-030 | accept → follows `CopilotRoutingTarget` deep-link into the existing gated flow (governance draft / candidate review / quality-validation / impact) WITHOUT the copilot executing anything (navigation CTA, never execute button); dismiss+reason; decision audit note; non-`SUGGESTED` conflict; persistent advisory banner + live all-false guard proof line read from response |
| FE6-088 | P0 | Frontend | Mock + actual smoke | FE6-085~087 | `npm run smoke:mvp6:copilot:mock` (+ `:actual` if backend runnable); `npm run test`; `npm run build`; responsive 0-overflow re-check; `git diff --check` |
| INT6-071 | P0 | QA | Backend runtime verification | BE6-064~067 | validate 4 endpoints, deterministic grounded suggestions (G1), decision transitions + `409`, authz `403`/`404`; update `INT6_8_COPILOT_ACCEPTANCE.md` R1-R4/R6/R7 |
| INT6-072 | P0 | QA | Frontend mock/API verification | FE6-085~088 | validate FE mock + actual copilot flow (list → accept-routes/dismiss → audit note); no execute affordance; D6 badges; states; responsive; R5 |
| INT6-073 | P0 | QA | Advisory-only / no-execution + all-false guard DATA-LEVEL | BE6-065~066 | INDEPENDENTLY assert at DATA level that NO copilot call (esp. ACCEPT) mutates any table / governance state (before==after); 14-flag guard all-false (incl. `copilot_executed_action`/`real_model_invoked`); ACCEPT returns only a routing target; R2 |
| INT6-074 | P0 | QA | Wave48 closeout | INT6-071~073 | run MVP6.7/earlier regression + touched smokes; confirm additive-only + candidate/published separation intact; recommend closeout / hardening / redesign; exact commands; no leftover listeners on 8000/5173; `git diff --check` |

## Wave49 MVP6.9 Connectors / Plugin SDK PM Freeze Summary

Wave49 opens the next MVP6 theme (roadmap §10 Theme 7) as contract-first planning
only. The chosen P0 is the smallest coherent, SAFE slice: a project-scoped
**read-only connector catalog** + a **deterministic dry-run import preview** —
no external write, no live/scheduled sync, no real network/credential execution
(deterministic mock connectors on fixture data), no plugin code execution, masked
secrets only, all-false mutation guard. Runtime waits for Wave50 after Backend
contract draft, Frontend field/state/IA review, and a QA executable checklist.
Full freeze: `docs/pm/MVP6_9_CONNECTORS_BRIEF.md`; durable boundary:
`docs/adr/0016-mvp6-9-connectors-read-only-catalog-dry-run-preview-no-external-write-no-real-network-masked-secret-boundary.md`.

Frozen MVP6.9 P0 demo flow:

```text
select project
-> open Connectors (Analyze/Sources area)
-> view connector catalog (3 deterministic mock connector kinds)
-> open a kind -> see its masked config schema (secret fields masked)
-> fill mock config + run dry-run import PREVIEW
-> read compatibility + summary counts + capped would-be candidate items
-> read the explicit "preview only — nothing imported; a real run routes through
   the existing extraction -> candidate -> review -> publish gate" boundary
```

Frozen enums:

- `ConnectorKind`: `FILE_SOURCE`, `REST_SOURCE`, `KNOWLEDGE_BASE_SOURCE` (exactly 3).
- `ConnectorConfigFieldKind`: `STRING`, `URL`, `ENUM`, `INTEGER`, `BOOLEAN`, `SECRET`.
- `ConnectorPreviewStatus`: `READY`, `BLOCKED`.
- `ConnectorPreviewCompatibility`: `COMPATIBLE`, `WARNING`, `INCOMPATIBLE`.
- `ConnectorPreviewTargetLayer`: `CANDIDATE` (single literal; items map to
  candidate layer only, never published).

Reuse by reference (no renames): MVP5 masked-secret credential safety
(`masked_secret` / never-log-raw / `raw_secret_present:false`) + MVP5 admin JSON
import dry-run (`compatibility_status`/`summary`/nothing-applied); MVP6.4
`GoldSetImportCompatibility` dry-run precedent; MVP2 candidate pipeline
(`CandidateEntity`/`CandidateRelation`, `source_segment`, `SourceParseResponse`,
extraction-job) as the would-be target shapes; MVP1 `OntologyElementRef` + version
context; MVP5 `Role`.

All-false `ConnectorMutationGuard` on every response (catalog list, config schema,
import preview):

- `external_system_read: false`
- `external_system_write: false`
- `real_network_call_made: false`
- `credential_persisted: false`
- `connector_instance_persisted: false`
- `source_created: false`
- `candidate_graph_mutated: false`
- `published_graph_mutated: false`
- `extraction_job_started: false`

Authorization: read-only, mutates/grants nothing → any project member who can view
the project may list catalog, read config schema, and run dry-run preview; no
elevated role; reuse MVP5 `Role`, no new role literal. Unauthorized →
`403 PERMISSION_DENIED`; missing project / unknown kind → `404 PROJECT_NOT_FOUND` /
`404 CONNECTOR_KIND_NOT_FOUND`.

Frozen exclusions: external write-back; live/scheduled/background sync;
confirm-and-apply real import; real network / credential execution / external
connection; credential storage/encryption/vault/rotation; connector instance
persistence; autonomous/auto-confirmed ingestion; plugin code execution + the
entire Plugin* family (`PluginDefinition`/`PluginVersion`/`PluginExecution`/
`PluginPermission`); real Database/S3-MinIO/Web-Crawler/Notion-Confluence/Git
connectors; setup wizard write; sync job monitor; plugin management/execution log;
direct candidate/published-graph mutation; source create / extraction trigger from
preview; multi-tenant/cross-project connector runtime; real LLM; any new connector
kind beyond the frozen 3.

Suggested endpoint families (Backend finalizes in `BE6-068`):

- `GET  /api/v1/projects/{project_id}/connectors`
- `GET  /api/v1/projects/{project_id}/connectors/{connector_kind}/config-schema`
- `POST /api/v1/projects/{project_id}/connectors/{connector_kind}/import-preview`

Persist-vs-compute for `preview_id` (list + GET-by-id, mirror MVP6.3/6.7) is a
Backend decision; either way read-only + all-false guard. Process-local
`reset_runtime_store()` acceptable; durable DB/Alembic is P1/P2.

| ID | Priority | Role | Item | Depends on | Acceptance summary |
|---|---|---|---|---|---|
| PM6-031 | P0 | PM | MVP6.9 Connectors P0 freeze (contract-first planning) | ADR 0016 | freeze read-only catalog (`ConnectorKind` x3 + masked config schema / `ConnectorConfigFieldKind`) + deterministic dry-run import preview (`ConnectorPreviewStatus`/`ConnectorPreviewCompatibility`/`ConnectorPreviewTargetLayer`, bounded counts + capped items, would-be candidate mapping, "nothing imported" semantics), all-false `ConnectorMutationGuard`, masked-secret rule (mirror MVP5), read-only + no-external-write + no-real-network boundary, authz; explicit exclusions; `docs/pm/MVP6_9_CONNECTORS_BRIEF.md` + ADR 0016; no `apps/`/`infra/` |
| BE6-068 | P0 | Backend | Connectors API contract draft (additive, planning) | PM6-031 | draft `docs/api/MVP6_9_CONNECTORS_API_CONTRACT_DRAFT.md`: additive endpoints (list catalog / get masked config schema / dry-run import preview) + DTO/enum names + all-false `ConnectorMutationGuard`; reuse MVP5 masked-secret + import-dry-run, MVP6.4 compatibility, MVP2 candidate, MVP1 ontology-ref shapes by `$ref` (no rename); preview creates nothing; masked secrets only (`raw_secret_present:false`); capture persist-vs-compute + fixture-shape open questions; no runtime code |
| BE6-069 | P0 | Backend | OpenAPI planning artifact | BE6-068 | produce `docs/api/openapi-mvp6-9-draft.json` (OpenAPI 3.1.0, `0.6.9-draft`, disjoint-additive to MVP1–MVP6.8; redefines no prior path); non-secret placeholder examples only; JSON parse; `git diff --check`; no `apps/` |
| FE6-089 | P0 | Frontend | Connectors UX/API requirements (planning) | PM6-031, BE6-068~069 | `docs/pm/MVP6_9_FRONTEND_UX_REQUIREMENTS.md`: catalog + dry-run preview UX in Analyze/Sources area (ADR 0010, no new global ID-bound LNB page); masked-secret config UX (no raw secret shown/entered in P0); persistent "preview only — nothing imported; routes through candidate review when actually run later" boundary copy; compatibility/summary + capped-sample result layout; live all-false-guard proof line; first-class loading/empty/error/permission states; closed design language; DTO gap vs Backend draft; no route/component/type/mock/smoke code |
| INT6-075 | P0 | QA | Connectors acceptance checklist (planning) | PM6-031, BE6-068~069, FE6-089 | `docs/backlog/INT6_9_CONNECTORS_ACCEPTANCE.md` (C planning gates + R NOT-RUNNABLE runtime gates, continuing INT6 numbering); verify PM/BE/FE agree on P0, catalog/preview model, read-only + dry-run + no-external-write + no-real-network + masked-secret boundary, all-false guard, exclusions; confirm no runtime leaked (`apps/`+`infra/`); OpenAPI parse; no-raw-secret scan of artifacts; recommend Wave50 |

## Wave50 MVP6.9 Connectors THIN IMPLEMENTATION — Gate Freeze (PM6-032)

PM6-032 freezes the Wave49 open gates in `docs/pm/MVP6_9_CONNECTORS_BRIEF.md` §12:
**G1** `preview_id`=compute-on-read/ephemeral (always `null`, no persist, no
GET-by-id/list). **G5** fixed byte-stable per-kind fixtures (FILE=6/REST=5/KB=4;
`source_locator` = opaque string `fixture:<file|rest|kb>/<resource>#row=<n>` from
non-secret config). **G6** `warnings[]`/`blocked_reasons[]` element =
`ConnectorPreviewNotice {code, message}` (added to OpenAPI, 16→17 schemas; frozen
code vocabulary). **G7** `generated_at` kept (already required) but EXCLUDED from
the determinism assertion. **G12** LNB `Connectors` in BUILD after `Sources`; H1 =
`커넥터`; KO glosses finalized. Scope unchanged (read-only + dry-run, creates
nothing, masked secrets, all-false 9-flag guard). Contract impact this wave: G6
only (`ConnectorPreviewNotice`).

| ID | Priority | Role | Item | Depends on | Acceptance summary |
|---|---|---|---|---|---|
| PM6-032 | P0 | PM | Freeze G1/G5/G6/G7 + G12 copy; scope guard | ADR 0016, PM6-031 | brief §12 freeze; OpenAPI G6 refinement (`ConnectorPreviewNotice`, 17 schemas, parses, disjoint); contract MD + backlog updated; `git diff --check` clean; no `apps/` |
| BE6-070 | P0 | Backend | Catalog + masked config-schema | PM6-032 | `GET .../connectors` (3 frozen kinds + `has_secret_fields`/`config_field_count`/`total_count`=3) + `GET .../connectors/{kind}/config-schema` (ordered `ConnectorConfigField[]`, SECRET masked, `raw_secret_present:false`) in new `apps/backend/app/modules/connectors/`, additive; matches OpenAPI exactly |
| BE6-071 | P0 | Backend | Dry-run import-preview (deterministic, bounded) | PM6-032, BE6-070 | `POST .../connectors/{kind}/import-preview`: G5 fixtures, would-be candidate items (`preview_ref` opaque, `target_layer:CANDIDATE`, `mapped_ontology_class_ref` nullable), exact counts + `item_cap`(≤50)/`truncated`/`total_item_count`, `ConnectorPreviewNotice` warnings/blocked_reasons (G6), `preview_id:null` (G1), `generated_at` set at response time (G7), byte-stable (excl. generated_at) + secret-independent |
| BE6-072 | P0 | Backend | All-false guard + no-secret + creates-nothing | PM6-032 | all-false 9-flag `ConnectorMutationGuard` on every response; no import of external-network/candidate-write/extraction-trigger/credential-store path; DATA-LEVEL before==after (all candidate/source/extraction/published tables) incl. preview; no raw secret printed/persisted/logged/returned |
| BE6-073 | P0 | Backend | OpenAPI export/alignment + regression | BE6-070~072 | export actual OpenAPI, compare to `openapi-mvp6-9-draft.json` (3 paths/17 schemas, incl. `ConnectorPreviewNotice`); `tests/test_mvp6_9_connectors_api.py` + `tests/test_mvp6_8_copilot_api.py`; `ruff`; no-raw-secret grep; `git diff --check`; additive-only |
| FE6-090 | P0 | Frontend | LNB/route/IA + types/client/mocks | PM6-032, BE6-070~073 | `Connectors` LNB item (BUILD, after Sources) + `/projects/:p/connectors` catalog + `/projects/:p/connectors/:connectorKind` contextual detail (frozen enum, not ID-bound); H1 `커넥터`; types/client/query/mocks match frozen OpenAPI exactly; reuse shapes by reference (no rename) |
| FE6-091 | P0 | Frontend | Catalog + masked config form | PM6-032 | 3-kind catalog cards (no add/register/connect affordance) + masked config form (SECRET masked/placeholder, no raw secret entered, preview runnable without secret); ENUM select from `enum_values`; KO glosses (G12) |
| FE6-092 | P0 | Frontend | Preview result + states + banner | PM6-032 | `미리보기 실행` → would-be candidate result (counts + capped sample + `mapped_ontology_class_ref` + per-item compatibility + `source_locator` opaque readout + `ConnectorPreviewNotice` code+message + truncation); persistent "PREVIEW ONLY — nothing imported" banner + live all-false 9-flag guard + `raw_secret_present:false`/`preview_only:true` proof; D6 badges; loading/empty/error/permission + INCOMPATIBLE/BLOCKED/WARNING states |
| FE6-093 | P0 | Frontend | Mock + actual smoke | PM6-032, BE6-070~073 | `npm run smoke:mvp6:connectors:mock` (+ `:actual` if backend runnable); `npm run test`/`build`; responsive 0-overflow; `git diff --check` |
| INT6-076 | P0 | QA | Backend runtime verification | BE6-070~073 | validate 3 endpoints, deterministic/byte-stable (excl. `generated_at`) + secret-independent preview, bounding/truncation, would-be candidate mapping, compatibility/status, `ConnectorPreviewNotice` codes, authz `403`/`404`/`400`; update `INT6_9_CONNECTORS_ACCEPTANCE.md` R1-R6 |
| INT6-077 | P0 | QA | Frontend mock/actual | FE6-090~093 | validate FE catalog→config→preview flow mock + actual (boot backend on SQLite); no connect/import/sync/apply/execute affordance; live guard proof line; R7 |
| INT6-078 | P0 | QA | Read-only/creates-nothing/no-secret DATA-LEVEL | BE6-071~072 | INDEPENDENTLY assert at DATA level no connector call (esp. import-preview) creates a source/candidate/extraction or mutates any table (before==after); 9-flag guard all-false; `raw_secret_present:false`, no raw secret in any response/log; R3/R4/R5 |
| INT6-079 | P0 | QA | Wave50 closeout + regression | INT6-076~078 | MVP6.8/earlier regression + touched smokes; additive-only + candidate/published separation intact; recommend closeout/hardening; R8 |

## Wave51 MVP6.10 Multi-tenant Runtime — CONTRACT-FIRST PLANNING FREEZE (PM6-033)

Wave51 opens the next MVP6 theme (roadmap §9 Theme 6) as contract-first planning
only. The chosen P0 is a **read-only tenant CONTEXT with STRICT ISOLATION**: list
the tenants the current actor belongs to, get a tenant summary, list a tenant's
projects (tenant-scoped), and resolve a project's tenant — with cross-tenant
access strictly denied and no leak. It is additive over the existing MVP1 project
scoping; nothing is provisioned, mutated, or re-homed. Runtime implementation
waits for Wave52 after Backend contract draft, Frontend field/state/IA review,
and a QA executable checklist. Full freeze: `docs/pm/MVP6_10_MULTI_TENANT_BRIEF.md`;
durable boundary: `docs/adr/0017-mvp6-10-multi-tenant-read-only-context-strict-isolation-no-provisioning-additive-over-project-scoping-boundary.md`.

Headline invariant — **strict isolation (default-deny, 404-not-leak)**: a caller
scoped to tenant A can never read tenant B's tenant/projects/data.

Frozen P0 demo flow:

```text
authenticate as the dev actor
-> open Tenant Context (top-level indicator / switcher over "my tenants")
-> see ONLY the tenants I am an ACTIVE member of
-> open a tenant summary (mine) -> list that tenant's projects (tenant-scoped)
-> resolve which tenant a project lives in
-> attempt a tenant I do NOT belong to  -> 404 (no name/count/data leaked)
-> attempt a tenant with a suspended relationship -> 403
```

Frozen tenant/membership model: single-level **Tenant** (org/workspace collapsed
in P0) as a few deterministic mock tenants; `TenantMembership =
(actor_id, tenant_id, role, status)` with `role` = MVP5 `Role` verbatim (no new
literal); `Project → Tenant` via a deterministic fixture mapping (no DB FK, no
`tenant_id` column). Fixture MUST cover all three isolation outcomes (member /
not-a-member / inactive relationship).

New P0 enums (MVP5 `Role` reused verbatim; no renames):

- `TenantStatus`: `ACTIVE`, `SUSPENDED`, `ARCHIVED`.
- `TenantMembershipStatus`: `ACTIVE`, `SUSPENDED`.
- `TenantAccessDenialReason`: `NOT_A_MEMBER`, `TENANT_ARCHIVED`,
  `MEMBERSHIP_SUSPENDED`, `TENANT_SUSPENDED`.

Frozen isolation rule + error codes: visibility set = tenants with an `ACTIVE`
membership on a non-`ARCHIVED` tenant; `GET /tenants` returns exactly that set;
not-in-set (unknown/archived/not-a-member) → `404 TENANT_NOT_FOUND` (existence
never leaked); inactive relationship (membership/tenant `SUSPENDED`) →
`403 TENANT_ACCESS_SUSPENDED`; `.../tenants/{A}/projects` returns only tenant A's
projects; `/projects/{id}/tenant` out-of-visibility → `404 PROJECT_NOT_FOUND`;
`403 PERMISSION_DENIED` reserved for future role-gated writes.

All-false 8-flag `TenantMutationGuard` on every response: `tenant_created`,
`tenant_updated`, `tenant_deleted`, `membership_mutated`, `project_rehomed`,
`cross_tenant_access_granted`, `candidate_graph_mutated`,
`published_graph_mutated` — all false.

Authorization: read gated by an `ACTIVE` membership on a non-inactive tenant; any
ACTIVE member (even `VIEWER`) may read summary + project list in P0; `Role`
carried/surfaced for future writes; reuse MVP5 `Role`, no new literal.

Additive-over-project-scoping: existing MVP1 `Project` + all MVP1–MVP6.9
per-project endpoints unchanged and tenant-unaware; no `tenant_id` column, no
migration/backfill, no re-homing/renaming.

Frozen exclusions: tenant create/update/delete; membership mutation
(invite/add/remove/role-change); cross-tenant access; tenant-level billing/quota/
usage enforcement (`UsageQuota`/`BillingUsageEvent`); data re-homing/migration/
`tenant_id` backfill; real auth/SSO/OIDC multi-tenancy + JWT tenant claims;
per-tenant object-storage/search/vector partitioning; two-level
Organization↔Workspace hierarchy (`Organization`/`Workspace`/`TenantSetting`);
cross-domain alignment/mapping (`Domain`/`OntologyAlignment`/`CrossDomainMapping`);
domain/usage dashboards; server-side/session-scoped tenant switching; any
candidate/published-graph mutation.

Suggested endpoint families (Backend finalizes in `BE6-074`):

- `GET /api/v1/tenants` (my tenants — visibility set only)
- `GET /api/v1/tenants/{tenant_id}` (tenant summary, member-only)
- `GET /api/v1/tenants/{tenant_id}/projects` (tenant-scoped projects)
- `GET /api/v1/projects/{project_id}/tenant` (resolve project's tenant; trimmable — gate G4)

Open gates for Wave52 (PM freezes before implementation): G1 dev actor
resolution for negative/cross-tenant tests (reuse dev-auth actor; e.g. `actor_id`
query param à la MVP6.5); G2 404-vs-403 split (frozen: not-a-member/archived→404,
suspended→403; BE confirms singular); G3 persist-vs-compute (process-local
`reset_runtime_store()` acceptable; durable DB/Alembic P1/P2); G4 endpoint #4
in/out (default keep); G5 client-side-only tenant switcher + ADR 0010 placement.

| ID | Priority | Role | Item | Depends on | Acceptance summary |
|---|---|---|---|---|---|
| PM6-033 | P0 | PM | MVP6.10 Multi-tenant P0 freeze (contract-first planning) | ADR 0017 | freeze read-only tenant context (my-tenants / tenant summary / tenant-scoped projects / project→tenant), strict isolation rule + error codes (`404 TENANT_NOT_FOUND` / `403 TENANT_ACCESS_SUSPENDED` / `404 PROJECT_NOT_FOUND`), tenant/membership model (deterministic mock tenants + `TenantMembership` reusing MVP5 `Role`), enums (`TenantStatus`/`TenantMembershipStatus`/`TenantAccessDenialReason`), all-false 8-flag `TenantMutationGuard`, authz, additive-over-project-scoping; explicit exclusions; `docs/pm/MVP6_10_MULTI_TENANT_BRIEF.md` + ADR 0017; no `apps/`/`infra/` |
| BE6-074 | P0 | Backend | Multi-tenant API contract draft (additive, planning) | PM6-033 | draft `docs/api/MVP6_10_MULTI_TENANT_API_CONTRACT_DRAFT.md`: additive read-only endpoints (my tenants / tenant summary / tenant-scoped projects / project→tenant) + DTO/enum names + all-false 8-flag `TenantMutationGuard`; model isolation error codes explicitly (`404 TENANT_NOT_FOUND` not-leak, `403 TENANT_ACCESS_SUSPENDED`, `404 PROJECT_NOT_FOUND`); reuse MVP5 `Role` + dev-auth actor + MVP1 `Project` shapes by `$ref` (no rename); no provisioning/mutation/re-homing path imported; capture G1/G3/G4 open questions; no runtime code |
| BE6-075 | P0 | Backend | OpenAPI planning artifact | BE6-074 | produce `docs/api/openapi-mvp6-10-draft.json` (OpenAPI 3.1.0, `0.6.10-draft`, disjoint-additive to MVP1–MVP6.9; redefines no prior path); JSON parse; `git diff --check`; no `apps/` |
| FE6-094 | P0 | Frontend | Multi-tenant UX/API requirements (planning) | PM6-033, BE6-074~075 | `docs/pm/MVP6_10_FRONTEND_UX_REQUIREMENTS.md`: tenant context indicator / client-side switcher over my-tenants + read-only tenant/workspace view (ADR 0010 placement; tenant detail contextual, no new ID-bound global LNB page); tenant-scoped project list; isolation-limited states (cross-tenant denied — clear, no data leak); persistent "read-only context; no provisioning; existing project scoping unchanged" boundary copy; live all-false-guard proof line; first-class loading/empty/error/permission states; closed design language; DTO gap vs Backend draft; no route/component/type/mock/smoke code |
| INT6-080 | P0 | QA | Multi-tenant acceptance checklist (planning) | PM6-033, BE6-074~075, FE6-094 | `docs/backlog/INT6_10_MULTI_TENANT_ACCEPTANCE.md` (C planning gates + R NOT-RUNNABLE runtime gates, continuing INT6 numbering from INT6-080); make ISOLATION the headline runtime gate (my-tenants returns only my set; not-a-member → `404` no leak; suspended → `403`; `.../tenants/{A}/projects` never returns B; project→tenant out-of-visibility → `404`; `TenantMutationGuard` all-false; data-level no tenant/membership/project row created/updated/deleted, no re-homing, before==after); verify PM/BE/FE agree on P0, tenant model, read-only + strict-isolation + no-provisioning + additive-over-project-scoping boundary, all-false guard, exclusions; confirm no runtime leaked (`apps/`+`infra/`); OpenAPI parse; recommend Wave52 |

## Wave52 MVP6.10 Multi-tenant Runtime — THIN IMPLEMENTATION (PM6-034)

Wave52 implements the frozen read-only tenant context + strict-isolation slice.
PM (PM6-034) froze G1/G3/G5 + ratified the error-envelope-guard ruling FIRST,
BLOCKING Backend/Frontend. Gate freeze + fixture isolation matrix:
`docs/handoffs/wave-052/PM_REPORT.md`. Contract unchanged from
`docs/api/openapi-mvp6-10-draft.json` (4 GET / 13 schemas / 3 enums + `Role`
verbatim / all-false 8-flag `TenantMutationGuard`).

Frozen gates: **G1** = optional dev-only `actor_id` query param, default
`"dev-user"`, membership by `(actor_id, tenant_id)` fixture lookup, no
`actor_role` for reads. **G3** = process-local fixtures + `reset_runtime_store()`,
no DB / no `tenant_id` column / no migration. **G5** = 6 tenants / 2 actors /
6 memberships / 7 projects; default visibility set `{tenant-acme, tenant-globex}`;
`tenant-initech`→404 NOT_A_MEMBER, `tenant-umbrella`→403 MEMBERSHIP_SUSPENDED,
`tenant-soylent`→403 TENANT_SUSPENDED, `tenant-hooli`→404 TENANT_ARCHIVED.
Error-envelope-guard: errors carry NO `mutation_guard`; guard is 200-only; denial
via `ApiError.details.denial_reason`. `/projects/{id}/tenant` mirrors the owning
tenant's access decision (200/403/404).

| ID | Priority | Role | Item | Depends on | Acceptance summary |
|---|---|---|---|---|---|
| PM6-034 | P0 | PM | MVP6.10 Wave52 gate freeze + scope guard | PM6-033, ADR 0017 | freeze G1 (`actor_id` default `dev-user`), G3 (process-local fixtures + `reset_runtime_store()`, no `tenant_id` column/migration), G5 (6-tenant/2-actor/7-project fixture matrix covering member→200 / not-a-member→404 / suspended→403 / archived→404); ratify error-envelope-guard (no guard on errors, 200-only, denial via `denial_reason`); confirm scope unchanged (read-only, strict isolation, additive-over-project-scoping); `docs/handoffs/wave-052/PM_REPORT.md` + brief §5/§11 refine; no `apps/` |
| BE6-076 | P0 | Backend | Tenant list/summary/projects endpoints + fixtures | PM6-034 | `GET /tenants` (visibility set only), `GET /tenants/{id}` (member-only summary), `GET /tenants/{id}/projects` (tenant-scoped) in new `apps/backend/app/modules/tenancy/`, additive; G5 fixtures VERBATIM; matches `openapi-mvp6-10-draft.json` exactly |
| BE6-077 | P0 | Backend | project→tenant resolve + isolation enforcement | PM6-034, BE6-076 | `GET /projects/{id}/tenant` mirroring owning-tenant access decision; strict isolation (404-not-leak NOT_A_MEMBER/TENANT_ARCHIVED; 403 MEMBERSHIP_SUSPENDED/TENANT_SUSPENDED); `/tenants/{A}/projects` never returns B; `denial_reason` on every error |
| BE6-078 | P0 | Backend | all-false 8-flag guard + no-mutation | PM6-034 | all-false 8-flag `TenantMutationGuard` on every 200 (`cross_tenant_access_granted`/`project_rehomed` hardest); DATA-LEVEL before==after all tables; no provisioning/membership-mutation/re-homing/`tenant_id`-backfill path imported; errors carry no guard |
| BE6-079 | P0 | Backend | OpenAPI export/alignment + isolation regression | BE6-076~078 | export actual OpenAPI, compare to `openapi-mvp6-10-draft.json` (4 paths/13 schemas, 0 mismatch); `tests/test_mvp6_10_tenancy_api.py` (4 endpoints + isolation matrix + guard + no-mutation) + `tests/test_mvp6_9_connectors_api.py`; `ruff`; `git diff --check`; additive-only |
| FE6-095 | P0 | Frontend | app-shell tenant switcher + types/client/mocks | PM6-034, BE6-076~079 | header tenant-context indicator + client-side switcher over ACTIVE visibility set only (cross-tenant unreachable by construction); types/client/query/mocks match frozen OpenAPI exactly; reuse MVP5 `Role`/MVP1 `ProjectSummary` by reference (no rename); `actor_id` dev-only, not a production control |
| FE6-096 | P0 | Frontend | read-only tenant view (summary + tenant-scoped projects) | PM6-034 | contextual read-only tenant view (summary + tenant-scoped project list per ADR 0010; no new ID-bound global LNB page); `TenantStatus`/`TenantMembershipStatus` D6 badges; KO glosses; loading/empty/error/permission states |
| FE6-097 | P0 | Frontend | isolation-limited states + boundary + guard proof | PM6-034 | 404 TENANT_NOT_FOUND (no existence/data leak) / 403 TENANT_ACCESS_SUSPENDED / 404 PROJECT_NOT_FOUND driven by `denial_reason`; clear stale tenant-A data before resolving tenant-B; persistent "read-only; no provisioning; project scoping unchanged; client-side switch only" banner + live all-false 8-flag guard proof (200 only); NO create/edit/invite/provision affordance; existing global Projects list NOT re-scoped |
| FE6-098 | P0 | Frontend | mock + actual smoke | PM6-034, BE6-076~079 | `npm run smoke:mvp6:tenancy:mock` (+ `:actual` incl. an isolation negative check if backend runnable); `npm run test`/`build`; responsive 0-overflow; `git diff --check` |
| INT6-090 | P0 | QA | Backend runtime verification | BE6-076~079 | validate 4 endpoints, 3 enums + `Role`, all-false 8-flag guard, additive-over-project-scoping; update `INT6_10_MULTI_TENANT_ACCEPTANCE.md` R1/R6/R7 |
| INT6-091 | P0 | QA | Frontend mock/actual flow | FE6-095~098 | validate header switcher + read-only view mock + actual incl. an isolation negative case; no create/edit/invite/switch-write affordance; live guard proof line (200 only); R8 |
| INT6-092 | P0 | QA | ISOLATION + no-mutation DATA-LEVEL guard | BE6-077~078 | INDEPENDENTLY (own script) assert not-a-member → 404 with NO name/count/project/data leak; suspended → 403; `/tenants/{B}/projects` + `/projects/{B}/tenant` never leak B; disjoint actor visibility sets (`dev-user` vs `dev-user-2`); NO tenant call mutates any table (before==after); no `tenant_id` column created; R2/R3/R4/R5 |
| INT6-093 | P0 | QA | Wave52 closeout + regression | INT6-090~092 | MVP6.9/earlier regression + touched smokes green; additive-only + candidate/published separation intact; no leftover listeners on 8000/5173; `git diff --check`; update R9; recommend closeout/hardening |

## Wave53 MVP6.11 Ontology Packs — CONTRACT-FIRST PLANNING (PM6-035)

Wave53 freezes the smallest coherent, SAFE ontology-pack P0 as contract-first
planning only (no runtime/UI/test/seed code; runtime waits for Wave54). Scope:
a read-only **ontology-pack catalog** (3 deterministic in-repo mock packs, each a
bundle of ontology elements + metadata) + a **deterministic dry-run apply-preview**
(what a pack WOULD add / WOULD modify against a project's current DRAFT ontology,
per-item disposition NEW / CONFLICT / DUPLICATE + compatibility rollup, "nothing
applied"). No apply/install, no external registry/fetch, no published-graph write,
no ontology-draft mutation, all-false 8-flag guard. A real apply would route
through the existing MVP1 ontology-edit / MVP6.6 governance-application (DRAFT-only,
human-initiated) path — out of P0. Durable boundary: ADR 0018. Brief:
`docs/pm/MVP6_11_ONTOLOGY_PACKS_BRIEF.md`.

Frozen enums (planning): `PackElementKind` (CLASS/PROPERTY/RELATION, aligns with
`OntologyElementRef.target_kind`); `PackApplyPreviewStatus` (READY/BLOCKED);
`PackPreviewItemDisposition` (NEW/CONFLICT/DUPLICATE); `PackApplyCompatibility`
(COMPATIBLE/WARNING/INCOMPATIBLE); `PackApplyTargetLayer` (DRAFT single literal);
`PackPreviewNotice {code, message}`. All-false 8-flag `OntologyPackMutationGuard`
(`pack_installed`/`ontology_draft_mutated`/`ontology_class_created`/
`ontology_property_created`/`ontology_relation_created`/`candidate_graph_mutated`/
`published_graph_mutated`/`change_request_created` — all false;
`ontology_draft_mutated` + `published_graph_mutated` headline). Reuse by `$ref`
(no rename): MVP1 ontology element + `OntologyElementRef`, MVP5/MVP6.4 import
dry-run compatibility, MVP6.9 catalog/preview/notice/bounding pattern, MVP5 `Role`.
Wave54 open gates: G1 preview_id persist-vs-compute (ephemeral recommended); G2
catalog global / preview project-scoped (frozen); G3 DRAFT-diff basis + fixture
matrix; G4 element-identity match rule; G5 Build/Ontology LNB/IA placement (ADR
0010).

| ID | Priority | Role | Item | Depends on | Acceptance summary |
|---|---|---|---|---|---|
| PM6-035 | P0 | PM | MVP6.11 Ontology Packs P0 freeze (contract-first planning) | ADR 0018 | freeze read-only pack catalog (3 deterministic mock packs = ontology-element bundle + metadata/version + counts) + deterministic dry-run apply-preview (would-add/would-modify mapped to DRAFT layer, per-item disposition NEW/CONFLICT/DUPLICATE, compatibility rollup, "nothing applied" routing note), enums (`PackElementKind`/`PackApplyPreviewStatus`/`PackPreviewItemDisposition`/`PackApplyCompatibility`/`PackApplyTargetLayer`/`PackPreviewNotice`), all-false 8-flag `OntologyPackMutationGuard`, authz, read-only + no-apply + no-published-write + no-draft-mutation + no-external-fetch boundary; explicit exclusions; `docs/pm/MVP6_11_ONTOLOGY_PACKS_BRIEF.md` + ADR 0018; no `apps/`/`infra/` |
| BE6-080 | P0 | Backend | Ontology Packs API contract draft (additive, planning) | PM6-035 | draft `docs/api/MVP6_11_ONTOLOGY_PACKS_API_CONTRACT_DRAFT.md`: additive endpoints (list catalog `GET /ontology-packs`; pack detail `GET /ontology-packs/{pack_id}`; dry-run apply-preview `POST /projects/{project_id}/ontology-packs/{pack_id}/apply-preview`) + DTO/enum names + all-false 8-flag `OntologyPackMutationGuard`; preview creates nothing (would-be DRAFT items, opaque `preview_ref`); reuse MVP1 ontology element + `OntologyElementRef` + MVP5/MVP6.4 dry-run compatibility + MVP6.9 catalog/preview/notice pattern + MVP5 `Role` by `$ref` (no rename); import no ontology-write/install/governance-change/candidate-write/published-write path; bounded (item cap + `truncated` + exact `total_item_count`); `403 PERMISSION_DENIED` / `404 PROJECT_NOT_FOUND` / `404 ONTOLOGY_PACK_NOT_FOUND`; resolve G1–G4; no runtime code |
| BE6-081 | P0 | Backend | OpenAPI planning artifact | BE6-080 | produce `docs/api/openapi-mvp6-11-draft.json` (OpenAPI 3.1.0, `0.6.11-draft`, disjoint-additive to MVP1–MVP6.10; redefines no prior path); JSON parse; `git diff --check`; no `apps/` |
| FE6-099 | P0 | Frontend | Ontology Packs UX/API requirements (planning) | PM6-035, BE6-080~081 | `docs/pm/MVP6_11_FRONTEND_UX_REQUIREMENTS.md`: pack catalog + pack detail + dry-run apply-preview UX in the Build/Ontology area (ADR 0010 placement, contextual sub-view, no new ID-bound global LNB page); preview result layout (would-add/would-modify + NEW/CONFLICT/DUPLICATE dispositions + compatibility/summary + capped sample); persistent "preview only — nothing applied; a real apply routes through ontology-edit / governance" boundary copy (no install/apply CTA); live all-false 8-flag guard proof line; first-class loading/empty/error/permission states; closed design language (Section+Card, KO titles, D6 badges); DTO gap vs Backend draft; propose G5 placement; no route/component/type/mock/smoke code |
| INT6-094 | P0 | QA | Ontology Packs acceptance checklist (planning) | PM6-035, BE6-080~081, FE6-099 | `docs/backlog/INT6_11_ONTOLOGY_PACKS_ACCEPTANCE.md` (C planning gates + R NOT-RUNNABLE runtime gates, continuing INT6 numbering from INT6-094); verify PM/BE/FE agree on P0, catalog + apply-preview model, read-only + dry-run + no-apply + no-published-write + no-draft-mutation + no-external-fetch boundary, all-false 8-flag guard, exclusions; make NO-MUTATION the headline runtime gate (`OntologyPackMutationGuard` all-false; data-level no ontology-draft/class/property/relation/candidate/published/change-request row created/updated/deleted, before==after; preview byte-stable modulo `generated_at`+`preview_id`; disposition NEW/CONFLICT/DUPLICATE + compatibility correct against fixtures; `403`/`404`); confirm no runtime leaked (`apps/`+`infra/`); OpenAPI parse; recommend Wave54 |

## Wave54 MVP6.11 Ontology Packs THIN IMPLEMENTATION — Gate Freeze (PM6-036)

Wave54 implements the frozen read-only pack-catalog + deterministic dry-run
apply-preview slice (3 endpoints, `openapi-mvp6-11-draft.json` EXACTLY). PM freezes
the open gates FIRST (this section); Backend ∥ Frontend then implement; QA verifies.

PM freeze (`docs/handoffs/wave-054/PM_REPORT.md`):
- **G1 `preview_id`** = COMPUTE-ON-READ / EPHEMERAL: always `null`; no GET-by-id, no
  list-preview endpoint; recompute is byte-identical modulo `generated_at`.
- **G3 DRAFT-diff basis** = deterministic **process-local DRAFT-ontology snapshot**
  fixture keyed by `project_id` (connectors/tenancy precedent; read-only; re-seeded
  by `reset_runtime_store()`; live MVP1 draft-reader wiring is P1, diff logic
  identical). DRAFT-ness is **version-level** (`OntologyVersion.status==DRAFT`; its
  non-DELETED elements). Fixture matrix (in PM report) exercises all 3 dispositions
  + 3 compatibilities: `proj-packs-demo` (mfg overlap) → insurance/legal COMPATIBLE,
  manufacturing WARNING (NEW+CONFLICT+DUPLICATE); `proj-packs-no-draft` → BLOCKED /
  INCOMPATIBLE (`NO_DRAFT_ONTOLOGY`).
- **G4 element-identity match** = `(element_kind + normalized key)`; key normalized
  NFC+trim+casefold; PROPERTY scoped by owning-class key, RELATION by name. Match +
  equal `definition_signature` → DUPLICATE; match + different signature → CONFLICT;
  no match → NEW. `would_modify_count == conflict_count` (CONFLICT only; DUPLICATE is
  its own bucket); `total_element_count = would_add + conflict + duplicate`.
- **G6** notice vocab frozen: WARNING `EXISTING_DUPLICATE_ELEMENT` /
  `NAME_CONFLICT_DIFFERENT_DEFINITION` / `UNRESOLVED_RELATION_ENDPOINT`; BLOCKED
  `NO_DRAFT_ONTOLOGY` (only one that fires in P0) / `EMPTY_PACK` / `PACK_NOT_FOUND`
  (last two reserved — unknown pack is a 404, all 3 packs non-empty).
- **G7** `generated_at` present (ISO-8601 UTC), EXCLUDED (with `preview_id`) from the
  byte-stable determinism assertion.
- **G9** invalid body (`item_cap` ∉ [1,50] / malformed) → **400**; unknown pack →
  **404** `ONTOLOGY_PACK_NOT_FOUND`; unknown project → **404** `PROJECT_NOT_FOUND`;
  non-member → **403** `PERMISSION_DENIED`; valid target with no DRAFT ontology →
  **200** `status=BLOCKED` / `INCOMPATIBLE` + `blocked_reasons=[NO_DRAFT_ONTOLOGY]`,
  zero items. `mapped_ontology_ref` = `null` for NEW; non-null (existing DRAFT
  element) for CONFLICT/DUPLICATE.
- **G12** (COMMANDER IA) ratified: BUILD-group LNB item `Ontology Packs` immediately
  after `Ontology`; H1 `온톨로지 팩`; detail/preview contextual sub-views
  (`/projects/:p/ontology-packs`, `.../:packId`), not ID-bound global pages.

No contract shape change: the OpenAPI (`0.6.11-draft`, 3 paths / 19 schemas / 5 enums
+ 8-flag guard) is implemented EXACTLY as drafted.

| ID | Priority | Role | Item | Depends on | Acceptance summary |
|---|---|---|---|---|---|
| PM6-036 | P0 | PM | MVP6.11 Wave54 gate freeze + scope guard | PM6-035, ADR 0018 | freeze G1 (`preview_id` ephemeral/null), G3 (process-local DRAFT snapshot + fixture matrix: all 3 dispositions + 3 compatibilities), G4 (`(kind+normalized key)` identity + `definition_signature` DUPLICATE/CONFLICT rule; `would_modify_count==conflict_count`); confirm G6 (notice vocab), G7 (`generated_at` excluded from determinism), G9 (400 invalid-body vs 200-BLOCKED vs 403/404; `mapped_ontology_ref` null-for-NEW); ratify G12 (LNB `Ontology Packs` after Ontology, H1 `온톨로지 팩`, contextual sub-views); confirm scope unchanged (read-only, creates nothing, all-false 8-flag guard); `docs/handoffs/wave-054/PM_REPORT.md` + brief §11 refine; no `apps/` |
| BE6-082 | P0 | Backend | Catalog + detail (3 mock packs) | PM6-036 | `GET /ontology-packs` + `GET /ontology-packs/{pack_id}` in new `apps/backend/app/modules/ontology_packs/` (additive router); 3 frozen packs (insurance/manufacturing/legal) as process-local fixtures + `reset_runtime_store()`; `PackElementDescriptor` bundled elements; byte-stable; all-false 8-flag guard on both; matches `openapi-mvp6-11-draft.json` EXACTLY |
| BE6-083 | P0 | Backend | Apply-preview (deterministic DRAFT-diff) | BE6-082 | `POST /projects/{project_id}/ontology-packs/{pack_id}/apply-preview`; diff pack vs process-local DRAFT snapshot per G4 → `PackPreviewItemDisposition` + `PackApplyCompatibility` rollup + exact `summary` + bounded (`item_cap`≤50 / `truncated` / exact `total_item_count`); `preview_only:true`; opaque `preview_ref`; `preview_id:null` (G1); `generated_at` (G7); `mapped_ontology_ref` null-for-NEW; BLOCKED non-crash-200 (G9) + notices (G6); creates NOTHING |
| BE6-084 | P0 | Backend | All-false 8-flag guard + creates-nothing guarantees | BE6-083 | every response (catalog/detail/preview) carries all-false `OntologyPackMutationGuard`; module imports NO ontology-write/install/governance/candidate/published path; DATA-LEVEL no class/property/relation/change-request/version created or mutated (before==after every call incl. preview); DRAFT read-only |
| BE6-085 | P0 | Backend | OpenAPI export/alignment + no-mutation regression guard | BE6-082~084 | runtime OpenAPI vs `openapi-mvp6-11-draft.json` 0 mismatch (3 paths / 19 schemas / 5 enums / 8-flag guard); `tests/test_mvp6_11_ontology_packs_api.py` (catalog/detail byte-stable; preview deterministic + bounded + all 3 dispositions + 3 compatibilities per matrix; BLOCKED 200; invalid body 400; authz 403/404; data-level no-mutation; all-false guard); `tests/test_mvp6_10_tenancy_api.py` regression; ruff; `git diff --check` |
| FE6-100 | P0 | Frontend | LNB item + route/IA + types/client/mocks | PM6-036 | `Ontology Packs` LNB item in BUILD after `Ontology` (single active LNB preserved); routes `/projects/:p/ontology-packs` (catalog) + `.../:packId` (detail/preview contextual); H1 `온톨로지 팩`; breadcrumbs (D4); types/client/query/mocks match frozen OpenAPI EXACTLY (reuse by reference, no rename) |
| FE6-101 | P0 | Frontend | Catalog + detail | FE6-100 | 3 pack cards (name/domain badge/version/description + `class_count`/`property_count`/`relation_count`/`element_count`, DETERMINISTIC_MOCK marker, NO install/apply affordance) → detail (metadata + bundled elements grouped by `PackElementKind`); Section+Card, D6 badges |
| FE6-102 | P0 | Frontend | Apply-preview result + states + banner | FE6-101 | "적용 미리보기 실행" → result (`PackApplyPreviewStatus` + `PackApplyCompatibility` D6 badges; `summary`; capped `items[]` with `disposition` NEW/CONFLICT/DUPLICATE + `target_layer` DRAFT + `mapped_ontology_ref` null-for-NEW; truncation; `warnings[]`/`blocked_reasons[]`; `routing_note` verbatim); persistent PREVIEW-ONLY banner + live all-false 8-flag guard proof line; INCOMPATIBLE/BLOCKED + WARNING + loading/empty/error/permission states; NO install/apply/execute CTA |
| FE6-103 | P0 | Frontend | Mock + actual smoke | FE6-102 | `npm run smoke:mvp6:packs:mock` (catalog→detail→preview routes) + `:actual` if backend runnable; `npm run test`, `npm run build`; responsive 0-overflow re-check; `git diff --check` |
| INT6-098 | P0 | QA | Backend runtime verification | BE6-082~085 | validate 3 endpoints, byte-stable catalog/detail + deterministic bounded preview, all 3 dispositions + 3 compatibilities per the PM fixture matrix, BLOCKED 200 (`NO_DRAFT_ONTOLOGY`), invalid body 400, authz 403/404, OpenAPI alignment; update `INT6_11_ONTOLOGY_PACKS_ACCEPTANCE.md` R1/R2/R3/R5/R7 |
| INT6-099 | P0 | QA | Frontend mock/actual flow | FE6-100~103 | validate catalog→detail→apply-preview mock + actual (boot backend on SQLite); disposition/compat/truncation/banner + live all-false guard proof; NO install/apply affordance; single active LNB (now incl. Ontology Packs); R6 |
| INT6-100 | P0 | QA | Creates-nothing + all-false guard DATA-LEVEL | BE6-083~084 | INDEPENDENTLY (own script) assert NO pack call (esp. apply-preview) creates a class/property/relation/change-request/version or mutates any table (before==after); DRAFT + published unchanged; `OntologyPackMutationGuard` all-false on every response; preview byte-stable modulo `generated_at`+`preview_id`; R4 |
| INT6-101 | P0 | QA | Wave54 closeout + regression | INT6-098~100 | MVP6.10/earlier regression + touched smokes green; additive-only + candidate/published separation intact + single active LNB; no leftover listeners on 8000/5173; `git diff --check`; update R-series; recommend closeout/hardening |

## Wave55 MVP6.12 Advanced Visualization — CONTRACT-FIRST PLANNING (PM6-037)

FINAL MVP6 theme (roadmap §12 Theme 9 Advanced Visualization). Contract-first
**planning only** (no runtime/UI/test/seed code; runtime waits for Wave56). Smallest
coherent SAFE P0: a single read-only, whole-graph **viz data + summary-stats**
endpoint over a project's **PUBLISHED** graph — bounded node/edge elements + layout
**hints** (degree/component/class group; NO server-side x/y) + graph-level summary
(`node_counts_by_class`/`edge_counts_by_relation`/`density`/`component_count`/
`largest_component_size`/`isolated_node_count`/`max_degree`), with a deterministic
**too-large → summary-only** fallback (reuse MVP4 `SAFE_TOO_LARGE`: caps 150/300 +
`truncated` + exact totals + `GraphTooLargeState`). PUBLISHED-only P0
(`GraphVizScope=PUBLISHED` single literal; `CANDIDATE` reserved/never-produced =
P1). No mutation/publish/version/snapshot creation, no candidate viz, no server-side
layout, **no layout persistence/cache**. Enums: `GraphVizStatus`
(READY/TOO_LARGE_SUMMARY_ONLY/EMPTY), `GraphVizScope` (PUBLISHED). All-false 6-flag
`GraphVizMutationGuard` (`published_graph_mutated`/`candidate_graph_mutated`/
`ontology_draft_mutated`/`published_version_created`/`graph_snapshot_created`/
`layout_persisted` — all false; `published_graph_mutated` + `layout_persisted`
headline). Reuse by reference (no rename): MVP3 `PublishedEntity`/`PublishedRelation`/
`PublishedGraphVersion`, MVP4 `GraphExploreNode`/`GraphExploreEdge`/`GraphTooLargeState`/
`PublishedGraphVersionRef` (`GraphExploreState` = structural precedent for
`GraphVizStatus`), MVP1 `class_id`/`relation_id` grouping keys, MVP5 `Role`.
Neighborhood/focus reuses the existing MVP4 explore endpoint (root+hops), NOT
re-implemented. Authz: any project member who can view the project; `400` invalid
cap; `403 PERMISSION_DENIED`; `404 PROJECT_NOT_FOUND` / `404
PUBLISHED_GRAPH_VERSION_NOT_FOUND`; `200 EMPTY` when no current published version.
Durable boundary: ADR 0019. Wave56 open gates: G1 filter-hints P0-vs-P1 (recommend
optional filters, summary always over full graph); G2 no-current-version → 200 EMPTY
(recommended) vs 404; G3 directed density / undirected component definition; G4
LNB/IA = contextual sub-view of Published Graph (ADR 0010, no new global LNB item).

| ID | Priority | Role | Item | Depends on | Acceptance summary |
|---|---|---|---|---|---|
| PM6-037 | P0 | PM | MVP6.12 Advanced Visualization P0 freeze (contract-first planning) | ADR 0019 | freeze single read-only whole-graph published viz data + summary endpoint (bounded nodes/edges + layout hints + `GraphVizSummary` stats), deterministic bounding (caps 150/300 + `truncated` + exact totals) + `TOO_LARGE_SUMMARY_ONLY` fallback (summary over full graph, elements omitted; reuse MVP4 safe-too-large), enums (`GraphVizStatus`/`GraphVizScope`), published-only P0 / candidate P1, all-false 6-flag `GraphVizMutationGuard`, authz, read-only + no-mutation + no-layout-persist + no-server-layout + no-candidate-viz boundary; explicit exclusions; `docs/pm/MVP6_12_ADVANCED_VIZ_BRIEF.md` + ADR 0019; no `apps/`/`infra/` |
| BE6-086 | P0 | Backend | Advanced Viz API contract draft (additive, planning) | PM6-037 | draft `docs/api/MVP6_12_ADVANCED_VIZ_API_CONTRACT_DRAFT.md`: additive `GET /projects/{project_id}/graph-viz` (optional `version_id`/`node_cap`/`edge_cap`/filter hints) → `GraphVizResponse` (status + `GraphVizSummary` + bounded `nodes[]`/`edges[]` w/ layout hints + `too_large` + all-false 6-flag `GraphVizMutationGuard` + `boundary_note`); reuse MVP3 published-graph + MVP4 `GraphExploreNode`/`GraphExploreEdge`/`GraphTooLargeState`/`PublishedGraphVersionRef` + MVP5 `Role` by `$ref` (no rename); import NO publish/version-write/candidate-write/ontology-write/layout-persist path; bounded (caps + `truncated` + exact totals) + `TOO_LARGE_SUMMARY_ONLY`; NO server-side x/y layout; `400`/`403 PERMISSION_DENIED`/`404 PROJECT_NOT_FOUND`/`404 PUBLISHED_GRAPH_VERSION_NOT_FOUND`/`200 EMPTY`; resolve/record G1–G4; no runtime code |
| BE6-087 | P0 | Backend | OpenAPI planning artifact | BE6-086 | produce `docs/api/openapi-mvp6-12-draft.json` (OpenAPI 3.1.0, `0.6.12-draft`, disjoint-additive to MVP1–MVP6.11; redefines no prior path); JSON parse; `git diff --check`; no `apps/` |
| FE6-104 | P0 | Frontend | Advanced Viz UX/API requirements (planning) | PM6-037, BE6-086~087 | `docs/pm/MVP6_12_FRONTEND_UX_REQUIREMENTS.md`: viz summary/statistics panel + whole-graph bounded view (layout hints, no coordinates) as a contextual sub-view of the Publish-group Published Graph surface (ADR 0010, no new global LNB ID-page); `READY` / `TOO_LARGE_SUMMARY_ONLY` (summary-only + "narrow with filters") / `EMPTY` states; read-only class/relation filters + focus/neighborhood (reuse MVP4 explore); persistent "read-only visualization — nothing changes the graph" boundary copy (no mutate/publish/save-layout CTA); live all-false 6-flag guard proof line; first-class loading/empty/error/permission states; closed design language (Section+Card, KO titles, D6 badges); DTO gap vs Backend draft; propose G4 placement; no route/component/type/mock/smoke code |
| INT6-102 | P0 | QA | Advanced Viz acceptance checklist (planning) | PM6-037, BE6-086~087, FE6-104 | `docs/backlog/INT6_12_ADVANCED_VIZ_ACCEPTANCE.md` (C planning gates + R NOT-RUNNABLE runtime gates, continuing INT6 numbering from INT6-102); verify PM/BE/FE agree on P0, the viz data + summary model, read-only + bounded + `TOO_LARGE_SUMMARY_ONLY` + no-mutation + no-layout-persist + published-only boundary, all-false 6-flag guard, exclusions; make NO-MUTATION the headline runtime gate (`GraphVizMutationGuard` all-false; data-level no published/candidate/ontology/version/snapshot row created/updated/deleted, before==after; summary counts exact + byte-stable modulo `generated_at`; `READY` cap-bounded vs over-cap `TOO_LARGE_SUMMARY_ONLY` empty-elements + exact totals; layout hints present, NO coordinates; `EMPTY` no-version; `400`/`403`/`404`); confirm no runtime leaked (`apps/`+`infra/`); OpenAPI parse; recommend Wave56 |

## Wave56 MVP6.12 Advanced Visualization THIN IMPLEMENTATION — Gate Freeze (PM6-038)

Wave56 implements the frozen read-only whole-graph published viz data + summary
slice (the FINAL MVP6 theme). PM freeze (PM6-038) is the first, blocking step:
G1 filter-hints semantics FROZEN (element-view only, summary always over the full
graph), G2 no-version→200 EMPTY CONFIRMED, G3 stat formulas FROZEN (directed
density, undirected components/degree), G5 `hop` OMITTED CONFIRMED, G12 Korean copy
RATIFIED, and a deterministic published-graph fixture matrix (READY / TOO_LARGE_
SUMMARY_ONLY / EMPTY) FROZEN. No contract shape change vs `openapi-mvp6-12-draft.json`
(1 path / 1 op / 12 schemas / all-false 6-flag `GraphVizMutationGuard`). Details:
`docs/handoffs/wave-056/PM_REPORT.md` + `docs/pm/MVP6_12_ADVANCED_VIZ_BRIEF.md` §11.

| ID | P | Role | Task | Deps | Detail |
|---|---|---|---|---|---|
| PM6-038 | P0 | PM | MVP6.12 Wave56 gate freeze + scope guard | PM6-037, ADR 0019 | freeze G1 (filter hints `class_ids`/`relation_ids` in P0: induced element-view only — node in iff `class_id`∈`class_ids`, edge in iff `relation_id`∈`relation_ids` AND both endpoints in; summary/status/`truncated`/`degree`/`component_id` ALWAYS over the FULL unfiltered graph), G3 (density=`E/(V*(V-1))` directed for V>1 else 0; `component_count`/`largest_component_size`/`max_degree`/`isolated_node_count` over the UNDIRECTED projection; single O(V+E) pass); confirm G2 (no current published version→`200 EMPTY`, zeroed summary + empty elements + `too_large:null` + all-false guard, not 404), G5 (`hop` OMITTED from `GraphVizNode`; `degree`+`component_id` present, no x/y); ratify G12 (LNB `Published Graph` UNCHANGED, H1 `게시 그래프 탐색기` unchanged, sub-view toggle `탐색기` \| `시각화 · 요약`, status/scope/boundary glosses); freeze fixture matrix READY(`proj-viz-demo` 12n/9e)/TOO_LARGE_SUMMARY_ONLY(`proj-viz-large` 210n/480e)/EMPTY(`proj-viz-empty` no version); confirm scope unchanged (read-only, no mutation/layout/persistence, all-false 6-flag guard, published-only); `docs/handoffs/wave-056/PM_REPORT.md` + brief §11 refine; no `apps/`/`infra/` |
| BE6-088 | P0 | Backend | graph-viz endpoint + summary stats (O(V+E)) | PM6-038 | `GET /api/v1/projects/{project_id}/graph-viz` in new `apps/backend/app/modules/graph_viz/` (additive router); `GraphVizSummary` exact over FULL graph, G3 formulas; deterministic process-local published-graph fixtures + `reset_runtime_store()` per the PM matrix |
| BE6-089 | P0 | Backend | bounded whole-graph view + too-large-summary + EMPTY | PM6-038, BE6-088 | caps 150/300 (overridable in range, else `400 INVALID_CAP`) + `truncated` + exact totals; layout HINTS `degree`/`component_id` (no x/y, no `hop`); over-cap→`TOO_LARGE_SUMMARY_ONLY` (empty elements); no version→`200 EMPTY`; G1 filter hints (element-view only); deterministic ordering |
| BE6-090 | P0 | Backend | all-false 6-flag guard + no-mutation/no-layout guarantees | PM6-038, BE6-088 | every response carries all-false `GraphVizMutationGuard` (6 flags); module imports NO publish/version-write/candidate-write/ontology-write/layout-persist path; DATA-LEVEL before==after (no version/snapshot/row created) |
| BE6-091 | P0 | Backend | OpenAPI export/alignment + regression guard | BE6-088~090 | runtime OpenAPI 0-mismatch vs `openapi-mvp6-12-draft.json`; `tests/test_mvp6_12_graph_viz_api.py` (READY/TOO_LARGE/EMPTY/filter/byte-stable/invalid-cap/authz/no-mutation/guard/OpenAPI); MVP6.11 + earlier regression; ruff; `git diff --check` |
| FE6-105 | P0 | Frontend | viz sub-view/toggle + types/client/mocks | PM6-038 | `Visualization · Summary` sub-view on Published Graph (toggle `탐색기`\|`시각화 · 요약`; NO new LNB item; single active LNB preserved); types/client/query/mocks match frozen OpenAPI exactly (reuse by reference, no rename) |
| FE6-106 | P0 | Frontend | summary-stats panel (always shown, exact) | PM6-038, FE6-105 | `GraphVizSummary` panel: totals, by-class/by-relation, density/components/largest/isolated/max-degree; exact in every status; density 3-dp; filtered element view never changes summary numbers |
| FE6-107 | P0 | Frontend | bounded whole-graph render (client-side layout) + too-large/EMPTY | PM6-038, FE6-105 | READY whole-graph laid out CLIENT-SIDE from hints (`degree`/`component_id`/`class_id`; no server x/y); read-only class/relation filters; `TOO_LARGE_SUMMARY_ONLY` (summary + notice, zero fabricated nodes); `EMPTY` (zeroed summary + publish-first); persistent read-only banner + live all-false 6-flag guard proof; D6 status badges; loading/error/permission |
| FE6-108 | P0 | Frontend | mock + actual smoke | FE6-105~107 | `npm run smoke:mvp6:graphviz:mock` (+ `:actual` if backend runnable); `npm run test`/`build`; 0-overflow re-check; `git diff --check` |
| INT6-103 | P0 | QA | backend runtime | BE6-088~091 | validate endpoint, summary exactness (G3), bounded view + layout hints (no x/y/hop), `TOO_LARGE_SUMMARY_ONLY` + `EMPTY`, filter hints, authz `400`/`403`/`404`; fixture matrix READY/TOO_LARGE/EMPTY |
| INT6-104 | P0 | QA | frontend mock/API | FE6-105~108, BE6-088~091 | FE mock + actual flow (boot backend on SQLite); sub-view toggle + single active LNB; summary always exact; no fabricated too-large nodes |
| INT6-105 | P0 | QA | read-only/no-mutation + all-false guard (data-level) | BE6-088~091 | INDEPENDENTLY verify (own script) the viz call mutates NOTHING (all tables before==after; no version/snapshot created), 6-flag guard all-false, no server-side layout/persistence |
| INT6-106 | P0 | QA | Wave56 closeout + MVP6 sequence complete | INT6-103~105 | MVP6.11/earlier regression + touched smokes green; additive-only + candidate/published separation + single active LNB; recommend closeout; note MVP6.12 completes the user-directed MVP6 theme sequence (6.1–6.12); no leftover listeners on 8000/5173; `git diff --check` |

## Scope Limits

- No MVP6-wide implementation in Wave28, Wave29, or Wave30.
- No real LLM benchmark provider call in MVP6.1 or MVP6.2 P0.
- No fine-tuning execution, live retraining, or training dataset export
  execution in MVP6.2 P0.
- No real prompt rewriting or prompt version mutation in MVP6.2 P0.
- No ontology governance approval workflow or impact simulation in MVP6.2 P0.
- No copilot, agent runtime, or autonomous action approval in MVP6.2 P0.
- No connector/plugin SDK or external sync runtime in MVP6.2 P0.
- No multi-tenant runtime in MVP6.2 P0.
- No candidate review, publish, or published graph mutation through evaluation
  or learning-signal analysis.
- No automatic policy enforcement or auto-approval execution in MVP6.2 P0.

## Backend Contract-First Scope

- Additive endpoint families for evaluation datasets, samples, gold entities,
  gold relations, deterministic evaluation runs, metrics, and error cases.
- Enum literals for dataset status, sample kind, run mode, run status, metric
  name, metric status, and error type.
- Focused tests for deterministic metric calculation and API happy path.
- OpenAPI export/parse according to existing project pattern.

## Frontend Field/UX Review Scope

- Evaluation/Benchmark route placement and contextual detail navigation.
- Dataset and sample create/list states.
- Gold entity/relation authoring with evidence context.
- Deterministic run action and status display.
- Metric cards/table with formula and not-applicable state.
- Error case explorer with candidate-vs-gold and evidence comparison.
- Loading, empty, error, and no-data states.

## QA Acceptance Checklist Scope

- `INT6-*` contract checks.
- deterministic seed requirements.
- backend API happy path.
- frontend mock and actual API consistency.
- metric formula and zero-denominator behavior.
- error case comparison context.
- MVP1-MVP5 invariant regression guard.
