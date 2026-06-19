import styled from "styled-components";
import { useParams } from "react-router-dom";
import { useCurrentPublishedGraph, useProject } from "../shared/api/queries";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaCard } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { formatDateTime } from "../shared/lib/format";
import { CardBody, KeyValue, Mvp3ActionLink, Mvp3Workflow, Muted, ScreenGrid, Stack, toPublishedGraphView } from "./mvp3Shared";

export function PublishedGraphExplorerPage() {
  const { projectId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const graphQuery = useCurrentPublishedGraph(projectId);

  if (projectQuery.isLoading || graphQuery.isLoading) {
    return <PageState kind="loading" title="Published graph를 불러오는 중" description="Current snapshot의 published facts를 조회하고 있습니다." />;
  }

  if (projectQuery.isError || graphQuery.isError || !projectQuery.data || !graphQuery.data) {
    return (
      <PageState
        kind="error"
        title="Published graph를 불러오지 못했습니다"
        description="Publish queue에서 최근 job 상태를 확인한 뒤 다시 조회하세요."
        actionLabel="다시 시도"
        onAction={() => {
          void projectQuery.refetch();
          void graphQuery.refetch();
        }}
      />
    );
  }

  const graph = graphQuery.data;
  const graphView = toPublishedGraphView(graph);
  const firstEntity = graph.entities[0];
  const firstRelation = graph.relations[0];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Publish queue", to: `/projects/${projectId}/publish` },
          { label: "Published graph" },
        ]}
      />
      <PageHeader title="Published Graph" description={`Current snapshot v${graph.version.version} · published facts only`}>
        <HanaBadge tone="success">PUBLISHED FACTS</HanaBadge>
        <Mvp3ActionLink to={`/projects/${projectId}/quality`}>Quality dashboard</Mvp3ActionLink>
      </PageHeader>
      <Mvp3Workflow current="Published graph" action={<Mvp3ActionLink to={`/projects/${projectId}/publish`}>Publish queue</Mvp3ActionLink>} />
      {graph.entities.length === 0 && graph.relations.length === 0 ? (
        <PageState kind="empty" title="No published snapshot facts" description="Run a publish job before exploring the published graph." />
      ) : (
        <ScreenGrid>
          <Stack>
            <HanaCard title="Current snapshot" description="Pending, rejected, discussion, and unpublished candidates are not rendered here.">
              <PublishedCanvas>
                {graphView.entities.map((entity) => (
                  <PublishedNode key={entity.id}>
                    <strong>{entity.label}</strong>
                    <span>{entity.classLabel}</span>
                  </PublishedNode>
                ))}
                {graphView.relations.map((relation) => (
                  <PublishedEdge key={relation.id}>
                    <span>{relation.sourceLabel}</span>
                    <strong>{relation.label}</strong>
                    <span>{relation.targetLabel}</span>
                  </PublishedEdge>
                ))}
              </PublishedCanvas>
            </HanaCard>
            <HanaCard title="Published entities and relations">
              <CardBody>
                <FactList>
                  {graphView.entities.map((entity) => (
                    <li key={entity.id}>
                      <strong>{entity.label}</strong>
                      <span>{entity.classLabel}</span>
                      <span>Candidate {entity.sourceCandidateIds.join(", ")}</span>
                    </li>
                  ))}
                  {graphView.relations.map((relation) => (
                    <li key={relation.id}>
                      <strong>
                        {relation.sourceLabel} - {relation.label} - {relation.targetLabel}
                      </strong>
                      <span>Relation</span>
                      <span>Candidate {relation.sourceCandidateIds.join(", ")}</span>
                    </li>
                  ))}
                </FactList>
              </CardBody>
            </HanaCard>
          </Stack>
          <Stack>
            <HanaCard title="Version metadata">
              <CardBody>
                <KeyValue>
                  <dt>Version</dt>
                  <dd>v{graph.version.version}</dd>
                  <dt>Publish job</dt>
                  <dd>{graph.version.publish_job_id}</dd>
                  <dt>Ontology version</dt>
                  <dd>{graph.version.ontology_version_id}</dd>
                  <dt>Current pointer</dt>
                  <dd>{graph.version.is_current ? "Current" : "Historical"}</dd>
                  <dt>Published</dt>
                  <dd>{formatDateTime(graph.version.created_at)}</dd>
                </KeyValue>
              </CardBody>
            </HanaCard>
            <HanaCard title="Lineage detail">
              <CardBody>
                {firstRelation || firstEntity ? (
                  <KeyValue>
                    <dt>Candidate</dt>
                    <dd>{(firstRelation ?? firstEntity).lineage.candidate_id}</dd>
                    <dt>Decision</dt>
                    <dd>{(firstRelation ?? firstEntity).lineage.review_decision_type}</dd>
                    <dt>Reviewer</dt>
                    <dd>{(firstRelation ?? firstEntity).lineage.reviewer_display_name}</dd>
                    <dt>Reason</dt>
                    <dd>{(firstRelation ?? firstEntity).lineage.reason ?? "No reason stored"}</dd>
                    <dt>Evidence</dt>
                    <dd>{(firstRelation ?? firstEntity).lineage.evidence_refs.map((ref) => ref.locator).join(", ")}</dd>
                  </KeyValue>
                ) : (
                  <Muted>No lineage row selected.</Muted>
                )}
              </CardBody>
            </HanaCard>
          </Stack>
        </ScreenGrid>
      )}
    </>
  );
}

const PublishedCanvas = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background:
    linear-gradient(90deg, ${({ theme }) => theme.color.surfaceMuted} 1px, transparent 1px),
    linear-gradient(${({ theme }) => theme.color.surfaceMuted} 1px, transparent 1px);
  background-size: 28px 28px;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

const PublishedNode = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-height: 96px;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 2px solid ${({ theme }) => theme.color.positive};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  span {
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const PublishedEdge = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-height: 96px;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surface};
  text-align: center;

  strong {
    color: ${({ theme }) => theme.color.primary};
  }
`;

const FactList = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    gap: ${({ theme }) => theme.spacing.xs};
    padding: ${({ theme }) => theme.spacing.md};
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.sm};
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
  }
`;
