# QA / Integration Report - Wave 38

P2 design polish verification (FE6-046/047/048) + regression guard. Independent
verification of the Frontend PASS report. Backend NOT RUN (no API/DTO/enum
change). PM NOT RUN (decisions frozen in PM6-020).

## 담당 범위
- backlog ID: INT6-033 (P2 verification), INT6-034 (regression guard)
- 검증 경로:
  - `apps/frontend/src/shared/layout/PageHeader.tsx` (FE6-046)
  - theme breakpoint map (FE6-047, SKIPPED)
  - `apps/frontend/src/pages/IntegratedSearchPage.tsx`,
    `RagAnswerWorkspacePage.tsx`, `LearningInsightsPage.tsx` (FE6-048)

## 완료한 작업 (per-item verdicts)

### FE6-046 — PageHeader tokenization → PASS
- Verified in source + diff: the prior hardcoded `font-size: 28px`,
  `line-height: 1.2`, `margin: 8px 0 0` are now
  `theme.typography.fontSize.xl` (==28px), `lineHeight.tight` (==1.2),
  `spacing.sm` (==8px). All three are EXACT-VALUE token aliases → visual parity,
  no layout shift.
- Token reality check: this repo took the commander-frozen NON-BREAKING
  ADDITIVE path (`fontSize.xl` stays 28px; `lgPlus`=22px was added). So
  `fontSize.xl`==28px is correct for the H1; the FE report's parity claim holds.
- Optional `eyebrow?: string` prop is purely additive and gated by `eyebrow &&`;
  existing call sites (title/description only) render byte-identically. The new
  `Eyebrow` styled span is fully token-driven (xs/semibold/spacing.xs/textMuted).
- Remaining literals `gap: 18px` (Header) / `gap: 10px` (Actions) / `p
  line-height: 1.55` / `p max-width: 760px` / `@media (max-width:760px)` are left
  as-is. There is NO exact token rung at 18/10/1.55/760, so leaving them honors
  "no hardcoded px WHERE A TOKEN EXISTS" and the no-layout-shift requirement.
  Documented inline — explicit, not an oversight. Acceptable.

### FE6-047 — breakpoint token map → SKIPPED (judged ACCEPTABLE)
- The design doc §2.5 explicitly flags this as "advisory / P2-nice-to-have, not
  required this wave," and NEXT_ORDERS marks it "OPTIONAL/skippable … otherwise
  explicitly SKIP and record why."
- FE recorded a concrete rationale: media queries are heterogeneous
  (760/780/860/880/900/1020/1040/1100/1120/1280) and cannot be interpolated
  cleanly inside styled-components `@media` template literals without a helper
  layer; refactoring would broaden blast radius and risk the 0-overflow
  invariant for no user-visible gain.
- QA judgment: the skip is consistent with the doc's advisory note and is the
  lower-risk choice. ACCEPTABLE.

### FE6-048 — Analyze screens adopt canonical Section+Card grammar → PASS
- Card emphasis hierarchy verified in diff (one strong summary per screen, rest
  flattened):
  - Search: result-group + Vector adapter + Similar evidence → `emphasis="default"`
    (3 cards); the Search-query toolbar card stays the strong summary.
  - RAG: Answer / Insufficient evidence / Citations / Linked published facts →
    `emphasis="default"` (4 cards); the Question card stays the strong summary.
  - Learning Insights: "Learning signal taxonomy" → `emphasis="default"`; the dark
    `StrongSummary` hero stays the one strong surface.
- HanaCard emphasis mapping confirmed: `default` → `shadow.card` (flat);
  prop default stays `"summary"` (`shadow.soft`) so UNTOUCHED call sites keep
  the prior look (additive, no regression).
- Surface-token swaps in Learning Insights verified as EXACT aliases (no color
  shift): `#0f172a`→`surfaceStrong`, `#f8fafc`→`textOnStrong`,
  `#fff7ed`→`surfaceSelected`, `#ecfeff`→`surfaceInfo`, `#fffbeb`→`surfaceWarning`
  (×2), `#ecfdf5`→`surfaceSuccess` (7 swaps; values match `theme.ts` 1:1).
  Post-swap grep confirms 0 of those hexes remain; the only residual hexes are
  `#94a3b8`/`#cbd5e1` (slate text, no token alias) — correctly untouched.
- loading/empty/error states preserved (unchanged `PageState` usage on all three).
- No API/DTO/route/fixture-shape change.

## 실행/검증 (EXACT commands + output)

### INT6-034 regression
- `cd apps/frontend && npm run test` → **31 passed (9 files), 0 failed**
  (incl. `HanaCard.test.tsx` 3 tests).
- `cd apps/frontend && npm run build` → **clean** (tsc app + node + vite;
  `✓ built in 2.16s`, no TS/build errors).
- Mock smokes (dev server on 127.0.0.1:5173, default mock mode):
  - `smoke:mvp4:mock` (search + rag) → **PASS** (`"status":"PASS"`; search + rag
    screenshots captured; all routes status 200).
  - `smoke:mvp6:mock` → **PASS** (`"status":"PASS"`).
  - `smoke:mvp6:learning:mock` → **PASS** (`"status":"PASS"`, routeCount 6).
  - `smoke:mvp6:benchmark:mock` → **PASS** (`"status":"PASS"`, routeCount 5).
- Responsive 0-overflow (Wave35 script, label=wave38-qa) — **Candidate Results +
  Ontology Modeler**: scrollW==clientW, overflowX=0 at 1920/1440/1366/1280/1024/768
  (`RESULT: 0 horizontal overflow on all routes/resolutions`).
- Responsive 0-overflow (touched Analyze screens, scratchpad probe) — **search /
  rag / learning-insights**: scrollW==clientW, overflowX=0, status 200 at
  1440/1366/1280/768 (`RESULT: 0 horizontal overflow on Analyze screens`).
- No-regression DOM probe (1440) on Analyze screens:
  - KO page titles intact: search="통합 검색", rag="RAG 답변 작업 공간",
    learning-insights="학습 인사이트".
  - Single active LNB: exactly 1 `aria-current="page"` per route
    (Search / RAG / Learning Insights). EN nav nouns per D3.
- `git diff --check` → **CLEAN** (no whitespace errors).
- Ports after run: 5173 free, 8000 free (no leftover listeners).

### 실행하지 못한 검증
- `*:actual` smokes (mvp4/mvp6/learning/benchmark actual) NOT RUN — backend (8000)
  not booted this wave. This is the standing backend-up gate follow-up carried
  from Wave37. No contract change this wave, so mock coverage is representative
  for P2 presentation-only polish. Non-blocking.

## API/Enum/DTO 변경
- 변경 여부: 없음 (verified — presentation/token-only; no endpoint/DTO/enum/route).

## Blocker
- 없음.

## 남은 TODO
- Run the design `*:actual` smokes at the next backend-up gate (carried from
  Wave37; no contract change this wave).
- FE6-047 breakpoint centralization remains a deliberate non-blocking SKIP; a
  future dedicated wave could add it with a `@media` helper layer.

## 다른 역할에 전달할 내용
- PM: FE6-047 SKIP is consistent with doc §2.5 (advisory); no scope/decision
  change needed.
- Backend: NOT RUN — no API/DTO/enum change.
- Frontend: PageHeader now accepts optional `eyebrow`; HanaCard `emphasis`
  default stays `summary` (untouched call sites unchanged).
- QA: design-upgrade track (Wave37 P0/P1 + Wave38 P2) is fully verified;
  recommend closeout.

## 총괄에게 요청하는 결정
- Accept FE6-046 PASS, FE6-048 PASS, FE6-047 SKIPPED (advisory, acceptable
  rationale). Close the reference-driven design-upgrade track (Wave37 + Wave38).
- Carry the single non-blocking follow-up (`*:actual` design smokes at next
  backend-up gate) onto the standing follow-up list.

## 현재 판정
- OVERALL: **PASS** — design-upgrade track CLOSEOUT recommended.
- FE6-046 PASS, FE6-048 PASS, FE6-047 SKIPPED (acceptable).
- No regression: KO page titles, single active LNB (1 `aria-current`/route),
  Wave37 design tokens, and 0 horizontal overflow at 1440/1366/1280/768 (and the
  full 6-resolution Wave35 set for Candidate Results + Ontology Modeler) all
  retained. 31/31 tests, build clean, 4 mock smokes PASS, git diff --check clean,
  ports free.
