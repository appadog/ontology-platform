# Frontend Report - Wave 18

## 담당 범위
- backlog ID: `FE3-001`~`FE3-008`, support initial `FE4-*`, regression `INT3-001`~`INT3-007`
- 작업 경로:
  - `apps/frontend/`
  - `docs/handoffs/wave-018/FRONTEND_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `02_FRONTEND_AGENT_SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-018/NEXT_ORDERS.md`
  - `docs/handoffs/wave-018/PM_REPORT.md`
  - `docs/pm/MVP3_CLOSEOUT_CHECKLIST.md`
  - `docs/pm/MVP4_PREP_BRIEF.md`
  - `docs/backlog/MVP4_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-017/QA_REPORT.md`
  - `00_PROJECT_ROADMAP_MVP_1_TO_5.md`
  - `docs/backlog/MVP3_DRAFT_BACKLOG.md`
  - `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
  - `apps/frontend/README.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- MVP3 frontend closeout regression을 fresh Wave18 로컬 SQLite seed/backend/frontend 조합으로 재실행했다.
- MVP3 actual API smoke를 fresh seed로 재실행했고 review inbox, review workbench, publish queue, published graph, quality dashboard route assertions가 모두 PASS했다.
- MVP2 actual smoke를 같은 backend/frontend 조합으로 재실행해 source/profile/chunk/job/candidate/evidence/mobile overflow regression이 PASS임을 확인했다.
- MVP3 review/publish/quality UX closeout gaps를 검토했다.
- MVP4 frontend IA/UX implications를 검토했다:
  - advanced graph explorer
  - advanced quality dashboard
  - integrated search UI
  - RAG answer screen
  - evaluation dataset / golden set views
  - collaboration/SLA ideas
- 이번 wave에서 broad MVP4 UI implementation, API/DTO 변경, Backend 파일 변경은 하지 않았다.

## 변경 파일
- `docs/handoffs/wave-018/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/backend && rm -f /tmp/ontology-wave18-frontend-mvp3-seed.db /tmp/ontology-wave18-frontend-mvp3-seed.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave18-frontend-mvp3-seed.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave18-frontend-mvp3-seed.db .venv/bin/python scripts/seed_mvp3.py --output /tmp/ontology-wave18-frontend-mvp3-seed.json`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave18-frontend-mvp3-seed.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8018`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8018 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP3_API_BASE_URL=http://127.0.0.1:8018 MVP3_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP3_SEED_JSON=/tmp/ontology-wave18-frontend-mvp3-seed.json MVP3_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave18-frontend-mvp3-actual-smoke npm run smoke:mvp3:actual`
  - `cd apps/frontend && MVP2_API_BASE_URL=http://127.0.0.1:8018 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave18-frontend-mvp2-regression-smoke npm run smoke:mvp2:actual`
- 결과:
  - Frontend tests PASS: `3 passed`, `8 tests`.
  - Frontend build PASS: TypeScript and Vite production build completed.
  - Fresh SQLite migration + MVP3 seed PASS through `20260619_0004`.
  - MVP3 seed output:
    - project `project-corp-knowledge`
    - review tasks `9`
    - publish candidates `14`
    - reason codes: `ALREADY_PUBLISHED`, `BROKEN_EVIDENCE`, `ELIGIBLE`, `FAILED_VALIDATION`, `MISSING_EVIDENCE`, `NEEDS_DISCUSSION`, `PENDING`, `REJECTED`, `WARNING_REASON_REQUIRED`
    - published graph current: `entities=2`, `relations=1`
    - quality published ratio: `3/14`, `0.2143`
  - MVP3 actual API route smoke PASS:
    - artifact JSON: `/tmp/ontology-wave18-frontend-mvp3-actual-smoke/mvp3-actual-api-smoke.json`
    - screenshots:
      - `/tmp/ontology-wave18-frontend-mvp3-actual-smoke/review-inbox.png`
      - `/tmp/ontology-wave18-frontend-mvp3-actual-smoke/review-workbench.png`
      - `/tmp/ontology-wave18-frontend-mvp3-actual-smoke/publish-queue.png`
      - `/tmp/ontology-wave18-frontend-mvp3-actual-smoke/published-graph.png`
      - `/tmp/ontology-wave18-frontend-mvp3-actual-smoke/quality-dashboard.png`
    - route assertions passed for wrapped review task response, seeded workbench, eligibility reason codes, published facts/current snapshot, typed quality metric groups, and seeded published ratio.
  - MVP2 actual API regression smoke PASS:
    - artifact JSON: `/tmp/ontology-wave18-frontend-mvp2-regression-smoke/mvp2-actual-api-smoke.json`
    - source/profile/chunk/job/candidate/evidence routes, screenshots, and `390px` mobile overflow checks passed.
- 실행하지 못한 검증:
  - Docker Compose/PostgreSQL smoke는 기존 P1 environment/tooling follow-up이며 Frontend closeout 범위에서 실행하지 않았다.

## MVP3 UX Closeout Gaps
- Product P0 blocker: 없음.
- Review inbox/workbench:
  - Actual path supports assignment/status/validation/confidence filters, evidence/source context, original vs corrected snapshot, validation results, decision history, and action disabled reasons.
  - Remaining P1/P2 UX depth: true correction editing/submission, persisted decision actions beyond disabled/readiness UI, queue pagination controls, denser compare view for long snapshots, and richer evidence highlighting.
- Publish queue:
  - Actual path shows frozen eligibility reason codes, eligible selection, publish job progress, result counts, and current snapshot link.
  - Remaining P1/P2 UX depth: explicit publish confirmation, retry/error recovery copy for partial jobs, job history comparison, and user-facing explanation for idempotent skipped candidates.
- Published graph:
  - Actual path reads current published graph snapshot and shows published facts only with version metadata and lineage detail.
  - Remaining P1/P2 UX depth: fact selection state, relation filtering, historical version selector, n-hop expansion, source/evidence overlay, and large-graph interaction performance.
- Quality dashboard:
  - Actual path renders typed candidate/validation/review/publish/rate groups and drilldown links.
  - Remaining P1/P2 UX depth: formula metadata display, time/source/prompt/model filters, trend visualization, drilldown query preservation, and comparison views.

## MVP4 Frontend IA/UX Implications
- Advanced graph explorer:
  - Keep published graph as the default source. Candidate graph facts must not appear unless clearly scoped as candidate/review context.
  - IA likely needs project-scoped route family such as published graph explorer, selected fact detail, version selector, and impact/lineage side panel.
  - Contract needs node/relation ids, labels, classes, relation types, graph version, quality/evidence overlay fields, n-hop expansion cursor/limit, and safe empty/too-large states.
- Advanced quality dashboard:
  - Metric cards need formula explainer metadata: numerator, denominator, scope, time window, and drilldown target.
  - IA should separate overview, breakdowns, trends, and drilldowns instead of adding all metrics to the current v0.1 page.
  - Filters should be contract-backed for project, source, ontology version, prompt version, model run, relation type, class type, reviewer, and time range.
- Integrated search:
  - Needs a stable global or project-level entry point with grouped results for published entities, published relations, source records, evidence chunks, and lineage/audit where supported.
  - Result rows need kind, title, matched fields/snippets, source/evidence locator, published graph version, and action links to graph, evidence, review, or RAG answer.
  - Empty, no-result, partial-index, stale-index, and permission states should be specified before implementation.
- RAG answer screen:
  - Must use grounded, read-only answer UX: question, answer, cited evidence chunks, linked published facts, coverage/confidence state, and insufficient-evidence state.
  - Candidate graph should remain excluded from answer facts unless clearly marked as non-published context.
  - The screen needs audit-friendly copy and links back to source/evidence/published graph version.
- Evaluation dataset / golden set views:
  - Need list/detail/version IA for datasets and golden sets before broad screens.
  - Contract should include dataset status, version, owner, created time, item kind, source/evidence refs, expected facts, reviewer provenance, and notes.
  - Frontend should support compare views for prompt/model evaluation runs and correction-pattern drilldowns.
- Collaboration/SLA ideas:
  - Keep P1 unless PM promotes a minimal slice.
  - If promoted, the UI should begin with comments, assignee, due date, SLA status, queue age, and quality issue ownership rather than broad notifications.

## MVP4 UI Questions
- Should MVP4 add a new top-level navigation item for `Search/RAG`, or should search remain project-scoped under each project until cross-project permissions are defined?
- Is advanced graph explorer a replacement for the current published graph page, or should it be a separate route so MVP3 closeout evidence remains stable?
- Which quality metrics are P0 tabs/cards versus drilldown-only details, especially if weighted composite score remains P1?
- What is the minimum graph seed size and performance expectation for n-hop exploration in Wave19 acceptance?
- Should RAG answer history be stored/displayed as audit evidence in MVP4, or is the answer screen stateless for P0?
- Are evaluation datasets editable by reviewers, PM/owners only, or any project member in dev auth mode?
- For integrated search, should source/evidence results be allowed to link back to candidate review context, or only to published graph/source context?
- If collaboration/SLA is promoted, what is the canonical SLA enum and which object owns it: review task, quality issue, published fact, or evaluation run?

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세:
  - Frontend code, Backend code, OpenAPI artifacts, enums, and DTOs were not changed.
  - This report records Wave18 evidence and MVP4 frontend contract questions only.
- 영향받는 역할:
  - Backend: Wave19 MVP4 OpenAPI/DTO draft should include graph/search/RAG/evaluation/quality field needs above.
  - PM: MVP4 IA decisions and P0/P1 boundaries should be frozen before broad Frontend implementation.
  - QA: `INT4-*` checklist should preserve MVP3 regression plus published graph separation and RAG grounding assertions.

## Blocker
- MVP3 product P0 Frontend blocker: 없음.
- MVP4 broad UI implementation blocker:
  - Backend MVP4 endpoint/DTO/OpenAPI draft is not yet available.
  - PM decisions for metric formulas, graph explorer P0 seed/performance, search scope, RAG answer persistence, and collaboration/SLA promotion are not yet frozen.

## 남은 TODO
- Wave19:
  - Review Backend MVP4 contract draft once available.
  - Produce detailed Frontend field/state/IA review for `FE4-001`~`FE4-007`.
  - Keep MVP3 actual smoke and MVP2 actual smoke as regression guard.
- P1 tooling:
  - Formalize actual smoke scripts into broader Playwright Test suite if QA/PM wants stronger browser coverage.
  - Run Docker/PostgreSQL compose smoke in Docker-capable environment.

## 다른 역할에 전달할 내용
- PM:
  - Frontend agrees MVP3 product P0 can close from a UI/regression perspective.
  - MVP4 needs IA decisions before implementation, especially search/RAG placement and graph explorer replacement vs separate route.
- Backend:
  - MVP4 DTOs should carry formula metadata, drilldown hints, graph expansion/overlay data, search result kinds, RAG citation/fact links, and evaluation dataset/golden set provenance.
- Frontend:
  - Do not open broad MVP4 UI until contract-first artifacts exist.
  - Current MVP3 routes should remain stable as regression anchors.
- QA:
  - Fresh Wave18 MVP3 and MVP2 actual smoke evidence is available under `/tmp/ontology-wave18-frontend-*`.
  - QA can use this report plus PM closeout checklist to judge Frontend closeout PASS.

## 총괄에게 요청하는 결정
- Accept Wave18 Frontend closeout as PASS if QA accepts the fresh test/build/smoke evidence.
- Open Wave19 as MVP4 contract-first review, not broad UI implementation.

## 현재 판정
- PASS
