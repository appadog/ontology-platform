# Frontend Report - Wave 36

UI/UX rollout follow-up: complete D3 (page-title Koreanization) and D6 (status-token
badge rollout) across all screens, with token-aware smoke updates. This wave finished
an interrupted prior run (connection drop) that had made broad edits but never
validated or reconciled the smokes; this report records the verification, the fixes
applied to what the interrupted run left broken, and the completeness pass.

## 담당 범위
- backlog ID: `FE6-034` (full page-title Koreanization), `FE6-035` (full-screen
  status-badge rollout), `FE6-037` (Projects NavLink aria-current nit)
- 작업 경로: `apps/frontend/src/pages/*`, `apps/frontend/src/shared/layout/AppShell.tsx`,
  `apps/frontend/src/shared/ui/platform/StatusBadge.tsx`, `apps/frontend/scripts/*`

## 완료한 작업

### FE6-034 — D3 page-title Koreanization (COMPLETE)
All page H1s (rendered via `PageHeader title=...`) are Korean per D3 §3.2 glossary.
LNB/section nav labels stay English by design. Independent runtime probe confirmed
every smoke-named route returns `getByRole("heading", {name: <EN>})` count 0 and
`{name: <KO>}` count 1. Page H1s in place (representative):
- Quality `품질 대시보드`, Search `통합 검색`, RAG `RAG 답변 작업 공간`,
  Published Graph `게시 그래프 탐색기`, Evaluation `평가 데이터셋`,
  Prompt/Model `프롬프트·모델 성능`, External API `외부 API`,
  Benchmark `벤치마크 비교`, Learning `학습 인사이트`, Review `검수 인박스` /
  `검수 워크벤치`, Publish `게시 대기열`, Dashboard `대시보드`,
  Projects `프로젝트`, admin index `프로젝트 관리자 인덱스`, etc.
- Domain terms kept EN in titles per D3.1/glossary: `Ontology 모델러`,
  `Source 컬럼 프로파일`, `RAG`, `외부 API` (API stays EN).

### FE6-035 — D6 status-token badge rollout (COMPLETE)
Every genuine status/lifecycle token now renders through `StatusBadge`
(= tone + lucide icon + UPPER_SNAKE token text + Korean secondary label), not bare
uppercase text. `StatusBadge.tsx` already held the full D6 §6.3 25-row table; it was
extended (same rule) with auto-approval preview status, historical-match outcomes,
benchmark exclusion reasons, publish eligibility reason codes, and `MEASURED`.

Screens converted from bare `<HanaBadge>{TOKEN}</HanaBadge>` to `StatusBadge`
(caller-computed tone preserved via the `tone` prop):
- EvaluationDatasetsPage (run/metric status), LearningInsightsPage
  (suggestion.state, preview_status, outcome), BenchmarkComparisonPage (run.status,
  exclusion_reason), QualityDashboardPage (published-graph readiness token),
  ReviewInboxPage / ReviewWorkbenchPage (evidence PRESENT/MISSING), PublishQueuePage
  (job status + evidence presence), SourceDetailPage (source/preview status),
  ExtractionJobCreatePage (fixture expected status), mvp3Shared (publish eligibility
  reason codes), plus the screens the interrupted run already wired (Dashboard,
  Candidate, ExtractionJobMonitor, OntologyModeler, ProjectDetail, ProjectList,
  SourceManager, mvp4Shared StateBadge for RAG/Search vector status).
- Intentionally NOT badged (not status tokens; would change meaning): risk_label,
  suggestion_kind, primary_signal_type, confidence_label, artifact_type, model
  provider, window labels, and literal-string badges (e.g. "MVP6.2",
  "Recommendation only · audit-only", "VECTOR UNKNOWN").

#### Fix of what the interrupted run left broken
The interrupted run had inserted `<StatusBadge .../>` into 10 page files **without
adding the import**, so `npm run build` failed with ~25 `TS2304 Cannot find name
'StatusBadge'` errors. Added the missing
`import { StatusBadge } from "../shared/ui/platform/StatusBadge";` to:
CandidateResultsPage, ExtractionJobMonitorPage, OntologyModelerPage,
ProjectDetailPage, ProjectListPage, PublishQueuePage, ReviewInboxPage,
ReviewWorkbenchPage, SourceDetailPage, SourceManagerPage. Build green after.

### FE6-037 — Single active LNB item (COMPLETE)
On `/projects/:p/...` sub-routes, two nodes reported `aria-current="page"` (global
`Projects` + the section item) while only one had the visual `.active` class
(React Router `NavLink` prefix-matches `to=/projects`). Root-caused that `NavLink`
also clobbers an explicitly-passed `aria-current` for items whose `to` ≠ the full
pathname (e.g. Candidates → `/extraction-jobs`). Fix: in `AppShell.renderNavItem`,
replaced `NavLink` with a plain `Link` and drove BOTH the `.active` class and
`aria-current` from the single `resolveActiveSection(...)` result. Verified exactly
one `aria-current="page"` == one `.active` on quality/review/dashboard/projects/
ontology/candidates/learning/benchmark routes.

### Token-aware smoke reconciliation
Only the assertions the D3/D6 policy legitimately changed were touched; no markers
deleted, no unrelated acceptance checks weakened.
- **H1 assertions (D3):** swapped English `getByRole("heading", {name})` strings to
  the frozen Korean titles (1:1, still asserts the canonical page title rendered).
  Why token-aware not regression-masking: it still requires the page H1 to render;
  only the literal changed per a frozen PM glossary.
  - `mvp4-mock-route-smoke.mjs`: Quality, Search, RAG, Published Graph, Evaluation,
    Prompt/Model, External API.
  - `mvp6-mock-route-smoke.mjs`: Evaluation. `mvp6-benchmark-mock`: Benchmark.
    `mvp6-learning-mock` (x2): Learning Insights. `mvp5-mock`: admin project index.
  - actual-API smokes reconciled the same way (not runnable this mock wave, kept
    correct for the next backend-up gate): `mvp3-actual` (Review Inbox/Workbench,
    Publish Queue, Published Graph, Quality), `mvp4-actual` (Quality, RAG, Published
    Graph, Prompt/Model, External API), `mvp6-actual` (Evaluation),
    `mvp6-learning-actual` (Learning), `mvp6-benchmark-actual` (Benchmark).
- **Status-token `getByText(TOKEN,{exact:true})` assertions (D6):** verified by
  runtime probe that badging does NOT break them — `StatusBadge` keeps the token in
  its own `<span>`, so `exact:true` still matches the token node (e.g. ARCHIVED,
  DEV_AUTH, DETERMINISTIC_MOCK, NOT_APPLICABLE, WRONG_RELATION_DIRECTION,
  DIFFERENT_DATASET_VERSION, MISSING_METRIC, NOT_TERMINAL_SUCCESS,
  RELATION_DIRECTION_CORRECTION, CREATE_POLICY, reason codes). Therefore these were
  left unchanged — relaxing them was unnecessary and would have been churn. The
  token markers remain live acceptance checks.

## 변경 파일
- New: `apps/frontend/src/shared/ui/platform/StatusBadge.tsx` (Wave35; D6 table
  extended this wave), `apps/frontend/scripts/wave35-responsive-check.mjs` (Wave35).
- `apps/frontend/src/shared/layout/AppShell.tsx` (FE6-037 Link + single active),
  `apps/frontend/src/shared/layout/navigation.ts` (Wave35 two-zone IA).
- Page components (KO H1 + status badges): Dashboard, ProjectList, ProjectDetail,
  SourceManager, SourceDetail, SourceProfiling, DocumentChunkViewer, EvidenceViewer,
  OntologyModeler, ExtractionJobCreate, ExtractionJobMonitor, CandidateResults,
  ReviewInbox, ReviewWorkbench, PublishQueue, PublishedGraphExplorer,
  QualityDashboard, IntegratedSearch, RagAnswerWorkspace, EvaluationDatasets,
  PromptPerformance, BenchmarkComparison, LearningInsights, ExternalApiDocs,
  mvp3Shared, mvp4Shared, and `admin/*` (8 pages).
- Smoke scripts (token-aware H1): mvp3-actual, mvp4-mock, mvp4-actual, mvp5-mock,
  mvp6-mock, mvp6-actual, mvp6-learning-mock, mvp6-learning-actual,
  mvp6-benchmark-mock, mvp6-benchmark-actual.
- (Working tree also carries the not-yet-committed Wave35 changes — expected.)

## 실행/검증
- `cd apps/frontend && npm run test` → **PASS — Test Files 8 passed (8), Tests 28
  passed (28)**.
- `cd apps/frontend && npm run build` → **PASS** (tsc app + tsc node + vite;
  1871 modules; built ~2.2s; 0 TS errors).
- Mock smokes (dev server mock mode, 127.0.0.1:5173):
  - `smoke:mvp4:mock` → PASS (7 routes 200, all assertions incl. KO H1s)
  - `smoke:mvp5:mock` → PASS (9 routes; admin/AppShell regression)
  - `smoke:mvp6:mock` → PASS
  - `smoke:mvp6:benchmark:mock` → PASS (5 routes)
  - `smoke:mvp6:learning:mock` → PASS (6 routes)
- Responsive (`scripts/wave35-responsive-check.mjs`, 6 resolutions, mock mode):
  **0 horizontal overflow** on ontology-modeler AND candidate-results at
  1920/1440/1366/1280/1024/768 (scrollW == clientW everywhere). Re-run after each
  major change set (post-import-fix, post-Link-swap, post-D6-rollout) — stable.
  Screenshots in scratchpad only.
- FE6-037 probe: exactly one `aria-current="page"` == one `.active` per route on
  quality/review/dashboard/projects/ontology/candidates/learning/benchmark.
- `git diff --check` → **clean**. No listeners on 5173/8000 after run (verified).
- 실행하지 못한 검증: actual-API smokes (`smoke:mvp*:actual`) need a booted backend;
  this is a UI/UX-only wave with no contract change, so mock-mode coverage was used
  (same scope precedent as Wave35). Their H1 assertions were reconciled token-aware
  for the next backend-up gate.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세: all changes are presentation (KO copy + badge wrapping), one a11y binding
  (LNB Link aria-current), and additive token-table entries. No endpoint/DTO/enum
  touched. `StatusBadge` reads tokens the API already emits; tone overrides are
  client-computed from existing fields. hana used only via the `shared/ui/hana`
  adapter. Loading/empty/error states untouched.
- 영향받는 역할: 없음

## Blocker
- 없음.

## 남은 TODO
- QA (INT6-029/030): re-gate; when a backend is available, run the `*:actual` smokes
  to confirm the reconciled KO H1 assertions against real data.
- Optional polish (non-blocking): a few descriptive categorical badges (risk_label,
  suggestion_kind, confidence_label, etc.) intentionally remain plain HanaBadge —
  they are not D6 status tokens. Revisit only if PM wants a unified badge style for
  non-status categories too.

## 다른 역할에 전달할 내용
- PM: D3 + D6 are now fully rolled out across all screens (not just smoke-safe
  surfaces). The token-aware smoke policy was honored — H1 literals swapped 1:1;
  token markers kept (badging preserves `exact:true` token match), nothing deleted.
- Backend: none.
- Frontend: `StatusBadge` is the single status-token surface; extend its
  `tokenTable` (same rule) for any new enum. Use the `tone` prop to preserve a
  caller-computed color while still getting icon + Korean label.
- QA: badged tokens still satisfy `getByText(TOKEN,{exact:true})` because the token
  sits in its own span; verify no regression-masking — every prior token marker is
  still asserted, only English H1 literals were changed (to the frozen KO glossary).

## 총괄에게 요청하는 결정
- Approve Wave35+36 UI/UX remediation closeout. FE6-034 and FE6-035 are complete
  (full rollout, not partial); FE6-037 a11y nit fixed. Confirm mock-mode is an
  acceptable gate for this no-contract-change wave, with actual-API smokes deferred
  to the next backend-up run.

## 현재 판정
- **PASS.** D3 complete (all page H1 Korean), D6 complete (all status tokens badged),
  FE6-037 fixed (single active LNB item). test 28/28, build clean, all 5 mock smokes
  PASS, 0 horizontal overflow at all 6 resolutions on both P1 screens, git/listeners
  clean, no API/DTO/enum change, Wave35 responsive fixes not regressed.
