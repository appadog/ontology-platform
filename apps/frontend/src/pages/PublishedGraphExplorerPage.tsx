import { useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { GitBranch, SlidersHorizontal } from "lucide-react";
import { useProject, usePublishedGraphExplore } from "../shared/api/queries";
import { GraphExploreState } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { PageContainer } from "../shared/layout/PageContainer";
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

// F2: user-facing Korean labels for the state-simulation toggle. The underlying
// GraphExploreState value is unchanged (kept in component state); only the button
// text is glossed so no raw enum is shown to non-developer users.
const exploreStateLabels: Record<GraphExploreState, string> = {
  READY: "준비됨",
  SAFE_TOO_LARGE: "안전 한도 초과",
  EMPTY: "데이터 없음",
  ERROR: "오류",
};

export function PublishedGraphExplorerPage() {
  const { projectId = "" } = useParams();
  const [view, setView] = useState<PublishedGraphView>("explorer");
  const projectQuery = useProject(projectId);

  if (projectQuery.isLoading) {
    return <PageState kind="loading" title="게시 그래프를 불러오는 중" description="탐색기 필터와 게시된 사실을 준비하고 있습니다." />;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <PageState
        kind="error"
        title="게시 그래프를 불러오지 못했습니다"
        description="선택한 프로젝트로 다시 시도하세요."
        actionLabel="다시 시도"
        onAction={() => void projectQuery.refetch()}
      />
    );
  }

  return (
    // Wave 59 (PM6-039) §4/P4 showcase: the published graph is a "graph/code"
    // surface — per the design doc, these get the `full` content width
    // (no max-width cap) rather than the default 1200px list/table width.
    <PageContainer width="full">
      <Breadcrumbs
        items={[
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "게시 그래프" },
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
          <HanaBadge tone="success">PUBLISHED ONLY · 게시 전용</HanaBadge>
          <HanaBadge tone="success">PUBLISHED FACTS · 게시된 사실</HanaBadge>
          <Mvp3ActionLink to={`/projects/${projectId}/quality`}>품질 대시보드</Mvp3ActionLink>
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
    </PageContainer>
  );
}

function ExplorerView({ projectId }: { projectId: string }) {
  const [state, setState] = useState<GraphExploreState>("READY");
  const [maxHops, setMaxHops] = useState(2);
  const graphQuery = usePublishedGraphExplore(projectId, { state, max_hops: maxHops });

  if (graphQuery.isLoading) {
    return <PageState kind="loading" title="게시 그래프를 불러오는 중" description="탐색기 필터와 게시된 사실을 준비하고 있습니다." />;
  }

  if (graphQuery.isError || !graphQuery.data) {
    return (
      <PageState
        kind="error"
        title="게시 그래프를 불러오지 못했습니다"
        description="필터를 초기화하거나 선택한 프로젝트 그래프로 다시 시도하세요."
        actionLabel="다시 시도"
        onAction={() => void graphQuery.refetch()}
      />
    );
  }

  const graph = graphQuery.data;

  return (
    <>
      <ExplorerStatusRow>
        <StateBadge state={graph.state} />
        <Muted as="span">{versionLabel(graph.published_graph_version_ref)} · 게시된 사실만</Muted>
      </ExplorerStatusRow>

      <Mvp3Workflow current="Published graph" />

      <HanaCard title="탐색기 컨트롤" description="기본값은 2홉이며, 지원되는 최대 탐색 깊이는 3홉입니다.">
        <Toolbar>
          <SlidersHorizontal aria-hidden="true" size={18} />
          <MarkerText>게시된 사실만 표시합니다. 그래프가 안전 한도를 초과하면 부분 그래프를 위험하게 그리지 않고 요약만 처리합니다.</MarkerText>
          {(["READY", "SAFE_TOO_LARGE", "EMPTY", "ERROR"] as GraphExploreState[]).map((nextState) => (
            <HanaButton key={nextState} type="button" variant={state === nextState ? "primary" : "secondary"} onClick={() => setState(nextState)}>
              {exploreStateLabels[nextState]}
            </HanaButton>
          ))}
          {[1, 2, 3, 4].map((hop) => (
            <HanaButton key={hop} type="button" variant={maxHops === hop ? "primary" : "secondary"} disabled={hop > 3} onClick={() => setMaxHops(hop)}>
              {hop}홉
            </HanaButton>
          ))}
        </Toolbar>
      </HanaCard>

      {graph.state === "SAFE_TOO_LARGE" ? (
        <HanaCard title="안전 한도 초과" description="탐색기는 안전하지 않은 부분 그래프를 그리지 않습니다.">
          <CardBody>
            <KeyValue>
              <dt>예상 노드 수</dt>
              <dd>{graph.too_large?.estimated_nodes}</dd>
              <dt>예상 엣지 수</dt>
              <dd>{graph.too_large?.estimated_edges}</dd>
              <dt>노드 예산</dt>
              <dd>{graph.too_large?.node_budget}</dd>
              <dt>엣지 예산</dt>
              <dd>{graph.too_large?.edge_budget}</dd>
            </KeyValue>
            <Muted>{graph.too_large?.message}</Muted>
            <InlineList>
              {(graph.too_large?.suggested_filters ?? []).map((filter) => (
                <Mvp4Panel key={filter}>
                  <strong>{filter}</strong>
                  <span>그래프를 그리기 전에 이 필터를 적용하세요.</span>
                </Mvp4Panel>
              ))}
            </InlineList>
          </CardBody>
        </HanaCard>
      ) : graph.state === "EMPTY" ? (
        <PageState kind="empty" title="이 필터에 해당하는 그래프 사실이 없습니다" description="다른 루트 엔티티, 버전 또는 필터 조합을 선택하세요." />
      ) : graph.state === "ERROR" ? (
        <PageState kind="error" title="그래프 탐색기 상태가 오류를 반환했습니다" description="필터를 초기화한 뒤 다시 시도하세요." actionLabel="준비됨으로 보기" onAction={() => setState("READY")} />
      ) : (
        <Mvp4TwoColumn>
          <Stack>
            <HanaCard title="현재 스냅샷" description="선택한 게시 그래프 버전의 게시된 엔티티와 관계를 표시합니다.">
              <GraphCanvas>
                {graph.nodes.map((node) => (
                  <GraphNode key={node.id}>
                    <strong>{node.label}</strong>
                    <span>{node.class_id} · {node.hop}홉</span>
                    <small>출처 {node.source_count ?? 0} · 근거 {node.evidence_count ?? 0}건</small>
                  </GraphNode>
                ))}
                {graph.edges.map((edge) => (
                  <GraphEdge key={edge.id}>
                    <GitBranch aria-hidden="true" size={18} />
                    <strong>{edge.label}</strong>
                    <span>{edge.source_node_id} → {edge.target_node_id}</span>
                    <small>근거 {edge.evidence_count ?? 0}건</small>
                  </GraphEdge>
                ))}
              </GraphCanvas>
            </HanaCard>
            <HanaCard title="오버레이">
              <CardBody>
                <Muted>품질 오버레이 {graph.quality_overlays?.length ?? 0}개 · 출처/근거 오버레이 {graph.source_overlays?.length ?? 0}개</Muted>
              </CardBody>
            </HanaCard>
          </Stack>
          <Stack>
            <HanaCard title="계보 패널">
              <CardBody>
                {graph.lineage_panel ? (
                  <KeyValue>
                    <dt>사실</dt>
                    <dd>{graph.lineage_panel.fact_ref.label}</dd>
                    <dt>버전</dt>
                    <dd>{versionLabel(graph.lineage_panel.published_graph_version_ref)}</dd>
                    <dt>게시 작업</dt>
                    <dd>{graph.lineage_panel.publish_job_id ?? "정보 없음"}</dd>
                    <dt>검수 결정</dt>
                    <dd>{graph.lineage_panel.review_decision_ref?.review_decision_type ?? "정보 없음"}</dd>
                    <dt>후보 맥락</dt>
                    <dd>{graph.lineage_panel.candidate_ref?.candidate_id ?? "정보 없음"} · 출처 정보로만 사용</dd>
                    <dt>근거</dt>
                    <dd>{graph.lineage_panel.evidence_refs.map((ref) => ref.locator).join(", ")}</dd>
                    <dt>온톨로지</dt>
                    <dd>{graph.lineage_panel.ontology_version_id ?? "정보 없음"}</dd>
                    <dt>모델 실행</dt>
                    <dd>{graph.lineage_panel.model_run_id ?? "정보 없음"}</dd>
                    <dt>프롬프트</dt>
                    <dd>{graph.lineage_panel.prompt_version_id ?? "정보 없음"}</dd>
                  </KeyValue>
                ) : (
                  <Muted>계보 정보가 있는 사실을 선택하세요.</Muted>
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
