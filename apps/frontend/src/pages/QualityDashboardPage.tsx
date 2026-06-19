import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { useProject, useQualityMetrics, useQualitySummary } from "../shared/api/queries";
import { QualityMetric, QualitySummary } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaCard } from "../shared/ui/hana";
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
        title="Quality metrics are loading"
        description="Metric groups and formula metadata are being prepared for the selected project."
      />
    );
  }

  if (projectQuery.isError || summaryQuery.isError || metricsQuery.isError || !projectQuery.data || !summaryQuery.data || !metricsQuery.data) {
    return (
      <PageState
        kind="error"
        title="Quality metrics could not load"
        description="Keep the project selected and retry the metrics request."
        actionLabel="Retry"
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
          { label: "Projects", to: "/projects" },
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Quality dashboard" },
        ]}
      />
      <PageHeader title="Quality Dashboard" description={`${versionLabel(metrics.published_graph_version_ref)} · ${formatDateTime(metrics.generated_at)}`}>
        <PageActions>
          <HanaBadge tone="success">METRIC GROUPS</HanaBadge>
          <HanaBadge tone="muted">NO COMPOSITE SCORE</HanaBadge>
          <Mvp3ActionLink to={`/projects/${projectId}/published-graph`}>Published graph</Mvp3ActionLink>
          <Mvp3ActionLink to={`/projects/${projectId}/search`}>Search</Mvp3ActionLink>
        </PageActions>
      </PageHeader>

      <Mvp3Workflow current="Quality" />
      <LegacyQualitySummary summary={summaryQuery.data} />

      <QualityContext>
        <Mvp4StatePanel title="Project context">
          {projectQuery.data.name} stays in scope for every metric, drilldown, and version selector.
        </Mvp4StatePanel>
        <Mvp4StatePanel title="Published graph version context">
          {historicalMetric ? `A non-current row is visible through ${versionLabel(historicalMetric.published_graph_version_ref)}.` : versionLabel(metrics.published_graph_version_ref)}
        </Mvp4StatePanel>
        <Mvp4StatePanel title="Partial metric state">
          {partialMetric ? `${partialMetric.label} keeps formula and drilldown visible while one value is partial.` : "All fixture metrics include current values."}
        </Mvp4StatePanel>
      </QualityContext>

      {metrics.metric_groups.length === 0 ? (
        <PageState kind="empty" title="No quality metrics" description="Reset filters or publish graph facts before reading advanced quality metrics." />
      ) : (
        <Mvp4Grid>
          {metrics.metric_groups.map((group) => (
            <HanaCard key={group.group} title={advancedMetricGroupTitle(group.label)} description={group.description ?? "Explainable metric group"}>
              <MetricList>
                {group.metrics.map((metric) => (
                  <MetricItem key={metric.metric_id}>
                    <strong>{valueLabel(metric.value, metric.rate)}</strong>
                    <span>{metric.label}</span>
                    <small>{metric.trend === null || metric.trend === undefined ? "Trend unavailable" : `Trend ${pct(metric.trend)}`}</small>
                    {metric.published_graph_version_ref?.is_current === false ? <HanaBadge tone="warning">SELECTED VERSION</HanaBadge> : null}
                    <MetricTrustContext metric={metric} />
                    {metric.drilldown ? <DrilldownLink to={drilldownPath(projectId, metric.drilldown.target)}>{metric.drilldown.label ?? "Open drilldown"}</DrilldownLink> : null}
                  </MetricItem>
                ))}
              </MetricList>
            </HanaCard>
          ))}
        </Mvp4Grid>
      )}

      <FormulaGrid>
        <HanaCard title="Formula explainer" description={formulaMetric?.label ?? "Select a metric"}>
          <CardBody>{formulaMetric ? <FormulaMetadata metric={formulaMetric} /> : <Muted>No formula selected.</Muted>}</CardBody>
        </HanaCard>
        <HanaCard title="Drilldown rows" description="Breakdowns keep the active version and project context.">
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Label</th>
                  <th>Value</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {(formulaMetric?.breakdowns ?? []).map((row) => (
                  <tr key={`${row.dimension}-${row.label}`}>
                    <td>{row.dimension}</td>
                    <td>{row.label}</td>
                    <td>{row.value}</td>
                    <td>{row.rate === null || row.rate === undefined ? "Unavailable" : pct(row.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CompactTable>
        </HanaCard>
      </FormulaGrid>
    </>
  );
}

function LegacyQualitySummary({ summary }: { summary: QualitySummary }) {
  return (
    <LegacySummaryGrid aria-label="MVP3 quality summary">
      <HanaCard title="Candidates" description="Typed candidate metrics remain visible for MVP3 regression and MVP4 drilldown context.">
        <CardBody>
          <KeyValue>
            <dt>Total</dt>
            <dd>{summary.candidate_counts.total.value}</dd>
            <dt>Missing evidence</dt>
            <dd>{summary.candidate_counts.missing_evidence.value}</dd>
          </KeyValue>
        </CardBody>
      </HanaCard>
      <HanaCard title="Validation" description="Validation status counts stay separate from advanced quality groups.">
        <CardBody>
          <KeyValue>
            <dt>Passed</dt>
            <dd>{summary.validation_counts.passed.value}</dd>
            <dt>Failed</dt>
            <dd>{summary.validation_counts.failed.value}</dd>
          </KeyValue>
        </CardBody>
      </HanaCard>
      <HanaCard title="Review" description="Reviewer outcomes remain tied to the review inbox and workbench.">
        <CardBody>
          <KeyValue>
            <dt>Approved</dt>
            <dd>{summary.review_counts.approved.value}</dd>
            <dt>Needs discussion</dt>
            <dd>{summary.review_counts.needs_discussion.value}</dd>
          </KeyValue>
        </CardBody>
      </HanaCard>
      <HanaCard title="Publish" description="Published graph ratios are still visible beside MVP4 metric groups.">
        <CardBody>
          <strong>
            Published ratio · {summary.rates.published_ratio.numerator}/{summary.rates.published_ratio.denominator}
          </strong>
          <Muted>
            {summary.publish_counts.published.value} published candidates · current graph v{summary.publish_counts.current_version ?? "-"}
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
        <dt>Rate context</dt>
        <dd>
          {metric.unit} · {valueLabel(metric.value, metric.rate)}
        </dd>
        <dt>Numerator</dt>
        <dd>{metric.formula.numerator}</dd>
        <dt>Denominator</dt>
        <dd>{metric.formula.denominator}</dd>
        <dt>Formula ID</dt>
        <dd>{metric.formula.formula_id}</dd>
        <dt>Drilldown target</dt>
        <dd>{metric.formula.drilldown_target}</dd>
        <dt>Published version</dt>
        <dd>{versionLabel(metric.published_graph_version_ref)}</dd>
      </KeyValue>
    </TrustPanel>
  );
}

function FormulaMetadata({ metric }: { metric: QualityMetric }) {
  return (
    <Stack>
      <KeyValue>
        <dt>Formula ID</dt>
        <dd>{metric.formula.formula_id}</dd>
        <dt>Numerator</dt>
        <dd>{metric.formula.numerator}</dd>
        <dt>Denominator</dt>
        <dd>{metric.formula.denominator}</dd>
        <dt>Scope</dt>
        <dd>{metric.formula.scope}</dd>
        <dt>Window</dt>
        <dd>{metric.formula.time_window}</dd>
        <dt>Breakdown</dt>
        <dd>{metric.formula.breakdown_dimension}</dd>
        <dt>Drilldown target</dt>
        <dd>{metric.formula.drilldown_target}</dd>
        <dt>Published version</dt>
        <dd>{versionLabel(metric.published_graph_version_ref)}</dd>
      </KeyValue>
      <Mvp4Panel>
        <strong>{metric.formula.description ?? "Formula metadata"}</strong>
        <span>{metric.formula.notes ?? "Metric values remain separate by group for MVP4 P0; frontend displays trust context only."}</span>
      </Mvp4Panel>
    </Stack>
  );
}

function advancedMetricGroupTitle(label: string) {
  if (label === "Validation" || label === "Review") {
    return `${label} metrics`;
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
