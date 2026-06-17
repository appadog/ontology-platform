# MVP 1 Backlog

MVP 1 목표는 로컬 실행 가능한 서비스 뼈대와 Project/Ontology/Source 기본 흐름을 완성하는 것이다. 이 백로그는 PM, Backend, Frontend가 병렬로 맡을 수 있게 쪼갠 작업 지시 구조다.

## Scope Guard

MVP 1에서 하지 않는 것:

- 실제 LLM 후보 추출
- 전문가 검수 워크플로우
- 복잡한 품질 점수
- RAG 질의응답
- 실사용 SSO/RBAC
- 고급 RDF/OWL/SHACL import/export

## Dependency Map

```text
PM-001/002/003
  → BE-001/002
  → BE-009 Dev Auth/RBAC shell
  → BE-003 Project API
  → FE-001/002 app shell + FE-009 mock/API boundary
  → BE-004/005 Ontology API + FE-005 Modeler
  → BE-006/007 Source API + FE-006/007 Source UI
  → INT-001 demo acceptance
```

## PM Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| PM-001 | P0 | PM | MVP 1 범위와 제외 범위 확정 | none | `docs/pm/PRD_MVP1.md`가 백엔드/프론트엔드 작업 기준으로 승인됨 |
| PM-002 | P0 | PM | 샘플 도메인 확정 | PM-001 | seed data와 데모 시나리오에 사용할 클래스/관계가 정의됨 |
| PM-003 | P0 | PM | API 우선순위 확정 | PM-001 | `docs/api/API_CONTRACT_PRIORITY_MVP1.md`에 P0/P1 API가 정의됨 |
| PM-004 | P0 | PM | IA와 화면별 수용 기준 확정 | PM-001 | `docs/pm/IA_MVP1.md`가 주요 화면, route, 상태, API 의존성을 포함함 |
| PM-005 | P0 | PM | 공통 용어집과 enum 관리 | PM-001 | `docs/pm/GLOSSARY.md`의 enum이 API/UI에서 사용됨 |
| PM-006 | P1 | PM | Definition of Done 운영 | PM-001 | 각 backlog item에 검증 가능한 acceptance가 있음 |
| PM-007 | P2 | PM | ADR 운영 시작 | none | 주요 기술 선택과 P0 계약 결정이 `docs/adr/`에 기록됨 |

## Backend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| BE-001 | P0 | Backend | FastAPI 프로젝트 스캐폴드 | PM-003 | `apps/backend`에 앱 entrypoint, health endpoint, README 실행법이 있음 |
| BE-002 | P0 | Backend/Infra | 로컬 Docker Compose 구성 | PM-003 | postgres, redis, minio, neo4j 또는 graph adapter가 로컬에서 실행됨 |
| BE-003 | P0 | Backend | Project CRUD API | BE-001 | Project create/list/detail/update/archive API가 OpenAPI에 노출됨 |
| BE-004 | P0 | Backend | Ontology class/relation API | BE-003 | class/relation CRUD와 graph 조회 API가 OpenAPI에 노출됨 |
| BE-005 | P0 | Backend | Ontology property/version API | BE-004 | draft/published version과 property CRUD가 동작함 |
| BE-006 | P0 | Backend | Source upload/list/detail API | BE-003, BE-002 | CSV/Excel/TXT/PDF 파일 metadata가 저장되고 조회됨 |
| BE-007 | P0 | Backend | CSV/Excel preview API | BE-006 | sample rows, columns, warnings를 반환함 |
| BE-008 | P1 | Backend | Seed data | BE-003, BE-004 | 샘플 프로젝트와 기업 문서 온톨로지가 생성됨 |
| BE-009 | P0 | Backend | Dev Auth/RBAC shell | BE-001 | `/api/v1/me`가 dev user와 role을 반환함 |
| BE-010 | P2 | Backend | OpenAPI contract export | BE-003, BE-004, BE-005, BE-006, BE-007 | 프론트엔드가 타입 생성 또는 수동 타입 동기화에 쓸 수 있음 |

## Frontend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| FE-001 | P0 | Frontend | Vite + React + TypeScript 스캐폴드 | PM-004 | `apps/frontend`가 로컬 dev server로 실행됨 |
| FE-002 | P0 | Frontend | App shell과 routing | FE-001 | sidebar, topbar, project selector, page header가 있음 |
| FE-003 | P0 | Frontend | `hana-style-component` adapter 조사/구성 | FE-001 | `src/shared/ui/hana` adapter가 있고 직접 import가 제한됨 |
| FE-004 | P0 | Frontend | Project list/detail 화면 | FE-002, BE-003 또는 mock | 목록, 생성, 상세 empty/error/loading 상태가 있음 |
| FE-005 | P0 | Frontend | Ontology modeler 초안 | FE-002, BE-004/BE-005 또는 mock | class node, relation edge, property list를 그래프/패널에서 볼 수 있음 |
| FE-006 | P0 | Frontend | Source upload/list 화면 | FE-002, BE-006 또는 mock | 파일 업로드 action, source table, status badge가 있음 |
| FE-007 | P0 | Frontend | Source preview 화면 | FE-006, BE-007 또는 mock | CSV/Excel sample table preview가 표시됨 |
| FE-008 | P1 | Frontend | Dashboard 초안 | FE-004, FE-006 | 프로젝트/소스/온톨로지 요약 지표가 표시됨 |
| FE-009 | P0 | Frontend | Mock fixtures/API client boundary | FE-001, PM-003, PM-005 | `shared/api`와 `shared/mocks` 경계가 분리되고 P0 DTO/enum fixture가 있음 |
| FE-010 | P2 | Frontend | 기본 테스트/Storybook 준비 | FE-003 | 핵심 공통 UI adapter의 smoke test 또는 story가 있음 |

## Integration Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| INT-001 | P0 | PM/Fullstack | MVP 1 데모 시나리오 검증 | BE-003, BE-004, BE-005, BE-006, BE-007, BE-009, FE-004, FE-005, FE-006, FE-007, FE-009 | 프로젝트 생성 → 온톨로지 작성 → 파일 업로드 → preview 확인 흐름이 통과함 |
| INT-002 | P1 | Backend/Frontend | API enum 동기화 | PM-005, BE-010, FE-009 | UI와 API가 같은 enum 문자열을 사용함 |
| INT-003 | P1 | PM/Backend/Frontend | OpenAPI 기반 contract review | BE-010, FE-009 | missing field, naming mismatch, status mismatch가 backlog로 정리됨 |
| INT-004 | P2 | PM/QA | MVP 1 acceptance checklist | INT-001 | 수용 기준 통과/미통과가 문서화됨 |

### Integration/QA Notes

- 2026-06-17 INT-001 수용 리포트: `docs/backlog/INT-001_MVP1_DEMO_ACCEPTANCE.md`

## Definition of Done

- 변경 범위가 MVP 1에 머문다.
- API는 OpenAPI에 노출된다.
- UI는 loading, empty, error 상태를 가진다.
- enum과 용어는 `docs/pm/GLOSSARY.md`와 일치한다.
- 로컬 실행 방법이 README에 기록된다.
- PM 수용 기준을 최소 1개 이상 통과한다.

## MVP 1 P0 Acceptance Checklist

### PM/Contract

- [ ] PRD, IA, API contract, Glossary가 같은 P0 범위를 가리킨다.
- [ ] `docs/adr`에 P0 API와 demo flow 결정이 기록되어 있다.
- [ ] `SourceType`, `SourceStatus`, `SourcePreviewStatus`, `OntologyElementStatus`, `Cardinality`, `PropertyDataType` enum이 OpenAPI와 UI mock fixture에 반영되어 있다.

### Backend

- [ ] `/health`, `/api/v1/me`가 dev mode에서 동작한다.
- [ ] Project CRUD가 OpenAPI에 노출되고 `ProjectSummary`, `ProjectDetail`을 반환한다.
- [ ] Ontology version/class/property/relation/graph API가 OpenAPI에 노출된다.
- [ ] Source upload/list/detail/preview API가 OpenAPI에 노출된다.
- [ ] CSV/Excel preview는 columns, sample rows, warnings를 반환한다.
- [ ] TXT/PDF source는 metadata를 반환하고 `preview_status=NOT_AVAILABLE`을 사용한다.

### Frontend

- [ ] `/projects`, `/projects/:projectId`, `/projects/:projectId/ontology`, `/projects/:projectId/sources`, `/projects/:projectId/sources/:sourceId` route가 있다.
- [ ] Project, Ontology, Source 화면에 loading, empty, error, permission/dev mode notice가 있다.
- [ ] Ontology modeler는 class node, relation edge, property list를 같은 `version_id` 기준으로 렌더링한다.
- [ ] Source detail은 CSV/Excel table preview와 TXT/PDF `NOT_AVAILABLE` notice를 구분한다.
- [ ] API mock fixture의 DTO/enum 이름이 `docs/api/API_CONTRACT_PRIORITY_MVP1.md`와 `docs/pm/GLOSSARY.md`와 일치한다.

## Backend/Frontend Blockers

| 상태 | 항목 | 결정/조치 |
|---|---|---|
| Resolved | Source upload/preview 우선순위 | INT-001 필수 흐름이므로 BE-006, BE-007, FE-006, FE-007을 P0로 승격한다. |
| Resolved | Ontology property/version 우선순위 | MVP 1 Done Criteria에 속성 생성과 draft/published 상태가 있으므로 BE-005를 P0로 승격한다. |
| Resolved | `preview_status` enum 부재 | `SourcePreviewStatus`를 glossary에 추가하고 API DTO binding에 반영한다. |
| Resolved | 화면 route와 API 의존성 불명확 | IA에 route contract와 screen acceptance를 추가한다. |
| Resolved | Dev Auth 우선순위 | `/api/v1/me`가 P0 API이므로 BE-009를 P0로 승격한다. |
| Resolved | FE mock/API boundary 우선순위 | contract-first 병렬 개발을 위해 FE-009를 P0로 승격한다. |
| Open | OpenAPI 타입 공유 방식 | BE-010에서 export 또는 FE 수동 타입 동기화 방식을 결정한다. |
