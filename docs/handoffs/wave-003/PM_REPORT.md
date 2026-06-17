# PM Report - Wave 3

## 담당 범위
- backlog ID:
  - `PM-005`
  - `PM-006`
  - `PM-007`
- 작업 경로:
  - `docs/api/API_CONTRACT_PRIORITY_MVP1.md`
  - `docs/backlog/MVP1_BACKLOG.md`
  - `docs/adr/`
  - `docs/handoffs/wave-003/PM_REPORT.md`

## 완료한 작업
- 작업 시작 전 `.agents/skills/handoff-reporting/SKILL.md`를 확인했다.
- `docs/handoffs/wave-003/BACKEND_REPORT.md`와 `docs/handoffs/wave-003/FRONTEND_REPORT.md`를 읽고 API/enum/DTO 변경을 검토했다.
- Backend wave-003 보고 기준으로 `BE-010` 결정을 수용했다.
  - `docs/api/openapi-mvp1.json`을 MVP 1 canonical OpenAPI export로 둔다.
  - Frontend는 이 파일에서 타입 생성 또는 수동 동기화를 수행한다.
  - QA는 이 파일을 INT-002/INT-003 contract review 기준으로 사용한다.
- Source upload/preview 계약을 검토했다.
  - `SourceStatus`와 `SourcePreviewStatus`는 분리 유지.
  - CSV/Excel happy path는 `status=UPLOADED`, `preview_status=READY`.
  - TXT/PDF metadata-only path는 `status=UPLOADED`, `preview_status=NOT_AVAILABLE`.
  - 새 enum 값 추가는 없음.
- Source delete 방식을 PM 계약으로 수용했다.
  - `SourceStatus`에 `ARCHIVED`/`DELETED`를 추가하지 않는다.
  - Backend internal `is_deleted` soft delete로 처리한다.
  - 삭제된 source는 list/detail/preview와 project `source_count`에서 제외한다.
- `OntologyGraph` 계약을 재검토했다.
  - canonical contract는 계속 `nodes[]`, `edges[]`, `properties[]`.
  - `classes[]`, `relations[]`는 compatibility field로만 허용.
  - 현재 `docs/api/openapi-mvp1.json`에는 `classes`, `relations`가 `OntologyGraph.required`에 남아 있음을 확인했다.
  - 이는 transition artifact로 허용하되, generated client가 compatibility fields를 강제하게 되면 Backend follow-up에서 optional/deprecated 처리해야 한다.
- Frontend wave-003 보고 기준으로 canonical graph migration이 수행된 것을 확인했다.
  - 현재 FE type은 `nodes`, `edges`, `properties`를 canonical으로 두고 `classes`, `relations`는 optional compatibility field로 둔다.
  - modeler core rendering은 `graph.nodes`/`graph.edges`를 사용한다.
- `hana-style-component` install script 지연은 MVP 1 dependency risk로 유지하고, `npm audit` 5건은 `FE-011 Dependency hardening` P2 task로 분리한 기존 결정을 유지했다.

## 변경 파일
- `docs/api/API_CONTRACT_PRIORITY_MVP1.md`
  - Source delete를 internal soft delete로 명시
  - `BE-010` OpenAPI/type sharing 결정을 canonical export 기준으로 명시
- `docs/backlog/MVP1_BACKLOG.md`
  - OpenAPI 타입 공유 blocker를 resolved로 갱신
  - Source delete contract note 추가
- `docs/adr/0003-mvp1-graph-compatibility-and-dependency-risk.md`
  - `BE-010` accepted 결정 반영
  - Source delete soft delete 결정 반영
  - `openapi-mvp1.json`의 `classes`/`relations` required compatibility caveat 기록
- `docs/handoffs/wave-003/PM_REPORT.md`
  - Backend/Frontend wave-003 보고 검토 결과로 보고서 갱신

## 실행/검증
- 실행한 명령:
  - `sed -n '1,220p' .agents/skills/handoff-reporting/SKILL.md`
  - `sed -n '1,360p' docs/handoffs/wave-003/BACKEND_REPORT.md`
  - `sed -n '1,360p' docs/handoffs/wave-003/FRONTEND_REPORT.md`
  - `sed -n '1,280p' docs/handoffs/wave-003/PM_REPORT.md`
  - `sed -n '1,460p' docs/api/API_CONTRACT_PRIORITY_MVP1.md`
  - `sed -n '1,240p' docs/adr/0003-mvp1-graph-compatibility-and-dependency-risk.md`
  - `sed -n '1,260p' apps/backend/app/modules/source/router.py`
  - `sed -n '1,220p' apps/backend/app/modules/source/schemas.py`
  - `rg -n 'SourceStatus|SourcePreviewStatus|SourceData|SourcePreview|OntologyGraph|classes|relations|openapi-mvp1|is_deleted|Archive source data|/api/v1/sources' docs/api/openapi-mvp1.json`
  - `sed -n '2048,2128p' docs/api/openapi-mvp1.json`
  - `sed -n '3000,3225p' docs/api/openapi-mvp1.json`
  - `sed -n '1500,1625p' docs/api/openapi-mvp1.json`
  - `sed -n '1,260p' apps/frontend/src/shared/api/types.ts`
  - `sed -n '1,180p' apps/frontend/src/pages/OntologyModelerPage.tsx`
  - `rg -n 'export|openapi-mvp1|BE-010|is_deleted|soft delete|Source delete|classes\\[\\]|relations\\[\\]|SourcePreviewStatus|SourceStatus' docs/api/API_CONTRACT_PRIORITY_MVP1.md docs/adr docs/backlog/MVP1_BACKLOG.md docs/handoffs/wave-003/PM_REPORT.md`
- 결과:
  - Backend report에서 `docs/api/openapi-mvp1.json` canonical export 결정 확인.
  - Backend source router에서 delete가 `source.is_deleted = True`로 처리되고, `_source_or_404`가 deleted source를 404로 간주함을 확인.
  - Source OpenAPI schema에서 `SourceStatus`와 `SourcePreviewStatus`가 분리되어 있고 새 enum 값이 없음을 확인.
  - OpenAPI `OntologyGraph` schema가 `nodes`, `edges`, `properties`와 함께 `classes`, `relations`도 required로 노출하는 것을 확인.
  - Frontend type/modeler에서 canonical `nodes`, `edges`, `properties` 사용과 optional `classes`, `relations` compatibility 사용을 확인.
- 실행하지 못한 검증:
  - PM 문서/계약 검토 범위라 backend/frontend runtime smoke는 수행하지 않았다.
  - Docker compose 검증은 Backend 보고상 환경 blocker로 미수행 상태다.

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
  - `BE-010`: `docs/api/openapi-mvp1.json`을 canonical OpenAPI export/type sharing artifact로 확정.
  - `SourceData`, `SourcePreview`, `SourcePreviewColumn`, `SourceUploadRequest`는 Backend/Frontend wave-003 변경 대상이며 API 문서 기준과 일치.
  - `SourceStatus`와 `SourcePreviewStatus`는 분리 유지.
  - Source delete는 `SourceStatus` enum을 변경하지 않고 internal `is_deleted` soft delete로 처리.
  - `OntologyGraph` canonical contract는 `nodes[]`, `edges[]`, `properties[]`.
  - `classes[]`, `relations[]`는 compatibility field로만 허용.
  - enum 값 추가 없음.
- 영향받는 역할:
  - Backend: `openapi-mvp1.json`을 최신 상태로 계속 export해야 하며, graph compatibility fields가 generated client를 방해하면 optional/deprecated 처리 follow-up 필요.
  - Frontend: `docs/api/openapi-mvp1.json` 기준으로 `shared/api/types.ts` 수동 타입 또는 생성 타입을 동기화해야 한다.
  - QA: INT-002/INT-003은 `docs/api/openapi-mvp1.json`을 기준으로 하되, graph canonical 판정은 `nodes`, `edges`, `properties` 중심으로 해야 한다.

## Blocker
- PM 계약 blocker는 없음.
- 전체 MVP gate blocker:
  - Docker CLI 부재로 compose 검증 미수행.
  - QA의 INT-002/INT-003 OpenAPI vs FE type/mock diff 미완료.
  - `openapi-mvp1.json`에서 `OntologyGraph.classes`/`relations`가 required인 상태는 generated client 사용 시 혼선을 만들 수 있는 follow-up finding.

## 남은 TODO
- QA가 `docs/api/openapi-mvp1.json` vs FE `shared/api/types.ts`/mocks를 비교해 INT-002/INT-003 결과를 남긴다.
- Backend는 QA finding에 따라 `OntologyGraph.classes`/`relations`를 optional/deprecated compatibility field로 조정할지 판단한다.
- Frontend는 `VITE_USE_MOCK_API=false`로 실제 Source API smoke를 수행한다.
- FE-011에서 npm audit 5건의 severity와 조치 방안을 분류한다.

## 다른 역할에 전달할 내용
- PM:
  - BE-010 결정은 문서 반영 완료.
  - Source delete soft delete 방식은 MVP 1 contract로 수용.
- Backend:
  - `docs/api/openapi-mvp1.json`을 canonical export로 유지한다.
  - Source delete는 `is_deleted` soft delete로 유지하되 API 문서와 일치해야 한다.
  - `OntologyGraph.classes`/`relations` required schema는 QA/generator 이슈가 되면 optional/deprecated compatibility field로 조정한다.
- Frontend:
  - FE 타입은 `openapi-mvp1.json`과 diff해야 한다.
  - Source delete/archive UI는 INT-001 필수 흐름은 아니며 FE-006 follow-up으로 남길 수 있다.
  - Graph UI behavior는 `nodes`, `edges`, `properties` 기준을 유지한다.
- QA:
  - INT-002/INT-003 기준 artifact는 `docs/api/openapi-mvp1.json`.
  - SourceStatus/SourcePreviewStatus 분리, TXT/PDF `NOT_AVAILABLE`, CSV/Excel `READY`, source delete soft delete를 확인한다.
  - Graph는 compatibility fields가 있어도 canonical fields 중심으로 판정한다.

## 총괄에게 요청하는 결정
- `OntologyGraph.classes`/`relations` required schema cleanup을 wave-004 Backend task로 배정할지 결정 요청.
- Source archive/delete UI를 INT-001에서 제외하고 FE-006 follow-up으로 둘지 최종 확인 요청.
- `FE-011 Dependency hardening`을 wave-004에 배정할지, release risk로만 추적할지 결정 요청.

## 현재 판정
- PASS
