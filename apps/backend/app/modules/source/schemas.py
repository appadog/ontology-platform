from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import PropertyDataType, SourcePreviewStatus, SourceStatus, SourceType


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
