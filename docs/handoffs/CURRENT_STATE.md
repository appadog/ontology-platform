# Current State

최신 총괄 상태판입니다. 총괄 에이전트는 각 wave 보고를 읽은 뒤 이 파일을 갱신합니다.

## Latest Wave

- Current wave: `wave-018`
- Overall status: `MVP 3 ACTUAL API SMOKE PASS / MVP 3 CLOSEOUT AND MVP 4 PREP`
- 기준일: 2026-06-19

## Latest Decisions

- Wave 5 QA evidence is accepted for MVP 1 app acceptance closeout.
- Docker CLI absence is approved as an environment exception for MVP 1 closeout. Compose smoke remains a follow-up infra gate, not an MVP 1 app acceptance blocker.
- Headless Chrome render evidence plus actual API write smoke is accepted as `INT-005` browser/manual UAT evidence. Full click automation remains a follow-up when tooling is available.
- MVP 2 implementation may begin in Wave 6, starting with contract hardening plus the first thin Backend/Frontend slices for profiling, segments, prompts, extraction jobs, and deterministic mock extraction.
- Wave 6 PM contract hardening and Backend thin slice are accepted as PASS.
- Wave 6 Frontend mock/navigation slice is accepted as PASS for mock exploration, but actual API mode remains PARTIAL until FE types/client/fixtures match `docs/api/openapi-mvp2-draft.json`.
- Provider API literal for MVP 2 thin slice is `mock`; `MockProvider` may be used as UI display label only.
- `POST /api/v1/sources/{source_id}/parse` canonical response is `SourceParseResponse`, not `SourceSegment[]`.
- `GET /api/v1/extraction-jobs/{job_id}` remains the MVP 2 detail boundary for `model_runs[]`.
- Wave 7 must close FE/OpenAPI contract mismatch before broadening MVP 2 implementation.
- Wave 7 actual API contract sync is accepted as PASS: `INT2-001`, `INT2-002`, `INT2-003`, and `INT2-004` are all PASS.
- Wave 8 may open focused feature expansion: retry-chain dedupe, selected-project UX cleanup, candidate/evidence detail UX, and regularized browser smoke tooling.
- Wave 8 Frontend must improve user workflow clarity. The app should make the ontology-building path understandable through navigation, project context, task progression, empty states, and next actions, not by adding long explanatory copy.
- Wave 8 Frontend must fix LNB information architecture. The LNB should show stable top-level work areas only; ID-bound pages must be reached through parent screens, breadcrumbs, and contextual links rather than appearing as flat global menu items.
- Wave 8 Frontend must complete ontology modeler edit/delete UX for draft ontology elements. Add-only ontology authoring is not acceptable for user workflow clarity.
- Wave 8 retry-chain dedupe is accepted as PASS.
- Wave 8 UI ontology-building workflow clarity is accepted as PASS, but ontology modeler edit/delete UX, LNB/drilldown IA, and candidate/evidence highlight remain PARTIAL due targeted gaps.
- Wave 9 must close targeted hardening before wider MVP 2 expansion: class delete orphan graph property, delete confirmation copy/counts, evidence breadcrumb/fallback context, and regression evidence.
- Wave 9 targeted hardening is accepted as PASS: MVP 1 regression, Wave 7 contract sync, ontology delete orphan fix, delete confirmation UX, evidence fallback/breadcrumb context, and LNB/drilldown targeted smoke are all PASS.
- Draft class delete semantics are cascade soft delete: the class, directly owned properties, and directly connected relations are marked `DELETED`; graph/list/extraction read paths must also defensively filter deleted-class-linked elements.
- Broken evidence backend 404 remains valid when the evidence row is absent; the Frontend fallback UI must preserve available source/job/candidate context and provide recovery actions.
- Wave 10 may open broader MVP 2 local demo expansion, focused on source profile/parse edge cases, prompt/job run ergonomics, fixture catalog coverage, candidate/evidence browsing, and regression evidence.
- Wave 10 broader local demo is accepted as PASS: MVP 1 regression, Wave 7 contract sync, Wave 9 targeted hardening, source profile/parse edge cases, fixture catalog, prompt/job lifecycle, retry/dedupe, candidate/evidence browsing, and frontend actual API browser smoke are all PASS.
- `invalid_evidence_reference` fixture now uses evidence detail 200 plus metadata mismatch for broken context; direct missing evidence URLs still use Frontend fallback recovery.
- Wave 11 should prepare MVP 2 closeout: closeout checklist, regression matrix, release notes/demo script, local QA harness decision, and any final targeted hardening required for reproducible acceptance.
- Wave 11 subagent operating rhythm is accepted: PM subagent ran first, Backend/Frontend subagents ran in parallel, QA subagent ran last, and all role reports were produced in `docs/handoffs/wave-011/`.
- Wave 11 QA verdict is `PASS WITH EXCEPTION`: `CO-01`~`CO-09` P0 closeout matrix, MVP 1 regression, Wave 7 contract sync, Wave 9 targeted hardening, Wave 10 local demo, and `INT2-001`~`INT2-004` are all PASS.
- MVP 2 product closeout is approved with environment/tooling exceptions only: Docker Compose smoke remains `NOT RUNNABLE` without Docker CLI, and browser smoke harness can be further regularized after closeout.
- Wave 12 is reopened by user request as Frontend Productization / UI-UX maturity work. This does not reopen MVP 2 API scope; it improves the actual product feel, navigation clarity, workflow comprehension, layout polish, and browser-verified UX quality on top of the closed MVP 2 contract.
- Wave 12 Frontend Productization is accepted as PASS: `PX-01`~`PX-08` are all PASS after same-wave responsive containment fix/recheck, and MVP 2 closeout regression remains PASS.
- Wave 13 is opened by commander/PM/UIUX expert review. Wave 12 UI/UX improved substantially, but Candidate/Evidence/Source/Job screens still need product polish around workflow stage clarity, mobile candidate review, evidence-first reading order, copy consistency, and visual hierarchy.
- Wave 13 scope is Frontend-only unless a hard blocker is found. Backend/API contracts remain closed; no new endpoint/DTO/enum is requested.
- Wave 13 UI/UX product polish is accepted as PASS: `UX13-01`~`UX13-08` are all PASS after same-wave `UX13-05` copy follow-up/recheck. Candidate mobile review, evidence-first reading order, workflow stage pattern, source readiness, responsive checks, and actual API smoke all passed.
- MVP 2 is closed for product P0 scope as `PASS WITH P1 TOOLING/ENVIRONMENT EXCEPTIONS`. Docker Compose smoke and Playwright Test harness formalization remain P1 follow-ups, not blockers for MVP 3 entry.
- MVP 3 starts in Wave 14 as a contract-first planning track: validation, expert review, correction, audit, publish job, published graph, and quality dashboard v0.1.
- Wave 14 MVP 3 contract-first readiness is accepted as PASS: PM decisions, Backend API draft, Frontend UX/API requirements, QA INT3 checklist, OpenAPI draft, and ADR 0006 are complete.
- Wave 15 opens MVP 3 thin implementation slice. PM must freeze remaining enum/reason-code details first, then Backend and Frontend may implement against the frozen contract, followed by QA runtime/contract verification.
- Wave 15 PM freeze is accepted as PASS: validation severity, publish eligibility reason codes, review inbox wrapper, validation UI fields, published lineage, and typed quality schema are frozen.
- Wave 15 Backend MVP 3 runtime thin slice is accepted as PASS: validation, review, correction, audit, publish, relational published graph, quality summary, tests, OpenAPI export, and Alembic SQLite smoke passed.
- Wave 15 Frontend MVP 3 mock-first workflow is accepted as PASS for mock UX: review inbox, workbench, publish queue/job, published graph, quality dashboard, mock contract tests, build, and route smoke passed.
- Wave 15 QA overall verdict is PARTIAL because Frontend actual API DTO sync is not contract-clean for Quality/Publish/PublishedGraph shapes; `INT3-006` remains PARTIAL.
- Wave 16 must close Frontend actual API DTO drift before broadening MVP 3 features or UI polish.
- Wave 16 DTO sync is accepted as PASS: Frontend API DTOs, mocks, pages, and tests now match Backend actual OpenAPI for Quality/Publish/PublishedGraph surfaces.
- `INT3-006` is PASS for contract/mock consistency. MVP 3 actual frontend API route smoke remains a follow-up because deterministic cross-process MVP3 seed/smoke data is not available yet.
- Wave 17 should add deterministic MVP 3 seed/smoke support and run actual API route smoke before broadening MVP 3 UI polish or entering MVP 3 closeout.
- Wave 17 actual API smoke harness is accepted as PASS: deterministic backend seed, MVP3 actual frontend route smoke, MVP3 mock route smoke, MVP2 regression smoke, backend focused tests, frontend tests/build all passed.
- `apps/backend/scripts/seed_mvp3.py` is accepted as QA/development support, not product scope.
- `npm run smoke:mvp3:actual` is accepted as the reproducible MVP3 actual frontend API route smoke command.
- MVP 3 can move to closeout with P1 follow-ups only: Docker/PostgreSQL compose smoke, broader Playwright suite formalization, and optional CORS expansion beyond frontend port `5173`.
- Wave 18 should close MVP 3 product P0 and prepare MVP 4 contract-first entry for quality evaluation, advanced graph visualization, search/RAG, and operational UX.
- MVP 3 `ReviewDecisionType` is `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`.
- MVP 3 `ReviewDecisionType` maps to `CandidateReviewStatus` as `APPROVE -> APPROVED`, `REJECT -> REJECTED`, `REQUEST_CHANGES -> NEEDS_DISCUSSION`, `MODIFY_AND_APPROVE -> MODIFIED`.
- MVP 3 warning publish policy: candidates with `WARNING` validation may publish only with explicit reviewer reason, evidence present, and no `FAILED` validation. Missing evidence remains non-publishable.
- MVP 3 published graph P0 boundary: relational `PublishedEntity` / `PublishedRelation` plus published graph snapshot/version metadata are canonical. Neo4j write is P1/optional adapter behavior.
- MVP 3 published graph versioning: each successful `PublishJob` creates an immutable published graph snapshot/version and updates the project current published graph pointer.
- MVP 3 review assignment policy: manual assignment is P0; automatic assignment/load balancing is P1/MVP4+.
- MVP 3 `ValidationResultSeverity` is contract-ready as `INFO`, `WARNING`, `FAILED`, pending final PM freeze in Wave 15 before implementation code freeze.
- MVP 1 and MVP 2 OpenAPI artifacts remain separate for now: `openapi-mvp1.json` and `openapi-mvp2-draft.json`. Do not replace them with a single latest artifact yet.
- `/api/v1/dashboard` is not part of MVP 1 actual API contract. Frontend actual API mode must compute dashboard data from P0 APIs or keep dashboard mock-only/P1 boundary.
- `docs/api/openapi-mvp1.json` is the MVP 1 canonical OpenAPI export artifact.
- Source delete uses internal `is_deleted` soft delete; `SourceStatus` enum is not extended for delete/archive in MVP 1.
- Relation/edge cardinality uses the full Backend/OpenAPI `Cardinality` enum in Frontend for MVP 1.
- `OntologyGraph.classes[]` and `relations[]` are optional/deprecated compatibility fields, not canonical required fields.
- `hana-style-component` install script delay and npm audit findings are P2 dependency hardening follow-up, not MVP 1 release blockers.
- MVP 1 UI style foundation is tracked as `FE-012`; this is a minimal token/primitive/layout/status/hana-adapter guide, not a large redesign.
- 모든 역할 에이전트는 `.agents/skills/handoff-reporting/SKILL.md`를 작업 시작 전 읽고, 종료 시 지정된 `docs/handoffs/wave-XXX/{ROLE}_REPORT.md`에 보고서를 남긴다.
- 작업 완료는 보고서 작성까지 포함한다.

## MVP 1 P0 Demo Flow

```text
프로젝트 생성
→ ontology draft version 생성
→ class/property/relation 작성
→ graph 조회
→ CSV/Excel 업로드
→ preview 확인
```

## Current Blockers / Follow-ups

| Area | Blocker | Linked IDs |
|---|---|---|
| MVP 1 App Acceptance | Closed. Backend regression, OpenAPI freshness, actual FE-to-BE smoke, ontology authoring smoke, source preview smoke, and UAT evidence accepted. | INT-001, INT-003, INT-005 |
| Infra | Docker CLI 부재로 Compose 실제 `up` 검증 미수행. 총괄 환경 예외 승인, 후속 gate로 유지. | BE-002 |
| Browser Automation | Headless render evidence accepted. Full click automation is useful but no longer blocks MVP 1 closeout. | INT-005 |
| MVP 2 Backend Thin Slice | Backend profile/parse/prompt/job/mock extraction/candidate/evidence smoke PASS. | BE2-001~BE2-007, BE2-009 |
| MVP 2 FE Contract Sync | Closed in Wave 7. FE actual API mode profile/parse/prompt/job/candidate/evidence smoke PASS. | FE2-001~FE2-006, INT2-001~INT2-003 |
| MVP 2 Evidence Fixture | Closed in Wave 7. `invalid_evidence_reference` runtime smoke PASS. | PM2-003, PM2-005, BE2-007, INT2-002 |
| Retry-chain dedupe | Closed in Wave 8. Backend retry-chain dedupe smoke PASS. | PM2-004, BE2-008, INT2-004 |
| Ontology delete semantics | Closed in Wave 9. Cascade soft delete plus graph/list/extraction defensive filter PASS. | BE-004, BE-005, FE-005, FE-014 |
| Ontology delete UX | Closed in Wave 9. Class/property/relation confirmation copy and counts PASS. | FE-005, FE-014 |
| Evidence context UX | Closed in Wave 9. Normal and broken evidence route fallback/breadcrumb smoke PASS. | FE2-006, INT2-002 |
| LNB/drilldown IA | Closed in Wave 9 targeted smoke. ID-bound detail routes remain contextual, not flat LNB entries. | FE2-004~FE2-006, INT2-003 |
| MVP 2 Demo Breadth | Closed in Wave 10. Broader local demo PASS across fixture catalog, source profile/parse, prompt/job lifecycle, candidate/evidence browsing, and browser smoke. | PM2-001~PM2-005, BE2-001~BE2-009, FE2-001~FE2-006, INT2-001~INT2-004 |
| MVP 2 Closeout Prep | Closed in Wave 11. `CO-01`~`CO-09` PASS; MVP 2 product closeout approved as `PASS WITH EXCEPTION`. | PM2-001~PM2-005, BE2-001~BE2-009, FE2-001~FE2-006, INT2-001~INT2-004 |
| Docker Compose Smoke | Remaining P1 environment follow-up. Docker CLI unavailable in current environment; Compose smoke is not a product closeout blocker. | BE-002, INT2-003 |
| Browser Smoke Harness | Remaining P1 tooling follow-up. `npm run smoke:mvp2:actual` is reproducible, but can be formalized further as Playwright Test suite later. | FE2-006, INT2-003 |
| Frontend Productization | Closed in Wave 12. `PX-01`~`PX-08` PASS; responsive document-level overflow fixed and rechecked at `390x900`. | FE2-001~FE2-006, FE-012, INT2-003 |
| Wave 13 UIUX Product Polish | Closed. `UX13-01`~`UX13-08` PASS after copy follow-up; fresh QA artifact in `/tmp/ontology-wave13-copy-qa-smoke`. | FE-012, FE2-001~FE2-006, INT2-003 |
| MVP 3 Contract-First Entry | Closed in Wave 14. PM decisions, Backend API draft/OpenAPI, Frontend UX/API requirements, QA INT3 acceptance checklist, and ADR 0006 are ready. | PM3-001~PM3-005, BE3-001~BE3-010, FE3-001~FE3-008, INT3-001~INT3-007 |
| MVP 3 Thin Implementation | Open in Wave 15. PM enum/reason-code freeze must precede Backend/Frontend implementation; runtime QA is not yet runnable until implementation lands. | PM3-001~PM3-005, BE3-001~BE3-010, FE3-001~FE3-008, INT3-001~INT3-007 |
| MVP 3 Actual API DTO Sync | Open in Wave 16. Backend actual API PASS and Frontend mock UX PASS; Frontend must align QualitySummary, PublishJob, PublishedGraphVersion, PublishedLineage, PublishedEntity, and PublishedRelation with actual OpenAPI or add typed API-to-view-model adapters. | FE3-006, FE3-008, INT3-006 |
| MVP 3 Actual API Smoke Harness | Closed in Wave 17. Deterministic seed, actual API route smoke, mock route smoke, MVP2 regression, backend focused tests, and frontend tests/build PASS. | BE3-006, BE3-007, BE3-008, FE3-005, FE3-006, FE3-007, INT3-003, INT3-004, INT3-006 |
| MVP 3 Closeout / MVP 4 Prep | Open in Wave 18. Need MVP3 closeout checklist/release notes and MVP4 contract-first brief/backlog before broad MVP4 implementation. | PM3-005, INT3-001~INT3-007, PM4-001~PM4-005 |

## Next Gate

1. PM: Produce MVP3 closeout checklist/release note and MVP4 prep brief/backlog.
2. Backend: Run closeout regression and document MVP3 seed/OpenAPI commands; review MVP4 backend contract implications.
3. Frontend: Run closeout build/test/smoke and review MVP4 UI/IA implications without opening broad MVP4 UI implementation yet.
4. QA: Verify MVP3 closeout matrix and recommend whether Wave19 may start MVP4 contract-first implementation.

## Latest Role Reports

| Role | Wave | Status | Notes |
|---|---|---|---|
| PM | wave-001 | `PARTIAL / CONTRACT READY` | P0 contract and demo flow decided |
| QA | wave-001 | `FAIL / NOT RUNNABLE` | Runtime surface missing at the time |
| Frontend | wave-002 | `PARTIAL / MOCK SURFACE REPORTED` | Runnable Vite app and mock P0 screens reported; QA verification pending |
| Backend | wave-002 | `PARTIAL / PROJECT-ONTOLOGY PATH REPORTED` | BE-001/002/003/004/005/009 reported complete; Source API and OpenAPI export remain |
| Backend | wave-003 | `PASS / SOURCE API AND OPENAPI EXPORT READY` | Source API, preview, seed, OpenAPI export ready; Docker compose unverified |
| Frontend | wave-003 | `PARTIAL / SOURCE UI READY` | Source UI/API boundary ready; contract precision fixes and real API smoke pending |
| PM | wave-003 | `PASS / CONTRACT DECISIONS RECORDED` | OpenAPI artifact, soft delete, graph compatibility caveat recorded |
| QA | wave-003 | `PARTIAL / CONTRACT FINDINGS REMAIN` | Backend API flow PASS, FE route smoke PASS, INT-002/003 findings remain |
| PM | wave-004 | `PASS / CONTRACT DECISIONS RECORDED` | OpenAPI artifact, full Cardinality, FE-to-BE smoke gate documented |
| Backend | wave-004 | `PASS / GRAPH COMPATIBILITY CLEANUP DONE` | OpenAPI required cleanup and freshness PASS |
| Frontend | wave-004 | `PASS / CONTRACT FIXES AND STYLE FOUNDATION DONE` | API smoke partial, style guide done, browser click not run |
| QA | wave-004 | `PARTIAL / INT-001 AND INT-003 REMAIN` | INT-002 PASS, INT-003 partial, INT-001 partial |
| PM | wave-005 | `PASS / CLOSEOUT DOCS READY` | Dashboard exclusion, UAT rule, MVP 2 entry gate, ADR 0004 documented |
| Backend | wave-005 | `PASS / NO BACKEND CHANGE REQUIRED` | Regression PASS, OpenAPI freshness PASS, `/api/v1/dashboard` remains excluded |
| Frontend | wave-005 | `PASS / ACTUAL API BOUNDARY CLOSED` | Dashboard mismatch fixed, ontology authoring API smoke PASS |
| QA | wave-005 | `PASS WITH ENVIRONMENT EXCEPTION` | INT-003 PASS, INT-001 app acceptance PASS, INT-005 evidence accepted; Docker follow-up |
| PM | wave-006 | `PASS / MVP2 CONTRACT HARDENED` | Enum/status/evidence/mock/masking decisions recorded |
| Backend | wave-006 | `PASS / MVP2 THIN API READY` | Source profiling, parse, prompt, extraction, mock provider, candidate/evidence scaffold PASS |
| Frontend | wave-006 | `PASS / MOCK NAVIGATION READY` | MVP2 routes and mock/API boundary added; actual API smoke not closed |
| QA | wave-006 | `PARTIAL / FE CONTRACT SYNC REQUIRED` | Backend MVP2 smoke PASS; INT2-001 FAIL, INT2-002/003 PARTIAL, INT2-004 PASS |
| PM | wave-007 | `PASS / CONTRACT SYNC DECISIONS CLOSED` | Provider literal, parse response, retry dedupe scope, invalid evidence hook, candidate list shape fixed |
| Backend | wave-007 | `PASS / CONTRACT EXAMPLES AND INVALID EVIDENCE HOOK READY` | OpenAPI examples, provider const, invalid evidence fixture PASS |
| Frontend | wave-007 | `PASS / ACTUAL API CONTRACT SYNC CLOSED` | FE types/client/fixtures synced; job create/run actual smoke PASS |
| QA | wave-007 | `PASS / MVP2 ACTUAL API CONTRACT CLOSED` | INT2-001~INT2-004 all PASS; browser render smoke PASS; Docker exception maintained |
| PM | wave-008 | `PASS / FOCUSED EXPANSION ACCEPTANCE READY` | Workflow, LNB, modeler delete, retry dedupe, candidate/evidence UX acceptance documented |
| Backend | wave-008 | `PASS / RETRY DEDUPE READY` | Retry-chain dedupe implemented; OpenAPI freshness PASS |
| Frontend | wave-008 | `PASS / UI FLOW IMPLEMENTED` | LNB, selected project flow, modeler CRUD, candidate/evidence UX implemented; browser click not run |
| QA | wave-008 | `PARTIAL / TARGETED HARDENING REQUIRED` | Regression PASS; retry dedupe PASS; orphan property, delete confirm, evidence context gaps remain |
| PM | wave-009 | `PASS / TARGETED HARDENING DECISIONS READY` | Cascade soft delete, delete confirmation, evidence fallback, LNB/drilldown acceptance decided |
| Backend | wave-009 | `PASS / ONTOLOGY DELETE HARDENING READY` | Class cascade soft delete, graph/list/extraction filtering, regression tests, OpenAPI freshness PASS |
| Frontend | wave-009 | `PASS / TARGETED UX HARDENING READY` | Delete confirmations, evidence fallback/breadcrumbs, LNB contextual route smoke, actual API smoke PASS |
| QA | wave-009 | `PASS / TARGETED HARDENING CLOSED` | MVP1 regression, Wave7 sync, ontology delete, delete confirm, evidence fallback, LNB/drilldown all PASS |
| PM | wave-010 | `PASS / LOCAL DEMO ACCEPTANCE READY` | Fixture catalog, broken evidence policy, prompt lifecycle, source profile/parse, visible copy acceptance decided |
| Backend | wave-010 | `PASS / LOCAL DEMO API READY` | Source edge cases, fixture catalog, prompt/job lifecycle, retry/dedupe tests, OpenAPI freshness PASS |
| Frontend | wave-010 | `PASS / LOCAL DEMO UX READY` | Fixture selector, job monitor, candidate/evidence filters, visible copy, browser smoke PASS |
| QA | wave-010 | `PASS / BROADER LOCAL DEMO CLOSED` | INT2-001~INT2-004 PASS; next wave recommended MVP 2 closeout preparation |
| PM | wave-011 | `PASS / CLOSEOUT CHECKLIST READY` | CO-01~CO-09 matrix, demo script, release exclusions, Docker/browser exception policy documented |
| Backend | wave-011 | `PASS / CLOSEOUT BACKEND READY` | Backend pytest, ruff, selected closeout smoke, OpenAPI freshness PASS; no schema changes |
| Frontend | wave-011 | `PASS / CLOSEOUT FRONTEND READY` | Build/test/smoke PASS; `npm run smoke:mvp2:actual` and visible-copy guard added |
| QA | wave-011 | `PASS WITH EXCEPTION / MVP2 CLOSEOUT APPROVED` | CO-01~CO-09 PASS; Docker Compose NOT RUNNABLE accepted as P1 environment exception |
| PM | wave-012 | `PASS / PRODUCTIZATION ACCEPTANCE READY` | PX-01~PX-08 UX maturity overlay defined without reopening Backend/API scope |
| Frontend | wave-012 | `PASS / PRODUCTIZED UX READY` | App shell, source-to-evidence workflow, candidate/evidence density, visible copy, responsive containment improved |
| QA | wave-012 | `PASS / PRODUCTIZATION VERIFIED` | PX-01~PX-08 PASS after responsive recheck; actual API smoke/build/test PASS; no API blocker |
| PM | wave-013 | `PASS / UIUX EXPERT REVIEW READY` | UX13-01~UX13-08 acceptance and Frontend orders ready; no Backend/API scope opened |
| Backend | wave-013 | `NOT RUN / NO BACKEND WORK` | Wave 13 was Frontend-only; no API/DTO/enum blocker found |
| Frontend | wave-013 | `PASS / UIUX PRODUCT POLISH READY` | Workflow stage, source readiness, candidate mobile cards, evidence-first viewer, copy follow-up, actual smoke PASS |
| QA | wave-013 | `PASS / UIUX PRODUCT POLISH VERIFIED` | UX13-01~UX13-08 PASS after UX13-05 recheck; fresh artifact `/tmp/ontology-wave13-copy-qa-smoke` |
| PM | wave-014 | `PASS / MVP3 CONTRACT DECISIONS CLOSED` | Review decision mapping, warning publish, relational published graph boundary, versioning, assignment policy closed |
| Backend | wave-014 | `PASS / MVP3 API CONTRACT DRAFT READY` | `docs/api/MVP3_API_CONTRACT_DRAFT.md` and `openapi-mvp3-draft.json` ready; no runtime code changed |
| Frontend | wave-014 | `PASS / MVP3 UX API REQUIREMENTS READY` | Review workflow IA, field/state/error needs, publish/published graph/quality UI requirements ready |
| QA | wave-014 | `PASS / CONTRACT CHECKLIST READY` | `INT3-001`~`INT3-007` checklist ready; runtime remains not runnable until implementation |
| PM | wave-015 | `PASS / IMPLEMENTATION CONTRACT FROZEN` | Severity, eligibility reasons, list wrappers, validation UI fields, lineage, typed quality schema frozen |
| Backend | wave-015 | `PASS / MVP3 THIN RUNTIME READY` | Backend tests, ruff, OpenAPI export, Alembic SQLite smoke PASS; Neo4j remains P1 |
| Frontend | wave-015 | `PASS / MOCK-FIRST MVP3 UX READY` | Review/publish/published graph/quality routes, mock types/fixtures, tests/build/route smoke PASS |
| QA | wave-015 | `PARTIAL / ACTUAL FE DTO SYNC REQUIRED` | INT3-001~005 and INT3-007 PASS; INT3-006 PARTIAL due Quality/Publish/PublishedGraph DTO drift |
| PM | wave-016 | `PASS / OPENAPI SOURCE CONFIRMED` | Backend actual OpenAPI accepted as Wave16 source of truth; drift is implementation sync, not policy change |
| Backend | wave-016 | `PASS / CONTRACT STABLE` | Focused MVP3 tests and OpenAPI compare PASS; no backend contract bug found |
| Frontend | wave-016 | `PASS / ACTUAL DTO SYNC READY` | Quality/Publish/PublishedGraph DTOs aligned to OpenAPI; UI-only fields moved to typed helpers |
| QA | wave-016 | `PASS / DTO SYNC VERIFIED` | INT3-006 PASS for contract/mock consistency; actual MVP3 API route smoke remains seed follow-up |
| PM | wave-017 | `PASS / ACTUAL SMOKE BOUNDARY READY` | Actual API smoke PASS/PARTIAL/FAIL criteria documented; seed/harness classified as QA/dev support |
| Backend | wave-017 | `PASS / MVP3 SEED HELPER READY` | `scripts/seed_mvp3.py` seeds fixed project, review tasks, publish queue, current published graph, quality metrics |
| Frontend | wave-017 | `PASS / MVP3 ACTUAL SMOKE READY` | `npm run smoke:mvp3:actual` added; actual and mock route smokes PASS |
| QA | wave-017 | `PASS / MVP3 ACTUAL SMOKE VERIFIED` | INT3-003/004/006 actual evidence PASS; MVP2 regression PASS; no Wave17 blocker |

## Report Index

| Wave | PM | Backend | Frontend | QA | Next Orders |
|---|---|---|---|---|---|
| wave-001 | `wave-001/PM_REPORT.md` | `wave-001/BACKEND_REPORT.md` | `wave-001/FRONTEND_REPORT.md` | `wave-001/QA_REPORT.md` | `wave-001/NEXT_ORDERS.md` |
| wave-002 | `wave-002/PM_REPORT.md` | `wave-002/BACKEND_REPORT.md` | `wave-002/FRONTEND_REPORT.md` | `wave-002/QA_REPORT.md` | `wave-002/NEXT_ORDERS.md` |
| wave-003 | `wave-003/PM_REPORT.md` | `wave-003/BACKEND_REPORT.md` | `wave-003/FRONTEND_REPORT.md` | `wave-003/QA_REPORT.md` | `wave-003/NEXT_ORDERS.md` |
| wave-004 | `wave-004/PM_REPORT.md` | `wave-004/BACKEND_REPORT.md` | `wave-004/FRONTEND_REPORT.md` | `wave-004/QA_REPORT.md` | `wave-004/NEXT_ORDERS.md` |
| wave-005 | `wave-005/PM_REPORT.md` | `wave-005/BACKEND_REPORT.md` | `wave-005/FRONTEND_REPORT.md` | `wave-005/QA_REPORT.md` | `wave-005/NEXT_ORDERS.md` |
| wave-006 | `wave-006/PM_REPORT.md` | `wave-006/BACKEND_REPORT.md` | `wave-006/FRONTEND_REPORT.md` | `wave-006/QA_REPORT.md` | `wave-006/NEXT_ORDERS.md` |
| wave-007 | `wave-007/PM_REPORT.md` | `wave-007/BACKEND_REPORT.md` | `wave-007/FRONTEND_REPORT.md` | `wave-007/QA_REPORT.md` | `wave-007/NEXT_ORDERS.md` |
| wave-008 | `wave-008/PM_REPORT.md` | `wave-008/BACKEND_REPORT.md` | `wave-008/FRONTEND_REPORT.md` | `wave-008/QA_REPORT.md` | `wave-008/NEXT_ORDERS.md` |
| wave-009 | `wave-009/PM_REPORT.md` | `wave-009/BACKEND_REPORT.md` | `wave-009/FRONTEND_REPORT.md` | `wave-009/QA_REPORT.md` | `wave-009/NEXT_ORDERS.md` |
| wave-010 | `wave-010/PM_REPORT.md` | `wave-010/BACKEND_REPORT.md` | `wave-010/FRONTEND_REPORT.md` | `wave-010/QA_REPORT.md` | `wave-010/NEXT_ORDERS.md` |
| wave-011 | `wave-011/PM_REPORT.md` | `wave-011/BACKEND_REPORT.md` | `wave-011/FRONTEND_REPORT.md` | `wave-011/QA_REPORT.md` | `wave-011/NEXT_ORDERS.md` |
| wave-012 | `wave-012/PM_REPORT.md` | `wave-012/BACKEND_REPORT.md` | `wave-012/FRONTEND_REPORT.md` | `wave-012/QA_REPORT.md` | `wave-012/NEXT_ORDERS.md` |
| wave-013 | `wave-013/PM_REPORT.md` | not run | `wave-013/FRONTEND_REPORT.md` | `wave-013/QA_REPORT.md` | `wave-013/NEXT_ORDERS.md` |
| wave-014 | `wave-014/PM_REPORT.md` | `wave-014/BACKEND_REPORT.md` | `wave-014/FRONTEND_REPORT.md` | `wave-014/QA_REPORT.md` | `wave-014/NEXT_ORDERS.md` |
| wave-015 | `wave-015/PM_REPORT.md` | `wave-015/BACKEND_REPORT.md` | `wave-015/FRONTEND_REPORT.md` | `wave-015/QA_REPORT.md` | `wave-015/NEXT_ORDERS.md` |
| wave-016 | `wave-016/PM_REPORT.md` | `wave-016/BACKEND_REPORT.md` | `wave-016/FRONTEND_REPORT.md` | `wave-016/QA_REPORT.md` | `wave-016/NEXT_ORDERS.md` |
| wave-017 | `wave-017/PM_REPORT.md` | `wave-017/BACKEND_REPORT.md` | `wave-017/FRONTEND_REPORT.md` | `wave-017/QA_REPORT.md` | `wave-017/NEXT_ORDERS.md` |
| wave-018 | pending | pending | pending | pending | `wave-018/NEXT_ORDERS.md` |
