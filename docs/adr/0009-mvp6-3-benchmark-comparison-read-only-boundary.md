# ADR 0009: MVP6.3 Benchmark Comparison Read-Only Boundary

## Status

Accepted

## Context

MVP6.1 (Gold Set / Benchmark Studio) closed a deterministic evaluation surface:
`EvaluationRun` records carry model/provider, prompt version, ontology version,
parser version, dataset/dataset version, and run status; `EvaluationMetric`
records expose value/numerator/denominator/formula/status per
`EvaluationMetricName`; and `EvaluationErrorCase` records are typed by
`EvaluationErrorType` with class/relation/candidate/evidence context.
`EvaluationDimensions` already carries class/relation/source-type buckets.

The MVP6 roadmap (`04_...md` §4.1–4.4) lists "model/prompt/ontology comparison",
"relation-type matrix", "class classification accuracy", and "confusion matrix"
as Benchmark Studio capabilities. MVP6.1 explicitly deferred these to P1 in
`docs/pm/MVP6_PREP_BRIEF.md`.

MVP6.2 (Active Learning) established a durable pattern for analysis surfaces that
sit on top of closed data: read-mostly endpoints, audit-only writes, and an
all-false `mutation_guard` proving no prompt/candidate/published/policy/
extraction/evaluation mutation occurs.

The next MVP6 theme must be the smallest coherent step that keeps momentum
without weakening product invariants. Benchmark Comparison / Confusion Matrix is
that step: it is pure read-side aggregation over already-stored MVP6.1
artifacts, so it needs a durable boundary that prevents it from drifting into
run execution, gold-set authoring, or graph mutation.

## Decision

- MVP6.3 P0 is **Benchmark Comparison / Confusion Matrix** — a read-only
  aggregation surface over existing MVP6.1 evaluation artifacts, not a new run
  engine and not a gold-set authoring surface.
- P0 demo flow centers on:
  - selecting two or more existing successful evaluation runs in a project;
  - side-by-side per-metric comparison with explicit baseline and deltas;
  - per-class and per-relation-type confusion matrix and bucket accuracy;
  - drilldown from a confusion cell to its contributing `EvaluationErrorCase`s.
- P0 reads only MVP6.1 evaluation artifacts (`EvaluationRun`,
  `EvaluationMetric`, `EvaluationErrorCase`, `EvaluationCandidateRef`,
  `EvaluationDimensions` buckets). It does not join MVP3 review/correction,
  MVP4 quality, MVP6.2 learning signals, or published-graph data.
- No new `EvaluationMetricName` is introduced; the existing eight-metric set is
  reused verbatim. New enums are limited to comparison/confusion concerns:
  `BenchmarkComparisonGroupBy`, `ComparisonComparabilityFlag`,
  `ConfusionMatrixAxis`, and response-side metric delta status
  (`IMPROVED`/`REGRESSED`/`UNCHANGED`/`NOT_COMPARABLE`).
- Comparison must never present a silently misleading delta. Cross-dataset or
  cross-ontology-version comparisons are flagged via
  `ComparisonComparabilityFlag` rather than blocked, and missing/`NOT_APPLICABLE`
  metrics yield `NOT_COMPARABLE`, not a fabricated number. Baseline run and a
  fixed deterministic epsilon are explicit in the contract.
- Confusion-matrix cells are derived only from existing error cases plus implied
  matched pairs, use a reserved `__NONE__` display sentinel for absent
  gold/candidate, and report empty buckets as `NOT_APPLICABLE` rather than a
  fabricated 0%/100%.
- The endpoints are additive, read-only, and project-scoped. A
  `POST .../benchmark-comparisons` builder composes a comparison view from
  selected run ids; it is an analysis composition, not a mutation of evaluation
  data. If a comparison object is persisted, it is an analysis artifact carrying
  an all-false `mutation_guard` (`candidate_graph_mutated`,
  `published_graph_mutated`, `evaluation_run_started`, `gold_set_mutated`),
  mirroring the MVP6.2 audit-only pattern.
- Executing new evaluation runs from comparison, real LLM/provider execution,
  gold-set authoring, dataset revisioning writes, ontology constraint pass-rate
  and other new metrics, significance/time-trend/scheduled alerts, training
  export, cross-project/cross-org comparison, and all Theme-3+ surfaces are P1
  or later unless explicitly promoted by a later PM decision.

## Consequences

- Backend can draft additive read-only comparison/confusion-matrix endpoints and
  an OpenAPI planning artifact without touching evaluation execution, gold-set,
  or graph paths.
- Frontend can design a project-scoped Benchmark Comparison view (run selector,
  baseline picker, metric delta table, confusion matrix with cell drilldown,
  comparability-flag and not-comparable states) contextual to the Evaluation/
  Benchmark area, with no ID-bound pages in the global LNB.
- QA can build deterministic local acceptance over existing seeded runs:
  comparison happy path, delta/comparability/confusion-cell correctness, empty/
  not-comparable handling, the read-only/no-mutation guard, and MVP1–MVP6.2
  regression.
- The platform preserves candidate/published graph separation, evidence/version/
  model-run/parser traceability (echoed from existing runs and error cases), no
  autonomous publish, no automatic policy enforcement, and no real LLM execution
  in this P0 thin slice. The change is additive and does not alter MVP1–MVP6.2
  paths or smokes.
