# MVP6 Frontend UI Style Guide

Status: `WAVE30 REPO-OWNED STYLE DRAFT`
Date: 2026-06-22
Owner: Frontend / UIUX Architecture

This guide distills the local Product Showcase styled-components guide into
repo-owned rules for ontology-platform MVP6 work. It is not a mechanical copy
of the external file. It keeps the useful direction: a polished, light,
workflow-first product interface that avoids raw admin-table screens.

## Scope

- Applies to future MVP6 frontend implementation and hardening work.
- Uses React, TypeScript, Vite, and styled-components.
- Keeps `hana-style-component` behind `src/shared/ui/hana` adapters.
- Does not require Wave30 route or component runtime implementation.
- Does not broaden MVP6.2 beyond the PM-frozen recommendation/audit loop.

## Product Feel

MVP6 screens should read as an operational product workflow:

- clear project context;
- strong summary surface for the current decision;
- visible source/evidence traceability;
- badges for state, risk, confidence, and permission;
- contextual detail panels instead of global ID-bound navigation;
- audit history near the action that created it.

Avoid:

- dark-mode dependence;
- gradient-heavy decoration;
- all-white flat pages;
- table-only admin layouts as the primary experience;
- decorative elements that do not explain state, evidence, or workflow.

## Token Direction

Use a shared token object or theme extension before creating one-off styles.
Names can be adapted to the existing app theme, but the semantic roles should
remain stable.

| Token role | Recommended value | Usage |
|---|---|---|
| `pageBg` | `#EEF2F7` | MVP6 product workbench background |
| `surfaceMain` | `#FBFCFF` | page sections and primary work areas |
| `surfaceCard` | `#FFFFFF` | cards, rows, panels |
| `surfaceMuted` | `#F8FAFC` | nested evidence, filters, secondary panels |
| `surfaceStrong` | `#0F172A` | one primary summary card or primary CTA per area |
| `surfaceSelected` | `#FFF7ED` | selected row/card background |
| `surfaceInfo` | `#ECFEFF` | read-only info and preview-only messages |
| `surfaceSuccess` | `#ECFDF5` | accepted/pass states |
| `surfaceWarning` | `#FFFBEB` | risk, stale, preview-only states |
| `surfaceDanger` | `#FFF1F2` | destructive or high-risk warnings |
| `border` | `#E2E8F0` | default border |
| `borderStrong` | `#CBD5E1` | selected/focus border |
| `textPrimary` | `#0F172A` | primary text |
| `textSecondary` | `#64748B` | secondary text |
| `textMuted` | `#94A3B8` | metadata and helper text |

Radius and shadow rules:

- Keep repeated cards, tables, and work rows restrained and consistent with the
  existing app system. Prefer `8px` for regular cards unless the existing
  adapter component requires otherwise.
- Use stronger visual emphasis through surface, border, left accent bar,
  spacing, and shadow rather than oversized rounding.
- Use the dark `surfaceStrong` sparingly. It should highlight one summary or
  primary CTA area, not dominate the page.

## Layout Rules

Recommended MVP6 workbench layout:

```text
Project context header
-> Strong summary and KPI strip
-> Action button bar or section tabs
-> Main workflow queue/board
-> Contextual detail panel
-> Decision/audit timeline or drawer
```

Layout requirements:

- Keep primary pages as full-width work areas inside the existing app shell.
- Use responsive grid tracks with stable min/max widths.
- On narrow screens, stack summary, filters, list, and detail panel in that
  order.
- Do not place ID-bound detail pages in the global LNB.
- Do not nest UI cards inside decorative cards. Use section surfaces and
  repeated item cards/rows only where they carry workflow meaning.

## Component Patterns

### Strong Summary Card

Use one strong summary surface per page or major section. For Learning
Insights, it should answer: "what is the most important improvement signal
right now?"

Content should include:

- headline metric or state;
- short source-backed explanation;
- risk/confidence badge;
- freshness timestamp;
- one primary navigation/action affordance.

### KPI Cards

Use compact KPI cards for secondary counts such as open suggestions,
high-risk recommendations, source coverage, or preview-only auto-approval
candidates.

Rules:

- show measured values only after data loads;
- expose `NOT_APPLICABLE` or no-data states explicitly;
- avoid fake zero when denominator is unavailable;
- include route/action hint only when it stays in the current work area.

### Action Button Bar

Use an action button bar or segmented tabs for major workflow sections:

- Summary
- Correction Patterns
- Prompt Improvements
- Auto-Approval Preview
- Decision History

Each action should have an icon, concise label, and status badge/count when
available. Keep the active section visually distinct.

### Workflow Rows and Cards

Use card-like rows for prioritized lists instead of raw tables as the primary
surface.

Selected item requirements:

- selected background;
- strong border;
- left accent bar;
- subtle ring/shadow;
- state badges inside the row;
- chevron or explicit detail affordance.

Tables remain useful for dense secondary evidence, historical matches, and
audit details, but should not be the first impression of a workflow page.

### Contextual Detail Panel

Use a right-side or below-list detail panel for selected patterns,
suggestions, and previews.

Recommended order:

1. summary and state badges;
2. source-backed rationale;
3. examples/evidence;
4. related signals or suggestions;
5. decision or navigation affordance;
6. audit history.

### Decision Modal or Drawer

Accept/dismiss decisions should use a summary-header modal or drawer, not a
bare form.

Required content:

- suggestion title and current state;
- decision effect summary;
- audit-only safety copy;
- reason code when dismissing;
- note field;
- cancel plus primary decision action.

The UI copy must say that accepted means future prompt-drafting intent, not a
live prompt change.

### Badges and State Surfaces

Use badge + icon + color surface together for important states.

Recommended mappings:

- `SUGGESTED`: info/default
- `ACCEPTED`: success
- `DISMISSED`: muted or warning, depending on reason
- `SUPERSEDED`: muted
- `HIGH` risk: danger
- `MEDIUM` risk: warning
- `LOW` risk: success or default
- auto-approval preview-only: warning/info with `not enforced` text
- permission-limited: warning or muted lock treatment

## MVP6.2 Learning Insights Application

Learning Insights should use the Product Showcase direction as follows:

- Start with a strong learning summary card and KPI strip, not a table.
- Present correction patterns as a triage queue with badges and support counts.
- Present prompt suggestions as a board/list by state.
- Present auto-approval candidates as preview-only recommendation cards with
  visible safety notes.
- Present decision history as an audit timeline.
- Keep source artifact drilldowns close to the selected item.
- Use modals/drawers for accept/dismiss decisions and show the created audit
  note immediately after success.

## State Design

Every MVP6 product screen must define:

- loading state;
- empty state;
- no-data or not-applicable state;
- error state;
- permission-limited state;
- stale-data state when a computed artifact has a freshness timestamp;
- selected item state;
- decided/superseded historical state where applicable.

State copy must be short and operational. It should tell the user what is
available, what is not available, and what action is safe next. It must not
describe unsupported automation as if it already exists.

## Copy Rules

Required semantics for MVP6.2:

- "Recommendation only"
- "Not enforced"
- "Requires later policy approval"
- "Accepted for future prompt drafting"
- "No prompt version was changed"
- "No candidate or published graph state was mutated"

Avoid:

- "applied" for accepted prompt suggestions;
- "auto-approved" for preview candidates;
- "trained" or "retrained" for learning signals;
- "policy enabled" in MVP6.2 P0.

## Responsive and Accessibility Rules

- Text must fit inside buttons, badges, rows, and cards at mobile and desktop
  widths.
- Use stable dimensions for toolbar buttons, badges, rows, and cards so hover
  and loading states do not shift layout.
- Use accessible contrast for badge text and surfaces.
- Provide focus states equivalent to hover states.
- Keep icon-only actions to familiar icons with tooltips.
- Do not rely on color alone for risk, permission, or state.

## Implementation Guardrails for Future Waves

When implementation opens in a later wave:

1. Start by mapping these tokens to the existing styled-components theme.
2. Reuse `src/shared/ui/hana` adapters before creating platform-specific
   components.
3. Create workflow-specific components only under the relevant feature/page
   area.
4. Keep Product Showcase styling additive and scoped to MVP6 surfaces.
5. Verify route screenshots in desktop and mobile viewports before claiming UX
   polish is complete.
6. Keep detail routes contextual to parent work areas.
7. Do not add runtime behavior outside the PM-frozen MVP6 slice.
