# IA MVP 1 v0.1

## 1. Navigation

```text
Dashboard
Projects
  Project List
  Project Detail
Ontology
  Modeler
Sources
  Source List
  Source Detail / Preview
```

후속 MVP 메뉴는 라우트 shell만 예약할 수 있지만, MVP 1 화면에 노출하지 않는다.

```text
Extraction Jobs
Candidate Review
Quality Dashboard
Graph Explorer
Prompt Manager
Admin
```

## 1.1 Route Contract

| Route | Screen | P0/P1 | Primary API |
|---|---|---|---|
| `/` | Dashboard | P1 | project list/detail 결과로 구성 |
| `/projects` | Project List | P0 | `GET /api/v1/projects`, `POST /api/v1/projects` |
| `/projects/:projectId` | Project Detail | P0 | `GET /api/v1/projects/{project_id}` |
| `/projects/:projectId/ontology` | Ontology Modeler | P0 | ontology version/class/property/relation/graph APIs |
| `/projects/:projectId/sources` | Source List | P0 | `GET /api/v1/projects/{project_id}/sources`, upload API |
| `/projects/:projectId/sources/:sourceId` | Source Detail / Preview | P0 | `GET /api/v1/sources/{source_id}`, preview API |

프로젝트가 선택되지 않은 상태에서는 `/projects`를 기본 진입점으로 사용한다.

## 2. App Layout

```text
Sidebar: 주요 메뉴
Topbar: 현재 프로젝트, 사용자/dev mode 상태
Page Header: title, description, primary action
Content: 화면별 work area
Right Panel 또는 Drawer: 선택 항목 상세
```

## 3. MVP 1 Screens

| 화면 | 목적 | 주요 컴포넌트 |
|---|---|---|
| Dashboard | 프로젝트 상태를 빠르게 파악 | metric cards, recent activity, source status |
| Project List | 프로젝트 생성/선택 | table/list, create modal, status badge |
| Project Detail | 프로젝트 개요와 진입점 | summary, ontology/source quick links |
| Ontology Modeler | 클래스/관계/속성 초안 작성 | left list, graph canvas, right detail panel |
| Source List | 업로드 데이터 관리 | upload action, source table, status badge |
| Source Detail | 파일 메타데이터와 preview 확인 | metadata panel, table preview, raw file info |

## 3.1 Screen Acceptance

### Project List

Given 사용자가 `/projects`에 접근한다.  
When 프로젝트 목록 API가 성공한다.  
Then 프로젝트 이름, 상태, source count, ontology version count, updated at이 표시되고 create action을 사용할 수 있다.

### Project Detail

Given 사용자가 프로젝트를 선택한다.  
When 상세 API가 성공한다.  
Then 프로젝트 상태, 현재 ontology version, source 요약, Ontology/Sources 진입 action이 표시된다.

### Ontology Modeler

Given 사용자가 프로젝트의 ontology route에 접근한다.  
When version graph API가 성공한다.  
Then class node, relation edge, property list가 같은 `version_id` 기준으로 표시된다.

### Source List

Given 사용자가 source route에 접근한다.  
When source list API가 성공한다.  
Then file name, source type, source status, preview status, uploaded at이 표시되고 upload action을 사용할 수 있다.

### Source Detail / Preview

Given 사용자가 CSV/Excel source를 선택한다.  
When preview API가 성공한다.  
Then columns, sample rows, warnings가 table preview로 표시된다.

Given 사용자가 TXT/PDF source를 선택한다.  
When detail API가 성공한다.  
Then 파일 metadata와 `SourcePreviewStatus=NOT_AVAILABLE` notice가 표시된다.

## 4. Ontology Modeler Layout

```text
Left Panel
  Class / Relation / Property 목록
  Search / Filter

Center Canvas
  Class nodes
  Relation edges
  Zoom / Pan

Right Panel
  선택한 node/edge 상세
  Domain / Range
  Cardinality
  Draft / Published 상태
```

### Modeler Interaction Contract

| Action | Required field/state | API dependency |
|---|---|---|
| Create class | name, label, description optional | `POST /api/v1/ontology/versions/{version_id}/classes` |
| Create property | class_id, name, data_type, cardinality, required | `POST /api/v1/ontology/versions/{version_id}/properties` |
| Create relation | name, domain_class_id, range_class_id, cardinality, required | `POST /api/v1/ontology/versions/{version_id}/relations` |
| Select graph node | class detail and properties | class/property list or graph payload |
| Select graph edge | relation detail with domain/range | relation list or graph payload |

## 5. Source Manager Layout

```text
Top Action
  Upload source

List
  File name
  Source type
  Upload status
  Preview status
  Uploaded at

Detail
  File metadata
  CSV/Excel sample rows
  TXT/PDF metadata
```

### Source Interaction Contract

| Action | Required field/state | API dependency |
|---|---|---|
| Upload source | file, source_type, display_name optional | `POST /api/v1/projects/{project_id}/sources/upload` |
| Open source detail | source_id | `GET /api/v1/sources/{source_id}` |
| Open preview | source_id and `preview_status=READY` | `GET /api/v1/sources/{source_id}/preview` |
| Archive source | source_id | `DELETE /api/v1/sources/{source_id}` |

## 6. UI States

모든 주요 화면은 아래 상태를 제공한다.

- loading
- empty
- error
- permission/dev mode notice

색상만으로 상태를 전달하지 않고 badge text와 icon을 함께 사용한다.

## 7. API/Enum Display Rules

- UI badge text는 `docs/pm/GLOSSARY.md`의 enum 문자열을 그대로 표시하거나, 별도 label을 쓰더라도 원 enum 값을 tooltip 또는 detail에 노출한다.
- API DTO field는 snake_case로 받고, 화면 내부 view model 변환은 `shared/api` 경계에서만 허용한다.
- source preview는 CSV/Excel에서만 table을 렌더링한다. TXT/PDF는 metadata 중심 detail과 `NOT_AVAILABLE` notice를 보여준다.
- 권한 부족은 empty/error가 아니라 permission notice로 표시한다.
