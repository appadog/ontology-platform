import json
import os
import re
from pathlib import Path
from typing import Any

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["LOCAL_STORAGE_PATH"] = "/private/tmp/ontology-platform-backend-test-storage"

from fastapi.testclient import TestClient  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402
from scripts.seed_mvp5 import seed_mvp5  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)

PROJECT_ID = "project-corp-knowledge"
ORGANIZATION_ID = "org-corp-knowledge"
RAW_SECRET_FIELD = '"raw_secret"'
SECRET_LOOKING_RE = re.compile(r"sk_(?:live|test|svc|api)_[A-Za-z0-9_-]+")
REPO_ROOT = Path(__file__).resolve().parents[3]
DRAFT_OPENAPI_PATH = REPO_ROOT / "docs/api/openapi-mvp5-draft.json"


def _json(response: Any, expected_status: int = 200) -> Any:
    assert response.status_code == expected_status, response.text
    return response.json()


def _serialized(payload: Any) -> str:
    return json.dumps(payload, sort_keys=True, ensure_ascii=False)


def _assert_no_raw_secret_artifact(payload: Any) -> None:
    text = _serialized(payload)
    assert RAW_SECRET_FIELD not in text
    assert SECRET_LOOKING_RE.search(text) is None


def _ontology_package(case: str) -> dict[str, Any]:
    package: dict[str, Any] = {
        "package_id": f"ontology-package-{case}",
        "schema_version": "ontology-package.v1",
        "project_id": PROJECT_ID,
        "ontology_version_id": "ontology-version-mvp5-current",
        "published_graph_version_id": "published-graph-version-mvp5-current",
        "generated_at": "2026-06-19T09:00:00Z",
        "classes": [
            {"stable_id": "class-customer", "name": "Customer", "description": "Customer account holder."},
            {"stable_id": "class-account", "name": "Account", "description": "Financial account."},
            {"stable_id": "class-branch", "name": "Branch", "description": "Retail branch."},
        ],
        "properties": [
            {"stable_id": "property-customer-email", "class_stable_id": "class-customer", "name": "email", "data_type": "STRING"},
            {"stable_id": "property-customer-tier", "class_stable_id": "class-customer", "name": "tier", "data_type": "STRING"},
            {"stable_id": "property-account-status", "class_stable_id": "class-account", "name": "status", "data_type": "STRING"},
            {"stable_id": "property-branch-region", "class_stable_id": "class-branch", "name": "region", "data_type": "STRING"},
        ],
        "relations": [
            {"stable_id": "relation-customer-owns-account", "name": "OWNS_ACCOUNT", "source_class_stable_id": "class-customer", "target_class_stable_id": "class-account"},
            {"stable_id": "relation-account-managed-by-branch", "name": "MANAGED_BY", "source_class_stable_id": "class-account", "target_class_stable_id": "class-branch"},
        ],
    }
    if case == "conflict":
        package["classes"][0] = {
            "stable_id": "class-customer-imported-other",
            "name": "Customer",
            "description": "Conflicting Customer identifier.",
        }
        package["relations"][0] = {
            "stable_id": "relation-customer-owns-account",
            "name": "OWNS_ACCOUNT",
            "source_class_stable_id": "class-customer-imported-other",
            "target_class_stable_id": "class-branch",
        }
    if case == "warning-destructive":
        package["classes"] = package["classes"][:2]
        package["properties"] = package["properties"][:3]
        package["relations"] = [
            {
                "stable_id": "relation-customer-owns-account",
                "name": "OWNS_ACCOUNT",
                "source_class_stable_id": "class-customer",
                "target_class_stable_id": "class-account",
            },
            {
                "stable_id": "relation-customer-reviewed-by-branch",
                "name": "REVIEWED_BY",
                "source_class_stable_id": "class-customer",
                "target_class_stable_id": "class-branch",
            },
        ]
    return package


def test_mvp5_openapi_exposes_thin_runtime_contract() -> None:
    schema = _json(client.get("/api/v1/openapi.json"))
    draft = json.loads(DRAFT_OPENAPI_PATH.read_text())
    paths = schema["paths"]
    draft_paths = draft["paths"]

    for path in [
        "/api/v1/admin/organizations/{organization_id}/summary",
        "/api/v1/admin/projects/{project_id}/summary",
        "/api/v1/admin/projects/{project_id}/ontology-export",
        "/api/v1/admin/projects/{project_id}/ontology-import/dry-run",
        "/api/v1/admin/projects/{project_id}/role-assignments",
        "/api/v1/admin/permission-checks",
        "/api/v1/admin/projects/{project_id}/service-accounts",
        "/api/v1/admin/service-accounts/{credential_id}",
        "/api/v1/admin/service-accounts/{credential_id}/revoke",
        "/api/v1/admin/projects/{project_id}/api-keys",
        "/api/v1/admin/api-keys/{credential_id}",
        "/api/v1/admin/api-keys/{credential_id}/revoke",
        "/api/v1/admin/projects/{project_id}/automatic-approval-policies",
        "/api/v1/admin/automatic-approval-policies/{policy_id}",
        "/api/v1/admin/automatic-approval-policies/{policy_id}/evaluate",
        "/api/v1/admin/automatic-approval-policies/{policy_id}/diff",
        "/api/v1/admin/automatic-approval-policies/{policy_id}/enforce-preview",
        "/api/v1/admin/projects/{project_id}/operations/dashboard",
        "/api/v1/admin/operations/jobs/{job_id}",
        "/api/v1/admin/operations/jobs/{job_id}/retry",
        "/api/v1/admin/projects/{project_id}/operations/dlq",
        "/api/v1/admin/operations/dlq/{dlq_id}/retry",
        "/api/v1/admin/operations/dlq/{dlq_id}/acknowledge",
        "/api/v1/admin/projects/{project_id}/operations/cost-budget",
        "/api/v1/admin/projects/{project_id}/operations/events",
        "/api/v1/admin/projects/{project_id}/operations/observability",
        "/api/v1/admin/projects/{project_id}/retention-policy",
        "/api/v1/admin/projects/{project_id}/retention/deletion-dry-run",
        "/api/v1/admin/projects/{project_id}/backup-snapshots",
        "/api/v1/admin/backup-snapshots/{snapshot_id}/restore-dry-run",
        "/api/v1/admin/projects/{project_id}/audit-events",
        "/api/v1/admin/organizations/{organization_id}/security-events",
    ]:
        assert path in paths
        assert path in draft_paths

    schemas = schema["components"]["schemas"]
    draft_schemas = draft["components"]["schemas"]
    assert schemas["EnterpriseRole"]["enum"] == [
        "ORGANIZATION_ADMIN",
        "PROJECT_ADMIN",
        "ONTOLOGY_EDITOR",
        "SOURCE_MANAGER",
        "REVIEWER",
        "PUBLISHER",
        "ANALYST_VIEWER",
        "EXTERNAL_API_CONSUMER",
        "SERVICE_ACCOUNT",
    ]
    for enum_name in [
        "EnterpriseRole",
        "PermissionDecision",
        "PolicyBlockReason",
        "CredentialStatus",
        "BudgetStatus",
        "BackupStatus",
    ]:
        assert schemas[enum_name]["enum"] == draft_schemas[enum_name]["enum"]
    assert "raw_secret" in schemas["CredentialCreateResponse"]["properties"]
    assert "raw_secret" not in schemas["CredentialView"]["properties"]
    for schema_name in [
        "OntologyExportResponse",
        "OntologyImportDryRunRequest",
        "OntologyImportDryRunResponse",
        "OntologyPackagePayload",
    ]:
        assert schema_name in schemas
        assert schema_name in draft_schemas


def test_mvp5_permission_check_covers_allow_deny_and_read_only_semantics() -> None:
    allow = _json(
        client.post(
            "/api/v1/admin/permission-checks",
            json={
                "principal_id": "user-org-admin",
                "principal_type": "HUMAN_USER",
                "organization_id": ORGANIZATION_ID,
                "project_id": PROJECT_ID,
                "resource_type": "POLICY",
                "action": "ENFORCE_POLICY",
            },
        )
    )
    deny = _json(
        client.post(
            "/api/v1/admin/permission-checks",
            json={
                "principal_id": "user-analyst-viewer",
                "principal_type": "HUMAN_USER",
                "organization_id": ORGANIZATION_ID,
                "project_id": PROJECT_ID,
                "resource_type": "API_CREDENTIAL",
                "action": "REVOKE_CREDENTIAL",
                "sensitivity": "secret",
            },
        )
    )
    read_only = _json(
        client.post(
            "/api/v1/admin/permission-checks",
            json={
                "principal_id": "user-analyst-viewer",
                "principal_type": "HUMAN_USER",
                "organization_id": ORGANIZATION_ID,
                "project_id": PROJECT_ID,
                "resource_type": "PROJECT",
                "action": "READ",
            },
        )
    )

    assert allow["decision"] == "ALLOW"
    assert allow["allowed"] is True
    assert deny["decision"] == "DENY"
    assert deny["allowed"] is False
    assert "SENSITIVITY_RESTRICTED" in deny["deny_reasons"]
    assert read_only["decision"] == "CONDITIONAL"
    assert read_only["allowed"] is True
    assert read_only["read_only"] is True


def test_mvp5_credential_create_masks_after_create_and_keeps_artifacts_clean() -> None:
    create = _json(
        client.post(
            f"/api/v1/admin/projects/{PROJECT_ID}/service-accounts",
            json={
                "name": "Wave24 service account",
                "description": "Created by focused backend test.",
                "scopes": ["EXTERNAL_READ", "QUALITY_READ", "OPERATIONS_READ"],
                "role_bindings": [
                    {
                        "role": "EXTERNAL_API_CONSUMER",
                        "scope_type": "PROJECT",
                        "scope_id": PROJECT_ID,
                    }
                ],
                "expires_at": "2026-12-31T00:00:00Z",
            },
        ),
        expected_status=201,
    )
    assert "raw_secret" in create
    created_id = create["credential"]["id"]
    assert create["credential"]["masked_secret"].startswith("MASKED_SERVICE_ACCOUNT_...")

    for payload in [
        _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/service-accounts")),
        _json(client.get(f"/api/v1/admin/service-accounts/{created_id}")),
        _json(
            client.post(
                f"/api/v1/admin/service-accounts/{created_id}/revoke",
                json={"reason": "Wave24 revoke smoke", "confirmation": "REVOKE"},
            )
        ),
        _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/audit-events")),
        _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/operations/events")),
    ]:
        _assert_no_raw_secret_artifact(payload)


def test_mvp5_api_key_lifecycle_is_masked_for_list_detail_and_revoke() -> None:
    create = _json(
        client.post(
            f"/api/v1/admin/projects/{PROJECT_ID}/api-keys",
            json={
                "name": "Wave24 API key",
                "scopes": ["EXTERNAL_READ", "SEARCH_READ", "RAG_READ"],
                "quota": {"monthly_token_limit": 10000, "monthly_request_limit": 500},
            },
        ),
        expected_status=201,
    )
    assert "raw_secret" in create
    created_id = create["credential"]["id"]

    for payload in [
        _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/api-keys")),
        _json(client.get(f"/api/v1/admin/api-keys/{created_id}")),
        _json(
            client.post(
                f"/api/v1/admin/api-keys/{created_id}/revoke",
                json={"reason": "Wave24 revoke smoke", "confirmation": "REVOKE"},
            )
        ),
    ]:
        _assert_no_raw_secret_artifact(payload)


def test_mvp5_automatic_approval_dry_run_and_enforce_preview_gates() -> None:
    policies = _json(
        client.get(f"/api/v1/admin/projects/{PROJECT_ID}/automatic-approval-policies")
    )
    policy_id = policies["items"][0]["id"]
    detail = _json(client.get(f"/api/v1/admin/automatic-approval-policies/{policy_id}"))
    assert detail["mode"] == "DRY_RUN"

    evaluation = _json(
        client.post(
            f"/api/v1/admin/automatic-approval-policies/{policy_id}/evaluate",
            json={"candidate_ids": [], "include_blocked": True, "dry_run": True},
        )
    )
    blocked_reasons = {
        reason for row in evaluation["rows"] for reason in row["blocked_reasons"]
    }
    assert {
        "MISSING_EVIDENCE",
        "FAILED_VALIDATION",
        "STALE_ONTOLOGY_VERSION",
        "CANDIDATE_STATUS_NOT_ELIGIBLE",
        "POLICY_MODE_DISABLED",
        "AUDIT_PREVIEW_REQUIRED",
    }.issubset(blocked_reasons)

    diff = _json(
        client.post(
            f"/api/v1/admin/automatic-approval-policies/{policy_id}/diff",
            json={"target_mode": "ENFORCE", "reason": "Preview only."},
        )
    )
    enforce_preview = _json(
        client.post(
            f"/api/v1/admin/automatic-approval-policies/{policy_id}/enforce-preview",
            json={"target_mode": "ENFORCE", "reason": "Preview only.", "confirmation": "PREVIEW"},
        )
    )

    assert diff["changed_fields"]
    assert enforce_preview["can_enforce"] is False
    assert enforce_preview["blocked_count"] >= 1
    assert "AUDIT_PREVIEW_REQUIRED" in enforce_preview["blocked_reasons"]


def test_mvp5_ontology_export_returns_safe_package_metadata_counts_and_audit() -> None:
    export = _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/ontology-export"))

    assert export["package_id"] == "ontology-package-project-corp-knowledge-current"
    assert export["schema_version"] == "ontology-package.v1"
    assert export["project_id"] == PROJECT_ID
    assert export["ontology_version_id"] == "ontology-version-mvp5-current"
    assert export["counts"] == {"classes": 3, "properties": 4, "relations": 2}
    assert export["download"]["content_type"] == "application/json"
    assert export["download"]["checksum_sha256"]
    assert export["audit_event_ref"]["category"] == "IMPORT_EXPORT"
    assert "credentials" not in export["package"]
    assert "raw_secret" not in _serialized(export)
    assert SECRET_LOOKING_RE.search(_serialized(export)) is None


def test_mvp5_ontology_import_dry_run_handles_clean_conflict_warning_and_destructive_packages() -> None:
    clean = _json(
        client.post(
            f"/api/v1/admin/projects/{PROJECT_ID}/ontology-import/dry-run",
            json={"mode": "DRY_RUN", "package": _ontology_package("clean-compatible")},
        )
    )
    assert clean["compatibility_status"] == "COMPATIBLE"
    assert clean["summary"] == {
        "create_count": 0,
        "update_count": 0,
        "delete_count": 0,
        "no_op_count": 9,
        "conflict_count": 0,
        "warning_count": 0,
        "destructive_impact_count": 0,
    }
    assert clean["confirmation_required"] is False
    assert clean["conflicts"] == []
    assert clean["warnings"] == []
    assert clean["destructive_impacts"] == []

    conflict = _json(
        client.post(
            f"/api/v1/admin/projects/{PROJECT_ID}/ontology-import/dry-run",
            json={"mode": "DRY_RUN", "package": _ontology_package("conflict")},
        )
    )
    assert conflict["compatibility_status"] == "BLOCKED"
    assert conflict["summary"]["conflict_count"] >= 1
    assert conflict["confirmation_required"] is True
    assert conflict["conflicts"][0]["conflict_type"] == "NAME_COLLISION"
    assert conflict["conflicts"][0]["severity"] == "BLOCKING"

    warning = _json(
        client.post(
            f"/api/v1/admin/projects/{PROJECT_ID}/ontology-import/dry-run",
            json={"mode": "DRY_RUN", "package": _ontology_package("warning-destructive")},
        )
    )
    assert warning["compatibility_status"] == "WARNING"
    assert warning["summary"]["warning_count"] >= 1
    assert warning["summary"]["destructive_impact_count"] >= 1
    assert warning["summary"]["delete_count"] >= 1
    assert warning["warnings"][0]["severity"] == "WARNING"
    assert warning["destructive_impacts"][0]["published_graph_refs_affected"] >= 1
    assert warning["confirmation_required"] is True
    assert warning["rollback_guidance"]

    for payload in [clean, conflict, warning]:
        assert payload["dry_run"] is True
        assert payload["audit_preview"]["category"] == "IMPORT_EXPORT"
        assert payload["audit_event_ref"]["category"] == "IMPORT_EXPORT"
        _assert_no_raw_secret_artifact(payload)


def test_mvp5_ontology_import_dry_run_rejects_invalid_schema_and_does_not_mutate_state() -> None:
    before = {
        "summary": _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/summary")),
        "export": _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/ontology-export")),
        "audits": _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/audit-events")),
    }

    invalid = _json(
        client.post(
            f"/api/v1/admin/projects/{PROJECT_ID}/ontology-import/dry-run",
            json={
                "mode": "DRY_RUN",
                "package": _ontology_package("clean-compatible") | {"schema_version": "legacy.v0"},
            },
        )
    )
    assert invalid["compatibility_status"] == "BLOCKED"
    assert invalid["summary"]["conflict_count"] == 1
    assert invalid["conflicts"][0]["conflict_type"] == "SCHEMA_VERSION_INCOMPATIBLE"

    _json(
        client.post(
            f"/api/v1/admin/projects/{PROJECT_ID}/ontology-import/dry-run",
            json={"mode": "APPLY", "package": _ontology_package("clean-compatible")},
        ),
        expected_status=422,
    )

    after = {
        "summary": _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/summary")),
        "export": _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/ontology-export")),
        "audits": _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/audit-events")),
    }
    assert after == before


def test_mvp5_operations_dlq_cost_observability_and_retention_backup_respond() -> None:
    dashboard = _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/operations/dashboard"))
    job_id = dashboard["jobs"][0]["id"]
    dlq_id = dashboard["dlq_rows"][0]["id"]

    responses = [
        dashboard,
        _json(client.get(f"/api/v1/admin/operations/jobs/{job_id}")),
        _json(client.post(f"/api/v1/admin/operations/jobs/{job_id}/retry")),
        _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/operations/dlq")),
        _json(client.post(f"/api/v1/admin/operations/dlq/{dlq_id}/retry")),
        _json(client.post(f"/api/v1/admin/operations/dlq/{dlq_id}/acknowledge")),
        _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/operations/cost-budget")),
        _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/operations/observability")),
        _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/retention-policy")),
        _json(
            client.post(
                f"/api/v1/admin/projects/{PROJECT_ID}/retention/deletion-dry-run",
                json={
                    "resource_type": "SOURCE",
                    "resource_ids": ["source-mvp5-demo"],
                    "reason": "Wave24 dry-run only.",
                },
            )
        ),
    ]
    snapshots = _json(client.get(f"/api/v1/admin/projects/{PROJECT_ID}/backup-snapshots"))
    snapshot_id = snapshots["items"][0]["id"]
    responses.extend(
        [
            snapshots,
            _json(client.get(f"/api/v1/admin/backup-snapshots/{snapshot_id}")),
            _json(
                client.post(
                    f"/api/v1/admin/backup-snapshots/{snapshot_id}/restore-dry-run",
                    json={"reason": "Wave24 restore dry-run only."},
                )
            ),
        ]
    )

    for payload in responses:
        _assert_no_raw_secret_artifact(payload)


def test_mvp5_seed_output_is_deterministic_and_secret_safe(tmp_path: Path) -> None:
    output_path = tmp_path / "mvp5-seed.json"
    seeded = seed_mvp5(output=output_path, reset=True)
    written = json.loads(output_path.read_text())

    assert seeded == written
    assert seeded["organization_id"] == ORGANIZATION_ID
    assert seeded["project_id"] == PROJECT_ID
    assert seeded["mvp5"]["raw_secret_create_response_available"] is True
    assert RAW_SECRET_FIELD not in _serialized(seeded)
    assert SECRET_LOOKING_RE.search(_serialized(seeded)) is None
