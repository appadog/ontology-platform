from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from app.core.enums import Role
from app.core.errors import ApiException

from .schemas import (
    ProjectSummaryRef,
    ProjectTenantResponse,
    TenantAccessDenialReason,
    TenantListResponse,
    TenantMembership,
    TenantMembershipStatus,
    TenantMutationGuard,
    TenantProjectListResponse,
    TenantStatus,
    TenantSummary,
    TenantSummaryResponse,
)

# Default acting actor when no dev-only actor_id override is supplied (G1 freeze;
# mirrors the MVP5/MVP6.5 governance dev-auth actor).
DEFAULT_ACTOR_ID = "dev-user"


def _utc(y: int, mo: int, d: int) -> datetime:
    return datetime(y, mo, d, 0, 0, 0, tzinfo=timezone.utc)


# ---------------------------------------------------------------------------
# Deterministic process-local fixtures (G3/G5). Read-only; NEVER mutated. NO DB,
# NO tenant_id column / FK / migration. reset_runtime_store() re-seeds these
# module-level tables to mirror the MVP6.1-6.9 module contract.
# ---------------------------------------------------------------------------


class _TenantFixture:
    __slots__ = ("id", "display_name", "description", "status", "created_at")

    def __init__(
        self,
        id: str,
        display_name: str,
        description: str | None,
        status: TenantStatus,
        created_at: datetime,
    ) -> None:
        self.id = id
        self.display_name = display_name
        self.description = description
        self.status = status
        self.created_at = created_at


# 6 tenants (frozen G5 matrix).
_TENANT_SEED: list[_TenantFixture] = [
    _TenantFixture(
        "tenant-acme", "Acme Workspace", "Primary demo tenant (mock).",
        TenantStatus.ACTIVE, _utc(2026, 1, 1),
    ),
    _TenantFixture(
        "tenant-globex", "Globex Workspace", "Second tenant dev-user also belongs to (mock).",
        TenantStatus.ACTIVE, _utc(2026, 1, 2),
    ),
    _TenantFixture(
        "tenant-initech", "Initech Workspace", "A tenant dev-user is NOT a member of (mock).",
        TenantStatus.ACTIVE, _utc(2026, 1, 3),
    ),
    _TenantFixture(
        "tenant-umbrella", "Umbrella Workspace", "Membership suspended for dev-user (mock).",
        TenantStatus.ACTIVE, _utc(2026, 1, 4),
    ),
    _TenantFixture(
        "tenant-soylent", "Soylent Workspace", "Suspended tenant (mock).",
        TenantStatus.SUSPENDED, _utc(2026, 1, 5),
    ),
    _TenantFixture(
        "tenant-hooli", "Hooli Workspace", "Archived tenant (mock).",
        TenantStatus.ARCHIVED, _utc(2026, 1, 6),
    ),
]

# 6 memberships (actor_id, tenant_id, role, status). dev-user has 5; dev-user-2
# is a member of tenant-initech ONLY (proves disjoint visibility sets / no-leak).
_MEMBERSHIP_SEED: list[tuple[str, str, Role, TenantMembershipStatus]] = [
    ("dev-user", "tenant-acme", Role.PROJECT_ADMIN, TenantMembershipStatus.ACTIVE),
    ("dev-user", "tenant-globex", Role.VIEWER, TenantMembershipStatus.ACTIVE),
    ("dev-user", "tenant-umbrella", Role.REVIEWER, TenantMembershipStatus.SUSPENDED),
    ("dev-user", "tenant-soylent", Role.DATA_MANAGER, TenantMembershipStatus.ACTIVE),
    ("dev-user", "tenant-hooli", Role.VIEWER, TenantMembershipStatus.ACTIVE),
    ("dev-user-2", "tenant-initech", Role.PROJECT_ADMIN, TenantMembershipStatus.ACTIVE),
]

# 7 projects owned by tenants (project_id -> (tenant_id, ProjectSummaryRef kwargs)).
# Self-contained: isolation tests do NOT depend on MVP1 seed state.
_PROJECT_SEED: list[tuple[str, dict]] = [
    ("tenant-acme", {
        "id": "proj-acme-kg", "name": "Acme Knowledge Graph",
        "description": "Owned by tenant-acme (mock).", "status": "ACTIVE",
        "created_at": _utc(2026, 2, 1), "updated_at": _utc(2026, 3, 1),
        "source_count": 4, "ontology_version_count": 2,
    }),
    ("tenant-acme", {
        "id": "proj-acme-catalog", "name": "Acme Product Catalog",
        "description": None, "status": "DRAFT",
        "created_at": _utc(2026, 2, 2), "updated_at": _utc(2026, 2, 20),
        "source_count": 1, "ontology_version_count": 0,
    }),
    ("tenant-globex", {
        "id": "proj-globex-ops", "name": "Globex Operations",
        "description": "Owned by tenant-globex (mock).", "status": "ACTIVE",
        "created_at": _utc(2026, 2, 3), "updated_at": _utc(2026, 2, 25),
        "source_count": 2, "ontology_version_count": 1,
    }),
    ("tenant-initech", {
        "id": "proj-initech-secret", "name": "Initech Secret Project",
        "description": "Owned by tenant-initech; NEVER visible to dev-user (mock).",
        "status": "ACTIVE",
        "created_at": _utc(2026, 2, 4), "updated_at": _utc(2026, 2, 26),
        "source_count": 3, "ontology_version_count": 1,
    }),
    ("tenant-umbrella", {
        "id": "proj-umbrella-01", "name": "Umbrella Project 01",
        "description": None, "status": "ACTIVE",
        "created_at": _utc(2026, 2, 5), "updated_at": _utc(2026, 2, 27),
        "source_count": 1, "ontology_version_count": 0,
    }),
    ("tenant-soylent", {
        "id": "proj-soylent-01", "name": "Soylent Project 01",
        "description": None, "status": "ACTIVE",
        "created_at": _utc(2026, 2, 6), "updated_at": _utc(2026, 2, 28),
        "source_count": 1, "ontology_version_count": 0,
    }),
    ("tenant-hooli", {
        "id": "proj-hooli-01", "name": "Hooli Project 01",
        "description": None, "status": "ARCHIVED",
        "created_at": _utc(2026, 2, 7), "updated_at": _utc(2026, 3, 2),
        "source_count": 0, "ontology_version_count": 0,
    }),
]


# Live process-local tables (rebuilt by reset_runtime_store()).
_TENANTS: dict[str, _TenantFixture] = {}
_MEMBERSHIPS: dict[tuple[str, str], TenantMembership] = {}
_PROJECT_OWNER: dict[str, str] = {}
_PROJECTS_BY_TENANT: dict[str, list[ProjectSummaryRef]] = {}


def reset_runtime_store() -> None:
    """Re-seed the deterministic read-only fixtures. P0 mutates nothing, so this
    is effectively an idempotent re-seed kept for MVP6.1-6.9 seed/test parity."""
    _TENANTS.clear()
    _MEMBERSHIPS.clear()
    _PROJECT_OWNER.clear()
    _PROJECTS_BY_TENANT.clear()

    for t in _TENANT_SEED:
        _TENANTS[t.id] = t
    for actor_id, tenant_id, role, status in _MEMBERSHIP_SEED:
        _MEMBERSHIPS[(actor_id, tenant_id)] = TenantMembership(
            actor_id=actor_id, tenant_id=tenant_id, role=role, status=status
        )
    for tenant_id, kwargs in _PROJECT_SEED:
        _PROJECT_OWNER[kwargs["id"]] = tenant_id
        _PROJECTS_BY_TENANT.setdefault(tenant_id, []).append(ProjectSummaryRef(**kwargs))


# Seed at import time (module-load parity with the other MVP6 modules).
reset_runtime_store()


# ---------------------------------------------------------------------------
# Isolation decision (single default-deny function; 404-not-leak / 403-suspended).
# ---------------------------------------------------------------------------


class _Outcome(str, Enum):
    VISIBLE = "VISIBLE"
    SUSPENDED = "SUSPENDED"  # 403 TENANT_ACCESS_SUSPENDED
    NOT_FOUND = "NOT_FOUND"  # 404 (existence not leaked)


def _decide(
    actor_id: str, tenant_id: str
) -> tuple[_Outcome, TenantAccessDenialReason | None, TenantMembership | None]:
    """The one isolation function. A tenant is VISIBLE iff the actor has an ACTIVE
    membership on an ACTIVE tenant; otherwise it is denied (default-deny)."""
    tenant = _TENANTS.get(tenant_id)
    membership = _MEMBERSHIPS.get((actor_id, tenant_id))

    # Unknown tenant OR not-a-member -> 404, existence never leaked.
    if tenant is None or membership is None:
        return _Outcome.NOT_FOUND, TenantAccessDenialReason.NOT_A_MEMBER, None

    # Known relationship. ARCHIVED tenant is treated as out-of-visibility (404).
    if tenant.status is TenantStatus.ARCHIVED:
        return _Outcome.NOT_FOUND, TenantAccessDenialReason.TENANT_ARCHIVED, membership
    # Known-but-inactive relationships -> 403 (safe: caller already knows it exists).
    if membership.status is TenantMembershipStatus.SUSPENDED:
        return _Outcome.SUSPENDED, TenantAccessDenialReason.MEMBERSHIP_SUSPENDED, membership
    if tenant.status is TenantStatus.SUSPENDED:
        return _Outcome.SUSPENDED, TenantAccessDenialReason.TENANT_SUSPENDED, membership
    return _Outcome.VISIBLE, None, membership


def _tenant_not_found(reason: TenantAccessDenialReason) -> ApiException:
    return ApiException(
        status_code=404,
        code="TENANT_NOT_FOUND",
        message="요청한 테넌트를 찾을 수 없습니다.",
        details={"denial_reason": reason.value},
    )


def _access_suspended(reason: TenantAccessDenialReason) -> ApiException:
    return ApiException(
        status_code=403,
        code="TENANT_ACCESS_SUSPENDED",
        message="해당 테넌트에 대한 접근이 일시 중지되었습니다.",
        details={"denial_reason": reason.value},
    )


def _project_not_found() -> ApiException:
    # Cross-tenant / unknown project: existence never leaked, NO denial_reason.
    return ApiException(
        status_code=404,
        code="PROJECT_NOT_FOUND",
        message="요청한 프로젝트를 찾을 수 없습니다.",
    )


def _project_count(tenant_id: str) -> int:
    return len(_PROJECTS_BY_TENANT.get(tenant_id, []))


def _summary(tenant: _TenantFixture, membership: TenantMembership) -> TenantSummary:
    return TenantSummary(
        id=tenant.id,
        display_name=tenant.display_name,
        description=tenant.description,
        status=tenant.status,
        my_membership=membership,
        project_count=_project_count(tenant.id),
        created_at=tenant.created_at,
    )


def _resolve_visible_summary_or_raise(actor_id: str, tenant_id: str) -> TenantSummary:
    outcome, reason, membership = _decide(actor_id, tenant_id)
    if outcome is _Outcome.VISIBLE:
        assert membership is not None  # noqa: S101 - VISIBLE implies a membership
        return _summary(_TENANTS[tenant_id], membership)
    if outcome is _Outcome.SUSPENDED:
        assert reason is not None
        raise _access_suspended(reason)
    assert reason is not None
    raise _tenant_not_found(reason)


# ---------------------------------------------------------------------------
# Public service operations (READ-ONLY; every 200 carries all-false guard).
# ---------------------------------------------------------------------------


def list_my_tenants(actor_id: str) -> TenantListResponse:
    """Visibility set only: tenants for which a direct GET would return 200
    (ACTIVE membership on an ACTIVE tenant). Never any other tenant."""
    items: list[TenantSummary] = []
    for tenant in _TENANT_SEED:  # deterministic order
        outcome, _reason, membership = _decide(actor_id, tenant.id)
        if outcome is _Outcome.VISIBLE and membership is not None:
            items.append(_summary(tenant, membership))
    return TenantListResponse(
        actor_id=actor_id,
        items=items,
        total_count=len(items),
        mutation_guard=TenantMutationGuard(),
    )


def get_tenant_summary(actor_id: str, tenant_id: str) -> TenantSummaryResponse:
    tenant = _resolve_visible_summary_or_raise(actor_id, tenant_id)
    return TenantSummaryResponse(
        actor_id=actor_id, tenant=tenant, mutation_guard=TenantMutationGuard()
    )


def list_tenant_projects(actor_id: str, tenant_id: str) -> TenantProjectListResponse:
    # Same isolation decision as the summary; only then return THIS tenant's
    # projects (never another tenant's; cross_tenant_access_granted stays false).
    _resolve_visible_summary_or_raise(actor_id, tenant_id)
    items = list(_PROJECTS_BY_TENANT.get(tenant_id, []))
    return TenantProjectListResponse(
        actor_id=actor_id,
        tenant_id=tenant_id,
        items=items,
        total_count=len(items),
        mutation_guard=TenantMutationGuard(),
    )


def resolve_project_tenant(actor_id: str, project_id: str) -> ProjectTenantResponse:
    owning_tenant_id = _PROJECT_OWNER.get(project_id)
    # Unknown project -> 404 PROJECT_NOT_FOUND (no leak).
    if owning_tenant_id is None:
        raise _project_not_found()

    outcome, reason, membership = _decide(actor_id, owning_tenant_id)
    if outcome is _Outcome.VISIBLE and membership is not None:
        tenant = _summary(_TENANTS[owning_tenant_id], membership)
        return ProjectTenantResponse(
            actor_id=actor_id,
            project_id=project_id,
            tenant=tenant,
            mutation_guard=TenantMutationGuard(),
        )
    # Known-but-inactive owning tenant -> 403 (mirrors the tenant decision).
    if outcome is _Outcome.SUSPENDED:
        assert reason is not None
        raise _access_suspended(reason)
    # Not-a-member / archived / unknown owning tenant -> 404 PROJECT_NOT_FOUND
    # (cross-tenant project existence is NOT leaked).
    raise _project_not_found()
