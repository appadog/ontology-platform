# QA Report - Wave 8

## 담당 범위
- backlog ID: `INT2-002`, `INT2-003`, `INT2-004`, support `FE-005`, `FE-014`
- 작업 경로: `docs/handoffs/wave-008/QA_REPORT.md`, `docs/api/openapi-mvp2-draft.json`, `apps/backend`, `apps/frontend`

## 완료한 작업
- Wave 8 PM/Backend/Frontend 보고서를 먼저 읽고 QA 검증을 수행했다.
- MVP 1 regression gate를 재확인했다.
  - `/health`, `/api/v1/me`
  - project create/list/detail
  - ontology draft/class/property/relation create/update/delete
  - graph refetch
  - CSV/Excel upload + READY preview
  - TXT/PDF upload + `NOT_AVAILABLE` preview
- Wave 7 contract sync 유지 여부를 재확인했다.
  - `provider="mock"` actual payload/runtime PASS
  - `SourceParseResponse` OpenAPI/FE type/client PASS
  - `PromptVersion` OpenAPI/FE type/client/mock PASS
  - `CandidateEvidence` nullable/numeric locator fields PASS
  - `OntologyGraph.classes`/`relations` optional compatibility fields PASS
  - `invalid_evidence_reference` runtime hook PASS
- Backend actual API mode에서 MVP 2 workflow smoke를 수행했다.
  - source profile/parse/segments
  - prompt/template version
  - extraction job create/run
  - candidate entity/relation/evidence read
  - retry-chain dedupe
- Frontend actual API mode smoke를 수행했다.
  - `VITE_USE_MOCK_API=false`
  - project/source/ontology/extraction/candidate/evidence route HTTP smoke
  - Playwright CLI screenshot smoke
- Ontology modeler CRUD/read-only/delete UX를 검증했다.
  - draft create/update/delete API path PASS
  - published version backend read-only PASS
  - frontend non-draft disabled controls and Create Draft Version CTA static check PASS
  - delete confirmation and class-delete graph consistency는 PARTIAL
- LNB/drilldown IA, selected/recent project, candidate detail/evidence highlight를 검증했다.

## 변경 파일
- `docs/handoffs/wave-008/QA_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `sed -n ... AGENTS.md .agents/skills/handoff-reporting/SKILL.md docs/handoffs/CURRENT_STATE.md docs/handoffs/wave-007/NEXT_ORDERS.md`
  - `sed -n ... docs/handoffs/wave-008/PM_REPORT.md docs/handoffs/wave-008/BACKEND_REPORT.md docs/handoffs/wave-008/FRONTEND_REPORT.md`
  - `sed -n ... docs/backlog/MVP2_DRAFT_BACKLOG.md docs/pm/IA_MVP1.md docs/frontend/UI_STYLE_GUIDE_MVP1.md`
  - `python3` OpenAPI relevant path/schema inspection
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && .venv/bin/pytest -q`
  - `cd apps/backend && tmpfile=$(mktemp /private/tmp/openapi-mvp2-wave8-qa.XXXXXX); .venv/bin/python scripts/export_openapi.py --output "$tmpfile" && cmp -s "$tmpfile" ../../docs/api/openapi-mvp2-draft.json`
  - `cd apps/frontend && npm run build`
  - `docker --version`
  - QA actual backend runtime:
    - `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-wave8-qa.sqlite LOCAL_STORAGE_PATH=/private/tmp/ontology-platform-wave8-qa-storage .venv/bin/python ... Base.metadata.create_all(bind=engine)`
    - `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-wave8-qa.sqlite LOCAL_STORAGE_PATH=/private/tmp/ontology-platform-wave8-qa-storage CORS_ORIGINS='["http://127.0.0.1:5198","http://localhost:5198"]' .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8028`
  - `cd apps/backend && .venv/bin/python - <<'PY' ... end-to-end API smoke ...`
  - frontend actual runtime:
    - `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8028 npm run dev -- --host 127.0.0.1 --port 5198 --strictPort`
  - frontend route HTTP smoke for project/source/profile/chunks/extraction/job/candidates/evidence routes
  - `cd apps/frontend && npx playwright screenshot ...`
  - static contract checks with `rg` and `python3`
- 결과:
  - Backend ruff PASS: `All checks passed!`
  - Backend pytest PASS: `7 passed`
  - OpenAPI MVP2 draft freshness PASS: `OPENAPI_MVP2_DRAFT_FRESH`
  - Frontend build PASS
  - Backend actual API smoke PASS except class-delete orphan probe
  - Frontend route HTTP smoke PASS
  - Playwright screenshot smoke PASS
- Browser evidence:
  - `/private/tmp/ontology-wave8-screenshots/projects.png`
  - `/private/tmp/ontology-wave8-screenshots/ontology_modeler.png`
  - `/private/tmp/ontology-wave8-screenshots/source_profile.png`
  - `/private/tmp/ontology-wave8-screenshots/source_chunks.png`
  - `/private/tmp/ontology-wave8-screenshots/job_monitor.png`
  - `/private/tmp/ontology-wave8-screenshots/retry_dedupe.png`
  - `/private/tmp/ontology-wave8-screenshots/candidate_results_full.png`
  - `/private/tmp/ontology-wave8-screenshots/candidate_invalid_evidence_full.png`
  - `/private/tmp/ontology-wave8-screenshots/evidence_row.png`
  - `/private/tmp/ontology-wave8-screenshots/evidence_text.png`
  - `/private/tmp/ontology-wave8-screenshots/evidence_broken.png`
- API smoke evidence:
  - `/private/tmp/wave8-qa-api-smoke.json`
  - project: `05e7bdf1-5895-4c4d-a7d0-f239b5d3f6e2`
  - extraction ontology version: `cfde9925-21ee-402f-8cff-7ff26224b4a6`
  - CSV source: `f339d09f-f78f-4b74-a719-fb20760729ad`
  - TXT source: `54f53a8a-8373-4d82-838a-1d6dbb0ebf9b`
  - success job: `ab60d19b-3d0f-471c-8134-bd97a736a806`
  - retry job: `8d0d35ad-1b9a-4c0c-8cac-e874560a4225`
  - row evidence: `d5f90d01-6c33-41d4-8109-f56109f58323`
  - text evidence: `f56a0bd4-fad4-4273-bfcb-916c5b594e63`
- 실행하지 못한 검증:
  - Docker Compose smoke: `docker --version`가 `command not found`라 미수행. 기존 환경 예외 유지.
  - Playwright Node API dialog automation: CLI screenshot은 가능했으나 local/importable `playwright` package가 없어 dialog click script는 미수행. Delete confirmation은 코드와 화면 버튼 기준으로 검토했다.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - QA는 API/Enum/DTO를 변경하지 않았다.
  - `docs/api/openapi-mvp2-draft.json`은 backend export와 일치한다.
  - FE `types.ts`/`client.ts`/`mvp2Fixtures.ts`는 Wave 7 contract sync를 유지한다.
- 영향받는 역할:
  - Backend: class delete 후 orphan property graph exposure 보완 필요.
  - Frontend: delete confirmation copy, evidence/breadcrumb fallback context 보완 필요.

## Blocker
- Docker CLI 없음.
  - backlog: infra/environment exception, `INT2-004`
  - 상태: accepted environment exception 유지.
- Ontology class delete orphan property.
  - backlog: `BE-004`, `BE-005`, `FE-005`, `FE-014`
  - 재현: class에 property가 남아 있는 상태에서 `DELETE /api/v1/ontology/classes/{class_id}` 후 `GET /api/v1/ontology/versions/{version_id}/graph`를 호출하면 deleted class의 property가 `graph.properties[]`에 남는다.
  - evidence: `/private/tmp/wave8-qa-api-smoke.json`의 `class_delete_orphan_probe=FAIL_ORPHAN_PROPERTY_IN_GRAPH`, orphan property `7210eaca-b543-4392-a888-8b4435a5e687`.
  - 영향: UI selection은 fallback될 수 있지만 actual API graph payload에는 orphan property가 남아 ontology modeler state를 혼란시킬 수 있다.
- Delete confirmation acceptance gap.
  - backlog: `FE-014`, support `FE-005`
  - class confirm은 class name/property count/relation total count는 보여주지만 inbound/outbound relation count를 분리하지 않고, draft-only 적용 사실을 말하지 않는다.
  - property/relation confirm은 대상명만 표시하고 draft-only 적용 사실을 말하지 않는다.
- Evidence/breadcrumb fallback context gap.
  - backlog: `FE2-006`, `INT2-002`
  - evidence viewer happy path는 row/paragraph highlight PASS.
  - broken evidence direct route fallback은 crash하지 않고 evidence id를 보여주지만 source id/source segment id/validation code/parent candidate-job action까지는 제공하지 않는다.
  - evidence viewer breadcrumb는 `Projects / Source / Evidence` 형태이며 project/source/job/candidate 맥락이 충분히 드러나지 않는다.

## 남은 TODO
- Backend:
  - class soft delete 시 연결 property/relation을 함께 `DELETED` 처리하거나, graph endpoint에서 deleted class에 연결된 properties를 제외한다.
  - extraction `_classes_for_version`/`_relations_for_version`도 deleted ontology element를 후보 생성 input에서 제외하는지 후속 hardening 검토가 필요하다.
- Frontend:
  - delete confirm copy에 draft-only 적용 사실을 포함한다.
  - class delete confirm에서 inbound/outbound relation count를 분리 표시한다.
  - evidence viewer breadcrumb/link를 project-scoped source/job/candidate context로 보강한다.
  - broken evidence fallback에 source id/source segment id/validation code와 parent candidate/job 복귀 action을 표시한다.
  - cell-level evidence highlight actual fixture/test hook이 있으면 row-only가 아닌 column_name 포함 케이스도 browser smoke에 추가한다.
- QA:
  - Docker CLI가 제공되면 Compose smoke 재시도.
  - 위 orphan/confirm/breadcrumb 수정 후 targeted regression 재검증.

## 다른 역할에 전달할 내용
- PM:
  - Wave 8 focused expansion은 `PARTIAL`이다. Contract sync wave는 추가로 필요하지 않지만, 더 넓은 MVP2 기능 확장 전 ontology delete UX/API와 evidence breadcrumb/fallback context는 먼저 닫는 것이 좋다.
- Backend:
  - Retry-chain dedupe는 PASS. `invalid_evidence_reference` retry run에서 retry job candidate list가 비고 `skipped_duplicate_candidates=4`가 확인됐다.
  - Class delete orphan property는 actual API에서 재현된다. `graph.properties[]` filtering/cascade 정책을 결정해 달라.
- Frontend:
  - LNB top-level 구조, selected project, primary workflow, candidate detail/evidence highlight는 대부분 PASS.
  - Delete confirmation copy와 evidence breadcrumb/fallback context는 Wave 8 acceptance 대비 보완 필요.
- QA:
  - 다음 검증은 full sync가 아니라 targeted UX/API regression이면 충분하다.

## 총괄에게 요청하는 결정
- Wave 9에서 더 넓은 MVP2 기능을 여는 것은 조건부로만 권장한다.
  - `INT2-003`, `INT2-004`는 PASS라 extraction/retry 기능 확장은 가능하다.
  - 단, ontology modeler delete semantics와 evidence fallback context는 Wave 9 첫 P0/P1 hardening으로 묶어 닫은 뒤 넓은 기능 확장으로 넘어가는 것이 안전하다.

## 현재 판정
- MVP 1 regression gate: PASS
- Wave 7 contract sync 유지: PASS
- `INT2-002` Chunk/evidence traceability: PASS with UI fallback caveat
- `INT2-003` Mock extraction flow: PASS
- `INT2-004` Failure/retry smoke: PASS
- Wave 8 focused expansion: PARTIAL
- Ontology modeler edit/delete UX: PARTIAL
- UI ontology-building workflow clarity: PASS
- LNB/drilldown IA: PARTIAL
- Candidate detail/evidence highlight: PARTIAL
- Wave 9 broader expansion: CONDITIONAL / fix targeted Wave 8 UX/API gaps first
