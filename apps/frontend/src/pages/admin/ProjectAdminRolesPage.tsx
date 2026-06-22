import {
  AdminPanel,
  AdminScopeContext,
  AdminTable,
  AdminTwoColumn,
  AuditLink,
  Breadcrumbs,
  HanaBadge,
  InlineBadges,
  MVP5_DEFAULT_ORGANIZATION_ID,
  MVP5_DEFAULT_PROJECT_ID,
  PageHeader,
  PageState,
  PermissionDeniedState,
  ProjectAdminTabs,
  ReadOnlyState,
  useAdminPermissionCheck,
  useAdminProjectSummary,
  useAdminRoleAssignments,
  useParams,
} from "./shared";

export function ProjectAdminRolesPage() {
  const { projectId = MVP5_DEFAULT_PROJECT_ID } = useParams();
  const projectQuery = useAdminProjectSummary(projectId);
  const rolesQuery = useAdminRoleAssignments(projectId);
  const permissionQuery = useAdminPermissionCheck({
    principal_id: "user-analyst-viewer",
    principal_type: "HUMAN_USER",
    organization_id: MVP5_DEFAULT_ORGANIZATION_ID,
    project_id: projectId,
    resource_type: "API_CREDENTIAL",
    action: "REVOKE_CREDENTIAL",
    data_state: "masked secret",
    sensitivity: "secret",
  });

  if (projectQuery.isLoading || rolesQuery.isLoading || permissionQuery.isLoading) {
    return <PageState kind="loading" title="Role assignments are loading" description="Assignments and permission preview are loading." />;
  }

  if (projectQuery.isError || rolesQuery.isError || permissionQuery.isError || !projectQuery.data || !rolesQuery.data || !permissionQuery.data) {
    return <PageState kind="error" title="Role assignments could not load" description="Retry from project admin overview." />;
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: projectQuery.data.project_name, to: `/projects/${projectId}/admin` }, { label: "Roles" }]} />
      <PageHeader title="Role and Permission Management" description="Assignments are first-class resources with previewed permission outcomes." />
      <AdminScopeContext project={projectQuery.data} />
      <ProjectAdminTabs projectId={projectId} />
      <AdminTwoColumn>
        <AdminPanel data-testid="mvp5-role-assignment-table">
          <h2>Role assignments</h2>
          <AdminTable>
            <table>
              <thead>
                <tr>
                  <th>Principal</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Scope</th>
                  <th>Audit</th>
                </tr>
              </thead>
              <tbody>
                {rolesQuery.data.map((assignment) => (
                  <tr key={assignment.assignment_id}>
                    <td>{assignment.principal_display_name ?? assignment.principal_id}</td>
                    <td>{assignment.role}</td>
                    <td>{assignment.status}</td>
                    <td>{assignment.scope_type}</td>
                    <td>
                      <AuditLink refs={assignment.audit_event_refs} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
        </AdminPanel>
        <AdminPanel data-testid="mvp5-permission-preview">
          <h2>Permission preview</h2>
          <InlineBadges>
            <HanaBadge tone={permissionQuery.data.allowed ? "success" : "danger"}>{permissionQuery.data.decision}</HanaBadge>
            {permissionQuery.data.read_only ? <HanaBadge tone="warning">read-only</HanaBadge> : null}
          </InlineBadges>
          <p>Required roles: {permissionQuery.data.required_roles.join(", ")}</p>
          <p>Matched roles: {permissionQuery.data.matched_roles.join(", ")}</p>
          <p>Denied reasons: {permissionQuery.data.deny_reasons.join(", ") || "none"}</p>
          <PermissionDeniedState />
          <ReadOnlyState />
        </AdminPanel>
      </AdminTwoColumn>
    </>
  );
}
