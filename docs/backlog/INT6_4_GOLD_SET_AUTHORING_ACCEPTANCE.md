# INT6.4 MVP6.4 Gold Set Authoring + Dataset Revisioning Acceptance Checklist

Status: `WAVE39 QA CONTRACT-FIRST PLANNING ACCEPTANCE`
Date: 2026-06-30
Owner: QA / Integration
Backlog: `INT6-035` (theme `PM6-021`; Backend `BE6-028`~`BE6-031`; Frontend `FE6-049`~`FE6-052`)

This checklist turns `INT6-035`~`INT6-038` into contract-first acceptance
criteria for MVP6.4 **Gold Set authoring policy + dataset revisioning** — an
expert-owned, candidate/analysis-layer authoring + revisioning surface over the
closed MVP6.1 evaluation datasets. Wave39 is **planning only**. Runtime API,
FastAPI service, database model, Alembic migration, frontend route/component,
seed data, smoke script, and test implementation remain out of scope until a
Wave40 thin-implementation order is explicitly opened.

> **QA ID correction (Wave39).** The PM report proposed QA IDs
> `INT6-026`~`INT6-029`, but `INT6-026`~`INT6-034` are **already consumed** by
> the closed UI/UX waves 35–38 (`CURRENT_STATE.md`: Wave35 `INT6-026..028`,
> Wave36 `INT6-029/030`, Wave37 `INT6-031/032`, Wave38 `INT6-033/034`). This
> theme therefore uses **`INT6-035`~`INT6-038`** so the backlog stays
> consistent. `docs/backlog/MVP6_DRAFT_BACKLOG.md` was updated to match.

## Source Documents

- Agent rules: `AGENTS.md`
- Handoff process: `.agents/skills/handoff-reporting/SKILL.md`
- Current state: `docs/handoffs/CURRENT_STATE.md`
- Wave order: `docs/handoffs/wave-039/NEXT_ORDERS.md`
- PM report: `docs/handoffs/wave-039/PM_REPORT.md`
- Backend report: `docs/handoffs/wave-039/BACKEND_REPORT.md`
- Frontend report: `docs/handoffs/wave-039/FRONTEND_REPORT.md`
- PM brief: `docs/pm/MVP6_4_GOLD_SET_AUTHORING_BRIEF.md`
- ADR: `docs/adr/0011-mvp6-4-gold-set-authoring-revision-immutability-boundary.md`
- API draft: `docs/api/MVP6_4_GOLD_SET_AUTHORING_API_CONTRACT_DRAFT.md`
- OpenAPI draft: `docs/api/openapi-mvp6-4-draft.json`
- Frontend requirements: `docs/pm/MVP6_4_FRONTEND_UX_REQUIREMENTS.md`
- Format precedent: `docs/backlog/INT6_3_BENCHMARK_COMPARISON_ACCEPTANCE.md`
- MVP6 backlog: `docs/backlog/MVP6_DRAFT_BACKLOG.md`

## MVP6.4 P0 Boundary

Frozen P0 demo flow (PM brief §2, ADR 0011, Backend draft, Frontend requirements
all agree):

```text
select project
-> open Gold Set Manager (Evaluation / Gold Set area, as the dataset's expert owner)
-> edit a gold entity / gold relation OR archive a stale gold item
-> attach / edit a standalone Gold Evidence object on a gold item
-> cut a new dataset revision (prior revision becomes FROZEN / immutable)
-> export the dataset revision to a portable JSON bundle
-> import a bundle (dry-run compatibility report -> confirm with a strategy)
-> open an existing run and confirm it still points at the revision it used
```

Authoring reads/writes **only** MVP6.1 evaluation artifacts (dataset / sample /
gold entity / gold relation / evidence / revision) + an authoring audit log. It
executes no run, calls no LLM, mutates no candidate / published / prompt /
ontology-definition surface, and never rewrites a prior run's
`dataset_version_id` or metrics.

Approved source artifact families (reused verbatim / by `$ref`, no rename):

- `EvaluationDataset` (`owner_id` enforced expert owner; `active_version_id` FK
  to the ACTIVE `DatasetRevision`; `status` `EvaluationDatasetStatus`).
- `EvaluationSample` (captured into a revision snapshot).
- `GoldEntity` / `GoldRelation` (gain additive `GoldItemStatus` lifecycle +
  revision pin via an `allOf` overlay; field names unchanged).
- `GoldEvidenceRef` (promoted to ALSO be a first-class `GoldEvidence` object;
  embedded `evidence` field retained for back-compat).
- `EvaluationRun.dataset_version_id` (the authoritative run→revision pin; never
  rewritten).

P0 exclusions:

- real LLM / provider execution, new run execution from the authoring UI,
  fine-tuning, training-dataset export execution;
- new `EvaluationMetricName`, ontology constraint pass-rate, MVP6.3 comparison
  changes;
- MVP6.2 learning-signal, MVP3 review/correction, MVP4 quality, published-graph
  joins;
- ontology governance, impact simulation, copilot/agent runtime, connector/plugin
  SDK, multi-tenant runtime, ontology packs, advanced visualization;
- multi-user concurrent-edit locking/merge, revision diff visualization beyond a
  counts/compatibility summary, cross-project / cross-org gold-set sharing;
- hard-delete of any gold item / evidence / revision (archive / freeze only);
- durable DB/Alembic persistence (process-local store with
  `reset_runtime_store()` is acceptable; durable persistence stays P1/P2).

## Verdict Semantics

- `PASS`: planning artifacts agree and preserve the authoring safety boundary +
  reproducibility invariant.
- `PARTIAL`: contract is usable for review, but named fields/enums or
  implementation-facing details need targeted hardening before runtime work.
- `FAIL`: planning opens forbidden runtime scope, removes evidence/version/
  model-run traceability, allows candidate/published graph / prompt / ontology
  mutation, rewrites a prior run's pin/metrics, hard-deletes gold data, or
  renames a reused MVP6.1 field (breaking).
- `NOT RUNNABLE`: expected for runtime checks (R-series) before Wave40 because no
  MVP6.4 runtime implementation exists by design.

## Current Wave39 QA Verdict

| ID | Verdict | QA note |
|---|---|---|
| `INT6-035` | `PASS` (planning) | PM brief, ADR 0011, Backend contract/OpenAPI, and Frontend requirements agree on the P0 flow, frozen enums/states, MVP6.1-only source artifacts (reuse-by-`$ref`, no rename), the expert-owner authoring safety boundary, and later-theme exclusions. OpenAPI parses (3.1.0, `0.6.4-draft`, 17 path objects / 20 operations / 45 schemas / 9 parameters); all 5 endpoint families, all 5 frozen enums (exact literals), the all-false 7-flag `GoldAuthoringMutationGuard`, and the key DTOs are present. Runtime-leakage search under `apps/`/`infra/` found no MVP6.4 implementation. Runtime acceptance (R1–R12) is `NOT RUNNABLE` by design. |
| `INT6-036` | `PASS` (planning) | Reproducibility + revision-immutability invariant is frozen identically in brief §5, ADR 0011 Decision, contract §Preserved Boundary, and FE §4: `EvaluationRun.dataset_version_id` never rewritten; FROZEN revisions immutable; runs pin only ACTIVE/FROZEN, never DRAFT; at most one ACTIVE per dataset; archive/freeze, never hard-delete. The exact freeze-on-pin trigger timing is captured as the **Wave40 PM-freeze gate** (see below), not a Wave39 blocker. |
| `INT6-037` | `PASS` (planning) | No-mutation + ownership boundary is frozen: all-false 7-flag `GoldAuthoringMutationGuard` on every authoring/import response; expert-owner (`owner_id`) / admin-only authoring with `403 PERMISSION_DENIED` + a display-only `GoldAuthoringCapabilities` hint; import dry-run-first, explicit confirm, never auto-merge, `INCOMPATIBLE` blocked, never edits FROZEN. |
| `INT6-038` | `PASS` (planning) | All five Wave39 artifacts (brief, ADR, backlog, Backend contract/OpenAPI, Frontend requirements) agree; no runtime leaked; one open question recorded as a Wave40 PM-freeze gate. Recommendation: **Wave40 thin implementation**. |

## Wave40 PM-Freeze Gate (Backend Open Question Q1 — freeze-on-pin trigger timing)

**Recorded as an explicit Wave40 gate, analogous to how the persist-vs-compute
decision (C12) was a Wave34 gate for MVP6.3.**

The Backend draft (contract §Freeze-on-pin, Open Question Q1; BACKEND_REPORT
"총괄에게 요청하는 결정") and the Frontend draft (FE §3, gap analysis #4) both flag
the **exact freeze-on-pin trigger timing** as undecided:

- **Draft assumption:** `pinned_run_count > 0  ⇒  is_immutable = true even while
  ACTIVE`. Pin-freeze and ACTIVE status are treated as **orthogonal**: an ACTIVE
  revision that gets pinned by any run becomes immutable-while-active, and
  authoring must branch a new `DRAFT` revision to keep editing.
- **Alternative:** freeze only on activation of a newer revision; treat the pin
  as advisory while the revision is still ACTIVE.

**Tension to resolve.** The draft assumption can produce a revision that is
**simultaneously `ACTIVE` and `is_immutable=true`**. That is in mild tension with
the otherwise-clean status model where "at most one ACTIVE per dataset" and
"FROZEN ⇒ immutable" read as the two distinct immutability cases. PM must decide,
before Wave40 runtime:

1. Whether a pinned ACTIVE revision is reported as `status=ACTIVE` with a
   separate `is_immutable=true` flag (orthogonal model — draft), **or** is
   transitioned to `status=FROZEN` on first pin (status-driven model), **or** the
   pin is advisory until a newer revision is activated.
2. The resulting UX rule (FE §3): "ACTIVE-but-pinned ⇒ immutable, branch a new
   DRAFT to edit" vs "ACTIVE stays editable until superseded".
3. The QA assertion this checklist's gate **R5** must test (FROZEN-on-pin vs
   FROZEN-on-activate-only).

This gate does **not** block Wave39 planning (the invariant that matters —
`dataset_version_id` is never rewritten and old runs always resolve to an
immutable snapshot — holds under either ruling). It must be frozen by PM at the
start of Wave40 so Backend/Frontend/QA implement and test one rule.

## C1 — Scope / Flow Alignment

Exit criterion: `PASS` when all checks are true.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C1.1 | P0 demo flow identical across PM brief, ADR, Backend draft, Frontend requirements | PASS | open-as-owner → edit/archive gold item → attach/edit standalone Gold Evidence → cut revision (prior FROZEN) → export → import dry-run → confirm-with-strategy → confirm run still pins its revision is verbatim in all four (brief §2, ADR Decision, contract §Contract Principles + Endpoint Details, FE §Scope Guard / Screen Flow). |
| C1.2 | Source artifacts restricted to MVP6.1 evaluation artifacts + an authoring audit log | PASS | `EvaluationDataset`/`EvaluationSample`/`GoldEntity`/`GoldRelation`/`GoldEvidenceRef`/`EvaluationRun.dataset_version_id` reused by `$ref`/overlay; no MVP3/MVP4/MVP6.2/MVP6.3/published-graph join in any artifact. |
| C1.3 | Exclusions (P1/later) consistent across artifacts | PASS | brief §7, contract §Out of Scope, FE §Scope Guard, ADR §Decision all list the same exclusions (real LLM, run execution, new metric, MVP3/4/6.2/6.3 joins, governance/impact/agent/connector/tenant/pack/viz, concurrent-edit lock/merge, cross-project sharing, hard-delete, durable persistence P1/P2). |
| C1.4 | Wave39 changed only documentation/planning artifacts | PASS | `git diff --check` clean; runtime-leakage search found no MVP6.4 runtime; role reports state no `apps/`/`infra/` change. |

## C2 — Frozen Endpoint Families (5)

Exit criterion: `PASS` when all five families are present, additive, and
project/resource-scoped where required.

| # | Family | Criterion | Verdict | Evidence |
|---|---|---|---|---|
| C2.1 | A. Gold item authoring | `GET .../{dataset_id}/authoring`; `PATCH`/`POST .../gold-entities/{id}`(+`/archive`,`/restore`); same for `gold-relations` | PASS | 7 paths present (authoring overview + entity/relation edit/archive/restore). |
| C2.2 | B. Standalone Gold Evidence CRUD | `POST`/`GET .../{dataset_id}/gold-evidence`; `GET`/`PATCH`/`POST .../gold-evidence/{id}`(+`/archive`) | PASS | 5 evidence paths present; archive (soft) not delete. |
| C2.3 | C. Dataset revisions | `POST`/`GET .../{dataset_id}/revisions`; `GET .../dataset-revisions/{id}`; `POST .../{id}/activate` | PASS | cut / list / get / activate present. |
| C2.4 | D. Export / Import (dry-run-first) | `GET .../dataset-revisions/{id}/export`; `POST .../projects/{id}/gold-set-imports`; `POST .../{import_id}/confirm` | PASS | export + dry-run + confirm present. |
| C2.5 | E. Authoring audit log (read-only) | `GET .../{dataset_id}/authoring-audit` | PASS | audit list present. |
| C2.6 | All paths additive — no MVP1–MVP6.3 path renamed/moved/removed | PASS | standalone draft contains only the 17 MVP6.4 authoring/revision/evidence/import/audit paths; all disjoint from MVP1–6.3 path space (per-MVP draft pattern). |
| C2.7 | Authoring `POST`/`PATCH` are gated mutations of gold/evidence/revision only — never a run/graph mutation | PASS | every authoring/import response carries the all-false `GoldAuthoringMutationGuard`; contract §Safety Boundary. |

## C3 — Frozen Enums

Exit criterion: `PASS` when each enum and its literals are present and identical
across PM brief, Backend draft, OpenAPI, and Frontend requirements.

| # | Enum | Literals | Verdict |
|---|---|---|---|
| C3.1 | `GoldItemStatus` | `DRAFT`, `ACTIVE`, `ARCHIVED` | PASS |
| C3.2 | `DatasetRevisionStatus` | `DRAFT`, `ACTIVE`, `FROZEN`, `ARCHIVED` | PASS |
| C3.3 | `GoldAuthoringAction` (9) | `CREATE`, `EDIT`, `ARCHIVE`, `RESTORE`, `EVIDENCE_ATTACH`, `EVIDENCE_EDIT`, `REVISION_CUT`, `REVISION_ACTIVATE`, `IMPORT` | PASS |
| C3.4 | `GoldSetImportCompatibility` | `COMPATIBLE`, `WARNING`, `CONFLICT`, `INCOMPATIBLE` | PASS |
| C3.5 | `GoldSetImportStrategy` | `CREATE_NEW_DATASET`, `NEW_REVISION_OF_EXISTING` | PASS |
| C3.6 | `RevisionFrozenReason` (Backend-delegated helper) | `NEWER_REVISION_ACTIVATED`, `PINNED_BY_RUN` | PASS |
| C3.7 | `AuditTargetKind` (Backend-delegated helper) | `GOLD_ENTITY`, `GOLD_RELATION`, `GOLD_EVIDENCE`, `DATASET_REVISION`, `DATASET` | PASS |
| C3.8 | No new `EvaluationMetricName` introduced | PASS | the 8-metric set is untouched; `EvaluationMetricName` is not redefined in the draft. |

## C4 — Reused MVP6.1 Shapes (no renames; reuse by `$ref` / overlay)

Exit criterion: `PASS` when every reused name + field is verbatim and no MVP6.1
field is renamed.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C4.1 | `EvaluationDataset` reused verbatim (`owner_id`, `active_version_id`, `status`) | PASS | brief §3, contract §Reused; OpenAPI mirrors the shape with a "reused verbatim / not renamed" description. |
| C4.2 | `EvaluationSample` reused verbatim | PASS | captured into a revision snapshot; shape unchanged. |
| C4.3 | `GoldEntity` / `GoldRelation` not renamed; additive read fields via `GoldItemAuthoringOverlay` `allOf` | PASS | `GoldEntityAuthoringView`/`GoldRelationAuthoringView` overlay `status`/`revision_id`/`evidence_id`/`updated_at`/`archived_at` over the MVP6.1 shapes (additive, optional). |
| C4.4 | `GoldEvidenceRef` fields preserved verbatim in the standalone `GoldEvidence` | PASS | `sample_id`/`source_id`/`source_segment_id`/`locator`/`offset_start`/`offset_end`/`quote` all present (asserted in the OpenAPI); standalone adds only `id` + lifecycle + target gold ref. |
| C4.5 | `EvaluationRun.dataset_version_id` reused as the run→revision pin, never rewritten | PASS | brief §5, ADR Decision, contract §Preserved Boundary; `prior_run_pin_rewritten: false`. |
| C4.6 | No MVP6.1 field renamed (any rename = breaking FAIL) | PASS | FE §DTO Gap Analysis forbids rename (0 mismatch); Backend confirms verbatim `$ref`/overlay reuse. |

## C5 — Screen Flow Coverage

Exit criterion: `PASS` when each P0 surface maps to a contract shape.

| # | Surface | Maps to | Verdict |
|---|---|---|---|
| C5.1 | Open dataset as owner (overview) | `GET .../authoring` → `DatasetAuthoringOverview` (dataset + active revision + `gold_status_counts` + `pinned_runs[]` + `capabilities` + `mutation_guard`) | PASS |
| C5.2 | Edit gold entity/relation | `PATCH .../gold-entities|gold-relations/{id}` ← `GoldEntityEditRequest`/`GoldRelationEditRequest`; → `Gold*MutationResponse` (item + `audit_entry` + `mutation_guard` + `capabilities`) | PASS |
| C5.3 | Archive / restore gold item (soft) | `POST .../archive`, `POST .../restore`; status → `ARCHIVED` / prior; never hard-delete | PASS |
| C5.4 | Attach / edit standalone Gold Evidence | family B; `GoldEvidence` + `GoldEvidenceAttachRequest`/`GoldEvidenceEditRequest`; exactly one of `gold_entity_id`/`gold_relation_id` | PASS |
| C5.5 | Cut / activate revision | `POST .../revisions` (`DatasetRevisionCutRequest`), `POST .../{id}/activate` → `DatasetRevision` (status, `is_immutable`, `frozen_reason`, counts, `pinned_run_count`) | PASS |
| C5.6 | Export bundle | `GET .../{revision_id}/export` → `GoldSetExportBundle` (samples + gold + evidence; no prompts/candidates/published/secrets) | PASS |
| C5.7 | Import dry-run → confirm (4-state) | `POST .../gold-set-imports` → `GoldSetImportReport` (`compatibility`, `issues[]`, `allowed_strategies[]`, `blocking`); `POST .../{import_id}/confirm` ← `GoldSetImportConfirmRequest` (`strategy` + `target_dataset_id` + `acknowledge_warnings`) | PASS |
| C5.8 | Run → revision pin display | `DatasetAuthoringOverview.pinned_runs[]` → `RunRevisionPin` (`run_id`, `dataset_version_id`, `revision_status`, `pin_immutable`) | PASS |
| C5.9 | Authoring audit panel | `GET .../authoring-audit` → `GoldAuthoringAuditEntry[]` (actor, action, target ids, before/after, reason, timestamp) | PASS |
| C5.10 | First-class loading/empty/error/permission/FROZEN/dry-run/conflict/stale states defined | PASS | FE §State Requirements covers loading, no-dataset/project, no-gold-items, no-revision, no-runs-pinned, import-no-findings, error, permission-limited, FROZEN/immutable, import dry-run, conflict (409), stale. |

## C6 — Reproducibility + Revision Immutability (the load-bearing invariant)

Exit criterion: `PASS` when no authoring action can change what a prior run was
scored against, frozen identically across all artifacts.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C6.1 | `EvaluationRun.dataset_version_id` is never rewritten by any authoring action | PASS | brief §5, ADR Decision, contract §Preserved Boundary; `prior_run_pin_rewritten: false` on every response. |
| C6.2 | Edit / archive / cut-revision / import never retro-mutate prior runs' metrics or pin | PASS | brief §5, contract §POST `.../revisions` ("Never rewrites any `EvaluationRun.dataset_version_id`"), §Safety Boundary. |
| C6.3 | A revision becomes FROZEN (immutable) on newer-revision activation OR run pin | PASS (rule frozen; **trigger timing → Wave40 PM-freeze gate / R5**) | brief §4 `DatasetRevisionStatus`, ADR Decision, contract §Freeze-on-pin; exact ACTIVE-but-pinned timing recorded as the Wave40 gate above. |
| C6.4 | Authoring edits land only in DRAFT / new revision, never in a FROZEN one | PASS | contract §Contract Principles; `409 GOLD_ITEM_IMMUTABLE` / `REVISION_FROZEN`. |
| C6.5 | At most one ACTIVE revision per dataset | PASS | brief §4, ADR Decision, contract `DatasetRevisionStatus` + activate ("demotes/freezes the prior ACTIVE"). |
| C6.6 | Runs pin only ACTIVE or FROZEN revisions, never DRAFT | PASS | brief §4, contract §`DatasetRevisionStatus`. |
| C6.7 | Gold items / evidence / revisions are archived/frozen, never hard-deleted | PASS | brief §6, ADR Decision, contract §Out of Scope (hard-delete excluded); archive endpoints are soft + reversible. |
| C6.8 | Old run always resolves to its exact immutable snapshot; the UI surfaces the pinned revision + FROZEN marker | PASS | brief §5, FE §4 ("고정됨 — 기준이 바뀌지 않았습니다"); `RunRevisionPin.pin_immutable`. |

## C7 — No-Mutation Safety Boundary (all-false guard)

Exit criterion: `PASS` when the 7-flag guard is all-false and no forbidden
surface is opened.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C7.1 | `GoldAuthoringMutationGuard` exposes all 7 flags, every flag `const: false` | PASS | OpenAPI `GoldAuthoringMutationGuard.properties`: `published_graph_mutated`/`candidate_graph_mutated`/`prompt_version_mutated`/`ontology_definition_mutated`/`extraction_job_started`/`evaluation_run_started`/`prior_run_pin_rewritten` all `const: false`. |
| C7.2 | Guard present on every authoring/import response | PASS | mutation/overview/import-report/import-confirm/export envelopes all include `mutation_guard` (contract §DTO Contract). |
| C7.3 | No published-graph / candidate-graph mutation; separation untouched | PASS | brief §6, ADR, contract §Safety Boundary. |
| C7.4 | No prompt / prompt-version / ontology-definition mutation (references existing ids only) | PASS | brief §6, contract §Preserved Boundary ("references existing `ontology_class_id`/`ontology_relation_id` only"). |
| C7.5 | No extraction job / no evaluation run started; no LLM/provider call | PASS | brief §6, contract §Safety Boundary; `extraction_job_started`/`evaluation_run_started: false`. |

## C8 — Ownership / Authorization Boundary

Exit criterion: `PASS` when authoring is owner/admin-only and reads stay open.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C8.1 | Read (datasets/revisions/gold/evidence/run pins/audit) open to any project member | PASS | contract §Authorization Model. |
| C8.2 | Authoring (edit/archive/restore/evidence/cut/activate/confirm-import) limited to dataset `owner_id` or admin/PM | PASS | brief §6, ADR Decision, contract §Authorization Model. |
| C8.3 | Non-owner authoring call → `403 PERMISSION_DENIED`, never a partial mutation | PASS | contract §Authorization Model + §Error Contract. |
| C8.4 | `GoldAuthoringCapabilities` is a display-only hint (7 flags) that never widens the boundary; 403 still server-enforced | PASS | OpenAPI `GoldAuthoringCapabilities` = `can_view`/`can_edit_gold_item`/`can_archive_gold_item`/`can_author_evidence`/`can_cut_revision`/`can_activate_revision`/`can_import`; FE renders read-only / `PERMISSION_LIMITED` from it up front. |

## C9 — Import Dry-Run / Confirm Gate

Exit criterion: `PASS` when import is honest dry-run-first and never auto-merges.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C9.1 | Dry-run mutates nothing; returns `GoldSetImportReport` keyed by a server `import_id` | PASS | contract §`GoldSetImportReport` + §POST `.../gold-set-imports`. |
| C9.2 | Confirm is a distinct second step requiring an explicit `GoldSetImportStrategy` | PASS | contract §`GoldSetImportConfirmRequest`; FE §6 (two distinct steps, never auto-confirm). |
| C9.3 | `INCOMPATIBLE` blocks confirm (`blocking: true`, empty `allowed_strategies`, `409 IMPORT_INCOMPATIBLE`) | PASS | contract §`GoldSetImportReport`/§`GoldSetImportConfirmRequest`. |
| C9.4 | `CONFLICT` is never auto-merged; requires a chosen strategy (`409 IMPORT_STRATEGY_REQUIRED`) | PASS | brief §4, contract §Error Contract. |
| C9.5 | `WARNING` requires `acknowledge_warnings: true` (`409 IMPORT_WARNINGS_NOT_ACKNOWLEDGED`) | PASS | contract §`GoldSetImportConfirmRequest` + §Error Contract. |
| C9.6 | Import always creates a NEW dataset or NEW revision; never edits a FROZEN revision | PASS | brief §4, ADR Decision, contract §POST `.../confirm`. |
| C9.7 | Export bundle contains no prompts / candidates / published graph / secrets | PASS | brief §4, contract §`GoldSetExportBundle`. |

## C10 — Evidence / Version / Audit Traceability Preserved

Exit criterion: `PASS` when context is preserved and every authoring action is
audited.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C10.1 | Standalone `GoldEvidence` keeps all `GoldEvidenceRef` context (sample/source/segment/locator/offsets/quote) + adds id/lifecycle | PASS | contract §`GoldEvidence`; embedded `evidence` retained for back-compat. |
| C10.2 | Every authoring action records a `GoldAuthoringAuditEntry` (actor, action, target, before/after, reason, timestamp) | PASS | contract §`GoldAuthoringAuditEntry`; 9 `GoldAuthoringAction` literals. |
| C10.3 | Revision context echoed (ontology version, counts, parent revision, created_by) | PASS | contract §`DatasetRevision` (`ontology_version_id`, `parent_revision_id`, counts, `created_by`). |
| C10.4 | Audit is read-only and mutates no non-gold surface | PASS | contract §`GoldAuthoringAuditEntry` ("Audit-only; mutates no non-gold surface"). |

## C11 — Frontend DTO Gap Closure (8 Blocking + 4 Optional)

Exit criterion: `PASS` when all 8 Blocking FE gaps are resolved by the Backend
draft; the 4 Optional items are confirmed non-blocking.

| # | FE gap | Resolution | Verdict |
|---|---|---|---|
| 1 | Permission capability hint | `GoldAuthoringCapabilities` display-only hint on every authoring/list/get response; `403 PERMISSION_DENIED` | PASS (resolved) |
| 2 | `GoldItemStatus` on gold shapes (additive, no rename) | `GoldItemAuthoringOverlay` `allOf` adds `status`/`revision_id`/`evidence_id`/`updated_at`/`archived_at` | PASS (resolved) |
| 3 | Standalone `GoldEvidence` coexistence | nullable `evidence_id` on gold item; embedded `evidence` retained for back-compat | PASS (resolved) |
| 4 | Revision FROZEN trigger | rule frozen (FROZEN on newer-activate OR run pin; `409 GOLD_ITEM_IMMUTABLE`/`REVISION_FROZEN`); exact ACTIVE-but-pinned timing → Wave40 PM-freeze gate | PASS (resolved; timing = Wave40 gate) |
| 5 | Import strategy enum | `GoldSetImportStrategy` (`CREATE_NEW_DATASET`/`NEW_REVISION_OF_EXISTING`); `target_dataset_id` required iff `NEW_REVISION_OF_EXISTING` | PASS (resolved) |
| 6 | Dry-run report shape | `GoldSetImportReport` (`compatibility` + `issues[]` `GoldSetImportIssue` + `allowed_strategies[]` + `blocking`) | PASS (resolved) |
| 7 | `GoldAuthoringMutationGuard` 7 keys | 7 keys verbatim incl. `prior_run_pin_rewritten` | PASS (resolved) |
| 8 | Revision ↔ run-pin resolution | `active_version_id`/`dataset_version_id` resolve to `DatasetRevision.id`; `RunRevisionPin` linkage | PASS (resolved) |
| 9 | (Optional) `target_kind`/`gold_item_kind` discriminator | audit uses `AuditTargetKind`; confirm a gold read/edit discriminator at Wave40 | PASS (non-blocking) |
| 10 | (Optional) audit ordering/pagination | confirm newest-first + `limit`/`cursor` at Wave40 | PASS (non-blocking) |
| 11 | (Optional) export download contract | confirm JSON body + content-disposition vs signed URL at Wave40 | PASS (non-blocking) |
| 12 | (QA) OpenAPI parse + additivity | verified below | PASS |

## C12 — Planning-Only / No Runtime Leakage

Exit criterion: `PASS` when no MVP6.4 runtime implementation exists under
`apps/`/`infra/`.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| C12.1 | No MVP6.4 runtime identifiers under `apps/`/`infra/` | PASS | `rg 'GoldAuthoring\|DatasetRevision\|GoldItemStatus\|DatasetRevisionStatus\|GoldSetImport\|MVP6.4\|gold-set-author\|gold-set-import\|RevisionFrozenReason'` → 0 matches (exit 1). |
| C12.2 | No standalone `GoldEvidence` object in runtime (only pre-existing `GoldEvidenceRef`) | PASS | `rg 'GoldEvidence\b' apps \| rg -v GoldEvidenceRef` → 0 matches; the broad search only hit pre-existing MVP6.1 `GoldEvidenceRef` and one MVP6.3 benchmark comment string ("No run executed, no gold set authored, no graph mutated"). |
| C12.3 | `git diff --check` clean; only docs/backlog/checklist edited | PASS | `git diff --check` exit 0; Wave39 edits are PM/Backend/Frontend planning docs + this checklist + the two backlog edits. |

## Runtime Acceptance Gates (NOT RUNNABLE until Wave40)

These gates are added now so Wave40 implementation has an executable target. They
are **`NOT RUNNABLE`** in Wave39 by design — no MVP6.4 runtime exists.

| ID | Gate | Status |
|---|---|---|
| R1 | All 5 endpoint families exist in the running app and respond per contract (authoring overview / gold edit-archive-restore / evidence CRUD / revision cut-list-get-activate / export-import-dry-run-confirm / audit) | NOT RUNNABLE (Wave40) |
| R2 | Runtime DTO field names + enums match `openapi-mvp6-4-draft.json` (0 field-name mismatch on shared schemas; MVP6.1 shapes reused by `$ref` with no rename; 5 new enums + helper enums exact) | NOT RUNNABLE (Wave40) |
| R3 | Ownership gate: dataset `owner_id`/admin → authoring succeeds; non-owner authoring → `403 PERMISSION_DENIED`; reads open to members; `capabilities` hint matches enforcement | NOT RUNNABLE (Wave40) |
| R4 | Gold item edit/archive/restore lifecycle (`DRAFT`/`ACTIVE`/`ARCHIVED`); archive is soft + reversible; no hard-delete (row retained) | NOT RUNNABLE (Wave40) |
| R5 | Revision immutability: FROZEN per the **Wave40 PM-freeze ruling** (freeze-on-pin vs freeze-on-activate); edit/activate on FROZEN → `409 GOLD_ITEM_IMMUTABLE`/`REVISION_FROZEN`; at most one ACTIVE; runs never pin DRAFT | NOT RUNNABLE (Wave40) |
| R6 | Reproducibility: after edit/archive/cut/import, every prior `EvaluationRun.dataset_version_id` + its metrics are byte-identical (never rewritten); old run resolves to its immutable snapshot | NOT RUNNABLE (Wave40) |
| R7 | Standalone `GoldEvidence` CRUD preserves all `GoldEvidenceRef` fields; embedded `evidence` back-compat retained; archive not delete; authority rule (Open Q3) honored | NOT RUNNABLE (Wave40) |
| R8 | Export returns a `GoldSetExportBundle` with no prompts/candidates/published/secrets; round-trips through import dry-run | NOT RUNNABLE (Wave40) |
| R9 | Import dry-run mutates nothing; confirm requires strategy; `INCOMPATIBLE` blocked; `CONFLICT` needs strategy (no auto-merge); `WARNING` needs ack; always creates NEW dataset/revision, never edits FROZEN | NOT RUNNABLE (Wave40) |
| R10 | `mutation_guard` all-false at runtime; published/candidate/prompt/extraction/review/eval-run tables unchanged (0 rows touched) after the full authoring + import flow | NOT RUNNABLE (Wave40) |
| R11 | Authoring audit entries recorded for every action (9 `GoldAuthoringAction`) with actor/target/before-after/reason/timestamp; audit read-only | NOT RUNNABLE (Wave40) |
| R12 | MVP1–MVP6.3 regression green; additive-only; no path renamed/removed; MVP6.1 Evaluation page still reads `GoldEntity`/`GoldRelation`/`GoldEvidenceRef`/`EvaluationRun` unchanged | NOT RUNNABLE (Wave40) |

## Validation Commands (Wave39 QA — executed)

```text
python3 -m json.tool docs/api/openapi-mvp6-4-draft.json > /dev/null && echo PARSE_OK
# -> PARSE_OK

python3 <path/schema/enum assertion script over openapi-mvp6-4-draft.json>
# -> openapi 3.1.0 ; info.version 0.6.4-draft ; path_objects 17 ; operations 20 ; schemas 45 ; parameters 9
# -> 5 endpoint families (authoring / gold-entities+gold-relations edit-archive-restore /
#    gold-evidence CRUD / revisions+dataset-revisions activate / export+gold-set-imports+confirm /
#    authoring-audit): all paths present
# -> enums GoldItemStatus / DatasetRevisionStatus / GoldAuthoringAction(9) /
#    GoldSetImportCompatibility / GoldSetImportStrategy: all OK with exact literals
# -> helper enums RevisionFrozenReason / AuditTargetKind present with exact literals
# -> GoldAuthoringMutationGuard: 7 flags, every flag const:false
# -> GoldAuthoringCapabilities: 7 can_* flags present
# -> key DTOs present: DatasetRevision, GoldEvidence, DatasetAuthoringOverview, RunRevisionPin,
#    GoldSetExportBundle, GoldSetImportReport, GoldSetImportConfirmResponse,
#    GoldAuthoringAuditEntry, GoldItemAuthoringOverlay, GoldEntity/RelationAuthoringView, GoldSetImportIssue
# -> GoldEvidenceRef fields preserved verbatim (sample_id/source_id/source_segment_id/
#    locator/offset_start/offset_end/quote)
# -> no new EvaluationMetricName redefined
# -> all 17 paths are MVP6.4-additive (evaluation-datasets / dataset-revisions /
#    gold-evidence / gold-set-imports), disjoint from MVP1–6.3

rg -n 'GoldAuthoring|DatasetRevision|GoldItemStatus|DatasetRevisionStatus|GoldSetImport|MVP6.4|mvp6.4|gold-set-author|gold-set-import|RevisionFrozenReason' apps infra --glob '!**/node_modules/**'
# -> no matches (exit 1): no MVP6.4 runtime implementation leaked

rg -n 'GoldEvidence\b' apps --glob '!**/node_modules/**' | rg -v 'GoldEvidenceRef'
# -> no matches (exit 1): only pre-existing MVP6.1 GoldEvidenceRef exists; no standalone GoldEvidence runtime

git diff --check
# -> clean (exit 0)
```

Expected runtime acceptance status before Wave40 implementation:
`NOT RUNNABLE` by design. MVP6.4 runtime gates (R1–R12) are added only after the
Wave40 thin implementation is explicitly opened, and R5 must test the
freeze-on-pin rule PM freezes at the start of Wave40.

## Wave40 Recommendation

Recommended next step: `WAVE40 MVP6.4 THIN IMPLEMENTATION`.

Why:

- PM brief, ADR 0011, Backend contract/OpenAPI, and Frontend requirements agree
  on the P0 flow, frozen enums/states, MVP6.1-only source artifacts (reuse by
  `$ref`/overlay, no rename), the expert-owner authoring safety boundary, and
  later-theme exclusions.
- The OpenAPI planning artifact parses (3.1.0, `0.6.4-draft`) and exposes all 5
  frozen endpoint families, all 5 frozen enums (exact literals), the all-false
  7-flag `GoldAuthoringMutationGuard`, and all key DTOs; nothing breaks MVP1–6.3
  paths and no MVP6.1 field is renamed.
- All 8 Blocking Frontend DTO gaps are resolved by the Backend draft; the 4
  Optional items are confirmed non-blocking and deferrable to Wave40.
- No runtime implementation leaked into Wave39; the boundary is intact.
- The one open item — the freeze-on-pin trigger timing (Backend Open Q1) — is a
  Wave40 PM-freeze gate (recorded above), not a Wave39 blocker; the
  reproducibility invariant that matters (`dataset_version_id` never rewritten;
  old runs always resolve to an immutable snapshot) holds under either ruling.

Wave40 implementation should remain thin and additive:

1. PM freezes the freeze-on-pin trigger timing FIRST (the Wave40 PM-freeze gate),
   then Backend/Frontend/QA implement and test one rule (gate R5).
2. Implement only the 5 frozen endpoint families and the DTO/enum names exactly
   as drafted; reuse MVP6.1 shapes by `$ref`/overlay with no rename.
3. Expose the all-false `GoldAuthoringMutationGuard` on every authoring/import
   response; never rewrite `EvaluationRun.dataset_version_id`; never hard-delete.
4. Use a deterministic process-local store (`reset_runtime_store()`); durable
   DB/Alembic stays P1/P2.
5. Enforce expert-owner/admin authorization server-side; `capabilities` is a
   display hint only.
6. Add deterministic seed/mock/smoke evidence only for the approved P0 flow.
7. Do not broaden into run execution, LLM calls, new metrics, MVP3/4/6.2/6.3
   joins, governance, or any Theme-3+ surface.
