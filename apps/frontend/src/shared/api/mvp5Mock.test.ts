import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { apiClient } from "./client";
import { MVP5_PROJECT_ID, mvp5SecretSafetyText } from "../mocks/mvp5Fixtures";

const frontendRoot = resolve(__dirname, "../../..");

describe("MVP5 mock admin contract", () => {
  it("renders the selected admin context and safety-critical admin fixtures", async () => {
    const org = await apiClient.getAdminOrganizationSummary("org-ontology-demo");
    const project = await apiClient.getAdminProjectSummary(MVP5_PROJECT_ID);
    const roles = await apiClient.listAdminRoleAssignments(MVP5_PROJECT_ID);
    const permission = await apiClient.checkAdminPermission({
      principal_id: "user-analyst-viewer",
      principal_type: "HUMAN_USER",
      organization_id: org.organization_id,
      project_id: MVP5_PROJECT_ID,
      resource_type: "API_CREDENTIAL",
      action: "REVOKE_CREDENTIAL",
      data_state: "masked secret",
      sensitivity: "secret",
    });
    const policy = await apiClient.getAutomaticApprovalPolicy(MVP5_PROJECT_ID);
    const evaluation = await apiClient.evaluateAutomaticApprovalPolicy(policy.policy_id);
    const operations = await apiClient.getOperationsDashboard(MVP5_PROJECT_ID);
    const retention = await apiClient.getRetentionPolicy(MVP5_PROJECT_ID);
    const deletion = await apiClient.runRetentionDeletionDryRun(MVP5_PROJECT_ID);
    const restore = await apiClient.runBackupRestoreDryRun("backup-wave24-eligible");
    const exports = await apiClient.listOntologyExports(MVP5_PROJECT_ID);
    const exportDownload = await apiClient.getOntologyExportDownload(exports[0].job_id);
    const importDryRun = await apiClient.createOntologyImportDryRun(MVP5_PROJECT_ID);

    expect(org.auth_mode).toBe("DEV_AUTH");
    expect(project.project_id).toBe(MVP5_PROJECT_ID);
    expect(roles.map((assignment) => assignment.role)).toContain("PROJECT_ADMIN");
    expect(permission.decision).toBe("DENY");
    expect(permission.deny_reasons).toContain("SENSITIVITY_RESTRICTED");
    expect(evaluation.rows.map((row) => row.status)).toEqual(
      expect.arrayContaining(["WOULD_APPROVE", "BLOCKED", "REQUIRES_MANUAL_REVIEW"]),
    );
    expect(operations.job_health.dlq_count).toBeGreaterThan(0);
    expect(retention.legal_hold_enabled).toBe(true);
    expect(deletion.requires_confirmation).toBe(true);
    expect(restore.eligible).toBe(true);
    expect(exports[0].package_metadata?.schema_version).toBe("ontology-package.v1");
    expect(exportDownload.package_metadata.counts.class_count).toBeGreaterThan(0);
    expect(importDryRun.dry_run_only).toBe(true);
    expect(importDryRun.mutation_applied).toBe(false);
    expect(importDryRun.compatibility_status).toBe("DESTRUCTIVE_BLOCKED");
    expect(importDryRun.summary.no_op_count).toBeGreaterThan(0);
    expect(importDryRun.conflicts.some((row) => row.blocking)).toBe(true);
    expect(importDryRun.warnings.length).toBeGreaterThan(0);
    expect(importDryRun.destructive_impact_rows.length).toBeGreaterThan(0);
    expect(importDryRun.rollback_guidance.join(" ")).toContain("Dry-run");
  });

  it("keeps raw credential material out of persistent mocks and scripts", async () => {
    const credentials = await apiClient.listAdminCredentials(MVP5_PROJECT_ID);
    const created = await apiClient.createAdminServiceAccount(MVP5_PROJECT_ID);
    const revoked = await apiClient.revokeAdminCredential(credentials[0].credential_id, "wave24 mock revoke confirmation");
    const persistentText = mvp5SecretSafetyText({
      credentials,
      createdCredential: created.credential,
      revoked,
    });

    expect(created.raw_secret).toEqual(expect.any(String));
    expect(created.raw_secret.length).toBeGreaterThan(0);
    expect(persistentText).not.toContain(created.raw_secret);
    expect(persistentText).not.toMatch(/raw_secret/);
    expect(credentials.every((credential) => credential.masked_secret.includes("..."))).toBe(true);
    expect(revoked.status).toBe("REVOKED");

    const packageJson = JSON.parse(readFileSync(resolve(frontendRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    const mockSmoke = readFileSync(resolve(frontendRoot, "scripts/mvp5-mock-route-smoke.mjs"), "utf8");
    const actualSmoke = readFileSync(resolve(frontendRoot, "scripts/mvp5-actual-api-smoke.mjs"), "utf8");

    expect(packageJson.scripts["smoke:mvp5:mock"]).toBe("node scripts/mvp5-mock-route-smoke.mjs");
    expect(packageJson.scripts["smoke:mvp5:actual"]).toBe("node scripts/mvp5-actual-api-smoke.mjs");
    expect(mockSmoke).toContain("mvp5-admin-shell");
    expect(mockSmoke).toContain("mvp5-import-export-panel");
    expect(mockSmoke).toContain("mvp5-import-dry-run-result");
    expect(actualSmoke).toContain("raw_secret");
    expect(actualSmoke).toContain("hasRawSecret");
    expect(actualSmoke).not.toContain("console.log(created");
  });
});
