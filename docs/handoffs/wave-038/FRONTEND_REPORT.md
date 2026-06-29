# Frontend Report - Wave 38

P2 design polish — completes the deferred FE6-046/047/048 from the Wave37
reference-driven design upgrade (`docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md`
§6 P2). Additive, token-driven, presentation-only. PM/Backend NOT RUN (no
API/DTO/enum change; decisions frozen in PM6-020).

## 담당 범위
- backlog ID: FE6-046, FE6-047, FE6-048
- 작업 경로:
  - `apps/frontend/src/shared/layout/PageHeader.tsx` (FE6-046)
  - `apps/frontend/src/pages/IntegratedSearchPage.tsx` (FE6-048)
  - `apps/frontend/src/pages/RagAnswerWorkspacePage.tsx` (FE6-048)
  - `apps/frontend/src/pages/LearningInsightsPage.tsx` (FE6-048)

## 완료한 작업

### FE6-046 — PageHeader tokenization (DONE)
- Replaced hardcoded values with the Wave37 tokens where an exact rung exists,
  with full visual parity (token value == prior literal):
  - `h1 font-size: 28px` → `theme.typography.fontSize.xl` (== 28px)
  - `h1 line-height: 1.2` → `theme.typography.lineHeight.tight` (== 1.2)
  - `p margin: 8px 0 0` → `theme.spacing.sm 0 0` (== 8px)
- Added an optional `eyebrow?: string` prop (breadcrumb-aligned uppercase muted
  kicker), matching the canonical Section card eyebrow grammar (§3.1). Purely
  additive — existing call sites (title/description only) render unchanged.
- Intentionally left as-is (no exact token rung exists; preserved to avoid any
  layout shift): Header flex `gap: 18px`, Actions `gap: 10px`, `p line-height:
  1.55`, `p max-width: 760px`, the `@media (max-width: 760px)`. Documented inline
  with a comment so this is explicit, not an oversight.
- Done criteria met: reads from tokens, no hardcoded px where a token exists,
  visual parity, build/test pass.

### FE6-047 — breakpoint token map (SKIPPED)
- **SKIPPED — recorded reason.** The design doc §2.5 itself flags this as
  "advisory / P2-nice-to-have, not required this wave." Media queries are spread
  across many files at heterogeneous values (760/780/860/880/900/1020/1040/1100/
  1120/1280). A `theme.breakpoint` object cannot be interpolated cleanly inside
  styled-components `@media (max-width: ...)` template literals without a helper
  layer, and refactoring the inline queries across the touched + neighbouring
  files would broaden the blast radius and put the Wave35/36 0-overflow invariant
  at risk for no user-visible gain. This is precisely the "risky to convert" case
  the order allows skipping. Kept out of scope to stay additive/low-risk.

### FE6-048 — Analyze screens adopt the canonical Section+Card grammar (DONE)
The three Analyze screens already used the canonical card module (`HanaCard`) and
the shared layout primitives (`Stack`/`CardBody`/`Muted` re-exported via
`ui/platform/Section`). The opportunistic, clean, zero-layout-shift adoption was:
- **Card emphasis hierarchy (P1/P2):** marked the repeated/secondary cards as
  `emphasis="default"` (flat `shadow.card`), reserving the strong `shadow.soft`
  for the ONE summary card per screen:
  - Search: result-group cards + Vector adapter + Similar evidence → `default`
    (the "Search query" toolbar card stays the strong summary).
  - RAG: Answer / Insufficient evidence / Citations / Linked published facts →
    `default` (the "Question" card stays the strong summary).
  - Learning Insights: "Learning signal taxonomy" card → `default` (the dark
    `StrongSummary` hero stays the one strong surface).
- **Surface-token consistency (P5, no color shift — all swaps are exact aliases):**
  in Learning Insights replaced inline hex with the Wave37 surface tokens:
  `#0f172a`→`color.surfaceStrong`, `#f8fafc`→`color.textOnStrong`,
  `#fff7ed`→`color.surfaceSelected`, `#ecfeff`→`color.surfaceInfo`,
  `#fffbeb`→`color.surfaceWarning` (×2), `#ecfdf5`→`color.surfaceSuccess`.
- loading/empty/error states preserved on all three screens (unchanged
  `PageState` usage); no API/DTO touched.
- Done criteria met: each screen builds/tests + 0 horizontal overflow at
  1440/1366/1280/768.

## 변경 파일
- `apps/frontend/src/shared/layout/PageHeader.tsx` — tokenize + optional eyebrow
- `apps/frontend/src/pages/IntegratedSearchPage.tsx` — 3 cards → `emphasis="default"`
- `apps/frontend/src/pages/RagAnswerWorkspacePage.tsx` — 4 cards → `emphasis="default"`
- `apps/frontend/src/pages/LearningInsightsPage.tsx` — 1 card → `default` + 7 surface-token swaps

(Other working-tree changes — theme.ts, HanaCard.tsx, mvp3Shared.tsx, Dashboard/
Review/Candidate/Source/Benchmark/MetricCard, Section.tsx/Layout.tsx — are the
uncommitted Wave37 FE6-038..045 work already present in the tree; NOT touched
this wave.)

## 실행/검증
- 실행한 명령 + 결과:
  - `npm run test` → **31 passed (9 files)**, 0 failed.
  - `npm run build` → **clean** (tsc app + node + vite build; built in 2.20s, no
    TS/build errors).
  - Mock smokes (dev server on 5173):
    - `smoke:mvp4:mock` → **PASS** (search + rag screenshots captured)
    - `smoke:mvp6:mock` → **PASS**
    - `smoke:mvp6:learning:mock` → **PASS** (routeCount 6 / screenshots 6)
    - `smoke:mvp6:benchmark:mock` → **PASS** (routeCount 5 / screenshots 5)
  - Responsive re-check (Wave35 invariant routes, `scripts/wave35-responsive-check.mjs`,
    label=wave38): ontology-modeler + candidate-results → **0 horizontal overflow
    on all 6 resolutions** (1920/1440/1366/1280/1024/768; scrollW==clientW).
  - Responsive re-check (Analyze screens touched, scratchpad script): search / rag /
    learning-insights → **0 horizontal overflow at 1440/1366/1280/768** (all
    scrollW==clientW, status 200).
  - `git diff --check` → **CLEAN** (no whitespace errors).
  - Ports after run: 5173 free, 8000 free (no leftover listeners).
- 실행하지 못한 검증: `*:actual` smokes (mvp6/learning/benchmark/mvp4 actual) NOT
  RUN — backend (8000) was not booted this wave; these are the standing
  backend-up gate follow-up. No contract change in this wave, so mock coverage is
  representative for P2 presentation polish.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세: presentation/token-only. No endpoint, DTO, enum, route, or fixture shape
  changed. `hana` used only via the `src/shared/ui/hana` adapter (HanaCard).
- 영향받는 역할: 없음

## Blocker
- 없음.

## 남은 TODO
- FE6-047 breakpoint token map remains a deliberate non-blocking SKIP (rationale
  above); a future dedicated wave could centralize it with a `@media` helper if
  desired.
- Run the design `*:actual` smokes at the next backend-up gate (carried from
  Wave37; no contract change this wave).

## 다른 역할에 전달할 내용
- PM: no scope/decision change needed; FE6-047 skipped per doc §2.5 as advisory.
- Backend: NOT RUN — no API/DTO/enum change.
- Frontend: PageHeader now accepts an optional `eyebrow`; new screens may use it.
- QA: verify FE6-046 tokenization (no hardcoded px where a token exists, visual
  parity) and FE6-048 emphasis/surface-token adoption; confirm FE6-047 skip
  rationale; regression — KO titles / EN+KO status badges / single active LNB /
  Wave37 tokens / 0 overflow all retained.

## 총괄에게 요청하는 결정
- Accept FE6-047 as SKIPPED (advisory P2) and close the Wave37 P2 follow-up set
  (FE6-046 DONE, FE6-048 DONE, FE6-047 SKIPPED).

## 현재 판정
- PASS (FE6-046 DONE, FE6-048 DONE, FE6-047 SKIPPED with recorded rationale). No
  regression; tests 31/31, build clean, 4 mock smokes PASS, 0 horizontal overflow
  retained at 1440/1366/1280/768 for Candidate Results + Ontology Modeler + the
  three Analyze screens; git diff --check clean; ports free.
