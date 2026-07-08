from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums (connector-scoped; match docs/api/openapi-mvp6-9-draft.json EXACTLY).
# ---------------------------------------------------------------------------


class ConnectorKind(str, Enum):
    FILE_SOURCE = "FILE_SOURCE"
    REST_SOURCE = "REST_SOURCE"
    KNOWLEDGE_BASE_SOURCE = "KNOWLEDGE_BASE_SOURCE"


class ConnectorConfigFieldKind(str, Enum):
    STRING = "STRING"
    URL = "URL"
    ENUM = "ENUM"
    INTEGER = "INTEGER"
    BOOLEAN = "BOOLEAN"
    SECRET = "SECRET"


class ConnectorPreviewStatus(str, Enum):
    READY = "READY"
    BLOCKED = "BLOCKED"


class ConnectorPreviewCompatibility(str, Enum):
    COMPATIBLE = "COMPATIBLE"
    WARNING = "WARNING"
    INCOMPATIBLE = "INCOMPATIBLE"


class ConnectorPreviewTargetLayer(str, Enum):
    # Single literal: preview items are WOULD-BE candidate-layer items only.
    CANDIDATE = "CANDIDATE"


# ---------------------------------------------------------------------------
# All-false 9-flag mutation guard. Every flag is const false, always. MVP6.9
# turns NO flag true, ever (mirrors the MVP6.1-6.5/6.7/6.8 all-false pattern).
# ---------------------------------------------------------------------------


class ConnectorMutationGuard(BaseModel):
    external_system_read: Literal[False] = False
    external_system_write: Literal[False] = False
    real_network_call_made: Literal[False] = False
    credential_persisted: Literal[False] = False
    connector_instance_persisted: Literal[False] = False
    source_created: Literal[False] = False
    candidate_graph_mutated: Literal[False] = False
    published_graph_mutated: Literal[False] = False
    extraction_job_started: Literal[False] = False


# ---------------------------------------------------------------------------
# OntologyElementRef reused BY REFERENCE from MVP1 / MVP6.5-6.8 (field shape
# element_kind/element_id/label). Named ConnectorOntologyElementRef to avoid a
# component-name collision with the governance module's unrelated
# OntologyElementRef (different shape); the field shape matches the frozen
# draft's OntologyElementRef exactly. Mirrors the MVP6.8 copilot precedent.
# ---------------------------------------------------------------------------


class ConnectorOntologyElementRef(BaseModel):
    element_kind: str
    element_id: str
    label: str | None = None


# ---------------------------------------------------------------------------
# Config schema (masked).
# ---------------------------------------------------------------------------


class ConnectorConfigField(BaseModel):
    name: str
    label: str
    field_kind: ConnectorConfigFieldKind
    required: bool
    secret: bool
    placeholder: str | None = None
    help_text: str | None = None
    enum_values: list[str] | None = None


class ConnectorCatalogItem(BaseModel):
    connector_kind: ConnectorKind
    display_name: str
    description: str
    mock: Literal[True] = True
    has_secret_fields: bool
    config_field_count: int
    target_layer: ConnectorPreviewTargetLayer = ConnectorPreviewTargetLayer.CANDIDATE


class ConnectorCatalogListResponse(BaseModel):
    project_id: str
    items: list[ConnectorCatalogItem] = Field(default_factory=list)
    total_count: int
    mutation_guard: ConnectorMutationGuard = Field(default_factory=ConnectorMutationGuard)


class ConnectorConfigSchemaResponse(BaseModel):
    project_id: str
    connector_kind: ConnectorKind
    display_name: str
    fields: list[ConnectorConfigField] = Field(default_factory=list)
    raw_secret_present: Literal[False] = False
    mutation_guard: ConnectorMutationGuard = Field(default_factory=ConnectorMutationGuard)


# ---------------------------------------------------------------------------
# Import preview (dry-run).
# ---------------------------------------------------------------------------


class ConnectorImportPreviewRequest(BaseModel):
    # config values are non-secret placeholders in P0; the preview is computed
    # from fixture data keyed by connector_kind + non-secret config and is
    # INDEPENDENT of any secret value.
    config: dict[str, str | float | bool | None]
    item_cap: int | None = Field(default=50, ge=1, le=50)


class ConnectorPreviewSummary(BaseModel):
    source_record_count: int
    would_be_candidate_entity_count: int
    would_be_candidate_relation_count: int
    unmapped_record_count: int
    warning_count: int


class ConnectorPreviewNotice(BaseModel):
    # code is a stable UPPER_SNAKE token (frozen vocabulary); message is a
    # deterministic human-readable string (Korean primary).
    code: str
    message: str


class ConnectorPreviewItem(BaseModel):
    preview_ref: str
    target_layer: ConnectorPreviewTargetLayer = ConnectorPreviewTargetLayer.CANDIDATE
    mapped_ontology_class_ref: ConnectorOntologyElementRef | None = None
    label: str
    source_locator: str | None = None
    compatibility: ConnectorPreviewCompatibility
    note: str | None = None


class ConnectorImportPreviewResponse(BaseModel):
    # preview_id is always null: compute-on-read / ephemeral, persist nothing (G1).
    preview_id: str | None = None
    project_id: str
    connector_kind: ConnectorKind
    generated_at: datetime
    preview_only: Literal[True] = True
    status: ConnectorPreviewStatus
    compatibility: ConnectorPreviewCompatibility
    target_layer: ConnectorPreviewTargetLayer = ConnectorPreviewTargetLayer.CANDIDATE
    summary: ConnectorPreviewSummary
    sample_items: list[ConnectorPreviewItem] = Field(default_factory=list)
    item_cap: int
    truncated: bool
    total_item_count: int
    warnings: list[ConnectorPreviewNotice] = Field(default_factory=list)
    blocked_reasons: list[ConnectorPreviewNotice] = Field(default_factory=list)
    routing_note: str
    raw_secret_present: Literal[False] = False
    mutation_guard: ConnectorMutationGuard = Field(default_factory=ConnectorMutationGuard)
