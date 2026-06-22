import {
  AdminPanel,
  AdminScopeContext,
  AdminTable,
  AdminTwoColumn,
  AuditLink,
  Breadcrumbs,
  HanaBadge,
  MVP5_DEFAULT_PROJECT_ID,
  PageHeader,
  PageState,
  ProjectAdminTabs,
  useBackupRestoreDryRun,
  useBackupSnapshots,
  useRetentionDeletionDryRun,
  useRetentionPolicy,
  useAdminProjectSummary,
  useParams,
} from "./shared";

export function ProjectAdminRetentionBackupPage() {
  const { projectId = MVP5_DEFAULT_PROJECT_ID } = useParams();
  const projectQuery = useAdminProjectSummary(projectId);
  const retentionQuery = useRetentionPolicy(projectId);
  const deletionQuery = useRetentionDeletionDryRun(projectId);
  const backupsQuery = useBackupSnapshots(projectId);
  const snapshotId = backupsQuery.data?.[0]?.snapshot_id ?? "";
  const restoreQuery = useBackupRestoreDryRun(snapshotId);

  if (projectQuery.isLoading || retentionQuery.isLoading || deletionQuery.isLoading || backupsQuery.isLoading || restoreQuery.isLoading) {
    return <PageState kind="loading" title="Retention and backup are loading" description="Policies, deletion dry-run, snapshots, and restore dry-run are loading." />;
  }

  if (projectQuery.isError || retentionQuery.isError || deletionQuery.isError || backupsQuery.isError || restoreQuery.isError || !projectQuery.data || !retentionQuery.data || !deletionQuery.data || !backupsQuery.data || !restoreQuery.data) {
    return <PageState kind="error" title="Retention and backup could not load" description="Retry governance dry-runs from project admin." />;
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: projectQuery.data.project_name, to: `/projects/${projectId}/admin` }, { label: "Retention and backup" }]} />
      <PageHeader title="Retention and Backup Governance" description="Deletion and restore remain dry-run-first with confirmation and audit preview." />
      <AdminScopeContext project={projectQuery.data} />
      <ProjectAdminTabs projectId={projectId} />
      <AdminPanel data-testid="mvp5-retention-policy-table">
        <h2>Retention policy</h2>
        <AdminTable>
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Days</th>
                <th>Mode</th>
                <th>Legal hold</th>
                <th>Audit</th>
              </tr>
            </thead>
            <tbody>
              {retentionQuery.data.rules.map((rule) => (
                <tr key={rule.rule_id}>
                  <td>{rule.resource_type}</td>
                  <td>{rule.retention_days}</td>
                  <td>{rule.mode}</td>
                  <td>{String(rule.legal_hold ?? false)}</td>
                  <td>
                    <AuditLink refs={rule.audit_event_refs} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTable>
      </AdminPanel>
      <AdminTwoColumn>
        <AdminPanel data-testid="mvp5-deletion-dry-run-impact">
          <h2>Deletion dry-run impact</h2>
          <p>
            Affected {deletionQuery.data.impact_summary.affected_count}, blocked {deletionQuery.data.impact_summary.blocked_count}, irreversible{" "}
            {deletionQuery.data.impact_summary.irreversible_count}
          </p>
          {deletionQuery.data.lineage_impact.map((impact) => (
            <span key={impact.resource_id}>
              {impact.resource_type} {impact.resource_id}: {impact.impact}
            </span>
          ))}
          <HanaBadge tone="danger">confirmation required</HanaBadge>
        </AdminPanel>
        <AdminPanel data-testid="mvp5-restore-dry-run-impact">
          <h2>Restore dry-run impact</h2>
          <p>Eligible {String(restoreQuery.data.eligible)} - status {restoreQuery.data.status}</p>
          <p>Impact {JSON.stringify(restoreQuery.data.restore_impact)}</p>
          <p>Blocked reasons {restoreQuery.data.block_reasons.join(", ") || "none"}</p>
        </AdminPanel>
      </AdminTwoColumn>
      <AdminPanel data-testid="mvp5-backup-snapshot-list">
        <h2>Backup snapshots</h2>
        <AdminTable>
          <table>
            <thead>
              <tr>
                <th>Snapshot</th>
                <th>Status</th>
                <th>Compatibility</th>
                <th>Audit</th>
              </tr>
            </thead>
            <tbody>
              {backupsQuery.data.map((snapshot) => (
                <tr key={snapshot.snapshot_id}>
                  <td>{snapshot.snapshot_id}</td>
                  <td>{snapshot.status}</td>
                  <td>{snapshot.restore_eligibility?.compatibility}</td>
                  <td>
                    <AuditLink refs={snapshot.audit_event_refs} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTable>
      </AdminPanel>
    </>
  );
}
