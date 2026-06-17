from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import (
    Cardinality,
    OntologyElementStatus,
    OntologyVersionStatus,
    PropertyDataType,
)


class Position(BaseModel):
    x: float = 0
    y: float = 0


class OntologyVersionCreateRequest(BaseModel):
    created_by: str | None = None

    model_config = ConfigDict(json_schema_extra={"example": {"created_by": "dev-user"}})


class OntologyVersion(BaseModel):
    id: str
    project_id: str
    version: int
    status: OntologyVersionStatus
    created_at: datetime
    published_at: datetime | None
    created_by: str

    model_config = ConfigDict(from_attributes=True)


class OntologyClassCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    label: str | None = Field(default=None, max_length=200)
    description: str | None = None
    position: Position = Field(default_factory=Position)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Company",
                "label": "Company",
                "description": "Organization or legal entity.",
                "position": {"x": 120, "y": 120},
            }
        }
    )


class OntologyClassUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    label: str | None = Field(default=None, max_length=200)
    description: str | None = None
    status: OntologyElementStatus | None = None
    position: Position | None = None


class OntologyClass(BaseModel):
    id: str
    version_id: str
    name: str
    label: str
    description: str | None
    status: OntologyElementStatus
    position: Position
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OntologyPropertyCreateRequest(BaseModel):
    class_id: str
    name: str = Field(min_length=1, max_length=120)
    label: str | None = Field(default=None, max_length=200)
    description: str | None = None
    data_type: PropertyDataType = PropertyDataType.STRING
    cardinality: Cardinality = Cardinality.OPTIONAL
    required: bool = False

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "class_id": "class-company",
                "name": "company_name",
                "label": "Company Name",
                "description": "Legal company name.",
                "data_type": "STRING",
                "cardinality": "REQUIRED",
                "required": True,
            }
        }
    )


class OntologyPropertyUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    label: str | None = Field(default=None, max_length=200)
    description: str | None = None
    data_type: PropertyDataType | None = None
    cardinality: Cardinality | None = None
    required: bool | None = None
    status: OntologyElementStatus | None = None


class OntologyProperty(BaseModel):
    id: str
    version_id: str
    class_id: str
    name: str
    label: str
    description: str | None
    data_type: PropertyDataType
    cardinality: Cardinality
    required: bool
    status: OntologyElementStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OntologyRelationCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    label: str | None = Field(default=None, max_length=200)
    description: str | None = None
    domain_class_id: str
    range_class_id: str
    cardinality: Cardinality = Cardinality.MANY_TO_MANY
    required: bool = False

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "HAS_DEPARTMENT",
                "label": "Has Department",
                "description": "Company has department.",
                "domain_class_id": "class-company",
                "range_class_id": "class-department",
                "cardinality": "ONE_TO_MANY",
                "required": False,
            }
        }
    )


class OntologyRelationUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    label: str | None = Field(default=None, max_length=200)
    description: str | None = None
    domain_class_id: str | None = None
    range_class_id: str | None = None
    cardinality: Cardinality | None = None
    required: bool | None = None
    status: OntologyElementStatus | None = None


class OntologyRelation(BaseModel):
    id: str
    version_id: str
    name: str
    label: str
    description: str | None
    domain_class_id: str
    range_class_id: str
    cardinality: Cardinality
    required: bool
    status: OntologyElementStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OntologyGraphNode(BaseModel):
    id: str
    class_id: str
    label: str
    position: Position
    status: OntologyElementStatus


class OntologyGraphEdge(BaseModel):
    id: str
    relation_id: str
    source_class_id: str
    target_class_id: str
    label: str
    cardinality: Cardinality
    status: OntologyElementStatus


class OntologyGraph(BaseModel):
    version_id: str
    version_status: OntologyVersionStatus
    nodes: list[OntologyGraphNode]
    edges: list[OntologyGraphEdge]
    properties: list[OntologyProperty]
    classes: list[OntologyClass]
    relations: list[OntologyRelation]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "version_id": "version-demo-draft",
                "version_status": "DRAFT",
                "nodes": [
                    {
                        "id": "class-company",
                        "class_id": "class-company",
                        "label": "Company",
                        "position": {"x": 120, "y": 120},
                        "status": "ACTIVE",
                    }
                ],
                "edges": [],
                "properties": [],
                "classes": [],
                "relations": [],
            }
        }
    )
