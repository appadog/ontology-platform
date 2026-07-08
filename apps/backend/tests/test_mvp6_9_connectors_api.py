import json
import os
from pathlib import Path
from typing import Any

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["LOCAL_STORAGE_PATH"] = "/private/tmp/ontology-platform-backend-test-storage"

from fastapi.testclient import TestClient  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402
from app.modules.candidate import service as candidate_service  # noqa: E402
from app.modules.connectors import service  # noqa: E402
from scripts.seed_mvp3 import seed_mvp3  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parents[3]
MVP6_9_OPENAPI_DRAFT = REPO_ROOT / "docs/api/openapi-mvp6-9-draft.json"

BASE = "/api/v1"
PROJECT_ID = "project-corp-knowledge"

ALL_FALSE_GUARD = {
    "external_system_read": False,
    "external_system_write": False,
    "real_network_call_made": False,
    "credential_persisted": False,
    "connector_instance_persisted": False,
    "source_created": False,
    "candidate_graph_mutated": False,
    "published_graph_mutated": False,
    "extraction_job_started": False,
}

# A concrete secret value that must NEVER appear anywhere in a response/log.
RAW_SECRET = "SUPER-SECRET-RAW-VALUE-9f83aa-DO-NOT-LEAK"

ROUTING_NOTE = (
    "preview only - nothing imported; a real run would route through the "
    "existing extraction -> candidate -> review -> publish gate."
)


def _json(response: Any, expected_status: int = 200) -> Any:
    assert response.status_code == expected_status, response.text
    return response.json()


def _reset() -> None:
    service.reset_runtime_store()
    seed_mvp3(reset=True)


def _catalog(project_id: str = PROJECT_ID) -> Any:
    return client.get(f"{BASE}/projects/{project_id}/connectors")


def _schema(kind: str, project_id: str = PROJECT_ID) -> Any:
    return client.get(f"{BASE}/projects/{project_id}/connectors/{kind}/config-schema")


def _preview(kind: str, body: dict, project_id: str = PROJECT_ID, query: str = "") -> Any:
    return client.post(
        f"{BASE}/projects/{project_id}/connectors/{kind}/import-preview{query}", json=body
    )


def _rest_config(api_key: str = RAW_SECRET) -> dict:
    return {"base_url": "https://example.invalid/api", "resource_path": "/v1/items", "api_key": api_key}


def _file_config() -> dict:
    return {"file_name": "records.csv", "file_format": "CSV", "has_header": True}


def _kb_config(access_token: str = RAW_SECRET) -> dict:
    return {"knowledge_base_id": "kb-001", "collection": "documents", "access_token": access_token}


# ---------------------------------------------------------------------------
# Catalog
# ---------------------------------------------------------------------------


def test_catalog_shape_and_three_kinds() -> None:
    _reset()
    body = _json(_catalog())
    assert body["project_id"] == PROJECT_ID
    assert body["total_count"] == 3
    kinds = [i["connector_kind"] for i in body["items"]]
    assert kinds == ["FILE_SOURCE", "REST_SOURCE", "KNOWLEDGE_BASE_SOURCE"]
    for item in body["items"]:
        assert item["mock"] is True
        assert item["target_layer"] == "CANDIDATE"
        assert item["config_field_count"] == 3
    by_kind = {i["connector_kind"]: i for i in body["items"]}
    assert by_kind["FILE_SOURCE"]["has_secret_fields"] is False
    assert by_kind["REST_SOURCE"]["has_secret_fields"] is True
    assert by_kind["KNOWLEDGE_BASE_SOURCE"]["has_secret_fields"] is True
    assert body["mutation_guard"] == ALL_FALSE_GUARD


def test_catalog_byte_stable() -> None:
    _reset()
    first = _catalog().text
    _reset()
    assert _catalog().text == first


def test_catalog_project_not_found_404() -> None:
    _reset()
    resp = _catalog("project-does-not-exist")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "PROJECT_NOT_FOUND"


# ---------------------------------------------------------------------------
# Config schema (masked secrets)
# ---------------------------------------------------------------------------


def test_config_schema_masks_secret_fields() -> None:
    _reset()
    body = _json(_schema("REST_SOURCE"))
    assert body["connector_kind"] == "REST_SOURCE"
    assert body["raw_secret_present"] is False
    secret_fields = [f for f in body["fields"] if f["secret"]]
    assert len(secret_fields) == 1
    api_key = secret_fields[0]
    assert api_key["name"] == "api_key"
    assert api_key["field_kind"] == "SECRET"
    # Placeholder is a masked non-secret placeholder only.
    assert api_key["placeholder"] == "SECRET_PLACEHOLDER_NOT_A_REAL_SECRET"
    assert body["mutation_guard"] == ALL_FALSE_GUARD


def test_config_schema_no_secret_fields_for_file_source() -> None:
    _reset()
    body = _json(_schema("FILE_SOURCE"))
    assert all(f["secret"] is False for f in body["fields"])
    assert body["raw_secret_present"] is False


def test_config_schema_unknown_kind_404() -> None:
    _reset()
    resp = _schema("NOT_A_KIND")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "CONNECTOR_KIND_NOT_FOUND"


# ---------------------------------------------------------------------------
# Import preview: per-kind fixtures + compatibility mapping
# ---------------------------------------------------------------------------


def test_preview_file_source_compatible() -> None:
    _reset()
    body = _json(_preview("FILE_SOURCE", {"config": _file_config()}))
    assert body["status"] == "READY"
    assert body["compatibility"] == "COMPATIBLE"
    assert body["preview_id"] is None
    assert body["preview_only"] is True
    assert body["target_layer"] == "CANDIDATE"
    assert body["summary"]["source_record_count"] == 6
    assert body["summary"]["unmapped_record_count"] == 0
    assert body["warnings"] == []
    assert body["blocked_reasons"] == []
    assert body["routing_note"] == ROUTING_NOTE
    assert body["raw_secret_present"] is False
    assert body["mutation_guard"] == ALL_FALSE_GUARD
    for item in body["sample_items"]:
        assert item["target_layer"] == "CANDIDATE"
        assert item["preview_ref"].startswith("prev_file_")


def test_preview_rest_source_warning_unmapped() -> None:
    _reset()
    body = _json(_preview("REST_SOURCE", {"config": _rest_config()}))
    assert body["status"] == "READY"
    assert body["compatibility"] == "WARNING"
    assert body["summary"]["source_record_count"] == 5
    assert body["summary"]["unmapped_record_count"] >= 1
    assert len(body["warnings"]) >= 1
    assert body["warnings"][0]["code"] == "UNMAPPED_FIELDS"
    # At least one item is unmapped with a null class ref + WARNING.
    unmapped = [i for i in body["sample_items"] if i["mapped_ontology_class_ref"] is None]
    assert len(unmapped) >= 1
    assert unmapped[0]["compatibility"] == "WARNING"


def test_preview_kb_source_compatible() -> None:
    _reset()
    body = _json(_preview("KNOWLEDGE_BASE_SOURCE", {"config": _kb_config()}))
    assert body["compatibility"] == "COMPATIBLE"
    assert body["summary"]["source_record_count"] == 4
    assert body["summary"]["unmapped_record_count"] == 0


def test_preview_source_locator_opaque_and_non_secret() -> None:
    _reset()
    body = _json(_preview("REST_SOURCE", {"config": _rest_config()}))
    locators = [i["source_locator"] for i in body["sample_items"] if i["source_locator"]]
    assert locators
    for loc in locators:
        assert loc.startswith("fixture:rest/")
        assert RAW_SECRET not in loc


def test_preview_mapped_ontology_class_ref_shape() -> None:
    _reset()
    body = _json(_preview("FILE_SOURCE", {"config": _file_config()}))
    mapped = [i for i in body["sample_items"] if i["mapped_ontology_class_ref"]]
    assert mapped
    ref = mapped[0]["mapped_ontology_class_ref"]
    assert set(ref.keys()) == {"element_kind", "element_id", "label"}
    assert ref["element_kind"] in {"CLASS", "PROPERTY", "RELATION"}


# ---------------------------------------------------------------------------
# Determinism: byte-stable (excl. generated_at/preview_id) + secret-independent
# ---------------------------------------------------------------------------


def _normalize(body: dict) -> dict:
    body = dict(body)
    body.pop("generated_at", None)
    body.pop("preview_id", None)
    return body


def test_preview_byte_stable_excluding_generated_at() -> None:
    _reset()
    first = _json(_preview("REST_SOURCE", {"config": _rest_config()}))
    _reset()
    second = _json(_preview("REST_SOURCE", {"config": _rest_config()}))
    assert _normalize(first) == _normalize(second)


def test_preview_secret_independent() -> None:
    _reset()
    a = _json(_preview("REST_SOURCE", {"config": _rest_config(api_key="secret-A")}))
    b = _json(_preview("REST_SOURCE", {"config": _rest_config(api_key="secret-B-different")}))
    assert _normalize(a) == _normalize(b)


def test_preview_generated_at_present_and_preview_id_null() -> None:
    _reset()
    body = _json(_preview("FILE_SOURCE", {"config": _file_config()}))
    assert body["generated_at"]
    assert body["preview_id"] is None


# ---------------------------------------------------------------------------
# Bounding / truncation (counts always exact; only sample_items capped)
# ---------------------------------------------------------------------------


def test_preview_truncation_caps_sample_only() -> None:
    _reset()
    full = _json(_preview("FILE_SOURCE", {"config": _file_config()}))
    total = full["total_item_count"]
    assert total > 1
    capped = _json(_preview("FILE_SOURCE", {"config": _file_config(), "item_cap": 1}))
    assert len(capped["sample_items"]) == 1
    assert capped["item_cap"] == 1
    assert capped["truncated"] is True
    assert capped["total_item_count"] == total  # exact regardless of cap


def test_preview_item_cap_out_of_range_400() -> None:
    _reset()
    resp = _preview("FILE_SOURCE", {"config": _file_config(), "item_cap": 999})
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "INVALID_CONNECTOR_CONFIG"


# ---------------------------------------------------------------------------
# BLOCKED: invalid config -> non-crash 200 with notices + zero fabricated items
# ---------------------------------------------------------------------------


def test_preview_missing_required_field_blocked_200() -> None:
    _reset()
    body = _json(_preview("FILE_SOURCE", {"config": {"file_format": "CSV"}}))
    assert body["status"] == "BLOCKED"
    assert body["compatibility"] == "INCOMPATIBLE"
    assert body["sample_items"] == []
    assert body["total_item_count"] == 0
    assert len(body["blocked_reasons"]) >= 1
    assert body["blocked_reasons"][0]["code"] == "MISSING_REQUIRED_FIELD"
    assert body["mutation_guard"] == ALL_FALSE_GUARD


def test_preview_invalid_config_value_blocked_200() -> None:
    _reset()
    body = _json(_preview("REST_SOURCE", {"config": {"base_url": "ftp://bad", "resource_path": "/v1/items"}}))
    assert body["status"] == "BLOCKED"
    assert body["compatibility"] == "INCOMPATIBLE"
    codes = {r["code"] for r in body["blocked_reasons"]}
    assert "INVALID_CONFIG_VALUE" in codes
    assert body["sample_items"] == []


def test_preview_malformed_body_400() -> None:
    _reset()
    # config missing entirely -> malformed request body.
    resp = _preview("FILE_SOURCE", {"item_cap": 10})
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "INVALID_CONNECTOR_CONFIG"


def test_preview_unknown_kind_404() -> None:
    _reset()
    resp = _preview("NOT_A_KIND", {"config": {}})
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "CONNECTOR_KIND_NOT_FOUND"


def test_preview_project_not_found_404() -> None:
    _reset()
    resp = _preview("FILE_SOURCE", {"config": _file_config()}, project_id="nope")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "PROJECT_NOT_FOUND"


# ---------------------------------------------------------------------------
# Authz
# ---------------------------------------------------------------------------


def test_authz_any_member_allowed() -> None:
    _reset()
    for role in ("VIEWER", "PROJECT_ADMIN", "REVIEWER"):
        assert _catalog().status_code == 200
        resp = client.get(
            f"{BASE}/projects/{PROJECT_ID}/connectors?actor_role={role}"
        )
        assert resp.status_code == 200


def test_authz_unknown_role_403() -> None:
    _reset()
    resp = client.get(f"{BASE}/projects/{PROJECT_ID}/connectors?actor_role=NOT_A_ROLE")
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "PERMISSION_DENIED"


# ---------------------------------------------------------------------------
# All-false 9-flag guard on every response
# ---------------------------------------------------------------------------


def test_guard_all_false_on_every_response() -> None:
    _reset()
    guards = [
        _json(_catalog())["mutation_guard"],
        _json(_schema("REST_SOURCE"))["mutation_guard"],
        _json(_preview("REST_SOURCE", {"config": _rest_config()}))["mutation_guard"],
        _json(_preview("FILE_SOURCE", {"config": {}}))["mutation_guard"],  # BLOCKED path
    ]
    for guard in guards:
        assert guard == ALL_FALSE_GUARD
        assert len(guard) == 9
        assert all(v is False for v in guard.values())


# ---------------------------------------------------------------------------
# No raw secret anywhere in any response
# ---------------------------------------------------------------------------


def test_no_raw_secret_in_any_response() -> None:
    _reset()
    responses = [
        _schema("REST_SOURCE"),
        _schema("KNOWLEDGE_BASE_SOURCE"),
        _preview("REST_SOURCE", {"config": _rest_config()}),
        _preview("KNOWLEDGE_BASE_SOURCE", {"config": _kb_config()}),
    ]
    for resp in responses:
        assert RAW_SECRET not in resp.text


# ---------------------------------------------------------------------------
# DATA-LEVEL no-mutation: NO source/candidate/extraction created; no table
# mutation before==after any connector call (including import-preview).
# ---------------------------------------------------------------------------


def _table_counts() -> dict:
    from sqlalchemy import inspect, text

    from app.db.session import SessionLocal

    counts: dict[str, int] = {}
    with SessionLocal() as db:
        inspector = inspect(db.get_bind())
        for table in inspector.get_table_names():
            counts[table] = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar_one()
    return counts


def test_data_level_no_mutation_including_preview() -> None:
    _reset()
    before = _table_counts()
    candidate_before = {
        pid: len(items) for pid, items in candidate_service._candidates_by_project.items()
    } if hasattr(candidate_service, "_candidates_by_project") else None

    _json(_catalog())
    _json(_schema("REST_SOURCE"))
    _json(_preview("FILE_SOURCE", {"config": _file_config()}))
    _json(_preview("REST_SOURCE", {"config": _rest_config()}))
    _json(_preview("KNOWLEDGE_BASE_SOURCE", {"config": _kb_config()}))
    _json(_preview("FILE_SOURCE", {"config": {}}))  # BLOCKED

    after = _table_counts()
    assert after == before

    if candidate_before is not None:
        candidate_after = {
            pid: len(items) for pid, items in candidate_service._candidates_by_project.items()
        }
        assert candidate_after == candidate_before


# ---------------------------------------------------------------------------
# OpenAPI alignment (actual export vs frozen draft)
# ---------------------------------------------------------------------------


def test_openapi_paths_present() -> None:
    actual = app.openapi()
    for path in (
        "/api/v1/projects/{project_id}/connectors",
        "/api/v1/projects/{project_id}/connectors/{connector_kind}/config-schema",
        "/api/v1/projects/{project_id}/connectors/{connector_kind}/import-preview",
    ):
        assert path in actual["paths"], path


def test_openapi_enum_alignment() -> None:
    actual = app.openapi()["components"]["schemas"]
    draft = json.loads(MVP6_9_OPENAPI_DRAFT.read_text(encoding="utf-8"))
    draft_schemas = draft["components"]["schemas"]
    for name in (
        "ConnectorKind",
        "ConnectorConfigFieldKind",
        "ConnectorPreviewStatus",
        "ConnectorPreviewCompatibility",
        "ConnectorPreviewTargetLayer",
    ):
        assert name in actual, name
        assert set(actual[name]["enum"]) == set(draft_schemas[name]["enum"]), name


def test_openapi_mutation_guard_9_flags() -> None:
    actual = app.openapi()["components"]["schemas"]
    guard = actual["ConnectorMutationGuard"]
    assert set(guard["properties"].keys()) == set(ALL_FALSE_GUARD.keys())
    assert len(guard["properties"]) == 9


def test_openapi_notice_and_response_schemas_present() -> None:
    actual = app.openapi()["components"]["schemas"]
    for name in (
        "ConnectorPreviewNotice",
        "ConnectorCatalogListResponse",
        "ConnectorConfigSchemaResponse",
        "ConnectorImportPreviewRequest",
        "ConnectorImportPreviewResponse",
        "ConnectorPreviewSummary",
        "ConnectorPreviewItem",
    ):
        assert name in actual, name
    # ConnectorPreviewNotice element shape {code, message}.
    notice = actual["ConnectorPreviewNotice"]
    assert set(notice["properties"].keys()) == {"code", "message"}
