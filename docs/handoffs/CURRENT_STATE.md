# Current State

최신 총괄 상태판입니다. 총괄 에이전트는 각 wave 보고를 읽은 뒤 이 파일을 갱신합니다.

## Latest Wave

- Current wave: `wave-005`
- Overall status: `MVP 1 ACCEPTANCE CLOSEOUT REQUIRED / MVP 2 PREP DRAFT READY`
- 기준일: 2026-06-17

## Latest Decisions

- MVP 2 implementation must not begin until MVP 1 acceptance closeout is complete or PM explicitly grants an exception.
- `/api/v1/dashboard` is not part of MVP 1 actual API contract. Frontend actual API mode must compute dashboard data from P0 APIs or keep dashboard mock-only/P1 boundary.
- Browser click smoke is preferred for INT-001; if automation is unavailable, QA must leave manual UAT evidence or explicit not-run reason.
- `docs/api/openapi-mvp1.json` is the MVP 1 canonical OpenAPI export artifact.
- Source delete uses internal `is_deleted` soft delete; `SourceStatus` enum is not extended for delete/archive in MVP 1.
- Relation/edge cardinality uses the full Backend/OpenAPI `Cardinality` enum in Frontend for MVP 1.
- `OntologyGraph.classes[]` and `relations[]` are optional/deprecated compatibility fields, not canonical required fields.
- INT-001 full pass requires actual FE-to-BE smoke with `VITE_USE_MOCK_API=false`; Backend API full flow plus FE mock route smoke is only partial.
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

## Current Blockers

| Area | Blocker | Linked IDs |
|---|---|---|
| Backend | Backend Project/Ontology/Source API smoke PASS, OpenAPI export freshness PASS | BE-001, BE-003, BE-004, BE-005, BE-006, BE-007, BE-009, BE-010 |
| Infra | Docker CLI 부재로 Compose 실제 `up` 검증 미수행 | BE-002 |
| Frontend Contract | Dashboard client calls missing `/api/v1/dashboard`; graph compatibility nullable type precision remains | FE-008, FE-009, INT-003 |
| Frontend Authoring | Actual API mode ontology authoring wrappers/UI not complete | FE-005, FE-014, INT-001 |
| Frontend Integration | Browser interaction smoke not run; actual FE-to-BE route/API smoke passed only partially | FE-006, FE-007, INT-001, INT-005 |
| QA | INT-001 and INT-003 remain PARTIAL | INT-001, INT-003 |

## Next Gate

1. PM: Dashboard exclusion, UAT smoke rule, MVP 2 readiness docs review.
2. Frontend: Remove/replace `/api/v1/dashboard` actual call, fix graph compatibility nullable type, add ontology authoring actual API boundary.
3. Backend: Support only; no dashboard endpoint unless PM reopens contract.
4. QA: Re-run INT-003 and INT-001, decide MVP 2 readiness.

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

## Report Index

| Wave | PM | Backend | Frontend | QA | Next Orders |
|---|---|---|---|---|---|
| wave-001 | `wave-001/PM_REPORT.md` | `wave-001/BACKEND_REPORT.md` | `wave-001/FRONTEND_REPORT.md` | `wave-001/QA_REPORT.md` | `wave-001/NEXT_ORDERS.md` |
| wave-002 | `wave-002/PM_REPORT.md` | `wave-002/BACKEND_REPORT.md` | `wave-002/FRONTEND_REPORT.md` | `wave-002/QA_REPORT.md` | `wave-002/NEXT_ORDERS.md` |
| wave-003 | `wave-003/PM_REPORT.md` | `wave-003/BACKEND_REPORT.md` | `wave-003/FRONTEND_REPORT.md` | `wave-003/QA_REPORT.md` | `wave-003/NEXT_ORDERS.md` |
| wave-004 | `wave-004/PM_REPORT.md` | `wave-004/BACKEND_REPORT.md` | `wave-004/FRONTEND_REPORT.md` | `wave-004/QA_REPORT.md` | `wave-004/NEXT_ORDERS.md` |
| wave-005 | `wave-005/PM_REPORT.md` | `wave-005/BACKEND_REPORT.md` | `wave-005/FRONTEND_REPORT.md` | `wave-005/QA_REPORT.md` | pending |
