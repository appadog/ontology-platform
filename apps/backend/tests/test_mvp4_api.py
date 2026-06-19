import os
from typing import Any

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["LOCAL_STORAGE_PATH"] = "/private/tmp/ontology-platform-backend-test-storage"

from fastapi.testclient import TestClient  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402
from app.modules.mvp4.quality_proof import build_quality_recompute_proof  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from scripts.seed_mvp3 import seed_mvp3  # noqa: E402
from scripts.seed_mvp4 import seed_mvp4  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)


def _seed() -> dict[str, Any]:
    return seed_mvp3(reset=True)


def test_mvp4_openapi_exposes_thin_runtime_contract() -> None:
    schema = client.get("/api/v1/openapi.json").json()
    paths = schema["paths"]

    for path in [
        "/api/v1/projects/{project_id}/quality/metrics",
        "/api/v1/projects/{project_id}/quality/metrics/{metric_id}",
        "/api/v1/projects/{project_id}/evaluation-datasets",
        "/api/v1/evaluation-datasets/{dataset_id}",
        "/api/v1/evaluation-datasets/{dataset_id}/versions",
        "/api/v1/evaluation-dataset-versions/{dataset_version_id}",
        "/api/v1/evaluation-dataset-versions/{dataset_version_id}/golden-items",
        "/api/v1/projects/{project_id}/evaluation-runs",
        "/api/v1/evaluation-runs/{evaluation_run_id}",
        "/api/v1/projects/{project_id}/prompt-performance/summary",
        "/api/v1/projects/{project_id}/prompt-experiments",
        "/api/v1/prompt-experiments/{experiment_id}",
        "/api/v1/projects/{project_id}/search",
        "/api/v1/projects/{project_id}/vector/status",
        "/api/v1/projects/{project_id}/similar-evidence",
        "/api/v1/projects/{project_id}/rag/answers",
        "/api/v1/projects/{project_id}/published-graph/explore",
        "/api/v1/published-graph/versions/{version_id}/explore",
        "/api/v1/published-graph/lineage",
        "/api/v1/external/projects/{project_id}/published-graph/current",
        "/api/v1/external/published-graph/entities/{entity_id}",
        "/api/v1/external/published-graph/relations/{relation_id}",
        "/api/v1/external/sources/{source_id}",
        "/api/v1/external/evidence/{evidence_id}",
        "/api/v1/external/projects/{project_id}/search",
        "/api/v1/external/projects/{project_id}/rag/answers",
    ]:
        assert path in paths

    schemas = schema["components"]["schemas"]
    assert schemas["EvaluationDatasetStatus"]["enum"] == ["DRAFT", "ACTIVE", "ARCHIVED"]
    assert schemas["GoldenSetItemKind"]["enum"] == [
        "ENTITY",
        "RELATION",
        "PROPERTY_VALUE",
        "EVIDENCE_LINK",
    ]
    assert schemas["PromptExperimentStatus"]["enum"] == [
        "DRAFT",
        "RUNNING",
        "COMPLETED",
        "CANCELLED",
    ]
    assert schemas["RagAnswerState"]["enum"] == ["ANSWERED", "INSUFFICIENT_EVIDENCE", "ERROR"]
    assert schemas["GraphExploreState"]["enum"] == ["READY", "SAFE_TOO_LARGE", "EMPTY", "ERROR"]
    assert schemas["VectorAdapterStatus"]["enum"] == [
        "AVAILABLE",
        "FALLBACK_KEYWORD",
        "UNAVAILABLE",
        "NOT_CONFIGURED",
    ]
    assert schemas["ExternalApiAuthMode"]["enum"] == ["DEV_AUTH"]
    assert "composite_score" not in schemas["QualityMetric"]["properties"]

    for envelope_name in [
        "ExternalPublishedGraphEnvelope",
        "ExternalPublishedEntityEnvelope",
        "ExternalPublishedRelationEnvelope",
        "ExternalSourceEnvelope",
        "ExternalEvidenceEnvelope",
        "ExternalSearchEnvelope",
        "ExternalRagAnswerEnvelope",
    ]:
        properties = schemas[envelope_name]["properties"]
        assert {"auth_mode", "project_id", "published_graph_version_ref", "data"}.issubset(
            properties
        )


def test_mvp4_quality_metrics_are_explainable_without_composite_score() -> None:
    ctx = _seed()
    response = client.get(f"/api/v1/projects/{ctx['project_id']}/quality/metrics")

    assert response.status_code == 200
    body = response.json()
    groups = {group["group"]: group for group in body["metric_groups"]}
    assert {
        "COMPLETENESS",
        "CONSISTENCY",
        "TRACEABILITY",
        "VALIDATION",
        "REVIEW",
        "DUPLICATE",
        "RELATION_DENSITY",
    }.issubset(groups)

    for group in body["metric_groups"]:
        for metric in group["metrics"]:
            assert "composite_score" not in metric
            formula = metric["formula"]
            assert formula["numerator"]
            assert formula["denominator"]
            assert formula["scope"]
            assert formula["time_window"]
            assert formula["breakdown_dimension"]
            assert formula["drilldown_target"]
            assert metric["published_graph_version_ref"]["is_current"] is True

    detail = client.get(
        f"/api/v1/projects/{ctx['project_id']}/quality/metrics/relation_density"
    )
    assert detail.status_code == 200
    assert detail.json()["metric_id"] == "relation_density"
    assert detail.json()["breakdowns"]


def test_mvp4_quality_metrics_have_independent_recompute_proof() -> None:
    ctx = _seed()
    api_body = client.get(f"/api/v1/projects/{ctx['project_id']}/quality/metrics").json()

    with SessionLocal() as db:
        proof = build_quality_recompute_proof(db, ctx["project_id"], api_body=api_body)

    assert proof["project_id"] == ctx["project_id"]
    assert proof["published_graph_version_ref"]["published_graph_version_id"] == ctx[
        "published_graph_version_id"
    ]
    assert proof["source"] == "mvp4_seed_db_and_quality_api"
    assert proof["tolerance"] == 0.0001
    assert proof["no_weighted_composite_score"] is True

    rows = proof["metric_rows"]
    assert {row["group"] for row in rows} == {
        "COMPLETENESS",
        "CONSISTENCY",
        "TRACEABILITY",
        "VALIDATION",
        "REVIEW",
        "DUPLICATE",
        "RELATION_DENSITY",
    }

    api_metrics = {
        metric["metric_id"]: metric
        for group in api_body["metric_groups"]
        for metric in group["metrics"]
    }
    for row in rows:
        assert row["passed"] is True
        assert row["denominator"] > 0
        assert row["formula_metadata"]
        assert row["formula_metadata"]["numerator"] == api_metrics[row["metric_id"]]["formula"][
            "numerator"
        ]
        assert row["drilldown_target"] == api_metrics[row["metric_id"]]["drilldown"]["target"]
        assert row["required_evidence_artifact"] == "/tmp/ontology-wave22-quality-proof.json"
        if "api_rate" in row:
            assert abs(row["api_rate"] - row["recomputed_rate"]) <= row["tolerance"]
        else:
            assert row["api_value"] == row["recomputed_value"]


def test_mvp4_seed_includes_quality_recompute_proof_section() -> None:
    seed = seed_mvp4(reset=True)

    proof = seed["mvp4"]["quality_recompute_proof"]
    assert proof["project_id"] == seed["project_id"]
    assert len(proof["metric_rows"]) == 7
    assert all(row["passed"] for row in proof["metric_rows"])


def test_mvp4_dataset_prompt_and_search_vector_surfaces_are_seeded() -> None:
    ctx = _seed()

    datasets = client.get(f"/api/v1/projects/{ctx['project_id']}/evaluation-datasets").json()
    assert {dataset["status"] for dataset in datasets} == {"DRAFT", "ACTIVE", "ARCHIVED"}
    active = next(dataset for dataset in datasets if dataset["status"] == "ACTIVE")
    version = client.get(f"/api/v1/evaluation-dataset-versions/{active['active_version_id']}").json()
    assert version["golden_item_count"] == 4
    items = client.get(
        f"/api/v1/evaluation-dataset-versions/{active['active_version_id']}/golden-items"
    ).json()
    assert {item["kind"] for item in items} == {
        "ENTITY",
        "RELATION",
        "PROPERTY_VALUE",
        "EVIDENCE_LINK",
    }

    runs = client.get(f"/api/v1/projects/{ctx['project_id']}/evaluation-runs").json()
    assert {run["status"] for run in runs}.issuperset({"SUCCESS", "FAILED"})
    experiments = client.get(f"/api/v1/projects/{ctx['project_id']}/prompt-experiments").json()
    assert {experiment["status"] for experiment in experiments}.issuperset({"DRAFT", "COMPLETED"})
    performance = client.get(
        f"/api/v1/projects/{ctx['project_id']}/prompt-performance/summary"
    ).json()
    assert "prompt_version_id" in performance["comparison_dimensions"]
    assert performance["rows"][0]["sample_count"] > 0

    search = client.get(f"/api/v1/projects/{ctx['project_id']}/search", params={"q": "Acme"}).json()
    assert search["total_count"] >= 6
    assert {
        "PUBLISHED_ENTITY",
        "PUBLISHED_RELATION",
        "SOURCE",
        "SOURCE_CHUNK",
        "EVIDENCE",
        "LINEAGE",
    }.issubset({group["kind"] for group in search["groups"]})
    empty = client.get(
        f"/api/v1/projects/{ctx['project_id']}/search", params={"q": "no-mvp4-results"}
    ).json()
    assert empty["total_count"] == 0
    assert empty["groups"] == []

    vector = client.get(f"/api/v1/projects/{ctx['project_id']}/vector/status").json()
    assert vector["status"] == "FALLBACK_KEYWORD"
    similar = client.post(
        f"/api/v1/projects/{ctx['project_id']}/similar-evidence",
        json={"query": "Acme", "limit": 2},
    ).json()
    assert similar["fallback_used"] is True
    assert similar["items"]


def test_mvp4_rag_graph_and_external_boundaries_exclude_candidate_facts() -> None:
    ctx = _seed()

    answered = client.post(
        f"/api/v1/projects/{ctx['project_id']}/rag/answers",
        json={"question": "Which department belongs to Acme?", "max_citations": 3},
    ).json()
    assert answered["state"] == "ANSWERED"
    assert answered["citations"]
    assert answered["linked_published_facts"]
    assert not any("candidate" in item["fact_id"] for item in answered["linked_published_facts"])

    insufficient = client.post(
        f"/api/v1/projects/{ctx['project_id']}/rag/answers",
        json={"question": "What candidate-only fact should answer this?", "max_citations": 3},
    ).json()
    assert insufficient["state"] == "INSUFFICIENT_EVIDENCE"
    assert insufficient["linked_published_facts"] == []
    assert insufficient["insufficient_evidence"]["reason_code"] == "NO_PUBLISHED_FACTS"

    graph = client.get(
        f"/api/v1/projects/{ctx['project_id']}/published-graph/explore",
        params={"max_hops": 2},
    ).json()
    assert graph["state"] == "READY"
    assert graph["nodes"]
    assert graph["edges"]
    assert not any("candidate" in node["id"] for node in graph["nodes"])

    too_large = client.get(
        f"/api/v1/projects/{ctx['project_id']}/published-graph/explore",
        params={"max_hops": 4},
    ).json()
    assert too_large["state"] == "SAFE_TOO_LARGE"
    assert too_large["too_large"]["node_budget"] == 150

    external_missing_auth = client.get(
        f"/api/v1/external/projects/{ctx['project_id']}/published-graph/current"
    )
    assert external_missing_auth.status_code == 401

    headers = {"X-Dev-Auth": "mvp4-dev"}
    search = client.get(
        f"/api/v1/projects/{ctx['project_id']}/search",
        params={"q": "Acme"},
    ).json()
    source_id = next(
        item["id"]
        for group in search["groups"]
        if group["kind"] == "SOURCE"
        for item in group["items"]
    )
    evidence_id = next(
        item["id"]
        for group in search["groups"]
        if group["kind"] == "EVIDENCE"
        for item in group["items"]
    )
    external_graph = client.get(
        f"/api/v1/external/projects/{ctx['project_id']}/published-graph/current",
        headers=headers,
    )
    assert external_graph.status_code == 200
    assert external_graph.json()["auth_mode"] == "DEV_AUTH"
    assert external_graph.json()["data"]["version"]["id"] == ctx["published_graph_version_id"]

    external_write = client.patch(
        f"/api/v1/external/projects/{ctx['project_id']}/published-graph/current",
        headers=headers,
        json={"name": "must not mutate"},
    )
    assert external_write.status_code in {404, 405}

    external_source_missing_auth = client.get(f"/api/v1/external/sources/{source_id}")
    assert external_source_missing_auth.status_code == 401
    external_source = client.get(f"/api/v1/external/sources/{source_id}", headers=headers)
    assert external_source.status_code == 200
    source_body = external_source.json()
    assert source_body["auth_mode"] == "DEV_AUTH"
    assert source_body["project_id"] == ctx["project_id"]
    assert isinstance(source_body["data"]["metadata"], dict)

    external_source_write = client.patch(
        f"/api/v1/external/sources/{source_id}",
        headers=headers,
        json={"file_name": "must-not-mutate.csv"},
    )
    assert external_source_write.status_code in {404, 405}

    external_evidence_missing_auth = client.get(f"/api/v1/external/evidence/{evidence_id}")
    assert external_evidence_missing_auth.status_code == 401
    external_evidence = client.get(f"/api/v1/external/evidence/{evidence_id}", headers=headers)
    assert external_evidence.status_code == 200
    evidence_body = external_evidence.json()
    assert evidence_body["auth_mode"] == "DEV_AUTH"
    assert evidence_body["project_id"] == ctx["project_id"]
    assert evidence_body["published_graph_version_ref"]["is_current"] is True
    assert isinstance(evidence_body["data"]["metadata"], dict)

    external_evidence_write = client.patch(
        f"/api/v1/external/evidence/{evidence_id}",
        headers=headers,
        json={"evidence_text": "must not mutate"},
    )
    assert external_evidence_write.status_code in {404, 405}


def test_mvp4_seed_reports_stable_qa_examples() -> None:
    seed = seed_mvp4(reset=True)

    assert seed["project_id"] == "project-corp-knowledge"
    assert "relation_density" in seed["mvp4"]["quality_metric_ids"]
    assert seed["mvp4"]["vector_status"] == "FALLBACK_KEYWORD"
    assert seed["mvp4"]["rag_answered_state"] == "ANSWERED"
    assert seed["mvp4"]["rag_insufficient_state"] == "INSUFFICIENT_EVIDENCE"
    assert seed["mvp4"]["graph_too_large_state"] == "SAFE_TOO_LARGE"
    assert seed["mvp4"]["external_auth_mode"] == "DEV_AUTH"
