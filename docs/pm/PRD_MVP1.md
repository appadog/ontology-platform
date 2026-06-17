# PRD MVP 1 v0.1

## 1. 개요

MVP 1차는 온톨로지 기반 데이터 구축 플랫폼의 로컬 실행 가능한 뼈대를 만든다. 사용자는 프로젝트를 생성하고, 온톨로지 클래스/속성/관계를 정의하고, 데이터 파일을 업로드해 기본 미리보기를 볼 수 있어야 한다.

## 2. 목표

- 로컬 개발환경에서 frontend, backend, database, cache, object storage, graph adapter를 실행할 수 있다.
- Project, Ontology, Source Data의 기본 관리 흐름을 완성한다.
- 프론트엔드와 백엔드가 동일한 용어와 enum을 사용하도록 API contract-first 개발 기반을 만든다.
- 후속 MVP의 LLM 후보 생성, evidence, 검수, 게시 그래프 분리를 수용할 수 있는 구조를 준비한다.

## 3. 범위

### Backend

- FastAPI 프로젝트 초기화
- PostgreSQL, Redis, MinIO, Neo4j 또는 임시 graph adapter 로컬 구성
- 개발용 인증 모드
- Project CRUD
- Ontology CRUD
  - Class
  - Property
  - Relation
  - Domain/Range
  - Cardinality
  - draft/published version 상태
- SourceData 등록
  - CSV
  - Excel
  - TXT
  - PDF는 원본 업로드와 메타데이터까지만 지원
- 파일 메타데이터 저장
- CSV/Excel preview
- OpenAPI 문서
- seed data

### Frontend

- Vite + React + TypeScript 프로젝트 초기화
- styled-components ThemeProvider
- `hana-style-component` dependency 설치 및 adapter 구성
- 기본 routing
- 레이아웃: sidebar, topbar, project selector, page header
- Dashboard
- Project list/detail
- Ontology modeler draft
- Source upload/list/preview
- Ontology graph 기본 시각화
- loading, empty, error 상태

### PM

- MVP 1 범위 고정
- 사용자 역할 정의
- IA v0.1
- API 계약 우선순위
- Definition of Done
- 샘플 도메인 선정

### MVP 1 Scope Lock

| 결정 | 내용 |
|---|---|
| 샘플 도메인 | `기업 문서 온톨로지`로 고정한다. |
| P0 데모 흐름 | 프로젝트 생성 → 온톨로지 version 생성 → class/property/relation 작성 → 그래프 확인 → CSV/Excel 업로드 → preview 확인 |
| 그래프 구현 | Neo4j가 늦어져도 backend graph adapter 또는 mock graph response로 모델러 그래프를 먼저 제공한다. |
| Source preview | INT-001 데모 필수 흐름이므로 CSV/Excel upload와 preview는 P0로 취급한다. |
| 버전 상태 | MVP 1은 `DRAFT`, `PUBLISHED`, `ARCHIVED` 상태를 노출한다. 실제 검수/게시 그래프 반영은 하지 않는다. |
| 후보/게시 그래프 | candidate/review/published entity API는 만들지 않는다. 다만 naming은 후속 MVP 확장을 막지 않는다. |

## 4. 제외 범위

- 실제 LLM 관계 추출
- 전문가 검수 워크플로우
- 복잡한 품질 점수
- RAG 질의응답
- 실사용 SSO/RBAC
- RDF/OWL/SHACL import/export

## 5. 핵심 사용자

| 사용자 | MVP 1에서의 역할 |
|---|---|
| PROJECT_ADMIN | 프로젝트 생성, 데모 데이터 확인 |
| ONTOLOGY_MANAGER | 클래스/속성/관계 생성과 버전 상태 확인 |
| DATA_MANAGER | 데이터 파일 업로드와 preview 확인 |
| VIEWER | 대시보드와 그래프 조회 |

후속 MVP에서 SYSTEM_ADMIN, EXTRACTION_MANAGER, REVIEWER, API_CLIENT 역할을 확장한다.

## 6. 사용자 시나리오

### S1. 프로젝트 생성

Given 사용자가 프로젝트 목록 화면에 접근한다.  
When 새 프로젝트 이름과 설명을 입력하고 생성한다.  
Then 프로젝트가 생성되고 상세 화면에서 상태와 최근 활동을 볼 수 있다.

### S2. 온톨로지 클래스/속성/관계 작성

Given 사용자가 프로젝트 상세에서 온톨로지 모델러로 이동한다.  
When 클래스와 속성을 만들고 관계의 domain/range를 지정한다.  
Then 그래프 캔버스에서 클래스 노드와 관계 edge를 볼 수 있고, 선택한 클래스의 속성 목록을 확인할 수 있다.

### S3. 데이터 소스 업로드와 preview

Given 사용자가 데이터 소스 화면에 접근한다.  
When CSV 또는 Excel 파일을 업로드한다.  
Then 파일 메타데이터와 샘플 row preview를 확인할 수 있다.

### S4. MVP 1 통합 데모

Given dev mode 사용자가 로컬 앱에 접근한다.  
When 새 프로젝트를 만들고 기업 문서 온톨로지의 클래스, 속성, 관계를 작성한 뒤 CSV/Excel 파일을 업로드한다.  
Then 프로젝트 상세, 모델러 그래프, source preview 화면에서 같은 프로젝트와 ontology version 기준의 데이터를 확인할 수 있다.

## 7. 수용 기준

### P0 Acceptance

- 로컬에서 frontend, backend, postgres, redis, minio, graph-db 또는 graph adapter가 실행된다.
- `/docs` 또는 OpenAPI UI에서 P0 API schema와 mock response를 확인할 수 있다.
- `/api/v1/me`는 dev user와 `PROJECT_ADMIN`, `ONTOLOGY_MANAGER`, `DATA_MANAGER`, `VIEWER` role을 반환한다.
- 프로젝트 생성, 목록 조회, 상세 조회, 수정, archive/delete가 가능하다.
- 프로젝트 상세는 현재 ontology version, source count, ontology version count를 보여준다.
- 온톨로지 draft version을 만들고 `DRAFT`/`PUBLISHED`/`ARCHIVED` 상태를 확인할 수 있다.
- 온톨로지 클래스/속성/관계 생성과 목록 조회가 가능하다.
- 모델러 graph API와 UI는 class node, relation edge, property 목록을 같은 version 기준으로 보여준다.
- CSV/Excel 업로드 후 preview API와 UI에서 columns, sample rows, warnings를 볼 수 있다.
- TXT/PDF는 원본 업로드와 메타데이터 조회가 가능하고 preview 상태는 `NOT_AVAILABLE`로 표시된다.
- 모든 주요 화면은 loading, empty, error, permission/dev mode notice 상태를 가진다.

### INT-001 Demo Checklist

- [ ] 사용자가 dev mode로 앱에 진입하면 현재 role과 project selector를 볼 수 있다.
- [ ] 사용자가 `기업 문서 온톨로지 Demo` 프로젝트를 새로 만들 수 있다.
- [ ] 사용자가 `Company`, `Person`, `Department`, `Document`, `Contract` class를 만들 수 있다.
- [ ] 사용자가 class 속성과 relation을 만들고 domain/range/cardinality를 지정할 수 있다.
- [ ] 사용자가 모델러 canvas에서 class node와 relation edge를 확인할 수 있다.
- [ ] 사용자가 CSV 또는 Excel 파일을 업로드하고 source list에서 `SourceStatus=UPLOADED`, `SourcePreviewStatus=READY`를 볼 수 있다.
- [ ] 사용자가 source detail에서 sample columns와 rows를 확인할 수 있다.
- [ ] API와 UI의 enum 문자열이 `docs/pm/GLOSSARY.md`와 일치한다.

## 8. 샘플 도메인

MVP 1의 기본 샘플 도메인은 `기업 문서 온톨로지`로 둔다.

초기 클래스 후보:

- Company
- Person
- Department
- Document
- Contract

초기 관계 후보:

- Company `HAS_DEPARTMENT` Department
- Person `BELONGS_TO` Department
- Document `AUTHORED_BY` Person
- Contract `SIGNED_BY` Company

선정 이유: CSV/Excel과 TXT/PDF 데모 모두에 적용하기 쉽고, 후속 MVP의 evidence와 후보 관계 추출 데모로 확장하기 좋다.
