# Frontend Report - Wave 8

## 담당 범위
- backlog ID: FE2-004, FE2-005, FE2-006, support INT2-002~INT2-004, support FE-005, FE-014
- 작업 경로: `apps/frontend/src/app`, `apps/frontend/src/pages`, `apps/frontend/src/shared/api`, `apps/frontend/src/shared/layout`

## 완료한 작업
- PM Wave 8 decision을 기준으로 LNB를 top-level 업무 영역만 남기는 구조로 정리했다.
- fixture ID 중심 shortcut route를 제거하고 selected/recent project 기반 navigation으로 전환했다.
- ID 기반 화면은 source/job/candidate/evidence parent context와 breadcrumb를 통해 drilldown으로 보이게 했다.
- Ontology modeler draft version에서 class/property/relation 생성, 수정, 삭제 UX를 추가했다.
- published/archived ontology version은 edit/delete를 비활성화하고 `Create Draft Version` CTA를 제공한다.
- ontology class 삭제 confirm에 class명, 관련 property 수, inbound/outbound relation 수를 표시한다.
- 삭제 후 graph/list/detail selection이 안전하게 갱신되도록 처리했다.
- `PATCH/DELETE` ontology class/property/relation API client와 mutation hook을 추가했다.
- Source detail에서 profile, chunks, extraction job 생성으로 이어지는 업무 흐름을 보강했다.
- Project detail에서 Ontology, Sources, Extraction 진입점을 연결했다.
- Candidate result 화면에 선택 row 기반 detail panel을 추가했다.
- Evidence viewer에 row/cell, paragraph/chunk locator highlight와 missing/broken locator fallback을 추가했다.
- Retry-chain dedupe 결과를 job monitor와 candidate detail에서 오해 없이 표시하도록 했다.
- review/publish workflow, external LLM provider 설정 UI, RAG 화면은 추가하지 않았다.

## 변경 파일
- `apps/frontend/src/app/router.tsx`
- `apps/frontend/src/pages/OntologyModelerPage.tsx`
- `apps/frontend/src/pages/CandidateResultsPage.tsx`
- `apps/frontend/src/pages/EvidenceViewerPage.tsx`
- `apps/frontend/src/pages/ExtractionJobCreatePage.tsx`
- `apps/frontend/src/pages/ExtractionJobMonitorPage.tsx`
- `apps/frontend/src/pages/ProjectDetailPage.tsx`
- `apps/frontend/src/pages/SourceManagerPage.tsx`
- `apps/frontend/src/pages/SourceDetailPage.tsx`
- `apps/frontend/src/pages/SourceProfilingPage.tsx`
- `apps/frontend/src/pages/DocumentChunkViewerPage.tsx`
- `apps/frontend/src/shared/api/types.ts`
- `apps/frontend/src/shared/api/client.ts`
- `apps/frontend/src/shared/api/queries.ts`
- `apps/frontend/src/shared/layout/AppShell.tsx`
- `apps/frontend/src/shared/layout/navigation.ts`
- `apps/frontend/src/shared/layout/Breadcrumbs.tsx`
- `docs/handoffs/wave-008/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `npm run build`
  - `git diff --check -- apps/frontend docs/handoffs/wave-008/FRONTEND_REPORT.md`
  - Backend actual smoke server 준비:
    - `DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave8-frontend-smoke.db LOCAL_STORAGE_PATH=/tmp/ontology-wave8-frontend-storage .venv/bin/python - <<'PY' ... Base.metadata.create_all(bind=engine) ...`
    - `DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave8-frontend-smoke.db LOCAL_STORAGE_PATH=/tmp/ontology-wave8-frontend-storage .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8011`
  - Node fetch 기반 actual API smoke:
    - health
    - project create
    - ontology draft version create
    - class/property/relation create
    - class/property/relation patch
    - class/property/relation delete
    - graph refetch and deleted element absence check
    - CSV source upload/profile/parse/segments
    - prompt/version create
    - extraction job create/run
    - partial failed job retry/run
    - candidate entity/relation list
    - candidate evidence read
  - actual FE dev server:
    - `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8011 npm run dev -- --host 127.0.0.1 --port 5176`
  - actual FE route HTTP smoke:
    - `/projects/bae23e26-7e30-4591-bd57-153e53911db7/ontology`
    - `/projects/bae23e26-7e30-4591-bd57-153e53911db7/sources`
    - `/projects/bae23e26-7e30-4591-bd57-153e53911db7/sources/53f288eb-790e-4f75-96ac-299f5dd9e84d`
    - `/projects/bae23e26-7e30-4591-bd57-153e53911db7/sources/53f288eb-790e-4f75-96ac-299f5dd9e84d/profile`
    - `/projects/bae23e26-7e30-4591-bd57-153e53911db7/sources/53f288eb-790e-4f75-96ac-299f5dd9e84d/chunks`
    - `/projects/bae23e26-7e30-4591-bd57-153e53911db7/extraction/new`
    - `/projects/bae23e26-7e30-4591-bd57-153e53911db7/extraction-jobs`
    - `/extraction-jobs/9c1730af-132a-4920-aea0-b13bef1ce9d3`
    - `/extraction-jobs/9c1730af-132a-4920-aea0-b13bef1ce9d3/candidates`
    - `/candidate-evidence/6faa6189-8a53-4e83-9f14-e78f404d91a6`
- 결과:
  - `npm run build` PASS.
  - `git diff --check` PASS.
  - actual API smoke PASS.
    - project_id: `bae23e26-7e30-4591-bd57-153e53911db7`
    - ontology_version_id: `f5bf7825-975c-44fe-80cc-002d43d74894`
    - source_id: `53f288eb-790e-4f75-96ac-299f5dd9e84d`
    - job_id: `9c1730af-132a-4920-aea0-b13bef1ce9d3`
    - partial retry job_id: `e2a7e970-120e-4e3c-991d-d247492ca643`
    - evidence_id: `6faa6189-8a53-4e83-9f14-e78f404d91a6`
    - ontology update/delete: class/property/relation PATCH 200, DELETE 200, graph refetch에서 삭제 element 미노출 확인.
    - retry-chain dedupe: partial retry run에서 `retry_of_job_id` 확인, backend message `Retry-chain dedupe reused/skipped 4 candidate(s)...` 확인.
  - actual FE dev server 실행됨: `http://127.0.0.1:5176/`
  - actual FE route HTTP smoke는 모두 HTTP 200.
- 실행하지 못한 검증:
  - Browser click/render automation은 현재 callable browser tool이 없어 수행하지 못했다.
  - 실제 클릭 대신 actual API HTTP smoke와 Vite actual env route HTTP smoke를 수행했다.
  - actual evidence sample은 `source_segment_id`와 text offset은 있으나 row/cell/paragraph/chunk locator가 null인 SHEET evidence였다. UI fallback을 actual data로 확인했고, row/cell 또는 paragraph/chunk locator가 오면 highlight가 표시되도록 구현했다.

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
  - 추가 DTO:
    - `OntologyClassUpdateRequest`
    - `OntologyPropertyUpdateRequest`
    - `OntologyRelationUpdateRequest`
  - 추가 client/query boundary:
    - `PATCH /api/v1/ontology/classes/{class_id}`
    - `DELETE /api/v1/ontology/classes/{class_id}`
    - `PATCH /api/v1/ontology/properties/{property_id}`
    - `DELETE /api/v1/ontology/properties/{property_id}`
    - `PATCH /api/v1/ontology/relations/{relation_id}`
    - `DELETE /api/v1/ontology/relations/{relation_id}`
  - enum/status string은 기존 Glossary/OpenAPI 값을 유지했고 새 enum은 추가하지 않았다.
  - mock API도 update/delete 후 `OntologyGraph.nodes[]`, `edges[]`, `properties[]`, `classes[]`, `relations[]`를 실제 화면 기대와 맞게 갱신한다.
- 영향받는 역할:
  - Backend: FE는 draft version에서만 update/delete action을 활성화한다. published/archived API conflict는 UI에서 사전 차단한다.
  - QA: actual API mode에서 ontology CRUD와 retry-chain dedupe 표시를 우선 재확인하면 된다.
  - PM: LNB top-level, breadcrumb, primary action 중심 흐름으로 Wave 8 IA decision을 반영했다.

## Blocker
- FE build, actual API smoke, actual FE route smoke 기준 blocker 없음.
- Browser automation tool 부재로 클릭/시각 렌더 자동화는 미수행.

## 남은 TODO
- QA 환경에서 Browser/Playwright 클릭 smoke를 수행해 modeler edit/delete confirmation, candidate detail panel, evidence fallback/highlight 렌더를 확인한다.
- Backend evidence DTO가 row/cell 또는 paragraph/chunk locator를 포함하는 fixture/API sample을 제공하면 highlight happy path를 실제 데이터로 추가 확인한다.
- Candidate list pagination이나 advanced drawer UX는 이번 Wave 제한에 따라 확장하지 않았다.

## 다른 역할에 전달할 내용
- PM:
  - LNB는 Dashboard, Projects, Ontology, Sources, Extraction, Candidates만 남겼다.
  - ID 화면은 row/action/breadcrumb로 접근한다.
  - 긴 설명문 대신 breadcrumb, primary action, empty action으로 흐름을 보강했다.
- Backend:
  - update/delete ontology endpoints actual smoke PASS.
  - delete는 soft delete response를 받지만 FE는 graph refetch 후 삭제 element가 list/graph에서 사라지는 것을 기준으로 처리한다.
  - evidence highlight happy path를 위해 row/cell 또는 paragraph/chunk locator가 채워진 evidence sample이 있으면 QA가 더 정확히 볼 수 있다.
- Frontend:
  - 업무 화면에서 `hana-style-component` 직접 import는 추가하지 않았다.
  - selected/recent project는 `localStorage` key `ontology-platform:recent-project-id`로 유지한다.
  - `/ontology`, `/sources`, `/extraction`, `/candidates` flat route는 fixture redirect 대신 `/projects`로 보낸다.
- QA:
  - actual smoke IDs는 위 실행/검증 섹션을 사용하면 된다.
  - partial retry job에서 dedupe message와 `retry_of_job_id`가 확인된다.
  - browser tool이 있는 환경에서는 `/projects/{project_id}/ontology`에서 draft class/property/relation 수정/삭제와 read-only 상태를 클릭으로 확인해 달라.

## 총괄에게 요청하는 결정
- 없음.

## 현재 판정
- PASS
