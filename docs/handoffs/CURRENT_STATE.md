# Current State

최신 총괄 상태판입니다. 총괄 에이전트는 각 wave 보고를 읽은 뒤 이 파일을 갱신합니다.

## Latest Wave

- Current wave: `wave-002`
- Overall status: `PARTIAL / FRONTEND MOCK SURFACE AND BACKEND PROJECT-ONTOLOGY PATH REPORTED`
- 기준일: 2026-06-17

## Latest Decisions

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
| Backend | FastAPI scaffold, `/health`, `/api/v1/me`, Project/Ontology P0 API 완료 보고됨. 총괄/QA 독립 검증 대기 | BE-001, BE-009, BE-003, BE-004, BE-005 |
| Backend Source | Source upload/list/detail/preview API 미구현 | BE-006, BE-007 |
| Backend Contract | OpenAPI 노출은 보고됐으나 export 방식 또는 FE 타입 공유 방식 미결정 | BE-010 |
| Infra | Docker CLI 부재로 Compose 실제 `up` 검증 미수행 | BE-002 |
| Frontend | runnable Vite app, app shell, mock P0 화면 완료 보고됨. QA/총괄 독립 검증 대기 | FE-001, FE-002, FE-004, FE-005 |
| Frontend Contract | `shared/api`, `shared/mocks` 구성 보고됨. Backend OpenAPI 부재로 contract diff 대기 | FE-009, BE-010, INT-002, INT-003 |
| Frontend Follow-up | 실제 API 연결, Source upload 확장, create/edit mutation, FE smoke/Storybook 미완료 | FE-006, FE-007, FE-010 |
| QA | INT-001 full flow는 Source upload/preview 미구현으로 아직 full pass 불가 | INT-001, BE-006, BE-007 |

## Next Gate

1. Backend: `BE-006`, `BE-007` Source upload/list/detail/preview API 구현
2. Backend contract: `BE-010` OpenAPI export 또는 FE 타입 공유 방식 확정
3. Frontend: Backend OpenAPI 준비 후 `shared/api` contract 조정, `FE-006`, `FE-007` 실제 upload/API 연결 확장
4. QA: Backend Project/Ontology path smoke와 Frontend mock flow smoke 확인 가능
5. QA: Source API와 OpenAPI export 준비 후 `INT-002`, `INT-003` 재실행
6. Source upload/preview가 준비된 뒤 `INT-001` full demo flow 재검증

## Latest Role Reports

| Role | Wave | Status | Notes |
|---|---|---|---|
| PM | wave-001 | `PARTIAL / CONTRACT READY` | P0 contract and demo flow decided |
| QA | wave-001 | `FAIL / NOT RUNNABLE` | Runtime surface missing at the time |
| Frontend | wave-002 | `PARTIAL / MOCK SURFACE REPORTED` | Runnable Vite app and mock P0 screens reported; QA verification pending |
| Backend | wave-002 | `PARTIAL / PROJECT-ONTOLOGY PATH REPORTED` | BE-001/002/003/004/005/009 reported complete; Source API and OpenAPI export remain |

## Report Index

| Wave | PM | Backend | Frontend | QA | Next Orders |
|---|---|---|---|---|---|
| wave-001 | `wave-001/PM_REPORT.md` | `wave-001/BACKEND_REPORT.md` | `wave-001/FRONTEND_REPORT.md` | `wave-001/QA_REPORT.md` | `wave-001/NEXT_ORDERS.md` |
| wave-002 | `wave-002/PM_REPORT.md` | `wave-002/BACKEND_REPORT.md` | `wave-002/FRONTEND_REPORT.md` | `wave-002/QA_REPORT.md` | pending |
