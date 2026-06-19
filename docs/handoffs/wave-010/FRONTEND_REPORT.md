# Frontend Report - Wave 10

## 담당 범위
- backlog ID: FE2-001, FE2-002, FE2-003, FE2-004, FE2-005, FE2-006
- 작업 경로: `apps/frontend/`, `docs/handoffs/wave-010/FRONTEND_REPORT.md`

## 완료한 작업
- PM Wave 10 report와 Backend Wave 10 report를 확인한 뒤 작업했다.
- Source detail에서 profile, chunks, extraction job으로 이어지는 `Next steps` CTA와 상태 배지를 추가했다.
- Extraction job creation에서 fixture catalog 선택 UI를 추가했다.
  - `default`
  - `partial_invalid`
  - `invalid_evidence_reference`
  - `missing`
- Mock API mode에서도 생성된 job이 선택 fixture별 status/candidate/evidence/model run metadata를 재현하도록 `shared/api/client.ts` mock store를 보강했다.
- Job monitor UX를 보강했다.
  - run/retry button 활성 조건을 job status 기준으로 정리했다.
  - fixture, retry chain, model run dedupe summary를 읽기 쉽게 표시했다.
  - Backend actual dedupe payload의 `skipped_duplicate_candidates`, `reused_evidence`도 표시하도록 formatter를 맞췄다.
- Candidate results에 browsing filter를 추가했다.
  - entity/relation kind filter
  - validation status filter
  - validation code filter
  - evidence presence filter
- Evidence viewer의 existing parent context/fallback 흐름은 유지하고 user-facing copy를 정리했다.
- Source profile/chunk/evidence/job/candidate 화면의 endpoint/debug 중심 문구를 CTA/status/breadcrumb 중심 문구로 낮췄다.
- LNB는 기존 top-level 업무 영역 구조를 유지했고 ID-bound detail route를 LNB에 추가하지 않았다.

## 변경 파일
- `apps/frontend/src/shared/api/client.ts`
- `apps/frontend/src/pages/SourceDetailPage.tsx`
- `apps/frontend/src/pages/SourceProfilingPage.tsx`
- `apps/frontend/src/pages/DocumentChunkViewerPage.tsx`
- `apps/frontend/src/pages/ExtractionJobCreatePage.tsx`
- `apps/frontend/src/pages/ExtractionJobMonitorPage.tsx`
- `apps/frontend/src/pages/CandidateResultsPage.tsx`
- `apps/frontend/src/pages/EvidenceViewerPage.tsx`
- `docs/handoffs/wave-010/FRONTEND_REPORT.md`
- 참고: worktree에는 Backend/PM Wave 10 변경 파일도 함께 남아 있으나 Frontend 작업 범위 밖이라 수정하지 않았다.

## 실행/검증
- 실행한 명령:
  - `cd apps/frontend && npm run build`
  - `git diff --check -- apps/frontend docs/handoffs/wave-010/FRONTEND_REPORT.md`
  - Backend actual smoke server 준비:
    - `DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave10-frontend-smoke.db LOCAL_STORAGE_PATH=/tmp/ontology-wave10-frontend-storage .venv/bin/python - <<'PY' ... Base.metadata.create_all(bind=engine) ...`
    - `DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave10-frontend-smoke.db LOCAL_STORAGE_PATH=/tmp/ontology-wave10-frontend-storage CORS_ORIGINS='["http://localhost:5173","http://127.0.0.1:5173","http://127.0.0.1:5177"]' .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8013`
  - Node fetch actual API smoke:
    - project create
    - ontology draft/class/property/relation create
    - CSV source upload
    - source profile/parse/segments
    - prompt template/version create
    - extraction job create/run for `default`, `partial_invalid`, `invalid_evidence_reference`, `missing`
    - candidate entity/relation filters
    - candidate evidence read
    - retry/run and dedupe summary read
  - actual FE dev server:
    - `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8013 npm run dev -- --host 127.0.0.1 --port 5177 --strictPort`
  - actual FE route HTTP smoke:
    - 15 routes including source detail/profile/chunks, extraction new/list/detail, candidate results, evidence viewer, top-level redirects.
  - Browser click/screenshot smoke:
    - `NODE_PATH=/Users/hanati/.npm/_npx/365efcc0fbef4592/node_modules node - <<'NODE' ... playwright chromium ...`
- 결과:
  - `npm run build`: PASS.
  - `git diff --check`: PASS.
  - actual API smoke: PASS.
    - project_id: `224ac223-8c22-4d76-bb11-2fb643e87862`
    - source_id: `70f45e55-af42-4768-85e3-a584ccc20711`
    - default job: `b29c4cbf-73b7-45ee-8ea4-a70e329a3040` / `SUCCESS`
    - partial_invalid job: `841bc6ba-cb1c-4cfd-8b87-349bbd3665b4` / `PARTIAL_FAILED`
    - invalid_evidence_reference job: `5365645b-1baa-4cf3-a3d9-4e9e88884983` / `PARTIAL_FAILED`
    - missing job: `39727259-891b-428f-a041-1a8cc9677e28` / `FAILED` / `MOCK_FIXTURE_NOT_FOUND`
    - retry job: `12043502-05bc-4dc2-b9ba-86abbca76fb7` / dedupe raw_response 확인
  - actual FE route HTTP smoke: PASS.
  - Browser click/screenshot smoke: PASS.
    - source detail → profile
    - extraction job create with `invalid_evidence_reference`
    - job run → partial failed monitor
    - candidate validation code filter
    - evidence viewer
    - direct broken evidence fallback
  - Browser evidence:
    - `/tmp/ontology-wave10-frontend-browser/job-monitor.png`
    - `/tmp/ontology-wave10-frontend-browser/candidates-filtered.png`
    - `/tmp/ontology-wave10-frontend-browser/evidence-viewer.png`
    - `/tmp/ontology-wave10-frontend-browser/broken-fallback.png`
- 실행하지 못한 검증:
  - Docker Compose smoke는 수행하지 않았다. 기존 Docker CLI environment exception을 유지하며, 이번 Frontend Wave 10 acceptance는 SQLite actual API smoke와 browser click/screenshot smoke로 검증했다.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - OpenAPI, Backend DTO, enum 변경 없음.
  - FE mock API boundary는 fixture catalog 재현을 위해 내부 mock store와 generated candidate/evidence/model run artifact를 보강했다.
  - Candidate validation code filter는 Backend 계약 변경 없이 FE client-side filter로 추가했다.
- 영향받는 역할:
  - Backend: 추가 계약 요청 없음.
  - QA: actual API fixture catalog와 FE browser smoke 경로로 Wave 10 local demo regression 검증 가능.

## Blocker
- 없음.
- 참고: 처음 browser smoke 시 actual FE port `5177`이 Backend CORS 기본 origin에 없어 source detail이 로드되지 않았다. Backend smoke server를 `CORS_ORIGINS`에 `http://127.0.0.1:5177` 포함해 재기동한 뒤 PASS했다.

## 남은 TODO
- Playwright가 frontend devDependency에 고정되어 있지 않아 이번에도 npx cache `NODE_PATH`로 실행했다. 후속 wave에서 browser smoke tooling을 devDependency 또는 공식 QA harness로 고정하면 재현성이 더 좋아진다.
- Backend actual `invalid_evidence_reference`는 evidence detail 200과 metadata mismatch로 broken context를 제공한다. FE direct fallback은 별도 not-found route로 계속 방어한다.

## 다른 역할에 전달할 내용
- PM: Wave 10 source → extraction → candidate → evidence 흐름은 actual API와 browser click smoke 기준 PASS다. fixture catalog도 UI에서 선택 가능하다.
- Backend: 추가 API 변경 요청 없음. Dedupe UI는 actual `raw_response.dedupe.skipped_duplicate_candidates`와 `reused_evidence`를 읽는다.
- Frontend: 화면에서 `hana-style-component` 직접 import는 추가하지 않았다. 기존 hana/platform adapter만 사용했다.
- QA: screenshot 증적 4개와 actual smoke IDs를 기준으로 재현 가능하다. Direct broken fallback은 `/candidate-evidence/not-found-wave10?...` 경로로 확인했다.

## 총괄에게 요청하는 결정
- 없음.

## 현재 판정
- PASS
