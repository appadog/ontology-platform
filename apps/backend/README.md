# Backend App

MVP 1차 FastAPI 백엔드입니다. 현재 범위는 BE-001, BE-003, BE-004, BE-005 일부를 포함하며, Source upload/preview(BE-006/BE-007)는 Project/Ontology P0 이후 진행합니다.

## Stack

- Python 3.12+
- FastAPI
- Pydantic v2
- SQLAlchemy 2.x
- Alembic
- PostgreSQL
- Redis
- MinIO
- Neo4j 또는 임시 Graph Adapter
- Docker Compose 기반 로컬 개발환경

## Structure

```text
app/
  main.py
  core/
    config.py
    security.py
    logging.py
    errors.py
    pagination.py
  db/
    session.py
    base.py
    migrations/
  api/
    router.py
    deps.py
  modules/
    auth/
    project/
    ontology/
tests/
```

## Local Run With Poetry

```bash
cd apps/backend
cp .env.example .env
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

PostgreSQL must be running for Project/Ontology APIs. You can start the full local stack from `infra/local`:

```bash
cd infra/local
cp .env.example .env
docker compose up --build
```

## Useful URLs

- Health: `GET http://localhost:8000/health`
- Version: `GET http://localhost:8000/version`
- Dev user: `GET http://localhost:8000/api/v1/me`
- OpenAPI UI: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/api/v1/openapi.json`

## Implemented MVP 1 Scope

- FastAPI 프로젝트 초기화
- Docker Compose 연계
- 개발용 Auth/RBAC 모드
- Project CRUD
- Ontology CRUD: class, property, relation, domain/range, cardinality, draft/published version
- OpenAPI 문서

## P0 API Flow

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/me

curl -X POST http://localhost:8000/api/v1/projects \
  -H 'Content-Type: application/json' \
  -d '{"name":"Corporate Document Ontology Demo","description":"MVP 1 demo project"}'

curl -X POST http://localhost:8000/api/v1/projects/{project_id}/ontology/versions \
  -H 'Content-Type: application/json' \
  -d '{"created_by":"dev-user"}'

curl -X POST http://localhost:8000/api/v1/ontology/versions/{version_id}/classes \
  -H 'Content-Type: application/json' \
  -d '{"name":"Company","label":"Company","position":{"x":120,"y":120}}'

curl http://localhost:8000/api/v1/ontology/versions/{version_id}/graph
```

## Database

Alembic migration files live under `app/db/migrations`.

```bash
poetry run alembic upgrade head
poetry run alembic downgrade -1
```

## Tests

```bash
poetry run pytest
```

## Notes

- Enum strings are copied from `docs/pm/GLOSSARY.md`.
- Published ontology versions are locked for class/property/relation mutation.
- Project delete is implemented as `ProjectStatus=ARCHIVED`, not physical deletion.
- `source_count` currently returns `0` until SourceData models land in BE-006.
