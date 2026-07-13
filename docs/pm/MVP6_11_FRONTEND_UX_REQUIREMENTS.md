# MVP6.11 Ontology Packs Frontend UX/API Requirements

Status: `WAVE53 CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-09
Owner: Frontend / UIUX Architecture
Backlog ID: `FE6-099`

This document defines the frontend requirements for the MVP6.11 **Ontology Packs**
P0 (read-only pack catalog + deterministic dry-run apply-preview; no apply, no
install, no external registry/fetch, no published-graph write, no ontology-DRAFT
mutation; deterministic in-repo mock packs; all-false mutation guard). It is
**requirements only**: no runtime route, component, type, API client, mock
fixture, or smoke code is produced in this wave. Runtime waits for Wave54.

## Source Documents

- `AGENTS.md` (Frontend Rules)
- `.agents/skills/handoff-reporting/SKILL.md`
- `docs/handoffs/CURRENT_STATE.md`
- `docs/handoffs/wave-053/NEXT_ORDERS.md`
- `docs/handoffs/wave-053/PM_REPORT.md`
- `docs/pm/MVP6_11_ONTOLOGY_PACKS_BRIEF.md`
- `docs/adr/0018-mvp6-11-ontology-packs-read-only-catalog-dry-run-apply-preview-no-apply-no-published-write-no-draft-mutation-boundary.md`
- `docs/pm/UIUX_REMEDIATION_DECISIONS.md` (D1 LNB IA, D3 copy policy, D6 badges)
- `docs/adr/0010-lnb-project-context-information-architecture.md`
- `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md`
- Format + UX precedent: `docs/pm/MVP6_9_FRONTEND_UX_REQUIREMENTS.md` (the closest
  structural precedent — read-only catalog + bounded deterministic dry-run
  preview + all-false guard + `{code, message}` notice + cap/`truncated`/exact-total
  bounding). Governance (MVP6.5/6.6) is the "approval/apply is intent, not
  execution" copy precedent.

> **Backend draft dependency (OPEN — not yet landed).** As of this writing
> `docs/api/MVP6_11_ONTOLOGY_PACKS_API_CONTRACT_DRAFT.md` and
> `docs/api/openapi-mvp6-11-draft.json` are **not present** (Backend `BE6-080`~
> `BE6-081` runs in parallel this wave). This document is therefore grounded on
> the **frozen PM brief** (`docs/pm/MVP6_11_ONTOLOGY_PACKS_BRIEF.md`) + ADR 0018,
> and §8 is a forward **field/state need + gap list** the Backend draft must
> confirm/finalize — NOT a reconciliation against a landed draft. Field/enum
> names below are the PM-frozen names, used verbatim; where the brief marks a
> field as "Backend finalizes" it is flagged in §8. **Blocking dependency:** §8
> gaps must be closed against the Backend draft before Wave54 implementation.

## Backlog Coverage

| ID | Requirement output |
|---|---|
| `FE6-099` | Ontology-pack surface placement + IA per ADR 0010; pack catalog UX (3 cards, metadata + element counts, no install/apply affordance); pack detail (bundled classes/properties/relations); dry-run apply-preview action + result layout (would-add/would-modify + `PackPreviewItemDisposition` + `PackApplyCompatibility` + summary counts + truncation + `PackPreviewNotice`); "PREVIEW ONLY — nothing applied; real apply routes through the ontology-edit / governance path" boundary banner; live all-false 8-flag `OntologyPackMutationGuard` proof line; first-class loading / empty / error / permission-limited / INCOMPATIBLE-BLOCKED states; DTO gap analysis vs the Backend draft |

## Scope Guard

MVP6.11 P0 is a **read-only ontology-pack catalog + deterministic dry-run
apply-preview**, placed in the Build/Ontology area:

```text
select project
-> open Ontology Packs (Build/Ontology area)
-> view pack catalog (3 deterministic mock packs: metadata + element counts)
-> open a pack -> read its bundled ontology elements (classes / properties / relations)
-> run a dry-run APPLY-PREVIEW against this project's current DRAFT ontology
-> read: compatibility rollup + summary counts + capped sample of would-add /
   would-modify items, each dispositioned NEW / CONFLICT / DUPLICATE
-> read the explicit "PREVIEW ONLY — nothing applied; a real apply routes through
   the existing MVP1 ontology-edit / MVP6.6 governance-application path" boundary
```

The UI must **never** imply that opening a pack installs it, that browsing the
catalog registers/adds anything, that running an apply-preview applies/installs/
creates a class/property/relation, that the DRAFT ontology is mutated, or that
the published graph changes. Preview items are **would-be** DRAFT-layer elements,
not created rows. There is **no** install / apply / execute / confirm-and-apply /
add-to-draft / "설치" / "적용" affordance anywhere in this surface. No external
fetch/download happens — packs are deterministic in-repo mocks; the catalog is
exactly 3 frozen packs.

Out of scope for Wave53 and MVP6.11 P0 UI (mirror the PM/ADR-0018 exclusions):
real pack apply / install (`OntologyPackInstall`); Pack Install Wizard write;
auto-apply / auto-confirmed apply; published-graph write; ontology-DRAFT mutation
(preview only); external pack registry / gallery / fetch / download / update
notification; versioned pack dependency resolution; multi-version pack management
(`OntologyPackVersion`); pack authoring / publishing (create / edit / version /
publish); non-ontology pack payloads (`PromptPack` / `ValidationRulePack` /
`SampleDatasetPack`, constraints, sample docs/datasets, dashboard defaults, viz
presets); a diff-and-apply tool (the preview diff is read-only, applying is not);
direct candidate or published-graph mutation; any real LLM execution; any new
pack beyond the frozen 3.

## 1. Placement / Information Architecture (per ADR 0010)

### 1.1 Decision: Build-group LNB destination `Ontology Packs` (project-scoped), immediately after `Ontology`

Per ADR 0010 (LNB two-zone project-context IA) and D1, the ontology-pack surface
is added as **one stable project-zone LNB item in the `BUILD` group**, placed
**immediately after `Ontology`** (before `Sources`), not as an ID-bound global
route. Pack detail and apply-preview are **contextual sub-views** reached from
the catalog, never new LNB items.

```text
PROJECT  (rendered only when a project is selected)
├─ BUILD
│  ├─ Ontology        → /projects/:p/ontology
│  ├─ Ontology Packs  → /projects/:p/ontology-packs   (NEW, right after Ontology)
│  ├─ Sources         → /projects/:p/sources
│  ├─ Connectors      → /projects/:p/connectors
│  ├─ Extraction      → /projects/:p/extraction-jobs
│  └─ Candidates      → /projects/:p/extraction-jobs
├─ REVIEW    …
├─ PUBLISH   …
└─ ANALYZE   …
```

**Justification (Build/Ontology adjacency; own LNB item):**

1. **It operates on the project's ontology, in the ontology mental space.** The
   apply-preview answers "what would this pack add to / modify in my current
   DRAFT ontology?" Its would-be output (`PackApplyTargetLayer.DRAFT` items mapped
   to `mapped_ontology_ref`) is ontology-layer, and it diffs against the current
   DRAFT ontology. Its natural neighbor is `Ontology`, which lives in `BUILD` per
   ADR 0010. The PM order explicitly names the **Build/Ontology area**.
2. **Own LNB item over a tab inside the Ontology modeler.** Precedent in this repo
   is to give a coherent read-only catalog+preview surface its own single
   project-zone LNB destination (MVP6.9 `Connectors` in Build; MVP6.5 `Governance`
   in Review) rather than burying it as a tab. A first-class item makes the
   catalog a scannable destination and keeps the "PREVIEW ONLY — nothing applied"
   safety story on its own screen, so it is never confused with the Ontology
   modeler's actual DRAFT edit/delete affordances (which DO mutate the draft).
   Keeping packs on a **separate** screen from the real editor also reinforces
   the boundary: the pack surface has no write affordance; the modeler does.
3. **ADR 0010 §Decision forbids ID-bound detail pages in the LNB.** Pack detail is
   parameterized by `pack_id`; apply-preview is parameterized by `pack_id` +
   project. Both therefore stay **contextual sub-views** reached from the catalog
   (see §1.2), never new LNB items. There are exactly **3 frozen packs** (a
   bounded, enumerable, non-user-generated set), so a `pack_id`-scoped sub-route
   is stable and not "ID-bound" in the ADR 0010 sense (mirrors the MVP6.9
   `:connectorKind` reasoning). A single `Ontology Packs` LNB item satisfies this.
4. Discoverability + safety: a first-class Build item, adjacent to `Ontology`,
   tells the user "packs are reusable ontology templates you can preview against
   your ontology" while the on-screen boundary banner keeps "nothing is installed
   or applied" always visible.

**Considered and rejected:**

- **A tab inside the Ontology modeler screen.** Cleanest against "no new LNB
  item", but it visually co-locates a read-only preview surface with the modeler's
  real DRAFT write controls, muddying the "packs apply nothing" boundary; and it
  hides a scannable catalog behind the editor. Rejected for boundary clarity.
- **An Analyze-group destination.** Analyze holds post-hoc read/insight surfaces
  (Search / RAG / Evaluation / Learning Insights / Benchmark / External API) over
  data already in the project. Ontology Packs is upstream ontology authoring
  material, not downstream analysis. Rejected as a semantic mismatch.

**G5 (LNB/IA):** this is a Frontend proposal per PM brief §11 G5; **PM/commander
ratifies** the exact group slot (Build, after `Ontology`) and whether it is a new
LNB item vs an Ontology-screen tab. The single-item / contextual-detail rules
below hold regardless of the ratified group.

### 1.2 Contextual sub-navigation inside the Ontology Packs area

Parent area route: `/projects/:p/ontology-packs`. The area is the single LNB
destination; everything below is a **sub-view or contextual detail** reached from
the catalog cards / breadcrumbs / right-side panel, never a new LNB item and never
a global ID-bound route (ADR 0010; D1 §1.5 — LNB is the section, in-screen views
are sub-views).

Suggested contextual routes/views (reached from the catalog, project context +
return path preserved):

- `/projects/:p/ontology-packs` — pack **catalog** (3 `OntologyPack` cards).
  Default view.
- `/projects/:p/ontology-packs/:packId` — pack **detail**: metadata + bundled
  ontology elements grouped by `PackElementKind` + the dry-run apply-preview
  action + preview result. `:packId` is one of exactly 3 frozen pack ids (bounded
  enumerable set), so the route is stable and not "ID-bound" in the ADR 0010
  sense; it may also be rendered as an in-screen panel from the catalog card
  without a route change.

Recommended page structure (Section + Card design language):

```text
Project context header + breadcrumb  (프로젝트명 > Ontology Packs)
-> PREVIEW-ONLY boundary banner (nothing installed / nothing applied / no draft or published write)
-> Pack catalog (3 cards: name/domain/version + description + element counts; NO install/apply)
-> Pack detail (contextual): metadata + bundled elements grouped by CLASS / PROPERTY / RELATION
-> Dry-run APPLY-PREVIEW action ("적용 미리보기 실행" — never "적용/설치/실행")
-> Preview result: compatibility + summary rollup + capped would-add/would-modify sample
   (each NEW/CONFLICT/DUPLICATE) + truncation notice + routing note + live all-false-guard proof line
```

### 1.3 Breadcrumb + copy policy (D3, D4)

- LNB label (English noun, D3 intentional-EN nav convention): **`Ontology Packs`**.
- Page H1 (Korean primary, D3): recommend **`온톨로지 팩`**. If PM prefers the
  English product term as H1, `Ontology Packs` is acceptable — pick one and use it
  consistently (no ko/en title-subtitle mismatch on the same screen). **PM to
  confirm the H1 wording** (§8 G12).
- Breadcrumb (D4 `프로젝트명 > 섹션 > 항목`):
  - `/projects/:p/ontology-packs` → `프로젝트명 > Ontology Packs`
  - `/projects/:p/ontology-packs/:packId` →
    `프로젝트명 > Ontology Packs > <팩 이름>` (pack `name`, §4).
- No-project-selected behavior (D1): the `Ontology Packs` item lives in the
  project zone, so it is not rendered until a project is selected; no
  auto-redirect (global zone + muted hint per D1).
- Active-state derivation (D1, extend the same rule): active when the path
  contains `/ontology-packs`.

## 2. UX Surfaces

### 2.1 PREVIEW-ONLY boundary banner (always visible) — the safety spine

A persistent, non-dismissible info banner at the top of the Ontology Packs area.
This is the load-bearing "read-only catalog + apply-preview only; nothing is
installed, applied, or written to any ontology layer or the published graph"
statement the PM order + ADR 0018 + QA require to be crystal clear.

Required copy (Korean primary, tokens stay English per D3):

- Headline: `온톨로지 팩은 미리보기 전용입니다. 아무것도 설치하거나 적용하지 않습니다.`
  ("Ontology packs are preview-only. Nothing is installed or applied.")
- Supporting line:
  `카탈로그 조회와 dry-run 적용 미리보기만 제공합니다. 팩은 이 프로젝트의 현재 DRAFT 온톨로지와 read-only로 비교만 하며, DRAFT나 게시 그래프를 만들거나 변경하지 않습니다. 실제 적용은 이후 기존 MVP1 온톨로지 편집 / MVP6.6 거버넌스 적용(DRAFT 전용, 사람이 직접 시작) 경로를 거칩니다.`
  ("Only catalog browsing and dry-run apply-preview. A pack is compared read-only
  against this project's current DRAFT ontology; it creates or changes neither the
  DRAFT nor the published graph. A real apply would later route through the
  existing MVP1 ontology-edit / MVP6.6 governance-application (DRAFT-only,
  human-initiated) path.")
- Boundary chips (small, `info`/`neutral` tone), each an intentional-English
  token with a Korean gloss:
  `PREVIEW_ONLY · 미리보기 전용`, `NOTHING_INSTALLED · 설치 없음`,
  `NOTHING_APPLIED · 적용 없음`, `NO_DRAFT_WRITE · DRAFT 변경 없음`,
  `NO_PUBLISHED_WRITE · 게시 변경 없음`.

**The all-false "nothing applied" proof line (required).** The banner (or an
adjacent collapsible block) renders the response `OntologyPackMutationGuard` as a
live read-only proof block, present on every Ontology Packs screen (catalog, pack
detail, apply-preview result). It lists all **8** frozen guard flags and shows
each as `false`:

```text
pack_installed: false               ontology_draft_mutated: false
ontology_class_created: false       ontology_property_created: false
ontology_relation_created: false    candidate_graph_mutated: false
published_graph_mutated: false      change_request_created: false
```

The UI reads these flags **from the API response** (it does not hardcode them);
`ontology_draft_mutated` and `published_graph_mutated` are the **headline**
assertions. If any flag is ever `true` (impossible in P0), the UI must switch to
an error/guard-violation state and disable the apply-preview action — the guard is
displayed as live evidence, not decorative copy. On the preview result, also
render `preview_only: true` next to the guard as the preview-only proof.

Contrast note (documented so the FE and QA share the intent): the single MVP6.6
apply guard turns `ontology_draft_mutated` **true** on a real apply; MVP6.11 turns
**no** flag true on any response. The banner copy must never resemble the MVP6.6
apply-confirmation flow.

### 2.2 Pack catalog (3 `OntologyPack` cards)

Purpose: answer "what reusable ontology templates can I preview against my
ontology?" The catalog is the default Ontology Packs view: exactly **3
deterministic mock packs** (frozen cap — no add / register / import / "새 팩"
affordance in P0).

Each **pack card** shows:

- **Name** (`name`, Korean pack name, e.g. `보험 코어 도메인 팩`) as the card title.
- **Domain** (`domain`) as a badge/chip (insurance / manufacturing / legal) with a
  Korean gloss (§4).
- **Version** (`version`, single frozen `1.0.0`) as a small `neutral` chip.
- `description` — a short line describing the pack's domain coverage.
- **Element counts** — `class_count`, `property_count`, `relation_count`, and
  `element_count` (total), rendered as a compact count row (e.g. `클래스 N ·
  속성 N · 관계 N · 총 N`). Counts are exact and byte-stable.
- A small `DETERMINISTIC_MOCK` / preview-only marker so the catalog never reads as
  a live install gallery.
- Primary action: **"상세 보기"** ("View detail") → opens the pack detail (§2.3).
  The card carries **NO** install / apply / add / "설치" / "적용" affordance —
  this is the non-negotiable per ADR 0018.

Product treatment (design language): a card grid, not a raw table. There is no
"install"/"add to project" button, no toggle, no checkbox-select-to-apply — the
only action is read (open detail).

### 2.3 Pack detail — metadata + bundled ontology elements

Contextual detail at `/projects/:p/ontology-packs/:packId` (or an in-screen
panel), preserving project context and a return path to the catalog. It renders
the pack metadata (§2.2 fields) and the pack's **bundled ontology elements**.

- Bundled elements are an ordered list of `OntologyElementRef`-style descriptors
  grouped by `PackElementKind` (`CLASS` / `PROPERTY` / `RELATION`), reusing the
  MVP1 ontology element + `OntologyElementRef` (`target_kind`) shapes by reference
  (no rename). Group them under three Section sub-headers (`클래스` / `속성` /
  `관계`) with a per-group count.
- Each element row shows its label/name + `target_kind` chip; properties/relations
  show their owning-class / endpoint context where the reused shape provides it.
- These are **template descriptors**, not created ontology rows — the detail must
  not present an "add this element" or per-element apply control. Copy makes clear
  these are the elements the pack **would** contribute on a future real apply.
- Packs carry **ontology elements only** — no prompt templates, validation rules,
  sample docs/datasets, constraints, dashboard defaults, or viz presets are shown
  (none exist in P0).

Detail action: a single **"적용 미리보기 실행"** (Run dry-run apply-preview) button
(§2.4). No "적용", "설치", "추가", "실행" (apply/install/add/execute) button.

### 2.4 Dry-run apply-preview action + result layout

On **"적용 미리보기 실행"**, the UI calls
`POST /api/v1/projects/{project_id}/ontology-packs/{pack_id}/apply-preview`
and renders the returned preview. **Nothing is applied; the action is a read-only
computation against the project's current DRAFT ontology.**

Preview result layout (Section + Card), top to bottom:

1. **Result header** — `PackApplyPreviewStatus` badge (`READY` / `BLOCKED`) +
   `PackApplyCompatibility` badge (`COMPATIBLE` / `WARNING` / `INCOMPATIBLE`) as
   D6 badges (§4); `pack_id` + `pack_version`; `preview_only: true` proof marker;
   `generated_at` freshness stamp (if present — §8 G7). `preview_id` is expected
   ephemeral/`null` (§8 G1); do not build a deep-link/permalink around it in P0.
2. **Summary rollup card** — exact counts (never estimated), from `summary`:
   `would_add_count`, `would_modify_count`, `conflict_count`, `duplicate_count`,
   `total_element_count`. Label them as **"would-add / would-modify"**
   (추가 예정 / 수정 예정) counts, not "added / modified" counts. The
   would-modify grouping maps to `CONFLICT` + `DUPLICATE` dispositions (elements
   that already exist in the DRAFT); would-add maps to `NEW`.
3. **Would-add / would-modify sample** — capped list (`items[]`) of preview items,
   each rendered as a row/card grouped or filterable by disposition:
   - `preview_ref` — shown as an **opaque preview reference**, explicitly **not**
     a created ontology element id (copy: "미리보기 참조 — 생성된 온톨로지 요소 ID 아님").
   - `element_kind` — `PackElementKind` chip (`CLASS` / `PROPERTY` / `RELATION`).
   - `disposition` — `PackPreviewItemDisposition` (`NEW` / `CONFLICT` /
     `DUPLICATE`) as a per-item D6 badge (§4), so a `CONFLICT`/`DUPLICATE` item is
     visible within an otherwise-`NEW` sample.
   - `target_layer` — `PackApplyTargetLayer.DRAFT` as a badge (`DRAFT 레이어`),
     asserting the item maps to the DRAFT ontology layer only, **never** candidate,
     **never** published.
   - `mapped_ontology_ref` — the would-be / existing ontology element as an
     `OntologyElementRef` chip with a contextual link to the ontology element
     (for `CONFLICT`/`DUPLICATE`, this is the existing DRAFT element it collides
     with). Render an explicit state if null (§8 G4/G6).
   - `pack_element_label` (the pack's element) + `existing_element_label` (shown
     only for `CONFLICT` / `DUPLICATE`, the current DRAFT element it matches).
     A `CONFLICT` row shows both side-by-side with a "정의 상이 — 사람 해소 필요"
     note; a `DUPLICATE` row notes "이미 존재 — 적용 시 no-op".
   - `note`.
4. **Truncation notice** — when `truncated: true`, show `item_cap` and
   `total_item_count` (exact even when truncated): "capped X of Y"
   (`상위 X개 표시 · 전체 Y개`). Summary counts (§2) stay exact; only the item list
   is capped. Use the D6 `WARNING`-tone treatment for the truncation notice.
5. **Warnings** — `warnings[]` (`PackPreviewNotice {code, message}`) when
   `compatibility = WARNING` (e.g. `EXISTING_DUPLICATE_ELEMENT`,
   `NAME_CONFLICT_DIFFERENT_DEFINITION`, `UNRESOLVED_RELATION_ENDPOINT`), each as a
   `WARNING` badge (the `code`) + the Korean `message`.
6. **Blocked reasons** — `blocked_reasons[]` (`PackPreviewNotice {code, message}`)
   when `status = BLOCKED` / `compatibility = INCOMPATIBLE` (e.g. `PACK_NOT_FOUND`,
   `NO_DRAFT_ONTOLOGY`, `EMPTY_PACK`); non-empty ONLY when `status = BLOCKED`
   (§2.5).
7. **Routing note** — render `routing_note` verbatim as a persistent line under
   the result: *"preview only — nothing applied; a real apply routes through the
   existing MVP1 ontology-edit / MVP6.6 governance-application (DRAFT-only,
   human-initiated) path."* Korean primary:
   `미리보기 전용입니다 — 아무것도 적용되지 않았습니다. 실제 적용은 기존 MVP1 온톨로지 편집 / MVP6.6 거버넌스 적용(DRAFT 전용, 사람이 직접 시작) 경로를 거칩니다.`
8. **Live all-false 8-flag guard proof line** (§2.1) attached to the result.

The preview result carries **no** "confirm apply" / "install" / "add to draft" /
"create elements" / "적용" / "설치" call-to-action. The only forward action is
contextual reading (open a mapped ontology element, re-run the preview). A
`CONFLICT` item explicitly routes the user to the real-apply path via copy
(governance / ontology-edit), never to an in-surface apply.

### 2.5 INCOMPATIBLE / BLOCKED preview state

When `status = BLOCKED` (and correspondingly `compatibility = INCOMPATIBLE`):

- Render a clear non-error, non-crash result state: the pack could not be
  previewed against this project's DRAFT (invalid target — unknown pack, missing
  project, no DRAFT ontology, or nothing applyable / empty pack).
- List `blocked_reasons[]` (`PackPreviewNotice {code, message}`) with a
  `danger`-tone `INCOMPATIBLE` / `BLOCKED` badge.
- Show **zero fabricated items** — no sample rows; `would_*` / `total_element_count`
  as returned (likely 0). Never invent a would-be item to fill the layout.
- Offer "다시 시도" / (where relevant) an ontology-setup hint (e.g. "no DRAFT
  ontology" → link to the Ontology modeler to start a DRAFT) as the recovery path.
  Still render the routing note + all-false guard proof (BLOCKED still applied /
  mutated nothing).

`WARNING` is **not** blocking: the preview still returns items; render both the
`WARNING` compatibility badge and `warnings[]`, and show the sample with its
`DUPLICATE`/`CONFLICT` rows flagged. `WARNING` means "applyable, but flagged items
need human resolution via the real-apply path" — the UI states this and still
offers no in-surface apply.

## 3. State Requirements (first-class)

Per AGENTS.md Frontend Rules ("모든 화면은 loading, empty, error 상태를 가진다"),
every Ontology Packs surface has loading / empty / error / permission states, plus
the preview-specific compatibility, disposition, and guard states.

| State | Required behavior |
|---|---|
| Loading — catalog | Skeleton cards for the 3-pack catalog. The boundary banner renders immediately (static safety copy), independent of data load. |
| Loading — pack detail | Skeleton for the metadata + bundled-element groups while pack detail resolves. |
| Loading — preview | Disable the "적용 미리보기 실행" button and show an in-progress indicator while the preview computes. Do not show stale/previous counts as if current. |
| Empty — catalog | Effectively never empty (3 frozen packs). If the catalog returns empty, show a neutral "등록된 온톨로지 팩 없음" state; never fabricate packs. |
| Empty — bundled elements | A pack (or a kind group) with 0 elements: show "이 그룹에 요소가 없습니다"; never fabricate elements. |
| Empty — preview sample | `status = READY` with `total_element_count = 0` (all `would_*` counts 0): show "이 팩은 현재 DRAFT 온톨로지에 추가/수정할 요소가 없습니다" — do NOT imply an apply happened or was "cleared". |
| Null mapped ref | An `items[]` row with `mapped_ontology_ref = null`: render an explicit state on the row (e.g. `NEW` with "신규 — 대응 DRAFT 요소 없음"; or, if a relation endpoint is unresolved, the `UNRESOLVED_RELATION_ENDPOINT` warning), never a blank chip. Confirm nullability in §8 G6. |
| Error (transport) | Preserve project context, show a retry affordance. Distinguish a transport/server failure from a valid `BLOCKED`/`INCOMPATIBLE` **result** (the latter is a normal 200 result state, §2.5, not an error). Never fabricate a would-be item to fill an error. |
| Permission-limited | Any project member who can read the project may list the catalog, read a pack detail, and run a dry-run apply-preview (PM authz: read-only, mutates/grants nothing → no elevated role). So in P0 the apply-preview action is **not** hidden for a project reader. On `403 PERMISSION_DENIED` (non-member) → standard permission-denied surface. `404 PROJECT_NOT_FOUND` / `404 ONTOLOGY_PACK_NOT_FOUND` → standard not-found surfaces. **Downstream reminder:** a later real apply (P1) would require ontology-edit / governance-approver rights (`ONTOLOGY_MANAGER` / `PROJECT_ADMIN` / `SYSTEM_ADMIN`) via the existing MVP1 / MVP6.6 path; the UI must state that previewing grants no apply rights. |
| INCOMPATIBLE / BLOCKED | See §2.5 — a first-class non-crash result state with `blocked_reasons[]`, zero fabricated items, and a re-try / ontology-setup recovery path. |
| WARNING | Non-blocking result state: render items + `warnings[]` + `WARNING` badge, `CONFLICT`/`DUPLICATE` rows flagged (§2.4). |
| Truncated | `truncated: true` → capped-list notice with `item_cap` / `total_item_count`; summary counts preserved exact (§2.4). |
| Guard-violation (defensive) | If any `OntologyPackMutationGuard` flag is ever `true` (especially `ontology_draft_mutated` / `published_graph_mutated`), or `preview_only` is not `true` in a response (impossible in P0), switch to an error/guard-violation state and disable the apply-preview action. The guard is live evidence, not decorative copy. |

## 4. Design Language Application (Section + Card, KO titles, D6 badges)

- **Section + Card** layout throughout: the Ontology Packs area is a Section header
  + PREVIEW-ONLY boundary banner + catalog card grid + contextual pack detail
  (metadata + grouped bundled elements) + preview result cards. Tables only inside
  the preview sample / bundled-element drilldown, never as the primary catalog.
- **Korean titles** (D3): page H1 Korean (`온톨로지 팩`, PM to confirm); all prose
  (banner, empty/error/loading, buttons, section headers, help text) Korean; system
  enum tokens stay English with a Korean secondary label (D3 intentional-English
  scope). LNB label stays the English noun `Ontology Packs`.
- **D6 status-token badges** — every status token renders as
  `[icon] TOKEN · 한국어보조라벨` in one `HanaBadge` (tone + icon + English token +
  Korean gloss; never color alone). Tokens not already in the D6 §6.3 table are
  new; extend the table with the same rule (documented here as the frozen FE
  choice; glosses are FE proposals, **PM to confirm** — §8 G12):

  | Token | Enum | Tone | Icon (lucide) | Korean secondary label |
  |---|---|---|---|---|
  | `READY` | `PackApplyPreviewStatus` | success | `CheckCircle2` | 준비됨 |
  | `BLOCKED` | `PackApplyPreviewStatus` | danger | `Ban` | 차단됨 |
  | `COMPATIBLE` | `PackApplyCompatibility` | success | `CheckCircle2` | 호환됨 |
  | `WARNING` | `PackApplyCompatibility` | warning | `AlertTriangle` | 경고 (D6 §6.3 existing) |
  | `INCOMPATIBLE` | `PackApplyCompatibility` | danger | `XCircle` | 비호환 |
  | `NEW` | `PackPreviewItemDisposition` | success | `PlusCircle` | 신규(추가 예정) |
  | `CONFLICT` | `PackPreviewItemDisposition` | warning | `AlertTriangle` | 충돌(해소 필요) |
  | `DUPLICATE` | `PackPreviewItemDisposition` | neutral | `Copy` | 중복(no-op) |
  | `DRAFT` | `PackApplyTargetLayer` | info | `FileEdit` | DRAFT 레이어 |
  | `CLASS` | `PackElementKind` | info | `Box` | 클래스 |
  | `PROPERTY` | `PackElementKind` | info | `Tag` | 속성 |
  | `RELATION` | `PackElementKind` | info | `GitBranch` | 관계 |

  `PackPreviewNotice.code` renders as a small tone-appropriate badge (WARNING
  tone in `warnings[]`, danger tone in `blocked_reasons[]`) with the English code +
  the Korean `message` as the body:

  | Notice `code` (suggested; Backend finalizes) | Bucket | Tone | Korean gloss intent |
  |---|---|---|---|
  | `EXISTING_DUPLICATE_ELEMENT` | warning | warning | 동일 요소 이미 존재 |
  | `NAME_CONFLICT_DIFFERENT_DEFINITION` | warning | warning | 이름 충돌·정의 상이 |
  | `UNRESOLVED_RELATION_ENDPOINT` | warning | warning | 관계 엔드포인트 미해소 |
  | `PACK_NOT_FOUND` | blocked | danger | 팩을 찾을 수 없음 |
  | `NO_DRAFT_ONTOLOGY` | blocked | danger | DRAFT 온톨로지 없음 |
  | `EMPTY_PACK` | blocked | danger | 빈 팩 |

  Domain chips (§2.2) render with a Korean gloss:

  | `domain` | Korean gloss | Suggested icon (lucide) |
  |---|---|---|
  | `insurance` | 보험 | `ShieldCheck` |
  | `manufacturing` | 제조 | `Factory` |
  | `legal` | 법률/규정 | `Scale` |

  Boundary chips (§2.1) use `info`/`neutral` tone: `PREVIEW_ONLY · 미리보기 전용`,
  `NOTHING_INSTALLED · 설치 없음`, `NOTHING_APPLIED · 적용 없음`,
  `NO_DRAFT_WRITE · DRAFT 변경 없음`, `NO_PUBLISHED_WRITE · 게시 변경 없음`.

## 5. Frontend Acceptance Notes

- The Ontology Packs area feels like a guided read-only surface: boundary banner →
  catalog (3 packs, counts) → pack detail (bundled elements) → dry-run
  apply-preview → read would-add/would-modify mapping to the DRAFT.
- The PREVIEW-ONLY / nothing-installed / nothing-applied / no-DRAFT-write /
  no-published-write boundary is visible at all times (persistent banner + live
  all-false 8-flag guard proof line + `preview_only:true`), and reasserted on every
  preview result via `routing_note`.
- No install / apply / execute / confirm-and-apply / add-to-draft / "설치" / "적용"
  affordance exists anywhere; the only actionable button is "적용 미리보기 실행"
  (dry-run apply-preview). No per-element or per-card apply control.
- Preview items are labelled **would-add / would-modify** DRAFT-layer items;
  `preview_ref` is shown as an opaque reference, never a created ontology element
  id; `target_layer` is always `DRAFT`, never candidate, never published.
- Dispositions are honest: `NEW` = would add; `CONFLICT` = collides with an
  existing DRAFT element, needs human resolution via the real-apply path, never
  auto-overwritten; `DUPLICATE` = already exists, would be a no-op.
- Summary counts are exact even when the item list is `truncated`; `BLOCKED` /
  `INCOMPATIBLE` fabricates zero items.
- hana components only via `src/shared/ui/hana` adapter. Additive only; no
  MVP1–MVP6.10 route/enum/smoke break; no rename of reused shapes.

## 6. API / Field Requirements (blocking vs optional)

Naming convention (matching MVP6.x + the PM brief): DTO/schema names PascalCase,
JSON fields snake_case, enum literals UPPER_SNAKE_CASE. `Blocking` = needed for P0
UX correctness + QA acceptance. `Optional` = usability, deferrable.

### 6.1 Common blocking fields

- `project_id`, `pack_id`, `pack_version`.
- `OntologyPackMutationGuard` on **every** response (catalog, pack detail,
  apply-preview) with all **8** frozen flags present and `false`.
- On the preview: `preview_only: true`, `routing_note`.

### 6.2 Pack catalog item — `OntologyPack` (blocking)

- `pack_id` (opaque stable string), `name`, `domain`, `version`, `description`.
- element counts: `class_count`, `property_count`, `relation_count`,
  `element_count` — sufficient to render the card count row without a per-card
  detail call.
- catalog list total (exact) + a `mock` / deterministic marker.

### 6.3 Pack detail (blocking)

- pack metadata (§6.2) + bundled elements: an ordered list of
  `OntologyElementRef`-style descriptors grouped by `PackElementKind`
  (`CLASS` / `PROPERTY` / `RELATION`), reused by reference (no rename), with
  enough per-element context (label/name, `target_kind`, owning-class / endpoint
  for property/relation) to render the grouped list.

### 6.4 Dry-run apply-preview (blocking)

- `status` (`PackApplyPreviewStatus`), `compatibility` (`PackApplyCompatibility`),
  `generated_at`.
- `summary`: `would_add_count`, `would_modify_count`, `conflict_count`,
  `duplicate_count`, `total_element_count`.
- `items[]` (preview item): `preview_ref` (opaque, not an ontology element id),
  `element_kind` (`PackElementKind`), `disposition` (`PackPreviewItemDisposition`),
  `target_layer` (`PackApplyTargetLayer.DRAFT`), `mapped_ontology_ref`
  (`OntologyElementRef`-style — confirm nullability, §8 G6), `pack_element_label`,
  `existing_element_label` (for CONFLICT/DUPLICATE), `note`.
- `item_cap`, `truncated`, `total_item_count` (exact even when truncated).
- `warnings[]`, `blocked_reasons[]` (`PackPreviewNotice {code, message}`).
- `preview_id` (nullable — persist-vs-compute open, §8 G1), `preview_only: true`,
  `routing_note`, `mutation_guard` (all-false 8-flag).
- **Request** (`apply-preview` POST): `pack_id` + `project_id` via path; optional
  `item_cap` (≤ P0 cap, e.g. 50). No secret / credential / config payload (packs
  are in-repo mocks). Confirm request body shape in §8 G3.

### 6.5 Endpoints (from PM brief — Backend to finalize)

```text
GET  /api/v1/ontology-packs                                              (catalog, global)
GET  /api/v1/ontology-packs/{pack_id}                                    (pack detail)
POST /api/v1/projects/{project_id}/ontology-packs/{pack_id}/apply-preview (dry-run; creates nothing)
```

Catalog + pack detail are **global** (packs are reusable, project-agnostic
templates); apply-preview is **project-scoped** (needs the project's current DRAFT
ontology to diff against). Authz / error mapping: `403 PERMISSION_DENIED`
(non-member); `404 PROJECT_NOT_FOUND`; `404 ONTOLOGY_PACK_NOT_FOUND`. Note: a
valid target that yields nothing applyable / no DRAFT ontology is a **200 result**
with `status = BLOCKED` / `compatibility = INCOMPATIBLE` (a result state, §2.5),
NOT a 4xx — FE must distinguish the two (§8 G9).

## 7. Enum Inventory (exact frozen names)

New pack-scoped enums (from the PM freeze):

- `PackElementKind`: `CLASS`, `PROPERTY`, `RELATION` (aligns with
  `OntologyElementRef.target_kind`).
- `PackApplyPreviewStatus`: `READY`, `BLOCKED`.
- `PackPreviewItemDisposition`: `NEW`, `CONFLICT`, `DUPLICATE`.
- `PackApplyCompatibility`: `COMPATIBLE`, `WARNING`, `INCOMPATIBLE`.
- `PackApplyTargetLayer`: `DRAFT` (single literal).
- `OntologyPackMutationGuard` (8 flags, all always false): `pack_installed`,
  `ontology_draft_mutated`, `ontology_class_created`, `ontology_property_created`,
  `ontology_relation_created`, `candidate_graph_mutated`, `published_graph_mutated`,
  `change_request_created`.
- `PackPreviewNotice` shape: `{ code, message }` (stable UPPER_SNAKE `code` +
  Korean-primary `message`; MVP6.9 precedent).

Reused by reference (no rename): MVP1 ontology element + `OntologyElementRef`
(`target_kind`) + ontology-version context (the **would-be** DRAFT target AND the
current-DRAFT elements diffed against — never created rows); MVP5 admin JSON
import dry-run `compatibility_status` / `summary` / "nothing applied" pattern;
MVP6.4 `GoldSetImportCompatibility` compatibility-state precedent; MVP6.9
connectors catalog / preview / `{code, message}` notice / cap-`truncated`-exact-total
bounding pattern; MVP6.6 governance-application as the named (not built) real-apply
route; MVP5 `Role` for read authorization.

## 8. DTO / Field Gap Analysis vs the Backend Draft

**Reconciliation status: PENDING.** The Backend contract draft
(`docs/api/MVP6_11_ONTOLOGY_PACKS_API_CONTRACT_DRAFT.md`) and
`docs/api/openapi-mvp6-11-draft.json` were **not present** when this document was
written (Backend `BE6-080`~`BE6-081` runs in parallel). The table below is
therefore the FE **field/state need list** derived from the frozen PM brief; each
row's status is FE's expectation that the Backend draft must **confirm / finalize**.
This is a **blocking dependency**: §8 must be reconciled against the landed Backend
draft (and this section updated) before Wave54 implementation. G1–G4 map to the PM
brief §11 Wave54 open gates.

| # | Gap | FE need | Status / action |
|---|---|---|---|
| G1 | **Persist-vs-compute for `preview_id`** | Deep-link/refresh a preview vs keep it in view state. | **OPEN (brief §11 G1).** Recommend COMPUTE-ON-READ / EPHEMERAL (`preview_id` always `null`, no GET-by-id / list-preview endpoint), mirroring MVP6.9 G1. FE treats the preview as ephemeral view state in P0; no permalink built around `preview_id`. Backend confirms. |
| G2 | **Catalog scope + exact paths** | Catalog global vs project-scoped; final path shapes. | **FROZEN, confirm (brief §11 G2).** Catalog + detail global (`/ontology-packs`, `/ontology-packs/{pack_id}`); apply-preview project-scoped (`/projects/{project_id}/ontology-packs/{pack_id}/apply-preview`). Backend confirms path shapes in the draft. |
| G3 | **apply-preview request body** | FE must know what (if anything) to POST. | **NEEDS CONFIRM.** Expected: path params only + optional `item_cap`; **no** config/secret/credential payload (packs are in-repo mocks). Backend confirms the request schema. |
| G4 | **element-identity match rule (NEW/CONFLICT/DUPLICATE)** | So the FE copy for each disposition is accurate (what makes two elements "the same"). | **OPEN (brief §11 G4).** FE renders whatever the Backend returns per item; the disposition copy (§2.4) assumes identity by element name/key within `element_kind`. Backend freezes the match rule + fixture matrix (brief §11 G3). |
| G5 | **`mapped_ontology_ref` shape + nullability** | Render an ref chip + contextual ontology link; handle null. | **NEEDS CONFIRM.** Brief says `OntologyElementRef`-style by reference. FE must know if it is nullable (e.g. a `NEW` item with no existing DRAFT counterpart, or an unresolved relation endpoint) so it can render an explicit non-blank state (§3 "Null mapped ref"). Backend confirms shape + nullability. |
| G6 | **`PackPreviewNotice` element shape + code vocabulary** | Badge (code) + Korean message; stable codes for D6/i18n. | **NEEDS CONFIRM.** Brief freezes `{code, message}` and a *suggested* code vocabulary (§4); Backend finalizes the exact code set for `warnings[]` / `blocked_reasons[]`. FE renders defensively as code-with-message. |
| G7 | **`generated_at` freshness field** | Freshness/stale marker on the preview result (§2.4). | **NEEDS CONFIRM (likely present).** Brief lists `generated_at` on the preview response; if omitted (deterministic + ephemeral), FE drops the stale marker — non-blocking. Backend confirms. |
| G8 | **Guard flag list stability (exactly 8)** | Proof line renders exactly 8 flag names, all `false`, all required. | **FROZEN, confirm.** Brief §6 freezes the 8 `OntologyPackMutationGuard` flags; Backend must expose all 8 as `const:false` / `required` on every response. FE reads them live (§2.1). |
| G9 | **Invalid/empty target transport contract** | 200 result state vs 4xx error. | **NEEDS CONFIRM.** Expected: unknown pack / missing project → `404`; well-formed but nothing-applyable / no-DRAFT-ontology → **200** `status:BLOCKED` / `INCOMPATIBLE` (result state, §2.5). Backend confirms the split so FE distinguishes error vs result. |
| G10 | **Catalog element counts on the list response** | Card count row without a per-card detail call. | **FROZEN, confirm.** Brief §3 puts `class_count` / `property_count` / `relation_count` / `element_count` on the catalog item. Backend confirms they are on the list response (not detail-only). |
| G11 | **Counts vs items consistency under truncation** | Summary counts exact, item list capped. | **FROZEN, confirm.** Brief §4 rule: `summary` counts + `total_item_count` always exact; only `items[]` capped by `item_cap` (P0 e.g. 50) with `truncated`. Backend confirms. |
| G12 | **Korean gloss + H1 wording + LNB group/slot** | KO secondary labels; H1 `온톨로지 팩` vs `Ontology Packs`; Build slot + own-item-vs-tab. | **PM/COMMANDER DECISION** (not a Backend field). FE proposals in §1.1 / §1.3 / §4; ratify per brief §11 G5. |

Remaining open items for Wave54 (Backend closes in the draft): **G1**
(persist-vs-compute), **G3** (request body), **G4** (identity match rule +
fixture matrix), **G5** (`mapped_ontology_ref` nullability), **G6**
(`PackPreviewNotice` code vocabulary), **G7** (`generated_at`), **G9**
(invalid/empty transport split). None block the *planning* deliverable or the P0
UX shape; **G12** is a PM/commander copy/IA confirm. Once the Backend draft lands,
this section must be re-reconciled field-by-field (currently PENDING, not
reconciled).

## 9. Non-negotiable Boundary Restated (FE view)

- The Ontology Packs surface is **read-only catalog + dry-run apply-preview only.**
  It **installs nothing, applies nothing, writes nothing** to any ontology layer or
  the published graph. No install / apply / execute / confirm-and-apply /
  add-to-draft / "설치" / "적용" affordance exists anywhere.
- **No external fetch/download.** Deterministic in-repo mock packs (exactly 3); no
  registry / gallery / update notification.
- **The apply-preview diffs against the current DRAFT ontology read-only.** It
  mutates neither the DRAFT nor the published graph; `ontology_draft_mutated` and
  `published_graph_mutated` are always `false` (headline invariant).
- **Preview items are would-add / would-modify DRAFT-layer items**, never created
  rows; `target_layer` is always `DRAFT`, never candidate, never published;
  `preview_ref` is opaque, never an ontology element id. A real apply later routes
  through the existing MVP1 ontology-edit / MVP6.6 governance-application
  (DRAFT-only, human-initiated) path (`routing_note`) — a pack is never a second,
  unreviewed ontology-write path.
- Every response carries an **all-false** `OntologyPackMutationGuard` (8 flags),
  rendered as a live proof line — read from the response, not hardcoded as
  decoration. Any `true` flag (impossible in P0) forces a guard-violation state and
  disables the apply-preview action.
- Additive only; no MVP1–MVP6.10 break; no rename of reused shapes; boundary per
  ADR 0018.
