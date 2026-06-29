# Next Orders - Wave 37

Status: `REFERENCE-DRIVEN DESIGN LANGUAGE UPGRADE (intuitive / easy-to-use)`
Date: 2026-06-29

User goal: make the web UI/UX more intuitive and easy to use, referencing two
sites — `https://wwit.design` (UI pattern library) and `https://ai.codle.io/kr`
(product site). Translate their PRINCIPLES into our operational
knowledge-graph console (do NOT copy their landing-page structure wholesale — we
are an internal operations product, not a marketing page). PM/Design writes a
design-direction MD; Frontend implements against it; QA verifies.

Sequence: PM/Design -> Frontend -> QA. Backend `NOT RUN` (no API/DTO/enum change).

## Reference takeaways (from commander WebFetch)
- wwit.design: hierarchical filtering / progressive disclosure, consistent card
  modularity, thumbnail/preview chains, high-contrast minimal type, blue accent,
  moderate density with breathing room.
- ai.codle.io: hero-first clarity, minimal persistent nav + one clear primary
  action, 3-tier visual hierarchy, OUTCOME-first conversational Korean copy
  (why before what, no jargon), neutral base + a few bright accent cards,
  generous whitespace, one repeating card module (icon + headline + 2-3 points +
  "더 알아보기"), numbered/ordered sections, value -> proof -> next action.

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Build on the already-closed UI/UX work: `docs/pm/UIUX_REVIEW_FULL_PRODUCT.md`,
  `docs/pm/UIUX_REMEDIATION_DECISIONS.md` (D1-D6), `docs/adr/0010-...md`,
  `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md`.
- Preserve product invariants and all functionality; this is presentation/IA
  polish, additive and token-driven. No new product scope, no API change.
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-037/{ROLE}_REPORT.md`.

## PM / Design Agent Order (runs FIRST, blocks Frontend)
Role: PM / Product Designer — Design direction doc
Write report: `docs/handoffs/wave-037/PM_REPORT.md`
Backlog ID: `PM6-020` reference-driven design direction
Deliverable: `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md`

Translate the two references into CONCRETE, FE-actionable design direction for
our app, grounded in the real token system + components. Cover at least:
- Design principles adopted (outcome-first copy, one card module, generous
  whitespace scale, 3-tier hierarchy, progressive disclosure, one clear primary
  action per screen, restrained accent usage).
- A refined design-token spec (spacing scale, type scale + weights, color roles
  incl. a single accent + neutral base, radius, elevation) expressed against the
  existing tokens so FE changes are centralized, not per-screen hacks.
- A canonical "Section + Card" module spec (header, supporting line, content,
  optional action) FE can reuse across screens.
- Per-screen-type guidance: Dashboard (value/onboarding clarity + next action),
  list/table screens, detail/workbench screens, empty/loading/error states.
- Outcome-first Korean microcopy guidance consistent with D3 (page titles KO,
  status tokens EN+KO badge); give example before/after copy for Dashboard and
  one workflow screen.
- A prioritized change list (P0/P1/P2) mapped to specific screens/components,
  each with a completion criterion, that Frontend will implement.
Keep it bounded and additive — prioritize shared primitives + high-traffic
screens over rewriting all 35 screens.

Validation: `git diff --check`. Do NOT touch apps/.

## Frontend Agent Order (runs AFTER PM doc exists)
Role: Frontend — Implement the design direction
Start condition: read `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md` + PM report.
Write report: `docs/handoffs/wave-037/FRONTEND_REPORT.md`
Backlog IDs: `FE6-038`+ (one per prioritized change)

Implement the P0/P1 (and P2 where low-risk) changes from the design doc:
- Centralize via tokens/shared primitives first (spacing, type scale, color
  roles, the Section+Card module) so screens inherit the new language.
- Apply to Dashboard (value/onboarding + clear next action) and the main
  list/detail/workbench screens; keep loading/empty/error states and improve
  empty states to guide the next action.
- Apply outcome-first microcopy per the doc (consistent with D3).
- hana-style-component only via the `src/shared/ui/hana` adapter; additive; do
  NOT change API/DTO/enums or break routes/smokes; keep the Wave35/36 fixes
  (0 horizontal overflow at the 6 resolutions, KO titles, status badges, single
  active LNB).

Validation (capture exact output): `npm run test`, `npm run build`, all mock
smokes (mvp4/5/6/benchmark/learning), responsive re-check 0 overflow at
1440/1366/1280/768, `git diff --check`. Capture before/after screenshots
(scratchpad only) for the Dashboard + 2 representative screens.

## QA Agent Order (runs LAST)
Role: Integration / QA — Design upgrade verification
Start condition: read Wave37 PM + Frontend reports.
Write report: `docs/handoffs/wave-037/QA_REPORT.md`
Backlog IDs: `INT6-031` design verification, `INT6-032` regression guard

Tasks:
- Confirm each P0/P1 change's completion criterion is met; spot-check rendered
  screens at desktop + tablet for hierarchy/whitespace/card consistency and that
  the design doc's principles are actually applied (not just claimed).
- Confirm no functional regression: tests/build/all mock smokes pass; 0
  horizontal overflow retained; KO titles / status badges / single-active LNB
  intact; no API/DTO change.
- Recommend closeout or a targeted follow-up. Exact commands/artifacts; no
  leftover listeners on 5173/8000; `git diff --check`.
