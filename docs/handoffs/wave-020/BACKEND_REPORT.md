# Backend Report - Wave 20

## 담당 범위
- backlog ID:
  - `BE4-001` Advanced quality metrics runtime
  - `BE4-002` Evaluation dataset/golden set runtime
  - `BE4-003` Evaluation run and prompt/model performance runtime
  - `BE4-004` Keyword search runtime
  - `BE4-005` Vector/similar evidence adapter fallback runtime
  - `BE4-006` Grounded RAG answer runtime
  - `BE4-007` Advanced published graph explorer runtime
  - `BE4-008` External read-only API runtime
  - `BE4-009` Actual OpenAPI export alignment
- 작업 경로:
  - `apps/backend/app/modules/mvp4/`
  - `apps/backend/app/api/router.py`
  - `apps/backend/app/core/enums.py`
  - `apps/backend/scripts/seed_mvp4.py`
  - `apps/backend/tests/test_mvp4_api.py`
  - `docs/handoffs/wave-020/BACKEND_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `01_BACKEND_AGENT_SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-020/NEXT_ORDERS.md`
  - `docs/handoffs/wave-020/PM_REPORT.md`
  - `docs/handoffs/wave-019/BACKEND_REPORT.md`
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `docs/api/MVP4_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp4-draft.json`
  - `docs/adr/0007-mvp4-search-rag-read-only-boundary.md`
  - `apps/backend/README.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- MVP4 enum을 `app/core/enums.py`에 additive로 추가했다.
- `apps/backend/app/modules/mvp4/`에 Pydantic schemas, deterministic service, FastAPI router를 추가했다.
- 구현한 endpoint families:
  - advanced quality metrics list/detail
  - evaluation datasets, versions, golden items list/detail/create draft
  - evaluation runs, prompt experiments, prompt-performance summary list/detail/create draft
  - grouped search
  - vector status and similar evidence keyword fallback
  - grounded RAG answer with `ANSWERED` and `INSUFFICIENT_EVIDENCE`
  - published graph explore and lineage with `READY` and `SAFE_TOO_LARGE`
  - external dev-auth read-only graph/source/evidence/search/RAG endpoints
- persistence/migration은 추가하지 않았다. Wave20 목표가 deterministic, smokeable thin runtime이므로 MVP3 published graph/source/evidence DB state와 local deterministic service fixtures를 조합했다.
- `scripts/seed_mvp4.py`를 추가해 `seed_mvp3.py` 기반 fixed project를 만들고 MVP4 QA example IDs/states를 JSON으로 보고하게 했다.
- candidate-only facts are excluded from:
  - internal RAG answer facts/citations
  - graph explorer nodes/edges
  - external graph snapshot reads
- external API는 `X-Dev-Auth: mvp4-dev` 없이는 `401 DEV_AUTH_REQUIRED`를 반환하고, graph/source/evidence lookup path에는 write method가 없다.
- weighted composite quality score, collaboration/SLA, production vector DB dependency는 구현하지 않았다.

## 변경 파일
- `apps/backend/app/api/router.py`
- `apps/backend/app/core/enums.py`
- `apps/backend/app/modules/mvp4/__init__.py`
- `apps/backend/app/modules/mvp4/router.py`
- `apps/backend/app/modules/mvp4/schemas.py`
- `apps/backend/app/modules/mvp4/service.py`
- `apps/backend/scripts/seed_mvp4.py`
- `apps/backend/tests/test_mvp4_api.py`
- `docs/handoffs/wave-020/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/backend && python3 -m json.tool ../../docs/api/openapi-mvp4-draft.json >/tmp/openapi-mvp4-draft.wave20.pretty.json`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output /tmp/ontology-wave20-openapi.json`
  - `cd apps/backend && python3 -m json.tool /tmp/ontology-wave20-openapi.json >/tmp/ontology-wave20-openapi.pretty.json`
  - `cd apps/backend && python3 - <<'PY' ...` critical OpenAPI path/schema/enum compare against `docs/api/openapi-mvp4-draft.json`
  - `cd apps/backend && rm -f /tmp/ontology-mvp4-seed.db /tmp/ontology-mvp4-seed.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-mvp4-seed.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-mvp4-seed.db .venv/bin/python scripts/seed_mvp4.py --output /tmp/ontology-mvp4-seed.json && python3 -m json.tool /tmp/ontology-mvp4-seed.json >/tmp/ontology-mvp4-seed.pretty.json`
  - `git diff --check -- apps/backend/app/api/router.py apps/backend/app/core/enums.py apps/backend/app/modules/mvp4 apps/backend/scripts/seed_mvp4.py apps/backend/tests/test_mvp4_api.py docs/handoffs/wave-020/BACKEND_REPORT.md`
- 결과:
  - MVP4 focused tests: `5 passed in 1.89s` in final consolidated run.
  - MVP3 regression: `4 passed in 1.47s` in final consolidated run.
  - `ruff check app tests scripts`: PASS, `All checks passed!`.
  - actual OpenAPI export: wrote `/tmp/ontology-wave20-openapi.json` and JSON parse PASS.
  - OpenAPI critical compare:
    - missing critical paths: `[]`
    - enum literals match for `EvaluationDatasetStatus`, `GoldenSetItemKind`, `PromptExperimentStatus`, `RagAnswerState`, `GraphExploreState`, `VectorAdapterStatus`, `ExternalApiAuthMode`
    - actual full app path count: `77`; MVP4 draft path count: `26`
    - actual full app schema count: `171`; MVP4 draft schema count: `78`
    - expected documented drift: abstract planning schema `ExternalApiEnvelopeBase` is not emitted as a standalone component because actual FastAPI response models use concrete external envelope subclasses.
  - deterministic MVP4 seed smoke: SQLite Alembic upgrade PASS, `scripts/seed_mvp4.py` PASS, `/tmp/ontology-mvp4-seed.json` JSON parse PASS.
  - `git diff --check` for backend/report files: PASS after final report write.
- 실행하지 못한 검증:
  - Docker/PostgreSQL compose smoke는 실행하지 않았다. 기존 current state의 P1 environment follow-up으로 유지된다.
  - Frontend MVP4 route smoke는 Frontend 에이전트 소유라 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 있음.
- 상세:
  - 추가 enum:
    - `EvaluationDatasetStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`
    - `GoldenSetItemKind`: `ENTITY`, `RELATION`, `PROPERTY_VALUE`, `EVIDENCE_LINK`
    - `PromptExperimentStatus`: `DRAFT`, `RUNNING`, `COMPLETED`, `CANCELLED`
    - `QualityMetricGroup`
    - `QualityMetricUnit`
    - `SearchResultKind`
    - `VectorAdapterStatus`
    - `VectorFallbackReason`
    - `RagAnswerState`
    - `RagCitationKind`
    - `GraphExploreState`
    - `ExternalApiAuthMode`
  - 추가 DTO families:
    - quality metrics and formula metadata
    - evaluation dataset/version/golden item
    - evaluation run/prompt experiment/prompt performance
    - grouped search
    - vector adapter/similar evidence
    - RAG answer/citation/insufficient evidence
    - graph explore/too-large/lineage
    - external read-only envelopes
  - 추가 API paths:
    - Wave19 draft의 26개 MVP4 paths 모두 actual OpenAPI에 존재한다.
  - contract drift:
    - `ExternalApiEnvelopeBase`는 planning artifact의 추상 base schema다. actual FastAPI schema에는 concrete envelopes가 생성되고 base component는 독립 component로 나오지 않는다. response shape는 `auth_mode`, `project_id`, optional `published_graph_version_ref`, `data`를 유지한다.
- 영향받는 역할:
  - Frontend: actual OpenAPI can be used for DTO sync; external envelope base should be treated structurally from concrete envelopes.
  - QA: use `/tmp/ontology-mvp4-seed.json` examples and `X-Dev-Auth: mvp4-dev` for external read smoke.
  - PM: no new P0 scope decision needed.

## Blocker
- Product/API blocker: 없음.
- Environment blocker:
  - Docker Compose smoke는 이번 backend validation에서 실행하지 않았다.
- Known limitation:
  - MVP4 evaluation datasets/runs/experiments are deterministic local fixtures, not persisted tables.
  - vector/similar evidence uses explicit keyword fallback, not a production vector DB.

## 남은 TODO
- QA:
  - Run INT4 runtime checklist against Backend and Frontend Wave20 outputs.
  - Decide whether `ExternalApiEnvelopeBase` standalone component absence is acceptable as documented implementation drift.
- Backend future hardening:
  - If MVP4 needs editable/persistent evaluation artifacts, add SQLAlchemy models and Alembic migration in a later wave.
  - Replace local keyword fallback with production vector adapter only when PM promotes vector hardening.
- Frontend:
  - Sync actual DTOs with concrete external envelope schemas and MVP4 endpoint responses.

## 다른 역할에 전달할 내용
- PM:
  - No weighted composite quality score, collaboration/SLA, or production vector hardening was introduced.
- Backend:
  - MVP4 runtime is additive to MVP3 and can be broadened later with persistence if needed.
- Frontend:
  - Use `scripts/seed_mvp4.py --output /tmp/ontology-mvp4-seed.json` after DB setup for stable IDs/states.
  - External API dev auth header is `X-Dev-Auth: mvp4-dev`.
  - RAG candidate-exclusion proof is in `mvp4.candidate_exclusion_proof`.
- QA:
  - Focus negative checks on candidate-only RAG question, `max_hops=4` graph explore, missing external dev auth, and absent external write methods.

## 총괄에게 요청하는 결정
- Accept Wave20 Backend as PASS for thin runtime implementation.
- Accept the documented actual OpenAPI drift for abstract `ExternalApiEnvelopeBase`, or issue a Wave21 order if the component must exist as a standalone schema.

## 현재 판정
- PASS
