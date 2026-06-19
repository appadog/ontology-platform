# Backend Report - Wave 19

## 담당 범위
- backlog ID: `BE4-001`~`BE4-009`
- 작업 경로:
  - `docs/api/MVP4_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp4-draft.json`
  - `docs/handoffs/wave-019/BACKEND_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `01_BACKEND_AGENT_SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-019/NEXT_ORDERS.md`
  - `docs/handoffs/wave-019/PM_REPORT.md`
  - `docs/pm/MVP4_PREP_BRIEF.md`
  - `docs/backlog/MVP4_DRAFT_BACKLOG.md`
  - `docs/adr/0007-mvp4-search-rag-read-only-boundary.md`
  - `docs/api/MVP3_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp3-draft.json`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- MVP4 Backend contract-first draft를 작성했다.
- MVP3 API boundary를 보존하고 MVP4 endpoint를 additive extension으로 문서화했다.
- `BE4-001` advanced quality metrics:
  - explainable metric groups only P0 boundary를 반영했다.
  - weighted composite score는 P1/non-goal로 분리했다.
  - formula metadata 필수 필드 `numerator`, `denominator`, `scope`, `time_window`, `breakdown_dimension`, `drilldown_target`를 DTO에 반영했다.
- `BE4-002` evaluation dataset/golden set:
  - dataset, dataset version, golden item DTO와 provenance refs를 설계했다.
  - `EvaluationDatasetStatus`, `GoldenSetItemKind`를 PM freeze 기준으로 반영했다.
- `BE4-003` evaluation run and prompt/model performance:
  - prompt experiment, evaluation run, performance summary DTO를 설계했다.
  - prompt version, model run, source type, class type, relation type, validation outcome, review decision, correction pattern dimensions를 반영했다.
  - `PromptExperimentStatus`를 PM freeze 기준으로 반영했다.
- `BE4-004` keyword search:
  - published graph/source/evidence/lineage grouped result contract를 정의했다.
- `BE4-005` vector/similar evidence:
  - vector adapter state, embedding target, fallback reason, similar evidence item contract를 정의했다.
  - production vector DB hardening은 P1로 문서화했다.
- `BE4-006` grounded RAG:
  - answer/citations/linked published facts/insufficient-evidence state DTO를 설계했다.
  - candidate graph facts exclusion을 request/response boundary에 명시했다.
- `BE4-007` advanced published graph explorer:
  - n-hop, class/relation filters, quality/source overlays, lineage panel, selected/current version context를 정의했다.
  - default `max_hops=2`, max `3`, budget `150` nodes / `300` edges, `SAFE_TOO_LARGE` state를 반영했다.
- `BE4-008` external read-only APIs:
  - graph/source/evidence/search/RAG read-only external endpoint draft를 정의했다.
  - `ExternalApiAuthMode=DEV_AUTH`로 MVP4 dev-auth-only boundary를 명시했다.
- `BE4-009` OpenAPI draft:
  - `docs/api/openapi-mvp4-draft.json`를 OpenAPI 3.1 planning artifact로 작성했다.
- 앱 runtime/backend/frontend 파일, migration, seed script는 수정하지 않았다.
- `docs/backlog/MVP4_DRAFT_BACKLOG.md`는 PM freeze 문구와 Backend acceptance가 이미 일치하여 수정하지 않았다.

## 변경 파일
- `docs/api/MVP4_API_CONTRACT_DRAFT.md`
- `docs/api/openapi-mvp4-draft.json`
- `docs/handoffs/wave-019/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp4-draft.json >/tmp/openapi-mvp4-draft.pretty.json`
  - `python3 - <<'PY' ...` parse/count sanity check for `docs/api/openapi-mvp4-draft.json`
  - `git diff --check -- docs/api/MVP4_API_CONTRACT_DRAFT.md docs/api/openapi-mvp4-draft.json docs/handoffs/wave-019/BACKEND_REPORT.md`
  - `for f in docs/api/MVP4_API_CONTRACT_DRAFT.md docs/api/openapi-mvp4-draft.json docs/handoffs/wave-019/BACKEND_REPORT.md; do git diff --no-index --check /dev/null "$f"; ...; done`
- 결과:
  - OpenAPI JSON parse PASS: `3.1.0 0.4.0-draft`, `26 paths`, `78 schemas`.
  - `git diff --check` PASS after final validation.
  - `git diff --no-index --check` PASS for new/untracked draft files.
- 실행하지 못한 검증:
  - FastAPI export comparison은 실행하지 않았다. Wave19는 runtime route 구현이 없는 planning artifact 작성 wave다.
  - Backend pytest/ruff는 실행하지 않았다. 앱 runtime 코드를 수정하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 있음, contract draft only.
- 상세:
  - PM-frozen enums:
    - `EvaluationDatasetStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`
    - `GoldenSetItemKind`: `ENTITY`, `RELATION`, `PROPERTY_VALUE`, `EVIDENCE_LINK`
    - `PromptExperimentStatus`: `DRAFT`, `RUNNING`, `COMPLETED`, `CANCELLED`
  - Backend-drafted enums:
    - `QualityMetricGroup`
    - `QualityMetricUnit`
    - `SearchResultKind`
    - `VectorAdapterStatus`
    - `VectorFallbackReason`
    - `RagAnswerState`
    - `RagCitationKind`
    - `GraphExploreState`
    - `ExternalApiAuthMode`
  - New DTO families drafted:
    - `QualityMetricsResponse`, `QualityMetric`, `QualityFormulaMetadata`, `QualityDrilldownHint`
    - `EvaluationDataset`, `EvaluationDatasetVersion`, `GoldenSetItem`
    - `PromptExperiment`, `EvaluationRun`, `PromptPerformanceSummary`
    - `SearchResponse`, `SearchResultGroup`, `SearchResultItem`
    - `VectorAdapterState`, `SimilarEvidenceRequest`, `SimilarEvidenceResponse`
    - `RagAnswerRequest`, `RagAnswerResponse`, `RagCitation`, `InsufficientEvidenceState`
    - `GraphExploreResponse`, `GraphExploreNode`, `GraphExploreEdge`, `GraphTooLargeState`, `PublishedLineagePanel`
    - `ExternalApiEnvelope` variants for graph/source/evidence/search/RAG read APIs
  - New endpoint families drafted:
    - advanced quality metrics
    - evaluation datasets, dataset versions, golden items
    - evaluation runs, prompt experiments, prompt/model performance summary
    - keyword search
    - vector status and similar evidence
    - grounded RAG answer
    - advanced published graph explorer and lineage panel
    - external read-only graph/source/evidence/search/RAG APIs
- 영향받는 역할:
  - PM: confirm the MVP4 contract draft remains aligned with Wave19 freeze, especially endpoint grouping and P1 exclusions.
  - Backend: Wave20 can implement schemas/routers/migrations from this additive contract after Frontend/QA review.
  - Frontend: review fields/states for formula explainers, metric breakdowns, dataset/golden provenance, vector fallback, RAG insufficient evidence, graph safe-too-large, and external API consumer docs.
  - QA: create `INT4-*` checklist using the OpenAPI artifact, deterministic seed needs, metric recomputation assertions, RAG candidate-exclusion checks, and MVP3 regression guard.

## Blocker
- Product blocker 없음.
- Environment blocker 없음 for docs.
- Contract caveats:
  - `openapi-mvp4-draft.json` is a planning artifact, not a FastAPI runtime export.
  - Frontend/QA have not yet reviewed field/state needs; Wave20 implementation should wait until their Wave19 artifacts align.

## 남은 TODO
- Wave19 Frontend:
  - Review field/state/IA needs against `MVP4_API_CONTRACT_DRAFT.md` and `openapi-mvp4-draft.json`.
  - Confirm whether graph explorer and RAG DTOs are sufficient for UX states.
- Wave19 QA:
  - Parse OpenAPI draft and write `INT4-*` checklist.
  - Define deterministic seed assertions for metric recomputation, search/RAG grounding, vector fallback, safe-too-large graph, external API, and MVP3 regression.
- Wave20 Backend after alignment:
  - Add MVP4 enums and Pydantic schemas.
  - Add evaluation/search/rag/graph explorer/external API routers.
  - Add Alembic migration for evaluation dataset/version/golden item/prompt experiment/evaluation run/index metadata tables.
  - Add deterministic MVP4 seed data.
  - Export actual FastAPI OpenAPI and compare with `docs/api/openapi-mvp4-draft.json`.

## 다른 역할에 전달할 내용
- PM:
  - Backend draft follows PM freeze: no P0 weighted composite quality score, no P0 collaboration/SLA, dev-auth-only external API, and vector production hardening P1.
- Backend:
  - Preserve MVP3 endpoints. Add MVP4 routes beside existing surfaces.
  - Do not let RAG request bodies accept candidate refs as fact scope.
  - Treat graph explorer as published graph read surface with explicit version context.
- Frontend:
  - Use `state=INSUFFICIENT_EVIDENCE`, vector `status`, and graph `state=SAFE_TOO_LARGE` as first-class product states.
  - Expect metric formula metadata and drilldown hints on every P0 quality metric.
  - External read APIs are dev-auth-only and read-only in MVP4.
- QA:
  - Add assertions that RAG uses no candidate graph facts and that graph explorer/external graph APIs expose published graph version context.
  - Add OpenAPI parse check plus MVP3 regression guard to `INT4-*`.

## 총괄에게 요청하는 결정
- Accept Wave19 Backend contract draft as PASS if Frontend and QA find no blocking DTO gaps.
- Keep collaboration/SLA as P1 and weighted composite quality score as P1 unless PM deliberately reopens scope.

## 현재 판정
- PASS
