# MVP6.9 Connectors API Contract Draft (planning-only, additive)

Status: Wave49 contract-first planning (`BE6-068`/`BE6-069`). Authoritative machine
artifact: `docs/api/openapi-mvp6-9-draft.json` (OpenAPI 3.1.0, `0.6.9-draft`,
**3 paths / 17 schemas**, PARSE_OK, disjoint-additive to MVP1-MVP6.8). This
markdown is the human-readable companion; the OpenAPI is the source of truth.
No runtime/model/migration/test/seed code (Wave50 waits). Frozen by
`docs/pm/MVP6_9_CONNECTORS_BRIEF.md` + ADR 0016.

## Boundary (ADR 0016)
MVP6.9 P0 is a **read-only connector catalog + deterministic dry-run import
preview**. Nothing is connected, nothing is written, nothing is imported. No real
network call, no credential execution (deterministic mock connectors on fixture
data; the preview is independent of any secret value). Masked secrets only
(`raw_secret_present:false`). Every response carries an all-false 9-flag
`ConnectorMutationGuard`. A preview maps fixture records to **would-be**
candidate-layer items and never creates candidates/sources/extraction jobs and
never touches the published graph; a real run would route through the existing
`extraction -> candidate -> review -> publish` gate.

## Endpoints (all additive)
- `GET  /api/v1/projects/{project_id}/connectors` — list connector catalog (3 mock kinds). -> `ConnectorCatalogListResponse`
- `GET  /api/v1/projects/{project_id}/connectors/{connector_kind}/config-schema` — masked config schema for a kind. -> `ConnectorConfigSchemaResponse`
- `POST /api/v1/projects/{project_id}/connectors/{connector_kind}/import-preview` — deterministic dry-run preview (creates nothing). -> `ConnectorImportPreviewResponse`

## Enums (frozen; in the OpenAPI, used verbatim)
- `ConnectorKind`: `FILE_SOURCE` / `REST_SOURCE` / `KNOWLEDGE_BASE_SOURCE` (exactly 3).
- `ConnectorConfigFieldKind`: `STRING` / `URL` / `ENUM` / `INTEGER` / `BOOLEAN` / `SECRET` (SECRET always masked).
- `ConnectorPreviewStatus`: `READY` / `BLOCKED`.
- `ConnectorPreviewCompatibility`: `COMPATIBLE` / `WARNING` / `INCOMPATIBLE`.
- `ConnectorPreviewTargetLayer`: `CANDIDATE` (single literal; `const`).

## Key DTOs
- `ConnectorMutationGuard` — 9 flags, all `const:false`, all `required`, on **every**
  response: `external_system_read`, `external_system_write`, `real_network_call_made`,
  `credential_persisted`, `connector_instance_persisted`, `source_created`,
  `candidate_graph_mutated`, `published_graph_mutated`, `extraction_job_started`.
- `ConnectorConfigField` — `name`, `label`, `field_kind`, `required`, `secret`,
  `placeholder` (non-secret), `help_text`, `enum_values`. SECRET fields are masked
  everywhere.
- `ConnectorCatalogItem` / `ConnectorCatalogListResponse` — kind descriptors +
  `mock:true`, `has_secret_fields`, `config_field_count`, exact `total_count`.
- `ConnectorConfigSchemaResponse` — ordered `fields[]` + `raw_secret_present:false`.
- `ConnectorImportPreviewRequest` — `config` map (field name -> value; non-secret
  placeholders only) + optional `item_cap` (<=50).
- `ConnectorPreviewSummary` — exact counts: `source_record_count`,
  `would_be_candidate_entity_count`, `would_be_candidate_relation_count`,
  `unmapped_record_count`, `warning_count`.
- `ConnectorPreviewNotice` — `{code, message}` (G6 frozen): `code` is a stable
  UPPER_SNAKE token, `message` a deterministic human string. Element of both
  `warnings[]` and `blocked_reasons[]`. Frozen codes — warnings:
  `UNMAPPED_FIELDS`/`MISSING_EVIDENCE_LOCATOR`/`PARTIAL_RECORD_MAPPING`; blocked:
  `MISSING_REQUIRED_FIELD`/`INVALID_CONFIG_VALUE`/`INCOMPATIBLE_SOURCE_SHAPE`.
- `ConnectorPreviewItem` — `preview_ref` (opaque, NOT a created candidate id),
  `target_layer:CANDIDATE`, `mapped_ontology_class_ref` (`OntologyElementRef` or
  null), `label`, `source_locator` (mock), `compatibility`, `note`.
- `ConnectorImportPreviewResponse` — `preview_id` (nullable; persist-vs-compute
  open), `preview_only:true`, `status`, `compatibility`, `target_layer`, `summary`,
  capped `sample_items[]`, `item_cap`, `truncated`, exact `total_item_count`,
  `warnings[]`/`blocked_reasons[]` (`ConnectorPreviewNotice[]`, G6), constant
  `routing_note`, `raw_secret_present:false`, `mutation_guard`. `generated_at`
  (required, set at response time) and `preview_id` (G1: always `null`) are
  EXCLUDED from the byte-stable determinism assertion.

## Rules
- **Read-only + dry-run only.** The only write-shaped verb (`POST import-preview`)
  creates nothing; it is a pure deterministic computation over fixture data.
- **Deterministic + bounded.** Same kind + same non-secret config against the same
  fixture -> byte-stable. Counts always exact; only `sample_items[]` is capped
  (`item_cap`, P0=50) with `truncated` + exact `total_item_count`.
- **Secret-independent.** Preview is keyed by `connector_kind` (+ non-secret config)
  only; secret values never change the result and are never echoed/persisted/logged.
- **Masked secrets only.** No raw secret anywhere; `raw_secret_present:false`;
  every example uses non-secret placeholders (`SECRET_PLACEHOLDER_NOT_A_REAL_SECRET`,
  `https://example.invalid/api`). P0 has no credential create/reveal at all.
- **BLOCKED not crash.** Invalid config / INCOMPATIBLE -> `status:BLOCKED` +
  `blocked_reasons[]`, never a crash, never fabricated items. (A malformed request
  body may still 400 `INVALID_CONNECTOR_CONFIG`.)
- **All-false guard on every response** (catalog, schema, preview). MVP6.9 turns no
  flag true, ever.
- **Authz.** Any project member who can view the project may list catalog, read
  config schema, and run preview — no elevated role (reuse MVP5 `Role`, no new
  literal). Unauthorized -> `403 PERMISSION_DENIED`; missing project / unknown kind
  -> `404 PROJECT_NOT_FOUND` / `404 CONNECTOR_KIND_NOT_FOUND`.

## Reuse (by reference, no renames)
- MVP5 masked-secret credential safety (`raw_secret_present:false`, never-log-raw)
  and admin import **dry-run** shape (`compatibility` + `summary` counts +
  "nothing applied" semantics via `preview_only`/`routing_note`).
- MVP6.4 `GoldSetImportCompatibility` COMPATIBLE/WARNING/INCOMPATIBLE precedent.
- MVP2 candidate pipeline (`CandidateEntity`/`CandidateRelation`, `source_segment`,
  `SourceParseResponse`, extraction-job) as the **would-be** targets a preview item
  maps to (never created); `source_locator` reuses source_segment locator semantics.
- MVP1 `OntologyElementRef` (defined locally in this draft to keep it self-contained;
  same shape/names as MVP1/MVP6.5-6.8, no rename) for `mapped_ontology_class_ref`.
- MVP5 `Role` for read authorization.

## Open questions -> Wave50 gates (FROZEN by PM6-032, Wave50)
1. **G1 Persist-vs-compute** — FROZEN **compute-on-read / ephemeral**. `preview_id`
   is ALWAYS `null`; nothing is persisted; NO `GET .../import-preview/{preview_id}`
   and NO list endpoint are added. Recompute yields byte-identical results (modulo
   `generated_at`). Read-only + all-false guard. No contract shape change.
2. **G5 Fixture sample shape per kind** — FROZEN small + byte-stable, no external
   read: `FILE_SOURCE` = 6 records (default COMPATIBLE), `REST_SOURCE` = 5 records
   (≥1 unmapped → default WARNING), `KNOWLEDGE_BASE_SOURCE` = 4 records (default
   COMPATIBLE). `source_locator` is an OPAQUE deterministic string
   `fixture:<file|rest|kb>/<resource>#row=<n>` (derived from NON-SECRET config
   only); FE treats it as opaque text. Contract already types it `string|null` —
   no shape change.
3. **G6 `warnings[]`/`blocked_reasons[]` element** — FROZEN `ConnectorPreviewNotice
   {code, message}` (added to the OpenAPI, 16→17 schemas). Codes are a stable
   frozen UPPER_SNAKE vocabulary (see the DTO above). Contract refined this wave.
4. **G7 `generated_at`** — FROZEN **keep** (already present + required); it is set
   at response time and MUST be EXCLUDED from the byte-stable determinism
   assertion. No contract change (the "missing field" note in the Wave49
   FE/QA docs was stale — the field is in this source-of-truth OpenAPI).
5. `preview_ref` stays opaque (not a candidate id); `mapped_ontology_class_ref`
   reuses `OntologyElementRef` only; no other MVP2 candidate field is echoed.
   `item_cap` request value is clamped to the server hard max (P0=50); counts stay
   exact regardless of the cap.
