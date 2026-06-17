# Backend Report - Wave 7

## 담당 범위
- backlog ID: support BE2-001~BE2-007, BE2-009, support INT2-001~INT2-004
- 작업 경로: `apps/backend/`, `docs/api/openapi-mvp2-draft.json`

## 완료한 작업
- Wave 7 필수 문서와 handoff-reporting skill을 확인했다.
- OpenAPI examples를 FE sync 기준에 맞게 보강했다.
  - `SourceProfile`
  - `SourceParseResponse`
  - `PromptTemplate`
  - `PromptVersion`
  - `ExtractionJobCreateRequest`
  - `ExtractionJobDetail`
  - `CandidateEntity`
  - `CandidateRelation`
  - `CandidateEvidence`
- `ExtractionJobCreateRequest.provider`를 OpenAPI schema에서도 `mock` literal로 고정했다.
- `MockProvider` alias는 추가하지 않았고, API value는 `mock`만 유지했다.
- PM 승인에 따라 QA smoke 전용 deterministic fixture hook `fixture_id=invalid_evidence_reference`를 추가했다.
  - 해당 fixture는 `PARTIAL_FAILED` job을 만들고, 최소 1개 `CandidateEntity`를 `validation_status=FAILED`, `validation_codes=["INVALID_EVIDENCE_REFERENCE"]`로 저장한다.
  - 깨진 evidence reference는 실제 `CandidateEvidence` record를 만들지 않고 `evidence_ids=["invalid-evidence-reference"]`로 노출한다.
- MVP 1 regression과 MVP 2 backend smoke를 pytest로 재수행했다.
- `docs/api/openapi-mvp2-draft.json`을 재생성하고 freshness를 확인했다.

## 변경 파일
- `apps/backend/app/integrations/llm/mock_provider.py`
- `apps/backend/app/modules/candidate/schemas.py`
- `apps/backend/app/modules/extraction/router.py`
- `apps/backend/app/modules/extraction/schemas.py`
- `apps/backend/app/modules/prompt/schemas.py`
- `apps/backend/app/modules/source/schemas.py`
- `apps/backend/tests/test_project_ontology_api.py`
- `docs/api/openapi-mvp2-draft.json`
- `docs/handoffs/wave-007/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
- `cd apps/backend && .venv/bin/ruff check app tests scripts`
- `cd apps/backend && .venv/bin/pytest`
- `cd apps/backend && .venv/bin/python scripts/export_openapi.py`
- `cd apps/backend && tmpfile=$(mktemp /private/tmp/openapi-mvp2-draft.XXXXXX); .venv/bin/python scripts/export_openapi.py --output "$tmpfile" && cmp -s "$tmpfile" ../../docs/api/openapi-mvp2-draft.json`
- `python3` OpenAPI schema inspection for required examples and provider literal
- `python3` OpenAPI path/enum restriction inspection
- `git diff --check -- apps/backend docs/api/openapi-mvp2-draft.json`
- 결과:
- Ruff PASS
- Pytest PASS: 7 passed
- OpenAPI MVP2 draft freshness PASS
- Required schema examples present PASS
- Provider literal check PASS: `ExtractionJobCreateRequest.provider` has `const: mock`
- Restriction check PASS: no new RAG/dashboard/candidate detail API; existing publish path is MVP1 ontology version publish only
- 실행하지 못한 검증:
- Docker compose 검증은 Wave 7 backend contract sync 필수 범위가 아니어서 수행하지 않음

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
- `ExtractionJobCreateRequest.provider`, `ExtractionJob.provider`, `ModelRun.provider` schema를 `mock` literal로 명확화했다.
- OpenAPI component examples를 FE sync에 필요한 필드가 보이도록 보강했다.
- 신규 provider alias 없음. `MockProvider`는 Python class/UI display label 개념이며 API value가 아니다.
- `invalid_evidence_reference` fixture hook 추가. Product workflow API가 아니라 existing job create/run flow의 deterministic fixture id다.
- 신규 endpoint 없음.
- enum 추가/삭제 없음.
- 영향받는 역할:
- Frontend: `docs/api/openapi-mvp2-draft.json`만 보고 `provider: "mock"`, parse response, candidate/evidence nullable shape, job detail `model_runs[]`를 동기화 가능
- QA: `fixture_id=invalid_evidence_reference`로 `INVALID_EVIDENCE_REFERENCE` runtime smoke 가능
- PM: Wave 7 PM 결정대로 provider literal/display split과 candidate list plain array shape 유지됨

## Blocker
- Backend blocker 없음

## 남은 TODO
- Retry chain 전체 dedupe natural key는 PM 결정이 문서화되었으나 이번 Wave 7에서는 기능 확장 방침 때문에 구현하지 않음
- 고급 PDF parsing, evidence highlight, candidate detail drawer, external LLM provider, review/publish/RAG API는 계속 후속 범위
- OpenAPI artifact 운영을 MVP1/MVP2 병행으로 유지할지 다음 wave에서 총괄 판단 필요

## 다른 역할에 전달할 내용
- PM: `invalid_evidence_reference` hook은 QA smoke 전용으로 추가 완료. 신규 product API는 열지 않았음.
- Backend: provider API value는 계속 `mock`만 허용. `MockProvider` alias를 request 값으로 받지 않는다.
- Frontend: job create payload는 `provider: "mock"`를 보내야 한다. `MockProvider`는 표시명으로만 사용한다. `GET /api/v1/extraction-jobs/{job_id}`의 `model_runs[]`를 monitor source로 사용한다.
- QA: invalid evidence smoke는 source parse, prompt version, job create 후 `fixture_id=invalid_evidence_reference`로 job run을 실행하면 된다. 실패 candidate는 `validation_status=FAILED`, `validation_codes=["INVALID_EVIDENCE_REFERENCE"]`로 조회된다.

## 총괄에게 요청하는 결정
- Retry chain dedupe 구현을 Wave 8 backend scope로 열지 여부 결정 필요
- OpenAPI artifact 운영 정책을 MVP1/MVP2 병행 유지 또는 latest artifact 추가 중 선택 필요

## 현재 판정
- PASS
