# PM Report - Wave 40

## 담당 범위
- backlog ID: `PM6-022` (PM / MVP6.4 Implementation Scope Guard + Freeze-on-pin Freeze)
- 작업 경로: `docs/` planning/contract/backlog only. No `apps/` or `infra/` touched.
- Role: runs FIRST, BLOCKS Backend (`BE6-032`~`BE6-035`) and Frontend
  (`FE6-053`~`FE6-056`). Freeze the open Wave39 freeze-on-pin gate + confirm the
  scope guard so QA gate R5 tests ONE behavior.

## 완료한 작업
- **Froze the freeze-on-pin rule (single, authoritative).** Resolved the Wave39
  open gate (Backend Open Q1) and the contradiction the draft carried between
  "FROZEN=immutable / at most one ACTIVE" and the draft's "orthogonal,
  ACTIVE-but-immutable" phrasing. **Ruling = Option A made consistent via a
  status transition (not a flag):**
  - The moment a revision's `pinned_run_count` becomes `> 0` (any `EvaluationRun`
    pins it), the revision **transitions to `status=FROZEN`**
    (`frozen_reason=PINNED_BY_RUN`, `is_immutable=true`).
  - There is **no ACTIVE-but-immutable state**. `is_immutable` is always exactly
    `status in {FROZEN, ARCHIVED}`. "At most one ACTIVE per dataset" is never
    contradicted.
  - If the pinned revision was the dataset's ACTIVE revision, the freeze
    **vacates the ACTIVE slot**: the dataset has no ACTIVE revision
    (`active_version_id` may be null) until the owner cuts/activates a new one.
  - An ACTIVE revision is fully mutable up until it freezes. Once FROZEN, any
    mutation against it or its gold items/evidence returns
    `409 REVISION_FROZEN` / `409 GOLD_ITEM_IMMUTABLE`. To keep editing, the owner
    cuts a new revision (snapshot) and edits that DRAFT, then activates it.
  - `EvaluationRun.dataset_version_id` is NEVER rewritten; the prior FROZEN
    revision and every run pinned to it are untouched. (MVP6.4 starts no runs;
    the freeze is derived from existing run pins at read time and applied as the
    FROZEN transition above.)
  - **Rationale:** a status transition keeps the state model single-valued and
    self-consistent (`is_immutable ⇔ FROZEN/ARCHIVED`), which is the simplest
    thing for Backend/Frontend/QA to implement and test, while fully preserving
    reproducibility — a pinned snapshot can never be mutated in place. The
    rejected "orthogonal flag" framing would have allowed ACTIVE+immutable, a
    contradictory state that complicates every badge, guard, and assertion.
- **Confirmed no scope expansion.** Wave40 stays the frozen P0 demo flow + the 5
  endpoint families (A gold item edit/archive/restore; B standalone GoldEvidence
  CRUD; C DatasetRevision cut/list/get/activate; D export GET + import
  dry-run/confirm; E authoring audit log). No new metric/enum/path beyond the
  frozen set; P1+ (real LLM, run engine, governance, agents, connectors,
  concurrent-edit merge, cross-project sharing) stays out.
- **Restated the Wave40 acceptance gates** (below, "다른 역할에 전달").
- Refined the brief, ADR 0011, and the API contract draft minimally and
  consistently to the frozen rule; removed the "open question / needs ruling"
  language and the contradictory "orthogonal / immutable-while-active" phrasing.
- Recorded Wave40 implementation IDs in `MVP6_DRAFT_BACKLOG.md` (`PM6-022`,
  `BE6-032`~`BE6-035`, `FE6-053`~`FE6-056`, `INT6-039`~`INT6-042`).

## 변경 파일
- `docs/api/MVP6_4_GOLD_SET_AUTHORING_API_CONTRACT_DRAFT.md` — freeze-on-pin
  section rewritten to the frozen rule; `DatasetRevisionStatus` table + reproducibility
  paragraph sharpened (FROZEN transition, no ACTIVE-but-immutable); Open Question
  Q1 marked RESOLVED.
- `docs/adr/0011-mvp6-4-gold-set-authoring-revision-immutability-boundary.md` —
  immutability decision bullet sharpened to the FROZEN-transition rule + vacated-ACTIVE
  consequence + `409` codes.
- `docs/pm/MVP6_4_GOLD_SET_AUTHORING_BRIEF.md` — `DatasetRevisionStatus` FROZEN
  bullet aligned to the frozen rule.
- `docs/backlog/MVP6_DRAFT_BACKLOG.md` — added `PM6-022`, `BE6-032`~`BE6-035`,
  `FE6-053`~`FE6-056`, `INT6-039`~`INT6-042`.
- `docs/handoffs/wave-040/PM_REPORT.md` — this report.

## 실행/검증
- 실행한 명령: `git diff --check`
- 결과: clean (no whitespace/conflict errors).
- apps/infra leakage: none — docs-only.
- 실행하지 못한 검증: none required for a PM docs-only gate.

## API/Enum/DTO 변경
- 변경 여부: 없음 (no new/renamed API path, DTO, or enum). Docs-only refinement
  of an already-frozen contract; enum names (`GoldItemStatus`,
  `DatasetRevisionStatus`, `GoldAuthoringAction`, `GoldSetImportCompatibility`,
  `GoldSetImportStrategy`) and `RevisionFrozenReason` values are unchanged. The
  ruling only fixes the semantics/timing of the existing `FROZEN` /
  `PINNED_BY_RUN` / `is_immutable` fields.
- 영향받는 역할: Backend (`BE6-032`~`BE6-035`), Frontend (`FE6-053`~`FE6-056`),
  QA (`INT6-039`~`INT6-042`).

## Blocker
- 없음.

## 남은 TODO
- Backend implements the 5 families against the frozen rule + OpenAPI exactly.
- Frontend implements the Gold Set Manager; FROZEN read-only + immutable banner
  must reflect the no-ACTIVE-but-immutable rule and the vacated-ACTIVE case.
- QA validates runtime gates R1-R12, freeze-on-pin (R5), reproducibility,
  all-false guard, regression.

## 다른 역할에 전달할 내용
- **THE EXACT FROZEN FREEZE-ON-PIN RULE (implement/test this one behavior):**
  When a revision's `pinned_run_count` becomes `> 0`, the revision **transitions
  to `status=FROZEN`** (`frozen_reason=PINNED_BY_RUN`, `is_immutable=true`) — a
  status transition, NOT a flag on ACTIVE; there is no ACTIVE-but-immutable
  state, so `is_immutable == (status in {FROZEN, ARCHIVED})` always. If the
  pinned revision was ACTIVE, the dataset's ACTIVE slot is vacated
  (`active_version_id` may be null) until a new revision is cut/activated.
  Mutating a FROZEN revision or its gold items/evidence returns
  `409 REVISION_FROZEN` / `409 GOLD_ITEM_IMMUTABLE`; to keep editing, cut a new
  DRAFT revision. `EvaluationRun.dataset_version_id` is never rewritten. Runs pin
  only ACTIVE or FROZEN, never DRAFT.
- **Wave40 acceptance gates (all roles):**
  - all-false 7-flag `GoldAuthoringMutationGuard` on every authoring/import
    response (`published_graph_mutated`, `candidate_graph_mutated`,
    `prompt_version_mutated`, `ontology_definition_mutated`,
    `extraction_job_started`, `evaluation_run_started`, `prior_run_pin_rewritten`).
  - no MVP6.1 field/enum renames (reuse by `$ref`/`allOf` overlay).
  - `EvaluationRun.dataset_version_id` never rewritten by any authoring action;
    an old run resolves its exact snapshot.
  - owner/admin-only authoring (`GoldAuthoringCapabilities` + `403` for others).
  - import dry-run-first; explicit `GoldSetImportStrategy` on confirm; `CONFLICT`
    never auto-merged; `INCOMPATIBLE` blocked (`409`); never edits a FROZEN
    revision (always new dataset or new revision).
  - archive/freeze, never hard-delete (gold items/evidence/revisions).
- Backend: deterministic process-local store + `reset_runtime_store()` per the
  MVP6.1 evaluation pattern (`apps/backend/app/modules/evaluation/service.py`
  has the precedent); field/enum names must match `openapi-mvp6-4-draft.json`.
- Frontend: make reproducibility visible (each run shows its pinned FROZEN
  revision); no publish/enforce/auto-merge copy.
- QA: gate R5 now tests one behavior (FROZEN transition on pin); independently
  confirm run-pin-not-rewritten at data level.

## 총괄에게 요청하는 결정
- 없음. The single open gate is now frozen within the PM mandate; no commander
  decision required to unblock Backend/Frontend.

## 현재 판정
- PASS — freeze-on-pin rule frozen unambiguously, scope confirmed unchanged,
  acceptance gates restated, brief/ADR/contract/backlog refined consistently,
  `git diff --check` clean, docs-only (no `apps/` change). Backend (`BE6-032`~)
  and Frontend (`FE6-053`~) are unblocked.
