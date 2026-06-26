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
from app.modules.learning import service as learning_service  # noqa: E402
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
MVP6_2_OPENAPI_PATH = REPO_ROOT / "docs/api/openapi-mvp6-2-draft.json"
SUMMARY_FIELDS = {
    "generated_at",
    "source_artifact_scope",
    "signal_counts",
    "open_prompt_suggestion_count",
    "accepted_prompt_suggestion_count",
    "dismissed_prompt_suggestion_count",
    "superseded_prompt_suggestion_count",
    "high_risk_prompt_suggestion_count",
    "auto_approval_preview_count",
}
SOURCE_ARTIFACT_TYPES = {
    "REVIEW_DECISION",
    "REVIEW_CORRECTION",
    "VALIDATION_RESULT",
    "QUALITY_METRIC",
    "QUALITY_DRILLDOWN",
    "EVALUATION_RUN",
    "EVALUATION_METRIC",
    "EVALUATION_ERROR_CASE",
}


def _json(response: Any, expected_status: int = 200) -> Any:
    assert response.status_code == expected_status, response.text
    return response.json()


def _seed() -> dict[str, Any]:
    learning_service.reset_runtime_store()
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


def test_mvp6_2_openapi_exposes_learning_contract() -> None:
    schema = _json(client.get("/api/v1/openapi.json"))
    paths = schema["paths"]
    for path in [
        "/api/v1/projects/{project_id}/learning-signals/summary",
        "/api/v1/projects/{project_id}/learning-signals/correction-patterns",
        "/api/v1/projects/{project_id}/learning-signals/prompt-suggestions",
        "/api/v1/projects/{project_id}/learning-signals/auto-approval-candidates",
        "/api/v1/learning-signal-suggestions/{suggestion_id}/decisions",
    ]:
        assert path in paths

    schemas = schema["components"]["schemas"]
    assert set(schemas["LearningSignalType"]["enum"]) == {
        "RELATION_DIRECTION_CORRECTION",
        "CLASS_CONFUSION",
        "RELATION_TYPE_CONFUSION",
        "EVIDENCE_MISSING",
        "EVIDENCE_MISMATCH",
        "REPEATED_VALIDATION_FAILURE",
        "LOW_BENCHMARK_METRIC_CLUSTER",
    }
    assert set(schemas["LearningSourceArtifactType"]["enum"]) == SOURCE_ARTIFACT_TYPES
    assert schemas["SuggestionDecisionType"]["enum"] == ["ACCEPT", "DISMISS"]
    assert schemas["PromptSuggestionState"]["enum"] == [
        "SUGGESTED",
        "ACCEPTED",
        "DISMISSED",
        "SUPERSEDED",
    ]
    assert SUMMARY_FIELDS.issubset(
        schemas["LearningSignalSummaryResponse"]["properties"]
    )
    auto_preview_properties = schemas["AutoApprovalCandidatePreview"]["properties"]
    assert {"id", "historical_match_preview", "source_artifacts", "supporting_metrics", "safety_note"}.issubset(
        auto_preview_properties
    )
    assert "evidence_quality_summary" not in auto_preview_properties


def test_mvp6_2_learning_happy_path_and_decision_audit_preserve_graph_state() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    before = _project_mutation_guard(project_id)

    summary = _json(client.get(f"/api/v1/projects/{project_id}/learning-signals/summary"))
    assert summary["project_id"] == project_id
    assert SUMMARY_FIELDS.issubset(summary)
    assert "EVALUATION_METRIC" in summary["source_artifact_scope"]
    assert summary["open_prompt_suggestion_count"] == 1
    assert summary["superseded_prompt_suggestion_count"] == 1
    assert summary["high_risk_prompt_suggestion_count"] == 1

    patterns = _json(
        client.get(f"/api/v1/projects/{project_id}/learning-signals/correction-patterns")
    )
    assert len(patterns) == 1
    pattern = patterns[0]
    assert pattern["source_artifacts"]
    assert pattern["source_artifacts"][0]["artifact_type"] == "REVIEW_CORRECTION"

    suggestions = _json(
        client.get(f"/api/v1/projects/{project_id}/learning-signals/prompt-suggestions")
    )
    suggested = next(item for item in suggestions if item["state"] == "SUGGESTED")
    assert suggested["id"] in pattern["prompt_suggestion_ids"]
    assert suggested["decision_audit_note"] is None

    auto_previews = _json(
        client.get(
            f"/api/v1/projects/{project_id}/learning-signals/auto-approval-candidates"
        )
    )
    assert len(auto_previews) == 1
    auto_preview = auto_previews[0]
    assert auto_preview["recommendation_only"] is True
    assert auto_preview["not_enforced"] is True
    assert auto_preview["requires_later_policy_approval"] is True
    assert "PUBLISH_GRAPH" in auto_preview["blocked_actions"]
    assert "historical_match_preview" in auto_preview
    assert "evidence_quality_summary" not in auto_preview

    decision = _json(
        client.post(
            f"/api/v1/learning-signal-suggestions/{suggested['id']}/decisions",
            json={
                "decision": "ACCEPT",
                "note": "Use this as a prompt drafting input.",
                "intended_next_action": "USE_IN_NEXT_PROMPT_DRAFT",
            },
        ),
        expected_status=201,
    )
    assert decision["previous_state"] == "SUGGESTED"
    assert decision["new_state"] == "ACCEPTED"
    audit_note = decision["decision_audit_note"]
    assert audit_note["decision"] == "ACCEPT"
    assert audit_note["mutation_guard"] == {
        "prompt_version_mutated": False,
        "candidate_graph_mutated": False,
        "published_graph_mutated": False,
        "auto_approval_policy_mutated": False,
        "extraction_job_started": False,
        "evaluation_run_started": False,
    }

    updated_suggestions = _json(
        client.get(f"/api/v1/projects/{project_id}/learning-signals/prompt-suggestions")
    )
    accepted = next(item for item in updated_suggestions if item["id"] == suggested["id"])
    assert accepted["state"] == "ACCEPTED"
    assert accepted["decision_audit_note"]["id"] == audit_note["id"]

    conflict = _json(
        client.post(
            f"/api/v1/learning-signal-suggestions/{suggested['id']}/decisions",
            json={"decision": "DISMISS", "dismiss_reason_code": "DUPLICATE"},
        ),
        expected_status=409,
    )
    assert conflict["error"]["code"] == "PROMPT_SUGGESTION_DECISION_CONFLICT"
    assert _project_mutation_guard(project_id) == before


def test_mvp6_2_decision_validation_guards() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    suggestions = _json(
        client.get(f"/api/v1/projects/{project_id}/learning-signals/prompt-suggestions")
    )
    suggested = next(item for item in suggestions if item["state"] == "SUGGESTED")

    missing_reason = _json(
        client.post(
            f"/api/v1/learning-signal-suggestions/{suggested['id']}/decisions",
            json={"decision": "DISMISS"},
        ),
        expected_status=400,
    )
    assert missing_reason["error"]["code"] == "DISMISS_REASON_REQUIRED"

    reason_on_accept = _json(
        client.post(
            f"/api/v1/learning-signal-suggestions/{suggested['id']}/decisions",
            json={"decision": "ACCEPT", "dismiss_reason_code": "OTHER"},
        ),
        expected_status=400,
    )
    assert reason_on_accept["error"]["code"] == "DISMISS_REASON_NOT_ALLOWED"

    dismissed = _json(
        client.post(
            f"/api/v1/learning-signal-suggestions/{suggested['id']}/decisions",
            json={
                "decision": "DISMISS",
                "dismiss_reason_code": "INSUFFICIENT_EVIDENCE",
                "note": "Wait for more traces.",
            },
        ),
        expected_status=201,
    )
    assert dismissed["new_state"] == "DISMISSED"


def test_mvp6_2_dismiss_other_reason_requires_note() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    suggestions = _json(
        client.get(f"/api/v1/projects/{project_id}/learning-signals/prompt-suggestions")
    )
    suggested = next(item for item in suggestions if item["state"] == "SUGGESTED")

    missing_note = _json(
        client.post(
            f"/api/v1/learning-signal-suggestions/{suggested['id']}/decisions",
            json={"decision": "DISMISS", "dismiss_reason_code": "OTHER"},
        ),
        expected_status=400,
    )
    assert missing_note["error"]["code"] == "DECISION_NOTE_REQUIRED"

    ok = _json(
        client.post(
            f"/api/v1/learning-signal-suggestions/{suggested['id']}/decisions",
            json={
                "decision": "DISMISS",
                "dismiss_reason_code": "OTHER",
                "note": "Domain owner asked to defer this.",
            },
        ),
        expected_status=201,
    )
    assert ok["new_state"] == "DISMISSED"


def test_mvp6_2_decision_on_unknown_suggestion_returns_404() -> None:
    _seed()
    not_found = _json(
        client.post(
            "/api/v1/learning-signal-suggestions/does-not-exist/decisions",
            json={"decision": "ACCEPT"},
        ),
        expected_status=404,
    )
    assert not_found["error"]["code"] == "PROMPT_SUGGESTION_NOT_FOUND"


def test_mvp6_2_summary_404_for_unknown_project() -> None:
    _seed()
    resp = client.get("/api/v1/projects/unknown-project-id/learning-signals/summary")
    assert resp.status_code == 404, resp.text
    assert resp.json()["error"]["code"] == "PROJECT_NOT_FOUND"


def test_mvp6_2_dto_field_names_match_frozen_contract() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]

    patterns = _json(
        client.get(f"/api/v1/projects/{project_id}/learning-signals/correction-patterns")
    )
    pattern = patterns[0]
    # Frozen contract uses ontology_class_id / ontology_relation_id, not class_id / relation_id.
    assert {"ontology_class_id", "label"} == set(pattern["affected_classes"][0])
    assert {"ontology_relation_id", "label"} == set(pattern["affected_relations"][0])

    schema = _json(client.get("/api/v1/openapi.json"))
    schemas = schema["components"]["schemas"]
    assert set(schemas["OntologyClassRef"]["properties"]) == {"ontology_class_id", "label"}
    assert set(schemas["OntologyRelationRef"]["properties"]) == {
        "ontology_relation_id",
        "label",
    }
    # LearningEvidenceRef must not expose an evidence_id field beyond the frozen draft.
    assert "evidence_id" not in schemas["LearningEvidenceRef"]["properties"]

    # Runtime OpenAPI MVP6.2 schema field names must equal the frozen planning draft.
    frozen = json.loads(MVP6_2_OPENAPI_PATH.read_text())["components"]["schemas"]
    for name in [
        "OntologyClassRef",
        "OntologyRelationRef",
        "LearningEvidenceRef",
        "LearningSourceArtifactRef",
        "CorrectionPattern",
        "PromptSuggestion",
        "AutoApprovalCandidatePreview",
        "LearningSignalSummaryResponse",
        "SuggestionDecisionResponse",
        "SuggestionDecisionAuditNote",
        "MutationGuard",
    ]:
        assert set(schemas[name]["properties"]) == set(
            frozen[name]["properties"]
        ), name
