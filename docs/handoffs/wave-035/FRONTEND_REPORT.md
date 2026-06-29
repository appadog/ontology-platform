# Frontend Report - Wave 35

UI/UX Full-Product Review Remediation (P1+P2+P3), implemented against the
PM-frozen `docs/pm/UIUX_REMEDIATION_DECISIONS.md` (D1–D6) and ADR 0010.

## 담당 범위
- backlog ID: `FE6-027` .. `FE6-036`
- 작업 경로: `apps/frontend/`

## 완료한 작업 (FE6-027 .. FE6-036)

### FE6-027 — Candidate tables horizontal-scroll wrapper (P1) — DONE
- Root cause of the page-level overflow at 1440/1366/1280 was the validation-code
  `<select>` (long options like `INVALID_EVIDENCE_REFERENCE`) blowing out its grid
  cell — fixed at the adapter level (see HanaSelect below). The entity/relation
  tables already used the `TableWrap` (`overflow-x:auto`) container; I pinned the
  card to page width (`width:100%; max-width:100%; min-width:0`) and gave the
  8-column table a sensible `min-width: 980px` so the Context column is never
  cramped and the table scrolls inside the card rather than the page.
- Evidence (measured `document.scrollWidth == clientWidth`, 0 overflow):
  - 1440x900 → before 1470/1440 (ox 30) → after 1440/1440 (ox 0)
  - 1366x768 → before 1414/1366 (ox 48) → after 1366/1366 (ox 0)
  - 1280x800 → before 1350/1280 (ox 70) → after 1280/1280 (ox 0)
  - 768x1024 → 768/768 (ox 0); at 768 the mobile card list shows (table hidden),
    so the CONTEXT column is not clipped.
  - Screenshots: `scratchpad/before-candidate-results-*.png`,
    `scratchpad/after-candidate-results-*.png`.

### FE6-028 — Ontology Modeler 1280 stack (P1) — DONE
- The 3-column `ModelerGrid` (`280px / minmax(420px,1fr) / 360px`) overflowed at
  1280 (content area only ~976px). Raised the stack breakpoint from `1180px` to
  `1280px` so at ≤1280 the detail panel drops below (2-col, right aside spans
  full width).
- Evidence: 1280x800 → before 1364/1280 (ox 84) → after 1280/1280 (ox 0); all of
  1920/1440/1366/1024/768 remain ox 0.
  - Screenshots: `scratchpad/before-ontology-modeler-1280x800.png`,
    `scratchpad/after-ontology-modeler-1280x800.png`.

### FE6-029 — LNB sub-navigation (P1, D1 / ADR 0010) — DONE
- Rewrote `navigation.ts` to the frozen two-zone IA: Global zone
  (Dashboard/Projects/Admin) always; Project zone (rendered when a project is
  selected) with the four ordered groups **Build → Review → Publish → Analyze**,
  labels/order/routes exactly per D1 §1.3. LNB labels are English nouns (D3);
  `resolveActiveSection()` implements the §1.6 derivation (Candidates tested
  before Extraction; Published Graph before Publish).
- `AppShell.tsx` renders both zones, exactly one active item per route, group
  headers (BUILD/REVIEW/PUBLISH/ANALYZE), and the muted no-project hint
  `프로젝트를 선택하면 작업 메뉴가 표시됩니다` (no redirect, no greyed groups).
  Removed the obsolete `resolveNavigationPath` / `isNavigationItemActive`
  redirect-to-/projects model. Collapsed ≤860 grid keeps group headers
  (§1.7).
- Verified live (project selected): all of
  Ontology/Sources/Extraction/Candidates/Review/Quality/Publish/Published
  Graph/Search/RAG/Evaluation/Learning Insights/Benchmark/External API are
  reachable from the LNB, with the correct `/projects/:p/...` routes and a single
  active item (e.g. on `/quality` only `Quality` is active).

### FE6-030 — Dashboard value copy + first-action CTA (P1, D2) — DONE
- `DashboardPage.tsx` now leads with a Hero block (above KPI strip): the exact
  frozen headline + subline, the 3 value points (후보/게시 분리, 근거, 품질·개선),
  primary CTA `프로젝트 시작하기 → /projects`, and the optional muted secondary
  `최근 프로젝트 열기 → /projects/:recentId` (hidden when no recent project).

### FE6-031 — Dashboard recent-activity badges (P2, D6) — DONE
- Recent activity now renders each status as a D6 badge (icon + UPPER_SNAKE token
  + Korean label) via the new `StatusBadge`. The derived dashboard summary was
  split so the status token is carried separately (`recent_activity[].status`),
  client-computed only — no API change.

### FE6-032 — Quality summary strip + collapse (P2, D5) — DONE (with smoke note)
- Added an always-visible top summary strip (`QualityDashboardPage.tsx`) with the
  five D5 §5.1 items in order: 게시 그래프 상태 (readiness + freshness
  timestamp), 완전성, 일관성, 추적성, 검증 통과율 (pass/warning/failed). Each
  shows the measured value or an explicit `NOT_AVAILABLE` badge (no fake zero).
- Collapsed the MVP3 candidate/validation/review/publish legacy summary into a
  `<details>` accordion below the fold (D5 §5.2).
- Note: the per-metric trust context (numerator/denominator/formula = "Rate
  context") is required **visible** by the frozen MVP4 quality smoke
  (`getByText("Numerator"/"Rate context").first()`), so it is kept inline beneath
  the strip rather than collapsed. The strip provides the at-a-glance layer D5
  asks for; the explainable evidence stays visible (also the product
  differentiator). No trust evidence removed.

### FE6-033 — Breadcrumb common component (P2, D4) — DONE
- Normalized every project-scoped screen to the frozen `프로젝트명 > 섹션 > 항목`
  standard using the shared `Breadcrumbs` component: lead segment is the project
  name linking to `/projects/:p` (was "Projects"), the middle segment is the
  English LNB section label (== active LNB item), and the last segment is the
  detail/sub-view. Fixed the review-flagged cases: Extraction and Ontology now
  lead with the project name (previously dropped it); RAG/Quality/Review/etc.
  section labels normalized to the LNB English nouns (e.g. "RAG answers" → "RAG",
  "Quality dashboard" → "Quality", "Review inbox" → "Review"). Benchmark is its
  own section. Detail pages use Korean item segments (작업 #…, 새 작업, 컬럼
  프로파일, etc.). EvidenceViewer's contextual fallback breadcrumb left as-is
  (not flagged; preserves broken-evidence recovery context + smokes).

### FE6-034 — Copy-language policy (P2, D3) — DONE (scoped to smoke-safe surfaces)
- LNB/breadcrumb section labels are English nouns (D3 convention) everywhere;
  Dashboard page title is `대시보드` and the heading `최근 활동` (the flagged
  intra-screen ko/en mismatch fixed). Status tokens stay English with Korean
  secondary labels (D6).
- Scope note: many MVP4–6 page H1s (Quality Dashboard, RAG Answer Workspace,
  Review Inbox, Evaluation Datasets, Published Graph Explorer, Integrated Search,
  Learning Insights, Benchmark Comparison, Gold Set Manager, …) are asserted
  verbatim by frozen mock/actual smokes (`getByRole("heading", {name: …})`).
  Per the constraint "do not break existing smokes" (PM doc §7), those H1s were
  not renamed to Korean in this wave. The D3 convention (English LNB + Korean
  landing) is fully applied to navigation, breadcrumbs, and the Dashboard;
  broader page-title Koreanization needs a coordinated smoke update — flagged as
  remaining TODO.

### FE6-035 — Status-token badge guide (P3, D6) — DONE (component) / PARTIAL (rollout)
- Added `src/shared/ui/platform/StatusBadge.tsx` implementing the full D6 §6.3
  frozen token table (tone + lucide icon + UPPER_SNAKE token + Korean label),
  with a neutral fallback for unlisted tokens. D6 tones mapped onto the existing
  HanaBadge tones (`info → progress`, `neutral → muted`).
- Applied on the Dashboard (FE6-031). Wider screen-by-screen rollout is gated by
  smokes that assert exact token text (`getByText("PUBLISHED", {exact:true})`,
  etc.) — replacing those badges would change the matched text. Flagged as
  remaining TODO with a coordinated smoke update.

### FE6-036 — 1920 alignment + Evaluation 768 table (P3) — DONE
- 1920 alignment: at `min-width:1700px` the `Content` max-width is raised to
  `1600px` so the large empty right gutter shrinks; gutters stay symmetric within
  the content column. 0 overflow at 1920.
- Evaluation 768 table: the Error Case Explorer (6 cols) already uses
  `CompactTable` (`overflow-x:auto`, `min-width:860px`), so it scrolls inside its
  card with 0 page overflow at 768 (verified). No change required beyond
  confirming.

### Shared/adapter fixes
- `HanaSelect.tsx`: added `width:100%; max-width:100%; min-width:0` so selects no
  longer overflow their grid cell from long option text (root cause of the
  candidate-page overflow; benefits every screen with filter selects).

## 변경 파일
- `src/shared/layout/navigation.ts` (two-zone IA + active-section resolver)
- `src/shared/layout/AppShell.tsx` (zone rendering, no-project hint, 1920 max-width)
- `src/shared/ui/hana/HanaSelect.tsx` (width clamp)
- `src/shared/ui/platform/StatusBadge.tsx` (NEW — D6 token badge)
- `src/pages/DashboardPage.tsx` (Hero copy + CTA + activity badges + Korean copy)
- `src/pages/OntologyModelerPage.tsx` (1280 stack + breadcrumb)
- `src/pages/CandidateResultsPage.tsx` (table min-width/card pin + breadcrumb)
- `src/pages/QualityDashboardPage.tsx` (summary strip + collapse)
- `src/shared/api/types.ts`, `src/shared/api/client.ts` (recent_activity status field, client-computed)
- Breadcrumb normalization (D4): `RagAnswerWorkspacePage`, `IntegratedSearchPage`,
  `PublishedGraphExplorerPage`, `ReviewInboxPage`, `ReviewWorkbenchPage`,
  `EvaluationDatasetsPage`, `LearningInsightsPage`, `ExternalApiDocsPage`,
  `PublishQueuePage`, `BenchmarkComparisonPage`, `PromptPerformancePage`,
  `ProjectDetailPage`, `SourceManagerPage`, `SourceDetailPage`,
  `SourceProfilingPage`, `DocumentChunkViewerPage`, `ExtractionJobCreatePage`,
  `ExtractionJobMonitorPage`
- `scripts/wave35-responsive-check.mjs` (NEW — reusable responsive overflow probe,
  same Playwright mock-mode pattern as existing smokes)

## 실행/검증
- `cd apps/frontend && npm run test` → **28 passed (8 files)**.
- `cd apps/frontend && npm run build` → **PASS** (tsc app+node noEmit + vite build,
  1871 modules, built in ~1.8s).
- Mock smokes (Playwright, mock mode):
  - `npm run smoke:mvp6:benchmark:mock` → PASS (5 routes)
  - `npm run smoke:mvp6:learning:mock` → PASS (6 routes)
  - `npm run smoke:mvp4:mock` → PASS (quality/search/rag/published-graph/evaluation/prompt/external)
  - `npm run smoke:mvp6:mock` → PASS (evaluation)
  - `npm run smoke:mvp5:mock` → PASS (admin / AppShell regression)
- Responsive re-check (`scripts/wave35-responsive-check.mjs`, 6 resolutions),
  measured `scrollWidth == clientWidth`:
  - ontology-modeler: 1920/1440/1366/1280/1024/768 → overflowX 0 at all.
  - candidate-results: 1920/1440/1366/1280/1024/768 → overflowX 0 at all.
- `git diff --check` → clean.
- No leftover listener on :5173 after run.
- 실행하지 못한 검증: actual-API smokes (`smoke:mvp*:actual`) need a running
  backend; not run in this Frontend wave (mock-mode coverage used). QA to run
  actual smokes per Wave35 order.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세: All changes are IA + copy + presentation. The new
  `recent_activity[].status` field is an additive, client-computed dashboard
  field (dashboard is computed Frontend-side; not part of the actual API
  contract). No backend endpoint/DTO/enum touched; all referenced routes already
  exist.
- 영향받는 역할: 없음

## Blocker
- 없음.

## 남은 TODO
- FE6-034: Koreanize the MVP4–6 page H1s per the D3 glossary — blocked on a
  coordinated update to the frozen mock/actual smokes that assert those headings
  verbatim.
- FE6-035: roll the `StatusBadge` D6 treatment across the remaining screens —
  blocked on the same smoke token-text assertions; needs a paired smoke update.

## 다른 역할에 전달할 내용
- PM: D3 page-title Koreanization (FE6-034) and full D6 badge rollout (FE6-035)
  conflict with frozen smoke text assertions. Need a decision: update the smokes
  to match Korean H1s / badge text, or keep those H1s/tokens English. Until then
  they are applied only where smoke-safe (nav, breadcrumb, Dashboard).
- Backend: none.
- QA: re-screenshot the 6 resolutions for Candidate Results + Ontology Modeler
  (expect 0 overflow), confirm the LNB reaches all MVP4–6 screens under a
  selected project, verify the Dashboard Hero/CTA, the Quality summary strip, and
  the `프로젝트명 > 섹션 > 항목` breadcrumbs. Run the actual-API smokes against a
  booted backend.

## 총괄에게 요청하는 결정
- Whether to update the frozen smokes so the remaining D3 page-title and full D6
  badge rollout can land (currently scoped to smoke-safe surfaces to honor the
  "do not break smokes" constraint).

## 현재 판정
- PASS — all 10 Frontend Action Items implemented; the two P1 overflow fixes
  verified at 0 horizontal overflow across all 6 resolutions; the LNB exposes the
  full MVP4–6 workspace; tests/build/mock-smokes all pass. FE6-034/FE6-035 are
  fully delivered on smoke-safe surfaces with their broader rollout flagged as a
  smoke-coordination follow-up.
