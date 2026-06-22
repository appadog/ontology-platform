import json
import os
from pathlib import Path
from typing import Any

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["LOCAL_STORAGE_PATH"] = "/private/tmp/ontology-platform-backend-test-storage"

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import func, select  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.modules.evaluation import service as evaluation_service  # noqa: E402
from app.modules.publish.models import (  # noqa: E402
    PublishJob,
    PublishedEntity,
    PublishedGraphVersion,
    PublishedRelation,
)
from app.modules.review.models import ReviewDecision, ReviewTask  # noqa: E402
from scripts.seed_mvp3 import seed_mvp3  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parents[3]
MVP6_OPENAPI_PATH = REPO_ROOT / "docs/api/openapi-mvp6-draft.json"
REQUIRED_CANDIDATE_REF_FIELDS = {
    "candidate_id",
    "candidate_kind",
    "sample_id",
    "ontology_class_id",
    "ontology_relation_id",
    "label",
    "normalized_value",
    "source_gold_entity_id",
    "target_gold_entity_id",
    "evidence",
}


def _json(response: Any, expected_status: int = 200) -> Any:
    assert response.status_code == expected_status, response.text
    return response.json()


def _seed() -> dict[str, Any]:
    evaluation_service.reset_runtime_store()
    return seed_mvp3(reset=True)


def _project_mutation_guard(project_id: str) -> dict[str, int | str | None]:
    with SessionLocal() as db:
        current_version = db.scalars(
            select(PublishedGraphVersion)
            .where(
                PublishedGraphVersion.project_id == project_id,
                PublishedGraphVersion.is_current.is_(True),
            )
            .order_by(PublishedGraphVersion.version.desc())
            .limit(1)
        ).first()
        return {
            "published_versions": db.scalar(
                select(func.count()).select_from(PublishedGraphVersion).where(
                    PublishedGraphVersion.project_id == project_id
                )
            ),
            "published_entities": db.scalar(
                select(func.count()).select_from(PublishedEntity).where(
                    PublishedEntity.project_id == project_id
                )
            ),
            "published_relations": db.scalar(
                select(func.count()).select_from(PublishedRelation).where(
                    PublishedRelation.project_id == project_id
                )
            ),
            "publish_jobs": db.scalar(
                select(func.count()).select_from(PublishJob).where(
                    PublishJob.project_id == project_id
                )
            ),
            "review_tasks": db.scalar(
                select(func.count()).select_from(ReviewTask).where(
                    ReviewTask.project_id == project_id
                )
            ),
            "review_decisions": db.scalar(
                select(func.count()).select_from(ReviewDecision).where(
                    ReviewDecision.project_id == project_id
                )
            ),
            "current_published_graph_version_id": current_version.id if current_version else None,
        }


def test_mvp6_openapi_exposes_thin_evaluation_contract() -> None:
    schema = _json(client.get("/api/v1/openapi.json"))
    paths = schema["paths"]

    for path in [
        "/api/v1/projects/{project_id}/evaluation-datasets",
        "/api/v1/evaluation-datasets/{dataset_id}",
        "/api/v1/evaluation-datasets/{dataset_id}/samples",
        "/api/v1/evaluation-datasets/{dataset_id}/gold-entities",
        "/api/v1/evaluation-datasets/{dataset_id}/gold-relations",
        "/api/v1/projects/{project_id}/evaluation-runs",
        "/api/v1/evaluation-runs/{run_id}",
        "/api/v1/evaluation-runs/{run_id}/metrics",
        "/api/v1/evaluation-runs/{run_id}/errors",
        "/api/v1/evaluation-error-cases/{error_case_id}",
    ]:
        assert path in paths

    schemas = schema["components"]["schemas"]
    assert schemas["EvaluationDatasetStatus"]["enum"] == ["DRAFT", "ACTIVE", "ARCHIVED"]
    assert schemas["EvaluationSampleKind"]["enum"] == ["SOURCE_SEGMENT", "MANUAL_TEXT", "TABLE_ROW"]
    assert schemas["EvaluationRunMode"]["enum"] == ["DETERMINISTIC_MOCK"]
    assert schemas["EvaluationRunStatus"]["enum"] == ["PENDING", "RUNNING", "SUCCEEDED", "FAILED"]
    assert schemas["EvaluationMetricStatus"]["enum"] == ["MEASURED", "NOT_APPLICABLE"]
    assert schemas["EvaluationMetricName"]["enum"] == [
        "ENTITY_PRECISION",
        "ENTITY_RECALL",
        "ENTITY_F1",
        "RELATION_PRECISION",
        "RELATION_RECALL",
        "RELATION_F1",
        "RELATION_DIRECTION_ACCURACY",
        "EVIDENCE_MATCH_RATE",
    ]
    assert schemas["EvaluationErrorType"]["enum"] == [
        "MISSING_ENTITY",
        "EXTRA_ENTITY",
        "WRONG_ENTITY_CLASS",
        "MISSING_RELATION",
        "EXTRA_RELATION",
        "WRONG_RELATION_TYPE",
        "WRONG_RELATION_DIRECTION",
        "EVIDENCE_MISMATCH",
    ]
    assert REQUIRED_CANDIDATE_REF_FIELDS.issubset(
        schemas["EvaluationCandidateRef"]["properties"]
    )


def test_mvp6_gold_set_to_deterministic_run_happy_path_preserves_published_graph() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    before = _project_mutation_guard(project_id)

    dataset = _json(
        client.post(
            f"/api/v1/projects/{project_id}/evaluation-datasets",
            json={"name": "Wave28 deterministic gold set", "description": "MVP6.1 smoke"},
        ),
        expected_status=201,
    )
    datasets = _json(client.get(f"/api/v1/projects/{project_id}/evaluation-datasets"))
    assert any(item["id"] == dataset["id"] for item in datasets)
    assert _json(client.get(f"/api/v1/evaluation-datasets/{dataset['id']}"))["id"] == dataset[
        "id"
    ]
    sample = _json(
        client.post(
            f"/api/v1/evaluation-datasets/{dataset['id']}/samples",
            json={
                "sample_kind": "MANUAL_TEXT",
                "title": "Acme benchmark sample",
                "content_text": "Acme Corp owns Beta Dept. Missing LLC is absent from predictions.",
                "source_id": "source-wave28-manual",
                "source_segment_id": "segment-wave28-001",
                "source_locator": "manual:wave28:1",
            },
        ),
        expected_status=201,
    )
    assert _json(client.get(f"/api/v1/evaluation-datasets/{dataset['id']}/samples")) == [
        sample
    ]

    acme = _json(
        client.post(
            f"/api/v1/evaluation-datasets/{dataset['id']}/gold-entities",
            json={
                "sample_id": sample["id"],
                "ontology_class_id": "class-company",
                "label": "Acme Corp",
                "normalized_value": "acme corp",
                "evidence": {
                    "sample_id": sample["id"],
                    "source_id": sample["source_id"],
                    "source_segment_id": sample["source_segment_id"],
                    "locator": "manual:wave28:1",
                    "offset_start": 0,
                    "offset_end": 9,
                    "quote": "Acme Corp",
                },
            },
        ),
        expected_status=201,
    )
    beta = _json(
        client.post(
            f"/api/v1/evaluation-datasets/{dataset['id']}/gold-entities",
            json={
                "sample_id": sample["id"],
                "ontology_class_id": "class-department",
                "label": "Beta Dept",
                "normalized_value": "beta dept",
                "evidence": {
                    "sample_id": sample["id"],
                    "source_id": sample["source_id"],
                    "source_segment_id": sample["source_segment_id"],
                    "locator": "manual:wave28:1",
                    "offset_start": 15,
                    "offset_end": 24,
                    "quote": "Beta Dept",
                },
            },
        ),
        expected_status=201,
    )
    _json(
        client.post(
            f"/api/v1/evaluation-datasets/{dataset['id']}/gold-entities",
            json={
                "sample_id": sample["id"],
                "ontology_class_id": "class-company",
                "label": "Missing LLC",
                "normalized_value": "missing llc",
                "evidence": {
                    "sample_id": sample["id"],
                    "source_id": sample["source_id"],
                    "source_segment_id": sample["source_segment_id"],
                    "locator": "manual:wave28:1",
                    "offset_start": 26,
                    "offset_end": 37,
                    "quote": "Missing LLC",
                },
            },
        ),
        expected_status=201,
    )
    gold_entities = _json(client.get(f"/api/v1/evaluation-datasets/{dataset['id']}/gold-entities"))
    assert [entity["id"] for entity in gold_entities] == [acme["id"], beta["id"], f"{dataset['id']}-gold-entity-3"]
    assert all(entity["evidence"]["sample_id"] == sample["id"] for entity in gold_entities)
    _json(
        client.post(
            f"/api/v1/evaluation-datasets/{dataset['id']}/gold-relations",
            json={
                "sample_id": sample["id"],
                "ontology_relation_id": "relation-owns",
                "source_gold_entity_id": acme["id"],
                "target_gold_entity_id": beta["id"],
                "evidence": {
                    "sample_id": sample["id"],
                    "source_id": sample["source_id"],
                    "source_segment_id": sample["source_segment_id"],
                    "locator": "manual:wave28:1",
                    "offset_start": 0,
                    "offset_end": 24,
                    "quote": "Acme Corp owns Beta Dept",
                },
            },
        ),
        expected_status=201,
    )
    _json(
        client.post(
            f"/api/v1/evaluation-datasets/{dataset['id']}/gold-relations",
            json={
                "sample_id": sample["id"],
                "ontology_relation_id": "relation-mentions",
                "source_gold_entity_id": beta["id"],
                "target_gold_entity_id": acme["id"],
                "evidence": {
                    "sample_id": sample["id"],
                    "source_id": sample["source_id"],
                    "source_segment_id": sample["source_segment_id"],
                    "locator": "manual:wave28:1",
                    "offset_start": 15,
                    "offset_end": 24,
                    "quote": "Beta Dept",
                },
            },
        ),
        expected_status=201,
    )
    gold_relations = _json(
        client.get(f"/api/v1/evaluation-datasets/{dataset['id']}/gold-relations")
    )
    assert len(gold_relations) == 2
    assert {
        (relation["source_gold_entity_id"], relation["target_gold_entity_id"])
        for relation in gold_relations
    } == {(acme["id"], beta["id"]), (beta["id"], acme["id"])}

    run = _json(
        client.post(
            f"/api/v1/projects/{project_id}/evaluation-runs",
            json={
                "dataset_id": dataset["id"],
                "run_mode": "DETERMINISTIC_MOCK",
                "ontology_version_id": ctx["ontology_version_id"],
                "prompt_version_id": "prompt-version-wave28",
                "model_name": "deterministic-mock",
                "parser_version": "parser-wave28-v1",
            },
        ),
        expected_status=201,
    )

    assert run["status"] == "SUCCEEDED"
    assert _json(client.get(f"/api/v1/evaluation-runs/{run['id']}"))["id"] == run["id"]
    runs = _json(client.get(f"/api/v1/projects/{project_id}/evaluation-runs"))
    assert any(item["id"] == run["id"] for item in runs)
    assert run["model_run_id"].startswith(f"{run['id']}-model-run")
    assert run["ontology_version_id"] == ctx["ontology_version_id"]
    assert run["prompt_version_id"] == "prompt-version-wave28"
    assert run["model_name"] == "deterministic-mock"
    assert run["parser_version"] == "parser-wave28-v1"
    assert run["metric_summary"]["ENTITY_PRECISION"] == 0.6667
    assert run["metric_summary"]["RELATION_F1"] == 0.5

    metrics = {
        metric["metric_name"]: metric
        for metric in _json(client.get(f"/api/v1/evaluation-runs/{run['id']}/metrics"))
    }
    assert metrics["ENTITY_PRECISION"] | {
        "value": 0.6667,
        "numerator": 2,
        "denominator": 3,
        "formula": "entity_tp / (entity_tp + entity_fp)",
        "status": "MEASURED",
    } == metrics["ENTITY_PRECISION"]
    assert metrics["ENTITY_RECALL"]["value"] == 0.6667
    assert metrics["ENTITY_F1"]["value"] == 0.6667
    assert metrics["RELATION_PRECISION"]["value"] == 0.5
    assert metrics["RELATION_RECALL"]["value"] == 0.5
    assert metrics["RELATION_F1"]["value"] == 0.5
    assert metrics["RELATION_DIRECTION_ACCURACY"]["value"] == 1.0
    assert metrics["EVIDENCE_MATCH_RATE"]["value"] == 1.0

    errors = _json(client.get(f"/api/v1/evaluation-runs/{run['id']}/errors"))
    assert {error["error_type"] for error in errors} == {
        "MISSING_ENTITY",
        "MISSING_RELATION",
        "EXTRA_ENTITY",
        "EXTRA_RELATION",
    }
    first_error = _json(client.get(f"/api/v1/evaluation-error-cases/{errors[0]['id']}"))
    assert first_error["comparison_summary"]
    assert first_error["gold_evidence"] or first_error["candidate_evidence"]
    assert first_error["candidate_ref"] is not None or first_error["gold_entity_id"] is not None

    extra_entity = next(error for error in errors if error["error_type"] == "EXTRA_ENTITY")
    extra_entity_detail = _json(
        client.get(f"/api/v1/evaluation-error-cases/{extra_entity['id']}")
    )
    entity_ref = extra_entity_detail["candidate_ref"]
    assert REQUIRED_CANDIDATE_REF_FIELDS.issubset(entity_ref)
    assert entity_ref | {
        "candidate_kind": "ENTITY",
        "sample_id": sample["id"],
        "ontology_class_id": "class-extra",
        "label": "Extra Entity",
        "normalized_value": "extra entity",
    } == entity_ref
    assert entity_ref["evidence"]["sample_id"] == sample["id"]

    extra_relation = next(error for error in errors if error["error_type"] == "EXTRA_RELATION")
    extra_relation_detail = _json(
        client.get(f"/api/v1/evaluation-error-cases/{extra_relation['id']}")
    )
    relation_ref = extra_relation_detail["candidate_ref"]
    assert REQUIRED_CANDIDATE_REF_FIELDS.issubset(relation_ref)
    assert relation_ref | {
        "candidate_kind": "RELATION",
        "sample_id": sample["id"],
        "ontology_relation_id": "relation-extra",
        "source_gold_entity_id": beta["id"],
        "target_gold_entity_id": acme["id"],
    } == relation_ref
    assert relation_ref["evidence"]["sample_id"] == sample["id"]

    after = _project_mutation_guard(project_id)
    assert after == before


def test_mvp6_zero_denominator_metrics_are_not_applicable() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    dataset = _json(
        client.post(
            f"/api/v1/projects/{project_id}/evaluation-datasets",
            json={"name": "Empty benchmark", "description": "No samples or gold items"},
        ),
        expected_status=201,
    )
    run = _json(
        client.post(
            f"/api/v1/projects/{project_id}/evaluation-runs",
            json={
                "dataset_id": dataset["id"],
                "run_mode": "DETERMINISTIC_MOCK",
                "ontology_version_id": ctx["ontology_version_id"],
                "prompt_version_id": "prompt-version-empty",
                "model_name": "deterministic-mock",
                "model_run_id": "model-run-empty",
                "parser_version": "parser-empty-v1",
            },
        ),
        expected_status=201,
    )

    metrics = _json(client.get(f"/api/v1/evaluation-runs/{run['id']}/metrics"))
    assert metrics
    assert all(metric["status"] == "NOT_APPLICABLE" for metric in metrics)
    assert all(metric["value"] is None for metric in metrics)
    assert all(metric["denominator"] == 0 for metric in metrics)


def test_mvp6_openapi_artifact_is_json_parseable_when_exported() -> None:
    if MVP6_OPENAPI_PATH.exists():
        schema = json.loads(MVP6_OPENAPI_PATH.read_text(encoding="utf-8"))
        assert schema["openapi"].startswith("3.")
        assert REQUIRED_CANDIDATE_REF_FIELDS.issubset(
            schema["components"]["schemas"]["EvaluationCandidateRef"]["properties"]
        )
