# Backend Report - Wave 2

## 담당 범위

- Backlog IDs:
  - `BE-001`
  - `BE-002`
  - `BE-003`
  - `BE-004`
  - `BE-005`
  - `BE-009`
- 일부 관련:
  - `BE-010` 미완료
- 작업 경로:
  - `apps/backend`
  - `infra/local`

## 완료한 작업

- `BE-001`: FastAPI backend scaffold 완료.
- `BE-002`: `infra/local` Docker Compose 초안 완료.
- `BE-003`: Project CRUD API 완료.
- `BE-004`: Ontology class/relation API 및 graph 조회 API 완료.
- `BE-005`: Ontology version/property API까지 함께 구현.
- `BE-009`: dev auth `/api/v1/me` 제공.
- `/health`, `/version` 제공.
- Project/Ontology P0 API OpenAPI 노출.
- `infra/local/docker-compose.yml`에 backend, postgres, redis, minio, neo4j 구성.
- `apps/backend/README.md`에 실행 방법 기록.

## 변경 파일

- `apps/backend/pyproject.toml`
- `apps/backend/.env.example`
- `apps/backend/Dockerfile`
- `apps/backend/alembic.ini`
- `apps/backend/README.md`
- `apps/backend/app/main.py`
- `apps/backend/app/api/router.py`
- `apps/backend/app/core/*`
- `apps/backend/app/db/*`
- `apps/backend/app/db/migrations/*`
- `apps/backend/app/modules/auth/*`
- `apps/backend/app/modules/project/*`
- `apps/backend/app/modules/ontology/*`
- `apps/backend/tests/test_project_ontology_api.py`
- `infra/local/.env.example`
- `infra/local/docker-compose.yml`
- `infra/local/README.md`

## 실행/검증

- 실행한 검증:
  - `compileall` 통과.
  - `ruff check` 통과.
  - `pytest` 2 passed.
  - Alembic upgrade smoke 통과.
  - Uvicorn health/OpenAPI smoke 확인.
- 실행하지 못한 검증:
  - Docker CLI가 없어 Compose 실제 `up` 검증 미수행.

## API/Enum/DTO 변경

- Project/Ontology P0 API가 OpenAPI에 노출됨.
- `OntologyGraph`는 `nodes`, `edges`, `properties`를 우선 사용하면 됨.
- `classes`, `relations`도 응답에 함께 포함됨.
- Source API는 아직 미구현이므로 Source UI/API 연동은 `BE-006`, `BE-007` 이후 진행 필요.

## Blocker

- 현재 작업 환경에 Docker CLI 없음.
- Poetry 없음. 대신 `.venv + pip`로 검증 완료.
- `BE-006`, `BE-007` 미완료로 INT-001 전체 demo flow full pass 불가.
- `BE-010` OpenAPI export 방식 확정 필요.

## 남은 TODO

- `BE-006`: Source upload/list/detail API.
- `BE-007`: CSV/Excel preview API.
- `BE-008`: seed data.
- `BE-010`: OpenAPI export 방식 확정.
- Docker 가능 환경에서 `infra/local` compose 실행 검증.

## 다른 역할에 전달할 내용

- Frontend:
  - `OntologyGraph`는 `nodes`, `edges`, `properties`를 우선 사용하면 됨.
  - `classes`, `relations`도 함께 응답에 포함됨.
  - Source API는 아직 미구현이므로 Source UI/API 연동은 `BE-006`, `BE-007` 이후 진행 필요.
- PM:
  - Project/Ontology backend path는 준비됨.
  - Source upload/preview 미구현 상태를 MVP 1 gate로 유지해야 함.
- QA:
  - INT-001 전체 demo flow는 Source upload/preview 미구현으로 아직 full pass 불가.
  - Project 생성 → ontology version/class/property/relation 생성 → graph 조회까지 backend path는 준비됨.

## 총괄에게 요청하는 결정

- Docker CLI 없는 환경에서 Compose 검증을 QA/사용자 환경 gate로 넘길지 결정 필요.
- `BE-010` OpenAPI export 방식을 다음 Backend wave 필수로 둘지 결정 필요.
- `OntologyGraph` 응답에서 `classes`, `relations` backward-compatible 필드를 유지할지, `nodes`, `edges`, `properties`만 contract로 삼을지 PM 확인 필요.

## 현재 판정

- `PARTIAL`
- `BE-001`, `BE-002`, `BE-003`, `BE-004`, `BE-005`, `BE-009`는 보고 기준 완료.
- `BE-006`, `BE-007`, `BE-008`, `BE-010`은 미완료.
- INT-001은 Project/Ontology backend path까지 부분 검증 가능하나 Source upload/preview 미구현으로 full pass 불가.
