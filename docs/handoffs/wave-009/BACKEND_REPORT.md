# Backend Report - Wave 9

## 담당 범위
- backlog ID: BE-004, BE-005, support INT2-002, support INT2-003
- 작업 경로: `apps/backend/`, `docs/api/openapi-mvp2-draft.json`, `docs/handoffs/wave-009/BACKEND_REPORT.md`

## 완료한 작업
- PM Wave 9 decision 기준으로 class soft delete를 cascade soft delete로 보강했다.
- `DELETE /api/v1/ontology/classes/{class_id}` 수행 시 같은 draft version의 직접 소유 property와 domain/range에 연결된 relation을 함께 `DELETED` 처리한다.
- `GET /api/v1/ontology/versions/{version_id}/graph`의 `properties[]`, `edges[]`, compatibility `classes[]`, `relations[]`가 active class 집합만 기준으로 내려가도록 read-path 방어 필터를 보강했다.
- ontology property/relation list API도 deleted class에 연결된 orphan element를 노출하지 않도록 active class 기준 필터를 적용했다.
- extraction mock candidate generation 입력에서 deleted class/relation이 제외되도록 `_classes_for_version`, `_relations_for_version` 필터를 보강했다.
- property는 현재 extraction mock input으로 직접 전달되지 않음을 확인했고, graph/list read-path에서 deleted class-owned property가 제외되도록 보강했다.
- 회귀 테스트를 추가했다.
  - class delete 후 graph `properties[]` orphan 없음
  - class delete 후 graph/list connected relation 없음
  - extraction raw_request/candidate generation input에서 deleted class/relation 제외

## 변경 파일
- `apps/backend/app/modules/ontology/router.py`
- `apps/backend/app/modules/extraction/router.py`
- `apps/backend/tests/test_project_ontology_api.py`
- `docs/handoffs/wave-009/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_project_ontology_api.py -k "class_delete or deleted_ontology"`
  - `cd apps/backend && .venv/bin/ruff format app/modules/ontology/router.py app/modules/extraction/router.py tests/test_project_ontology_api.py`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && .venv/bin/pytest`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py`
  - `cd apps/backend && tmpfile=$(mktemp /private/tmp/openapi-mvp2-wave9.XXXXXX); .venv/bin/python scripts/export_openapi.py --output "$tmpfile" && cmp -s "$tmpfile" ../../docs/api/openapi-mvp2-draft.json`
  - `git diff --check -- apps/backend docs/api/openapi-mvp2-draft.json`
- 결과:
  - TDD RED 확인: 신규 회귀 테스트 2건이 기존 코드에서 실패했다.
  - 신규 회귀 테스트 GREEN: `2 passed, 7 deselected`
  - Ruff format: `3 files left unchanged`
  - Ruff check: `All checks passed!`
  - Backend regression: `9 passed in 0.98s`
  - OpenAPI MVP2 draft freshness: `OPENAPI_MVP2_DRAFT_FRESH`
  - diff whitespace check: PASS
- 실행하지 못한 검증:
  - 없음. Docker/FE browser smoke는 이번 Backend Wave 9 범위가 아니어서 수행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - 신규 endpoint, enum, DTO/schema 추가 없음.
  - `docs/api/openapi-mvp2-draft.json`은 재생성했고 현재 backend export와 일치한다.
  - `SourceParseResponse`, `GET /api/v1/extraction-jobs/{job_id}` `model_runs[]`, provider literal `mock` 계약 변경 없음.
- 영향받는 역할:
  - Frontend/QA는 기존 OpenAPI 계약 그대로 사용 가능.

## Blocker
- 없음.
- 참고: 작업 시작 시 frontend/PM docs/handoff 쪽 미커밋 변경이 이미 존재했으며, Backend 범위 밖이라 수정하지 않았다.

## 남은 TODO
- 없음.
- 후속 wave에서 property-level extraction input을 새로 열 경우 deleted class-owned property 제외 기준을 동일하게 적용해야 한다.

## 다른 역할에 전달할 내용
- PM: PM Wave 9 decision의 cascade soft delete 기준을 backend에 반영했다. physical delete는 사용하지 않았다.
- Backend: ontology graph/list/extraction input 모두 active class 집합을 기준으로 deleted class 연결 요소를 방어 필터링한다.
- Frontend: class delete 후 graph `properties[]`/`edges[]`/compat fields에서 deleted class 연결 요소가 내려오지 않는다. 별도 API 계약 변경은 없다.
- QA: 신규 회귀 케이스는 `tests/test_project_ontology_api.py`에 포함됐다. 전체 backend pytest와 OpenAPI freshness가 PASS다.

## 총괄에게 요청하는 결정
- 없음.

## 현재 판정
- PASS
