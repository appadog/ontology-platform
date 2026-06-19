# MVP 2 Closeout Checklist

Status: `WAVE 12 PRODUCTIZATION OVERLAY READY`

This document is the shared closeout reference for PM, Backend, Frontend, and QA. Wave 11 froze the local-demo acceptance criteria, regression matrix, demo script, release-note exclusions, and closeout exceptions needed to decide whether MVP 2 can close. Wave 12 adds a Frontend productization overlay for browser-verifiable UI/UX maturity without reopening MVP 2 runtime scope.

## Closeout Decision Rule

MVP 2 can close when all P0 rows in the acceptance matrix are `PASS`, all P1 rows are `PASS` or explicitly accepted as follow-up, and no role reports a product blocker that requires a new endpoint, enum, DTO, or user workflow outside the current draft contract.

Allowed closeout verdicts:

- `PASS`: all acceptance rows pass with no active exception.
- `PASS WITH EXCEPTION`: product acceptance passes, but approved environment/tooling exceptions remain.
- `PARTIAL`: at least one acceptance row needs targeted hardening before closeout.
- `FAIL`: product contract or demo flow is broken.

## MVP 2 Closeout Checklist

| Area | Required closeout evidence | Owner | Gate |
|---|---|---|---|
| MVP 1 regression | Project, ontology, graph, source upload/preview, and actual API boundary remain passing. | QA | P0 |
| OpenAPI freshness | `docs/api/openapi-mvp2-draft.json` matches Backend export. MVP 1 and MVP 2 OpenAPI artifacts remain separate. | Backend, QA | P0 |
| Source profile | CSV/Excel profile edge cases pass with stable columns, warnings, and no duplicate visible rows. | Backend, Frontend, QA | P0 |
| Source parse/chunk | TXT/PDF parse produces deterministic segments or warning fallback with no duplicate visible rows. | Backend, Frontend, QA | P0 |
| Prompt selection | Prompt template/version creation and explicit `prompt_version_id` selection work. Active version is display/default hint only. | Backend, Frontend, QA | P0 |
| Extraction lifecycle | Job create/run/detail/retry covers `SUCCESS`, `PARTIAL_FAILED`, `FAILED`, retry chain, progress, failure reason, and masked model run metadata. | Backend, Frontend, QA | P0 |
| Fixture catalog | `default`, `partial_invalid`, `invalid_evidence_reference`, and `missing` fixtures are reproducible through actual API and UI. | Backend, Frontend, QA | P0 |
| Retry/dedupe | Retry-chain natural keys prevent duplicate visible candidates/evidence and expose enough dedupe state for QA/user confidence. | Backend, Frontend, QA | P0 |
| Candidate/evidence browsing | Candidate entity/relation lists support validation/evidence/type browsing and normal evidence navigation. | Frontend, QA | P0 |
| Evidence traceability/fallback | Normal, missing, broken, and direct missing evidence paths preserve available source/job/candidate context and recovery actions. | Backend, Frontend, QA | P0 |
| Frontend navigation smoke | Top-level LNB remains stable; ID-bound routes are contextual; actual API browser smoke covers source-to-evidence path. | Frontend, QA | P0 |
| Docker Compose smoke | Run if Docker CLI exists. If not, apply approved environment exception and keep product closeout separate. | QA | P1 exception |
| Browser smoke tooling | Use available Playwright/headless route smoke and retain screenshots/logs. Temporary tooling is accepted if command and artifacts are reported. | Frontend, QA | P1 exception |
| Release notes | Scope exclusions and known exceptions are documented in this file and linked from role reports. | PM | P0 |

## Closeout Acceptance Matrix

| ID | Scenario | Acceptance criteria | Backend evidence | Frontend evidence | QA verdict basis |
|---|---|---|---|---|---|
| CO-01 | Source profile | Empty CSV/sheet returns warning and empty result; header-only sheet returns `EMPTY` columns; mixed/null-heavy sample uses `MIXED`, `nullable`, `null_ratio`, and non-null `sample_values[]`; repeated profile does not duplicate visible rows. | Backend tests or actual HTTP smoke for CSV/Excel profile edge cases. | Profile screen shows columns, warnings, empty/error states, and recovery CTA. | `INT2-001` PASS when API, OpenAPI, and UI fields match. |
| CO-02 | Source parse/chunk | TXT parse has deterministic `sequence`; PDF is local best-effort only and warnings cover no-text/unsupported paths; repeated parse does not duplicate visible segment rows. | Backend tests or actual HTTP smoke for TXT/PDF parse and segments. | Chunk viewer shows segment type, sequence, metadata, warnings, empty/error states. | `INT2-002` PASS when chunks can anchor evidence and warning fallback is stable. |
| CO-03 | Prompt version selection | Prompt templates and versions can be created/listed; active version is displayed or used as a default hint; job creation sends explicit `prompt_version_id`; no active-version mutation API/UI is required. | Prompt API smoke and job payload validation. | Job creation UI allows prompt version selection and does not imply publish/review workflow. | PASS when prompt selection works without new DTO/endpoint. |
| CO-04 | Extraction job lifecycle | Job create/run/detail covers `PENDING`, `QUEUED`, `RUNNING`, terminal statuses, retry source state, failure reason, and masked `ModelRun.raw_request/raw_response`. | Backend lifecycle tests, model run masking check, OpenAPI freshness. | Job monitor shows status, progress, retry link/state, failure reason, fixture, and model run summary. | `INT2-003` and `INT2-004` PASS when actual API and UI agree. |
| CO-05 | Fixture catalog | `default` -> `SUCCESS` with passed candidates/evidence; `partial_invalid` -> `PARTIAL_FAILED` with `MISSING_EVIDENCE`; `invalid_evidence_reference` -> `PARTIAL_FAILED` with `INVALID_EVIDENCE_REFERENCE` and non-null broken refs; `missing` -> `FAILED` with `MOCK_FIXTURE_NOT_FOUND`. | Fixture regression or actual HTTP smoke for all four fixtures. | Fixture selector exposes reproducible choices with result-centered labels and clear failure states. | PASS when all fixtures are reproducible through actual API and UI. |
| CO-06 | Retry/dedupe | Retry creates a new job linked by `retry_of_job_id`; retry-chain natural keys prevent duplicate visible candidate/evidence rows; reused/skipped summary is visible or inspectable. | Retry/dedupe tests and actual retry smoke. | Job monitor/candidate result shows retry context and does not duplicate rows. | `INT2-004` PASS when retry remains deterministic. |
| CO-07 | Candidate/evidence browsing | Candidate entity/relation results can be filtered or browsed by kind, validation status/code, and evidence presence; empty/error states recover to source/job/project context. | Candidate list filters remain in existing endpoints; no candidate detail endpoint required. | Candidate results view provides filters, row actions, evidence links, and stable empty states. | PASS when browsing works without new runtime contract. |
| CO-08 | Evidence traceability/fallback | Normal evidence resolves to source/segment locator; missing evidence shows warning candidate state; broken evidence shows failed validation and available IDs/context; direct missing route does not crash. | `CandidateEvidence` detail and fixture metadata support normal/broken cases. | Evidence viewer preserves breadcrumbs/context and recovery actions. | `INT2-002` PASS when normal, missing, broken, and direct fallback paths are stable. |
| CO-09 | Frontend navigation/browser smoke | Dashboard/project/source/extraction/candidate/evidence routes render in actual API mode; LNB contains only top-level work areas; ID-bound pages are reached through contextual links and breadcrumbs. | Backend actual API server available for smoke. | Build passes and browser smoke screenshots/logs cover source -> extraction -> candidate -> evidence. | `INT2-003` PASS when actual API browser smoke is reproducible or documented fallback is accepted. |

## Wave 12 Productization Overlay

Wave 12 does not change the Wave 11 closeout decision rule. It adds a UX maturity gate for the already passing MVP 2 flow. QA should report this overlay separately as `PASS`, `PARTIAL`, or `FAIL` while also confirming that `CO-01`~`CO-09` behavior remains intact.

| ID | Scenario | Productization acceptance | QA browser evidence |
|---|---|---|---|
| PX-01 | App shell and navigation hierarchy | LNB shows top-level work areas only; ID-bound project/source/job/candidate/evidence detail routes are reached through parent rows, contextual actions, and breadcrumbs. | Desktop screenshot and route smoke showing LNB plus at least one source/job/evidence drilldown path. |
| PX-02 | Project context and breadcrumbs | Project-scoped screens display current project context or a recoverable no/stale project state; evidence viewer preserves available project/source/job/candidate context. | Browser walkthrough from Projects to Evidence, including direct missing evidence fallback. |
| PX-03 | Page primary action and next action | Each core page has a clear primary action and completion/empty/error states provide the next workflow action or recovery action. | Screenshots for project, source profile/parse, job create/monitor, candidates, evidence. |
| PX-04 | Source-to-evidence workflow comprehension | A user can follow project selection -> ontology draft -> source profile/parse -> extraction job -> candidate/evidence without endpoint/debug instructions or long explanatory copy. | Click or manual browser evidence with route list and screenshot artifacts. |
| PX-05 | Candidate/evidence inspection density | Candidate results expose kind, validation status/code, evidence presence, confidence, and context for comparison; evidence viewer shows locator, candidate summary, validation context, and recovery. | Candidate list/detail/evidence screenshots with normal, missing, and broken evidence paths. |
| PX-06 | Responsive layout | Desktop and mobile-ish viewports do not show overlapping LNB, breadcrumbs, filters, tables, buttons, chips, detail panels, or evidence text. | At least one desktop and one mobile-ish screenshot for source/job/candidate/evidence surfaces. |
| PX-07 | Visual style guardrail | Operational SaaS style is calm and information-dense; no landing/marketing hero, endpoint/debug main copy, card-in-card overuse, decorative gradient/orb background, or hero-scale type in compact work surfaces. | Visual inspection notes plus screenshots from browser QA. |
| PX-08 | Regression preservation | Wave 11 `CO-01`~`CO-09` and `INT2-001`~`INT2-004` behavior remain passing. | Existing smoke plus any targeted reruns reported by Frontend/QA. |

Wave 12 productization is `PASS` only when `PX-01`~`PX-08` all pass or have explicitly documented non-product exceptions. It is `PARTIAL` when runtime behavior remains correct but UX polish, responsive layout, copy, or navigation hierarchy has targeted gaps. It is `FAIL` when the source-to-evidence workflow is broken, context is lost without recovery, or the UI requires a new Backend/API contract to proceed.

## MVP 2 Demo Script

### Local Run Prerequisites

- Python 3.12+ backend virtualenv with project dependencies installed.
- Node/npm frontend dependencies installed.
- Local storage path writable by the backend process.
- SQLite local smoke is acceptable for demo/QA unless Docker Compose is available.
- Docker CLI is optional for MVP 2 closeout. If present, QA may additionally run Compose smoke; if absent, use the exception policy below.

### Suggested Local Backend

```text
cd apps/backend
DATABASE_URL=sqlite+pysqlite:////tmp/ontology-mvp2-demo.sqlite \
LOCAL_STORAGE_PATH=/tmp/ontology-mvp2-demo-storage \
CORS_ORIGINS='["http://localhost:5173","http://127.0.0.1:5173"]' \
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

If the database file is new, initialize schema using the repo's current local test/setup helper or the same metadata creation approach used in Wave 10 smoke reports. Backend may provide a more formal helper in its Wave 11 closeout work, but PM does not require a new runtime endpoint.

### Suggested Local Frontend

```text
cd apps/frontend
VITE_USE_MOCK_API=false \
VITE_API_BASE_URL=http://127.0.0.1:8000 \
npm run dev -- --host 127.0.0.1 --port 5173
```

### Sample Data

Use one of the following:

- Existing repo sample/fixture file if Backend or QA identifies a canonical path in Wave 11.
- A generated CSV with columns such as `company_name`, `country`, `founded_year`, `industry`, and blank/null values to exercise profiling.
- A generated TXT file with two to three paragraphs mentioning the same entities and relations for deterministic chunk/evidence checks.

The demo must not depend on external LLM credentials or network calls.

### Demo Steps

1. Create or select a project.
2. Create or select a draft ontology version.
3. Create basic classes, properties, and a relation needed by the sample domain.
4. Upload a structured source and run profile.
5. Confirm column profile, inferred types, null ratio, sample values, and warnings if applicable.
6. Upload or select a text/PDF source and run parse/chunk.
7. Confirm deterministic segment sequence and warning fallback if applicable.
8. Create a prompt template and prompt version, or select existing seed/demo prompt data.
9. Create an extraction job with provider `mock` and fixture `default`; run it.
10. Confirm job monitor reaches `SUCCESS`, shows model run metadata, and exposes candidate/evidence links.
11. Browse candidate entity/relation results and open normal evidence.
12. Repeat job creation with `partial_invalid`, `invalid_evidence_reference`, and `missing`.
13. Confirm partial warning, broken evidence fallback, and missing fixture failure paths.
14. Retry a failed or partial job and confirm retry-chain context with no duplicate visible candidates/evidence.
15. Navigate back through project/source/job/candidate/evidence breadcrumbs or row actions; confirm LNB remains top-level only.

### Expected Outcomes

- Structured source profile is visible and stable across reruns.
- Text/PDF chunks are visible or warning fallback is clear.
- Prompt version selection is explicit.
- Mock extraction generates deterministic candidates and evidence.
- Candidate/evidence browsing supports normal, missing, and broken evidence cases.
- Retry does not duplicate candidate/evidence rows in visible results.
- No data is written to a published graph.
- Review/publish, RAG, external LLM, advanced PDF parsing, and production auth/RBAC are absent by design.

## Release Notes Scope Exclusions

MVP 2 is a local deterministic extraction and evidence traceability milestone. These items are intentionally excluded and must not be treated as closeout blockers:

- External LLM provider integration: MVP 2 uses provider literal `mock` and deterministic MockProvider fixtures only.
- Expert review and publish workflow: candidates remain `review_status=PENDING` and `publish_status=NOT_PUBLISHED`; approve/reject/publish actions start in MVP 3.
- RAG and search over published graph: deferred to later MVPs after review/publish and graph quality foundations exist.
- Advanced PDF parsing: MVP 2 supports local best-effort text extraction/chunking and warning fallback only. OCR, scanned PDF support, complex layout extraction, and renderer dependencies are out of scope.
- Production auth/RBAC: development auth and role extension points are acceptable. Enterprise SSO/RBAC enforcement is out of scope.
- New candidate detail endpoint: Frontend candidate detail/panel may compose from list rows, job detail, and evidence detail. `GET /api/v1/candidates/{candidate_id}` is not part of MVP 2 closeout.
- Active prompt-version mutation workflow: `PromptVersion.is_active` can be displayed, but active-version management UI/API is out of scope.

## Closeout Exception Policy

### Docker CLI Absence

Docker Compose smoke is desirable but not required to close MVP 2 when Docker CLI is unavailable in the execution environment. The exception is accepted if:

- QA records `docker --version` failure or equivalent environment evidence.
- Backend full tests, OpenAPI freshness, actual HTTP smoke, and Frontend actual API smoke pass.
- The exception is reported as environment/tooling, not product behavior.
- Follow-up remains attached to infra/local acceptance, not MVP 2 product acceptance.

If Docker CLI is available, QA should run Compose smoke and report the result.

### Browser Smoke Tooling Temporariness

Temporary Playwright/headless/browser scripts are acceptable for MVP 2 closeout if:

- Frontend reports the command, route coverage, and screenshot/log artifact paths.
- QA independently runs or reviews browser smoke for source -> extraction -> candidate -> evidence.
- Failure to install a permanent browser harness is not used to hide product rendering failures.
- The next hardening wave may formalize browser smoke tooling, but MVP 2 closeout can proceed with documented commands and artifacts.

## Final Gap List

| Gap | Closeout impact | Follow-up owner |
|---|---|---|
| Docker Compose smoke not runnable without Docker CLI | Accepted environment exception if local API/UI regression passes. | Infra/QA |
| Browser smoke harness remains ad hoc | Accepted tooling exception if screenshots/logs/commands are reported. | Frontend/QA |
| PDF repeated-parse warning persistence | Not a closeout blocker when duplicate visible segments are prevented and warning fallback exists. | PM/Backend later hardening |
| External LLM provider | Excluded from MVP 2. | MVP 3+ planning |
| Review/publish workflow | Excluded from MVP 2. | MVP 3 |
| RAG/search over published graph | Excluded from MVP 2. | MVP 4 |
| Advanced PDF/OCR/layout parsing | Excluded from MVP 2. | Later parsing hardening |
| Production auth/RBAC | Excluded from MVP 2. | MVP 5 |
