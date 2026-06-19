# Frontend Report - Wave 9

## 담당 범위
- backlog ID: FE-005, FE-014, FE2-006, support INT2-002
- 작업 경로: `apps/frontend/src/pages`, `apps/frontend/src/shared/layout`, `docs/handoffs/wave-009/FRONTEND_REPORT.md`

## 완료한 작업
- PM Wave 9 decision과 Wave 8 QA findings를 먼저 확인했다.
- Backend Wave 9 report는 작업 시작 시점에 `PENDING`이었다. 다만 현재 backend worktree 기준 actual API smoke에서 orphan property fix가 통과되는지 확인했다.
- Ontology modeler class delete confirm copy를 보강했다.
  - class label/name 표시.
  - affected property count 표시.
  - inbound relation count 표시.
  - outbound relation count 표시.
  - current DRAFT version에만 적용된다는 문구 표시.
- property/relation delete confirm에도 target name과 draft-only 적용 문구를 추가했다.
- Ontology graph UI에서 deleted/orphan element를 방어적으로 필터링했다.
  - deleted class에 연결된 orphan property를 `visibleProperties`에서 제외.
  - deleted class에 연결된 edge/relation을 `visibleEdges`/`relationRecords`에서 제외.
  - 삭제 후 selection은 기존처럼 다음 class 또는 clear 상태로 안전하게 갱신한다.
- Candidate result에서 evidence viewer link에 parent context query를 전달하도록 보강했다.
  - `project_id`, `source_id`, `job_id`, `candidate_id`, `candidate_kind`, `validation_code`, 가능한 경우 `source_segment_id`.
- Evidence viewer breadcrumb/fallback context를 보강했다.
  - 정상 route에서 project/source/job/candidate/evidence breadcrumb를 가능한 범위로 표시.
  - broken/direct route fallback에서 evidence id, source id, source segment id, validation code, candidate context를 표시.
  - parent candidate/job/source/projects 복귀 action을 제공.
- LNB는 top-level 업무 영역만 유지했다.
  - ID detail route는 LNB에 추가하지 않았다.
  - `/ontology`, `/sources`, `/extraction`, `/candidates` flat route는 project 선택으로 유도하는 기존 구조를 유지했다.

## 변경 파일
- Wave 9 직접 수정:
  - `apps/frontend/src/pages/OntologyModelerPage.tsx`
  - `apps/frontend/src/pages/CandidateResultsPage.tsx`
  - `apps/frontend/src/pages/EvidenceViewerPage.tsx`
  - `docs/handoffs/wave-009/FRONTEND_REPORT.md`
- 참고:
  - worktree에는 Wave 8에서 이어진 frontend 변경 파일들이 함께 남아 있다. 이번 Wave 9에서는 위 targeted hardening 파일만 추가로 수정했다.

## 실행/검증
- 실행한 명령:
  - `npm run build`
  - `git diff --check -- apps/frontend docs/handoffs/wave-009/FRONTEND_REPORT.md`
  - Backend actual smoke server 준비:
    - `DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave9-frontend-smoke.db LOCAL_STORAGE_PATH=/tmp/ontology-wave9-frontend-storage .venv/bin/python - <<'PY' ... Base.metadata.create_all(bind=engine) ...`
    - `DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave9-frontend-smoke.db LOCAL_STORAGE_PATH=/tmp/ontology-wave9-frontend-storage .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8012`
  - Node fetch actual API smoke:
    - project create
    - ontology draft version create
    - class/property/inbound relation/outbound relation create
    - class delete
    - graph refetch orphan property/connected relation absence check
    - source upload/profile/parse/segments
    - prompt/version create
    - extraction job create/run with `fixture_id=invalid_evidence_reference`
    - candidate entity/relation list
    - candidate evidence read
  - actual FE dev server:
    - `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8012 npm run dev -- --host 127.0.0.1 --port 5177 --strictPort`
  - actual FE route HTTP smoke:
    - `/projects/ec05f5e3-b093-4b56-83b9-c661029648b7/ontology`
    - `/projects/ec05f5e3-b093-4b56-83b9-c661029648b7/sources`
    - `/projects/ec05f5e3-b093-4b56-83b9-c661029648b7/sources/bd26d4e9-3d6d-4068-ba07-7bb128503343`
    - `/projects/ec05f5e3-b093-4b56-83b9-c661029648b7/sources/bd26d4e9-3d6d-4068-ba07-7bb128503343/profile`
    - `/projects/ec05f5e3-b093-4b56-83b9-c661029648b7/sources/bd26d4e9-3d6d-4068-ba07-7bb128503343/chunks`
    - `/projects/ec05f5e3-b093-4b56-83b9-c661029648b7/extraction-jobs`
    - `/extraction-jobs/1ab7c9f5-de2c-471e-83b3-aa0baac2fe90`
    - `/extraction-jobs/1ab7c9f5-de2c-471e-83b3-aa0baac2fe90/candidates`
    - `/candidate-evidence/af1aed66-ecc1-435a-8e75-d5764d12512f?...context`
    - `/candidate-evidence/invalid-evidence-reference?...context`
    - `/ontology`
    - `/candidates`
  - Playwright CLI screenshot smoke:
    - broken evidence fallback route
    - ontology modeler route
- 결과:
  - `npm run build` PASS.
  - `git diff --check` PASS.
  - actual API smoke PASS.
    - project_id: `ec05f5e3-b093-4b56-83b9-c661029648b7`
    - ontology_version_id: `6c5d94d8-7cea-4f2a-a258-67093ae2a62e`
    - deleted_class_id: `8ecb37af-7ad7-4aa7-b11a-3c56d090c3b8`
    - graph refetch result: `orphanProperties=0`, `connectedRelations=0`
    - source_id: `bd26d4e9-3d6d-4068-ba07-7bb128503343`
    - job_id: `1ab7c9f5-de2c-471e-83b3-aa0baac2fe90`
    - broken evidence candidate validation: `INVALID_EVIDENCE_REFERENCE`
  - actual FE route HTTP smoke는 모두 HTTP 200.
  - Playwright screenshot smoke PASS.
    - `/tmp/ontology-wave9-frontend-screenshots/evidence-broken.png`
    - `/tmp/ontology-wave9-frontend-screenshots/ontology-modeler.png`
- 실행하지 못한 검증:
  - Playwright dialog automation으로 `window.confirm` 내용을 실제 클릭 캡처하지는 못했다. Confirm copy는 코드 기준으로 검증했고 build PASS로 타입 확인했다.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - 신규 endpoint, enum, DTO는 추가하지 않았다.
  - Evidence parent context는 route query로 전달하며 API contract를 변경하지 않는다.
  - Delete confirmation count는 기존 graph DTO 기반으로 계산한다.
- 영향받는 역할:
  - QA: delete confirm copy는 browser/dialog automation 또는 수동 확인이 필요하다.
  - Backend: actual smoke는 현재 backend worktree 기준 orphan fix PASS를 확인했다. Backend report는 아직 `PENDING`이었다.

## Blocker
- Frontend targeted hardening 기준 blocker 없음.
- Backend Wave 9 report가 아직 `PENDING`이므로 최종 통합 판정은 Backend report 작성 후 QA가 확인해야 한다.
- Docker CLI 검증은 이번 Frontend 범위가 아니며 기존 environment exception 유지.

## 남은 TODO
- QA:
  - confirm dialog copy를 실제 브라우저에서 확인한다.
  - broken evidence fallback에서 source id, source segment id, validation code, Back to candidates/job/source action을 확인한다.
  - LNB에 ID-bound route가 노출되지 않는지 재확인한다.
- Backend:
  - Wave 9 backend report를 완료해 orphan fix 구현/테스트 결과를 공식화한다.

## 다른 역할에 전달할 내용
- PM:
  - Wave 9 PM acceptance의 delete confirm/context fallback 요구사항을 frontend에서 반영했다.
- Backend:
  - frontend는 graph read path가 혹시 orphan payload를 반환해도 visible list/canvas/detail에서 방어적으로 제외한다.
  - actual smoke 기준 현재 backend graph refetch는 orphan property/connected relation을 반환하지 않았다.
- Frontend:
  - evidence viewer context는 query 기반이다. 앱 내 evidence link를 만들 때 `buildEvidencePath`를 통해 parent context를 함께 넘긴다.
  - direct evidence URL은 context가 없을 수 있으므로 `/projects` recovery action을 유지한다.
- QA:
  - screenshot evidence는 `/tmp/ontology-wave9-frontend-screenshots/`에 있다.
  - actual smoke IDs는 실행/검증 섹션을 그대로 사용하면 된다.

## 총괄에게 요청하는 결정
- 없음.

## 현재 판정
- PASS
