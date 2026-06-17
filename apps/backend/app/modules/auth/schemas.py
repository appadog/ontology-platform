from pydantic import BaseModel, ConfigDict

from app.core.enums import Role


class DevUser(BaseModel):
    id: str
    name: str
    roles: list[Role]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "dev-user",
                "name": "Local Dev User",
                "roles": ["PROJECT_ADMIN", "ONTOLOGY_MANAGER", "DATA_MANAGER", "VIEWER"],
            }
        }
    )
