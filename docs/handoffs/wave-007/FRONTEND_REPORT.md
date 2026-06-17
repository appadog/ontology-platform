# Frontend Report - Wave 7

## 담당 범위
- backlog ID: FE2-001, FE2-002, FE2-003, FE2-005, FE2-006, support INT2-001~INT2-003
- 작업 경로: `apps/frontend/src/shared/api`, `apps/frontend/src/shared/mocks`, `apps/frontend/src/pages`, `docs/handoffs/wave-007/FRONTEND_REPORT.md`

## 완료한 작업
- `docs/api/openapi-mvp2-draft.json` 기준으로 FE MVP 2 DTO/client/mock fixture를 재동기화했다.
- `SourceProfile`/`SourceProfileColumn` mismatch를 수정했다.
  - `SourceProfile.id` 추가.
  - `SourceProfileColumn.nullable` 추가.
  - `distinct_count`를 `distinct_count_sampled`로 변경.
- `SourceSegment.sequence`를 타입/fixture/UI에 반영했다.
- `SourceParseResponse`를 추가하고 `parseSource()` 반환 타입을 `SourceSegment[]`에서 `SourceParseResponse`로 변경했다.
- `PromptTemplate`/`PromptVersion` DTO를 OpenAPI 기준으로 수정했다.
  - `active_version_id`, `prompt_id`, `status`, `prompt_text` 의존 제거.
  - `updated_at`, `prompt_template_id`, `template`, `output_schema`, `is_active`, `created_by` 반영.
- extraction job 생성 payload를 `provider: "mock"`으로 수정했다.
  - UI label은 `MockProvider` 유지.
  - 실제 API payload는 `mock`, `model_name: "mock-deterministic"`, `fixture_id: "default"`.
- Candidate/Evidence DTO nullable shape를 OpenAPI에 맞췄다.
  - candidate `extraction_job_id` 추가.
  - nullable `class_id`, `normalized_name`, `relation_id`, `source_candidate_entity_id`, `target_candidate_entity_id` 반영.
  - evidence `created_at`, nullable `source_segment_id`, nullable `evidence_text`, numeric nullable `paragraph_id`/`chunk_id` 반영.
- profile/chunk/job/candidate/evidence 화면에서 nullable field fallback을 추가해 `undefined` 표시 위험을 줄였다.
- candidate detail drawer, evidence highlight, 고급 UX 확장, 외부 LLM provider 설정 UI, review/publish/RAG 화면은 추가하지 않았다.

## 변경 파일
- `apps/frontend/src/shared/api/types.ts`
- `apps/frontend/src/shared/api/client.ts`
- `apps/frontend/src/shared/mocks/mvp2Fixtures.ts`
- `apps/frontend/src/pages/SourceProfilingPage.tsx`
- `apps/frontend/src/pages/DocumentChunkViewerPage.tsx`
- `apps/frontend/src/pages/ExtractionJobCreatePage.tsx`
- `apps/frontend/src/pages/ExtractionJobMonitorPage.tsx`
- `apps/frontend/src/pages/CandidateResultsPage.tsx`
- `apps/frontend/src/pages/EvidenceViewerPage.tsx`
- `docs/handoffs/wave-007/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `npm run build`
  - `git diff --check -- apps/frontend docs/handoffs/wave-007/FRONTEND_REPORT.md`
  - Backend actual smoke server 준비:
    - `DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave7-frontend-smoke.db LOCAL_STORAGE_PATH=/tmp/ontology-wave7-frontend-storage .venv/bin/python - <<'PY' ... Base.metadata.create_all(bind=engine) ...`
    - `DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave7-frontend-smoke.db LOCAL_STORAGE_PATH=/tmp/ontology-wave7-frontend-storage .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8010`
  - Node fetch 기반 actual API smoke:
    - health
    - project create
    - ontology version/class/relation create
    - CSV source upload
    - profile POST/GET
    - parse POST + segments GET
    - prompt template/version create/list
    - extraction job create/run/detail
    - candidate entity/relation list
    - candidate evidence read
  - actual FE dev server:
    - `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8010 npm run dev -- --host 127.0.0.1`
  - actual FE route HTTP smoke:
    - `curl -I http://127.0.0.1:5174/projects/684ede67-cf67-4362-b5a9-ece9e436ddf6/sources/d6dfcdc3-c167-421a-9545-5491946a4e7a/profile`
    - `curl -I http://127.0.0.1:5174/projects/684ede67-cf67-4362-b5a9-ece9e436ddf6/sources/d6dfcdc3-c167-421a-9545-5491946a4e7a/chunks`
    - `curl -I http://127.0.0.1:5174/projects/684ede67-cf67-4362-b5a9-ece9e436ddf6/extraction/new`
    - `curl -I http://127.0.0.1:5174/extraction-jobs/c45fbdc9-6b8e-4d69-8631-ae6d06c8be73/candidates`
    - `curl -I http://127.0.0.1:5174/candidate-evidence/d16c2852-fb1a-4a4c-a39a-a2a167a2d3b7`
- 결과:
  - `npm run build` PASS.
  - `git diff --check` PASS.
  - actual API smoke PASS.
    - project_id: `684ede67-cf67-4362-b5a9-ece9e436ddf6`
    - source_id: `d6dfcdc3-c167-421a-9545-5491946a4e7a`
    - job_id: `c45fbdc9-6b8e-4d69-8631-ae6d06c8be73`
    - evidence_id: `d16c2852-fb1a-4a4c-a39a-a2a167a2d3b7`
    - job create: HTTP `201`, `provider=mock`, 422 없음.
    - job run: `SUCCESS`, candidate entity/relation count `2/1`, `model_runs[]` count `1`.
    - profile field check: `id`, `nullable`, `distinct_count_sampled` 확인.
    - parse response check: `SourceParseResponse` shape 확인, `segments[].sequence` 확인.
    - prompt/version check: OpenAPI에 없는 `active_version_id`, `status`, `prompt_text`, `prompt_id` 미포함 확인.
    - candidate/evidence check: `extraction_job_id`, nullable fields, evidence `created_at`, nullable/numeric locator fields 확인.
  - actual FE dev server 실행됨: `http://127.0.0.1:5174/`
  - actual FE route HTTP smoke는 모두 HTTP 200.
- 실행하지 못한 검증:
  - Browser click/render automation은 현재 callable browser tool이 없어 수행하지 못했다. 대신 actual API HTTP smoke와 Vite actual env route HTTP smoke를 수행했다.
  - Docker Compose smoke는 Frontend Wave 7 범위가 아니며 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
  - `SourceProfile`, `SourceProfileColumn`, `SourceSegment`, `SourceParseResponse`, `PromptTemplate`, `PromptVersion`, `ExtractionJobCreateRequest`, `CandidateEntity`, `CandidateRelation`, `CandidateEvidence`, `ModelRun` 타입을 OpenAPI 기준으로 수정.
  - `apiClient.parseSource()` 반환 타입을 `Promise<SourceParseResponse>`로 변경.
  - `apiClient.createExtractionJob()` actual payload에서 `provider: "mock"`을 사용하도록 UI 호출부 수정.
  - mock fixture를 OpenAPI 필드명/nullable shape와 맞춤.
- 영향받는 역할:
  - Backend: FE는 provider API value를 `mock`으로만 전송한다.
  - QA: INT2-001~INT2-003 재검증 시 위 actual smoke ID/route와 provider 422 해소를 확인하면 된다.
  - PM: Wave 7 PM decision인 provider literal/display split과 SourceParseResponse 고정이 FE에 반영되었다.

## Blocker
- FE contract sync와 actual API HTTP smoke 기준 blocker 없음.
- Browser automation tool 부재로 실제 클릭/렌더 evidence는 남기지 못했다.

## 남은 TODO
- QA가 Browser tool 또는 Playwright Chromium 사용 가능 환경에서 actual FE render/click smoke를 재수행한다.
- 실제 API mode app shell은 아직 sidebar shortcut의 deterministic fixture route가 남아 있다. 이번 Wave의 contract closeout에는 직접 blocker가 아니지만, Wave 8에서 최근/선택 project 기반 shortcut으로 개선할 수 있다.
- invalid evidence reference fixture는 Backend/QA runtime smoke 범위다. FE는 nullable/broken evidence fallback만 유지한다.

## 다른 역할에 전달할 내용
- PM:
  - provider split(`mock` API value, `MockProvider` display label) 반영 완료.
  - candidate detail drawer/evidence highlight/review/publish/RAG scope는 열지 않았다.
- Backend:
  - FE actual job creation은 `provider: "mock"`, `model_name: "mock-deterministic"`, `fixture_id: "default"`로 전송한다.
  - `GET /api/v1/extraction-jobs/{job_id}`의 `model_runs[]`를 monitor의 model run source로 유지한다.
- Frontend:
  - `parseSource()`는 summary만 반환한다. 화면의 segment list는 `useSourceSegments()` / GET `/segments` 경계를 사용한다.
  - `PromptVersion.is_active`를 display status로 사용한다.
- QA:
  - 실제 API smoke에서 job create 201/provider=mock을 확인했다.
  - Browser 자동화만 환경 제약으로 미수행이므로, 가능한 환경에서 profile/chunks/job/candidates/evidence route 클릭 확인을 부탁한다.

## 총괄에게 요청하는 결정
- 없음.

## 현재 판정
- PASS
