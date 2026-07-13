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
from app.modules.graph_viz import service  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parents[3]
MVP6_12_OPENAPI_DRAFT = REPO_ROOT / "docs/api/openapi-mvp6-12-draft.json"

BASE = "/api/v1"

ALL_FALSE_GUARD = {
    "published_graph_mutated": False,
    "candidate_graph_mutated": False,
    "ontology_draft_mutated": False,
    "published_version_created": False,
    "graph_snapshot_created": False,
    "layout_persisted": False,
}

DEMO = "proj-viz-demo"
LARGE = "proj-viz-large"
EMPTY = "proj-viz-empty"


def _json(response: Any, expected_status: int = 200) -> Any:
    assert response.status_code == expected_status, response.text
    return response.json()


def _reset() -> None:
    service.reset_runtime_store()


def _viz(project_id: str, params: dict | None = None, actor_role: str | None = None) -> Any:
    query = dict(params or {})
    if actor_role is not None:
        query["actor_role"] = actor_role
    return client.get(f"{BASE}/projects/{project_id}/graph-viz", params=query)


def _stable(body: dict) -> dict:
    out = dict(body)
    out.pop("generated_at", None)
    return out


# ---------------------------------------------------------------------------
# READY — bounded whole-graph view + exact summary (PM §11.2 numbers).
# ---------------------------------------------------------------------------


def test_ready_summary_exact() -> None:
    _reset()
    body = _json(_viz(DEMO))
    assert body["status"] == "READY"
    assert body["scope"] == "PUBLISHED"
    assert body["truncated"] is False
    assert body["too_large"] is None
    assert body["node_cap"] == 150
    assert body["edge_cap"] == 300

    s = body["summary"]
    assert s["total_node_count"] == 12
    assert s["total_edge_count"] == 9
    assert s["node_counts_by_class"] == [
        {"class_id": "cls-doc", "count": 3},
        {"class_id": "cls-org", "count": 4},
        {"class_id": "cls-person", "count": 5},
    ]
    assert s["edge_counts_by_relation"] == [
        {"relation_id": "rel-authored", "count": 3},
        {"relation_id": "rel-employs", "count": 4},
        {"relation_id": "rel-partner", "count": 2},
    ]
    assert abs(s["density"] - 9 / 132) < 1e-12
    assert round(s["density"], 3) == 0.068
    assert s["component_count"] == 3
    assert s["largest_component_size"] == 8
    assert s["isolated_node_count"] == 1
    assert s["max_degree"] == 3


def test_ready_bounded_view_layout_hints_no_xy_no_hop() -> None:
    _reset()
    body = _json(_viz(DEMO))
    assert len(body["nodes"]) == 12
    assert len(body["edges"]) == 9

    # deterministic ordering: nodes by published_entity_id asc.
    peids = [n["published_entity_id"] for n in body["nodes"]]
    assert peids == sorted(peids)
    # deterministic ordering: edges by (source, target, published_relation_id) asc.
    ekeys = [
        (e["source_node_id"], e["target_node_id"], e["published_relation_id"])
        for e in body["edges"]
    ]
    assert ekeys == sorted(ekeys)

    for n in body["nodes"]:
        assert "degree" in n and "component_id" in n
        assert "hop" not in n
        assert "x" not in n and "y" not in n

    # spot-check the highest-degree org node (n-06) and the isolated node (n-05).
    by_id = {n["id"]: n for n in body["nodes"]}
    assert by_id["n-06"]["degree"] == 3
    assert by_id["n-05"]["degree"] == 0
    # the isolated node sits in its own (singleton) component distinct from the hub.
    assert by_id["n-05"]["component_id"] != by_id["n-06"]["component_id"]


def test_ready_byte_stable_modulo_generated_at() -> None:
    _reset()
    a = _json(_viz(DEMO))
    b = _json(_viz(DEMO))
    assert _stable(a) == _stable(b)
    assert a["generated_at"] != "" and b["generated_at"] != ""


# ---------------------------------------------------------------------------
# G1 filter hints — element view filtered; summary ALWAYS full graph.
# ---------------------------------------------------------------------------


def test_filter_class_ids_bounds_elements_summary_full() -> None:
    _reset()
    body = _json(_viz(DEMO, params={"class_ids": ["cls-org"]}))
    assert body["status"] == "READY"
    # only org nodes remain; edges need both endpoints included -> only org->org partner.
    assert {n["class_id"] for n in body["nodes"]} == {"cls-org"}
    assert len(body["nodes"]) == 4
    assert {e["relation_id"] for e in body["edges"]} == {"rel-partner"}
    assert len(body["edges"]) == 2
    # summary UNCHANGED (full graph).
    assert body["summary"]["total_node_count"] == 12
    assert body["summary"]["total_edge_count"] == 9
    # degree/component hints stay full-graph values.
    by_id = {n["id"]: n for n in body["nodes"]}
    assert by_id["n-06"]["degree"] == 3


def test_filter_relation_ids_bounds_edges_only() -> None:
    _reset()
    body = _json(_viz(DEMO, params={"relation_ids": ["rel-authored"]}))
    assert {e["relation_id"] for e in body["edges"]} == {"rel-authored"}
    assert len(body["edges"]) == 3
    # nodes unfiltered (no class filter) -> all 12 present.
    assert len(body["nodes"]) == 12
    assert body["summary"]["total_edge_count"] == 9


# ---------------------------------------------------------------------------
# TOO_LARGE_SUMMARY_ONLY — summary exact, empty elements, too_large populated.
# ---------------------------------------------------------------------------


def test_too_large_summary_only() -> None:
    _reset()
    body = _json(_viz(LARGE))
    assert body["status"] == "TOO_LARGE_SUMMARY_ONLY"
    assert body["truncated"] is True
    assert body["nodes"] == []
    assert body["edges"] == []
    assert body["summary"]["total_node_count"] == 210
    assert body["summary"]["total_edge_count"] == 480
    tl = body["too_large"]
    assert tl["estimated_nodes"] == 210
    assert tl["estimated_edges"] == 480
    assert tl["node_budget"] == 150
    assert tl["edge_budget"] == 300
    assert tl["suggested_filters"] == []
    assert isinstance(tl["message"], str) and tl["message"]
    # summary is still exact over the full graph (counts sum to totals).
    assert sum(c["count"] for c in body["summary"]["node_counts_by_class"]) == 210
    assert sum(c["count"] for c in body["summary"]["edge_counts_by_relation"]) == 480


def test_too_large_filters_do_not_rescue() -> None:
    _reset()
    body = _json(_viz(LARGE, params={"class_ids": ["cls-org"], "relation_ids": ["rel-partner"]}))
    assert body["status"] == "TOO_LARGE_SUMMARY_ONLY"
    assert body["nodes"] == []
    assert body["edges"] == []


def test_ready_becomes_too_large_when_cap_lowered() -> None:
    _reset()
    body = _json(_viz(DEMO, params={"node_cap": 5}))
    # full graph 12 nodes > node_cap 5 -> too large by full-graph totals.
    assert body["status"] == "TOO_LARGE_SUMMARY_ONLY"
    assert body["nodes"] == []
    assert body["too_large"]["node_budget"] == 5


# ---------------------------------------------------------------------------
# EMPTY — no current published version -> 200 (zeroed summary).
# ---------------------------------------------------------------------------


def test_empty_no_version_200() -> None:
    _reset()
    body = _json(_viz(EMPTY))
    assert body["status"] == "EMPTY"
    assert body["published_graph_version_ref"] is None
    assert body["nodes"] == []
    assert body["edges"] == []
    assert body["too_large"] is None
    assert body["truncated"] is False
    assert body["summary"] == {
        "total_node_count": 0,
        "total_edge_count": 0,
        "node_counts_by_class": [],
        "edge_counts_by_relation": [],
        "density": 0.0,
        "component_count": 0,
        "largest_component_size": 0,
        "isolated_node_count": 0,
        "max_degree": 0,
    }
    assert body["mutation_guard"] == ALL_FALSE_GUARD


# ---------------------------------------------------------------------------
# Authz / transport: 400 / 403 / 404.
# ---------------------------------------------------------------------------


def test_invalid_cap_400() -> None:
    _reset()
    for params in ({"node_cap": 0}, {"node_cap": 151}, {"edge_cap": 0}, {"edge_cap": 301}):
        body = _json(_viz(DEMO, params=params), 400)
        assert body["error"]["code"] == "INVALID_CAP"


def test_unknown_project_404() -> None:
    _reset()
    body = _json(_viz("proj-nope"), 404)
    assert body["error"]["code"] == "PROJECT_NOT_FOUND"


def test_unknown_version_404() -> None:
    _reset()
    body = _json(_viz(DEMO, params={"version_id": "pgv-nope"}), 404)
    assert body["error"]["code"] == "PUBLISHED_GRAPH_VERSION_NOT_FOUND"


def test_non_member_403() -> None:
    _reset()
    body = _json(_viz(DEMO, actor_role="NOT_A_ROLE"), 403)
    assert body["error"]["code"] == "PERMISSION_DENIED"


def test_known_version_id_targets_graph() -> None:
    _reset()
    body = _json(_viz(DEMO, params={"version_id": "pgv-viz-demo-v1"}))
    assert body["status"] == "READY"
    assert body["published_graph_version_ref"]["published_graph_version_id"] == "pgv-viz-demo-v1"


# ---------------------------------------------------------------------------
# All-false 6-flag guard on EVERY 200 response; errors carry no guard.
# ---------------------------------------------------------------------------


def test_guard_all_false_on_every_response() -> None:
    _reset()
    for resp in (_viz(DEMO), _viz(LARGE), _viz(EMPTY)):
        guard = _json(resp)["mutation_guard"]
        assert guard == ALL_FALSE_GUARD
        assert len(guard) == 6
        assert all(v is False for v in guard.values())


def test_error_envelopes_carry_no_guard() -> None:
    _reset()
    for resp in (_viz("proj-nope"), _viz(DEMO, actor_role="NOT_A_ROLE"), _viz(DEMO, params={"node_cap": 0})):
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
        "projects": sorted(service._PROJECTS.keys()),
        "current_versions": dict(service._PROJECTS),
        "versions": sorted(service._VERSIONS.keys()),
        "demo_nodes": [n.id for n in service._VERSIONS["pgv-viz-demo-v1"].nodes],
        "demo_edges": [e.id for e in service._VERSIONS["pgv-viz-demo-v1"].edges],
        "large_node_count": len(service._VERSIONS["pgv-viz-large-v1"].nodes),
        "large_edge_count": len(service._VERSIONS["pgv-viz-large-v1"].edges),
    }


def test_data_level_no_mutation() -> None:
    _reset()
    before = _table_counts()
    fixtures_before = _fixture_snapshot()

    # Exercise every status/branch incl. errors.
    _viz(DEMO)
    _viz(DEMO, params={"class_ids": ["cls-org"], "relation_ids": ["rel-partner"]})
    _viz(DEMO, params={"node_cap": 5})
    _viz(LARGE)
    _viz(EMPTY)
    _viz(DEMO, params={"version_id": "pgv-viz-demo-v1"})
    _viz("proj-nope")  # 404
    _viz(DEMO, params={"version_id": "pgv-nope"})  # 404
    _viz(DEMO, actor_role="NOT_A_ROLE")  # 403
    _viz(DEMO, params={"node_cap": 0})  # 400

    assert _table_counts() == before
    assert _fixture_snapshot() == fixtures_before


# ---------------------------------------------------------------------------
# OpenAPI alignment (actual export vs frozen draft).
# ---------------------------------------------------------------------------


def test_openapi_path_present() -> None:
    actual = app.openapi()
    assert "get" in actual["paths"]["/api/v1/projects/{project_id}/graph-viz"]


def test_openapi_enum_alignment() -> None:
    actual = app.openapi()["components"]["schemas"]
    draft = json.loads(MVP6_12_OPENAPI_DRAFT.read_text(encoding="utf-8"))
    draft_schemas = draft["components"]["schemas"]
    for name in ("GraphVizStatus", "GraphVizScope"):
        assert name in actual, name
        assert set(actual[name]["enum"]) == set(draft_schemas[name]["enum"]), name


def test_openapi_mutation_guard_6_flags() -> None:
    actual = app.openapi()["components"]["schemas"]
    guard = actual["GraphVizMutationGuard"]
    assert set(guard["properties"].keys()) == set(ALL_FALSE_GUARD.keys())
    assert len(guard["properties"]) == 6


def test_openapi_response_schemas_present() -> None:
    actual = app.openapi()["components"]["schemas"]
    for name in (
        "GraphVizResponse",
        "GraphVizSummary",
        "GraphVizNode",
        "GraphVizEdge",
        "GraphVizTooLargeState",
        "GraphVizClassCount",
        "GraphVizRelationCount",
        "GraphVizPublishedVersionRef",
    ):
        assert name in actual, name


def test_openapi_node_has_hints_no_hop_no_xy() -> None:
    actual = app.openapi()["components"]["schemas"]
    props = set(actual["GraphVizNode"]["properties"].keys())
    assert {"degree", "component_id"} <= props
    assert "hop" not in props
    assert "x" not in props and "y" not in props
