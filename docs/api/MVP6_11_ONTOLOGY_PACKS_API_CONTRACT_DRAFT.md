# MVP6.11 Ontology Packs API Contract Draft (planning-only, additive)

Status: Wave53 contract-first planning (`BE6-080`/`BE6-081`). Authoritative machine
artifact: `docs/api/openapi-mvp6-11-draft.json` (OpenAPI 3.1.0, `0.6.11-draft`,
**3 paths / 3 operations / 19 schemas**, PARSE_OK, disjoint-additive to
MVP1-MVP6.10). This markdown is the human-readable companion; the OpenAPI is the
source of truth. No runtime/model/migration/test/seed code (Wave54 waits). Frozen
by `docs/pm/MVP6_11_ONTOLOGY_PACKS_BRIEF.md` + ADR 0018.

## Boundary (ADR 0018)
MVP6.11 P0 is a **read-only ontology-pack catalog + deterministic dry-run
apply-preview**. Nothing is installed, nothing is applied, nothing is written to
any ontology layer. No external registry/fetch/download (deterministic in-repo
mock packs). Every response carries an all-false 8-flag `OntologyPackMutationGuard`.
The apply-preview reads the project's current DRAFT ontology **only to diff
against** and maps each pack element to a **would-be** DRAFT-layer item; it creates
no class/property/relation, opens no change request, and never touches the DRAFT,
candidate, or published graph. A real apply is deferred and would route through the
existing MVP1 ontology-edit / MVP6.6 governance-application (DRAFT-only,
human-initiated) path — a pack is never a second, unreviewed ontology-write path.

## Endpoints (all additive)
- `GET  /api/v1/ontology-packs` — list pack catalog (GLOBAL, 3 mock packs; metadata + counts). -> `OntologyPackCatalogListResponse`
- `GET  /api/v1/ontology-packs/{pack_id}` — pack detail (metadata + bundled elements). -> `OntologyPackDetailResponse`
- `POST /api/v1/projects/{project_id}/ontology-packs/{pack_id}/apply-preview` — deterministic dry-run apply-preview against the project's DRAFT ontology (creates nothing; body optional). -> `PackApplyPreviewResponse`

Catalog + detail are GLOBAL (packs are reusable, project-agnostic templates); the
apply-preview is project-scoped (needs the project's current DRAFT ontology to diff
against).

## 3 frozen mock packs (deterministic, in-repo)
| `pack_id` | `name` | `domain` | `version` |
|---|---|---|---|
| `pack-insurance-core` | 보험 코어 도메인 팩 | insurance | `1.0.0` |
| `pack-manufacturing-equipment` | 제조 설비 도메인 팩 | manufacturing | `1.0.0` |
| `pack-legal-compliance` | 법률/규정 도메인 팩 | legal | `1.0.0` |

Each pack = ontology elements only (classes/properties/relations) + metadata. No
prompt templates, validation rules, sample docs/datasets, constraints, dashboards,
or viz presets in P0.

## Enums (frozen; in the OpenAPI, used verbatim)
- `PackElementKind`: `CLASS` / `PROPERTY` / `RELATION` (aligns with existing
  `OntologyElementRef.target_kind` / `ChangeRequestTargetKind`; no rename).
- `PackApplyPreviewStatus`: `READY` / `BLOCKED`.
- `PackPreviewItemDisposition`: `NEW` / `CONFLICT` / `DUPLICATE`.
- `PackApplyCompatibility`: `COMPATIBLE` / `WARNING` / `INCOMPATIBLE`.
- `PackApplyTargetLayer`: `DRAFT` (single literal; `const` — asserts DRAFT-only,
  never candidate, never published).

Disposition semantics (vs current DRAFT): `NEW` = not present -> would be added;
`CONFLICT` = same identity exists but differs -> human resolution required, NEVER
auto-overwritten; `DUPLICATE` = identical element exists -> no-op. Compatibility
rollup: `COMPATIBLE` = all NEW; `WARNING` = some DUPLICATE/CONFLICT; `INCOMPATIBLE`
= invalid target / nothing applyable (paired with `status=BLOCKED`).

## Key DTOs
- `OntologyPackMutationGuard` — 8 flags, all `const:false`, all `required`, on
  **every** response: `pack_installed`, `ontology_draft_mutated`,
  `ontology_class_created`, `ontology_property_created`, `ontology_relation_created`,
  `candidate_graph_mutated`, `published_graph_mutated`, `change_request_created`.
  `ontology_draft_mutated` + `published_graph_mutated` are the headline assertions.
- `OntologyPackElementCounts` — exact `class_count`, `property_count`,
  `relation_count`, `element_count` (== sum).
- `OntologyPackCatalogItem` / `OntologyPackCatalogListResponse` — pack metadata
  (`pack_id`, `name`, `domain`, `version`, `description`, `mock:true`,
  `element_counts`) + exact `total_count`.
- `PackElementDescriptor` — one bundled element: `element_key` (opaque pack-internal
  key, NOT a created id), `element_kind`, `label`, `description`.
- `OntologyPackDetailResponse` — metadata + `element_counts` + ordered `elements[]`.
- `PackApplyPreviewRequest` — optional body; only `item_cap` (<=50).
- `PackApplyPreviewSummary` — exact counts: `would_add_count`, `would_modify_count`,
  `conflict_count`, `duplicate_count`, `total_element_count`.
- `PackPreviewNotice` — `{code, message}` (mirrors MVP6.9). `code` stable
  UPPER_SNAKE token; `message` deterministic Korean-primary. Element of both
  `warnings[]` and `blocked_reasons[]`. Codes — WARNING:
  `EXISTING_DUPLICATE_ELEMENT` / `NAME_CONFLICT_DIFFERENT_DEFINITION` /
  `UNRESOLVED_RELATION_ENDPOINT`; BLOCKED: `PACK_NOT_FOUND` / `NO_DRAFT_ONTOLOGY` /
  `EMPTY_PACK`.
- `PackPreviewItem` — `preview_ref` (opaque, NOT a created ontology element id),
  `element_kind`, `disposition`, `target_layer:DRAFT`, `mapped_ontology_ref`
  (`OntologyElementRef` or null; id fields null for NEW), `pack_element_label`,
  `existing_element_label` (CONFLICT/DUPLICATE only), `note`.
- `PackApplyPreviewResponse` — `preview_id` (nullable; G1 ephemeral recommended),
  `project_id`, `pack_id`, `pack_version`, `generated_at`, `preview_only:true`,
  `status`, `compatibility`, `target_layer:DRAFT`, `summary`, capped `items[]`,
  `item_cap`, `truncated`, exact `total_item_count`, `warnings[]`/`blocked_reasons[]`
  (`PackPreviewNotice[]`), constant `routing_note`, `mutation_guard`. `generated_at`
  (set at response time) and `preview_id` (G1: `null`) are EXCLUDED from the
  byte-stable determinism assertion.
- `OntologyElementRef` / `OntologyElementStatus` — reused BY REFERENCE from
  MVP1 / MVP6.5-6.7 (same shape/names, no rename); defined locally to keep the draft
  self-contained. Names the WOULD-BE DRAFT-layer target; creates nothing.

## Rules
- **Read-only + dry-run only.** The only write-shaped verb (`POST apply-preview`)
  creates nothing; it is a pure deterministic computation over the pack + the
  project's current DRAFT ontology (read-only diff).
- **Deterministic + bounded.** Same pack + same project DRAFT -> byte-stable (modulo
  `generated_at` + `preview_id`). Counts always exact; only `items[]` is capped
  (`item_cap`, P0=50) with `truncated` + exact `total_item_count`.
- **DRAFT-only, no mutation.** Preview items map to `target_layer:DRAFT` only; the
  DRAFT is read, never written; candidate/published never touched.
- **BLOCKED not crash.** Invalid target (unknown pack / missing project / no DRAFT
  ontology / empty pack) -> `status:BLOCKED` + `blocked_reasons[]`, never a crash,
  never fabricated items.
- **All-false guard on every response** (catalog, detail, preview). MVP6.11 turns no
  flag true, ever.
- **Authz.** Any project member who can view the project may list catalog, read a
  pack detail, and run apply-preview — no elevated role (reuse MVP5 `Role`, no new
  literal). Unauthorized -> `403 PERMISSION_DENIED`; missing project / unknown pack
  -> `404 PROJECT_NOT_FOUND` / `404 ONTOLOGY_PACK_NOT_FOUND`. (A later real apply
  would require ontology-edit / governance-approver rights via the existing
  MVP1 / MVP6.6 path — out of P0.)

## Reuse (by reference, no renames)
- MVP1 ontology element + `OntologyElementRef` (`target_kind`) + ontology-version
  context — the would-be DRAFT target AND the current-DRAFT elements diffed against
  (never created rows). `OntologyElementStatus` reused verbatim.
- MVP5 admin JSON import **dry-run** — `compatibility` + `summary` counts +
  "nothing applied" via `preview_only` / `routing_note`.
- MVP6.4 `GoldSetImportCompatibility` COMPATIBLE/WARNING/INCOMPATIBLE precedent.
- MVP6.9 connectors — direct structural precedent: read-only catalog + bounded
  deterministic dry-run preview + all-false guard + `{code, message}` notice +
  `cap`/`truncated`/exact-total bounding + opaque `preview_ref`.
- MVP6.6 governance-application (ADR 0013) — the DRAFT-only, human-initiated
  real-apply route a pack would later route through (named, not built).
- MVP5 `Role` for read authorization.

## Open questions -> Wave54 gates (FE/QA)
1. **G1 Persist-vs-compute (`preview_id`).** Recommend COMPUTE-ON-READ / EPHEMERAL
   (mirrors MVP6.9 G1): `preview_id` always `null`, no `GET .../apply-preview/{id}`
   and no list-preview endpoint; recompute yields byte-identical results (modulo
   `generated_at`). Backend confirms in Wave54. No contract shape change either way.
2. **G3 DRAFT-diff basis + fixture matrix.** How the preview reads the project's
   current DRAFT ontology, and the deterministic fixtures that exercise all 3
   dispositions (NEW / CONFLICT / DUPLICATE) and all compatibilities (COMPATIBLE /
   WARNING / INCOMPATIBLE / BLOCKED). Backend freezes the fixture matrix in Wave54.
3. **G4 Element-identity match rule.** How NEW / CONFLICT / DUPLICATE is decided —
   proposed: by element name/key within `element_kind` (the `element_key` +
   `element_kind` pair). Backend freezes the exact rule (case/normalization) in
   Wave54.
4. **G5 LNB / IA placement (ADR 0010).** A Build/Ontology-area contextual sub-view
   (e.g. `/projects/:p/ontology-packs`), not a new ID-bound global LNB page.
   Frontend proposes; PM/commander ratifies.
5. **Notice vocabulary.** WARNING/BLOCKED codes above are the frozen P0 vocabulary;
   Backend may extend only additively if a fixture needs it.
