# Current State

최신 총괄 상태판입니다. 총괄 에이전트는 각 wave 보고를 읽은 뒤 이 파일을 갱신합니다.

## Latest Wave

- Current wave: `wave-004`
- Overall status: `ORDERED / CONTRACT CLEANUP AND REAL FE-BE SMOKE REQUIRED`
- 기준일: 2026-06-17

## Latest Decisions

- `docs/api/openapi-mvp1.json` is the MVP 1 canonical OpenAPI export artifact.
- Source delete uses internal `is_deleted` soft delete; `SourceStatus` enum is not extended for delete/archive in MVP 1.
- Relation/edge cardinality uses the full Backend/OpenAPI `Cardinality` enum in Frontend for MVP 1.
- `OntologyGraph.classes[]` and `relations[]` are compatibility fields and should be optional/deprecated, not canonical required fields.
- INT-001 full pass requires actual FE-to-BE smoke with `VITE_USE_MOCK_API=false`; Backend API full flow plus FE mock route smoke is only partial.
- `hana-style-component` install script delay and npm audit findings are P2 dependency hardening follow-up, not MVP 1 release blockers.
- MVP 1 UI style foundation is now tracked as `FE-012`; this is a minimal token/primitive/layout/status/hana-adapter guide, not a large redesign.
- 모든 역할 에이전트는 `.agents/skills/handoff-reporting/SKILL.md`를 작업 시작 전 읽고, 종료 시 지정된 `docs/handoffs/wave-XXX/{ROLE}_REPORT.md`에 보고서를 남긴다.
- 작업 완료는 보고서 작성까지 포함한다.
- MVP 1 P0 demo flow:
  - 프로젝트 생성
  - ontology draft version 생성
  - class/property/relation 작성
  - graph 조회
  - CSV/Excel 업로드
  - preview 확인
- Source upload/list/detail, Source preview는 INT-001 필수이므로 P0.
- Ontology property/version은 MVP 1 Done Criteria에 포함되므로 P0.
- Dev Auth `/api/v1/me`와 FE mock/API boundary는 P0.
- TXT/PDF는 metadata 조회까지만 제공하고 `preview_status=NOT_AVAILABLE`.
- candidate/review/published entity API는 MVP 1 제외.
- `OntologyGraph` payload는 `nodes[]`, `edges[]`, `properties[]`로 확정.
- JSON field는 `snake_case`, DTO schema는 `PascalCase`, enum은 대문자 snake case.

## Current Blockers

| Area | Blocker | Linked IDs |
|---|---|---|
| Backend | Backend Project/Ontology/Source API smoke PASS, OpenAPI export freshness PASS | BE-001, BE-003, BE-004, BE-005, BE-006, BE-007, BE-009, BE-010 |
| Backend Contract | `OntologyGraph.classes[]`, `relations[]` are still required compatibility fields in OpenAPI | BE-010, BE-004, INT-003 |
| Infra | Docker CLI 부재로 Compose 실제 `up` 검증 미수행 | BE-002 |
| Frontend | Contract mismatches remain: OntologyVersionSummary, relation/edge Cardinality, nullable fields | FE-009, FE-005, INT-002, INT-003 |
| Frontend Style | MVP 1 UI style foundation needs to be written before screens grow further | FE-012 |
| Frontend Integration | Actual FE-to-BE smoke with `VITE_USE_MOCK_API=false` not verified | FE-006, FE-007, INT-001 |
| QA | INT-001 full flow PARTIAL until actual FE-to-BE smoke passes | INT-001 |

## Next Gate

1. PM: Wave 4 총괄 결정을 API/backlog/ADR에 반영
2. Backend: `OntologyGraph.classes[]`, `relations[]` optional/deprecated cleanup and OpenAPI regeneration
3. Frontend: Fix OntologyVersionSummary, full Cardinality enum, nullable DTO precision, add FE-012 UI style foundation, then real API smoke
4. QA: Re-run INT-002/INT-003 contract review
5. QA: Re-run INT-001 with actual FE-to-BE smoke if environment allows

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

## Report Index

| Wave | PM | Backend | Frontend | QA | Next Orders |
|---|---|---|---|---|---|
| wave-001 | `wave-001/PM_REPORT.md` | `wave-001/BACKEND_REPORT.md` | `wave-001/FRONTEND_REPORT.md` | `wave-001/QA_REPORT.md` | `wave-001/NEXT_ORDERS.md` |
| wave-002 | `wave-002/PM_REPORT.md` | `wave-002/BACKEND_REPORT.md` | `wave-002/FRONTEND_REPORT.md` | `wave-002/QA_REPORT.md` | `wave-002/NEXT_ORDERS.md` |
| wave-003 | `wave-003/PM_REPORT.md` | `wave-003/BACKEND_REPORT.md` | `wave-003/FRONTEND_REPORT.md` | `wave-003/QA_REPORT.md` | `wave-003/NEXT_ORDERS.md` |
| wave-004 | `wave-004/PM_REPORT.md` | `wave-004/BACKEND_REPORT.md` | `wave-004/FRONTEND_REPORT.md` | `wave-004/QA_REPORT.md` | pending |
