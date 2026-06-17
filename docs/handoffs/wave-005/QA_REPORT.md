# QA Report - Wave 5

## 담당 범위
- backlog ID:
  - `INT-001`
  - `INT-003`
  - `INT-005`
- 작업 경로:
  - `docs/api/openapi-mvp1.json`
  - `apps/frontend/src/shared/api/types.ts`
  - `apps/frontend/src/shared/api/client.ts`
  - `apps/frontend/src/shared/api/queries.ts`
  - `apps/frontend/src/pages/OntologyModelerPage.tsx`
  - `docs/handoffs/wave-005/PM_REPORT.md`
  - `docs/handoffs/wave-005/BACKEND_REPORT.md`
  - `docs/handoffs/wave-005/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-005/QA_REPORT.md`

## 완료한 작업
- 작업 시작 전 필수 문서를 확인했다.
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-004/NEXT_ORDERS.md`
  - `docs/handoffs/wave-005/PM_REPORT.md`
  - `docs/handoffs/wave-005/BACKEND_REPORT.md`
  - `docs/handoffs/wave-005/FRONTEND_REPORT.md`
  - `docs/backlog/MVP1_BACKLOG.md`
  - `docs/backlog/INT-001_MVP1_DEMO_ACCEPTANCE.md`
  - `docs/api/openapi-mvp1.json`
- `/api/v1/dashboard` contract mismatch 해소 여부를 확인했다.
  - OpenAPI에 `/api/v1/dashboard` 없음.
  - FE source/dist에 `/api/v1/dashboard` 직접 호출 없음.
  - 실제 backend `/api/v1/dashboard`는 404이며, FE dashboard는 P0 API 조합으로 정상 렌더링됨.
- `OntologyGraph.classes`/`relations` nullable compatibility type 반영 여부를 확인했다.
  - OpenAPI: optional, nullable, deprecated compatibility field.
  - FE: `classes?: OntologyClass[] | null`, `relations?: OntologyRelation[] | null`.
- Backend API INT-001 full flow를 재실행했다.
- 실제 FastAPI 서버와 Vite actual API mode로 FE-to-BE smoke를 재검증했다.
- Headless Chrome으로 browser/manual UAT evidence를 남겼다.
  - Dashboard 정상 렌더링
  - Ontology graph/modeler 정상 렌더링
  - CSV preview table 정상 렌더링
  - PDF `NOT_AVAILABLE` notice 정상 렌더링
- Docker Compose 검증 가능 여부를 확인했다.

## 변경 파일
- `docs/handoffs/wave-005/QA_REPORT.md`
  - Wave 5 QA closeout 보고서 작성.
- 구현 파일 변경 없음.

## 실행/검증
- 실행한 명령:
  - 필수 문서 `sed`/`python3` inspection
  - OpenAPI/FE contract comparison script
  - `.venv/bin/pytest -q`
  - `npm run build`
  - `.venv/bin/python` OpenAPI freshness check
  - `.venv/bin/python` Backend `TestClient` INT-001 full flow
  - actual HTTP smoke against `http://127.0.0.1:8012`
  - `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8012 npm run dev -- --host 127.0.0.1 --port 5176`
  - `/usr/bin/curl` route shell checks against `http://127.0.0.1:5176`
  - Headless Chrome screenshot smoke
  - `docker --version`
  - `git diff --check`
- 결과:
  - Backend tests: PASS, `5 passed`.
  - Frontend build: PASS.
  - OpenAPI freshness: PASS.
  - `git diff --check`: PASS.
  - `/api/v1/dashboard` mismatch: PASS.
    - OpenAPI path 없음.
    - FE source/dist 직접 호출 없음.
    - actual backend는 404, expected.
    - Dashboard browser render는 P0 API 조합으로 정상 표시.
  - Enum/DTO sync: PASS.
    - `ProjectStatus`, `OntologyVersionStatus`, `OntologyElementStatus`, `Cardinality`, `SourceType`, `SourceStatus`, `SourcePreviewStatus`, `PropertyDataType`가 OpenAPI와 FE type에서 일치.
    - `OntologyVersionSummary`는 FE type에 남아 있지 않음.
    - nullable DTO 필드 유지 확인:
      - `ProjectSummary.description`
      - `ProjectDetail.description`
      - `OntologyClass.description`
      - `OntologyRelation.description`
      - `SourceData.mime_type`
  - `OntologyGraph` compatibility: PASS.
    - OpenAPI `required = ['version_id', 'version_status', 'nodes', 'edges', 'properties']`.
    - OpenAPI `classes.deprecated = true`, `relations.deprecated = true`.
    - OpenAPI `classes`/`relations` nullable.
    - FE `classes?: OntologyClass[] | null`, `relations?: OntologyRelation[] | null`.
  - Backend API INT-001 full flow: PASS.
    - `/health`, `/api/v1/me`
    - project create/list/detail
    - ontology draft version create
    - class 2개, property 1개, relation 1개 create
    - graph 조회: nodes 2, edges 1, properties 1, compatibility classes 2, relations 1
    - CSV/Excel upload+preview: `READY`
    - TXT/PDF upload+preview: `NOT_AVAILABLE`
  - Actual HTTP FE-to-BE smoke: PASS.
    - evidence file: `/private/tmp/ontology-platform-wave5-smoke.json`
    - project id: `d15c776c-614f-4d54-ab12-53d77e82cd08`
    - version id: `16591c09-6dea-4b56-a39f-46858886f449`
    - source statuses: `CSV=READY`, `EXCEL=READY`, `TXT=NOT_AVAILABLE`, `PDF=NOT_AVAILABLE`
    - backend `/api/v1/dashboard`: 404 expected
  - Frontend actual API mode route shell: PASS.
    - `/dashboard`: 200
    - `/projects`: 200
    - `/projects/d15c776c-614f-4d54-ab12-53d77e82cd08`: 200
    - `/projects/d15c776c-614f-4d54-ab12-53d77e82cd08/ontology`: 200
    - `/projects/d15c776c-614f-4d54-ab12-53d77e82cd08/sources`: 200
    - `/projects/d15c776c-614f-4d54-ab12-53d77e82cd08/sources/0bf44065-8a6e-44cf-90fc-c64f19ccad8d`: 200
    - `/projects/d15c776c-614f-4d54-ab12-53d77e82cd08/sources/fe3eebaf-db63-4304-8201-266007882ee4`: 200
  - Browser/manual UAT evidence: PASS with notes.
    - Headless Chrome screenshots saved:
      - `/private/tmp/ontology-platform-wave5-browser/dashboard.png`
      - `/private/tmp/ontology-platform-wave5-browser/ontology.png`
      - `/private/tmp/ontology-platform-wave5-browser/sources.png`
      - `/private/tmp/ontology-platform-wave5-browser/source_csv.png`
      - `/private/tmp/ontology-platform-wave5-browser/source_pdf.png`
    - Dashboard screenshot shows P0 API summary and no dashboard error state.
    - Ontology screenshot shows class nodes, relation edge, property, and authoring controls.
    - CSV detail screenshot shows `UPLOADED`, `READY`, preview columns and sample rows.
    - PDF detail screenshot shows `UPLOADED`, `NOT_AVAILABLE`, and `Preview not available` notice.
- 실행하지 못한 검증:
  - Playwright/Cypress-style browser click automation은 수행하지 못했다.
    - `playwright not installed`.
    - 현재 세션의 callable browser automation tool도 없음.
    - 대신 actual API write smoke + actual browser render evidence로 INT-005 증거를 남겼다.
  - Docker Compose 검증은 수행하지 못했다.
    - `docker --version`: `zsh:1: command not found: docker`.
    - `BE-002`/infra 환경 blocker로 유지.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - QA는 구현/API 파일을 변경하지 않았다.
  - Wave 5 Frontend 변경 결과를 검증했다.
  - `/api/v1/dashboard`는 MVP 1 actual API contract에서 제외된 상태로 유지되며 FE actual mode도 직접 호출하지 않는다.
  - `OntologyGraph.classes`/`relations` nullable compatibility type이 FE에 반영됐다.
- 영향받는 역할:
  - PM: MVP 1 app acceptance는 QA 기준 PASS. 단 Docker Compose는 PM 환경 예외 결정 필요.
  - Backend: 신규 API 요구 없음. `/api/v1/dashboard` 추가 불필요.
  - Frontend: actual API mode smoke와 browser render evidence는 PASS. Playwright 없는 클릭 자동화만 미수행.
  - QA: Docker CLI가 있는 환경에서 compose gate 재검증 필요.

## Blocker
- Docker Compose/local infra smoke는 여전히 blocker다.
  - Linked IDs: `BE-002`, `INT-001`, `INT-005`
  - 사유: 현재 환경에 Docker CLI 없음.
  - PM이 환경 예외로 승인하면 MVP 1 app acceptance closeout에는 더 이상 runtime blocker가 없다.
- Browser click automation은 미수행이다.
  - Linked IDs: `INT-005`
  - 사유: Playwright/Cypress/callable Browser automation 없음.
  - 대체 증거: actual API write smoke + Headless Chrome render screenshots.

## 남은 TODO
- PM:
  - Docker CLI 부재를 MVP 1 closeout 환경 예외로 승인할지 결정.
  - Headless Chrome render evidence + actual API smoke를 Browser/manual UAT evidence로 수용할지 최종 승인.
- QA:
  - Docker CLI가 제공되는 환경에서 compose smoke 재실행.
  - 브라우저 클릭 자동화 도구가 제공되면 Project/Ontology/Source create/upload 클릭 경로를 재검증.
- Frontend:
  - 필수 blocker 없음.
  - 비필수 후속: default project selector가 actual created project와 별개로 mock 기본 프로젝트명을 표시하는 UX는 MVP 2 전 정리 가능.
- Backend:
  - 필수 blocker 없음.

## 다른 역할에 전달할 내용
- PM:
  - `INT-003`: PASS.
  - `INT-001`: PASS for MVP 1 app acceptance smoke, Docker environment exception pending.
  - `INT-005`: PASS with headless browser render evidence, click automation not run.
  - MVP 2 구현 착수는 PM이 Docker/Browser evidence 예외를 승인하면 가능. 승인 전 strict gate는 NO-GO.
- Backend:
  - Backend regression, OpenAPI freshness, P0 API full flow 모두 PASS.
  - `/api/v1/dashboard`는 계속 추가하지 않아도 됨.
  - Docker Compose는 Docker CLI 있는 환경에서만 재검증 가능.
- Frontend:
  - `/api/v1/dashboard` mismatch 해소 확인.
  - `OntologyGraph.classes`/`relations` nullable type 정렬 확인.
  - actual API mode browser render에서 dashboard, ontology, source CSV/PDF 화면 정상 확인.
  - QA가 5176 포트를 사용했기 때문에 backend `CORS_ORIGINS`를 해당 포트에 맞춰 실행했다. 기본 5173 포트는 backend default CORS에 포함되어 있다.
- QA:
  - 다음 gate는 Docker/Compose 또는 클릭 자동화가 있는 환경에서만 추가 가치가 있다.

## 총괄에게 요청하는 결정
- Docker CLI 부재를 MVP 1 closeout의 환경 예외로 승인할지 결정 필요.
- Headless Chrome render evidence와 actual API write smoke를 `INT-005` Browser/manual UAT evidence로 수용할지 최종 승인 필요.
- 위 두 예외가 승인되면 MVP 2 구현 착수 가능. 승인 전에는 strict gate 기준으로 MVP 2 구현 착수는 `NO-GO`.

## 현재 판정
- Overall: PASS WITH ENVIRONMENT EXCEPTION PENDING
- `INT-003`: PASS
- `INT-001`: PASS FOR APP ACCEPTANCE / DOCKER ENV EXCEPTION PENDING
- `INT-005`: PASS WITH HEADLESS BROWSER EVIDENCE / CLICK AUTOMATION NOT RUN
- MVP 2 구현 착수 가능 여부:
  - Strict gate: NO-GO until PM approves Docker environment exception.
  - QA app acceptance gate: GO after PM accepts Docker CLI absence and headless browser/manual UAT evidence.
