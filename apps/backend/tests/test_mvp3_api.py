import os
from typing import Any

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["LOCAL_STORAGE_PATH"] = "/private/tmp/ontology-platform-backend-test-storage"

from fastapi.testclient import TestClient  # noqa: E402

from app.core.enums import CandidateReviewStatus  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.modules.candidate.models import (  # noqa: E402
    CandidateEntity as CandidateEntityModel,
)
from app.modules.candidate.models import (  # noqa: E402
    CandidateRelation as CandidateRelationModel,
)

Base.metadata.create_all(bind=engine)
client = TestClient(app)


def test_mvp3_openapi_exposes_frozen_runtime_contract() -> None:
    schema = client.get("/api/v1/openapi.json").json()
    paths = schema["paths"]

    for path in [
        "/api/v1/projects/{project_id}/validation-jobs",
        "/api/v1/validation-jobs/{validation_job_id}/results",
        "/api/v1/projects/{project_id}/review-tasks",
        "/api/v1/review-tasks/{review_task_id}/decisions",
        "/api/v1/candidates/{candidate_kind}/{candidate_id}/corrections",
        "/api/v1/projects/{project_id}/audit-logs",
        "/api/v1/projects/{project_id}/publish-candidates",
        "/api/v1/projects/{project_id}/publish-jobs",
        "/api/v1/publish-jobs/{publish_job_id}/run",
        "/api/v1/projects/{project_id}/published-graph/current",
        "/api/v1/projects/{project_id}/quality/summary",
    ]:
        assert path in paths

    schemas = schema["components"]["schemas"]
    assert schemas["ValidationResultSeverity"]["enum"] == ["INFO", "WARNING", "FAILED"]
    assert schemas["ReviewDecisionType"]["enum"] == [
        "APPROVE",
        "REJECT",
        "REQUEST_CHANGES",
        "MODIFY_AND_APPROVE",
    ]
    assert schemas["PublishEligibilityReasonCode"]["enum"] == [
        "ELIGIBLE",
        "NOT_APPROVED_OR_MODIFIED",
        "PENDING",
        "REJECTED",
        "NEEDS_DISCUSSION",
        "MISSING_EVIDENCE",
        "BROKEN_EVIDENCE",
        "FAILED_VALIDATION",
        "WARNING_REASON_REQUIRED",
        "ALREADY_PUBLISHED",
        "ONTOLOGY_VERSION_MISMATCH",
        "PUBLISH_PERMISSION_REQUIRED",
        "CORRECTION_DIFF_REQUIRED",
    ]

    review_list = schemas["ReviewTaskListResponse"]["properties"]
    assert set(review_list) == {"items", "total_count", "limit", "offset"}
    validation_result = schemas["ValidationResult"]["properties"]
    assert {"field_path", "blocking", "suggested_fix"}.issubset(validation_result)
    quality = schemas["QualitySummary"]["properties"]
    assert {
        "candidate_counts",
        "validation_counts",
        "review_counts",
        "publish_counts",
        "rates",
    }.issubset(quality)


def test_mvp3_review_decisions_corrections_and_audit_trail() -> None:
    ctx = _create_extraction_context("MVP3 Review Flow", "default")
    low_confidence_entity_id = ctx["entity_ids"][0]
    relation_id = ctx["relation_ids"][0]
    _set_entity_confidence(low_confidence_entity_id, 0.6)

    validation = client.post(
        f"/api/v1/projects/{ctx['project_id']}/validation-jobs",
        json={
            "ontology_version_id": ctx["ontology_version_id"],
            "candidate_refs": [
                {"candidate_kind": "ENTITY", "candidate_id": low_confidence_entity_id},
                {"candidate_kind": "RELATION", "candidate_id": relation_id},
            ],
        },
    )
    assert validation.status_code == 201
    assert validation.json()["summary"]["warning_count"] == 2

    tasks_response = client.post(
        f"/api/v1/projects/{ctx['project_id']}/review-tasks",
        json={
            "candidate_refs": [
                {"candidate_kind": "ENTITY", "candidate_id": low_confidence_entity_id},
                {"candidate_kind": "RELATION", "candidate_id": relation_id},
            ]
        },
    )
    assert tasks_response.status_code == 201
    tasks = tasks_response.json()
    entity_task_id = _task_id(tasks, "ENTITY", low_confidence_entity_id)
    relation_task_id = _task_id(tasks, "RELATION", relation_id)

    missing_reason = client.post(
        f"/api/v1/review-tasks/{entity_task_id}/decisions",
        json={"decision": "APPROVE"},
    )
    assert missing_reason.status_code == 409
    assert missing_reason.json()["error"]["code"] == "REASON_REQUIRED"

    approved_warning = client.post(
        f"/api/v1/review-tasks/{entity_task_id}/decisions",
        json={"decision": "APPROVE", "reason": "Low confidence accepted from evidence."},
    )
    assert approved_warning.status_code == 201
    assert approved_warning.json()["resulting_review_status"] == "APPROVED"
    assert approved_warning.json()["publish_eligibility"]["reasons"] == ["ELIGIBLE"]

    missing_diff = client.post(
        f"/api/v1/review-tasks/{relation_task_id}/decisions",
        json={"decision": "MODIFY_AND_APPROVE", "reason": "Direction needs normalization."},
    )
    assert missing_diff.status_code == 409
    assert missing_diff.json()["error"]["code"] == "CORRECTION_DIFF_REQUIRED"

    modified = client.post(
        f"/api/v1/review-tasks/{relation_task_id}/decisions",
        json={
            "decision": "MODIFY_AND_APPROVE",
            "reason": "Use the corrected relation label.",
            "corrected_payload": {
                "relation_id": ctx["relation_definition_id"],
                "source_candidate_entity_id": ctx["entity_ids"][0],
                "target_candidate_entity_id": ctx["entity_ids"][1],
                "properties": {"review_note": "normalized relation"},
                "evidence_ids": [],
            },
        },
    )
    assert modified.status_code == 201
    modified_body = modified.json()
    assert modified_body["resulting_review_status"] == "MODIFIED"
    assert modified_body["correction_id"]
    assert modified_body["correction_diff"]

    corrections = client.get(f"/api/v1/candidates/RELATION/{relation_id}/corrections")
    assert corrections.status_code == 200
    correction = corrections.json()[0]
    assert correction["base_candidate_snapshot"]["raw_payload"]["fixture_id"] == "default"
    assert correction["corrected_payload"]["properties"]["review_note"] == "normalized relation"

    relation_after = client.get(
        f"/api/v1/extraction-jobs/{ctx['job_id']}/candidates/relations"
    ).json()[0]
    assert relation_after["raw_payload"]["fixture_id"] == "default"
    assert relation_after["review_status"] == "MODIFIED"

    audit = client.get(f"/api/v1/candidates/RELATION/{relation_id}/audit-logs")
    assert audit.status_code == 200
    event_types = [event["event_type"] for event in audit.json()]
    assert "CORRECTION_SUBMITTED" in event_types
    assert "REVIEW_DECISION_RECORDED" in event_types
    assert audit.json()[-1]["reason"] == "Use the corrected relation label."


def test_mvp3_publish_rules_published_graph_and_quality_summary() -> None:
    primary = _create_extraction_context("MVP3 Publish Primary", "default")
    _validate_candidates(primary)
    _review_candidates(
        primary,
        [
            ("ENTITY", primary["entity_ids"][0], "APPROVE", None, None),
            ("ENTITY", primary["entity_ids"][1], "APPROVE", None, None),
            (
                "RELATION",
                primary["relation_ids"][0],
                "MODIFY_AND_APPROVE",
                "Relation endpoint correction accepted.",
                {
                    "relation_id": primary["relation_definition_id"],
                    "source_candidate_entity_id": primary["entity_ids"][0],
                    "target_candidate_entity_id": primary["entity_ids"][1],
                    "properties": {"review_note": "published from correction"},
                    "evidence_ids": [],
                },
            ),
        ],
    )

    warning = _create_extraction_context("MVP3 Publish Warning", "default", base=primary)
    _set_entity_confidence(warning["entity_ids"][0], 0.6)
    _validate_candidates(warning)
    _review_candidates(
        warning,
        [
            (
                "ENTITY",
                warning["entity_ids"][0],
                "APPROVE",
                "Warning accepted because evidence is sufficient.",
                None,
            )
        ],
    )
    _force_relation_review_status(warning["relation_ids"][0], CandidateReviewStatus.APPROVED)

    missing = _create_extraction_context("MVP3 Publish Missing Evidence", "partial_invalid", base=primary)
    _validate_candidates(missing)
    missing_evidence_id = missing["entity_ids"][-1]
    _review_candidates(
        missing,
        [("ENTITY", missing_evidence_id, "APPROVE", "Accept for review only.", None)],
    )

    broken = _create_extraction_context(
        "MVP3 Publish Broken Evidence",
        "invalid_evidence_reference",
        base=primary,
    )
    _validate_candidates(broken)
    broken_evidence_id = broken["entity_ids"][-1]
    _review_candidates(
        broken,
        [
            ("ENTITY", broken_evidence_id, "APPROVE", None, None),
            ("ENTITY", broken["entity_ids"][1], "REJECT", "Not an entity.", None),
            (
                "RELATION",
                broken["relation_ids"][0],
                "REQUEST_CHANGES",
                "Needs source review.",
                None,
            ),
        ],
    )

    all_refs = [
        {"candidate_kind": "ENTITY", "candidate_id": primary["entity_ids"][0]},
        {"candidate_kind": "ENTITY", "candidate_id": primary["entity_ids"][1]},
        {"candidate_kind": "RELATION", "candidate_id": primary["relation_ids"][0]},
        {"candidate_kind": "ENTITY", "candidate_id": warning["entity_ids"][0]},
        {"candidate_kind": "RELATION", "candidate_id": warning["relation_ids"][0]},
        {"candidate_kind": "ENTITY", "candidate_id": warning["entity_ids"][1]},
        {"candidate_kind": "ENTITY", "candidate_id": missing_evidence_id},
        {"candidate_kind": "ENTITY", "candidate_id": broken_evidence_id},
        {"candidate_kind": "ENTITY", "candidate_id": broken["entity_ids"][1]},
        {"candidate_kind": "RELATION", "candidate_id": broken["relation_ids"][0]},
    ]

    eligibility_response = client.get(f"/api/v1/projects/{primary['project_id']}/publish-candidates")
    assert eligibility_response.status_code == 200
    eligibility = {row["candidate_id"]: row for row in eligibility_response.json()}

    assert eligibility[primary["entity_ids"][0]]["reasons"] == ["ELIGIBLE"]
    assert eligibility[primary["relation_ids"][0]]["reasons"] == ["ELIGIBLE"]
    assert eligibility[warning["entity_ids"][0]]["reasons"] == ["ELIGIBLE"]
    assert eligibility[warning["relation_ids"][0]]["reasons"] == ["WARNING_REASON_REQUIRED"]
    assert eligibility[warning["entity_ids"][1]]["reasons"] == ["PENDING"]
    assert eligibility[missing_evidence_id]["reasons"] == ["MISSING_EVIDENCE"]
    assert set(eligibility[broken_evidence_id]["reasons"]) == {
        "BROKEN_EVIDENCE",
        "FAILED_VALIDATION",
    }
    assert eligibility[broken["entity_ids"][1]]["reasons"] == ["REJECTED"]
    assert eligibility[broken["relation_ids"][0]]["reasons"] == ["NEEDS_DISCUSSION"]

    job_response = client.post(
        f"/api/v1/projects/{primary['project_id']}/publish-jobs",
        json={"ontology_version_id": primary["ontology_version_id"], "candidate_refs": all_refs},
    )
    assert job_response.status_code == 201
    run_response = client.post(f"/api/v1/publish-jobs/{job_response.json()['id']}/run")
    assert run_response.status_code == 200
    run = run_response.json()
    assert run["published_entity_count"] == 3
    assert run["published_relation_count"] == 1
    assert run["skipped_count"] == 6
    assert run["published_graph_version_id"]

    current = client.get(f"/api/v1/projects/{primary['project_id']}/published-graph/current")
    assert current.status_code == 200
    snapshot = current.json()
    assert snapshot["version"]["is_current"] is True
    assert len(snapshot["entities"]) == 3
    assert len(snapshot["relations"]) == 1
    published_candidate_ids = {
        entity["lineage"]["candidate_id"] for entity in snapshot["entities"]
    } | {relation["lineage"]["candidate_id"] for relation in snapshot["relations"]}
    assert missing_evidence_id not in published_candidate_ids
    assert broken_evidence_id not in published_candidate_ids
    assert warning["relation_ids"][0] not in published_candidate_ids
    assert snapshot["relations"][0]["corrected_snapshot"]["properties"]["review_note"] == (
        "published from correction"
    )

    repeated = client.get(f"/api/v1/projects/{primary['project_id']}/publish-candidates")
    repeated_rows = {row["candidate_id"]: row for row in repeated.json()}
    assert repeated_rows[primary["entity_ids"][0]]["reasons"] == ["ALREADY_PUBLISHED"]

    quality = client.get(f"/api/v1/projects/{primary['project_id']}/quality/summary")
    assert quality.status_code == 200
    summary = quality.json()
    assert summary["candidate_counts"]["total"]["value"] >= 10
    assert summary["review_counts"]["approved"]["value"] >= 3
    assert summary["publish_counts"]["published_entities"]["value"] == 3
    assert summary["publish_counts"]["published_relations"]["value"] == 1
    assert summary["rates"]["published_ratio"]["denominator"] == summary["candidate_counts"][
        "total"
    ]["value"]
    assert summary["rates"]["approval_rate"]["drilldown"]["target"] == "review_inbox"

    audit = client.get(f"/api/v1/projects/{primary['project_id']}/audit-logs")
    assert audit.status_code == 200
    event_types = [event["event_type"] for event in audit.json()]
    assert "VALIDATION_JOB_CREATED" in event_types
    assert "PUBLISH_JOB_COMPLETED" in event_types
    assert "PUBLISHED_GRAPH_VERSION_CREATED" in event_types


def test_mvp3_publish_job_webhook_delivered(monkeypatch: Any) -> None:
    import app.modules.publish.service as publish_service

    class _FakeResponse:
        def raise_for_status(self) -> None:
            return None

    monkeypatch.setattr(publish_service.httpx, "post", lambda *args, **kwargs: _FakeResponse())

    ctx = _create_extraction_context("MVP3 Publish Webhook Delivered", "default")
    _validate_candidates(ctx)
    _review_candidates(ctx, [("ENTITY", ctx["entity_ids"][0], "APPROVE", None, None)])

    job_response = client.post(
        f"/api/v1/projects/{ctx['project_id']}/publish-jobs",
        json={
            "ontology_version_id": ctx["ontology_version_id"],
            "candidate_refs": [{"candidate_kind": "ENTITY", "candidate_id": ctx["entity_ids"][0]}],
            "notify_webhook_url": "https://example.test/hooks/publish",
        },
    )
    assert job_response.status_code == 201
    assert job_response.json()["notify_webhook_url"] == "https://example.test/hooks/publish"

    run_response = client.post(f"/api/v1/publish-jobs/{job_response.json()['id']}/run")
    assert run_response.status_code == 200
    run = run_response.json()
    assert run["webhook_delivery_status"] == "DELIVERED"
    assert run["webhook_delivered_at"]
    assert run["webhook_error_message"] is None

    audit = client.get(f"/api/v1/projects/{ctx['project_id']}/audit-logs")
    event_types = [event["event_type"] for event in audit.json()]
    assert "PUBLISH_JOB_WEBHOOK_DELIVERED" in event_types


def test_mvp3_publish_job_webhook_failure_does_not_break_publish(monkeypatch: Any) -> None:
    import app.modules.publish.service as publish_service

    def _raise(*args: Any, **kwargs: Any) -> None:
        raise publish_service.httpx.ConnectError("connection refused")

    monkeypatch.setattr(publish_service.httpx, "post", _raise)

    ctx = _create_extraction_context("MVP3 Publish Webhook Failed", "default")
    _validate_candidates(ctx)
    _review_candidates(ctx, [("ENTITY", ctx["entity_ids"][0], "APPROVE", None, None)])

    job_response = client.post(
        f"/api/v1/projects/{ctx['project_id']}/publish-jobs",
        json={
            "ontology_version_id": ctx["ontology_version_id"],
            "candidate_refs": [{"candidate_kind": "ENTITY", "candidate_id": ctx["entity_ids"][0]}],
            "notify_webhook_url": "https://unreachable.test/hooks/publish",
        },
    )
    assert job_response.status_code == 201

    run_response = client.post(f"/api/v1/publish-jobs/{job_response.json()['id']}/run")
    assert run_response.status_code == 200
    run = run_response.json()
    assert run["status"] == "SUCCESS"
    assert run["published_entity_count"] == 1
    assert run["webhook_delivery_status"] == "FAILED"
    assert run["webhook_error_message"]

    audit = client.get(f"/api/v1/projects/{ctx['project_id']}/audit-logs")
    event_types = [event["event_type"] for event in audit.json()]
    assert "PUBLISH_JOB_WEBHOOK_FAILED" in event_types


def test_mvp3_seed_helper_outputs_frontend_smoke_fixture() -> None:
    from scripts.seed_mvp3 import seed_mvp3

    output = seed_mvp3()

    assert output["project_id"] == "project-corp-knowledge"
    assert output["review_task_id"]
    assert output["publish_job_id"]
    assert output["published_graph_version_id"]
    assert output["recommended_frontend_routes"] == [
        "/projects/project-corp-knowledge/review",
        f"/projects/project-corp-knowledge/review/{output['review_task_id']}",
        "/projects/project-corp-knowledge/publish",
        "/projects/project-corp-knowledge/published-graph",
        "/projects/project-corp-knowledge/quality",
    ]

    project_id = output["project_id"]
    review_tasks = client.get(f"/api/v1/projects/{project_id}/review-tasks")
    assert review_tasks.status_code == 200
    assert review_tasks.json()["total_count"] >= 1

    review_task = client.get(f"/api/v1/review-tasks/{output['review_task_id']}")
    assert review_task.status_code == 200

    eligibility = client.get(f"/api/v1/projects/{project_id}/publish-candidates")
    assert eligibility.status_code == 200
    reason_sets = [set(row["reasons"]) for row in eligibility.json()]
    assert {"ELIGIBLE"} in reason_sets
    assert any(reasons - {"ELIGIBLE", "ALREADY_PUBLISHED"} for reasons in reason_sets)

    current = client.get(f"/api/v1/projects/{project_id}/published-graph/current")
    assert current.status_code == 200
    assert current.json()["version"]["id"] == output["published_graph_version_id"]
    assert current.json()["entities"]

    quality = client.get(f"/api/v1/projects/{project_id}/quality/summary")
    assert quality.status_code == 200
    assert quality.json()["candidate_counts"]["total"]["value"] >= 1


def _create_extraction_context(
    name: str,
    fixture_id: str,
    *,
    base: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if base is None:
        project_response = client.post(
            "/api/v1/projects",
            json={"name": name, "description": f"{fixture_id} MVP3 fixture"},
        )
        assert project_response.status_code == 201
        project_id = project_response.json()["id"]

        version_response = client.post(f"/api/v1/projects/{project_id}/ontology/versions")
        assert version_response.status_code == 201
        version_id = version_response.json()["id"]
        company_id = client.post(
            f"/api/v1/ontology/versions/{version_id}/classes",
            json={"name": "Company", "label": "Company", "position": {"x": 100, "y": 100}},
        ).json()["id"]
        department_id = client.post(
            f"/api/v1/ontology/versions/{version_id}/classes",
            json={"name": "Department", "label": "Department", "position": {"x": 300, "y": 100}},
        ).json()["id"]
        relation_id = client.post(
            f"/api/v1/ontology/versions/{version_id}/relations",
            json={
                "name": "HAS_DEPARTMENT",
                "label": "Has Department",
                "domain_class_id": company_id,
                "range_class_id": department_id,
                "cardinality": "ONE_TO_MANY",
            },
        ).json()["id"]
    else:
        project_id = base["project_id"]
        version_id = base["ontology_version_id"]
        relation_id = base["relation_definition_id"]

    source_response = client.post(
        f"/api/v1/projects/{project_id}/sources/upload",
        data={"source_type": "CSV"},
        files={
            "file": (
                f"{name.casefold().replace(' ', '-')}.csv",
                b"company_name,department_name\nAcme Corp,Research\nBeta LLC,Sales\n",
                "text/csv",
            )
        },
    )
    assert source_response.status_code == 201
    source_id = source_response.json()["id"]
    assert client.post(f"/api/v1/sources/{source_id}/parse").status_code == 200

    prompt_response = client.post(
        f"/api/v1/projects/{project_id}/prompts",
        json={"name": f"{name} prompt", "description": "MVP3 prompt"},
    )
    assert prompt_response.status_code == 201
    prompt_version_response = client.post(
        f"/api/v1/prompts/{prompt_response.json()['id']}/versions",
        json={"template": "Extract candidates.", "output_schema": {"type": "object"}},
    )
    assert prompt_version_response.status_code == 201

    job_response = client.post(
        f"/api/v1/projects/{project_id}/extraction-jobs",
        json={
            "source_id": source_id,
            "ontology_version_id": version_id,
            "prompt_version_id": prompt_version_response.json()["id"],
            "fixture_id": fixture_id,
        },
    )
    assert job_response.status_code == 201
    job_id = job_response.json()["id"]
    run_response = client.post(f"/api/v1/extraction-jobs/{job_id}/run")
    assert run_response.status_code == 200

    entities = client.get(f"/api/v1/extraction-jobs/{job_id}/candidates/entities").json()
    relations = client.get(f"/api/v1/extraction-jobs/{job_id}/candidates/relations").json()
    return {
        "project_id": project_id,
        "ontology_version_id": version_id,
        "job_id": job_id,
        "relation_definition_id": relation_id,
        "entity_ids": [entity["id"] for entity in entities],
        "relation_ids": [relation["id"] for relation in relations],
    }


def _validate_candidates(ctx: dict[str, Any]) -> None:
    refs = [
        {"candidate_kind": "ENTITY", "candidate_id": candidate_id}
        for candidate_id in ctx["entity_ids"]
    ] + [
        {"candidate_kind": "RELATION", "candidate_id": candidate_id}
        for candidate_id in ctx["relation_ids"]
    ]
    response = client.post(
        f"/api/v1/projects/{ctx['project_id']}/validation-jobs",
        json={"ontology_version_id": ctx["ontology_version_id"], "candidate_refs": refs},
    )
    assert response.status_code == 201


def _review_candidates(ctx: dict[str, Any], decisions: list[tuple]) -> None:
    refs = [
        {"candidate_kind": kind, "candidate_id": candidate_id}
        for kind, candidate_id, _, _, _ in decisions
    ]
    tasks_response = client.post(
        f"/api/v1/projects/{ctx['project_id']}/review-tasks",
        json={"candidate_refs": refs},
    )
    assert tasks_response.status_code == 201
    tasks = tasks_response.json()
    for kind, candidate_id, decision, reason, corrected_payload in decisions:
        payload = {"decision": decision}
        if reason is not None:
            payload["reason"] = reason
        if corrected_payload is not None:
            payload["corrected_payload"] = corrected_payload
        task_id = _task_id(tasks, kind, candidate_id)
        response = client.post(f"/api/v1/review-tasks/{task_id}/decisions", json=payload)
        assert response.status_code == 201


def _task_id(tasks: list[dict[str, Any]], kind: str, candidate_id: str) -> str:
    for task in tasks:
        if task["candidate_kind"] == kind and task["candidate_id"] == candidate_id:
            return task["id"]
    raise AssertionError(f"Task not found for {kind}:{candidate_id}")


def _set_entity_confidence(candidate_id: str, confidence: float) -> None:
    with SessionLocal() as db:
        candidate = db.get(CandidateEntityModel, candidate_id)
        assert candidate is not None
        candidate.confidence = confidence
        db.add(candidate)
        db.commit()


def _force_relation_review_status(
    candidate_id: str, review_status: CandidateReviewStatus
) -> None:
    with SessionLocal() as db:
        candidate = db.get(CandidateRelationModel, candidate_id)
        assert candidate is not None
        candidate.review_status = review_status
        db.add(candidate)
        db.commit()
