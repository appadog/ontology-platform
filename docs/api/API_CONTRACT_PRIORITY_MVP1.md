# API Contract Priority MVP 1

MVP 1은 contract-first로 진행한다. 백엔드는 OpenAPI와 mock response를 먼저 노출하고, 프론트엔드는 mock fixture로 병렬 구현한다.

## 1. Priority Order

| Priority | Domain | 이유 |
|---|---|---|
| P0 | Health / Dev Auth | 로컬 실행과 dev mode 확인 |
| P0 | Project | 모든 기능의 상위 컨텍스트 |
| P0 | Ontology Version | draft/published 상태와 모델러 기준 버전 |
| P0 | Ontology Class / Property / Relation | 모델러와 그래프의 핵심 |
| P0 | Ontology Graph | FE 모델러 캔버스의 단일 조회 계약 |
| P0 | Source Upload / List / Detail | INT-001 데모 데이터 등록 흐름 |
| P0 | Source Preview | CSV/Excel 미리보기 |
| P1 | Dashboard Summary | P0 API 결과로 대체 가능하므로 별도 집계는 후순위 |
| P1 | Seed Data | 데모와 테스트 안정화 |
| P2 | Audit-lite | 후속 audit log 확장 지점 |

## 1.1 P0 Demo API Flow

INT-001의 기준 happy path는 아래 순서로 고정한다.

1. `GET /health`, `GET /api/v1/me`로 로컬 backend와 dev role을 확인한다.
2. `POST /api/v1/projects`로 프로젝트를 만들고 `GET /api/v1/projects/{project_id}`로 상세를 확인한다.
3. `POST /api/v1/projects/{project_id}/ontology/versions`로 draft version을 만든다.
4. class, property, relation을 생성하고 `GET /api/v1/ontology/versions/{version_id}/graph`로 모델러 그래프를 조회한다.
5. `POST /api/v1/projects/{project_id}/sources/upload`로 CSV/Excel을 업로드한다.
6. `GET /api/v1/sources/{source_id}/preview`로 sample rows와 columns를 확인한다.

## 2. Endpoint Draft

### Health

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | backend status |
| GET | `/api/v1/me` | dev user와 role 확인 |

### Project

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/projects` | 프로젝트 목록 |
| POST | `/api/v1/projects` | 프로젝트 생성 |
| GET | `/api/v1/projects/{project_id}` | 프로젝트 상세 |
| PATCH | `/api/v1/projects/{project_id}` | 프로젝트 수정 |
| DELETE | `/api/v1/projects/{project_id}` | 프로젝트 archive/delete |

### Ontology

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/projects/{project_id}/ontology/versions` | 온톨로지 버전 목록 |
| POST | `/api/v1/projects/{project_id}/ontology/versions` | draft version 생성 |
| POST | `/api/v1/ontology/versions/{version_id}/publish` | version publish |
| GET | `/api/v1/ontology/versions/{version_id}/classes` | class 목록 |
| POST | `/api/v1/ontology/versions/{version_id}/classes` | class 생성 |
| PATCH | `/api/v1/ontology/classes/{class_id}` | class 수정 |
| DELETE | `/api/v1/ontology/classes/{class_id}` | class 삭제 |
| GET | `/api/v1/ontology/versions/{version_id}/properties` | property 목록 |
| POST | `/api/v1/ontology/versions/{version_id}/properties` | property 생성 |
| PATCH | `/api/v1/ontology/properties/{property_id}` | property 수정 |
| DELETE | `/api/v1/ontology/properties/{property_id}` | property 삭제 |
| GET | `/api/v1/ontology/versions/{version_id}/relations` | relation 목록 |
| POST | `/api/v1/ontology/versions/{version_id}/relations` | relation 생성 |
| PATCH | `/api/v1/ontology/relations/{relation_id}` | relation 수정 |
| DELETE | `/api/v1/ontology/relations/{relation_id}` | relation 삭제 |
| GET | `/api/v1/ontology/versions/{version_id}/graph` | 모델러 그래프 데이터 |

### Source

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/projects/{project_id}/sources` | source 목록 |
| POST | `/api/v1/projects/{project_id}/sources/upload` | multipart 파일 업로드와 source metadata 생성 |
| GET | `/api/v1/sources/{source_id}` | source 상세 |
| GET | `/api/v1/sources/{source_id}/preview` | CSV/Excel sample preview |
| DELETE | `/api/v1/sources/{source_id}` | source internal soft delete |

Source list는 `source_type`, `preview_status`, `limit`, `offset` query를 지원할 수 있다. 삭제된 source는 list/detail/preview와 project `source_count`에서 제외한다.

## 3. DTO Draft

DTO 이름은 OpenAPI schema의 PascalCase 이름으로 고정한다. JSON field는 snake_case를 사용한다.

### ApiError

```text
code
message
details
```

### DevUser

```text
id
name
roles[]
```

### ProjectCreateRequest

```text
name
description
```

### ProjectUpdateRequest

```text
name
description
status
```

### ProjectSummary

```text
id
name
description
status
created_at
updated_at
source_count
ontology_version_count
```

### ProjectDetail

```text
id
name
description
status
current_ontology_version_id
source_count
ontology_version_count
created_at
updated_at
```

### OntologyVersion

```text
id
project_id
version
status
created_at
published_at
created_by
```

### OntologyGraph

```text
version_id
version_status
nodes[]
edges[]
properties[]
```

`nodes[]`, `edges[]`, `properties[]`가 canonical graph payload다. Backend가 transition 기간에 `classes[]`, `relations[]`를 함께 반환할 수는 있지만, 이 둘은 compatibility field이며 FE/QA contract 판정 기준으로 사용하지 않는다.

### OntologyGraphNode

```text
id
class_id
label
position
status
```

### OntologyGraphEdge

```text
id
relation_id
source_class_id
target_class_id
label
cardinality
status
```

### OntologyClass

```text
id
version_id
name
label
description
status
position
created_at
updated_at
```

### OntologyProperty

```text
id
version_id
class_id
name
label
description
data_type
cardinality
required
status
created_at
updated_at
```

### OntologyRelation

```text
id
version_id
name
label
description
domain_class_id
range_class_id
cardinality
required
status
created_at
updated_at
```

### SourceUploadRequest

```text
file
source_type
display_name
```

### SourceData

```text
id
project_id
file_name
source_type
mime_type
size_bytes
status
preview_status
storage_uri
uploaded_at
created_by
metadata
```

### SourcePreview

```text
source_id
columns[]
rows[]
row_count_sampled
total_row_count
sheet_name
warnings[]
```

### SourcePreviewColumn

```text
name
data_type
nullable
sample_values[]
```

## 3.1 P0 Enum Binding

| Field | Enum source |
|---|---|
| `DevUser.roles[]` | `Role` |
| `ProjectSummary.status`, `ProjectDetail.status`, `ProjectUpdateRequest.status` | `ProjectStatus` |
| `OntologyVersion.status`, `OntologyGraph.version_status` | `OntologyVersionStatus` |
| `OntologyClass.status`, `OntologyProperty.status`, `OntologyRelation.status`, graph node/edge `status` | `OntologyElementStatus` |
| `OntologyProperty.data_type`, `SourcePreviewColumn.data_type` | `PropertyDataType` |
| `OntologyProperty.cardinality`, `OntologyRelation.cardinality`, graph edge `cardinality` | `Cardinality` |
| `SourceData.source_type`, `SourceUploadRequest.source_type` | `SourceType` |
| `SourceData.status` | `SourceStatus` |
| `SourceData.preview_status` | `SourcePreviewStatus` |

## 3.2 P0 Mock Response Requirements

Backend OpenAPI examples and frontend `shared/mocks` fixtures must include the same minimum happy-path payloads.

### ProjectDetail Example

```json
{
  "id": "project-demo",
  "name": "기업 문서 온톨로지 Demo",
  "description": "MVP 1 demo project",
  "status": "ACTIVE",
  "current_ontology_version_id": "version-demo-draft",
  "source_count": 1,
  "ontology_version_count": 1,
  "created_at": "2026-06-17T00:00:00Z",
  "updated_at": "2026-06-17T00:00:00Z"
}
```

### OntologyGraph Example

```json
{
  "version_id": "version-demo-draft",
  "version_status": "DRAFT",
  "nodes": [
    {
      "id": "node-company",
      "class_id": "class-company",
      "label": "Company",
      "position": { "x": 120, "y": 120 },
      "status": "ACTIVE"
    }
  ],
  "edges": [
    {
      "id": "edge-company-department",
      "relation_id": "relation-has-department",
      "source_class_id": "class-company",
      "target_class_id": "class-department",
      "label": "HAS_DEPARTMENT",
      "cardinality": "ONE_TO_MANY",
      "status": "ACTIVE"
    }
  ],
  "properties": [
    {
      "id": "property-company-name",
      "version_id": "version-demo-draft",
      "class_id": "class-company",
      "name": "company_name",
      "label": "Company Name",
      "description": "Legal company name",
      "data_type": "STRING",
      "cardinality": "REQUIRED",
      "required": true,
      "status": "ACTIVE",
      "created_at": "2026-06-17T00:00:00Z",
      "updated_at": "2026-06-17T00:00:00Z"
    }
  ]
}
```

### SourceData Example

```json
{
  "id": "source-demo-csv",
  "project_id": "project-demo",
  "file_name": "companies.csv",
  "source_type": "CSV",
  "mime_type": "text/csv",
  "size_bytes": 2048,
  "status": "UPLOADED",
  "preview_status": "READY",
  "storage_uri": "minio://ontology-platform/project-demo/companies.csv",
  "uploaded_at": "2026-06-17T00:00:00Z",
  "created_by": "dev-user",
  "metadata": {}
}
```

### SourcePreview Example

```json
{
  "source_id": "source-demo-csv",
  "columns": [
    {
      "name": "company_name",
      "data_type": "STRING",
      "nullable": false,
      "sample_values": ["Acme Corp"]
    }
  ],
  "rows": [
    { "company_name": "Acme Corp", "department_name": "Research" }
  ],
  "row_count_sampled": 1,
  "total_row_count": 20,
  "sheet_name": null,
  "warnings": []
}
```

## 4. Contract Rules

- Enum 문자열은 `docs/pm/GLOSSARY.md`와 동일하게 쓴다.
- Backend는 OpenAPI schema에 request/response DTO를 노출한다.
- Frontend는 `shared/api`에 API client와 타입 경계를 둔다.
- `OntologyGraph`의 canonical field는 `nodes`, `edges`, `properties`다. `classes`, `relations`는 backend compatibility field로만 허용하며 frontend 신규 구현과 QA contract review는 canonical field만 기준으로 삼는다.
- Breaking change는 `docs/adr` 또는 API change note로 기록한다.
- MVP 1 API는 candidate/review/publish를 구현하지 않지만, naming이 후속 확장을 막지 않아야 한다.
- 모든 timestamp는 ISO 8601 문자열로 반환한다.
- ID는 문자열 UUID를 기본값으로 둔다.
- Project/Ontology 삭제 API는 MVP 1에서 물리 삭제가 아니라 `ARCHIVED` 또는 `DELETED` 상태 변경으로 처리한다.
- Source delete는 `SourceStatus` enum을 늘리지 않고 backend internal `is_deleted` soft delete로 처리한다. 삭제된 source는 목록, 상세, preview, project `source_count`에서 제외하며 이후 detail/preview 조회는 not found로 간주한다.
- TXT/PDF는 `SourcePreviewStatus=NOT_AVAILABLE`로 반환하고, CSV/Excel만 sample row preview를 제공한다.
- `BE-010` OpenAPI/type sharing 결정: Backend는 `docs/api/openapi-mvp1.json`을 canonical OpenAPI export로 제공한다. Frontend는 이 파일에서 타입을 생성하거나 수동 동기화하며, QA는 이 파일을 INT-002/INT-003 contract review 기준으로 사용한다.
