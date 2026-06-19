from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import delete, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.enums import CandidateReviewStatus, ProjectStatus
from app.db.session import SessionLocal
from app.main import app
from app.modules.audit.models import AuditLog
from app.modules.candidate.models import CandidateEntity, CandidateEvidence, CandidateRelation
from app.modules.extraction.models import ExtractionJob, ModelRun
from app.modules.ontology.models import OntologyClass, OntologyProperty, OntologyRelation, OntologyVersion
from app.modules.project.models import Project
from app.modules.prompt.models import PromptTemplate, PromptVersion
from app.modules.publish.models import PublishedEntity, PublishedGraphVersion, PublishedRelation, PublishJob
from app.modules.review.models import CandidateCorrection, ReviewDecision, ReviewTask
from app.modules.source.models import SourceData, SourceProfile, SourceSegment
from app.modules.validation.models import ValidationJob, ValidationResult

PROJECT_ID = "project-corp-knowledge"
PROJECT_NAME = "Corporate Knowledge MVP3 Smoke"

client = TestClient(app)


def seed_mvp3(*, reset: bool = True) -> dict[str, Any]:
    if reset:
        _reset_project()
    else:
        _ensure_project()

    primary = _create_extraction_context("MVP3 Smoke Primary", "default")
    _validate_candidates(primary)
    primary_task_ids = _review_candidates(
        primary,
        [
            ("ENTITY", primary["entity_ids"][0], "APPROVE", None, None),
            ("ENTITY", primary["entity_ids"][1], "APPROVE", None, None),
            (
                "RELATION",
                primary["relation_ids"][0],
                "MODIFY_AND_APPROVE",
                "Relation endpoint correction accepted for smoke publish.",
                {
                    "relation_id": primary["relation_definition_id"],
                    "source_candidate_entity_id": primary["entity_ids"][0],
                    "target_candidate_entity_id": primary["entity_ids"][1],
                    "properties": {"review_note": "published from MVP3 seed correction"},
                    "evidence_ids": [],
                },
            ),
        ],
    )

    warning = _create_extraction_context("MVP3 Smoke Warning", "default", base=primary)
    _set_entity_confidence(warning["entity_ids"][0], 0.6)
    _validate_candidates(warning)
    _review_candidates(
        warning,
        [
            (
                "ENTITY",
                warning["entity_ids"][0],
                "APPROVE",
                "Warning accepted because source evidence is sufficient for smoke.",
                None,
            )
        ],
    )
    warning_relation_task_id = _create_review_tasks(
        warning,
        [{"candidate_kind": "RELATION", "candidate_id": warning["relation_ids"][0]}],
    )[0]["id"]
    _force_relation_review_status(warning["relation_ids"][0], CandidateReviewStatus.APPROVED)

    missing = _create_extraction_context("MVP3 Smoke Missing Evidence", "partial_invalid", base=primary)
    _validate_candidates(missing)
    missing_evidence_id = missing["entity_ids"][-1]
    _review_candidates(
        missing,
        [("ENTITY", missing_evidence_id, "APPROVE", "Accept for review only.", None)],
    )

    broken = _create_extraction_context(
        "MVP3 Smoke Broken Evidence",
        "invalid_evidence_reference",
        base=primary,
    )
    _validate_candidates(broken)
    broken_evidence_id = broken["entity_ids"][-1]
    _review_candidates(
        broken,
        [
            ("ENTITY", broken_evidence_id, "APPROVE", None, None),
            ("ENTITY", broken["entity_ids"][1], "REJECT", "Not a usable entity.", None),
            (
                "RELATION",
                broken["relation_ids"][0],
                "REQUEST_CHANGES",
                "Needs source review before publishing.",
                None,
            ),
        ],
    )

    publish_refs = [
        {"candidate_kind": "ENTITY", "candidate_id": primary["entity_ids"][0]},
        {"candidate_kind": "ENTITY", "candidate_id": primary["entity_ids"][1]},
        {"candidate_kind": "RELATION", "candidate_id": primary["relation_ids"][0]},
        {"candidate_kind": "RELATION", "candidate_id": warning["relation_ids"][0]},
        {"candidate_kind": "ENTITY", "candidate_id": warning["entity_ids"][1]},
        {"candidate_kind": "ENTITY", "candidate_id": missing_evidence_id},
        {"candidate_kind": "ENTITY", "candidate_id": broken_evidence_id},
        {"candidate_kind": "ENTITY", "candidate_id": broken["entity_ids"][1]},
        {"candidate_kind": "RELATION", "candidate_id": broken["relation_ids"][0]},
    ]
    job = _request(
        "post",
        f"/api/v1/projects/{PROJECT_ID}/publish-jobs",
        expected_status=201,
        json={"ontology_version_id": primary["ontology_version_id"], "candidate_refs": publish_refs},
    )
    run = _request("post", f"/api/v1/publish-jobs/{job['id']}/run")

    checks = _smoke_checks(
        review_task_id=warning_relation_task_id,
        publish_job_id=run["id"],
        published_graph_version_id=run["published_graph_version_id"],
    )
    return {
        "project_id": PROJECT_ID,
        "project_name": PROJECT_NAME,
        "ontology_version_id": primary["ontology_version_id"],
        "review_task_id": warning_relation_task_id or primary_task_ids[0],
        "publish_job_id": run["id"],
        "published_graph_version_id": run["published_graph_version_id"],
        "recommended_frontend_routes": [
            f"/projects/{PROJECT_ID}/review",
            f"/projects/{PROJECT_ID}/review/{warning_relation_task_id or primary_task_ids[0]}",
            f"/projects/{PROJECT_ID}/publish",
            f"/projects/{PROJECT_ID}/published-graph",
            f"/projects/{PROJECT_ID}/quality",
        ],
        "candidate_refs": {
            "published_clean_entity": primary["entity_ids"][0],
            "published_relation": primary["relation_ids"][0],
            "eligible_warning_entity": warning["entity_ids"][0],
            "blocked_warning_relation": warning["relation_ids"][0],
            "blocked_pending_entity": warning["entity_ids"][1],
            "blocked_missing_evidence_entity": missing_evidence_id,
            "blocked_broken_evidence_entity": broken_evidence_id,
            "blocked_rejected_entity": broken["entity_ids"][1],
            "blocked_needs_discussion_relation": broken["relation_ids"][0],
        },
        "api_checks": checks,
    }


def _reset_project() -> None:
    with SessionLocal() as db:
        source_ids = db.scalars(select(SourceData.id).where(SourceData.project_id == PROJECT_ID)).all()
        version_ids = db.scalars(
            select(OntologyVersion.id).where(OntologyVersion.project_id == PROJECT_ID)
        ).all()
        prompt_ids = db.scalars(
            select(PromptTemplate.id).where(PromptTemplate.project_id == PROJECT_ID)
        ).all()
        job_ids = db.scalars(select(ExtractionJob.id).where(ExtractionJob.project_id == PROJECT_ID)).all()
        db.execute(delete(AuditLog).where(AuditLog.project_id == PROJECT_ID))
        db.execute(delete(PublishedRelation).where(PublishedRelation.project_id == PROJECT_ID))
        db.execute(delete(PublishedEntity).where(PublishedEntity.project_id == PROJECT_ID))
        db.execute(delete(PublishedGraphVersion).where(PublishedGraphVersion.project_id == PROJECT_ID))
        db.execute(delete(PublishJob).where(PublishJob.project_id == PROJECT_ID))
        db.execute(delete(ReviewDecision).where(ReviewDecision.project_id == PROJECT_ID))
        db.execute(delete(CandidateCorrection).where(CandidateCorrection.project_id == PROJECT_ID))
        db.execute(delete(ReviewTask).where(ReviewTask.project_id == PROJECT_ID))
        db.execute(delete(ValidationResult).where(ValidationResult.project_id == PROJECT_ID))
        db.execute(delete(ValidationJob).where(ValidationJob.project_id == PROJECT_ID))
        db.execute(delete(CandidateRelation).where(CandidateRelation.project_id == PROJECT_ID))
        db.execute(delete(CandidateEntity).where(CandidateEntity.project_id == PROJECT_ID))
        if source_ids:
            db.execute(delete(CandidateEvidence).where(CandidateEvidence.source_id.in_(source_ids)))
        if job_ids:
            db.execute(delete(ModelRun).where(ModelRun.extraction_job_id.in_(job_ids)))
        db.execute(delete(ExtractionJob).where(ExtractionJob.project_id == PROJECT_ID))
        if source_ids:
            db.execute(delete(SourceProfile).where(SourceProfile.source_id.in_(source_ids)))
            db.execute(delete(SourceSegment).where(SourceSegment.source_id.in_(source_ids)))
        db.execute(delete(SourceData).where(SourceData.project_id == PROJECT_ID))
        if prompt_ids:
            db.execute(delete(PromptVersion).where(PromptVersion.prompt_template_id.in_(prompt_ids)))
        db.execute(delete(PromptTemplate).where(PromptTemplate.project_id == PROJECT_ID))
        if version_ids:
            db.execute(delete(OntologyProperty).where(OntologyProperty.version_id.in_(version_ids)))
            db.execute(delete(OntologyRelation).where(OntologyRelation.version_id.in_(version_ids)))
            db.execute(delete(OntologyClass).where(OntologyClass.version_id.in_(version_ids)))
        db.execute(delete(OntologyVersion).where(OntologyVersion.project_id == PROJECT_ID))
        project = db.get(Project, PROJECT_ID)
        if project is None:
            db.add(
                Project(
                    id=PROJECT_ID,
                    name=PROJECT_NAME,
                    description="Deterministic MVP3 actual API smoke project.",
                    status=ProjectStatus.ACTIVE,
                )
            )
        else:
            project.name = PROJECT_NAME
            project.description = "Deterministic MVP3 actual API smoke project."
            project.status = ProjectStatus.ACTIVE
            project.current_ontology_version_id = None
            db.add(project)
        db.commit()


def _ensure_project() -> None:
    with SessionLocal() as db:
        project = db.get(Project, PROJECT_ID)
        if project is None:
            project = Project(
                id=PROJECT_ID,
                name=PROJECT_NAME,
                description="Deterministic MVP3 actual API smoke project.",
                status=ProjectStatus.ACTIVE,
            )
            db.add(project)
        else:
            project.name = PROJECT_NAME
            project.status = ProjectStatus.ACTIVE
            db.add(project)
        db.commit()


def _create_extraction_context(
    name: str,
    fixture_id: str,
    *,
    base: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if base is None:
        version = _request("post", f"/api/v1/projects/{PROJECT_ID}/ontology/versions", expected_status=201)
        version_id = version["id"]
        company_id = _request(
            "post",
            f"/api/v1/ontology/versions/{version_id}/classes",
            expected_status=201,
            json={"name": "Company", "label": "Company", "position": {"x": 100, "y": 100}},
        )["id"]
        department_id = _request(
            "post",
            f"/api/v1/ontology/versions/{version_id}/classes",
            expected_status=201,
            json={"name": "Department", "label": "Department", "position": {"x": 300, "y": 100}},
        )["id"]
        relation_id = _request(
            "post",
            f"/api/v1/ontology/versions/{version_id}/relations",
            expected_status=201,
            json={
                "name": "HAS_DEPARTMENT",
                "label": "Has Department",
                "domain_class_id": company_id,
                "range_class_id": department_id,
                "cardinality": "ONE_TO_MANY",
            },
        )["id"]
    else:
        version_id = base["ontology_version_id"]
        relation_id = base["relation_definition_id"]

    source = _request(
        "post",
        f"/api/v1/projects/{PROJECT_ID}/sources/upload",
        expected_status=201,
        data={"source_type": "CSV"},
        files={
            "file": (
                f"{name.casefold().replace(' ', '-')}.csv",
                b"company_name,department_name\nAcme Corp,Research\nBeta LLC,Sales\n",
                "text/csv",
            )
        },
    )
    _request("post", f"/api/v1/sources/{source['id']}/parse")

    prompt = _request(
        "post",
        f"/api/v1/projects/{PROJECT_ID}/prompts",
        expected_status=201,
        json={"name": f"{name} prompt", "description": "MVP3 smoke prompt"},
    )
    prompt_version = _request(
        "post",
        f"/api/v1/prompts/{prompt['id']}/versions",
        expected_status=201,
        json={"template": "Extract candidates.", "output_schema": {"type": "object"}},
    )
    job = _request(
        "post",
        f"/api/v1/projects/{PROJECT_ID}/extraction-jobs",
        expected_status=201,
        json={
            "source_id": source["id"],
            "ontology_version_id": version_id,
            "prompt_version_id": prompt_version["id"],
            "fixture_id": fixture_id,
        },
    )
    _request("post", f"/api/v1/extraction-jobs/{job['id']}/run")
    entities = _request("get", f"/api/v1/extraction-jobs/{job['id']}/candidates/entities")
    relations = _request("get", f"/api/v1/extraction-jobs/{job['id']}/candidates/relations")
    return {
        "project_id": PROJECT_ID,
        "ontology_version_id": version_id,
        "job_id": job["id"],
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
    _request(
        "post",
        f"/api/v1/projects/{PROJECT_ID}/validation-jobs",
        expected_status=201,
        json={"ontology_version_id": ctx["ontology_version_id"], "candidate_refs": refs},
    )


def _review_candidates(ctx: dict[str, Any], decisions: list[tuple]) -> list[str]:
    refs = [
        {"candidate_kind": kind, "candidate_id": candidate_id}
        for kind, candidate_id, _, _, _ in decisions
    ]
    tasks = _create_review_tasks(ctx, refs)
    task_ids: list[str] = []
    for kind, candidate_id, decision, reason, corrected_payload in decisions:
        payload: dict[str, Any] = {"decision": decision}
        if reason is not None:
            payload["reason"] = reason
        if corrected_payload is not None:
            payload["corrected_payload"] = corrected_payload
        task_id = _task_id(tasks, kind, candidate_id)
        _request("post", f"/api/v1/review-tasks/{task_id}/decisions", expected_status=201, json=payload)
        task_ids.append(task_id)
    return task_ids


def _create_review_tasks(ctx: dict[str, Any], refs: list[dict[str, str]]) -> list[dict[str, Any]]:
    return _request(
        "post",
        f"/api/v1/projects/{ctx['project_id']}/review-tasks",
        expected_status=201,
        json={"candidate_refs": refs},
    )


def _task_id(tasks: list[dict[str, Any]], kind: str, candidate_id: str) -> str:
    for task in tasks:
        if task["candidate_kind"] == kind and task["candidate_id"] == candidate_id:
            return task["id"]
    raise RuntimeError(f"Review task was not created for {kind}:{candidate_id}.")


def _set_entity_confidence(candidate_id: str, confidence: float) -> None:
    with SessionLocal() as db:
        candidate = db.get(CandidateEntity, candidate_id)
        if candidate is None:
            raise RuntimeError(f"Candidate entity was not found: {candidate_id}")
        candidate.confidence = confidence
        db.add(candidate)
        db.commit()


def _force_relation_review_status(candidate_id: str, review_status: CandidateReviewStatus) -> None:
    with SessionLocal() as db:
        candidate = db.get(CandidateRelation, candidate_id)
        if candidate is None:
            raise RuntimeError(f"Candidate relation was not found: {candidate_id}")
        candidate.review_status = review_status
        db.add(candidate)
        db.commit()


def _smoke_checks(
    *,
    review_task_id: str,
    publish_job_id: str,
    published_graph_version_id: str,
) -> dict[str, Any]:
    review_tasks = _request("get", f"/api/v1/projects/{PROJECT_ID}/review-tasks")
    _request("get", f"/api/v1/review-tasks/{review_task_id}")
    eligibility = _request("get", f"/api/v1/projects/{PROJECT_ID}/publish-candidates")
    publish_job = _request("get", f"/api/v1/publish-jobs/{publish_job_id}")
    current = _request("get", f"/api/v1/projects/{PROJECT_ID}/published-graph/current")
    quality = _request("get", f"/api/v1/projects/{PROJECT_ID}/quality/summary")

    reason_codes = sorted({reason for row in eligibility for reason in row["reasons"]})
    if "ELIGIBLE" not in reason_codes:
        raise RuntimeError("Seeded publish queue does not include an ELIGIBLE candidate.")
    if not any(reason != "ELIGIBLE" for reason in reason_codes):
        raise RuntimeError("Seeded publish queue does not include blocked reason codes.")
    if current["version"]["id"] != published_graph_version_id:
        raise RuntimeError("Current published graph version does not match the publish job output.")
    if not current["entities"] or not current["relations"]:
        raise RuntimeError("Current published graph is missing published entity or relation facts.")

    return {
        "review_task_count": review_tasks["total_count"],
        "publish_candidate_count": len(eligibility),
        "publish_reason_codes": reason_codes,
        "publish_job_status": publish_job["status"],
        "published_entity_count": len(current["entities"]),
        "published_relation_count": len(current["relations"]),
        "quality_total_candidates": quality["candidate_counts"]["total"]["value"],
        "quality_published_ratio": quality["rates"]["published_ratio"],
    }


def _request(
    method: str,
    path: str,
    *,
    expected_status: int = 200,
    **kwargs: Any,
) -> Any:
    response = getattr(client, method)(path, **kwargs)
    if response.status_code != expected_status:
        raise RuntimeError(
            f"{method.upper()} {path} returned {response.status_code}, "
            f"expected {expected_status}: {response.text}"
        )
    return response.json()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed deterministic MVP3 frontend smoke data.")
    parser.add_argument("--output", type=Path, help="Optional JSON output file path.")
    parser.add_argument(
        "--no-reset",
        action="store_true",
        help="Append another fixture run under the fixed project instead of clearing it first.",
    )
    args = parser.parse_args()
    result = seed_mvp3(reset=not args.no_reset)
    text = json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text + "\n", encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
