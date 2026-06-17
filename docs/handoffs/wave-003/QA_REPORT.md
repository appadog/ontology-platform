# QA Report - Wave 3

## 담당 범위
- backlog ID:
  - `INT-002`
  - `INT-003`
  - 부분 `INT-001`
- 작업 경로:
  - `docs/handoffs/wave-003/PM_REPORT.md`
  - `docs/handoffs/wave-003/BACKEND_REPORT.md`
  - `docs/handoffs/wave-003/FRONTEND_REPORT.md`
  - `docs/api/openapi-mvp1.json`
  - `apps/backend`
  - `apps/frontend`

## 완료한 작업
- 작업 시작 전 `.agents/skills/handoff-reporting/SKILL.md`를 다시 확인했다.
- wave-003 `PM_REPORT.md`, `BACKEND_REPORT.md`, `FRONTEND_REPORT.md`를 읽고 각 역할의 API/Enum/DTO 변경 내용을 확인했다.
- `docs/api/openapi-mvp1.json`을 INT-002/INT-003 기준 artifact로 사용해 Backend OpenAPI와 Frontend `shared/api/types.ts`, `shared/api/client.ts`, `shared/mocks/fixtures.ts`를 대조했다.
- Backend Project/Ontology/Source API smoke를 재실행했다.
- Frontend build와 project-scoped route smoke를 재실행했다.
- 가능한 범위에서 INT-001 full demo flow를 재검증했다.
  - Backend API full flow: 통과
  - Frontend mock route/build flow: 통과
  - Browser interaction 및 FE 실제 API 연결 E2E: 미수행
- 실패/잔여 항목을 `BE-*`, `FE-*`, `PM-*`, `INT-*` ID에 연결해 기록했다.

## 변경 파일
- `docs/handoffs/wave-003/QA_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `sed -n '1,220p' .agents/skills/handoff-reporting/SKILL.md`
  - `sed -n '1,320p' docs/handoffs/wave-003/PM_REPORT.md`
  - `sed -n '1,360p' docs/handoffs/wave-003/BACKEND_REPORT.md`
  - `sed -n '1,360p' docs/handoffs/wave-003/FRONTEND_REPORT.md`
  - `test -f docs/api/openapi-mvp1.json`
  - `.venv/bin/pytest -q` in `apps/backend`
  - `npm run build` in `apps/frontend`
  - `python3` OpenAPI path/schema/enum extraction against `docs/api/openapi-mvp1.json`
  - `.venv/bin/python` Backend TestClient INT-001 full API flow in `apps/backend`
  - `.venv/bin/python apps/backend/scripts/export_openapi.py --output /private/tmp/openapi-qa-current.json`
  - `python3` compare `/private/tmp/openapi-qa-current.json` with `docs/api/openapi-mvp1.json`
  - `npm run preview -- --port 4173` in `apps/frontend`
  - `curl` route smoke:
    - `/projects`
    - `/projects/project-corp-knowledge`
    - `/projects/project-corp-knowledge/ontology`
    - `/projects/project-corp-knowledge/sources`
    - `/projects/project-corp-knowledge/sources/source-policy-csv`
    - `/projects/project-corp-knowledge/sources/source-handbook-pdf`
  - `docker --version`
- 결과:
  - Backend tests: `4 passed in 0.70s`
  - Frontend build: 성공
  - Frontend project-scoped route smoke: all `200`
  - OpenAPI export freshness: `openapi_export_matches_committed=True`
  - Backend INT-001 full API flow:
    - health `200`
    - dev roles: `PROJECT_ADMIN`, `ONTOLOGY_MANAGER`, `DATA_MANAGER`, `VIEWER`
    - project `ACTIVE`
    - ontology version `DRAFT`
    - graph `5` class nodes, `4` relation edges, `1` property
    - CSV upload `status=UPLOADED`, `preview_status=READY`
    - CSV preview rows `2`, columns `company_name`, `department`
    - PDF upload `status=UPLOADED`, `preview_status=NOT_AVAILABLE`
    - PDF preview rows `0`
  - Backend OpenAPI required Source paths: present
  - Backend OpenAPI Source schemas: present
  - Backend OpenAPI vs FE client endpoint strings: matched for Project, Ontology graph/version, Source list/upload/detail/preview
  - Checked enum values matched between OpenAPI and FE for:
    - `SourceStatus`
    - `SourcePreviewStatus`
    - `SourceType`
    - `OntologyElementStatus`
    - `OntologyVersionStatus`
    - `PropertyDataType`
  - `Cardinality` has a remaining FE type mismatch for relation/edge cardinality. See Blocker/Finding.
- 실행하지 못한 검증:
  - Browser-rendered interaction smoke was not run because no callable browser tool is available in this session.
  - Actual frontend-to-backend browser E2E with `VITE_USE_MOCK_API=false` was not run.
  - Docker Compose/local infra smoke was not run because Docker CLI is unavailable: `docker: command not found`.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - QA는 API/Enum/DTO 구현 파일을 변경하지 않았다.
  - PM report 기준 `docs/api/openapi-mvp1.json`이 MVP 1 canonical OpenAPI export로 확정되어 있으며, QA도 이 파일을 기준으로 contract review를 수행했다.
  - Backend Source API/DTO가 OpenAPI에 노출되어 있다.
  - `SourceStatus`와 `SourcePreviewStatus`는 Backend OpenAPI와 Frontend type/mock에서 분리되어 있다.
  - `OntologyGraph` canonical field `nodes[]`, `edges[]`, `properties[]`는 Backend OpenAPI와 Frontend type/modeler에서 사용된다.
  - Backend OpenAPI의 `OntologyGraph.classes[]`, `relations[]`는 여전히 required compatibility field로 남아 있다. PM report가 caveat로 인정했으나 generated client에는 영향을 줄 수 있다.
- 영향받는 역할:
  - Backend: `BE-010`
  - Frontend: `FE-005`, `FE-009`
  - PM: `PM-005`, `PM-007`
  - Integration: `INT-002`, `INT-003`

## Blocker
- `FE-009`, `INT-003`: Frontend `OntologyVersionSummary`가 Backend `OntologyVersion`과 다르다.
  - Backend OpenAPI `OntologyVersion`: `id`, `project_id`, `version`, `status`, `created_at`, `published_at`, `created_by`.
  - Frontend `OntologyVersionSummary`: `id`, `project_id`, `name`, `status`, `created_at`, `updated_at`.
  - 현재 FE `apiClient.listOntologyVersions()`는 실제 API 응답을 별도 변환 없이 `OntologyVersionSummary[]`로 캐스팅하므로, `VITE_USE_MOCK_API=false` 실제 연결 시 `name`/`updated_at`이 undefined가 된다.
- `FE-009`, `INT-002`, `INT-003`: Frontend `OntologyRelation.cardinality`와 `OntologyGraphEdge.cardinality`가 Backend `Cardinality` enum보다 좁다.
  - Backend/OpenAPI `Cardinality`: `ONE_TO_ONE`, `ONE_TO_MANY`, `MANY_TO_ONE`, `MANY_TO_MANY`, `OPTIONAL`, `REQUIRED`, `MULTIPLE`.
  - FE relation/edge cardinality: `ONE_TO_ONE`, `ONE_TO_MANY`, `MANY_TO_ONE`, `MANY_TO_MANY`.
  - API 문서는 relation/edge cardinality도 `Cardinality` source를 사용한다고 명시하므로 FE type을 넓히거나 PM이 relation-only enum을 별도 결정해야 한다.
- `FE-009`, `INT-003`: Nullable field precision mismatch가 남아 있다.
  - Backend `ProjectSummary.description`, `ProjectDetail.description`, `OntologyClass.description`, `OntologyRelation.description`, `SourceData.mime_type` are nullable.
  - FE types currently use plain `string` for these fields.
  - Build는 통과하지만 실제 API 연결 시 null rendering/controlled input edge case가 생길 수 있다.
- `BE-010`, `INT-003`: `OntologyGraph.classes[]`, `relations[]` are required in `docs/api/openapi-mvp1.json`.
  - PM contract says these are compatibility fields and not QA canonical fields.
  - Generated clients may still treat them as mandatory unless Backend marks them optional/deprecated.
- `BE-002`: Docker CLI unavailable, so local compose validation remains blocked.

## 남은 TODO
- Frontend:
  - Align `OntologyVersionSummary` with Backend `OntologyVersion`, or add explicit API-boundary mapping from `OntologyVersion` to a FE view model.
  - Widen FE relation/edge cardinality to full `Cardinality` or request PM decision for a separate relation cardinality enum.
  - Update nullable DTO fields in FE types and UI rendering.
  - Run real API mode smoke after Backend server is available: `VITE_USE_MOCK_API=false`.
- Backend:
  - Consider making `OntologyGraph.classes[]` and `relations[]` optional/deprecated in OpenAPI if they are compatibility fields.
  - Keep `docs/api/openapi-mvp1.json` regenerated after API changes.
- PM:
  - Decide whether relation cardinality should use full `Cardinality` enum or a narrower relation-only enum.
  - Confirm whether `OntologyGraph.classes[]`/`relations[]` cleanup is required before MVP 1 acceptance or can remain a documented compatibility caveat.
- QA:
  - Re-run INT-002/INT-003 after FE type corrections.
  - Re-run INT-001 browser-level flow when browser tooling or a UI test harness is available.

## 다른 역할에 전달할 내용
- PM:
  - `BE-010` artifact decision is usable: `docs/api/openapi-mvp1.json` exists and matches current backend export.
  - Need decision on relation cardinality enum scope.
  - Need decision on whether required `classes[]`/`relations[]` in OpenAPI is acceptable for MVP 1.
- Backend:
  - Backend API smoke and OpenAPI freshness passed.
  - Remaining Backend-facing issue is `OntologyGraph.classes[]`/`relations[]` required compatibility fields in OpenAPI.
- Frontend:
  - Build and scoped route smoke now pass.
  - Please fix `OntologyVersionSummary` vs `OntologyVersion`, cardinality enum narrowing, and nullable DTO precision before claiming INT-003 clean pass.
  - Source upload UI exists and route smoke passes; actual backend mode smoke is still pending.
- QA:
  - Treat backend INT-001 API path as pass.
  - Treat frontend mock route/build path as pass.
  - Treat full INT-001 product demo as partial until browser interaction and actual FE-to-BE mode are tested.

## 총괄에게 요청하는 결정
- Should `OntologyGraph.classes[]` and `relations[]` be made optional/deprecated in Backend OpenAPI during wave-004?
- Should relation/edge cardinality use full `Cardinality` enum in FE, or should PM define a narrower `RelationCardinality`?
- Is `VITE_USE_MOCK_API=false` actual API smoke required before INT-001 can pass, or is Backend API full flow plus FE mock route smoke enough for the current gate?

## 현재 판정
- `PARTIAL`
  - Backend Project/Ontology/Source API smoke: `PASS`
  - Backend OpenAPI export freshness: `PASS`
  - Frontend build and project-scoped route smoke: `PASS`
  - INT-002 enum sync: `PARTIAL`
    - P0 source/status/type enums pass.
    - Cardinality mismatch remains in FE relation/edge types.
  - INT-003 contract review: `PARTIAL`
    - OpenAPI/FE endpoints and Source DTO shape mostly pass.
    - `OntologyVersionSummary`, nullable fields, relation cardinality, and graph compatibility required fields remain.
  - INT-001 full demo flow: `PARTIAL`
    - Backend API full demo flow passes.
    - Frontend mock route/build flow passes.
    - Actual browser interaction and actual FE-to-BE mode not verified.
