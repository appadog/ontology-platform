# Backend Report - Wave 6

## 담당 범위
- backlog ID: BE2-001, BE2-002, BE2-003, BE2-004, BE2-005, BE2-006, BE2-007, BE2-009
- 작업 경로: `apps/backend/`, `docs/api/openapi-mvp2-draft.json`

## 완료한 작업
- SourceSegment, SourceProfile 모델 및 Alembic migration 추가
- CSV/Excel source profiling API 추가
- CSV/Excel row/cell segment parse API 추가
- TXT/PDF deterministic local parse/chunk API 추가
- PromptTemplate/PromptVersion scaffold API 추가
- ExtractionJob/ModelRun scaffold API 추가
- LLM provider interface 및 deterministic MockProvider 추가
- CandidateEntity/CandidateRelation/CandidateEvidence persistence scaffold 및 read API 추가
- MVP2 draft OpenAPI export 파일 생성
- deterministic pytest smoke 추가 및 MVP1 regression 함께 검증

## 변경 파일
- `apps/backend/README.md`
- `apps/backend/app/api/router.py`
- `apps/backend/app/core/enums.py`
- `apps/backend/app/db/base.py`
- `apps/backend/app/db/migrations/versions/20260617_0003_mvp2_thin_slice.py`
- `apps/backend/app/integrations/__init__.py`
- `apps/backend/app/integrations/llm/__init__.py`
- `apps/backend/app/integrations/llm/base.py`
- `apps/backend/app/integrations/llm/mock_provider.py`
- `apps/backend/app/modules/source/models.py`
- `apps/backend/app/modules/source/router.py`
- `apps/backend/app/modules/source/schemas.py`
- `apps/backend/app/modules/prompt/*`
- `apps/backend/app/modules/extraction/*`
- `apps/backend/app/modules/candidate/*`
- `apps/backend/scripts/export_openapi.py`
- `apps/backend/tests/test_project_ontology_api.py`
- `docs/api/openapi-mvp2-draft.json`
- `docs/handoffs/wave-006/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
- `cd apps/backend && .venv/bin/ruff check app tests scripts`
- `cd apps/backend && .venv/bin/pytest`
- `cd apps/backend && .venv/bin/python scripts/export_openapi.py`
- `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-wave6-alembic.sqlite .venv/bin/alembic upgrade head`
- `cd apps/backend && tmpfile=$(mktemp /private/tmp/openapi-mvp2-draft.XXXXXX); .venv/bin/python scripts/export_openapi.py --output "$tmpfile" && cmp -s "$tmpfile" ../../docs/api/openapi-mvp2-draft.json`
- 결과:
- Ruff PASS
- Pytest PASS: 7 passed
- Alembic migration PASS: 20260617_0001 -> 0002 -> 0003
- OpenAPI MVP2 draft freshness PASS
- 실행하지 못한 검증:
- Docker compose 검증은 Wave 6 필수 검증 범위가 아니어서 수행하지 않음

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
- 신규 enum: `SourceSegmentType`, `ProfileInferredType`, `ModelRunStatus`, `CandidateValidationCode`
- 유지 enum: `SourceStatus`에 delete/archive 값 추가 없음
- 신규 Source API: `POST/GET /api/v1/sources/{source_id}/profile`, `POST /api/v1/sources/{source_id}/parse`, `GET /api/v1/sources/{source_id}/segments`
- 신규 Prompt API: `GET/POST /api/v1/projects/{project_id}/prompts`, `GET/POST /api/v1/prompts/{prompt_id}/versions`
- 신규 Extraction API: `GET/POST /api/v1/projects/{project_id}/extraction-jobs`, `GET /api/v1/extraction-jobs/{job_id}`, `POST /api/v1/extraction-jobs/{job_id}/run`, `POST /api/v1/extraction-jobs/{job_id}/retry`
- 신규 Candidate read API: `GET /api/v1/extraction-jobs/{job_id}/candidates/entities`, `GET /api/v1/extraction-jobs/{job_id}/candidates/relations`, `GET /api/v1/candidate-evidence/{evidence_id}`
- 신규 DTO/schema: `SourceProfile`, `SourceSegment`, `PromptTemplate`, `PromptVersion`, `ExtractionJob`, `ExtractionJobDetail`, `ModelRun`, `CandidateEntity`, `CandidateRelation`, `CandidateEvidence`
- 영향받는 역할:
- Frontend: `docs/api/openapi-mvp2-draft.json` 기준으로 MVP2 draft 타입/fixture sync 가능
- QA: MVP2 thin flow smoke는 parse -> prompt version -> extraction job -> run -> candidate/evidence 조회 순서로 검증
- PM: PDF 고급 parsing, 실제 provider, review/publish/RAG는 미구현 유지

## Blocker
- 없음

## 남은 TODO
- PDF 고급 text extraction 및 page/offset 정확도 개선
- CSV/Excel full-file profiling 및 다중 sheet 처리
- MockProvider fixture 파일 기반 시나리오가 필요하면 fixture registry 추가
- Candidate validation rule 세분화
- 외부 LLM provider 연동은 후속 MVP 범위 결정 후 진행
- expert review, publish graph, RAG API는 후속 범위 결정 전까지 추가 금지 유지

## 다른 역할에 전달할 내용
- PM: Wave 6 thin slice는 contract hardening 중심으로 PASS. PDF는 deterministic byte decode만 제공하므로 데모/acceptance 문구에 고급 PDF parsing 제외를 명시해야 함.
- Backend: `ModelRun.raw_request/raw_response`에는 source full text, secrets, signed URL을 저장하지 않도록 유지. Retry는 새 job을 생성하고 원본 job을 `RETRYING`으로 표시함.
- Frontend: MVP2 draft 타입 기준 파일은 `docs/api/openapi-mvp2-draft.json`. MVP1 canonical `openapi-mvp1.json`은 이번 작업에서 갱신하지 않음.
- QA: MVP1 regression 및 MVP2 thin flow pytest PASS. 수동 smoke 시 source parse를 먼저 실행해야 extraction run이 성공함.

## 총괄에게 요청하는 결정
- MVP2에서 PDF parser dependency를 도입할지, thin byte-decode 유지 후 후속 wave로 넘길지 결정 필요
- Candidate validation code의 strict failure/warning 기준을 PM/QA acceptance에 맞춰 확정 필요
- OpenAPI artifact 운영을 MVP1/MVP2 병행으로 유지할지, 다음 wave부터 단일 latest artifact로 전환할지 결정 필요

## 현재 판정
- PASS
