# Backend App

MVP 1차 FastAPI 백엔드입니다. 현재 범위는 BE-001, BE-002, BE-003, BE-004, BE-005, BE-006, BE-007, BE-010과 BE-008 seed 초안을 포함합니다.

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
    source/
    prompt/
    extraction/
    candidate/
tests/
scripts/
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
- Source upload/list/detail/delete
- CSV/Excel preview
- TXT/PDF metadata-only upload with `preview_status=NOT_AVAILABLE`
- OpenAPI 문서
- OpenAPI JSON export script
- MVP 1 seed data script

## Implemented MVP 2 Draft Thin Slice

- SourceSegment persistence scaffold
- CSV/Excel source profiling
- deterministic TXT/PDF and tabular source parse/chunk endpoints
- PromptTemplate/PromptVersion scaffold
- ExtractionJob/ModelRun scaffold
- deterministic MockProvider only
- CandidateEntity/CandidateRelation/CandidateEvidence persistence scaffold
- read-only candidate/evidence query endpoints

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

curl -X POST http://localhost:8000/api/v1/projects/{project_id}/sources/upload \
  -F source_type=CSV \
  -F display_name=Companies \
  -F file=@../../infra/local/seed/companies.csv

curl http://localhost:8000/api/v1/sources/{source_id}/preview
```

## Database

Alembic migration files live under `app/db/migrations`.

```bash
poetry run alembic upgrade head
poetry run alembic downgrade -1
```

## OpenAPI Export

BE-010 type sharing decision: backend exports OpenAPI JSON for FE type generation/manual sync.
MVP 1 canonical acceptance artifact remains `docs/api/openapi-mvp1.json`; current MVP 2 draft backend contract exports to `docs/api/openapi-mvp2-draft.json`.

```bash
cd apps/backend
poetry run python scripts/export_openapi.py
```

## Seed Data

```bash
cd apps/backend
poetry run alembic upgrade head
poetry run python scripts/seed_mvp1.py
```

The seed script creates the `기업 문서 온톨로지 Demo` project, draft ontology classes/properties/relations, and a CSV source using `infra/local/seed/companies.csv`.

## Tests

```bash
poetry run pytest
```

## MVP 2 Closeout Regression

Wave 11 closeout uses the backend test suite as the reproducible local API regression
for BE2-001 through BE2-009. The fixture catalog smoke is covered by:

```bash
cd apps/backend
.venv/bin/pytest tests/test_project_ontology_api.py \
  -k "wave11_mvp2_closeout_fixture_catalog or wave10_source_profile or wave10_source_parse"
```

Coverage map:

- `default`: mock extraction reaches `SUCCESS`, persists passed entity/relation candidates, and resolves normal evidence.
- `partial_invalid`: reaches `PARTIAL_FAILED` with `MISSING_EVIDENCE`, warning validation, and no evidence ids.
- `invalid_evidence_reference`: reaches `PARTIAL_FAILED` with `INVALID_EVIDENCE_REFERENCE`, non-null broken refs, and evidence metadata for traceability fallback.
- `missing`: reaches `FAILED` with `MOCK_FIXTURE_NOT_FOUND` and no candidate persistence.
- Retry smoke: `POST /api/v1/extraction-jobs/{job_id}/retry` creates a linked job and retry-chain dedupe prevents duplicate visible candidates/evidence.
- Masking smoke: `ModelRun.raw_request` and `raw_response` store IDs/counts/metadata only, with `masking_version` and `redaction_summary`.

Full closeout backend verification:

```bash
cd apps/backend
.venv/bin/ruff check app tests scripts
.venv/bin/pytest
.venv/bin/python scripts/export_openapi.py
tmpfile=$(mktemp /tmp/openapi-mvp2-closeout.XXXXXX)
.venv/bin/python scripts/export_openapi.py --output "$tmpfile"
cmp -s "$tmpfile" ../../docs/api/openapi-mvp2-draft.json
```

## MVP 3 Seed and Closeout Smoke

MVP 3 deterministic seed support creates the fixed project
`project-corp-knowledge` with review tasks, publish eligibility states,
published graph facts, and quality metrics for actual API smoke.

```bash
cd apps/backend
rm -f /tmp/ontology-mvp3-seed.db /tmp/ontology-mvp3-seed.json
DATABASE_URL=sqlite+pysqlite:////tmp/ontology-mvp3-seed.db .venv/bin/alembic upgrade head
DATABASE_URL=sqlite+pysqlite:////tmp/ontology-mvp3-seed.db .venv/bin/python scripts/seed_mvp3.py --output /tmp/ontology-mvp3-seed.json
```

Focused MVP 3 backend regression and OpenAPI freshness checks:

```bash
cd apps/backend
.venv/bin/pytest tests/test_mvp3_api.py -q
.venv/bin/ruff check app tests scripts
.venv/bin/python scripts/export_openapi.py --output /tmp/openapi-mvp3.json
cmp -s /tmp/openapi-mvp3.json ../../docs/api/openapi-mvp3-draft.json
```

## MVP 5 Seed and Thin Runtime Smoke

MVP 5 deterministic seed support extends the MVP4 seed with the admin/operator
governance thin slice plus Wave25 ontology JSON export/import dry-run fixtures.
The seed output records stable IDs and confirms one-time create response support
without writing raw credential secrets.

```bash
cd apps/backend
rm -f /tmp/ontology-wave25-mvp5-seed.db /tmp/ontology-wave25-mvp5-seed.json
DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave25-mvp5-seed.db .venv/bin/alembic upgrade head
DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave25-mvp5-seed.db .venv/bin/python scripts/seed_mvp5.py --output /tmp/ontology-wave25-mvp5-seed.json
.venv/bin/pytest tests/test_mvp5_api.py -q
.venv/bin/python scripts/export_openapi.py --output /tmp/ontology-wave25-mvp5-openapi.json
```

## Notes

- Enum strings are copied from `docs/pm/GLOSSARY.md`.
- Published ontology versions are locked for class/property/relation mutation.
- Project delete is implemented as `ProjectStatus=ARCHIVED`, not physical deletion.
- Source delete is implemented as an internal soft delete because `SourceStatus` has no `ARCHIVED`/`DELETED` enum in the MVP 1 glossary.
