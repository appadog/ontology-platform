# INT6.9 MVP6.9 Connectors Acceptance Checklist

Status: `WAVE49 QA CONTRACT-FIRST PLANNING — PASS (C-series PASS; R-series NOT RUNNABLE by design until Wave50)`
Date: 2026-07-08
Owner: QA / Integration
Backlog: `INT6-075`..`INT6-082` (continues INT6 numbering; `INT6-*` used through `INT6-074` in Wave48)

Wave49 verdict: **PASS (planning)** — PM brief + ADR 0016, Backend
`openapi-mvp6-9-draft.json` + companion contract, and Frontend UX requirements
agree on the read-only connector catalog + deterministic dry-run import preview
P0, the preview-creates-nothing / no-external-write / no-real-network /
masked-secret boundary, the all-false 9-flag `ConnectorMutationGuard`, the frozen
3-kind catalog, and secret-independent byte-stable previews. OpenAPI parses
(3.1.0, `0.6.9-draft`, 3 paths / 3 operations / 16 schemas), additive/disjoint to
MVP1–MVP6.8. No runtime leaked under `apps/`/`infra/`. No raw secret in artifacts.
R-series NOT RUNNABLE by design until Wave50.

> **QA ID note.** `INT6-*` used through `INT6-074` (Wave48). This theme uses
> **`INT6-075`~`INT6-082`** (`INT6-075` = the checklist slot in the backlog).

## Source Documents
- Wave order: `docs/handoffs/wave-049/NEXT_ORDERS.md`
- Reports: `docs/handoffs/wave-049/{PM,BACKEND,FRONTEND}_REPORT.md`
- PM brief: `docs/pm/MVP6_9_CONNECTORS_BRIEF.md`
- ADR: `docs/adr/0016-mvp6-9-connectors-read-only-catalog-dry-run-preview-no-external-write-no-real-network-masked-secret-boundary.md`
- API: `docs/api/MVP6_9_CONNECTORS_API_CONTRACT_DRAFT.md` + `docs/api/openapi-mvp6-9-draft.json`
- Frontend requirements: `docs/pm/MVP6_9_FRONTEND_UX_REQUIREMENTS.md`

## Verdict Semantics
- `PASS`: artifacts agree and preserve the read-only + preview-only + no-external-write + no-real-network + masked-secret boundary.
- `PARTIAL`: usable but named fields/enums/rules need targeted hardening.
- `FAIL`: opens external write, live/scheduled sync, real network/credential execution, raw-secret exposure, or any candidate/published mutation from a preview.
- `NOT RUNNABLE`: expected for runtime checks before Wave50.

## C-Series — Planning Gates (Wave49)
| ID | Gate | Verdict |
|---|---|---|
| INT6-075 / C1 | 3 endpoints present: `GET .../connectors`, `GET .../connectors/{connector_kind}/config-schema`, `POST .../connectors/{connector_kind}/import-preview` | PASS — OpenAPI has exactly these 3 paths (get/get/post) |
| INT6-076 / C2 | 5 frozen enums present verbatim: `ConnectorKind`(3), `ConnectorConfigFieldKind`(6), `ConnectorPreviewStatus`(READY/BLOCKED), `ConnectorPreviewCompatibility`(COMPATIBLE/WARNING/INCOMPATIBLE), `ConnectorPreviewTargetLayer`(CANDIDATE const) | PASS — all five match PM/ADR/FE exactly |
| INT6-077 / C3 | Read-only + dry-run + preview-creates-nothing boundary: the only write-shaped verb (`POST import-preview`) creates no candidate/entity/relation/source/extraction-job and never touches the published graph; preview items are **would-be** (`preview_ref` opaque, NOT a candidate id) | PASS — PM §2/§4, ADR Decision, BE draft Rules, FE §2.4/§9 agree |
| INT6-078 / C4 | All-false 9-flag `ConnectorMutationGuard` (`external_system_read`, `external_system_write`, `real_network_call_made`, `credential_persisted`, `connector_instance_persisted`, `source_created`, `candidate_graph_mutated`, `published_graph_mutated`, `extraction_job_started`) on **every** response (catalog/config-schema/preview) | PASS — 9 flags all `const:false` + all `required`; `mutation_guard` `$ref`'d by all 3 response schemas |
| INT6-079 / C5 | Masked-secret / no-raw-secret: `raw_secret_present:false` on config-schema + preview; no raw secret shown/entered/returned; preview is **secret-independent** (keyed by `connector_kind` + non-secret config); every artifact example is a non-secret placeholder | PASS — PM §2/§5, ADR, BE draft, FE §2.3 masked-secret rule + G3 agree; artifact scan clean |
| INT6-080 / C6 | Deterministic + bounded: same kind + non-secret config + same fixture → byte-stable; counts always exact; only `sample_items[]` capped by `item_cap` (P0=50) with `truncated` + exact `total_item_count`; `mapped_ontology_class_ref` = candidate-layer only (`target_layer:CANDIDATE`, never published), nullable → unmapped | PASS — PM §4 bounding, BE draft Rules, FE §2.4/§3 agree; preview schema has all bounding fields |
| INT6-081 / C7 | Authz + errors + reuse: any project-read member may list/read-schema/preview (no elevated role; reuse MVP5 `Role`, no new literal); `403 PERMISSION_DENIED`, `404 PROJECT_NOT_FOUND`, `404 CONNECTOR_KIND_NOT_FOUND`; malformed body `400 INVALID_CONNECTOR_CONFIG` while invalid-but-well-formed config → 200 `BLOCKED`/`INCOMPATIBLE`; MVP5/MVP6.4/MVP2/MVP1 shapes reused by reference, no renames | PASS — PM §7, ADR, BE draft §Authz + Reuse, FE §3/§6.5/G9 agree |
| INT6-082 / C8 | OpenAPI parses + additive/disjoint + no runtime leaked + durable invariants (candidate/published separation, evidence/version traceability, additive-only, no real network/LLM); PM/BE/FE agree on P0, model, boundary, exclusions | PASS — parse OK, 3 paths disjoint from all `openapi-mvp*.json`, `apps/`+`infra/` leak scan empty, no-secret scan clean |

## R-Series — Runtime Gates (Wave50 — VERIFIED by QA INT6-076..079)
| ID | Runtime gate | Verdict |
|---|---|---|
| R1 | 3 endpoints live; catalog returns exactly 3 frozen kinds with `has_secret_fields`/`config_field_count`/`total_count`=3; config-schema returns ordered `ConnectorConfigField[]` with SECRET fields masked + `raw_secret_present:false` | **PASS** — catalog `total_count`=3; config-schema 3 ordered fields/kind, SECRET masked w/ `SECRET_PLACEHOLDER_NOT_A_REAL_SECRET`, `raw_secret_present:false` on all 3 kinds |
| R2 | Dry-run preview is byte-stable for a fixed kind + non-secret config; **secret-independent** (identical result with SECRET omitted vs masked-placeholder); counts exact; `sample_items[]` capped at `item_cap`≤50 with `truncated`+exact `total_item_count` | **PASS** — QA script: normalized (excl `generated_at`/`preview_id`) preview byte-identical when SECRET value swapped to a different raw value, all 3 kinds; counts exact (FILE 6/REST 5/KB 4 records) |
| R3 | **Preview creates nothing — DATA-LEVEL:** candidate/entity/relation/source/extraction-job/published tables show before==after across catalog+schema+preview flow; no external socket/network call opened; `real_network_call_made=false` observed at runtime | **PASS** — independent QA script counted all **25** SQLite tables before/after catalog+3 schemas+3 previews+secret-alt reruns+BLOCKED+malformed+authz → **NONE mutated**; `real_network_call_made:false` |
| R4 | All-false 9-flag `ConnectorMutationGuard` on every live response (catalog/config-schema/preview); `raw_secret_present:false`; `preview_only:true`; constant `routing_note`; no code-level import of external-network/candidate-write/extraction-trigger/credential-store path | **PASS** — 9-flag guard all-false on every response (catalog/schema/preview/BLOCKED); `preview_only:true`, `raw_secret_present:false`, constant `routing_note` observed |
| R5 | No raw secret printed/persisted/logged/returned at runtime; SECRET request values (if carried) never echoed; preview items map to `CANDIDATE` only (`preview_ref` opaque, never a created candidate id) | **PASS** — injected concrete raw secret into REST/KB secret fields; never appeared in any response body; `target_layer:CANDIDATE`, `preview_ref` opaque |
| R6 | BLOCKED/INCOMPATIBLE returns a non-crash 200 result state with `blocked_reasons[]` and **zero fabricated items**; malformed body → `400 INVALID_CONNECTOR_CONFIG`; authz `403`/`404 PROJECT_NOT_FOUND`/`404 CONNECTOR_KIND_NOT_FOUND` | **PASS** — BLOCKED = 200 w/ `MISSING_REQUIRED_FIELD` notice + zero items; malformed body → 400 `INVALID_CONNECTOR_CONFIG`; bad role→403, bad project→404, bad kind→404 |
| R7 | Frontend connector flow (catalog → configure masked → dry-run preview → would-be candidate mapping) mock + actual smoke; no connect/import/sync/apply/execute/confirm affordance; live all-false-guard proof line; D6 badges; loading/empty/error/permission states | **PASS** — mock smoke PASS (3 routes/3 screenshots); **actual smoke RAN + PASS** (4 checks vs live SQLite backend); no connect/import/sync/execute affordance; single active LNB (Connectors in BUILD after Sources) |
| R8 | MVP1–MVP6.8 regression + touched smokes green; additive module + additive router registration; no renames of reused MVP5/MVP6.4/MVP2/MVP1 shapes; candidate/published separation intact | **PASS** — full backend suite **199 passed**; FE **85 tests + build** green; copilot/impact/governance mock smokes PASS; additive-only (router + scoped main.py handler + FE surface); no renames |

**R-Series OVERALL: PASS (8/8).** Recommend MVP6.9 thin closeout.

## Wave50 Gates — FROZEN by PM6-032 (see `docs/pm/MVP6_9_CONNECTORS_BRIEF.md` §12)
- **G1 — persist-vs-compute for `preview_id`: FROZEN compute-on-read / ephemeral.** `preview_id` ALWAYS `null`; nothing persisted; NO `GET .../import-preview/{preview_id}` and NO list endpoint (3 endpoints total). Read-only + all-false. FE treats preview as ephemeral view state.
- **G5 — per-kind fixture / `source_locator` shape: FROZEN.** Fixed byte-stable fixtures: `FILE_SOURCE`=6 (→COMPATIBLE), `REST_SOURCE`=5 (≥1 unmapped →WARNING), `KNOWLEDGE_BASE_SOURCE`=4 (→COMPATIBLE); `source_record_count`=fixture size, no external read. `source_locator` = opaque deterministic STRING `fixture:<file|rest|kb>/<resource>#row=<n>` (from non-secret config); FE renders it as opaque text. Matches the frozen `string|null` type — no shape change.
- **G6 — `warnings[]` / `blocked_reasons[]` element shape: FROZEN `ConnectorPreviewNotice {code, message}`.** `code` stable UPPER_SNAKE (WARNING: `UNMAPPED_FIELDS`/`MISSING_EVIDENCE_LOCATOR`/`PARTIAL_RECORD_MAPPING`; BLOCKED: `MISSING_REQUIRED_FIELD`/`INVALID_CONFIG_VALUE`/`INCOMPATIBLE_SOURCE_SHAPE`). Added to OpenAPI → **17 schemas** (was 16); the two arrays now `$ref` it. **C2's "16 schemas" and G7's "no `generated_at`" note below are superseded.**
- **G7 — freshness timestamp: FROZEN KEEP.** The source-of-truth `openapi-mvp6-9-draft.json` ALREADY declares `generated_at` (`date-time`, required); set at response time and EXCLUDED (with `preview_id:null`) from the byte-stable determinism assertion. The earlier "has no `generated_at`" statement was STALE. No contract change.
- **G12 — COMMANDER IA RULING (ratified) + PM copy (finalized):** the `Connectors` LNB item goes in the **BUILD group immediately after `Sources`** (ingestion-funnel adjacency: `Ontology → Sources → (Connectors preview) → Extraction → Candidates`). The Analyze placement is **rejected** (upstream ingestion, not downstream read/insight). Per-kind config/preview stays a **contextual sub-view** at `/projects/:p/connectors/:connectorKind` (frozen-enum route, not an ID-bound global page, per ADR 0010). **PM6-032 finalized:** page H1 = **`커넥터`** (Korean primary, D3); LNB label stays the English noun `Connectors`; KO glosses finalized in brief §12 (kinds/status/compatibility/target-layer/field-kinds/boundary-chips/notice-codes; primary action button = `미리보기 실행`).

## PM/BE/FE Agreement + FE Gap Reconciliation
- **Agree:** P0 flow, 3-kind catalog, masked config schema, dry-run preview model, read-only + dry-run + no-external-write + no-real-network + masked-secret boundary, all-false 9-flag guard, authz, exclusions, reuse-by-reference (no renames). No contradiction found across PM brief / ADR 0016 / BE draft+OpenAPI / FE requirements.
- **FE DTO gaps resolved by the BE draft:** G2 (`enum_values` added), G3 (request non-secret only / secret-independent), G4 (`OntologyElementRef`, nullable → unmapped state), G8 (9-flag const:false/required), G9 (malformed→400 vs invalid-but-well-formed→200 BLOCKED), G10 (`has_secret_fields`/`config_field_count`/`total_count` on catalog item), G11 (counts exact under truncation).
- **Remaining OPEN (Wave50 gates):** G1, G5, G6, G7 above. G12 is the recorded commander IA ruling + a PM copy confirm. None block the planning deliverable or P0 UX.

## Validation (Wave49) — exact commands + output
```text
$ python3 -m json.tool docs/api/openapi-mvp6-9-draft.json > /dev/null && echo PARSE_OK
PARSE_OK

# structural assertion (python)
openapi: 3.1.0 | version: 0.6.9-draft | num_paths: 3 | num_schemas: 16
PATH /api/v1/projects/{project_id}/connectors ['get']
PATH /api/v1/projects/{project_id}/connectors/{connector_kind}/config-schema ['get']
PATH /api/v1/projects/{project_id}/connectors/{connector_kind}/import-preview ['post']
ENUM ConnectorKind OK=True | ConnectorConfigFieldKind OK=True | ConnectorPreviewStatus OK=True
ENUM ConnectorPreviewCompatibility OK=True | ConnectorPreviewTargetLayer OK=True
guard flag count: 9 | GUARD_ALL_FALSE_9: True | required count: 9
mutation_guard present on ConnectorCatalogListResponse / ConnectorConfigSchemaResponse / ConnectorImportPreviewResponse (all $ref ConnectorMutationGuard)
DISJOINT_ADDITIVE: True

$ rg -n 'connector|Connector|import-preview|ConnectorMutationGuard|mvp6.9' apps infra --glob '!**/node_modules/**'
(0 matches — EXIT=1; no runtime leaked)

# no-raw-secret scan of planning artifacts
(only non-secret placeholders present: SECRET_PLACEHOLDER_NOT_A_REAL_SECRET, https://example.invalid/api; no realistic secret literal)

$ git diff --check
CHECK_OK
```

## Recommendation
Open **Wave50 MVP6.9 Connectors thin implementation** (read-only catalog +
deterministic dry-run import preview; deterministic fixtures; process-local store
if persist is chosen; masked secrets only; all-false 9-flag guard). PM freezes
G1/G5/G6/G7 and the G12 H1/KO-gloss copy; Backend implements the 3 additive
endpoints; Frontend adds the Build-group `Connectors` surface (after `Sources`);
QA independently verifies R1–R8, including the data-level "preview creates
nothing / no external call / no real network / all-false guard / no raw secret"
proof. Not a hardening or redesign wave — the planning contract is coherent.
