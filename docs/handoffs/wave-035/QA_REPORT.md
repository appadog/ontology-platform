# QA Report - Wave 35

UI/UX Full-Product Review Remediation — independent verification of the
PM-frozen decisions (`docs/pm/UIUX_REMEDIATION_DECISIONS.md` D1–D6 / ADR 0010)
and the 10 Frontend Action Items (FE6-027..036). Verified by inspecting the
implementation AND re-running the runtime (mock-mode boot, independent
screenshots/probes), not by trusting the Frontend report.

## 담당 범위
- backlog ID: `INT6-026` remediation verification, `INT6-027` responsive re-test,
  `INT6-028` regression guard
- 작업 경로: verification only (no app code changed); evidence in scratchpad

## 완료한 작업

### INT6-026 — Remediation verification (per-item completion criterion)

Mapped to review §9 Priority Backlog. Each item inspected in code + verified in
the running app where it has a runtime criterion.

| §9 | Pri | Item | FE id | Verdict | Evidence |
|---|---|---|---|---|---|
| 1 | P1 | Candidate table h-scroll wrapper | FE6-027 | **PASS** | independent re-screenshot: candidate-results overflowX=0 at 1920/1440/1366/1280/1024/768; 768 CONTEXT not clipped (31 context labels render, ox 0). `CandidateTableCard` min-width:980px inside `TableWrap` overflow-x:auto; card pinned width:100%/max-width:100%/min-width:0. Root cause (long-option `<select>`) fixed in `HanaSelect` (width clamp). |
| 2 | P1 | LNB project sub-nav (IA, D1/ADR0010) | FE6-029 | **PASS** | live probe: all 10 MVP4-6 items (Quality/Review/Publish/Published Graph/Search/RAG/Evaluation/Learning Insights/Benchmark/External API) reachable under a selected project with correct `/projects/:p/...` routes; group headers Build/Review/Publish/Analyze present; **visual `.active` = exactly one item** on /quality. `navigation.ts` two-zone IA + `resolveActiveSection` match D1 §1.3/§1.6 verbatim. |
| 3 | P1 | Ontology Modeler 1280 stack | FE6-028 | **PASS** | independent re-screenshot: ontology-modeler overflowX=0 at all 6 resolutions incl. 1280. `ModelerGrid` @media(max-width:1280px) drops to 2-col, right aside spans full width. |
| 4 | P1 | Dashboard value copy + CTA | FE6-030 | **PASS** | `DashboardPage.tsx` Hero = frozen headline + subline + 3 value points (후보/게시 분리·근거·품질) + CTA `프로젝트 시작하기`→/projects + optional `최근 프로젝트 열기`. Matches D2 §2 verbatim. |
| 5 | P2 | Copy language policy + glossary | FE6-034 | **PARTIAL (by design)** | D3 applied to nav (English nouns), breadcrumbs, Dashboard (`대시보드`/`최근 활동`). MVP4-6 page H1s still English — blocked by frozen smokes (see blocker analysis). PM "do not break smokes" honored. |
| 6 | P2 | Breadcrumb standard | FE6-033 | **PASS** | every project-scoped page leads with `projectName` (link → /projects/:p) + English section label == active LNB label. Verified RAG/Quality/Review/Extraction now lead with project name (review-flagged cases fixed). Shared `Breadcrumbs` component. Matches D4. |
| 7 | P2 | Quality summary strip + collapse | FE6-032 | **PASS** | `QualityDashboardPage` always-visible strip with the 5 D5 §5.1 items in order (게시 그래프 상태/완전성/일관성/추적성/검증 통과율), explicit NOT_AVAILABLE (no fake zero); MVP3 legacy summary collapsed into `<details>`. Rate-context evidence kept visible (required by frozen MVP4 smoke + product differentiator). |
| 8 | P2 | Evaluation error-case 768 responsive | FE6-036 | **PASS** | Error Case Explorer uses `CompactTable` (overflow-x:auto, min-width:860px) → scrolls in-card, 0 page overflow at 768. |
| 9 | P3 | Dashboard status badges | FE6-031 | **PASS** | recent activity renders `StatusBadge` (icon + UPPER_SNAKE token + Korean label). `recent_activity[].status` is additive, client-computed (dashboard is FE-computed; not in actual API contract) — no backend change. |
| 9 | P3 | Status-token badge component (D6) | FE6-035 | **PASS (component) / PARTIAL (rollout)** | `StatusBadge.tsx` implements the full D6 §6.3 25-row token table (tone+icon+token+Korean) + neutral fallback; D6 tone→Hana mapping (info→progress, neutral→muted). Applied on Dashboard; wider rollout blocked by exact-token smokes (see blocker analysis). |
| 10 | P3 | 1920 content alignment | FE6-036 | **PASS** | `Content` @media(min-width:1700px) → width min(1600px,100%); overflowX=0 at 1920 confirmed. |

PM decisions reflected: D1 two-zone IA ✓ (navigation.ts/AppShell.tsx), D2 Hero
copy ✓, D3 nav/breadcrumb/Dashboard ✓ (page-title scope partial), D4 breadcrumb
rule ✓, D5 Quality strip+collapse ✓, D6 badge component+Dashboard ✓.

### INT6-027 — Responsive re-test (independent, 6 resolutions, mock mode)

Booted the frontend independently (`npm run dev`, mock mode default
`VITE_USE_MOCK_API !== "false"`, 127.0.0.1:5173) and ran the existing
`scripts/wave35-responsive-check.mjs` Playwright probe (it resolves a real
candidates route via the job monitor). Measured `documentElement.scrollWidth ==
clientWidth`.

```
=== Wave35 responsive overflow check (label=qa-verify) ===
base=http://127.0.0.1:5173 project=project-corp-knowledge candidatesPath=/extraction-jobs/job-policy-extraction/candidates
  ontology-modeler   1920x1080  scrollW=1920 clientW=1920 overflowX=0  OK
  ontology-modeler   1440x900   scrollW=1440 clientW=1440 overflowX=0  OK
  ontology-modeler   1366x768   scrollW=1366 clientW=1366 overflowX=0  OK
  ontology-modeler   1280x800   scrollW=1280 clientW=1280 overflowX=0  OK
  ontology-modeler   1024x768   scrollW=1024 clientW=1024 overflowX=0  OK
  ontology-modeler   768x1024   scrollW=768 clientW=768 overflowX=0  OK
  candidate-results  1920x1080  scrollW=1920 clientW=1920 overflowX=0  OK
  candidate-results  1440x900   scrollW=1440 clientW=1440 overflowX=0  OK
  candidate-results  1366x768   scrollW=1366 clientW=1366 overflowX=0  OK
  candidate-results  1280x800   scrollW=1280 clientW=1280 overflowX=0  OK
  candidate-results  1024x768   scrollW=1024 clientW=1024 overflowX=0  OK
  candidate-results  768x1024   scrollW=768 clientW=768 overflowX=0  OK
RESULT: 0 horizontal overflow on all routes/resolutions
```

P1 overflow criteria (1440/1366/1280/768): **0 horizontal overflow confirmed for
both Candidate Results and Ontology Modeler.** 768 CONTEXT column not clipped
(independent probe: overflowX=0, 31 context-ish labels rendered).

LNB reachability (independent probe under `project-corp-knowledge`):
```
  OK Quality / Review / Publish / Published Graph / Search / RAG /
     Evaluation / Learning Insights / Benchmark / External API  (all -> correct /projects/:p/... route)
  group headers seen: Build, Review, Publish, Analyze
  visual .active class items on /quality: ["Quality"]   (exactly one)
```

Screenshots saved to scratchpad (not the repo):
`/private/tmp/claude-501/.../scratchpad/qa-verify-{ontology-modeler,candidate-results}-*.png`.

### INT6-028 — Regression guard

| Command | Result |
|---|---|
| `npm run test` (vitest) | **PASS — 28 passed (8 files)** |
| `npm run build` (tsc app+node + vite) | **PASS — 1871 modules, built in ~1.85s** |
| `npm run smoke:mvp4:mock` | **PASS** (`"status":"PASS"`, quality/search/rag/published-graph/evaluation/prompt/external) |
| `npm run smoke:mvp5:mock` | **PASS** (admin / AppShell regression) |
| `npm run smoke:mvp6:mock` | **PASS** (evaluation) |
| `npm run smoke:mvp6:benchmark:mock` | **PASS** |
| `npm run smoke:mvp6:learning:mock` | **PASS** |
| `git diff --check` | clean |
| listeners on 5173 / 8000 after run | none (verified `lsof`) |

Durable invariants intact: no API/DTO/enum change; candidate/published
separation, evidence, contract-first unaffected (all changes IA + copy +
presentation; additive). Actual-API smokes (`smoke:mvp*:actual`) need a booted
backend and were the same as the Frontend wave scope; mock-mode coverage used for
this UI/UX-only wave (no backend change touched any contract).

## Blocker-analysis of the two flagged follow-ups (FE6-034, FE6-035)

### What exactly blocks full rollout

D3 full page-title Koreanization (FE6-034) is blocked by **English H1
`getByRole("heading", {name: ...})` assertions**:
- `scripts/mvp4-mock-route-smoke.mjs`:49 "Quality Dashboard", 61 "Integrated
  Search", 67 "RAG Answer Workspace", 74 "Published Graph Explorer", 82
  "Evaluation Datasets", 88 "Prompt and Model Performance".
- `scripts/mvp4-actual-api-smoke.mjs`:155 "Quality Dashboard", 166 "RAG Answer
  Workspace", 172 "Published Graph Explorer".
- `scripts/mvp3-actual-api-smoke.mjs`:175 "Review Inbox", 181 "Review Workbench",
  196 "Published Graph", 207 "Quality Dashboard".
- `scripts/mvp6-mock-route-smoke.mjs`:49 "Evaluation Datasets", 52 "Gold Set
  Manager"; `scripts/mvp6-actual-api-smoke.mjs`:328 "Evaluation Datasets".
- `scripts/mvp6-learning-*-smoke.mjs`:44/91/151 "Learning Insights";
  `scripts/mvp6-benchmark-*-smoke.mjs`:31/155 "Benchmark Comparison".

D6 full badge rollout (FE6-035) is blocked by **exact status-token text**
`getByText("<TOKEN>", {exact:true})`:
- `mvp4-mock`:84 "ARCHIVED", 90 "FAILED", 95 "DEV_AUTH", 96 "READ ONLY", 75
  "PUBLISHED ONLY"; `mvp4-actual`:173 "PUBLISHED FACTS", 185 "DEV_AUTH".
- `mvp3-actual`:191 `<reason>`, 197 "PUBLISHED FACTS".
- `mvp6-mock`:51 "DETERMINISTIC_MOCK", 56 "NOT_APPLICABLE", 58
  "WRONG_RELATION_DIRECTION"; `mvp6-actual`:332 "Acme Corp", etc.
- `mvp6-benchmark-mock`:44 "DIFFERENT_DATASET_VERSION", 49 "MISSING_METRIC", 52
  "NOT_TERMINAL_SUCCESS"; `mvp6-learning-mock`:47 "RELATION_DIRECTION_CORRECTION",
  85 "CREATE_POLICY".

Wrapping these tokens in `StatusBadge` changes the matched node from `"TOKEN"`
to `"[icon] TOKEN · 한국어"`, so the `exact:true` `getByText` would no longer
match; renaming H1s to Korean breaks the `getByRole("heading")` waits.

### Is updating those assertions safe or does it risk masking a regression?

- **H1 Koreanization (D3):** updating `getByRole("heading", {name})` to the frozen
  D3 Korean H1s is a **mechanical, low-risk 1:1 string swap** — the smoke still
  asserts the page rendered its title; only the literal changes, per a frozen PM
  policy (D3 §3.2 glossary gives the exact target strings). It does NOT weaken the
  assertion (still presence of the canonical H1), so it does not mask a
  functional regression. **Low risk.**
- **D6 badge text:** the `exact:true` token waits are **load-bearing acceptance
  markers**, not incidental — e.g. "NOT_APPLICABLE", "DETERMINISTIC_MOCK",
  "PUBLISHED FACTS", reason codes, `__NONE__`/comparability flags assert
  honest/no-fake-zero states and the candidate/published separation invariant.
  The correct change is **not to drop them but to relax `exact:true` → substring
  (or `getByText(new RegExp(TOKEN))`)** so the token still must be present inside
  the badge. That preserves the invariant assertion while allowing the Korean
  gloss. A blanket find/replace that simply deletes these markers WOULD risk
  masking a regression — so the rollout needs a careful, token-aware smoke edit,
  not a blind one. **Medium effort, safe if done as substring-match (not
  deletion).**

### Recommendation

**(a) Do the rollout in a small dedicated follow-up wave, with a paired,
token-aware smoke update** — not (b) accept-as-partial long-term. Rationale:
the partial state is an intentional, honest scoping (correctly honoring the
frozen "do not break smokes" constraint), but it leaves an intra-product
inconsistency (Korean nav/Dashboard vs English MVP4-6 H1s) that the review's D3
explicitly wants resolved. The work is well-bounded:
1. H1s: mechanical 1:1 swap to the D3 §3.2 Korean strings (low risk).
2. Badges: roll `StatusBadge` across screens AND change the corresponding
   `getByText(TOKEN, {exact:true})` to substring/regex token match (keep the
   token assertion, drop only `exact`). This keeps every acceptance marker live.
3. Re-run all mock + actual smokes as the gate.

Accepting (a) is safe; the only real hazard is a lazy badge rollout that deletes
token markers — the follow-up wave order should explicitly forbid that and
require substring-match instead.

## 변경 파일
- (QA verification only — no app/code change.) Report:
  `docs/handoffs/wave-035/QA_REPORT.md`.
- Temp evidence/probe scripts kept in scratchpad, removed from the repo after
  use (`git diff --check` clean).

## 실행/검증
- `cd apps/frontend && npm run test` → 28 passed (8 files).
- `cd apps/frontend && npm run build` → PASS (1871 modules).
- `npm run smoke:mvp4:mock | mvp5:mock | mvp6:mock | mvp6:benchmark:mock |
  mvp6:learning:mock` → all PASS.
- `node scripts/wave35-responsive-check.mjs` (6 resolutions) → 0 overflow.
- Independent LNB + 768 CONTEXT + active-state probe → all reachable, one visual
  active item, ox 0.
- `git diff --check` → clean. No listener on 5173/8000 after run.
- 실행하지 못한 검증: actual-API smokes (need a booted backend; this wave is
  UI/UX-only with no contract change — out of remediation scope).

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세: all Wave35 changes are IA + copy + presentation. `recent_activity[].status`
  is an additive client-computed dashboard field (dashboard is FE-computed; not
  part of the actual API contract). No backend endpoint/DTO/enum touched.
- 영향받는 역할: 없음

## Blocker
- 없음 (no blocker to closeout). The two PARTIAL rollouts (FE6-034 H1
  Koreanization, FE6-035 full badge rollout) are intentionally scoped and tracked
  as a follow-up, not a blocker.

## 남은 TODO
- Follow-up wave: complete D3 H1 Koreanization (mechanical) + full D6 badge
  rollout, paired with a **token-aware** smoke update (substring/regex token
  match, NOT deletion of token markers; 1:1 H1 string swap). Re-run all smokes.
- Minor a11y nit (non-blocking): on project-scoped routes the global `Projects`
  NavLink also carries `aria-current="page"` (React Router partial-path match),
  so two nodes report `aria-current` while only one has the visual `.active`
  class. Consider `end` on the Projects NavLink or an explicit aria-current
  binding tied to `activeSection`. Does not affect the D1 §1.5 single-visual-
  location guarantee.

## 다른 역할에 전달할 내용
- PM: decision requested — approve a small follow-up wave to land FE6-034 H1
  Koreanization + FE6-035 full badge rollout, with the constraint that the paired
  smoke update uses substring/regex token matching (preserve all acceptance
  markers; no `exact:true` token deletion) and a 1:1 D3 §3.2 H1 string swap.
- Frontend: rollout is safe to complete per the above; do NOT delete
  `getByText(TOKEN)` markers when badge-wrapping — relax `exact:true` to
  substring. Optionally fix the `Projects` NavLink `aria-current` nit.
- Backend: none.
- QA: re-gate the follow-up with full mock + actual smokes.

## 총괄에게 요청하는 결정
- Closeout Wave 35 as PASS now, with FE6-034/FE6-035 broader rollout carried to a
  targeted follow-up wave (recommendation (a)). Approve the token-aware smoke
  update policy so that follow-up does not mask regressions.

## 현재 판정
- **PASS (with one scoped follow-up).** P1: 4/4 PASS (both overflow fixes
  independently verified at 0 horizontal overflow across all 6 resolutions; LNB
  exposes the full MVP4-6 workspace; Dashboard Hero/CTA correct). P2: 5/5 PASS
  (FE6-034 copy-policy applied on all smoke-safe surfaces; page-title scope
  carried to follow-up). P3: 3/3 components PASS (FE6-035 badge component +
  Dashboard done; full screen-by-screen rollout carried to follow-up). Tests,
  build, and all mock smokes pass; no regression; durable invariants intact;
  git/listeners clean. Recommend closeout + a small follow-up wave for the two
  flagged rollouts.
