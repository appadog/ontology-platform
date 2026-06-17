# PM/Architecture Report - Wave 6

## 담당 범위
- backlog ID: PM2-001, PM2-002, PM2-003, PM2-004, PM2-005
- 작업 경로:
  - `docs/pm/GLOSSARY.md`
  - `docs/pm/MVP2_PREP_BRIEF.md`
  - `docs/backlog/MVP2_DRAFT_BACKLOG.md`
  - `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `docs/adr/0005-mvp2-contract-hardening.md`
  - `docs/handoffs/wave-006/PM_REPORT.md`

## 완료한 작업
- Wave 6 필수 문서와 handoff-reporting skill을 확인했다.
- MVP 2 extraction user flow를 확정했다.
  - source 선택 → profile/parse → ontology/prompt 선택 → job 생성/실행 → monitor → candidate/evidence 확인.
- MVP 2 enum/status source를 확정했다.
  - `SourceSegment.segment_type`: `SourceSegmentType`
  - `SourceProfileColumn.inferred_type`: `ProfileInferredType`
  - `ExtractionJob.status`: `ExtractionJobStatus`
  - `ModelRun.status`: `ModelRunStatus`
  - candidate validation/review/publish: `ValidationStatus`, `CandidateValidationCode`, `CandidateReviewStatus`, `PublishStatus`
- Evidence policy를 확정했다.
  - 정상 candidate는 evidence 필수.
  - evidence 없는 candidate는 warning/debug record로만 저장 가능.
  - broken evidence reference는 failed validation으로 처리.
- MockProvider deterministic fixture 기준을 정의했다.
  - 외부 LLM/network/credential 없이 동작.
  - 같은 source/ontology/prompt/fixture는 같은 candidate content/evidence locator를 반환.
  - missing fixture와 partial invalid fixture의 status/error 기준을 정의.
- `ModelRun.raw_request`/`raw_response` masking policy를 정의했다.
  - unmasked payload 저장 금지.
  - secret/token/API key/signed URL/full source text 저장 금지.
  - `masking_version`, `redaction_summary`로 QA 확인 가능해야 함.
- ADR 0005를 추가해 MVP 2 contract hardening 결정을 기록했다.

## 변경 파일
- `docs/pm/GLOSSARY.md`
- `docs/pm/MVP2_PREP_BRIEF.md`
- `docs/backlog/MVP2_DRAFT_BACKLOG.md`
- `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
- `docs/adr/0005-mvp2-contract-hardening.md`
- `docs/handoffs/wave-006/PM_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `sed -n '1,260p' AGENTS.md`
  - `sed -n '1,260p' .agents/skills/handoff-reporting/SKILL.md`
  - `sed -n '1,260p' docs/handoffs/CURRENT_STATE.md`
  - `sed -n '1,260p' docs/handoffs/wave-005/NEXT_ORDERS.md`
  - `sed -n '1,260p' docs/pm/MVP2_PREP_BRIEF.md`
  - `sed -n '1,260p' docs/backlog/MVP2_DRAFT_BACKLOG.md`
  - `sed -n '1,300p' docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `sed -n '1,260p' docs/pm/GLOSSARY.md`
  - `rg -n 'SourceSegmentType|ProfileInferredType|ModelRunStatus|CandidateValidationCode|MISSING_EVIDENCE|INVALID_EVIDENCE_REFERENCE|MOCK_FIXTURE_NOT_FOUND|review_status=PENDING|publish_status=NOT_PUBLISHED|raw_request|raw_response|masking_version|redaction_summary' ...`
  - `rg -n 'must be fixed before implementation|reuse MVP 1 PropertyDataType|not locked yet|required before implementation|Whether actual LLM provider' ...`
  - `rg -n 'expert review|publish graph|RAG|automatic approval|large distributed' ...`
  - `git diff --check`
- 결과:
  - 필수 문서 확인 완료.
  - 새 enum/status/evidence/mock/masking 키워드가 glossary, prep brief, backlog, API draft, ADR에 반영됨을 확인했다.
  - 이전 미확정 문구(`must be fixed before implementation`, `not locked yet`, 실제 LLM 필요 여부 등)는 남아 있지 않음을 확인했다.
  - excluded scope 문구가 유지됨을 확인했다.
  - `git diff --check` 통과.
- 실행하지 못한 검증:
  - PM contract 문서 작업이므로 backend test, frontend build, QA smoke, Docker Compose는 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
  - 신규 enum source 문서화:
    - `SourceSegmentType`: `SHEET`, `ROW`, `CELL`, `PAGE`, `SECTION`, `PARAGRAPH`, `CHUNK`
    - `ProfileInferredType`: `STRING`, `TEXT`, `INTEGER`, `FLOAT`, `BOOLEAN`, `DATE`, `DATETIME`, `URI`, `EMPTY`, `MIXED`, `UNKNOWN`
    - `ModelRunStatus`: `PENDING`, `RUNNING`, `SUCCESS`, `FAILED`, `CANCELLED`
    - `CandidateValidationCode`: `MISSING_EVIDENCE`, `INVALID_EVIDENCE_REFERENCE`, `SCHEMA_MISMATCH`, `ONTOLOGY_ELEMENT_NOT_FOUND`, `RELATION_ENDPOINT_MISSING`, `LOW_CONFIDENCE`, `PROVIDER_OUTPUT_INVALID`
  - API draft DTO 보강:
    - `ExtractionJob`: `error_code`, `retry_of_job_id`
    - `ModelRun`: `masking_version`, `redaction_summary`
    - `CandidateEntity`/`CandidateRelation`: `prompt_version_id`, `evidence_ids[]`, `validation_codes[]`
    - Candidate list filter: `limit`, `offset`, `source_id`, `ontology_version_id`, `validation_status`, `has_evidence`
  - Evidence 없는 candidate 저장 정책:
    - 저장 가능하나 정상 후보가 아니며 `validation_status=WARNING`, `validation_codes=["MISSING_EVIDENCE"]`, `publish_status=NOT_PUBLISHED` 필수.
  - Broken evidence reference 정책:
    - `validation_status=FAILED`, `validation_codes=["INVALID_EVIDENCE_REFERENCE"]`.
- 영향받는 역할:
  - Backend: DB/API/OpenAPI 구현 시 위 enum과 DTO 필드를 기준으로 맞춘다.
  - Frontend: `shared/api`와 mocks에서 local enum alias를 만들지 말고 glossary/API draft 값을 사용한다.
  - QA: deterministic fixture, evidence traceability, status lifecycle, raw payload masking을 Wave 6 검증 기준으로 삼는다.

## Blocker
- PM/Architecture blocker 없음.
- 남은 draft risk:
  - Candidate confidence scale과 threshold는 first thin slice QA 이후 조정 필요.
  - PDF parsing library와 chunking default size/overlap은 구현 결과를 보고 확정 필요.
  - Candidate 조회 filter가 실제 FE actual API mode에 충분한지 Backend/Frontend 구현 후 재확인 필요.

## 남은 TODO
- Backend:
  - Wave 6 thin slice 구현 후 OpenAPI export에 enum/DTO 정책 반영.
  - MockProvider idempotency/natural key와 raw payload masking 테스트 추가.
- Frontend:
  - MVP 2 mock/API boundary에서 `SourceSegmentType`, `ProfileInferredType`, `ExtractionJobStatus`, `ModelRunStatus`, candidate status/code를 동일 문자열로 사용.
  - Evidence 없는 candidate와 broken evidence candidate의 UI 상태를 구분.
- QA:
  - `MISSING_EVIDENCE`, `INVALID_EVIDENCE_REFERENCE`, missing fixture, partial invalid fixture, retry idempotency, raw payload masking을 테스트 항목에 포함.
- PM:
  - Backend/Frontend Wave 6 구현 중 contract 충돌이 보고되면 API draft와 glossary를 즉시 갱신.

## 다른 역할에 전달할 내용
- PM:
  - PM2-001~PM2-005 기준은 문서상 확정됨.
- Backend:
  - `PropertyDataType`을 profile inferred type으로 직접 재사용하지 말고 `ProfileInferredType`을 사용한다.
  - Review/publish workflow를 구현하지 않는다. Candidate default는 `review_status=PENDING`, `publish_status=NOT_PUBLISHED`.
  - `raw_request`/`raw_response`는 masked JSON만 저장한다.
- Frontend:
  - Candidate display는 evidence-first로 구성한다. Evidence 없는 candidate는 normal/ready 상태로 보이면 안 된다.
  - 실제 provider 설정 UI나 review/publish/RAG 화면은 만들지 않는다.
- QA:
  - Deterministic MockProvider 검증은 same input repeatability, missing fixture failure, partial invalid fixture, retry no-duplicate를 포함한다.
  - Masking 검증은 secret key redaction과 full source text 미저장을 포함한다.

## 총괄에게 요청하는 결정
- 없음.

## 현재 판정
- PASS
