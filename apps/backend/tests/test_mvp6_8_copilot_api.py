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
from app.modules.copilot import service  # noqa: E402
from app.modules.governance import application as gov_application  # noqa: E402
from app.modules.governance import service as gov_service  # noqa: E402
from app.modules.learning import service as learning_service  # noqa: E402
from scripts.seed_mvp3 import seed_mvp3  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parents[3]
MVP6_8_OPENAPI_DRAFT = REPO_ROOT / "docs/api/openapi-mvp6-8-draft.json"

BASE = "/api/v1"
PROJECT_ID = "project-corp-knowledge"

ALL_FALSE_GUARD = {
    "ontology_draft_mutated": False,
    "ontology_published_mutated": False,
    "candidate_graph_mutated": False,
    "published_graph_mutated": False,
    "prompt_version_mutated": False,
    "governance_state_mutated": False,
    "change_request_created": False,
    "change_request_applied": False,
    "candidate_approved_or_published": False,
    "extraction_job_started": False,
    "evaluation_run_started": False,
    "auto_approval_policy_mutated": False,
    "copilot_executed_action": False,
    "real_model_invoked": False,
}


def _json(response: Any, expected_status: int = 200) -> Any:
    assert response.status_code == expected_status, response.text
    return response.json()


def _reset() -> None:
    service.reset_runtime_store()
    seed_mvp3(reset=True)


def _summary(project_id: str = PROJECT_ID) -> Any:
    return client.get(f"{BASE}/projects/{project_id}/copilot/summary")


def _suggestions(project_id: str = PROJECT_ID, query: str = "") -> Any:
    return client.get(f"{BASE}/projects/{project_id}/copilot/suggestions{query}")


def _detail(suggestion_id: str) -> Any:
    return client.get(f"{BASE}/copilot-suggestions/{suggestion_id}")


def _decide(suggestion_id: str, body: dict, query: str = "") -> Any:
    return client.post(
        f"{BASE}/copilot-suggestions/{suggestion_id}/decisions{query}", json=body
    )


def _first_suggestion_id(project_id: str = PROJECT_ID) -> str:
    return _json(_suggestions(project_id))["items"][0]["id"]


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------


def test_summary_shape_and_counts() -> None:
    _reset()
    body = _json(_summary())
    assert body["project_id"] == PROJECT_ID
    assert body["total_suggestion_count"] == 4
    assert body["suggested_count"] == 4
    assert body["accepted_count"] == 0
    assert body["dismissed_count"] == 0
    assert body["superseded_count"] == 0
    assert {c["kind"] for c in body["counts_by_kind"]} == {
        "DRAFT_GOVERNANCE_CHANGE_REQUEST",
        "REVIEW_THESE_CANDIDATES",
        "INSPECT_QUALITY_OR_VALIDATION_SIGNAL",
        "RUN_IMPACT_SIMULATION",
    }
    assert body["source_artifact_scope"]  # non-empty
    assert body["advisory_notes"]
    assert body["mutation_guard"] == ALL_FALSE_GUARD


def test_summary_g3_field_set_exact() -> None:
    _reset()
    body = _json(_summary())
    assert set(body.keys()) == {
        "project_id",
        "generated_at",
        "source_artifact_scope",
        "total_suggestion_count",
        "suggested_count",
        "accepted_count",
        "dismissed_count",
        "superseded_count",
        "high_risk_count",
        "counts_by_kind",
        "advisory_notes",
        "mutation_guard",
    }


# ---------------------------------------------------------------------------
# Suggestions: deterministic, grounded, capped, empty-ok
# ---------------------------------------------------------------------------


def test_suggestions_deterministic_byte_stable() -> None:
    _reset()
    first = _summary().text, _suggestions().text
    _reset()
    second = _summary().text, _suggestions().text
    assert first == second


def test_suggestions_grounded_and_ordered() -> None:
    _reset()
    items = _json(_suggestions())["items"]
    assert len(items) == 4
    # Ordered by kind ordinal.
    kinds = [i["kind"] for i in items]
    assert kinds == [
        "DRAFT_GOVERNANCE_CHANGE_REQUEST",
        "REVIEW_THESE_CANDIDATES",
        "INSPECT_QUALITY_OR_VALIDATION_SIGNAL",
        "RUN_IMPACT_SIMULATION",
    ]
    for item in items:
        assert len(item["source_artifacts"]) >= 1
        assert item["routing_target"]["executes_nothing"] is True
        assert item["routing_target"]["human_gate_note"]
        assert item["state"] == "SUGGESTED"


def test_governance_prefill_uses_real_change_request_target_kind() -> None:
    _reset()
    gov = None
    for item in _json(_suggestions())["items"]:
        if item["kind"] == "DRAFT_GOVERNANCE_CHANGE_REQUEST":
            gov = item
    assert gov is not None
    prefill = gov["routing_target"]["governance_change_request_draft_prefill"]
    # Real ChangeRequestTargetKind literal is CLASS, not ONTOLOGY_CLASS.
    assert prefill["target_kind"] == "CLASS"
    assert prefill["change_type"] in {"ADD", "MODIFY", "DEPRECATE"}
    for ref in prefill["element_refs"]:
        assert ref["element_kind"] in {"CLASS", "PROPERTY", "RELATION"}


def test_suggestions_cap_20() -> None:
    _reset()
    body = _json(_suggestions())
    assert len(body["items"]) <= 20


def test_suggestions_empty_project_ok() -> None:
    # Unknown project -> 404, not error list; empty-state itself is legitimate but
    # the seeded generator always emits 4. Confirm 404 for a truly missing project.
    _reset()
    resp = _suggestions("project-does-not-exist")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "PROJECT_NOT_FOUND"


def test_suggestions_filter_by_kind() -> None:
    _reset()
    body = _json(_suggestions(query="?kind=RUN_IMPACT_SIMULATION"))
    assert len(body["items"]) == 1
    assert body["items"][0]["kind"] == "RUN_IMPACT_SIMULATION"


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------


def test_detail_ok_and_grounded() -> None:
    _reset()
    sid = _first_suggestion_id()
    body = _json(_detail(sid))
    assert body["suggestion"]["id"] == sid
    assert len(body["suggestion"]["source_artifacts"]) >= 1
    assert body["mutation_guard"] == ALL_FALSE_GUARD


def test_detail_missing_404() -> None:
    _reset()
    resp = _detail("copilot-does-not-exist")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "COPILOT_SUGGESTION_NOT_FOUND"


# ---------------------------------------------------------------------------
# Decisions: ACCEPT returns routing target + transitions; DISMISS; conflicts
# ---------------------------------------------------------------------------


def test_accept_returns_routing_target_and_transitions() -> None:
    _reset()
    sid = _first_suggestion_id()  # governance suggestion (first ordinal)
    body = _json(_decide(sid, {"decision": "ACCEPT"}), 201)
    assert body["previous_state"] == "SUGGESTED"
    assert body["new_state"] == "ACCEPTED"
    assert body["routing_target"] is not None
    assert body["routing_target"]["kind"] == "GOVERNANCE_CHANGE_REQUEST_DRAFT"
    assert body["routing_target"]["executes_nothing"] is True
    assert body["mutation_guard"] == ALL_FALSE_GUARD
    assert body["decision_audit_note"]["decision"] == "ACCEPT"
    assert body["decision_audit_note"]["routing_target"] is not None
    # State persisted.
    detail = _json(_detail(sid))
    assert detail["suggestion"]["state"] == "ACCEPTED"


def test_dismiss_records_audit_and_transitions() -> None:
    _reset()
    sid = _first_suggestion_id()
    body = _json(
        _decide(sid, {"decision": "DISMISS", "dismiss_reason_code": "NOT_RELEVANT"}), 201
    )
    assert body["new_state"] == "DISMISSED"
    assert body["routing_target"] is None
    assert body["decision_audit_note"]["dismiss_reason_code"] == "NOT_RELEVANT"


def test_dismiss_requires_reason_422() -> None:
    _reset()
    sid = _first_suggestion_id()
    resp = _decide(sid, {"decision": "DISMISS"})
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "DISMISS_REASON_REQUIRED"


def test_dismiss_other_requires_note_422() -> None:
    _reset()
    sid = _first_suggestion_id()
    resp = _decide(sid, {"decision": "DISMISS", "dismiss_reason_code": "OTHER"})
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "DECISION_NOTE_REQUIRED"


def test_accept_with_reason_code_422() -> None:
    _reset()
    sid = _first_suggestion_id()
    resp = _decide(sid, {"decision": "ACCEPT", "dismiss_reason_code": "NOT_RELEVANT"})
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "DISMISS_REASON_NOT_ALLOWED"


def test_non_suggested_decision_conflict_409() -> None:
    _reset()
    sid = _first_suggestion_id()
    _json(_decide(sid, {"decision": "ACCEPT"}), 201)
    resp = _decide(sid, {"decision": "DISMISS", "dismiss_reason_code": "NOT_RELEVANT"})
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "COPILOT_SUGGESTION_DECISION_CONFLICT"


def test_decision_missing_suggestion_404() -> None:
    _reset()
    resp = _decide("copilot-does-not-exist", {"decision": "ACCEPT"})
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "COPILOT_SUGGESTION_NOT_FOUND"


# ---------------------------------------------------------------------------
# Authz: any project member views + records audit-only decisions
# ---------------------------------------------------------------------------


def test_authz_any_member_views_and_decides() -> None:
    _reset()
    assert _summary().status_code == 200
    sid = _first_suggestion_id()
    body = _json(
        _decide(sid, {"decision": "ACCEPT"}, query="?actor_id=user-9&actor_role=VIEWER"),
        201,
    )
    assert body["decision_audit_note"]["actor_id"] == "user-9"
    assert body["decision_audit_note"]["actor_role"] == "VIEWER"


# ---------------------------------------------------------------------------
# All-false 14-flag guard on every response
# ---------------------------------------------------------------------------


def test_guard_all_false_on_every_response() -> None:
    _reset()
    sid = _first_suggestion_id()
    responses = [
        _json(_summary())["mutation_guard"],
        _json(_suggestions())["mutation_guard"],
        _json(_detail(sid))["mutation_guard"],
    ]
    accept = _json(_decide(sid, {"decision": "ACCEPT"}), 201)
    responses.append(accept["mutation_guard"])
    responses.append(accept["decision_audit_note"]["mutation_guard"])
    for guard in responses:
        assert guard == ALL_FALSE_GUARD
        assert guard["copilot_executed_action"] is False
        assert guard["real_model_invoked"] is False
        assert len(guard) == 14


# ---------------------------------------------------------------------------
# DATA-LEVEL no-mutation: all surface stores unchanged by any copilot call
# (including ACCEPT). The copilot has its own store and reads no other write path.
# ---------------------------------------------------------------------------


def test_data_level_no_mutation_including_accept() -> None:
    _reset()

    def _governance_snapshot() -> dict:
        return {
            "requests": {
                rid: (r.status.value, r.application_state.value)
                for rid, r in gov_service._requests.items()
            },
            "items": {
                rid: [it.model_dump(mode="json") for it in items]
                for rid, items in gov_service._items.items()
            },
            "reviews": {
                rid: [rv.model_dump(mode="json") for rv in revs]
                for rid, revs in gov_service._reviews.items()
            },
            "audit": [a.model_dump(mode="json") for a in gov_service._audit],
        }

    def _application_snapshot() -> dict:
        versions = {}
        for vid, ver in gov_application._versions.items():
            versions[vid] = {
                "status": ver.status.value,
                "elements": {
                    f"{k[0].value}:{k[1]}": el.status.value for k, el in ver.elements.items()
                },
            }
        return {
            "versions": versions,
            "app_audit": [a.model_dump(mode="json") for a in gov_application._app_audit],
        }

    def _learning_snapshot() -> dict:
        return {
            "suggestions": {
                pid: [s.model_dump(mode="json") for s in items]
                for pid, items in learning_service._suggestions_by_project.items()
            },
            "patterns": {
                pid: [p.model_dump(mode="json") for p in items]
                for pid, items in learning_service._patterns_by_project.items()
            },
        }

    gov_before = _governance_snapshot()
    app_before = _application_snapshot()
    learning_before = _learning_snapshot()

    sid = _first_suggestion_id()
    _json(_summary())
    _json(_suggestions())
    _json(_detail(sid))
    _json(_decide(sid, {"decision": "ACCEPT"}), 201)
    sid2 = _json(_suggestions())["items"][1]["id"]
    _json(_decide(sid2, {"decision": "DISMISS", "dismiss_reason_code": "DUPLICATE"}), 201)

    assert _governance_snapshot() == gov_before
    assert _application_snapshot() == app_before
    assert _learning_snapshot() == learning_before


# ---------------------------------------------------------------------------
# OpenAPI field / enum alignment (actual export vs frozen draft)
# ---------------------------------------------------------------------------


def test_openapi_paths_present() -> None:
    actual = app.openapi()
    for path in (
        "/api/v1/projects/{project_id}/copilot/summary",
        "/api/v1/projects/{project_id}/copilot/suggestions",
        "/api/v1/copilot-suggestions/{suggestion_id}",
        "/api/v1/copilot-suggestions/{suggestion_id}/decisions",
    ):
        assert path in actual["paths"], path


def test_openapi_enum_alignment() -> None:
    actual = app.openapi()["components"]["schemas"]
    draft = json.loads(MVP6_8_OPENAPI_DRAFT.read_text(encoding="utf-8"))
    draft_schemas = draft["components"]["schemas"]
    for name in (
        "CopilotSuggestionKind",
        "CopilotSuggestionState",
        "CopilotDecisionCommand",
        "CopilotDismissReasonCode",
        "CopilotRoutingTargetKind",
        "CopilotSourceArtifactType",
        "CopilotConfidenceLabel",
        "CopilotRiskLabel",
    ):
        assert name in actual, name
        assert set(actual[name]["enum"]) == set(draft_schemas[name]["enum"]), name


def test_openapi_mutation_guard_14_flags() -> None:
    actual = app.openapi()["components"]["schemas"]
    guard = actual["CopilotMutationGuard"]
    assert set(guard["properties"].keys()) == set(ALL_FALSE_GUARD.keys())
    assert len(guard["properties"]) == 14
    # All 14 flags are const/default false in the exported schema.
    for name, prop in guard["properties"].items():
        assert prop.get("default") is False, name
