# Current State

최신 총괄 상태판입니다. 총괄 에이전트는 각 wave 보고를 읽은 뒤 이 파일을 갱신합니다.

## Latest Wave

- Current wave: `wave-006`
- Overall status: `MVP 1 APP ACCEPTANCE CLOSED / MVP 2 IMPLEMENTATION KICKOFF READY`
- 기준일: 2026-06-17

## Latest Decisions

- Wave 5 QA evidence is accepted for MVP 1 app acceptance closeout.
- Docker CLI absence is approved as an environment exception for MVP 1 closeout. Compose smoke remains a follow-up infra gate, not an MVP 1 app acceptance blocker.
- Headless Chrome render evidence plus actual API write smoke is accepted as `INT-005` browser/manual UAT evidence. Full click automation remains a follow-up when tooling is available.
- MVP 2 implementation may begin in Wave 6, starting with contract hardening plus the first thin Backend/Frontend slices for profiling, segments, prompts, extraction jobs, and deterministic mock extraction.
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
| MVP 2 Contract | `SourceSegment`, `SourceProfileColumn`, `ExtractionJob.status`, evidence policy, raw payload masking, candidate filters require Wave 6 hardening. | PM2-001~PM2-005, BE2-001~BE2-007, INT2-001 |

## Next Gate

1. PM: Lock MVP 2 user flow, evidence policy, enum/status policy, and mock provider acceptance.
2. Backend: Implement the first MVP 2 thin slice: SourceSegment/profile/parse contract plus prompt/job/model-run/mock-provider/candidate scaffold as ordered.
3. Frontend: Add MVP 2 navigation and mock/API boundary for profiling, chunks, extraction jobs, candidate results, and evidence.
4. QA: Prepare MVP 2 contract tests and deterministic fixtures; verify MVP 1 remains green.

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

## Report Index

| Wave | PM | Backend | Frontend | QA | Next Orders |
|---|---|---|---|---|---|
| wave-001 | `wave-001/PM_REPORT.md` | `wave-001/BACKEND_REPORT.md` | `wave-001/FRONTEND_REPORT.md` | `wave-001/QA_REPORT.md` | `wave-001/NEXT_ORDERS.md` |
| wave-002 | `wave-002/PM_REPORT.md` | `wave-002/BACKEND_REPORT.md` | `wave-002/FRONTEND_REPORT.md` | `wave-002/QA_REPORT.md` | `wave-002/NEXT_ORDERS.md` |
| wave-003 | `wave-003/PM_REPORT.md` | `wave-003/BACKEND_REPORT.md` | `wave-003/FRONTEND_REPORT.md` | `wave-003/QA_REPORT.md` | `wave-003/NEXT_ORDERS.md` |
| wave-004 | `wave-004/PM_REPORT.md` | `wave-004/BACKEND_REPORT.md` | `wave-004/FRONTEND_REPORT.md` | `wave-004/QA_REPORT.md` | `wave-004/NEXT_ORDERS.md` |
| wave-005 | `wave-005/PM_REPORT.md` | `wave-005/BACKEND_REPORT.md` | `wave-005/FRONTEND_REPORT.md` | `wave-005/QA_REPORT.md` | `wave-005/NEXT_ORDERS.md` |
| wave-006 | `wave-006/PM_REPORT.md` | `wave-006/BACKEND_REPORT.md` | `wave-006/FRONTEND_REPORT.md` | `wave-006/QA_REPORT.md` | pending |
