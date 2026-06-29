# QA / Integration Report - Wave 36

UI/UX rollout follow-up verification. Independently verified (did not trust the FE
report) that Wave36 completes the two partial Wave35 items — D3 full Korean page
titles (FE6-034) and D6 full status-badge rollout (FE6-035) — plus the single-active
LNB nit (FE6-037). All commands re-run from a clean boot; live render evidence
captured by puppeteer/playwright probes (screenshots/JSON in scratchpad).

## 담당 범위
- backlog ID: `INT6-029` (rollout verification), `INT6-030` (regression guard)
- 검증 대상: `FE6-034`, `FE6-035`, `FE6-037`
- 작업 경로(검증): `apps/frontend/src/pages/*`, `apps/frontend/src/pages/admin/*`,
  `apps/frontend/src/shared/ui/platform/StatusBadge.tsx`,
  `apps/frontend/src/shared/layout/AppShell.tsx`, `apps/frontend/scripts/*-smoke.mjs`

## 완료한 작업 (검증 내용)

### INT6-029 — Rollout verification

**D3 page-title Koreanization — verified live across 15 routes.**
Live H1 probe (mock mode, 1440x960) on every smoke-named route. 14/15 already
Korean; found ONE genuine gap the FE report missed (see below), fixed it, re-verified:

| Route | H1 (rendered) | Korean |
|---|---|---|
| /dashboard | 대시보드 | ✅ |
| /projects | 프로젝트 | ✅ |
| Quality | 품질 대시보드 | ✅ |
| Review | 검수 인박스 | ✅ |
| Publish | 게시 대기열 | ✅ |
| Evaluation | 평가 데이터셋 | ✅ |
| Learning Insights | 학습 인사이트 | ✅ |
| Benchmark | 벤치마크 비교 | ✅ |
| Search | 통합 검색 | ✅ |
| RAG | RAG 답변 작업 공간 | ✅ (RAG intentional-EN per D3) |
| External API | 외부 API | ✅ (API intentional-EN per D3) |
| Published Graph | 게시 그래프 탐색기 | ✅ |
| Ontology | Ontology 모델러 | ✅ (Ontology intentional-EN per D3) |
| Sources | 소스 | ✅ |
| Source Detail | policy-index.csv | ✅ (data-driven filename, allowed) |
| **/admin (Admin Console)** | **was "Admin Console" (EN)** → **fixed to `관리자 콘솔`** | ✅ after fix |

Static confirmation: every page H1 is rendered via `PageHeader` (`<h1>{title}`).
Grep of all `PageHeader title=` shows Korean titles only (with D3 intentional-EN
domain terms Ontology/Source/RAG/API). No raw `<h1>` outside `PageHeader`. LNB nav
labels correctly stay English (by D3 design) — confirmed via the active-label probe.

**Gap found & fixed (QA):** `/admin` (the global Admin Console — a screen the order
explicitly told me to spot-check) still rendered an English H1 "Admin Console". The
FE report claimed "all page H1 Korean" and listed the *project admin index*
(`프로젝트 관리자 인덱스`) but missed the org Admin Console. No smoke asserts this H1,
which is exactly why it slipped past FE validation. QA fixed it to `관리자 콘솔` per the
D3 glossary (Admin page = Korean; LNB stays `Admin`), then rebuilt/retested/re-probed.

**D6 status-token badge rollout — verified live.** Every genuine status/lifecycle
token renders through `StatusBadge` = tone + lucide icon + UPPER_SNAKE token (own
`<span>`) + "· Korean gloss". Live-captured badge text per screen:
- Sources: `PROFILED· 프로파일 완료`, `READY· 준비됨`, `PARSED· 파싱 완료`,
  `NOT_AVAILABLE· 데이터 없음`, `PARSING· 파싱 중`, `PENDING· 대기`, `UPLOADED· 업로드됨`
- Review: `PENDING· 대기`, `NOT_PUBLISHED· 미게시`, `PASSED· 통과`, `PRESENT· 있음`,
  `MODIFIED· 수정 승인`, `NEEDS_DISCUSSION· 논의 필요`, `WARNING· 경고`,
  `APPROVED· 승인됨`, `PUBLISHED· 게시됨`
- Learning Insights (Prompt Improvements tab): `SUGGESTED· 제안됨`, `ACCEPTED· 채택됨`,
  `DISMISSED· 기각됨`, `SUPERSEDED· 대체됨`; (Auto-Approval Preview):
  `RECOMMENDATION_ONLY· 추천 전용`, `WOULD_MATCH· 매칭됨`, `BLOCKED_BY_SAFETY_RULE· 안전 규칙 차단`
- Evaluation/Benchmark/Publish/Dashboard: badges present (gloss counts 13/5/39/8).

Non-status categorical/literal labels (risk_label, suggestion_kind,
primary_signal_type, confidence_label, artifact_type, window labels, "MVP6.2",
"Recommendation only · audit-only") correctly remain plain `HanaBadge` — they are
not D6 lifecycle status tokens. This matches the FE report's stated exclusions and
the D6 scope. No bare uppercase status text observed on the checked screens.

**Single active LNB (FE6-037) — verified.** On all 15 probed routes:
exactly **1** `aria-current="page"` == exactly **1** `.active` in the app nav, and
the active label matches the section (Dashboard/Projects/Quality/Review/Publish/
Evaluation/Learning Insights/Benchmark/Search/RAG/External API/Published Graph/
Ontology/Sources/Admin). Root cause of the Wave35 nit (NavLink prefix-matching
`/projects`) is fixed: `AppShell.renderNavItem` now uses a plain `Link` driven by a
single `resolveActiveSection(...)` for both class and aria-current.

### Token-aware smoke confirmation (no regression-masking)
Diffed all 10 modified smoke scripts vs HEAD:
- The ONLY changes are H1 `getByRole("heading",{name})` string swaps EN→frozen KO
  (1:1), plus comment lines. Stat: 37 insertions / 25 deletions across 10 files.
- **Zero `getByText(TOKEN,{exact:true})` markers removed or relaxed** — grep of all
  removed (`-`) lines for `getByText|exact` is empty. Every token marker (ARCHIVED,
  DEV_AUTH, READ ONLY, DETERMINISTIC_MOCK, NOT_APPLICABLE, WRONG_RELATION_DIRECTION,
  FAILED, MVP6.1, NO COMPOSITE SCORE, PUBLISHED ONLY, SAFE TOO LARGE, etc.) remains
  a live, unchanged assertion.
- Verified the badging design preserves `exact:true`: `StatusBadge` keeps the token
  in its own `<Token>` span, so the token text node still matches exactly. Confirmed
  by all mock smokes passing with their token assertions intact.

This is a legitimate, mechanical token-aware update per the frozen PM glossary — not
a weakening of acceptance markers.

### INT6-030 — Regression guard
- `npm run test` → **PASS** — Test Files 8 passed (8), Tests 28 passed (28). (Re-run
  after the QA admin fix: still 28/28.)
- `npm run build` → **PASS** — tsc app + tsc node + vite, 1871 modules, 0 TS errors.
  (Re-run after the QA admin fix: still clean.)
- Mock smokes (dev server mock mode, 127.0.0.1:5173), all **PASS**:
  - `smoke:mvp4:mock` (7 routes), `smoke:mvp5:mock` (9 routes; admin/AppShell),
    `smoke:mvp6:mock`, `smoke:mvp6:benchmark:mock` (5 routes),
    `smoke:mvp6:learning:mock` (6 routes).
  - (`mvp3` has no mock smoke by design — only `smoke:mvp3:actual`.)
- Responsive (`scripts/wave35-responsive-check.mjs`, 6 resolutions): **0 horizontal
  overflow** on ontology-modeler AND candidate-results at
  1920/1440/1366/1280/1024/768 (scrollW==clientW everywhere). Covers the order's
  required 1440/1366/1280/768. Screenshots in scratchpad.

### 실행하지 못한 검증
- `*:actual` smokes (mvp3/mvp4/mvp6/learning/benchmark actual) need a booted backend;
  this is a UI/UX-only wave with no contract change, so mock-mode coverage was used
  (same scope precedent as Wave35). Their H1 assertions were reconciled token-aware
  (verified by diff) and are correct for the next backend-up gate. The reconciled KO
  H1 assertions against real data remain a next-backend-up re-gate.

## 변경 파일 (QA)
- `apps/frontend/src/pages/admin/AdminConsolePage.tsx` — page H1 "Admin Console" →
  `관리자 콘솔` (completes D3; no smoke asserted this H1, so no smoke change needed).
- Temporary QA probe scripts were created under `apps/frontend/scripts/` and removed
  after use; `git status` shows no probe leak. `git diff --check` clean.

## API/Enum/DTO 변경
- 변경 여부: 없음. QA change is a single presentational KO string. No endpoint/DTO/enum.

## Blocker
- 없음.

## 남은 TODO
- Next backend-up run: execute `*:actual` smokes to confirm the reconciled KO H1
  assertions against real data.
- Optional (non-blocking): if PM wants a unified style for non-status categorical
  badges (risk_label, suggestion_kind, confidence_label), revisit — currently and
  correctly out of D6 scope.

## 다른 역할에 전달할 내용
- PM: D3 + D6 are now FULLY rolled out (not just smoke-safe surfaces). One real D3
  gap (`/admin` Admin Console English H1) was found by QA and fixed to `관리자 콘솔`.
  Wave35+36 UI/UX remediation can be closed out.
- Backend: none.
- Frontend: future page H1s must be Korean even when no smoke asserts them; the
  `/admin` miss shows smoke-only coverage is insufficient for D3 — keep the
  `StatusBadge` single surface for status tokens.
- QA: token markers all preserved; only EN H1 literals swapped to the frozen KO
  glossary; no regression-masking.

## 총괄에게 요청하는 결정
- Approve Wave35+36 UI/UX remediation closeout. FE6-034 and FE6-035 are complete
  (full rollout after QA's `/admin` fix); FE6-037 a11y nit fixed and verified.
  Mock-mode is an acceptable gate for this no-contract-change wave, with `*:actual`
  smokes deferred to the next backend-up run.

## Per-item verdicts
- **FE6-034 (D3 full page-title Koreanization): PASS** — all 15 page H1s Korean
  after QA fixed the one missed screen (`/admin`); intentional-EN domain terms
  (Ontology/RAG/API/Source) kept per glossary; LNB labels stay EN by design.
- **FE6-035 (D6 full status-badge rollout): PASS** — every genuine status token
  renders as badge (tone+icon+token+KO gloss) across all checked screens; token
  text preserved in its own span (exact-match smokes intact); non-status categorical
  labels correctly excluded.
- **FE6-037 (single active LNB): PASS** — exactly one `aria-current="page"` == one
  `.active` on all 15 routes.

## 현재 판정
- **PASS / WAVE35+36 UI/UX REMEDIATION CLOSEOUT RECOMMENDED.** test 28/28, build
  clean, all 5 mock smokes PASS, 0 horizontal overflow at 6 resolutions on both P1
  screens, smoke changes token-aware with zero markers lost, single active LNB
  confirmed, git/listeners clean. One real D3 gap (`/admin` H1) was found by
  independent verification and fixed in this QA pass; after the fix, D3 and D6 are
  fully (not partially) rolled out.
