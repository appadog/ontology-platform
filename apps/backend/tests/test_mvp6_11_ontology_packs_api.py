from __future__ import annotations

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
from app.modules.ontology_packs import service  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parents[3]
MVP6_11_OPENAPI_DRAFT = REPO_ROOT / "docs/api/openapi-mvp6-11-draft.json"

BASE = "/api/v1"

ALL_FALSE_GUARD = {
    "pack_installed": False,
    "ontology_draft_mutated": False,
    "ontology_class_created": False,
    "ontology_property_created": False,
    "ontology_relation_created": False,
    "candidate_graph_mutated": False,
    "published_graph_mutated": False,
    "change_request_created": False,
}

PACK_IDS = ["pack-insurance-core", "pack-manufacturing-equipment", "pack-legal-compliance"]
DEMO = "proj-packs-demo"
NO_DRAFT = "proj-packs-no-draft"


def _json(response: Any, expected_status: int = 200) -> Any:
    assert response.status_code == expected_status, response.text
    return response.json()


def _reset() -> None:
    service.reset_runtime_store()


def _catalog(actor_role: str | None = None) -> Any:
    q = f"?actor_role={actor_role}" if actor_role else ""
    return client.get(f"{BASE}/ontology-packs{q}")


def _detail(pack_id: str, actor_role: str | None = None) -> Any:
    q = f"?actor_role={actor_role}" if actor_role else ""
    return client.get(f"{BASE}/ontology-packs/{pack_id}{q}")


def _preview(project_id: str, pack_id: str, body: Any = None, actor_role: str | None = None) -> Any:
    q = f"?actor_role={actor_role}" if actor_role else ""
    url = f"{BASE}/projects/{project_id}/ontology-packs/{pack_id}/apply-preview{q}"
    return client.post(url, json=body)


def _stable(preview: dict) -> dict:
    # Everything is byte-stable EXCEPT generated_at + preview_id (G7 / G1).
    out = dict(preview)
    out.pop("generated_at", None)
    out.pop("preview_id", None)
    return out


# ---------------------------------------------------------------------------
# Catalog (3 packs, byte-stable) + counts.
# ---------------------------------------------------------------------------


def test_catalog_lists_three_packs_byte_stable() -> None:
    _reset()
    a = _json(_catalog())
    b = _json(_catalog())
    assert a == b  # byte-stable
    assert a["total_count"] == 3
    assert [p["pack_id"] for p in a["items"]] == PACK_IDS
    assert a["mutation_guard"] == ALL_FALSE_GUARD
    for item in a["items"]:
        assert item["mock"] is True


def test_catalog_counts_match_fixture_matrix() -> None:
    _reset()
    by_id = {p["pack_id"]: p for p in _json(_catalog())["items"]}
    assert by_id["pack-insurance-core"]["element_counts"] == {
        "class_count": 4, "property_count": 3, "relation_count": 2, "element_count": 9,
    }
    assert by_id["pack-manufacturing-equipment"]["element_counts"] == {
        "class_count": 4, "property_count": 3, "relation_count": 2, "element_count": 9,
    }
    assert by_id["pack-legal-compliance"]["element_counts"] == {
        "class_count": 4, "property_count": 2, "relation_count": 2, "element_count": 8,
    }


# ---------------------------------------------------------------------------
# Detail (byte-stable; element ordering; unknown -> 404).
# ---------------------------------------------------------------------------


def test_detail_byte_stable_and_shapes() -> None:
    _reset()
    for pid in PACK_IDS:
        a = _json(_detail(pid))
        b = _json(_detail(pid))
        assert a == b
        assert a["pack_id"] == pid
        assert a["mutation_guard"] == ALL_FALSE_GUARD
        assert len(a["elements"]) == a["element_counts"]["element_count"]
        kinds = [e["element_kind"] for e in a["elements"]]
        # classes, then properties, then relations (deterministic order).
        assert kinds == sorted(kinds, key=["CLASS", "PROPERTY", "RELATION"].index)


def test_detail_unknown_pack_404() -> None:
    _reset()
    body = _json(_detail("pack-does-not-exist"), 404)
    assert body["error"]["code"] == "ONTOLOGY_PACK_NOT_FOUND"


# ---------------------------------------------------------------------------
# apply-preview: the FULL fixture matrix (all 3 dispositions + 3 compatibilities).
# ---------------------------------------------------------------------------


def test_preview_insurance_demo_all_new_compatible() -> None:
    _reset()
    body = _json(_preview(DEMO, "pack-insurance-core"))
    assert body["status"] == "READY"
    assert body["compatibility"] == "COMPATIBLE"
    assert body["summary"] == {
        "would_add_count": 9, "would_modify_count": 0, "conflict_count": 0,
        "duplicate_count": 0, "total_element_count": 9,
    }
    assert {i["disposition"] for i in body["items"]} == {"NEW"}
    assert body["warnings"] == []
    assert body["blocked_reasons"] == []
    for item in body["items"]:
        assert item["disposition"] == "NEW"
        assert item["existing_element_label"] is None
        assert item["target_layer"] == "DRAFT"
        # NEW -> mapped ref present but all id fields null.
        ref = item["mapped_ontology_ref"]
        assert ref["ontology_class_id"] is None
        assert ref["ontology_property_id"] is None
        assert ref["ontology_relation_id"] is None
        assert ref["status"] is None


def test_preview_legal_demo_all_new_compatible() -> None:
    _reset()
    body = _json(_preview(DEMO, "pack-legal-compliance"))
    assert body["status"] == "READY"
    assert body["compatibility"] == "COMPATIBLE"
    assert body["summary"] == {
        "would_add_count": 8, "would_modify_count": 0, "conflict_count": 0,
        "duplicate_count": 0, "total_element_count": 8,
    }


def test_preview_manufacturing_demo_warning_mixed_dispositions() -> None:
    _reset()
    body = _json(_preview(DEMO, "pack-manufacturing-equipment"))
    assert body["status"] == "READY"
    assert body["compatibility"] == "WARNING"
    assert body["summary"] == {
        "would_add_count": 6, "would_modify_count": 1, "conflict_count": 1,
        "duplicate_count": 2, "total_element_count": 9,
    }
    by_kind_disp = {
        (i["element_kind"], i["disposition"]) for i in body["items"]
    }
    # mfg.sensor -> CONFLICT; mfg.equipment + serial_no -> DUPLICATE; rest NEW.
    disp_by_key = {i["pack_element_label"]: i["disposition"] for i in body["items"]}
    assert disp_by_key["센서(Sensor)"] == "CONFLICT"
    assert disp_by_key["설비(Equipment)"] == "DUPLICATE"
    assert disp_by_key["일련번호(serialNo)"] == "DUPLICATE"
    assert ("CLASS", "CONFLICT") in by_kind_disp
    assert ("CLASS", "DUPLICATE") in by_kind_disp
    assert ("PROPERTY", "DUPLICATE") in by_kind_disp

    warn_codes = [w["code"] for w in body["warnings"]]
    assert warn_codes == ["NAME_CONFLICT_DIFFERENT_DEFINITION", "EXISTING_DUPLICATE_ELEMENT"]
    assert body["blocked_reasons"] == []

    # CONFLICT/DUPLICATE items carry a non-null mapped ref with the existing id + status.
    conflict = next(i for i in body["items"] if i["disposition"] == "CONFLICT")
    assert conflict["mapped_ontology_ref"]["ontology_class_id"] == "cls_mfg_sensor_existing"
    assert conflict["mapped_ontology_ref"]["status"] == "DRAFT"
    assert conflict["existing_element_label"] == "센서 장치(Sensor Device)"
    dup = next(
        i for i in body["items"]
        if i["disposition"] == "DUPLICATE" and i["element_kind"] == "PROPERTY"
    )
    assert dup["mapped_ontology_ref"]["ontology_property_id"] == "prop_mfg_serial_no_existing"


def test_preview_no_draft_blocked_incompatible_zero_items() -> None:
    _reset()
    for pid in PACK_IDS:
        body = _json(_preview(NO_DRAFT, pid))
        assert body["status"] == "BLOCKED"
        assert body["compatibility"] == "INCOMPATIBLE"
        assert body["items"] == []
        assert body["total_item_count"] == 0
        assert body["summary"] == {
            "would_add_count": 0, "would_modify_count": 0, "conflict_count": 0,
            "duplicate_count": 0, "total_element_count": 0,
        }
        assert [r["code"] for r in body["blocked_reasons"]] == ["NO_DRAFT_ONTOLOGY"]
        assert body["warnings"] == []
        assert body["mutation_guard"] == ALL_FALSE_GUARD


def test_preview_byte_stable_modulo_generated_at_and_preview_id() -> None:
    _reset()
    for project in (DEMO, NO_DRAFT):
        for pid in PACK_IDS:
            a = _json(_preview(project, pid))
            b = _json(_preview(project, pid))
            assert a["preview_id"] is None
            assert b["preview_id"] is None
            assert _stable(a) == _stable(b)


def test_preview_common_invariants() -> None:
    _reset()
    body = _json(_preview(DEMO, "pack-insurance-core"))
    assert body["preview_only"] is True
    assert body["preview_id"] is None
    assert body["target_layer"] == "DRAFT"
    assert body["pack_version"] == "1.0.0"
    assert body["routing_note"] == service.ROUTING_NOTE
    assert body["item_cap"] == 50
    assert body["truncated"] is False


def test_preview_item_cap_honored_counts_exact() -> None:
    _reset()
    body = _json(_preview(DEMO, "pack-insurance-core", body={"item_cap": 3}))
    assert body["item_cap"] == 3
    assert len(body["items"]) == 3
    assert body["truncated"] is True
    assert body["total_item_count"] == 9
    # Counts stay exact even when items[] is capped.
    assert body["summary"]["would_add_count"] == 9
    assert body["summary"]["total_element_count"] == 9


def test_preview_empty_body_defaults_cap_50() -> None:
    _reset()
    for body in (None, {}):
        resp = _json(_preview(DEMO, "pack-insurance-core", body=body))
        assert resp["item_cap"] == 50


# ---------------------------------------------------------------------------
# G9 transport split: 400 / 403 / 404.
# ---------------------------------------------------------------------------


def test_preview_invalid_body_400() -> None:
    _reset()
    for bad in ({"item_cap": 0}, {"item_cap": 51}, {"item_cap": "x"}):
        body = _json(_preview(DEMO, "pack-insurance-core", body=bad), 400)
        assert body["error"]["code"] == "INVALID_REQUEST_BODY"


def test_preview_unknown_pack_404() -> None:
    _reset()
    body = _json(_preview(DEMO, "pack-nope"), 404)
    assert body["error"]["code"] == "ONTOLOGY_PACK_NOT_FOUND"


def test_preview_unknown_project_404() -> None:
    _reset()
    body = _json(_preview("proj-nope", "pack-insurance-core"), 404)
    assert body["error"]["code"] == "PROJECT_NOT_FOUND"


def test_preview_non_member_403() -> None:
    _reset()
    body = _json(_preview(DEMO, "pack-insurance-core", actor_role="NOT_A_ROLE"), 403)
    assert body["error"]["code"] == "PERMISSION_DENIED"


def test_catalog_and_detail_non_member_403() -> None:
    _reset()
    assert _catalog(actor_role="NOT_A_ROLE").status_code == 403
    assert _detail("pack-insurance-core", actor_role="NOT_A_ROLE").status_code == 403


# ---------------------------------------------------------------------------
# All-false 8-flag guard on EVERY response.
# ---------------------------------------------------------------------------


def test_guard_all_false_on_every_response() -> None:
    _reset()
    guards = [
        _json(_catalog())["mutation_guard"],
        _json(_detail("pack-insurance-core"))["mutation_guard"],
        _json(_preview(DEMO, "pack-manufacturing-equipment"))["mutation_guard"],
        _json(_preview(NO_DRAFT, "pack-insurance-core"))["mutation_guard"],
    ]
    for guard in guards:
        assert guard == ALL_FALSE_GUARD
        assert len(guard) == 8
        assert all(v is False for v in guard.values())


def test_error_envelopes_carry_no_guard() -> None:
    _reset()
    for resp in (
        _detail("pack-nope"),
        _preview("proj-nope", "pack-insurance-core"),
        _preview(DEMO, "pack-insurance-core", actor_role="NOT_A_ROLE"),
    ):
        body = resp.json()
        assert "mutation_guard" not in body
        assert "mutation_guard" not in body.get("error", {})


# ---------------------------------------------------------------------------
# DATA-LEVEL no-mutation: all DB tables + fixture tables before == after.
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


def _fixture_snapshot() -> dict:
    return {
        "packs": sorted(service._PACKS.keys()),
        "pack_order": list(service._PACK_ORDER),
        "project_drafts": sorted(service._PROJECT_DRAFTS.keys()),
        "demo_draft_elements": sorted(
            e.element_id for e in service._PROJECT_DRAFTS[DEMO].elements
        ),
    }


def test_data_level_no_mutation() -> None:
    _reset()
    before = _table_counts()
    fixtures_before = _fixture_snapshot()

    # Exercise every endpoint incl. all dispositions/compat/blocked branches.
    _catalog()
    _catalog(actor_role="NOT_A_ROLE")
    for pid in PACK_IDS + ["pack-nope"]:
        _detail(pid)
    for project in (DEMO, NO_DRAFT, "proj-packs-empty-draft", "proj-nope"):
        for pid in PACK_IDS:
            _preview(project, pid)
            _preview(project, pid, body={"item_cap": 1})
    _preview(DEMO, "pack-insurance-core", body={"item_cap": 0})  # 400
    _preview(DEMO, "pack-insurance-core", actor_role="NOT_A_ROLE")  # 403

    assert _table_counts() == before
    assert _fixture_snapshot() == fixtures_before
    # No ontology/change-request tables gained rows.
    for table, count in _table_counts().items():
        assert count == before[table], table


# ---------------------------------------------------------------------------
# OpenAPI alignment (actual export vs frozen draft).
# ---------------------------------------------------------------------------


def test_openapi_paths_present() -> None:
    actual = app.openapi()
    assert "get" in actual["paths"]["/api/v1/ontology-packs"]
    assert "get" in actual["paths"]["/api/v1/ontology-packs/{pack_id}"]
    assert (
        "post"
        in actual["paths"]["/api/v1/projects/{project_id}/ontology-packs/{pack_id}/apply-preview"]
    )


def test_openapi_enum_alignment() -> None:
    actual = app.openapi()["components"]["schemas"]
    draft = json.loads(MVP6_11_OPENAPI_DRAFT.read_text(encoding="utf-8"))
    draft_schemas = draft["components"]["schemas"]
    for name in (
        "PackElementKind",
        "PackApplyPreviewStatus",
        "PackPreviewItemDisposition",
        "PackApplyCompatibility",
        "PackApplyTargetLayer",
        "OntologyElementStatus",
    ):
        assert name in actual, name
        assert set(actual[name]["enum"]) == set(draft_schemas[name]["enum"]), name


def test_openapi_mutation_guard_8_flags() -> None:
    actual = app.openapi()["components"]["schemas"]
    guard = actual["OntologyPackMutationGuard"]
    assert set(guard["properties"].keys()) == set(ALL_FALSE_GUARD.keys())
    assert len(guard["properties"]) == 8


def test_openapi_response_schemas_present() -> None:
    actual = app.openapi()["components"]["schemas"]
    for name in (
        "OntologyPackCatalogListResponse",
        "OntologyPackDetailResponse",
        "PackApplyPreviewResponse",
        "PackApplyPreviewRequest",
        "PackApplyPreviewSummary",
        "PackPreviewItem",
        "PackElementDescriptor",
        "PackPreviewNotice",
    ):
        assert name in actual, name


def test_openapi_ontology_element_ref_present_namespaced() -> None:
    # The pack element ref is explicitly named `PackOntologyElementRef` to avoid a
    # component-name collision with the unrelated MVP6.6 governance `OntologyElementRef`
    # (same accommodation as MVP6.8 `CopilotOntologyElementRef` / MVP6.9
    # `ConnectorOntologyElementRef`). Same field shape; JSON payload unchanged.
    actual = app.openapi()["components"]["schemas"]
    key = "PackOntologyElementRef"
    assert key in actual, sorted(k for k in actual if k.endswith("OntologyElementRef"))
    # governance's own OntologyElementRef stays intact (no collision).
    assert "OntologyElementRef" in actual
    props = set(actual[key]["properties"].keys())
    assert props == {
        "target_kind", "ontology_class_id", "ontology_property_id",
        "ontology_relation_id", "ontology_version_id", "status",
    }
