# Frontend Report - Wave 3

## 담당 범위
- backlog ID: `FE-006`, `FE-007`, `FE-009`, 부분 `FE-004`, 부분 `FE-005`
- 작업 경로: `apps/frontend`, `docs/handoffs/wave-003/FRONTEND_REPORT.md`

## 완료한 작업
- Source API/fixture 계약을 `SourceStatus`와 `SourcePreviewStatus` 분리 기준으로 갱신했다.
- `SourcePreviewStatus=PENDING | READY | NOT_AVAILABLE | FAILED`를 FE 타입, enum 상수, badge tone, mock fixture에 반영했다.
- CSV/Excel preview는 `columns[]` 객체 배열(`name`, `data_type`, `nullable`, `sample_values`)과 `rows[]`를 렌더링하도록 수정했다.
- TXT/PDF source는 preview API를 호출하지 않고 detail metadata와 `NOT_AVAILABLE` notice를 표시하도록 분기했다.
- Source upload 입력 영역을 추가하고 `POST /api/v1/projects/{project_id}/sources/upload`용 multipart API client/mutation 경계를 준비했다.
- mock upload는 in-memory source store에 source를 추가하고 CSV/Excel은 mock preview를 생성하며 TXT/PDF는 `NOT_AVAILABLE`로 저장한다.
- IA route contract에 맞춰 `/projects/:projectId/ontology`, `/projects/:projectId/sources`, `/projects/:projectId/sources/:sourceId` route를 추가했다.
- `OntologyGraph` 사용 기준을 canonical `nodes[]`, `edges[]`, `properties[]`로 전환했다. `classes[]`, `relations[]`는 optional compatibility field로만 참조한다.
- Project create/update mutation 경계와 최소 UI를 추가했다.

## 변경 파일
- `apps/frontend/src/shared/api/types.ts`
- `apps/frontend/src/shared/api/client.ts`
- `apps/frontend/src/shared/api/queries.ts`
- `apps/frontend/src/shared/constants/status.ts`
- `apps/frontend/src/shared/mocks/fixtures.ts`
- `apps/frontend/src/shared/ui/hana/HanaBadge.tsx`
- `apps/frontend/src/app/router.tsx`
- `apps/frontend/src/shared/layout/AppShell.tsx`
- `apps/frontend/src/pages/SourceManagerPage.tsx`
- `apps/frontend/src/pages/SourceDetailPage.tsx`
- `apps/frontend/src/pages/OntologyModelerPage.tsx`
- `apps/frontend/src/pages/ProjectListPage.tsx`
- `apps/frontend/src/pages/ProjectDetailPage.tsx`
- `docs/handoffs/wave-003/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `npm run build`
  - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/projects/project-corp-knowledge/sources`
  - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/projects/project-corp-knowledge/sources/source-policy-csv`
  - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/projects/project-corp-knowledge/sources/source-handbook-pdf`
  - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/projects/project-corp-knowledge/ontology`
- 결과:
  - `npm run build` 성공
  - route smoke 결과: Source list `200`, CSV detail `200`, PDF detail `200`, scoped ontology `200`
  - 업무 화면에서 `hana-style-component` 직접 import 없음. 직접 import는 `src/shared/ui/hana/HanaButton.tsx` adapter 내부에만 있음.
- 실행하지 못한 검증:
  - 실제 backend Source API 연동 검증은 Backend wave-003 Source API 보고가 아직 `PENDING`이라 수행하지 못했다.
  - Browser plugin 기반 시각 검증은 현재 callable browser tool이 없어 수행하지 못했다.

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
  - FE `SourcePreviewStatus` 타입 추가: `PENDING`, `READY`, `NOT_AVAILABLE`, `FAILED`
  - FE `SourceData.preview_status`를 `ValidationStatus`에서 `SourcePreviewStatus`로 변경
  - FE `SourcePreview.columns`를 `string[]`에서 `SourcePreviewColumn[]`로 변경
  - FE `OntologyGraph` canonical field를 `nodes[]`, `edges[]`, `properties[]`로 변경
  - FE `ProjectCreateRequest`, `ProjectUpdateRequest`, `SourceUploadRequest` mutation DTO 추가
- 영향받는 역할:
  - Backend: Source API/OpenAPI schema와 FE type boundary contract diff 대상
  - PM: `NOT_AVAILABLE`, `READY`, canonical graph contract 결정 확인 대상
  - QA: INT-002/INT-003 contract review와 Source preview smoke 대상

## Blocker
- Backend wave-003 Source API 보고서가 아직 `PENDING`이라 실제 API 응답과의 최종 diff는 대기 중이다.
- `BE-010` OpenAPI export 또는 FE 타입 공유 방식 결정이 아직 open이다.

## 남은 TODO
- Backend Source API가 완료되면 `VITE_USE_MOCK_API=false`로 list/detail/upload/preview 실제 연동 smoke를 수행한다.
- OpenAPI export/type sharing 방식이 확정되면 `shared/api/types.ts` 수동 DTO와 생성 타입의 차이를 정리한다.
- Source archive/delete action은 UI/API 경계만 남아 있다.
- Ontology class/relation/property 생성·수정 form은 canonical graph 전환까지만 완료했고 실제 mutation UI는 후속 작업이다.
- FE-010 smoke test 또는 Storybook 준비는 미완료다.

## 다른 역할에 전달할 내용
- PM: FE는 `SourcePreviewStatus=NOT_AVAILABLE`을 TXT/PDF metadata-only 상태로 처리하고, CSV/Excel만 preview table을 렌더링하도록 구현했다.
- Backend: `POST /api/v1/projects/{project_id}/sources/upload`는 multipart `file`, `source_type`, optional `display_name`을 기대한다. CSV/Excel은 `preview_status=READY`, TXT/PDF는 `NOT_AVAILABLE` 기준으로 UI가 분기한다.
- Frontend: 업무 화면은 계속 `src/shared/ui/hana` adapter만 import해야 한다. Source flow 추가 작업도 이 규칙을 유지해야 한다.
- QA: 다음 smoke 우선순위는 scoped route `/projects/:projectId/sources`, CSV `READY` preview, PDF/TXT `NOT_AVAILABLE` notice, `/projects/:projectId/ontology` canonical graph 표시다.

## 총괄에게 요청하는 결정
- `BE-010` OpenAPI export/type sharing 방식을 확정해 FE 수동 타입 유지 여부를 결정해 달라.
- Source archive/delete가 INT-001 범위에 포함되는지, 아니면 FE-006 후속으로 남길지 결정해 달라.
- `hana-style-component` install script 지연 및 npm audit 항목을 별도 backlog로 분리할지 결정해 달라.

## 현재 판정
- PARTIAL
