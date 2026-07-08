# MVP6.8 Copilot Frontend UX/API Requirements

Status: `WAVE47 CONTRACT-FIRST PLANNING ONLY`
Date: 2026-07-03
Owner: Frontend / UIUX Architecture
Backlog IDs: `FE6-081`~`FE6-084`

This document defines the frontend requirements for the MVP6.8 **Copilot**
(advisory-only, non-autonomous, audit-only, accept-routes-not-executes,
no-real-LLM). It is **requirements only**: no runtime route, component, type,
API client, mock fixture, or smoke code is produced in this wave. Runtime waits
for Wave48.

## Source Documents

- `AGENTS.md` (Frontend Rules)
- `.agents/skills/handoff-reporting/SKILL.md`
- `docs/handoffs/CURRENT_STATE.md`
- `docs/handoffs/wave-047/NEXT_ORDERS.md`
- `docs/handoffs/wave-047/PM_REPORT.md`
- `docs/pm/MVP6_8_COPILOT_BRIEF.md`
- `docs/adr/0015-mvp6-8-copilot-advisory-only-non-autonomous-audit-only-accept-routes-not-executes-no-real-llm-boundary.md`
- `docs/pm/UIUX_REMEDIATION_DECISIONS.md` (D1 LNB IA, D3 copy policy, D6 badges)
- `docs/adr/0010-lnb-project-context-information-architecture.md`
- `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md`
- `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md`
- Format precedent: `docs/pm/MVP6_2_FRONTEND_UX_REQUIREMENTS.md`,
  `docs/pm/MVP6_7_FRONTEND_UX_REQUIREMENTS.md`
- Nearest UX precedent (suggestion+decision loop): the MVP6.2 Learning Insights
  UI in `apps/frontend/src`.

> **Backend-draft dependency.** At the time of writing, the Backend contract
> draft (`docs/api/MVP6_8_COPILOT_API_CONTRACT_DRAFT.md`) and
> `docs/api/openapi-mvp6-8-draft.json` are **not yet present** (Backend
> `BE6-060`~`063` runs in parallel this wave). This document is therefore
> grounded on the **frozen PM brief** enum/field names and the recommended
> endpoint families in `MVP6_8_COPILOT_BRIEF.md §"Contract-First Expectations"`.
> The DTO gap analysis (§8) is written against that PM baseline and MUST be
> re-reconciled against the Backend draft once it lands. Every gap that depends
> on a Backend field name is flagged as such.

## Backlog Coverage

| ID | Requirement output |
|---|---|
| `FE6-081` | Copilot surface placement + IA per ADR 0010 (Analyze-group destination; no ID-bound global LNB pages) |
| `FE6-082` | Suggestion list + detail layout (what / why / source grounding / target gated flow) and the accept-routes-into-existing-flow UX (explicit human gate; copilot executes nothing) |
| `FE6-083` | Dismiss+reason, decision audit note, and first-class loading / empty / error / permission / non-`SUGGESTED`-conflict states |
| `FE6-084` | Advisory / executes-nothing copy, all-false mutation-guard proof line, and DTO gap analysis vs the Backend draft |

## Scope Guard

MVP6.8 P0 is a project-scoped **advisory suggestion loop**:

```text
open project copilot
-> view deterministic suggested actions
   (each: what / why / source grounding / target existing gated flow)
-> accept (routes the human into that EXISTING gated flow, pre-filled/deep-linked
   — the copilot executes NOTHING) or dismiss (with reason)
-> see decision audit note
-> (copilot mutates nothing; all real changes still require the human gate)
```

The UI must **never** imply that accepting a suggestion creates a governance
change request, approves/corrects a candidate, applies/publishes anything,
edits a prompt, changes a policy, runs a job/evaluation, or calls a real model.
**Accept only routes the human to an existing gate; it executes nothing.** There
is NO auto-apply / auto-publish / auto-approve / auto-create / execute
affordance anywhere in this surface. There is no real LLM call — suggestions are
deterministic, source-grounded mock output.

Out of scope for Wave47 and MVP6.8 P0 UI (mirror the PM exclusions): autonomous
action, auto-apply/publish/approve/create of any gated-flow object, policy
enforcement/gating, real LLM / non-deterministic generation, tool-calling
runtime, multi-step agent execution, agent planning/orchestration, background/
scheduled/always-on agents, direct mutation of any ontology/candidate/published
graph/prompt/governance/policy/extraction/evaluation/model-run state, ungrounded
generation, new suggestion kinds beyond the frozen four, new routing-target
kinds beyond the frozen four, multi-/cross-project copilot, connector/plugin SDK,
and multi-tenant runtime.

## 1. Placement / Information Architecture (FE6-081)

### 1.1 Decision: Analyze-group LNB destination `Copilot` (project-scoped)

Per ADR 0010 (LNB two-zone project-context IA) and D1, the Copilot is added as
**one stable project-zone LNB item in the `ANALYZE` group**, not as a contextual
panel and not as ID-bound global routes.

**Recommendation (frozen for this requirements doc):** add `Copilot` as the
**first** item of the `ANALYZE` group.

```text
PROJECT  (rendered only when a project is selected)
├─ BUILD    …
├─ REVIEW   …
├─ PUBLISH  …
└─ ANALYZE
   ├─ Copilot            → /projects/:p/copilot        (NEW, first in group)
   ├─ Search             → /projects/:p/search
   ├─ RAG                → /projects/:p/rag
   ├─ Evaluation         → /projects/:p/evaluation-datasets
   ├─ Learning Insights  → /projects/:p/learning-insights
   ├─ Benchmark          → /projects/:p/benchmark-comparisons
   └─ External API       → /projects/:p/external-api
```

**Justification (Analyze-group destination over a contextual panel):**

1. **It reads across the whole project, not one screen.** A suggestion can
   ground in learning signals, candidates/review, quality/validation, and
   governance/impact at once, and can route into any of four different gated
   flows. It has no single natural parent screen to be a panel of; a
   cross-cutting advisory queue is a *destination*, matching how Learning
   Insights and Benchmark are already modelled (project-scoped Analyze work
   areas, per D1 §1.2).
2. **It is a triage + decide + audit workflow**, the same shape as MVP6.2
   Learning Insights (summary → queue → inspect → decide → audit). D1 already
   groups that class of surface as an Analyze destination. Consistency beats a
   bespoke floating panel.
3. **ADR 0010 §1.3 Note C forbids ID-bound detail pages in the LNB.** A
   suggestion-detail is ID-bound and therefore stays contextual (see §1.2); the
   *area* is the only thing that belongs in the LNB. A single `Copilot` LNB item
   satisfies this cleanly.
4. Discoverability: putting the copilot behind a contextual affordance on some
   other screen would hide the product's headline "what should I do next?"
   entry point. An Analyze item makes it a first-class, scannable destination.

Placing it **first** in `ANALYZE` reflects that the copilot is the recommended
*entry* into the analyze workflow ("start here, then it points you at the right
existing screen").

### 1.2 Contextual sub-navigation inside the Copilot area

Parent area route: `/projects/:p/copilot`. The area is the single LNB
destination; everything below is a **sub-view or contextual detail** reached
from parent rows/cards/breadcrumbs/right-side panel, never a new LNB item and
never a global ID-bound route (ADR 0010 Note C; D1 §1.5 — LNB is the section,
in-screen tabs are sub-views).

Suggested in-screen sub-views (tabs / segmented control WITHIN the section):

- `Summary` — copilot health band (counts by kind/state, grounding coverage).
- `Suggestions` — the default work queue (`SUGGESTED` first).
- `Decision History` — audit timeline.

Suggested contextual detail (right-side panel or nested route reached from a
queue row, preserving project context + return path):

- `/projects/:p/copilot/suggestions/:suggestionId` — suggestion detail panel.

Recommended page structure (Section + Card design language):

```text
Project context header + breadcrumb  (프로젝트명 > Copilot)
-> Advisory banner (executes-nothing / no-real-LLM / all-false guard proof)
-> Copilot summary band (counts by kind & state; grounding coverage)
-> Sub-view tabs (Summary / Suggestions / Decision History)
-> Suggestion queue (cards; state + kind + confidence + risk D6 badges)
-> Contextual suggestion detail panel (what / why / grounding / routing target)
-> Decision surface (Accept -> route into gate | Dismiss -> reason)
-> Decision audit note (in context) + Decision History timeline
```

### 1.3 Breadcrumb + copy policy (D3, D4)

- LNB label (English noun, D3 intentional-EN nav convention): **`Copilot`**.
- Page H1 (Korean primary, D3): recommend **`코파일럿`** (advisory assistant).
  If PM prefers keeping the English product term as H1 too, `Copilot` is
  acceptable — but pick one and use it consistently (no ko/en title-subtitle
  mismatch on the same screen). **PM to confirm the H1 wording.**
- Breadcrumb (D4 `프로젝트명 > 섹션 > 항목`):
  - `/projects/:p/copilot` → `프로젝트명 > Copilot`
  - `/projects/:p/copilot/suggestions/:suggestionId` →
    `프로젝트명 > Copilot > 제안 #<id>`
- No-project-selected behavior (D1 §1.4): the Copilot item lives in the project
  zone, so it is not rendered until a project is selected; no auto-redirect.
- Active-state derivation (D1 §1.6, extend the same rule): active when the path
  contains `/copilot`.

## 2. UX Surfaces

### 2.1 Advisory Banner (always visible in the Copilot area) — the safety spine

A persistent, non-dismissible info banner at the top of the Copilot area. This
is the load-bearing "the copilot is advisory and executes nothing" statement the
PM order and QA require to be crystal clear.

Required copy (Korean primary, tokens stay English per D3):

- Headline: `코파일럿은 제안만 합니다. 아무것도 실행하지 않습니다.`
  ("The copilot only suggests. It executes nothing.")
- Supporting line:
  `제안을 채택(ACCEPT)하면 기존의 사람 검토 단계로 이동할 뿐, 코파일럿이 변경/승인/게시/적용을 직접 수행하지 않습니다. 실제 LLM 호출도 없습니다(결정적 mock).`
  ("Accepting a suggestion only routes you into the existing human-gated flow;
  the copilot never changes/approves/publishes/applies anything itself. There is
  no real LLM call — deterministic mock.")
- Four explicit boundary chips (small, `info`/`neutral` tone), each an
  intentional-English token with a Korean gloss:
  `NO_AUTO_APPLY · 자동 적용 없음`, `NO_AUTO_PUBLISH · 자동 게시 없음`,
  `NO_AUTO_APPROVE · 자동 승인 없음`, `NO_REAL_LLM · 실제 모델 호출 없음`.

**Mutation-guard proof line (required).** Render the response
`CopilotMutationGuard` as an explicit read-only "executes nothing" proof block
(collapsible, but present on every Copilot screen). It lists all frozen guard
flags and shows each as `false`. All flags are always false in P0:

```text
ontology_draft_mutated: false        ontology_published_mutated: false
candidate_graph_mutated: false       published_graph_mutated: false
prompt_version_mutated: false        governance_state_mutated: false
change_request_created: false        change_request_applied: false
candidate_approved_or_published: false
extraction_job_started: false        evaluation_run_started: false
auto_approval_policy_mutated: false
copilot_executed_action: false       real_model_invoked: false
```

The two copilot-specific flags `copilot_executed_action: false` and
`real_model_invoked: false` MUST be visually emphasized (they are the
copilot-specific assertions). The UI reads these flags **from the API response**
(it does not hardcode them); if any flag is ever `true`, the UI must switch to
an error/guard-violation state and disable all decision actions (this can never
happen in P0, but the guard is displayed as live evidence, not decorative copy).

### 2.2 Copilot Summary band

Purpose: answer "what does the copilot think I should look at?" on first screen.

Required content:

- Project name/id and generation freshness timestamp (Backend field name TBD —
  see §8 gap G1; PM brief calls it "created at / updated at"; expect a
  `generated_at`-style field consistent with MVP6.2/6.7).
- Suggestion counts **by `CopilotSuggestionKind`** (the frozen four):
  `DRAFT_GOVERNANCE_CHANGE_REQUEST`, `REVIEW_THESE_CANDIDATES`,
  `INSPECT_QUALITY_OR_VALIDATION_SIGNAL`, `RUN_IMPACT_SIMULATION`.
- Suggestion counts **by `CopilotSuggestionState`**: `SUGGESTED`, `ACCEPTED`,
  `DISMISSED`, `SUPERSEDED` (open `SUGGESTED` count is the primary number).
- High-risk suggestion count (suggestions with `risk_label = HIGH`).
- Grounding coverage indicator: every suggestion is source-grounded; the summary
  should state the source-artifact scope (which closed-MVP artifacts fed the
  suggestions) so the determinism/grounding story is visible.
- Deterministic/no-LLM indicator: a small `DETERMINISTIC_MOCK`-style marker so
  the summary itself reasserts no real model was called.
- Stale/unavailable indicator when applicable.

Product treatment (design language): one strong summary card for the primary
"open suggestions" story; secondary metric cards for by-kind, by-state, and
high-risk counts; quick filters into the queue by kind/state/risk. Do not render
the summary as a raw enum-count table.

### 2.3 Suggestion Queue + Card (FE6-082)

Purpose: the triage queue. `SUGGESTED` is the default work queue; decided/
superseded suggestions are de-prioritized but visible for audit.

Each **suggestion card** must show (mapped to PM "Required suggestion content"):

- **State** — `CopilotSuggestionState` as a **D6 badge** (§4 below).
- **Kind** — `CopilotSuggestionKind` as a badge, with its human gloss and,
  critically, the **name of the target gated flow it would route into** (so the
  card answers "where would accepting send me?" before any action).
- **What** — title (short, plain-language).
- **Why** — rationale, and the plain-language expected next step.
- **Source grounding** — a compact source-artifact preview (count + primary
  artifact types), required and non-empty. A card with no source references is a
  contract violation and must render an error/skip state, never a bare card (PM:
  "a suggestion without traceable source artifacts is invalid for P0 display").
- **Confidence** — `LOW` / `MEDIUM` / `HIGH` as a D6-style badge.
- **Risk** — `LOW` / `MEDIUM` / `HIGH` as a D6-style badge.
- Created/updated timestamps; decision audit note summary when decided.

Interactions:

- Group/filter by `CopilotSuggestionState` (default `SUGGESTED`), by
  `CopilotSuggestionKind`, and by risk/confidence.
- Select a card → open the contextual suggestion detail panel (§2.4).
- Decision actions (Accept / Dismiss) are enabled **only** for `SUGGESTED`
  suggestions (see §2.5 and §3 conflict state).

Product treatment: action-oriented cards/rows with the kind + state +
confidence + risk badges; source-grounding preview chip; tables only inside
drilldown, never as the primary queue (mirrors MVP6.2 workflow-queue treatment).

### 2.4 Suggestion Detail panel

Contextual detail (right-side panel or nested route at
`/projects/:p/copilot/suggestions/:suggestionId`), preserving project context
and a return path to the queue.

Detail panel order:

1. Title (what) + kind badge + state badge + confidence/risk badges.
2. Rationale (why) + plain-language expected next step.
3. **Routing target preview** — the human-readable destination this suggestion
   routes into, described as a *destination + optional pre-fill*, explicitly
   labelled as "not yet executed / no gate passed". See §2.6 for the routing
   descriptor rendering per `CopilotRoutingTargetKind`.
4. **Source grounding** — the full source-artifact reference list (types, ids,
   contextual links back to the originating closed-MVP surface where a
   route/label is available). Required, non-empty.
5. Decision surface (Accept / Dismiss) when `SUGGESTED`; otherwise the
   already-decided / superseded read-only state + audit note (§3).

### 2.5 Decision surface — Accept and Dismiss (FE6-082/083)

Decision command vocabulary is **`ACCEPT` / `DISMISS`** (request commands — NOT
the resulting states `ACCEPTED` / `DISMISSED`; D3/MVP6.2 convention). The
resulting display state is `ACCEPTED` / `DISMISSED`.

**Accept (`ACCEPT`) — routes, never executes:**

- A confirmation drawer/modal whose header states, in plain Korean, that
  accepting **records human intent and routes you into the existing gated flow —
  it does not create/approve/apply/publish/execute anything.**
- On confirm, the UI sends command `ACCEPT`. The response returns the
  **routing-target descriptor** (`CopilotRoutingTargetKind` + deep-link/pre-fill
  payload) and the all-false guard.
- The post-accept UI shows: (a) the recorded decision audit note; (b) an
  explicit **"Go to <target gated flow>"** call-to-action that deep-links /
  pre-fills the existing gate — and copy stating **the human still passes every
  gate of that flow** (e.g. governance: propose → review → approve → apply). The
  routing CTA is a navigation link, NOT an execution button.
- The accepted suggestion transitions to `ACCEPTED` (D6 badge). Do **not** label
  it "applied", "created", "approved", "published", "executed", or "deployed".

**Dismiss (`DISMISS`) — requires a reason:**

- A dismiss drawer/modal requiring exactly one `dismiss_reason_code` from the
  frozen MVP6.2-reused set: `NOT_RELEVANT`, `INSUFFICIENT_EVIDENCE`,
  `DUPLICATE`, `OUT_OF_SCOPE`, `RISK_TOO_HIGH`, `OTHER`. Optional free-text note.
- On confirm, the UI sends command `DISMISS` + reason code. The suggestion
  transitions to `DISMISSED` (D6 badge) and shows its audit note.

Both decision surfaces must restate the audit-only boundary: no candidate,
published graph, prompt, ontology, governance, policy, extraction, evaluation,
or model-run state is mutated — only an audit decision record (+ on accept, the
returned routing-target descriptor) is written.

### 2.6 Routing-target rendering per `CopilotRoutingTargetKind`

On accept, the returned routing descriptor is rendered as a **destination card**
(never an execute button). Each of the four frozen kinds maps to one deep-link
into an existing gate:

| `CopilotRoutingTargetKind` | Human-readable destination | Deep-link / pre-fill (from descriptor) | Gate the human still passes |
|---|---|---|---|
| `GOVERNANCE_CHANGE_REQUEST_DRAFT` | MVP6.5 governance change-request **create/propose** screen | pre-fill draft payload (`ChangeRequestTargetKind` / `ChangeRequestChangeType` + `OntologyElementRef`) — copilot does NOT create the request | propose → review → approve → apply |
| `CANDIDATE_REVIEW_LOCATION` | MVP3 candidate **review** inbox/workbench | deep-link scoped to the referenced candidates — copilot does NOT decide/correct | review → correct → decide |
| `QUALITY_OR_VALIDATION_LOCATION` | MVP4 quality dashboard / MVP3 validation drilldown | deep-link to the metric group / rule cluster — read-only destination | human decides any follow-up |
| `IMPACT_REPORT_LOCATION` | MVP6.7 impact-report panel on the governance change-request detail | deep-link to the impact report for the referenced change request — read-only analysis | human still decides apply/publish |

For `GOVERNANCE_CHANGE_REQUEST_DRAFT`, the UI must present the pre-fill as an
**editable draft the human takes into the create/propose screen** — the copilot
never submits it. The exact pre-fill payload shape is a **Backend open question**
(PM TODO: "kind-specific pre-fill payload shape, especially governance
change-request draft") — see §8 gap G4.

### 2.7 Decision History (audit timeline)

Purpose: make the advisory loop auditable (mirrors MVP6.2 Decision History).

Required content per decision event (PM "Decision audit content"): decision id,
suggestion id, actor id + actor role, decision command (`ACCEPT`/`DISMISS`),
reason code (for dismiss), free-text note, timestamp, suggestion snapshot,
source-artifact ids, and — for accept — the returned routing-target descriptor
(so the audit shows *where the human was routed* and that nothing was executed).
Each event must also carry / display the all-false `CopilotMutationGuard`.

Interactions: timeline grouped by suggestion or date; link from a decided
suggestion to its audit note; link from an audit note back to the source
artifacts and (for accept) the routing target.

## 3. State Requirements (first-class)

Per AGENTS.md Frontend Rules ("모든 화면은 loading, empty, error 상태를 가진다"),
every Copilot surface has loading / empty / error / permission states, plus the
copilot-specific conflict and guard states.

| State | Required behavior |
|---|---|
| Loading | Skeleton/staged loading for summary, queue, and detail panel. Do not show zero counts before data arrives. The advisory banner + guard proof line render immediately (static safety copy), independent of data load. |
| Empty — no suggestions | Explain that, given current project state, the copilot has no grounded next-action to suggest. Point at the source surfaces (review, quality, evaluation, governance) without opening new scope. Do NOT imply the copilot "did" anything or "cleared" work. |
| Empty — filtered queue | Show that no suggestion matches the current kind/state/risk filter; offer to clear the filter. |
| Empty — decision history | Show that no accept/dismiss decision has been recorded yet. |
| Error | Preserve project context, show a retry affordance, and (when the API distinguishes it) separate "source artifacts unavailable / cannot ground" from a server/API failure. Never fabricate an ungrounded suggestion to fill an error. |
| Permission-limited | Any project member who can read the project may view suggestions AND record an audit-only decision (PM authz: no elevated role to decide — the decision mutates nothing and grants no downstream rights). Therefore, in P0, decision actions are **not** hidden for a project reader. If the API returns a `403 PERMISSION_DENIED` (non-member) → render the standard permission-denied surface. Render `404 PROJECT_NOT_FOUND` / `404 COPILOT_SUGGESTION_NOT_FOUND` as the standard not-found surfaces. **Downstream-gate reminder:** even after accept, the destination gated flow keeps its own RBAC (e.g. only an approver can approve) — the UI must state that accepting grants no rights in the target flow. |
| Non-`SUGGESTED` conflict (already-decided) | Decision actions are enabled ONLY for `SUGGESTED`. For `ACCEPTED` / `DISMISSED` / `SUPERSEDED`, show the current state + its audit note as read-only history, not an actionable card. If a decision command is somehow sent against a non-`SUGGESTED` state, surface the Backend `409 COPILOT_SUGGESTION_DECISION_CONFLICT` as an "already decided / historical" state — do NOT silently retry as success. |
| Superseded | Keep `SUPERSEDED` suggestions visible but visually de-prioritized (D6 `SUPERSEDED` badge, `History` icon, `대체됨`). `SUPERSEDED` is read-side only — never offered as a human decision command. No new accept/dismiss on superseded. |
| Stale data | If the generation freshness timestamp / source snapshot is stale, mark the summary and affected sections without blocking read access. |
| Guard-violation (defensive) | If any `CopilotMutationGuard` flag is ever `true` in a response (impossible in P0), switch to an error/guard-violation state and disable all decision actions. The guard is displayed as live evidence, not decorative copy. |

## 4. Design Language Application (Section + Card, KO titles, D6 badges)

- **Section + Card** layout throughout (design-direction reference upgrade): the
  Copilot area is a Section header + advisory banner + summary card band +
  queue-of-cards + contextual detail panel + audit timeline. Tables only inside
  drilldowns, never as the primary queue.
- **Korean titles** (D3): page H1 Korean (`코파일럿`, PM to confirm); all prose
  (banner, empty/error/loading, buttons, section headers) Korean; system enum
  tokens stay English with a Korean secondary label (D3 intentional-English
  scope). LNB label stays the English noun `Copilot`.
- **D6 status-token badges** — every status token renders as
  `[icon] TOKEN · 한국어보조라벨` in one `HanaBadge` (tone + icon + English token
  + Korean gloss; never color alone). Reusing the frozen D6 token table:

  | Token (`CopilotSuggestionState`) | Tone | Icon (lucide) | Korean secondary label |
  |---|---|---|---|
  | `SUGGESTED` | info | `Lightbulb` | 제안됨 |
  | `ACCEPTED` | success | `CheckCircle2` | 채택됨 |
  | `DISMISSED` | neutral | `XCircle` | 기각됨 |
  | `SUPERSEDED` | neutral | `History` | 대체됨 |

  Confidence / risk labels (`LOW` / `MEDIUM` / `HIGH`) render as D6-style badges
  using the tone vocabulary (risk `HIGH` → `danger`, `MEDIUM` → `warning`,
  `LOW` → `neutral`/`info`; confidence `HIGH` → `success`). These four
  literals are **new tokens** not in the D6 §6.3 table; extend the table with
  the same rule (documented here as the frozen choice).

  `CopilotSuggestionKind` and `CopilotRoutingTargetKind` render as badges/chips
  with the English token + Korean gloss (proposed glosses):

  | `CopilotSuggestionKind` | Korean gloss |
  |---|---|
  | `DRAFT_GOVERNANCE_CHANGE_REQUEST` | 거버넌스 변경요청 초안 |
  | `REVIEW_THESE_CANDIDATES` | 후보 검수 대상 |
  | `INSPECT_QUALITY_OR_VALIDATION_SIGNAL` | 품질·검증 신호 점검 |
  | `RUN_IMPACT_SIMULATION` | 영향 시뮬레이션 실행 |

  (Glosses are FE proposals; PM to confirm final wording — see §8 gap G7.)

## 5. Frontend Acceptance Notes

- The Copilot area feels like a guided product workflow: banner → summary →
  triage queue → inspect → decide → route/audit. Same rhythm as MVP6.2.
- The advisory / executes-nothing / no-real-LLM boundary is visible at all times
  (persistent banner + live all-false guard proof line), and reasserted at every
  decision surface.
- Accept visibly **routes into an existing gate** (a navigation CTA to the
  pre-filled/deep-linked destination) and never presents an execute/apply/
  approve/publish/create button. The human still passes every gate of the target
  flow.
- Dismiss requires exactly one reason code (frozen MVP6.2 set).
- Every visible suggestion preserves traceable, non-empty source artifacts; a
  suggestion without grounding is never rendered as a normal card.
- `SUGGESTED` is the only actionable state; `ACCEPTED`/`DISMISSED`/`SUPERSEDED`
  are read-only history; non-`SUGGESTED` decision commands surface the `409`
  conflict, not a silent success.
- Command (`ACCEPT`/`DISMISS`) is never confused with resulting state
  (`ACCEPTED`/`DISMISSED`) in copy, badges, or field usage.
- hana components only via `src/shared/ui/hana` adapter. Additive only; no
  MVP1–MVP6.7 route/enum/smoke break; no rename of reused shapes.

## 6. API / Field Requirements (blocking vs optional)

Naming convention (matching MVP6.2/6.3 and the PM brief): DTO/schema names
PascalCase, JSON fields snake_case, enum literals UPPER_SNAKE_CASE. `Blocking` =
needed for P0 UX correctness + QA acceptance. `Optional` = usability, deferrable.

### 6.1 Common blocking fields

- `project_id`
- generation freshness timestamp for the summary (name TBD — §8 G1)
- stable ids for suggestions and decision audit records
- `CopilotMutationGuard` on **every** response (summary, list, detail, decision)
  with all 14 frozen flags present and false, including
  `copilot_executed_action` and `real_model_invoked`
- non-empty source-artifact references on every suggestion

### 6.2 Copilot Suggestion (blocking)

- `id`, `project_id`
- `kind` (`CopilotSuggestionKind`)
- `state` (`CopilotSuggestionState`)
- `title` (what)
- `rationale` (why)
- plain-language expected next step (field name TBD — §8 G2)
- **routing target descriptor**: target-flow identifier (`CopilotRoutingTargetKind`)
  + deep-link / pre-fill reference payload (this is a destination descriptor, not
  an executed action)
- `source_artifacts` (source-artifact references) — **required, non-empty**
- `confidence_label` (`LOW`/`MEDIUM`/`HIGH`)
- `risk_label` (`LOW`/`MEDIUM`/`HIGH`)
- `created_at`, `updated_at`
- `decision_audit_note` when decided

Optional: kind-specific display hints; superseded-by suggestion id; source
snapshot version.

### 6.3 Source Artifact Reference (blocking)

Reuse the MVP6.2 `LearningSourceArtifactType` vocabulary by reference (no
rename): `REVIEW_DECISION`, `REVIEW_CORRECTION`, `VALIDATION_RESULT`,
`QUALITY_METRIC`, `QUALITY_DRILLDOWN`, `EVALUATION_RUN`, `EVALUATION_METRIC`,
`EVALUATION_ERROR_CASE`, plus governance/candidate/quality/impact refs per PM
brief. Blocking: `artifact_type`, `artifact_id`, `project_id`, and a
route/display label sufficient for contextual navigation back to the source
surface. Optional: human-readable source title, compact quote/snippet preview.

> **Note (§8 G3):** the PM brief lists source vocabularies drawn from MVP3
> candidate/evidence/review, MVP4 `QualityMetricGroup`, MVP3 `ValidationRuleCode`,
> MVP6.5/6.6 governance refs, and MVP6.7 impact refs — but the copilot may need a
> **single unified source-artifact-type enum** (or a discriminated union) so the
> card can render any grounding uniformly. Whether Backend exposes one unified
> `CopilotSourceArtifactType` or a heterogeneous ref union is a Backend decision.

### 6.4 Suggestion Decision (blocking)

Request: `decision` (`ACCEPT` / `DISMISS`); `dismiss_reason_code` (required for
`DISMISS`, from the frozen set); optional `note`.

Response: `suggestion_id`, `project_id`, `previous_state`, `new_state`,
`decision_audit_note`, and on `ACCEPT` the returned **routing-target
descriptor**; `CopilotMutationGuard` all-false.

Audit note (blocking): id, `actor_id`, `actor_role`, `decision`,
`dismiss_reason_code`, `note`, decided-at timestamp, `suggestion_snapshot`,
source-artifact ids, (for accept) routing-target descriptor, and
`mutation_guard`.

Mutation boundary (must be enforced Backend-side and reflected in UI copy): the
decision endpoint writes an audit decision record and updates the suggestion
state only; it mutates no candidate/published/prompt/ontology/governance/policy/
extraction/evaluation/model-run state; a decision command against a
non-`SUGGESTED` state returns `409 COPILOT_SUGGESTION_DECISION_CONFLICT`.

### 6.5 Endpoints (from PM brief — Backend to finalize)

```text
GET  /api/v1/projects/{project_id}/copilot/summary
GET  /api/v1/projects/{project_id}/copilot/suggestions
GET  /api/v1/copilot-suggestions/{suggestion_id}
POST /api/v1/copilot-suggestions/{suggestion_id}/decisions
```

Authz mapping: `403 PERMISSION_DENIED` (non-member), `404 PROJECT_NOT_FOUND`,
`404 COPILOT_SUGGESTION_NOT_FOUND`, `409 COPILOT_SUGGESTION_DECISION_CONFLICT`.

## 7. Enum Inventory (exact frozen names)

New copilot-scoped enums (from the PM freeze):

- `CopilotSuggestionKind`: `DRAFT_GOVERNANCE_CHANGE_REQUEST`,
  `REVIEW_THESE_CANDIDATES`, `INSPECT_QUALITY_OR_VALIDATION_SIGNAL`,
  `RUN_IMPACT_SIMULATION`.
- `CopilotSuggestionState`: `SUGGESTED`, `ACCEPTED`, `DISMISSED`, `SUPERSEDED`.
- `CopilotRoutingTargetKind`: `GOVERNANCE_CHANGE_REQUEST_DRAFT`,
  `CANDIDATE_REVIEW_LOCATION`, `QUALITY_OR_VALIDATION_LOCATION`,
  `IMPACT_REPORT_LOCATION`.
- `CopilotMutationGuard` (14 flags, all always false): `ontology_draft_mutated`,
  `ontology_published_mutated`, `candidate_graph_mutated`,
  `published_graph_mutated`, `prompt_version_mutated`, `governance_state_mutated`,
  `change_request_created`, `change_request_applied`,
  `candidate_approved_or_published`, `extraction_job_started`,
  `evaluation_run_started`, `auto_approval_policy_mutated`,
  `copilot_executed_action`, `real_model_invoked`.

Request commands (NOT states): `ACCEPT`, `DISMISS`.

Dismiss reason codes (reused verbatim from MVP6.2, no rename): `NOT_RELEVANT`,
`INSUFFICIENT_EVIDENCE`, `DUPLICATE`, `OUT_OF_SCOPE`, `RISK_TOO_HIGH`, `OTHER`.

Confidence / risk labels: `LOW`, `MEDIUM`, `HIGH`.

Reused by reference (no rename): `LearningSourceArtifactType` (MVP6.2),
`ChangeRequestTargetKind` / `ChangeRequestChangeType` / `OntologyElementRef`
(MVP6.5/6.6), `QualityMetricGroup` (MVP4), `ValidationRuleCode` (MVP3), MVP6.7
impact refs, MVP5 `Role`.

## 8. DTO / Field Gap Analysis vs the Backend Draft

> **The Backend draft is not yet present** (parallel wave). This gap list is
> written against the frozen **PM brief** and MUST be re-reconciled against
> `docs/api/MVP6_8_COPILOT_API_CONTRACT_DRAFT.md` +
> `openapi-mvp6-8-draft.json` once they land. Each item states the FE need and
> the concrete decision Backend must make.

| # | Gap | FE need | Backend decision required |
|---|---|---|---|
| G1 | **Summary freshness field name** | Summary needs a generation/freshness timestamp to drive the stale state. | Confirm the field name (expect `generated_at`, consistent with MVP6.2 summary / MVP6.7). |
| G2 | **"Expected next step" field name** | Card + detail render a plain-language expected next step distinct from `rationale`. | Confirm the field name (e.g. `expected_next_step` vs folding into `rationale`). |
| G3 | **Unified vs heterogeneous source-artifact ref shape** | Cards must render grounding from learning / candidate / quality / validation / governance / impact sources uniformly. | Expose one discriminated `CopilotSourceArtifactType`/ref shape, or a documented union; ensure `artifact_type` + `artifact_id` + nav label present on each. |
| G4 | **Kind-specific pre-fill payload shape** (esp. governance) | `GOVERNANCE_CHANGE_REQUEST_DRAFT` must pre-fill the MVP6.5 create/propose screen (`ChangeRequestTargetKind`/`ChangeRequestChangeType`/`OntologyElementRef`). | Define the pre-fill payload schema per routing kind (this is a PM-flagged open question). |
| G5 | **Deep-link locator shape per routing kind** | Each routing kind needs a deterministic deep-link the FE can turn into a real in-app route (candidate review, quality/validation drilldown, impact-report panel, governance create). | Define the locator shape (ids + target route hint) per `CopilotRoutingTargetKind` so FE deep-links without guessing route params. |
| G6 | **Decision-capability hint** | To render a permission-limited state precisely, FE benefits from a per-suggestion `can_decide` capability hint (though PM authz says any project member may decide). | Confirm whether a capability hint is exposed or FE relies solely on `403`. Non-blocking (PM authz already permits any member to decide). |
| G7 | **Korean gloss wording for new tokens** | D6 badges + kind/routing chips need Korean secondary labels for the new tokens (`CopilotSuggestionKind` ×4, `CopilotRoutingTargetKind` ×4, confidence/risk ×3). | PM to confirm final Korean gloss wording (FE proposals in §4). This is a PM/copy decision, not a Backend field. |
| G8 | **Guard flag list stability** | The guard proof line hardcodes the 14 flag names for display; drift would break the proof block. | Confirm the OpenAPI `CopilotMutationGuard` schema has exactly the 14 frozen flags (no add/rename), all `default: false`. |
| G9 | **Persist-vs-compute for suggestion detail** | `GET /copilot-suggestions/{id}` and the detail panel assume a suggestion is retrievable by id after listing. | Confirm the PM-flagged persist-vs-compute decision (MVP6.3/6.7 process-local store pattern) so list→detail round-trips deterministically. |
| G10 | **Summary count field names** | Summary band renders counts by kind and by state + high-risk count. | Confirm exact summary field names (e.g. `suggestion_counts_by_kind`, `suggestion_counts_by_state`, `high_risk_suggestion_count`) to avoid FE/BE drift (the recurring MVP6.2/6.3 lesson). |

None of G1–G10 block the *planning* deliverable; all are contract-detail
reconciliations to close when the Backend draft lands, before Wave48 runtime.

## 9. Non-negotiable Boundary Restated (FE view)

- The Copilot **suggests and routes; it executes nothing.** No auto-apply /
  auto-publish / auto-approve / auto-create / execute affordance exists anywhere
  in this surface.
- Accept returns a **routing-target descriptor** (a destination + optional
  pre-fill) with **no authority**; the human still passes every gate of the
  target flow. Accept is a navigation CTA, never an execution button.
- Every response carries an **all-false** `CopilotMutationGuard` (14 flags,
  incl. `copilot_executed_action: false`, `real_model_invoked: false`), rendered
  as a live proof line — read from the response, not hardcoded as decoration.
- **No real LLM.** Suggestions are deterministic, source-grounded mock output;
  the UI reasserts `DETERMINISTIC_MOCK` / `NO_REAL_LLM`.
- Additive only; no MVP1–MVP6.7 break; no rename of reused shapes; boundary per
  ADR 0015.
