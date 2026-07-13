from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.core.enums import Role
from app.core.errors import ApiException

from .schemas import (
    GraphVizClassCount,
    GraphVizEdge,
    GraphVizMutationGuard,
    GraphVizNode,
    GraphVizRelationCount,
    GraphVizResponse,
    GraphVizScope,
    GraphVizStatus,
    GraphVizSummary,
    GraphVizTooLargeState,
    GraphVizPublishedVersionRef,
)

# Frozen budgets (contract caps). Effective caps are the caller's in-range values.
NODE_CAP_MAX = 150
EDGE_CAP_MAX = 300
NODE_CAP_DEFAULT = 150
EDGE_CAP_DEFAULT = 300

# Constant read-only assertion present on every response (byte-stable).
BOUNDARY_NOTE = (
    "read-only visualization - nothing changes the graph; publishing stays the "
    "separate MVP3 publish path."
)

TOO_LARGE_MESSAGE = (
    "그래프가 너무 커서 전체를 그릴 수 없습니다 - 요약 통계만 표시합니다. "
    "필터로 범위를 좁혀 보세요."
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Internal fixture element shapes (deterministic, read-only, never mutated).
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class _Node:
    id: str
    published_entity_id: str
    class_id: str
    label: str
    source_count: int = 0
    evidence_count: int = 0
    lineage_available: bool = False


@dataclass(frozen=True)
class _Edge:
    id: str
    published_relation_id: str
    source_node_id: str
    target_node_id: str
    relation_id: str
    label: str
    evidence_count: int = 0
    lineage_available: bool = False


@dataclass(frozen=True)
class _Graph:
    version_ref: GraphVizPublishedVersionRef
    nodes: list[_Node] = field(default_factory=list)
    edges: list[_Edge] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Fixture matrix (PM Wave56 §11.1/§11.2, VERBATIM).
#   proj-viz-demo  / pgv-viz-demo-v1  : 12 nodes / 9 edges  -> READY
#   proj-viz-large / pgv-viz-large-v1 : 210 nodes / 480 edges -> TOO_LARGE_SUMMARY_ONLY
#   proj-viz-empty / (no current version)                    -> EMPTY (200)
# ---------------------------------------------------------------------------

_DEMO_CREATED_AT = datetime(2026, 7, 1, 9, 0, 0, tzinfo=timezone.utc)
_LARGE_CREATED_AT = datetime(2026, 7, 2, 9, 0, 0, tzinfo=timezone.utc)


def _build_demo_graph() -> _Graph:
    ref = GraphVizPublishedVersionRef(
        published_graph_version_id="pgv-viz-demo-v1",
        published_graph_version=1,
        ontology_version_id="otv-viz-demo",
        is_current=True,
        created_at=_DEMO_CREATED_AT,
    )
    # Nodes(12): person n1..n5 (5), org n6..n9 (4), doc n10..n12 (3).
    specs: list[tuple[int, str, str, str]] = []
    for i in range(1, 6):
        specs.append((i, "cls-person", "Person", f"Person {i}"))
    for i in range(6, 10):
        specs.append((i, "cls-org", "Organization", f"Org {i}"))
    for i in range(10, 13):
        specs.append((i, "cls-doc", "Document", f"Doc {i}"))
    nodes = [
        _Node(
            id=f"n-{i:02d}",
            published_entity_id=f"pe-viz-demo-{i:02d}",
            class_id=cls,
            label=label,
            source_count=1,
            evidence_count=1,
            lineage_available=True,
        )
        for (i, cls, _kind, label) in specs
    ]

    # Edges(9, directed):
    #   employs (org->person): n6->n1, n6->n2, n7->n3, n8->n4
    #   authored (person->doc): n1->n10, n2->n11, n3->n12
    #   partner  (org->org):    n6->n7, n8->n9
    edge_specs: list[tuple[int, int, str, str]] = [
        (6, 1, "rel-employs", "employs"),
        (6, 2, "rel-employs", "employs"),
        (7, 3, "rel-employs", "employs"),
        (8, 4, "rel-employs", "employs"),
        (1, 10, "rel-authored", "authored"),
        (2, 11, "rel-authored", "authored"),
        (3, 12, "rel-authored", "authored"),
        (6, 7, "rel-partner", "partner"),
        (8, 9, "rel-partner", "partner"),
    ]
    edges = [
        _Edge(
            id=f"e-{seq:02d}",
            published_relation_id=f"pr-viz-demo-{seq:02d}",
            source_node_id=f"n-{s:02d}",
            target_node_id=f"n-{t:02d}",
            relation_id=rel,
            label=label,
            evidence_count=1,
            lineage_available=True,
        )
        for seq, (s, t, rel, label) in enumerate(edge_specs, start=1)
    ]
    return _Graph(version_ref=ref, nodes=nodes, edges=edges)


def _build_large_graph() -> _Graph:
    ref = GraphVizPublishedVersionRef(
        published_graph_version_id="pgv-viz-large-v1",
        published_graph_version=1,
        ontology_version_id="otv-viz-large",
        is_current=True,
        created_at=_LARGE_CREATED_AT,
    )
    node_count = 210
    edge_count = 480
    classes = ("cls-person", "cls-org", "cls-doc")
    relations = ("rel-employs", "rel-authored", "rel-partner")
    nodes = [
        _Node(
            id=f"n-{i:04d}",
            published_entity_id=f"pe-viz-large-{i:04d}",
            class_id=classes[i % 3],
            label=f"Node {i}",
        )
        for i in range(node_count)
    ]
    edges: list[_Edge] = []
    for k in range(edge_count):
        s = k % node_count
        t = (k * 7 + 3) % node_count
        if t == s:
            t = (t + 1) % node_count
        edges.append(
            _Edge(
                id=f"e-{k:04d}",
                published_relation_id=f"pr-viz-large-{k:04d}",
                source_node_id=f"n-{s:04d}",
                target_node_id=f"n-{t:04d}",
                relation_id=relations[k % 3],
                label=relations[k % 3].split("-", 1)[1],
            )
        )
    return _Graph(version_ref=ref, nodes=nodes, edges=edges)


# Live process-local tables (rebuilt by reset_runtime_store()).
# _PROJECTS: project_id -> current published_graph_version_id (or None = resolvable
#            project with NO current published version -> 200 EMPTY). Unknown key ==
#            unknown project -> 404.
# _VERSIONS: published_graph_version_id -> _Graph.
_PROJECTS: dict[str, str | None] = {}
_VERSIONS: dict[str, _Graph] = {}


def reset_runtime_store() -> None:
    """Re-seed the deterministic read-only fixtures. P0 mutates nothing, so this is
    an idempotent re-seed kept for MVP6.1-6.11 seed/test parity."""
    _PROJECTS.clear()
    _VERSIONS.clear()

    demo = _build_demo_graph()
    large = _build_large_graph()
    _VERSIONS[demo.version_ref.published_graph_version_id] = demo
    _VERSIONS[large.version_ref.published_graph_version_id] = large

    _PROJECTS["proj-viz-demo"] = demo.version_ref.published_graph_version_id
    _PROJECTS["proj-viz-large"] = large.version_ref.published_graph_version_id
    # Resolvable project with NO current published version -> 200 EMPTY.
    _PROJECTS["proj-viz-empty"] = None


# Seed at import time (module-load parity with the other MVP6 modules).
reset_runtime_store()


# ---------------------------------------------------------------------------
# Authz + resolution guards. Authz = any project viewer; 403 / 404 only.
# ---------------------------------------------------------------------------

_VALID_ROLES = {r.value for r in Role}


def require_project_read(actor_role: str) -> None:
    if actor_role not in _VALID_ROLES:
        raise ApiException(
            status_code=403,
            code="PERMISSION_DENIED",
            message="A project-read member role is required to view the graph visualization.",
            details={"actor_role": actor_role},
        )


def project_or_404(project_id: str) -> None:
    if project_id not in _PROJECTS:
        raise ApiException(
            status_code=404,
            code="PROJECT_NOT_FOUND",
            message="요청한 프로젝트를 찾을 수 없습니다.",
            details={"project_id": project_id},
        )


def _resolve_graph(project_id: str, version_id: str | None) -> _Graph | None:
    """Resolve the target published graph. version_id given + unknown -> 404. None
    given + no current version -> None (EMPTY)."""
    if version_id is not None:
        graph = _VERSIONS.get(version_id)
        if graph is None:
            raise ApiException(
                status_code=404,
                code="PUBLISHED_GRAPH_VERSION_NOT_FOUND",
                message="요청한 게시 그래프 버전을 찾을 수 없습니다.",
                details={"version_id": version_id},
            )
        return graph
    current = _PROJECTS[project_id]
    if current is None:
        return None
    return _VERSIONS[current]


# ---------------------------------------------------------------------------
# Summary statistics — single O(V+E) pass (counts + union-find over the
# UNDIRECTED projection). G3 formulas:
#   density = E / (V*(V-1)) directed for V>1 else 0
#   component_count / largest_component_size / max_degree over the undirected
#   projection; isolated_node_count = degree-0 nodes (own component).
# ---------------------------------------------------------------------------


@dataclass
class _Stats:
    summary: GraphVizSummary
    component_id_by_node: dict[str, str]
    degree_by_node: dict[str, int]


def _compute_stats(graph: _Graph) -> _Stats:
    node_ids = [n.id for n in graph.nodes]
    index = {nid: i for i, nid in enumerate(node_ids)}
    v = len(node_ids)

    # per-class node counts
    class_counts: dict[str, int] = {}
    for n in graph.nodes:
        class_counts[n.class_id] = class_counts.get(n.class_id, 0) + 1

    # per-relation edge counts + undirected degree + union-find
    relation_counts: dict[str, int] = {}
    degree = [0] * v
    parent = list(range(v))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: int, b: int) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            # attach the larger index root under the smaller for determinism
            if ra < rb:
                parent[rb] = ra
            else:
                parent[ra] = rb

    for e in graph.edges:
        relation_counts[e.relation_id] = relation_counts.get(e.relation_id, 0) + 1
        si = index[e.source_node_id]
        ti = index[e.target_node_id]
        degree[si] += 1
        degree[ti] += 1
        union(si, ti)

    # component ids: deterministic — assign c-<k> in order of first appearance
    # while iterating nodes in their stored (published_entity_id asc) order.
    comp_label: dict[int, str] = {}
    component_id_by_node: dict[str, str] = {}
    comp_size: dict[str, int] = {}
    next_index = 0
    for i, nid in enumerate(node_ids):
        root = find(i)
        if root not in comp_label:
            comp_label[root] = f"c-{next_index}"
            next_index += 1
        cid = comp_label[root]
        component_id_by_node[nid] = cid
        comp_size[cid] = comp_size.get(cid, 0) + 1

    degree_by_node = {nid: degree[index[nid]] for nid in node_ids}

    e_count = len(graph.edges)
    density = (e_count / (v * (v - 1))) if v > 1 else 0.0
    component_count = len(comp_label)
    largest_component_size = max(comp_size.values()) if comp_size else 0
    isolated_node_count = sum(1 for d in degree if d == 0)
    max_degree = max(degree) if degree else 0

    summary = GraphVizSummary(
        total_node_count=v,
        total_edge_count=e_count,
        node_counts_by_class=[
            GraphVizClassCount(class_id=cid, count=class_counts[cid])
            for cid in sorted(class_counts)
        ],
        edge_counts_by_relation=[
            GraphVizRelationCount(relation_id=rid, count=relation_counts[rid])
            for rid in sorted(relation_counts)
        ],
        density=density,
        component_count=component_count,
        largest_component_size=largest_component_size,
        isolated_node_count=isolated_node_count,
        max_degree=max_degree,
    )
    return _Stats(
        summary=summary,
        component_id_by_node=component_id_by_node,
        degree_by_node=degree_by_node,
    )


def _empty_summary() -> GraphVizSummary:
    return GraphVizSummary(
        total_node_count=0,
        total_edge_count=0,
        node_counts_by_class=[],
        edge_counts_by_relation=[],
        density=0.0,
        component_count=0,
        largest_component_size=0,
        isolated_node_count=0,
        max_degree=0,
    )


# ---------------------------------------------------------------------------
# Compute-on-read graph-viz projection.
# ---------------------------------------------------------------------------


def graph_viz(
    project_id: str,
    version_id: str | None,
    node_cap: int,
    edge_cap: int,
    class_ids: list[str] | None,
    relation_ids: list[str] | None,
) -> GraphVizResponse:
    generated_at = utc_now()
    graph = _resolve_graph(project_id, version_id)

    # EMPTY: no current published version.
    if graph is None:
        return GraphVizResponse(
            project_id=project_id,
            scope=GraphVizScope.PUBLISHED,
            published_graph_version_ref=None,
            generated_at=generated_at,
            status=GraphVizStatus.EMPTY,
            summary=_empty_summary(),
            node_cap=node_cap,
            edge_cap=edge_cap,
            truncated=False,
            nodes=[],
            edges=[],
            too_large=None,
            mutation_guard=GraphVizMutationGuard(),
            boundary_note=BOUNDARY_NOTE,
        )

    stats = _compute_stats(graph)
    summary = stats.summary
    total_nodes = summary.total_node_count
    total_edges = summary.total_edge_count

    # A published version that resolves to zero entities is also EMPTY.
    if total_nodes == 0:
        return GraphVizResponse(
            project_id=project_id,
            scope=GraphVizScope.PUBLISHED,
            published_graph_version_ref=graph.version_ref,
            generated_at=generated_at,
            status=GraphVizStatus.EMPTY,
            summary=summary,
            node_cap=node_cap,
            edge_cap=edge_cap,
            truncated=False,
            nodes=[],
            edges=[],
            too_large=None,
            mutation_guard=GraphVizMutationGuard(),
            boundary_note=BOUNDARY_NOTE,
        )

    # Status is decided by FULL-graph totals vs the effective caps. Filters never
    # rescue a too-large graph (G1).
    if total_nodes > node_cap or total_edges > edge_cap:
        too_large = GraphVizTooLargeState(
            estimated_nodes=total_nodes,
            estimated_edges=total_edges,
            node_budget=node_cap,
            edge_budget=edge_cap,
            suggested_filters=[],
            message=TOO_LARGE_MESSAGE,
        )
        return GraphVizResponse(
            project_id=project_id,
            scope=GraphVizScope.PUBLISHED,
            published_graph_version_ref=graph.version_ref,
            generated_at=generated_at,
            status=GraphVizStatus.TOO_LARGE_SUMMARY_ONLY,
            summary=summary,
            node_cap=node_cap,
            edge_cap=edge_cap,
            truncated=True,
            nodes=[],
            edges=[],
            too_large=too_large,
            mutation_guard=GraphVizMutationGuard(),
            boundary_note=BOUNDARY_NOTE,
        )

    # READY: build the bounded whole-graph element view with layout hints. G1 filters
    # induce the ELEMENT view only; summary/degree/component_id stay over the full graph.
    class_filter = set(class_ids) if class_ids else None
    relation_filter = set(relation_ids) if relation_ids else None

    ordered_nodes = sorted(graph.nodes, key=lambda n: n.published_entity_id)
    included_node_ids: set[str] = set()
    viz_nodes: list[GraphVizNode] = []
    for n in ordered_nodes:
        if class_filter is not None and n.class_id not in class_filter:
            continue
        included_node_ids.add(n.id)
        viz_nodes.append(
            GraphVizNode(
                id=n.id,
                published_entity_id=n.published_entity_id,
                class_id=n.class_id,
                label=n.label,
                properties={},
                quality_summary={},
                source_count=n.source_count,
                evidence_count=n.evidence_count,
                lineage_available=n.lineage_available,
                degree=stats.degree_by_node[n.id],
                component_id=stats.component_id_by_node[n.id],
            )
        )

    ordered_edges = sorted(
        graph.edges,
        key=lambda e: (e.source_node_id, e.target_node_id, e.published_relation_id),
    )
    viz_edges: list[GraphVizEdge] = []
    for e in ordered_edges:
        if relation_filter is not None and e.relation_id not in relation_filter:
            continue
        # An edge is in the view iff both endpoint nodes are included (G1).
        if e.source_node_id not in included_node_ids or e.target_node_id not in included_node_ids:
            continue
        viz_edges.append(
            GraphVizEdge(
                id=e.id,
                published_relation_id=e.published_relation_id,
                source_node_id=e.source_node_id,
                target_node_id=e.target_node_id,
                relation_id=e.relation_id,
                label=e.label,
                properties={},
                quality_summary={},
                evidence_count=e.evidence_count,
                lineage_available=e.lineage_available,
            )
        )

    # Element caps are a no-op for READY (full graph is within budget) but applied
    # defensively after filtering to honour the caps deterministically.
    viz_nodes = viz_nodes[:node_cap]
    node_keep = {n.id for n in viz_nodes}
    viz_edges = [e for e in viz_edges if e.source_node_id in node_keep and e.target_node_id in node_keep]
    viz_edges = viz_edges[:edge_cap]

    return GraphVizResponse(
        project_id=project_id,
        scope=GraphVizScope.PUBLISHED,
        published_graph_version_ref=graph.version_ref,
        generated_at=generated_at,
        status=GraphVizStatus.READY,
        summary=summary,
        node_cap=node_cap,
        edge_cap=edge_cap,
        truncated=False,
        nodes=viz_nodes,
        edges=viz_edges,
        too_large=None,
        mutation_guard=GraphVizMutationGuard(),
        boundary_note=BOUNDARY_NOTE,
    )
