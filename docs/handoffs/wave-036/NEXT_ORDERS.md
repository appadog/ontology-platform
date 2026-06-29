# Next Orders - Wave 36

Status: `UI/UX ROLLOUT FOLLOW-UP (D3 page-title Koreanization + D6 badge rollout)`
Date: 2026-06-26

Wave35 closed UI/UX remediation as PASS, but two items rolled out only on
smoke-safe surfaces because frozen smoke assertions hardcode English H1 titles
and exact status-token text. User wants all P1+P2+P3 fully done. Wave36 completes
the rollout with token-aware smoke updates, per the Wave35 QA recommendation.

Frontend/UX wave. Backend `NOT RUN`.

## Common Rules
- Read `AGENTS.md`, `.agents/skills/handoff-reporting/SKILL.md`,
  `docs/handoffs/CURRENT_STATE.md`, this file.
- Read `docs/handoffs/wave-035/FRONTEND_REPORT.md` and `wave-035/QA_REPORT.md`
  (the smoke-blocker analysis names the exact files/assertions).
- Read `docs/pm/UIUX_REMEDIATION_DECISIONS.md` (D3 copy-language policy + glossary,
  D6 status-token badge table).
- Use `docs/handoffs/REPORT_TEMPLATE.md`; finish with role reports in
  `docs/handoffs/wave-036/{ROLE}_REPORT.md`.

## Frontend Agent Order
Role: Frontend — Complete D3/D6 rollout
Write report: `docs/handoffs/wave-036/FRONTEND_REPORT.md`
Backlog IDs: `FE6-034` (full page-title Koreanization), `FE6-035` (full-screen
status-badge rollout), optional `FE6-037` (Projects NavLink aria-current nit)

Tasks:
- Complete D3: Korean page titles (H1) across all remaining screens per the
  decisions doc (LNB labels stay EN, page titles KO).
- Complete D6: render status tokens as badge + Korean secondary label across all
  remaining screens (StatusBadge component already exists from Wave35).
- Update the frozen smoke assertions token-aware (do NOT delete markers): swap
  English H1 strings in `getByRole("heading", {name: ...})` to the new Korean
  titles; relax `getByText(TOKEN, {exact:true})` to substring/regex that KEEPS
  the token marker. Touch only the assertions that the new policy legitimately
  changes; do not weaken unrelated acceptance markers.
- Optional a11y nit: make only one LNB item active (global `Projects` NavLink
  should not get `aria-current="page"` on project sub-routes) — use `end` match
  or explicit active logic.

Constraints: hana only via adapter; keep loading/empty/error states; additive;
no API/DTO/enum change.

Validation (capture exact output):
- `cd apps/frontend && npm run test`
- `cd apps/frontend && npm run build`
- ALL affected mock smokes pass (mvp3/mvp4/mvp5/mvp6/benchmark/learning)
- responsive re-check unaffected (still 0 horizontal overflow at 6 resolutions)
- `git diff --check`

## QA Agent Order
Role: Integration / QA — Rollout verification
Start condition: read `docs/handoffs/wave-036/FRONTEND_REPORT.md`.
Write report: `docs/handoffs/wave-036/QA_REPORT.md`
Backlog IDs: `INT6-029` rollout verification, `INT6-030` regression guard

Tasks:
- Confirm D3 (all page titles Korean) and D6 (all status tokens badged) are now
  fully applied, not just smoke-safe surfaces. Spot-check rendered screens.
- Verify the smoke assertion changes still assert the real markers (tokens kept,
  only `exact`/string form relaxed) — i.e. no regression-masking.
- Regression: `npm run test`, `npm run build`, all mock smokes; confirm nothing
  broke and 0 horizontal overflow is retained.
- Mark FE6-034/FE6-035 (and FE6-037 if done) PASS/PARTIAL/FAIL; recommend
  Wave35+36 UI/UX remediation closeout or further work.
- No leftover listeners on 5173/8000; `git diff --check`.
