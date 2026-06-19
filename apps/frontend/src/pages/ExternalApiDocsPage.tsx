import { useParams } from "react-router-dom";
import styled from "styled-components";
import { Code2, LockKeyhole } from "lucide-react";
import { useExternalApiDocs, useProject } from "../shared/api/queries";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaCard } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { CardBody, CompactTable, Mvp3ActionLink, Muted } from "./mvp3Shared";
import { Mvp4Panel, PageActions, StateBadge, versionLabel } from "./mvp4Shared";

export function ExternalApiDocsPage() {
  const { projectId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const docsQuery = useExternalApiDocs(projectId);

  if (projectQuery.isLoading || docsQuery.isLoading) {
    return <PageState kind="loading" title="External API docs are loading" description="Read-only catalog and examples are being prepared." />;
  }

  if (projectQuery.isError || docsQuery.isError || !projectQuery.data || !docsQuery.data) {
    return <PageState kind="error" title="External API docs could not load" description="Retry from the selected project context." />;
  }

  const docs = docsQuery.data;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "External API" },
        ]}
      />
      <PageHeader title="External Read-only API" description={`${projectQuery.data.name} · ${versionLabel(docs.published_graph_version_ref)}`}>
        <PageActions>
          <StateBadge state={docs.auth_mode} />
          <HanaBadge tone="success">READ ONLY</HanaBadge>
          <Mvp3ActionLink to={`/projects/${projectId}/rag`}>RAG workspace</Mvp3ActionLink>
        </PageActions>
      </PageHeader>

      <DocsGrid>
        <HanaCard title="Development auth" description="MVP4 exposes local read-only access only.">
          <CardBody>
            <Mvp4Panel>
              <DocTitle>
                <LockKeyhole aria-hidden="true" size={18} />
                <strong>{docs.auth_mode}</strong>
              </DocTitle>
              <span>DEV_AUTH read-only access is the only supported external auth mode in MVP4.</span>
              <span>No writes, production keys, service accounts, or quotas are part of this slice.</span>
            </Mvp4Panel>
            {docs.dev_auth_missing ? (
              <Mvp4Panel>
                <strong>Development auth missing</strong>
                <span>Configure the local development header once Backend publishes the final auth failure shape.</span>
              </Mvp4Panel>
            ) : null}
          </CardBody>
        </HanaCard>
        <HanaCard title="Non-goals">
          <CardBody>
            <Muted>External consumers read published graph, source, evidence, search, and grounded answer surfaces only.</Muted>
            <Muted>Candidate graph facts are not exposed as approved facts.</Muted>
          </CardBody>
        </HanaCard>
      </DocsGrid>

      {!docs.published_graph_version_ref ? (
        <PageState kind="empty" title="No published graph snapshot" description="The docs remain visible, but graph examples need a current published version." />
      ) : null}

      <HanaCard title="Endpoint catalog" description="Examples preserve project, version, and evidence context.">
        <CompactTable>
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Method</th>
                <th>Path</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              {docs.endpoints.map((endpoint) => (
                <tr key={`${endpoint.method}-${endpoint.path}`}>
                  <td>{endpoint.group}</td>
                  <td>
                    <StateWithIcon>
                      <Code2 aria-hidden="true" size={16} />
                      {endpoint.method}
                    </StateWithIcon>
                  </td>
                  <td>
                    <code>{endpoint.path}</code>
                  </td>
                  <td>
                    <ExampleText>{JSON.stringify(endpoint.request_example ?? endpoint.response_example, null, 2)}</ExampleText>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CompactTable>
      </HanaCard>
    </>
  );
}

const DocsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const DocTitle = styled.span`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;

const StateWithIcon = styled.span`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;

const ExampleText = styled.pre`
  max-width: 420px;
  max-height: 220px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;
