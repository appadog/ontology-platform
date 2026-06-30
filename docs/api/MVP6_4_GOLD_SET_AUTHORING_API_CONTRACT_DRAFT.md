# MVP 6.4 — Gold Set Authoring + Dataset Revisioning API Contract Draft

Status: `WAVE 39 CONTRACT-FIRST PLANNING ONLY`
Date: 2026-06-30
Backlog: `BE6-028` (theme `PM6-021`; Frontend `FE6-049`; QA `INT6-026`)

This draft extends the closed MVP6.1 Gold Set / Benchmark Studio evaluation
surface with an additive, **expert-owned, candidate/analysis-layer** Gold Set
**authoring + dataset revisioning** contract. It fills in the object + policy
behind fields that already ship in the closed surface
(`EvaluationDataset.owner_id`, `EvaluationDataset.active_version_id`,
`EvaluationRun.dataset_version_id`). It introduces no new run engine, no new
metric names, no LLM/provider execution, and no published/candidate/prompt/
ontology-definition mutation.

Canonical machine-readable planning artifact:
`docs/api/openapi-mvp6-4-draft.json` (OpenAPI 3.1.0, `info.version`
`0.6.4-draft`).

Wave39 is contract-first planning only. This draft does **not** implement
FastAPI routes, runtime services, database models, migrations, seed data,
workers, or tests. Runtime implementation waits for a Wave40 thin-implementation
order after Frontend field/state/IA review (`FE6-049`) and a QA executable
checklist (`INT6-026`) are ready.

Frozen by `docs/pm/MVP6_4_GOLD_SET_AUTHORING_BRIEF.md` and
`docs/adr/0011-mvp6-4-gold-set-authoring-revision-immutability-boundary.md`.
Where the PM brief / ADR 0011 and this draft differ on a name, the PM brief +
ADR win; this draft only refines field names the PM brief explicitly delegated
to Backend.

## Contract Principles

- MVP6.4 is **additive**. Existing MVP1–MVP6.3 paths and schemas are not
  renamed, moved, or removed. Existing MVP6.1 evaluation shapes in
  `docs/api/openapi-mvp6-draft.json` and
  `apps/backend/app/modules/evaluation/schemas.py` remain the source of truth
  for dataset/sample/gold/run shapes and are reused **verbatim / by `$ref`**.
- The contract is **expert-owned authoring confined to the evaluation/analysis
  layer**. It edits/archives gold items, authors standalone gold evidence, cuts
  and activates dataset revisions, and exports/imports gold-set bundles. It
  executes no evaluation run, calls no LLM/provider, and never rewrites a prior
  run's pin or metrics.
- **No reuse-by-rename.** Reused MVP6.1 shapes keep their exact names and field
  names. New fields on existing concepts are additive and optional so the
  existing contract is not broken.
- **No new `EvaluationMetricName`.** The existing eight-metric set is untouched.
- DTO/schema names use PascalCase. JSON fields use snake_case. Enum literals use
  UPPER_SNAKE_CASE.
- Every authoring/import response carries an all-false
  `GoldAuthoringMutationGuard` (7 flags) mirroring the MVP6.2/6.3 audit-only
  pattern.
- Edits land only in `DRAFT` gold items / `DRAFT` revisions or in a brand-new
  revision; `FROZEN` revisions are immutable; gold items and evidence are
  archived/frozen, **never hard-deleted**.

## Preserved MVP6.1–MVP6.3 Boundary

- Gold sets, revisions, and evidence remain analysis artifacts, not published
  graph facts. Authoring cannot approve/reject/publish candidates, cannot move
  the published-graph pointer, and cannot edit candidates, prompts, prompt
  versions, or the ontology definition.
- Authoring references existing `ontology_class_id` / `ontology_relation_id`
  only; it never creates or mutates ontology classes/relations.
- **Evaluation reproducibility is the load-bearing invariant.**
  `EvaluationRun.dataset_version_id` is never rewritten. Editing gold items,
  cutting a revision, archiving, or importing never retro-mutates a prior run or
  its metrics. A revision becomes `FROZEN` (immutable) the moment any run pins it
  OR when a newer revision is activated; runs pin only `ACTIVE` or `FROZEN`
  revisions, never `DRAFT`. An old run therefore always resolves to the exact
  immutable snapshot it was scored against.
- P0 reads/writes **only** MVP6.1 evaluation artifacts (dataset/sample/gold/
  evidence/revision) + an authoring audit log. It does not join MVP3
  review/correction, MVP4 quality, MVP6.2 learning signals, MVP6.3 comparison,
  or published-graph data.
- Durable DB/Alembic persistence is **not required** for the P0 thin slice; the
  proven deterministic process-local store (with `reset_runtime_store()`) is
  acceptable. Durable persistence remains P1/P2.

## Reused MVP6.1 Artifacts (verbatim, not redefined)

Referenced by `$ref` to the MVP6.1 shapes. Field names below are quoted from
`apps/backend/app/modules/evaluation/schemas.py`.

| Reused type | Role in MVP6.4 |
|---|---|
| `EvaluationDataset` | `owner_id` becomes the enforced expert-owner field; `active_version_id` becomes the FK to the `ACTIVE` `DatasetRevision`; `status` (`EvaluationDatasetStatus`) lifecycle unchanged. Fields unchanged. |
| `EvaluationDatasetStatus` (`core/enums.py`) | Reused verbatim (`DRAFT`/`ACTIVE`/`ARCHIVED`). |
| `EvaluationSample` | Captured into a revision snapshot; shape unchanged. |
| `GoldEntity` | Gains an edit/archive lifecycle (`GoldItemStatus`) + revision pin. Field names unchanged; new fields additive/optional. |
| `GoldRelation` | Same as `GoldEntity`. |
| `GoldEvidenceRef` (embedded) | Promoted to ALSO be addressable as a standalone `GoldEvidence` object with its own id + lifecycle. The embedded `evidence` field on gold items is retained for back-compat. All existing fields (`sample_id`, `source_id`, `source_segment_id`, `locator`, `offset_start`, `offset_end`, `quote`) preserved. |
| `EvaluationRun` (`dataset_version_id`) | The authoritative run→revision pin. Existing runs keep their value verbatim; never rewritten. |

### Additive (optional) fields on reused gold shapes

These are **additive, optional** so the MVP6.1 contract is not broken. A
runtime implementation may surface them on the gold item; the embedded
`evidence: GoldEvidenceRef` field stays for back-compat.

- `GoldEntity` / `GoldRelation` (read responses only): `status`
  (`GoldItemStatus`, default `ACTIVE`), `revision_id` (nullable; the revision
  this item belongs to), `evidence_id` (nullable; id of the promoted standalone
  `GoldEvidence`), `updated_at` (nullable), `archived_at` (nullable).

Because MVP6.4 returns gold items inside MVP6.4-scoped response wrappers, this
draft does **not** redefine `GoldEntity`/`GoldRelation`; the additive fields are
documented here and the OpenAPI artifact `$ref`s the MVP6.1 shapes plus an
`allOf` overlay (`GoldItemAuthoringOverlay`) for the additive read fields,
avoiding any rename.

## New Enums (MVP6.4 only — frozen by PM brief §4, used verbatim)

### `GoldItemStatus` (gold entity + gold relation lifecycle)

```text
DRAFT      created/edited, not yet part of an active revision snapshot
ACTIVE     current authoritative gold item in the active revision
ARCHIVED   retired by owner; excluded from new runs, retained for traceability
```

Edit is in-place on a `DRAFT`/`ACTIVE` item and records an audit entry. Archive
is soft, owner-reversible (`RESTORE`), never a hard delete.

### `DatasetRevisionStatus` (new `DatasetRevision` object)

```text
DRAFT      revision being assembled; mutable
ACTIVE     the dataset's current authoritative revision (== EvaluationDataset.active_version_id); at most one per dataset
FROZEN     immutable; set when a newer revision is activated OR any EvaluationRun pins it
ARCHIVED   dataset-level archive cascade; immutable; still retrievable for run lineage
```

Runs may pin only `ACTIVE` or `FROZEN` revisions, never `DRAFT`.

### `GoldAuthoringAction` (audit log — the 9 actions, verbatim)

```text
CREATE
EDIT
ARCHIVE
RESTORE
EVIDENCE_ATTACH
EVIDENCE_EDIT
REVISION_CUT
REVISION_ACTIVATE
IMPORT
```

### `GoldSetImportCompatibility` (dry-run import report state)

```text
COMPATIBLE     ontology class/relation ids + sample locators resolve in target; safe to import
WARNING        importable with non-blocking notes (missing optional quote, locator-only sample, etc.)
CONFLICT       id collisions / duplicate gold items requiring an explicit strategy; not auto-merged
INCOMPATIBLE   bundle references ontology classes/relations absent from the target project; blocked
```

### `GoldSetImportStrategy` (Backend-delegated; required on confirm)

Names delegated to Backend by the PM brief ("import strategy enum names"),
derived directly from brief §4 (`CREATE_NEW_DATASET` vs
`NEW_REVISION_OF_EXISTING`):

```text
CREATE_NEW_DATASET          import the bundle as a brand-new dataset (new dataset + new ACTIVE revision)
NEW_REVISION_OF_EXISTING    import the bundle as a new revision of an existing dataset (requires target_dataset_id)
```

Import never edits a `FROZEN` revision and never auto-merges; both strategies
always create a new revision object.

## `GoldAuthoringMutationGuard` (all-false on every authoring/import response)

The 7 flags from the brief, all `false` for every MVP6.4 response:

```json
{
  "published_graph_mutated": false,
  "candidate_graph_mutated": false,
  "prompt_version_mutated": false,
  "ontology_definition_mutated": false,
  "extraction_job_started": false,
  "evaluation_run_started": false,
  "prior_run_pin_rewritten": false
}
```

`prior_run_pin_rewritten: false` is the reproducibility proof: no authoring
action ever rewrites `EvaluationRun.dataset_version_id`.

## Authorization Model (expert-owner / admin-only)

- **Read** (datasets, revisions, gold items, evidence, run pins, audit log):
  any project member.
- **Authoring** (edit/archive/restore gold item, attach/edit evidence,
  cut/activate revision, confirm import): only the dataset's `owner_id` (expert
  owner) **or** a designated admin/PM role.
- Non-owners receive `403 PERMISSION_DENIED` on authoring calls and never a
  partial mutation. Every authoring/list/get response carries a read-only
  `GoldAuthoringCapabilities` hint (`can_view`, `can_edit_gold_item`,
  `can_archive_gold_item`, `can_author_evidence`, `can_cut_revision`,
  `can_activate_revision`, `can_import`) so the UI disables actions it lacks
  permission for. The hint is display-only; authorization is enforced
  server-side. It never widens the boundary or grants mutation.

## Additive Endpoint Families

All additive, project-scoped where collection-shaped, and additive to
MVP1–MVP6.3 paths. (`{dataset_id}` / `{revision_id}` / `{gold_*_id}` /
`{evidence_id}` are path params on non-LNB, contextual resource paths.)

### A. Gold item authoring (edit / archive / restore)

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-028 | `GET` | `/api/v1/projects/{project_id}/evaluation-datasets/{dataset_id}/authoring` | Open a dataset as owner: authoring overview (active revision, gold counts by status, capabilities, run-pin summary) |
| BE6-028 | `PATCH` | `/api/v1/evaluation-datasets/{dataset_id}/gold-entities/{gold_entity_id}` | Edit a gold entity (label, normalized_value, ontology_class_id, embedded evidence) |
| BE6-028 | `POST` | `/api/v1/evaluation-datasets/{dataset_id}/gold-entities/{gold_entity_id}/archive` | Archive a gold entity (soft; `GoldItemStatus.ARCHIVED`) |
| BE6-028 | `POST` | `/api/v1/evaluation-datasets/{dataset_id}/gold-entities/{gold_entity_id}/restore` | Restore an archived gold entity |
| BE6-028 | `PATCH` | `/api/v1/evaluation-datasets/{dataset_id}/gold-relations/{gold_relation_id}` | Edit a gold relation (ontology_relation_id, endpoints, embedded evidence) |
| BE6-028 | `POST` | `/api/v1/evaluation-datasets/{dataset_id}/gold-relations/{gold_relation_id}/archive` | Archive a gold relation |
| BE6-028 | `POST` | `/api/v1/evaluation-datasets/{dataset_id}/gold-relations/{gold_relation_id}/restore` | Restore a gold relation |

### B. Standalone Gold Evidence object (first-class CRUD)

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-028 | `POST` | `/api/v1/evaluation-datasets/{dataset_id}/gold-evidence` | Attach a standalone `GoldEvidence` to a gold item (`EVIDENCE_ATTACH`) |
| BE6-028 | `GET` | `/api/v1/evaluation-datasets/{dataset_id}/gold-evidence` | List standalone gold evidence in the dataset |
| BE6-028 | `GET` | `/api/v1/gold-evidence/{evidence_id}` | Retrieve one `GoldEvidence` |
| BE6-028 | `PATCH` | `/api/v1/gold-evidence/{evidence_id}` | Edit gold evidence (`EVIDENCE_EDIT`; locator/offsets/quote/source) |
| BE6-028 | `POST` | `/api/v1/gold-evidence/{evidence_id}/archive` | Archive gold evidence (soft; never hard-delete) |

### C. Dataset revisions (cut / list / get / activate)

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-028 | `POST` | `/api/v1/evaluation-datasets/{dataset_id}/revisions` | Cut a new revision (snapshot current samples + gold items); prior ACTIVE becomes FROZEN if newly superseded |
| BE6-028 | `GET` | `/api/v1/evaluation-datasets/{dataset_id}/revisions` | List revisions (status, counts, run-pin count, frozen reason) |
| BE6-028 | `GET` | `/api/v1/dataset-revisions/{revision_id}` | Retrieve one revision (snapshot summary + immutability + pinned-run refs) |
| BE6-028 | `POST` | `/api/v1/dataset-revisions/{revision_id}/activate` | Activate a `DRAFT` revision as the dataset's ACTIVE; freezes the prior ACTIVE |

### D. Export / Import (dry-run-first, additive)

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-028 | `GET` | `/api/v1/dataset-revisions/{revision_id}/export` | Export a single revision as a portable JSON bundle (read-only snapshot) |
| BE6-028 | `POST` | `/api/v1/projects/{project_id}/gold-set-imports` | Dry-run a bundle import: returns a `GoldSetImportCompatibility` report; mutates nothing |
| BE6-028 | `POST` | `/api/v1/projects/{project_id}/gold-set-imports/{import_id}/confirm` | Confirm a dry-run with a chosen `GoldSetImportStrategy`; creates a new dataset or new revision (`IMPORT`) |

### E. Authoring audit log (read-only)

| ID | Method | Path | Purpose |
|---|---|---|---|
| BE6-028 | `GET` | `/api/v1/evaluation-datasets/{dataset_id}/authoring-audit` | List `GoldAuthoringAuditEntry` rows (actor, action, target ids, before/after, reason, timestamp) |

### Query parameters

| Query | Type | Applies to | Notes |
|---|---|---|---|
| `limit` | integer | all list endpoints | Default `50`, max `100` |
| `cursor` | string | all list endpoints | Opaque pagination cursor |
| `status` | `GoldItemStatus` | gold-evidence list, authoring overview filters | Optional filter |
| `revision_status` | `DatasetRevisionStatus` | revision list | Optional filter |
| `action` | `GoldAuthoringAction` | authoring-audit list | Optional filter |

## DTO Contract

### DatasetRevision (response)

```json
{
  "id": "dataset-insurance-gold-v3",
  "dataset_id": "dataset-insurance-gold",
  "project_id": "project-insurance-demo",
  "revision_number": 3,
  "status": "ACTIVE",
  "is_immutable": false,
  "frozen_reason": null,
  "sample_count": 42,
  "gold_entity_count": 120,
  "gold_relation_count": 64,
  "gold_evidence_count": 184,
  "pinned_run_count": 0,
  "parent_revision_id": "dataset-insurance-gold-v2",
  "ontology_version_id": "ontology-v7",
  "created_at": "2026-06-30T09:00:00Z",
  "activated_at": "2026-06-30T09:00:00Z",
  "frozen_at": null,
  "created_by": "user-expert-owner-1"
}
```

Required: `id`, `dataset_id`, `project_id`, `revision_number`, `status`,
`is_immutable`, `sample_count`, `gold_entity_count`, `gold_relation_count`,
`created_at`. `is_immutable` is `true` iff `status` is `FROZEN` or `ARCHIVED`.
`frozen_reason` is `NEWER_REVISION_ACTIVATED` or `PINNED_BY_RUN` (nullable when
not frozen).

### DatasetRevisionCutRequest (request)

```json
{
  "note": "Q3 expert re-review; added 6 entities, archived 2 stale relations",
  "activate": true
}
```

Rules: `note` (optional). `activate` (optional, default `false`) — when `true`
the new revision is activated immediately (status `ACTIVE`) and the prior ACTIVE
is frozen (`frozen_reason = NEWER_REVISION_ACTIVATED`); when `false` the new
revision is created as `DRAFT`. A cut snapshots the dataset's current
`ACTIVE`/`DRAFT` gold items + samples; `ARCHIVED` items are excluded from the
new snapshot but retained for lineage.

### GoldEntityEditRequest / GoldRelationEditRequest (request)

```json
{
  "label": "보험금 청구 기한",
  "normalized_value": "claim_filing_deadline",
  "ontology_class_id": "class-clause",
  "evidence": {
    "sample_id": "sample-001",
    "source_id": "doc-12",
    "source_segment_id": "seg-4",
    "locator": "p.3/para.2",
    "offset_start": 120,
    "offset_end": 188,
    "quote": "청구는 사고일로부터 3년 이내에..."
  },
  "reason": "normalized value corrected per glossary v4"
}
```

Rules: all fields optional (PATCH semantics); at least one mutating field
required. `evidence` edits the embedded `GoldEvidenceRef` for back-compat (the
standalone object is edited via family B). `reason` is recorded in the audit
`EDIT` entry. Edit is rejected with `409 GOLD_ITEM_IMMUTABLE` if the item
belongs to a `FROZEN` revision.

### GoldEntityMutationResponse / GoldRelationMutationResponse (response)

```json
{
  "gold_entity": { "...": "MVP6.1 GoldEntity shape via $ref + GoldItemAuthoringOverlay" },
  "audit_entry": { "...": "GoldAuthoringAuditEntry" },
  "mutation_guard": {
    "published_graph_mutated": false,
    "candidate_graph_mutated": false,
    "prompt_version_mutated": false,
    "ontology_definition_mutated": false,
    "extraction_job_started": false,
    "evaluation_run_started": false,
    "prior_run_pin_rewritten": false
  },
  "capabilities": { "...": "GoldAuthoringCapabilities" }
}
```

Archive/restore responses use the same envelope (status flips to `ARCHIVED` /
back to its prior status). Required: the gold item, `audit_entry`,
`mutation_guard`.

### GoldEvidence (standalone, first-class)

```json
{
  "id": "gold-evidence-0001",
  "project_id": "project-insurance-demo",
  "dataset_id": "dataset-insurance-gold",
  "revision_id": "dataset-insurance-gold-v3",
  "gold_entity_id": "gold-entity-77",
  "gold_relation_id": null,
  "status": "ACTIVE",
  "sample_id": "sample-001",
  "source_id": "doc-12",
  "source_segment_id": "seg-4",
  "locator": "p.3/para.2",
  "offset_start": 120,
  "offset_end": 188,
  "quote": "청구는 사고일로부터 3년 이내에...",
  "created_at": "2026-06-30T09:10:00Z",
  "updated_at": "2026-06-30T09:10:00Z",
  "archived_at": null
}
```

The `sample_id`/`source_id`/`source_segment_id`/`locator`/`offset_start`/
`offset_end`/`quote` fields are exactly the `GoldEvidenceRef` fields (no rename),
plus an id + lifecycle + a target gold item ref (`gold_entity_id` XOR
`gold_relation_id`). Required: `id`, `project_id`, `dataset_id`, `status`,
`sample_id`, exactly one of `gold_entity_id`/`gold_relation_id`, `created_at`.

### GoldEvidenceAttachRequest / GoldEvidenceEditRequest (request)

```json
{
  "gold_entity_id": "gold-entity-77",
  "sample_id": "sample-001",
  "source_id": "doc-12",
  "source_segment_id": "seg-4",
  "locator": "p.3/para.2",
  "offset_start": 120,
  "offset_end": 188,
  "quote": "청구는 사고일로부터 3년 이내에...",
  "reason": "attach standalone evidence for cross-run traceability"
}
```

Attach requires exactly one of `gold_entity_id`/`gold_relation_id` + `sample_id`.
Edit (PATCH) is field-optional. Both rejected with `409 GOLD_ITEM_IMMUTABLE`
when the target belongs to a `FROZEN` revision. Response envelope mirrors the
gold-item mutation envelope (`gold_evidence` + `audit_entry` + `mutation_guard`
+ `capabilities`).

### GoldSetExportBundle (export GET response)

```json
{
  "bundle_version": "gold-set-bundle/1.0",
  "source_project_id": "project-insurance-demo",
  "source_dataset_id": "dataset-insurance-gold",
  "source_revision_id": "dataset-insurance-gold-v2",
  "revision_status": "FROZEN",
  "ontology_version_id": "ontology-v7",
  "exported_at": "2026-06-30T10:00:00Z",
  "samples": [ { "...": "EvaluationSample via $ref" } ],
  "gold_entities": [ { "...": "GoldEntity via $ref + overlay" } ],
  "gold_relations": [ { "...": "GoldRelation via $ref + overlay" } ],
  "gold_evidence": [ { "...": "GoldEvidence" } ],
  "mutation_guard": { "...": "all-false GoldAuthoringMutationGuard" }
}
```

Read-only single-revision snapshot. Contains **no** prompts, candidates,
published graph, or secrets. Required: `bundle_version`, `source_project_id`,
`source_dataset_id`, `source_revision_id`, `ontology_version_id`, `exported_at`,
`samples`, `gold_entities`, `gold_relations`, `gold_evidence`.

### GoldSetImportDryRunRequest (request)

```json
{
  "bundle": { "...": "GoldSetExportBundle" }
}
```

The dry-run accepts a `GoldSetExportBundle`. It mutates nothing and returns a
compatibility report keyed by a server-issued `import_id` for the later confirm.

### GoldSetImportReport (dry-run response)

```json
{
  "import_id": "gold-set-import-20260630-001",
  "project_id": "project-insurance-demo",
  "compatibility": "WARNING",
  "bundle_summary": {
    "bundle_version": "gold-set-bundle/1.0",
    "source_dataset_id": "dataset-insurance-gold",
    "source_revision_id": "dataset-insurance-gold-v2",
    "sample_count": 42,
    "gold_entity_count": 120,
    "gold_relation_count": 64,
    "gold_evidence_count": 184
  },
  "target_ontology_version_id": "ontology-v8",
  "issues": [
    {
      "code": "ONTOLOGY_CLASS_RESOLVED",
      "severity": "COMPATIBLE",
      "ontology_class_id": "class-clause",
      "message": "class resolves in target ontology"
    },
    {
      "code": "SAMPLE_SOURCE_NOT_LOCAL",
      "severity": "WARNING",
      "sample_id": "sample-009",
      "message": "source segment not present locally; imported as locator-only"
    }
  ],
  "allowed_strategies": ["CREATE_NEW_DATASET", "NEW_REVISION_OF_EXISTING"],
  "blocking": false,
  "mutation_guard": { "...": "all-false GoldAuthoringMutationGuard" }
}
```

`compatibility` is the aggregate `GoldSetImportCompatibility`. `issues[]` are
`GoldSetImportIssue` (`code`, `severity` (a `GoldSetImportCompatibility` value),
optional `ontology_class_id`/`ontology_relation_id`/`sample_id`, `message`).
`blocking` is `true` only when `compatibility == INCOMPATIBLE`, in which case
`allowed_strategies` is empty and confirm is rejected. `CONFLICT` requires the
caller to pick a strategy explicitly on confirm (no auto-merge). Required:
`import_id`, `project_id`, `compatibility`, `bundle_summary`, `issues`,
`allowed_strategies`, `blocking`, `mutation_guard`.

### GoldSetImportConfirmRequest (request)

```json
{
  "strategy": "NEW_REVISION_OF_EXISTING",
  "target_dataset_id": "dataset-insurance-gold",
  "activate": false,
  "acknowledge_warnings": true
}
```

Rules: `strategy` (required, `GoldSetImportStrategy`). `target_dataset_id`
(required iff `strategy == NEW_REVISION_OF_EXISTING`; must not be a FROZEN-only
dataset with no DRAFT slot — import always creates a NEW revision, never edits
FROZEN). `activate` (optional, default `false`). `acknowledge_warnings`
(required `true` when dry-run `compatibility == WARNING`). Confirm is rejected
with `409 IMPORT_INCOMPATIBLE` when the dry-run was `INCOMPATIBLE`, and
`409 IMPORT_STRATEGY_REQUIRED` when `CONFLICT` without a chosen strategy.

### GoldSetImportConfirmResponse (response)

```json
{
  "import_id": "gold-set-import-20260630-001",
  "strategy": "NEW_REVISION_OF_EXISTING",
  "created_dataset_id": "dataset-insurance-gold",
  "created_revision_id": "dataset-insurance-gold-v4",
  "created_revision_status": "DRAFT",
  "imported_counts": {
    "samples": 42,
    "gold_entities": 120,
    "gold_relations": 64,
    "gold_evidence": 184
  },
  "audit_entry": { "...": "GoldAuthoringAuditEntry (action=IMPORT)" },
  "mutation_guard": { "...": "all-false GoldAuthoringMutationGuard" }
}
```

Required: `import_id`, `strategy`, `created_revision_id`,
`created_revision_status`, `imported_counts`, `audit_entry`, `mutation_guard`.

### GoldAuthoringAuditEntry (response item)

```json
{
  "id": "gold-audit-20260630-0007",
  "project_id": "project-insurance-demo",
  "dataset_id": "dataset-insurance-gold",
  "revision_id": "dataset-insurance-gold-v3",
  "action": "EDIT",
  "actor_id": "user-expert-owner-1",
  "is_owner": true,
  "target_kind": "GOLD_ENTITY",
  "target_id": "gold-entity-77",
  "before": { "label": "청구 기한" },
  "after": { "label": "보험금 청구 기한" },
  "reason": "normalized value corrected per glossary v4",
  "created_at": "2026-06-30T09:12:00Z"
}
```

`action` is `GoldAuthoringAction`. `target_kind` is one of `GOLD_ENTITY`,
`GOLD_RELATION`, `GOLD_EVIDENCE`, `DATASET_REVISION`, `DATASET`. `before`/`after`
are nullable snapshots (null on `CREATE`/`IMPORT`/`REVISION_CUT`). Required:
`id`, `project_id`, `dataset_id`, `action`, `actor_id`, `target_kind`,
`target_id`, `created_at`. Audit-only; mutates no non-gold surface.

### DatasetAuthoringOverview (authoring GET response)

```json
{
  "dataset": { "...": "EvaluationDataset via $ref" },
  "active_revision": { "...": "DatasetRevision (status=ACTIVE) or null" },
  "revision_count": 3,
  "gold_status_counts": { "DRAFT": 2, "ACTIVE": 120, "ARCHIVED": 5 },
  "pinned_runs": [
    {
      "run_id": "eval-run-20260620-001",
      "dataset_version_id": "dataset-insurance-gold-v2",
      "revision_status": "FROZEN",
      "pin_immutable": true
    }
  ],
  "capabilities": { "...": "GoldAuthoringCapabilities" },
  "mutation_guard": { "...": "all-false GoldAuthoringMutationGuard" }
}
```

`pinned_runs[]` (`RunRevisionPin`: `run_id`, `dataset_version_id`,
`revision_status`, `pin_immutable`) proves the run→revision reproducibility pin
and that a run's basis is FROZEN/immutable. Required: `dataset`,
`revision_count`, `gold_status_counts`, `pinned_runs`, `capabilities`,
`mutation_guard`.

## Endpoint Details (key behaviors)

### POST `.../revisions` (cut)

- Snapshots current `ACTIVE`/`DRAFT` gold items + samples into a new revision.
- `activate=false` -> new revision `DRAFT` (mutable). `activate=true` -> new
  revision `ACTIVE`; prior ACTIVE -> `FROZEN`
  (`frozen_reason=NEWER_REVISION_ACTIVATED`); `EvaluationDataset.active_version_id`
  updated to the new revision id.
- Never rewrites any `EvaluationRun.dataset_version_id`. Returns `201`.
- Errors: `403 PERMISSION_DENIED`, `404 DATASET_NOT_FOUND`,
  `409 DATASET_ARCHIVED`.

### POST `.../dataset-revisions/{revision_id}/activate`

- Activates a `DRAFT` revision; demotes/freezes the prior ACTIVE. At most one
  ACTIVE per dataset is preserved.
- Errors: `403`, `404 REVISION_NOT_FOUND`, `409 REVISION_NOT_DRAFT` (only DRAFT
  may be activated), `409 REVISION_FROZEN`.

### Freeze-on-pin (run reproducibility — critical, see Open Questions Q1)

- A revision is frozen the moment an `EvaluationRun` pins it
  (`frozen_reason=PINNED_BY_RUN`). MVP6.4 itself starts **no** runs; the freeze
  trigger is observed/derived from existing run pins. **Exact trigger timing is
  an open question for QA/Frontend (Q1).** Draft assumption: a revision with
  `pinned_run_count > 0` is reported `FROZEN`/`is_immutable=true` regardless of
  whether it is also the ACTIVE revision — i.e. pin-freeze and active-status are
  orthogonal; an ACTIVE revision that gets pinned becomes immutable-while-active
  and authoring must branch a new DRAFT revision to continue editing.

### GET `.../{revision_id}/export`

- Returns a `GoldSetExportBundle` for a single revision (any status). Read-only;
  all-false guard. No prompts/candidates/published/secrets.

### POST `.../gold-set-imports` (dry-run) + `/confirm`

- Dry-run resolves bundle ontology ids + sample locators against the target
  project, returns `GoldSetImportReport`; mutates nothing.
- Confirm requires an explicit `GoldSetImportStrategy`; always creates a NEW
  dataset or NEW revision; never edits a FROZEN revision; never auto-merges.
  `INCOMPATIBLE` is blocked.

## Error Contract

`ApiError` (`code`, `message`, `details`). Recommended codes:

```text
PROJECT_NOT_FOUND
DATASET_NOT_FOUND
DATASET_ARCHIVED
GOLD_ITEM_NOT_FOUND
GOLD_ITEM_IMMUTABLE          (target belongs to a FROZEN revision)
GOLD_ITEM_INVALID_TRANSITION (e.g. restore a non-archived item)
GOLD_EVIDENCE_NOT_FOUND
GOLD_EVIDENCE_TARGET_INVALID (not exactly one of gold_entity_id/gold_relation_id)
REVISION_NOT_FOUND
REVISION_NOT_DRAFT
REVISION_FROZEN
ONTOLOGY_REF_INVALID         (ontology_class_id/ontology_relation_id absent in project)
IMPORT_NOT_FOUND
IMPORT_INCOMPATIBLE
IMPORT_STRATEGY_REQUIRED     (CONFLICT without chosen strategy)
IMPORT_WARNINGS_NOT_ACKNOWLEDGED
PERMISSION_DENIED
```

## Safety Boundary (frozen)

Authoring is candidate/analysis-layer only. It must NOT mutate the published
graph, candidates, prompts/prompt versions, or the ontology definition; start an
extraction job or evaluation run; rewrite any prior run's metrics or
`dataset_version_id`; hard-delete any gold item/evidence/revision; or import
without an explicit confirm after a dry-run, auto-merge conflicts, or import into
a FROZEN revision. Every authoring/import response exposes the all-false
`GoldAuthoringMutationGuard`. Expert ownership (dataset `owner_id` + admin/PM)
is enforced; all other roles get read + a permission state.

## Open Questions for Frontend / QA

1. **Revision freeze-on-pin trigger timing.** MVP6.4 starts no runs, so the
   `PINNED_BY_RUN` freeze is derived from existing run pins. Draft assumption:
   `pinned_run_count > 0` ⇒ `is_immutable=true` even while ACTIVE, forcing a new
   DRAFT branch to keep authoring. QA: confirm this is the immutability rule to
   test; Frontend: confirm the "ACTIVE but pinned ⇒ immutable, branch to edit"
   UX. Alternative: freeze only on activation of a newer revision and treat pin
   as advisory — **needs PM/QA ruling**.
2. **Import conflict resolution semantics.** `CONFLICT` is not auto-merged and
   requires an explicit `GoldSetImportStrategy`. For `NEW_REVISION_OF_EXISTING`
   onto a dataset whose ACTIVE revision is pinned/immutable, the import creates a
   DRAFT revision (never edits the FROZEN one). Confirm Frontend's conflict UX
   (strategy picker + warning acknowledge) and whether id-collision detail must
   be itemized per gold item or summarized.
3. **Gold Evidence object identity.** Standalone `GoldEvidence` carries its own
   `id` while the embedded `evidence: GoldEvidenceRef` on gold items is retained
   for back-compat. When both exist, which is authoritative for export/run
   resolution? Draft assumption: the standalone object (when `evidence_id` is
   set) is authoritative; the embedded field is a back-compat mirror. Needs
   QA/Frontend confirmation, and a rule for whether attaching a standalone
   object must clear/sync the embedded mirror.
4. **`activate` on cut + import confirm.** Cut and import-confirm both accept
   `activate`. Confirm Frontend wants activation as part of the same action vs a
   separate explicit `activate` step (safer/clearer audit trail). Draft supports
   both; default is non-activating.
5. **Audit before/after granularity.** `before`/`after` are field-level
   snapshots. Confirm QA wants full-object snapshots (heavier, fully
   reconstructable) vs changed-fields-only (lighter). Draft shows changed-fields.
6. **`GoldItemAuthoringOverlay` placement.** The additive read fields (`status`,
   `revision_id`, `evidence_id`, `updated_at`, `archived_at`) are exposed via an
   `allOf` overlay over the MVP6.1 `GoldEntity`/`GoldRelation` (no rename).
   Confirm Frontend can consume the overlay shape, or whether a flat MVP6.4
   read DTO is preferred for the authoring views.

## Planning-Only OpenAPI Artifact

`docs/api/openapi-mvp6-4-draft.json` is a standalone planning artifact for the
MVP6.4 surface. It contains only the additive MVP6.4 paths and schemas needed
for contract review; it does not replace `docs/api/openapi-mvp6-draft.json` or
the other per-MVP drafts.

Expected parse metadata:

```text
openapi: 3.1.0
info.version: 0.6.4-draft
paths: 17 path objects (20 operations)
schemas: 45 (incl. mirrored-by-reference MVP6.1 shapes so the artifact is standalone)
parameters: 9
```

The schema count includes the 6 mirrored MVP6.1 shapes (`EvaluationDataset`,
`EvaluationSample`, `GoldEntity`, `GoldRelation`, `GoldEvidenceRef`, plus the
`GoldEntityAuthoringView`/`GoldRelationAuthoringView` `allOf` overlays). Those
mirrors carry a `description` noting they are reused verbatim / not renamed; in
a consolidated spec they would be `$ref`s into the MVP6.1 OpenAPI rather than
re-declared. All 45 schemas are reachable (no dangling/unreferenced refs).

## Out of Scope for MVP6.4 P0

- Runtime API implementation, DB models, Alembic migrations, seed data,
  deterministic runtime stores, tests (Wave40+).
- Real LLM/provider execution, run execution from the authoring UI, fine-tuning
  or training-dataset export execution.
- New `EvaluationMetricName`, ontology constraint pass-rate, MVP6.3 comparison
  changes.
- MVP6.2 learning-signal, MVP3 review/correction, MVP4 quality, published-graph
  joins.
- Ontology governance approval workflow, impact simulation, copilot/agent
  runtime, connector/plugin SDK, multi-tenant runtime, ontology packs, advanced
  visualization.
- Multi-user concurrent-edit locking/merge, revision diff visualization beyond a
  counts/compatibility summary, cross-project / cross-org gold-set sharing.
- Hard-delete of any gold item, evidence, or revision (archive/freeze only).
