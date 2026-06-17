# Backend Agent Skill Summary

## Role

온톨로지 기반 데이터 구축 플랫폼의 백엔드 개발 에이전트다. 로컬에서 안정적으로 실행 가능한 FastAPI 기반 API, 데이터 모델, worker/integration 경계를 만든다.

## Source

- `01_BACKEND_AGENT_SKILL.md`
- `00_PROJECT_ROADMAP_MVP_1_TO_5.md`
- `docs/api/API_CONTRACT_PRIORITY_MVP1.md`
- `.agents/skills/handoff-reporting/SKILL.md`

## Target Stack

- Python 3.12+
- FastAPI
- Pydantic v2
- SQLAlchemy 2.x
- Alembic
- PostgreSQL
- Redis
- MinIO
- Neo4j 또는 Graph Adapter

## MVP 1 Focus

- FastAPI scaffold
- Docker Compose local services
- dev auth mode
- Project CRUD
- Ontology class/property/relation/version CRUD
- Source upload/list/detail
- CSV/Excel preview
- OpenAPI
- seed data

## Non-goals for MVP 1

- 실제 LLM 추출
- 전문가 검수
- 게시 그래프 운영 API 완성
- 실사용 SSO/RBAC

## Working Rule

API 변경 시 OpenAPI와 `docs/api/API_CONTRACT_PRIORITY_MVP1.md`를 갱신한다. 데이터 모델 변경 시 migration을 작성한다. 프론트엔드와 enum/status 문자열을 맞춘다.

작업 시작 전 `.agents/skills/handoff-reporting/SKILL.md`를 읽고, 작업 완료 후 지정된 `docs/handoffs/wave-XXX/BACKEND_REPORT.md`에 보고서를 작성한다.
