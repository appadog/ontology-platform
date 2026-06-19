# Current State

최신 총괄 상태판입니다. 총괄 에이전트는 각 wave 보고를 읽은 뒤 이 파일을 갱신합니다.

## Latest Wave

- Current wave: `wave-010`
- Overall status: `MVP 2 WAVE 9 TARGETED HARDENING PASS / WAVE 10 BROADER LOCAL DEMO EXPANSION READY`
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
| MVP 2 Demo Breadth | Wave 10 should broaden the local demo around source profile/parse edge cases, prompt/job run/retry UX, fixture catalog coverage, and candidate/evidence filtering without opening review/publish/RAG/external LLM. | PM2-001~PM2-005, BE2-001~BE2-009, FE2-001~FE2-006, INT2-001~INT2-004 |

## Next Gate

1. PM: Define Wave 10 MVP 2 local demo acceptance for source profile/parse, prompt/job lifecycle, fixture catalog, candidate/evidence browsing, and remaining scope guards.
2. Backend: Broaden deterministic fixtures and regression tests for source segments, job run/retry/failure, candidate/evidence validation, and OpenAPI freshness.
3. Frontend: Improve source-to-extraction-to-candidate workflow ergonomics in actual API mode, including fixture selection, job states, candidate filters, and evidence navigation.
4. QA: Run a broader MVP 2 local demo regression and decide whether the next wave should move toward MVP 2 closeout or another targeted hardening pass.

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
| wave-010 | `wave-010/PM_REPORT.md` | `wave-010/BACKEND_REPORT.md` | `wave-010/FRONTEND_REPORT.md` | `wave-010/QA_REPORT.md` | pending |
