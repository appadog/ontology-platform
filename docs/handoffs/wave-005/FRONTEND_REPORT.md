# Frontend Report - Wave 5

## 담당 범위
- backlog ID: FE-008, FE-009, FE-014, INT-001 지원
- 작업 경로: `apps/frontend`, `docs/handoffs/wave-005/FRONTEND_REPORT.md`

## 완료한 작업
- actual API mode에서 `/api/v1/dashboard`를 호출하지 않도록 제거했다.
  - `apiClient.getDashboardSummary()`는 실제 모드에서 `/api/v1/projects`, `/api/v1/projects/{project_id}/sources`, `/api/v1/projects/{project_id}/ontology/versions`, `/api/v1/ontology/versions/{version_id}/graph`를 조합해 `DashboardSummary`를 계산한다.
  - mock mode도 동일한 summary 계산 helper를 사용하도록 정리했다.
- `OntologyGraph` compatibility field 타입을 OpenAPI와 맞췄다.
  - `classes?: OntologyClass[] | null`
  - `relations?: OntologyRelation[] | null`
- Ontology authoring actual API boundary를 추가했다.
  - `createOntologyVersion(projectId, payload)`
  - `createOntologyClass(versionId, payload)`
  - `createOntologyProperty(versionId, payload)`
  - `createOntologyRelation(versionId, payload)`
- TanStack Query mutation hook을 추가했다.
  - `useCreateOntologyVersion`
  - `useCreateOntologyClass`
  - `useCreateOntologyProperty`
  - `useCreateOntologyRelation`
- Ontology Modeler에 MVP 1 closeout용 최소 authoring UI action을 연결했다.
  - draft version이 없을 때 `Create Draft Version`
  - draft graph에서 class/property/relation 생성 form
  - graph empty 상태에서도 class 생성 action 접근 가능
  - published/archived version은 read-only notice 표시
- `HanaCard`가 `className`을 forward하도록 수정해 `styled(HanaCard)` 스타일이 실제 DOM에 적용되게 했다.
- Dashboard loading/dev notice copy를 mock-only 표현에서 P0 API 조합 표현으로 정리했다.

## 변경 파일
- `apps/frontend/src/pages/DashboardPage.tsx`
- `apps/frontend/src/pages/OntologyModelerPage.tsx`
- `apps/frontend/src/shared/api/client.ts`
- `apps/frontend/src/shared/api/queries.ts`
- `apps/frontend/src/shared/api/types.ts`
- `apps/frontend/src/shared/ui/hana/HanaCard.tsx`
- `docs/handoffs/wave-005/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `npm run build`
  - `git diff --check`
  - `rg -n "/api/v1/dashboard" apps/frontend/src apps/frontend/dist docs/api/openapi-mvp1.json`
  - `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-api-smoke-wave5.db LOCAL_STORAGE_PATH=/private/tmp/ontology-platform-api-smoke-wave5-storage .venv/bin/python -c "from app.db.base import Base; from app.db.session import engine; Base.metadata.create_all(bind=engine)"`
  - `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-api-smoke-wave5.db LOCAL_STORAGE_PATH=/private/tmp/ontology-platform-api-smoke-wave5-storage .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8011`
  - `node --input-type=module -e "...MVP 1 P0 actual API smoke..."`
  - `node -e "import('playwright').then(()=>console.log('playwright available')).catch(()=>console.log('playwright not installed'))"`
  - `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8011 npm run dev -- --host 127.0.0.1 --port 5175`
  - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5175/dashboard`
  - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5175/projects`
  - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5175/projects/692ddb4b-0c45-4efb-8b0d-4092a2c7d05b/ontology`
  - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5175/projects/692ddb4b-0c45-4efb-8b0d-4092a2c7d05b/sources`
- 결과:
  - `npm run build`: PASS
  - `git diff --check`: PASS
  - `/api/v1/dashboard` 문자열 검색: source/dist/OpenAPI 모두 no match
  - direct backend `/api/v1/dashboard`: 404 확인. Backend 계약상 expected이며 FE는 더 이상 호출하지 않음.
  - actual API P0 smoke: PASS
    - project 생성 성공
    - ontology versions before 0
    - draft version 생성 성공: `status=DRAFT`, `created_by=fe-wave5-smoke`
    - class 2개 생성 성공
    - property 1개 생성 성공
    - relation 1개 생성 성공
    - graph 조회 성공: nodes 2, edges 1, properties 1
    - compatibility fields 반환 확인: classes 2, relations 1
    - CSV source upload 성공: `status=UPLOADED`, `preview_status=READY`
    - preview 조회 성공: rows 2, columns `company_name`, `employee_count`
    - P0 API 조합 dashboard summary 계산 확인: active projects 1, sources 1, classes 2, relations 1, failed sources 0
  - `VITE_USE_MOCK_API=false` Vite dev server `127.0.0.1:5175`: 기동 성공
  - actual-mode route shell curl: `/dashboard`, `/projects`, `/projects/{project_id}/ontology`, `/projects/{project_id}/sources` 모두 200
- 실행하지 못한 검증:
  - Browser click automation은 수행하지 못했다.
  - 사유: 현재 세션 도구 목록에 호출 가능한 Browser automation tool이 없고, 로컬 `playwright` package도 설치되어 있지 않다.

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
  - FE 타입만 OpenAPI에 맞춰 보강했다. Backend/OpenAPI 변경은 없다.
  - `PropertyDataType`, `Position`, `OntologyVersionCreateRequest`, `OntologyClassCreateRequest`, `OntologyPropertyCreateRequest`, `OntologyRelationCreateRequest`를 FE API boundary에 추가했다.
  - `OntologyGraph.classes`/`relations`를 nullable compatibility field로 수정했다.
  - actual dashboard는 OpenAPI에 없는 endpoint 대신 P0 API 조합으로 계산한다.
- 영향받는 역할:
  - Backend: 신규 API 요청 없음. 기존 Project/Ontology/Source P0 API만 사용한다.
  - QA: INT-003 확인 시 `/api/v1/dashboard` mismatch는 FE source/dist 기준 해소됨. INT-001은 actual API HTTP smoke PASS, browser/manual UAT는 별도 확인 필요.

## Blocker
- 자동 Browser UAT는 현재 환경에서 불가하다. 호출 가능한 Browser tool이 없고 Playwright도 설치되어 있지 않다.
- Docker/Postgres full infra stack 검증은 Frontend scope 밖이며 이번 smoke는 Backend test와 같은 SQLite DB 방식으로 수행했다.

## 남은 TODO
- QA 또는 수동 검증자가 브라우저에서 실제 클릭 UAT를 수행해야 한다.
- Source archive/delete UI는 MVP 1 INT-001 범위에서 제외된 follow-up이다.
- Ontology update/delete form은 MVP 1 closeout 범위가 아니므로 추가하지 않았다.

## 수동 UAT 절차
- Backend를 실행한다. 예: `cd apps/backend && poetry run uvicorn app.main:app --host 127.0.0.1 --port 8000`
- Frontend를 실제 API mode로 실행한다. 예: `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1`
- 브라우저에서 `/dashboard`를 열고 dashboard error state가 아닌지 확인한다. Network tab에서 `/api/v1/dashboard` 요청이 없어야 한다.
- `/projects`에서 project를 생성한다.
- 생성한 project의 `/projects/{project_id}/ontology`로 이동한다.
- draft version이 없으면 `Create Draft Version`을 클릭한다.
- `Create class`로 class 2개를 만든다.
- 첫 번째 class를 선택하고 `Create property`를 클릭한다.
- target class를 선택하고 `Create relation`을 클릭한다.
- 그래프에 node 2개와 edge 1개가 보이는지 확인한다.
- `/projects/{project_id}/sources`에서 CSV 파일을 업로드한다.
- source detail에서 CSV/Excel preview table이 보이는지 확인한다.

## 다른 역할에 전달할 내용
- PM: MVP 1 actual dashboard는 endpoint가 아니라 P0 API 조합 boundary로 확정해도 된다.
- Backend: `/api/v1/dashboard` 추가 필요 없음. FE는 existing P0 API만 사용한다.
- Frontend: `HanaCard` className forwarding이 추가되어 `styled(HanaCard)` 사용이 정상 적용된다.
- QA: Browser 자동화는 미수행. 위 수동 UAT 절차로 INT-001 browser/manual evidence를 남겨 달라.

## 총괄에게 요청하는 결정
- Browser automation이 없는 환경에서 actual API HTTP smoke + 수동 UAT 절차 제공을 INT-001 closeout의 허용 증거로 볼지 결정 필요.

## 현재 판정
- PASS
