# ADR 0014: MVP6.7 Impact Simulation — Read-Only, No-Mutation, Advisory-Only, Deterministic-Bounded Analysis Boundary

## Status

Accepted

## Context

MVP6.5 (ADR 0012) shipped the auditable ontology change-request lifecycle
(propose → review → approve/reject → audit; approval = intent + `QUEUED`, nothing
applied). MVP6.6 (ADR 0013) shipped the first — and only — sanctioned mutation:
a human explicitly applies an `APPROVED`+`QUEUED` change request onto a **DRAFT**
ontology version (`ontology_draft_mutated=true`, everything else false), with a
staleness→`SUPERSEDED` guard and an all-or-nothing rule. MVP6.6 deliberately
**deferred impact simulation** (ADR 0013 "Out of scope"; roadmap §7 Theme 4).

MVP6.7 is that deferred theme, kept to its smallest coherent form. The product
need is concrete: before a human commits the MVP6.6 apply (or the later MVP3
publish), they want to see **what a change request would touch** — which ontology
elements, which dependent candidate/published elements, which MVP3 validations /
MVP4 quality checks — and a severity rollup — so they decide with eyes open.

Critically, MVP6.7 is **the return to read-only** after the single MVP6.6
mutation. Every MVP6 theme except 6.6 asserted an all-false mutation guard;
MVP6.7 must too. Impact simulation informs the human; it never applies,
publishes, enforces, or gates anything. Because it sits right next to the one
mutating operation on the platform (apply) and reads across the candidate graph,
the published graph, and quality/validation surfaces, the read-only boundary must
be crisp and inspectable, or it risks being mistaken for a second write path or a
policy gate. This ADR fixes that boundary.

The surfaces it reads already exist and are reused **by reference, no renames**:
- MVP6.5/6.6 governance change requests + items
  (`OntologyChangeRequest`/`OntologyChangeItem`, `ChangeRequestTargetKind`
  CLASS/PROPERTY/RELATION, `ChangeRequestChangeType` ADD/MODIFY/DEPRECATE,
  `OntologyElementRef`, `GovernanceApplicationState`).
- MVP1 ontology definition (classes/properties/relations on a version,
  `OntologyElementStatus`, `OntologyVersionStatus`); the candidate graph
  (candidate entities/relations referencing ontology classes/relations); the
  MVP3 published graph (`PublishedGraphVersion`, published elements).
- MVP3 validation (`ValidationRuleCode`, `ValidationResultSeverity`
  INFO/WARNING/FAILED) and MVP4 quality (`QualityMetricGroup` incl. `VALIDATION`).
- MVP5 `Role` for read authorization; MVP3/MVP5/MVP6 audit shapes if a report is
  persisted for retrieval.

## Decision

- **MVP6.7 P0 is a read-only impact report for an existing governance change
  request.** Given a change-request id whose lifecycle already exists
  (`APPROVED`/`QUEUED`, or any lifecycle state — the analysis is advisory and does
  not require APPROVED), a human runs an **impact simulation** and reads a report
  covering: (1) directly affected ontology elements + bounded transitive
  dependents; (2) dependent candidate entities/relations (count + bounded refs);
  (3) dependent published elements (count + bounded refs); (4) affected MVP3
  validations / MVP4 quality checks; (5) a deterministic severity/summary rollup.
  A **hypothetical change set** input (target_kind × change_type + element ref,
  not tied to a stored request) is **P1** — the P0 input is the existing
  change-request id only, to keep the slice minimal and reuse MVP6.6 shapes.

- **READ-ONLY / NO-MUTATION — the load-bearing rule.** Impact simulation is pure
  analysis. It mutates **NOTHING**: not the ontology (draft or published), not
  candidates, not prompts, not extraction, not evaluation, not governance state
  (it never flips a change request's `status` or `application_state`), not the
  published graph. It does **not** apply, publish, enforce, gate, re-validate, or
  re-extract. Every impact response carries an **all-false**
  `ImpactSimulationMutationGuard` — every flag false, no exceptions. This is the
  ADR 0014 core and the mirror of the MVP6.1–6.5 / benchmark / read-side
  all-false pattern. It is explicitly distinct from the MVP6.6
  `GovernanceApplicationMutationGuard` (which turns `ontology_draft_mutated` true
  on apply): MVP6.7 turns **no** flag true, ever.

- **ADVISORY-ONLY — never a gate.** The report is decision-support a human reads
  **before** the separate MVP6.6 apply / MVP3 publish steps. It does **not**
  block, pre-authorize, or auto-trigger apply/publish, and it is **not** a policy
  enforcement point. A "BREAKING"/"HIGH" severity is informational — it never
  prevents the human from proceeding through the existing apply/publish paths, and
  those paths keep their own MVP6.6/MVP3 guards (apply is still the authoritative
  staleness/idempotency check). Impact simulation and MVP6.6 staleness detection
  are independent: the report may hint, but it never sets `SUPERSEDED`.

- **Impact dimensions (frozen, minimal-but-useful).** For each change item and
  rolled up per report:
  1. **Affected ontology elements** — the direct target element(s) of each change
     item, plus **bounded transitive dependents** within the ontology definition
     (e.g. properties of an affected class; relations whose domain/range is an
     affected class; child/related elements). Bounded by max traversal depth.
  2. **Dependent candidate entities/relations** — candidate graph rows whose
     ontology class/relation ref is an affected element: a **count** plus a bounded
     list of `OntologyElementRef`-style refs (capped).
  3. **Dependent published elements** — published-graph elements referencing an
     affected element: a **count** plus a bounded list of refs (capped). Reading
     the published graph is read-only; it is never mutated.
  4. **Affected validations / quality checks** — MVP3 `ValidationRuleCode`s and
     MVP4 `QualityMetricGroup`s (esp. `VALIDATION`/`CONSISTENCY`/`COMPLETENESS`/
     `TRACEABILITY`) whose scope intersects an affected element, reported by
     reference (rule code / metric group), advisory.
  5. **Severity / summary rollup** — per-item severity and a report-level rollup
     (see below).

- **Severity taxonomy (frozen, deterministic).** A new
  `ImpactSeverity` = `NONE` / `LOW` / `MEDIUM` / `HIGH` / `BREAKING`, computed by a
  **deterministic** rule from the counted dimensions (no LLM, no randomness):
  - `BREAKING`: a `DEPRECATE`/`MODIFY` on an element with dependent **published**
    elements, or that would violate a published-graph reference.
  - `HIGH`: a `DEPRECATE`/`MODIFY` on an element with dependent **candidate**
    elements or affected `FAILED`-severity validations.
  - `MEDIUM`: transitive ontology dependents affected, or affected
    `WARNING`-severity validations / affected quality groups.
  - `LOW`: only the direct element affected, no dependents.
  - `NONE`: `ADD` of a new element with no existing dependents.

  The **report rollup** = the max item severity, plus per-severity counts. Given
  the same change request against the same graph snapshot, the report is
  byte-stable (deterministic ordering, deterministic severity).

- **Bounding (frozen, deterministic + cheap).** The analysis is bounded so it is
  deterministic and cheap: a **max transitive dependent depth** (P0 = `2` — direct
  element + one hop of ontology dependents), and a **max returned refs per
  dimension** (P0 cap, e.g. `50`) with a `truncated=true` flag + total `count`
  when the cap is hit (the count is always exact; only the ref list is capped).
  No unbounded graph walk; no full-graph scan without a cap.

- **Consumed as a contextual "impact" panel (frozen; reuse ADR 0010 IA).** The
  report appears **contextually on the Governance change-request detail** as an
  "영향도(Impact)" panel/tab — **no new global LNB item** (ADR 0010: LNB shows
  stable top-level work areas only; ID-bound analysis is reached through its
  parent screen). It reuses the D6 status-token badge guide for `ImpactSeverity`
  and the closed Section+Card design language. It does **not** introduce a new
  Analyze-zone destination.

- **Authorization (frozen).** Read-only, so any project member who can view the
  change request can view its impact report; no elevated role is required (unlike
  the MVP6.6 apply). Reuse MVP5 `Role` for the standard project read check;
  unauthorized project access → `403 PERMISSION_DENIED`. No new role literal.

- **Persist-vs-compute (deferred to Backend/Wave46).** Whether an impact report is
  computed on demand or persisted (keyed by an `impact_report_id`, mirroring the
  MVP6.3 comparison-record pattern for list + GET-by-id) is a Backend contract
  decision; either way it is read-only and carries the all-false guard. Durable
  DB/Alembic persistence is **not** required for the P0 thin slice; the proven
  deterministic process-local store (`reset_runtime_store()`, MVP6.1–6.6 pattern)
  is acceptable. Durable persistence stays P1/P2.

- **Out of scope (P1 or later unless explicitly promoted):** any mutation of any
  kind (ontology draft/published, candidates, prompts, extraction, evaluation,
  governance state); applying, publishing, enforcing, or gating on the report;
  auto-triggering apply/publish; hypothetical free-form change sets not tied to a
  stored change request (P1); unbounded/full transitive closure beyond the depth
  cap; migration-plan / release-note generation; automated remediation / auto-fix
  suggestions; re-validation / re-extraction job creation; cost/performance impact
  modelling; multi-request / cross-project impact; real LLM execution;
  copilot/agent runtime; connector/plugin SDK; multi-tenant runtime.

## Consequences

- Backend can draft additive endpoint(s) — a read-only impact simulation for a
  change request (compute and/or read a persisted report) plus, if persisted, a
  list/GET-by-id — reusing MVP6.5/6.6 governance shapes, MVP1 ontology definition,
  candidate + MVP3 published graph reads, MVP3 validation + MVP4 quality reads, and
  MVP5 `Role` **by reference (no renames)**, without importing any write path. It
  models the all-false `ImpactSimulationMutationGuard`, the `ImpactSeverity` enum,
  the bounded dimension shapes (count + capped `truncated` refs), and
  `403 PERMISSION_DENIED` / `404 CHANGE_REQUEST_NOT_FOUND`.
- Frontend can add a contextual "영향도(Impact)" panel to the existing Governance
  change-request detail (no new global LNB item, ADR 0010), with the impact
  dimensions, D6 severity badges, first-class loading/empty/error/permission
  states, and copy that makes clear this is **read-only analysis** — no
  apply/publish/enforcement.
- QA can build deterministic local acceptance: the report is byte-stable for a
  fixed change request + graph snapshot; every dimension is bounded by the depth +
  ref caps with exact counts; the `ImpactSimulationMutationGuard` is all-false and
  the ontology draft/published/candidate/prompt/governance state is provably
  unchanged at the data level after running a simulation; severity is the
  deterministic rollup; authz `403`; and MVP1–MVP6.6 regression.
- The platform preserves candidate/published separation (the report only reads
  both), evidence/version/audit traceability, no autonomous publish, no automatic
  enforcement, no auto-apply, and no real LLM. The change is additive and does not
  alter MVP1–MVP6.6 paths, enums, or smokes. MVP6.7 returns the platform to the
  all-false mutation-guard posture after the single sanctioned MVP6.6 apply
  surface; it turns **no** mutation flag true.
