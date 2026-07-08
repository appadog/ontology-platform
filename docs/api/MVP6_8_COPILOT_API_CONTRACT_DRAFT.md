# MVP6.8 Copilot API Contract Draft (planning-only, additive)

Status: Wave47 contract-first planning. Authoritative machine artifact:
`docs/api/openapi-mvp6-8-draft.json` (OpenAPI 3.1.0, `0.6.8-draft`, 4 paths / 24
schemas, PARSE_OK, additive/disjoint to MVP1-MVP6.7). This markdown is the
human-readable companion; the OpenAPI is the source of truth.

> Authoring note: the Backend agent produced `openapi-mvp6-8-draft.json` but its
> connection dropped before writing this companion doc + its report; the commander
> authored this from the verified OpenAPI + PM brief (`docs/pm/MVP6_8_COPILOT_BRIEF.md`,
> ADR 0015).

## Boundary (ADR 0015)
Copilot is ADVISORY ONLY. It produces deterministic, source-grounded suggestions
and, on ACCEPT, returns a ROUTING descriptor into an existing human-gated flow —
it executes NOTHING. No real LLM (deterministic mock). Every response carries an
all-false `CopilotMutationGuard`.

## Endpoints (all additive)
- `GET /api/v1/projects/{project_id}/copilot/summary` — copilot summary for a project.
- `GET /api/v1/projects/{project_id}/copilot/suggestions` — deterministic suggestion list.
- `GET /api/v1/copilot-suggestions/{suggestion_id}` — suggestion detail.
- `POST /api/v1/copilot-suggestions/{suggestion_id}/decisions` — audit-only ACCEPT/DISMISS; ACCEPT returns a `CopilotRoutingTarget` (no execution).

## Enums (frozen; in the OpenAPI)
- `CopilotSuggestionKind`: DRAFT_GOVERNANCE_CHANGE_REQUEST, REVIEW_THESE_CANDIDATES, INSPECT_QUALITY_OR_VALIDATION_SIGNAL, RUN_IMPACT_SIMULATION (each names its target existing gated flow).
- `CopilotSuggestionState`: SUGGESTED -> ACCEPTED / DISMISSED / SUPERSEDED.
- `CopilotDecisionCommand`: ACCEPT, DISMISS (DISMISS reuses the MVP6.2 reason-code set).
- `CopilotRoutingTargetKind`: GOVERNANCE_CHANGE_REQUEST_DRAFT, CANDIDATE_REVIEW_LOCATION, QUALITY_OR_VALIDATION_LOCATION, IMPACT_REPORT_LOCATION.

## Rules
- Every suggestion cites non-empty source-artifact refs (no ungrounded generation).
- ACCEPT returns a `CopilotRoutingTarget` (deep-link + optional pre-fill payload) with NO authority — creates/mutates nothing; the human proceeds through the existing gate.
- A decision on a non-`SUGGESTED` suggestion returns `409 COPILOT_SUGGESTION_DECISION_CONFLICT`.
- Every response carries an all-false `CopilotMutationGuard` (14 flags incl.
  `copilot_executed_action: false` and `real_model_invoked: false`).
- Authz: any project member may view + record audit-only decisions (MVP5 `Role`,
  no new literal); the downstream gate keeps its own RBAC.
- Reuse MVP6.2 learning suggestion/decision + governance/candidate/quality/impact
  refs by reference — no renames.

## Open questions -> Wave48 gates
- deterministic suggestion-generation source rules per `CopilotSuggestionKind`;
- routing pre-fill payload shape per `CopilotRoutingTargetKind`;
- summary DTO fields.
