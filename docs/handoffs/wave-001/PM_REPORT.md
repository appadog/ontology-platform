# PM Report - Wave 1

## 담당 범위

- PM-001~PM-005 기준으로 MVP 1 범위, 샘플 도메인, API 우선순위, IA, 용어집 정리
- INT-001 데모 흐름 기준 수용 체크리스트와 blocker 정리
- P0/P1 우선순위 충돌 해소
- API/enum/DTO 문서 계약 보완
- ADR 0002로 P0 계약 결정 기록

## 완료한 작업

- MVP 1 P0 demo flow 확정:
  - 프로젝트 생성
  - ontology draft version 생성
  - class/property/relation 작성
  - graph 조회
  - CSV/Excel 업로드
  - preview 확인
- Source upload/list/detail, Source preview를 INT-001 필수 P0로 확정.
- Ontology property/version을 MVP 1 Done Criteria에 포함된 P0로 확정.
- Dev Auth `/api/v1/me`와 FE mock/API boundary를 P0로 확정.
- TXT/PDF는 metadata 조회까지만 제공하고 `preview_status=NOT_AVAILABLE`로 확정.
- candidate/review/published entity API는 MVP 1 제외로 확정.

## 변경 파일

- `docs/pm/PRD_MVP1.md`
- `docs/pm/IA_MVP1.md`
- `docs/pm/GLOSSARY.md`
- `docs/api/API_CONTRACT_PRIORITY_MVP1.md`
- `docs/backlog/MVP1_BACKLOG.md`
- `docs/backlog/INT-001_MVP1_DEMO_ACCEPTANCE.md`
- `docs/adr/0002-mvp1-p0-contract-and-demo-flow.md`

## API/Enum/DTO 변경

- `OntologyGraph` payload는 `nodes[]`, `edges[]`, `properties[]`로 확정.
- 추가/정리 enum:
  - `Role`
  - `ProjectStatus`
  - `OntologyVersionStatus`
  - `OntologyElementStatus`
  - `SourceType`
  - `SourceStatus`
  - `SourcePreviewStatus`
  - `PropertyDataType`
  - `Cardinality`
- P0 DTO examples 추가:
  - `ProjectDetail`
  - `OntologyGraph`
  - `SourceData`
  - `SourcePreview`
- JSON field는 `snake_case`, DTO schema는 `PascalCase`, enum은 대문자 snake case.

## Blocker

- Backend/Frontend 구현체가 아직 없어 INT-001은 runtime 기준 `FAIL / NOT RUNNABLE`.
- OpenAPI schema export 또는 FE 타입 생성 방식 미결정: `BE-010`.
- FE `shared/api`, `shared/mocks` 미구현: `FE-009`.
- Backend `/health`, `/api/v1/me`, Project/Ontology/Source P0 API 미구현.

## 다른 역할에 전달할 내용

- Backend: `BE-001`, `BE-009`, `BE-003`, `BE-004`, `BE-005`, `BE-006`, `BE-007` 순서로 P0 API scaffold 진행.
- Frontend: `FE-001`, `FE-002`, `FE-009` 우선 진행 후 `FE-004~FE-007` 병렬 진행.
- QA: OpenAPI와 FE mock fixture 생성 후 `INT-002`, `INT-003` contract review 재실행.

## 현재 판정

- `PARTIAL`
- PM contract 정리는 완료됐으나 runtime 구현이 없어 demo flow는 아직 검증 불가.
