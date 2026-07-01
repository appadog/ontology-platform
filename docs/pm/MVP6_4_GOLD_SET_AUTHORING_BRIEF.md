# MVP 6.4 — Gold Set Authoring Policy + Dataset Revisioning (PM Freeze)

Status: `FROZEN / WAVE 39 PM DECISION — CONTRACT-FIRST PLANNING ONLY`
Date: 2026-06-30
Backlog: `PM6-021` (next-theme P0 freeze)

Wave39 is contract-first planning only. No runtime API route, FastAPI service,
DB model, Alembic migration, frontend route/component, seed, smoke, or test is
added this wave. Runtime implementation waits for a Wave40 thin-implementation
order after Backend contract draft + Frontend field/state/IA review + QA
executable checklist are all ready. Mirrors Wave14/19/23/30/33.

---

## 1. Theme Choice + Rationale

**Chosen P0: Gold Set authoring policy + dataset revisioning**
(commander default; `PM6-005` / `BE6-006` / `FE6-007`).

Why this is the smallest coherent next P0 (and why not the alternatives):

- It is the **smallest coherent extension of the already-closed MVP6.1
  evaluation surface**. MVP6.1 deferred exactly these items to P1 in
  `docs/pm/MVP6_PREP_BRIEF.md` §P1: "Dataset revision history and compare",
  "Gold evidence as a first-class editable object", and "Import/export of gold
  sets". MVP6.3 (Benchmark Comparison) closed the other P1 items (comparison
  board, confusion matrix, class accuracy). Gold Set authoring is the last
  un-closed MVP6.1 P1 cluster.
- **The hook already exists in the closed surface, so this is additive, not a
  redesign.** The shipped `EvaluationDataset` already carries `owner_id` and
  `active_version_id`, and the shipped `EvaluationRun` already pins
  `dataset_version_id`. Today those fields exist but there is no revision object
  they point at, no ownership/permission policy enforcing them, and no
  edit/archive lifecycle on gold items. This P0 fills in the object + policy
  behind fields that are already in the contract — the cleanest possible delta.
- The roadmap (`04_...md` §4.2/§4.3) lists "전문가 정답 등록/관리" and §4.3
  주의사항 "정답셋은 전문가 권한자만 수정할 수 있다" + "평가 결과는 시간이
  지나도 재현 가능해야 한다" as core Theme-1 requirements still unbuilt.
- Theme-3+ candidates (governance workflow, impact simulation, copilot/agent
  runtime, connector/plugin SDK, multi-tenant, ontology packs, advanced viz)
  each introduce a **brand-new mutation/automation surface** with its own safety
  boundary and are materially larger. They are deferred per the roadmap
  ordering (§14.3+) and `PM6-007`.

This theme is named **MVP6.4** (6.1/6.2/6.3 are closed). It is a candidate /
analysis-layer authoring surface only. It does **not** touch the published
graph, candidates, prompts, or ontology definitions.

---

## 2. P0 Demo Flow (frozen)

```text
select project
-> open Gold Set Manager (Evaluation/Gold Set area)
-> open a dataset as its expert owner
-> edit a gold entity / gold relation (label, normalized value, class/relation,
   evidence) OR archive a stale gold item
-> attach/edit a standalone Gold Evidence object on a gold item
-> cut a new dataset revision (snapshot current samples + gold items)
   -> previous revision becomes immutable; new revision becomes ACTIVE/DRAFT
-> export the dataset (samples + gold items + evidence) to a portable JSON bundle
-> import a bundle as a NEW dataset (or new revision) with a dry-run
   compatibility report (compatible / warning / conflict / incompatible)
-> open an existing evaluation run and confirm it still points at the dataset
   revision it used (run reproducibility preserved)
```

Non-owners and read-only roles can view datasets, gold items, revisions, and run
pins, but every authoring action (edit / archive / cut revision / import) is
gated and returns a permission/conflict state instead of mutating.

---

## 3. Existing Artifacts This Touches

Reuse by reference; **no renames** of any MVP6.1 shape or enum.

| Existing artifact | How MVP6.4 relates to it |
|---|---|
| `EvaluationDataset` (`owner_id`, `active_version_id`, `status`) | `owner_id` becomes the enforced expert-owner field; `active_version_id` becomes a real FK to a `DatasetRevision`; `status` lifecycle unchanged (`DRAFT`/`ACTIVE`/`ARCHIVED`). |
| `EvaluationSample` | Captured into a revision snapshot; sample shape unchanged. |
| `GoldEntity` / `GoldRelation` | Gain an edit/archive lifecycle (`GoldItemStatus`) + version-pinning to a revision. Field names unchanged; new fields are additive. |
| `GoldEvidenceRef` (embedded) | Promoted to ALSO be addressable as a standalone `GoldEvidence` object with its own id/lifecycle; the embedded `evidence` field on gold items stays for back-compat. |
| `EvaluationRun.dataset_version_id` | Becomes the authoritative run→revision pin used to prove reproducibility. Existing runs keep their value verbatim; never rewritten. |
| `EvaluationDatasetStatus` enum (`core/enums.py`) | Reused verbatim. |
| `docs/api/openapi-mvp6-draft.json` | Baseline the additive MVP6.4 OpenAPI planning artifact extends; must stay additive/disjoint. |
| MVP5 JSON import/export pattern (`INT5-005`) | Reused as the prior-art template for export bundle + dry-run import compatibility states. **Gold-set import/export is its own surface; it does not reuse MVP5 ontology import/export endpoints.** |

---

## 4. Enums / States (frozen)

New names are MVP6.4-scoped and must not collide with MVP6.1–6.3 names.

### `GoldItemStatus` (gold entity + gold relation lifecycle)
- `DRAFT` — created/edited, not yet part of an active revision snapshot.
- `ACTIVE` — current authoritative gold item in the active revision.
- `ARCHIVED` — retired by an owner; excluded from new runs but retained for
  traceability and for any historical run/revision that referenced it.

Edit is in-place on a `DRAFT`/`ACTIVE` item and records an authoring audit
entry. Archive is a soft, reversible-by-owner transition; it never hard-deletes
(evidence/version traceability must survive).

### `DatasetRevisionStatus` (new `DatasetRevision` object)
- `DRAFT` — revision being assembled; mutable.
- `ACTIVE` — the dataset's current authoritative revision (matches
  `EvaluationDataset.active_version_id`). At most one ACTIVE per dataset.
- `FROZEN` — a superseded or pinned revision. **Immutable.** A revision
  **transitions to `FROZEN`** when a newer revision is activated OR the moment
  any `EvaluationRun` pins it (`pinned_run_count > 0`). FROZEN is a status
  transition, not an ACTIVE flag — there is no ACTIVE-but-immutable state, so
  `is_immutable == status in {FROZEN, ARCHIVED}` and "at most one ACTIVE" always
  hold; if the pinned revision was ACTIVE the dataset has no ACTIVE until a new
  one is cut/activated. Runs may only pin `ACTIVE` or `FROZEN` revisions, never
  `DRAFT`. (Freeze-on-pin rule frozen by PM in Wave40 / PM6-022.)
- `ARCHIVED` — dataset-level archive cascades the revision to archived for
  listing/filtering; still immutable and still retrievable for run lineage.

### Authoring audit action (`GoldAuthoringAction`)
- `CREATE`, `EDIT`, `ARCHIVE`, `RESTORE`, `EVIDENCE_ATTACH`, `EVIDENCE_EDIT`,
  `REVISION_CUT`, `REVISION_ACTIVATE`, `IMPORT`.

Every authoring action records: actor (`owner_id`/actor id), action, target
ids (dataset/revision/gold item/evidence), before/after snapshot, reason/note
where applicable, and timestamp. Audit-only; it does not mutate any non-gold
surface.

### Import/export compatibility states (`GoldSetImportCompatibility`)
- `COMPATIBLE` — bundle ontology class/relation ids + sample locators resolve in
  the target project; safe to import.
- `WARNING` — importable but with non-blocking notes (e.g. missing optional
  evidence quote, source segment not present locally so locator-only).
- `CONFLICT` — id collisions or duplicate gold items requiring an explicit
  strategy (`CREATE_NEW_DATASET` vs `NEW_REVISION_OF_EXISTING`); not auto-merged.
- `INCOMPATIBLE` — bundle references ontology classes/relations that do not
  exist in the target project's ontology version; blocked from import.

Import default is **dry-run**: it returns a compatibility report and never
mutates until an explicit confirm with a chosen strategy. Import always creates a
**new dataset or a new revision** — it never edits an existing FROZEN revision.

### Export bundle
- Self-describing JSON: `bundle_version`, source `project_id`/`dataset_id`/
  `revision_id`, `exported_at`, ontology version context, then `samples[]`,
  `gold_entities[]`, `gold_relations[]`, `gold_evidence[]`. Read-only snapshot
  of a single revision. No prompts, no candidates, no published graph, no
  secrets.

---

## 5. Reproducibility + Traceability Decision (critical)

This is the load-bearing decision of the theme.

### Evaluation reproducibility — runs stay pinned to the revision they used
- `EvaluationRun.dataset_version_id` already exists and is **never rewritten**
  by any authoring action. Editing gold items, cutting a new revision, archiving,
  or importing **does not retro-mutate prior runs**.
- A revision becomes `FROZEN` (immutable) the moment any run pins it, OR when a
  newer revision is activated. Authoring edits land in a `DRAFT`/new revision,
  never in a `FROZEN` one. Therefore an old run always resolves to the exact
  sample+gold snapshot it was scored against.
- Cutting a new revision does **not** change existing runs' metrics or
  `dataset_version_id`. New runs pin the new `ACTIVE` revision. A run's
  reported metrics remain reproducible from `{dataset_version_id snapshot} +
  {ontology_version_id, prompt_version_id, model_name, model_run_id,
  parser_version} + request body` — identical to the MVP6.1 reproducibility
  contract, now with a concrete immutable revision object behind the pin.
- The Gold Set Manager surfaces, for any run, which revision it used and whether
  that revision is `FROZEN` (so users see that the run's basis cannot have
  drifted).

### Evidence + version traceability — gold evidence stays addressable
- The standalone `GoldEvidence` object preserves `sample_id`, source/source
  segment, locator/offsets, and quote (the existing `GoldEvidenceRef` fields).
  Promoting it to first-class adds an id + lifecycle but loses none of the
  existing evidence context, and the embedded `evidence` field on gold items is
  retained for back-compat.
- Editing evidence creates an audit entry (before/after); archived gold items
  and their evidence are retained, not deleted, so any historical run/error case
  referencing them still resolves.
- Revisions snapshot the gold-item + evidence set, so a FROZEN revision's
  evidence is recoverable exactly as it was at run time.

---

## 6. Safety Boundary (frozen)

Authoring is **candidate/analysis-layer only**. It must NOT:
- mutate the published graph, published entities/relations, or any publish path;
- mutate candidate entities/relations, candidate review state, or prompts /
  prompt versions;
- mutate the ontology definition (it only references existing
  `ontology_class_id` / `ontology_relation_id`);
- start an extraction job, start an evaluation run, or rewrite any prior
  evaluation run's metrics or `dataset_version_id`;
- hard-delete any gold item, evidence, or revision (archive/freeze only);
- import without an explicit confirm after a dry-run; auto-merge conflicting
  bundles; or import into a FROZEN revision.

Every authoring/import response must expose an all-false mutation guard
(`GoldAuthoringMutationGuard`) mirroring the MVP6.2/6.3 audit-only pattern:
`published_graph_mutated: false`, `candidate_graph_mutated: false`,
`prompt_version_mutated: false`, `ontology_definition_mutated: false`,
`extraction_job_started: false`, `evaluation_run_started: false`,
`prior_run_pin_rewritten: false`.

Expert ownership: only a dataset's `owner_id` (expert owner) — and a designated
admin/PM role — may edit/archive gold items, cut/activate revisions, or confirm
imports. All other roles get read + a permission state.

---

## 7. Explicit Exclusions (out of MVP6.4 P0)

- Real LLM/provider execution, new run execution from the authoring UI, fine-tuning,
  training dataset export execution.
- New evaluation metric names, ontology constraint pass-rate, benchmark
  comparison changes (MVP6.3 already closed; not reopened).
- Active Learning / learning-signal joins (MVP6.2), MVP3 review/correction joins,
  MVP4 quality joins, published-graph joins.
- Ontology governance approval workflow, impact simulation, copilot/agent runtime,
  connector/plugin SDK, multi-tenant runtime, ontology packs, advanced
  visualization/storytelling.
- Multi-user concurrent-edit locking / merge, revision diff visualization beyond a
  simple counts/compatibility summary, cross-project / cross-org gold-set sharing.
- Durable DB/Alembic persistence is NOT required for the P0 thin slice; a
  deterministic process-local store (the proven MVP6.1/6.2/6.3 pattern, with
  `reset_runtime_store()`) is acceptable. Durable persistence remains P1/P2.

---

## 8. Durable Invariants Preserved

- LLM/eval/authoring output never writes to the published graph; stays in the
  candidate/analysis (evaluation) layer with source evidence. ✔
- Candidate graph and published graph remain separated. ✔
- Evidence, ontology version, prompt version, model run, parser version, and
  audit-log traceability preserved (gold items keep evidence; runs keep their
  pin; authoring is audited). ✔
- No autonomous publish, no automatic policy enforcement, no real LLM execution
  in P0. ✔
- Additive only — no MVP1–MVP6.3 path/enum/smoke is broken; new objects/enums
  are additive and reuse MVP6.1 shapes by reference. ✔

---

## 9. Handoff Notes (what the next roles should produce)

- **Backend (`BE6-028`)**: draft additive endpoint families + DTO/enum names in
  `docs/api/MVP6_4_GOLD_SET_AUTHORING_API_CONTRACT_DRAFT.md` and an OpenAPI
  planning artifact `docs/api/openapi-mvp6-4-draft.json` (OpenAPI 3.1.0,
  additive/disjoint to MVP1–MVP6.3 paths). Reuse `EvaluationDataset`,
  `EvaluationSample`, `GoldEntity`, `GoldRelation`, `GoldEvidenceRef` by `$ref`
  (no rename). Define: gold item edit/archive/restore; `DatasetRevision`
  create/list/activate (and the freeze-on-pin / freeze-on-activate rule);
  standalone `GoldEvidence` CRUD; export bundle GET; import dry-run + confirm
  with `GoldSetImportCompatibility` + strategy; `GoldAuthoringMutationGuard`
  (all-false) on every authoring/import response; authoring audit shape. Capture
  open questions (esp. exact run→revision freeze trigger timing and import
  strategy enum names).
- **Frontend (`FE6-049`)**: document Gold Set Manager route/IA — project-scoped,
  contextual to the existing Evaluation/Gold Set area, no ID-bound pages in the
  global LNB (ADR 0010). Specify required fields and first-class
  loading/empty/error/permission states for: gold item edit/archive,
  evidence attach/edit, revision cut/activate (with FROZEN/immutable badges),
  import dry-run compatibility report (4 states + strategy choice), export, and
  the run→revision pin display. Apply the closed design language (tokens,
  Section+Card, KO titles, status badges). List any DTO gaps vs the Backend
  draft.
- **QA (`INT6-026`)**: executable acceptance checklist (continue `INT6-*`) in a
  backlog doc verifying PM/BE/FE agreement on the P0 flow, enums/states, source
  artifacts, safety boundary, and exclusions; the reproducibility invariant
  (prior runs keep their pin; FROZEN immutability); the all-false mutation guard;
  the import dry-run/confirm gate; and no runtime leakage under `apps/`/`infra/`.
  Recommend Wave40 thin implementation, hardening, or PM redesign.
