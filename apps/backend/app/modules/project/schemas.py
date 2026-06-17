from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import ProjectStatus


class ProjectCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Corporate Document Ontology Demo",
                "description": "MVP 1 demo project",
            }
        }
    )


class ProjectUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: ProjectStatus | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Corporate Document Ontology Demo",
                "description": "Updated MVP 1 demo project",
                "status": "ACTIVE",
            }
        }
    )


class ProjectSummary(BaseModel):
    id: str
    name: str
    description: str | None
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime
    source_count: int
    ontology_version_count: int


class ProjectDetail(BaseModel):
    id: str
    name: str
    description: str | None
    status: ProjectStatus
    current_ontology_version_id: str | None
    source_count: int
    ontology_version_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "project-demo",
                "name": "Corporate Document Ontology Demo",
                "description": "MVP 1 demo project",
                "status": "ACTIVE",
                "current_ontology_version_id": "version-demo-draft",
                "source_count": 0,
                "ontology_version_count": 1,
                "created_at": "2026-06-17T00:00:00Z",
                "updated_at": "2026-06-17T00:00:00Z",
            }
        }
    )
