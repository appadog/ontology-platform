# UI/UX Remediation Decisions — Wave 35

Status: `FROZEN — Frontend implements against this doc`
Date: 2026-06-26
Owner: PM / Architect
Backlog ID: `PM6-019` (UI/UX review decision set)
Source review: `docs/pm/UIUX_REVIEW_FULL_PRODUCT.md` (sections 4/7/8/9)
Style guide: `docs/pm/MVP6_FRONTEND_UI_STYLE_GUIDE.md`
Real routes grounded against: `apps/frontend/src/app/router.tsx`,
`apps/frontend/src/shared/layout/navigation.ts`,
`apps/frontend/src/shared/layout/AppShell.tsx`

This is the single source Frontend references for Wave 35. Every decision is
final. Where a decision owns a Frontend Action Item, the `FE6-0xx` id is named so
the handoff is traceable. **No backend / API / DTO / enum change is required by
any decision here** — this is IA + copy + presentation only.

---

## 0. Decision Index

| # | Priority | Decision | Owning FE item | Section |
|---|---|---|---|---|
| D1 | P1 | LNB Information Architecture (global + project sub-nav) | FE6-029 | §1 |
| D2 | P1 | Dashboard value-proposition copy (Hero + 3 points + CTA) | FE6-030 | §2 |
| D3 | P2 | Copy language policy + glossary | FE6-034 | §3 |
| D4 | P2 | Breadcrumb standard + per-screen mapping | FE6-033 | §4 |
| D5 | P2 | Quality info priority (top vs collapsed) | FE6-032 | §5 |
| D6 | P3 | Status-token display guide (badge + icon + ko label) | FE6-035 | §6 |

Frontend Action Item id map for Wave 35 (recorded in
`docs/backlog/MVP6_DRAFT_BACKLOG.md`):

| FE id | Action Item | Decision dependency |
|---|---|---|
| FE6-027 | Candidate tables horizontal-scroll wrapper | none (pure layout) |
| FE6-028 | Ontology Modeler 1280 stack | none (pure layout) |
| FE6-029 | LNB sub-navigation | **D1 (§1)** |
| FE6-030 | Dashboard value copy + first-action CTA | **D2 (§2)** |
| FE6-031 | Dashboard recent-activity badges | D6 (§6) |
| FE6-032 | Quality summary strip + collapse | **D5 (§5)** |
| FE6-033 | Breadcrumb common component | **D4 (§4)** |
| FE6-034 | Apply copy-language policy | **D3 (§3)** |
| FE6-035 | Status-token badge guide | **D6 (§6)** |
| FE6-036 | 1920 content alignment + Evaluation 768 table | none (pure layout) |

---

## 1. D1 — LNB Information Architecture (P1) — owns FE6-029

### 1.1 Problem being fixed

The global LNB stops at 7 MVP1–3 items
(Dashboard / Projects / Ontology / Sources / Extraction / Candidates / Admin).
The MVP4–6 value screens (Review, Publish, Published Graph, Quality, Search,
RAG, External API, Evaluation, Learning Insights, Benchmark) are only reachable
from the Project Detail hub cards and in-screen tabs, so the product's most
valuable capabilities are invisible from the menu. Separately, the LNB and the
in-screen secondary tabs both try to express "current location", splitting the
mental model.

### 1.2 Model (frozen)

The LNB has **two zones**:

1. **Global zone** (always visible, project-independent):
   - `Dashboard`
   - `Projects`
   - `Admin` (org-level admin console)

2. **Project zone** (only rendered when a project is selected). Header row shows
   the selected project name (reuses the existing `Current project` selector in
   the topbar — the project name is NOT repeated as a nav item). Under it, FOUR
   collapsible groups in this exact order: **Build → Review → Publish → Analyze**.

This is the same Build / Review / Publish / Analyze grouping suggested by the
review (§7) and matches the candidate → review → publish → analyze workflow the
product already implements.

### 1.3 Exact nav tree (labels, order, routes)

`:p` = selected `projectId`. All project-zone routes already exist in
`router.tsx` (verified). Display labels follow the §3 copy policy (English
nouns for navigation labels — see D3).

```text
GLOBAL
├─ Dashboard               → /dashboard
├─ Projects                → /projects
└─ Admin                   → /admin

PROJECT  (rendered only when a project is selected; header = project name)
├─ BUILD
│  ├─ Ontology             → /projects/:p/ontology
│  ├─ Sources              → /projects/:p/sources
│  ├─ Extraction           → /projects/:p/extraction-jobs
│  └─ Candidates           → /projects/:p/extraction-jobs        (see note A)
├─ REVIEW
│  ├─ Review               → /projects/:p/review
│  └─ Quality              → /projects/:p/quality
├─ PUBLISH
│  ├─ Publish              → /projects/:p/publish
│  └─ Published Graph      → /projects/:p/published-graph
└─ ANALYZE
   ├─ Search               → /projects/:p/search
   ├─ RAG                  → /projects/:p/rag
   ├─ Evaluation           → /projects/:p/evaluation-datasets
   ├─ Learning Insights    → /projects/:p/learning-insights
   ├─ Benchmark            → /projects/:p/benchmark-comparisons
   └─ External API         → /projects/:p/external-api
```

**Note A — Candidates target.** There is no project-level standalone candidate
list route; candidates are reached per extraction job
(`/extraction-jobs/:jobId/candidates`). Point the `Candidates` item at
`/projects/:p/extraction-jobs` (the job monitor, which lists jobs and links into
each job's candidates). Do NOT invent a new route. The item is highlighted-active
on any path containing `/extraction-jobs/:jobId/candidates` or
`/candidate-evidence`.

**Note B — Project Admin** (`/projects/:p/admin/*`) stays reachable from the
Project Detail hub and from the global `Admin` console; it is intentionally NOT
a project-zone group in Wave 35 to keep the four workflow groups clean. (Future
optional 5th group "Govern" may host it; out of scope now.)

**Note C — ID-bound detail pages stay out of the LNB.** Per the style guide and
ADR 0009, detail/ID routes (source detail, review workbench task, publish job,
evidence viewer, dataset/pattern/suggestion detail, comparison-by-id) are reached
contextually from their parent screen + breadcrumb, never as LNB items.

### 1.4 Behavior — no project selected vs selected

- **No project selected** (no `routeProjectId` AND no resolvable recent/first
  project): render the **Global zone only**. Below it, show a single muted,
  non-clickable hint row: `프로젝트를 선택하면 작업 메뉴가 표시됩니다`
  ("Select a project to see its workspace menu"). Do NOT render the four groups
  greyed-out; render nothing but the hint. Do NOT auto-redirect from the LNB.
- **Project selected** (the existing `selectedProject` resolution in `AppShell`
  already falls back to recent → first project): render the Project zone with all
  four groups expanded by default on desktop. The existing topbar `Current project`
  selector remains the project switcher; switching it re-targets every project-zone
  item to the new `:p`.
- The current `resolveNavigationPath` "redirect Ontology/Sources/Extraction to
  /projects when no project" behavior is **replaced** by this zone model: those
  items now live in the Project zone and therefore only exist when a project is
  selected, so the redirect-to-/projects fallback is no longer needed.

### 1.5 LNB vs in-screen tabs — single source of "current location"

Frozen rule to avoid two competing location systems:

- **LNB = primary destination (the section).** Exactly one LNB item is in the
  `active` state at a time, derived from the route's section segment.
- **In-screen secondary tabs = sub-views WITHIN the active section.** They switch
  panels/modes inside one section (e.g. Review inbox vs Workbench; Quality metric
  groups; Learning Insights Summary/Patterns/Suggestions/Auto-Approval/History;
  Benchmark run-select/deltas/matrix). They are NOT alternate top-level
  destinations and must not duplicate an LNB label as if it were a different
  place.
- **Breadcrumb = the authoritative full-path readout** (see §4). The breadcrumb's
  middle segment ("섹션") must equal the active LNB item label. If a screen has
  in-screen tabs, the active tab MAY appear as the breadcrumb's "항목" segment.

Concretely: when on `/projects/:p/review/:taskId`, the LNB `Review` item is
active, the in-screen Inbox/Workbench tab reflects sub-view, and the breadcrumb
reads `프로젝트명 > Review > 작업 #<task>`.

### 1.6 Active-state derivation (for FE6-029)

Section is derived from the path segment after `:p` (or top-level for global):

| Active LNB item | Path test |
|---|---|
| Dashboard | path === `/dashboard` |
| Projects | path === `/projects` OR matches `/projects/:p` exactly (hub) |
| Admin | path startsWith `/admin` |
| Ontology | path contains `/ontology` |
| Sources | path contains `/sources` |
| Extraction | path contains `/extraction-jobs` or `/extraction/new` AND NOT a candidates path |
| Candidates | path contains `/candidates` or `/candidate-evidence` |
| Review | path contains `/review` |
| Quality | path contains `/quality` |
| Publish | path contains `/publish` or `/publish-jobs` |
| Published Graph | path contains `/published-graph` |
| Search | path contains `/search` |
| RAG | path contains `/rag` |
| Evaluation | path contains `/evaluation-dataset` |
| Learning Insights | path contains `/learning-insights` |
| Benchmark | path contains `/benchmark-comparison` |
| External API | path contains `/external-api` |

Resolve in this order so the more specific Candidates test wins over Extraction.

### 1.7 Responsive

At ≤860px the LNB already collapses to a top grid (existing `Nav` media query).
Keep that behavior. Render group labels (BUILD/REVIEW/PUBLISH/ANALYZE) as small
muted section headers in the collapsed grid too, so grouping survives. Do not add
a hamburger/drawer in this wave.

### 1.8 Durable boundary

This IA is recorded as ADR `0010` (LNB project-context two-zone IA). It does NOT
change route definitions, only how `navigation.ts` / `AppShell.tsx` present
existing routes. ID-bound detail pages remain out of the LNB (preserves the ADR
0009 / style-guide contextual-detail invariant).

---

## 2. D2 — Dashboard Value-Proposition Copy (P1) — owns FE6-030

Final strings. Korean primary per §3. Apply on `DashboardPage.tsx` as a Hero
block above the existing KPI cards.

### 2.1 Hero one-liner (무엇을 / 왜)

- **Headline (무엇을):**
  `문서에서 추출한 지식을 검수·게시하고, 품질을 추적하는 온톨로지 운영 플랫폼`
- **Subline (왜):**
  `LLM 추출 결과를 바로 쓰지 않고 후보 단계에서 검증한 뒤 게시해, 근거가 남는 신뢰할 수 있는 지식 그래프를 만듭니다.`

(English equivalent, for reference only — do not show both: "Build a trusted
knowledge graph by reviewing and publishing extracted knowledge — with evidence
preserved at every step.")

### 2.2 Three value points (exactly 3, this order)

Each is a short card/row: bold lead + one supporting line.

1. **후보와 게시를 분리합니다**
   `추출 결과는 후보 그래프에 먼저 쌓이고, 검수를 통과한 항목만 게시 그래프로 올라갑니다.`
2. **모든 항목에 근거가 남습니다**
   `엔티티·관계·속성마다 원천 문서 근거를 연결해 추적과 감사가 가능합니다.`
3. **품질과 개선을 함께 추적합니다**
   `품질 지표, 벤치마크 비교, 학습 인사이트로 추출·검수 품질을 지속적으로 개선합니다.`

### 2.3 First-action CTA

- **Primary CTA label:** `프로젝트 시작하기`
- **Links to:** `/projects` (the Projects list, where New Project lives).
- **Secondary/text link (optional, muted):** `최근 프로젝트 열기` →
  `/projects/:recentProjectId` when a recent project exists; hide this secondary
  link when there is none.

Place the Hero (headline + subline + 3 value points + CTA) as the first block on
the dashboard, above the existing KPI strip, workflow steps, and recent activity.

---

## 3. D3 — Copy Language Policy + Glossary (P2) — owns FE6-034

### 3.1 Primary language

- **Primary UI language = Korean (ko-KR).** All user-facing prose — titles,
  sublabels, helper text, empty/error/loading copy, buttons, section headers,
  hero copy — is Korean.
- **Intentional-English scope (keep in English on purpose):**
  1. **System enums / status tokens** exactly as the API emits them
     (`NOT_AVAILABLE`, `NOT_PUBLISHED`, `SUGGESTED`, `IMPROVED`, `__NONE__`,
     `DETERMINISTIC_MOCK`, etc.). These are shown as badges with a Korean
     secondary label per §6 — the token itself stays English/UPPER_SNAKE.
  2. **Established product-domain terms used as navigation labels** where a
     Korean translation would reduce clarity for the operator audience:
     `Ontology`, `Dashboard`, `RAG`, `Benchmark`, `API`. These are allowed in
     the LNB and as section names (see glossary for the frozen choice per term).
  3. **Code-ish identifiers** (field names in raw JSON diff, `comparison_id`,
     metric formula strings) stay verbatim.
- **Rule:** within a single screen, do not mix a Korean title with a stray
  English subtitle (the exact issue the review flagged). Either the term is on the
  intentional-English list (then it is English everywhere consistently) or it is
  translated (then it is Korean everywhere).

### 3.2 Glossary (frozen final wording)

| Concept | Final UI wording | Type | Note |
|---|---|---|---|
| Dashboard (page title) | `대시보드` | translated | LNB nav label stays `Dashboard`; page H1 is `대시보드` |
| Recent activity | `최근 활동` | translated | replaces mixed "Recent activity" heading |
| Projects | `프로젝트` (page) / `Projects` (LNB) | mixed-by-context | nav label English, page title Korean |
| Ontology | `Ontology` | intentional EN | domain term; keep English in nav + headings |
| Sources | `소스` (page) / `Sources` (LNB) | mixed-by-context | |
| Extraction | `추출` (page) / `Extraction` (LNB) | mixed-by-context | |
| Candidates | `후보` (page) / `Candidates` (LNB) | mixed-by-context | |
| Review | `검수` (page) / `Review` (LNB) | mixed-by-context | |
| Publish | `게시` (page) / `Publish` (LNB) | mixed-by-context | |
| Published Graph | `게시 그래프` (page) / `Published Graph` (LNB) | mixed-by-context | |
| Quality | `품질` (page) / `Quality` (LNB) | mixed-by-context | |
| Search | `검색` (page) / `Search` (LNB) | mixed-by-context | |
| RAG | `RAG` | intentional EN | keep token; page subtitle may add `(검색 기반 답변)` once |
| Evaluation | `평가` (page) / `Evaluation` (LNB) | mixed-by-context | |
| Learning Insights | `학습 인사이트` (page) / `Learning Insights` (LNB) | mixed-by-context | |
| Benchmark | `벤치마크` (page) / `Benchmark` (LNB) | mixed-by-context | |
| External API | `외부 API` (page) / `External API` (LNB) | mixed-by-context | `API` stays English |
| Admin | `관리자` (page) / `Admin` (LNB) | mixed-by-context | |
| Evidence | `근거` | translated | |
| Candidate graph | `후보 그래프` | translated | |
| Published graph | `게시 그래프` | translated | |

**Convention frozen:** LNB/section navigation labels use the short English noun
(left column "LNB" wording above); the destination page's H1/title uses the
Korean wording. This keeps the menu scannable and bilingual-consistent while
making each landing page unambiguously Korean. The breadcrumb "섹션" segment uses
the same English LNB label (so LNB active item == breadcrumb section, per §1.5).

---

## 4. D4 — Breadcrumb Standard (P2) — owns FE6-033

### 4.1 Rule (frozen)

Standard format: **`프로젝트명 > 섹션 > 항목`**

- **프로젝트명** = selected project's `name`. Links to `/projects/:p` (the hub).
  Omitted entirely on global screens (Dashboard, Projects list, org Admin console).
- **섹션** = the active LNB item label (English noun, exactly matching §1.6 /
  §3.2 LNB column). Links to the section's list/landing route. Required on every
  project-scoped screen.
- **항목** = the current detail/sub-view. Present only when the screen is a
  detail or a named sub-view; this segment is plain text (not a link) since it is
  the current location. Use a short human label, not a raw id, when a name is
  available (e.g. source filename, task short id, comparison label).

Separator: ` > ` (chevron `›` rendering acceptable; keep one component).
Truncate long names with ellipsis but keep the project + section segments always
visible. The last segment is the current page and is not a link.

### 4.2 Per-screen mapping (representative)

| Route | Breadcrumb |
|---|---|
| `/dashboard` | (none — global) |
| `/projects` | (none — global) |
| `/projects/:p` | `프로젝트명` (hub; single segment, current) |
| `/projects/:p/ontology` | `프로젝트명 > Ontology` |
| `/projects/:p/sources` | `프로젝트명 > Sources` |
| `/projects/:p/sources/:sourceId` | `프로젝트명 > Sources > <파일명>` |
| `/projects/:p/sources/:sourceId/profile` | `프로젝트명 > Sources > <파일명> > 프로파일` |
| `/projects/:p/extraction-jobs` | `프로젝트명 > Extraction` |
| `/projects/:p/extraction/new` | `프로젝트명 > Extraction > 새 작업` |
| `/extraction-jobs/:jobId/candidates` | `프로젝트명 > Candidates > 작업 #<job>` |
| `/candidate-evidence/:evidenceId` | `프로젝트명 > Candidates > 근거 #<id>` |
| `/projects/:p/review` | `프로젝트명 > Review` |
| `/projects/:p/review/:taskId` | `프로젝트명 > Review > 작업 #<task>` |
| `/projects/:p/quality` | `프로젝트명 > Quality` |
| `/projects/:p/publish` | `프로젝트명 > Publish` |
| `/projects/:p/publish-jobs/:publishJobId` | `프로젝트명 > Publish > 작업 #<job>` |
| `/projects/:p/published-graph` | `프로젝트명 > Published Graph` |
| `/projects/:p/search` | `프로젝트명 > Search` |
| `/projects/:p/rag` | `프로젝트명 > RAG` |
| `/projects/:p/evaluation-datasets` | `프로젝트명 > Evaluation` |
| `/projects/:p/evaluation-datasets/:datasetId` | `프로젝트명 > Evaluation > <데이터셋명>` |
| `/projects/:p/learning-insights` | `프로젝트명 > Learning Insights` |
| `/projects/:p/learning-insights/patterns/:patternId` | `프로젝트명 > Learning Insights > 패턴 #<id>` |
| `/projects/:p/benchmark-comparisons` | `프로젝트명 > Benchmark` |
| `/projects/:p/benchmark-comparisons/:comparisonId` | `프로젝트명 > Benchmark > 비교 #<id>` |
| `/projects/:p/external-api` | `프로젝트명 > External API` |
| `/admin` | (none — global) |
| `/projects/:p/admin` | `프로젝트명 > 관리자` |

The previously inconsistent cases the review flagged (Extraction showed
"Extraction", RAG showed the project name) are normalized: every project-scoped
screen leads with 프로젝트명 then the English section label.

---

## 5. D5 — Quality Info Priority (P2) — owns FE6-032

`QualityDashboardPage.tsx` is information-dense (metric cards with nested tables).
Decision: a fixed top **summary strip** always visible; everything else collapses.

### 5.1 Always-visible (top summary strip, in this order)

1. **Overall published-graph readiness / freshness state** (the single headline
   state for the current published graph snapshot, with freshness timestamp).
2. **완전성 (Completeness)** — top-level score.
3. **일관성 (Consistency)** — top-level score.
4. **추적성 (Traceability)** — top-level score (evidence coverage — the product's
   differentiator, keep it promoted).
5. **검증 통과율 (Validation pass rate)** — pass / warning / failed counts.

These five appear as a compact KPI strip within the first scroll. Each shows the
measured value or an explicit `NOT_AVAILABLE` state (no fake zero), per the style
guide and §6.

### 5.2 Collapsed by default (expandable detail sections)

- Per-metric drilldown tables (numerator/denominator/formula rows).
- Per-class / per-relation-type breakdowns.
- Any remaining secondary metric groups beyond the five above.

Collapsed sections use a labeled accordion; expanding one does not collapse
others. Preserve the existing trust evidence (formula / numerator / denominator)
inside the expanded detail — do not remove it, just move it below the fold.

---

## 6. D6 — Status-Token Display Guide (P3) — owns FE6-035 (and FE6-031)

### 6.1 Rule

Every status token renders as **badge = tone color + icon + UPPER_SNAKE token
text + Korean secondary label**. Never rely on color alone (accessibility).
Layout: `[icon] TOKEN · 한국어보조라벨` inside one `HanaBadge`. Keep the English
token (it is the API truth and the §3 intentional-English scope); the Korean
label is the human gloss. Use the existing `HanaBadge` tones and
`lucide-react` icons.

### 6.2 Tone vocabulary

| Tone | Use for | Surface (style guide) |
|---|---|---|
| `neutral`/muted | absent/unknown/not-started | `surfaceMuted` |
| `info` | informational / read-only / in-progress | `surfaceInfo` |
| `success` | passed / accepted / published / improved | `surfaceSuccess` |
| `warning` | stale / preview-only / regressed / needs attention | `surfaceWarning` |
| `danger` | failed / blocked / high-risk | `surfaceDanger` |

### 6.3 Token table (frozen — extend with same rule for any token not listed)

| Token | Tone | Icon (lucide) | Korean secondary label |
|---|---|---|---|
| `NOT_AVAILABLE` | neutral | `MinusCircle` | 데이터 없음 |
| `NOT_PUBLISHED` | neutral | `CircleDashed` | 미게시 |
| `NOT_APPLICABLE` | neutral | `Ban` | 해당 없음 |
| `NOT_COMPARABLE` | warning | `AlertTriangle` | 비교 불가 |
| `PUBLISHED` | success | `CheckCircle2` | 게시됨 |
| `DRAFT` | info | `PencilLine` | 초안 |
| `PENDING` | info | `Clock` | 대기 |
| `RUNNING` | info | `Loader` | 실행 중 |
| `SUCCEEDED` / `SUCCESS` | success | `CheckCircle2` | 성공 |
| `FAILED` | danger | `XCircle` | 실패 |
| `WARNING` | warning | `AlertTriangle` | 경고 |
| `INFO` | info | `Info` | 정보 |
| `APPROVED` | success | `CheckCircle2` | 승인됨 |
| `REJECTED` | danger | `XCircle` | 반려됨 |
| `NEEDS_DISCUSSION` | warning | `MessageCircle` | 논의 필요 |
| `MODIFIED` | info | `PencilLine` | 수정 승인 |
| `SUGGESTED` | info | `Lightbulb` | 제안됨 |
| `ACCEPTED` | success | `CheckCircle2` | 채택됨 |
| `DISMISSED` | neutral | `XCircle` | 기각됨 |
| `SUPERSEDED` | neutral | `History` | 대체됨 |
| `IMPROVED` | success | `TrendingUp` | 개선 |
| `REGRESSED` | danger | `TrendingDown` | 하락 |
| `UNCHANGED` | neutral | `Minus` | 변동 없음 |
| `__NONE__` | neutral | `CircleSlash` | 없음(매칭 없음) |
| `STALE` | warning | `AlertTriangle` | 오래됨 |
| `PERMISSION_LIMITED` | warning | `Lock` | 권한 제한 |

### 6.4 FE6-031 (Dashboard recent activity)

The recent-activity list currently shows tokens as plain UPPER_SNAKE text. Apply
the §6.3 badge treatment there — every status becomes a badge (tone + icon +
Korean label). This is the same component/rule, just applied on
`DashboardPage.tsx`.

---

## 7. Out of scope / no-change notes for Frontend

- No backend / API / DTO / enum change. All routes referenced exist today.
- Pure-layout items (FE6-027 candidate tables, FE6-028 modeler 1280 stack,
  FE6-036 1920 alignment + Evaluation 768 table) need no decision here — follow
  the review's completion criteria (0 horizontal overflow at 1440/1366/1280/768).
- Preserve every existing loading / empty / error / permission state and all
  existing route + smoke behavior. All changes are additive / presentational.
- hana components only via `src/shared/ui/hana` adapter.

---

## 8. Acceptance hand-off summary (for QA, INT6-026..028)

- LNB exposes the two-zone model; under a selected project, all of
  Quality/Review/Publish/Published Graph/Search/RAG/Evaluation/Learning
  Insights/Benchmark are reachable from the LNB (D1).
- Exactly one LNB item active per route; in-screen tabs are sub-views, not rival
  destinations; breadcrumb section == active LNB label (D1 §1.5, D4).
- Dashboard shows the frozen Hero headline+subline, 3 value points, and the
  `프로젝트 시작하기 → /projects` CTA (D2).
- Korean is primary; tokens stay English with Korean secondary labels; no
  intra-screen ko/en title-subtitle mismatch (D3, D6).
- Breadcrumb follows `프로젝트명 > 섹션 > 항목` everywhere project-scoped (D4).
- Quality shows the 5-item summary strip first; detail collapses (D5).
