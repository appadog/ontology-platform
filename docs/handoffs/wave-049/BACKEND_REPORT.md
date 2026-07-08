# Backend Report - Wave 49

## 담당 범위
- backlog ID: `BE6-068` (connectors contract draft), `BE6-069` (OpenAPI planning artifact).
- MVP6.9 Connectors contract-first planning only. No runtime/model/migration/test/seed
  code (Wave50 대기). `apps/`, `infra/` 미변경.

## 완료한 작업
- `docs/api/openapi-mvp6-9-draft.json` 작성 — OpenAPI 3.1.0, `0.6.9-draft`,
  3 paths / 3 operations / 16 schemas. MVP1-MVP6.8에 대해 disjoint-additive
  (path 충돌 0). 모든 응답에 all-false 9-flag `ConnectorMutationGuard`.
- `docs/api/MVP6_9_CONNECTORS_API_CONTRACT_DRAFT.md` 작성 — human-readable companion
  (boundary / endpoints / enums / DTOs / rules / reuse-by-reference / open questions).
- 3 endpoint family 확정:
  - `GET  /api/v1/projects/{project_id}/connectors`
  - `GET  /api/v1/projects/{project_id}/connectors/{connector_kind}/config-schema`
  - `POST /api/v1/projects/{project_id}/connectors/{connector_kind}/import-preview`
- 5 frozen enum을 지시대로 verbatim 사용. Dry-run preview 모델(exact counts + capped
  `sample_items[]` + `truncated` + exact `total_item_count`), masked config schema,
  `raw_secret_present:false`, 상수 `routing_note`, `preview_only:true` 반영.
- reuse-by-reference (rename 없음): MVP5 masked-secret + import dry-run, MVP6.4
  `GoldSetImportCompatibility`, MVP2 candidate/`source_segment`, MVP1
  `OntologyElementRef`, MVP5 `Role`. `OntologyElementRef`는 draft self-contained
  유지를 위해 로컬 정의(shape/이름 MVP1/6.5-6.8과 동일).

## 변경 파일
- 생성: `docs/api/openapi-mvp6-9-draft.json`
- 생성: `docs/api/MVP6_9_CONNECTORS_API_CONTRACT_DRAFT.md`
- 생성: `docs/handoffs/wave-049/BACKEND_REPORT.md`
- (`apps/`, `infra/` 무변경)

## 검증
- `python3 -m json.tool docs/api/openapi-mvp6-9-draft.json > /dev/null` -> `PARSE_OK`.
- counts: version `0.6.9-draft`, openapi `3.1.0`, **paths 3 / operations 3 / schemas 16**.
- additivity: 신규 3개 path가 기존 `openapi-mvp*.json` 어느 것과도 충돌 없음 (disjoint-additive).
- no-secret scan: 두 아티팩트에서 realistic secret 리터럴 0 (placeholder만:
  `SECRET_PLACEHOLDER_NOT_A_REAL_SECRET`, `https://example.invalid/api`).
- `git diff --check` -> CHECK_OK.
- runtime leakage: `apps/`, `infra/` 변경 없음 (`git status --porcelain` 확인).

## API/Enum/DTO 변경 (planning-only, additive)
- **신규 enum(5)**: `ConnectorKind`(FILE_SOURCE/REST_SOURCE/KNOWLEDGE_BASE_SOURCE),
  `ConnectorConfigFieldKind`(STRING/URL/ENUM/INTEGER/BOOLEAN/SECRET),
  `ConnectorPreviewStatus`(READY/BLOCKED),
  `ConnectorPreviewCompatibility`(COMPATIBLE/WARNING/INCOMPATIBLE),
  `ConnectorPreviewTargetLayer`(CANDIDATE, const).
- **신규 DTO(16 schemas)**: `ConnectorMutationGuard`(9 flags all const false),
  `ConnectorConfigField`, `ConnectorCatalogItem`, `ConnectorCatalogListResponse`,
  `ConnectorConfigSchemaResponse`, `ConnectorImportPreviewRequest`,
  `ConnectorPreviewSummary`, `ConnectorPreviewItem`, `ConnectorImportPreviewResponse`,
  `OntologyElementRef`(reuse), `ApiError`, 5 enum.
- runtime/DB/route 변경 없음.

## Blocker
- 없음.

## 남은 TODO (Wave50)
- Backend runtime thin slice: 3 endpoint 구현, deterministic fixture(kind별 sample
  record), process-local store + `reset_runtime_store()`(persist-vs-compute 결정 시).
- open question 해소:
  1) persist-vs-compute (`preview_id` null vs 지속 + list/GET-by-id, MVP6.3/6.7 패턴)
  2) kind별 fixture sample shape (deterministic byte-stable)
  3) `preview_ref` opacity vs `OntologyElementRef` 재사용 범위
  4) `item_cap` request override vs server hard max(P0=50) precedence.

## Frontend/QA 전달 notes
- **catalog DTO**: `ConnectorCatalogListResponse` = `project_id` + `items[]`
  (`ConnectorCatalogItem`: `connector_kind`/`display_name`/`description`/`mock:true`/
  `has_secret_fields`/`config_field_count`/`target_layer:CANDIDATE`) + exact
  `total_count`(=3) + all-false `mutation_guard`.
- **config-schema DTO**: `ConnectorConfigSchemaResponse` = `fields[]`
  (`ConnectorConfigField`: `name`/`label`/`field_kind`/`required`/`secret`/
  `placeholder`(non-secret)/`help_text`/`enum_values`) + `raw_secret_present:false`
  + guard. SECRET 필드는 어디서나 masked; raw secret 표시/입력/반환 없음.
- **dry-run preview DTO**: request `ConnectorImportPreviewRequest`(`config` map +
  optional `item_cap<=50`); response `ConnectorImportPreviewResponse` =
  `preview_only:true` + `status`(READY/BLOCKED) + `compatibility` +
  `target_layer:CANDIDATE` + `summary`(exact counts) + capped `sample_items[]`
  (`ConnectorPreviewItem`: opaque `preview_ref`(NOT candidate id) +
  `mapped_ontology_class_ref`(`OntologyElementRef`|null) + `label`/`source_locator`
  (mock)/`compatibility`/`note`) + `item_cap`/`truncated`/exact `total_item_count`
  + `warnings[]`/`blocked_reasons[]` + 상수 `routing_note` + `raw_secret_present:false`
  + all-false `mutation_guard`.
- **all-false 9-flag guard**: 모든 응답(catalog/schema/preview)에 `external_system_read`/
  `external_system_write`/`real_network_call_made`/`credential_persisted`/
  `connector_instance_persisted`/`source_created`/`candidate_graph_mutated`/
  `published_graph_mutated`/`extraction_job_started` = 전부 false. QA는 세 응답 모두에서
  검증할 것.
- **masking / preview-creates-nothing**: raw secret 없음, `raw_secret_present:false`,
  preview는 secret 값과 무관하게 deterministic byte-stable; preview는
  candidate/source/extraction 생성 0, published graph 미접촉. FE는 persistent
  "preview only — nothing imported; routes through candidate review later" 배너 +
  live all-false-guard proof line 필요.
- **authz/errors**: 프로젝트 read 멤버면 3개 다 가능; `403 PERMISSION_DENIED`,
  `404 PROJECT_NOT_FOUND`/`404 CONNECTOR_KIND_NOT_FOUND`, malformed body 시
  `400 INVALID_CONNECTOR_CONFIG`(단, invalid config는 보통 200 + status=BLOCKED).

## 총괄에게 요청하는 결정
- Wave49 Backend contract draft를 PASS로 승인해 FE(`FE6-089`)/QA(`INT6-075`)가
  이 계약(3 endpoint / 5 enum / 16 schema / all-false 9-flag guard / masked secret /
  preview-creates-nothing) 위에서 planning을 이어가도록 허용해 달라.
- open question 4건(persist-vs-compute, fixture shape, preview_ref scope, item_cap
  precedence)은 Wave50 thin implementation gate로 넘긴다.

## 현재 판정
- PASS (planning-only additive contract; PARSE_OK; disjoint-additive; no-secret;
  no runtime leakage).
