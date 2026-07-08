# ADR 0015: MVP6.8 Copilot — Advisory-Only / Non-Autonomous / Audit-Only / Accept-Routes-Not-Executes / No-Real-LLM Boundary

## Status

Accepted

## Context

MVP6.8 opens the Agents / Copilot theme (roadmap Theme 5,
`04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`) — the largest and most
safety-sensitive theme so far. The obvious failure mode is an autonomous agent
that acts on the graph: rewrites prompts, approves candidates, applies governance
changes, or publishes — bypassing the human gates the whole platform is built
around. Every closed MVP has asserted the opposite posture (candidate/published
separation, evidence grounding, human review, all-false mutation guards); an
agent that acts would break all of it at once.

MVP6.8 P0 is therefore cut to the smallest coherent, SAFE, human-in-the-loop,
**non-autonomous** slice: a project-scoped **Copilot** that reads existing
project context and produces a deterministic, source-grounded list of suggested
next-actions / draft proposals. A human can **accept** a suggestion (which routes
them into an EXISTING gated flow, pre-filled/deep-linked — it executes NOTHING)
or **dismiss** it (with a reason). All decisions are audit-only. This mirrors the
closest precedent — the MVP6.2 active-learning suggestion+decision loop
(audit-only, all-false guard) — and feeds into the already-closed gated flows
(MVP3 candidate review; MVP6.5/6.6 governance change-request lifecycle/apply;
MVP4 quality / MVP3 validation; MVP6.7 impact simulation).

The surfaces the copilot reads already exist and are reused **by reference, no
renames**:
- MVP6.2 learning signals / correction patterns / prompt suggestions and its
  `LearningSourceArtifactType`, `ACCEPT`/`DISMISS` command + reason vocabulary.
- MVP3 candidates/evidence/review; MVP4 `QualityMetricGroup`; MVP3
  `ValidationRuleCode`.
- MVP6.5/6.6 governance change requests/items (`ChangeRequestTargetKind`,
  `ChangeRequestChangeType`, `OntologyElementRef`, governance lifecycle/apply)
  and MVP6.7 impact simulation.
- MVP1 ontology/version + prompt/model-run context; MVP5 `Role` for read authz.

## Decision

- **MVP6.8 P0 is an advisory, project-scoped copilot suggestion loop.** From
  existing project artifacts it produces a deterministic list of suggestions;
  each carries what/why, source grounding, and the target existing gated flow it
  would route into. A human accepts (→ routed, pre-filled, into the gate) or
  dismisses (with reason). The demo ends at the decision audit note plus (on
  accept) the returned routing target.

- **ADVISORY-ONLY / NON-AUTONOMOUS — the load-bearing rule.** The copilot
  produces suggestions/draft proposals and **executes NOTHING**. No autonomous
  action, no auto-apply, no auto-publish, no auto-approve, no auto-create of any
  gated-flow object, no policy enforcement, no gating. It never bypasses a human
  gate; every real change still flows through the existing human-gated paths.

- **ACCEPT ROUTES — NEVER EXECUTES.** On `ACCEPT` the copilot returns a **routing
  target**: a reference / deep-link descriptor into an existing gated flow
  (`CopilotRoutingTargetKind` = `GOVERNANCE_CHANGE_REQUEST_DRAFT` /
  `CANDIDATE_REVIEW_LOCATION` / `QUALITY_OR_VALIDATION_LOCATION` /
  `IMPACT_REPORT_LOCATION`), optionally carrying a pre-fill payload (e.g. a
  governance change-request **draft** the human takes into the MVP6.5 create
  screen). The routing target carries **no authority**: it creates, mutates,
  applies, approves, and publishes nothing. The human still passes through every
  gate of the target flow. On accept the copilot persists only the suggestion
  state transition, the decision audit record, and the returned routing-target
  descriptor.

- **AUDIT-ONLY decision capture.** Decisions mirror MVP6.2: request commands are
  `ACCEPT`/`DISMISS` (distinct from resulting states `ACCEPTED`/`DISMISSED`);
  `SUPERSEDED` is read-side only; `DISMISS` requires a reason code (MVP6.2 set
  reused verbatim: `NOT_RELEVANT`, `INSUFFICIENT_EVIDENCE`, `DUPLICATE`,
  `OUT_OF_SCOPE`, `RISK_TOO_HIGH`, `OTHER`); a decision against a non-`SUGGESTED`
  suggestion returns `409 COPILOT_SUGGESTION_DECISION_CONFLICT`. A decision
  cannot mutate candidate/published graph, prompts, ontology, governance state,
  auto-approval policy, extraction jobs, evaluation runs, or model runs — it
  writes an audit decision record only. New copilot-scoped enums
  (`CopilotSuggestionKind`, `CopilotSuggestionState`, `CopilotRoutingTargetKind`)
  are added; **no MVP6.2 enum is renamed**.

- **SOURCE-GROUNDED, DETERMINISTIC, NO REAL LLM.** Every suggestion cites the
  existing artifacts it derives from (evidence/version/candidate/validation/
  quality/governance/learning refs) — no ungrounded generation; a suggestion
  without source-artifact references is invalid and cannot be created.
  Suggestions are generated **deterministically** (same project state → same
  byte-stable list). No real LLM / external model call in P0 — deterministic
  mock only, mirroring the MockProvider precedent.

- **ALL-FALSE MUTATION GUARD on every response.** Every copilot response
  (summary, list, detail, and decision accept/dismiss) carries an all-false
  `CopilotMutationGuard` — every flag false, no exceptions, including on accept.
  MVP6.8 turns **no** mutation flag true, ever (distinct from the single MVP6.6
  apply guard). The guard includes copilot-specific assertions
  `copilot_executed_action: false` and `real_model_invoked: false` alongside the
  standard ontology/candidate/published/prompt/governance/extraction/evaluation/
  auto-approval flags. This returns the platform to the all-false posture and
  makes "the copilot never acts and never calls a real model" mechanically
  assertable.

- **Authorization (frozen).** Any project member who can read the project may
  view the copilot and record an audit-only accept/dismiss (decisions mutate
  nothing and confer no rights). The **downstream** gated flow keeps its own RBAC
  (e.g. only an approver can approve a governance change request). Reuse MVP5
  `Role`; no new role literal. Unauthorized → `403 PERMISSION_DENIED`; unknown
  project/suggestion → `404 PROJECT_NOT_FOUND` / `404 COPILOT_SUGGESTION_NOT_FOUND`.

- **Consumed via ADR 0010 IA.** The copilot is project-scoped (an Analyze-group
  destination or a contextual panel; no ID-bound global LNB pages). Accept must
  visibly route the human into the existing gate; copy must make clear the
  copilot is advisory and executes nothing. Reuse the closed Section+Card design
  language and D6 status tokens.

- **Persist-vs-compute (deferred to Backend/Wave48).** Whether suggestions/
  decisions are computed on demand or persisted (keyed by `suggestion_id`,
  mirroring MVP6.3/6.7 list + GET-by-id) is a Backend contract decision; either
  way it is advisory, carries the all-false guard, and executes nothing. Durable
  DB/Alembic persistence is not required for the P0 thin slice; the proven
  deterministic process-local store (`reset_runtime_store()`, MVP6.1–6.7 pattern)
  is acceptable. Durable persistence stays P1/P2.

- **Out of scope (P1 or later unless explicitly promoted):** autonomous action;
  auto-apply/publish/approve/create of any gated-flow object; policy enforcement /
  gating; real LLM / external model call / non-deterministic generation;
  tool-calling runtime; multi-step agent execution; agent planning/orchestration;
  background/scheduled/always-on agents; direct mutation of any ontology (draft/
  published), candidate graph, published graph, prompt version, governance state,
  extraction job, evaluation run, model run, or auto-approval policy; ungrounded
  generation; new suggestion/routing-target kinds beyond the frozen four each;
  multi-/cross-project copilot; connector/plugin SDK; multi-tenant runtime.

## Consequences

- Backend can draft additive, read-mostly, project-scoped endpoint(s) — a copilot
  summary, a deterministic suggestion list, a suggestion GET-by-id, and an
  audit-only decision endpoint that on accept returns a routing-target descriptor
  — reusing MVP6.2 learning-decision + MVP3 candidate/review + MVP4 quality +
  MVP3 validation + MVP6.5/6.6 governance + MVP6.7 impact + MVP1 ontology/version
  + MVP5 `Role` shapes **by reference (no renames)**, importing no write path of
  any gated flow. It models the all-false `CopilotMutationGuard`, the
  `CopilotSuggestionKind`/`CopilotSuggestionState`/`CopilotRoutingTargetKind`
  enums, the routing-target descriptor, and `403`/`404`/`409` errors.
- Frontend can add a project-scoped copilot surface (ADR 0010 IA, no ID-bound
  global LNB pages) with the suggestion list (what/why/source grounding/target
  flow), an accept-routes-into-the-gate UX that makes the human gate explicit,
  dismiss+reason, the decision audit note, and first-class loading/empty/error/
  permission states — copy making crystal clear the copilot is advisory and
  executes nothing.
- QA can assert "accept does not execute" at three layers: response guard
  all-false (incl. `copilot_executed_action`/`real_model_invoked`), code-level
  (copilot module imports no gated-flow write path), and data-level (candidate/
  published/prompt/ontology/governance/extraction/evaluation tables unchanged
  after summary/list/accept/dismiss). Determinism (byte-stable list), grounding
  (no suggestion without source refs), decision conflict `409`, authz `403`/`404`,
  and MVP1–MVP6.7 regression are also verifiable.
- The platform preserves candidate/published separation (the copilot only reads),
  evidence/version/audit traceability, no autonomous publish, no automatic
  enforcement, no auto-apply, and no real LLM. The change is additive and does
  not alter MVP1–MVP6.7 paths, enums, or smokes. MVP6.8 keeps the all-false
  mutation-guard posture; it turns **no** mutation flag true and calls **no** real
  model.
