# Frontend / UIUX Report - Wave 20

## 담당 범위
- backlog ID:
  - `FE4-001` Advanced quality dashboard thin UI
  - `FE4-002` Model/prompt performance thin UI
  - `FE4-003` Evaluation dataset/golden set thin UI
  - `FE4-004` Advanced graph explorer states
  - `FE4-005` Integrated search thin UI
  - `FE4-006` RAG answer thin UI
  - `FE4-007` External API docs surface
  - `INT4-001`~`INT4-008` frontend mock/runtime preparation
- 작업 경로:
  - `apps/frontend/src/shared/api/*`
  - `apps/frontend/src/shared/mocks/*`
  - `apps/frontend/src/pages/*`
  - `apps/frontend/src/app/router.tsx`
  - `apps/frontend/package.json`
  - `apps/frontend/scripts/*`
  - `docs/handoffs/wave-020/FRONTEND_REPORT.md`

## 완료한 작업
- 필수 문서를 확인했다:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `02_FRONTEND_AGENT_SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-020/NEXT_ORDERS.md`
  - `docs/handoffs/wave-020/PM_REPORT.md`
  - `docs/handoffs/wave-019/FRONTEND_REPORT.md`
  - `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `docs/api/MVP4_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp4-draft.json`
  - `apps/frontend/README.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- MVP4 TypeScript DTO를 `docs/api/openapi-mvp4-draft.json` 필드명 기준으로 수동 추가했다.
- MVP4 mock fixtures를 추가했다.
  - 품질 metric groups 전체 7종.
  - dataset `DRAFT`/`ACTIVE`/`ARCHIVED`.
  - golden item kind `ENTITY`/`RELATION`/`PROPERTY_VALUE`/`EVIDENCE_LINK`.
  - prompt experiment `RUNNING`/`COMPLETED`, evaluation run `SUCCESS`/`FAILED`.
  - search grouped results, no-result, `PARTIAL`, `STALE`.
  - vector `FALLBACK_KEYWORD`.
  - RAG `ANSWERED`, `INSUFFICIENT_EVIDENCE`.
  - graph `READY`, `SAFE_TOO_LARGE`, `EMPTY`, `ERROR`.
  - external read-only docs examples.
- MVP4 client methods and React Query hooks를 추가했다.
- 기존 MVP3 route anchor를 유지하면서 project-scoped MVP4 routes를 추가했다.
  - `/projects/:projectId/quality`
  - `/projects/:projectId/search`
  - `/projects/:projectId/rag`
  - `/projects/:projectId/published-graph`
  - `/projects/:projectId/evaluation-datasets`
  - `/projects/:projectId/evaluation-datasets/:datasetId`
  - `/projects/:projectId/evaluation-dataset-versions/:datasetVersionId`
  - `/projects/:projectId/prompt-performance`
  - `/projects/:projectId/external-api`
- global LNB는 수정하지 않았다. MVP4 진입점은 `ProjectDetailPage` contextual links로 추가했다.
- thin UI slices를 구현했다.
  - Advanced quality dashboard: metric groups, formula explainer, version context, partial metric state, no P0 weighted rollup.
  - Integrated search: grouped results, no-query/no-result, stale/partial index warning, vector fallback, similar evidence.
  - RAG answer workspace: citations, linked published facts, insufficient evidence, candidate-exclusion copy.
  - Published graph explorer: `READY`, `SAFE_TOO_LARGE`, `EMPTY`, `ERROR`, max-hop control, lineage panel.
  - Evaluation datasets/golden sets: status/editability, active version, item kind table, provenance missing warning.
  - Prompt/model performance: comparison table, running/completed/failed run context, telemetry unavailable copy.
  - External API docs: read-only endpoint catalog, `DEV_AUTH`, examples, no production auth/API-key scope.
- MVP4 mock contract test를 추가했다.
- `smoke:mvp4:mock` route smoke script를 추가했다.

## 변경 파일
- `apps/frontend/package.json`
- `apps/frontend/scripts/mvp4-mock-route-smoke.mjs`
- `apps/frontend/src/app/router.tsx`
- `apps/frontend/src/pages/ProjectDetailPage.tsx`
- `apps/frontend/src/pages/QualityDashboardPage.tsx`
- `apps/frontend/src/pages/PublishedGraphExplorerPage.tsx`
- `apps/frontend/src/pages/IntegratedSearchPage.tsx`
- `apps/frontend/src/pages/RagAnswerWorkspacePage.tsx`
- `apps/frontend/src/pages/EvaluationDatasetsPage.tsx`
- `apps/frontend/src/pages/PromptPerformancePage.tsx`
- `apps/frontend/src/pages/ExternalApiDocsPage.tsx`
- `apps/frontend/src/pages/mvp4Shared.tsx`
- `apps/frontend/src/shared/api/types.ts`
- `apps/frontend/src/shared/api/client.ts`
- `apps/frontend/src/shared/api/queries.ts`
- `apps/frontend/src/shared/api/mvp4Mock.test.ts`
- `apps/frontend/src/shared/mocks/mvp4Fixtures.ts`
- `docs/handoffs/wave-020/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `npm run test -- src/shared/api/mvp4Mock.test.ts`
    - RED: 처음에는 `../mocks/mvp4Fixtures` missing으로 실패 확인.
    - GREEN: 구현 후 PASS.
  - `npm run test`
  - `npm run build`
  - `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP4_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave20-mvp4-mock-smoke npm run smoke:mvp4:mock`
  - `curl -fsS http://127.0.0.1:8000/api/v1/projects >/tmp/ontology-wave20-backend-check.json`
  - `git diff --check -- apps/frontend/src/shared/api apps/frontend/src/shared/mocks apps/frontend/src/pages apps/frontend/src/app/router.tsx apps/frontend/package.json apps/frontend/scripts docs/handoffs/wave-020/FRONTEND_REPORT.md`
  - `git diff --no-index --check /dev/null <new MVP4 frontend/report file>` for new untracked MVP4 files
- 결과:
  - `npm run test`: PASS, 4 files / 10 tests.
  - `npm run build`: PASS, TypeScript checks and Vite production build completed.
  - `smoke:mvp4:mock`: PASS.
    - artifact: `/tmp/ontology-wave20-mvp4-mock-smoke/mvp4-mock-route-smoke.json`
    - screenshots:
      - `/tmp/ontology-wave20-mvp4-mock-smoke/quality-dashboard.png`
      - `/tmp/ontology-wave20-mvp4-mock-smoke/integrated-search.png`
      - `/tmp/ontology-wave20-mvp4-mock-smoke/rag-workspace.png`
      - `/tmp/ontology-wave20-mvp4-mock-smoke/published-graph-explorer.png`
      - `/tmp/ontology-wave20-mvp4-mock-smoke/evaluation-datasets.png`
      - `/tmp/ontology-wave20-mvp4-mock-smoke/prompt-performance.png`
      - `/tmp/ontology-wave20-mvp4-mock-smoke/external-api.png`
  - `curl` backend availability check: FAIL with connection refused on `127.0.0.1:8000`; used only to decide actual MVP3 smoke feasibility.
  - `git diff --check`: PASS, no whitespace error output.
  - `git diff --no-index --check` on new MVP4 frontend/report files: PASS, no whitespace error output.
- 실행하지 못한 검증:
  - `npm run smoke:mvp3:actual`은 실행하지 않았다. Backend actual API was not listening on `127.0.0.1:8000`, and Backend is a parallel Wave20 track. Running MVP3 actual smoke without seeded backend runtime would be a guaranteed environment failure rather than a frontend regression signal.

## API/Enum/DTO 변경
- 변경 여부: 있음, Frontend DTO/client/mock only.
- 상세:
  - Added frontend DTOs for:
    - `PublishedGraphVersionRef`, `SourceRef`, `ReviewDecisionRef`
    - `QualityMetricsResponse`, `QualityMetricGroupResult`, `QualityMetric`, `QualityFormulaMetadata`, `QualityMetricDetail`
    - `EvaluationDataset`, `EvaluationDatasetVersion`, `GoldenSetItem`
    - `PromptPerformanceSummary`, `PromptPerformanceRow`, `PromptExperiment`, `EvaluationRun`
    - `SearchResponse`, `SearchResultGroup`, `SearchResultItem`
    - `VectorAdapterState`, `SimilarEvidenceRequest`, `SimilarEvidenceResponse`
    - `RagAnswerRequest`, `RagAnswerResponse`, `RagCitation`, `InsufficientEvidenceState`
    - `GraphExploreResponse`, `GraphExploreNode`, `GraphExploreEdge`, `GraphTooLargeState`, `PublishedLineagePanel`
    - `ExternalApiDocsSurface`, `ExternalApiEndpointDoc`
  - Added frontend enum unions:
    - `QualityMetricGroup`: `COMPLETENESS`, `CONSISTENCY`, `TRACEABILITY`, `VALIDATION`, `REVIEW`, `DUPLICATE`, `RELATION_DENSITY`
    - `QualityMetricUnit`: `COUNT`, `RATE`, `RATIO`, `PERCENT`
    - `EvaluationDatasetStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`
    - `GoldenSetItemKind`: `ENTITY`, `RELATION`, `PROPERTY_VALUE`, `EVIDENCE_LINK`
    - `PromptExperimentStatus`: `DRAFT`, `RUNNING`, `COMPLETED`, `CANCELLED`
    - `SearchResultKind`: `PUBLISHED_ENTITY`, `PUBLISHED_RELATION`, `SOURCE`, `SOURCE_CHUNK`, `EVIDENCE`, `LINEAGE`
    - `SearchIndexState`: `READY`, `PARTIAL`, `STALE`
    - `VectorAdapterStatus`: `AVAILABLE`, `FALLBACK_KEYWORD`, `UNAVAILABLE`, `NOT_CONFIGURED`
    - `VectorFallbackReason`: `VECTOR_DB_NOT_CONFIGURED`, `INDEX_NOT_READY`, `ADAPTER_ERROR`, `KEYWORD_FALLBACK_USED`
    - `RagAnswerState`: `ANSWERED`, `INSUFFICIENT_EVIDENCE`, `ERROR`
    - `GraphExploreState`: `READY`, `SAFE_TOO_LARGE`, `EMPTY`, `ERROR`
    - `ExternalApiAuthMode`: `DEV_AUTH`
  - Added client methods:
    - `getQualityMetrics`, `getQualityMetricDetail`
    - `listEvaluationDatasets`, `getEvaluationDataset`, `listEvaluationDatasetVersions`, `getEvaluationDatasetVersion`, `listGoldenItems`
    - `getPromptPerformanceSummary`, `listPromptExperiments`, `listEvaluationRuns`
    - `searchProject`, `getVectorStatus`, `findSimilarEvidence`, `createRagAnswer`
    - `explorePublishedGraph`, `getExternalApiDocs`
- 영향받는 역할:
  - Backend: actual endpoint field names should remain aligned to `docs/api/openapi-mvp4-draft.json`; Frontend is actual-client-ready but actual runtime was not available during this run.
  - QA: can use `npm run smoke:mvp4:mock` for mock UI route evidence and wait for Backend seed/runtime before actual MVP4 and MVP3 regression smoke.

## Blocker
- Backend actual API was not running on `127.0.0.1:8000`, so actual MVP3 regression smoke and actual MVP4 route smoke were not feasible in this frontend-only turn.
- Actual MVP4 API smoke still depends on Backend Wave20 deterministic seed and runtime endpoints.

## 남은 TODO
- Add `smoke:mvp4:actual` after Backend provides deterministic MVP4 seed/runtime and the actual response shapes are available.
- Add deeper interaction smoke for clicking graph `SAFE_TOO_LARGE` and RAG insufficient evidence controls if QA asks for browser-level state transitions.
- Consider structured graph suggested filters if Backend promotes that non-blocking refinement.
- Consider denominator/sample counts in prompt performance rows once Backend exposes them.

## 다른 역할에 전달할 내용
- PM:
  - No weighted composite quality score was added. UI uses metric groups and a "NO WEIGHTED ROLLUP" marker only.
  - Collaboration/SLA remains absent from MVP4 P0 UI.
- Backend:
  - Frontend client paths match Wave19 draft paths.
  - RAG UI assumes candidate-only facts return `INSUFFICIENT_EVIDENCE` or no unsupported grounded answer.
  - External API docs surface is static-client-backed in mock mode; actual mode currently probes current external graph metadata and uses static catalog metadata.
- Frontend:
  - Global LNB was not changed.
  - New pages are project-scoped and reachable from Project Detail contextual links.
- QA:
  - Mock smoke command:
    - start frontend mock dev server
    - run `MVP4_FRONTEND_BASE_URL=http://127.0.0.1:5173 npm run smoke:mvp4:mock`
  - Actual smoke should wait for Backend Wave20 report/seed.

## 총괄에게 요청하는 결정
- Accept Wave20 Frontend as PASS for mock-first MVP4 thin UI implementation.
- Keep actual MVP4 and MVP3 actual regression smoke as QA/Backend-runtime dependent follow-up for Wave20 QA or Wave21 hardening.

## 현재 판정
- PASS
