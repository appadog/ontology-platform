# Backend Report - Wave 46 (MVP6.7 Impact Simulation THIN IMPLEMENTATION)

## 담당 범위
- Backlog: `BE6-056` impact-simulation endpoint + report assembly, `BE6-057` dependency walk (depth 2, both layers) + severity, `BE6-058` bounding/truncation + all-false guard, `BE6-059` OpenAPI export/alignment + no-mutation regression guard.
- Scope: additive, READ-ONLY `GET /api/v1/ontology-change-requests/{change_request_id}/impact-simulation` in the governance module. Mutates nothing; no break of MVP1-MVP6.6.

## 완료한 작업
- Read AGENTS.md, handoff-reporting SKILL, CURRENT_STATE, Wave46 NEXT_ORDERS, PM_REPORT (frozen G1-G3), the frozen API contract + `openapi-mvp6-7-draft.json`, INT6.7 acceptance (R1-R7), and the MVP6.5/6.6 governance module.
- Implemented the read-only endpoint assembling `ImpactSimulationReport` (5 dimensions) by READING a deterministic, self-contained dependency universe keyed to the same MVP6.5/6.6 known element-id seed (same process-local pattern as MVP6.6 `application.py` — the governance module has no real ontology DB read path; per ADR 0013/0014 a deterministic store is acceptable for the P0 thin slice). The maps are read-only module constants; nothing is ever written.
- G1: bounded transitive dependency walk (depth 0 direct target + hop 1 + hop 2, id-ordered, deduped), labeled by `DependencyRelation`; candidate dependents (layer CANDIDATE) + published dependents (layer PUBLISHED) as separate `DependentRefBucket`s.
- G2: per-dimension `ref_cap` default 20 (query override 1..200), exact `count` (never capped), `truncated=true` iff `count>len(refs)`, `any_dimension_truncated` rollup.
- G3: deterministic `ImpactSeverity` (highest rule wins, stop at first match) + `ImpactSeverityReason`; rollup = max severity + per-severity counts (sum == total_change_items) + exact aggregate totals + distinct validation/quality unions.
- All-false `ImpactSimulationMutationGuard` on every response. Read authz = any viewer (VIEWER allowed); `can_apply` is an advisory echo only; never changes status/application_state.
- Reused MVP6.6 `OntologyElementRef` BY REFERENCE (imported from `application.py`) to avoid a duplicate schema-name collision that would fully-qualify both `OntologyElementRef` schemas and break the MVP6.6 OpenAPI alignment test. No renames.
- Aligned the frozen draft `ref_cap.default` 50 -> 20 (PM PM6-028 freeze) in `docs/api/openapi-mvp6-7-draft.json` (both the query param and `ImpactBounding.ref_cap` description). Value only; bounds/shape/enums unchanged.
- Focused tests in `tests/test_mvp6_7_impact_simulation_api.py` (20 tests).

## 변경 파일
- `apps/backend/app/modules/governance/impact.py` (NEW) — DTOs, new enums (`ImpactSeverity`/`ImpactSeverityReason`/`DependencyRelation`), all-false guard, deterministic dependency universe, walk/bucket/severity/rollup, `get_impact_simulation()`.
- `apps/backend/app/modules/governance/router.py` — added the `GET .../impact-simulation` route (tag `MVP6.7 Impact Simulation`, `ref_cap` default 20 ge=1 le=200).
- `apps/backend/app/modules/governance/service.py` — added `class-isolated` to `_KNOWN_CLASS_IDS` (enables a deterministic LOW severity fixture; additive, no behavior change to existing ids).
- `apps/backend/tests/test_mvp6_7_impact_simulation_api.py` (NEW) — 20 focused tests.
- `docs/api/openapi-mvp6-7-draft.json` — `ref_cap` default 50 -> 20 (2 spots).
- `docs/handoffs/wave-046/BACKEND_REPORT.md` (this).

## 실행/검증 결과 (exact commands + results)
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_7_impact_simulation_api.py -q` -> `20 passed in 4.98s`.
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_6_governance_application_api.py -q` -> `21 passed in 4.82s`.
- `cd apps/backend && .venv/bin/pytest -q` (full regression) -> `146 passed in 27.13s`.
- `cd apps/backend && .venv/bin/ruff check app tests scripts` -> `All checks passed!`.
- OpenAPI export + compare (`.venv/bin/python scripts/export_openapi.py --output /private/tmp/openapi-actual.json`):
  - impact-simulation path present in actual AND draft: True.
  - all 13 new MVP6.7 schemas present in actual: True.
  - `ImpactSeverity`/`ImpactSeverityReason`/`DependencyRelation` enum literals match draft: True.
  - `ImpactSimulationMutationGuard` flags match draft (8 all-false flags): True.
  - actual `ref_cap.schema.default == 20`: True.
  - `python3 -m json.tool docs/api/openapi-mvp6-7-draft.json` -> `PARSE_OK` (0.6.7-draft, 1 path).
- `git diff --check` -> clean (`DIFF_CHECK_CLEAN`).

### DATA-LEVEL no-mutation evidence
`test_data_level_no_mutation` snapshots ALL surface state before and after the GET (run twice, incl. ref_cap override):
- governance store: `_requests` (status/application_state/updated_at), `_items`, `_reviews`, `_audit`;
- application store: `_versions` (version status + every element status), `_snapshots`, `_app_audit`.
before == after for every table. `test_read_does_not_change_governance_status` also confirms `status`/`application_state` unchanged via the public detail endpoint. `test_mutation_guard_all_false` asserts all 8 guard flags false.

## API/Enum/DTO 변경 여부
- New READ-ONLY endpoint: `GET /api/v1/ontology-change-requests/{change_request_id}/impact-simulation`.
- New enums (MVP6.7 only): `ImpactSeverity`, `ImpactSeverityReason`, `DependencyRelation`. New DTOs: `ImpactSimulationReport`, `ImpactItem`, `AffectedOntologyElement`, `DependentRefBucket`, `AffectedValidationRef`, `ImpactSummary`, `ImpactSeverityCounts`, `ImpactSimulationCapabilities`, `ImpactBounding`, `ImpactSimulationMutationGuard`.
- Reused by reference (no rename): `OntologyElementRef` (from MVP6.6 `application.py`), `ChangeRequestChangeType`, `ChangeRequestTargetKind`, MVP1 `OntologyElementStatus`/`OntologyVersionStatus`, MVP3 `ValidationRuleCode`/`ValidationResultSeverity`, MVP4 `QualityMetricGroup`, MVP5 `Role`.
- Draft value change: `ref_cap.default` 50 -> 20 (per PM freeze).

## Blocker
- 없음.

## 남은 TODO
- Frontend: 영향도(Impact) panel (5 dimensions + D6 severity badges + "showing first 20" truncation + read-only states). Backend contract is stable and exported.
- QA: R1-R7 incl. independent data-level no-mutation proof + FE mock/actual smoke.
- (P1, out of scope) durable persistence + `impact_report_id` + list/GET-by-id; wiring the walk to real MVP1 ontology tables instead of the deterministic seed universe.

## Frontend contract notes
- Endpoint: `GET /api/v1/ontology-change-requests/{change_request_id}/impact-simulation` with optional query `target_ontology_version_id` (string|null) and `ref_cap` (int, default **20**, 1..200). Dev auth: `actor_id`, `actor_role` query params.
- Report DTO shape (`ImpactSimulationReport`): `change_request_id`, `project_id`, `change_request_status` (advisory echo, MVP6.5 status enum), `analyzed_ontology_version_id`, `analyzed_ontology_version_status`, `items[]`, `summary`, `bounding`, `capabilities`, `mutation_guard`, `computed_at`. `impact_report_id` is null (compute-on-demand).
- Per `ImpactItem`: `affected_ontology_elements[]` (each `{element_ref, relation_to_target (DependencyRelation), depth 0..2, display_name}`), `dependent_candidates`/`dependent_published` (each `{count exact, refs[] capped, truncated}`), `affected_validations[]` (`{rule_code, severity}`), `affected_quality_groups[]`, `severity`, `severity_reason`.
- Severity: `ImpactSeverity` = NONE < LOW < MEDIUM < HIGH < BREAKING. Badges: BREAKING/HIGH = danger tone, MEDIUM = warning, LOW/NONE = neutral. `summary.max_severity` + `summary.severity_counts` (sum == `total_change_items`).
- ref_cap/truncation: `bounding.ref_cap` (=20 default), `bounding.max_dependent_depth` (=2), `bounding.any_dimension_truncated`. Per-bucket `count` is exact; render "showing first {refs.length} of {count}" when `truncated`.
- All-false guard: `mutation_guard` has 8 flags, ALL false on every response — surface no apply/publish affordance from this panel (read-only advisory). `capabilities.can_apply` is only an advisory echo of the separate MVP6.6 apply.

## 총괄에게 요청하는 결정
- Confirm acceptance of the deterministic self-contained dependency universe for the P0 thin slice (consistent with the MVP6.6 `application.py` process-local pattern and ADR 0013/0014). Wiring to real MVP1 ontology tables stays P1.
- Confirm the `ref_cap` default 50 -> 20 draft alignment (already applied per PM freeze).

## Verdict
- PASS. Read-only impact-simulation endpoint implemented additively; 5 dimensions + depth-2 walk + both layers + G3 severity + ref_cap=20 truncation + all-false guard; MVP6.7 (20) and MVP6.6 (21) focused tests, full suite (146) and ruff green; OpenAPI aligned (ref_cap.default=20, enums/schemas match); data-level no-mutation proven; git diff --check clean.
