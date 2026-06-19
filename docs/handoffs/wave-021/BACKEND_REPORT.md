# Backend Report - Wave 21

## 담당 범위
- backlog ID:
  - `INT4-001` MVP4 contract/runtime alignment
  - `INT4-008` external read-only API
  - Backend regression for `BE4-001`~`BE4-009`
- 작업 경로:
  - `apps/backend/app/modules/mvp4/service.py`
  - `apps/backend/tests/test_mvp4_api.py`
  - `docs/handoffs/wave-021/BACKEND_REPORT.md`

## 완료한 작업
- Wave21 PM decision을 반영해 actual OpenAPI compare에서 standalone `ExternalApiEnvelopeBase` component를 요구하지 않고 concrete external envelope schemas를 비교했다.
- `GET /api/v1/external/sources/{source_id}` 500 원인을 수정했다.
  - 기존 `SourceData.model_validate(source, from_attributes=True)`가 SQLAlchemy declarative `metadata`를 API `metadata`로 읽어 `MetaData()` validation error를 냈다.
  - MVP1/2 source router 패턴과 동일하게 source model fields를 API `SourceData`로 명시 매핑했다.
- `GET /api/v1/external/evidence/{evidence_id}` 500 원인을 수정했다.
  - evidence metadata/locator를 SQLAlchemy class `metadata`가 아니라 `CandidateEvidence.metadata_`에서 읽도록 고쳤다.
- focused regression test를 보강했다.
  - valid dev auth external source `200`
  - valid dev auth external evidence `200`
  - missing dev auth `401`
  - source/evidence/graph write methods blocked or absent
  - concrete external envelope schemas preserve `auth_mode`, `project_id`, optional `published_graph_version_ref`, and `data`
- MVP4 scope를 확장하지 않았다.
  - eval artifact persistence, weighted composite score, SLA/collaboration, production vector DB/API keys를 추가하지 않았다.

## 변경 파일
- `apps/backend/app/modules/mvp4/service.py`
- `apps/backend/tests/test_mvp4_api.py`
- `docs/handoffs/wave-021/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && rm -f /tmp/ontology-wave21-backend-seed.db /tmp/ontology-wave21-backend-seed.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave21-backend-seed.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave21-backend-seed.db .venv/bin/python scripts/seed_mvp4.py --output /tmp/ontology-wave21-backend-seed.json && python3 -m json.tool /tmp/ontology-wave21-backend-seed.json >/tmp/ontology-wave21-backend-seed.pretty.json`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output /tmp/ontology-wave21-backend-openapi.json && python3 -m json.tool /tmp/ontology-wave21-backend-openapi.json >/tmp/ontology-wave21-backend-openapi.pretty.json`
  - `cd apps/backend && .venv/bin/python - <<'PY' ...` actual OpenAPI critical compare aligned to PM concrete-envelope decision
  - `git diff --check -- apps/backend/app/modules/mvp4/service.py apps/backend/tests/test_mvp4_api.py docs/handoffs/wave-021/BACKEND_REPORT.md`
  - `for file_path in apps/backend/app/modules/mvp4/service.py apps/backend/tests/test_mvp4_api.py docs/handoffs/wave-021/BACKEND_REPORT.md; do check_output=$(git diff --no-index --check /dev/null "$file_path" 2>&1 || true); if [ -n "$check_output" ]; then printf '%s\n' "$check_output"; exit 1; fi; done`
- 결과:
  - TDD RED 확인: 보강한 MVP4 focused test가 source external read에서 기존 `MetaData()` validation error로 실패함을 확인했다.
  - MVP4 focused tests: PASS, `5 passed in 1.78s`.
  - MVP3 backend regression: PASS, `4 passed in 1.41s`.
  - Ruff: PASS, `All checks passed!`.
  - Fresh SQLite Alembic upgrade: PASS.
  - `scripts/seed_mvp4.py` JSON parse: PASS, `/tmp/ontology-wave21-backend-seed.json`.
  - Actual OpenAPI export JSON parse: PASS, `/tmp/ontology-wave21-backend-openapi.json`.
  - Actual OpenAPI critical compare: PASS.
    - missing paths: `[]`
    - missing schemas: `[]`
    - enum mismatches: `{}`
    - external concrete envelope shape mismatches: `{}`
    - `ExternalApiEnvelopeBase` standalone actual component required: `false`
    - `ExternalApiEnvelopeBase` standalone actual component present: `false`
  - `git diff --check` / untracked `--no-index --check` wrapper: PASS, whitespace error 없음.
- 실행하지 못한 검증:
  - Docker/PostgreSQL Compose smoke는 기존 P1 environment follow-up이므로 실행하지 않았다.
  - Frontend actual smoke는 Frontend 에이전트 소유라 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세:
  - API path, enum literal, DTO field를 변경하지 않았다.
  - external source/evidence response body의 기존 DTO shape를 깨지 않고 ORM-to-API 매핑만 명시화했다.
  - actual OpenAPI compare는 PM decision대로 concrete envelope schemas 기준으로 수행했다.
- 영향받는 역할:
  - Frontend: DTO 변경 없음. 기존 concrete envelope shape를 그대로 사용하면 된다.
  - QA: source/evidence external read smoke를 valid `X-Dev-Auth: mvp4-dev`로 재실행하면 200을 기대할 수 있다.

## Blocker
- Backend blocker: 없음.
- 남은 Wave21 blocker는 Frontend/QA targeted smoke 결과에 따른다.

## 남은 TODO
- Backend TODO: 없음.
- QA TODO:
  - `INT4-001` concrete-envelope compare 기준으로 rerun.
  - `INT4-008` external graph/entity/relation/source/evidence/search/RAG smoke rerun.

## 다른 역할에 전달할 내용
- PM:
  - no scope expansion 유지.
  - concrete external envelope acceptance decision대로 Backend compare가 PASS했다.
- Backend:
  - source/evidence metadata collision은 `metadata_` 명시 매핑으로 닫았다.
- Frontend:
  - external source/evidence DTO shape 변경 없음.
- QA:
  - `GET /api/v1/external/sources/{source_id}`와 `GET /api/v1/external/evidence/{evidence_id}`는 valid dev auth에서 200을 반환하도록 focused test로 고정했다.
  - missing dev auth 401과 source/evidence write block도 focused test에 포함했다.

## 총괄에게 요청하는 결정
- 추가 결정 요청 없음.
- Backend 기준 Wave21 hardening은 QA targeted rerun으로 넘길 준비가 됐다.

## 현재 판정
- PASS
