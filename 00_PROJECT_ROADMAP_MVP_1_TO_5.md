# 온톨로지 기반 데이터 구축 플랫폼 — MVP 1~5차 개발 로드맵

## 0. 프로젝트 한 줄 정의

정형·비정형 데이터를 수집하고, LLM이 온톨로지 기준으로 엔티티·속성·관계 후보를 생성하며, 전문가 검수·품질평가·승인·게시를 통해 신뢰 가능한 지식그래프를 구축·관리·활용하는 웹 기반 A-Z 온톨로지 플랫폼을 만든다.

## 1. 제품 핵심 원칙

1. LLM 결과는 절대 바로 운영 그래프에 반영하지 않는다. 항상 후보 그래프에 저장한다.
2. 모든 후보 엔티티·관계·속성값은 원천 근거를 가진다.
3. 온톨로지 버전, 프롬프트 버전, 모델명, 실행 시각, 검증 결과, 검수 이력은 반드시 남긴다.
4. 전문가가 수정한 값은 원본 LLM 결과와 분리해서 저장하고, 품질 개선 데이터로 재사용한다.
5. 후보 그래프와 게시 그래프를 분리한다.
6. 시각화는 단순 장식이 아니라 사용자가 관계, 품질, 근거, 영향도를 즉시 파악하도록 돕는 핵심 기능이다.
7. MVP라도 로컬 실행, 테스트, 더미 데이터, API 문서, 기본 디자인 시스템은 반드시 포함한다.

## 2. 권장 초기 기술 방향

### 2.1 프론트엔드

고정 스택:

- React
- TypeScript
- Vite
- styled-components

권장 보조 라이브러리:

- React Router: 라우팅
- TanStack Query: API 상태 관리
- React Flow: 온톨로지/후보 그래프 편집 및 시각화
- Zustand 또는 Context: 가벼운 클라이언트 UI 상태
- Storybook: 디자인 시스템과 공통 컴포넌트 문서화

초기 UI 컴포넌트는 로컬 ZIP 파일을 복사해서 쓰지 않는다. 대신 `hana-style-component` GitHub 저장소를 npm 의존성으로 설치하여 사용한다.

```bash
cd apps/frontend
npm install github:appadog/hana-style-component
# 또는 HTTPS git URL 명시 방식
npm install git+https://github.com/appadog/hana-style-component.git
```

`package.json`에는 다음 형태로 dependency를 남긴다.

```json
{
  "dependencies": {
    "hana-style-component": "github:appadog/hana-style-component"
  }
}
```

프론트엔드 에이전트는 설치 후 실제 package export를 확인하고, Button, Input, Select, Badge, Table, Card, Typography, Spinner, SearchInput, SearchBar 등 사용 가능한 컴포넌트를 `src/shared/ui/hana` adapter 계층으로 감싼 뒤 플랫폼 전용 UI에 적용한다. 외부 패키지 import가 업무 화면 전체에 흩어지지 않도록 한다. 저장소가 private이거나 조직 권한이 필요한 경우, 로컬 GitHub 인증/SSH 권한을 먼저 확인하고 설치 실패 원인을 PM에게 보고한다.

### 2.2 백엔드 추천안

초기 추천 스택:

- Python 3.12+
- FastAPI
- Pydantic v2
- SQLAlchemy 2.x
- Alembic
- PostgreSQL
- Redis
- Celery 또는 RQ 계열 Worker
- MinIO 또는 S3 호환 Object Storage
- Neo4j Community/Enterprise 또는 RDF Store
- Docker Compose 기반 로컬 개발환경

초기에는 **FastAPI 모듈러 모놀리스 + 비동기 Worker + Graph DB 어댑터 구조**를 추천한다.

이유:

- LLM, 문서 파싱, 데이터 프로파일링, 임베딩, 평가 파이프라인은 Python 생태계가 유리하다.
- FastAPI는 API 서버를 빠르게 만들 수 있고 타입 기반 개발에 적합하다.
- 프론트엔드와는 OpenAPI 스키마를 통해 타입 계약을 맞춘다.
- 추후 규모가 커지면 `extraction-worker`, `graph-service`, `rag-service`를 별도 서비스로 분리할 수 있다.

대안:

- TypeScript 풀스택을 강하게 원하면 NestJS + Python LLM Worker 조합도 가능하다.
- RDF/OWL/SPARQL을 1차부터 강하게 요구하면 Apache Jena Fuseki, RDF4J, GraphDB 계열을 Graph Store로 먼저 채택한다.
- 업무 그래프 탐색과 시각적 관계 편집이 우선이면 Neo4j를 먼저 채택하고, RDF/OWL/SHACL export/import를 후속으로 붙인다.

## 3. 전체 아키텍처 개념

```text
[Frontend]
  React + TypeScript + Vite + styled-components
  ├─ Dashboard
  ├─ Ontology Modeler
  ├─ Source Manager
  ├─ LLM Extraction Monitor
  ├─ Candidate Review Workbench
  ├─ Quality Dashboard
  └─ Graph Explorer

[Backend API]
  FastAPI
  ├─ Auth / RBAC
  ├─ Project
  ├─ Ontology
  ├─ Source / Parser
  ├─ Extraction Job
  ├─ Candidate Graph
  ├─ Validation
  ├─ Review
  ├─ Publish
  ├─ Graph Query
  └─ Admin / Audit

[Worker]
  ├─ Structured Data Profiling
  ├─ Document Parsing
  ├─ Chunking
  ├─ LLM Extraction
  ├─ Entity Resolution
  ├─ Validation
  └─ Publishing

[Storage]
  PostgreSQL: 메타데이터, 후보, 검수, 작업, 감사로그
  Object Storage: 원본 파일, 파싱 결과, 첨부물
  Redis: Queue, Cache
  Graph DB/RDF Store: 승인된 게시 그래프
  Vector DB: 문서 chunk 임베딩, RAG 검색, 유사 엔티티 탐색
  Search Engine: 키워드 검색, 대시보드 검색
```

## 4. 핵심 도메인 객체

```text
Project
User
Role
Ontology
OntologyVersion
OntologyClass
OntologyProperty
OntologyRelation
OntologyConstraint
SourceData
SourceSegment
SourceColumn
SourceChunk
ExtractionJob
ModelRun
PromptTemplate
PromptVersion
CandidateEntity
CandidateRelation
CandidatePropertyValue
CandidateEvidence
ValidationJob
ValidationResult
ReviewTask
ReviewDecision
PublishedEntity
PublishedRelation
QualityMetric
AuditLog
```

## 5. MVP 1차 — 로컬 기반, 프로젝트/온톨로지/데이터 등록 골격

### 목표

서비스의 뼈대를 만든다. 사용자는 로컬에서 프로젝트를 생성하고, 온톨로지 클래스를 만들고, 데이터 파일을 올리고, 기본 미리보기를 볼 수 있어야 한다.

### 범위

#### 백엔드

- FastAPI 프로젝트 초기화
- Docker Compose 구성
  - PostgreSQL
  - Redis
  - MinIO
  - Neo4j 또는 임시 Graph Adapter
- 기본 Auth 개발용 모드
- Project CRUD
- Ontology CRUD
  - Class
  - Property
  - Relation
  - Domain/Range
  - Cardinality
  - Version draft/published 상태
- SourceData 등록
  - CSV
  - Excel
  - TXT
  - PDF는 원본 업로드와 메타데이터까지만 우선 지원
- 파일 메타데이터 저장
- CSV/Excel 미리보기
- 기본 OpenAPI 문서 제공
- Seed 데이터
  - 샘플 프로젝트
  - 샘플 보험/기업/문서 온톨로지 중 1개

#### 프론트엔드

- Vite + React + TypeScript 프로젝트 초기화
- styled-components ThemeProvider 설정
- `hana-style-component` npm dependency 설치 및 adapter 기반 공통 UI 구성
- 기본 라우팅
- 레이아웃
  - 사이드바
  - 상단바
  - 프로젝트 선택기
  - 페이지 헤더
- 화면
  - 대시보드
  - 프로젝트 목록/상세
  - 온톨로지 모델러 초안
  - 데이터 소스 업로드/목록/미리보기
- 온톨로지 그래프 기본 시각화
  - 클래스 노드
  - 관계 엣지
  - 선택 시 상세 패널
- 로딩/빈 상태/오류 상태 UI

#### PM

- PRD v0.1 작성
- 정보구조 IA 작성
- 사용자 역할 정의
- MVP 1차 범위 고정
- API 계약 우선순위 정의
- 이슈 템플릿과 Definition of Done 정의
- 샘플 도메인 1개 선정

### 완료 기준

- 로컬에서 `frontend`, `backend`, `postgres`, `redis`, `minio`, `graph-db`를 실행할 수 있다.
- 사용자가 프로젝트를 만들 수 있다.
- 사용자가 클래스/속성/관계를 만들고 그래프에서 볼 수 있다.
- CSV/Excel 파일 업로드 후 샘플 데이터를 미리볼 수 있다.
- 모든 주요 API가 OpenAPI에 노출된다.

### 제외 범위

- 실제 LLM 관계 추출
- 전문가 검수 워크플로우
- 복잡한 품질 점수
- RAG 질의응답
- 실사용 권한/SSO

## 6. MVP 2차 — 정형/비정형 파싱과 LLM 후보 추출

### 목표

정형/비정형 데이터를 파싱하고, 온톨로지 기준으로 LLM이 엔티티·관계 후보를 생성한다.

### 범위

#### 백엔드

- SourceSegment 공통 모델 구현
  - ROW
  - CELL
  - PAGE
  - SECTION
  - PARAGRAPH
  - CHUNK
  - TABLE
  - TABLE_CELL
- CSV/Excel 프로파일링
  - 컬럼명
  - 타입 추론
  - null 비율
  - distinct count
  - 샘플값
  - 고유키 후보
- 문서 파싱
  - TXT
  - PDF 텍스트 기반 추출
  - DOCX는 가능하면 2차 후반
- 청킹
  - chunk size
  - overlap
  - section metadata
- ExtractionJob / ModelRun 구현
- PromptTemplate / PromptVersion 구현
- LLM Adapter 인터페이스
  - provider 독립 구조
  - mock provider 필수
  - 실제 provider는 환경변수 기반
- 구조화 출력 JSON 스키마 검증
- CandidateEntity 저장
- CandidateRelation 저장
- CandidateEvidence 저장
- evidence 없는 후보는 저장하되 validation warning 처리
- extraction job 상태 관리
  - PENDING
  - RUNNING
  - SUCCESS
  - PARTIAL_FAILED
  - FAILED
  - RETRYING

#### 프론트엔드

- 데이터 프로파일링 화면
- 문서 파싱 결과 화면
  - 페이지/섹션/문단/chunk 보기
- LLM 추출 작업 생성 화면
  - 데이터 소스 선택
  - 온톨로지 버전 선택
  - 프롬프트 선택
  - 모델 선택
  - 실행 범위 선택
- 작업 모니터링 화면
  - 진행률
  - 실패 chunk
  - 토큰/비용 표시 영역
- 추출 결과 화면
  - 후보 엔티티 목록
  - 후보 관계 목록
  - confidence badge
  - evidence 보기

#### PM

- 추출 작업 사용자 플로우 정의
- LLM 출력 JSON 스키마 승인
- 후보/근거 데이터 계약 검토
- 초기 품질 지표 정의
- LLM 실패/재시도 정책 정의

### 완료 기준

- CSV/Excel에서 컬럼 프로파일링 결과를 볼 수 있다.
- 문서를 chunk 단위로 볼 수 있다.
- Mock LLM과 실제 LLM Adapter 중 하나로 후보 엔티티/관계를 생성할 수 있다.
- 모든 후보에는 source/evidence 참조가 있다.
- 추출 작업의 실행 상태를 UI에서 확인할 수 있다.

### 제외 범위

- 전문가 편집 고도화
- 게시 그래프 운영 API 완성
- 자동 승인
- 대규모 분산 처리

## 7. MVP 3차 — 검증, 전문가 검수, 게시 그래프

### 목표

LLM 후보를 온톨로지 제약으로 검증하고, 전문가가 수정·승인·반려한 뒤 게시 그래프에 반영한다.

### 범위

#### 백엔드

- ValidationJob 구현
- ValidationResult 구현
- 검증 규칙
  - class 존재 여부
  - relation domain/range
  - relation direction
  - required property
  - datatype
  - cardinality
  - duplicate candidate
  - orphan node
  - evidence missing
  - ontology version mismatch
- ReviewTask 구현
- ReviewDecision 구현
- 후보 엔티티/관계 수정 API
- 승인/반려/수정 워크플로우
- 감사로그
  - LLM 원본값
  - 전문가 수정값
  - 검수자
  - 시간
  - 사유
- PublishJob 구현
- PublishedEntity / PublishedRelation 구현
- Graph DB 반영
- 게시 버전 생성
- Rollback을 위한 publish history 저장

#### 프론트엔드

- 후보 검수 워크벤치
  - 좌측 원문/테이블 뷰어
  - 중앙 후보 목록/그래프
  - 우측 상세 편집 패널
  - 하단 검증 결과/이력
- 검수 대기함
  - 우선순위
  - 오류 유형
  - confidence
  - 담당자
  - 상태
- 관계 편집
  - source 변경
  - relation 변경
  - target 변경
  - 방향 반전
  - evidence 수정
- 승인/반려/일괄승인
- 게시 그래프 탐색 화면
- 품질 대시보드 1차
  - 총 후보 수
  - 승인률
  - 반려율
  - 수정률
  - 검증 실패율
  - 근거 누락률

#### PM

- 검수 정책 정의
- 승인 권한과 게시 권한 분리 정의
- 품질 지표 산식 정의
- 검수 화면 UX 리뷰
- MVP 3차 사용자 수용 테스트 시나리오 작성

### 완료 기준

- LLM 후보가 검증 결과와 함께 표시된다.
- 전문가가 후보 관계를 수정하고 승인/반려할 수 있다.
- 승인된 후보만 게시 그래프에 반영된다.
- 게시 그래프에서 엔티티/관계를 조회할 수 있다.
- 감사로그로 LLM 원본과 전문가 수정 이력을 확인할 수 있다.

### 제외 범위

- 고급 RAG
- 자동 승인 정책
- 모델별 성능 비교 자동화
- 멀티 테넌트 운영

## 8. MVP 4차 — 품질평가, 고급 시각화, 검색/RAG, 운영 UX 고도화

### 목표

플랫폼을 “실제 업무자가 매일 쓰는 검수·품질·탐색 도구” 수준으로 끌어올린다.

### 범위

#### 백엔드

- 품질 점수 산식 고도화
  - completeness
  - consistency
  - traceability
  - validation pass rate
  - review approval rate
  - duplicate rate
  - relation density
- 모델/프롬프트 성능 평가
  - PromptVersion별 승인률
  - relation type별 오류율
  - source type별 성능
  - 전문가 수정 패턴
- Evaluation Dataset 관리
- Golden Set 관리
- Prompt A/B 테스트 기반 구조
- 검색
  - 엔티티 키워드 검색
  - 관계 검색
  - source/evidence 검색
- Vector DB 연계
  - chunk embedding
  - similar evidence search
  - entity resolution 보조
- RAG 질의응답 1차
  - 게시 그래프 + evidence 기반 답변
  - 답변 근거 표시
- 외부 API 1차
  - graph entity 조회
  - relation 조회
  - source/evidence 조회

#### 프론트엔드

- 고급 그래프 탐색기
  - n-hop 탐색
  - relation type 필터
  - confidence/quality overlay
  - source/evidence overlay
  - 영향도 보기
- 고급 품질 대시보드
  - 모델별/프롬프트별/도메인별 품질
  - 기간별 추이
  - TOP 오류 유형
  - 전문가별 검수량
- 검색 통합 UI
  - 엔티티
  - 관계
  - 문서 근거
  - 자연어 질의
- RAG 답변 화면
  - 답변
  - 근거 chunk
  - 연결된 그래프
- 협업 기능
  - 댓글
  - 담당자 할당
  - 검수 SLA
- 화려한 UX 요소
  - 상태별 색상 체계
  - 그래프 애니메이션
  - 카드 기반 대시보드
  - 시각적 품질 점수
  - 원문 하이라이트

#### PM

- 품질 관리 체계 정의
- 평가 데이터셋 운영 정책 정의
- 자연어 질의 범위와 제한사항 정의
- 업무 대시보드 지표 승인
- 사용자 교육 흐름 정의

### 완료 기준

- 프로젝트/데이터소스/모델/프롬프트별 품질을 비교할 수 있다.
- 게시 그래프를 시각적으로 탐색하고 evidence까지 추적할 수 있다.
- 자연어 질의에 대해 근거가 있는 답변을 제공할 수 있다.
- 전문가 수정 데이터가 모델/프롬프트 평가 지표로 반영된다.

### 제외 범위

- 완전 자동 운영
- 고가용성 운영 배포
- SSO/엔터프라이즈 보안 전체

## 9. MVP 5차 — 엔터프라이즈화, 자동화, 확장성, 거버넌스

### 목표

플랫폼을 실제 조직 내 운영 가능한 엔터프라이즈 제품 수준으로 만든다.

### 범위

#### 백엔드

- 멀티 프로젝트/멀티 테넌트 보강
- RBAC/ABAC 고도화
- SSO/OIDC 연동
- API Key/Service Account
- 데이터 권한
  - 프로젝트 단위
  - ontology version 단위
  - source type 단위
  - field masking
- 자동 승인 정책
  - confidence threshold
  - validation pass
  - repeated expert approval pattern
  - low-risk relation type
- 고급 Entity Resolution
- Ontology Import/Export
  - JSON
  - RDF/Turtle
  - OWL
  - SHACL
- SPARQL 또는 Cypher Console
- 배치 확장
  - worker scale-out
  - 재시도/Dead Letter Queue
  - 비용 제한
- Observability
  - structured logging
  - metrics
  - tracing
  - job dashboard
- Backup/Restore
- 데이터 보존/삭제 정책
- 운영 배포 스크립트

#### 프론트엔드

- 관리자 콘솔
- 권한 관리 UI
- 자동 승인 정책 UI
- 온톨로지 import/export UI
- SPARQL/Cypher Query Console
- 운영 모니터링 UI
- 비용/토큰 사용량 대시보드
- 대규모 그래프 성능 최적화
  - progressive loading
  - virtualized list
  - server-side graph expansion
- 접근성/반응형/다크모드 고도화

#### PM

- 운영 정책 문서화
- 보안/감사 요구사항 정리
- 릴리즈 관리 정책
- 장애 대응 프로세스
- 데이터 거버넌스 문서
- 운영자 교육 자료
- 장기 제품 로드맵 수립

### 완료 기준

- 조직 내 여러 프로젝트가 동시에 운영 가능하다.
- 권한, 감사, 백업, 비용, 품질, 자동 승인 정책이 관리된다.
- 온톨로지 표준 포맷과 연계할 수 있다.
- 대용량 데이터 처리와 작업 재시도가 안정적으로 동작한다.
- 운영 대시보드에서 시스템 상태를 확인할 수 있다.

## 10. MVP별 핵심 화면 진화

| 단계 | 핵심 화면 | 사용자 가치 |
|---|---|---|
| MVP 1차 | 프로젝트, 온톨로지 모델러, 데이터 업로드 | 기본 구조를 만들고 볼 수 있음 |
| MVP 2차 | 데이터 프로파일링, 문서 chunk, LLM 추출 작업 | LLM이 후보를 만들기 시작함 |
| MVP 3차 | 후보 검수 워크벤치, 품질 1차, 게시 그래프 | 전문가가 신뢰 가능한 그래프를 만듦 |
| MVP 4차 | 고급 그래프 탐색, 평가 대시보드, RAG 검색 | 품질을 측정하고 활용함 |
| MVP 5차 | 관리자 콘솔, 자동 승인, 운영 모니터링 | 조직에서 안정적으로 운영함 |

## 11. 리포지토리 추천 구조

```text
ontology-platform/
  README.md
  .env.example
  docker-compose.yml
  docs/
    architecture/
    api/
    product/
    decisions/
  apps/
    backend/
      pyproject.toml
      app/
        main.py
        core/
        api/
        db/
        modules/
          auth/
          project/
          ontology/
          source/
          extraction/
          candidate/
          validation/
          review/
          publish/
          graph/
          quality/
          admin/
        workers/
        tests/
    frontend/
      package.json
      vite.config.ts
      src/
        app/
        pages/
        features/
        shared/
        components/
        styles/
        api/
        mocks/
  packages/
    ui/
      README.md
      src/
  infra/
    postgres/
    minio/
    neo4j/
    scripts/
```

## 12. 공통 Definition of Done

모든 기능은 아래 조건을 만족해야 완료로 본다.

1. 요구사항과 수용 기준이 이슈에 명시되어 있다.
2. API가 있으면 OpenAPI 또는 API 계약이 갱신되어 있다.
3. 데이터 모델 변경이 있으면 마이그레이션이 포함되어 있다.
4. 화면이 있으면 로딩/빈 상태/오류 상태가 구현되어 있다.
5. 후보 엔티티/관계 관련 기능은 evidence와 audit trail을 누락하지 않는다.
6. 최소 단위 테스트 또는 통합 테스트가 있다.
7. 로컬 실행 방법이 README 또는 문서에 반영되어 있다.
8. PM/Backend/Frontend 간 영향 범위가 기록되어 있다.

## 13. 절대 미루면 안 되는 설계 결정

- 후보 그래프와 게시 그래프 분리
- evidence 모델
- ontology version 고정 정책
- prompt/model run 기록
- review decision audit
- API contract-first 개발 방식
- 로컬 Docker Compose 환경
- UI 디자인 시스템과 상태 색상 체계

## 14. 초기에 미뤄도 되는 것

- 완성형 자동 승인
- 고급 추론 엔진
- SSO
- 멀티 테넌트 완성
- 대규모 분산 처리
- SPARQL/Cypher 전문가 콘솔
- 고급 RAG Agent
- 프롬프트 A/B 운영 자동화

## 15. 프로젝트 성공 기준

이 프로젝트의 성공 기준은 단순히 “그래프가 보인다”가 아니다.

최소 성공 기준:

```text
원천 데이터 → LLM 후보 생성 → 근거 확인 → 온톨로지 검증 → 전문가 수정/승인 → 게시 그래프 → 품질 평가 → 검색/활용
```

위 흐름이 하나의 웹 플랫폼 안에서 끊기지 않고 돌아가야 한다.
