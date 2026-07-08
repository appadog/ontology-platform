# PM Report - Wave 48 (MVP6.8 Copilot THIN IMPLEMENTATION — G1-G3 freeze + scope guard)

## 담당 범위
- backlog ID: `PM6-030` (Wave48 G1-G3 implementation freeze + scope guard); records impl IDs `BE6-064`~`BE6-067`, `FE6-085`~`FE6-088`, `INT6-071`~`INT6-074`.
- 작업 경로: `docs/pm/MVP6_8_COPILOT_BRIEF.md` (added §"Wave48 Implementation Freeze — G1/G2/G3"), `docs/backlog/MVP6_DRAFT_BACKLOG.md`, this report. No `apps/`.

## 완료한 작업
- Read AGENTS.md, handoff-reporting SKILL, CURRENT_STATE, Wave48 NEXT_ORDERS, and all Wave47 artifacts (brief, ADR 0015, API contract draft, `openapi-mvp6-8-draft.json` (24 schemas, all shapes frozen), INT6.8 acceptance C1-C11/R1-R7/G1-G3, FE UX requirements).
- Grounded every G1/G2 ruling against REAL reads in `apps/backend/app/` (no renames): `LearningSourceArtifactType` + `LearningSignalType`/`CorrectionPattern.support_count` (learning), `CandidateReviewStatus.PENDING` + `CandidateKind` (`ENTITY`/`RELATION`/`PROPERTY_VALUE`), `ValidationResultSeverity` (`INFO`/`WARNING`/`FAILED`) + `ValidationRuleCode`, `QualityMetricGroup` (7 values) + `QualityMetric.value/rate`, `EvaluationErrorCase`/`EvaluationRunStatus`, `OntologyChangeRequestStatus` (`APPROVED`) + `GovernanceApplicationState` (`QUEUED`), `ChangeRequestTargetKind`/`ChangeRequestChangeType`, impact endpoint `GET /ontology-change-requests/{id}/impact-simulation` → `ImpactSimulationReport.impact_report_id`, and the `reset_runtime_store()` process-local store pattern.
- Froze **G1/G2/G3** as one precise, deterministic, implementable rule each in brief §"Wave48 Implementation Freeze" (authority for BE/FE/QA), incl. per-kind triggers, grouping, ordering, `suggestion_cap=20`, and the routing pre-fill shapes.
- **Found + corrected one contract-example bug:** the Wave47 OpenAPI governance-prefill examples use `target_kind: "ONTOLOGY_CLASS"` / `element_kind: "CLASS"`, but the real `ChangeRequestTargetKind` literal is **`CLASS`** (not `ONTOLOGY_CLASS`). Froze the runtime pre-fill to the real literal; Backend aligns the exported example. No schema/field/enum shape change.
- Confirmed scope unchanged: advisory-only, executes nothing, no real LLM (deterministic mock), audit-only, all-false 14-flag guard, 4 endpoints, 4 suggestion kinds, 4 routing kinds.
- Recorded Wave48 implementation IDs in the backlog + updated backlog/brief status headers.

## 변경 파일
- `docs/pm/MVP6_8_COPILOT_BRIEF.md` — added §"Wave48 Implementation Freeze — G1 / G2 / G3 (PM6-030)" (verified real identifiers, G1 per-kind deterministic triggers + grouping/ordering/cap, G2 routing pre-fill per kind incl. `ONTOLOGY_CLASS`→`CLASS` correction, G3 summary DTO fields, scope confirmation, R1-R7 restated); status header → Wave48.
- `docs/backlog/MVP6_DRAFT_BACKLOG.md` — added §"Wave48 MVP6.8 Copilot THIN IMPLEMENTATION — Gate Freeze (PM6-030)" with G1/G2/G3 one-liners + rows PM6-030, BE6-064~067, FE6-085~088, INT6-071~074; status header updated.
- `docs/handoffs/wave-048/PM_REPORT.md` — this report.

## 실행/검증
- 실행한 명령: `git diff --check` → clean. Re-verified `openapi-mvp6-8-draft.json` parses (3.1.0, `0.6.8-draft`, 4 paths / 24 schemas). Grounded enum values via reads under `apps/backend/app/core/enums.py` + module schemas.
- 결과: PASS. No `apps/`/`infra/` change; no runtime code written.
- 실행하지 못한 검증: none required for PM scope (runtime R1-R7 belong to BE/FE/QA this wave).

## API/Enum/DTO 변경
- 변경 여부: 있음 (한 건, example 값만 — schema/field/enum 형태 변경 없음).
- 상세: Wave47 OpenAPI governance-prefill **example** `target_kind: "ONTOLOGY_CLASS"` → **`CLASS`** (and `element_kind` stays `CLASS`) to match the real `ChangeRequestTargetKind`. Backend must export the actual OpenAPI with the corrected example. Everything else (all 24 schemas, 4 endpoints, `CopilotSuggestionKind`/`CopilotSuggestionState`/`CopilotDecisionCommand`/`CopilotRoutingTargetKind`/`CopilotSourceArtifactType`, all-false 14-flag `CopilotMutationGuard`) is exactly the Wave47 frozen contract.
- 영향받는 역할: Backend (align exported example to `CLASS`; implement G1/G2/G3), Frontend (render real `ChangeRequestTargetKind` in the governance prefill destination card), QA (assert prefill uses `CLASS`, not `ONTOLOGY_CLASS`).

## Blocker
- 없음. Backend and Frontend are unblocked.

## 남은 TODO
- Backend: implement 4 endpoints in new `apps/backend/app/modules/copilot/` per §Wave48 freeze + frozen OpenAPI; process-local store + reset hook; align exported example.
- Frontend: `/projects/:p/copilot` Analyze-group surface; accept-routes (navigation CTA) / dismiss / audit note; advisory banner + live all-false guard proof line; mock (+ actual) smoke.
- QA: R1-R7 incl. DATA-level no-mutation proof (before==after incl. ACCEPT) + all-false guard.

## 다른 역할에 전달할 내용 (EXACT frozen G1-G3)
- **G1 (deterministic suggestion-generation source rules):** one trigger per kind, grouped one-SUGGESTED-per-natural-key (never one/row), ordered `(kind ordinal, group key asc)`, capped `suggestion_cap=20`, each cites ≥1 non-empty source ref. `DRAFT_GOVERNANCE_CHANGE_REQUEST` ← recurring correction/validation signal (`CorrectionPattern.support_count ≥ 3` OR ≥3 `REVIEW_CORRECTION` on same element OR `REPEATED_VALIDATION_FAILURE`/≥3 `FAILED` `ValidationResult`), key=element id. `REVIEW_THESE_CANDIDATES` ← `CandidateReviewStatus==PENDING` candidates tied to `EVALUATION_ERROR_CASE`/low `QUALITY_DRILLDOWN`, key=candidate cluster; risk `HIGH` when cluster ≥6. `INSPECT_QUALITY_OR_VALIDATION_SIGNAL` ← low `QualityMetric` (`rate < 0.8`) in a `QualityMetricGroup` OR `ValidationRuleCode` cluster with ≥1 `FAILED` (or ≥3 `WARNING`), key=group/rule code. `RUN_IMPACT_SIMULATION` ← `OntologyChangeRequestStatus==APPROVED` AND `GovernanceApplicationState==QUEUED`, key=`change_request_id`. Empty list = legitimate empty-state.
- **G2 (routing pre-fill payload per `CopilotRoutingTargetKind`):** destination descriptor + optional pre-fill only, `executes_nothing=true` + `human_gate_note`, NO authority. `GOVERNANCE_CHANGE_REQUEST_DRAFT` → `/projects/{p}/governance/change-requests/new`, `target_ref={ontology_version_id}`, `GovernanceChangeRequestDraftPrefill` with real `ChangeRequestTargetKind` (**`CLASS`/`PROPERTY`/`RELATION`**), `ChangeRequestChangeType` (`ADD`/`MODIFY`/`DEPRECATE`), `OntologyElementRef[]` (`element_kind` `CLASS`/`PROPERTY`/`RELATION`), optional title/rationale. `CANDIDATE_REVIEW_LOCATION` → `/projects/{p}/review?candidate_ids=…`, `target_ref={candidate_ids}`, prefill null. `QUALITY_OR_VALIDATION_LOCATION` → `/projects/{p}/quality?group=<QualityMetricGroup>` or `/projects/{p}/validation?rule_code=<ValidationRuleCode>`, prefill null. `IMPACT_REPORT_LOCATION` → `/projects/{p}/governance/change-requests/{id}/impact`, `target_ref={change_request_id, impact_report_id?}`, prefill null. `routing_target` embedded in every suggestion AND returned on ACCEPT.
- **G3 (summary DTO fields):** frozen as Wave47 `CopilotSummaryResponse` (no add/rename): `project_id`, `generated_at`, `source_artifact_scope: CopilotSourceArtifactType[]`, `total_suggestion_count`, `suggested_count`/`accepted_count`/`dismissed_count`/`superseded_count`, `high_risk_count`, `counts_by_kind: CopilotSuggestionKindCount[]`, `advisory_notes: string[]`, all-false `mutation_guard`; derived deterministically from the same G1 suggestion set, no side-effect create/refresh/persist, no real model.
- **Gates BE/FE/QA must hit:** R1 deterministic byte-stable grounded suggestions+summary (empty OK); R2 ACCEPT routes + executes NOTHING (DATA-LEVEL before==after all tables incl. ACCEPT) + all-false 14-flag guard; R3 `SUGGESTED`→`ACCEPTED`/`DISMISSED`, non-`SUGGESTED`→`409`, `DISMISS` reason required (422), audit-only capture; R4 authz (any project member decides audit-only; `403`/`404`; downstream RBAC untouched); R5 FE list→accept-routes(navigation CTA, no execute button)/dismiss→audit note + D6 badges + persistent advisory banner + live all-false guard proof line read from response + all states + mock/actual smoke + responsive 0-overflow; R6 `real_model_invoked==false` + grounding; R7 MVP1-MVP6.7 regression, additive-only, no renames, candidate/published separation intact.

## 총괄에게 요청하는 결정
- Confirm the single contract-example fix `ONTOLOGY_CLASS` → `CLASS` in the governance-prefill OpenAPI example (matches the real `ChangeRequestTargetKind` literal; no schema/field/enum shape change). Recommended: accept — it removes a latent FE/BE drift the moment Backend wires the real governance prefill.

## 현재 판정
- PASS (PM freeze complete; G1-G3 frozen deterministically against real module surfaces; Backend and Frontend unblocked; QA gates R1-R7 stated).
