# Backend Report - Wave 40

## 담당 범위
- backlog ID: `BE6-032` (gold item edit/archive/restore + GoldEvidence CRUD),
  `BE6-033` (DatasetRevision cut/activate + immutability/run-pinning),
  `BE6-034` (export/import dry-run+confirm + audit log),
  `BE6-035` (OpenAPI export/alignment + no-mutation regression guard).
- 작업 경로: `apps/backend/app/modules/goldset_authoring/` (new, additive),
  `apps/backend/app/api/router.py` (registration after evaluation/benchmark),
  `apps/backend/tests/test_mvp6_4_goldset_authoring_api.py` (new).
- MVP6.4 Gold Set Authoring + Dataset Revisioning thin runtime slice — the 5
  frozen endpoint families implemented exactly per the frozen contract.

## 완료한 작업
- New additive module `goldset_authoring` (schemas + service + router),
  registered after evaluation/benchmark. No MVP1–MVP6.3 surface touched.
- **A. Gold item edit/archive/restore** for entities + relations. Edit is PATCH
  (≥1 mutating field), archive is soft (`status=ARCHIVED`, `archived_at` set),
  restore requires currently-ARCHIVED (else `409 GOLD_ITEM_INVALID_TRANSITION`).
  Never hard-deletes.
- **B. Standalone `GoldEvidence` CRUD** (attach/list/get/edit/archive). All 7
  `GoldEvidenceRef` fields preserved verbatim; XOR target
  (`gold_entity_id`/`gold_relation_id`, else `400 GOLD_EVIDENCE_TARGET_INVALID`);
  attach mirrors `evidence_id` onto the target gold item (back-compat); archive
  soft, never delete.
- **C. DatasetRevision cut/list/get/activate.** Cut snapshots current
  non-archived gold items+samples; `activate=false`→DRAFT, `activate=true`→ACTIVE
  and prior ACTIVE→FROZEN(`NEWER_REVISION_ACTIVATED`). Activate only a DRAFT
  (`409 REVISION_NOT_DRAFT`; `409 REVISION_FROZEN` on frozen/archived). At most
  one ACTIVE per dataset enforced.
- **FROZEN freeze-on-pin rule (implemented exactly as PM-frozen).** When a
  revision's `pinned_run_count > 0`, it TRANSITIONS to `status=FROZEN`
  (`frozen_reason=PINNED_BY_RUN`, `is_immutable=true`) — a real status
  transition, derived at read time and applied before every immutability check.
  No ACTIVE-but-immutable state: `is_immutable == (status in {FROZEN,ARCHIVED})`
  always. If the pinned revision was ACTIVE, the dataset's ACTIVE slot is vacated
  (`active_version_id` → null). Mutating a FROZEN revision's item/evidence →
  `409 GOLD_ITEM_IMMUTABLE`; activating frozen → `409 REVISION_FROZEN`.
- **Reproducibility:** `EvaluationRun.dataset_version_id` is NEVER rewritten.
  Run pins live in a separate process-local map; the test helper
  `pin_run_to_revision` refuses to rewrite an existing pin. An old run still
  resolves its exact FROZEN snapshot after edit/archive/cut/import.
- **D. Export GET** (`GoldSetExportBundle`, single revision, no
  prompts/candidates/published/secrets, all-false guard) + **import dry-run**
  (`GoldSetImportReport` with 4 compat states; mutates nothing) + **confirm**
  (explicit `GoldSetImportStrategy`; INCOMPATIBLE→`409 IMPORT_INCOMPATIBLE`;
  WARNING needs ack→`409 IMPORT_WARNINGS_NOT_ACKNOWLEDGED`; always creates a NEW
  dataset/revision, never edits a FROZEN one; no auto-merge).
- **E. Authoring audit log** (read-only list, filter by `action`). Every
  authoring action records a `GoldAuthoringAuditEntry` (actor/target/before-after/
  reason/timestamp) covering all 9 `GoldAuthoringAction`.
- Every authoring/import response carries the all-false 7-flag
  `GoldAuthoringMutationGuard`. Owner/admin-only authoring via
  `GoldAuthoringCapabilities`; non-owner authoring → `403 PERMISSION_DENIED`,
  reads open to all. `actor_id` query param (dev auth, default `dev-user`;
  `admin` = admin override).
- Deterministic process-local store seeded with one expert-owned dataset
  (`project-corp-knowledge-authoring-dataset`) carrying a FROZEN v1 (pinned by an
  existing run) + ACTIVE v2. `reset_runtime_store()` hook for test/smoke
  determinism, consistent with the MVP6.1 evaluation store pattern.
- Reused MVP6.1 shapes by import/subclass (no rename): `EvaluationDataset`,
  `EvaluationSample`, `GoldEntity`, `GoldRelation`, `GoldEvidenceRef`.
  `GoldEntityAuthoringView`/`GoldRelationAuthoringView` are the MVP6.1 shapes +
  `GoldItemAuthoringOverlay` (additive read fields). No new metric names.

## 변경 파일
- `apps/backend/app/modules/goldset_authoring/__init__.py` (new)
- `apps/backend/app/modules/goldset_authoring/schemas.py` (new)
- `apps/backend/app/modules/goldset_authoring/service.py` (new)
- `apps/backend/app/modules/goldset_authoring/router.py` (new)
- `apps/backend/app/api/router.py` (registered router after benchmark)
- `apps/backend/tests/test_mvp6_4_goldset_authoring_api.py` (new, 21 tests)

## 실행/검증
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_4_goldset_authoring_api.py -q`
  → `21 passed in 4.40s`
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_evaluation_api.py -q`
  → `4 passed in 1.44s`
- `cd apps/backend && .venv/bin/pytest -q` (full backend suite, regression)
  → `77 passed in 10.01s`
- `cd apps/backend && .venv/bin/ruff check app tests scripts`
  → `All checks passed!`
- OpenAPI export/parse/compare (`scripts/export_openapi.py` → runtime spec):
  runtime `openapi: 3.1.0`; all 17 MVP6.4 draft paths present in runtime
  (`MISSING in runtime: []`), 20 operations on those paths (draft declares 20);
  all 7 enums (`GoldItemStatus`, `DatasetRevisionStatus`, `GoldAuthoringAction`,
  `GoldSetImportCompatibility`, `GoldSetImportStrategy`, `RevisionFrozenReason`,
  `AuditTargetKind`) literal-match draft.
- `git diff --check` → clean.
- 인터프리터: `apps/backend/.venv/bin/python` (Python 3.13) present and used.
- 실행하지 못한 검증: 없음.

## API/Enum/DTO 변경
- 변경 여부: 있음 (additive only — new MVP6.4 module/paths/DTOs/enums).
- 상세: implements the frozen MVP6.4 contract verbatim. No MVP6.1 field/enum
  rename; no new `EvaluationMetricName`; no MVP1–MVP6.3 path renamed/removed.
  FastAPI splits `GoldSetExportBundle` into `-Input`/`-Output` runtime variants
  (it is both request and response); fields are identical to the draft.
- 영향받는 역할: Frontend (`FE6-053`~`FE6-056`), QA (`INT6-039`~`INT6-042`).

## Blocker
- 없음.

## 남은 TODO
- Durable DB/Alembic persistence (P1/P2) — out of scope for the thin slice.
- Pagination `limit`/`cursor` accepted in contract but list responses are
  deterministic single-page (`next_cursor=null`) for the thin slice.

## 다른 역할에 전달할 내용
- PM: frozen freeze-on-pin rule implemented exactly (status transition, not a
  flag; vacated ACTIVE slot). No scope expansion.
- Backend: n/a.
- Frontend (contract details):
  - **Auth/capability hint:** pass acting user as `?actor_id=` (dev auth; default
    `dev-user`, `admin` overrides ownership). Every list/get/mutation carries
    `GoldAuthoringCapabilities` (`can_view` + 6 author flags); disable actions
    where false. Non-owner authoring → `403 PERMISSION_DENIED`.
  - **Mutation guard:** every authoring/import response includes the all-false
    7-flag `GoldAuthoringMutationGuard`.
  - **Mutation envelopes:** gold-entity/relation/evidence responses =
    `{ gold_* , audit_entry, mutation_guard, capabilities }`. Revision responses
    = `{ revision, dataset, frozen_revision_id, audit_entry, mutation_guard,
    capabilities }`. `frozen_revision_id` names the prior revision that just
    froze (badge it FROZEN/immutable).
  - **Export DTO:** GET `/dataset-revisions/{id}/export` → `GoldSetExportBundle`
    (`bundle_version="gold-set-bundle/1.0"`, `source_*`, `revision_status`,
    `ontology_version_id`, `exported_at`, `samples[]`, `gold_entities[]`,
    `gold_relations[]`, `gold_evidence[]`, `mutation_guard`). No
    prompts/candidates/published/secrets.
  - **Import flow:** POST `/projects/{pid}/gold-set-imports` with `{ bundle }` →
    `GoldSetImportReport` (`import_id`, `compatibility` ∈ COMPATIBLE/WARNING/
    CONFLICT/INCOMPATIBLE, `bundle_summary`, `issues[]`, `allowed_strategies[]`,
    `blocking`). Then POST `/{import_id}/confirm` with
    `{ strategy, target_dataset_id?, activate?, acknowledge_warnings? }` →
    `GoldSetImportConfirmResponse`. INCOMPATIBLE → `allowed_strategies=[]`,
    `blocking=true`, confirm `409 IMPORT_INCOMPATIBLE`. WARNING confirm without
    `acknowledge_warnings=true` → `409 IMPORT_WARNINGS_NOT_ACKNOWLEDGED`.
    `NEW_REVISION_OF_EXISTING` requires `target_dataset_id`. Import always creates
    a NEW dataset/revision (default DRAFT); never edits a FROZEN revision; no
    auto-merge.
  - **409 codes to surface:** `GOLD_ITEM_IMMUTABLE` (edit item/evidence on a
    FROZEN revision), `REVISION_FROZEN` (activate frozen), `REVISION_NOT_DRAFT`
    (activate non-DRAFT), `GOLD_ITEM_INVALID_TRANSITION` (restore non-archived /
    empty PATCH), `IMPORT_INCOMPATIBLE`, `IMPORT_WARNINGS_NOT_ACKNOWLEDGED`,
    `IMPORT_STRATEGY_REQUIRED`. 400: `GOLD_EVIDENCE_TARGET_INVALID`. 403:
    `PERMISSION_DENIED`. 404: `DATASET_NOT_FOUND`/`REVISION_NOT_FOUND`/
    `GOLD_ITEM_NOT_FOUND`/`GOLD_EVIDENCE_NOT_FOUND`/`IMPORT_NOT_FOUND`.
  - **Freeze-on-pin behavior to render:** a revision becomes FROZEN
    (`frozen_reason=PINNED_BY_RUN`) once any run pins it; if it was ACTIVE the
    dataset has no ACTIVE revision until a new one is cut/activated
    (`active_version_id` may be null). Authoring overview `pinned_runs[]`
    (`RunRevisionPin`) shows each run's pinned `dataset_version_id` +
    `revision_status` + `pin_immutable` — use it to make reproducibility visible.
- QA: gate R5 tests one behavior (FROZEN transition on pin). Run-pin map is
  separate and never rewritten; `pin_run_to_revision` rejects rewrite. Use
  `service.reset_runtime_store()` + `service.run_pin(run_id)` /
  `service.pin_run_to_revision(...)` for deterministic R5/R6 checks.

## 총괄에게 요청하는 결정
- 없음.

## 현재 판정
- PASS — 5 endpoint families implemented additively to the frozen contract; 17/17
  MVP6.4 paths + 7 enums align with the draft; freeze-on-pin transition,
  FROZEN/ARCHIVED 409 immutability, at-most-one-ACTIVE, run-pin-never-rewritten,
  owner/admin-only 403, all-false mutation guard, import dry-run/compat-states/
  strategy/INCOMPATIBLE-blocked/no-auto-merge, archive-not-delete, audit log all
  verified. New file 21/21, evaluation 4/4, full suite 77/77, ruff clean,
  `git diff --check` clean.
