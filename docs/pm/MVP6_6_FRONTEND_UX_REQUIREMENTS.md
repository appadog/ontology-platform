# MVP6.6 Governance Change Application (APPROVED+QUEUED → APPLIED into a DRAFT ontology version) — Frontend UX/API Requirements

Status: `WAVE43 CONTRACT-FIRST PLANNING`
Date: 2026-07-02
Owner: Frontend / UIUX Architecture
Backlog ID: `FE6-065`~`FE6-068`

This document defines the frontend requirements for MVP6.6 **Governance change
application**: the human-initiated apply of an `APPROVED` + `application_state=QUEUED`
ontology change request onto a **DRAFT ontology version** (`QUEUED → APPLIED`),
with a read-only pre-check, an explicit human-confirmation step, staleness
handling (`QUEUED → SUPERSEDED`), idempotency notices, and an application audit.
It is **requirements only**. No runtime route, component, type, API client, mock
fixture, seed, smoke, or test is implemented in Wave43 (mirrors
Wave14/19/23/30/33/39/41 planning waves). Runtime waits for Wave44.

MVP6.6 is the FIRST governance operation that mutates ontology state, so the
load-bearing product rule is the boundary itself (ADR 0013): **application ≠
publish, and apply writes ONLY to a DRAFT ontology version.** Apply never touches
the published graph, the candidate graph, prompts, extraction, or evaluation; it
never starts a publish job; there is no auto-apply (approval never triggers
apply); publishing the applied draft stays the separate, separately-audited MVP3
publish path performed as a later human step. Every affordance, badge, and copy
string in this surface must make that unmistakable.

## Source Documents

- `AGENTS.md` (Frontend Rules)
- `.agents/skills/handoff-reporting/SKILL.md`
- `docs/handoffs/CURRENT_STATE.md`
- `docs/handoffs/wave-043/NEXT_ORDERS.md` (Frontend Agent Order + Non-negotiable boundary)
- `docs/handoffs/wave-043/PM_REPORT.md`
- `docs/pm/MVP6_6_GOVERNANCE_APPLICATION_BRIEF.md` (frozen PM brief, `PM6-025`)
- `docs/adr/0013-mvp6-6-governance-application-draft-only-human-initiated-boundary.md` (the authority)
- `docs/adr/0012-mvp6-5-governance-approval-not-auto-apply-boundary.md`
- `docs/adr/0010-lnb-project-context-information-architecture.md` (two-zone LNB IA)
- `docs/pm/UIUX_REMEDIATION_DECISIONS.md` (D1 LNB IA, D3 copy/KO titles, D4 breadcrumb, D6 status-token badges)
- `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md` (tokens, `Section`+`HanaCard` module, one primary action per screen, progressive disclosure)
- `docs/pm/MVP6_5_FRONTEND_UX_REQUIREMENTS.md` (format precedent + the surface this extends, `FE6-057`~`FE6-060`)
- **The existing MVP6.5 Governance UI this extends (shipped, not just planned):**
  - `apps/frontend/src/pages/GovernanceDetailPage.tsx` (the detail surface the apply action lives inside)
  - `apps/frontend/src/pages/GovernanceBoardPage.tsx`, `GovernanceProposePage.tsx`
  - `apps/frontend/src/pages/governanceShared.tsx` (`ChangeRequestStatusBadge`, `ApplicationStateBadge`, `ApprovalIntentBanner`, KO label maps, `formatGovernanceDate`)
  - `apps/frontend/src/shared/ui/platform/{Section,StatusBadge,PageState}.tsx`
  - `apps/frontend/src/shared/api/types.ts` (governance DTOs/enums, lines ~2935–3130)
- **Backend contract draft:** `docs/api/MVP6_6_GOVERNANCE_APPLICATION_API_CONTRACT_DRAFT.md`
  + `docs/api/openapi-mvp6-6-draft.json` — **NOT YET PRESENT at the time of writing
  (Backend `BE6-044`~`BE6-047` runs in parallel).** This document was drafted
  against the **PM brief + ADR 0013**; every enum/field name below is the
  **PM/ADR-frozen** name. See §"DTO / State Gap Analysis" — all gaps are marked
  `AWAITING-BACKEND` and MUST be reconciled against the Backend draft before
  Wave44. This is the one open dependency.

## Backlog Coverage

| ID | Requirement output |
|---|---|
| `FE6-065` | Apply action placement inside the existing Governance detail (contextual, no new LNB item; visible only for `APPROVED`+`QUEUED`, permitted roles); human-confirmation step |
| `FE6-066` | Read-only application-status pre-check panel (target DRAFT version + per-item before/after + staleness/would-supersede hint) |
| `FE6-067` | States: `APPLIED` D6 badge; staleness/`SUPERSEDED` 409 conflict UX; idempotency 409 notices; applied-not-published banner; application-audit view; one-true-flag mutation-guard proof line; loading/empty/error/permission-limited states |
| `FE6-068` | DTO/field/state gap analysis vs the Backend draft; application-≠-publish copy guard |

## Scope Guard

MVP6.6 P0 adds exactly one mutating action to the governance surface:
**apply an APPROVED+QUEUED request to a DRAFT ontology version.**

```text
select project
-> open Governance -> open an APPROVED change request (application_state = QUEUED)
-> (read-only) application-status pre-check panel: target DRAFT version +
     per-item before/after preview + a staleness/would-supersede hint
-> a permitted role (ONTOLOGY_MANAGER / PROJECT_ADMIN / SYSTEM_ADMIN) presses the
     single primary action "초안에 적용" (Apply to draft)
-> explicit human-confirmation step (modal): restates draft-only + not-published,
     requires an intentional confirm; cancel is non-destructive
-> apply executes items against a DRAFT ontology version (ADD=create /
     MODIFY=update / DEPRECATE=archive), application_state -> APPLIED
-> "applied to DRAFT ontology, NOT published — publish separately" banner
-> application audit: actor + timestamp + source request/items + resulting DRAFT
     version id + per-item before/after element refs
-> (idempotency) re-apply -> 409 notice, nothing applied
-> (staleness) if the draft target changed since approval -> 409, nothing applied,
     application_state -> SUPERSEDED
```

The UI must NOT imply that apply, or any control on this surface:

- publishes anything, starts/queues a publish job, promotes to the published
  graph, or performs a rollback — **publish is a separate MVP3 step, never here**;
- mutates the candidate graph, prompts/prompt versions, or starts an extraction /
  re-validation / re-extraction / evaluation job;
- auto-applies, auto-publishes, or enforces anything on approval or on a timer
  (apply is **human-initiated only**, behind an explicit confirmation);
- applies to a `PUBLISHED`/`ARCHIVED` ontology version (apply targets a DRAFT
  version only; apply does not itself cut a new version);
- double-applies an already-`APPLIED` request, or applies a non-`APPROVED`/non-`QUEUED`
  request;
- silently overwrites on staleness (staleness blocks and transitions to
  `SUPERSEDED`; it never merges or overwrites);
- hard-deletes a change request or an audit entry.

Out of scope for MVP6.6 P0 UI (P1/later, per PM §6 / ADR 0013): publishing the
applied draft, auto-apply/auto-publish, automatic enforcement, autonomous/agent
apply, rollback/undo, impact simulation / impact-analysis reports, migration-plan
or release-note generation, post-apply re-validation/re-extraction, bulk/batch
multi-request apply, conflict auto-merge, ontology diff visualization beyond a
per-item before/after summary, real LLM execution, copilot/agent runtime,
connector/plugin SDK, multi-tenant runtime. `SUPERSEDED` is terminal for
application (a superseded request must be re-proposed/re-approved to apply again).

## Information Architecture (no new LNB item; contextual to the existing detail)

MVP6.6 adds **no new route and no new LNB entry.** The apply action, the
application-status pre-check, the applied-not-published banner, and the
application audit are all **contextual panels within the existing MVP6.5
change-request detail route** — `/projects/:p/governance/:changeRequestId`
(`GovernanceDetailPage.tsx`). This is the natural and only home: application acts
on one specific change request, so it belongs on that request's working surface,
reached from board rows / breadcrumbs, never as an ID-bound LNB item (ADR 0010
Note C).

- LNB unchanged: `Governance` stays the single project-zone item in the Review
  group at `/projects/:p/governance`; active-LNB derivation unchanged.
- Routes unchanged: board `/projects/:p/governance`, propose `/governance/new`,
  detail `/governance/:changeRequestId`. No `/apply` route is added — apply is a
  `POST` action fired from the detail, and the pre-check + audit are reads
  rendered as panels within the detail (progressive disclosure), not routes.
- Breadcrumbs unchanged (`프로젝트명 > Governance > 변경 요청 #<id>`).

### Where apply sits inside the detail (extends the MVP6.5 `SectionStack`)

The MVP6.5 detail renders, in order: breadcrumbs → `PageHeader` (status +
application-state badges) → `ApprovalIntentBanner` → notice/conflict bands →
`PermissionBand` → `요청 요약` → 변경 항목 → 검토 스레드 → 결정(decision panel)
→ 감사 추적. MVP6.6 inserts an **application block** that appears **only when
`status==APPROVED`** — placed after the request summary and before/instead of the
review decision panel (the decision panel is inert once APPROVED). The block is:

```text
[detail, status==APPROVED only]
Request summary Section (unchanged; now shows the APPLIED badge once applied)
-> Application-status pre-check Section (read-only: target DRAFT version +
     per-item before/after + staleness/would-supersede hint)   [FE6-066]
-> Apply action Section (one primary action 초안에 적용; permitted roles only;
     opens the human-confirmation modal)                        [FE6-065]
   -> [on QUEUED]   primary enabled (unless stale-hinted -> see conflict UX)
   -> [on APPLIED]  action replaced by the applied-not-published banner + a
                    disabled/absent apply control (idempotent, no re-apply)
   -> [on SUPERSEDED] action absent; the SUPERSEDED conflict notice is shown
-> Applied-not-published banner (persistent once APPLIED)        [FE6-067]
-> Application audit Section (collapsed; actor/time/source/resulting draft/
     per-item before/after)                                      [FE6-067]
```

Design language (unchanged from MVP6.5): KO page title, `Section`+`HanaCard`
module, restrained single accent, **exactly one primary action per screen**
(here `초안에 적용` on a QUEUED request), progressive disclosure (pre-check and
audit expandable), outcome-first KO microcopy, D6 badges. The existing persistent
`ApprovalIntentBanner` stays; MVP6.6 adds the applied-not-published banner as a
distinct, post-apply banner (see §Applied-Not-Published Banner).

## Screen Flow and UX Surfaces

### 1. Application-status pre-check panel (read-only) `[FE6-066]`

Purpose: let a permitted human see *exactly what apply would do* before
committing — the target draft, the per-item before/after, and whether the request
is already stale. Read-only; renders nothing mutating. Maps to a read-only
application-status GET (see gap #1).

Required content:

- **Target DRAFT version**: the `target_ontology_version_id` apply would write to
  (the applier-supplied draft, or the project's current DRAFT if defaulted — see
  gap #2), with its `OntologyVersionStatus` rendered as a D6 badge. If the target
  resolves to a non-DRAFT version, show the `APPLY_TARGET_NOT_DRAFT` pre-warning
  (see gap #4) and disable apply.
- **Per-item before/after preview**, one row per change item: `target_kind`,
  `change_type`, resolved target element ref (read-only, reusing the MVP6.5
  read-only element rendering), and the intended effect stated plainly:
  - `ADD` → `추가 — 대상 초안에 새 요소 생성` (before: `없음`, after: `생성 예정`)
  - `MODIFY` → `수정 — 대상 요소 갱신` (before: current element state, after: proposed)
  - `DEPRECATE` → `폐기 — OntologyElementStatus=ARCHIVED 설정` (before: current status, after: `ARCHIVED`)
- **Staleness / would-supersede hint** (advisory, non-authoritative): if the
  pre-check reports the approved snapshot no longer matches the current draft
  target, show a `STALE` D6 badge (warning tone, already in the token table: KO
  `오래됨`) + copy `승인 시점 이후 대상 초안이 변경되어 적용 시 대체(SUPERSEDED)될 수
  있습니다. 적용을 시도하면 아무 것도 변경되지 않고 요청이 대체됨 상태가 됩니다.` The
  hint is **advisory only**; the authoritative staleness decision happens on the
  apply attempt (ADR 0013). Copy must not claim it is already superseded.
- **Mutation reassurance line** (quiet, read-only): `이 미리보기는 읽기 전용이며
  온톨로지·게시 그래프를 변경하지 않습니다.`

Required interactions:

- No primary action inside the pre-check — it is a read panel. The single primary
  action lives in the adjacent Apply action section.
- Collapsible (progressive disclosure) but **expanded by default when
  `status==APPROVED`+`QUEUED`**, so a permitted human reviews it before applying.
- Copy guard: never `게시`(publish), `실행`(run); use `적용`(apply) / `초안`(draft)
  only, and always pair `적용` with `초안에`/`게시 아님` context.

### 2. Apply action + human-confirmation step `[FE6-065]`

Purpose: the single explicit, human-initiated apply. Maps to the apply `POST`
(see gap #1).

Visibility / gating (all must hold to show the enabled primary action):

- `change_request.status == "APPROVED"` **AND** `application_state == "QUEUED"`;
- the actor is a permitted role — driven by an up-front capability hint
  `can_apply` (see gap #3), NOT guessed from a 403. Permitted roles:
  `ONTOLOGY_MANAGER` / `PROJECT_ADMIN` / `SYSTEM_ADMIN` (apply rights = approver
  rights; ADR 0013);
- the pre-check does not report a hard block (non-DRAFT target). A `STALE` hint
  does NOT hide the button — the human may still attempt; the server is
  authoritative and will 409+SUPERSEDE if truly stale (the confirmation modal
  restates this risk).

Primary action: **`초안에 적용`** (Apply to draft) — the one primary action on the
screen for a QUEUED approved request. Reuse `HanaButton variant="primary"`.

Human-confirmation step (modal / disclosure, required — apply never fires on a
single click):

- Title: `초안에 적용하시겠습니까?`
- Body restates the boundary, verbatim intent:
  `이 작업은 승인된 변경 항목을 DRAFT 온톨로지 버전에만 적용합니다. 게시 그래프는
  변경되지 않으며, 게시는 이후 별도 단계(게시 흐름)에서 별도로 수행해야 합니다.`
- Shows the resolved `target_ontology_version_id` + item count so the human
  confirms *what* and *where*.
- If pre-check hinted stale, the modal repeats the would-supersede warning.
- Two actions: primary `적용` (fires the `POST`), secondary `취소`
  (non-destructive, closes modal, mutates nothing). No third "apply and publish"
  action exists.

Copy guard: the action is `초안에 적용`, never `적용 및 게시`, `게시`, `배포`,
`실행`. Nowhere is there an "apply now to production/published" affordance.

### 3. Applied-not-published banner (load-bearing) `[FE6-067]`

Rendered persistently once `application_state == APPLIED`, as a distinct banner
from the MVP6.5 `ApprovalIntentBanner`. Info/success-leaning tone `Section`,
`Info`/`CheckCircle2` icon.

- Headline: `초안 온톨로지에 적용되었습니다 — 아직 게시되지 않았습니다.`
- Body: `승인된 변경 항목이 DRAFT 온톨로지 버전(<target_ontology_version_id>)에
  적용되었습니다. 게시 그래프는 변경되지 않았습니다. 게시하려면 게시 흐름에서 별도로
  게시해야 합니다.`
- Surfaces the resulting `target_ontology_version_id` as a link/reference to the
  MVP1 ontology-version surface (read-only context; not an apply/publish CTA).
- **No CTA inside the banner publishes or re-applies.** It may link to the
  existing publish flow as navigation, but must not read as "publish this now"
  from within governance — it states publish is a separate step.

### 4. Application audit Section (collapsed; progressive disclosure) `[FE6-067]`

Purpose: prove the apply is fully audited. Maps to the application-audit read (see
gap #6). Rendered within the detail, collapsed by default, distinct from (or
merged into, see gap #6) the MVP6.5 lifecycle audit trail.

- Newest-first; each entry: `actor_id` + role, `action`
  (`GovernanceApplicationAuditAction`: `CHANGE_REQUEST_APPLIED` /
  `CHANGE_REQUEST_SUPERSEDED`, D6-style EN token + KO gloss — `적용됨` / `대체됨`),
  timestamp, source change-request id + applied change-item ids, resulting DRAFT
  `target_ontology_version_id`, and **per-item before/after element refs**
  (element id + before-state → after-state, so the exact draft mutation is
  reconstructable).
- Read-only. No hard-delete affordance (audit entries immutable).
- A staleness block also writes a `CHANGE_REQUEST_SUPERSEDED` entry with the
  mismatch detail; render it in this section so the block is auditable, not just a
  transient toast.

## State-Machine Badges (D6)

`GovernanceApplicationState` now produces `APPLIED` and `SUPERSEDED` for the first
time (reserved in MVP6.5). Extend the `ApplicationStateBadge` helper in
`governanceShared.tsx` and, if a new token is needed, the D6 `tokenTable` in
`StatusBadge.tsx`.

| Token (`GovernanceApplicationState`) | Tone | Icon (lucide) | KO secondary label | Notes |
|---|---|---|---|---|
| `NOT_APPLICABLE` | neutral | `Ban` | 해당 없음 | reuse D6 (unchanged) |
| `QUEUED` | warning | `Clock` | 큐잉됨 (미적용) | unchanged from MVP6.5 (warning, not success) |
| `APPLIED` | success | `CheckCircle2` | 초안에 적용됨 (미게시) | **NEW render — reachable in P0.** KO gloss must state 미게시 so "applied" never reads as "published". `APPLIED` is NOT in the current `StatusBadge` `tokenTable` — add it (or pass an explicit `koLabel`/`tone`), see gap #8. |
| `SUPERSEDED` | warning | `History` (or `AlertTriangle`) | 대체됨 (미적용) | **NEW render — reachable in P0.** `SUPERSEDED` already exists in `tokenTable` (neutral/`History`/`대체됨`); for governance apply use warning tone + gloss `대체됨 (미적용)` so it reads as a blocked, non-applied terminal — pass an explicit `tone`/`koLabel` (mirrors how QUEUED is overridden). |

The `STALE` token (warning/`AlertTriangle`/`오래됨`, already in `tokenTable`) is
used for the advisory pre-check hint, distinct from the terminal `SUPERSEDED`
state.

The existing MVP6.5 `ApplicationStateBadge` currently renders `APPLIED`/`SUPERSEDED`
as an unexpected-state danger badge (`예상치 못한 상태 (P0 미지원)`). In Wave44 this
guard is **replaced** by the real `APPLIED`/`SUPERSEDED` renders above — but only
for MVP6.6; any *other* unexpected literal still degrades to the unexpected-state
notice.

`OntologyChangeRequestStatus` badges are unchanged (`APPROVED` stays
success/`승인됨`); application state is the orthogonal axis that MVP6.6 advances.

## Conflict / Idempotency / Error UX (409 / 403)

Every apply failure is a **non-destructive notice** — nothing is applied, no full-page
crash — reusing the MVP6.5 `ConflictBand`/`NoticeBand` pattern (a warning band with
a `새로고침` action), never a silent overwrite.

| Server response | Meaning | UI behavior |
|---|---|---|
| `409 CHANGE_REQUEST_SUPERSEDED` | Stale at apply time; blocked, nothing applied, `application_state → SUPERSEDED` | Non-destructive conflict notice: `승인 시점 이후 대상 초안이 변경되어 적용할 수 없습니다. 아무 것도 변경되지 않았으며 요청이 대체됨(SUPERSEDED) 상태가 되었습니다. 재적용하려면 다시 제안·승인해야 합니다.` Re-render the request with the `SUPERSEDED` badge; remove the apply control; offer `새로고침`. Terminal — no retry-apply affordance. |
| `409 CHANGE_ALREADY_APPLIED` | Request already `APPLIED` | Idempotency notice: `이 변경 요청은 이미 적용되었습니다. 다시 적용할 수 없습니다.` Show the applied-not-published banner + `APPLIED` badge; apply control absent. Never a double apply. |
| `409 CHANGE_NOT_APPLICABLE` | Not `APPROVED`/`QUEUED` (wrong status/application_state) | Notice: `이 요청은 적용 가능한 상태(승인됨 + 큐잉됨)가 아닙니다.` Apply control hidden/disabled; offer `새로고침`. |
| `409 APPLY_TARGET_NOT_DRAFT` | Target ontology version is not DRAFT | Notice: `적용 대상은 DRAFT 온톨로지 버전이어야 합니다. 게시된/보관된 버전에는 적용할 수 없습니다.` Surface at pre-check (disable apply) AND as a server backstop. Never applies to a published/archived version. |
| `403 PERMISSION_DENIED` | Actor lacks apply rights | Degrade to the permission-limited state (apply control absent), NOT a crash. Should not normally happen because the `can_apply` capability hint hides the control up front. |
| network / 5xx | Server/API failure | Surface-level error preserving request context + retry; distinguish from the per-request 409s. |

Guarantee: the UI never optimistically shows the apply control and then fails on
submit for a *permission* reason — permission is gated up front by `can_apply`. A
`STALE` pre-check hint is the only case where the enabled control may still 409
(SUPERSEDED), and the confirmation modal warns about exactly that before commit.

## Mutation-Guard Proof Line (the redefined one-true-flag guard)

MVP6.1–6.5 asserted an all-false `GovernanceMutationGuard`. MVP6.6's successful
apply response carries the redefined `GovernanceApplicationMutationGuard` in which
**exactly one** flag is legitimately `true`:

| flag | value on successful apply | UI proof copy element |
|---|---|---|
| `ontology_draft_mutated` | **true** | the ONE sanctioned surface |
| `published_graph_mutated` | false | published graph untouched |
| `candidate_graph_mutated` | false | candidates untouched |
| `prompt_version_mutated` | false | prompts untouched |
| `publish_job_started` | false | no publish job |
| `extraction_job_started` | false | no extraction |
| `evaluation_run_started` | false | no evaluation |

- On a **successful apply**, render a quiet, collapsed proof line under the
  applied-not-published banner:
  `이 적용은 DRAFT 온톨로지 버전만 변경했습니다 (ontology_draft_mutated=true).
  게시 그래프·후보 그래프·프롬프트·추출·평가·게시 작업은 변경/시작되지 않았습니다.`
- The pre-check read, the application-audit read, and **any blocked apply**
  (idempotency / staleness / authz) keep the existing **all-false**
  `GovernanceMutationGuard`; on a blocked apply the proof line reads
  `이 시도는 아무 것도 변경하지 않았습니다 (모든 mutation 플래그 false).`
- This is the trust/proof line QA asserts: `ontology_draft_mutated=true` appears
  **only** on a successful apply response; any other true flag, or a true
  `ontology_draft_mutated` on any non-apply endpoint, is a defect the UI should
  surface as an unexpected-state notice rather than a success.

## State Requirements (first-class)

| State | Required behavior |
|---|---|
| Loading | Staged skeletons for the pre-check panel, apply section, applied-not-published banner (if applicable), and application audit. Never render an empty target-version or before/after row before data arrives. Reuse `PageState kind="loading"`. |
| Empty — not APPROVED | The whole application block is absent for `DRAFT`/`OPEN`/`IN_REVIEW`/`REJECTED`/`WITHDRAWN` requests; the MVP6.5 decision panel behaves as before. Application block appears only at `status==APPROVED`. |
| Ready — APPROVED + QUEUED | Pre-check expanded; apply primary action shown for permitted roles; applied-not-published banner absent. |
| Applied — APPLIED | Apply control absent; applied-not-published banner + `APPLIED` badge + one-true-flag proof line + application audit visible. Re-apply attempt → `CHANGE_ALREADY_APPLIED` notice. |
| Superseded — SUPERSEDED | Apply control absent; `SUPERSEDED` (warning) badge + the supersede conflict notice + the `CHANGE_REQUEST_SUPERSEDED` audit entry. Terminal — no retry-apply. |
| Permission-limited | Non-permitted actors (`can_apply=false`) see the pre-check panel, applied-not-published banner (if applied), and application audit **read-only**; the apply control is absent (not a disabled teaser) with `PERMISSION_LIMITED` badge + copy `적용은 온톨로지 관리자·프로젝트 관리자·시스템 관리자만 가능합니다.` |
| Conflict (409) | Any apply 409 (`SUPERSEDED`/`ALREADY_APPLIED`/`NOT_APPLICABLE`/`APPLY_TARGET_NOT_DRAFT`) → non-destructive notice per the table above + `새로고침`; nothing applied. |
| Error | Preserve project + request context; retry; distinguish a per-panel unavailable pre-check from a surface-level server/API failure. A missing pre-check degrades to a notice, not a crash; apply stays disabled if the pre-check cannot load. |
| Stale hint (advisory) | Pre-check `STALE` badge + would-supersede copy; apply stays enabled but the confirmation modal repeats the warning; the server is authoritative on commit. |

## Backend Contract Fields (Frontend-required)

Naming convention (matching MVP1–MVP6.5): DTO/schema names PascalCase, JSON fields
snake_case, enum literals UPPER_SNAKE_CASE. `Blocking` = needed for P0 UX
correctness + QA acceptance. `Optional` = usability, deferrable. Names below are
the **PM/ADR-frozen** names; Frontend MUST reconcile the exact field names against
the Backend draft (`BE6-044`~`BE6-047`) + `openapi-mvp6-6-draft.json` once they
land.

### Reused shapes (must NOT be renamed)

- `Role` (elevated set `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN` gate
  apply) — reused verbatim; no new role literal.
- `OntologyChangeRequest` / `OntologyChangeItem` / `GovernanceApplicationState` /
  `GovernanceCapabilities` (MVP6.5, already in `types.ts`) — extended, not renamed.
- MVP1 ontology-version + `OntologyElementStatus` (`DRAFT`/`ACTIVE`/`ARCHIVED`/
  `DELETED`) + `OntologyVersionStatus` (`DRAFT`/`PUBLISHED`/`ARCHIVED`) — READ-ONLY
  reference targets for the pre-check + audit rendering; never written by the FE.
- MVP3/MVP5 audit record shape — reused by reference for the application audit.
- `GovernanceMutationGuard` (all-false, MVP6.5) — kept on reads/lifecycle/blocked
  apply.

### New enums (Frontend needs the exact literals — PM/ADR-frozen)

- `GovernanceApplicationState`: `APPLIED`, `SUPERSEDED` — reserved in MVP6.5,
  **produced for the first time in MVP6.6**. (`NOT_APPLICABLE`/`QUEUED` unchanged.)
- `GovernanceApplicationAuditAction`: `CHANGE_REQUEST_APPLIED`,
  `CHANGE_REQUEST_SUPERSEDED`.

### New DTOs (Blocking unless noted) — PM/ADR-frozen candidates

- **Apply request** (`POST .../change-requests/{id}/apply`): optional
  `target_ontology_version_id` (a DRAFT version; if omitted → project current
  DRAFT). Blocking: the endpoint + the optional field.
- **Apply response**: the updated `OntologyChangeRequest` (now
  `application_state=APPLIED`) + resulting `target_ontology_version_id` + the
  `GovernanceApplicationMutationGuard` (one-true-flag) + the application audit
  entry (or a pointer to it). Blocking.
- **Application-status pre-check response** (`GET .../application-status`):
  `target_ontology_version_id` (+ its `OntologyVersionStatus`), per-item
  before/after preview (`item_id`, `target_kind`, `change_type`, element ref,
  before-state, after-state), and a staleness/would-supersede indicator
  (`stale`/`would_supersede` boolean + reason). Blocking.
- **Application audit entry**: `actor_id` + role, `action`
  (`GovernanceApplicationAuditAction`), timestamp, source change-request id +
  applied change-item ids, resulting DRAFT `target_ontology_version_id`, per-item
  before/after element refs (element id + before-state/after-state). Blocking.
- **`GovernanceApplicationMutationGuard`** (7 flags; `ontology_draft_mutated=true`
  on success, all others false; all-false on blocked apply): `ontology_draft_mutated`,
  `published_graph_mutated`, `candidate_graph_mutated`, `prompt_version_mutated`,
  `publish_job_started`, `extraction_job_started`, `evaluation_run_started`.
  Blocking.
- **Capability extension**: `can_apply` on `GovernanceCapabilities` (display-only
  hint) so the apply control is rendered up front, not guessed from a 403.
  Blocking (see gap #3).

## DTO / State Gap Analysis vs Backend Draft

The Backend contract draft (`docs/api/MVP6_6_GOVERNANCE_APPLICATION_API_CONTRACT_DRAFT.md`)
and `docs/api/openapi-mvp6-6-draft.json` were **NOT present** when this document
was written (Backend `BE6-044`~`BE6-047` runs in parallel). All gaps below are
therefore `AWAITING-BACKEND` and MUST be reconciled before Wave44 implementation.
This is the single open dependency for the Frontend slice.

| # | Item | Rank | What Frontend needs from the Backend draft |
|---|---|---|---|
| 1 | **Apply endpoint + status/audit read shapes** | Blocking | Confirm the exact paths (`POST .../change-requests/{id}/apply`, `GET .../application-status`, `GET .../application-audit`) and their request/response DTO field names. Nothing renders correctly until these are fixed. `AWAITING-BACKEND`. |
| 2 | **Target-draft default** | Blocking | ADR 0013 says apply targets the applier-supplied `target_ontology_version_id` OR the project current DRAFT if omitted. Confirm the pre-check exposes the *resolved* target so the UI shows the exact draft in both the panel and the confirmation modal. `AWAITING-BACKEND`. |
| 3 | **`can_apply` capability hint** | Blocking | The UI must render the apply control from an up-front capability hint (not a 403). Confirm `GovernanceCapabilities` gains `can_apply` (display-only) and that it is true only for the elevated role set on an `APPROVED`+`QUEUED` request. If Backend omits it, the FE has no non-optimistic way to gate the control → blocker. `AWAITING-BACKEND`. |
| 4 | **Non-DRAFT target surfacing** | Blocking | Confirm the pre-check can report a non-DRAFT resolved target so the FE can pre-warn + disable apply, rather than only learning via `409 APPLY_TARGET_NOT_DRAFT` on submit. `AWAITING-BACKEND`. |
| 5 | **Staleness pre-check semantics** | Blocking | Confirm the pre-check `stale`/`would_supersede` indicator is advisory (per ADR 0013 the authoritative transition is on apply) AND confirm whether the pre-check GET may itself flip `QUEUED→SUPERSEDED` (ADR 0013 open question) — this changes whether merely opening the panel can mutate application state. The UI copy must match. `AWAITING-BACKEND`. |
| 6 | **Application audit vs lifecycle audit** | Blocking | Confirm whether `CHANGE_REQUEST_APPLIED`/`CHANGE_REQUEST_SUPERSEDED` entries come from the existing MVP6.5 audit GET (merged trail) or a separate application-audit GET, and confirm before/after element-ref field names. Drives one merged audit Section vs two. `AWAITING-BACKEND`. |
| 7 | **`GovernanceApplicationMutationGuard` key names** | Blocking | Confirm the 7 keys verbatim (esp. `ontology_draft_mutated` and `evaluation_run_started`, which differ from the MVP6.5 guard's `ontology_definition_mutated`/`change_auto_applied`). The proof line + QA assertion depend on exact names. `AWAITING-BACKEND`. |
| 8 | **D6 `APPLIED` token** | Blocking (FE-side) | `StatusBadge` `tokenTable` has no `APPLIED` row (it has `SUPERSEDED`/`STALE`). Wave44 FE must add `APPLIED` (success/`CheckCircle2`/`초안에 적용됨 (미게시)`) or always pass explicit `koLabel`+`tone`, and override `SUPERSEDED` to warning tone for the governance-apply context. FE-owned; no Backend dependency. |
| 9 | **Applied-by / applied-at on the request** | Optional | Confirm whether `OntologyChangeRequest` gains `applied_by`/`applied_at` (parallel to `decided_by`/`decided_at`) for the summary, or whether the FE reads them from the application audit entry. `AWAITING-BACKEND`. |
| 10 | **Board-level APPLIED/SUPERSEDED rendering** | Optional | Confirm the board list response carries the advanced `application_state` so `APPLIED`/`SUPERSEDED` badges appear on board rows (MVP6.5 already shows `application_state`); no new field expected, confirm only. `AWAITING-BACKEND`. |
| 11 | **OpenAPI additivity** | QA | `openapi-mvp6-6-draft.json` (OpenAPI 3.1.0, `0.6.6-draft`) parse + additivity/disjointness to MVP1–MVP6.5 is QA's (`INT6-051`~`INT6-054`); Frontend re-confirms exact field names against it before Wave44. |

No **rename** of any MVP1 ontology-version / MVP3 publish / MVP5 `Role` /
MVP3–MVP5 audit / MVP6.5 governance field is requested — all reused verbatim / by
reference. Any rename by Backend would be a breaking mismatch and a blocker. All
new application objects/enums must be **additive** and must not break MVP1–MVP6.5
paths, enums, or smokes.

## Frontend Acceptance Notes

- Project-scoped only; **no new LNB item and no new route** — the apply action,
  pre-check, applied-not-published banner, and application audit are all
  contextual panels inside the existing MVP6.5 detail
  (`/projects/:p/governance/:changeRequestId`), appearing only when
  `status==APPROVED`.
- The apply action is visible + enabled only for `APPROVED`+`QUEUED` requests, only
  for permitted roles (`can_apply` hint; `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/
  `SYSTEM_ADMIN`), and always behind an explicit human-confirmation modal — never a
  single-click auto-apply, never on approval.
- Application ≠ publish is unmistakable: the confirmation modal, the
  applied-not-published banner, and the one-true-flag proof line all state that
  apply mutates only a DRAFT ontology version and that publishing is a separate
  MVP3 step. No `게시`/`배포`/`apply-and-publish` affordance exists anywhere here.
- `APPLIED` renders as a success D6 badge glossed `초안에 적용됨 (미게시)`;
  `SUPERSEDED` renders as a warning D6 badge glossed `대체됨 (미적용)`; both are
  reachable in P0 for the first time. `QUEUED` stays warning `큐잉됨 (미적용)`.
- The three 409s (`CHANGE_REQUEST_SUPERSEDED`, `CHANGE_ALREADY_APPLIED`,
  `CHANGE_NOT_APPLICABLE`) + `APPLY_TARGET_NOT_DRAFT` + `403 PERMISSION_DENIED` are
  each non-destructive notices that apply nothing; staleness transitions to a
  terminal `SUPERSEDED` with no retry-apply.
- The redefined mutation guard is surfaced as the trust/proof line:
  `ontology_draft_mutated=true` only on a successful apply, all other flags false;
  reads/lifecycle/blocked-apply stay all-false.
- First-class loading/empty/ready/applied/superseded/permission-limited/conflict/
  error states, reusing `PageState` + the MVP6.5 notice/conflict bands.
- Design language applied: KO titles, `Section`+`HanaCard`, one primary action
  (`초안에 적용`), progressive disclosure (pre-check + audit), D6 badges.
- **Open dependency:** the Backend contract draft + OpenAPI artifact are not yet
  present; every field/state above is reconciled against them before Wave44 (gaps
  #1–#7, #9–#11 marked `AWAITING-BACKEND`).
