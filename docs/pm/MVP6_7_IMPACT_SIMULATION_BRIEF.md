# MVP 6.7 — Impact Simulation (read-only impact analysis of a governance change request) — PM Freeze

Status: `FROZEN / WAVE 45 PM DECISION (CONTRACT-FIRST) + WAVE 46 PM G1-G3 IMPLEMENTATION FREEZE (§9)`
Date: 2026-07-03 (Wave46 §9 freeze; original Wave45 body 2026-07-02)
Backlog: `PM6-027` (P0 freeze) + `PM6-028` (Wave46 G1-G3 implementation freeze, §9)

Wave45 is contract-first planning only. No runtime API route, FastAPI service,
DB model, Alembic migration, frontend route/component, seed, smoke, or test is
added this wave. Runtime implementation waits for a Wave46 thin-implementation
order after Backend contract draft + Frontend field/state/IA review + QA
executable checklist are all ready. Mirrors Wave14/19/23/30/33/39/41/43.

This slice is the **deferred impact-simulation theme** (ADR 0013 "Out of scope",
roadmap §7 Theme 4). It is the **return to read-only** after the single MVP6.6
mutation surface (apply): it mutates NOTHING and asserts an all-false guard. Keep
this brief thin; **ADR 0014 is the authority**.

---

## 1. Theme Choice + Rationale

**Chosen P0: a read-only impact report for an existing governance change
request.** Before a human commits the MVP6.6 apply (or the later MVP3 publish),
they run an impact simulation on a change request and read what it would touch —
affected ontology elements + bounded transitive dependents, dependent candidate
entities/relations, dependent published elements, affected MVP3 validations /
MVP4 quality checks, and a deterministic severity rollup — then decide.

Why this and only this:
- **Input reuses MVP6.6.** The P0 input is an **existing change-request id**
  (reuse the MVP6.5/6.6 `OntologyChangeRequest` + items). A hypothetical free-form
  change set (target_kind × change_type + element ref, not tied to a stored
  request) is **P1** — it adds an input surface without adding product value for
  the P0 demo, so it stays out.
- **Advisory only.** The report informs the human before the separate MVP6.6
  apply / MVP3 publish steps. It never applies, publishes, enforces, or gates —
  those paths keep their own MVP6.6/MVP3 guards.
- **Read-only, deterministic, bounded.** No mutation of anything; a deterministic
  severity from counted dimensions; bounded traversal depth + ref caps so it is
  cheap and byte-stable. No real LLM.

This preserves candidate/published separation (the report only reads both) and
returns the platform to the all-false mutation-guard posture after MVP6.6.

---

## 2. P0 Demo Flow (frozen)

```text
select project
-> open Governance -> open a change request (any lifecycle state; typically
     APPROVED + application_state = QUEUED, i.e. about to be applied)
-> open the contextual "영향도(Impact)" panel and run impact simulation (read-only)
-> read the impact report:
     * affected ontology elements: direct target(s) of each change item + bounded
       transitive dependents (max depth 2)
     * dependent candidate entities/relations: exact count + capped ref list
     * dependent published elements: exact count + capped ref list
     * affected validations / quality checks: MVP3 ValidationRuleCode(s) + MVP4
       QualityMetricGroup(s) whose scope intersects an affected element
     * severity rollup: per-item ImpactSeverity + report-level max + per-severity counts
-> see the "read-only analysis — no apply / no publish / no enforcement" banner
-> (the human then decides whether to proceed via the SEPARATE MVP6.6 apply /
     MVP3 publish paths; the report itself changes nothing)
```

The response carries an **all-false** `ImpactSimulationMutationGuard`. Running the
simulation never changes the change request's `status`/`application_state` and
never sets `SUPERSEDED` (staleness stays the MVP6.6 apply-time authority).

---

## 3. Frozen Decisions (authority: ADR 0014)

- **Input (P0):** an existing change-request id (reuse MVP6.5/6.6 shapes).
  Hypothetical free-form change set = **P1**.
- **Read-only / no mutation:** mutates NOTHING — ontology (draft/published),
  candidates, prompts, extraction, evaluation, governance state, published graph.
  Every response carries an **all-false** `ImpactSimulationMutationGuard`. Distinct
  from the MVP6.6 `GovernanceApplicationMutationGuard`; MVP6.7 turns **no** flag
  true, ever.
- **Advisory only:** decision-support before the separate MVP6.6 apply / MVP3
  publish steps. Never blocks/gates/pre-authorizes/auto-triggers; not an
  enforcement point. Severity is informational.
- **Impact dimensions (minimal-but-useful), per item + rolled up:**
  1. affected ontology elements = direct target(s) + bounded transitive dependents
  2. dependent candidate entities/relations = exact count + capped ref list
  3. dependent published elements = exact count + capped ref list
  4. affected MVP3 validations (`ValidationRuleCode`) + MVP4 quality
     (`QualityMetricGroup`) by reference
  5. severity/summary rollup
- **Severity taxonomy (`ImpactSeverity`, deterministic):**
  `NONE`/`LOW`/`MEDIUM`/`HIGH`/`BREAKING`, computed from counted dimensions:

  | severity | rule |
  |---|---|
  | `BREAKING` | `DEPRECATE`/`MODIFY` on an element with dependent **published** elements |
  | `HIGH` | `DEPRECATE`/`MODIFY` on an element with dependent **candidate** elements, or affected `FAILED` validations |
  | `MEDIUM` | transitive ontology dependents affected, or affected `WARNING` validations / affected quality groups |
  | `LOW` | only the direct element affected, no dependents |
  | `NONE` | `ADD` of a new element with no existing dependents |

  Report rollup = max item severity + per-severity counts. Byte-stable for a
  fixed change request + graph snapshot.
- **Bounding (deterministic + cheap):** max transitive dependent **depth = 2**
  (direct + one hop); max returned **refs per dimension** capped (Wave46 freeze:
  default `ref_cap = 20` per dimension; query override `1..200`) with
  `truncated=true` + exact `count` when hit (count is always exact; only the ref
  list is capped). No unbounded walk.
- **Consumption (reuse ADR 0010 IA):** a contextual "영향도(Impact)" panel/tab on
  the **Governance change-request detail** — **no new global LNB item**, no new
  Analyze-zone destination. D6 badges for `ImpactSeverity`; closed Section+Card
  design language.
- **Authorization:** read-only, so any project member who can view the change
  request can view its impact report (no elevated role, unlike MVP6.6 apply).
  Reuse MVP5 `Role` project read check; unauthorized → `403 PERMISSION_DENIED`.
  `404 CHANGE_REQUEST_NOT_FOUND` for a missing request.

---

## 4. Mutation Guard (frozen) — all-false, no sanctioned mutation surface

New `ImpactSimulationMutationGuard` on **every** impact response — every flag
false:

| flag | value | rationale |
|---|---|---|
| `ontology_draft_mutated` | false | analysis only; apply stays MVP6.6 |
| `published_graph_mutated` | false | never touches the published graph |
| `candidate_graph_mutated` | false | candidates read-only |
| `prompt_version_mutated` | false | prompts untouched |
| `governance_state_mutated` | false | never flips status/application_state; never SUPERSEDES |
| `publish_job_started` | false | no publish job |
| `extraction_job_started` | false | no extraction |
| `evaluation_run_started` | false | no evaluation |

QA asserts **zero** sanctioned mutation surface: any true flag — or any data-level
change to ontology/published/candidate/prompt/governance state after running a
simulation — is a defect. (Backend confirms the exact key set in the contract
draft; the invariant is "all false, always".)

---

## 5. Existing Artifacts This Touches (reuse by reference; no renames)

| Existing artifact | How MVP6.7 relates to it |
|---|---|
| MVP6.5/6.6 governance change request + items (`OntologyChangeRequest`/`OntologyChangeItem`, `ChangeRequestTargetKind`, `ChangeRequestChangeType`, `OntologyElementRef`, `GovernanceApplicationState`) | **Read-only input.** The simulation input is a change-request id; items drive the analysis. State is never mutated. |
| MVP1 ontology definition (classes/properties/relations on a version; `OntologyElementStatus`, `OntologyVersionStatus`) | **Read** to resolve affected elements + bounded transitive dependents. Never mutated. |
| Candidate graph (candidate entities/relations referencing ontology classes/relations) | **Read** to count + list dependent candidates. Never mutated. |
| MVP3 published graph (`PublishedGraphVersion`, published elements) | **Read** to count + list dependent published elements. Never mutated, never a publish job. |
| MVP3 validation (`ValidationRuleCode`, `ValidationResultSeverity` INFO/WARNING/FAILED) | **Read** to report affected validations by rule code; drives severity (`FAILED`→HIGH, `WARNING`→MEDIUM). |
| MVP4 quality (`QualityMetricGroup` incl. `VALIDATION`/`CONSISTENCY`/`COMPLETENESS`/`TRACEABILITY`) | **Read** to report affected quality groups by reference. |
| MVP5 `Role` | Standard project read check; no new role literal, apply-level elevation NOT required. |
| MVP6.3 comparison-record pattern (persist keyed by id, list + GET-by-id) | Precedent if Backend chooses to persist an `impact_report_id`; either way read-only + all-false guard. |

---

## 6. Explicit Exclusions (out of MVP6.7 P0)

- **Any mutation of any kind** — ontology draft/published, candidates, prompts,
  extraction, evaluation, governance state (never flips status/application_state,
  never SUPERSEDES). This is the ADR 0014 core.
- **Applying / publishing / enforcing / gating** on the report; auto-triggering
  the MVP6.6 apply or MVP3 publish. Advisory only.
- **Hypothetical free-form change set** input not tied to a stored change request
  (P1).
- **Unbounded / full transitive closure** beyond the depth cap.
- **Migration-plan / release-note** generation.
- **Automated remediation / auto-fix suggestions.**
- **Post-apply re-validation / re-extraction** job creation.
- **Cost / performance impact modelling; multi-request / cross-project impact.**
- Real LLM/provider execution; copilot/agent runtime; connector/plugin SDK;
  multi-tenant runtime.
- Durable DB/Alembic persistence is NOT required for the P0 thin slice; a
  deterministic process-local store (`reset_runtime_store()`, the MVP6.1–6.6
  pattern) is acceptable. Durable persistence stays P1/P2.

---

## 7. Durable Invariants Preserved

- **Read-only:** impact simulation mutates nothing; every response carries an
  all-false `ImpactSimulationMutationGuard`; the platform returns to the all-false
  posture after the single MVP6.6 apply surface. ✔
- Candidate and published graphs remain separated — the report only **reads** both;
  neither is mutated and no publish job is started. ✔
- Evidence / ontology-version / audit traceability preserved: the report references
  existing elements/refs by id and version context; it authors no new graph data. ✔
- Advisory, not a gate: no autonomous publish, no automatic enforcement, no
  auto-apply; the MVP6.6 apply / MVP3 publish paths keep their own guards. ✔
- Additive only — no MVP1–MVP6.6 path/enum/smoke is broken; new objects/enums are
  additive and reuse MVP1 ontology / candidate + MVP3 published graph / MVP3
  validation / MVP4 quality / MVP5 `Role` / MVP6.5–6.6 governance shapes by
  reference (no renames). ✔

---

## 8. Handoff Notes (what the next roles should produce)

- **Backend (`BE6-052`~`BE6-055`)**: draft additive endpoint(s) + DTO/enum names
  in `docs/api/MVP6_7_IMPACT_SIMULATION_API_CONTRACT_DRAFT.md` and an OpenAPI
  planning artifact `docs/api/openapi-mvp6-7-draft.json` (OpenAPI 3.1.0,
  additive/disjoint to MVP1–MVP6.6, version `0.6.7-draft`). Define: a read-only
  impact simulation for a change request (compute and/or read a persisted report,
  e.g. `POST/GET .../ontology-change-requests/{id}/impact-report`), plus, if
  persisted, list + GET-by-id (MVP6.3 pattern). Model the bounded dimension shapes
  (affected ontology elements incl. bounded transitive dependents; dependent
  candidate/published counts + capped `truncated` ref lists; affected
  `ValidationRuleCode`/`QualityMetricGroup` refs); the `ImpactSeverity` enum
  (`NONE`/`LOW`/`MEDIUM`/`HIGH`/`BREAKING`) + per-item + rollup; the **all-false**
  `ImpactSimulationMutationGuard` on **every** response; `403 PERMISSION_DENIED`,
  `404 CHANGE_REQUEST_NOT_FOUND`. Reuse MVP6.5/6.6 + MVP1 ontology + candidate +
  MVP3 published/validation + MVP4 quality + MVP5 `Role` shapes by `$ref` (no
  rename). Capture open questions (esp.: compute-on-demand vs persisted-report +
  `impact_report_id`; exact transitive-dependent traversal rules per target_kind;
  exact ref-cap value and per-dimension vs global cap; whether affected quality
  groups are computed live or referenced by group only).

- **Frontend (`FE6-073`~`FE6-076`)**: document, in
  `docs/pm/MVP6_7_FRONTEND_UX_REQUIREMENTS.md`, the contextual "영향도(Impact)"
  panel/tab on the Governance change-request detail (no new global LNB item per
  ADR 0010, no new Analyze destination); the report layout (affected ontology
  elements + transitive dependents; dependent candidate/published counts + capped
  lists with a "truncated / N total" affordance; affected validations/quality
  groups; the `ImpactSeverity` rollup with D6 badges); first-class
  loading/empty/error/permission states; and copy that makes clear this is
  **read-only analysis — no apply / no publish / no enforcement** (never reads as a
  gate or an apply). DTO gap analysis vs the Backend draft. No
  route/component/type/mock/smoke code.

---

## 9. Wave46 Implementation Freeze — G1/G2/G3 (authority for BE/FE/QA)

Status: `FROZEN / WAVE 46 PM (PM6-028)`. Scope unchanged (read-only, all-false
guard, 1 GET endpoint, 5 dimensions). These three gates were flagged open in the
Wave45 acceptance checklist; the contract draft already recommended each and the PM
now freezes them as single implementable rules. Grounded against the real reads:
`OntologyProperty.class_id` (property→class), `OntologyRelation.domain_class_id`/
`range_class_id` (relation→class), `CandidateEntity.class_id`/
`CandidateRelation.relation_id` (candidate→ontology),
`PublishedEntity.class_id`/`PublishedRelation.relation_id` (published→ontology),
`ValidationResultSeverity` INFO/WARNING/FAILED.

### G1 — dependency-graph source for the transitive walk (FROZEN)

The transitive walk reads the **MVP1 ontology definition tables** on the analyzed
ontology version and returns **BOTH candidate and published dependents, each
clearly labeled by layer** so severity can weight published dependents as BREAKING.
"Depends on" is the deterministic adjacency:

- **CLASS target** → dependents = its properties (`OntologyProperty.class_id ==
  target`), relations whose `domain_class_id` or `range_class_id == target`, and
  direct sub/superclasses; depth-2 = the classes reached through those depth-1
  relations. `DependencyRelation` = `PROPERTY_OF_CLASS` / `RELATION_DOMAIN` /
  `RELATION_RANGE` / `SUBCLASS_OF` / `SUPERCLASS_OF`.
- **PROPERTY target** → dependents = its owning class (`RELATED_ELEMENT`, depth 1)
  and, at depth 2, that class's other dependents. Candidate dependents = candidate
  entities of the owning class.
- **RELATION target** → dependents = its `domain_class_id` + `range_class_id`
  classes (`RELATION_DOMAIN`/`RELATION_RANGE`, depth 1) and their depth-2
  dependents.
- **Dimension 2 (candidate dependents)** = candidate rows whose ontology ref is an
  affected element: `CandidateEntity.class_id ∈ affected classes`,
  `CandidateRelation.relation_id ∈ affected relations` — labeled layer=CANDIDATE.
- **Dimension 3 (published dependents)** = `PublishedEntity.class_id` /
  `PublishedRelation.relation_id ∈ affected elements` — labeled layer=PUBLISHED.

Walk is depth-bounded (2) and deterministically ordered (by id) so it is
byte-stable.

### G2 — per-dimension ref-cap sizes (FROZEN)

A **single small cap of `ref_cap = 20` per capped ref dimension** (the
`dependent_candidates` and `dependent_published` `DependentRefBucket`s and any
capped affected-elements list), overridable via the `ref_cap` query param
(`1..200`, default `20`). Each capped bucket carries the **exact** `count` (never
capped) and `truncated = true` iff `count > len(refs)`. Aggregate summary totals
are summed from the exact per-item counts even when ref lists are truncated. This
lowers the Wave45 draft default (50→20); the `ref_cap` param bounds are unchanged.

### G3 — severity edge cases (FROZEN, deterministic; highest rule wins)

Per change item, evaluate top-down and stop at the first match (matches ADR 0014 §
Decision + contract draft `ImpactSeverity`; `ImpactSeverityReason` records the rule):

1. `DEPRECATE`/`MODIFY` on an element with **≥1 published dependent** →
   **`BREAKING`** (`DEPRECATE_MODIFY_WITH_PUBLISHED_DEPENDENTS`). Published wins
   even when candidate dependents also exist.
2. `DEPRECATE`/`MODIFY` on an element with **≥1 candidate dependent (and no
   published dependent)**, OR **≥1 affected `FAILED` validation** →
   **`HIGH`** (`DEPRECATE_MODIFY_WITH_CANDIDATE_DEPENDENTS` /
   `AFFECTED_FAILED_VALIDATION`).
3. **≥1 transitive ontology dependent** (depth ≥1, no candidate/published
   dependents), OR **≥1 affected `WARNING` validation**, OR **≥1 affected quality
   group** → **`MEDIUM`** (`TRANSITIVE_ONTOLOGY_DEPENDENTS` /
   `AFFECTED_WARNING_VALIDATION` / `AFFECTED_QUALITY_GROUP`).
4. Direct element only, **no dependents** → **`LOW`** (`DIRECT_ELEMENT_ONLY`).
5. `ADD` of a new element with **no existing dependents** → **`NONE`**
   (`ADD_NEW_ELEMENT_NO_DEPENDENTS`).

Edge cases: (a) both candidate+published dependents → BREAKING (rule 1). (b) `ADD`
that references an element with existing dependents → the referenced element counts
as a transitive dependent → MEDIUM (rule 3), not NONE. (c) target already
`ARCHIVED`/`DELETED` at read time → still reported (advisory); if it has 0
dependents → LOW/NONE by the rules above. (d) empty change request (0 items) →
`max_severity = NONE`, empty `items`. Report rollup = **max item severity** +
per-severity counts (`severity_counts` sum == `total_change_items`).

### Scope confirmation (unchanged)

Read-only; every response carries the **all-false** `ImpactSimulationMutationGuard`
(no flag ever true); **1 GET endpoint**
(`GET /api/v1/ontology-change-requests/{id}/impact-simulation`); **5 dimensions**;
advisory only (never applies/publishes/enforces/gates, never flips
`status`/`application_state`, never sets `SUPERSEDED`). No contract impact beyond
the `ref_cap` default 50→20 refinement (bounds unchanged, so `openapi-mvp6-7-draft.json`
`ref_cap` schema `default` moves 50→20 at Backend export; no shape/enum change).

---

- **QA (`INT6-059`~`INT6-062`)**: executable acceptance checklist in
  `docs/backlog/INT6_7_IMPACT_SIMULATION_ACCEPTANCE.md` (C planning gates + R
  NOT-RUNNABLE runtime gates), continuing INT6 numbering from `INT6-059` (INT6 used
  through `INT6-058`). Verify PM/BE/FE agree on the impact P0 (existing
  change-request input; hypothetical = P1), the five impact dimensions, the
  `ImpactSeverity` enum + deterministic rollup, the bounding (depth 2 + ref cap +
  exact count + `truncated`), the **read-only / no-mutation** boundary + all-false
  `ImpactSimulationMutationGuard`, the advisory-only (never-a-gate) boundary, the
  ADR 0010 consumption (no new LNB item), and exclusions. Confirm no runtime leaked
  (search `apps/`+`infra/`). OpenAPI parse/additivity. Recommend Wave46 thin
  implementation, hardening, or PM redesign.
