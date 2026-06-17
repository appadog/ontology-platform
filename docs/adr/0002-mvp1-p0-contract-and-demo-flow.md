# ADR 0002: MVP 1 P0 Contract and Demo Flow

## Status

Accepted

## Context

MVP 1의 통합 수용 기준인 INT-001은 프로젝트 생성, 온톨로지 작성, 파일 업로드, CSV/Excel preview 확인까지 한 번에 통과해야 한다. 기존 문서에서는 Source upload/preview와 Ontology property/version이 P1로 분류되어 있어 백엔드와 프론트엔드가 데모 필수 범위를 다르게 해석할 수 있었다.

또한 `preview_status`, ontology element `status`, source type, property data type처럼 API와 UI가 같이 써야 하는 enum 일부가 glossary에 고정되어 있지 않았다.

## Decision

- MVP 1 P0 demo flow는 프로젝트 생성 → ontology draft version 생성 → class/property/relation 작성 → graph 조회 → CSV/Excel 업로드 → preview 확인으로 고정한다.
- Source upload/list/detail API와 CSV/Excel preview API는 INT-001 필수 흐름이므로 P0로 승격한다.
- Ontology property/version API는 MVP 1 Done Criteria의 속성 생성과 draft/published 상태 노출을 만족해야 하므로 P0로 승격한다.
- Dev Auth `/api/v1/me`와 frontend mock/API boundary는 contract-first 병렬 개발의 선행 조건이므로 P0로 둔다.
- P0 OpenAPI schema는 `ProjectSummary`, `ProjectDetail`, `OntologyVersion`, `OntologyClass`, `OntologyProperty`, `OntologyRelation`, `OntologyGraph`, `SourceData`, `SourcePreview` DTO 이름을 사용한다.
- API JSON field는 snake_case, DTO schema 이름은 PascalCase, enum 값은 대문자 snake case를 사용한다.
- Enum source of truth는 `docs/pm/GLOSSARY.md`로 둔다.
- TXT/PDF는 MVP 1에서 원본 업로드와 metadata 조회만 제공하며, preview는 `SourcePreviewStatus=NOT_AVAILABLE`로 표시한다.
- Candidate graph, expert review, published entity/relation API는 MVP 1에서 만들지 않는다.

## Consequences

- BE-005, BE-006, BE-007, BE-009와 FE-006, FE-007, FE-009는 P0로 다뤄야 한다.
- Frontend는 BE API 완료 전에도 API 문서의 DTO와 enum으로 mock fixture를 만들 수 있다.
- Backend는 OpenAPI에 enum과 DTO schema를 명시해야 하며, 임의 문자열 status를 반환하지 않는다.
- INT-001 acceptance는 Source preview까지 완료되어야 통과로 본다.

## Follow-up

- BE-010에서 OpenAPI export 또는 frontend 타입 생성 방식을 결정한다.
- INT-002에서 backend OpenAPI enum과 frontend mock fixture enum 문자열을 비교한다.
- INT-003에서 missing field, naming mismatch, status mismatch를 contract review note로 정리한다.
