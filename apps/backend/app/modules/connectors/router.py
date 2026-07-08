from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.errors import ApiErrorResponse
from app.db.session import get_db
from app.modules.connectors import service
from app.modules.connectors.schemas import (
    ConnectorCatalogListResponse,
    ConnectorConfigSchemaResponse,
    ConnectorImportPreviewRequest,
    ConnectorImportPreviewResponse,
)

router = APIRouter(tags=["MVP6.9 Connectors"])

# Any project-read member may view connectors; default dev role is a member role.
_DEFAULT_ACTOR_ROLE = "VIEWER"


@router.get(
    "/projects/{project_id}/connectors",
    response_model=ConnectorCatalogListResponse,
    summary="List connector catalog",
    responses={403: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
)
def list_connector_catalog(
    project_id: str,
    actor_role: str = Query(default=_DEFAULT_ACTOR_ROLE),
    db: Session = Depends(get_db),
) -> ConnectorCatalogListResponse:
    service.require_project_read(actor_role)
    service.project_or_404(db, project_id)
    return service.catalog(project_id)


@router.get(
    "/projects/{project_id}/connectors/{connector_kind}/config-schema",
    response_model=ConnectorConfigSchemaResponse,
    summary="Get a connector kind's masked config schema",
    responses={403: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
)
def get_connector_config_schema(
    project_id: str,
    connector_kind: str,
    actor_role: str = Query(default=_DEFAULT_ACTOR_ROLE),
    db: Session = Depends(get_db),
) -> ConnectorConfigSchemaResponse:
    service.require_project_read(actor_role)
    service.project_or_404(db, project_id)
    kind = service.connector_kind_or_404(connector_kind)
    return service.config_schema(project_id, kind)


@router.post(
    "/projects/{project_id}/connectors/{connector_kind}/import-preview",
    response_model=ConnectorImportPreviewResponse,
    summary="Run a dry-run import preview (creates nothing)",
    responses={
        400: {"model": ApiErrorResponse},
        403: {"model": ApiErrorResponse},
        404: {"model": ApiErrorResponse},
    },
)
def run_connector_import_preview(
    project_id: str,
    connector_kind: str,
    payload: ConnectorImportPreviewRequest,
    actor_role: str = Query(default=_DEFAULT_ACTOR_ROLE),
    db: Session = Depends(get_db),
) -> ConnectorImportPreviewResponse:
    service.require_project_read(actor_role)
    service.project_or_404(db, project_id)
    kind = service.connector_kind_or_404(connector_kind)
    return service.import_preview(
        project_id,
        kind,
        dict(payload.config),
        payload.item_cap,
    )
