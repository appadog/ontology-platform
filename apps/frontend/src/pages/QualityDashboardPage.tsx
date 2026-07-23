import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { useProject, useQualityMetrics, useQualitySummary } from "../shared/api/queries";
import { QualityMetric, QualityMetricGroup, QualityMetricsResponse, QualitySummary } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaCard } from "../shared/ui/hana";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { PageState } from "../shared/ui/platform/PageState";
import { formatDateTime } from "../shared/lib/format";
import { CardBody, CompactTable, KeyValue, Mvp3ActionLink, Muted, Mvp3Workflow, Stack } from "./mvp3Shared";
import { Mvp4Grid, Mvp4Panel, Mvp4StatePanel, PageActions, pct, valueLabel, versionLabel } from "./mvp4Shared";

export function QualityDashboardPage() {
  const { projectId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const summaryQuery = useQualitySummary(projectId);
  const metricsQuery = useQualityMetrics(projectId);

  if (projectQuery.isLoading || summaryQuery.isLoading || metricsQuery.isLoading) {
    return (
      <PageState
        kind="loading"
        title="품질 지표를 불러오는 중"
        description="선택한 프로젝트의 지표 그룹과 계산식 메타데이터를 준비하고 있습니다."
      />
    );
  }

  if (projectQuery.isError || summaryQuery.isError || metricsQuery.isError || !projectQuery.data || !summaryQuery.data || !metricsQuery.data) {
    return (
      <PageState
        kind="error"
        title="품질 지표를 불러오지 못했습니다"
        description="프로젝트 선택을 유지한 채 지표 조회를 다시 시도하세요."
        actionLabel="다시 시도"
        onAction={() => {
          void projectQuery.refetch();
          void metricsQuery.refetch();
        }}
      />
    );
  }

  const metrics = metricsQuery.data;
  const allMetrics = metrics.metric_groups.flatMap((group) => group.metrics);
  const formulaMetric = allMetrics[0];
  const partialMetric = allMetrics.find((metric) => metric.value === null || metric.rate === null);
  const historicalMetric = allMetrics.find((metric) => metric.published_graph_version_ref?.is_current === false);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "품질" },
        ]}
      />
      <PageHeader title="품질 대시보드" description={`${versionLabel(metrics.published_graph_version_ref)} · ${formatDateTime(metrics.generated_at)}`}>
        <PageActions>
          <HanaBadge tone="success">METRIC GROUPS · 지표 그룹</HanaBadge>
          <HanaBadge tone="muted">NO COMPOSITE SCORE · 종합 점수 없음</HanaBadge>
          <Mvp3ActionLink to={`/projects/${projectId}/published-graph`}>게시 그래프</Mvp3ActionLink>
          <Mvp3ActionLink to={`/projects/${projectId}/search`}>검색</Mvp3ActionLink>
        </PageActions>
      </PageHeader>

      <Mvp3Workflow current="Quality" />

      <QualitySummaryStrip summary={summaryQuery.data} metrics={metrics} />

      <QualityContext>
        <Mvp4StatePanel title="프로젝트 맥락">
          {projectQuery.data.name}은(는) 모든 지표·드릴다운·버전 선택기에서 범위로 유지됩니다.
        </Mvp4StatePanel>
        <Mvp4StatePanel title="게시 그래프 버전 맥락">
          {historicalMetric ? `현재가 아닌 행이 ${versionLabel(historicalMetric.published_graph_version_ref)}를 통해 표시됩니다.` : versionLabel(metrics.published_graph_version_ref)}
        </Mvp4StatePanel>
        <Mvp4StatePanel title="부분 지표 상태">
          {partialMetric ? `${partialMetric.label} 지표는 값 일부가 부분적이어도 수식과 드릴다운을 계속 표시합니다.` : "모든 기준 지표가 현재 값을 포함하고 있습니다."}
        </Mvp4StatePanel>
      </QualityContext>

      {metrics.metric_groups.length === 0 ? (
        <PageState kind="empty" title="품질 지표가 없습니다" description="고급 품질 지표를 확인하려면 필터를 초기화하거나 그래프 사실을 게시하세요." />
      ) : (
        <Mvp4Grid>
          {metrics.metric_groups.map((group) => (
            <HanaCard key={group.group} title={advancedMetricGroupTitle(group.label)} description={group.description ?? "설명 가능한 지표 그룹"}>
              <MetricList>
                {group.metrics.map((metric) => (
                  <MetricItem key={metric.metric_id}>
                    <strong>{valueLabel(metric.value, metric.rate)}</strong>
                    <span>{metric.label}</span>
                    <small>{metric.trend === null || metric.trend === undefined ? "추이 정보 없음" : `추이 ${pct(metric.trend)}`}</small>
                    {metric.published_graph_version_ref?.is_current === false ? <HanaBadge tone="warning">SELECTED VERSION · 선택된 버전</HanaBadge> : null}
                    {/* D5: per-metric numerator/denominator/formula trust
                        context — the explainable evidence the product promotes.
                        Kept visible beneath the always-visible summary strip;
                        the strip is the at-a-glance layer above it. */}
                    <MetricTrustContext metric={metric} />
                    {metric.drilldown ? <DrilldownLink to={drilldownPath(projectId, metric.drilldown.target)}>{metric.drilldown.label ?? "드릴다운 열기"}</DrilldownLink> : null}
                  </MetricItem>
                ))}
              </MetricList>
            </HanaCard>
          ))}
        </Mvp4Grid>
      )}

      <FormulaGrid>
        <HanaCard title="계산식 설명" description={formulaMetric?.label ?? "지표를 선택하세요"}>
          <CardBody>{formulaMetric ? <FormulaMetadata metric={formulaMetric} /> : <Muted>선택된 계산식이 없습니다.</Muted>}</CardBody>
        </HanaCard>
        <HanaCard title="드릴다운 행" description="분석 항목은 현재 활성 버전과 프로젝트 맥락을 유지합니다.">
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>차원</th>
                  <th>라벨</th>
                  <th data-align="right">값</th>
                  <th data-align="right">비율</th>
                </tr>
              </thead>
              <tbody>
                {(formulaMetric?.breakdowns ?? []).map((row) => (
                  <tr key={`${row.dimension}-${row.label}`}>
                    <td>{row.dimension}</td>
                    <td>{row.label}</td>
                    <td data-align="right">{row.value}</td>
                    <td data-align="right">{row.rate === null || row.rate === undefined ? "확인 불가" : pct(row.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CompactTable>
        </HanaCard>
      </FormulaGrid>

      <CollapseSection>
        <summary>후보 / 검증 / 검수 / 게시 요약 (MVP3)</summary>
        <LegacyQualitySummary summary={summaryQuery.data} />
      </CollapseSection>
    </>
  );
}

// D5 §5.1: the always-visible top summary strip. Five items in order:
// 1) published-graph readiness / freshness, 2) Completeness, 3) Consistency,
// 4) Traceability (evidence coverage — the product differentiator), 5)
// Validation pass rate. Each shows the measured value or an explicit
// NOT_AVAILABLE state (no fake zero).
function QualitySummaryStrip({ summary, metrics }: { summary: QualitySummary; metrics: QualityMetricsResponse }) {
  const headlineRate = (group: QualityMetricGroup) => {
    const g = metrics.metric_groups.find((mg) => mg.group === group);
    const m = g?.metrics?.[0];
    if (!m || (m.value === null && m.rate === null)) {
      return null;
    }
    return valueLabel(m.value ?? null, m.rate ?? null);
  };

  const completeness = headlineRate("COMPLETENESS");
  const consistency = headlineRate("CONSISTENCY");
  const traceability = headlineRate("TRACEABILITY");

  const passed = summary.validation_counts.passed.value;
  const warning = summary.validation_counts.warning?.value ?? 0;
  const failed = summary.validation_counts.failed.value;

  const readinessTone = failed > 0 ? "danger" : warning > 0 ? "warning" : "success";
  const readinessToken = failed > 0 ? "FAILED" : warning > 0 ? "WARNING" : "PUBLISHED";

  return (
    <SummaryStrip aria-label="Quality summary">
      <SummaryItem>
        <SummaryLabel>게시 그래프 상태</SummaryLabel>
        <StatusBadge token={readinessToken} tone={readinessTone} />
        <SummaryMeta>{versionLabel(metrics.published_graph_version_ref)} · {formatDateTime(metrics.generated_at)}</SummaryMeta>
      </SummaryItem>
      <SummaryItem>
        <SummaryLabel>완전성 (Completeness)</SummaryLabel>
        {completeness ? <SummaryValue>{completeness}</SummaryValue> : <HanaBadge tone="muted">NOT_AVAILABLE</HanaBadge>}
      </SummaryItem>
      <SummaryItem>
        <SummaryLabel>일관성 (Consistency)</SummaryLabel>
        {consistency ? <SummaryValue>{consistency}</SummaryValue> : <HanaBadge tone="muted">NOT_AVAILABLE</HanaBadge>}
      </SummaryItem>
      <SummaryItem>
        <SummaryLabel>추적성 (Traceability)</SummaryLabel>
        {traceability ? <SummaryValue>{traceability}</SummaryValue> : <HanaBadge tone="muted">NOT_AVAILABLE</HanaBadge>}
      </SummaryItem>
      <SummaryItem>
        <SummaryLabel>검증 통과율 (Validation)</SummaryLabel>
        <SummaryMeta>통과 {passed} · 경고 {warning} · 실패 {failed}</SummaryMeta>
      </SummaryItem>
    </SummaryStrip>
  );
}


function LegacyQualitySummary({ summary }: { summary: QualitySummary }) {
  return (
    <LegacySummaryGrid aria-label="MVP3 quality summary">
      <HanaCard title="후보" description="후보 지표는 MVP3 회귀 확인과 MVP4 드릴다운 맥락을 위해 계속 표시됩니다.">
        <CardBody>
          <KeyValue>
            <dt>전체</dt>
            <dd>{summary.candidate_counts.total.value}</dd>
            <dt>근거 없음</dt>
            <dd>{summary.candidate_counts.missing_evidence.value}</dd>
          </KeyValue>
        </CardBody>
      </HanaCard>
      <HanaCard title="검증" description="검증 상태 수치는 고급 품질 그룹과 별도로 유지됩니다.">
        <CardBody>
          <KeyValue>
            <dt>통과</dt>
            <dd>{summary.validation_counts.passed.value}</dd>
            <dt>실패</dt>
            <dd>{summary.validation_counts.failed.value}</dd>
          </KeyValue>
        </CardBody>
      </HanaCard>
      <HanaCard title="검수" description="검수자 결과는 검수 인박스·워크벤치와 연결되어 유지됩니다.">
        <CardBody>
          <KeyValue>
            <dt>승인됨</dt>
            <dd>{summary.review_counts.approved.value}</dd>
            <dt>논의 필요</dt>
            <dd>{summary.review_counts.needs_discussion.value}</dd>
          </KeyValue>
        </CardBody>
      </HanaCard>
      <HanaCard title="게시" description="게시 비율은 MVP4 지표 그룹 옆에 계속 표시됩니다.">
        <CardBody>
          <strong>
            게시 비율 · {summary.rates.published_ratio.numerator}/{summary.rates.published_ratio.denominator}
          </strong>
          <Muted>
            게시된 후보 {summary.publish_counts.published.value}건 · 현재 그래프 v{summary.publish_counts.current_version ?? "-"}
          </Muted>
        </CardBody>
      </HanaCard>
    </LegacySummaryGrid>
  );
}

function MetricTrustContext({ metric }: { metric: QualityMetric }) {
  return (
    <TrustPanel aria-label={`${metric.label} recomputation context`}>
      <KeyValue>
        <dt>비율 맥락</dt>
        <dd>
          {metric.unit} · {valueLabel(metric.value, metric.rate)}
        </dd>
        <dt>분자</dt>
        <dd>{metric.formula.numerator}</dd>
        <dt>분모</dt>
        <dd>{metric.formula.denominator}</dd>
        <dt>계산식 ID</dt>
        <dd>{metric.formula.formula_id}</dd>
        <dt>드릴다운 대상</dt>
        <dd>{metric.formula.drilldown_target}</dd>
        <dt>게시 버전</dt>
        <dd>{versionLabel(metric.published_graph_version_ref)}</dd>
      </KeyValue>
    </TrustPanel>
  );
}

function FormulaMetadata({ metric }: { metric: QualityMetric }) {
  return (
    <Stack>
      <KeyValue>
        <dt>계산식 ID</dt>
        <dd>{metric.formula.formula_id}</dd>
        <dt>분자</dt>
        <dd>{metric.formula.numerator}</dd>
        <dt>분모</dt>
        <dd>{metric.formula.denominator}</dd>
        <dt>범위</dt>
        <dd>{metric.formula.scope}</dd>
        <dt>기간</dt>
        <dd>{metric.formula.time_window}</dd>
        <dt>세분화 기준</dt>
        <dd>{metric.formula.breakdown_dimension}</dd>
        <dt>드릴다운 대상</dt>
        <dd>{metric.formula.drilldown_target}</dd>
        <dt>게시 버전</dt>
        <dd>{versionLabel(metric.published_graph_version_ref)}</dd>
      </KeyValue>
      <Mvp4Panel>
        <strong>{metric.formula.description ?? "계산식 메타데이터"}</strong>
        <span>{metric.formula.notes ?? "지표 값은 MVP4 P0 기준 그룹별로 분리되어 있으며, 프론트엔드는 신뢰 맥락만 표시합니다."}</span>
      </Mvp4Panel>
    </Stack>
  );
}

function advancedMetricGroupTitle(label: string) {
  if (label === "Validation" || label === "Review") {
    return `${label} 지표`;
  }

  return label;
}

function drilldownPath(projectId: string, target: string) {
  if (target.includes("review")) {
    return `/projects/${projectId}/review`;
  }
  if (target.includes("search")) {
    return `/projects/${projectId}/search`;
  }
  return `/projects/${projectId}/published-graph`;
}

const SummaryStrip = styled.section`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
  box-shadow: ${({ theme }) => theme.shadow.soft};

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryItem = styled.div`
  display: grid;
  gap: 6px;
  align-content: start;
  min-width: 0;
`;

const SummaryLabel = styled.span`
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-transform: uppercase;
  overflow-wrap: anywhere;
`;

const SummaryValue = styled.strong`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
`;

const SummaryMeta = styled.span`
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  overflow-wrap: anywhere;
`;

const CollapseSection = styled.details`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};

  > summary {
    cursor: pointer;
    padding: ${({ theme }) => theme.spacing.md} 0;
    color: ${({ theme }) => theme.color.text};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;

const QualityContext = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const LegacySummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const MetricList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const MetricItem = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};

  strong {
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }

  span,
  small {
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const TrustPanel = styled.div`
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceMuted};
`;

const DrilldownLink = styled(Link)`
  justify-self: start;
  min-height: 30px;
  color: ${({ theme }) => theme.color.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const FormulaGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;
