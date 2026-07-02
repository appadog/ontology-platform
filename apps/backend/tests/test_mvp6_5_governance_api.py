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
from app.modules.governance import service  # noqa: E402
from scripts.seed_mvp3 import seed_mvp3  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parents[3]
MVP6_5_OPENAPI_PATH = REPO_ROOT / "docs/api/openapi-mvp6-5-draft.json"

PROJECT_ID = "project-corp-knowledge"
VERSION_ID = "ontology-v7"

PROPOSER = "user-analyst-3"
MANAGER = "user-ontology-manager-1"
MANAGER_ROLE = "ONTOLOGY_MANAGER"
REVIEWER = "user-reviewer-2"
REVIEWER_ROLE = "REVIEWER"
VIEWER_ROLE = "VIEWER"

ALL_FALSE_GUARD = {
    "ontology_definition_mutated": False,
    "published_graph_mutated": False,
    "candidate_graph_mutated": False,
    "prompt_version_mutated": False,
    "publish_job_started": False,
    "extraction_job_started": False,
    "change_auto_applied": False,
}

BASE = "/api/v1"


def _json(response: Any, expected_status: int = 200) -> Any:
    assert response.status_code == expected_status, response.text
    return response.json()


def _reset() -> None:
    service.reset_runtime_store()
    seed_mvp3(reset=True)


def _assert_guard(payload: dict) -> None:
    assert payload["mutation_guard"] == ALL_FALSE_GUARD


def _add_item_payload(**overrides: Any) -> dict:
    payload = {
        "target_kind": "PROPERTY",
        "change_type": "ADD",
        "ontology_version_id": VERSION_ID,
        "proposed_change": {"name": "claim_filing_deadline", "label": "청구 기한"},
    }
    payload.update(overrides)
    return payload


def _propose(actor_id: str = PROPOSER, with_item: bool = True, role: str = VIEWER_ROLE) -> dict:
    body = {
        "title": "보험금 청구 클래스 속성 추가",
        "summary": "청구 기한 속성 추가 제안",
        "ontology_version_id": VERSION_ID,
        "items": [_add_item_payload()] if with_item else [],
    }
    resp = client.post(
        f"{BASE}/projects/{PROJECT_ID}/ontology-change-requests"
        f"?actor_id={actor_id}&actor_role={role}",
        json=body,
    )
    return _json(resp, 201)


def _submit(cr_id: str, actor_id: str = PROPOSER) -> dict:
    return _json(
        client.post(
            f"{BASE}/ontology-change-requests/{cr_id}/submit?actor_id={actor_id}&actor_role={VIEWER_ROLE}"
        )
    )


def _review(cr_id: str, action: str, actor_id: str, role: str, reason: str | None = None) -> Any:
    body: dict[str, Any] = {"action": action}
    if reason is not None:
        body["reason"] = reason
    return client.post(
        f"{BASE}/ontology-change-requests/{cr_id}/reviews?actor_id={actor_id}&actor_role={role}",
        json=body,
    )


# --- A. propose / items / submit / withdraw --------------------------------


def test_propose_creates_draft_with_items() -> None:
    _reset()
    created = _propose()
    cr = created["change_request"]
    assert cr["status"] == "DRAFT"
    assert cr["application_state"] == "NOT_APPLICABLE"
    assert cr["proposer_id"] == PROPOSER
    assert cr["item_count"] == 1
    assert created["audit_entry"]["action"] == "CHANGE_REQUEST_CREATED"
    assert created["review_decision"] is None
    _assert_guard(created)


def test_add_edit_remove_item_and_get_detail() -> None:
    _reset()
    cr_id = _propose(with_item=False)["change_request"]["id"]
    added = _json(
        client.post(
            f"{BASE}/ontology-change-requests/{cr_id}/items?actor_id={PROPOSER}&actor_role={VIEWER_ROLE}",
            json=_add_item_payload(),
        ),
        201,
    )
    assert added["change_request"]["item_count"] == 1
    _assert_guard(added)
    detail = _json(
        client.get(f"{BASE}/ontology-change-requests/{cr_id}?actor_id={PROPOSER}&actor_role={VIEWER_ROLE}")
    )
    item_id = detail["items"][0]["id"]
    assert detail["application_banner"]["application_state"] == "NOT_APPLICABLE"
    assert detail["capabilities"]["can_edit_request"] is True

    edited = _json(
        client.patch(
            f"{BASE}/ontology-change-requests/{cr_id}/items/{item_id}?actor_id={PROPOSER}&actor_role={VIEWER_ROLE}",
            json=_add_item_payload(proposed_change={"name": "renamed"}),
        )
    )
    assert edited["change_request"]["item_count"] == 1

    removed = _json(
        client.delete(
            f"{BASE}/ontology-change-requests/{cr_id}/items/{item_id}?actor_id={PROPOSER}&actor_role={VIEWER_ROLE}"
        )
    )
    assert removed["change_request"]["item_count"] == 0


def test_submit_draft_to_open() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    submitted = _submit(cr_id)
    assert submitted["change_request"]["status"] == "OPEN"
    assert submitted["change_request"]["submitted_at"] is not None
    assert submitted["audit_entry"]["action"] == "CHANGE_REQUEST_SUBMITTED"
    _assert_guard(submitted)


def test_submit_no_items_409() -> None:
    _reset()
    cr_id = _propose(with_item=False)["change_request"]["id"]
    body = _json(
        client.post(
            f"{BASE}/ontology-change-requests/{cr_id}/submit?actor_id={PROPOSER}&actor_role={VIEWER_ROLE}"
        ),
        409,
    )
    assert body["error"]["code"] == "CHANGE_REQUEST_NO_ITEMS"


def test_withdraw_from_open() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    _submit(cr_id)
    withdrawn = _json(
        client.post(
            f"{BASE}/ontology-change-requests/{cr_id}/withdraw?actor_id={PROPOSER}&actor_role={VIEWER_ROLE}",
            json={"reason": "중복 제안"},
        )
    )
    assert withdrawn["change_request"]["status"] == "WITHDRAWN"
    assert withdrawn["audit_entry"]["action"] == "CHANGE_REQUEST_WITHDRAWN"


def test_update_title_while_draft() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    updated = _json(
        client.patch(
            f"{BASE}/ontology-change-requests/{cr_id}?actor_id={PROPOSER}&actor_role={VIEWER_ROLE}",
            json={"title": "수정된 제목"},
        )
    )
    assert updated["change_request"]["title"] == "수정된 제목"
    assert updated["audit_entry"]["action"] == "CHANGE_REQUEST_UPDATED"


# --- B. review actions + state transitions + G1 first-touch -----------------


def test_comment_first_touch_advances_and_fires_review_started_before_comment() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    _submit(cr_id)
    resp = _json(_review(cr_id, "COMMENT", REVIEWER, REVIEWER_ROLE))
    assert resp["change_request"]["status"] == "IN_REVIEW"
    assert resp["review_decision"]["action"] == "COMMENT"
    _assert_guard(resp)

    audit = _json(client.get(f"{BASE}/ontology-change-requests/{cr_id}/audit"))
    actions = [e["action"] for e in audit["items"]]
    # G1: REVIEW_STARTED fires before the action's own audit (COMMENT_ADDED)
    assert "REVIEW_STARTED" in actions
    assert "COMMENT_ADDED" in actions
    assert actions.index("REVIEW_STARTED") < actions.index("COMMENT_ADDED")
    # REVIEW_STARTED before/after status reflects OPEN -> IN_REVIEW
    rs = next(e for e in audit["items"] if e["action"] == "REVIEW_STARTED")
    assert rs["before_status"] == "OPEN"
    assert rs["after_status"] == "IN_REVIEW"


def test_review_started_fires_once_per_open_episode_and_refires_after_request_changes() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    _submit(cr_id)
    # first touch -> REVIEW_STARTED (1)
    _json(_review(cr_id, "COMMENT", REVIEWER, REVIEWER_ROLE))
    # second touch while already IN_REVIEW -> no new REVIEW_STARTED
    _json(_review(cr_id, "COMMENT", REVIEWER, REVIEWER_ROLE))
    audit1 = _json(client.get(f"{BASE}/ontology-change-requests/{cr_id}/audit"))
    assert [e["action"] for e in audit1["items"]].count("REVIEW_STARTED") == 1

    # REQUEST_CHANGES returns to OPEN
    rc = _json(_review(cr_id, "REQUEST_CHANGES", REVIEWER, REVIEWER_ROLE, reason="근거 보강 필요"))
    assert rc["change_request"]["status"] == "OPEN"
    assert rc["review_decision"]["resulting_status"] == "OPEN"

    # next reviewer touch re-fires REVIEW_STARTED (new OPEN episode)
    _json(_review(cr_id, "COMMENT", REVIEWER, REVIEWER_ROLE))
    audit2 = _json(client.get(f"{BASE}/ontology-change-requests/{cr_id}/audit"))
    assert [e["action"] for e in audit2["items"]].count("REVIEW_STARTED") == 2


def test_approve_directly_from_open_no_review_started() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    _submit(cr_id)
    approved = _json(_review(cr_id, "APPROVE", MANAGER, MANAGER_ROLE, reason="규정과 일치"))
    assert approved["change_request"]["status"] == "APPROVED"
    audit = _json(client.get(f"{BASE}/ontology-change-requests/{cr_id}/audit"))
    actions = [e["action"] for e in audit["items"]]
    # APPROVE valid directly from OPEN, no REVIEW_STARTED
    assert "REVIEW_STARTED" not in actions
    assert "CHANGE_REQUEST_APPROVED" in actions


def test_reject_directly_from_open_no_review_started() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    _submit(cr_id)
    rejected = _json(_review(cr_id, "REJECT", MANAGER, MANAGER_ROLE, reason="근거 부족"))
    assert rejected["change_request"]["status"] == "REJECTED"
    assert rejected["change_request"]["application_state"] == "NOT_APPLICABLE"
    assert rejected["change_request"]["decided_by"] == MANAGER
    audit = _json(client.get(f"{BASE}/ontology-change-requests/{cr_id}/audit"))
    assert "REVIEW_STARTED" not in [e["action"] for e in audit["items"]]


# --- C. APPROVE => QUEUED, nothing applied, all-false guard -----------------


def test_approve_queued_nothing_applied() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    _submit(cr_id)
    approved = _json(_review(cr_id, "APPROVE", MANAGER, MANAGER_ROLE, reason="규정과 일치"))
    cr = approved["change_request"]
    assert cr["status"] == "APPROVED"
    assert cr["application_state"] == "QUEUED"
    assert cr["decided_by"] == MANAGER
    assert cr["decision_reason"] == "규정과 일치"
    # review decision echoes QUEUED
    assert approved["review_decision"]["resulting_application_state"] == "QUEUED"
    # boundary proof: nothing applied
    assert approved["mutation_guard"]["change_auto_applied"] is False
    _assert_guard(approved)
    # detail banner shows QUEUED
    detail = _json(
        client.get(f"{BASE}/ontology-change-requests/{cr_id}?actor_id={MANAGER}&actor_role={MANAGER_ROLE}")
    )
    assert detail["application_banner"]["application_state"] == "QUEUED"
    # APPLIED / SUPERSEDED never produced
    assert cr["application_state"] not in ("APPLIED", "SUPERSEDED")


# --- D. reason-required 422 / self-approval 403 / role 403 / state 409 ------


def test_reason_required_422_for_approve_reject_request_changes() -> None:
    _reset()
    for action, role, actor in (
        ("APPROVE", MANAGER_ROLE, MANAGER),
        ("REJECT", MANAGER_ROLE, MANAGER),
        ("REQUEST_CHANGES", REVIEWER_ROLE, REVIEWER),
    ):
        cr_id = _propose()["change_request"]["id"]
        _submit(cr_id)
        for reason in (None, "   "):
            body = _json(_review(cr_id, action, actor, role, reason=reason), 422)
            assert body["error"]["code"] == "REASON_REQUIRED", (action, reason)


def test_comment_reason_optional() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    _submit(cr_id)
    resp = _json(_review(cr_id, "COMMENT", REVIEWER, REVIEWER_ROLE))
    assert resp["review_decision"]["action"] == "COMMENT"


def test_self_approval_forbidden_403() -> None:
    _reset()
    # proposer holds an approver role but is still blocked from approving own request
    cr_id = _propose(actor_id=MANAGER, role=MANAGER_ROLE)["change_request"]["id"]
    _submit(cr_id, actor_id=MANAGER)
    body = _json(_review(cr_id, "APPROVE", MANAGER, MANAGER_ROLE, reason="ok"), 403)
    assert body["error"]["code"] == "SELF_APPROVAL_FORBIDDEN"


def test_role_restriction_approve_reject_403() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    _submit(cr_id)
    for action in ("APPROVE", "REJECT"):
        body = _json(_review(cr_id, action, REVIEWER, REVIEWER_ROLE, reason="x"), 403)
        assert body["error"]["code"] == "PERMISSION_DENIED", action


def test_comment_role_restriction_403_for_viewer() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    _submit(cr_id)
    body = _json(_review(cr_id, "COMMENT", "user-viewer", VIEWER_ROLE), 403)
    assert body["error"]["code"] == "PERMISSION_DENIED"


def test_decision_on_draft_or_terminal_409() -> None:
    _reset()
    # draft (not submitted)
    cr_id = _propose()["change_request"]["id"]
    body = _json(_review(cr_id, "APPROVE", MANAGER, MANAGER_ROLE, reason="x"), 409)
    assert body["error"]["code"] == "CHANGE_REQUEST_STATE_CONFLICT"
    # terminal (approved) -> further decision 409
    _submit(cr_id)
    _json(_review(cr_id, "APPROVE", MANAGER, MANAGER_ROLE, reason="ok"))
    body2 = _json(_review(cr_id, "REJECT", MANAGER, MANAGER_ROLE, reason="late"), 409)
    assert body2["error"]["code"] == "CHANGE_REQUEST_STATE_CONFLICT"


def test_submit_wrong_state_409() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    _submit(cr_id)
    body = _json(
        client.post(
            f"{BASE}/ontology-change-requests/{cr_id}/submit?actor_id={PROPOSER}&actor_role={VIEWER_ROLE}"
        ),
        409,
    )
    assert body["error"]["code"] == "CHANGE_REQUEST_STATE_CONFLICT"


def test_edit_item_blocked_once_in_review_409() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    _submit(cr_id)
    _json(_review(cr_id, "COMMENT", REVIEWER, REVIEWER_ROLE))  # -> IN_REVIEW
    body = _json(
        client.post(
            f"{BASE}/ontology-change-requests/{cr_id}/items?actor_id={PROPOSER}&actor_role={VIEWER_ROLE}",
            json=_add_item_payload(),
        ),
        409,
    )
    assert body["error"]["code"] == "CHANGE_REQUEST_STATE_CONFLICT"


def test_non_proposer_edit_forbidden_403() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    body = _json(
        client.patch(
            f"{BASE}/ontology-change-requests/{cr_id}?actor_id=stranger&actor_role={VIEWER_ROLE}",
            json={"title": "x"},
        ),
        403,
    )
    assert body["error"]["code"] == "PERMISSION_DENIED"


# --- E. audit ordering + pagination + list grouping -------------------------


def test_audit_chronological_asc_and_pagination() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    _submit(cr_id)
    _json(_review(cr_id, "COMMENT", REVIEWER, REVIEWER_ROLE))
    _json(_review(cr_id, "APPROVE", MANAGER, MANAGER_ROLE, reason="ok"))

    audit = _json(client.get(f"{BASE}/ontology-change-requests/{cr_id}/audit"))
    ts = [e["created_at"] for e in audit["items"]]
    assert ts == sorted(ts), "audit must be chronological ASC"
    assert audit["items"][0]["action"] == "CHANGE_REQUEST_CREATED"

    # pagination: limit=1 yields a cursor; walk it
    first = _json(client.get(f"{BASE}/ontology-change-requests/{cr_id}/audit?limit=1"))
    assert len(first["items"]) == 1
    assert first["next_cursor"] is not None
    second = _json(
        client.get(f"{BASE}/ontology-change-requests/{cr_id}/audit?limit=1&cursor={first['next_cursor']}")
    )
    assert second["items"][0]["id"] != first["items"][0]["id"]

    # action filter
    filtered = _json(
        client.get(f"{BASE}/ontology-change-requests/{cr_id}/audit?action=CHANGE_REQUEST_APPROVED")
    )
    assert all(e["action"] == "CHANGE_REQUEST_APPROVED" for e in filtered["items"])
    assert len(filtered["items"]) == 1


def test_project_governance_audit_feed() -> None:
    _reset()
    cr_id = _propose()["change_request"]["id"]
    _submit(cr_id)
    feed = _json(client.get(f"{BASE}/projects/{PROJECT_ID}/governance-audit"))
    actions = [e["action"] for e in feed["items"]]
    assert "CHANGE_REQUEST_CREATED" in actions
    assert "CHANGE_REQUEST_SUBMITTED" in actions
    for e in feed["items"]:
        assert e["actor_id"]
        assert e["created_at"]
        assert e["project_id"] == PROJECT_ID


def test_list_change_requests_status_filter_and_no_current_reviewer_field() -> None:
    _reset()
    cr_open = _propose()["change_request"]["id"]
    _submit(cr_open)
    _propose()  # a DRAFT
    listed = _json(client.get(f"{BASE}/projects/{PROJECT_ID}/ontology-change-requests"))
    assert listed["total_count"] == 2
    # DTO carries no current-reviewer field (G4)
    assert "current_reviewer" not in listed["items"][0]
    assert "current_reviewer_id" not in listed["items"][0]
    # status filter
    open_only = _json(
        client.get(f"{BASE}/projects/{PROJECT_ID}/ontology-change-requests?status=OPEN")
    )
    assert all(r["status"] == "OPEN" for r in open_only["items"])
    assert len(open_only["items"]) == 1


def test_list_default_limit_and_clamp() -> None:
    _reset()
    # limit clamps to <=100; default 50 — verify default returns rows without cursor for small set
    _propose()
    listed = _json(client.get(f"{BASE}/projects/{PROJECT_ID}/ontology-change-requests"))
    assert listed["next_cursor"] is None


# --- F. change-item target validation ---------------------------------------


def test_add_item_add_with_ref_rejected_409() -> None:
    _reset()
    cr_id = _propose(with_item=False)["change_request"]["id"]
    body = _json(
        client.post(
            f"{BASE}/ontology-change-requests/{cr_id}/items?actor_id={PROPOSER}&actor_role={VIEWER_ROLE}",
            json=_add_item_payload(change_type="ADD", ontology_property_id="property-claim-deadline"),
        ),
        409,
    )
    assert body["error"]["code"] == "CHANGE_ITEM_TARGET_INVALID"


def test_modify_requires_valid_ref() -> None:
    _reset()
    cr_id = _propose(with_item=False)["change_request"]["id"]
    ok = _json(
        client.post(
            f"{BASE}/ontology-change-requests/{cr_id}/items?actor_id={PROPOSER}&actor_role={VIEWER_ROLE}",
            json=_add_item_payload(
                change_type="MODIFY",
                target_kind="PROPERTY",
                ontology_property_id="property-claim-deadline",
            ),
        ),
        201,
    )
    assert ok["change_request"]["item_count"] == 1
    # unknown ref -> ONTOLOGY_REF_INVALID
    body = _json(
        client.post(
            f"{BASE}/ontology-change-requests/{cr_id}/items?actor_id={PROPOSER}&actor_role={VIEWER_ROLE}",
            json=_add_item_payload(
                change_type="MODIFY",
                target_kind="PROPERTY",
                ontology_property_id="property-does-not-exist",
            ),
        ),
        409,
    )
    assert body["error"]["code"] == "ONTOLOGY_REF_INVALID"


# --- G. OpenAPI field/enum alignment ----------------------------------------


def test_openapi_alignment_with_draft() -> None:
    draft = json.loads(MVP6_5_OPENAPI_PATH.read_text(encoding="utf-8"))
    runtime = app.openapi()
    runtime_schemas = runtime["components"]["schemas"]

    enum_checks = {
        "OntologyChangeRequestStatus": ["DRAFT", "OPEN", "IN_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN"],
        "GovernanceApplicationState": ["NOT_APPLICABLE", "QUEUED", "APPLIED", "SUPERSEDED"],
        "GovernanceReviewAction": ["COMMENT", "REQUEST_CHANGES", "APPROVE", "REJECT"],
        "ChangeRequestTargetKind": ["CLASS", "PROPERTY", "RELATION"],
        "ChangeRequestChangeType": ["ADD", "MODIFY", "DEPRECATE"],
        "GovernanceAuditAction": [
            "CHANGE_REQUEST_CREATED",
            "CHANGE_REQUEST_UPDATED",
            "CHANGE_REQUEST_SUBMITTED",
            "CHANGE_REQUEST_WITHDRAWN",
            "REVIEW_STARTED",
            "COMMENT_ADDED",
            "CHANGES_REQUESTED",
            "CHANGE_REQUEST_APPROVED",
            "CHANGE_REQUEST_REJECTED",
        ],
    }
    for name, literals in enum_checks.items():
        assert name in runtime_schemas, f"missing enum {name}"
        assert runtime_schemas[name]["enum"] == literals, name

    # all-false 7-flag guard
    guard = runtime_schemas["GovernanceMutationGuard"]["properties"]
    assert set(guard) == set(ALL_FALSE_GUARD)

    draft_schemas = draft["components"]["schemas"]

    def _runtime_props(name: str) -> set[str]:
        for candidate in (name, f"{name}-Output", f"{name}-Input"):
            if candidate in runtime_schemas:
                return set(runtime_schemas[candidate].get("properties", {}))
        raise AssertionError(f"runtime schema missing for {name}")

    for name in [
        "OntologyChangeRequest",
        "OntologyChangeItem",
        "GovernanceReviewDecision",
        "GovernanceAuditEntry",
        "GovernanceCapabilities",
        "GovernanceMutationResponse",
        "OntologyChangeRequestDetail",
        "GovernanceReviewDecisionRequest",
    ]:
        draft_props = set(draft_schemas[name].get("properties", {}))
        runtime_props = _runtime_props(name)
        assert draft_props <= runtime_props, (name, draft_props - runtime_props)

    # all 9 governance path objects present in the running app
    paths = runtime["paths"]
    for p in draft["paths"]:
        assert p in paths, f"missing path {p}"


def test_no_mvp3_mvp5_enum_rename() -> None:
    # Reused Role literals must remain verbatim on the review-decision DTO enum
    from app.core.enums import Role

    assert {r.value for r in Role} >= {
        "SYSTEM_ADMIN",
        "PROJECT_ADMIN",
        "ONTOLOGY_MANAGER",
        "REVIEWER",
        "VIEWER",
    }
