from fastapi import APIRouter, Query

from app.modules.tenancy import service
from app.modules.tenancy.schemas import (
    ProjectTenantResponse,
    TenantApiErrorResponse,
    TenantListResponse,
    TenantProjectListResponse,
    TenantSummaryResponse,
)

router = APIRouter(tags=["MVP6.10 Multi-tenant"])

# OPTIONAL dev-only actor override (G1). Absent -> the MVP5 dev-auth actor.
# Never a real auth/JWT tenant claim; not a production UI control.
_ActorIdQuery = Query(default=None, description="Optional dev-only actor override.")


def _actor(actor_id: str | None) -> str:
    return actor_id if actor_id else service.DEFAULT_ACTOR_ID


@router.get(
    "/tenants",
    response_model=TenantListResponse,
    summary="List my tenants (visibility set only)",
)
def list_my_tenants(actor_id: str | None = _ActorIdQuery) -> TenantListResponse:
    return service.list_my_tenants(_actor(actor_id))


@router.get(
    "/tenants/{tenant_id}",
    response_model=TenantSummaryResponse,
    summary="Get a tenant summary (member-only)",
    responses={403: {"model": TenantApiErrorResponse}, 404: {"model": TenantApiErrorResponse}},
)
def get_tenant_summary(
    tenant_id: str, actor_id: str | None = _ActorIdQuery
) -> TenantSummaryResponse:
    return service.get_tenant_summary(_actor(actor_id), tenant_id)


@router.get(
    "/tenants/{tenant_id}/projects",
    response_model=TenantProjectListResponse,
    summary="List a tenant's projects (tenant-scoped)",
    responses={403: {"model": TenantApiErrorResponse}, 404: {"model": TenantApiErrorResponse}},
)
def list_tenant_projects(
    tenant_id: str, actor_id: str | None = _ActorIdQuery
) -> TenantProjectListResponse:
    return service.list_tenant_projects(_actor(actor_id), tenant_id)


@router.get(
    "/projects/{project_id}/tenant",
    response_model=ProjectTenantResponse,
    summary="Resolve a project's tenant (member-only)",
    responses={403: {"model": TenantApiErrorResponse}, 404: {"model": TenantApiErrorResponse}},
)
def resolve_project_tenant(
    project_id: str, actor_id: str | None = _ActorIdQuery
) -> ProjectTenantResponse:
    return service.resolve_project_tenant(_actor(actor_id), project_id)
