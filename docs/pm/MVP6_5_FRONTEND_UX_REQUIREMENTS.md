# MVP6.5 Governance Workflow (Ontology Change Request → Review → Approval → Audit) — Frontend UX/API Requirements

Status: `WAVE41 CONTRACT-FIRST PLANNING`
Date: 2026-07-01
Owner: Frontend / UIUX Architecture
Backlog ID: `FE6-057`~`FE6-060`

This document defines the frontend requirements for MVP6.5 **Governance workflow**:
an auditable ontology change-request lifecycle (propose → review → approve/reject
→ audit). It is **requirements only**. No runtime route, component, type, API
client, mock fixture, seed, smoke, or test is implemented in Wave41 (mirrors
Wave14/19/23/30/33/39 planning waves).

Governance is a **decision-record surface in the candidate/analysis (governance)
layer**. The load-bearing product rule: **approval records intent + audit only;
it does NOT auto-apply to the ontology definition or the published graph**
(ADR 0012). No copy, control, badge, or affordance anywhere in this surface may
imply that an approval publishes, mutates the ontology/candidate/published graph,
starts a publish/extraction/re-validation job, or enforces anything
autonomously. An `APPROVED` request is `application_state=QUEUED` — a decision of
record authorizing a future, separately-initiated, separately-audited
application slice that has not yet happened.

## Source Documents

- `AGENTS.md` (Frontend Rules)
- `.agents/skills/handoff-reporting/SKILL.md`
- `docs/handoffs/CURRENT_STATE.md`
- `docs/handoffs/wave-041/NEXT_ORDERS.md` (Frontend Agent Order)
- `docs/handoffs/wave-041/PM_REPORT.md`
- `docs/pm/MVP6_5_GOVERNANCE_BRIEF.md` (frozen PM brief, `PM6-023`)
- `docs/adr/0012-mvp6-5-governance-approval-not-auto-apply-boundary.md`
- `docs/adr/0010-lnb-project-context-information-architecture.md` (two-zone LNB IA)
- `docs/pm/UIUX_REMEDIATION_DECISIONS.md` (D1 LNB IA, D3 copy/KO titles, D4
  breadcrumb, D6 status-token badges)
- `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md` (tokens, `Section`+`HanaCard`
  module, one primary action per screen, progressive disclosure)
- `docs/pm/MVP6_4_FRONTEND_UX_REQUIREMENTS.md` (format precedent, `FE6-049`)
- Reused MVP3 review-decision UX surfaces:
  `apps/frontend/src/pages/ReviewInboxPage.tsx`,
  `apps/frontend/src/pages/ReviewWorkbenchPage.tsx` (KO decision labels +
  reason-required + read-only permission pattern),
  `apps/frontend/src/shared/layout/navigation.ts` (LNB Review group),
  `apps/frontend/src/shared/ui/platform/{Section,StatusBadge,PageState}.tsx`
- **Backend contract draft:** `docs/api/MVP6_5_GOVERNANCE_API_CONTRACT_DRAFT.md`
  (Backend `BE6-036`~`BE6-039`, parallel wave). This document was first drafted
  against the **PM brief + ADR 0012** while the Backend draft was absent, then
  **reconciled against the Backend draft once it landed**. The draft confirms
  every PM-frozen enum/DTO name **verbatim** and pre-answers the field/state gaps
  — see §"DTO / State Gap Analysis vs Backend Draft" (all Blocking gaps now
  **RESOLVED**). `docs/api/openapi-mvp6-5-draft.json` parse/additivity is for QA
  (`INT6-043`~`INT6-046`) to verify; Frontend re-confirms exact field names
  against it before Wave42.

## Backlog Coverage

| ID | Requirement output |
|---|---|
| `FE6-057` | Governance route/IA placement under the Review group (project-scoped, no ID-bound global LNB page); breadcrumb mapping |
| `FE6-058` | Screen flow + required fields per screen mapped to Backend DTOs (board / propose / detail / decision panel / audit trail) |
| `FE6-059` | First-class loading/empty/error/permission-limited states; reviewer/approver permission-boundary UX; D6 state-machine badges; approval-is-intent banner |
| `FE6-060` | DTO/field/state gap analysis vs the Backend draft; no-auto-apply copy guard |

## Scope Guard

MVP6.5 P0 is a governance decision-record surface confined to the analysis layer:

```text
select project
-> open Governance (change-request board, under the Review group)
-> propose a change request:
     title + summary + one or more change items, each naming
     target_kind (CLASS / PROPERTY / RELATION),
     change_type (ADD / MODIFY / DEPRECATE),
     the target ontology element ref (null for ADD) + ontology_version_id,
     and a proposed-change note/payload (stored as intent only)
-> submit (DRAFT -> OPEN)
-> a reviewer COMMENTs or REQUEST_CHANGES (reason -> back to OPEN)
-> an approver APPROVEs (justification) or REJECTs (reason)
     -> APPROVED: request terminal-approved AND application_state = QUEUED;
        NOTHING is applied to the ontology or the published graph
     -> REJECTED: terminal, with reason
-> open the audit trail (actor / action / reason / timestamp / target element +
     version context / before-after state)
-> confirm the "approved = queued intent, not yet applied" banner
```

The UI must NOT imply that any governance action:

- applies an approved change to the ontology definition, the candidate graph, or
  the published graph, or edits any ontology element (it only *references*
  `ontology_class_id` / `ontology_property_id` / `ontology_relation_id` +
  `ontology_version_id`);
- publishes anything, starts a publish job, or performs a rollback;
- edits prompts / prompt versions, candidates, or candidate review state;
- starts an extraction, re-validation, or re-extraction job, or calls any
  LLM/provider;
- enforces a policy automatically, or auto-applies on approval
  (`change_auto_applied` is always false);
- hard-deletes a change request or an audit entry (withdraw / terminal states
  only).

Out of scope for MVP6.5 P0 UI (P1/later, per PM §7): auto-apply, automatic
enforcement, autonomous/agent publish/rollback, impact simulation / impact
analysis reports, migration-plan or release-note generation, post-change
re-validation/re-extraction, ontology diff visualization beyond a plain
change-item summary, automatic reviewer assignment / load-balancing (manual is
P0), real LLM execution, copilot/agent runtime, connector/plugin SDK,
multi-tenant runtime. `application_state` values `APPLIED`/`SUPERSEDED` are
RESERVED for a later slice and are never produced or rendered as reachable in P0.

## Information Architecture

Governance is a **project-scoped** decision surface **contextual under the
existing `Review` group** (per ADR 0010 two-zone LNB; D1). This is the natural
home: governance sits in the review → decision → audit workflow, alongside
`Review` and `Quality`.

### Global / Project-zone LNB placement (D1 / ADR 0010)

- Do NOT add a new flat **global** LNB entry. The global zone stays
  `Dashboard` / `Projects` / `Admin` only.
- Add exactly one **project-zone** LNB item, **`Governance`**, as the third item
  in the existing **Review** group, after `Review` and `Quality`:

  ```text
  REVIEW
  ├─ Review        → /projects/:p/review
  ├─ Quality       → /projects/:p/quality
  └─ Governance    → /projects/:p/governance        (NEW — MVP6.5)
  ```

  This is a top-level project work area (a list/board destination), so it is a
  legitimate LNB item — unlike an ID-bound detail. It is the single new LNB entry
  this theme adds. Rationale for a first-class item (vs burying it under Review
  like MVP6.4 buried Gold Set under Evaluation): a change-request board is its
  own persistent work queue with its own inbox/board semantics, not a sub-view of
  the candidate-review workbench, and the PM brief + ADR 0012 both name it "under
  the Review group." If the commander prefers zero new LNB items, the fallback is
  a `거버넌스` entry action from the Review inbox landing; the primary
  recommendation is the dedicated Review-group item above.
- ID-bound detail routes (change-request-by-id) stay **contextual** — reached
  from board rows / breadcrumbs, never as an LNB item (ADR 0010 Note C).
- Active-LNB derivation (extends D1 §1.6): `Governance` active when
  `path contains /governance`. Resolve after the `Review` test so `/review` does
  not shadow it (they are distinct segments; no overlap).

### Routes (project-scoped; only the board is a destination)

`:p` = selected `projectId`. Board is the destination; detail/propose are
contextual.

| Route | Purpose | LNB active |
|---|---|---|
| `/projects/:p/governance` | Change-request board/list (grouped by state) — LNB destination | `Governance` |
| `/projects/:p/governance/new` | Propose a change request (contextual, reached from board primary action) | `Governance` |
| `/projects/:p/governance/:changeRequestId` | Change-request detail (change items + review thread + decision panel + audit trail) | `Governance` |

The detail's audit trail and decision panel are **panels within the detail
route**, not separate routes (progressive disclosure). No further ID-bound routes
are added.

- If no project is selected, the entry resolves to the global zone + the muted
  `프로젝트를 선택하면 작업 메뉴가 표시됩니다` hint (D1 §1.4); no auto-redirect.
- If the project has no change requests yet, resolve to the empty state
  (see State Requirements).

### Breadcrumbs (reuse `Breadcrumbs`; D4)

The section segment is the English `Governance` LNB label so active LNB item ==
breadcrumb section (D4 §4.1).

| Route | Breadcrumb |
|---|---|
| `/projects/:p/governance` | `프로젝트명 > Governance` |
| `/projects/:p/governance/new` | `프로젝트명 > Governance > 새 변경 요청` |
| `/projects/:p/governance/:changeRequestId` | `프로젝트명 > Governance > 변경 요청 #<id>` |

### Page structure (Design language: `Section`+`HanaCard`, KO title, one primary action)

Apply the closed design language (`DESIGN_DIRECTION_REFERENCE_UPGRADE.md`):
KO page title (`거버넌스`), `Section`+`HanaCard` module, restrained single accent,
**exactly one primary action per screen**, progressive disclosure (review thread /
audit trail collapsed under the summary), outcome-first KO microcopy.

```text
Project context header + breadcrumbs (KO title: 거버넌스)
-> Approval-is-intent banner Section (persistent, info tone: "승인은 큐잉된
   의도만 기록하며, 온톨로지·게시 그래프에 자동 적용되지 않습니다.")
-> Board Section (change-request rows grouped/filterable by
   OntologyChangeRequestStatus; one primary action: 변경 요청 생성)
-> [detail route] Request summary Section (title/summary + status badge +
   application_state badge + proposer/reviewer + counts)
   -> Permission band (proposer / reviewer / approver / read-only — first-class)
   -> Change items Section (target_kind × change_type + element ref + version)
   -> Review thread Section (comments / request-changes, collapsed detail)
   -> Decision panel Section (reviewer + approver actions; reason-required;
      one primary action by role)
   -> Audit trail Section (collapsed; full lifecycle, newest-first)
```

## Screen Flow and UX Surfaces

### 1. Governance Board (change-request list, grouped by state)

Purpose: the project's change-request work queue. Maps to a change-request
list/board response.

Required content:

- Project context echo: `project_id`, project name.
- One row per change request: `id`, `title`, `status`
  (`OntologyChangeRequestStatus`), `application_state`
  (`GovernanceApplicationState`), `proposer` (actor id + role), change-item
  count, `ontology_version_id` context, `created_at`, `updated_at`, and (if
  provided) the current reviewer/approver.
- Rows grouped or filterable by `OntologyChangeRequestStatus`
  (`DRAFT` / `OPEN` / `IN_REVIEW` / `APPROVED` / `REJECTED` / `WITHDRAWN`). D6
  badge on every status (see §"State-Machine Badges").
- An `application_state` badge is shown for `APPROVED` rows (`QUEUED`) so the
  "approved = queued, not applied" fact is visible at the board level, not only
  in detail.

Required interactions:

- One primary action: `변경 요청 생성` (→ `/projects/:p/governance/new`),
  available to any project member.
- Per-row: open detail (contextual navigation). Filter/sort by state are
  secondary controls, not primary.

Copy guard: row/action labels never say `게시`(publish), `적용`(apply),
`실행`(run), or `삭제`(delete). Terminal states read as `승인됨(큐잉)` /
`반려됨` / `철회됨`, never `적용됨`.

### 2. Propose Change Request (`/governance/new`)

Purpose: author a change request with one or more change items. Maps to the
change-request create request + change-item shape.

Required content — request-level fields:

- editable: `title` (required), `summary` (required), one or more change items.
- read-only / system: `project_id`, `proposer` (current actor), initial
  `status=DRAFT`, `application_state=NOT_APPLICABLE`.

Required content — per change item (repeatable list):

- `target_kind` (`ChangeRequestTargetKind`: `CLASS` / `PROPERTY` / `RELATION`) — required.
- `change_type` (`ChangeRequestChangeType`: `ADD` / `MODIFY` / `DEPRECATE`) — required.
- target element ref — `ontology_class_id` / `ontology_property_id` /
  `ontology_relation_id` selected via a picker over the **existing project
  ontology version** (reference only; the picker never edits the ontology).
  **Required for `MODIFY` / `DEPRECATE`; MUST be null/absent for `ADD`** (the UI
  hides/disables the element picker when `change_type=ADD` and shows a
  name/definition intent field instead).
- `ontology_version_id` — captured as version context for every item.
- `proposed_change` — a note/payload field, stored as **intent only** (free-form
  or structured per Backend draft). Helper copy: `제안 내용은 의도로만 저장되며
  온톨로지에 적용되지 않습니다.`

Required interactions:

- The form is editable while `status` ∈ {`DRAFT`, `OPEN`} (proposer only). Saving
  a draft keeps `DRAFT`.
- One primary action: `제출` (submit → `DRAFT`→`OPEN`). `임시저장`(save draft)
  and `요청 철회`(withdraw) are secondary. Submit makes the request visible for
  review.
- Validation surfaces per item: `ADD` with a non-null element ref is a client
  error; `MODIFY`/`DEPRECATE` without an element ref is a client error.
- On submit, surface the mutation-guard reassurance quietly: `이 요청은 제안
  기록이며 온톨로지·게시 그래프를 변경하지 않습니다.`

Copy guard: the primary action is `제출`, never `적용`/`게시`.

### 3. Change-Request Detail (items + review thread + decision panel + audit)

Purpose: the single working surface for review and decision. Maps to the
change-request detail response + review thread + audit list.

#### 3.1 Request summary Section

- `id`, `title`, `summary`, `status` badge, `application_state` badge, `proposer`
  (id + role), current reviewer/approver if any, `ontology_version_id` context,
  `created_at`, `updated_at`.
- The persistent **approval-is-intent banner** (see §5) is rendered here as well
  as on the board.

#### 3.2 Change items Section

- For each item: `target_kind`, `change_type`, resolved target ontology element
  (name/label rendered read-only from the referenced element),
  `ontology_class_id`/`ontology_property_id`/`ontology_relation_id` (secondary,
  id shown small), `ontology_version_id`, and the `proposed_change` intent
  note/payload.
- Element context is **read-only rendering** — the referenced ontology element is
  shown for context, never edited. `DEPRECATE` reads as "폐기 제안" and must NOT
  render as if the element is already `ARCHIVED`/`DELETED` (`OntologyElementStatus`
  is never set by governance).

#### 3.3 Review thread Section (collapsed detail; reuse MVP3 pattern)

- Chronological thread of `COMMENT` and `REQUEST_CHANGES` entries: actor + role,
  action, reason/note, timestamp. Reuse the `ReviewWorkbenchPage` decision-history
  reading pattern.
- Collapsed by default under the summary (progressive disclosure); expandable.

#### 3.4 Decision panel Section (reviewer + approver actions)

This is the governance analogue of the MVP3 review-decision panel
(`ReviewWorkbenchPage`), reusing its KO decision labels + reason-required +
read-only-permission pattern. `GovernanceReviewAction`:

| Action (`GovernanceReviewAction`) | KO label | Reason | Allowed role | State effect |
|---|---|---|---|---|
| `COMMENT` | `의견 추가` | optional | `REVIEWER`+ | no state change (OPEN→IN_REVIEW on first reviewer touch) |
| `REQUEST_CHANGES` | `변경 요청` | **required** | `REVIEWER`+ | `IN_REVIEW`/`OPEN` → `OPEN` |
| `APPROVE` | `승인` | **required (justification)** | `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`, and **approver ≠ proposer** | → `APPROVED`, `application_state`→`QUEUED` |
| `REJECT` | `반려` | **required** | `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN` | → `REJECTED` |

Proposer-only actions (not in `GovernanceReviewAction`, shown when the actor is
the proposer): `제출`(submit, `DRAFT`→`OPEN`) and `요청 철회`(withdraw,
reason optional, → `WITHDRAWN` from `DRAFT`/`OPEN`/`IN_REVIEW`).

Required interactions:

- **One primary action per screen, by role/state** (D4/P4):
  - proposer on a `DRAFT`/`OPEN` request → primary `제출` (or `변경 반영 후
    제출` when returned by `REQUEST_CHANGES`);
  - approver on an `OPEN`/`IN_REVIEW` request → primary `승인`; `반려` and
    `변경 요청`/`의견 추가` secondary;
  - reviewer (non-approver) → primary `변경 요청`; `의견 추가` secondary;
  - read-only actor → no primary decision action (see permission band).
- A single shared reason/justification input drives the reason-required rule:
  `REQUEST_CHANGES`/`APPROVE`/`REJECT` disable their button until a non-empty
  reason is entered (mirror `ReviewWorkbenchPage` `requiresReason` gating).
  `COMMENT`/`WITHDRAW` allow empty reason.
- **`APPROVE` disabled for the proposer** with copy `본인이 제안한 요청은 승인할
  수 없습니다 (직무 분리).` (segregation of duties, before submit — not just a
  server 403).
- Any decision against a terminal/wrong-state request degrades to a
  non-destructive conflict notice (`409 CHANGE_REQUEST_STATE_CONFLICT`),
  never a silent overwrite; offer refresh.
- On `APPROVE` success, the UI shows the QUEUED confirmation + the persistent
  banner; it MUST NOT show any "applied"/"published"/"apply now" affordance.
- Every decision response surfaces the all-false `GovernanceMutationGuard`
  (7 flags) — the UI may render a quiet, collapsed proof line
  (`이 결정은 온톨로지·후보·게시 그래프·프롬프트를 변경하지 않았습니다`).

#### 3.5 Audit trail Section (collapsed; full lifecycle)

Purpose: prove every decision is audited. Maps to the governance audit-log GET.

- Newest-first list; each entry: actor id + role, `action`
  (`GovernanceAuditAction`), reason/note where present, target change-request id +
  change-item ids, target ontology element(s) + `ontology_version_id` context,
  **before/after request state**, timestamp.
- `GovernanceAuditAction` values to render (D6-style plain labels, EN token +
  KO gloss): `CHANGE_REQUEST_CREATED` (생성), `CHANGE_REQUEST_UPDATED` (수정),
  `CHANGE_REQUEST_SUBMITTED` (제출), `CHANGE_REQUEST_WITHDRAWN` (철회),
  `REVIEW_STARTED` (검토 시작), `COMMENT_ADDED` (의견 추가),
  `CHANGES_REQUESTED` (변경 요청), `CHANGE_REQUEST_APPROVED` (승인),
  `CHANGE_REQUEST_REJECTED` (반려).
- Read-only. No hard-delete affordance (audit entries are immutable).

## Permission Boundary UX (reviewer / approver segregation of duties)

The permission boundary is first-class, not an afterthought. Four actor modes,
rendered from an up-front capability hint (see gap analysis #1), never guessed
from a 403:

| Actor mode | Sees | Can do |
|---|---|---|
| **Proposer** (any project member on own request) | full detail | create/edit while `DRAFT`/`OPEN`; `제출`; `요청 철회`; comment. **Cannot `승인` own request.** |
| **Reviewer** (`REVIEWER`+) | full detail | `의견 추가`, `변경 요청` (reason). Not `승인`/`반려` unless also an approver role. |
| **Approver** (`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`, not the proposer) | full detail | `승인`(justification), `반려`(reason), plus review actions. |
| **Read-only** (`VIEWER`/`DATA_MANAGER`/`EXTRACTION_MANAGER`/`API_CLIENT`, or any non-permitted actor) | board, detail, items, review thread, audit trail | read only |

- Non-permitted actors see the entire Governance surface **read-only**: board,
  detail, change items, review thread, and audit trail are visible; every
  decision control is absent or disabled with a `PERMISSION_LIMITED` badge
  (D6: warning tone, `Lock` icon, KO label `권한 제한`) and copy
  `승인·반려는 온톨로지 관리자·프로젝트 관리자·시스템 관리자만 가능합니다.`
- The proposer's own-request `승인` is disabled up front with the
  segregation-of-duties copy (not an optimistic control that fails on submit).
- The UI never optimistically shows a write/decision control then fails on
  submit. A server `403 PERMISSION_DENIED` degrades to the permission-limited
  state; a `409 CHANGE_REQUEST_STATE_CONFLICT` degrades to the conflict notice —
  neither is a full-page crash.

## State-Machine Badges (D6)

Every `OntologyChangeRequestStatus` and `GovernanceApplicationState` renders as a
D6 badge (`[icon] TOKEN · 한국어보조라벨`, EN token kept, KO gloss added). Tokens
below extend the D6 §6.3 table with the same rule; several reuse existing D6 rows
verbatim (`DRAFT`, `APPROVED`, `REJECTED`).

### `OntologyChangeRequestStatus`

| Token | Tone | Icon (lucide) | KO secondary label |
|---|---|---|---|
| `DRAFT` | info | `PencilLine` | 초안 (reuse D6) |
| `OPEN` | info | `Inbox` | 검토 대기 |
| `IN_REVIEW` | info | `Loader` | 검토 중 |
| `APPROVED` | success | `CheckCircle2` | 승인됨 (reuse D6) |
| `REJECTED` | danger | `XCircle` | 반려됨 (reuse D6) |
| `WITHDRAWN` | neutral | `Undo2` | 철회됨 |

### `GovernanceApplicationState`

| Token | Tone | Icon (lucide) | KO secondary label |
|---|---|---|---|
| `NOT_APPLICABLE` | neutral | `Ban` | 해당 없음 (reuse D6 `NOT_APPLICABLE`) |
| `QUEUED` | warning | `Clock` | 큐잉됨 (미적용) |
| `APPLIED` | — | — | **RESERVED — never rendered in P0** |
| `SUPERSEDED` | — | — | **RESERVED — never rendered in P0** |

The `QUEUED` badge deliberately uses a **warning** tone (not success) so
"approved" never visually reads as "done/applied"; the KO gloss `큐잉됨 (미적용)`
states it plainly. `APPLIED`/`SUPERSEDED` are reserved literals — if the Backend
ever returns them in P0 that is a contract violation; the UI renders them as an
unexpected-state notice rather than a success state.

## Approval-Is-Intent Banner (load-bearing, first-class)

A persistent banner (info tone `Section`, `Info` icon) on both the board and the
detail whenever an approved/queued request is in view:

- Headline: `승인은 큐잉된 의도이며, 아직 적용되지 않았습니다.`
- Body: `승인된 변경 요청은 감사 가능한 결정 기록으로 큐잉(QUEUED)됩니다. 온톨로지
  정의와 게시 그래프는 변경되지 않으며, 실제 적용은 이후 별도의 사람이 개시하는
  단계에서 감사와 함께 이뤄집니다.`
- Surfaces the `application_state` value explicitly next to the `status` badge.
- No CTA inside the banner suggests applying/publishing now (no `적용`/`게시`
  button anywhere in P0).

## State Requirements (first-class)

| State | Required behavior |
|---|---|
| Loading | Staged skeletons for the board, request summary, change items, review thread, and audit trail. Never render empty badges or `0` counts before data arrives. |
| Empty — no project selected | Resolve to the selected-project-required state (D1 §1.4 hint). No auto-redirect. |
| Empty — no change requests | `이 프로젝트에는 아직 변경 요청이 없습니다.` Offer the `변경 요청 생성` primary action (any project member). |
| Empty — no review activity | Detail with no thread entries: `아직 검토 활동이 없습니다.` Show the decision panel per the actor's permission. |
| Empty — no audit entries | (Should not happen after create; defensive) `감사 기록이 없습니다.` |
| Error | Preserve project + request context; show retry; distinguish "a change request is unavailable" (per-row / per-panel notice) from "server/API failure" (surface-level). A missing request degrades to a notice, not a crash. |
| Permission-limited | Read surfaces stay visible; decision controls show `PERMISSION_LIMITED` and state the required approver role. Proposer's own-request `승인` disabled with segregation-of-duties copy. Never expose a decision affordance to a non-permitted actor. |
| Conflict (409) | A decision against a terminal/wrong-state request (`CHANGE_REQUEST_STATE_CONFLICT`) shows a non-destructive conflict notice + refresh, never a silent overwrite. |
| Approval / queued | On `APPROVE` success, show the QUEUED confirmation + persistent banner; render `application_state=QUEUED`; expose NO apply/publish affordance. |
| Reason-required | `REQUEST_CHANGES`/`APPROVE`/`REJECT` buttons disabled until a non-empty reason/justification is entered; `COMMENT`/`WITHDRAW` allow empty. |

## Backend Contract Fields (Frontend-required)

Naming convention (matching MVP6.1–6.4): DTO/schema names PascalCase, JSON fields
snake_case, enum literals UPPER_SNAKE_CASE. `Blocking` = needed for P0 UX
correctness + QA acceptance. `Optional` = usability, deferrable. Names below are
the **PM-frozen** names; Frontend must reconcile the exact field names against the
Backend draft (`BE6-036`~`BE6-039`) once it lands.

### Reused shapes (must NOT be renamed)

- `Role` (`SYSTEM_ADMIN`/`PROJECT_ADMIN`/`ONTOLOGY_MANAGER`/`DATA_MANAGER`/
  `EXTRACTION_MANAGER`/`REVIEWER`/`VIEWER`/`API_CLIENT`) — reused verbatim for
  RBAC gating; no new role literal.
- `ReviewDecisionType` literals (`APPROVE`/`REJECT`/`REQUEST_CHANGES`) — reused as
  the overlapping `GovernanceReviewAction` literals; `MODIFY_AND_APPROVE`
  intentionally excluded.
- Ontology element refs (`ontology_class_id` / `ontology_property_id` /
  `ontology_relation_id`, `ontology_version_id`) and `OntologyElementStatus` —
  READ-ONLY reference targets, never written by governance.
- MVP3/MVP5 audit record shape — reused by reference for governance audit
  entries.

### New enums (Frontend needs the exact literals — PM-frozen)

- `OntologyChangeRequestStatus`: `DRAFT`, `OPEN`, `IN_REVIEW`, `APPROVED`,
  `REJECTED`, `WITHDRAWN`.
- `GovernanceApplicationState`: `NOT_APPLICABLE`, `QUEUED` (P0);
  `APPLIED`, `SUPERSEDED` (RESERVED, not produced in P0).
- `GovernanceReviewAction`: `COMMENT`, `REQUEST_CHANGES`, `APPROVE`, `REJECT`.
- `ChangeRequestTargetKind`: `CLASS`, `PROPERTY`, `RELATION`.
- `ChangeRequestChangeType`: `ADD`, `MODIFY`, `DEPRECATE`.
- `GovernanceAuditAction`: `CHANGE_REQUEST_CREATED`, `CHANGE_REQUEST_UPDATED`,
  `CHANGE_REQUEST_SUBMITTED`, `CHANGE_REQUEST_WITHDRAWN`, `REVIEW_STARTED`,
  `COMMENT_ADDED`, `CHANGES_REQUESTED`, `CHANGE_REQUEST_APPROVED`,
  `CHANGE_REQUEST_REJECTED`.

### New DTOs (Blocking unless noted)

Confirmed against the Backend draft (verbatim field names):

- `OntologyChangeRequest`: `id`, `project_id`, `title`, `summary`, `status`
  (`OntologyChangeRequestStatus`), `application_state`
  (`GovernanceApplicationState`), `proposer_id`, `item_count`,
  `ontology_version_id`, `created_at`, `updated_at`. (Required: `id`,
  `project_id`, `title`, `status`, `application_state`, `proposer_id`,
  `item_count`, `created_at`.)
- `OntologyChangeRequestDetail` (get response): wraps `change_request`
  (`OntologyChangeRequest`) + `items[]` (`OntologyChangeItem`) + review thread +
  latest decision + `capabilities` (`GovernanceCapabilities`) + the
  `GovernanceMutationGuard`.
- `OntologyChangeItem`: `id`, `target_kind` (`ChangeRequestTargetKind`),
  `change_type` (`ChangeRequestChangeType`), target element ref
  (`ontology_class_id`/`ontology_property_id`/`ontology_relation_id`, null for
  `ADD`), `ontology_version_id`, `proposed_change` (**opaque intent object** —
  gap #4 resolved).
- Create request (proposer): `title` + `summary` + change items → `DRAFT`.
  Update-while-`DRAFT`/`OPEN` is `PATCH` (title/summary); change items are
  managed via a **separate items endpoint family** (`POST`/`PATCH`/`DELETE`
  `.../items[/{item_id}]`), not inline on the request — the propose form drives
  both, but they are distinct calls.
- Submit / withdraw (proposer): withdraw carries optional reason.
- Review action request: `action` (`GovernanceReviewAction`) + `reason`/`note`
  (`reason` **required** for `REQUEST_CHANGES`/`APPROVE`/`REJECT` →
  `422 REASON_REQUIRED`; optional for `COMMENT`). The review response echoes
  `resulting_status` + `resulting_application_state` (`QUEUED` only on `APPROVE`).
- Governance audit entry: `actor_id` + role, `action` (`GovernanceAuditAction`),
  reason/note, target change-request id + change-item ids, target ontology
  element(s) + `ontology_version_id`, `before_status`/after status, timestamp.
- `GovernanceMutationGuard` (all-false, 7 flags, on every write response):
  `ontology_definition_mutated`, `published_graph_mutated`,
  `candidate_graph_mutated`, `prompt_version_mutated`, `publish_job_started`,
  `extraction_job_started`, `change_auto_applied`.
- `GovernanceCapabilities` (display-only hint on every list/get/write response):
  `can_view`, `can_edit_request`, `can_submit`, `can_withdraw`, `can_comment`,
  `can_request_changes`, `can_approve`, `can_reject`. The UI renders
  proposer/reviewer/approver/read-only surfaces + the proposer-cannot-approve
  rule from this hint up front. `403 SELF_APPROVAL_FORBIDDEN` (approve) /
  `403 PERMISSION_DENIED` (other) are the server backstops.

## DTO / State Gap Analysis vs Backend Draft

This document was first drafted against the PM brief / ADR 0012 while the Backend
draft was absent (parallel wave), then **reconciled against
`docs/api/MVP6_5_GOVERNANCE_API_CONTRACT_DRAFT.md` once it landed**. The draft
confirms every PM-frozen enum/DTO name **verbatim** and **resolves all Blocking
gaps**. Remaining items are Optional/QA-facing.

### Resolved by the Backend draft (verified — no Frontend blocker)

| # | Item | What the draft settled |
|---|---|---|
| 1 | **Capability hint — RESOLVED** | `GovernanceCapabilities` (`can_view`/`can_edit_request`/`can_submit`/`can_withdraw`/`can_comment`/`can_request_changes`/`can_approve`/`can_reject`) is a display-only hint on every list/get/write response. `403 PERMISSION_DENIED` (permission), `403 SELF_APPROVAL_FORBIDDEN` (proposer approving own), `409 CHANGE_REQUEST_STATE_CONFLICT` (state). The UI renders all four actor modes up front. Note field name is `can_edit_request` (not `can_edit`). |
| 2 | **`application_state` — RESOLVED** | First-class field on `OntologyChangeRequest` + echoed as `resulting_application_state` on the review response; `QUEUED` iff `APPROVED`, else `NOT_APPLICABLE`. `APPLIED`/`SUPERSEDED` reserved, never produced in P0. |
| 3 | **Change-item element ref — RESOLVED** | `target_kind` selects the ref field (`ontology_class_id`/`ontology_property_id`/`ontology_relation_id`, null for `ADD`) + `ontology_version_id` context; enough to resolve the element for read-only display. |
| 4 | **`proposed_change` shape — RESOLVED** | Opaque intent object stored as-is; the propose form treats it as an intent payload and never applies it. |
| 5 | **`GovernanceMutationGuard` keys — RESOLVED** | 7 keys verbatim per ADR 0012; the proof line + QA all-false assertion are wired. |
| 6 | **OPEN→IN_REVIEW auto-advance — RESOLVED** | A reviewer `COMMENT` on an `OPEN` request auto-advances it to `IN_REVIEW` (`REVIEW_STARTED`). The UI renders the returned `status` honestly, not predicted. |
| 7 | **`approve` reason vs `application_note` — RESOLVED** | `APPROVE` uses the single required `reason`/justification; no distinct `application_note` in P0. The decision panel uses one reason input. |
| 8 | **Change-item management — RESOLVED** | Items are a separate endpoint family (`POST`/`PATCH`/`DELETE` `.../items[/{item_id}]`), not inline on the request; the propose form issues distinct calls. |

### Remaining items to confirm at Wave42 (non-blocking)

| # | Item | Rank | What Frontend needs |
|---|---|---|---|
| 9 | **Audit list ordering / pagination** | Optional | Confirm newest-first order + pagination for the (collapsed) audit-trail panel. |
| 10 | **Board list filtering / pagination** | Optional | Draft supports filter by `status`/`application_state`/proposer; confirm pagination vs full-list client grouping for the board. |
| 11 | **Reviewer/approver identity on the board row** | Optional | `OntologyChangeRequest` exposes `proposer_id` + `item_count` but not an explicit current-reviewer field; confirm whether the board's reviewer column derives from the review thread / latest decision or needs an added field. |
| 12 | **QA — OpenAPI artifact** | QA | `docs/api/openapi-mvp6-5-draft.json` parse + additivity/disjointness to MVP1–MVP6.4 paths is for QA (`INT6-043`~`INT6-046`); Frontend re-confirms exact field names against it before Wave42. |

No **rename** of any existing MVP3 `ReviewDecisionType` / `Role` /
`AuditEventType` / ontology-element field is requested — those are reused
verbatim. Any rename by Backend would be a breaking mismatch and a blocker. All
new governance objects/enums must be **additive** and must not break MVP1–MVP6.4
paths, enums, or smokes.

## Frontend Acceptance Notes

- Project-scoped only; Governance is a single new LNB item in the **Review** group
  (`/projects/:p/governance`); its detail (change-request-by-id) is contextual and
  never an LNB item (ADR 0010). Active LNB item is `Governance`.
- Design language applied: KO page title `거버넌스`, `Section`+`HanaCard` module,
  one primary action per screen (board `변경 요청 생성`; propose `제출`; detail
  primary by role/state), restrained accent, progressive disclosure (review thread
  + audit trail collapsed), D6 status badges for `OntologyChangeRequestStatus` /
  `GovernanceApplicationState` (badge + icon + KO secondary label).
- The permission boundary is first-class: four actor modes rendered from a
  capability hint up front; non-permitted actors get a read-only surface +
  `PERMISSION_LIMITED`; the proposer's own-request `승인` is disabled with
  segregation-of-duties copy; never an optimistic write control.
- Reason rules enforced client-side: `REQUEST_CHANGES`/`APPROVE`/`REJECT` require a
  non-empty reason; `COMMENT`/`WITHDRAW` optional.
- The approval-is-intent boundary is unmistakable: a persistent banner on board +
  detail, `application_state=QUEUED` shown with a **warning**-toned `큐잉됨 (미적용)`
  badge, and NO apply/publish affordance anywhere. `APPLIED`/`SUPERSEDED` reserved,
  never rendered as reachable in P0.
- No copy or control implies autonomous publish, automatic policy enforcement,
  ontology/candidate/published-graph mutation, publish/extraction job start,
  rollback, run/LLM execution, or hard delete. Every governance write response
  surfaces the all-false `GovernanceMutationGuard`.
