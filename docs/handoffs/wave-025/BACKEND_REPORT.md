# Backend / MVP5 JSON Import-Export Runtime Report - Wave 25

## 담당 범위
- backlog ID:
  - `BE5-005`
  - `BE5-008`
  - `BE5-009`
  - `BE5-010`
  - `INT5-005`
  - `INT5-009`
- 작업 경로:
  - `apps/backend/app/modules/mvp5/`
  - `apps/backend/tests/test_mvp5_api.py`
  - `apps/backend/scripts/seed_mvp5.py`
  - `apps/backend/README.md`
  - `docs/api/MVP5_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp5-draft.json`
  - `docs/handoffs/wave-025/BACKEND_REPORT.md`

## 완료한 작업
- Wave25 PM freeze에 맞춰 MVP5 JSON ontology export/import dry-run runtime을
  additive로 구현했다.
- Export actual endpoints를 추가했다.
  - `GET /api/v1/admin/projects/{project_id}/ontology-export`
  - `POST /api/v1/admin/projects/{project_id}/ontology-export`
  - draft 호환용 `POST /api/v1/admin/projects/{project_id}/ontology-exports`
- Export response에 package metadata를 포함했다.
  - `package_id`, `schema_version`, `project_id`, `ontology_version_id`
  - class/property/relation counts
  - `generated_at`
  - compatibility notes
  - checksum/expiry/download metadata
  - inline deterministic JSON package
  - `audit_event_ref`
- Import dry-run actual endpoints를 추가했다.
  - `POST /api/v1/admin/projects/{project_id}/ontology-import/dry-run`
  - draft 호환용 `POST /api/v1/admin/projects/{project_id}/ontology-imports`
- Import dry-run은 `mode = DRY_RUN`만 받는다. apply/overwrite/publish/mutation
  endpoint는 구현하지 않았다.
- Import dry-run response에 parse/compatibility 결과를 포함했다.
  - `compatibility_status`: `COMPATIBLE`, `WARNING`, `BLOCKED`
  - create/update/delete/no-op/conflict/warning/destructive counts
  - conflict rows
  - warning rows
  - destructive impact rows
  - rollback guidance
  - confirmation requirement
  - audit preview/ref
- Test fixtures를 추가했다.
  - clean compatible package
  - conflict package
  - warning/destructive package
  - invalid schema package
  - non-mutation proof
- Seed summary에 export package id, import dry-run fixture cases, and
  `/projects/{project_id}/admin/import-export` route marker를 추가했다.
- OpenAPI draft JSON과 API contract draft에 Wave25 actual endpoints/schemas를
  반영했다.
- Wave24 no-secret invariant를 유지했다.
  - ontology package/export/import/audit metadata에는 credential raw secret
    material을 포함하지 않는다.

## 변경 파일
- `apps/backend/app/modules/mvp5/schemas.py`
- `apps/backend/app/modules/mvp5/service.py`
- `apps/backend/app/modules/mvp5/router.py`
- `apps/backend/tests/test_mvp5_api.py`
- `apps/backend/README.md`
- `docs/api/MVP5_API_CONTRACT_DRAFT.md`
- `docs/api/openapi-mvp5-draft.json`
- `docs/handoffs/wave-025/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp5_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && rm -f /tmp/ontology-wave25-mvp5-seed.db /tmp/ontology-wave25-mvp5-seed.json /tmp/ontology-wave25-mvp5-seed.pretty.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave25-mvp5-seed.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave25-mvp5-seed.db .venv/bin/python scripts/seed_mvp5.py --output /tmp/ontology-wave25-mvp5-seed.json >/tmp/ontology-wave25-mvp5-seed.stdout.json && python3 -m json.tool /tmp/ontology-wave25-mvp5-seed.json >/tmp/ontology-wave25-mvp5-seed.pretty.json`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output /tmp/ontology-wave25-mvp5-openapi.json && python3 -m json.tool /tmp/ontology-wave25-mvp5-openapi.json >/tmp/ontology-wave25-mvp5-openapi.pretty.json`
  - selected MVP5 import/export actual-vs-draft path/schema/enum compare
  - no-secret scan for changed backend/API/seed/report artifacts
  - `git diff --check` for changed backend/API/report files
- 결과:
  - MVP5 focused tests: PASS, `10 passed`.
  - MVP4 regression tests: PASS, `7 passed`.
  - MVP3 regression tests: PASS, `4 passed`.
  - Ruff: PASS, `All checks passed!`.
  - Fresh SQLite Alembic + MVP5 seed + JSON parse: PASS.
  - Actual OpenAPI export + JSON parse: PASS.
  - Selected MVP5 import/export actual-vs-draft compare: PASS.
    - missing actual paths: `[]`
    - missing draft paths: `[]`
    - missing actual schemas: `[]`
    - missing draft schemas: `[]`
    - enum mismatches: `[]`
  - No-secret scan: PASS.
  - `git diff --check`: PASS.
- 실행하지 못한 검증:
  - Docker/PostgreSQL Compose smoke는 기존 환경 예외/P1 follow-up으로 실행하지
    않았다.
  - MVP1/MVP2 regression은 Wave25 Backend order의 필수 명령에 없고 cheap
    available command가 특정되지 않아 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 있음.
- 상세:
  - 새 actual endpoints:
    - `GET /api/v1/admin/projects/{project_id}/ontology-export`
    - `POST /api/v1/admin/projects/{project_id}/ontology-export`
    - `POST /api/v1/admin/projects/{project_id}/ontology-import/dry-run`
  - Draft-compatible endpoints:
    - `POST /api/v1/admin/projects/{project_id}/ontology-exports`
    - `POST /api/v1/admin/projects/{project_id}/ontology-imports`
  - 새/보강 DTO:
    - `OntologyPackagePayload`
    - `OntologyPackageCounts`
    - `OntologyExportResponse`
    - `OntologyExportDownloadMetadata`
    - `OntologyImportDryRunRequest`
    - `OntologyImportDryRunResponse`
    - `ImportDryRunSummary`
    - `ImportConflict`
    - `ImportWarning`
    - `DestructiveImpactRow`
  - 새/보강 enum:
    - `GovernanceJobStatus`
    - `ImportConflictType`
    - `ImportConflictSeverity`
    - `ImportCompatibilityStatus`
- 영향받는 역할:
  - Frontend: actual API 연결은 단수형 project-scoped endpoints를 우선 사용하면
    된다. Import apply UI는 만들지 않는다.
  - QA: `INT5-005`는 dry-run non-mutation proof와 no-secret scan을 중심으로
    검증하면 된다.

## Blocker
- Backend blocker: 없음.
- Scope note:
  - Import apply/overwrite/publish/mutation endpoint는 PM freeze에 따라 구현하지
    않았다.

## 남은 TODO
- Frontend actual route/client/smoke에서 Wave25 import/export DTO를 연결해야 한다.
- QA가 Frontend actual smoke와 broader `INT5-009` regression matrix를 판정해야 한다.
- P1은 기존대로 유지:
  - RDF/Turtle/OWL/SHACL fidelity.
  - production SSO/OIDC.
  - vault/KMS/secret rotation.
  - full custom ABAC.
  - distributed HA/DR.
  - external write APIs.

## 다른 역할에 전달할 내용
- PM:
  - Wave25 PM freeze대로 dry-run only를 지켰다.
- Backend:
  - MVP5 import/export는 migration 없는 deterministic service-backed runtime이다.
  - dry-run은 `_created_credentials`나 project/ontology/published graph state를
    mutate하지 않는다.
- Frontend:
  - Export DTO shape:
    - `package_id`, `schema_version`, `project_id`, `ontology_version_id`,
      `generated_at`, `counts`, `compatibility_notes`, `package`, `download`,
      `audit_event_ref`.
  - Import dry-run request shape:
    - `{ "mode": "DRY_RUN", "package": OntologyPackagePayload }`.
  - Import dry-run response shape:
    - `job_id`, `project_id`, `dry_run`, `status`, `compatibility_status`,
      `package_id`, `schema_version`, `ontology_version_id`, `parsed_at`,
      `summary`, `conflicts`, `warnings`, `destructive_impacts`,
      `rollback_guidance`, `confirmation_required`, `audit_preview`,
      `audit_event_ref`.
  - Use:
    - `GET /api/v1/admin/projects/{project_id}/ontology-export`
    - `POST /api/v1/admin/projects/{project_id}/ontology-import/dry-run`
  - Do not implement import apply, overwrite, publish, or mutation UI.
- QA:
  - Backend evidence covers clean/conflict/warning-destructive/invalid schema and
    non-mutation proof in `tests/test_mvp5_api.py`.
  - No raw credential material is included in package/export/import artifacts.

## 총괄에게 요청하는 결정
- 추가 결정 요청 없음.
- Frontend/QA can proceed to close `INT5-005` actual UI/smoke and broader
  `INT5-009`.

## 현재 판정
- PASS
