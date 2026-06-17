# Backend Report - Wave 4

## 담당 범위
- backlog ID: `BE-010`, follow-up `BE-004`
- 작업 경로: `apps/backend/`, `docs/api/openapi-mvp1.json`

## 완료한 작업
- `OntologyGraph.classes[]`, `OntologyGraph.relations[]`를 OpenAPI에서 optional compatibility field로 조정.
- `OntologyGraph.classes[]`, `OntologyGraph.relations[]`에 `deprecated: true`와 compatibility description 추가.
- canonical graph payload required field는 `nodes[]`, `edges[]`, `properties[]`로 유지.
- `docs/api/openapi-mvp1.json` 재생성.
- OpenAPI freshness check 수행: export JSON이 현재 `app.openapi()`와 일치함을 확인.
- Source API/OpenAPI export가 깨지지 않았는지 Source path/schema 및 pytest smoke로 확인.
- 제한 준수:
  - candidate/review/publish API 추가 없음.
  - `SourceStatus` delete/archive enum 추가 없음.

## 변경 파일
- `apps/backend/app/modules/ontology/schemas.py`
- `apps/backend/tests/test_project_ontology_api.py`
- `docs/api/openapi-mvp1.json`
- `docs/handoffs/wave-004/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `python3 -m compileall apps/backend/app apps/backend/scripts apps/backend/tests`
  - `.venv/bin/python scripts/export_openapi.py --output ../../docs/api/openapi-mvp1.json`
  - `.venv/bin/ruff check .`
  - `.venv/bin/pytest`
  - OpenAPI contract check:
    - `OntologyGraph.required`
    - `classes.deprecated`
    - `relations.deprecated`
    - Source API path presence
    - `SourceStatus` enum values
  - OpenAPI freshness check:
    - exported `docs/api/openapi-mvp1.json` equals current `app.openapi()`
- 결과:
  - compileall 통과
  - OpenAPI export 재생성 완료
  - ruff 통과
  - pytest `5 passed`
  - `OntologyGraph.required = ['version_id', 'version_status', 'nodes', 'edges', 'properties']`
  - `classes_deprecated=True`, `relations_deprecated=True`
  - Source API required paths missing `[]`
  - `SourceStatus` enum unchanged: `UPLOADED`, `PARSING`, `PARSED`, `PROFILED`, `EXTRACTION_READY`, `FAILED`
  - OpenAPI freshness check 통과
- 실행하지 못한 검증:
  - Docker/Compose 검증은 이번 작업 범위가 아니며 수행하지 않음.

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
  - `OntologyGraph.classes`:
    - required에서 제거
    - `deprecated: true`
    - nullable optional compatibility field
  - `OntologyGraph.relations`:
    - required에서 제거
    - `deprecated: true`
    - nullable optional compatibility field
  - canonical required graph payload:
    - `nodes`
    - `edges`
    - `properties`
  - enum 변경 없음.
  - 신규 endpoint 없음.
- 영향받는 역할:
  - Frontend: `OntologyGraph`는 `nodes`, `edges`, `properties`만 canonical required로 취급. `classes`, `relations`는 사용하지 않거나 optional compatibility로만 처리.
  - QA: INT-003에서 `docs/api/openapi-mvp1.json`의 `OntologyGraph.required`와 deprecated marker를 기준으로 재검증 가능.

## Blocker
- 없음.

## 남은 TODO
- QA가 `docs/api/openapi-mvp1.json` 기준으로 INT-002/INT-003 contract review 재실행.
- Frontend가 optional/deprecated compatibility fields를 API 타입에 반영.

## 다른 역할에 전달할 내용
- PM:
  - 총괄 결정대로 graph compatibility field cleanup 완료.
- Backend:
  - 후속 Backend 작업에서 `OntologyGraph.classes`/`relations`를 다시 required로 만들지 말 것.
- Frontend:
  - `OntologyGraph.nodes`, `edges`, `properties`만 required canonical field로 사용.
  - `classes`, `relations`는 deprecated optional field로 처리.
- QA:
  - OpenAPI freshness check 통과.
  - Source API smoke는 pytest에 포함되어 `5 passed`로 확인됨.
  - `SourceStatus` enum에 delete/archive 값은 추가되지 않음.

## 총괄에게 요청하는 결정
- 없음.

## 현재 판정
- PASS
