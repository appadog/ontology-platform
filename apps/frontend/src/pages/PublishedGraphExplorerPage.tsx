import { useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { GitBranch, SlidersHorizontal } from "lucide-react";
import { useProject, usePublishedGraphExplore } from "../shared/api/queries";
import { GraphExploreState } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { CardBody, KeyValue, Mvp3ActionLink, Muted, Mvp3Workflow, Stack } from "./mvp3Shared";
import { InlineList, Mvp4Panel, Mvp4TwoColumn, PageActions, StateBadge, Toolbar, versionLabel } from "./mvp4Shared";
import { GraphVizSummaryView } from "./GraphVizSummaryView";

// The Published Graph surface hosts TWO in-screen sub-views on the ONE LNB
// destination (`published-graph`): the existing MVP4 Explorer (root+hops) and the
// MVP6.12 Advanced Visualization "시각화 · 요약" (whole-graph + summary). The toggle
// is in-page state (no new route, no path change) so the single active-LNB invariant
// is preserved and `resolveActiveSection` (matched on `/published-graph`) is untouched.
type PublishedGraphView = "explorer" | "viz";

export function PublishedGraphExplorerPage() {
  const { projectId = "" } = useParams();
  const [view, setView] = useState<PublishedGraphView>("explorer");
  const projectQuery = useProject(projectId);

  if (projectQuery.isLoading) {
    return <PageState kind="loading" title="Published graph is loading" description="Explorer filters and published facts are being prepared." />;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <PageState
        kind="error"
        title="Published graph could not load"
        description="Retry the selected project."
        actionLabel="Retry"
        onAction={() => void projectQuery.refetch()}
      />
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Published Graph" },
        ]}
      />
      <PageHeader
        title="게시 그래프 탐색기"
        description={
          view === "viz"
            ? "시각화 · 요약 — 읽기 전용 전체 그래프 뷰 + 요약 통계"
            : "탐색기 — 루트 중심 이웃 뷰 · published facts only"
        }
      >
        <PageActions>
          <HanaBadge tone="success">PUBLISHED ONLY</HanaBadge>
          <HanaBadge tone="success">PUBLISHED FACTS</HanaBadge>
          <Mvp3ActionLink to={`/projects/${projectId}/quality`}>Quality dashboard</Mvp3ActionLink>
        </PageActions>
      </PageHeader>

      <ViewToggle role="tablist" aria-label="Published Graph 하위 뷰">
        <ToggleButton
          type="button"
          role="tab"
          aria-selected={view === "explorer"}
          data-active={view === "explorer" ? "true" : "false"}
          onClick={() => setView("explorer")}
        >
          탐색기
        </ToggleButton>
        <ToggleButton
          type="button"
          role="tab"
          aria-selected={view === "viz"}
          data-active={view === "viz" ? "true" : "false"}
          onClick={() => setView("viz")}
        >
          시각화 · 요약
        </ToggleButton>
      </ViewToggle>

      {view === "viz" ? (
        <GraphVizSummaryView projectId={projectId} projectName={projectQuery.data.name} />
      ) : (
        <ExplorerView projectId={projectId} />
      )}
    </>
  );
}

function ExplorerView({ projectId }: { projectId: string }) {
  const [state, setState] = useState<GraphExploreState>("READY");
  const [maxHops, setMaxHops] = useState(2);
  const graphQuery = usePublishedGraphExplore(projectId, { state, max_hops: maxHops });

  if (graphQuery.isLoading) {
    return <PageState kind="loading" title="Published graph is loading" description="Explorer filters and published facts are being prepared." />;
  }

  if (graphQuery.isError || !graphQuery.data) {
    return (
      <PageState
        kind="error"
        title="Published graph could not load"
        description="Reset filters or retry the selected project graph."
        actionLabel="Retry"
        onAction={() => void graphQuery.refetch()}
      />
    );
  }

  const graph = graphQuery.data;

  return (
    <>
      <ExplorerStatusRow>
        <StateBadge state={graph.state} />
        <Muted as="span">{versionLabel(graph.published_graph_version_ref)} · published facts only</Muted>
      </ExplorerStatusRow>

      <Mvp3Workflow current="Published graph" />

      <HanaCard title="Explorer controls" description="Default is 2 hops. Maximum supported hop depth is 3.">
        <Toolbar>
          <SlidersHorizontal aria-hidden="true" size={18} />
          <MarkerText>Published-only graph state. SAFE TOO LARGE is handled without rendering unsafe partial graphs.</MarkerText>
          {(["READY", "SAFE_TOO_LARGE", "EMPTY", "ERROR"] as GraphExploreState[]).map((nextState) => (
            <HanaButton key={nextState} type="button" variant={state === nextState ? "primary" : "secondary"} onClick={() => setState(nextState)}>
              {nextState}
            </HanaButton>
          ))}
          {[1, 2, 3, 4].map((hop) => (
            <HanaButton key={hop} type="button" variant={maxHops === hop ? "primary" : "secondary"} disabled={hop > 3} onClick={() => setMaxHops(hop)}>
              {hop} hop
            </HanaButton>
          ))}
        </Toolbar>
      </HanaCard>

      {graph.state === "SAFE_TOO_LARGE" ? (
        <HanaCard title="Safe too large" description="The explorer does not render unsafe partial graphs.">
          <CardBody>
            <KeyValue>
              <dt>Estimated nodes</dt>
              <dd>{graph.too_large?.estimated_nodes}</dd>
              <dt>Estimated edges</dt>
              <dd>{graph.too_large?.estimated_edges}</dd>
              <dt>Node budget</dt>
              <dd>{graph.too_large?.node_budget}</dd>
              <dt>Edge budget</dt>
              <dd>{graph.too_large?.edge_budget}</dd>
            </KeyValue>
            <Muted>{graph.too_large?.message}</Muted>
            <InlineList>
              {(graph.too_large?.suggested_filters ?? []).map((filter) => (
                <Mvp4Panel key={filter}>
                  <strong>{filter}</strong>
                  <span>Apply this filter before rendering the graph.</span>
                </Mvp4Panel>
              ))}
            </InlineList>
          </CardBody>
        </HanaCard>
      ) : graph.state === "EMPTY" ? (
        <PageState kind="empty" title="No graph facts for this filter" description="Choose another root entity, version, or filter set." />
      ) : graph.state === "ERROR" ? (
        <PageState kind="error" title="Graph explorer state returned error" description="Retry after resetting filters." actionLabel="Show READY" onAction={() => setState("READY")} />
      ) : (
        <Mvp4TwoColumn>
          <Stack>
            <HanaCard title="Current snapshot" description="Published entities and relations are shown from the selected published graph version.">
              <GraphCanvas>
                {graph.nodes.map((node) => (
                  <GraphNode key={node.id}>
                    <strong>{node.label}</strong>
                    <span>{node.class_id} · hop {node.hop}</span>
                    <small>{node.source_count ?? 0} sources · {node.evidence_count ?? 0} evidence refs</small>
                  </GraphNode>
                ))}
                {graph.edges.map((edge) => (
                  <GraphEdge key={edge.id}>
                    <GitBranch aria-hidden="true" size={18} />
                    <strong>{edge.label}</strong>
                    <span>{edge.source_node_id} to {edge.target_node_id}</span>
                    <small>{edge.evidence_count ?? 0} evidence refs</small>
                  </GraphEdge>
                ))}
              </GraphCanvas>
            </HanaCard>
            <HanaCard title="Overlays">
              <CardBody>
                <Muted>{graph.quality_overlays?.length ?? 0} quality overlays · {graph.source_overlays?.length ?? 0} source/evidence overlays</Muted>
              </CardBody>
            </HanaCard>
          </Stack>
          <Stack>
            <HanaCard title="Lineage panel">
              <CardBody>
                {graph.lineage_panel ? (
                  <KeyValue>
                    <dt>Fact</dt>
                    <dd>{graph.lineage_panel.fact_ref.label}</dd>
                    <dt>Version</dt>
                    <dd>{versionLabel(graph.lineage_panel.published_graph_version_ref)}</dd>
                    <dt>Publish job</dt>
                    <dd>{graph.lineage_panel.publish_job_id ?? "Unavailable"}</dd>
                    <dt>Review decision</dt>
                    <dd>{graph.lineage_panel.review_decision_ref?.review_decision_type ?? "Unavailable"}</dd>
                    <dt>Candidate context</dt>
                    <dd>{graph.lineage_panel.candidate_ref?.candidate_id ?? "Unavailable"} as provenance only</dd>
                    <dt>Evidence</dt>
                    <dd>{graph.lineage_panel.evidence_refs.map((ref) => ref.locator).join(", ")}</dd>
                    <dt>Ontology</dt>
                    <dd>{graph.lineage_panel.ontology_version_id ?? "Unavailable"}</dd>
                    <dt>Model run</dt>
                    <dd>{graph.lineage_panel.model_run_id ?? "Unavailable"}</dd>
                    <dt>Prompt ref</dt>
                    <dd>{graph.lineage_panel.prompt_version_id ?? "Unavailable"}</dd>
                  </KeyValue>
                ) : (
                  <Muted>Select a fact with lineage available.</Muted>
                )}
              </CardBody>
            </HanaCard>
          </Stack>
        </Mvp4TwoColumn>
      )}
    </>
  );
}

const ViewToggle = styled.div`
  display: inline-flex;
  gap: 4px;
  margin: ${({ theme }) => theme.spacing.md} 0;
  padding: 4px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: 999px;
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const ToggleButton = styled.button`
  padding: 6px 16px;
  border: none;
  border-radius: 999px;
  background: none;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  cursor: pointer;

  &[data-active="true"] {
    background: ${({ theme }) => theme.color.primary};
    color: ${({ theme }) => theme.color.textOnStrong};
  }
`;

const ExplorerStatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const GraphCanvas = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background:
    linear-gradient(90deg, ${({ theme }) => theme.color.surfaceMuted} 1px, transparent 1px),
    linear-gradient(${({ theme }) => theme.color.surfaceMuted} 1px, transparent 1px);
  background-size: 28px 28px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const MarkerText = styled.span`
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const GraphNode = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-height: 112px;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 2px solid ${({ theme }) => theme.color.positive};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  span,
  small {
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const GraphEdge = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-height: 112px;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surface};
  text-align: center;

  svg {
    justify-self: center;
    color: ${({ theme }) => theme.color.primary};
  }

  span,
  small {
    color: ${({ theme }) => theme.color.textMuted};
  }
`;
