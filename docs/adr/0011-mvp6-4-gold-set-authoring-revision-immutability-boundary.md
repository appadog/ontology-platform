# ADR 0011: MVP6.4 Gold Set Authoring + Dataset Revision Immutability / Run-Pinning Boundary

## Status

Accepted

## Context

MVP6.1 (Gold Set / Benchmark Studio) closed a deterministic evaluation surface.
Its shipped shapes already anticipate authoring/revisioning:
`EvaluationDataset` carries `owner_id` and `active_version_id`, and
`EvaluationRun` pins `dataset_version_id`. But MVP6.1 explicitly deferred to P1
(`docs/pm/MVP6_PREP_BRIEF.md` §P1) the things that give those fields meaning:
dataset revision history, gold evidence as a first-class editable object, and
gold-set import/export. MVP6.3 closed the other MVP6.1 P1 items (benchmark
comparison, confusion matrix, class accuracy). Gold Set authoring is the last
un-closed MVP6.1 P1 cluster and the smallest coherent next step.

The roadmap (`04_...md` §4.3 주의사항) requires that "정답셋은 전문가
권한자만 수정할 수 있다" and that "평가 결과는 시간이 지나도 재현
가능해야 한다". Introducing edit/archive of gold items and new dataset
revisions creates a real risk: if authoring could change the data an old run was
scored against, evaluation reproducibility — a hard product invariant — would
break. This ADR fixes the boundary that prevents that.

MVP6.2 (Active Learning) and MVP6.3 (Benchmark Comparison) established a durable
pattern for analysis-layer surfaces on top of closed data: additive endpoints,
audit-only/explicitly-gated writes, and an all-false `mutation_guard` proving no
prompt/candidate/published/policy/extraction/evaluation mutation. MVP6.4 reuses
that pattern for an authoring surface confined to the evaluation/analysis layer.

## Decision

- MVP6.4 P0 is **Gold Set authoring + dataset revisioning** — an expert-owned,
  candidate/analysis-layer authoring surface over MVP6.1 evaluation datasets. It
  is NOT a published-graph, candidate, prompt, or ontology-definition editor, and
  NOT a new run engine.
- **Expert ownership is enforced.** Only a dataset's `owner_id` (and a
  designated admin/PM role) may edit/archive gold items, attach/edit gold
  evidence, cut/activate dataset revisions, or confirm imports. Other roles get
  read access plus a permission state.
- **Dataset revisions are immutable once relied upon.** A `DatasetRevision`
  moves `DRAFT -> ACTIVE -> FROZEN -> ARCHIVED`. A revision becomes `FROZEN`
  (immutable) when a newer revision is activated OR when any `EvaluationRun`
  pins it. At most one `ACTIVE` revision per dataset. Authoring edits land in a
  `DRAFT`/new revision, never in a `FROZEN` one.
- **Run-pinning preserves evaluation reproducibility.**
  `EvaluationRun.dataset_version_id` is never rewritten by any authoring action.
  Editing gold items, cutting a revision, archiving, or importing does not
  retro-mutate prior runs or their metrics. An old run always resolves to the
  exact immutable revision snapshot it was scored against; runs may pin only
  `ACTIVE` or `FROZEN` revisions, never `DRAFT`.
- **Gold items and evidence are never hard-deleted.** Gold entities/relations
  move `DRAFT -> ACTIVE -> ARCHIVED` (archive is soft, owner-reversible);
  evidence becomes a first-class `GoldEvidence` object (id + lifecycle) that
  preserves all existing `GoldEvidenceRef` context (sample/source/segment/
  locator/offsets/quote), with the embedded `evidence` field retained for
  back-compat. This keeps evidence/version traceability intact for any
  historical run or error case.
- **Import is dry-run-first and additive.** Import returns a
  `GoldSetImportCompatibility` report (`COMPATIBLE`/`WARNING`/`CONFLICT`/
  `INCOMPATIBLE`) and mutates nothing until an explicit confirm with a chosen
  strategy. Import always creates a NEW dataset or a NEW revision; it never edits
  a FROZEN revision and never auto-merges conflicts. `INCOMPATIBLE` bundles
  (referencing ontology classes/relations absent from the target project) are
  blocked. Export is a read-only single-revision JSON snapshot (no prompts,
  candidates, published graph, or secrets).
- **No reuse-by-rename.** MVP6.1 shapes (`EvaluationDataset`,
  `EvaluationSample`, `GoldEntity`, `GoldRelation`, `GoldEvidenceRef`) and the
  `EvaluationDatasetStatus` enum are reused verbatim / by `$ref`. New enums are
  limited to authoring concerns: `GoldItemStatus`, `DatasetRevisionStatus`,
  `GoldAuthoringAction`, `GoldSetImportCompatibility`.
- Every authoring/import response exposes an all-false
  `GoldAuthoringMutationGuard` (`published_graph_mutated`,
  `candidate_graph_mutated`, `prompt_version_mutated`,
  `ontology_definition_mutated`, `extraction_job_started`,
  `evaluation_run_started`, `prior_run_pin_rewritten`).
- Durable DB/Alembic persistence is not required for the P0 thin slice; the
  proven deterministic process-local store pattern (with
  `reset_runtime_store()`) is acceptable. Durable persistence stays P1/P2.
- Out of scope (P1 or later unless explicitly promoted): real LLM/provider
  execution, run execution from the authoring UI, new metric names / ontology
  constraint pass-rate, MVP3/MVP4/MVP6.2 joins, governance workflow, impact
  simulation, copilot/agent runtime, connectors/plugins, multi-tenant runtime,
  ontology packs, advanced visualization, concurrent-edit locking/merge, and
  cross-project/cross-org gold-set sharing.

## Consequences

- Backend can draft additive gold-item edit/archive, `DatasetRevision`
  create/list/activate, standalone `GoldEvidence` CRUD, export, and import
  dry-run/confirm endpoints plus an OpenAPI planning artifact, without touching
  evaluation execution, candidate, prompt, ontology-definition, or graph paths,
  and without rewriting any prior run pin.
- Frontend can design a project-scoped Gold Set Manager (contextual to the
  Evaluation/Gold Set area, no ID-bound pages in the global LNB per ADR 0010)
  with edit/archive, evidence authoring, revision cut/activate (FROZEN/immutable
  badges), import dry-run compatibility (4 states + strategy), export, and a
  run→revision pin display, all with loading/empty/error/permission states.
- QA can build deterministic local acceptance: ownership gating, gold edit/archive
  lifecycle, revision freeze-on-pin/freeze-on-activate immutability, the
  reproducibility invariant (prior runs keep their pin and metrics), import
  dry-run/confirm gate, the all-false mutation guard, and MVP1–MVP6.3 regression.
- The platform preserves candidate/published graph separation, evidence/version/
  model-run/parser/audit traceability, evaluation reproducibility, no autonomous
  publish, no automatic policy enforcement, and no real LLM execution in this P0
  thin slice. The change is additive and does not alter MVP1–MVP6.3 paths or
  smokes.
