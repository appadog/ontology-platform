# [FRONTEND] Report - Wave 59

## 담당 범위
- backlog ID: PM6-039
- 작업 경로: `apps/frontend` (token + shared-primitive level only, per `docs/pm/DESIGN_DIRECTION_AI_SAAS_UPGRADE.md`, sections 0-8)

## 완료한 작업
Additive-only design-system upgrade. No route/API/DTO/enum changes; no page rewrites beyond the 3 showcase pages named in the doc.

### §2 토큰 변경 (theme.ts) — DONE
- Added `color.surfaceBase/surfaceCard/surfaceOverlay/surfaceAccentPanel` (aliases, literal values from the doc).
- Added `radius.base` (10px) and `radius.lg` (14px) / `radius.xl` (18px); `radius.sm`/`radius.md` untouched (6px/8px).
- Added `layout.contentWidth.{small,default,full}` = 720px / 1200px / none.
- Added `sidebarWidthCollapsed` = 72px (existing `sidebarWidth` = 248px untouched).
- `styled.d.ts` needed no edit — it does `type PlatformTheme = typeof theme`, so it picks up the new keys automatically.

### §3 타이포그래피 — DONE
- Added `@fontsource/inter` (self-hosted npm package, no CDN) to `package.json`; imported weights 400/500/600/700/800 in `GlobalStyle.ts`.
- Added a global `h1, h2, h3 { font-weight: 700; letter-spacing: -0.01em; }` rule. Existing component-level heading styles (e.g. `HanaCard`'s `h2` at `fontWeight.semibold`=600) have higher CSS specificity (class + element vs. bare element) and are unaffected — verified via build/tests and live render.
- Verified in-browser: `document.fonts` reports `Inter 400 loaded` etc., and network requests show the woff2 files are actually fetched (200/304), not falling back to `system-ui`.

### §4 컴포넌트 변경 — DONE
- `HanaCard`: added `radius?: "md" | "lg"` prop (default `"md"`, byte-identical to prior output); `lg` applies `theme.radius.lg` via `data-radius="lg"`.
- `PageState`: added `size?: "xs" | "sm" | "lg" | "xl"` prop, default `"sm"` — the default renders the exact same box as before (verified via existing `HanaCard.test.tsx`-style back-compat reasoning; all ~43 existing call sites omit `size` and are unaffected).
- New `src/shared/ui/platform/Skeleton.tsx`: `variant="table-row" | "card"` skeleton with shimmer animation using theme tokens, plus an exported `useDelayedVisible(delayMs=300)` hook so adopters only paint the skeleton once a load exceeds 300ms (NN/g gating), avoiding a flash on fast responses.
- New `src/shared/layout/PageContainer.tsx`: `width?: "small" | "default" | "full"` (default `"default"`) wrapping children in a `max-width` container driven by `theme.layout.contentWidth`.

### §5 AppShell 데스크톱 사이드바 축소 — DONE
- Added a desktop-only collapse toggle (chevron button, bottom of sidebar): expanded 248px (icons+labels) ↔ collapsed 72px (icon-only rail with `title` tooltips; labels are visually hidden via clip-rect but remain in the accessibility tree).
- State persisted to `localStorage` key `ontology-platform:sidebar-collapsed`; verified it survives a hard reload.
- Scoped entirely to `@media (min-width: 861px)` — the wave-058 mobile drawer (`navOpen` state, `data-open` attribute, `@media (max-width: 860px)` rules) is untouched and was re-verified working (see Validation).
- **Regression found and fixed during implementation**: the sidebar is `position: sticky; height: 100vh` with the collapse toggle pinned to the bottom via `margin-top: auto` on a flex column. With many project nav groups, the nav content is taller than the viewport and, without its own scroll region, pushed the toggle button below the visible viewport (unreachable). Fixed by giving `Nav` `flex: 1 1 auto; min-height: 0; overflow-y: auto` scoped to the desktop breakpoint only (mobile drawer's grid layout is unaffected). Verified visually (scrollbar in the nav column, toggle button visible and clickable).

### §6 Showcase pages — DONE (3 of the 2-3 named)
- `DashboardPage.tsx`: wrapped in `<PageContainer width="default">`; loading branch now shows `Skeleton` (card + table-row variants) gated by `useDelayedVisible(300)` instead of the old spinner `PageState`.
- `ReviewInboxPage.tsx`: wrapped in `<PageContainer width="default">`; loading branch uses `Skeleton variant="table-row"` gated the same way.
- `PublishedGraphExplorerPage.tsx`: wrapped in `<PageContainer width="full">` (graph surface — no max-width cap, per §4/P4). Left its nested `ExplorerView`'s own loading/error `PageState` untouched (out of showcase scope; §7 explicitly excludes a blanket rewrite).

No other pages were touched — the remaining ~47 routes inherit the new tokens/typography purely through `theme.ts`/`GlobalStyle.ts`/`HanaCard`/`PageState`/`AppShell`.

## 변경 파일
- `apps/frontend/package.json`, `apps/frontend/package-lock.json` — add `@fontsource/inter`
- `apps/frontend/src/shared/styles/theme.ts`
- `apps/frontend/src/shared/styles/GlobalStyle.ts`
- `apps/frontend/src/shared/ui/hana/HanaCard.tsx`
- `apps/frontend/src/shared/ui/platform/PageState.tsx`
- `apps/frontend/src/shared/ui/platform/Skeleton.tsx` (new)
- `apps/frontend/src/shared/layout/PageContainer.tsx` (new)
- `apps/frontend/src/shared/layout/AppShell.tsx`
- `apps/frontend/src/pages/DashboardPage.tsx`
- `apps/frontend/src/pages/ReviewInboxPage.tsx`
- `apps/frontend/src/pages/PublishedGraphExplorerPage.tsx`

`apps/frontend/src/shared/styles/styled.d.ts` was inspected but needed no change (it derives the theme type from `typeof theme`).

## 실행/검증
- `npm run test` (final run):
  ```
  Test Files  17 passed (17)
       Tests  116 passed (116)
  ```
  Note: mid-session one run showed `mvp6GovernanceMock.test.ts` timing out on a single test (5000ms) under full-suite parallel load. Verified this is a pre-existing flake unrelated to this change — it passes standalone (`npx vitest run src/shared/api/mvp6GovernanceMock.test.ts`, 6063ms) on unmodified `main`, and passed again in both full-suite reruns after this change (116/116 twice).
- `npm run build` (final run): `tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json && vite build` → `✓ built in 2.29s`, no TS errors.
- `git diff --check`: clean (exit 0, no output).
- Dev server (`npm run dev` via a temporary `.claude/launch.json`, removed after verification) + browser checks, all via the Browser pane at `http://localhost:5173`:
  - **Dashboard** and **Published Graph Explorer** (desktop 1280px): screenshots confirm new hero/card/heading styling renders, Inter font visible, no layout breakage.
  - **Inter font actually loads**: `document.fonts` reports e.g. `"Inter 400 loaded"`; network log shows `GET /node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2 → 200 OK` (not falling back to `system-ui`). Computed `letter-spacing` on `<h1>` = `-0.28px` = `-0.01em` of 28px, confirming the heading rule applies.
  - **Sidebar collapse toggle**: clicked, rail collapses to icon-only 72px width with visible chevron flip; `localStorage.getItem("ontology-platform:sidebar-collapsed")` → `"true"`. Reloaded the page (`navigate` to `/dashboard`) — sidebar stayed collapsed, confirming persistence.
  - **Mobile drawer (375×812)**: no horizontal overflow (`document.documentElement.scrollWidth === window.innerWidth === 375` both before and after opening the drawer). Opening the hamburger button correctly expands the grouped nav grid (BUILD/REVIEW/PUBLISH/ANALYZE headers preserved); closing collapses it again. Confirms wave-058 behavior is unchanged.
  - **Route spot-check** (7 routes, more than the 5-6 suggested): `/dashboard`, `/projects`, `/projects/:id/review`, `/projects/:id/published-graph`, `/projects/:id/quality`, `/projects/:id/learning-insights` (MVP6.2), `/projects/:id/governance` (MVP6.5), `/projects/:id/copilot` (MVP6.8), `/admin` — all rendered without console errors or visual breakage.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세: 순수 프레젠테이션 레이어 변경 (토큰/프리미티브/AppShell). 백엔드/라우트/DTO/enum 미변경.
- 영향받는 역할: 없음

## Blocker
- 없음 (모든 검증 통과)

## 남은 TODO
- None required by this wave's scope. Optional future follow-up (not requested): apply `PageContainer`/`Skeleton` more broadly if a later wave wants it — §7 explicitly keeps this out of scope for wave-59.

## 다른 역할에 전달할 내용
- PM: 완료 기준(§8) 전항목 충족 — 토큰/컴포넌트/AppShell 데스크톱 collapse/쇼케이스 3페이지/검증 전부 확인.
- Backend: 영향 없음 (프론트엔드 프레젠테이션 레이어만 변경).
- Frontend (later waves): if adding many more sidebar nav items in the future, note the `Nav` desktop scroll-region fix in `AppShell.tsx` (`flex: 1 1 auto; overflow-y: auto` under `@media (min-width: 861px)`) — without it the collapse-toggle button can be pushed off-viewport.
- QA: recommend re-checking the sidebar collapse toggle after any future AppShell nav-item additions (regression class documented above already fixed here, but worth a regression check going forward).

## 총괄에게 요청하는 결정
- 없음

## 현재 판정
- PASS
