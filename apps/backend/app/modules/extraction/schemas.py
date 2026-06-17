from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import ExtractionJobStatus, ModelRunStatus


class ExtractionJobCreateRequest(BaseModel):
    source_id: str
    ontology_version_id: str
    prompt_version_id: str
    provider: str = Field(default="mock")
    model_name: str = Field(default="mock-deterministic")
    fixture_id: str | None = Field(default="default")


class ExtractionJob(BaseModel):
    id: str
    project_id: str
    source_id: str
    ontology_version_id: str
    prompt_version_id: str
    provider: str
    model_name: str
    fixture_id: str | None
    status: ExtractionJobStatus
    progress: int
    retry_of_job_id: str | None
    error_code: str | None
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    ended_at: datetime | None
    candidate_entity_count: int = 0
    candidate_relation_count: int = 0

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "job-demo",
                "project_id": "project-demo",
                "source_id": "source-demo-csv",
                "ontology_version_id": "ontology-version-demo",
                "prompt_version_id": "prompt-version-demo",
                "provider": "mock",
                "model_name": "mock-deterministic",
                "fixture_id": "default",
                "status": "SUCCESS",
                "progress": 100,
                "retry_of_job_id": None,
                "error_code": None,
                "error_message": None,
                "created_at": "2026-06-17T00:00:00Z",
                "started_at": "2026-06-17T00:00:00Z",
                "ended_at": "2026-06-17T00:00:01Z",
                "candidate_entity_count": 2,
                "candidate_relation_count": 1,
            }
        }
    )


class ModelRun(BaseModel):
    id: str
    extraction_job_id: str
    prompt_version_id: str
    ontology_version_id: str
    provider: str
    model_name: str
    status: ModelRunStatus
    input_token_count: int
    output_token_count: int
    cost_estimate: float
    raw_request: dict[str, Any]
    raw_response: dict[str, Any]
    masking_version: str
    redaction_summary: dict[str, Any]
    started_at: datetime | None
    ended_at: datetime | None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "model-run-demo",
                "extraction_job_id": "job-demo",
                "prompt_version_id": "prompt-version-demo",
                "ontology_version_id": "ontology-version-demo",
                "provider": "mock",
                "model_name": "mock-deterministic",
                "status": "SUCCESS",
                "input_token_count": 0,
                "output_token_count": 0,
                "cost_estimate": 0.0,
                "raw_request": {
                    "source_id": "source-demo-csv",
                    "segment_count": 5,
                    "fixture_id": "default",
                },
                "raw_response": {"entity_count": 2, "relation_count": 1},
                "masking_version": "v1",
                "redaction_summary": {"redacted_keys": [], "truncated_fields": []},
                "started_at": "2026-06-17T00:00:00Z",
                "ended_at": "2026-06-17T00:00:01Z",
            }
        }
    )


class ExtractionJobDetail(ExtractionJob):
    model_runs: list[ModelRun] = Field(default_factory=list)
