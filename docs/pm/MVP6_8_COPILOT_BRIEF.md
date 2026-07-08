# MVP6.8 Agents / Copilot Brief

Status: `FROZEN / WAVE 47 CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-03
Owner: PM / Architecture

MVP6.8 opens Theme 5 (Agents / Copilot) from
`04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md` — the largest and most
safety-sensitive theme so far. It is cut to the smallest coherent, **SAFE,
human-in-the-loop, NON-AUTONOMOUS** P0: a project-scoped **Copilot** that reads
existing project context and produces a deterministic, source-grounded list of
suggested next-actions / draft proposals, which a human can **accept** (routes
the human into an EXISTING gated flow, pre-filled — never executes) or
**dismiss** (with a reason). All decisions are audit-only. **The copilot
executes NOTHING.**

Wave47 is planning only. Do not implement runtime API, DB migration, frontend
route/component code, seed code, batch jobs, real LLM calls, agent runtime,
tool-calling, multi-step execution, background/scheduled agents, or any
mutation. Runtime waits for Wave48.

## Product Goal

MVP6.8 P0 helps a project member answer:

```text
Given everything the system already knows about this project, what should I
consider doing next — and where do I go (an existing human-gated flow) to
actually do it?
```

The copilot is an **advisor**. It never takes the action itself. Every real
change still flows through the existing human-gated paths (candidate review,
governance change-request lifecycle/apply, publish, prompt drafting). The first
P0 value is an **auditable, grounded, routed suggestion loop**, not an agent
that acts.

## P0 Demo Flow

Frozen P0 demo flow:

```text
open project copilot
-> view deterministic suggested actions
   (each: what, why, source grounding, target existing gated flow)
-> accept (routes the human into that gated flow, pre-filled/deep-linked — copilot executes NOTHING)
   or dismiss (with reason)
-> see decision audit note
-> (copilot mutates nothing; all real changes still require the human gate)
```

The demo ends at the decision audit note plus (on accept) a **routing target**:
a reference / deep-link into an existing gated flow. Accepting a suggestion
records human intent and returns where to go; it does NOT create, mutate,
apply, approve, or publish anything.

## Suggestion Taxonomy (frozen, minimal)

P0 suggestion kinds are kept deliberately small. Every kind names the **existing
gated flow** it routes into on accept and the **source artifacts** it must cite.
Enum name for API/Frontend: `CopilotSuggestionKind`.

| Kind | What it suggests | Source grounding (must cite) | Target existing gated flow (accept routes here — does not execute) |
|---|---|---|---|
| `DRAFT_GOVERNANCE_CHANGE_REQUEST` | Draft an ontology change request (e.g. clarify a class boundary, deprecate an unused element) for human proposal. | MVP6.2 learning signals / correction patterns / prompt suggestions; MVP3 review corrections; MVP4 quality drilldown; ontology version context. | MVP6.5 governance change-request **create/propose** flow, pre-filled draft (`ChangeRequestTargetKind`/`ChangeRequestChangeType` + `OntologyElementRef`). Human still proposes → reviews → approves → applies. |
| `REVIEW_THESE_CANDIDATES` | Point the human at a specific set of candidates worth reviewing. | MVP3 candidate/evidence + review state; MVP4 quality cluster; MVP6.1 evaluation error cases. | MVP3 candidate **review** inbox/workbench, deep-linked to the referenced candidates. Human still reviews/corrects/decides. |
| `INSPECT_QUALITY_OR_VALIDATION_SIGNAL` | Point the human at a quality metric group / validation rule cluster to inspect. | MVP4 `QualityMetricGroup` drilldown; MVP3 `ValidationRuleCode` results. | MVP4 quality dashboard / MVP3 validation drilldown, deep-linked. Read-only destination; human decides any follow-up. |
| `RUN_IMPACT_SIMULATION` | Suggest running the read-only MVP6.7 impact report for an existing change request before apply/publish. | MVP6.5/6.6 governance change request; MVP6.7 impact dimensions. | MVP6.7 impact-report panel on the governance change-request detail, deep-linked. Read-only analysis; human still decides apply/publish. |

Exactly these four kinds are P0. New kinds (e.g. "draft a prompt change",
"cut a gold-set revision") are P1+ and must be added by a later PM freeze.

Every suggestion MUST retain source-artifact references. A suggestion without
traceable source artifacts is **invalid for P0 display and cannot be created**.
No ungrounded generation. Deterministic mock only — no real LLM.

## Source-Grounding Requirement

Every suggestion cites the existing artifacts it derives from, reused **by
reference, no renames**, drawing on the MVP6.2 `LearningSourceArtifactType`
vocabulary plus governance/candidate/quality/impact refs already defined by
closed MVPs:

- MVP6.2 learning signals, correction patterns, prompt suggestions
  (`LearningSourceArtifactType`: `REVIEW_DECISION`, `REVIEW_CORRECTION`,
  `VALIDATION_RESULT`, `QUALITY_METRIC`, `QUALITY_DRILLDOWN`, `EVALUATION_RUN`,
  `EVALUATION_METRIC`, `EVALUATION_ERROR_CASE`).
- MVP3 candidate/evidence/review artifacts (candidate id/kind, evidence refs,
  review task/decision).
- MVP4 quality (`QualityMetricGroup`) + MVP3 validation (`ValidationRuleCode`).
- MVP6.5/6.6 governance change requests/items + MVP6.7 impact refs.
- Ontology version / prompt version / model run context where available.

The copilot derives suggestions **deterministically** from these artifacts
(same project state → same suggestion list, byte-stable ordering). No LLM, no
randomness, no external model call.

## Suggestion States + Decision Rules

MVP6.8 mirrors the MVP6.2 suggestion+decision vocabulary. It does **not** rename
any MVP6.2 enum; it introduces copilot-scoped enums where needed.

P0 suggestion states (new enum `CopilotSuggestionState`, mirroring MVP6.2
`PromptSuggestion` states — no rename of the MVP6.2 enum):

| State | Meaning | Allowed next states |
|---|---|---|
| `SUGGESTED` | Deterministically generated from current project artifacts; awaiting human decision. | `ACCEPTED`, `DISMISSED`, `SUPERSEDED` |
| `ACCEPTED` | Human accepted; a routing target into an existing gated flow was returned. No execution occurred. | `SUPERSEDED` |
| `DISMISSED` | Human dismissed with a reason. | `SUPERSEDED` |
| `SUPERSEDED` | A newer project state / suggestion replaced this one. Read-side only. | none |

Decision rules (identical shape to MVP6.2, copilot-scoped):

- A **human actor** must make the decision.
- Request command values are `ACCEPT` and `DISMISS` (commands — NOT the
  resulting states `ACCEPTED`/`DISMISSED`).
- `ACCEPT` moves a `SUGGESTED` suggestion to resulting state `ACCEPTED`,
  records the human intent, and returns a **routing target** (a reference /
  deep-link to the existing gated flow — see Routing Model). **It executes
  nothing**: no change request created, no candidate approved, no publish, no
  prompt edit, no apply.
- `DISMISS` moves a `SUGGESTED` suggestion to resulting state `DISMISSED` and
  requires a reason code (reuse the MVP6.2 set verbatim):
  - `NOT_RELEVANT`
  - `INSUFFICIENT_EVIDENCE`
  - `DUPLICATE`
  - `OUT_OF_SCOPE`
  - `RISK_TOO_HIGH`
  - `OTHER`
- `SUPERSEDED` is a read-side state, not a human decision command.
- A decision command against `ACCEPTED`, `DISMISSED`, or `SUPERSEDED` returns a
  conflict by default (`409 COPILOT_SUGGESTION_DECISION_CONFLICT`), unless a
  later PM freeze explicitly adds idempotency.
- A decision cannot mutate candidate graph, published graph, prompt versions,
  ontology (draft or published), governance state, auto-approval policies,
  extraction jobs, evaluation runs, or model runs. It writes an **audit decision
  record only**.

### Required suggestion content

- suggestion id, project id;
- `CopilotSuggestionKind` and `CopilotSuggestionState`;
- title, rationale ("why"), plain-language expected next step;
- **routing target descriptor**: the target gated-flow identifier + the
  pre-fill / deep-link reference payload (see below) — this is a *destination*,
  not an executed action;
- source artifact references (grounding) — required, non-empty;
- confidence label: `LOW` / `MEDIUM` / `HIGH`;
- risk label: `LOW` / `MEDIUM` / `HIGH`;
- created at, updated at, and current decision audit note when decided.

### Decision audit content

Decision events are audit records only and must include: actor id/role,
decision command, reason code (for dismiss), free-text note, timestamp,
suggestion snapshot, source artifact ids, and — for accept — the returned
routing target (so the audit shows *where the human was routed*, and that
nothing was executed).

## Routing Model (accept routes — never executes)

This is the load-bearing safety property QA must be able to assert
mechanically. On `ACCEPT`, the copilot returns a **routing target** and mutates
nothing itself.

- A routing target is a **reference / deep-link descriptor** into an existing
  gated flow. New enum `CopilotRoutingTargetKind`:
  - `GOVERNANCE_CHANGE_REQUEST_DRAFT` — a pre-filled governance change-request
    **draft payload** (target kind/type + element refs) the human takes into the
    MVP6.5 create/propose screen. The copilot does NOT create the change request.
  - `CANDIDATE_REVIEW_LOCATION` — a deep-link to the MVP3 review inbox/workbench
    scoped to the referenced candidates. The copilot does NOT decide/correct.
  - `QUALITY_OR_VALIDATION_LOCATION` — a deep-link to the MVP4 quality / MVP3
    validation drilldown. Read-only destination.
  - `IMPACT_REPORT_LOCATION` — a deep-link to the MVP6.7 impact-report panel for
    the referenced change request. Read-only analysis.
- The routing target is a **descriptor of a destination + optional pre-fill
  payload**. It carries NO authority: it does not create, mutate, apply,
  approve, or publish. The human still passes through every gate of the target
  flow (propose → review → approve → apply; review → correct → decide; etc.).
- On accept, the copilot response persists only: the suggestion state transition
  (`SUGGESTED`→`ACCEPTED`), the decision audit record, and the returned routing
  target descriptor. It writes into NO other surface.

So QA can assert "accept does not execute" at three layers: (1) the response
carries an all-false mutation guard; (2) the copilot module imports no write
path of any gated flow; (3) after accept, candidate/published/prompt/ontology/
governance/extraction/evaluation tables are unchanged.

## All-False Mutation Guard

Every copilot response (summary, list, suggestion detail, and **decision**
accept/dismiss) carries an **all-false** `CopilotMutationGuard` — every flag
false, no exceptions, on every response including accept. MVP6.8 turns **no**
mutation flag true, ever (distinct from the single MVP6.6 apply guard). Frozen
flags (all default false, all always false in P0):

```text
ontology_draft_mutated
ontology_published_mutated
candidate_graph_mutated
published_graph_mutated
prompt_version_mutated
governance_state_mutated
change_request_created
change_request_applied
candidate_approved_or_published
extraction_job_started
evaluation_run_started
auto_approval_policy_mutated
copilot_executed_action
real_model_invoked
```

`copilot_executed_action: false` and `real_model_invoked: false` are the
copilot-specific assertions QA verifies on every response: the copilot never
acts and never calls a real model in P0.

## Authorization (frozen)

- **View**: any project member who can read the project may open the copilot and
  view suggestions (advisory, read-derived — no elevated role, mirroring the
  MVP6.7 read stance). Reuse MVP5 `Role` for the standard project read check.
- **Decide** (accept/dismiss): any project member may record an audit-only
  decision; decisions mutate nothing and never bypass a downstream gate, so no
  elevated role is required to decide. The **downstream** gated flow keeps its
  own RBAC (e.g. only an approver can approve a governance change request) —
  accepting a copilot suggestion grants no rights there.
- Unauthorized project access → `403 PERMISSION_DENIED`; unknown project →
  `404 PROJECT_NOT_FOUND`; unknown suggestion → `404 COPILOT_SUGGESTION_NOT_FOUND`.
- No new role literal.

## Contract-First Expectations

Backend should draft additive, planning-only API/DTO documents after this brief.
The contract is read-mostly and project-scoped. The only write-like operation in
P0 is suggestion decision capture, and it writes an audit decision record (plus
the accepted suggestion's returned routing target) only.

Recommended endpoint families for the Backend contract draft:

```text
GET  /api/v1/projects/{project_id}/copilot/summary
GET  /api/v1/projects/{project_id}/copilot/suggestions
GET  /api/v1/copilot-suggestions/{suggestion_id}
POST /api/v1/copilot-suggestions/{suggestion_id}/decisions
```

`POST .../decisions` accepts `ACCEPT`/`DISMISS`; on `ACCEPT` the response
includes the routing target descriptor and the all-false guard; on `DISMISS` it
requires a reason code. No endpoint executes a gated-flow action.

Frontend should draft IA + state requirements only in Wave47. The copilot is a
project-scoped workflow area (LNB placement per ADR 0010 — an Analyze-group
destination or a contextual panel; no ID-bound global LNB pages). Copy must make
crystal clear the copilot is advisory and executes nothing; accept must visibly
route the human into the existing gate.

QA should create a separate MVP6.8 checklist verifying scope alignment, taxonomy
consistency, decision audit behavior, the accept-routes-not-executes model, the
all-false / no-real-LLM boundary, and absence of runtime leakage.

## Explicit Exclusions (P1 or later unless explicitly promoted)

- Autonomous action of any kind; the copilot acting on its own.
- Auto-apply, auto-publish, auto-approve, auto-create of a change request or any
  gated-flow object.
- Policy enforcement / gating; blocking or pre-authorizing any downstream flow.
- Real LLM / external model call; any non-deterministic generation.
- Tool-calling runtime; multi-step agent execution; agent planning/orchestration.
- Background / scheduled / always-on agents.
- Direct mutation of any ontology (draft/published), candidate graph, published
  graph, prompt version, governance state, extraction job, evaluation run, model
  run, or auto-approval policy.
- Ungrounded generation (suggestions without source-artifact references).
- New suggestion kinds beyond the frozen four; new routing-target kinds beyond
  the frozen four.
- Multi-project / cross-project copilot; connector/plugin SDK; multi-tenant
  runtime.
- Durable DB/Alembic persistence is not required for the P0 thin slice; the
  proven deterministic process-local store (`reset_runtime_store()`,
  MVP6.1–6.7 pattern) is acceptable. Durable persistence stays P1/P2.

## Durable Invariants Preserved

- LLM/derived results never write the published graph directly; the copilot
  writes nothing at all.
- Candidate graph and published graph stay separated; the copilot only reads
  both (via source grounding) and mutates neither.
- Every suggestion carries source-artifact grounding (evidence/version/candidate/
  validation/quality/governance refs) — no ungrounded generation.
- Contract-first: PM freeze → Backend contract/OpenAPI → Frontend field/state
  review → QA checklist, before any runtime.
- Scope guard: additive only; no MVP1–MVP6.7 path/enum/smoke break; no rename of
  reused shapes; boundary recorded in ADR 0015.

## P0 Acceptance

MVP6.8 P0 contract is acceptable when:

- the demo flow is supported by PM, Backend, Frontend, and QA planning docs;
- all four suggestion kinds map to approved source artifacts and each names its
  target existing gated flow;
- suggestion states and decision reason rules are consistent across docs, and
  request commands `ACCEPT`/`DISMISS` are not confused with resulting states
  `ACCEPTED`/`DISMISSED`;
- accept returns a routing-target descriptor and executes nothing; dismiss
  requires a reason code; both create an audit note and no other mutation;
- every response carries an all-false `CopilotMutationGuard` (including
  `copilot_executed_action: false` and `real_model_invoked: false`);
- no real LLM, no autonomous action, no auto-apply/publish/approve, no policy
  enforcement, no tool-calling/multi-step/background agent runtime, and no direct
  mutation of any graph/prompt/governance state are present in P0.
