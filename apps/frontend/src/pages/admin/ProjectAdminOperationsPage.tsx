import {
  AdminGrid,
  AdminPanel,
  AdminScopeContext,
  AdminTable,
  AuditLink,
  Breadcrumbs,
  HanaCard,
  MVP5_DEFAULT_PROJECT_ID,
  PageHeader,
  PageState,
  ProjectAdminTabs,
  useOperationsDashboard,
  useAdminProjectSummary,
  useParams,
} from "./shared";

export function ProjectAdminOperationsPage() {
  const { projectId = MVP5_DEFAULT_PROJECT_ID } = useParams();
  const projectQuery = useAdminProjectSummary(projectId);
  const operationsQuery = useOperationsDashboard(projectId);

  if (projectQuery.isLoading || operationsQuery.isLoading) {
    return <PageState kind="loading" title="Operations dashboard is loading" description="Jobs, DLQ, cost, and observability are loading." />;
  }

  if (projectQuery.isError || operationsQuery.isError || !projectQuery.data || !operationsQuery.data) {
    return <PageState kind="error" title="Operations dashboard could not load" description="Retry operations loading from project admin." />;
  }

  const operations = operationsQuery.data;

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: projectQuery.data.project_name, to: `/projects/${projectId}/admin` }, { label: "Operations" }]} />
      <PageHeader title="Operations Dashboard" description="Job health, retry boundaries, DLQ, cost budget, structured events, and observability states." />
      <AdminScopeContext project={projectQuery.data} />
      <ProjectAdminTabs projectId={projectId} />
      <AdminGrid data-testid="mvp5-operations-dashboard">
        <HanaCard title="Job health" description="Failed and retrying jobs remain visible.">
          <AdminPanel>
            <strong>{operations.job_health.failed_count ?? 0} failed</strong>
            <span>{operations.job_health.retrying_count ?? 0} retrying / {operations.job_health.dlq_count ?? 0} DLQ</span>
          </AdminPanel>
        </HanaCard>
        <HanaCard title="Cost budget" description="Near-limit is an operator state, not zero usage.">
          <AdminPanel>
            <strong>{operations.cost_budget.budget_status}</strong>
            <span>{operations.cost_budget.estimated_spend ?? 0} / {operations.cost_budget.budget_amount ?? 0} {operations.cost_budget.currency}</span>
          </AdminPanel>
        </HanaCard>
        <HanaCard title="Observability" description="Partial availability is explicit.">
          <AdminPanel>
            <span>Metrics {operations.observability.metrics}</span>
            <span>Traces {operations.observability.traces}</span>
            <span>Logs {operations.observability.logs}</span>
          </AdminPanel>
        </HanaCard>
      </AdminGrid>
      <AdminPanel data-testid="mvp5-dlq-action-boundary">
        <h2>DLQ action boundary</h2>
        <AdminTable>
          <table>
            <thead>
              <tr>
                <th>DLQ row</th>
                <th>Job</th>
                <th>Eligibility</th>
                <th>Reason</th>
                <th>Audit</th>
              </tr>
            </thead>
            <tbody>
              {(operations.dlq_rows ?? []).map((row) => (
                <tr key={row.dlq_id}>
                  <td>{row.dlq_id}</td>
                  <td>{row.job_type}</td>
                  <td>
                    retry {String(row.retry_eligible)} / ack {String(row.acknowledge_eligible)}
                  </td>
                  <td>{row.blocked_reasons?.join(", ") || row.failure_code}</td>
                  <td>
                    <AuditLink refs={row.audit_event_refs} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTable>
      </AdminPanel>
      <AdminPanel data-testid="mvp5-structured-event-detail">
        <h2>Structured event detail</h2>
        {(operations.recent_events ?? []).map((event) => (
          <p key={event.event_id}>
            {event.event_type} - {event.severity} - request {event.request_id} - redacted {event.redacted_fields?.join(", ") || "none"}
          </p>
        ))}
      </AdminPanel>
    </>
  );
}
