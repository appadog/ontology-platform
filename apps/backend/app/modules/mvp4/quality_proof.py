from __future__ import annotations

from collections import Counter
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.candidate.models import CandidateEntity, CandidateRelation
from app.modules.publish.models import (
    PublishedEntity,
    PublishedRelation,
)

from . import service

QUALITY_RECOMPUTE_TOLERANCE = 0.0001
QUALITY_RECOMPUTE_ARTIFACT_PATH = "/tmp/ontology-wave22-quality-proof.json"


def build_quality_recompute_proof(
    db: Session,
    project_id: str,
    *,
    api_body: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build the Wave22 deterministic MVP4 quality recomputation proof."""
    if api_body is None:
        api_body = service.quality_metrics(db, project_id).model_dump(mode="json")

    version = service.current_graph_version(db, project_id)
    entities = _published_entities(db, version.id)
    relations = _published_relations(db, version.id)
    candidates = _candidate_rows(db, project_id)
    raw_counts = _raw_quality_counts(candidates, entities, relations)
    api_metrics = _api_metric_map(api_body)

    rows = [
        _proof_row(
            api_metrics["completeness"],
            numerator=raw_counts["candidates_with_evidence"],
            denominator=raw_counts["total_candidates"],
            numerator_source="candidate_entities + candidate_relations with non-empty evidence_ids",
            denominator_source="all candidate_entities + candidate_relations for project",
        ),
        _proof_row(
            api_metrics["consistency"],
            numerator=raw_counts["validation_non_failed"],
            denominator=raw_counts["total_candidates"],
            numerator_source="candidate validation_status values excluding FAILED",
            denominator_source="all candidate_entities + candidate_relations for project",
        ),
        _proof_row(
            api_metrics["traceability"],
            numerator=raw_counts["published_facts_with_lineage_evidence"],
            denominator=raw_counts["published_fact_count"],
            numerator_source="published entities/relations with evidence_refs and review lineage",
            denominator_source="all published entities + relations in current graph version",
        ),
        _proof_row(
            api_metrics["validation_pass_rate"],
            numerator=raw_counts["validation_non_failed"],
            denominator=raw_counts["total_candidates"],
            numerator_source="candidate validation_status values excluding FAILED",
            denominator_source="all candidate_entities + candidate_relations for project",
        ),
        _proof_row(
            api_metrics["review_approval_rate"],
            numerator=raw_counts["approved_or_modified_candidates"],
            denominator=raw_counts["reviewed_candidates"],
            numerator_source="candidate review_status in APPROVED or MODIFIED",
            denominator_source="candidate review_status values excluding PENDING",
        ),
        _proof_row(
            api_metrics["duplicate_rate"],
            numerator=raw_counts["duplicate_indicator_count"],
            denominator=raw_counts["total_candidates"],
            numerator_source="deterministic duplicate candidate name/signature buckets",
            denominator_source="all candidate_entities + candidate_relations for project",
        ),
        _proof_row(
            api_metrics["relation_density"],
            numerator=raw_counts["published_relation_count"],
            denominator=raw_counts["published_entity_count"],
            numerator_source="published_relations in current graph version",
            denominator_source="published_entities in current graph version",
        ),
    ]

    return {
        "project_id": project_id,
        "published_graph_version_ref": api_body["published_graph_version_ref"],
        "generated_at": version.created_at.isoformat(),
        "source": "mvp4_seed_db_and_quality_api",
        "tolerance": QUALITY_RECOMPUTE_TOLERANCE,
        "no_weighted_composite_score": True,
        "metric_rows": rows,
    }


def _candidate_rows(
    db: Session,
    project_id: str,
) -> list[CandidateEntity | CandidateRelation]:
    entities = db.scalars(
        select(CandidateEntity)
        .where(CandidateEntity.project_id == project_id)
        .order_by(CandidateEntity.created_at.asc(), CandidateEntity.id.asc())
    ).all()
    relations = db.scalars(
        select(CandidateRelation)
        .where(CandidateRelation.project_id == project_id)
        .order_by(CandidateRelation.created_at.asc(), CandidateRelation.id.asc())
    ).all()
    return [*entities, *relations]


def _published_entities(db: Session, version_id: str) -> list[PublishedEntity]:
    return db.scalars(
        select(PublishedEntity)
        .where(PublishedEntity.published_graph_version_id == version_id)
        .order_by(PublishedEntity.created_at.asc(), PublishedEntity.id.asc())
    ).all()


def _published_relations(db: Session, version_id: str) -> list[PublishedRelation]:
    return db.scalars(
        select(PublishedRelation)
        .where(PublishedRelation.published_graph_version_id == version_id)
        .order_by(PublishedRelation.created_at.asc(), PublishedRelation.id.asc())
    ).all()


def _raw_quality_counts(
    candidates: list[CandidateEntity | CandidateRelation],
    entities: list[PublishedEntity],
    relations: list[PublishedRelation],
) -> dict[str, int]:
    published_facts = [*entities, *relations]
    total_candidates = len(candidates)
    reviewed_candidates = sum(
        1 for candidate in candidates if candidate.review_status.value != "PENDING"
    )
    duplicate_bucket_count = sum(
        1 for count in Counter(_duplicate_key(candidate) for candidate in candidates).values() if count > 1
    )
    return {
        "total_candidates": total_candidates,
        "candidates_with_evidence": sum(1 for candidate in candidates if candidate.evidence_ids),
        "validation_non_failed": sum(
            1 for candidate in candidates if candidate.validation_status.value != "FAILED"
        ),
        "reviewed_candidates": reviewed_candidates,
        "approved_or_modified_candidates": sum(
            1
            for candidate in candidates
            if candidate.review_status.value in {"APPROVED", "MODIFIED"}
        ),
        "duplicate_indicator_count": 1 if duplicate_bucket_count > 0 else 0,
        "published_entity_count": len(entities),
        "published_relation_count": len(relations),
        "published_fact_count": len(published_facts),
        "published_facts_with_lineage_evidence": sum(
            1 for fact in published_facts if _has_traceable_lineage(fact)
        ),
    }


def _duplicate_key(candidate: CandidateEntity | CandidateRelation) -> str:
    if isinstance(candidate, CandidateEntity):
        return f"ENTITY:{candidate.normalized_name or candidate.entity_name}".casefold()
    return (
        "RELATION:"
        f"{candidate.relation_id}:"
        f"{candidate.source_candidate_entity_id}:"
        f"{candidate.target_candidate_entity_id}"
    ).casefold()


def _has_traceable_lineage(fact: PublishedEntity | PublishedRelation) -> bool:
    lineage = fact.lineage or {}
    return bool(
        lineage.get("evidence_refs")
        and lineage.get("candidate_id")
        and lineage.get("review_decision_id")
        and lineage.get("publish_job_id")
    )


def _api_metric_map(api_body: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        metric["metric_id"]: metric
        for group in api_body["metric_groups"]
        for metric in group["metrics"]
    }


def _proof_row(
    api_metric: dict[str, Any],
    *,
    numerator: int,
    denominator: int,
    numerator_source: str,
    denominator_source: str,
) -> dict[str, Any]:
    formula = api_metric["formula"]
    recomputed = numerator / denominator if denominator else None
    row: dict[str, Any] = {
        "metric_id": api_metric["metric_id"],
        "group": api_metric["group"],
        "numerator": numerator,
        "denominator": denominator,
        "numerator_source": numerator_source,
        "denominator_source": denominator_source,
        "formula_metadata": formula,
        "scope": formula["scope"],
        "time_window": formula["time_window"],
        "breakdown_dimension": formula["breakdown_dimension"],
        "drilldown_target": api_metric["drilldown"]["target"],
        "required_evidence_artifact": QUALITY_RECOMPUTE_ARTIFACT_PATH,
        "tolerance": QUALITY_RECOMPUTE_TOLERANCE,
    }
    if api_metric["value"] is not None:
        row["api_value"] = api_metric["value"]
        row["recomputed_value"] = float(numerator)
        row["passed"] = row["api_value"] == row["recomputed_value"]
    else:
        row["api_rate"] = api_metric["rate"]
        row["recomputed_rate"] = recomputed
        row["passed"] = (
            recomputed is not None
            and abs(row["api_rate"] - recomputed) <= QUALITY_RECOMPUTE_TOLERANCE
        )
    return row
