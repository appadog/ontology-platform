# MVP6.4 Gold Set Authoring Policy + Dataset Revisioning — Frontend UX/API Requirements

Status: `WAVE39 CONTRACT-FIRST PLANNING`
Date: 2026-06-30
Owner: Frontend / UIUX Architecture
Backlog ID: `FE6-049`

This document defines the frontend requirements for MVP6.4 **Gold Set authoring
policy + dataset revisioning**. It is **requirements only**. No runtime route,
component, type, API client, mock fixture, seed, smoke, or test is implemented in
Wave39 (mirrors Wave14/19/23/30/33 planning waves).

The feature is an **expert-owned, candidate/analysis-layer authoring surface**
over the closed MVP6.1 evaluation datasets. No copy, control, or affordance may
imply that authoring publishes anything, mutates the published or candidate
graph, edits prompts/ontology definitions, starts an extraction or evaluation
run, enforces a policy automatically, or that editing gold data changes
already-scored runs. Authoring is gated to the dataset's expert owner (and a
designated admin/PM role); all other roles see read-only + a permission state.

## Source Documents

- `AGENTS.md` (Frontend Rules)
- `.agents/skills/handoff-reporting/SKILL.md`
- `docs/handoffs/CURRENT_STATE.md`
- `docs/handoffs/wave-039/NEXT_ORDERS.md`
- `docs/handoffs/wave-039/PM_REPORT.md`
- `docs/pm/MVP6_4_GOLD_SET_AUTHORING_BRIEF.md` (frozen PM brief)
- `docs/adr/0011-mvp6-4-gold-set-authoring-revision-immutability-boundary.md`
- `docs/adr/0010-lnb-project-context-information-architecture.md` (LNB IA)
- `docs/pm/UIUX_REMEDIATION_DECISIONS.md` (D1 LNB IA, D3 copy/KO titles,
  D4 breadcrumb, D6 status-token badges)
- `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md` (tokens, Section+Card module,
  one primary action per screen)
- `docs/pm/MVP6_3_FRONTEND_UX_REQUIREMENTS.md` (format precedent)
- Existing MVP6.1 surface:
  `apps/frontend/src/pages/EvaluationDatasetsPage.tsx`,
  `apps/frontend/src/shared/api/types.ts`,
  `apps/frontend/src/shared/layout/navigation.ts`
- Backend contract draft (`BE6-028`):
  `docs/api/MVP6_4_GOLD_SET_AUTHORING_API_CONTRACT_DRAFT.md` (+
  `docs/api/openapi-mvp6-4-draft.json`). Backend ran in parallel this wave: this
  document was first drafted against the PM brief + ADR 0011 (draft absent), then
  **reconciled against the Backend draft once it landed**. The draft confirms
  every provisional enum/DTO name verbatim (zero mismatches) and pre-answers the
  8 Blocking field/state gaps — see §"DTO / State Gap Analysis".

## Backlog Coverage

| ID | Requirement output |
|---|---|
| `FE6-049` | Gold Set Manager route/IA placement; authoring screen flow; required fields per screen mapped to Backend DTOs; loading/empty/error/permission states; permission-boundary UX; revision-lifecycle UX (DRAFT/ACTIVE/FROZEN/ARCHIVED); import-compatibility UX (4 states + strategy); run→revision pin display; no-mutation copy; DTO gap analysis |

## Scope Guard

MVP6.4 P0 is an authoring surface confined to the evaluation/analysis layer:

```text
select project
-> open Gold Set Manager (Evaluation / Gold Set area)
-> open a dataset as its expert owner
-> edit a gold entity / gold relation OR archive a stale gold item
-> attach / edit a standalone Gold Evidence object on a gold item
-> cut a new dataset revision (prior revision becomes FROZEN / immutable)
-> export the dataset revision to a portable JSON bundle
-> import a bundle (dry-run compatibility report -> confirm with a strategy)
-> open an existing run and confirm it still points at the revision it used
```

The UI must NOT imply that any authoring action:

- publishes anything, or writes to the published or candidate graph;
- edits prompts / prompt versions or the ontology definition (it only
  references existing `ontology_class_id` / `ontology_relation_id`);
- starts an extraction job or an evaluation run, or calls any LLM/provider;
- changes, rescoring, or invalidates any already-completed run's metrics, or
  rewrites any prior run's `dataset_version_id` pin;
- enforces a policy automatically, or hard-deletes any gold item / evidence /
  revision (archive / freeze only);
- imports without an explicit confirm after a dry-run, or auto-merges a
  conflicting bundle, or edits a FROZEN revision.

Out of scope for MVP6.4 P0 UI (P1/later): multi-user concurrent-edit locking /
merge UI, full revision diff visualization beyond a counts/compatibility
summary, cross-project / cross-org gold-set sharing, run execution from the
authoring UI, new evaluation metric names, training-dataset export execution,
and any MVP3 review / MVP4 quality / MVP6.2 learning-signal / MVP6.3 benchmark /
published-graph join.

## Information Architecture

The Gold Set Manager is a **project-scoped** authoring area **contextual to the
existing MVP6.1 Evaluation / Gold Set surface**. It must NOT add ID-bound pages
to the global LNB (AGENTS.md Frontend Rules; ADR 0010 two-zone LNB; D1).

### Global / Project-zone LNB placement (D1 / ADR 0010)

- Do NOT add a new flat global LNB entry. The global zone stays
  `Dashboard` / `Projects` / `Admin` only.
- Do NOT add a new project-zone LNB item either. Gold Set authoring lives
  **under the existing `Evaluation` item** in the Analyze group
  (`/projects/:p/evaluation-datasets`). It is reached contextually from the
  Evaluation surface — never as `Gold Set Manager`, `Dataset Revision`,
  `Gold Item Edit`, or `Import` as a flat global or project LNB item.
- The active LNB item for every route below remains **`Evaluation`** (per D1
  §1.6: `path contains /evaluation-dataset`). Authoring is an in-section
  sub-view of Evaluation, not a rival destination.
- ID-bound detail routes (dataset-by-id, revision-by-id, gold-item-by-id) stay
  contextual: reached from parent rows/cards/breadcrumbs, never the LNB
  (ADR 0010 Note C).

### Contextual placement (project-scoped, sits inside the Evaluation surface)

- Entry point: an `정답셋 관리` (Gold Set Manager) / `정답 항목 편집` action from
  the existing Evaluation Datasets page (`/projects/:p/evaluation-datasets`),
  visible only to the dataset owner / admin (others see a read-only `정답셋 보기`
  affordance into the same surface).
- Parent area route (additive, contextual to Evaluation):
  `/projects/:p/evaluation-datasets/:datasetId/gold-set`
- Suggested contextual routes / panels (reached via parent rows, cards,
  breadcrumbs, tabs, or a detail/side panel — never as LNB items):
  - `.../:datasetId/gold-set` — Gold Set Manager hub (revision header + gold
    item list + authoring entry, owner-gated)
  - `.../:datasetId/gold-set/items/:goldItemId` — gold item edit panel/route
    (entity or relation; `gold_item_kind` distinguishes)
  - `.../:datasetId/gold-set/items/:goldItemId/evidence` — standalone Gold
    Evidence attach/edit panel
  - `.../:datasetId/gold-set/revisions` — revision list + cut-revision action
  - `.../:datasetId/gold-set/revisions/:revisionId` — revision detail
    (status badge, snapshot counts, pinning runs)
  - `.../:datasetId/gold-set/import` — import dry-run + confirm flow
  - `.../:datasetId/gold-set/export` — export bundle action (download), no route
    required if implemented as an action
- If no project is selected, the entry resolves to the global zone + the muted
  "프로젝트를 선택하면 작업 메뉴가 표시됩니다" hint (D1 §1.4); no auto-redirect.
- If the dataset has no gold items / no revision yet, resolve to the relevant
  empty state (see State Requirements).

### Breadcrumbs (reuse the existing `Breadcrumbs` component; D4)

The section segment stays the English `Evaluation` LNB label so the active LNB
item == breadcrumb section (D4 §4.1):

```text
프로젝트명 > Evaluation > <데이터셋명> > 정답셋 관리 [ > <항목/리비전/가져오기> ]
```

Representative mapping (additive to D4 §4.2):

| Route | Breadcrumb |
|---|---|
| `.../:datasetId/gold-set` | `프로젝트명 > Evaluation > <데이터셋명> > 정답셋 관리` |
| `.../gold-set/items/:goldItemId` | `… > 정답셋 관리 > 정답 항목 #<id>` |
| `.../gold-set/items/:goldItemId/evidence` | `… > 정답셋 관리 > 정답 항목 #<id> > 근거` |
| `.../gold-set/revisions` | `… > 정답셋 관리 > 리비전` |
| `.../gold-set/revisions/:revisionId` | `… > 정답셋 관리 > 리비전 #<id>` |
| `.../gold-set/import` | `… > 정답셋 관리 > 가져오기` |

### Page structure (Design language: Section+Card, KO title, one primary action)

Apply the closed design language (`DESIGN_DIRECTION_REFERENCE_UPGRADE.md`):
KO page title (`정답셋 관리`), `Section`+`HanaCard` module, restrained single
accent, **exactly one primary action per screen**, progressive disclosure
(authoring detail collapsed under the summary), outcome-first KO microcopy.

```text
Project context header + breadcrumbs (KO title: 정답셋 관리)
-> Revision header Section (active revision + status badge + owner + counts;
   one primary action by screen: 리비전 생성 / 가져오기 / 내보내기)
-> Permission band (read-only / owner / permission-limited — first-class)
-> Gold item list Section (entity + relation rows with GoldItemStatus badges;
   edit / archive / restore actions owner-gated)
-> Gold item edit panel (detail; collapsed/secondary) -> evidence sub-panel
-> Revision list Section (DRAFT/ACTIVE/FROZEN/ARCHIVED badges; cut/activate)
-> Run-pin Section (existing runs + the revision each pinned + FROZEN marker)
-> Import dry-run report panel (4-state compatibility + strategy + confirm)
```

## Screen Flow and UX Surfaces

### 1. Gold Set Manager Hub (revision header + gold item list)

Purpose: open a dataset as its owner, see the active revision, and reach
authoring. Maps to `EvaluationDataset` + active `DatasetRevision` + gold lists.

Required content:

- Dataset context echo (reuse MVP6.1 verbatim — no rename): `EvaluationDataset`
  `id`, `name`, `status` (`EvaluationDatasetStatus`: `DRAFT`/`ACTIVE`/
  `ARCHIVED`), `owner_id`, `active_version_id`.
- Active `DatasetRevision`: `id`, `status` (`DatasetRevisionStatus`), counts
  (`sample_count`, `gold_entity_count`, `gold_relation_count`,
  `gold_evidence_count`), `created_at`, `ontology_version_id` context.
- Gold item list — two groups, reusing MVP6.1 fields verbatim:
  - `GoldEntity`: `id`, `sample_id`, `ontology_class_id`, `label`,
    `normalized_value`, `evidence` (`GoldEvidenceRef`), `created_at`, plus the
    additive `status` (`GoldItemStatus`).
  - `GoldRelation`: `id`, `sample_id`, `ontology_relation_id`,
    `source_gold_entity_id`, `target_gold_entity_id`, `evidence`, `created_at`,
    plus the additive `status` (`GoldItemStatus`).
- Each gold row shows a `GoldItemStatus` badge (`DRAFT`/`ACTIVE`/`ARCHIVED`) per
  D6 (badge + icon + KO secondary label).
- Owner/permission context: `owner_id` vs current actor; a capability hint
  (see gap analysis) drives owner vs read-only rendering.

Required interactions (owner/admin only; others see read-only):

- One primary action by mode (D-language one-primary rule): on the hub the
  primary is `리비전 생성` (cut revision) when the active revision is editable,
  else `가져오기`. `내보내기` and per-row edit/archive are secondary.
- Per gold row: `편집` (edit), `보관` (archive ACTIVE/DRAFT → ARCHIVED), `복원`
  (restore ARCHIVED → previous). Archive/restore are soft, never hard-delete;
  confirm copy must say "보관하면 새 평가에서 제외되지만 기존 실행과 근거는 그대로
  유지됩니다" (archive excludes from new runs but keeps existing runs/evidence).
- Edit / archive land on a `DRAFT`/editable revision only. If the active
  revision is `FROZEN`, edit/archive are disabled with copy directing the user
  to cut a new revision first (see §3).

Copy guard: action labels never say `게시`(publish), `실행`(run),
`평가`(evaluate), or `삭제`(delete). Archive is `보관`, not `삭제`.

### 2. Gold Item Edit + Standalone Gold Evidence

Purpose: edit a gold entity/relation in place, and attach/edit a first-class
Gold Evidence object. Maps to gold edit request + standalone `GoldEvidence`.

Required content — gold entity edit (editable fields; ids read-only):

- editable: `label`, `normalized_value`, `ontology_class_id` (picker over the
  existing project ontology version — reference only, never edits the ontology),
  `evidence` (`GoldEvidenceRef` fields) OR a linked standalone `GoldEvidence`.
- read-only: `id`, `project_id`, `dataset_id`, `sample_id`, `created_at`,
  `status` (`GoldItemStatus`).

Required content — gold relation edit:

- editable: `ontology_relation_id`, `source_gold_entity_id`,
  `target_gold_entity_id`, `evidence` / linked `GoldEvidence`.
- read-only: `id`, `project_id`, `dataset_id`, `sample_id`, `created_at`,
  `status`.

Standalone `GoldEvidence` object (promoted from embedded `GoldEvidenceRef`):

- preserves all existing `GoldEvidenceRef` context verbatim — `sample_id`,
  `source_id`, `source_segment_id`, `locator`, `offset_start`, `offset_end`,
  `quote` — plus an additive `id` and lifecycle. The embedded `evidence` field on
  the gold item is retained for back-compat (display both consistently; do not
  drop the embedded value).
- Evidence-first reading order (reuse Wave13 pattern): the quote + source/segment
  locator are primary; ids secondary.

Required interactions:

- One primary action: `저장`. Saving records an authoring audit entry
  (`GoldAuthoringAction` `EDIT` / `EVIDENCE_ATTACH` / `EVIDENCE_EDIT`) and
  returns the all-false `GoldAuthoringMutationGuard` — surface a quiet
  confirmation that "이 편집은 게시 그래프·후보·기존 실행 결과를 변경하지 않습니다"
  (this edit does not change the published/candidate graph or existing runs).
- Edits are blocked on a `FROZEN` revision (read-only panel + cut-revision CTA).
- An audit trail panel (collapsed) shows the gold item's authoring history
  (actor, action, before/after, reason/note, timestamp) for traceability.

### 3. Dataset Revision Lifecycle (cut / activate / freeze)

Purpose: cut a new revision, see the lifecycle, and make immutability obvious.
Maps to `DatasetRevision` + `DatasetRevisionStatus`.

`DatasetRevisionStatus` rendering (D6 badge + icon + KO label):

| Status | Tone | Meaning shown to the user | Editable? |
|---|---|---|---|
| `DRAFT` | info | 작성 중인 리비전 (편집 가능) | Yes |
| `ACTIVE` | success | 현재 권위 리비전 (데이터셋당 1개) | Yes (until pinned) |
| `FROZEN` | warning/neutral | 고정됨 — 읽기 전용, 변경 불가 | **No (immutable)** |
| `ARCHIVED` | neutral | 보관됨 — 읽기 전용, 계보용 보존 | No |

Required content:

- Revision list: each `id`, `status`, counts, `created_at`, `created_by`,
  whether it is the dataset's `active_version_id`, and which runs pinned it.
- Exactly **one `ACTIVE`** revision per dataset is enforced visually (only one
  ACTIVE badge; activating a `DRAFT` moves the prior ACTIVE → `FROZEN`).
- `FROZEN` / `ARCHIVED` revisions render their entire detail read-only with an
  explicit immutable banner: "이 리비전은 고정되어 변경할 수 없습니다. 변경하려면
  새 리비전을 생성하세요." No edit/archive affordance appears on a FROZEN revision.

Required interactions:

- One primary action: `리비전 생성` (cut: snapshot current samples + gold items
  into a new `DRAFT`/`ACTIVE` revision). Copy must say it snapshots and that the
  prior revision becomes 고정(FROZEN)/immutable — never "publishes".
- `활성화` (activate a DRAFT → ACTIVE) is secondary; activating moves the prior
  ACTIVE → FROZEN. Surface the freeze consequence before confirm.
- The exact FROZEN trigger (freeze-on-pin vs freeze-on-activate) is a Backend
  open question (gap analysis #4). The UI must render `FROZEN` honestly from the
  returned `status` rather than predicting it; when a run pins a revision the UI
  shows that revision as FROZEN/immutable.

### 4. Run → Revision Pin Display (reproducibility made visible)

Purpose: prove that authoring never mutates already-scored runs. Maps to
`EvaluationRun.dataset_version_id` (reused verbatim, never rewritten).

Required content:

- For each existing run: `EvaluationRun` `id`, `status`, `dataset_id`,
  `dataset_version_id` (the pinned revision), `model_name`, `prompt_version_id`,
  `ontology_version_id`, `parser_version`, `started_at`/`completed_at`.
- Resolve `dataset_version_id` → the pinned `DatasetRevision` and show its
  `status`; when `FROZEN`, render a "고정됨 — 기준이 바뀌지 않았습니다" marker so
  the user sees the run's basis cannot have drifted.
- An explicit reassurance line near the run list: "정답 항목 편집·리비전 생성·
  보관·가져오기는 기존 실행의 지표나 고정된 리비전을 변경하지 않습니다."

Required interactions: read-only. No rescore, re-run, or re-pin affordance
exists in P0 (and none may be implied). The run row links back to the MVP6.1
Evaluation run detail for metrics/error cases (no new run model).

### 5. Export Bundle

Purpose: export a single revision to a portable JSON bundle. Maps to the
export bundle GET.

Required content (bundle is self-describing, read-only snapshot):

- `bundle_version`, source `project_id` / `dataset_id` / `revision_id`,
  `exported_at`, ontology version context, then `samples[]`, `gold_entities[]`,
  `gold_relations[]`, `gold_evidence[]`. No prompts, candidates, published graph,
  or secrets.

Required interactions:

- One action: `내보내기` (download JSON). Copy: read-only snapshot of the selected
  revision; never says it shares or publishes. Show which revision is exported
  and its status; FROZEN/ARCHIVED revisions are fully exportable.

### 6. Import (dry-run compatibility → confirm with strategy)

Purpose: import a bundle as a NEW dataset or NEW revision, honestly, dry-run
first. Maps to import dry-run report + confirm. `GoldSetImportCompatibility`:
`COMPATIBLE` / `WARNING` / `CONFLICT` / `INCOMPATIBLE`.

Compatibility-state rendering (D6 badge + KO label, honest dry-run-before-confirm):

| State | Tone | Meaning | Confirm allowed? |
|---|---|---|---|
| `COMPATIBLE` | success | 대상 프로젝트에서 모든 클래스/관계/로케이터가 해소됨 — 가져오기 안전 | Yes |
| `WARNING` | warning | 가져올 수 있으나 비차단 주의 (예: 선택적 근거 인용 누락, 로컬 소스 세그먼트 부재로 로케이터만) | Yes (after ack) |
| `CONFLICT` | warning | id 충돌/중복 — 자동 병합하지 않음, 명시적 전략 필요 | Yes only with chosen strategy |
| `INCOMPATIBLE` | danger | 대상 온톨로지 버전에 없는 클래스/관계 참조 — 가져오기 차단 | **No (blocked)** |

Required content / flow (dry-run is the default; nothing mutates until confirm):

1. Upload/select a bundle → server returns a dry-run compatibility report. Show
   the overall `GoldSetImportCompatibility` plus per-item findings (which
   class/relation ids resolve, which conflict, which are missing), and the
   bundle's source/version context.
2. Strategy choice for `CONFLICT` (and as the create target generally), bound to
   the import-strategy values (provisional names — gap analysis #5):
   `CREATE_NEW_DATASET` vs `NEW_REVISION_OF_EXISTING`. Import **always** creates a
   new dataset or a new revision; it never edits an existing FROZEN revision and
   never auto-merges.
3. `INCOMPATIBLE` blocks confirm entirely with a clear reason (lists the missing
   ontology class/relation ids); the only action is to fix the target ontology
   or pick a compatible bundle — no override.
4. One primary action: `가져오기 확정` (confirm), enabled only for
   `COMPATIBLE`/`WARNING`/`CONFLICT`(+strategy). Confirm returns the created
   dataset/revision id, an `IMPORT` audit entry, and the all-false
   `GoldAuthoringMutationGuard`. Copy must never say the import publishes or
   edits the published/candidate graph.

The dry-run report and the confirm action are two distinct steps; the UI must
never auto-confirm and must show the report before any confirm affordance is
enabled (honest dry-run-before-confirm).

## Permission Boundary UX (expert-owner / admin-only)

The authoring boundary is first-class, not an afterthought:

- The current actor is compared against the dataset `owner_id` (and the
  admin/PM role). Owner/admin → full authoring; everyone else → read-only.
- Non-owners see the entire Gold Set Manager **read-only**: gold items,
  revisions, run pins, and exports are visible; every authoring control
  (edit/archive/restore, cut/activate revision, import confirm) is absent or
  disabled with a `PERMISSION_LIMITED` badge (D6: warning tone, `Lock` icon,
  KO label 권한 제한) and copy "정답셋 편집은 데이터셋 소유 전문가와 관리자만
  가능합니다."
- The UI must not optimistically show a write control then fail on submit. It
  renders the owner vs read-only surface from a capability hint up front (gap
  analysis #1). A 403 from the server degrades to the permission-limited state,
  not a full-page crash.
- `내보내기` (export) and all reads stay available to permitted read roles even
  when authoring is gated.

## State Requirements (first-class)

| State | Required behavior |
|---|---|
| Loading | Staged skeletons for revision header, gold item list, revision list, run-pin list, and import dry-run report. Never render `0` counts or empty badges before data arrives. |
| Empty — no dataset selected / no project | Resolve to the project picker / selected-project-required state (D1 §1.4 hint). No auto-redirect. |
| Empty — no gold items | "이 데이터셋에는 아직 정답 항목이 없습니다." Point to the MVP6.1 Evaluation flow to add samples/gold items. Do not open new runtime scope. |
| Empty — no revision | Active revision absent: explain that a revision will be cut from current samples + gold items; offer `리비전 생성` (owner only). |
| Empty — no runs pinned | "이 데이터셋을 사용한 평가 실행이 아직 없습니다." Show reproducibility copy; no run-execution affordance. |
| Empty — import no findings | A dry-run with an empty bundle: "가져올 항목이 없습니다." |
| Error | Preserve project + dataset + revision context; show retry; distinguish "a gold item / revision / bundle is unavailable" from "server/API failure". A missing run/revision degrades to a per-row notice, not a crash. |
| Permission-limited | Read surfaces stay visible; authoring controls show `PERMISSION_LIMITED` and state owner/admin is required. Never expose a write/publish affordance to anyone. |
| FROZEN / immutable | A `FROZEN` (or `ARCHIVED`) revision renders fully read-only with the immutable banner and no edit/archive/activate control. Composes with other states (does not replace them). |
| Import dry-run | The compatibility report is shown before any confirm control is enabled; `INCOMPATIBLE` blocks confirm; `CONFLICT` requires a strategy. Never auto-confirm. |
| Conflict (409) | An authoring action that conflicts (e.g. edit on a now-FROZEN revision, activate when another ACTIVE exists) shows a non-destructive conflict notice and the resolving action (cut a new revision / refresh), never a silent overwrite. |
| Stale | If the viewed revision/list is older than the server state (or the server marks staleness), mark it stale and offer refresh, without blocking read. |

## Backend Contract Fields (Frontend-required)

Naming convention (matching MVP6.1/6.2/6.3): DTO/schema names PascalCase, JSON
fields snake_case, enum literals UPPER_SNAKE_CASE. `Blocking` = needed for P0 UX
correctness and QA acceptance. `Optional` = usability, deferrable.

### Reused MVP6.1 fields (must NOT be renamed — verified in `types.ts`)

- `EvaluationDataset`: `id`, `project_id`, `name`, `status`
  (`EvaluationDatasetStatus`: `DRAFT`/`ACTIVE`/`ARCHIVED`), `owner_id`,
  `active_version_id`.
- `EvaluationSample`: existing shape, captured into a revision snapshot;
  unchanged.
- `GoldEntity`: `id`, `project_id`, `dataset_id`, `sample_id`,
  `ontology_class_id`, `label`, `normalized_value`, `evidence`
  (`GoldEvidenceRef`), `created_at`.
- `GoldRelation`: `id`, `project_id`, `dataset_id`, `sample_id`,
  `ontology_relation_id`, `source_gold_entity_id`, `target_gold_entity_id`,
  `evidence`, `created_at`.
- `GoldEvidenceRef`: `sample_id`, `source_id`, `source_segment_id`, `locator`,
  `offset_start`, `offset_end`, `quote`.
- `EvaluationRun`: `id`, `project_id`, `status`, `model_name`,
  `prompt_version_id`, `ontology_version_id`, `parser_version`, `dataset_id`,
  `dataset_version_id`, `started_at`, `completed_at`.

### New enums (Frontend needs the exact literals — provisional from the brief)

- `GoldItemStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`.
- `DatasetRevisionStatus`: `DRAFT`, `ACTIVE`, `FROZEN`, `ARCHIVED`.
- `GoldAuthoringAction`: `CREATE`, `EDIT`, `ARCHIVE`, `RESTORE`,
  `EVIDENCE_ATTACH`, `EVIDENCE_EDIT`, `REVISION_CUT`, `REVISION_ACTIVATE`,
  `IMPORT`.
- `GoldSetImportCompatibility`: `COMPATIBLE`, `WARNING`, `CONFLICT`,
  `INCOMPATIBLE`.
- Import strategy: `CREATE_NEW_DATASET`, `NEW_REVISION_OF_EXISTING`
  (enum type name not yet frozen — gap analysis #5).

### New DTOs (Blocking unless noted)

- `DatasetRevision`: `id`, `dataset_id`, `project_id`, `status`
  (`DatasetRevisionStatus`), `sample_count`, `gold_entity_count`,
  `gold_relation_count`, `gold_evidence_count`, `ontology_version_id`,
  `created_at`, `created_by`, and a list/flag of pinning run ids.
- `GoldEvidence` (standalone): `id` + all `GoldEvidenceRef` fields verbatim +
  lifecycle/`created_at`. The embedded `evidence` on gold items is retained.
- Gold item edit request (entity / relation): editable fields per §2; ids
  read-only. `gold_item_kind` to distinguish entity vs relation.
- Archive / restore request: target gold item id + optional reason/note.
- `DatasetRevision` create (cut) + activate requests.
- Export bundle: self-describing JSON per §5.
- Import dry-run report: overall `GoldSetImportCompatibility` + per-item
  findings + bundle source/version context.
- Import confirm request: bundle + chosen strategy.
- `GoldAuthoringMutationGuard` (all-false, on every authoring/import response):
  `published_graph_mutated`, `candidate_graph_mutated`, `prompt_version_mutated`,
  `ontology_definition_mutated`, `extraction_job_started`,
  `evaluation_run_started`, `prior_run_pin_rewritten`.
- Authoring audit entry: actor, `action` (`GoldAuthoringAction`), target ids,
  before/after snapshot, reason/note, timestamp. (Blocking for the audit panel.)
- Capability hint (Optional but strongly requested): a per-dataset
  `can_author` / required-role hint so the UI renders owner vs read-only up
  front instead of guessing from a 403 (gap analysis #1).

## DTO / State Gap Analysis vs Backend Draft

This document was first drafted against the PM brief / ADR 0011 while the
Backend draft was absent (parallel wave). The Backend draft
(`docs/api/MVP6_4_GOLD_SET_AUTHORING_API_CONTRACT_DRAFT.md`) **subsequently
landed and was reconciled here**: it confirms every provisional enum/DTO name
above **verbatim with zero mismatches**, and pre-answers the 8 Blocking gaps.
The `openapi-mvp6-4-draft.json` artifact is to be verified by QA (`INT6-026`).

### Resolved by the Backend draft (verified — no Frontend blocker)

1. **Permission capability hint — RESOLVED.** Draft adds a display-only
   `GoldAuthoringCapabilities` hint on every authoring/list/get response
   (`can_view`, `can_edit_gold_item`, `can_archive_gold_item`,
   `can_author_evidence`, `can_cut_revision`, `can_activate_revision`,
   `can_import`); non-owners get `403 PERMISSION_DENIED` (the 403-vs-409 question
   is settled: 403 for permission, 409 for state conflict). The UI renders the
   read-only / `PERMISSION_LIMITED` surface from this hint up front.
2. **`GoldItemStatus` on gold shapes — RESOLVED.** Draft adds `status`
   (`GoldItemStatus`, default `ACTIVE`), `revision_id`, `evidence_id`,
   `updated_at`, `archived_at` as **additive optional** read fields via a
   `GoldItemAuthoringOverlay` `allOf` overlay — no rename of
   `GoldEntity`/`GoldRelation`. Matches the MVP6.1 additive requirement.
3. **Standalone `GoldEvidence` coexistence — RESOLVED.** Gold item references its
   promoted evidence via a nullable `evidence_id`; the embedded
   `evidence: GoldEvidenceRef` stays for back-compat. UI displays both.
4. **Revision FROZEN trigger — RESOLVED.** Draft freezes: `FROZEN` when a newer
   revision is activated OR any run pins it; runs pin only `ACTIVE`/`FROZEN`,
   never `DRAFT`; edit/activate on a frozen item → `409 GOLD_ITEM_IMMUTABLE` /
   `409 REVISION_FROZEN`. The UI renders `FROZEN` from the returned `status`.
5. **Import strategy — RESOLVED.** Enum `GoldSetImportStrategy`
   (`CREATE_NEW_DATASET` / `NEW_REVISION_OF_EXISTING`); confirm requires
   `strategy`, and `target_dataset_id` is required iff
   `NEW_REVISION_OF_EXISTING`.
6. **Dry-run report — RESOLVED.** Draft defines the dry-run report with aggregate
   `compatibility` (`GoldSetImportCompatibility`) + `issues[]`
   (`GoldSetImportIssue`: `code`, `severity`, …) + `allowed_strategies[]`;
   `409 IMPORT_INCOMPATIBLE` blocks confirm, `409 IMPORT_STRATEGY_REQUIRED` for
   `CONFLICT` without a strategy. Dry-run mutates nothing.
7. **`GoldAuthoringMutationGuard` keys — RESOLVED.** Draft uses the 7 keys
   verbatim incl. `prior_run_pin_rewritten` (the reproducibility proof).
8. **Revision ↔ run pin resolution — RESOLVED.** `active_version_id` /
   `dataset_version_id` resolve to `DatasetRevision.id`; revision carries the
   pinning-run linkage for the run-pin display.

### Remaining items to confirm at Wave40 (non-blocking)

9. **Optional — `gold_item_kind` / `target_kind` discriminator.** Draft uses
   `target_kind` (`GOLD_ENTITY` / `GOLD_RELATION`) on audit entries; confirm the
   gold item read/edit response exposes an equivalent discriminator so the shared
   `.../items/:goldItemId` route picks the right edit panel without inferring
   from the source list.
10. **Optional — audit entry ordering/pagination.** Confirm newest-first order
    and pagination for the authoring-audit list used by the (collapsed) audit
    panel.
11. **Optional — export download contract.** Confirm the export GET returns a
    JSON body (with content-disposition) vs a signed URL, so `내보내기` wires
    correctly.
12. **QA — OpenAPI artifact.** `docs/api/openapi-mvp6-4-draft.json` parse +
    additivity/disjointness to MVP1–MVP6.3 paths is for QA (`INT6-026`) to
    verify; Frontend re-confirms exact field names against it before Wave40.

No DTO **rename** of any existing MVP6.1 field is requested — gold/evidence/
dataset/run shapes must be echoed verbatim. Any rename by Backend would be a
breaking mismatch and a blocker. New status fields and the standalone evidence
object must be **additive** (do not break the MVP6.1 Evaluation page, which reads
`GoldEntity`/`GoldRelation`/`GoldEvidenceRef`/`EvaluationRun` today).

## Frontend Acceptance Notes

- Project-scoped only; contextual to the existing `Evaluation` surface; no
  ID-bound page added to the global or project LNB (active LNB item stays
  `Evaluation`).
- Design language applied: KO page title `정답셋 관리`, `Section`+`HanaCard`
  module, one primary action per screen, restrained accent, progressive
  disclosure (authoring detail / audit collapsed), D6 status badges for
  `GoldItemStatus` / `DatasetRevisionStatus` / `GoldSetImportCompatibility` /
  `PERMISSION_LIMITED` (badge + icon + KO secondary label).
- The permission boundary is first-class: non-owners get a read-only surface and
  a `PERMISSION_LIMITED` state, never an optimistic write control.
- Revision immutability is unmistakable: `FROZEN`/`ARCHIVED` revisions are fully
  read-only with an immutable banner and a cut-new-revision path; only one
  `ACTIVE` revision per dataset.
- Import is honest dry-run-before-confirm: the 4-state compatibility report is
  shown first, `INCOMPATIBLE` blocks confirm, `CONFLICT` requires a strategy,
  nothing mutates until `가져오기 확정`.
- Reproducibility is visible: every run shows the revision it pinned and that the
  revision is `FROZEN`, with explicit copy that authoring never changes existing
  runs' metrics or pins.
- No copy or control implies autonomous publish, automatic policy enforcement,
  run/LLM execution, hard delete, or that editing gold data rescoring an existing
  run. Every authoring/import response surfaces the all-false
  `GoldAuthoringMutationGuard`.
