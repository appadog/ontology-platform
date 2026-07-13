# PM Report - Wave 54

Role: PM / Architect — MVP6.11 Ontology Packs THIN IMPLEMENTATION scope guard + gate freeze
Status: `PASS` — G1/G3/G4 frozen, G6/G7/G9 confirmed, G12 ratified, scope unchanged. BE/FE unblocked.
Date: 2026-07-10

## 담당 범위
- backlog ID: `PM6-036` (this freeze). Records implementation IDs `BE6-082`..`BE6-085`, `FE6-100`..`FE6-103`, `INT6-098`..`INT6-101`.
- 작업 경로: `docs/handoffs/wave-054/PM_REPORT.md`, `docs/pm/MVP6_11_ONTOLOGY_PACKS_BRIEF.md` (§11 refine), `docs/backlog/MVP6_DRAFT_BACKLOG.md` (Wave54 section + status).
- My job runs FIRST and BLOCKS Backend/Frontend. NO-MUTATION / creates-nothing is the headline invariant; `ontology_draft_mutated` + `published_graph_mutated` are the hardest assertions.

## 완료한 작업
Froze the three open Wave54 gates (G1/G3/G4) as single deterministic implementable
rules, confirmed the FE-flagged G6/G7/G9, ratified the G12 IA copy, and confirmed
scope is unchanged from the Wave53 freeze (ADR 0018 + brief + `openapi-mvp6-11-draft.json`).
**No contract shape change**: the OpenAPI (`0.6.11-draft`, 3 paths / 3 ops / 19 schemas /
5 enums + all-false 8-flag `OntologyPackMutationGuard`) is implemented EXACTLY as
drafted. Grounded the diff/identity rules in the real MVP1 ontology model (identity =
`name` per kind, property scoped by `class_id`; DRAFT-ness is **version-level**,
`OntologyVersion.status==DRAFT`) and the connectors/tenancy process-local-fixture
precedent.

### G1 — `preview_id` persist-vs-compute (FROZEN)
> COMPUTE-ON-READ / EPHEMERAL. `preview_id` is **always `null`**; there is **no**
> `GET .../apply-preview/{id}` and **no** list-preview endpoint. Recompute for the
> same (pack + project DRAFT) yields byte-identical results modulo `generated_at`.
> Read-only, all-false guard either way. (Mirrors MVP6.9 G1.)

### G3 — DRAFT-diff basis + fixture matrix (FROZEN)
> The apply-preview diffs the pack against a deterministic **process-local
> DRAFT-ontology snapshot** fixture keyed by `project_id` (the connectors/tenancy
> self-contained-fixture precedent, so QA does NOT depend on MVP1 seed state).
> Read-only; never mutated; `reset_runtime_store()` re-seeds it (called once at
> import). Wiring the snapshot to the **live** MVP1 draft-ontology reader
> (`OntologyVersion` with `status==DRAFT` → its non-DELETED elements) is a P1
> follow-up with **identical** diff logic. DRAFT-ness is **version-level**
> (`OntologyVersion.status==DRAFT`), not element-level.
>
> Project resolution: unknown `project_id` → **404 PROJECT_NOT_FOUND**; a project
> with a DRAFT snapshot version → **READY**; a project with no DRAFT ontology version
> → **200 BLOCKED** (`blocked_reasons=[NO_DRAFT_ONTOLOGY]`, zero items).

### G4 — element-identity match rule (FROZEN)
> A pack element and a DRAFT element **match** iff (1) `element_kind` equal
> (CLASS/PROPERTY/RELATION) AND (2) normalized identity key equal. Key normalization =
> NFC + trim + casefold. Identity key per kind (mirrors MVP1 uniqueness): CLASS by
> `name` within the version; PROPERTY by `name` scoped to its **owning-class key**;
> RELATION by `name` within the version. Given a match: **equal `definition_signature`
> → DUPLICATE** (identical, no-op); **different `definition_signature` → CONFLICT**
> (human resolution required, NEVER auto-overwritten); **no match → NEW** (would be
> added). `definition_signature` = a deterministic canonical string over the element's
> semantic definition — CLASS: label+description; PROPERTY: owning-class-key + label +
> `data_type`; RELATION: domain-key + range-key + label — computed identically on both
> sides. `mapped_ontology_ref` = **`null` for NEW**; non-null (the existing DRAFT
> element identity, with `ontology_version_id` + `status`) for CONFLICT / DUPLICATE.
>
> **Summary math (authoritative, per the OpenAPI):** `would_add_count == #NEW`;
> `would_modify_count == conflict_count` (**CONFLICT only** — DUPLICATE is its own
> `duplicate_count` bucket and is NOT folded into would_modify);
> `total_element_count = would_add + conflict + duplicate`. Compatibility rollup:
> READY & conflict==0 & duplicate==0 → **COMPATIBLE**; READY & (conflict>0 or
> duplicate>0) → **WARNING**; BLOCKED → **INCOMPATIBLE**.

## Fixture disposition / compatibility matrix (frozen — BE builds exactly this; FE/QA test against it)

**3 packs (element sets frozen; counts exact):**

| `pack_id` | CLASS keys | PROPERTY keys | RELATION keys | counts (C/P/R/total) |
|---|---|---|---|---|
| `pack-insurance-core` | `insurance.policy`, `insurance.claim`, `insurance.policyholder`, `insurance.coverage` | `insurance.policy.premium`, `insurance.policy.policy_number`, `insurance.claim.claim_amount` | `insurance.policyholder_holds_policy`, `insurance.claim_against_policy` | 4 / 3 / 2 / 9 |
| `pack-manufacturing-equipment` | `mfg.equipment`, `mfg.work_order`, `mfg.sensor`, `mfg.maintenance_log` | `mfg.equipment.serial_no`, `mfg.equipment.status`, `mfg.sensor.reading_unit` | `mfg.sensor_monitors_equipment`, `mfg.work_order_targets_equipment` | 4 / 3 / 2 / 9 |
| `pack-legal-compliance` | `legal.regulation`, `legal.obligation`, `legal.contract`, `legal.party` | `legal.regulation.jurisdiction`, `legal.obligation.due_date` | `legal.contract_binds_party`, `legal.obligation_under_regulation` | 4 / 2 / 2 / 8 |

(Backend owns exact labels/descriptions/`data_type`/endpoints; the diff outcomes
below are what matters. Keys shown are the `element_key`/identity keys.)

**Target DRAFT-ontology snapshot fixtures (process-local, keyed by `project_id`):**

- `proj-packs-demo` — DRAFT version `otv-packs-demo-draft` pre-seeded with a
  **manufacturing overlap set** only (no insurance/legal elements):
  - CLASS `mfg.equipment` — `definition_signature` == the pack's → **DUPLICATE**
  - CLASS `mfg.sensor` — `definition_signature` **differs** from the pack's (e.g.
    different description) → **CONFLICT**
  - PROPERTY `mfg.equipment.serial_no` — identical → **DUPLICATE**
  - (no other mfg elements present → the rest are **NEW**)
- `proj-packs-no-draft` — a resolvable project with **no DRAFT ontology version** →
  every pack → **BLOCKED / INCOMPATIBLE**.
- (`proj-packs-empty-draft` — a DRAFT version with 0 elements → every pack all NEW →
  COMPATIBLE — optional edge fixture.)

**Matrix — which (pack × project) yields which disposition mix + compatibility:**

| pack × project | dispositions | summary (add / conflict / dup / total) | status | compatibility | notices |
|---|---|---|---|---|---|
| `pack-insurance-core` × `proj-packs-demo` | 9 NEW | 9 / 0 / 0 / 9 | READY | **COMPATIBLE** | — |
| `pack-legal-compliance` × `proj-packs-demo` | 8 NEW | 8 / 0 / 0 / 8 | READY | **COMPATIBLE** | — |
| `pack-manufacturing-equipment` × `proj-packs-demo` | 6 NEW, 1 CONFLICT (`mfg.sensor`), 2 DUPLICATE (`mfg.equipment`, `mfg.equipment.serial_no`) | 6 / 1 / 2 / 9 | READY | **WARNING** | `NAME_CONFLICT_DIFFERENT_DEFINITION` (×1) + `EXISTING_DUPLICATE_ELEMENT` (×2) in `warnings[]` |
| any pack × `proj-packs-no-draft` | none (0 items) | 0 / 0 / 0 / 0 | **BLOCKED** | **INCOMPATIBLE** | `NO_DRAFT_ONTOLOGY` in `blocked_reasons[]` |

This single set exercises **all 3 dispositions** (NEW/CONFLICT/DUPLICATE, via the
manufacturing pack) and **all 3 compatibilities** (COMPATIBLE / WARNING /
INCOMPATIBLE-BLOCKED), byte-stably.

## G6 / G7 / G9 confirmations (FE-flagged)

- **G6 — `PackPreviewNotice.code` vocabulary (FROZEN).** WARNING bucket
  (`warnings[]`): `EXISTING_DUPLICATE_ELEMENT`, `NAME_CONFLICT_DIFFERENT_DEFINITION`,
  `UNRESOLVED_RELATION_ENDPOINT`. BLOCKED bucket (`blocked_reasons[]`):
  `NO_DRAFT_ONTOLOGY` (**the only code that fires in P0**), `EMPTY_PACK`,
  `PACK_NOT_FOUND` (both **reserved** — unknown pack is a **404**, and all 3 packs are
  non-empty, so neither fires in P0). `UNRESOLVED_RELATION_ENDPOINT` is a valid
  WARNING code Backend MAY emit if a relation endpoint doesn't resolve; the 3 frozen
  packs are endpoint-self-contained, so it does not fire in the core matrix. `code`
  is stable UPPER_SNAKE (D6/i18n); `message` deterministic Korean-primary. Backend may
  extend only additively if a new fixture needs it.
- **G7 — `generated_at` (CONFIRMED).** Present on the preview response (ISO-8601 UTC,
  set at response time) and **EXCLUDED** — together with `preview_id` (which is
  `null`) — from the byte-stable determinism assertion. Everything else is byte-stable
  for a fixed (pack + project DRAFT).
- **G9 — transport split (FROZEN).** Invalid **request body** (`item_cap` ∉ [1,50],
  non-integer, or malformed JSON) → **400**. Unknown `pack_id` → **404
  ONTOLOGY_PACK_NOT_FOUND**. Unknown `project_id` → **404 PROJECT_NOT_FOUND**.
  Non-member → **403 PERMISSION_DENIED**. Valid, resolvable target that yields nothing
  applyable (no DRAFT ontology) → **200** with `status=BLOCKED` /
  `compatibility=INCOMPATIBLE` + `blocked_reasons[]`, **zero fabricated items**, and
  the all-false guard (a result state, NOT a 4xx). `mapped_ontology_ref` nullability:
  `null` for NEW (unmapped), non-null for CONFLICT/DUPLICATE.

## G12 — LNB / IA copy (RATIFIED, COMMANDER IA)
> A new **BUILD-group** LNB item **`Ontology Packs`** placed **immediately after
> `Ontology`** (before `Sources`); project-scoped; the single-active-LNB invariant is
> preserved. Page **H1 = `온톨로지 팩`** (Korean primary; LNB label stays the English
> noun `Ontology Packs`). Pack detail + apply-preview are **contextual sub-views**
> reached from the catalog: `/projects/:p/ontology-packs` (catalog) and
> `/projects/:p/ontology-packs/:packId` (detail/preview) — the 3 frozen pack ids are a
> bounded enumerable set, so this is NOT an ID-bound global page in the ADR 0010 sense.
> Breadcrumb (D4): `프로젝트명 > Ontology Packs [> <팩 이름>]`. D6 badge glosses per
> the FE §4 table are ratified.

## Scope confirmation (UNCHANGED from ADR 0018 / Wave53 freeze)
- **Read-only + dry-run only.** Exactly 3 endpoints (`GET /ontology-packs`, `GET
  /ontology-packs/{pack_id}`, `POST /projects/{id}/ontology-packs/{pack_id}/apply-preview`).
  The only write-shaped verb (apply-preview) **creates NOTHING** — no class/property/
  relation, no `OntologyPackInstall`, no change request, no ontology version; the DRAFT
  is read-only diff basis, candidate + published are never touched.
- **No apply / no install / no external fetch.** No install/apply/execute/confirm-and-apply/
  add-to-draft CTA anywhere; 3 deterministic in-repo mock packs only; no registry/gallery/
  download/update-notification. Real apply is deferred and routes through the existing
  MVP1 ontology-edit / MVP6.6 governance-application (DRAFT-only, human-initiated) path.
- **All-false 8-flag `OntologyPackMutationGuard`** on every response (catalog, detail,
  preview): `pack_installed`, `ontology_draft_mutated`, `ontology_class_created`,
  `ontology_property_created`, `ontology_relation_created`, `candidate_graph_mutated`,
  `published_graph_mutated`, `change_request_created` — all false, no exceptions.
  MVP6.11 turns **no** flag true, ever (distinct from the single MVP6.6 apply guard).
- **Additive; reuse by reference; no renames.** No MVP1–MVP6.10 path/enum/smoke break.
  Authz: any project viewer; `403`/`404` only.

## Acceptance gates BE/FE/QA must hit (NO-MUTATION headline)
- **BE6-082..085**: 3 endpoints match `openapi-mvp6-11-draft.json` EXACTLY; new
  `apps/backend/app/modules/ontology_packs/` (additive router) + process-local pack
  fixtures + DRAFT snapshot + `reset_runtime_store()`; the fixture matrix VERBATIM
  (all 3 dispositions + 3 compatibilities); G4 identity/`definition_signature` rule;
  `would_modify_count==conflict_count`; `preview_id:null` (G1); `generated_at` (G7);
  BLOCKED non-crash-200 + G6 notices; invalid body 400 (G9); all-false 8-flag guard on
  every response; DATA-LEVEL no-mutation (all tables before==after incl. preview;
  module imports no ontology-write/install/governance/candidate/published path);
  runtime OpenAPI 0-mismatch; MVP6.10 regression; ruff; `git diff --check`.
- **FE6-100..103**: `Ontology Packs` LNB item in BUILD after `Ontology` (single active
  LNB preserved), H1 `온톨로지 팩`, contextual sub-views; catalog (3 cards + counts,
  NO install/apply affordance) → detail → apply-preview result (disposition/compat D6
  badges + summary + capped items + `mapped_ontology_ref` null-for-NEW + truncation +
  notices + `routing_note`); persistent PREVIEW-ONLY banner + live all-false 8-flag
  guard proof line + `preview_only:true`; loading/empty/error/permission +
  INCOMPATIBLE-BLOCKED + WARNING states; types/client/mocks match frozen OpenAPI
  EXACTLY; `smoke:mvp6:packs:mock` (+ `:actual`); `npm run test`/`build`; 0-overflow.
- **INT6-098..101**: validate 3 endpoints + deterministic byte-stable preview +
  bounding + all 3 dispositions + 3 compatibilities per the matrix + authz 403/404 +
  invalid-body 400 + BLOCKED 200; INDEPENDENTLY (own script) verify at the DATA level
  that NO pack call (esp. apply-preview) creates a class/property/relation/change-
  request/version or mutates any table (before==after), and the 8-flag guard is
  all-false; FE mock + actual (boot backend on SQLite); MVP6.10/earlier regression +
  touched smokes; additive-only + candidate/published separation + single active LNB
  (now incl. Ontology Packs); no leftover listeners on 8000/5173.

## 변경 파일
- `docs/handoffs/wave-054/PM_REPORT.md` (this file, new).
- `docs/pm/MVP6_11_ONTOLOGY_PACKS_BRIEF.md` (§11 gates marked FROZEN/CONFIRMED/RATIFIED with the Wave54 rulings; no contract shape change).
- `docs/backlog/MVP6_DRAFT_BACKLOG.md` (Wave54 section: `PM6-036` + `BE6-082`..`085`, `FE6-100`..`103`, `INT6-098`..`101`; status line updated).

## 실행/검증
- 실행한 명령: `git diff --check`
- 결과: CHECK_OK (no whitespace/conflict errors; docs-only).
- 실행하지 못한 검증: none applicable (planning/freeze role; no `apps/` code written).

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세: G1/G3/G4 freeze + G6/G7/G9 confirm introduce NO contract shape change. All 5
  enums, the 8-flag guard, `PackApplyPreviewResponse`/`PackPreviewItem`/
  `PackApplyPreviewSummary`/`PackElementDescriptor`, `OntologyElementRef` (governance-
  style: `target_kind` + typed id fields + `ontology_version_id` + `status`) are exactly
  as in `openapi-mvp6-11-draft.json`. `would_modify_count==conflict_count` and
  `mapped_ontology_ref=null-for-NEW` are already permitted by the drafted schema (the
  ref is `oneOf [OntologyElementRef, null]`); these are deterministic refinements, not
  shape changes.
- 영향받는 역할: BE (implement exactly + build the fixture matrix VERBATIM), FE (mirror
  types/client/mocks; render disposition/compat/guard), QA (assert matrix + data-level
  no-mutation).

## Blocker
- 없음. BE/FE unblocked.

## 남은 TODO
- BE: implement `apps/backend/app/modules/ontology_packs/` (3 endpoints + 3 pack
  fixtures + DRAFT snapshot fixtures + `reset_runtime_store()`); the frozen fixture
  matrix; `tests/test_mvp6_11_ontology_packs_api.py`; runtime OpenAPI compare.
- FE: LNB item + catalog/detail/apply-preview surface + PREVIEW-ONLY banner + live
  guard proof; `smoke:mvp6:packs:mock` (+ `:actual`).
- QA: R1–R7 verdicts in `INT6_11_ONTOLOGY_PACKS_ACCEPTANCE.md`; data-level creates-
  nothing + all-false guard proof.

## 다른 역할에 전달할 내용
- **Backend:** build the fixture matrix above VERBATIM (3 pack element sets +
  `proj-packs-demo` mfg-overlap DRAFT snapshot + `proj-packs-no-draft`). Diff rule G4:
  match `(element_kind + normalized key)`, then `definition_signature` equal→DUPLICATE
  / differ→CONFLICT / no-match→NEW; `would_modify_count==conflict_count` (DUPLICATE is
  its own bucket). `preview_id:null` (G1); `generated_at` excluded from determinism
  (G7); invalid body→400, unknown pack/project→404, no-DRAFT→200-BLOCKED (G9);
  `mapped_ontology_ref` null-for-NEW. Every response all-false 8-flag guard;
  DATA-LEVEL before==after; import no ontology-write/install/governance path. Match
  `openapi-mvp6-11-draft.json` EXACTLY.
- **Frontend:** `Ontology Packs` LNB in BUILD after `Ontology`, H1 `온톨로지 팩`,
  contextual sub-views. NO install/apply/execute/add CTA — only "적용 미리보기 실행".
  Render `disposition` NEW/CONFLICT/DUPLICATE + `compatibility` COMPATIBLE/WARNING/
  INCOMPATIBLE as D6 badges; `mapped_ontology_ref` null → explicit "신규 — 대응 DRAFT
  요소 없음" state; `target_layer` always DRAFT; `preview_ref` opaque (not an id);
  summary counts exact even when `truncated`; BLOCKED fabricates zero items; live
  all-false 8-flag guard read from the response (not hardcoded) + `preview_only:true`;
  `routing_note` verbatim. Reconcile FE §8 against the landed OpenAPI (was PENDING).
- **QA:** the headline gate is creates-nothing + all-false guard at the DATA level
  (own script, before==after across class/property/relation/change-request/version +
  candidate/published). The 3 dispositions come from `pack-manufacturing-equipment ×
  proj-packs-demo` (1 CONFLICT `mfg.sensor` + 2 DUPLICATE `mfg.equipment`/`serial_no` +
  6 NEW); the 3 compatibilities: insurance/legal×demo=COMPATIBLE, manufacturing×demo=
  WARNING, any×`proj-packs-no-draft`=INCOMPATIBLE-BLOCKED (`NO_DRAFT_ONTOLOGY`). Assert
  byte-stability modulo `generated_at`+`preview_id`; 400 vs 200-BLOCKED vs 403/404 per
  G9.
- **PM:** none.

## 총괄에게 요청하는 결정
- None required. Two judgment calls flagged for your awareness, both defensible and
  reversible: (1) **G3** diffs against a **process-local DRAFT-ontology snapshot**
  fixture (connectors/tenancy precedent) rather than the live MVP1 draft reader — this
  buys byte-stability + self-containment for QA; wiring the live reader is a P1
  follow-up with identical diff logic. If you prefer the preview to read the real MVP1
  DRAFT immediately, say so and I'll re-freeze G3 to seed specific real projects
  instead. (2) **G9** unknown pack → **404** (not a 200-BLOCKED `PACK_NOT_FOUND`), so
  `PACK_NOT_FOUND`/`EMPTY_PACK` stay reserved-never-emitted in P0 — this avoids two
  contradictory ways of signalling a missing pack.

## 현재 판정
- `PASS` — G1/G3/G4 frozen, G6/G7/G9 confirmed, G12 ratified, scope unchanged, IDs
  recorded. Backend ∥ Frontend may proceed.
