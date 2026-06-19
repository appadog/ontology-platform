from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import (
    CandidateKind,
    ValidationJobStatus,
    ValidationResultSeverity,
    ValidationRuleCode,
)


class CandidateRef(BaseModel):
    candidate_kind: CandidateKind
    candidate_id: str


class ValidationJobCreateRequest(BaseModel):
    ontology_version_id: str
    extraction_job_id: str | None = None
    source_id: str | None = None
    candidate_refs: list[CandidateRef] = Field(default_factory=list)
    rule_codes: list[ValidationRuleCode] = Field(default_factory=list)


class ValidationSummary(BaseModel):
    target_count: int = 0
    passed_count: int = 0
    warning_count: int = 0
    failed_count: int = 0
    missing_evidence_count: int = 0


class ValidationJob(BaseModel):
    id: str
    project_id: str
    ontology_version_id: str
    source_id: str | None = None
    extraction_job_id: str | None = None
    status: ValidationJobStatus
    requested_by: str | None = None
    created_at: datetime
    started_at: datetime | None = None
    ended_at: datetime | None = None
    summary: ValidationSummary
    error_code: str | None = None
    error_message: str | None = None


class ValidationResult(BaseModel):
    id: str
    validation_job_id: str
    project_id: str
    ontology_version_id: str
    candidate_kind: CandidateKind
    candidate_id: str
    rule_code: ValidationRuleCode
    severity: ValidationResultSeverity
    message: str
    field_path: str
    blocking: bool
    suggested_fix: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "validation-result-demo",
                "validation_job_id": "validation-job-demo",
                "project_id": "project-demo",
                "ontology_version_id": "ontology-version-demo",
                "candidate_kind": "ENTITY",
                "candidate_id": "candidate-entity-demo",
                "rule_code": "LOW_CONFIDENCE",
                "severity": "WARNING",
                "message": "Candidate confidence is below review threshold.",
                "field_path": "confidence",
                "blocking": False,
                "suggested_fix": "Confirm the candidate against evidence.",
                "details": {"confidence": 0.6},
                "created_at": "2026-06-19T00:00:00Z",
            }
        }
    )
