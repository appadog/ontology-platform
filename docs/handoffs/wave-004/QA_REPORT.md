# QA Report - Wave 4

## 담당 범위
- backlog ID:
  - `INT-002`
  - `INT-003`
  - `INT-001`
- 작업 경로:
  - `docs/api/openapi-mvp1.json`
  - `apps/frontend/src/shared/api/types.ts`
  - `apps/frontend/src/shared/api/client.ts`
  - `apps/frontend/src/shared/mocks/fixtures.ts`
  - `docs/handoffs/wave-004/PM_REPORT.md`
  - `docs/handoffs/wave-004/BACKEND_REPORT.md`
  - `docs/handoffs/wave-004/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-004/QA_REPORT.md`

## 완료한 작업
- 작업 시작 전 `.agents/skills/handoff-reporting/SKILL.md`를 확인했다.
- `docs/handoffs/wave-003/NEXT_ORDERS.md`의 Wave 4 QA 지시를 기준으로 검증했다.
- 선행 보고서 3건을 먼저 읽고 기준을 확정했다.
  - `docs/handoffs/wave-004/PM_REPORT.md`
  - `docs/handoffs/wave-004/BACKEND_REPORT.md`
  - `docs/handoffs/wave-004/FRONTEND_REPORT.md`
- `docs/api/openapi-mvp1.json` 기준으로 FE `types.ts`, `client.ts`, `fixtures.ts` contract review를 재실행했다.
- Wave 3 mismatch 해결 여부를 집중 검증했다.
  - `OntologyVersionSummary` 제거 확인.
  - `Cardinality` full enum 동기화 확인.
  - nullable DTO 필드 반영 확인.
  - `OntologyGraph.classes[]`, `relations[]`가 OpenAPI에서 required 제거 및 deprecated compatibility field인 것 확인.
- Backend API INT-001 full flow를 재실행했다.
  - `/health`
  - `/api/v1/me`
  - project create/list/detail
  - ontology draft version 생성
  - class/property/relation 생성
  - graph 조회
  - CSV/Excel upload 및 preview `READY`
  - TXT/PDF upload 및 preview `NOT_AVAILABLE`
- 실제 FastAPI HTTP 서버를 띄워 Source API 실제 HTTP smoke를 재검증했다.
  - CSV/Excel `READY`
  - TXT/PDF `NOT_AVAILABLE`
  - source list/detail/preview 확인
- `VITE_USE_MOCK_API=false`로 Vite dev server를 띄우고 실제 project/source ID 기반 route shell smoke를 수행했다.
- Docker Compose 검증 가능 여부를 확인했다.
- Browser interaction smoke 가능 여부를 확인했다.

## 변경 파일
- `docs/handoffs/wave-004/QA_REPORT.md`
  - Wave 4 QA 검증 결과 작성.
- 구현 파일 변경 없음.

## 실행/검증
- 실행한 명령:
  - `sed -n '1,220p' .agents/skills/handoff-reporting/SKILL.md`
  - `sed -n '1,260p' docs/handoffs/wave-003/NEXT_ORDERS.md`
  - `sed -n '1,260p' docs/handoffs/wave-004/PM_REPORT.md`
  - `sed -n '1,260p' docs/handoffs/wave-004/BACKEND_REPORT.md`
  - `sed -n '1,260p' docs/handoffs/wave-004/FRONTEND_REPORT.md`
  - `python3` OpenAPI schema inspection for `OntologyGraph`, `OntologyVersion`, `Cardinality`, `SourceStatus`, nullable DTO fields
  - `rg -n "OntologyVersionSummary|export interface OntologyVersion|export type Cardinality|description|mime_type|classes\\?|relations\\?" apps/frontend/src/shared/api/types.ts`
  - `python3` enum comparison: OpenAPI enum vs FE TypeScript union
  - `python3` required endpoint presence check against OpenAPI paths
  - `.venv/bin/pytest -q`
  - `npm run build`
  - `.venv/bin/python` OpenAPI freshness check against `app.openapi()`
  - `.venv/bin/python` Backend `TestClient` INT-001 full flow smoke
  - `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-qa-wave4-api.db LOCAL_STORAGE_PATH=/private/tmp/ontology-platform-qa-wave4-api-storage .venv/bin/python -c "from app.db.base import Base; from app.db.session import engine; Base.metadata.create_all(bind=engine); print('created')"`
  - `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-qa-wave4-api.db LOCAL_STORAGE_PATH=/private/tmp/ontology-platform-qa-wave4-api-storage .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8011`
  - `.venv/bin/python` actual HTTP Source API smoke against `http://127.0.0.1:8011`
  - `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8011 npm run dev -- --host 127.0.0.1 --port 5175`
  - `curl` route shell checks against `http://127.0.0.1:5175`
  - `docker --version`
- 결과:
  - Backend tests: PASS, `5 passed`.
  - Frontend build: PASS.
  - OpenAPI freshness: PASS, `docs/api/openapi-mvp1.json` equals current `app.openapi()`.
  - INT-002 enum sync:
    - `ProjectStatus`: PASS
    - `OntologyVersionStatus`: PASS
    - `OntologyElementStatus`: PASS
    - `Cardinality`: PASS, `ONE_TO_ONE`, `ONE_TO_MANY`, `MANY_TO_ONE`, `MANY_TO_MANY`, `OPTIONAL`, `REQUIRED`, `MULTIPLE`
    - `SourceType`: PASS
    - `SourceStatus`: PASS, delete/archive 값 없음
    - `SourcePreviewStatus`: PASS
  - Wave 3 mismatch 재검증:
    - `OntologyVersionSummary`: PASS, FE 타입에 남아 있지 않음.
    - relation/edge cardinality: PASS, FE `OntologyRelation.cardinality`와 `OntologyGraphEdge.cardinality`가 full `Cardinality`를 사용.
    - nullable DTO 필드: PASS.
      - `ProjectSummary.description: string | null`
      - `ProjectDetail.description: string | null`
      - `OntologyClass.description: string | null`
      - `OntologyRelation.description: string | null`
      - `SourceData.mime_type: string | null`
    - `OntologyGraph.classes[]`, `relations[]` OpenAPI cleanup: PASS.
      - OpenAPI `required = ['version_id', 'version_status', 'nodes', 'edges', 'properties']`
      - `classes.deprecated = true`
      - `relations.deprecated = true`
  - Backend API INT-001 full flow: PASS.
    - graph summary: nodes 2, edges 1, properties 1
    - preview summary: `CSV=READY`, `EXCEL=READY`, `TXT=NOT_AVAILABLE`, `PDF=NOT_AVAILABLE`
  - Actual HTTP Source API smoke: PASS.
    - actual HTTP project id: `dd484a8a-c115-42cc-ac6f-4a13b69576c0`
    - source statuses: `CSV=READY`, `EXCEL=READY`, `TXT=NOT_AVAILABLE`, `PDF=NOT_AVAILABLE`
  - Frontend API mode route shell smoke: PASS for checked routes.
    - `/`: 200
    - `/projects/dd484a8a-c115-42cc-ac6f-4a13b69576c0`: 200
    - `/projects/dd484a8a-c115-42cc-ac6f-4a13b69576c0/ontology`: 200
    - `/projects/dd484a8a-c115-42cc-ac6f-4a13b69576c0/sources`: 200
    - `/projects/dd484a8a-c115-42cc-ac6f-4a13b69576c0/sources/2e5f3355-f266-477d-8d79-32f8f40bc4f8`: 200
    - `/projects/dd484a8a-c115-42cc-ac6f-4a13b69576c0/sources/9c679301-a9de-470f-b78a-062c3de10ae5`: 200
    - `/sources/2e5f3355-f266-477d-8d79-32f8f40bc4f8`: 200
    - `/sources/9c679301-a9de-470f-b78a-062c3de10ae5`: 200
  - Contract findings:
    - `apps/frontend/src/shared/api/types.ts` still has `OntologyGraph.classes?: OntologyClass[]` and `relations?: OntologyRelation[]`, while OpenAPI allows `array | null` for both compatibility fields.
    - FE `client.ts` calls `/api/v1/dashboard`, but backend OpenAPI does not expose `/api/v1/dashboard`; actual HTTP returned 404.
    - FE `client.ts` does not yet expose ontology authoring mutation wrappers for draft version creation and class/property/relation create/update/delete, although backend OpenAPI has these endpoints.
- 실행하지 못한 검증:
  - Browser interaction smoke는 수행하지 못했다.
    - 현재 세션에 호출 가능한 in-app Browser/Playwright 도구가 노출되어 있지 않다.
    - `apps/frontend` 의존성에도 Playwright/Cypress가 없다.
    - 따라서 클릭 기반 Source upload UI, CSV/Excel preview table 렌더링, TXT/PDF NOT_AVAILABLE notice 시각 검증은 미수행.
  - Docker Compose 검증은 수행하지 못했다.
    - `docker --version` 결과: `zsh:1: command not found: docker`

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - QA는 구현/API 파일을 변경하지 않았다.
  - 검증 결과 `INT-002` enum sync는 PASS.
  - `INT-003` contract review에는 잔여 mismatch가 있다.
    - `FE-009`, `INT-003`: `OntologyGraph.classes`/`relations` FE 타입이 OpenAPI nullable compatibility field를 완전히 반영하지 않음. 기대 타입은 `OntologyClass[] | null`, `OntologyRelation[] | null`.
    - `FE-009`, `FE-008`, `INT-003`: FE `client.ts`의 `/api/v1/dashboard` 호출이 canonical OpenAPI에 없음. 실제 backend HTTP도 404.
    - `FE-005`, `FE-009`, `INT-001`, `INT-003`: FE API boundary에 ontology draft/class/property/relation mutation wrapper가 아직 없음. Backend API는 존재하고 Backend full flow는 통과.
- 영향받는 역할:
  - PM: `/api/v1/dashboard`를 MVP 1 actual API mode에서 제거할지, backend endpoint로 추가할지 결정 필요.
  - Backend: 현재 Backend/OpenAPI 기준은 PASS. 단, PM이 dashboard endpoint를 실제 API로 승인하면 BE backlog 연결 필요.
  - Frontend: FE-009 contract precision 보완 필요. FE-005 ontology authoring API boundary 보완 필요.
  - QA: Browser interaction tool이 준비되면 Source upload/preview 실제 UI 클릭 smoke 재수행 필요.

## Blocker
- `INT-001` full product demo PASS blocker:
  - `FE-005`, `FE-009`, `INT-001`: Frontend actual API mode에서 ontology draft/class/property/relation 작성 흐름이 아직 완전 검증되지 않음.
  - `INT-001`: Browser interaction smoke 미수행. 현재 세션에 호출 가능한 browser automation tool이 없고 Playwright/Cypress 의존성도 없음.
- `INT-003` contract blocker:
  - `FE-009`, `FE-008`, `INT-003`: FE `/api/v1/dashboard` call vs OpenAPI/backend missing API.
  - `FE-009`, `INT-003`: `OntologyGraph.classes`/`relations` nullable compatibility field 타입 정밀도 잔여.
- Infra blocker:
  - Docker CLI 없음. Docker Compose 검증 불가.

## 남은 TODO
- Frontend:
  - `OntologyGraph.classes?: OntologyClass[] | null`, `relations?: OntologyRelation[] | null`로 nullable compatibility field 반영.
  - `/api/v1/dashboard` 호출 처리 결정 반영.
    - Option A: actual API mode에서 P0 API 조합으로 dashboard summary 계산.
    - Option B: Backend가 `/api/v1/dashboard`를 OpenAPI에 추가한 뒤 FE가 유지.
  - ontology draft version 생성, class/property/relation 생성/수정/삭제 API wrapper와 실제 UI action 연결.
  - Browser 환경에서 Source upload UI 클릭, CSV/Excel preview table, TXT/PDF NOT_AVAILABLE notice 재검증.
- PM:
  - Dashboard actual API 처리 방향 결정.
  - `INT-001` full pass에 Browser click smoke까지 요구할지, route shell + API smoke로 충분한지 기준 명확화.
- Backend:
  - 현재 추가 TODO 없음. Dashboard endpoint를 PM이 요구할 경우 별도 BE backlog로 처리.
- QA:
  - 위 FE/PM 결정 반영 후 INT-001/INT-003 재검증.

## 다른 역할에 전달할 내용
- PM:
  - `INT-002`: PASS.
  - `INT-003`: PARTIAL. enum/주요 nullable은 맞지만 dashboard missing API와 graph compatibility nullable 타입 정밀도 잔여.
  - `INT-001`: PARTIAL. Backend API full flow와 실제 HTTP Source flow는 PASS지만, browser interaction과 FE ontology authoring actual UI/API flow는 미검증.
  - `/api/v1/dashboard`는 API priority 문서에서 P1이며 P0 API 결과로 대체 가능하다고 되어 있는데 FE actual API client는 직접 호출한다. 제거/대체/추가 중 결정 필요.
- Backend:
  - OpenAPI freshness PASS.
  - `OntologyGraph.classes[]`, `relations[]` optional/deprecated cleanup PASS.
  - Source API CSV/Excel/TXT/PDF actual HTTP smoke PASS.
  - Docker Compose는 Docker CLI 부재로 여전히 미검증.
- Frontend:
  - Wave 3 핵심 enum/DTO mismatch 대부분 해소 확인.
  - `OntologyGraph.classes`/`relations` 타입에 `null` 허용을 추가해야 OpenAPI와 완전히 일치한다.
  - `/api/v1/dashboard`는 현재 backend/OpenAPI missing API라 actual API mode dashboard가 error state가 될 수 있다.
  - Source list/detail route shell과 실제 backend Source API는 통과했지만, browser click upload/preview는 별도 환경에서 재검증 필요.
  - ontology authoring mutation API boundary는 `FE-005`/`FE-009` 후속으로 남는다.
- QA:
  - 다음 재검증 시 Browser automation 가능 여부부터 확인.
  - Docker CLI가 설치되면 compose 검증을 별도 gate로 수행.

## 총괄에게 요청하는 결정
- `/api/v1/dashboard`를 MVP 1 actual API contract에 포함할지 결정 필요.
  - 포함한다면 Backend/OpenAPI에 추가하고 `BE-010`, `FE-008`, `FE-009`, `INT-003`로 추적.
  - 제외한다면 Frontend actual API mode에서 dashboard query를 P0 API 조합 또는 mock-only로 분리하고 `FE-008`, `FE-009`, `INT-003`로 추적.
- `INT-001 full pass` 기준에 browser click smoke를 필수로 둘지 결정 필요.
  - 현재 QA 기준에서는 Backend full API와 actual HTTP Source smoke는 PASS지만, browser interaction 미수행이므로 overall은 PARTIAL로 판정했다.

## 현재 판정
- Overall: PARTIAL
- `INT-002`: PASS
- `INT-003`: PARTIAL
- `INT-001`: PARTIAL
