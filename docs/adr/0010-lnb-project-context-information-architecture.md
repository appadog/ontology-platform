# ADR 0010: LNB Project-Context Two-Zone Information Architecture

## Status

Accepted

## Context

The full-product UI/UX review (`docs/pm/UIUX_REVIEW_FULL_PRODUCT.md`, 2026-06-26)
found that the global left-nav (LNB) stopped at the MVP1–3 work areas
(Dashboard / Projects / Ontology / Sources / Extraction / Candidates / Admin).
The MVP4–6 value surfaces — Review, Publish, Published Graph, Quality, Search,
RAG, External API, Evaluation, Learning Insights, Benchmark — were reachable only
through the Project Detail hub cards and in-screen secondary tabs. The product's
most differentiating capabilities (candidate/published separation, evidence-first
review, quality, benchmark, learning loops) were therefore invisible from the
menu (P1 discoverability failure).

A second structural issue: the global LNB and the in-screen secondary tabs both
expressed "current location", giving users two competing location systems.

The repo already enforces (ADR 0009, `MVP6_FRONTEND_UI_STYLE_GUIDE.md`) that
ID-bound detail pages must stay contextual to their parent work area and must not
appear as global LNB items. Any IA fix must preserve that invariant.

## Decision

- The LNB uses a **two-zone model**:
  - **Global zone** (project-independent, always visible): Dashboard, Projects,
    Admin.
  - **Project zone** (rendered only when a project is selected): the selected
    project's name as a header, then four workflow groups in fixed order —
    **Build → Review → Publish → Analyze** — exposing the existing project-scoped
    routes.
- Group membership (frozen): Build = Ontology / Sources / Extraction / Candidates;
  Review = Review / Quality; Publish = Publish / Published Graph; Analyze =
  Search / RAG / Evaluation / Learning Insights / Benchmark / External API. The
  full route mapping is in `docs/pm/UIUX_REMEDIATION_DECISIONS.md` §1.
- **One source of "current location":** the LNB marks exactly one active item
  per route (the section); in-screen secondary tabs are sub-views *within* the
  active section, not rival top-level destinations; the breadcrumb
  (`프로젝트명 > 섹션 > 항목`) is the authoritative full-path readout and its
  section segment equals the active LNB label.
- **ID-bound detail pages stay out of the LNB** (source detail, review workbench
  task, publish job, evidence viewer, dataset/pattern/suggestion detail,
  comparison-by-id). They are reached from parent screens + breadcrumb only,
  preserving the ADR 0009 / style-guide contextual-detail invariant.
- When no project is resolvable, render the Global zone only plus a single muted
  hint; do not render greyed-out groups and do not auto-redirect from the LNB.
- This is a **presentation/IA decision only**. It changes how
  `navigation.ts` / `AppShell.tsx` present already-existing routes. It adds no
  route, API, DTO, or enum, and changes no product scope.

## Consequences

- Frontend (FE6-029) reorganizes `navigation.ts` / `AppShell.tsx` into the two
  zones and derives a single active section per route. MVP4–6 surfaces become
  discoverable from the LNB under a selected project.
- The product's differentiators surface in the primary menu, addressing the P1
  discoverability/conversion finding without adding explanatory copy.
- The candidate/published separation, evidence/version/model-run traceability,
  no-autonomous-publish, and contextual-detail invariants (ADR 0009, style guide)
  remain intact; no detail/ID route is promoted to a global menu item.
- Future optional governance grouping (project Admin as a fifth "Govern" group)
  is left open and out of scope for this decision.
