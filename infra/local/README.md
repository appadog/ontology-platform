# Local Infra

MVP 1 로컬 Docker Compose 구성입니다.

## Files

```text
docker-compose.yml
.env.example
seed/
```

## Ports

| Service | Default Port |
|---|---|
| backend | 8000 |
| frontend | 5173 |
| postgres | 5432 |
| redis | 6379 |
| minio api | 9000 |
| minio console | 9001 |
| neo4j browser | 7474 |
| neo4j bolt | 7687 |

## Run

```bash
cd infra/local
cp .env.example .env
docker compose up --build
```

Backend API:

- Health: `http://localhost:8000/health`
- OpenAPI UI: `http://localhost:8000/docs`

The backend service runs `alembic upgrade head` before starting Uvicorn.
