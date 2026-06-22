import {
  AdminGrid,
  AdminPanel,
  AdminScopeContext,
  AdminTwoColumn,
  AuditLink,
  Breadcrumbs,
  HanaBadge,
  HanaCard,
  Link,
  LinkGrid,
  MVP5_DEFAULT_PROJECT_ID,
  PageHeader,
  PageState,
  PermissionDeniedState,
  ProjectAdminTabs,
  ReadOnlyState,
  useAdminProjectSummary,
  useParams,
} from "./shared";

export function ProjectAdminPage() {
  const { projectId = MVP5_DEFAULT_PROJECT_ID } = useParams();
  const projectQuery = useAdminProjectSummary(projectId);

  if (projectQuery.isLoading) {
    return <PageState kind="loading" title="Project admin is loading" description="Project governance summary is loading." />;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return <PageState kind="error" title="Project admin could not load" description="Return to the admin project index and select a valid project." />;
  }

  const project = projectQuery.data;

  return (
    <div data-testid="mvp5-admin-shell">
      <Breadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Projects", to: "/admin/projects" }, { label: project.project_name }]} />
      <PageHeader title="Project Admin" description="Project-scoped governance, credentials, policy, operations, retention, backup, and audit controls.">
        <HanaBadge tone={project.permission_summary?.read_only ? "warning" : "success"}>{project.permission_summary?.read_only ? "read-only" : "ADMIN_READY"}</HanaBadge>
      </PageHeader>
      <AdminScopeContext project={project} />
      <ProjectAdminTabs projectId={projectId} />
      <AdminGrid>
        <HanaCard title="Roles" description="Assignments and permission checks stay explicit.">
          <AdminPanel>
            <strong>{project.role_assignment_count ?? 0} assignments</strong>
            <Link to={`/projects/${projectId}/admin/roles`}>Manage roles</Link>
          </AdminPanel>
        </HanaCard>
        <HanaCard title="Credentials" description="Masked list/detail with revoke confirmation.">
          <AdminPanel>
            <strong>{project.credential_count ?? 0} credentials</strong>
            <Link to={`/projects/${projectId}/admin/credentials`}>Open credentials</Link>
          </AdminPanel>
        </HanaCard>
        <HanaCard title="Automation" description="Dry-run and enforce-preview are separate gates.">
          <AdminPanel>
            <strong>{project.automatic_approval_policy_ref ?? "No active policy"}</strong>
            <Link to={`/projects/${projectId}/admin/policies/approval`}>Review policy</Link>
          </AdminPanel>
        </HanaCard>
        <HanaCard title="Import/export" description="JSON package export and dry-run-only import preview.">
          <AdminPanel>
            <strong>JSON package flow</strong>
            <Link to={`/projects/${projectId}/admin/import-export`}>Open import/export</Link>
          </AdminPanel>
        </HanaCard>
      </AdminGrid>
      <AdminTwoColumn>
        <AdminPanel>
          <h2>Operations and governance</h2>
          <LinkGrid>
            <Link to={`/projects/${projectId}/admin/import-export`}>Import/export</Link>
            <Link to={`/projects/${projectId}/admin/operations`}>Operations dashboard</Link>
            <Link to={`/projects/${projectId}/admin/retention-backup`}>Retention and backup</Link>
          </LinkGrid>
        </AdminPanel>
        <AdminPanel>
          <h2>Safety gates</h2>
          <PermissionDeniedState />
          <ReadOnlyState />
          <AuditLink refs={project.latest_audit_events} />
        </AdminPanel>
      </AdminTwoColumn>
    </div>
  );
}
