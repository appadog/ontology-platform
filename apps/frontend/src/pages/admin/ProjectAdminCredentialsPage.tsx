import {
  AdminPanel,
  AdminScopeContext,
  AdminTable,
  AuditLink,
  Breadcrumbs,
  HanaBadge,
  HanaButton,
  InlineBadges,
  MVP5_DEFAULT_PROJECT_ID,
  PageHeader,
  PageState,
  ProjectAdminTabs,
  useAdminCredentials,
  useAdminProjectSummary,
  useParams,
} from "./shared";

export function ProjectAdminCredentialsPage() {
  const { projectId = MVP5_DEFAULT_PROJECT_ID } = useParams();
  const projectQuery = useAdminProjectSummary(projectId);
  const credentialsQuery = useAdminCredentials(projectId);

  if (projectQuery.isLoading || credentialsQuery.isLoading) {
    return <PageState kind="loading" title="Credentials are loading" description="Masked credential metadata is loading." />;
  }

  if (projectQuery.isError || credentialsQuery.isError || !projectQuery.data || !credentialsQuery.data) {
    return <PageState kind="error" title="Credentials could not load" description="Retry credential metadata loading." />;
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: projectQuery.data.project_name, to: `/projects/${projectId}/admin` }, { label: "Credentials" }]} />
      <PageHeader title="API 키 및 서비스 계정" description="One-time reveal is isolated from persistent masked credential views.">
        <HanaBadge tone="warning">no credential material persisted</HanaBadge>
      </PageHeader>
      <AdminScopeContext project={projectQuery.data} />
      <ProjectAdminTabs projectId={projectId} />
      <AdminPanel data-testid="mvp5-secret-one-time-reveal">
        <h2>One-time secret reveal placeholder</h2>
        <p>The create response may include a one-time field, but this UI does not persist, log, or reprint the value. Close or refresh leaves masked metadata only.</p>
        <HanaButton type="button" disabled title="Placeholder only for mock-first safety proof">
          Copy once after create
        </HanaButton>
      </AdminPanel>
      <AdminPanel data-testid="mvp5-credential-table">
        <h2>Masked credential list</h2>
        <AdminTable>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Kind</th>
                <th>Status</th>
                <th>Masked value</th>
                <th>Quota</th>
                <th>Audit</th>
              </tr>
            </thead>
            <tbody>
              {credentialsQuery.data.map((credential) => (
                <tr key={credential.credential_id}>
                  <td>{credential.name}</td>
                  <td>{credential.credential_kind}</td>
                  <td>{credential.status}</td>
                  <td data-testid="mvp5-secret-masked-display">{credential.masked_secret}</td>
                  <td>{credential.quota?.status ?? "UNAVAILABLE"}</td>
                  <td>
                    <AuditLink refs={credential.audit_event_refs} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTable>
      </AdminPanel>
      <AdminPanel data-testid="mvp5-credential-revoke-confirm">
        <h2>Revoke confirmation</h2>
        <p>Revoke requires credential name, scope, reason, impact acknowledgement, and audit preview before mutation.</p>
        <InlineBadges>
          <HanaBadge tone="danger">confirmation required</HanaBadge>
          <HanaBadge tone="neutral">masked detail only</HanaBadge>
        </InlineBadges>
      </AdminPanel>
    </>
  );
}
