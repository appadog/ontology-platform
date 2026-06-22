# MVP 6.2 API Contract Draft

Status: `WAVE 31 TARGETED CONTRACT HARDENED`
Date: 2026-06-22

This draft extends the closed MVP6.1 Gold Set / Benchmark Studio surface with
MVP6.2 Active Learning / Continuous Improvement planning contracts.

Canonical machine-readable planning artifact:
`docs/api/openapi-mvp6-2-draft.json`.

Wave30 is contract-first planning only. This draft does not implement FastAPI
routes, runtime services, database models, migrations, seed data, workers, or
tests.

## Contract Principles

- MVP6.2 is additive. Existing MVP6.1 evaluation paths in
  `docs/api/openapi-mvp6-draft.json` remain stable and are not renamed or
  removed.
- The contract is read-mostly. Learning signal summary, correction patterns,
  prompt suggestions, and auto-approval candidates are project-scoped read
  surfaces.
- The only write-like operation is suggestion decision capture:
  `POST /api/v1/learning-signal-suggestions/{suggestion_id}/decisions`.
  It creates a decision audit note only.
- Suggestion decisions must not mutate prompt versions, extraction jobs,
  candidates, candidate review decisions, published graph versions, published
  graph entities/relations, evaluation runs, model runs, or auto-approval
  policies.
- Auto-approval candidates are recommendation/preview only. They cannot create,
  update, enable, enforce, or execute an auto-approval policy.
- Every learning signal, correction pattern, prompt suggestion, and
  auto-approval preview must retain traceable source artifact references from
  approved MVP3, MVP4, or MVP6.1 artifacts.
- DTO/schema names use PascalCase. JSON fields use snake_case. Enum literals
  use UPPER_SNAKE_CASE.

## Preserved MVP6.1 Boundary

MVP6.2 may read or reference MVP6.1 evaluation runs, metrics, error cases, and
candidate-vs-gold context. It does not change the MVP6.1 evaluation runtime
contract:

- evaluation artifacts remain analysis artifacts, not published graph facts;
- evaluation results cannot approve, reject, or publish candidates;
- evaluation operations cannot move the current published graph pointer;
- durable evaluation persistence remains a later PM decision unless promoted.

## Approved Source Artifact Scope

MVP6.2 P0 may analyze only these closed surfaces:

| Source artifact type | Source surface | P0 use |
|---|---|---|
| `REVIEW_DECISION` | MVP3 review/correction history | repeated reviewer decisions, rejected candidates, decision reasons |
| `REVIEW_CORRECTION` | MVP3 correction history | before/after class, relation, direction, and evidence changes |
| `VALIDATION_RESULT` | MVP3 validation results | repeated failed or warning validation rules |
| `QUALITY_METRIC` | MVP4 quality metrics | low metric clusters, denominators, quality trend hints |
| `QUALITY_DRILLDOWN` | MVP4 quality drilldowns | class, relation, source, or rule-specific quality rows |
| `EVALUATION_RUN` | MVP6.1 evaluation runs | prompt/model/ontology/parser/run context |
| `EVALUATION_METRIC` | MVP6.1 metrics | benchmark metric clusters and denominators |
| `EVALUATION_ERROR_CASE` | MVP6.1 error cases | candidate-vs-gold error examples and evidence comparison |

Published graph facts must not be treated as training labels unless they are
reached through an approved review, correction, quality, or evaluation artifact
with evidence and version context.

## Enum Contract

### Learning Signal Enums

`LearningSignalType`

```text
RELATION_DIRECTION_CORRECTION
CLASS_CONFUSION
RELATION_TYPE_CONFUSION
EVIDENCE_MISSING
EVIDENCE_MISMATCH
REPEATED_VALIDATION_FAILURE
LOW_BENCHMARK_METRIC_CLUSTER
```

`LearningSourceArtifactType`

```text
REVIEW_DECISION
REVIEW_CORRECTION
VALIDATION_RESULT
QUALITY_METRIC
QUALITY_DRILLDOWN
EVALUATION_RUN
EVALUATION_METRIC
EVALUATION_ERROR_CASE
```

`LearningConfidenceLabel`

```text
LOW
MEDIUM
HIGH
```

`LearningRiskLabel`

```text
LOW
MEDIUM
HIGH
```

### Prompt Suggestion Enums

`PromptSuggestionKind`

```text
ADD_RELATION_DIRECTION_EXAMPLE
CLARIFY_CLASS_BOUNDARY
CLARIFY_RELATION_TYPE_BOUNDARY
ADD_EVIDENCE_REQUIREMENT
ADD_NEGATIVE_EXAMPLE
ADD_VALIDATION_FAILURE_GUIDANCE
INVESTIGATE_LOW_METRIC_CLUSTER
```

`PromptSuggestionState`

```text
SUGGESTED
ACCEPTED
DISMISSED
SUPERSEDED
```

`SuggestionDecisionType`

```text
ACCEPT
DISMISS
```

`SuggestionDismissReasonCode`

```text
NOT_RELEVANT
INSUFFICIENT_EVIDENCE
DUPLICATE
OUT_OF_SCOPE
RISK_TOO_HIGH
OTHER
```

`SuggestionIntendedNextAction`

```text
USE_IN_NEXT_PROMPT_DRAFT
DISCUSS_WITH_ONTOLOGY_OWNER
MONITOR_FOR_MORE_EVIDENCE
NO_ACTION
```

`SUPERSEDED` is a read-side suggestion state. It is not set directly by the P0
human decision endpoint unless a later PM freeze adds a system supersede
workflow.

### Auto-Approval Preview Enums

`AutoApprovalPreviewStatus`

```text
RECOMMENDATION_ONLY
NOT_ENFORCED
REQUIRES_POLICY_APPROVAL
```

`AutoApprovalHistoricalMatchOutcome`

```text
WOULD_MATCH
WOULD_NOT_MATCH
BLOCKED_BY_SAFETY_RULE
INSUFFICIENT_EVIDENCE
```

## Endpoint Summary

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-012 | `GET` | `/api/v1/projects/{project_id}/learning-signals/summary` | Project learning signal summary from approved source artifacts |
| BE6-013 | `GET` | `/api/v1/projects/{project_id}/learning-signals/correction-patterns` | Correction pattern list with source artifact refs and support counts |
| BE6-013 | `GET` | `/api/v1/projects/{project_id}/learning-signals/prompt-suggestions` | Prompt improvement suggestions derived from signals/patterns |
| BE6-013 | `GET` | `/api/v1/projects/{project_id}/learning-signals/auto-approval-candidates` | Preview-only auto-approval candidate recommendations |
| BE6-014 | `POST` | `/api/v1/learning-signal-suggestions/{suggestion_id}/decisions` | Human accept/dismiss decision audit capture only |

Common list query parameters:

| Query | Type | Applies to | Notes |
|---|---|---|---|
| `limit` | integer | list endpoints | Default `50`, max `100` |
| `cursor` | string | list endpoints | Opaque pagination cursor |
| `signal_type` | `LearningSignalType` | correction patterns, suggestions, auto-approval previews | Optional filter |
| `risk_label` | `LearningRiskLabel` | suggestions, auto-approval previews | Optional filter |
| `prompt_version_id` | string | suggestions, auto-approval previews | Optional target prompt context |
| `state` | `PromptSuggestionState` | prompt suggestions | Optional filter |

## DTO Contract

### LearningSignalSummaryResponse

```json
{
  "project_id": "project-insurance-demo",
  "generated_at": "2026-06-22T09:00:00Z",
  "window": {
    "label": "Last 30 days",
    "started_at": "2026-05-23T00:00:00Z",
    "ended_at": "2026-06-22T00:00:00Z"
  },
  "source_artifact_scope": [
    "REVIEW_CORRECTION",
    "QUALITY_METRIC",
    "EVALUATION_ERROR_CASE"
  ],
  "total_signal_count": 47,
  "signal_counts": [
    {
      "signal_type": "RELATION_DIRECTION_CORRECTION",
      "count": 12,
      "high_risk_count": 2,
      "latest_observed_at": "2026-06-21T15:10:00Z"
    }
  ],
  "open_prompt_suggestion_count": 4,
  "accepted_prompt_suggestion_count": 1,
  "dismissed_prompt_suggestion_count": 2,
  "superseded_prompt_suggestion_count": 1,
  "high_risk_prompt_suggestion_count": 2,
  "auto_approval_preview_count": 3,
  "top_patterns": [
    {
      "pattern_id": "pattern-relation-direction-contains-001",
      "primary_signal_type": "RELATION_DIRECTION_CORRECTION",
      "title": "Relation direction errors for includes",
      "support_count": 12,
      "risk_label": "MEDIUM"
    }
  ],
  "safety_notes": [
    "Summary is advisory and does not mutate prompts, candidates, policies, or published graph data."
  ]
}
```

Required fields:

```text
project_id
generated_at
window
source_artifact_scope
total_signal_count
signal_counts
open_prompt_suggestion_count
accepted_prompt_suggestion_count
dismissed_prompt_suggestion_count
superseded_prompt_suggestion_count
high_risk_prompt_suggestion_count
auto_approval_preview_count
top_patterns
safety_notes
```

### LearningSourceArtifactRef

```json
{
  "artifact_type": "EVALUATION_ERROR_CASE",
  "artifact_id": "error-case-101",
  "project_id": "project-insurance-demo",
  "candidate_id": "candidate-relation-778",
  "candidate_kind": "RELATION",
  "review_task_id": null,
  "review_decision_id": null,
  "validation_result_id": null,
  "quality_metric_id": null,
  "evaluation_run_id": "eval-run-20260622-001",
  "evaluation_error_case_id": "error-case-101",
  "ontology_version_id": "ontology-v7",
  "prompt_version_id": "prompt-v12",
  "model_run_id": "model-run-982",
  "evidence_refs": [
    {
      "source_id": "source-policy-001",
      "source_segment_id": "segment-42",
      "locator": "page=3:paragraph=8",
      "quote": "The policy includes the rider as an optional coverage."
    }
  ],
  "observed_at": "2026-06-21T15:10:00Z"
}
```

`LearningSourceArtifactRef` is required on signal-derived DTOs. Null fields are
allowed only when that source surface does not produce the identifier.

### CorrectionPattern

```json
{
  "id": "pattern-relation-direction-contains-001",
  "project_id": "project-insurance-demo",
  "primary_signal_type": "RELATION_DIRECTION_CORRECTION",
  "related_signal_types": [
    "LOW_BENCHMARK_METRIC_CLUSTER"
  ],
  "title": "Relation direction errors for includes",
  "affected_classes": [
    {
      "ontology_class_id": "class-insurance-product",
      "label": "InsuranceProduct"
    },
    {
      "ontology_class_id": "class-rider",
      "label": "Rider"
    }
  ],
  "affected_relations": [
    {
      "ontology_relation_id": "relation-includes",
      "label": "includes"
    }
  ],
  "support_count": 12,
  "denominator": 31,
  "confidence_label": "MEDIUM",
  "risk_label": "MEDIUM",
  "first_seen_at": "2026-06-01T10:00:00Z",
  "last_seen_at": "2026-06-21T15:10:00Z",
  "explanation": "Observed repeated source/target reversal for the includes relation in review corrections and evaluation error cases.",
  "representative_examples": [
    {
      "example_id": "example-001",
      "before": "Rider - includes -> InsuranceProduct",
      "after": "InsuranceProduct - includes -> Rider",
      "source_artifact_id": "error-case-101"
    }
  ],
  "source_learning_signal_ids": [
    "signal-001",
    "signal-002"
  ],
  "source_artifacts": [
    {
      "artifact_type": "EVALUATION_ERROR_CASE",
      "artifact_id": "error-case-101",
      "project_id": "project-insurance-demo",
      "candidate_id": "candidate-relation-778",
      "candidate_kind": "RELATION",
      "review_task_id": null,
      "review_decision_id": null,
      "validation_result_id": null,
      "quality_metric_id": null,
      "evaluation_run_id": "eval-run-20260622-001",
      "evaluation_error_case_id": "error-case-101",
      "ontology_version_id": "ontology-v7",
      "prompt_version_id": "prompt-v12",
      "model_run_id": "model-run-982",
      "evidence_refs": [],
      "observed_at": "2026-06-21T15:10:00Z"
    }
  ],
  "safety_note": "Pattern is advisory. It correlates observed review corrections and benchmark errors; it does not prove the prompt is the only cause.",
  "prompt_suggestion_ids": [
    "suggestion-direction-example-001"
  ]
}
```

Required fields:

```text
id
project_id
primary_signal_type
related_signal_types
title
affected_classes
affected_relations
support_count
denominator
confidence_label
risk_label
first_seen_at
last_seen_at
explanation
representative_examples
source_learning_signal_ids
source_artifacts
safety_note
prompt_suggestion_ids
```

### PromptSuggestion

```json
{
  "id": "suggestion-direction-example-001",
  "project_id": "project-insurance-demo",
  "target_prompt_version_id": "prompt-v12",
  "suggestion_kind": "ADD_RELATION_DIRECTION_EXAMPLE",
  "state": "SUGGESTED",
  "title": "Add direction example for InsuranceProduct includes Rider",
  "rationale": "Twelve recent artifacts show reversed direction for the includes relation.",
  "expected_impact": "May reduce relation direction errors for product-rider extraction in the next prompt draft.",
  "preview_text": "When extracting includes, use InsuranceProduct as source and Rider as target. Example: InsuranceProduct - includes -> Rider.",
  "structured_proposal": {
    "section": "relation_direction_examples",
    "operation": "ADD_EXAMPLE",
    "example_text": "InsuranceProduct - includes -> Rider"
  },
  "source_learning_signal_ids": [
    "signal-001",
    "signal-002"
  ],
  "correction_pattern_ids": [
    "pattern-relation-direction-contains-001"
  ],
  "source_artifacts": [],
  "confidence_label": "MEDIUM",
  "risk_label": "MEDIUM",
  "created_at": "2026-06-22T09:00:00Z",
  "updated_at": "2026-06-22T09:00:00Z",
  "decision_audit_note": null,
  "safety_note": "Accepting this suggestion records human intent only. It does not edit prompt-v12 or create a new prompt version."
}
```

Required fields:

```text
id
project_id
target_prompt_version_id
suggestion_kind
state
title
rationale
expected_impact
preview_text
structured_proposal
source_learning_signal_ids
correction_pattern_ids
source_artifacts
confidence_label
risk_label
created_at
updated_at
decision_audit_note
safety_note
```

### AutoApprovalCandidatePreview

```json
{
  "id": "auto-preview-evidence-complete-001",
  "project_id": "project-insurance-demo",
  "title": "Possible approval preview for high-confidence evidence-complete Product includes Rider relations",
  "preview_status": "RECOMMENDATION_ONLY",
  "recommendation_only": true,
  "not_enforced": true,
  "requires_later_policy_approval": true,
  "rule_preview": {
    "candidate_kind": "RELATION",
    "conditions": [
      "ontology_relation_id == relation-includes",
      "evidence_match_rate >= 0.95",
      "validation_failed_count == 0",
      "reviewed_sample_size >= 25"
    ]
  },
  "supporting_metrics": [
    {
      "metric_name": "EVIDENCE_MATCH_RATE",
      "value": 0.97,
      "numerator": 29,
      "denominator": 30
    }
  ],
  "historical_match_preview": {
    "total_examined": 30,
    "would_match_count": 18,
    "blocked_count": 12,
    "outcomes": [
      {
        "artifact_id": "review-decision-777",
        "outcome": "WOULD_MATCH",
        "reason": "Evidence complete and no failed validation"
      }
    ]
  },
  "source_learning_signal_ids": [
    "signal-077"
  ],
  "correction_pattern_ids": [],
  "source_artifacts": [],
  "confidence_label": "LOW",
  "risk_label": "HIGH",
  "safety_note": "Recommendation only. Not enforced. Requires later policy approval before any policy is created or enabled.",
  "blocked_actions": [
    "CREATE_POLICY",
    "ENABLE_POLICY",
    "APPROVE_CANDIDATE",
    "PUBLISH_GRAPH"
  ]
}
```

Required fields:

```text
id
project_id
title
preview_status
recommendation_only
not_enforced
requires_later_policy_approval
rule_preview
supporting_metrics
historical_match_preview
source_learning_signal_ids
correction_pattern_ids
source_artifacts
confidence_label
risk_label
safety_note
blocked_actions
```

### SuggestionDecisionRequest

```json
{
  "decision": "DISMISS",
  "dismiss_reason_code": "INSUFFICIENT_EVIDENCE",
  "note": "The pattern mixes two source types; wait for more review evidence.",
  "intended_next_action": "MONITOR_FOR_MORE_EVIDENCE",
  "client_request_id": "decision-req-20260622-001"
}
```

Rules:

- `decision` is required.
- `dismiss_reason_code` is required when `decision` is `DISMISS`.
- `dismiss_reason_code` must be omitted or null when `decision` is `ACCEPT`.
- `intended_next_action` is optional. For accepted suggestions, the expected
  P0 value is `USE_IN_NEXT_PROMPT_DRAFT`.
- `note` is optional for `ACCEPT` and required for `DISMISS` when
  `dismiss_reason_code` is `OTHER`.
- `client_request_id` is optional idempotency metadata for future runtime
  implementation. It must not be treated as authorization.

### SuggestionDecisionResponse

```json
{
  "suggestion_id": "suggestion-direction-example-001",
  "project_id": "project-insurance-demo",
  "previous_state": "SUGGESTED",
  "new_state": "DISMISSED",
  "decision_audit_note": {
    "id": "suggestion-decision-001",
    "suggestion_id": "suggestion-direction-example-001",
    "project_id": "project-insurance-demo",
    "actor_id": "user-123",
    "actor_role": "PROJECT_ADMIN",
    "decision": "DISMISS",
    "dismiss_reason_code": "INSUFFICIENT_EVIDENCE",
    "note": "The pattern mixes two source types; wait for more review evidence.",
    "intended_next_action": "MONITOR_FOR_MORE_EVIDENCE",
    "decided_at": "2026-06-22T09:20:00Z",
    "source_learning_signal_ids": [
      "signal-001",
      "signal-002"
    ],
    "target_prompt_version_id": "prompt-v12",
    "suggestion_snapshot": {
      "suggestion_kind": "ADD_RELATION_DIRECTION_EXAMPLE",
      "title": "Add direction example for InsuranceProduct includes Rider",
      "preview_text": "When extracting includes, use InsuranceProduct as source and Rider as target."
    },
    "mutation_guard": {
      "prompt_version_mutated": false,
      "candidate_graph_mutated": false,
      "published_graph_mutated": false,
      "auto_approval_policy_mutated": false,
      "extraction_job_started": false,
      "evaluation_run_started": false
    }
  }
}
```

Required fields:

```text
suggestion_id
project_id
previous_state
new_state
decision_audit_note
```

## Endpoint Details

### GET `/api/v1/projects/{project_id}/learning-signals/summary`

Returns `LearningSignalSummaryResponse`.

P0 behavior:

- read-only;
- project-scoped;
- uses approved source artifact scope only;
- returns zero counts and empty arrays when no signals exist;
- does not create or refresh signals as a side effect.

### GET `/api/v1/projects/{project_id}/learning-signals/correction-patterns`

Returns `CorrectionPatternListResponse`.

P0 behavior:

- read-only list;
- supports optional `signal_type`, `risk_label`, `limit`, and `cursor`;
- each item must include source artifact refs and support counts;
- patterns may describe correlation or observed reviewer correction, but must
  not imply unsupported causality.

### GET `/api/v1/projects/{project_id}/learning-signals/prompt-suggestions`

Returns `PromptSuggestionListResponse`.

P0 behavior:

- read-only list;
- supports optional `state`, `signal_type`, `risk_label`,
  `prompt_version_id`, `limit`, and `cursor`;
- suggestions may include preview text and structured prompt-change proposals;
- suggestions do not create prompt drafts or mutate prompt versions.

### GET `/api/v1/projects/{project_id}/learning-signals/auto-approval-candidates`

Returns `AutoApprovalCandidatePreviewListResponse`.

P0 behavior:

- read-only list;
- supports optional `signal_type`, `risk_label`, `prompt_version_id`, `limit`,
  and `cursor`;
- every item must state recommendation-only semantics;
- every item must expose blocked actions.

### POST `/api/v1/learning-signal-suggestions/{suggestion_id}/decisions`

Creates a human decision audit note and returns `SuggestionDecisionResponse`.

P0 behavior:

- accepted decisions move `SUGGESTED` to `ACCEPTED`;
- dismissed decisions move `SUGGESTED` to `DISMISSED`;
- a decision against `ACCEPTED`, `DISMISSED`, or `SUPERSEDED` returns a conflict
  error unless a later runtime implementation explicitly supports idempotent
  `client_request_id`;
- the response must include `mutation_guard` flags set to `false`;
- the endpoint must not edit prompts, create extraction jobs, update candidate
  reviews, publish graph facts, start evaluation runs, or mutate
  auto-approval policies.

## Error Contract

`ApiError`

```json
{
  "code": "SUGGESTION_STATE_CONFLICT",
  "message": "Suggestion has already been decided.",
  "details": {
    "suggestion_id": "suggestion-direction-example-001",
    "state": "ACCEPTED"
  }
}
```

Recommended error codes:

```text
PROJECT_NOT_FOUND
LEARNING_SIGNAL_SOURCE_SCOPE_INVALID
SUGGESTION_NOT_FOUND
SUGGESTION_STATE_CONFLICT
DISMISS_REASON_REQUIRED
DISMISS_REASON_NOT_ALLOWED
DECISION_NOTE_REQUIRED
PERMISSION_DENIED
```

## Planning-Only OpenAPI Artifact

`docs/api/openapi-mvp6-2-draft.json` is a standalone planning artifact for this
MVP6.2 surface. It intentionally contains only the additive MVP6.2 paths and
schemas needed for contract review, rather than replacing
`docs/api/openapi-mvp6-draft.json`.

Expected parse metadata:

```text
openapi: 3.1.0
info.version: 0.6.2-draft
paths: 5
```

## Out of Scope for MVP6.2 P0

- Runtime API implementation.
- Database models or Alembic migrations.
- Seed data or deterministic runtime stores.
- Test implementation.
- Fine-tuning execution.
- Live retraining.
- Training dataset export execution.
- Real provider prompt rewriting.
- Prompt version mutation.
- Extraction job creation or rerun.
- Candidate review mutation.
- Candidate graph mutation.
- Published graph mutation.
- Auto-approval policy create/update/enable/enforce.
- Autonomous publish.
- Ontology governance workflow.
- Impact simulation.
- Copilot or agent runtime.
- Connector/plugin SDK.
- Multi-tenant runtime.
- Ontology packs.
- Advanced visualization/storytelling.
