import {
  AdminGrid,
  AdminPanel,
  AdminScopeContext,
  AdminTwoColumn,
  Breadcrumbs,
  HanaBadge,
  HanaCard,
  Link,
  LinkGrid,
  PageHeader,
  PageState,
  PermissionDeniedState,
  ReadOnlyState,
  useAdminOrganizationSummary,
  useAdminProjectSummaries,
  MVP5_DEFAULT_ORGANIZATION_ID,
} from "./shared";

export function AdminConsolePage() {
  const organizationQuery = useAdminOrganizationSummary(MVP5_DEFAULT_ORGANIZATION_ID);
  const projectsQuery = useAdminProjectSummaries();

  if (organizationQuery.isLoading || projectsQuery.isLoading) {
    return <PageState kind="loading" title="Admin console is loading" description="Organization governance and project context are being prepared." />;
  }

  if (organizationQuery.isError || projectsQuery.isError || !organizationQuery.data) {
    return <PageState kind="error" title="Admin console could not load" description="Keep the admin context selected and retry." />;
  }

  const project = projectsQuery.data?.[0];

  return (
    <div data-testid="mvp5-admin-shell">
      <Breadcrumbs items={[{ label: "Admin" }]} />
      <PageHeader
        title="Admin Console"
        description={`${organizationQuery.data.organization_name} - ${organizationQuery.data.environment ?? "local"} - ${organizationQuery.data.auth_mode}`}
      >
        <HanaBadge tone="warning">Dry-run first governance</HanaBadge>
        <HanaBadge tone="neutral">No production SSO</HanaBadge>
      </PageHeader>
      <AdminScopeContext project={project} />
      <AdminGrid>
        <HanaCard title="Projects" description="Open project admin without adding project detail routes to global navigation.">
          <AdminPanel>
            <strong>{organizationQuery.data.project_count ?? projectsQuery.data?.length ?? 0} governed projects</strong>
            <Link to="/admin/projects">Open project admin index</Link>
          </AdminPanel>
        </HanaCard>
        <HanaCard title="Credentials" description="Masked metadata only; one-time values are never persisted in admin lists.">
          <AdminPanel>
            <strong>{organizationQuery.data.service_account_count ?? 0} service accounts</strong>
            <span>Credential create uses one-time reveal UI; future detail uses masked display.</span>
          </AdminPanel>
        </HanaCard>
        <HanaCard title="Operations" description="Jobs, DLQ, cost, observability, retention, backup, and audit stay operator-visible.">
          <AdminPanel>
            <strong>{String(organizationQuery.data.operations_summary?.dlq_count ?? 0)} DLQ rows</strong>
            <span>Cost status {String(organizationQuery.data.operations_summary?.cost_status ?? "unknown")}</span>
          </AdminPanel>
        </HanaCard>
      </AdminGrid>
      <AdminTwoColumn>
        <AdminPanel>
          <h2>Contextual project admin entry points</h2>
          <LinkGrid>
            {(projectsQuery.data ?? []).map((item) => (
              <Link key={item.project_id} to={`/projects/${item.project_id}/admin`}>
                {item.project_name}
                <br />
                <small>{item.project_id}</small>
              </Link>
            ))}
          </LinkGrid>
        </AdminPanel>
        <AdminPanel>
          <h2>Safety states</h2>
          <PermissionDeniedState />
          <ReadOnlyState />
        </AdminPanel>
      </AdminTwoColumn>
    </div>
  );
}
