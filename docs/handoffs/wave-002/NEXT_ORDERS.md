# Next Orders - Wave 3

## 현재 단계 판정

- Overall: `PARTIAL / SOURCE FLOW AND CONTRACT EXPORT ARE NEXT GATE`
- Frontend: `PARTIAL / MOCK SURFACE READY`
- Backend: `PARTIAL / PROJECT-ONTOLOGY PATH READY`
- QA: `WAITING / CAN START PARTIAL SMOKE`

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- 작업 범위는 MVP 1 P0에 머문다.
- 작업 종료 전 반드시 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 지정된 report path에 완료 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- API/Enum/DTO 변경이 있으면 변경 파일과 영향받는 역할을 보고서에 명시한다.

## PM 지시

- Report path: `docs/handoffs/wave-003/PM_REPORT.md`
- Backlog IDs: `PM-005`, `PM-006`, `PM-007`
- 해야 할 일:
  - `OntologyGraph` contract는 `nodes[]`, `edges[]`, `properties[]`를 canonical payload로 유지한다.
  - Backend가 응답에 `classes`, `relations`를 함께 제공하는 것은 compatibility field로 허용하되, FE/QA 기준 계약은 canonical payload로 판정한다.
  - `BE-010` OpenAPI export/type sharing 결정이 나오면 `docs/api/API_CONTRACT_PRIORITY_MVP1.md` 또는 ADR에 반영한다.
  - `hana-style-component` install script 지연과 npm audit 5건은 MVP 1 risk로 기록할지 별도 task로 분리할지 판정한다.
  - Source upload/preview 구현 중 enum/DTO 모호성이 생기면 즉시 결정한다.
- 완료 기준:
  - contract 변경/결정이 문서에 반영되어 있다.
  - Wave 3 QA가 사용할 contract 기준이 명확하다.
  - `docs/handoffs/wave-003/PM_REPORT.md`가 작성되어 있다.

## Backend 지시

- Report path: `docs/handoffs/wave-003/BACKEND_REPORT.md`
- Backlog IDs: `BE-006`, `BE-007`, `BE-010`, 가능하면 `BE-008`
- 해야 할 일:
  - Source upload/list/detail API를 구현한다.
  - CSV/Excel preview API를 구현한다.
  - TXT/PDF는 metadata만 저장/조회하고 `preview_status=NOT_AVAILABLE`을 사용한다.
  - `SourceStatus`와 `SourcePreviewStatus`를 분리해서 OpenAPI schema에 노출한다.
  - `SourceData`, `SourcePreview` response examples를 OpenAPI에 포함한다.
  - OpenAPI export 또는 FE 타입 공유 방식을 확정한다.
  - 가능하면 seed data(`BE-008`)를 추가해 INT-001 demo setup을 줄인다.
  - Docker CLI가 없는 환경이면 compose 검증은 미수행으로 명확히 보고한다.
- 제한:
  - 실제 LLM extraction, candidate review, publish graph API는 구현하지 않는다.
  - enum 문자열은 `docs/pm/GLOSSARY.md`와 일치시킨다.
- 완료 기준:
  - Source upload/list/detail/preview API가 OpenAPI에 노출된다.
  - CSV/Excel preview가 `columns`, `rows`, `warnings`를 반환한다.
  - TXT/PDF가 `preview_status=NOT_AVAILABLE`로 처리된다.
  - OpenAPI export/type sharing 방안이 보고서에 명시된다.
  - 실행/검증 명령과 결과가 `docs/handoffs/wave-003/BACKEND_REPORT.md`에 기록되어 있다.

## Frontend 지시

- Report path: `docs/handoffs/wave-003/FRONTEND_REPORT.md`
- Backlog IDs: `FE-006`, `FE-007`, `FE-009`, 가능하면 `FE-004`, `FE-005` mutation follow-up
- 해야 할 일:
  - Backend Source API 계약이 나오면 `shared/api/types.ts`, `shared/api/client.ts`, `shared/mocks`를 맞춘다.
  - Source upload input/API 연결을 준비한다.
  - CSV/Excel preview와 TXT/PDF `NOT_AVAILABLE` 상태를 실제 API/fixture 양쪽에서 구분한다.
  - Project create/edit mutation과 Ontology class/relation/property 생성·수정 form은 가능 범위에서 시작하되, Source flow를 우선한다.
  - `OntologyGraph`는 `nodes[]`, `edges[]`, `properties[]`를 canonical으로 사용한다.
- 제한:
  - 업무 화면에서 `hana-style-component`를 직접 import하지 않는다.
  - 실제 LLM, candidate review, RAG 화면은 노출하지 않는다.
- 완료 기준:
  - Source list/detail/preview가 Backend Source DTO와 맞는다.
  - API/mock boundary가 contract review 가능한 상태다.
  - 실행/검증 명령과 결과가 `docs/handoffs/wave-003/FRONTEND_REPORT.md`에 기록되어 있다.

## QA 지시

- Report path: `docs/handoffs/wave-003/QA_REPORT.md`
- Backlog IDs: `INT-002`, `INT-003`, 부분 `INT-001`
- 해야 할 일:
  - 지금 가능한 범위에서 Backend Project/Ontology path smoke를 수행한다.
  - 지금 가능한 범위에서 Frontend app shell + Project/Ontology/Source mock flow smoke를 수행한다.
  - Backend Source API와 OpenAPI export가 들어오면 `INT-002`, `INT-003` contract review를 수행한다.
  - Source upload/preview가 준비되면 `INT-001` full demo flow를 재검증한다.
  - 실패 항목은 반드시 `BE-*`, `FE-*`, `PM-*`, `INT-*` ID에 연결한다.
- 완료 기준:
  - Backend partial smoke와 Frontend partial smoke 판정이 있다.
  - 가능하면 OpenAPI vs FE mock/type diff 결과가 있다.
  - `INT-001`이 아직 full pass 불가하면 정확한 blocker를 적는다.
  - `docs/handoffs/wave-003/QA_REPORT.md`가 작성되어 있다.

## Contract Freeze / 변경 제한

- `OntologyGraph`: canonical payload는 `nodes[]`, `edges[]`, `properties[]`.
- Backend가 `classes`, `relations`를 추가 제공할 수 있지만 FE/QA 기준 계약은 canonical payload다.
- `SourceStatus`와 `SourcePreviewStatus`는 분리한다.
- TXT/PDF preview는 `NOT_AVAILABLE`.
- JSON field: `snake_case`.
- DTO schema: `PascalCase`.
- enum: 대문자 snake case.

## 다음 보고 위치

- PM: `docs/handoffs/wave-003/PM_REPORT.md`
- Backend: `docs/handoffs/wave-003/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-003/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-003/QA_REPORT.md`
