# MVP 2 Prep Brief

## Status

`MVP 2 CLOSED / MVP 3 ENTRY READY`

MVP 2 설계 준비 문서다. Wave 5 기준으로 MVP 1 app acceptance는 통과했고 Docker Compose 검증은 환경 예외로 분리되었다. Wave 6~10에서 thin slice, contract sync, targeted hardening, broader local demo를 닫았다. Wave 11은 신규 기능 확장이 아니라 `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md` 기준으로 MVP 2 closeout checklist, regression matrix, demo script, release-note exclusions, exception policy를 고정했다. Wave 12는 닫힌 MVP 2 API contract 위에서 Frontend productization/UI-UX maturity를 다뤘고, Wave 13은 UI/UX product polish를 PASS로 닫았다. MVP 2 product P0는 완료이며 MVP 3 entry 준비가 끝났다.

## MVP 2 Goal

정형/비정형 데이터를 파싱하고 프로파일링한 뒤, 온톨로지 기준으로 Mock LLM 또는 실제 LLM adapter가 후보 엔티티·관계를 생성한다. 모든 후보는 source/evidence와 연결되어야 한다.

## Entry Criteria

- MVP 1 backend Project/Ontology/Source/OpenAPI smoke PASS.
- MVP 1 frontend actual FE-to-BE source flow smoke PASS.
- MVP 1 ontology authoring actual API smoke PASS.
- MVP 1 dashboard actual API boundary closeout: `/api/v1/dashboard` 호출이 actual API mode에 남아 있지 않음.
- Browser click smoke PASS 또는 manual UAT evidence와 PM 승인 예외가 문서화됨.
- `docs/api/openapi-mvp1.json`이 최신 backend export와 일치.
- MVP 1 UI style foundation 문서 존재.
- Docker Compose/local infra smoke PASS 또는 Docker CLI 부재 같은 환경 blocker가 PM 예외로 분리됨.
- 남은 MVP 1 blocker가 MVP 2 `SourceSegment`, `ExtractionJob`, `ModelRun`, `CandidateEvidence` domain model을 흔들지 않음.

## Implementation Gate

- Wave 6 구현 착수 가능.
- 첫 구현 범위는 SourceSegment/profile/parse, Prompt/ExtractionJob/ModelRun/MockProvider, candidate/evidence scaffold, Frontend mock/API boundary, QA deterministic fixtures로 제한한다.
- Expert review, publish graph, RAG, automatic approval, large distributed processing은 여전히 제외한다.
- Wave 8 focused expansion은 retry-chain dedupe, selected/recent navigation, candidate detail drawer/panel, evidence highlight, LNB/drilldown IA, ontology-building workflow clarity, ontology modeler edit/delete acceptance로 제한한다.
- Wave 9 targeted hardening은 class delete orphan graph property, delete confirmation copy/counts, evidence direct/broken route fallback, LNB/drilldown residual smoke를 닫는 데만 둔다.
- Wave 10 broader local demo expansion은 source profile/parse edge cases, prompt/job selection, MockProvider fixture catalog, retry/failure, candidate/evidence browsing을 반복 검증 가능하게 만드는 데 둔다.
- Wave 11 closeout preparation은 `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`의 acceptance matrix와 demo script를 기준으로 Backend/Frontend/QA closeout evidence를 모은다. External LLM, review/publish, RAG, advanced PDF parsing, production auth/RBAC, 신규 candidate detail endpoint는 열지 않는다.
- Wave 12 Frontend productization은 새 endpoint/DTO/enum 없이 사용자가 project에서 evidence까지 흐름을 이해하고 반복 수행할 수 있는 상품형 UI로 다듬는 데 둔다. Backend/API scope는 productization blocker가 명확히 증명될 때만 다시 논의한다.

## MVP 2 Extraction User Flow

1. 사용자가 project 안에서 source를 선택한다.
2. CSV/Excel source는 profile을 실행해 columns, inferred type, null ratio, distinct count, sample values를 확인한다.
3. TXT/PDF source는 parse/chunk를 실행해 page/section/paragraph/chunk segment를 확인한다.
4. 사용자가 ontology version과 prompt version을 선택한다.
5. 사용자가 provider를 선택한다. Wave 6 thin slice의 기본 provider는 `MockProvider`다.
6. 사용자가 extraction job을 생성한다. Job은 `PENDING`으로 생성되고 실행 요청 후 `QUEUED`, `RUNNING`, terminal status로 이동한다.
7. 실행 중 `ModelRun`이 생성되고 masked `raw_request`/`raw_response`와 provider metadata가 저장된다.
8. MockProvider는 deterministic fixture를 사용해 candidate entity/relation과 candidate evidence를 생성한다.
9. 사용자는 extraction job monitor에서 status, progress, failure reason을 확인한다.
10. 사용자는 candidate result view에서 entity/relation 후보와 evidence를 함께 확인한다.

## Wave 8 Primary Ontology-Building Workflow

Wave 8의 제품 acceptance는 사용자가 설명문을 읽지 않아도 화면 구조와 next action으로 아래 흐름을 따라갈 수 있는지로 판단한다.

1. Project를 선택하거나 생성한다. 선택 project가 없거나 stale이면 Projects list/create로 복구한다.
2. Project 안에서 ontology draft version을 선택하거나 생성한다. Published/archived version은 읽기 전용이며 새 draft 생성 CTA를 제공한다.
3. Draft modeler에서 class, property, relation을 생성/수정/삭제한다. Delete는 element `status=DELETED`로 처리되며 graph/list/detail selection이 깨지면 안 된다.
4. Source를 업로드하고 structured source는 profile, document source는 parse/chunk를 실행한다.
5. Source, ontology version, prompt version, provider `mock`, fixture를 기준으로 extraction job을 생성하고 실행한다.
6. Job monitor에서 status/progress/failure reason/retry state를 확인한다.
7. Candidate result view에서 entity/relation을 확인하고 drawer/panel에서 validation status, evidence list, evidence highlight를 확인한다.

LNB에는 전역 최상위 업무 영역만 둔다. 특정 `project_id`, `source_id`, `job_id`, `evidence_id`가 필요한 화면은 parent row/action/context link에서 진입하고 breadcrumb 또는 compact path로 현재 위치를 표시한다.

## Wave 9 Targeted Hardening Decisions

- Class delete semantics: draft class delete는 class와 직접 연결된 property/relation을 함께 `status=DELETED` 처리하는 cascade soft delete다. Graph와 extraction input은 deleted class에 연결된 property/relation을 방어적으로 제외해야 한다.
- Delete confirmation: class delete confirm은 class name, affected property count, inbound relation count, outbound relation count, draft-only 적용 사실을 분리 표시한다. Property/relation confirm도 target name과 draft-only 적용 사실을 표시한다.
- Evidence fallback: product-generated evidence link는 parent project/source/job/candidate context를 유지해야 한다. Broken/direct fallback은 evidence id, source id, source segment id, validation code, parent candidate/job 복귀 action 또는 context-unavailable recovery action을 제공한다.
- LNB/drilldown: LNB에는 ID 기반 detail page를 노출하지 않고, project/source/job/candidate/evidence detail은 parent row/action/context link와 breadcrumb/path로 진입한다.

## Wave 10 Local Demo Acceptance

Wave 10의 demo path는 `source upload/profile/parse/chunk → prompt version 선택 → extraction job 생성/실행/retry → candidate/evidence 확인`이다. 같은 project와 draft ontology에서 이 흐름을 반복해도 duplicate profile/segment/candidate/evidence row가 사용자에게 보이면 안 된다.

- Source profile/parse:
  - CSV/Excel empty, header-only, small, mixed type, null-heavy sample을 처리한다.
  - Empty file/sheet는 warning과 빈 결과로 복구하고, header-only sheet는 `ProfileInferredType.EMPTY` columns로 보여준다.
  - TXT/PDF parse는 deterministic segment order와 warnings를 제공한다. PDF는 local best-effort text extraction까지만 다루며 scanned/encrypted/no-text PDF는 warning path로 처리한다.
- Prompt lifecycle:
  - Active prompt version은 표시만 한다.
  - Job 생성은 명시적 `prompt_version_id` 선택으로 동작한다.
  - Wave 10에서는 active version 변경 API/UI, prompt publish/review workflow를 열지 않는다.
- Fixture catalog:
  - `default`: success, normal candidate/evidence.
  - `partial_invalid`: `PARTIAL_FAILED`, missing evidence warning candidate 포함.
  - `invalid_evidence_reference`: `PARTIAL_FAILED`, broken evidence fallback candidate 포함. Broken reference에는 non-null `source_id`와 non-null `source_segment_id`가 필요하다.
  - `missing`: `FAILED`, `MOCK_FIXTURE_NOT_FOUND`.
- Candidate/evidence browsing:
  - Entity/relation, validation status/code, evidence presence 기준으로 결과를 확인할 수 있어야 한다.
  - Normal evidence는 locator highlight를 제공하고, missing/broken evidence는 parent source/job/candidate context와 recovery action을 제공한다.
- Visible copy:
  - 사용자 화면에는 endpoint/debug 설명을 최소화한다.
  - 흐름은 CTA, status, breadcrumb/compact path, row action, empty/error state로 전달한다.
  - Fixture id와 error code는 QA/dev 재현에 필요할 때만 보조 정보로 보여준다.

## Wave 11 Closeout Preparation

Wave 11 closeout 기준은 `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`에 고정한다.

- Closeout acceptance matrix:
  - source profile
  - source parse/chunk
  - prompt version selection
  - extraction job lifecycle
  - fixture catalog
  - retry/dedupe
  - candidate/evidence browsing
  - evidence traceability/fallback
  - frontend navigation/browser smoke
- Demo script:
  - local backend/frontend run prerequisites
  - sample data path 또는 생성 절차
  - project/draft ontology/source/profile/parse/prompt/job/candidate/evidence/retry demo steps
  - expected outcomes and explicit non-goals
- Release-note exclusions:
  - external LLM provider integration
  - expert review and publish workflow
  - RAG/search over published graph
  - advanced PDF/OCR/layout parsing
  - production auth/RBAC
  - new candidate detail endpoint
  - active prompt-version mutation workflow
- Exception policy:
  - Docker CLI 부재는 product blocker가 아니라 environment exception이다. Docker가 없으면 QA는 `docker --version` 실패와 대체 local API/UI regression 결과를 보고한다.
  - Browser smoke tooling 임시성은 tooling exception이다. Frontend/QA가 명령, route coverage, screenshot/log artifact를 보고하면 MVP 2 closeout을 막지 않는다.

## Wave 12 Frontend Productization Acceptance

Wave 12는 MVP 2 closeout을 되돌리거나 Backend/API scope를 여는 wave가 아니다. 목표는 기존 local demo가 "개발자가 만든 기능 묶음"처럼 보이지 않고, 사용자가 온톨로지 기반 데이터 구축 작업을 하나의 운영형 SaaS 제품 안에서 수행한다고 느끼게 만드는 것이다.

### Primary Workflow

Frontend는 아래 흐름을 한 프로젝트 맥락 안에서 자연스럽게 이어야 한다. 각 단계는 breadcrumb, page header, primary action, row action, empty/error recovery 중 최소 하나로 다음 단계가 보여야 한다.

1. Project 선택: 사용자는 현재 project context를 확인하고, 선택이 없거나 stale이면 Projects list/create로 복구한다.
2. Ontology draft 구성: 사용자는 draft ontology version을 선택하거나 만들고 class/property/relation을 편집한다. Published/archived version은 read-only로 보이며 새 draft 생성 CTA를 제공한다.
3. Source upload/profile/parse: 사용자는 source를 업로드하고 structured source는 profile, document source는 parse/chunk 상태로 이동한다.
4. Extraction job 생성/실행: 사용자는 source, ontology version, prompt version, provider `mock`, fixture를 확인한 뒤 job을 생성하고 실행한다.
5. Candidate/evidence 확인: 사용자는 job monitor에서 candidate results로 이동하고, candidate row에서 evidence viewer 또는 detail panel로 drilldown한다.

### Productization UX Criteria

- App shell/navigation hierarchy:
  - LNB는 Dashboard, Projects, Ontology, Sources, Extraction, Candidates 같은 top-level 업무 영역만 유지한다.
  - 특정 `project_id`, `source_id`, `job_id`, `candidate_id`, `evidence_id`가 필요한 detail route는 LNB에 직접 노출하지 않는다.
  - ID-bound detail은 parent list row, page action, contextual link, breadcrumb로 진입한다.
- Project context와 breadcrumb:
  - Project-scoped 화면은 현재 project name 또는 recoverable project state를 page header, breadcrumb, topbar 중 최소 하나에 표시한다.
  - Evidence viewer에서도 가능한 project/source/job/candidate context를 잃지 않는다.
- Page-level primary action:
  - 각 화면은 하나의 주요 다음 action을 명확히 가진다. 예: project list는 create/select, source detail은 profile 또는 parse, job list는 create extraction job, candidate results는 inspect evidence.
  - 보조 action은 row action 또는 compact toolbar에 둔다.
- Task progression/next action:
  - Empty state는 "무엇이 없는지"와 "지금 할 수 있는 다음 행동"을 함께 제공한다.
  - Successful completion state는 다음 workflow로 이어지는 CTA를 제공한다. 예: profile 완료 후 parse/job create가 아니라 source type에 맞는 다음 step으로 이동한다.
- Empty/error/recovery state:
  - Loading, empty, error, success는 시각적으로 구분한다.
  - Error state는 raw endpoint 설명보다 사용자가 복구할 수 있는 action을 우선한다.
  - direct missing evidence, broken evidence, stale project/source/job은 화면 crash 없이 parent context 또는 list로 복구한다.
- Candidate/evidence inspection density:
  - Candidate list는 entity/relation kind, validation status/code, evidence presence, confidence, source/job context를 한 화면에서 비교할 수 있어야 한다.
  - Evidence viewer는 원천 locator, evidence text/table locator, candidate summary, validation code를 밀도 있게 보여주되 review/publish action은 제공하지 않는다.
  - Raw ids와 error code는 QA/dev 재현에 필요한 보조 정보로 낮춰 배치한다.
- Responsive layout:
  - Desktop에서는 list/table + contextual panel 또는 stable detail area를 활용해 candidate/evidence 비교와 drilldown이 과도한 page hopping이 되지 않게 한다.
  - Mobile-ish viewport에서는 LNB, breadcrumbs, tables, filters, buttons가 겹치지 않고 중요한 action이 스크롤 안에서 유지되어야 한다.
  - Table이 좁아질 때는 중요한 status/action을 보존하고 낮은 우선순위 metadata를 접거나 detail 영역으로 이동한다.
- Visible copy style:
  - 사용자 주 화면에는 endpoint/debug 중심 문구를 쓰지 않는다.
  - Fixture id는 QA 재현을 위해 보조로 남길 수 있으나 primary label은 성공/부분 오류/broken evidence/missing fixture 같은 결과 중심이어야 한다.
  - 긴 설명문 대신 status badge, concise labels, breadcrumbs, row actions, recovery CTA로 흐름을 전달한다.

### Visual Style Guardrails

- Operational SaaS 제품처럼 차분하고 정보 밀도가 있는 UI를 우선한다.
- Landing/marketing hero, 과장된 소개 섹션, 기능 홍보 문구를 업무 화면에 두지 않는다.
- 카드 남용을 피한다. 카드 안 카드 구조는 반복 item, modal, 실제 framed tool 외에는 사용하지 않는다.
- Page section은 full-width band 또는 unframed layout으로 구성하고, 개별 record나 summary에만 card를 사용한다.
- 색상은 status와 hierarchy를 돕는 용도로 제한한다. 지나치게 장식적인 gradient/orb/background는 사용하지 않는다.
- Typography는 업무 화면 크기에 맞춘다. Compact panel/card 안에서 hero-scale heading을 사용하지 않는다.
- Hana adapter/styled-components 경계를 유지하고 업무 화면에서 `hana-style-component`를 직접 import하지 않는다.

### QA Browser Acceptance Checklist

QA는 실제 브라우저에서 desktop과 mobile-ish viewport를 모두 확인한다. 가능한 경우 actual API mode와 `npm run smoke:mvp2:actual` 또는 보강된 route/click smoke artifact를 사용한다.

- Project selection/recovery:
  - Project list에서 project 선택 또는 생성 경로가 보인다.
  - stale/no selected project 상태가 Projects list/create로 복구된다.
- Ontology draft:
  - Draft ontology version에서 class/property/relation 작성 화면의 primary action과 read-only version 상태가 구분된다.
  - 삭제/편집 UI는 Wave 9 acceptance를 깨지 않는다.
- Source profile/parse:
  - Structured source detail에서 profile 실행/결과/empty/error/recovery가 보인다.
  - Document source detail에서 parse/chunk 실행/결과/warning/recovery가 보인다.
- Extraction job:
  - Job create screen에서 source, ontology version, prompt version, provider `mock`, fixture 선택이 사용자 중심 label로 보인다.
  - Job monitor에서 status/progress/failure reason/retry/model run summary가 product tone으로 보인다.
- Candidate/evidence:
  - Candidate results에서 kind/status/code/evidence presence 필터 또는 탐색이 가능하다.
  - Normal evidence는 locator/evidence content/context를 보여준다.
  - Missing/broken/direct missing evidence는 crash하지 않고 available context와 recovery action을 보여준다.
- Navigation and hierarchy:
  - LNB는 top-level 업무 영역만 포함한다.
  - ID-bound detail route는 row/action/breadcrumb drilldown으로만 접근된다.
  - Breadcrumb 또는 compact path가 project/source/job/candidate/evidence context를 유지한다.
- Visual/copy:
  - Main user screens에 endpoint/debug 중심 문구가 남아 있지 않다.
  - Landing/marketing hero 또는 card-in-card 남용이 없다.
  - Empty/error states가 다음 action 또는 복구 action을 제공한다.
- Responsive:
  - Desktop viewport에서 table/filter/action/detail panel이 겹치지 않는다.
  - Mobile-ish viewport에서 LNB, breadcrumbs, buttons, tables, evidence content가 서로 겹치지 않고 텍스트가 버튼/칩 밖으로 넘치지 않는다.
- Regression:
  - Wave 11 `CO-01`~`CO-09`와 `INT2-001`~`INT2-004` closeout behavior가 깨지지 않는다.

## Enum / Status Source

- `SourceSegment.segment_type`: `SourceSegmentType`.
- `SourceProfileColumn.inferred_type`: `ProfileInferredType`.
- `ExtractionJob.status`: `ExtractionJobStatus`.
- `ModelRun.status`: `ModelRunStatus`.
- Candidate `validation_status`: `ValidationStatus`.
- Candidate `validation_codes[]`: `CandidateValidationCode`.
- Candidate `review_status`: `CandidateReviewStatus`.
- Candidate `publish_status`: `PublishStatus`.

MVP 2에서는 review/publish workflow가 제외 범위이므로 `review_status=PENDING`, `publish_status=NOT_PUBLISHED`를 기본값으로 둔다. review approval, rejection, publishing action은 MVP 3 이후에만 다룬다.

## Evidence Policy

- 정상 candidate는 최소 1개 이상의 `CandidateEvidence`를 가져야 한다.
- Entity candidate evidence는 `source_id`, `source_segment_id`, segment locator, evidence text 또는 structured locator를 포함한다.
- Relation candidate evidence는 relation 자체 evidence를 포함하고, source/target candidate가 각각 evidence를 가져야 한다.
- CSV/Excel evidence는 `SHEET`, `ROW`, `CELL` segment와 `row_index`, `column_name`으로 추적한다.
- TXT/PDF evidence는 `PAGE`, `SECTION`, `PARAGRAPH`, `CHUNK` segment와 `start_offset`, `end_offset`, `evidence_text`로 추적한다.
- Evidence 없는 candidate 저장은 허용하지만 정상 후보가 아니다. raw provider output 보존을 위해서만 저장하며 `validation_status=WARNING`, `validation_codes=["MISSING_EVIDENCE"]`, `publish_status=NOT_PUBLISHED`를 필수로 둔다.
- Evidence 참조가 존재하지만 깨져 있거나 source/segment를 찾을 수 없으면 `validation_status=FAILED`, `validation_codes=["INVALID_EVIDENCE_REFERENCE"]`를 사용한다.
- Schema가 맞지 않는 provider output은 candidate로 정상 노출하지 않고 job 또는 model run failure reason에 기록한다.

## MockProvider Deterministic Fixture Policy

- MockProvider는 외부 LLM credentials, network call, randomness 없이 동작해야 한다.
- 같은 `source_id`, `ontology_version_id`, `prompt_version_id`, fixture id로 실행하면 candidate content와 evidence locator가 동일해야 한다.
- `extraction_job_id`와 `model_run_id`는 실행마다 달라질 수 있지만 fixture-derived candidate natural key는 안정적이어야 한다.
- Fixture는 candidate entity, candidate relation, evidence, validation status/code, confidence를 포함한다.
- Missing fixture는 `ExtractionJobStatus=FAILED`와 machine-readable error code `MOCK_FIXTURE_NOT_FOUND`로 처리한다.
- 일부 candidate만 invalid하면 job은 `PARTIAL_FAILED`가 될 수 있고, valid candidate와 invalid candidate status/code가 함께 저장된다.
- Retry는 같은 fixture를 재사용하며 중복 candidate를 만들지 않도록 backend가 idempotency key 또는 natural key를 사용한다.

## Raw Payload Masking Policy

- `ModelRun.raw_request`와 `ModelRun.raw_response`는 저장 전 masked JSON으로만 보존한다. unmasked provider payload는 DB에 저장하지 않는다.
- 아래 key는 대소문자 구분 없이 redaction 대상이다: `api_key`, `token`, `secret`, `password`, `authorization`, `cookie`, `set_cookie`, `credential`, `access_key`, `secret_key`, `connection_string`, `signed_url`.
- `raw_request`에는 source file 원문 전체를 저장하지 않는다. 필요한 경우 segment id, prompt version id, ontology version id, source metadata, 짧은 excerpt만 저장한다.
- `raw_response`에는 provider output candidate JSON을 저장하되 evidence 원문은 `CandidateEvidence.evidence_text`로 분리하고, 장문 text는 truncate 또는 evidence reference로 대체한다.
- Masked payload에는 `masking_version`과 redaction summary를 남겨 QA가 masking 적용 여부를 확인할 수 있어야 한다.

## Scope

### Backend

- `SourceSegment` 공통 모델.
- CSV/Excel profiling.
- TXT/PDF text extraction and chunking.
- `PromptTemplate`, `PromptVersion`.
- `ExtractionJob`, `ModelRun`.
- LLM provider interface.
- Mock LLM provider.
- Structured output schema validation.
- `CandidateEntity`, `CandidateRelation`, `CandidateEvidence`.
- Extraction job status lifecycle.

### Frontend

- Source profiling view.
- Document chunk viewer.
- Extraction job creation view.
- Extraction job monitoring view.
- Candidate entity/relation result view.
- Evidence viewer.

### PM

- Extraction user flow.
- LLM output JSON schema.
- Evidence policy.
- Candidate status policy.
- Failure/retry policy.
- Mock provider acceptance criteria.

### QA

- Profiling contract review.
- Chunk/evidence traceability checks.
- Mock LLM deterministic fixture checks.
- Extraction job status transition checks.

## Non-goals

- Expert review workflow.
- Publish graph API.
- Quality score dashboard beyond basic extraction statistics.
- RAG.
- Automatic approval.
- Large distributed processing.

## Key Product Rules

- LLM output never goes directly to published graph.
- Candidate entity/relation/property value must retain source/evidence.
- `ontology_version_id`, `prompt_version_id`, `model_run_id`, execution timestamp, status, and raw payload must be persisted.
- Mock provider is required so local development and QA do not depend on external LLM credentials.

## Suggested Milestones

1. MVP2-A: SourceSegment + profiling/chunking contract.
2. MVP2-B: Prompt/ModelRun/ExtractionJob contract.
3. MVP2-C: Mock LLM provider + candidate/evidence persistence.
4. MVP2-D: Frontend profiling/chunk/extraction monitor screens.
5. MVP2-E: Integration QA with deterministic fixtures.

## Open Decisions

- CSV/Excel profile storage granularity.
- PDF parsing library choice.
- Chunking defaults: chunk size, overlap, metadata.
- Candidate confidence scale.

## Wave 6 Resolved Decisions

- Mock LLM fixture format is deterministic provider output with `candidate_entities[]`, `candidate_relations[]`, and `evidence[]`, using stable client IDs.
- Actual external LLM provider is not required for Wave 6. Any real provider integration remains optional follow-up behind environment configuration after MockProvider passes QA.
