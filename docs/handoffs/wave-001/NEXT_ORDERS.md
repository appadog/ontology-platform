# Next Orders - Wave 2

## 현재 단계 판정

- Overall: `ORDERED / IMPLEMENTATION IN PROGRESS`
- PM contract: `PARTIAL / CONTRACT READY`
- QA runtime acceptance: `FAIL / NOT RUNNABLE`
- 주요 이유: Backend/Frontend runnable surface와 contract artifacts가 아직 부족하다.

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- 작업 범위는 MVP 1 P0에 머문다.
- 작업 종료 전 반드시 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 지정된 report path에 완료 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- API/Enum/DTO 변경이 있으면 변경 파일과 영향받는 역할을 보고서에 명시한다.

## PM 지시

- Report path: `docs/handoffs/wave-002/PM_REPORT.md`
- Backlog IDs: `PM-005`, `PM-006`, `PM-007`
- 해야 할 일:
  - Backend/Frontend가 구현 중 발견한 API/enum/DTO 모호성을 판정한다.
  - `SourceStatus`, `SourcePreviewStatus`, `OntologyGraph` 계약이 구현에 반영되는지 확인한다.
  - `BE-010` 타입 공유 방식 결정이 들어오면 ADR 또는 API 문서에 반영한다.
  - MVP 1 scope guard 위반 여부를 확인한다.
- 완료 기준:
  - PM 변경/결정이 있으면 docs에 반영되어 있다.
  - 다음 QA contract review에서 사용할 기준이 명확하다.
  - wave-002 PM report가 작성되어 있다.

## Backend 지시

- Report path: `docs/handoffs/wave-002/BACKEND_REPORT.md`
- Backlog IDs: `BE-001`, `BE-009`, `BE-003`, `BE-004`, `BE-005`, `BE-006`, `BE-007`, `BE-010`
- 해야 할 일:
  - `apps/backend`에 runnable FastAPI scaffold를 만든다.
  - `/health`와 `/api/v1/me`를 구현한다.
  - Project CRUD P0 API를 구현한다.
  - Ontology version/class/property/relation/graph P0 API를 구현한다.
  - Source upload/list/detail/preview P0 API를 구현한다.
  - CSV/Excel preview response는 `columns`, `rows`, `warnings`를 포함한다.
  - TXT/PDF는 metadata만 제공하고 `preview_status=NOT_AVAILABLE`을 사용한다.
  - P0 DTO schema와 examples가 포함된 OpenAPI를 제공한다.
  - OpenAPI export 또는 FE 타입 공유 방식을 제안한다.
- 제한:
  - 실제 LLM extraction, candidate review, publish graph API는 구현하지 않는다.
  - enum 문자열은 `docs/pm/GLOSSARY.md`와 일치시킨다.
- 완료 기준:
  - backend 실행 방법이 README에 있다.
  - `/health`, `/api/v1/me`, P0 API가 OpenAPI에 노출된다.
  - 실행/검증 명령과 결과가 wave-002 backend report에 기록되어 있다.

## Frontend 지시

- Report path: `docs/handoffs/wave-002/FRONTEND_REPORT.md`
- Backlog IDs: `FE-001`, `FE-002`, `FE-009`, `FE-004`, `FE-005`, `FE-006`, `FE-007`
- 해야 할 일:
  - `apps/frontend`에 runnable Vite + React + TypeScript scaffold를 만든다.
  - app shell, routing, sidebar, topbar, project selector, page header를 구현한다.
  - `shared/api`와 `shared/mocks` 경계를 만든다.
  - P0 DTO/enum mock fixture를 `docs/api/API_CONTRACT_PRIORITY_MVP1.md`와 `docs/pm/GLOSSARY.md` 기준으로 작성한다.
  - Project list/detail 화면을 mock 또는 API boundary 기반으로 구현한다.
  - Ontology modeler 초안을 `nodes[]`, `edges[]`, `properties[]` 계약 기준으로 구현한다.
  - Source upload/list/preview 화면을 구현한다.
  - CSV/Excel preview와 TXT/PDF `NOT_AVAILABLE` notice를 구분한다.
- 제한:
  - 업무 화면에서 `hana-style-component`를 직접 import하지 않는다. adapter를 사용한다.
  - 실제 LLM, candidate review, RAG 화면은 구현하지 않는다.
- 완료 기준:
  - frontend dev server 실행 방법이 README에 있다.
  - 주요 route가 생성되어 있다.
  - mock/API 타입과 enum이 계약 문서와 일치한다.
  - 실행/검증 명령과 결과가 wave-002 frontend report에 기록되어 있다.

## QA 지시

- Report path: `docs/handoffs/wave-002/QA_REPORT.md`
- Backlog IDs: `INT-002`, `INT-003`, 이후 조건 충족 시 `INT-001`
- 해야 할 일:
  - Backend OpenAPI와 Frontend `shared/api`, `shared/mocks`가 생긴 뒤 contract review를 수행한다.
  - enum mismatch, DTO field mismatch, path mismatch를 backlog ID에 연결한다.
  - runtime 앱이 실행 가능하면 INT-001 full demo flow를 재검증한다.
  - 아직 실행 불가능하면 `FAIL / NOT RUNNABLE`로 유지하고 정확한 blocker를 기록한다.
- 완료 기준:
  - `INT-002`, `INT-003` 판정이 보고서에 있다.
  - 가능한 경우 `INT-001` 재검증 결과가 있다.
  - 실패 항목은 BE/FE/PM backlog ID와 연결되어 있다.

## Contract Freeze / 변경 제한

- `OntologyGraph`: `nodes[]`, `edges[]`, `properties[]`
- `SourceStatus`와 `SourcePreviewStatus`는 분리
- TXT/PDF preview는 `NOT_AVAILABLE`
- JSON field: `snake_case`
- DTO schema: `PascalCase`
- enum: 대문자 snake case

## 다음 보고 위치

- PM: `docs/handoffs/wave-002/PM_REPORT.md`
- Backend: `docs/handoffs/wave-002/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-002/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-002/QA_REPORT.md`
