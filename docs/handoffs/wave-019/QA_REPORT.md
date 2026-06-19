# QA / Integration Report - Wave 19

## 담당 범위
- backlog ID: `INT4-001`~`INT4-009`
- 작업 경로:
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `docs/handoffs/wave-019/QA_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-019/NEXT_ORDERS.md`
  - `docs/handoffs/wave-019/PM_REPORT.md`
  - `docs/handoffs/wave-019/BACKEND_REPORT.md`
  - `docs/handoffs/wave-019/FRONTEND_REPORT.md`
  - `docs/pm/MVP4_PREP_BRIEF.md`
  - `docs/backlog/MVP4_DRAFT_BACKLOG.md`
  - `docs/adr/0007-mvp4-search-rag-read-only-boundary.md`
  - `docs/api/MVP4_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp4-draft.json`
  - `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- PM freeze, Backend contract draft, and Frontend UX/API review alignment을
  검토했다.
- `docs/backlog/INT4_MVP4_ACCEPTANCE.md`를 신규 작성했다.
- `INT4-001`~`INT4-009`에 대해 `PASS`, `PARTIAL`, `FAIL`, `NOT RUNNABLE`
  판정 기준을 정의했다.
- deterministic MVP4 seed requirements를 정의했다:
  - advanced quality metric recomputation
  - evaluation dataset/golden set
  - prompt/model evaluation outcomes
  - grouped search results
  - RAG answered and insufficient-evidence cases
  - graph explorer `READY` and `SAFE_TOO_LARGE` cases
  - vector adapter/fallback
  - external read-only API smoke
  - MVP3 regression guard
- metric recomputation assertions를 formula metadata, numerator,
  denominator, scope, time window, breakdown dimension, drilldown target과
  연결했다.
- RAG grounding assertions를 citations, linked published facts,
  insufficient-evidence state, candidate graph exclusion과 연결했다.
- graph explorer assertions를 published-only separation, current/selected
  published graph version context, `max_hops`, budget, and `SAFE_TOO_LARGE`
  behavior와 연결했다.
- vector adapter/fallback, external dev-auth read-only API, Frontend state
  assertions를 `docs/pm/MVP4_FRONTEND_UX_REQUIREMENTS.md` 기준으로
  체크리스트에 반영했다.
- Wave20 entry recommendation을 `PASS TO ENTER THIN IMPLEMENTATION`으로
  기록했다.
- 앱 runtime/backend/frontend 코드는 수정하지 않았다.
- `docs/backlog/MVP4_DRAFT_BACKLOG.md`는 PM/Backend/Frontend와 이미
  일치하여 수정하지 않았다.

## 변경 파일
- `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
- `docs/handoffs/wave-019/QA_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp4-draft.json >/tmp/openapi-mvp4-draft.qa.pretty.json`
  - `python3 - <<'PY' ...` OpenAPI path/schema count and critical schema sanity check
  - `git diff --check -- docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `git diff --check -- docs/backlog/INT4_MVP4_ACCEPTANCE.md docs/handoffs/wave-019/QA_REPORT.md`
  - `git diff --no-index --check /dev/null docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `git diff --no-index --check /dev/null docs/handoffs/wave-019/QA_REPORT.md`
- 결과:
  - OpenAPI JSON parse PASS.
  - OpenAPI sanity PASS: OpenAPI `3.1.0`, version `0.4.0-draft`, `26` paths,
    `78` schemas.
  - Critical path check PASS: missing paths `none`.
  - Critical schema check PASS: missing schemas `none`.
  - Frozen enum check PASS:
    - `EvaluationDatasetStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`
    - `GoldenSetItemKind`: `ENTITY`, `RELATION`, `PROPERTY_VALUE`,
      `EVIDENCE_LINK`
    - `PromptExperimentStatus`: `DRAFT`, `RUNNING`, `COMPLETED`, `CANCELLED`
    - `RagAnswerState`: `ANSWERED`, `INSUFFICIENT_EVIDENCE`, `ERROR`
    - `GraphExploreState`: `READY`, `SAFE_TOO_LARGE`, `EMPTY`, `ERROR`
    - `VectorAdapterStatus`: `AVAILABLE`, `FALLBACK_KEYWORD`,
      `UNAVAILABLE`, `NOT_CONFIGURED`
    - `ExternalApiAuthMode`: `DEV_AUTH`
  - `git diff --check` PASS for changed QA checklist/report files.
  - `git diff --no-index --check` returned expected diff exit code `1` for
    new/untracked files, with no whitespace error output.
- 실행하지 못한 검증:
  - Runtime API smoke, backend tests, frontend build, browser smoke, and
    `npm run smoke:mvp3:actual` were not run because Wave19 QA scope is
    contract-first documentation and no MVP4 runtime implementation exists yet.

## API/Enum/DTO 변경
- 변경 여부: runtime 변경 없음. QA acceptance 문서에서 contract assertions만
  추가했다.
- 상세:
  - PM/Backend-frozen MVP4 enums and DTO expectations are now executable QA
    criteria in `INT4_MVP4_ACCEPTANCE.md`.
  - No app schema, migration, router, frontend type, or runtime DTO file was
    changed by QA.
  - QA noted one implementation-time assertion nuance: vector
    `fallback_used` is expected on `SimilarEvidenceResponse`, while
    `VectorAdapterState` carries status/fallback reason; external API
    read-only behavior must be proven by route methods and mutation-negative
    tests, not only a literal `read_only` envelope flag.
- 영향받는 역할:
  - PM: no scope conflict found. Composite score and collaboration/SLA remain
    P1.
  - Backend: Wave20 should implement deterministic MVP4 seed data and actual
    OpenAPI from the Wave19 contract, preserving candidate graph exclusion and
    read-only external APIs.
  - Frontend: Wave20 should add DTO/client/mock foundation and UI states for
    quality, search/RAG/vector, graph explorer, datasets, prompt performance,
    and external API docs.
  - QA: Wave20 should execute this checklist against runtime seed/API/UI smoke.

## Blocker
- Wave20 entry blocker: 없음.
- Runtime acceptance blocker:
  - MVP4 endpoints, seed data, frontend DTO/client/mock support, and route
    smoke do not exist yet by design.
  - `INT4-*` runtime checks remain `NOT RUNNABLE` until Wave20+ implements the
    thin slices and deterministic seed.

## 남은 TODO
- Backend:
  - Implement MVP4 schemas/routers/migrations or storage adapters from the
    contract draft.
  - Add deterministic MVP4 seed data covering positive and negative cases.
  - Export actual FastAPI OpenAPI and compare against
    `docs/api/openapi-mvp4-draft.json`.
  - Add read-only negative tests for search/RAG/graph/external APIs.
- Frontend:
  - Add MVP4 TypeScript DTOs/client methods/mock fixtures.
  - Implement first thin UI slices with loading, empty, error,
    insufficient-evidence, vector fallback, stale/partial index, and
    safe-too-large states.
  - Preserve MVP3 route behavior and actual smoke gate.
- QA:
  - Execute `INT4-001`~`INT4-008` after runtime implementation exists.
  - Keep `INT4-009` P1 unless PM promotes collaboration/SLA.
  - Run MVP3 regression guard during Wave20 completion.

## 다른 역할에 전달할 내용
- PM:
  - QA verdict is contract `PASS`; no PM decision drift found.
  - Collaboration/SLA remains P1 and should not block MVP4 P0.
- Backend:
  - No blocking DTO gap found in Wave19.
  - Runtime implementation must make metric values recomputable and must prove
    candidate graph exclusion for RAG, graph explorer, external graph reads,
    and citations.
  - External API read-only behavior needs mutation-negative smoke, not only
    documentation.
- Frontend:
  - Treat formula explainers, vector fallback, RAG insufficient evidence,
    graph `SAFE_TOO_LARGE`, selected published version context, and external
    dev-auth docs states as first-class acceptance targets.
  - Do not invent a P0 weighted composite quality score.
- QA:
  - Use `docs/backlog/INT4_MVP4_ACCEPTANCE.md` as the Wave20 executable
    checklist.

## 총괄에게 요청하는 결정
- Accept Wave19 QA checklist as PASS.
- Allow Wave20 MVP4 thin implementation to begin after commander accepts all
  Wave19 role artifacts.
- Keep Wave20 focused on deterministic seed, additive Backend/Frontend thin
  slices, actual OpenAPI alignment, and MVP3 regression guard.

## 현재 판정
- PASS
