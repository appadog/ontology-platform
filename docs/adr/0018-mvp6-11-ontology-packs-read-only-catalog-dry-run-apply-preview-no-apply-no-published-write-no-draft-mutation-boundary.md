# ADR 0018: MVP6.11 Ontology Packs — Read-Only Pack Catalog + Deterministic Dry-Run Apply-Preview, No-Apply, No-Published-Write, No-Draft-Mutation, All-False Mutation Guard Boundary

## Status

Accepted

## Context

MVP6.9 (ADR 0016) shipped the read-only connector CATALOG + deterministic
DRY-RUN import PREVIEW: three surfaces, deterministic mock kinds on fixture data,
no real network / no external write, an all-false mutation guard, and an explicit
"preview only — nothing imported; a real run routes through the existing
extraction → candidate → review → publish gate" boundary. MVP6.6 (ADR 0013)
shipped the one sanctioned mutation surface on this platform — a human-initiated,
DRAFT-only governance-application apply (`ontology_draft_mutated` the single true
flag), never touching the published graph. MVP6.11 is the next user-directed theme
— roadmap §11 Theme 8 **Ontology Pack / Domain Template** — kept to its smallest
coherent, SAFE form.

The roadmap theme is broad and dangerous if taken whole: installable domain packs
(`OntologyPack`/`OntologyPackVersion`/`OntologyPackInstall`/`OntologyPackTemplateItem`),
bundled `PromptPack`/`ValidationRulePack`/`SampleDatasetPack`, a Pack Install
Wizard that writes ontology, an external pack registry/gallery with update
notifications, versioned dependency resolution, and a diff-and-apply tool. All of
that means an ontology-mutating install path — a second way to change a project's
ontology outside the reviewed MVP1 ontology-edit / MVP6.5 governance-request /
MVP6.6 governance-application flow — plus external fetch and auto-apply. None of
that is acceptable in a first thin slice.

The product need at P0 is modest and safe: let a user **see which reusable
ontology packs exist**, **inspect a pack's bundled ontology elements**
(classes / properties / relations), and **preview what applying a pack WOULD
add / modify** against the project's current DRAFT ontology — deterministically,
from fixture packs, with **nothing installed, nothing applied, and nothing written
to any ontology layer or the published graph**. This mirrors the trusted MVP6.9
connector dry-run precedent (catalog + deterministic bounded preview + all-false
guard + `{code, message}` notices) and the MVP5/MVP6.4 import **dry-run**
compatibility precedent (COMPATIBLE / WARNING / INCOMPATIBLE + "nothing applied").
It reuses the MVP1 ontology-element shapes by reference as the **would-be** target
of each preview item, and it names — but does not build — the deferred real-apply
route: the existing MVP1 ontology-edit / MVP6.6 governance-application (DRAFT-only,
human-initiated) path. This ADR fixes the boundary so the pack surface cannot be
mistaken for an installer, an external registry, an ontology-draft write path, a
published-graph write path, or a second (unreviewed) way to mutate the ontology.

Surfaces reused **by reference, no renames**:
- MVP1 ontology elements: `OntologyElementRef` (+ its `target_kind` CLASS /
  PROPERTY / RELATION vocabulary), class / property / relation shapes, and
  ontology-version context — as the **would-be** target a preview item maps to and
  as the current-DRAFT elements the preview diffs against; never as created rows.
- MVP6.4 `GoldSetImportCompatibility` / MVP5 admin JSON import **dry-run**
  (`compatibility_status` + `summary` counts + `confirmation_required`-style
  "nothing applied") — the compatibility-rollup + non-mutation precedent.
- MVP6.9 connectors — the direct structural precedent: read-only catalog + bounded
  deterministic dry-run preview + all-false guard + `{code, message}` notices +
  cap/`truncated`/exact-total bounding.
- MVP6.6 governance-application (ADR 0013) — the DRAFT-only, human-initiated
  real-apply route a pack would later route through; **not** built here.
- MVP5 `Role` — read authorization; no new role literal.

## Decision

- **MVP6.11 P0 is a read-only ontology-pack CATALOG + a deterministic DRY-RUN
  APPLY-PREVIEW.** Three surfaces only: (1) list the registered deterministic
  **mock** ontology packs (metadata + element counts); (2) get a pack's detail
  (metadata + the bundled ontology elements: classes / properties / relations by
  reference); (3) run a **dry-run apply-preview** for a pack against a target
  project's current DRAFT ontology that returns a deterministic, bounded report of
  what the pack WOULD add / WOULD modify, mapped to the DRAFT layer, plus a
  disposition-per-item and a compatibility/summary rollup. Nothing is installed,
  applied, or written.

- **NO APPLY / NO INSTALL — the load-bearing rule.** The apply-preview **applies
  nothing**. It creates no ontology class / property / relation, mutates no DRAFT
  ontology version, creates no `OntologyPackInstall`, opens no governance change
  request, and touches neither the candidate nor the published graph. Preview items
  are **would-be** DRAFT-layer elements (opaque `preview_ref`, mapped to an
  `OntologyElementRef`-style target by reference) — never created rows. Every
  response carries an explicit boundary note: *"preview only — nothing applied; a
  real apply routes through the existing MVP1 ontology-edit / MVP6.6
  governance-application (DRAFT-only, human-initiated) path."* Any real apply in a
  later wave MUST route through that existing reviewed/gated path; a pack is never
  a second, unreviewed ontology-write path.

- **NO PUBLISHED-GRAPH WRITE / NO DRAFT MUTATION.** The published graph is NEVER
  touched (publishing stays the separate MVP3 path). The DRAFT ontology is NEVER
  mutated by any P0 surface (the preview only diffs against it read-only). The two
  hardest-to-guarantee flags — `published_graph_mutated` and
  `ontology_draft_mutated` — are **always false** in P0 (distinct from the single
  MVP6.6 apply guard, which turns `ontology_draft_mutated` true; MVP6.11 turns
  **no** flag true, ever).

- **NO EXTERNAL FETCH / DETERMINISTIC MOCK PACKS.** P0 packs are **deterministic,
  in-repo mock packs** (fixture data). No external pack registry / gallery is
  fetched, no network call is made, no pack is downloaded. Exactly three frozen
  mock packs exist; the catalog is stable and byte-identical across calls.

- **Pack catalog model (frozen, minimal).** Exactly **three** deterministic mock
  packs, each a bundle of ontology elements + metadata:
  `pack-insurance-core`, `pack-manufacturing-equipment`, `pack-legal-compliance`
  (mirroring roadmap §11.2 example domains). Each pack carries `pack_id` (opaque
  stable string), `name`, `version` (single frozen semver-style string, e.g.
  `1.0.0`; no multi-version management in P0), `domain`, `description`, and exact
  element counts (`class_count`, `property_count`, `relation_count`,
  `element_count`). The detail surface lists the bundled elements as
  `OntologyElementRef`-style descriptors by kind. Packs contain **ontology elements
  only** in P0 — no `PromptPack` / `ValidationRulePack` / `SampleDatasetPack`
  content, no constraints / prompt-templates / sample-docs / dashboard / viz-preset
  payloads.

- **Dry-run apply-preview model (frozen, bounded, deterministic).** Given a pack +
  a target project (its current DRAFT ontology), the preview returns:
  `PackApplyPreviewStatus` (`READY` / `BLOCKED`); a `PackApplyCompatibility` rollup
  (`COMPATIBLE` / `WARNING` / `INCOMPATIBLE`); an exact `summary` of counts
  (`would_add_count`, `would_modify_count`, `conflict_count`, `duplicate_count`,
  `total_element_count`); and a **capped** list of preview items, each with an
  opaque `preview_ref`, a `PackElementKind` (`CLASS` / `PROPERTY` / `RELATION`,
  aligning with `OntologyElementRef.target_kind`), a `PackPreviewItemDisposition`
  (`NEW` / `CONFLICT` / `DUPLICATE`), a `PackApplyTargetLayer` (`DRAFT` — single
  literal; asserts DRAFT layer only, never candidate, never published), a
  `mapped_ontology_ref` (`OntologyElementRef`-style, by reference), a pack-side
  label, an existing-element label (when CONFLICT / DUPLICATE), and a note. Item
  disposition semantics: `NEW` = no matching element in the current DRAFT → would
  be added; `CONFLICT` = an element with the same identity exists but differs →
  would need human resolution (never auto-overwritten); `DUPLICATE` = an identical
  element already exists → would be a no-op. Compatibility rollup: `COMPATIBLE` =
  all items `NEW` (clean add); `WARNING` = some `DUPLICATE` and/or `CONFLICT` items
  (applyable with human resolution of flagged items via the real-apply path);
  `INCOMPATIBLE` = invalid target (unknown pack / missing project / no DRAFT
  ontology) or nothing applyable → `BLOCKED` with `blocked_reasons[]`. Bounding is
  deterministic and cheap: a max returned-items cap (P0, e.g. `50`) with
  `truncated:true` + exact `total_item_count` when hit; counts are always exact,
  only the item list is capped. Given the same pack + same project DRAFT, the
  preview is byte-stable (modulo `generated_at` and `preview_id`). `warnings[]` /
  `blocked_reasons[]` elements are `PackPreviewNotice {code, message}` (stable
  UPPER_SNAKE `code` + Korean-primary `message`), mirroring the MVP6.9 notice shape.
  Never a crash, never fabricated items.

- **ALL-FALSE mutation guard (frozen flags).** Every ontology-pack response
  (catalog list, pack detail, apply-preview) carries an all-false
  `OntologyPackMutationGuard`; every flag false, no exceptions:
  - `pack_installed: false`
  - `ontology_draft_mutated: false`
  - `ontology_class_created: false`
  - `ontology_property_created: false`
  - `ontology_relation_created: false`
  - `candidate_graph_mutated: false`
  - `published_graph_mutated: false`
  - `change_request_created: false`

  This is the ADR 0018 core and the mirror of the MVP6.1–6.5 / 6.7 / 6.8 / 6.9 /
  benchmark all-false pattern. `ontology_draft_mutated` and `published_graph_mutated`
  are the headline assertions.

- **Authorization (frozen).** Read-only, mutates nothing, grants nothing → any
  project member who can view the project may list the catalog, read a pack's
  detail, and run a dry-run apply-preview; no elevated role is required. Reuse MVP5
  `Role`; no new role literal. A later real apply (P1) would require ontology-edit /
  governance-approver rights (`ONTOLOGY_MANAGER` / `PROJECT_ADMIN` /
  `SYSTEM_ADMIN`) via the existing MVP1 / MVP6.6 path — out of P0. Unauthorized →
  `403 PERMISSION_DENIED`; missing project / unknown pack →
  `404 PROJECT_NOT_FOUND` / `404 ONTOLOGY_PACK_NOT_FOUND`.

- **Persist-vs-compute (deferred to Backend/Wave54).** Whether a preview is
  computed on demand (ephemeral, `preview_id:null`, mirroring the MVP6.9 G1
  compute-on-read decision) or persisted (keyed by a `preview_id`, mirroring
  MVP6.3/6.7) is a Backend contract decision; either way it is read-only and carries
  the all-false guard. Compute-on-read/ephemeral is recommended. Durable DB/Alembic
  persistence is **not** required for the P0 thin slice; the proven deterministic
  process-local store (`reset_runtime_store()`, MVP6.1–6.10 pattern) is acceptable.

- **Out of scope (P1 or later unless explicitly promoted):** real pack apply /
  install (`OntologyPackInstall`); the Pack Install Wizard write path; auto-apply /
  auto-confirmed apply; published-graph write; ontology-DRAFT mutation (preview
  only); external pack registry / gallery / fetch / download; pack update
  notifications; versioned pack dependency resolution; multi-version pack management
  (`OntologyPackVersion`); pack authoring / publishing (create / edit / version /
  publish a pack); non-ontology pack payloads (`PromptPack` / `ValidationRulePack` /
  `SampleDatasetPack`, constraints, sample docs / datasets, dashboard defaults,
  visualization-layout presets); a diff-and-apply tool (preview diff is read-only;
  applying is not); direct candidate or published-graph mutation; any real LLM
  execution; any new pack beyond the frozen three.

## Consequences

- Backend can draft additive endpoint(s) — list pack catalog, get pack detail, run
  dry-run apply-preview — reusing MVP1 ontology-element shapes, MVP5/MVP6.4
  import-dry-run compatibility, and the MVP6.9 catalog/preview/notice/bounding
  pattern **by reference (no renames)**, importing **no** ontology-write /
  install / governance-change / candidate-write / published-write path. It models
  `PackElementKind`, `PackApplyPreviewStatus`, `PackApplyCompatibility`,
  `PackPreviewItemDisposition`, `PackApplyTargetLayer`, `PackPreviewNotice`, the
  all-false `OntologyPackMutationGuard`, and bounded preview shapes (exact counts +
  capped `truncated` items), plus `403` / `404`.
- Frontend can add a project-scoped pack catalog + apply-preview surface in the
  Build/Ontology area (ADR 0010: no new ID-bound global LNB page; contextual
  sub-view under Ontology), with a persistent "preview only — nothing applied; a
  real apply routes through ontology-edit / governance" boundary banner, the
  would-add / would-modify + NEW / CONFLICT / DUPLICATE + compatibility/summary
  states, a live all-false-guard proof line, and first-class loading / empty /
  error / permission states in the closed design language. No install / apply CTA.
- QA can build deterministic local acceptance: catalog + pack detail are stable;
  the apply-preview is byte-stable for a fixed pack + project DRAFT; counts are
  exact and items are cap+`truncated` bounded; `OntologyPackMutationGuard` is
  all-false and no ontology-draft / class / property / relation / candidate /
  published / change-request row changes at the data level after a preview
  (before==after); authz `403` / `404`; and MVP1–MVP6.10 regression + smokes are
  green.
- The platform preserves candidate/published separation (the preview only maps to
  would-be DRAFT-ontology elements; it writes no layer), evidence/version/audit
  traceability, no autonomous or unreviewed ontology write, no external fetch, and
  no real LLM. The change is additive and does not alter MVP1–MVP6.10 paths, enums,
  or smokes. MVP6.11 keeps the all-false mutation-guard posture; it turns **no**
  mutation flag true.
