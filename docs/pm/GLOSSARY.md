# Glossary

PM, Backend, Frontend가 같은 이름과 enum을 쓰기 위한 공통 용어집입니다.

| 용어 | 정의 | MVP |
|---|---|---|
| Project | 데이터 구축 작업의 최상위 작업 공간 | 1 |
| Ontology | 클래스, 속성, 관계, 제약조건의 논리 모델 | 1 |
| OntologyVersion | 온톨로지의 draft/published 버전 | 1 |
| OntologyClass | 그래프 노드 타입 | 1 |
| OntologyProperty | 클래스가 가지는 속성 정의 | 1 |
| OntologyRelation | 클래스 간 관계 정의 | 1 |
| Domain | 관계의 출발 클래스 | 1 |
| Range | 관계의 도착 클래스 | 1 |
| Cardinality | 관계 또는 속성의 허용 개수 제약 | 1 |
| SourceData | 업로드된 원천 데이터 단위 | 1 |
| SourcePreview | CSV/Excel의 샘플 row preview | 1 |
| SourceSegment | row, page, paragraph, chunk 등 evidence 연결 단위 | 2 |
| ExtractionJob | LLM 후보 추출 작업 | 2 |
| ModelRun | 특정 모델/프롬프트/온톨로지 버전으로 실행된 기록 | 2 |
| CandidateEntity | LLM이 제안한 후보 엔티티 | 2 |
| CandidateRelation | LLM이 제안한 후보 관계 | 2 |
| CandidateEvidence | 후보의 원천 근거 | 2 |
| ValidationResult | 온톨로지 제약/품질 규칙 검증 결과 | 3 |
| ReviewDecision | 전문가 검수 결정 | 3 |
| PublishedEntity | 승인 후 게시 그래프에 반영된 엔티티 | 3 |
| PublishedRelation | 승인 후 게시 그래프에 반영된 관계 | 3 |

## Naming Rules

- DTO schema 이름은 PascalCase를 사용한다. 예: `ProjectSummary`, `OntologyGraph`, `SourcePreview`.
- API JSON field는 snake_case를 사용한다. 예: `project_id`, `preview_status`, `created_at`.
- Enum 값은 대문자 snake case를 사용한다. 예: `NOT_AVAILABLE`, `MANY_TO_ONE`.
- Frontend 내부 view model은 자유롭게 둘 수 있지만, `shared/api` 경계 밖으로 API enum 문자열을 임의 변경하지 않는다.

## Shared Status Values

### Role

```text
SYSTEM_ADMIN
PROJECT_ADMIN
ONTOLOGY_MANAGER
DATA_MANAGER
EXTRACTION_MANAGER
REVIEWER
VIEWER
API_CLIENT
```

### OntologyVersionStatus

```text
DRAFT
PUBLISHED
ARCHIVED
```

### OntologyElementStatus

```text
DRAFT
ACTIVE
ARCHIVED
DELETED
```

### ProjectStatus

```text
DRAFT
ACTIVE
ARCHIVED
DELETED
```

### SourceType

```text
CSV
EXCEL
TXT
PDF
```

### SourceStatus

```text
UPLOADED
PARSING
PARSED
PROFILED
EXTRACTION_READY
FAILED
```

MVP 1에서는 `UPLOADED`, `PROFILED`, `FAILED`를 우선 사용한다. `PARSING`, `PARSED`, `EXTRACTION_READY`는 MVP 2 확장 지점이다.

### SourcePreviewStatus

```text
PENDING
READY
NOT_AVAILABLE
FAILED
```

CSV/Excel preview가 생성되면 `READY`를 사용한다. TXT/PDF처럼 preview 대상이 아니면 `NOT_AVAILABLE`을 사용한다.

### PropertyDataType

```text
STRING
TEXT
INTEGER
FLOAT
BOOLEAN
DATE
DATETIME
URI
```

### Cardinality

```text
ONE_TO_ONE
ONE_TO_MANY
MANY_TO_ONE
MANY_TO_MANY
OPTIONAL
REQUIRED
MULTIPLE
```

### CandidateReviewStatus

```text
PENDING
APPROVED
REJECTED
MODIFIED
NEEDS_DISCUSSION
```

### ValidationStatus

```text
NOT_VALIDATED
PASSED
WARNING
FAILED
```

### PublishStatus

```text
NOT_PUBLISHED
PUBLISHED
ROLLED_BACK
```

### ExtractionJobStatus

```text
PENDING
QUEUED
RUNNING
SUCCESS
PARTIAL_FAILED
FAILED
CANCELLED
RETRYING
```
