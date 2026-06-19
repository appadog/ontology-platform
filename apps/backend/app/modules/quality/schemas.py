from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.core.enums import QualityDrilldownTarget


class QualityDrilldownHint(BaseModel):
    target: QualityDrilldownTarget
    query: dict[str, str | int | float | bool | None]


class QualityCountMetric(BaseModel):
    value: int
    drilldown: QualityDrilldownHint | None = None


class QualityRateMetric(BaseModel):
    numerator: int
    denominator: int
    rate: float
    drilldown: QualityDrilldownHint | None = None


class QualityCandidateCounts(BaseModel):
    total: QualityCountMetric
    entity: QualityCountMetric
    relation: QualityCountMetric
    property_value: QualityCountMetric
    missing_evidence: QualityCountMetric


class QualityValidationCounts(BaseModel):
    not_validated: QualityCountMetric
    passed: QualityCountMetric
    warning: QualityCountMetric
    failed: QualityCountMetric
    by_rule_code: dict[str, QualityCountMetric]


class QualityReviewCounts(BaseModel):
    pending: QualityCountMetric
    approved: QualityCountMetric
    rejected: QualityCountMetric
    modified: QualityCountMetric
    needs_discussion: QualityCountMetric


class QualityPublishCounts(BaseModel):
    not_published: QualityCountMetric
    published: QualityCountMetric
    rolled_back: QualityCountMetric
    published_entities: QualityCountMetric
    published_relations: QualityCountMetric
    publish_success: QualityCountMetric
    publish_failed: QualityCountMetric
    current_version_id: str | None = None
    current_version: int | None = None


class QualityRates(BaseModel):
    approval_rate: QualityRateMetric
    rejection_rate: QualityRateMetric
    modification_rate: QualityRateMetric
    validation_failure_rate: QualityRateMetric
    evidence_missing_rate: QualityRateMetric
    published_ratio: QualityRateMetric


class QualitySummary(BaseModel):
    project_id: str
    ontology_version_id: str | None = None
    generated_at: datetime
    candidate_counts: QualityCandidateCounts
    validation_counts: QualityValidationCounts
    review_counts: QualityReviewCounts
    publish_counts: QualityPublishCounts
    rates: QualityRates


def count_metric(
    value: int,
    *,
    target: QualityDrilldownTarget | None = None,
    query: dict[str, Any] | None = None,
) -> QualityCountMetric:
    drilldown = None if target is None else QualityDrilldownHint(target=target, query=query or {})
    return QualityCountMetric(value=value, drilldown=drilldown)


def rate_metric(
    numerator: int,
    denominator: int,
    *,
    target: QualityDrilldownTarget | None = None,
    query: dict[str, Any] | None = None,
) -> QualityRateMetric:
    rate = round(numerator / denominator, 4) if denominator else 0.0
    drilldown = None if target is None else QualityDrilldownHint(target=target, query=query or {})
    return QualityRateMetric(
        numerator=numerator,
        denominator=denominator,
        rate=rate,
        drilldown=drilldown,
    )
