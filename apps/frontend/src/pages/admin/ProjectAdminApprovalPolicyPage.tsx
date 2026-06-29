import {
  AdminPanel,
  AdminScopeContext,
  AdminTable,
  AdminTwoColumn,
  AuditLink,
  Breadcrumbs,
  HanaBadge,
  InlineBadges,
  MVP5_DEFAULT_PROJECT_ID,
  PageHeader,
  PageState,
  ProjectAdminTabs,
  useAutomaticApprovalDiff,
  useAutomaticApprovalEnforcePreview,
  useAutomaticApprovalEvaluation,
  useAutomaticApprovalPolicy,
  useAdminProjectSummary,
  useParams,
} from "./shared";

export function ProjectAdminApprovalPolicyPage() {
  const { projectId = MVP5_DEFAULT_PROJECT_ID } = useParams();
  const projectQuery = useAdminProjectSummary(projectId);
  const policyQuery = useAutomaticApprovalPolicy(projectId);
  const policyId = policyQuery.data?.policy_id ?? "";
  const evaluationQuery = useAutomaticApprovalEvaluation(policyId);
  const diffQuery = useAutomaticApprovalDiff(policyId);
  const enforceQuery = useAutomaticApprovalEnforcePreview(policyId);

  if (projectQuery.isLoading || policyQuery.isLoading || evaluationQuery.isLoading || diffQuery.isLoading || enforceQuery.isLoading) {
    return <PageState kind="loading" title="Approval policy is loading" description="Policy, diff, dry-run, and enforce preview are loading." />;
  }

  if (projectQuery.isError || policyQuery.isError || evaluationQuery.isError || diffQuery.isError || enforceQuery.isError || !projectQuery.data || !policyQuery.data || !evaluationQuery.data || !diffQuery.data || !enforceQuery.data) {
    return <PageState kind="error" title="Approval policy could not load" description="Retry policy dry-run loading from project admin." />;
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: projectQuery.data.project_name, to: `/projects/${projectId}/admin` }, { label: "Approval policy" }]} />
      <PageHeader title="자동 승인 정책" description="Dry-run is separate from enforce preview and cannot bypass review or publish gates.">
        <HanaBadge tone="warning">{policyQuery.data.mode}</HanaBadge>
      </PageHeader>
      <AdminScopeContext project={projectQuery.data} />
      <ProjectAdminTabs projectId={projectId} />
      <AdminTwoColumn>
        <AdminPanel data-testid="mvp5-policy-draft-editor">
          <h2>Draft policy editor</h2>
          <p>Confidence threshold {policyQuery.data.conditions.confidence_threshold} with evidence and validation gates enabled.</p>
          <InlineBadges>
            <HanaBadge tone="neutral">draft dirty</HanaBadge>
            <HanaBadge tone="warning">Dry-run required</HanaBadge>
          </InlineBadges>
        </AdminPanel>
        <AdminPanel data-testid="mvp5-policy-diff">
          <h2>Policy diff</h2>
          <p>{diffQuery.data.mode_change}</p>
          {diffQuery.data.condition_changes.map((change) => (
            <span key={change}>{change}</span>
          ))}
        </AdminPanel>
      </AdminTwoColumn>
      <AdminPanel data-testid="mvp5-policy-dry-run-marker">
        <h2>Dry-run result</h2>
        <p>
          Would approve {evaluationQuery.data.summary.would_approve_count}, blocked {evaluationQuery.data.summary.blocked_count}, manual review{" "}
          {evaluationQuery.data.summary.manual_review_count}
        </p>
        <AdminTable data-testid="mvp5-policy-blocked-rows">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Status</th>
                <th>Reasons</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              {evaluationQuery.data.rows.map((row) => (
                <tr key={row.row_id}>
                  <td>{row.candidate_label}</td>
                  <td>{row.status}</td>
                  <td>{row.block_reasons.join(", ") || "none"}</td>
                  <td>{row.version_state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTable>
      </AdminPanel>
      <AdminPanel data-testid="mvp5-policy-enforce-marker">
        <h2>Enforce preview gate</h2>
        <p>Gate status {enforceQuery.data.gate_status}. Confirmation required: {String(enforceQuery.data.requires_confirmation)}.</p>
        <p>Blocked reasons: {enforceQuery.data.gate_reasons.join(", ")}</p>
        <AuditLink refs={enforceQuery.data.audit_preview?.audit_event_ref ? [enforceQuery.data.audit_preview.audit_event_ref] : []} />
      </AdminPanel>
    </>
  );
}
