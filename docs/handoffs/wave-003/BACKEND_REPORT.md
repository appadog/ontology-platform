# Backend Report - Wave 3

## 담당 범위
- backlog ID: `BE-006`, `BE-007`, `BE-010`, 부분 `BE-008`
- 작업 경로: `apps/backend/`, `infra/local/seed/`, `docs/api/openapi-mvp1.json`

## 완료한 작업
- Source upload/list/detail/delete API 구현.
- CSV preview 구현.
- Excel `.xlsx` preview 구현. 외부 런타임 의존성을 늘리지 않기 위해 `zipfile`/XML 표준 라이브러리 기반으로 첫 worksheet를 파싱한다.
- TXT/PDF 업로드는 metadata만 저장하고 `preview_status=NOT_AVAILABLE`로 처리.
- `SourceStatus`와 `SourcePreviewStatus`를 분리해 `SourceData` OpenAPI schema에 노출.
- `SourceData`, `SourcePreview`, `SourcePreviewColumn` DTO와 OpenAPI examples 추가.
- `source_data` DB 모델과 Alembic migration 추가.
- Project detail/list의 `source_count`가 실제 non-deleted SourceData 수를 세도록 변경.
- `BE-010` 방식 결정: backend가 `docs/api/openapi-mvp1.json`을 canonical OpenAPI export로 제공하고, frontend는 이 파일에서 타입 생성 또는 수동 동기화를 수행한다.
- `scripts/export_openapi.py` 추가 및 `docs/api/openapi-mvp1.json` 생성.
- `scripts/seed_mvp1.py`와 `infra/local/seed/companies.csv` 추가. Seed는 demo project, ontology classes/properties/relations, CSV source preview snapshot을 생성한다.

## 변경 파일
- `apps/backend/.env.example`
- `apps/backend/README.md`
- `apps/backend/app/api/router.py`
- `apps/backend/app/core/config.py`
- `apps/backend/app/db/base.py`
- `apps/backend/app/db/migrations/versions/20260617_0002_source_data.py`
- `apps/backend/app/modules/project/router.py`
- `apps/backend/app/modules/source/__init__.py`
- `apps/backend/app/modules/source/models.py`
- `apps/backend/app/modules/source/preview.py`
- `apps/backend/app/modules/source/router.py`
- `apps/backend/app/modules/source/schemas.py`
- `apps/backend/scripts/export_openapi.py`
- `apps/backend/scripts/seed_mvp1.py`
- `apps/backend/tests/test_project_ontology_api.py`
- `docs/api/API_CONTRACT_PRIORITY_MVP1.md`
- `docs/api/openapi-mvp1.json`
- `infra/local/.env.example`
- `infra/local/seed/companies.csv`

참고: `docs/api/API_CONTRACT_PRIORITY_MVP1.md`는 작업 시작 시점부터 PM/contract 쪽 변경으로 modified 상태였고, Backend wave에서는 `BE-010` OpenAPI/type sharing 결정 문구만 추가로 갱신했다.

## 실행/검증
- 실행한 명령:
  - `python3 -m compileall apps/backend/app apps/backend/scripts apps/backend/tests`
  - `.venv/bin/ruff check .`
  - `.venv/bin/pytest`
  - `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-alembic-wave3.db .venv/bin/alembic upgrade head`
  - `.venv/bin/python scripts/export_openapi.py --output ../../docs/api/openapi-mvp1.json`
  - OpenAPI export check: required Source paths missing `[]`, schemas include `SourceData`, `SourcePreview`, `SourceStatus`, `SourcePreviewStatus`
  - `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-seed-wave3.db .venv/bin/alembic upgrade head`
  - `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-seed-wave3.db .venv/bin/python scripts/seed_mvp1.py`
  - seed idempotency check: seed script 재실행
- 결과:
  - compileall 통과
  - ruff 통과
  - pytest `4 passed`
  - Alembic migration `20260617_0001`, `20260617_0002` SQLite smoke 통과
  - OpenAPI export 생성 완료
  - Source CSV/TXT/Excel upload-preview test 통과
  - seed script 실행 및 재실행 통과
- 실행하지 못한 검증:
  - `docker --version` 결과 `command not found`
  - Docker CLI가 없어 `docker compose up` 및 `docker compose config` 실제 검증 미수행

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
  - 추가 API:
    - `GET /api/v1/projects/{project_id}/sources`
    - `POST /api/v1/projects/{project_id}/sources/upload`
    - `GET /api/v1/sources/{source_id}`
    - `GET /api/v1/sources/{source_id}/preview`
    - `DELETE /api/v1/sources/{source_id}`
  - 추가 DTO:
    - `SourceUploadRequest`
    - `SourceData`
    - `SourcePreview`
    - `SourcePreviewColumn`
  - enum:
    - 기존 glossary enum `SourceType`, `SourceStatus`, `SourcePreviewStatus`, `PropertyDataType` 사용
    - 새 enum 값 추가 없음
  - DB:
    - `source_data` table 추가
    - `SourceStatus`와 `SourcePreviewStatus`는 별도 컬럼
    - Source delete는 glossary에 `ARCHIVED/DELETED` source status가 없으므로 internal `is_deleted` soft delete로 처리
  - OpenAPI:
    - `docs/api/openapi-mvp1.json` 생성
    - `SourceData`, `SourcePreview` response examples 포함
- 영향받는 역할:
  - Frontend: Source list/upload/detail/preview API client와 types/mock 갱신 필요
  - QA: INT-002/INT-003에서 `docs/api/openapi-mvp1.json` 기준 contract review 가능
  - PM: BE-010 결정 문서화 필요 시 `docs/api/API_CONTRACT_PRIORITY_MVP1.md` 또는 ADR 반영 필요

## Blocker
- Docker CLI가 현재 환경에 없어 Compose 실제 실행 검증 불가.
- Poetry CLI도 현재 환경에 없어 검증은 기존 `.venv + pip` 환경으로 수행.

## 남은 TODO
- Docker 가능 환경에서 `cd infra/local && cp .env.example .env && docker compose up --build` 검증.
- Frontend가 `docs/api/openapi-mvp1.json` 기반으로 Source DTO/API를 동기화.
- QA가 Backend Source flow와 FE Source flow를 묶어 INT-001 full demo flow 재검증.
- 필요하면 PM이 Source soft delete 방식(`is_deleted`)을 API contract note에 명시.

## 다른 역할에 전달할 내용
- PM:
  - `BE-010` 결정은 `docs/api/openapi-mvp1.json`을 canonical export로 두는 방식이다.
  - Source delete는 `SourceStatus` enum을 변경하지 않고 internal soft delete를 사용했다.
- Backend:
  - 후속 MVP에서 실제 object storage adapter를 붙일 때 현재 `storage_uri=local://...` 경계를 MinIO URI로 대체하면 된다.
  - `.xlsx` preview는 첫 worksheet만 파싱한다. legacy `.xls`는 MVP 1 범위 밖으로 보고 warning/fail 처리된다.
- Frontend:
  - CSV/Excel source는 `status=UPLOADED`, `preview_status=READY`가 정상 happy path다.
  - TXT/PDF source는 `status=UPLOADED`, `preview_status=NOT_AVAILABLE`이며 preview API는 빈 `columns`, `rows`와 warning을 반환한다.
  - `SourceData.metadata.display_name`에 upload form의 display name을 보존한다.
- QA:
  - OpenAPI export: `docs/api/openapi-mvp1.json`
  - Source API smoke는 pytest에서 CSV/TXT/Excel 모두 통과했다.
  - Docker compose 검증은 환경 blocker로 미수행.

## 총괄에게 요청하는 결정
- `SourceData` delete를 internal `is_deleted` soft delete로 처리한 것을 MVP 1 contract note로 수용할지 결정 필요.
- `docs/api/openapi-mvp1.json`을 FE 타입 공유 canonical artifact로 고정할지 승인 필요.

## 현재 판정
- PASS
