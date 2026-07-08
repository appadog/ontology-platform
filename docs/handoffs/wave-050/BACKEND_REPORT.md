# Backend Report - Wave 50 (MVP6.9 Connectors THIN IMPLEMENTATION — runtime slice)

## 담당 범위
- backlog ID: `BE6-070` (catalog + masked config-schema), `BE6-071` (dry-run import-preview: fixture-derived would-be candidate items + compat/summary + bounding/truncation), `BE6-072` (all-false 9-flag guard + no-secret + creates-nothing guarantees), `BE6-073` (OpenAPI export/alignment + no-mutation regression guard).
- 작업 경로: new module `apps/backend/app/modules/connectors/`, registered additively; focused tests `apps/backend/tests/test_mvp6_9_connectors_api.py`. No FE/infra.

## 완료한 작업
- Read AGENTS-loop context, Wave50 `NEXT_ORDERS.md`, Wave50 `PM_REPORT.md` (frozen G1/G5/G6/G7/G12), frozen contract `docs/api/MVP6_9_CONNECTORS_API_CONTRACT_DRAFT.md` + `docs/api/openapi-mvp6-9-draft.json` (17 schemas incl. `ConnectorPreviewNotice`), and the MVP6.8 copilot / MVP5 masked-secret precedents.
- Implemented the **3 frozen endpoints** matching the OpenAPI EXACTLY (field/enum names, 9-flag guard, notice shape):
  - `GET /api/v1/projects/{project_id}/connectors` — read-only catalog (3 mock kinds).
  - `GET /api/v1/projects/{project_id}/connectors/{connector_kind}/config-schema` — masked config schema (SECRET fields masked; `raw_secret_present:false`).
  - `POST /api/v1/projects/{project_id}/connectors/{connector_kind}/import-preview` — deterministic dry-run preview.
- **G1**: `preview_id` is always `null` (compute-on-read / ephemeral). No GET-by-id, no list of previews. `reset_runtime_store()` is a no-op (persists nothing) kept only to mirror the module contract.
- **G5**: fixed byte-stable per-kind fixtures — `FILE_SOURCE`=6 records→COMPATIBLE, `REST_SOURCE`=5 (1 unmapped)→WARNING, `KNOWLEDGE_BASE_SOURCE`=4→COMPATIBLE; `source_locator` = opaque `fixture:<file|rest|kb>/<resource>#row=<n>` (relations `#rel=<n>`) derived from NON-SECRET config only; no external read.
- **G6**: `warnings[]`/`blocked_reasons[]` elements are `ConnectorPreviewNotice{code,message}` with frozen UPPER_SNAKE codes (used: `UNMAPPED_FIELDS`, `MISSING_REQUIRED_FIELD`, `INVALID_CONFIG_VALUE`; full vocab defined). `blocked_reasons` non-empty only when `status=BLOCKED`.
- **G7**: `generated_at` set at response time (required); it plus `preview_id` are the ONLY fields excluded from the byte-stable determinism assertion.
- Preview creates NOTHING (no source/candidate/extraction; published graph untouched), is secret-independent (secret field values never read/used), masked (`raw_secret_present:false`), and carries the all-false 9-flag `ConnectorMutationGuard` + `preview_only:true` + constant `routing_note` on every response. Would-be items map to `CANDIDATE` layer with opaque `preview_ref` + nullable `mapped_ontology_class_ref` (reuses the frozen `OntologyElementRef` shape by reference; class named `ConnectorOntologyElementRef` to avoid the pre-existing governance `OntologyElementRef` component collision, exactly as MVP6.8 copilot did).
- Malformed body → **400 `INVALID_CONNECTOR_CONFIG`** (scoped `RequestValidationError` handler that only rewrites `*/import-preview`; every other route keeps FastAPI's default 422). Invalid *config* (missing/invalid field) → **200 BLOCKED** with notices + zero items. Authz: any recognized `Role` allowed; unknown role → **403 PERMISSION_DENIED**; missing project → **404 PROJECT_NOT_FOUND**; unknown kind → **404 CONNECTOR_KIND_NOT_FOUND**.

## 변경 파일
- `apps/backend/app/modules/connectors/__init__.py` (new, empty)
- `apps/backend/app/modules/connectors/schemas.py` (new) — enums + DTOs matching the frozen OpenAPI exactly; 9-flag `ConnectorMutationGuard`.
- `apps/backend/app/modules/connectors/service.py` (new) — catalog metadata, masked config schemas, G5 fixtures, deterministic preview, validation, authz/404 helpers, no-op reset hook.
- `apps/backend/app/modules/connectors/router.py` (new) — 3 endpoints.
- `apps/backend/app/api/router.py` — additive `connectors_router` import + `include_router` (after copilot).
- `apps/backend/app/main.py` — additive scoped `RequestValidationError` handler (400 `INVALID_CONNECTOR_CONFIG` for `*/import-preview` only; delegates to FastAPI default elsewhere).
- `apps/backend/tests/test_mvp6_9_connectors_api.py` (new) — 30 focused tests.

## 실행/검증
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_9_connectors_api.py -q` → **30 passed in 6.18s**.
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_8_copilot_api.py -q` → **23 passed in 4.77s**.
- `cd apps/backend && .venv/bin/pytest -q` (full backend regression) → **199 passed in 37.77s**.
- `cd apps/backend && .venv/bin/ruff check app tests scripts` → **All checks passed!**
- OpenAPI export/compare (actual `app.openapi()` vs `docs/api/openapi-mvp6-9-draft.json`): all 3 paths present; enums `ConnectorKind`/`ConnectorConfigFieldKind`/`ConnectorPreviewStatus`/`ConnectorPreviewCompatibility`/`ConnectorPreviewTargetLayer` equal; property sets equal for `ConnectorConfigField`, `ConnectorCatalogItem`, `ConnectorPreviewSummary`, `ConnectorPreviewItem`, `ConnectorPreviewNotice`, `ConnectorImportPreviewRequest`, `ConnectorImportPreviewResponse`, `ConnectorMutationGuard` (9 flags).
- No-raw-secret grep over `app/modules/connectors/` → only the masked placeholder `SECRET_PLACEHOLDER_NOT_A_REAL_SECRET` and benign non-secret references; no real credential literal.
- `git diff --check` → clean.
- 실행하지 못한 검증: none for backend scope.

## API/Enum/DTO 변경
- 변경 여부: 없음 (contract additive; matches the PM-frozen OpenAPI exactly). No renames of reused MVP5/candidate/`OntologyElementRef`/`Role` shapes.
- 상세: new connector-scoped enums/DTOs only. `ConnectorOntologyElementRef` mirrors the frozen `OntologyElementRef` field shape (`element_kind`/`element_id`/`label`) under a non-colliding component name (governance already owns `OntologyElementRef`).
- 영향받는 역할: Frontend (consume the shapes below), QA (verify R1-R8).

## Blocker
- 없음.

## 남은 TODO
- 없음 for backend. `INCOMPATIBLE_SOURCE_SHAPE` is a frozen-vocab BLOCKED code that is defined but not emitted by any current fixture path (no deterministic trigger in P0); `MISSING_REQUIRED_FIELD` + `INVALID_CONFIG_VALUE` cover the BLOCKED cases.

## 다른 역할에 전달할 내용
- PM: contract implemented as frozen; no drift.
- Backend: n/a.
- Frontend contract notes:
  - **Catalog** `GET .../connectors` → `{project_id, items[], total_count:3, mutation_guard}`; each item `{connector_kind, display_name, description, mock:true, has_secret_fields, config_field_count:3, target_layer:"CANDIDATE"}`. `has_secret_fields`: FILE_SOURCE=false, REST_SOURCE=true, KNOWLEDGE_BASE_SOURCE=true.
  - **Config-schema** `GET .../{kind}/config-schema` → `{project_id, connector_kind, display_name, fields[], raw_secret_present:false, mutation_guard}`. `fields[]` ordered `ConnectorConfigField{name,label,field_kind,required,secret,placeholder,help_text,enum_values}`. SECRET fields have `secret:true`, `field_kind:"SECRET"`, `placeholder:"SECRET_PLACEHOLDER_NOT_A_REAL_SECRET"`. FILE_SOURCE: file_name/file_format(ENUM CSV,JSON)/has_header. REST_SOURCE: base_url(URL)/resource_path/api_key(SECRET). KB: knowledge_base_id/collection/access_token(SECRET).
  - **Preview** `POST .../{kind}/import-preview` body `{config:{...}, item_cap?:1..50 (default 50)}`. Response: `preview_id:null`, `generated_at`, `preview_only:true`, `status`(READY|BLOCKED), `compatibility`(COMPATIBLE|WARNING|INCOMPATIBLE), `target_layer:"CANDIDATE"`, `summary{source_record_count, would_be_candidate_entity_count, would_be_candidate_relation_count, unmapped_record_count, warning_count}`, `sample_items[]` (≤item_cap), `item_cap`, `truncated`, `total_item_count` (exact), `warnings[]`/`blocked_reasons[]` of `{code,message}`, `routing_note` (constant), `raw_secret_present:false`, `mutation_guard`. `sample_items[]` = `{preview_ref (opaque, NOT a candidate id), target_layer:"CANDIDATE", mapped_ontology_class_ref{element_kind,element_id,label}|null, label, source_locator (opaque `fixture:...`), compatibility, note|null}`.
  - **Notice codes** (D6 badges): WARNING `UNMAPPED_FIELDS`/`MISSING_EVIDENCE_LOCATOR`/`PARTIAL_RECORD_MAPPING`; BLOCKED `MISSING_REQUIRED_FIELD`/`INVALID_CONFIG_VALUE`/`INCOMPATIBLE_SOURCE_SHAPE`. Messages are Korean-primary.
  - **9-flag guard** (all `false`, always): `external_system_read, external_system_write, real_network_call_made, credential_persisted, connector_instance_persisted, source_created, candidate_graph_mutated, published_graph_mutated, extraction_job_started`.
  - **Masking proof line**: `raw_secret_present:false` on config-schema + preview; secret values are never echoed. Invalid config → 200 BLOCKED (render notices, no items); malformed body / item_cap out of range → 400 `INVALID_CONNECTOR_CONFIG`. Optional `?actor_role=` query (default VIEWER); unknown role → 403.
- QA: DATA-LEVEL no-mutation verified via full sqlite table-count before==after across every connector call incl. preview + BLOCKED (`test_data_level_no_mutation_including_preview`); byte-stability excludes only `generated_at`/`preview_id` (`_normalize`); secret-independence (`test_preview_secret_independent`); no-raw-secret (`test_no_raw_secret_in_any_response`); all-false 9-flag guard on every response (`test_guard_all_false_on_every_response`).

## 총괄에게 요청하는 결정
- Accept the backend runtime thin slice. Note the one additive `main.py` change (scoped 400 handler) — required to honor the contract's "malformed body → 400 INVALID_CONNECTOR_CONFIG" while keeping the typed request schema exported; it is inert for all non-`import-preview` routes (delegates to FastAPI default; full 199-test suite green).

## 현재 판정
- PASS (3 endpoints match frozen OpenAPI exactly; G1/G5/G6/G7 honored; creates-nothing + secret-independent + masked + all-false 9-flag guard proven at data level; 30 focused + 199 full backend tests pass; ruff clean; OpenAPI aligned; additive-only, MVP1-6.8 intact).
