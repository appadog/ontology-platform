# Backend Report - Wave 48 (MVP6.8 Copilot THIN IMPLEMENTATION — advisory-only, executes nothing, no real LLM)

## 담당 범위
- backlog ID: `BE6-064` (copilot summary + suggestions, deterministic + source-grounded), `BE6-065` (suggestion detail + decision: accept-returns-routing / dismiss, audit-only, 409 conflict), `BE6-066` (all-false 14-flag guard + no-execution/no-LLM guarantees), `BE6-067` (OpenAPI export/alignment + no-mutation regression guard).
- 작업 경로: new additive module `apps/backend/app/modules/copilot/`; router registration in `apps/backend/app/api/router.py`; focused tests `apps/backend/tests/test_mvp6_8_copilot_api.py`; one example fix in `docs/api/openapi-mvp6-8-draft.json`.

## 완료한 작업
- Implemented the 4 frozen endpoints EXACTLY per `openapi-mvp6-8-draft.json`:
  `GET /api/v1/projects/{project_id}/copilot/summary`, `GET /api/v1/projects/{project_id}/copilot/suggestions`, `GET /api/v1/copilot-suggestions/{suggestion_id}`, `POST /api/v1/copilot-suggestions/{suggestion_id}/decisions`.
- New module follows the MVP6.2 learning / MVP6.5-6.7 precedent: deterministic process-local store (`_suggestions_by_project`) + `reset_runtime_store()` hook. No DB migration (P0 process-local store is accepted).
- **G1** deterministic source-grounded generation: one trigger per `CopilotSuggestionKind`, one suggestion per natural key, ordered `(kind ordinal, group key asc)`, capped 20, each citing ≥1 non-empty `CopilotSourceArtifactRef`. Kinds map to their frozen triggers: DRAFT_GOVERNANCE_CHANGE_REQUEST ← recurring correction/validation signal; REVIEW_THESE_CANDIDATES ← PENDING candidates tied to an eval error cluster; INSPECT_QUALITY_OR_VALIDATION_SIGNAL ← low QualityMetric + FAILED validation; RUN_IMPACT_SIMULATION ← APPROVED + QUEUED change request. Same project state → byte-stable list/order (fixed deterministic `generated_at`).
- **G2** ACCEPT returns a `CopilotRoutingTarget` (destination descriptor + optional pre-fill) with `executes_nothing=true` + `human_gate_note` and NO authority. Governance prefill uses the real `ChangeRequestTargetKind` literal **`CLASS`** (+ `ChangeRequestChangeType` `MODIFY`, element refs `element_kind` CLASS). Candidate → `/review?candidate_ids=...`; quality → `/quality?group=TRACEABILITY`; impact → `/governance/change-requests/{id}/impact`. `routing_target` embedded in every suggestion AND returned on ACCEPT.
- **G3** `CopilotSummaryResponse` = exactly the Wave47 field set (verified by an exact key-set test). Derived from the same G1 set; no side-effect create/refresh/persist; no real model.
- Decisions audit-only: DISMISS requires reason (422 `DISMISS_REASON_REQUIRED`; OTHER requires note → 422 `DECISION_NOTE_REQUIRED`; ACCEPT+reason → 422 `DISMISS_REASON_NOT_ALLOWED`); non-SUGGESTED → `409 COPILOT_SUGGESTION_DECISION_CONFLICT`; ACCEPT transitions SUGGESTED→ACCEPTED and returns routing target but creates/mutates nothing. Every response carries the all-false 14-flag `CopilotMutationGuard` (incl. `copilot_executed_action:false`, `real_model_invoked:false`).
- Authz: any project member views (project 404 gate) + records audit-only decisions (`actor_id`/`actor_role` query params, MVP5 Role by reference, no new literal); unknown project → `404 PROJECT_NOT_FOUND`, unknown suggestion → `404 COPILOT_SUGGESTION_NOT_FOUND`.
- Applied the PM contract-example fix `target_kind: "ONTOLOGY_CLASS"` → `"CLASS"` (3 example occurrences) in `docs/api/openapi-mvp6-8-draft.json`. No schema/field/enum shape change.

## 변경 파일
- `apps/backend/app/modules/copilot/__init__.py` (new)
- `apps/backend/app/modules/copilot/schemas.py` (new) — all copilot DTOs/enums, all-false 14-flag `CopilotMutationGuard`.
- `apps/backend/app/modules/copilot/service.py` (new) — deterministic store + G1 generation + G2 routing + decision logic.
- `apps/backend/app/modules/copilot/router.py` (new) — 4 endpoints.
- `apps/backend/app/api/router.py` — registered `copilot_router` after mvp5 (additive).
- `apps/backend/tests/test_mvp6_8_copilot_api.py` (new) — 23 focused tests.
- `docs/api/openapi-mvp6-8-draft.json` — example fix `ONTOLOGY_CLASS`→`CLASS` (3 occurrences).

## 실행/검증
- 실행한 명령 + 결과:
  - `.venv/bin/pytest tests/test_mvp6_8_copilot_api.py -q` → **23 passed**.
  - `.venv/bin/pytest tests/test_mvp6_7_impact_simulation_api.py -q` → **20 passed**.
  - `.venv/bin/ruff check app tests scripts` → **All checks passed!**
  - OpenAPI export/parse/compare (runtime `app.openapi()` vs frozen draft, MVP6.8 paths): all 4 paths present; **0 field/enum mismatches** across the copilot schemas (only `OntologyElementRef` excluded — intentionally copilot-scoped as `CopilotOntologyElementRef` at runtime to avoid a collision with the governance module's unrelated `OntologyElementRef`; field shape `element_kind/element_id/label` is identical to the draft).
  - `git diff --check` → **clean**.
  - Full suite `.venv/bin/pytest -q` → **169 passed** (MVP1–MVP6.7 regression intact).
- DATA-LEVEL no-mutation (incl. ACCEPT): `test_data_level_no_mutation_including_accept` snapshots the governance (`_requests/_items/_reviews/_audit`), governance-application (`_versions/_app_audit`), and learning (`_suggestions_by_project/_patterns_by_project`) stores before, runs summary + list + detail + ACCEPT + DISMISS, and asserts `before == after`. Copilot imports NO write path of any gated flow; it reads no other module's store and writes only its own process-local store.
- 실행하지 못한 검증: none for backend scope.

## API/Enum/DTO 변경
- 변경 여부: 있음 (example 값 1건만; runtime schema/field/enum 형태 변경 없음).
- 상세: `docs/api/openapi-mvp6-8-draft.json` governance-prefill **example** `target_kind` `ONTOLOGY_CLASS`→`CLASS`. Runtime exports the frozen 24-schema contract; the only exported-name deviation is `CopilotOntologyElementRef` (see below) — same field shape as the draft's `OntologyElementRef`.
- 영향받는 역할: Frontend (render `target_kind: "CLASS"` in the governance prefill card; reference the routing-target/prefill shapes below), QA (assert prefill uses `CLASS`).

## Blocker
- 없음. Frontend and QA are unblocked.

## 남은 TODO
- P1 (non-blocking): the runtime component name for the prefill element ref is `CopilotOntologyElementRef` (the draft calls it `OntologyElementRef`) because the governance application module already owns an unrelated `OntologyElementRef`. Field shape is identical; only the `$ref` name differs. If a single canonical `OntologyElementRef` is ever wanted, it must be promoted to a shared module — out of scope for this additive P0.
- P1: promote always-populated optional fields to `required` for strict OpenAPI match (mirrors the MVP6.2 follow-up); durable DB/Alembic persistence stays P1/P2.

## 다른 역할에 전달할 내용
- PM: G1/G2/G3 implemented as frozen; the `ONTOLOGY_CLASS`→`CLASS` example fix is applied.
- Backend: n/a.
- Frontend contract notes (load-bearing):
  - **Suggestion shape** (`CopilotSuggestion`): `id, project_id, kind, state, title, rationale, expected_next_step, routing_target, source_artifacts[≥1], confidence_label, risk_label, created_at, updated_at, decision_audit_note(null until decided), safety_note`. State badges: SUGGESTED/ACCEPTED/DISMISSED/SUPERSEDED.
  - **Decision request** `POST /copilot-suggestions/{id}/decisions` (201): body `{decision: "ACCEPT"|"DISMISS", dismiss_reason_code?, note?, client_request_id?}` + query `actor_id`/`actor_role`. DISMISS requires `dismiss_reason_code`; `OTHER` requires `note` (else 422). ACCEPT must NOT send a reason code (else 422). Non-SUGGESTED → 409.
  - **Decision response** (`CopilotSuggestionDecisionResponse`): `suggestion_id, project_id, previous_state, new_state, decision_audit_note, routing_target (non-null only for ACCEPT), mutation_guard`.
  - **Routing target** (`CopilotRoutingTarget`): `kind, deep_link (relative FE path), target_ref (opaque ids), governance_change_request_draft_prefill (present only for GOVERNANCE_CHANGE_REQUEST_DRAFT), executes_nothing:true, human_gate_note`. Accept = a **navigation CTA** into the existing gate, never an execute button. Governance prefill `target_kind`/`element_kind` = `CLASS`/`PROPERTY`/`RELATION`.
  - **All-false 14-flag guard** on EVERY response (summary/list/detail/decision + nested audit note): render the live proof line from the response, incl. `copilot_executed_action:false` and `real_model_invoked:false`.
- QA: DATA-LEVEL no-mutation test provided (`test_data_level_no_mutation_including_accept`); verify independently that ACCEPT mutates no surface store/governance state and the guard is all-false. Deep-link paths: `/projects/{p}/governance/change-requests/new`, `/projects/{p}/review?candidate_ids=...`, `/projects/{p}/quality?group=...`, `/projects/{p}/governance/change-requests/{id}/impact`.

## 총괄에게 요청하는 결정
- Confirm accepting the runtime exported name `CopilotOntologyElementRef` (vs the draft's `OntologyElementRef`) as a namespacing accommodation for the pre-existing governance `OntologyElementRef` — same field shape, avoids breaking the MVP6.6 OpenAPI-alignment regression test. Recommended: accept (P1 canonicalization only if a shared module is later introduced).

## 현재 판정
- PASS. 4 endpoints match the frozen contract; G1/G2/G3 deterministic + source-grounded; ACCEPT returns a routing target and executes nothing (data-level before==after incl. ACCEPT); all-false 14-flag guard incl. `copilot_executed_action`/`real_model_invoked` false; audit-only decisions + 409/422; authz; OpenAPI 0-mismatch; MVP1–MVP6.7 regression intact (169 passed); ruff clean; git diff --check clean.
