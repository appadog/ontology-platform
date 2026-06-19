import type { ReactNode } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { useProject, useQualitySummary } from "../shared/api/queries";
import { QualityCountMetric, QualityRateMetric } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaCard } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { formatDateTime } from "../shared/lib/format";
import { CardBody, Mvp3ActionLink, Mvp3Workflow, Muted } from "./mvp3Shared";

export function QualityDashboardPage() {
  const { projectId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const summaryQuery = useQualitySummary(projectId);

  if (projectQuery.isLoading || summaryQuery.isLoading) {
    return <PageState kind="loading" title="Quality dashboard를 불러오는 중" description="Validation, review, publish metrics를 집계하고 있습니다." />;
  }

  if (projectQuery.isError || summaryQuery.isError || !projectQuery.data || !summaryQuery.data) {
    return (
      <PageState
        kind="error"
        title="Quality dashboard를 불러오지 못했습니다"
        description="Project metric scope를 다시 조회하세요."
        actionLabel="다시 시도"
        onAction={() => {
          void projectQuery.refetch();
          void summaryQuery.refetch();
        }}
      />
    );
  }

  const summary = summaryQuery.data;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Quality dashboard" },
        ]}
      />
      <PageHeader title="Quality Dashboard" description={`Generated ${formatDateTime(summary.generated_at)}`}>
        <Mvp3ActionLink to={`/projects/${projectId}/review`}>Review inbox</Mvp3ActionLink>
        <Mvp3ActionLink to={`/projects/${projectId}/published-graph`}>Published graph</Mvp3ActionLink>
      </PageHeader>
      <Mvp3Workflow current="Quality" action={<Mvp3ActionLink to={`/projects/${projectId}/publish`}>Publish queue</Mvp3ActionLink>} />
      <MetricSection>
        <MetricGroup title="Candidates">
          {renderCountMetric("Total", summary.candidate_counts.total, projectId)}
          {renderCountMetric("Entities", summary.candidate_counts.entity, projectId)}
          {renderCountMetric("Relations", summary.candidate_counts.relation, projectId)}
          {renderCountMetric("Property values", summary.candidate_counts.property_value, projectId)}
          {renderCountMetric("Missing evidence", summary.candidate_counts.missing_evidence, projectId)}
        </MetricGroup>
        <MetricGroup title="Validation">
          {renderCountMetric("Not validated", summary.validation_counts.not_validated, projectId)}
          {renderCountMetric("Passed", summary.validation_counts.passed, projectId)}
          {renderCountMetric("Warning", summary.validation_counts.warning, projectId)}
          {renderCountMetric("Failed", summary.validation_counts.failed, projectId)}
        </MetricGroup>
        <MetricGroup title="Review">
          {renderCountMetric("Pending", summary.review_counts.pending, projectId)}
          {renderCountMetric("Approved", summary.review_counts.approved, projectId)}
          {renderCountMetric("Modified", summary.review_counts.modified, projectId)}
          {renderCountMetric("Needs discussion", summary.review_counts.needs_discussion, projectId)}
          {renderCountMetric("Rejected", summary.review_counts.rejected, projectId)}
        </MetricGroup>
        <MetricGroup title="Publish">
          {renderCountMetric("Not published", summary.publish_counts.not_published, projectId)}
          {renderCountMetric("Published", summary.publish_counts.published, projectId)}
          {renderCountMetric("Rolled back", summary.publish_counts.rolled_back, projectId)}
          {renderCountMetric("Published entities", summary.publish_counts.published_entities, projectId)}
          {renderCountMetric("Published relations", summary.publish_counts.published_relations, projectId)}
          {renderCountMetric("Successful jobs", summary.publish_counts.publish_success, projectId)}
          {renderCountMetric("Failed jobs", summary.publish_counts.publish_failed, projectId)}
        </MetricGroup>
      </MetricSection>
      <HanaCard title="Rates">
        <RateGrid>
          {renderRateMetric("Approval rate", summary.rates.approval_rate, projectId)}
          {renderRateMetric("Rejection rate", summary.rates.rejection_rate, projectId)}
          {renderRateMetric("Modification rate", summary.rates.modification_rate, projectId)}
          {renderRateMetric("Validation failure rate", summary.rates.validation_failure_rate, projectId)}
          {renderRateMetric("Evidence missing rate", summary.rates.evidence_missing_rate, projectId)}
          {renderRateMetric("Published ratio", summary.rates.published_ratio, projectId)}
        </RateGrid>
      </HanaCard>
      <HanaCard title="Validation rule codes">
        <MetricGrid>
          {Object.entries(summary.validation_counts.by_rule_code).length > 0 ? (
            Object.entries(summary.validation_counts.by_rule_code).map(([ruleCode, metric]) => renderCountMetric(ruleCode, metric, projectId))
          ) : (
            <Muted>No rule-code counts reported.</Muted>
          )}
        </MetricGrid>
      </HanaCard>
      {summary.candidate_counts.total.value === 0 ? (
        <PageState kind="empty" title="No candidate metrics yet" description="Run extraction and review tasks before quality metrics appear." />
      ) : null}
      <HanaCard title="Read-only metric scope">
        <CardBody>
          <Muted>Ontology version {summary.ontology_version_id ?? "current project scope"} · typed summary groups are candidate, validation, review, publish, and rates.</Muted>
          <Muted>
            Current published version {summary.publish_counts.current_version ?? "none"} · {summary.publish_counts.current_version_id ?? "no snapshot id"}
          </Muted>
        </CardBody>
      </HanaCard>
    </>
  );
}

function MetricGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <HanaCard title={title}>
      <MetricGrid>{children}</MetricGrid>
    </HanaCard>
  );
}

function renderCountMetric(label: string, metric: QualityCountMetric, projectId: string) {
  return (
    <MetricBox key={label}>
      <strong>{metric.value}</strong>
      <span>{label}</span>
      {metric.drilldown ? <DrilldownLink to={drilldownPath(projectId, metric.drilldown.target)}>{metric.drilldown.label}</DrilldownLink> : null}
    </MetricBox>
  );
}

function renderRateMetric(label: string, metric: QualityRateMetric, projectId: string) {
  return (
    <MetricBox key={label}>
      <strong>{Math.round(metric.rate * 100)}%</strong>
      <span>
        {label} · {metric.numerator}/{metric.denominator}
      </span>
      {metric.drilldown ? <DrilldownLink to={drilldownPath(projectId, metric.drilldown.target)}>{metric.drilldown.label}</DrilldownLink> : null}
    </MetricBox>
  );
}

function drilldownPath(projectId: string, target: string) {
  if (target === "publish_jobs") {
    return `/projects/${projectId}/publish`;
  }
  if (target === "published_graph") {
    return `/projects/${projectId}/published-graph`;
  }
  return `/projects/${projectId}/review`;
}

const MetricSection = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 580px) {
    grid-template-columns: 1fr;
  }
`;

const RateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 580px) {
    grid-template-columns: 1fr;
  }
`;

const MetricBox = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};

  strong {
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const DrilldownLink = styled(Mvp3ActionLink)`
  justify-self: start;
  min-height: 32px;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;
