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
from app.modules.tenancy import service  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parents[3]
MVP6_10_OPENAPI_DRAFT = REPO_ROOT / "docs/api/openapi-mvp6-10-draft.json"

BASE = "/api/v1"

ALL_FALSE_GUARD = {
    "tenant_created": False,
    "tenant_updated": False,
    "tenant_deleted": False,
    "membership_mutated": False,
    "project_rehomed": False,
    "cross_tenant_access_granted": False,
    "candidate_graph_mutated": False,
    "published_graph_mutated": False,
}

# Frozen G5 matrix constants (dev-user perspective).
ACME_PROJECTS = ["proj-acme-kg", "proj-acme-catalog"]
GLOBEX_PROJECTS = ["proj-globex-ops"]
INITECH_SECRET_PROJECT = "proj-initech-secret"


def _json(response: Any, expected_status: int = 200) -> Any:
    assert response.status_code == expected_status, response.text
    return response.json()


def _reset() -> None:
    service.reset_runtime_store()


def _tenants(actor_id: str | None = None) -> Any:
    q = f"?actor_id={actor_id}" if actor_id else ""
    return client.get(f"{BASE}/tenants{q}")


def _tenant(tenant_id: str, actor_id: str | None = None) -> Any:
    q = f"?actor_id={actor_id}" if actor_id else ""
    return client.get(f"{BASE}/tenants/{tenant_id}{q}")


def _tenant_projects(tenant_id: str, actor_id: str | None = None) -> Any:
    q = f"?actor_id={actor_id}" if actor_id else ""
    return client.get(f"{BASE}/tenants/{tenant_id}/projects{q}")


def _project_tenant(project_id: str, actor_id: str | None = None) -> Any:
    q = f"?actor_id={actor_id}" if actor_id else ""
    return client.get(f"{BASE}/projects/{project_id}/tenant{q}")


def _err(response: Any) -> dict:
    return response.json()["error"]


# ---------------------------------------------------------------------------
# GET /tenants — visibility set only
# ---------------------------------------------------------------------------


def test_list_tenants_default_actor_visibility_set() -> None:
    _reset()
    body = _json(_tenants())
    assert body["actor_id"] == "dev-user"
    ids = [t["id"] for t in body["items"]]
    assert ids == ["tenant-acme", "tenant-globex"]
    assert body["total_count"] == 2
    assert body["mutation_guard"] == ALL_FALSE_GUARD
    # No other tenant's id/name ever leaks into the list.
    text = _tenants().text
    for hidden in ("tenant-initech", "tenant-umbrella", "tenant-soylent", "tenant-hooli", "Initech"):
        assert hidden not in text


def test_list_tenants_summary_shape_and_membership() -> None:
    _reset()
    body = _json(_tenants())
    acme = body["items"][0]
    assert acme["id"] == "tenant-acme"
    assert acme["status"] == "ACTIVE"
    assert acme["project_count"] == 2
    assert acme["my_membership"] == {
        "actor_id": "dev-user",
        "tenant_id": "tenant-acme",
        "role": "PROJECT_ADMIN",
        "status": "ACTIVE",
    }
    assert set(acme.keys()) == {
        "id", "display_name", "description", "status",
        "my_membership", "project_count", "created_at",
    }


def test_list_tenants_disjoint_second_actor() -> None:
    _reset()
    body = _json(_tenants("dev-user-2"))
    assert body["actor_id"] == "dev-user-2"
    assert [t["id"] for t in body["items"]] == ["tenant-initech"]
    assert body["total_count"] == 1


def test_list_tenants_unknown_actor_empty() -> None:
    _reset()
    body = _json(_tenants("nobody"))
    assert body["items"] == []
    assert body["total_count"] == 0
    assert body["mutation_guard"] == ALL_FALSE_GUARD


# ---------------------------------------------------------------------------
# GET /tenants/{id} — isolation matrix (dev-user)
# ---------------------------------------------------------------------------


def test_tenant_summary_visible_200() -> None:
    _reset()
    for tid in ("tenant-acme", "tenant-globex"):
        body = _json(_tenant(tid))
        assert body["tenant"]["id"] == tid
        assert body["tenant"]["status"] == "ACTIVE"
        assert body["mutation_guard"] == ALL_FALSE_GUARD


def test_tenant_summary_not_a_member_404_no_leak() -> None:
    _reset()
    resp = _tenant("tenant-initech")
    assert resp.status_code == 404
    err = _err(resp)
    assert err["code"] == "TENANT_NOT_FOUND"
    assert err["details"]["denial_reason"] == "NOT_A_MEMBER"
    # No guard on errors; no name/count/project leak.
    assert "mutation_guard" not in resp.json()
    assert "mutation_guard" not in err
    for leaked in ("Initech", "project_count", INITECH_SECRET_PROJECT):
        assert leaked not in resp.text


def test_tenant_summary_membership_suspended_403() -> None:
    _reset()
    resp = _tenant("tenant-umbrella")
    assert resp.status_code == 403
    err = _err(resp)
    assert err["code"] == "TENANT_ACCESS_SUSPENDED"
    assert err["details"]["denial_reason"] == "MEMBERSHIP_SUSPENDED"
    assert "mutation_guard" not in resp.json()


def test_tenant_summary_tenant_suspended_403() -> None:
    _reset()
    resp = _tenant("tenant-soylent")
    assert resp.status_code == 403
    err = _err(resp)
    assert err["code"] == "TENANT_ACCESS_SUSPENDED"
    assert err["details"]["denial_reason"] == "TENANT_SUSPENDED"


def test_tenant_summary_archived_404() -> None:
    _reset()
    resp = _tenant("tenant-hooli")
    assert resp.status_code == 404
    err = _err(resp)
    assert err["code"] == "TENANT_NOT_FOUND"
    assert err["details"]["denial_reason"] == "TENANT_ARCHIVED"


def test_tenant_summary_unknown_404() -> None:
    _reset()
    resp = _tenant("tenant-does-not-exist")
    assert resp.status_code == 404
    assert _err(resp)["code"] == "TENANT_NOT_FOUND"
    assert _err(resp)["details"]["denial_reason"] == "NOT_A_MEMBER"


def test_tenant_summary_second_actor_sees_initech_but_not_devuser_tenants() -> None:
    _reset()
    # dev-user-2 IS a member of initech -> 200 (proves initech genuinely exists).
    body = _json(_tenant("tenant-initech", "dev-user-2"))
    assert body["tenant"]["id"] == "tenant-initech"
    assert body["tenant"]["project_count"] == 1
    # ...yet dev-user gets 404 for the SAME tenant (no-leak / disjoint).
    assert _tenant("tenant-initech").status_code == 404
    # dev-user-2 is not a member of acme -> 404.
    assert _tenant("tenant-acme", "dev-user-2").status_code == 404


# ---------------------------------------------------------------------------
# GET /tenants/{id}/projects — tenant-scoped, never cross-tenant
# ---------------------------------------------------------------------------


def test_tenant_projects_scoped_to_tenant() -> None:
    _reset()
    body = _json(_tenant_projects("tenant-acme"))
    assert [p["id"] for p in body["items"]] == ACME_PROJECTS
    assert body["total_count"] == 2
    assert body["tenant_id"] == "tenant-acme"
    assert body["mutation_guard"] == ALL_FALSE_GUARD
    # Never returns another tenant's projects.
    assert INITECH_SECRET_PROJECT not in body["items"][0]["id"]
    globex = _json(_tenant_projects("tenant-globex"))
    assert [p["id"] for p in globex["items"]] == GLOBEX_PROJECTS


def test_tenant_projects_ref_shape() -> None:
    _reset()
    body = _json(_tenant_projects("tenant-acme"))
    ref = body["items"][0]
    assert set(ref.keys()) == {
        "id", "name", "description", "status",
        "created_at", "updated_at", "source_count", "ontology_version_count",
    }


def test_tenant_projects_not_a_member_404_no_project_leak() -> None:
    _reset()
    resp = _tenant_projects("tenant-initech")
    assert resp.status_code == 404
    assert _err(resp)["code"] == "TENANT_NOT_FOUND"
    assert _err(resp)["details"]["denial_reason"] == "NOT_A_MEMBER"
    assert INITECH_SECRET_PROJECT not in resp.text


def test_tenant_projects_suspended_and_archived() -> None:
    _reset()
    assert _tenant_projects("tenant-umbrella").status_code == 403
    assert _tenant_projects("tenant-soylent").status_code == 403
    assert _tenant_projects("tenant-hooli").status_code == 404


def test_tenant_projects_second_actor_sees_initech_project() -> None:
    _reset()
    body = _json(_tenant_projects("tenant-initech", "dev-user-2"))
    assert [p["id"] for p in body["items"]] == [INITECH_SECRET_PROJECT]


# ---------------------------------------------------------------------------
# GET /projects/{id}/tenant — mirrors owning tenant's decision
# ---------------------------------------------------------------------------


def test_project_tenant_visible_200() -> None:
    _reset()
    body = _json(_project_tenant("proj-acme-kg"))
    assert body["project_id"] == "proj-acme-kg"
    assert body["tenant"]["id"] == "tenant-acme"
    assert body["mutation_guard"] == ALL_FALSE_GUARD
    assert _json(_project_tenant("proj-globex-ops"))["tenant"]["id"] == "tenant-globex"


def test_project_tenant_not_a_member_404_no_leak() -> None:
    _reset()
    resp = _project_tenant(INITECH_SECRET_PROJECT)
    assert resp.status_code == 404
    err = _err(resp)
    assert err["code"] == "PROJECT_NOT_FOUND"
    # PROJECT_NOT_FOUND carries no denial_reason (existence not leaked).
    assert "denial_reason" not in (err.get("details") or {})
    for leaked in ("tenant-initech", "Initech"):
        assert leaked not in resp.text


def test_project_tenant_suspended_403() -> None:
    _reset()
    umbrella = _project_tenant("proj-umbrella-01")
    assert umbrella.status_code == 403
    assert _err(umbrella)["details"]["denial_reason"] == "MEMBERSHIP_SUSPENDED"
    soylent = _project_tenant("proj-soylent-01")
    assert soylent.status_code == 403
    assert _err(soylent)["details"]["denial_reason"] == "TENANT_SUSPENDED"


def test_project_tenant_archived_404() -> None:
    _reset()
    resp = _project_tenant("proj-hooli-01")
    assert resp.status_code == 404
    assert _err(resp)["code"] == "PROJECT_NOT_FOUND"


def test_project_tenant_unknown_404() -> None:
    _reset()
    resp = _project_tenant("proj-nope")
    assert resp.status_code == 404
    assert _err(resp)["code"] == "PROJECT_NOT_FOUND"


def test_project_tenant_second_actor_resolves_initech() -> None:
    _reset()
    body = _json(_project_tenant(INITECH_SECRET_PROJECT, "dev-user-2"))
    assert body["tenant"]["id"] == "tenant-initech"


# ---------------------------------------------------------------------------
# All-false 8-flag guard on every 200; errors carry no guard
# ---------------------------------------------------------------------------


def test_guard_all_false_on_every_200() -> None:
    _reset()
    guards = [
        _json(_tenants())["mutation_guard"],
        _json(_tenant("tenant-acme"))["mutation_guard"],
        _json(_tenant_projects("tenant-acme"))["mutation_guard"],
        _json(_project_tenant("proj-acme-kg"))["mutation_guard"],
    ]
    for guard in guards:
        assert guard == ALL_FALSE_GUARD
        assert len(guard) == 8
        assert all(v is False for v in guard.values())


def test_error_envelopes_carry_no_guard() -> None:
    _reset()
    for resp in (
        _tenant("tenant-initech"),
        _tenant("tenant-umbrella"),
        _project_tenant(INITECH_SECRET_PROJECT),
    ):
        body = resp.json()
        assert "mutation_guard" not in body
        assert "mutation_guard" not in body["error"]


# ---------------------------------------------------------------------------
# DATA-LEVEL no-mutation: all DB tables + fixture tables before == after
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
        "tenants": sorted(service._TENANTS.keys()),
        "memberships": sorted(str(k) for k in service._MEMBERSHIPS.keys()),
        "project_owner": dict(service._PROJECT_OWNER),
        "projects_by_tenant": {
            t: [p.id for p in ps] for t, ps in service._PROJECTS_BY_TENANT.items()
        },
    }


def test_data_level_no_mutation() -> None:
    _reset()
    before = _table_counts()
    fixtures_before = _fixture_snapshot()

    # Exercise every endpoint incl. all isolation branches, both actors.
    for actor in (None, "dev-user-2", "nobody"):
        _tenants(actor)
        for tid in (
            "tenant-acme", "tenant-globex", "tenant-initech",
            "tenant-umbrella", "tenant-soylent", "tenant-hooli", "tenant-x",
        ):
            _tenant(tid, actor)
            _tenant_projects(tid, actor)
        for pid in (
            "proj-acme-kg", "proj-globex-ops", INITECH_SECRET_PROJECT,
            "proj-umbrella-01", "proj-soylent-01", "proj-hooli-01", "proj-x",
        ):
            _project_tenant(pid, actor)

    assert _table_counts() == before
    assert _fixture_snapshot() == fixtures_before


# ---------------------------------------------------------------------------
# Additive: existing project endpoints unchanged
# ---------------------------------------------------------------------------


def test_existing_project_list_endpoint_unchanged() -> None:
    _reset()
    resp = client.get(f"{BASE}/projects")
    assert resp.status_code == 200
    # MVP1 project list has no tenant field (project stays tenant-unaware).
    body = resp.json()
    items = body if isinstance(body, list) else body.get("items", body)
    if isinstance(items, list) and items:
        assert "tenant_id" not in items[0]


# ---------------------------------------------------------------------------
# OpenAPI alignment (actual export vs frozen draft)
# ---------------------------------------------------------------------------


def test_openapi_paths_present() -> None:
    actual = app.openapi()
    for path in (
        "/api/v1/tenants",
        "/api/v1/tenants/{tenant_id}",
        "/api/v1/tenants/{tenant_id}/projects",
        "/api/v1/projects/{project_id}/tenant",
    ):
        assert path in actual["paths"], path
        assert "get" in actual["paths"][path]


def test_openapi_enum_alignment() -> None:
    actual = app.openapi()["components"]["schemas"]
    draft = json.loads(MVP6_10_OPENAPI_DRAFT.read_text(encoding="utf-8"))
    draft_schemas = draft["components"]["schemas"]
    for name in (
        "TenantStatus",
        "TenantMembershipStatus",
        "TenantAccessDenialReason",
        "Role",
    ):
        assert name in actual, name
        assert set(actual[name]["enum"]) == set(draft_schemas[name]["enum"]), name


def test_openapi_mutation_guard_8_flags() -> None:
    actual = app.openapi()["components"]["schemas"]
    guard = actual["TenantMutationGuard"]
    assert set(guard["properties"].keys()) == set(ALL_FALSE_GUARD.keys())
    assert len(guard["properties"]) == 8


def test_openapi_response_schemas_present() -> None:
    actual = app.openapi()["components"]["schemas"]
    for name in (
        "TenantListResponse",
        "TenantSummaryResponse",
        "TenantProjectListResponse",
        "ProjectTenantResponse",
        "TenantSummary",
        "TenantMembership",
        "ProjectSummaryRef",
    ):
        assert name in actual, name
