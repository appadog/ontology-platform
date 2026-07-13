from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field

__all__ = [
    "PackElementKind",
    "PackApplyPreviewStatus",
    "PackPreviewItemDisposition",
    "PackApplyCompatibility",
    "PackApplyTargetLayer",
    "OntologyElementStatus",
    "PackOntologyElementRef",
    "PackPreviewNotice",
    "OntologyPackMutationGuard",
    "PackElementDescriptor",
    "OntologyPackElementCounts",
    "OntologyPackCatalogItem",
    "OntologyPackCatalogListResponse",
    "OntologyPackDetailResponse",
    "PackApplyPreviewRequest",
    "PackApplyPreviewSummary",
    "PackPreviewItem",
    "PackApplyPreviewResponse",
]


# ---------------------------------------------------------------------------
# Enums (match docs/api/openapi-mvp6-11-draft.json EXACTLY; frozen names/values).
# Reused BY REFERENCE from the MVP1 / MVP6.5-6.7 ontology vocabulary (no rename);
# defined locally to keep this module self-contained (tenancy/connectors precedent).
# ---------------------------------------------------------------------------


class PackElementKind(str, Enum):
    CLASS = "CLASS"
    PROPERTY = "PROPERTY"
    RELATION = "RELATION"


class PackApplyPreviewStatus(str, Enum):
    READY = "READY"
    BLOCKED = "BLOCKED"


class PackPreviewItemDisposition(str, Enum):
    NEW = "NEW"
    CONFLICT = "CONFLICT"
    DUPLICATE = "DUPLICATE"


class PackApplyCompatibility(str, Enum):
    COMPATIBLE = "COMPATIBLE"
    WARNING = "WARNING"
    INCOMPATIBLE = "INCOMPATIBLE"


class PackApplyTargetLayer(str, Enum):
    # Single literal DRAFT: preview items are WOULD-BE DRAFT-layer elements only,
    # NEVER candidate, NEVER published.
    DRAFT = "DRAFT"


class OntologyElementStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"


# ---------------------------------------------------------------------------
# All-false 8-flag mutation guard. Every flag is const false, always. MVP6.11
# turns NO flag true, ever (mirrors the MVP6.1-6.10 all-false pattern).
# ontology_draft_mutated + published_graph_mutated are the headline assertions.
# ---------------------------------------------------------------------------


class OntologyPackMutationGuard(BaseModel):
    pack_installed: Literal[False] = False
    ontology_draft_mutated: Literal[False] = False
    ontology_class_created: Literal[False] = False
    ontology_property_created: Literal[False] = False
    ontology_relation_created: Literal[False] = False
    candidate_graph_mutated: Literal[False] = False
    published_graph_mutated: Literal[False] = False
    change_request_created: Literal[False] = False


# ---------------------------------------------------------------------------
# Core read-only shapes.
# ---------------------------------------------------------------------------


class PackOntologyElementRef(BaseModel):
    # Reused BY REFERENCE from MVP1 / MVP6.5-6.7 (same shape, not renamed). Names the
    # WOULD-BE mapped DRAFT-layer target of a preview item; references an existing /
    # would-be element identity and CREATES NOTHING.
    target_kind: PackElementKind
    ontology_class_id: str | None = None
    ontology_property_id: str | None = None
    ontology_relation_id: str | None = None
    ontology_version_id: str
    status: OntologyElementStatus | None = None


class PackPreviewNotice(BaseModel):
    # {code, message} (mirrors the MVP6.9 ConnectorPreviewNotice pattern). code is a
    # stable UPPER_SNAKE token (frozen vocab, deterministic); message is Korean-primary.
    code: str
    message: str


class PackElementDescriptor(BaseModel):
    element_key: str
    element_kind: PackElementKind
    label: str
    description: str | None = None


class OntologyPackElementCounts(BaseModel):
    class_count: int
    property_count: int
    relation_count: int
    element_count: int


class OntologyPackCatalogItem(BaseModel):
    pack_id: str
    name: str
    domain: str
    version: str
    description: str
    mock: Literal[True] = True
    element_counts: OntologyPackElementCounts


class PackApplyPreviewSummary(BaseModel):
    would_add_count: int
    would_modify_count: int
    conflict_count: int
    duplicate_count: int
    total_element_count: int


class PackPreviewItem(BaseModel):
    preview_ref: str
    element_kind: PackElementKind
    disposition: PackPreviewItemDisposition
    target_layer: PackApplyTargetLayer
    mapped_ontology_ref: PackOntologyElementRef | None = None
    pack_element_label: str
    existing_element_label: str | None = None
    note: str | None = None


# ---------------------------------------------------------------------------
# Response envelopes (every response carries the all-false guard).
# ---------------------------------------------------------------------------


class OntologyPackCatalogListResponse(BaseModel):
    items: list[OntologyPackCatalogItem] = Field(default_factory=list)
    total_count: int
    mutation_guard: OntologyPackMutationGuard = Field(default_factory=OntologyPackMutationGuard)


class OntologyPackDetailResponse(BaseModel):
    pack_id: str
    name: str
    domain: str
    version: str
    description: str
    mock: Literal[True] = True
    element_counts: OntologyPackElementCounts
    elements: list[PackElementDescriptor] = Field(default_factory=list)
    mutation_guard: OntologyPackMutationGuard = Field(default_factory=OntologyPackMutationGuard)


class PackApplyPreviewRequest(BaseModel):
    item_cap: int | None = Field(default=50, ge=1, le=50)


class PackApplyPreviewResponse(BaseModel):
    preview_id: str | None = None
    project_id: str
    pack_id: str
    pack_version: str
    generated_at: datetime
    preview_only: Literal[True] = True
    status: PackApplyPreviewStatus
    compatibility: PackApplyCompatibility
    target_layer: PackApplyTargetLayer
    summary: PackApplyPreviewSummary
    items: list[PackPreviewItem] = Field(default_factory=list)
    item_cap: int
    truncated: bool
    total_item_count: int
    warnings: list[PackPreviewNotice] = Field(default_factory=list)
    blocked_reasons: list[PackPreviewNotice] = Field(default_factory=list)
    routing_note: str
    mutation_guard: OntologyPackMutationGuard = Field(default_factory=OntologyPackMutationGuard)
