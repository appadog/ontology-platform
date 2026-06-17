from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import (
    CandidateReviewStatus,
    CandidateValidationCode,
    PublishStatus,
    SourceType,
    ValidationStatus,
)


class CandidateEvidence(BaseModel):
    id: str
    source_id: str
    source_segment_id: str | None
    source_type: SourceType
    file_name: str
    sheet_name: str | None = None
    row_index: int | None = None
    column_name: str | None = None
    page_number: int | None = None
    section_title: str | None = None
    paragraph_id: int | None = None
    chunk_id: int | None = None
    evidence_text: str | None = None
    start_offset: int | None = None
    end_offset: int | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "evidence-demo",
                "source_id": "source-demo-csv",
                "source_segment_id": "segment-demo-row",
                "source_type": "CSV",
                "file_name": "companies.csv",
                "sheet_name": "Sheet1",
                "row_index": 1,
                "column_name": "company_name",
                "page_number": 1,
                "section_title": "Companies",
                "paragraph_id": 1,
                "chunk_id": 1,
                "evidence_text": "company_name=Acme Corp | employee_count=42",
                "start_offset": 0,
                "end_offset": 42,
                "metadata": {"segment_type": "ROW", "locator": "row:1:company_name"},
                "created_at": "2026-06-17T00:00:00Z",
            }
        }
    )


class CandidateEntity(BaseModel):
    id: str
    extraction_job_id: str
    project_id: str
    source_id: str
    source_segment_id: str | None
    ontology_version_id: str
    class_id: str | None
    model_run_id: str
    prompt_version_id: str
    entity_name: str
    normalized_name: str | None
    property_values: dict[str, Any]
    confidence: float
    evidence_ids: list[str]
    raw_payload: dict[str, Any]
    validation_status: ValidationStatus
    validation_codes: list[CandidateValidationCode]
    review_status: CandidateReviewStatus
    publish_status: PublishStatus
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "candidate-entity-demo",
                "extraction_job_id": "job-demo",
                "project_id": "project-demo",
                "source_id": "source-demo-csv",
                "source_segment_id": "segment-demo-row",
                "ontology_version_id": "ontology-version-demo",
                "class_id": "class-company",
                "model_run_id": "model-run-demo",
                "prompt_version_id": "prompt-version-demo",
                "entity_name": "Company Candidate 1",
                "normalized_name": "company candidate 1",
                "property_values": {},
                "confidence": 0.91,
                "evidence_ids": ["evidence-demo"],
                "raw_payload": {
                    "fixture_id": "default",
                    "client_candidate_id": "entity-company-1",
                },
                "validation_status": "PASSED",
                "validation_codes": [],
                "review_status": "PENDING",
                "publish_status": "NOT_PUBLISHED",
                "created_at": "2026-06-17T00:00:00Z",
            }
        }
    )


class CandidateRelation(BaseModel):
    id: str
    extraction_job_id: str
    project_id: str
    source_id: str
    source_segment_id: str | None
    ontology_version_id: str
    relation_id: str | None
    model_run_id: str
    prompt_version_id: str
    source_candidate_entity_id: str | None
    target_candidate_entity_id: str | None
    confidence: float
    evidence_ids: list[str]
    raw_payload: dict[str, Any]
    validation_status: ValidationStatus
    validation_codes: list[CandidateValidationCode]
    review_status: CandidateReviewStatus
    publish_status: PublishStatus
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "candidate-relation-demo",
                "extraction_job_id": "job-demo",
                "project_id": "project-demo",
                "source_id": "source-demo-csv",
                "source_segment_id": "segment-demo-row",
                "ontology_version_id": "ontology-version-demo",
                "relation_id": "relation-has-department",
                "model_run_id": "model-run-demo",
                "prompt_version_id": "prompt-version-demo",
                "source_candidate_entity_id": "candidate-entity-company",
                "target_candidate_entity_id": "candidate-entity-department",
                "confidence": 0.84,
                "evidence_ids": ["evidence-demo"],
                "raw_payload": {
                    "fixture_id": "default",
                    "client_candidate_id": "relation-company-department-1",
                },
                "validation_status": "PASSED",
                "validation_codes": [],
                "review_status": "PENDING",
                "publish_status": "NOT_PUBLISHED",
                "created_at": "2026-06-17T00:00:00Z",
            }
        }
    )
