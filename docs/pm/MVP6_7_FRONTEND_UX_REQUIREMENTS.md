# MVP6.7 Impact Simulation (read-only impact analysis of a governance change request) — Frontend UX/API Requirements

Status: `WAVE45 CONTRACT-FIRST PLANNING`
Date: 2026-07-02
Owner: Frontend / UIUX Architecture
Backlog ID: `FE6-073`~`FE6-076`

This document defines the frontend requirements for MVP6.7 **Impact Simulation**:
a **read-only** impact report for an existing governance change request, consumed
as a contextual "영향도(Impact)" panel on the Governance change-request detail. It
covers five bounded impact dimensions (affected ontology elements + bounded
transitive dependents; dependent candidate entities/relations; dependent published
elements; affected MVP3 validations / MVP4 quality checks; a deterministic
`ImpactSeverity` rollup), rendered with D6 severity badges, plus first-class
loading/empty/error/permission-limited states and truncation UX. It is
**requirements only** — no runtime route, component, type, API client, mock
fixture, seed, smoke, or test is implemented in Wave45 (mirrors
Wave14/19/23/30/33/39/41/43 planning waves). Runtime waits for Wave46.

MVP6.7 is the **return to read-only** after the single MVP6.6 mutation surface
(apply). The load-bearing product rule is the boundary itself (ADR 0014): **impact
simulation mutates NOTHING and is advisory-only — never a gate.** It never applies,
publishes, enforces, gates, re-validates, re-extracts, or flips governance state;
it never sets `SUPERSEDED`; every response carries an **all-false**
`ImpactSimulationMutationGuard` (no flag ever true — distinct from the MVP6.6
`GovernanceApplicationMutationGuard`). Every affordance, badge, and copy string on
this surface must make that unmistakable: a `BREAKING`/`HIGH` severity is
information, not a block.

## Source Documents

- `AGENTS.md` (Frontend Rules)
- `.agents/skills/handoff-reporting/SKILL.md`
- `docs/handoffs/CURRENT_STATE.md`
- `docs/handoffs/wave-045/NEXT_ORDERS.md` (Frontend Agent Order + Non-negotiable boundary)
- `docs/handoffs/wave-045/PM_REPORT.md`
- `docs/pm/MVP6_7_IMPACT_SIMULATION_BRIEF.md` (frozen PM brief, `PM6-027`)
- `docs/adr/0014-mvp6-7-impact-simulation-read-only-analysis-boundary.md` (**the authority**)
- `docs/adr/0013-...` (MVP6.6 apply boundary), `docs/adr/0010-...` (two-zone LNB IA)
- `docs/pm/UIUX_REMEDIATION_DECISIONS.md` (D1 LNB IA, D3 copy/KO titles, D4 breadcrumb, D6 status-token badges)
- `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md` (tokens, `Section`+`HanaCard` module, one primary action per screen, progressive disclosure)
- `docs/pm/MVP6_6_FRONTEND_UX_REQUIREMENTS.md` (format precedent + the surface this extends, `FE6-065`~`FE6-068`)
- **The existing Governance UI this extends (shipped):**
  - `apps/frontend/src/pages/GovernanceDetailPage.tsx` (the detail surface the Impact panel lives inside; MVP6.6 `ApplicationBlock` at ~L486–L850, `SectionStack` order at ~L179–L228)
  - `apps/frontend/src/pages/governanceShared.tsx` (`ChangeRequestStatusBadge`, `ApplicationStateBadge`, KO label maps, `formatGovernanceDate`)
  - `apps/frontend/src/shared/ui/platform/{Section,StatusBadge,PageState}.tsx` (`SectionStack`, `HanaCard`, D6 `tokenTable`, `PageState`)
  - `apps/frontend/src/shared/api/types.ts` (governance DTOs/enums ~L2935–3230; `ValidationRuleCode`/`ValidationResultSeverity` ~L53–67; `QualityMetricGroup` ~L823; `OntologyElementRef` ~L3172)
- **Backend contract draft:** `docs/api/MVP6_7_IMPACT_SIMULATION_API_CONTRACT_DRAFT.md`
  + `docs/api/openapi-mvp6-7-draft.json` — **NOT YET PRESENT at time of writing
  (Backend `BE6-052`~`BE6-055` runs in parallel).** This document was drafted
  against the **PM brief + ADR 0014**; every enum/field name below is the
  **PM/ADR-frozen** name. See §"DTO / State Gap Analysis" — all backend-owned gaps
  are marked `AWAITING-BACKEND` and MUST be reconciled against the Backend draft
  before Wave46. This is the one open dependency.

## Backlog Coverage

| ID | Requirement output |
|---|---|
| `FE6-073` | Impact panel placement (contextual "영향도(Impact)" panel on the Governance change-request detail; no new LNB item/route per ADR 0010); run-analysis entry + read-only/advisory banner |
| `FE6-074` | Report layout for the 5 dimensions (affected ontology elements + bounded transitive dependents; dependent candidate entities/relations; dependent published elements; affected MVP3 validations / MVP4 quality; severity/summary rollup) with per-item + report-level D6 `ImpactSeverity` badges |
| `FE6-075` | States: loading (running analysis) / empty (NONE / no dependents) / error / permission-limited; truncation UX (exact count + "showing first N"); all-false mutation-guard proof line; no apply/publish/enforce affordance |
| `FE6-076` | DTO/field/state gap analysis vs the Backend draft; read-only-not-a-gate copy guard |

## Scope Guard

MVP6.7 P0 adds exactly **zero** mutating actions. It adds one **read-only**
analysis surface to the existing Governance detail:

```text
select project
-> open Governance -> open a change request (ANY lifecycle state; the analysis is
     advisory and does NOT require APPROVED — typically APPROVED + application_state
     = QUEUED, i.e. about to be applied)
-> open the contextual "영향도(Impact)" panel and run impact simulation (read-only)
-> read the impact report:
     * 영향받는 온톨로지 요소: direct target(s) of each change item + bounded
       transitive dependents (max depth 2; depth shown per element)
     * 의존 후보 요소(candidate entities/relations): exact count + capped ref list + truncated
     * 의존 게시 요소(published elements): exact count + capped ref list + truncated
     * 영향받는 검증/품질: MVP3 ValidationRuleCode(s) + MVP4 QualityMetricGroup(s) by reference
     * 심각도 요약(severity rollup): per-item ImpactSeverity + report-level max + per-severity counts
-> see the "읽기 전용 분석 — 적용/게시/시행하지 않습니다" banner
-> (the human then decides whether to proceed via the SEPARATE MVP6.6 apply /
     MVP3 publish paths; the report itself changes nothing)
```

The UI must NOT imply that the Impact panel, or any control on it:

- applies, publishes, enforces, gates, pre-authorizes, or auto-triggers anything —
  it is **advisory** decision-support read **before** the separate MVP6.6 apply /
  MVP3 publish steps;
- mutates the ontology (draft or published), candidate graph, published graph,
  prompts, extraction, evaluation, or governance state; it **never** flips the
  change request's `status`/`application_state` and **never** sets `SUPERSEDED`
  (staleness stays the MVP6.6 apply-time authority);
- blocks or prevents the human from proceeding — a `BREAKING`/`HIGH` severity is
  **informational only**, never a stop;
- re-validates, re-extracts, starts a publish/extraction/evaluation job, or
  generates a migration plan / release note / auto-fix suggestion.

Out of scope for MVP6.7 P0 UI (P1/later, per PM §6 / ADR 0014): any mutation of any
kind; applying/publishing/enforcing/gating on the report; auto-triggering apply or
publish; **hypothetical free-form change set** input not tied to a stored change
request (P1); unbounded / full transitive closure beyond depth 2; migration-plan /
release-note generation; automated remediation / auto-fix; post-apply
re-validation/re-extraction; cost/performance impact modelling; multi-request /
cross-project impact; real LLM execution; copilot/agent runtime; connector/plugin
SDK; multi-tenant runtime.

## Information Architecture (no new LNB item; contextual to the existing detail)

MVP6.7 adds **no new route and no new LNB entry** (ADR 0010: LNB shows stable
top-level work areas only; ID-bound analysis is reached through its parent screen;
no new Analyze-zone destination). The impact report is a **contextual panel within
the existing MVP6.5/6.6 change-request detail route** —
`/projects/:p/governance/:changeRequestId` (`GovernanceDetailPage.tsx`). This is the
natural and only home: an impact report analyzes one specific change request, so it
belongs on that request's working surface, reached from board rows / breadcrumbs.

- LNB unchanged: `Governance` stays the single project-zone item in the Review
  group at `/projects/:p/governance`; active-LNB derivation unchanged.
- Routes unchanged: board `/projects/:p/governance`, propose `/governance/new`,
  detail `/governance/:changeRequestId`. No `/impact` route is added — the panel is
  a read rendered inside the detail (progressive disclosure), not a route.
- Breadcrumbs unchanged (`프로젝트명 > Governance > 변경 요청 #<id>`).

### Where the Impact panel sits inside the detail (extends the `SectionStack`)

The detail currently renders, in order (`GovernanceDetailPage.tsx` ~L179–L228):
`요청 요약` → `변경 항목`(`ChangeItemsSection`) → **MVP6.6 `ApplicationBlock`
(APPROVED-only)** → 검토 스레드 → 결정(`DecisionPanel`) → 감사 추적.

MVP6.7 inserts one **Impact Section** into this `SectionStack`. Unlike the MVP6.6
`ApplicationBlock` (which renders only when `status === "APPROVED"`), the Impact
panel is **advisory for any lifecycle state** (ADR 0014: "any lifecycle state — the
analysis is advisory and does not require APPROVED"), so it is **not** gated on
`status`. Recommended placement: immediately **after `변경 항목`
(`ChangeItemsSection`) and before the MVP6.6 `ApplicationBlock`** — the report reads
the change items and informs the apply decision, so it sits between "what will
change" and "apply it".

```text
[detail, all lifecycle states]
요청 요약 Section (unchanged)
변경 항목 Section (ChangeItemsSection, unchanged)
-> 영향도(Impact) Section (NEW — read-only impact report)          [FE6-073/074/075]
     [collapsed by default; "영향도 분석 실행" runs the simulation]
     -> read-only/advisory banner + all-false mutation-guard proof line
     -> 심각도 요약 (report rollup: max severity D6 badge + per-severity counts)
     -> per change item: item ImpactSeverity badge + 5-dimension breakdown
[APPROVED only] MVP6.6 ApplicationBlock (unchanged; pre-check + apply + audit)
검토 스레드 → 결정 → 감사 추적 (unchanged)
```

Design language (unchanged from MVP6.5/6.6): KO section title, `Section`+`HanaCard`
module, restrained single accent, progressive disclosure (report collapsed until
run; per-item dimensions expandable), outcome-first KO microcopy, D6 badges. The
Impact panel introduces **no primary action** in the mutating sense — its only
control is the read-only "영향도 분석 실행" (Run impact analysis) trigger. It does
not compete with the MVP6.6 `초안에 적용` primary action.

## Screen Flow and UX Surfaces

### 0. Panel entry + read-only/advisory banner `[FE6-073]`

- The Impact Section is **collapsed by default** with a single read-only trigger
  **`영향도 분석 실행`** (Run impact analysis). This is not a mutating primary action
  — reuse a secondary/tertiary button treatment, never `HanaButton variant="primary"`
  styling that reads as apply/publish. If Backend persists reports (see gap #2) and
  a report already exists, the panel may auto-load the latest instead of showing the
  trigger.
- On run (or auto-load), the panel expands to the report.
- A persistent **read-only/advisory banner** heads the expanded report (info tone
  `Section`, `Info` icon), copy:
  `이 분석은 읽기 전용입니다. 온톨로지(초안/게시)·후보 그래프·게시 그래프·프롬프트·`
  `추출·평가·거버넌스 상태를 변경하지 않으며, 적용·게시·시행하지 않습니다. 심각도는`
  `참고 정보이며 적용/게시를 막지 않습니다.`
- Copy guard: never `적용`(apply as an action), `게시`(publish), `시행`(enforce),
  `실행` (as in "run the change"); the only "실행" allowed is `영향도 분석 실행`
  (run the analysis, which changes nothing). The panel never offers an
  "apply now" / "publish now" / "fix" affordance.

### 1. Severity / summary rollup `[FE6-074]` (dimension 5, shown first)

Purpose: the deterministic report-level headline. Rendered at the top of the
expanded report (outcome-first), before the per-item breakdown.

- **Report-level `ImpactSeverity`** = max item severity, rendered as a D6 badge
  (see §Severity Badges). This is the single most prominent element.
- **Per-severity counts**: a small breakdown, e.g.
  `BREAKING 1 · HIGH 0 · MEDIUM 2 · LOW 3 · NONE 0`, each label a D6 badge or badge
  + count. Byte-stable ordering (severity descending).
- Adjacent to a `BREAKING`/`HIGH` rollup, quiet advisory copy (NOT a block):
  `높은 심각도는 검토를 권장하는 참고 정보입니다. 적용/게시를 막지 않으며, 진행 여부는`
  `이후 별도 단계(적용/게시 흐름)에서 사람이 결정합니다.`

### 2. Affected ontology elements + bounded transitive dependents `[FE6-074]` (dimension 1)

Purpose: what the change items touch directly, and what depends on those elements
within the ontology definition, bounded to **max depth 2** (direct + one hop).

- **Per change item**, one block: `target_kind` (`CLASS`/`PROPERTY`/`RELATION`),
  `change_type` (`ADD`/`MODIFY`/`DEPRECATE`), the resolved direct target
  `OntologyElementRef` (reuse the MVP6.5/6.6 read-only element rendering), and the
  item's `ImpactSeverity` badge.
- **Direct target(s)** shown as depth `0`; **transitive dependents** shown as
  depth `1`/`2`, each with its own `OntologyElementRef` and a **depth indicator**
  (e.g. `깊이 1` / `깊이 2`, or an indented tree). The panel must make the bounded
  depth visible — copy `전이 의존성은 최대 깊이 2까지 표시됩니다.` so the human
  understands this is bounded, not a full closure.
- If the exact traversal shape per `target_kind` (properties of a class; relations
  whose domain/range is an affected class; child/related elements) is exposed as a
  typed list vs a flat ref list is `AWAITING-BACKEND` (gap #4).

### 3. Dependent candidate entities/relations `[FE6-074]` (dimension 2)

Purpose: candidate-graph rows whose ontology class/relation ref is an affected
element. **Read-only count + capped ref list.**

- **Exact `count`** rendered prominently (e.g. `의존 후보 요소 128개`). The count is
  always exact even when the list is capped (ADR 0014).
- **Capped ref list**: up to the ref cap (P0 e.g. 50 — exact value `AWAITING-BACKEND`,
  gap #5) of `OntologyElementRef`-style refs.
- **Truncation UX** (see §Truncation): when `truncated === true`, show
  `총 <count>개 중 처음 <N>개 표시` and make clear the remaining are not listed (no
  fake "load more" that mutates or paginates beyond the cap unless Backend exposes
  a cursor — not expected in P0).
- Empty case: `의존하는 후보 요소가 없습니다.` (see §Empty state).

### 4. Dependent published elements `[FE6-074]` (dimension 3)

Purpose: published-graph elements referencing an affected element. Same shape as
dimension 2 — **read-only count + capped ref list + truncation** — but published.

- **Exact `count`** + **capped ref list** + **truncation UX** identical to
  dimension 2.
- This dimension is the primary driver of `BREAKING` severity (a `DEPRECATE`/`MODIFY`
  on an element with dependent published elements). When the count is non-zero on a
  `DEPRECATE`/`MODIFY` item, pair it with the item's `BREAKING` badge and the
  advisory (not-a-block) copy from the rollup.
- Reading the published graph is read-only; copy must never suggest the report
  touches the published graph. Empty case: `의존하는 게시 요소가 없습니다.`

### 5. Affected validations / quality checks `[FE6-074]` (dimension 4)

Purpose: MVP3 `ValidationRuleCode`s and MVP4 `QualityMetricGroup`s whose scope
intersects an affected element, **by reference** (advisory).

- **Affected validations**: a list of MVP3 `ValidationRuleCode` values, each with
  its `ValidationResultSeverity` (`INFO`/`WARNING`/`FAILED`) as a D6 badge (existing
  tokens: `FAILED` danger, `WARNING` warning, `INFO` info). `FAILED` drives item
  severity `HIGH`; `WARNING` drives `MEDIUM` — reflect that in the rollup but do
  not re-derive it client-side (Backend computes the deterministic severity).
- **Affected quality groups**: a list of MVP4 `QualityMetricGroup` values
  (`VALIDATION`/`CONSISTENCY`/`COMPLETENESS`/`TRACEABILITY`/`REVIEW`/`DUPLICATE`/
  `RELATION_DENSITY`), rendered by reference (group name + KO gloss). Affected
  quality groups drive `MEDIUM`.
- These are **references, not runs** — copy must not imply the report executes a
  validation or recomputes quality. Whether the affected quality group is computed
  live or referenced by group only is `AWAITING-BACKEND` (gap #6).
- Empty case: `영향받는 검증 규칙/품질 그룹이 없습니다.`

## Severity Badges (D6) — `ImpactSeverity`

`ImpactSeverity` = `NONE`/`LOW`/`MEDIUM`/`HIGH`/`BREAKING`, rendered as D6 badges
per the D6 status-token guide. Rendered per change item AND as the report-level
rollup. Deterministic (Backend-computed); the FE never re-derives it.

| Token (`ImpactSeverity`) | Tone | Icon (lucide) | KO secondary label | Notes |
|---|---|---|---|---|
| `NONE` | neutral | `MinusCircle` (or `CircleSlash`) | 영향 없음 | `ADD` of a new element with no existing dependents |
| `LOW` | info | `Info` | 낮음 | only the direct element affected, no dependents |
| `MEDIUM` | warning | `AlertTriangle` | 중간 | transitive ontology dependents, or affected `WARNING` validations / quality groups |
| `HIGH` | warning | `AlertTriangle` | 높음 | `DEPRECATE`/`MODIFY` on an element with dependent **candidate** elements, or affected `FAILED` validations — **warning tone** |
| `BREAKING` | danger | `XCircle` (or `AlertOctagon`) | 심각(파손 가능) | `DEPRECATE`/`MODIFY` on an element with dependent **published** elements — **danger tone** |

- **BREAKING and HIGH use warning/danger tones** per the order: `BREAKING` = danger,
  `HIGH` = warning (heightened). `MEDIUM` = warning, `LOW` = info, `NONE` = neutral.
- **NONE of `NONE`/`LOW`/`MEDIUM`/`HIGH`/`BREAKING` exist in the current
  `StatusBadge` `tokenTable`** (`apps/frontend/src/shared/ui/platform/StatusBadge.tsx`
  ~L55–L114 — it has `WARNING`/`FAILED`/`INFO` etc. but no impact-severity rows).
  Wave46 FE must **add these five rows** to `tokenTable` (or pass explicit
  `koLabel`+`tone`). FE-owned; no Backend dependency (gap #8).
- The badge always shows the intentional English token + Korean secondary label
  (D3 policy: status enums stay English tokens, Korean as secondary label). A
  danger/warning tone is a **visual severity cue, not an error/block** — copy must
  clarify it does not prevent apply/publish.

## Truncation UX (exact count + "showing first N")

Applies to dimensions 2 (candidate) and 3 (published), and to the transitive
dependent list if Backend caps it.

- The **count is always exact** (`count` from Backend), even when the ref list is
  capped. Render the exact count as the headline number.
- When `truncated === true` (Backend flag), render below the capped list:
  `총 <count>개 중 처음 <N>개 표시` (showing first N of exact-count total), where
  `N` is the number of refs actually returned (== the cap). Muted tone.
- When `truncated === false` (or absent), the full set is shown; no truncation
  notice.
- The truncation notice is **informational** — do not offer client-side paging or a
  "load all" that would re-query unboundedly. If Backend exposes a cursor (not
  expected in P0 — `AWAITING-BACKEND`, gap #5), a bounded "더 보기" may be added in
  Wave46; otherwise the capped list + exact count is the P0 contract.
- Exact ref-cap value (PM brief suggests 50) and whether the cap is per-dimension or
  global is `AWAITING-BACKEND` (gap #5); the UI reads the returned `truncated` +
  `count` and does not hardcode the cap.

## Mutation-Guard Proof Line (all-false, always)

Unlike MVP6.6 (one-true-flag `GovernanceApplicationMutationGuard`), **every** MVP6.7
impact response carries an **all-false** `ImpactSimulationMutationGuard` — no flag
ever true (ADR 0014). The FE surfaces this as a quiet, collapsed proof line under
the read-only/advisory banner:

`이 분석은 아무 것도 변경하지 않았습니다 (모든 mutation 플래그 false). 온톨로지·게시`
`그래프·후보 그래프·프롬프트·추출·평가·거버넌스 상태는 변경되지 않았고, 어떤 작업도`
`시작되지 않았습니다.`

- The exact guard key set (candidate keys per ADR 0014 §4:
  `ontology_draft_mutated`, `published_graph_mutated`, `candidate_graph_mutated`,
  `prompt_version_mutated`, `governance_state_mutated`, `publish_job_started`,
  `extraction_job_started`, `evaluation_run_started`) is confirmed against the
  Backend draft (gap #7). The invariant the FE asserts and displays is **"all
  false, always"**.
- If **any** guard flag is ever `true` on an impact response, the FE must surface it
  as an **unexpected-state notice** (danger), NOT a success — this would be a defect
  (QA gate). MVP6.7 turns no flag true, ever.

## State Requirements (first-class)

| State | Required behavior |
|---|---|
| Collapsed (not yet run) | Impact Section shows the `영향도 분석 실행` read-only trigger + a one-line description (`변경 요청이 온톨로지·후보·게시 그래프와 검증/품질에 미치는 영향을 읽기 전용으로 분석합니다.`). No report data shown until run/auto-load. |
| Loading (running analysis) | On run, staged skeletons for the rollup + per-item dimensions; a `분석 실행 중…` progress affordance. Never render an empty/zero rollup or before/after row before data arrives. Reuse `PageState kind="loading"` inline within the Section. Copy must read as "analyzing", never "applying". |
| Ready | Read-only/advisory banner + all-false proof line + severity rollup + per-item 5-dimension breakdown + truncation notices as applicable. |
| Empty — `NONE` / no dependents | A benign, explicit empty read: report-level `NONE` badge glossed `영향 없음`, per-dimension `의존 … 없음` copy, `count = 0`. This is a valid success (e.g. an `ADD` with no dependents), NOT an error — reuse `PageState kind="empty"` semantics inside dimensions. Copy: `이 변경 요청은 기존 요소에 대한 의존성 영향이 없습니다.` |
| Error | Preserve project + request context; a retry (`다시 분석`) that re-runs the read-only analysis. Distinguish a per-panel unavailable report from a surface-level server/API failure; a failed analysis degrades to a notice within the Section, never a full-page crash and never a mutation. |
| Permission-limited (`403 PERMISSION_DENIED`) | A non-member (cannot view the change request / project) sees the Impact Section degrade to a `PERMISSION_LIMITED` (warning) badge + copy `이 프로젝트의 변경 요청을 볼 수 있는 구성원만 영향도 분석을 볼 수 있습니다.` No elevated role is required (unlike MVP6.6 apply) — any project member who can view the request can view its impact report (ADR 0014). If Backend exposes a `can_view_impact`-style capability hint (gap #3), gate the trigger up front; otherwise degrade gracefully from the 403. |
| Not found (`404 CHANGE_REQUEST_NOT_FOUND`) | Handled at the detail-route level (existing `PageState kind="error"`); the Impact Section is not rendered for a missing request. |
| Truncated | Dimensions with `truncated === true` show exact `count` + `총 <count>개 중 처음 <N>개 표시`; the report is otherwise complete. |

There is **no applied/superseded/conflict/idempotency state** for the Impact panel
— it is read-only, so there is no 409, no re-apply, no staleness transition. (Those
belong to the MVP6.6 `ApplicationBlock`, which is unchanged.)

## Backend Contract Fields (Frontend-required)

Naming convention (matching MVP1–MVP6.6): DTO/schema names PascalCase, JSON fields
snake_case, enum literals UPPER_SNAKE_CASE. `Blocking` = needed for P0 UX
correctness + QA acceptance. `Optional` = usability, deferrable. Names below are the
**PM/ADR-frozen** names; Frontend MUST reconcile the exact field names against the
Backend draft (`BE6-052`~`BE6-055`) + `openapi-mvp6-7-draft.json` once they land.

### Reused shapes (must NOT be renamed)

- MVP6.5/6.6 governance: `OntologyChangeRequest` / `OntologyChangeItem` /
  `ChangeRequestTargetKind` (`CLASS`/`PROPERTY`/`RELATION`) /
  `ChangeRequestChangeType` (`ADD`/`MODIFY`/`DEPRECATE`) / `OntologyElementRef` /
  `GovernanceApplicationState` — the report input is a change-request id; items drive
  the analysis; state is **read-only** and never mutated.
- MVP1 ontology definition + `OntologyElementStatus` / `OntologyVersionStatus` —
  read-only reference for affected elements + transitive dependents.
- Candidate graph + MVP3 published graph (`PublishedGraphVersion`, published
  elements) — read-only reference for dependent counts + refs.
- MVP3 `ValidationRuleCode` / `ValidationResultSeverity` (`INFO`/`WARNING`/`FAILED`)
  + MVP4 `QualityMetricGroup` — read-only reference for dimension 4. All already in
  `types.ts` (~L53–67, ~L823).
- MVP5 `Role` — standard project read check; no new role literal, no apply-level
  elevation.

### New enums (Frontend needs the exact literals — PM/ADR-frozen)

- `ImpactSeverity`: `NONE`, `LOW`, `MEDIUM`, `HIGH`, `BREAKING`.

### New DTOs (Blocking unless noted) — PM/ADR-frozen candidates

- **Impact report endpoint(s)** (e.g. `POST` and/or `GET
  .../ontology-change-requests/{id}/impact-report`; if persisted, list + GET-by-id
  per the MVP6.3 pattern with an `impact_report_id`). Blocking: the endpoint(s) +
  response DTO field names.
- **Impact report response**: report-level `ImpactSeverity` rollup + per-severity
  counts; a list of per-item impact records; the all-false
  `ImpactSimulationMutationGuard`. Blocking.
- **Per-item impact record**: `item_id` (or ref back to `OntologyChangeItem`),
  `target_kind`, `change_type`, direct target `OntologyElementRef`, item
  `ImpactSeverity`, plus the four data dimensions:
  - **affected ontology elements**: direct target(s) + transitive dependents, each
    an `OntologyElementRef` with a **depth** indicator (0/1/2). Blocking.
  - **dependent candidate entities/relations**: exact `count` + capped ref list +
    `truncated` boolean. Blocking.
  - **dependent published elements**: exact `count` + capped ref list + `truncated`
    boolean. Blocking.
  - **affected validations/quality**: a list of `ValidationRuleCode` (+ each one's
    `ValidationResultSeverity`) + a list of `QualityMetricGroup`, by reference.
    Blocking.
- **`ImpactSimulationMutationGuard`** (all-false, every flag; candidate 8 keys per
  ADR 0014 §4). Blocking — the proof line + QA all-false assertion depend on the
  exact key set.
- **Capability hint** (Optional): a `can_view_impact`-style display-only hint (or
  reuse of the standard project-member read check) so the trigger is gated up front,
  not guessed from a 403 (gap #3).

## DTO / State Gap Analysis vs Backend Draft

The Backend contract draft (`docs/api/MVP6_7_IMPACT_SIMULATION_API_CONTRACT_DRAFT.md`)
and `docs/api/openapi-mvp6-7-draft.json` were **NOT present** when this document was
written (Backend `BE6-052`~`BE6-055` runs in parallel). All backend-owned gaps below
are `AWAITING-BACKEND` and MUST be reconciled before Wave46. This is the single open
dependency for the Frontend slice.

| # | Item | Rank | What Frontend needs from the Backend draft |
|---|---|---|---|
| 1 | **Impact endpoint + report response shape** | Blocking | Confirm the exact path(s) and method (compute-on-demand `POST` vs read `GET`; whether persisted with `impact_report_id` + list/GET-by-id per MVP6.3) and the response DTO field names. Nothing renders until these are fixed. `AWAITING-BACKEND`. |
| 2 | **Compute-vs-persist** | Blocking | Whether the panel runs a `POST` on demand or reads a persisted report drives the entry UX (a `영향도 분석 실행` trigger vs auto-load latest). PM/ADR defer this to Backend. `AWAITING-BACKEND`. |
| 3 | **Read capability hint** | Optional | Whether a `can_view_impact`-style display hint exists so the trigger is gated up front, or the FE degrades from a `403`. No elevated role required (ADR 0014); any member who can view the request can view its report. `AWAITING-BACKEND`. |
| 4 | **Transitive-dependent shape per `target_kind`** | Blocking | Exact traversal rules (properties of a class; relations whose domain/range is an affected class; child/related elements) and whether dependents come back as a typed structure vs a flat `OntologyElementRef` list with a `depth` field. Drives the depth-tree rendering. `AWAITING-BACKEND`. |
| 5 | **Ref-cap value + per-dimension vs global + cursor** | Blocking | The exact ref cap (PM suggests 50), whether it is per-dimension or global, and whether any cursor/paging exists beyond the cap. The FE reads `truncated` + exact `count` and must not hardcode the cap; the truncation copy depends on the returned `N`. `AWAITING-BACKEND`. |
| 6 | **Affected quality: live vs by-reference** | Blocking | Whether affected `QualityMetricGroup`s are computed live or referenced by group only (ADR 0014 open question). The copy must not imply a recompute if it is by-reference. `AWAITING-BACKEND`. |
| 7 | **`ImpactSimulationMutationGuard` key names** | Blocking | Confirm the guard key set verbatim (candidate 8 keys incl. `governance_state_mutated`). The all-false proof line + QA assertion depend on exact names; MVP6.7 turns no flag true. `AWAITING-BACKEND`. |
| 8 | **D6 `ImpactSeverity` tokens** | Blocking (FE-side) | `StatusBadge` `tokenTable` has NO `NONE`/`LOW`/`MEDIUM`/`HIGH`/`BREAKING` rows. Wave46 FE must add them (`BREAKING` danger/`XCircle`, `HIGH` warning/`AlertTriangle`, `MEDIUM` warning, `LOW` info, `NONE` neutral) or pass explicit `koLabel`+`tone`. FE-owned; no Backend dependency. |
| 9 | **Change-item ↔ impact-record linkage** | Optional | Confirm how each per-item impact record links back to its `OntologyChangeItem` (`item_id` vs index) so the FE can align the impact breakdown with the `변경 항목` section. `AWAITING-BACKEND`. |
| 10 | **Empty/`NONE` shape** | Optional | Confirm a `NONE` report and zero-dependent dimensions come back as explicit `count: 0` + `severity: NONE` (a valid success), not as an error/empty body, so the empty state renders as a benign read. `AWAITING-BACKEND`. |
| 11 | **OpenAPI additivity** | QA | `openapi-mvp6-7-draft.json` (OpenAPI 3.1.0, `0.6.7-draft`) parse + additivity/disjointness to MVP1–MVP6.6 is QA's (`INT6-059`~`INT6-062`); Frontend re-confirms exact field names against it before Wave46. |

No **rename** of any MVP1 ontology / candidate / MVP3 published-graph / MVP3
validation / MVP4 quality / MVP5 `Role` / MVP6.5–6.6 governance field is requested —
all reused verbatim / by reference. Any rename by Backend would be a breaking
mismatch and a blocker. All new impact objects/enums must be **additive** and must
not break MVP1–MVP6.6 paths, enums, or smokes.

## Frontend Acceptance Notes

- Project-scoped only; **no new LNB item and no new route** — the impact report is a
  contextual panel inside the existing detail
  (`/projects/:p/governance/:changeRequestId`), reached from board rows /
  breadcrumbs (ADR 0010). No new Analyze-zone destination.
- The panel is **advisory for any lifecycle state** (not gated on `APPROVED`, unlike
  the MVP6.6 `ApplicationBlock`); placed between `변경 항목` and the MVP6.6
  `ApplicationBlock`.
- **Read-only-not-a-gate is unmistakable**: the read-only/advisory banner, the
  all-false proof line, and the severity-rollup advisory copy all state that the
  report changes nothing and that a `BREAKING`/`HIGH` severity does NOT block
  apply/publish. No `적용`/`게시`/`시행`/apply-now/publish-now/auto-fix affordance
  exists anywhere on the panel; the only control is the read-only
  `영향도 분석 실행` trigger.
- The 5 dimensions render as: severity rollup (max `ImpactSeverity` badge +
  per-severity counts) → affected ontology elements with bounded depth (0/1/2, "최대
  깊이 2") → dependent candidate (exact count + capped list + truncation) →
  dependent published (exact count + capped list + truncation) → affected
  `ValidationRuleCode`/`QualityMetricGroup` by reference.
- `ImpactSeverity` renders as D6 badges: `BREAKING` danger, `HIGH` warning, `MEDIUM`
  warning, `LOW` info, `NONE` neutral; per item and as the report rollup; FE adds
  the five `tokenTable` rows (gap #8). FE never re-derives severity.
- Truncation UX: exact `count` always shown; capped lists show
  `총 <count>개 중 처음 <N>개 표시`; no unbounded client paging.
- **Every** impact response carries an **all-false** `ImpactSimulationMutationGuard`
  surfaced as the all-false proof line; any true flag is an unexpected-state defect
  (QA gate).
- First-class collapsed / loading (running analysis) / ready / empty (`NONE` / no
  dependents) / error / permission-limited states, reusing `PageState` + the
  Section/Card module.
- Design language applied: KO section title, `Section`+`HanaCard`, progressive
  disclosure (collapsed until run; per-item dimensions expandable), D6 badges, no
  mutating primary action.
- **Open dependency:** the Backend contract draft + OpenAPI artifact are not yet
  present; every backend-owned field/state above is reconciled against them before
  Wave46 (gaps #1–#7, #9–#11 marked `AWAITING-BACKEND`; gap #8 is FE-owned).
