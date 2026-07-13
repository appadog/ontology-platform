# MVP6.11 Ontology Packs — P0 Freeze Brief

Status: `WAVE53 CONTRACT-FIRST PLANNING FROZEN (PM6-035, ADR 0018)`
Date: 2026-07-09

Contract-first planning freeze for the smallest coherent, SAFE ontology-pack P0:
a read-only **ontology-pack catalog** + a **deterministic dry-run apply-preview**.
No apply, no install, no external registry/fetch, no published-graph write, no
ontology-draft mutation (deterministic in-repo mock packs), all-false mutation
guard. A real apply would land in the DRAFT ontology via the existing MVP1
ontology-edit / MVP6.6 governance-application (DRAFT-only, human-initiated) path —
out of P0 scope. Durable boundary: ADR 0018. Runtime waits for Wave54.

## 1. P0 demo flow (frozen)

```text
select project
-> open Ontology Packs (Build / Ontology area)
-> view pack catalog (3 deterministic mock packs: metadata + element counts)
-> open a pack -> see its bundled ontology elements (classes / properties / relations)
-> run a dry-run APPLY-PREVIEW against this project's current DRAFT ontology
-> read: compatibility rollup + summary counts + capped sample of would-add /
   would-modify items, each dispositioned NEW / CONFLICT / DUPLICATE
-> read the explicit "preview only — nothing applied; a real apply routes through
   the existing MVP1 ontology-edit / MVP6.6 governance-application path" boundary
```

Nothing is installed. Nothing is applied. Nothing is written to any ontology
layer or the published graph.

## 2. Non-negotiable boundary (= ADR 0018)

- **Read-only catalog + dry-run apply-preview only.** No apply, no install
  (`OntologyPackInstall`), no Pack Install Wizard write, no auto-apply.
- **No published-graph write / no ontology-draft mutation.** The apply-preview
  diffs against the current DRAFT ontology **read-only**; it mutates neither the
  DRAFT nor the published graph. `ontology_draft_mutated` and
  `published_graph_mutated` are always false (headline invariant).
- **No external fetch.** Deterministic in-repo **mock packs** only; no pack
  registry / gallery / download / update-notification. Exactly 3 frozen packs.
- **Apply routes elsewhere, later.** A real apply is deferred and would route
  through the existing MVP1 ontology-edit / MVP6.6 governance-application
  (DRAFT-only, human-initiated) path — a pack is never a second, unreviewed
  ontology-write path. Preview items are **would-be** DRAFT-layer elements, not
  rows.
- **All-false mutation guard on every response** (§6). Additive only; no break of
  MVP1–MVP6.10 surfaces/smokes; reuse existing shapes by reference (no renames).

## 3. Pack catalog model (frozen)

### 3 deterministic mock packs (roadmap §11.2 example domains)

| `pack_id` | `name` | `domain` | `version` |
|---|---|---|---|
| `pack-insurance-core` | 보험 코어 도메인 팩 | insurance | `1.0.0` |
| `pack-manufacturing-equipment` | 제조 설비 도메인 팩 | manufacturing | `1.0.0` |
| `pack-legal-compliance` | 법률/규정 도메인 팩 | legal | `1.0.0` |

Single frozen version per pack (no multi-version management in P0). Each pack =
a bundle of **ontology elements only** (classes / properties / relations) +
metadata.

### Pack metadata (list + detail)
`pack_id` (opaque stable string), `name`, `domain`, `version`, `description`,
element counts (`class_count`, `property_count`, `relation_count`,
`element_count`). Catalog is global read-only and byte-stable across calls.

### Pack detail — bundled elements
An ordered list of `OntologyElementRef`-style element descriptors grouped by
`PackElementKind` (`CLASS` / `PROPERTY` / `RELATION`), reusing MVP1 ontology
element + `OntologyElementRef` (`target_kind`) shapes **by reference** (no rename).
Packs carry ontology elements only — **no** prompt templates, validation rules,
sample docs/datasets, constraints, dashboard defaults, or viz presets in P0.

## 4. Dry-run apply-preview model (frozen, bounded, deterministic)

Given a `pack_id` + a target `project_id` (its current DRAFT ontology), return a
deterministic preview of what the pack WOULD add / WOULD modify, mapped to the
DRAFT layer, plus a per-item disposition and a compatibility/summary rollup.
Bounded for determinism (caps + truncation). Creates nothing.

Preview response (Backend finalizes exact field names):
- `preview_id` (nullable; ephemeral/`null` recommended — G1), `project_id`,
  `pack_id`, `pack_version`, `generated_at`
- `preview_only: true`
- `status` — `PackApplyPreviewStatus`
- `compatibility` — `PackApplyCompatibility`
- `summary` — exact counts: `would_add_count`, `would_modify_count`,
  `conflict_count`, `duplicate_count`, `total_element_count`
- `items[]` — capped list of preview items:
  - `preview_ref` (opaque; **not** a created ontology element id)
  - `element_kind` — `PackElementKind`
  - `disposition` — `PackPreviewItemDisposition` (NEW / CONFLICT / DUPLICATE)
  - `target_layer` — `PackApplyTargetLayer` (`DRAFT`)
  - `mapped_ontology_ref` — `OntologyElementRef`-style, by reference
  - `pack_element_label`, `existing_element_label` (when CONFLICT / DUPLICATE)
  - `note`
- `item_cap`, `truncated` (bool), `total_item_count` (exact even when truncated)
- `warnings[]`, `blocked_reasons[]` — `PackPreviewNotice {code, message}`
- `routing_note` — *"preview only — nothing applied; a real apply routes through
  the existing MVP1 ontology-edit / MVP6.6 governance-application (DRAFT-only,
  human-initiated) path."*
- `mutation_guard` — all-false `OntologyPackMutationGuard` (§6)

### `PackApplyPreviewStatus`
- `READY` — preview computed against the project DRAFT ontology.
- `BLOCKED` — invalid target (unknown pack / missing project / no DRAFT ontology)
  or nothing applyable; `blocked_reasons[]` explains. No crash, no fabricated items.

### `PackElementKind`
- `CLASS` / `PROPERTY` / `RELATION` — aligns with `OntologyElementRef.target_kind`.

### `PackPreviewItemDisposition` (per item, vs current DRAFT)
- `NEW` — no matching element in the DRAFT → would be added.
- `CONFLICT` — an element with the same identity exists but differs → would need
  human resolution; **never auto-overwritten**.
- `DUPLICATE` — an identical element already exists → would be a no-op.

### `PackApplyCompatibility` (rollup; mirrors MVP5/MVP6.4 dry-run precedent)
- `COMPATIBLE` — all items `NEW`; would apply cleanly.
- `WARNING` — some `DUPLICATE` and/or `CONFLICT` items; applyable, but flagged
  items need human resolution via the real-apply path.
- `INCOMPATIBLE` — invalid target or nothing applyable → `BLOCKED`.

### `PackApplyTargetLayer`
- `DRAFT` — single literal; asserts preview items map to the DRAFT ontology layer
  only, **never** candidate, **never** published.

### `PackPreviewNotice` (mirrors MVP6.9 `{code, message}`)
Stable UPPER_SNAKE `code` (D6 badge / i18n) + deterministic Korean-primary
`message`. Suggested code vocabulary (Backend finalizes):
WARNING — `EXISTING_DUPLICATE_ELEMENT`, `NAME_CONFLICT_DIFFERENT_DEFINITION`,
`UNRESOLVED_RELATION_ENDPOINT`; BLOCKED — `PACK_NOT_FOUND`,
`NO_DRAFT_ONTOLOGY`, `EMPTY_PACK`. `blocked_reasons[]` non-empty ONLY when
`status=BLOCKED`; `warnings[]` carries WARNING-tone notices.

### Bounding
Deterministic, cheap: max returned-items cap (P0 e.g. `50`) with `truncated:true`
+ exact `total_item_count` when hit. Counts always exact; only the item list is
capped. Same pack + same project DRAFT → byte-stable (modulo `generated_at` +
`preview_id`).

## 5. Reuse (by reference, no renames)

| Precedent | Reuse |
|---|---|
| MVP1 ontology | `OntologyElementRef` (+ `target_kind`), class/property/relation shapes, ontology-version context — the **would-be** target of a preview item AND the current-DRAFT elements diffed against (never created rows). |
| MVP5 admin JSON import **dry-run** | `compatibility_status` + `summary` counts + `confirmation_required`-style "nothing applied" pattern. |
| MVP6.4 `GoldSetImportCompatibility` | dry-run compatibility-state precedent (COMPATIBLE / WARNING / INCOMPATIBLE style). |
| MVP6.9 connectors | direct structural precedent — read-only catalog + bounded deterministic dry-run preview + all-false guard + `PackPreviewNotice {code, message}` + cap/`truncated`/exact-total bounding. |
| MVP6.6 governance-application (ADR 0013) | the DRAFT-only, human-initiated real-apply route a pack would later route through (named, not built). |
| MVP5 `Role` | read authorization (no new role literal). |

## 6. All-false `OntologyPackMutationGuard` (frozen; every response)

- `pack_installed: false`
- `ontology_draft_mutated: false`
- `ontology_class_created: false`
- `ontology_property_created: false`
- `ontology_relation_created: false`
- `candidate_graph_mutated: false`
- `published_graph_mutated: false`
- `change_request_created: false`

Every flag false on catalog list, pack detail, and apply-preview. No exceptions.
`ontology_draft_mutated` + `published_graph_mutated` are the headline assertions
(distinct from the single MVP6.6 apply guard, which turns `ontology_draft_mutated`
true; MVP6.11 turns **no** flag true).

## 7. Authorization (frozen)

- Read-only, mutates nothing, grants nothing → any project member who can view the
  project may list the catalog, read a pack detail, and run a dry-run
  apply-preview. No elevated role. Reuse MVP5 `Role`; no new role literal.
- A later real apply (P1) would require ontology-edit / governance-approver rights
  (`ONTOLOGY_MANAGER` / `PROJECT_ADMIN` / `SYSTEM_ADMIN`) via the existing MVP1 /
  MVP6.6 path — out of P0.
- Unauthorized → `403 PERMISSION_DENIED`. Missing project / unknown pack →
  `404 PROJECT_NOT_FOUND` / `404 ONTOLOGY_PACK_NOT_FOUND`.

## 8. Suggested endpoint families (planning; Backend finalizes)

- `GET  /api/v1/ontology-packs` — list pack catalog (global read-only; metadata + counts).
- `GET  /api/v1/ontology-packs/{pack_id}` — pack detail (metadata + bundled elements).
- `POST /api/v1/projects/{project_id}/ontology-packs/{pack_id}/apply-preview` — deterministic dry-run apply-preview against the project's DRAFT ontology (creates nothing).

Catalog is global (packs are reusable templates, project-agnostic); the
apply-preview is project-scoped (needs the project's current DRAFT ontology to
diff against). Persist-vs-compute for `preview_id` (list + GET-by-id) is a Backend
decision (G1; mirror MVP6.9 compute-on-read/ephemeral recommended); either way
read-only + all-false guard. Process-local `reset_runtime_store()` acceptable;
durable DB/Alembic is P1/P2.

## 9. Explicit exclusions (P1+ unless PM re-freezes)

Real pack apply / install (`OntologyPackInstall`); Pack Install Wizard write;
auto-apply / auto-confirmed apply; published-graph write; ontology-DRAFT mutation
(preview only); external pack registry / gallery / fetch / download; pack update
notifications; versioned pack dependency resolution; multi-version pack management
(`OntologyPackVersion`); pack authoring / publishing (create / edit / version /
publish); non-ontology pack payloads (`PromptPack` / `ValidationRulePack` /
`SampleDatasetPack`, constraints, sample docs/datasets, dashboard defaults, viz
presets); a diff-and-apply tool (preview diff is read-only; applying is not);
direct candidate or published-graph mutation; any real LLM execution; any new pack
beyond the frozen 3.

## 10. Durable invariants preserved

- Candidate/published separation: the preview only maps to **would-be** DRAFT
  ontology elements; it writes no layer, and never touches the published graph.
- Evidence/version traceability: preview items reference `OntologyElementRef` +
  ontology-version context; a real apply would carry through the existing gated
  ontology-edit / governance path.
- Contract-first + additive-only: no MVP1–MVP6.10 rename/break; reuse by reference.
- No external fetch / no real LLM: deterministic in-repo mock packs.
- No unreviewed ontology write: apply is deferred to the reviewed MVP1 / MVP6.6
  path; P0 turns no mutation flag true.

## 11. Wave54 gates (FROZEN by PM6-036 — `docs/handoffs/wave-054/PM_REPORT.md`)

No contract shape change: the OpenAPI (`0.6.11-draft`, 3 paths / 19 schemas / 5
enums + 8-flag guard) is implemented EXACTLY as drafted. The rulings below are
deterministic refinements consistent with that draft.

- **G1 — `preview_id` (FROZEN).** COMPUTE-ON-READ / EPHEMERAL: `preview_id` is
  always `null`; no GET-by-id, no list-preview endpoint; recompute is byte-identical
  modulo `generated_at`. (Mirrors MVP6.9 G1.)
- **G2 — catalog scope (FROZEN).** Catalog + detail global (`/ontology-packs`,
  `/ontology-packs/{pack_id}`); apply-preview project-scoped
  (`/projects/{project_id}/ontology-packs/{pack_id}/apply-preview`).
- **G3 — DRAFT-diff basis + fixture matrix (FROZEN).** The preview diffs the pack
  against a deterministic **process-local DRAFT-ontology snapshot** fixture keyed by
  `project_id` (connectors/tenancy self-contained-fixture precedent; read-only,
  re-seeded by `reset_runtime_store()`; wiring to the live MVP1 draft-ontology reader
  is a P1 follow-up with identical diff logic). DRAFT-ness is **version-level**
  (`OntologyVersion.status==DRAFT`; the snapshot's non-DELETED elements under that
  version). Fixture matrix (full table in the PM report): `proj-packs-demo` holds a
  DRAFT with a manufacturing overlap set (`mfg.equipment` class + `serial_no` prop =
  identical, `mfg.sensor` class = different-definition) → **insurance/legal packs =
  COMPATIBLE (all NEW)**, **manufacturing pack = WARNING (NEW + 1 CONFLICT + 2
  DUPLICATE)**; `proj-packs-no-draft` (no DRAFT version) → **BLOCKED / INCOMPATIBLE
  (`NO_DRAFT_ONTOLOGY`), zero items**. Exercises all 3 dispositions + all 3
  compatibilities deterministically.
- **G4 — element-identity match rule (FROZEN).** Two elements match iff
  `element_kind` equal AND normalized identity key equal (key normalized
  NFC + trim + casefold; PROPERTY key scoped by its owning-class key, RELATION by
  name — mirrors MVP1 `(version, class, name)` / `(version, name)` uniqueness).
  Given a match: equal `definition_signature` → **DUPLICATE** (no-op); different
  `definition_signature` → **CONFLICT** (human resolution, never auto-overwritten);
  no match → **NEW**. `definition_signature` is a deterministic canonical string over
  the element's semantic definition (CLASS: label+description; PROPERTY:
  owning-class-key + label + data_type; RELATION: domain-key + range-key + label),
  computed identically for pack + DRAFT sides. Summary math: `would_add_count == NEW`,
  `would_modify_count == conflict_count` (CONFLICT only; **DUPLICATE is its own
  `duplicate_count` bucket, NOT folded into would_modify**), `total_element_count =
  would_add + conflict + duplicate`. `mapped_ontology_ref` = `null` for NEW; non-null
  (the existing DRAFT element identity) for CONFLICT / DUPLICATE.
- **G5 / G12 — LNB / IA placement (RATIFIED, COMMANDER IA).** A new **BUILD-group**
  LNB item `Ontology Packs` immediately **after `Ontology`** (project-scoped; single
  active LNB preserved); H1 `온톨로지 팩`; pack detail + apply-preview are contextual
  sub-views (`/projects/:p/ontology-packs`, `.../:packId`), never ID-bound global
  pages (ADR 0010).
- **G6 / G7 / G9 (CONFIRMED).** G6 notice vocab frozen (WARNING:
  `EXISTING_DUPLICATE_ELEMENT` / `NAME_CONFLICT_DIFFERENT_DEFINITION` /
  `UNRESOLVED_RELATION_ENDPOINT`; BLOCKED: `NO_DRAFT_ONTOLOGY` = the only one that
  fires in P0, `EMPTY_PACK` + `PACK_NOT_FOUND` reserved — unknown pack is a 404, all
  3 packs are non-empty). G7 `generated_at` present (ISO-8601 UTC) + EXCLUDED with
  `preview_id` from the byte-stable assertion. G9 transport split: invalid body
  (`item_cap` ∉ [1,50] / malformed) → **400**; unknown pack → **404**
  `ONTOLOGY_PACK_NOT_FOUND`; unknown project → **404** `PROJECT_NOT_FOUND`;
  non-member → **403** `PERMISSION_DENIED`; valid target with no DRAFT ontology /
  nothing applyable → **200** `status=BLOCKED` (a result state, not a 4xx).

## 12. Backlog IDs

PM `PM6-035`; Backend `BE6-080`~`BE6-081`; Frontend `FE6-099`; QA `INT6-094`.
(See `docs/backlog/MVP6_DRAFT_BACKLOG.md` Wave53 section.)
