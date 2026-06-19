# Backend Report - Wave 8

## 담당 범위
- backlog ID: BE2-008, support BE2-005~BE2-007, BE2-009, INT2-004
- 작업 경로: `apps/backend/`, `docs/api/openapi-mvp2-draft.json`

## 완료한 작업
- Wave 8 필수 문서와 PM Wave 8 decision을 확인했다.
- 승인된 범위인 retry-chain dedupe를 기존 extraction job/candidate/evidence API 안에서 구현했다.
- retry root는 `retry_of_job_id`가 null인 최초 ancestor job으로 계산한다.
- retry chain은 retry root와 모든 descendant job 범위로 계산한다.
- candidate natural key는 PM 결정 기준에 맞춰 retry root, provider, fixture, source, ontology version, prompt version, candidate kind, `client_candidate_id`로 구성한다.
- provider output에 `client_candidate_id`가 없으면 fixture/kind/provider index 기반 deterministic fallback을 사용한다.
- evidence natural key는 retry root, provider, fixture, source, source segment, `client_evidence_id` 또는 deterministic segment locator로 구성한다.
- retry run에서 같은 natural key candidate는 새 row를 만들지 않고 skip한다.
- 같은 natural key evidence는 새 row를 만들지 않고 기존 `CandidateEvidence`를 reuse한다.
- dedupe 결과는 새 DTO 필드 없이 `ModelRun.raw_response.dedupe`와 job `error_message`에 남긴다.
- status transition은 기존 정책 안에서 유지했다.
  - retry source job: `PARTIAL_FAILED`/`FAILED` -> `RETRYING`
  - retry job: `PENDING` -> `RUNNING` -> `SUCCESS` 또는 `PARTIAL_FAILED`/`FAILED`
- retry-chain dedupe behavior를 pytest smoke에 추가했다.
- OpenAPI export/freshness를 재확인했다. schema 변경은 없어 `docs/api/openapi-mvp2-draft.json` diff는 없음.

## 변경 파일
- `apps/backend/app/modules/extraction/router.py`
- `apps/backend/tests/test_project_ontology_api.py`
- `docs/handoffs/wave-008/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
- `cd apps/backend && .venv/bin/ruff check app tests scripts`
- `cd apps/backend && .venv/bin/pytest`
- `cd apps/backend && .venv/bin/python scripts/export_openapi.py`
- `cd apps/backend && tmpfile=$(mktemp /private/tmp/openapi-mvp2-draft.XXXXXX); .venv/bin/python scripts/export_openapi.py --output "$tmpfile" && cmp -s "$tmpfile" ../../docs/api/openapi-mvp2-draft.json`
- `python3` OpenAPI path/provider restriction inspection
- `git diff --check -- apps/backend docs/api/openapi-mvp2-draft.json`
- 결과:
- Ruff PASS
- Pytest PASS: 7 passed
- MVP 1 regression PASS via existing pytest health/project/ontology/source coverage
- MVP 2 contract smoke PASS via existing profile/parse/prompt/job/candidate/evidence tests
- Retry-chain dedupe smoke PASS: `invalid_evidence_reference` partial job retry creates 0 duplicate candidates/relations in retry job and reports 4 skipped duplicate candidates
- OpenAPI MVP2 draft freshness PASS
- Provider literal remains `mock`
- 신규 RAG/dashboard/candidate detail endpoint 없음 확인
- Candidate publish/review API 추가 없음
- 실행하지 못한 검증:
- Docker compose 검증은 현재 backend Wave 8 필수 범위가 아니어서 수행하지 않음

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
- 신규 endpoint 없음
- 신규 enum 없음
- 신규 DTO field 없음
- `docs/api/openapi-mvp2-draft.json`은 재생성했지만 schema diff 없음
- 영향받는 역할:
- Frontend: 기존 `GET /api/v1/extraction-jobs/{job_id}`, candidate list, evidence endpoint를 그대로 사용하면 됨. Retry job의 `error_message`와 `model_runs[].raw_response.dedupe`에서 reused/skipped 상태를 읽을 수 있음.
- QA: retry-chain dedupe smoke는 `invalid_evidence_reference` job 생성/run 후 retry/run 순서로 확인 가능.

## Blocker
- Backend blocker 없음

## 남은 TODO
- retry chain 전체 결과를 job-specific candidate list에서 어떻게 UX로 보여줄지는 Frontend/PM UX 결정에 따른다. 현재 Backend는 duplicate row 생성을 막고 dedupe 결과를 job detail에 남긴다.
- dedupe natural key를 DB column/unique constraint로 승격할지는 후속 hardening 범위다. Wave 8은 기존 JSON payload/metadata 기반으로 구현했다.
- external LLM provider, review/publish, RAG, advanced PDF parsing, candidate detail 전용 endpoint는 계속 제외 상태다.

## 다른 역할에 전달할 내용
- PM: Wave 8 승인 범위인 retry-chain dedupe만 구현했고, 새 API/DTO는 추가하지 않았다.
- Backend: dedupe helper는 `apps/backend/app/modules/extraction/router.py`에 있으며, natural key는 candidate `raw_payload.retry_chain_natural_key`와 evidence `metadata.retry_chain_natural_key`에 저장된다.
- Frontend: retry job run 후 duplicate가 모두 skip되면 retry job의 candidate count가 0일 수 있다. 이때 `error_message`와 `model_runs[].raw_response.dedupe.skipped_duplicate_candidates`로 reused/skipped 상태를 표시하면 된다.
- QA: retry-chain dedupe 검증 기준은 partial job retry 후 retry job candidate list가 비어 있고 root job candidate list가 기존 3건으로 유지되는지, model run raw response의 dedupe count가 맞는지 확인하는 것이다.

## 총괄에게 요청하는 결정
- retry-chain dedupe natural key를 후속 wave에서 DB unique/index 수준으로 승격할지 결정 필요
- retry job 화면에서 root chain candidates를 자동 합산 표시할지, 현재처럼 job-specific result와 dedupe summary를 분리할지 UX/API 정책 결정 필요

## 현재 판정
- PASS
