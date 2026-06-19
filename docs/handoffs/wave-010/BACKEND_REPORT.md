# Backend Report - Wave 10

## 담당 범위
- backlog ID: BE2-001, BE2-002, BE2-003, BE2-004, BE2-005, BE2-006, BE2-007, BE2-008, BE2-009
- 작업 경로: `apps/backend/`, `docs/api/openapi-mvp2-draft.json`, `docs/handoffs/wave-010/BACKEND_REPORT.md`

## 완료한 작업
- PM Wave 10 report를 먼저 읽고 fixture catalog, broken evidence 정책, prompt lifecycle 범위를 확인했다.
- Source profile edge case를 보강했다.
  - header-only CSV/Excel column을 `inferred_type=EMPTY`, `nullable=true`, `null_ratio=1.0`, `distinct_count_sampled=0`, `sample_values=[]`로 계산한다.
  - mixed-type sample은 `ProfileInferredType.MIXED`로 계산한다.
  - null/blank sample은 `nullable`, `null_ratio`에 반영하고 `sample_values[]`는 non-null 예시를 우선한다.
- `invalid_evidence_reference` fixture를 PM 결정에 맞게 보강했다.
  - failed candidate에 non-null `source_id`, non-null `source_segment_id`, resolvable `CandidateEvidence` id를 남긴다.
  - FK를 깨지 않기 위해 숨김 shadow source/segment를 만들고, evidence의 `source_id`와 segment source를 의도적으로 mismatch 처리한다.
  - metadata에 `invalid_reference=source_segment_source_mismatch`, `expected_source_id`, `segment_source_id`를 남긴다.
- fixture catalog regression을 보강했다.
  - `default`: `SUCCESS`, normal evidence, entity/relation candidate filters.
  - `partial_invalid`: `PARTIAL_FAILED`, `MISSING_EVIDENCE`, `evidence_ids=[]`.
  - `invalid_evidence_reference`: `PARTIAL_FAILED`, `INVALID_EVIDENCE_REFERENCE`, non-null broken reference.
  - `missing`: `FAILED`, `MOCK_FIXTURE_NOT_FOUND`, no candidate persistence.
- extraction lifecycle regression을 보강했다.
  - create, run success, partial failure, missing fixture failure, retry, retry-chain dedupe preservation, masked `raw_request`/`raw_response`.
- Prompt lifecycle regression을 보강했다.
  - `PromptVersion.is_active` 표시/선택 기준 유지.
  - 새 active version 생성 시 기존 active version은 inactive가 되며, active mutation endpoint/API는 추가하지 않았다.
- Source parse regression을 보강했다.
  - TXT deterministic sequence 유지.
  - PDF no-text/empty local parse warning 및 repeated parse idempotency 확인.
  - repeated profile/parse가 duplicate visible rows를 만들지 않음을 확인했다.

## 변경 파일
- `apps/backend/app/modules/source/router.py`
- `apps/backend/app/modules/extraction/router.py`
- `apps/backend/tests/test_project_ontology_api.py`
- `docs/handoffs/wave-010/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_project_ontology_api.py -k "wave10_source_profile or mvp2_prompt"`
  - `cd apps/backend && .venv/bin/ruff format app/modules/source/router.py app/modules/extraction/router.py tests/test_project_ontology_api.py`
  - `cd apps/backend && .venv/bin/pytest tests/test_project_ontology_api.py -k "wave10_source or mvp2_prompt"`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && .venv/bin/pytest`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py`
  - `cd apps/backend && tmpfile=$(mktemp /private/tmp/openapi-mvp2-wave10.XXXXXX); .venv/bin/python scripts/export_openapi.py --output "$tmpfile" && cmp -s "$tmpfile" ../../docs/api/openapi-mvp2-draft.json`
  - `git diff --check -- apps/backend docs/api/openapi-mvp2-draft.json`
- 결과:
  - TDD RED 확인:
    - header-only profile이 기존 `STRING/nullable=false/null_ratio=0.0`으로 실패.
    - `invalid_evidence_reference` failed candidate의 `source_segment_id`가 `null`로 실패.
  - Wave 10 selected smoke: `3 passed, 8 deselected`
  - Ruff format: `1 file reformatted, 2 files left unchanged`
  - Ruff check: `All checks passed!`
  - Backend full pytest: `11 passed in 1.27s`
  - OpenAPI MVP2 draft freshness: `OPENAPI_MVP2_DRAFT_FRESH`
  - diff whitespace check: PASS
- 실행하지 못한 검증:
  - Docker Compose smoke는 이번 Backend Wave 10 범위가 아니며, Docker CLI environment exception은 기존 상태를 유지한다.
  - Frontend browser smoke는 Frontend/QA 범위라 수행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - 신규 endpoint, enum, DTO/schema 추가 없음.
  - `docs/api/openapi-mvp2-draft.json`은 재생성했고 현재 backend export와 일치한다.
  - provider API literal은 계속 `mock`만 허용한다.
  - candidate detail endpoint, external LLM provider, review/publish/RAG/advanced PDF parsing은 추가하지 않았다.
- 영향받는 역할:
  - Frontend/QA는 기존 OpenAPI 계약 그대로 사용 가능.
  - `invalid_evidence_reference` fixture는 이제 evidence detail fetch가 200을 반환하며 metadata로 broken reference 원인을 확인할 수 있다.

## Blocker
- 없음.
- 참고: 작업 시작 시 PM docs 및 일부 Frontend 파일 변경이 이미 존재했으며, Backend 범위 밖이라 수정하지 않았다.

## 남은 TODO
- 없음.
- 후속 hardening에서 필요하면 parse 재실행 시 기존 warning을 다시 반환하도록 `SourceParseResponse` warning persistence를 별도 결정할 수 있다. 현재 Wave 10 acceptance의 duplicate visible row 방지는 PASS다.

## 다른 역할에 전달할 내용
- PM: Wave 10 fixture/source/prompt/job acceptance를 backend actual API와 regression으로 반영했다. schema change는 없다.
- Backend: `invalid_evidence_reference`는 hidden shadow source/segment를 통해 source/segment mismatch broken reference를 만든다. shadow source는 `is_deleted=True`라 source list/count에 노출되지 않는다.
- Frontend: broken evidence fixture에서 candidate/evidence 모두 non-null `source_segment_id`를 가진다. evidence metadata의 `invalid_reference`, `expected_source_id`, `segment_source_id`로 fallback copy/debug context를 구성할 수 있다.
- QA: fixture catalog smoke는 full pytest에 포함됐다. `default`, `partial_invalid`, `invalid_evidence_reference`, `missing`, retry/dedupe, candidate filters, source profile/parse edge cases를 `tests/test_project_ontology_api.py`에서 확인할 수 있다.

## 총괄에게 요청하는 결정
- 없음.

## 현재 판정
- PASS
