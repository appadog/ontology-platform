from fastapi import APIRouter, Query

from app.core.errors import ApiErrorResponse
from app.modules.ontology_packs import service
from app.modules.ontology_packs.schemas import (
    OntologyPackCatalogListResponse,
    OntologyPackDetailResponse,
    PackApplyPreviewRequest,
    PackApplyPreviewResponse,
)

router = APIRouter(tags=["MVP6.11 Ontology Packs"])

# Any project-read member may view packs / run a preview; default dev role is a
# member role (mirrors the MVP6.9 connectors authz precedent). Non-member -> 403.
_DEFAULT_ACTOR_ROLE = "VIEWER"


@router.get(
    "/ontology-packs",
    response_model=OntologyPackCatalogListResponse,
    summary="List ontology-pack catalog",
    responses={403: {"model": ApiErrorResponse}},
)
def list_ontology_pack_catalog(
    actor_role: str = Query(default=_DEFAULT_ACTOR_ROLE),
) -> OntologyPackCatalogListResponse:
    service.require_project_read(actor_role)
    return service.catalog()


@router.get(
    "/ontology-packs/{pack_id}",
    response_model=OntologyPackDetailResponse,
    summary="Get ontology-pack detail (metadata + bundled elements)",
    responses={403: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
)
def get_ontology_pack_detail(
    pack_id: str,
    actor_role: str = Query(default=_DEFAULT_ACTOR_ROLE),
) -> OntologyPackDetailResponse:
    service.require_project_read(actor_role)
    pack = service.pack_or_404(pack_id)
    return service.detail(pack)


@router.post(
    "/projects/{project_id}/ontology-packs/{pack_id}/apply-preview",
    response_model=PackApplyPreviewResponse,
    summary="Run a dry-run apply-preview (creates nothing)",
    responses={
        400: {"model": ApiErrorResponse},
        403: {"model": ApiErrorResponse},
        404: {"model": ApiErrorResponse},
    },
)
def run_ontology_pack_apply_preview(
    project_id: str,
    pack_id: str,
    payload: PackApplyPreviewRequest | None = None,
    actor_role: str = Query(default=_DEFAULT_ACTOR_ROLE),
) -> PackApplyPreviewResponse:
    service.require_project_read(actor_role)
    pack = service.pack_or_404(pack_id)
    service.project_or_404(project_id)
    item_cap = payload.item_cap if payload is not None else None
    return service.apply_preview(project_id, pack, item_cap)
