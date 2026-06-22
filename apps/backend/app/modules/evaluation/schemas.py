from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.core.enums import EvaluationDatasetStatus


class EvaluationSampleKind(str, Enum):
    SOURCE_SEGMENT = "SOURCE_SEGMENT"
    MANUAL_TEXT = "MANUAL_TEXT"
    TABLE_ROW = "TABLE_ROW"


class EvaluationRunMode(str, Enum):
    DETERMINISTIC_MOCK = "DETERMINISTIC_MOCK"


class EvaluationRunStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


class EvaluationMetricName(str, Enum):
    ENTITY_PRECISION = "ENTITY_PRECISION"
    ENTITY_RECALL = "ENTITY_RECALL"
    ENTITY_F1 = "ENTITY_F1"
    RELATION_PRECISION = "RELATION_PRECISION"
    RELATION_RECALL = "RELATION_RECALL"
    RELATION_F1 = "RELATION_F1"
    RELATION_DIRECTION_ACCURACY = "RELATION_DIRECTION_ACCURACY"
    EVIDENCE_MATCH_RATE = "EVIDENCE_MATCH_RATE"


class EvaluationMetricStatus(str, Enum):
    MEASURED = "MEASURED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class EvaluationErrorType(str, Enum):
    MISSING_ENTITY = "MISSING_ENTITY"
    EXTRA_ENTITY = "EXTRA_ENTITY"
    WRONG_ENTITY_CLASS = "WRONG_ENTITY_CLASS"
    MISSING_RELATION = "MISSING_RELATION"
    EXTRA_RELATION = "EXTRA_RELATION"
    WRONG_RELATION_TYPE = "WRONG_RELATION_TYPE"
    WRONG_RELATION_DIRECTION = "WRONG_RELATION_DIRECTION"
    EVIDENCE_MISMATCH = "EVIDENCE_MISMATCH"


class EvaluationDataset(BaseModel):
    id: str
    project_id: str
    name: str
    description: str | None = None
    status: EvaluationDatasetStatus
    sample_count: int = 0
    gold_entity_count: int = 0
    gold_relation_count: int = 0
    created_at: datetime
    updated_at: datetime
    owner_id: str | None = None
    active_version_id: str | None = None
    notes: str | None = None


class EvaluationDatasetCreateRequest(BaseModel):
    name: str
    description: str | None = None
    status: EvaluationDatasetStatus = EvaluationDatasetStatus.DRAFT


class EvaluationSample(BaseModel):
    id: str
    project_id: str
    dataset_id: str
    sample_kind: EvaluationSampleKind
    source_id: str | None = None
    source_segment_id: str | None = None
    source_locator: str | None = None
    title: str | None = None
    content_text: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class EvaluationSampleCreateRequest(BaseModel):
    sample_kind: EvaluationSampleKind
    source_id: str | None = None
    source_segment_id: str | None = None
    source_locator: str | None = None
    title: str | None = None
    content_text: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class GoldEvidenceRef(BaseModel):
    sample_id: str
    source_id: str | None = None
    source_segment_id: str | None = None
    locator: str | None = None
    offset_start: int | None = None
    offset_end: int | None = None
    quote: str | None = None


class GoldEntity(BaseModel):
    id: str
    project_id: str
    dataset_id: str
    sample_id: str
    ontology_class_id: str
    label: str
    normalized_value: str
    evidence: GoldEvidenceRef
    created_at: datetime


class GoldEntityCreateRequest(BaseModel):
    sample_id: str
    ontology_class_id: str
    label: str
    normalized_value: str | None = None
    evidence: GoldEvidenceRef


class GoldRelation(BaseModel):
    id: str
    project_id: str
    dataset_id: str
    sample_id: str
    ontology_relation_id: str
    source_gold_entity_id: str
    target_gold_entity_id: str
    evidence: GoldEvidenceRef
    created_at: datetime


class GoldRelationCreateRequest(BaseModel):
    sample_id: str
    ontology_relation_id: str
    source_gold_entity_id: str
    target_gold_entity_id: str
    evidence: GoldEvidenceRef


class EvaluationRunCreateRequest(BaseModel):
    dataset_id: str | None = None
    run_mode: EvaluationRunMode = EvaluationRunMode.DETERMINISTIC_MOCK
    ontology_version_id: str | None = None
    prompt_version_id: str | None = None
    model_name: str = "deterministic-mock"
    model_run_id: str | None = None
    parser_version: str | None = None
    dataset_version_id: str | None = None
    experiment_id: str | None = None
    notes: str | None = None


class EvaluationRun(BaseModel):
    id: str
    project_id: str
    dataset_id: str | None = None
    status: EvaluationRunStatus | Literal["SUCCESS"]
    run_mode: EvaluationRunMode | None = None
    ontology_version_id: str | None = None
    prompt_version_id: str | None = None
    model_name: str | None = None
    model_run_id: str | None = None
    parser_version: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    metric_summary: dict[str, float | None] = Field(default_factory=dict)
    dataset_version_id: str | None = None
    experiment_id: str | None = None
    model_provider: str | None = None
    requested_by: str | None = None
    metrics: dict[str, Any] = Field(default_factory=dict)
    dimensions: dict[str, Any] = Field(default_factory=dict)
    error_code: str | None = None
    error_message: str | None = None


class EvaluationMetric(BaseModel):
    run_id: str
    metric_name: EvaluationMetricName
    value: float | None
    numerator: int
    denominator: int
    formula: str
    status: EvaluationMetricStatus
    computed_at: datetime


class EvaluationCandidateRef(BaseModel):
    candidate_id: str
    candidate_kind: Literal["ENTITY", "RELATION"]
    sample_id: str
    ontology_class_id: str | None = None
    ontology_relation_id: str | None = None
    label: str | None = None
    normalized_value: str | None = None
    source_gold_entity_id: str | None = None
    target_gold_entity_id: str | None = None
    evidence: GoldEvidenceRef | None = None


class EvaluationErrorCase(BaseModel):
    id: str
    run_id: str
    project_id: str
    dataset_id: str
    sample_id: str
    error_type: EvaluationErrorType
    gold_entity_id: str | None = None
    gold_relation_id: str | None = None
    candidate_ref: EvaluationCandidateRef | None = None
    comparison_summary: str
    gold_evidence: GoldEvidenceRef | None = None
    candidate_evidence: GoldEvidenceRef | None = None
    created_at: datetime
