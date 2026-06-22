import {
  AdminGrid,
  AdminPanel,
  AdminScopeContext,
  AdminTable,
  AdminTwoColumn,
  AuditLink,
  Breadcrumbs,
  HanaBadge,
  HanaButton,
  HanaCard,
  InlineBadges,
  MVP5_DEFAULT_PROJECT_ID,
  PageHeader,
  PageState,
  PermissionDeniedState,
  ProjectAdminTabs,
  ReadOnlyState,
  useOntologyExports,
  useOntologyImportDryRun,
  useAdminProjectSummary,
  useParams,
} from "./shared";

export function ProjectAdminImportExportPage() {
  const { projectId = MVP5_DEFAULT_PROJECT_ID } = useParams();
  const projectQuery = useAdminProjectSummary(projectId);
  const exportsQuery = useOntologyExports(projectId);
  const readyExport = exportsQuery.data?.find((job) => job.status === "SUCCEEDED" && job.package_metadata) ?? exportsQuery.data?.[0];
  const importQuery = useOntologyImportDryRun(projectId);

  if (projectQuery.isLoading || exportsQuery.isLoading || importQuery.isLoading) {
    return <PageState kind="loading" title="Import/export is loading" description="Export metadata and import dry-run preview are loading." />;
  }

  if (projectQuery.isError || exportsQuery.isError || importQuery.isError || !projectQuery.data || !exportsQuery.data || !importQuery.data) {
    return <PageState kind="error" title="Import/export could not load" description="Retry JSON package metadata and dry-run preview from project admin." />;
  }

  const project = projectQuery.data;
  const exportJobs = exportsQuery.data;
  const exportMetadata = readyExport?.package_metadata ?? null;
  const importDryRun = importQuery.data;
  const importMetadata = importDryRun.package_metadata;
  const hasExportJobs = exportJobs.length > 0;
  const expiredJob = exportJobs.find((job) => job.status === "EXPIRED");
  const runningJob = exportJobs.find((job) => job.status === "RUNNING" || job.status === "QUEUED");
  const failedJob = exportJobs.find((job) => job.status === "FAILED");

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: project.project_name, to: `/projects/${projectId}/admin` }, { label: "Import/export" }]} />
      <PageHeader title="Ontology Import/export" description="JSON export and import dry-run preview. Import apply is not available in Wave26.">
        <HanaBadge tone="warning">Dry-run only</HanaBadge>
        <HanaBadge tone="neutral">JSON P0</HanaBadge>
      </PageHeader>
      <AdminScopeContext project={project} />
      <ProjectAdminTabs projectId={projectId} />

      <AdminPanel data-testid="mvp5-import-export-panel">
        <h2>Export package readiness</h2>
        <InlineBadges>
          <HanaBadge tone={readyExport?.status === "SUCCEEDED" ? "success" : "warning"}>{readyExport?.status ?? "EMPTY"}</HanaBadge>
          {runningJob ? <HanaBadge tone="warning">export running</HanaBadge> : null}
          {expiredJob ? <HanaBadge tone="danger">export expired</HanaBadge> : null}
          {failedJob ? <HanaBadge tone="danger">export error</HanaBadge> : null}
          {!hasExportJobs ? <HanaBadge tone="neutral">export empty</HanaBadge> : null}
        </InlineBadges>
        {exportMetadata ? (
          <AdminGrid>
            <HanaCard title="Package metadata" description="Safe package preview excludes credentials and raw secret material.">
              <AdminPanel data-testid="mvp5-export-ready-state">
                <strong>{exportMetadata.package_id}</strong>
                <span>schema_version {exportMetadata.schema_version}</span>
                <span>project {exportMetadata.project_id}</span>
                <span>ontology {exportMetadata.ontology_version_id}</span>
                <span>generated {exportMetadata.generated_at}</span>
              </AdminPanel>
            </HanaCard>
            <HanaCard title="Counts" description="Class, property, and relation counts for the package.">
              <AdminPanel>
                <strong>
                  {exportMetadata.counts.class_count} classes / {exportMetadata.counts.property_count} properties / {exportMetadata.counts.relation_count} relations
                </strong>
                <span>format {exportMetadata.format}</span>
                <span>checksum {readyExport?.checksum ?? exportMetadata.checksum ?? "not provided"}</span>
              </AdminPanel>
            </HanaCard>
            <HanaCard title="Download metadata" description="Download remains metadata-only in the preview.">
              <AdminPanel>
                <span>file {readyExport?.file_name ?? "package summary only"}</span>
                <span>expires {readyExport?.expires_at ?? "not provided"}</span>
                <AuditLink refs={readyExport?.audit_event_ref ? [readyExport.audit_event_ref] : exportMetadata.audit_event_ref ? [exportMetadata.audit_event_ref] : []} />
              </AdminPanel>
            </HanaCard>
          </AdminGrid>
        ) : (
          <PageState kind="empty" title="No export package yet" description="A JSON package export has not been generated for this project." />
        )}
        <AdminPanel data-testid="mvp5-package-no-secret-preview">
          <h2>Package preview safety</h2>
          <p>No credential material, authorization header, raw secret, or token material is included in package metadata, filenames, audit text, or preview rows.</p>
        </AdminPanel>
      </AdminPanel>

      <AdminPanel data-testid="mvp5-import-dry-run-result">
        <h2>Import dry-run result</h2>
        <InlineBadges>
          <HanaBadge tone={importDryRun.compatibility_status === "COMPATIBLE" ? "success" : "danger"}>{importDryRun.compatibility_status}</HanaBadge>
          <HanaBadge tone="warning">confirmation required {String(importDryRun.requires_confirmation)}</HanaBadge>
          <HanaBadge tone="neutral">mutation applied {String(importDryRun.mutation_applied)}</HanaBadge>
        </InlineBadges>
        {importMetadata ? (
          <AdminTwoColumn>
            <AdminPanel data-testid="mvp5-import-metadata-ready">
              <h3>Package metadata ready</h3>
              <span>{importMetadata.package_id}</span>
              <span>schema_version {importMetadata.schema_version}</span>
              <span>source project {importMetadata.project_id}</span>
              <span>source ontology {importMetadata.ontology_version_id}</span>
              <span>
                counts {importMetadata.counts.class_count}/{importMetadata.counts.property_count}/{importMetadata.counts.relation_count}
              </span>
            </AdminPanel>
            <AdminPanel>
              <h3>Dry-run summary</h3>
              <span>create {importDryRun.summary.create_count}</span>
              <span>update {importDryRun.summary.update_count}</span>
              <span>delete {importDryRun.summary.delete_count}</span>
              <span>no-op {importDryRun.summary.no_op_count}</span>
              <span>conflicts {importDryRun.summary.conflict_count}</span>
              <span>warnings {importDryRun.summary.warning_count}</span>
            </AdminPanel>
          </AdminTwoColumn>
        ) : (
          <PageState kind="empty" title="No import package selected" description="Paste or upload a JSON package before dry-run in a future interactive flow." />
        )}

        <AdminTwoColumn>
          <AdminPanel data-testid="mvp5-import-conflict-rows">
            <h3>Conflicts and invalid rows</h3>
            <AdminTable>
              <table>
                <thead>
                  <tr>
                    <th>Path</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {importDryRun.conflicts.map((row) => (
                    <tr key={row.row_id}>
                      <td>{row.path}</td>
                      <td>{row.conflict_type}</td>
                      <td>{row.severity}</td>
                      <td>{row.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTable>
          </AdminPanel>
          <AdminPanel data-testid="mvp5-import-warning-rows">
            <h3>Warnings</h3>
            {importDryRun.warnings.map((row) => (
              <span key={row.row_id}>
                {row.path}: {row.message}
              </span>
            ))}
          </AdminPanel>
        </AdminTwoColumn>

        <AdminTwoColumn>
          <AdminPanel data-testid="mvp5-import-destructive-impact">
            <h3>Destructive impact</h3>
            <p>
              Would delete {importDryRun.destructive_impact.would_delete_classes} classes, {importDryRun.destructive_impact.would_delete_properties} properties,{" "}
              {importDryRun.destructive_impact.would_delete_relations} relations; published refs affected{" "}
              {importDryRun.destructive_impact.published_graph_refs_affected}.
            </p>
            {importDryRun.destructive_impact_rows.map((row) => (
              <span key={row.row_id}>
                {row.resource_type} {row.resource_id ?? "-"}: {row.impact}
              </span>
            ))}
          </AdminPanel>
          <AdminPanel data-testid="mvp5-import-rollback-guidance">
            <h3>Rollback guidance</h3>
            {importDryRun.rollback_guidance.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </AdminPanel>
        </AdminTwoColumn>

        <AdminPanel data-testid="mvp5-import-confirmation-required">
          <h3>Confirmation required</h3>
          <p>{importDryRun.confirmation_text ?? "Confirmation is required for any future apply workflow."}</p>
          <HanaButton type="button" disabled title="Wave26 is dry-run only; import apply is intentionally unavailable.">
            Import apply disabled
          </HanaButton>
          <AuditLink refs={importDryRun.audit_preview?.audit_event_ref ? [importDryRun.audit_preview.audit_event_ref] : importDryRun.audit_event_ref ? [importDryRun.audit_event_ref] : []} />
        </AdminPanel>
      </AdminPanel>

      <AdminTwoColumn>
        <AdminPanel data-testid="mvp5-import-invalid-state">
          <h2>Invalid/incompatible package state</h2>
          <p>Unsupported schema versions are blocked before any apply path. Current dry-run status: {importDryRun.compatibility_status}.</p>
        </AdminPanel>
        <AdminPanel>
          <h2>Permission and read-only examples</h2>
          <PermissionDeniedState />
          <ReadOnlyState />
        </AdminPanel>
      </AdminTwoColumn>
    </>
  );
}
