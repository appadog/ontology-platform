# Frontend Report - Wave 4

## 담당 범위
- backlog ID: FE-009, FE-006, FE-007, FE-012, partial FE-005
- 작업 경로: `apps/frontend`, `docs/frontend/UI_STYLE_GUIDE_MVP1.md`, `docs/handoffs/wave-004/FRONTEND_REPORT.md`

## 완료한 작업
- `OntologyVersionSummary` 프론트 전용 타입을 제거하고 Backend `OntologyVersion` 계약 형태로 `OntologyVersion` 타입과 mock fixture를 맞췄다.
- relation/edge/property cardinality를 full `Cardinality` enum으로 통합했다.
- Backend nullable DTO 필드와 FE 타입/UI fallback을 맞췄다.
  - `ProjectSummary.description`: `string | null`
  - `ProjectDetail.description`: `string | null`
  - `ProjectDetail.current_ontology_version_id`: required nullable
  - `OntologyClass.description`: `string | null`
  - `OntologyRelation.description`: `string | null`
  - `SourceData.mime_type`: `string | null`
  - `SourcePreview.warnings`: optional rendering 대응
- `docs/api/openapi-mvp1.json` 기준으로 FE `shared/api/types.ts`, mock fixture, mock API boundary 차이를 줄였다.
- Source create/list/detail/upload/preview 실제 HTTP smoke를 FastAPI 서버에 대해 수행했다.
  - CSV upload: `preview_status=READY`, preview row 2개, columns `company_name`, `employee_count`
  - TXT upload: `preview_status=NOT_AVAILABLE`, preview columns 0개, warnings 1개
- `VITE_USE_MOCK_API=false` API mode Vite dev server를 `127.0.0.1:5174`에서 기동하고 주요 route shell 200을 확인했다.
- FE-012: `docs/frontend/UI_STYLE_GUIDE_MVP1.md` 작성 완료.
  - theme token, UI primitive, hana adapter 정책, status tone matrix, layout 기준, 금지 규칙 포함
- 현재 theme/status tone/common UI wrapper를 스타일 가이드와 연결했다.
  - `theme.ts`에 spacing/typography token 추가
  - `GlobalStyle`, `HanaBadge`, `HanaCard`, `PageState`, `MetricCard`가 theme token을 사용하도록 1차 정리
  - `PublishStatus`를 `statusToTone` matrix에 추가
- Source archive/delete UI는 INT-001 필수 범위에서 제외하고 follow-up으로 남겼다.

## 변경 파일
- `apps/frontend/src/shared/api/types.ts`
- `apps/frontend/src/shared/api/client.ts`
- `apps/frontend/src/shared/mocks/fixtures.ts`
- `apps/frontend/src/pages/ProjectListPage.tsx`
- `apps/frontend/src/pages/ProjectDetailPage.tsx`
- `apps/frontend/src/pages/SourceDetailPage.tsx`
- `apps/frontend/src/shared/styles/theme.ts`
- `apps/frontend/src/shared/styles/GlobalStyle.ts`
- `apps/frontend/src/shared/ui/hana/HanaBadge.tsx`
- `apps/frontend/src/shared/ui/hana/HanaCard.tsx`
- `apps/frontend/src/shared/ui/platform/PageState.tsx`
- `apps/frontend/src/shared/ui/platform/MetricCard.tsx`
- `docs/frontend/UI_STYLE_GUIDE_MVP1.md`
- `docs/handoffs/wave-004/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `npm run build`
  - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/health`
  - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:6064/health`
  - `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-api-smoke.db LOCAL_STORAGE_PATH=/private/tmp/ontology-platform-api-smoke-storage .venv/bin/python -c "from app.db.base import Base; from app.db.session import engine; Base.metadata.create_all(bind=engine)"`
  - `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-api-smoke.db LOCAL_STORAGE_PATH=/private/tmp/ontology-platform-api-smoke-storage .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8010`
  - `node --input-type=module -e "...Source API smoke..."`
  - `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8010 npm run dev -- --host 127.0.0.1 --port 5174`
  - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5174/`
  - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5174/projects/project-corp-knowledge/sources`
  - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5174/sources/source-policy-csv`
  - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5174/projects/project-corp-knowledge/ontology`
- 결과:
  - `npm run build`: PASS
  - backend `8000/6064` health: 미기동으로 `000`
  - SQLite smoke DB 기반 FastAPI `127.0.0.1:8010`: 기동 성공
  - Source API smoke: PASS
    - project 생성 성공
    - list before 0, list after 2
    - CSV upload/detail/preview 성공, `READY`, preview rows 2
    - TXT upload/preview 성공, `NOT_AVAILABLE`, preview columns 0, warnings 1
  - `VITE_USE_MOCK_API=false` Vite dev server `127.0.0.1:5174`: 기동 성공
  - API mode route shell curl: `/`, `/projects/project-corp-knowledge/sources`, `/sources/source-policy-csv`, `/projects/project-corp-knowledge/ontology` 모두 200
- 실행하지 못한 검증:
  - 실제 브라우저 상호작용 기반 Source upload UI smoke는 수행하지 못했다. 이번 세션에서 호출 가능한 in-app Browser/Playwright 도구가 노출되어 있지 않았다.
  - Postgres 기반 로컬 backend smoke는 수행하지 못했다. `8000/6064` backend가 미기동 상태였고, 대신 Backend test와 동일한 SQLite DB 방식으로 실제 FastAPI HTTP smoke를 수행했다.

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
  - FE 타입을 Backend OpenAPI 계약에 맞춰 조정했다. Backend API 자체 변경은 없다.
  - `OntologyVersionSummary` 제거, `OntologyVersion` 사용.
  - full `Cardinality` enum 추가 및 relation/edge/property 공통 사용.
  - nullable/optional 필드 반영: project description, ontology class/relation description, source mime type, source preview warnings.
  - `PublishStatus` status tone matrix 추가.
- 영향받는 역할:
  - Backend: OpenAPI `OntologyVersion`, `Cardinality`, nullable DTO 계약과 FE 타입이 맞춰졌다.
  - PM/QA: `docs/frontend/UI_STYLE_GUIDE_MVP1.md`를 UI/status tone 검수 기준으로 사용할 수 있다.

## Blocker
- 호출 가능한 브라우저 자동화 도구가 없어 API mode UI 상호작용 smoke는 shell route/API HTTP smoke로 대체했다.
- Postgres/infra stack은 현재 세션에서 기동되어 있지 않아 SQLite smoke DB로 실제 FastAPI endpoint를 검증했다.

## 남은 TODO
- Source archive/delete UI는 INT-001 범위 제외. 후속 backlog에서 soft delete UX와 권한 정책을 정의해야 한다.
- 공통 Table primitive는 아직 화면별 styled table이다. FE-012 후속으로 `src/shared/ui/platform/Table` 추출 가능.
- 실제 Browser/QA 환경에서 `VITE_USE_MOCK_API=false` Source upload UI 클릭 smoke를 재수행하면 좋다.
- Ontology class/relation/property 생성·수정 form은 partial FE-005 범위로 남아 있다.

## 다른 역할에 전달할 내용
- PM: FE-012 스타일 가이드를 작성했으니 status tone/layout 금지 규칙을 수용 기준에 연결 가능하다.
- Backend: FE는 `OntologyVersion`, full `Cardinality`, nullable DTO를 OpenAPI 기준으로 맞췄다. `SourceData.mime_type=null`과 `SourcePreview.warnings` optional도 UI에서 안전하게 처리한다.
- Frontend: 업무 화면에서 `hana-style-component` 직접 import는 여전히 없다. 외부 dependency는 `src/shared/ui/hana` 경계를 유지한다.
- QA: 실제 HTTP Source smoke 결과는 PASS다. 단, 브라우저 클릭 기반 API mode smoke는 별도 환경에서 재확인 필요하다.

## 총괄에게 요청하는 결정
- Source archive/delete UI를 다음 wave에 포함할지, 아니면 INT-001 이후 follow-up으로 계속 둘지 확정 필요.
- 공통 Table primitive 추출을 FE-012 후속으로 backlog화할지 결정 필요.

## 현재 판정
- PASS
