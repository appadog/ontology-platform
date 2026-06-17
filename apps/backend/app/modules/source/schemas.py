from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import (
    ProfileInferredType,
    PropertyDataType,
    SourcePreviewStatus,
    SourceSegmentType,
    SourceStatus,
    SourceType,
)


class SourceUploadRequest(BaseModel):
    source_type: SourceType
    display_name: str | None = None


class SourceData(BaseModel):
    id: str
    project_id: str
    file_name: str
    source_type: SourceType
    mime_type: str | None
    size_bytes: int
    status: SourceStatus
    preview_status: SourcePreviewStatus
    storage_uri: str
    uploaded_at: datetime
    created_by: str
    metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "source-demo-csv",
                "project_id": "project-demo",
                "file_name": "companies.csv",
                "source_type": "CSV",
                "mime_type": "text/csv",
                "size_bytes": 2048,
                "status": "UPLOADED",
                "preview_status": "READY",
                "storage_uri": "local://sources/source-demo-csv/companies.csv",
                "uploaded_at": "2026-06-17T00:00:00Z",
                "created_by": "dev-user",
                "metadata": {"display_name": "Companies CSV"},
            }
        }
    )


class SourcePreviewColumn(BaseModel):
    name: str
    data_type: PropertyDataType
    nullable: bool
    sample_values: list[Any]


class SourcePreview(BaseModel):
    source_id: str
    columns: list[SourcePreviewColumn]
    rows: list[dict[str, Any]]
    row_count_sampled: int
    total_row_count: int
    sheet_name: str | None = None
    warnings: list[str] = Field(default_factory=list)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "source_id": "source-demo-csv",
                "columns": [
                    {
                        "name": "company_name",
                        "data_type": "STRING",
                        "nullable": False,
                        "sample_values": ["Acme Corp"],
                    }
                ],
                "rows": [{"company_name": "Acme Corp", "department_name": "Research"}],
                "row_count_sampled": 1,
                "total_row_count": 20,
                "sheet_name": None,
                "warnings": [],
            }
        }
    )


class SourceProfileColumn(BaseModel):
    name: str
    inferred_type: ProfileInferredType
    nullable: bool
    null_ratio: float
    distinct_count_sampled: int
    sample_values: list[Any]
    candidate_key_score: float = 0.0


class SourceProfile(BaseModel):
    id: str
    source_id: str
    columns: list[SourceProfileColumn]
    row_count: int
    sample_size: int
    warnings: list[str] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "profile-demo",
                "source_id": "source-demo-csv",
                "columns": [
                    {
                        "name": "company_name",
                        "inferred_type": "STRING",
                        "nullable": False,
                        "null_ratio": 0.0,
                        "distinct_count_sampled": 2,
                        "sample_values": ["Acme Corp", "Beta LLC"],
                        "candidate_key_score": 1.0,
                    },
                    {
                        "name": "employee_count",
                        "inferred_type": "INTEGER",
                        "nullable": True,
                        "null_ratio": 0.05,
                        "distinct_count_sampled": 18,
                        "sample_values": [42, 7, 13],
                        "candidate_key_score": 0.0,
                    },
                ],
                "row_count": 20,
                "sample_size": 20,
                "warnings": [],
                "created_at": "2026-06-17T00:00:00Z",
            }
        }
    )


class SourceParseRequest(BaseModel):
    chunk_size: int = Field(default=500, ge=100, le=5000)


class SourceSegment(BaseModel):
    id: str
    source_id: str
    segment_type: SourceSegmentType
    sequence: int
    row_index: int | None = None
    column_name: str | None = None
    page_number: int | None = None
    section_title: str | None = None
    paragraph_index: int | None = None
    chunk_index: int | None = None
    text: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class SourceParseResponse(BaseModel):
    source_id: str
    segment_count: int
    segment_types: list[SourceSegmentType]
    warnings: list[str] = Field(default_factory=list)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "source_id": "source-demo-csv",
                "segment_count": 7,
                "segment_types": ["SHEET", "ROW", "CELL"],
                "warnings": [],
            }
        }
    )
