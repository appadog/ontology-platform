import copy
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
from app.modules.governance import application  # noqa: E402
from app.modules.governance import service  # noqa: E402
from scripts.seed_mvp3 import seed_mvp3  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parents[3]
MVP6_7_OPENAPI_DRAFT = REPO_ROOT / "docs/api/openapi-mvp6-7-draft.json"

BASE = "/api/v1"
PROJECT_ID = "project-corp-knowledge"
DRAFT_VERSION_ID = "ontology-v7"

PROPOSER = "user-analyst-3"
VIEWER_ROLE = "VIEWER"

IMPACT_PATH_TEMPLATE = (
    "/api/v1/ontology-change-requests/{change_request_id}/impact-simulation"
)

ALL_FALSE_IMPACT_GUARD = {
    "ontology_draft_mutated": False,
    "published_graph_mutated": False,
    "candidate_graph_mutated": False,
    "prompt_version_mutated": False,
    "governance_state_mutated": False,
    "publish_job_started": False,
    "extraction_job_started": False,
    "evaluation_run_started": False,
}


def _json(response: Any, expected_status: int = 200) -> Any:
    assert response.status_code == expected_status, response.text
    return response.json()


def _reset() -> None:
    service.reset_runtime_store()
    seed_mvp3(reset=True)


def _propose(items: list[dict], actor_id: str = PROPOSER) -> str:
    body = {
        "title": "영향도 테스트",
        "summary": "impact",
        "ontology_version_id": DRAFT_VERSION_ID,
        "items": items,
    }
    resp = client.post(
        f"{BASE}/projects/{PROJECT_ID}/ontology-change-requests"
        f"?actor_id={actor_id}&actor_role={VIEWER_ROLE}",
        json=body,
    )
    return _json(resp, 201)["change_request"]["id"]


def _impact(change_request_id: str, query: str = "", actor_role: str = VIEWER_ROLE) -> Any:
    resp = client.get(
        f"{BASE}/ontology-change-requests/{change_request_id}/impact-simulation"
        f"?actor_id={PROPOSER}&actor_role={actor_role}{query}"
    )
    return resp


def _item(**overrides: Any) -> dict:
    payload = {
        "target_kind": "CLASS",
        "change_type": "MODIFY",
        "ontology_class_id": "class-clause",
        "ontology_version_id": DRAFT_VERSION_ID,
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Report shape + 5 dimensions incl. depth-2 + layer labels
# ---------------------------------------------------------------------------


def test_report_shape_and_five_dimensions() -> None:
    _reset()
    cid = _propose([_item(change_type="DEPRECATE", ontology_class_id="class-clause")])
    body = _json(_impact(cid))

    # Top-level report shape.
    for key in (
        "change_request_id",
        "project_id",
        "analyzed_ontology_version_id",
        "analyzed_ontology_version_status",
        "items",
        "summary",
        "bounding",
        "capabilities",
        "mutation_guard",
    ):
        assert key in body, key
    assert body["change_request_id"] == cid
    assert body["project_id"] == PROJECT_ID
    assert body["change_request_status"] == "DRAFT"
    assert body["analyzed_ontology_version_id"] == DRAFT_VERSION_ID

    item = body["items"][0]
    # Dimension 1: affected ontology elements incl. direct target (depth 0).
    depths = {a["depth"] for a in item["affected_ontology_elements"]}
    assert 0 in depths
    direct = [a for a in item["affected_ontology_elements"] if a["depth"] == 0][0]
    assert direct["relation_to_target"] == "DIRECT_TARGET"
    # Dimensions 2/3: candidate + published buckets with exact count.
    assert "count" in item["dependent_candidates"]
    assert "refs" in item["dependent_candidates"]
    assert "truncated" in item["dependent_candidates"]
    assert "count" in item["dependent_published"]
    # Dimension 4: validations + quality groups by reference.
    assert isinstance(item["affected_validations"], list)
    assert isinstance(item["affected_quality_groups"], list)
    # Dimension 5: severity + summary rollup.
    assert item["severity"] in {"NONE", "LOW", "MEDIUM", "HIGH", "BREAKING"}
    assert "max_severity" in body["summary"]
    assert body["bounding"]["max_dependent_depth"] == 2


def test_depth_two_transitive_walk() -> None:
    _reset()
    cid = _propose([_item(change_type="MODIFY", ontology_class_id="class-clause")])
    body = _json(_impact(cid))
    affected = body["items"][0]["affected_ontology_elements"]
    depths = sorted({a["depth"] for a in affected})
    # direct (0) + first hop (1) + second hop (2) present, never beyond 2.
    assert depths == [0, 1, 2]
    assert max(a["depth"] for a in affected) <= 2
    # First-hop relations are labeled by concrete DependencyRelation.
    hop1 = {a["relation_to_target"] for a in affected if a["depth"] == 1}
    assert hop1 & {"PROPERTY_OF_CLASS", "RELATION_DOMAIN", "RELATION_RANGE", "SUBCLASS_OF"}


def test_layer_labels_candidate_and_published() -> None:
    _reset()
    cid = _propose([_item(change_type="DEPRECATE", ontology_class_id="class-clause")])
    body = _json(_impact(cid))
    item = body["items"][0]
    # class-clause seed: 128 candidate + 4 published dependents (both layers).
    assert item["dependent_candidates"]["count"] == 128
    assert item["dependent_published"]["count"] == 4
    # candidate refs point at CLASS layer element (class id set).
    assert item["dependent_candidates"]["refs"][0]["ontology_class_id"] == "class-clause"
    assert item["dependent_published"]["refs"][0]["ontology_class_id"] == "class-clause"


# ---------------------------------------------------------------------------
# Deterministic severity across the G3 cases + rollup
# ---------------------------------------------------------------------------


def test_severity_breaking_published_dependents() -> None:
    _reset()
    cid = _propose([_item(change_type="DEPRECATE", ontology_class_id="class-clause")])
    item = _json(_impact(cid))["items"][0]
    assert item["severity"] == "BREAKING"
    assert item["severity_reason"] == "DEPRECATE_MODIFY_WITH_PUBLISHED_DEPENDENTS"


def test_severity_high_candidate_only() -> None:
    _reset()
    cid = _propose(
        [
            _item(
                target_kind="RELATION",
                change_type="MODIFY",
                ontology_class_id=None,
                ontology_relation_id="relation-has-clause",
            )
        ]
    )
    item = _json(_impact(cid))["items"][0]
    # relation-has-clause: 12 candidate, 0 published -> HIGH.
    assert item["severity"] == "HIGH"
    assert item["severity_reason"] == "DEPRECATE_MODIFY_WITH_CANDIDATE_DEPENDENTS"


def test_severity_medium_transitive_only() -> None:
    _reset()
    cid = _propose(
        [
            _item(
                target_kind="RELATION",
                change_type="DEPRECATE",
                ontology_class_id=None,
                ontology_relation_id="relation-extra",
            )
        ]
    )
    item = _json(_impact(cid))["items"][0]
    # relation-extra: 0 candidate/published, but has domain/range classes -> MEDIUM.
    assert item["severity"] == "MEDIUM"
    assert item["severity_reason"] == "TRANSITIVE_ONTOLOGY_DEPENDENTS"


def test_severity_low_direct_only() -> None:
    _reset()
    cid = _propose(
        [_item(change_type="MODIFY", ontology_class_id="class-isolated")]
    )
    item = _json(_impact(cid))["items"][0]
    # class-isolated: no dependents, no transitive, no validation/quality -> LOW.
    assert item["dependent_candidates"]["count"] == 0
    assert item["dependent_published"]["count"] == 0
    assert len(item["affected_ontology_elements"]) == 1
    assert item["severity"] == "LOW"
    assert item["severity_reason"] == "DIRECT_ELEMENT_ONLY"


def test_severity_none_add_no_dependents() -> None:
    _reset()
    cid = _propose(
        [
            {
                "target_kind": "PROPERTY",
                "change_type": "ADD",
                "ontology_version_id": DRAFT_VERSION_ID,
                "proposed_change": {"name": "new_prop"},
            }
        ]
    )
    item = _json(_impact(cid))["items"][0]
    assert item["severity"] == "NONE"
    assert item["severity_reason"] == "ADD_NEW_ELEMENT_NO_DEPENDENTS"


def test_empty_request_none_rollup() -> None:
    _reset()
    cid = _propose([])
    body = _json(_impact(cid))
    assert body["items"] == []
    assert body["summary"]["max_severity"] == "NONE"
    assert body["summary"]["total_change_items"] == 0


def test_rollup_max_and_counts() -> None:
    _reset()
    cid = _propose(
        [
            _item(change_type="DEPRECATE", ontology_class_id="class-clause"),  # BREAKING
            _item(change_type="MODIFY", ontology_class_id="class-isolated"),  # LOW
            {
                "target_kind": "PROPERTY",
                "change_type": "ADD",
                "ontology_version_id": DRAFT_VERSION_ID,
                "proposed_change": {"name": "p"},
            },  # NONE
        ]
    )
    body = _json(_impact(cid))
    summary = body["summary"]
    assert summary["max_severity"] == "BREAKING"
    counts = summary["severity_counts"]
    assert counts["BREAKING"] == 1
    assert counts["LOW"] == 1
    assert counts["NONE"] == 1
    # per-severity counts sum == total change items.
    assert sum(counts.values()) == summary["total_change_items"] == 3
    # aggregate totals are exact (summed from exact per-item counts).
    assert summary["total_dependent_candidates"] == 128
    assert summary["total_dependent_published"] == 4


def test_determinism_byte_stable() -> None:
    _reset()
    cid = _propose([_item(change_type="DEPRECATE", ontology_class_id="class-clause")])

    def _strip(body: dict) -> dict:
        body = copy.deepcopy(body)
        body.pop("computed_at", None)
        return body

    first = _strip(_json(_impact(cid)))
    second = _strip(_json(_impact(cid)))
    assert first == second


# ---------------------------------------------------------------------------
# ref_cap = 20 truncation (exact count, truncated flag, override)
# ---------------------------------------------------------------------------


def test_ref_cap_default_20_truncation() -> None:
    _reset()
    cid = _propose([_item(change_type="DEPRECATE", ontology_class_id="class-clause")])
    body = _json(_impact(cid))
    assert body["bounding"]["ref_cap"] == 20
    bucket = body["items"][0]["dependent_candidates"]
    # exact count never capped; refs capped at 20; truncated true.
    assert bucket["count"] == 128
    assert len(bucket["refs"]) == 20
    assert bucket["truncated"] is True
    assert body["bounding"]["any_dimension_truncated"] is True


def test_ref_cap_override_untruncates() -> None:
    _reset()
    cid = _propose([_item(change_type="DEPRECATE", ontology_class_id="class-clause")])
    body = _json(_impact(cid, query="&ref_cap=200"))
    assert body["bounding"]["ref_cap"] == 200
    bucket = body["items"][0]["dependent_candidates"]
    assert bucket["count"] == 128
    assert len(bucket["refs"]) == 128
    assert bucket["truncated"] is False


def test_ref_cap_out_of_range_rejected() -> None:
    _reset()
    cid = _propose([_item(change_type="MODIFY", ontology_class_id="class-clause")])
    assert _impact(cid, query="&ref_cap=0").status_code == 422
    assert _impact(cid, query="&ref_cap=201").status_code == 422


# ---------------------------------------------------------------------------
# DATA-LEVEL no-mutation (all surface tables + governance state before==after)
# ---------------------------------------------------------------------------


def test_data_level_no_mutation() -> None:
    _reset()
    cid = _propose(
        [
            _item(change_type="DEPRECATE", ontology_class_id="class-clause"),
            {
                "target_kind": "PROPERTY",
                "change_type": "ADD",
                "ontology_version_id": DRAFT_VERSION_ID,
                "proposed_change": {"name": "p"},
            },
        ]
    )

    def _governance_snapshot() -> dict:
        return {
            "requests": {
                rid: (r.status.value, r.application_state.value, r.updated_at)
                for rid, r in service._requests.items()
            },
            "items": {
                rid: [it.model_dump(mode="json") for it in items]
                for rid, items in service._items.items()
            },
            "reviews": {
                rid: [rv.model_dump(mode="json") for rv in revs]
                for rid, revs in service._reviews.items()
            },
            "audit": [a.model_dump(mode="json") for a in service._audit],
        }

    def _application_snapshot() -> dict:
        versions = {}
        for vid, ver in application._versions.items():
            versions[vid] = {
                "status": ver.status.value,
                "elements": {
                    f"{k[0].value}:{k[1]}": el.status.value
                    for k, el in ver.elements.items()
                },
            }
        return {
            "versions": versions,
            "snapshots": copy.deepcopy(application._snapshots),
            "app_audit": [a.model_dump(mode="json") for a in application._app_audit],
        }

    gov_before = _governance_snapshot()
    app_before = _application_snapshot()

    # Run the read twice (idempotent).
    _json(_impact(cid))
    _json(_impact(cid, query="&ref_cap=200"))

    assert _governance_snapshot() == gov_before
    assert _application_snapshot() == app_before


def test_mutation_guard_all_false() -> None:
    _reset()
    cid = _propose([_item(change_type="DEPRECATE", ontology_class_id="class-clause")])
    body = _json(_impact(cid))
    assert body["mutation_guard"] == ALL_FALSE_IMPACT_GUARD
    # No flag is true across a variety of change types.
    for guard_flag, value in body["mutation_guard"].items():
        assert value is False, guard_flag


# ---------------------------------------------------------------------------
# Read authz (VIEWER allowed); governance state never changed
# ---------------------------------------------------------------------------


def test_read_authz_viewer_allowed() -> None:
    _reset()
    cid = _propose([_item(change_type="MODIFY", ontology_class_id="class-clause")])
    resp = _impact(cid, actor_role="VIEWER")
    assert resp.status_code == 200
    body = resp.json()
    assert body["capabilities"]["can_view"] is True
    assert body["capabilities"]["actor_role"] == "VIEWER"
    # VIEWER cannot apply (advisory echo only).
    assert body["capabilities"]["can_apply"] is False


def test_missing_change_request_404() -> None:
    _reset()
    resp = _impact("ocr-does-not-exist")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "CHANGE_REQUEST_NOT_FOUND"


def test_read_does_not_change_governance_status() -> None:
    _reset()
    cid = _propose([_item(change_type="MODIFY", ontology_class_id="class-clause")])
    before = client.get(
        f"{BASE}/ontology-change-requests/{cid}?actor_id={PROPOSER}&actor_role={VIEWER_ROLE}"
    ).json()["change_request"]
    _json(_impact(cid))
    after = client.get(
        f"{BASE}/ontology-change-requests/{cid}?actor_id={PROPOSER}&actor_role={VIEWER_ROLE}"
    ).json()["change_request"]
    assert before["status"] == after["status"]
    assert before["application_state"] == after["application_state"]


# ---------------------------------------------------------------------------
# OpenAPI field/enum alignment (actual export vs frozen draft)
# ---------------------------------------------------------------------------


def test_openapi_field_and_enum_alignment() -> None:
    actual = app.openapi()
    draft = json.loads(MVP6_7_OPENAPI_DRAFT.read_text(encoding="utf-8"))

    path = IMPACT_PATH_TEMPLATE
    assert path in actual["paths"]
    assert path in draft["paths"]

    actual_schemas = actual["components"]["schemas"]
    draft_schemas = draft["components"]["schemas"]

    for name in (
        "ImpactSimulationReport",
        "ImpactItem",
        "DependentRefBucket",
        "ImpactSummary",
        "ImpactSeverity",
        "ImpactSeverityReason",
        "DependencyRelation",
        "ImpactSimulationMutationGuard",
        "AffectedOntologyElement",
        "AffectedValidationRef",
        "ImpactSimulationCapabilities",
        "ImpactBounding",
    ):
        assert name in actual_schemas, f"missing actual schema {name}"
        assert name in draft_schemas, f"missing draft schema {name}"

    # Enums align exactly.
    for enum_name in ("ImpactSeverity", "ImpactSeverityReason", "DependencyRelation"):
        assert set(actual_schemas[enum_name]["enum"]) == set(
            draft_schemas[enum_name]["enum"]
        ), enum_name

    # Mutation guard flags align.
    assert set(actual_schemas["ImpactSimulationMutationGuard"]["properties"]) == set(
        draft_schemas["ImpactSimulationMutationGuard"]["properties"]
    )

    # ref_cap default 20 in the actual export.
    params = {
        p["name"]: p for p in actual["paths"][path]["get"]["parameters"]
    }
    assert params["ref_cap"]["schema"]["default"] == 20
