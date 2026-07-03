# MVP 6.7 — Impact Simulation (read-only impact analysis of a governance change request) API Contract Draft

Status: `WAVE 45 CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-02
Backlog: `BE6-052`~`BE6-055` (theme `PM6-027`; Frontend `FE6-073`~`FE6-076`; QA `INT6-059`~`INT6-062`)

This draft defines the additive contract for the **deferred impact-simulation theme**
(ADR 0013 "Out of scope", roadmap §7 Theme 4), frozen by
`docs/pm/MVP6_7_IMPACT_SIMULATION_BRIEF.md` and durably by
`docs/adr/0014-mvp6-7-impact-simulation-read-only-analysis-boundary.md`.

MVP6.7 is the **return to read-only** after the single MVP6.6 apply mutation. Given
an existing governance change-request id (any lifecycle state), a human runs a
**read-only impact simulation** and reads a deterministic, bounded report of what the
change request *would* touch — then decides whether to proceed through the **separate**
MVP6.6 apply / MVP3 publish paths. The report **mutates NOTHING** and carries an
**all-false** `ImpactSimulationMutationGuard` on **every** response.

Canonical machine-readable planning artifact:
`docs/api/openapi-mvp6-7-draft.json` (OpenAPI 3.1.0, `info.version` `0.6.7-draft`).

Wave45 is contract-first planning only. This draft does **not** implement FastAPI
routes, runtime services, database models, migrations, seed data, workers, or tests.
Runtime implementation waits for a Wave46 thin-implementation order after Frontend
field/state/IA review (`FE6-073`~`FE6-076`) and a QA executable checklist
(`INT6-059`~`INT6-062`) are ready.

Where the PM brief / ADR 0014 and this draft differ on a name, the PM brief + ADR
win; this draft only refines field names the PM brief explicitly delegated to Backend.

## Contract Principles

- MVP6.7 is **additive and disjoint**. Existing MVP1–MVP6.6 paths, schemas, and enums
  are not renamed, moved, or removed. The one new path hangs off the MVP6.5/6.6
  change-request resource as `.../impact-simulation`.
- **Read-only / no mutation — the load-bearing rule.** The simulation mutates
  **NOTHING**: not the ontology (draft or published), candidates, prompts, extraction,
  evaluation, or governance state. It never flips `status`/`application_state` and
  never sets `SUPERSEDED` (staleness stays the MVP6.6 apply-time authority). Every
  response carries an **all-false** `ImpactSimulationMutationGuard` — every flag false,
  no exceptions. Distinct from the MVP6.6 `GovernanceApplicationMutationGuard`; MVP6.7
  turns **no** flag true, ever.
- **Advisory-only — never a gate.** The report is decision-support a human reads
  **before** the separate MVP6.6 apply / MVP3 publish steps. It never blocks,
  pre-authorizes, auto-triggers, enforces, re-validates, or re-extracts. A
  `BREAKING`/`HIGH` severity is informational.
- **Deterministic + bounded.** No LLM, no randomness. Max transitive dependent
  **depth = 2** (direct target + one hop); a per-dimension returned-refs **cap**
  (default `50`, max `200`) with `truncated=true` when hit. The dimension **count is
  always exact**; only the ref list is capped. Byte-stable for a fixed change request
  + graph snapshot.
- **No reuse-by-rename.** MVP6.5/6.6 governance shapes (`OntologyElementRef`,
  `ChangeRequestChangeType`, `ChangeRequestTargetKind`), MVP1
  `OntologyElementStatus`/`OntologyVersionStatus`, MVP3
  `ValidationRuleCode`/`ValidationResultSeverity`, MVP4 `QualityMetricGroup`, and MVP5
  `Role` are reused **verbatim / by reference**. New MVP6.7 enum/DTO names are additive
  and must not collide with MVP1–MVP6.6 names.
- DTO/schema names use PascalCase. JSON fields use snake_case. Enum literals use
  UPPER_SNAKE_CASE.

## Preserved MVP1–MVP6.6 Boundary

- The report only **reads** the ontology definition, candidate graph, published graph,
  MVP3 validation, and MVP4 quality surfaces. Candidate/published separation intact;
  the published graph is never mutated and no publish job is started.
- Governance state is never touched: running a simulation never changes the change
  request's `status`/`application_state` and never sets `SUPERSEDED`.
- Evidence / ontology-version / audit traceability preserved: the report references
  existing elements/refs by id + version context; it authors no new graph data.
- Durable DB/Alembic persistence is **not required** for the P0 thin slice; the proven
  deterministic process-local store (`reset_runtime_store()`, MVP6.1–6.6 pattern) is
  acceptable. Durable persistence remains P1/P2.

## Reused Artifacts (verbatim, not redefined)

Referenced **by reference; no renames**. Mirrored into the OpenAPI artifact only so it
is standalone.

| Reused artifact | Role in MVP6.7 |
|---|---|
| MVP6.5/6.6 `OntologyChangeRequest` / `OntologyChangeItem` (id, refs, `ontology_version_id`) | **Read-only input.** The change-request id + its items drive the analysis. State never mutated. |
| MVP6.5/6.6 `OntologyElementRef`, `ChangeRequestChangeType` (`ADD`/`MODIFY`/`DEPRECATE`), `ChangeRequestTargetKind` (`CLASS`/`PROPERTY`/`RELATION`) | Element refs + the change type/kind that drive per-item severity. Verbatim. |
| MVP1 `OntologyElementStatus`, `OntologyVersionStatus`, ontology definition (classes/properties/relations on a version) | **Read** to resolve affected elements + bounded transitive dependents. Never mutated. |
| Candidate graph (candidate entities/relations referencing ontology classes/relations) | **Read** to count + list dependent candidates. Never mutated. |
| MVP3 published graph (`PublishedGraphVersion`, published elements) | **Read** to count + list dependent published elements. Never mutated, never a publish job. |
| MVP3 `ValidationRuleCode`, `ValidationResultSeverity` (`INFO`/`WARNING`/`FAILED`) | **Read** to report affected validations by rule code; drives severity (`FAILED`→HIGH, `WARNING`→MEDIUM). |
| MVP4 `QualityMetricGroup` (`COMPLETENESS`/`CONSISTENCY`/`TRACEABILITY`/`VALIDATION`/`REVIEW`/`DUPLICATE`/`RELATION_DENSITY`) | **Read** to report affected quality groups by reference. Never recomputed. |
| MVP5 `Role` | Standard project-read check; no new role literal, no apply-level elevation. |
| MVP6.3 comparison-record pattern (persist keyed by id, list + GET-by-id) | Precedent if Backend later chooses to persist an `impact_report_id`; either way read-only + all-false guard. |

## New Enums (MVP6.7 only)

### `ImpactSeverity` (deterministic per-item / report-rollup severity)

`NONE` / `LOW` / `MEDIUM` / `HIGH` / `BREAKING`, computed from the counted dimensions
(no LLM, no randomness). **Highest matching rule wins:**

| severity | rule |
|---|---|
| `BREAKING` | `DEPRECATE`/`MODIFY` on an element with dependent **published** elements (or that would violate a published-graph reference) |
| `HIGH` | `DEPRECATE`/`MODIFY` on an element with dependent **candidate** elements, or an affected `FAILED`-severity validation |
| `MEDIUM` | transitive ontology dependents affected, or affected `WARNING`-severity validations / affected quality groups |
| `LOW` | only the direct element affected, no dependents |
| `NONE` | `ADD` of a new element with no existing dependents |

Report rollup = **max item severity** + per-severity counts. Byte-stable for a fixed
change request + graph snapshot. Order (low→high): `NONE < LOW < MEDIUM < HIGH < BREAKING`.

### `ImpactSeverityReason` (machine reason code — display/audit aid)

Deterministic reason explaining which rule set an item's severity:
`DEPRECATE_MODIFY_WITH_PUBLISHED_DEPENDENTS` / `DEPRECATE_MODIFY_WITH_CANDIDATE_DEPENDENTS`
/ `AFFECTED_FAILED_VALIDATION` / `TRANSITIVE_ONTOLOGY_DEPENDENTS` /
`AFFECTED_WARNING_VALIDATION` / `AFFECTED_QUALITY_GROUP` / `DIRECT_ELEMENT_ONLY` /
`ADD_NEW_ELEMENT_NO_DEPENDENTS`. The `ImpactSeverity` enum is the authority; this only
explains it.

### `DependencyRelation` (how a transitive dependent relates to the direct target)

`DIRECT_TARGET` (depth 0) / `PROPERTY_OF_CLASS` / `RELATION_DOMAIN` / `RELATION_RANGE`
/ `SUBCLASS_OF` / `SUPERCLASS_OF` / `RELATED_ELEMENT`. Additive; does not rename any
MVP1 ontology edge concept.

## Mutation Guard — all-false, no sanctioned mutation surface

`ImpactSimulationMutationGuard` on **every** impact response — every flag false:

```json
{
  "ontology_draft_mutated": false,
  "published_graph_mutated": false,
  "candidate_graph_mutated": false,
  "prompt_version_mutated": false,
  "governance_state_mutated": false,
  "publish_job_started": false,
  "extraction_job_started": false,
  "evaluation_run_started": false
}
```

Each flag is `const: false` in the OpenAPI schema. QA asserts **zero** sanctioned
mutation surface: any true flag — or any data-level change to
ontology/published/candidate/prompt/governance state after running a simulation — is a
defect. This mirrors the MVP6.1–6.5 / benchmark all-false read-side pattern and is
explicitly distinct from the MVP6.6 `GovernanceApplicationMutationGuard`
(`ontology_draft_mutated=true` on apply).

## Authorization Model (RBAC — reuse shipped `Role`, no new literal)

- **Read** (the impact simulation): **any project member** who can view the change
  request (incl. `VIEWER`). No elevated role, unlike the MVP6.6 apply.
- Unauthorized project access → `403 PERMISSION_DENIED`, mutates nothing.
- Missing request → `404 CHANGE_REQUEST_NOT_FOUND`.
- The `ImpactSimulationCapabilities` hint (`can_view`, `can_apply`, `actor_role`) is
  **display-only**: `can_apply` is an advisory echo of the SEPARATE MVP6.6 apply
  capability so the FE can decide whether to surface the apply CTA next to the report;
  MVP6.7 never grants or gates apply.

## Additive Endpoint Family

All additive, disjoint from MVP1–MVP6.6, on the MVP6.5/6.6 change-request resource.

### Impact simulation (read-only, idempotent)

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-052 | `GET` | `/api/v1/ontology-change-requests/{change_request_id}/impact-simulation` | Compute + return the deterministic read-only impact report for the change request. Idempotent; all-false guard. |

**Why GET (not POST-run + GET-read):** the analysis mutates nothing and is
deterministic + byte-stable for a fixed change request + graph snapshot, so a single
idempotent `GET` is the honest verb (a POST would imply a side effect). Persistence is
**not required** for P0; if Backend later persists reports (MVP6.3 pattern), the
response carries an optional `impact_report_id` and a list + GET-by-id family may be
added additively in Wave46 without changing this GET's semantics. **Open Q1.**

### Query parameters

| Query | Type | Notes |
|---|---|---|
| `target_ontology_version_id` | string \| null | Optional explicit ontology version to read the analysis against (read-only snapshot pin). Omit → change request's own `ontology_version_id` / project current DRAFT. |
| `ref_cap` | integer (default `50`, min `1`, max `200`) | Per-dimension returned-refs cap. The dimension `count` is **always exact**; only the ref list is capped, with `truncated=true` when hit. |

## DTO Contract

### ImpactSimulationReport (200 — GET .../impact-simulation)

```json
{
  "impact_report_id": null,
  "change_request_id": "ocr-20260701-0001",
  "project_id": "project-insurance-demo",
  "change_request_status": "APPROVED",
  "analyzed_ontology_version_id": "ontology-v8-draft",
  "analyzed_ontology_version_status": "DRAFT",
  "items": [ { "...": "ImpactItem" } ],
  "summary": { "...": "ImpactSummary" },
  "bounding": { "max_dependent_depth": 2, "ref_cap": 50, "any_dimension_truncated": false },
  "capabilities": { "can_view": true, "can_apply": true, "actor_role": "ONTOLOGY_MANAGER" },
  "mutation_guard": {
    "ontology_draft_mutated": false,
    "published_graph_mutated": false,
    "candidate_graph_mutated": false,
    "prompt_version_mutated": false,
    "governance_state_mutated": false,
    "publish_job_started": false,
    "extraction_job_started": false,
    "evaluation_run_started": false
  },
  "computed_at": "2026-07-02T10:00:00Z"
}
```

`impact_report_id` is present only if reports are persisted (else null/omitted).
`change_request_status` is an advisory read-only echo. `mutation_guard` is **all-false**.

### ImpactItem (per change item)

```json
{
  "change_item_id": "ocitem-0002",
  "target_kind": "RELATION",
  "change_type": "DEPRECATE",
  "target_ref": {
    "target_kind": "RELATION",
    "ontology_relation_id": "rel:accident_type",
    "ontology_version_id": "ontology-v8-draft",
    "status": "ACTIVE"
  },
  "affected_ontology_elements": [
    {
      "element_ref": { "target_kind": "RELATION", "ontology_relation_id": "rel:accident_type", "ontology_version_id": "ontology-v8-draft", "status": "ACTIVE" },
      "relation_to_target": "DIRECT_TARGET",
      "depth": 0,
      "display_name": "사고 유형"
    },
    {
      "element_ref": { "target_kind": "CLASS", "ontology_class_id": "cls:accident", "ontology_version_id": "ontology-v8-draft", "status": "ACTIVE" },
      "relation_to_target": "RELATION_DOMAIN",
      "depth": 1,
      "display_name": "사고"
    }
  ],
  "dependent_candidates": { "count": 128, "refs": [ { "...": "OntologyElementRef (capped)" } ], "truncated": true },
  "dependent_published": { "count": 4, "refs": [ { "...": "OntologyElementRef" } ], "truncated": false },
  "affected_validations": [ { "rule_code": "RELATION_DOMAIN_RANGE", "severity": "FAILED" } ],
  "affected_quality_groups": ["CONSISTENCY", "TRACEABILITY"],
  "severity": "BREAKING",
  "severity_reason": "DEPRECATE_MODIFY_WITH_PUBLISHED_DEPENDENTS"
}
```

- **Dimension 1** (`affected_ontology_elements`): direct target (`depth 0`) + bounded
  transitive dependents (`depth 1–2`), each with `relation_to_target`.
- **Dimension 2/3** (`dependent_candidates` / `dependent_published`):
  `DependentRefBucket` = **exact** `count` + capped `refs` + `truncated`.
- **Dimension 4** (`affected_validations` = `AffectedValidationRef[]` by rule code +
  max severity; `affected_quality_groups` = `QualityMetricGroup[]` by reference).
- **Severity**: item-level `ImpactSeverity` + `ImpactSeverityReason` (deterministic).

### DependentRefBucket

```json
{ "count": 128, "refs": [ { "...": "OntologyElementRef" } ], "truncated": true }
```

`count` is the **exact** total (never capped). `refs` holds at most `ref_cap` items.
`truncated` is `true` iff `count > len(refs)`. Candidate rows / published elements are
grouped by the affected ontology element they reference.

### ImpactSummary (dimension 5 — report rollup)

```json
{
  "max_severity": "BREAKING",
  "severity_counts": { "NONE": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 0, "BREAKING": 1 },
  "total_change_items": 4,
  "total_affected_ontology_elements": 9,
  "total_dependent_candidates": 173,
  "total_dependent_published": 4,
  "affected_validation_rule_codes": ["RELATION_DOMAIN_RANGE", "REQUIRED_PROPERTY"],
  "affected_quality_groups": ["CONSISTENCY", "TRACEABILITY"]
}
```

`max_severity` = highest `ImpactSeverity` across items (`NONE` if no items).
`severity_counts` sum == `total_change_items`. Aggregate totals are **exact** (summed
from exact per-item counts) even when per-item ref lists are truncated.

### ImpactBounding / ImpactSimulationCapabilities / OntologyElementRef

`ImpactBounding`: `max_dependent_depth` (`const 2`), `ref_cap` (applied), and
`any_dimension_truncated` (true if any bucket truncated). `ImpactSimulationCapabilities`:
`can_view`, advisory `can_apply`, advisory `actor_role` (`Role`) — display-only.
`OntologyElementRef` reused by reference: `target_kind` + exactly one of
`ontology_class_id`/`ontology_property_id`/`ontology_relation_id` + `ontology_version_id`
+ `status`.

## Endpoint Details (key behaviors)

### GET `.../impact-simulation` (the read-only analysis)

1. **Authz:** actor must be able to view the change request (standard project-read
   membership); else `403 PERMISSION_DENIED`. No elevated role.
2. **Resolve target:** `target_ontology_version_id` (query) else the change request's
   own `ontology_version_id` / project current DRAFT. Missing/unknown →
   `404 ONTOLOGY_VERSION_NOT_FOUND`.
3. **Per item, compute the five dimensions deterministically:**
   - resolve the direct target `OntologyElementRef` (depth 0);
   - walk ontology dependents to **depth 2** (direct + one hop) — properties of an
     affected class, relations whose domain/range is an affected class, sub/superclass,
     related elements — deterministically ordered;
   - count dependent candidate rows (**exact**) + capped refs + `truncated`;
   - count dependent published elements (**exact**) + capped refs + `truncated`;
   - collect affected `ValidationRuleCode`(s) with max `ValidationResultSeverity` and
     affected `QualityMetricGroup`(s) whose scope intersects an affected element;
   - compute item `ImpactSeverity` + `ImpactSeverityReason` per the frozen rule.
4. **Roll up:** `max_severity` + per-severity counts + exact aggregate totals + distinct
   validation/quality unions.
5. **Return** `200 ImpactSimulationReport` with the **all-false** guard. Never mutates,
   never flips `status`/`application_state`, never sets `SUPERSEDED`, never starts any
   job.

## Error Contract

`ApiError` (`code`, `message`, `details`). Codes:

```text
PROJECT_NOT_FOUND             HTTP 404
CHANGE_REQUEST_NOT_FOUND      HTTP 404
ONTOLOGY_VERSION_NOT_FOUND    HTTP 404 (bad target_ontology_version_id)
PERMISSION_DENIED             HTTP 403 (actor cannot view the change request)
```

HTTP mapping: `403` (PERMISSION_DENIED), `404` (NOT_FOUND family). Every error body
mutates nothing. There is **no** 409 family — the analysis has no precondition/conflict
state (unlike the MVP6.6 apply); it runs read-only against any lifecycle state.

## Safety Boundary (frozen)

Impact simulation is pure read/analysis, advisory, deterministic, and bounded. It MUST
NOT mutate the ontology (draft/published), candidates, prompts, extraction, evaluation,
or governance state; MUST NOT flip `status`/`application_state` or set `SUPERSEDED`;
MUST NOT apply, publish, enforce, gate, re-validate, re-extract, or auto-trigger; MUST
NOT start a publish/extraction/evaluation job; MUST bound the walk (depth ≤ 2) and cap
each ref dimension (exact `count` + `truncated`). Every response exposes an all-false
`ImpactSimulationMutationGuard`. Read rights = any project member who can view the
change request; no elevated role.

## Open Questions for Frontend / QA / Wave46 PM

1. **Compute-on-demand vs persisted report (PM-flagged).** Draft picks a single
   idempotent `GET` that computes on demand (persistence not required for P0); the
   response carries an optional `impact_report_id` so a persisted MVP6.3-style list +
   GET-by-id family can be added additively in Wave46 without changing this GET.
   Confirm FE/QA accept compute-on-demand for P0 (no `impact_report_id` round-trip
   required).
2. **Dependency-graph source (PM-flagged).** The transitive-dependent walk needs a
   concrete ontology-definition adjacency source (properties→class, relation
   domain/range→class, sub/superclass edges). Confirm which read model Wave46 traverses
   (MVP1 `OntologyGraph`/`OntologyGraphEdge` vs the raw class/property/relation tables)
   and the exact edge set that counts as a "dependent" per `target_kind`.
3. **Ref-cap size + per-dimension vs global (PM-flagged).** Draft: per-dimension cap,
   default `50`, `ref_cap` override max `200`; count always exact. Confirm the default
   and whether FE wants a global report-wide cap instead of per-dimension.
4. **Severity edge cases (PM-flagged).** (a) A `MODIFY`/`DEPRECATE` on an element with
   **both** candidate and published dependents → `BREAKING` (published wins, highest
   rule). (b) An `ADD` that introduces a relation whose domain/range references an
   element with existing dependents — draft treats the referenced element as a
   transitive dependent (`MEDIUM`), not `NONE`; confirm. (c) A target element in status
   `ARCHIVED`/`DELETED` at read time — draft still reports it (advisory) but dependents
   may be 0 → `LOW`/`NONE`; confirm. (d) Empty change request (0 items) → `max_severity
   = NONE`, empty `items`; confirm.
5. **Affected quality-group scoping.** Draft reports `QualityMetricGroup`(s) **by
   reference** (group only), computed live from which groups' scope intersects an
   affected element — no metric recomputation, no per-metric values. Confirm FE does
   not need per-metric before/after values in P0 (they stay MVP4 surfaces).
6. **`change_request_status` echo.** Draft echoes the change request's current
   lifecycle `status` as advisory read-only context. Confirm the exact MVP6.5 status
   enum value set FE renders (reused by reference; not redefined here).

## Planning-Only OpenAPI Artifact

`docs/api/openapi-mvp6-7-draft.json` is a standalone planning artifact for the MVP6.7
surface. It contains only the additive MVP6.7 path/schemas and mirrors reused
MVP6.5/6.6/MVP1/MVP3/MVP4/MVP5 enums + `OntologyElementRef` by reference so it is
standalone; it does not replace any prior per-MVP draft.

Parse metadata (verified):

```text
openapi: 3.1.0
info.version: 0.6.7-draft
paths: 1 path object (1 operation — GET impact-simulation)
schemas: 23
parameters: 3 (change_request_id, target_ontology_version_id, ref_cap)
responses: 2 (403 PermissionDenied / 404 NotFound)
```

All 23 schemas are reachable (verified: 0 defined-not-referenced, 0
referenced-not-defined). The new path is disjoint from all MVP1–MVP6.6 OpenAPI drafts
(verified: 0 path overlap).

## Out of Scope for MVP6.7 P0

- **Any mutation of any kind** — ontology draft/published, candidates, prompts,
  extraction, evaluation, governance state (never flips status/application_state, never
  SUPERSEDES). The ADR 0014 core.
- Applying / publishing / enforcing / gating on the report; auto-triggering the MVP6.6
  apply or MVP3 publish. Advisory only.
- **Hypothetical free-form change set** input not tied to a stored change request (P1).
- **Unbounded / full transitive closure** beyond the depth cap.
- Migration-plan / release-note generation; automated remediation / auto-fix
  suggestions; post-apply re-validation / re-extraction job creation.
- Cost / performance impact modelling; multi-request / cross-project impact.
- Runtime API implementation, DB models, Alembic migrations, seed, tests (Wave46+).
- Real LLM/provider execution; copilot/agent runtime; connector/plugin SDK;
  multi-tenant runtime. Durable DB/Alembic persistence (P1/P2).
