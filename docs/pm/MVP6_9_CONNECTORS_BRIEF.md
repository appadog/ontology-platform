# MVP6.9 Connectors / Plugin SDK — P0 Freeze Brief

Status: `WAVE50 THIN IMPLEMENTATION FREEZE — G1/G5/G6/G7/G12 FROZEN (PM6-032; §12); planning FROZEN Wave49 (PM6-031, ADR 0016)`
Date: 2026-07-08

THIN freeze for the smallest coherent, SAFE connector P0: a project-scoped
**read-only connector catalog** + a **deterministic dry-run import preview**.
No external write, no live/scheduled sync, no real network/credential execution
(deterministic mock connectors on fixture data), no plugin code execution,
masked secrets only, all-false mutation guard. Durable boundary: ADR 0016.
Runtime waits for Wave50.

## 1. P0 demo flow (frozen)

```text
select project
-> open Connectors (Analyze/Sources area)
-> view connector catalog (3 deterministic mock connector kinds)
-> open a connector kind -> see its masked config schema (secret fields masked)
-> fill mock config + run dry-run import PREVIEW
-> read: compatibility + summary counts + capped sample of would-be candidate items
-> read the explicit "preview only — nothing imported; a real run would route
   through the existing extraction -> candidate -> review -> publish gate" boundary
```

Nothing is connected. Nothing is imported. Nothing is written.

## 2. Non-negotiable boundary (= ADR 0016)

- **Read-only catalog + dry-run preview only.** No external write-back, no live /
  scheduled / background sync, no confirm-and-apply real import.
- **No real network / no credential execution.** Deterministic mock connectors on
  fixture sample data. No socket, no external connection, no credential used. The
  preview is computed from fixture data keyed by `connector_kind` (+ non-secret
  config) so it is **independent of any secret value**.
- **Preview-only; candidate/review gate never bypassed.** Preview creates no
  candidate/entity/relation, no source, no extraction job, and never touches the
  published graph. Preview items are **would-be** candidate-layer items, not rows.
  Any real ingestion later routes through the existing gated pipeline.
- **Masked-secret / no-raw-secret (mirror MVP5).** No raw secret is printed,
  persisted, logged, or returned; masked/placeholder only; `raw_secret_present:false`.
  All example values in docs are **non-secret placeholders**.
- **All-false mutation guard on every response** (§6). Additive only; no break of
  MVP1–MVP6.8 surfaces/smokes; reuse existing shapes by reference (no renames).

## 3. Connector catalog model (frozen)

### `ConnectorKind` — exactly 3 deterministic mock kinds
- `FILE_SOURCE` — CSV/JSON file-style source (mirrors MVP1/MVP2 file upload lineage).
- `REST_SOURCE` — generic REST-ish API source.
- `KNOWLEDGE_BASE_SOURCE` — a knowledge-base / doc source (Notion/Confluence-like).

### Masked config schema — `ConnectorConfigField[]`
Each field descriptor: `name`, `label`, `field_kind`, `required`, `secret`,
`placeholder` (non-secret), `help_text`.

`ConnectorConfigFieldKind` = `STRING` / `URL` / `ENUM` / `INTEGER` / `BOOLEAN` /
`SECRET`. A `SECRET` field (or `secret:true`) is masked everywhere; it is never
echoed, persisted, or logged.

Frozen schema per kind (non-secret placeholders only):

| Kind | Fields (`name : field_kind`, secret?) |
|---|---|
| `FILE_SOURCE` | `file_path:STRING` (`"path/to/sample.csv"`), `format:ENUM` (`CSV`/`JSON`), `has_header:BOOLEAN` |
| `REST_SOURCE` | `base_url:URL` (`"https://example.invalid/api"`), `resource_path:STRING` (`"/v1/items"`), `api_key:SECRET` (masked, `"SECRET_PLACEHOLDER_NOT_A_REAL_SECRET"`) |
| `KNOWLEDGE_BASE_SOURCE` | `workspace:STRING` (`"demo-workspace"`), `space_key:STRING` (`"KB"`), `access_token:SECRET` (masked, `"SECRET_PLACEHOLDER_NOT_A_REAL_SECRET"`) |

No real connection is ever attempted with these values.

## 4. Dry-run import preview model (frozen, bounded, deterministic)

Given `connector_kind` + mock config, return a deterministic preview from fixture
data. It maps source records to **would-be candidate-layer items** and rolls up a
compatibility/summary. Bounded for determinism (caps + truncation).

Preview response (Backend finalizes exact field names):
- `preview_id` (if persisted), `project_id`, `connector_kind`, `generated_at`
- `preview_only: true`
- `status` — `ConnectorPreviewStatus`
- `compatibility` — `ConnectorPreviewCompatibility`
- `summary` — counts: `source_record_count`, `would_be_candidate_entity_count`,
  `would_be_candidate_relation_count`, `unmapped_record_count`, `warning_count`
- `sample_items[]` — capped list of would-be candidate-layer preview items:
  `preview_ref` (opaque; **not** a created candidate id), `target_layer`
  (`CANDIDATE`), `mapped_ontology_class_ref` (`OntologyElementRef`-style, by
  reference), `label`, `source_locator` (mock locator), `note`
- `item_cap`, `truncated` (bool), `total_item_count` (exact even when truncated)
- `warnings[]`, `blocked_reasons[]` (when `BLOCKED`)
- `routing_note` — *"preview only — nothing imported; a real run would route
  through the existing extraction -> candidate -> review -> publish gate."*
- `raw_secret_present: false`
- `mutation_guard` — all-false `ConnectorMutationGuard` (§6)

### `ConnectorPreviewStatus`
- `READY` — preview computed from fixture data.
- `BLOCKED` — config invalid / `INCOMPATIBLE`; `blocked_reasons[]` explains. No
  crash, no fabricated items.

### `ConnectorPreviewCompatibility` (rollup; mirrors MVP5/MVP6.4 dry-run precedent)
- `COMPATIBLE` — all sampled mock records map cleanly to candidate-layer items.
- `WARNING` — importable but some records need review (unmapped fields, missing
  evidence locator, locator-only source segment).
- `INCOMPATIBLE` — config invalid or the mock source shape maps to no
  candidate-layer item; nothing would be ingestible.

### `ConnectorPreviewTargetLayer`
- `CANDIDATE` — single literal; asserts preview items map to the candidate layer
  only, **never** published.

### Bounding
Deterministic, cheap: max returned items cap (P0 e.g. `50`) with `truncated:true`
+ exact `total_item_count` when hit. Counts always exact; only the item list is
capped. Same kind + non-secret config against the same fixture → byte-stable.

## 5. Reuse (by reference, no renames)

| Precedent | Reuse |
|---|---|
| MVP5 masked-secret credential safety | `masked_secret` / never-log-raw / `raw_secret_present:false` semantics. P0 has **no** credential create/reveal at all — masked/placeholder only. |
| MVP5 admin JSON import **dry-run** | `compatibility_status` + `summary` counts + `confirmation_required`-style "nothing applied" pattern. |
| MVP6.4 `GoldSetImportCompatibility` | dry-run compatibility-state precedent (COMPATIBLE/WARNING/INCOMPATIBLE style). |
| MVP2 candidate pipeline | `CandidateEntity`/`CandidateRelation`, `source_segment`, `SourceParseResponse`, extraction-job — the **would-be** target shapes a preview item maps to (never created). |
| MVP1 ontology | `OntologyElementRef` + ontology version context for `mapped_ontology_class_ref`. |
| MVP5 `Role` | read authorization (no new role literal). |

## 6. All-false `ConnectorMutationGuard` (frozen; every response)

- `external_system_read: false`
- `external_system_write: false`
- `real_network_call_made: false`
- `credential_persisted: false`
- `connector_instance_persisted: false`
- `source_created: false`
- `candidate_graph_mutated: false`
- `published_graph_mutated: false`
- `extraction_job_started: false`

Every flag false on catalog list, config schema, and import preview. No exceptions.

## 7. Authorization (frozen)

- Read-only, mutates nothing, grants nothing → any project member who can view the
  project may list the catalog, read a config schema, and run a dry-run preview.
  No elevated role. Reuse MVP5 `Role`; no new role literal.
- Later real ingestion (P1) would require an ingest-capable role (e.g.
  `SOURCE_MANAGER`) — out of P0.
- Unauthorized → `403 PERMISSION_DENIED`. Missing project / unknown kind →
  `404 PROJECT_NOT_FOUND` / `404 CONNECTOR_KIND_NOT_FOUND`.

## 8. Suggested endpoint families (planning; Backend finalizes)

- `GET  /api/v1/projects/{project_id}/connectors` — list connector catalog (kinds).
- `GET  /api/v1/projects/{project_id}/connectors/{connector_kind}/config-schema` — masked config schema.
- `POST /api/v1/projects/{project_id}/connectors/{connector_kind}/import-preview` — deterministic dry-run preview (creates nothing).

Persist-vs-compute for `preview_id` (list + GET-by-id) is a Backend decision
(mirror MVP6.3/6.7); either way read-only + all-false guard. Process-local
`reset_runtime_store()` acceptable; durable DB/Alembic is P1/P2.

## 9. Explicit exclusions (P1+ unless PM re-freezes)

External write-back; live / scheduled / background / always-on sync; confirm-and-
apply real import; real network calls; real credential execution / external
connection; credential **storage** / encryption / vault / rotation; connector
**instance** persistence; autonomous / auto-confirmed ingestion; **plugin code
execution** and the entire Plugin* family (Parser/Chunker/Extractor/Validator/
Exporter/Visualization/Agent-Tool; `PluginDefinition`/`PluginVersion`/
`PluginExecution`/`PluginPermission`); real Database / S3-MinIO / Web-Crawler /
Notion-Confluence-SharePoint / Git connectors; connector setup wizard write; sync
job monitor; plugin management / execution log; direct candidate or
published-graph mutation; source creation or extraction-job trigger from preview;
multi-tenant / cross-project connector runtime; real LLM execution; any new
connector kind beyond the frozen 3.

## 10. Durable invariants preserved

- Candidate/published separation: preview only maps to **would-be** candidate
  items; it writes neither layer.
- Evidence/version traceability: preview items reference source locators + ontology
  refs; a real run would carry evidence through the existing gate.
- Contract-first + additive-only: no MVP1–MVP6.8 rename/break; reuse by reference.
- No-secret: masked/placeholder only; `raw_secret_present:false`; non-secret
  example literals only.
- No real network / no real LLM: deterministic mock connectors on fixture data.

## 11. Backlog IDs

PM `PM6-031`; Backend `BE6-068`~`BE6-069`; Frontend `FE6-089`; QA `INT6-075`.
(See `docs/backlog/MVP6_DRAFT_BACKLOG.md` Wave49 section.)

Wave50 implementation IDs: PM `PM6-032`; Backend `BE6-070`~`BE6-073`; Frontend
`FE6-090`~`FE6-093`; QA `INT6-076`~`INT6-079`. (See the Wave50 backlog section.)

## 12. Wave50 Implementation Freeze — G1 / G5 / G6 / G7 / G12 (PM6-032)

Authority for Backend/Frontend/QA. Each gate is one precise, deterministic,
implementable rule. Scope UNCHANGED (§2/§6/ADR 0016): read-only catalog + dry-run
preview, creates nothing, no external write/network, masked secrets only, all-false
9-flag `ConnectorMutationGuard` on every response.

- **G1 — `preview_id` persist-vs-compute → COMPUTE-ON-READ / EPHEMERAL.** The
  preview persists NOTHING. `preview_id` is ALWAYS `null` in every response. NO
  `GET .../import-preview/{preview_id}` and NO preview list endpoint are added; the
  3 frozen endpoints are the entire surface. Re-running the same kind + same
  non-secret config against the same fixture yields byte-identical output (modulo
  `generated_at`, G7). Read-only + all-false guard. No contract shape change
  (`preview_id` is already nullable). FE treats a preview as ephemeral view state.

- **G5 — per-kind fixture + `source_locator` shape.** Each kind has a FIXED, small,
  byte-stable in-repo fixture (NO external read; `source_record_count` is exactly
  the fixture size): `FILE_SOURCE` = **6** records (maps cleanly → default
  `COMPATIBLE`); `REST_SOURCE` = **5** records (≥1 record missing a mappable field
  → default `WARNING` + `warning_count ≥ 1`); `KNOWLEDGE_BASE_SOURCE` = **4**
  records (maps cleanly → default `COMPATIBLE`). `source_locator` is an **opaque,
  deterministic per-record STRING** (not a structured object; matches the frozen
  `string|null` type), canonical format
  `fixture:<file|rest|kb>/<resource>#row=<n>` where `<resource>` derives from a
  NON-SECRET config field (`FILE_SOURCE`←`file_path` basename, `REST_SOURCE`←
  `resource_path`, `KNOWLEDGE_BASE_SOURCE`←`space_key`) and `<n>` is the 1-based
  fixture row. FE renders it as opaque text and never parses it. BLOCKED via
  invalid config (bad URL / missing required field / no-mappable-shape) — see G6.

- **G6 — `warnings[]` / `blocked_reasons[]` element → `ConnectorPreviewNotice
  {code, message}`.** `code` is a stable UPPER_SNAKE token (for D6 badges / i18n);
  `message` is a deterministic human string (Korean primary). Frozen code
  vocabulary — WARNING: `UNMAPPED_FIELDS`, `MISSING_EVIDENCE_LOCATOR`,
  `PARTIAL_RECORD_MAPPING`; BLOCKED: `MISSING_REQUIRED_FIELD`,
  `INVALID_CONFIG_VALUE`, `INCOMPATIBLE_SOURCE_SHAPE`. `blocked_reasons[]` is
  non-empty ONLY when `status=BLOCKED`; `warnings[]` carries the `WARNING`-tone
  notices. **Contract refined this wave:** `ConnectorPreviewNotice` added to
  `openapi-mvp6-9-draft.json` (16→17 schemas); the two arrays now `$ref` it (was
  `array<string>`). Backend exports must match.

- **G7 — optional `generated_at` → KEEP (present + required).** The
  source-of-truth `openapi-mvp6-9-draft.json` already declares `generated_at`
  (`date-time`, required); it is set at response time (wall clock). RULE: it is
  the ONLY response field allowed to vary between two otherwise-identical previews
  and MUST be EXCLUDED (together with `preview_id`, which is constant `null`) from
  the byte-stable determinism assertion. The substantive payload
  (status/compatibility/summary/sample_items/counts/notices/guard) is byte-stable.
  No contract change. (The Wave49 FE §8 G7 / acceptance-checklist "missing
  `generated_at`" note is STALE — the field is present in the OpenAPI.)

- **G12 — copy / IA (ratified + finalized).**
  - **LNB (ratified):** ONE project-zone LNB item `Connectors` in the **BUILD**
    group **immediately after `Sources`** (`Ontology → Sources → Connectors →
    Extraction → Candidates`). Analyze placement rejected. Catalog route
    `/projects/:p/connectors`; per-kind config/preview is a **contextual sub-view**
    at `/projects/:p/connectors/:connectorKind` (frozen enum literal, not an
    ID-bound global page, per ADR 0010).
  - **H1 (finalized, D3):** page H1 = **`커넥터`** (Korean primary). LNB label stays
    the intentional-English noun `Connectors`. One title per screen (no ko/en
    subtitle mismatch).
  - **KO glosses (finalized; D6 `TOKEN · 한국어보조라벨`).** Kinds: `FILE_SOURCE`·파일
    소스, `REST_SOURCE`·REST API 소스, `KNOWLEDGE_BASE_SOURCE`·지식베이스 소스. Status:
    `READY`·준비됨, `BLOCKED`·차단됨. Compatibility: `COMPATIBLE`·호환됨, `WARNING`·경고,
    `INCOMPATIBLE`·비호환. Target layer: `CANDIDATE`·후보 레이어. Field kinds:
    `STRING`·문자열, `URL`·URL, `ENUM`·열거형, `INTEGER`·정수, `BOOLEAN`·불리언,
    `SECRET`·비밀값. Boundary chips: `PREVIEW_ONLY`·미리보기 전용, `NO_EXTERNAL_CALL`·외부
    호출 없음, `NO_SECRET_STORED`·비밀값 저장 없음, `NOTHING_IMPORTED`·가져오기 없음. Notice
    codes: `UNMAPPED_FIELDS`·미매핑 필드, `MISSING_EVIDENCE_LOCATOR`·근거 위치 누락,
    `PARTIAL_RECORD_MAPPING`·부분 매핑, `MISSING_REQUIRED_FIELD`·필수 항목 누락,
    `INVALID_CONFIG_VALUE`·잘못된 설정값, `INCOMPATIBLE_SOURCE_SHAPE`·비호환 소스 형태.
    Primary preview action button label = **`미리보기 실행`** (never 가져오기/동기화/연결/실행).
