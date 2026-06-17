# Backend Report - Wave 5

## 담당 범위
- backlog ID: support `INT-001`, support `INT-003`, MVP2 draft backend risk review
- 작업 경로:
  - `apps/backend/`
  - `docs/api/openapi-mvp1.json`
  - `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `docs/handoffs/wave-005/BACKEND_REPORT.md`

## 완료한 작업
- Wave 5 필수 문서를 확인했다.
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-004/NEXT_ORDERS.md`
  - `docs/api/API_CONTRACT_PRIORITY_MVP1.md`
  - `docs/api/openapi-mvp1.json`
  - `apps/backend/README.md`
- Backend regression check를 수행했다.
- `docs/api/openapi-mvp1.json` freshness check를 수행했다.
- Source API가 깨지지 않았는지 pytest와 OpenAPI path/schema inspection으로 확인했다.
- `/api/v1/dashboard`가 MVP 1 OpenAPI에 없음을 확인했고, 신규 endpoint를 추가하지 않았다.
- `SourceStatus`에 delete/archive enum이 추가되지 않았음을 확인했다.
- candidate/review/publish API를 추가하지 않았다.
- MVP 2 draft API 문서를 backend 관점에서 훑고 위험 의견을 정리했다.
- no backend change required: Frontend/QA의 Wave 4 actual FE-to-BE smoke에서 backend 수정이 필요한 이슈는 발견되지 않았고, 이번 Wave 5에서는 backend/API 구현 파일 변경이 필요 없었다.

## 변경 파일
- `docs/handoffs/wave-005/BACKEND_REPORT.md`

Backend code, migration, OpenAPI artifact는 변경하지 않았다.

## 실행/검증
- 실행한 명령:
  - `python3 -m compileall apps/backend/app apps/backend/scripts apps/backend/tests`
  - `.venv/bin/ruff check .`
  - `.venv/bin/pytest`
  - `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-wave5-regression.db LOCAL_STORAGE_PATH=/private/tmp/ontology-platform-wave5-storage .venv/bin/alembic upgrade head`
  - OpenAPI freshness check:
    - exported `docs/api/openapi-mvp1.json` equals current `app.openapi()`
  - OpenAPI contract inspection:
    - `/api/v1/dashboard` path absence
    - Source API path presence
    - `OntologyGraph.required`
    - `classes.deprecated`, `relations.deprecated`
    - `SourceStatus` enum values
    - `SourcePreviewStatus` enum values
  - `docker --version`
  - `rg -n "dashboard|candidate|review|publish" apps/backend/app docs/api/openapi-mvp1.json`
- 결과:
  - compileall 통과.
  - ruff 통과: `All checks passed!`
  - pytest 통과: `5 passed`
  - Alembic SQLite smoke 통과:
    - `20260617_0001`
    - `20260617_0002`
  - OpenAPI freshness: PASS, `fresh=True`
  - `/api/v1/dashboard`: 없음, `has_dashboard=False`
  - Source API required paths missing: `[]`
  - `OntologyGraph.required = ['version_id', 'version_status', 'nodes', 'edges', 'properties']`
  - `classes_deprecated=True`, `relations_deprecated=True`
  - `SourceStatus.enum = ['UPLOADED', 'PARSING', 'PARSED', 'PROFILED', 'EXTRACTION_READY', 'FAILED']`
  - `SourcePreviewStatus.enum = ['PENDING', 'READY', 'NOT_AVAILABLE', 'FAILED']`
  - `rg` 확인 결과 backend app에는 dashboard endpoint가 없고 candidate/review API도 없다. `publish`는 MVP 1 ontology version publish endpoint로 기존 계약 범위다.
- 실행하지 못한 검증:
  - Docker Compose 검증은 수행하지 못했다.
  - `docker --version` 결과: `zsh:1: command not found: docker`

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - 신규 Backend API 추가 없음.
  - `/api/v1/dashboard` 추가 없음.
  - candidate/review/publish candidate graph API 추가 없음.
  - `SourceStatus` enum 변경 없음.
  - `docs/api/openapi-mvp1.json` 변경 없음. 현재 backend `app.openapi()`와 일치한다.
- 영향받는 역할:
  - Frontend: backend는 `/api/v1/dashboard`를 제공하지 않는다. actual API mode에서 dashboard는 P0 API 조합 계산 또는 mock-only/P1 boundary로 처리해야 한다.
  - QA: `docs/api/openapi-mvp1.json` freshness와 backend regression은 PASS 상태로 재검증 기준에 사용할 수 있다.

## Blocker
- Docker CLI 없음. Compose 실제 `up` 검증은 여전히 별도 환경 gate가 필요하다.

## 남은 TODO
- Frontend/QA가 actual FE-to-BE smoke에서 새 backend issue를 발견하면 해당 이슈만 별도 backlog로 받아 수정한다.
- Docker CLI가 있는 환경에서 `infra/local` compose 검증을 수행한다.
- MVP 2 구현은 MVP 1 acceptance closeout 또는 PM 승인 예외 전까지 시작하지 않는다.

## MVP 2 draft backend risk review
- `SourceSegment.segment_type` enum source가 draft 문서에 고정되어 있지 않다. MVP 2 contract 시작 시 `ROW`, `CELL`, `SHEET`, `PAGE`, `SECTION`, `PARAGRAPH`, `CHUNK`, `TABLE`, `TABLE_ROW`, `TABLE_CELL` 중 실제 MVP2 범위를 먼저 고정해야 한다.
- `POST /api/v1/sources/{source_id}/profile`와 `POST /api/v1/sources/{source_id}/parse`는 동기 실행처럼 보인다. 파일 크기와 PDF parsing 실패를 고려하면 job/result 분리 또는 status/error DTO가 필요하다.
- `SourceProfileColumn.inferred_type`이 MVP 1 `PropertyDataType`과 같은 enum인지 별도 profiling enum인지 결정이 필요하다. 그대로 방치하면 FE/BE 타입이 갈라질 수 있다.
- `ExtractionJob.status`는 glossary의 `ExtractionJobStatus`를 재사용해야 한다. Draft DTO에는 enum binding이 명시되어 있지 않다.
- `CandidateEntity`/`CandidateRelation`은 evidence 없이 저장 가능하다는 규칙과 “후보는 evidence를 가진다”는 목표가 충돌할 수 있다. 저장은 허용하되 `ValidationStatus=WARNING/FAILED`와 missing evidence rule code를 필수화하는 식으로 PM 정책을 먼저 정해야 한다.
- `ModelRun.raw_request`/`raw_response` 저장은 유용하지만 개인정보/비밀정보 마스킹 정책이 필요하다. MVP 2에서도 LLM API key나 민감 원문이 raw payload에 섞이지 않도록 schema-level guard가 필요하다.
- Candidate 조회 endpoint가 extraction-job 하위에만 있다. FE candidate review 이전 단계에서도 project/source/ontology_version 기준 필터 조회가 필요할 수 있으므로 pagination/filter/sort contract를 초기에 잡는 것이 안전하다.

## 다른 역할에 전달할 내용
- PM:
  - Backend는 Wave 5에서 no backend change required 상태다.
  - `/api/v1/dashboard`는 MVP 1에 추가하지 않았다.
  - MVP 2 draft는 구현 전 enum/status/job/error/evidence 정책을 더 구체화하는 것이 안전하다.
- Backend:
  - 현재 backend regression PASS.
  - 신규 API를 추가하지 않았고 OpenAPI artifact도 freshness PASS다.
  - MVP 2 구현 금지 상태를 유지한다.
- Frontend:
  - `/api/v1/dashboard`는 backend/OpenAPI에 없다. actual API mode에서 호출하면 404가 맞다.
  - Source API와 graph OpenAPI 계약은 유지되고 있다.
- QA:
  - Backend regression PASS, OpenAPI freshness PASS.
  - Source API smoke는 pytest에 포함되어 통과했다.
  - Docker Compose 검증은 Docker CLI 부재로 계속 blocker다.

## 총괄에게 요청하는 결정
- 없음.

## 현재 판정
- PASS
