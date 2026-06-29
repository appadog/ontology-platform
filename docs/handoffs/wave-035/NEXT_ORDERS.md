# Next Orders - Wave 35

Status: `UI/UX FULL-PRODUCT REVIEW REMEDIATION (P1+P2+P3)`
Date: 2026-06-26

A full-product UI/UX review (`docs/pm/UIUX_REVIEW_FULL_PRODUCT.md`) found 0 P0,
4 P1, 6 P2, 4 P3 issues across MVP1–MVP6.3 (123 real screenshots, 29 routes x 6
resolutions). User direction: remediate **all** P1+P2+P3. Decisions are made by
PM first, then handed to Frontend to reference while implementing.

Sequence is intentionally **PM -> Frontend -> QA** (not PM/FE parallel): Frontend
must reference PM's finalized IA + copy decisions before implementing.

This is a Frontend/UX wave. Backend is `NOT RUN` unless a hard blocker is found
(no API/DTO/enum change is expected — do not open backend scope).

## Common Rules

- Read `AGENTS.md` first; `.agents/skills/handoff-reporting/SKILL.md`;
  `docs/handoffs/CURRENT_STATE.md`; this file.
- Read the source review in full: `docs/pm/UIUX_REVIEW_FULL_PRODUCT.md`
  (sections 4 UI/UX Issues, 5 Responsive, 7 PM Action Items, 8 Frontend Action
  Items, 9 Priority Backlog).
- Read `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md` and the reviewer spec
  `docs/pm/ui_ux_reviewer_long.md` (ownership split, completion-criteria rule).
- Preserve all durable product invariants and existing route/smoke behavior;
  additive/most-changes are style+IA only. No new product scope.
- Use `docs/handoffs/REPORT_TEMPLATE.md`. Finish by writing your role report in
  `docs/handoffs/wave-035/{ROLE}_REPORT.md`.

## PM Agent Order (runs FIRST, blocks Frontend)

Role: PM / Architect — UI/UX Review Decisions
Write report: `docs/handoffs/wave-035/PM_REPORT.md`
Backlog ID: `PM6-019` UI/UX review decision set

Make and record EVERY decision Frontend needs (the report's PM Action Items,
P1->P3). Produce a single decision doc `docs/pm/UIUX_REMEDIATION_DECISIONS.md`
that Frontend will reference, covering:
- **P1 LNB IA**: define the exact left-nav information architecture. Decide the
  project-context sub-grouping (e.g. Build / Review / Publish / Analyze) and the
  exact items + labels under each (Ontology, Sources, Extraction, Candidates,
  Review, Publish, Published Graph, Quality, Search/RAG, External API,
  Evaluation, Learning Insights, Benchmark). Specify behavior when no project is
  selected, and how the global LNB relates to in-screen secondary tabs (avoid
  two competing "current location" systems). Give Frontend a concrete nav model.
- **P1 Value-proposition copy**: write the final Dashboard Hero one-liner
  (무엇을/왜), 3 representative value points, and the first-action CTA copy.
- **P2 Copy language policy**: decide the primary language and the intentional-
  English scope (status tokens), and produce a short glossary for the mixed
  ko/en terms the review flagged.
- **P2 Breadcrumb rule**: freeze the standard ("프로젝트명 > 섹션 > 항목") and how
  each screen maps to it.
- **P2 Quality info priority**: decide which Quality KPIs are top/always-visible
  vs collapsed.
- **P3 Status-token display guide**: decide the badge + icon + Korean
  secondary-label rule for tokens like NOT_AVAILABLE/NOT_PUBLISHED.

For each decision give enough specificity that Frontend needs no follow-up
guesswork (exact labels, order, copy strings). Update
`docs/backlog/MVP6_DRAFT_BACKLOG.md` only if IDs need recording. Add an ADR only
if IA becomes a durable boundary decision.

Validation: `git diff --check`. Do NOT touch apps/.

## Frontend Agent Order (runs AFTER PM report exists)

Role: Frontend — UI/UX Review Remediation (P1+P2+P3)
Start condition: read `docs/handoffs/wave-035/PM_REPORT.md` and
`docs/pm/UIUX_REMEDIATION_DECISIONS.md` and follow them exactly.
Write report: `docs/handoffs/wave-035/FRONTEND_REPORT.md`
Backlog IDs: `FE6-027`..`FE6-036` (one per Frontend Action Item)

Implement ALL Frontend Action Items from the review section 8 (P1->P3),
referencing the PM decisions:
- P1 Candidate tables horizontal-scroll wrapper — `CandidateResultsPage.tsx`
  entity/relation tables: wrap each in `overflow-x:auto`, set table min-width,
  fix card width to page width. Done = 1440/1366/1280/768 document
  scrollWidth == clientWidth (0 horizontal overflow), 768 CONTEXT column not
  clipped.
- P1 Ontology Modeler 1280 stack — `OntologyModelerPage.tsx`: at <=1280 stack the
  detail panel below or shrink canvas min-width. Done = 0 horizontal overflow at
  1280.
- P1 LNB sub-navigation — `AppShell.tsx` / navigation config: implement the PM-
  frozen IA so a selected project exposes Quality/Review/Publish/Published
  Graph/Search/RAG/Evaluation/Learning Insights/Benchmark in the LNB. Done =
  those screens reachable from the LNB under a selected project, no duplicate
  "current location" confusion.
- P1 Dashboard value copy — apply PM Hero copy + first-action CTA.
- P2 Dashboard recent-activity badges; P2 Evaluation error-case table responsive
  (768 overflow-x + priority columns); P2 Quality summary strip + collapse;
  P2 Breadcrumb common component per PM rule; P2 apply copy-language policy.
- P3 1920 content alignment (center/raise max-width); P3 status-token badge per
  PM guide; P3 any remaining section-8 P3 items.

Constraints: hana-style-component only via the `src/shared/ui/hana` adapter;
keep loading/empty/error states; do not break existing routes/smokes; additive.
After changes, RE-VERIFY responsive at the 6 review resolutions (reuse the
puppeteer mock-mode screenshot pattern from existing smoke scripts) and capture
before/after evidence for the P1 overflow fixes.

Validation (capture exact output):
- `cd apps/frontend && npm run test`
- `cd apps/frontend && npm run build`
- existing mock smokes still pass (e.g. `smoke:mvp6:benchmark:mock`,
  `smoke:mvp6:learning:mock`, and any mvp2/3 route smokes you touch)
- a responsive re-check proving 0 horizontal overflow at 1440/1366/1280/768 for
  Candidate Results and Ontology Modeler
- `git diff --check`

## QA Agent Order (runs LAST)

Role: Integration / QA — Remediation Verification
Start condition: read Wave35 PM + Frontend reports.
Write report: `docs/handoffs/wave-035/QA_REPORT.md`
Backlog IDs: `INT6-026` remediation verification, `INT6-027` responsive re-test,
`INT6-028` regression guard

Tasks:
- Verify each P1/P2/P3 item's completion criterion is actually met (not just
  claimed). Independently re-screenshot the affected routes at the 6 review
  resolutions and confirm 0 horizontal overflow for Candidate Results and
  Ontology Modeler and that the LNB now reaches MVP4-6 screens under a selected
  project.
- Confirm PM decisions in `docs/pm/UIUX_REMEDIATION_DECISIONS.md` are reflected
  in the implementation (LNB IA, Hero copy, breadcrumb rule, badges).
- Regression: `npm run test`, `npm run build`, and the mock smokes; confirm no
  existing route/smoke broke and durable invariants are intact.
- Map results back to the review's section 9 Priority Backlog; mark each item
  PASS/PARTIAL/FAIL. Recommend closeout or a targeted follow-up wave.
- Confirm no leftover listeners on 5173/8000; `git diff --check`.
