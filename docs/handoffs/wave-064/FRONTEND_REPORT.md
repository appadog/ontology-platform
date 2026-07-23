# Frontend Report - Wave 64

## 담당 범위
- backlog ID: `PM6-042`
- 작업 경로: `apps/frontend/` — visual redesign import per `docs/pm/DESIGN_DIRECTION_CLAUDE_DESIGN_IMPORT.md` (frozen spec)

## 완료한 작업
- §1 token diff applied to `theme.ts` (value-only, additive; no key renamed/removed):
  `primary` → `#2563eb`, added `primaryHover`/`primaryActive`, zinc neutral shift
  (`surface`/`surfaceRaised`/`surfaceMuted`/`border`/`borderStrong`/`text`/`textMuted`),
  added `surface3`/`borderSubtle`/`textSecondary`, `positive`/`positiveSoft`/`danger`
  updated, shadow rgba tint moved from blue (23,32,51) to zinc (24,24,27), added
  `shadow.md`. `radius`, `warning`, `dangerSoft`, `progress` left untouched per doc.
- Self-hosted `@fontsource/newsreader` added (600-italic only), imported and scoped
  ONLY inside `AppShell.tsx` to the sidebar wordmark — verified zero
  `fonts.googleapis.com`/`fonts.gstatic.com` network requests at runtime.
- §2.1 AppShell: sticky translucent-blur topbar (`rgba(255,255,255,.88)` +
  `blur(10px)`), avatar-initials user chip with initials computed programmatically
  via a new `actorInitials()` helper (not hardcoded "DA"), nav hover/active
  restyled to the surface-2 neutral treatment (not accent-colored), group-header
  micro-typography updated to 11px/700/0.08em uppercase. Applied to the FULL real
  nav (~18 items across BUILD/REVIEW/PUBLISH/ANALYZE) — verified via
  `read_page` + live click-through (Quality, Governance, Copilot spot-checked).
  TenantSwitcher, ProjectSelector, CommandPalette, mobile drawer, desktop collapse
  all verified unchanged in behavior.
- §2.2 Dashboard: hero restyled to a dark gradient card (`text` → `#27272a`
  gradient, `shadow.md`), added an eyebrow line reusing the headline's own
  existing closing phrase ("온톨로지 운영 플랫폼" — not new copy), restyled the two
  existing CTAs (solid white / outlined ghost), restyled the 3 value-prop cards,
  4-metric grid (`MetricCard`, shared primitive), and recent-activity row hover —
  all real copy/data untouched.
- §2.3 Projects: primary-button unchanged (see Deviations), project rows now
  show a real-name-driven initial-letter avatar square (accent-soft tint), added
  the 3-link "빠른 이동" quick-access card for the selected project, linking to
  real routes `/projects/:id/ontology`, `/projects/:id/sources`,
  `/projects/:id/review`.
- §2.4 Ontology Modeler: existing accent-soft active-class-row treatment already
  matched the mock; authoring panel and all real data paths untouched.
- §2.5 Sources: added the dashed-border dropzone visual wrapper (upload-cloud
  icon in an accent-soft badge, hint + caption text) around the existing
  (unchanged) upload wiring; source list continues to reuse `StatusBadge`/
  `HanaBadge`/`CompactTable`.
- §2.6 Review Inbox: `HanaSelect` filters already matched the mock's compact
  select spec (38px height, bordered) with no changes needed; added a card-row
  hover treatment (`ReviewTable`, a `styled(CompactTable)` extension) without
  altering table structure — all real columns preserved.

## 변경 파일
- `apps/frontend/src/shared/styles/theme.ts` — §1 token values
- `apps/frontend/src/shared/layout/AppShell.tsx` — §2.1
- `apps/frontend/src/pages/DashboardPage.tsx`, `apps/frontend/src/shared/ui/platform/MetricCard.tsx` — §2.2
- `apps/frontend/src/pages/ProjectListPage.tsx` — §2.3
- `apps/frontend/src/pages/SourceManagerPage.tsx` — §2.5
- `apps/frontend/src/pages/ReviewInboxPage.tsx` — §2.6
- `apps/frontend/package.json` / `package-lock.json` — added `@fontsource/newsreader`
- (`apps/frontend/src/shared/styles/styled.d.ts` — inspected, no change needed:
  it types `DefaultTheme` via `typeof theme`, so new keys flow through automatically)

## 실행/검증
- 실행한 명령 (all from `apps/frontend/`):
  - `npm run test` → **18 test files, 121 tests, all PASS**
  - `npm run build` → **tsc + vite PASS** (bundle warning about chunk size is
    pre-existing, unrelated to this wave)
  - `git diff --check` (repo root) → **clean, exit 0**
- Dev server (`npm run dev`, port 5173) booted against the app's existing mock
  API layer (real fixture data, not hand-authored). Verified via live browser:
  - Computed style: avatar-initials chip background `rgb(37, 99, 235)` = `#2563eb`
    (new `primary`) ✓
  - Sidebar wordmark computed style: `font-family: Newsreader, serif`,
    `font-style: italic`, `font-weight: 600`, `font-size: 21px` on the visible
    (desktop) instance ✓
  - `performance.getEntriesByType('resource')` — zero entries matching
    `fonts.googleapis.com` / `fonts.gstatic.com` ✓
  - Screenshotted Dashboard, Projects, Ontology Modeler, Sources, Review Inbox at
    desktop width (1440×2000) — dark-gradient hero, zinc neutrals, avatar chip,
    flat metric/value-prop cards, project avatar squares + quick-links card,
    dashed dropzone, and Ontology/Review real-data rendering all confirmed visually.
  - Full real nav (18 links incl. Quality/Governance/Copilot) enumerated via
    `read_page`; clicked Quality and confirmed correct navigation + active-state
    styling.
  - Mobile drawer (375×812): opened via hamburger, full nav renders (all groups),
    `document.documentElement.scrollWidth === window.innerWidth` (375 = 375, **0
    horizontal overflow**).
  - Desktop icon-rail collapse: toggled via the existing button, labels hidden,
    icons remain, toggle arrow flips — unaffected by the new nav hover/active CSS.
  - Dev server + any backend listeners torn down; confirmed no process on
    5173/8000 afterward.
- 실행하지 못한 검증: none — a full-stack (Docker) backend was not available in
  this sandbox, but the frontend's built-in mock-data layer served realistic
  data for every touched page, so no page needed to be verified in an
  error/loading-only state.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세: presentation-only wave; no request/response shapes, enums, or routes
  changed.
- 영향받는 역할: 없음

## Blocker
- 없음

## 남은 TODO
- None required by the frozen doc. Optional follow-up (not requested): the
  mock's exact 8px `radius.md` / 16px card radius could be introduced as a new
  token rung later if design wants pixel-exact radii instead of reusing the
  existing `radius.lg` (14px) — left alone per §1's explicit "leave radius
  unchanged" instruction.

## 다른 역할에 전달할 내용
- PM: all 6 screens (§2.1–§2.6) are DONE against the frozen doc; one deviation
  documented below (HanaButton primary variant) needs a decision if pixel-exact
  accent-pill buttons are required.
- Backend: no impact.
- QA: recommend spot-checking the avatar-initials chip if `dev-admin` is ever
  renamed — `actorInitials()` in `AppShell.tsx` derives from
  hyphen/underscore/space-separated segments, capped at 2 characters.
- Frontend (future waves): `MetricCard` (shared/ui/platform) was restyled as
  part of this wave since Dashboard reuses it — it's also used by ~9 other pages
  (ProjectDetail, EvaluationDatasets, Connectors, SourceProfiling, TenantContext,
  Copilot, OntologyPacks, LearningInsights, GraphVizSummary); the new flat/bordered
  look is applied there too (additive token values only, no layout change), which
  is consistent with the doc's "reuse real primitives" principle but is a larger
  blast radius than the Dashboard-only scope — flagging for visibility.

## 총괄에게 요청하는 결정
- Deviation: doc §2.3 asks to "restyle button to solid accent pill matching mock"
  for the Projects page's "New Project" button. `HanaButton` (`variant="primary"`)
  wraps a third-party component (`hana-style-component/input`'s `ButtonNoTokens`)
  whose `buttonStyle="primary"` visual is NOT driven by our `theme.color.primary`
  — it's the library's own hardcoded styling. Restyling it correctly would mean
  either forking a page-local button (violates "reuse real primitives, don't fork
  parallel one-off styled components") or overriding `HanaButton` globally
  (changes every primary button app-wide, well beyond this wave's 6-screen scope).
  Left `HanaButton` untouched pending a decision: (a) accept as-is, (b) scope a
  follow-up wave to retheme `HanaButton` itself app-wide, or (c) authorize a
  page-local override for Projects only.

## 현재 판정
- PASS
