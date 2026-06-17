from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PromptTemplateCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None


class PromptTemplate(BaseModel):
    id: str
    project_id: str
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "prompt-template-demo",
                "project_id": "project-demo",
                "name": "Source entity extraction",
                "description": "Deterministic MVP2 extraction prompt scaffold.",
                "created_at": "2026-06-17T00:00:00Z",
                "updated_at": "2026-06-17T00:00:00Z",
            }
        },
    )


class PromptVersionCreateRequest(BaseModel):
    template: str = Field(min_length=1)
    output_schema: dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True
    created_by: str | None = None


class PromptVersion(BaseModel):
    id: str
    prompt_template_id: str
    version: int
    template: str
    output_schema: dict[str, Any]
    is_active: bool
    created_at: datetime
    created_by: str

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "prompt-version-demo",
                "prompt_template_id": "prompt-template-demo",
                "version": 1,
                "template": "Extract candidate entities from source segments.",
                "output_schema": {"type": "object"},
                "is_active": True,
                "created_at": "2026-06-17T00:00:00Z",
                "created_by": "dev-user",
            }
        },
    )
