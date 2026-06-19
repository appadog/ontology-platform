# MVP 2 Draft Backlog

Status: `WAVE 11 CLOSEOUT PREPARATION READY / CONTRACT STILL DRAFT`

This backlog is now in MVP 2 closeout preparation. The contract is still draft, but Wave 11 uses `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md` as the shared closeout checklist, regression matrix, demo script, release-note exclusions, and exception policy. Wave 11 must not expand runtime product scope unless a closeout blocker clearly requires it.

## MVP 2 Entry Gate

- [x] MVP 1 `INT-001`, `INT-002`, and `INT-003` are PASS or explicitly accepted as PM exceptions.
- [x] `/api/v1/dashboard` has been removed from Frontend actual API mode or isolated as mock-only/P1 boundary. Backend does not add the endpoint for MVP 1.
- [x] Source upload/list/detail/preview actual FE-to-BE smoke is PASS.
- [x] Ontology draft/class/property/relation actual API smoke is PASS.
- [x] Browser click smoke is PASS, or manual UAT evidence plus not-run reason is accepted by PM.
- [x] `docs/api/openapi-mvp1.json` remains the canonical and fresh MVP 1 OpenAPI artifact.
- [x] Remaining MVP 1 blockers do not change MVP 2 source/evidence/extraction/candidate domain assumptions.
- [x] Docker/local infra status is either PASS or documented as an accepted environment exception.

## PM Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| PM2-001 | P0 | PM | Extraction user flow | MVP1 acceptance | source 선택 → profile/parse → ontology/prompt 선택 → job 생성/실행 → monitor → candidate/evidence 확인 흐름이 `docs/pm/MVP2_PREP_BRIEF.md`에 정의됨 |
| PM2-002 | P0 | PM | LLM output JSON schema | PM2-001 | candidate entity/relation/evidence JSON shape, evidence ids, validation status/code가 API draft에 정의됨 |
| PM2-003 | P0 | PM | Evidence policy | PM2-001 | 정상 후보는 evidence 필수, evidence 없는 후보는 warning-only 저장 기준이 정의됨 |
| PM2-004 | P1 | PM | Failure/retry policy | PM2-001 | `ExtractionJobStatus` lifecycle, partial failure, retry/idempotency 기준이 정의됨 |
| PM2-005 | P1 | PM | Mock provider acceptance | PM2-002 | deterministic fixture, missing fixture failure, repeated run stability 기준이 정의됨 |

## Backend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| BE2-001 | P0 | Backend | SourceSegment model | MVP1 SourceData | `SourceSegmentType` 전체 값(`SHEET`, `ROW`, `CELL`, `PAGE`, `SECTION`, `PARAGRAPH`, `CHUNK`)이 저장됨 |
| BE2-002 | P0 | Backend | CSV/Excel profiling | BE2-001 | columns, inferred type, null ratio, distinct count, sample values 반환 |
| BE2-003 | P0 | Backend | TXT/PDF parsing and chunking | BE2-001 | TXT/PDF text chunks with metadata 생성 |
| BE2-004 | P0 | Backend | PromptTemplate/PromptVersion | none | prompt version CRUD와 active version 조회 가능 |
| BE2-005 | P0 | Backend | ExtractionJob/ModelRun | BE2-004 | job 생성, 상태 조회, model run metadata 저장 |
| BE2-006 | P0 | Backend | LLM provider interface and MockProvider | BE2-005 | 외부 LLM 없이 deterministic candidate 결과 생성 |
| BE2-007 | P0 | Backend | CandidateEntity/Relation/Evidence persistence | BE2-006 | 후보와 evidence가 DB에 저장되고 조회됨 |
| BE2-008 | P1 | Backend | Extraction job runner | BE2-005, BE2-006 | sync/local worker 방식으로 job status transition 검증 |
| BE2-009 | P1 | Backend | MVP2 OpenAPI export | BE2-001~BE2-008 | `docs/api/openapi-mvp2-draft.json` 또는 후속 export가 생성됨 |

## Frontend Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| FE2-001 | P0 | Frontend | Source profiling screen | BE2-002 | 컬럼 프로파일과 sample values를 볼 수 있음 |
| FE2-002 | P0 | Frontend | Document chunk viewer | BE2-003 | page/section/chunk 목록과 metadata를 볼 수 있음 |
| FE2-003 | P0 | Frontend | Extraction job creation screen | BE2-004, BE2-005 | source, ontology version, prompt, model, scope 선택 후 job 생성 |
| FE2-004 | P0 | Frontend | Extraction job monitor | BE2-005 | status, progress, failure reason 표시 |
| FE2-005 | P0 | Frontend | Candidate result view | BE2-007 | candidate entity/relation list와 evidence 표시 |
| FE2-006 | P1 | Frontend | Evidence viewer UI | BE2-007 | source text/table row/chunk evidence를 확인 가능 |

## QA Backlog

| ID | Priority | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|---|
| INT2-001 | P0 | QA | Profiling contract review | BE2-002, FE2-001 | OpenAPI/profile fixture/UI fields가 일치 |
| INT2-002 | P0 | QA | Chunk/evidence traceability | BE2-003, BE2-007 | candidate evidence가 source segment로 추적됨 |
| INT2-003 | P0 | QA | Mock extraction flow | BE2-006, FE2-003, FE2-004 | MockProvider로 job 생성부터 후보 조회까지 통과 |
| INT2-004 | P1 | QA | Failure/retry smoke | BE2-008 | failed/partial/retry status가 검증됨 |

## MVP 2 Acceptance Draft

- CSV/Excel에서 컬럼 프로파일링 결과를 볼 수 있다.
- TXT/PDF를 chunk 단위로 볼 수 있다.
- Mock LLM으로 후보 엔티티/관계가 생성된다.
- 모든 후보는 source/evidence 참조를 가진다.
- ExtractionJob 상태를 UI에서 확인할 수 있다.

## Wave 11 Closeout Preparation

Wave 11 is not a feature expansion wave. Closeout readiness is judged against `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`.

- `PM2-001` Extraction user flow closes when the demo script covers project/draft ontology, source profile/parse, prompt version selection, mock extraction, job monitor, candidate browsing, evidence viewer, retry, and contextual navigation.
- `PM2-002` LLM output schema closes when fixture-backed candidate entity/relation/evidence output remains aligned with the API draft and OpenAPI artifact, with no external provider dependency.
- `PM2-003` Evidence policy closes when normal, missing, broken, and direct missing evidence paths preserve available context and recovery actions.
- `PM2-004` Failure/retry policy closes when `PARTIAL_FAILED`, `FAILED`, `MOCK_FIXTURE_NOT_FOUND`, retry-chain state, and dedupe behavior pass actual API and UI smoke.
- `PM2-005` Mock provider acceptance closes when the four fixture catalog entries are reproducible: `default`, `partial_invalid`, `invalid_evidence_reference`, and `missing`.
- `INT2-001`~`INT2-004` are the QA-owned closeout regression gates for profile contract, chunk/evidence traceability, mock extraction flow, and failure/retry smoke.
- Docker Compose smoke remains a P1 environment gate. If Docker CLI is absent, QA may close MVP 2 as `PASS WITH EXCEPTION` when product regression passes.
- Browser smoke tooling may remain temporary for MVP 2 closeout if Frontend and QA report exact commands, routes, screenshots, and logs.

## Wave 6 Contract Decisions

- `SourceSegment.segment_type`은 `SourceSegmentType`을 사용한다: `SHEET`, `ROW`, `CELL`, `PAGE`, `SECTION`, `PARAGRAPH`, `CHUNK`.
- `SourceProfileColumn.inferred_type`은 `ProfileInferredType`을 사용한다. `PropertyDataType`을 직접 재사용하지 않는다.
- `ExtractionJob.status`는 `ExtractionJobStatus`, `ModelRun.status`는 `ModelRunStatus`를 사용한다.
- Candidate `validation_status`, `review_status`, `publish_status`는 각각 `ValidationStatus`, `CandidateReviewStatus`, `PublishStatus`를 사용한다.
- MVP 2에서는 `review_status=PENDING`, `publish_status=NOT_PUBLISHED`만 실제 workflow 값으로 사용한다.
- Evidence 없는 candidate는 저장 가능하지만 정상 후보가 아니며 `validation_status=WARNING`, `validation_codes=["MISSING_EVIDENCE"]`가 필수다.
- Evidence 참조가 깨진 candidate는 `validation_status=FAILED`, `validation_codes=["INVALID_EVIDENCE_REFERENCE"]`를 사용한다.
- MockProvider는 deterministic fixture 기반이며 같은 input/fixture는 같은 candidate content와 evidence locator를 반환해야 한다.
- `ModelRun.raw_request`/`raw_response`는 masked JSON만 저장한다. secret/API key/token/signed URL/raw full source text는 저장하지 않는다.

## Remaining Draft Risks

- Candidate 조회는 extraction-job 하위 endpoint만으로 충분한지, project/source/ontology_version filter가 필요한지 FE와 함께 확인해야 한다.
- Candidate confidence scale과 threshold는 first thin slice QA 이후 조정할 수 있다.
- PDF parsing library와 chunking default size/overlap은 thin slice 구현 결과를 보고 확정한다.

## Wave 6 QA Findings

Wave 6 thin slice 결과는 `PARTIAL`이다. Backend/API core는 동작하지만 FE actual API mode closeout 전 아래 항목을 Wave 7에서 정리한다.

- `SourceProfile.id`, `SourceProfileColumn.nullable`, `SourceProfileColumn.distinct_count_sampled`를 FE type/fixture/UI에 반영한다.
- `SourceSegment.sequence`와 `SourceParseResponse`를 FE type/client에 반영한다.
- `PromptTemplate`/`PromptVersion` DTO를 OpenAPI 기준으로 재동기화한다.
- MVP 2 provider API literal은 `mock`이다. `MockProvider`는 UI display label로만 사용한다.
- `CandidateEntity`, `CandidateRelation`, `CandidateEvidence`의 nullable fields, `created_at`, `extraction_job_id`, numeric paragraph/chunk id를 FE type/fixture에 반영한다.
- `INVALID_EVIDENCE_REFERENCE`를 재현할 deterministic fixture 또는 test hook 추가 여부를 PM/Backend가 Wave 7에서 확정한다.
- Retry no-duplicate natural key 범위를 PM이 Wave 7에서 확정한다.

## Wave 7 QA Findings

Wave 7 actual API contract sync는 `PASS`다.

- `INT2-001` Profiling contract review: PASS.
- `INT2-002` Chunk/evidence traceability: PASS.
- `INT2-003` Mock extraction flow: PASS.
- `INT2-004` Failure/retry smoke: PASS.
- Provider API value는 `mock`, UI display label은 `MockProvider`로 고정한다.
- `SourceParseResponse`, `PromptVersion`, `CandidateEvidence` mismatches are resolved.
- `invalid_evidence_reference` runtime smoke is available and PASS.
- Docker Compose smoke remains an accepted environment exception until Docker CLI is available.

## Wave 8 Candidate Scope

Wave 8 may expand features in a focused way, but should not open external LLM providers, review/publish workflow, RAG, or advanced PDF parsing.

- Retry-chain dedupe implementation and tests.
- Candidate detail drawer or panel.
- Evidence text/locator highlight in the existing evidence viewer.
- Replace deterministic fixture shortcuts with selected/recent project and job flow.
- Restructure LNB so only top-level work areas are globally listed and ID-bound pages are reached by contextual drilldown.
- Improve ontology-building workflow clarity across Project, Ontology, Source, Extraction, Candidate, and Evidence screens.
- Complete ontology modeler edit/delete UX for draft class, property, and relation authoring.
- Regularize browser smoke tooling or document a stable fallback.

## Wave 8 Focused Expansion Acceptance

Wave 8 acceptance는 기존 MVP 1/MVP 2 contract를 깨지 않고 사용자가 "온톨로지를 구성하고 source 기반 후보와 evidence를 확인하는 길"을 UI에서 따라갈 수 있게 하는 데 둔다. 긴 설명문으로 기능을 설명하는 방식은 PASS 기준이 아니다. 화면 구조, selected project context, breadcrumb/compact path, primary action, empty state, status, row/action link가 다음 action을 보여줘야 한다.

Wave 8은 아래 범위만 연다. 외부 LLM provider, review/publish workflow, RAG, advanced PDF parsing, 대규모 리디자인은 열지 않는다.

### Primary Ontology-Building Workflow

1. Project 선택 또는 생성: 사용자는 최근/선택 project context를 확인하고, project가 없거나 선택이 깨졌을 때 project list/create로 복구할 수 있다.
2. Ontology draft 작성: project 안에서 draft ontology version을 선택하거나 생성한다. `published`/`archived` version은 읽기 전용으로 표시하고 새 draft 생성 CTA를 제공한다.
3. Class/property/relation 구성: draft version에서 class, property, relation을 생성/수정/삭제하고 graph/list/detail이 같은 상태를 바라본다.
4. Source upload/profile/parse: source upload 후 structured source는 profile, document source는 parse/chunk로 이동할 수 있다.
5. Extraction job 생성/실행: source, ontology version, prompt version, provider `mock`, fixture를 기준으로 job을 만들고 실행한다.
6. Candidate/evidence 확인: job result에서 candidate entity/relation을 보고 drawer/panel에서 evidence와 locator highlight를 확인한다.

### Frontend Flow Acceptance

- Project-scoped screen은 현재 project를 topbar, page header, breadcrumb/compact path 중 최소 하나에 표시한다.
- Empty state는 다음 action CTA를 제공한다. 예: no source이면 upload, no draft이면 create draft, no job이면 create extraction job.
- Loading/error/empty/success 상태가 화면별로 분리되어야 하며, error state는 parent screen으로 돌아가는 복구 action을 제공한다.
- ID 기반 detail screen은 parent row/action/context link에서 진입한다. LNB에 특정 `project_id`, `source_id`, `job_id`, `evidence_id`가 필요한 route를 평면 나열하지 않는다.
- Long helper copy로 workflow를 설명하지 않는다. 기본 화면 구조, primary button, status chip, row action, breadcrumb가 흐름을 전달해야 한다.

### Ontology Modeler Edit/Delete Acceptance

- Draft ontology version에서 class/property/relation은 생성, 수정, 삭제가 가능해야 한다.
- Published 또는 archived ontology version은 read-only다. 수정/삭제 control은 disabled 또는 hidden 처리하고, 새 draft 생성 CTA를 제공한다.
- Delete는 물리 삭제가 아니라 backend contract의 element `status=DELETED` 처리로 이해한다. UI는 삭제 후 graph/list/detail에서 해당 element를 숨기거나 deleted state로 분리 표시한다.
- Class 삭제 전 confirm UI는 연결된 property/relation 영향 범위를 보여준다. 최소 기준은 affected property count, inbound/outbound relation count, 삭제 대상 class name이다.
- Class 삭제 후 연결 property/relation이 orphan selection으로 남아 있으면 안 된다. Graph/list/detail selection은 안전한 fallback으로 clear되거나 parent/draft root로 이동한다.
- Property/relation 삭제 후 detail panel이 같은 deleted element를 계속 editable 상태로 보여주면 FAIL이다.
- 삭제 action은 destructive confirm 절차를 거친다. Confirm copy에는 삭제 대상 이름과 삭제가 draft에만 적용된다는 사실을 포함한다.

### LNB and Drilldown IA Acceptance

- LNB에는 전역 최상위 업무 영역만 둔다: Dashboard, Projects, Ontology, Sources, Extraction, Candidates 같은 project-level entry까지만 허용한다.
- 특정 project/source/job/evidence id가 필요한 화면은 LNB에 직접 노출하지 않는다.
- ID 기반 화면은 parent list row, detail action, contextual link, breadcrumb에서 진입한다.
- 현재 위치는 breadcrumb 또는 compact path로 표시한다. 예: `Projects / {project} / Sources / {source} / Evidence`.
- MVP 1 style guide의 app shell과 page header 패턴을 유지한다. Wave 8은 navigation 정리이지 대규모 visual redesign이 아니다.

### Selected/Recent Project and Job Navigation Acceptance

- 사용자가 project-scoped route에 들어왔는데 selected project가 없으면 Projects list/create로 복구할 수 있어야 한다.
- Recent project/job은 편의 기능이며 canonical API contract가 아니다. Stale local selection은 recoverable not-found state로 처리한다.
- Extraction job result 진입은 selected/recent job shortcut보다 project 안의 job list row/action을 우선한다.
- Deterministic fixture shortcut은 QA/dev helper로 남길 수 있지만 product primary path를 대체하면 안 된다.

### Retry-Chain Dedupe Acceptance

- Dedupe scope는 같은 job 내부가 아니라 retry chain 전체다. Retry root는 `retry_of_job_id`가 null인 최초 ancestor job이다.
- Duplicate candidate natural key는 `retry_root_job_id`, `provider`, `fixture_id`, `source_id`, `ontology_version_id`, `prompt_version_id`, candidate kind, provider stable `client_candidate_id`를 기준으로 한다.
- MockProvider가 stable `client_candidate_id`를 제공하지 못하면 fixture id, candidate kind, provider output index, segment locator로 deterministic key를 만든다.
- Duplicate evidence natural key는 `retry_root_job_id`, `provider`, `fixture_id`, `source_id`, `source_segment_id`, provider stable `client_evidence_id` 또는 deterministic segment locator를 기준으로 한다.
- Retry 후 candidate/evidence list는 같은 retry-chain natural key의 중복 row를 보여주지 않는다.
- User-facing 상태는 retry source job, retry job, result list에서 일관되어야 한다. 최소 기준은 retry target job link, retry 생성 여부, dedupe/reused count 또는 "duplicates reused/skipped" 상태 메시지 중 하나를 표시하는 것이다.

### Candidate Detail Drawer/Panel Acceptance

- Candidate row/card에서 drawer 또는 side panel을 열 수 있다.
- Panel은 candidate summary, candidate kind, class/relation, confidence, validation status/codes, review/publish read-only status, source id, ontology version id, prompt version id, model run id, evidence list를 표시한다.
- Panel은 review approval, rejection, publish action을 제공하지 않는다.
- Evidence item은 source/evidence detail 또는 viewer highlight로 이동할 수 있어야 한다.
- Missing evidence는 `MISSING_EVIDENCE` warning으로, broken evidence는 `INVALID_EVIDENCE_REFERENCE` failed state로 보여주고 화면은 crash하지 않는다.

### Evidence Highlight Acceptance

- Structured source evidence는 `row_index`와 `column_name`으로 table row/cell highlight를 제공한다.
- Text source evidence는 `page_number`, `section_title`, `paragraph_id`, `chunk_id`, `start_offset`, `end_offset` 중 가능한 locator로 chunk/paragraph/span highlight를 제공한다.
- Exact span highlight가 불가능하면 chunk/paragraph block highlight로 fallback한다.
- Missing/broken evidence reference는 fallback panel에서 raw evidence id, source id, source segment id, validation code를 보여주고 parent candidate/job으로 돌아갈 수 있어야 한다.
- 고급 PDF parsing dependency나 새로운 PDF renderer 도입은 Wave 8 범위가 아니다.

### Browser Smoke Tooling Decision

- Wave 8의 기본 browser smoke tooling은 Frontend/QA dev dependency로 관리되는 Playwright를 기준으로 한다.
- Browser install, certificate, local runtime 제약이 있으면 manual UAT 또는 headless fallback을 허용하되, 실행 불가 사유와 스크린샷/로그/명령 결과를 보고서에 남겨야 한다.
- Fallback은 정규 smoke 기준을 대체하는 permanent product decision이 아니다.

## Wave 8 QA Findings

Wave 8 focused expansion은 `PARTIAL`이다. Retry-chain dedupe와 primary workflow는 유의미하게 전진했지만, 더 넓은 MVP 2 기능 확장 전 아래 targeted hardening을 Wave 9에서 먼저 닫는다.

- MVP 1 regression gate: PASS.
- Wave 7 contract sync 유지: PASS.
- `INT2-003` Mock extraction flow: PASS.
- `INT2-004` Failure/retry smoke: PASS.
- UI ontology-building workflow clarity: PASS.
- Retry-chain dedupe: PASS.
- Ontology modeler edit/delete UX: PARTIAL.
- LNB/drilldown IA: PARTIAL.
- Candidate detail/evidence highlight: PARTIAL.

### Wave 9 Targeted Hardening Scope

- Backend class delete semantics:
  - class soft delete 후 deleted class에 연결된 `graph.properties[]`가 orphan payload로 남지 않아야 한다.
  - 연결 property/relation을 함께 `DELETED` 처리하거나, graph endpoint에서 deleted class에 연결된 property/relation을 제외한다.
  - extraction candidate generation input에서도 deleted ontology class/relation/property가 사용되지 않도록 확인한다.
- Frontend ontology delete confirmation:
  - class delete confirm은 class name, affected property count, inbound relation count, outbound relation count, draft-only 적용 사실을 표시한다.
  - property/relation delete confirm은 target name과 draft-only 적용 사실을 표시한다.
  - 삭제 후 graph/list/detail selection이 안전하게 clear 또는 parent context로 fallback한다.
- Evidence viewer context:
  - broken/direct evidence route fallback은 evidence id뿐 아니라 가능한 source id, source segment id, validation code, parent candidate/job 복귀 action을 보여준다.
  - breadcrumb/path는 project/source/job/candidate/evidence 맥락을 최대한 유지한다.
- QA:
  - Wave 9는 full sync wave가 아니라 targeted regression wave다.
  - Docker Compose는 Docker CLI가 없으면 기존 environment exception을 유지한다.

### Wave 9 Targeted Hardening Decisions

- Ontology class delete semantics:
  - Decision: draft class soft delete는 cascade soft delete를 기본 의미로 한다. 삭제 대상 class는 `status=DELETED`가 되고, 해당 class에 직접 속한 property와 해당 class를 domain/range 또는 source/target으로 참조하는 relation도 같은 draft 안에서 `status=DELETED` 처리한다.
  - Read invariant: graph/extraction read path는 defensive filter를 적용한다. Legacy data나 partial migration 때문에 연결 property/relation의 status가 아직 `DELETED`가 아니더라도, deleted class에 연결된 property/relation은 `GET /api/v1/ontology/versions/{version_id}/graph`와 extraction candidate generation input에 노출되면 안 된다.
  - Physical delete는 하지 않는다. Published/archived ontology version은 계속 read-only이며 새 draft CTA로만 수정 흐름에 진입한다.
- Delete confirmation copy acceptance:
  - Class delete confirm은 class name, affected property count, inbound relation count, outbound relation count, draft-only 적용 사실을 분리 표시한다.
  - Count는 이미 `DELETED`인 element를 제외한 현재 draft graph 기준으로 계산한다.
  - Property/relation delete confirm은 target name과 draft-only 적용 사실을 표시한다.
  - 삭제 후 graph/list/detail selection은 deleted element에 머물지 않는다. 선택은 clear되거나 parent draft/modeler context로 이동해야 한다.
- Evidence broken/direct route fallback acceptance:
  - Product UI에서 생성하는 evidence link는 parent project/source/job/candidate context를 route state 또는 query/context link로 전달해야 한다.
  - Broken/direct evidence fallback은 가능한 source id, source segment id, validation code, evidence id를 보여준다.
  - Parent candidate/job context가 있으면 parent candidate 또는 job으로 돌아가는 action을 제공한다.
  - 임의 direct URL처럼 parent context가 없으면 context unavailable state를 보여주고 selected/recent project의 candidate/job list로 복구하는 action을 제공한다. App-generated link에서 parent action이 빠지면 FAIL이다.
- LNB/drilldown targeted acceptance:
  - LNB에는 ID 기반 detail page를 평면 노출하지 않는다.
  - Project/source/job/candidate/evidence detail은 parent screen의 row/action/context link에서 진입한다.
  - Breadcrumb 또는 compact path는 project/source/job/candidate/evidence 맥락 중 현재 화면이 가진 context를 잃지 않아야 한다.

### Wave 9 QA Findings

Wave 9 targeted hardening은 `PASS`다. Wave 10에서 더 넓은 MVP 2 local demo expansion을 열 수 있다.

- MVP 1 regression gate: PASS.
- Wave 7 contract sync 유지: PASS.
- Ontology delete orphan issue: PASS.
- Class cascade soft delete, graph/list/extraction defensive filter: PASS.
- Delete confirmation UX: PASS.
- Evidence fallback/breadcrumb context: PASS.
- LNB/drilldown residual gap: PASS.
- `INT2-002`: PASS.
- Docker Compose smoke는 Docker CLI 부재로 `NOT RUNNABLE`이며 기존 environment exception을 유지한다.

### Wave 10 Broader Local Demo Scope

Wave 10은 MVP 2를 실제 로컬 데모 흐름으로 넓힌다. 목표는 source profile/parse에서 extraction job 생성/실행, candidate/evidence 확인까지 사용자가 반복해서 검증할 수 있는 상태를 만드는 것이다. 외부 LLM provider, review/publish workflow, RAG, advanced PDF parsing, 신규 candidate detail endpoint는 여전히 열지 않는다.

- Source profile/parse edge cases:
  - CSV/Excel profile 재실행, empty/small table, mixed type/null ratio/sample warnings를 확인한다.
  - TXT/PDF deterministic parse/chunk 결과와 warnings를 UI/API/fixture에서 일관되게 보여준다.
- Prompt/job lifecycle:
  - prompt template/version 선택, active version 표시, missing prompt/version 복구 흐름을 정리한다.
  - job 생성/실행/retry/failure 상태와 masked model run metadata를 사용자가 확인할 수 있어야 한다.
- Fixture catalog:
  - `default`, `partial_invalid`, `invalid_evidence_reference`, `missing` fixture를 QA가 명확히 선택/재현할 수 있어야 한다.
  - `partial_invalid`은 missing evidence warning/partial failure를 재현한다.
  - `invalid_evidence_reference`는 broken evidence fallback을 재현한다.
  - `missing`은 `MOCK_FIXTURE_NOT_FOUND` failure path를 재현한다.
- Candidate/evidence browsing:
  - validation status/code, evidence presence, entity/relation kind 기준 필터와 empty/error state를 확인한다.
  - normal/missing/broken evidence route가 source/job/candidate context를 잃지 않아야 한다.
- QA:
  - Wave 10은 targeted smoke가 아니라 broader MVP 2 local demo regression이다.
  - Wave 10 종료 시 다음 단계가 MVP 2 closeout인지, 추가 hardening인지 판정한다.

### Wave 10 Local Demo Acceptance Decisions

- End-to-end local demo path:
  1. 사용자는 project와 draft ontology version을 선택한 뒤 source를 업로드한다.
  2. CSV/Excel source는 profile을 실행하고 `SourceProfile.columns[]`, `inferred_type`, `nullable`, `null_ratio`, `distinct_count_sampled`, `sample_values[]`, `warnings[]`를 확인한다.
  3. TXT/PDF source는 parse/chunk를 실행하고 `SourceParseResponse.segment_count`, `segment_types[]`, `warnings[]`와 `GET /api/v1/sources/{source_id}/segments` 결과를 확인한다.
  4. 사용자는 prompt template과 prompt version을 선택한다. Active version은 기본 선택 또는 배지로 표시한다.
  5. 사용자는 source, ontology version, prompt version, provider `mock`, fixture id로 extraction job을 생성하고 실행한다.
  6. Job monitor는 `PENDING`, `QUEUED`, `RUNNING`, `SUCCESS`, `PARTIAL_FAILED`, `FAILED`, retry 상태, failure reason, masked model run metadata를 보여준다.
  7. 사용자는 candidate entity/relation 결과를 validation status/code, evidence presence, entity/relation kind 기준으로 확인한다.
  8. Normal/missing/broken evidence route와 fallback은 source/job/candidate context를 잃지 않아야 한다.
- Fixture catalog:
  - `default`: 정상 local demo path. Job은 `SUCCESS`, candidate entity/relation은 `validation_status=PASSED`, 정상 `CandidateEvidence`를 1개 이상 가진다.
  - `partial_invalid`: partial failure path. Job은 `PARTIAL_FAILED`, 유효 candidate와 `validation_status=WARNING`, `validation_codes=["MISSING_EVIDENCE"]`, `evidence_ids=[]` candidate를 함께 생성한다.
  - `invalid_evidence_reference`: broken evidence path. Job은 `PARTIAL_FAILED`, 최소 1개 candidate는 `validation_status=FAILED`, `validation_codes=["INVALID_EVIDENCE_REFERENCE"]`를 가진다.
  - `missing`: missing fixture path. Job은 `FAILED`, `error_code=MOCK_FIXTURE_NOT_FOUND`를 가진다. Candidate 생성은 요구하지 않는다.
- Broken evidence fixture decision:
  - `invalid_evidence_reference` catalog fixture는 QA가 traceability fallback을 안정적으로 검증할 수 있도록 broken reference에 `source_id`와 `source_segment_id`를 non-null로 제공해야 한다.
  - 해당 `source_segment_id`는 syntactically valid id이되, resolve되지 않거나 source와 mismatch되는 invalid reference여야 한다.
  - UI placeholder fallback은 여전히 필수다. Legacy/direct route, absent evidence row, null locator를 만나도 화면은 crash하지 않고 context-unavailable recovery를 제공한다.
- Prompt lifecycle:
  - Wave 10은 active version 표시와 prompt version 선택까지만 연다.
  - 별도 active version 변경 API/UI, prompt publish workflow, prompt approval workflow는 열지 않는다.
  - Job creation은 명시적 `prompt_version_id`를 사용한다. Active version은 기본 선택값 또는 표시 상태이며 API DTO에 `active_version_id`를 추가하지 않는다.
- Source profile acceptance:
  - Empty file/sheet는 crash하지 않고 `row_count=0`, `columns=[]`, warning을 반환한다.
  - Header-only sheet는 `row_count=0`, header 기반 columns를 반환하며 해당 columns는 `inferred_type=EMPTY`, `nullable=true`, `null_ratio=1`, `distinct_count_sampled=0`, `sample_values=[]`를 사용한다.
  - Small table은 실제 row 수보다 큰 sample을 요구하지 않는다. `sample_size`와 `sample_values[]`는 사용 가능한 데이터 안에서 결정된다.
  - Mixed type column은 `ProfileInferredType.MIXED`를 사용한다.
  - Null/blank 값은 `nullable`과 `null_ratio`에 반영한다. `sample_values[]`는 non-null 예시를 우선 표시하고 null 자체의 존재는 null ratio/status로 보여준다.
- Source parse/chunk acceptance:
  - TXT parse는 deterministic segment order와 stable `sequence`를 유지한다.
  - PDF parse는 local best-effort text extraction까지만 다룬다. Scanned/encrypted/no-text/unsupported PDF는 warning과 zero 또는 partial segment result로 처리하며 advanced PDF parsing dependency는 열지 않는다.
  - Profile/parse 재실행은 visible result 기준으로 idempotent해야 한다. 같은 source를 반복 profile/parse해도 duplicate segment/list row가 보이면 FAIL이다.
- Frontend visible copy:
  - 사용자 화면에는 endpoint/debug 설명을 최소화한다.
  - 흐름은 CTA, status badge, breadcrumb/compact path, row action, empty/error state로 전달한다.
  - Fixture 선택은 QA 재현성을 위해 `default`, `partial_invalid`, `invalid_evidence_reference`, `missing` id를 드러낼 수 있지만, 사용자가 보는 primary label은 성공/부분 오류/broken evidence/missing fixture 같은 결과 중심이어야 한다.
  - Error code와 raw ids는 상세/개발 정보 영역에 낮춰 표시한다.

### Wave 11 MVP 2 Closeout Findings

Wave 11 MVP 2 closeout verdict는 `PASS WITH EXCEPTION`이다. Product P0 closeout matrix는 모두 PASS이며 남은 항목은 P1 environment/tooling follow-up이다.

- Subagent 운영 리듬:
  - PM subagent가 closeout checklist와 acceptance matrix를 먼저 확정했다.
  - Backend/Frontend subagent가 병렬로 closeout 안정화를 수행했다.
  - QA subagent가 마지막에 독립 closeout regression을 수행했다.
- Closeout checklist:
  - 기준 문서: `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`
  - `CO-01` Source profile: PASS.
  - `CO-02` Source parse/chunk: PASS.
  - `CO-03` Prompt version selection: PASS.
  - `CO-04` Extraction job lifecycle: PASS.
  - `CO-05` Fixture catalog: PASS.
  - `CO-06` Retry/dedupe: PASS.
  - `CO-07` Candidate/evidence browsing: PASS.
  - `CO-08` Evidence traceability/fallback: PASS.
  - `CO-09` Frontend navigation/browser smoke: PASS.
- Integration:
  - `INT2-001`: PASS.
  - `INT2-002`: PASS.
  - `INT2-003`: PASS.
  - `INT2-004`: PASS.
- Runtime contract:
  - 신규 endpoint, enum, DTO/schema 변경 없음.
  - MVP 1 `openapi-mvp1.json`과 MVP 2 `openapi-mvp2-draft.json` 분리 유지.
  - provider API literal은 계속 `mock`이다.
- Approved exceptions:
  - Docker Compose smoke는 Docker CLI 부재로 `NOT RUNNABLE`. Product closeout blocker가 아닌 P1 environment follow-up으로 유지한다. Linked IDs: `BE-002`, `INT2-003`.
  - Browser smoke harness는 `npm run smoke:mvp2:actual`로 재현 가능하며 MVP 2 closeout blocker가 아니다. Playwright Test suite formalization은 P1 tooling follow-up이다. Linked IDs: `FE2-006`, `INT2-003`.

## Wave 7 Contract Sync Decisions

Wave 7은 기능 확장이 아니라 FE/OpenAPI contract sync closeout wave다. Candidate detail drawer, evidence highlight, 고급 PDF parsing, 외부 LLM provider, review/publish/RAG 범위는 열지 않는다.

- Provider literal/display split:
  - API value: `mock`
  - UI display label: `MockProvider`
  - Backend는 `MockProvider` alias를 추가하지 않는다.
  - Frontend는 job creation payload에 `provider: "mock"`을 전송한다.
- Source parse response:
  - `POST /api/v1/sources/{source_id}/parse` 응답은 `SourceParseResponse`다.
  - `SourceSegment[]` 단독 반환이 아니다.
  - parsed segment list는 `GET /api/v1/sources/{source_id}/segments`에서 조회한다.
- Retry no-duplicate scope:
  - 중복 방지 범위는 같은 job 내부가 아니라 retry chain 전체다.
  - retry root는 `retry_of_job_id`가 null인 최초 job이다.
  - natural key는 retry root, provider, fixture, source, ontology version, prompt version, candidate kind, provider stable client candidate/evidence id를 기준으로 한다.
  - MockProvider가 client id를 제공하지 않으면 fixture id, candidate kind, provider output index, segment locator로 deterministic key를 만든다.
- `INVALID_EVIDENCE_REFERENCE` runtime evidence:
  - deterministic fixture 또는 backend test hook이 필요하다.
  - preferred fixture id: `invalid_evidence_reference`.
  - 이 hook은 QA smoke 전용이며 product UI workflow가 아니다.
- Candidate list response shape:
  - Wave 7에서는 현재 OpenAPI의 plain array response를 유지한다: `CandidateEntity[]`, `CandidateRelation[]`.
  - `limit`, `offset`, `source_id`, `ontology_version_id`, `validation_status`, `has_evidence`는 query filter로 유지한다.
  - `total_count`, cursor, list wrapper DTO는 이번 wave에서 추가하지 않는다.
