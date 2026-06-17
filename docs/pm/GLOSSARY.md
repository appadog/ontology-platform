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
| SourceProfile | 정형 데이터의 컬럼 타입, null 비율, distinct count, sample value 요약 | 2 |
| SourceSegment | row, page, paragraph, chunk 등 evidence 연결 단위 | 2 |
| PromptTemplate | 후보 추출에 사용할 프롬프트 템플릿 | 2 |
| PromptVersion | 실행 시점에 고정되는 프롬프트 버전 | 2 |
| ExtractionJob | LLM 후보 추출 작업 | 2 |
| ModelRun | 특정 모델/프롬프트/온톨로지 버전으로 실행된 기록 | 2 |
| MockProvider | 외부 LLM 없이 deterministic fixture로 후보를 생성하는 로컬 provider | 2 |
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

### SourceSegmentType

```text
SHEET
ROW
CELL
PAGE
SECTION
PARAGRAPH
CHUNK
```

MVP 2 thin slice에서는 CSV/Excel은 `SHEET`, `ROW`, `CELL`을 우선 사용하고 TXT/PDF는 `PAGE`, `SECTION`, `PARAGRAPH`, `CHUNK`를 사용한다. PDF table 전용 `TABLE` 계열 segment는 MVP 2 후속 hardening 전까지 추가하지 않는다.

### ProfileInferredType

```text
STRING
TEXT
INTEGER
FLOAT
BOOLEAN
DATE
DATETIME
URI
EMPTY
MIXED
UNKNOWN
```

`SourceProfileColumn.inferred_type`은 `ProfileInferredType`을 사용한다. `PropertyDataType`과 겹치는 값은 같은 의미로 맞추되, profiling 전용 상태인 `EMPTY`, `MIXED`, `UNKNOWN`은 온톨로지 속성 타입으로 직접 사용하지 않는다.

### CandidateReviewStatus

```text
PENDING
APPROVED
REJECTED
MODIFIED
NEEDS_DISCUSSION
```

MVP 2에서는 expert review workflow가 제외 범위이므로 candidate `review_status`는 기본적으로 `PENDING`만 사용한다. `APPROVED`, `REJECTED`, `MODIFIED`, `NEEDS_DISCUSSION`은 MVP 3 검수 workflow를 위한 예약 값이다.

### ValidationStatus

```text
NOT_VALIDATED
PASSED
WARNING
FAILED
```

Candidate `validation_status`는 이 enum을 사용한다. Evidence가 있는 정상 후보는 `PASSED`, evidence가 없지만 원본 raw output 보존을 위해 저장한 후보는 `WARNING`, source/evidence 참조가 깨졌거나 schema가 맞지 않는 후보는 `FAILED`를 사용한다.

### CandidateValidationCode

```text
MISSING_EVIDENCE
INVALID_EVIDENCE_REFERENCE
SCHEMA_MISMATCH
ONTOLOGY_ELEMENT_NOT_FOUND
RELATION_ENDPOINT_MISSING
LOW_CONFIDENCE
PROVIDER_OUTPUT_INVALID
```

`validation_status=WARNING` 또는 `FAILED`인 candidate는 `validation_codes[]`에 최소 1개 이상의 machine-readable code를 포함한다.

### PublishStatus

```text
NOT_PUBLISHED
PUBLISHED
ROLLED_BACK
```

MVP 2에서는 publish graph가 제외 범위이므로 candidate `publish_status`는 항상 `NOT_PUBLISHED`다. `PUBLISHED`, `ROLLED_BACK`은 MVP 3 이후 게시 workflow를 위한 예약 값이다.

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

기본 lifecycle은 `PENDING -> QUEUED -> RUNNING -> SUCCESS`다. 일부 candidate 저장은 성공했지만 validation warning/error 또는 provider output 일부 실패가 있으면 `PARTIAL_FAILED`, 전체 실행 실패는 `FAILED`, retry 요청은 `RETRYING -> QUEUED -> RUNNING`을 사용한다.

### ModelRunStatus

```text
PENDING
RUNNING
SUCCESS
FAILED
CANCELLED
```

`ModelRun.status`는 provider 실행 1회의 상태이며 `ExtractionJobStatus`와 분리한다. MVP 2 MockProvider thin slice에서는 `RUNNING`, `SUCCESS`, `FAILED`를 우선 사용한다.
