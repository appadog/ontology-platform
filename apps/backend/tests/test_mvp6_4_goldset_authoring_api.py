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
from app.modules.evaluation import service as evaluation_service  # noqa: E402
from app.modules.goldset_authoring import service  # noqa: E402
from scripts.seed_mvp3 import seed_mvp3  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parents[3]
MVP6_4_OPENAPI_PATH = REPO_ROOT / "docs/api/openapi-mvp6-4-draft.json"

PROJECT_ID = "project-corp-knowledge"
DATASET_ID = f"{PROJECT_ID}-authoring-dataset"
ENTITY_ID = f"{DATASET_ID}-gold-entity-1"
RELATION_ID = f"{DATASET_ID}-gold-relation-1"
ACTIVE_REV = f"{DATASET_ID}-v2"
FROZEN_REV = f"{DATASET_ID}-v1"
PINNED_RUN = f"{PROJECT_ID}-eval-run-pinned-v1"

ALL_FALSE_GUARD = {
    "published_graph_mutated": False,
    "candidate_graph_mutated": False,
    "prompt_version_mutated": False,
    "ontology_definition_mutated": False,
    "extraction_job_started": False,
    "evaluation_run_started": False,
    "prior_run_pin_rewritten": False,
}


def _json(response: Any, expected_status: int = 200) -> Any:
    assert response.status_code == expected_status, response.text
    return response.json()


def _reset() -> None:
    service.reset_runtime_store()
    evaluation_service.reset_runtime_store()
    seed_mvp3(reset=True)


def _assert_guard(payload: dict) -> None:
    assert payload["mutation_guard"] == ALL_FALSE_GUARD


# --- A. edit / archive / restore -------------------------------------------


def test_edit_archive_restore_gold_entity() -> None:
    _reset()
    edited = _json(
        client.patch(
            f"/api/v1/evaluation-datasets/{DATASET_ID}/gold-entities/{ENTITY_ID}",
            json={"label": "보험금 청구 기한", "reason": "glossary v4"},
        )
    )
    assert edited["gold_entity"]["label"] == "보험금 청구 기한"
    assert edited["gold_entity"]["status"] == "ACTIVE"
    assert edited["audit_entry"]["action"] == "EDIT"
    assert edited["audit_entry"]["after"]["label"] == "보험금 청구 기한"
    _assert_guard(edited)

    archived = _json(
        client.post(
            f"/api/v1/evaluation-datasets/{DATASET_ID}/gold-entities/{ENTITY_ID}/archive",
            json={"reason": "stale"},
        )
    )
    assert archived["gold_entity"]["status"] == "ARCHIVED"
    assert archived["gold_entity"]["archived_at"] is not None
    assert archived["audit_entry"]["action"] == "ARCHIVE"

    # not hard-deleted: still retrievable in overview counts
    overview = _json(
        client.get(f"/api/v1/projects/{PROJECT_ID}/evaluation-datasets/{DATASET_ID}/authoring")
    )
    assert overview["gold_status_counts"]["ARCHIVED"] >= 1

    restored = _json(
        client.post(
            f"/api/v1/evaluation-datasets/{DATASET_ID}/gold-entities/{ENTITY_ID}/restore"
        )
    )
    assert restored["gold_entity"]["status"] == "ACTIVE"
    assert restored["audit_entry"]["action"] == "RESTORE"


def test_restore_non_archived_rejected() -> None:
    _reset()
    resp = client.post(
        f"/api/v1/evaluation-datasets/{DATASET_ID}/gold-relations/{RELATION_ID}/restore"
    )
    body = _json(resp, 409)
    assert body["error"]["code"] == "GOLD_ITEM_INVALID_TRANSITION"


def test_edit_gold_relation() -> None:
    _reset()
    edited = _json(
        client.patch(
            f"/api/v1/evaluation-datasets/{DATASET_ID}/gold-relations/{RELATION_ID}",
            json={"ontology_relation_id": "relation-extra"},
        )
    )
    assert edited["gold_relation"]["ontology_relation_id"] == "relation-extra"
    _assert_guard(edited)


# --- B. GoldEvidence CRUD ---------------------------------------------------


def test_gold_evidence_crud() -> None:
    _reset()
    attached = _json(
        client.post(
            f"/api/v1/evaluation-datasets/{DATASET_ID}/gold-evidence",
            json={
                "gold_entity_id": ENTITY_ID,
                "sample_id": f"{DATASET_ID}-sample-1",
                "source_id": "doc-12",
                "locator": "p.3/para.2",
                "offset_start": 1,
                "offset_end": 9,
                "quote": "evidence quote",
            },
        ),
        201,
    )
    ev = attached["gold_evidence"]
    assert ev["gold_entity_id"] == ENTITY_ID
    assert ev["gold_relation_id"] is None
    assert ev["status"] == "ACTIVE"
    # GoldEvidenceRef fields preserved
    for field in ("sample_id", "source_id", "locator", "offset_start", "offset_end", "quote"):
        assert field in ev
    assert attached["audit_entry"]["action"] == "EVIDENCE_ATTACH"
    _assert_guard(attached)
    eid = ev["id"]

    listed = _json(client.get(f"/api/v1/evaluation-datasets/{DATASET_ID}/gold-evidence"))
    assert any(e["id"] == eid for e in listed["items"])

    got = _json(client.get(f"/api/v1/gold-evidence/{eid}"))
    assert got["id"] == eid

    edited = _json(
        client.patch(f"/api/v1/gold-evidence/{eid}", json={"quote": "updated"})
    )
    assert edited["gold_evidence"]["quote"] == "updated"
    assert edited["audit_entry"]["action"] == "EVIDENCE_EDIT"

    archived = _json(client.post(f"/api/v1/gold-evidence/{eid}/archive"))
    assert archived["gold_evidence"]["status"] == "ARCHIVED"
    # not hard-deleted
    assert _json(client.get(f"/api/v1/gold-evidence/{eid}"))["status"] == "ARCHIVED"


def test_gold_evidence_target_invalid() -> None:
    _reset()
    body = _json(
        client.post(
            f"/api/v1/evaluation-datasets/{DATASET_ID}/gold-evidence",
            json={
                "gold_entity_id": ENTITY_ID,
                "gold_relation_id": RELATION_ID,
                "sample_id": f"{DATASET_ID}-sample-1",
            },
        ),
        400,
    )
    assert body["error"]["code"] == "GOLD_EVIDENCE_TARGET_INVALID"


# --- C. revisions: cut / activate + freeze-on-pin --------------------------


def test_cut_draft_then_activate_freezes_prior() -> None:
    _reset()
    cut = _json(
        client.post(
            f"/api/v1/evaluation-datasets/{DATASET_ID}/revisions",
            json={"note": "Q3 re-review", "activate": False},
        ),
        201,
    )
    assert cut["revision"]["status"] == "DRAFT"
    assert cut["revision"]["is_immutable"] is False
    assert cut["frozen_revision_id"] is None
    new_rev = cut["revision"]["id"]
    _assert_guard(cut)

    activated = _json(client.post(f"/api/v1/dataset-revisions/{new_rev}/activate"), 200)
    assert activated["revision"]["status"] == "ACTIVE"
    # prior ACTIVE (v2) frozen with NEWER_REVISION_ACTIVATED
    assert activated["frozen_revision_id"] == ACTIVE_REV
    prior = _json(client.get(f"/api/v1/dataset-revisions/{ACTIVE_REV}"))
    assert prior["status"] == "FROZEN"
    assert prior["frozen_reason"] == "NEWER_REVISION_ACTIVATED"
    assert prior["is_immutable"] is True
    # at most one ACTIVE
    revs = _json(client.get(f"/api/v1/evaluation-datasets/{DATASET_ID}/revisions"))
    actives = [r for r in revs["items"] if r["status"] == "ACTIVE"]
    assert len(actives) == 1


def test_activate_frozen_rejected() -> None:
    _reset()
    body = _json(client.post(f"/api/v1/dataset-revisions/{FROZEN_REV}/activate"), 409)
    assert body["error"]["code"] == "REVISION_FROZEN"


def test_activate_active_rejected_not_draft() -> None:
    _reset()
    body = _json(client.post(f"/api/v1/dataset-revisions/{ACTIVE_REV}/activate"), 409)
    assert body["error"]["code"] == "REVISION_NOT_DRAFT"


def test_freeze_on_pin_transition_and_vacated_active() -> None:
    _reset()
    # v2 starts ACTIVE
    assert _json(client.get(f"/api/v1/dataset-revisions/{ACTIVE_REV}"))["status"] == "ACTIVE"
    # a NEW run pins the ACTIVE revision -> transitions to FROZEN(PINNED_BY_RUN)
    service.pin_run_to_revision(f"{PROJECT_ID}-eval-run-new", ACTIVE_REV)
    frozen = _json(client.get(f"/api/v1/dataset-revisions/{ACTIVE_REV}"))
    assert frozen["status"] == "FROZEN"
    assert frozen["frozen_reason"] == "PINNED_BY_RUN"
    assert frozen["is_immutable"] is True
    assert frozen["pinned_run_count"] >= 1
    # is_immutable == status in {FROZEN, ARCHIVED}
    assert frozen["is_immutable"] == (frozen["status"] in {"FROZEN", "ARCHIVED"})
    # ACTIVE slot vacated
    overview = _json(
        client.get(f"/api/v1/projects/{PROJECT_ID}/evaluation-datasets/{DATASET_ID}/authoring")
    )
    assert overview["active_revision"] is None
    assert overview["dataset"]["active_version_id"] is None


def test_frozen_revision_item_mutation_409() -> None:
    _reset()
    # entity belongs to v2; pin v2 to freeze it
    service.pin_run_to_revision(f"{PROJECT_ID}-eval-run-new", ACTIVE_REV)
    body = _json(
        client.patch(
            f"/api/v1/evaluation-datasets/{DATASET_ID}/gold-entities/{ENTITY_ID}",
            json={"label": "blocked"},
        ),
        409,
    )
    assert body["error"]["code"] == "GOLD_ITEM_IMMUTABLE"


# --- run-pin reproducibility (never rewritten) ------------------------------


def test_run_pin_never_rewritten() -> None:
    _reset()
    assert service.run_pin(PINNED_RUN) == FROZEN_REV
    # author against the dataset: cut + activate a new revision
    cut = _json(
        client.post(
            f"/api/v1/evaluation-datasets/{DATASET_ID}/revisions",
            json={"activate": True},
        ),
        201,
    )
    # the existing run still resolves its exact snapshot
    assert service.run_pin(PINNED_RUN) == FROZEN_REV
    assert _json(client.get(f"/api/v1/dataset-revisions/{FROZEN_REV}"))["status"] == "FROZEN"
    _assert_guard(cut)
    # attempting to rewrite an existing pin is rejected
    import pytest

    from app.core.errors import ApiException

    with pytest.raises(ApiException):
        service.pin_run_to_revision(PINNED_RUN, cut["revision"]["id"])
    assert service.run_pin(PINNED_RUN) == FROZEN_REV


# --- D. export / import -----------------------------------------------------


def _build_bundle(**overrides: Any) -> dict:
    _reset()
    bundle = _json(client.get(f"/api/v1/dataset-revisions/{ACTIVE_REV}/export"))
    bundle.update(overrides)
    return bundle


def test_export_bundle_shape() -> None:
    _reset()
    bundle = _json(client.get(f"/api/v1/dataset-revisions/{ACTIVE_REV}/export"))
    assert bundle["bundle_version"] == "gold-set-bundle/1.0"
    assert bundle["source_revision_id"] == ACTIVE_REV
    for key in ("samples", "gold_entities", "gold_relations", "gold_evidence"):
        assert key in bundle
    # no published/candidate/prompt leakage keys
    assert "candidates" not in bundle
    assert "prompts" not in bundle
    _assert_guard(bundle)


def _fresh_ids(bundle: dict) -> dict:
    # Give the bundle gold-item ids that do not collide with the target store,
    # producing a COMPATIBLE dry-run rather than a CONFLICT.
    for i, e in enumerate(bundle["gold_entities"]):
        e["id"] = f"imported-entity-{i}"
    for i, r in enumerate(bundle["gold_relations"]):
        r["id"] = f"imported-relation-{i}"
    return bundle


def test_import_dry_run_compatible_then_confirm() -> None:
    bundle = _fresh_ids(_build_bundle())
    report = _json(
        client.post(
            f"/api/v1/projects/{PROJECT_ID}/gold-set-imports",
            json={"bundle": bundle},
        )
    )
    assert report["compatibility"] == "COMPATIBLE"
    assert report["blocking"] is False
    assert set(report["allowed_strategies"]) == {
        "CREATE_NEW_DATASET",
        "NEW_REVISION_OF_EXISTING",
    }
    _assert_guard(report)
    import_id = report["import_id"]

    confirmed = _json(
        client.post(
            f"/api/v1/projects/{PROJECT_ID}/gold-set-imports/{import_id}/confirm",
            json={"strategy": "CREATE_NEW_DATASET"},
        ),
        201,
    )
    assert confirmed["strategy"] == "CREATE_NEW_DATASET"
    assert confirmed["created_revision_status"] == "DRAFT"
    assert confirmed["audit_entry"]["action"] == "IMPORT"
    _assert_guard(confirmed)


def test_import_warning_requires_ack() -> None:
    # sample without source_segment_id -> WARNING
    bundle = _fresh_ids(_build_bundle())
    for s in bundle["samples"]:
        s["source_segment_id"] = None
    report = _json(
        client.post(
            f"/api/v1/projects/{PROJECT_ID}/gold-set-imports",
            json={"bundle": bundle},
        )
    )
    assert report["compatibility"] == "WARNING"
    import_id = report["import_id"]
    # confirm without ack -> 409
    body = _json(
        client.post(
            f"/api/v1/projects/{PROJECT_ID}/gold-set-imports/{import_id}/confirm",
            json={"strategy": "CREATE_NEW_DATASET"},
        ),
        409,
    )
    assert body["error"]["code"] == "IMPORT_WARNINGS_NOT_ACKNOWLEDGED"
    # confirm with ack -> 201
    ok = _json(
        client.post(
            f"/api/v1/projects/{PROJECT_ID}/gold-set-imports/{import_id}/confirm",
            json={"strategy": "CREATE_NEW_DATASET", "acknowledge_warnings": True},
        ),
        201,
    )
    assert ok["created_revision_id"]


def test_import_conflict_state() -> None:
    # gold item ids collide with the target project -> CONFLICT (no auto-merge)
    bundle = _build_bundle()  # raw round-trip keeps colliding gold-item ids
    report = _json(
        client.post(
            f"/api/v1/projects/{PROJECT_ID}/gold-set-imports",
            json={"bundle": bundle},
        )
    )
    assert report["compatibility"] == "CONFLICT"
    assert report["blocking"] is False
    # CONFLICT still requires an explicit strategy; confirm with one creates new revision
    confirmed = _json(
        client.post(
            f"/api/v1/projects/{PROJECT_ID}/gold-set-imports/{report['import_id']}/confirm",
            json={
                "strategy": "NEW_REVISION_OF_EXISTING",
                "target_dataset_id": DATASET_ID,
            },
        ),
        201,
    )
    assert confirmed["created_dataset_id"] == DATASET_ID
    assert confirmed["created_revision_status"] == "DRAFT"


def test_import_incompatible_blocked() -> None:
    bundle = _build_bundle()
    for e in bundle["gold_entities"]:
        e["ontology_class_id"] = "class-unknown-xyz"
    report = _json(
        client.post(
            f"/api/v1/projects/{PROJECT_ID}/gold-set-imports",
            json={"bundle": bundle},
        )
    )
    assert report["compatibility"] == "INCOMPATIBLE"
    assert report["blocking"] is True
    assert report["allowed_strategies"] == []
    body = _json(
        client.post(
            f"/api/v1/projects/{PROJECT_ID}/gold-set-imports/{report['import_id']}/confirm",
            json={"strategy": "CREATE_NEW_DATASET"},
        ),
        409,
    )
    assert body["error"]["code"] == "IMPORT_INCOMPATIBLE"


# --- E. audit log -----------------------------------------------------------


def test_audit_log_records_actions() -> None:
    _reset()
    client.patch(
        f"/api/v1/evaluation-datasets/{DATASET_ID}/gold-entities/{ENTITY_ID}",
        json={"label": "x"},
    )
    client.post(
        f"/api/v1/evaluation-datasets/{DATASET_ID}/gold-entities/{ENTITY_ID}/archive"
    )
    audit = _json(client.get(f"/api/v1/evaluation-datasets/{DATASET_ID}/authoring-audit"))
    actions = [e["action"] for e in audit["items"]]
    assert "EDIT" in actions
    assert "ARCHIVE" in actions
    for entry in audit["items"]:
        assert entry["actor_id"]
        assert entry["target_kind"] in {
            "GOLD_ENTITY",
            "GOLD_RELATION",
            "GOLD_EVIDENCE",
            "DATASET_REVISION",
            "DATASET",
        }
        assert entry["created_at"]
    # filtered
    filtered = _json(
        client.get(
            f"/api/v1/evaluation-datasets/{DATASET_ID}/authoring-audit?action=EDIT"
        )
    )
    assert all(e["action"] == "EDIT" for e in filtered["items"])


# --- authz 403 --------------------------------------------------------------


def test_non_owner_authoring_forbidden() -> None:
    _reset()
    for resp in (
        client.patch(
            f"/api/v1/evaluation-datasets/{DATASET_ID}/gold-entities/{ENTITY_ID}?actor_id=stranger",
            json={"label": "x"},
        ),
        client.post(
            f"/api/v1/evaluation-datasets/{DATASET_ID}/revisions?actor_id=stranger",
            json={"activate": False},
        ),
    ):
        body = _json(resp, 403)
        assert body["error"]["code"] == "PERMISSION_DENIED"
    # reads still allowed for non-owner
    overview = _json(
        client.get(
            f"/api/v1/projects/{PROJECT_ID}/evaluation-datasets/{DATASET_ID}/authoring?actor_id=stranger"
        )
    )
    assert overview["capabilities"]["can_view"] is True
    assert overview["capabilities"]["can_edit_gold_item"] is False


def test_admin_actor_can_author() -> None:
    _reset()
    edited = _json(
        client.patch(
            f"/api/v1/evaluation-datasets/{DATASET_ID}/gold-entities/{ENTITY_ID}?actor_id=admin",
            json={"label": "by admin"},
        )
    )
    assert edited["gold_entity"]["label"] == "by admin"
    assert edited["audit_entry"]["is_owner"] is True


# --- OpenAPI field/enum alignment ------------------------------------------


def test_openapi_alignment_with_draft() -> None:
    draft = json.loads(MVP6_4_OPENAPI_PATH.read_text(encoding="utf-8"))
    runtime = app.openapi()
    runtime_schemas = runtime["components"]["schemas"]

    # 5 frozen enums (exact literals)
    enum_checks = {
        "GoldItemStatus": ["DRAFT", "ACTIVE", "ARCHIVED"],
        "DatasetRevisionStatus": ["DRAFT", "ACTIVE", "FROZEN", "ARCHIVED"],
        "GoldAuthoringAction": [
            "CREATE",
            "EDIT",
            "ARCHIVE",
            "RESTORE",
            "EVIDENCE_ATTACH",
            "EVIDENCE_EDIT",
            "REVISION_CUT",
            "REVISION_ACTIVATE",
            "IMPORT",
        ],
        "GoldSetImportCompatibility": ["COMPATIBLE", "WARNING", "CONFLICT", "INCOMPATIBLE"],
        "GoldSetImportStrategy": ["CREATE_NEW_DATASET", "NEW_REVISION_OF_EXISTING"],
        "RevisionFrozenReason": ["NEWER_REVISION_ACTIVATED", "PINNED_BY_RUN"],
        "AuditTargetKind": [
            "GOLD_ENTITY",
            "GOLD_RELATION",
            "GOLD_EVIDENCE",
            "DATASET_REVISION",
            "DATASET",
        ],
    }
    for name, literals in enum_checks.items():
        assert name in runtime_schemas, f"missing enum {name}"
        assert runtime_schemas[name]["enum"] == literals

    # all-false 7-flag guard
    guard = runtime_schemas["GoldAuthoringMutationGuard"]["properties"]
    assert set(guard) == set(ALL_FALSE_GUARD)

    # DTO field-name alignment vs draft for shared response/request schemas.
    # FastAPI may split a model used as both request+response into
    # "<Name>-Input"/"<Name>-Output"; accept either runtime variant.
    draft_schemas = draft["components"]["schemas"]

    def _runtime_props(name: str) -> set[str]:
        for candidate in (name, f"{name}-Output", f"{name}-Input"):
            if candidate in runtime_schemas:
                return set(runtime_schemas[candidate].get("properties", {}))
        raise AssertionError(f"runtime schema missing for {name}")

    for name in [
        "GoldEvidence",
        "DatasetRevision",
        "GoldAuthoringAuditEntry",
        "GoldSetImportReport",
        "GoldSetImportConfirmResponse",
        "GoldSetExportBundle",
        "GoldAuthoringCapabilities",
    ]:
        draft_props = set(draft_schemas[name].get("properties", {}))
        runtime_props = _runtime_props(name)
        assert draft_props <= runtime_props, (name, draft_props - runtime_props)

    # all 5 endpoint families present in the running app
    paths = runtime["paths"]
    expected = [
        "/api/v1/projects/{project_id}/evaluation-datasets/{dataset_id}/authoring",
        "/api/v1/evaluation-datasets/{dataset_id}/gold-entities/{gold_entity_id}",
        "/api/v1/evaluation-datasets/{dataset_id}/gold-evidence",
        "/api/v1/gold-evidence/{evidence_id}",
        "/api/v1/evaluation-datasets/{dataset_id}/revisions",
        "/api/v1/dataset-revisions/{revision_id}",
        "/api/v1/dataset-revisions/{revision_id}/activate",
        "/api/v1/dataset-revisions/{revision_id}/export",
        "/api/v1/projects/{project_id}/gold-set-imports",
        "/api/v1/projects/{project_id}/gold-set-imports/{import_id}/confirm",
        "/api/v1/evaluation-datasets/{dataset_id}/authoring-audit",
    ]
    for p in expected:
        assert p in paths, f"missing path {p}"


def test_mvp61_shapes_reused_without_rename() -> None:
    runtime_schemas = app.openapi()["components"]["schemas"]
    # GoldEvidenceRef fields preserved verbatim
    ref = runtime_schemas["GoldEvidenceRef"]["properties"]
    for field in (
        "sample_id",
        "source_id",
        "source_segment_id",
        "locator",
        "offset_start",
        "offset_end",
        "quote",
    ):
        assert field in ref
    # GoldEntity authoring view is an allOf-style overlay carrying MVP6.1 fields
    view = runtime_schemas["GoldEntityAuthoringView"]["properties"]
    for field in ("id", "label", "normalized_value", "ontology_class_id", "evidence"):
        assert field in view
    for overlay in ("status", "revision_id", "evidence_id"):
        assert overlay in view
