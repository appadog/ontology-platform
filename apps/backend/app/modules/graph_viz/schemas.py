from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field

__all__ = [
    "GraphVizStatus",
    "GraphVizScope",
    "GraphVizMutationGuard",
    "GraphVizPublishedVersionRef",
    "GraphVizClassCount",
    "GraphVizRelationCount",
    "GraphVizSummary",
    "GraphVizNode",
    "GraphVizEdge",
    "GraphVizTooLargeState",
    "GraphVizResponse",
]


# ---------------------------------------------------------------------------
# Enums (match docs/api/openapi-mvp6-12-draft.json EXACTLY; frozen names/values).
# GraphVizStatus's structural precedent is MVP4 GraphExploreState (not renamed);
# GraphVizScope reuses the PUBLISHED/CANDIDATE vocabulary. CANDIDATE is reserved
# and NEVER produced in P0.
# ---------------------------------------------------------------------------


class GraphVizStatus(str, Enum):
    READY = "READY"
    TOO_LARGE_SUMMARY_ONLY = "TOO_LARGE_SUMMARY_ONLY"
    EMPTY = "EMPTY"


class GraphVizScope(str, Enum):
    PUBLISHED = "PUBLISHED"
    CANDIDATE = "CANDIDATE"


# ---------------------------------------------------------------------------
# All-false 6-flag mutation guard present on EVERY graph-viz response
# (READY / TOO_LARGE_SUMMARY_ONLY / EMPTY). Every flag is const false, always;
# MVP6.12 turns NO flag true, ever (mirrors the MVP6.1-6.11 all-false pattern).
# published_graph_mutated + layout_persisted are the headline assertions.
# ---------------------------------------------------------------------------


class GraphVizMutationGuard(BaseModel):
    published_graph_mutated: Literal[False] = False
    candidate_graph_mutated: Literal[False] = False
    ontology_draft_mutated: Literal[False] = False
    published_version_created: Literal[False] = False
    graph_snapshot_created: Literal[False] = False
    layout_persisted: Literal[False] = False


# ---------------------------------------------------------------------------
# Reused-by-reference shapes (MVP4 / MVP3 / MVP1). Defined locally to keep this
# module self-contained (tenancy / connectors / ontology_packs precedent); the
# JSON field names are IDENTICAL to the originals (no renames).
# ---------------------------------------------------------------------------


class GraphVizPublishedVersionRef(BaseModel):
    published_graph_version_id: str
    published_graph_version: int
    ontology_version_id: str
    is_current: bool
    created_at: datetime | None = None


class GraphVizClassCount(BaseModel):
    class_id: str
    count: int = Field(ge=0)


class GraphVizRelationCount(BaseModel):
    relation_id: str
    count: int = Field(ge=0)


class GraphVizSummary(BaseModel):
    total_node_count: int = Field(ge=0)
    total_edge_count: int = Field(ge=0)
    node_counts_by_class: list[GraphVizClassCount] = Field(default_factory=list)
    edge_counts_by_relation: list[GraphVizRelationCount] = Field(default_factory=list)
    density: float = Field(ge=0)
    component_count: int = Field(ge=0)
    largest_component_size: int = Field(ge=0)
    isolated_node_count: int = Field(ge=0)
    max_degree: int = Field(ge=0)


class GraphVizNode(BaseModel):
    # Reuses the MVP4 GraphExploreNode element fields by reference PLUS the layout
    # HINTS degree + component_id. NO x/y coordinates; the MVP4 root-anchored `hop`
    # is OMITTED (G5) — a whole-graph view has no root.
    id: str
    published_entity_id: str
    class_id: str
    label: str
    properties: dict[str, Any] = Field(default_factory=dict)
    quality_summary: dict[str, Any] = Field(default_factory=dict)
    source_count: int = 0
    evidence_count: int = 0
    lineage_available: bool = False
    degree: int = Field(ge=0)
    component_id: str


class GraphVizEdge(BaseModel):
    # Reuses the MVP4 GraphExploreEdge element fields by reference. No coordinates.
    id: str
    published_relation_id: str
    source_node_id: str
    target_node_id: str
    relation_id: str
    label: str
    properties: dict[str, Any] = Field(default_factory=dict)
    quality_summary: dict[str, Any] = Field(default_factory=dict)
    evidence_count: int = 0
    lineage_available: bool = False


class GraphVizTooLargeState(BaseModel):
    # Reused-by-reference from MVP4 GraphTooLargeState (SAFE_TOO_LARGE precedent).
    estimated_nodes: int
    estimated_edges: int
    node_budget: int = 150
    edge_budget: int = 300
    suggested_filters: list[str] = Field(default_factory=list)
    message: str


class GraphVizResponse(BaseModel):
    project_id: str
    scope: GraphVizScope
    published_graph_version_ref: GraphVizPublishedVersionRef | None = None
    generated_at: datetime
    status: GraphVizStatus
    summary: GraphVizSummary
    node_cap: int = Field(default=150, ge=1, le=150)
    edge_cap: int = Field(default=300, ge=1, le=300)
    truncated: bool = False
    nodes: list[GraphVizNode] = Field(default_factory=list)
    edges: list[GraphVizEdge] = Field(default_factory=list)
    too_large: GraphVizTooLargeState | None = None
    mutation_guard: GraphVizMutationGuard = Field(default_factory=GraphVizMutationGuard)
    boundary_note: str
