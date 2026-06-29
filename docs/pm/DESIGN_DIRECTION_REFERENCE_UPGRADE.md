# Design Direction — Reference-Driven UI/UX Upgrade

Status: `FROZEN — Frontend implements against this doc (Wave 37)`
Date: 2026-06-29
Owner: PM / Product Designer
Backlog ID: `PM6-020`
Blocks: Frontend (FE6-038+), then QA (INT6-031/032)

## 0. Purpose & boundaries

User goal (Wave 37): make the web UI/UX more intuitive and easy to use, taking
PRINCIPLES from two reference sites — `https://wwit.design` (UI pattern library)
and `https://ai.codle.io/kr` (product site) — and translating them into **our
internal operational knowledge-graph console**. We are NOT building a marketing
landing page. We adopt their *principles* (hierarchy, card consistency,
whitespace, outcome-first copy, progressive disclosure, one clear primary action,
restrained accent), not their page structure.

This doc is **additive, token-driven, presentation-only**:

- No backend / API / DTO / enum change. All routes/components referenced exist.
- Does NOT contradict the closed UI/UX work: D1 LNB IA, D2 Dashboard hero, D3
  copy-language, D4 breadcrumb, D5 Quality priority, D6 status badges
  (`docs/pm/UIUX_REMEDIATION_DECISIONS.md`), ADR 0010, and
  `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md`. It operationalizes them via tokens.
- Scope is bounded: centralize the **theme tokens + shared primitives + one card
  module**, then apply to the **Dashboard + the high-traffic list / workbench /
  benchmark screens**. NOT a 35-screen rewrite (see §8 out-of-scope).

Grounded against the real system:
`apps/frontend/src/shared/styles/theme.ts`,
`apps/frontend/src/shared/styles/GlobalStyle.ts`,
`apps/frontend/src/shared/styles/styled.d.ts`,
`apps/frontend/src/shared/ui/hana/*` (`HanaCard`, `HanaButton`, `HanaBadge`,
`HanaInput`, `HanaSelect`),
`apps/frontend/src/shared/ui/platform/*` (`PageState`, `MetricCard`,
`StatusBadge`),
`apps/frontend/src/shared/layout/*` (`AppShell`, `PageHeader`, `Breadcrumbs`,
`navigation.ts`),
representative pages `DashboardPage.tsx`, `ReviewWorkbenchPage.tsx`,
`BenchmarkComparisonPage.tsx`, and the per-MVP layout helpers
`pages/mvp2Shared.tsx` / `pages/mvp3Shared.tsx`.

---

## 1. Design principles adopted (mapped to the two references)

Seven principles. Each names its reference origin and a one-line "how it applies
to us".

| # | Principle | From | How it applies to us |
|---|---|---|---|
| P1 | **3-tier visual hierarchy** (page > section > item; size+weight+color do the work) | codle | Every screen reads top-down: H1 (page) → section header → card/row item; we add a real *medium* weight + a mid type step so hierarchy stops relying on size alone. |
| P2 | **One canonical card module, repeated** | wwit (card modularity) + codle (one repeating module) | A single `Section` card (header / supporting line / content / optional one action) reused across screens instead of per-MVP bespoke cards, so screens feel like one product. |
| P3 | **Generous, consistent whitespace** | both (breathing room) | A single spacing scale drives section gaps and card padding; bump the page rhythm so dense operator screens still breathe; no per-screen magic numbers. |
| P4 | **One clear primary action per screen** | codle (ONE primary action) | Each screen has exactly one visually-primary button (solid accent); everything else is secondary/tertiary. The accent is reserved for that one action + active nav. |
| P5 | **Restrained accent over a neutral base** | both (neutral base + few bright accents) | Keep the existing blue `primary` as the *only* accent; neutral slate surfaces everywhere else. No new decorative colors; accent = primary action, active state, focus. |
| P6 | **Progressive disclosure** | wwit (progressive disclosure) + D5 | Show the decision-critical summary first; collapse dense detail (drilldown tables, raw diffs, audit history) behind accordions/panels. Empty states guide the next action rather than dead-ending. |
| P7 | **Outcome-first Korean microcopy** (why before what, no jargon) | codle (outcome-first conversational copy) | Titles/sublines say the operator outcome first ("검수를 통과한 항목만 게시됩니다"), then the mechanism; consistent with D3 (KO prose, EN status tokens as badges). |

These map 1:1 onto the order in NEXT_ORDERS §"PM/Design Agent Order": outcome-first
copy (P7), one card module (P2), whitespace scale (P3), 3-tier hierarchy (P1),
progressive disclosure (P6), one primary action (P4), restrained accent (P5).

---

## 2. Refined design-token spec (against the EXISTING theme)

All changes are **in `apps/frontend/src/shared/styles/theme.ts`** (and the
matching interface in `styles/styled.d.ts`). FE changes the theme once; screens
inherit. The guiding fix: today the theme has **no medium font weight** (only
`regular:400`, `medium:700`, `bold:800`) and **a type-size gap** (`lg:18px` jumps
straight to `xl:28px`), so hierarchy currently leans entirely on size and color.
We add the missing rungs and a few semantic surface roles the style guide already
assumes (`surfaceInfo/Success/Warning/Danger`, `surfaceSelected`,
`surfaceStrong`). We do NOT rename existing tokens (avoids touching 30+ screens).

### 2.1 Typography — ADD the missing weight + size rungs

Current `typography.fontWeight` is misleading (`medium` is actually 700). Fix it
to a real ladder, keeping a back-compat alias so existing references don't break:

```ts
fontWeight: {
  regular: 400,
  medium: 500,   // CHANGED from 700 — the real "medium" the hierarchy needs
  semibold: 600, // ADD — section headers / emphasized labels / primary button
  bold: 700,     // CHANGED from 800 — H1 / strong numbers
  // heavy: 800,  // OPTIONAL keep only if a screen truly needs 800
}
```

> Migration note for FE: `medium:700` is used today in `HanaButton`,
> `AppShell`, `MetricCard` (`fontWeight.bold` there is 800). Because we re-map
> `bold` 800→700, audit the ~handful of `fontWeight.bold`/`fontWeight.medium`
> references and switch any that want true-bold to `bold` (700) and any label
> emphasis to `semibold` (600). This is a small, centralized sweep — verify
> nothing visually regresses to 400.

Type scale — add one mid step so section headers aren't forced to pick 18 or 28:

```ts
fontSize: {
  xs: "12px",
  sm: "13px",
  md: "14px",   // body
  lg: "18px",   // card title / section header
  xl: "22px",   // ADD — sub-hero / large section title (fills 18→28 gap)
  xxl: "28px",  // RENAMED from xl — page H1
}
```

> `xl` previously meant 28px (used by `PageHeader` h1, `HanaCard` is `lg`).
> Because this renames a key, FE must update the two `fontSize.xl` consumers to
> `fontSize.xxl`. If a no-rename approach is preferred, instead ADD `lgPlus:
> "22px"` and leave `xl:28px` — FE's call, but the *intent* (a 22px rung exists)
> is the requirement. Document whichever choice in the FE report.

Line-heights (`tight 1.2 / normal 1.5 / relaxed 1.6`) are fine — keep.

### 2.2 Spacing — keep scale, ADD a section-rhythm step

Current scale is good (`xs4 / sm8 / md12 / lg16 / xl24 / xxl32`). The gap is a
*page-level* rhythm token; today pages hardcode `14px`/`18px`/`28px` gaps
(see `DashboardPage` `MetricGrid gap:14px`, `Hero padding:28px`). Add:

```ts
spacing: {
  xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "32px",
  section: "24px",  // ADD alias for between-section vertical rhythm (== xl)
  page: "40px",     // ADD page top/side breathing where the shell allows
}
```

Rule: **between-section gap = `spacing.xl`(24)**, **card inner padding =
`spacing.lg`(16) → `spacing.xl`(24) for primary/summary cards**, replacing the
ad-hoc `14/18/28` values. Centralizes P3 (whitespace).

### 2.3 Color roles — ADD semantic surfaces; ONE accent stays

The existing palette already has the accent (`primary:#1d4ed8`) and tone pairs
(`positive/warning/danger/progress/draft` + `*Soft`). The style guide assumes
named *surface* roles that don't exist yet. ADD them (mostly aliases of existing
values) so badges/panels/selected-rows stop hardcoding hex:

```ts
color: {
  // ...existing kept verbatim (surface, surfaceRaised, surfaceMuted, border,
  // borderStrong, text, textMuted, primary, primarySoft, positive…danger, etc.)
  accent: "#1d4ed8",        // ADD alias of primary — the ONLY accent (P5)
  accentSoft: "#dbeafe",    // ADD alias of primarySoft
  surfaceInfo: "#ecfeff",   // ADD — read-only / preview-only panels
  surfaceSuccess: "#ecfdf5",// ADD — pass/accepted surfaces
  surfaceWarning: "#fffbeb",// ADD — stale/preview/regressed surfaces
  surfaceDanger: "#fff1f2", // ADD — destructive/high-risk surfaces
  surfaceSelected: "#fff7ed",// ADD — selected row/card background (style guide)
  surfaceStrong: "#0f172a", // ADD — ONE dark summary/primary CTA area per screen
  textOnStrong: "#f8fafc",  // ADD — text on surfaceStrong
}
```

Accent discipline (P5): `accent`/`primary` is used ONLY for the single primary
button, the active LNB item, focus rings, and small emphasis (active tab
underline). It is never a decorative fill. All other emphasis comes from
weight/surface/border, not color.

### 2.4 Radius & elevation — keep, add one elevation step

Radius `sm6 / md8` is correct (style guide says 8px for regular cards) — keep;
do not increase rounding. Elevation currently has one shadow (`soft`). Add a
lighter rest shadow so repeated cards can be flatter than the hero/summary card
(supports hierarchy P1):

```ts
shadow: {
  none: "none",                                   // ADD
  soft: "0 14px 34px rgba(23, 32, 51, 0.08)",     // keep — summary/hero
  card: "0 1px 2px rgba(23, 32, 51, 0.06)",       // ADD — default repeated cards
}
```

Rule: repeated item/list cards use `shadow.card`; the ONE summary/hero card per
screen may use `shadow.soft`. Reserves visual weight for the primary surface (P1).

### 2.5 Breakpoints (advisory)

No breakpoint token exists today (media queries are inline: 760/860/900/1100/1280).
Out of scope to refactor, but FE SHOULD reuse the existing values consistently;
optional `breakpoint` token map is P2-nice-to-have, not required this wave. The
Wave35/36 invariant (0 horizontal overflow at 1440/1366/1280/768) MUST hold.

---

## 3. Canonical "Section + Card" module (the one repeating module — P2)

Extend the existing `HanaCard` (don't fork it). Today `HanaCard` already supports
`title` + `description` + children. Add an optional **supporting line** and an
optional **single action slot**, and a `tone`/`emphasis` prop so the same module
covers normal, summary (strong), and info/warning panels.

### 3.1 Spec

```
┌─ Section card ────────────────────────────────────────────┐
│  [eyebrow?]  TITLE (lg/semibold)            [ one action ] │  ← header row
│  supporting line (md / textMuted)                          │  ← why/outcome (P7)
├────────────────────────────────────────────────────────────│
│  content (children: rows, table, metric grid, panel)       │
└────────────────────────────────────────────────────────────┘
```

- **header**: `title` (existing) + optional `eyebrow` (small uppercase muted
  kicker, e.g. section label) + optional single **`action`** node, right-aligned,
  rendered as ONE primary/secondary button (P4). If more than one control is
  needed, they go in the content area, not the header.
- **supporting line**: the existing `description`, but copy guidance is
  outcome-first (P7) — say what the section gives the operator, not what it is.
- **content**: `children` unchanged.
- **emphasis** prop: `"default"` (shadow.card) | `"summary"` (shadow.soft,
  `spacing.xl` padding, may use `surfaceStrong`) | `"info"|"success"|"warning"|
  "danger"` (maps to the new `surface*` roles for state panels).

### 3.2 Which component to extend

- Extend **`apps/frontend/src/shared/ui/hana/HanaCard.tsx`** with the new optional
  props (`eyebrow?`, `action?`, `emphasis?`). Existing call sites (title/description
  only) keep working unchanged — purely additive props.
- Promote the duplicated layout helpers (`ScreenGrid`, `Split`, `Stack`,
  `CardBody`, `Muted`, `BadgeRow` currently copied across `mvp2Shared.tsx`,
  `mvp3Shared.tsx`, etc.) into a single shared module, e.g.
  `apps/frontend/src/shared/ui/platform/Section.tsx` + `Layout.tsx`, and re-export.
  This is the P2/centralization payoff: one card grammar, used everywhere.
- `MetricCard` and `StatusBadge` stay as-is (already consistent); they become the
  standard *content* of a Section card's KPI strip / status column.

---

## 4. Per-screen-type guidance

Four archetypes. Each says the required reading order and the ONE primary action.

### 4.1 Dashboard (value + onboarding + one next action)

Order (already mostly built — D2 hero exists): **Hero (headline → subline → 3
value points → ONE primary CTA `프로젝트 시작하기`)** → KPI strip (`MetricCard`s)
→ `최근 활동` Section card → footer notice.
- Apply tokens: replace the inline `26/28/14/18px` numbers in `DashboardPage`
  Hero/MetricGrid with `fontSize.xxl`/`xl`, `spacing.xl`, `shadow.soft` for the
  hero, `shadow.card` for KPI cards. Exactly one primary CTA; "최근 프로젝트 열기"
  stays secondary (P4).
- Empty recent-activity already uses `PageState kind="empty"` with a CTA — good,
  keep that pattern as the model for all empty states (P6).

### 4.2 List / table screens (e.g. Candidate Results, Sources, Extraction jobs)

Order: **breadcrumb → PageHeader (KO title + outcome subline) → optional filter
Section → list as card-like rows (not raw table as first impression, per style
guide) → dense detail in tables/panels below**.
- ONE primary action in the PageHeader actions slot (e.g. "새 작업", "업로드").
- Tables MUST keep the Wave35 horizontal-scroll wrapper (0 overflow at the 6
  resolutions). Use `shadow.card` on row cards, `surfaceSelected` for the active
  row, left accent bar for selection (style guide).
- Empty state via `PageState kind="empty"` with a next-action CTA (P6).

### 4.3 Detail / workbench screens (e.g. Review Workbench, Benchmark Comparison)

Order: **breadcrumb → PageHeader → ONE strong summary Section (`emphasis=summary`)
answering "what decision is in front of me right now" → action bar (the decision
or the run-select) → main content (split: list/queue + contextual detail panel) →
collapsed detail (raw diff, audit history, drilldown) (P6)**.
- Exactly one primary decision button is visually primary; the rest are secondary
  (P4). For Review that's the chosen decision; for Benchmark it's "비교 실행".
- Keep evidence/source traceability visible near the item (invariant + style guide).
- Progressive disclosure: confusion-matrix drilldown, raw JSON diff, and audit
  timeline are collapsed by default.

### 4.4 Empty / loading / error / permission states (make empty guide the next step)

Use the existing `PageState` (`kind="loading"|"empty"|"error"|"permission"`)
everywhere — it already takes `actionLabel` + `onAction`. Requirements:
- **loading**: skeleton/spinner copy in KO ("…불러오는 중").
- **empty**: MUST offer the next action (a CTA) — never a dead end (P6). E.g. an
  empty list says what's missing + a button to create/select.
- **error**: KO message + "다시 시도" action calling `refetch`.
- **permission**: `kind="permission"` with the `PERMISSION_LIMITED` badge tone
  (D6) and a copy line saying what access is needed.
- No fake-zero: render `NOT_AVAILABLE`/`NOT_APPLICABLE` badges (D6) when a
  denominator/metric is absent (style guide + D5).

---

## 5. Outcome-first Korean microcopy (consistent with D3)

Rule (re-states D3): KO prose for all titles/sublines/buttons/empty-error copy;
EN UPPER_SNAKE status tokens stay as **badge + KO secondary label** (D6); EN nav
nouns stay in the LNB only (D3 glossary). The upgrade is **outcome-first phrasing**
(P7): the subline leads with the operator's outcome/why, then the mechanism.

### 5.1 Dashboard — before → after (subline + value points)

The D2 hero is already implemented and frozen; the refinement is the **page
subline** and keeping value-point leads outcome-first.

| Element | Before (current) | After (outcome-first) |
|---|---|---|
| Page subline (`PageHeader description`) | `프로젝트, 원천 데이터, 온톨로지 draft 상태를 빠르게 확인합니다.` | `오늘 무엇을 검수하고 게시할지 한눈에 파악하고, 바로 다음 작업으로 이동합니다.` |
| KPI label tone | `Active Projects / Sources / …` (EN labels OK as established) | keep EN labels (intentional-EN), but the helper line stays KO outcome ("운영 중인 작업 공간") — already done. |

(The frozen D2 headline/subline/3-points/CTA stay verbatim — not re-opened.)

### 5.2 Review Workbench — before → after (one workflow screen)

`ReviewWorkbenchPage.tsx` currently has English decision labels and a thin header.

| Element | Before | After |
|---|---|---|
| Decision buttons (`decisionLabels`) | `Approve / Reject / Needs discussion / Modify and approve` | `승인 / 반려 / 논의 필요 / 수정 후 승인` (KO actions per D3; the resulting *status* badge still shows the EN token `APPROVED` etc. per D6) |
| Summary line | (none / generic) | Strong summary Section: `이 항목을 게시 후보로 넘길지 결정합니다. 근거와 검증 결과를 확인하고 한 가지 결정을 선택하세요.` |
| Warning-publish helper | terse | `검증 경고가 있는 항목입니다. 게시하려면 사유를 입력해야 합니다.` (outcome → requirement) |
| Empty/queue-clear | generic | `검수할 항목이 없습니다. 추출 작업에서 새 후보를 생성하면 여기에 표시됩니다.` + CTA to Extraction (P6) |

This is presentation/copy only — `ReviewDecisionType` enum values
(`APPROVE/REJECT/REQUEST_CHANGES/MODIFY_AND_APPROVE`) are unchanged; only their
KO display labels change.

---

## 6. Prioritized change list (Frontend implements — FE6-038+)

Each row: screen/component → change → **measurable completion criterion**.
Shared primitives first, then high-traffic screens. P0 = blocking the "intuitive"
goal; P1 = high-value rollout; P2 = nice-to-have.

### P0 — centralized foundation (do first; everything inherits)

| FE id | Target | Change | Completion criterion |
|---|---|---|---|
| FE6-038 | `styles/theme.ts` + `styled.d.ts` | Add type rungs (`fontWeight.medium=500/semibold=600/bold=700`; `fontSize.xl=22px`, `xxl=28px`), spacing `section/page`, color roles (`accent/accentSoft/surfaceInfo/Success/Warning/Danger/surfaceSelected/surfaceStrong/textOnStrong`), `shadow.card/none`. Migrate the renamed `fontSize.xl`→`xxl` and `fontWeight` consumers. | `npm run build` + `npm run test` pass; theme type matches `styled.d.ts`; grep shows no `fontSize.xl` consumer still expecting 28px; no token renamed-away that breaks a screen. |
| FE6-039 | `ui/hana/HanaCard.tsx` | Extend with optional `eyebrow`, `action` (single), `emphasis` (`default/summary/info/success/warning/danger`) using new tokens. Purely additive props. | Existing call sites render unchanged; new props render header action right-aligned + emphasis surfaces; one unit/snapshot test for `emphasis="summary"` + `action`. |
| FE6-040 | `ui/platform/Section.tsx` + `Layout.tsx` (new) | Promote duplicated `ScreenGrid/Split/Stack/CardBody/Muted/BadgeRow` from `mvp2Shared/mvp3Shared` into one shared module; re-export; update those files to import from it. | No visual diff on the migrated screens; the duplicated styled defs removed from per-MVP shared files; build/test pass. |

### P1 — apply the language to high-traffic screens

| FE id | Target | Change | Completion criterion |
|---|---|---|---|
| FE6-041 | `pages/DashboardPage.tsx` | Replace inline `14/18/26/28px` + ad-hoc gaps with tokens; hero uses `shadow.soft`, KPI cards `shadow.card`; apply §5.1 outcome-first page subline; confirm exactly one primary CTA. | Dashboard uses zero hardcoded px for spacing/type that a token exists for; one solid primary button; 0 horizontal overflow at 1440/1366/1280/768; D2 hero strings unchanged. |
| FE6-042 | `pages/ReviewWorkbenchPage.tsx` | Add a `emphasis="summary"` Section header (§4.3); KO decision labels (§5.2); one primary decision button, rest secondary; collapse raw diff/audit (P6); empty/error via `PageState` with next-action CTA. | Decision buttons render KO labels while status badge still shows EN token (D6); exactly one primary button; drilldown collapsed by default; states present; build/test pass. |
| FE6-043 | Candidate Results + Sources list pages | Adopt the Section+Card grammar for rows (`shadow.card`, `surfaceSelected` active row, left accent bar); one primary header action; empty state with CTA. | Rows use shared Section module; one primary action per page; empty state offers a next action; 0 horizontal overflow at the 4 widths (Wave35 wrapper retained). |
| FE6-044 | `pages/BenchmarkComparisonPage.tsx` | Strong summary Section for the comparison result; one primary "비교 실행" action; collapse confusion-matrix drilldown + excluded-run detail (P6); honest `NOT_APPLICABLE/__NONE__/NOT_COMPARABLE` badges (D6). | Summary-first layout; one primary action; drilldown collapsed; D6 badges for the comparability/empty states; build/test pass. |
| FE6-045 | All `PageState` empty usages on touched screens | Ensure every empty state has an `actionLabel`/`onAction` next step (P6). | No touched screen shows an empty state without a next-action affordance. |

### P2 — consistency polish (low-risk, optional this wave)

| FE id | Target | Change | Completion criterion |
|---|---|---|---|
| FE6-046 | `layout/PageHeader.tsx` | Use type/spacing tokens (currently hardcodes `28px`, `18px`, `8px`) and support an optional `eyebrow`/breadcrumb-aligned spacing. | PageHeader reads from tokens; visual parity; build/test pass. |
| FE6-047 | theme | Optional `breakpoint` token map; refactor a few inline media queries to use it. | If done: breakpoints centralized; no overflow regression. Skippable. |
| FE6-048 | Remaining Analyze screens (Search/RAG/Learning Insights) | Apply Section+Card grammar opportunistically. | Each converted screen passes build/test + 0 overflow; non-blocking. |

---

## 7. Verification (for Frontend & QA)

- `npm run test`, `npm run build`.
- All mock smokes: mvp4 / mvp5 / mvp6 / benchmark / learning.
- Responsive re-check: **0 horizontal overflow** at 1440/1366/1280/768
  (`scrollWidth == clientWidth`) — the Wave35/36 invariant.
- KO page titles, D6 status badges, single active LNB item all intact.
- `git diff --check`.
- Before/after screenshots (scratchpad only) for Dashboard + 2 screens.

---

## 8. Out of scope (explicit)

- **No** full 35-screen rewrite. Only the theme, `HanaCard`, the shared layout
  module, and the screens named in §6 are touched this wave.
- **No** API / DTO / enum / route change. Decision *enum values* are unchanged;
  only KO display labels change.
- **No** new color palette beyond the semantic surface aliases in §2.3; the
  single blue accent is the only accent (P5).
- **No** dark mode, gradients, or decorative imagery (style guide prohibition).
- **No** marketing landing page — this is an internal operations console.
- **No** reopening of D1–D6 frozen decisions; this doc operationalizes them.
- Token *renames* are minimized; the only intentional rename is `fontSize.xl`→
  `xxl` (with a documented fallback option in §2.1) and the `fontWeight`
  re-map — both handled centrally in FE6-038.

---

## 9. Hand-off summary (for Frontend → QA)

- Implement P0 first (theme tokens, `HanaCard` extension, shared Section/Layout
  module), then P1 (Dashboard, Review Workbench, list pages, Benchmark, empty
  states). P2 optional.
- The product should read as ONE consistent card-based console: 3-tier hierarchy
  via the new weight/size rungs, generous token-driven whitespace, one repeating
  Section card, one primary action per screen, a single restrained blue accent,
  progressive disclosure of dense detail, and outcome-first Korean copy.
- Every change is additive and token-centralized; no per-screen hacks; all
  Wave35/36 invariants (0 overflow, KO titles, D6 badges, single active LNB)
  must survive.
