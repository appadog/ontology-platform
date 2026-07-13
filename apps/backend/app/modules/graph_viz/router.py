from fastapi import APIRouter, Query

from app.core.errors import ApiErrorResponse
from app.modules.graph_viz import service
from app.modules.graph_viz.schemas import GraphVizResponse

router = APIRouter(tags=["MVP6.12 Advanced Visualization"])

# Any project-read member may view the visualization (mirrors the MVP6.11 packs
# authz precedent). Non-member -> 403.
_DEFAULT_ACTOR_ROLE = "VIEWER"


@router.get(
    "/projects/{project_id}/graph-viz",
    response_model=GraphVizResponse,
    response_model_exclude_none=False,
    summary="Get read-only whole-graph viz data + summary for a project's published graph",
    responses={
        400: {"model": ApiErrorResponse},
        403: {"model": ApiErrorResponse},
        404: {"model": ApiErrorResponse},
    },
)
def get_project_graph_viz(
    project_id: str,
    version_id: str | None = Query(default=None),
    node_cap: int = Query(default=150, ge=1, le=150),
    edge_cap: int = Query(default=300, ge=1, le=300),
    class_ids: list[str] | None = Query(default=None),
    relation_ids: list[str] | None = Query(default=None),
    actor_role: str = Query(default=_DEFAULT_ACTOR_ROLE),
) -> GraphVizResponse:
    service.require_project_read(actor_role)
    service.project_or_404(project_id)
    return service.graph_viz(
        project_id=project_id,
        version_id=version_id,
        node_cap=node_cap,
        edge_cap=edge_cap,
        class_ids=class_ids,
        relation_ids=relation_ids,
    )
