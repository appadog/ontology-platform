# MVP6.2 Active Learning / Continuous Improvement Brief

Status: `FROZEN / WAVE 31 TARGETED CONTRACT HARDENED`
Date: 2026-06-22
Owner: PM / Architecture

MVP6.2 opens Theme 2 from
`04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`, but only as the
smallest contract-first continuous-improvement loop. It turns existing review,
quality, and benchmark artifacts into learning signals and human-reviewed
prompt suggestions.

Wave30 is planning only. Do not implement runtime API, DB migration, frontend
route/component code, seed code, batch jobs, fine-tuning, retraining, prompt
rewriting, auto-approval enforcement, governance workflow, impact simulation,
copilot/agent runtime, connector/plugin SDK, or multi-tenant runtime.

Wave31 adds targeted contract hardening only. It does not redesign MVP6.2 or
open runtime implementation.

## Product Goal

MVP6.2 P0 helps a project owner answer:

```text
What does the system keep getting wrong, why do we believe that,
and what prompt improvement should a human accept or dismiss next?
```

It does not make the improvement automatically. The first P0 value is an
auditable improvement recommendation loop, not a self-training system.

## P0 Demo Flow

Frozen P0 demo flow:

```text
select project
-> view learning signal summary
-> inspect correction pattern
-> inspect prompt suggestion
-> accept/dismiss suggestion
-> see decision audit note
```

The demo ends at the decision audit note. Accepting a prompt suggestion records
human intent for a future prompt-version drafting workflow. It does not mutate
the current prompt version, rerun extraction, approve candidates, or publish
graph facts.

## P0 Source Artifacts

MVP6.2 P0 may analyze only existing artifacts from closed MVP surfaces:

| Source artifact | P0 use | Required traceability |
|---|---|---|
| MVP3 review/correction history | detect repeated reviewer corrections, rejected candidates, corrected class/relation values, and review decision reasons | project id, candidate id/kind, review task/decision id, reviewer decision, before/after values, evidence refs, ontology version, prompt/model run context when available |
| MVP4 quality metrics | detect recurring low quality clusters and validation/quality drilldown patterns | project id, metric name/group, value/numerator/denominator, quality snapshot or drilldown id, ontology version, source/domain bucket when available |
| MVP6.1 evaluation errors/metrics | connect benchmark failures to prompt suggestions and correction patterns | evaluation run id, metric name/status, error case id/type, sample id, candidate ref, gold/candidate evidence, ontology version, prompt version, model name/run id, parser version |

P0 must not analyze published graph facts as if they were training labels unless
they are reached through an approved review/correction/evaluation artifact with
evidence and version context.

The source artifact enum for API and Frontend contracts is
`LearningSourceArtifactType` and is frozen as:

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

## Learning Signal Taxonomy

P0 learning signal types are frozen as:

| Signal type | Meaning | Typical source evidence | P0 output |
|---|---|---|---|
| `RELATION_DIRECTION_CORRECTION` | Reviewers or evaluation repeatedly show that source/target direction is reversed for a relation pattern. | MVP3 relation correction before/after values, MVP6.1 `WRONG_RELATION_DIRECTION`, low `RELATION_DIRECTION_ACCURACY`. | direction pattern summary, affected relation ids, examples, suggested prompt direction guidance |
| `CLASS_CONFUSION` | The model repeatedly assigns an entity to the wrong ontology class. | MVP3 corrected entity class, MVP6.1 `WRONG_ENTITY_CLASS`, MVP4 quality drilldown by class. | confused class pair, support count, examples, suggested class boundary guidance |
| `RELATION_TYPE_CONFUSION` | The model chooses the wrong relation type while endpoints or evidence are otherwise plausible. | MVP3 corrected relation type, MVP6.1 `WRONG_RELATION_TYPE`, relation metric cluster. | confused relation pair, affected domain/range, examples, suggested few-shot contrast |
| `EVIDENCE_MISSING` | Candidate/review/evaluation artifacts show missing evidence where evidence is required. | MVP3 review rejection/correction reason, MVP4 evidence completeness metric, missing candidate evidence in MVP6.1 error cases. | missing-evidence pattern, source/domain bucket, suggested evidence instruction |
| `EVIDENCE_MISMATCH` | Evidence exists but does not support the candidate or gold comparison. | MVP6.1 `EVIDENCE_MISMATCH`, MVP4 evidence match rate, reviewer correction notes. | mismatch pattern, locator/quote examples, suggested evidence matching guidance |
| `REPEATED_VALIDATION_FAILURE` | The same validation constraint repeatedly fails for a class, relation, source, prompt, or model run cluster. | MVP3 validation results and review outcomes, MVP4 validation quality drilldowns. | failing rule cluster, frequency, affected ontology version, suggested prompt or review-priority note |
| `LOW_BENCHMARK_METRIC_CLUSTER` | MVP6.1 metrics are repeatedly low for a meaningful project slice. | low precision/recall/F1/direction/evidence metric by prompt, ontology, source, class, relation, or model run. | metric cluster, denominator, example error cases, suggested prompt investigation |

Every signal must retain source artifact references. A signal without traceable
source artifacts is invalid for P0 display and cannot create a prompt
suggestion.

## Correction Pattern Rules

A correction pattern groups related learning signals into a human-readable
explanation. P0 grouping may use relation id, class id, source type, prompt
version, model run, ontology version, validation rule, or benchmark metric
bucket.

Required correction pattern content:

- pattern id and project id;
- primary signal type and related signal type list;
- affected ontology class/relation ids where available;
- source artifact refs and example count;
- support count and denominator when measurable;
- first seen and last seen timestamps;
- short explanation and representative examples;
- safety note when evidence is thin, conflicting, or not measurable.

P0 must avoid implying causality beyond the evidence. Use "correlates with" or
"observed in" semantics for clusters unless the source artifact proves a direct
review correction.

## Prompt Suggestion Policy

Prompt suggestions are generated recommendations derived from one or more
learning signals or correction patterns.

P0 suggestion kinds:

- `ADD_RELATION_DIRECTION_EXAMPLE`
- `CLARIFY_CLASS_BOUNDARY`
- `CLARIFY_RELATION_TYPE_BOUNDARY`
- `ADD_EVIDENCE_REQUIREMENT`
- `ADD_NEGATIVE_EXAMPLE`
- `ADD_VALIDATION_FAILURE_GUIDANCE`
- `INVESTIGATE_LOW_METRIC_CLUSTER`

P0 suggestion states:

| State | Meaning | Allowed next states |
|---|---|---|
| `SUGGESTED` | Generated from current signals and awaiting human decision. | `ACCEPTED`, `DISMISSED`, `SUPERSEDED` |
| `ACCEPTED` | Human accepted the recommendation for future prompt drafting. | `SUPERSEDED` |
| `DISMISSED` | Human rejected or deferred the recommendation with a reason. | `SUPERSEDED` |
| `SUPERSEDED` | A newer signal or suggestion replaces this suggestion. | none |

Required suggestion content:

- suggestion id, project id, target prompt version id if known;
- suggestion kind and state;
- title, rationale, and plain-language expected impact;
- preview text or structured prompt-change proposal;
- source learning signal ids and correction pattern ids;
- supporting source artifact refs;
- confidence label: `LOW`, `MEDIUM`, or `HIGH`;
- risk label: `LOW`, `MEDIUM`, or `HIGH`;
- created at, updated at, and current decision audit note when decided.

Accept/dismiss rules:

- A human actor must make the decision.
- Request command values are `ACCEPT` and `DISMISS`.
- `ACCEPT` moves a `SUGGESTED` suggestion to resulting state `ACCEPTED` and
  records the intended next action, such as "use in next prompt draft"; it does
  not edit a prompt.
- `DISMISS` moves a `SUGGESTED` suggestion to resulting state `DISMISSED` and
  requires a reason code:
  - `NOT_RELEVANT`
  - `INSUFFICIENT_EVIDENCE`
  - `DUPLICATE`
  - `OUT_OF_SCOPE`
  - `RISK_TOO_HIGH`
  - `OTHER`
- `SUPERSEDED` is a read-side suggestion state in MVP6.2 P0. It is not a human
  decision command.
- A decision command against `ACCEPTED`, `DISMISSED`, or `SUPERSEDED` returns a
  conflict by default unless a later PM freeze explicitly adds idempotency
  behavior.
- Decision events are audit records. They must include actor id/role, decision,
  reason code, note, timestamp, suggestion snapshot, and source signal ids.
- A decision cannot mutate candidate graph, published graph, prompt versions,
  auto-approval policies, extraction jobs, evaluation runs, or model runs.

The learning summary contract must use these field names:

```text
generated_at
source_artifact_scope
signal_counts
open_prompt_suggestion_count
accepted_prompt_suggestion_count
dismissed_prompt_suggestion_count
superseded_prompt_suggestion_count
high_risk_prompt_suggestion_count
auto_approval_preview_count
```

## Auto-Approval Candidate Safety Boundary

Auto-approval candidates in MVP6.2 P0 are preview-only recommendations. They
exist to show where an approval rule might be safe after later governance and
QA, not to enable the rule.

Allowed P0 behavior:

- show a candidate rule preview;
- show supporting metrics, correction patterns, and evidence quality;
- show what the rule would have matched in historical artifacts;
- show why the rule is not yet enforced;
- link to source signals and examples.

Forbidden P0 behavior:

- create, update, enable, or enforce an auto-approval policy;
- approve, reject, or publish a candidate;
- mutate candidate graph or published graph state;
- bypass expert review;
- automatically change prompt, ontology, extraction, review, or publish
  behavior;
- present a preview as production-safe without human governance.

Auto-approval preview copy must make the safety boundary visible in the UI and
API examples: "recommendation only", "not enforced", and "requires later policy
approval" are required semantics.

Auto-approval preview field naming is frozen around `id`,
`historical_match_preview`, `source_artifacts`, `supporting_metrics`, and
`safety_note`. Evidence quality is represented through source artifacts,
supporting metrics, historical match context, and the safety note. Do not add a
separate `evidence_quality_summary` field in P0 unless PM explicitly freezes it
later.

## Contract-First Expectations

Backend should draft additive planning-only API/DTO documents after this brief.
The contract should be read-mostly and project-scoped. The only write-like
operation in P0 is suggestion decision capture, and that operation writes an
audit decision record only.

Recommended endpoint families for the Backend contract draft:

```text
GET  /api/v1/projects/{project_id}/learning-signals/summary
GET  /api/v1/projects/{project_id}/learning-signals/correction-patterns
GET  /api/v1/projects/{project_id}/learning-signals/prompt-suggestions
GET  /api/v1/projects/{project_id}/learning-signals/auto-approval-candidates
POST /api/v1/learning-signal-suggestions/{suggestion_id}/decisions
```

Frontend should draft IA and state requirements only in Wave30. Learning
Insights should be a project-scoped workflow area, with detail navigation
inside the workflow rather than ID-bound pages in the global LNB.

QA should create a separate MVP6.2 checklist that verifies scope alignment,
taxonomy consistency, decision audit behavior, preview-only auto-approval, and
absence of runtime implementation leakage.

## P0 Acceptance

MVP6.2 P0 contract is acceptable when:

- the demo flow is supported by PM, Backend, Frontend, and QA planning docs;
- all P0 signal types map to approved source artifacts;
- prompt suggestion states and decision reason rules are consistent across docs;
- request command values `ACCEPT` and `DISMISS` are not confused with resulting
  states `ACCEPTED` and `DISMISSED`;
- learning summary, source artifact, and auto-approval preview field names use
  the Wave31 frozen names;
- accept/dismiss creates an audit note and no other mutation;
- auto-approval candidates are preview/recommendation only;
- fine-tuning execution, live retraining, automatic enforcement, autonomous
  publish, governance, impact simulation, copilot/agent runtime, connectors,
  tenants, ontology packs, and advanced visualization remain out of P0.
