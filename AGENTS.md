# AGENTS.md

이 레포의 에이전트 운영 기준입니다. 모든 에이전트는 아래 기준 문서를 먼저 확인하고, MVP 범위와 디렉터리 ownership을 지킨다.

## Source of Truth

- 제품/로드맵: `00_PROJECT_ROADMAP_MVP_1_TO_5.md`
- MVP 6 제품화/고도화 확장 로드맵: `04_MVP6_PRODUCTIZATION_AND_ADVANCED_KNOWLEDGE_OPS.md`
- PM 운영: `03_PM_AGENT_SKILL.md`
- 백엔드 운영: `01_BACKEND_AGENT_SKILL.md`
- 프론트엔드 운영: `02_FRONTEND_AGENT_SKILL.md`
- MVP 1 백로그: `docs/backlog/MVP1_BACKLOG.md`
- API 우선순위: `docs/api/API_CONTRACT_PRIORITY_MVP1.md`
- 역할별 보고/다음 지시: `docs/handoffs/`
- 필수 보고 스킬: `.agents/skills/handoff-reporting/SKILL.md`
- 아키텍처 결정: `docs/adr/`

## Global Product Rules

1. LLM 결과는 게시 그래프에 바로 쓰지 않고 항상 후보 계층에 저장한다.
2. 후보 엔티티·관계·속성값은 원천 근거를 가진다. MVP 1에서는 이 원칙을 데이터 모델과 API 이름에 미리 반영한다.
3. 후보 그래프와 게시 그래프는 분리한다.
4. ontology version, prompt version, model run, review decision, audit log가 후속 MVP에서 연결될 수 있게 확장 가능한 모델을 잡는다.
5. MVP 1에서는 실제 LLM 추출, 전문가 검수, RAG, 실사용 SSO/RBAC를 구현하지 않는다.
6. 모든 주요 기능은 로컬 실행, 더미 데이터, API 문서, 기본 UI 상태를 고려한다.
7. MVP 6 이후 기능은 평가, 학습, 거버넌스, 에이전트, 생태계 확장을 목표로 하되 후보/게시 그래프 분리와 evidence 보존 원칙을 절대 깨지 않는다.

## Collaboration Flow

```text
PM: 요구사항/수용 기준 작성
→ Backend: API/데이터 모델 초안 작성
→ Frontend: 화면/UX/API 필요사항 검토
→ PM: 범위 조율 및 승인
→ Backend/Frontend 병렬 개발
→ PM: 수용 테스트
```

새 기능은 contract-first로 진행한다.

1. PM이 사용자 시나리오와 수용 기준을 쓴다.
2. Backend가 endpoint와 DTO 초안을 제안한다.
3. Frontend가 필요한 필드, 상태, 에러 케이스를 검토한다.
4. PM이 MVP 범위를 확정한다.
5. Backend는 OpenAPI와 mock response를 제공한다.
6. Frontend는 mock fixture로 먼저 화면을 구현한다.
7. 실제 API 연결 후 수용 테스트한다.

## Directory Ownership

| 경로 | 주요 책임 |
|---|---|
| `apps/backend/` | FastAPI, DB 모델, API, worker, integration adapter |
| `apps/frontend/` | React/Vite UI, route, feature, shared API/UI adapter |
| `infra/` | Docker Compose, local infra, env example, seed/runtime support |
| `docs/pm/` | PRD, IA, glossary, role policy, scope decision |
| `docs/api/` | API priority, DTO decisions, contract review notes |
| `docs/backlog/` | MVP backlog, issue template, acceptance tracking |
| `docs/handoffs/` | agent reports, commander status, next orders |
| `docs/adr/` | architecture decision records |
| `.agents/skills/` | 에이전트별 작업 지시 요약 |

## Agent Reporting Protocol

각 에이전트는 작업 시작 전 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.

각 에이전트는 맡은 wave 작업을 끝낸 뒤 `docs/handoffs/wave-XXX/`에 보고한다. 보고 형식은 `docs/handoffs/REPORT_TEMPLATE.md`를 따른다.

역할별 작업은 코드나 문서 변경만으로 완료되지 않는다. 지정된 `{ROLE}_REPORT.md`가 작성되어야 완료로 본다.

총괄 에이전트는 다음 순서로 판단한다.

1. `docs/handoffs/CURRENT_STATE.md`를 확인한다.
2. 해당 wave의 `*_REPORT.md`를 모두 읽는다.
3. blocker, API/enum/DTO 변경, 검증 결과를 통합한다.
4. `docs/handoffs/wave-XXX/NEXT_ORDERS.md`에 다음 wave 지시를 작성한다.
5. 필요하면 backlog, API contract, glossary, ADR을 갱신한다.

## Backend Rules

- 기본 스택은 Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, PostgreSQL, Redis, MinIO, Neo4j adapter 방향을 따른다.
- 초기 구현은 모듈러 모놀리스로 시작한다.
- API 변경 시 OpenAPI와 프론트엔드 타입 계약을 함께 갱신한다.
- 데이터 모델 변경 시 Alembic migration을 작성한다.
- 개발용 인증은 허용하되 역할 enum과 권한 확장 지점을 미리 둔다.

## Frontend Rules

- 기본 스택은 React, TypeScript, Vite, styled-components를 따른다.
- `hana-style-component`는 dependency로 설치하고, 업무 화면에서는 직접 import하지 않는다.
- 외부 UI는 `src/shared/ui/hana` adapter 계층으로 감싼다.
- 모든 화면은 loading, empty, error 상태를 가진다.
- 온톨로지 모델러와 그래프 시각화는 제품 핵심 기능으로 다룬다.

## PM Rules

- PM은 MVP 범위, 사용자 역할, 용어집, API 우선순위, Definition of Done을 관리한다.
- 변경 결정은 ADR 또는 backlog note로 남긴다.
- 백엔드/프론트엔드가 같은 enum과 용어를 쓰는지 확인한다.
- 샘플 도메인은 MVP 1 데모 시나리오와 seed data의 기준이 된다.

## Done Criteria for MVP 1

- 로컬에서 frontend, backend, postgres, redis, minio, graph-db 또는 graph adapter를 실행할 수 있다.
- 사용자가 프로젝트를 만들 수 있다.
- 사용자가 클래스/속성/관계를 만들고 그래프에서 볼 수 있다.
- CSV/Excel 파일 업로드 후 샘플 데이터를 미리볼 수 있다.
- 주요 API가 OpenAPI에 노출된다.
- PM 수용 기준이 `docs/backlog/MVP1_BACKLOG.md`에서 추적된다.
