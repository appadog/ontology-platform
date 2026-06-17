# Frontend Report - Wave 6

## 담당 범위
- backlog ID: FE2-001, FE2-002, FE2-003, FE2-004, FE2-005, FE2-006
- 작업 경로: `apps/frontend/src/app`, `apps/frontend/src/pages`, `apps/frontend/src/shared/api`, `apps/frontend/src/shared/mocks`, `apps/frontend/src/shared/layout`, `apps/frontend/src/shared/ui`

## 완료한 작업
- MVP 2 thin-slice navigation/route 초안을 추가했다.
- `source profiling`, `document chunk viewer`, `extraction job creation`, `extraction job monitor`, `candidate result view`, `evidence viewer` 화면을 mock/API boundary 기준으로 탐색 가능하게 만들었다.
- `shared/api/types.ts`에 MVP 2 DTO와 enum/status boundary를 추가했다.
- `shared/api/client.ts`, `shared/api/queries.ts`에 MVP 2 endpoint client/query 경계를 추가했다.
- `shared/mocks/mvp2Fixtures.ts`에 deterministic MVP 2 fixture를 추가했다.
- actual API mode 전환 지점을 각 화면 description과 client method에 명시했다.
- Backend 초안에 맞춰 model run은 별도 `/model-runs` endpoint가 아니라 `GET /api/v1/extraction-jobs/{job_id}` detail의 `model_runs[]`에서 읽도록 정리했다.
- Source detail에서 profile/chunk viewer로 이동하는 업무 흐름 링크를 추가했다.
- Wave 5 style foundation과 hana adapter 정책을 유지했다. 업무 화면에서 `hana-style-component` 직접 import는 추가하지 않았다.
- expert review, publish graph, RAG, 외부 LLM credential/provider 설정 UI는 만들지 않았다.

## 변경 파일
- `apps/frontend/src/app/router.tsx`
- `apps/frontend/src/pages/SourceProfilingPage.tsx`
- `apps/frontend/src/pages/DocumentChunkViewerPage.tsx`
- `apps/frontend/src/pages/ExtractionJobCreatePage.tsx`
- `apps/frontend/src/pages/ExtractionJobMonitorPage.tsx`
- `apps/frontend/src/pages/CandidateResultsPage.tsx`
- `apps/frontend/src/pages/EvidenceViewerPage.tsx`
- `apps/frontend/src/pages/mvp2Shared.tsx`
- `apps/frontend/src/pages/SourceDetailPage.tsx`
- `apps/frontend/src/shared/api/types.ts`
- `apps/frontend/src/shared/api/client.ts`
- `apps/frontend/src/shared/api/queries.ts`
- `apps/frontend/src/shared/mocks/mvp2Fixtures.ts`
- `apps/frontend/src/shared/layout/navigation.ts`
- `apps/frontend/src/shared/layout/AppShell.tsx`
- `apps/frontend/src/shared/ui/hana/HanaBadge.tsx`

## 실행/검증
- 실행한 명령:
  - `npm run build`
  - `npm run dev -- --host 127.0.0.1`
  - `curl -I http://127.0.0.1:5174/projects/project-corp-knowledge/sources/source-policy-csv/profile`
  - `curl -I http://127.0.0.1:5174/projects/project-corp-knowledge/sources/source-handbook-pdf/chunks`
  - `curl -I http://127.0.0.1:5174/projects/project-corp-knowledge/extraction/new`
  - `curl -I http://127.0.0.1:5174/extraction-jobs/job-policy-extraction/candidates`
- 결과:
  - `npm run build` PASS.
  - Vite dev server 실행됨. `5173` 포트 사용 중으로 `http://127.0.0.1:5174/`에서 실행.
  - 위 route curl smoke는 모두 HTTP 200.
- 실행하지 못한 검증:
  - Browser automation은 현재 세션의 callable tool 목록에 없어 수행하지 못했다.
  - `VITE_USE_MOCK_API=false` actual API smoke는 Backend Wave 6 완료 보고와 실행 환경이 아직 확정되지 않아 수행하지 않았다. FE client 경계는 실제 endpoint path 기준으로 분리해 두었다.

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
  - 추가 enum/type: `SourceSegmentType`, `ProfileInferredType`, `ModelRunStatus`, `CandidateValidationCode`.
  - 추가 DTO: `SourceProfile`, `SourceSegment`, `PromptTemplate`, `PromptVersion`, `ExtractionJob`, `ExtractionJobDetail`, `ModelRun`, `CandidateEntity`, `CandidateRelation`, `CandidateEvidence`, `CandidateListFilters`.
  - 추가 client/query boundary:
    - `GET/POST /api/v1/sources/{source_id}/profile`
    - `POST /api/v1/sources/{source_id}/parse`
    - `GET /api/v1/sources/{source_id}/segments`
    - `GET /api/v1/projects/{project_id}/prompts`
    - `GET /api/v1/prompts/{prompt_id}/versions`
    - `GET/POST /api/v1/projects/{project_id}/extraction-jobs`
    - `GET /api/v1/extraction-jobs/{job_id}`
    - `POST /api/v1/extraction-jobs/{job_id}/run`
    - `POST /api/v1/extraction-jobs/{job_id}/retry`
    - `GET /api/v1/extraction-jobs/{job_id}/candidates/entities`
    - `GET /api/v1/extraction-jobs/{job_id}/candidates/relations`
    - `GET /api/v1/candidate-evidence/{evidence_id}`
  - `ExtractionJobDetail.model_runs[]`를 actual detail response 경계로 사용한다.
- 영향받는 역할:
  - Backend: endpoint response shape와 enum string이 FE DTO와 맞아야 한다.
  - QA: mock route와 이후 actual API mode smoke 시나리오 기준이 된다.
  - PM: evidence 없는 candidate 정책이 UI에 warning/debug-only로 반영되었는지 확인 필요.

## Blocker
- mock 기반 FE 탐색에는 blocker 없음.
- actual API mode smoke는 Backend Wave 6 구현 완료, seed data, dev server/proxy 실행 상태가 확정되어야 가능하다.
- Browser automation 검증은 현재 callable tool 부재로 미수행.

## 남은 TODO
- Backend Wave 6 완료 후 `VITE_USE_MOCK_API=false`로 profile/segments/job/candidate/evidence actual smoke 수행.
- Backend OpenAPI가 최종화되면 `ExtractionJobCreateRequest.provider/model_name/fixture_id`, `redaction_summary`, candidate pagination response 형태를 재확인.
- 현재 MVP 2 navigation은 deterministic fixture ID 기반 shortcut을 사용한다. 이후 project/source/job selector 상태가 생기면 최근 선택값 기반으로 대체한다.
- candidate result pagination, candidate detail drawer, evidence text highlight는 후속 Wave에서 범위 확정 필요.

## 다른 역할에 전달할 내용
- PM: expert review/publish/RAG/credential UI는 의도적으로 제외했다. evidence 없는 candidate는 `WARNING` + `MISSING_EVIDENCE` + `NOT_PUBLISHED`로만 노출된다.
- Backend: FE는 model run을 `GET /api/v1/extraction-jobs/{job_id}`의 `model_runs[]`에서 읽는다. 별도 model-run list endpoint가 필요하면 계약에 명시해 달라.
- Frontend: 업무 화면에서 `hana-style-component` 직접 import 없이 `shared/ui/hana` adapter만 사용했다. MVP 2 공통 화면 조각은 `pages/mvp2Shared.tsx`에 모았다.
- QA: dev server URL은 `http://127.0.0.1:5174/`. 주요 smoke path는 `/profile`, `/chunks`, `/extraction/new`, `/extraction-jobs`, `/candidates`, `/evidence` shortcut과 project/job/evidence detail route다.

## 총괄에게 요청하는 결정
- Backend final OpenAPI에서 `ExtractionJobDetail.model_runs[]` 포함 여부를 확정해 달라.
- MVP 2 Wave 7에서 candidate detail drawer와 evidence text highlight를 FE 범위로 넣을지 결정 필요.

## 현재 판정
- PASS
