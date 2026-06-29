import { AdminScopeContext, AdminTable, Breadcrumbs, Link, PageHeader, PageState, useAdminProjectSummaries } from "./shared";

export function AdminProjectsPage() {
  const projectsQuery = useAdminProjectSummaries();

  if (projectsQuery.isLoading) {
    return <PageState kind="loading" title="Project admin index is loading" description="Project governance summaries are loading." />;
  }

  if (projectsQuery.isError || !projectsQuery.data) {
    return <PageState kind="error" title="Project admin index could not load" description="Retry project summary loading from the admin console." />;
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Projects" }]} />
      <PageHeader title="프로젝트 관리자 인덱스" description="Select a project before entering project-scoped admin routes." />
      <AdminScopeContext project={projectsQuery.data[0]} />
      <AdminTable>
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Versions</th>
              <th>Governance</th>
              <th>Entry</th>
            </tr>
          </thead>
          <tbody>
            {projectsQuery.data.map((project) => (
              <tr key={project.project_id}>
                <td>
                  <strong>{project.project_name}</strong>
                  <br />
                  <small>{project.project_id}</small>
                </td>
                <td>
                  {project.selected_ontology_version_id}
                  <br />
                  {project.current_published_graph_version_id}
                </td>
                <td>
                  roles {project.role_assignment_count ?? 0} / credentials {project.credential_count ?? 0}
                </td>
                <td>
                  <Link to={`/projects/${project.project_id}/admin`}>Open project admin</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
    </>
  );
}
