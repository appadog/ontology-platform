import { describe, expect, it } from "vitest";
import { apiClient, TenantAccessError } from "./client";
import {
  TENANCY_DEFAULT_ACTOR_ID,
  TENANCY_SECOND_ACTOR_ID,
} from "../mocks/mvp6TenancyFixtures";
import type { TenantMutationGuard } from "./types";

// MVP6.10 Multi-tenant mock contract. READ-ONLY tenant context + STRICT ISOLATION.
// Field/enum shapes match docs/api/openapi-mvp6-10-draft.json and the frozen
// PM6-034 fixture matrix. Every 200 carries an ALL-FALSE 8-flag guard; a denied
// read throws a TenantAccessError (404 TENANT_NOT_FOUND — existence never leaked /
// 403 TENANT_ACCESS_SUSPENDED) driven by denial_reason. Nothing is ever mutated.

const GUARD_KEYS = [
  "tenant_created",
  "tenant_updated",
  "tenant_deleted",
  "membership_mutated",
  "project_rehomed",
  "cross_tenant_access_granted",
  "candidate_graph_mutated",
  "published_graph_mutated",
] as const;

function expectGuardAllFalse(guard: TenantMutationGuard) {
  expect(Object.keys(guard)).toHaveLength(8);
  for (const key of GUARD_KEYS) {
    expect(guard[key]).toBe(false);
  }
}

describe("MVP6.10 Multi-tenant mock contract", () => {
  it("lists ONLY the default actor's ACTIVE visibility set {acme, globex}", async () => {
    const res = await apiClient.getMyTenants(TENANCY_DEFAULT_ACTOR_ID);
    expect(res.actor_id).toBe(TENANCY_DEFAULT_ACTOR_ID);
    expect(res.total_count).toBe(2);
    const ids = res.items.map((t) => t.id);
    expect(ids).toEqual(["tenant-acme", "tenant-globex"]);
    // NEVER any non-visible tenant (not-a-member/suspended/archived).
    for (const hidden of ["tenant-initech", "tenant-umbrella", "tenant-soylent", "tenant-hooli"]) {
      expect(ids).not.toContain(hidden);
    }
    expectGuardAllFalse(res.mutation_guard);
    // Each item carries the caller's own membership + tenant status inline.
    const acme = res.items[0];
    expect(acme.status).toBe("ACTIVE");
    expect(acme.my_membership.role).toBe("PROJECT_ADMIN");
    expect(acme.my_membership.status).toBe("ACTIVE");
    expect(acme.project_count).toBe(2);
  });

  it("gives dev-user-2 a DISJOINT visibility set {initech} — proves no-leak", async () => {
    const res = await apiClient.getMyTenants(TENANCY_SECOND_ACTOR_ID);
    expect(res.total_count).toBe(1);
    expect(res.items.map((t) => t.id)).toEqual(["tenant-initech"]);
  });

  it("an unknown actor sees an EMPTY visibility set (no fabrication)", async () => {
    const res = await apiClient.getMyTenants("nobody-xyz");
    expect(res.total_count).toBe(0);
    expect(res.items).toHaveLength(0);
    expectGuardAllFalse(res.mutation_guard);
  });

  it("returns a visible tenant summary with all-false guard", async () => {
    const res = await apiClient.getTenantSummary("tenant-globex", TENANCY_DEFAULT_ACTOR_ID);
    expect(res.tenant.id).toBe("tenant-globex");
    expect(res.tenant.status).toBe("ACTIVE");
    expect(res.tenant.my_membership.role).toBe("VIEWER");
    expect(res.tenant.project_count).toBe(1);
    expectGuardAllFalse(res.mutation_guard);
  });

  it("404 TENANT_NOT_FOUND (NOT_A_MEMBER) for a tenant the actor is not in — existence not leaked", async () => {
    await expect(
      apiClient.getTenantSummary("tenant-initech", TENANCY_DEFAULT_ACTOR_ID),
    ).rejects.toMatchObject({ code: "TENANT_NOT_FOUND", status: 404, denialReason: "NOT_A_MEMBER" });
  });

  it("404 TENANT_NOT_FOUND (TENANT_ARCHIVED) for an archived tenant", async () => {
    await expect(
      apiClient.getTenantSummary("tenant-hooli", TENANCY_DEFAULT_ACTOR_ID),
    ).rejects.toMatchObject({ code: "TENANT_NOT_FOUND", status: 404, denialReason: "TENANT_ARCHIVED" });
  });

  it("403 TENANT_ACCESS_SUSPENDED (MEMBERSHIP_SUSPENDED) for a suspended membership", async () => {
    await expect(
      apiClient.getTenantSummary("tenant-umbrella", TENANCY_DEFAULT_ACTOR_ID),
    ).rejects.toMatchObject({
      code: "TENANT_ACCESS_SUSPENDED",
      status: 403,
      denialReason: "MEMBERSHIP_SUSPENDED",
    });
  });

  it("403 TENANT_ACCESS_SUSPENDED (TENANT_SUSPENDED) for a suspended tenant", async () => {
    await expect(
      apiClient.getTenantSummary("tenant-soylent", TENANCY_DEFAULT_ACTOR_ID),
    ).rejects.toMatchObject({
      code: "TENANT_ACCESS_SUSPENDED",
      status: 403,
      denialReason: "TENANT_SUSPENDED",
    });
  });

  it("404 TENANT_NOT_FOUND for a fully unknown tenant id", async () => {
    await expect(
      apiClient.getTenantSummary("tenant-does-not-exist", TENANCY_DEFAULT_ACTOR_ID),
    ).rejects.toBeInstanceOf(TenantAccessError);
  });

  it("returns ONLY the tenant's own projects (no cross-tenant leak)", async () => {
    const res = await apiClient.getTenantProjects("tenant-acme", TENANCY_DEFAULT_ACTOR_ID);
    expect(res.tenant_id).toBe("tenant-acme");
    expect(res.total_count).toBe(2);
    expect(res.items.map((p) => p.id).sort()).toEqual(["proj-acme-catalog", "proj-acme-kg"]);
    // NEVER another tenant's project.
    for (const foreign of ["proj-globex-ops", "proj-initech-secret"]) {
      expect(res.items.map((p) => p.id)).not.toContain(foreign);
    }
    expectGuardAllFalse(res.mutation_guard);
  });

  it("denies tenant projects for a non-visible tenant (404)", async () => {
    await expect(
      apiClient.getTenantProjects("tenant-initech", TENANCY_DEFAULT_ACTOR_ID),
    ).rejects.toMatchObject({ code: "TENANT_NOT_FOUND", status: 404 });
  });

  it("resolves a project -> tenant for a visible owning tenant", async () => {
    const res = await apiClient.getProjectTenant("proj-globex-ops", TENANCY_DEFAULT_ACTOR_ID);
    expect(res.project_id).toBe("proj-globex-ops");
    expect(res.tenant.id).toBe("tenant-globex");
    expectGuardAllFalse(res.mutation_guard);
  });

  it("404 PROJECT_NOT_FOUND (no leak) for a project in a non-member tenant", async () => {
    await expect(
      apiClient.getProjectTenant("proj-initech-secret", TENANCY_DEFAULT_ACTOR_ID),
    ).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND", status: 404 });
  });

  it("403 TENANT_ACCESS_SUSPENDED for a project whose owning tenant relationship is suspended", async () => {
    await expect(
      apiClient.getProjectTenant("proj-umbrella-01", TENANCY_DEFAULT_ACTOR_ID),
    ).rejects.toMatchObject({ code: "TENANT_ACCESS_SUSPENDED", status: 403 });
  });

  it("404 PROJECT_NOT_FOUND for an unknown project id", async () => {
    await expect(
      apiClient.getProjectTenant("proj-nope", TENANCY_DEFAULT_ACTOR_ID),
    ).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND", status: 404 });
  });
});
