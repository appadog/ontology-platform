import { Link } from "react-router-dom";
import styled from "styled-components";
import { HanaBadge } from "../shared/ui/hana";
import { AuditEventRef, ProjectAdminSummary } from "../shared/api/types";
import { CompactTable } from "./mvp3Shared";

export const MVP5_DEFAULT_PROJECT_ID = "project-corp-knowledge";
export const MVP5_DEFAULT_ORGANIZATION_ID = import.meta.env.VITE_MVP5_ORGANIZATION_ID ?? "org-ontology-demo";

export function AdminScopeContext({ project }: { project?: ProjectAdminSummary }) {
  return (
    <ScopeContext data-testid="mvp5-admin-scope-context">
      <div>
        <span>Organization</span>
        <strong>Ontology Demo Organization</strong>
        <small>{MVP5_DEFAULT_ORGANIZATION_ID} - local - DEV_AUTH</small>
      </div>
      <div>
        <span>Project</span>
        <strong>{project?.project_name ?? "Select a project"}</strong>
        <small>
          {project?.project_id ?? "No project selected"} - ontology {project?.selected_ontology_version_id ?? "-"} - published{" "}
          {project?.current_published_graph_version_id ?? "-"}
        </small>
      </div>
      <HanaBadge tone="warning">Sensitive admin context</HanaBadge>
    </ScopeContext>
  );
}

export function ProjectAdminTabs({ projectId }: { projectId: string }) {
  const tabs = [
    ["Overview", `/projects/${projectId}/admin`],
    ["Roles", `/projects/${projectId}/admin/roles`],
    ["Credentials", `/projects/${projectId}/admin/credentials`],
    ["Approval policy", `/projects/${projectId}/admin/policies/approval`],
    ["Import/export", `/projects/${projectId}/admin/import-export`],
    ["Operations", `/projects/${projectId}/admin/operations`],
    ["Retention and backup", `/projects/${projectId}/admin/retention-backup`],
  ] as const;

  return (
    <TabBar aria-label="Project admin sections">
      {tabs.map(([label, to]) => (
        <Link key={to} to={to}>
          {label}
        </Link>
      ))}
    </TabBar>
  );
}

export function PermissionDeniedState() {
  return (
    <StateNotice data-testid="mvp5-permission-denied-state">
      <strong>Permission denied example</strong>
      <span>Reason SENSITIVITY_RESTRICTED - required permission REVOKE_CREDENTIAL - audit/support link available.</span>
    </StateNotice>
  );
}

export function ReadOnlyState() {
  return (
    <StateNotice data-testid="mvp5-read-only-state">
      <strong>Read-only example</strong>
      <span>Mutating controls are disabled because the actor has ANALYST_VIEWER scope only.</span>
    </StateNotice>
  );
}

export function AuditLink({ refs }: { refs?: AuditEventRef[] }) {
  const ref = refs?.[0];

  return (
    <AuditAnchor data-testid="mvp5-audit-link" to={ref?.href ?? "/admin"}>
      Audit {ref?.audit_event_id ?? "preview"}
    </AuditAnchor>
  );
}

export const AdminGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 1120px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 740px) {
    grid-template-columns: 1fr;
  }
`;

export const AdminTwoColumn = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

export const AdminPanel = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surface};

  h2,
  h3,
  p {
    margin: 0;
  }

  p,
  span,
  small {
    color: ${({ theme }) => theme.color.textMuted};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
    overflow-wrap: anywhere;
  }
`;

// Wave 61 (PM6-040 follow-up): AdminTable now composes the shared
// CompactTable (mvp3Shared) so all 7 admin-console tables inherit its row
// hover highlight, tinted+semibold header, radius, and sticky/align opt-ins.
// The bordered container + cell overflow-wrap are AdminTable's own genuine
// customizations (distinct from CompactTable's other ~15 consumers) and are
// preserved here rather than dropped.
export const AdminTable = styled(CompactTable)`
  border: 1px solid ${({ theme }) => theme.color.border};

  table {
    background: ${({ theme }) => theme.color.surface};
  }

  th,
  td {
    overflow-wrap: anywhere;
  }
`;

export const InlineBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;

export const LinkGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};

  a {
    padding: ${({ theme }) => theme.spacing.md};
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.color.surfaceRaised};
    font-weight: 800;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ScopeContext = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    font-weight: 800;
  }

  strong,
  small {
    overflow-wrap: anywhere;
  }

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const TabBar = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};

  a {
    min-height: 36px;
    padding: 8px 12px;
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.color.surface};
    color: ${({ theme }) => theme.color.text};
    font-weight: 800;
  }
`;

const StateNotice = styled.div`
  display: grid;
  gap: 4px;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceMuted};
`;

const AuditAnchor = styled(Link)`
  color: ${({ theme }) => theme.color.primary};
  font-weight: 800;
`;
