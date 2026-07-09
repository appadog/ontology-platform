import {
  ProjectSummaryRef,
  TenantAccessDenialReason,
  TenantMembership,
  TenantMembershipStatus,
  TenantMutationGuard,
  TenantStatus,
  TenantSummary,
} from "../api/types";

// Deterministic MVP6.10 Multi-tenant fixtures. READ-ONLY tenant context + STRICT
// ISOLATION. Field/enum names match docs/api/openapi-mvp6-10-draft.json EXACTLY (4
// GET paths / 13 schemas) and the frozen PM6-034 fixture matrix VERBATIM (ids,
// statuses, memberships, project mapping, counts) — the same tables the backend
// `apps/backend/app/modules/tenancy/service.py` builds, so mock and actual agree.
//
// Nothing is created / updated / deleted / re-homed. A tenant is VISIBLE iff the
// actor has an ACTIVE membership on an ACTIVE tenant; otherwise default-deny:
//   not-a-member / unknown / ARCHIVED  -> 404 TENANT_NOT_FOUND (existence NOT leaked)
//   membership SUSPENDED / tenant SUSPENDED -> 403 TENANT_ACCESS_SUSPENDED
// Every 200 carries an ALL-FALSE 8-flag TenantMutationGuard; errors carry no guard
// (denial states are driven by ApiError.details.denial_reason).
//
// Default actor = "dev-user" (visibility set = {tenant-acme, tenant-globex}).
// Second actor = "dev-user-2" (member of tenant-initech ONLY — proves disjoint
// visibility sets / no-leak). Any other id = member of nothing.

export const TENANCY_DEFAULT_ACTOR_ID = "dev-user";
export const TENANCY_SECOND_ACTOR_ID = "dev-user-2";

/** ALL 8 FLAGS FALSE, on every 200 response. MVP6.10 turns NO flag true, ever. */
export const allFalseTenantGuard: TenantMutationGuard = {
  tenant_created: false,
  tenant_updated: false,
  tenant_deleted: false,
  membership_mutated: false,
  project_rehomed: false,
  cross_tenant_access_granted: false,
  candidate_graph_mutated: false,
  published_graph_mutated: false,
};

interface TenantFixture {
  id: string;
  display_name: string;
  description: string | null;
  status: TenantStatus;
  created_at: string;
}

// 6 tenants (frozen G5 matrix).
const TENANT_SEED: TenantFixture[] = [
  { id: "tenant-acme", display_name: "Acme Workspace", description: "Primary demo tenant (mock).", status: "ACTIVE", created_at: "2026-01-01T00:00:00Z" },
  { id: "tenant-globex", display_name: "Globex Workspace", description: "Second tenant dev-user also belongs to (mock).", status: "ACTIVE", created_at: "2026-01-02T00:00:00Z" },
  { id: "tenant-initech", display_name: "Initech Workspace", description: "A tenant dev-user is NOT a member of (mock).", status: "ACTIVE", created_at: "2026-01-03T00:00:00Z" },
  { id: "tenant-umbrella", display_name: "Umbrella Workspace", description: "Membership suspended for dev-user (mock).", status: "ACTIVE", created_at: "2026-01-04T00:00:00Z" },
  { id: "tenant-soylent", display_name: "Soylent Workspace", description: "Suspended tenant (mock).", status: "SUSPENDED", created_at: "2026-01-05T00:00:00Z" },
  { id: "tenant-hooli", display_name: "Hooli Workspace", description: "Archived tenant (mock).", status: "ARCHIVED", created_at: "2026-01-06T00:00:00Z" },
];

// 6 memberships (actor_id, tenant_id, role, status). dev-user has 5; dev-user-2
// is a member of tenant-initech ONLY.
const MEMBERSHIP_SEED: TenantMembership[] = [
  { actor_id: "dev-user", tenant_id: "tenant-acme", role: "PROJECT_ADMIN", status: "ACTIVE" },
  { actor_id: "dev-user", tenant_id: "tenant-globex", role: "VIEWER", status: "ACTIVE" },
  { actor_id: "dev-user", tenant_id: "tenant-umbrella", role: "REVIEWER", status: "SUSPENDED" },
  { actor_id: "dev-user", tenant_id: "tenant-soylent", role: "DATA_MANAGER", status: "ACTIVE" },
  { actor_id: "dev-user", tenant_id: "tenant-hooli", role: "VIEWER", status: "ACTIVE" },
  { actor_id: "dev-user-2", tenant_id: "tenant-initech", role: "PROJECT_ADMIN", status: "ACTIVE" },
];

// 7 projects owned by tenants (self-contained; independent of MVP1 seed state).
const PROJECT_SEED: { tenant_id: string; project: ProjectSummaryRef }[] = [
  { tenant_id: "tenant-acme", project: { id: "proj-acme-kg", name: "Acme Knowledge Graph", description: "Owned by tenant-acme (mock).", status: "ACTIVE", created_at: "2026-02-01T00:00:00Z", updated_at: "2026-03-01T00:00:00Z", source_count: 4, ontology_version_count: 2 } },
  { tenant_id: "tenant-acme", project: { id: "proj-acme-catalog", name: "Acme Product Catalog", description: null, status: "DRAFT", created_at: "2026-02-02T00:00:00Z", updated_at: "2026-02-20T00:00:00Z", source_count: 1, ontology_version_count: 0 } },
  { tenant_id: "tenant-globex", project: { id: "proj-globex-ops", name: "Globex Operations", description: "Owned by tenant-globex (mock).", status: "ACTIVE", created_at: "2026-02-03T00:00:00Z", updated_at: "2026-02-25T00:00:00Z", source_count: 2, ontology_version_count: 1 } },
  { tenant_id: "tenant-initech", project: { id: "proj-initech-secret", name: "Initech Secret Project", description: "Owned by tenant-initech; NEVER visible to dev-user (mock).", status: "ACTIVE", created_at: "2026-02-04T00:00:00Z", updated_at: "2026-02-26T00:00:00Z", source_count: 3, ontology_version_count: 1 } },
  { tenant_id: "tenant-umbrella", project: { id: "proj-umbrella-01", name: "Umbrella Project 01", description: null, status: "ACTIVE", created_at: "2026-02-05T00:00:00Z", updated_at: "2026-02-27T00:00:00Z", source_count: 1, ontology_version_count: 0 } },
  { tenant_id: "tenant-soylent", project: { id: "proj-soylent-01", name: "Soylent Project 01", description: null, status: "ACTIVE", created_at: "2026-02-06T00:00:00Z", updated_at: "2026-02-28T00:00:00Z", source_count: 1, ontology_version_count: 0 } },
  { tenant_id: "tenant-hooli", project: { id: "proj-hooli-01", name: "Hooli Project 01", description: null, status: "ARCHIVED", created_at: "2026-02-07T00:00:00Z", updated_at: "2026-03-02T00:00:00Z", source_count: 0, ontology_version_count: 0 } },
];

const TENANTS: Record<string, TenantFixture> = Object.fromEntries(TENANT_SEED.map((t) => [t.id, t]));
const MEMBERSHIPS: Record<string, TenantMembership> = Object.fromEntries(
  MEMBERSHIP_SEED.map((m) => [`${m.actor_id}|${m.tenant_id}`, m]),
);
const PROJECT_OWNER: Record<string, string> = Object.fromEntries(
  PROJECT_SEED.map((p) => [p.project.id, p.tenant_id]),
);

function projectsForTenant(tenantId: string): ProjectSummaryRef[] {
  return PROJECT_SEED.filter((p) => p.tenant_id === tenantId).map((p) => ({ ...p.project }));
}

export type TenantOutcome = "VISIBLE" | "SUSPENDED" | "NOT_FOUND";

export interface TenantDecision {
  outcome: TenantOutcome;
  reason: TenantAccessDenialReason | null;
  membership: TenantMembership | null;
}

/**
 * The ONE isolation function (mirrors service._decide). A tenant is VISIBLE iff
 * the actor has an ACTIVE membership on an ACTIVE tenant; otherwise default-deny.
 * Unknown tenant OR not-a-member -> 404 (existence never leaked).
 */
export function decideTenantAccess(actorId: string, tenantId: string): TenantDecision {
  const tenant = TENANTS[tenantId];
  const membership = MEMBERSHIPS[`${actorId}|${tenantId}`] ?? null;

  if (!tenant || !membership) {
    return { outcome: "NOT_FOUND", reason: "NOT_A_MEMBER", membership: null };
  }
  if (tenant.status === "ARCHIVED") {
    return { outcome: "NOT_FOUND", reason: "TENANT_ARCHIVED", membership };
  }
  if (membership.status === "SUSPENDED") {
    return { outcome: "SUSPENDED", reason: "MEMBERSHIP_SUSPENDED", membership };
  }
  if (tenant.status === "SUSPENDED") {
    return { outcome: "SUSPENDED", reason: "TENANT_SUSPENDED", membership };
  }
  return { outcome: "VISIBLE", reason: null, membership };
}

function buildSummary(tenant: TenantFixture, membership: TenantMembership): TenantSummary {
  return {
    id: tenant.id,
    display_name: tenant.display_name,
    description: tenant.description,
    status: tenant.status,
    my_membership: membership,
    project_count: projectsForTenant(tenant.id).length,
    created_at: tenant.created_at,
  };
}

/** Visibility set (my tenants) = tenants for which a direct GET would return 200. */
export function buildMyTenants(actorId: string): TenantSummary[] {
  const items: TenantSummary[] = [];
  for (const tenant of TENANT_SEED) {
    const decision = decideTenantAccess(actorId, tenant.id);
    if (decision.outcome === "VISIBLE" && decision.membership) {
      items.push(buildSummary(tenant, decision.membership));
    }
  }
  return items;
}

/** Returns the visible summary, or null decision info for the caller to raise. */
export function resolveTenantSummary(
  actorId: string,
  tenantId: string,
): { summary: TenantSummary | null; decision: TenantDecision } {
  const decision = decideTenantAccess(actorId, tenantId);
  if (decision.outcome === "VISIBLE" && decision.membership) {
    return { summary: buildSummary(TENANTS[tenantId], decision.membership), decision };
  }
  return { summary: null, decision };
}

export function tenantProjects(tenantId: string): ProjectSummaryRef[] {
  return projectsForTenant(tenantId);
}

/** Owning tenant id of a project via the fixture mapping, or null if unknown. */
export function projectOwningTenant(projectId: string): string | null {
  return PROJECT_OWNER[projectId] ?? null;
}
