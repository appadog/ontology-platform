# MVP 6차 — 제품화·고도화·지식 운영 자동화 확장 계획

## 0. 문서 목적

이 문서는 온톨로지 기반 데이터 구축 플랫폼의 **MVP 6차 추가 개발 범위**를 정의한다.

MVP 1~5차가 다음을 완성하는 단계라면:

```text
정형·비정형 데이터 수집
→ LLM 기반 엔티티/관계 후보 생성
→ 근거 연결
→ 온톨로지 검증
→ 전문가 검수
→ 품질 평가
→ 게시 그래프
→ 검색/API/RAG 활용
→ 운영 관리
```

MVP 6차는 플랫폼을 한 단계 더 끌어올려 다음 수준을 목표로 한다.

```text
운영 가능한 온톨로지 플랫폼
→ 계속 개선되는 AI-native 지식 운영 플랫폼
→ 조직/도메인/외부 생태계까지 확장 가능한 제품형 플랫폼
```

한 줄 정의:

> MVP 6차는 온톨로지 플랫폼을 “기능형 시스템”에서 “지식 운영 제품”으로 고도화하는 단계다.

---

## 1. MVP 6차의 핵심 방향

MVP 6차의 핵심은 기능을 많이 붙이는 것이 아니라, 아래 6가지를 강화하는 것이다.

```text
1. 평가 가능한 플랫폼
2. 스스로 개선되는 플랫폼
3. 변경 영향도를 예측하는 플랫폼
4. 여러 도메인/조직으로 확장 가능한 플랫폼
5. 외부 생태계와 연결되는 플랫폼
6. 사용자가 지식 구축 과정을 AI와 함께 운영하는 플랫폼
```

MVP 6차 이후의 플랫폼은 단순히 “LLM으로 관계를 만들고 검수하는 도구”가 아니다.

```text
온톨로지 설계
데이터 구축
검수
품질 평가
모델/프롬프트 개선
지식그래프 운영
외부 연계
도메인 템플릿 재사용
변경 영향도 분석
에이전트 기반 작업 자동화
```

이 전체 루프를 지속적으로 돌릴 수 있어야 한다.

---

## 2. MVP 6차 진입 조건

MVP 6차는 MVP 1~5차의 핵심 구조가 안정화된 뒤 시작한다.

### 필수 진입 조건

```text
- 프로젝트/사용자/권한 기본 구조가 동작한다.
- 온톨로지 클래스/속성/관계/제약조건/버전 관리가 동작한다.
- 정형/비정형 데이터 업로드와 파싱이 동작한다.
- LLM 기반 후보 엔티티/관계 생성이 동작한다.
- 모든 후보에 evidence가 연결된다.
- 후보 그래프와 게시 그래프가 분리되어 있다.
- 전문가가 후보를 승인/수정/반려할 수 있다.
- 품질 대시보드가 기본 지표를 제공한다.
- 검색/API/RAG 기본 활용이 가능하다.
- 감사 로그와 운영 관리의 최소 구조가 있다.
```

### 시작하면 안 되는 경우

```text
- LLM 결과가 곧바로 게시 그래프에 들어가는 구조인 경우
- 근거 evidence가 누락되는 구조인 경우
- 온톨로지 버전이 후보/게시 그래프와 연결되지 않은 경우
- 전문가 수정 이력이 보존되지 않는 경우
- 품질 지표가 단순 집계만 있고 원인 분석으로 이어지지 않는 경우
```

이 문제가 남아 있으면 MVP 6차 전에 먼저 고쳐야 한다.

---

## 3. MVP 6차 주요 테마

MVP 6차는 아래 10개 테마로 구성한다.

```text
1. Gold Set / Benchmark Studio
2. Active Learning / 지속 개선 루프
3. Ontology Governance 고도화
4. Impact Simulation / 변경 영향도 분석
5. Agentic Knowledge Operations
6. Multi-domain / Multi-tenant 확장
7. Connector & Plugin SDK
8. Ontology Pack / Domain Template
9. Advanced Visualization & Knowledge Storytelling
10. Enterprise Readiness / 운영 안정화 고도화
```

각 테마는 백엔드, 프론트엔드, PM 관점에서 작업 범위를 나눠 진행한다.

---

# 4. Theme 1 — Gold Set / Benchmark Studio

## 4.1 목표

LLM 추출 성능을 감으로 판단하지 않고, 전문가가 만든 정답셋 기준으로 정량 평가한다.

MVP 5차까지는 다음 지표를 볼 수 있다.

```text
승인률
반려율
수정률
근거 연결률
검증 실패율
```

MVP 6차에서는 여기에 평가셋 기반의 실제 성능 지표를 추가한다.

```text
Entity Precision
Entity Recall
Entity F1
Relation Precision
Relation Recall
Relation F1
Relation Direction Accuracy
Class Classification Accuracy
Evidence Match Rate
Ontology Constraint Pass Rate
```

## 4.2 핵심 기능

```text
- Gold Set 프로젝트 생성
- 문서/테이블 샘플을 평가셋으로 지정
- 전문가 정답 엔티티 등록
- 전문가 정답 관계 등록
- 정답 evidence 등록
- 모델/프롬프트/온톨로지 버전별 평가 실행
- 평가 결과 비교
- 관계 유형별 성능 비교
- 데이터 유형별 성능 비교
- 오류 유형별 confusion matrix 제공
```

## 4.3 백엔드 요구사항

### 신규 도메인 객체

```text
EvaluationDataset
EvaluationSample
GoldEntity
GoldRelation
GoldEvidence
EvaluationRun
EvaluationMetric
EvaluationErrorCase
ModelPromptBenchmark
```

### API 예시

```text
POST /evaluation-datasets
GET /evaluation-datasets
POST /evaluation-datasets/{id}/samples
POST /evaluation-datasets/{id}/gold-entities
POST /evaluation-datasets/{id}/gold-relations
POST /evaluation-runs
GET /evaluation-runs/{id}
GET /evaluation-runs/{id}/metrics
GET /evaluation-runs/{id}/errors
GET /benchmarks/model-prompts
```

### 평가 로직

```text
1. 평가셋 샘플을 선택한다.
2. 특정 온톨로지 버전, 프롬프트 버전, 모델을 선택한다.
3. LLM 추출을 실행한다.
4. 생성된 후보 엔티티/관계를 Gold Set과 매칭한다.
5. TP/FP/FN을 계산한다.
6. 관계 방향, 클래스, evidence 일치율을 별도 계산한다.
7. 결과를 EvaluationRun으로 저장한다.
```

### 주의사항

- Gold Set은 운영 그래프와 분리한다.
- 정답셋은 전문가 권한자만 수정할 수 있다.
- 평가 실행 당시의 온톨로지 버전, 모델명, 프롬프트 버전, 파서 버전을 반드시 저장한다.
- 평가 결과는 시간이 지나도 재현 가능해야 한다.

## 4.4 프론트엔드 요구사항

### 신규 화면

```text
- Evaluation Studio
- Gold Set Manager
- Benchmark Dashboard
- Error Case Explorer
- Model/Prompt Comparison
```

### UI 요구사항

```text
- 모델별/프롬프트별 성능을 카드와 차트로 비교한다.
- 관계 유형별 F1 score를 heatmap 또는 matrix로 보여준다.
- 오류 케이스를 원문/evidence와 함께 보여준다.
- 사용자가 오류 케이스를 클릭하면 후보 결과와 정답 결과를 나란히 비교한다.
- 평가셋 샘플은 문서/테이블/관계 유형별로 필터링 가능해야 한다.
```

---

# 5. Theme 2 — Active Learning / 지속 개선 루프

## 5.1 목표

전문가가 수정한 이력을 단순 로그로 남기지 않고, LLM 추출 품질을 개선하는 데이터로 재사용한다.

## 5.2 핵심 기능

```text
- 전문가 수정 패턴 분석
- 자주 틀리는 클래스/관계 유형 탐지
- 프롬프트 개선 후보 추천
- 자동 승인 후보 조건 학습
- 재추출 추천
- 검수 우선순위 자동 조정
- Fine-tuning 또는 RAG prompt example 후보 export
```

## 5.3 수정 패턴 예시

```text
LLM 원본:
담보 - 포함한다 → 보험상품

전문가 수정:
보험상품 - 포함한다 → 담보

학습 포인트:
- 포함한다 관계의 방향 오류
- 보험 도메인에서 상품/담보 관계의 domain/range 혼동
- prompt에 relation direction example 추가 필요
```

## 5.4 백엔드 요구사항

### 신규 도메인 객체

```text
ReviewCorrectionPattern
PromptImprovementSuggestion
AutoApprovalPolicyCandidate
RetrainingDatasetExport
LearningSignal
```

### 분석 배치

```text
- 매일 또는 수동 실행
- 최근 검수 이력을 분석
- relation_id별 수정률 계산
- class_id별 혼동 행렬 계산
- evidence 누락 패턴 분석
- model_run별 오류율 계산
- prompt_version별 개선 필요 항목 생성
```

### API 예시

```text
GET /learning-signals
GET /learning-signals/correction-patterns
GET /learning-signals/prompt-suggestions
POST /learning-signals/{id}/accept
POST /learning-signals/{id}/dismiss
POST /dataset-exports/fine-tuning
POST /dataset-exports/prompt-examples
```

## 5.5 프론트엔드 요구사항

### 신규 화면

```text
- Learning Insights
- Correction Pattern Dashboard
- Prompt Improvement Board
- Auto Approval Candidate Review
```

### UI 요구사항

```text
- “LLM이 자주 틀리는 관계 TOP 10”을 보여준다.
- “전문가가 자주 수정한 클래스 매핑”을 보여준다.
- “프롬프트에 추가하면 좋은 few-shot example”을 추천한다.
- PM/온톨로지 관리자가 추천을 승인하거나 보류할 수 있다.
```

---

# 6. Theme 3 — Ontology Governance 고도화

## 6.1 목표

온톨로지 변경을 개인 작업이 아니라 조직적 승인 프로세스로 관리한다.

MVP 5차까지 기본 버전 관리를 한다면, MVP 6차에서는 변경 제안·검토·영향 분석·승인·게시·롤백까지 포함한다.

## 6.2 핵심 기능

```text
- Ontology Change Request
- 변경 제안서 작성
- 변경 영향도 자동 분석
- 리뷰어 지정
- 승인/반려 워크플로우
- Ontology Release Note 자동 생성
- 마이그레이션 필요 후보 목록 생성
- 변경 후 재검증/재추출 작업 생성
```

## 6.3 변경 유형

```text
- 클래스 추가
- 클래스 이름 변경
- 클래스 병합
- 클래스 폐기
- 속성 추가/삭제/변경
- 관계 추가/삭제/변경
- domain/range 변경
- cardinality 변경
- constraint 강화/완화
- label/description/example 변경
```

## 6.4 백엔드 요구사항

### 신규 도메인 객체

```text
OntologyChangeRequest
OntologyChangeItem
OntologyReviewAssignment
OntologyImpactReport
OntologyMigrationPlan
OntologyReleaseNote
```

### API 예시

```text
POST /ontology-change-requests
GET /ontology-change-requests
GET /ontology-change-requests/{id}
POST /ontology-change-requests/{id}/impact-analysis
POST /ontology-change-requests/{id}/approve
POST /ontology-change-requests/{id}/reject
POST /ontology-change-requests/{id}/publish
POST /ontology-change-requests/{id}/rollback
```

## 6.5 프론트엔드 요구사항

### 신규 화면

```text
- Ontology Governance Board
- Change Request Detail
- Ontology Diff Viewer
- Impact Report Viewer
- Migration Plan Viewer
```

### UI 요구사항

```text
- 온톨로지 변경 전/후를 시각적으로 비교한다.
- 변경된 클래스/관계/속성은 색상으로 구분한다.
- 영향받는 후보 엔티티, 게시 엔티티, 매핑 규칙, 검증 룰을 보여준다.
- 변경 승인 전 예상 리스크를 카드 형태로 보여준다.
```

---

# 7. Theme 4 — Impact Simulation / 변경 영향도 분석

## 7.1 목표

온톨로지, 프롬프트, 모델, 파서, 검증룰 변경이 기존 데이터에 어떤 영향을 미치는지 시뮬레이션한다.

## 7.2 시뮬레이션 종류

```text
- 온톨로지 변경 영향도
- 프롬프트 변경 영향도
- 모델 변경 영향도
- 검증 룰 변경 영향도
- 파서/청킹 전략 변경 영향도
- 자동 승인 정책 변경 영향도
```

## 7.3 결과 예시

```text
변경안:
관계 '포함한다'의 range를 '담보'에서 '담보 또는 특약'으로 확장

영향:
- 기존 검증 실패 관계 1,240건 중 842건이 통과 가능
- 신규 충돌 가능 관계 37건 발생
- 검수 대기 재분류 대상 421건
- 게시 그래프 재검증 대상 13,200건
- 추천 작업: validation job 재실행
```

## 7.4 백엔드 요구사항

### 신규 도메인 객체

```text
ImpactSimulation
ImpactSimulationTarget
ImpactSimulationResult
ImpactAffectedItem
ImpactRecommendation
```

### API 예시

```text
POST /impact-simulations
GET /impact-simulations/{id}
GET /impact-simulations/{id}/affected-items
GET /impact-simulations/{id}/recommendations
POST /impact-simulations/{id}/create-followup-jobs
```

## 7.5 프론트엔드 요구사항

```text
- 변경 전/후 영향 요약 카드
- 영향받는 데이터 목록
- 영향받는 그래프 영역 시각화
- 위험도별 필터
- 후속 작업 생성 버튼
```

---

# 8. Theme 5 — Agentic Knowledge Operations

## 8.1 목표

사용자가 모든 작업을 메뉴에서 직접 찾지 않아도, 플랫폼 내 AI 운영 에이전트가 작업을 안내하고 일부 작업을 자동화한다.

단, 에이전트가 운영 그래프를 직접 변경하면 안 된다. 모든 변경은 후보 생성, 작업 제안, 검수 요청 수준에서 시작해야 한다.

## 8.2 에이전트 역할

```text
- Ontology Assistant
- Data Onboarding Assistant
- Review Assistant
- Quality Analyst Agent
- Impact Analysis Agent
- Release Manager Agent
```

## 8.3 예시 명령

```text
“최근 반려율이 높은 관계 유형을 찾아줘.”
“이 온톨로지 변경안이 기존 게시 그래프에 미치는 영향을 분석해줘.”
“검수 우선순위가 높은 관계 후보만 모아서 작업함을 만들어줘.”
“프롬프트 v3와 v4의 성능 차이를 비교해줘.”
“근거 없는 후보 관계를 모두 찾아서 재추출 작업을 만들어줘.”
“자동 승인해도 될 것 같은 패턴을 추천해줘.”
```

## 8.4 안전 원칙

```text
- 에이전트는 기본적으로 read-only 분석과 작업 제안만 수행한다.
- 데이터 변경 작업은 사용자 확인을 받아야 한다.
- 게시 그래프 변경은 반드시 승인 워크플로우를 거쳐야 한다.
- 에이전트 실행 로그와 사용한 컨텍스트를 저장한다.
- 에이전트가 생성한 제안과 사람이 승인한 액션을 구분한다.
```

## 8.5 백엔드 요구사항

### 신규 도메인 객체

```text
AgentSession
AgentMessage
AgentToolCall
AgentRecommendation
AgentActionRequest
AgentActionApproval
```

### Tool API 예시

```text
GET /agent/tools/quality-summary
GET /agent/tools/review-backlog
POST /agent/tools/impact-analysis
POST /agent/tools/create-review-task
POST /agent/tools/create-extraction-job
POST /agent/tools/generate-release-note
```

## 8.6 프론트엔드 요구사항

### 신규 화면/컴포넌트

```text
- Knowledge Copilot Panel
- Agent Recommendation Drawer
- Action Approval Modal
- Agent Run History
```

### UX 원칙

```text
- 에이전트는 화면 오른쪽 사이드 패널로 제공한다.
- 사용자가 현재 보고 있는 프로젝트/온톨로지/소스/검수 화면 context를 이해해야 한다.
- 에이전트 추천은 바로 적용하지 않고 “작업 생성” 또는 “승인 요청”으로 연결한다.
```

---

# 9. Theme 6 — Multi-domain / Multi-tenant 확장

## 9.1 목표

플랫폼을 하나의 도메인 전용 도구가 아니라 여러 조직, 여러 프로젝트, 여러 도메인을 동시에 운영할 수 있는 구조로 확장한다.

## 9.2 핵심 기능

```text
- Organization / Workspace
- Tenant 단위 격리
- 프로젝트별 온톨로지 독립 관리
- 공통 온톨로지와 도메인 온톨로지 분리
- 도메인 간 mapping/alignment
- 조직별 권한/과금/사용량 관리
- 도메인별 품질 대시보드
```

## 9.3 백엔드 요구사항

### 신규 도메인 객체

```text
Organization
Workspace
TenantSetting
Domain
OntologyAlignment
CrossDomainMapping
UsageQuota
BillingUsageEvent
```

### 데이터 격리 원칙

```text
- 모든 주요 테이블은 organization_id 또는 workspace_id를 가진다.
- 권한 체크는 프로젝트 단위뿐 아니라 조직/워크스페이스 단위에서 수행한다.
- object storage path도 tenant 단위로 분리한다.
- 검색 인덱스와 벡터 인덱스도 tenant 격리 전략을 가진다.
```

## 9.4 프론트엔드 요구사항

```text
- Organization Switcher
- Workspace Switcher
- Domain Dashboard
- Cross-domain Ontology Alignment Viewer
- Usage Dashboard
```

---

# 10. Theme 7 — Connector & Plugin SDK

## 10.1 목표

외부 데이터 소스와 외부 시스템으로 쉽게 연결할 수 있는 확장 구조를 만든다.

MVP 1~5차는 기본 파일 업로드/API 연계 중심이라면, MVP 6차는 connector/plugin 기반 확장을 지원한다.

## 10.2 기본 Connector 후보

```text
- Local File Connector
- S3/MinIO Connector
- Database Connector
  - PostgreSQL
  - MySQL
  - Oracle 후보
- REST API Connector
- Web Crawler Connector
- Notion/Confluence/SharePoint 후보
- Git Repository Document Connector
```

## 10.3 Plugin 유형

```text
- Parser Plugin
- Chunker Plugin
- Extractor Plugin
- Validator Plugin
- Exporter Plugin
- Visualization Plugin
- Agent Tool Plugin
```

## 10.4 백엔드 요구사항

### 신규 도메인 객체

```text
ConnectorDefinition
ConnectorInstance
ConnectorCredential
ConnectorSyncJob
PluginDefinition
PluginVersion
PluginExecution
PluginPermission
```

### SDK 원칙

```text
- connector/plugin은 명확한 input/output schema를 가져야 한다.
- credential은 암호화해서 저장한다.
- plugin 실행 권한을 제한한다.
- 실패/재시도/동기화 이력을 남긴다.
- 로컬 개발에서는 mock connector를 제공한다.
```

## 10.5 프론트엔드 요구사항

```text
- Connector Catalog
- Connector Setup Wizard
- Sync Job Monitor
- Plugin Management
- Plugin Execution Log
```

---

# 11. Theme 8 — Ontology Pack / Domain Template

## 11.1 목표

사용자가 매번 온톨로지를 처음부터 만들지 않도록 도메인별 템플릿을 제공한다.

## 11.2 예시 도메인 팩

```text
- 보험 도메인 팩
- 제조 설비 도메인 팩
- 법률/규정 도메인 팩
- 의료 행정 도메인 팩
- 고객 상담/민원 도메인 팩
- 연구 논문/기술문서 도메인 팩
```

## 11.3 구성 요소

```text
- 기본 클래스
- 기본 속성
- 기본 관계
- 관계 방향 예시
- 제약조건
- 샘플 문서
- 샘플 정형 데이터
- LLM 프롬프트 템플릿
- 검증 룰
- 대시보드 기본 설정
- 시각화 레이아웃 preset
```

## 11.4 백엔드 요구사항

```text
OntologyPack
OntologyPackVersion
OntologyPackInstall
OntologyPackTemplateItem
PromptPack
ValidationRulePack
SampleDatasetPack
```

## 11.5 프론트엔드 요구사항

```text
- Ontology Pack Gallery
- Pack Preview
- Pack Install Wizard
- Pack Diff Viewer
- Pack Update Notification
```

---

# 12. Theme 9 — Advanced Visualization & Knowledge Storytelling

## 12.1 목표

화려한 UI를 단순 장식이 아니라, 복잡한 지식 구조와 품질 상태를 쉽게 이해시키는 방향으로 고도화한다.

## 12.2 고급 시각화 기능

```text
- Graph Lens
- 품질 상태별 그래프 레이어
- 후보/게시 그래프 비교 레이어
- 시간 흐름별 그래프 변화 애니메이션
- Ontology Diff Graph
- Source-to-Graph Trace View
- Relation Matrix View
- Evidence Heatmap
- Data Quality Storyboard
- Executive Summary View
```

## 12.3 Knowledge Storytelling 예시

사용자가 특정 데이터 소스를 선택하면 다음 흐름을 한 화면에서 볼 수 있어야 한다.

```text
이 문서가 업로드됨
→ 328개 chunk로 나뉨
→ 1,240개 엔티티 후보 생성
→ 3,820개 관계 후보 생성
→ 412개 검증 실패
→ 2,930개 전문가 승인
→ 330개 수정
→ 148개 반려
→ 2,812개 게시 그래프 반영
→ 품질 점수 91점
```

## 12.4 프론트엔드 요구사항

```text
- 그래프 노드/엣지 상태를 색상, 굵기, 점선, 아이콘, 툴팁으로 표현한다.
- 관계 하나를 클릭하면 source, evidence, confidence, validation, review, publish history가 한 번에 보인다.
- 대규모 그래프는 clustering, lazy loading, search-focus interaction을 적용한다.
- 임원/관리자용 summary view와 전문가용 detail view를 분리한다.
```

## 12.5 백엔드 요구사항

```text
- 시각화 전용 graph snapshot API
- relation neighborhood API
- timeline API
- source-to-graph trace API
- quality layer API
- graph layout cache
```

---

# 13. Theme 10 — Enterprise Readiness / 운영 안정화 고도화

## 13.1 목표

운영 환경에서 장애, 보안, 권한, 감사, 성능, 백업, 배포를 안정적으로 관리한다.

## 13.2 핵심 기능

```text
- 고급 RBAC/ABAC
- 감사 로그 검색
- 작업 실패 알림
- 데이터 보존 정책
- 백업/복구 리허설
- 대용량 작업 모니터링
- 리소스 사용량 제한
- 비용/토큰 사용량 분석
- 보안 스캔/비밀정보 관리
- 배포 환경별 설정 관리
```

## 13.3 백엔드 요구사항

```text
- audit log indexing
- job retry policy 고도화
- idempotent worker task
- rate limit
- tenant quota
- secret management abstraction
- structured logging
- metrics endpoint
- distributed tracing 준비
```

## 13.4 프론트엔드 요구사항

```text
- Admin Console
- Audit Log Explorer
- Job Failure Center
- Usage & Cost Dashboard
- Permission Matrix Editor
- System Health Dashboard
```

---

# 14. MVP 6차 권장 우선순위

MVP 6차는 범위가 크므로 반드시 순서를 나눠 진행한다.

## 14.1 MVP 6.1 — 평가 체계 고도화

```text
- Gold Set Manager
- Evaluation Run
- Benchmark Dashboard
- Error Case Explorer
```

가장 먼저 해야 한다. 평가 체계가 있어야 이후 개선 효과를 측정할 수 있다.

## 14.2 MVP 6.2 — 지속 개선 루프

```text
- Correction Pattern 분석
- Learning Insights
- Prompt Improvement Suggestion
- 재추출 추천
```

## 14.3 MVP 6.3 — 온톨로지 거버넌스와 영향도 분석

```text
- Change Request
- Ontology Diff
- Impact Simulation
- Migration Plan
```

## 14.4 MVP 6.4 — Agentic Knowledge Operations

```text
- Knowledge Copilot
- Agent Recommendation
- 안전한 action approval
- 작업 자동 생성
```

## 14.5 MVP 6.5 — 제품화/확장성

```text
- Multi-tenant
- Connector SDK
- Ontology Pack
- Enterprise Admin
```

---

# 15. 백엔드 에이전트 지시사항

백엔드 에이전트는 MVP 6차에서 다음 원칙을 따른다.

## 15.1 공통 원칙

```text
- MVP 1~5차의 후보/게시 그래프 분리 원칙을 절대 깨지 않는다.
- evaluation, learning, governance, agent 기능은 기존 domain model 위에 확장한다.
- LLM/Agent 실행 결과는 항상 재현 가능한 run 단위로 저장한다.
- 장기적으로 multi-tenant를 고려해 organization_id/workspace_id 확장성을 유지한다.
- 새 기능은 migration, seed data, 테스트, OpenAPI 문서를 함께 제공한다.
```

## 15.2 우선 구현 순서

```text
1. EvaluationDataset / Gold Set 모델
2. EvaluationRun 실행 구조
3. Benchmark metric 계산기
4. Error Case 저장/조회 API
5. Correction Pattern 분석 배치
6. Ontology Change Request 모델
7. Impact Simulation 엔진
8. Agent session/tool call 구조
9. Connector/plugin abstraction
10. Enterprise audit/usage 확장
```

## 15.3 반드시 작성할 테스트

```text
- Gold Set 생성/수정 권한 테스트
- 후보 결과와 정답셋 매칭 테스트
- relation direction accuracy 계산 테스트
- prompt/model version별 evaluation run 분리 테스트
- ontology change impact 분석 테스트
- agent action approval 없이 게시 그래프 변경 불가 테스트
- tenant 격리 테스트
```

---

# 16. 프론트엔드 에이전트 지시사항

프론트엔드 에이전트는 MVP 6차에서 “화려하지만 이해 쉬운 지식 운영 UI”를 목표로 한다.

## 16.1 공통 원칙

```text
- 그래프 UI만으로 모든 것을 해결하지 않는다.
- Dashboard, Matrix, Table, Timeline, Diff, Evidence View를 조합한다.
- 사용자가 다음 액션을 바로 알 수 있어야 한다.
- LLM confidence, validation status, review status, publish status를 함께 보여준다.
- 에이전트 추천은 적용 전 사람이 확인해야 한다.
```

## 16.2 우선 구현 화면

```text
1. Evaluation Studio
2. Gold Set Manager
3. Benchmark Dashboard
4. Error Case Explorer
5. Learning Insights
6. Ontology Governance Board
7. Impact Simulation Viewer
8. Knowledge Copilot Panel
9. Connector Catalog
10. Ontology Pack Gallery
```

## 16.3 UI 컴포넌트 원칙

프론트엔드는 `hana-style-component`를 npm dependency로 설치해서 사용한다.

```bash
npm install github:appadog/hana-style-component
```

또는 환경에 따라 다음 방식도 허용한다.

```bash
npm install git+https://github.com/appadog/hana-style-component.git
```

주의사항:

```text
- 로컬 zip 파일을 복사해서 쓰지 않는다.
- 실제 export 목록은 설치 후 package.json, README, src/dist를 확인한다.
- 업무 화면에서 직접 import하지 말고 shared/ui/hana adapter 계층으로 감싼다.
- 저장소가 private이면 GitHub 인증/SSH 접근 권한 문제를 PM에게 보고한다.
```

---

# 17. PM 에이전트 지시사항

PM 에이전트는 MVP 6차를 “후속 기능 모음”이 아니라 “제품 성숙도 향상 단계”로 관리한다.

## 17.1 PM이 관리할 핵심 질문

```text
- 이 기능이 품질 향상에 직접 연결되는가?
- 이 기능이 전문가 검수 시간을 줄이는가?
- 이 기능이 운영 리스크를 낮추는가?
- 이 기능이 도메인 확장성을 높이는가?
- 이 기능이 제품 차별성을 만드는가?
```

## 17.2 PM 산출물

```text
- MVP 6차 상세 백로그
- 평가 지표 정의서
- Gold Set 구축 가이드
- Ontology Governance 프로세스 문서
- Agent 권한/안전 정책
- Connector 우선순위 표
- Ontology Pack 후보 목록
- Enterprise 운영 체크리스트
```

## 17.3 PM 수용 기준

MVP 6차 완료 시 PM은 아래를 확인한다.

```text
- 모델/프롬프트 성능을 Gold Set으로 비교할 수 있다.
- 전문가 수정 패턴이 Learning Insights에 반영된다.
- 온톨로지 변경 영향도를 게시 전 확인할 수 있다.
- Copilot이 분석/제안/작업 생성을 도와주되, 승인 없이 운영 그래프를 바꾸지 않는다.
- 여러 도메인/조직 확장을 위한 구조가 준비되어 있다.
- 외부 connector/plugin 확장의 기본 구조가 있다.
- 고급 시각화가 실제 문제 파악과 액션에 도움이 된다.
```

---

# 18. 데이터 모델 추가 초안

아래는 MVP 6차에서 추가될 수 있는 핵심 테이블 초안이다.

```text
evaluation_dataset
evaluation_sample
gold_entity
gold_relation
gold_evidence
evaluation_run
evaluation_metric
evaluation_error_case

learning_signal
review_correction_pattern
prompt_improvement_suggestion
auto_approval_policy_candidate
training_dataset_export

ontology_change_request
ontology_change_item
ontology_impact_report
ontology_migration_plan
ontology_release_note

impact_simulation
impact_affected_item
impact_recommendation

agent_session
agent_message
agent_tool_call
agent_recommendation
agent_action_request
agent_action_approval

organization
workspace
tenant_setting
domain
ontology_alignment
cross_domain_mapping

connector_definition
connector_instance
connector_sync_job
plugin_definition
plugin_version
plugin_execution

ontology_pack
ontology_pack_version
ontology_pack_install
```

---

# 19. API 그룹 추가 초안

```text
/evaluation-datasets
/evaluation-runs
/benchmarks
/learning-signals
/ontology-change-requests
/impact-simulations
/agent
/organizations
/workspaces
/domains
/connectors
/plugins
/ontology-packs
/admin/usage
/admin/audit-search
```

API 설계 시 모든 endpoint는 다음 정보를 고려한다.

```text
- project_id
- organization_id / workspace_id
- ontology_version_id
- model_run_id
- prompt_version_id
- source_id
- permission scope
- audit log 대상 여부
```

---

# 20. MVP 6차 완료 기준

MVP 6차가 끝났다고 판단하려면 아래가 가능해야 한다.

```text
1. 전문가가 Gold Set을 만들고 관리할 수 있다.
2. 모델/프롬프트/온톨로지 버전별 LLM 추출 성능을 비교할 수 있다.
3. 오류 케이스를 원문/evidence/후보/정답 기준으로 분석할 수 있다.
4. 전문가 수정 이력을 기반으로 자주 발생하는 오류 패턴을 볼 수 있다.
5. 프롬프트 개선 후보 또는 few-shot example 후보를 추천받을 수 있다.
6. 온톨로지 변경 요청을 만들고 리뷰/승인/게시할 수 있다.
7. 온톨로지 변경 영향도를 게시 전에 시뮬레이션할 수 있다.
8. Copilot이 품질 분석, 검수 우선순위, 재처리 작업 생성을 도와준다.
9. Copilot은 사용자 승인 없이 운영 그래프를 변경하지 않는다.
10. 조직/워크스페이스/도메인 확장을 위한 기본 구조가 있다.
11. Connector/Plugin 확장을 위한 최소 SDK 구조가 있다.
12. Ontology Pack을 설치하여 프로젝트 초기 구성을 빠르게 만들 수 있다.
13. 고급 시각화가 품질·근거·변경·영향도 이해를 돕는다.
14. 감사 로그, 사용량, 실패 작업, 비용/토큰 추적이 운영 화면에 연결된다.
```

---

# 21. MVP 6차 이후 플랫폼 포지션

MVP 6차까지 완성되면 플랫폼의 포지션은 다음처럼 정의할 수 있다.

```text
MVP 1~2차:
LLM 기반 온톨로지 지식 추출 도구

MVP 3차:
전문가 검수 기반 신뢰 지식그래프 구축 플랫폼

MVP 4차:
품질 평가와 검색/RAG 활용이 가능한 지식 운영 플랫폼

MVP 5차:
권한/감사/운영/게시를 갖춘 엔터프라이즈형 온톨로지 플랫폼

MVP 6차:
평가·학습·거버넌스·에이전트·생태계 확장을 갖춘 AI-native 지식 운영 제품
```

최종 슬로건:

> LLM으로 빠르게 만들고, 온톨로지로 통제하고, 전문가로 보증하며, 평가와 학습 루프로 계속 좋아지는 지식 운영 플랫폼.
