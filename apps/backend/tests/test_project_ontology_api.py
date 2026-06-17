import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

from fastapi.testclient import TestClient  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402


Base.metadata.create_all(bind=engine)
client = TestClient(app)


def test_health_and_dev_user() -> None:
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    me = client.get("/api/v1/me")
    assert me.status_code == 200
    assert "PROJECT_ADMIN" in me.json()["roles"]


def test_project_ontology_graph_flow() -> None:
    project_response = client.post(
        "/api/v1/projects",
        json={"name": "Contract Test Project", "description": "Smoke flow"},
    )
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    version_response = client.post(
        f"/api/v1/projects/{project_id}/ontology/versions",
        json={"created_by": "dev-user"},
    )
    assert version_response.status_code == 201
    version_id = version_response.json()["id"]

    company_response = client.post(
        f"/api/v1/ontology/versions/{version_id}/classes",
        json={"name": "Company", "label": "Company", "position": {"x": 120, "y": 120}},
    )
    assert company_response.status_code == 201
    company_id = company_response.json()["id"]

    department_response = client.post(
        f"/api/v1/ontology/versions/{version_id}/classes",
        json={"name": "Department", "label": "Department", "position": {"x": 320, "y": 120}},
    )
    assert department_response.status_code == 201
    department_id = department_response.json()["id"]

    property_response = client.post(
        f"/api/v1/ontology/versions/{version_id}/properties",
        json={
            "class_id": company_id,
            "name": "company_name",
            "label": "Company Name",
            "data_type": "STRING",
            "cardinality": "REQUIRED",
            "required": True,
        },
    )
    assert property_response.status_code == 201

    relation_response = client.post(
        f"/api/v1/ontology/versions/{version_id}/relations",
        json={
            "name": "HAS_DEPARTMENT",
            "label": "Has Department",
            "domain_class_id": company_id,
            "range_class_id": department_id,
            "cardinality": "ONE_TO_MANY",
        },
    )
    assert relation_response.status_code == 201

    graph_response = client.get(f"/api/v1/ontology/versions/{version_id}/graph")
    assert graph_response.status_code == 200
    graph = graph_response.json()
    assert graph["version_id"] == version_id
    assert len(graph["nodes"]) == 2
    assert len(graph["edges"]) == 1
    assert len(graph["properties"]) == 1
