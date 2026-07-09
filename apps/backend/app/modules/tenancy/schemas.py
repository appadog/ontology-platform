from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field

# MVP5 RBAC Role reused BY REFERENCE (no new literal / no rename). Re-exported so
# the tenancy OpenAPI surfaces the same `Role` component (same names as
# app/core/enums.py). MVP6.10 adds NO role literal.
from app.core.enums import Role

__all__ = [
    "Role",
    "TenantStatus",
    "TenantMembershipStatus",
    "TenantAccessDenialReason",
    "TenantMutationGuard",
    "TenantMembership",
    "TenantSummary",
    "ProjectSummaryRef",
    "TenantListResponse",
    "TenantSummaryResponse",
    "TenantProjectListResponse",
    "ProjectTenantResponse",
    "TenantApiError",
    "TenantApiErrorResponse",
]


# ---------------------------------------------------------------------------
# Enums (match docs/api/openapi-mvp6-10-draft.json EXACTLY; frozen names).
# ---------------------------------------------------------------------------


class TenantStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    ARCHIVED = "ARCHIVED"


class TenantMembershipStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"


class TenantAccessDenialReason(str, Enum):
    NOT_A_MEMBER = "NOT_A_MEMBER"
    TENANT_ARCHIVED = "TENANT_ARCHIVED"
    MEMBERSHIP_SUSPENDED = "MEMBERSHIP_SUSPENDED"
    TENANT_SUSPENDED = "TENANT_SUSPENDED"


# ---------------------------------------------------------------------------
# All-false 8-flag mutation guard. Every flag is const false, always. MVP6.10
# turns NO flag true, ever (mirrors the MVP6.1-6.9 all-false pattern).
# cross_tenant_access_granted + project_rehomed are the isolation-specific
# assertions QA leans on hardest.
# ---------------------------------------------------------------------------


class TenantMutationGuard(BaseModel):
    tenant_created: Literal[False] = False
    tenant_updated: Literal[False] = False
    tenant_deleted: Literal[False] = False
    membership_mutated: Literal[False] = False
    project_rehomed: Literal[False] = False
    cross_tenant_access_granted: Literal[False] = False
    candidate_graph_mutated: Literal[False] = False
    published_graph_mutated: Literal[False] = False


# ---------------------------------------------------------------------------
# Core read-only shapes.
# ---------------------------------------------------------------------------


class TenantMembership(BaseModel):
    actor_id: str
    tenant_id: str
    role: Role
    status: TenantMembershipStatus


class TenantSummary(BaseModel):
    id: str
    display_name: str
    description: str | None = None
    status: TenantStatus
    my_membership: TenantMembership
    project_count: int
    created_at: datetime


class ProjectSummaryRef(BaseModel):
    # Reused BY REFERENCE from the MVP1 ProjectSummary (same field names; defined
    # locally to keep this module self-contained, NO rename). The MVP1 Project
    # model is unchanged and tenant-unaware; this is a read overlay.
    id: str
    name: str
    description: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
    source_count: int
    ontology_version_count: int


# ---------------------------------------------------------------------------
# Response envelopes (every 200 carries the all-false guard).
# ---------------------------------------------------------------------------


class TenantListResponse(BaseModel):
    actor_id: str
    items: list[TenantSummary] = Field(default_factory=list)
    total_count: int
    mutation_guard: TenantMutationGuard = Field(default_factory=TenantMutationGuard)


class TenantSummaryResponse(BaseModel):
    actor_id: str
    tenant: TenantSummary
    mutation_guard: TenantMutationGuard = Field(default_factory=TenantMutationGuard)


class TenantProjectListResponse(BaseModel):
    actor_id: str
    tenant_id: str
    items: list[ProjectSummaryRef] = Field(default_factory=list)
    total_count: int
    mutation_guard: TenantMutationGuard = Field(default_factory=TenantMutationGuard)


class ProjectTenantResponse(BaseModel):
    actor_id: str
    project_id: str
    tenant: TenantSummary
    mutation_guard: TenantMutationGuard = Field(default_factory=TenantMutationGuard)


# ---------------------------------------------------------------------------
# Error envelope (documentation-only mirror of the runtime ApiException shape:
# `{"error": {code, message, details}}`). Isolation errors carry NO guard; the
# denial taxonomy is surfaced via details.denial_reason (TenantAccessDenialReason).
# ---------------------------------------------------------------------------


class TenantApiErrorDetails(BaseModel):
    denial_reason: TenantAccessDenialReason | None = None


class TenantApiError(BaseModel):
    code: Literal[
        "TENANT_NOT_FOUND", "TENANT_ACCESS_SUSPENDED", "PROJECT_NOT_FOUND"
    ]
    message: str
    details: TenantApiErrorDetails | None = None


class TenantApiErrorResponse(BaseModel):
    error: TenantApiError
