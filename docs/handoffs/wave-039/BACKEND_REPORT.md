# Backend Report - Wave 39

## 담당 범위
- backlog ID: `BE6-028` (theme `PM6-021`; FE `FE6-049`; QA `INT6-026`)
- 작업 경로: `docs/api/` (planning docs only). No `apps/` or `infra/` touched.
- Scope: CONTRACT-FIRST PLANNING ONLY — additive Gold Set authoring + dataset
  revisioning API contract + OpenAPI planning artifact for MVP6.4. No runtime
  code, models, migrations, or tests.

## 완료한 작업
- Drafted `docs/api/MVP6_4_GOLD_SET_AUTHORING_API_CONTRACT_DRAFT.md`: additive
  endpoint families + DTO/enum names for the frozen P0 flow (open dataset as
  owner → edit/archive/restore gold item → attach/edit standalone Gold Evidence
  → cut new revision (prior FROZEN/immutable) → export JSON bundle → import
  dry-run compatibility → confirm with strategy → existing run still pins its
  revision). Reuses MVP6.1 shapes by reference (no renames).
- Used the PM-frozen enums verbatim: `GoldItemStatus` (DRAFT/ACTIVE/ARCHIVED),
  `DatasetRevisionStatus` (DRAFT/ACTIVE/FROZEN/ARCHIVED), `GoldAuthoringAction`
  (the 9 audit actions), `GoldSetImportCompatibility`
  (COMPATIBLE/WARNING/CONFLICT/INCOMPATIBLE). Added Backend-delegated
  `GoldSetImportStrategy` (CREATE_NEW_DATASET / NEW_REVISION_OF_EXISTING) per the
  brief's explicit delegation.
- Modeled the all-false 7-flag `GoldAuthoringMutationGuard` on every
  authoring/import response, expert-owner/admin-only authorization
  (`GoldAuthoringCapabilities` + `403 PERMISSION_DENIED`), FROZEN immutability,
  archive-not-delete, and the never-rewritten `EvaluationRun.dataset_version_id`
  pin (`prior_run_pin_rewritten: false`).
- Produced `docs/api/openapi-mvp6-4-draft.json` (OpenAPI 3.1.0, version
  `0.6.4-draft`), additive/disjoint to MVP1–MVP6.3 paths.
- Captured open questions for Frontend/QA (revision-cut/freeze-on-pin semantics,
  import conflict resolution, evidence object identity).

## 변경 파일
- `docs/api/MVP6_4_GOLD_SET_AUTHORING_API_CONTRACT_DRAFT.md` (new)
- `docs/api/openapi-mvp6-4-draft.json` (new)
- `docs/handoffs/wave-039/BACKEND_REPORT.md` (this report)

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp6-4-draft.json > /dev/null` → `PARSE_OK`
  - ref-integrity check (custom) → no dangling refs, no unreferenced schemas
  - `git diff --check` → clean (no whitespace errors)
  - apps/infra leakage check → `NO_APPS_INFRA_CHANGES`
- 결과 (parse metadata): `openapi 3.1.0`, `info.version 0.6.4-draft`,
  **17 path objects**, **20 operations**, **45 schemas**, **9 parameters**. All
  45 schemas reachable.
- 실행하지 못한 검증: full OpenAPI 3.1 semantic linter not run (only stdlib JSON
  parse + custom ref-integrity available offline). No runtime tests by design.

## API/Enum/DTO 변경
- 변경 여부: 있음 (planning-only, additive)
- 상세:
  - New enums: `GoldItemStatus`, `DatasetRevisionStatus`, `GoldAuthoringAction`,
    `GoldSetImportCompatibility` (all PM-frozen, verbatim); `GoldSetImportStrategy`,
    `RevisionFrozenReason` (`NEWER_REVISION_ACTIVATED`/`PINNED_BY_RUN`),
    `AuditTargetKind` (Backend-delegated helper enums).
  - New endpoint families (additive): A) gold item edit/archive/restore;
    B) standalone `GoldEvidence` CRUD; C) `DatasetRevision` cut/list/get/activate;
    D) export GET + import dry-run/confirm; E) authoring audit log.
  - Key DTOs: `DatasetRevision`, `GoldEvidence`, `DatasetAuthoringOverview`,
    `RunRevisionPin`, `GoldSetExportBundle`, `GoldSetImportReport`,
    `GoldSetImportConfirmResponse`, `GoldAuthoringAuditEntry`,
    `GoldAuthoringMutationGuard`, mutation-response envelopes, and an
    `allOf` overlay (`GoldItemAuthoringOverlay` →
    `GoldEntityAuthoringView`/`GoldRelationAuthoringView`) exposing additive
    read fields on MVP6.1 `GoldEntity`/`GoldRelation` without renaming them.
  - No MVP1–MVP6.3 path/schema/enum renamed, moved, or removed. No new
    `EvaluationMetricName`.
- 영향받는 역할: Frontend (`FE6-049`), QA (`INT6-026`).

## Blocker
- 없음. (One ruling needed — see "총괄에게 요청하는 결정".)

## 남은 TODO
- Wave40 thin implementation: FastAPI routes, deterministic process-local store
  (`reset_runtime_store()`), no DB/Alembic required for P0.
- Resolve open questions (esp. freeze-on-pin trigger timing + evidence object
  authority) before runtime.
- In a consolidated spec, the 6 mirrored MVP6.1 shapes should become `$ref`s
  into the MVP6.1 OpenAPI rather than re-declared mirrors (the standalone
  artifact re-declares them with a "reused verbatim, not renamed" description).

## 다른 역할에 전달할 내용
- PM: brief/ADR enums used verbatim. One decision requested below
  (freeze-on-pin timing) — it changes the immutability/UX rule.
- Backend: Wave40 must keep `EvaluationRun.dataset_version_id` write-frozen and
  expose the all-false 7-flag guard on every authoring/import response.
- Frontend (`FE6-049`):
  - Authoring is owner/admin-only; consume `GoldAuthoringCapabilities` to
    gate/disable actions; non-owners get read + permission state.
  - Revision immutability + run-pinning: a FROZEN revision is immutable; an
    existing run keeps its `dataset_version_id` pin forever (surface
    `RunRevisionPin.pin_immutable`). Draft assumption: an ACTIVE revision that
    becomes pinned is immutable-while-active and editing branches a new DRAFT
    revision — confirm this UX (Open Q1).
  - Import is dry-run-first: render the 4-state `GoldSetImportCompatibility` +
    `issues[]`, require an explicit `GoldSetImportStrategy` on confirm
    (`CONFLICT` is never auto-merged), and an `acknowledge_warnings` gate on
    `WARNING`.
  - Standalone `GoldEvidence` has its own id; embedded `evidence` field retained
    for back-compat — confirm authority/sync rule (Open Q3).
- QA (`INT6-026`): assert all-false 7-flag guard on every authoring/import
  response; FROZEN immutability (`409 GOLD_ITEM_IMMUTABLE`/`REVISION_FROZEN`);
  prior runs keep pin + metrics; import dry-run→confirm gate; archive-not-delete;
  owner-gating `403`; OpenAPI parse + additive/no-rename regression vs MVP1–6.3.

## 총괄에게 요청하는 결정
- **Freeze-on-pin trigger timing (Open Q1).** MVP6.4 starts no runs, so
  `PINNED_BY_RUN` freeze is derived from existing run pins. Draft assumes
  `pinned_run_count > 0 ⇒ is_immutable=true even while ACTIVE` (force a DRAFT
  branch to keep editing). Alternative: freeze only on activation of a newer
  revision, treat pin as advisory. This affects the immutability rule, the FE
  badge/branch UX, and the QA assertion — please rule before Wave40.

## 현재 판정
- PASS — contract draft + OpenAPI artifact complete, parse + ref-integrity +
  diff-check clean, additive/planning-only, no apps/infra leakage. Ready for
  Frontend (`FE6-049`) and QA (`INT6-026`) review.
