import json
import os
from pathlib import Path
from typing import Any

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["LOCAL_STORAGE_PATH"] = "/private/tmp/ontology-platform-backend-test-storage"

from fastapi.testclient import TestClient  # noqa: E402

from app.core.enums import OntologyElementStatus, OntologyVersionStatus  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402
from app.modules.governance import application  # noqa: E402
from app.modules.governance import service  # noqa: E402
from scripts.seed_mvp3 import seed_mvp3  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parents[3]
MVP6_6_OPENAPI_PATH = REPO_ROOT / "docs/api/openapi-mvp6-6-draft.json"

BASE = "/api/v1"
PROJECT_ID = "project-corp-knowledge"
DRAFT_VERSION_ID = "ontology-v7"
PUBLISHED_VERSION_ID = "ontology-v1"

PROPOSER = "user-analyst-3"
MANAGER = "user-ontology-manager-1"
MANAGER_ROLE = "ONTOLOGY_MANAGER"
REVIEWER_ROLE = "REVIEWER"
VIEWER_ROLE = "VIEWER"

APPLY_GUARD_TRUE = {
    "ontology_draft_mutated": True,
    "published_graph_mutated": False,
    "candidate_graph_mutated": False,
    "prompt_version_mutated": False,
    "publish_job_started": False,
    "extraction_job_started": False,
    "evaluation_run_started": False,
}
ALL_FALSE_GUARD = {
    "ontology_definition_mutated": False,
    "published_graph_mutated": False,
    "candidate_graph_mutated": False,
    "prompt_version_mutated": False,
    "publish_job_started": False,
    "extraction_job_started": False,
    "change_auto_applied": False,
}


def _json(response: Any, expected_status: int = 200) -> Any:
    assert response.status_code == expected_status, response.text
    return response.json()


def _reset() -> None:
    service.reset_runtime_store()
    seed_mvp3(reset=True)


def _add_item(**overrides: Any) -> dict:
    payload = {
        "target_kind": "PROPERTY",
        "change_type": "ADD",
        "ontology_version_id": DRAFT_VERSION_ID,
        "proposed_change": {"name": "claim_filing_deadline"},
    }
    payload.update(overrides)
    return payload


def _propose(items: list[dict] | None = None, actor_id: str = PROPOSER) -> str:
    body = {
        "title": "거버넌스 적용 테스트",
        "summary": "적용 검증",
        "ontology_version_id": DRAFT_VERSION_ID,
        "items": items if items is not None else [_add_item()],
    }
    resp = client.post(
        f"{BASE}/projects/{PROJECT_ID}/ontology-change-requests"
        f"?actor_id={actor_id}&actor_role={VIEWER_ROLE}",
        json=body,
    )
    return _json(resp, 201)["change_request"]["id"]


def _submit(cr_id: str, actor_id: str = PROPOSER) -> None:
    _json(
        client.post(
            f"{BASE}/ontology-change-requests/{cr_id}/submit"
            f"?actor_id={actor_id}&actor_role={VIEWER_ROLE}"
        )
    )


def _approve(cr_id: str) -> None:
    _json(
        client.post(
            f"{BASE}/ontology-change-requests/{cr_id}/reviews"
            f"?actor_id={MANAGER}&actor_role={MANAGER_ROLE}",
            json={"action": "APPROVE", "reason": "승인"},
        )
    )


def _approved_request(items: list[dict] | None = None) -> str:
    cr_id = _propose(items)
    _submit(cr_id)
    _approve(cr_id)
    return cr_id


def _status(cr_id: str, actor_role: str = MANAGER_ROLE, **q: Any) -> dict:
    query = f"?actor_id={MANAGER}&actor_role={actor_role}"
    for k, v in q.items():
        query += f"&{k}={v}"
    return _json(client.get(f"{BASE}/ontology-change-requests/{cr_id}/application-status{query}"))


def _apply(cr_id: str, actor_id: str = MANAGER, role: str = MANAGER_ROLE, body: dict | None = None) -> Any:
    return client.post(
        f"{BASE}/ontology-change-requests/{cr_id}/apply?actor_id={actor_id}&actor_role={role}",
        json=body or {},
    )


# --- A. pre-check advisory (no state change) --------------------------------


def test_precheck_is_advisory_no_state_change() -> None:
    _reset()
    cr_id = _approved_request(
        [_add_item(change_type="DEPRECATE", target_kind="RELATION",
                   ontology_relation_id="relation-has-clause")]
    )
    # Make the target stale so would_supersede=true, then confirm the pre-check
    # NEVER flips QUEUED->SUPERSEDED.
    version = application._versions[DRAFT_VERSION_ID]
    from app.modules.governance.schemas import ChangeRequestTargetKind
    version.elements[(ChangeRequestTargetKind.RELATION, "relation-has-clause")].status = (
        OntologyElementStatus.ARCHIVED
    )
    st = _status(cr_id)
    assert st["would_supersede"] is True
    assert st["item_previews"][0]["stale"] is True
    assert st["item_previews"][0]["stale_reason"] == "TARGET_ELEMENT_ARCHIVED"
    assert st["mutation_guard"] == ALL_FALSE_GUARD
    # application_state remains QUEUED — pre-check did not mutate.
    detail = _json(
        client.get(f"{BASE}/ontology-change-requests/{cr_id}?actor_id={MANAGER}&actor_role={MANAGER_ROLE}")
    )
    assert detail["change_request"]["application_state"] == "QUEUED"


def test_precheck_applicable_and_capabilities() -> None:
    _reset()
    cr_id = _approved_request()
    st = _status(cr_id)
    assert st["status"] == "APPROVED"
    assert st["application_state"] == "QUEUED"
    assert st["target_ontology_version_id"] == DRAFT_VERSION_ID
    assert st["target_version_status"] == "DRAFT"
    assert st["target_is_draft"] is True
    assert st["applicable"] is True
    assert st["would_supersede"] is False
    assert st["capabilities"] == {"can_view": True, "can_apply": True}
    # viewer can view but cannot apply
    st_viewer = _status(cr_id, actor_role=VIEWER_ROLE)
    assert st_viewer["capabilities"] == {"can_view": True, "can_apply": False}


# --- B. apply happy path (one-true-flag guard, APPLIED) ---------------------


def test_apply_happy_path_add_modify_deprecate() -> None:
    _reset()
    cr_id = _approved_request([
        _add_item(change_type="ADD", target_kind="PROPERTY"),
        _add_item(change_type="MODIFY", target_kind="CLASS",
                  ontology_class_id="class-clause",
                  proposed_change={"label": "조항v2"}),
        _add_item(change_type="DEPRECATE", target_kind="RELATION",
                  ontology_relation_id="relation-extra"),
    ])
    resp = _json(_apply(cr_id, body={"note": "draft 적용"}))
    assert resp["application_state"] == "APPLIED"
    assert resp["target_ontology_version_id"] == DRAFT_VERSION_ID
    assert len(resp["applied_item_ids"]) == 3
    assert resp["mutation_guard"] == APPLY_GUARD_TRUE
    assert resp["capabilities"] == {"can_view": True, "can_apply": False}
    assert resp["audit_entry"]["action"] == "CHANGE_REQUEST_APPLIED"
    assert resp["audit_entry"]["after_application_state"] == "APPLIED"
    # before/after refs: ADD before null, DEPRECATE after ARCHIVED
    refs = {r["change_type"]: r for r in resp["before_after_refs"]}
    assert refs["ADD"]["before"] is None
    assert refs["ADD"]["after"]["status"] == "DRAFT"
    assert refs["DEPRECATE"]["after"]["status"] == "ARCHIVED"
    assert refs["MODIFY"]["after"]["status"] == "ACTIVE"

    # data-level: draft element archived, never DELETED
    from app.modules.governance.schemas import ChangeRequestTargetKind
    version = application._versions[DRAFT_VERSION_ID]
    assert version.elements[(ChangeRequestTargetKind.RELATION, "relation-extra")].status == (
        OntologyElementStatus.ARCHIVED
    )


def test_apply_only_mutates_draft_version_status_unchanged() -> None:
    _reset()
    cr_id = _approved_request()
    version = application._versions[DRAFT_VERSION_ID]
    assert version.status == OntologyVersionStatus.DRAFT
    _json(_apply(cr_id))
    # apply never cuts/publishes a version — the version stays DRAFT.
    assert version.status == OntologyVersionStatus.DRAFT
    # the published version was never touched.
    assert application._versions[PUBLISHED_VERSION_ID].status == OntologyVersionStatus.PUBLISHED


# --- data-level published/candidate/prompt/publish/extraction/eval unchanged -


def test_apply_leaves_all_other_surfaces_unchanged() -> None:
    _reset()
    from app.db.session import SessionLocal
    from sqlalchemy import text as _text

    tables = [
        "published_entities",
        "published_relations",
        "candidates",
        "prompts",
        "publish_jobs",
        "extraction_jobs",
    ]

    def _counts() -> dict[str, int]:
        out: dict[str, int] = {}
        with SessionLocal() as db:
            for t in tables:
                try:
                    out[t] = db.execute(_text(f"SELECT COUNT(*) FROM {t}")).scalar_one()
                except Exception:
                    out[t] = -1  # table not present in this schema build
        return out

    before = _counts()
    cr_id = _approved_request([
        _add_item(change_type="ADD"),
        _add_item(change_type="DEPRECATE", target_kind="RELATION",
                  ontology_relation_id="relation-has-clause"),
    ])
    resp = _json(_apply(cr_id))
    after = _counts()
    assert before == after, (before, after)
    # exactly one true flag on the guard
    assert sum(1 for v in resp["mutation_guard"].values() if v is True) == 1
    assert resp["mutation_guard"]["ontology_draft_mutated"] is True


# --- staleness paths -> 409 SUPERSEDED + nothing mutated + all-or-nothing ----


def _make_stale_and_apply(cr_id: str, mutate) -> Any:
    mutate()
    return _apply(cr_id)


def test_staleness_target_element_archived_supersedes() -> None:
    _reset()
    from app.modules.governance.schemas import ChangeRequestTargetKind
    cr_id = _approved_request([
        _add_item(change_type="MODIFY", target_kind="CLASS", ontology_class_id="class-clause"),
    ])
    version = application._versions[DRAFT_VERSION_ID]

    def _mutate() -> None:
        version.elements[(ChangeRequestTargetKind.CLASS, "class-clause")].status = (
            OntologyElementStatus.ARCHIVED
        )

    body = _json(_make_stale_and_apply(cr_id, _mutate), 409)
    assert body["error"]["code"] == "CHANGE_REQUEST_SUPERSEDED"
    detail = _json(
        client.get(f"{BASE}/ontology-change-requests/{cr_id}?actor_id={MANAGER}&actor_role={MANAGER_ROLE}")
    )
    assert detail["change_request"]["application_state"] == "SUPERSEDED"


def test_staleness_target_element_deleted_supersedes_nothing_mutated() -> None:
    _reset()
    from app.modules.governance.schemas import ChangeRequestTargetKind
    cr_id = _approved_request([
        _add_item(change_type="ADD"),  # a fresh item that would apply if not all-or-nothing
        _add_item(change_type="DEPRECATE", target_kind="RELATION",
                  ontology_relation_id="relation-has-clause"),
    ])
    version = application._versions[DRAFT_VERSION_ID]
    add_keys_before = set(version.elements.keys())

    def _mutate() -> None:
        del version.elements[(ChangeRequestTargetKind.RELATION, "relation-has-clause")]

    add_keys_before.discard((ChangeRequestTargetKind.RELATION, "relation-has-clause"))
    body = _json(_make_stale_and_apply(cr_id, _mutate), 409)
    assert body["error"]["code"] == "CHANGE_REQUEST_SUPERSEDED"
    # all-or-nothing: the fresh ADD item did NOT create a new element.
    assert set(version.elements.keys()) == add_keys_before


def test_staleness_target_element_modified_supersedes() -> None:
    _reset()
    from app.modules.governance.schemas import ChangeRequestTargetKind
    cr_id = _approved_request([
        _add_item(change_type="MODIFY", target_kind="CLASS", ontology_class_id="class-clause"),
    ])
    version = application._versions[DRAFT_VERSION_ID]

    def _mutate() -> None:
        version.elements[(ChangeRequestTargetKind.CLASS, "class-clause")].payload = {"changed": True}

    body = _json(_make_stale_and_apply(cr_id, _mutate), 409)
    assert body["error"]["code"] == "CHANGE_REQUEST_SUPERSEDED"
    assert body["error"]["details"]["stale_items"][0]["stale_reason"] == "TARGET_ELEMENT_MODIFIED"


def test_staleness_add_version_context_diverged_supersedes() -> None:
    _reset()
    # ADD item whose ontology_version_id no longer resolves to the target draft.
    cr_id = _approved_request([_add_item(change_type="ADD")])
    body = _json(
        _apply(cr_id, body={"target_ontology_version_id": PUBLISHED_VERSION_ID}), 409
    )
    # published target is not DRAFT -> APPLY_TARGET_NOT_DRAFT precedes staleness
    assert body["error"]["code"] == "APPLY_TARGET_NOT_DRAFT"


def test_add_version_context_diverged_via_explicit_second_draft() -> None:
    _reset()
    cr_id = _approved_request([_add_item(change_type="ADD", ontology_version_id=DRAFT_VERSION_ID)])
    # introduce a second DRAFT version and target it explicitly; the ADD's
    # captured version context (ontology-v7) diverges from the applied target.
    application._versions["ontology-v9"] = application._OntologyVersion(
        "ontology-v9", PROJECT_ID, OntologyVersionStatus.DRAFT
    )
    body = _json(_apply(cr_id, body={"target_ontology_version_id": "ontology-v9"}), 409)
    assert body["error"]["code"] == "CHANGE_REQUEST_SUPERSEDED"
    assert body["error"]["details"]["stale_items"][0]["stale_reason"] == "VERSION_CONTEXT_DIVERGED"


# --- target 409s (no-draft / not-draft / not-found) -------------------------


def test_apply_target_not_found_404() -> None:
    _reset()
    cr_id = _approved_request()
    body = _json(_apply(cr_id, body={"target_ontology_version_id": "does-not-exist"}), 404)
    assert body["error"]["code"] == "ONTOLOGY_VERSION_NOT_FOUND"


def test_apply_target_not_draft_409() -> None:
    _reset()
    cr_id = _approved_request()
    body = _json(_apply(cr_id, body={"target_ontology_version_id": PUBLISHED_VERSION_ID}), 409)
    assert body["error"]["code"] == "APPLY_TARGET_NOT_DRAFT"


def test_apply_no_current_draft_409() -> None:
    _reset()
    cr_id = _approved_request()
    # Remove the DRAFT version -> zero drafts -> 409 (never auto-create).
    application._versions[DRAFT_VERSION_ID].status = OntologyVersionStatus.ARCHIVED
    body = _json(_apply(cr_id), 409)
    assert body["error"]["code"] == "APPLY_TARGET_NOT_DRAFT"


# --- idempotency 409s -------------------------------------------------------


def test_idempotency_already_applied_409() -> None:
    _reset()
    cr_id = _approved_request()
    _json(_apply(cr_id))
    body = _json(_apply(cr_id), 409)
    assert body["error"]["code"] == "CHANGE_ALREADY_APPLIED"


def test_not_applicable_when_not_approved_409() -> None:
    _reset()
    cr_id = _propose()
    _submit(cr_id)  # OPEN, not APPROVED
    body = _json(_apply(cr_id), 409)
    assert body["error"]["code"] == "CHANGE_NOT_APPLICABLE"


def test_superseded_is_terminal_not_applicable_again() -> None:
    _reset()
    from app.modules.governance.schemas import ChangeRequestTargetKind
    cr_id = _approved_request([
        _add_item(change_type="MODIFY", target_kind="CLASS", ontology_class_id="class-clause"),
    ])
    application._versions[DRAFT_VERSION_ID].elements[
        (ChangeRequestTargetKind.CLASS, "class-clause")
    ].status = OntologyElementStatus.ARCHIVED
    _json(_apply(cr_id), 409)  # -> SUPERSEDED
    body = _json(_apply(cr_id), 409)  # terminal
    assert body["error"]["code"] == "CHANGE_NOT_APPLICABLE"


# --- authz 403 --------------------------------------------------------------


def test_apply_authz_403_for_non_approver() -> None:
    _reset()
    cr_id = _approved_request()
    body = _json(_apply(cr_id, actor_id="user-r", role=REVIEWER_ROLE), 403)
    assert body["error"]["code"] == "PERMISSION_DENIED"
    # nothing mutated: still QUEUED
    detail = _json(
        client.get(f"{BASE}/ontology-change-requests/{cr_id}?actor_id={MANAGER}&actor_role={MANAGER_ROLE}")
    )
    assert detail["change_request"]["application_state"] == "QUEUED"


def test_applier_may_differ_from_approver() -> None:
    _reset()
    cr_id = _approved_request()  # approved by MANAGER
    # a DIFFERENT approver-role actor applies -> allowed
    resp = _json(_apply(cr_id, actor_id="user-ontology-manager-2", role=MANAGER_ROLE))
    assert resp["application_state"] == "APPLIED"
    assert resp["audit_entry"]["actor_id"] == "user-ontology-manager-2"


# --- audit ------------------------------------------------------------------


def test_application_audit_records_applied_and_superseded() -> None:
    _reset()
    cr_id = _approved_request()
    _json(_apply(cr_id, body={"note": "적용"}))
    audit = _json(client.get(f"{BASE}/ontology-change-requests/{cr_id}/application-audit"))
    assert audit["total_count"] == 1
    entry = audit["items"][0]
    assert entry["action"] == "CHANGE_REQUEST_APPLIED"
    assert entry["target_ontology_version_id"] == DRAFT_VERSION_ID
    assert entry["note"] == "적용"
    assert entry["before_application_state"] == "QUEUED"
    assert entry["after_application_state"] == "APPLIED"
    # action filter
    filtered = _json(
        client.get(
            f"{BASE}/ontology-change-requests/{cr_id}/application-audit?action=CHANGE_REQUEST_SUPERSEDED"
        )
    )
    assert filtered["total_count"] == 0


def test_superseded_audit_has_stale_detail_and_empty_refs() -> None:
    _reset()
    from app.modules.governance.schemas import ChangeRequestTargetKind
    cr_id = _approved_request([
        _add_item(change_type="DEPRECATE", target_kind="RELATION",
                  ontology_relation_id="relation-has-clause"),
    ])
    del application._versions[DRAFT_VERSION_ID].elements[
        (ChangeRequestTargetKind.RELATION, "relation-has-clause")
    ]
    _json(_apply(cr_id), 409)
    audit = _json(client.get(f"{BASE}/ontology-change-requests/{cr_id}/application-audit"))
    entry = audit["items"][0]
    assert entry["action"] == "CHANGE_REQUEST_SUPERSEDED"
    assert entry["after_application_state"] == "SUPERSEDED"
    assert entry["before_after_refs"] == []
    assert entry["stale_detail"]["stale_items"][0]["stale_reason"] == "TARGET_ELEMENT_DELETED"


# --- OpenAPI field/enum alignment -------------------------------------------


def test_openapi_alignment_with_draft() -> None:
    draft = json.loads(MVP6_6_OPENAPI_PATH.read_text(encoding="utf-8"))
    runtime = app.openapi()
    runtime_schemas = runtime["components"]["schemas"]
    draft_schemas = draft["components"]["schemas"]

    # all 3 MVP6.6 paths present in the running app
    for p in draft["paths"]:
        assert p in runtime["paths"], f"missing path {p}"

    # enum literals match verbatim
    for name, literals in {
        "GovernanceApplicationAuditAction": ["CHANGE_REQUEST_APPLIED", "CHANGE_REQUEST_SUPERSEDED"],
        "GovernanceApplicationState": ["NOT_APPLICABLE", "QUEUED", "APPLIED", "SUPERSEDED"],
        "OntologyElementStatus": ["DRAFT", "ACTIVE", "ARCHIVED", "DELETED"],
        "OntologyVersionStatus": ["DRAFT", "PUBLISHED", "ARCHIVED"],
    }.items():
        assert runtime_schemas[name]["enum"] == literals, name

    # the redefined one-true-flag guard shape
    guard = runtime_schemas["GovernanceApplicationMutationGuard"]["properties"]
    assert set(guard) == set(APPLY_GUARD_TRUE)

    def _runtime_props(name: str) -> set[str]:
        for candidate in (name, f"{name}-Output", f"{name}-Input"):
            if candidate in runtime_schemas:
                return set(runtime_schemas[candidate].get("properties", {}))
        raise AssertionError(f"runtime schema missing for {name}")

    for name in [
        "GovernanceApplicationStatusResponse",
        "GovernanceApplyRequest",
        "GovernanceApplyResponse",
        "GovernanceApplicationAuditEntry",
        "ApplicationItemPreview",
        "ApplicationBeforeAfterRef",
        "OntologyElementRef",
        "ApplicationCapabilities",
        "GovernanceApplicationAuditListResponse",
    ]:
        draft_props = set(draft_schemas[name].get("properties", {}))
        assert draft_props <= _runtime_props(name), (name, draft_props - _runtime_props(name))
