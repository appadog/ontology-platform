# Next Orders - Wave 38

Status: `DESIGN UPGRADE P2 POLISH (FE6-046/047/048)`
Date: 2026-06-29

Wave37 closed the reference-driven design language upgrade (P0/P1) as PASS.
Wave38 completes the deferred P2 polish from
`docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md` §section P2. Frontend/UX wave;
PM and Backend `NOT RUN` (decisions already frozen in PM6-020; no API change).

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Implement against the frozen design doc `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md`
  (token spec, the canonical Section+Card module §3/§4) and respect
  `docs/pm/UIUX_REMEDIATION_DECISIONS.md` (D1-D6).
- Do NOT regress Wave35/36/37: KO page titles, EN+KO status badges, single active
  LNB, 0 horizontal overflow at 1440/1366/1280/768, and the Wave37 design tokens.
- Additive, token-driven, hana only via the `src/shared/ui/hana` adapter; no
  API/DTO/enum change; keep loading/empty/error states.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-038/{ROLE}_REPORT.md`.

## Frontend Agent Order
Role: Frontend — P2 design polish
Write report: `docs/handoffs/wave-038/FRONTEND_REPORT.md`
Backlog IDs: FE6-046, FE6-047, FE6-048

- **FE6-046** `shared/layout/PageHeader.tsx`: replace hardcoded `28px`/`18px`/`8px`
  with the Wave37 type/spacing tokens; keep visual parity (no layout shift) and
  support the optional eyebrow/breadcrumb-aligned spacing per the doc.
  Done = PageHeader reads from tokens, no hardcoded px where a token exists,
  visual parity, build/test pass.
- **FE6-047** theme breakpoint token map (OPTIONAL/skippable): if low-risk, add a
  centralized `breakpoint` token map and refactor a few inline media queries to
  use it; otherwise explicitly SKIP and record why. Done (if done) = breakpoints
  centralized, no overflow regression.
- **FE6-048** Analyze screens (Search / RAG / Learning Insights): opportunistically
  adopt the canonical Section+Card grammar (`ui/platform/Section` + HanaCard) for
  visual consistency with the other screens. Done = each converted screen passes
  build/test + 0 horizontal overflow; non-blocking, convert only what is clean.

Validation (capture exact output):
- `cd apps/frontend && npm run test`
- `cd apps/frontend && npm run build`
- mock smokes that touch these screens (mvp6/benchmark/learning + any search/rag)
- responsive re-check 0 overflow at 1440/1366/1280/768 (reuse
  `apps/frontend/scripts/wave35-responsive-check.mjs`; scratchpad screenshots)
- `git diff --check`

## QA Agent Order
Role: Integration / QA — P2 polish verification
Start condition: read `docs/handoffs/wave-038/FRONTEND_REPORT.md`.
Write report: `docs/handoffs/wave-038/QA_REPORT.md`
Backlog IDs: INT6-033 P2 verification, INT6-034 regression guard

- Confirm FE6-046 PageHeader tokenization (no hardcoded px, visual parity) and
  FE6-048 Analyze-screen Section+Card adoption; confirm FE6-047 done-or-skipped
  with rationale.
- Regression: `npm run test`, `npm run build`, mock smokes; confirm 0 overflow
  retained and no regression of KO titles / status badges / single active LNB /
  Wave37 tokens. No API/DTO change.
- Recommend closeout. Exact commands; no leftover listeners on 5173/8000;
  `git diff --check`.
